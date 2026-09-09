import { supabase } from '@/lib/supabase/client';
import { db } from '@/lib/indexeddb/db';
import { FormattedAttendanceRecord } from '@/utils/exportUtils';

export type DateRangeOption = '15days' | '30days' | 'today' | 'all';

export async function fetchAllAttendanceRecords(): Promise<FormattedAttendanceRecord[]> {
  try {
    // 1. Fetch reference tables (employees, teams, sites)
    const [empRes, teamRes, siteRes, attRes] = await Promise.all([
      supabase.from('employees').select('id, name, role'),
      supabase.from('teams').select('id, name'),
      supabase.from('sites').select('id, name'),
      supabase.from('attendance_records').select('*').order('recorded_at', { ascending: false })
    ]);

    const employeeMap = new Map<string, { name: string; role: string }>();
    if (empRes.data) {
      empRes.data.forEach(e => employeeMap.set(e.id, { name: e.name, role: e.role || 'Technician' }));
    }

    const teamMap = new Map<string, string>();
    if (teamRes.data) {
      teamRes.data.forEach(t => teamMap.set(t.id, t.name));
    }

    const siteMap = new Map<string, string>();
    if (siteRes.data) {
      siteRes.data.forEach(s => siteMap.set(s.id, s.name));
    }

    const fetchedRecords: FormattedAttendanceRecord[] = [];

    if (attRes.data && attRes.data.length > 0) {
      attRes.data.forEach(r => {
        const emp = employeeMap.get(r.employee_id);
        const recordedDate = new Date(r.recorded_at);
        
        let photoUrl = r.photo_path;
        if (photoUrl && !photoUrl.startsWith('http') && !photoUrl.startsWith('data:')) {
          const { data } = supabase.storage.from('user_profile').getPublicUrl(photoUrl);
          photoUrl = data?.publicUrl || photoUrl;
        }

        fetchedRecords.push({
          id: r.id,
          employeeId: r.employee_id,
          employeeName: emp ? emp.name : 'Unknown Employee',
          role: emp ? emp.role : 'Technician',
          teamName: r.team_name || teamMap.get(r.team_id) || 'Unassigned',
          siteName: siteMap.get(r.site_id) || 'Unassigned',
          locationName: r.location_name || siteMap.get(r.site_id) || 'Field Site',
          membersPresent: Array.isArray(r.members_present) ? r.members_present : (typeof r.members_present === 'string' ? JSON.parse(r.members_present || '[]') : []),
          type: r.type,
          recordedAt: r.recorded_at,
          formattedDate: recordedDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
          formattedTime: recordedDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
          verificationStatus: r.verification_status || 'Verified On Site',
          distanceFromSite: r.distance_from_site,
          syncStatus: 'Synced',
          createdOffline: r.created_offline || false,
          photoUrl: photoUrl || undefined,
          latitude: r.latitude ?? null,
          longitude: r.longitude ?? null
        });
      });
    }

    // 2. Fetch local offline IndexedDB records
    try {
      const localQueue = await db.attendanceQueue.toArray();
      localQueue.forEach(local => {
        if (!fetchedRecords.some(fr => fr.id === local.id)) {
          const emp = employeeMap.get(local.employeeId);
          const recordedDate = new Date(local.recordedAt);
          fetchedRecords.unshift({
            id: local.id,
            employeeId: local.employeeId,
            employeeName: emp ? emp.name : 'Local User',
            role: emp ? emp.role : 'Technician',
            teamName: local.teamName || teamMap.get(local.teamId) || 'Local Team',
            siteName: siteMap.get(local.siteId) || 'Local Site',
            locationName: local.locationName || 'Local Site',
            membersPresent: local.membersPresent || [],
            type: local.type,
            recordedAt: local.recordedAt,
            formattedDate: recordedDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
            formattedTime: recordedDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
            verificationStatus: local.verificationStatus || 'Pending Sync',
            distanceFromSite: local.distanceFromSite,
            syncStatus: local.syncStatus === 'synced' ? 'Synced' : 'Pending',
            createdOffline: local.createdOffline,
            photoUrl: local.photoUrl,
            latitude: (local as any).latitude ?? null,
            longitude: (local as any).longitude ?? null
          });
        }
      });
    } catch (e) {
      console.warn('Could not load IndexedDB local queue:', e);
    }


    return fetchedRecords;
  } catch (error) {
    console.error('Error fetching Supabase attendance records:', error);
    return [];
  }
}

/**
 * Filter attendance records by range ('15days', '30days', 'today', 'all')
 */
export function filterRecordsByRange(records: FormattedAttendanceRecord[], range: DateRangeOption): FormattedAttendanceRecord[] {
  const now = new Date();
  
  if (range === 'today') {
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    return records.filter(r => new Date(r.recordedAt).getTime() >= startOfToday);
  }

  if (range === '15days') {
    const cutoff = new Date(now.getTime() - 15 * 24 * 60 * 60 * 1000).getTime();
    return records.filter(r => new Date(r.recordedAt).getTime() >= cutoff);
  }

  if (range === '30days') {
    const cutoff = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).getTime();
    return records.filter(r => new Date(r.recordedAt).getTime() >= cutoff);
  }

  return records;
}

/**
 * Delete an attendance record from both Supabase and local IndexedDB queue
 */
export async function deleteAttendanceRecord(id: string): Promise<boolean> {
  try {
    const { error } = await supabase.from('attendance_records').delete().eq('id', id);
    if (error) {
      console.error('Supabase delete error:', error);
      alert(`Could not delete record from database: ${error.message}. Please run migration 00002_fix_columns_and_rls.sql in your Supabase SQL editor.`);
      return false;
    }
    // Delete from IndexedDB queue as well
    await db.attendanceQueue.delete(id);
    return true;
  } catch (err: any) {
    console.error('Error deleting attendance record:', err);
    alert(`Delete failed: ${err.message || 'Unknown error'}`);
    return false;
  }
}

