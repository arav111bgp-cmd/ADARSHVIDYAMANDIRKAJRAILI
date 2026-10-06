import { Preferences } from '@capacitor/preferences';
import type { UserRole, Student, Employee, SavedAccount } from '../types';
import { demoDataStore } from './demoDataStore';

const STORAGE_KEY_SAVED_ACCOUNTS = 'avm_saved_accounts_v1';
const STORAGE_KEY_ACTIVE_SESSION = 'avm_school_erp_session';

export const accountService = {
  // 1. Get list of saved accounts from Capacitor Preferences / localStorage
  async getSavedAccounts(): Promise<SavedAccount[]> {
    try {
      const prefRes = await Preferences.get({ key: STORAGE_KEY_SAVED_ACCOUNTS });
      let rawData = prefRes.value;

      if (!rawData) {
        rawData = localStorage.getItem(STORAGE_KEY_SAVED_ACCOUNTS);
      }

      if (rawData) {
        const parsed = JSON.parse(rawData);
        if (Array.isArray(parsed)) {
          return parsed;
        }
      }
    } catch (e) {
      console.warn('[ACCOUNT-SERVICE] Error reading saved accounts:', e);
    }
    return [];
  },

  // Helper to construct a SavedAccount object
  buildSavedAccountItem(role: UserRole, user: Student | Employee | any): SavedAccount {
    const rawUserId = user.admissionNo || user.employeeId || user.id || user.username || 'user';
    const accId = `${role}-${rawUserId}`.toLowerCase();

    let defaultName = 'User';
    if (role === 'student') defaultName = 'Student';
    else if (role === 'employee') defaultName = 'Employee';
    else if (role === 'admin') defaultName = 'School Administrator';

    let defaultDesignation = undefined;
    if (role === 'employee') defaultDesignation = 'Teacher';
    else if (role === 'admin') defaultDesignation = 'Administrator';

    return {
      id: accId,
      userId: rawUserId,
      role,
      name: user.name || defaultName,
      className: user.className || (user.section ? `Class ${user.section}` : undefined),
      section: user.section || undefined,
      admissionNo: user.admissionNo || (role === 'student' ? rawUserId : undefined),
      employeeId: user.employeeId || (role === 'employee' ? rawUserId : undefined),
      designation: user.designation || defaultDesignation,
      photo: user.photo || undefined,
      lastActiveTime: Date.now(),
      userObj: user
    };
  },

  // 2. Save an account into saved accounts list and make it active session
  async saveAccount(role: UserRole, user: Student | Employee | any): Promise<SavedAccount[]> {
    if (!role || !user) {
      return this.getSavedAccounts();
    }

    const newItem = this.buildSavedAccountItem(role, user);
    const existingList = await this.getSavedAccounts();

    // Filter out existing record if same account ID exists
    const filteredList = existingList.filter((acc) => acc.id !== newItem.id);

    // Prepend new item to list
    const updatedList = [newItem, ...filteredList];

    // Persist list
    await this.persistSavedAccounts(updatedList);

    // Set as active session
    await this.setActiveSession(role, user, newItem.id);

    return updatedList;
  },

  // Helper to persist list to Preferences & localStorage
  async persistSavedAccounts(list: SavedAccount[]): Promise<void> {
    const jsonStr = JSON.stringify(list);
    try {
      await Preferences.set({ key: STORAGE_KEY_SAVED_ACCOUNTS, value: jsonStr });
    } catch (_) {}
    try {
      localStorage.setItem(STORAGE_KEY_SAVED_ACCOUNTS, jsonStr);
    } catch (_) {}
  },

  // 3. Remove an account from this device (saved accounts list)
  async removeSavedAccount(accountId: string): Promise<{ accounts: SavedAccount[]; removedIsActive: boolean }> {
    const existingList = await this.getSavedAccounts();
    const updatedList = existingList.filter((acc) => acc.id !== accountId);

    await this.persistSavedAccounts(updatedList);

    // Check if the removed account is the active session
    const activeSession = this.getActiveSession();
    let removedIsActive = false;

    if (activeSession && activeSession.user) {
      const activeUserId = activeSession.user.admissionNo || activeSession.user.employeeId || activeSession.user.id || activeSession.user.username;
      const activeKey = `${activeSession.role}-${activeUserId}`.toLowerCase();
      if (activeKey === accountId || activeSession.accountKey === accountId) {
        removedIsActive = true;
      }
    }

    return { accounts: updatedList, removedIsActive };
  },

  // 4. Switch active session to a saved account
  async switchAccount(accountId: string): Promise<{ role: UserRole; user: any; accountKey: string } | null> {
    const savedList = await this.getSavedAccounts();
    const target = savedList.find((acc) => acc.id === accountId);

    if (!target) {
      return null;
    }

    // Try to get fresh live user object from demoDataStore or fall back to cached userObj
    let liveUser = target.userObj;
    try {
      const db = demoDataStore.getDB();
      if (target.role === 'student') {
        const studentId = target.admissionNo || target.userId;
        const freshStu = (db.students || []).find((s: any) => s.admissionNo === studentId || s.id === studentId || s.username === studentId);
        if (freshStu) {
          liveUser = { ...freshStu, role: 'student' };
        }
      } else if (target.role === 'employee') {
        const empId = target.employeeId || target.userId;
        const freshEmp = (db.employees || []).find((e: any) => e.employeeId === empId || e.id === empId || e.username === empId);
        if (freshEmp) {
          liveUser = { ...freshEmp, role: 'employee' };
        }
      } else if (target.role === 'admin') {
        liveUser = { name: 'Principal / Admin', username: 'admin', role: 'admin' };
      }
    } catch (_) {}

    // Update last active timestamp
    target.lastActiveTime = Date.now();
    target.userObj = liveUser;
    await this.persistSavedAccounts(savedList);

    // Set active session
    await this.setActiveSession(target.role, liveUser, target.id);

    return { role: target.role, user: liveUser, accountKey: target.id };
  },

  // 5. Get current active session
  getActiveSession(): { role: UserRole; user: any; accountKey?: string } | null {
    try {
      const raw = localStorage.getItem(STORAGE_KEY_ACTIVE_SESSION);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && parsed.role && parsed.user) {
          return parsed;
        }
      }
    } catch (e) {
      console.warn('[ACCOUNT-SERVICE] Error reading active session:', e);
    }
    return null;
  },

  // 6. Set active session
  async setActiveSession(role: UserRole, user: any, accountKey?: string): Promise<void> {
    const sessionObj = { role, user, accountKey };
    const jsonStr = JSON.stringify(sessionObj);
    try {
      localStorage.setItem(STORAGE_KEY_ACTIVE_SESSION, jsonStr);
    } catch (_) {}
    try {
      await Preferences.set({ key: STORAGE_KEY_ACTIVE_SESSION, value: jsonStr });
    } catch (_) {}
  },

  // 7. Clear active session (on Logout)
  async clearActiveSession(): Promise<void> {
    try {
      localStorage.removeItem(STORAGE_KEY_ACTIVE_SESSION);
    } catch (_) {}
    try {
      await Preferences.remove({ key: STORAGE_KEY_ACTIVE_SESSION });
    } catch (_) {}
  }
};
