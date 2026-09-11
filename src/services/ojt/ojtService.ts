import { db } from '@/lib/indexeddb/db';
import { supabase } from '@/lib/supabase/client';
import { OjtStudent, OjtAttendanceRecord, OjtAttendanceStatus, OjtDailyStats } from '@/types/ojt';

export class OjtService {
  // ─── Attendance Rules & Calculation Helpers ─────────────────────────────────
  
  /**
   * Check if a time-in is late (After 9:30 AM)
   */
  static isTimeInLate(timeInDate: Date): boolean {
    const hours = timeInDate.getHours();
    const minutes = timeInDate.getMinutes();
    // Late threshold is 9:30 AM
    return hours > 9 || (hours === 9 && minutes > 30);
  }

  /**
   * Calculate detailed hours breakdown (Regular, Overtime, Total) and status
   */
  static calculateHours(
    timeInIso: string,
    timeOutIso?: string,
    isHalfDay: boolean = false,
    allowOvertime: boolean = false
  ): {
    regularHours: number;
    overtimeHours: number;
    totalHoursWorked: number;
    isLate: boolean;
    isOvertime: boolean;
    isAutoTimedOut: boolean;
    status: OjtAttendanceStatus;
  } {
    const timeInDate = new Date(timeInIso);
    const isLate = this.isTimeInLate(timeInDate);

    if (!timeOutIso) {
      return {
        regularHours: 0,
        overtimeHours: 0,
        totalHoursWorked: 0,
        isLate,
        isOvertime: false,
        isAutoTimedOut: false,
        status: isLate ? 'Late' : 'On-Time',
      };
    }

    const timeOutDate = new Date(timeOutIso);
    let diffMs = timeOutDate.getTime() - timeInDate.getTime();

    // Check if auto timed-out at max 10 hours limit or 7:00 PM
    const maxAllowedMs = allowOvertime ? 10 * 3600 * 1000 : 9 * 3600 * 1000; // 9h includes 1h lunch
    let isAutoTimedOut = false;
    if (diffMs > maxAllowedMs) {
      diffMs = maxAllowedMs;
      isAutoTimedOut = true;
    }

    // Subtract 1 hour unpaid lunch break if worked > 5 hours
    let totalMinutes = Math.floor(diffMs / (1000 * 60));
    if (totalMinutes > 300) {
      totalMinutes -= 60; // 1 hr break
    }

    const totalHoursRaw = Math.max(0, totalMinutes / 60);

    let regularHours = 0;
    let overtimeHours = 0;

    if (isHalfDay) {
      regularHours = Math.min(totalHoursRaw, 4.0);
      overtimeHours = 0;
    } else {
      regularHours = Math.min(totalHoursRaw, 8.0);
      if (allowOvertime && totalHoursRaw > 8.0) {
        overtimeHours = Math.min(totalHoursRaw - 8.0, 2.0); // max 2 hrs OT
      }
    }

    const totalHoursWorked = Math.round((regularHours + overtimeHours) * 100) / 100;
    const isOvertime = overtimeHours > 0;

    let status: OjtAttendanceStatus = 'Regular';
    if (isAutoTimedOut) {
      status = 'Auto-Timed-Out';
    } else if (isHalfDay) {
      status = 'Half-Day';
    } else if (isOvertime) {
      status = 'Overtime';
    } else if (isLate) {
      status = 'Late';
    } else {
      status = 'On-Time';
    }

    return {
      regularHours: Math.round(regularHours * 100) / 100,
      overtimeHours: Math.round(overtimeHours * 100) / 100,
      totalHoursWorked,
      isLate,
      isOvertime,
      isAutoTimedOut,
      status,
    };
  }

  // ─── Student Operations (CRUD) ─────────────────────────────────────────────

