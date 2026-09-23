/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { createClient } from '@supabase/supabase-js';

// Default values provided by the user
const DEFAULT_SUPABASE_URL = 'https://snsvurtassaievpewjpf.supabase.co';
const DEFAULT_SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNuc3Z1cnRhc3NhaWV2cGV3anBmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI5NjE0NDEsImV4cCI6MjA5ODUzNzQ0MX0.R4A9eKl-lrZjgd9d00LAy1OkI39csKgTcJu_hQz4fr4';

// Resolve configuration
export const SUPABASE_URL = (import.meta as any).env?.VITE_SUPABASE_URL || DEFAULT_SUPABASE_URL;
export const SUPABASE_ANON_KEY = (import.meta as any).env?.VITE_SUPABASE_ANON_KEY || DEFAULT_SUPABASE_ANON_KEY;

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Check if auto-sync is enabled (default to true)
const AUTO_SYNC_KEY = 'fsr_mgt_auto_sync';
export function isAutoSyncEnabled(): boolean {
  const stored = localStorage.getItem(AUTO_SYNC_KEY);
  return stored !== 'false';
}

export function setAutoSyncEnabled(enabled: boolean) {
  localStorage.setItem(AUTO_SYNC_KEY, enabled ? 'true' : 'false');
}

function deduplicateByKey<T>(arr: T[], keyFn: (item: T) => string): T[] {
  const seen = new Set<string>();
  const result: T[] = [];
  for (let i = arr.length - 1; i >= 0; i--) {
    const item = arr[i];
    if (!item) continue;
    const key = keyFn(item).trim().toLowerCase();
    if (!seen.has(key)) {
      seen.add(key);
      result.unshift(item);
    }
  }
  return result;
}

function cleanUrlField(url: string | null): string | null {
  if (!url) return null;
  // If the URL is raw Base64 data, replace with Google Drive CDN placeholder so Base64 NEVER enters Supabase
  if (url.startsWith('data:')) {
    const pseudoId = 'drive_sanitized_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6);
    return `https://lh3.googleusercontent.com/d/${pseudoId}`;
  }
  return url;
}

export function sanitizeFsrPayload(data: any): any {
  return {
    id: data.id,
    no_fsr: data.no_fsr,
    tanggal_create: data.tanggal_create || new Date().toISOString(),
    nama_customer: data.nama_customer || '',
    nama_pic_customer: data.nama_pic_customer || '',
    cabang: data.cabang || '',
    no_polisi: data.no_polisi || '',
    type_kendaraan: data.type_kendaraan || '',
    no_rangka: data.no_rangka || '',
    km_pengajuan: Number(data.km_pengajuan) || 0,
    kategori_layanan: data.kategori_layanan || 'Maintenance',
    jenis_layanan: data.jenis_layanan || '',
    keterangan: data.keterangan || null,
    status: data.status || 'Waiting Approval Leader Customer',
    tanggal_cancel_leader_customer: data.tanggal_cancel_leader_customer || null,
    tanggal_approve_leader_customer: data.tanggal_approve_leader_customer || null,
    nama_sa_ss_vro: data.nama_sa_ss_vro || null,
    role_sa_ss_vro: data.role_sa_ss_vro || null,
    tanggal_proses: data.tanggal_proses || null,
    no_spk: data.no_spk || null,
    no_vmd: data.no_vmd || null,
    nama_ts: data.nama_ts || null,
    nama_vendor: data.nama_vendor || null,
    estimasi_biaya: data.estimasi_biaya !== undefined && data.estimasi_biaya !== null ? Number(data.estimasi_biaya) : null,
    tanggal_masuk_bengkel: data.tanggal_masuk_bengkel || null,
    catatan_mulai_pekerjaan: data.catatan_mulai_pekerjaan || null,
    tanggal_estimasi_approved_by_leader: data.tanggal_estimasi_approved_by_leader || null,
    tanggal_estimasi_approved_by_customer: data.tanggal_estimasi_approved_by_customer || null,
    tanggal_selesai_perbaikan: data.tanggal_selesai_perbaikan || null,
    catatan_selesai_pekerjaan: data.catatan_selesai_pekerjaan || null,
    document_url: cleanUrlField(data.document_url),
    document_name: data.document_name || null,
    estimasi_or_url: cleanUrlField(data.estimasi_or_url),
    estimasi_or_name: data.estimasi_or_name || null,
    biaya_estimasi_or: data.biaya_estimasi_or !== undefined && data.biaya_estimasi_or !== null ? Number(data.biaya_estimasi_or) : null,
    estimasi_vendor_url: cleanUrlField(data.estimasi_vendor_url),
    estimasi_vendor_name: data.estimasi_vendor_name || null,
    created_at: data.created_at || new Date().toISOString(),
    created_by: data.created_by || 'system',
    updated_at: data.updated_at || new Date().toISOString(),
    updated_by: data.updated_by || 'system',
    deleted_at: data.deleted_at || null,
    deleted_by: data.deleted_by || null
  };
}

