/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  Search,
  SlidersHorizontal,
  Download,
  Printer,
  ChevronLeft,
  ChevronRight,
  Eye,
  Plus,
  Trash2,
  Calendar,
  Building2,
  Car,
  AlertTriangle,
  Clock,
  CheckCircle2,
  Wrench,
  FileText,
  XCircle
} from 'lucide-react';
import { localDb } from '../db/localDb';
import { Fsr, FsrStatus, ServiceCategory } from '../types';
import { useTheme } from './ThemeContext';
import { FsrDetail } from './FsrDetail';

export const FsrMonitoring: React.FC = () => {
  const { currentUser } = useTheme();
  
  const [fsrs, setFsrs] = useState<Fsr[]>([]);
  const [selectedFsrId, setSelectedFsrId] = useState<string | null>(null);
  const [fsrIdToDelete, setFsrIdToDelete] = useState<string | null>(null);

  // Search, Filter, Sort, Pagination States
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCabang, setFilterCabang] = useState(() => {
    if (currentUser?.cabang_handling && currentUser.cabang_handling !== 'All Branches' && currentUser.cabang_handling !== 'All') {
      return currentUser.cabang_handling;
    }
    return sessionStorage.getItem('monitoringFilterCabang') || '';
  });

  // Persist filter to sessionStorage when changed
  useEffect(() => {
    if (!currentUser?.cabang_handling || currentUser.cabang_handling === 'All Branches' || currentUser.cabang_handling === 'All') {
      sessionStorage.setItem('monitoringFilterCabang', filterCabang);
    }
  }, [filterCabang, currentUser]);
  const [filterStatus, setFilterStatus] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [filterCustomer, setFilterCustomer] = useState('');
  const [filterStartDate, setFilterStartDate] = useState('');
  const [filterEndDate, setFilterEndDate] = useState('');
  
  const [sortField, setSortField] = useState<keyof Fsr>('tanggal_create');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Unique lists for filtering dropdowns
  const [cabangOptions, setCabangOptions] = useState<string[]>([]);
  const [statusOptions, setStatusOptions] = useState<string[]>([]);
  const [customerOptions, setCustomerOptions] = useState<string[]>([]);

  const loadData = () => {
    let list = localDb.getFsrs(currentUser);

    // For Vendor, deduplicate FSRs with "Document" category by no_fsr so they see only 1 row in the main table
    if (currentUser.role_operation === 'Vendor') {
      const seenNoFsr = new Set<string>();
      list = list.filter(f => {
        if (f.kategori_layanan === 'Document') {
          if (seenNoFsr.has(f.no_fsr)) {
            return false;
          }
          seenNoFsr.add(f.no_fsr);
        }
        return true;
      });
    }

    setFsrs(list);

    // Extract unique values for filter dropdowns
    const dropdownList = localDb.getFsrs(currentUser);
    setCabangOptions(Array.from(new Set(dropdownList.map((f) => f.cabang))));
    setStatusOptions(Array.from(new Set(dropdownList.map((f) => f.status))));
    setCustomerOptions(Array.from(new Set(dropdownList.map((f) => f.nama_customer))));
  };

  useEffect(() => {
    if (currentUser?.cabang_handling && currentUser.cabang_handling !== 'All Branches' && currentUser.cabang_handling !== 'All') {
      setFilterCabang(currentUser.cabang_handling);
    } else {
      setFilterCabang(sessionStorage.getItem('monitoringFilterCabang') || '');
    }
    loadData();
    const handleDbUpdate = () => loadData();
    window.addEventListener('fsr_db_updated', handleDbUpdate);

    // Cross-tab interaction: check if there's an FSR selected from dashboard
    const savedFsrId = localStorage.getItem('selected_fsr_id');
    if (savedFsrId) {
      setSelectedFsrId(savedFsrId);
      localStorage.removeItem('selected_fsr_id');
    }

    const handleSelectDetail = (e: Event) => {
      const customEvent = e as CustomEvent<{ fsrId: string }>;
      if (customEvent.detail && customEvent.detail.fsrId) {
        setSelectedFsrId(customEvent.detail.fsrId);
      }
    };
    window.addEventListener('fsr_select_detail', handleSelectDetail);

    return () => {
      window.removeEventListener('fsr_db_updated', handleDbUpdate);
      window.removeEventListener('fsr_select_detail', handleSelectDetail);
    };
  }, [currentUser]);

  // Handle delete action (Super Admin/Role restriction)
  const handleDelete = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setFsrIdToDelete(id);
  };

  const confirmDelete = async () => {
    if (fsrIdToDelete) {
      await localDb.deleteFsr(fsrIdToDelete, currentUser);
      loadData();
      if (selectedFsrId === fsrIdToDelete) setSelectedFsrId(null);
      setFsrIdToDelete(null);
    }
  };

  // Searching & Filtering Logic
  const filteredFsrs = fsrs.filter((f) => {
    const matchSearch =
      f.no_fsr.toLowerCase().includes(searchTerm.toLowerCase()) ||
      f.no_polisi.toLowerCase().includes(searchTerm.toLowerCase()) ||
      f.nama_customer.toLowerCase().includes(searchTerm.toLowerCase()) ||
      f.type_kendaraan.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (f.no_spk && f.no_spk.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (f.no_vmd && f.no_vmd.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (f.nama_vendor && f.nama_vendor.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchCabang = filterCabang ? f.cabang === filterCabang : true;
    const matchStatus = filterStatus ? f.status === filterStatus : true;
    const matchCategory = filterCategory ? f.kategori_layanan === filterCategory : true;
    const matchCustomer = filterCustomer ? f.nama_customer === filterCustomer : true;

    // Date range check
    let matchDate = true;
    if (filterStartDate || filterEndDate) {
      if (f.tanggal_create) {
        const itemDate = new Date(f.tanggal_create).getTime();
        if (filterStartDate) {
          const start = new Date(filterStartDate).setHours(0, 0, 0, 0);
          if (itemDate < start) matchDate = false;
        }
        if (filterEndDate) {
          const end = new Date(filterEndDate).setHours(23, 59, 59, 999);
          if (itemDate > end) matchDate = false;
        }
      } else {
        matchDate = false; // if filtering by date and item has no date, exclude it
      }
    }

    return matchSearch && matchCabang && matchStatus && matchCategory && matchCustomer && matchDate;
  });

  // Categorize FSR statuses for Indonesian statistical summary cards
  const stats = React.useMemo(() => {
    let waiting = 0;
    let onProgress = 0;
    let finished = 0;
    let rejectedOrCancelled = 0;

    filteredFsrs.forEach((f) => {
      const status = f.status || '';
      if (status === 'Finished') {
        finished++;
      } else if (status === 'On Progress' || status === 'Approved Leader Customer') {
        onProgress++;
      } else if (status === 'Rejected' || status === 'Cancelled') {
        rejectedOrCancelled++;
      } else {
        // e.g. all "Waiting" statuses (Waiting Approval, Waiting Vendor, Waiting TS, Waiting SPK, Waiting Estimasi, etc.) and Negotiation
        waiting++;
      }
    });

    return {
      total: filteredFsrs.length,
      waiting,
      onProgress,
      finished,
      rejectedOrCancelled
    };
  }, [filteredFsrs]);

  // Sorting Logic
  const sortedFsrs = [...filteredFsrs].sort((a, b) => {
    let fieldA = a[sortField];
    let fieldB = b[sortField];

    if (fieldA === undefined || fieldA === null) return sortOrder === 'asc' ? 1 : -1;
    if (fieldB === undefined || fieldB === null) return sortOrder === 'asc' ? -1 : 1;

    if (typeof fieldA === 'string' && typeof fieldB === 'string') {
      return sortOrder === 'asc'
        ? fieldA.localeCompare(fieldB)
        : fieldB.localeCompare(fieldA);
    } else {
      // Numbers or boolean
      return sortOrder === 'asc'
        ? (fieldA as any) - (fieldB as any)
        : (fieldB as any) - (fieldA as any);
    }
  });

  // Pagination calculations
  const totalItems = sortedFsrs.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage) || 1;
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedFsrs = sortedFsrs.slice(startIndex, startIndex + itemsPerPage);

  const handleSort = (field: keyof Fsr) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
    setCurrentPage(1);
  };

  // 📝 EXPORT EXCEL (Executive Management Template)
  const exportToExcel = () => {
    const totalFsr = filteredFsrs.length;
    const totalCost = filteredFsrs.reduce((sum, f) => sum + (f.estimasi_biaya || 0), 0);
    const printedAt = new Date().toLocaleString('id-ID', { dateStyle: 'long', timeStyle: 'short' });

    const htmlRows = filteredFsrs.map((f, idx) => {
      const isEven = idx % 2 === 1;
      const formattedCost = f.estimasi_biaya ? `Rp ${f.estimasi_biaya.toLocaleString('id-ID')}` : 'Rp 0';
      const formattedKm = f.kategori_layanan === 'Document' ? '-' : (f.km_pengajuan ? f.km_pengajuan.toLocaleString('id-ID') : '0');
      const formattedDate = f.tanggal_create ? new Date(f.tanggal_create).toLocaleDateString('id-ID', { day: '2-digit', month: '2-digit', year: 'numeric' }) : '-';
      const formattedSelesai = f.tanggal_selesai_perbaikan ? new Date(f.tanggal_selesai_perbaikan).toLocaleDateString('id-ID', { day: '2-digit', month: '2-digit', year: 'numeric' }) : '-';

      // Status styling based on status
      let statusBg = '#FFFBEB';
      let statusText = '#B45309';
      if (f.status === 'Finished') {
        statusBg = '#ECFDF5';
        statusText = '#047857';
      } else if (f.status.includes('Approved')) {
        statusBg = '#EFF6FF';
        statusText = '#1D4ED8';
      } else if (f.status === 'Cancelled' || f.status === 'Rejected') {
        statusBg = '#FEF2F2';
        statusText = '#B91C1C';
      } else if (f.status === 'Negotiation') {
        statusBg = '#FFF7ED';
        statusText = '#C2410C';
      } else if (f.status.includes('Progress')) {
        statusBg = '#F0FDF4';
        statusText = '#15803D';
      }

      return `
        <tr class="${isEven ? 'even' : 'odd'}" style="font-size: 11px;">
          <td class="center" style="border: 1px solid #CBD5E1; padding: 6px; text-align: center;">${idx + 1}</td>
          <td style="border: 1px solid #CBD5E1; padding: 6px; font-weight: bold; mso-number-format:'\\@';">${f.no_fsr}</td>
          <td class="center" style="border: 1px solid #CBD5E1; padding: 6px; text-align: center;">${formattedDate}</td>
          <td style="border: 1px solid #CBD5E1; padding: 6px;">${f.nama_customer || '-'}</td>
          <td style="border: 1px solid #CBD5E1; padding: 6px;">${f.cabang || '-'}</td>
          <td class="center" style="border: 1px solid #CBD5E1; padding: 6px; text-align: center; font-weight: bold; mso-number-format:'\\@';">${f.no_polisi || '-'}</td>
          <td style="border: 1px solid #CBD5E1; padding: 6px;">${f.type_kendaraan || '-'}</td>
          <td style="border: 1px solid #CBD5E1; padding: 6px; mso-number-format:'\\@';">${f.no_rangka || '-'}</td>
          <td class="number" style="border: 1px solid #CBD5E1; padding: 6px; text-align: right;">${formattedKm}</td>
          <td class="center" style="border: 1px solid #CBD5E1; padding: 6px; text-align: center;">${f.kategori_layanan || '-'}</td>
          <td style="border: 1px solid #CBD5E1; padding: 6px;">${f.jenis_layanan || '-'}</td>
          <td class="status" style="border: 1px solid #CBD5E1; padding: 6px; text-align: center; background-color: ${statusBg}; color: ${statusText}; font-weight: bold;">${f.status}</td>
          <td class="center" style="border: 1px solid #CBD5E1; padding: 6px; text-align: center; mso-number-format:'\\@';">${f.no_spk || '-'}</td>
          <td style="border: 1px solid #CBD5E1; padding: 6px;">${f.nama_vendor || '-'}</td>
          <td class="number" style="border: 1px solid #CBD5E1; padding: 6px; text-align: right; font-weight: bold;">${formattedCost}</td>
          <td class="center" style="border: 1px solid #CBD5E1; padding: 6px; text-align: center;">${formattedSelesai}</td>
        </tr>
      `;
    }).join('');

    const excelHtml = `
      <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
      <head>
        <!--[if gte mso 9]>
        <xml>
          <x:ExcelWorkbook>
            <x:ExcelWorksheets>
              <x:ExcelWorksheet>
                <x:Name>Laporan Monitoring FSR</x:Name>
                <x:WorksheetOptions>
                  <x:DisplayGridlines/>
                </x:WorksheetOptions>
              </x:ExcelWorksheet>
            </x:ExcelWorksheets>
          </x:ExcelWorkbook>
        </xml>
        <![endif]-->
        <meta http-equiv="content-type" content="application/vnd.ms-excel; charset=UTF-8">
        <style>
          body { font-family: 'Segoe UI', Arial, sans-serif; color: #1E293B; }
          .title-text { font-size: 16pt; font-weight: bold; text-align: center; color: #0F172A; }
          .subtitle-text { font-size: 11pt; text-align: center; color: #475569; }
          .meta-label { font-weight: bold; color: #334155; font-size: 10pt; }
          .meta-value { color: #0F172A; font-size: 10pt; }
          table.report-table { border-collapse: collapse; width: 100%; }
          table.report-table th { background-color: #0F172A; color: #FFFFFF; font-weight: bold; border: 1px solid #CBD5E1; text-align: center; padding: 10px; font-size: 10pt; }
          tr.even { background-color: #F8FAFC; }
          tr.odd { background-color: #FFFFFF; }
          .footer-summary { background-color: #F1F5F9; font-weight: bold; font-size: 10pt; }
        </style>
      </head>
      <body>
        <table>
          <tr><td colspan="16" class="title-text">LAPORAN MONITORING FLEET SERVICE REQUEST (FSR)</td></tr>
          <tr><td colspan="16" class="subtitle-text">MANAJEMEN FLEET & MONITORING PERBAIKAN UNIT</td></tr>
          <tr><td colspan="16"></td></tr>
          
          <!-- Metadata Info Row -->
          <tr>
            <td class="meta-label">Total FSR:</td>
            <td class="meta-value" colspan="2">${totalFsr} Unit</td>
            <td class="meta-label">Total Estimasi:</td>
            <td class="meta-value" colspan="3">Rp ${totalCost.toLocaleString('id-ID')}</td>
            <td class="meta-label">Tanggal Cetak:</td>
            <td class="meta-value" colspan="8">${printedAt}</td>
          </tr>
          <tr><td colspan="16"></td></tr>
        </table>

        <table class="report-table">
          <thead>
            <tr>
              <th style="background-color: #1E293B; color: #FFFFFF; width: 40px;">No.</th>
              <th style="background-color: #1E293B; color: #FFFFFF; width: 120px;">No FSR</th>
              <th style="background-color: #1E293B; color: #FFFFFF; width: 100px;">Tgl Pengajuan</th>
              <th style="background-color: #1E293B; color: #FFFFFF; width: 180px;">Nama Customer</th>
              <th style="background-color: #1E293B; color: #FFFFFF; width: 120px;">Cabang</th>
              <th style="background-color: #1E293B; color: #FFFFFF; width: 100px;">No Polisi</th>
              <th style="background-color: #1E293B; color: #FFFFFF; width: 160px;">Tipe Unit</th>
              <th style="background-color: #1E293B; color: #FFFFFF; width: 140px;">No Rangka</th>
              <th style="background-color: #1E293B; color: #FFFFFF; width: 100px;">KM Pengajuan</th>
              <th style="background-color: #1E293B; color: #FFFFFF; width: 120px;">Kategori</th>
              <th style="background-color: #1E293B; color: #FFFFFF; width: 150px;">Jenis Layanan</th>
              <th style="background-color: #1E293B; color: #FFFFFF; width: 150px;">Status FSR</th>
              <th style="background-color: #1E293B; color: #FFFFFF; width: 120px;">No SPK</th>
              <th style="background-color: #1E293B; color: #FFFFFF; width: 160px;">Vendor Pelaksana</th>
              <th style="background-color: #1E293B; color: #FFFFFF; width: 130px;">Estimasi Biaya</th>
              <th style="background-color: #1E293B; color: #FFFFFF; width: 100px;">Tgl Selesai</th>
            </tr>
          </thead>
          <tbody>
            ${htmlRows}
            <!-- Footer Summary Row -->
            <tr class="footer-summary" style="background-color: #E2E8F0; font-weight: bold; font-size: 11px;">
              <td colspan="14" style="border: 1px solid #CBD5E1; padding: 10px; text-align: right;">TOTAL ESTIMASI BIAYA MONITORING:</td>
              <td style="border: 1px solid #CBD5E1; padding: 10px; text-align: right; color: #0F172A;">Rp ${totalCost.toLocaleString('id-ID')}</td>
              <td style="border: 1px solid #CBD5E1; padding: 10px;"></td>
            </tr>
          </tbody>
        </table>
      </body>
      </html>
    `;

    const blob = new Blob([excelHtml], { type: 'application/vnd.ms-excel;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Laporan_FSR_Monitoring_${new Date().toISOString().slice(0, 10)}.xls`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // 🖨️ PRINT / PDF TRIGGER
  const triggerPrint = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const totalCost = filteredFsrs.reduce((sum, f) => sum + (f.estimasi_biaya || 0), 0);
    const printedAt = new Date().toLocaleString('id-ID', { dateStyle: 'long', timeStyle: 'short' });

    const htmlRows = filteredFsrs
      .map((f, idx) => {
        const formattedCost = f.estimasi_biaya ? `Rp ${f.estimasi_biaya.toLocaleString('id-ID')}` : 'Rp 0';
        const formattedKm = f.kategori_layanan === 'Document' ? '-' : (f.km_pengajuan ? f.km_pengajuan.toLocaleString('id-ID') : '0');
        const formattedDate = f.tanggal_create ? new Date(f.tanggal_create).toLocaleDateString('id-ID', { day: '2-digit', month: '2-digit', year: 'numeric' }) : '-';
        const formattedSelesai = f.tanggal_selesai_perbaikan ? new Date(f.tanggal_selesai_perbaikan).toLocaleDateString('id-ID', { day: '2-digit', month: '2-digit', year: 'numeric' }) : '-';

        let statusClass = "status-draft";
        if (f.status === 'Finished') {
          statusClass = "status-finished";
        } else if (f.status.includes('Approved')) {
          statusClass = "status-approved";
        } else if (f.status === 'Cancelled' || f.status === 'Rejected') {
          statusClass = "status-rejected";
        } else if (f.status === 'Negotiation') {
          statusClass = "status-negosiasi";
        } else if (f.status.includes('Progress')) {
          statusClass = "status-progress";
        }

        return `
          <tr style="font-size: 10px;">
            <td style="text-align: center; font-weight: bold; width: 30px;">${idx + 1}</td>
            <td style="font-weight: bold; color: #1E293B;">${f.no_fsr}</td>
            <td style="text-align: center;">${formattedDate}</td>
            <td>${f.nama_customer}</td>
            <td>${f.cabang}</td>
            <td style="text-align: center; font-weight: 600;">${f.no_polisi}</td>
            <td>${f.type_kendaraan}</td>
            <td style="text-align: right;">${formattedKm}</td>
            <td style="text-align: center;">${f.kategori_layanan}</td>
            <td><span class="status-badge ${statusClass}">${f.status}</span></td>
            <td>${f.no_spk || '-'}</td>
            <td>${f.nama_vendor || '-'}</td>
            <td style="text-align: right; font-weight: 600;">${formattedCost}</td>
            <td style="text-align: center;">${formattedSelesai}</td>
          </tr>
        `;
      })
      .join('');

    printWindow.document.write(`
      <html>
        <head>
          <title>Fleet Service Request - Executive Report</title>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
            @page {
              size: A4 landscape;
              margin: 10mm;
            }
            body { 
              font-family: 'Inter', sans-serif; 
              color: #1E293B; 
              margin: 0; 
              padding: 0;
              background-color: #FFFFFF;
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
            }
            .header-container {
              border-bottom: 3px double #CBD5E1;
              padding-bottom: 12px;
              margin-bottom: 15px;
            }
            .company-title {
              font-size: 18px;
              font-weight: 800;
              color: #0F172A;
              text-transform: uppercase;
              letter-spacing: 0.5px;
              margin: 0;
            }
            .report-subtitle {
              font-size: 11px;
              color: #64748B;
              font-weight: 500;
              margin: 3px 0 0 0;
            }
            .summary-cards {
              display: grid;
              grid-template-columns: repeat(3, 1fr);
              gap: 15px;
              margin-bottom: 20px;
            }
            .card {
              background-color: #F8FAFC;
              border: 1px solid #E2E8F0;
              border-radius: 6px;
              padding: 10px 15px;
            }
            .card-label {
              font-size: 9px;
              text-transform: uppercase;
              font-weight: 700;
              color: #64748B;
              letter-spacing: 0.5px;
            }
            .card-value {
              font-size: 16px;
              font-weight: 700;
              color: #0F172A;
              margin-top: 2px;
            }
            table { 
              width: 100%; 
              border-collapse: collapse; 
              margin-top: 10px;
            }
            thead {
              display: table-header-group;
            }
            tr {
              page-break-inside: avoid;
            }
            th { 
              background-color: #0F172A !important; 
              color: #FFFFFF !important;
              text-transform: uppercase;
              font-size: 9px; 
              font-weight: 700; 
              text-align: left; 
              padding: 8px 6px; 
              border: 1px solid #1E293B;
              letter-spacing: 0.5px;
            }
            td { 
              padding: 6px; 
              font-size: 10px; 
              border: 1px solid #E2E8F0;
              color: #334155;
            }
            tbody tr:nth-child(even) {
              background-color: #F8FAFC !important;
            }
            .status-badge {
              display: inline-block;
              padding: 2px 6px;
              font-size: 8px;
              font-weight: 700;
              text-transform: uppercase;
              border-radius: 4px;
              text-align: center;
              white-space: nowrap;
            }
            .status-draft { background-color: #FEF3C7 !important; color: #92400E !important; }
            .status-approved { background-color: #DBEAFE !important; color: #1E40AF !important; }
            .status-finished { background-color: #D1FAE5 !important; color: #065F46 !important; }
            .status-rejected { background-color: #FEE2E2 !important; color: #991B1B !important; }
            .status-negosiasi { background-color: #FFEDD5 !important; color: #C2410C !important; }
            .status-progress { background-color: #F0FDF4 !important; color: #15803D !important; }
            
            .total-row {
              background-color: #E2E8F0 !important;
              font-weight: bold;
            }
            .total-row td {
              border-top: 2px solid #94A3B8;
              font-size: 11px;
              color: #0F172A;
            }
          </style>
        </head>
        <body>
          <div class="header-container">
            <h1 class="company-title">Laporan Monitoring Fleet Service Request (FSR)</h1>
            <p class="report-subtitle">Sistem Informasi Manajemen Fleet - Dashboard Perbaikan & Pengurusan Dokumen</p>
          </div>

          <div class="summary-cards">
            <div class="card">
              <div class="card-label">Total Permintaan (FSR)</div>
              <div class="card-value">${filteredFsrs.length} Unit</div>
            </div>
            <div class="card">
              <div class="card-label">Total Estimasi Biaya</div>
              <div class="card-value">Rp ${totalCost.toLocaleString('id-ID')}</div>
            </div>
            <div class="card">
              <div class="card-label">Dicetak Pada</div>
              <div class="card-value" style="font-size: 12px; font-weight: 500; margin-top: 6px;">${printedAt}</div>
            </div>
          </div>

          <table>
            <thead>
              <tr>
                <th style="text-align: center;">No.</th>
                <th>No FSR</th>
                <th style="text-align: center;">Tgl Masuk</th>
                <th>Customer</th>
                <th>Cabang</th>
                <th style="text-align: center;">No Polisi</th>
                <th>Tipe Unit</th>
                <th style="text-align: right;">KM</th>
                <th style="text-align: center;">Kategori</th>
                <th>Status</th>
                <th>No SPK</th>
                <th>Vendor</th>
                <th style="text-align: right;">Estimasi</th>
                <th style="text-align: center;">Tgl Selesai</th>
              </tr>
            </thead>
            <tbody>
              ${htmlRows}
              <tr class="total-row">
                <td colspan="12" style="text-align: right; padding: 10px; font-weight: bold;">TOTAL ESTIMASI BIAYA:</td>
                <td style="text-align: right; padding: 10px; font-weight: bold; font-size: 11px; color: #0F172A;">Rp ${totalCost.toLocaleString('id-ID')}</td>
                <td></td>
              </tr>
            </tbody>
          </table>

          <script>
            window.onload = function() { 
              setTimeout(function() {
                window.print(); 
                window.close(); 
              }, 300);
            }
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  // Helper status color badge
  const getStatusBadge = (status: string) => {
    const base = "inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[9px] font-bold ";
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

  return (
    <div className="space-y-6 flex-1">
      {/* Summary Cards Section */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total FSR */}
        <div className="rounded-xl border border-gray-100 bg-white p-4 shadow-xs dark:border-gray-800 dark:bg-gray-950 flex items-center justify-between transition-all hover:shadow-md">
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider block">Total FSR</span>
            <div className="flex items-baseline gap-1.5">
              <span className="text-xl md:text-2xl font-black text-gray-900 dark:text-white">{stats.total}</span>
              <span className="text-xs text-gray-400 dark:text-gray-500 font-medium">unit</span>
            </div>
          </div>
          <div className="h-10 w-10 rounded-lg bg-gray-50 dark:bg-gray-900/60 flex items-center justify-center text-gray-400 dark:text-gray-500">
            <FileText className="h-5 w-5" />
          </div>
        </div>

        {/* Card 2: Menunggu */}
        <div className="rounded-xl border border-amber-100/60 bg-amber-50/20 p-4 shadow-xs dark:border-amber-950/40 dark:bg-amber-950/10 flex items-center justify-between transition-all hover:shadow-md">
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider block">Menunggu</span>
            <div className="flex items-baseline gap-1.5">
              <span className="text-xl md:text-2xl font-black text-amber-700 dark:text-amber-400">{stats.waiting}</span>
              <span className="text-xs text-amber-500 dark:text-amber-500/80 font-semibold">antrean</span>
            </div>
          </div>
          <div className="h-10 w-10 rounded-lg bg-amber-50 dark:bg-amber-950/40 flex items-center justify-center text-amber-500 dark:text-amber-400">
            <Clock className="h-5 w-5" />
          </div>
        </div>

        {/* Card 3: Dalam Pengerjaan */}
        <div className="rounded-xl border border-blue-100/60 bg-blue-50/20 p-4 shadow-xs dark:border-blue-950/40 dark:bg-blue-950/10 flex items-center justify-between transition-all hover:shadow-md">
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider block">Dalam Pengerjaan</span>
            <div className="flex items-baseline gap-1.5">
              <span className="text-xl md:text-2xl font-black text-blue-700 dark:text-blue-400">{stats.onProgress}</span>
              <span className="text-xs text-blue-500 dark:text-blue-500/80 font-semibold">proses</span>
            </div>
          </div>
          <div className="h-10 w-10 rounded-lg bg-blue-50 dark:bg-blue-950/40 flex items-center justify-center text-blue-500 dark:text-blue-400">
            <Wrench className="h-5 w-5" />
          </div>
        </div>

        {/* Card 4: Selesai */}
        <div className="rounded-xl border border-emerald-100/60 bg-emerald-50/20 p-4 shadow-xs dark:border-emerald-950/40 dark:bg-emerald-950/10 flex items-center justify-between transition-all hover:shadow-md">
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider block">Selesai</span>
            <div className="flex items-baseline gap-1.5">
              <span className="text-xl md:text-2xl font-black text-emerald-700 dark:text-emerald-400">{stats.finished}</span>
              <span className="text-xs text-emerald-500 dark:text-emerald-500/80 font-semibold">sukses</span>
            </div>
          </div>
          <div className="h-10 w-10 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 flex items-center justify-center text-emerald-500 dark:text-emerald-400">
            <CheckCircle2 className="h-5 w-5" />
          </div>
        </div>
      </div>

      <div className="flex gap-6 relative">
      {/* List Table Container */}
      <div className="flex-1 rounded-2xl border border-gray-100 bg-white shadow-xs dark:border-gray-800 dark:bg-gray-950 overflow-hidden">
        
        {/* Search & Action Controls */}
        <div className="p-6 border-b border-gray-100 dark:border-gray-800 space-y-4">
          <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
            {/* Search Input */}
            <div className="relative w-full sm:max-w-md">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search FSR, Plat No, Customer, Vendor, SPK..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full rounded-lg border border-gray-200 bg-white pl-9 pr-4 py-2 text-xs focus:border-blue-500 focus:outline-hidden dark:border-gray-800 dark:bg-gray-950 dark:text-white"
              />
            </div>

            {/* Print and Export Utilities */}
            <div className="flex gap-2 w-full sm:w-auto justify-end">
              <button
                onClick={exportToExcel}
                className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3.5 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50 dark:border-gray-800 dark:bg-gray-950 dark:text-gray-300 dark:hover:bg-gray-900 transition-colors"
              >
                <Download className="h-4 w-4" /> Export Excel
              </button>
              <button
                onClick={triggerPrint}
                className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3.5 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50 dark:border-gray-800 dark:bg-gray-950 dark:text-gray-300 dark:hover:bg-gray-900 transition-colors"
              >
                <Printer className="h-4 w-4" /> Print / PDF
              </button>
            </div>
          </div>

          {/* Filtering Bento Row */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {/* Cabang Filter */}
            <div className="space-y-1">
              <span className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase">Cabang</span>
              <select
                value={filterCabang}
                onChange={(e) => { setFilterCabang(e.target.value); setCurrentPage(1); }}
                disabled={!!(currentUser?.cabang_handling && currentUser.cabang_handling !== 'All Branches' && currentUser.cabang_handling !== 'All')}
                className="w-full rounded-lg border border-gray-200 bg-white p-1.5 text-[11px] focus:outline-hidden dark:border-gray-800 dark:bg-gray-950 dark:text-white disabled:bg-slate-50 disabled:text-slate-500 dark:disabled:bg-slate-900/40 dark:disabled:text-slate-400 font-medium"
              >
                {currentUser?.cabang_handling && currentUser.cabang_handling !== 'All Branches' && currentUser.cabang_handling !== 'All' ? (
                  <option value={currentUser.cabang_handling}>{currentUser.cabang_handling} (Auto-Filter)</option>
                ) : (
                  <>
                    <option value="">Semua Cabang</option>
                    {cabangOptions.map((opt) => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                  </>
                )}
              </select>
            </div>

            {/* Start Date Filter */}
            <div className="space-y-1">
              <span className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase">Tanggal Mulai</span>
              <input
                type="date"
                value={filterStartDate}
                onChange={(e) => { setFilterStartDate(e.target.value); setCurrentPage(1); }}
                className="w-full rounded-lg border border-gray-200 bg-white p-1.5 text-[11px] focus:outline-hidden dark:border-gray-800 dark:bg-gray-950 dark:text-white"
              />
            </div>

            {/* End Date Filter */}
            <div className="space-y-1">
              <span className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase">Tanggal Selesai</span>
              <input
                type="date"
                value={filterEndDate}
                onChange={(e) => { setFilterEndDate(e.target.value); setCurrentPage(1); }}
                className="w-full rounded-lg border border-gray-200 bg-white p-1.5 text-[11px] focus:outline-hidden dark:border-gray-800 dark:bg-gray-950 dark:text-white"
              />
            </div>

            {/* Customer Filter */}
            <div className="space-y-1">
              <span className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase">Customer</span>
              <select
                value={filterCustomer}
                onChange={(e) => { setFilterCustomer(e.target.value); setCurrentPage(1); }}
                className="w-full rounded-lg border border-gray-200 bg-white p-1.5 text-[11px] focus:outline-hidden dark:border-gray-800 dark:bg-gray-950 dark:text-white animate-fade-in"
              >
                <option value="">Semua Customer</option>
                {customerOptions.map((opt) => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>
            </div>

            {/* Kategori Filter */}
            <div className="space-y-1">
              <span className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase">Kategori Layanan</span>
              <select
                value={filterCategory}
                onChange={(e) => { setFilterCategory(e.target.value); setCurrentPage(1); }}
                className="w-full rounded-lg border border-gray-200 bg-white p-1.5 text-[11px] focus:outline-hidden dark:border-gray-800 dark:bg-gray-950 dark:text-white"
              >
                {currentUser?.role_operation === 'SA' || currentUser?.role_operation === 'SS' ? (
                  <>
                    <option value="">Semua Kategori (Maintenance & Body Repair)</option>
                    <option value="Maintenance">Maintenance</option>
                    <option value="Body Repair">Body Repair</option>
                  </>
                ) : currentUser?.role_operation === 'VRO' ? (
                  <option value="Document">Document</option>
                ) : currentUser?.role_operation === 'TS' ? (
                  <option value="Maintenance">Maintenance</option>
                ) : (
                  <>
                    <option value="">Semua Kategori</option>
                    <option value="Maintenance">Maintenance</option>
                    <option value="Body Repair">Body Repair</option>
                    <option value="Document">Document</option>
                  </>
                )}
              </select>
            </div>

            {/* Status Filter */}
            <div className="space-y-1">
              <span className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase">Status</span>
              <select
                value={filterStatus}
                onChange={(e) => { setFilterStatus(e.target.value); setCurrentPage(1); }}
                className="w-full rounded-lg border border-gray-200 bg-white p-1.5 text-[11px] focus:outline-hidden dark:border-gray-800 dark:bg-gray-950 dark:text-white"
              >
                <option value="">Semua Status</option>
                {statusOptions.map((opt) => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Mobile-First Cards View (Visible on mobile screens, hidden on desktop) */}
        <div className="md:hidden divide-y divide-gray-150/40 bg-white dark:bg-gray-950">
          {paginatedFsrs.length === 0 ? (
            <div className="p-8 text-center text-gray-400 text-xs dark:text-gray-500">
              Tidak ada data FSR ditemukan.
            </div>
          ) : (
            paginatedFsrs.map((item) => (
              <div
                key={item.id}
                className={`p-4 border-b border-gray-100 dark:border-gray-800 transition-colors ${
                  selectedFsrId === item.id ? 'bg-blue-50/20 dark:bg-blue-950/20' : ''
                }`}
              >
                <div
                  onClick={() => setSelectedFsrId(item.id)}
                  className="cursor-pointer active:opacity-80 transition-opacity"
                >
                  <div className="flex justify-between items-start mb-2">
                    <span className="font-mono font-black text-xs text-brand-600 dark:text-brand-400">
                      {item.no_fsr}
                    </span>
                    <span className={getStatusBadge(item.status)}>{item.status}</span>
                  </div>
                  
                  <div className="space-y-1 text-xs">
                    <div className="flex justify-between">
                      <span className="text-gray-400 dark:text-gray-500">Customer:</span>
                      <span className="font-bold text-gray-800 dark:text-gray-200 truncate max-w-[180px]">{item.nama_customer}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400 dark:text-gray-500">Plat / Unit:</span>
                      <span className="font-semibold text-slate-700 dark:text-slate-300">{item.no_polisi} - {item.type_kendaraan}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400 dark:text-gray-500">Layanan:</span>
                      <span className="text-slate-600 dark:text-slate-400">{item.kategori_layanan} ({item.jenis_layanan})</span>
                    </div>
                    <div className="flex justify-between items-baseline pt-1">
                      <span className="text-gray-400 dark:text-gray-500">Estimasi:</span>
                      <span className="text-xs font-black text-slate-800 dark:text-slate-200">
                        {item.estimasi_biaya ? `Rp ${item.estimasi_biaya.toLocaleString('id-ID')}` : '-'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Mobile Action Buttons */}
                <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-800/80 flex items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedFsrId(item.id)}
                    className="flex-1 flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900 text-gray-700 dark:text-gray-300 text-xs font-semibold hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                  >
                    <Eye className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
                    <span>Detail</span>
                  </button>

                  {(currentUser.role_operation === 'Super Admin' ||
                    currentUser.role_operation === 'Admin Customer' ||
                    currentUser.role_operation === 'Leader Customer' ||
                    currentUser.role_operation === 'Leader Operation') && (
                    <button
                      type="button"
                      onClick={(e) => handleDelete(e, item.id)}
                      className="flex items-center justify-center gap-1.5 py-1.5 px-3.5 rounded-lg border border-red-200 dark:border-red-900/50 bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400 text-xs font-semibold hover:bg-red-100 dark:hover:bg-red-900/40 active:scale-95 transition-all"
                      title="Hapus FSR"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      <span>Hapus</span>
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Desktop DataTable (Hidden on mobile screens, visible on desktop) */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/50 text-gray-400 dark:border-gray-800 dark:bg-gray-900/10">
                <th onClick={() => handleSort('no_fsr')} className="p-4 font-bold cursor-pointer hover:text-gray-600">
                  No FSR {sortField === 'no_fsr' && (sortOrder === 'asc' ? '▲' : '▼')}
                </th>
                <th onClick={() => handleSort('tanggal_create')} className="p-4 font-bold cursor-pointer hover:text-gray-600">
                  Tanggal {sortField === 'tanggal_create' && (sortOrder === 'asc' ? '▲' : '▼')}
                </th>
                <th className="p-4 font-bold">Customer / Plat Unit</th>
                <th className="p-4 font-bold">Layanan / Deskripsi</th>
                <th onClick={() => handleSort('status')} className="p-4 font-bold cursor-pointer hover:text-gray-600">
                  Status {sortField === 'status' && (sortOrder === 'asc' ? '▲' : '▼')}
                </th>
                <th className="p-4 font-bold">SPK / Pelaksana</th>
                <th onClick={() => handleSort('estimasi_biaya')} className="p-4 font-bold cursor-pointer hover:text-gray-600 text-right">
                  Estimasi Biaya {sortField === 'estimasi_biaya' && (sortOrder === 'asc' ? '▲' : '▼')}
                </th>
                <th className="p-4 font-bold text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {paginatedFsrs.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-10 text-center text-gray-400">
                    No matching FSR records found.
                  </td>
                </tr>
              ) : (
                paginatedFsrs.map((item) => (
                  <tr
                    key={item.id}
                    onClick={() => setSelectedFsrId(item.id)}
                    className={`cursor-pointer hover:bg-gray-50/50 dark:hover:bg-gray-900/30 transition-colors ${
                      selectedFsrId === item.id ? 'bg-blue-50/20 dark:bg-blue-950/20' : ''
                    }`}
                  >
                    <td className="p-4 font-mono font-bold text-gray-800 dark:text-gray-200">
                      {item.no_fsr}
                    </td>
                    <td className="p-4 text-gray-500 dark:text-gray-400">
                      {new Date(item.tanggal_create).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}
                    </td>
                    <td className="p-4">
                      <div className="space-y-0.5">
                        <span className="block font-bold text-gray-800 dark:text-gray-200 truncate max-w-44">
                          {item.nama_customer}
                        </span>
                        <span className="inline-flex items-center gap-1 rounded bg-blue-50 px-1.5 py-0.5 text-[9px] font-bold text-blue-600 dark:bg-blue-950/40 dark:text-blue-400">
                          <Car className="h-2.5 w-2.5" />
                          {item.no_polisi}
                        </span>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="space-y-0.5 text-gray-500 dark:text-gray-400">
                        <span className="block font-bold text-gray-700 dark:text-gray-300">
                          {item.kategori_layanan} - {item.jenis_layanan}
                        </span>
                        <span className="block text-[10px] truncate max-w-48">
                          {item.keterangan}
                        </span>
                      </div>
                    </td>
                    <td className="p-4">
                      <span className={getStatusBadge(item.status)}>{item.status}</span>
                    </td>
                    <td className="p-4">
                      <div className="space-y-0.5 text-[11px] text-gray-500 dark:text-gray-400">
                        {item.no_spk ? (
                          <>
                            <span className="block font-mono font-semibold text-gray-700 dark:text-gray-300">
                              {item.no_spk}
                            </span>
                            <span className="block text-[10px] truncate max-w-40 font-medium">
                              {item.nama_vendor ? (
                                <>
                                  {item.nama_vendor}
                                  {item.no_vmd && <span className="font-mono text-blue-600 dark:text-blue-400 font-bold ml-1">({item.no_vmd})</span>}
                                </>
                              ) : (
                                item.nama_ts
                              )}
                            </span>
                          </>
                        ) : (
                          <span className="text-gray-300 dark:text-gray-600 italic">Unassigned</span>
                        )}
                      </div>
                    </td>
                    <td className="p-4 text-right font-bold text-gray-800 dark:text-gray-200">
                      {item.estimasi_biaya ? `Rp ${item.estimasi_biaya.toLocaleString()}` : '-'}
                    </td>
                    <td className="p-4 text-center">
                      <div className="flex justify-center items-center gap-1.5">
                        <button
                          onClick={() => setSelectedFsrId(item.id)}
                          className="rounded-md p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-800"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        {(currentUser.role_operation === 'Super Admin' ||
                          currentUser.role_operation === 'Admin Customer' ||
                          currentUser.role_operation === 'Leader Customer' ||
                          currentUser.role_operation === 'Leader Operation') && (
                          <button
                            onClick={(e) => handleDelete(e, item.id)}
                            className="rounded-md p-1.5 text-gray-400 hover:bg-gray-100 hover:text-red-600 dark:hover:bg-gray-800"
                            title="Hapus FSR"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Table Pagination Controls */}
        <div className="flex items-center justify-between border-t border-gray-100 p-4 dark:border-gray-800 bg-white dark:bg-gray-950">
          <span className="text-[10px] text-gray-400">
            Showing {Math.min(startIndex + 1, totalItems)} to {Math.min(startIndex + itemsPerPage, totalItems)} of {totalItems} entries
          </span>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="rounded-lg p-1.5 border border-gray-200 text-gray-400 hover:bg-gray-50 disabled:opacity-40 dark:border-gray-800 dark:hover:bg-gray-900 transition-colors"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="px-3 py-1 text-xs font-bold text-gray-700 dark:text-gray-300">
              {currentPage} of {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="rounded-lg p-1.5 border border-gray-200 text-gray-400 hover:bg-gray-50 disabled:opacity-40 dark:border-gray-800 dark:hover:bg-gray-900 transition-colors"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>

      </div>

      {/* 50% Right Side workflow detail drawer */}
      {selectedFsrId && (
        <div className="hidden lg:block w-[460px] shrink-0 sticky top-20 self-start">
          <FsrDetail
            fsrId={selectedFsrId}
            onClose={() => setSelectedFsrId(null)}
            onWorkflowProcessed={() => {
              loadData(); // Reload table row items
            }}
          />
        </div>
      )}

      {/* Mobile view responsive floating modal for FsrDetail - Premium Native Bottom Sheet Slide-Up */}
      {selectedFsrId && (
        <div className="lg:hidden fixed inset-0 z-50 flex items-end justify-center bg-gray-950/60 backdrop-blur-xs transition-opacity duration-300">
          <div className="w-full max-w-xl max-h-[85vh] overflow-y-auto rounded-t-3xl bg-white dark:bg-slate-900 shadow-2xl pb-safe animate-in slide-in-from-bottom duration-300">
            {/* Visual drag indicator bar */}
            <div className="w-full flex justify-center py-2 bg-slate-50 dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800">
              <span className="w-12 h-1.5 rounded-full bg-slate-300 dark:bg-slate-700" />
            </div>
            <FsrDetail
              fsrId={selectedFsrId}
              onClose={() => setSelectedFsrId(null)}
              onWorkflowProcessed={() => {
                loadData();
              }}
            />
          </div>
        </div>
      )}

      {/* Custom delete confirmation modal to bypass iframe window.confirm restriction */}
      {fsrIdToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-950/40 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl dark:bg-gray-900 border border-gray-100 dark:border-gray-800 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center gap-3 text-red-600 mb-4">
              <AlertTriangle className="h-6 w-6" />
              <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100">Konfirmasi Hapus FSR</h3>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-6 leading-relaxed">
              Apakah Anda yakin ingin menghapus data Fleet Service Request (FSR) ini? Tindakan ini akan menghapus data FSR dari database lokal dan cloud secara permanen.
            </p>
            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setFsrIdToDelete(null)}
                className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50 dark:border-gray-800 dark:bg-gray-950 dark:text-gray-300 transition-colors"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={confirmDelete}
                className="rounded-lg bg-red-600 px-4 py-2 text-xs font-semibold text-white hover:bg-red-700 shadow-sm transition-colors"
              >
                Hapus Data
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
    </div>
  );
};
