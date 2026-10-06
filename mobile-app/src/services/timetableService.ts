import type { TimetableSlot, PeriodRecord, ClassSubjectRecord, TeachingAssignmentRecord } from '../types';
import { demoDataStore } from './demoDataStore';
import { dataConfig } from './dataConfig';
import { createDocument, updateDocument, deleteDocument, queryDocuments } from './firebaseService';

const DEFAULT_PERIODS: PeriodRecord[] = [
  { id: 'PRD-1', periodNumber: 1, name: 'Period 1', startTime: '08:00 AM', endTime: '08:45 AM', type: 'Regular' },
  { id: 'PRD-2', periodNumber: 2, name: 'Period 2', startTime: '08:45 AM', endTime: '09:30 AM', type: 'Regular' },
  { id: 'PRD-3', periodNumber: 3, name: 'Period 3', startTime: '09:30 AM', endTime: '10:15 AM', type: 'Regular' },
  { id: 'PRD-4', periodNumber: 4, name: 'Period 4', startTime: '10:15 AM', endTime: '11:00 AM', type: 'Regular' },
  { id: 'PRD-BRK', periodNumber: 5, name: 'Recess / Lunch Break', startTime: '11:00 AM', endTime: '11:30 AM', type: 'Lunch' },
  { id: 'PRD-5', periodNumber: 6, name: 'Period 5', startTime: '11:30 AM', endTime: '12:15 PM', type: 'Regular' },
  { id: 'PRD-6', periodNumber: 7, name: 'Period 6', startTime: '12:15 PM', endTime: '01:00 PM', type: 'Regular' },
  { id: 'PRD-7', periodNumber: 8, name: 'Period 7', startTime: '01:00 PM', endTime: '01:45 PM', type: 'Regular' },
  { id: 'PRD-8', periodNumber: 9, name: 'Period 8', startTime: '01:45 PM', endTime: '02:30 PM', type: 'Regular' }
];

const DEFAULT_CLASS_SUBJECTS: ClassSubjectRecord[] = [
  { id: 'CS-5A-1', className: 'Class 5', section: 'A', subjectId: 'SUB-1', subjectName: 'Mathematics', status: 'Active' },
  { id: 'CS-5A-2', className: 'Class 5', section: 'A', subjectId: 'SUB-2', subjectName: 'Science', status: 'Active' },
  { id: 'CS-5A-3', className: 'Class 5', section: 'A', subjectId: 'SUB-3', subjectName: 'English', status: 'Active' },
  { id: 'CS-5A-4', className: 'Class 5', section: 'A', subjectId: 'SUB-4', status: 'Active', subjectName: 'Hindi' },
  { id: 'CS-5A-5', className: 'Class 5', section: 'A', subjectId: 'SUB-5', subjectName: 'Social Studies', status: 'Active' },
  { id: 'CS-5A-6', className: 'Class 5', section: 'A', subjectId: 'SUB-6', subjectName: 'Computer Science', status: 'Active' },
  { id: 'CS-5A-7', className: 'Class 5', section: 'A', subjectId: 'SUB-8', subjectName: 'General Knowledge', status: 'Active' },
  { id: 'CS-5A-8', className: 'Class 5', section: 'A', subjectId: 'SUB-9', subjectName: 'Physical Education', status: 'Active' },
  { id: 'CS-2A-1', className: 'Class 2', section: 'A', subjectId: 'SUB-7', subjectName: 'Environmental Studies', status: 'Active' },
  { id: 'CS-2A-2', className: 'Class 2', section: 'A', subjectId: 'SUB-1', subjectName: 'Mathematics', status: 'Active' },
  { id: 'CS-2A-3', className: 'Class 2', section: 'A', subjectId: 'SUB-3', subjectName: 'English', status: 'Active' },
  { id: 'CS-2A-4', className: 'Class 2', section: 'A', subjectId: 'SUB-4', subjectName: 'Hindi', status: 'Active' }
];

