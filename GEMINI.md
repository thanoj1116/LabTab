# GEMINI.md — Project Specification: LabLink

## Executive Summary
LabLink is a GenAI-powered campus laboratory resource-sharing platform that helps students discover and access specialised equipment, development kits, and laboratory workstations across academic departments (ECE, CSE, Mechanical, EEE).

## Architecture & Guiding Principle
**"The DETERMINISTIC ENGINE decides; GEMINI understands and explains."**
- Resource allocation, free slot finding, conflict detection, and scoring are strictly computed in deterministic TypeScript.
- Gemini 2.5 Flash (`@google/genai`) is server-side only, behind rate-limiting and timeouts, with Zod structured output validation.
- Gemini is used solely for:
  1. Parsing student free-text requests into structured constraints
  2. Plain-language explanation of fair allocation decisions
  3. Drafting professional project justifications for faculty review
- Safe fallback: If AI fails or times out, the deterministic engine proceeds without interruption.

## Tech Stack
- **Framework**: Next.js 15 (App Router, React 19) in TypeScript strict mode
- **Database**: SQLite via Prisma ORM with proper relational indexing
- **Security & Auth**: Jose signed JWT session cookies, RBAC middleware, server-side data scoping (`requireRole`), CSP & security headers
- **Validation**: Zod for all API inputs and AI outputs
- **AI**: `@google/genai` (gemini-2.5-flash) with JSON schema structured output
- **UI & Styling**: Tailwind CSS, Lucide icons, Recharts for utilization analytics
- **Testing**: Vitest for unit testing scheduling logic and double-booking race condition prevention
