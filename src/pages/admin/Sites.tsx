import { useState, useEffect } from 'react';
import { Plus, Search, MapPin, MoreVertical, RefreshCw, Trash2, Edit3, CheckCircle2, Globe, Compass } from 'lucide-react';
import { clsx } from 'clsx';
import { supabase } from '@/lib/supabase/client';

interface SiteItem {
  id: string;
  name: string;
  lat: number;
  lng: number;
  radius: number;
}

interface UserLocationLog {
  name: string;
  count: number;
  lastUsed: string;
}

import SitesMap from '@/components/maps/SitesMap';

export default function SitesManagement() {
  const [sites, setSites] = useState<SiteItem[]>([]);
  const [userLocations, setUserLocations] = useState<UserLocationLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // Modals state
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingSite, setEditingSite] = useState<SiteItem | null>(null);
  const [deletingSiteId, setDeletingSiteId] = useState<string | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    latitude: 14.5547,
    longitude: 121.0244,
    geofenceRadius: 100
  });

  const [toast, setToast] = useState<string | null>(null);
  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const fetchSitesAndLocations = async () => {
    setLoading(true);
    try {
      const [siteRes, attRes] = await Promise.all([
        supabase.from('sites').select('*').order('created_at', { ascending: false }),
        supabase.from('attendance_records').select('location_name, recorded_at')
      ]);

      if (siteRes.data) {
        const mapped: SiteItem[] = siteRes.data.map(s => ({
          id: s.id,
          name: s.name,
          lat: s.latitude || 14.5547,
          lng: s.longitude || 121.0244,
          radius: s.geofence_radius || 100
        }));
        setSites(mapped);
      }

      // Process unique user-added locations
      if (attRes.data) {
        const locMap = new Map<string, { count: number; lastUsed: string }>();
        attRes.data.forEach(r => {
          if (r.location_name) {
            const existing = locMap.get(r.location_name);
            if (existing) {
              existing.count += 1;
              if (new Date(r.recorded_at) > new Date(existing.lastUsed)) {
                existing.lastUsed = r.recorded_at;
              }
            } else {
              locMap.set(r.location_name, { count: 1, lastUsed: r.recorded_at });
            }
          }
        });

        const locArray: UserLocationLog[] = [];
        locMap.forEach((val, name) => {
          locArray.push({ name, count: val.count, lastUsed: new Date(val.lastUsed).toLocaleDateString() });
        });
        setUserLocations(locArray);
      }
    } catch (err) {
      console.error('Error fetching sites:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSitesAndLocations();
  }, []);

  const handleSaveSite = async () => {
    if (!formData.name.trim()) {
      alert('Site name is required.');
      return;
    }

    try {
      if (editingSite) {
        const { error } = await supabase
          .from('sites')
          .update({
            name: formData.name.trim(),
            latitude: Number(formData.latitude),
            longitude: Number(formData.longitude),
            geofence_radius: Number(formData.geofenceRadius)
          })
          .eq('id', editingSite.id);

        if (error) throw error;
        showToast('Site updated successfully!');
      } else {
        const { error } = await supabase
          .from('sites')
          .insert({
            id: crypto.randomUUID(),
            name: formData.name.trim(),
            latitude: Number(formData.latitude),
            longitude: Number(formData.longitude),
            geofence_radius: Number(formData.geofenceRadius)
          });

        if (error) throw error;
        showToast('New site added to database!');
      }

      setShowAddModal(false);
      setEditingSite(null);
      setFormData({ name: '', latitude: 14.5547, longitude: 121.0244, geofenceRadius: 100 });
      fetchSitesAndLocations();
    } catch (err: any) {
      alert('Failed to save site: ' + (err.message || 'Error saving to Supabase'));
    }
  };

  const handleDeleteSite = async (id: string) => {
    try {
      const { error } = await supabase.from('sites').delete().eq('id', id);
      if (error) throw error;

      showToast('Site removed.');
      setDeletingSiteId(null);
      fetchSitesAndLocations();
    } catch (err: any) {
      alert('Failed to delete site: ' + err.message);
    }
  };

  const openEditModal = (site: SiteItem) => {
    setEditingSite(site);
    setFormData({
      name: site.name,
      latitude: site.lat,
      longitude: site.lng,
      geofenceRadius: site.radius
    });
    setShowAddModal(true);
  };

  const promoteUserLocation = (locName: string) => {
    setEditingSite(null);
    setFormData({
      name: locName,
      latitude: 14.5547,
      longitude: 121.0244,
      geofenceRadius: 100
    });
    setShowAddModal(true);
  };

  const filteredSites = sites.filter(s =>
    s.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-12 relative">

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
          <h1 className="text-2xl font-black text-navy-900 tracking-tight">Sites & Geofences</h1>
          <p className="text-xs text-slate-500 mt-0.5 font-semibold">Manage official Converge site geofences and technician field locations</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={fetchSitesAndLocations} className="flex items-center gap-1.5 px-3 py-2 border border-slate-200 rounded-xl text-navy-900 hover:bg-slate-100/80 text-xs font-bold shadow-2xs transition-colors cursor-pointer" title="Refresh">
            <RefreshCw size={13} className={clsx(loading && 'animate-spin')} />
            Refresh
          </button>
          <button
            onClick={() => {
              setEditingSite(null);
              setFormData({ name: '', latitude: 14.5547, longitude: 121.0244, geofenceRadius: 100 });
              setShowAddModal(true);
            }}
            className="flex items-center gap-2 bg-primary hover:bg-primary-dark text-white px-4 py-2 rounded-xl text-xs font-black shadow-sm transition-all active:scale-95 cursor-pointer"
          >
            <Plus size={15} /> Add Site
          </button>
        </div>
      </div>

      {/* ── Visual Map of All Official Sites ── */}
      {!loading && sites.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-black text-navy-900 uppercase tracking-wider flex items-center gap-2">
              <Globe size={15} className="text-primary" /> Geofence Coverage Map
            </h3>
          </div>
          <SitesMap sites={sites} onSelectSite={(site) => openEditModal(site)} />
        </div>
      )}

      {/* ── Official Configured Sites Table ── */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-x-auto">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between gap-4 bg-slate-50/60">
          <div className="relative flex-1 max-w-md">
            <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              type="text" 
              placeholder="Search official sites..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-primary/30 focus:border-primary text-xs font-bold text-navy-900 bg-white"
            />
          </div>
          <span className="text-xs font-extrabold text-navy-900 bg-navy-50 px-3 py-1 rounded-xl border border-navy-100/80">
            {filteredSites.length} Official Sites
          </span>
        </div>

        {loading ? (
          <div className="p-12 text-center text-slate-500 flex flex-col items-center gap-2 font-medium">
            <RefreshCw size={24} className="animate-spin text-primary" />
            <span>Fetching sites from database...</span>
          </div>
        ) : filteredSites.length === 0 ? (
          <div className="p-12 text-center text-slate-500 font-medium">
            No official sites configured. Click "Add Site" to create one.
          </div>
        ) : (
          <table className="w-full min-w-[700px] text-sm text-left">
            <thead className="bg-[#0B192C] text-white font-extrabold border-b border-navy-800 text-[11px] uppercase tracking-wider">
              <tr>
                <th className="px-6 py-4">Site Name</th>
                <th className="px-6 py-4">GPS Coordinates</th>
                <th className="px-6 py-4">Geofence Radius</th>
                <th className="px-6 py-4 text-center">Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredSites.map((site) => (
                <tr key={site.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="px-6 py-4 font-bold text-neutral-900 flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center shadow-xs">
                      <MapPin size={18} />
                    </div>
                    <span>{site.name}</span>
                  </td>
                  <td className="px-6 py-4 text-neutral-600 font-mono text-xs font-semibold">
                    {site.lat.toFixed(6)}, {site.lng.toFixed(6)}
                  </td>
                  <td className="px-6 py-4 font-bold text-neutral-800">
                    <span className="bg-neutral-100 px-2.5 py-1 rounded-lg border border-neutral-200">
                      {site.radius} meters
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className="px-2.5 py-1 rounded-full text-xs font-black bg-emerald-100 text-emerald-700">
                      Active Geofence
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button 
                        onClick={() => openEditModal(site)}
                        className="p-2 text-neutral-500 hover:text-primary hover:bg-primary/10 rounded-lg transition-colors"
                        title="Edit Site"
                      >
                        <Edit3 size={16} />
                      </button>
                      <button 
                        onClick={() => setDeletingSiteId(site.id)}
                        className="p-2 text-neutral-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Delete Site"
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

      {/* ── Technicians / User Added Location Logs Card ── */}
      <div className="bg-white rounded-2xl border border-neutral-200 shadow-sm p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
          <div>
            <h3 className="font-extrabold text-lg text-neutral-800 flex items-center gap-2">
              <Compass className="text-primary" size={20} /> User & Technician Logged Locations
            </h3>
            <p className="text-xs text-neutral-500 mt-0.5">Custom field locations entered by users on top of Leaflet maps during Time In/Out</p>
          </div>
          <span className="text-xs font-black bg-neutral-100 text-neutral-700 px-3 py-1 rounded-full border border-neutral-200">
            {userLocations.length} Logged Locations
          </span>
        </div>

        {userLocations.length === 0 ? (
          <p className="text-xs text-neutral-400 italic py-4 text-center">No custom field location names logged yet by technicians.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {userLocations.map((loc, idx) => (
              <div key={idx} className="bg-neutral-50 rounded-xl p-3.5 border border-neutral-200/80 flex items-center justify-between hover:shadow-sm transition-shadow">
                <div>
                  <h4 className="font-bold text-xs text-neutral-800">{loc.name}</h4>
                  <p className="text-[11px] text-neutral-400 mt-0.5">Logged {loc.count} time(s) • Last: {loc.lastUsed}</p>
                </div>
                <button
                  onClick={() => promoteUserLocation(loc.name)}
                  className="bg-white hover:bg-primary hover:text-white text-primary text-[11px] font-extrabold px-3 py-1.5 rounded-lg border border-primary/30 transition-colors shadow-2xs cursor-pointer"
                >
                  Make Official
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Add / Edit Site Modal ── */}
      {showAddModal && (
        <div className="fixed inset-0 z-[150] bg-transparent flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 w-full max-w-md shadow-md border border-neutral-300 space-y-4">
            <h3 className="font-black text-xl text-neutral-800">
              {editingSite ? 'Edit Official Site' : 'Add New Converge Site'}
            </h3>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-neutral-600 uppercase mb-1">Site Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Makati Tower 2"
                  className="w-full px-3.5 py-2.5 text-sm font-semibold bg-neutral-50 rounded-xl border border-neutral-300 focus:ring-2 focus:ring-primary outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-neutral-600 uppercase mb-1">Latitude</label>
                  <input
                    type="number"
                    step="any"
                    value={formData.latitude}
                    onChange={(e) => setFormData({ ...formData, latitude: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3.5 py-2.5 text-sm font-semibold bg-neutral-50 rounded-xl border border-neutral-300 focus:ring-2 focus:ring-primary outline-none font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-neutral-600 uppercase mb-1">Longitude</label>
                  <input
                    type="number"
                    step="any"
                    value={formData.longitude}
                    onChange={(e) => setFormData({ ...formData, longitude: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3.5 py-2.5 text-sm font-semibold bg-neutral-50 rounded-xl border border-neutral-300 focus:ring-2 focus:ring-primary outline-none font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-neutral-600 uppercase mb-1">Geofence Radius (Meters)</label>
                <input
                  type="number"
                  value={formData.geofenceRadius}
                  onChange={(e) => setFormData({ ...formData, geofenceRadius: parseInt(e.target.value) || 100 })}
                  className="w-full px-3.5 py-2.5 text-sm font-semibold bg-neutral-50 rounded-xl border border-neutral-300 focus:ring-2 focus:ring-primary outline-none"
                />
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button 
                onClick={() => setShowAddModal(false)}
                className="flex-1 py-3 rounded-xl font-bold text-xs bg-neutral-100 text-neutral-700 hover:bg-neutral-200"
              >
                Cancel
              </button>
              <button 
                onClick={handleSaveSite}
                className="flex-1 py-3 rounded-xl font-bold text-xs bg-primary text-white hover:bg-primary-dark shadow-md"
              >
                Save Site
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Delete Confirmation Modal ── */}
      {deletingSiteId && (
        <div className="fixed inset-0 z-[150] bg-transparent flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 w-full max-w-sm shadow-md border border-neutral-300 text-center space-y-4">
            <div className="w-12 h-12 bg-red-100 text-red-600 rounded-2xl flex items-center justify-center mx-auto">
              <Trash2 size={24} />
            </div>
            <h3 className="font-extrabold text-lg text-neutral-800">Delete Site?</h3>
            <p className="text-xs text-neutral-500">Are you sure you want to remove this site from Supabase?</p>

            <div className="flex gap-3 pt-2">
              <button 
                onClick={() => setDeletingSiteId(null)}
                className="flex-1 py-3 rounded-xl font-bold text-xs bg-neutral-100 text-neutral-700 hover:bg-neutral-200 cursor-pointer"
              >
                Cancel
              </button>
              <button 
                onClick={() => handleDeleteSite(deletingSiteId)}
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
