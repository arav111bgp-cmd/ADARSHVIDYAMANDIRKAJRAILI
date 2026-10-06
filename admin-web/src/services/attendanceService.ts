import type { AttendanceRecord } from '../types';
import { apiFetch } from './api';
import { notificationService } from './notificationService';
import { demoDataStore, isStudentInClass } from './demoDataStore';
import { firebaseService } from './firebaseService';
import { dataConfig } from './dataConfig';

export const attendanceService = {
  async getAttendance(studentId?: string, date?: string, className?: string, section?: string): Promise<AttendanceRecord[]> {
    if (dataConfig.isFirebase()) {
      try {
        let firestoreList: AttendanceRecord[] = [];
        if (studentId) {
          firestoreList = await firebaseService.queryDocuments<AttendanceRecord>('attendance', 'studentId', '==', studentId);
        } else if (date) {
          firestoreList = await firebaseService.queryDocuments<AttendanceRecord>('attendance', 'date', '==', date);
        } else {
          firestoreList = await firebaseService.queryDocuments<AttendanceRecord>('attendance');
        }

        if (firestoreList && firestoreList.length > 0) {
          let filtered = firestoreList;
          if (studentId) {
            const norm = studentId.trim().toLowerCase();
            filtered = filtered.filter((a) => (a.studentId && a.studentId.trim().toLowerCase() === norm) || (a.admissionNo && a.admissionNo.trim().toLowerCase() === norm));
          }
          if (date) {
            filtered = filtered.filter((a) => a.date === date);
          }
          if (className && className !== 'All') {
            filtered = filtered.filter((a) => isStudentInClass({ className: a.className, section: a.section }, className, section));
          }
          return filtered;
        }
      } catch (e) {
        console.warn('[attendanceService] Firestore getAttendance query error:', e);
      }
    }

    try {
      const params = new URLSearchParams();
      if (studentId) params.append('studentId', studentId);
      if (date) params.append('date', date);
      if (className && className !== 'All') params.append('className', className);
      if (section && section !== 'All') params.append('section', section);

      const queryString = params.toString() ? `?${params.toString()}` : '';
      const res = await apiFetch<any>(`/api/attendance${queryString}`);
      if (res.success && res.data && res.data.length > 0) {
        return res.data;
      }
    } catch (e) {
      console.warn('attendanceService.getAttendance fallback:', e);
    }

    const db = demoDataStore.getDB();
    let list: AttendanceRecord[] = db.attendance || [];

    if (studentId) {
      const normStudentId = studentId.trim().toLowerCase();
      list = list.filter((a) => (a.studentId && a.studentId.trim().toLowerCase() === normStudentId) || (a.admissionNo && a.admissionNo.trim().toLowerCase() === normStudentId));
    }

    if (date) {
      list = list.filter((a) => a.date === date);
    }

    if (className && className !== 'All') {
      const students = db.students || [];
      const matchingStuIds = new Set(
        students
          .filter((s) => isStudentInClass(s, className, section))
          .map((s) => s.id)
      );

      list = list.filter((a) => {
        if (matchingStuIds.has(a.studentId)) return true;
        if (a.className && isStudentInClass({ className: a.className, section: a.section }, className, section)) return true;
        return false;
      });
    }

    return list;
  },

  async submitAttendance(date: string, className: string, section: string, records: AttendanceRecord[]): Promise<{ success: boolean; count: number }> {
    const db = demoDataStore.getDB();
    db.attendance = db.attendance || [];

    const formattedRecords = records.map((r) => ({
      ...r,
      date: r.date || date,
      className: r.className || className,
      section: r.section || section,
      time: r.time || new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      academicSessionId: r.academicSessionId || '2026-27',
      schoolId: 'AVM'
    }));

    for (const rec of formattedRecords) {
      const attId = rec.id || `ATT-${rec.studentId}-${rec.date}`;
      const recWithId = { ...rec, id: attId };

      if (dataConfig.isFirebase()) {
        try {
          await firebaseService.createDocument('attendance', attId, recWithId);
        } catch (e) {
          console.error('[attendanceService] Firestore submitAttendance error:', e);
        }
      }

      const idx = db.attendance.findIndex((a: any) => a.studentId === rec.studentId && a.date === rec.date);
      if (idx !== -1) {
        db.attendance[idx] = {
          ...db.attendance[idx],
          ...recWithId,
          updatedAt: new Date().toISOString()
        };
      } else {
        db.attendance.push({
          ...recWithId,
          createdAt: new Date().toISOString()
        });
      }

      if (rec.status === 'absent') {
        try {
          notificationService.notifyAttendanceAbsent(
            rec.studentId,
            rec.studentName || 'Student',
            className,
            section,
            date
          );
        } catch (e) {}
      }
    }

    demoDataStore.saveDB(db);

    return { success: true, count: records.length };
  }
};
