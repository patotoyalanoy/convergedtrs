import { useEffect, useState } from 'react';
import { 
  GraduationCap, Search, Filter, Plus, Edit3, Trash2, Clock, 
  CheckCircle2, AlertCircle, Download, RefreshCw, Calendar, UserCheck, ShieldCheck, Mail, Phone, MapPin
} from 'lucide-react';
import { OjtStudent, OjtAttendanceRecord } from '@/types/ojt';
import { OjtService } from '@/services/ojt/ojtService';
import OjtStudentModal from '@/components/ojt/OjtStudentModal';

export default function AdminOjtManagement() {
  const [students, setStudents] = useState<OjtStudent[]>([]);
  const [logs, setLogs] = useState<OjtAttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Search & Filter
  const [search, setSearch] = useState('');
  const [selectedSchool, setSelectedSchool] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');

  // Modals
  const [showModal, setShowModal] = useState(false);
  const [editingStudent, setEditingStudent] = useState<OjtStudent | null>(null);
  const [selectedStudentLogs, setSelectedStudentLogs] = useState<{ student: OjtStudent; logs: OjtAttendanceRecord[] } | null>(null);

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

  const handleDelete = async (id: string, name: string) => {
    if (confirm(`Are you sure you want to delete OJT Student record for "${name}"?`)) {
      await OjtService.deleteStudent(id);
      loadData();
    }
  };

  const handleExportCSV = () => {
    if (students.length === 0) return;

    let csvContent = 'data:text/csv;charset=utf-8,';
    csvContent += 'First Name,Last Name,Email,Phone,Address,School,Required Hours,Completed Hours,Remaining Hours,Status\n';

    students.forEach((s) => {
      csvContent += `"${s.firstName}","${s.lastName}","${s.email}","${s.phone}","${s.address}","${s.school}",${s.requiredHours},${s.completedHours},${s.remainingHours},"${s.status}"\n`;
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `OJT_Students_Report_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Filter Unique Schools for filter dropdown
  const schoolsList = Array.from(new Set(students.map((s) => s.school))).filter(Boolean);

  const filteredStudents = students.filter((s) => {
    const matchesSearch =
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.email.toLowerCase().includes(search.toLowerCase()) ||
      s.school.toLowerCase().includes(search.toLowerCase());
    const matchesSchool = selectedSchool === 'all' || s.school === selectedSchool;
    const matchesStatus = selectedStatus === 'all' || s.status === selectedStatus;
    return matchesSearch && matchesSchool && matchesStatus;
  });

  // Summary Metrics
  const totalStudents = students.length;
  const totalCompletedHoursSum = Math.round(students.reduce((sum, s) => sum + s.completedHours, 0));
  const activeTodayCount = logs.filter((l) => l.date === new Date().toISOString().split('T')[0]).length;
  const lateTodayCount = logs.filter((l) => l.date === new Date().toISOString().split('T')[0] && l.isLate).length;
  const overtimeCount = logs.filter((l) => l.isOvertime).length;

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-primary via-orange-500 to-amber-600 rounded-3xl p-6 text-white shadow-lg flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-black uppercase tracking-widest bg-white/20 px-3 py-0.5 rounded-full border border-white/30 backdrop-blur-md">
              OJT Monitoring Module
            </span>
          </div>
          <h1 className="text-2xl font-black text-white leading-tight">
            OJT Student Management & Analytics
          </h1>
          <p className="text-xs text-orange-100 font-medium mt-0.5">
            Monitor On-the-Job Trainee hours, attendance schedules, overtime, and progress
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={handleExportCSV}
            className="bg-white/20 hover:bg-white/30 text-white font-extrabold px-4 py-2.5 rounded-2xl text-xs flex items-center gap-1.5 backdrop-blur-md transition-all active:scale-95 cursor-pointer border border-white/30"
          >
            <Download size={15} /> Export CSV
          </button>
          <button
            onClick={() => {
              setEditingStudent(null);
              setShowModal(true);
            }}
            className="bg-white text-navy-900 font-black px-4 py-2.5 rounded-2xl text-xs flex items-center gap-1.5 shadow-md active:scale-95 transition-all cursor-pointer hover:bg-slate-100"
          >
            <Plus size={16} /> Register New OJT Student
          </button>
        </div>
      </div>

      {/* Analytics Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3.5">
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
          <span className="text-[10px] font-extrabold text-neutral-400 uppercase tracking-wider block">Total Trainees</span>
          <span className="text-xl font-black text-neutral-900 block mt-1">{totalStudents}</span>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
          <span className="text-[10px] font-extrabold text-neutral-400 uppercase tracking-wider block">Completed Hours</span>
          <span className="text-xl font-black text-emerald-600 block mt-1">{totalCompletedHoursSum} hrs</span>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
          <span className="text-[10px] font-extrabold text-neutral-400 uppercase tracking-wider block">Active Today</span>
          <span className="text-xl font-black text-primary block mt-1">{activeTodayCount}</span>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
          <span className="text-[10px] font-extrabold text-neutral-400 uppercase tracking-wider block">Late Logs Today</span>
          <span className="text-xl font-black text-orange-600 block mt-1">{lateTodayCount}</span>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs col-span-2 sm:col-span-1">
          <span className="text-[10px] font-extrabold text-neutral-400 uppercase tracking-wider block">Overtime Logs</span>
          <span className="text-xl font-black text-blue-600 block mt-1">{overtimeCount}</span>
        </div>
      </div>

      {/* Search & Filter Toolbar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400" />
          <input
            type="text"
            placeholder="Search student name, school, email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-primary/20 outline-none"
          />
        </div>

        <div className="flex items-center gap-2.5 w-full sm:w-auto">
          <select
            value={selectedSchool}
            onChange={(e) => setSelectedSchool(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-neutral-700 outline-none cursor-pointer"
          >
            <option value="all">All Schools</option>
            {schoolsList.map((sch) => (
              <option key={sch} value={sch}>
                {sch}
              </option>
            ))}
          </select>

          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-neutral-700 outline-none cursor-pointer"
          >
            <option value="all">All Statuses</option>
            <option value="active">Active</option>
            <option value="completed">Completed</option>
            <option value="inactive">Inactive</option>
          </select>

          <button
            onClick={loadData}
            className="p-2 bg-slate-100 hover:bg-slate-200 rounded-xl text-neutral-700 transition-colors cursor-pointer"
            title="Refresh Data"
          >
            <RefreshCw size={16} />
          </button>
        </div>
      </div>

      {/* Student Directory Table / Cards */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="font-extrabold text-sm text-neutral-800 flex items-center gap-2">
            <GraduationCap size={18} className="text-primary" /> OJT Student Directory ({filteredStudents.length})
          </h3>
          <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">
            Showing {filteredStudents.length} of {students.length}
          </span>
        </div>

        {loading ? (
          <div className="p-12 text-center text-neutral-400 text-xs font-semibold">
            Loading OJT Student directory...
          </div>
        ) : filteredStudents.length === 0 ? (
          <div className="p-12 text-center text-neutral-400 text-xs font-semibold">
            No OJT students found matching "{search}".
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-neutral-500 font-extrabold uppercase text-[10px] tracking-wider border-b border-slate-200">
                <tr>
                  <th className="p-3.5 pl-5">Student Name</th>
                  <th className="p-3.5">School</th>
                  <th className="p-3.5">Contact</th>
                  <th className="p-3.5 text-center">Progress (Completed / Req)</th>
                  <th className="p-3.5 text-center">Status</th>
                  <th className="p-3.5 pr-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-semibold text-neutral-800">
                {filteredStudents.map((st) => {
                  const pct = Math.min(100, Math.round((st.completedHours / st.requiredHours) * 100));
                  const stLogs = logs.filter((l) => l.studentId === st.id);

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
                        <div className="font-black text-neutral-900">{st.completedHours} / {st.requiredHours} hrs</div>
                        <div className="w-24 h-2 bg-slate-100 rounded-full mx-auto mt-1 overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-primary to-emerald-500 rounded-full"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </td>
                      <td className="p-3.5 text-center">
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
                            onClick={() => handleDelete(st.id, st.name)}
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
        <div className="fixed inset-0 z-[200] bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 w-full max-w-2xl shadow-2xl border border-neutral-200 space-y-4 max-h-[85vh] overflow-y-auto">
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
                  <div key={l.id} className="bg-slate-50 p-3 rounded-2xl border border-slate-200/80 text-xs flex justify-between items-center">
                    <div>
                      <span className="font-extrabold text-neutral-800 block">{l.date}</span>
                      <span className="text-[11px] text-neutral-500 font-medium">
                        In: {l.timeIn ? new Date(l.timeIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—'} |
                        Out: {l.timeOut ? new Date(l.timeOut).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Active'}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="font-black text-primary block">{l.totalHoursWorked || 0} hrs</span>
                      <span className="text-[10px] font-bold text-neutral-400 uppercase">{l.status}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
