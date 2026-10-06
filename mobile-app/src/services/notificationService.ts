import { LocalNotifications } from '@capacitor/local-notifications';
import { Capacitor } from '@capacitor/core';
import { permissionService } from './permissionService';
import { demoDataStore } from './demoDataStore';
import { NotificationItem, NotificationTemplate } from '../types';

export interface AppNotificationPayload {
  title: string;
  body: string;
  screen?: string; // 'homework' | 'attendance' | 'results' | 'notices' | 'exams' | 'fees'
  id?: number;
}

export const notificationService = {
  async init(onNotificationClick?: (screen: string) => void) {
    if (!Capacitor.isNativePlatform()) return;

    try {
      LocalNotifications.addListener('localNotificationActionPerformed', (action) => {
        const targetScreen = action.notification.extra?.screen || 'notices';
        console.log(`[NOTIFICATION CLICK] Navigating to target screen: ${targetScreen}`);
        if (onNotificationClick) {
          onNotificationClick(targetScreen);
        }
      });
    } catch (e) {
      console.warn('LocalNotifications listener error:', e);
    }
  },

  async triggerNotification(payload: AppNotificationPayload) {
    if (!Capacitor.isNativePlatform()) {
      console.log(`[WEB NOTIFICATION] ${payload.title}: ${payload.body}`);
      return;
    }

    try {
      const perm = await permissionService.checkNotificationPermission();
      if (!perm.granted) {
        const req = await permissionService.requestNotificationPermission();
        if (!req.granted) {
          console.warn('[NOTIFICATION] Permission denied by user');
          return;
        }
      }

      const notifId = payload.id || Math.floor(Math.random() * 100000);
      await LocalNotifications.schedule({
        notifications: [
          {
            title: payload.title,
            body: payload.body,
            id: notifId,
            schedule: { at: new Date(Date.now() + 500) },
            sound: 'default',
            smallIcon: 'ic_launcher',
            extra: {
              screen: payload.screen || 'notices'
            }
          }
        ]
      });
    } catch (e) {
      console.warn('Failed to schedule local notification:', e);
    }
  },

  // Centralized Read/Write Operations
  getAllNotifications(): NotificationItem[] {
    const db = demoDataStore.getDB();
    return (db.notifications || []).map((n: any) => ({
      ...n,
      isRead: n.unreadCount === 0 || (n.recipients && n.recipients.every((r: any) => r.readStatus === 'Read'))
    }));
  },

  getNotificationsForStudent(studentId?: string, className?: string, section?: string): NotificationItem[] {
    const all = this.getAllNotifications();
    return all.filter((n) => {
      if (n.audienceType === 'employees') return false;
      if (n.targetAudience === 'All Students' || n.audienceType === 'both') return true;
      if (n.targetAudience === 'Individual Student' && n.targetStudentId === studentId) return true;
      if (n.targetAudience === 'Class' || n.targetAudience === 'Section') {
        if (!n.targetClass) return true;
        const normTarget = (n.targetClass || '').toLowerCase().replace(/class\s*/i, '').trim();
        const normUserClass = (className || 'Class 5').toLowerCase().replace(/class\s*/i, '').trim();
        const matchClass = normTarget === normUserClass || (n.targetClass || '').toLowerCase() === (className || '').toLowerCase();
        if (matchClass) {
          if (n.targetSection && n.targetSection !== 'All') {
            return (n.targetSection || '').toUpperCase() === (section || 'A').toUpperCase();
          }
          return true;
        }
      }
      return false;
    });
  },

  getNotificationsForEmployee(employeeId?: string, designation?: string): NotificationItem[] {
    const all = this.getAllNotifications();
    return all.filter((n) => {
      if (n.audienceType === 'students') return false;
      if (n.targetAudience === 'All Employees' || n.audienceType === 'both') return true;
      if (n.targetAudience === 'Teachers' && (designation || 'Teacher').toLowerCase().includes('teacher')) return true;
      if (n.targetAudience === 'Non-Teaching Staff' && !(designation || '').toLowerCase().includes('teacher')) return true;
      if (n.targetAudience === 'Individual Employee' && n.targetEmployeeId === employeeId) return true;
      return false;
    });
  },

  sendNotification(data: Partial<NotificationItem>): NotificationItem {
    const db = demoDataStore.getDB();
    db.notifications = db.notifications || [];

    const nowStr = new Date().toLocaleString('en-US', {
      year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit', hour12: true
    });

    const newId = `NFT-${Date.now().toString().slice(-6)}`;
    const recipients = data.recipients || [];
    const recipientCount = data.recipientCount ?? (recipients.length || 50);
    const readCount = data.readCount ?? 0;
    const unreadCount = data.unreadCount ?? recipientCount;

    const newNotif: NotificationItem = {
      id: newId,
      title: data.title || 'Untitled Notification',
      message: data.message || '',
      type: data.type || 'General',
      priority: data.priority || 'Normal',
      senderName: data.senderName || 'Admin Desk',
      senderId: data.senderId || 'ADMIN-001',
      audienceType: data.audienceType || 'students',
      targetAudience: data.targetAudience || 'All Students',
      targetClass: data.targetClass,
      targetSection: data.targetSection,
      targetStudentId: data.targetStudentId,
      targetStudentName: data.targetStudentName,
      targetEmployeeId: data.targetEmployeeId,
      targetEmployeeName: data.targetEmployeeName,
      attachmentName: data.attachmentName,
      actionUrl: data.actionUrl,
      channels: data.channels || ['in_app', 'push'],
      status: data.status || 'Sent',
      scheduledAt: data.scheduledAt,
      sentAt: data.sentAt || nowStr,
      createdAt: nowStr,
      recipientCount,
      deliveredCount: recipientCount,
      readCount,
      unreadCount,
      recipients: recipients.length > 0 ? recipients : [
        { id: 'STU-157', name: 'Aarav Kumar', roleOrClass: 'Class 5-A', deliveryStatus: 'Delivered', readStatus: 'Unread' },
        { id: 'STU-158', name: 'Ananya Sharma', roleOrClass: 'Class 5-A', deliveryStatus: 'Delivered', readStatus: 'Unread' }
      ]
    };

    db.notifications.unshift(newNotif);
    demoDataStore.saveDB(db);

    // Trigger local push notification on native platform
    this.triggerNotification({
      title: newNotif.title,
      body: newNotif.message,
      screen: newNotif.type.toLowerCase()
    });

    return newNotif;
  },

  markAsRead(id: string): void {
    const db = demoDataStore.getDB();
    if (!db.notifications) return;
    const notif = db.notifications.find((n: any) => n.id === id);
    if (notif) {
      if (notif.unreadCount && notif.unreadCount > 0) {
        notif.unreadCount = Math.max(0, notif.unreadCount - 1);
        notif.readCount = (notif.readCount || 0) + 1;
      }
      if (Array.isArray(notif.recipients)) {
        notif.recipients.forEach((r: any) => {
          r.readStatus = 'Read';
          r.readAt = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        });
      }
      demoDataStore.saveDB(db);
    }
  },

  markAllAsRead(): void {
    const db = demoDataStore.getDB();
    if (!db.notifications) return;
    db.notifications.forEach((n: any) => {
      n.readCount = n.recipientCount || 10;
      n.unreadCount = 0;
      if (Array.isArray(n.recipients)) {
        n.recipients.forEach((r: any) => { r.readStatus = 'Read'; });
      }
    });
    demoDataStore.saveDB(db);
  },

  deleteNotification(id: string): void {
    const db = demoDataStore.getDB();
    if (!db.notifications) return;
    db.notifications = db.notifications.filter((n: any) => n.id !== id);
    demoDataStore.saveDB(db);
  },

  bulkDeleteNotifications(ids: string[]): void {
    const db = demoDataStore.getDB();
    if (!db.notifications) return;
    db.notifications = db.notifications.filter((n: any) => !ids.includes(n.id));
    demoDataStore.saveDB(db);
  },

  bulkMarkAsRead(ids: string[]): void {
    const db = demoDataStore.getDB();
    if (!db.notifications) return;
    db.notifications.forEach((n: any) => {
      if (ids.includes(n.id)) {
        n.readCount = n.recipientCount || 10;
        n.unreadCount = 0;
        if (Array.isArray(n.recipients)) {
          n.recipients.forEach((r: any) => { r.readStatus = 'Read'; });
        }
      }
    });
    demoDataStore.saveDB(db);
  },

  // Templates CRUD
  getTemplates(): NotificationTemplate[] {
    const db = demoDataStore.getDB();
    return db.notificationTemplates || [];
  },

  saveTemplate(tpl: Partial<NotificationTemplate>): NotificationTemplate {
    const db = demoDataStore.getDB();
    db.notificationTemplates = db.notificationTemplates || [];
    const newTpl: NotificationTemplate = {
      id: tpl.id || `TMP-${Date.now().toString().slice(-5)}`,
      name: tpl.name || 'Untitled Template',
      type: tpl.type || 'General',
      title: tpl.title || '',
      message: tpl.message || '',
      createdAt: tpl.createdAt || new Date().toISOString().split('T')[0]
    };
    const idx = db.notificationTemplates.findIndex((t: any) => t.id === newTpl.id);
    if (idx !== -1) {
      db.notificationTemplates[idx] = newTpl;
    } else {
      db.notificationTemplates.unshift(newTpl);
    }
    demoDataStore.saveDB(db);
    return newTpl;
  },

  deleteTemplate(id: string): void {
    const db = demoDataStore.getDB();
    if (!db.notificationTemplates) return;
    db.notificationTemplates = db.notificationTemplates.filter((t: any) => t.id !== id);
    demoDataStore.saveDB(db);
  },

  // --- AUTOMATIC SYSTEM NOTIFICATION TRIGGER HELPERS ---
  notifyHomeworkCreated(className: string, section: string, subject: string, title: string) {
    this.sendNotification({
      title: `🔔 Homework Assigned: ${subject}`,
      message: `${title} has been assigned for ${className}-${section}. Please check your homework tab for details.`,
      type: 'Homework',
      priority: 'Normal',
      senderName: 'Academic Teacher',
      audienceType: 'students',
      targetAudience: 'Class',
      targetClass: className,
      targetSection: section,
      status: 'Sent'
    });
  },

  notifyAttendanceAbsent(studentId: string, studentName: string, className: string, section: string, date: string) {
    this.sendNotification({
      title: `⚠️ Absence Notice: ${studentName}`,
      message: `${studentName} was marked ABSENT today (${date}) in ${className}-${section}. Please contact school office if unauthorized.`,
      type: 'Attendance',
      priority: 'High',
      senderName: 'Attendance Monitor',
      audienceType: 'students',
      targetAudience: 'Individual Student',
      targetStudentId: studentId,
      targetStudentName: studentName,
      status: 'Sent'
    });
  },

  notifyFeeUpdated(studentId: string, studentName: string, className: string, amount: number) {
    this.sendNotification({
      title: `💳 School Fee Record Updated`,
      message: `Fee record for ${studentName} (${className}) has been updated. Total due amount: ₹${amount.toLocaleString('en-IN')}.`,
      type: 'Fee',
      priority: 'High',
      senderName: 'Accounts Office',
      audienceType: 'students',
      targetAudience: 'Individual Student',
      targetStudentId: studentId,
      targetStudentName: studentName,
      status: 'Sent'
    });
  },

  notifyExamCreated(examName: string, classes: string[]) {
    this.sendNotification({
      title: `📝 New Examination Scheduled: ${examName}`,
      message: `${examName} has been scheduled for classes ${classes.join(', ')}. Review datesheet on student portal.`,
      type: 'Exam',
      priority: 'High',
      senderName: 'Exam Cell',
      audienceType: 'students',
      targetAudience: 'All Students',
      status: 'Sent'
    });
  },

  notifyResultPublished(examName: string, className: string) {
    this.sendNotification({
      title: `🏆 Result Published: ${examName}`,
      message: `Results for ${examName} (${className}) are now published. Access student report card on the portal.`,
      type: 'Result',
      priority: 'High',
      senderName: 'Exam Cell',
      audienceType: 'students',
      targetAudience: 'All Students',
      targetClass: className,
      status: 'Sent'
    });
  },

  notifyNoticePublished(noticeTitle: string, description: string, recipients: string, targetClass?: string) {
    this.sendNotification({
      title: `📢 Notice: ${noticeTitle}`,
      message: description.length > 120 ? `${description.slice(0, 117)}...` : description,
      type: 'Notice',
      priority: 'High',
      senderName: 'Principal Office',
      audienceType: recipients === 'teachers' || recipients === 'staff' ? 'employees' : recipients === 'both' ? 'both' : 'students',
      targetAudience: targetClass && targetClass !== 'All' ? 'Class' : 'All Students',
      targetClass,
      status: 'Sent'
    });
  },

  notifyTransportAssigned(studentName: string, busNo: string, routeName: string) {
    this.sendNotification({
      title: `🚌 School Bus Assignment Update`,
      message: `${studentName} has been assigned to ${busNo} on ${routeName}. Track route details in Transport module.`,
      type: 'Transport',
      priority: 'Normal',
      senderName: 'Transport Desk',
      audienceType: 'students',
      targetAudience: 'All Students',
      status: 'Sent'
    });
  },

  notifyTimetableUpdated(className: string) {
    this.sendNotification({
      title: `📅 Timetable Updated: ${className}`,
      message: `Class timetable for ${className} has been updated. Check daily period slots on portal.`,
      type: 'Timetable',
      priority: 'Normal',
      senderName: 'Academic Desk',
      audienceType: 'both',
      targetAudience: 'All Students',
      targetClass: className,
      status: 'Sent'
    });
  }
};

