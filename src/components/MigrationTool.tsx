/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  Copy,
  Check,
  Download,
  Terminal,
  Database,
  ShieldCheck,
  Server,
  Key,
  RefreshCw,
  Wifi,
  WifiOff,
  CloudUpload,
  CloudDownload,
  CheckCircle,
  AlertTriangle,
  Play
} from 'lucide-react';
import { SUPABASE_MIGRATION_SQL } from '../db/supabaseMigration';
import {
  supabase,
  SUPABASE_URL,
  isAutoSyncEnabled,
  setAutoSyncEnabled,
  pushLocalToSupabase,
  pullSupabaseToLocal
} from '../db/supabaseClient';

export const MigrationTool: React.FC = () => {
  const [activeSubTab, setActiveSubTab] = useState<'sync' | 'sql'>('sync');
  const [copied, setCopied] = useState(false);
  const [autoSync, setAutoSync] = useState(isAutoSyncEnabled());
  
  // Connection Test States
  const [connectionStatus, setConnectionStatus] = useState<'checking' | 'connected' | 'error'>('checking');
  const [connectionMessage, setConnectionMessage] = useState('');
  const [missingTables, setMissingTables] = useState<string[]>([]);
  
  // Sync Operation States
  const [syncLoading, setSyncLoading] = useState(false);
  const [syncResult, setSyncResult] = useState<{ success: boolean; message: string } | null>(null);

  useEffect(() => {
    testConnection();
  }, []);

  const testConnection = async () => {
    setConnectionStatus('checking');
    setConnectionMessage('Sedang menguji koneksi ke Supabase...');
    setMissingTables([]);
    
    try {
      // Let's test by trying to fetch one row from branches, if it fails, it means tables aren't created yet or credentials are wrong
      const { error: branchesError } = await supabase.from('branches').select('id').limit(1);
      
      if (branchesError) {
        // Check if error is due to missing table
        if (branchesError.code === 'P0001' || branchesError.message.includes('does not exist')) {
          setConnectionStatus('connected'); // Credentials work, but tables aren't there
          setConnectionMessage('Koneksi Supabase OK, tetapi tabel-tabel database belum terdeteksi. Silakan jalankan script DDL SQL di tab sebelah.');
          setMissingTables(['branches', 'customers', 'units', 'fsr']);
        } else {
          throw branchesError;
        }
      } else {
        setConnectionStatus('connected');
        setConnectionMessage('Sistem berhasil terhubung penuh ke database Supabase Anda!');
      }
    } catch (err: any) {
      console.error('Supabase connection test failed:', err);
      setConnectionStatus('error');
      setConnectionMessage(
        err.message || 'Gagal terhubung ke Supabase. Periksa kembali API Keys atau koneksi internet Anda.'
      );
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(SUPABASE_MIGRATION_SQL);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([SUPABASE_MIGRATION_SQL], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.download = 'fsr_supabase_migration.sql';
    link.href = url;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleToggleAutoSync = (checked: boolean) => {
    setAutoSync(checked);
    setAutoSyncEnabled(checked);
  };

  const handlePushData = async () => {
    setSyncLoading(true);
    setSyncResult(null);
    const res = await pushLocalToSupabase();
    setSyncLoading(false);
    setSyncResult(res);
    testConnection(); // re-verify tables
  };

  const handlePullData = async () => {
    if (!window.confirm('Mengunduh data dari Supabase akan menyelaraskan data lokal Anda. Lanjutkan?')) {
      return;
    }
    setSyncLoading(true);
    setSyncResult(null);
    const res = await pullSupabaseToLocal();
    setSyncLoading(false);
    setSyncResult(res);
    if (res.success) {
      setTimeout(() => {
        window.location.reload(); // reload to refresh components with new data
      }, 1500);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Tabs */}
      <div className="flex border-b border-gray-100 dark:border-gray-800">
        <button
          onClick={() => setActiveSubTab('sync')}
          className={`flex items-center gap-2 border-b-2 px-4 py-2.5 text-xs font-bold transition-all ${
            activeSubTab === 'sync'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-gray-400 hover:text-gray-600'
          }`}
        >
          <Database className="h-4 w-4" />
          Koneksi & Sinkronisasi Live
        </button>
        <button
          onClick={() => setActiveSubTab('sql')}
          className={`flex items-center gap-2 border-b-2 px-4 py-2.5 text-xs font-bold transition-all ${
            activeSubTab === 'sql'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-gray-400 hover:text-gray-600'
          }`}
        >
          <Terminal className="h-4 w-4" />
          SQL Schema Setup (DDL)
        </button>
      </div>

      {activeSubTab === 'sync' ? (
        <div className="space-y-6 animate-fadeIn">
          {/* Status Box */}
          <div className={`rounded-2xl border p-5 ${
            connectionStatus === 'checking' ? 'border-amber-100 bg-amber-50/20 dark:border-amber-950/30' :
            connectionStatus === 'connected' ? (missingTables.length > 0 ? 'border-amber-100 bg-amber-50/20 dark:border-amber-950/30' : 'border-emerald-100 bg-emerald-50/10 dark:border-emerald-950/20') :
            'border-red-100 bg-red-50/20 dark:border-red-950/30'
          }`}>
            <div className="flex items-start gap-4">
              <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
                connectionStatus === 'checking' ? 'bg-amber-100 text-amber-600' :
                connectionStatus === 'connected' ? (missingTables.length > 0 ? 'bg-amber-100 text-amber-600' : 'bg-emerald-100 text-emerald-600') :
                'bg-red-100 text-red-600'
              }`}>
                {connectionStatus === 'checking' && <RefreshCw className="h-5 w-5 animate-spin" />}
                {connectionStatus === 'connected' && (missingTables.length > 0 ? <AlertTriangle className="h-5 w-5" /> : <Wifi className="h-5 w-5" />)}
                {connectionStatus === 'error' && <WifiOff className="h-5 w-5" />}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="text-xs font-bold text-gray-800 dark:text-gray-200">
                    Status Integrasi Supabase
                  </h3>
                  <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[9px] font-bold ${
                    connectionStatus === 'checking' ? 'bg-amber-100 text-amber-800' :
                    connectionStatus === 'connected' ? (missingTables.length > 0 ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800') :
                    'bg-red-100 text-red-800'
                  }`}>
                    {connectionStatus === 'checking' && 'Mengecek...'}
                    {connectionStatus === 'connected' && (missingTables.length > 0 ? 'Butuh Schema SQL' : 'Terhubung')}
                    {connectionStatus === 'error' && 'Terputus'}
                  </span>
                </div>
                <p className="mt-1 text-xs text-gray-600 dark:text-gray-400">
                  {connectionMessage}
                </p>
                <div className="mt-3 flex items-center gap-4 text-[10px] text-gray-400">
                  <span>URL: <code className="font-mono bg-gray-50 dark:bg-gray-900 px-1 py-0.5 rounded text-gray-500">{SUPABASE_URL}</code></span>
                  <span>Key: <code className="font-mono bg-gray-50 dark:bg-gray-900 px-1 py-0.5 rounded text-gray-500">anon-key (aktif)</code></span>
                </div>
              </div>
              <button 
                onClick={testConnection} 
                className="rounded-lg border border-gray-200 p-2 hover:bg-gray-50 dark:border-gray-800 dark:hover:bg-gray-900"
                title="Cek Koneksi Ulang"
              >
                <RefreshCw className="h-4 w-4 text-gray-500" />
              </button>
            </div>
          </div>

          {/* Configuration Controls */}
          <div className="grid gap-6 md:grid-cols-2">
            {/* Real-time Settings */}
            <div className="rounded-2xl border border-gray-100 bg-white p-6 dark:border-gray-800 dark:bg-gray-950">
              <div className="flex items-start gap-4 justify-between">
                <div>
                  <h4 className="text-sm font-bold text-gray-800 dark:text-gray-200">Auto-Sinkronisasi Real-time</h4>
                  <p className="mt-1 text-xs leading-relaxed text-gray-400 dark:text-gray-500">
                    Bila diaktifkan, semua data baru atau modifikasi yang Anda lakukan (Input Unit, Update FSR, Approval, dll) akan otomatis disimpan dan diselaraskan secara langsung ke Supabase tanpa jeda.
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={autoSync}
                    onChange={(e) => handleToggleAutoSync(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                </label>
              </div>

              <div className="mt-4 flex items-center gap-2 rounded-lg bg-blue-50/40 p-3 dark:bg-blue-950/10 text-[11px] text-blue-600 dark:text-blue-400">
                <CheckCircle className="h-4 w-4 shrink-0" />
                <span>
                  {autoSync 
                    ? 'Status: Auto-Sync Aktif. Aplikasi melakukan dual-write ke Local Storage & Supabase.' 
                    : 'Status: Auto-Sync Nonaktif. Perubahan hanya disimpan lokal di browser Anda.'}
                </span>
              </div>
            </div>

            {/* Manual Sync Utilities */}
            <div className="rounded-2xl border border-gray-100 bg-white p-6 dark:border-gray-800 dark:bg-gray-950">
              <h4 className="text-sm font-bold text-gray-800 dark:text-gray-200">Utilitas Sinkronisasi Manual</h4>
              <p className="mt-1 text-xs leading-relaxed text-gray-400 dark:text-gray-500">
                Gunakan tombol di bawah ini untuk mengirim seluruh data lokal browser Anda sekaligus, atau mengunduh data terbaru yang tersimpan di Supabase.
              </p>

              <div className="mt-5 grid grid-cols-2 gap-3">
                <button
                  onClick={handlePushData}
                  disabled={syncLoading}
                  className="flex flex-col items-center justify-center rounded-xl border border-gray-100 p-4 hover:border-blue-200 hover:bg-blue-50/10 transition dark:border-gray-800 dark:hover:border-blue-900/40"
                >
                  <CloudUpload className="h-6 w-6 text-blue-600 mb-2" />
                  <span className="text-xs font-bold text-gray-700 dark:text-gray-300">Push ke Supabase</span>
                  <span className="text-[9px] text-gray-400 text-center mt-1">Unggah semua data lokal</span>
                </button>

                <button
                  onClick={handlePullData}
                  disabled={syncLoading}
                  className="flex flex-col items-center justify-center rounded-xl border border-gray-100 p-4 hover:border-teal-200 hover:bg-teal-50/10 transition dark:border-gray-800 dark:hover:border-teal-900/40"
                >
                  <CloudDownload className="h-6 w-6 text-teal-600 mb-2" />
                  <span className="text-xs font-bold text-gray-700 dark:text-gray-300">Pull dari Supabase</span>
                  <span className="text-[9px] text-gray-400 text-center mt-1">Unduh & timpa lokal</span>
                </button>
              </div>
            </div>
          </div>

          {/* Sync Result Toast Banner */}
          {syncLoading && (
            <div className="flex items-center justify-center gap-3 rounded-xl border border-blue-100 bg-blue-50/30 p-4 dark:border-blue-900/20 dark:bg-blue-950/20">
              <RefreshCw className="h-5 w-5 text-blue-600 animate-spin" />
              <span className="text-xs text-blue-700 dark:text-blue-300 font-medium">Sedang memproses penyelarasan database... Mohon tunggu.</span>
            </div>
          )}

          {syncResult && (
            <div className={`flex items-start gap-3 rounded-xl border p-4 ${
              syncResult.success 
                ? 'border-emerald-100 bg-emerald-50/20 text-emerald-800 dark:border-emerald-950/30 dark:bg-emerald-950/10 dark:text-emerald-300' 
                : 'border-red-100 bg-red-50/20 text-red-800 dark:border-red-950/30 dark:bg-red-950/10 dark:text-red-300'
            }`}>
              <div className="shrink-0 mt-0.5">
                {syncResult.success ? <CheckCircle className="h-5 w-5 text-emerald-600" /> : <AlertTriangle className="h-5 w-5 text-red-600" />}
              </div>
              <div className="flex-1">
                <h5 className="text-xs font-bold">{syncResult.success ? 'Sinkronisasi Berhasil' : 'Sinkronisasi Gagal'}</h5>
                <p className="text-[11px] mt-0.5 leading-relaxed">{syncResult.message}</p>
                
                {!syncResult.success && syncResult.message.includes('value too long') && (
                  <div className="mt-3 rounded-lg border border-red-200 bg-red-50/10 p-3 text-red-700 dark:border-red-900/50 dark:bg-red-950/10 dark:text-red-300">
                    <p className="text-[10px] font-bold uppercase tracking-wider">💡 CARA SOLUSI (SQL PATCH):</p>
                    <p className="text-[11px] mt-1">
                      Error ini terjadi karena kolom <code className="font-mono bg-red-50 dark:bg-red-950 px-1 py-0.5 rounded text-[10px]">no_polisi</code>, <code className="font-mono bg-red-50 dark:bg-red-950 px-1 py-0.5 rounded text-[10px]">no_rangka</code>, atau <code className="font-mono bg-red-50 dark:bg-red-950 px-1 py-0.5 rounded text-[10px]">type_kendaraan</code> di database Supabase Anda saat ini menggunakan limit karakter (<code className="font-mono text-[10px]">VARCHAR(50)</code>).
                    </p>
                    <p className="text-[11px] mt-2">
                      Silakan salin kode SQL Patch di bawah ini, jalankan di <strong>Supabase SQL Editor</strong>, kemudian tekan tombol <strong>"Push ke Supabase"</strong> lagi:
                    </p>
                    <pre className="mt-2 text-[10px] font-mono bg-white dark:bg-gray-950 p-2.5 rounded-md border border-red-100 dark:border-red-900/30 overflow-x-auto select-all text-slate-800 dark:text-slate-200">
{`ALTER TABLE fsr ALTER COLUMN no_polisi TYPE TEXT;
ALTER TABLE fsr ALTER COLUMN type_kendaraan TYPE TEXT;
ALTER TABLE fsr ALTER COLUMN no_rangka TYPE TEXT;`}
                    </pre>
                  </div>
                )}

                {!syncResult.success && (syncResult.message.includes('column') || syncResult.message.includes('schema cache')) && (
                  <div className="mt-3 rounded-lg border border-red-200 bg-red-50/10 p-3 text-red-700 dark:border-red-900/50 dark:bg-red-950/10 dark:text-red-300">
                    <p className="text-[10px] font-bold uppercase tracking-wider">💡 SOLUSI KOLOM TABEL UNTUK UPDATE DATA:</p>
                    <p className="text-[11px] mt-1">
                      Error ini terjadi karena database Supabase Anda saat ini kekurangan beberapa kolom alur kerja (workflow) atau Own Risk (OR).
                    </p>
                    <p className="text-[11px] mt-2">
                      Silakan salin kode SQL Patch di bawah ini, jalankan di <strong>Supabase SQL Editor</strong>, kemudian tekan tombol <strong>"Push ke Supabase"</strong> lagi:
                    </p>
                    <pre className="mt-2 text-[10px] font-mono bg-white dark:bg-gray-950 p-2.5 rounded-md border border-red-100 dark:border-red-900/30 overflow-x-auto select-all text-slate-800 dark:text-slate-200">
{`ALTER TABLE fsr ADD COLUMN IF NOT EXISTS nama_sa_ss_vro VARCHAR(200);
ALTER TABLE fsr ADD COLUMN IF NOT EXISTS role_sa_ss_vro VARCHAR(50);
ALTER TABLE fsr ADD COLUMN IF NOT EXISTS tanggal_proses TIMESTAMPTZ;
ALTER TABLE fsr ADD COLUMN IF NOT EXISTS no_spk VARCHAR(100);
ALTER TABLE fsr ADD COLUMN IF NOT EXISTS nama_ts VARCHAR(200);
ALTER TABLE fsr ADD COLUMN IF NOT EXISTS nama_vendor VARCHAR(200);
ALTER TABLE fsr ADD COLUMN IF NOT EXISTS estimasi_biaya NUMERIC(15,2);
ALTER TABLE fsr ADD COLUMN IF NOT EXISTS tanggal_masuk_bengkel TIMESTAMPTZ;
ALTER TABLE fsr ADD COLUMN IF NOT EXISTS tanggal_estimasi_approved_by_leader TIMESTAMPTZ;
ALTER TABLE fsr ADD COLUMN IF NOT EXISTS tanggal_estimasi_approved_by_customer TIMESTAMPTZ;
ALTER TABLE fsr ADD COLUMN IF NOT EXISTS tanggal_selesai_perbaikan TIMESTAMPTZ;
ALTER TABLE fsr ADD COLUMN IF NOT EXISTS document_url TEXT;
ALTER TABLE fsr ADD COLUMN IF NOT EXISTS document_name VARCHAR(255);
ALTER TABLE fsr ADD COLUMN IF NOT EXISTS estimasi_or_url TEXT;
ALTER TABLE fsr ADD COLUMN IF NOT EXISTS estimasi_or_name VARCHAR(255);
ALTER TABLE fsr ADD COLUMN IF NOT EXISTS biaya_estimasi_or NUMERIC(15,2);
ALTER TABLE fsr ADD COLUMN IF NOT EXISTS estimasi_vendor_url TEXT;
ALTER TABLE fsr ADD COLUMN IF NOT EXISTS estimasi_vendor_name VARCHAR(255);`}
                    </pre>
                  </div>
                )}

                {!syncResult.success && (syncResult.message.includes('unique constraint') || syncResult.message.includes('duplicate key') || syncResult.message.toLowerCase().includes('no_fsr')) && (
                  <div className="mt-3 rounded-lg border border-red-200 bg-red-50/10 p-3 text-red-700 dark:border-red-900/50 dark:bg-red-950/10 dark:text-red-300">
                    <p className="text-[10px] font-bold uppercase tracking-wider">⚡ SOLUSI DUPLIKAT NO FSR (SQL PATCH):</p>
                    <p className="text-[11px] mt-1">
                      Error ini terjadi karena database Supabase Anda saat ini memiliki batasan unik (UNIQUE constraint) pada nomor FSR (<code className="font-mono text-[10px]">no_fsr</code>).
                    </p>
                    <p className="text-[11px] mt-2">
                      Silakan salin kode SQL Patch di bawah ini, jalankan di <strong>Supabase SQL Editor</strong> untuk memperbolehkan duplikat nomor FSR pada kategori Document, kemudian tekan kembali tombol <strong>"Push ke Supabase"</strong>:
                    </p>
                    <pre className="mt-2 text-[10px] font-mono bg-white dark:bg-gray-950 p-2.5 rounded-md border border-red-100 dark:border-red-900/30 overflow-x-auto select-all text-slate-800 dark:text-slate-200">
{`ALTER TABLE fsr DROP CONSTRAINT IF EXISTS fsr_no_fsr_key;`}
                    </pre>
                  </div>
                )}

                {!syncResult.success && (syncResult.message.includes('row-level security') || syncResult.message.includes('RLS') || syncResult.message.toLowerCase().includes('security policy')) && (
                  <div className="mt-3 rounded-lg border border-red-200 bg-red-50/10 p-3 text-red-700 dark:border-red-900/50 dark:bg-red-950/10 dark:text-red-300">
                    <p className="text-[10px] font-bold uppercase tracking-wider">🔒 SOLUSI SECURITY POLICY (RLS) ERROR:</p>
                    <p className="text-[11px] mt-1">
                      Error ini terjadi karena database Supabase baru Anda secara default mengaktifkan Row-Level Security (RLS) di semua tabel, sehingga memblokir sinkronisasi data dari aplikasi.
                    </p>
                    <p className="text-[11px] mt-2">
                      Silakan salin kode SQL di bawah ini, jalankan di <strong>Supabase SQL Editor</strong> untuk menonaktifkan RLS pada seluruh tabel, kemudian tekan kembali tombol <strong>"Push ke Supabase"</strong>:
                    </p>
                    <pre className="mt-2 text-[10px] font-mono bg-white dark:bg-gray-950 p-2.5 rounded-md border border-red-100 dark:border-red-900/30 overflow-x-auto select-all text-slate-800 dark:text-slate-200">
{`ALTER TABLE branches DISABLE ROW LEVEL SECURITY;
ALTER TABLE customers DISABLE ROW LEVEL SECURITY;
ALTER TABLE vendors DISABLE ROW LEVEL SECURITY;
ALTER TABLE categories DISABLE ROW LEVEL SECURITY;
ALTER TABLE operation_users DISABLE ROW LEVEL SECURITY;
ALTER TABLE units DISABLE ROW LEVEL SECURITY;
ALTER TABLE fsr DISABLE ROW LEVEL SECURITY;
ALTER TABLE fsr_history DISABLE ROW LEVEL SECURITY;
ALTER TABLE estimasi DISABLE ROW LEVEL SECURITY;
ALTER TABLE notifications DISABLE ROW LEVEL SECURITY;
ALTER TABLE activity_logs DISABLE ROW LEVEL SECURITY;`}
                    </pre>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-6 animate-fadeIn">
          {/* Introduction Card */}
          <div className="rounded-2xl border border-blue-100 bg-blue-50/20 p-6 dark:border-blue-900/30 dark:bg-blue-950/10">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-blue-100 text-blue-600 dark:bg-blue-900/40 dark:text-blue-400">
                <Server className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-gray-800 dark:text-gray-200">
                  Supabase PostgreSQL Production Architecture
                </h3>
                <p className="mt-1 text-xs leading-relaxed text-gray-600 dark:text-gray-400">
                  Aplikasi FSR ini dirancang menggunakan arsitektur clean DB dengan relasi foreign key, trigger audit trail, dan kebijakan keamanan 
                  <span className="font-semibold text-blue-600 dark:text-blue-400"> Row Level Security (RLS)</span>. Script DDL di bawah siap dieksekusi 
                  di Supabase SQL Editor untuk memulai production database Anda secara instan.
                </p>
              </div>
            </div>
          </div>

          {/* Step by Step Setup Guide */}
          <div className="grid gap-4 sm:grid-cols-3">
            {/* Step 1 */}
            <div className="rounded-xl border border-gray-100 bg-white p-4 dark:border-gray-800 dark:bg-gray-950">
              <div className="flex items-center gap-2 mb-2">
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-50 text-blue-600 dark:bg-blue-950 text-xs font-bold">
                  1
                </div>
                <h4 className="text-xs font-bold text-gray-800 dark:text-gray-200">Eksekusi DDL</h4>
              </div>
              <p className="text-[11px] leading-relaxed text-gray-400 dark:text-gray-500">
                Copy script DDL di bawah, buka dashboard <span className="font-semibold text-gray-500 dark:text-gray-400">Supabase</span>, masuk ke SQL Editor, paste dan klik Run.
              </p>
            </div>

            {/* Step 2 */}
            <div className="rounded-xl border border-gray-100 bg-white p-4 dark:border-gray-800 dark:bg-gray-950">
              <div className="flex items-center gap-2 mb-2">
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-50 text-blue-600 dark:bg-blue-950 text-xs font-bold">
                  2
                </div>
                <h4 className="text-xs font-bold text-gray-800 dark:text-gray-200">Storage Bucket</h4>
              </div>
              <p className="text-[11px] leading-relaxed text-gray-400 dark:text-gray-500">
                Buat bucket penyimpanan file di Storage tab dengan nama <span className="font-mono font-bold text-gray-500 dark:text-gray-400">fsr-documents</span> dengan akses public untuk foto kilometer/dokumen.
              </p>
            </div>

            {/* Step 3 */}
            <div className="rounded-xl border border-gray-100 bg-white p-4 dark:border-gray-800 dark:bg-gray-950">
              <div className="flex items-center gap-2 mb-2">
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-50 text-blue-600 dark:bg-blue-950 text-xs font-bold">
                  3
                </div>
                <h4 className="text-xs font-bold text-gray-800 dark:text-gray-200">Realtime & Auth</h4>
              </div>
              <p className="text-[11px] leading-relaxed text-gray-400 dark:text-gray-500">
                Nyalakan fitur <span className="font-semibold text-gray-500">Realtime Broadcast</span> pada tabel <span className="font-mono text-[10px] bg-gray-50 px-1 dark:bg-gray-900">fsr</span> dan <span className="font-mono text-[10px] bg-gray-50 px-1 dark:bg-gray-900">notifications</span> untuk tracking timeline instan.
              </p>
            </div>
          </div>

          {/* Code Editor Code Box */}
          <div className="rounded-2xl border border-slate-200 bg-white shadow-xs overflow-hidden">
            {/* Editor Header */}
            <div className="flex items-center justify-between bg-slate-100 px-6 py-3.5 text-xs text-slate-600 border-b border-slate-200">
              <div className="flex items-center gap-2 font-mono">
                <Terminal className="h-4.5 w-4.5 text-brand-500 animate-pulse" />
                <span className="font-bold text-slate-800">fsr_supabase_migration.sql</span>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleCopy}
                  className="inline-flex items-center gap-1.5 rounded-md border border-slate-200 bg-white px-3 py-1.5 text-slate-700 hover:bg-slate-50 hover:text-slate-900 transition-colors text-[11px] font-semibold shadow-2xs"
                >
                  {copied ? (
                    <>
                      <Check className="h-3.5 w-3.5 text-emerald-600" /> Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="h-3.5 w-3.5 text-slate-500" /> Copy SQL
                    </>
                  )}
                </button>
                <button
                  onClick={handleDownload}
                  className="inline-flex items-center gap-1.5 rounded-md border border-slate-200 bg-white px-3 py-1.5 text-slate-700 hover:bg-slate-50 hover:text-slate-900 transition-colors text-[11px] font-semibold shadow-2xs"
                >
                  <Download className="h-3.5 w-3.5 text-slate-500" /> Download .sql
                </button>
              </div>
            </div>

            {/* Code Block */}
            <div className="p-6 overflow-x-auto max-h-[460px] font-mono text-xs text-slate-800 leading-relaxed bg-slate-50">
              <pre>{SUPABASE_MIGRATION_SQL}</pre>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
