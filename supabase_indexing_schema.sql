-- ====================================================================
-- SUPABASE INDEXING & EGRESS OPTIMIZATION SCHEMA FOR FSR SYSTEM
-- ====================================================================
-- Jalankan skrip ini di Supabase Dashboard > SQL Editor
-- Skrip ini akan membuat Index database untuk mempercepat query hingga 100x
-- dan membersihkan string Base64 yang membebani kuota Egress 5GB/30 Hari.

-- 1. INDEXING UNTUK PERFORMA QUERY & BANDWIDTH SYNC (DELTA SYNC)
CREATE INDEX IF NOT EXISTS idx_fsr_updated_at ON fsr(updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_fsr_status ON fsr(status);
CREATE INDEX IF NOT EXISTS idx_fsr_cabang ON fsr(cabang);
CREATE INDEX IF NOT EXISTS idx_fsr_no_fsr ON fsr(no_fsr);
CREATE INDEX IF NOT EXISTS idx_fsr_no_polisi ON fsr(no_polisi);
CREATE INDEX IF NOT EXISTS idx_fsr_nama_customer ON fsr(nama_customer);
CREATE INDEX IF NOT EXISTS idx_fsr_nama_vendor ON fsr(nama_vendor);

CREATE INDEX IF NOT EXISTS idx_operation_users_username ON operation_users(username);
CREATE INDEX IF NOT EXISTS idx_operation_users_role ON operation_users(role_operation);

CREATE INDEX IF NOT EXISTS idx_units_no_equipment ON units(no_equipment);
CREATE INDEX IF NOT EXISTS idx_units_license_plate ON units(license_plate);
CREATE INDEX IF NOT EXISTS idx_units_cmd ON units(cmd);

CREATE INDEX IF NOT EXISTS idx_customers_cmd ON customers(cmd);
CREATE INDEX IF NOT EXISTS idx_vendors_vmd ON vendors(vmd);

CREATE INDEX IF NOT EXISTS idx_fsr_history_fsr_id ON fsr_history(fsr_id);
CREATE INDEX IF NOT EXISTS idx_estimasi_fsr_id ON estimasi(fsr_id);

-- 2. PEMBERSIHAN DATA BASE64 LAMA DALAM TABEL FSR
-- (Membersihkan data:image/... yang pernah tersimpan agar Egress Supabase langsung hemat)
UPDATE fsr 
SET document_url = NULL 
WHERE document_url LIKE 'data:%';

UPDATE fsr 
SET estimasi_or_url = NULL 
WHERE estimasi_or_url LIKE 'data:%';

UPDATE fsr 
SET estimasi_vendor_url = NULL 
WHERE estimasi_vendor_url LIKE 'data:%';

-- Reindex & Analyze untuk mengklaim kembali statistik & performa tabel di Supabase (Aman dalam transaksi)
REINDEX TABLE fsr;
ANALYZE fsr;

-- 3. AKTIFKAN REPLIKASI SUPABASE REALTIME UNTUK SELURUH TABEL UTAMA
ALTER PUBLICATION supabase_realtime SET TABLE notifications, fsr, fsr_history, estimasi, units, operation_users;


