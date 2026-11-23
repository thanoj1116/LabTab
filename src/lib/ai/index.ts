import { GoogleGenAI, Type, Schema } from "@google/genai";
import {
  ParsedRequest,
  ParsedRequestSchema,
  AllocationOption,
} from "@/schemas";
import {
  SYSTEM_PARSE_REQUEST,
  SYSTEM_EXPLAIN_ALLOCATION,
  SYSTEM_DRAFT_JUSTIFICATION,
} from "./prompts";
import { checkRateLimit } from "../rate-limiter";

// Initialize Google GenAI client lazily if API key is present
function getGenAIClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY?.trim();
  if (!apiKey || apiKey === "your_gemini_api_key_here") {
    return null;
  }
  return new GoogleGenAI({ apiKey });
}

// Timeout helper to guarantee fast deterministic responses
async function withTimeout<T>(promise: Promise<T>, timeoutMs: number = 6000): Promise<T> {
  let timer: NodeJS.Timeout;
  const timeoutPromise = new Promise<T>((_, reject) => {
    timer = setTimeout(() => reject(new Error("AI_TIMEOUT")), timeoutMs);
  });
  return Promise.race([promise, timeoutPromise]).finally(() => clearTimeout(timer));
}

/**
 * 1. parseRequest(text):
 * Converts free-text request to structured JSON with Zod validation and fallback.
 */
export async function parseRequest(rawText: string, clientIp: string = "default"): Promise<ParsedRequest> {
  // Input sanitization & boundary defense
  const sanitized = rawText.slice(0, 500).trim();

  // Rate limit check
  const rateLimit = checkRateLimit(`ai_parse_${clientIp}`, 15, 60000);
  if (!rateLimit.allowed) {
    return getFallbackParsedRequest(sanitized);
  }

  const ai = getGenAIClient();
  if (!ai) {
    return getFallbackParsedRequest(sanitized);
  }

  try {
    const prompt = `${SYSTEM_PARSE_REQUEST}\n\n<student_untrusted_input>\n${sanitized}\n</student_untrusted_input>`;

    const responseSchema: Schema = {
      type: Type.OBJECT,
      properties: {
        equipmentCategory: { type: Type.STRING },
        durationHours: { type: Type.INTEGER },
        deadline: { type: Type.STRING },
        projectTitle: { type: Type.STRING },
        projectSummary: { type: Type.STRING },
        urgency: {
          type: Type.STRING,
          enum: ["LOW", "MEDIUM", "HIGH", "CRITICAL"],
        },
      },
      required: [
        "equipmentCategory",
        "durationHours",
        "deadline",
        "projectTitle",
        "projectSummary",
        "urgency",
      ],
    };

    const callPromise = ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema,
        temperature: 0.1,
      },
    });

    const result = await withTimeout(callPromise, 6000);
    const textOutput = result.text;
    if (!textOutput) throw new Error("Empty AI response");

    const json = JSON.parse(textOutput);
    return ParsedRequestSchema.parse(json);
  } catch (error) {
    console.warn("Gemini parseRequest fallback invoked:", error instanceof Error ? error.message : error);
    return getFallbackParsedRequest(sanitized);
  }
}

/**
 * 2. explainAllocation(options, scores):
 * Explains in plain language why an allocation was recommended using deterministic metrics.
 */
export async function explainAllocation(
  option: AllocationOption,
  studentName: string,
  clientIp: string = "default"
): Promise<string> {
  const rateLimit = checkRateLimit(`ai_explain_${clientIp}`, 20, 60000);
  const ai = rateLimit.allowed ? getGenAIClient() : null;

  if (!ai) {
    return getFallbackExplanation(option);
  }

  try {
    const payload = JSON.stringify({
      optionType: option.type,
      equipment: option.equipmentName,
      department: option.department,
      score: option.score,
      factors: option.breakdown,
      studentName,
    });

    const prompt = `${SYSTEM_EXPLAIN_ALLOCATION}\n\nPayload:\n${payload}`;

    const callPromise = ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        temperature: 0.2,
      },
    });

    const result = await withTimeout(callPromise, 5000);
    const explanation = result.text?.trim();
    if (explanation && explanation.length > 20) {
      return explanation;
    }
    return getFallbackExplanation(option);
  } catch (error) {
    console.warn("Gemini explainAllocation fallback invoked:", error instanceof Error ? error.message : error);
    return getFallbackExplanation(option);
  }
}

/**
 * 3. draftJustification(project, equipment):
 * Generates a concise, formal justification for faculty review.
 */
