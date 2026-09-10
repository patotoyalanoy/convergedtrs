import Dexie from 'dexie';

export interface AuthRecord {
  id: string;
  token: string;
  name: string;
  role: string; // 'admin' | 'employee'
  pinHash: string;
  expiresAt: number;
  email?: string;
}

class AppDB extends Dexie {
  auth!: Dexie.Table<AuthRecord, string>;

  constructor() {
    super('ConvergeAppDB');
    this.version(1).stores({
      auth: 'id, pinHash, expiresAt',
    });
  }
}

export const db = new AppDB();
