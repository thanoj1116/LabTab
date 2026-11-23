export interface EquipmentItem {
  id: string;
  name: string;
  department: string;
  category: string;
  specs: string; // JSON string or text specs
  quantity: number;
  location: string;
  openHoursStart: string; // "08:00"
  openHoursEnd: string; // "20:00"
  isActive: boolean;
}

export interface ExistingBooking {
  id: string;
  equipmentId: string;
  start: Date;
  end: Date;
  status: string; // "CONFIRMED" | "CANCELLED"
}

export interface TimeSlot {
  start: Date;
  end: Date;
}

export interface SchedulingRequestInput {
  equipmentId: string;
  category?: string;
  durationHours: number;
  deadline: Date;
  preferredStart: Date;
  studentId: string;
  studentRecentBookingCount?: number;
  urgencyLevel?: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  isCoreRequirement?: boolean;
}

export interface ScoreBreakdown {
  deadlineUrgency: number; // 0 to 1
  fairness: number;        // 0 to 1
  projectNeed: number;     // 0 to 1
  totalScore: number;      // 0 to 1
}

export interface AllocationCandidate {
  id: string;
  type: "REQUESTED" | "ALTERNATE" | "SUBSTITUTE";
  equipment: EquipmentItem;
  slot: TimeSlot;
  score: number;
  breakdown: ScoreBreakdown;
  feasible: boolean;
  reason?: string;
}
