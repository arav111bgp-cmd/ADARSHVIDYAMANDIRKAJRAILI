import React, { useState, useEffect } from 'react';
import type { UserRole, Student, Employee, SavedAccount } from '../types';
import { authService } from '../services/authService';
import { accountService } from '../services/accountService';
import { mockSchoolInfo } from '../mock/mockData';
import { Lock, User, CheckCircle, GraduationCap, Users, ChevronDown, Eye, EyeOff, ShieldAlert, ShieldCheck, X, ChevronRight, UserPlus, Trash2 } from 'lucide-react';
import { App as CapApp } from '@capacitor/app';

interface LoginScreenProps {
  onLoginSuccess: (role: UserRole, user: Student | Employee) => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ onLoginSuccess }) => {
  // Role selection state: 'student' | 'employee' | 'admin'
  const [selectedRole, setSelectedRole] = useState<'student' | 'employee' | 'admin'>('student');
  const [roleModalOpen, setRoleModalOpen] = useState(false);

  // Saved accounts state
  const [savedAccounts, setSavedAccounts] = useState<SavedAccount[]>([]);

  // Input states
  const [username, setUsername] = useState('rahul');
  const [password, setPassword] = useState('123456');
  const [showPassword, setShowPassword] = useState(false);

  // UI state
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Load saved accounts on mount
  useEffect(() => {
    accountService.getSavedAccounts().then((list) => {
      setSavedAccounts(list);
    });
  }, []);

  // Forgot password modal states
  const [forgotModalOpen, setForgotModalOpen] = useState(false);
  const [forgotStep, setForgotStep] = useState<1 | 2 | 3 | 4>(1);
  const [forgotInput, setForgotInput] = useState('');
  const [otpInput, setOtpInput] = useState('');
  const [newPass, setNewPass] = useState('');
  const [confirmPass, setConfirmPass] = useState('');
  const [otpMessage, setOtpMessage] = useState('');

  // Hardware Back Button listener on Login Screen
  useEffect(() => {
    let backListener: any;
    try {
      backListener = CapApp.addListener('backButton', () => {
        if (roleModalOpen) {
          setRoleModalOpen(false);
        } else if (forgotModalOpen) {
          setForgotModalOpen(false);
        } else {
          CapApp.exitApp();
        }
      });
    } catch (e) {
      console.log('Capacitor App listener not available in browser');
    }

    return () => {
      if (backListener) {
        backListener.then((h: any) => h?.remove());
      }
    };
  }, [roleModalOpen, forgotModalOpen]);

  const handleRoleSelect = (role: 'student' | 'employee' | 'admin') => {
    setSelectedRole(role);
    setRoleModalOpen(false);
    setErrorMsg('');
    if (role === 'student') {
      setUsername('rahul');
      setPassword('123456');
    } else if (role === 'employee') {
      setUsername('priya');
      setPassword('123456');
    } else if (role === 'admin') {
      setUsername('admin');
      setPassword('admin123');
    }
  };

  const handleQuickLogin = async (acc: SavedAccount) => {
    setLoading(true);
    setErrorMsg('');
    try {
      const res = await accountService.switchAccount(acc.id);
      if (res && res.role && res.user) {
        onLoginSuccess(res.role, res.user);
      } else {
        setErrorMsg('Unable to log into selected account');
      }
    } catch (err: any) {
      setErrorMsg('Error logging into saved account');
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    console.log('[AUTH-1] Sign in button pressed');
    console.log(`[AUTH-2] Role = ${selectedRole}`);
    console.log(`[AUTH-3] Username = ${username}`);

    setLoading(true);

    try {
      const res = await authService.loginUser(username, password, selectedRole);

      if (res.success && res.data && res.role) {
        await accountService.saveAccount(res.role, res.data);
        onLoginSuccess(res.role, res.data);
      } else {
        setErrorMsg(res.error || 'Invalid username or password');
      }
    } catch (err: any) {
      console.error('[AUTH-ERR] Exception in LoginScreen:', err);
      setErrorMsg(err?.message || 'Unable to connect to school server. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleRequestOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotInput.trim()) return;
    setLoading(true);
    const res = await authService.requestOTP(forgotInput);
    setLoading(false);
    if (res.success && res.data) {
      setOtpMessage(res.data.message);
      setForgotStep(2);
    }
  };

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const res = await authService.verifyOTP(otpInput);
    setLoading(false);
    if (res.success) {
      setForgotStep(3);
    } else {
      setErrorMsg(res.error || 'Invalid OTP');
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPass !== confirmPass) {
      setErrorMsg('Passwords do not match');
      return;
    }
    setLoading(true);
    await authService.resetPassword(newPass);
    setLoading(false);
    setForgotStep(4);
  };

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#F8FAFC',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'space-between',
      padding: '24px 20px',
      boxSizing: 'border-box'
    }}>
      <div>
        {/* Top Header & School Branding */}
        <div style={{ textAlign: 'center', marginTop: 16, marginBottom: 24 }}>
          {/* Logo Badge */}
          <div style={{
            width: 76,
            height: 76,
            borderRadius: 22,
            background: 'linear-gradient(135deg, #1769E0 0%, #1255B8 100%)',
            color: '#FFFFFF',
            fontWeight: 800,
            fontSize: 30,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 12px auto',
            boxShadow: '0 10px 25px rgba(23,105,224,0.25)',
            border: '4px solid #FFFFFF'
          }}>
            AVM
          </div>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: '#0F172A', letterSpacing: '-0.3px', margin: 0 }}>
            {mockSchoolInfo.name}
          </h1>
          <p style={{ fontSize: 12, color: '#64748B', fontWeight: 700, marginTop: 4, letterSpacing: '0.6px' }}>
            KAJRAILI • OFFICIAL MOBILE APP
          </p>
        </div>

        {/* Global Error Alert */}
        {errorMsg && (
          <div style={{
            backgroundColor: '#FEF2F2',
            color: '#DC2626',
            border: '1px solid #FCA5A5',
            borderRadius: 14,
            padding: '12px 16px',
            fontSize: 13,
            fontWeight: 600,
            marginBottom: 20,
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            boxShadow: '0 4px 12px rgba(220,38,38,0.06)'
          }}>
            <ShieldAlert size={18} style={{ flexShrink: 0 }} />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* SAVED ACCOUNTS QUICK SELECT (IF ANY) */}
        {savedAccounts.length > 0 && (
          <div className="avm-card" style={{ padding: '20px', borderRadius: 20, marginBottom: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <div>
                <h3 style={{ fontSize: 16, fontWeight: 800, color: '#0F172A', margin: 0 }}>
                  Saved Accounts
                </h3>
                <p style={{ fontSize: 12, color: '#64748B', margin: '2px 0 0 0' }}>
                  Tap to log in instantly
                </p>
              </div>
              <span style={{ fontSize: 11, fontWeight: 700, backgroundColor: '#EFF6FF', color: '#1769E0', padding: '4px 8px', borderRadius: 10 }}>
                {savedAccounts.length} Saved
              </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {savedAccounts.map((acc) => (
                <div
                  key={acc.id}
                  onClick={() => handleQuickLogin(acc)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '12px 14px',
                    borderRadius: 14,
                    border: '1.5px solid #E2E8F0',
                    backgroundColor: '#F8FAFC',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, overflow: 'hidden' }}>
                    <img
                      src={acc.photo || (acc.role === 'student' ? 'https://images.unsplash.com/photo-1544717305-2782549b5136?w=150' : acc.role === 'admin' ? 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150' : 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150')}
                      alt={acc.name}
                      style={{
                        width: 44,
                        height: 44,
                        borderRadius: '50%',
                        objectFit: 'cover',
                        border: `2px solid ${acc.role === 'student' ? '#1769E0' : acc.role === 'admin' ? '#6366F1' : '#0D9488'}`,
                        flexShrink: 0
                      }}
                    />
                    <div style={{ overflow: 'hidden' }}>
                      <div style={{ fontSize: 14, fontWeight: 800, color: '#0F172A', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
                        {acc.name}
                      </div>
                      <div style={{ fontSize: 12, fontWeight: 700, color: acc.role === 'student' ? '#1769E0' : acc.role === 'admin' ? '#6366F1' : '#0D9488', marginTop: 1 }}>
                        {acc.role === 'student'
                          ? `Student • ${acc.className || 'Class 5'}${acc.section ? '-' + acc.section : ''}`
                          : acc.role === 'admin'
                          ? `🛡️ Admin • Administrator`
                          : `Employee • ${acc.designation || 'Teacher'}`}
                      </div>
                      <div style={{ fontSize: 11, color: '#64748B', marginTop: 1 }}>
                        {acc.role === 'student'
                          ? (acc.admissionNo || acc.userId)
                          : (acc.employeeId || acc.userId)}
                      </div>
                    </div>
                  </div>
                  <ChevronRight size={18} color="#94A3B8" style={{ flexShrink: 0 }} />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* MAIN LOGIN CARD */}
        <div className="avm-card" style={{ padding: '24px 20px', borderRadius: 20 }}>
          <div style={{ marginBottom: 20 }}>
            <h2 style={{ fontSize: 22, fontWeight: 800, color: '#0F172A', margin: 0 }}>
              Sign In
            </h2>
            <p style={{ fontSize: 13, color: '#64748B', marginTop: 4, marginBottom: 0 }}>
              Access your school account
            </p>
          </div>

          <form onSubmit={handleLogin}>
            {/* LOGIN AS DROPDOWN SELECTOR */}
            <div style={{ marginBottom: 18 }}>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#475569', marginBottom: 6 }}>
                Login As
              </label>
              <div
                onClick={() => setRoleModalOpen(true)}
                style={{
                  backgroundColor: '#F8FAFC',
                  border: '1.5px solid #E2E8F0',
                  borderRadius: 14,
                  padding: '12px 16px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  {selectedRole === 'student' ? (
                    <GraduationCap size={20} color="#1769E0" />
                  ) : selectedRole === 'admin' ? (
                    <ShieldCheck size={20} color="#6366F1" />
                  ) : (
                    <Users size={20} color="#0D9488" />
                  )}
                  <span style={{ fontSize: 14, fontWeight: 700, color: '#0F172A' }}>
                    {selectedRole === 'student' ? 'Student' : selectedRole === 'admin' ? '🛡️ Admin (School Administrator)' : 'Employee / Teacher'}
                  </span>
                </div>
                <ChevronDown size={18} color="#64748B" />
              </div>
            </div>

            {/* DYNAMIC USER ID FIELD */}
            <div style={{ marginBottom: 18 }}>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#475569', marginBottom: 6 }}>
                {selectedRole === 'student'
                  ? 'Admission Number / Student Name'
                  : selectedRole === 'admin'
                  ? 'Admin ID / Username'
                  : 'Employee ID or Employee Name'}
              </label>
              <div style={{ position: 'relative' }}>
                <User size={18} style={{ position: 'absolute', left: 14, top: 13, color: '#94A3B8' }} />
                <input
                  type="text"
                  className="avm-input"
                  style={{ paddingLeft: 42, borderRadius: 12, fontSize: 14 }}
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder={
                    selectedRole === 'student'
                      ? 'e.g. AVM2026157 or Rahul Kumar'
                      : selectedRole === 'admin'
                      ? 'e.g. admin'
                      : 'e.g. EMP2026001 or Priya Sharma'
                  }
                  required
                />
              </div>
            </div>

            {/* PASSWORD FIELD WITH SHOW/HIDE TOGGLE */}
            <div style={{ marginBottom: 14 }}>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#475569', marginBottom: 6 }}>
                Password
              </label>
              <div style={{ position: 'relative' }}>
                <Lock size={18} style={{ position: 'absolute', left: 14, top: 13, color: '#94A3B8' }} />
                <input
                  type={showPassword ? 'text' : 'password'}
                  className="avm-input"
                  style={{ paddingLeft: 42, paddingRight: 42, borderRadius: 12, fontSize: 14 }}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: 'absolute',
                    right: 14,
                    top: 13,
                    background: 'none',
                    border: 'none',
                    color: '#94A3B8',
                    cursor: 'pointer',
                    padding: 0
                  }}
                  aria-label="Toggle password visibility"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {/* FORGOT PASSWORD LINK */}
            <div style={{ textAlign: 'right', marginBottom: 24 }}>
              <button
                type="button"
                onClick={() => { setForgotModalOpen(true); setForgotStep(1); setErrorMsg(''); }}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#1769E0',
                  fontWeight: 600,
                  fontSize: 13,
                  cursor: 'pointer'
                }}
              >
                Forgot Password?
              </button>
            </div>

            {/* SUBMIT BUTTON */}
            <button
              type="submit"
              disabled={loading}
              className="avm-btn-primary"
              style={{ width: '100%', padding: '14px', fontSize: 16, borderRadius: 14, fontWeight: 700 }}
            >
              {loading ? 'Authenticating...' : 'Sign In'}
            </button>
          </form>
        </div>
      </div>

      {/* FOOTER & TERMS */}
      <div style={{ textAlign: 'center', marginTop: 24, paddingBottom: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, marginBottom: 6, color: '#64748B', fontSize: 12, fontWeight: 600 }}>
          <ShieldCheck size={16} color="#16A34A" />
          <span>Secure Login</span>
        </div>
        <p style={{ fontSize: 12, color: '#94A3B8', fontWeight: 600, margin: 0 }}>
          Adarsh Vidya Mandir • Kajraili
        </p>
        <div style={{ marginTop: 8, fontSize: 11, color: '#94A3B8' }}>
          <span>Privacy Policy</span> • <span>Terms of Service</span>
        </div>
      </div>

      {/* LOGIN AS DROPDOWN MODAL / BOTTOM SHEET */}
      {roleModalOpen && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(15,23,42,0.6)',
          display: 'flex',
          alignItems: 'flex-end',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div className="animate-fade-in" style={{
            backgroundColor: '#FFFFFF',
            borderTopLeftRadius: 24,
            borderTopRightRadius: 24,
            padding: '24px 20px',
            width: '100%',
            maxWidth: 480,
            boxShadow: '0 -10px 40px rgba(0,0,0,0.2)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
              <h3 style={{ fontSize: 18, fontWeight: 800, color: '#0F172A', margin: 0 }}>
                Select Account Type
              </h3>
              <button
                onClick={() => setRoleModalOpen(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748B' }}
              >
                <X size={20} />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 20 }}>
              {/* STUDENT OPTION */}
              <div
                onClick={() => handleRoleSelect('student')}
                style={{
                  padding: 16,
                  borderRadius: 16,
                  border: selectedRole === 'student' ? '2px solid #1769E0' : '1.5px solid #E2E8F0',
                  backgroundColor: selectedRole === 'student' ? '#EFF6FF' : '#FFFFFF',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 14
                }}
              >
                <div style={{
                  width: 44,
                  height: 44,
                  borderRadius: 12,
                  backgroundColor: '#DBEAFE',
                  color: '#1769E0',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}>
                  <GraduationCap size={24} />
                </div>
                <div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: '#0F172A' }}>Student</div>
                  <div style={{ fontSize: 12, color: '#64748B' }}>Access your student account</div>
                </div>
              </div>

              {/* EMPLOYEE / TEACHER OPTION */}
              <div
                onClick={() => handleRoleSelect('employee')}
                style={{
                  padding: 16,
                  borderRadius: 16,
                  border: selectedRole === 'employee' ? '2px solid #0D9488' : '1.5px solid #E2E8F0',
                  backgroundColor: selectedRole === 'employee' ? '#F0FDFA' : '#FFFFFF',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 14
                }}
              >
                <div style={{
                  width: 44,
                  height: 44,
                  borderRadius: 12,
                  backgroundColor: '#CCFBF1',
                  color: '#0D9488',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}>
                  <Users size={22} />
                </div>
                <div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: '#0F172A' }}>Employee / Teacher</div>
                  <div style={{ fontSize: 12, color: '#64748B' }}>Access your employee account</div>
                </div>
              </div>

              {/* ADMIN OPTION */}
              <div
                onClick={() => handleRoleSelect('admin')}
                style={{
                  padding: 16,
                  borderRadius: 16,
                  border: selectedRole === 'admin' ? '2px solid #6366F1' : '1.5px solid #E2E8F0',
                  backgroundColor: selectedRole === 'admin' ? '#EEF2FF' : '#FFFFFF',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 14
                }}
              >
                <div style={{
                  width: 44,
                  height: 44,
                  borderRadius: 12,
                  backgroundColor: '#E0E7FF',
                  color: '#6366F1',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}>
                  <ShieldCheck size={22} />
                </div>
                <div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: '#0F172A' }}>🛡️ Admin</div>
                  <div style={{ fontSize: 12, color: '#64748B' }}>School Administrator / Principal</div>
                </div>
              </div>
            </div>

            <button
              onClick={() => setRoleModalOpen(false)}
              className="avm-btn-secondary"
              style={{ width: '100%', padding: '12px', borderRadius: 14 }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* FORGOT PASSWORD MODAL */}
      {forgotModalOpen && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(15,23,42,0.6)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 20,
          zIndex: 1000
        }}>
          <div className="animate-fade-in" style={{
            backgroundColor: '#FFFFFF',
            borderRadius: 20,
            padding: 24,
            width: '100%',
            maxWidth: 400,
            boxShadow: '0 20px 40px rgba(0,0,0,0.2)'
          }}>
            {forgotStep === 1 && (
              <form onSubmit={handleRequestOTP}>
                <h3 style={{ fontSize: 18, fontWeight: 700, color: '#172033', marginBottom: 8 }}>
                  Reset Password
                </h3>
                <p style={{ fontSize: 13, color: '#667085', marginBottom: 16 }}>
                  Enter your registered Mobile Number, Admission No, or Employee ID.
                </p>
                <div style={{ marginBottom: 16 }}>
                  <input
                    type="text"
                    className="avm-input"
                    placeholder="Mobile / Admission No / Employee ID"
                    value={forgotInput}
                    onChange={(e) => setForgotInput(e.target.value)}
                    required
                  />
                </div>
                <div style={{ display: 'flex', gap: 10 }}>
                  <button type="button" className="avm-btn-secondary" style={{ flex: 1 }} onClick={() => setForgotModalOpen(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="avm-btn-primary" style={{ flex: 1 }}>
                    Send OTP
                  </button>
                </div>
              </form>
            )}

            {forgotStep === 2 && (
              <form onSubmit={handleVerifyOTP}>
                <h3 style={{ fontSize: 18, fontWeight: 700, color: '#172033', marginBottom: 8 }}>
                  Enter OTP
                </h3>
                <p style={{ fontSize: 13, color: '#667085', marginBottom: 16 }}>
                  {otpMessage || 'We have sent a 4-digit OTP to your registered mobile number.'}
                </p>
                <div style={{ marginBottom: 16 }}>
                  <input
                    type="text"
                    className="avm-input"
                    placeholder="Enter 4-digit OTP"
                    value={otpInput}
                    onChange={(e) => setOtpInput(e.target.value)}
                    maxLength={4}
                    required
                    style={{ textAlign: 'center', letterSpacing: 8, fontSize: 18, fontWeight: 700 }}
                  />
                </div>
                <div style={{ display: 'flex', gap: 10 }}>
                  <button type="button" className="avm-btn-secondary" style={{ flex: 1 }} onClick={() => setForgotStep(1)}>
                    Back
                  </button>
                  <button type="submit" className="avm-btn-primary" style={{ flex: 1 }}>
                    Verify OTP
                  </button>
                </div>
              </form>
            )}

            {forgotStep === 3 && (
              <form onSubmit={handleResetPassword}>
                <h3 style={{ fontSize: 18, fontWeight: 700, color: '#172033', marginBottom: 8 }}>
                  Create New Password
                </h3>
                <div style={{ marginBottom: 12 }}>
                  <input
                    type="password"
                    className="avm-input"
                    placeholder="New Password"
                    value={newPass}
                    onChange={(e) => setNewPass(e.target.value)}
                    required
                  />
                </div>
                <div style={{ marginBottom: 16 }}>
                  <input
                    type="password"
                    className="avm-input"
                    placeholder="Confirm New Password"
                    value={confirmPass}
                    onChange={(e) => setConfirmPass(e.target.value)}
                    required
                  />
                </div>
                <button type="submit" className="avm-btn-primary" style={{ width: '100%' }}>
                  Update Password
                </button>
              </form>
            )}

            {forgotStep === 4 && (
              <div style={{ textAlign: 'center', padding: '10px 0' }}>
                <CheckCircle size={48} color="#16A34A" style={{ margin: '0 auto 12px auto' }} />
                <h3 style={{ fontSize: 18, fontWeight: 700, color: '#172033', marginBottom: 8 }}>
                  Password Updated!
                </h3>
                <p style={{ fontSize: 13, color: '#667085', marginBottom: 16 }}>
                  Your password has been reset successfully. You can now login with your new password.
                </p>
                <button
                  className="avm-btn-primary"
                  style={{ width: '100%' }}
                  onClick={() => setForgotModalOpen(false)}
                >
                  Back to Login
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};


