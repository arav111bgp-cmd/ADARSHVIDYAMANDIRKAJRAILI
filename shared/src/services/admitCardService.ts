import { demoDataStore, SchoolAdmitCardRecord } from './demoDataStore';
import { apiFetch } from './api';

export const admitCardService = {
  async getAdmitCard(studentId: string, examName?: string): Promise<SchoolAdmitCardRecord | null> {
    try {
      const db = demoDataStore.getDB();
      const records = db.admitCards || [];
      const match = records.find(
        (a: SchoolAdmitCardRecord) =>
          a.studentId === studentId &&
          a.status === 'Published' &&
          (!examName || a.examName === examName || a.examId === examName)
      );
      if (match) return match;
    } catch (e) {
      console.warn('admitCardService.getAdmitCard error:', e);
    }
    return null;
  },

  getAllAdmitCards(): SchoolAdmitCardRecord[] {
    const db = demoDataStore.getDB();
    return db.admitCards || [];
  },

  saveAdmitCard(record: SchoolAdmitCardRecord): SchoolAdmitCardRecord {
    const db = demoDataStore.getDB();
    db.admitCards = db.admitCards || [];
    const idx = db.admitCards.findIndex((a) => a.id === record.id);
    if (idx !== -1) {
      db.admitCards[idx] = { ...db.admitCards[idx], ...record, updatedAt: new Date().toISOString() };
    } else {
      db.admitCards.push({ ...record, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() });
    }
    demoDataStore.saveDB(db);
    return record;
  },

  bulkGenerateAdmitCards(params: {
    students: any[];
    examName: string;
    academicSessionId: string;
    examCentre: string;
    reportingTime: string;
    instructions: string;
  }): { count: number } {
    const db = demoDataStore.getDB();
    db.admitCards = db.admitCards || [];
    let generatedCount = 0;

    params.students.forEach((stu) => {
      const cName = stu.className ? stu.className.split('-')[0] : 'Class 5';
      const sName = stu.section || (stu.className && stu.className.includes('-') ? stu.className.split('-')[1] : 'A');

      const existingIdx = db.admitCards.findIndex(
        (a) =>
          (a.studentId === stu.id || a.admissionNo === stu.admissionNo) &&
          (a.examName === params.examName || a.examId === params.examName) &&
          (a.academicSessionId || '2026-27') === params.academicSessionId
      );

      const recordObj: SchoolAdmitCardRecord = {
        id: existingIdx !== -1 ? db.admitCards[existingIdx].id : `ADC-${stu.id || stu.admissionNo}-${Date.now().toString().slice(-4)}`,
        studentId: stu.id,
        studentName: stu.name,
        admissionNo: stu.admissionNo,
        className: cName,
        section: sName,
        rollNo: stu.rollNo || 1,
        examId: params.examName,
        examName: params.examName,
        academicSessionId: params.academicSessionId,
        examCentre: params.examCentre || 'Adarsh Vidya Mandir, Kajraili, Bhagalpur',
        reportingTime: params.reportingTime || '08:30 AM',
        instructions: params.instructions || '1. Bring original admit card every exam day.\n2. Reach reporting room by 08:30 AM.',
        status: 'Generated',
        createdAt: existingIdx !== -1 ? db.admitCards[existingIdx].createdAt : new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      if (existingIdx !== -1) {
        db.admitCards[existingIdx] = recordObj;
      } else {
        db.admitCards.push(recordObj);
      }
      generatedCount++;
    });

    demoDataStore.saveDB(db);
    return { count: generatedCount };
  }
};