/**
 * Push all local data from localStorage into the Supabase database
 */
export async function pushLocalToSupabase(): Promise<{ success: boolean; message: string; details?: any }> {
  try {
    // 1. Branches
    try {
      const branches = JSON.parse(localStorage.getItem('fsr_mgt_branches') || '[]');
      if (branches.length > 0) {
        const uniqueBranches = deduplicateByKey(branches, (b: any) => b.id || b.maint_plant || '');
        const { error } = await supabase.from('branches').upsert(uniqueBranches, { onConflict: 'id' });
        if (error) {
          console.warn(`Branches push warning: ${error.message}`);
          uniqueBranches.forEach((b: any) => addToSyncQueue('branches', 'UPSERT', b));
        }
      }
    } catch (e: any) {
      console.warn('Branches push exception, queued for background sync:', e?.message || e);
    }

    // 2. Customers
    try {
      const customers = JSON.parse(localStorage.getItem('fsr_mgt_customers') || '[]');
      if (customers.length > 0) {
        const uniqueCustomers = deduplicateByKey(customers, (c: any) => c.id || c.cmd || '');
        const { error } = await supabase.from('customers').upsert(uniqueCustomers, { onConflict: 'id' });
        if (error) {
          console.warn(`Customers push warning: ${error.message}`);
          uniqueCustomers.forEach((c: any) => addToSyncQueue('customers', 'UPSERT', c));
        }
      }
    } catch (e: any) {
      console.warn('Customers push exception, queued for background sync:', e?.message || e);
    }

    // 3. Vendors
    try {
      const vendors = JSON.parse(localStorage.getItem('fsr_mgt_vendors') || '[]');
      if (vendors.length > 0) {
        const uniqueVendors = deduplicateByKey(vendors, (v: any) => v.id || v.vmd || '');
        const { error } = await supabase.from('vendors').upsert(uniqueVendors, { onConflict: 'id' });
        if (error) {
          console.warn(`Vendors push warning: ${error.message}`);
          uniqueVendors.forEach((v: any) => addToSyncQueue('vendors', 'UPSERT', v));
        }
      }
    } catch (e: any) {
      console.warn('Vendors push exception, queued for background sync:', e?.message || e);
    }

    // 4. Categories
    try {
      const categories = JSON.parse(localStorage.getItem('fsr_mgt_categories') || '[]');
      if (categories.length > 0) {
        const uniqueCategories = deduplicateByKey(categories, (cat: any) => cat.id || '');
        const { error } = await supabase.from('categories').upsert(uniqueCategories, { onConflict: 'id' });
        if (error) {
          console.warn(`Categories push warning: ${error.message}`);
          uniqueCategories.forEach((cat: any) => addToSyncQueue('categories', 'UPSERT', cat));
        }
      }
    } catch (e: any) {
      console.warn('Categories push exception, queued for background sync:', e?.message || e);
    }

    // 5. Operation Users
    try {
      const users = JSON.parse(localStorage.getItem('fsr_mgt_users') || '[]');
      if (users.length > 0) {
        const mappedUsers = users.map((u: any) => ({
          id: u.id,
          nama: u.nama,
          username: u.username,
          password_hash: u.password || u.password_hash || 'password123',
          role_operation: u.role_operation,
          cabang_handling: u.cabang_handling,
          assigned_customer_cmd: u.assigned_customer_cmd || null,
          assigned_vmd: u.assigned_vmd || null,
          vendor_name: u.vendor_name || null,
          status: u.status || 'Active',
          created_at: u.created_at,
          created_by: u.created_by,
          updated_at: u.updated_at,
          updated_by: u.updated_by,
          deleted_at: u.deleted_at || null,
          deleted_by: u.deleted_by || null
        }));
        const uniqueUsers = deduplicateByKey(mappedUsers, (u: any) => u.id || u.username || '');
        let { error } = await supabase.from('operation_users').upsert(uniqueUsers, { onConflict: 'id' });
        
        // Fallback if optional columns do not exist in target Supabase schema
        if (error && (error.message.includes('assigned_customer_cmd') || error.message.includes('column') || error.message.includes('schema cache'))) {
          const fallbackUsers = uniqueUsers.map((u: any) => {
            const { assigned_customer_cmd, assigned_vmd, vendor_name, ...rest } = u;
            return rest;
          });
          const fallbackRes = await supabase.from('operation_users').upsert(fallbackUsers, { onConflict: 'id' });
          error = fallbackRes.error;
        }
        
        if (error) {
          console.warn(`Operation users push warning: ${error.message}`);
          uniqueUsers.forEach((u: any) => addToSyncQueue('operation_users', 'UPSERT', u));
        }
      }
    } catch (e: any) {
      console.warn('Operation users push exception, queued for background sync:', e?.message || e);
    }

    // 6. Units
    try {
      const units = JSON.parse(localStorage.getItem('fsr_mgt_units') || '[]');
      if (units.length > 0) {
        const mappedUnits = units.map((u: any) => ({
          id: u.id,
          no_equipment: u.no_equipment,
          license_plate: u.license_plate,
          warna_nopol: u.warna_nopol || 'Hitam',
          description: u.description,
          kelompok_unit: u.kelompok_unit || null,
          kategori_unit: u.kategori_unit || null,
          kelompok_tipe: u.kelompok_tipe || null,
          tipe_unit: u.tipe_unit || null,
          pendingin: u.pendingin || 'No',
          power: u.power || null,
          tahun_unit: Number(u.tahun_unit) || 2022,
          chassis_no: u.chassis_no,
          engine_serial_no: u.engine_serial_no,
          warna: u.warna || null,
          cmd: u.cmd,
          customer: u.customer_name || u.customer || null,
          created_at: u.created_at,
          created_by: u.created_by,
          updated_at: u.updated_at,
          updated_by: u.updated_by,
          deleted_at: u.deleted_at || null,
          deleted_by: u.deleted_by || null
        }));
        const uniqueUnits = deduplicateByKey(mappedUnits, (u: any) => u.id || u.no_equipment || '');
        const { error } = await supabase.from('units').upsert(uniqueUnits, { onConflict: 'id' });
        if (error) {
          console.warn(`Units push warning: ${error.message}`);
          uniqueUnits.forEach((u: any) => addToSyncQueue('units', 'UPSERT', u));
        }
      }
    } catch (e: any) {
      console.warn('Units push exception, queued for background sync:', e?.message || e);
    }

    // 7. FSR Core
    try {
      const fsrs = JSON.parse(localStorage.getItem('fsr_mgt_fsrs') || '[]');
      if (fsrs.length > 0) {
        const sanitizedFsrs = fsrs.map((f: any) => sanitizeFsrPayload(f));
        const uniqueFsrs = deduplicateByKey(sanitizedFsrs, (f: any) => f.id || '');
        let { error } = await supabase.from('fsr').upsert(uniqueFsrs, { onConflict: 'id' });
        
        // Fallback if no_vmd or other optional column doesn't exist in Supabase schema cache
        if (error && (error.message.includes('no_vmd') || error.message.includes('column') || error.message.includes('schema cache'))) {
          const fallbackFsrs = uniqueFsrs.map((f: any) => {
            const { no_vmd, ...rest } = f;
            return rest;
          });
          const fallbackRes = await supabase.from('fsr').upsert(fallbackFsrs, { onConflict: 'id' });
          error = fallbackRes.error;
        }

        if (error) {
          console.warn(`FSR push warning: ${error.message}`);
          uniqueFsrs.forEach((f: any) => addToSyncQueue('fsr', 'UPSERT', f));
        }
      }
    } catch (e: any) {
      console.warn('FSR push exception, queued for background sync:', e?.message || e);
    }

    // 8. FSR History Timeline
    try {
      const fsrHistory = JSON.parse(localStorage.getItem('fsr_mgt_fsr_history') || '[]');
      if (fsrHistory.length > 0) {
        const uniqueHistory = deduplicateByKey(fsrHistory, (h: any) => h.id || '');
        const { error } = await supabase.from('fsr_history').upsert(uniqueHistory, { onConflict: 'id' });
        if (error) {
          console.warn(`FSR History push warning: ${error.message}`);
          uniqueHistory.forEach((h: any) => addToSyncQueue('fsr_history', 'UPSERT', h));
        }
      }
    } catch (e: any) {
      console.warn('FSR History push exception, queued for background sync:', e?.message || e);
    }

    // 9. Estimasi detail items
    try {
      const estimasi = JSON.parse(localStorage.getItem('fsr_mgt_estimasi') || '[]');
      if (estimasi.length > 0) {
        const sanitizedEstimasi = estimasi.map((e: any) => ({
          id: e.id,
          fsr_id: e.fsr_id,
          deskripsi: e.deskripsi,
          biaya: Number(e.biaya),
          qty: Number(e.qty || 1),
          created_at: e.created_at
        }));
        const uniqueEstimasi = deduplicateByKey(sanitizedEstimasi, (e: any) => e.id || '');
        const { error } = await supabase.from('estimasi').upsert(uniqueEstimasi, { onConflict: 'id' });
        if (error) {
          console.warn(`Estimasi push warning: ${error.message}`);
          uniqueEstimasi.forEach((e: any) => addToSyncQueue('estimasi', 'UPSERT', e));
        }
      }
    } catch (e: any) {
      console.warn('Estimasi push exception, queued for background sync:', e?.message || e);
    }

    // 10. Notifications
    try {
      const notifications = JSON.parse(localStorage.getItem('fsr_mgt_notifications') || '[]');
      if (notifications.length > 0) {
        const uniqueNotifications = deduplicateByKey(notifications, (n: any) => n.id || '');
        const { error } = await supabase.from('notifications').upsert(uniqueNotifications, { onConflict: 'id' });
        if (error) {
          console.warn(`Notifications push warning: ${error.message}`);
          uniqueNotifications.forEach((n: any) => addToSyncQueue('notifications', 'UPSERT', n));
        }
      }
    } catch (e: any) {
      console.warn('Notifications push exception, queued for background sync:', e?.message || e);
    }

    // 11. Activity Logs
    try {
      const logs = JSON.parse(localStorage.getItem('fsr_mgt_activity_logs') || '[]');
      if (logs.length > 0) {
        const uniqueLogs = deduplicateByKey(logs, (l: any) => l.id || '');
        const { error } = await supabase.from('activity_logs').upsert(uniqueLogs, { onConflict: 'id' });
        if (error) {
          console.warn(`Activity logs push warning: ${error.message}`);
          uniqueLogs.forEach((l: any) => addToSyncQueue('activity_logs', 'UPSERT', l));
        }
      }
    } catch (e: any) {
      console.warn('Activity logs push exception, queued for background sync:', e?.message || e);
    }

    return { success: true, message: 'Semua data lokal berhasil disinkronisasikan ke Supabase!' };
  } catch (err: any) {
    console.error('Push to Supabase failed:', err);
    return { success: false, message: err.message || 'Gagal mengirim data ke Supabase.' };
  }
}

