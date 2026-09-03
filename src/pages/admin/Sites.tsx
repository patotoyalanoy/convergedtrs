import { Plus, Search, MapPin, MoreVertical } from 'lucide-react';

export default function SitesManagement() {
  const sites = [
    { id: '1', name: 'Makati Tower', location: '6789 Ayala Ave, Makati City', lat: 14.5547, lng: 121.0244, radius: 100 },
    { id: '2', name: 'Ortigas Hub', location: 'Emerald Ave, Ortigas Center', lat: 14.5880, lng: 121.0601, radius: 150 },
    { id: '3', name: 'BGC Site', location: '5th Ave, BGC, Taguig', lat: 14.5524, lng: 121.0494, radius: 100 },
  ];

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-neutral-800">Sites Configuration</h1>
          <p className="text-neutral-500 mt-1">Manage Converge sites and geofence parameters</p>
        </div>
        <button className="flex items-center gap-2 bg-primary hover:bg-primary-dark text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
          <Plus size={16} /> Add New Site
        </button>
      </div>

      <div className="bg-white rounded-xl border border-neutral-200 shadow-sm overflow-hidden mb-6">
        <div className="p-4 border-b border-neutral-100 flex gap-4 bg-neutral-50/50">
          <div className="relative flex-1 max-w-md">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
            <input 
              type="text" 
              placeholder="Search sites..." 
              className="w-full pl-10 pr-4 py-2 rounded-lg border border-neutral-300 focus:ring-2 focus:ring-primary focus:border-primary text-sm"
            />
          </div>
        </div>
        <table className="w-full text-sm text-left">
          <thead className="bg-neutral-50 text-neutral-600 font-semibold border-b border-neutral-200">
            <tr>
              <th className="px-6 py-4">Site Name</th>
              <th className="px-6 py-4">Address</th>
              <th className="px-6 py-4">Coordinates (Lat, Lng)</th>
              <th className="px-6 py-4">Allowed Radius</th>
              <th className="px-6 py-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-100">
            {sites.map((site) => (
              <tr key={site.id} className="hover:bg-neutral-50 transition-colors">
                <td className="px-6 py-4 font-medium text-neutral-900 flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-orange-100 text-orange-600 flex items-center justify-center">
                    <MapPin size={16} />
                  </div>
                  {site.name}
                </td>
                <td className="px-6 py-4 text-neutral-600 truncate max-w-[200px]">{site.location}</td>
                <td className="px-6 py-4 text-neutral-600 font-mono text-xs">
                  {site.lat}, {site.lng}
                </td>
                <td className="px-6 py-4 font-medium">
                  {site.radius} meters
                </td>
                <td className="px-6 py-4 text-right">
                  <button className="p-1.5 text-neutral-400 hover:text-neutral-700 rounded-lg transition-colors">
                    <MoreVertical size={18} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
