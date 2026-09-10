import { useState, useEffect } from 'react';
import { 
  Users, Phone, Mail, MapPin, ShieldCheck, Search, Filter, 
  Clock, Navigation, ChevronRight, UserPlus, X, CheckCircle2 
} from 'lucide-react';
import { supabase } from '@/lib/supabase/client';
import { useAuthStore } from '@/stores/useAuthStore';
import { clsx } from 'clsx';

interface MemberItem {
  id: string;
  name: string;
  role: string;
  initials: string;
  active: boolean;
  phone?: string;
  email?: string;
}

export default function TeamInfo() {
  const { user } = useAuthStore();
  const [teamName, setTeamName] = useState('Field Team');
  const [siteDetails, setSiteDetails] = useState({ name: 'Converge Field Site', lat: 14.5547, lng: 121.0244, radius: 100 });
  const [members, setMembers] = useState<MemberItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedRoleFilter, setSelectedRoleFilter] = useState<'all' | 'Lead' | 'Technician'>('all');

  // Contact Modal State
  const [activeContactMember, setActiveContactMember] = useState<MemberItem | null>(null);

  useEffect(() => {
    async function loadTeamData() {
      setLoading(true);
      try {
        const [empRes, teamRes, siteRes] = await Promise.all([
          supabase.from('employees').select('*'),
          supabase.from('teams').select('*').limit(1),
          supabase.from('sites').select('*').limit(1)
        ]);

        if (teamRes.data && teamRes.data.length > 0) {
          setTeamName(teamRes.data[0].name);
        }

        if (siteRes.data && siteRes.data.length > 0) {
          const s = siteRes.data[0];
          setSiteDetails({
            name: s.name,
            lat: s.latitude,
            lng: s.longitude,
            radius: s.geofence_radius || 100
          });
        }

        if (empRes.data && empRes.data.length > 0) {
          const list: MemberItem[] = empRes.data.map((e) => {
            const isMe = e.id === user?.id || e.name === user?.name;
            const initials = e.name.split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase();
            return {
              id: e.id,
              name: isMe ? `${e.name} (You)` : e.name,
              role: e.role || 'Technician',
              initials,
              active: e.status === 'active',
              phone: '+63 917 555 ' + Math.floor(1000 + Math.random() * 9000),
              email: e.name.toLowerCase().replace(/\s+/g, '.') + '@converge.com'
            };
          });
          setMembers(list);
        }
      } catch (err) {
        console.error('Error fetching team info from Supabase:', err);
      } finally {
        setLoading(false);
      }
    }
    loadTeamData();
  }, [user]);

  const filteredMembers = members.filter(m => {
    const matchesSearch = m.name.toLowerCase().includes(search.toLowerCase()) || m.role.toLowerCase().includes(search.toLowerCase());
    const matchesRole = selectedRoleFilter === 'all' || m.role.toLowerCase().includes(selectedRoleFilter.toLowerCase());
    return matchesSearch && matchesRole;
  });

  const activeCount = members.filter(m => m.active).length;

  return (
    <div className="flex flex-col flex-1 bg-slate-50 min-h-full pb-10">

      {/* ── Dynamic Team Hero Banner ── */}
      <div className="bg-gradient-to-r from-primary via-orange-500 to-amber-600 px-6 pt-8 pb-14 shadow-lg rounded-b-[36px] text-white relative overflow-hidden">
        <div className="flex justify-between items-center mb-3">
          <span className="text-[11px] font-black tracking-widest uppercase bg-white/20 px-3.5 py-1 rounded-full border border-white/30 backdrop-blur-md">
            Field Operation Unit
          </span>
          <div className="flex items-center gap-1 bg-white/20 px-3 py-1 rounded-full text-xs font-extrabold backdrop-blur-md">
            <Users size={14} />
            <span>{members.length} Members</span>
          </div>
        </div>

        <h1 className="text-2xl font-black text-white leading-tight">{teamName}</h1>
        <div className="flex items-center gap-1.5 text-orange-100 text-xs font-medium mt-1">
          <MapPin size={14} className="shrink-0 text-amber-200" /> 
          <span>Assigned to <b>{siteDetails.name}</b></span>
        </div>

        {/* Live Active Members Pill */}
        <div className="mt-4 inline-flex items-center gap-2 bg-black/20 text-white px-3.5 py-1.5 rounded-full text-xs font-bold backdrop-blur-md border border-white/20">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
          {activeCount} of {members.length} Members Active On-Site
        </div>
      </div>

      {/* ── Search & Filter Controls ── */}
      <div className="px-5 -mt-6 z-20 mb-4">
        <div className="bg-white rounded-2xl p-3 shadow-md border border-neutral-200/80 space-y-2.5">
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
            <input
              type="text"
              placeholder="Search team member name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-neutral-50 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-primary/20 border border-neutral-200"
            />
          </div>

          {/* Role Filter Pills */}
          <div className="flex items-center gap-1.5 pt-1 border-t border-neutral-100 text-xs font-bold">
            <span className="text-[10px] text-neutral-400 uppercase tracking-wider mr-1">Filter:</span>
            {(['all', 'Lead', 'Technician'] as const).map(role => (
              <button
                key={role}
                onClick={() => setSelectedRoleFilter(role)}
                className={clsx(
                  "px-3.5 py-1.5 rounded-xl text-[11px] transition-all duration-150 cursor-pointer font-extrabold active:scale-[0.95]",
                  selectedRoleFilter === role 
                    ? "bg-gradient-to-r from-primary to-primary-dark text-white shadow-md shadow-primary/15" 
                    : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200 border border-neutral-200"
                )}
              >
                {role === 'all' ? 'All Roles' : role}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Shift & Location Info Card ── */}
      <div className="px-5 mb-4">
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-neutral-200/80 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center font-bold">
              <Clock size={18} />
            </div>
            <div>
              <span className="font-extrabold text-neutral-800 block">Shift Schedule</span>
              <span className="text-neutral-500 font-medium text-[11px]">08:00 AM - 05:00 PM (Regular Field Shift)</span>
            </div>
          </div>
          <span className="bg-emerald-50 text-emerald-700 font-bold px-2 py-1 rounded text-[10px]">On Schedule</span>
        </div>
      </div>

      {/* ── Team Member Cards List ── */}
      <div className="px-5 space-y-3 flex-1">
        <h3 className="text-xs font-bold text-neutral-400 uppercase tracking-wider px-1">
          Registered Field Members ({filteredMembers.length})
        </h3>

        {loading ? (
          <div className="text-center py-10 text-neutral-400 text-sm font-medium">
            Fetching Supabase team members...
          </div>
        ) : filteredMembers.length === 0 ? (
          <div className="text-center py-10 text-neutral-400 text-sm font-medium">
            No team members found matching "{search}".
          </div>
        ) : (
          filteredMembers.map((member) => (
            <div 
              key={member.id} 
              className="bg-white rounded-2xl p-4 shadow-sm border border-neutral-200/80 flex items-center gap-4 hover:border-neutral-300 transition-all"
            >
              <div className="w-13 h-13 rounded-2xl flex items-center justify-center font-black text-lg bg-primary/10 text-primary border border-primary/20 shrink-0 shadow-2xs">
                {member.initials}
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-center mb-1">
                  <h4 className="font-extrabold text-neutral-800 text-sm truncate">{member.name}</h4>
                  {member.active ? (
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(34,197,94,0.6)] shrink-0" title="Active On-Site"></span>
                  ) : (
                    <span className="w-2.5 h-2.5 rounded-full bg-neutral-300 shrink-0" title="Offline"></span>
                  )}
                </div>
                
                <p className="text-xs font-semibold text-neutral-500">{member.role}</p>

                <div className="flex items-center justify-between mt-3">
                  <span className="text-[10px] font-bold bg-neutral-100 text-neutral-700 px-2 py-0.5 rounded flex items-center gap-1 border border-neutral-200">
                    <ShieldCheck size={11} className="text-emerald-600" /> Active Member
                  </span>

                  {/* Member Action Buttons */}
                  <div className="flex gap-2">
                    <button 
                      onClick={() => setActiveContactMember(member)}
                      className="p-2.5 rounded-xl bg-neutral-100 hover:bg-neutral-200 text-neutral-700 transition-all duration-150 cursor-pointer active:scale-[0.9] shadow-sm"
                      title="Contact Member"
                    >
                      <Phone size={14} />
                    </button>
                    <button 
                      onClick={() => setActiveContactMember(member)}
                      className="p-2.5 rounded-xl bg-primary/10 hover:bg-primary/20 text-primary transition-all duration-150 cursor-pointer active:scale-[0.9] shadow-sm"
                      title="Email Member"
                    >
                      <Mail size={14} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* ── Member Contact Modal ── */}
      {activeContactMember && (
        <div className="fixed inset-0 z-[120] bg-transparent flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 w-full max-w-sm shadow-md border border-neutral-300 space-y-4">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary font-black text-xl flex items-center justify-center">
                  {activeContactMember.initials}
                </div>
                <div>
                  <h3 className="font-extrabold text-base text-neutral-800">{activeContactMember.name}</h3>
                  <p className="text-xs text-neutral-500 font-semibold">{activeContactMember.role}</p>
                </div>
              </div>
              <button onClick={() => setActiveContactMember(null)} className="p-1 text-neutral-400 hover:text-neutral-700">
                <X size={20} />
              </button>
            </div>

            <div className="bg-neutral-50 rounded-2xl p-4 space-y-3 text-xs font-semibold">
              <div className="flex items-center justify-between">
                <span className="text-neutral-500 flex items-center gap-2"><Phone size={14} /> Mobile Phone</span>
                <a href={`tel:${activeContactMember.phone}`} className="text-primary font-extrabold hover:underline">
                  {activeContactMember.phone}
                </a>
              </div>
              <div className="flex items-center justify-between border-t border-neutral-200/60 pt-2">
                <span className="text-neutral-500 flex items-center gap-2"><Mail size={14} /> Email Address</span>
                <a href={`mailto:${activeContactMember.email}`} className="text-primary font-bold hover:underline truncate max-w-[170px]">
                  {activeContactMember.email}
                </a>
              </div>
            </div>

            <button 
              onClick={() => setActiveContactMember(null)}
              className="w-full py-3.5 bg-gradient-to-r from-neutral-800 to-neutral-900 text-white rounded-xl font-bold text-xs hover:shadow-lg shadow-md cursor-pointer transition-all duration-150 active:scale-[0.97]"
            >
              Close Details
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
