/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import {
  X,
  Clock,
  CheckCircle,
  FileCheck,
  AlertTriangle,
  User,
  Wrench,
  Truck,
  FileText,
  DollarSign,
  Plus,
  Trash2,
  Calendar,
  Search,
  Eye,
  ExternalLink,
  Download,
  Edit3,
  Play,
  CheckCircle2
} from 'lucide-react';
import { localDb } from '../db/localDb';
import { Fsr, FsrHistory, EstimasiItem, UserRole, Vendor } from '../types';
import { useTheme } from './ThemeContext';
import { uploadToGoogleDrive, isImageUrl, isPdfUrl, getImgSrcUrl, getEmbedUrl, getDownloadUrl, compressImageIfNecessary } from '../utils/googleDrive';
import { Loader2 } from 'lucide-react';

interface FsrDetailProps {
  fsrId: string;
  onClose: () => void;
  onWorkflowProcessed: () => void;
}

export const FsrDetail: React.FC<FsrDetailProps> = ({ fsrId, onClose, onWorkflowProcessed }) => {
  const { currentUser } = useTheme();
  const [fsr, setFsr] = useState<Fsr | null>(null);
  const [history, setHistory] = useState<FsrHistory[]>([]);
  const [estimations, setEstimations] = useState<EstimasiItem[]>([]);
  const [vendorsList, setVendorsList] = useState<Vendor[]>([]);

  // Workflow Form Elements
  const [catatan, setCatatan] = useState('');
  const [selectedVendor, setSelectedVendor] = useState('');
  const [selectedVmd, setSelectedVmd] = useState('');
  const [vendorSearch, setVendorSearch] = useState('');
  const [isVendorDropdownOpen, setIsVendorDropdownOpen] = useState(false);
  const [spkNo, setSpkNo] = useState('');
  const [isInternal, setIsInternal] = useState(false);
  const [selectedTsName, setSelectedTsName] = useState('');

  // Edit Vendor & SPK Modal state
  const [isEditVendorModalOpen, setIsEditVendorModalOpen] = useState(false);
  const [editVendorName, setEditVendorName] = useState('');
  const [editVmdNumber, setEditVmdNumber] = useState('');
  const [editSpkNo, setEditSpkNo] = useState('');
  const [isEditVendorDropdownOpen, setIsEditVendorDropdownOpen] = useState(false);
  const [editVendorSearch, setEditVendorSearch] = useState('');

  // Lightbox preview state
  const [activePreviewFile, setActivePreviewFile] = useState<{ name: string; url: string } | null>(null);

  // Own Risk (OR) state for Body Repair
  const [biayaOr, setBiayaOr] = useState('');
  const [orFile, setOrFile] = useState<{ name: string; url: string } | null>(null);
  const [orDragActive, setOrDragActive] = useState(false);
  const [isUploadingOrFile, setIsUploadingOrFile] = useState(false);
  const [orFileUploadError, setOrFileUploadError] = useState('');
  const [orFileUploadInfo, setOrFileUploadInfo] = useState('');
  const orFileInputRef = React.useRef<HTMLInputElement>(null);

  // Vendor upload state
  const [vendorFile, setVendorFile] = useState<{ name: string; url: string } | null>(null);
  const [vendorDragActive, setVendorDragActive] = useState(false);
  const [isUploadingVendorFile, setIsUploadingVendorFile] = useState(false);
  const [vendorFileUploadError, setVendorFileUploadError] = useState('');
  const [vendorFileUploadInfo, setVendorFileUploadInfo] = useState('');
  const vendorFileInputRef = React.useRef<HTMLInputElement>(null);

  // Custom workflow progress and completion dates for Body Repair
  const [tanggalMasukBengkel, setTanggalMasukBengkel] = useState('');
  const [tanggalSelesaiPerbaikan, setTanggalSelesaiPerbaikan] = useState('');
  const [catatanMulaiPekerjaan, setCatatanMulaiPekerjaan] = useState('');
  const [catatanSelesaiPekerjaan, setCatatanSelesaiPekerjaan] = useState('');

  // Estimasi construction state
  const [estDesc, setEstDesc] = useState('');
  const [estPrice, setEstPrice] = useState('');
  const [estQty, setEstQty] = useState('1');
  const [estItems, setEstItems] = useState<Partial<EstimasiItem>[]>([]);

  const loadFsrData = () => {
    const item = localDb.getFsrById(fsrId, currentUser);
    if (item) {
      setFsr(item);
      setHistory(localDb.getFsrHistory(fsrId));
      setEstimations(localDb.getEstimations(fsrId));
      if (item.nama_vendor) setSelectedVendor(item.nama_vendor);
      if (item.no_vmd) setSelectedVmd(item.no_vmd);
      if (item.no_spk) setSpkNo(item.no_spk);
      if (item.catatan_mulai_pekerjaan) setCatatanMulaiPekerjaan(item.catatan_mulai_pekerjaan);
      if (item.catatan_selesai_pekerjaan) setCatatanSelesaiPekerjaan(item.catatan_selesai_pekerjaan);
    } else {
      setFsr(null);
    }
  };

  useEffect(() => {
    loadFsrData();
    setVendorsList(localDb.getVendors());
    setVendorSearch('');
    setIsVendorDropdownOpen(false);
    setBiayaOr('');
    setOrFile(null);
    setOrDragActive(false);
    setVendorFile(null);
    setVendorDragActive(false);
    setVendorFileUploadError('');

    // Initialize default local date-time strings
    try {
      const tzoffset = (new Date()).getTimezoneOffset() * 60000;
      const localISOTime = (new Date(Date.now() - tzoffset)).toISOString().slice(0, 16);
      setTanggalMasukBengkel(localISOTime);
      setTanggalSelesaiPerbaikan(localISOTime);
    } catch (e) {
      // Fallback
      setTanggalMasukBengkel('');
      setTanggalSelesaiPerbaikan('');
    }
  }, [fsrId]);

  // Filter TS internal list by FSR branch (Must be declared before any conditional returns)
  const availableTsList = useMemo(() => {
    if (!fsr) return [];
    const users = localDb.getUsers().filter((u) => u.role_operation === 'TS' && u.status === 'Active');
    return users.filter((u) => localDb.isBranchMatching(u.cabang_handling, fsr.cabang));
  }, [fsr?.cabang]);

  if (!fsr) {
    return (
      <div className="flex flex-col h-64 items-center justify-center p-6 text-center">
        <p className="text-xs font-semibold text-gray-500 dark:text-gray-400">
          Data FSR tidak ditemukan atau Anda tidak memiliki akses untuk melihat pengajuan ini.
        </p>
        <button
          type="button"
          onClick={onClose}
          className="mt-4 px-4 py-1.5 text-xs font-bold rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200"
        >
          Tutup
        </button>
      </div>
    );
  }

  // Helper to format work duration
  const formatDuration = (startStr?: string | null, endStr?: string | null) => {
    if (!startStr || !endStr) return '-';
    try {
      const diffMs = Math.max(0, new Date(endStr).getTime() - new Date(startStr).getTime());
      const diffHrs = Math.floor(diffMs / (1000 * 60 * 60));
      const diffMins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
      if (diffHrs === 0) return `${diffMins} Menit`;
      return `${diffHrs} Jam ${diffMins} Menit`;
    } catch {
      return '-';
    }
  };

  // Determine active workflow path for visual representation
  const isMaintenance = fsr.kategori_layanan === 'Maintenance';
  const isBodyRepair = fsr.kategori_layanan === 'Body Repair';
  const isDocument = fsr.kategori_layanan === 'Document';
  const isInternalWork = !fsr.nama_vendor && !!fsr.nama_ts || isInternal || currentUser.role_operation === 'TS';

  // Filter vendor list by search term
  const filteredVendors = vendorsList.filter((v) =>
    v.nama_vendor.toLowerCase().includes(vendorSearch.toLowerCase())
  );

  // Helper status color badge
  const getStatusBadge = (status: string) => {
    const base = "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-bold ";
    switch (status) {
      case 'Waiting Approval Leader Customer':
        return base + "bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-400";
      case 'Approved Leader Customer':
        return base + "bg-blue-100 text-blue-800 dark:bg-blue-950/40 dark:text-blue-400";
      case 'Waiting Vendor':
      case 'Waiting TS':
        return base + "bg-purple-100 text-purple-800 dark:bg-purple-950/40 dark:text-purple-400";
      case 'Waiting SPK':
        return base + "bg-indigo-100 text-indigo-800 dark:bg-indigo-950/40 dark:text-indigo-400";
      case 'Waiting Estimasi':
        return base + "bg-yellow-100 text-yellow-800 dark:bg-yellow-950/40 dark:text-yellow-400";
      case 'Waiting Approval Leader Operation':
      case 'Waiting Approval Customer':
        return base + "bg-teal-100 text-teal-800 dark:bg-teal-950/40 dark:text-teal-400";
      case 'Negotiation':
        return base + "bg-orange-100 text-orange-800 dark:bg-orange-950/40 dark:text-orange-400";
      case 'On Progress':
        return base + "bg-sky-100 text-sky-800 dark:bg-sky-950/40 dark:text-sky-400";
      case 'Finished':
        return base + "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-400";
      case 'Rejected':
      case 'Cancelled':
        return base + "bg-red-100 text-red-800 dark:bg-red-950/40 dark:text-red-400";
      default:
        return base + "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300";
    }
  };

  const processOrFile = async (file: File) => {
    setIsUploadingOrFile(true);
    setOrFileUploadError('');
    setOrFileUploadInfo('');
    try {
      const { base64DataUrl, wasCompressed } = await compressImageIfNecessary(file);
      let uploadName = file.name;
      if (wasCompressed && !uploadName.toLowerCase().endsWith('.jpg') && !uploadName.toLowerCase().endsWith('.jpeg')) {
        const baseName = uploadName.substring(0, uploadName.lastIndexOf('.')) || uploadName;
        uploadName = `${baseName}_compressed.jpg`;
      }

      const res = await uploadToGoogleDrive(uploadName, base64DataUrl);
      setOrFile({
        name: uploadName,
        url: res.fileUrl || res.downloadUrl || base64DataUrl
      });
      if (res.success) {
        if (res.message) {
          setOrFileUploadInfo(res.message);
        }
      } else {
        setOrFileUploadError(res.message || 'Gagal mengunggah ke Google Drive.');
      }
    } catch (err: any) {
      console.warn('Own Risk Upload Info (using local storage fallback):', err.message || err);
      setOrFileUploadError('Koneksi Apps Script terputus. Disimpan secara lokal.');
      
      const fallbackUrl = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.readAsDataURL(file);
      });
      setOrFile({
        name: file.name,
        url: fallbackUrl
      });
    } finally {
      setIsUploadingOrFile(false);
    }
  };

  const processVendorFile = async (file: File) => {
    setIsUploadingVendorFile(true);
    setVendorFileUploadError('');
    setVendorFileUploadInfo('');
    try {
      const { base64DataUrl, wasCompressed } = await compressImageIfNecessary(file);
      let uploadName = file.name;
      if (wasCompressed && !uploadName.toLowerCase().endsWith('.jpg') && !uploadName.toLowerCase().endsWith('.jpeg')) {
        const baseName = uploadName.substring(0, uploadName.lastIndexOf('.')) || uploadName;
        uploadName = `${baseName}_compressed.jpg`;
      }

      const res = await uploadToGoogleDrive(uploadName, base64DataUrl);
      setVendorFile({
        name: uploadName,
        url: res.fileUrl || res.downloadUrl || base64DataUrl
      });
      if (res.success) {
        if (res.message) {
          setVendorFileUploadInfo(res.message);
        }
      } else {
        setVendorFileUploadError(res.message || 'Gagal mengunggah ke Google Drive.');
      }
    } catch (err: any) {
      console.warn('Vendor Estimation Upload Info (using local storage fallback):', err.message || err);
      setVendorFileUploadError('Koneksi Apps Script terputus. Disimpan secara lokal.');
      
      const fallbackUrl = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.readAsDataURL(file);
      });
      setVendorFile({
        name: file.name,
        url: fallbackUrl
      });
    } finally {
      setIsUploadingVendorFile(false);
    }
  };

  // Stepper representation based on current state
  const getStepperSteps = () => {
    // For Body Repair, TS role, or internal maintenance: omit Estimasi Biaya step
    if (fsr.kategori_layanan === 'Body Repair' || currentUser.role_operation === 'TS' || isInternalWork) {
      return [
        { name: 'Pengajuan', done: true },
        { name: 'Approve Leader', done: !!fsr.tanggal_approve_leader_customer },
        { name: 'Alokasi SPK', done: !!fsr.tanggal_proses },
        { name: 'Pengerjaan', done: fsr.status === 'On Progress' || fsr.status === 'Finished' },
        { name: 'Selesai', done: fsr.status === 'Finished' }
      ];
    }
    const steps = [
      { name: 'Pengajuan', done: true },
      { name: 'Approve Leader', done: !!fsr.tanggal_approve_leader_customer },
      { name: 'Alokasi SPK', done: !!fsr.tanggal_proses },
      { name: 'Estimasi Biaya', done: !!fsr.estimasi_biaya },
      { name: 'Pengerjaan', done: fsr.status === 'On Progress' || fsr.status === 'Finished' },
      { name: 'Selesai', done: fsr.status === 'Finished' }
    ];
    return steps;
  };

  const handleAction = async (
    action: 'APPROVE_LEADER_CUST' | 'REJECT_LEADER_CUST' | 'CANCEL_LEADER_CUST' | 'ASSIGN_VENDOR_SPK' | 'SUBMIT_ESTIMASI' | 'APPROVE_LEADER_OPS' | 'APPROVE_EST_CUST' | 'NEGOTIATE_EST' | 'MASUK_BENGKEL' | 'SELESAI_PERBAIKAN'
  ) => {
    try {
      let payload: any = { catatan };
      
      if (action === 'ASSIGN_VENDOR_SPK') {
        payload.vendor_name = selectedVendor;
        payload.no_vmd = selectedVmd;
        payload.no_spk = spkNo;
        payload.is_internal = isInternal;
        if (isInternal) {
          payload.nama_ts = selectedTsName || (availableTsList.length > 0 ? availableTsList[0].nama : `TS Internal (${fsr.cabang || 'Cabang'})`);
        }

        if (isBodyRepair) {
          payload.biaya_estimasi_or = biayaOr ? Number(biayaOr) : null;
          payload.estimasi_or_url = orFile ? orFile.url : null;
          payload.estimasi_or_name = orFile ? orFile.name : null;
        }
      }

      if (action === 'SUBMIT_ESTIMASI') {
        const total = estItems.reduce((s, item) => s + (item.total || 0), 0);
        payload.estimasi_biaya = total;
        payload.items = estItems.map(item => ({
          ...item,
          fsr_id: fsrId,
          id: item.id || Math.random().toString(36).substr(2, 9)
        }));
        payload.estimasi_vendor_url = vendorFile ? vendorFile.url : null;
        payload.estimasi_vendor_name = vendorFile ? vendorFile.name : null;
      }

      if (action === 'MASUK_BENGKEL') {
        payload.tanggal_masuk_bengkel = new Date().toISOString();
        payload.catatan_mulai_pekerjaan = catatanMulaiPekerjaan || catatan || null;
      }

      if (action === 'SELESAI_PERBAIKAN') {
        payload.tanggal_selesai_perbaikan = new Date().toISOString();
        payload.catatan_selesai_pekerjaan = catatanSelesaiPekerjaan || catatan || null;
      }

      await localDb.processFsrWorkflow(fsrId, action, payload, currentUser);
      setCatatan('');
      setEstItems([]);
      loadFsrData();
      onWorkflowProcessed();
    } catch (err: any) {
      alert(err.message || 'Gagal memproses workflow');
    }
  };

  // Helper for adding estimation row
  const addEstRow = () => {
    if (!estDesc || !estPrice) return;
    const price = Number(estPrice);
    const qty = Number(estQty) || 1;
    const newRow: Partial<EstimasiItem> = {
      id: Math.random().toString(),
      deskripsi: estDesc,
      biaya: price,
      qty: qty,
      total: price * qty
    };
    setEstItems([...estItems, newRow]);
    setEstDesc('');
    setEstPrice('');
    setEstQty('1');
  };

  const removeEstRow = (id?: string) => {
    setEstItems(estItems.filter(item => item.id !== id));
  };

  return (
    <div className="rounded-2xl border border-gray-100 bg-white shadow-xl dark:border-gray-800 dark:bg-gray-950 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-gray-100 bg-gray-50/50 px-6 py-4 dark:border-gray-800 dark:bg-gray-900/30">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-600 text-white font-bold">
            {fsr.kategori_layanan[0]}
          </div>
          <div>
            <h3 className="text-sm font-bold text-gray-800 dark:text-gray-200">
              {fsr.no_fsr}
            </h3>
            <p className="text-[10px] text-gray-400">
              Kategori: <span className="font-semibold text-gray-500">{fsr.kategori_layanan} - {fsr.jenis_layanan}</span>
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className={getStatusBadge(fsr.status)}>{fsr.status}</span>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            <X className="h-4.5 w-4.5" />
          </button>
        </div>
      </div>

      {/* Stepper progress */}
      <div className="border-b border-gray-100 bg-white/50 px-6 py-4 dark:border-gray-800 dark:bg-gray-950/20">
        <div className="flex flex-wrap items-center justify-between gap-2">
          {getStepperSteps().map((st, idx) => (
            <div key={idx} className="flex items-center gap-2">
              <div
                className={`flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-bold ${
                  st.done
                    ? 'bg-emerald-500 text-white'
                    : 'bg-gray-100 text-gray-400 dark:bg-gray-800 dark:text-gray-500'
                }`}
              >
                {st.done ? '✓' : idx + 1}
              </div>
              <span className={`text-[10px] font-semibold ${st.done ? 'text-gray-800 dark:text-gray-200' : 'text-gray-400'}`}>
                {st.name}
              </span>
              {idx < getStepperSteps().length - 1 && <span className="hidden sm:inline text-gray-200 dark:text-gray-800">→</span>}
            </div>
          ))}
        </div>
      </div>

      {/* Scrollable Core Details content */}
      <div className="max-h-[70vh] overflow-y-auto p-6 space-y-6">
        {/* Core FSR fields bento details */}
        <div className="grid gap-6 md:grid-cols-2">
          <div className="space-y-4 rounded-xl border border-gray-100 bg-gray-50/30 p-4 dark:border-gray-800 dark:bg-gray-900/10">
            <h4 className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">
              1. Informasi Pelanggan & Unit
            </h4>
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <span className="text-gray-400 block text-[10px]">Nama Customer</span>
                <span className="font-bold text-gray-800 dark:text-gray-200">{fsr.nama_customer}</span>
              </div>
              <div>
                <span className="text-gray-400 block text-[10px]">PIC Pembuat</span>
                <span className="font-semibold text-gray-800 dark:text-gray-200">{fsr.nama_pic_customer}</span>
              </div>
              <div>
                <span className="text-gray-400 block text-[10px]">Cabang</span>
                <span className="font-semibold text-gray-800 dark:text-gray-200">{fsr.cabang}</span>
              </div>
              <div>
                <span className="text-gray-400 block text-[10px]">No Polisi Unit</span>
                <span className="font-bold text-blue-600 dark:text-blue-400">{fsr.no_polisi}</span>
              </div>
              <div>
                <span className="text-gray-400 block text-[10px]">KM Kendaraan</span>
                <span className="font-semibold text-gray-800 dark:text-gray-200">{fsr.km_pengajuan.toLocaleString()} KM</span>
              </div>
              <div>
                <span className="text-gray-400 block text-[10px]">Tipe Kendaraan</span>
                <span className="font-medium text-gray-800 dark:text-gray-200 truncate block">{fsr.type_kendaraan}</span>
              </div>
            </div>
          </div>

          <div className="space-y-4 rounded-xl border border-gray-100 bg-gray-50/30 p-4 dark:border-gray-800 dark:bg-gray-900/10">
            <h4 className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">
              2. Kebutuhan Pekerjaan & SPK
            </h4>
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <span className="text-gray-400 block text-[10px]">Tanggal Pengajuan</span>
                <span className="font-semibold text-gray-800 dark:text-gray-200">
                  {new Date(fsr.tanggal_create).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                </span>
              </div>
              <div>
                <div className="flex items-center justify-between gap-1">
                  <span className="text-gray-400 block text-[10px]">SPK Penugasan</span>
                  {(currentUser?.role_operation === 'SA' || currentUser?.role_operation === 'SS' || currentUser?.role_operation === 'VRO' || currentUser?.role_operation === 'Super Admin') && (
                    <button
                      type="button"
                      onClick={() => {
                        setEditVendorName(fsr.nama_vendor || '');
                        setEditVmdNumber(fsr.no_vmd || '');
                        setEditSpkNo(fsr.no_spk || '');
                        setIsEditVendorModalOpen(true);
                      }}
                      className="text-[10px] text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 font-semibold"
                    >
                      <Edit3 className="h-3 w-3" /> Edit SPK
                    </button>
                  )}
                </div>
                <span className="font-mono font-bold text-gray-800 dark:text-gray-200 block mt-0.5">{fsr.no_spk || '-'}</span>
              </div>
              <div>
                <div className="flex items-center justify-between gap-1">
                  <span className="text-gray-400 block text-[10px]">Pihak Pelaksana</span>
                  {(currentUser?.role_operation === 'SA' || currentUser?.role_operation === 'SS' || currentUser?.role_operation === 'VRO' || currentUser?.role_operation === 'Super Admin') && (
                    <button
                      type="button"
                      onClick={() => {
                        setEditVendorName(fsr.nama_vendor || '');
                        setEditVmdNumber(fsr.no_vmd || '');
                        setEditSpkNo(fsr.no_spk || '');
                        setIsEditVendorModalOpen(true);
                      }}
                      className="text-[10px] text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 font-semibold"
                    >
                      <Edit3 className="h-3 w-3" /> Edit Vendor/VMD
                    </button>
                  )}
                </div>
                <span className="font-semibold text-gray-800 dark:text-gray-200 block mt-0.5">
                  {fsr.nama_vendor ? (
                    <span className="inline-flex items-center gap-1.5 flex-wrap">
                      <span>{fsr.nama_vendor}</span>
                      {fsr.no_vmd && (
                        <span className="inline-flex items-center rounded-md bg-blue-50 dark:bg-blue-950/50 px-1.5 py-0.5 text-[10px] font-mono font-bold text-blue-700 dark:text-blue-300 ring-1 ring-inset ring-blue-700/10">
                          VMD: {fsr.no_vmd}
                        </span>
                      )}
                    </span>
                  ) : (
                    fsr.nama_ts || '-'
                  )}
                </span>
              </div>
              <div>
                <span className="text-gray-400 block text-[10px]">Keterangan FSR</span>
                <span className="text-gray-600 dark:text-gray-400 block mt-0.5 leading-relaxed">{fsr.keterangan}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Attachment Image Viewer if exists */}
        {fsr.document_url && (
          <div className="rounded-xl border border-gray-100 p-4 dark:border-gray-800 bg-white dark:bg-gray-950/20">
            <h4 className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-2">
              Dokumen Pendukung
            </h4>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-gray-50 dark:bg-gray-900/40 p-3 rounded-lg border border-gray-100/50 dark:border-gray-800/50">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 text-blue-600 dark:bg-blue-900/20">
                  <FileText className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-bold text-gray-800 dark:text-gray-200 truncate max-w-[200px]">{fsr.document_name || 'attachment.jpg'}</p>
                  <p className="text-[10px] text-gray-400">
                    {fsr.document_url.startsWith('data:') ? 'Disimpan Lokal (Base64)' : 'Tersimpan di Google Drive'}
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setActivePreviewFile({ name: fsr.document_name || 'attachment.jpg', url: fsr.document_url! })}
                  className="inline-flex items-center gap-1 bg-blue-50 hover:bg-blue-100 text-blue-700 dark:bg-blue-950/50 dark:hover:bg-blue-900/50 dark:text-blue-300 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors"
                >
                  <Eye className="h-3.5 w-3.5" /> Lihat Preview
                </button>
              </div>
            </div>

            {/* Direct Inline Image Preview */}
            {isImageUrl(fsr.document_url, fsr.document_name || '') && (
              <div className="mt-3 relative group rounded-lg overflow-hidden border border-gray-200 dark:border-gray-800 shadow-xs max-h-64 flex items-center justify-center bg-gray-50 dark:bg-gray-900">
                <img
                  src={getImgSrcUrl(fsr.document_url)}
                  alt="FSR Attachment"
                  className="max-h-64 object-contain w-full cursor-pointer hover:opacity-95 transition-opacity"
                  onClick={() => setActivePreviewFile({ name: fsr.document_name || 'attachment.jpg', url: fsr.document_url! })}
                  referrerPolicy="no-referrer"
                />
                <div className="absolute top-2 right-2 bg-black/60 text-white rounded-full p-1.5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                  <Eye className="h-4 w-4" />
                </div>
              </div>
            )}

            {/* Direct Inline PDF Preview */}
            {isPdfUrl(fsr.document_url, fsr.document_name || '') && (
              <div className="mt-3 border border-gray-200 dark:border-gray-800 rounded-lg overflow-hidden bg-gray-50 dark:bg-gray-900 h-64 relative group">
                <iframe
                  src={getEmbedUrl(fsr.document_url)}
                  className="w-full h-full border-none pointer-events-none"
                  title="PDF Preview"
                ></iframe>
                <div className="absolute inset-0 bg-black/5 flex items-center justify-center">
                  <button
                    type="button"
                    onClick={() => setActivePreviewFile({ name: fsr.document_name || 'attachment.jpg', url: fsr.document_url! })}
                    className="bg-white hover:bg-gray-100 text-gray-800 font-bold px-4 py-2 rounded-lg shadow-md text-xs inline-flex items-center gap-1.5 scale-100 group-hover:scale-105 transition-transform"
                  >
                    <Eye className="h-4 w-4 text-blue-600" /> Buka Preview Dokumen PDF
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Own Risk (OR) Details if exists */}
        {isBodyRepair && (fsr.biaya_estimasi_or !== undefined && fsr.biaya_estimasi_or !== null || fsr.estimasi_or_url) && (
          <div className="rounded-xl border border-amber-100 bg-amber-50/10 p-4 dark:border-amber-950/10">
            <h4 className="text-xs font-bold text-amber-800 dark:text-amber-400 uppercase tracking-wider mb-2">
              Detail Estimasi OR (Own Risk)
            </h4>
            <div className="grid gap-4 sm:grid-cols-2 text-xs mb-3">
              {fsr.biaya_estimasi_or !== undefined && fsr.biaya_estimasi_or !== null && (
                <div>
                  <span className="text-gray-400 block text-[10px]">Biaya Estimasi OR</span>
                  <span className="font-bold text-gray-800 dark:text-gray-200">
                    Rp {fsr.biaya_estimasi_or.toLocaleString('id-ID')}
                  </span>
                </div>
              )}
              {fsr.estimasi_or_url && (
                <div>
                  <span className="text-gray-400 block text-[10px]">Dokumen Estimasi OR</span>
                  <div className="flex items-center gap-2 mt-1">
                    <FileText className="h-4 w-4 text-amber-600" />
                    <span className="font-medium text-gray-700 dark:text-gray-300 truncate max-w-[200px]">
                      {fsr.estimasi_or_name || 'estimasi_or.jpg'}
                    </span>
                  </div>
                </div>
              )}
            </div>

            {fsr.estimasi_or_url && (
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-amber-500/5 p-3 rounded-lg border border-amber-500/10 mb-3">
                <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">File Lampiran OR</span>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setActivePreviewFile({ name: fsr.estimasi_or_name || 'estimasi_or.jpg', url: fsr.estimasi_or_url! })}
                    className="inline-flex items-center gap-1 bg-amber-600 hover:bg-amber-700 text-white px-3 py-1.5 rounded-lg text-xs font-bold transition-colors"
                  >
                    <Eye className="h-3.5 w-3.5" /> Lihat Preview
                  </button>
                </div>
              </div>
            )}

            {/* Direct Inline Image Preview for OR */}
            {fsr.estimasi_or_url && isImageUrl(fsr.estimasi_or_url, fsr.estimasi_or_name || '') && (
              <div className="mt-3 relative group rounded-lg overflow-hidden border border-gray-200 dark:border-gray-800 shadow-xs max-h-64 flex items-center justify-center bg-gray-50 dark:bg-gray-900">
                <img
                  src={getImgSrcUrl(fsr.estimasi_or_url)}
                  alt="Own Risk Attachment"
                  className="max-h-64 object-contain w-full cursor-pointer hover:opacity-95 transition-opacity"
                  onClick={() => setActivePreviewFile({ name: fsr.estimasi_or_name || 'estimasi_or.jpg', url: fsr.estimasi_or_url! })}
                  referrerPolicy="no-referrer"
                />
                <div className="absolute top-2 right-2 bg-black/60 text-white rounded-full p-1.5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                  <Eye className="h-4 w-4" />
                </div>
              </div>
            )}

            {/* Direct Inline PDF Preview for OR */}
            {fsr.estimasi_or_url && isPdfUrl(fsr.estimasi_or_url, fsr.estimasi_or_name || '') && (
              <div className="mt-3 border border-gray-200 dark:border-gray-800 rounded-lg overflow-hidden bg-gray-50 dark:bg-gray-900 h-64 relative group">
                <iframe
                  src={getEmbedUrl(fsr.estimasi_or_url)}
                  className="w-full h-full border-none pointer-events-none"
                  title="PDF Preview"
                ></iframe>
                <div className="absolute inset-0 bg-black/5 flex items-center justify-center">
                  <button
                    type="button"
                    onClick={() => setActivePreviewFile({ name: fsr.estimasi_or_name || 'estimasi_or.jpg', url: fsr.estimasi_or_url! })}
                    className="bg-white hover:bg-gray-100 text-gray-800 font-bold px-4 py-2 rounded-lg shadow-md text-xs inline-flex items-center gap-1.5 scale-100 group-hover:scale-105 transition-transform"
                  >
                    <Eye className="h-4 w-4 text-amber-600" /> Buka Preview Dokumen PDF
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Work Execution Timestamps Summary (for TS & Workshops) */}
        {(fsr.tanggal_masuk_bengkel || fsr.tanggal_selesai_perbaikan) && (
          <div className="rounded-xl border border-blue-100 bg-blue-50/20 p-4 dark:border-blue-900/30 dark:bg-blue-950/10">
            <h4 className="text-xs font-bold text-blue-800 dark:text-blue-400 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5" /> Rekap Waktu Timestamp Pengerjaan
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              {fsr.tanggal_masuk_bengkel && (
                <div className="bg-white dark:bg-gray-900/60 p-2.5 rounded-lg border border-blue-100/60 dark:border-blue-900/30 flex flex-col justify-between">
                  <div>
                    <span className="text-gray-400 block text-[10px] uppercase font-bold">Waktu Mulai Pengerjaan</span>
                    <span className="font-bold text-gray-800 dark:text-gray-200 mt-0.5 block">
                      {new Date(fsr.tanggal_masuk_bengkel).toLocaleString('id-ID', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </span>
                  </div>
                  {fsr.catatan_mulai_pekerjaan && (
                    <div className="mt-2 pt-1.5 border-t border-gray-100 dark:border-gray-800 text-[11px] text-gray-600 dark:text-gray-300">
                      <span className="font-semibold text-gray-400 dark:text-gray-500 block text-[10px]">Catatan Mulai:</span>
                      <p className="italic text-gray-700 dark:text-gray-300 mt-0.5 leading-snug">{fsr.catatan_mulai_pekerjaan}</p>
                    </div>
                  )}
                </div>
              )}
              {fsr.tanggal_selesai_perbaikan && (
                <div className="bg-white dark:bg-gray-900/60 p-2.5 rounded-lg border border-blue-100/60 dark:border-blue-900/30 flex flex-col justify-between">
                  <div>
                    <span className="text-gray-400 block text-[10px] uppercase font-bold">Waktu Selesai Pengerjaan</span>
                    <span className="font-bold text-emerald-700 dark:text-emerald-400 mt-0.5 block">
                      {new Date(fsr.tanggal_selesai_perbaikan).toLocaleString('id-ID', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </span>
                  </div>
                  {fsr.catatan_selesai_pekerjaan && (
                    <div className="mt-2 pt-1.5 border-t border-gray-100 dark:border-gray-800 text-[11px] text-gray-600 dark:text-gray-300">
                      <span className="font-semibold text-gray-400 dark:text-gray-500 block text-[10px]">Catatan Selesai:</span>
                      <p className="italic text-gray-700 dark:text-gray-300 mt-0.5 leading-snug">{fsr.catatan_selesai_pekerjaan}</p>
                    </div>
                  )}
                </div>
              )}
              {fsr.tanggal_masuk_bengkel && fsr.tanggal_selesai_perbaikan && (
                <div className="bg-white dark:bg-gray-900/60 p-2.5 rounded-lg border border-blue-100/60 dark:border-blue-900/30 flex flex-col justify-between">
                  <div>
                    <span className="text-gray-400 block text-[10px] uppercase font-bold">Total Durasi Pengerjaan</span>
                    <span className="font-bold text-indigo-600 dark:text-indigo-400 mt-0.5 block text-sm">
                      {formatDuration(fsr.tanggal_masuk_bengkel, fsr.tanggal_selesai_perbaikan)}
                    </span>
                  </div>
                  <div className="mt-2 pt-1.5 border-t border-gray-100 dark:border-gray-800 text-[10px] text-gray-400">
                    Selesai & diserahterimakan
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Estimation Cost Breakdown details - hidden for TS role or internal TS jobs */}
        {currentUser.role_operation !== 'TS' && !isInternalWork && estimations.length > 0 && (
          <div className="rounded-xl border border-gray-100 p-4 dark:border-gray-800">
            <h4 className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-3">
              Rincian Estimasi Biaya Perbaikan (Itemized)
            </h4>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-gray-100 text-gray-400 dark:border-gray-800">
                    <th className="pb-2 font-semibold">Deskripsi Pekerjaan/Part</th>
                    <th className="pb-2 text-right font-semibold">Biaya Satuan</th>
                    <th className="pb-2 text-center font-semibold">Qty</th>
                    <th className="pb-2 text-right font-semibold">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 dark:divide-gray-900">
                  {estimations.map((est, index) => (
                    <tr key={index} className="text-gray-700 dark:text-gray-300">
                      <td className="py-2.5">{est.deskripsi}</td>
                      <td className="py-2.5 text-right">Rp {est.biaya.toLocaleString()}</td>
                      <td className="py-2.5 text-center">{est.qty}</td>
                      <td className="py-2.5 text-right font-bold">Rp {est.total.toLocaleString()}</td>
                    </tr>
                  ))}
                  <tr className="border-t border-gray-100 font-bold dark:border-gray-800 text-gray-900 dark:text-white">
                    <td colSpan={3} className="pt-3">Grand Total Estimasi</td>
                    <td className="pt-3 text-right text-blue-600 dark:text-blue-400 text-sm">
                      Rp {fsr.estimasi_biaya?.toLocaleString() || '0'}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Vendor Estimation File Attachment - hidden for TS role or internal TS jobs */}
        {currentUser.role_operation !== 'TS' && !isInternalWork && fsr.estimasi_vendor_url && (
          <div className="rounded-xl border border-gray-100 p-4 dark:border-gray-800 bg-white dark:bg-gray-950/20">
            <h4 className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-2">
              File / Foto Penawaran Vendor
            </h4>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-gray-50 dark:bg-gray-900/40 p-3 rounded-lg border border-gray-100/50 dark:border-gray-800/50">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 text-blue-600 dark:bg-blue-900/20">
                  <FileText className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-bold text-gray-800 dark:text-gray-200 truncate max-w-[200px]">{fsr.estimasi_vendor_name || 'estimasi_vendor.jpg'}</p>
                  <p className="text-[10px] text-gray-400">
                    {fsr.estimasi_vendor_url.startsWith('data:') ? 'Disimpan Lokal (Base64)' : 'Tersimpan di Google Drive'}
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setActivePreviewFile({ name: fsr.estimasi_vendor_name || 'estimasi_vendor.jpg', url: fsr.estimasi_vendor_url! })}
                  className="inline-flex items-center gap-1 bg-blue-50 hover:bg-blue-100 text-blue-700 dark:bg-blue-950/50 dark:hover:bg-blue-900/50 dark:text-blue-300 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors"
                >
                  <Eye className="h-3.5 w-3.5" /> Lihat Preview
                </button>
              </div>
            </div>

            {/* Direct Inline Image Preview for Vendor Estimasi */}
            {isImageUrl(fsr.estimasi_vendor_url, fsr.estimasi_vendor_name || '') && (
              <div className="mt-3 relative group rounded-lg overflow-hidden border border-gray-200 dark:border-gray-800 shadow-xs max-h-64 flex items-center justify-center bg-gray-50 dark:bg-gray-900">
                <img
                  src={getImgSrcUrl(fsr.estimasi_vendor_url)}
                  alt="Vendor Estimation Attachment"
                  className="max-h-64 object-contain w-full cursor-pointer hover:opacity-95 transition-opacity"
                  onClick={() => setActivePreviewFile({ name: fsr.estimasi_vendor_name || 'estimasi_vendor.jpg', url: fsr.estimasi_vendor_url! })}
                  referrerPolicy="no-referrer"
                />
                <div className="absolute top-2 right-2 bg-black/60 text-white rounded-full p-1.5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                  <Eye className="h-4 w-4" />
                </div>
              </div>
            )}

            {/* Direct Inline PDF Preview for Vendor Estimasi */}
            {isPdfUrl(fsr.estimasi_vendor_url, fsr.estimasi_vendor_name || '') && (
              <div className="mt-3 border border-gray-200 dark:border-gray-800 rounded-lg overflow-hidden bg-gray-50 dark:bg-gray-900 h-64 relative group">
                <iframe
                  src={getEmbedUrl(fsr.estimasi_vendor_url)}
                  className="w-full h-full border-none pointer-events-none"
                  title="Vendor PDF Preview"
                ></iframe>
                <div className="absolute inset-0 bg-black/5 flex items-center justify-center">
                  <button
                    type="button"
                    onClick={() => setActivePreviewFile({ name: fsr.estimasi_vendor_name || 'estimasi_vendor.jpg', url: fsr.estimasi_vendor_url! })}
                    className="bg-white hover:bg-gray-100 text-gray-800 font-bold px-4 py-2 rounded-lg shadow-md text-xs inline-flex items-center gap-1.5 scale-100 group-hover:scale-105 transition-transform"
                  >
                    <Eye className="h-4 w-4 text-blue-600" /> Buka Preview Dokumen PDF
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ⚙️ INTERACTIVE ROLE ACTIONS WORKFLOW MODULE ⚙️ */}
        <div className="rounded-xl border border-yellow-200 bg-yellow-50/20 p-5 dark:border-yellow-900/30 dark:bg-yellow-950/10 space-y-4">
          <div className="flex items-center justify-between gap-2 border-b border-yellow-200 pb-2.5 dark:border-yellow-900/30">
            <div className="flex items-center gap-2">
              <Wrench className="h-4.5 w-4.5 text-yellow-600" />
              <h4 className="text-xs font-bold text-yellow-800 dark:text-yellow-400 uppercase tracking-wider">
                Operation Action Panel (Role: {currentUser.role_operation})
              </h4>
            </div>
          </div>

          {/* Quick Vendor & SPK Edit Banner for SA, SS, VRO & Super Admin */}
          {(currentUser?.role_operation === 'SA' || currentUser?.role_operation === 'SS' || currentUser?.role_operation === 'VRO' || currentUser?.role_operation === 'Super Admin') &&
           fsr.status !== 'Finished' && fsr.status !== 'Rejected' && fsr.status !== 'Cancelled' && (
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 rounded-lg bg-blue-50/80 dark:bg-blue-950/40 p-2.5 border border-blue-100 dark:border-blue-900/30 text-xs">
              <span className="text-blue-900 dark:text-blue-300 font-medium">
                Ada pengalihan vendor pelaksana atau perubahan nomor SPK?
              </span>
              <button
                type="button"
                onClick={() => {
                  setEditVendorName(fsr.nama_vendor || '');
                  setEditVmdNumber(fsr.no_vmd || '');
                  setEditSpkNo(fsr.no_spk || '');
                  setIsEditVendorModalOpen(true);
                }}
                className="inline-flex items-center gap-1.5 rounded-md bg-blue-600 px-3 py-1.5 font-bold text-white hover:bg-blue-700 shadow-xs transition-colors shrink-0"
              >
                <Edit3 className="h-3.5 w-3.5" /> Edit Vendor & SPK
              </button>
            </div>
          )}

          {/* Workflow conditional logic rendering depending on status and role */}
          {/* A. Waiting Approval Leader Customer */}
          {fsr.status === 'Waiting Approval Leader Customer' && currentUser.role_operation === 'Leader Customer' && (
            <div className="space-y-3">
              <p className="text-xs text-yellow-800 dark:text-yellow-400 leading-relaxed font-medium">
                Persetujuan Leader Customer dibutuhkan untuk memulai pengerjaan operasional.
              </p>
              <textarea
                placeholder="Berikan catatan persetujuan atau penolakan..."
                value={catatan}
                onChange={(e) => setCatatan(e.target.value)}
                className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs focus:outline-hidden dark:border-gray-800 dark:bg-gray-950 dark:text-white"
              />
              <div className="flex gap-2">
                <button
                  onClick={() => handleAction('APPROVE_LEADER_CUST')}
                  className="rounded-lg bg-blue-600 px-4 py-2 text-xs font-bold text-white hover:bg-blue-700"
                >
                  Approve Pengajuan
                </button>
                <button
                  onClick={() => handleAction('REJECT_LEADER_CUST')}
                  className="rounded-lg bg-red-600 px-4 py-2 text-xs font-bold text-white hover:bg-red-700"
                >
                  Reject Ditolak
                </button>
              </div>
            </div>
          )}

          {/* B. Approved Leader Customer (Awaiting SA, SS, VRO assignment depending on category) */}
          {fsr.status === 'Approved Leader Customer' && (
            (((isMaintenance || isBodyRepair) && (currentUser.role_operation === 'SA' || currentUser.role_operation === 'SS')) ||
             (isDocument && currentUser.role_operation === 'VRO') ||
             currentUser.role_operation === 'Super Admin')
          ) && (
            <div className="space-y-4">
              <p className="text-xs text-yellow-800 dark:text-yellow-400 font-medium">
                Silakan pilih pelaksana (Vendor) dan terbitkan SPK untuk unit ini.
              </p>

              {isMaintenance && (
                <div className="flex items-center gap-4 text-xs font-medium">
                  <label className="flex items-center gap-1.5">
                    <input
                      type="radio"
                      checked={!isInternal}
                      onChange={() => setIsInternal(false)}
                      className="text-blue-600"
                    />
                    Vendor Eksternal
                  </label>
                  <label className="flex items-center gap-1.5">
                    <input
                      type="radio"
                      checked={isInternal}
                      onChange={() => setIsInternal(true)}
                      className="text-blue-600"
                    />
                    TS Internal (Technical Service)
                  </label>
                </div>
              )}

              <div className={`grid gap-3 text-xs ${!isInternal ? 'sm:grid-cols-3' : 'sm:grid-cols-2'}`}>
                {!isInternal ? (
                  <>
                    <div className="space-y-1 relative">
                      <span className="font-bold text-gray-600 dark:text-gray-400">Pilih Vendor Eksternal</span>
                      <div className="relative">
                        <input
                          type="text"
                          placeholder="Cari & Pilih Vendor..."
                          value={isVendorDropdownOpen ? vendorSearch : (selectedVendor || vendorSearch)}
                          onChange={(e) => {
                            setVendorSearch(e.target.value);
                            setIsVendorDropdownOpen(true);
                          }}
                          onFocus={() => {
                            setIsVendorDropdownOpen(true);
                            if (!selectedVendor) {
                              setVendorSearch('');
                            }
                          }}
                          onBlur={() => {
                            setTimeout(() => setIsVendorDropdownOpen(false), 250);
                          }}
                          className="w-full rounded-lg border border-gray-200 bg-white pl-3 pr-8 py-2 text-xs focus:border-blue-500 focus:outline-hidden dark:border-gray-800 dark:bg-gray-950 dark:text-white"
                        />
                        <Search className="absolute right-3 top-2.5 h-3.5 w-3.5 text-gray-400 pointer-events-none" />
                        
                        {isVendorDropdownOpen && (
                          <div className="absolute left-0 right-0 z-50 mt-1 max-h-48 overflow-y-auto rounded-lg border border-gray-100 bg-white py-1 shadow-lg dark:border-gray-800 dark:bg-gray-950">
                            {filteredVendors.length === 0 ? (
                              <div className="px-3 py-2 text-xs text-gray-400 italic">
                                Vendor tidak ditemukan
                              </div>
                            ) : (
                              filteredVendors.map((v) => (
                                <button
                                  key={v.id}
                                  type="button"
                                  onClick={() => {
                                    setSelectedVendor(v.nama_vendor);
                                    setSelectedVmd(v.vmd || ''); // Auto-fill VMD Code!
                                    setVendorSearch('');
                                    setIsVendorDropdownOpen(false);
                                  }}
                                  className={`w-full text-left px-3 py-2 text-xs hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors flex items-center justify-between ${
                                    selectedVendor === v.nama_vendor ? 'font-bold text-blue-600 bg-blue-50/10' : 'text-gray-700 dark:text-gray-300'
                                  }`}
                                >
                                  <span>{v.nama_vendor}</span>
                                  <span className="text-[10px] font-mono text-gray-400 dark:text-gray-500">{v.vmd}</span>
                                </button>
                              ))
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Auto-populated & Editable VMD Number Box */}
                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-gray-600 dark:text-gray-400">No. VMD</span>
                        {selectedVmd && (
                          <span className="text-[9px] text-emerald-600 font-semibold bg-emerald-50 dark:bg-emerald-950/40 px-1.5 py-0.5 rounded border border-emerald-100 dark:border-emerald-900/30">
                            Otomatis Terisi
                          </span>
                        )}
                      </div>
                      <input
                        type="text"
                        placeholder="Nomor VMD..."
                        value={selectedVmd}
                        onChange={(e) => setSelectedVmd(e.target.value)}
                        className="w-full rounded-lg border border-gray-200 bg-white p-2 text-xs font-mono font-bold focus:border-blue-500 focus:outline-hidden dark:border-gray-800 dark:bg-gray-950 dark:text-white"
                      />
                    </div>
                  </>
                ) : (
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-gray-600 dark:text-gray-400">Petugas TS Internal</span>
                      <span className="text-[10px] font-semibold text-blue-600 bg-blue-50 dark:bg-blue-950/40 px-1.5 py-0.5 rounded border border-blue-100 dark:border-blue-900/30">
                        Cabang: {fsr.cabang || 'Semua'}
                      </span>
                    </div>
                    {availableTsList.length > 0 ? (
                      <select
                        value={selectedTsName || availableTsList[0].nama}
                        onChange={(e) => setSelectedTsName(e.target.value)}
                        className="w-full rounded-lg border border-gray-200 bg-white p-2 text-xs font-semibold focus:border-blue-500 focus:outline-hidden dark:border-gray-800 dark:bg-gray-950 dark:text-white"
                      >
                        {availableTsList.map((ts) => (
                          <option key={ts.id} value={ts.nama}>
                            {ts.nama} ({ts.cabang_handling || 'Semua Cabang'})
                          </option>
                        ))}
                      </select>
                    ) : (
                      <input
                        type="text"
                        value={selectedTsName || `TS Internal (${fsr.cabang || 'Semua Cabang'})`}
                        onChange={(e) => setSelectedTsName(e.target.value)}
                        placeholder={`TS Internal ${fsr.cabang || ''}`}
                        className="w-full rounded-lg border border-gray-200 bg-white p-2 text-xs font-semibold focus:border-blue-500 focus:outline-hidden dark:border-gray-800 dark:bg-gray-950 dark:text-white"
                      />
                    )}
                  </div>
                )}

                <div className="space-y-1 justify-end flex flex-col">
                  <span className="font-bold text-gray-600 dark:text-gray-400">Nomor SPK</span>
                  <input
                    type="text"
                    placeholder="Contoh: SPK/OPS/2026/001"
                    value={spkNo}
                    onChange={(e) => setSpkNo(e.target.value)}
                    className="w-full rounded-lg border border-gray-200 bg-white p-2 dark:border-gray-800 dark:bg-gray-950 dark:text-white"
                  />
                </div>
              </div>

              {/* Own Risk (OR) Inputs for Body Repair */}
              {isBodyRepair && (
                <div className="grid gap-3 sm:grid-cols-2 border-t border-yellow-200/50 pt-3 dark:border-yellow-900/30 text-xs">
                  <div className="space-y-1">
                    <span className="font-bold text-gray-600 dark:text-gray-400">Biaya Estimasi OR</span>
                    <div className="relative">
                      <span className="absolute left-2.5 top-2 text-gray-400 font-bold">Rp</span>
                      <input
                        type="number"
                        placeholder="Contoh: 300000"
                        value={biayaOr}
                        onChange={(e) => setBiayaOr(e.target.value)}
                        className="w-full rounded-lg border border-gray-200 bg-white pl-8 pr-2 py-2 text-xs focus:border-blue-500 focus:outline-hidden dark:border-gray-800 dark:bg-gray-950 dark:text-white"
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-1">
                    <span className="font-bold text-gray-600 dark:text-gray-400">Input Estimasi OR (Foto / File)</span>
                    <div
                      onDragOver={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setOrDragActive(true);
                      }}
                      onDragLeave={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setOrDragActive(false);
                      }}
                      onDrop={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setOrDragActive(false);
                        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                          processOrFile(e.dataTransfer.files[0]);
                        }
                      }}
                      onClick={() => !isUploadingOrFile && orFileInputRef.current?.click()}
                      className={`flex flex-col items-center justify-center rounded-lg border border-dashed p-3 text-center cursor-pointer transition-colors min-h-[58px] ${
                        orDragActive
                          ? 'border-blue-500 bg-blue-50/10'
                          : 'border-gray-200 hover:border-gray-300 dark:border-gray-800 dark:hover:border-gray-700 bg-white dark:bg-gray-950'
                      }`}
                    >
                      <input
                        type="file"
                        ref={orFileInputRef}
                        disabled={isUploadingOrFile}
                        onChange={(e) => {
                          if (e.target.files && e.target.files[0]) {
                            processOrFile(e.target.files[0]);
                          }
                        }}
                        accept="image/*,application/pdf"
                        className="hidden"
                      />
                      {isUploadingOrFile ? (
                        <span className="flex items-center gap-1.5 text-[10px] text-blue-600 font-bold animate-pulse">
                          <Loader2 className="h-3 w-3 animate-spin" /> Uploading ke Drive...
                        </span>
                      ) : orFile ? (
                        <div className="flex flex-col items-center gap-0.5">
                          <span className="text-[10px] text-emerald-600 font-bold truncate max-w-[150px]">
                            ✓ {orFile.name}
                          </span>
                          <span className={`text-[8px] px-1.5 py-0.5 rounded font-bold ${
                            orFileUploadInfo
                              ? 'bg-emerald-100 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 ring-1 ring-emerald-200'
                              : orFile.url.startsWith('data:') 
                                ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400' 
                                : 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400'
                          }`}>
                            {orFileUploadInfo ? 'Sukses ke Drive' : orFile.url.startsWith('data:') ? 'Penyimpanan Lokal' : 'Google Drive Terkoneksi'}
                          </span>
                          {orFileUploadInfo && (
                            <span className="text-[7.5px] text-emerald-600 font-semibold max-w-[160px] text-center leading-tight mt-1 bg-emerald-50 p-1 rounded border border-emerald-100 block">
                              ✓ {orFileUploadInfo}
                            </span>
                          )}
                          {orFileUploadError && (
                            <span className="text-[8px] text-amber-500 font-semibold max-w-[140px] text-center leading-tight mt-0.5">
                              ⚠️ {orFileUploadError}
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="text-[10px] text-gray-500 dark:text-gray-400 font-semibold truncate max-w-[150px]">
                          Drag & Drop atau Klik untuk Upload
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              )}

              <button
                onClick={() => handleAction('ASSIGN_VENDOR_SPK')}
                disabled={!isInternal && !selectedVendor}
                className="rounded-lg bg-blue-600 px-5 py-2 text-xs font-bold text-white hover:bg-blue-700 disabled:bg-gray-300 dark:disabled:bg-gray-800"
              >
                Simpan Penugasan & SPK
              </button>
            </div>
          )}

          {/* C. Waiting Estimasi (Vendor action to submit costs) */}
          {fsr.status === 'Waiting Estimasi' && (currentUser.role_operation === 'Vendor' || currentUser.role_operation === 'Super Admin') && (
            <div className="space-y-4">
              <p className="text-xs text-yellow-800 dark:text-yellow-400 font-bold uppercase tracking-wider">
                Input Penawaran Estimasi Biaya (Vendor Area)
              </p>

              {/* Builder of dynamic estimasi item rows */}
              <div className="rounded-lg border border-gray-100 p-3 bg-white/50 dark:border-gray-800 space-y-3">
                <div className="grid gap-2 sm:grid-cols-4 text-xs">
                  <div className="sm:col-span-2">
                    <span className="font-bold text-gray-500">Deskripsi Pekerjaan / Suku Cadang</span>
                    <input
                      type="text"
                      placeholder="Ganti Kampas Rem"
                      value={estDesc}
                      onChange={(e) => setEstDesc(e.target.value)}
                      className="w-full rounded-lg border border-gray-200 bg-white p-1.5 mt-1 dark:border-gray-800 dark:bg-gray-950"
                    />
                  </div>
                  <div>
                    <span className="font-bold text-gray-500">Harga Satuan</span>
                    <input
                      type="number"
                      placeholder="350000"
                      value={estPrice}
                      onChange={(e) => setEstPrice(e.target.value)}
                      className="w-full rounded-lg border border-gray-200 bg-white p-1.5 mt-1 dark:border-gray-800 dark:bg-gray-950"
                    />
                  </div>
                  <div>
                    <span className="font-bold text-gray-500">Qty</span>
                    <input
                      type="number"
                      value={estQty}
                      onChange={(e) => setEstQty(e.target.value)}
                      className="w-full rounded-lg border border-gray-200 bg-white p-1.5 mt-1 dark:border-gray-800 dark:bg-gray-950"
                    />
                  </div>
                </div>
                <button
                  type="button"
                  onClick={addEstRow}
                  className="inline-flex items-center gap-1 text-xs font-bold text-blue-600 hover:underline"
                >
                  <Plus className="h-4 w-4" /> Tambah Item Estimasi
                </button>

                {/* Local drafts */}
                {estItems.length > 0 && (
                  <div className="mt-3 border-t border-gray-100 pt-3 text-[11px] dark:border-gray-800">
                    <span className="font-bold text-gray-600 dark:text-gray-400">Rancangan Penawaran:</span>
                    <div className="space-y-1 mt-1.5">
                      {estItems.map((item) => (
                        <div key={item.id} className="flex justify-between items-center text-gray-700 dark:text-gray-300">
                          <span>• {item.deskripsi} ({item.qty}x)</span>
                          <span className="font-bold text-right flex items-center gap-2">
                            Rp {item.total?.toLocaleString()}
                            <button onClick={() => removeEstRow(item.id)} className="text-red-500 hover:text-red-700">
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </span>
                        </div>
                      ))}
                      <div className="flex justify-between font-bold text-blue-600 dark:text-blue-400 border-t border-gray-100 pt-2 text-xs">
                        <span>Total Penawaran Estimasi</span>
                        <span>Rp {estItems.reduce((s, i) => s + (i.total || 0), 0).toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
              
              {/* Upload Estimasi Vendor (Foto / File) */}
              <div className="space-y-1">
                <span className="font-bold text-gray-600 dark:text-gray-400 text-xs">Upload File/Foto Estimasi (Opsional)</span>
                <div
                  onDragOver={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setVendorDragActive(true);
                  }}
                  onDragLeave={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setVendorDragActive(false);
                  }}
                  onDrop={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setVendorDragActive(false);
                    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                      processVendorFile(e.dataTransfer.files[0]);
                    }
                  }}
                  onClick={() => !isUploadingVendorFile && vendorFileInputRef.current?.click()}
                  className={`flex flex-col items-center justify-center rounded-lg border border-dashed p-4 text-center cursor-pointer transition-colors min-h-[75px] ${
                    vendorDragActive
                      ? 'border-blue-500 bg-blue-50/10'
                      : 'border-gray-200 hover:border-gray-300 dark:border-gray-800 dark:hover:border-gray-700 bg-white dark:bg-gray-950'
                  }`}
                >
                  <input
                    type="file"
                    ref={vendorFileInputRef}
                    disabled={isUploadingVendorFile}
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        processVendorFile(e.target.files[0]);
                      }
                    }}
                    accept="image/*,application/pdf"
                    className="hidden"
                  />
                  {isUploadingVendorFile ? (
                    <span className="flex items-center gap-1.5 text-xs text-blue-600 font-bold animate-pulse">
                      <Loader2 className="h-4 w-4 animate-spin" /> Uploading ke Google Drive...
                    </span>
                  ) : vendorFile ? (
                    <div className="flex flex-col items-center gap-0.5 p-2">
                      <span className="text-xs text-emerald-600 font-bold truncate max-w-[250px]">
                        ✓ {vendorFile.name}
                      </span>
                      <span className={`text-[9px] px-1.5 py-0.5 rounded font-black ${
                        vendorFileUploadInfo
                          ? 'bg-emerald-100 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 ring-1 ring-emerald-200'
                          : vendorFile.url.startsWith('data:') 
                            ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400' 
                            : 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400'
                      }`}>
                        {vendorFileUploadInfo ? 'Sukses ke Drive' : vendorFile.url.startsWith('data:') ? 'Penyimpanan Lokal' : 'Google Drive Terkoneksi'}
                      </span>
                      {vendorFileUploadInfo && (
                        <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold max-w-[280px] text-center leading-relaxed mt-2 bg-emerald-50 p-2 rounded-lg border border-emerald-100">
                          ✓ {vendorFileUploadInfo}
                        </p>
                      )}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setVendorFile(null);
                          setVendorFileUploadError('');
                          setVendorFileUploadInfo('');
                        }}
                        className="text-[10px] text-red-500 hover:underline mt-2"
                      >
                        Hapus File
                      </button>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-1 text-gray-500 dark:text-gray-400">
                      <span className="text-xs font-semibold">
                        Drag & Drop atau Klik untuk Upload File/Foto Estimasi
                      </span>
                      <span className="text-[10px] text-gray-400">
                        Format: Gambar atau PDF (Maks. 10MB)
                      </span>
                    </div>
                  )}
                </div>
                {vendorFileUploadError && (
                  <p className="text-[10px] text-red-500 font-medium mt-1">
                    ⚠️ {vendorFileUploadError}
                  </p>
                )}
              </div>

              <button
                onClick={() => handleAction('SUBMIT_ESTIMASI')}
                disabled={estItems.length === 0}
                className="rounded-lg bg-blue-600 px-5 py-2 text-xs font-bold text-white hover:bg-blue-700 disabled:bg-gray-300 dark:disabled:bg-gray-800"
              >
                Ajukan Estimasi Biaya
              </button>
            </div>
          )}

          {/* D. Waiting Approval Leader Operation (Reviewing vendor costs) */}
          {fsr.status === 'Waiting Approval Leader Operation' && (currentUser.role_operation === 'Leader Operation' || currentUser.role_operation === 'Super Admin') && (
            <div className="space-y-3">
              <p className="text-xs text-yellow-800 dark:text-yellow-400 font-medium">
                Persetujuan Leader Operation dibutuhkan untuk estimasi vendor senilai <span className="font-bold">Rp {fsr.estimasi_biaya?.toLocaleString()}</span>.
              </p>
              <textarea
                placeholder="Berikan persetujuan atau catatan khusus..."
                value={catatan}
                onChange={(e) => setCatatan(e.target.value)}
                className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs focus:outline-hidden dark:border-gray-800 dark:bg-gray-950 dark:text-white"
              />
              <button
                onClick={() => handleAction('APPROVE_LEADER_OPS')}
                className="rounded-lg bg-blue-600 px-5 py-2 text-xs font-bold text-white hover:bg-blue-700"
              >
                Approve Estimasi
              </button>
            </div>
          )}

          {/* E. Waiting Approval Customer (Leader Customer approves the actual work and costs) */}
          {fsr.status === 'Waiting Approval Customer' && (currentUser.role_operation === 'Leader Customer' || currentUser.role_operation === 'Super Admin') && (
            <div className="space-y-3">
              <p className="text-xs text-yellow-800 dark:text-yellow-400 font-medium">
                Persetujuan Estimasi oleh Customer diperlukan senilai <span className="font-bold">Rp {fsr.estimasi_biaya?.toLocaleString()}</span>.
              </p>
              <textarea
                placeholder="Tambahkan catatan keputusan..."
                value={catatan}
                onChange={(e) => setCatatan(e.target.value)}
                className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs focus:outline-hidden dark:border-gray-800 dark:bg-gray-950 dark:text-white"
              />
              <div className="flex gap-2">
                <button
                  onClick={() => handleAction('APPROVE_EST_CUST')}
                  className="rounded-lg bg-blue-600 px-4 py-2 text-xs font-bold text-white hover:bg-blue-700"
                >
                  Setuju & Mulai Kerja
                </button>
                <button
                  onClick={() => handleAction('NEGOTIATE_EST')}
                  className="rounded-lg bg-orange-500 px-4 py-2 text-xs font-bold text-white hover:bg-orange-600"
                >
                  Ajukan Negosiasi Biaya
                </button>
              </div>
            </div>
          )}

          {/* F. Waiting Vendor (Vehicle arrival check-in) */}
          {fsr.status === 'Waiting Vendor' && (currentUser.role_operation === 'Vendor' || currentUser.role_operation === 'Super Admin') && (
            <div className="space-y-3">
              <p className="text-xs text-yellow-800 dark:text-yellow-400 font-medium">
                Konfirmasi kedatangan unit kendaraan di bengkel untuk memulai perbaikan fisik.
              </p>
              {isBodyRepair && (
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-gray-600 dark:text-gray-400">
                    Tanggal & Jam Masuk Bengkel
                  </label>
                  <input
                    type="datetime-local"
                    value={tanggalMasukBengkel}
                    onChange={(e) => setTanggalMasukBengkel(e.target.value)}
                    className="w-full max-w-xs rounded-lg border border-gray-200 bg-white p-2 text-xs focus:border-blue-500 focus:outline-hidden dark:border-gray-800 dark:bg-gray-950 dark:text-white"
                  />
                </div>
              )}
              <button
                onClick={() => handleAction('MASUK_BENGKEL')}
                className="rounded-lg bg-indigo-600 px-5 py-2.5 text-xs font-bold text-white hover:bg-indigo-700 shadow-xs"
              >
                Konfirmasi unit "Masuk Bengkel"
              </button>
            </div>
          )}

          {/* G. Waiting TS (Internal TS to start work with timestamp) */}
          {(fsr.status === 'Waiting TS' || (currentUser.role_operation === 'TS' && fsr.status === 'Approved Leader Customer')) && (currentUser.role_operation === 'TS' || currentUser.role_operation === 'Super Admin') && (
            <div className="space-y-4 rounded-xl border border-blue-200 bg-blue-50/40 p-4 dark:border-blue-900/40 dark:bg-blue-950/20">
              <div className="flex items-center gap-2 border-b border-blue-100 dark:border-blue-900/30 pb-2.5">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-600 text-white">
                  <Wrench className="h-4 w-4" />
                </div>
                <div>
                  <h5 className="text-xs font-bold text-blue-900 dark:text-blue-300">
                    Mulai Pengerjaan Teknisi (TS)
                  </h5>
                  <p className="text-[11px] text-gray-500 dark:text-gray-400">
                    Waktu mulai akan tercatat secara real-time saat Anda menekan tombol Mulai Pengerjaan.
                  </p>
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <Clock className="h-3.5 w-3.5 text-blue-600" />
                      Waktu Mulai Pengerjaan (Real-Time)
                    </span>
                    <span className="text-[10px] text-gray-400 font-normal italic">Terkunci otomatis</span>
                  </label>
                  <div className="flex items-center gap-2 px-3 py-2 bg-gray-100 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg text-xs font-bold text-gray-700 dark:text-gray-300 cursor-not-allowed select-none">
                    <Clock className="h-3.5 w-3.5 text-blue-500 shrink-0" />
                    <span>{new Date().toLocaleString('id-ID', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })} (Waktu Sekarang)</span>
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-gray-700 dark:text-gray-300">
                    Catatan Mulai Pekerjaan
                  </label>
                  <input
                    type="text"
                    placeholder="Contoh: Unit masuk workshop, persiapan tools dan pengecekan..."
                    value={catatanMulaiPekerjaan}
                    onChange={(e) => setCatatanMulaiPekerjaan(e.target.value)}
                    className="w-full rounded-lg border border-gray-200 bg-white p-2 text-xs focus:border-blue-500 focus:outline-hidden dark:border-gray-800 dark:bg-gray-950 dark:text-white"
                  />
                </div>
              </div>

              <button
                onClick={() => handleAction('MASUK_BENGKEL')}
                className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-2.5 text-xs font-bold text-white hover:bg-blue-700 shadow-sm transition-all active:scale-98"
              >
                <Play className="h-3.5 w-3.5 fill-white" />
                Mulai Pengerjaan (Catat Waktu Mulai)
              </button>
            </div>
          )}

          {/* H. On Progress perbaikan (Perbaikan Selesai) */}
          {fsr.status === 'On Progress' && (
            (currentUser.role_operation === 'Vendor' && !isInternalWork) ||
            (currentUser.role_operation === 'TS' || isInternalWork) ||
            currentUser.role_operation === 'Super Admin'
          ) && (
            <div className="space-y-4 rounded-xl border border-emerald-200 bg-emerald-50/40 p-4 dark:border-emerald-900/40 dark:bg-emerald-950/20">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-emerald-100 dark:border-emerald-900/30 pb-2.5">
                <div className="flex items-center gap-2">
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-600 text-white">
                    <CheckCircle className="h-4 w-4" />
                  </div>
                  <div>
                    <h5 className="text-xs font-bold text-emerald-900 dark:text-emerald-300">
                      Pekerjaan Sedang Berlangsung (On Progress)
                    </h5>
                    <p className="text-[11px] text-gray-500 dark:text-gray-400">
                      Unit dalam proses perbaikan. Waktu selesai akan otomatis dicatat secara real-time saat Anda klik tombol di bawah.
                    </p>
                  </div>
                </div>
                {fsr.tanggal_masuk_bengkel && (
                  <span className="inline-flex items-center gap-1.5 rounded-md bg-white dark:bg-gray-900 px-2.5 py-1 text-[11px] font-semibold text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-900">
                    <Clock className="h-3 w-3 text-emerald-600" />
                    Mulai: {new Date(fsr.tanggal_masuk_bengkel).toLocaleString('id-ID', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                  </span>
                )}
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <Clock className="h-3.5 w-3.5 text-emerald-600" />
                      Waktu Selesai Pekerjaan (Real-Time)
                    </span>
                    <span className="text-[10px] text-gray-400 font-normal italic">Terkunci otomatis</span>
                  </label>
                  <div className="flex items-center gap-2 px-3 py-2 bg-gray-100 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg text-xs font-bold text-gray-700 dark:text-gray-300 cursor-not-allowed select-none">
                    <Clock className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                    <span>{new Date().toLocaleString('id-ID', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })} (Waktu Sekarang)</span>
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-gray-700 dark:text-gray-300">
                    Catatan Selesai Pekerjaan
                  </label>
                  <input
                    type="text"
                    placeholder="Contoh: Perbaikan selesai, penggantian oli dan filter rampung, siap digunakan..."
                    value={catatanSelesaiPekerjaan}
                    onChange={(e) => setCatatanSelesaiPekerjaan(e.target.value)}
                    className="w-full rounded-lg border border-gray-200 bg-white p-2 text-xs focus:border-emerald-500 focus:outline-hidden dark:border-gray-800 dark:bg-gray-950 dark:text-white"
                  />
                </div>
              </div>

              <button
                onClick={() => handleAction('SELESAI_PERBAIKAN')}
                className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-5 py-2.5 text-xs font-bold text-white hover:bg-emerald-700 shadow-sm transition-all active:scale-98"
              >
                <CheckCircle2 className="h-4 w-4" />
                Selesai Pekerjaan (Catat Waktu Selesai)
              </button>
            </div>
          )}

          {/* I. Negotiation State (Awaiting vendor to adjust and re-submit) */}
          {fsr.status === 'Negotiation' && (currentUser.role_operation === 'Vendor' || currentUser.role_operation === 'Super Admin') && (
            <div className="space-y-2">
              <p className="text-xs text-yellow-800 dark:text-yellow-400 font-medium">
                Customer meminta negosiasi harga. Harap sesuaikan estimasi biaya Anda dan ajukan ulang.
              </p>
              <button
                onClick={async () => {
                  // Direct transition helper back to Waiting Estimasi for resubmission
                  await localDb.processFsrWorkflow(fsrId, 'CANCEL_LEADER_CUST', { catatan: 'Membatalkan untuk revisi estimasi' }, currentUser);
                  await localDb.processFsrWorkflow(fsrId, 'APPROVE_LEADER_CUST', { catatan: 'Revisi disetujui untuk diestimasi ulang' }, currentUser);
                  loadFsrData();
                }}
                className="rounded-lg bg-blue-600 px-4 py-2 text-xs font-bold text-white hover:bg-blue-700"
              >
                Input Ulang Estimasi Biaya
              </button>
            </div>
          )}

          {/* Generic fallback / state is final */}
          {(fsr.status === 'Finished' || fsr.status === 'Rejected' || fsr.status === 'Cancelled') && (
            <p className="text-xs text-gray-500 italic">
              Status FSR ini sudah final ({fsr.status}). Tidak ada tindakan operasional lanjutan.
            </p>
          )}
        </div>

        {/* Dynamic Activity Logs Timeline History for FSR */}
        <div className="space-y-4">
          <h4 className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">
            3. Catatan Timeline & Histori Alur (Audit Trail)
          </h4>
          <div className="flow-root">
            <ul className="-mb-8">
              {history.map((h, hIdx) => (
                <li key={h.id}>
                  <div className="relative pb-8">
                    {hIdx !== history.length - 1 ? (
                      <span className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-gray-100 dark:bg-gray-800" aria-hidden="true" />
                    ) : null}
                    <div className="relative flex space-x-3 text-xs">
                      <div>
                        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400">
                          <Clock className="h-4 w-4" />
                        </span>
                      </div>
                      <div className="flex-1 min-w-0 pt-1.5">
                        <div className="flex justify-between">
                          <span className="font-bold text-gray-800 dark:text-gray-200">
                            Ke Status: <span className="text-blue-600 dark:text-blue-400">{h.status}</span>
                          </span>
                          <span className="text-[10px] text-gray-400">
                            {new Date(h.created_at).toLocaleString('id-ID', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <p className="text-gray-500 dark:text-gray-400 mt-1 leading-relaxed">
                          Catatan: {h.catatan}
                        </p>
                        <p className="mt-1 text-[10px] text-gray-400">
                          Diproses oleh: <span className="font-semibold text-gray-500 dark:text-gray-300">{h.actor_name}</span> ({h.actor_role})
                        </p>
                      </div>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* LIGHTBOX / FILE PREVIEW OVERLAY */}
      {activePreviewFile && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-xs p-4 animate-fade-in text-xs text-gray-700 dark:text-gray-300">
          <div className="relative w-full max-w-4xl bg-white dark:bg-gray-950 rounded-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden border border-gray-100 dark:border-gray-800 animate-zoom-in">
            
            {/* Header */}
            <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-800 px-5 py-4">
              <div>
                <h3 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2">
                  <FileText className="h-4 w-4 text-blue-500" />
                  Preview File: {activePreviewFile.name}
                </h3>
                <p className="text-[10px] text-gray-400 mt-0.5">
                  Tipe: {isImageUrl(activePreviewFile.url, activePreviewFile.name) ? 'Gambar/Foto' : isPdfUrl(activePreviewFile.url, activePreviewFile.name) ? 'Dokumen PDF' : 'Dokumen'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setActivePreviewFile(null)}
                className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-900 transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-auto bg-gray-50/50 dark:bg-gray-900/50 p-6 flex items-center justify-center min-h-[400px]">
              {isImageUrl(activePreviewFile.url, activePreviewFile.name) ? (
                <img
                  src={getImgSrcUrl(activePreviewFile.url)}
                  alt={activePreviewFile.name}
                  className="max-w-full max-h-[60vh] object-contain rounded-lg shadow-md border border-gray-200/50 dark:border-gray-800/80 bg-white dark:bg-gray-950"
                  referrerPolicy="no-referrer"
                />
              ) : isPdfUrl(activePreviewFile.url, activePreviewFile.name) ? (
                activePreviewFile.url.startsWith('data:') ? (
                  <object
                    data={activePreviewFile.url}
                    type="application/pdf"
                    className="w-full h-[60vh] rounded-lg shadow-md border border-gray-200/50"
                  >
                    <div className="text-center p-6 space-y-3 bg-white dark:bg-gray-950 rounded-xl border border-gray-100">
                      <FileText className="h-12 w-12 text-gray-300 mx-auto" />
                      <p className="text-xs text-gray-500 font-semibold">Browser Anda tidak mendukung preview PDF langsung.</p>
                      <a
                        href={activePreviewFile.url}
                        download={activePreviewFile.name}
                        className="inline-flex items-center gap-1.5 text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg"
                      >
                        Unduh PDF
                      </a>
                    </div>
                  </object>
                ) : (
                  <iframe
                    src={getEmbedUrl(activePreviewFile.url)}
                    className="w-full h-[60vh] rounded-lg shadow-md border border-gray-200/50"
                    allow="autoplay"
                  ></iframe>
                )
              ) : (
                <div className="text-center p-8 bg-white dark:bg-gray-950 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm space-y-4 max-w-sm">
                  <FileText className="h-14 w-14 text-blue-500 mx-auto" />
                  <div className="space-y-1">
                    <p className="text-xs font-bold text-gray-800 dark:text-gray-200">{activePreviewFile.name}</p>
                    <p className="text-[10px] text-gray-400">File tidak dapat dipreview secara langsung.</p>
                  </div>
                  <div className="flex gap-2">
                    <a
                      href={activePreviewFile.url}
                      target="_blank"
                      rel="noreferrer"
                      className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-xs font-bold text-white hover:bg-blue-700 shadow-sm transition-colors"
                    >
                      Buka di Tab Baru <ExternalLink className="h-3.5 w-3.5" />
                    </a>
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-2 border-t border-gray-100 dark:border-gray-800 px-5 py-4">
              <a
                href={getDownloadUrl(activePreviewFile.url)}
                download={activePreviewFile.name}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 rounded-lg border border-gray-200 bg-white px-4 py-2 text-xs font-bold text-gray-700 hover:bg-gray-50 dark:border-gray-800 dark:bg-gray-950 dark:text-gray-300 dark:hover:bg-gray-900 transition-colors"
              >
                Unduh File/Foto <Download className="h-3.5 w-3.5" />
              </a>
              <button
                type="button"
                onClick={() => setActivePreviewFile(null)}
                className="rounded-lg bg-gray-100 hover:bg-gray-200 dark:bg-gray-900 dark:hover:bg-gray-800 px-5 py-2 text-xs font-bold text-gray-800 dark:text-gray-200 transition-colors"
              >
                Tutup
              </button>
            </div>

          </div>
        </div>
      )}

      {/* ✏️ Edit Vendor, No. VMD & SPK Modal for SA, SS, VRO */}
      {isEditVendorModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl dark:bg-gray-900 border border-gray-100 dark:border-gray-800 space-y-4">
            <div className="flex items-center justify-between border-b pb-3 dark:border-gray-800">
              <h3 className="text-sm font-bold text-gray-800 dark:text-gray-200 flex items-center gap-2">
                <Edit3 className="h-4 w-4 text-blue-600" />
                Edit Vendor, No. VMD & SPK
              </h3>
              <button
                type="button"
                onClick={() => setIsEditVendorModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              {/* SPK Number Input */}
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-gray-600 dark:text-gray-400">Nomor SPK</span>
                  <span className="text-[10px] text-blue-600 font-medium">Dapat Diedit</span>
                </div>
                <input
                  type="text"
                  placeholder="Contoh: SPK/OPS/2026/001"
                  value={editSpkNo}
                  onChange={(e) => setEditSpkNo(e.target.value)}
                  className="w-full rounded-lg border border-gray-200 bg-white p-2 text-xs font-mono font-bold focus:border-blue-500 focus:outline-hidden dark:border-gray-800 dark:bg-gray-950 dark:text-white"
                />
              </div>

              {/* Vendor Selector */}
              <div className="space-y-1 relative">
                <span className="font-bold text-gray-600 dark:text-gray-400">Pilih / Ubah Vendor Pelaksana</span>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Cari & Pilih Vendor..."
                    value={isEditVendorDropdownOpen ? editVendorSearch : (editVendorName || editVendorSearch)}
                    onChange={(e) => {
                      setEditVendorSearch(e.target.value);
                      setIsEditVendorDropdownOpen(true);
                    }}
                    onFocus={() => {
                      setIsEditVendorDropdownOpen(true);
                      if (!editVendorName) setEditVendorSearch('');
                    }}
                    onBlur={() => setTimeout(() => setIsEditVendorDropdownOpen(false), 250)}
                    className="w-full rounded-lg border border-gray-200 bg-white pl-3 pr-8 py-2 text-xs focus:border-blue-500 focus:outline-hidden dark:border-gray-800 dark:bg-gray-950 dark:text-white"
                  />
                  <Search className="absolute right-3 top-2.5 h-3.5 w-3.5 text-gray-400 pointer-events-none" />

                  {isEditVendorDropdownOpen && (
                    <div className="absolute left-0 right-0 z-50 mt-1 max-h-40 overflow-y-auto rounded-lg border border-gray-100 bg-white py-1 shadow-lg dark:border-gray-800 dark:bg-gray-950">
                      {vendorsList.filter(v => v.nama_vendor.toLowerCase().includes(editVendorSearch.toLowerCase())).map((v) => (
                        <button
                          key={v.id}
                          type="button"
                          onClick={() => {
                            setEditVendorName(v.nama_vendor);
                            setEditVmdNumber(v.vmd || ''); // Auto fill
                            setEditVendorSearch('');
                            setIsEditVendorDropdownOpen(false);
                          }}
                          className="w-full text-left px-3 py-2 text-xs hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors flex items-center justify-between"
                        >
                          <span className="font-semibold text-gray-800 dark:text-gray-200">{v.nama_vendor}</span>
                          <span className="font-mono text-[10px] text-gray-400">{v.vmd}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* VMD Number Input */}
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-gray-600 dark:text-gray-400">No. VMD</span>
                  <span className="text-[10px] text-blue-600 font-medium">Dapat Diedit</span>
                </div>
                <input
                  type="text"
                  placeholder="Contoh: VMD001"
                  value={editVmdNumber}
                  onChange={(e) => setEditVmdNumber(e.target.value)}
                  className="w-full rounded-lg border border-gray-200 bg-white p-2 text-xs font-mono font-bold focus:border-blue-500 focus:outline-hidden dark:border-gray-800 dark:bg-gray-950 dark:text-white"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t dark:border-gray-800">
              <button
                type="button"
                onClick={() => setIsEditVendorModalOpen(false)}
                className="rounded-lg px-3 py-1.5 text-xs text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={async () => {
                  if (currentUser) {
                    await localDb.updateFsrVendorAndSpk(fsr.id, editVendorName, editVmdNumber, editSpkNo, currentUser);
                    setIsEditVendorModalOpen(false);
                    loadFsrData();
                  }
                }}
                className="rounded-lg bg-blue-600 px-4 py-1.5 text-xs font-bold text-white hover:bg-blue-700 shadow-xs"
              >
                Simpan Perubahan
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
