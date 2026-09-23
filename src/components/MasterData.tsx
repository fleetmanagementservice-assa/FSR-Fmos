/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  Building2,
  Car,
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
  FileText,
  ChevronLeft,
  ChevronRight,
  Settings,
  Link2,
  Copy,
  Check,
  ExternalLink,
  Loader2
} from 'lucide-react';
import { localDb } from '../db/localDb';
import { testAppsScriptConnection } from '../utils/googleDrive';
import {
  Branch,
  Customer,
  Vendor,
  Category,
  Unit,
  OperationUser,
  UserRole,
  ServiceCategory
} from '../types';
import { useTheme } from './ThemeContext';
import * as XLSX from 'xlsx';

const mapHeaderKey = (h: string): string => {
  const norm = h.toLowerCase().trim().replace(/\s+/g, '_').replace(/\.+/g, '').replace(/[^a-z0-9_]/g, '');
  if (norm === 'no_equiment' || norm === 'no_equipment' || norm === 'noequipment' || norm === 'noequiment' || norm === 'equipment_no' || norm === 'no_equipment_no' || norm === 'eq_no' || norm === 'no_eq' || norm === 'eq') return 'no_equipment';
  if (norm === 'license_plate' || norm === 'nopol' || norm === 'no_polisi' || norm === 'licenseplate' || norm === 'no_plat' || norm === 'plat') return 'license_plate';
  if (norm === 'warna_nopol' || norm === 'warnanopol' || norm === 'warna_plat') return 'warna_nopol';
  if (norm === 'description' || norm === 'desc' || norm === 'deskripsi' || norm === 'nama_unit' || norm === 'unit_desc' || norm === 'merk' || norm === 'model') return 'description';
  if (norm === 'kelompok_unit' || norm === 'kelompokunit' || norm === 'group_unit' || norm === 'group') return 'kelompok_unit';
  if (norm === 'kategori_unit' || norm === 'kategoriunit' || norm === 'category_unit' || norm === 'kategori') return 'kategori_unit';
  if (norm === 'kelompok_tipe' || norm === 'kelompoktipe' || norm === 'group_tipe' || norm === 'tipe_kelompok') return 'kelompok_tipe';
  if (norm === 'tipe_unit' || norm === 'tipeunit' || norm === 'unit_type' || norm === 'tipe') return 'tipe_unit';
  if (norm === 'pendingin' || norm === 'cooler' || norm === 'refrigerated' || norm === 'ac') return 'pendingin';
  if (norm === 'power' || norm === 'pk' || norm === 'hp') return 'power';
  if (norm === 'tahun_unit' || norm === 'tahununit' || norm === 'tahun' || norm === 'year' || norm === 'thn') return 'tahun_unit';
  if (norm === 'chassis_no' || norm === 'chassisno' || norm === 'no_chassis' || norm === 'chasis_no' || norm === 'chasisno' || norm === 'no_rangka' || norm === 'rangka') return 'chassis_no';
  if (norm === 'engineserialno' || norm === 'engine_serial_no' || norm === 'no_engine' || norm === 'engineserial' || norm === 'no_mesin' || norm === 'mesin' || norm === 'engine') return 'engine_serial_no';
  if (norm === 'warna' || norm === 'color') return 'warna';
  if (norm === 'cmd' || norm === 'customer_code' || norm === 'kode_customer' || norm === 'kode_cust') return 'cmd';
  if (norm === 'customer' || norm === 'customer_name' || norm === 'nama_customer' || norm === 'namacustomer') return 'customer_name';
  if (norm === 'vmd' || norm === 'vendor_code' || norm === 'kode_vendor' || norm === 'kode_vmd' || norm === 'id_vendor') return 'vmd';
  if (norm === 'nama_vendor' || norm === 'namavendor' || norm === 'vendor_name' || norm === 'nama_bengkel' || norm === 'vendor' || norm === 'nama') return 'nama_vendor';
  if (norm === 'maint_plant' || norm === 'plant' || norm === 'branch_plant' || norm === 'kode_cabang') return 'maint_plant';
  if (norm === 'cabang' || norm === 'branch_name' || norm === 'nama_cabang') return 'cabang';
  
  // Service Categories Aliases
  if (norm === 'kategori_layanan' || norm === 'kategorilayanan' || norm === 'layanan_kategori' || norm === 'kategori') return 'kategori_layanan';
  if (norm === 'jenis_layanan' || norm === 'jenislayanan' || norm === 'jenis' || norm === 'layanan' || norm === 'service' || norm === 'service_type') return 'jenis_layanan';
  if (norm === 'role_pic' || norm === 'rolepic' || norm === 'role' || norm === 'pic' || norm === 'pic_role' || norm === 'role_pic_layanan') return 'role_pic';
  
  // Operation Users Aliases
  if (norm === 'nama' || norm === 'name' || norm === 'nama_lengkap' || norm === 'fullname' || norm === 'full_name') return 'nama';
  if (norm === 'username' || norm === 'user' || norm === 'nama_pengguna') return 'username';
  if (norm === 'password' || norm === 'pass' || norm === 'sandi' || norm === 'kata_sandi') return 'password';
  if (norm === 'role_operation' || norm === 'role' || norm === 'roleoperation' || norm === 'hak_akses') return 'role_operation';
  if (norm === 'cabang_handling' || norm === 'cabang' || norm === 'cabanghandling' || norm === 'branch' || norm === 'branch_handling' || norm === 'lokasi') return 'cabang_handling';
  if (norm === 'status' || norm === 'aktif' || norm === 'state' || norm === 'user_status') return 'status';
  if (norm === 'assigned_customer_cmd' || norm === 'assignedcustomercmd' || norm === 'assigned_customer' || norm === 'assignedcustomer' || norm === 'customer_cmd' || norm === 'customercmd' || norm === 'assigned_cmd') return 'assigned_customer_cmd';
  if (norm === 'assigned_vmd' || norm === 'assignedvmd' || norm === 'assigned_vmd_code' || norm === 'assignedvmdcode') return 'assigned_vmd';
  if (norm === 'vendor_name' || norm === 'vendorname' || norm === 'assigned_vendor_name' || norm === 'assignedvendorname') return 'vendor_name';
  
  return norm;
};

