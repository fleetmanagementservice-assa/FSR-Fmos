/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export const SUPABASE_MIGRATION_SQL = `-- Fleet Service Request (FSR) Management System - Complete Supabase PostgreSQL Schema
-- Targets: Supabase DB, PostgreSQL 15+, Row Level Security (RLS)

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ==========================================
-- 1. DROP EXISTING TABLES (IF RE-RUNNING)
-- ==========================================
DROP TABLE IF EXISTS attachments CASCADE;
DROP TABLE IF EXISTS documents CASCADE;
DROP TABLE IF EXISTS estimasi CASCADE;
DROP TABLE IF EXISTS approval_history CASCADE;
DROP TABLE IF EXISTS fsr_history CASCADE;
DROP TABLE IF EXISTS fsr CASCADE;
DROP TABLE IF EXISTS units CASCADE;
DROP TABLE IF EXISTS categories CASCADE;
DROP TABLE IF EXISTS operation_users CASCADE;
DROP TABLE IF EXISTS branches CASCADE;
DROP TABLE IF EXISTS vendors CASCADE;
DROP TABLE IF EXISTS customers CASCADE;
DROP TABLE IF EXISTS notifications CASCADE;
DROP TABLE IF EXISTS activity_logs CASCADE;

-- ==========================================
-- 2. CREATE MASTER TABLES
-- ==========================================

-- Master Cabang
CREATE TABLE branches (
    id VARCHAR(100) PRIMARY KEY DEFAULT uuid_generate_v4()::text,
    maint_plant VARCHAR(50) NOT NULL UNIQUE,
    cabang VARCHAR(150) NOT NULL,
    
    -- Audit Trail Columns
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(100) DEFAULT 'system',
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_by VARCHAR(100) DEFAULT 'system',
    deleted_at TIMESTAMPTZ,
    deleted_by VARCHAR(100)
);

-- Master Customer
CREATE TABLE customers (
    id VARCHAR(100) PRIMARY KEY DEFAULT uuid_generate_v4()::text,
    cmd VARCHAR(50) NOT NULL UNIQUE,
    nama_customer VARCHAR(200) NOT NULL,
    
    -- Audit Trail Columns
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(100) DEFAULT 'system',
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_by VARCHAR(100) DEFAULT 'system',
    deleted_at TIMESTAMPTZ,
    deleted_by VARCHAR(100)
);

-- Master Vendor
CREATE TABLE vendors (
    id VARCHAR(100) PRIMARY KEY DEFAULT uuid_generate_v4()::text,
    vmd VARCHAR(50) NOT NULL UNIQUE,
    nama_vendor VARCHAR(200) NOT NULL,
    
    -- Audit Trail Columns
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(100) DEFAULT 'system',
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_by VARCHAR(100) DEFAULT 'system',
    deleted_at TIMESTAMPTZ,
    deleted_by VARCHAR(100)
);

-- Master Kategori Layanan
CREATE TABLE categories (
    id VARCHAR(100) PRIMARY KEY DEFAULT uuid_generate_v4()::text,
    kategori_layanan VARCHAR(100) NOT NULL, -- Maintenance, Body Repair, Document
    jenis_layanan VARCHAR(150) NOT NULL,     -- Berkala, Non Berkala, STNK 1 Tahun, KIR, etc.
    role_pic VARCHAR(50) NOT NULL,          -- SA, SS, VRO
    
    -- Audit Trail Columns
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(100) DEFAULT 'system',
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_by VARCHAR(100) DEFAULT 'system',
    deleted_at TIMESTAMPTZ,
    deleted_by VARCHAR(100),
    
    CONSTRAINT unique_kategori_jenis UNIQUE(kategori_layanan, jenis_layanan, role_pic)
);

-- Master User Operation (Custom User Table for Application Roles)
CREATE TABLE operation_users (
    id VARCHAR(100) PRIMARY KEY DEFAULT uuid_generate_v4()::text,
    nama VARCHAR(200) NOT NULL,
    username VARCHAR(100) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL, -- encrypted or hash
    role_operation VARCHAR(50) NOT NULL, -- Admin Customer, Leader Customer, SA, SS, VRO, TS, Vendor, Leader Operation, Super Admin
    cabang_handling VARCHAR(150) NOT NULL,
    assigned_customer_cmd VARCHAR(50), -- Assigned Customer CMD
    assigned_vmd VARCHAR(50), -- Assigned Vendor VMD
    vendor_name VARCHAR(200), -- Assigned Vendor Name
    status VARCHAR(50) DEFAULT 'Active', -- Active, Inactive
    
    -- Audit Trail Columns
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(100) DEFAULT 'system',
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_by VARCHAR(100) DEFAULT 'system',
    deleted_at TIMESTAMPTZ,
    deleted_by VARCHAR(100)
);

-- Master Unit Kendaraan (Relasi ke Customer)
CREATE TABLE units (
    id VARCHAR(100) PRIMARY KEY DEFAULT uuid_generate_v4()::text,
    no_equipment VARCHAR(100) NOT NULL UNIQUE,
    license_plate VARCHAR(50) NOT NULL UNIQUE,
    warna_nopol VARCHAR(50) DEFAULT 'Hitam', -- Hitam, Kuning, Merah, Putih
    description VARCHAR(255) NOT NULL,
    kelompok_unit VARCHAR(100),
    kategori_unit VARCHAR(100),
    kelompok_tipe VARCHAR(100),
    tipe_unit VARCHAR(100),
    pendingin VARCHAR(10) DEFAULT 'No', -- Yes, No
    power VARCHAR(50),
    tahun_unit INT NOT NULL,
    chassis_no VARCHAR(100) NOT NULL,
    engine_serial_no VARCHAR(100) NOT NULL,
    warna VARCHAR(100),
    cmd VARCHAR(50) NOT NULL REFERENCES customers(cmd) ON UPDATE CASCADE,
    customer VARCHAR(200),
    
    -- Audit Trail Columns
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(100) DEFAULT 'system',
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_by VARCHAR(100) DEFAULT 'system',
    deleted_at TIMESTAMPTZ,
    deleted_by VARCHAR(100)
);

-- ==========================================
-- 3. FLEET SERVICE REQUEST (FSR) CORE TABLES
-- ==========================================

CREATE TABLE fsr (
    id VARCHAR(100) PRIMARY KEY DEFAULT uuid_generate_v4()::text,
    no_fsr VARCHAR(100) NOT NULL, -- Auto generated (Duplicates allowed for document multi-nopol requests)
    tanggal_create TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    
    -- Customer & PIC
    nama_customer VARCHAR(200) NOT NULL,
    nama_pic_customer VARCHAR(200) NOT NULL,
    cabang VARCHAR(150) NOT NULL,
    
    -- Kendaraan (Unit Details)
    no_polisi TEXT NOT NULL,
    type_kendaraan TEXT NOT NULL,
    no_rangka TEXT NOT NULL,
    km_pengajuan INT NOT NULL,
    
    -- Detail Pengajuan
    kategori_layanan VARCHAR(100) NOT NULL, -- Maintenance, Body Repair, Document
    jenis_layanan VARCHAR(150) NOT NULL,
    keterangan TEXT,
    
    -- Status Utama
    status VARCHAR(100) DEFAULT 'Waiting Approval Leader Customer',
    
    -- Workflow Process Timestamps & Parameters
    tanggal_cancel_leader_customer TIMESTAMPTZ,
    tanggal_approve_leader_customer TIMESTAMPTZ,
    nama_sa_ss_vro VARCHAR(200),
    role_sa_ss_vro VARCHAR(50),
    tanggal_proses TIMESTAMPTZ,
    no_spk VARCHAR(100),
    no_vmd VARCHAR(50),
    nama_ts VARCHAR(200),
    nama_vendor VARCHAR(200),
    estimasi_biaya NUMERIC(15,2),
    tanggal_masuk_bengkel TIMESTAMPTZ,
    tanggal_estimasi_approved_by_leader TIMESTAMPTZ,
    tanggal_estimasi_approved_by_customer TIMESTAMPTZ,
    tanggal_selesai_perbaikan TIMESTAMPTZ,
    
    -- File Attachment
    document_url TEXT,
    document_name VARCHAR(255),

    -- Own Risk (OR) Estimation
    estimasi_or_url TEXT,
    estimasi_or_name VARCHAR(255),
    biaya_estimasi_or NUMERIC(15,2),

    -- Vendor Estimation File
    estimasi_vendor_url TEXT,
    estimasi_vendor_name VARCHAR(255),
    
    -- Audit Trail Columns
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(100) DEFAULT 'system',
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_by VARCHAR(100) DEFAULT 'system',
    deleted_at TIMESTAMPTZ,
    deleted_by VARCHAR(100)
);

-- History Status & Log Perjalanan FSR (Untuk Timeline)
CREATE TABLE fsr_history (
    id VARCHAR(100) PRIMARY KEY DEFAULT uuid_generate_v4()::text,
    fsr_id VARCHAR(100) NOT NULL REFERENCES fsr(id) ON DELETE CASCADE,
    status VARCHAR(100) NOT NULL,
    catatan TEXT,
    actor_name VARCHAR(200) NOT NULL,
    actor_role VARCHAR(100) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Detail Item Estimasi Biaya
CREATE TABLE estimasi (
    id VARCHAR(100) PRIMARY KEY DEFAULT uuid_generate_v4()::text,
    fsr_id VARCHAR(100) NOT NULL REFERENCES fsr(id) ON DELETE CASCADE,
    deskripsi VARCHAR(255) NOT NULL,
    biaya NUMERIC(15,2) NOT NULL,
    qty INT DEFAULT 1,
    total NUMERIC(15,2) GENERATED ALWAYS AS (biaya * qty) STORED,
    
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Notifikasi Pengguna
CREATE TABLE notifications (
    id VARCHAR(100) PRIMARY KEY DEFAULT uuid_generate_v4()::text,
    user_role VARCHAR(100) NOT NULL, -- Admin Customer, Leader Customer, SA, SS, etc.
    title VARCHAR(200) NOT NULL,
    message TEXT NOT NULL,
    fsr_id VARCHAR(100),
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Audit Trail System Log
CREATE TABLE activity_logs (
    id VARCHAR(100) PRIMARY KEY DEFAULT uuid_generate_v4()::text,
    action VARCHAR(100) NOT NULL,
    description TEXT NOT NULL,
    actor_name VARCHAR(200) NOT NULL,
    actor_role VARCHAR(100) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- ==========================================
-- 4. DATABASE INDEXES FOR PERFORMANCE & COST EFFICIENCY
-- ==========================================

-- FSR Table Optimization (High Volume Queries & Filters)
CREATE INDEX idx_fsr_status_created_at ON fsr(status, created_at DESC); -- Fast status filtering & ordering
CREATE INDEX idx_fsr_cabang_status ON fsr(cabang, status);             -- High efficiency for branch-handling restricted roles
CREATE INDEX idx_fsr_no_fsr ON fsr(no_fsr);                             -- Index for search and lookup of FSR codes
CREATE INDEX idx_fsr_no_polisi ON fsr(no_polisi);                       -- Index for search by plate numbers
CREATE INDEX idx_fsr_active_only ON fsr(id) WHERE deleted_at IS NULL;   -- Partial index filtering active (not soft-deleted) FSRs

-- Master Units Table Optimization
CREATE INDEX idx_units_cmd_plate ON units(cmd, license_plate);          -- Composite index for fast plate query filtered by Customer CMD
CREATE INDEX idx_units_license_plate ON units(license_plate);           -- Standalone index for license plate search

-- User Authentication & Role Mapping
CREATE UNIQUE INDEX IF NOT EXISTS idx_operation_users_username ON operation_users(username); -- Instant login check

-- Foreign Key Constraints & History Tables
CREATE INDEX idx_history_fsr ON fsr_history(fsr_id);
CREATE INDEX idx_estimasi_fsr ON estimasi(fsr_id);

-- Unread Notifications Optimization (Saves memory and space via Partial Index)
CREATE INDEX idx_notifications_unread_by_role ON notifications(user_role) WHERE is_read = FALSE;

-- ==========================================
-- 5. AUTOMATIC UPDATE TIMESTAMPS TRIGGER
-- ==========================================
CREATE OR REPLACE FUNCTION update_modified_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply triggers to all master tables
CREATE TRIGGER update_branches_modtime BEFORE UPDATE ON branches FOR EACH ROW EXECUTE FUNCTION update_modified_column();
CREATE TRIGGER update_customers_modtime BEFORE UPDATE ON customers FOR EACH ROW EXECUTE FUNCTION update_modified_column();
CREATE TRIGGER update_vendors_modtime BEFORE UPDATE ON vendors FOR EACH ROW EXECUTE FUNCTION update_modified_column();
CREATE TRIGGER update_categories_modtime BEFORE UPDATE ON categories FOR EACH ROW EXECUTE FUNCTION update_modified_column();
CREATE TRIGGER update_operation_users_modtime BEFORE UPDATE ON operation_users FOR EACH ROW EXECUTE FUNCTION update_modified_column();
CREATE TRIGGER update_units_modtime BEFORE UPDATE ON units FOR EACH ROW EXECUTE FUNCTION update_modified_column();
CREATE TRIGGER update_fsr_modtime BEFORE UPDATE ON fsr FOR EACH ROW EXECUTE FUNCTION update_modified_column();

-- ==========================================
-- 6. ROW LEVEL SECURITY (RLS) POLICIES (ENABLED)
-- ==========================================
-- Enable RLS on all tables
ALTER TABLE branches ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE vendors ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE operation_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE units ENABLE ROW LEVEL SECURITY;
ALTER TABLE fsr ENABLE ROW LEVEL SECURITY;
ALTER TABLE fsr_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE estimasi ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;

-- ----------------------------------------------------
-- RLS POLICIES FOR MASTER & OPERATIONAL DATA ACCESS
-- (Allowing SELECT, INSERT, UPDATE, DELETE for anon & authenticated)
-- ----------------------------------------------------

-- 1. Branches Policies
CREATE POLICY "Allow all operations on branches" ON branches FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

-- 2. Customers Policies
CREATE POLICY "Allow all operations on customers" ON customers FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

-- 3. Vendors Policies
CREATE POLICY "Allow all operations on vendors" ON vendors FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

-- 4. Categories Policies
CREATE POLICY "Allow all operations on categories" ON categories FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

-- 5. Operation Users Policies
CREATE POLICY "Allow all operations on operation_users" ON operation_users FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

-- 6. Units Policies
CREATE POLICY "Allow all operations on units" ON units FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

-- 7. FSR Core Policies
CREATE POLICY "Allow all operations on fsr" ON fsr FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

-- 8. FSR History Policies
CREATE POLICY "Allow all operations on fsr_history" ON fsr_history FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

-- 9. Estimasi Policies
CREATE POLICY "Allow all operations on estimasi" ON estimasi FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

-- 10. Notifications Policies
CREATE POLICY "Allow all operations on notifications" ON notifications FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

-- 11. Activity Logs Policies
CREATE POLICY "Allow all operations on activity_logs" ON activity_logs FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

-- ==========================================
-- 7. INITIAL MASTER SEED DATA (DML)
-- ==========================================
INSERT INTO branches (id, maint_plant, cabang) VALUES
('b1-uuid-branch-mdn', '1201', 'Medan'),
('b2-uuid-branch-pkb', '1221', 'Pekanbaru'),
('b3-uuid-branch-pdg', '1222', 'Padang'),
('b4-uuid-branch-plb', '1211', 'Palembang'),
('b5-uuid-branch-lpg', '1212', 'Lampung'),
('b6-uuid-branch-jkt', '1101', 'Jakarta'),
('b7-uuid-branch-bdg', '1131', 'Bandung'),
('b8-uuid-branch-slo', '1122', 'Solo'),
('b9-uuid-branch-smg', '1121', 'Semarang'),
('b10-uuid-branch-mlg', '1142', 'Malang'),
('b11-uuid-branch-sby', '1141', 'Surabaya'),
('b12-uuid-branch-bli', '1151', 'Bali'),
('b13-uuid-branch-bpp', '1341', 'Balikpapan'),
('b14-uuid-branch-bjm', '1321', 'Banjarmasin'),
('b15-uuid-branch-mks', '1401', 'Makassar');

INSERT INTO customers (id, cmd, nama_customer) VALUES
('c1-uuid-cust-ast', '3000170', 'PT ADI SARANA TRANSPORTASI'),
('c2-uuid-cust-rdi', '3000185', 'PT RANTAI DINGIN INDONESIA');

INSERT INTO vendors (id, vmd, nama_vendor) VALUES
('v1-uuid-vendor-agung', 'VMD001', 'Bengkel Agung Mandiri'),
('v2-uuid-vendor-lestari', 'VMD002', 'CV Body Repair Lestari'),
('v3-uuid-vendor-sinar', 'VMD003', 'PT Biro Jasa Sinar Utama'),
('v4-uuid-vendor-isuzu', 'VMD004', 'Bengkel Resmi Isuzu Astra');

INSERT INTO categories (id, kategori_layanan, jenis_layanan, role_pic) VALUES
('cat1-uuid', 'Maintenance', 'Berkala', 'SA'),
('cat2-uuid', 'Maintenance', 'Berkala', 'SS'),
('cat3-uuid', 'Maintenance', 'Emergency', 'SA'),
('cat4-uuid', 'Maintenance', 'Emergency', 'SS'),
('cat5-uuid', 'Maintenance', 'Non Berkala', 'SA'),
('cat6-uuid', 'Maintenance', 'Non Berkala', 'SS'),
('cat7-uuid', 'Body Repair', 'Body Repair', 'SA'),
('cat8-uuid', 'Body Repair', 'Body Repair', 'SS'),
('cat9-uuid', 'Document', 'STNK 1 Tahun', 'VRO'),
('cat10-uuid', 'Document', 'STNK 5 Tahun', 'VRO'),
('cat11-uuid', 'Document', 'KIR', 'VRO'),
('cat12-uuid', 'Document', 'ETLE', 'VRO'),
('cat13-uuid', 'Document', 'Non ETLE', 'VRO'),
('cat14-uuid', 'Document', 'Dok lain', 'VRO');

-- Seed User Operations
INSERT INTO operation_users (id, nama, username, password_hash, role_operation, cabang_handling, assigned_customer_cmd, status) VALUES
('user-superadmin', 'Administrator Utama', 'superadmin', 'admin123', 'Super Admin', 'All Branches', NULL, 'Active'),
('user-admin-cust', 'Rini (Admin AST)', 'admin_astra', 'password123', 'Admin Customer', 'Jakarta', '3000170', 'Active'),
('user-leader-cust', 'Bambang (Leader AST)', 'leader_astra', 'password123', 'Leader Customer', 'Jakarta', '3000170', 'Active'),
('user-sa', 'Andi Service Advisor', 'sa_dki', 'password123', 'SA', 'Jakarta', NULL, 'Active'),
('user-ss', 'Slamet Service Support', 'ss_dki', 'password123', 'SS', 'Jakarta', NULL, 'Active'),
('user-vro', 'Viktor VRO', 'vro_dki', 'password123', 'VRO', 'Jakarta', NULL, 'Active'),
('user-ts', 'Tono Tech Service', 'ts_dki', 'password123', 'TS', 'Jakarta', NULL, 'Active'),
('user-vendor', 'Budi (Vendor Agung)', 'vendor_agung', 'password123', 'Vendor', 'Jakarta', NULL, 'Active'),
('user-leader-ops', 'Haryanto (Leader Ops)', 'leader_ops', 'password123', 'Leader Operation', 'All Branches', NULL, 'Active');

INSERT INTO units (id, no_equipment, license_plate, warna_nopol, description, kelompok_unit, kategori_unit, kelompok_tipe, tipe_unit, pendingin, power, tahun_unit, chassis_no, engine_serial_no, warna, cmd, customer) VALUES
('u1-uuid', '17000000', 'B-9368-URO', 'Hitam', 'DAIHATSU GRAN MAX BLIND VAN AC 1.3 M/T', 'Commercial Car', 'Blind Van', 'Gran Max', 'Gran Max', 'Dry', 'Fuel', 2022, 'MHKB3BA1JNK081395', 'K3MJ11440', 'PUTIH', '3000170', 'PT ADI SARANA TRANSPORTASI'),
('u2-uuid', '17000001', 'B-9364-SYQ', 'Kuning', 'DAIHATSU GRAN MAX BLIND VAN AC 1.3 M/T', 'Commercial Car', 'Blind Van', 'Gran Max', 'Gran Max', 'Dry', 'Fuel', 2022, 'MHKB3BA1JNK082218', 'K3MJ13009', 'PUTIH', '3000170', 'PT ADI SARANA TRANSPORTASI');

-- ====================================================================
-- 8. AKTIFKAN REPLIKASI SUPABASE REALTIME UNTUK SELURUH TABEL UTAMA
-- ====================================================================
ALTER PUBLICATION supabase_realtime SET TABLE notifications, fsr, fsr_history, estimasi, units, operation_users;
`;
