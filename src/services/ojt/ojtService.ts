import { db } from '@/lib/indexeddb/db';
import { supabase } from '@/lib/supabase/client';
import { OjtStudent, OjtAttendanceRecord, OjtAttendanceStatus, OjtDailyStats } from '@/types/ojt';

// Philippines has no DST — a fixed UTC+8 offset is exact.
const MANILA_OFFSET_MS = 8 * 60 * 60 * 1000;
const HOUR_MS = 60 * 60 * 1000;

/** Max wall-clock session length (includes the 1h unpaid lunch for full days). */
const REGULAR_SESSION_HOURS = 9; // 8h work + 1h lunch
const OVERTIME_SESSION_HOURS = 11; // 8h work + 2h OT + 1h lunch
const HALF_DAY_SESSION_HOURS = 4; // no lunch deduction for ≤5h
const LATEST_TIME_OUT = '19:00:00'; // 7:00 PM Manila — hard stop

export class OjtService {
  // ─── Time / Date Helpers (Asia/Manila) ─────────────────────────────────────

  /** Shift a Date so its UTC fields read as Manila wall-clock time. */
  private static toManila(date: Date): Date {
    return new Date(date.getTime() + MANILA_OFFSET_MS);
  }

  /**
   * Calendar date (YYYY-MM-DD) in Asia/Manila.
   * NOTE: never use `toISOString().split('T')[0]` — that is the UTC date, which is the
   * previous day for any time before 8:00 AM in the Philippines.
   */
  static getLocalDateStr(date: Date = new Date()): string {
    return this.toManila(date).toISOString().split('T')[0];
  }

  /**
   * Check if a time-in is late (After 9:30 AM Manila time)
   */
  static isTimeInLate(timeInDate: Date): boolean {
    const manila = this.toManila(timeInDate);
    const hours = manila.getUTCHours();
    const minutes = manila.getUTCMinutes();
    // Late threshold is 9:30 AM
    return hours > 9 || (hours === 9 && minutes > 30);
  }

  /**
   * The latest moment a session can run before it is (auto) timed out:
   *  - Regular: Time-In + 9h (8h work + 1h lunch)
   *  - Overtime: Time-In + 11h (8h + 2h OT + 1h lunch)
   *  - Half-Day: Time-In + 4h
   * …and never later than 7:00 PM Manila on the Time-In day.
   */
  static getSessionCap(timeInIso: string, isHalfDay: boolean = false, allowOvertime: boolean = false): Date {
    const timeIn = new Date(timeInIso);
    const hours = isHalfDay ? HALF_DAY_SESSION_HOURS : allowOvertime ? OVERTIME_SESSION_HOURS : REGULAR_SESSION_HOURS;
    const byDuration = timeIn.getTime() + hours * HOUR_MS;
    const hardStop = new Date(`${this.getLocalDateStr(timeIn)}T${LATEST_TIME_OUT}+08:00`).getTime();
    return new Date(Math.max(timeIn.getTime(), Math.min(byDuration, hardStop)));
  }