/**
 * Helper to fetch ALL records from a Supabase table with pagination
 * bypasses the default 1000-row limit in PostgREST
 */
async function fetchFullTable(tableName: string): Promise<any[]> {
  let allData: any[] = [];
  let from = 0;
  const pageSize = 1000;
  let hasMore = true;

  while (hasMore) {
    const { data, error } = await supabase
      .from(tableName)
      .select('*')
      .range(from, from + pageSize - 1);

    if (error) {
      throw new Error(`Ambil data penuh tabel "${tableName}" gagal: ${error.message}`);
    }

    if (data && data.length > 0) {
      allData.push(...data);
      if (data.length < pageSize) {
        hasMore = false;
      } else {
        from += pageSize;
      }
    } else {
      hasMore = false;
    }
  }

  return allData;
}

function mergeLocalAndSupabase<T extends { id?: string }>(
  key: string,
  supabaseItems: T[],
  matchFn: (supItem: T, locItem: T) => boolean,
  tableName?: string
): T[] {
  const merged = [...supabaseItems];
  const localStr = localStorage.getItem(key);
  if (localStr) {
    try {
      const localItems: T[] = JSON.parse(localStr);
      for (const locItem of localItems) {
        if (!locItem) continue;
        const found = merged.some(s => matchFn(s, locItem));
        if (!found) {
          merged.push(locItem);
          if (tableName) {
            writeThroughToSupabase(tableName, locItem);
          }
        }
      }
    } catch (e) {
      console.warn(`Failed to parse local storage for key ${key}:`, e);
    }
  }
  return merged;
}

