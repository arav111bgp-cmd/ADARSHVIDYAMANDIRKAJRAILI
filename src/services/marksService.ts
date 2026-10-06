import { demoDataStore, MasterSubjectRecord, EvaluationPeriodRecord, StudentMarkRecord } from './demoDataStore';

export const DEFAULT_EVALUATIONS: EvaluationPeriodRecord[] = [
  {
    id: 'EVAL-UT1',
    name: 'Unit Test 1',
    academicSession: '2026-27',
    type: 'Unit Test',
    startDate: '2026-07-10',
    endDate: '2026-07-18',
    status: 'Active',
    description: 'First periodic assessment for Term 1'
  },
  {
    id: 'EVAL-HY',
    name: 'Half Yearly Examination',
    academicSession: '2026-27',
    type: 'Term Exam',
    startDate: '2026-09-15',
    endDate: '2026-09-28',
    status: 'Active',
    description: 'Mid-term comprehensive examination'
  },
  {
    id: 'EVAL-UT2',
    name: 'Unit Test 2',
    academicSession: '2026-27',
    type: 'Unit Test',
    startDate: '2026-12-05',
    endDate: '2026-12-15',
    status: 'Active',
    description: 'Second periodic assessment for Term 2'
  },
  {
    id: 'EVAL-ANNUAL',
    name: 'Annual Examination',
    academicSession: '2026-27',
    type: 'Annual',
    startDate: '2027-03-01',
    endDate: '2027-03-18',
    status: 'Active',
    description: 'Final annual promotional examination'
  }
];

export const DEFAULT_SUBJECTS: MasterSubjectRecord[] = [
  {
    id: 'SUB-ENG',
    name: 'English',
    code: 'ENG101',
    type: 'Theory',
    maxMarks: 100,
    passingMarks: 33,
    applicableClasses: ['All'],
    isCompulsory: true,
    status: 'Active'
  },
  {
    id: 'SUB-HIN',
    name: 'Hindi',
    code: 'HIN101',
    type: 'Theory',
    maxMarks: 100,
    passingMarks: 33,
    applicableClasses: ['All'],
    isCompulsory: true,
    status: 'Active'
  },
  {
    id: 'SUB-MATH',
    name: 'Mathematics',
    code: 'MATH101',
    type: 'Theory',
    maxMarks: 100,
    passingMarks: 33,
    applicableClasses: ['Class 1-A', 'Class 2-A', 'Class 3-A', 'Class 4-A', 'Class 5-A', 'Class 6-A', 'Class 7-A', 'Class 8-A', 'All'],
    isCompulsory: true,
    status: 'Active'
  },
  {
    id: 'SUB-SCI',
    name: 'Science',
    code: 'SCI101',
    type: 'Theory',
    maxMarks: 100,
    passingMarks: 33,
    theoryMaxMarks: 80,
    practicalMaxMarks: 20,
    applicableClasses: ['Class 3-A', 'Class 4-A', 'Class 5-A', 'Class 6-A', 'Class 7-A', 'Class 8-A', 'All'],
    isCompulsory: true,
    status: 'Active'
  },
  {
    id: 'SUB-SST',
    name: 'Social Science',
    code: 'SST101',
    type: 'Theory',
    maxMarks: 100,
    passingMarks: 33,
    applicableClasses: ['Class 3-A', 'Class 4-A', 'Class 5-A', 'Class 6-A', 'Class 7-A', 'Class 8-A', 'All'],
    isCompulsory: true,
    status: 'Active'
  },
  {
    id: 'SUB-COMP',
    name: 'Computer',
    code: 'COMP101',
    type: 'Theory',
    maxMarks: 100,
    passingMarks: 33,
    theoryMaxMarks: 70,
    practicalMaxMarks: 30,
    applicableClasses: ['Class 1-A', 'Class 2-A', 'Class 3-A', 'Class 4-A', 'Class 5-A', 'Class 6-A', 'Class 7-A', 'Class 8-A', 'All'],
    isCompulsory: true,
    status: 'Active'
  },
  {
    id: 'SUB-GK',
    name: 'General Knowledge',
    code: 'GK101',
    type: 'Activity',
    maxMarks: 100,
    passingMarks: 33,
    applicableClasses: ['All'],
    isCompulsory: false,
    status: 'Active'
  },
  {
    id: 'SUB-EVS',
    name: 'Environmental Studies',
    code: 'EVS101',
    type: 'Theory',
    maxMarks: 100,
    passingMarks: 33,
    applicableClasses: ['Class 1-A', 'Class 2-A', 'Class 3-A'],
    isCompulsory: true,
    status: 'Active'
  },
  {
    id: 'SUB-DRAW',
    name: 'Drawing & Art',
    code: 'ART101',
    type: 'Activity',
    maxMarks: 50,
    passingMarks: 17,
    applicableClasses: ['Nursery-A', 'LKG-A', 'UKG-A', 'Class 1-A', 'Class 2-A'],
    isCompulsory: false,
    status: 'Active'
  },
  {
    id: 'SUB-DEV-MOTOR',
    name: 'Fine Motor Skills',
    code: 'DEV-MOTOR',
    type: 'Developmental',
    maxMarks: 100,
    passingMarks: 33,
    applicableClasses: ['Nursery-A', 'LKG-A', 'UKG-A'],
    isCompulsory: true,
    status: 'Active'
  },
  {
    id: 'SUB-DEV-SOC',
    name: 'Social & Emotional Skills',
    code: 'DEV-SOC',
    type: 'Developmental',
    maxMarks: 100,
    passingMarks: 33,
    applicableClasses: ['Nursery-A', 'LKG-A', 'UKG-A'],
    isCompulsory: true,
    status: 'Active'
  }
];

