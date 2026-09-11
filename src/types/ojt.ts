export type OjtAttendanceType = 'TIME_IN' | 'TIME_OUT' | 'HALF_DAY';

export type OjtAttendanceStatus = 
  | 'On-Time' 
  | 'Late' 
  | 'Half-Day' 
  | 'Overtime' 
  | 'Regular' 
  | 'Completed' 
  | 'Auto-Timed-Out';

export interface OjtStudent {
  id: string;
  firstName: string;
  lastName: string;
  name: string; // Full name: `${firstName} ${lastName}`
  email: string;
  phone: string;
  address: string;
  school: string;
  requiredHours: number; // e.g. 480, 500, 300 total hours required
  requiredHoursPerDay: number; // default: 8
  completedHours: number; // calculated sum of all completed regular + OT hours
  remainingHours: number; // max(0, requiredHours - completedHours)
  pinHash: string; // 4-digit PIN
  status: 'active' | 'completed' | 'inactive';
  createdAt: string;
  updatedAt?: string;
}

export interface OjtAttendanceRecord {
  id: string;
  studentId: string;
  studentName: string;
  school: string;
  date: string; // YYYY-MM-DD
  timeIn: string; // ISO string
  timeOut?: string; // ISO string
  type: OjtAttendanceType;
  isLate: boolean;
  isHalfDay: boolean;
  isOvertime: boolean;
  isAutoTimedOut: boolean;
  regularHours: number; // max 8.0 (or 4.0 for half-day)
  overtimeHours: number; // max 2.0
  totalHoursWorked: number; // regularHours + overtimeHours
  status: OjtAttendanceStatus;
  notes?: string;
  locationName?: string;
  createdOffline: boolean;
  syncStatus: 'pending' | 'synced' | 'failed';
}

export interface OjtDailyStats {
  todayRecord: OjtAttendanceRecord | null;
  completedHours: number;
  remainingHours: number;
  progressPercentage: number;
  isCurrentlyTimedIn: boolean;
  isOvertimeEligible: boolean;
}
