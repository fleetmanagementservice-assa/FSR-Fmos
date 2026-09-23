/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Branch, Customer, Vendor, Unit, Category, OperationUser, Fsr } from '../types';

export const DEFAULT_BRANCHES: Branch[] = [
  {
    id: 'b1-uuid-branch-mdn',
    maint_plant: '1201',
    cabang: 'Medan',
    created_at: '2026-01-10T08:00:00Z',
    created_by: 'System Seed',
    updated_at: '2026-01-10T08:00:00Z',
    updated_by: 'System Seed'
  },
  {
    id: 'b2-uuid-branch-pkb',
    maint_plant: '1221',
    cabang: 'Pekanbaru',
    created_at: '2026-01-10T08:00:00Z',
    created_by: 'System Seed',
    updated_at: '2026-01-10T08:00:00Z',
    updated_by: 'System Seed'
  },
  {
    id: 'b3-uuid-branch-pdg',
    maint_plant: '1222',
    cabang: 'Padang',
    created_at: '2026-01-10T08:00:00Z',
    created_by: 'System Seed',
    updated_at: '2026-01-10T08:00:00Z',
    updated_by: 'System Seed'
  },
  {
    id: 'b4-uuid-branch-plb',
    maint_plant: '1211',
    cabang: 'Palembang',
    created_at: '2026-01-10T08:00:00Z',
    created_by: 'System Seed',
    updated_at: '2026-01-10T08:00:00Z',
    updated_by: 'System Seed'
  },
  {
    id: 'b5-uuid-branch-lpg',
    maint_plant: '1212',
    cabang: 'Lampung',
    created_at: '2026-01-10T08:00:00Z',
    created_by: 'System Seed',
    updated_at: '2026-01-10T08:00:00Z',
    updated_by: 'System Seed'
  },
  {
    id: 'b6-uuid-branch-jkt',
    maint_plant: '1101',
    cabang: 'Jakarta',
    created_at: '2026-01-10T08:00:00Z',
    created_by: 'System Seed',
    updated_at: '2026-01-10T08:00:00Z',
    updated_by: 'System Seed'
  },
  {
    id: 'b7-uuid-branch-bdg',
    maint_plant: '1131',
    cabang: 'Bandung',
    created_at: '2026-01-10T08:00:00Z',
    created_by: 'System Seed',
    updated_at: '2026-01-10T08:00:00Z',
    updated_by: 'System Seed'
  },
  {
    id: 'b8-uuid-branch-slo',
    maint_plant: '1122',
    cabang: 'Solo',
    created_at: '2026-01-10T08:00:00Z',
    created_by: 'System Seed',
    updated_at: '2026-01-10T08:00:00Z',
    updated_by: 'System Seed'
  },
  {
    id: 'b9-uuid-branch-smg',
    maint_plant: '1121',
    cabang: 'Semarang',
    created_at: '2026-01-10T08:00:00Z',
    created_by: 'System Seed',
    updated_at: '2026-01-10T08:00:00Z',
    updated_by: 'System Seed'
  },
  {
    id: 'b10-uuid-branch-mlg',
    maint_plant: '1142',
    cabang: 'Malang',
    created_at: '2026-01-10T08:00:00Z',
    created_by: 'System Seed',
    updated_at: '2026-01-10T08:00:00Z',
    updated_by: 'System Seed'
  },
  {
    id: 'b11-uuid-branch-sby',
    maint_plant: '1141',
    cabang: 'Surabaya',
    created_at: '2026-01-10T08:00:00Z',
    created_by: 'System Seed',
    updated_at: '2026-01-10T08:00:00Z',
    updated_by: 'System Seed'
  },
  {
    id: 'b12-uuid-branch-bli',
    maint_plant: '1151',
    cabang: 'Bali',
    created_at: '2026-01-10T08:00:00Z',
    created_by: 'System Seed',
    updated_at: '2026-01-10T08:00:00Z',
    updated_by: 'System Seed'
  },
  {
    id: 'b13-uuid-branch-bpp',
    maint_plant: '1341',
    cabang: 'Balikpapan',
    created_at: '2026-01-10T08:00:00Z',
    created_by: 'System Seed',
    updated_at: '2026-01-10T08:00:00Z',
    updated_by: 'System Seed'
  },
  {
    id: 'b14-uuid-branch-bjm',
    maint_plant: '1321',
    cabang: 'Banjarmasin',
    created_at: '2026-01-10T08:00:00Z',
    created_by: 'System Seed',
    updated_at: '2026-01-10T08:00:00Z',
    updated_by: 'System Seed'
  },
  {
    id: 'b15-uuid-branch-mks',
    maint_plant: '1401',
    cabang: 'Makassar',
    created_at: '2026-01-10T08:00:00Z',
    created_by: 'System Seed',
    updated_at: '2026-01-10T08:00:00Z',
    updated_by: 'System Seed'
  }
];

