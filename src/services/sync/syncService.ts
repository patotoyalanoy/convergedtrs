import { db } from '@/lib/indexeddb/db';
import { supabase } from '@/lib/supabase/client';
import { useAppStore } from '@/stores/useAppStore';

const isValidUUID = (str: string | null | undefined): boolean => {
  if (!str) return false;
  return /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(str);
};

export class SyncService {
  static async syncPendingRecords() {
    const setSyncing = useAppStore.getState().setSyncingStatus;
    setSyncing(true);
    
    try {
      const unsyncedRecords = await db.attendanceQueue.filter(r => r.syncStatus !== 'synced').toArray();
      
      for (const record of unsyncedRecords) {
        try {
          // 1. Upload Photo if exists
          let photoUrl = record.photoUrl;
          if (record.photoFile) {
            try {
              const fileName = `attendance/${new Date().getFullYear()}/${new Date().getMonth()+1}/${record.employeeId || 'anon'}/${record.id}.jpg`;
              const { data: _uploadData, error } = await supabase.storage.from('user_profile').upload(fileName, record.photoFile, { upsert: true });
              if (error) {
                console.warn('Storage upload RLS warning (falling back to inline photo):', error.message);
              } else {
                const { data: publicUrlData } = supabase.storage.from('user_profile').getPublicUrl(fileName);
                if (publicUrlData?.publicUrl) {
                  photoUrl = publicUrlData.publicUrl;
                }
              }
            } catch (pErr) {
              console.warn('Storage upload error, keeping base64 URL:', pErr);
            }
          }

          // 2. Insert into Supabase attendance_records table
          const dbRecord = {
            id: record.id,
            employee_id: isValidUUID(record.employeeId) ? record.employeeId : null,
            team_id: isValidUUID(record.teamId) ? record.teamId : null,
            site_id: isValidUUID(record.siteId) ? record.siteId : null,
            type: record.type,
            recorded_at: record.recordedAt,
            latitude: record.location.latitude,
            longitude: record.location.longitude,
            gps_accuracy: record.location.accuracy,
            distance_from_site: record.distanceFromSite,
            verification_status: record.verificationStatus,
            photo_path: photoUrl || null,
            created_offline: record.createdOffline,
            synced_at: new Date().toISOString(),
            team_name: record.teamName || null,
            members_present: record.membersPresent || [],
            location_name: record.locationName || null
          };

          const { error } = await supabase.from('attendance_records').insert(dbRecord);
          if (error) {
            // Handle duplicate key error (already synced previously)
            if (error.code === '23505') {
              console.log(`Record ${record.id} already exists in Supabase. Marking as synced.`);
              await db.attendanceQueue.update(record.id, { syncStatus: 'synced' });
              continue;
            }
            throw error;
          }

          // 3. Mark as synced in local DB
          await db.attendanceQueue.update(record.id, { syncStatus: 'synced' });

        } catch (err) {
          console.error(`Failed to sync record ${record.id}`, err);
          // Increment retry count and update status to failed
          await db.attendanceQueue.update(record.id, { 
            syncStatus: 'failed',
            syncRetryCount: (record.syncRetryCount || 0) + 1 
          });
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