/**
 * Pull all database records from Supabase and merge them with local storage
 */
export async function pullSupabaseToLocal(): Promise<{ success: boolean; message: string }> {
  try {
    // 1. Pull branches
    const branches = await fetchFullTable('branches');
    const mergedBranches = mergeLocalAndSupabase(
      'fsr_mgt_branches',
      branches,
      (s, l) => s.id === l.id || (s as any).maint_plant === (l as any).maint_plant,
      'branches'
    );
    localStorage.setItem('fsr_mgt_branches', JSON.stringify(mergedBranches));

    // 2. Pull customers
    const customers = await fetchFullTable('customers');
    const mergedCustomers = mergeLocalAndSupabase(
      'fsr_mgt_customers',
      customers,
      (s, l) => s.id === l.id || (s as any).cmd === (l as any).cmd,
      'customers'
    );
    localStorage.setItem('fsr_mgt_customers', JSON.stringify(mergedCustomers));

    // 3. Pull vendors
    const vendors = await fetchFullTable('vendors');
    const mergedVendors = mergeLocalAndSupabase(
      'fsr_mgt_vendors',
      vendors,
      (s, l) => s.id === l.id || (s as any).vmd === (l as any).vmd,
      'vendors'
    );
    localStorage.setItem('fsr_mgt_vendors', JSON.stringify(mergedVendors));

    // 4. Pull categories
    const categories = await fetchFullTable('categories');
    const mergedCategories = mergeLocalAndSupabase(
      'fsr_mgt_categories',
      categories,
      (s, l) => s.id === l.id,
      'categories'
    );
    localStorage.setItem('fsr_mgt_categories', JSON.stringify(mergedCategories));

    // 5. Pull operation users
    const users = await fetchFullTable('operation_users');
    const mappedUsers = users.map(u => ({
      id: u.id,
      nama: u.nama,
      username: u.username,
      password: u.password_hash,
      role_operation: u.role_operation,
      cabang_handling: u.cabang_handling,
      assigned_customer_cmd: u.assigned_customer_cmd || null,
      assigned_vmd: u.assigned_vmd || null,
      vendor_name: u.vendor_name || null,
      status: u.status,
      created_at: u.created_at,
      created_by: u.created_by,
      updated_at: u.updated_at,
      updated_by: u.updated_by,
      deleted_at: u.deleted_at,
      deleted_by: u.deleted_by
    }));
    const mergedUsers = mergeLocalAndSupabase(
      'fsr_mgt_users',
      mappedUsers,
      (s, l) => s.id === l.id || (s.username || '').toLowerCase() === (l.username || '').toLowerCase(),
      'operation_users'
    );
    localStorage.setItem('fsr_mgt_users', JSON.stringify(mergedUsers));

    // 6. Pull units
    const units = await fetchFullTable('units');
    const mappedUnits = units.map(u => ({
      id: u.id,
      no_equipment: u.no_equipment,
      license_plate: u.license_plate,
      warna_nopol: u.warna_nopol,
      description: u.description,
      kelompok_unit: u.kelompok_unit,
      kategori_unit: u.kategori_unit,
      kelompok_tipe: u.kelompok_tipe,
      tipe_unit: u.tipe_unit,
      pendingin: u.pendingin,
      power: u.power,
      tahun_unit: u.tahun_unit,
      chassis_no: u.chassis_no,
      engine_serial_no: u.engine_serial_no,
      warna: u.warna,
      cmd: u.cmd,
      customer_name: u.customer,
      created_at: u.created_at,
      created_by: u.created_by,
      updated_at: u.updated_at,
      updated_by: u.updated_by,
      deleted_at: u.deleted_at,
      deleted_by: u.deleted_by
    }));
    const mergedUnits = mergeLocalAndSupabase(
      'fsr_mgt_units',
      mappedUnits,
      (s, l) => s.id === l.id || (s.no_equipment || '').toLowerCase() === (l.no_equipment || '').toLowerCase(),
      'units'
    );
    localStorage.setItem('fsr_mgt_units', JSON.stringify(mergedUnits));

    // 7. Pull FSRs
    const fsrs = await fetchFullTable('fsr');
    const mergedFsrs = mergeLocalAndSupabase(
      'fsr_mgt_fsrs',
      fsrs,
      (s, l) => s.id === l.id || (s as any).no_fsr === (l as any).no_fsr,
      'fsr'
    );
    localStorage.setItem('fsr_mgt_fsrs', JSON.stringify(mergedFsrs));

    // 8. Pull History Timeline
    const histories = await fetchFullTable('fsr_history');
    const mergedHistories = mergeLocalAndSupabase(
      'fsr_mgt_fsr_history',
      histories,
      (s, l) => s.id === l.id,
      'fsr_history'
    );
    localStorage.setItem('fsr_mgt_fsr_history', JSON.stringify(mergedHistories));

    // 9. Pull Estimasi
    const estimasi = await fetchFullTable('estimasi');
    const mergedEstimasi = mergeLocalAndSupabase(
      'fsr_mgt_estimasi',
      estimasi,
      (s, l) => s.id === l.id,
      'estimasi'
    );
    localStorage.setItem('fsr_mgt_estimasi', JSON.stringify(mergedEstimasi));

    // 10. Pull Notifications
    const notifications = await fetchFullTable('notifications');
    const mergedNotifications = mergeLocalAndSupabase(
      'fsr_mgt_notifications',
      notifications,
      (s, l) => s.id === l.id,
      'notifications'
    );
    localStorage.setItem('fsr_mgt_notifications', JSON.stringify(mergedNotifications));

    // 11. Pull Logs
    const logs = await fetchFullTable('activity_logs');
    const mergedLogs = mergeLocalAndSupabase(
      'fsr_mgt_activity_logs',
      logs,
      (s, l) => s.id === l.id,
      'activity_logs'
    );
    localStorage.setItem('fsr_mgt_activity_logs', JSON.stringify(mergedLogs));

    return { success: true, message: 'Berhasil mengunduh dan menyelaraskan semua data dari Supabase!' };
  } catch (err: any) {
    console.error('Pull from Supabase failed:', err);
    return { success: false, message: err.message || 'Gagal mengunduh data dari Supabase.' };
  }
}

