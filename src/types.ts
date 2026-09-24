/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// User Roles
export type UserRole =
  | 'Super Admin'
  | 'Admin Customer'
  | 'Leader Customer'
  | 'SA'
  | 'SS'
  | 'VRO'
  | 'TS'
  | 'Vendor'
  | 'Leader Operation';

// FSR Categories & Services
export type ServiceCategory = 'Maintenance' | 'Body Repair' | 'Document';

export interface AuditFields {
  created_at: string;
  created_by: string; // User ID or Name
  updated_at: string;
  updated_by: string; // User ID or Name
  deleted_at?: string | null;
  deleted_by?: string | null;
}

// Master Data Interfaces
export interface Branch extends AuditFields {
  id: string; // UUID
  maint_plant: string;
  cabang: string;
}

export interface Customer extends AuditFields {
  id: string; // UUID
  cmd: string;
  nama_customer: string;
}

export interface Vendor extends AuditFields {
  id: string; // UUID
  vmd: string;
  nama_vendor: string;
}

export interface Unit extends AuditFields {
  id: string; // UUID
  no_equipment: string;
  license_plate: string;
  warna_nopol: string; // Hitam, Kuning, Merah, Putih
  description: string;
  kelompok_unit: string;
  kategori_unit: string;
  kelompok_tipe: string;
  tipe_unit: string;
  pendingin: string; // Yes / No
  power: string;
  tahun_unit: number;
  chassis_no: string;
  engine_serial_no: string;
  warna: string;
  cmd: string; // Relasi Customer CMD
  customer_name: string;
}

export interface Category extends AuditFields {
  id: string; // UUID
  kategori_layanan: ServiceCategory;
  jenis_layanan: string;
  role_pic: 'SA' | 'SS' | 'VRO';
}

export interface OperationRole extends AuditFields {
  id: string; // UUID
  role_operation: string; // SA, SS, VRO, TS, etc.
  keterangan: string;
}

export interface OperationUser extends AuditFields {
  id: string; // UUID
  nama: string;
  username: string;
  password?: string;
  role_operation: UserRole;
  cabang_handling: string; // Cabang Name
  assigned_customer_cmd?: string; // Assigned Customer CMD for Admin Customer / Leader Customer
  assigned_vmd?: string; // Assigned Vendor VMD code for Vendor role
  vendor_name?: string; // Assigned Vendor Name for Vendor role
  status: 'Active' | 'Inactive';
  permissions?: {
    allowedMenus: {
      dashboard: boolean;
      fsrMonitoring: boolean;
      masterData: boolean;
      activityLogs?: boolean;
    };
    allowedActions: {
      create: boolean;
      edit: boolean;
      delete: boolean;
      workflow: boolean;
    };
  };
}

// Master Status Types
export type FsrStatus =
  | 'Waiting Approval Leader Customer'
  | 'Approved Leader Customer'
  | 'Rejected'
  | 'Cancelled'
  | 'Waiting Vendor'
  | 'Waiting TS'
  | 'Waiting SPK'
  | 'Waiting Estimasi'
  | 'Waiting Approval Leader Operation'
  | 'Waiting Approval Customer'
  | 'Negotiation'
  | 'On Progress'
  | 'Finished';

// FSR Primary Document
export interface Fsr extends AuditFields {
  id: string; // UUID
  no_fsr: string; // Generated e.g., FSR/202607/0001
  tanggal_create: string;
  
  // Customer details
  nama_customer: string;
  nama_pic_customer: string;
  cabang: string;
  
  // Unit details
  no_polisi: string;
  type_kendaraan: string;
  no_rangka: string;
  km_pengajuan: number;
  
  // Service info
  kategori_layanan: ServiceCategory;
  jenis_layanan: string;
  keterangan: string;
  
  // Statuses & Workflow Logs
  status: FsrStatus;
  
  // Workflow step-by-step logs
  tanggal_cancel_leader_customer?: string | null;
  tanggal_approve_leader_customer?: string | null;
  nama_sa_ss_vro?: string | null;
  role_sa_ss_vro?: 'SA' | 'SS' | 'VRO' | null;
  tanggal_proses?: string | null;
  no_spk?: string | null;
  nama_ts?: string | null;
  nama_vendor?: string | null;
  no_vmd?: string | null;
  estimasi_biaya?: number | null;
  tanggal_masuk_bengkel?: string | null;
  catatan_mulai_pekerjaan?: string | null;
  tanggal_estimasi_approved_by_leader?: string | null;
  tanggal_estimasi_approved_by_customer?: string | null;
  tanggal_selesai_perbaikan?: string | null;
  catatan_selesai_pekerjaan?: string | null;
  
  // Attachment URLs (or base64 arrays in local testing)
  document_url?: string | null;
  document_name?: string | null;

  // Own Risk (OR) Estimation
  estimasi_or_url?: string | null;
  estimasi_or_name?: string | null;
  biaya_estimasi_or?: number | null;

  // Vendor Estimation File
  estimasi_vendor_url?: string | null;
  estimasi_vendor_name?: string | null;
}

// Sub-tables/Logs
export interface FsrHistory {
  id: string;
  fsr_id: string;
  status: FsrStatus;
  catatan: string;
  actor_name: string;
  actor_role: UserRole;
  created_at: string;
}

export interface ApprovalHistory {
  id: string;
  fsr_id: string;
  step_name: string;
  status: 'APPROVED' | 'REJECTED' | 'CANCELLED';
  actor_name: string;
  actor_role: UserRole;
  catatan: string;
  created_at: string;
}

export interface EstimasiItem {
  id: string;
  fsr_id: string;
  deskripsi: string;
  biaya: number;
  qty: number;
  total: number;
}

export interface Notification {
  id: string;
  user_role: UserRole;
  user_username?: string; // target user specifically if needed
  title: string;
  message: string;
  fsr_id?: string;
  is_read: boolean;
  created_at: string;
}

export interface ActivityLog {
  id: string;
  action: string;
  description: string;
  actor_name: string;
  actor_role: UserRole;
  created_at: string;
}