export async function draftJustification(
  projectTitle: string,
  projectDescription: string,
  equipmentName: string,
  clientIp: string = "default"
): Promise<string> {
  const rateLimit = checkRateLimit(`ai_draft_${clientIp}`, 15, 60000);
  const ai = rateLimit.allowed ? getGenAIClient() : null;

  if (!ai) {
    return `Access to ${equipmentName} is essential for ${projectTitle} to validate project deliverables and complete scheduled experiments before deadline.`;
  }

  try {
    const prompt = `${SYSTEM_DRAFT_JUSTIFICATION}\n\nEquipment: ${equipmentName}\n<student_untrusted_input>\nTitle: ${projectTitle.slice(0, 120)}\nDescription: ${projectDescription.slice(0, 500)}\n</student_untrusted_input>`;

    const callPromise = ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        temperature: 0.2,
      },
    });

    const result = await withTimeout(callPromise, 5000);
    const justification = result.text?.trim();
    if (justification && justification.length > 30) {
      return justification;
    }
    return `Access to ${equipmentName} is required to conduct empirical testing and verify design objectives for ${projectTitle}.`;
  } catch (error) {
    console.warn("Gemini draftJustification fallback invoked:", error instanceof Error ? error.message : error);
    return `Access to ${equipmentName} is required to conduct empirical testing and verify design objectives for ${projectTitle}.`;
  }
}

// Deterministic Templated Fallbacks (guarantees zero downtime)
function getFallbackParsedRequest(text: string): ParsedRequest {
  const lower = text.toLowerCase();

  // Category detection heuristic
  let equipmentCategory = "Workstation";
  if (lower.includes("fpga") || lower.includes("zynq") || lower.includes("altera") || lower.includes("verilog")) {
    equipmentCategory = "FPGA";
  } else if (lower.includes("scope") || lower.includes("oscilloscope") || lower.includes("waveform") || lower.includes("analyzer")) {
    equipmentCategory = "Oscilloscope";
  } else if (lower.includes("3d print") || lower.includes("bambu") || lower.includes("stratasys") || lower.includes("filament")) {
    equipmentCategory = "3D Printer";
  } else if (lower.includes("jetson") || lower.includes("gpu") || lower.includes("rtx") || lower.includes("workstation")) {
    equipmentCategory = "Workstation";
  } else if (lower.includes("sdr") || lower.includes("hackrf") || lower.includes("sensor") || lower.includes("iot")) {
    equipmentCategory = "Sensor Kit";
  } else if (lower.includes("motor") || lower.includes("c2000") || lower.includes("microcontroller")) {
    equipmentCategory = "Microcontroller";
  }

  // Duration heuristic
  let durationHours = 3;
  const hoursMatch = lower.match(/(\d+)\s*(hour|hr|h\b)/);
  if (hoursMatch) {
    durationHours = Math.min(24, Math.max(1, parseInt(hoursMatch[1], 10)));
  } else if (lower.includes("full day") || lower.includes("whole day")) {
    durationHours = 8;
  }

  // Deadline heuristic
  const deadlineDate = new Date();
  deadlineDate.setDate(deadlineDate.getDate() + 3);
  deadlineDate.setHours(18, 0, 0, 0);

  return {
    equipmentCategory,
    durationHours,
    deadline: deadlineDate.toISOString(),
    projectTitle: "Laboratory Research & Verification Project",
    projectSummary: text.slice(0, 200),
    urgency: lower.includes("urgent") || lower.includes("asap") || lower.includes("deadline") ? "HIGH" : "MEDIUM",
  };
}

function getFallbackExplanation(option: AllocationOption): string {
  const { type, equipmentName, department, breakdown } = option;
  const { deadlineUrgency, fairness, projectNeed } = breakdown;

  if (type === "REQUESTED") {
    return `Recommended primary choice: ${equipmentName} is free during the requested window. High fairness metric (${(fairness * 100).toFixed(0)}%) and deadline score (${(deadlineUrgency * 100).toFixed(0)}%) support allocation.`;
  }
  if (type === "ALTERNATE") {
    return `Alternative slot recommended on ${equipmentName} to avoid existing lab conflicts while ensuring completion ahead of project deadline (Urgency score: ${(deadlineUrgency * 100).toFixed(0)}%).`;
  }
  return `Cross-department allocation recommended: ${equipmentName} in ${department} offers equivalent hardware capabilities and immediate slot feasibility (Match score: ${(projectNeed * 100).toFixed(0)}%).`;
}
