/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import {
  Activity,
  Search,
  Trash2,
  RefreshCw,
  Clock,
  User,
  ShieldAlert,
  AlertTriangle,
  CheckCircle2,
  Calendar,
  Filter,
  X,
  FileText,
  SlidersHorizontal
} from 'lucide-react';
import { useTheme } from './ThemeContext';
import { localDb } from '../db/localDb';
import { ActivityLog, UserRole } from '../types';
import { pullSupabaseToLocal } from '../db/supabaseClient';

export const ActivityLogs: React.FC = () => {
  const { currentUser } = useTheme();
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRole, setSelectedRole] = useState<string>('ALL');
  const [selectedAction, setSelectedAction] = useState<string>('ALL');
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [logToDelete, setLogToDelete] = useState<ActivityLog | null>(null);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [actionSuccessMsg, setActionSuccessMsg] = useState<string | null>(null);

  // Load logs from localDb
  const loadLogs = async () => {
    try {
      const list = await localDb.getActivityLogs();
      setLogs(list);
    } catch (e) {
      console.error('Failed to load logs:', e);
    }
  };

  useEffect(() => {
    loadLogs();

    // Listen for realtime or local database updates
    const handleUpdate = () => {
      loadLogs();
    };

    window.addEventListener('fsr_db_updated', handleUpdate);
    return () => {
      window.removeEventListener('fsr_db_updated', handleUpdate);
    };
  }, []);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await pullSupabaseToLocal();
      loadLogs();
      showSuccessFeedback('Data log aktivitas berhasil disinkronkan dengan Supabase.');
    } catch (err) {
      console.error('Refresh logs error:', err);
    } finally {
      setIsRefreshing(false);
    }
  };

  const showSuccessFeedback = (msg: string) => {
    setActionSuccessMsg(msg);
    setTimeout(() => {
      setActionSuccessMsg(null);
    }, 3500);
  };

  // Delete a single log
  const confirmDeleteLog = async () => {
    if (!logToDelete) return;
    const id = logToDelete.id;
    setLogToDelete(null);
    try {
      await localDb.deleteActivityLog(id, currentUser);
      loadLogs();
      showSuccessFeedback('Log aktivitas berhasil dihapus dari aplikasi dan Supabase.');
    } catch (err) {
      console.error('Failed to delete log:', err);
    }
  };

  // Clear all logs
  const confirmClearAll = async () => {
    setShowClearConfirm(false);
    try {
      await localDb.clearActivityLogs(currentUser);
      loadLogs();
      showSuccessFeedback('Seluruh riwayat log aktivitas berhasil dibersihkan dari aplikasi dan Supabase.');
    } catch (err) {
      console.error('Failed to clear logs:', err);
    }
  };

  // Distinct action categories for filter
  const actionCategories = useMemo(() => {
    const set = new Set<string>();
    logs.forEach(l => {
      if (l.action) set.add(l.action);
    });
    return Array.from(set).sort();
  }, [logs]);

  // Distinct roles for filter
  const roleCategories = useMemo(() => {
    const set = new Set<string>();
    logs.forEach(l => {
      if (l.actor_role) set.add(l.actor_role);
    });
    return Array.from(set).sort();
  }, [logs]);

  // Filtered and sorted logs
  const filteredLogs = useMemo(() => {
    return logs
      .filter(l => {
        const matchesSearch =
          (l.action && l.action.toLowerCase().includes(searchTerm.toLowerCase())) ||
          (l.description && l.description.toLowerCase().includes(searchTerm.toLowerCase())) ||
          (l.actor_name && l.actor_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
          (l.actor_role && l.actor_role.toLowerCase().includes(searchTerm.toLowerCase()));

        const matchesRole = selectedRole === 'ALL' || l.actor_role === selectedRole;
        const matchesAction = selectedAction === 'ALL' || l.action === selectedAction;

        return matchesSearch && matchesRole && matchesAction;
      })
      .sort((a, b) => {
        const dateA = new Date(a.created_at).getTime();
        const dateB = new Date(b.created_at).getTime();
        return sortOrder === 'desc' ? dateB - dateA : dateA - dateB;
      });
  }, [logs, searchTerm, selectedRole, selectedAction, sortOrder]);

  const getActionBadgeColor = (action: string) => {
    const act = action.toLowerCase();
    if (act.includes('delete') || act.includes('hapus') || act.includes('reject') || act.includes('cancel')) {
      return 'bg-red-50 text-red-700 border-red-200 dark:bg-red-950/40 dark:text-red-400 dark:border-red-900/40';
    }
    if (act.includes('create') || act.includes('tambah') || act.includes('baru') || act.includes('pengajuan')) {
      return 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-400 dark:border-blue-900/40';
    }
    if (act.includes('update') || act.includes('edit') || act.includes('ubah') || act.includes('proses')) {
      return 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-900/40';
    }
    if (act.includes('approve') || act.includes('setuju') || act.includes('selesai') || act.includes('login')) {
      return 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-900/40';
    }
    return 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700';
  };

  const getRoleBadgeColor = (role: UserRole) => {
    switch (role) {
      case 'Super Admin':
        return 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/40 dark:text-purple-400';
      case 'Leader Operation':
        return 'bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950/40 dark:text-indigo-400';
      case 'Admin Customer':
      case 'Leader Customer':
        return 'bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-950/40 dark:text-sky-400';
      case 'Vendor':
        return 'bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-950/40 dark:text-orange-400';
      case 'TS':
        return 'bg-teal-50 text-teal-700 border-teal-200 dark:bg-teal-950/40 dark:text-teal-400';
      default:
        return 'bg-slate-50 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300';
    }
  };

  const formatTimestamp = (isoStr: string) => {
    if (!isoStr) return '-';
    try {
      const d = new Date(isoStr);
      return d.toLocaleString('id-ID', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      });
    } catch {
      return isoStr;
    }
  };

  const formatRelativeTime = (isoStr: string) => {
    if (!isoStr) return '';
    try {
      const now = Date.now();
      const past = new Date(isoStr).getTime();
      const diffSec = Math.floor((now - past) / 1000);
      if (diffSec < 60) return `${Math.max(1, diffSec)} detik lalu`;
      const diffMin = Math.floor(diffSec / 60);
      if (diffMin < 60) return `${diffMin} menit lalu`;
      const diffHour = Math.floor(diffMin / 60);
      if (diffHour < 24) return `${diffHour} jam lalu`;
      const diffDay = Math.floor(diffHour / 24);
      return `${diffDay} hari lalu`;
    } catch {
      return '';
    }
  };

  const canDelete = currentUser.role_operation === 'Super Admin' || currentUser.role_operation === 'Leader Operation';

  return (
    <div className="space-y-6 pb-20 lg:pb-12">
      {/* Toast Feedback */}
      {actionSuccessMsg && (
        <div className="fixed top-20 right-4 z-50 max-w-md bg-emerald-600 text-white px-4 py-3 rounded-xl shadow-xl flex items-center gap-2 animate-in fade-in slide-in-from-top-4 duration-200">
          <CheckCircle2 className="h-5 w-5 shrink-0" />
          <span className="text-xs font-semibold">{actionSuccessMsg}</span>
        </div>
      )}

      {/* Header Section */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-5 md:p-6 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="p-3 bg-brand-50 dark:bg-brand-950/40 text-brand-600 dark:text-brand-400 rounded-xl border border-brand-100 dark:border-brand-900/50">
              <Activity className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-lg md:text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                Log Aktivitas Sistem
                <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-normal">
                  {filteredLogs.length} Entri
                </span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Audit trail lengkap seluruh aktivitas, mutasi data, dan alur kerja operasional. Sinkron otomatis dengan Supabase.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start md:self-auto">
            <button
              type="button"
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700/80 rounded-xl border border-slate-200 dark:border-slate-700 transition-colors"
              title="Tarik log terbaru dari Supabase"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${isRefreshing ? 'animate-spin text-brand-600' : ''}`} />
              <span>{isRefreshing ? 'Sinkron...' : 'Segarkan'}</span>
            </button>

            {canDelete && logs.length > 0 && (
              <button
                type="button"
                onClick={() => setShowClearConfirm(true)}
                className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/30 hover:bg-red-100 dark:hover:bg-red-900/40 rounded-xl border border-red-200 dark:border-red-900/40 transition-colors"
                title="Hapus semua log riwayat"
              >
                <Trash2 className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Bersihkan Semua</span>
                <span className="sm:hidden">Clear</span>
              </button>
            )}
          </div>
        </div>

        {/* Filter & Search Bar */}
        <div className="mt-5 pt-5 border-t border-slate-100 dark:border-slate-800/80 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Search Input */}
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Cari aksi, pelaku, deskripsi..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-8 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-brand-500"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          {/* Action Filter */}
          <div>
            <select
              value={selectedAction}
              onChange={(e) => setSelectedAction(e.target.value)}
              className="w-full py-2 px-3 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-brand-500"
            >
              <option value="ALL">Semua Tipe Aksi</option>
              {actionCategories.map((act) => (
                <option key={act} value={act}>
                  {act}
                </option>
              ))}
            </select>
          </div>

          {/* Role Filter */}
          <div>
            <select
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value)}
              className="w-full py-2 px-3 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-brand-500"
            >
              <option value="ALL">Semua Role Pelaku</option>
              {roleCategories.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </div>

          {/* Sort Order */}
          <div>
            <select
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value as 'desc' | 'asc')}
              className="w-full py-2 px-3 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-brand-500"
            >
              <option value="desc">Urutan: Terbaru Dulu</option>
              <option value="asc">Urutan: Terlama Dulu</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      {filteredLogs.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-12 text-center">
          <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mx-auto text-slate-400 mb-3">
            <Activity className="h-6 w-6" />
          </div>
          <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">
            Tidak Ada Log Aktivitas Ditemukan
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
            {searchTerm || selectedAction !== 'ALL' || selectedRole !== 'ALL'
              ? 'Tidak ada riwayat log yang sesuai dengan filter pencarian Anda.'
              : 'Belum ada aktivitas yang dicatat di database sistem.'}
          </p>
        </div>
      ) : (
        <>
          {/* 1. Mobile Cards View (Visible on < md) */}
          <div className="md:hidden space-y-3">
            {filteredLogs.map((log) => (
              <div
                key={log.id}
                className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-4 shadow-xs"
              >
                {/* Header: Action badge & Time */}
                <div className="flex items-start justify-between gap-2 mb-2">
                  <span
                    className={`inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-bold border ${getActionBadgeColor(
                      log.action
                    )}`}
                  >
                    {log.action}
                  </span>
                  <div className="text-right">
                    <span className="text-[10px] text-slate-400 block font-medium">
                      {formatRelativeTime(log.created_at)}
                    </span>
                    <span className="text-[9px] text-slate-400 font-mono">
                      {formatTimestamp(log.created_at)}
                    </span>
                  </div>
                </div>

                {/* Actor Info */}
                <div className="flex items-center gap-2 mb-2.5 text-xs">
                  <div className="flex items-center gap-1 text-slate-800 dark:text-slate-200 font-semibold">
                    <User className="h-3 w-3 text-slate-400" />
                    <span>{log.actor_name}</span>
                  </div>
                  <span
                    className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-medium border ${getRoleBadgeColor(
                      log.actor_role
                    )}`}
                  >
                    {log.actor_role}
                  </span>
                </div>

                {/* Description Body */}
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed bg-slate-50/80 dark:bg-slate-950/50 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800/80">
                  {log.description}
                </p>

                {/* Mobile Action Bar */}
                {canDelete && (
                  <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-end">
                    <button
                      type="button"
                      onClick={() => setLogToDelete(log)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-red-200 dark:border-red-900/40 bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400 text-xs font-semibold hover:bg-red-100 dark:hover:bg-red-900/50 active:scale-95 transition-all"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      <span>Hapus Log Ini</span>
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* 2. Desktop Table View (Visible on >= md) */}
          <div className="hidden md:block bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-950/60 border-b border-slate-200 dark:border-slate-800 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    <th className="py-3 px-4 w-12 text-center">No</th>
                    <th className="py-3 px-4 w-44">Waktu</th>
                    <th className="py-3 px-4 w-52">Pelaku</th>
                    <th className="py-3 px-4 w-40">Aksi</th>
                    <th className="py-3 px-4">Deskripsi Aktivitas</th>
                    {canDelete && <th className="py-3 px-4 w-20 text-center">Hapus</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                  {filteredLogs.map((log, index) => (
                    <tr
                      key={log.id}
                      className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors"
                    >
                      <td className="py-3 px-4 text-center font-mono text-slate-400">
                        {index + 1}
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-mono text-slate-700 dark:text-slate-300 text-[11px]">
                          {formatTimestamp(log.created_at)}
                        </div>
                        <div className="text-[10px] text-slate-400">
                          {formatRelativeTime(log.created_at)}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-900 dark:text-white">
                          {log.actor_name}
                        </div>
                        <span
                          className={`inline-block mt-0.5 px-1.5 py-0.5 rounded text-[10px] font-medium border ${getRoleBadgeColor(
                            log.actor_role
                          )}`}
                        >
                          {log.actor_role}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-bold border ${getActionBadgeColor(
                            log.action
                          )}`}
                        >
                          {log.action}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-600 dark:text-slate-300 leading-relaxed max-w-md">
                        {log.description}
                      </td>
                      {canDelete && (
                        <td className="py-3 px-4 text-center">
                          <button
                            type="button"
                            onClick={() => setLogToDelete(log)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors"
                            title="Hapus baris log ini"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* Confirmation Modal: Delete Single Log */}
      {logToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 animate-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3 text-red-600 dark:text-red-400 mb-3">
              <div className="p-2.5 rounded-xl bg-red-100 dark:bg-red-950/50">
                <Trash2 className="h-5 w-5" />
              </div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Hapus Log Aktivitas?
              </h3>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-2">
              Log ini akan dihapus secara permanen dari memori aplikasi dan database Supabase:
            </p>
            <div className="p-3 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800 text-xs mb-5">
              <div className="font-bold text-slate-800 dark:text-slate-200">
                {logToDelete.action} — {logToDelete.actor_name}
              </div>
              <div className="text-[11px] text-slate-500 mt-0.5 truncate">
                {logToDelete.description}
              </div>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setLogToDelete(null)}
                className="flex-1 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 rounded-xl hover:bg-slate-200 transition-colors"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={confirmDeleteLog}
                className="flex-1 py-2 text-xs font-semibold text-white bg-red-600 rounded-xl hover:bg-red-700 transition-colors"
              >
                Hapus Sekarang
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal: Clear All Logs */}
      {showClearConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 animate-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3 text-red-600 dark:text-red-400 mb-3">
              <div className="p-2.5 rounded-xl bg-red-100 dark:bg-red-950/50">
                <AlertTriangle className="h-5 w-5" />
              </div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Bersihkan Semua Log?
              </h3>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-5 leading-relaxed">
              Tindakan ini akan mengosongkan seluruh riwayat log aktivitas ({logs.length} entri) dari aplikasi dan dari tabel <code className="px-1 py-0.5 rounded bg-slate-100 dark:bg-slate-800 font-mono text-[11px]">activity_logs</code> di Supabase. Tindakan ini tidak dapat dibatalkan.
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setShowClearConfirm(false)}
                className="flex-1 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 rounded-xl hover:bg-slate-200 transition-colors"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={confirmClearAll}
                className="flex-1 py-2 text-xs font-semibold text-white bg-red-600 rounded-xl hover:bg-red-700 transition-colors"
              >
                Bersihkan Semua
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
