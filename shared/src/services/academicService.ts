import {
  demoDataStore,
  SchoolClassRecord,
  SchoolSectionInfo,
  SchoolSubjectRecord,
  SchoolExamRecord,
  SchoolExamSubjectSchedule,
  SchoolAdmitCardRecord,
  AcademicSession,
  MasterSubjectRecord
} from './demoDataStore';
import { dataConfig } from './dataConfig';
import { createDocument, updateDocument, deleteDocument, queryDocuments } from './firebaseService';

export const academicService = {
  // --- ACADEMIC SESSIONS ---
  getSessions(): AcademicSession[] {
    if (dataConfig.isFirebase()) {
      queryDocuments<AcademicSession>('academicSessions').then((firestoreSessions) => {
        if (firestoreSessions && firestoreSessions.length > 0) {
          const db = demoDataStore.getDB();
          db.academicSessions = firestoreSessions;
          demoDataStore.saveDB(db);
        }
      }).catch((err) => console.warn('[FIREBASE] Error fetching academicSessions:', err));
    }
    const db = demoDataStore.getDB();
    return db.academicSessions || [
      { id: '2026-27', name: '2026–27', startDate: '2026-04-01', endDate: '2027-03-31', isActive: true, status: 'active' }
    ];
  },

  getActiveSessionId(): string {
    const sessions = this.getSessions();
    const active = sessions.find((s) => s.isActive || s.status === 'active');
    return active ? active.id : '2026-27';
  },

  // --- CLASSES & SECTIONS ---
  getSchoolClasses(sessionId?: string): SchoolClassRecord[] {
    if (dataConfig.isFirebase()) {
      queryDocuments<SchoolClassRecord>('classes').then((clsList) => {
        if (clsList && clsList.length > 0) {
          const db = demoDataStore.getDB();
          db.schoolClasses = clsList;
          demoDataStore.saveDB(db);
        }
      }).catch((err) => console.warn('[FIREBASE] Error fetching classes:', err));
    }
    const db = demoDataStore.getDB();
    const sid = sessionId || this.getActiveSessionId();
    const classes = db.schoolClasses || [];
    return classes.filter((c) => !c.academicSessionId || c.academicSessionId === sid);
  },

  addClass(className: string, sections: string[], classTeacherId?: string, classTeacherName?: string, sessionId?: string): SchoolClassRecord {
    const db = demoDataStore.getDB();
    const sid = sessionId || this.getActiveSessionId();
    const classId = className.toLowerCase().replace(/\s+/g, '-');
    
    const newClass: SchoolClassRecord = {
      id: classId,
      name: className,
      grade: className,
      academicSessionId: sid,
      classTeacherId,
      classTeacherName,
      status: 'Active',
      sections: (sections.length > 0 ? sections : ['A']).map((sec) => ({
        id: `${classId}-${sec.toLowerCase()}`,
        name: sec,
        section: sec,
        teacherId: classTeacherId,
        teacherName: classTeacherName,
        classTeacherName: classTeacherName,
        capacity: 30,
        status: 'Active'
      }))
    };

    db.schoolClasses = db.schoolClasses || [];
    const existingIdx = db.schoolClasses.findIndex((c) => c.id === classId || (c.name.toLowerCase() === className.toLowerCase() && c.academicSessionId === sid));
    if (existingIdx !== -1) {
      db.schoolClasses[existingIdx] = newClass;
    } else {
      db.schoolClasses.push(newClass);
    }

    demoDataStore.saveDB(db);

    if (dataConfig.isFirebase()) {
      createDocument('classes', newClass, classId).catch((err) =>
        console.error('[FIREBASE] Failed to add class in Firestore:', err)
      );
    }

    return newClass;
  },

  updateClass(classId: string, updates: Partial<SchoolClassRecord>): SchoolClassRecord | null {
    const db = demoDataStore.getDB();
    db.schoolClasses = db.schoolClasses || [];
    const idx = db.schoolClasses.findIndex((c) => c.id === classId);
    if (idx !== -1) {
      db.schoolClasses[idx] = { ...db.schoolClasses[idx], ...updates };
      demoDataStore.saveDB(db);

      if (dataConfig.isFirebase()) {
        updateDocument('classes', classId, updates).catch((err) =>
          console.error('[FIREBASE] Failed to update class in Firestore:', err)
        );
      }

      return db.schoolClasses[idx];
    }
    return null;
  },

  deleteClass(classId: string): boolean {
    const db = demoDataStore.getDB();
    db.schoolClasses = db.schoolClasses || [];
    const idx = db.schoolClasses.findIndex((c) => c.id === classId);
    if (idx !== -1) {
      db.schoolClasses.splice(idx, 1);
      demoDataStore.saveDB(db);

      if (dataConfig.isFirebase()) {
        deleteDocument('classes', classId).catch((err) =>
          console.error('[FIREBASE] Failed to delete class in Firestore:', err)
        );
      }

      return true;
    }
    return false;
  },

  addSectionToClass(classId: string, sectionName: string, teacherId?: string, teacherName?: string): SchoolSectionInfo | null {
    const db = demoDataStore.getDB();
    db.schoolClasses = db.schoolClasses || [];
    const cls = db.schoolClasses.find((c) => c.id === classId);
    if (cls) {
      const secNameClean = sectionName.trim().toUpperCase();
      const existingSec = cls.sections.find((s) => s.name.toUpperCase() === secNameClean || s.section?.toUpperCase() === secNameClean);
      let updatedSec: SchoolSectionInfo;
      if (existingSec) {
        existingSec.status = 'Active';
        if (teacherName) {
          existingSec.teacherId = teacherId;
          existingSec.teacherName = teacherName;
          existingSec.classTeacherName = teacherName;
        }
        updatedSec = existingSec;
      } else {
        updatedSec = {
          id: `${classId}-${secNameClean.toLowerCase()}`,
          name: secNameClean,
          section: secNameClean,
          teacherId,
          teacherName,
          classTeacherName: teacherName,
          capacity: 30,
          status: 'Active'
        };
        cls.sections.push(updatedSec);
      }
      demoDataStore.saveDB(db);

      if (dataConfig.isFirebase()) {
        updateDocument('classes', classId, { sections: cls.sections }).catch((err) =>
          console.error('[FIREBASE] Failed to update class sections in Firestore:', err)
        );
      }

      return updatedSec;
    }
    return null;
  },

  deleteSectionFromClass(classId: string, sectionName: string): boolean {
    const db = demoDataStore.getDB();
    db.schoolClasses = db.schoolClasses || [];
    const cls = db.schoolClasses.find((c) => c.id === classId);
    if (cls) {
      const secIdx = cls.sections.findIndex((s) => s.name.toUpperCase() === sectionName.toUpperCase() || s.section?.toUpperCase() === sectionName.toUpperCase());
      if (secIdx !== -1) {
        cls.sections.splice(secIdx, 1);
        demoDataStore.saveDB(db);

        if (dataConfig.isFirebase()) {
          updateDocument('classes', classId, { sections: cls.sections }).catch((err) =>
            console.error('[FIREBASE] Failed to delete section from class in Firestore:', err)
          );
        }

        return true;
      }
    }
    return false;
  },

  // --- MASTER SUBJECTS (GLOBAL ACADEMIC SUBJECT CATALOG) ---
  getMasterSubjects(): MasterSubjectRecord[] {
    if (dataConfig.isFirebase()) {
      queryDocuments<MasterSubjectRecord>('subjects').then((subList) => {
        if (subList && subList.length > 0) {
          const db = demoDataStore.getDB();
          db.masterSubjects = subList;
          demoDataStore.saveDB(db);
        }
      }).catch((err) => console.warn('[FIREBASE] Error fetching master subjects:', err));
    }
    const db = demoDataStore.getDB();
    return db.masterSubjects || [
      { id: 'SUB-MATH', name: 'Mathematics', code: 'MATH', type: 'Theory', maxMarks: 100, passingMarks: 33, status: 'Active' },
      { id: 'SUB-HIN', name: 'Hindi', code: 'HIN', type: 'Language', maxMarks: 100, passingMarks: 33, status: 'Active' },
      { id: 'SUB-ENG', name: 'English', code: 'ENG', type: 'Language', maxMarks: 100, passingMarks: 33, status: 'Active' },
      { id: 'SUB-SCI', name: 'Science', code: 'SCI', type: 'Theory', maxMarks: 100, passingMarks: 33, status: 'Active' },
      { id: 'SUB-SST', name: 'Social Science', code: 'SST', type: 'Theory', maxMarks: 100, passingMarks: 33, status: 'Active' },
      { id: 'SUB-CS', name: 'Computer Science', code: 'CS', type: 'Practical', maxMarks: 100, passingMarks: 33, status: 'Active' },
      { id: 'SUB-EVS', name: 'EVS', code: 'EVS', type: 'Theory', maxMarks: 100, passingMarks: 33, status: 'Active' },
      { id: 'SUB-GK', name: 'GK', code: 'GK', type: 'Theory', maxMarks: 50, passingMarks: 17, status: 'Active' },
      { id: 'SUB-DRAW', name: 'Drawing', code: 'DRAW', type: 'Activity', maxMarks: 50, passingMarks: 17, status: 'Active' },
      { id: 'SUB-RHY', name: 'Rhymes', code: 'RHY', type: 'Activity', maxMarks: 50, passingMarks: 17, status: 'Active' }
    ];
  },

  addMasterSubject(subj: Omit<MasterSubjectRecord, 'id'> & { id?: string }): MasterSubjectRecord {
    const db = demoDataStore.getDB();
    db.masterSubjects = db.masterSubjects || [];
    const id = subj.id || `SUB-${subj.code.replace(/\s+/g, '').toUpperCase()}-${Date.now().toString().slice(-4)}`;

    const newMaster: MasterSubjectRecord = {
      ...subj,
      id,
      name: subj.name.trim(),
      code: subj.code.trim().toUpperCase(),
      type: subj.type || 'Theory',
      maxMarks: subj.maxMarks || 100,
      passingMarks: subj.passingMarks || 33,
      status: subj.status || 'Active',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const idx = db.masterSubjects.findIndex((s) => s.id === id || s.name.toLowerCase() === subj.name.trim().toLowerCase());
    if (idx !== -1) {
      db.masterSubjects[idx] = { ...db.masterSubjects[idx], ...newMaster };
    } else {
      db.masterSubjects.push(newMaster);
    }

    demoDataStore.saveDB(db);

    if (dataConfig.isFirebase()) {
      createDocument('subjects', newMaster, id).catch((err) =>
        console.error('[FIREBASE] Failed to add master subject to Firestore:', err)
      );
    }

    return newMaster;
  },

  updateMasterSubject(id: string, updates: Partial<MasterSubjectRecord>): MasterSubjectRecord | null {
    const db = demoDataStore.getDB();
    db.masterSubjects = db.masterSubjects || [];
    const idx = db.masterSubjects.findIndex((s) => s.id === id);
    if (idx !== -1) {
      db.masterSubjects[idx] = { ...db.masterSubjects[idx], ...updates, updatedAt: new Date().toISOString() };
      demoDataStore.saveDB(db);

      if (dataConfig.isFirebase()) {
        updateDocument('subjects', id, { ...updates, updatedAt: new Date().toISOString() }).catch((err) =>
          console.error('[FIREBASE] Failed to update master subject in Firestore:', err)
        );
      }

      return db.masterSubjects[idx];
    }
    return null;
  },

  deleteMasterSubject(id: string): boolean {
    const db = demoDataStore.getDB();
    db.masterSubjects = db.masterSubjects || [];
    const idx = db.masterSubjects.findIndex((s) => s.id === id);
    if (idx !== -1) {
      db.masterSubjects.splice(idx, 1);
      demoDataStore.saveDB(db);

      if (dataConfig.isFirebase()) {
        deleteDocument('subjects', id).catch((err) =>
          console.error('[FIREBASE] Failed to delete master subject in Firestore:', err)
        );
      }

      return true;
    }
    return false;
  },

  // --- SUBJECT MANAGEMENT (SESSION & CLASS SPECIFIC) ---
  getSubjects(className: string, sessionId?: string): SchoolSubjectRecord[] {
    if (dataConfig.isFirebase()) {
      queryDocuments<SchoolSubjectRecord>('classSubjects').then((csList) => {
        if (csList && csList.length > 0) {
          const db = demoDataStore.getDB();
          db.schoolSubjects = csList;
          demoDataStore.saveDB(db);
        }
      }).catch((err) => console.warn('[FIREBASE] Error fetching class subjects:', err));
    }
    const db = demoDataStore.getDB();
    const sid = sessionId || this.getActiveSessionId();
    const cleanClass = className.trim().split('-')[0].trim();
    const allSubjects = db.schoolSubjects || [];

    return allSubjects.filter((sub) => {
      const matchSession = !sub.academicSessionId || sub.academicSessionId === sid;
      const matchClass = sub.className.toLowerCase() === cleanClass.toLowerCase() || sub.className.toLowerCase() === className.toLowerCase();
      return matchSession && matchClass;
    });
  },

  addSubject(subject: Omit<SchoolSubjectRecord, 'id'>): SchoolSubjectRecord {
    const db = demoDataStore.getDB();
    db.schoolSubjects = db.schoolSubjects || [];
    const sid = subject.academicSessionId || this.getActiveSessionId();
    const cleanClass = subject.className.trim().split('-')[0].trim();
    
    const id = `SUB-${sid}-${cleanClass.replace(/\s+/g, '')}-${subject.name.replace(/\s+/g, '').toUpperCase()}`;
    const newSub: SchoolSubjectRecord = {
      ...subject,
      id,
      academicSessionId: sid,
      className: cleanClass,
      maxMarks: subject.maxMarks || 100,
      passingMarks: subject.passingMarks || 33,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const existingIdx = db.schoolSubjects.findIndex((s) => s.id === id || (s.academicSessionId === sid && s.className.toLowerCase() === cleanClass.toLowerCase() && s.name.toLowerCase() === subject.name.toLowerCase()));
    if (existingIdx !== -1) {
      db.schoolSubjects[existingIdx] = { ...db.schoolSubjects[existingIdx], ...newSub };
    } else {
      db.schoolSubjects.push(newSub);
    }

    demoDataStore.saveDB(db);

    if (dataConfig.isFirebase()) {
      createDocument('classSubjects', newSub, id).catch((err) =>
        console.error('[FIREBASE] Failed to add class subject in Firestore:', err)
      );
    }

    return newSub;
  },

  updateSubject(subjectId: string, updates: Partial<SchoolSubjectRecord>): SchoolSubjectRecord | null {
    const db = demoDataStore.getDB();
    db.schoolSubjects = db.schoolSubjects || [];
    const idx = db.schoolSubjects.findIndex((s) => s.id === subjectId);
    if (idx !== -1) {
      db.schoolSubjects[idx] = {
        ...db.schoolSubjects[idx],
        ...updates,
        updatedAt: new Date().toISOString()
      };
      demoDataStore.saveDB(db);

      if (dataConfig.isFirebase()) {
        updateDocument('classSubjects', subjectId, { ...updates, updatedAt: new Date().toISOString() }).catch((err) =>
          console.error('[FIREBASE] Failed to update class subject in Firestore:', err)
        );
      }

      return db.schoolSubjects[idx];
    }
    return null;
  },

  checkSubjectUsage(subjectId: string): { isUsedInMarks: boolean; isUsedInExamSchedule: boolean; count: number } {
    const db = demoDataStore.getDB();
    const sub = (db.schoolSubjects || []).find((s) => s.id === subjectId);
    const subName = sub ? sub.name.toLowerCase() : '';

    let marksCount = 0;
    (db.marks || []).forEach((m: any) => {
      if ((m.subjectId && m.subjectId === subjectId) || (m.subject && m.subject.toLowerCase() === subName)) {
        marksCount++;
      }
    });

    let scheduleCount = 0;
    (db.examSchedules || []).forEach((es: any) => {
      if ((es.subjectId && es.subjectId === subjectId) || (es.subject && es.subject.toLowerCase() === subName)) {
        scheduleCount++;
      }
    });

    return {
      isUsedInMarks: marksCount > 0,
      isUsedInExamSchedule: scheduleCount > 0,
      count: marksCount + scheduleCount
    };
  },

  deleteSubject(subjectId: string): boolean {
    const db = demoDataStore.getDB();
    db.schoolSubjects = db.schoolSubjects || [];
    const idx = db.schoolSubjects.findIndex((s) => s.id === subjectId);
    if (idx !== -1) {
      db.schoolSubjects.splice(idx, 1);
      demoDataStore.saveDB(db);

      if (dataConfig.isFirebase()) {
        deleteDocument('classSubjects', subjectId).catch((err) =>
          console.error('[FIREBASE] Failed to delete class subject in Firestore:', err)
        );
      }

      return true;
    }
    return false;
  },

  // --- EXAMINATIONS MODULE ---
  getExams(sessionId?: string): SchoolExamRecord[] {
    if (dataConfig.isFirebase()) {
      queryDocuments<SchoolExamRecord>('exams').then((examList) => {
        if (examList && examList.length > 0) {
          const db = demoDataStore.getDB();
          db.exams = examList;
          demoDataStore.saveDB(db);
        }
      }).catch((err) => console.warn('[FIREBASE] Error fetching exams:', err));
    }
    const db = demoDataStore.getDB();
    const sid = sessionId || this.getActiveSessionId();
    const exams = db.exams || [];
    return exams.filter((e: any) => !e.academicSessionId || e.academicSessionId === sid);
  },

  addExam(exam: Omit<SchoolExamRecord, 'id'>): SchoolExamRecord {
    const db = demoDataStore.getDB();
    db.exams = db.exams || [];
    const sid = exam.academicSessionId || this.getActiveSessionId();
    const id = `EXAM-${sid}-${exam.shortName.replace(/\s+/g, '-').toUpperCase()}-${Date.now().toString().slice(-4)}`;

    const newExam: SchoolExamRecord = {
      ...exam,
      id,
      academicSessionId: sid,
      status: exam.status || 'Scheduled',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    db.exams.push(newExam);
    demoDataStore.saveDB(db);

    if (dataConfig.isFirebase()) {
      createDocument('exams', newExam, id).catch((err) =>
        console.error('[FIREBASE] Failed to add exam to Firestore:', err)
      );
    }

    return newExam;
  },

  updateExam(examId: string, updates: Partial<SchoolExamRecord>): SchoolExamRecord | null {
    const db = demoDataStore.getDB();
    db.exams = db.exams || [];
    const idx = db.exams.findIndex((e: any) => e.id === examId);
    if (idx !== -1) {
      db.exams[idx] = { ...db.exams[idx], ...updates, updatedAt: new Date().toISOString() };
      demoDataStore.saveDB(db);

      if (dataConfig.isFirebase()) {
        updateDocument('exams', examId, { ...updates, updatedAt: new Date().toISOString() }).catch((err) =>
          console.error('[FIREBASE] Failed to update exam in Firestore:', err)
        );
      }

      return db.exams[idx];
    }
    return null;
  },

  deleteExam(examId: string): boolean {
    const db = demoDataStore.getDB();
    db.exams = db.exams || [];
    const idx = db.exams.findIndex((e: any) => e.id === examId);
    if (idx !== -1) {
      db.exams.splice(idx, 1);
      db.examSchedules = (db.examSchedules || []).filter((es: any) => es.examId !== examId);
      db.admitCards = (db.admitCards || []).filter((ac: any) => ac.examId !== examId);
      demoDataStore.saveDB(db);

      if (dataConfig.isFirebase()) {
        deleteDocument('exams', examId).catch((err) =>
          console.error('[FIREBASE] Failed to delete exam in Firestore:', err)
        );
      }

      return true;
    }
    return false;
  },

  // --- EXAM SUBJECT SCHEDULE MAPPING ---
  getExamSchedules(params: { sessionId?: string; examId?: string; className?: string; section?: string }): SchoolExamSubjectSchedule[] {
    if (dataConfig.isFirebase()) {
      queryDocuments<SchoolExamSubjectSchedule>('examSubjects').then((schList) => {
        if (schList && schList.length > 0) {
          const db = demoDataStore.getDB();
          db.examSchedules = schList;
          demoDataStore.saveDB(db);
        }
      }).catch((err) => console.warn('[FIREBASE] Error fetching exam subjects/schedules:', err));
    }
    const db = demoDataStore.getDB();
    const sid = params.sessionId || this.getActiveSessionId();
    const rawClass = params.className ? params.className.trim().split('-')[0].trim() : '';

    return (db.examSchedules || []).filter((s: any) => {
      if (s.academicSessionId && s.academicSessionId !== sid) return false;
      if (params.examId && s.examId !== params.examId && s.examName !== params.examId) return false;
      if (rawClass) {
        const sClass = (s.className || '').trim().split('-')[0].trim();
        if (sClass.toLowerCase() !== rawClass.toLowerCase()) return false;
      }
      if (params.section && s.section && s.section !== 'All' && s.section.toUpperCase() !== params.section.toUpperCase()) {
        return false;
      }
      return true;
    });
  },

  saveExamSchedule(scheduleItem: Omit<SchoolExamSubjectSchedule, 'id'> & { id?: string }): SchoolExamSubjectSchedule {
    const db = demoDataStore.getDB();
    db.examSchedules = db.examSchedules || [];
    const id = scheduleItem.id || `SCH-${scheduleItem.examId}-${scheduleItem.className.replace(/\s+/g, '')}-${scheduleItem.subjectName.replace(/\s+/g, '')}`;

    const record: SchoolExamSubjectSchedule = {
      ...scheduleItem,
      id,
      subjectName: scheduleItem.subjectName,
      maxMarks: scheduleItem.maxMarks || 100,
      passingMarks: scheduleItem.passingMarks || 33
    };

    const existingIdx = db.examSchedules.findIndex((s: any) => s.id === id);
    if (existingIdx !== -1) {
      db.examSchedules[existingIdx] = record;
    } else {
      db.examSchedules.push(record);
    }

    demoDataStore.saveDB(db);

    if (dataConfig.isFirebase()) {
      createDocument('examSubjects', record, id).catch((err) =>
        console.error('[FIREBASE] Failed to save exam schedule in Firestore:', err)
      );
    }

    return record;
  },

  deleteExamSchedule(scheduleId: string): boolean {
    const db = demoDataStore.getDB();
    db.examSchedules = db.examSchedules || [];
    const idx = db.examSchedules.findIndex((s: any) => s.id === scheduleId);
    if (idx !== -1) {
      db.examSchedules.splice(idx, 1);
      demoDataStore.saveDB(db);

      if (dataConfig.isFirebase()) {
        deleteDocument('examSubjects', scheduleId).catch((err) =>
          console.error('[FIREBASE] Failed to delete exam schedule in Firestore:', err)
        );
      }

      return true;
    }
    return false;
  },

  // --- ADMIT CARD MANAGEMENT ---
  getAdmitCards(params: { sessionId?: string; examId?: string; className?: string; section?: string; status?: string }): SchoolAdmitCardRecord[] {
    if (dataConfig.isFirebase()) {
      queryDocuments<SchoolAdmitCardRecord>('admitCards').then((acList) => {
        if (acList && acList.length > 0) {
          const db = demoDataStore.getDB();
          db.admitCards = acList;
          demoDataStore.saveDB(db);
        }
      }).catch((err) => console.warn('[FIREBASE] Error fetching admitCards:', err));
    }
    const db = demoDataStore.getDB();
    const sid = params.sessionId || this.getActiveSessionId();
    const rawClass = params.className ? params.className.trim().split('-')[0].trim() : '';

    return (db.admitCards || []).filter((ac: SchoolAdmitCardRecord) => {
      if (ac.academicSessionId && ac.academicSessionId !== sid) return false;
      if (params.examId && params.examId !== 'All' && ac.examId !== params.examId && ac.examName !== params.examId) return false;
      if (rawClass && rawClass !== 'All') {
        const acClass = (ac.className || '').trim().split('-')[0].trim();
        if (acClass.toLowerCase() !== rawClass.toLowerCase()) return false;
      }
      if (params.section && params.section !== 'All' && ac.section.toUpperCase() !== params.section.toUpperCase()) return false;
      if (params.status && params.status !== 'All' && ac.status !== params.status) return false;
      return true;
    });
  },

  generateAdmitCards(params: {
    studentIds: string[];
    examId: string;
    examName: string;
    sessionId?: string;
    examCentre?: string;
    reportingTime?: string;
    instructions?: string;
    selectedSubjectIds?: string[];
    sittingFilter?: 'All Sittings' | 'First Sitting' | 'Second Sitting';
  }): { count: number } {
    const db = demoDataStore.getDB();
    db.admitCards = db.admitCards || [];
    const sid = params.sessionId || this.getActiveSessionId();
    let count = 0;

    const allStudents = db.students || [];

    params.studentIds.forEach((stuId) => {
      const stu = allStudents.find((s: any) => s.id === stuId || s.admissionNo === stuId);
      if (stu) {
        const cName = stu.className ? stu.className.split('-')[0].trim() : 'Class 5';
        const sName = stu.section || (stu.className && stu.className.includes('-') ? stu.className.split('-')[1].trim() : 'A');

        const existingIdx = db.admitCards.findIndex(
          (ac) => ac.studentId === stu.id && (ac.examId === params.examId || ac.examName === params.examName) && ac.academicSessionId === sid
        );

        const cardId = existingIdx !== -1 ? db.admitCards[existingIdx].id : `ADC-${stu.id}-${params.examId}`;

        const cardRecord: SchoolAdmitCardRecord = {
          id: cardId,
          studentId: stu.id,
          studentName: stu.name,
          fatherName: stu.fatherName || 'Sri ' + stu.name.split(' ')[0] + ' Father',
          motherName: stu.motherName || 'Smt ' + stu.name.split(' ')[0] + ' Mother',
          dob: stu.dob || stu.dateOfBirth || '2015-05-15',
          photo: stu.photo || 'https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&q=80&w=200',
          admissionNo: stu.admissionNo,
          className: cName,
          section: sName,
          rollNo: stu.rollNo || 1,
          examId: params.examId,
          examName: params.examName,
          academicSessionId: sid,
          examCentre: params.examCentre || 'Adarsh Vidya Mandir, Kajraili, Bhagalpur',
          reportingTime: params.reportingTime || '08:30 AM',
          instructions: params.instructions || '1. Bring original admit card every exam day.\n2. Reach reporting room by 08:30 AM.\n3. Mobile phones and electronic devices prohibited.\n4. Follow examination rules and invigilator instructions.',
          selectedSubjectIds: params.selectedSubjectIds,
          sittingFilter: params.sittingFilter || 'All Sittings',
          status: 'Generated',
          createdAt: existingIdx !== -1 ? db.admitCards[existingIdx].createdAt : new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };

        if (existingIdx !== -1) {
          db.admitCards[existingIdx] = cardRecord;
        } else {
          db.admitCards.push(cardRecord);
        }
        count++;

        if (dataConfig.isFirebase()) {
          createDocument('admitCards', cardRecord, cardId).catch((err) =>
            console.error('[FIREBASE] Failed to generate admit card in Firestore:', err)
          );
        }
      }
    });

    demoDataStore.saveDB(db);
    return { count };
  },

  updateAdmitCardStatus(admitCardIds: string[], status: 'Draft' | 'Generated' | 'Published' | 'Cancelled'): number {
    const db = demoDataStore.getDB();
    db.admitCards = db.admitCards || [];
    let updatedCount = 0;

    db.admitCards.forEach((ac) => {
      if (admitCardIds.includes(ac.id)) {
        ac.status = status;
        ac.updatedAt = new Date().toISOString();
        updatedCount++;

        if (dataConfig.isFirebase()) {
          updateDocument('admitCards', ac.id, { status, updatedAt: ac.updatedAt }).catch((err) =>
            console.error('[FIREBASE] Failed to update admit card status in Firestore:', err)
          );
        }
      }
    });

    demoDataStore.saveDB(db);
    return updatedCount;
  }
};
