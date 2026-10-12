import { useEffect, useState } from 'react';
import { 
  GraduationCap, Search, Plus, Edit3, Trash2, 
  CheckCircle2, AlertTriangle, Download, RefreshCw, Calendar, X, Printer
} from 'lucide-react';
import { clsx } from 'clsx';
import { OjtStudent, OjtAttendanceRecord } from '@/types/ojt';
import { OjtService } from '@/services/ojt/ojtService';
import OjtStudentModal from '@/components/ojt/OjtStudentModal';
import OjtLogEditModal from '@/components/ojt/OjtLogEditModal';

export type DateFilterOption = 'all' | 'today' | 'this_week' | 'this_month';

function isLogInDateRange(log: OjtAttendanceRecord, range: DateFilterOption): boolean {
  if (range === 'all') return true;
  const now = new Date();

  let logDate: Date;
  if (log.date) {
    const [y, m, d] = log.date.split('-').map(Number);
    logDate = new Date(y, m - 1, d);
  } else if (log.timeIn) {
    logDate = new Date(log.timeIn);
  } else {
    return false;
  }

  if (range === 'today') {
    return (
      logDate.getFullYear() === now.getFullYear() &&
      logDate.getMonth() === now.getMonth() &&
      logDate.getDate() === now.getDate()
    );
  }

  if (range === 'this_week') {
    // Current week: Monday to Sunday
    const startOfWeek = new Date(now);
    const day = startOfWeek.getDay(); // 0 = Sun, 1 = Mon...
    const diffToMonday = startOfWeek.getDate() - day + (day === 0 ? -6 : 1);
    startOfWeek.setDate(diffToMonday);
    startOfWeek.setHours(0, 0, 0, 0);

    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);
    endOfWeek.setHours(23, 59, 59, 999);

    const targetTime = new Date(logDate.getFullYear(), logDate.getMonth(), logDate.getDate(), 12, 0, 0).getTime();
    return targetTime >= startOfWeek.getTime() && targetTime <= endOfWeek.getTime();
  }

  if (range === 'this_month') {
    return (
      logDate.getFullYear() === now.getFullYear() &&
      logDate.getMonth() === now.getMonth()
    );
  }

  return true;
}

