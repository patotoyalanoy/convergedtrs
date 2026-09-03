export interface Employee {
  id: string;
  name: string;
  pinHash?: string; // Kept server-side or hashed
  teamId: string;
  role?: string;
  status: 'active' | 'inactive';
}

export interface Team {
  id: string;
  name: string;
  siteId: string; // The assigned Converge site
  members: string[]; // Array of Employee IDs
}

export interface Site {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  geofenceRadius: number; // in meters
}

export type AttendanceType = 'TIME_IN' | 'TIME_OUT';
export type SyncStatus = 'pending' | 'syncing' | 'synced' | 'failed';
export type VerificationStatus = 'Verified On Site' | 'Outside Allowed Area' | 'GPS Accuracy Too Low' | 'Location Unavailable';

export interface GeoLocation {
  latitude: number;
  longitude: number;
  accuracy: number;
}

export interface AttendanceRecord {
  id: string; // local UUID
  employeeId: string;
  teamId: string;
  siteId: string;
  type: AttendanceType;
  recordedAt: string; // ISO String
  location: GeoLocation;
  distanceFromSite: number | null;
  verificationStatus: VerificationStatus;
  photoUrl?: string; // local blob URL or remote URL
  photoFile?: Blob; // Actual file for upload
  syncStatus: SyncStatus;
  syncRetryCount: number;
  createdOffline: boolean;
}

export interface Admin {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'superadmin';
}
