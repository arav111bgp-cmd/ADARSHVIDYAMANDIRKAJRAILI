import type { Homework } from '../types';
import { apiFetch } from './api';
import { demoDataStore } from './demoDataStore';
import { notificationService } from './notificationService';
import { firebaseService } from './firebaseService';
import { dataConfig } from './dataConfig';

function matchesClassAndSection(hwClass: string, hwSection: string, filterClass?: string, filterSection?: string): boolean {
  if (!filterClass || filterClass === 'All') return true;
  const normHWClass = (hwClass || '').trim().toLowerCase();
  const normFilterClass = filterClass.trim().toLowerCase();

  const hwFull = normHWClass.includes('-') ? normHWClass : `${normHWClass}-${(hwSection || 'a').toLowerCase()}`;
  const filterFull = normFilterClass.includes('-') ? normFilterClass : `${normFilterClass}-${(filterSection || 'a').toLowerCase()}`;

  if (hwFull === filterFull) return true;
  
  const normGradeHW = normHWClass.replace(/^class\s*/i, '').replace(/-[a-z]$/i, '').trim();
  const normGradeFilter = normFilterClass.replace(/^class\s*/i, '').replace(/-[a-z]$/i, '').trim();
  
  const matchGrade = normGradeHW === normGradeFilter || normHWClass === normFilterClass;
  const matchSection = !filterSection || filterSection === 'All' || (hwSection || 'A').toLowerCase() === filterSection.toLowerCase();

  return matchGrade && matchSection;
}

