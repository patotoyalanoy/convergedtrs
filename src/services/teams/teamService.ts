import { supabase } from '@/lib/supabase/client';

export class TeamService {
  /**
   * Fetch all teams.
   */
  static async getAllTeams() {
    const { data, error } = await supabase
      .from('teams')
      .select('id, name, created_at')
      .order('name');

    if (error) throw error;
    return data || [];
  }

  /**
   * Fetch team with its member list.
   */
  static async getTeamWithMembers(teamId: string) {
    const { data: team, error } = await supabase
      .from('teams')
      .select('id, name')
      .eq('id', teamId)
      .single();

    if (error) throw error;

    const { data: members } = await supabase
      .from('team_members')
      .select('employee_id, employees(id, name, role)')
      .eq('team_id', teamId);

    return {
      ...team,
      members: members?.map((m: any) => m.employees) || [],
    };
  }

  /**
   * Create a new team.
   */
  static async createTeam(name: string) {
    const { data, error } = await supabase
      .from('teams')
      .insert({ name })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Assign an employee to a team.
   */
  static async addMember(teamId: string, employeeId: string) {
    const { error } = await supabase
      .from('team_members')
      .insert({ team_id: teamId, employee_id: employeeId });

    if (error) throw error;
  }

  /**
   * Remove an employee from a team.
   */
  static async removeMember(teamId: string, employeeId: string) {
    const { error } = await supabase
      .from('team_members')
      .delete()
      .eq('team_id', teamId)
      .eq('employee_id', employeeId);

    if (error) throw error;
  }
}
