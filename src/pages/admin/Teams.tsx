import { useState } from 'react';
import { Plus, Search, Users, MoreVertical } from 'lucide-react';

export default function TeamsManagement() {
  const teams = [
    { id: '1', name: 'Team Alpha', site: 'Makati Tower', members: 4, status: 'Active' },
    { id: '2', name: 'Team Beta', site: 'Ortigas Hub', members: 4, status: 'Active' },
    { id: '3', name: 'Team Charlie', site: 'BGC Site', members: 3, status: 'Active' },
  ];

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-neutral-800">Teams Management</h1>
          <p className="text-neutral-500 mt-1">Manage field teams and their assigned sites</p>
        </div>
        <button className="flex items-center gap-2 bg-primary hover:bg-primary-dark text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
          <Plus size={16} /> Add New Team
        </button>
      </div>

      <div className="bg-white rounded-xl border border-neutral-200 shadow-sm overflow-hidden mb-6">
        <div className="p-4 border-b border-neutral-100 flex gap-4 bg-neutral-50/50">
          <div className="relative flex-1 max-w-md">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
            <input 
              type="text" 
              placeholder="Search teams..." 
              className="w-full pl-10 pr-4 py-2 rounded-lg border border-neutral-300 focus:ring-2 focus:ring-primary focus:border-primary text-sm"
            />
          </div>
        </div>
        <table className="w-full text-sm text-left">
          <thead className="bg-neutral-50 text-neutral-600 font-semibold border-b border-neutral-200">
            <tr>
              <th className="px-6 py-4">Team Name</th>
              <th className="px-6 py-4">Assigned Site</th>
              <th className="px-6 py-4">Members</th>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-100">
            {teams.map((team) => (
              <tr key={team.id} className="hover:bg-neutral-50 transition-colors">
                <td className="px-6 py-4 font-medium text-neutral-900 flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-secondary/10 text-secondary flex items-center justify-center">
                    <Users size={16} />
                  </div>
                  {team.name}
                </td>
                <td className="px-6 py-4 text-neutral-600">{team.site}</td>
                <td className="px-6 py-4 text-neutral-600">
                  <span className="font-semibold">{team.members}</span> / 4
                </td>
                <td className="px-6 py-4">
                  <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-green-100 text-green-700">
                    {team.status}
                  </span>
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
