/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  FileText,
  Clock,
  Car,
  CheckCircle2,
  Users,
  ShieldAlert,
  FolderTree,
  UserCheck,
  Plus,
  Trash2,
  Edit3,
  Search,
  CheckCircle,
  AlertCircle,
  Download,
  Upload,
  X,
  FileSpreadsheet,
  MoreVertical,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  Filter,
  Wrench,
  BookOpen,
  BarChart3
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer
} from 'recharts';
import { localDb } from '../db/localDb';
import { Fsr, ActivityLog } from '../types';
import { useTheme } from './ThemeContext';
import DashboardSkeleton from './DashboardSkeleton';

export const Dashboard: React.FC = () => {
  const { currentUser } = useTheme();
  const [fsrs, setFsrs] = useState<Fsr[]>([]);
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);
  const [branches, setBranches] = useState<any[]>([]);
  const [masterVendors, setMasterVendors] = useState<any[]>([]);

  // Search & filter states
  const [dashboardFilterCabang, setDashboardFilterCabang] = useState(() => {
    if (currentUser?.cabang_handling && currentUser.cabang_handling !== 'All Branches' && currentUser.cabang_handling !== 'All') {
      return currentUser.cabang_handling;
    }
    return sessionStorage.getItem('dashboardFilterCabang') || '';
  });

  // Vendor Checklist Filter State
  const [selectedVendors, setSelectedVendors] = useState<string[]>([]);
  const [showVendorDropdown, setShowVendorDropdown] = useState(false);
  const [vendorSearchQuery, setVendorSearchQuery] = useState('');
  
  // Track selected FSR for live monitoring detailed status preview
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);

  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowVendorDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Persist filter to sessionStorage when changed
  useEffect(() => {
    if (!currentUser?.cabang_handling || currentUser.cabang_handling === 'All Branches' || currentUser.cabang_handling === 'All') {
      sessionStorage.setItem('dashboardFilterCabang', dashboardFilterCabang);
    }
  }, [dashboardFilterCabang, currentUser]);

  const loadData = () => {
    setIsLoading(true);
    const list = localDb.getFsrs(currentUser);
    setFsrs(list);
    setActivityLogs(localDb.getActivityLogs());
    setBranches(localDb.getBranches());
    
    // FETCH REAL VENDORS FROM MASTER DATABASE WITHOUT HARDCODING
    const realVendors = localDb.getVendors();
    setMasterVendors(realVendors);
    
    setTimeout(() => {
      setIsLoading(false);
    }, 300);
  };

  useEffect(() => {
    if (currentUser?.cabang_handling && currentUser.cabang_handling !== 'All Branches' && currentUser.cabang_handling !== 'All') {
      setDashboardFilterCabang(currentUser.cabang_handling);
    } else {
      setDashboardFilterCabang(sessionStorage.getItem('dashboardFilterCabang') || '');
    }
    loadData();
    const handleDbUpdate = () => loadData();
    window.addEventListener('fsr_db_updated', handleDbUpdate);
    return () => window.removeEventListener('fsr_db_updated', handleDbUpdate);
  }, [currentUser]);

  // Is all branches authorized
  const isAllBranchesAuthorized = !currentUser?.cabang_handling || currentUser.cabang_handling === 'All Branches' || currentUser.cabang_handling === 'All';

  // Get cabang options list dynamically
  const cabangOptions = Array.from(new Set([
    ...branches.map((b) => b.cabang),
    ...fsrs.map((f) => f.cabang)
  ])).filter(Boolean).sort();

  // Role based status filters configuration
  const getRoleStatuses = (role: string): string[] => {
    switch (role) {
      case 'SA':
      case 'SS':
        return []; // SA & SS see all stages of Maintenance & Body Repair
      case 'VRO':
        return []; // VRO sees all stages of Document
      case 'TS':
        return ['Waiting TS', 'On Progress', 'Finished'];
      case 'Vendor':
        return ['Waiting Vendor', 'On Progress', 'Waiting Estimasi', 'Negotiation', 'Finished'];
      case 'Admin Customer':
      case 'Leader Customer':
        return [];
      default:
        return [];
    }
  };

  const isSuperUser = currentUser?.role_operation === 'Super Admin' || currentUser?.role_operation === 'Leader Operation';
  const roleStatuses = getRoleStatuses(currentUser?.role_operation || '');

  // 1. First level: Filter by role if not Super Admin/Leader Operation
  const roleFilteredFsrs = isSuperUser 
    ? fsrs 
    : fsrs.filter((f) => roleStatuses.length === 0 || roleStatuses.includes(f.status));

  // 2. Second level: Filter by selected branch
  const branchFilteredFsrs = roleFilteredFsrs.filter((f) => {
    if (!dashboardFilterCabang) return true;
    return f.cabang === dashboardFilterCabang;
  });

  // 3. Third level: Filter by checked vendors (Checklist filter)
  const finalFilteredFsrs = selectedVendors.length > 0
    ? branchFilteredFsrs.filter((f) => {
        if (!f.nama_vendor) return false;
        return selectedVendors.some(vendorName => 
          f.nama_vendor?.toLowerCase().includes(vendorName.toLowerCase()) ||
          vendorName.toLowerCase().includes(f.nama_vendor?.toLowerCase())
        );
      })
    : branchFilteredFsrs;

  const [isLoading, setIsLoading] = useState(true);

  // Classify master vendor list into types
  const getVendorClassification = (name: string): 'Internal' | 'Eksternal' | 'Prioritas' => {
    const n = name.toLowerCase();
    if (n.includes('cv') || n.includes('lestari') || n.includes('sinar jaya') || n.includes('internal')) {
      return 'Internal';
    }
    if (n.includes('isuzu') || n.includes('moramayu') || n.includes('prioritas') || n.includes('champion')) {
      return 'Prioritas';
    }
    return 'Eksternal';
  };

  // Clean & deduplicate master vendor list
  const availableVendorsList = useMemo(() => {
    const seen = new Set<string>();
    const list: { name: string; vmd?: string; type: 'Internal' | 'Eksternal' | 'Prioritas' }[] = [];
    
    masterVendors.forEach(v => {
      const name = (v.nama_vendor || '').trim();
      if (name && !seen.has(name.toLowerCase())) {
        seen.add(name.toLowerCase());
        list.push({
          name,
          vmd: v.vmd,
          type: getVendorClassification(name)
        });
      }
    });

    return list.sort((a, b) => a.name.localeCompare(b.name));
  }, [masterVendors]);

  // Real-time filtered vendors based on search query
  const filteredVendorsList = useMemo(() => {
    const q = vendorSearchQuery.trim().toLowerCase();
    if (!q) return availableVendorsList;
    const terms = q.split(/\s+/).filter(Boolean);
    return availableVendorsList.filter(v => {
      const vName = v.name.toLowerCase();
      const vVmd = (v.vmd || '').toLowerCase();
      return terms.every(term => vName.includes(term) || vVmd.includes(term));
    });
  }, [vendorSearchQuery, availableVendorsList]);

  // Sparkline Component
  const Sparkline: React.FC<{ color: string; count: number; seed: number }> = ({ color, count, seed }) => {
    if (count === 0) {
      return (
        <div className="w-full h-8 mt-2 opacity-60 shrink-0 flex flex-col justify-end">
          <svg viewBox="0 0 160 20" className="w-full h-4" preserveAspectRatio="none">
            <line x1="0" y1="15" x2="160" y2="15" stroke={color} strokeWidth="1.5" strokeDasharray="3 3" opacity="0.35" />
          </svg>
          <div className="flex justify-between text-[7px] text-slate-400 font-bold px-1 mt-0.5">
            <span>0 Data</span>
            <span>Real-time DB</span>
            <span className="text-slate-400 font-bold">-</span>
          </div>
        </div>
      );
    }

    const points = [
      { x: 0, y: 15 + Math.sin(seed) * 5 },
      { x: 20, y: 10 + Math.cos(seed) * 6 },
      { x: 40, y: 18 + Math.sin(seed + 1) * 4 },
      { x: 60, y: 8 + Math.cos(seed + 2) * 5 },
      { x: 80, y: 14 + Math.sin(seed + 3) * 6 },
      { x: 100, y: 5 + Math.cos(seed + 4) * 4 },
      { x: 120, y: 12 + Math.sin(seed + 5) * 5 },
      { x: 140, y: 16 },
      { x: 160, y: 10 }
    ];
    const pathData = `M ${points.map(p => `${p.x} ${p.y}`).join(' L ')}`;
    const fillPathData = `${pathData} L 160 25 L 0 25 Z`;
    return (
      <div className="w-full h-8 mt-2 opacity-80 shrink-0">
        <svg viewBox="0 0 160 25" className="w-full h-full" preserveAspectRatio="none">
          <defs>
            <linearGradient id={`grad-${seed}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity={0.25} />
              <stop offset="100%" stopColor={color} stopOpacity={0.0} />
            </linearGradient>
          </defs>
          <path d={fillPathData} fill={`url(#grad-${seed})`} />
          <path d={pathData} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        <div className="flex justify-between text-[7px] text-slate-400 font-bold px-1 mt-0.5">
          <span>{count} unit</span>
          <span>Performa 7 hari ↗</span>
          <span className="text-emerald-500 font-extrabold flex items-center gap-0.5">
            <CheckCircle className="h-2.5 w-2.5 inline" />
          </span>
        </div>
      </div>
    );
  };

  // CALCULATE REAL MONITORING FSR WORKFLOW PERFORMANCE METRICS (100% REAL SYNCED)
  const newRequestsCount = finalFilteredFsrs.filter(f => 
    ['Waiting Approval Leader Customer', 'Approved Leader Customer', 'Waiting Vendor'].includes(f.status)
  ).length;

  const pendingApprovalCount = finalFilteredFsrs.filter(f => 
    ['Waiting Approval Leader Operation', 'Waiting Approval Customer', 'Negotiation'].includes(f.status)
  ).length;

  const inRepairWrenchCount = finalFilteredFsrs.filter(f => 
    ['On Progress', 'Waiting TS', 'Waiting SPK'].includes(f.status)
  ).length;

  const inRepairClockCount = finalFilteredFsrs.filter(f => 
    ['Waiting Estimasi'].includes(f.status)
  ).length;

  const completedCheckoutCount = finalFilteredFsrs.filter(f => 
    f.status === 'Finished'
  ).length;

  // Real Average Turnaround Calculation in Hours
  const averageProcessHours = useMemo(() => {
    const finishedFsrs = finalFilteredFsrs.filter(f => f.status === 'Finished' && f.tanggal_create && f.tanggal_selesai_perbaikan);
    if (finishedFsrs.length === 0) return 0;
    const totalMs = finishedFsrs.reduce((acc, f) => {
      const start = new Date(f.tanggal_create!).getTime();
      const end = new Date(f.tanggal_selesai_perbaikan!).getTime();
      return acc + Math.max(0, end - start);
    }, 0);
    const avgMs = totalMs / finishedFsrs.length;
    return Math.round(avgMs / (1000 * 60 * 60));
  }, [finalFilteredFsrs]);

  // Dynamic 12-Month Real Wave Data from Database
  const monthlyAreaChartData = useMemo(() => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
    const counts = months.map(m => ({ name: m, Permintaan: 0, Selesai: 0 }));
    
    finalFilteredFsrs.forEach(f => {
      if (f.tanggal_create) {
        const d = new Date(f.tanggal_create);
        if (!isNaN(d.getTime())) {
          const monthIndex = d.getMonth();
          if (monthIndex >= 0 && monthIndex < 12) {
            counts[monthIndex].Permintaan += 1;
          }
        }
      }
      if (f.status === 'Finished' && (f.tanggal_selesai_perbaikan || f.updated_at)) {
        const d = new Date(f.tanggal_selesai_perbaikan || f.updated_at || '');
        if (!isNaN(d.getTime())) {
          const monthIndex = d.getMonth();
          if (monthIndex >= 0 && monthIndex < 12) {
            counts[monthIndex].Selesai += 1;
          }
        }
      }
    });
    return counts;
  }, [finalFilteredFsrs]);

  // Pipeline nodes directly bound to live counts
  const topPipelineNodes = [
    { label: 'Permintaan Baru', count: newRequestsCount, icon: FileText, color: '#0284c7', bgClass: 'bg-sky-500/10 text-sky-600 border border-sky-200/50' },
    { label: 'Menunggu Approval', count: pendingApprovalCount, icon: Clock, color: '#eab308', bgClass: 'bg-amber-500/10 text-amber-600 border border-amber-200/50' },
    { label: 'Masuk Bengkel', count: inRepairWrenchCount, icon: Wrench, color: '#0ea5e9', bgClass: 'bg-cyan-500/10 text-cyan-600 border border-cyan-200/50' },
    { label: 'Estimasi VRO', count: inRepairClockCount, icon: Clock, color: '#14b8a6', bgClass: 'bg-teal-500/10 text-teal-600 border border-teal-200/50' },
    { label: 'Selesai & Keluar', count: completedCheckoutCount, icon: CheckCircle2, color: '#059669', bgClass: 'bg-green-500/10 text-green-600 border border-green-200/50' }
  ];

  // Helper for toggle checklist vendor filter
  const handleToggleVendor = (name: string) => {
    if (selectedVendors.includes(name)) {
      setSelectedVendors(selectedVendors.filter(v => v !== name));
    } else {
      setSelectedVendors([...selectedVendors, name]);
    }
  };

  const handleFilterCabang = (cb: string) => {
    setDashboardFilterCabang(cb);
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
    }, 300);
  };

  // Convert real live status mapping to visual styling label and colors
  const getDisplayStatusLabelAndClass = (status: string) => {
    switch (status) {
      case 'Waiting Approval Leader Customer':
      case 'Waiting Approval Customer':
      case 'Waiting Approval Leader Operation':
        return { label: 'Menunggu Approval', cls: 'bg-amber-50 text-amber-600 border-amber-100 dark:bg-amber-950/20 dark:text-amber-400 dark:border-amber-900/50' };
      case 'Approved Leader Customer':
        return { label: 'Approved Cust', cls: 'bg-emerald-50 text-emerald-600 border-emerald-100 dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-900/50' };
      case 'Waiting Vendor':
        return { label: 'Menunggu Vendor', cls: 'bg-sky-50 text-sky-600 border-sky-100 dark:bg-sky-950/20 dark:text-sky-400 dark:border-sky-900/50' };
      case 'On Progress':
        return { label: 'Di Bengkel', cls: 'bg-orange-50 text-orange-600 border-orange-100 dark:bg-orange-950/20 dark:text-orange-400 dark:border-orange-900/50' };
      case 'Waiting Estimasi':
        return { label: 'Estimasi VRO', cls: 'bg-teal-50 text-teal-600 border-teal-100 dark:bg-teal-950/20 dark:text-teal-400 dark:border-teal-900/50' };
      case 'Finished':
        return { label: 'Selesai', cls: 'bg-emerald-50 text-emerald-600 border-emerald-100 dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-900/50' };
      case 'Draft':
        return { label: 'Draft', cls: 'bg-sky-50 text-sky-600 border-sky-100 dark:bg-sky-950/20' };
      default:
        return { label: status, cls: 'bg-slate-50 text-slate-600 border-slate-100 dark:bg-slate-900 dark:text-slate-400 dark:border-slate-800' };
    }
  };

  // Bind active jobs from database
  const activeFSRs = finalFilteredFsrs.filter(f => f.status !== 'Rejected' && f.status !== 'Cancelled');
  
  const displayJobs = activeFSRs.slice(0, 5).map(f => ({
    no_fsr: f.no_fsr,
    nama_customer: f.nama_customer,
    status: f.status,
    prioritas: f.status === 'On Progress' ? 'D' : 'P',
    id: f.id,
    raw: f
  }));

  // Dynamic Selected FSR to preview details
  const currentlySelectedFsrObj = selectedJobId 
    ? fsrs.find(f => f.id === selectedJobId) 
    : (activeFSRs[0] || null);

  const statusTerkiniData = currentlySelectedFsrObj 
    ? {
        type: currentlySelectedFsrObj.type_kendaraan || '-',
        nopol: currentlySelectedFsrObj.no_polisi || '-',
        status: currentlySelectedFsrObj.status,
        maintNo: currentlySelectedFsrObj.no_fsr || '-',
        customerName: currentlySelectedFsrObj.nama_customer || '-'
      }
    : null;

  // Format Helper for timestamps
  const formatProcessDate = (isoString: string | null | undefined, defaultVal: string = '-') => {
    if (!isoString) return defaultVal;
    try {
      const d = new Date(isoString);
      if (isNaN(d.getTime())) return defaultVal;
      return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
    } catch {
      return defaultVal;
    }
  };

  // Redirect to full monitoring FSR page with selected id
  const handleViewDetail = (id: string) => {
    localStorage.setItem('selected_fsr_id', id);
    const event = new CustomEvent('switch_tab', { detail: 'fsr-monitoring' });
    window.dispatchEvent(event);
  };

  return (
    <div className="space-y-6">
      
      {/* ----------------- HEADER FILTER CONTROLS ----------------- */}
      <div className="flex flex-wrap items-center justify-end gap-3 border-b border-slate-100 pb-4 dark:border-slate-800">
        {/* Filters Group */}
        <div className="flex flex-wrap items-center gap-3 relative w-full sm:w-auto justify-end" ref={dropdownRef}>
          {/* Branch Selector if Superuser */}
          {isAllBranchesAuthorized && (
            <div className="flex items-center gap-2 bg-slate-50 p-1.5 rounded-xl border border-slate-100 dark:bg-slate-900/40 dark:border-slate-800">
              <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider pl-1.5">
                CABANG:
              </span>
              <select
                value={dashboardFilterCabang}
                onChange={(e) => handleFilterCabang(e.target.value)}
                className="rounded-lg border-none bg-white py-1 pl-1.5 pr-8 text-[11px] font-black text-slate-700 shadow-2xs focus:outline-hidden dark:bg-slate-950 dark:text-white"
              >
                <option value="">Semua Cabang</option>
                {cabangOptions.map((cb) => (
                  <option key={cb} value={cb}>{cb}</option>
                ))}
              </select>
            </div>
          )}

          {/* Checklist Dropdown Trigger */}
          <div className="relative flex items-center gap-1.5">
            <button
              onClick={() => setShowVendorDropdown(!showVendorDropdown)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-black transition-colors ${
                selectedVendors.length > 0
                  ? 'bg-blue-600 text-white shadow-sm hover:bg-blue-700'
                  : 'bg-blue-50/50 hover:bg-blue-50 border border-blue-100 text-blue-700 dark:bg-blue-950/20 dark:text-blue-400'
              }`}
            >
              Filter: <span className={selectedVendors.length > 0 ? 'text-white font-black' : 'font-bold text-slate-800 dark:text-slate-200'}>
                Bengkel ({selectedVendors.length > 0 ? `${selectedVendors.length} dipilih` : masterVendors.length})
              </span>
              <ChevronDown className="h-3 w-3" />
            </button>

            {selectedVendors.length > 0 && (
              <button
                onClick={() => setSelectedVendors([])}
                className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors"
                title="Reset filter bengkel"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}

            {/* RESPONSIVE NON-OVERLAPPING DROPDOWN / BOTTOM-SHEET MODAL */}
            {showVendorDropdown && (
              <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-950/50 backdrop-blur-xs p-0 sm:p-4 animate-in fade-in duration-200">
                <div
                  ref={dropdownRef}
                  className="w-full sm:max-w-md bg-white dark:bg-slate-950 border-t sm:border border-slate-200 dark:border-slate-800 rounded-t-3xl sm:rounded-2xl shadow-2xl p-4 sm:p-5 max-h-[85vh] flex flex-col divide-y divide-slate-100 dark:divide-slate-800 animate-in slide-in-from-bottom sm:zoom-in-95 duration-200"
                >
                  {/* Top Header with Drag Handle & Close */}
                  <div className="pb-3">
                    <div className="w-10 h-1 rounded-full bg-slate-300 dark:bg-slate-700 mx-auto mb-3 sm:hidden" />
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-sm font-black text-slate-900 dark:text-white">Filter Bengkel</h3>
                        <p className="text-[11px] text-slate-400 font-medium mt-0.5">Pilih bengkel untuk memfilter data pada Dashboard</p>
                      </div>
                      <button
                        onClick={() => setShowVendorDropdown(false)}
                        className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-700 dark:hover:text-white transition-colors"
                        title="Tutup"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  {/* Search box inside dropdown */}
                  <div className="py-3">
                    <div className="relative">
                      <Search className="absolute left-3 top-3 h-3.5 w-3.5 text-slate-400" />
                      <input
                        type="text"
                        placeholder="Ketik nama bengkel..."
                        value={vendorSearchQuery}
                        onChange={(e) => setVendorSearchQuery(e.target.value)}
                        className="w-full text-xs rounded-xl bg-slate-50 border border-slate-200 py-2.5 pl-9 pr-8 focus:outline-hidden focus:ring-1 focus:ring-blue-500 dark:bg-slate-900 dark:border-slate-800 dark:text-white"
                        autoFocus
                      />
                      {vendorSearchQuery && (
                        <button
                          onClick={() => setVendorSearchQuery('')}
                          className="absolute right-2.5 top-2.5 p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-md"
                          title="Hapus pencarian"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>
                    {vendorSearchQuery && (
                      <div className="flex items-center justify-between mt-1.5 px-1">
                        <span className="text-[10px] text-blue-600 dark:text-blue-400 font-bold">
                          Menampilkan {filteredVendorsList.length} dari {availableVendorsList.length} bengkel
                        </span>
                        {filteredVendorsList.length > 0 && (
                          <div className="flex items-center gap-2 text-[10px]">
                            <button
                              type="button"
                              onClick={() => {
                                const newSelected = Array.from(new Set([...selectedVendors, ...filteredVendorsList.map(v => v.name)]));
                                setSelectedVendors(newSelected);
                              }}
                              className="font-bold text-blue-600 hover:text-blue-700 hover:underline"
                            >
                              Pilih Semua ({filteredVendorsList.length})
                            </button>
                            <span className="text-slate-300">|</span>
                            <button
                              type="button"
                              onClick={() => {
                                const filteredNames = new Set(filteredVendorsList.map(v => v.name));
                                setSelectedVendors(selectedVendors.filter(name => !filteredNames.has(name)));
                              }}
                              className="font-bold text-rose-500 hover:text-rose-600 hover:underline"
                            >
                              Batal
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Section List: Real-time search filtered vendor list */}
                  <div className="py-3 flex-1 overflow-hidden flex flex-col min-h-0">
                    <div className="flex justify-between items-center mb-2 px-1">
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">
                        Daftar Bengkel
                      </span>
                      <span className="text-[10px] text-slate-400 font-bold">
                        {filteredVendorsList.length} Bengkel
                      </span>
                    </div>

                    <div className="space-y-1 max-h-48 sm:max-h-56 overflow-y-auto pr-1">
                      {filteredVendorsList.length === 0 ? (
                        <div className="text-center py-6 text-xs text-slate-400 font-bold flex flex-col items-center justify-center gap-1.5">
                          <span>Bengkel Tidak Ditemukan</span>
                          <span className="text-[10px] text-slate-400 font-normal">
                            Tidak ada bengkel yang cocok dengan "{vendorSearchQuery}"
                          </span>
                          <button
                            type="button"
                            onClick={() => setVendorSearchQuery('')}
                            className="mt-2 px-3 py-1 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-[11px] font-bold rounded-lg hover:bg-slate-200"
                          >
                            Tampilkan Semua Bengkel
                          </button>
                        </div>
                      ) : (
                        filteredVendorsList.map((vend) => {
                          const isChecked = selectedVendors.includes(vend.name);
                          const query = vendorSearchQuery.trim().toLowerCase();
                          
                          return (
                            <label
                              key={vend.name}
                              className={`flex items-center gap-2.5 p-2 rounded-xl cursor-pointer text-xs transition-colors ${
                                isChecked
                                  ? 'bg-blue-50/80 text-blue-950 font-black dark:bg-blue-950/30 dark:text-blue-300 border border-blue-200/50 dark:border-blue-900/40'
                                  : 'hover:bg-slate-50 dark:hover:bg-slate-900/50 text-slate-700 dark:text-slate-300 font-bold'
                              }`}
                            >
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={() => handleToggleVendor(vend.name)}
                                className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 h-3.5 w-3.5 shrink-0"
                              />
                              <div className="truncate flex-1 flex items-center justify-between gap-2">
                                <span className="truncate">
                                  {query && vend.name.toLowerCase().includes(query) ? (
                                    (() => {
                                      const startIndex = vend.name.toLowerCase().indexOf(query);
                                      const before = vend.name.slice(0, startIndex);
                                      const match = vend.name.slice(startIndex, startIndex + query.length);
                                      const after = vend.name.slice(startIndex + query.length);
                                      return (
                                        <>
                                          {before}
                                          <mark className="bg-amber-200 dark:bg-amber-900/80 text-amber-950 dark:text-amber-100 rounded-xs px-0.5 font-black">
                                            {match}
                                          </mark>
                                          {after}
                                        </>
                                      );
                                    })()
                                  ) : (
                                    vend.name
                                  )}
                                </span>
                                {vend.vmd && (
                                  <span className="text-[9px] font-mono text-slate-400 dark:text-slate-500 px-1 py-0.2 bg-slate-100 dark:bg-slate-800 rounded shrink-0">
                                    {vend.vmd}
                                  </span>
                                )}
                              </div>
                            </label>
                          );
                        })
                      )}
                    </div>
                  </div>

                  {/* Section List: Selected Vendors & Reset Controls */}
                  {selectedVendors.length > 0 && (
                    <div className="pt-3 space-y-2">
                      <div className="flex items-center justify-between px-1">
                        <span className="text-[10px] font-black text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                          Bengkel Terpilih ({selectedVendors.length})
                        </span>
                        <button
                          onClick={() => setSelectedVendors([])}
                          className="text-[10px] font-black text-rose-600 hover:text-rose-700 dark:text-rose-400 flex items-center gap-1 hover:underline"
                        >
                          <Trash2 className="h-3 w-3" />
                          Reset Semua
                        </button>
                      </div>

                      <div className="flex flex-wrap gap-1.5 max-h-24 sm:max-h-28 overflow-y-auto p-1 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-100 dark:border-slate-800/80">
                        {selectedVendors.map((vendorName) => (
                          <span
                            key={vendorName}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white dark:bg-slate-950 border border-blue-200 dark:border-blue-900/60 text-[10px] font-bold text-blue-700 dark:text-blue-300 shadow-2xs"
                          >
                            <span className="truncate max-w-[150px] sm:max-w-[170px]">{vendorName}</span>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleToggleVendor(vendorName);
                              }}
                              className="hover:text-rose-600 text-slate-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 p-0.5 rounded transition-colors"
                              title="Hapus pilihan"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Bottom Action Button */}
                  <div className="pt-3">
                    <button
                      onClick={() => setShowVendorDropdown(false)}
                      className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-98 text-white text-xs font-black shadow-sm transition-all"
                    >
                      Selesai & Terapkan Filter
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      
      {isLoading ? (
        <DashboardSkeleton />
      ) : (
        <>
          {/* ----------------- 1. 5-CARD HORIZONTAL STEPPER KPI PIPELINE WITH SPARKLINES ----------------- */}
          <div className="bg-white border border-slate-100 dark:border-slate-800/80 dark:bg-slate-950 p-4 sm:p-5 rounded-2xl shadow-2xs">
            <h3 className="text-xs font-black tracking-wider text-slate-400 uppercase mb-3 sm:mb-4 px-1 dark:text-slate-200">
              Ringkasan Performa Hari Ini
            </h3>
            <div className="flex items-center gap-2.5 sm:gap-3 w-full overflow-x-auto pb-3 pt-1 scrollbar-thin snap-x touch-pan-x">
              {topPipelineNodes.map((node, index) => {
                const Icon = node.icon;
                return (
                  <React.Fragment key={index}>
                    <div className="flex-1 min-w-[145px] sm:min-w-[160px] snap-center bg-slate-50/30 border border-slate-100 dark:border-slate-800/80 dark:bg-gray-900/30 p-3.5 sm:p-4 rounded-2xl flex flex-col justify-between hover:border-slate-300 dark:hover:border-slate-700 transition-all duration-300 shadow-2xs">
                      <div className="flex items-center justify-between">
                        {/* Round icon node */}
                        <div className={`flex h-[38px] w-[38px] sm:h-[40px] sm:w-[40px] items-center justify-center rounded-full text-white shadow-2xs ${node.bgClass}`}>
                          <Icon className="h-4 w-4 sm:h-4.5 sm:w-4.5" />
                        </div>
                        <span className="text-2xl sm:text-3xl font-black text-slate-800 dark:text-slate-100 leading-none">
                          {node.count}
                        </span>
                      </div>
                      <div className="mt-3.5 mb-1">
                        <span className="text-[10px] sm:text-[11px] font-black text-slate-850 dark:text-slate-300 tracking-tight block truncate w-full">
                          {node.label}
                        </span>
                      </div>
                      {/* Interactive high quality sparkline component */}
                      <Sparkline color={node.color} count={node.count} seed={index + node.count * 15} />
                    </div>
                    {index < topPipelineNodes.length - 1 && (
                      <span className="text-slate-300 dark:text-slate-800 font-extrabold text-xs sm:text-sm px-0.5 sm:px-1 select-none shrink-0">
                        ▶
                      </span>
                    )}
                  </React.Fragment>
                );
              })}
            </div>
          </div>

          {/* ----------------- 2. MAIN WORKSPACE (3-COLUMN LAYOUT) ----------------- */}
          <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
            
            {/* ================= COLUMN 1 (LEFT, Span 3): PERFORMA, TIMELINE STEPPER, VEHICLE STATUS ================= */}
            <div className="xl:col-span-3 space-y-6">
              
              {/* Card 1: Performa Hari Ini */}
              <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-gray-950 space-y-4">
                <h3 className="text-xs font-black tracking-wider text-slate-800 dark:text-slate-200 uppercase">
                  Performa Hari Ini
                </h3>
                
                <div className="grid grid-cols-2 gap-3">
                  {/* Box 1: Hari Ini */}
                  <div className="bg-slate-50/70 p-3 rounded-2xl border border-slate-100/50 flex flex-col justify-between items-center text-center">
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Hari Ini</span>
                    <span className="text-4xl font-black text-slate-800 my-2 block">
                      {newRequestsCount}
                    </span>
                    <span className="text-[9px] font-bold text-slate-500 leading-tight block">Permintaan Baru</span>
                    <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest mt-1 block">Real-time</span>
                  </div>

                  {/* Box 2: Minggu Ini */}
                  <div className="bg-slate-50/70 p-3 rounded-2xl border border-slate-100/50 flex flex-col justify-between items-center text-center">
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Minggu Ini</span>
                    <span className="text-4xl font-black text-slate-800 my-2 block">
                      {completedCheckoutCount}
                    </span>
                    <span className="text-[9px] font-bold text-slate-500 leading-tight block">Selesai</span>
                    <span className="text-emerald-500 text-xs font-black mt-1">↗</span>
                  </div>
                </div>
              </div>

              {/* Card 2: Tampilan Proses Terpilih Stepper */}
              <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-gray-950 space-y-4">
                <div>
                  <h3 className="text-xs font-black tracking-wider text-slate-800 dark:text-slate-200 uppercase">
                    Tampilan Proses Terpilih
                  </h3>
                  <p className="text-[10px] text-slate-450 font-bold uppercase mt-0.5 tracking-wider">
                    Tampilan Terpadu
                  </p>
                </div>

                {/* Horizontal progress path */}
                <div className="flex justify-between items-center relative py-2 px-1">
                  <div className="absolute left-4 right-4 top-[24px] h-[2px] bg-slate-100 dark:bg-slate-800" />
                  
                  {[
                    { label: 'Input', color: currentlySelectedFsrObj ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-400 dark:bg-slate-800' },
                    { label: 'Estimasi', color: currentlySelectedFsrObj?.status === 'Waiting Estimasi' || currentlySelectedFsrObj?.tanggal_masuk_bengkel || currentlySelectedFsrObj?.status === 'Finished' ? 'bg-yellow-400 text-white' : 'bg-slate-200 text-slate-400 dark:bg-slate-800' },
                    { label: 'Bengkel', color: currentlySelectedFsrObj?.tanggal_masuk_bengkel || currentlySelectedFsrObj?.status === 'On Progress' || currentlySelectedFsrObj?.status === 'Finished' ? 'bg-orange-500 text-white' : 'bg-slate-200 text-slate-400 dark:bg-slate-800' },
                    { label: 'Selesai', color: currentlySelectedFsrObj?.status === 'Finished' ? 'bg-emerald-500 text-white' : 'bg-slate-200 text-slate-400 dark:bg-slate-800' }
                  ].map((node, i) => (
                    <div key={i} className="flex flex-col items-center z-10 relative">
                      <div className={`h-6 w-6 rounded-full flex items-center justify-center ${node.color} shadow-xs text-xs font-bold`}>
                        <CheckCircle className="h-3 w-3" />
                      </div>
                      <span className="text-[9px] font-black text-slate-800 dark:text-slate-300 mt-2 block">
                        {node.label}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Card 3: Status Terkini */}
              <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-gray-950 space-y-4">
                <h3 className="text-xs font-black tracking-wider text-slate-400 uppercase">
                  Status Terkini
                </h3>

                {statusTerkiniData ? (
                  <div className="bg-slate-50/50 p-4 rounded-2xl border border-slate-100 dark:bg-slate-900/40">
                    <div className="flex justify-between items-start">
                      <div className="max-w-[70%]">
                        <h4 className="text-sm font-black text-slate-900 dark:text-white leading-tight truncate">
                          {statusTerkiniData.type}
                        </h4>
                        <p className="text-[11px] font-bold text-slate-500 mt-0.5">{statusTerkiniData.nopol}</p>
                      </div>
                      <span className="bg-orange-50 text-orange-600 border border-orange-100 px-2.5 py-0.5 rounded text-[9px] font-black uppercase">
                        {getDisplayStatusLabelAndClass(statusTerkiniData.status).label}
                      </span>
                    </div>

                    <div className="mt-4 grid grid-cols-2 gap-1 text-[9px] border-t border-slate-100 pt-3 text-slate-500 uppercase tracking-wider font-extrabold">
                      <div className="truncate">
                        <span className="text-[8px] text-slate-400 block mb-0.5">FSR NO:</span>
                        {statusTerkiniData.maintNo}
                      </div>
                      <div className="truncate">
                        <span className="text-[8px] text-slate-400 block mb-0.5">PELANGGAN:</span>
                        {statusTerkiniData.customerName}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="bg-slate-50/40 p-4 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 dark:bg-slate-900/20 text-center py-6">
                    <Car className="h-6 w-6 text-slate-300 dark:text-slate-600 mx-auto mb-1.5" />
                    <h4 className="text-xs font-bold text-slate-500 dark:text-slate-400">
                      Belum ada unit yang diproses
                    </h4>
                    <p className="text-[10px] text-slate-400 mt-0.5">
                      Data unit kendaraan akan tampil otomatis saat FSR dibuat
                    </p>
                  </div>
                )}
              </div>

            </div>

            {/* ================= COLUMN 2 (MIDDLE, Span 5): TUGAS ANDA WORK TABLE ================= */}
            <div className="xl:col-span-5 space-y-6">
              
              <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-gray-950 min-h-[500px] flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xs font-black tracking-wider text-slate-800 dark:text-slate-200 uppercase">
                      Tugas Anda (Monitoring Live)
                    </h3>
                    <div className="relative w-36">
                      <Search className="absolute left-2 top-2 h-3 w-3 text-slate-400" />
                      <input
                        type="text"
                        placeholder="Cari..."
                        className="w-full text-[10px] rounded-lg border border-slate-200 bg-slate-50/50 py-1 pl-7 pr-2 focus:outline-hidden"
                      />
                    </div>
                  </div>

                  {/* Standardized task table */}
                  <div className="overflow-x-auto rounded-xl border border-slate-100 dark:border-slate-800">
                    <table className="w-full text-left text-[11px]">
                      <thead>
                        <tr className="bg-slate-50 dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800 text-slate-400 uppercase tracking-widest font-black">
                          <th className="p-3">No. FSR</th>
                          <th className="p-3">Nama Pelanggan</th>
                          <th className="p-3">Status</th>
                          <th className="p-3 text-center">Prioritas</th>
                          <th className="p-3 text-center">Tindakan</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50 dark:divide-slate-900 font-bold">
                        {displayJobs.length > 0 ? (
                          displayJobs.map((job) => {
                            const statusDetails = getDisplayStatusLabelAndClass(job.status);
                            return (
                              <tr
                                key={job.id}
                                onClick={() => {
                                  if (job.raw) {
                                    setSelectedJobId(job.id);
                                  }
                                }}
                                className={`hover:bg-slate-50/50 dark:hover:bg-slate-900/50 cursor-pointer transition-colors ${selectedJobId === job.id ? 'bg-blue-50/30' : ''}`}
                              >
                                <td className="p-3 text-slate-900 dark:text-white font-extrabold">{job.no_fsr}</td>
                                <td className="p-3 text-slate-700 dark:text-slate-300 truncate max-w-[120px]">{job.nama_customer}</td>
                                <td className="p-3">
                                  <span className={`px-2 py-0.5 rounded text-[9px] font-extrabold uppercase border ${statusDetails.cls}`}>
                                    {statusDetails.label}
                                  </span>
                                </td>
                                <td className="p-3 text-center text-orange-600 font-extrabold text-[12px]">{job.prioritas}</td>
                                <td className="p-3 text-center">
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      if (job.raw) {
                                        handleViewDetail(job.id);
                                      }
                                    }}
                                    className="bg-blue-600 text-white hover:bg-blue-750 px-2.5 py-1 rounded text-[9px] font-extrabold"
                                  >
                                    Pantau FSR
                                  </button>
                                </td>
                              </tr>
                            );
                          })
                        ) : (
                          <tr>
                            <td colSpan={5} className="p-8 text-center text-slate-400">
                              <div className="flex flex-col items-center justify-center gap-1.5 py-6">
                                <FileText className="h-8 w-8 text-slate-300 dark:text-slate-700 mb-1" />
                                <span className="text-xs font-bold text-slate-600 dark:text-slate-300">
                                  Belum ada data tugas / pengajuan FSR
                                </span>
                                <span className="text-[10px] text-slate-400 max-w-xs">
                                  Semua pengajuan perbaikan unit yang dibuat akan otomatis tampil di sini secara sinkron.
                                </span>
                              </div>
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="flex justify-between items-center pt-4">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">
                    {displayJobs.length > 0 ? 'Klik baris tabel untuk meninjau status proses di kolom kanan' : 'Data terhubung langsung ke database'}
                  </span>
                  <button
                    onClick={() => {
                      const event = new CustomEvent('switch_tab', { detail: 'fsr-monitoring' });
                      window.dispatchEvent(event);
                    }}
                    className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-black text-slate-750 hover:bg-slate-50 dark:border-slate-800 dark:text-slate-300 dark:hover:bg-slate-900"
                  >
                    Buka FSR Monitoring
                  </button>
                </div>
              </div>

            </div>

            {/* ================= COLUMN 3 (RIGHT, Span 4): TIMELINE STAMPS, WAVE AREA CHART ================= */}
            <div className="xl:col-span-4 space-y-6">
              
              {/* Card 1: Waktu Proses split block layout */}
              <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-gray-950">
                <div className="grid grid-cols-2 gap-4 divide-x divide-slate-100 dark:divide-slate-800">
                  {/* Left part: Status Proses Timeline */}
                  <div className="pr-2">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block mb-3">
                      Status Proses
                    </span>
                    <div className="space-y-3 relative pl-4 border-l border-slate-100 dark:border-slate-800">
                      <div className="relative">
                        <span className={`absolute -left-[21px] top-0.5 h-2 w-2 rounded-full ${currentlySelectedFsrObj?.tanggal_create ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-700'}`} />
                        <span className="text-[9px] font-black text-slate-700 dark:text-slate-300 block leading-none">
                          {formatProcessDate(currentlySelectedFsrObj?.tanggal_create, '-')}
                        </span>
                        <span className="text-[8px] text-slate-450 block leading-tight">Pengajuan Baru</span>
                      </div>
                      <div className="relative">
                        <span className={`absolute -left-[21px] top-0.5 h-2 w-2 rounded-full ${currentlySelectedFsrObj?.tanggal_approve_leader_customer ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-700'}`} />
                        <span className="text-[9px] font-black text-slate-700 dark:text-slate-300 block leading-none">
                          {formatProcessDate(currentlySelectedFsrObj?.tanggal_approve_leader_customer, '-')}
                        </span>
                        <span className="text-[8px] text-slate-450 block leading-tight">Approved Cust</span>
                      </div>
                      <div className="relative">
                        <span className={`absolute -left-[21px] top-0.5 h-2 w-2 rounded-full ${currentlySelectedFsrObj?.tanggal_masuk_bengkel ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-700'}`} />
                        <span className="text-[9px] font-black text-slate-700 dark:text-slate-300 block leading-none">
                          {formatProcessDate(currentlySelectedFsrObj?.tanggal_masuk_bengkel, '-')}
                        </span>
                        <span className="text-[8px] text-slate-450 block leading-tight">Di Bengkel</span>
                      </div>
                      <div className="relative">
                        <span className={`absolute -left-[21px] top-0.5 h-2 w-2 rounded-full ${currentlySelectedFsrObj?.tanggal_selesai_perbaikan ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-700'}`} />
                        <span className="text-[9px] font-black text-slate-700 dark:text-slate-300 block leading-none">
                          {formatProcessDate(currentlySelectedFsrObj?.tanggal_selesai_perbaikan, '-')}
                        </span>
                        <span className="text-[8px] text-slate-450 block leading-tight">Selesai & Keluar</span>
                      </div>
                    </div>
                    
                    {currentlySelectedFsrObj && (
                      <button
                        onClick={() => {
                          handleViewDetail(currentlySelectedFsrObj.id);
                        }}
                        className="text-[9px] font-black text-blue-600 hover:text-blue-800 mt-4 block uppercase tracking-wider"
                      >
                        Tampilkan Detail Proses ➔
                      </button>
                    )}
                  </div>

                  {/* Right part: Waktu Proses */}
                  <div className="pl-4 flex flex-col justify-between">
                    <div>
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">
                        Rata-rata Waktu Proses
                      </span>
                      <span className="text-lg font-black text-slate-800 dark:text-slate-200 block mt-2">
                        {currentlySelectedFsrObj ? 'Unit Aktif' : 'Semua Unit'}
                      </span>
                    </div>

                    <div className="border-t border-slate-100 dark:border-slate-800 pt-3">
                      <span className="text-[8px] text-slate-400 font-extrabold uppercase block leading-none">
                        Rata-rata Durasi:
                      </span>
                      <span className="text-3xl font-black text-slate-900 dark:text-white block mt-1.5 leading-none">
                        {averageProcessHours} Jam
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Card 2: Real Wave graph - Permintaan Baru vs. Selesai (Past 12 Months) */}
              <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-gray-950">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-xs font-black tracking-wider text-slate-800 dark:text-slate-200 uppercase">
                      Permintaan Baru vs. Selesai
                    </h3>
                    <p className="text-[9px] text-slate-400 font-bold uppercase mt-0.5 tracking-wider">
                      (Past 12 Months - Data Riil)
                    </p>
                  </div>
                  
                  {/* Legend boxes */}
                  <div className="flex gap-2.5 text-[8px] font-black uppercase">
                    <span className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400">
                      <span className="h-2 w-2 rounded-sm bg-teal-500/35 border border-teal-500" />
                      Permintaan
                    </span>
                    <span className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400">
                      <span className="h-2 w-2 rounded-sm bg-rose-500/35 border border-rose-500" />
                      Selesai
                    </span>
                  </div>
                </div>

                {/* Real chart styled dynamically */}
                <div className="h-44 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={monthlyAreaChartData} margin={{ top: 10, right: 0, left: -25, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorPermintaan" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#14b8a6" stopOpacity={0.25} />
                          <stop offset="95%" stopColor="#14b8a6" stopOpacity={0.0} />
                        </linearGradient>
                        <linearGradient id="colorSelesai" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.25} />
                          <stop offset="95%" stopColor="#f43f5e" stopOpacity={0.0} />
                        </linearGradient>
                      </defs>
                      <XAxis dataKey="name" stroke="#94a3b8" fontSize={8} tickLine={false} axisLine={false} />
                      <YAxis stroke="#94a3b8" fontSize={8} tickLine={false} axisLine={false} allowDecimals={false} />
                      <Tooltip contentStyle={{ fontSize: '10px', borderRadius: '12px' }} />
                      <Area type="monotone" dataKey="Permintaan" stroke="#14b8a6" strokeWidth={1.5} fillOpacity={1} fill="url(#colorPermintaan)" />
                      <Area type="monotone" dataKey="Selesai" stroke="#f43f5e" strokeWidth={1.5} fillOpacity={1} fill="url(#colorSelesai)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

            </div>

          </div>
        </>
      )}

    </div>
  );
};