  static async registerStudent(studentData: Omit<OjtStudent, 'id' | 'completedHours' | 'remainingHours' | 'status' | 'createdAt'>): Promise<OjtStudent> {
    const isOnline = navigator.onLine;
    const id = crypto.randomUUID();
    const now = new Date().toISOString();

    const newStudent: OjtStudent = {
      ...studentData,
      id,
      name: `${studentData.firstName} ${studentData.lastName}`,
      completedHours: 0,
      remainingHours: studentData.requiredHours,
      status: 'active',
      createdAt: now,
    };

    // 1. Save to local Dexie IndexedDB
    await db.ojtStudentsCache.add(newStudent);

    // Also add to auth table in Dexie for offline login
    try {
      await db.ojtStudentsCache.put(newStudent);
    } catch (e) {
      console.warn('Dexie ojt cache warning:', e);
    }

    // 2. Sync to Supabase if online
    if (isOnline) {
      try {
        const { error } = await supabase.from('ojt_students').insert({
          id: newStudent.id,
          first_name: newStudent.firstName,
          last_name: newStudent.lastName,
          name: newStudent.name,
          email: newStudent.email,
          phone: newStudent.phone,
          address: newStudent.address,
          school: newStudent.school,
          required_hours: newStudent.requiredHours,
          required_hours_per_day: newStudent.requiredHoursPerDay,
          completed_hours: 0,
          remaining_hours: newStudent.requiredHours,
          password_hash: newStudent.passwordHash,
          status: newStudent.status,
          created_at: newStudent.createdAt,
        });
        if (error) console.warn('Supabase ojt_students insert warning:', error.message);
      } catch (err) {
        console.warn('Supabase offline or table missing, saved locally:', err);
      }
    }

    return newStudent;
  }

  static async getAllStudents(): Promise<OjtStudent[]> {
    const isOnline = navigator.onLine;

    // Try fetching from Supabase if online
    if (isOnline) {
      try {
        const { data, error } = await supabase.from('ojt_students').select('*').order('created_at', { ascending: false });
        if (!error && data && data.length > 0) {
          const mapped: OjtStudent[] = data.map((s) => ({
            id: s.id,
            firstName: s.first_name || s.name?.split(' ')[0] || '',
            lastName: s.last_name || s.name?.split(' ')[1] || '',
            name: s.name || `${s.first_name} ${s.last_name}`,
            email: s.email,
            phone: s.phone || '',
            address: s.address || '',
            school: s.school || 'Unspecified School',
            requiredHours: s.required_hours || 480,
            requiredHoursPerDay: s.required_hours_per_day || 8,
            completedHours: s.completed_hours || 0,
            remainingHours: Math.max(0, (s.required_hours || 480) - (s.completed_hours || 0)),
            passwordHash: s.password_hash || s.pin_hash || '123456',
            status: s.status || 'active',
            createdAt: s.created_at || new Date().toISOString(),
          }));

          // Cache in Dexie
          await db.ojtStudentsCache.bulkPut(mapped);
          return mapped;
        }
      } catch (e) {
        console.warn('Supabase ojt fetch warning, falling back to local Dexie cache:', e);
      }
    }

    // Fallback to local Dexie IndexedDB
    return await db.ojtStudentsCache.toArray();
  }

  static async getStudentById(id: string): Promise<OjtStudent | null> {
    const students = await this.getAllStudents();
    return students.find((s) => s.id === id) || null;
  }

  static async updateStudent(id: string, updates: Partial<OjtStudent>): Promise<boolean> {
    const student = await this.getStudentById(id);
    if (!student) return false;

    const updated: OjtStudent = {
      ...student,
      ...updates,
      name: updates.firstName || updates.lastName ? `${updates.firstName || student.firstName} ${updates.lastName || student.lastName}` : student.name,
      remainingHours: updates.requiredHours !== undefined ? Math.max(0, updates.requiredHours - student.completedHours) : student.remainingHours,
      updatedAt: new Date().toISOString(),
    };

    // 1. Update local Dexie
    await db.ojtStudentsCache.put(updated);

    // 2. Update Supabase if online
    if (navigator.onLine) {
      try {
        await supabase
          .from('ojt_students')
          .update({
            first_name: updated.firstName,
            last_name: updated.lastName,
            name: updated.name,
            email: updated.email,
            phone: updated.phone,
            address: updated.address,
            school: updated.school,
            required_hours: updated.requiredHours,
            required_hours_per_day: updated.requiredHoursPerDay,
            password_hash: updated.passwordHash,
            status: updated.status,
          })
          .eq('id', id);
      } catch (e) {
        console.warn('Supabase update student warning:', e);
      }
    }

    return true;
  }

  static async deleteStudent(id: string): Promise<boolean> {
    await db.ojtStudentsCache.delete(id);
    await db.ojtAttendanceQueue.where('studentId').equals(id).delete();

    if (navigator.onLine) {
      try {
        await supabase.from('ojt_students').delete().eq('id', id);
        await supabase.from('ojt_attendance').delete().eq('student_id', id);
      } catch (e) {
        console.warn('Supabase delete student warning:', e);
      }
    }

    return true;
  }