export const DEFAULT_CUSTOMERS: Customer[] = [
  {
    id: 'c1-uuid-cust-ast',
    cmd: '3000170',
    nama_customer: 'PT ADI SARANA TRANSPORTASI',
    created_at: '2026-01-10T08:00:00Z',
    created_by: 'System Seed',
    updated_at: '2026-01-10T08:00:00Z',
    updated_by: 'System Seed'
  },
  {
    id: 'c2-uuid-cust-rdi',
    cmd: '3000185',
    nama_customer: 'PT RANTAI DINGIN INDONESIA',
    created_at: '2026-01-10T08:00:00Z',
    created_by: 'System Seed',
    updated_at: '2026-01-10T08:00:00Z',
    updated_by: 'System Seed'
  }
];

export const DEFAULT_VENDORS: Vendor[] = [
  {
    id: 'v1-uuid-vendor-agung',
    vmd: 'VMD001',
    nama_vendor: 'Bengkel Agung Mandiri',
    created_at: '2026-01-10T08:00:00Z',
    created_by: 'System Seed',
    updated_at: '2026-01-10T08:00:00Z',
    updated_by: 'System Seed'
  },
  {
    id: 'v2-uuid-vendor-lestari',
    vmd: 'VMD002',
    nama_vendor: 'CV Body Repair Lestari',
    created_at: '2026-01-10T08:00:00Z',
    created_by: 'System Seed',
    updated_at: '2026-01-10T08:00:00Z',
    updated_by: 'System Seed'
  },
  {
    id: 'v3-uuid-vendor-sinar',
    vmd: 'VMD003',
    nama_vendor: 'PT Biro Jasa Sinar Utama',
    created_at: '2026-01-10T08:00:00Z',
    created_by: 'System Seed',
    updated_at: '2026-01-10T08:00:00Z',
    updated_by: 'System Seed'
  },
  {
    id: 'v4-uuid-vendor-isuzu',
    vmd: 'VMD004',
    nama_vendor: 'Bengkel Resmi Isuzu Astra',
    created_at: '2026-01-10T08:00:00Z',
    created_by: 'System Seed',
    updated_at: '2026-01-10T08:00:00Z',
    updated_by: 'System Seed'
  }
];