export const marksService = {
  getEvaluations(): EvaluationPeriodRecord[] {
    const db = demoDataStore.getDB();
    if (!db.evaluationPeriods || db.evaluationPeriods.length === 0) {
      db.evaluationPeriods = [...DEFAULT_EVALUATIONS];
      demoDataStore.saveDB(db);
    }
    return db.evaluationPeriods.filter(e => e.status === 'Active');
  },

  getAllEvaluations(): EvaluationPeriodRecord[] {
    const db = demoDataStore.getDB();
    if (!db.evaluationPeriods || db.evaluationPeriods.length === 0) {
      db.evaluationPeriods = [...DEFAULT_EVALUATIONS];
      demoDataStore.saveDB(db);
    }
    return db.evaluationPeriods;
  },

  saveEvaluation(evalRecord: Partial<EvaluationPeriodRecord>): EvaluationPeriodRecord {
    const db = demoDataStore.getDB();
    if (!db.evaluationPeriods) db.evaluationPeriods = [...DEFAULT_EVALUATIONS];

    const now = new Date().toISOString();
    let saved: EvaluationPeriodRecord;

    if (evalRecord.id) {
      const idx = db.evaluationPeriods.findIndex(e => e.id === evalRecord.id);
      if (idx !== -1) {
        saved = {
          ...db.evaluationPeriods[idx],
          ...evalRecord,
          updatedAt: now
        } as EvaluationPeriodRecord;
        db.evaluationPeriods[idx] = saved;
      } else {
        saved = {
          id: evalRecord.id,
          name: evalRecord.name || 'New Evaluation',
          academicSession: evalRecord.academicSession || '2026-27',
          type: evalRecord.type || 'Term Exam',
          startDate: evalRecord.startDate || now.split('T')[0],
          endDate: evalRecord.endDate || now.split('T')[0],
          status: evalRecord.status || 'Active',
          description: evalRecord.description || '',
          createdAt: now,
          updatedAt: now
        };
        db.evaluationPeriods.push(saved);
      }
    } else {
      saved = {
        id: `EVAL-${Date.now()}`,
        name: evalRecord.name || 'New Evaluation',
        academicSession: evalRecord.academicSession || '2026-27',
        type: evalRecord.type || 'Term Exam',
        startDate: evalRecord.startDate || now.split('T')[0],
        endDate: evalRecord.endDate || now.split('T')[0],
        status: evalRecord.status || 'Active',
        description: evalRecord.description || '',
        createdAt: now,
        updatedAt: now
      };
      db.evaluationPeriods.push(saved);
    }
    demoDataStore.saveDB(db);
    return saved;
  },

  getAllMasterSubjects(): MasterSubjectRecord[] {
    const db = demoDataStore.getDB();
    if (!db.masterSubjects || db.masterSubjects.length === 0) {
      db.masterSubjects = [...DEFAULT_SUBJECTS];
      demoDataStore.saveDB(db);
    }
    return db.masterSubjects;
  },

  getSubjectsForClass(classAndSectionName: string): MasterSubjectRecord[] {
    const allSubjs = this.getAllMasterSubjects().filter(s => s.status === 'Active');
    const classLower = (classAndSectionName || '').toLowerCase().trim();
    const classNameOnly = classLower.replace(/-[a-z0-9]+$/i, '').trim();

    return allSubjs.filter(s => {
      if (!s.applicableClasses || s.applicableClasses.length === 0 || s.applicableClasses.includes('All')) {
        return true;
      }
      return s.applicableClasses.some(ac => {
        const acLower = ac.toLowerCase().trim();
        return acLower === classLower || acLower === classNameOnly || acLower === 'all';
      });
    });
  },

  saveSubject(subj: Partial<MasterSubjectRecord>): MasterSubjectRecord {
    const db = demoDataStore.getDB();
    if (!db.masterSubjects) db.masterSubjects = [...DEFAULT_SUBJECTS];

    const now = new Date().toISOString();
    let saved: MasterSubjectRecord;

    if (subj.id) {
      const idx = db.masterSubjects.findIndex(s => s.id === subj.id);
      if (idx !== -1) {
        saved = {
          ...db.masterSubjects[idx],
          ...subj,
          updatedAt: now
        } as MasterSubjectRecord;
        db.masterSubjects[idx] = saved;
      } else {
        saved = {
          id: subj.id,
          name: subj.name || 'Untitled Subject',
          code: subj.code || 'SUB',
          type: subj.type || 'Theory',
          maxMarks: Number(subj.maxMarks) || 100,
          passingMarks: Number(subj.passingMarks) || 33,
          theoryMaxMarks: subj.theoryMaxMarks ? Number(subj.theoryMaxMarks) : undefined,
          practicalMaxMarks: subj.practicalMaxMarks ? Number(subj.practicalMaxMarks) : undefined,
          applicableClasses: subj.applicableClasses && subj.applicableClasses.length > 0 ? subj.applicableClasses : ['All'],
          isCompulsory: subj.isCompulsory ?? true,
          status: subj.status || 'Active',
          createdAt: now,
          updatedAt: now
        };
        db.masterSubjects.push(saved);
      }
    } else {
      saved = {
        id: `SUB-${Date.now()}`,
        name: subj.name || 'Untitled Subject',
        code: subj.code || `SUB${Math.floor(Math.random() * 900 + 100)}`,
        type: subj.type || 'Theory',
        maxMarks: Number(subj.maxMarks) || 100,
        passingMarks: Number(subj.passingMarks) || 33,
        theoryMaxMarks: subj.theoryMaxMarks ? Number(subj.theoryMaxMarks) : undefined,
        practicalMaxMarks: subj.practicalMaxMarks ? Number(subj.practicalMaxMarks) : undefined,
        applicableClasses: subj.applicableClasses && subj.applicableClasses.length > 0 ? subj.applicableClasses : ['All'],
        isCompulsory: subj.isCompulsory ?? true,
        status: subj.status || 'Active',
        createdAt: now,
        updatedAt: now
      };
      db.masterSubjects.push(saved);
    }

    demoDataStore.saveDB(db);
    return saved;
  },

  deactivateSubject(subjectId: string): boolean {
    const db = demoDataStore.getDB();
    if (!db.masterSubjects) return false;
    const idx = db.masterSubjects.findIndex(s => s.id === subjectId);
    if (idx !== -1) {
      db.masterSubjects[idx].status = 'Inactive';
      db.masterSubjects[idx].updatedAt = new Date().toISOString();
      demoDataStore.saveDB(db);
      return true;
    }
    return false;
  },

  calculateGrade(percentage: number): string {
    if (percentage >= 90) return 'A+';
    if (percentage >= 80) return 'A';
    if (percentage >= 70) return 'B+';
    if (percentage >= 60) return 'B';
    if (percentage >= 50) return 'C';
    if (percentage >= 40) return 'D';
    return 'E';
  },

  getMarks(filters?: {
    className?: string;
    section?: string;
    evaluationId?: string;
    evaluationName?: string;
    subjectId?: string;
    subjectName?: string;
    studentId?: string;
    academicSession?: string;
  }): StudentMarkRecord[] {
    const db = demoDataStore.getDB();
    let marks: StudentMarkRecord[] = db.marks || [];

    if (!filters) return marks;

    return marks.filter(m => {
      if (filters.className && m.className.toLowerCase() !== filters.className.toLowerCase()) return false;
      if (filters.section && m.section.toLowerCase() !== filters.section.toLowerCase()) return false;
      if (filters.evaluationId && m.evaluationId !== filters.evaluationId) return false;
      if (filters.evaluationName && m.evaluationName.toLowerCase() !== filters.evaluationName.toLowerCase()) return false;
      if (filters.subjectId && m.subjectId !== filters.subjectId) return false;
      if (filters.subjectName && m.subjectName.toLowerCase() !== filters.subjectName.toLowerCase()) return false;
      if (filters.studentId && m.studentId !== filters.studentId) return false;
      if (filters.academicSession && m.academicSession !== filters.academicSession) return false;
      return true;
    });
  },

  saveMarksBatch(records: Partial<StudentMarkRecord>[], operatorName = 'Mrs. Priya Sharma', operatorId = 'EMP-T102'): StudentMarkRecord[] {
    const db = demoDataStore.getDB();
    if (!db.marks) db.marks = [];

    const now = new Date().toISOString();
    const savedList: StudentMarkRecord[] = [];

    records.forEach(r => {
      const maxMarks = Number(r.maximumMarks) || 100;
      const totalMarks = r.isAbsent ? 0 : Number(r.totalMarks !== undefined ? r.totalMarks : (r as any).marksObtained || 0);
      const percentage = maxMarks > 0 ? Math.round((totalMarks / maxMarks) * 1000) / 10 : 0;
      const grade = r.grade || this.calculateGrade(percentage);

      let status: 'PASS' | 'FAIL' | 'ABSENT' | 'NOT ENTERED' = 'PASS';
      if (r.isAbsent) {
        status = 'ABSENT';
      } else if (r.status) {
        status = r.status;
      } else {
        const passMark = (r as any).passingMarks || Math.round(maxMarks * 0.33);
        status = totalMarks >= passMark ? 'PASS' : 'FAIL';
      }

      const markId = r.markId || r.id || `MARK-${r.studentId}-${r.evaluationId || 'EVAL'}-${r.subjectId || r.subjectName || 'SUBJ'}`;

      const existingIdx = db.marks.findIndex((m: any) =>
        (m.id === markId || m.markId === markId) ||
        (m.studentId === r.studentId &&
         (m.evaluationId === r.evaluationId || m.evaluationName === r.evaluationName) &&
         (m.subjectId === r.subjectId || m.subjectName === r.subjectName))
      );

      const markRecord: StudentMarkRecord = {
        id: markId,
        markId,
        studentId: r.studentId || `STU-${Date.now()}`,
        studentName: r.studentName || 'Student',
        admissionNumber: r.admissionNumber || 'AVM2026',
        rollNumber: r.rollNumber || 0,
        classId: r.classId,
        className: r.className || 'Class 5',
        section: r.section || 'A',
        subjectId: r.subjectId || `SUB-${r.subjectName}`,
        subjectName: r.subjectName || 'Subject',
        evaluationId: r.evaluationId || 'EVAL-HY',
        evaluationName: r.evaluationName || 'Half Yearly Examination',
        academicSession: r.academicSession || '2026-27',
        theoryMarks: r.theoryMarks !== undefined ? Number(r.theoryMarks) : undefined,
        practicalMarks: r.practicalMarks !== undefined ? Number(r.practicalMarks) : undefined,
        totalMarks,
        maximumMarks: maxMarks,
        percentage,
        grade,
        status,
        isAbsent: r.isAbsent || false,
        ratings: r.ratings,
        enteredBy: existingIdx !== -1 ? db.marks[existingIdx].enteredBy || operatorName : operatorName,
        enteredByEmployeeId: operatorId,
        enteredAt: existingIdx !== -1 ? db.marks[existingIdx].enteredAt || now : now,
        updatedAt: now,
        updatedBy: operatorName
      };

      if (existingIdx !== -1) {
        db.marks[existingIdx] = { ...db.marks[existingIdx], ...markRecord };
      } else {
        db.marks.push(markRecord);
      }
      savedList.push(markRecord);
    });

    demoDataStore.saveDB(db);
    return savedList;
  },

  getStudentExamHistory(studentId: string, academicSession = '2026-27'): { evaluationName: string; evaluationId: string; marks: StudentMarkRecord[] }[] {
    const db = demoDataStore.getDB();
    const allMarks: StudentMarkRecord[] = (db.marks || []).filter((m: any) => m.studentId === studentId && (m.academicSession === academicSession || !academicSession));

    const evalMap: Record<string, StudentMarkRecord[]> = {};
    allMarks.forEach(m => {
      const key = m.evaluationName || m.evaluationId || 'General';
      if (!evalMap[key]) evalMap[key] = [];
      evalMap[key].push(m);
    });

    return Object.entries(evalMap).map(([evalName, marks]) => ({
      evaluationName: evalName,
      evaluationId: marks[0]?.evaluationId || evalName,
      marks
    }));
  },

  getClassResultSummary(className: string, section: string, evaluationName: string, subjectName?: string) {
    const marks = this.getMarks({ className, section, evaluationName, subjectName });
    if (marks.length === 0) {
      return {
        totalStudents: 0,
        averagePercentage: 0,
        highestMarks: 0,
        lowestMarks: 0,
        passedStudents: 0,
        failedStudents: 0,
        absentStudents: 0
      };
    }

    const presentMarks = marks.filter(m => !m.isAbsent && m.status !== 'ABSENT');
    const absentCount = marks.length - presentMarks.length;

    let totalObtainedSum = 0;
    let totalMaxSum = 0;
    let highest = 0;
    let lowest = presentMarks.length > 0 ? presentMarks[0].totalMarks : 0;
    let passed = 0;
    let failed = 0;

    presentMarks.forEach(m => {
      totalObtainedSum += m.totalMarks;
      totalMaxSum += m.maximumMarks;
      if (m.totalMarks > highest) highest = m.totalMarks;
      if (m.totalMarks < lowest) lowest = m.totalMarks;

      if (m.status === 'PASS') passed++;
      else failed++;
    });

    const avgPct = totalMaxSum > 0 ? Math.round((totalObtainedSum / totalMaxSum) * 1000) / 10 : 0;

    return {
      totalStudents: marks.length,
      averagePercentage: avgPct,
      highestMarks: highest,
      lowestMarks: lowest,
      passedStudents: passed,
      failedStudents: failed,
      absentStudents: absentCount
    };
  }
};
