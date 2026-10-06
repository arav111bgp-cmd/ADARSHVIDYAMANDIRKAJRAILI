import type {
  Student,
  AttendanceRecord,
  Homework,
  Exam,
  StudentResult,
  StudentFeeDetails,
  Notice,
  TimetableSlot,
  NotificationItem
} from '../types';
import { apiFetch } from './api';
import { attendanceService } from './attendanceService';
import { homeworkService } from './homeworkService';
import { examService } from './examService';
import { resultService } from './resultService';
import { feeService } from './feeService';
import { noticeService } from './noticeService';
import { timetableService } from './timetableService';
import { notificationService } from './notificationService';
import { demoDataStore } from './demoDataStore';
import { firebaseService } from './firebaseService';
import { dataConfig } from './dataConfig';

export const studentService = {
  async getAllStudents(): Promise<Student[]> {
    if (dataConfig.isFirebase()) {
      try {
        const firestoreList = await firebaseService.queryDocuments<Student>('students');
        if (firestoreList && firestoreList.length > 0) {
          // Sync local store
          const db = demoDataStore.getDB();
          db.students = firestoreList;
          demoDataStore.saveDB(db);
          return firestoreList;
        }
      } catch (e) {
        console.warn('[studentService] Firestore query error, falling back to local store:', e);
      }
    }

    try {
      const res = await apiFetch<any>('/api/students');
      if (res.success && res.data && res.data.length > 0) {
        return res.data;
      }
    } catch (e) {
      console.warn('studentService.getAllStudents fallback:', e);
    }
    const db = demoDataStore.getDB();
    return db.students || [];
  },

  async addStudent(studentData: Omit<Student, 'id'>): Promise<{ success: boolean; student: Student }> {
    const id = (studentData as any).id || `STU-${Date.now().toString().slice(-4)}`;
    const fullStudent: Student = {
      ...studentData,
      id,
      schoolId: 'AVM',
      academicSessionId: '2026-27'
    } as Student;

    if (dataConfig.isFirebase()) {
      try {
        await firebaseService.createDocument('students', id, fullStudent);
      } catch (e) {
        console.error('[studentService] Firestore addStudent error:', e);
        throw new Error('Failed to save student to Firestore. Please check internet connection.');
      }
    }

    // Sync to demoDataStore
    const db = demoDataStore.getDB();
    const students = db.students || [];
    const idx = students.findIndex((s: any) => s.id === id);
    if (idx !== -1) {
      students[idx] = fullStudent;
    } else {
      students.push(fullStudent);
    }
    db.students = students;
    demoDataStore.saveDB(db);

    return { success: true, student: fullStudent };
  },

  async updateStudent(id: string, updates: Partial<Student>): Promise<{ success: boolean; student: Student }> {
    const db = demoDataStore.getDB();
    const students = db.students || [];
    const idx = students.findIndex((s: any) => s.id === id || s.admissionNo === id);
    if (idx === -1) {
      throw new Error(`Student ${id} not found.`);
    }

    const updated = { ...students[idx], ...updates, updatedAt: new Date().toISOString() };

    if (dataConfig.isFirebase()) {
      try {
        await firebaseService.updateDocument('students', updated.id, updates);
      } catch (e) {
        console.error('[studentService] Firestore updateStudent error:', e);
        throw new Error('Failed to update student in Firestore.');
      }
    }

    students[idx] = updated;
    db.students = students;
    demoDataStore.saveDB(db);

    return { success: true, student: updated };
  },

  async deleteStudent(id: string): Promise<{ success: boolean }> {
    if (dataConfig.isFirebase()) {
      try {
        await firebaseService.deleteDocument('students', id);
      } catch (e) {
        console.error('[studentService] Firestore deleteStudent error:', e);
        throw new Error('Failed to delete student from Firestore.');
      }
    }

    const db = demoDataStore.getDB();
    db.students = (db.students || []).filter((s: any) => s.id !== id && s.admissionNo !== id);
    demoDataStore.saveDB(db);
    return { success: true };
  },

  async getProfile(studentId: string): Promise<Student> {
    if (dataConfig.isFirebase()) {
      try {
        const docData = await firebaseService.getDocument<Student>('students', studentId);
        if (docData) return docData;
      } catch (e) {
        console.warn('[studentService] Firestore getProfile error:', e);
      }
    }

    try {
      const res = await apiFetch<any>(`/api/students/${studentId}`);
      if (res.success && res.data) {
        return res.data;
      }
      const list = await this.getAllStudents();
      const found = list.find((s) => s.id === studentId || s.admissionNo.toLowerCase() === studentId.toLowerCase());
      if (found) return found;
    } catch (e) {
      console.warn('studentService.getProfile fallback:', e);
    }

    const db = demoDataStore.getDB();
    const local = (db.students || []).find((s: any) => s.id === studentId || s.admissionNo === studentId);
    if (local) return local;

    return {
      id: studentId || 'STU-101',
      admissionNo: 'AVM20260125',
      rollNo: 17,
      name: 'Rahul Kumar',
      photo: 'https://images.unsplash.com/photo-1544717305-2782549b5136?w=150',
      className: 'Class 5',
      section: 'A',
      dob: '2016-04-12',
      gender: 'Male',
      fatherName: 'Rajesh Kumar',
      motherName: 'Sunita Devi',
      phone: '+91 98765 43210',
      address: 'Main Road, Kajraili',
      bloodGroup: 'O+',
      status: 'Active'
    };
  },

  async getAttendance(studentId: string): Promise<AttendanceRecord[]> {
    return attendanceService.getAttendance(studentId);
  },

  async getHomework(className: string, section: string): Promise<Homework[]> {
    return homeworkService.getHomework(className, section);
  },

  async submitHomework(homeworkId: string, fileInfo: string): Promise<{ success: boolean; message: string }> {
    return homeworkService.submitHomework(homeworkId, fileInfo);
  },

  async getExams(): Promise<Exam[]> {
    return examService.getExams();
  },

  async getResult(studentId: string): Promise<StudentResult> {
    return resultService.getResultForStudent(studentId);
  },

  async getFeeDetails(studentId: string): Promise<StudentFeeDetails> {
    return feeService.getFeeDetails(studentId);
  },

  async payFeeOnline(studentId: string, amount: number): Promise<{ success: boolean; receiptNo: string }> {
    return feeService.payFeeOnline(studentId, amount);
  },

  async getNotices(): Promise<Notice[]> {
    return noticeService.getNotices('Student');
  },

  async getTimetable(className?: string, section?: string): Promise<TimetableSlot[]> {
    return timetableService.getTimetable(className, section);
  },

  async getNotifications(studentId?: string, className?: string, section?: string): Promise<NotificationItem[]> {
    return notificationService.getNotificationsForStudent(studentId, className, section);
  }
};
