import { useState } from 'react';
import { ArrowLeft, Users } from 'lucide-react';
import { useAuthStore } from '@/stores/useAuthStore';

interface Props {
  onNext: (teamName: string, members: string[]) => void;
  onCancel: () => void;
}

export default function TeamSelection({ onNext, onCancel }: Props) {
  const { user } = useAuthStore();
  
  // Default to what we know, but let them change it
  const defaultTeamName = (user as any)?.teamId === 'team-2' ? 'Team Beta' : 'Team Alpha';
  const [teamName, setTeamName] = useState(defaultTeamName);
  
  const [members, setMembers] = useState<string[]>(['']);

  const handleAddMember = () => {
    setMembers([...members, '']);
  };

  const handleMemberChange = (index: number, value: string) => {
    const newMembers = [...members];
    newMembers[index] = value;
    setMembers(newMembers);
  };

  const handleRemoveMember = (index: number) => {
    const newMembers = members.filter((_, i) => i !== index);
    setMembers(newMembers);
  };

  const handleContinue = () => {
    // Filter out empty names
    const validMembers = members.map(m => m.trim()).filter(m => m.length > 0);
    onNext(teamName, validMembers);
  };

  return (
    <div className="absolute inset-0 z-50 bg-neutral-50 flex flex-col">
      {/* Header */}
      <div className="bg-white border-b border-neutral-200 px-4 py-3 flex items-center">
        <button onClick={onCancel} className="p-2 -ml-2 text-neutral-600">
          <ArrowLeft size={24} />
        </button>
        <h2 className="font-semibold text-lg ml-2">Team Details</h2>
      </div>

      <div className="flex-1 overflow-y-auto p-4 flex flex-col">
        <div className="mb-6 flex items-center justify-center">
          <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center text-primary">
            <Users size={32} />
          </div>
        </div>
        
        <h3 className="font-bold text-xl text-neutral-800 text-center mb-6">Who is on site today?</h3>

        <div className="bg-white p-4 rounded-xl shadow-sm border border-neutral-100 mb-6">
          <label className="block text-sm font-semibold text-neutral-700 mb-2">Team Name</label>
          <input 
            type="text" 
            value={teamName}
            onChange={(e) => setTeamName(e.target.value)}
            placeholder="e.g. Team Alpha"
            className="w-full px-4 py-3 rounded-xl border border-neutral-300 focus:ring-2 focus:ring-primary focus:border-primary outline-none mb-2"
          />
        </div>

        <div className="bg-white p-4 rounded-xl shadow-sm border border-neutral-100 mb-6 flex-1">
          <label className="block text-sm font-semibold text-neutral-700 mb-2">Members Present</label>
          <p className="text-xs text-neutral-500 mb-4">List the names of the team members who are currently on this site with you.</p>
          
          <div className="space-y-3">
            {members.map((member, index) => (
              <div key={index} className="flex gap-2">
                <input
                  type="text"
                  value={member}
                  onChange={(e) => handleMemberChange(index, e.target.value)}
                  placeholder="Member Name"
                  className="flex-1 px-4 py-2 rounded-lg border border-neutral-300 focus:ring-2 focus:ring-primary focus:border-primary outline-none"
                />
                {members.length > 1 && (
                  <button 
                    onClick={() => handleRemoveMember(index)}
                    className="p-2 text-red-500 hover:bg-red-50 rounded-lg"
                  >
                    Remove
                  </button>
                )}
              </div>
            ))}
          </div>
          
          <button 
            onClick={handleAddMember}
            className="mt-4 text-sm font-bold text-primary hover:text-primary-dark"
          >
            + Add Another Member
          </button>
        </div>

        <button 
          onClick={handleContinue}
          disabled={teamName.trim().length === 0}
          className="mt-auto w-full bg-primary hover:bg-primary-dark disabled:bg-neutral-300 disabled:text-neutral-500 text-white font-bold py-4 rounded-xl shadow-md text-lg transition-transform active:scale-95"
        >
          Continue
        </button>
      </div>
    </div>
  );
}