const DEFAULT_TEACHING_ASSIGNMENTS: TeachingAssignmentRecord[] = [
  { id: 'TA-1', teacherId: 'EMP-T101', teacherName: 'Mrs. Priya Sharma', subjectId: 'SUB-1', subjectName: 'Mathematics', className: 'Class 5', section: 'A' },
  { id: 'TA-2', teacherId: 'EMP-T102', teacherName: 'Mr. Amit Kumar', subjectId: 'SUB-2', subjectName: 'Science', className: 'Class 5', section: 'A' },
  { id: 'TA-3', teacherId: 'EMP-T103', teacherName: 'Mr. Rajesh Varma', subjectId: 'SUB-3', subjectName: 'English', className: 'Class 5', section: 'A' },
  { id: 'TA-4', teacherId: 'EMP-T104', teacherName: 'Mrs. Sunita Devi', subjectId: 'SUB-4', subjectName: 'Hindi', className: 'Class 5', section: 'A' },
  { id: 'TA-5', teacherId: 'EMP-T104', teacherName: 'Mrs. Sunita Devi', subjectId: 'SUB-5', subjectName: 'Social Studies', className: 'Class 5', section: 'A' },
  { id: 'TA-6', teacherId: 'EMP-IT401', teacherName: 'Mr. Deepak Roy', subjectId: 'SUB-6', subjectName: 'Computer Science', className: 'Class 5', section: 'A' },
  { id: 'TA-7', teacherId: 'EMP-SP301', teacherName: 'Mrs. Kavita Sharma', subjectId: 'SUB-9', subjectName: 'Physical Education', className: 'Class 5', section: 'A' }
];

const DEFAULT_TIMETABLE: TimetableSlot[] = [
  { id: 'TT-5A-M1', day: 'Monday', period: 1, startTime: '08:00 AM', endTime: '08:45 AM', className: 'Class 5', section: 'A', subject: 'Mathematics', teacherName: 'Mrs. Priya Sharma', room: 'Room 204', type: 'Regular', status: 'Active' },
  { id: 'TT-5A-M2', day: 'Monday', period: 2, startTime: '08:45 AM', endTime: '09:30 AM', className: 'Class 5', section: 'A', subject: 'Science', teacherName: 'Mr. Amit Kumar', room: 'Room 204', type: 'Regular', status: 'Active' },
  { id: 'TT-5A-M3', day: 'Monday', period: 3, startTime: '09:30 AM', endTime: '10:15 AM', className: 'Class 5', section: 'A', subject: 'English', teacherName: 'Mr. Rajesh Varma', room: 'Room 204', type: 'Regular', status: 'Active' },
  { id: 'TT-5A-M4', day: 'Monday', period: 4, startTime: '10:15 AM', endTime: '11:00 AM', className: 'Class 5', section: 'A', subject: 'Hindi', teacherName: 'Mrs. Sunita Devi', room: 'Room 204', type: 'Regular', status: 'Active' },
  { id: 'TT-5A-MBR', day: 'Monday', period: 5, startTime: '11:00 AM', endTime: '11:30 AM', className: 'Class 5', section: 'A', subject: 'Lunch Break', teacherName: 'Unassigned', room: 'Cafeteria', type: 'Lunch', status: 'Active' },
  { id: 'TT-5A-M5', day: 'Monday', period: 6, startTime: '11:30 AM', endTime: '12:15 PM', className: 'Class 5', section: 'A', subject: 'Computer Science', teacherName: 'Mr. Deepak Roy', room: 'Computer Lab 1', type: 'Regular', status: 'Active' },
  { id: 'TT-5A-M6', day: 'Monday', period: 7, startTime: '12:15 PM', endTime: '01:00 PM', className: 'Class 5', section: 'A', subject: 'Social Studies', teacherName: 'Mrs. Sunita Devi', room: 'Room 204', type: 'Regular', status: 'Active' },
  { id: 'TT-5A-M7', day: 'Monday', period: 8, startTime: '01:00 PM', endTime: '01:45 PM', className: 'Class 5', section: 'A', subject: 'Physical Education', teacherName: 'Mrs. Kavita Sharma', room: 'Playground', type: 'Activity', status: 'Active' }
];

