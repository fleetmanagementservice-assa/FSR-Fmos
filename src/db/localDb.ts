/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  Branch,
  Customer,
  Vendor,
  Unit,
  Category,
  OperationUser,
  Fsr,
  FsrStatus,
  FsrHistory,
  ApprovalHistory,
  Notification,
  ActivityLog,
  UserRole,
  EstimasiItem,
  ServiceCategory
} from '../types';

import {
  DEFAULT_BRANCHES,
  DEFAULT_CUSTOMERS,
  DEFAULT_VENDORS,
  DEFAULT_CATEGORIES,
  DEFAULT_UNITS,
  DEFAULT_USERS,
  INITIAL_FSRS
} from './seedData';

import { supabase, writeThroughToSupabase, deleteFromSupabase, isAutoSyncEnabled, pullSupabaseToLocal, pushLocalToSupabase, processSyncQueue } from './supabaseClient';


// Local storage keys
const KEYS = {
  BRANCHES: 'fsr_mgt_branches',
  CUSTOMERS: 'fsr_mgt_customers',
  VENDORS: 'fsr_mgt_vendors',
  CATEGORIES: 'fsr_mgt_categories',
  UNITS: 'fsr_mgt_units',
  USERS: 'fsr_mgt_users',
  FSRS: 'fsr_mgt_fsrs',
  FSR_HISTORY: 'fsr_mgt_fsr_history',
  APPROVAL_HISTORY: 'fsr_mgt_approval_history',
  ESTIMASI: 'fsr_mgt_estimasi',
  NOTIFICATIONS: 'fsr_mgt_notifications',
  ACTIVITY_LOGS: 'fsr_mgt_activity_logs',
  SESSION: 'fsr_mgt_session'
};

// Simple ID Generator
export function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

// Custom ID generators that follow the elegant pattern requested by the user:
export function generateBranchId(maint_plant: string, cabang: string, existingList: Branch[]): string {
  const index = existingList.length + 1;
  const cleanName = (cabang || '').toLowerCase().replace(/[^a-z]/g, '');
  let abb = cleanName.slice(0, 3);
  if (cleanName === 'medan') abb = 'mdn';
  else if (cleanName === 'pekanbaru') abb = 'pkb';
  else if (cleanName === 'padang') abb = 'pdg';
  else if (cleanName === 'palembang') abb = 'plb';
  else if (cleanName === 'lampung') abb = 'lpg';
  else if (cleanName === 'jakarta') abb = 'jkt';
  else if (cleanName === 'bandung') abb = 'bdg';
  else if (cleanName === 'solo') abb = 'slo';
  else if (cleanName === 'semarang') abb = 'smg';
  else if (cleanName === 'malang') abb = 'mlg';
  else if (cleanName === 'surabaya') abb = 'sby';
  else if (cleanName === 'bali') abb = 'bli';
  else if (cleanName === 'balikpapan') abb = 'bpp';
  else if (cleanName === 'banjarmasin') abb = 'bjm';
  else if (cleanName === 'makassar') abb = 'mks';
  return `b${index}-uuid-branch-${abb || 'br'}`;
}

export function generateCustomerId(cmd: string, name: string, existingList: Customer[]): string {
  const index = existingList.length + 1;
  let cleanName = (name || '').toUpperCase()
    .replace(/\bPT\b/gi, '')
    .replace(/\bCV\b/gi, '')
    .replace(/[^A-Z ]/g, '')
    .trim();
  let suffix = 'cust';
  if (cleanName) {
    const words = cleanName.split(/\s+/).filter(Boolean);
    if (words.length >= 3) {
      suffix = words.slice(0, 3).map(w => w[0]).join('').toLowerCase();
    } else {
      suffix = words[0].slice(0, 3).toLowerCase();
    }
  }
  return `c${index}-uuid-cust-${suffix}`;
}

export function generateVendorId(vmd: string, name: string, existingList: Vendor[]): string {
  const index = existingList.length + 1;
  let cleanName = (name || '').toLowerCase()
    .replace(/\bpt\b/g, '')
    .replace(/\bcv\b/g, '')
    .replace(/\bbengkel\b/g, '')
    .replace(/\bresmi\b/g, '')
    .replace(/\bbiro\b/g, '')
    .replace(/\bjasa\b/g, '')
    .replace(/\bbody\b/g, '')
    .replace(/\brepair\b/g, '')
    .replace(/[^a-z ]/g, '')
    .trim();
  const words = cleanName.split(/\s+/).filter(Boolean);
  let suffix = words[0] || 'vendor';
  return `v${index}-uuid-vendor-${suffix}`;
}

export function generateCategoryId(existingList: Category[]): string {
  const index = existingList.length + 1;
  return `cat${index}-uuid`;
}

export function generateUnitId(existingList: Unit[]): string {
  const index = existingList.length + 1;
  return `u${index}-uuid`;
}

export function generateUserId(username: string, existingList: OperationUser[]): string {
  const index = existingList.length + 1;
  const cleanUsername = (username || `user${index}`).toLowerCase().replace(/[^a-z0-9]/g, '');
  return `user-${cleanUsername}`;
}

class LocalDB {
  constructor() {
    this.init();
  }

  private init() {
    // Automatically upgrade old dummy seeds to the new requested master data
    const CLEAN_DB_FLAG = 'fsr_mgt_clean_internal_v3';
    if (!localStorage.getItem(CLEAN_DB_FLAG)) {
      localStorage.setItem(KEYS.FSRS, JSON.stringify([]));
      localStorage.setItem(KEYS.FSR_HISTORY, JSON.stringify([]));
      localStorage.setItem(KEYS.APPROVAL_HISTORY, JSON.stringify([]));
      localStorage.setItem(KEYS.ESTIMASI, JSON.stringify([]));
      localStorage.setItem(KEYS.NOTIFICATIONS, JSON.stringify([]));
      localStorage.setItem(KEYS.ACTIVITY_LOGS, JSON.stringify([]));
      localStorage.setItem(CLEAN_DB_FLAG, 'true');
    }

    const defaultCollections = [
      KEYS.BRANCHES,
      KEYS.CUSTOMERS,
      KEYS.VENDORS,
      KEYS.CATEGORIES,
      KEYS.UNITS,
      KEYS.USERS,
      KEYS.FSRS,
      KEYS.FSR_HISTORY,
      KEYS.APPROVAL_HISTORY,
      KEYS.ESTIMASI,
      KEYS.NOTIFICATIONS,
      KEYS.ACTIVITY_LOGS
    ];

    for (const key of defaultCollections) {
      if (!localStorage.getItem(key)) {
        localStorage.setItem(key, JSON.stringify([]));
      }
    }

    if (!localStorage.getItem(KEYS.SESSION)) {
      // Default initial session is superadmin
      localStorage.setItem(KEYS.SESSION, JSON.stringify(DEFAULT_USERS[0]));
    }

    // Background sync with Supabase on startup:
    // Process any offline queued actions, then pull the latest source of truth from Supabase.
    if (isAutoSyncEnabled()) {
      processSyncQueue()
        .then(() => pullSupabaseToLocal())
        .catch(err => {
          console.log('[Supabase Background Sync Notice]', err?.message || err);
        });
    }
  }

  // Helper getters
  private getList<T>(key: string): T[] {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : [];
  }

  private setList<T>(key: string, list: T[]): void {
    localStorage.setItem(key, JSON.stringify(list));
    try {
      window.dispatchEvent(new CustomEvent('fsr_db_updated'));
    } catch (e) {
      // ignore
    }
  }

  // Session & Authentication
  public getCurrentUser(): OperationUser {
    const user = localStorage.getItem(KEYS.SESSION);
    return user ? JSON.parse(user) : DEFAULT_USERS[0];
  }

  public setCurrentUser(user: OperationUser): void {
    localStorage.setItem(KEYS.SESSION, JSON.stringify(user));
    this.addActivity('Login', `User ${user.nama} (${user.role_operation}) berhasil login ke sistem.`, user);
  }

  // Activity Logger
  public addActivity(action: string, description: string, user: OperationUser) {
    const logs = this.getList<ActivityLog>(KEYS.ACTIVITY_LOGS);
    const newLog: ActivityLog = {
      id: generateUUID(),
      action,
      description,
      actor_name: user.nama,
      actor_role: user.role_operation,
      created_at: new Date().toISOString()
    };
    logs.unshift(newLog);
    this.setList(KEYS.ACTIVITY_LOGS, logs.slice(0, 150)); // Keep last 150 logs
    writeThroughToSupabase('activity_logs', newLog);
  }

  public getActivityLogs(): ActivityLog[] {
    return this.getList<ActivityLog>(KEYS.ACTIVITY_LOGS);
  }

