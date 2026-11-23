import { z } from "zod";

export const RoleEnum = z.enum(["STUDENT", "FACULTY", "ADMIN"]);
export type Role = z.infer<typeof RoleEnum>;

// Session Request Schema
export const SessionLoginSchema = z.object({
  role: RoleEnum,
});

// Equipment Query Filter Schema
export const EquipmentFilterSchema = z.object({
  department: z.string().optional(),
  category: z.string().optional(),
  search: z.string().max(100).optional(),
});

// AI Request Parsing Schema (for both input text & structured output)
export const NaturalLanguageRequestSchema = z.object({
  text: z.string().min(10).max(500),
});

export const ParsedRequestSchema = z.object({
  equipmentCategory: z.string(),
  durationHours: z.number().int().min(1).max(72),
  deadline: z.string(), // ISO string date
  projectTitle: z.string().min(3).max(100),
  projectSummary: z.string().min(5).max(300),
  urgency: z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]),
});

export type ParsedRequest = z.infer<typeof ParsedRequestSchema>;

// Allocation Option Schema
export const AllocationOptionSchema = z.object({
  id: z.string(),
  type: z.enum(["REQUESTED", "ALTERNATE", "SUBSTITUTE"]),
  equipmentId: z.string(),
  equipmentName: z.string(),
  department: z.string(),
  slotStart: z.string(), // ISO string
  slotEnd: z.string(), // ISO string
  score: z.number(),
  breakdown: z.object({
    deadlineUrgency: z.number(),
    fairness: z.number(),
    projectNeed: z.number(),
  }),
  explanation: z.string().optional(),
});

export type AllocationOption = z.infer<typeof AllocationOptionSchema>;

// Create Request Schema
export const CreateRequestSchema = z.object({
  equipmentId: z.string().min(1),
  projectTitle: z.string().min(3).max(120),
  projectDescription: z.string().min(10).max(1000),
  justification: z.string().min(10).max(1000),
  deadline: z.string().datetime(),
  durationHours: z.number().int().min(1).max(48),
  preferredStart: z.string().datetime(),
  priorityScore: z.number().min(0).max(1).default(0.5),
});

// Faculty Approval Action Schema
export const FacultyDecisionSchema = z.object({
  requestId: z.string().min(1),
  decision: z.enum(["APPROVED", "REJECTED"]),
  reason: z.string().max(500).optional(),
});

// Gemini Justification Prompt Schema
export const DraftJustificationSchema = z.object({
  projectTitle: z.string().min(3).max(120),
  projectDescription: z.string().min(10).max(1000),
  equipmentName: z.string().min(2).max(100),
  deadline: z.string(),
});
