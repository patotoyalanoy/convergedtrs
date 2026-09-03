import { db } from '@/lib/indexeddb/db';
import { supabase } from '@/lib/supabase/client';
import { useAppStore } from '@/stores/useAppStore';

export class SyncService {
  static async syncPendingRecords() {
    const setSyncing = useAppStore.getState().setSyncingStatus;
    setSyncing(true);
    
    try {
      const pendingRecords = await db.attendanceQueue.where('syncStatus').equals('pending').toArray();
      
      for (const record of pendingRecords) {
        try {
          // 1. Upload Photo if exists
          let photoUrl = record.photoUrl;
          if (record.photoFile) {
            const fileName = `attendance/${new Date().getFullYear()}/${new Date().getMonth()+1}/${record.employeeId}/${record.id}.jpg`;
            const { data, error } = await supabase.storage.from('attendance').upload(fileName, record.photoFile);
            if (error) throw error;
            
            const { data: publicUrlData } = supabase.storage.from('attendance').getPublicUrl(fileName);
            photoUrl = publicUrlData.publicUrl;
          }

          // 2. Insert into Supabase
          const dbRecord = {
            id: record.id,
            employee_id: record.employeeId,
            team_id: record.teamId,
            site_id: record.siteId,
            type: record.type,
            recorded_at: record.recordedAt,
            latitude: record.location.latitude,
            longitude: record.location.longitude,
            gps_accuracy: record.location.accuracy,
            distance_from_site: record.distanceFromSite,
            verification_status: record.verificationStatus,
            photo_path: photoUrl,
            created_offline: record.createdOffline,
            synced_at: new Date().toISOString()
          };

          const { error } = await supabase.from('attendance_records').insert(dbRecord);
          if (error) throw error;

          // 3. Mark as synced in local DB
          await db.attendanceQueue.update(record.id, { syncStatus: 'synced' });

        } catch (err) {
          console.error(`Failed to sync record ${record.id}`, err);
          // Increment retry count
          await db.attendanceQueue.update(record.id, { syncRetryCount: (record.syncRetryCount || 0) + 1 });
        }
      }
    } finally {
      setSyncing(false);
    }
  }

  static initSyncListeners() {
    window.addEventListener('online', () => {
      useAppStore.getState().setOnlineStatus(true);
      this.syncPendingRecords();
    });

    window.addEventListener('offline', () => {
      useAppStore.getState().setOnlineStatus(false);
    });

    window.addEventListener('dtrs-sync-trigger', () => {
      if (navigator.onLine) {
        this.syncPendingRecords();
      }
    });
  }
}