  public async deleteActivityLog(id: string, actor: OperationUser): Promise<void> {
    const list = this.getList<ActivityLog>(KEYS.ACTIVITY_LOGS);
    const item = list.find(l => l.id === id);
    if (item) {
      const updated = list.filter(l => l.id !== id);
      this.setList(KEYS.ACTIVITY_LOGS, updated);
      await deleteFromSupabase('activity_logs', id);
      try {
        await supabase.from('activity_logs').delete().eq('id', id);
      } catch (err) {
        console.warn('[Supabase Direct Delete Activity Log Notice]', err);
      }
      try {
        window.dispatchEvent(new CustomEvent('fsr_db_updated', { detail: { table: 'activity_logs', eventType: 'DELETE', id } }));
      } catch (e) {}
    }
  }

  public async clearActivityLogs(actor: OperationUser): Promise<void> {
    this.setList(KEYS.ACTIVITY_LOGS, []);
    try {
      await supabase.from('activity_logs').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    } catch (err) {
      console.warn('[Supabase Clear All Activity Logs Notice]', err);
    }
    try {
      const rawQueue = localStorage.getItem('fsr_mgt_pending_queue');
      if (rawQueue) {
        const queue = JSON.parse(rawQueue);
        if (Array.isArray(queue)) {
          const filtered = queue.filter((item: any) => item.table !== 'activity_logs');
          localStorage.setItem('fsr_mgt_pending_queue', JSON.stringify(filtered));
        }
      }
    } catch (e) {
      console.warn('Failed to clear activity_logs from pending queue:', e);
    }
    try {
      window.dispatchEvent(new CustomEvent('fsr_db_updated', { detail: { table: 'activity_logs', eventType: 'DELETE' } }));
    } catch (e) {}
  }

  // Master Branches CRUD
  public getBranches(): Branch[] {
    return this.getList<Branch>(KEYS.BRANCHES).filter(b => !b.deleted_at);
  }

  public async saveBranch(branch: Partial<Branch>, actor: OperationUser): Promise<Branch> {
    const list = this.getList<Branch>(KEYS.BRANCHES);
    const now = new Date().toISOString();
    
    if (branch.id) {
      // Update
      const idx = list.findIndex(b => b.id === branch.id);
      if (idx !== -1) {
        const updated = {
          ...list[idx],
          ...branch,
          updated_at: now,
          updated_by: actor.username
        } as Branch;
        list[idx] = updated;
        this.setList(KEYS.BRANCHES, list);
        this.addActivity('Update Cabang', `Mengubah data Cabang ${updated.cabang}`, actor);
        await writeThroughToSupabase('branches', updated);
        return updated;
      }
    } else {
      // If a branch with the same maint_plant already exists, remove it first (delete and replace)
      const plant = (branch.maint_plant || '').trim().toLowerCase();
      const existing = list.find(b => (b.maint_plant || '').trim().toLowerCase() === plant);
      if (existing) {
        const idx = list.findIndex(b => b.id === existing.id);
        if (idx !== -1) {
          list.splice(idx, 1);
        }
        branch.id = existing.id; // Reuse ID for references
      }
    }
    
    // Create
    const created: Branch = {
      id: branch.id || generateBranchId(branch.maint_plant || '', branch.cabang || '', list),
      maint_plant: branch.maint_plant || '',
      cabang: branch.cabang || '',
      created_at: now,
      created_by: actor.username,
      updated_at: now,
      updated_by: actor.username
    };
    list.push(created);
    this.setList(KEYS.BRANCHES, list);
    this.addActivity('Create Cabang', `Menambahkan Cabang Baru: ${created.cabang}`, actor);
    await writeThroughToSupabase('branches', created);
    return created;
  }

  public async deleteBranch(id: string, actor: OperationUser): Promise<void> {
    const list = this.getList<Branch>(KEYS.BRANCHES);
    const idx = list.findIndex(b => b.id === id);
    if (idx !== -1) {
      const item = list[idx];
      list.splice(idx, 1);
      this.setList(KEYS.BRANCHES, list);
      this.addActivity('Delete Cabang', `Menghapus Cabang: ${item.cabang}`, actor);
      await deleteFromSupabase('branches', id);
      if (item.maint_plant) {
        try { await supabase.from('branches').delete().eq('maint_plant', item.maint_plant); } catch (e) {}
      }
      try { window.dispatchEvent(new CustomEvent('fsr_db_updated', { detail: { table: 'branches', eventType: 'DELETE', id } })); } catch (e) {}
    }
  }

  // Master Customers CRUD
  public getCustomers(): Customer[] {
    return this.getList<Customer>(KEYS.CUSTOMERS).filter(c => !c.deleted_at);
  }

  public async saveCustomer(customer: Partial<Customer>, actor: OperationUser): Promise<Customer> {
    const list = this.getList<Customer>(KEYS.CUSTOMERS);
    const now = new Date().toISOString();

    const cleanCmd = (customer.cmd || '').trim().toLowerCase();
    const existing = cleanCmd ? list.find(c => (c.cmd || '').trim().toLowerCase() === cleanCmd) : null;
    if (existing) {
      customer.id = existing.id;
    }

    if (customer.id) {
      const idx = list.findIndex(c => c.id === customer.id);
      if (idx !== -1) {
        const updated = {
          ...list[idx],
          ...customer,
          updated_at: now,
          updated_by: actor.username
        } as Customer;
        list[idx] = updated;
        this.setList(KEYS.CUSTOMERS, list);
        this.addActivity('Update Customer', `Mengubah data Customer ${updated.nama_customer}`, actor);
        await writeThroughToSupabase('customers', updated);
        return updated;
      }
    } else {
      customer.id = generateCustomerId(customer.cmd || '', customer.nama_customer || '', list);
    }

    const created: Customer = {
      id: customer.id || generateCustomerId(customer.cmd || '', customer.nama_customer || '', list),
      cmd: customer.cmd || '',
      nama_customer: customer.nama_customer || '',
      created_at: now,
      created_by: actor.username,
      updated_at: now,
      updated_by: actor.username
    };
    list.push(created);
    this.setList(KEYS.CUSTOMERS, list);
    this.addActivity('Create Customer', `Menambahkan Customer Baru: ${created.nama_customer}`, actor);
    await writeThroughToSupabase('customers', created);
    return created;
  }

  public async deleteCustomer(id: string, actor: OperationUser): Promise<void> {
    const list = this.getList<Customer>(KEYS.CUSTOMERS);
    const idx = list.findIndex(c => c.id === id);
    if (idx !== -1) {
      const item = list[idx];
      list.splice(idx, 1);
      this.setList(KEYS.CUSTOMERS, list);
      this.addActivity('Delete Customer', `Menghapus Customer: ${item.nama_customer}`, actor);
      await deleteFromSupabase('customers', id);
      if (item.cmd) {
        try { await supabase.from('customers').delete().eq('cmd', item.cmd); } catch (e) {}
      }
      try { window.dispatchEvent(new CustomEvent('fsr_db_updated', { detail: { table: 'customers', eventType: 'DELETE', id } })); } catch (e) {}
    }
  }

  // Master Vendors CRUD
  public getVendors(): Vendor[] {
    return this.getList<Vendor>(KEYS.VENDORS).filter(v => !v.deleted_at);
  }

  public async saveVendor(vendor: Partial<Vendor>, actor: OperationUser): Promise<Vendor> {
    const list = this.getList<Vendor>(KEYS.VENDORS);
    const now = new Date().toISOString();

    const cleanVmd = (vendor.vmd || '').trim().toLowerCase();
    const existing = cleanVmd ? list.find(v => (v.vmd || '').trim().toLowerCase() === cleanVmd) : null;
    if (existing) {
      vendor.id = existing.id;
    }

    if (vendor.id) {
      const idx = list.findIndex(v => v.id === vendor.id);
      if (idx !== -1) {
        const updated = {
          ...list[idx],
          ...vendor,
          updated_at: now,
          updated_by: actor.username
        } as Vendor;
        list[idx] = updated;
        this.setList(KEYS.VENDORS, list);
        this.addActivity('Update Vendor', `Mengubah data Vendor ${updated.nama_vendor}`, actor);
        await writeThroughToSupabase('vendors', updated);
        return updated;
      }
    } else {
      vendor.id = generateVendorId(vendor.vmd || '', vendor.nama_vendor || '', list);
    }

    const created: Vendor = {
      id: vendor.id || generateVendorId(vendor.vmd || '', vendor.nama_vendor || '', list),
      vmd: vendor.vmd || '',
      nama_vendor: vendor.nama_vendor || '',
      created_at: now,
      created_by: actor.username,
      updated_at: now,
      updated_by: actor.username
    };
    list.push(created);
    this.setList(KEYS.VENDORS, list);
    this.addActivity('Create Vendor', `Menambahkan Vendor Baru: ${created.nama_vendor}`, actor);
    await writeThroughToSupabase('vendors', created);
    return created;
  }