export const homeworkService = {
  async getHomework(className?: string, section?: string, subject?: string, teacherId?: string): Promise<Homework[]> {
    if (dataConfig.isFirebase()) {
      try {
        const firestoreList = await firebaseService.queryDocuments<Homework>('homework');
        if (firestoreList && firestoreList.length > 0) {
          let filtered = firestoreList;
          if (className && className !== 'All') {
            filtered = filtered.filter((hw) => matchesClassAndSection(hw.className, hw.section, className, section));
          }
          if (subject && subject !== 'All') {
            const normSubj = subject.trim().toLowerCase();
            filtered = filtered.filter((hw) => (hw.subject || '').trim().toLowerCase() === normSubj);
          }
          if (teacherId) {
            const normT = teacherId.trim().toLowerCase();
            filtered = filtered.filter((hw) => (hw.teacherId && hw.teacherId.trim().toLowerCase() === normT) || (hw.createdByEmployeeId && hw.createdByEmployeeId.trim().toLowerCase() === normT));
          }
          return filtered.sort((a, b) => (b.homeworkDate || b.assignedDate || '').localeCompare(a.homeworkDate || a.assignedDate || ''));
        }
      } catch (e) {
        console.warn('[homeworkService] Firestore getHomework error:', e);
      }
    }

    try {
      const params = new URLSearchParams();
      if (className && className !== 'All') params.append('className', className);
      if (section && section !== 'All') params.append('section', section);
      if (subject && subject !== 'All') params.append('subject', subject);
      if (teacherId) params.append('teacherId', teacherId);

      const queryString = params.toString() ? `?${params.toString()}` : '';
      const res = await apiFetch<any>(`/api/homework${queryString}`);
      if (res.success && res.data && res.data.length > 0) {
        return res.data;
      }
    } catch (e) {
      console.warn('homeworkService.getHomework fallback to demoDataStore:', e);
    }

    const db = demoDataStore.getDB();
    let list: Homework[] = db.homework || [];

    if (className && className !== 'All') {
      list = list.filter((hw) => matchesClassAndSection(hw.className, hw.section, className, section));
    }

    if (subject && subject !== 'All') {
      const normSubj = subject.trim().toLowerCase();
      list = list.filter((hw) => (hw.subject || '').trim().toLowerCase() === normSubj);
    }

    if (teacherId) {
      const normT = teacherId.trim().toLowerCase();
      list = list.filter((hw) => (hw.teacherId && hw.teacherId.trim().toLowerCase() === normT) || (hw.createdByEmployeeId && hw.createdByEmployeeId.trim().toLowerCase() === normT));
    }

    return list.sort((a, b) => (b.homeworkDate || b.assignedDate || '').localeCompare(a.homeworkDate || a.assignedDate || ''));
  },

  async uploadHomework(homeworkData: Partial<Homework>): Promise<{ success: boolean; id: string; homework: Homework }> {
    const db = demoDataStore.getDB();
    db.homework = db.homework || [];

    const todayStr = new Date().toISOString().split('T')[0];
    const id = homeworkData.id || `HW-${new Date().getFullYear()}-${Date.now().toString().slice(-4)}`;

    const newHomework: Homework = {
      id,
      title: homeworkData.title || 'Homework Assignment',
      description: homeworkData.description || homeworkData.instructions || '',
      instructions: homeworkData.instructions || homeworkData.description || '',
      subject: homeworkData.subject || 'General',
      subjectId: homeworkData.subjectId,
      className: homeworkData.className || 'Class 5-A',
      section: homeworkData.section || 'A',
      assignedDate: homeworkData.assignedDate || homeworkData.homeworkDate || todayStr,
      homeworkDate: homeworkData.homeworkDate || homeworkData.assignedDate || todayStr,
      dueDate: homeworkData.dueDate || todayStr,
      teacherName: homeworkData.teacherName || homeworkData.createdByEmployeeName || 'Mrs. Priya Sharma',
      teacherId: homeworkData.teacherId || homeworkData.createdByEmployeeId || 'EMP-T101',
      createdByEmployeeId: homeworkData.createdByEmployeeId || homeworkData.teacherId || 'EMP-T101',
      createdByEmployeeName: homeworkData.createdByEmployeeName || homeworkData.teacherName || 'Mrs. Priya Sharma',
      status: (homeworkData.status as any) || 'New',
      attachmentUrl: homeworkData.attachmentUrl || (homeworkData as any).fileUrl,
      fileUrl: (homeworkData as any).fileUrl || homeworkData.attachmentUrl,
      cloudinaryPublicId: (homeworkData as any).cloudinaryPublicId || (homeworkData as any).publicId,
      attachments: homeworkData.attachments || [],
      schoolId: 'AVM',
      createdAt: homeworkData.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    if (dataConfig.isFirebase()) {
      try {
        await firebaseService.createDocument('homework', id, newHomework);
      } catch (e) {
        console.error('[homeworkService] Firestore uploadHomework error:', e);
        throw new Error('Failed to save homework to Firestore.');
      }
    }

    const existingIdx = db.homework.findIndex((h: any) => h.id === newHomework.id);
    if (existingIdx !== -1) {
      db.homework[existingIdx] = { ...db.homework[existingIdx], ...newHomework };
    } else {
      db.homework.unshift(newHomework);
    }

    demoDataStore.saveDB(db);

    try {
      notificationService.notifyHomeworkCreated(
        newHomework.className,
        newHomework.section,
        newHomework.subject,
        newHomework.title
      );
    } catch (e) {}

    return {
      success: true,
      id: newHomework.id,
      homework: newHomework
    };
  },

  async deleteHomework(id: string): Promise<boolean> {
    if (dataConfig.isFirebase()) {
      try {
        await firebaseService.deleteDocument('homework', id);
      } catch (e) {
        console.error('[homeworkService] Firestore deleteHomework error:', e);
      }
    }

    const db = demoDataStore.getDB();
    if (db.homework) {
      db.homework = db.homework.filter((h: any) => h.id !== id);
      demoDataStore.saveDB(db);
    }
    return true;
  },

  async submitHomework(homeworkId: string, fileInfo: string): Promise<{ success: boolean; message: string }> {
    if (dataConfig.isFirebase()) {
      try {
        await firebaseService.createDocument('homeworkSubmissions', `sub_${homeworkId}_${Date.now()}`, {
          homeworkId,
          fileInfo,
          submittedAt: new Date().toISOString()
        });
      } catch (e) {}
    }
    return { success: true, message: 'Homework submitted successfully!' };
  }
};
