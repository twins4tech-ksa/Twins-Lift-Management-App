import React, { useState, useEffect } from 'react';
import {
  UserProfile,
  UserPortalRole,
  ROLE_PRIVILEGES_MAP,
  SAMPLE_USER_PROFILES,
} from '../types/portal';
import { Customer } from '../types/elevator';
import { Employee, ROLE_CONFIGS } from '../types/employee';
import { AppLanguage } from '../utils/translations';
import {
  ShieldCheck,
  Lock,
  Mail,
  User,
  Eye,
  EyeOff,
  Sparkles,
  Check,
  AlertCircle,
  ArrowRight,
  ArrowLeft,
  Building2,
  CheckCircle2,
  Send,
  HelpCircle,
  Clock,
  Shield,
  Zap,
  Phone,
  Globe,
  RefreshCw,
  LogOut
} from 'lucide-react';
import { TwinsLogo } from './TwinsLogo';

interface ModernLoginPageProps {
  onLogin: (user: UserProfile) => void;
  customers?: Customer[];
  employees?: Employee[];
  onUpdateEmployeePassword?: (employeeId: string, newPass: string) => void;
  language: AppLanguage;
  onToggleLanguage: () => void;
}

// Master passwords accepted internally for administrative fallback
const SYSTEM_MASTER_PASSWORDS = [
  'MASTER2026',
  'MASTER',
  'TWINS@MASTER',
  'ADMIN@MASTER',
  'TWINS2026',
  '000000',
];

type LoginTab = 'CREDENTIALS' | 'FORGOT_PASSWORD';

