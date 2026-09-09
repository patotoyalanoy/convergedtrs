import { useState, useEffect } from 'react';
import { Plus, Search, UserSquare2, MoreVertical, RefreshCw, Trash2, Edit3, CheckCircle2, Key, ShieldCheck, Lock } from 'lucide-react';
import { clsx } from 'clsx';
import { supabase } from '@/lib/supabase/client';

interface EmployeeItem {
  id: string;
  name: string;
  role: string;
  teamId: string;
  team: string;
  site: string;
  pinHash: string;
  status: string;
}

interface TeamOption {
  id: string;
  name: string;
}

export default function EmployeesManagement() {
  const [employees, setEmployees] = useState<EmployeeItem[]>([]);
  const [teams, setTeams] = useState<TeamOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // Modals state
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingEmp, setEditingEmp] = useState<EmployeeItem | null>(null);
  const [deletingEmpId, setDeletingEmpId] = useState<string | null>(null);

  // Form state for creating / editing employee with PIN
  const [formData, setFormData] = useState({
    name: '',
    role: 'Technician',
    teamId: '',
    pinHash: '8888',
    status: 'active'
  });

  const [toast, setToast] = useState<string | null>(null);
  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3500);
  };

  const fetchEmployeesAndTeams = async () => {
    setLoading(true);
    try {
      const [empRes, teamRes, siteRes] = await Promise.all([
        supabase.from('employees').select('*').order('created_at', { ascending: false }),
        supabase.from('teams').select('id, name, site_id'),
        supabase.from('sites').select('id, name')
      ]);

      const teamMap = new Map<string, { name: string; site_id?: string }>();
      if (teamRes.data) {
        teamRes.data.forEach(t => teamMap.set(t.id, t));
        setTeams(teamRes.data.map(t => ({ id: t.id, name: t.name })));
        if (teamRes.data.length > 0 && !formData.teamId) {
          setFormData(prev => ({ ...prev, teamId: teamRes.data[0].id }));
        }
      }

      const siteMap = new Map<string, string>();
      if (siteRes.data) {
        siteRes.data.forEach(s => siteMap.set(s.id, s.name));
      }

      if (empRes.data) {
        const mapped: EmployeeItem[] = empRes.data.map(e => {
          const teamObj = teamMap.get(e.team_id);
          const teamName = teamObj ? teamObj.name : 'Unassigned';
          const siteName = teamObj && teamObj.site_id ? (siteMap.get(teamObj.site_id) || 'Unassigned Site') : 'Default Site';
          return {
            id: e.id,
            name: e.name,
            role: e.role || 'Technician',
            teamId: e.team_id || '',
            team: teamName,
            site: siteName,
            pinHash: e.pin_hash || '8888',
            status: e.status === 'active' ? 'Active' : 'Inactive'
          };
        });
        setEmployees(mapped);
      }
    } catch (err) {
      console.error('Error fetching employees:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmployeesAndTeams();
  }, []);

  const handleSaveEmployee = async () => {
    if (!formData.name.trim()) {
      alert('Employee name is required.');
      return;
    }
    if (formData.pinHash.length !== 4) {
      alert('Security PIN must be exactly 4 digits.');
      return;
    }

    try {
      if (editingEmp) {
        // Try update with team_id; if schema cache error, retry without it
        const updFull = { name: formData.name.trim(), role: formData.role, team_id: formData.teamId || null, pin_hash: formData.pinHash, status: formData.status };
        const updMin  = { name: formData.name.trim(), role: formData.role, pin_hash: formData.pinHash, status: formData.status };

        const uRes1 = await supabase.from('employees').update(updFull).eq('id', editingEmp.id);
        if (uRes1.error) {
          if (uRes1.error.message?.toLowerCase().includes('team_id') || uRes1.error.code === 'PGRST204') {
            const uRes2 = await supabase.from('employees').update(updMin).eq('id', editingEmp.id);
            if (uRes2.error) throw uRes2.error;
            // Update team_members: remove old, insert new
            if (formData.teamId) {
              await supabase.from('team_members').delete().eq('employee_id', editingEmp.id);
              await supabase.from('team_members').insert({ team_id: formData.teamId, employee_id: editingEmp.id });
            }
          } else {
            throw uRes1.error;
          }
        }
        showToast(`Employee ${formData.name} updated! PIN is ${formData.pinHash}`);
      } else {
        const newEmpId = crypto.randomUUID();
        const insFull = { id: newEmpId, name: formData.name.trim(), role: formData.role, team_id: formData.teamId || null, pin_hash: formData.pinHash, status: formData.status };
        const insMin  = { id: newEmpId, name: formData.name.trim(), role: formData.role, pin_hash: formData.pinHash, status: formData.status };

        const iRes1 = await supabase.from('employees').insert(insFull);
        if (iRes1.error) {
          if (iRes1.error.message?.toLowerCase().includes('team_id') || iRes1.error.code === 'PGRST204') {
            const iRes2 = await supabase.from('employees').insert(insMin);
            if (iRes2.error) throw iRes2.error;
            // Link via team_members junction table
            if (formData.teamId) {
              await supabase.from('team_members').insert({ team_id: formData.teamId, employee_id: newEmpId });
            }
          } else {
            throw iRes1.error;
          }
        } else if (formData.teamId) {
          // Also insert into team_members for consistency
          await supabase.from('team_members').insert({ team_id: formData.teamId, employee_id: newEmpId }).maybeSingle();
        }
        showToast(`Employee ${formData.name} created! Login PIN: ${formData.pinHash}`);
      }

      setShowAddModal(false);
      setEditingEmp(null);
      setFormData({ name: '', role: 'Technician', teamId: teams[0]?.id || '', pinHash: '8888', status: 'active' });
      fetchEmployeesAndTeams();
    } catch (err: any) {
      alert('Failed to save employee: ' + (err.message || 'Supabase error'));
    }
  };

  const handleDeleteEmployee = async (id: string) => {
    try {
      const { error } = await supabase.from('employees').delete().eq('id', id);
      if (error) throw error;

      showToast('Employee account removed.');
      setDeletingEmpId(null);
      fetchEmployeesAndTeams();
    } catch (err: any) {
      alert('Failed to delete employee: ' + err.message);
    }
  };

  const openEditModal = (emp: EmployeeItem) => {
    setEditingEmp(emp);
    setFormData({
      name: emp.name,
      role: emp.role,
      teamId: emp.teamId,
      pinHash: emp.pinHash,
      status: emp.status.toLowerCase()
    });
    setShowAddModal(true);
  };

  const filteredEmployees = employees.filter(e => 
    e.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    e.team.toLowerCase().includes(searchTerm.toLowerCase()) ||
    e.site.toLowerCase().includes(searchTerm.toLowerCase()) ||
    e.role.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-12 relative">

      {/* Floating Toast Notification */}
      {toast && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[200] bg-neutral-900/95 text-white px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-2 text-xs font-black border border-neutral-700 animate-bounce">
          <CheckCircle2 size={18} className="text-emerald-400" />
          <span>{toast}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black text-navy-900 tracking-tight">Employee Accounts</h1>
          <p className="text-xs text-slate-500 mt-0.5 font-semibold">Manage technician accounts, assign teams, and configure 4-digit authentication PINs</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={fetchEmployeesAndTeams} className="flex items-center gap-1.5 px-3 py-2 border border-slate-200 rounded-xl text-navy-900 hover:bg-slate-100/80 text-xs font-bold shadow-2xs transition-colors cursor-pointer" title="Refresh">
            <RefreshCw size={13} className={clsx(loading && 'animate-spin')} />
            Refresh
          </button>
          <button
            onClick={() => {
              setEditingEmp(null);
              setFormData({ name: '', role: 'Technician', teamId: teams[0]?.id || '', pinHash: '8888', status: 'active' });
              setShowAddModal(true);
            }}
            className="flex items-center gap-2 bg-primary hover:bg-primary-dark text-white px-4 py-2 rounded-xl text-xs font-black shadow-sm transition-all active:scale-95 cursor-pointer"
          >
            <Plus size={15} /> Add Employee
          </button>
        </div>
      </div>

      {/* Employees Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-x-auto">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between gap-4 bg-slate-50/60">
          <div className="relative flex-1 max-w-md">
            <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              type="text" 
              placeholder="Search employees by name, team, or role..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-primary/30 focus:border-primary text-xs font-bold text-navy-900 bg-white"
            />
          </div>
          <span className="text-xs font-extrabold text-navy-900 bg-navy-50 px-3 py-1 rounded-xl border border-navy-100/80">
            {filteredEmployees.length} Registered Accounts
          </span>
        </div>

        {loading ? (
          <div className="p-12 text-center text-slate-500 flex flex-col items-center gap-2 font-medium">
            <RefreshCw size={24} className="animate-spin text-primary" />
            <span>Loading employees from database...</span>
          </div>
        ) : filteredEmployees.length === 0 ? (
          <div className="p-12 text-center text-slate-500 font-medium">
            No employees found. Click "Add Employee" to register one.
          </div>
        ) : (
          <table className="w-full min-w-[700px] text-sm text-left">
            <thead className="bg-[#0B192C] text-white font-extrabold border-b border-navy-800 text-[11px] uppercase tracking-wider">
              <tr>
                <th className="px-6 py-4">Employee</th>
                <th className="px-6 py-4">Role</th>
                <th className="px-6 py-4">Team</th>
                <th className="px-6 py-4">Security PIN</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredEmployees.map((emp) => (
                <tr key={emp.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="px-6 py-4 font-bold text-navy-900 flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-navy-900 text-white flex items-center justify-center font-black text-sm shadow-2xs">
                      {emp.name.charAt(0)}
                    </div>
                    <div>
                      <p className="font-extrabold text-navy-900">{emp.name}</p>
                      <p className="text-[11px] text-slate-400 font-mono">ID: {emp.id.slice(0, 8)}</p>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-slate-700 font-bold">{emp.role}</td>
                  <td className="px-6 py-4 text-slate-700 font-bold">{emp.team}</td>
                  <td className="px-6 py-4">
                    <span className="font-mono text-xs font-black bg-navy-50 text-navy-900 px-3 py-1 rounded-lg border border-navy-100 flex items-center gap-1.5 w-fit">
                      <Lock size={12} className="text-amber-500" /> {emp.pinHash}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={clsx("px-2.5 py-1 rounded-full text-xs font-black", 
                      emp.status === 'Active' ? "bg-emerald-100 text-emerald-700" : "bg-neutral-200 text-neutral-600"
                    )}>
                      {emp.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button 
                        onClick={() => openEditModal(emp)}
                        className="p-2 text-neutral-500 hover:text-primary hover:bg-primary/10 rounded-lg transition-colors"
                        title="Edit Employee & PIN"
                      >
                        <Edit3 size={16} />
                      </button>
                      <button 
                        onClick={() => setDeletingEmpId(emp.id)}
                        className="p-2 text-neutral-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Delete Employee Account"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* ── Add / Edit Employee Modal ── */}
      {showAddModal && (
        <div className="fixed inset-0 z-[150] bg-transparent flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 w-full max-w-md shadow-md border border-neutral-300 space-y-4">
            <h3 className="font-black text-xl text-neutral-800">
              {editingEmp ? 'Edit Employee & Security PIN' : 'Register New Employee Account'}
            </h3>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-neutral-600 uppercase mb-1">Full Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Maria Santos"
                  className="w-full px-3.5 py-2.5 text-sm font-semibold bg-neutral-50 rounded-xl border border-neutral-300 focus:ring-2 focus:ring-primary outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-neutral-600 uppercase mb-1">Assigned Role</label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  className="w-full px-3.5 py-2.5 text-sm font-semibold bg-neutral-50 rounded-xl border border-neutral-300 focus:ring-2 focus:ring-primary outline-none cursor-pointer"
                >
                  <option value="Technician">Technician</option>
                  <option value="Team Lead">Team Lead</option>
                  <option value="Field Supervisor">Field Supervisor</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-neutral-600 uppercase mb-1">Assigned Team</label>
                <select
                  value={formData.teamId}
                  onChange={(e) => setFormData({ ...formData, teamId: e.target.value })}
                  className="w-full px-3.5 py-2.5 text-sm font-semibold bg-neutral-50 rounded-xl border border-neutral-300 focus:ring-2 focus:ring-primary outline-none cursor-pointer"
                >
                  {teams.map(t => (
                    <option key={t.id} value={t.id}>{t.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-neutral-600 uppercase mb-1 flex items-center gap-1">
                  <Key size={14} className="text-amber-500" /> 4-Digit Security PIN (Login Credentials)
                </label>
                <input
                  type="text"
                  maxLength={4}
                  value={formData.pinHash}
                  onChange={(e) => setFormData({ ...formData, pinHash: e.target.value.replace(/\D/g, '') })}
                  placeholder="e.g. 8888 or 1234"
                  className="w-full px-3.5 py-2.5 text-center font-mono font-black tracking-widest text-xl bg-neutral-50 rounded-xl border border-neutral-300 focus:ring-2 focus:ring-primary outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-neutral-600 uppercase mb-1">Account Status</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  className="w-full px-3.5 py-2.5 text-sm font-semibold bg-neutral-50 rounded-xl border border-neutral-300 focus:ring-2 focus:ring-primary outline-none cursor-pointer"
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button 
                onClick={() => setShowAddModal(false)}
                className="flex-1 py-3 rounded-xl font-bold text-xs bg-neutral-100 text-neutral-700 hover:bg-neutral-200 cursor-pointer"
              >
                Cancel
              </button>
              <button 
                onClick={handleSaveEmployee}
                className="flex-1 py-3 rounded-xl font-bold text-xs bg-primary text-white hover:bg-primary-dark shadow-md cursor-pointer"
              >
                Save Account
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Delete Confirmation Modal ── */}
      {deletingEmpId && (
        <div className="fixed inset-0 z-[150] bg-transparent flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 w-full max-w-sm shadow-md border border-neutral-300 text-center space-y-4">
            <div className="w-12 h-12 bg-red-100 text-red-600 rounded-2xl flex items-center justify-center mx-auto">
              <Trash2 size={24} />
            </div>
            <h3 className="font-extrabold text-lg text-neutral-800">Delete Employee?</h3>
            <p className="text-xs text-neutral-500">Are you sure you want to remove this employee account from Supabase?</p>

            <div className="flex gap-3 pt-2">
              <button 
                onClick={() => setDeletingEmpId(null)}
                className="flex-1 py-3 rounded-xl font-bold text-xs bg-neutral-100 text-neutral-700 hover:bg-neutral-200 cursor-pointer"
              >
                Cancel
              </button>
              <button 
                onClick={() => handleDeleteEmployee(deletingEmpId)}
                className="flex-1 py-3 rounded-xl font-bold text-xs bg-red-600 text-white hover:bg-red-700 shadow-md cursor-pointer"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
