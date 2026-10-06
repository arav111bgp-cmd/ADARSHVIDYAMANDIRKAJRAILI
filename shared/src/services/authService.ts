import type { Student, Employee, UserRole } from '../types';
import { apiFetch } from './api';
import { handleStandaloneDemoRequest } from './standaloneDemo';
import { firebaseService } from './firebaseService';

export interface AuthResult<T> {
  success: boolean;
  role?: UserRole;
  data?: T;
  provider?: 'demo' | 'firebase';
  error?: string;
}

export const authService = {
  /**
   * Universal Login Handler: Supports Demo Mode & Firebase Authentication
   */
  async loginUser(username: string, pass: string, role?: UserRole, forceProvider?: 'demo' | 'firebase'): Promise<AuthResult<any>> {
    const inputUser = (username || '').trim();
    const inputUserLower = inputUser.toLowerCase();
    const inputPass = (pass || '').trim();
    const requestedRole = (role || '').trim().toLowerCase();

    // 1. Firebase Authentication Path (if forceProvider === 'firebase' or if username is an email address)
    const isEmail = inputUser.includes('@') && inputUser.includes('.');
    if (forceProvider === 'firebase' || (isEmail && forceProvider !== 'demo')) {
      try {
        const userCred = await firebaseService.signInWithEmailAndPassword(inputUser, inputPass);
        if (userCred && userCred.user) {
          const fbUser = userCred.user;
          return {
            success: true,
            role: (requestedRole as UserRole) || 'employee',
            provider: 'firebase',
            data: {
              uid: fbUser.uid,
              email: fbUser.email,
              displayName: fbUser.displayName || inputUser.split('@')[0],
              photoURL: fbUser.photoURL,
              emailVerified: fbUser.emailVerified
            }
          };
        }
      } catch (fbErr: any) {
        console.warn('[AUTH] Firebase Auth attempt failed, checking demo credentials fallback:', fbErr);
        if (forceProvider === 'firebase') {
          return {
            success: false,
            error: fbErr?.message || 'Firebase authentication failed.'
          };
        }
      }
    }

    // 2. Direct Demo Admin authentication (admin / admin123)
    if (inputUserLower === 'admin' || requestedRole === 'admin') {
      if (inputPass === 'admin123' || inputPass === '123456') {
        const adminUser = { name: 'Principal / Admin', username: 'admin', role: 'admin' };
        return { success: true, role: 'admin', provider: 'demo', data: adminUser };
      } else {
        return { success: false, error: 'Invalid username or password' };
      }
    }

    // 3. Local Standalone Demo Engine check (Fast, persistent local store)
    try {
      const demoRes: any = handleStandaloneDemoRequest('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ username, password: pass, role })
      });
      if (demoRes && demoRes.success && demoRes.user) {
        return { success: true, role: demoRes.role || role || 'employee', provider: 'demo', data: demoRes.user };
      } else if (demoRes && demoRes.error && demoRes.error !== 'Invalid username or password') {
        return { success: false, error: demoRes.error };
      }
    } catch (e) {
      console.warn('[AUTH] Standalone demo auth check fallback:', e);
    }

    // 4. Fallback to network server if available
    try {
      const res = await apiFetch<any>('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ username, password: pass, role })
      });

      if (res && res.success && res.user && res.role) {
        return { success: true, role: res.role, provider: 'demo', data: res.user };
      } else {
        return { success: false, error: res?.error || 'Invalid username or password' };
      }
    } catch (e: any) {
      const errMsg = e?.data?.error || e?.message || 'Invalid username or password';
      return { success: false, error: errMsg };
    }
  },

  async loginStudent(admissionNo: string, pass: string): Promise<AuthResult<Student>> {
    return this.loginUser(admissionNo, pass, 'student');
  },

  async loginEmployee(employeeId: string, pass: string): Promise<AuthResult<Employee>> {
    return this.loginUser(employeeId, pass, 'employee');
  },

  async logout(): Promise<void> {
    try {
      await firebaseService.signOut();
    } catch (e) {}
  },

  async requestOTP(phoneOrId: string): Promise<AuthResult<{ message: string; otpSentTo: string }>> {
    return {
      success: true,
      data: {
        message: 'OTP sent successfully to registered mobile number.',
        otpSentTo: phoneOrId || '+91 98765 43210'
      }
    };
  },

  async verifyOTP(otp: string): Promise<AuthResult<boolean>> {
    if (otp === '1234' || otp.length === 4) {
      return { success: true, data: true };
    }
    return { success: false, error: 'Incorrect OTP. Try 1234 for demo.' };
  },

  async resetPassword(newPass: string): Promise<AuthResult<boolean>> {
    return { success: true, data: true };
  }
};