  // ─── Attendance Operations (Time-In / Time-Out / Half-Day / Overtime) ───────

  static async recordTimeIn(
    studentId: string,
    isHalfDay: boolean = false,
    notes?: string
  ): Promise<OjtAttendanceRecord> {
    const student = await this.getStudentById(studentId);
    if (!student) throw new Error('OJT Student record not found');

    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];

    // Check if already timed-in today without timing out
    const allLogs = await db.ojtAttendanceQueue.toArray();
    const existingToday = allLogs.find((r) => r.studentId === studentId && r.date === todayStr && !r.timeOut);

    if (existingToday) {
      throw new Error('You are already Timed In today. Please Time Out first.');
    }

    const isLate = this.isTimeInLate(now);
    const newRecord: OjtAttendanceRecord = {
      id: crypto.randomUUID(),
      studentId: student.id,
      studentName: student.name,
      school: student.school,
      date: todayStr,
      timeIn: now.toISOString(),
      type: isHalfDay ? 'HALF_DAY' : 'TIME_IN',
      isLate,
      isHalfDay,
      isOvertime: false,
      isAutoTimedOut: false,
      regularHours: 0,
      overtimeHours: 0,
      totalHoursWorked: 0,
      status: isHalfDay ? 'Half-Day' : isLate ? 'Late' : 'On-Time',
      notes: notes || '',
      createdOffline: !navigator.onLine,
      syncStatus: 'pending',
    };

    await db.ojtAttendanceQueue.add(newRecord);

    // Sync to Supabase if online
    if (navigator.onLine) {
      try {
        await supabase.from('ojt_attendance').insert({
          id: newRecord.id,
          student_id: newRecord.studentId,
          student_name: newRecord.studentName,
          school: newRecord.school,
          date: newRecord.date,
          time_in: newRecord.timeIn,
          type: newRecord.type,
          is_late: newRecord.isLate,
          is_half_day: newRecord.isHalfDay,
          status: newRecord.status,
          created_offline: newRecord.createdOffline,
        });
      } catch (e) {
        console.warn('Supabase record time-in warning:', e);
      }
    }