export const DEFAULT_CATEGORIES: Category[] = [
  {
    id: 'cat1-uuid',
    kategori_layanan: 'Maintenance',
    jenis_layanan: 'Berkala',
    role_pic: 'SA',
    created_at: '2026-01-10T08:00:00Z',
    created_by: 'System Seed',
    updated_at: '2026-01-10T08:00:00Z',
    updated_by: 'System Seed'
  },
  {
    id: 'cat2-uuid',
    kategori_layanan: 'Maintenance',
    jenis_layanan: 'Berkala',
    role_pic: 'SS',
    created_at: '2026-01-10T08:00:00Z',
    created_by: 'System Seed',
    updated_at: '2026-01-10T08:00:00Z',
    updated_by: 'System Seed'
  },
  {
    id: 'cat3-uuid',
    kategori_layanan: 'Maintenance',
    jenis_layanan: 'Emergency',
    role_pic: 'SA',
    created_at: '2026-01-10T08:00:00Z',
    created_by: 'System Seed',
    updated_at: '2026-01-10T08:00:00Z',
    updated_by: 'System Seed'
  },
  {
    id: 'cat4-uuid',
    kategori_layanan: 'Maintenance',
    jenis_layanan: 'Emergency',
    role_pic: 'SS',
    created_at: '2026-01-10T08:00:00Z',
    created_by: 'System Seed',
    updated_at: '2026-01-10T08:00:00Z',
    updated_by: 'System Seed'
  },
  {
    id: 'cat5-uuid',
    kategori_layanan: 'Maintenance',
    jenis_layanan: 'Non Berkala',
    role_pic: 'SA',
    created_at: '2026-01-10T08:00:00Z',
    created_by: 'System Seed',
    updated_at: '2026-01-10T08:00:00Z',
    updated_by: 'System Seed'
  },
  {
    id: 'cat6-uuid',
    kategori_layanan: 'Maintenance',
    jenis_layanan: 'Non Berkala',
    role_pic: 'SS',
    created_at: '2026-01-10T08:00:00Z',
    created_by: 'System Seed',
    updated_at: '2026-01-10T08:00:00Z',
    updated_by: 'System Seed'
  },
  {
    id: 'cat7-uuid',
    kategori_layanan: 'Body Repair',
    jenis_layanan: 'Body Repair',
    role_pic: 'SA',
    created_at: '2026-01-10T08:00:00Z',
    created_by: 'System Seed',
    updated_at: '2026-01-10T08:00:00Z',
    updated_by: 'System Seed'
  },
  {
    id: 'cat8-uuid',
    kategori_layanan: 'Body Repair',
    jenis_layanan: 'Body Repair',
    role_pic: 'SS',
    created_at: '2026-01-10T08:00:00Z',
    created_by: 'System Seed',
    updated_at: '2026-01-10T08:00:00Z',
    updated_by: 'System Seed'
  },
  {
    id: 'cat9-uuid',
    kategori_layanan: 'Document',
    jenis_layanan: 'STNK 1 Tahun',
    role_pic: 'VRO',
    created_at: '2026-01-10T08:00:00Z',
    created_by: 'System Seed',
    updated_at: '2026-01-10T08:00:00Z',
    updated_by: 'System Seed'
  },
  {
    id: 'cat10-uuid',
    kategori_layanan: 'Document',
    jenis_layanan: 'STNK 5 Tahun',
    role_pic: 'VRO',
    created_at: '2026-01-10T08:00:00Z',
    created_by: 'System Seed',
    updated_at: '2026-01-10T08:00:00Z',
    updated_by: 'System Seed'
  },
  {
    id: 'cat11-uuid',
    kategori_layanan: 'Document',
    jenis_layanan: 'KIR',
    role_pic: 'VRO',
    created_at: '2026-01-10T08:00:00Z',
    created_by: 'System Seed',
    updated_at: '2026-01-10T08:00:00Z',
    updated_by: 'System Seed'
  },
  {
    id: 'cat12-uuid',
    kategori_layanan: 'Document',
    jenis_layanan: 'ETLE',
    role_pic: 'VRO',
    created_at: '2026-01-10T08:00:00Z',
    created_by: 'System Seed',
    updated_at: '2026-01-10T08:00:00Z',
    updated_by: 'System Seed'
  },
  {
    id: 'cat13-uuid',
    kategori_layanan: 'Document',
    jenis_layanan: 'Non ETLE',
    role_pic: 'VRO',
    created_at: '2026-01-10T08:00:00Z',
    created_by: 'System Seed',
    updated_at: '2026-01-10T08:00:00Z',
    updated_by: 'System Seed'
  },
  {
    id: 'cat14-uuid',
    kategori_layanan: 'Document',
    jenis_layanan: 'Dok lain',
    role_pic: 'VRO',
    created_at: '2026-01-10T08:00:00Z',
    created_by: 'System Seed',
    updated_at: '2026-01-10T08:00:00Z',
    updated_by: 'System Seed'
  }
];