  public async deleteVendor(id: string, actor: OperationUser): Promise<void> {
    const list = this.getList<Vendor>(KEYS.VENDORS);
    const idx = list.findIndex(v => v.id === id);
    if (idx !== -1) {
      const item = list[idx];
      list.splice(idx, 1);
      this.setList(KEYS.VENDORS, list);
      this.addActivity('Delete Vendor', `Menghapus Vendor: ${item.nama_vendor}`, actor);
      await deleteFromSupabase('vendors', id);
      if (item.vmd) {
        try { await supabase.from('vendors').delete().eq('vmd', item.vmd); } catch (e) {}
      }
      try { window.dispatchEvent(new CustomEvent('fsr_db_updated', { detail: { table: 'vendors', eventType: 'DELETE', id } })); } catch (e) {}
    }
  }

  // Master Categories CRUD
  public getCategories(): Category[] {
    return this.getList<Category>(KEYS.CATEGORIES).filter(c => !c.deleted_at);
  }

  public async saveCategory(cat: Partial<Category>, actor: OperationUser): Promise<Category> {
    const list = this.getList<Category>(KEYS.CATEGORIES);
    const now = new Date().toISOString();

    const catLay = (cat.kategori_layanan || '').trim().toLowerCase();
    const jenLay = (cat.jenis_layanan || '').trim().toLowerCase();
    const rPic = (cat.role_pic || '').trim().toLowerCase();
    const existing = list.find(c => 
      (c.kategori_layanan || '').trim().toLowerCase() === catLay &&
      (c.jenis_layanan || '').trim().toLowerCase() === jenLay &&
      (c.role_pic || '').trim().toLowerCase() === rPic
    );
    if (existing) {
      cat.id = existing.id;
    }

    if (cat.id) {
      const idx = list.findIndex(c => c.id === cat.id);
      if (idx !== -1) {
        const updated = {
          ...list[idx],
          ...cat,
          updated_at: now,
          updated_by: actor.username
        } as Category;
        list[idx] = updated;
        this.setList(KEYS.CATEGORIES, list);
        this.addActivity('Update Kategori', `Mengubah Kategori ${updated.kategori_layanan} - ${updated.jenis_layanan}`, actor);
        await writeThroughToSupabase('categories', updated);
        return updated;
      }
    } else {
      cat.id = generateCategoryId(list);
    }

    const created: Category = {
      id: cat.id || generateCategoryId(list),
      kategori_layanan: cat.kategori_layanan || 'Maintenance',
      jenis_layanan: cat.jenis_layanan || '',
      role_pic: cat.role_pic || 'SA',
      created_at: now,
      created_by: actor.username,
      updated_at: now,
      updated_by: actor.username
    };
    list.push(created);
    this.setList(KEYS.CATEGORIES, list);
    this.addActivity('Create Kategori', `Menambahkan Kategori Baru: ${created.kategori_layanan} - ${created.jenis_layanan}`, actor);
    await writeThroughToSupabase('categories', created);
    return created;
  }

  public async deleteCategory(id: string, actor: OperationUser): Promise<void> {
    const list = this.getList<Category>(KEYS.CATEGORIES);
    const idx = list.findIndex(c => c.id === id);
    if (idx !== -1) {
      const item = list[idx];
      list.splice(idx, 1);
      this.setList(KEYS.CATEGORIES, list);
      this.addActivity('Delete Kategori', `Menghapus Kategori: ${item.kategori_layanan} - ${item.jenis_layanan}`, actor);
      await deleteFromSupabase('categories', id);
      try { window.dispatchEvent(new CustomEvent('fsr_db_updated', { detail: { table: 'categories', eventType: 'DELETE', id } })); } catch (e) {}
    }
  }

  // Master Units CRUD
  public getUnits(): Unit[] {
    return this.getList<Unit>(KEYS.UNITS).filter(u => !u.deleted_at);
  }

  public async saveUnit(unit: Partial<Unit>, actor: OperationUser): Promise<Unit> {
    const list = this.getList<Unit>(KEYS.UNITS);
    const now = new Date().toISOString();

    // Get customer name based on CMD
    const customers = this.getCustomers();
    const cust = customers.find(c => c.cmd === unit.cmd);
    const customer_name = cust ? cust.nama_customer : 'Customer Unknown';

    const cleanEq = (unit.no_equipment || '').trim().toLowerCase();
    const cleanPlate = (unit.license_plate || '').trim().toLowerCase();
    const existing = list.find(u => 
      (cleanEq && (u.no_equipment || '').trim().toLowerCase() === cleanEq) ||
      (cleanPlate && (u.license_plate || '').trim().toLowerCase() === cleanPlate)
    );
    if (existing) {
      unit.id = existing.id;
    }

    if (unit.id) {
      const idx = list.findIndex(u => u.id === unit.id);
      if (idx !== -1) {
        const updated = {
          ...list[idx],
          ...unit,
          customer_name,
          updated_at: now,
          updated_by: actor.username
        } as Unit;
        list[idx] = updated;
        this.setList(KEYS.UNITS, list);
        this.addActivity('Update Unit', `Mengubah Unit ${updated.license_plate} (${updated.description})`, actor);
        await writeThroughToSupabase('units', updated);
        return updated;
      }
    } else {
      unit.id = generateUnitId(list);
    }

    const created: Unit = {
      id: unit.id || generateUnitId(list),
      no_equipment: unit.no_equipment || '',
      license_plate: unit.license_plate || '',
      warna_nopol: unit.warna_nopol || 'Hitam',
      description: unit.description || '',
      kelompok_unit: unit.kelompok_unit || '',
      kategori_unit: unit.kategori_unit || '',
      kelompok_tipe: unit.kelompok_tipe || '',
      tipe_unit: unit.tipe_unit || '',
      pendingin: unit.pendingin || 'No',
      power: unit.power || '',
      tahun_unit: Number(unit.tahun_unit) || new Date().getFullYear(),
      chassis_no: unit.chassis_no || '',
      engine_serial_no: unit.engine_serial_no || '',
      warna: unit.warna || '',
      cmd: unit.cmd || '',
      customer_name,
      created_at: now,
      created_by: actor.username,
      updated_at: now,
      updated_by: actor.username
    };
    list.push(created);
    this.setList(KEYS.UNITS, list);
    this.addActivity('Create Unit', `Menambahkan Unit Baru: ${created.license_plate}`, actor);
    await writeThroughToSupabase('units', created);
    return created;
  }

  public async deleteUnit(id: string, actor: OperationUser): Promise<void> {
    const list = this.getList<Unit>(KEYS.UNITS);
    const idx = list.findIndex(u => u.id === id);
    if (idx !== -1) {
      const item = list[idx];
      list.splice(idx, 1);
      this.setList(KEYS.UNITS, list);
      this.addActivity('Delete Unit', `Menghapus Unit: ${item.license_plate}`, actor);
      await deleteFromSupabase('units', id);
      if (item.no_equipment) {
        try { await supabase.from('units').delete().eq('no_equipment', item.no_equipment); } catch (e) {}
      }
      if (item.license_plate) {
        try { await supabase.from('units').delete().eq('license_plate', item.license_plate); } catch (e) {}
      }
      try { window.dispatchEvent(new CustomEvent('fsr_db_updated', { detail: { table: 'units', eventType: 'DELETE', id } })); } catch (e) {}
    }
  }

  // Master Users Operation CRUD
  public getOperationUsers(): OperationUser[] {
    return this.getList<OperationUser>(KEYS.USERS).filter(u => !u.deleted_at);
  }

  public getUsers(): OperationUser[] {
    return this.getOperationUsers();
  }

  public async saveOperationUser(user: Partial<OperationUser>, actor: OperationUser): Promise<OperationUser> {
    const list = this.getList<OperationUser>(KEYS.USERS);
    const now = new Date().toISOString();

    const cleanUsername = (user.username || '').trim().toLowerCase();
    const existing = cleanUsername ? list.find(u => (u.username || '').trim().toLowerCase() === cleanUsername) : null;
    if (existing) {
      user.id = existing.id;
    }

    if (user.id) {
      const idx = list.findIndex(u => u.id === user.id);
      if (idx !== -1) {
        const updated = {
          ...list[idx],
          ...user,
          updated_at: now,
          updated_by: actor.username
        } as OperationUser;
        list[idx] = updated;
        this.setList(KEYS.USERS, list);
        this.addActivity('Update User Operasional', `Mengubah User ${updated.nama}`, actor);
        await writeThroughToSupabase('operation_users', updated);
        return updated;
      }
    } else {
      user.id = generateUserId(user.username || '', list);
    }

    const created: OperationUser = {
      id: user.id || generateUserId(user.username || '', list),
      nama: user.nama || '',
      username: user.username || '',
      password: user.password || 'password123',
      role_operation: user.role_operation || 'SA',
      cabang_handling: user.cabang_handling || 'DKI Jakarta',
      assigned_customer_cmd: user.assigned_customer_cmd || undefined,
      status: user.status || 'Active',
      permissions: user.permissions || {
        allowedMenus: {
          dashboard: true,
          fsrMonitoring: true,
          masterData: user.role_operation === 'Super Admin' || user.role_operation === 'Leader Operation'
        },
        allowedActions: {
          create: user.role_operation === 'Admin Customer' || user.role_operation === 'Super Admin',
          edit: true,
          delete: user.role_operation === 'Super Admin',
          workflow: true
        }
      },
      created_at: now,
      created_by: actor.username,
      updated_at: now,
      updated_by: actor.username
    };
    list.push(created);
    this.setList(KEYS.USERS, list);
    this.addActivity('Create User Operasional', `Menambahkan User Operasional Baru: ${created.nama}`, actor);
    await writeThroughToSupabase('operation_users', created);
    return created;
  }

