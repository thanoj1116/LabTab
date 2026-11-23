# LabLink — Campus Laboratory Resource-Sharing Platform

> **GenAI-Powered Campus Equipment Federation with Deterministic Fair Slot Allocation**  
> *Built for Solo Hackathon (MVP)*

---

## 🏛️ Executive Summary & Problem Alignment

Academic institutions suffer from severe laboratory resource fragmentation. Expensive development kits (e.g. Xilinx Zynq UltraScale+ FPGAs), AI compute nodes (Dual RTX 4090s, NVIDIA Jetson Orin), 3D printers, and RF spectrum analyzers sit idle in one department while students in adjacent faculties face project bottlenecks.

**LabLink** federates specialized laboratory equipment across 4 engineering departments (**ECE, CSE, Mechanical, EEE**). It empowers students with natural-language discovery and requests, while utilizing a **deterministic TypeScript scheduling engine** to guarantee fair, feasible slot allocations and eliminate scheduling conflicts.

---

## ⚡ Core Principle: Deterministic Engine Decides; Gemini Understands & Explains

```
┌────────────────────────────────────────────────────────┐
│                   Student Free-Text                    │
│    "Need an FPGA board tomorrow 10am-2pm for ECG"      │
└──────────────────────────┬─────────────────────────────┘
                           │
                           ▼
┌────────────────────────────────────────────────────────┐
│             Gemini 2.5 Flash (Server-Side)             │
│        Structured Extraction & Zod Schema Validation    │
│ { category: "FPGA", duration: 4, start: "...", ... }   │
└──────────────────────────┬─────────────────────────────┘
                           │
                           ▼
┌────────────────────────────────────────────────────────┐
│       DETERMINISTIC SCHEDULING ENGINE (TypeScript)     │
│   • Open Hours Check (08:00 - 20:00)                   │
│   • Overlap Detection & Quantity Constraints           │
│   • Fairness Scoring: 0.5*Urgency + 0.3*Fair + 0.2*Need│
│   • Feasible Option Ranking (Direct, Alt, Substitute)  │
│   • Race-Condition Transaction Double-Booking Guard    │
└──────────────────────────┬─────────────────────────────┘
                           │
                           ▼
┌────────────────────────────────────────────────────────┐
│            Gemini 2.5 Flash Plain-Language             │
│   "Why Option Recommended": Explains score breakdown   │
│   "Draft Justification": Formulates faculty proposal   │
└────────────────────────────────────────────────────────┘
```

- **Scheduling, conflict detection, and allocation** are computed in pure TypeScript. No hallucinatory or impossible calendar schedules can occur.
- **Gemini 2.5 Flash** (`@google/genai`) is restricted to server-side tasks:
  1. Parsing student free-text into structured JSON schema.
  2. Plain-language explanation of why a specific allocation was recommended.
  3. Drafting professional justifications for faculty review.
- **Zero Downtime Fallback**: If Gemini fails or times out (5-second deadline), templated deterministic explanations ensure the application never breaks.

---

## 🔐 Access Model: No Login Page, Still Secure

For AI Hackathon evaluators who must access all platform perspectives with **ONE CLICK**, LabLink provides a **Demo Role Switcher** rather than a cumbersome sign-in wall.

- **Evaluator One-Click Roles**:
  - **STUDENT**: Alex Chen (ECE) / Priya Sharma (CSE)
  - **FACULTY**: Prof. David Miller (ECE) / Prof. Sarah Jenkins (CSE)
  - **ADMIN**: Campus Lab Administration (Universal access)
- Clicking a role calls `POST /api/session` which validates the role with Zod and sets an `httpOnly`, `sameSite=strict` signed JWT cookie using `jose` (HS256, 8-hour expiry).
- **Middleware Guard**: `middleware.ts` enforces role boundaries on `/student/*`, `/faculty/*`, and `/admin/*`.
- **API Guard**: Every API route re-verifies session validity and permissions using `requireRole(["STUDENT" | "FACULTY" | "ADMIN"])`.
- **Server-Side Data Scoping (IDOR Prevention)**:
  - Students see **only** their own requests and bookings (`where: { studentId: user.userId }`).
  - Faculty see and approve **only** requests for their own department (`where: { equipment: { department: user.department } }`).
  - Admin has global campus audit access.

> **Production Note on SSO**:
> In a production campus deployment, `/api/session` would be swapped with university Single Sign-On (SAML 2.0 / Shibboleth / OAuth2 OIDC). The RBAC middleware, JWT verification, and API route security checks remain completely unchanged.

---

## 🛠️ Tech Stack

- **Framework**: Next.js 15 (App Router, Server Components & Route Handlers)
- **Language**: TypeScript (strict mode, zero `any`)
- **Database & ORM**: SQLite + Prisma ORM (with relations and compound indexes)
- **Validation**: Zod (100% coverage for API inputs & AI outputs)
- **AI Engine**: `@google/genai` (gemini-2.5-flash) with structured JSON schema
- **Security**: `jose` (HS256 signed JWT cookies), strict CSP headers, in-memory rate-limiter
- **Styling & UI**: Tailwind CSS, Lucide React icons
- **Analytics**: Recharts (department utilization & booking density)
- **Testing**: Vitest (pure unit tests & database transaction guards)

---

