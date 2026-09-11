import Dexie, { Table } from 'dexie';
import { AttendanceRecord, Employee, Team, Site } from '@/types';
import { OjtStudent, OjtAttendanceRecord } from '@/types/ojt';

export class ConvergeDTRSDatabase extends Dexie {
  attendanceQueue!: Table<AttendanceRecord, string>;
  employeesCache!: Table<Employee, string>;
  teamsCache!: Table<Team, string>;
  sitesCache!: Table<Site, string>;
  ojtStudentsCache!: Table<OjtStudent, string>;
  ojtAttendanceQueue!: Table<OjtAttendanceRecord, string>;

  constructor() {
    super('ConvergeDTRSDatabase');
    this.version(1).stores({
      attendanceQueue: 'id, employeeId, type, syncStatus, recordedAt',
      employeesCache: 'id, teamId',
      teamsCache: 'id',
      sitesCache: 'id',
    });
    // Version 2: added teamName, membersPresent, locationName columns
    this.version(2).stores({
      attendanceQueue: 'id, employeeId, type, syncStatus, recordedAt, teamName, locationName',
      employeesCache: 'id, teamId',
      teamsCache: 'id',
      sitesCache: 'id',
    });
    // Version 3: added OJT tables for students and attendance
    this.version(3).stores({
      attendanceQueue: 'id, employeeId, type, syncStatus, recordedAt, teamName, locationName',
      employeesCache: 'id, teamId',
      teamsCache: 'id',
      sitesCache: 'id',
      ojtStudentsCache: 'id, email, pinHash, school',
      ojtAttendanceQueue: 'id, studentId, date, timeIn, type, status, syncStatus',
    });
  }
}

export const db = new ConvergeDTRSDatabase();
