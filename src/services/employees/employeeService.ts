import { supabase } from '@/lib/supabase/client';

export interface EmployeeFromDB {
  id: string;
  name: string;
  pin_hash: string;
  role: string;
  status: 'active' | 'inactive';
  team_ids: string[]; // Will be populated by joining team_members
}

export class EmployeeService {
  /**
   * Find an employee by their plain-text PIN.
   * Returns the employee and their team IDs, or null if not found.
   */
  static async loginWithPin(pin: string): Promise<{ employee: any; teamIds: string[] } | null> {
    // Fetch employee where pin_hash matches the entered PIN
    // NOTE: For production, use bcrypt hashing. For now we store PIN as plain text.
    const { data: employee, error } = await supabase
      .from('employees')
      .select('*')
      .eq('pin_hash', pin)
      .eq('status', 'active')
      .single();

    if (error || !employee) {
      return null;
    }

    // Fetch all team memberships for this employee
    const { data: memberships } = await supabase
      .from('team_members')
      .select('team_id')
      .eq('employee_id', employee.id);

    const teamIds = memberships?.map((m: any) => m.team_id) || [];

    return { employee, teamIds };
  }

  /**
   * Fetch all teams this employee belongs to (with team names).
   */
  static async getEmployeeTeams(employeeId: string): Promise<{ id: string; name: string }[]> {
    const { data, error } = await supabase
      .from('team_members')
      .select('team_id, teams(id, name)')
      .eq('employee_id', employeeId);

    if (error || !data) return [];

    return data.map((row: any) => ({
      id: row.teams.id,
      name: row.teams.name,
    }));
  }

  /**
   * Fetch all employees (for admin use).
   */
  static async getAllEmployees() {
    const { data, error } = await supabase
      .from('employees')
      .select('id, name, role, status, created_at')
      .order('name');

    if (error) throw error;
    return data || [];
  }

  /**
   * Create a new employee.
   */
  static async createEmployee(params: { name: string; pin: string; role: string }) {
    const { data, error } = await supabase
      .from('employees')
      .insert({
        name: params.name,
        pin_hash: params.pin, // Plain text for now
        role: params.role,
        status: 'active',
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Update employee status.
   */
  static async updateStatus(employeeId: string, status: 'active' | 'inactive') {
    const { error } = await supabase
      .from('employees')
      .update({ status })
      .eq('id', employeeId);

    if (error) throw error;
  }
}
