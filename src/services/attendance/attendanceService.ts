import { db } from '@/lib/indexeddb/db';
import { AttendanceRecord } from '@/types';
export class AttendanceService {
  static async saveLocalAttendance(record: Omit<AttendanceRecord, 'id' | 'syncStatus' | 'syncRetryCount' | 'createdOffline'>) {
    const isOnline = navigator.onLine;
    
    const newRecord: AttendanceRecord = {
      ...record,
      id: crypto.randomUUID(),
      syncStatus: 'pending',
      syncRetryCount: 0,
      createdOffline: !isOnline
    };

    await db.attendanceQueue.add(newRecord);
    
    // Trigger sync if online
    if (isOnline) {
      this.triggerSync();
    }
    
    return newRecord;
  }

  static async getLocalRecords() {
    return await db.attendanceQueue.toArray();
  }

  static async triggerSync() {
    // We will emit an event or call SyncService directly
    window.dispatchEvent(new CustomEvent('dtrs-sync-trigger'));
  }
}
