/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import {
  X,
  Printer,
  Download,
  FileText
} from 'lucide-react';
import { localDb } from '../db/localDb';
import { Fsr } from '../types';
import { useTheme } from './ThemeContext';

interface GroupedFsrModalProps {
  noFsr: string;
  onClose: () => void;
}

export const GroupedFsrModal: React.FC<GroupedFsrModalProps> = ({ noFsr, onClose }) => {
  const { currentUser } = useTheme();
  const [fsrItems, setFsrItems] = useState<Fsr[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Find all FSR records sharing the same no_fsr
    const allFsrs = localDb.getFsrs(currentUser);
    const matching = allFsrs.filter((f) => f.no_fsr === noFsr && !f.deleted_at);
    setFsrItems(matching);
    setLoading(false);
  }, [noFsr, currentUser]);

  if (loading) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-950/60 backdrop-blur-xs">
        <div className="bg-white dark:bg-gray-900 rounded-xl p-8 shadow-xl max-w-sm w-full text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-xs text-gray-500 dark:text-gray-400 font-semibold">Memuat Form FSR...</p>
        </div>
      </div>
    );
  }

  if (fsrItems.length === 0) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-950/60 backdrop-blur-xs">
        <div className="bg-white dark:bg-gray-900 rounded-xl p-6 shadow-xl max-w-md w-full">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-sm font-bold text-gray-900 dark:text-white">Form FSR Tidak Ditemukan</h3>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-500">
              <X className="h-5 w-5" />
            </button>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-6">
            Data FSR dengan nomor <span className="font-mono font-bold text-red-600">{noFsr}</span> tidak ditemukan atau telah dihapus.
          </p>
          <button
            onClick={onClose}
            className="w-full rounded-lg bg-gray-900 py-2 text-xs font-semibold text-white hover:bg-gray-800"
          >
            Tutup
          </button>
        </div>
      </div>
    );
  }

  // Get common metadata from the first record
  const masterFsr = fsrItems[0];
  const totalEstimasi = fsrItems.reduce((sum, item) => sum + (item.estimasi_biaya || 0), 0);

  // Aligns with the date format from the user's uploaded image (e.g. 24-Sep-26)
  const formatCompactDate = (dateStr?: string | null) => {
    if (!dateStr) return '-';
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return '-';
    const day = d.getDate().toString().padStart(2, '0');
    
    // Indonesian Month abbreviations
    const indMonths = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
    const month = indMonths[d.getMonth()];
    const year = d.getFullYear().toString().slice(-2);
    return `${day}-${month}-${year}`;
  };

  const tglPengajuan = formatCompactDate(masterFsr.tanggal_create);
  const tglApproval = formatCompactDate(masterFsr.tanggal_approve_leader_customer || masterFsr.tanggal_proses || masterFsr.tanggal_create);

  const picPembuat = masterFsr.created_by || 'Rini (Admin Customer)';
  const picApproval = masterFsr.nama_pic_customer || 'Bambang (Leader Customer)';

  // Determine service sub-category check for MAINTENANCE
  const getSubCategoryChecks = (items: Fsr[]) => {
    let isBerkala = false;
    let isEmergency = false;
    let isNonBerkala = false;

    items.forEach(f => {
      const type = (f.jenis_layanan || '').toLowerCase();
      const desc = (f.keterangan || '').toLowerCase();
      
      // Check "non berkala" first to prevent substring collision with "berkala"
      if (type.includes('non berkala') || type.includes('non-berkala')) {
        isNonBerkala = true;
      } else if (type.includes('berkala') || type.includes('periodic') || type.includes('rutin')) {
        isBerkala = true;
      } else if (type.includes('emergency') || type.includes('darurat') || desc.includes('emergency') || desc.includes('darurat')) {
        isEmergency = true;
      } else {
        isNonBerkala = true;
      }
    });

    if (!isBerkala && !isEmergency) {
      isNonBerkala = true;
    }

    return { isBerkala, isNonBerkala, isEmergency };
  };

  // Determine service sub-category check for DOCUMENT
  const getDocumentChecks = (items: Fsr[]) => {
    let isStnk1 = false;
    let isStnk5 = false;
    let isKir = false;
    let isEtle = false;
    let isNonEtle = false;
    let isDocLain = false;

    items.forEach(f => {
      const type = (f.jenis_layanan || '').toLowerCase();
      const desc = (f.keterangan || '').toLowerCase();
      
      if (type.includes('stnk 1') || type.includes('stnk 1th') || type.includes('pajak tahunan') || type.includes('tahunan stnk') || type.includes('pajak 1')) {
        isStnk1 = true;
      } else if (type.includes('stnk 5') || type.includes('stnk 5th') || type.includes('ganti plat') || type.includes('plat 5') || type.includes('5 tahun')) {
        isStnk5 = true;
      } else if (type.includes('kir') || desc.includes('uji kir') || type.includes('keur')) {
        isKir = true;
      } else if (type.includes('non etle') || type.includes('tilang manual') || desc.includes('tilang manual') || type.includes('manual fine')) {
        // Check "non etle" first to prevent substring collision with "etle"
        isNonEtle = true;
      } else if (type.includes('etle') || desc.includes('tilang etle') || desc.includes('etle fine') || type.includes('tilang elektronik')) {
        isEtle = true;
      } else {
        isDocLain = true;
      }
    });

    if (!isStnk1 && !isStnk5 && !isKir && !isEtle && !isNonEtle) {
      isDocLain = true;
    }

    return { isStnk1, isStnk5, isKir, isEtle, isNonEtle, isDocLain };
  };

  const { isBerkala, isNonBerkala, isEmergency } = getSubCategoryChecks(fsrItems);
  const { isStnk1, isStnk5, isKir, isEtle, isNonEtle, isDocLain } = getDocumentChecks(fsrItems);

  // Generate Excel file
  const handleExportExcel = () => {
    const printedAt = new Date().toLocaleString('id-ID', { dateStyle: 'long', timeStyle: 'short' });
    
    const excelRows = fsrItems.map((f, idx) => {
      const formattedCost = f.estimasi_biaya ? `Rp ${f.estimasi_biaya.toLocaleString('id-ID')}` : 'Rp 0';
      const formattedKm = f.km_pengajuan ? f.km_pengajuan.toLocaleString('id-ID') : '0';
      
      return `
        <tr style="font-size: 10pt; font-family: monospace;">
          <td style="border: 1px solid #000; padding: 6px; text-align: center;">${idx + 1}</td>
          <td style="border: 1px solid #000; padding: 6px; font-weight: bold; mso-number-format:'\\@';">${f.no_polisi}</td>
          <td style="border: 1px solid #000; padding: 6px;">${f.type_kendaraan}</td>
          <td style="border: 1px solid #000; padding: 6px; mso-number-format:'\\@';">${f.no_rangka || '-'}</td>
          <td style="border: 1px solid #000; padding: 6px; text-align: right;">${formattedKm}</td>
          <td style="border: 1px solid #000; padding: 6px; text-align: right; font-weight: bold;">${formattedCost}</td>
        </tr>
      `;
    }).join('');

    let excelCheckboxesHtml = '';
    if (masterFsr.kategori_layanan === 'Maintenance') {
      excelCheckboxesHtml = `
        <tr><td></td><td class="checkbox-cell">${isBerkala ? '[x]' : '[ ]'} Berkala</td></tr>
        <tr><td></td><td class="checkbox-cell">${isNonBerkala ? '[x]' : '[ ]'} Non Berkala</td></tr>
        <tr><td></td><td class="checkbox-cell">${isEmergency ? '[x]' : '[ ]'} Emergency</td></tr>
      `;
    } else if (masterFsr.kategori_layanan === 'Document') {
      excelCheckboxesHtml = `
        <tr><td></td><td class="checkbox-cell">${isStnk1 ? '[x]' : '[ ]'} STNK 1 Tahun</td></tr>
        <tr><td></td><td class="checkbox-cell">${isStnk5 ? '[x]' : '[ ]'} STNK 5 Tahun</td></tr>
        <tr><td></td><td class="checkbox-cell">${isKir ? '[x]' : '[ ]'} KIR</td></tr>
        <tr><td></td><td class="checkbox-cell">${isEtle ? '[x]' : '[ ]'} ETLE</td></tr>
        <tr><td></td><td class="checkbox-cell">${isNonEtle ? '[x]' : '[ ]'} Non ETLE</td></tr>
        <tr><td></td><td class="checkbox-cell">${isDocLain ? '[x]' : '[ ]'} Document Lain</td></tr>
      `;
    }

    const excelHtml = `
      <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
      <head>
        <meta http-equiv="content-type" content="application/vnd.ms-excel; charset=UTF-8">
        <style>
          body { font-family: monospace; color: #000; }
          .title-box { border: 1.5px solid #000; padding: 10px; text-align: center; font-size: 12pt; font-weight: bold; margin-bottom: 20px; }
          .section-title { font-weight: bold; font-size: 11pt; margin-top: 15px; margin-bottom: 5px; }
          .meta-label { width: 180px; }
          table.items-table { border-collapse: collapse; width: 100%; margin-top: 10px; }
          table.items-table th { border: 1.5px solid #000; padding: 6px; background-color: #F2F2F2; font-weight: bold; }
          table.items-table td { border: 1px solid #000; padding: 6px; }
          .checkbox-cell { font-family: monospace; }
          .desc-box { border: 1px solid #000; padding: 10px; min-height: 80px; font-family: monospace; }
        </style>
      </head>
      <body>
        <div class="title-box">FORM SERVICE REQUEST - FMOS</div>
        
        <div class="section-title">A. Data Pengajuan</div>
        <table>
          <tr><td class="meta-label">No. FSR</td><td>: ${masterFsr.no_fsr}</td></tr>
          <tr><td class="meta-label">Customer</td><td>: ${masterFsr.nama_customer}</td></tr>
          <tr><td class="meta-label">Tanggal Pengajuan</td><td>: ${tglPengajuan}</td></tr>
          <tr><td class="meta-label">PIC Pembuat</td><td>: ${picPembuat}</td></tr>
          <tr><td class="meta-label">Tanggal Approval</td><td>: ${tglApproval}</td></tr>
          <tr><td class="meta-label">PIC Approval</td><td>: ${picApproval}</td></tr>
          <tr><td class="meta-label">Cabang Pengajuan</td><td>: ${masterFsr.cabang}</td></tr>
        </table>

        <div class="section-title">B. Data Unit</div>
        <table class="items-table">
          <thead>
            <tr>
              <th style="width: 40px;">No.</th>
              <th style="width: 120px;">No. Polisi</th>
              <th style="width: 250px;">Unit Deskripsi</th>
              <th style="width: 180px;">No. Rangka / Mesin</th>
              <th style="width: 100px;">KM Pengajuan</th>
              <th style="width: 130px;">Estimasi</th>
            </tr>
          </thead>
          <tbody>
            ${excelRows}
          </tbody>
        </table>

        <div class="section-title">C. Kategori Pengajuan</div>
        <table>
          <tr><td style="width: 180px;">Kategori Layanan</td><td>: ${masterFsr.kategori_layanan}</td></tr>
          ${excelCheckboxesHtml}
        </table>

        <div class="section-title">D. Keterangan</div>
        <div class="desc-box">
          ${fsrItems.map(item => `[${item.no_polisi}]: ${item.keterangan || '-'}`).join('<br/>')}
        </div>
      </body>
      </html>
    `;

    const blob = new Blob([excelHtml], { type: 'application/vnd.ms-excel;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Form_Service_Request_${masterFsr.no_fsr.replace(/\//g, '_')}.xls`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Modern HTML Print Trigger with exact layout of user image
  const handlePrintPdf = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    // Build vehicle list block
    let unitSectionHtml = '';
    
    if (fsrItems.length === 1) {
      // Show exact single-unit template from the image
      const unit = fsrItems[0];
      const formattedKm = unit.km_pengajuan ? unit.km_pengajuan.toLocaleString('id-ID') : '0';
      unitSectionHtml = `
        <table class="meta-table">
          <tr><td class="meta-label">No. Polisi</td><td class="meta-value">: ${unit.no_polisi}</td></tr>
          <tr><td class="meta-label">Unit Deskripsi</td><td class="meta-value">: ${unit.type_kendaraan}</td></tr>
          <tr><td class="meta-label">No. Rangka</td><td class="meta-value">: ${unit.no_rangka || '-'}</td></tr>
          <tr><td class="meta-label">KM Pengajuan</td><td class="meta-value" style="text-align: right; width: 300px; padding-right: 50px;">${formattedKm}</td></tr>
        </table>
      `;
    } else {
      // Show beautifully structured high-density table for multiple units
      const rows = fsrItems.map((unit, idx) => `
        <tr style="font-size: 11px;">
          <td style="text-align: center; border: 1px solid #000; padding: 5px;">${idx + 1}</td>
          <td style="font-weight: bold; border: 1px solid #000; padding: 5px;">${unit.no_polisi}</td>
          <td style="border: 1px solid #000; padding: 5px;">${unit.type_kendaraan}</td>
          <td style="border: 1px solid #000; padding: 5px; font-family: monospace;">${unit.no_rangka || '-'}</td>
          <td style="text-align: right; border: 1px solid #000; padding: 5px; font-family: monospace;">${unit.km_pengajuan ? unit.km_pengajuan.toLocaleString('id-ID') : '0'}</td>
          <td style="text-align: right; border: 1px solid #000; padding: 5px; font-family: monospace; font-weight: bold;">Rp ${unit.estimasi_biaya ? unit.estimasi_biaya.toLocaleString('id-ID') : '0'}</td>
        </tr>
      `).join('');

      unitSectionHtml = `
        <table style="width: 100%; border-collapse: collapse; margin-top: 5px;">
          <thead>
            <tr>
              <th style="border: 1.5px solid #000; padding: 6px; text-align: center; background-color: #FAFAFA; font-size: 10px;">No</th>
              <th style="border: 1.5px solid #000; padding: 6px; text-align: left; background-color: #FAFAFA; font-size: 10px;">No. Polisi</th>
              <th style="border: 1.5px solid #000; padding: 6px; text-align: left; background-color: #FAFAFA; font-size: 10px;">Unit Deskripsi</th>
              <th style="border: 1.5px solid #000; padding: 6px; text-align: left; background-color: #FAFAFA; font-size: 10px;">No. Rangka</th>
              <th style="border: 1.5px solid #000; padding: 6px; text-align: right; background-color: #FAFAFA; font-size: 10px;">KM Pengajuan</th>
              <th style="border: 1.5px solid #000; padding: 6px; text-align: right; background-color: #FAFAFA; font-size: 10px;">Estimasi</th>
            </tr>
          </thead>
          <tbody>
            ${rows}
          </tbody>
        </table>
      `;
    }

    const keteranganList = fsrItems
      .map(item => `[${item.no_polisi}]: ${item.keterangan || '-'}`)
      .join('<br/>');

    // Build conditional checkboxes HTML for print based on category
    let categoryCheckboxesHtml = '';
    if (masterFsr.kategori_layanan === 'Maintenance') {
      categoryCheckboxesHtml = `
        <div class="checkbox-group">
          <div class="checkbox-row">
            <span class="checkbox-box">${isBerkala ? '&#x2713;' : ''}</span>
            <span class="checkbox-label">Berkala</span>
          </div>
          <div class="checkbox-row">
            <span class="checkbox-box">${isNonBerkala ? '&#x2713;' : ''}</span>
            <span class="checkbox-label">Non Berkala</span>
          </div>
          <div class="checkbox-row">
            <span class="checkbox-box">${isEmergency ? '&#x2713;' : ''}</span>
            <span class="checkbox-label">Emergency</span>
          </div>
        </div>
      `;
    } else if (masterFsr.kategori_layanan === 'Document') {
      categoryCheckboxesHtml = `
        <div class="checkbox-group">
          <div class="checkbox-row">
            <span class="checkbox-box">${isStnk1 ? '&#x2713;' : ''}</span>
            <span class="checkbox-label">STNK 1 Tahun</span>
          </div>
          <div class="checkbox-row">
            <span class="checkbox-box">${isStnk5 ? '&#x2713;' : ''}</span>
            <span class="checkbox-label">STNK 5 Tahun</span>
          </div>
          <div class="checkbox-row">
            <span class="checkbox-box">${isKir ? '&#x2713;' : ''}</span>
            <span class="checkbox-label">KIR</span>
          </div>
          <div class="checkbox-row">
            <span class="checkbox-box">${isEtle ? '&#x2713;' : ''}</span>
            <span class="checkbox-label">ETLE</span>
          </div>
          <div class="checkbox-row">
            <span class="checkbox-box">${isNonEtle ? '&#x2713;' : ''}</span>
            <span class="checkbox-label">Non ETLE</span>
          </div>
          <div class="checkbox-row">
            <span class="checkbox-box">${isDocLain ? '&#x2713;' : ''}</span>
            <span class="checkbox-label">Document Lain</span>
          </div>
        </div>
      `;
    }

    printWindow.document.write(`
      <html>
        <head>
          <title>FSR Form - ${masterFsr.no_fsr}</title>
          <style>
            @page {
              size: A4 portrait;
              margin: 15mm 15mm 15mm 15mm;
            }
            body { 
              font-family: 'Courier New', Courier, monospace; 
              color: #000000; 
              margin: 0; 
              padding: 0;
              background-color: #FFFFFF;
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
              font-size: 12px;
              line-height: 1.4;
            }
            .container {
              width: 100%;
              max-width: 750px;
              margin: 0 auto;
            }
            .title-box {
              border: 1.5px solid #000000;
              padding: 10px;
              text-align: center;
              font-size: 13px;
              font-weight: bold;
              text-transform: uppercase;
              letter-spacing: 1px;
              margin-bottom: 25px;
            }
            .section-header {
              font-size: 12px;
              font-weight: bold;
              margin-top: 18px;
              margin-bottom: 8px;
              text-transform: none;
            }
            .meta-table {
              width: 100%;
              border-collapse: collapse;
              margin-bottom: 5px;
            }
            .meta-table td {
              padding: 3px 0;
              vertical-align: top;
            }
            .meta-label {
              width: 180px;
              font-weight: normal;
            }
            .meta-value {
              font-weight: normal;
            }
            .checkbox-group {
              margin-top: 4px;
              padding-left: 20px;
            }
            .checkbox-row {
              display: flex;
              align-items: center;
              margin-bottom: 5px;
            }
            .checkbox-box {
              width: 14px;
              height: 14px;
              border: 1px solid #000000;
              display: inline-flex;
              align-items: center;
              justify-content: center;
              font-size: 11px;
              font-weight: bold;
              margin-right: 8px;
              font-family: Arial, sans-serif;
            }
            .checkbox-label {
              font-size: 12px;
            }
            .keterangan-box {
              border: 1px solid #000000;
              min-height: 120px;
              padding: 12px;
              margin-top: 5px;
              white-space: pre-wrap;
              word-wrap: break-word;
              font-size: 11px;
            }
            .footer-info {
              margin-top: 40px;
              font-size: 9px;
              color: #555;
              text-align: right;
              border-top: 1px dashed #ccc;
              padding-top: 5px;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <!-- Header Title Box -->
            <div class="title-box">
              FORM SERVICE REQUEST - FMOS
            </div>

            <!-- A. Data Pengajuan -->
            <div class="section-header">A. Data Pengajuan</div>
            <table class="meta-table">
              <tr><td class="meta-label">No. FSR</td><td class="meta-value">: ${masterFsr.no_fsr}</td></tr>
              <tr><td class="meta-label">Customer</td><td class="meta-value">: ${masterFsr.nama_customer}</td></tr>
              <tr><td class="meta-label">Tanggal Pengajuan</td><td class="meta-value">: ${tglPengajuan}</td></tr>
              <tr><td class="meta-label">PIC Pembuat</td><td class="meta-value">: ${picPembuat}</td></tr>
              <tr><td class="meta-label">Tanggal Approval</td><td class="meta-value">: ${tglApproval}</td></tr>
              <tr><td class="meta-label">PIC Approval</td><td class="meta-value">: ${picApproval}</td></tr>
              <tr><td class="meta-label">Cabang Pengajuan</td><td class="meta-value">: ${masterFsr.cabang}</td></tr>
            </table>

            <!-- B. Data Unit -->
            <div class="section-header">B. Data Unit</div>
            ${unitSectionHtml}

            <!-- C. Kategori Pengajuan -->
            <div class="section-header">C. Kategori Pengajuan</div>
            <table class="meta-table">
              <tr>
                <td class="meta-label">Kategori Layanan</td>
                <td class="meta-value">: ${masterFsr.kategori_layanan}</td>
              </tr>
            </table>
            
            ${categoryCheckboxesHtml}

            <!-- D. Keterangan -->
            <div class="section-header">D. Keterangan</div>
            <div class="keterangan-box">${keteranganList}</div>

            <div class="footer-info">
              Printed electronically from Fleet Management Operation System (FMOS)
            </div>
          </div>

          <script>
            window.onload = function() { 
              setTimeout(function() {
                window.print(); 
                window.close(); 
              }, 400);
            }
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-950/60 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-4xl rounded-xl bg-white dark:bg-gray-950 border border-gray-100 dark:border-gray-800 shadow-2xl overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-150 bg-gray-50 dark:bg-gray-900/50 shrink-0">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-md bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400">
              <FileText className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-xs font-bold text-gray-800 dark:text-white font-mono">
                Preview Formulir Service Request
              </h2>
              <p className="text-[10px] text-gray-400 dark:text-gray-500 font-mono">
                Nomor FSR: {noFsr}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrintPdf}
              className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-50 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-300 dark:hover:bg-gray-800 transition-colors font-mono"
            >
              <Printer className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
              <span>Cetak / PDF</span>
            </button>
            <button
              onClick={handleExportExcel}
              className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-50 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-300 dark:hover:bg-gray-800 transition-colors font-mono"
            >
              <Download className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>Excel</span>
            </button>
            <button
              onClick={onClose}
              className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-600"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Modal Scrollable Workspace - Exact match with user image template */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 bg-gray-100 dark:bg-gray-900/40">
          
          {/* FSR Retro Monospace Document Sheet */}
          <div className="bg-white text-black p-8 md:p-12 shadow-md max-w-3xl mx-auto space-y-6 font-mono text-xs border border-gray-300 leading-relaxed select-none">
            
            {/* Template Top Title Box */}
            <div className="border-[1.5px] border-black py-2 text-center text-xs md:text-sm font-bold tracking-widest uppercase bg-white">
              FORM SERVICE REQUEST - FMOS
            </div>

            {/* A. Data Pengajuan */}
            <div className="space-y-1.5">
              <h3 className="font-bold text-xs">A. Data Pengajuan</h3>
              <div className="grid grid-cols-[160px_10px_1fr] gap-x-2 gap-y-1.5 pl-1">
                <span className="text-gray-700">No. FSR</span>
                <span>:</span>
                <span className="font-bold">{masterFsr.no_fsr}</span>

                <span className="text-gray-700">Customer</span>
                <span>:</span>
                <span>{masterFsr.nama_customer}</span>

                <span className="text-gray-700">Tanggal Pengajuan</span>
                <span>:</span>
                <span>{tglPengajuan}</span>

                <span className="text-gray-700">PIC Pembuat</span>
                <span>:</span>
                <span>{picPembuat}</span>

                <span className="text-gray-700">Tanggal Approval</span>
                <span>:</span>
                <span>{tglApproval}</span>

                <span className="text-gray-700">PIC Approval</span>
                <span>:</span>
                <span>{picApproval}</span>

                <span className="text-gray-700">Cabang Pengajuan</span>
                <span>:</span>
                <span>{masterFsr.cabang}</span>
              </div>
            </div>

            {/* B. Data Unit */}
            <div className="space-y-2">
              <h3 className="font-bold text-xs">B. Data Unit</h3>
              
              {fsrItems.length === 1 ? (
                // Single Unit View exactly as in image
                <div className="grid grid-cols-[160px_10px_1fr] gap-x-2 gap-y-1.5 pl-1">
                  <span className="text-gray-700">No. Polisi</span>
                  <span>:</span>
                  <span className="font-bold">{fsrItems[0].no_polisi}</span>

                  <span className="text-gray-700">Unit Deskripsi</span>
                  <span>:</span>
                  <span>{fsrItems[0].type_kendaraan}</span>

                  <span className="text-gray-700">No. Rangka</span>
                  <span>:</span>
                  <span>{fsrItems[0].no_rangka || '-'}</span>

                  <span className="text-gray-700">KM Pengajuan</span>
                  <span>:</span>
                  <div className="flex justify-between max-w-[360px]">
                    <span></span>
                    <span className="font-bold pr-10">
                      {fsrItems[0].km_pengajuan ? fsrItems[0].km_pengajuan.toLocaleString('id-ID') : '0'}
                    </span>
                  </div>
                </div>
              ) : (
                // Multi-Unit Consolidated Monospace Table
                <div className="pl-1 border border-black rounded overflow-hidden">
                  <table className="w-full text-left text-[11px] font-mono">
                    <thead>
                      <tr className="border-b border-black bg-gray-50">
                        <th className="p-2 border-r border-black text-center w-8">No</th>
                        <th className="p-2 border-r border-black">No. Polisi</th>
                        <th className="p-2 border-r border-black">Unit Deskripsi</th>
                        <th className="p-2 border-r border-black">No. Rangka</th>
                        <th className="p-2 border-r border-black text-right">KM</th>
                        <th className="p-2 text-right">Estimasi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-black">
                      {fsrItems.map((unit, idx) => (
                        <tr key={unit.id}>
                          <td className="p-2 border-r border-black text-center">{idx + 1}</td>
                          <td className="p-2 border-r border-black font-bold">{unit.no_polisi}</td>
                          <td className="p-2 border-r border-black">{unit.type_kendaraan}</td>
                          <td className="p-2 border-r border-black">{unit.no_rangka || '-'}</td>
                          <td className="p-2 border-r border-black text-right">
                            {unit.km_pengajuan ? unit.km_pengajuan.toLocaleString('id-ID') : '0'}
                          </td>
                          <td className="p-2 text-right font-bold">
                            {unit.estimasi_biaya ? `Rp ${unit.estimasi_biaya.toLocaleString('id-ID')}` : 'Rp 0'}
                          </td>
                        </tr>
                      ))}
                      <tr className="bg-gray-100 font-bold border-t border-black">
                        <td colSpan={5} className="p-2 border-r border-black text-right uppercase">Total Estimasi:</td>
                        <td className="p-2 text-right">Rp {totalEstimasi.toLocaleString('id-ID')}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* C. Kategori Pengajuan */}
            <div className="space-y-1.5">
              <h3 className="font-bold text-xs">C. Kategori Pengajuan</h3>
              <div className="grid grid-cols-[160px_10px_1fr] gap-x-2 pl-1 mb-2">
                <span className="text-gray-700">Kategori Layanan</span>
                <span>:</span>
                <span>{masterFsr.kategori_layanan}</span>
              </div>
              
              {masterFsr.kategori_layanan === 'Maintenance' && (
                <div className="pl-[172px] space-y-1.5">
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border border-black flex items-center justify-center font-bold font-sans text-xs select-none">
                      {isBerkala && '✓'}
                    </div>
                    <span className="text-gray-800">Berkala</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border border-black flex items-center justify-center font-bold font-sans text-xs select-none">
                      {isNonBerkala && '✓'}
                    </div>
                    <span className="text-gray-800">Non Berkala</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border border-black flex items-center justify-center font-bold font-sans text-xs select-none">
                      {isEmergency && '✓'}
                    </div>
                    <span className="text-gray-800">Emergency</span>
                  </div>
                </div>
              )}

              {masterFsr.kategori_layanan === 'Document' && (
                <div className="pl-[172px] space-y-1.5">
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border border-black flex items-center justify-center font-bold font-sans text-xs select-none">
                      {isStnk1 && '✓'}
                    </div>
                    <span className="text-gray-800">STNK 1 Tahun</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border border-black flex items-center justify-center font-bold font-sans text-xs select-none">
                      {isStnk5 && '✓'}
                    </div>
                    <span className="text-gray-800">STNK 5 Tahun</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border border-black flex items-center justify-center font-bold font-sans text-xs select-none">
                      {isKir && '✓'}
                    </div>
                    <span className="text-gray-800">KIR</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border border-black flex items-center justify-center font-bold font-sans text-xs select-none">
                      {isEtle && '✓'}
                    </div>
                    <span className="text-gray-800">ETLE</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border border-black flex items-center justify-center font-bold font-sans text-xs select-none">
                      {isNonEtle && '✓'}
                    </div>
                    <span className="text-gray-800">Non ETLE</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border border-black flex items-center justify-center font-bold font-sans text-xs select-none">
                      {isDocLain && '✓'}
                    </div>
                    <span className="text-gray-800">Document Lain</span>
                  </div>
                </div>
              )}
            </div>

            {/* D. Keterangan */}
            <div className="space-y-1.5">
              <h3 className="font-bold text-xs">D. Keterangan</h3>
              <div className="border border-black p-4 min-height-[100px] bg-white leading-relaxed text-[11px]">
                {fsrItems.map((item, idx) => (
                  <div key={item.id} className={idx > 0 ? 'mt-1.5 pt-1.5 border-t border-dashed border-gray-300' : ''}>
                    <span className="font-bold">[{item.no_polisi}]</span>: {item.keterangan || '-'}
                  </div>
                ))}
              </div>
            </div>

          </div>

        </div>

        {/* Modal Footer */}
        <div className="p-3 border-t border-gray-150 bg-gray-50 dark:bg-gray-900/50 flex justify-end gap-2.5 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-gray-200 bg-white px-4 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-50 dark:border-gray-800 dark:bg-gray-950 dark:text-gray-300 transition-colors font-mono"
          >
            Tutup
          </button>
          <button
            type="button"
            onClick={handlePrintPdf}
            className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 text-white px-4 py-1.5 text-xs font-bold hover:bg-blue-700 shadow-xs active:scale-95 transition-all font-mono"
          >
            <Printer className="h-3.5 w-3.5" />
            <span>Cetak / Save PDF</span>
          </button>
        </div>

      </div>
    </div>
  );
};