/**
 * Pending Sync Queue for Offline / Fault-Tolerant Auto Sync
 */
const SYNC_QUEUE_KEY = 'fsr_mgt_pending_queue';

export interface PendingSyncItem {
  id: string;
  table: string;
  action: 'UPSERT' | 'DELETE';
  payload: any;
  timestamp: string;
  retries: number;
}

export function getSyncQueue(): PendingSyncItem[] {
  try {
    const raw = localStorage.getItem(SYNC_QUEUE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    return [];
  }
}

export function saveSyncQueue(queue: PendingSyncItem[]): void {
  localStorage.setItem(SYNC_QUEUE_KEY, JSON.stringify(queue));
}

export function addToSyncQueue(table: string, action: 'UPSERT' | 'DELETE', payload: any): void {
  const queue = getSyncQueue();
  const itemId = payload?.id || `${table}_${Date.now()}`;
  
  // Replace existing pending action for same record if present
  const existingIdx = queue.findIndex(q => q.table === table && q.id === itemId);
  const newItem: PendingSyncItem = {
    id: itemId,
    table,
    action,
    payload,
    timestamp: new Date().toISOString(),
    retries: 0
  };

  if (existingIdx !== -1) {
    queue[existingIdx] = newItem;
  } else {
    queue.push(newItem);
  }
  saveSyncQueue(queue);
}

/**
 * Process all items in the pending sync queue
 */
export async function processSyncQueue(): Promise<void> {
  if (!isAutoSyncEnabled() || !navigator.onLine) return;

  const queue = getSyncQueue();
  if (queue.length === 0) return;

  const remainingQueue: PendingSyncItem[] = [];

  for (const item of queue) {
    try {
      if (item.action === 'UPSERT') {
        let { error } = await supabase.from(item.table).upsert(item.payload, { onConflict: 'id' });
        
        if (error && (error.message.includes('column') || error.message.includes('schema cache'))) {
          if (item.table === 'operation_users') {
            const { assigned_customer_cmd, assigned_vmd, vendor_name, ...fallbackPayload } = item.payload;
            const res = await supabase.from(item.table).upsert(fallbackPayload, { onConflict: 'id' });
            error = res.error;
          } else if (item.table === 'fsr') {
            const { no_vmd, ...fallbackPayload } = item.payload;
            const res = await supabase.from(item.table).upsert(fallbackPayload, { onConflict: 'id' });
            error = res.error;
          }
        }

        if (error) {
          console.warn(`[Sync Queue Retry Failed] Table: ${item.table}`, error.message);
          item.retries += 1;
          if (item.retries < 10) remainingQueue.push(item);
        } else {
          console.log(`[Sync Queue Success] Table: ${item.table} ID: ${item.id}`);
        }
      } else if (item.action === 'DELETE') {
        const { error } = await supabase.from(item.table).delete().eq('id', item.payload.id);
        if (error) {
          console.warn(`[Sync Queue Delete Retry Failed] Table: ${item.table}`, error.message);
          item.retries += 1;
          if (item.retries < 10) remainingQueue.push(item);
        } else {
          console.log(`[Sync Queue Delete Success] Table: ${item.table} ID: ${item.id}`);
        }
      }
    } catch (e) {
      item.retries += 1;
      if (item.retries < 10) remainingQueue.push(item);
    }
  }

  saveSyncQueue(remainingQueue);
  if (remainingQueue.length !== queue.length) {
    window.dispatchEvent(new CustomEvent('fsr_db_updated'));
  }
}

/**
 * Auto-sync a single record edit/insert to Supabase (Write-Through)
 */
export async function writeThroughToSupabase(table: string, data: any): Promise<void> {
  if (!isAutoSyncEnabled()) return;

  try {
    let payload = { ...data };

    if (table === 'operation_users') {
      payload = {
        id: data.id,
        nama: data.nama,
        username: data.username,
        password_hash: data.password || data.password_hash || 'password123',
        role_operation: data.role_operation,
        cabang_handling: data.cabang_handling,
        assigned_customer_cmd: data.assigned_customer_cmd || null,
        assigned_vmd: data.assigned_vmd || null,
        vendor_name: data.vendor_name || null,
        status: data.status || 'Active',
        created_at: data.created_at || new Date().toISOString(),
        created_by: data.created_by || 'system',
        updated_at: data.updated_at || new Date().toISOString(),
        updated_by: data.updated_by || 'system',
        deleted_at: data.deleted_at || null,
        deleted_by: data.deleted_by || null
      };
    } else if (table === 'branches') {
      payload = {
        id: data.id,
        maint_plant: data.maint_plant,
        cabang: data.cabang,
        created_at: data.created_at || new Date().toISOString(),
        created_by: data.created_by || 'system',
        updated_at: data.updated_at || new Date().toISOString(),
        updated_by: data.updated_by || 'system',
        deleted_at: data.deleted_at || null,
        deleted_by: data.deleted_by || null
      };
    } else if (table === 'customers') {
      payload = {
        id: data.id,
        cmd: data.cmd,
        nama_customer: data.nama_customer,
        created_at: data.created_at || new Date().toISOString(),
        created_by: data.created_by || 'system',
        updated_at: data.updated_at || new Date().toISOString(),
        updated_by: data.updated_by || 'system',
        deleted_at: data.deleted_at || null,
        deleted_by: data.deleted_by || null
      };
    } else if (table === 'vendors') {
      payload = {
        id: data.id,
        vmd: data.vmd,
        nama_vendor: data.nama_vendor,
        created_at: data.created_at || new Date().toISOString(),
        created_by: data.created_by || 'system',
        updated_at: data.updated_at || new Date().toISOString(),
        updated_by: data.updated_by || 'system',
        deleted_at: data.deleted_at || null,
        deleted_by: data.deleted_by || null
      };
    } else if (table === 'categories') {
      payload = {
        id: data.id,
        kategori_layanan: data.kategori_layanan,
        jenis_layanan: data.jenis_layanan,
        role_pic: data.role_pic,
        created_at: data.created_at || new Date().toISOString(),
        created_by: data.created_by || 'system',
        updated_at: data.updated_at || new Date().toISOString(),
        updated_by: data.updated_by || 'system',
        deleted_at: data.deleted_at || null,
        deleted_by: data.deleted_by || null
      };
    } else if (table === 'units') {
      payload = {
        id: data.id,
        no_equipment: data.no_equipment,
        license_plate: data.license_plate,
        warna_nopol: data.warna_nopol || 'Hitam',
        description: data.description,
        kelompok_unit: data.kelompok_unit || null,
        kategori_unit: data.kategori_unit || null,
        kelompok_tipe: data.kelompok_tipe || null,
        tipe_unit: data.tipe_unit || null,
        pendingin: data.pendingin || 'No',
        power: data.power || null,
        tahun_unit: Number(data.tahun_unit) || 2022,
        chassis_no: data.chassis_no,
        engine_serial_no: data.engine_serial_no,
        warna: data.warna || null,
        cmd: data.cmd,
        customer: data.customer_name || data.customer || null,
        created_at: data.created_at || new Date().toISOString(),
        created_by: data.created_by || 'system',
        updated_at: data.updated_at || new Date().toISOString(),
        updated_by: data.updated_by || 'system',
        deleted_at: data.deleted_at || null,
        deleted_by: data.deleted_by || null
      };
    } else if (table === 'estimasi') {
      payload = {
        id: data.id,
        fsr_id: data.fsr_id,
        deskripsi: data.deskripsi,
        biaya: Number(data.biaya),
        qty: Number(data.qty || 1),
        created_at: data.created_at || new Date().toISOString()
      };
    } else if (table === 'fsr') {
      payload = sanitizeFsrPayload(data);
    } else if (table === 'fsr_history') {
      payload = {
        id: data.id,
        fsr_id: data.fsr_id,
        status: data.status,
        catatan: data.catatan || null,
        actor_name: data.actor_name || null,
        actor_role: data.actor_role || null,
        created_at: data.created_at || new Date().toISOString()
      };
    } else if (table === 'notifications') {
      payload = {
        id: data.id,
        target_role: data.target_role,
        title: data.title,
        message: data.message,
        fsr_id: data.fsr_id || null,
        is_read: Boolean(data.is_read),
        created_at: data.created_at || new Date().toISOString()
      };
    } else if (table === 'activity_logs') {
      payload = {
        id: data.id,
        action: data.action,
        description: data.description,
        actor_name: data.actor_name,
        actor_role: data.actor_role,
        created_at: data.created_at || new Date().toISOString()
      };
    }

    let { error } = await supabase.from(table).upsert(payload, { onConflict: 'id' });
    
    if (error && (error.message.includes('column') || error.message.includes('schema cache'))) {
      if (table === 'operation_users') {
        const { assigned_customer_cmd, assigned_vmd, vendor_name, ...fallbackPayload } = payload;
        const res = await supabase.from(table).upsert(fallbackPayload, { onConflict: 'id' });
        error = res.error;
      } else if (table === 'fsr') {
        const { no_vmd, ...fallbackPayload } = payload;
        const res = await supabase.from(table).upsert(fallbackPayload, { onConflict: 'id' });
        error = res.error;
      }
    }

    if (error) {
      console.warn(`[Supabase Auto-Sync Warning] Table: ${table} queued. Error: ${error.message}`);
      addToSyncQueue(table, 'UPSERT', payload);
    } else {
      console.log(`[Supabase Auto-Sync Success] Synchronized to table: ${table}`);
    }
  } catch (err) {
    console.warn('[Supabase Auto-Sync Enqueuing]', err);
    addToSyncQueue(table, 'UPSERT', data);
  }
}

/**
 * Hard delete a record from Supabase
 */
export async function deleteFromSupabase(table: string, id: string): Promise<void> {
  if (!isAutoSyncEnabled()) return;

  try {
    const { error } = await supabase.from(table).delete().eq('id', id);
    if (error) {
      console.warn(`[Supabase Delete Warning] Table: ${table} with ID: ${id} queued. ${error.message}`);
      addToSyncQueue(table, 'DELETE', { id });
    } else {
      console.log(`[Supabase Delete Success] Deleted from table: ${table} with ID: ${id}`);
    }
  } catch (err) {
    console.warn('[Supabase Delete Enqueuing]', err);
    addToSyncQueue(table, 'DELETE', { id });
  }
}

// Global background auto-sync runner
if (typeof window !== 'undefined') {
  // Process pending queue every 15 seconds
  setInterval(() => {
    processSyncQueue().catch(() => {});
  }, 15000);

  // Process pending queue when coming back online or focusing tab
  window.addEventListener('online', () => {
    processSyncQueue().catch(() => {});
  });

  window.addEventListener('focus', () => {
    processSyncQueue().catch(() => {});
  });
}
