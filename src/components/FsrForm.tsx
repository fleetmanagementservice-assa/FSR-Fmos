/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  Upload,
  CheckCircle,
  FileCheck,
  AlertCircle,
  Car,
  FileText,
  Plus,
  Search,
  X,
  Eye,
  ExternalLink,
  Download
} from 'lucide-react';
import { localDb } from '../db/localDb';
import { Branch, Customer, Unit, Category, ServiceCategory } from '../types';
import { useTheme } from './ThemeContext';
import { uploadToGoogleDrive, isImageUrl, isPdfUrl, getImgSrcUrl, getEmbedUrl, getDownloadUrl, compressImageIfNecessary } from '../utils/googleDrive';
import { Loader2 } from 'lucide-react';

interface FsrFormProps {
  onSuccess: () => void;
}

export const FsrForm: React.FC<FsrFormProps> = ({ onSuccess }) => {
  const { currentUser } = useTheme();

  // Master options
  const [branches, setBranches] = useState<Branch[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);

  // Form State
  const [selectedBranch, setSelectedBranch] = useState(() => {
    if (currentUser?.cabang_handling && currentUser.cabang_handling !== 'All Branches' && currentUser.cabang_handling !== 'All') {
      return currentUser.cabang_handling;
    }
    return '';
  });

  useEffect(() => {
    if (currentUser?.cabang_handling && currentUser.cabang_handling !== 'All Branches' && currentUser.cabang_handling !== 'All') {
      setSelectedBranch(currentUser.cabang_handling);
    }
  }, [currentUser]);

  const isBranchRestricted = !!(currentUser?.cabang_handling && currentUser.cabang_handling !== 'All Branches' && currentUser.cabang_handling !== 'All');
  const isCustomerRole = currentUser?.role_operation === 'Admin Customer' || currentUser?.role_operation === 'Leader Customer';

  const [selectedCustomer, setSelectedCustomer] = useState('');
  const [categoryType, setCategoryType] = useState<ServiceCategory>('Maintenance');
  const [serviceType, setServiceType] = useState('');
  const [selectedUnitId, setSelectedUnitId] = useState('');
  const [kmReading, setKmReading] = useState('');
  const [remarks, setRemarks] = useState('');
  
  // Search state for units selection
  const [unitSearch, setUnitSearch] = useState('');
  const [isUnitDropdownOpen, setIsUnitDropdownOpen] = useState(false);

  // Multi-unit state for Document category
  const [selectedDocumentUnits, setSelectedDocumentUnits] = useState<Unit[]>([]);
  
  // Document attachment
  const [fileAttachment, setFileAttachment] = useState<{ name: string; url: string } | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [isUploadingFile, setIsUploadingFile] = useState(false);
  const [fileUploadError, setFileUploadError] = useState('');
  const [fileUploadInfo, setFileUploadInfo] = useState('');
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  // Status and feedback
  const [formError, setFormError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    setBranches(localDb.getBranches());
    setCustomers(localDb.getCustomers());
    setUnits(localDb.getUnits());
    setCategories(localDb.getCategories());
  }, []);

  // Filter options
  const filteredUnits = units;
  
  // Deduplicate service types in the select options
  const filteredServiceTypes = Array.from(
    new Set(
      categories
        .filter((c) => c.kategori_layanan === categoryType)
        .map((c) => c.jenis_layanan)
    )
  );

  // Handle unit selection auto-population hints (for non-Document category)
  const selectedUnitDetails = units.find((u) => u.id === selectedUnitId);

  // Reset or auto-fill selected customer and unit state when category or user changes
  useEffect(() => {
    setSelectedUnitId('');
    setSelectedDocumentUnits([]);
    setUnitSearch('');

    if (categoryType === 'Document' && isCustomerRole) {
      if (currentUser?.assigned_customer_cmd) {
        setSelectedCustomer(currentUser.assigned_customer_cmd);
      } else if (customers.length > 0) {
        setSelectedCustomer(customers[0].cmd);
      }
    } else {
      setSelectedCustomer('');
    }
  }, [categoryType, isCustomerRole, currentUser?.assigned_customer_cmd, customers]);

  // Set default service type on category change
  useEffect(() => {
    const types = categories.filter((c) => c.kategori_layanan === categoryType);
    if (types.length > 0) {
      setServiceType(types[0].jenis_layanan);
    }
  }, [categoryType, categories]);

  const selectedCustomerObj = customers.find(c => c.cmd === selectedCustomer || c.id === selectedCustomer);
  const targetCmd = selectedCustomerObj ? selectedCustomerObj.cmd : selectedCustomer;
  const targetName = selectedCustomerObj ? selectedCustomerObj.nama_customer : '';

  // Filter units by search query (license plate or description) & sync with Master Unit data
  const searchedUnits = units.filter(u => {
    const matchesSearch = u.license_plate.toLowerCase().includes(unitSearch.toLowerCase()) ||
      u.description.toLowerCase().includes(unitSearch.toLowerCase()) ||
      u.no_equipment.toLowerCase().includes(unitSearch.toLowerCase());
    
    if (categoryType === 'Document') {
      if (targetCmd || selectedCustomer) {
        const matchCmd = u.cmd && targetCmd && u.cmd.trim().toLowerCase() === targetCmd.trim().toLowerCase();
        const matchName = u.customer_name && targetName && u.customer_name.trim().toLowerCase() === targetName.trim().toLowerCase();
        return matchesSearch && (matchCmd || matchName);
      }
      return false; // Show nothing if customer company isn't selected yet
    }

    // For Admin Customer / Leader Customer on all categories, synchronize unit selection with their assigned customer's units
    if (isCustomerRole && targetCmd) {
      const matchCmd = u.cmd && targetCmd && u.cmd.trim().toLowerCase() === targetCmd.trim().toLowerCase();
      const matchName = u.customer_name && targetName && u.customer_name.trim().toLowerCase() === targetName.trim().toLowerCase();
      return matchesSearch && (matchCmd || matchName);
    }

    return matchesSearch;
  });

  // Drag and drop handlers
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const processFile = async (file: File) => {
    setIsUploadingFile(true);
    setFormError('');
    setFileUploadError('');
    setFileUploadInfo('');
    try {
      const { base64DataUrl, wasCompressed } = await compressImageIfNecessary(file);
      let uploadName = file.name;
      if (wasCompressed && !uploadName.toLowerCase().endsWith('.jpg') && !uploadName.toLowerCase().endsWith('.jpeg')) {
        const baseName = uploadName.substring(0, uploadName.lastIndexOf('.')) || uploadName;
        uploadName = `${baseName}_compressed.jpg`;
      }

      const res = await uploadToGoogleDrive(uploadName, base64DataUrl);
      setFileAttachment({
        name: uploadName,
        url: res.fileUrl || res.downloadUrl || base64DataUrl
      });
      if (res.success) {
        setSuccessMsg('File berhasil diunggah ke Google Drive!');
        if (res.message) {
          setFileUploadInfo(res.message);
        }
        setTimeout(() => setSuccessMsg(''), 4000);
      } else {
        setFileUploadError(res.message || 'Gagal mengunggah ke Google Drive.');
      }
    } catch (err: any) {
      console.warn('Apps Script Upload Info (using local storage fallback):', err.message || err);
      setFileUploadError('Terjadi kesalahan koneksi. Disimpan secara lokal.');
      
      const fallbackUrl = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.readAsDataURL(file);
      });
      setFileAttachment({
        name: file.name,
        url: fallbackUrl
      });
    } finally {
      setIsUploadingFile(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!selectedBranch) return setFormError('Silakan pilih cabang.');
    
    let unitObj = units.find((u) => u.id === selectedUnitId);

    if (categoryType === 'Document') {
      if (!selectedCustomer) {
        return setFormError('Silakan pilih Customer Perusahaan terlebih dahulu.');
      }
      if (selectedDocumentUnits.length === 0) {
        return setFormError('Silakan pilih minimal 1 unit kendaraan.');
      }
      unitObj = selectedDocumentUnits[0]; // reference primary unit
    } else {
      if (!selectedUnitId || !unitObj) {
        return setFormError('Silakan pilih unit kendaraan.');
      }
    }

    if (categoryType !== 'Document' && (!kmReading || Number(kmReading) <= 0)) return setFormError('KM Pengajuan harus diisi dengan angka valid.');
    if (!remarks) return setFormError('Silakan isi keterangan pengajuan.');

    // Fetch details
    const branchObj = branches.find((b) => b.cabang === selectedBranch || b.id === selectedBranch);
    const branchName = branchObj ? branchObj.cabang : selectedBranch;

    // Use dynamic customer based on unit
    const activeUnit = categoryType === 'Document' ? selectedDocumentUnits[0] : unitObj;
    const customerCode = activeUnit ? activeUnit.cmd : selectedCustomer;
    const custObj = customers.find((c) => c.cmd === customerCode);
    const customerName = custObj ? custObj.nama_customer : 'PT Astra Sedaya Finance';

    try {
      if (categoryType === 'Document') {
        // Pre-generate a shared FSR number using the unified /DOC/ prefix with absolute uniqueness
        const sharedNoFsr = localDb.generateNextNoFsr('Document');

        // Create separate FSR records for each selected unit so that each license plate (nopol) has its own row in the DB/Supabase
        for (const unit of selectedDocumentUnits) {
          const uCustCode = unit.cmd;
          const uCustObj = customers.find((c) => c.cmd === uCustCode);
          const uCustomerName = uCustObj ? uCustObj.nama_customer : customerName;

          await localDb.createFsr(
            {
              no_fsr: sharedNoFsr,
              nama_customer: uCustomerName,
              cabang: branchName,
              no_polisi: unit.license_plate,
              type_kendaraan: unit.description,
              no_rangka: unit.chassis_no,
              km_pengajuan: 0,
              kategori_layanan: categoryType,
              jenis_layanan: serviceType,
              keterangan: remarks,
              document_url: fileAttachment?.url || null,
              document_name: fileAttachment?.name || null
            },
            currentUser
          );
        }

        if (selectedDocumentUnits.length > 1) {
          setSuccessMsg(`${selectedDocumentUnits.length} FSR Baru Berhasil Diajukan (1 baris per nopol)! Menunggu persetujuan Leader Customer.`);
        } else {
          setSuccessMsg('FSR Baru Berhasil Diajukan! Menunggu persetujuan Leader Customer.');
        }
      } else {
        // Standard FSR (1 unit)
        await localDb.createFsr(
          {
            nama_customer: customerName,
            cabang: branchName,
            no_polisi: unitObj!.license_plate,
            type_kendaraan: unitObj!.description,
            no_rangka: unitObj!.chassis_no,
            km_pengajuan: Number(kmReading),
            kategori_layanan: categoryType,
            jenis_layanan: categoryType === 'Body Repair' ? '-' : serviceType,
            keterangan: remarks,
            document_url: fileAttachment?.url || null,
            document_name: fileAttachment?.name || null
          },
          currentUser
        );

        setSuccessMsg('FSR Baru Berhasil Diajukan! Menunggu persetujuan Leader Customer.');
      }

      // Reset form
      setRemarks('');
      setKmReading('');
      setSelectedUnitId('');
      setSelectedDocumentUnits([]);
      setUnitSearch('');
      setFileAttachment(null);

      // Notify parent on delay
      setTimeout(() => {
        setSuccessMsg('');
        onSuccess();
      }, 2000);
    } catch (err: any) {
      setFormError(err.message || 'Gagal mengirimkan pengajuan.');
    }
  };

  return (
    <div className="max-w-4xl mx-auto rounded-2xl border border-gray-100 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-950">
      <div className="flex items-center gap-3 border-b border-gray-100 pb-4 mb-6 dark:border-gray-800">
        <Plus className="h-5 w-5 text-blue-600" />
        <div>
          <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200">
            Formulir Pengajuan Fleet Service Request (FSR)
          </h3>
          <p className="text-[11px] text-gray-400 mt-0.5">
            Lengkapi data di bawah untuk menerbitkan FSR baru dengan status awal WAITING APPROVAL.
          </p>
        </div>
      </div>

      {formError && (
        <div className="mb-6 flex items-center gap-3 rounded-lg bg-red-50 p-3 text-xs font-medium text-red-600 dark:bg-red-950/40 dark:text-red-400">
          <AlertCircle className="h-4 w-4" />
          {formError}
        </div>
      )}

      {successMsg && (
        <div className="mb-6 flex items-center gap-3 rounded-lg bg-emerald-50 p-3 text-xs font-semibold text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400">
          <CheckCircle className="h-4 w-4" />
          {successMsg}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid gap-6 md:grid-cols-2">
          {/* Cabang Pelaksana */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-gray-600 dark:text-gray-400">
              Cabang Pelaksana {isBranchRestricted && <span className="text-[10px] text-blue-600 dark:text-blue-400 font-normal">(Sesuai Role Akun Anda)</span>}
            </label>
            <select
              value={selectedBranch}
              onChange={(e) => setSelectedBranch(e.target.value)}
              disabled={isBranchRestricted}
              className={`w-full rounded-lg border border-gray-200 bg-white px-3.5 py-2 text-xs focus:border-blue-500 focus:outline-hidden dark:border-gray-800 dark:bg-gray-950 dark:text-white ${isBranchRestricted ? 'opacity-80 cursor-not-allowed bg-gray-50 dark:bg-gray-900/60 font-semibold' : ''}`}
            >
              {isBranchRestricted ? (
                <option value={currentUser.cabang_handling}>{currentUser.cabang_handling}</option>
              ) : (
                <>
                  <option value="">-- Pilih Cabang --</option>
                  {branches.map((b) => (
                    <option key={b.id} value={b.cabang}>
                      {b.maint_plant} - {b.cabang}
                    </option>
                  ))}
                </>
              )}
            </select>
          </div>

          {/* Kategori Layanan */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-gray-600 dark:text-gray-400">Kategori Layanan</label>
            <select
              value={categoryType}
              onChange={(e) => setCategoryType(e.target.value as ServiceCategory)}
              className="w-full rounded-lg border border-gray-200 bg-white px-3.5 py-2 text-xs focus:border-blue-500 focus:outline-hidden dark:border-gray-800 dark:bg-gray-950 dark:text-white"
            >
              <option value="Maintenance">Maintenance (Perawatan)</option>
              <option value="Body Repair">Body Repair (Perbaikan Fisik)</option>
              <option value="Document">Document (Pengurusan Legalitas)</option>
            </select>
          </div>

          {/* Jenis Layanan */}
          {categoryType !== 'Body Repair' && (
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-600 dark:text-gray-400">Jenis Layanan</label>
              <select
                value={serviceType}
                onChange={(e) => setServiceType(e.target.value)}
                className="w-full rounded-lg border border-gray-200 bg-white px-3.5 py-2 text-xs focus:border-blue-500 focus:outline-hidden dark:border-gray-800 dark:bg-gray-950 dark:text-white"
              >
                {filteredServiceTypes.map((t, idx) => (
                  <option key={idx} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Customer Perusahaan (Visible ONLY for Document category) */}
          {categoryType === 'Document' && (
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-600 dark:text-gray-400">
                Customer Perusahaan {isCustomerRole && <span className="text-[10px] text-blue-600 dark:text-blue-400 font-normal">(Otomatis Terisi Sesuai Role)</span>}
              </label>
              <select
                value={selectedCustomer}
                onChange={(e) => {
                  setSelectedCustomer(e.target.value);
                  setSelectedDocumentUnits([]);
                  setSelectedUnitId('');
                  setUnitSearch('');
                }}
                disabled={isCustomerRole && !!currentUser?.assigned_customer_cmd}
                className={`w-full rounded-lg border border-gray-200 bg-white px-3.5 py-2 text-xs focus:border-blue-500 focus:outline-hidden dark:border-gray-800 dark:bg-gray-950 dark:text-white ${
                  isCustomerRole && !!currentUser?.assigned_customer_cmd
                    ? 'opacity-85 cursor-not-allowed bg-gray-50 dark:bg-gray-900/60 font-semibold text-blue-600 dark:text-blue-400'
                    : ''
                }`}
              >
                <option value="">-- Pilih Customer Perusahaan --</option>
                {customers.map((c) => (
                  <option key={c.id || c.cmd} value={c.cmd}>
                    {c.cmd} - {c.nama_customer}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Pilih Unit Kendaraan (Searchable Dropdown) */}
          <div className="space-y-1.5 relative">
            <label className="text-xs font-bold text-gray-600 dark:text-gray-400">Pilih Unit Kendaraan</label>
            <div className="relative">
              <input
                type="text"
                placeholder={categoryType === 'Document' && !selectedCustomer ? "Pilih Customer Perusahaan Terlebih Dahulu..." : "Cari Nopol, Deskripsi, atau No Equipment..."}
                disabled={categoryType === 'Document' && !selectedCustomer}
                value={isUnitDropdownOpen ? unitSearch : (selectedUnitId && selectedUnitDetails ? `${selectedUnitDetails.license_plate} - ${selectedUnitDetails.description}` : unitSearch)}
                onChange={(e) => {
                  setUnitSearch(e.target.value);
                  setIsUnitDropdownOpen(true);
                }}
                onFocus={() => {
                  if (categoryType === 'Document' && !selectedCustomer) return;
                  setIsUnitDropdownOpen(true);
                  if (!selectedUnitId) {
                    setUnitSearch('');
                  }
                }}
                onBlur={() => {
                  // Slight delay to allow clicking items before closing
                  setTimeout(() => setIsUnitDropdownOpen(false), 250);
                }}
                className="w-full rounded-lg border border-gray-200 bg-white pl-9 pr-8 py-2 text-xs focus:border-blue-500 focus:outline-hidden dark:border-gray-800 dark:bg-gray-950 dark:text-white disabled:bg-gray-50 dark:disabled:bg-gray-900 disabled:opacity-60 disabled:cursor-not-allowed"
              />
              <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-gray-400" />
              {selectedUnitId && (
                <button
                  type="button"
                  onClick={() => {
                    setSelectedUnitId('');
                    setSelectedCustomer('');
                    setUnitSearch('');
                  }}
                  className="absolute right-3 top-2.5 rounded-full p-0.5 hover:bg-gray-100 dark:hover:bg-gray-800"
                >
                  <X className="h-3 w-3 text-gray-400 hover:text-red-500" />
                </button>
              )}
            </div>

            {isUnitDropdownOpen && (
              <div className="absolute z-50 mt-1 max-h-60 w-full overflow-y-auto rounded-lg border border-gray-200 bg-white py-1 shadow-lg dark:border-gray-800 dark:bg-gray-950">
                {searchedUnits.length === 0 ? (
                  <div className="px-3.5 py-2 text-xs text-gray-500">Unit tidak ditemukan</div>
                ) : (
                  searchedUnits.map((u) => {
                    const isAlreadyAdded = selectedDocumentUnits.some(item => item.id === u.id);
                    return (
                      <button
                        key={u.id}
                        type="button"
                        onClick={() => {
                          if (categoryType === 'Document') {
                            if (!isAlreadyAdded) {
                              setSelectedDocumentUnits(prev => [...prev, u]);
                            }
                            setSelectedUnitId(u.id);
                            setSelectedCustomer(u.cmd);
                            setUnitSearch('');
                          } else {
                            setSelectedUnitId(u.id);
                            setSelectedCustomer(u.cmd);
                            setUnitSearch(`${u.license_plate} - ${u.description}`);
                          }
                          setIsUnitDropdownOpen(false);
                        }}
                        className={`w-full text-left px-3.5 py-2 text-xs hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300 font-medium border-b border-gray-50 dark:border-gray-900/40 last:border-0 flex items-center justify-between ${
                          isAlreadyAdded ? 'opacity-60 bg-blue-50/20' : ''
                        }`}
                      >
                        <div>
                          <span className="font-bold text-blue-600 dark:text-blue-400">{u.license_plate}</span> - {u.description}
                          <span className="block text-[10px] text-gray-400">EQ: {u.no_equipment} | CMD: {u.cmd}</span>
                        </div>
                        {categoryType === 'Document' && (
                          <span className="text-[10px] bg-blue-100 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 px-1.5 py-0.5 rounded font-bold">
                            {isAlreadyAdded ? 'Terpilih' : '+ Tambah'}
                          </span>
                        )}
                      </button>
                    );
                  })
                )}
              </div>
            )}
          </div>

          {/* KM Reading */}
          {categoryType !== 'Document' && (
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-600 dark:text-gray-400">KM Kendaraan Saat Ini</label>
              <input
                type="number"
                placeholder="Contoh: 154000"
                value={kmReading}
                onChange={(e) => setKmReading(e.target.value)}
                className="w-full rounded-lg border border-gray-200 bg-white px-3.5 py-2 text-xs focus:border-blue-500 focus:outline-hidden dark:border-gray-800 dark:bg-gray-950 dark:text-white"
              />
            </div>
          )}
        </div>

        {/* Selected Unit Metadata Auto-Populated Card or Grid */}
        {categoryType !== 'Document' && selectedUnitDetails && (
          <div className="rounded-xl bg-gray-50 border border-gray-100 p-4 dark:bg-gray-900/50 dark:border-gray-800 grid gap-4 sm:grid-cols-4 text-[11px]">
            <div className="flex items-center gap-2">
              <Car className="h-4 w-4 text-blue-600" />
              <div>
                <span className="block text-gray-400">No Equipment</span>
                <span className="font-bold text-gray-700 dark:text-gray-300">{selectedUnitDetails.no_equipment}</span>
              </div>
            </div>
            <div>
              <span className="block text-gray-400">Customer Perusahaan (CMD)</span>
              <span className="font-bold text-blue-600 dark:text-blue-400">
                {selectedUnitDetails.cmd} - {customers.find(c => c.cmd === selectedUnitDetails.cmd)?.nama_customer || 'PT Astra Sedaya Finance'}
              </span>
            </div>
            <div>
              <span className="block text-gray-400">Nomor Rangka (Chassis)</span>
              <span className="font-mono font-semibold text-gray-700 dark:text-gray-300">{selectedUnitDetails.chassis_no}</span>
            </div>
            <div>
              <span className="block text-gray-400">Tahun & Warna Unit</span>
              <span className="font-semibold text-gray-700 dark:text-gray-300">{selectedUnitDetails.tahun_unit} | {selectedUnitDetails.warna}</span>
            </div>
          </div>
        )}

        {/* Dynamic Multi-Nopol Grid for Document category */}
        {categoryType === 'Document' && selectedDocumentUnits.length > 0 && (
          <div className="space-y-2">
            <label className="text-xs font-bold text-gray-600 dark:text-gray-400">Daftar Unit Kendaraan Terpilih ({selectedDocumentUnits.length})</label>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {selectedDocumentUnits.map((u) => (
                <div key={u.id} className="relative flex flex-col justify-between rounded-xl border border-gray-200 bg-gray-50/40 p-3.5 dark:border-gray-800 dark:bg-gray-900/50">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <Car className="h-4.5 w-4.5 text-blue-600" />
                      <div>
                        <span className="block text-xs font-bold text-gray-800 dark:text-gray-200">{u.license_plate}</span>
                        <span className="block text-[10px] text-gray-400 font-mono">{u.no_equipment}</span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedDocumentUnits(prev => prev.filter(existing => existing.id !== u.id));
                      }}
                      className="text-[10px] font-bold text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/30 px-2 py-1 rounded"
                    >
                      Hapus
                    </button>
                  </div>
                  
                  <div className="mt-2.5 pt-2 border-t border-gray-100 dark:border-gray-800 grid grid-cols-2 gap-2 text-[10px] text-gray-500">
                    <div>
                      <span className="block text-gray-400">Chassis No:</span>
                      <span className="font-semibold text-gray-700 dark:text-gray-300 truncate block max-w-full font-mono">{u.chassis_no}</span>
                    </div>
                    <div>
                      <span className="block text-gray-400">Tahun & Warna:</span>
                      <span className="font-semibold text-gray-700 dark:text-gray-300 block truncate">{u.tahun_unit} | {u.warna}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Keterangan */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-gray-600 dark:text-gray-400">Keterangan Detail Pekerjaan</label>
          <textarea
            rows={3}
            placeholder="Deskripsikan kerusakan, kebutuhan servis berkala, atau detail perpanjangan dokumen legalitas..."
            value={remarks}
            onChange={(e) => setRemarks(e.target.value)}
            className="w-full rounded-lg border border-gray-200 bg-white px-3.5 py-2 text-xs focus:border-blue-500 focus:outline-hidden dark:border-gray-800 dark:bg-gray-950 dark:text-white"
          />
        </div>

        {/* File Drag and Drop Attachment */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-gray-600 dark:text-gray-400">Upload Dokumen Pendukung (Foto/PDF)</label>
          <div
            onDragEnter={handleDrag}
            onDragOver={handleDrag}
            onDragLeave={handleDrag}
            onDrop={handleDrop}
            className={`flex flex-col items-center justify-center rounded-xl border-2 border-dashed p-6 text-center transition-colors ${
              dragActive
                ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-950/20'
                : 'border-gray-200 hover:border-blue-400 dark:border-gray-800'
            }`}
          >
            <input
              type="file"
              id="file-upload"
              className="hidden"
              onChange={handleFileChange}
              accept="image/*,application/pdf"
            />
            
            {isUploadingFile ? (
              <div className="space-y-2 py-4">
                <Loader2 className="h-10 w-10 text-blue-500 mx-auto animate-spin" />
                <p className="text-xs font-bold text-blue-600 animate-pulse">Mengunggah ke Google Drive...</p>
              </div>
            ) : fileAttachment ? (
              <div className="space-y-3 p-2">
                {isImageUrl(fileAttachment.url, fileAttachment.name) ? (
                  <div className="relative group mx-auto w-24 h-24 rounded-lg overflow-hidden border border-gray-200 dark:border-gray-800 shadow-sm bg-white dark:bg-gray-950 flex items-center justify-center">
                    <img
                      src={getImgSrcUrl(fileAttachment.url)}
                      alt="Thumbnail"
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1">
                      <button
                        type="button"
                        onClick={() => setIsPreviewOpen(true)}
                        className="p-1 rounded-full bg-white/95 text-gray-800 hover:scale-105 transition-transform shadow-xs"
                        title="Zoom File"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="mx-auto w-12 h-12 rounded-lg bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 flex items-center justify-center border border-blue-100/30">
                    <FileText className="h-6 w-6" />
                  </div>
                )}
                
                <div className="text-center">
                  <p className="text-xs font-bold text-gray-700 dark:text-gray-300 truncate max-w-[250px] mx-auto">{fileAttachment.name}</p>
                </div>

                <div className="flex flex-col items-center gap-1.5">
                  <div className="flex items-center justify-center gap-2">
                    <span className={`text-[9px] px-2 py-0.5 rounded font-black ${
                      fileUploadInfo 
                        ? 'bg-emerald-100 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 ring-1 ring-emerald-200' 
                        : fileAttachment.url.startsWith('data:')
                          ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300' 
                          : 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300'
                    }`}>
                      {fileUploadInfo ? 'Sukses ke Drive' : fileAttachment.url.startsWith('data:') ? 'Lokal (Base64)' : 'Google Drive'}
                    </span>
                    <button
                      type="button"
                      onClick={() => setIsPreviewOpen(true)}
                      className="inline-flex items-center gap-0.5 text-[10px] font-bold text-blue-600 hover:underline"
                    >
                      <Eye className="h-3 w-3" /> Lihat Preview
                    </button>
                    <span className="text-gray-300 dark:text-gray-700">•</span>
                    <button
                      type="button"
                      onClick={() => {
                        setFileAttachment(null);
                        setFileUploadError('');
                        setFileUploadInfo('');
                      }}
                      className="text-[10px] font-bold text-red-500 hover:underline"
                    >
                      Ganti File
                    </button>
                  </div>
                  {fileUploadInfo && (
                    <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold max-w-[280px] text-center leading-relaxed mt-0.5 bg-emerald-50/50 p-2 rounded-lg border border-emerald-100">
                      ✅ {fileUploadInfo}
                    </p>
                  )}
                  {fileUploadError && (
                    <p className="text-[10px] text-amber-600 dark:text-amber-400 font-medium max-w-[280px] text-center leading-relaxed mt-0.5">
                      ⚠️ {fileUploadError}
                    </p>
                  )}
                </div>
              </div>
            ) : (
              <label htmlFor="file-upload" className="cursor-pointer space-y-2">
                <Upload className="h-10 w-10 text-gray-400 mx-auto" />
                <p className="text-xs font-semibold text-gray-600 dark:text-gray-400">
                  Seret file ke sini atau <span className="text-blue-600 hover:underline">Pilih File</span>
                </p>
                <p className="text-[10px] text-gray-400">Foto unit, Kilometer, atau Dokumen Fisik (Max 5MB)</p>
              </label>
            )}
          </div>
        </div>

        {/* Submit */}
        <div className="flex justify-end gap-3 pt-4 border-t border-gray-100 dark:border-gray-800">
          <button
            type="submit"
            className="rounded-lg bg-blue-600 px-6 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-blue-700 focus:outline-hidden transition-colors"
          >
            Kirim Pengajuan FSR
          </button>
        </div>
      </form>

      {/* LIGHTBOX / FILE PREVIEW MODAL */}
      {isPreviewOpen && fileAttachment && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-xs p-4 animate-fade-in">
          <div className="relative w-full max-w-4xl bg-white dark:bg-gray-950 rounded-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden border border-gray-100 dark:border-gray-800 animate-zoom-in text-xs text-gray-700 dark:text-gray-300">
            
            {/* Header */}
            <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-800 px-5 py-4">
              <div>
                <h3 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2">
                  <FileText className="h-4 w-4 text-blue-500" />
                  Preview File: {fileAttachment.name}
                </h3>
                <p className="text-[10px] text-gray-400 mt-0.5">
                  Tipe: {isImageUrl(fileAttachment.url, fileAttachment.name) ? 'Gambar/Foto' : isPdfUrl(fileAttachment.url, fileAttachment.name) ? 'Dokumen PDF' : 'Dokumen'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsPreviewOpen(false)}
                className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-900 transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-auto bg-gray-50/50 dark:bg-gray-900/50 p-6 flex items-center justify-center min-h-[400px]">
              {isImageUrl(fileAttachment.url, fileAttachment.name) ? (
                <img
                  src={getImgSrcUrl(fileAttachment.url)}
                  alt={fileAttachment.name}
                  className="max-w-full max-h-[60vh] object-contain rounded-lg shadow-md border border-gray-200/50 dark:border-gray-800/80 bg-white dark:bg-gray-950"
                  referrerPolicy="no-referrer"
                />
              ) : isPdfUrl(fileAttachment.url, fileAttachment.name) ? (
                fileAttachment.url.startsWith('data:') ? (
                  <object
                    data={fileAttachment.url}
                    type="application/pdf"
                    className="w-full h-[60vh] rounded-lg shadow-md border border-gray-200/50"
                  >
                    <div className="text-center p-6 space-y-3 bg-white dark:bg-gray-950 rounded-xl border border-gray-100">
                      <FileText className="h-12 w-12 text-gray-300 mx-auto" />
                      <p className="text-xs text-gray-500 font-semibold">Browser Anda tidak mendukung preview PDF langsung.</p>
                      <a
                        href={fileAttachment.url}
                        download={fileAttachment.name}
                        className="inline-flex items-center gap-1.5 text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg"
                      >
                        Unduh PDF
                      </a>
                    </div>
                  </object>
                ) : (
                  <iframe
                    src={getEmbedUrl(fileAttachment.url)}
                    className="w-full h-[60vh] rounded-lg shadow-md border border-gray-200/50"
                    allow="autoplay"
                  ></iframe>
                )
              ) : (
                <div className="text-center p-8 bg-white dark:bg-gray-950 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm space-y-4 max-w-sm">
                  <FileText className="h-14 w-14 text-blue-500 mx-auto" />
                  <div className="space-y-1">
                    <p className="text-xs font-bold text-gray-800 dark:text-gray-200">{fileAttachment.name}</p>
                    <p className="text-[10px] text-gray-400">File tidak dapat dipreview secara langsung.</p>
                  </div>
                  <div className="flex gap-2">
                    <a
                      href={fileAttachment.url}
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
                href={getDownloadUrl(fileAttachment.url)}
                download={fileAttachment.name}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-4 py-2 text-xs font-bold text-gray-700 hover:bg-gray-50 dark:border-gray-800 dark:bg-gray-950 dark:text-gray-300 dark:hover:bg-gray-900 transition-colors"
              >
                Unduh File/Foto <Download className="h-3.5 w-3.5" />
              </a>
              <button
                type="button"
                onClick={() => setIsPreviewOpen(false)}
                className="rounded-lg bg-gray-100 hover:bg-gray-200 dark:bg-gray-900 dark:hover:bg-gray-800 px-5 py-2 text-xs font-bold text-gray-800 dark:text-gray-200 transition-colors"
              >
                Tutup
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  );
};