export const ModernLoginPage: React.FC<ModernLoginPageProps> = ({
  onLogin,
  customers = [],
  employees = [],
  onUpdateEmployeePassword,
  language,
  onToggleLanguage,
}) => {
  const isAr = language === 'ar';

  const [activeTab, setActiveTab] = useState<LoginTab>('CREDENTIALS');

  // Login form states
  const [userIdentifier, setUserIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Forgot Password / Recovery States
  const [recoveryEmail, setRecoveryEmail] = useState('');
  const [recoveryStep, setRecoveryStep] = useState<1 | 2 | 3>(1);
  const [generatedOtp, setGeneratedOtp] = useState('');
  const [enteredOtp, setEnteredOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [recoveryError, setRecoveryError] = useState<string | null>(null);
  const [recoverySuccessMsg, setRecoverySuccessMsg] = useState<string | null>(null);
  const [otpCountdown, setOtpCountdown] = useState(60);
  const [isOtpTimerActive, setIsOtpTimerActive] = useState(false);
  const [emailNotificationBanner, setEmailNotificationBanner] = useState<{
    toEmail: string;
    code: string;
    userName: string;
  } | null>(null);

  // OTP Countdown Timer
  useEffect(() => {
    let timer: any;
    if (isOtpTimerActive && otpCountdown > 0) {
      timer = setInterval(() => {
        setOtpCountdown((prev) => prev - 1);
      }, 1000);
    } else if (otpCountdown === 0) {
      setIsOtpTimerActive(false);
    }
    return () => clearInterval(timer);
  }, [isOtpTimerActive, otpCountdown]);

  // Normalize phone for comparison
  const normalizePhone = (phoneStr?: string) => {
    if (!phoneStr) return '';
    return phoneStr.replace(/[\s\-\+\(\)]/g, '').replace(/^966/, '0');
  };

  // Find candidate user across all datasets (employees, customers, sample profiles)
  const findUserByIdentifier = (ident: string): { profile: UserProfile; personalPassword?: string; masterPassword?: string } | null => {
    const term = ident.trim().toLowerCase();
    const termPhone = normalizePhone(term);

    // 1. Check in Employees (including portal users)
    for (const emp of employees) {
      const empUsername = emp.portalUser?.username?.toLowerCase() || '';
      const empEmail = (emp.portalUser?.email || emp.email || '').toLowerCase();
      const empPhoneNorm = normalizePhone(emp.phone);
      const empCode = emp.code.toLowerCase();

      if (
        empUsername === term ||
        empEmail === term ||
        (termPhone && empPhoneNorm.endsWith(termPhone)) ||
        empCode === term
      ) {
        const portalRole: UserPortalRole = emp.portalUser?.portalRole || 
          (emp.role === 'SALES_REP' ? 'SALES_REP' : emp.customRoleId ? 'CUSTOM' : 'TECHNICIAN');

        const profile: UserProfile = {
          id: emp.portalUser?.userId || `emp-user-${emp.id}`,
          name: emp.name,
          nameEn: emp.nameEn,
          role: portalRole,
          email: emp.portalUser?.email || emp.email || '',
          phone: emp.phone,
          avatarLabel: emp.role === 'SALES_REP' ? 'مب' : 'فن',
          title: emp.portalUser?.userTitle || emp.position || `${ROLE_CONFIGS[emp.role]?.labelAr || 'موظف'} - ${emp.code}`,
          employeeId: emp.id,
          canViewAllDepartmentRecords: emp.portalUser?.canViewAllDepartmentRecords ?? false,
          customRoleId: emp.customRoleId,
          customRoleName: emp.customRoleName,
          username: emp.portalUser?.username || emp.code.toLowerCase(),
          password: emp.portalUser?.password || 'password123',
          masterPassword: emp.portalUser?.masterPassword || 'MASTER2026',
        };

        return {
          profile,
          personalPassword: emp.portalUser?.password || 'password123',
          masterPassword: emp.portalUser?.masterPassword || 'MASTER2026',
        };
      }
    }

    // 2. Check in Sample User Profiles
    for (const p of SAMPLE_USER_PROFILES) {
      const pUsername = (p.username || '').toLowerCase();
      const pEmail = (p.email || '').toLowerCase();
      const pPhoneNorm = normalizePhone(p.phone);

      if (
        pUsername === term ||
        pEmail === term ||
        (termPhone && pPhoneNorm.endsWith(termPhone)) ||
        (term === 'admin' && p.role === 'MANAGEMENT') ||
        (term === 'gm' && p.role === 'MANAGEMENT')
      ) {
        return {
          profile: p,
          personalPassword: p.password || (p.role === 'MANAGEMENT' ? 'admin' : 'password123'),
          masterPassword: p.masterPassword || 'MASTER2026',
        };
      }
    }

    // 3. Check in Customers
    for (const c of customers) {
      const cEmail = (c.email || '').toLowerCase();
      const cPhoneNorm = normalizePhone(c.phone);
      const cId = c.id.toLowerCase();
      const cName = c.name.toLowerCase();

      if (cEmail === term || (termPhone && cPhoneNorm.endsWith(termPhone)) || cId === term || cName.includes(term)) {
        const profile: UserProfile = {
          id: `cust-user-${c.id}`,
          name: c.name,
          role: 'CUSTOMER',
          email: c.email || 'customer@twinselevators.com',
          phone: c.phone || '+966 50 000 0000',
          avatarLabel: 'عم',
          title: `عميل معتمد - ${c.company || c.name}`,
          customerId: c.id,
          customerCompany: c.company || c.name,
          canViewAllDepartmentRecords: false,
          username: c.id,
          password: 'password123',
          masterPassword: 'MASTER2026',
        };
        return {
          profile,
          personalPassword: 'password123',
          masterPassword: 'MASTER2026',
        };
      }
    }

    // 4. Default fallback: If username is "admin"
    if (term === 'admin' || term === 'المدير' || term === 'gm') {
      const mgt = SAMPLE_USER_PROFILES.find((p) => p.role === 'MANAGEMENT') || SAMPLE_USER_PROFILES[0];
      return {
        profile: mgt,
        personalPassword: mgt.password || 'admin',
        masterPassword: 'MASTER2026',
      };
    }

    return null;
  };

  // Handle standard credentials login
  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);

    if (!userIdentifier.trim()) {
      setAuthError(isAr ? 'يرجى إدخال اسم المستخدم أو البريد أو الهاتف' : 'Please enter username, email, or phone');
      return;
    }

    if (!password) {
      setAuthError(isAr ? 'يرجى إدخال الرقم السري' : 'Please enter password');
      return;
    }

    setIsLoading(true);

    setTimeout(() => {
      setIsLoading(false);
      const matched = findUserByIdentifier(userIdentifier);

      if (!matched) {
        setAuthError(
          isAr
            ? 'لم يتم العثور على حساب بهذا المعرّف. يرجى التحقق من اسم المستخدم أو البريد الإلكتروني أو رقم الهاتف.'
            : 'Account not found. Please check your username, email, or mobile number.'
        );
        return;
      }

      const inputPass = password.trim();
      const validPersonal = matched.personalPassword || 'password123';
      const validUserMaster = matched.masterPassword || 'MASTER2026';

      const isPersonalValid = inputPass === validPersonal;
      const isMasterValid =
        inputPass === validUserMaster ||
        SYSTEM_MASTER_PASSWORDS.includes(inputPass.toUpperCase()) ||
        inputPass.toLowerCase() === 'master' ||
        inputPass.toLowerCase() === 'master2026';

      if (!isPersonalValid && !isMasterValid) {
        setAuthError(
          isAr
            ? 'كلمة المرور غير صحيحة. يرجى المحاولة مرة أخرى أو النقر على "نسيت كلمة المرور؟".'
            : 'Incorrect password. Please try again or click "Forgot Password?".'
        );
        return;
      }

      const targetProfile: UserProfile = {
        ...matched.profile,
        lastLogin: new Date().toISOString().replace('T', ' ').slice(0, 16),
      };

      onLogin(targetProfile);
    }, 200);
  };

  // Forgot password step 1
  const handleSendRecoveryCode = (e: React.FormEvent) => {
    e.preventDefault();
    setRecoveryError(null);
    setRecoverySuccessMsg(null);

    const emailTrim = recoveryEmail.trim().toLowerCase();
    if (!emailTrim) {
      setRecoveryError(isAr ? 'يرجى إدخال البريد الإلكتروني أو اسم المستخدم' : 'Please enter email or username');
      return;
    }

    const matched = findUserByIdentifier(emailTrim);
    if (!matched) {
      setRecoveryError(
        isAr ? 'لم يتم العثور على أي حساب مرتبط بهذا البريد أو المعرّف' : 'No account found matching this identifier'
      );
      return;
    }

    const code = Math.floor(100000 + Math.random() * 900000).toString();
    setGeneratedOtp(code);
    setIsOtpTimerActive(true);
    setOtpCountdown(60);
    setRecoveryStep(2);

    setEmailNotificationBanner({
      toEmail: matched.profile.email || emailTrim,
      code,
      userName: matched.profile.name,
    });
  };

  // Forgot password step 2: verify OTP
  const handleVerifyOtp = (e: React.FormEvent) => {
    e.preventDefault();
    setRecoveryError(null);

    if (enteredOtp.trim() !== generatedOtp.trim()) {
      setRecoveryError(isAr ? 'كود التحقق غير صحيح، يرجى المحاولة مرة أخرى' : 'Invalid verification code, please try again');
      return;
    }

    setRecoveryStep(3);
    setRecoverySuccessMsg(
      isAr ? 'تم التحقق من الرمز بنجاح! عيّن الرقم السري الجديد الآن' : 'Code verified! Set your new password now'
    );
  };

  // Forgot password step 3: save new password
  const handleSaveNewPassword = (e: React.FormEvent) => {
    e.preventDefault();
    setRecoveryError(null);

    if (!newPassword || newPassword.length < 4) {
      setRecoveryError(isAr ? 'يجب ألا يقل الرقم السري عن 4 خانات' : 'Password must be at least 4 characters');
      return;
    }

    if (newPassword !== confirmPassword) {
      setRecoveryError(isAr ? 'كلمتا المرور غير متطابقتين' : 'Passwords do not match');
      return;
    }

    const matched = findUserByIdentifier(recoveryEmail);
    if (matched && matched.profile.employeeId && onUpdateEmployeePassword) {
      onUpdateEmployeePassword(matched.profile.employeeId, newPassword);
    }

    try {
      localStorage.setItem(`user_pass_${recoveryEmail.trim().toLowerCase()}`, newPassword);
    } catch (e) {
      console.warn('Could not cache new password', e);
    }

    setUserIdentifier(recoveryEmail);
    setPassword(newPassword);
    setRecoveryStep(1);
    setEmailNotificationBanner(null);
    setActiveTab('CREDENTIALS');
    setAuthError(null);
    setRecoverySuccessMsg(null);
  };

  return (
    <div
      dir={isAr ? 'rtl' : 'ltr'}
      className="min-h-screen bg-slate-50 flex flex-col justify-between selection:bg-blue-600 selection:text-white relative overflow-x-hidden font-sans"
    >
      {/* Background Decor: Clean luxury soft glows */}
      <div className="absolute top-0 inset-x-0 h-96 bg-gradient-to-b from-blue-100/50 via-indigo-50/20 to-transparent pointer-events-none" />
      <div className="absolute -top-32 right-1/4 w-96 h-96 bg-blue-200/30 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-48 left-1/4 w-80 h-80 bg-indigo-200/20 rounded-full blur-3xl pointer-events-none" />

      {/* Top Header Navbar */}
      <header className="relative z-20 bg-white/90 backdrop-blur-md border-b border-slate-200/80 px-4 sm:px-8 py-3.5 shadow-2xs">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          {/* Logo & Company Branding */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-gradient-to-br from-blue-700 via-indigo-700 to-blue-900 p-0.5 shadow-md shadow-blue-500/15 flex items-center justify-center shrink-0">
              <div className="w-full h-full bg-white rounded-[14px] flex items-center justify-center">
                <TwinsLogo className="w-7 h-7 sm:w-8 sm:h-8" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-base sm:text-lg font-black tracking-tight text-slate-900">
                  {isAr ? 'شركة مصاعد التوأم' : 'Twins Elevators Co.'}
                </span>
                <span className="hidden sm:inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                  🇸🇦 🇪🇬 {isAr ? 'السعودية ومصر' : 'KSA & Egypt'}
                </span>
              </div>
              <p className="text-[11px] text-slate-500 font-medium">
                {isAr
                  ? 'بوابة الدخول الموحدة للأنظمة والتشغيل الميداني'
                  : 'Unified Enterprise & Field Operations Portal'}
              </p>
            </div>
          </div>

          {/* Right Controls: Live Badge, Emergency, Language Toggle */}
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span>{isAr ? 'الخادم متصل - نظام مشفر' : 'Server Online - Encrypted'}</span>
            </div>

            <button
              type="button"
              onClick={onToggleLanguage}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 hover:border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold transition-all shadow-2xs cursor-pointer"
              title={isAr ? 'Switch to English' : 'التحويل للعربية'}
            >
              <Globe className="w-4 h-4 text-blue-600" />
              <span>{isAr ? 'English' : 'عربي'}</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="relative z-10 flex-1 flex items-center justify-center px-4 py-8 sm:py-12">
        <div className="w-full max-w-xl mx-auto">
          {/* Main Pure White Login Card */}
          <div className="bg-white rounded-3xl border border-slate-200/90 shadow-2xl shadow-slate-200/70 overflow-hidden relative transition-all">
            {/* Top decorative gradient line */}
            <div className="h-1.5 w-full bg-gradient-to-r from-blue-600 via-indigo-600 to-amber-500" />

            {/* OTP Banner if active in recovery */}
            {emailNotificationBanner && (
              <div className="bg-gradient-to-r from-amber-50 to-orange-50 border-b border-amber-200 p-3 sm:px-6 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2 text-amber-900 font-medium">
                  <Mail className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>
                    {isAr ? 'كود التحقق التجريبي:' : 'Demo OTP Code:'}{' '}
                    <strong className="font-mono text-sm font-bold text-amber-700 tracking-wider">
                      {emailNotificationBanner.code}
                    </strong>
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setEnteredOtp(emailNotificationBanner.code)}
                  className="px-2.5 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-bold text-[11px] shadow-xs cursor-pointer"
                >
                  {isAr ? 'نسخ ولصق الكود' : 'Paste Code'}
                </button>
              </div>
            )}

            {/* Login Card Body */}
            <div className="p-6 sm:p-8">
              {/* Header Icon & Title */}
                <div className="text-center mb-6">
                  <div className="w-14 h-14 mx-auto rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 shadow-sm mb-3">
                    <ShieldCheck className="w-8 h-8" />
                  </div>
                  <h1 className="text-2xl font-black text-slate-900 tracking-tight">
                    {isAr ? 'تسجيل الدخول إلى المنظومة' : 'Sign in to Enterprise Portal'}
                  </h1>
                  <p className="text-xs sm:text-sm text-slate-500 font-medium mt-1">
                    {isAr
                      ? 'الوصول الموحد لإدارة المصاعد، الصيانة، المبيعات، وبوابة العملاء'
                      : 'Unified access for operations, maintenance, sales, and client portal'}
                  </p>
                </div>

                {/* Error Banner */}
                {authError && (
                  <div className="mb-5 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-medium flex items-start gap-2.5 animate-in fade-in">
                    <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                    <span className="flex-1">{authError}</span>
                  </div>
                )}

                {/* STANDARD CREDENTIALS FORM */}
                {activeTab === 'CREDENTIALS' && (
                  <form onSubmit={handleLoginSubmit} className="space-y-4">
                    {/* User Identifier */}
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1.5">
                        {isAr ? 'اسم المستخدم أو البريد أو رقم الجوال' : 'Username, Email, or Mobile'}
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 start-0 ps-3.5 flex items-center pointer-events-none text-slate-400">
                          <User className="w-4 h-4" />
                        </div>
                        <input
                          type="text"
                          required
                          value={userIdentifier}
                          onChange={(e) => setUserIdentifier(e.target.value)}
                          placeholder={isAr ? 'مثال: admin أو technician أو sales أو customer' : 'e.g. admin, technician, sales, or customer'}
                          className="w-full ps-10 pe-4 py-3 bg-white border border-slate-200 focus:border-blue-600 focus:ring-4 focus:ring-blue-50 text-slate-900 rounded-xl text-sm font-medium placeholder:text-slate-400 transition-all outline-hidden"
                        />
                      </div>
                    </div>

                    {/* Password */}
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1.5">
                        {isAr ? 'الرقم السري' : 'Password'}
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 start-0 ps-3.5 flex items-center pointer-events-none text-slate-400">
                          <Lock className="w-4 h-4" />
                        </div>
                        <input
                          type={showPassword ? 'text' : 'password'}
                          required
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          placeholder="••••••••"
                          className="w-full ps-10 pe-11 py-3 bg-white border border-slate-200 focus:border-blue-600 focus:ring-4 focus:ring-blue-50 text-slate-900 rounded-xl text-sm font-medium placeholder:text-slate-400 transition-all outline-hidden"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute inset-y-0 end-0 pe-3 flex items-center text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
                        >
                          {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    {/* Helpers: Remember Me & Forgot Password */}
                    <div className="flex items-center justify-between text-xs pt-1">
                      <label className="flex items-center gap-2 cursor-pointer select-none text-slate-600">
                        <input
                          type="checkbox"
                          checked={rememberMe}
                          onChange={(e) => setRememberMe(e.target.checked)}
                          className="w-4 h-4 rounded text-blue-600 border-slate-300 focus:ring-blue-500 cursor-pointer"
                        />
                        <span>{isAr ? 'تذكرني في هذه الجلسة' : 'Remember me'}</span>
                      </label>

                      <button
                        type="button"
                        onClick={() => {
                          setActiveTab('FORGOT_PASSWORD');
                          setRecoveryStep(1);
                          setRecoveryError(null);
                          setRecoveryEmail(userIdentifier);
                        }}
                        className="text-blue-600 hover:text-blue-800 font-bold hover:underline cursor-pointer"
                      >
                        {isAr ? 'نسيت كلمة المرور؟' : 'Forgot Password?'}
                      </button>
                    </div>

                    {/* Submit Action */}
                    <button
                      type="submit"
                      disabled={isLoading}
                      className="w-full mt-2 py-3.5 px-6 rounded-xl bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-700 hover:from-blue-700 hover:to-indigo-800 text-white font-bold text-sm shadow-lg shadow-blue-500/20 flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-75 active:scale-[0.99]"
                    >
                      {isLoading ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin" />
                          <span>{isAr ? 'جاري التحقق من الصلاحيات...' : 'Authenticating...'}</span>
                        </>
                      ) : (
                        <>
                          <span>{isAr ? 'تسجيل الدخول والمتابعة' : 'Sign In & Continue'}</span>
                          {isAr ? <ArrowLeft className="w-4 h-4" /> : <ArrowRight className="w-4 h-4" />}
                        </>
                      )}
                    </button>
                  </form>
                )}

                {/* FORGOT PASSWORD WIZARD */}
                {activeTab === 'FORGOT_PASSWORD' && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                      <span className="text-xs font-bold text-slate-800">
                        {isAr ? 'استعادة وتعيين الرقم السري' : 'Password Recovery'}
                      </span>
                      <button
                        type="button"
                        onClick={() => setActiveTab('CREDENTIALS')}
                        className="text-xs text-blue-600 hover:underline font-bold cursor-pointer"
                      >
                        {isAr ? 'العودة للدخول' : 'Back to Login'}
                      </button>
                    </div>

                    {recoveryError && (
                      <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-medium flex items-center gap-2">
                        <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                        <span>{recoveryError}</span>
                      </div>
                    )}

                    {recoverySuccessMsg && (
                      <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-medium flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                        <span>{recoverySuccessMsg}</span>
                      </div>
                    )}

                    {/* Step 1: Input Email */}
                    {recoveryStep === 1 && (
                      <form onSubmit={handleSendRecoveryCode} className="space-y-3">
                        <p className="text-xs text-slate-500">
                          {isAr
                            ? 'أدخل البريد الإلكتروني المسجل في حسابك لإرسال كود التحقق السري OTP:'
                            : 'Enter your registered email to receive an OTP verification code:'}
                        </p>
                        <div className="relative">
                          <Mail className="absolute inset-y-0 start-0 ps-3.5 w-4 h-4 my-auto text-slate-400" />
                          <input
                            type="text"
                            required
                            value={recoveryEmail}
                            onChange={(e) => setRecoveryEmail(e.target.value)}
                            placeholder="admin@twinselevators.com"
                            className="w-full ps-10 pe-4 py-3 bg-white border border-slate-200 focus:border-blue-600 rounded-xl text-sm font-medium outline-hidden"
                          />
                        </div>
                        <button
                          type="submit"
                          className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md transition-all cursor-pointer flex items-center justify-center gap-2"
                        >
                          <Send className="w-3.5 h-3.5" />
                          <span>{isAr ? 'إرسال كود التحقق السري' : 'Send Verification Code'}</span>
                        </button>
                      </form>
                    )}

                    {/* Step 2: OTP Entry */}
                    {recoveryStep === 2 && (
                      <form onSubmit={handleVerifyOtp} className="space-y-3">
                        <p className="text-xs text-slate-500">
                          {isAr
                            ? `تم إرسال كود من 6 أرقام إلى: ${recoveryEmail}`
                            : `A 6-digit code has been sent to: ${recoveryEmail}`}
                        </p>
                        <input
                          type="text"
                          required
                          maxLength={6}
                          value={enteredOtp}
                          onChange={(e) => setEnteredOtp(e.target.value)}
                          placeholder="123456"
                          className="w-full py-3 text-center tracking-widest font-mono text-xl font-bold bg-white border border-slate-200 focus:border-blue-600 rounded-xl outline-hidden"
                        />
                        <div className="flex items-center justify-between text-xs text-slate-400">
                          <span>
                            {isAr ? 'إعادة الإرسال بعد:' : 'Resend after:'} {otpCountdown}s
                          </span>
                          <button
                            type="button"
                            disabled={isOtpTimerActive}
                            onClick={handleSendRecoveryCode}
                            className="text-blue-600 disabled:text-slate-300 font-bold hover:underline cursor-pointer"
                          >
                            {isAr ? 'إعادة إرسال الكود' : 'Resend Code'}
                          </button>
                        </div>
                        <button
                          type="submit"
                          className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md transition-all cursor-pointer"
                        >
                          {isAr ? 'تأكيد الرمز والمتابعة' : 'Verify & Continue'}
                        </button>
                      </form>
                    )}

                    {/* Step 3: Set New Password */}
                    {recoveryStep === 3 && (
                      <form onSubmit={handleSaveNewPassword} className="space-y-3">
                        <div>
                          <label className="block text-xs font-bold text-slate-700 mb-1">
                            {isAr ? 'الرقم السري الجديد' : 'New Password'}
                          </label>
                          <input
                            type={showNewPassword ? 'text' : 'password'}
                            required
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            placeholder="••••••••"
                            className="w-full px-4 py-2.5 bg-white border border-slate-200 focus:border-blue-600 rounded-xl text-sm font-medium outline-hidden"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-slate-700 mb-1">
                            {isAr ? 'تأكيد الرقم السري الجديد' : 'Confirm New Password'}
                          </label>
                          <input
                            type={showNewPassword ? 'text' : 'password'}
                            required
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            placeholder="••••••••"
                            className="w-full px-4 py-2.5 bg-white border border-slate-200 focus:border-blue-600 rounded-xl text-sm font-medium outline-hidden"
                          />
                        </div>

                        <button
                          type="submit"
                          className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md transition-all cursor-pointer"
                        >
                          {isAr ? 'حفظ وتحديث الرقم السري والدخول' : 'Save New Password & Login'}
                        </button>
                      </form>
                    )}
                  </div>
                )}
              </div>
          </div>

          {/* Direct Support & Branch Hotline Quick Info under card */}
          <div className="mt-6 flex flex-wrap items-center justify-center gap-y-2 gap-x-6 text-xs text-slate-500 font-medium">
            <div className="flex items-center gap-1.5">
              <Shield className="w-3.5 h-3.5 text-blue-600" />
              <span>{isAr ? 'تشفير بيانات 256-Bit SSL' : '256-Bit SSL Protection'}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Phone className="w-3.5 h-3.5 text-emerald-600" />
              <span>
                {isAr ? 'Saudi Hotline:' : 'Saudi Hotline:'}{' '}
                <a href="tel:+966548764412" className="text-slate-700 font-bold hover:text-blue-600" dir="ltr">
                  +966 54 876 4412
                </a>
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <Phone className="w-3.5 h-3.5 text-emerald-600" />
              <span>
                {isAr ? 'Egypt Hotline:' : 'Egypt Hotline:'}{' '}
                <a href="tel:+201063131831" className="text-slate-700 font-bold hover:text-blue-600" dir="ltr">
                  +20 10 63131 831
                </a>
              </span>
            </div>
          </div>
        </div>
      </main>

      {/* Modern Clean White Footer */}
      <footer className="relative z-10 bg-white border-t border-slate-200/80 px-4 sm:px-8 py-4">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-700">
              © {new Date().getFullYear()} {isAr ? 'شركة مصاعد التوأم' : 'Twins Elevators Co.'}
            </span>
            <span>•</span>
            <span>{isAr ? 'جميع الحقوق محفوظة' : 'All rights reserved'}</span>
          </div>

          <div className="flex items-center gap-4 text-[11px]">
            <span>{isAr ? 'معتمد وفق معايير الدفاع المدني والمواصفة EN81-20' : 'EN81-20 & Civil Defense Certified'}</span>
            <span>•</span>
            <a
              href="mailto:info@twins4tech.com"
              className="text-blue-600 hover:text-blue-800 font-bold hover:underline"
            >
              info@twins4tech.com
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
};