export const MasterData: React.FC = () => {
  const { currentUser } = useTheme();
  const [activeSubTab, setActiveSubTab] = useState<'branches' | 'customers' | 'vendors' | 'categories' | 'units' | 'users' | 'settings'>('units');

  // Google Apps Script Settings State
  const [appsScriptUrl, setAppsScriptUrl] = useState(localStorage.getItem('fsr_apps_script_url') || '');
  const [isTestingConnection, setIsTestingConnection] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [isCopied, setIsCopied] = useState(false);

  // Master records state
  const [branches, setBranches] = useState<Branch[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);
  const [operationUsers, setOperationUsers] = useState<OperationUser[]>([]);

  // Modals and popup states
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isImportSuccessOpen, setIsImportSuccessOpen] = useState(false);
  const [importedCount, setImportedCount] = useState(0);
  const [importedTab, setImportedTab] = useState('');
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [activeRowActionsId, setActiveRowActionsId] = useState<string | null>(null);
  const [deletingItem, setDeletingItem] = useState<{ id: string; name: string } | null>(null);

  // Selected item for update state
  const [editingId, setEditingId] = useState<string | null>(null);

  // General Inputs
  const [searchVal, setSearchVal] = useState('');
  const [formMsg, setFormMsg] = useState({ type: '', text: '' });

  // Pagination State
  const [pageSize, setPageSize] = useState<number>(25);
  const [currentPage, setCurrentPage] = useState<number>(1);

  useEffect(() => {
    setCurrentPage(1);
  }, [activeSubTab, searchVal, pageSize]);

  // Import-specific states
  const [parsedGrid, setParsedGrid] = useState<string[][]>([]);
  const [parsedPreview, setParsedPreview] = useState<any[]>([]);
  const [importErrors, setImportErrors] = useState<string[]>([]);
  const [dragOver, setDragOver] = useState(false);

  // Input states for Branch Form
  const [branchPlant, setBranchPlant] = useState('');
  const [branchName, setBranchName] = useState('');

  // Input states for Customer Form
  const [customerCmd, setCustomerCmd] = useState('');
  const [customerName, setCustomerName] = useState('');

  // Input states for Vendor Form
  const [vendorVmd, setVendorVmd] = useState('');
  const [vendorName, setVendorName] = useState('');

  // Input states for Category Form
  const [catCategory, setCatCategory] = useState<ServiceCategory>('Maintenance');
  const [catService, setCatService] = useState('');
  const [catPicRole, setCatPicRole] = useState<'SA' | 'SS' | 'VRO'>('SA');

  // Input states for Unit Form
  const [unitEq, setUnitEq] = useState('');
  const [unitPlate, setUnitPlate] = useState('');
  const [unitWarnaNopol, setUnitWarnaNopol] = useState('Hitam');
  const [unitDesc, setUnitDesc] = useState('');
  const [unitGroup, setUnitGroup] = useState('');
  const [unitCategory, setUnitCategory] = useState('');
  const [unitTypeGroup, setUnitTypeGroup] = useState('');
  const [unitType, setUnitType] = useState('');
  const [unitCooler, setUnitCooler] = useState('No');
  const [unitPower, setUnitPower] = useState('');
  const [unitYear, setUnitYear] = useState('2022');
  const [unitChassis, setUnitChassis] = useState('');
  const [unitEngine, setUnitEngine] = useState('');
  const [unitColor, setUnitColor] = useState('');
  const [unitCmd, setUnitCmd] = useState('');

  // Input states for User Form
  const [userRealName, setUserRealName] = useState('');
  const [userUsername, setUserUsername] = useState('');
  const [userPassword, setUserPassword] = useState('');
  const [userRole, setUserRole] = useState<UserRole>('SA');
  const [userBranch, setUserBranch] = useState('');
  const [userAssignedCustomer, setUserAssignedCustomer] = useState('');
  const [userAssignedVmd, setUserAssignedVmd] = useState('');
  const [userVendorName, setUserVendorName] = useState('');
  const [userVendorSearch, setUserVendorSearch] = useState('');
  const [isUserVendorDropdownOpen, setIsUserVendorDropdownOpen] = useState(false);
  const [userStatus, setUserStatus] = useState<'Active' | 'Inactive'>('Active');
  const [userMenuDashboard, setUserMenuDashboard] = useState(true);
  const [userMenuFsr, setUserMenuFsr] = useState(true);
  const [userMenuMaster, setUserMenuMaster] = useState(true);
  const [userActionCreate, setUserActionCreate] = useState(true);
  const [userActionEdit, setUserActionEdit] = useState(true);
  const [userActionDelete, setUserActionDelete] = useState(false);
  const [userActionWorkflow, setUserActionWorkflow] = useState(true);

  const reloadAll = () => {
    setBranches(localDb.getBranches());
    setCustomers(localDb.getCustomers());
    setVendors(localDb.getVendors());
    setCategories(localDb.getCategories());
    setUnits(localDb.getUnits());
    setOperationUsers(localDb.getOperationUsers());
  };

  useEffect(() => {
    reloadAll();
  }, []);

  const showMsg = (type: 'success' | 'error', text: string) => {
    setFormMsg({ type, text });
    setTimeout(() => setFormMsg({ type: '', text: '' }), 5000);
  };

  // 📝 RESET ALL FORM FIELDS
  const resetForm = () => {
    setEditingId(null);
    setBranchPlant(''); setBranchName('');
    setCustomerCmd(''); setCustomerName('');
    setVendorVmd(''); setVendorName('');
    setCatService('');
    setUnitEq(''); setUnitPlate(''); setUnitDesc(''); setUnitGroup(''); setUnitCategory('');
    setUnitTypeGroup(''); setUnitType(''); setUnitPower(''); setUnitYear('2022');
    setUnitChassis(''); setUnitEngine(''); setUnitColor(''); setUnitCmd('');
    setUserRealName(''); setUserUsername(''); setUserPassword(''); setUserBranch(''); setUserAssignedCustomer('');
    setUserAssignedVmd(''); setUserVendorName(''); setUserVendorSearch(''); setIsUserVendorDropdownOpen(false);
    setUserStatus('Active'); setUserRole('SA');
    setUserMenuDashboard(true);
    setUserMenuFsr(true);
    setUserMenuMaster(true);
    setUserActionCreate(true);
    setUserActionEdit(true);
    setUserActionDelete(false);
    setUserActionWorkflow(true);
  };

  // ⚙️ BRANCH SUBMIT
  const handleBranchSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!branchPlant || !branchName) return showMsg('error', 'Semua kolom wajib diisi.');
    try {
      await localDb.saveBranch({ id: editingId || undefined, maint_plant: branchPlant, cabang: branchName }, currentUser);
      showMsg('success', 'Cabang berhasil disimpan.');
      resetForm();
      setIsFormModalOpen(false);
      reloadAll();
    } catch (err: any) {
      showMsg('error', err.message);
    }
  };

  // ⚙️ CUSTOMER SUBMIT
  const handleCustomerSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerCmd || !customerName) return showMsg('error', 'Semua kolom wajib diisi.');
    try {
      await localDb.saveCustomer({ id: editingId || undefined, cmd: customerCmd, nama_customer: customerName }, currentUser);
      showMsg('success', 'Customer berhasil disimpan.');
      resetForm();
      setIsFormModalOpen(false);
      reloadAll();
    } catch (err: any) {
      showMsg('error', err.message);
    }
  };

  // ⚙️ VENDOR SUBMIT
  const handleVendorSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!vendorVmd || !vendorName) return showMsg('error', 'Semua kolom wajib diisi.');
    try {
      await localDb.saveVendor({ id: editingId || undefined, vmd: vendorVmd, nama_vendor: vendorName }, currentUser);
      showMsg('success', 'Vendor berhasil disimpan.');
      resetForm();
      setIsFormModalOpen(false);
      reloadAll();
    } catch (err: any) {
      showMsg('error', err.message);
    }
  };

  // ⚙️ CATEGORY SUBMIT
  const handleCategorySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!catService) return showMsg('error', 'Jenis layanan wajib diisi.');
    try {
      await localDb.saveCategory({
        id: editingId || undefined,
        kategori_layanan: catCategory,
        jenis_layanan: catService,
        role_pic: catPicRole
      }, currentUser);
      showMsg('success', 'Kategori layanan berhasil disimpan.');
      resetForm();
      setIsFormModalOpen(false);
      reloadAll();
    } catch (err: any) {
      showMsg('error', err.message);
    }
  };

  // ⚙️ UNIT SUBMIT
  const handleUnitSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!unitEq || !unitPlate || !unitDesc || !unitCmd) return showMsg('error', 'Data utama unit wajib dilengkapi.');
    try {
      await localDb.saveUnit({
        id: editingId || undefined,
        no_equipment: unitEq,
        license_plate: unitPlate,
        warna_nopol: unitWarnaNopol,
        description: unitDesc,
        kelompok_unit: unitGroup,
        kategori_unit: unitCategory,
        kelompok_tipe: unitTypeGroup,
        tipe_unit: unitType,
        pendingin: unitCooler,
        power: unitPower,
        tahun_unit: Number(unitYear),
        chassis_no: unitChassis,
        engine_serial_no: unitEngine,
        warna: unitColor,
        cmd: unitCmd
      }, currentUser);
      showMsg('success', 'Data unit kendaraan disimpan.');
      resetForm();
      setIsFormModalOpen(false);
      reloadAll();
    } catch (err: any) {
      showMsg('error', err.message);
    }
  };

  // ⚙️ USER SUBMIT
  const handleUserSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userRealName || !userUsername || !userBranch) return showMsg('error', 'Semua kolom wajib dilengkapi.');
    try {
      await localDb.saveOperationUser({
        id: editingId || undefined,
        nama: userRealName,
        username: userUsername,
        password: userPassword || undefined,
        role_operation: userRole,
        cabang_handling: userBranch,
        assigned_customer_cmd: userRole === 'Admin Customer' || userRole === 'Leader Customer' ? userAssignedCustomer : undefined,
        assigned_vmd: userRole === 'Vendor' ? userAssignedVmd : undefined,
        vendor_name: userRole === 'Vendor' ? userVendorName : undefined,
        status: userStatus,
        permissions: {
          allowedMenus: {
            dashboard: userMenuDashboard,
            fsrMonitoring: userMenuFsr,
            masterData: userMenuMaster
          },
          allowedActions: {
            create: userActionCreate,
            edit: userActionEdit,
            delete: userActionDelete,
            workflow: userActionWorkflow
          }
        }
      }, currentUser);
      showMsg('success', 'User operasional berhasil disimpan.');
      resetForm();
      setIsFormModalOpen(false);
      reloadAll();
    } catch (err: any) {
      showMsg('error', err.message);
    }
  };

  // 📝 PREPARE EDIT TRIGGERS
  const startBranchEdit = (b: Branch) => {
    setEditingId(b.id);
    setBranchPlant(b.maint_plant);
    setBranchName(b.cabang);
  };

  const startCustomerEdit = (c: Customer) => {
    setEditingId(c.id);
    setCustomerCmd(c.cmd);
    setCustomerName(c.nama_customer);
  };

  const startVendorEdit = (v: Vendor) => {
    setEditingId(v.id);
    setVendorVmd(v.vmd);
    setVendorName(v.nama_vendor);
  };

  const startCategoryEdit = (c: Category) => {
    setEditingId(c.id);
    setCatCategory(c.kategori_layanan);
    setCatService(c.jenis_layanan);
    setCatPicRole(c.role_pic);
  };

  const startUnitEdit = (u: Unit) => {
    setEditingId(u.id);
    setUnitEq(u.no_equipment);
    setUnitPlate(u.license_plate);
    setUnitWarnaNopol(u.warna_nopol);
    setUnitDesc(u.description);
    setUnitGroup(u.kelompok_unit || '');
    setUnitCategory(u.kategori_unit || '');
    setUnitTypeGroup(u.kelompok_tipe || '');
    setUnitType(u.tipe_unit || '');
    setUnitCooler(u.pendingin || 'No');
    setUnitPower(u.power || '');
    setUnitYear(String(u.tahun_unit));
    setUnitChassis(u.chassis_no);
    setUnitEngine(u.engine_serial_no);
    setUnitColor(u.warna || '');
    setUnitCmd(u.cmd);
  };

  const startUserEdit = (u: OperationUser) => {
    setEditingId(u.id);
    setUserRealName(u.nama);
    setUserUsername(u.username);
    setUserRole(u.role_operation);
    setUserBranch(u.cabang_handling);
    setUserAssignedCustomer(u.assigned_customer_cmd || '');
    setUserAssignedVmd(u.assigned_vmd || '');
    setUserVendorName(u.vendor_name || '');
    setUserVendorSearch('');
    setIsUserVendorDropdownOpen(false);
    setUserStatus(u.status);
    setUserPassword('');
    if (u.permissions) {
      setUserMenuDashboard(u.permissions.allowedMenus.dashboard ?? true);
      setUserMenuFsr(u.permissions.allowedMenus.fsrMonitoring ?? true);
      setUserMenuMaster(u.permissions.allowedMenus.masterData ?? true);
      setUserActionCreate(u.permissions.allowedActions.create ?? true);
      setUserActionEdit(u.permissions.allowedActions.edit ?? true);
      setUserActionDelete(u.permissions.allowedActions.delete ?? false);
      setUserActionWorkflow(u.permissions.allowedActions.workflow ?? true);
    } else {
      setUserMenuDashboard(true);
      setUserMenuFsr(true);
      setUserMenuMaster(true);
      setUserActionCreate(true);
      setUserActionEdit(true);
      setUserActionDelete(u.role_operation === 'Super Admin');
      setUserActionWorkflow(true);
    }
  };

  // Dynamic names helper for confirm modal description
  const getItemName = (item: any): string => {
    if (activeSubTab === 'units') return `${item.license_plate} (${item.description})`;
    if (activeSubTab === 'branches') return `${item.maint_plant} - ${item.cabang}`;
    if (activeSubTab === 'customers') return `${item.cmd} - ${item.nama_customer}`;
    if (activeSubTab === 'vendors') return `${item.vmd} - ${item.nama_vendor}`;
    if (activeSubTab === 'categories') return `${item.kategori_layanan} - ${item.jenis_layanan}`;
    if (activeSubTab === 'users') return `${item.nama} (${item.username})`;
    return '';
  };

  // Helper trigger to prepare and open edit modal
  const handleEditClick = (item: any) => {
    resetForm();
    if (activeSubTab === 'units') startUnitEdit(item);
    else if (activeSubTab === 'branches') startBranchEdit(item);
    else if (activeSubTab === 'customers') startCustomerEdit(item);
    else if (activeSubTab === 'vendors') startVendorEdit(item);
    else if (activeSubTab === 'categories') startCategoryEdit(item);
    else if (activeSubTab === 'users') startUserEdit(item);
    setIsFormModalOpen(true);
  };

  // Excel Template Downloader
  const downloadExcelTemplate = () => {
    let headers: string[] = [];
    let samples: string[][] = [];
    let filename = '';

    if (activeSubTab === 'units') {
      headers = [
        'no_equipment',
        'license_plate',
        'warna_nopol',
        'description',
        'kelompok_unit',
        'kategori_unit',
        'kelompok_tipe',
        'tipe_unit',
        'pendingin',
        'power',
        'tahun_unit',
        'chassis_no',
        'engine_serial_no',
        'warna',
        'cmd',
        'customer'
      ];
      samples = [
        [
          'EQ-09881',
          'B 2309 PCG',
          'Kuning',
          'HINO DUTRO BOX 130 HD',
          'Truck Medium',
          'Cargo',
          'Light Truck',
          'Box',
          'No',
          '130 PS',
          '2021',
          'MHFGD7810A9811',
          'W04D-TN12301',
          'Merah / Putih',
          'CMD001',
          'PT Astra Sedaya Finance'
        ],
        [
          'EQ-10022',
          'B 9205 UXS',
          'Hitam',
          'TOYOTA AVANZA 1.3 G M/T',
          'Passenger Car',
          'Operational',
          'MPV',
          'Standard',
          'No',
          '97 HP',
          '2022',
          'MHFM15201A2012',
          '1NR-VE09182',
          'Silver Metallic',
          'CMD001',
          'PT Astra Sedaya Finance'
        ]
      ];
      filename = 'template_unit.xlsx';
    } else if (activeSubTab === 'branches') {
      headers = ['maint_plant', 'cabang'];
      samples = [
        ['PL02', 'Surabaya Raya'],
        ['PL03', 'Bandung Barat']
      ];
      filename = 'template_cabang.xlsx';
    } else if (activeSubTab === 'customers') {
      headers = ['cmd', 'nama_customer'];
      samples = [
        ['CMD002', 'PT Unilever Indonesia'],
        ['CMD003', 'PT HM Sampoerna']
      ];
      filename = 'template_customer.xlsx';
    } else if (activeSubTab === 'vendors') {
      headers = ['vmd', 'nama_vendor'];
      samples = [
        ['VMD002', 'CV Body Repair Lestari'],
        ['VMD003', 'PT Biro Jasa Sinar Utama']
      ];
      filename = 'template_vendor.xlsx';
    } else if (activeSubTab === 'categories') {
      headers = ['kategori_layanan', 'jenis_layanan', 'role_pic'];
      samples = [
        ['Maintenance', 'KIR Bulanan', 'SA'],
        ['Document', 'Perpanjang STNK', 'VRO'],
        ['Body Repair', 'Cat Bodi Penyok', 'SS']
      ];
      filename = 'template_layanan.xlsx';
    } else if (activeSubTab === 'users') {
      headers = ['nama', 'username', 'password', 'role_operation', 'cabang_handling', 'status', 'assigned_customer_cmd', 'assigned_vmd', 'vendor_name'];
      samples = [
        ['Andi Wijaya', 'andi_sa', 'pass123', 'SA', 'DKI Jakarta', 'Active', '', '', ''],
        ['Budi Prasetyo', 'budi_ss', 'pass123', 'SS', 'All Branches', 'Active', '', '', ''],
        ['Ahmad Vendor', 'ahmad_vendor', 'pass123', 'Vendor', 'DKI Jakarta', 'Active', '', 'VMD002', 'CV Body Repair Lestari'],
        ['Hendra Cust', 'hendra_cust', 'pass123', 'Admin Customer', 'All Branches', 'Active', 'CMD001', '', '']
      ];
      filename = 'template_user.xlsx';
    }

    const data = [headers, ...samples];
    const worksheet = XLSX.utils.aoa_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Template');

    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Excel drag/drop or upload reader
  const processExcelFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = new Uint8Array(event.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        
        // Get array of arrays format
        const rawRows = XLSX.utils.sheet_to_json<any[]>(worksheet, { header: 1 });
        
        // Convert cells to string
        const parsedRows: string[][] = rawRows.map(row => 
          Array.isArray(row) ? row.map(cell => cell === null || cell === undefined ? '' : String(cell).trim()) : []
        ).filter(row => row.length > 0 && row.some(cell => cell !== ''));

        if (parsedRows.length === 0) {
          setImportErrors(['Berkas Excel kosong atau tidak valid.']);
          setParsedGrid([]);
          setParsedPreview([]);
          return;
        }

        setParsedGrid(parsedRows);
        setImportErrors([]);
      } catch (err: any) {
        setImportErrors([`Gagal membaca berkas Excel: ${err.message}`]);
        setParsedGrid([]);
        setParsedPreview([]);
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processExcelFile(file);
    }
  };

  // Auto-validate parsed Excel data when it changes
  useEffect(() => {
    if (parsedGrid.length === 0) {
      setParsedPreview([]);
      return;
    }

    try {
      const headers = parsedGrid[0].map(h => mapHeaderKey(h));
      const rows = parsedGrid.slice(1);

      if (rows.length === 0) {
        setParsedPreview([]);
        setImportErrors(['Hanya header yang ditemukan, tidak ada data baris.']);
        return;
      }

      const errors: string[] = [];
      const previewItems: any[] = [];

      // Check required headers based on subtab
      let requiredFields: string[] = [];
      if (activeSubTab === 'units') {
        requiredFields = ['no_equipment', 'license_plate'];
      } else if (activeSubTab === 'branches') {
        requiredFields = ['cabang'];
      } else if (activeSubTab === 'customers') {
        requiredFields = ['nama_customer'];
      } else if (activeSubTab === 'vendors') {
        requiredFields = ['nama_vendor'];
      } else if (activeSubTab === 'categories') {
        requiredFields = ['jenis_layanan'];
      } else if (activeSubTab === 'users') {
        requiredFields = ['nama', 'username'];
      }

      // Validate each row flexibly
      rows.forEach((row, rowIndex) => {
        const item: any = {};
        headers.forEach((header, index) => {
          item[header] = (row[index] || '').trim();
        });

        const validationErrors: string[] = [];
        
        if (activeSubTab === 'units') {
          if (!item.no_equipment && !item.license_plate) {
            validationErrors.push("Setidaknya 'no_equipment' atau 'license_plate' harus diisi.");
          }
        } else if (activeSubTab === 'vendors') {
          if (!item.nama_vendor && !item.vmd) {
            validationErrors.push("Setidaknya 'nama_vendor' atau 'vmd' harus diisi.");
          }
        } else if (activeSubTab === 'customers') {
          if (!item.nama_customer && !item.cmd) {
            validationErrors.push("Setidaknya 'nama_customer' atau 'cmd' harus diisi.");
          }
        } else if (activeSubTab === 'branches') {
          if (!item.cabang && !item.maint_plant) {
            validationErrors.push("Setidaknya 'cabang' atau 'maint_plant' harus diisi.");
          }
        } else {
          requiredFields.forEach(field => {
            if (!item[field]) {
              validationErrors.push(`Kolom '${field}' kosong.`);
            }
          });
        }

        // Specific sub-tab checks
        if (activeSubTab === 'categories' && item.kategori_layanan) {
          if (!['Maintenance', 'Body Repair', 'Document'].includes(item.kategori_layanan)) {
            validationErrors.push('Kategori layanan harus "Maintenance", "Body Repair", atau "Document"');
          }
        }

        previewItems.push({
          rowNum: rowIndex + 2, // 1-indexed plus header
          data: item,
          isValid: validationErrors.length === 0,
          errors: validationErrors
        });
      });

      setParsedPreview(previewItems);
      setImportErrors([]);
    } catch (err: any) {
      setImportErrors([`Gagal memproses berkas Excel: ${err.message}`]);
      setParsedPreview([]);
    }
  }, [parsedGrid, activeSubTab]);

  // Execute actual import
  const executeImport = async () => {
    const validItems = parsedPreview.filter(p => p.isValid);
    if (validItems.length === 0) {
      showMsg('error', 'Tidak ada data valid untuk diimpor.');
      return;
    }

    let count = 0;
    try {
      for (let index = 0; index < validItems.length; index++) {
        const item = validItems[index];
        const d = item.data;
        if (activeSubTab === 'units') {
          const eq = d.no_equipment || d.license_plate || `EQ-${index + 100}`;
          const plate = d.license_plate || d.no_equipment || 'B 0000 XX';
          const defaultCmd = customers.length > 0 ? customers[0].cmd : '3000170';
          let resolvedCmd = d.cmd || '';
          if (!resolvedCmd && d.customer_name) {
            const matchedCust = customers.find(c => 
              c.nama_customer.toLowerCase().trim().includes(d.customer_name.toLowerCase().trim()) ||
              d.customer_name.toLowerCase().trim().includes(c.nama_customer.toLowerCase().trim())
            );
            if (matchedCust) {
              resolvedCmd = matchedCust.cmd;
            }
          }
          if (!resolvedCmd) resolvedCmd = defaultCmd;

          await localDb.saveUnit({
            no_equipment: eq,
            license_plate: plate,
            warna_nopol: d.warna_nopol || 'Hitam',
            description: d.description || `Kendaraan Unit ${eq}`,
            kelompok_unit: d.kelompok_unit || 'Fleet',
            kategori_unit: d.kategori_unit || 'Passenger',
            kelompok_tipe: d.kelompok_tipe || '',
            tipe_unit: d.tipe_unit || '',
            pendingin: d.pendingin || 'No',
            power: d.power || '',
            tahun_unit: Number(d.tahun_unit) || new Date().getFullYear(),
            chassis_no: d.chassis_no || '-',
            engine_serial_no: d.engine_serial_no || '-',
            warna: d.warna || 'Putih',
            cmd: resolvedCmd
          }, currentUser);
        } else if (activeSubTab === 'branches') {
          const plant = d.maint_plant || d.cabang || `PLANT-${index + 1}`;
          const branchName = d.cabang || d.maint_plant || `Cabang ${index + 1}`;
          await localDb.saveBranch({
            maint_plant: plant,
            cabang: branchName
          }, currentUser);
        } else if (activeSubTab === 'customers') {
          const cmdCode = d.cmd || `CUST-${index + 1}`;
          const custName = d.nama_customer || d.namacustomer || cmdCode;
          await localDb.saveCustomer({
            cmd: cmdCode,
            nama_customer: custName
          }, currentUser);
        } else if (activeSubTab === 'vendors') {
          const vmdCode = d.vmd || `VMD-${index + 1}`;
          const vendorName = d.nama_vendor || d.namavendor || d.nama || vmdCode;
          await localDb.saveVendor({
            vmd: vmdCode,
            nama_vendor: vendorName
          }, currentUser);
        } else if (activeSubTab === 'categories') {
          await localDb.saveCategory({
            kategori_layanan: (d.kategori_layanan || 'Maintenance') as ServiceCategory,
            jenis_layanan: d.jenis_layanan || 'Layanan Umum',
            role_pic: (d.role_pic || 'SA') as 'SA' | 'SS' | 'VRO'
          }, currentUser);
        } else if (activeSubTab === 'users') {
          await localDb.saveOperationUser({
            nama: d.nama || 'User Baru',
            username: d.username || `user_${index + 1}`,
            password: d.password || 'password123',
            role_operation: (d.role_operation || 'SA') as UserRole,
            cabang_handling: d.cabang_handling || 'All',
            assigned_customer_cmd: d.assigned_customer_cmd || '',
            assigned_vmd: d.assigned_vmd || '',
            vendor_name: d.vendor_name || '',
            status: (d.status || 'Active') as 'Active' | 'Inactive'
          }, currentUser);
        }
        count++;
      }

      showMsg('success', `Berhasil mengimpor ${count} baris data.`);
      setIsImportModalOpen(false);
      setParsedGrid([]);
      setParsedPreview([]);
      setImportedCount(count);
      setImportedTab(
        activeSubTab === 'units' ? 'Unit Kendaraan' :
        activeSubTab === 'branches' ? 'Cabang (Plant)' :
        activeSubTab === 'customers' ? 'Customer' :
        activeSubTab === 'vendors' ? 'Vendor' :
        activeSubTab === 'categories' ? 'Kategori Layanan' : 'User Operasional'
      );
      setIsImportSuccessOpen(true);
      reloadAll();
    } catch (err: any) {
      showMsg('error', `Gagal mengimpor data: ${err.message}`);
    }
  };

  // Search filtering logic
  const filteredUnits = units.filter(u =>
    u.license_plate.toLowerCase().includes(searchVal.toLowerCase()) ||
    u.description.toLowerCase().includes(searchVal.toLowerCase()) ||
    u.no_equipment.toLowerCase().includes(searchVal.toLowerCase()) ||
    u.customer_name.toLowerCase().includes(searchVal.toLowerCase()) ||
    u.chassis_no.toLowerCase().includes(searchVal.toLowerCase())
  );

  const filteredBranches = branches.filter(b =>
    b.maint_plant.toLowerCase().includes(searchVal.toLowerCase()) ||
    b.cabang.toLowerCase().includes(searchVal.toLowerCase())
  );

  const filteredCustomers = customers.filter(c =>
    c.cmd.toLowerCase().includes(searchVal.toLowerCase()) ||
    c.nama_customer.toLowerCase().includes(searchVal.toLowerCase())
  );

  const filteredVendors = vendors.filter(v =>
    v.vmd.toLowerCase().includes(searchVal.toLowerCase()) ||
    v.nama_vendor.toLowerCase().includes(searchVal.toLowerCase())
  );

  const filteredCategories = categories.filter(c =>
    c.kategori_layanan.toLowerCase().includes(searchVal.toLowerCase()) ||
    c.jenis_layanan.toLowerCase().includes(searchVal.toLowerCase()) ||
    c.role_pic.toLowerCase().includes(searchVal.toLowerCase())
  );

  const filteredUsers = operationUsers.filter(u =>
    u.nama.toLowerCase().includes(searchVal.toLowerCase()) ||
    u.username.toLowerCase().includes(searchVal.toLowerCase()) ||
    u.role_operation.toLowerCase().includes(searchVal.toLowerCase()) ||
    u.cabang_handling.toLowerCase().includes(searchVal.toLowerCase())
  );

  const paginatedUnits = filteredUnits.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  const paginatedBranches = filteredBranches.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  const paginatedCustomers = filteredCustomers.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  const paginatedVendors = filteredVendors.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  const paginatedCategories = filteredCategories.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  const paginatedUsers = filteredUsers.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const getActiveListInfo = () => {
    switch (activeSubTab) {
      case 'units':
        return { total: filteredUnits.length, paginated: paginatedUnits };
      case 'branches':
        return { total: filteredBranches.length, paginated: paginatedBranches };
      case 'customers':
        return { total: filteredCustomers.length, paginated: paginatedCustomers };
      case 'vendors':
        return { total: filteredVendors.length, paginated: paginatedVendors };
      case 'categories':
        return { total: filteredCategories.length, paginated: paginatedCategories };
      case 'users':
        return { total: filteredUsers.length, paginated: paginatedUsers };
      default:
        return { total: 0, paginated: [] };
    }
  };

  const { total: currentTotal, paginated: currentPaginated } = getActiveListInfo();
  const totalPages = Math.ceil(currentTotal / pageSize) || 1;

  return (
    <div className="flex flex-col md:flex-row gap-6">
      
      {/* Tab Menu Left Column */}
      <div className="w-full md:w-56 shrink-0 space-y-2">
        <h3 className="text-xs font-bold tracking-wider text-gray-400 uppercase px-3">
          Master Tables
        </h3>
        <nav className="space-y-1">
          {[
            { id: 'units', label: 'Master Unit Kendaraan', icon: Car, count: units.length },
            { id: 'branches', label: 'Master Cabang (Plant)', icon: Building2, count: branches.length },
            { id: 'customers', label: 'Master Customer', icon: Users, count: customers.length },
            { id: 'vendors', label: 'Master Vendor', icon: ShieldAlert, count: vendors.length },
            { id: 'categories', label: 'Master Layanan', icon: FolderTree, count: categories.length },
            { id: 'users', label: 'User Operasional', icon: UserCheck, count: operationUsers.length },
            { id: 'settings', label: 'Konfigurasi Drive', icon: Settings, count: appsScriptUrl ? 'Aktif' : 'Off' }
          ].map((tab) => {
            const Icon = tab.icon;
            const isSel = activeSubTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveSubTab(tab.id as any);
                  setSearchVal('');
                  resetForm();
                }}
                className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-xs font-semibold transition-colors ${
                  isSel
                    ? 'bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400'
                    : 'text-gray-600 hover:bg-gray-50 dark:text-gray-400 dark:hover:bg-gray-800'
                }`}
              >
                <span className="flex items-center gap-2">
                  <Icon className="h-4 w-4" />
                  {tab.label}
                </span>
                <span className="rounded bg-gray-100 px-1.5 py-0.5 text-[9px] dark:bg-gray-800">
                  {tab.count}
                </span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Main Data List Area */}
      <div className="flex-1 rounded-2xl border border-gray-100 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-950">
        
        {formMsg.text && (
          <div className={`mb-6 flex items-center gap-3 rounded-lg p-3 text-xs font-bold ${
            formMsg.type === 'success' ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/20' : 'bg-red-50 text-red-600 dark:bg-red-950/20'
          }`}>
            {formMsg.type === 'success' ? <CheckCircle className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
            {formMsg.text}
          </div>
        )}

        {/* ----------------- TABLE CONTROL BAR ----------------- */}
        {activeSubTab !== 'settings' && (
          <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-gray-50 p-4 rounded-xl dark:bg-gray-900/50 border border-gray-100 dark:border-gray-800/80">
            <div className="flex w-full items-center gap-2 sm:max-w-md">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-gray-400" />
                <input
                  type="text"
                  placeholder={`Cari data ${activeSubTab === 'units' ? 'unit' : activeSubTab === 'branches' ? 'cabang' : activeSubTab === 'customers' ? 'customer' : activeSubTab === 'vendors' ? 'vendor' : activeSubTab === 'categories' ? 'layanan' : 'user'}...`}
                  value={searchVal}
                  onChange={e => setSearchVal(e.target.value)}
                  className="w-full rounded-lg border border-gray-200 bg-white py-1.5 pl-8 pr-8 text-xs dark:border-gray-800 dark:bg-gray-950 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20"
                />
                {searchVal && (
                  <button 
                    onClick={() => setSearchVal('')} 
                    className="absolute right-3 top-2 text-xs text-gray-400 hover:text-gray-600"
                  >
                    Clear
                  </button>
                )}
              </div>
              <select
                value={pageSize}
                onChange={(e) => setPageSize(Number(e.target.value))}
                className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs dark:border-gray-800 dark:bg-gray-950"
              >
                {[5, 10, 25, 50, 100, 500].map(size => (
                  <option key={size} value={size}>{size} data</option>
                ))}
              </select>
            </div>
            <div className="flex w-full sm:w-auto items-center gap-2">
              <button
                onClick={() => {
                  resetForm();
                  setIsFormModalOpen(true);
                }}
                className="flex items-center justify-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-xs font-bold text-white hover:bg-blue-700 w-full sm:w-auto shadow-xs transition-colors"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Tambah Baru</span>
              </button>
              <button
                onClick={() => {
                  setParsedGrid([]);
                  setParsedPreview([]);
                  setImportErrors([]);
                  setIsImportModalOpen(true);
                }}
                className="flex items-center justify-center gap-1.5 rounded-lg border border-gray-200 bg-white px-4 py-2 text-xs font-bold text-gray-700 hover:bg-gray-50 dark:border-gray-800 dark:bg-gray-950 dark:text-gray-300 dark:hover:bg-gray-900 w-full sm:w-auto shadow-xs transition-colors"
              >
                <FileSpreadsheet className="h-3.5 w-3.5 text-emerald-600" />
                <span>Import Batch</span>
              </button>
            </div>
          </div>
        )}

        {/* ----------------- SUBTAB: UNITS ----------------- */}
        {activeSubTab === 'units' && (
          <div className="space-y-4 animate-fade-in">
            <div className="flex justify-between items-center">
              <span className="text-xs font-bold text-gray-400 block">Unit Kendaraan List ({filteredUnits.length} records)</span>
            </div>
            
            <div className="border border-gray-100 rounded-xl dark:border-gray-800 overflow-x-auto">
              <table className="w-full text-left text-xs min-w-[1600px]">
                <thead>
                  <tr className="bg-gray-50/50 dark:bg-gray-900/50 border-b border-gray-100 dark:border-gray-800 text-gray-400">
                    <th className="p-3">No Equipment</th>
                    <th className="p-3">License Plate</th>
                    <th className="p-3">Warna Nopol</th>
                    <th className="p-3">Description</th>
                    <th className="p-3">Kelompok Unit</th>
                    <th className="p-3">Kategori Unit</th>
                    <th className="p-3">Kelompok Tipe</th>
                    <th className="p-3">Tipe Unit</th>
                    <th className="p-3">Pendingin</th>
                    <th className="p-3">Power</th>
                    <th className="p-3">Tahun Unit</th>
                    <th className="p-3">Chassis No</th>
                    <th className="p-3">Engine Serial No</th>
                    <th className="p-3">Warna</th>
                    <th className="p-3">CMD</th>
                    <th className="p-3">Customer</th>
                    <th className="p-3 text-center w-24 sticky right-0 bg-white dark:bg-gray-950 shadow-[0_0_10px_rgba(0,0,0,0.05)]">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 dark:divide-gray-900">
                  {currentPaginated.length === 0 ? (
                    <tr>
                      <td colSpan={17} className="p-6 text-center text-gray-400">Data unit tidak ditemukan.</td>
                    </tr>
                  ) : (
                    currentPaginated.map(u => (
                      <tr key={u.id} className="text-gray-700 dark:text-gray-300 hover:bg-gray-50/30 dark:hover:bg-gray-900/10">
                        <td className="p-3 font-mono font-bold text-gray-900 dark:text-white">{u.no_equipment}</td>
                        <td className="p-3 font-bold text-blue-600 dark:text-blue-400">{u.license_plate}</td>
                        <td className="p-3">
                          <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                            u.warna_nopol === 'Kuning' ? 'bg-yellow-100 text-yellow-800' :
                            u.warna_nopol === 'Merah' ? 'bg-red-100 text-red-800' :
                            u.warna_nopol === 'Putih' ? 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200' :
                            'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-200'
                          }`}>
                            {u.warna_nopol}
                          </span>
                        </td>
                        <td className="p-3">{u.description}</td>
                        <td className="p-3">{u.kelompok_unit || '-'}</td>
                        <td className="p-3">{u.kategori_unit || '-'}</td>
                        <td className="p-3">{u.kelompok_tipe || '-'}</td>
                        <td className="p-3">{u.tipe_unit || '-'}</td>
                        <td className="p-3">{u.pendingin || 'No'}</td>
                        <td className="p-3">{u.power || '-'}</td>
                        <td className="p-3">{u.tahun_unit}</td>
                        <td className="p-3 font-mono text-gray-500">{u.chassis_no}</td>
                        <td className="p-3 font-mono text-gray-500">{u.engine_serial_no}</td>
                        <td className="p-3">{u.warna || '-'}</td>
                        <td className="p-3">
                          <span className="rounded bg-blue-50 px-2 py-0.5 text-[10px] font-bold text-blue-600 dark:bg-blue-950/40 dark:text-blue-400">
                            {u.cmd}
                          </span>
                        </td>
                        <td className="p-3 text-gray-500">{u.customer_name}</td>
                        <td className="p-2 text-center sticky right-0 bg-white dark:bg-gray-950 shadow-[0_0_10px_rgba(0,0,0,0.05)]">
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              onClick={() => handleEditClick(u)}
                              className="flex h-7 w-7 items-center justify-center rounded-lg border border-gray-200 bg-white text-blue-600 hover:bg-blue-50 dark:border-gray-800 dark:bg-gray-900 dark:text-blue-400 dark:hover:bg-blue-950/40 transition-colors"
                              title="Edit"
                            >
                              <Edit3 className="h-3.5 w-3.5" />
                            </button>
                            <button
                              onClick={() => {
                                setDeletingItem({ id: u.id, name: getItemName(u) });
                                setIsDeleteModalOpen(true);
                              }}
                              className="flex h-7 w-7 items-center justify-center rounded-lg border border-gray-200 bg-white text-red-600 hover:bg-red-50 dark:border-gray-800 dark:bg-gray-900 dark:text-red-400 dark:hover:bg-red-950/40 transition-colors"
                              title="Hapus"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            {/* Pagination Controls */}
            <div className="flex items-center justify-between pt-4 border-t border-gray-100 dark:border-gray-800">
              <span className="text-xs text-gray-500">
                Showing {Math.min((currentPage - 1) * pageSize + 1, currentTotal)} to {Math.min(currentPage * pageSize, currentTotal)} of {currentTotal} entries
              </span>
              <div className="flex items-center gap-2">
                <button
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage(p => p - 1)}
                  className="p-1.5 rounded border border-gray-200 dark:border-gray-800 disabled:opacity-50 hover:bg-gray-50 dark:hover:bg-gray-800"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <span className="text-xs font-semibold">{currentPage} of {totalPages}</span>
                <button
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage(p => p + 1)}
                  className="p-1.5 rounded border border-gray-200 dark:border-gray-800 disabled:opacity-50 hover:bg-gray-50 dark:hover:bg-gray-800"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ----------------- SUBTAB: BRANCHES ----------------- */}
        {activeSubTab === 'branches' && (
          <div className="space-y-4 animate-fade-in">
            <span className="text-xs font-bold text-gray-400 block">Branch List ({filteredBranches.length} records)</span>
            <div className="border border-gray-100 rounded-xl dark:border-gray-800 overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-gray-50/50 dark:bg-gray-900/50 border-b border-gray-100 dark:border-gray-800 text-gray-400">
                    <th className="p-3">Plant Code</th>
                    <th className="p-3">Nama Cabang</th>
                    <th className="p-3 text-center w-24">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 dark:divide-gray-900">
                  {currentPaginated.length === 0 ? (
                    <tr>
                      <td colSpan={3} className="p-6 text-center text-gray-400">Data cabang tidak ditemukan.</td>
                    </tr>
                  ) : (
                    currentPaginated.map(b => (
                      <tr key={b.id} className="text-gray-700 dark:text-gray-300 hover:bg-gray-50/30 dark:hover:bg-gray-900/10">
                        <td className="p-3 font-mono font-bold text-gray-900 dark:text-white">{b.maint_plant}</td>
                        <td className="p-3">{b.cabang}</td>
                        <td className="p-2 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              onClick={() => handleEditClick(b)}
                              className="flex h-7 w-7 items-center justify-center rounded-lg border border-gray-200 bg-white text-blue-600 hover:bg-blue-50 dark:border-gray-800 dark:bg-gray-900 dark:text-blue-400 dark:hover:bg-blue-950/40 transition-colors"
                              title="Edit"
                            >
                              <Edit3 className="h-3.5 w-3.5" />
                            </button>
                            <button
                              onClick={() => {
                                setDeletingItem({ id: b.id, name: getItemName(b) });
                                setIsDeleteModalOpen(true);
                              }}
                              className="flex h-7 w-7 items-center justify-center rounded-lg border border-gray-200 bg-white text-red-600 hover:bg-red-50 dark:border-gray-800 dark:bg-gray-900 dark:text-red-400 dark:hover:bg-red-950/40 transition-colors"
                              title="Hapus"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            {/* Pagination Controls */}
            <div className="flex items-center justify-between pt-4 border-t border-gray-100 dark:border-gray-800">
              <span className="text-xs text-gray-500">
                Showing {Math.min((currentPage - 1) * pageSize + 1, currentTotal)} to {Math.min(currentPage * pageSize, currentTotal)} of {currentTotal} entries
              </span>
              <div className="flex items-center gap-2">
                <button
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage(p => p - 1)}
                  className="p-1.5 rounded border border-gray-200 dark:border-gray-800 disabled:opacity-50 hover:bg-gray-50 dark:hover:bg-gray-800"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <span className="text-xs font-semibold">{currentPage} of {totalPages}</span>
                <button
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage(p => p + 1)}
                  className="p-1.5 rounded border border-gray-200 dark:border-gray-800 disabled:opacity-50 hover:bg-gray-50 dark:hover:bg-gray-800"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ----------------- SUBTAB: CUSTOMERS ----------------- */}
        {activeSubTab === 'customers' && (
          <div className="space-y-4 animate-fade-in">
            <span className="text-xs font-bold text-gray-400 block">Customer List ({filteredCustomers.length} records)</span>
            <div className="border border-gray-100 rounded-xl dark:border-gray-800 overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-gray-50/50 dark:bg-gray-900/50 border-b border-gray-100 dark:border-gray-800 text-gray-400">
                    <th className="p-3">CMD Code</th>
                    <th className="p-3">Nama Customer</th>
                    <th className="p-3 text-center w-24">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 dark:divide-gray-900">
                  {currentPaginated.length === 0 ? (
                    <tr>
                      <td colSpan={3} className="p-6 text-center text-gray-400">Data customer tidak ditemukan.</td>
                    </tr>
                  ) : (
                    currentPaginated.map(c => (
                      <tr key={c.id} className="text-gray-700 dark:text-gray-300 hover:bg-gray-50/30 dark:hover:bg-gray-900/10">
                        <td className="p-3 font-mono font-bold text-gray-900 dark:text-white">{c.cmd}</td>
                        <td className="p-3 font-semibold">{c.nama_customer}</td>
                        <td className="p-2 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              onClick={() => handleEditClick(c)}
                              className="flex h-7 w-7 items-center justify-center rounded-lg border border-gray-200 bg-white text-blue-600 hover:bg-blue-50 dark:border-gray-800 dark:bg-gray-900 dark:text-blue-400 dark:hover:bg-blue-950/40 transition-colors"
                              title="Edit"
                            >
                              <Edit3 className="h-3.5 w-3.5" />
                            </button>
                            <button
                              onClick={() => {
                                setDeletingItem({ id: c.id, name: getItemName(c) });
                                setIsDeleteModalOpen(true);
                              }}
                              className="flex h-7 w-7 items-center justify-center rounded-lg border border-gray-200 bg-white text-red-600 hover:bg-red-50 dark:border-gray-800 dark:bg-gray-900 dark:text-red-400 dark:hover:bg-red-950/40 transition-colors"
                              title="Hapus"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            {/* Pagination Controls */}
            <div className="flex items-center justify-between pt-4 border-t border-gray-100 dark:border-gray-800">
              <span className="text-xs text-gray-500">
                Showing {Math.min((currentPage - 1) * pageSize + 1, currentTotal)} to {Math.min(currentPage * pageSize, currentTotal)} of {currentTotal} entries
              </span>
              <div className="flex items-center gap-2">
                <button
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage(p => p - 1)}
                  className="p-1.5 rounded border border-gray-200 dark:border-gray-800 disabled:opacity-50 hover:bg-gray-50 dark:hover:bg-gray-800"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <span className="text-xs font-semibold">{currentPage} of {totalPages}</span>
                <button
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage(p => p + 1)}
                  className="p-1.5 rounded border border-gray-200 dark:border-gray-800 disabled:opacity-50 hover:bg-gray-50 dark:hover:bg-gray-800"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ----------------- SUBTAB: VENDORS ----------------- */}
        {activeSubTab === 'vendors' && (
          <div className="space-y-4 animate-fade-in">
            <span className="text-xs font-bold text-gray-400 block">Vendor List ({filteredVendors.length} records)</span>
            <div className="border border-gray-100 rounded-xl dark:border-gray-800 overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-gray-50/50 dark:bg-gray-900/50 border-b border-gray-100 dark:border-gray-800 text-gray-400">
                    <th className="p-3">VMD Code</th>
                    <th className="p-3">Nama Vendor</th>
                    <th className="p-3 text-center w-24">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 dark:divide-gray-900">
                  {currentPaginated.length === 0 ? (
                    <tr>
                      <td colSpan={3} className="p-6 text-center text-gray-400">Data vendor tidak ditemukan.</td>
                    </tr>
                  ) : (
                    currentPaginated.map(v => (
                      <tr key={v.id} className="text-gray-700 dark:text-gray-300 hover:bg-gray-50/30 dark:hover:bg-gray-900/10">
                        <td className="p-3 font-mono font-bold text-gray-900 dark:text-white">{v.vmd}</td>
                        <td className="p-3 font-semibold">{v.nama_vendor}</td>
                        <td className="p-2 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              onClick={() => handleEditClick(v)}
                              className="flex h-7 w-7 items-center justify-center rounded-lg border border-gray-200 bg-white text-blue-600 hover:bg-blue-50 dark:border-gray-800 dark:bg-gray-900 dark:text-blue-400 dark:hover:bg-blue-950/40 transition-colors"
                              title="Edit"
                            >
                              <Edit3 className="h-3.5 w-3.5" />
                            </button>
                            <button
                              onClick={() => {
                                setDeletingItem({ id: v.id, name: getItemName(v) });
                                setIsDeleteModalOpen(true);
                              }}
                              className="flex h-7 w-7 items-center justify-center rounded-lg border border-gray-200 bg-white text-red-600 hover:bg-red-50 dark:border-gray-800 dark:bg-gray-900 dark:text-red-400 dark:hover:bg-red-950/40 transition-colors"
                              title="Hapus"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            {/* Pagination Controls */}
            <div className="flex items-center justify-between pt-4 border-t border-gray-100 dark:border-gray-800">
              <span className="text-xs text-gray-500">
                Showing {Math.min((currentPage - 1) * pageSize + 1, currentTotal)} to {Math.min(currentPage * pageSize, currentTotal)} of {currentTotal} entries
              </span>
              <div className="flex items-center gap-2">
                <button
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage(p => p - 1)}
                  className="p-1.5 rounded border border-gray-200 dark:border-gray-800 disabled:opacity-50 hover:bg-gray-50 dark:hover:bg-gray-800"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <span className="text-xs font-semibold">{currentPage} of {totalPages}</span>
                <button
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage(p => p + 1)}
                  className="p-1.5 rounded border border-gray-200 dark:border-gray-800 disabled:opacity-50 hover:bg-gray-50 dark:hover:bg-gray-800"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ----------------- SUBTAB: CATEGORIES ----------------- */}
        {activeSubTab === 'categories' && (
          <div className="space-y-4 animate-fade-in">
            <span className="text-xs font-bold text-gray-400 block">Kategori Layanan Mapping ({filteredCategories.length} records)</span>
            <div className="border border-gray-100 rounded-xl dark:border-gray-800 overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-gray-50/50 dark:bg-gray-900/50 border-b border-gray-100 dark:border-gray-800 text-gray-400">
                    <th className="p-3">Kategori Layanan</th>
                    <th className="p-3">Jenis Layanan</th>
                    <th className="p-3">Role PIC</th>
                    <th className="p-3 text-center w-24">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 dark:divide-gray-900">
                  {currentPaginated.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="p-6 text-center text-gray-400">Data layanan tidak ditemukan.</td>
                    </tr>
                  ) : (
                    currentPaginated.map(c => (
                      <tr key={c.id} className="text-gray-700 dark:text-gray-300 hover:bg-gray-50/30 dark:hover:bg-gray-900/10">
                        <td className="p-3 font-bold text-gray-900 dark:text-white">{c.kategori_layanan}</td>
                        <td className="p-3 font-semibold text-blue-600">{c.jenis_layanan}</td>
                        <td className="p-3 font-mono">{c.role_pic}</td>
                        <td className="p-2 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              onClick={() => handleEditClick(c)}
                              className="flex h-7 w-7 items-center justify-center rounded-lg border border-gray-200 bg-white text-blue-600 hover:bg-blue-50 dark:border-gray-800 dark:bg-gray-900 dark:text-blue-400 dark:hover:bg-blue-950/40 transition-colors"
                              title="Edit"
                            >
                              <Edit3 className="h-3.5 w-3.5" />
                            </button>
                            <button
                              onClick={() => {
                                setDeletingItem({ id: c.id, name: getItemName(c) });
                                setIsDeleteModalOpen(true);
                              }}
                              className="flex h-7 w-7 items-center justify-center rounded-lg border border-gray-200 bg-white text-red-600 hover:bg-red-50 dark:border-gray-800 dark:bg-gray-900 dark:text-red-400 dark:hover:bg-red-950/40 transition-colors"
                              title="Hapus"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            {/* Pagination Controls */}
            <div className="flex items-center justify-between pt-4 border-t border-gray-100 dark:border-gray-800">
              <span className="text-xs text-gray-500">
                Showing {Math.min((currentPage - 1) * pageSize + 1, currentTotal)} to {Math.min(currentPage * pageSize, currentTotal)} of {currentTotal} entries
              </span>
              <div className="flex items-center gap-2">
                <button
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage(p => p - 1)}
                  className="p-1.5 rounded border border-gray-200 dark:border-gray-800 disabled:opacity-50 hover:bg-gray-50 dark:hover:bg-gray-800"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <span className="text-xs font-semibold">{currentPage} of {totalPages}</span>
                <button
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage(p => p + 1)}
                  className="p-1.5 rounded border border-gray-200 dark:border-gray-800 disabled:opacity-50 hover:bg-gray-50 dark:hover:bg-gray-800"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ----------------- SUBTAB: OPERATION USERS ----------------- */}
        {activeSubTab === 'users' && (
          <div className="space-y-4 animate-fade-in">
            <span className="text-xs font-bold text-gray-400 block">User Operasional Directory ({filteredUsers.length} records)</span>
            <div className="border border-gray-100 rounded-xl dark:border-gray-800 overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-gray-50/50 dark:bg-gray-900/50 border-b border-gray-100 dark:border-gray-800 text-gray-400">
                    <th className="p-3">Nama Pengguna</th>
                    <th className="p-3">Username</th>
                    <th className="p-3">Role</th>
                    <th className="p-3">Cabang Handling</th>
                    <th className="p-3">Status</th>
                    <th className="p-3 text-center w-24">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 dark:divide-gray-900">
                  {currentPaginated.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="p-6 text-center text-gray-400">Data user tidak ditemukan.</td>
                    </tr>
                  ) : (
                    currentPaginated.map(u => (
                      <tr key={u.id} className="text-gray-700 dark:text-gray-300 hover:bg-gray-50/30 dark:hover:bg-gray-900/10">
                        <td className="p-3 font-bold text-gray-900 dark:text-white">{u.nama}</td>
                        <td className="p-3 font-mono text-gray-500">{u.username}</td>
                        <td className="p-3">
                          <span className="rounded bg-blue-50 px-2 py-0.5 text-[9px] font-bold text-blue-600 dark:bg-blue-950 dark:text-blue-400">
                            {u.role_operation}
                          </span>
                        </td>
                        <td className="p-3">{u.cabang_handling}</td>
                        <td className="p-3">
                          <span className={`rounded-full px-2 py-0.5 text-[9px] font-bold ${
                            u.status === 'Active' ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/20 dark:text-emerald-400' : 'bg-red-50 text-red-600 dark:bg-red-950/20'
                          }`}>
                            {u.status}
                          </span>
                        </td>
                        <td className="p-2 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              onClick={() => handleEditClick(u)}
                              className="flex h-7 w-7 items-center justify-center rounded-lg border border-gray-200 bg-white text-blue-600 hover:bg-blue-50 dark:border-gray-800 dark:bg-gray-900 dark:text-blue-400 dark:hover:bg-blue-950/40 transition-colors"
                              title="Edit"
                            >
                              <Edit3 className="h-3.5 w-3.5" />
                            </button>
                            <button
                              onClick={() => {
                                setDeletingItem({ id: u.id, name: getItemName(u) });
                                setIsDeleteModalOpen(true);
                              }}
                              className="flex h-7 w-7 items-center justify-center rounded-lg border border-gray-200 bg-white text-red-600 hover:bg-red-50 dark:border-gray-800 dark:bg-gray-900 dark:text-red-400 dark:hover:bg-red-950/40 transition-colors"
                              title="Hapus"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            {/* Pagination Controls */}
            <div className="flex items-center justify-between pt-4 border-t border-gray-100 dark:border-gray-800">
              <span className="text-xs text-gray-500">
                Showing {Math.min((currentPage - 1) * pageSize + 1, currentTotal)} to {Math.min(currentPage * pageSize, currentTotal)} of {currentTotal} entries
              </span>
              <div className="flex items-center gap-2">
                <button
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage(p => p - 1)}
                  className="p-1.5 rounded border border-gray-200 dark:border-gray-800 disabled:opacity-50 hover:bg-gray-50 dark:hover:bg-gray-800"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <span className="text-xs font-semibold">{currentPage} of {totalPages}</span>
                <button
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage(p => p + 1)}
                  className="p-1.5 rounded border border-gray-200 dark:border-gray-800 disabled:opacity-50 hover:bg-gray-50 dark:hover:bg-gray-800"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ----------------- SUBTAB: GOOGLE DRIVE CONFIGURATION ----------------- */}
        {activeSubTab === 'settings' && (
          <div className="space-y-6 animate-fade-in text-xs text-gray-700 dark:text-gray-300">
            <div className="border-b border-gray-100 pb-4 dark:border-gray-800">
              <h4 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <Settings className="h-4 w-4 text-blue-600" />
                Konfigurasi Google Drive (Google Apps Script)
              </h4>
              <p className="text-gray-500 mt-1">
                Ikuti panduan berikut untuk mengintegrasikan form upload FSR langsung ke Google Drive folder Anda.
              </p>
            </div>

            {/* Folder Target Banner */}
            <div className="rounded-xl bg-blue-50/50 p-4 border border-blue-100 dark:bg-blue-950/20 dark:border-blue-900/30 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
              <div>
                <span className="font-bold text-blue-800 dark:text-blue-300 block">Folder Google Drive Target:</span>
                <span className="text-[10px] text-gray-500 dark:text-gray-400 font-mono block truncate max-w-md mt-0.5">
                  1Y5SIYTgTzwdolNFd2NomT3QDhT-km3R4
                </span>
              </div>
              <a 
                href="https://drive.google.com/drive/folders/1Y5SIYTgTzwdolNFd2NomT3QDhT-km3R4" 
                target="_blank" 
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-600 hover:underline shrink-0"
              >
                Buka Folder Drive <ExternalLink className="h-3.5 w-3.5" />
              </a>
            </div>

            {/* URL Input Form */}
            <div className="space-y-3 bg-gray-50 dark:bg-gray-900/30 p-5 rounded-xl border border-gray-100 dark:border-gray-800">
              <label className="font-bold text-gray-800 dark:text-gray-200 flex items-center gap-1.5">
                <Link2 className="h-4 w-4 text-blue-600" /> URL Web App Google Apps Script
              </label>
              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  type="url"
                  placeholder="https://script.google.com/macros/s/.../exec"
                  value={appsScriptUrl}
                  onChange={(e) => setAppsScriptUrl(e.target.value)}
                  className="flex-1 rounded-lg border border-gray-200 bg-white px-3.5 py-2 focus:border-blue-500 focus:outline-hidden dark:border-gray-800 dark:bg-gray-950 dark:text-white font-mono"
                />
                <button
                  onClick={() => {
                    localStorage.setItem('fsr_apps_script_url', appsScriptUrl.trim());
                    setFormMsg({ type: 'success', text: 'Konfigurasi Google Apps Script URL berhasil disimpan!' });
                    setTimeout(() => setFormMsg({ type: '', text: '' }), 4000);
                  }}
                  className="rounded-lg bg-blue-600 px-5 py-2 font-bold text-white hover:bg-blue-700 shadow-sm transition-colors"
                >
                  Simpan URL
                </button>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2 pt-2">
                <button
                  onClick={async () => {
                    if (!appsScriptUrl) {
                      setTestResult({ success: false, message: 'Masukkan URL terlebih dahulu!' });
                      return;
                    }
                    setIsTestingConnection(true);
                    setTestResult(null);
                    const res = await testAppsScriptConnection(appsScriptUrl);
                    setIsTestingConnection(false);
                    setTestResult(res);
                  }}
                  disabled={isTestingConnection}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3.5 py-1.5 font-semibold text-gray-700 hover:bg-gray-50 dark:border-gray-800 dark:bg-gray-950 dark:text-gray-300 dark:hover:bg-gray-900 transition-colors disabled:opacity-50"
                >
                  {isTestingConnection ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin text-blue-600" /> Menguji...
                    </>
                  ) : (
                    <>Uji Koneksi</>
                  )}
                </button>
                {appsScriptUrl && (
                  <button
                    onClick={() => {
                      setAppsScriptUrl('');
                      localStorage.removeItem('fsr_apps_script_url');
                      setFormMsg({ type: 'success', text: 'Konfigurasi dibersihkan (kembali ke penyimpanan lokal).' });
                      setTimeout(() => setFormMsg({ type: '', text: '' }), 4000);
                      setTestResult(null);
                    }}
                    className="rounded-lg border border-red-200 text-red-600 hover:bg-red-50 dark:border-red-900/30 px-3.5 py-1.5 font-semibold transition-colors"
                  >
                    Reset & Hapus URL
                  </button>
                )}
              </div>

              {testResult && (
                <div className={`mt-2 rounded-lg p-3 font-semibold ${
                  testResult.success 
                    ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-400 border border-emerald-200/50 dark:border-emerald-900/20' 
                    : 'bg-red-50 text-red-700 dark:bg-red-950/20 dark:text-red-400 border border-red-200/50 dark:border-red-900/20'
                }`}>
                  {testResult.message}
                </div>
              )}
            </div>

            {/* Steps Instruction */}
            <div className="space-y-3">
              <span className="font-bold text-gray-900 dark:text-white block">Langkah-langkah Penerapan Google Apps Script:</span>
              <ol className="list-decimal list-inside space-y-2 text-gray-600 dark:text-gray-400 pl-1 leading-relaxed">
                <li>Buka <a href="https://script.google.com/" target="_blank" rel="noreferrer" className="text-blue-600 hover:underline font-bold inline-flex items-center gap-0.5">Google Apps Script <ExternalLink className="h-3 w-3" /></a> dengan akun Google Anda.</li>
                <li>Klik tombol <span className="font-bold">"New Project"</span> (Proyek baru).</li>
                <li>Hapus semua kode bawaan, lalu salin dan tempelkan seluruh kode <span className="font-mono bg-gray-100 dark:bg-gray-800 px-1 py-0.5 rounded">code.gs</span> yang ada di bawah ini.</li>
                <li>Klik tombol <span className="font-bold">"Save"</span> (ikon disket).</li>
                <li>Klik tombol <span className="font-bold text-blue-600">"Deploy"</span> di kanan atas &gt; pilih <span className="font-bold">"New deployment"</span>.</li>
                <li>Klik tombol gerigi (ikon settings) di sebelah "Select type" &gt; pilih <span className="font-bold">"Web app"</span> (Aplikasi web).</li>
                <li>Isi konfigurasinya:
                  <ul className="list-disc list-inside pl-5 mt-1 space-y-1">
                    <li>Description: <span className="font-semibold text-gray-800 dark:text-gray-200">"FSR Drive Upload API"</span></li>
                    <li>Execute as: <span className="font-semibold text-gray-800 dark:text-gray-200">"Me (fleetmanagementservice.assa1700@gmail.com)"</span></li>
                    <li>Who has access: <span className="font-bold text-emerald-600">"Anyone"</span> (Siapa saja / Publik) - <span className="underline">Sangat Penting agar aplikasi bisa mengirim file</span>.</li>
                  </ul>
                </li>
                <li>Klik <span className="font-bold text-blue-600">"Deploy"</span>. Google akan meminta izin (Authorize Access). Setujui seluruh permintaan izinnya.</li>
                <li>Salin <span className="font-bold">"Web app URL"</span> yang didapatkan, lalu tempelkan (paste) pada kolom di atas dan klik <span className="font-bold">"Simpan URL"</span>.</li>
              </ol>
            </div>

            {/* Code Box Area */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="font-bold text-gray-900 dark:text-white">Kode Sumber Apps Script (code.gs)</span>
                <button
                  onClick={() => {
                    const code = `/**
 * GOOGLE APPS SCRIPT - GOOGLE DRIVE FILE UPLOADER FOR FSR MANAGEMENT SYSTEM
 * 
 * Target Google Drive Folder:
 * https://drive.google.com/drive/folders/1Y5SIYTgTzwdolNFd2NomT3QDhT-km3R4
 */
const TARGET_FOLDER_ID = "1Y5SIYTgTzwdolNFd2NomT3QDhT-km3R4";

function doPost(e) {
  try {
    if (!e || !e.postData || !e.postData.contents) {
      return ContentService.createTextOutput(JSON.stringify({
        success: false,
        message: "No POST body content received."
      }))
      .setMimeType(ContentService.MimeType.JSON);
    }

    var data = JSON.parse(e.postData.contents);
    var base64Data = data.base64Data;
    var filename = data.filename;
    var mimeType = data.mimeType || "application/octet-stream";
    
    if (base64Data.indexOf(",") > -1) {
      base64Data = base64Data.split(",")[1];
    }
    
    var decoded = Utilities.base64Decode(base64Data);
    var blob = Utilities.newBlob(decoded, mimeType, filename);
    var folder = DriveApp.getFolderById(TARGET_FOLDER_ID);
    var file = folder.createFile(blob);
    
    try {
      file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
    } catch (sharingError) {}
    
    var fileUrl = file.getUrl();
    var downloadUrl = "https://lh3.googleusercontent.com/d/" + file.getId();
    
    return ContentService.createTextOutput(JSON.stringify({
      success: true,
      fileId: file.getId(),
      fileUrl: fileUrl,
      downloadUrl: downloadUrl,
      message: "File berhasil diunggah ke Google Drive!"
    }))
    .setMimeType(ContentService.MimeType.JSON);
    
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({
      success: false,
      message: "Terjadi kesalahan server: " + error.toString()
    }))
    .setMimeType(ContentService.MimeType.JSON);
  }
}

function doGet(e) {
  return ContentService.createTextOutput(JSON.stringify({
    status: "online",
    message: "Google Apps Script Web App untuk FSR Anda telah aktif!",
    targetFolderId: TARGET_FOLDER_ID,
    uploaderEmail: Session.getActiveUser().getEmail()
  }))
  .setMimeType(ContentService.MimeType.JSON);
}

function doOptions(e) {
  return ContentService.createTextOutput("")
    .setMimeType(ContentService.MimeType.TEXT);
}`;
                    navigator.clipboard.writeText(code);
                    setIsCopied(true);
                    setTimeout(() => setIsCopied(false), 2000);
                  }}
                  className="inline-flex items-center gap-1 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 px-3 py-1 rounded text-[10px] font-bold transition-colors"
                >
                  {isCopied ? (
                    <>
                      <Check className="h-3 w-3 text-emerald-500" /> Disalin!
                    </>
                  ) : (
                    <>
                      <Copy className="h-3 w-3" /> Salin Kode
                    </>
                  )}
                </button>
              </div>
              <pre className="p-4 bg-gray-950 text-gray-200 font-mono text-[10px] rounded-xl overflow-x-auto border border-gray-800/80 max-h-72 whitespace-pre leading-relaxed select-all">
{`// ID Folder Google Drive Target Anda
const TARGET_FOLDER_ID = "1Y5SIYTgTzwdolNFd2NomT3QDhT-km3R4";

function doPost(e) {
  try {
    if (!e || !e.postData || !e.postData.contents) {
      return ContentService.createTextOutput(JSON.stringify({
        success: false,
        message: "No POST body content received."
      }))
      .setMimeType(ContentService.MimeType.JSON);
    }

    var data = JSON.parse(e.postData.contents);
    var base64Data = data.base64Data;
    var filename = data.filename;
    var mimeType = data.mimeType || "application/octet-stream";
    
    // Hilangkan metadata header base64 jika ada
    if (base64Data.indexOf(",") > -1) {
      base64Data = base64Data.split(",")[1];
    }
    
    // Decode data base64 menjadi bytes
    var decoded = Utilities.base64Decode(base64Data);
    var blob = Utilities.newBlob(decoded, mimeType, filename);
    
    // Akses folder Google Drive berdasarkan ID
    var folder = DriveApp.getFolderById(TARGET_FOLDER_ID);
    
    // Buat file baru di dalam folder tersebut
    var file = folder.createFile(blob);
    
    // Atur hak akses agar siapa saja yang memiliki link dapat melihat file tersebut
    try {
      file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
    } catch (sharingError) {
      // GSuite / Workspace Admin restriction
    }
    
    var fileUrl = file.getUrl();
    var downloadUrl = "https://lh3.googleusercontent.com/d/" + file.getId();
    
    return ContentService.createTextOutput(JSON.stringify({
      success: true,
      fileId: file.getId(),
      fileUrl: fileUrl,
      downloadUrl: downloadUrl,
      message: "File berhasil diunggah ke Google Drive!"
    }))
    .setMimeType(ContentService.MimeType.JSON);
    
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({
      success: false,
      message: "Terjadi kesalahan server: " + error.toString()
    }))
    .setMimeType(ContentService.MimeType.JSON);
  }
}

function doGet(e) {
  return ContentService.createTextOutput(JSON.stringify({
    status: "online",
    message: "Google Apps Script Web App untuk FSR Anda telah aktif!",
    targetFolderId: TARGET_FOLDER_ID,
    uploaderEmail: Session.getActiveUser().getEmail()
  }))
  .setMimeType(ContentService.MimeType.JSON);
}

function doOptions(e) {
  return ContentService.createTextOutput("")
    .setMimeType(ContentService.MimeType.TEXT);
}`}
              </pre>
            </div>
          </div>
        )}

      </div>

      {/* ----------------- MODAL: CREATE & EDIT FORM ----------------- */}
      {isFormModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs dark:bg-black/60" onClick={() => { setIsFormModalOpen(false); resetForm(); }} />
          
          {/* Modal Content */}
          <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl border border-gray-100 bg-white p-6 shadow-2xl dark:border-gray-800 dark:bg-gray-950 z-10 animate-fade-in">
            <div className="flex items-center justify-between border-b border-gray-100 pb-4 mb-4 dark:border-gray-800">
              <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100">
                {editingId ? 'Edit' : 'Tambah'} {
                  activeSubTab === 'units' ? 'Unit Kendaraan' :
                  activeSubTab === 'branches' ? 'Cabang (Plant)' :
                  activeSubTab === 'customers' ? 'Customer' :
                  activeSubTab === 'vendors' ? 'Vendor' :
                  activeSubTab === 'categories' ? 'Kategori Layanan' : 'User Operasional'
                }
              </h3>
              <button 
                onClick={() => { setIsFormModalOpen(false); resetForm(); }}
                className="rounded-full p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-700 dark:hover:bg-gray-800 dark:hover:text-gray-200"
              >
                <X className="h-4.5 w-4.5" />
              </button>
            </div>

            {/* Render Unit Form */}
            {activeSubTab === 'units' && (
              <form onSubmit={handleUnitSubmit} className="grid gap-4 sm:grid-cols-3 text-xs">
                <div className="space-y-1">
                  <span>No Equipment*</span>
                  <input type="text" placeholder="EQ-0918" value={unitEq} onChange={e=>setUnitEq(e.target.value)} className="w-full rounded border border-gray-200 bg-white p-2 dark:border-gray-800 dark:bg-gray-950" />
                </div>
                <div className="space-y-1">
                  <span>No Polisi (License Plate)*</span>
                  <input type="text" placeholder="B 1234 XYZ" value={unitPlate} onChange={e=>setUnitPlate(e.target.value)} className="w-full rounded border border-gray-200 bg-white p-2 dark:border-gray-800 dark:bg-gray-950" />
                </div>
                <div className="space-y-1">
                  <span>Customer Perusahaan*</span>
                  <select value={unitCmd} onChange={e=>setUnitCmd(e.target.value)} className="w-full rounded border border-gray-200 bg-white p-2 dark:border-gray-800 dark:bg-gray-950">
                    <option value="">-- Pilih Customer --</option>
                    {customers.map(c=>(
                      <option key={c.id} value={c.cmd}>{c.cmd} - {c.nama_customer}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <span>Deskripsi Unit*</span>
                  <input type="text" placeholder="HINO DUTRO BOX" value={unitDesc} onChange={e=>setUnitDesc(e.target.value)} className="w-full rounded border border-gray-200 bg-white p-2 dark:border-gray-800 dark:bg-gray-950" />
                </div>
                <div className="space-y-1">
                  <span>Warna Nopol</span>
                  <select value={unitWarnaNopol} onChange={e=>setUnitWarnaNopol(e.target.value)} className="w-full rounded border border-gray-200 bg-white p-2 dark:border-gray-800 dark:bg-gray-950">
                    <option value="Hitam">Hitam</option>
                    <option value="Kuning">Kuning</option>
                    <option value="Merah">Merah</option>
                    <option value="Putih">Putih</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <span>Tahun Unit</span>
                  <input type="number" value={unitYear} onChange={e=>setUnitYear(e.target.value)} className="w-full rounded border border-gray-200 bg-white p-2 dark:border-gray-800 dark:bg-gray-950" />
                </div>
                <div className="space-y-1">
                  <span>Chassis Number*</span>
                  <input type="text" placeholder="MHFG..." value={unitChassis} onChange={e=>setUnitChassis(e.target.value)} className="w-full rounded border border-gray-200 bg-white p-2 dark:border-gray-800 dark:bg-gray-950" />
                </div>
                <div className="space-y-1">
                  <span>Engine Serial*</span>
                  <input type="text" placeholder="W04D..." value={unitEngine} onChange={e=>setUnitEngine(e.target.value)} className="w-full rounded border border-gray-200 bg-white p-2 dark:border-gray-800 dark:bg-gray-950" />
                </div>
                <div className="space-y-1">
                  <span>Warna Bodi</span>
                  <input type="text" placeholder="Merah" value={unitColor} onChange={e=>setUnitColor(e.target.value)} className="w-full rounded border border-gray-200 bg-white p-2 dark:border-gray-800 dark:bg-gray-950" />
                </div>
                <div className="space-y-1">
                  <span>Kelompok Unit</span>
                  <input type="text" placeholder="Truck Medium" value={unitGroup} onChange={e=>setUnitGroup(e.target.value)} className="w-full rounded border border-gray-200 bg-white p-2 dark:border-gray-800 dark:bg-gray-950" />
                </div>
                <div className="space-y-1">
                  <span>Kategori Unit</span>
                  <input type="text" placeholder="Cargo" value={unitCategory} onChange={e=>setUnitCategory(e.target.value)} className="w-full rounded border border-gray-200 bg-white p-2 dark:border-gray-800 dark:bg-gray-950" />
                </div>
                <div className="space-y-1">
                  <span>Kelompok Tipe</span>
                  <input type="text" placeholder="Light Truck" value={unitTypeGroup} onChange={e=>setUnitTypeGroup(e.target.value)} className="w-full rounded border border-gray-200 bg-white p-2 dark:border-gray-800 dark:bg-gray-950" />
                </div>
                <div className="space-y-1">
                  <span>Tipe Unit</span>
                  <input type="text" placeholder="Box" value={unitType} onChange={e=>setUnitType(e.target.value)} className="w-full rounded border border-gray-200 bg-white p-2 dark:border-gray-800 dark:bg-gray-950" />
                </div>
                <div className="space-y-1">
                  <span>Pendingin</span>
                  <select value={unitCooler} onChange={e=>setUnitCooler(e.target.value)} className="w-full rounded border border-gray-200 bg-white p-2 dark:border-gray-800 dark:bg-gray-950">
                    <option value="No">No</option>
                    <option value="Yes">Yes</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <span>Power</span>
                  <input type="text" placeholder="130 PS" value={unitPower} onChange={e=>setUnitPower(e.target.value)} className="w-full rounded border border-gray-200 bg-white p-2 dark:border-gray-800 dark:bg-gray-950" />
                </div>
                <div className="sm:col-span-3 flex justify-end gap-2 pt-4 border-t border-gray-100 dark:border-gray-800">
                  <button type="button" onClick={resetForm} className="rounded-lg border border-gray-200 px-4 py-2 hover:bg-gray-50 dark:border-gray-800">Clear</button>
                  <button type="submit" className="rounded-lg bg-blue-600 px-5 py-2 font-bold text-white hover:bg-blue-700">Simpan Unit</button>
                </div>
              </form>
            )}

            {/* Render Branch Form */}
            {activeSubTab === 'branches' && (
              <form onSubmit={handleBranchSubmit} className="grid gap-4 sm:grid-cols-2 text-xs">
                <div className="space-y-1">
                  <span>Maint Plant (Code)*</span>
                  <input type="text" placeholder="PL01" value={branchPlant} onChange={e=>setBranchPlant(e.target.value)} className="w-full rounded border border-gray-200 bg-white p-2 dark:border-gray-800 dark:bg-gray-950" />
                </div>
                <div className="space-y-1">
                  <span>Nama Cabang*</span>
                  <input type="text" placeholder="DKI Jakarta" value={branchName} onChange={e=>setBranchName(e.target.value)} className="w-full rounded border border-gray-200 bg-white p-2 dark:border-gray-800 dark:bg-gray-950" />
                </div>
                <div className="sm:col-span-2 flex justify-end gap-2 pt-4 border-t border-gray-100 dark:border-gray-800">
                  <button type="button" onClick={resetForm} className="rounded-lg border border-gray-200 px-4 py-2 hover:bg-gray-50 dark:border-gray-800">Clear</button>
                  <button type="submit" className="rounded-lg bg-blue-600 px-5 py-2 font-bold text-white hover:bg-blue-700">Simpan Cabang</button>
                </div>
              </form>
            )}

            {/* Render Customer Form */}
            {activeSubTab === 'customers' && (
              <form onSubmit={handleCustomerSubmit} className="grid gap-4 sm:grid-cols-2 text-xs">
                <div className="space-y-1">
                  <span>CMD Customer Code*</span>
                  <input type="text" placeholder="CMD001" value={customerCmd} onChange={e=>setCustomerCmd(e.target.value)} className="w-full rounded border border-gray-200 bg-white p-2 dark:border-gray-800 dark:bg-gray-950" />
                </div>
                <div className="space-y-1">
                  <span>Nama Customer*</span>
                  <input type="text" placeholder="PT Astra Sedaya Finance" value={customerName} onChange={e=>setCustomerName(e.target.value)} className="w-full rounded border border-gray-200 bg-white p-2 dark:border-gray-800 dark:bg-gray-950" />
                </div>
                <div className="sm:col-span-2 flex justify-end gap-2 pt-4 border-t border-gray-100 dark:border-gray-800">
                  <button type="button" onClick={resetForm} className="rounded-lg border border-gray-200 px-4 py-2 hover:bg-gray-50 dark:border-gray-800">Clear</button>
                  <button type="submit" className="rounded-lg bg-blue-600 px-5 py-2 font-bold text-white hover:bg-blue-700">Simpan Customer</button>
                </div>
              </form>
            )}

            {/* Render Vendor Form */}
            {activeSubTab === 'vendors' && (
              <form onSubmit={handleVendorSubmit} className="grid gap-4 sm:grid-cols-2 text-xs">
                <div className="space-y-1">
                  <span>VMD Vendor Code*</span>
                  <input type="text" placeholder="VMD001" value={vendorVmd} onChange={e=>setVendorVmd(e.target.value)} className="w-full rounded border border-gray-200 bg-white p-2 dark:border-gray-800 dark:bg-gray-950" />
                </div>
                <div className="space-y-1">
                  <span>Nama Vendor*</span>
                  <input type="text" placeholder="Bengkel Agung Mandiri" value={vendorName} onChange={e=>setVendorName(e.target.value)} className="w-full rounded border border-gray-200 bg-white p-2 dark:border-gray-800 dark:bg-gray-950" />
                </div>
                <div className="sm:col-span-2 flex justify-end gap-2 pt-4 border-t border-gray-100 dark:border-gray-800">
                  <button type="button" onClick={resetForm} className="rounded-lg border border-gray-200 px-4 py-2 hover:bg-gray-50 dark:border-gray-800">Clear</button>
                  <button type="submit" className="rounded-lg bg-blue-600 px-5 py-2 font-bold text-white hover:bg-blue-700">Simpan Vendor</button>
                </div>
              </form>
            )}

            {/* Render Category Form */}
            {activeSubTab === 'categories' && (
              <form onSubmit={handleCategorySubmit} className="grid gap-4 sm:grid-cols-3 text-xs">
                <div className="space-y-1">
                  <span>Kategori Layanan*</span>
                  <select value={catCategory} onChange={e=>setCatCategory(e.target.value as ServiceCategory)} className="w-full rounded border border-gray-200 bg-white p-2 dark:border-gray-800 dark:bg-gray-950">
                    <option value="Maintenance">Maintenance</option>
                    <option value="Body Repair">Body Repair</option>
                    <option value="Document">Document</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <span>Jenis Layanan*</span>
                  <input type="text" placeholder="Berkala / KIR / STNK" value={catService} onChange={e=>setCatService(e.target.value)} className="w-full rounded border border-gray-200 bg-white p-2 dark:border-gray-800 dark:bg-gray-950" />
                </div>
                <div className="space-y-1">
                  <span>Role PIC Penanggung Jawab*</span>
                  <select value={catPicRole} onChange={e=>setCatPicRole(e.target.value as any)} className="w-full rounded border border-gray-200 bg-white p-2 dark:border-gray-800 dark:bg-gray-950">
                    <option value="SA">SA (Service Advisor)</option>
                    <option value="SS">SS (Service Support)</option>
                    <option value="VRO">VRO (Vehicle Register Officer)</option>
                  </select>
                </div>
                <div className="sm:col-span-3 flex justify-end gap-2 pt-4 border-t border-gray-100 dark:border-gray-800">
                  <button type="button" onClick={resetForm} className="rounded-lg border border-gray-200 px-4 py-2 hover:bg-gray-50 dark:border-gray-800">Clear</button>
                  <button type="submit" className="rounded-lg bg-blue-600 px-5 py-2 font-bold text-white hover:bg-blue-700">Simpan Layanan</button>
                </div>
              </form>
            )}

            {/* Render User Form */}
            {activeSubTab === 'users' && (
              <form onSubmit={handleUserSubmit} className="grid gap-4 sm:grid-cols-3 text-xs">
                <div className="space-y-1">
                  <span>Nama Lengkap*</span>
                  <input type="text" placeholder="Andi Service Advisor" value={userRealName} onChange={e=>setUserRealName(e.target.value)} className="w-full rounded border border-gray-200 bg-white p-2 dark:border-gray-800 dark:bg-gray-950" />
                </div>
                <div className="space-y-1">
                  <span>Username Login*</span>
                  <input type="text" placeholder="sa_jakarta" value={userUsername} onChange={e=>setUserUsername(e.target.value)} className="w-full rounded border border-gray-200 bg-white p-2 dark:border-gray-800 dark:bg-gray-950" />
                </div>
                <div className="space-y-1">
                  <span>Password (Optional)*</span>
                  <input type="password" placeholder="••••••••" value={userPassword} onChange={e=>setUserPassword(e.target.value)} className="w-full rounded border border-gray-200 bg-white p-2 dark:border-gray-800 dark:bg-gray-950" />
                </div>
                <div className="space-y-1">
                  <span>Role Operasional*</span>
                  <select value={userRole} onChange={e=>setUserRole(e.target.value as any)} className="w-full rounded border border-gray-200 bg-white p-2 dark:border-gray-800 dark:bg-gray-950">
                    <option value="SA">SA (Service Advisor)</option>
                    <option value="SS">SS (Service Support)</option>
                    <option value="VRO">VRO (Vehicle Register Officer)</option>
                    <option value="TS">TS (Technical Service)</option>
                    <option value="Vendor">Vendor Eksternal</option>
                    <option value="Leader Customer">Leader Customer</option>
                    <option value="Admin Customer">Admin Customer</option>
                    <option value="Leader Operation">Leader Operation</option>
                    <option value="Super Admin">Super Admin</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <span>Cabang Handling*</span>
                  <select 
                    value={userBranch} 
                    onChange={e=>setUserBranch(e.target.value)} 
                    className="w-full rounded border border-gray-200 bg-white p-2 dark:border-gray-800 dark:bg-gray-950"
                  >
                    <option value="All Branches">All Branches (Semua Cabang)</option>
                    {branches.map((b) => (
                      <option key={b.id} value={b.cabang}>
                        {b.maint_plant} - {b.cabang}
                      </option>
                    ))}
                  </select>
                </div>

                {(userRole === 'Admin Customer' || userRole === 'Leader Customer') && (
                  <div className="space-y-1 animate-fade-in sm:col-span-3">
                    <label className="text-xs font-bold text-blue-600 dark:text-blue-400 block">
                      List Master Customer (Customer Assignment)*
                    </label>
                    <select 
                      value={userAssignedCustomer} 
                      onChange={e=>setUserAssignedCustomer(e.target.value)} 
                      className="w-full rounded border border-blue-200 bg-blue-50/20 p-2 dark:border-blue-900 dark:bg-blue-950/20 dark:text-white font-medium"
                      required
                    >
                      <option value="">-- Pilih Customer dari Master Customer --</option>
                      {customers.map((c) => (
                        <option key={c.id} value={c.cmd}>
                          {c.cmd} - {c.nama_customer}
                        </option>
                      ))}
                    </select>
                    <p className="text-[10px] text-slate-500 italic">
                      Otomatis tersinkronisasi dengan Master Customer. Akun ini akan terikat khusus pada customer terpilih.
                    </p>
                  </div>
                )}

                {userRole === 'Vendor' && (
                  <div className="space-y-3 animate-fade-in sm:col-span-3 rounded-xl border border-amber-200/80 bg-amber-50/40 p-4 dark:border-amber-900/40 dark:bg-amber-950/20">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-amber-800 dark:text-amber-300 flex items-center gap-1.5">
                        <ShieldAlert className="h-4 w-4 text-amber-600" />
                        Pilihan Master Vendor & Nomor VMD Terikat*
                      </label>
                      {userVendorName && (
                        <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-100 dark:bg-emerald-950/50 dark:text-emerald-300 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-900/40">
                          ✓ Terpilih: {userVendorName}
                        </span>
                      )}
                    </div>

                    <div className="grid gap-3 sm:grid-cols-2">
                      {/* Searchable Vendor Dropdown */}
                      <div className="relative space-y-1">
                        <span className="text-[10px] text-gray-500 dark:text-gray-400 font-semibold block">
                          Cari & Pilih Nama Vendor Master
                        </span>
                        
                        <div className="relative">
                          <input
                            type="text"
                            placeholder="Ketik untuk mencari nama vendor..."
                            value={isUserVendorDropdownOpen ? userVendorSearch : (userVendorName || userVendorSearch)}
                            onChange={(e) => {
                              setUserVendorSearch(e.target.value);
                              setIsUserVendorDropdownOpen(true);
                            }}
                            onFocus={() => {
                              setIsUserVendorDropdownOpen(true);
                              if (userVendorName && !userVendorSearch) {
                                setUserVendorSearch('');
                              }
                            }}
                            className="w-full rounded-lg border border-amber-200 bg-white pl-8 pr-8 py-2 text-xs font-medium focus:border-amber-500 focus:outline-hidden dark:border-amber-900/60 dark:bg-gray-950 dark:text-white"
                          />
                          <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-gray-400 pointer-events-none" />
                          
                          {(userVendorSearch || userVendorName) && (
                            <button
                              type="button"
                              onClick={() => {
                                setUserVendorName('');
                                setUserAssignedVmd('');
                                setUserVendorSearch('');
                                setIsUserVendorDropdownOpen(true);
                              }}
                              className="absolute right-2.5 top-2.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                              title="Hapus pilihan"
                            >
                              <X className="h-3.5 w-3.5" />
                            </button>
                          )}
                        </div>

                        {/* Filtered Vendor List Dropdown - Only matching names are shown, rest hidden */}
                        {isUserVendorDropdownOpen && (
                          <>
                            <div 
                              className="fixed inset-0 z-40" 
                              onClick={() => setIsUserVendorDropdownOpen(false)} 
                            />
                            <div 
                              className="absolute left-0 right-0 z-50 mt-1 max-h-52 overflow-y-auto rounded-xl border border-amber-200 bg-white p-1 shadow-xl dark:border-amber-900 dark:bg-gray-950"
                            >
                              {(() => {
                                const q = userVendorSearch.toLowerCase().trim();
                                const filtered = vendors.filter(v => 
                                  !q || 
                                  v.nama_vendor.toLowerCase().includes(q) || 
                                  (v.vmd && v.vmd.toLowerCase().includes(q))
                                );

                                if (filtered.length === 0) {
                                  return (
                                    <div className="p-3 text-center text-xs text-gray-400 dark:text-gray-500">
                                      <p className="font-semibold">Nama vendor tidak ditemukan</p>
                                      <p className="text-[10px] mt-0.5">Tidak ada vendor yang cocok dengan "{userVendorSearch}"</p>
                                    </div>
                                  );
                                }

                                return filtered.map((v) => {
                                  const isSelected = userVendorName === v.nama_vendor;
                                  return (
                                    <button
                                      key={v.id}
                                      type="button"
                                      onClick={() => {
                                        setUserVendorName(v.nama_vendor);
                                        setUserAssignedVmd(v.vmd || '');
                                        setUserVendorSearch('');
                                        setIsUserVendorDropdownOpen(false);
                                      }}
                                      className={`w-full text-left px-3 py-2 rounded-lg text-xs transition-colors flex items-center justify-between ${
                                        isSelected
                                          ? 'bg-amber-100/70 text-amber-900 font-bold dark:bg-amber-950/60 dark:text-amber-200'
                                          : 'text-gray-700 hover:bg-amber-50/60 dark:text-gray-300 dark:hover:bg-amber-950/30'
                                      }`}
                                    >
                                      <div className="flex flex-col">
                                        <span className="font-medium">{v.nama_vendor}</span>
                                        {v.vmd && <span className="text-[10px] text-gray-400 font-mono">Kode VMD: {v.vmd}</span>}
                                      </div>
                                      {isSelected && <Check className="h-4 w-4 text-amber-600 shrink-0 ml-2" />}
                                    </button>
                                  );
                                });
                              })()}
                            </div>
                          </>
                        )}
                      </div>

                      {/* VMD Code Input Box (Auto-filled & manually editable) */}
                      <div className="space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] text-gray-500 dark:text-gray-400 font-semibold block">
                            Nomor VMD Vendor (Filter Key)*
                          </span>
                          {userAssignedVmd && (
                            <span className="text-[9px] text-emerald-600 font-semibold bg-emerald-50 dark:bg-emerald-950/40 px-1.5 py-0.2 rounded border border-emerald-100 dark:border-emerald-900/30">
                              Otomatis Terhubung
                            </span>
                          )}
                        </div>
                        <input
                          type="text"
                          value={userAssignedVmd}
                          onChange={(e) => setUserAssignedVmd(e.target.value)}
                          placeholder="Contoh: VMD001"
                          className="w-full rounded-lg border border-amber-200 bg-white p-2 text-xs font-mono font-bold dark:border-amber-900/60 dark:bg-gray-950 dark:text-white"
                          required
                        />
                      </div>
                    </div>

                    <p className="text-[10px] text-amber-700/80 dark:text-amber-400/80 italic">
                      Akun Vendor ini akan secara otomatis menerima dan memfilter pekerjaan FSR yang diteruskan oleh SA/SS/VRO berdasarkan Nama Vendor atau Nomor VMD ini.
                    </p>
                  </div>
                )}

                <div className="space-y-1">
                  <span>Status Akun</span>
                  <select value={userStatus} onChange={e=>setUserStatus(e.target.value as any)} className="w-full rounded border border-gray-200 bg-white p-2 dark:border-gray-800 dark:bg-gray-950">
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>
                <div className="sm:col-span-3 rounded-xl border border-slate-200 bg-slate-50/50 p-4 dark:border-slate-800 dark:bg-slate-900/40 space-y-3">
                  <div>
                    <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">Konfigurasi Hak Akses Menu & Aksi Operasional (RBAC)</h4>
                    <p className="text-[11px] text-slate-500 mt-0.5">Tentukan halaman mana saja yang dapat dibuka dan hak aksi (tambah, edit, hapus, workflow) yang diizinkan untuk role ini.</p>
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2 pt-2 border-t border-slate-200/60 dark:border-slate-800">
                    <div className="space-y-2">
                      <span className="font-bold text-slate-700 dark:text-slate-300 block text-[11px]">Akses Menu / Halaman:</span>
                      <label className="flex items-center gap-2.5 cursor-pointer">
                        <input type="checkbox" checked={userMenuDashboard} onChange={e => setUserMenuDashboard(e.target.checked)} className="rounded text-blue-600 focus:ring-blue-500 h-4 w-4" />
                        <span className="text-slate-700 dark:text-slate-300">Dashboard & Statistik</span>
                      </label>
                      <label className="flex items-center gap-2.5 cursor-pointer">
                        <input type="checkbox" checked={userMenuFsr} onChange={e => setUserMenuFsr(e.target.checked)} className="rounded text-blue-600 focus:ring-blue-500 h-4 w-4" />
                        <span className="text-slate-700 dark:text-slate-300">Monitoring FSR & Workflow</span>
                      </label>
                      <label className="flex items-center gap-2.5 cursor-pointer">
                        <input type="checkbox" checked={userMenuMaster} onChange={e => setUserMenuMaster(e.target.checked)} className="rounded text-blue-600 focus:ring-blue-500 h-4 w-4" />
                        <span className="text-slate-700 dark:text-slate-300">Master Data & Konfigurasi Drive</span>
                      </label>
                    </div>
                    <div className="space-y-2">
                      <span className="font-bold text-slate-700 dark:text-slate-300 block text-[11px]">Aksi & Hak Operasional:</span>
                      <label className="flex items-center gap-2.5 cursor-pointer">
                        <input type="checkbox" checked={userActionCreate} onChange={e => setUserActionCreate(e.target.checked)} className="rounded text-blue-600 focus:ring-blue-500 h-4 w-4" />
                        <span className="text-slate-700 dark:text-slate-300">Tambah Data / Create Baru</span>
                      </label>
                      <label className="flex items-center gap-2.5 cursor-pointer">
                        <input type="checkbox" checked={userActionEdit} onChange={e => setUserActionEdit(e.target.checked)} className="rounded text-blue-600 focus:ring-blue-500 h-4 w-4" />
                        <span className="text-slate-700 dark:text-slate-300">Edit / Ubah Data Master & FSR</span>
                      </label>
                      <label className="flex items-center gap-2.5 cursor-pointer">
                        <input type="checkbox" checked={userActionDelete} onChange={e => setUserActionDelete(e.target.checked)} className="rounded text-blue-600 focus:ring-blue-500 h-4 w-4" />
                        <span className="text-slate-700 dark:text-slate-300">Hapus Data (Delete)</span>
                      </label>
                      <label className="flex items-center gap-2.5 cursor-pointer">
                        <input type="checkbox" checked={userActionWorkflow} onChange={e => setUserActionWorkflow(e.target.checked)} className="rounded text-blue-600 focus:ring-blue-500 h-4 w-4" />
                        <span className="text-slate-700 dark:text-slate-300">Eksekusi Workflow / Approval FSR</span>
                      </label>
                    </div>
                  </div>
                </div>
                <div className="sm:col-span-3 flex justify-end gap-2 pt-4 border-t border-gray-100 dark:border-gray-800">
                  <button type="button" onClick={resetForm} className="rounded-lg border border-gray-200 px-4 py-2 hover:bg-gray-50 dark:border-gray-800">Clear</button>
                  <button type="submit" className="rounded-lg bg-blue-600 px-5 py-2 font-bold text-white hover:bg-blue-700">Simpan Akun User</button>
                </div>
              </form>
            )}

          </div>
        </div>
      )}

      {/* ----------------- MODAL: DELETE CONFIRMATION ----------------- */}
      {isDeleteModalOpen && deletingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in">
          {/* Backdrop */}
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs dark:bg-black/60" onClick={() => setIsDeleteModalOpen(false)} />
          
          {/* Box */}
          <div className="relative w-full max-w-md rounded-2xl border border-gray-100 bg-white p-6 shadow-2xl dark:border-gray-800 dark:bg-gray-950 z-10">
            <div className="flex gap-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-red-50 text-red-600 dark:bg-red-950/40 dark:text-red-400">
                <AlertTriangle className="h-5 w-5" />
              </div>
              <div className="space-y-1 flex-1">
                <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100">Hapus Data Master</h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
                  Apakah Anda yakin ingin menghapus <span className="font-semibold text-gray-800 dark:text-gray-200">{deletingItem.name}</span> dari tabel? Tindakan ini tidak dapat dibatalkan.
                </p>
              </div>
            </div>
            
            <div className="mt-6 flex justify-end gap-2 text-xs font-semibold">
              <button
                onClick={() => {
                  setIsDeleteModalOpen(false);
                  setDeletingItem(null);
                }}
                className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-gray-700 hover:bg-gray-50 dark:border-gray-800 dark:bg-gray-950 dark:text-gray-300 dark:hover:bg-gray-900"
              >
                Batal
              </button>
              <button
                onClick={async () => {
                  if (activeSubTab === 'units') await localDb.deleteUnit(deletingItem.id, currentUser);
                  else if (activeSubTab === 'branches') await localDb.deleteBranch(deletingItem.id, currentUser);
                  else if (activeSubTab === 'customers') await localDb.deleteCustomer(deletingItem.id, currentUser);
                  else if (activeSubTab === 'vendors') await localDb.deleteVendor(deletingItem.id, currentUser);
                  else if (activeSubTab === 'categories') await localDb.deleteCategory(deletingItem.id, currentUser);
                  else if (activeSubTab === 'users') await localDb.deleteOperationUser(deletingItem.id, currentUser);
                  
                  showMsg('success', 'Data berhasil dihapus dari sistem.');
                  setIsDeleteModalOpen(false);
                  setDeletingItem(null);
                  reloadAll();
                }}
                className="rounded-lg bg-red-600 px-4 py-2 font-bold text-white hover:bg-red-700"
              >
                Ya, Hapus Data
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ----------------- MODAL: BATCH CSV IMPORT ----------------- */}
      {isImportModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs dark:bg-black/60" onClick={() => setIsImportModalOpen(false)} />
          
          {/* Modal Box */}
          <div className="relative w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-2xl border border-gray-150 bg-white p-6 shadow-2xl dark:border-gray-800 dark:bg-gray-950 z-10 animate-fade-in flex flex-col">
            <div className="flex items-center justify-between border-b border-gray-100 pb-4 mb-4 dark:border-gray-800">
              <div className="space-y-0.5">
                <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                  <FileSpreadsheet className="h-4.5 w-4.5 text-emerald-600" />
                  <span>Import Batch Data: {
                    activeSubTab === 'units' ? 'Unit Kendaraan' :
                    activeSubTab === 'branches' ? 'Cabang (Plant)' :
                    activeSubTab === 'customers' ? 'Customer' :
                    activeSubTab === 'vendors' ? 'Vendor' :
                    activeSubTab === 'categories' ? 'Kategori Layanan' : 'User Operasional'
                  }</span>
                </h3>
                <p className="text-[11px] text-gray-400 dark:text-gray-500">
                  Unduh template CSV resmi, isi rincian data Anda, lalu impor ke dalam pangkalan data lokal.
                </p>
              </div>
              <button 
                onClick={() => setIsImportModalOpen(false)}
                className="rounded-full p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-700 dark:hover:bg-gray-800 dark:hover:text-gray-200"
              >
                <X className="h-4.5 w-4.5" />
              </button>
            </div>

            <div className="space-y-5 flex-1">
              {/* STEP 1: DOWNLOAD TEMPLATE COCOK */}
              <div className="rounded-xl border border-slate-100 bg-slate-50/50 p-4 dark:border-gray-800 dark:bg-gray-900/30">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                  <div className="space-y-1">
                    <span className="text-xs font-bold text-gray-800 dark:text-gray-200 block">Langkah 1: Unduh Templat Excel dengan Kolom</span>
                    <p className="text-[11px] text-gray-500 dark:text-gray-400">
                      Templat Excel dengan kolom yang telah disesuaikan dengan skema tabel master data yang aktif saat ini.
                    </p>
                  </div>
                  <button
                    onClick={downloadExcelTemplate}
                    className="flex shrink-0 items-center gap-1.5 rounded-lg bg-emerald-600 px-4 py-2 text-xs font-bold text-white hover:bg-emerald-700 transition-colors shadow-sm"
                  >
                    <Download className="h-3.5 w-3.5" />
                    <span>Unduh Templat Excel dengan Kolom</span>
                  </button>
                </div>
              </div>

              {/* STEP 2: DRAG FILE */}
              <div className="space-y-2">
                <span className="text-xs font-bold text-gray-800 dark:text-gray-200 block">Langkah 2: Sediakan File Berkas Excel dengan Kolom</span>
                
                <div className="w-full">
                  {/* File upload drag and drop */}
                  <div 
                    onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                    onDragLeave={() => setDragOver(false)}
                    onDrop={(e) => {
                      e.preventDefault();
                      setDragOver(false);
                      const file = e.dataTransfer.files?.[0];
                      if (file) {
                        processExcelFile(file);
                      }
                    }}
                    className={`flex flex-col items-center justify-center rounded-xl border-2 border-dashed p-8 text-center transition-colors ${
                      dragOver 
                        ? 'border-blue-500 bg-blue-50/20 dark:bg-blue-950/10' 
                        : 'border-gray-200 bg-gray-50/20 hover:bg-gray-50/50 dark:border-gray-800 dark:bg-gray-900/10'
                    }`}
                  >
                    <Upload className="mb-2.5 h-8 w-8 text-gray-400" />
                    <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">Pilih File Berkas Excel dengan Kolom</span>
                    <p className="mt-1 text-[10px] text-gray-400">Tarik & letakkan file berkas excel dengan kolom di sini atau</p>
                    <input 
                      type="file" 
                      accept=".xlsx,.xls" 
                      onChange={handleFileUpload} 
                      className="mt-3.5 text-[11px] text-gray-500 file:mr-2 file:rounded-md file:border-0 file:bg-blue-50 file:px-2.5 file:py-1 file:text-xs file:font-semibold file:text-blue-700 hover:file:bg-blue-100 dark:file:bg-blue-950 dark:file:text-blue-300"
                    />
                  </div>
                </div>
              </div>

              {/* STEP 3: LIVE PARSED PREVIEW */}
              {importErrors.length > 0 && (
                <div className="rounded-xl border border-red-100 bg-red-50/50 p-4 dark:border-red-950/30 dark:bg-red-950/10 text-xs text-red-600 dark:text-red-400 space-y-1 font-semibold">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="h-4 w-4" />
                    <span>Format Berkas Bermasalah:</span>
                  </div>
                  <ul className="list-disc pl-5 font-mono text-[10px]">
                    {importErrors.map((err, i) => <li key={i}>{err}</li>)}
                  </ul>
                </div>
              )}

              {parsedPreview.length > 0 && (
                <div className="space-y-2">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-bold text-gray-800 dark:text-gray-200">Pratinjau Hasil Pembacaan ({parsedPreview.length} baris terdeteksi)</span>
                    <span className="rounded bg-slate-100 px-2 py-0.5 text-[10px] font-bold dark:bg-gray-800">
                      Valid: {parsedPreview.filter(p => p.isValid).length} | Gagal: {parsedPreview.filter(p => !p.isValid).length}
                    </span>
                  </div>

                  <div className="border border-gray-100 rounded-xl dark:border-gray-800 max-h-[220px] overflow-y-auto">
                    <table className="w-full text-left text-[11px]">
                      <thead>
                        <tr className="bg-gray-50 dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800 text-gray-400">
                          <th className="p-2 w-12 text-center">Baris</th>
                          <th className="p-2 w-20">Status</th>
                          <th className="p-2">Identitas Data Utama</th>
                          <th className="p-2">Catatan Validasi</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50 dark:divide-gray-900">
                        {parsedPreview.map((p, idx) => (
                          <tr key={idx} className={p.isValid ? 'bg-emerald-50/5 dark:bg-emerald-950/5' : 'bg-red-50/5 dark:bg-red-950/5'}>
                            <td className="p-2 text-center font-mono text-gray-400">{p.rowNum}</td>
                            <td className="p-2">
                              {p.isValid ? (
                                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                                  <CheckCircle className="h-3 w-3" /> Siap
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-red-600 dark:text-red-400">
                                  <AlertCircle className="h-3 w-3" /> Gagal
                                </span>
                              )}
                            </td>
                            <td className="p-2 font-semibold">
                              {activeSubTab === 'units' && `${p.data.license_plate || 'Nopol Kosong'} - ${p.data.description || 'Tanpa Deskripsi'}`}
                              {activeSubTab === 'branches' && `${p.data.maint_plant || 'Tanpa Kode'} - ${p.data.cabang || 'Tanpa Nama'}`}
                              {activeSubTab === 'customers' && `${p.data.cmd || 'Tanpa Kode'} - ${p.data.nama_customer || 'Tanpa Nama'}`}
                              {activeSubTab === 'vendors' && `${p.data.vmd || 'Tanpa Kode'} - ${p.data.nama_vendor || 'Tanpa Nama'}`}
                              {activeSubTab === 'categories' && `${p.data.kategori_layanan || 'Tanpa Kategori'} - ${p.data.jenis_layanan || 'Tanpa Layanan'}`}
                              {activeSubTab === 'users' && `${p.data.nama || 'Tanpa Nama'} (${p.data.username || 'Tanpa User'})`}
                            </td>
                            <td className="p-2 font-mono text-[10px] text-gray-500 dark:text-gray-400">
                              {p.isValid ? 'Semua kolom wajib lengkap.' : p.errors.join(', ')}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>

            <div className="mt-6 flex justify-end gap-2 text-xs font-semibold border-t border-gray-100 pt-4 dark:border-gray-800">
              <button
                onClick={() => setIsImportModalOpen(false)}
                className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-gray-700 hover:bg-gray-50 dark:border-gray-800 dark:bg-gray-950 dark:text-gray-300 dark:hover:bg-gray-900"
              >
                Batal
              </button>
              <button
                disabled={parsedPreview.filter(p => p.isValid).length === 0}
                onClick={executeImport}
                className="rounded-lg bg-blue-600 px-5 py-2 font-bold text-white hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition-opacity shadow-xs"
              >
                Impor Sekarang ({parsedPreview.filter(p => p.isValid).length} baris)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ----------------- MODAL: IMPORT SUCCESS POPUP ----------------- */}
      {isImportSuccessOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          {/* Backdrop */}
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs dark:bg-black/60" onClick={() => setIsImportSuccessOpen(false)} />
          
          {/* Modal Box */}
          <div className="relative w-full max-w-md rounded-2xl border border-gray-150 bg-white p-6 shadow-2xl dark:border-gray-800 dark:bg-gray-950 z-10 animate-fade-in flex flex-col items-center text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-50 dark:bg-emerald-950/30 mb-4">
              <CheckCircle className="h-8 w-8 text-emerald-600 dark:text-emerald-400" />
            </div>
            
            <h3 className="text-base font-bold text-gray-900 dark:text-gray-100 mb-2">
              Data Berhasil Diunggah!
            </h3>
            
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-6 max-w-xs leading-relaxed">
              Sebanyak <strong className="text-emerald-600 dark:text-emerald-400 font-bold">{importedCount} baris</strong> data <span className="font-semibold">{importedTab}</span> telah sukses diproses dan disinkronisasikan ke dalam database cloud Supabase dengan aman.
            </p>
            
            <button
              onClick={() => setIsImportSuccessOpen(false)}
              className="w-full rounded-xl bg-slate-900 px-4 py-2.5 text-xs font-bold text-white hover:bg-slate-800 dark:bg-gray-100 dark:text-slate-900 dark:hover:bg-gray-800 transition-colors shadow-sm"
            >
              Selesai & Tutup
            </button>
          </div>
        </div>
      )}

    </div>
  );
};