    return newRecord;
  }

  static async recordTimeOut(
    studentId: string,
    allowOvertime: boolean = false,
    notes?: string
  ): Promise<OjtAttendanceRecord> {
    const student = await this.getStudentById(studentId);
    if (!student) throw new Error('OJT Student record not found');

    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];

    const allLogs = await db.ojtAttendanceQueue.toArray();
    const activeLog = allLogs.find((r) => r.studentId === studentId && !r.timeOut);

    if (!activeLog) {
      throw new Error('No active Time-In session found. Please Time In first.');
    }

    const calc = this.calculateHours(activeLog.timeIn, now.toISOString(), activeLog.isHalfDay, allowOvertime);

    const updatedRecord: OjtAttendanceRecord = {
      ...activeLog,
      timeOut: now.toISOString(),
      type: 'TIME_OUT',
      regularHours: calc.regularHours,
      overtimeHours: calc.overtimeHours,
      totalHoursWorked: calc.totalHoursWorked,
      isOvertime: calc.isOvertime,
      isAutoTimedOut: calc.isAutoTimedOut,
      status: calc.status,
      notes: notes || activeLog.notes,
    };

    await db.ojtAttendanceQueue.put(updatedRecord);

    // Recalculate student completed & remaining hours
    await this.recalculateStudentHours(studentId);

    // Sync to Supabase if online
    if (navigator.onLine) {
      try {
        await supabase
          .from('ojt_attendance')
          .update({
            time_out: updatedRecord.timeOut,
            type: 'TIME_OUT',
            regular_hours: updatedRecord.regularHours,
            overtime_hours: updatedRecord.overtimeHours,
            total_hours_worked: updatedRecord.totalHoursWorked,
            is_overtime: updatedRecord.isOvertime,
            is_auto_timed_out: updatedRecord.isAutoTimedOut,
            status: updatedRecord.status,
          })
          .eq('id', updatedRecord.id);
      } catch (e) {
        console.warn('Supabase record time-out warning:', e);
      }
    }

    return updatedRecord;
  }

  static async getStudentAttendanceLogs(studentId: string): Promise<OjtAttendanceRecord[]> {
    const isOnline = navigator.onLine;

    if (isOnline) {
      try {
        const { data, error } = await supabase
          .from('ojt_attendance')
          .select('*')
          .eq('student_id', studentId)
          .order('time_in', { ascending: false });

        if (!error && data && data.length > 0) {
          const mapped: OjtAttendanceRecord[] = data.map((r) => ({
            id: r.id,
            studentId: r.student_id,
            studentName: r.student_name,
            school: r.school,
            date: r.date,
            timeIn: r.time_in,
            timeOut: r.time_out,
            type: r.type,
            isLate: r.is_late || false,
            isHalfDay: r.is_half_day || false,
            isOvertime: r.is_overtime || false,
            isAutoTimedOut: r.is_auto_timed_out || false,
            regularHours: r.regular_hours || 0,
            overtimeHours: r.overtime_hours || 0,
            totalHoursWorked: r.total_hours_worked || 0,
            status: r.status || 'Regular',
            notes: r.notes || '',
            createdOffline: r.created_offline || false,
            syncStatus: 'synced',
          }));

          await db.ojtAttendanceQueue.bulkPut(mapped);
          return mapped;
        }
      } catch (e) {
        console.warn('Supabase student logs fetch warning:', e);
      }
    }

    const localLogs = await db.ojtAttendanceQueue.filter((r) => r.studentId === studentId).toArray();
    return localLogs.sort((a, b) => new Date(b.timeIn).getTime() - new Date(a.timeIn).getTime());
  }

  static async getAllAttendanceLogs(): Promise<OjtAttendanceRecord[]> {
    const isOnline = navigator.onLine;

    if (isOnline) {
      try {
        const { data, error } = await supabase
          .from('ojt_attendance')
          .select('*')
          .order('time_in', { ascending: false });

        if (!error && data && data.length > 0) {
          const mapped: OjtAttendanceRecord[] = data.map((r) => ({
            id: r.id,
            studentId: r.student_id,
            studentName: r.student_name,
            school: r.school,
            date: r.date,
            timeIn: r.time_in,
            timeOut: r.time_out,
            type: r.type,
            isLate: r.is_late || false,
            isHalfDay: r.is_half_day || false,
            isOvertime: r.is_overtime || false,
            isAutoTimedOut: r.is_auto_timed_out || false,
            regularHours: r.regular_hours || 0,
            overtimeHours: r.overtime_hours || 0,
            totalHoursWorked: r.total_hours_worked || 0,
            status: r.status || 'Regular',
            notes: r.notes || '',
            createdOffline: r.created_offline || false,
            syncStatus: 'synced',
          }));

          await db.ojtAttendanceQueue.bulkPut(mapped);
          return mapped;
        }
      } catch (e) {
        console.warn('Supabase all logs fetch warning:', e);
      }
    }

    const localLogs = await db.ojtAttendanceQueue.toArray();
    return localLogs.sort((a, b) => new Date(b.timeIn).getTime() - new Date(a.timeIn).getTime());
  }

  static async recalculateStudentHours(studentId: string): Promise<number> {
    const logs = await this.getStudentAttendanceLogs(studentId);
    const totalCompleted = logs.reduce((sum, r) => sum + (r.totalHoursWorked || 0), 0);
    const roundedCompleted = Math.round(totalCompleted * 100) / 100;

    const student = await this.getStudentById(studentId);
    if (student) {
      const remaining = Math.max(0, student.requiredHours - roundedCompleted);
      await this.updateStudent(studentId, {
        completedHours: roundedCompleted,
        remainingHours: remaining,
        status: remaining <= 0 ? 'completed' : 'active',
      });
    }

    return roundedCompleted;
  }

  static async getStudentDailyStats(studentId: string): Promise<OjtDailyStats> {
    const student = await this.getStudentById(studentId);
    const logs = await this.getStudentAttendanceLogs(studentId);
    const todayStr = new Date().toISOString().split('T')[0];

    const todayRecord = logs.find((r) => r.studentId === studentId && r.date === todayStr) || null;
    const completedHours = logs.reduce((sum, r) => sum + (r.totalHoursWorked || 0), 0);
    const requiredHours = student?.requiredHours || 480;
    const remainingHours = Math.max(0, requiredHours - completedHours);
    const progressPercentage = Math.min(100, Math.round((completedHours / requiredHours) * 100));

    const isCurrentlyTimedIn = !!(todayRecord && !todayRecord.timeOut);

    return {
      todayRecord,
      completedHours: Math.round(completedHours * 100) / 100,
      remainingHours: Math.round(remainingHours * 100) / 100,
      progressPercentage,
      isCurrentlyTimedIn,
      isOvertimeEligible: isCurrentlyTimedIn,
    };
  }
}
