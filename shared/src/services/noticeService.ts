import type { Notice } from '../types';
import { apiFetch } from './api';
import { demoDataStore } from './demoDataStore';
import { notificationService } from './notificationService';
import { firebaseService } from './firebaseService';
import { dataConfig } from './dataConfig';

export interface UserNoticeContext {
  id?: string;
  className?: string;
  section?: string;
  department?: string;
}

export const noticeService = {
  async getNotices(role?: string, context?: UserNoticeContext | string): Promise<Notice[]> {
    if (dataConfig.isFirebase()) {
      try {
        const firestoreList = await firebaseService.queryDocuments<Notice>('notices');
        if (firestoreList && firestoreList.length > 0) {
          const db = demoDataStore.getDB();
          db.notices = firestoreList;
          demoDataStore.saveDB(db);
          return firestoreList.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
        }
      } catch (e) {
        console.warn('[noticeService] Firestore getNotices error:', e);
      }
    }

    try {
      const params = new URLSearchParams();
      if (role) params.append('role', role);

      let ctxObj: UserNoticeContext = {};
      if (typeof context === 'string') {
        ctxObj = { className: context };
      } else if (context) {
        ctxObj = context;
      }

      if (ctxObj.id) params.append('userId', ctxObj.id);
      if (ctxObj.className) params.append('className', ctxObj.className);
      if (ctxObj.section) params.append('section', ctxObj.section);
      if (ctxObj.department) params.append('department', ctxObj.department);

      const queryString = params.toString() ? `?${params.toString()}` : '';
      const res = await apiFetch<any>(`/api/notices${queryString}`);
      if (res.success && res.data && res.data.length > 0) {
        return res.data;
      }
    } catch (e) {
      console.warn('noticeService.getNotices fallback:', e);
    }

    const db = demoDataStore.getDB();
    return db.notices || [];
  },

  async sendNotice(noticeData: Partial<Notice>): Promise<{ success: boolean; notice: Notice }> {
    const id = noticeData.id || `NOT-${Date.now().toString().slice(-4)}`;
    const newNotice: Notice = {
      id,
      title: noticeData.title || 'Untitled Notice',
      type: noticeData.type || noticeData.category as any || 'General',
      category: noticeData.type || noticeData.category || 'General',
      description: noticeData.description || '',
      recipients: noticeData.recipients || 'both',
      targetType: noticeData.targetType || 'all',
      targetClass: noticeData.targetClass || 'All',
      targetSection: noticeData.targetSection || 'All',
      targetDepartment: noticeData.targetDepartment || 'All',
      attachmentName: noticeData.attachmentName,
      attachmentUrl: noticeData.attachmentUrl || (noticeData as any).fileUrl,
      cloudinaryPublicId: (noticeData as any).cloudinaryPublicId || (noticeData as any).publicId,
      status: noticeData.status || 'Published',
      publishDate: noticeData.publishDate || new Date().toISOString().split('T')[0],
      publishTime: noticeData.publishTime || '10:30 AM',
      scheduledDate: noticeData.scheduledDate,
      scheduledTime: noticeData.scheduledTime,
      schoolId: 'AVM',
      createdAt: noticeData.createdAt || new Date().toISOString(),
      readBy: {}
    };

    if (dataConfig.isFirebase()) {
      try {
        await firebaseService.createDocument('notices', id, newNotice);
      } catch (e) {
        console.error('[noticeService] Firestore sendNotice error:', e);
        throw new Error('Failed to save notice to Firestore.');
      }
    }

    const db = demoDataStore.getDB();
    db.notices = db.notices || [];
    db.notices.unshift(newNotice);
    demoDataStore.saveDB(db);

    try {
      notificationService.notifyNoticePublished(newNotice.title, newNotice.description || '', newNotice.recipients || 'both', newNotice.targetClass);
    } catch (e) {}

    return { success: true, notice: newNotice };
  },

  async updateNotice(noticeId: string, noticeData: Partial<Notice>): Promise<{ success: boolean; notice?: Notice }> {
    if (dataConfig.isFirebase()) {
      try {
        await firebaseService.updateDocument('notices', noticeId, noticeData);
      } catch (e) {
        console.error('[noticeService] Firestore updateNotice error:', e);
      }
    }

    const db = demoDataStore.getDB();
    const notices = db.notices || [];
    const idx = notices.findIndex((n: any) => n.id === noticeId);
    if (idx !== -1) {
      notices[idx] = { ...notices[idx], ...noticeData, updatedAt: new Date().toISOString() };
      db.notices = notices;
      demoDataStore.saveDB(db);
      return { success: true, notice: notices[idx] };
    }

    return { success: true };
  },

  async archiveNotice(noticeIdOrObj: string | Notice): Promise<{ success: boolean }> {
    const noticeId = typeof noticeIdOrObj === 'string' ? noticeIdOrObj : noticeIdOrObj.id;
    return this.updateNotice(noticeId, { status: 'Archived' });
  },

  async markNoticeAsRead(noticeId: string, userId?: string): Promise<{ success: boolean }> {
    const uid = userId || 'user';
    const now = new Date().toISOString();
    if (dataConfig.isFirebase()) {
      try {
        await firebaseService.updateDocument('notices', noticeId, {
          [`readBy.${uid}`]: now
        });
      } catch (e) {}
    }
    const db = demoDataStore.getDB();
    const notice = (db.notices || []).find((n: any) => n.id === noticeId);
    if (notice) {
      notice.readBy = notice.readBy || {};
      notice.readBy[uid] = now;
      demoDataStore.saveDB(db);
    }
    return { success: true };
  },

  getNoticeReadStats(noticeIdOrObj: string | Notice | any) {
    const noticeId = typeof noticeIdOrObj === 'string' ? noticeIdOrObj : noticeIdOrObj?.id;
    const db = demoDataStore.getDB();
    const notice = (db.notices || []).find((n: any) => n.id === noticeId) || (typeof noticeIdOrObj === 'object' ? noticeIdOrObj : undefined);
    const readCount = notice && notice.readBy ? Object.keys(notice.readBy).length : 0;
    const totalTargetCount = 50;
    const totalEligible = 50;
    const unreadCount = Math.max(0, totalEligible - readCount);
    return { readCount, totalTargetCount, totalEligible, unreadCount };
  },

  async deleteNotice(noticeId: string): Promise<{ success: boolean }> {
    if (dataConfig.isFirebase()) {
      try {
        await firebaseService.deleteDocument('notices', noticeId);
      } catch (e) {
        console.error('[noticeService] Firestore deleteNotice error:', e);
      }
    }

    const db = demoDataStore.getDB();
    if (db.notices) {
      db.notices = db.notices.filter((n: any) => n.id !== noticeId);
      demoDataStore.saveDB(db);
    }
    return { success: true };
  }
};
