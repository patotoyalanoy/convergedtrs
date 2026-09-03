import { Plus, Search, UserSquare2, MoreVertical } from 'lucide-react';
import { clsx } from 'clsx';

export default function EmployeesManagement() {
  const employees = [
    { id: '101', name: 'John Dela Cruz', role: 'Technician', team: 'Team Alpha', site: 'Makati Tower', status: 'Active' },
    { id: '102', name: 'Maria Santos', role: 'Technician', team: 'Team Alpha', site: 'Makati Tower', status: 'Active' },
    { id: '103', name: 'Eric Reyes', role: 'Technician', team: 'Team Alpha', site: 'Makati Tower', status: 'Inactive' },
    { id: '104', name: 'Ana Garcia', role: 'Team Lead', team: 'Team Beta', site: 'Ortigas Hub', status: 'Active' },
  ];

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-neutral-800">Employees Management</h1>
          <p className="text-neutral-500 mt-1">Manage employee profiles and team assignments</p>
        </div>
        <button className="flex items-center gap-2 bg-primary hover:bg-primary-dark text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
          <Plus size={16} /> Add Employee
        </button>
      </div>

      <div className="bg-white rounded-xl border border-neutral-200 shadow-sm overflow-hidden mb-6">
        <div className="p-4 border-b border-neutral-100 flex gap-4 bg-neutral-50/50">
          <div className="relative flex-1 max-w-md">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
            <input 
              type="text" 
              placeholder="Search employees by name or ID..." 
              className="w-full pl-10 pr-4 py-2 rounded-lg border border-neutral-300 focus:ring-2 focus:ring-primary focus:border-primary text-sm"
            />
          </div>
        </div>
        <table className="w-full text-sm text-left">
          <thead className="bg-neutral-50 text-neutral-600 font-semibold border-b border-neutral-200">
            <tr>
              <th className="px-6 py-4">Employee</th>
              <th className="px-6 py-4">Role</th>
              <th className="px-6 py-4">Team</th>
              <th className="px-6 py-4">Assigned Site</th>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-100">
            {employees.map((emp) => (
              <tr key={emp.id} className="hover:bg-neutral-50 transition-colors">
                <td className="px-6 py-4 font-medium text-neutral-900 flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-neutral-200 flex items-center justify-center font-bold text-xs">
                    {emp.name.charAt(0)}
                  </div>
                  <div>
                    <p>{emp.name}</p>
                    <p className="text-xs text-neutral-400 font-normal">ID: {emp.id}</p>
                  </div>
                </td>
                <td className="px-6 py-4 text-neutral-600">{emp.role}</td>
                <td className="px-6 py-4 text-neutral-600">{emp.team}</td>
                <td className="px-6 py-4 text-neutral-600">{emp.site}</td>
                <td className="px-6 py-4">
                  <span className={clsx("px-2.5 py-1 rounded-full text-xs font-bold", 
                    emp.status === 'Active' ? "bg-green-100 text-green-700" : "bg-neutral-200 text-neutral-600"
                  )}>
                    {emp.status}
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