## 🚀 Quick Start Guide (Definition of Done)

From a clean clone:

```bash
# 1. Install dependencies
npm install

# 2. Push SQLite schema & generate Prisma Client
npx prisma generate
npx prisma db push

# 3. Seed pre-existing bookings, users & the conflict scenario
npm run seed

# 4. Run Vitest scheduler unit tests
npm test

# 5. Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🧪 Deterministic Fairness Scoring Formula

When two students request the same scarce resource:

$$\text{Score} = 0.5 \times \text{Urgency} + 0.3 \times \text{Fairness} + 0.2 \times \text{ProjectNeed}$$

1. **Deadline Urgency ($w = 0.5$)**: Normalized 0–1 score prioritizing projects with impending submission deadlines.
2. **Historical Fairness ($w = 0.3$)**: Normalized 0–1 score rewarding students with fewer prior confirmed bookings (anti-monopoly protection).
3. **Project Need ($w = 0.2$)**: Structured score derived from equipment capability match and core project requirements.

---

## 🎬 2-Minute Evaluator Demo Script

### Step 1: Discover Equipment Across Departments
1. Navigate to `/` and click **"Enter as Student"** (Alex Chen).
2. Browse the **Federated Equipment Catalog** at `/student/discover`.
3. Filter by **ECE**, **CSE**, or **Mechanical**; notice scarce 1-unit items (e.g. Xilinx Zynq FPGA, Jetson Orin) vs multi-unit equipment.
4. Click **"View Schedule"** on any item to view booked vs open slots.

### Step 2: Make a Smart Natural-Language Request
1. Click **"Smart Request"** in the top navigation.
2. Click the preset: **"Compete for Scarce FPGA (Conflict Demo)"**.
3. Click **"Parse Free-Text to Structured Form"** — watch Gemini 2.5 Flash parse the text into structured category, duration, start time, and project title.
4. Review the auto-generated **Faculty Justification**.

### Step 3: Run Deterministic Conflict Resolution
1. Click **"Compute Fair Feasible Allocations"**.
2. **Conflict Resolution Banner Triggers!** Alex Chen already has a confirmed booking for tomorrow 10:00–14:00 on the single Xilinx FPGA.
3. The engine automatically outputs the **Top 3 Feasible Options**:
   - **Option 1 (Alternate)**: Next available open slot on the Xilinx FPGA before the deadline.
   - **Option 2 (Cross-Dept Substitute)**: Terasic DE10 Altera FPGA in the **CSE** Department with compatible specs and immediate slot availability!
4. Notice the **Multi-Factor Score Breakdown** (Urgency, Fairness, Need) and **Gemini's plain-language "Why" explanation**.
5. Select an option and click **"Submit Request for Faculty Approval"**.

### Step 4: One-Click Switch to Faculty Review
1. In the top navbar, open the **"Demo mode: Student ▾"** badge and click **"Faculty Reviewer"** (Prof. David Miller - ECE).
2. You are immediately routed to `/faculty/approvals` (guarded by RBAC).
3. Review the pending request, inspect the student's project justification and computed priority.
4. Click **"Approve & Confirm Booking"** — an atomic database transaction re-checks availability and confirms the booking.

### Step 5: One-Click Switch to Campus Admin
1. Open the navbar badge and select **"Lab Admin"**.
2. You are navigated to `/admin/dashboard`.
3. Inspect the **Recharts Department Utilization** bar chart showing inventory vs active bookings across ECE, CSE, Mechanical, and EEE.
4. Observe the **Under-Utilized / Idle Gear** widget identifying resources with 0 active bookings for campus load redistribution.
5. Review the **Reservation Audit Log**.

---

## 🛡️ Security Architecture & Protections

- **Strict Prompt Injection Defense**: Untrusted user strings are bounded between `<student_untrusted_input>` delimiters, capped at 500 characters, with system instructions explicitly forbidding directive overrides.
- **Zod Validation Everywhere**: All incoming request bodies and AI model outputs are parsed through Zod schemas before database interaction or client rendering.
- **IDOR Protection**: Database queries strictly filter by session `userId` and `department`. No user can inspect or modify unauthorized records by manipulating IDs.
- **Race Condition Guard**: Booking approvals execute in a serializable Prisma `$transaction` that queries for conflicting bookings at the moment of approval. If two faculty members approve conflicting requests concurrently, the second transaction is safely rolled back.
- **Security Headers**: Configured in `next.config.ts` including `Content-Security-Policy`, `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, and `Referrer-Policy: strict-origin-when-cross-origin`.
- **Zero Exposed Secrets**: Environment variables (`GEMINI_API_KEY`, `SESSION_SECRET`) are server-only and excluded from version control.

---

## 📊 Test Verification

Unit tests verify the deterministic engine:

```bash
npm test
```

Results:
```
 ✓ tests/scheduler.test.ts (7 tests)
   ✓ enforces equipment open hours (08:00 to 20:00)
   ✓ accurately detects overlapping bookings and respects quantity
   ✓ ignores cancelled bookings when calculating availability
   ✓ strictly enforces deadlines when finding free slots
   ✓ calculates multi-factor priority scores and breaks ties fairly
   ✓ recommends top-3 feasible options including alternate slot and cross-department substitute
   ✓ database transaction guard prevents double booking race conditions
```