export const DEFAULT_UNITS: Unit[] = [
  {
    id: 'u1-uuid',
    no_equipment: '17000000',
    license_plate: 'B-9368-URO',
    warna_nopol: 'Hitam',
    description: 'DAIHATSU GRAN MAX BLIND VAN AC 1.3 M/T',
    kelompok_unit: 'Commercial Car',
    kategori_unit: 'Blind Van',
    kelompok_tipe: 'Gran Max',
    tipe_unit: 'Gran Max',
    pendingin: 'Dry',
    power: 'Fuel',
    tahun_unit: 2022,
    chassis_no: 'MHKB3BA1JNK081395',
    engine_serial_no: 'K3MJ11440',
    warna: 'PUTIH',
    cmd: '3000170',
    customer_name: 'PT ADI SARANA TRANSPORTASI',
    created_at: '2026-01-10T08:00:00Z',
    created_by: 'System Seed',
    updated_at: '2026-01-10T08:00:00Z',
    updated_by: 'System Seed'
  },
  {
    id: 'u2-uuid',
    no_equipment: '17000001',
    license_plate: 'B-9364-SYQ',
    warna_nopol: 'Kuning',
    description: 'DAIHATSU GRAN MAX BLIND VAN AC 1.3 M/T',
    kelompok_unit: 'Commercial Car',
    kategori_unit: 'Blind Van',
    kelompok_tipe: 'Gran Max',
    tipe_unit: 'Gran Max',
    pendingin: 'Dry',
    power: 'Fuel',
    tahun_unit: 2022,
    chassis_no: 'MHKB3BA1JNK082218',
    engine_serial_no: 'K3MJ13009',
    warna: 'PUTIH',
    cmd: '3000170',
    customer_name: 'PT ADI SARANA TRANSPORTASI',
    created_at: '2026-01-10T08:00:00Z',
    created_by: 'System Seed',
    updated_at: '2026-01-10T08:00:00Z',
    updated_by: 'System Seed'
  }
];

