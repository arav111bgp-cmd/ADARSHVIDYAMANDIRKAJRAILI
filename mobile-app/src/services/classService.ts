import { demoDataStore } from './demoDataStore';
import { apiFetch } from './api';

export interface AVMClass {
  id: string;        // e.g. "nursery-a", "class-5-a"
  name: string;      // e.g. "Nursery-A", "Class 5-A"
  grade: string;     // e.g. "Nursery", "Class 5"
  section: string;   // "A"
  isEarlyYears: boolean;
}

export const SCHOOL_CLASSES: AVMClass[] = [
  { id: 'nursery-a', name: 'Nursery-A', grade: 'Nursery', section: 'A', isEarlyYears: true },
  { id: 'lkg-a', name: 'LKG-A', grade: 'LKG', section: 'A', isEarlyYears: true },
  { id: 'ukg-a', name: 'UKG-A', grade: 'UKG', section: 'A', isEarlyYears: true },
  { id: 'class-1-a', name: 'Class 1-A', grade: 'Class 1', section: 'A', isEarlyYears: false },
  { id: 'class-2-a', name: 'Class 2-A', grade: 'Class 2', section: 'A', isEarlyYears: false },
  { id: 'class-3-a', name: 'Class 3-A', grade: 'Class 3', section: 'A', isEarlyYears: false },
  { id: 'class-4-a', name: 'Class 4-A', grade: 'Class 4', section: 'A', isEarlyYears: false },
  { id: 'class-5-a', name: 'Class 5-A', grade: 'Class 5', section: 'A', isEarlyYears: false },
  { id: 'class-6-a', name: 'Class 6-A', grade: 'Class 6', section: 'A', isEarlyYears: false },
  { id: 'class-7-a', name: 'Class 7-A', grade: 'Class 7', section: 'A', isEarlyYears: false },
  { id: 'class-8-a', name: 'Class 8-A', grade: 'Class 8', section: 'A', isEarlyYears: false }
];

export const AVM_CLASSES = SCHOOL_CLASSES;
export const AVM_SECTIONS = ['A', 'B', 'C', 'D', 'E'];

export const classService = {
  getMasterClasses(): AVMClass[] {
    return this.getAllClasses();
  },

  getAllClasses(): AVMClass[] {
    const list: AVMClass[] = [];
    const idSet = new Set<string>();

    try {
      const db = demoDataStore.getDB();
      if (db && Array.isArray(db.schoolClasses) && db.schoolClasses.length > 0) {
        db.schoolClasses.forEach((clsRecord) => {
          if (clsRecord.status !== 'Inactive') {
            (clsRecord.sections || []).forEach((sec) => {
              const sName = (sec.section || sec.name || 'A').toUpperCase();
              if (sec.status !== 'Inactive' && sName === 'A') {
                const fullName = `${clsRecord.name}-A`;
                const classId = `${clsRecord.name.toLowerCase().replace(/\s+/g, '-')}-a`;
                if (!idSet.has(classId)) {
                  idSet.add(classId);
                  list.push({
                    id: classId,
                    name: fullName,
                    grade: clsRecord.name,
                    section: 'A',
                    isEarlyYears: this.isEarlyYears(clsRecord.name)
                  });
                }
              }
            });
          }
        });
      }
    } catch (e) {
      console.warn('classService reading demoDataStore failed:', e);
    }

    SCHOOL_CLASSES.forEach((sc) => {
      if (!idSet.has(sc.id)) {
        idSet.add(sc.id);
        list.push(sc);
      }
    });

    return list;
  },

  getSections(): string[] {
    return ['A'];
  },

  getTeacherClasses(assignedClasses?: string[]): AVMClass[] {
    // In DEMO/TEST mode, return all 11 classes (Nursery-A to Class 8-A) + dynamic admin classes
    return this.getAllClasses();
  },

  getClassById(id: string): AVMClass | undefined {
    if (!id) return undefined;
    const norm = id.trim().toLowerCase();
    return SCHOOL_CLASSES.find((c) => c.id.toLowerCase() === norm || c.name.toLowerCase() === norm);
  },

  getClassByName(name: string): AVMClass | undefined {
    if (!name) return undefined;
    const clean = name.trim().toLowerCase();
    
    // Direct match by name or grade
    const direct = SCHOOL_CLASSES.find((c) =>
      c.name.toLowerCase() === clean ||
      c.grade.toLowerCase() === clean ||
      c.id.toLowerCase() === clean
    );
    if (direct) return direct;

    // Search by grade number if format is "Class X" or "X"
    if (clean.includes('nursery')) return SCHOOL_CLASSES.find((c) => c.id === 'nursery-a');
    if (clean.includes('lkg')) return SCHOOL_CLASSES.find((c) => c.id === 'lkg-a');
    if (clean.includes('ukg')) return SCHOOL_CLASSES.find((c) => c.id === 'ukg-a');

    const digitMatch = clean.match(/\d+/);
    if (digitMatch) {
      const num = digitMatch[0];
      return SCHOOL_CLASSES.find((c) => c.id === `class-${num}-a`);
    }

    return undefined;
  },

  isEarlyYears(classNameOrGrade: string): boolean {
    if (!classNameOrGrade) return false;
    const lower = classNameOrGrade.toLowerCase();
    return lower.includes('nursery') || lower.includes('lkg') || lower.includes('ukg');
  },

  formatClassDisplay(className?: string, section?: string): string {
    if (!className) return 'Class 5-A';
    const trimmed = className.trim();
    if (trimmed.includes('-')) {
      return trimmed;
    }
    const matched = this.getClassByName(trimmed);
    if (matched) return matched.name;
    return section ? `${trimmed}-${section}` : `${trimmed}-A`;
  },

  async getClassesFromBackend(): Promise<AVMClass[]> {
    try {
      const res = await apiFetch<any>('/api/classes');
      if (res.success && res.data && res.data.length > 0) {
        return res.data;
      }
    } catch (e) {
      console.warn('classService fallback to local SCHOOL_CLASSES:', e);
    }
    return SCHOOL_CLASSES;
  }
};