  public async deleteOperationUser(id: string, actor: OperationUser): Promise<void> {
    const list = this.getList<OperationUser>(KEYS.USERS);
    const idx = list.findIndex(u => u.id === id);
    if (idx !== -1) {
      const item = list[idx];
      list.splice(idx, 1);
      this.setList(KEYS.USERS, list);
      this.addActivity('Delete User Operasional', `Menghapus User: ${item.nama}`, actor);
      await deleteFromSupabase('operation_users', id);
      if (item.username) {
        try { await supabase.from('operation_users').delete().eq('username', item.username); } catch (e) {}
      }
      try { window.dispatchEvent(new CustomEvent('fsr_db_updated', { detail: { table: 'operation_users', eventType: 'DELETE', id } })); } catch (e) {}
    }
  }

  // FSR & Workflow Mechanics WITH Row Level Security (RLS) simulation
  public getFsrs(user: OperationUser): Fsr[] {
    let list = this.getList<Fsr>(KEYS.FSRS).filter(f => !f.deleted_at);
    
    // RLS POLICY:
    // Jika pengajuan data dari Admin Customer di-reject oleh Leader Customer (status === 'Rejected'),
    // maka datanya HANYA boleh muncul untuk role 'Admin Customer' dan 'Leader Customer'.
    // Untuk role selain kedua role tersebut (Super Admin, Leader Operation, SA, SS, VRO, TS, Vendor), data tidak akan muncul.
    if (user.role_operation !== 'Admin Customer' && user.role_operation !== 'Leader Customer') {
      list = list.filter(f => f.status !== 'Rejected');
    }

    // 1. Super Admin & Leader Operation: can see everything (kecuali status Rejected yang disembunyikan di atas).
    if (user.role_operation === 'Super Admin' || user.role_operation === 'Leader Operation') {
      return list;
    }

    // 2. Admin Customer & Leader Customer: can only see FSRs that belong to their customer name.
    if (user.role_operation === 'Admin Customer' || user.role_operation === 'Leader Customer') {
      let matchedCustName = '';
      
      // Dynamic customer match using database records
      const customers = this.getCustomers();
      for (const cust of customers) {
        const nameUpper = cust.nama_customer.toUpperCase();
        const words = nameUpper.split(/\s+/).filter(w => w !== 'PT' && w !== 'CV');
        const acronym = words.map(w => w[0]).join(''); // "AST", "RDI", etc.
        
        const uName = user.nama.toUpperCase();
        const uUsername = user.username.toUpperCase();
        
        if (
          (acronym.length >= 2 && (uName.includes(acronym) || uUsername.includes(acronym))) ||
          uName.includes(nameUpper) ||
          words.some(w => w.length > 3 && (uName.includes(w) || uUsername.includes(w)))
        ) {
          matchedCustName = cust.nama_customer;
          break;
        }
      }
      
      // Fallback mappings to guarantee seed compatibility
      if (!matchedCustName) {
        if (user.username.includes('astra') || user.username.includes('ast')) {
          matchedCustName = 'PT ADI SARANA TRANSPORTASI';
        } else if (user.username.includes('unilever') || user.username.includes('rdi')) {
          matchedCustName = 'PT RANTAI DINGIN INDONESIA';
        } else if (user.username.includes('alfa')) {
          matchedCustName = 'PT ADI SARANA TRANSPORTASI';
        } else if (user.username.includes('sampoerna')) {
          matchedCustName = 'PT HM Sampoerna';
        }
      }

      return list.filter(f => 
        (matchedCustName && f.nama_customer === matchedCustName) ||
        f.created_by === user.username ||
        (f.nama_pic_customer && f.nama_pic_customer.toLowerCase().includes(user.nama.toLowerCase()))
      );
    }

    // 3. Vendor: can only see FSRs assigned to them (matching Vendor Name or VMD Number).
    if (user.role_operation === 'Vendor') {
      return list.filter(f => this.isVendorMatchingFsr(user, f));
    }

    // 4. TS (Technical Service Internal): can only see Maintenance FSRs explicitly assigned to their specific name (selected by SA/SS)
    if (user.role_operation === 'TS') {
      return list.filter(f => {
        // Must be Maintenance category and directly assigned to this TS user
        if (f.kategori_layanan !== 'Maintenance') return false;
        return this.isTsMatchingUser(user, f.nama_ts);
      });
    }

    // 5. SA & SS: can only see Maintenance and Body Repair FSRs matching their handled branches
    if (user.role_operation === 'SA' || user.role_operation === 'SS') {
      return list.filter(f => {
        if (f.kategori_layanan !== 'Maintenance' && f.kategori_layanan !== 'Body Repair') {
          return false;
        }
        if (user.cabang_handling && user.cabang_handling !== 'All Branches' && user.cabang_handling !== 'All') {
          return this.isBranchMatching(user.cabang_handling, f.cabang);
        }
        return true;
      });
    }

    // 6. VRO: can only see Document FSRs matching their handled branches
    if (user.role_operation === 'VRO') {
      return list.filter(f => {
        if (f.kategori_layanan !== 'Document') {
          return false;
        }
        if (user.cabang_handling && user.cabang_handling !== 'All Branches' && user.cabang_handling !== 'All') {
          return this.isBranchMatching(user.cabang_handling, f.cabang);
        }
        return true;
      });
    }

    return list;
  }

  public getFsrById(id: string, user?: OperationUser): Fsr | undefined {
    const item = this.getList<Fsr>(KEYS.FSRS).find(f => f.id === id && !f.deleted_at);
    if (!item) return undefined;

    // Jika status FSR adalah 'Rejected', dan user bukan Admin Customer atau Leader Customer, sembunyikan data
    if (user && item.status === 'Rejected') {
      if (user.role_operation !== 'Admin Customer' && user.role_operation !== 'Leader Customer') {
        return undefined;
      }
    }

    return item;
  }

  public getFsrHistory(fsrId: string): FsrHistory[] {
    return this.getList<FsrHistory>(KEYS.FSR_HISTORY).filter(h => h.fsr_id === fsrId);
  }

  public getEstimations(fsrId: string): EstimasiItem[] {
    return this.getList<EstimasiItem>(KEYS.ESTIMASI).filter(e => e.fsr_id === fsrId);
  }

  public async saveEstimations(fsrId: string, items: EstimasiItem[]): Promise<void> {
    const list = this.getList<EstimasiItem>(KEYS.ESTIMASI);
    // Remove existing for this fsrId
    const filtered = list.filter(e => e.fsr_id !== fsrId);
    // Add new ones
    filtered.push(...items);
    this.setList(KEYS.ESTIMASI, filtered);
    // Sync to Supabase
    for (const item of items) {
      await writeThroughToSupabase('estimasi', item);
    }
  }

  public generateNextNoFsr(category: ServiceCategory): string {
    const fsrs = this.getList<Fsr>(KEYS.FSRS);
    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '').slice(0, 6); // YYYYMM
    
    let code = 'MT';
    if (category === 'Body Repair') code = 'BR';
    if (category === 'Document') code = 'DOC';

    const countThisMonth = fsrs.filter(f => 
      f.tanggal_create && f.tanggal_create.slice(0, 7) === new Date().toISOString().slice(0, 7) &&
      f.kategori_layanan === category
    ).length;

    let serialNum = countThisMonth + 1;
    let candidate = `FSR/${code}/${dateStr}/${String(serialNum).padStart(4, '0')}`;
    
    while (fsrs.some(f => f.no_fsr === candidate)) {
      serialNum += 1;
      candidate = `FSR/${code}/${dateStr}/${String(serialNum).padStart(4, '0')}`;
    }