export const DEFAULT_USERS: OperationUser[] = [
  {
    id: 'user-superadmin',
    nama: 'Administrator Utama',
    username: 'superadmin',
    role_operation: 'Super Admin',
    cabang_handling: 'All Branches',
    status: 'Active',
    created_at: '2026-01-10T08:00:00Z',
    created_by: 'System Seed',
    updated_at: '2026-01-10T08:00:00Z',
    updated_by: 'System Seed'
  },
  {
    id: 'user-admin-cust',
    nama: 'Rini (Admin AST)',
    username: 'admin_astra',
    role_operation: 'Admin Customer',
    cabang_handling: 'Jakarta',
    assigned_customer_cmd: '3000170',
    status: 'Active',
    created_at: '2026-01-10T08:00:00Z',
    created_by: 'System Seed',
    updated_at: '2026-01-10T08:00:00Z',
    updated_by: 'System Seed'
  },
  {
    id: 'user-leader-cust',
    nama: 'Bambang (Leader AST)',
    username: 'leader_astra',
    role_operation: 'Leader Customer',
    cabang_handling: 'Jakarta',
    assigned_customer_cmd: '3000170',
    status: 'Active',
    created_at: '2026-01-10T08:00:00Z',
    created_by: 'System Seed',
    updated_at: '2026-01-10T08:00:00Z',
    updated_by: 'System Seed'
  },
  {
    id: 'user-sa',
    nama: 'Andi Service Advisor',
    username: 'sa_dki',
    role_operation: 'SA',
    cabang_handling: 'Jakarta',
    status: 'Active',
    created_at: '2026-01-10T08:00:00Z',
    created_by: 'System Seed',
    updated_at: '2026-01-10T08:00:00Z',
    updated_by: 'System Seed'
  },
  {
    id: 'user-ss',
    nama: 'Slamet Service Support',
    username: 'ss_dki',
    role_operation: 'SS',
    cabang_handling: 'Jakarta',
    status: 'Active',
    created_at: '2026-01-10T08:00:00Z',
    created_by: 'System Seed',
    updated_at: '2026-01-10T08:00:00Z',
    updated_by: 'System Seed'
  },
  {
    id: 'user-vro',
    nama: 'Viktor VRO',
    username: 'vro_dki',
    role_operation: 'VRO',
    cabang_handling: 'Jakarta',
    status: 'Active',
    created_at: '2026-01-10T08:00:00Z',
    created_by: 'System Seed',
    updated_at: '2026-01-10T08:00:00Z',
    updated_by: 'System Seed'
  },
  {
    id: 'user-ts',
    nama: 'Tono Tech Service',
    username: 'ts_dki',
    role_operation: 'TS',
    cabang_handling: 'Jakarta',
    status: 'Active',
    created_at: '2026-01-10T08:00:00Z',
    created_by: 'System Seed',
    updated_at: '2026-01-10T08:00:00Z',
    updated_by: 'System Seed'
  },
  {
    id: 'user-ts-sby',
    nama: 'Budi Tech Service (SBY)',
    username: 'ts_sby',
    role_operation: 'TS',
    cabang_handling: 'Surabaya',
    status: 'Active',
    created_at: '2026-01-10T08:00:00Z',
    created_by: 'System Seed',
    updated_at: '2026-01-10T08:00:00Z',
    updated_by: 'System Seed'
  },
  {
    id: 'user-ts-bdg',
    nama: 'Asep Tech Service (BDG)',
    username: 'ts_bdg',
    role_operation: 'TS',
    cabang_handling: 'Bandung',
    status: 'Active',
    created_at: '2026-01-10T08:00:00Z',
    created_by: 'System Seed',
    updated_at: '2026-01-10T08:00:00Z',
    updated_by: 'System Seed'
  },
  {
    id: 'user-vendor-agung',
    nama: 'Budi (Vendor Agung)',
    username: 'vendor_agung',
    password: 'password123',
    role_operation: 'Vendor',
    cabang_handling: 'Jakarta',
    assigned_vmd: 'VMD001',
    vendor_name: 'Bengkel Agung Mandiri',
    status: 'Active',
    created_at: '2026-01-10T08:00:00Z',
    created_by: 'System Seed',
    updated_at: '2026-01-10T08:00:00Z',
    updated_by: 'System Seed'
  },
  {
    id: 'user-vendor-lestari',
    nama: 'Lestari (CV Body Repair)',
    username: 'vendor_lestari',
    password: 'password123',
    role_operation: 'Vendor',
    cabang_handling: 'Jakarta',
    assigned_vmd: 'VMD002',
    vendor_name: 'CV Body Repair Lestari',
    status: 'Active',
    created_at: '2026-01-10T08:00:00Z',
    created_by: 'System Seed',
    updated_at: '2026-01-10T08:00:00Z',
    updated_by: 'System Seed'
  },
  {
    id: 'user-vendor-sinar',
    nama: 'Sinar (Biro Jasa Sinar Utama)',
    username: 'vendor_sinar',
    password: 'password123',
    role_operation: 'Vendor',
    cabang_handling: 'Jakarta',
    assigned_vmd: 'VMD003',
    vendor_name: 'PT Biro Jasa Sinar Utama',
    status: 'Active',
    created_at: '2026-01-10T08:00:00Z',
    created_by: 'System Seed',
    updated_at: '2026-01-10T08:00:00Z',
    updated_by: 'System Seed'
  },
  {
    id: 'user-vendor-isuzu',
    nama: 'Astra Isuzu (Bengkel Resmi Isuzu)',
    username: 'vendor_isuzu',
    password: 'password123',
    role_operation: 'Vendor',
    cabang_handling: 'Surabaya',
    assigned_vmd: 'VMD004',
    vendor_name: 'Bengkel Resmi Isuzu Astra',
    status: 'Active',
    created_at: '2026-01-10T08:00:00Z',
    created_by: 'System Seed',
    updated_at: '2026-01-10T08:00:00Z',
    updated_by: 'System Seed'
  },
  {
    id: 'user-leader-ops',
    nama: 'Haryanto (Leader Ops)',
    username: 'leader_ops',
    role_operation: 'Leader Operation',
    cabang_handling: 'All Branches',
    status: 'Active',
    created_at: '2026-01-10T08:00:00Z',
    created_by: 'System Seed',
    updated_at: '2026-01-10T08:00:00Z',
    updated_by: 'System Seed'
  }
];

export const INITIAL_FSRS: Fsr[] = [];