export const timetableService = {
  getPeriods(): PeriodRecord[] {
    const db = demoDataStore.getDB();
    if (!Array.isArray(db.periods) || db.periods.length === 0) {
      db.periods = [...DEFAULT_PERIODS];
      demoDataStore.saveDB(db);
    }
    return db.periods;
  },

  savePeriods(periods: PeriodRecord[]): PeriodRecord[] {
    const db = demoDataStore.getDB();
    db.periods = [...periods];
    demoDataStore.saveDB(db);
    return db.periods;
  },

  addPeriod(period: Partial<PeriodRecord>): PeriodRecord {
    const periods = this.getPeriods();
    const newId = `PRD-${Date.now().toString().slice(-4)}`;
    const newPeriod: PeriodRecord = {
      id: newId,
      periodNumber: period.periodNumber || periods.length + 1,
      name: period.name || `Period ${periods.length + 1}`,
      startTime: period.startTime || '08:00 AM',
      endTime: period.endTime || '08:45 AM',
      type: period.type || 'Regular'
    };

    const updated = [...periods, newPeriod].sort((a, b) => a.periodNumber - b.periodNumber);
    this.savePeriods(updated);
    return newPeriod;
  },

  updatePeriod(id: string, updates: Partial<PeriodRecord>): PeriodRecord | null {
    const periods = this.getPeriods();
    const idx = periods.findIndex(p => p.id === id);
    if (idx === -1) return null;

    periods[idx] = { ...periods[idx], ...updates };
    this.savePeriods(periods);
    return periods[idx];
  },

  deletePeriod(id: string): boolean {
    const periods = this.getPeriods();
    const updated = periods.filter(p => p.id !== id);
    this.savePeriods(updated);
    return true;
  },

  getClassSubjects(className?: string, section?: string): ClassSubjectRecord[] {
    const db = demoDataStore.getDB();
    if (!Array.isArray(db.classSubjects) || db.classSubjects.length === 0) {
      db.classSubjects = [...DEFAULT_CLASS_SUBJECTS];
      demoDataStore.saveDB(db);
    }

    return db.classSubjects.filter(cs => {
      const matchCls = !className || className === 'All' || (cs.className || '').toLowerCase().replace(/class\s*/i, '').trim() === className.toLowerCase().replace(/class\s*/i, '').trim();
      const matchSec = !section || section === 'All' || (cs.section || '').toUpperCase() === section.toUpperCase();
      return matchCls && matchSec;
    });
  },

  addClassSubject(className: string, section: string, subjectId: string, subjectName: string): ClassSubjectRecord {
    const db = demoDataStore.getDB();
    const existing = this.getClassSubjects();

    const exists = existing.find(cs =>
      (cs.className || '').toLowerCase().replace(/class\s*/i, '').trim() === className.toLowerCase().replace(/class\s*/i, '').trim() &&
      (cs.section || '').toUpperCase() === section.toUpperCase() &&
      (cs.subjectName || '').toLowerCase() === subjectName.toLowerCase()
    );

    if (exists) return exists;

    const newRecord: ClassSubjectRecord = {
      id: `CS-${Date.now().toString().slice(-4)}`,
      className,
      section,
      subjectId: subjectId || `SUB-${Date.now().toString().slice(-4)}`,
      subjectName,
      status: 'Active'
    };

    db.classSubjects = [newRecord, ...existing];
    demoDataStore.saveDB(db);
    return newRecord;
  },

  removeClassSubject(id: string): void {
    const db = demoDataStore.getDB();
    const all = this.getClassSubjects();
    db.classSubjects = all.filter(cs => cs.id !== id);
    demoDataStore.saveDB(db);
  },

  getTeachingAssignments(className?: string, section?: string, subjectName?: string, teacherName?: string): TeachingAssignmentRecord[] {
    const db = demoDataStore.getDB();
    if (!Array.isArray(db.teachingAssignments) || db.teachingAssignments.length === 0) {
      db.teachingAssignments = [...DEFAULT_TEACHING_ASSIGNMENTS];
      demoDataStore.saveDB(db);
    }

    return db.teachingAssignments.filter(ta => {
      const matchCls = !className || className === 'All' || (ta.className || '').toLowerCase().replace(/class\s*/i, '').trim() === className.toLowerCase().replace(/class\s*/i, '').trim();
      const matchSec = !section || section === 'All' || (ta.section || '').toUpperCase() === section.toUpperCase();
      const matchSubj = !subjectName || subjectName === 'All' || (ta.subjectName || '').toLowerCase() === subjectName.toLowerCase();
      const matchTeach = !teacherName || teacherName === 'All' || (ta.teacherName || '').toLowerCase().includes(teacherName.toLowerCase());
      return matchCls && matchSec && matchSubj && matchTeach;
    });
  },

  addTeachingAssignment(teacherId: string, teacherName: string, subjectName: string, className: string, section: string): TeachingAssignmentRecord {
    const db = demoDataStore.getDB();
    const existing = this.getTeachingAssignments();

    const exists = existing.find(ta =>
      (ta.className || '').toLowerCase().replace(/class\s*/i, '').trim() === className.toLowerCase().replace(/class\s*/i, '').trim() &&
      (ta.section || '').toUpperCase() === section.toUpperCase() &&
      (ta.subjectName || '').toLowerCase() === subjectName.toLowerCase() &&
      (ta.teacherName || '').toLowerCase() === teacherName.toLowerCase()
    );

    if (exists) return exists;

    const newRecord: TeachingAssignmentRecord = {
      id: `TA-${Date.now().toString().slice(-4)}`,
      teacherId: teacherId || `EMP-${Date.now().toString().slice(-4)}`,
      teacherName,
      subjectName,
      className,
      section
    };

    db.teachingAssignments = [newRecord, ...existing];
    demoDataStore.saveDB(db);
    return newRecord;
  },

  removeTeachingAssignment(id: string): void {
    const db = demoDataStore.getDB();
    const all = this.getTeachingAssignments();
    db.teachingAssignments = all.filter(ta => ta.id !== id);
    demoDataStore.saveDB(db);
  },

  getAllSlots(): TimetableSlot[] {
    if (dataConfig.isFirebase()) {
      queryDocuments<TimetableSlot>('timetableEntries').then((slots) => {
        if (slots && slots.length > 0) {
          const db = demoDataStore.getDB();
          db.timetable = slots;
          demoDataStore.saveDB(db);
        }
      }).catch(() => {});
    }
    const db = demoDataStore.getDB();
    if (!Array.isArray(db.timetable) || db.timetable.length === 0) {
      db.timetable = [...DEFAULT_TIMETABLE];
      demoDataStore.saveDB(db);
    }
    return db.timetable;
  },

  getTimetable(className?: string, section?: string, teacherName?: string, day?: string): TimetableSlot[] {
    const all = this.getAllSlots();
    return all.filter((s: TimetableSlot) => {
      const matchCls = !className || className === 'All' || (s.className || '').toLowerCase().replace(/class\s*/i, '').trim() === className.toLowerCase().replace(/class\s*/i, '').trim();
      const matchSec = !section || section === 'All' || (s.section || '').toUpperCase() === section.toUpperCase();
      const matchTeach = !teacherName || teacherName === 'All' || (s.teacherName || '').toLowerCase().includes(teacherName.toLowerCase());
      const matchDay = !day || day === 'All' || (s.day || '').toLowerCase() === day.toLowerCase();
      return matchCls && matchSec && matchTeach && matchDay;
    });
  },

  checkConflict(slot: Partial<TimetableSlot>, excludeId?: string): { hasConflict: boolean; type?: 'teacher' | 'class'; message?: string } {
    if (!slot.day || !slot.period || slot.type === 'Lunch' || slot.type === 'Break' || slot.type === 'Assembly') {
      return { hasConflict: false };
    }

    const allSlots = this.getAllSlots();

    if (slot.teacherName && slot.teacherName !== 'Unassigned' && slot.teacherName !== 'None') {
      const teacherConflict = allSlots.find((s) => {
        if (excludeId && s.id === excludeId) return false;
        const sameDay = (s.day || '').toLowerCase() === (slot.day || '').toLowerCase();
        const samePeriod = Number(s.period) === Number(slot.period);
        const sameTeacher = (s.teacherName || '').toLowerCase().trim() === (slot.teacherName || '').toLowerCase().trim();
        const isTeachingType = s.type !== 'Lunch' && s.type !== 'Break' && s.type !== 'Assembly';
        return sameDay && samePeriod && sameTeacher && isTeachingType;
      });

      if (teacherConflict) {
        return {
          hasConflict: true,
          type: 'teacher',
          message: `Teacher Conflict: ${slot.teacherName} is already assigned to ${teacherConflict.className}-${teacherConflict.section} during Period ${slot.period} on ${slot.day}.`
        };
      }
    }

    if (slot.className && slot.section) {
      const classConflict = allSlots.find((s) => {
        if (excludeId && s.id === excludeId) return false;
        const sameDay = (s.day || '').toLowerCase() === (slot.day || '').toLowerCase();
        const samePeriod = Number(s.period) === Number(slot.period);
        const sameClass = (s.className || '').toLowerCase().replace(/class\s*/i, '').trim() === (slot.className || '').toLowerCase().replace(/class\s*/i, '').trim();
        const sameSec = (s.section || '').toUpperCase().trim() === (slot.section || '').toUpperCase().trim();
        return sameDay && samePeriod && sameClass && sameSec;
      });

      if (classConflict) {
        return {
          hasConflict: true,
          type: 'class',
          message: `Class Conflict: ${slot.className}-${slot.section} already has ${classConflict.subject} assigned during Period ${slot.period} on ${slot.day}.`
        };
      }
    }

    return { hasConflict: false };
  },

  addTimetableSlot(slotData: Partial<TimetableSlot>): TimetableSlot {
    const conflict = this.checkConflict(slotData);
    if (conflict.hasConflict) {
      throw new Error(conflict.message);
    }

    const db = demoDataStore.getDB();
    const existing = this.getAllSlots();
    const newId = `TT-${Date.now().toString().slice(-6)}`;

    const newSlot: TimetableSlot = {
      id: newId,
      day: slotData.day || 'Monday',
      period: Number(slotData.period) || 1,
      periodName: slotData.periodName || `Period ${slotData.period || 1}`,
      startTime: slotData.startTime || '08:00 AM',
      endTime: slotData.endTime || '08:45 AM',
      className: slotData.className || 'Class 5',
      section: slotData.section || 'A',
      subject: slotData.subject || 'Mathematics',
      teacherName: slotData.teacherName || 'Mrs. Priya Sharma',
      teacherId: slotData.teacherId,
      room: slotData.room || 'Room 204',
      type: slotData.type || 'Regular',
      status: 'Active',
      createdAt: new Date().toISOString().split('T')[0]
    };

    if (dataConfig.isFirebase()) {
      createDocument('timetableEntries', newId, newSlot).catch(err =>
        console.error('[FIREBASE] Failed to add timetable entry to Firestore:', err)
      );
    }

    db.timetable = [newSlot, ...existing];
    demoDataStore.saveDB(db);

    this.addClassSubject(newSlot.className, newSlot.section, newSlot.subjectId || 'SUB-GEN', newSlot.subject);

    return newSlot;
  },

  updateTimetableSlot(id: string, updates: Partial<TimetableSlot>): TimetableSlot {
    const conflict = this.checkConflict(updates, id);
    if (conflict.hasConflict) {
      throw new Error(conflict.message);
    }

    const db = demoDataStore.getDB();
    const all = this.getAllSlots();
    const idx = all.findIndex((s) => s.id === id);
    if (idx === -1) {
      throw new Error('Timetable slot not found');
    }

    all[idx] = { ...all[idx], ...updates, updatedAt: new Date().toISOString().split('T')[0] };
    db.timetable = [...all];
    demoDataStore.saveDB(db);

    if (dataConfig.isFirebase()) {
      updateDocument('timetableEntries', id, updates).catch(err =>
        console.error('[FIREBASE] Failed to update timetable entry in Firestore:', err)
      );
    }

    return all[idx];
  },

  deleteTimetableSlot(id: string): void {
    const db = demoDataStore.getDB();
    const all = this.getAllSlots();
    db.timetable = all.filter((s) => s.id !== id);
    demoDataStore.saveDB(db);

    if (dataConfig.isFirebase()) {
      deleteDocument('timetableEntries', id).catch(err =>
        console.error('[FIREBASE] Failed to delete timetable entry in Firestore:', err)
      );
    }
  }
};