  /**
   * Calculate detailed hours breakdown (Regular, Overtime, Total) and status.
   * The Time-Out is clamped to the session cap, so hours can never exceed 8 (+2 OT).
   */
  static calculateHours(
    timeInIso: string,
    timeOutIso?: string,
    isHalfDay: boolean = false,
    allowOvertime: boolean = false,
    autoTimedOut: boolean = false
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
        status: isHalfDay ? 'Half-Day' : isLate ? 'Late' : 'On-Time',
      };
    }

    const cap = this.getSessionCap(timeInIso, isHalfDay, allowOvertime).getTime();
    const effectiveOut = Math.min(new Date(timeOutIso).getTime(), cap);
    const diffMs = Math.max(0, effectiveOut - timeInDate.getTime());

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
    if (autoTimedOut) {
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
      isAutoTimedOut: autoTimedOut,
      status,
    };
  }

  /**
   * Hours to display for a log. Open sessions show live hours, capped at the session limit
   * (so the counter can never run to 24h).
   */
  static getLiveHours(log: OjtAttendanceRecord): number {
    if (log.timeOut) return log.totalHoursWorked || 0;
    if (!log.timeIn) return 0;
    return this.calculateHours(log.timeIn, new Date().toISOString(), log.isHalfDay, log.isOvertime).totalHoursWorked;
  }

  // ─── Student Operations (CRUD) ─────────────────────────────────────────────

  /**
   * Check if an email or full name is already taken before registering.
   * Queries Supabase directly when online; falls back to local Dexie cache offline.
   */
  static async checkDuplicateStudent(
    email: string,
    fullName: string
  ): Promise<{ emailTaken: boolean; nameTaken: boolean }> {
    const normalEmail = email.trim().toLowerCase();
    const normalName  = fullName.trim().toLowerCase();

    if (navigator.onLine) {
      try {
        const { data, error } = await supabase
          .from('ojt_students')
          .select('email, name')
          .or(`email.ilike.${normalEmail},name.ilike.${normalName}`);

        if (!error && data) {
          return {
            emailTaken: data.some((s) => s.email?.toLowerCase() === normalEmail),
            nameTaken:  data.some((s) => s.name?.toLowerCase()  === normalName),
          };
        }
      } catch (e) {
        console.warn('Supabase duplicate check failed, falling back to Dexie:', e);
      }
    }

    // Offline fallback — check local Dexie cache
    const local = await db.ojtStudentsCache.toArray();
    return {
      emailTaken: local.some((s) => s.email?.toLowerCase() === normalEmail),
      nameTaken:  local.some((s) => s.name?.toLowerCase()  === normalName),
    };
  }

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

  // ─── Attendance Sync Helpers ───────────────────────────────────────────────

  private static mapRow(r: any): OjtAttendanceRecord {
    return {
      id: r.id,
      studentId: r.student_id,
      studentName: r.student_name,
      school: r.school,
      date: r.date,
      timeIn: r.time_in,
      timeOut: r.time_out || undefined,
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
    };
  }

  private static toRow(r: OjtAttendanceRecord) {
    return {
      id: r.id,
      student_id: r.studentId,
      student_name: r.studentName,
      school: r.school,
      date: r.date,
      time_in: r.timeIn,
      time_out: r.timeOut ?? null, // explicit null so a cleared Time-Out is actually cleared
      type: r.type,
      is_late: r.isLate,
      is_half_day: r.isHalfDay,
      is_overtime: r.isOvertime,
      is_auto_timed_out: r.isAutoTimedOut,
      regular_hours: r.regularHours,
      overtime_hours: r.overtimeHours,
      total_hours_worked: r.totalHoursWorked,
      status: r.status,
      notes: r.notes || '',
      created_offline: r.createdOffline,
    };
  }

  /**
   * Upsert a record to Supabase and record the outcome in Dexie.
   * Supabase does NOT throw on failure — it returns `{ error }`, which must be checked.
   */
  private static async pushLog(record: OjtAttendanceRecord): Promise<boolean> {
    if (!navigator.onLine) {
      await db.ojtAttendanceQueue.update(record.id, { syncStatus: 'pending' });
      return false;
    }
    try {
      const { error } = await supabase.from('ojt_attendance').upsert(this.toRow(record), { onConflict: 'id' });
      if (error) throw error;
      await db.ojtAttendanceQueue.update(record.id, { syncStatus: 'synced' });
      return true;
    } catch (e) {
      console.warn('Supabase ojt_attendance sync failed — kept locally and will retry:', e);
      await db.ojtAttendanceQueue.update(record.id, { syncStatus: 'failed' });
      return false;
    }
  }

  /**
   * Merge server rows with the local Dexie cache. Unsynced local changes (e.g. a Time-Out
   * whose upload failed) win over the stale server row and are re-pushed, instead of being
   * overwritten — which previously made a timed-out session "re-open".
   */
  private static async mergeWithLocal(
    serverLogs: OjtAttendanceRecord[],
    localFilter: (r: OjtAttendanceRecord) => boolean
  ): Promise<OjtAttendanceRecord[]> {
    const local = await db.ojtAttendanceQueue.filter(localFilter).toArray();
    const localMap = new Map(local.map((l) => [l.id, l]));
    const serverIds = new Set(serverLogs.map((s) => s.id));
    const merged: OjtAttendanceRecord[] = [];
    const toRetry: OjtAttendanceRecord[] = [];

    for (const s of serverLogs) {
      const l = localMap.get(s.id);
      const localIsNewer =
        !!l &&
        l.syncStatus !== 'synced' &&
        ((!!l.timeOut && !s.timeOut) || (!l.timeOut && !s.timeOut && l.isOvertime !== s.isOvertime));
      if (l && localIsNewer) {
        merged.push(l);
        toRetry.push(l);
      } else {
        merged.push(s);
      }
    }

    // Local records that never reached the server (created offline / insert failed)
    for (const l of local) {
      if (!serverIds.has(l.id) && l.syncStatus !== 'synced') {
        merged.push(l);
        toRetry.push(l);
      }
    }

    await db.ojtAttendanceQueue.bulkPut(merged);
    for (const r of toRetry) await this.pushLog(r);

    return this.sortLatestFirst(merged);
  }

  private static sortLatestFirst(logs: OjtAttendanceRecord[]): OjtAttendanceRecord[] {
    return [...logs].sort((a, b) => new Date(b.timeIn).getTime() - new Date(a.timeIn).getTime());
  }

  /** Build the closed version of an open session. */
  private static buildClosedRecord(
    log: OjtAttendanceRecord,
    timeOutIso: string,
    allowOvertime: boolean,
    autoTimedOut: boolean
  ): OjtAttendanceRecord {
    const calc = this.calculateHours(log.timeIn, timeOutIso, log.isHalfDay, allowOvertime, autoTimedOut);
    const cap = this.getSessionCap(log.timeIn, log.isHalfDay, allowOvertime);
    const finalTimeOut = new Date(Math.min(new Date(timeOutIso).getTime(), cap.getTime())).toISOString();
    const autoNote = '[Auto timed-out: no Time Out was recorded]';

    return {
      ...log,
      date: this.getLocalDateStr(new Date(log.timeIn)), // repair UTC-shifted dates
      timeOut: finalTimeOut,
      type: 'TIME_OUT',
      regularHours: calc.regularHours,
      overtimeHours: calc.overtimeHours,
      totalHoursWorked: calc.totalHoursWorked,
      isLate: calc.isLate,
      isOvertime: calc.isOvertime,
      isAutoTimedOut: calc.isAutoTimedOut,
      status: calc.status,
      notes: autoTimedOut && !(log.notes || '').includes(autoNote)
        ? `${log.notes ? `${log.notes} ` : ''}${autoNote}`
        : log.notes,
      syncStatus: 'pending',
    };
  }

  /**
   * Close every open session whose cap (Time-In + 9h, or +11h with OT, max 7:00 PM) has
   * passed. This is what makes a forgotten Time-Out still credit the day's hours
   * (e.g. 8.0 hrs) instead of running forever at 0 hrs.
   */
  static async autoCloseStaleSessions(logs: OjtAttendanceRecord[]): Promise<OjtAttendanceRecord[]> {
    const now = Date.now();
    const affectedStudents = new Set<string>();

    const result: OjtAttendanceRecord[] = [];
    for (const log of logs) {
      if (!log.timeOut && log.timeIn) {
        const cap = this.getSessionCap(log.timeIn, log.isHalfDay, log.isOvertime);
        if (now >= cap.getTime()) {
          const closed = this.buildClosedRecord(log, cap.toISOString(), log.isOvertime, true);
          await db.ojtAttendanceQueue.put(closed);
          const synced = await this.pushLog(closed);
          result.push({ ...closed, syncStatus: synced ? 'synced' : 'failed' });
          affectedStudents.add(log.studentId);
          continue;
        }
      }
      result.push(log);
    }

    for (const studentId of affectedStudents) {
      await this.updateStudentTotals(studentId, result.filter((r) => r.studentId === studentId));
    }

    return result;
  }

  private static async updateStudentTotals(studentId: string, logs: OjtAttendanceRecord[]): Promise<number> {
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

  // ─── Attendance Operations (Time-In / Time-Out / Half-Day / Overtime) ───────

  static async recordTimeIn(
    studentId: string,
    isHalfDay: boolean = false,
    notes?: string
  ): Promise<OjtAttendanceRecord> {
    const student = await this.getStudentById(studentId);
    if (!student) throw new Error('OJT Student record not found');

    // Fetching logs also auto-closes any stale session first
    const logs = await this.getStudentAttendanceLogs(studentId);
    const openSession = logs.find((r) => !r.timeOut);
    if (openSession) {
      throw new Error(`You are still Timed In (session from ${openSession.date}). Please Time Out first.`);
    }

    const now = new Date();
    const todayStr = this.getLocalDateStr(now);

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

    await db.ojtAttendanceQueue.put(newRecord);
    const synced = await this.pushLog(newRecord);

    return { ...newRecord, syncStatus: synced ? 'synced' : 'failed' };
  }

  static async recordTimeOut(
    studentId: string,
    allowOvertime: boolean = false,
    notes?: string
  ): Promise<OjtAttendanceRecord> {
    const student = await this.getStudentById(studentId);
    if (!student) throw new Error('OJT Student record not found');

    // Fetching logs also auto-closes any session that already passed its cap
    const logs = await this.getStudentAttendanceLogs(studentId);
    const activeLog = this.sortLatestFirst(logs.filter((r) => !r.timeOut))[0];

    if (!activeLog) {
      const lastAuto = logs.find((r) => r.isAutoTimedOut);
      throw new Error(
        lastAuto
          ? `No active session. Your session on ${lastAuto.date} was automatically timed out (${lastAuto.totalHoursWorked} hrs credited).`
          : 'No active Time-In session found. Please Time In first.'
      );
    }

    const now = new Date();
    const updatedRecord = this.buildClosedRecord(activeLog, now.toISOString(), allowOvertime, false);
    if (notes) updatedRecord.notes = notes;

    await db.ojtAttendanceQueue.put(updatedRecord);
    const synced = await this.pushLog(updatedRecord);

    // Recalculate student completed & remaining hours
    await this.updateStudentTotals(
      studentId,
      logs.map((r) => (r.id === updatedRecord.id ? updatedRecord : r))
    );

    return { ...updatedRecord, syncStatus: synced ? 'synced' : 'failed' };
  }

  /**
   * Persist the student's Overtime toggle on the open session, so the auto time-out
   * (on any device, or from the admin page) knows to allow up to 7:00 PM.
   */
  static async setOvertimeRequest(recordId: string, allowOvertime: boolean): Promise<void> {
    const log = await db.ojtAttendanceQueue.get(recordId);
    if (!log || log.timeOut) return;
    const updated: OjtAttendanceRecord = { ...log, isOvertime: allowOvertime, syncStatus: 'pending' };
    await db.ojtAttendanceQueue.put(updated);
    await this.pushLog(updated);
  }

  static async updateAttendanceLog(logId: string, updates: Partial<OjtAttendanceRecord>): Promise<boolean> {
    const log = await db.ojtAttendanceQueue.get(logId);
    if (!log) return false;

    // Recalculate hours if timeIn or timeOut was updated, unless totalHoursWorked was explicitly provided
    let calcHours = log.totalHoursWorked;
    let newReg = log.regularHours;
    let newOt = log.overtimeHours;
    let newStatus = log.status;
    let newIsLate = log.isLate;
    let newIsOvertime = log.isOvertime;
    let newIsAutoTimedOut = log.isAutoTimedOut;
    let newType = log.type;

    const timeIn = updates.timeIn || log.timeIn;
    // `timeOut: undefined` in updates means the admin cleared it
    const timeOut = 'timeOut' in updates ? updates.timeOut : log.timeOut;
    const isHalfDay = updates.isHalfDay !== undefined ? updates.isHalfDay : log.isHalfDay;
    // Respect the record's own overtime flag instead of always granting OT
    const allowOvertime = updates.isOvertime ?? (log.isOvertime || (log.overtimeHours || 0) > 0);
    const timesChanged = updates.timeIn !== undefined || 'timeOut' in updates || updates.isHalfDay !== undefined;

    const toMinute = (iso?: string) => (iso ? Math.floor(new Date(iso).getTime() / 60000) : null);
    const keepAutoFlag = log.isAutoTimedOut && toMinute(timeOut) === toMinute(log.timeOut);

    if (timeIn && timeOut && timesChanged && updates.totalHoursWorked === undefined) {
      const calc = this.calculateHours(timeIn, timeOut, isHalfDay, allowOvertime, keepAutoFlag);
      calcHours = calc.totalHoursWorked;
      newReg = calc.regularHours;
      newOt = calc.overtimeHours;
      newStatus = calc.status;
      newIsLate = calc.isLate;
      newIsOvertime = calc.isOvertime;
      newIsAutoTimedOut = calc.isAutoTimedOut;
      newType = 'TIME_OUT';
    } else if (timeIn && !timeOut) {
      // Session re-opened by admin
      const calc = this.calculateHours(timeIn, undefined, isHalfDay);
      calcHours = 0;
      newReg = 0;
      newOt = 0;
      newStatus = calc.status;
      newIsLate = calc.isLate;
      newIsAutoTimedOut = false;
      newType = isHalfDay ? 'HALF_DAY' : 'TIME_IN';
    }

    const updatedRecord: OjtAttendanceRecord = {
      ...log,
      ...updates,
      timeOut,
      type: updates.type ?? newType,
      regularHours: updates.regularHours ?? newReg,
      overtimeHours: updates.overtimeHours ?? newOt,
      totalHoursWorked: updates.totalHoursWorked ?? calcHours,
      status: updates.status ?? newStatus,
      isLate: updates.isLate ?? newIsLate,
      isOvertime: updates.isOvertime ?? newIsOvertime,
      isAutoTimedOut: updates.isAutoTimedOut ?? newIsAutoTimedOut,
      syncStatus: 'pending',
    };

    // 1. Update local Dexie
    await db.ojtAttendanceQueue.put(updatedRecord);

    // 2. Update Supabase if online (errors are now checked)
    await this.pushLog(updatedRecord);

    // 3. Recalculate student totals
    await this.recalculateStudentHours(updatedRecord.studentId);

    return true;
  }

  static async addManualHoursAdjustment(studentId: string, hoursToAdd: number, notes: string = 'Manual Admin Adjustment'): Promise<OjtAttendanceRecord> {
    const student = await this.getStudentById(studentId);
    if (!student) throw new Error('OJT Student record not found');

    const now = new Date();
    const todayStr = this.getLocalDateStr(now);
    
    // Create a dummy completed record for the adjustment
    const adjustmentRecord: OjtAttendanceRecord = {
      id: crypto.randomUUID(),
      studentId: student.id,
      studentName: student.name,
      school: student.school,
      date: todayStr,
      timeIn: now.toISOString(),
      timeOut: now.toISOString(),
      type: 'TIME_OUT', // Use standard type to avoid enum errors
      isLate: false,
      isHalfDay: false,
      isOvertime: false,
      isAutoTimedOut: false,
      regularHours: hoursToAdd,
      overtimeHours: 0,
      totalHoursWorked: hoursToAdd,
      status: 'Completed',
      notes: notes,
      createdOffline: !navigator.onLine,
      syncStatus: 'pending',
    };

    await db.ojtAttendanceQueue.put(adjustmentRecord);
    await this.pushLog(adjustmentRecord);

    await this.recalculateStudentHours(studentId);
    return adjustmentRecord;
  }

  static async getStudentAttendanceLogs(studentId: string): Promise<OjtAttendanceRecord[]> {
    let logs: OjtAttendanceRecord[] | null = null;

    if (navigator.onLine) {
      try {
        const { data, error } = await supabase
          .from('ojt_attendance')
          .select('*')
          .eq('student_id', studentId)
          .order('time_in', { ascending: false });

        if (error) throw error;
        if (data && data.length > 0) {
          logs = await this.mergeWithLocal(data.map((r) => this.mapRow(r)), (r) => r.studentId === studentId);
        }
      } catch (e) {
        console.warn('Supabase student logs fetch warning:', e);
      }
    }

    if (!logs) {
      const localLogs = await db.ojtAttendanceQueue.filter((r) => r.studentId === studentId).toArray();
      logs = this.sortLatestFirst(localLogs);
    }

    return this.autoCloseStaleSessions(logs);
  }

  static async getAllAttendanceLogs(): Promise<OjtAttendanceRecord[]> {
    let logs: OjtAttendanceRecord[] | null = null;

    if (navigator.onLine) {
      try {
        const { data, error } = await supabase
          .from('ojt_attendance')
          .select('*')
          .order('time_in', { ascending: false });

        if (error) throw error;
        if (data && data.length > 0) {
          logs = await this.mergeWithLocal(data.map((r) => this.mapRow(r)), () => true);
        }
      } catch (e) {
        console.warn('Supabase all logs fetch warning:', e);
      }
    }

    if (!logs) {
      logs = this.sortLatestFirst(await db.ojtAttendanceQueue.toArray());
    }

    // Opening the admin page also closes forgotten sessions so their hours are counted
    return this.autoCloseStaleSessions(logs);
  }

  static async recalculateStudentHours(studentId: string): Promise<number> {
    const logs = await this.getStudentAttendanceLogs(studentId);
    return this.updateStudentTotals(studentId, logs);
  }

  static async getStudentDailyStats(studentId: string): Promise<OjtDailyStats> {
    const student = await this.getStudentById(studentId);
    const logs = await this.getStudentAttendanceLogs(studentId); // auto-closes stale sessions
    const todayStr = this.getLocalDateStr();

    // Any still-open session (even from a previous day) is the "current" one, so the
    // student always sees TIME OUT for it instead of an orphaned session.
    const openRecord = this.sortLatestFirst(logs.filter((r) => r.studentId === studentId && !r.timeOut))[0] || null;
    const todayRecord = openRecord || logs.find((r) => r.studentId === studentId && r.date === todayStr) || null;
    const completedHours = logs.reduce((sum, r) => sum + (r.totalHoursWorked || 0), 0);
    const requiredHours = student?.requiredHours || 480;
    const remainingHours = Math.max(0, requiredHours - completedHours);
    const progressPercentage = Math.min(100, Math.round((completedHours / requiredHours) * 100));

    const isCurrentlyTimedIn = !!openRecord;

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
