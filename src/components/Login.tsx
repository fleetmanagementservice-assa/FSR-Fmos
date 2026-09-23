import React, { useState, useEffect } from 'react';
import { useTheme } from './ThemeContext';
import { localDb } from '../db/localDb';
import { OperationUser, UserRole, Branch } from '../types';
import { 
  Lock, 
  User, 
  KeyRound, 
  CheckCircle2, 
  AlertCircle, 
  Sparkles, 
  ChevronRight, 
  UserPlus, 
  RefreshCcw, 
  HelpCircle,
  Building,
  ShieldAlert
} from 'lucide-react';

export const Login: React.FC = () => {
  const { login } = useTheme();
  
  // Tab states: 'login' | 'register' | 'reset'
  const [activeMode, setActiveMode] = useState<'login' | 'register' | 'reset'>('login');
  
  // Login states
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');

  // Register states
  const [regFullName, setRegFullName] = useState('');
  const [regUsername, setRegUsername] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regRole, setRegRole] = useState<UserRole>('SA');
  const [regBranch, setRegBranch] = useState('Jakarta');
  const [regError, setRegError] = useState('');
  const [regSuccess, setRegSuccess] = useState('');

  // Reset password states
  const [resetUsername, setResetUsername] = useState('');
  const [resetBranch, setResetBranch] = useState('Jakarta');
  const [resetNewPassword, setResetNewPassword] = useState('');
  const [resetConfirmPassword, setResetConfirmPassword] = useState('');
  const [resetError, setResetError] = useState('');
  const [resetSuccess, setResetSuccess] = useState('');

  // Dropdown options
  const [branches, setBranches] = useState<Branch[]>([]);
  
  const roleOptions: UserRole[] = [
    'Admin Customer',
    'Leader Customer',
    'SA',
    'SS',
    'VRO',
    'TS',
    'Vendor',
    'Leader Operation'
  ];

  useEffect(() => {
    // Load branches from local database
    const list = localDb.getBranches();
    setBranches(list);
    if (list.length > 0) {
      setRegBranch(list[0].cabang);
      setResetBranch(list[0].cabang);
    }
  }, []);

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');

    if (!username || !password) {
      setLoginError('Harap isi username dan password.');
      return;
    }

    // Lookup user in local storage
    const allUsers = localDb.getOperationUsers();
    const matchedUser = allUsers.find(
      (u) => u.username.toLowerCase() === username.trim().toLowerCase()
    );

    if (!matchedUser) {
      setLoginError('Username tidak ditemukan.');
      return;
    }

    // Default password to 'password123' if not explicitly defined
    const correctPassword = matchedUser.password || 'password123';
    if (password !== correctPassword) {
      setLoginError('Password salah.');
      return;
    }

    if (matchedUser.status !== 'Active') {
      setLoginError('Akun Anda dinonaktifkan. Hubungi Administrator.');
      return;
    }

    // Successful login!
    login(matchedUser);
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setRegError('');
    setRegSuccess('');

    if (!regFullName || !regUsername || !regPassword) {
      setRegError('Semua kolom wajib diisi.');
      return;
    }

    if (regUsername.length < 4) {
      setRegError('Username minimal 4 karakter.');
      return;
    }

    if (regPassword.length < 5) {
      setRegError('Password minimal 5 karakter.');
      return;
    }

    const allUsers = localDb.getOperationUsers();
    const usernameExists = allUsers.some(
      (u) => u.username.toLowerCase() === regUsername.trim().toLowerCase()
    );

    if (usernameExists) {
      setRegError('Username sudah terdaftar. Silakan pilih username lain.');
      return;
    }

    // Create the user
    try {
      const newUser: Partial<OperationUser> = {
        nama: regFullName.trim(),
        username: regUsername.trim().toLowerCase(),
        password: regPassword,
        role_operation: regRole,
        cabang_handling: regBranch,
        status: 'Active'
      };

      // Since we don't have a logged-in user to act as creator yet, mock an actor
      const systemActor: OperationUser = {
        id: 'user-system',
        nama: 'Sistem Registrasi',
        username: 'system',
        role_operation: 'Super Admin',
        cabang_handling: 'All Branches',
        status: 'Active',
        created_at: new Date().toISOString(),
        created_by: 'system',
        updated_at: new Date().toISOString(),
        updated_by: 'system'
      };

      await localDb.saveOperationUser(newUser, systemActor);
      setRegSuccess('Pendaftaran berhasil! Silakan masuk dengan akun baru Anda.');
      
      // Auto fill username for seamless login
      setUsername(regUsername.trim().toLowerCase());
      setPassword(regPassword);
      
      // Clear registration inputs
      setRegFullName('');
      setRegUsername('');
      setRegPassword('');
      
      // Delay switching to login mode to allow viewing success message
      setTimeout(() => {
        setActiveMode('login');
      }, 2000);
    } catch (err) {
      setRegError('Terjadi kesalahan saat menyimpan pendaftaran.');
    }
  };

  const handleResetSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setResetError('');
    setResetSuccess('');

    if (!resetUsername || !resetNewPassword || !resetConfirmPassword) {
      setResetError('Semua kolom wajib diisi.');
      return;
    }

    if (resetNewPassword !== resetConfirmPassword) {
      setResetError('Konfirmasi password tidak cocok.');
      return;
    }

    if (resetNewPassword.length < 5) {
      setResetError('Password baru minimal 5 karakter.');
      return;
    }

    const allUsers = localDb.getOperationUsers();
    const matchedUser = allUsers.find(
      (u) => u.username.toLowerCase() === resetUsername.trim().toLowerCase()
    );

    if (!matchedUser) {
      setResetError('Username tidak ditemukan.');
      return;
    }

    // Validate branch handling as a security challenge
    if (matchedUser.cabang_handling.toLowerCase() !== resetBranch.toLowerCase() && matchedUser.cabang_handling !== 'All Branches') {
      setResetError('Konfirmasi Cabang Handling tidak sesuai dengan data akun Anda.');
      return;
    }

    // Reset password
    try {
      const systemActor: OperationUser = {
        id: 'user-system',
        nama: 'Sistem Reset',
        username: 'system',
        role_operation: 'Super Admin',
        cabang_handling: 'All Branches',
        status: 'Active',
        created_at: new Date().toISOString(),
        created_by: 'system',
        updated_at: new Date().toISOString(),
        updated_by: 'system'
      };

      await localDb.saveOperationUser({
        ...matchedUser,
        password: resetNewPassword
      }, systemActor);

      setResetSuccess('Kata sandi berhasil diperbarui! Silakan masuk kembali.');
      setUsername(resetUsername.trim().toLowerCase());
      setPassword(resetNewPassword);

      setResetUsername('');
      setResetNewPassword('');
      setResetConfirmPassword('');

      setTimeout(() => {
        setActiveMode('login');
      }, 2000);
    } catch (err) {
      setResetError('Gagal mengatur ulang kata sandi.');
    }
  };

  const handleQuickLogin = (uName: string) => {
    const allUsers = localDb.getOperationUsers();
    const found = allUsers.find(u => u.username === uName);
    if (found) {
      setUsername(found.username);
      setPassword(found.password || 'password123');
      login(found);
    }
  };

  return (
    <div className="flex h-[100dvh] w-screen flex-col items-center justify-start overflow-y-auto bg-slate-50 px-4 py-8 dark:bg-slate-950 transition-colors duration-200 font-sans pb-safe pt-safe">
      
      {/* Upper Brand Info */}
      <div className="mb-8 text-center max-w-md">
        <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-600 font-black text-2xl text-white shadow-md shadow-brand-500/20 mb-4 animate-bounce">
          F
        </div>
        <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">
          FMOS System
        </h1>
        <p className="text-sm font-medium text-slate-500 mt-1 dark:text-slate-400">
          Enterprise Fleet Service Request ERP Hub
        </p>
      </div>

      {/* Main Authentication Card */}
      <div className="w-full max-w-md rounded-2xl border border-slate-200/80 bg-white p-8 shadow-xl dark:border-slate-800 dark:bg-slate-900">
        
        {/* Tab Selector Headers */}
        <div className="flex border-b border-slate-100 dark:border-slate-800 pb-4 mb-6">
          <button
            onClick={() => {
              setActiveMode('login');
              setLoginError('');
            }}
            className={`flex-1 text-center pb-2 text-xs font-bold transition-all relative ${
              activeMode === 'login'
                ? 'text-brand-600 dark:text-brand-400'
                : 'text-slate-400 hover:text-slate-600 dark:text-slate-500'
            }`}
          >
            Masuk / Login
            {activeMode === 'login' && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-brand-600 dark:bg-brand-400 rounded-full" />
            )}
          </button>
          
          <button
            onClick={() => {
              setActiveMode('register');
              setRegError('');
              setRegSuccess('');
            }}
            className={`flex-1 text-center pb-2 text-xs font-bold transition-all relative ${
              activeMode === 'register'
                ? 'text-brand-600 dark:text-brand-400'
                : 'text-slate-400 hover:text-slate-600 dark:text-slate-500'
            }`}
          >
            Daftar Mandiri
            {activeMode === 'register' && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-brand-600 dark:bg-brand-400 rounded-full" />
            )}
          </button>
          
          <button
            onClick={() => {
              setActiveMode('reset');
              setResetError('');
              setResetSuccess('');
            }}
            className={`flex-1 text-center pb-2 text-xs font-bold transition-all relative ${
              activeMode === 'reset'
                ? 'text-brand-600 dark:text-brand-400'
                : 'text-slate-400 hover:text-slate-600 dark:text-slate-500'
            }`}
          >
            Reset Sandi
            {activeMode === 'reset' && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-brand-600 dark:bg-brand-400 rounded-full" />
            )}
          </button>
        </div>

        {/* 1. LOGIN MODE */}
        {activeMode === 'login' && (
          <form onSubmit={handleLoginSubmit} className="space-y-4">
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
                Username Akun
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                  <User className="h-4 w-4" />
                </span>
                <input
                  type="text"
                  required
                  placeholder="Masukkan username Anda"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 pl-10 pr-4 py-2.5 text-xs font-medium focus:border-brand-500 focus:outline-none dark:border-slate-800 dark:bg-slate-950 dark:text-white"
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Kata Sandi
                </label>
                <button
                  type="button"
                  onClick={() => setActiveMode('reset')}
                  className="text-[10px] font-bold text-brand-600 hover:underline dark:text-brand-400"
                >
                  Lupa Sandi?
                </button>
              </div>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                  <Lock className="h-4 w-4" />
                </span>
                <input
                  type="password"
                  required
                  placeholder="Masukkan kata sandi Anda"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 pl-10 pr-4 py-2.5 text-xs font-medium focus:border-brand-500 focus:outline-none dark:border-slate-800 dark:bg-slate-950 dark:text-white"
                />
              </div>
            </div>

            {loginError && (
              <div className="flex items-start gap-2 rounded-xl bg-red-50 p-3 text-[11px] font-medium text-red-600 dark:bg-red-950/20 dark:text-red-400 border border-red-100 dark:border-red-950/30">
                <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                <span>{loginError}</span>
              </div>
            )}

            <button
              type="submit"
              className="w-full inline-flex items-center justify-center gap-1.5 rounded-xl bg-brand-600 py-3 text-xs font-bold text-white shadow-md shadow-brand-500/10 hover:bg-brand-700 active:scale-98 transition-all"
            >
              Masuk ke Aplikasi <ChevronRight className="h-4 w-4" />
            </button>
          </form>
        )}

        {/* 2. REGISTER MODE ("Daftar Mandiri") */}
        {activeMode === 'register' && (
          <form onSubmit={handleRegisterSubmit} className="space-y-4">
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
                Nama Lengkap
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                  <User className="h-4 w-4" />
                </span>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Budi Santoso"
                  value={regFullName}
                  onChange={(e) => setRegFullName(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 pl-10 pr-4 py-2.5 text-xs font-medium focus:border-brand-500 focus:outline-none dark:border-slate-800 dark:bg-slate-950 dark:text-white"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
                Username Pilihan
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                  <KeyRound className="h-4 w-4" />
                </span>
                <input
                  type="text"
                  required
                  placeholder="Contoh: budi_sales"
                  value={regUsername}
                  onChange={(e) => setRegUsername(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 pl-10 pr-4 py-2.5 text-xs font-medium focus:border-brand-500 focus:outline-none dark:border-slate-800 dark:bg-slate-950 dark:text-white"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
                Kata Sandi
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                  <Lock className="h-4 w-4" />
                </span>
                <input
                  type="password"
                  required
                  placeholder="Minimal 5 karakter"
                  value={regPassword}
                  onChange={(e) => setRegPassword(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 pl-10 pr-4 py-2.5 text-xs font-medium focus:border-brand-500 focus:outline-none dark:border-slate-800 dark:bg-slate-950 dark:text-white"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
                  Role Sistem
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400 pointer-events-none">
                    <ShieldAlert className="h-4 w-4" />
                  </span>
                  <select
                    value={regRole}
                    onChange={(e) => setRegRole(e.target.value as UserRole)}
                    className="w-full rounded-xl border border-slate-200 pl-9 pr-2 py-2.5 text-xs font-bold focus:border-brand-500 focus:outline-none dark:border-slate-800 dark:bg-slate-950 dark:text-white appearance-none cursor-pointer"
                  >
                    {roleOptions.map((role) => (
                      <option key={role} value={role}>
                        {role}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
                  Cabang Handling
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400 pointer-events-none">
                    <Building className="h-4 w-4" />
                  </span>
                  <select
                    value={regBranch}
                    onChange={(e) => setRegBranch(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 pl-9 pr-2 py-2.5 text-xs font-bold focus:border-brand-500 focus:outline-none dark:border-slate-800 dark:bg-slate-950 dark:text-white appearance-none cursor-pointer"
                  >
                    {branches.length > 0 ? (
                      branches.map((b) => (
                        <option key={b.id} value={b.cabang}>
                          {b.cabang}
                        </option>
                      ))
                    ) : (
                      <>
                        <option value="Jakarta">Jakarta</option>
                        <option value="Surabaya">Surabaya</option>
                        <option value="Medan">Medan</option>
                        <option value="Bandung">Bandung</option>
                        <option value="Bali">Bali</option>
                      </>
                    )}
                  </select>
                </div>
              </div>
            </div>

            {regError && (
              <div className="flex items-start gap-2 rounded-xl bg-red-50 p-3 text-[11px] font-medium text-red-600 dark:bg-red-950/20 dark:text-red-400 border border-red-100 dark:border-red-950/30">
                <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                <span>{regError}</span>
              </div>
            )}

            {regSuccess && (
              <div className="flex items-start gap-2 rounded-xl bg-emerald-50 p-3 text-[11px] font-medium text-emerald-600 dark:bg-emerald-950/20 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-950/30">
                <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5" />
                <span>{regSuccess}</span>
              </div>
            )}

            <button
              type="submit"
              className="w-full inline-flex items-center justify-center gap-1.5 rounded-xl bg-emerald-600 py-3 text-xs font-bold text-white shadow-md shadow-emerald-500/10 hover:bg-emerald-700 active:scale-98 transition-all"
            >
              Daftar Sekarang <UserPlus className="h-4 w-4" />
            </button>
          </form>
        )}

        {/* 3. RESET PASSWORD MODE ("Reset Password Mandiri") */}
        {activeMode === 'reset' && (
          <form onSubmit={handleResetSubmit} className="space-y-4">
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
                Username Akun Anda
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                  <User className="h-4 w-4" />
                </span>
                <input
                  type="text"
                  required
                  placeholder="Masukkan username Anda"
                  value={resetUsername}
                  onChange={(e) => setResetUsername(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 pl-10 pr-4 py-2.5 text-xs font-medium focus:border-brand-500 focus:outline-none dark:border-slate-800 dark:bg-slate-950 dark:text-white"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
                Konfirmasi Cabang Handling
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400 pointer-events-none">
                  <Building className="h-4 w-4" />
                </span>
                <select
                  value={resetBranch}
                  onChange={(e) => setResetBranch(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 pl-9 pr-2 py-2.5 text-xs font-bold focus:border-brand-500 focus:outline-none dark:border-slate-800 dark:bg-slate-950 dark:text-white appearance-none cursor-pointer"
                >
                  {branches.length > 0 ? (
                    branches.map((b) => (
                      <option key={b.id} value={b.cabang}>
                        {b.cabang}
                      </option>
                    ))
                  ) : (
                    <>
                      <option value="Jakarta">Jakarta</option>
                      <option value="Surabaya">Surabaya</option>
                      <option value="Medan">Medan</option>
                      <option value="Bandung">Bandung</option>
                      <option value="Bali">Bali</option>
                    </>
                  )}
                </select>
              </div>
              <p className="text-[10px] text-slate-400 mt-1">
                Tantangan keamanan: Harap pilih cabang tempat Anda ditugaskan.
              </p>
            </div>

            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
                Kata Sandi Baru
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                  <Lock className="h-4 w-4" />
                </span>
                <input
                  type="password"
                  required
                  placeholder="Minimal 5 karakter"
                  value={resetNewPassword}
                  onChange={(e) => setResetNewPassword(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 pl-10 pr-4 py-2.5 text-xs font-medium focus:border-brand-500 focus:outline-none dark:border-slate-800 dark:bg-slate-950 dark:text-white"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
                Konfirmasi Kata Sandi Baru
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                  <Lock className="h-4 w-4" />
                </span>
                <input
                  type="password"
                  required
                  placeholder="Ulangi kata sandi baru"
                  value={resetConfirmPassword}
                  onChange={(e) => setResetConfirmPassword(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 pl-10 pr-4 py-2.5 text-xs font-medium focus:border-brand-500 focus:outline-none dark:border-slate-800 dark:bg-slate-950 dark:text-white"
                />
              </div>
            </div>

            {resetError && (
              <div className="flex items-start gap-2 rounded-xl bg-red-50 p-3 text-[11px] font-medium text-red-600 dark:bg-red-950/20 dark:text-red-400 border border-red-100 dark:border-red-950/30">
                <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                <span>{resetError}</span>
              </div>
            )}

            {resetSuccess && (
              <div className="flex items-start gap-2 rounded-xl bg-emerald-50 p-3 text-[11px] font-medium text-emerald-600 dark:bg-emerald-950/20 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-950/30">
                <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5" />
                <span>{resetSuccess}</span>
              </div>
            )}

            <button
              type="submit"
              className="w-full inline-flex items-center justify-center gap-1.5 rounded-xl bg-amber-600 py-3 text-xs font-bold text-white shadow-md shadow-amber-500/10 hover:bg-amber-700 active:scale-98 transition-all"
            >
              Perbarui Kata Sandi <RefreshCcw className="h-4 w-4" />
            </button>
          </form>
        )}
      </div>

      {/* QUICK LOGIN TOOLBAR (SEEDED USERS FOR PREVIEW/TESTING CONVENIENCE) */}
      <div className="mt-8 w-full max-w-xl rounded-2xl border border-yellow-200/50 bg-yellow-50/20 p-5 dark:border-slate-800 dark:bg-slate-900/50">
        <div className="flex items-center gap-1.5 text-yellow-800 dark:text-yellow-400 mb-3">
          <Sparkles className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
          <h3 className="text-xs font-extrabold uppercase tracking-wide">
            Akses Cepat Developer & Auditor (Klik Semua Role untuk Masuk)
          </h3>
        </div>
        <div className="grid grid-cols-3 gap-2">
          <button
            onClick={() => handleQuickLogin('superadmin')}
            className="flex flex-col items-start rounded-xl bg-white border border-slate-100 p-2 text-left hover:border-brand-500 transition-colors shadow-xs dark:bg-slate-950 dark:border-slate-800"
          >
            <span className="text-[10px] font-bold text-slate-800 dark:text-white truncate w-full">Admin Utama</span>
            <span className="text-[8px] font-medium text-slate-400 truncate w-full">username: superadmin</span>
            <span className="text-[8px] font-semibold text-brand-600">Super Admin</span>
          </button>

          <button
            onClick={() => handleQuickLogin('admin_astra')}
            className="flex flex-col items-start rounded-xl bg-white border border-slate-100 p-2 text-left hover:border-brand-500 transition-colors shadow-xs dark:bg-slate-950 dark:border-slate-800"
          >
            <span className="text-[10px] font-bold text-slate-800 dark:text-white truncate w-full">Rini (Admin Astra)</span>
            <span className="text-[8px] font-medium text-slate-400 truncate w-full">username: admin_astra</span>
            <span className="text-[8px] font-semibold text-brand-600">Admin Customer</span>
          </button>

          <button
            onClick={() => handleQuickLogin('leader_astra')}
            className="flex flex-col items-start rounded-xl bg-white border border-slate-100 p-2 text-left hover:border-brand-500 transition-colors shadow-xs dark:bg-slate-950 dark:border-slate-800"
          >
            <span className="text-[10px] font-bold text-slate-800 dark:text-white truncate w-full">Bambang (Leader AST)</span>
            <span className="text-[8px] font-medium text-slate-400 truncate w-full">username: leader_astra</span>
            <span className="text-[8px] font-semibold text-brand-600">Leader Customer</span>
          </button>

          <button
            onClick={() => handleQuickLogin('sa_dki')}
            className="flex flex-col items-start rounded-xl bg-white border border-slate-100 p-2 text-left hover:border-brand-500 transition-colors shadow-xs dark:bg-slate-950 dark:border-slate-800"
          >
            <span className="text-[10px] font-bold text-slate-800 dark:text-white truncate w-full">Andi (SA)</span>
            <span className="text-[8px] font-medium text-slate-400 truncate w-full">username: sa_dki</span>
            <span className="text-[8px] font-semibold text-brand-600">SA (Service Advisor)</span>
          </button>

          <button
            onClick={() => handleQuickLogin('ss_dki')}
            className="flex flex-col items-start rounded-xl bg-white border border-slate-100 p-2 text-left hover:border-brand-500 transition-colors shadow-xs dark:bg-slate-950 dark:border-slate-800"
          >
            <span className="text-[10px] font-bold text-slate-800 dark:text-white truncate w-full">Slamet (SS)</span>
            <span className="text-[8px] font-medium text-slate-400 truncate w-full">username: ss_dki</span>
            <span className="text-[8px] font-semibold text-brand-600">SS (Service Support)</span>
          </button>

          <button
            onClick={() => handleQuickLogin('vro_dki')}
            className="flex flex-col items-start rounded-xl bg-white border border-slate-100 p-2 text-left hover:border-brand-500 transition-colors shadow-xs dark:bg-slate-950 dark:border-slate-800"
          >
            <span className="text-[10px] font-bold text-slate-800 dark:text-white truncate w-full">Viktor (VRO)</span>
            <span className="text-[8px] font-medium text-slate-400 truncate w-full">username: vro_dki</span>
            <span className="text-[8px] font-semibold text-brand-600">VRO</span>
          </button>

          <button
            onClick={() => handleQuickLogin('ts_dki')}
            className="flex flex-col items-start rounded-xl bg-white border border-slate-100 p-2 text-left hover:border-brand-500 transition-colors shadow-xs dark:bg-slate-950 dark:border-slate-800"
          >
            <span className="text-[10px] font-bold text-slate-800 dark:text-white truncate w-full">Tono (TS)</span>
            <span className="text-[8px] font-medium text-slate-400 truncate w-full">username: ts_dki</span>
            <span className="text-[8px] font-semibold text-brand-600">TS (Tech Service)</span>
          </button>

          <button
            onClick={() => handleQuickLogin('vendor_agung')}
            className="flex flex-col items-start rounded-xl bg-white border border-slate-100 p-2 text-left hover:border-brand-500 transition-colors shadow-xs dark:bg-slate-950 dark:border-slate-800"
          >
            <span className="text-[10px] font-bold text-slate-800 dark:text-white truncate w-full">Budi (Bengkel Agung)</span>
            <span className="text-[8px] font-medium text-slate-400 truncate w-full">VMD001: vendor_agung</span>
            <span className="text-[8px] font-semibold text-brand-600">Vendor Agung</span>
          </button>

          <button
            onClick={() => handleQuickLogin('vendor_lestari')}
            className="flex flex-col items-start rounded-xl bg-white border border-slate-100 p-2 text-left hover:border-brand-500 transition-colors shadow-xs dark:bg-slate-950 dark:border-slate-800"
          >
            <span className="text-[10px] font-bold text-slate-800 dark:text-white truncate w-full">Lestari (Body Repair)</span>
            <span className="text-[8px] font-medium text-slate-400 truncate w-full">VMD002: vendor_lestari</span>
            <span className="text-[8px] font-semibold text-brand-600">Vendor Lestari</span>
          </button>

          <button
            onClick={() => handleQuickLogin('vendor_sinar')}
            className="flex flex-col items-start rounded-xl bg-white border border-slate-100 p-2 text-left hover:border-brand-500 transition-colors shadow-xs dark:bg-slate-950 dark:border-slate-800"
          >
            <span className="text-[10px] font-bold text-slate-800 dark:text-white truncate w-full">Sinar (Biro Jasa)</span>
            <span className="text-[8px] font-medium text-slate-400 truncate w-full">VMD003: vendor_sinar</span>
            <span className="text-[8px] font-semibold text-brand-600">Vendor Sinar</span>
          </button>

          <button
            onClick={() => handleQuickLogin('vendor_isuzu')}
            className="flex flex-col items-start rounded-xl bg-white border border-slate-100 p-2 text-left hover:border-brand-500 transition-colors shadow-xs dark:bg-slate-950 dark:border-slate-800"
          >
            <span className="text-[10px] font-bold text-slate-800 dark:text-white truncate w-full">Astra Isuzu (Official)</span>
            <span className="text-[8px] font-medium text-slate-400 truncate w-full">VMD004: vendor_isuzu</span>
            <span className="text-[8px] font-semibold text-brand-600">Vendor Isuzu</span>
          </button>

          <button
            onClick={() => handleQuickLogin('leader_ops')}
            className="flex flex-col items-start rounded-xl bg-white border border-slate-100 p-2 text-left hover:border-brand-500 transition-colors shadow-xs dark:bg-slate-950 dark:border-slate-800"
          >
            <span className="text-[10px] font-bold text-slate-800 dark:text-white truncate w-full">Haryanto (Leader Ops)</span>
            <span className="text-[8px] font-medium text-slate-400 truncate w-full">username: leader_ops</span>
            <span className="text-[8px] font-semibold text-brand-600">Leader Operation</span>
          </button>
        </div>
        <p className="text-[9px] text-yellow-800/60 dark:text-slate-400 mt-3 text-center">
          *Semua akun bawaan di atas memiliki kata sandi default: <span className="font-extrabold text-slate-800 dark:text-white">password123</span>
        </p>
      </div>

    </div>
  );
};
