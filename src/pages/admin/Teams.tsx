import { useState, useEffect } from 'react';
import { Plus, Search, Users, MoreVertical, RefreshCw, Trash2, Edit3, CheckCircle2, UserPlus, Key, ShieldCheck } from 'lucide-react';
import { clsx } from 'clsx';
import { supabase } from '@/lib/supabase/client';

interface TeamItem {
  id: string;
  name: string;
  siteId: string;
  siteName: string;
  createdAt: string;
  memberCount: number;
}

interface SiteOption {
  id: string;
  name: string;
}

interface EmployeeItem {
  id: string;
  name: string;
  role: string;
  pinHash?: string;
}

export default function TeamsManagement() {
  const [teams, setTeams] = useState<TeamItem[]>([]);
  const [sites, setSites] = useState<SiteOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // Modals state
  const [showAddModal, setShowAddModal] = useState(false);
  const [viewTeamMembers, setViewTeamMembers] = useState<{ teamName: string; members: EmployeeItem[] } | null>(null);
  const [deletingTeamId, setDeletingTeamId] = useState<string | null>(null);

  // Form state for creating Team + Initial Employee User
  const [formData, setFormData] = useState({
    teamName: '',
    siteId: '',
    leadName: '',
    leadPin: '8888'
  });

  const [toast, setToast] = useState<string | null>(null);
  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3500);
  };

  const fetchTeamsAndSites = async () => {
    setLoading(true);
    try {
      const [teamRes, siteRes, empRes] = await Promise.all([
        supabase.from('teams').select('*').order('created_at', { ascending: false }),
        supabase.from('sites').select('id, name'),
        supabase.from('employees').select('id, name, role, team_id, pin_hash')
      ]);

      const siteMap = new Map<string, string>();
      if (siteRes.data) {
        siteRes.data.forEach(s => siteMap.set(s.id, s.name));
        setSites(siteRes.data.map(s => ({ id: s.id, name: s.name })));
        if (siteRes.data.length > 0 && !formData.siteId) {
          setFormData(prev => ({ ...prev, siteId: siteRes.data[0].id }));
        }
      }

      const teamMemberCounts = new Map<string, number>();
      if (empRes.data) {
        empRes.data.forEach(e => {
          if (e.team_id) {
            teamMemberCounts.set(e.team_id, (teamMemberCounts.get(e.team_id) || 0) + 1);
          }
        });
      }

      if (teamRes.data) {
        const mapped: TeamItem[] = teamRes.data.map(t => ({
          id: t.id,
          name: t.name,
          siteId: t.site_id || '',
          siteName: t.site_id ? (siteMap.get(t.site_id) || 'Assigned Site') : 'Default Site',
          createdAt: t.created_at ? new Date(t.created_at).toLocaleDateString() : 'Active',
          memberCount: teamMemberCounts.get(t.id) || 0
        }));
        setTeams(mapped);
      }
    } catch (err) {
      console.error('Error fetching teams:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTeamsAndSites();
  }, []);

  const handleCreateTeamAndLead = async () => {
    if (!formData.teamName.trim()) {
      alert('Team name is required.');
      return;
    }
    if (formData.leadPin.length !== 4) {
      alert('Security PIN must be exactly 4 digits.');
      return;
    }

    try {
      const newTeamId = crypto.randomUUID();

      // 1. Insert Team — try with site_id first; if schema cache error, retry without it
      let teamErr: any = null;
      const teamPayloadFull = { id: newTeamId, name: formData.teamName.trim(), site_id: formData.siteId || null };
      const teamPayloadMin = { id: newTeamId, name: formData.teamName.trim() };

      const res1 = await supabase.from('teams').insert(teamPayloadFull);
      if (res1.error) {
        // If schema cache error for site_id, retry without that column
        if (res1.error.message?.toLowerCase().includes('site_id') || res1.error.code === 'PGRST204') {
          const res2 = await supabase.from('teams').insert(teamPayloadMin);
          teamErr = res2.error;
        } else {
          teamErr = res1.error;
        }
      }
      if (teamErr) throw teamErr;

      // 2. If Lead Name provided, create employee user account with 4-digit PIN
      if (formData.leadName.trim()) {
        const newEmpId = crypto.randomUUID();

        // Try with team_id; if schema cache error retry without team_id then link via team_members
        const empPayloadFull = { id: newEmpId, name: formData.leadName.trim(), role: 'Team Lead', pin_hash: formData.leadPin, team_id: newTeamId, status: 'active' };
        const empPayloadMin  = { id: newEmpId, name: formData.leadName.trim(), role: 'Team Lead', pin_hash: formData.leadPin, status: 'active' };

        const eRes1 = await supabase.from('employees').insert(empPayloadFull);
        if (eRes1.error) {
          if (eRes1.error.message?.toLowerCase().includes('team_id') || eRes1.error.code === 'PGRST204') {
            const eRes2 = await supabase.from('employees').insert(empPayloadMin);
            if (!eRes2.error) {
              // Link via team_members junction table
              await supabase.from('team_members').insert({ team_id: newTeamId, employee_id: newEmpId });
            } else {
              console.warn('Could not insert employee account:', eRes2.error);
            }
          } else {
            console.warn('Could not insert employee account:', eRes1.error);
          }
        } else {
          // Also link in junction table for consistency
          await supabase.from('team_members').insert({ team_id: newTeamId, employee_id: newEmpId }).maybeSingle();
        }
      }

      showToast(`Team "${formData.teamName}" created! User login PIN set to ${formData.leadPin}`);
      setShowAddModal(false);
      setFormData({ teamName: '', siteId: sites[0]?.id || '', leadName: '', leadPin: '8888' });
      fetchTeamsAndSites();
    } catch (err: any) {
      alert('Failed to create team: ' + (err.message || 'Supabase error'));
    }
  };

  const handleDeleteTeam = async (id: string) => {
    try {
      const { error } = await supabase.from('teams').delete().eq('id', id);
      if (error) throw error;

      showToast('Team deleted.');
      setDeletingTeamId(null);
      fetchTeamsAndSites();
    } catch (err: any) {
      alert('Failed to delete team: ' + err.message);
    }
  };

  const handleInspectTeamMembers = async (team: TeamItem) => {
    try {
      const { data } = await supabase
        .from('employees')
        .select('id, name, role, pin_hash')
        .eq('team_id', team.id);

      setViewTeamMembers({
        teamName: team.name,
        members: data ? data.map(d => ({ id: d.id, name: d.name, role: d.role || 'Technician', pinHash: d.pin_hash })) : []
      });
    } catch (e) {
      alert('Failed to load team members.');
    }
  };

  const filteredTeams = teams.filter(t =>
    t.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.siteName.toLowerCase().includes(searchTerm.toLowerCase())
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
          <h1 className="text-2xl font-black text-navy-900 tracking-tight">Teams & User Accounts</h1>
          <p className="text-xs text-slate-500 mt-0.5 font-semibold">Create field teams, assign sites, and provision technician login PINs</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={fetchTeamsAndSites} className="flex items-center gap-1.5 px-3 py-2 border border-slate-200 rounded-xl text-navy-900 hover:bg-slate-100/80 text-xs font-bold shadow-2xs transition-colors cursor-pointer" title="Refresh">
            <RefreshCw size={13} className={clsx(loading && 'animate-spin')} />
            Refresh
          </button>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 bg-primary hover:bg-primary-dark text-white px-4 py-2 rounded-xl text-xs font-black shadow-sm transition-all active:scale-95 cursor-pointer"
          >
            <Plus size={15} /> Add Team
          </button>
        </div>
      </div>

      {/* Teams Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-x-auto">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between gap-4 bg-slate-50/60">
          <div className="relative flex-1 max-w-md">
            <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              type="text" 
              placeholder="Search teams by name or site..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-primary/30 focus:border-primary text-xs font-bold text-navy-900 bg-white"
            />
          </div>
          <span className="text-xs font-extrabold text-navy-900 bg-navy-50 px-3 py-1 rounded-xl border border-navy-100/80">
            {filteredTeams.length} Active Teams
          </span>
        </div>

        {loading ? (
          <div className="p-12 text-center text-slate-500 flex flex-col items-center gap-2 font-medium">
            <RefreshCw size={24} className="animate-spin text-primary" />
            <span>Loading teams from Supabase database...</span>
          </div>
        ) : filteredTeams.length === 0 ? (
          <div className="p-12 text-center text-slate-500 font-medium">
            No teams configured. Click "Add Team" to create one.
          </div>
        ) : (
          <table className="w-full min-w-[700px] text-sm text-left">
            <thead className="bg-[#0B192C] text-white font-extrabold border-b border-navy-800 text-[11px] uppercase tracking-wider">
              <tr>
                <th className="px-6 py-4">Team Name</th>
                <th className="px-6 py-4">Assigned Site</th>
                <th className="px-6 py-4">Members</th>
                <th className="px-6 py-4">Created Date</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredTeams.map((team) => (
                <tr key={team.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="px-6 py-4 font-bold text-navy-900 flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-navy-900 text-white flex items-center justify-center font-black shadow-2xs">
                      <Users size={17} />
                    </div>
                    <span>{team.name}</span>
                  </td>
                  <td className="px-6 py-4 text-neutral-700 font-semibold">{team.siteName}</td>
                  <td className="px-6 py-4">
                    <button
                      onClick={() => handleInspectTeamMembers(team)}
                      className="bg-neutral-100 hover:bg-neutral-200 text-neutral-800 text-xs font-bold px-3 py-1 rounded-lg border border-neutral-200 flex items-center gap-1 cursor-pointer"
                    >
                      👥 {team.memberCount} Member(s)
                    </button>
                  </td>
                  <td className="px-6 py-4 text-neutral-500 font-medium">{team.createdAt}</td>
                  <td className="px-6 py-4">
                    <span className="px-2.5 py-1 rounded-full text-xs font-black bg-emerald-100 text-emerald-700">
                      Active
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button 
                        onClick={() => handleInspectTeamMembers(team)}
                        className="p-2 text-neutral-500 hover:text-primary hover:bg-primary/10 rounded-lg transition-colors"
                        title="View Team Members"
                      >
                        <UserPlus size={16} />
                      </button>
                      <button 
                        onClick={() => setDeletingTeamId(team.id)}
                        className="p-2 text-neutral-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Delete Team"
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

      {/* ── Add New Team + User Provisioning Modal ── */}
      {showAddModal && (
        <div className="fixed inset-0 z-[150] bg-transparent flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 w-full max-w-md shadow-md border border-neutral-300 space-y-4">
            <h3 className="font-black text-xl text-neutral-800">Add New Team & Account</h3>
            <p className="text-xs text-neutral-500">Create a field team and automatically provision a team lead user account with login PIN.</p>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-neutral-600 uppercase mb-1">Team Name</label>
                <input
                  type="text"
                  value={formData.teamName}
                  onChange={(e) => setFormData({ ...formData, teamName: e.target.value })}
                  placeholder="e.g. Team Metro Alpha"
                  className="w-full px-3.5 py-2.5 text-sm font-semibold bg-neutral-50 rounded-xl border border-neutral-300 focus:ring-2 focus:ring-primary outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-neutral-600 uppercase mb-1">Assigned Converge Site</label>
                <select
                  value={formData.siteId}
                  onChange={(e) => setFormData({ ...formData, siteId: e.target.value })}
                  className="w-full px-3.5 py-2.5 text-sm font-semibold bg-neutral-50 rounded-xl border border-neutral-300 focus:ring-2 focus:ring-primary outline-none cursor-pointer"
                >
                  {sites.map(s => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>

              <div className="pt-2 border-t border-neutral-100">
                <label className="block text-xs font-bold text-primary uppercase mb-1 flex items-center gap-1">
                  <ShieldCheck size={14} /> Initial Team Lead User Name
                </label>
                <input
                  type="text"
                  value={formData.leadName}
                  onChange={(e) => setFormData({ ...formData, leadName: e.target.value })}
                  placeholder="e.g. Admin User / Team Lead Name"
                  className="w-full px-3.5 py-2.5 text-sm font-semibold bg-neutral-50 rounded-xl border border-neutral-300 focus:ring-2 focus:ring-primary outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-neutral-600 uppercase mb-1 flex items-center gap-1">
                  <Key size={14} className="text-amber-500" /> 4-Digit Security PIN (For Time In/Out)
                </label>
                <input
                  type="text"
                  maxLength={4}
                  value={formData.leadPin}
                  onChange={(e) => setFormData({ ...formData, leadPin: e.target.value.replace(/\D/g, '') })}
                  placeholder="e.g. 8888 or 1234"
                  className="w-full px-3.5 py-2.5 text-center font-mono font-bold tracking-widest text-lg bg-neutral-50 rounded-xl border border-neutral-300 focus:ring-2 focus:ring-primary outline-none"
                />
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
                onClick={handleCreateTeamAndLead}
                className="flex-1 py-3 rounded-xl font-bold text-xs bg-primary text-white hover:bg-primary-dark shadow-md cursor-pointer"
              >
                Create Team & Account
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── View Team Members Drawer Modal ── */}
      {viewTeamMembers && (
        <div className="fixed inset-0 z-[150] bg-transparent flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 w-full max-w-md shadow-md border border-neutral-300 space-y-4">
            <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
              <h3 className="font-black text-lg text-neutral-800">
                Members of {viewTeamMembers.teamName}
              </h3>
              <button onClick={() => setViewTeamMembers(null)} className="text-neutral-400 hover:text-neutral-700 font-bold">
                 ✕
              </button>
            </div>

            {viewTeamMembers.members.length === 0 ? (
              <p className="text-xs text-neutral-400 italic py-4 text-center">No employees currently assigned to this team.</p>
            ) : (
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {viewTeamMembers.members.map((m) => (
                  <div key={m.id} className="p-3 bg-neutral-50 rounded-xl border border-neutral-200/80 flex items-center justify-between text-xs">
                    <div>
                      <p className="font-bold text-neutral-800">{m.name}</p>
                      <p className="text-neutral-400 font-medium">{m.role}</p>
                    </div>
                    <span className="font-mono text-neutral-500 bg-white px-2 py-0.5 rounded border border-neutral-200 font-bold">
                      PIN: {m.pinHash || '8888'}
                    </span>
                  </div>
                ))}
              </div>
            )}

            <button 
              onClick={() => setViewTeamMembers(null)}
              className="w-full py-3 rounded-xl font-bold text-xs bg-neutral-100 text-neutral-700 hover:bg-neutral-200 cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* ── Delete Confirmation Modal ── */}
      {deletingTeamId && (
        <div className="fixed inset-0 z-[150] bg-transparent flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 w-full max-w-sm shadow-md border border-neutral-300 text-center space-y-4">
            <div className="w-12 h-12 bg-red-100 text-red-600 rounded-2xl flex items-center justify-center mx-auto">
              <Trash2 size={24} />
            </div>
            <h3 className="font-extrabold text-lg text-neutral-800">Delete Team?</h3>
            <p className="text-xs text-neutral-500">Are you sure you want to remove this team?</p>

            <div className="flex gap-3 pt-2">
              <button 
                onClick={() => setDeletingTeamId(null)}
                className="flex-1 py-3 rounded-xl font-bold text-xs bg-neutral-100 text-neutral-700 hover:bg-neutral-200 cursor-pointer"
              >
                Cancel
              </button>
              <button 
                onClick={() => handleDeleteTeam(deletingTeamId)}
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
