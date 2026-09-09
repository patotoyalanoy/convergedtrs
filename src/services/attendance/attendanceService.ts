import { db } from '@/lib/indexeddb/db';
import { AttendanceRecord } from '@/types';
export class AttendanceService {
  static async saveLocalAttendance(record: Omit<AttendanceRecord, 'id' | 'syncStatus' | 'syncRetryCount' | 'createdOffline'>) {
    const isOnline = navigator.onLine;

    // Convert temporary blob: URL or File object to permanent base64 Data URL if needed
    let photoUrl = record.photoUrl;
    if (record.photoFile && (!photoUrl || photoUrl.startsWith('blob:'))) {
      photoUrl = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.readAsDataURL(record.photoFile!);
      });
    }
    
    const newRecord: AttendanceRecord = {
      ...record,
      photoUrl,
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