    return candidate;
  }

  // Create FSR (initiated by Admin Customer)
  public async createFsr(fsrData: Partial<Fsr>, actor: OperationUser): Promise<Fsr> {
    const fsrs = this.getList<Fsr>(KEYS.FSRS);
    const now = new Date().toISOString();

    // Auto generate No FSR if not provided
    let autoNoFsr = fsrData.no_fsr;
    if (!autoNoFsr) {
      autoNoFsr = this.generateNextNoFsr(fsrData.kategori_layanan || 'Maintenance');
    }

    const created: Fsr = {
      id: generateUUID(),
      no_fsr: autoNoFsr,
      tanggal_create: now,
      nama_customer: fsrData.nama_customer || '',
      nama_pic_customer: actor.nama,
      cabang: fsrData.cabang || '',
      no_polisi: fsrData.no_polisi || '',
      type_kendaraan: fsrData.type_kendaraan || '',
      no_rangka: fsrData.no_rangka || '',
      km_pengajuan: Number(fsrData.km_pengajuan) || 0,
      kategori_layanan: fsrData.kategori_layanan || 'Maintenance',
      jenis_layanan: fsrData.jenis_layanan || '',
      keterangan: fsrData.keterangan || '',
      status: 'Waiting Approval Leader Customer',
      created_at: now,
      created_by: actor.username,
      updated_at: now,
      updated_by: actor.username,
      document_url: fsrData.document_url || null,
      document_name: fsrData.document_name || null
    };

    fsrs.unshift(created);
    this.setList(KEYS.FSRS, fsrs);
    await writeThroughToSupabase('fsr', created);

    // Save initial history
    await this.addFsrHistory(
      created.id,
      'Waiting Approval Leader Customer',
      'FSR baru berhasil diajukan.',
      actor
    );

    // Create Notification for Leader Customer of same company
    await this.createNotification(
      'Leader Customer',
      `FSR Baru Menunggu Approval`,
      `FSR ${created.no_fsr} untuk unit ${created.no_polisi} diajukan oleh ${actor.nama}. Silakan lakukan review.`,
      created.id
    );

    this.addActivity('Submit FSR', `Membuat FSR Baru: ${created.no_fsr}`, actor);
    return created;
  }

  // Add FSR timeline logs
  private async addFsrHistory(fsrId: string, status: FsrStatus, catatan: string, user: OperationUser): Promise<void> {
    const history = this.getList<FsrHistory>(KEYS.FSR_HISTORY);
    const item = {
      id: generateUUID(),
      fsr_id: fsrId,
      status,
      catatan,
      actor_name: user.nama,
      actor_role: user.role_operation,
      created_at: new Date().toISOString()
    };
    history.push(item);
    this.setList(KEYS.FSR_HISTORY, history);
    await writeThroughToSupabase('fsr_history', item);
  }

  // Helper to check if an FSR is assigned to a specific TS user
  public isTsMatchingUser(user: OperationUser, tsName?: string | null): boolean {
    if (!tsName) return false;
    const ts = tsName.toLowerCase().trim();
    const uNama = (user.nama || '').toLowerCase().trim();
    const uUsername = (user.username || '').toLowerCase().trim();

    if (!uNama && !uUsername) return false;

    return (
      (uNama.length > 0 && (ts === uNama || ts.includes(uNama) || uNama.includes(ts))) ||
      (uUsername.length > 0 && (ts === uUsername || ts.includes(uUsername) || uUsername.includes(ts)))
    );
  }

  // Helper to check if a user branch matches an FSR branch
  public isBranchMatching(userBranch?: string, fsrBranch?: string): boolean {
    if (!userBranch || userBranch === 'All Branches' || userBranch === 'All') return true;
    if (!fsrBranch) return false;
    const u = userBranch.toLowerCase().replace(/^(dki\s+|kota\s+|kabupaten\s+|kab\.\s+)/i, '').trim();
    const f = fsrBranch.toLowerCase().replace(/^(dki\s+|kota\s+|kabupaten\s+|kab\.\s+)/i, '').trim();
    return u === f || u.includes(f) || f.includes(u);
  }

  // Helper to check if a Vendor user matches an FSR
  public isVendorMatchingFsr(user: OperationUser, fsr: Fsr): boolean {
    if (!fsr.nama_vendor && !fsr.no_vmd) return false;

    // Match by assigned_vmd or vendor_name if configured on user profile
    if (user.assigned_vmd && fsr.no_vmd && fsr.no_vmd.trim().toLowerCase() === user.assigned_vmd.trim().toLowerCase()) {
      return true;
    }
    if (user.vendor_name && fsr.nama_vendor && fsr.nama_vendor.trim().toLowerCase() === user.vendor_name.trim().toLowerCase()) {
      return true;
    }
    if (user.vendor_name && fsr.nama_vendor && (
      fsr.nama_vendor.toLowerCase().includes(user.vendor_name.toLowerCase()) ||
      user.vendor_name.toLowerCase().includes(fsr.nama_vendor.toLowerCase())
    )) {
      return true;
    }

    // Match by username or vendor fields
    const usernameLower = (user.username || '').toLowerCase().trim();
    const vendorNameLower = (fsr.nama_vendor || '').toLowerCase().trim();
    const vmdLower = (fsr.no_vmd || '').toLowerCase().trim();

    if (usernameLower.includes('agung') && (vendorNameLower.includes('agung') || vmdLower.includes('vmd001'))) return true;
    if (usernameLower.includes('lestari') && (vendorNameLower.includes('lestari') || vmdLower.includes('vmd002'))) return true;
    if (usernameLower.includes('sinar') && (vendorNameLower.includes('sinar') || vmdLower.includes('vmd003'))) return true;
    if (usernameLower.includes('isuzu') && (vendorNameLower.includes('isuzu') || vmdLower.includes('vmd004'))) return true;

    if (fsr.no_vmd && vmdLower === usernameLower) return true;
    if (fsr.nama_vendor && vendorNameLower === usernameLower) return true;

    return false;
  }

  // Create notifications for RLS target roles
  private async createNotification(role: UserRole, title: string, message: string, fsrId?: string): Promise<void> {
    const notifications = this.getList<Notification>(KEYS.NOTIFICATIONS);
    const item = {
      id: generateUUID(),
      user_role: role,
      title,
      message,
      fsr_id: fsrId,
      is_read: false,
      created_at: new Date().toISOString()
    };
    notifications.unshift(item);
    this.setList(KEYS.NOTIFICATIONS, notifications.slice(0, 100));
    await writeThroughToSupabase('notifications', item);
    window.dispatchEvent(new CustomEvent('fsr_new_notification', { detail: item }));
  }

  public getNotifications(user: OperationUser): Notification[] {
    const list = this.getList<Notification>(KEYS.NOTIFICATIONS);
    const fsrs = this.getList<Fsr>(KEYS.FSRS);

    // Filter by role or username if specified
    const filteredByRole = list.filter(n => {
      if (user.role_operation === 'Super Admin') return true;
      if (n.user_role === user.role_operation) return true;
      if ((user.role_operation === 'SA' || user.role_operation === 'SS') && (n.user_role === 'SA' || n.user_role === 'SS')) {
        return true;
      }
      return false;
    });

    // Filter out notifications that have already been processed, rejected, or belong to different vendors/branches
    return filteredByRole.filter(n => {
      if (!n.fsr_id) return true; // Keep general notifications if they don't have fsr_id
      
      const fsr = fsrs.find(f => f.id === n.fsr_id);
      if (!fsr || fsr.deleted_at) return false; // If FSR is deleted or not found, remove it

      const titleLower = n.title.toLowerCase();

      // 1. REJECTED / CANCELLED FSR:
      // Operational and Vendor roles MUST NOT see any notifications for rejected/cancelled FSRs
      if (fsr.status === 'Rejected' || fsr.status === 'Cancelled') {
        if (user.role_operation !== 'Admin Customer' && user.role_operation !== 'Leader Customer') {
          return false;
        }
        // For Admin Customer: only show the rejection notification ("FSR Ditolak"), reset all pending task notifications
        if (user.role_operation === 'Admin Customer') {
          return titleLower.includes('ditolak') || titleLower.includes('batal') || titleLower.includes('reject');
        }
        // For Leader Customer: hide pending approval notifications
        if (user.role_operation === 'Leader Customer') {
          return false;
        }
      }

      // 2. VENDOR ROLE CHECK:
      // If FSR vendor has changed or user is not the currently assigned vendor, reset & hide notifications for this FSR!
      if (user.role_operation === 'Vendor') {
        if (!this.isVendorMatchingFsr(user, fsr)) {
          return false;
        }
      }

      // 3. ROLE & CATEGORY & TS RESTRICTION CHECK:
      // TS: only receive notifications for FSRs directly assigned to this TS user
      if (user.role_operation === 'TS') {
        if (!this.isTsMatchingUser(user, fsr.nama_ts)) {
          return false;
        }
      }

      // SA & SS: only receive notifications for Maintenance and Body Repair categories
      if (user.role_operation === 'SA' || user.role_operation === 'SS') {
        if (fsr.kategori_layanan !== 'Maintenance' && fsr.kategori_layanan !== 'Body Repair') {
          return false;
        }
      }

      // VRO: only receive notifications for Document category
      if (user.role_operation === 'VRO') {
        if (fsr.kategori_layanan !== 'Document') {
          return false;
        }
      }

      // If user is branch-restricted, check branch matching with normalized helper
      if (user.role_operation === 'SA' || user.role_operation === 'SS' || user.role_operation === 'VRO') {
        if (user.cabang_handling && user.cabang_handling !== 'All Branches' && user.cabang_handling !== 'All') {
          if (!this.isBranchMatching(user.cabang_handling, fsr.cabang)) {
            return false;
          }
        }
      }

      // 4. WORKFLOW STEP SYNCHRONIZATION:
      // Reset notifications whose corresponding workflow step has already passed

      // Leader Customer - New FSR Approval
      if (titleLower.includes('menunggu persetujuan') || titleLower.includes('approve fsr') || titleLower.includes('pengajuan baru')) {
        return fsr.status === 'Waiting Approval Leader Customer';
      }

      // SA/SS - New FSR Assignment
      if (titleLower.includes('menunggu penugasan') || titleLower.includes('menunggu spk & vendor')) {
        return fsr.status === 'Approved Leader Customer';
      }

      // VRO - New Document Assignment
      if (titleLower.includes('menunggu proses vro')) {
        return fsr.status === 'Approved Leader Customer';
      }

      // Vendor - Submit Estimasi
      if (titleLower.includes('spk penugasan baru') || titleLower.includes('pengurusan dokumen baru')) {
        return fsr.status === 'Waiting Estimasi';
      }

      // Vendor - Vehicle Arrival ("Masuk Bengkel")
      if (titleLower.includes('spk body repair baru') || titleLower.includes('mulai perbaikan unit')) {
        return fsr.status === 'Waiting Vendor';
      }

      // Leader Ops / Leader Customer - Approve Estimasi
      if (titleLower.includes('persetujuan estimasi')) {
        if (titleLower.includes('vendor')) {
          // Leader Operation
          return fsr.status === 'Waiting Approval Leader Operation';
        } else {
          // Leader Customer / Estimasi Dokumen / Estimasi FSR
          return fsr.status === 'Waiting Approval Customer';
        }
      }

      // Vendor / SA - Negotiation
      if (titleLower.includes('negosiasi')) {
        return fsr.status === 'Negotiation';
      }

      // TS - Task Assigned
      if (titleLower.includes('tugas perbaikan baru')) {
        return fsr.status === 'Waiting TS';
      }

      // Vendor - Document On Progress
      if (titleLower.includes('proses pengurusan dokumen')) {
        return fsr.status === 'On Progress';
      }

      // Admin Customer - Unit Under Repair or Finished
      if (titleLower.includes('sedang diperbaiki')) {
        return fsr.status === 'On Progress';
      }
      if (titleLower.includes('pekerjaan selesai')) {
        return fsr.status === 'Finished';
      }

      return true; // Keep others by default
    });
  }

  public async markNotificationAsRead(id: string): Promise<void> {
    const list = this.getList<Notification>(KEYS.NOTIFICATIONS);
    const idx = list.findIndex(n => n.id === id);
    if (idx !== -1) {
      list[idx].is_read = true;
      this.setList(KEYS.NOTIFICATIONS, list);
      await writeThroughToSupabase('notifications', list[idx]);
    }
  }

  // Delete FSR (Hard Delete)
  public async deleteFsr(id: string, actor: OperationUser): Promise<void> {
    const list = this.getList<Fsr>(KEYS.FSRS);
    const idx = list.findIndex(f => f.id === id);
    if (idx !== -1) {
      const item = list[idx];
      list.splice(idx, 1);
      this.setList(KEYS.FSRS, list);
      this.addActivity('Delete FSR', `Menghapus FSR: ${item.no_fsr}`, actor);

      // Clean related local records
      const notifs = this.getList<Notification>(KEYS.NOTIFICATIONS).filter(n => n.fsr_id !== id);
      this.setList(KEYS.NOTIFICATIONS, notifs);

      const histories = this.getList<FsrHistory>(KEYS.FSR_HISTORY).filter(h => h.fsr_id !== id);
      this.setList(KEYS.FSR_HISTORY, histories);

      const estimasis = this.getList<EstimasiItem>(KEYS.ESTIMASI).filter(e => e.fsr_id !== id);
      this.setList(KEYS.ESTIMASI, estimasis);

      // Cascade delete relations in Supabase
      try {
        await supabase.from('notifications').delete().eq('fsr_id', id);
        await supabase.from('estimasi').delete().eq('fsr_id', id);
        await supabase.from('fsr_history').delete().eq('fsr_id', id);
      } catch (e) {
        console.warn('[Supabase Cascade Delete Notice]', e);
      }

      // Delete FSR record in Supabase
      await deleteFromSupabase('fsr', id);
      if (item.no_fsr) {
        try {
          await supabase.from('fsr').delete().eq('no_fsr', item.no_fsr);
        } catch (e) {}
      }

      // Notify local listeners
      try {
        window.dispatchEvent(new CustomEvent('fsr_db_updated', { detail: { table: 'fsr', eventType: 'DELETE', id } }));
      } catch (e) {}
    }
  }

  // ⚙️ THE MAIN WORKFLOW STATE-MACHINE ⚙️
  // It handles all conditional paths for Maintenance, Body Repair, and Document category.
  public async processFsrWorkflow(
    fsrId: string,
    action: 'APPROVE_LEADER_CUST' | 'REJECT_LEADER_CUST' | 'CANCEL_LEADER_CUST' | 'ASSIGN_VENDOR_SPK' | 'SUBMIT_ESTIMASI' | 'APPROVE_LEADER_OPS' | 'APPROVE_EST_CUST' | 'NEGOTIATE_EST' | 'MASUK_BENGKEL' | 'SELESAI_PERBAIKAN',
    payload: {
      catatan?: string;
      catatan_mulai_pekerjaan?: string | null;
      catatan_selesai_pekerjaan?: string | null;
      vendor_name?: string;
      no_vmd?: string;
      no_spk?: string;
      nama_ts?: string;
      estimasi_biaya?: number;
      items?: EstimasiItem[];
      is_internal?: boolean;
      biaya_estimasi_or?: number | null;
      estimasi_or_url?: string | null;
      estimasi_or_name?: string | null;
      estimasi_vendor_url?: string | null;
      estimasi_vendor_name?: string | null;
      tanggal_masuk_bengkel?: string | null;
      tanggal_selesai_perbaikan?: string | null;
    },
    actor: OperationUser
  ): Promise<Fsr> {
    const list = this.getList<Fsr>(KEYS.FSRS);
    const idx = list.findIndex(f => f.id === fsrId);
    if (idx === -1) throw new Error('FSR tidak ditemukan');

    const fsr = list[idx];
    const now = new Date().toISOString();
    let nextStatus: FsrStatus = fsr.status;
    let logCatatan = payload.catatan || 'Memproses tahapan workflow.';

    switch (action) {
      case 'APPROVE_LEADER_CUST':
        nextStatus = 'Approved Leader Customer';
        fsr.tanggal_approve_leader_customer = now;
        logCatatan = payload.catatan || 'Disetujui oleh Leader Customer.';
        
        // Notify PIC Operasional (SA, SS, VRO) based on Category
        if (fsr.kategori_layanan === 'Maintenance') {
          await this.createNotification('SA', 'FSR Baru Menunggu Penugasan (SA)', `FSR ${fsr.no_fsr} disetujui Leader Customer. Segera tentukan pelaksana (Internal/Vendor).`, fsr.id);
          await this.createNotification('SS', 'FSR Baru Menunggu Penugasan (SS)', `FSR ${fsr.no_fsr} disetujui Leader Customer.`, fsr.id);
        } else if (fsr.kategori_layanan === 'Body Repair') {
          await this.createNotification('SS', 'FSR Body Repair Menunggu SPK & Vendor', `FSR ${fsr.no_fsr} siap dialokasikan Vendor Body Repair.`, fsr.id);
        } else if (fsr.kategori_layanan === 'Document') {
          await this.createNotification('VRO', 'FSR Dokumen Menunggu Proses VRO', `FSR ${fsr.no_fsr} telah disetujui, silakan diproses VRO.`, fsr.id);
        }
        break;

      case 'REJECT_LEADER_CUST':
        nextStatus = 'Rejected';
        fsr.tanggal_cancel_leader_customer = now;
        logCatatan = payload.catatan || 'Pengajuan ditolak oleh Leader Customer.';

        // Clean up previous operational task notifications so other roles don't keep obsolete tasks
        const notifsAfterReject = this.getList<Notification>(KEYS.NOTIFICATIONS).filter(
          n => n.fsr_id !== fsr.id || n.user_role === 'Admin Customer'
        );
        this.setList(KEYS.NOTIFICATIONS, notifsAfterReject);

        await this.createNotification('Admin Customer', 'FSR Anda Ditolak', `FSR ${fsr.no_fsr} ditolak dengan catatan: ${logCatatan}`, fsr.id);
        break;

      case 'CANCEL_LEADER_CUST':
        nextStatus = 'Cancelled';
        fsr.tanggal_cancel_leader_customer = now;
        logCatatan = payload.catatan || 'Pengajuan dibatalkan.';

        // Clean up all pending operational notifications
        const notifsAfterCancel = this.getList<Notification>(KEYS.NOTIFICATIONS).filter(
          n => n.fsr_id !== fsr.id || n.user_role === 'Admin Customer'
        );
        this.setList(KEYS.NOTIFICATIONS, notifsAfterCancel);
        break;

      case 'ASSIGN_VENDOR_SPK':
        fsr.no_spk = payload.no_spk || `SPK/OPS/${new Date().getFullYear()}/${Math.floor(1000 + Math.random() * 9000)}`;
        fsr.tanggal_proses = now;
        fsr.nama_sa_ss_vro = actor.nama;
        fsr.role_sa_ss_vro = actor.role_operation as any;

        // Clean up previous vendor notifications for this FSR so previously assigned vendors don't retain tasks
        const notifsBeforeVendorAssign = this.getList<Notification>(KEYS.NOTIFICATIONS).filter(
          n => !(n.fsr_id === fsr.id && n.user_role === 'Vendor')
        );
        this.setList(KEYS.NOTIFICATIONS, notifsBeforeVendorAssign);

        // Store Own Risk (OR) fields if provided in the payload
        if (payload.biaya_estimasi_or !== undefined) {
          fsr.biaya_estimasi_or = payload.biaya_estimasi_or;
        }
        if (payload.estimasi_or_url !== undefined) {
          fsr.estimasi_or_url = payload.estimasi_or_url;
          fsr.estimasi_or_name = payload.estimasi_or_name;
        }

        // Save vendor & VMD info
        if (!payload.is_internal) {
          if (payload.vendor_name) {
            fsr.nama_vendor = payload.vendor_name;
          }
          if (payload.no_vmd) {
            fsr.no_vmd = payload.no_vmd;
          } else if (fsr.nama_vendor) {
            const matchedV = this.getVendors().find(v => v.nama_vendor.toLowerCase() === fsr.nama_vendor?.toLowerCase());
            if (matchedV) {
              fsr.no_vmd = matchedV.vmd;
            }
          }
        }

        if (fsr.kategori_layanan === 'Maintenance') {
          if (payload.is_internal) {
            // Internal Maintenance -> Technical Service (TS)
            let assignedTs = payload.nama_ts;
            if (!assignedTs) {
              const matchedTsUser = this.getUsers().find(u => u.role_operation === 'TS' && this.isBranchMatching(u.cabang_handling, fsr.cabang));
              assignedTs = matchedTsUser ? matchedTsUser.nama : `TS Internal (${fsr.cabang || 'Cabang'})`;
            }
            fsr.nama_ts = assignedTs;
            nextStatus = 'Waiting TS';
            logCatatan = `Ditugaskan ke TS Internal (${assignedTs}) Cabang ${fsr.cabang || '-'}. SPK No: ${fsr.no_spk}.`;
            await this.createNotification('TS', 'Tugas Perbaikan Baru', `FSR ${fsr.no_fsr} (Cabang: ${fsr.cabang || '-'}) ditugaskan ke TS Internal (${assignedTs}). Segera lakukan penanganan.`, fsr.id);
          } else {
            // Vendor Maintenance
            fsr.nama_vendor = payload.vendor_name || fsr.nama_vendor || 'Bengkel Agung Mandiri';
            nextStatus = 'Waiting Estimasi';
            const vmdText = fsr.no_vmd ? ` (VMD: ${fsr.no_vmd})` : '';
            logCatatan = `Ditugaskan ke Vendor: ${fsr.nama_vendor}${vmdText}. SPK No: ${fsr.no_spk}. Menunggu estimasi biaya.`;
            await this.createNotification('Vendor', 'SPK Penugasan Baru', `SPK ${fsr.no_spk} masuk. Harap input estimasi biaya perbaikan.`, fsr.id);
          }
        } else if (fsr.kategori_layanan === 'Body Repair') {
          fsr.nama_vendor = payload.vendor_name || fsr.nama_vendor || 'CV Body Repair Lestari';
          nextStatus = 'Waiting Vendor';
          const vmdText = fsr.no_vmd ? ` (VMD: ${fsr.no_vmd})` : '';
          logCatatan = `FSR Body Repair dialokasikan ke Vendor: ${fsr.nama_vendor}${vmdText}. SPK No: ${fsr.no_spk}. Menunggu unit masuk bengkel.`;
          await this.createNotification('Vendor', 'SPK Body Repair Baru', `SPK ${fsr.no_spk} masuk. Segera konfirmasi "Masuk Bengkel" jika unit sudah tiba.`, fsr.id);
        } else if (fsr.kategori_layanan === 'Document') {
          fsr.nama_vendor = payload.vendor_name || fsr.nama_vendor || 'PT Biro Jasa Sinar Utama';
          nextStatus = 'Waiting Estimasi'; // For documents, upload estimasi too
          const vmdText = fsr.no_vmd ? ` (VMD: ${fsr.no_vmd})` : '';
          logCatatan = `Dokumen dialokasikan ke Vendor: ${fsr.nama_vendor}${vmdText}. SPK No: ${fsr.no_spk}.`;
          await this.createNotification('Vendor', 'Pengurusan Dokumen Baru', `Penugasan pengurusan dokumen unit ${fsr.no_polisi}`, fsr.id);
        }
        break;

      case 'SUBMIT_ESTIMASI':
        fsr.estimasi_biaya = payload.estimasi_biaya || 0;
        
        if (payload.estimasi_vendor_url !== undefined) {
          fsr.estimasi_vendor_url = payload.estimasi_vendor_url;
          fsr.estimasi_vendor_name = payload.estimasi_vendor_name;
        }
        
        // Save detail estimation items if provided
        if (payload.items) {
          await this.saveEstimations(fsr.id, payload.items);
        }

        if (fsr.kategori_layanan === 'Document') {
          // Documents skip Leader Operation Approval, directly to Customer Approval
          nextStatus = 'Waiting Approval Customer';
          logCatatan = `Estimasi biaya Rp ${fsr.estimasi_biaya.toLocaleString()} diajukan. Menunggu approval Customer.`;
          await this.createNotification('Leader Customer', 'Persetujuan Estimasi Dokumen', `Estimasi dokumen ${fsr.no_fsr} senilai Rp ${fsr.estimasi_biaya.toLocaleString()} menunggu persetujuan Anda.`, fsr.id);
        } else {
          // Maintenance & Body Repair require Leader Operation Approval first
          nextStatus = 'Waiting Approval Leader Operation';
          logCatatan = `Vendor mengajukan estimasi biaya Rp ${fsr.estimasi_biaya.toLocaleString()}. Menunggu persetujuan Leader Operation.`;
          await this.createNotification('Leader Operation', 'Persetujuan Estimasi Vendor', `FSR ${fsr.no_fsr} (Vendor: ${fsr.nama_vendor}) mengajukan estimasi Rp ${fsr.estimasi_biaya.toLocaleString()}.`, fsr.id);
        }
        break;

      case 'APPROVE_LEADER_OPS':
        nextStatus = 'Waiting Approval Customer';
        fsr.tanggal_estimasi_approved_by_leader = now;
        logCatatan = payload.catatan || 'Estimasi disetujui Leader Operation. Menunggu persetujuan Customer.';
        
        // Notify leader customer
        await this.createNotification('Leader Customer', 'Persetujuan Estimasi FSR', `FSR ${fsr.no_fsr} disetujui Leader Ops. Nilai estimasi: Rp ${fsr.estimasi_biaya?.toLocaleString()}. Mohon berikan keputusan.`, fsr.id);
        break;

      case 'APPROVE_EST_CUST':
        fsr.tanggal_estimasi_approved_by_customer = now;
        
        if (fsr.kategori_layanan === 'Document') {
          // Document perbaikan is immediately "On Progress" for processing
          nextStatus = 'On Progress';
          logCatatan = 'Estimasi disetujui Customer. Dokumen dalam proses pengurusan.';
          await this.createNotification('Vendor', 'Proses Pengurusan Dokumen', `Estimasi disetujui Customer. Silakan lakukan penyelesaian dokumen.`, fsr.id);
        } else {
          // Waiting Vendor to start (Masuk Bengkel)
          nextStatus = 'Waiting Vendor';
          logCatatan = 'Estimasi disetujui Customer. Menunggu unit masuk bengkel untuk perbaikan.';
          await this.createNotification('Vendor', 'Mulai Perbaikan Unit', `Estimasi disetujui Customer. Segera konfirmasi "Masuk Bengkel" jika unit sudah tiba.`, fsr.id);
        }
        break;

      case 'NEGOTIATE_EST':
        nextStatus = 'Negotiation';
        logCatatan = payload.catatan || 'Customer mengajukan negosiasi harga.';
        await this.createNotification('Vendor', 'Negosiasi Estimasi', `Customer meminta negosiasi ulang estimasi FSR ${fsr.no_fsr}. Catatan: ${logCatatan}`, fsr.id);
        await this.createNotification('SA', 'Negosiasi FSR', `Negosiasi diajukan oleh customer.`, fsr.id);
        break;

      case 'MASUK_BENGKEL':
        nextStatus = 'On Progress';
        fsr.tanggal_masuk_bengkel = (actor.role_operation === 'TS' ? now : (payload.tanggal_masuk_bengkel || now));
        if (payload.catatan_mulai_pekerjaan !== undefined) {
          fsr.catatan_mulai_pekerjaan = payload.catatan_mulai_pekerjaan;
        } else if (payload.catatan) {
          fsr.catatan_mulai_pekerjaan = payload.catatan;
        }

        {
          const formattedDate = new Date(fsr.tanggal_masuk_bengkel).toLocaleString('id-ID', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          });
          const noteExtra = fsr.catatan_mulai_pekerjaan ? ` Catatan: "${fsr.catatan_mulai_pekerjaan}"` : '';
          logCatatan = (actor.role_operation === 'TS' || fsr.nama_ts)
            ? `Pengerjaan internal dimulai oleh TS (${fsr.nama_ts || actor.nama}) pada ${formattedDate}.${noteExtra}`
            : `Unit dikonfirmasi MASUK BENGKEL pada ${formattedDate}. Proses perbaikan dimulai.${noteExtra}`;
        }
        
        // Notify Customer and SA
        await this.createNotification('Admin Customer', 'Unit Sedang Diperbaiki', `Unit Anda ${fsr.no_polisi} sedang dalam proses pengerjaan oleh ${fsr.nama_ts || fsr.nama_vendor || 'Teknisi'}.`, fsr.id);
        break;

      case 'SELESAI_PERBAIKAN':
        nextStatus = 'Finished';
        fsr.tanggal_selesai_perbaikan = (actor.role_operation === 'TS' ? now : (payload.tanggal_selesai_perbaikan || now));
        if (payload.catatan_selesai_pekerjaan !== undefined) {
          fsr.catatan_selesai_pekerjaan = payload.catatan_selesai_pekerjaan;
        } else if (payload.catatan) {
          fsr.catatan_selesai_pekerjaan = payload.catatan;
        }

        {
          const formattedDate = new Date(fsr.tanggal_selesai_perbaikan).toLocaleString('id-ID', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          });
          const noteExtra = fsr.catatan_selesai_pekerjaan ? ` Catatan: "${fsr.catatan_selesai_pekerjaan}"` : '';
          logCatatan = (actor.role_operation === 'TS' || fsr.nama_ts)
            ? `Pekerjaan telah SELESAI dikerjakan oleh TS (${fsr.nama_ts || actor.nama}) pada ${formattedDate}. Serah terima unit.${noteExtra}`
            : `Pekerjaan dikonfirmasi SELESAI PERBAIKAN pada ${formattedDate}. Serah terima unit kembali ke customer.${noteExtra}`;
        }
        
        // Notify Customer
        await this.createNotification('Admin Customer', 'Pekerjaan Selesai', `Perbaikan unit ${fsr.no_polisi} (FSR: ${fsr.no_fsr}) sudah selesai.`, fsr.id);
        await this.createNotification('Leader Customer', 'Pekerjaan Selesai', `Perbaikan unit ${fsr.no_polisi} (FSR: ${fsr.no_fsr}) sudah selesai.`, fsr.id);
        break;
    }

    // Apply updates
    fsr.status = nextStatus;
    fsr.updated_at = now;
    fsr.updated_by = actor.username;

    list[idx] = fsr;
    this.setList(KEYS.FSRS, list);
    await writeThroughToSupabase('fsr', fsr);

    // Save history logs
    await this.addFsrHistory(fsr.id, nextStatus, logCatatan, actor);

    this.addActivity('Workflow Transition', `FSR ${fsr.no_fsr} bertransisi ke status "${nextStatus}" oleh ${actor.nama}.`, actor);

    // Batch propagation for Document category FSRs sharing the same FSR number
    if (fsr.kategori_layanan === 'Document' && action !== 'ASSIGN_VENDOR_SPK') {
      const otherFsrs = list.filter(f => f.no_fsr === fsr.no_fsr && f.id !== fsr.id && !f.deleted_at);
      for (const other of otherFsrs) {
        other.status = nextStatus;
        other.updated_at = now;
        other.updated_by = actor.username;

        if (action === 'APPROVE_LEADER_CUST') {
          other.tanggal_approve_leader_customer = now;
        } else if (action === 'REJECT_LEADER_CUST') {
          other.tanggal_cancel_leader_customer = now;
        } else if (action === 'CANCEL_LEADER_CUST') {
          other.tanggal_cancel_leader_customer = now;
        } else if (action === 'SUBMIT_ESTIMASI') {
          other.estimasi_biaya = fsr.estimasi_biaya;
          // Clone the estimation items with new IDs for other fsr_ids
          const otherEstItems = this.getEstimations(fsr.id).map(item => ({
            ...item,
            id: generateUUID(),
            fsr_id: other.id
          }));
          await this.saveEstimations(other.id, otherEstItems);
        } else if (action === 'APPROVE_LEADER_OPS') {
          other.tanggal_estimasi_approved_by_leader = now;
        } else if (action === 'APPROVE_EST_CUST') {
          other.tanggal_estimasi_approved_by_customer = now;
        } else if (action === 'SELESAI_PERBAIKAN') {
          other.tanggal_selesai_perbaikan = fsr.tanggal_selesai_perbaikan;
        }

        const otherIdx = list.findIndex(f => f.id === other.id);
        if (otherIdx !== -1) {
          list[otherIdx] = other;
        }
        await writeThroughToSupabase('fsr', other);
        await this.addFsrHistory(other.id, nextStatus, logCatatan, actor);
      }
      this.setList(KEYS.FSRS, list);
    }

    return fsr;
  }

  public async updateFsrVendor(fsrId: string, vendorName: string, noVmd: string, actor: OperationUser): Promise<Fsr | null> {
    const list = this.getList<Fsr>(KEYS.FSRS);
    const fsr = list.find(f => f.id === fsrId);
    return this.updateFsrVendorAndSpk(fsrId, vendorName, noVmd, fsr?.no_spk || '', actor);
  }

  public async updateFsrVendorAndSpk(
    fsrId: string,
    vendorName: string,
    noVmd: string,
    noSpk: string,
    actor: OperationUser
  ): Promise<Fsr | null> {
    const list = this.getList<Fsr>(KEYS.FSRS);
    const idx = list.findIndex(f => f.id === fsrId && !f.deleted_at);
    if (idx === -1) return null;

    const fsr = list[idx];
    const prevVendor = fsr.nama_vendor || 'Belum Ditentukan';
    const prevVmd = fsr.no_vmd || '-';
    const prevSpk = fsr.no_spk || '-';

    if (vendorName) fsr.nama_vendor = vendorName;
    fsr.no_vmd = noVmd || null;
    if (noSpk) fsr.no_spk = noSpk;
    fsr.updated_at = new Date().toISOString();
    fsr.updated_by = actor.username;

    list[idx] = fsr;
    this.setList(KEYS.FSRS, list);
    await writeThroughToSupabase('fsr', fsr);

    const changes: string[] = [];
    if (prevVendor !== vendorName || prevVmd !== (noVmd || '-')) {
      changes.push(`Vendor: ${prevVendor} (VMD: ${prevVmd}) ➔ ${vendorName} (VMD: ${noVmd || '-'})`);
    }
    if (prevSpk !== (noSpk || '-')) {
      changes.push(`No. SPK: ${prevSpk} ➔ ${noSpk || '-'}`);
    }

    const logDetail = changes.length > 0 ? changes.join(', ') : 'Perubahan data Vendor/SPK';
    const catatan = `Pengalihan Vendor/SPK oleh ${actor.nama} (${actor.role_operation}): ${logDetail}`;
    await this.addFsrHistory(fsr.id, fsr.status, catatan, actor);
    this.addActivity('Update Vendor & SPK FSR', `Memperbarui FSR ${fsr.no_fsr}: ${logDetail}`, actor);

    return fsr;
  }
}

export const localDb = new LocalDB();
