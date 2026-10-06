import type {
  Employee,
  Student,
  AttendanceRecord,
  Homework,
  Notice,
  TimetableSlot,
  LeaveApplication
} from '../types';
import { apiFetch } from './api';
import { attendanceService } from './attendanceService';
import { homeworkService } from './homeworkService';
import { resultService } from './resultService';
import { noticeService } from './noticeService';
import { timetableService } from './timetableService';
import { notificationService } from './notificationService';
import { demoDataStore, isStudentInClass } from './demoDataStore';
import { firebaseService } from './firebaseService';
import { dataConfig } from './dataConfig';

export const employeeService = {
  async getAllEmployees(): Promise<Employee[]> {
    if (dataConfig.isFirebase()) {
      try {
        const firestoreList = await firebaseService.queryDocuments<Employee>('employees');
        if (firestoreList && firestoreList.length > 0) {
          const db = demoDataStore.getDB();
          db.employees = firestoreList;
          demoDataStore.saveDB(db);
          return firestoreList;
        }
      } catch (e) {
        console.warn('[employeeService] Firestore query error:', e);
      }
    }

    try {
      const res = await apiFetch<any>('/api/employees');
      if (res.success && res.data && res.data.length > 0) {
        return res.data;
      }
    } catch (e) {
      console.warn('employeeService.getAllEmployees fallback:', e);
    }
    const db = demoDataStore.getDB();
    return db.employees || [];
  },

  async addEmployee(employeeData: Omit<Employee, 'id'>): Promise<{ success: boolean; employee: Employee }> {
    const id = (employeeData as any).id || `EMP-${Date.now().toString().slice(-4)}`;
    const fullEmp: Employee = {
      ...employeeData,
      id,
      schoolId: 'AVM'
    } as Employee;

    if (dataConfig.isFirebase()) {
      try {
        await firebaseService.createDocument('employees', id, fullEmp);
      } catch (e) {
        console.error('[employeeService] Firestore addEmployee error:', e);
        throw new Error('Failed to save employee to Firestore.');
      }
    }

    const db = demoDataStore.getDB();
    const emps = db.employees || [];
    const idx = emps.findIndex((e: any) => e.id === id || e.employeeId === fullEmp.employeeId);
    if (idx !== -1) {
      emps[idx] = fullEmp;
    } else {
      emps.push(fullEmp);
    }
    db.employees = emps;
    demoDataStore.saveDB(db);

    return { success: true, employee: fullEmp };
  },

  async updateEmployee(id: string, updates: Partial<Employee>): Promise<{ success: boolean; employee: Employee }> {
    const db = demoDataStore.getDB();
    const emps = db.employees || [];
    const idx = emps.findIndex((e: any) => e.id === id || e.employeeId === id);
    if (idx === -1) {
      throw new Error(`Employee ${id} not found.`);
    }

    const updated = { ...emps[idx], ...updates, updatedAt: new Date().toISOString() };

    if (dataConfig.isFirebase()) {
      try {
        await firebaseService.updateDocument('employees', updated.id, updates);
      } catch (e) {
        console.error('[employeeService] Firestore updateEmployee error:', e);
        throw new Error('Failed to update employee in Firestore.');
      }
    }

    emps[idx] = updated;
    db.employees = emps;
    demoDataStore.saveDB(db);

    return { success: true, employee: updated };
  },

  async getProfile(employeeId: string): Promise<Employee> {
    if (dataConfig.isFirebase()) {
      try {
        const docData = await firebaseService.getDocument<Employee>('employees', employeeId);
        if (docData) return docData;
      } catch (e) {
        console.warn('[employeeService] Firestore getProfile error:', e);
      }
    }

    try {
      const list = await this.getAllEmployees();
      const found = list.find((e) => e.id === employeeId || e.employeeId === employeeId);
      if (found) return found;
    } catch (e) {
      console.warn('employeeService.getProfile fallback:', e);
    }
    return {
      id: employeeId || 'EMP-T102',
      employeeId: 'T102',
      name: 'Mrs. Priya Sharma',
      photo: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150',
      designation: 'Senior Mathematics Teacher',
      department: 'Academics',
      subject: 'Mathematics',
      phone: '+91 98123 45678',
      email: 'priya.sharma@avmkajraili.edu.in',
      assignedClasses: ['nursery-a', 'class-5-a', 'class-6-a', 'class-8-a'],
      joinDate: '2018-07-15'
    };
  },

  async getAssignedClasses(employeeId: string): Promise<string[]> {
    const emp = await this.getProfile(employeeId);
    return emp ? emp.assignedClasses : ['nursery-a', 'class-5-a', 'class-6-a', 'class-8-a'];
  },

  async getStudentsByClass(className: string, section: string): Promise<Student[]> {
    if (dataConfig.isFirebase()) {
      try {
        const allStudents = await firebaseService.queryDocuments<Student>('students');
        if (allStudents && allStudents.length > 0) {
          return allStudents.filter((s: Student) => isStudentInClass(s, className, section));
        }
      } catch (e) {
        console.warn('[employeeService] Firestore getStudentsByClass error:', e);
      }
    }

    try {
      const res = await apiFetch<any>(`/api/students?className=${encodeURIComponent(className)}&section=${encodeURIComponent(section)}`);
      if (res.success && res.data && res.data.length > 0) {
        return res.data;
      }
    } catch (e) {
      console.warn('employeeService.getStudentsByClass fallback:', e);
    }
    const db = demoDataStore.getDB();
    const students = db.students || [];
    return students.filter((s: Student) => isStudentInClass(s, className, section));
  },

  async submitAttendance(date: string, className: string, section: string, records: AttendanceRecord[]): Promise<{ success: boolean; count: number }> {
    return attendanceService.submitAttendance(date, className, section, records);
  },

  async uploadHomework(homeworkData: Partial<Homework>, teacherName = 'Mrs. Priya Sharma'): Promise<{ success: boolean; id: string }> {
    const result = await homeworkService.uploadHomework({
      ...homeworkData,
      teacherName: teacherName || homeworkData.teacherName || homeworkData.createdByEmployeeName
    });
    try {
      notificationService.notifyHomeworkCreated(
        homeworkData.className,
        homeworkData.section,
        homeworkData.subject,
        homeworkData.title
      );
    } catch (e) {
      console.warn('Error notifying homework created:', e);
    }
    return { success: result.success, id: result.id };
  },

  async saveMarks(examId: string, className: string, section: string, subject: string, marksData: { studentId: string; marks: number }[]): Promise<{ success: boolean }> {
    return resultService.saveMarks(examId, className, section, subject, marksData);
  },

  async getTimetable(employeeId: string): Promise<TimetableSlot[]> {
    return timetableService.getTimetable();
  },

  async getLeaves(employeeId: string): Promise<LeaveApplication[]> {
    if (dataConfig.isFirebase()) {
      try {
        const firestoreLeaves = await firebaseService.queryDocuments<LeaveApplication>('leaveApplications');
        if (firestoreLeaves && firestoreLeaves.length > 0) {
          if (!employeeId || employeeId === 'All' || employeeId.startsWith('ADM')) {
            return firestoreLeaves;
          }
          return firestoreLeaves.filter((l: LeaveApplication) => l.employeeId === employeeId || l.leaveId === employeeId);
        }
      } catch (e) {
        console.warn('[employeeService] Firestore getLeaves error:', e);
      }
    }

    try {
      const res = await apiFetch<any>('/api/leaves');
      if (res.success && res.data && res.data.length > 0) {
        return res.data;
      }
    } catch (e) {
      console.warn('employeeService.getLeaves fallback to demo store:', e);
    }
    return demoDataStore.getLeaveApplications(employeeId || 'EMP-T101');
  },

  async applyLeave(
    fromDateOrObj: string | {
      employeeId?: string;
      employeeName?: string;
      employeeDepartment?: string;
      employeeDesignation?: string;
      fromDate: string;
      toDate: string;
      reason: string;
      documentPhoto?: string;
      documentFileName?: string;
    },
    toDateArg?: string,
    reasonArg?: string
  ): Promise<{ success: boolean; id: string; record?: LeaveApplication }> {
    let fromDate = '';
    let toDate = '';
    let reason = '';
    let employeeId = 'EMP-T101';
    let employeeName = 'Mrs. Priya Sharma';
    let employeeDepartment = 'Academics';
    let employeeDesignation = 'Senior Mathematics Teacher';
    let documentPhoto: string | undefined;
    let documentFileName: string | undefined;

    if (typeof fromDateOrObj === 'object') {
      fromDate = fromDateOrObj.fromDate;
      toDate = fromDateOrObj.toDate;
      reason = fromDateOrObj.reason;
      if (fromDateOrObj.employeeId) employeeId = fromDateOrObj.employeeId;
      if (fromDateOrObj.employeeName) employeeName = fromDateOrObj.employeeName;
      if (fromDateOrObj.employeeDepartment) employeeDepartment = fromDateOrObj.employeeDepartment;
      if (fromDateOrObj.employeeDesignation) employeeDesignation = fromDateOrObj.employeeDesignation;
      documentPhoto = fromDateOrObj.documentPhoto;
      documentFileName = fromDateOrObj.documentFileName;
    } else {
      fromDate = fromDateOrObj;
      toDate = toDateArg || fromDate;
      reason = reasonArg || '';
    }

    const dFrom = new Date(fromDate);
    const dTo = new Date(toDate);
    const diffTime = Math.abs(dTo.getTime() - dFrom.getTime());
    const totalDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;

    const id = `LV-2026-${Math.floor(1000 + Math.random() * 9000)}`;
    const now = new Date();
    const formattedNow = `${now.toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' })} • ${now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}`;

    const newLeave: LeaveApplication = {
      id,
      leaveId: id,
      employeeId,
      employeeName,
      employeeDepartment,
      employeeDesignation,
      fromDate,
      toDate,
      totalDays,
      reason,
      documentPhoto,
      fileUrl: documentPhoto,
      documentFileName: documentFileName || (documentPhoto ? 'Leave_Application_Photo.jpg' : undefined),
      status: 'PENDING',
      submittedAt: formattedNow,
      appliedOn: fromDate
    };

    if (dataConfig.isFirebase()) {
      try {
        await firebaseService.createDocument('leaveApplications', id, newLeave);
      } catch (e) {
        console.error('[employeeService] Firestore applyLeave error:', e);
        throw new Error('Failed to submit leave application to Firestore.');
      }
    }

    demoDataStore.saveLeaveApplication(newLeave);

    return { success: true, id, record: newLeave };
  },

  async updateLeaveStatus(leaveId: string, status: 'APPROVED' | 'REJECTED' | 'CANCELLED' | 'PENDING' | string, comments?: string): Promise<{ success: boolean }> {
    if (dataConfig.isFirebase()) {
      try {
        await firebaseService.updateDocument('leaveApplications', leaveId, { status, adminRemarks: comments, updatedAt: new Date().toISOString() });
      } catch (e) {
        console.error('[employeeService] Firestore updateLeaveStatus error:', e);
      }
    }
    demoDataStore.updateLeaveStatus(leaveId, status);
    return { success: true };
  },

  async cancelLeave(leaveId: string): Promise<{ success: boolean }> {
    return this.updateLeaveStatus(leaveId, 'CANCELLED');
  },

  async getNotices(): Promise<Notice[]> {
    return noticeService.getNotices('Employee');
  }
};