export default function AdminOjtManagement() {
  const [students, setStudents] = useState<OjtStudent[]>([]);
  const [logs, setLogs] = useState<OjtAttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Search & Filter
  const [search, setSearch] = useState('');
  const [selectedSchool, setSelectedSchool] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedDateRange, setSelectedDateRange] = useState<DateFilterOption>('all');

  // Modals
  const [showModal, setShowModal] = useState(false);
  const [editingStudent, setEditingStudent] = useState<OjtStudent | null>(null);
  const [selectedStudentLogs, setSelectedStudentLogs] = useState<{ student: OjtStudent; logs: OjtAttendanceRecord[] } | null>(null);
  const [editingLog, setEditingLog] = useState<OjtAttendanceRecord | null>(null);
  const [deleteConfirmStudent, setDeleteConfirmStudent] = useState<OjtStudent | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const [allStudents, allLogs] = await Promise.all([
        OjtService.getAllStudents(),
        OjtService.getAllAttendanceLogs(),
      ]);

      // Calculate latest completed hours for each student
      const updatedStudents = await Promise.all(
        allStudents.map(async (s) => {
          const sLogs = allLogs.filter((l) => l.studentId === s.id);
          const completed = Math.round(sLogs.reduce((sum, l) => sum + (l.totalHoursWorked || 0), 0) * 100) / 100;
          const remaining = Math.max(0, s.requiredHours - completed);
          return {
            ...s,
            completedHours: completed,
            remainingHours: remaining,
            status: (remaining <= 0 ? 'completed' : s.status) as any,
          };
        })
      );

      setStudents(updatedStudents);
      setLogs(allLogs);
    } catch (err) {
      console.warn('Error loading admin OJT data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleDelete = (student: OjtStudent) => {
    setDeleteConfirmStudent(student);
  };

  const confirmDelete = async () => {
    if (!deleteConfirmStudent) return;
    setDeleteLoading(true);
    try {
      await OjtService.deleteStudent(deleteConfirmStudent.id);
      setDeleteConfirmStudent(null);
      loadData();
    } catch (err) {
      console.error('Failed to delete student:', err);
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleExportCSV = () => {
    if (filteredStudents.length === 0) return;

    const isDateFiltered = selectedDateRange !== 'all';
    const headers = ['First Name', 'Last Name', 'Email', 'Phone', 'Address', 'School'];
    if (isDateFiltered) {
      headers.push(`${dateRangeLabel} Hours`);
    }
    headers.push('Required Hours', 'Completed Hours', 'Remaining Hours', 'Status');

    let csvContent = headers.join(',') + '\n';

    filteredStudents.forEach((s) => {
      // Escape quotes in fields by replacing " with "" and wrap in quotes
      const escapeCsv = (str: string | number) => `"${String(str).replace(/"/g, '""')}"`;
      const periodHrs = Math.round((studentRangeHoursMap.get(s.id) || 0) * 100) / 100;

      const row = [
        escapeCsv(s.firstName),
        escapeCsv(s.lastName),
        escapeCsv(s.email),
        escapeCsv(s.phone || ''),
        escapeCsv(s.address || ''),
        escapeCsv(s.school),
      ];

      if (isDateFiltered) {
        row.push(escapeCsv(periodHrs));
      }

      row.push(escapeCsv(s.requiredHours), escapeCsv(s.completedHours), escapeCsv(s.remainingHours), escapeCsv(s.status));
      csvContent += row.join(',') + '\n';
    });

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `OJT_Students_Report_${selectedDateRange}_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handlePrint = () => {
    if (filteredStudents.length === 0) return;

    const now      = new Date();
    const dateStr  = now.toLocaleDateString('en-PH', { year: 'numeric', month: 'long', day: 'numeric' });
    const timeStr  = now.toLocaleTimeString('en-PH', { hour: '2-digit', minute: '2-digit' });

    // Build filter label for the report subtitle
    const filterParts: string[] = [];
    if (selectedDateRange !== 'all') filterParts.push(`Period: ${dateRangeLabel}`);
    if (selectedSchool !== 'all') filterParts.push(`School: ${selectedSchool}`);
    if (selectedStatus !== 'all') filterParts.push(`Status: ${selectedStatus}`);
    if (search.trim())            filterParts.push(`Search: "${search.trim()}"`);
    const filterLabel = filterParts.length > 0 ? filterParts.join(' • ') : 'All Students';

    const isDateFiltered = selectedDateRange !== 'all';

    const rows = filteredStudents
      .map((s, i) => {
        const pct = Math.min(100, Math.round((s.completedHours / s.requiredHours) * 100));
        const periodHrs = Math.round((studentRangeHoursMap.get(s.id) || 0) * 100) / 100;
        const statusColor =
          s.status === 'completed' ? '#15803d' :
          s.status === 'active'    ? '#ea580c' : '#6b7280';
        return `
          <tr>
            <td style="text-align:center">${i + 1}</td>
            <td><strong>${s.firstName || s.name.split(' ')[0]}</strong></td>
            <td>${s.lastName || s.name.split(' ').slice(1).join(' ')}</td>
            <td>${s.school}</td>
            ${isDateFiltered ? `<td style="text-align:center;font-weight:700;color:#ea580c">${periodHrs}</td>` : ''}
            <td style="text-align:center">${s.requiredHours}</td>
            <td style="text-align:center;font-weight:700;color:#16a34a">${s.completedHours}</td>
            <td style="text-align:center;color:#b45309">${s.remainingHours}</td>
            <td style="text-align:center">
              <span style="background:${statusColor}20;color:${statusColor};padding:2px 8px;border-radius:99px;font-size:9px;font-weight:800;text-transform:uppercase;border:1px solid ${statusColor}40">
                ${s.status}
              </span>
            </td>
            <td style="text-align:center">${pct}%</td>
          </tr>`;
      })
      .join('');

    const totalCompleted = Math.round(filteredStudents.reduce((sum, s) => sum + s.completedHours, 0) * 100) / 100;

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>OJT Student Report — ${dateStr}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: 'Century Gothic', CenturyGothic, AppleGothic, Arial, sans-serif;
      font-size: 11px;
      color: #1e293b;
      padding: 24px 30px;
    }
    .header { display: flex; align-items: center; gap: 16px; margin-bottom: 12px; }
    .header img { height: 44px; object-fit: contain; }
    .header-text h1 { font-size: 16px; font-weight: 900; color: #0f172a; }
    .header-text p  { font-size: 10px; color: #64748b; margin-top: 2px; }
    .meta {
      display: flex; justify-content: space-between; align-items: center;
      background: #f8fafc; border: 1px solid #e2e8f0;
      border-radius: 8px; padding: 8px 14px; margin-bottom: 14px;
    }
    .meta-left  { font-size: 10px; color: #475569; }
    .meta-right { font-size: 10px; color: #94a3b8; text-align: right; }
    .meta strong { color: #0f172a; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 16px; }
    thead tr { background: #0f172a; color: white; }
    thead th {
      padding: 8px 10px; font-size: 9px; font-weight: 800;
      text-transform: uppercase; letter-spacing: .06em; text-align: left;
    }
    tbody tr:nth-child(even) { background: #f8fafc; }
    tbody tr:hover { background: #fff7ed; }
    tbody td {
      padding: 7px 10px; font-size: 10px; color: #334155;
      border-bottom: 1px solid #f1f5f9;
    }
    tfoot td {
      padding: 8px 10px; font-size: 10px; font-weight: 800;
      background: #f1f5f9; border-top: 2px solid #e2e8f0;
    }
    .footer {
      margin-top: 10px; text-align: center;
      font-size: 9px; color: #94a3b8; border-top: 1px solid #e2e8f0; padding-top: 8px;
    }
    @media print {
      body { padding: 10px 14px; }
      @page { margin: 14mm 10mm; }
    }
  </style>
</head>
<body>
  <div class="header">
    <img src="/CSiLogo.png" alt="Converge IT Solutions" onerror="this.style.display='none'" />
    <div class="header-text">
      <h1>OJT Student Progress Report</h1>
      <p>Converge IT Solutions Inc. — Daily Time Record System</p>
    </div>
  </div>

  <div class="meta">
    <div class="meta-left">
      <strong>Filter:</strong> ${filterLabel} &nbsp;|&nbsp;
      <strong>Records:</strong> ${filteredStudents.length} student${filteredStudents.length !== 1 ? 's' : ''}
    </div>
    <div class="meta-right">
      Printed: ${dateStr} at ${timeStr}
    </div>
  </div>

  <table>
    <thead>
      <tr>
        <th style="text-align:center;width:30px">#</th>
        <th>First Name</th>
        <th>Last Name</th>
        <th>School</th>
        ${isDateFiltered ? `<th style="text-align:center">${dateRangeLabel} Hrs</th>` : ''}
        <th style="text-align:center">Req. Hours</th>
        <th style="text-align:center">Completed</th>
        <th style="text-align:center">Remaining</th>
        <th style="text-align:center">Status</th>
        <th style="text-align:center">Progress</th>
      </tr>
    </thead>
    <tbody>${rows}</tbody>
    <tfoot>
      <tr>
        <td colspan="${isDateFiltered ? 6 : 5}" style="text-align:right">Total Completed Hours:</td>
        <td style="text-align:center;color:#15803d">${totalCompleted} hrs</td>
        <td colspan="3"></td>
      </tr>
    </tfoot>
  </table>

  <div class="footer">
    This report is system-generated and may contain information that is confidential.<br/>
    © ${now.getFullYear()} Converge IT Solutions Inc. — OJT Monitoring Module
  </div>

  <script>window.onload = () => { window.print(); }<\/script>
</body>
</html>`;

    const win = window.open('', '_blank', 'width=900,height=700');
    if (!win) {
      alert('Pop-up blocked. Please allow pop-ups for this site and try again.');
      return;
    }
    win.document.write(html);
    win.document.close();
  };

  // Filter Unique Schools for filter dropdown
  const schoolsList = Array.from(new Set(students.map((s) => s.school))).filter(Boolean);

  const dateRangeLabel = 
    selectedDateRange === 'today' ? 'Today' :
    selectedDateRange === 'this_week' ? 'This Week' :
    selectedDateRange === 'this_month' ? 'This Month' : 'All Dates';

  // Filter logs by selected date range
  const rangeLogs = selectedDateRange === 'all'
    ? logs
    : logs.filter((l) => isLogInDateRange(l, selectedDateRange));

  // Map student ID to their hours and log count within the selected date range
  const studentRangeHoursMap = new Map<string, number>();
  const studentRangeLogsCountMap = new Map<string, number>();

  rangeLogs.forEach((l) => {
    studentRangeHoursMap.set(l.studentId, (studentRangeHoursMap.get(l.studentId) || 0) + (l.totalHoursWorked || 0));
    studentRangeLogsCountMap.set(l.studentId, (studentRangeLogsCountMap.get(l.studentId) || 0) + 1);
  });

  const filteredStudents = students.filter((s) => {
    const matchesSearch =
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.email.toLowerCase().includes(search.toLowerCase()) ||
      s.school.toLowerCase().includes(search.toLowerCase());
    const matchesSchool = selectedSchool === 'all' || s.school === selectedSchool;
    const matchesStatus = selectedStatus === 'all' || s.status === selectedStatus;
    // When date range is selected (today, this week, this month), filter to trainees with activity in that period
    const matchesDateRange = selectedDateRange === 'all' || (studentRangeLogsCountMap.get(s.id) || 0) > 0;

    return matchesSearch && matchesSchool && matchesStatus && matchesDateRange;
  });

  // Summary Metrics
  const totalStudentsCount = selectedDateRange === 'all' ? students.length : filteredStudents.length;
  const totalCompletedHoursSum = selectedDateRange === 'all'
    ? Math.round(students.reduce((sum, s) => sum + s.completedHours, 0))
    : Math.round(rangeLogs.reduce((sum, l) => sum + (l.totalHoursWorked || 0), 0) * 100) / 100;
  const activeTodayCount = logs.filter((l) => l.date === new Date().toISOString().split('T')[0] && !l.timeOut).length;
  const lateCountInPeriod = selectedDateRange === 'all'
    ? logs.filter((l) => l.date === new Date().toISOString().split('T')[0] && l.isLate).length
    : rangeLogs.filter((l) => l.isLate).length;
  const overtimeCountInPeriod = selectedDateRange === 'all'
    ? logs.filter((l) => l.isOvertime).length
    : rangeLogs.filter((l) => l.isOvertime).length;

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-primary via-orange-500 to-amber-600 rounded-3xl p-5 sm:p-6 text-white shadow-lg flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-black uppercase tracking-widest bg-white/20 px-3 py-0.5 rounded-full border border-white/30">
              OJT Monitoring Module
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-white leading-tight">
            OJT Student Management & Analytics
          </h1>
          <p className="text-xs text-orange-100 font-medium mt-0.5">
            Monitor On-the-Job Trainee hours, attendance schedules, overtime, and progress
          </p>
        </div>

        {/* 3 Action Buttons - Fully responsive grid on mobile, flex on desktop */}
        <div className="grid grid-cols-2 sm:flex sm:items-center gap-2 sm:gap-2.5 w-full sm:w-auto">
          <button
            onClick={handleExportCSV}
            disabled={filteredStudents.length === 0}
            className="col-span-1 sm:col-auto justify-center bg-white/20 hover:bg-white/30 text-white font-extrabold px-3.5 sm:px-4 py-2.5 rounded-2xl text-xs flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer border border-white/30 disabled:opacity-40 disabled:cursor-not-allowed text-center"
          >
            <Download size={15} /> Export CSV
          </button>
          <button
            onClick={handlePrint}
            disabled={filteredStudents.length === 0}
            className="col-span-1 sm:col-auto justify-center bg-white/20 hover:bg-white/30 text-white font-extrabold px-3.5 sm:px-4 py-2.5 rounded-2xl text-xs flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer border border-white/30 disabled:opacity-40 disabled:cursor-not-allowed text-center"
          >
            <Printer size={15} /> Print Records
          </button>
          <button
            onClick={() => {
              setEditingStudent(null);
              setShowModal(true);
            }}
            className="col-span-2 sm:col-auto justify-center bg-white text-navy-900 font-black px-4 py-2.5 rounded-2xl text-xs flex items-center gap-1.5 shadow-md active:scale-95 transition-all cursor-pointer hover:bg-slate-100 text-center"
          >
            <Plus size={16} /> Register New OJT Student
          </button>
        </div>
      </div>

      {/* Analytics Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3.5">
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
          <span className="text-[10px] font-extrabold text-neutral-400 uppercase tracking-wider block">
            {selectedDateRange === 'all' ? 'Total Trainees' : `Active in ${dateRangeLabel}`}
          </span>
          <span className="text-xl font-black text-neutral-900 block mt-1">{totalStudentsCount}</span>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
          <span className="text-[10px] font-extrabold text-neutral-400 uppercase tracking-wider block">
            {selectedDateRange === 'all' ? 'Completed Hours' : `${dateRangeLabel} Hours`}
          </span>
          <span className="text-xl font-black text-blue-600 block mt-1">{totalCompletedHoursSum} hrs</span>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
          <span className="text-[10px] font-extrabold text-neutral-400 uppercase tracking-wider block">
            {selectedDateRange === 'all' || selectedDateRange === 'today' ? 'Active Today' : 'Total Sessions'}
          </span>
          <span className="text-xl font-black text-primary block mt-1">
            {selectedDateRange === 'all' || selectedDateRange === 'today' ? activeTodayCount : rangeLogs.length}
          </span>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
          <span className="text-[10px] font-extrabold text-neutral-400 uppercase tracking-wider block">
            {selectedDateRange === 'all' ? 'Late Logs Today' : `Late Logs (${dateRangeLabel})`}
          </span>
          <span className="text-xl font-black text-orange-600 block mt-1">{lateCountInPeriod}</span>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs col-span-2 sm:col-span-1">
          <span className="text-[10px] font-extrabold text-neutral-400 uppercase tracking-wider block">
            {selectedDateRange === 'all' ? 'Overtime Logs' : `Overtime (${dateRangeLabel})`}
          </span>
          <span className="text-xl font-black text-blue-600 block mt-1">{overtimeCountInPeriod}</span>
        </div>
      </div>

      {/* Search & Filter Toolbar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        <div className="relative w-full sm:w-72">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400" />
          <input
            type="text"
            placeholder="Search student name, school, email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-primary/20 outline-none"
          />
        </div>

        {/* Filter Dropdowns - Responsive Wrap on Mobile */}
        <div className="flex flex-wrap sm:flex-nowrap items-center gap-2 w-full sm:w-auto">
          {/* Date Range Dropdown: Today, This Week, This Month, All Dates */}
          <div className="flex-1 sm:flex-initial min-w-[130px] flex items-center gap-1.5 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-neutral-700">
            <Calendar size={14} className="text-primary shrink-0" />
            <select
              value={selectedDateRange}
              onChange={(e) => setSelectedDateRange(e.target.value as DateFilterOption)}
              className="bg-transparent text-xs font-bold text-neutral-700 outline-none cursor-pointer w-full"
            >
              <option value="all">All Dates</option>
              <option value="today">Today</option>
              <option value="this_week">This Week</option>
              <option value="this_month">This Month</option>
            </select>
          </div>

          {/* School Dropdown */}
          <select
            value={selectedSchool}
            onChange={(e) => setSelectedSchool(e.target.value)}
            className="flex-1 sm:flex-initial min-w-[110px] px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-neutral-700 outline-none cursor-pointer"
          >
            <option value="all">All Schools</option>
            {schoolsList.map((sch) => (
              <option key={sch} value={sch}>
                {sch}
              </option>
            ))}
          </select>

          {/* Status Dropdown */}
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="flex-1 sm:flex-initial min-w-[100px] px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-neutral-700 outline-none cursor-pointer"
          >
            <option value="all">All Statuses</option>
            <option value="active">Active</option>
            <option value="completed">Completed</option>
            <option value="inactive">Inactive</option>
          </select>

          {/* Refresh Button */}
          <button
            onClick={loadData}
            className="p-2 bg-slate-100 hover:bg-slate-200 rounded-xl text-neutral-700 transition-colors cursor-pointer shrink-0"
            title="Refresh Data"
          >
            <RefreshCw size={16} className={clsx(loading && "animate-spin")} />
          </button>
        </div>
      </div>

      {/* Student Directory Table / Cards */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="font-extrabold text-sm text-neutral-800 flex items-center gap-2">
              <GraduationCap size={18} className="text-primary" /> OJT Student Directory ({filteredStudents.length})
            </h3>
            {selectedDateRange !== 'all' && (
              <span className="text-[10px] font-black text-primary bg-primary/10 px-2.5 py-0.5 rounded-full border border-primary/20 uppercase tracking-wider">
                {dateRangeLabel} Data
              </span>
            )}
          </div>
          <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">
            Showing {filteredStudents.length} of {students.length} trainees
          </span>
        </div>

        {loading ? (
          <div className="p-12 text-center text-neutral-400 text-xs font-semibold flex flex-col items-center gap-2">
            <RefreshCw size={20} className="animate-spin text-primary" />
            <span>Loading OJT Student directory...</span>
          </div>
        ) : filteredStudents.length === 0 ? (
          <div className="p-12 text-center text-neutral-400 text-xs font-semibold flex flex-col items-center gap-2">
            <p>No OJT students found matching "{search || dateRangeLabel}".</p>
            {selectedDateRange !== 'all' && (
              <button
                onClick={() => setSelectedDateRange('all')}
                className="mt-1 text-primary hover:underline font-bold text-xs cursor-pointer"
              >
                Clear date filter to view all trainees
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto max-h-[580px] overflow-y-auto border border-slate-100 rounded-b-2xl scrollbar-thin">
            <table className="w-full text-left text-xs">
              <thead className="sticky top-0 z-10 bg-slate-100/95 backdrop-blur-xs text-neutral-600 font-extrabold uppercase text-[10px] tracking-wider border-b border-slate-200 shadow-xs">
                <tr>
                  <th className="p-3.5 pl-5">Student Name</th>
                  <th className="p-3.5">School</th>
                  <th className="p-3.5">Contact</th>
                  <th className="p-3.5 text-center">
                    {selectedDateRange === 'all' ? 'Progress (Completed / Req)' : `${dateRangeLabel} Hours / Total`}
                  </th>
                  <th className="p-3.5 text-center">Status</th>
                  <th className="p-3.5 pr-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-semibold text-neutral-800">
                {filteredStudents.map((st) => {
                  const pct = Math.min(100, Math.round((st.completedHours / st.requiredHours) * 100));
                  const stLogs = logs.filter((l) => l.studentId === st.id);
                  const stPeriodHours = Math.round((studentRangeHoursMap.get(st.id) || 0) * 100) / 100;
                  const todayStr = new Date().toISOString().split('T')[0];
                  const todayLog = stLogs.find((l) => l.date === todayStr);

                  return (
                    <tr key={st.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="p-3.5 pl-5">
                        <div className="font-extrabold text-sm text-neutral-900">{st.name}</div>
                        <div className="text-[11px] text-neutral-400 font-normal">{st.email}</div>
                      </td>
                      <td className="p-3.5">
                        <span className="bg-slate-100 px-2.5 py-1 rounded-lg border border-slate-200 text-neutral-700 font-bold">
                          {st.school}
                        </span>
                      </td>
                      <td className="p-3.5">
                        <div>{st.phone || '—'}</div>
                        <div className="text-[10px] text-neutral-400 truncate max-w-[150px]">{st.address || ''}</div>
                      </td>
                      <td className="p-3.5 text-center">
                        {selectedDateRange === 'all' ? (
                          <>
                            <div className="font-black text-blue-600">{st.completedHours} / {st.requiredHours} hrs</div>
                            <div className="w-24 h-2 bg-blue-100 rounded-full mx-auto mt-1 overflow-hidden border border-blue-200">
                              <div
                                className="h-full bg-blue-600 rounded-full"
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                          </>
                        ) : (
                          <>
                            {todayLog && !todayLog.timeOut ? (
                              <>
                                <div className="font-black text-blue-600 text-sm flex items-center justify-center gap-1">
                                  <span>
                                    {(
                                      Math.round(
                                        (stPeriodHours +
                                          Math.max(
                                            0,
                                            (new Date().getTime() - new Date(todayLog.timeIn).getTime()) / (1000 * 3600)
                                          )) * 100
                                      ) / 100
                                    ).toFixed(2)}{' '}
                                    hrs
                                  </span>
                                  <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" title="Shift in progress" />
                                </div>
                                <div className="text-[10px] text-blue-500 font-semibold mt-0.5">
                                  In Progress • Total: {st.completedHours} / {st.requiredHours} hrs
                                </div>
                              </>
                            ) : (
                              <>
                                <div className="font-black text-blue-600 text-sm">{stPeriodHours} hrs</div>
                                <div className="text-[10px] text-blue-500 font-semibold mt-0.5">
                                  Total: {st.completedHours} / {st.requiredHours} hrs ({pct}%)
                                </div>
                              </>
                            )}
                          </>
                        )}
                      </td>
                      <td className="p-3.5 text-center">
                        <div className="flex flex-col items-center gap-1">
                          <span
                            className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider ${
                              st.status === 'completed'
                                ? 'bg-emerald-100 text-emerald-700 border border-emerald-200'
                                : st.status === 'active'
                                ? 'bg-primary/10 text-primary border border-primary/20'
                                : 'bg-slate-100 text-neutral-500'
                            }`}
                          >
                            {st.status}
                          </span>
                          {selectedDateRange === 'today' && todayLog && (
                            <span className={clsx(
                              "text-[9px] font-extrabold px-1.5 py-0.5 rounded",
                              !todayLog.timeOut ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-slate-100 text-slate-600"
                            )}>
                              {!todayLog.timeOut ? '● Timed In' : 'Timed Out'}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="p-3.5 pr-5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => setSelectedStudentLogs({ student: st, logs: stLogs })}
                            className="p-1.5 bg-slate-100 hover:bg-slate-200 text-neutral-700 rounded-lg transition-colors cursor-pointer"
                            title="View Attendance Logs"
                          >
                            <Calendar size={14} />
                          </button>
                          <button
                            onClick={() => {
                              setEditingStudent(st);
                              setShowModal(true);
                            }}
                            className="p-1.5 bg-primary/10 hover:bg-primary/20 text-primary rounded-lg transition-colors cursor-pointer"
                            title="Edit Record"
                          >
                            <Edit3 size={14} />
                          </button>
                          <button
                            onClick={() => handleDelete(st)}
                            className="p-1.5 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg transition-colors cursor-pointer"
                            title="Delete Record"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add / Edit Student Modal */}
      {showModal && (
        <OjtStudentModal
          studentToEdit={editingStudent}
          onClose={() => {
            setShowModal(false);
            setEditingStudent(null);
          }}
          onSaved={loadData}
        />
      )}

      {/* View Student Logs Modal */}
      {selectedStudentLogs && (
        <div 
          className="fixed inset-0 z-[200] flex items-center justify-center p-4"
          onClick={() => setSelectedStudentLogs(null)}
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-3xl p-6 w-full max-w-2xl shadow-2xl border border-slate-200 space-y-4 max-h-[85vh] overflow-y-auto"
          >
            <div className="flex justify-between items-center pb-2 border-b border-slate-100">
              <div>
                <h3 className="font-extrabold text-base text-neutral-800">
                  {selectedStudentLogs.student.name} — Attendance Logs
                </h3>
                <p className="text-xs text-neutral-500 font-semibold">
                  {selectedStudentLogs.student.school} • Total Logs: {selectedStudentLogs.logs.length}
                </p>
              </div>
              <button
                onClick={() => setSelectedStudentLogs(null)}
                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-neutral-700 font-bold text-xs rounded-xl"
              >
                Close
              </button>
            </div>

            <div className="space-y-2.5">
              {selectedStudentLogs.logs.length === 0 ? (
                <p className="text-xs text-neutral-400 italic text-center py-6">
                  No attendance records found for this student.
                </p>
              ) : (
                selectedStudentLogs.logs.map((l) => (
                  <div key={l.id} className="bg-slate-50 p-3 rounded-2xl border border-slate-200/80 text-xs flex justify-between items-center group">
                    <div>
                      <span className="font-extrabold text-neutral-800 block">{l.date}</span>
                      <span className="text-[11px] text-neutral-500 font-medium">
                        In: {l.timeIn ? new Date(l.timeIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—'} |
                        Out: {l.timeOut ? new Date(l.timeOut).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Active'}
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <span className="font-black text-primary block">
                          {l.timeOut 
                            ? `${l.totalHoursWorked || 0} hrs` 
                            : `In Progress (${(Math.max(0, (new Date().getTime() - new Date(l.timeIn).getTime()) / (1000 * 3600))).toFixed(1)} hrs)`}
                        </span>
                        <span className="text-[10px] font-bold text-neutral-400 uppercase">{l.status}</span>
                      </div>
                      <button
                        onClick={() => setEditingLog(l)}
                        className="p-1.5 bg-primary/10 hover:bg-primary/20 text-primary rounded-lg transition-colors cursor-pointer sm:opacity-0 sm:group-hover:opacity-100"
                        title="Edit Log"
                      >
                        <Edit3 size={14} />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Edit Log Modal */}
      {editingLog && (
        <OjtLogEditModal
          log={editingLog}
          onClose={() => setEditingLog(null)}
          onSaved={async () => {
            setEditingLog(null);
            await loadData();
            // Also refresh the selected student logs so the modal view updates instantly
            if (selectedStudentLogs) {
              const updatedLogs = await OjtService.getStudentAttendanceLogs(selectedStudentLogs.student.id);
              setSelectedStudentLogs({ student: selectedStudentLogs.student, logs: updatedLogs });
            }
          }}
        />
      )}
      {/* ── Custom Delete Confirmation Modal ── */}
      {deleteConfirmStudent && (
        <div 
          className="fixed inset-0 z-[300] flex items-center justify-center p-4"
          onClick={() => setDeleteConfirmStudent(null)}
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-3xl p-6 w-full max-w-sm shadow-2xl border border-slate-200 text-center space-y-4"
          >
            <div className="w-14 h-14 bg-red-50 text-red-500 rounded-2xl flex items-center justify-center mx-auto shadow-inner border border-red-100">
              <AlertTriangle size={28} />
            </div>
            <div>
              <h3 className="font-black text-lg text-neutral-800">Delete OJT Student?</h3>
              <p className="text-xs text-neutral-500 font-semibold mt-1">
                You are about to permanently delete the record for:
              </p>
              <p className="text-sm font-black text-neutral-900 mt-1">
                {deleteConfirmStudent.name}
              </p>
              <p className="text-xs text-neutral-400 font-medium mt-0.5">
                {deleteConfirmStudent.school}
              </p>
              <p className="text-xs text-red-500 font-bold mt-2">
                This action cannot be undone. All attendance logs will also be removed.
              </p>
            </div>
            <div className="flex gap-2.5 pt-1">
              <button
                type="button"
                onClick={() => setDeleteConfirmStudent(null)}
                disabled={deleteLoading}
                className="flex-1 py-3 rounded-xl font-bold text-xs bg-slate-100 text-neutral-700 hover:bg-slate-200 transition-all cursor-pointer disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmDelete}
                disabled={deleteLoading}
                className="flex-1 py-3 rounded-xl font-bold text-xs bg-red-600 hover:bg-red-700 text-white shadow-md transition-all cursor-pointer disabled:opacity-50 flex items-center justify-center gap-1.5"
              >
                <Trash2 size={13} />
                {deleteLoading ? 'Deleting...' : 'Yes, Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
