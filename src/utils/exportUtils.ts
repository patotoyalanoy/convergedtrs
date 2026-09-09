export interface FormattedAttendanceRecord {
  id: string;
  employeeId?: string;
  employeeName: string;
  role?: string;
  teamName: string;
  siteName: string;
  locationName?: string;
  membersPresent?: string[];
  type: 'TIME_IN' | 'TIME_OUT' | string;
  recordedAt: string;
  formattedDate: string;
  formattedTime: string;
  verificationStatus: string;
  distanceFromSite?: number | null;
  syncStatus: string;
  createdOffline: boolean;
  photoUrl?: string;
  latitude?: number | null;
  longitude?: number | null;
}

/**
 * Converts formatted attendance records to CSV and triggers a download.
 */
export function exportAttendanceToCSV(records: FormattedAttendanceRecord[], filename: string = 'attendance_report.csv') {
  if (!records || records.length === 0) {
    alert('No attendance records available to export.');
    return;
  }

  const headers = [
    'Date',
    'Time',
    'Employee Name',
    'Role',
    'Team',
    'Assigned Site',
    'Field Location Name',
    'Members Present',
    'Type',
    'Status',
    'Distance (m)',
    'Sync Status',
    'Created Offline'
  ];

  const escapeCSV = (val: string | number | boolean | null | undefined): string => {
    if (val === null || val === undefined) return '""';
    const str = String(val).replace(/"/g, '""');
    return `"${str}"`;
  };

  const rows = records.map(r => [
    escapeCSV(r.formattedDate),
    escapeCSV(r.formattedTime),
    escapeCSV(r.employeeName),
    escapeCSV(r.role || 'Technician'),
    escapeCSV(r.teamName),
    escapeCSV(r.siteName),
    escapeCSV(r.locationName || r.siteName),
    escapeCSV(r.membersPresent && r.membersPresent.length > 0 ? r.membersPresent.join('; ') : 'None'),
    escapeCSV(r.type === 'TIME_IN' ? 'Time In' : r.type === 'TIME_OUT' ? 'Time Out' : r.type),
    escapeCSV(r.verificationStatus),
    escapeCSV(r.distanceFromSite !== null && r.distanceFromSite !== undefined ? `${Math.round(r.distanceFromSite)}m` : 'N/A'),
    escapeCSV(r.syncStatus),
    escapeCSV(r.createdOffline ? 'Yes' : 'No')
  ]);

  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.join(','))
  ].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
