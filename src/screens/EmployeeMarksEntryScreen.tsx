import React, { useState, useEffect, useMemo } from 'react';
import { Employee, Student } from '../types';
import { employeeService } from '../services/employeeService';
import { studentService } from '../services/studentService';
import { classService, SCHOOL_CLASSES } from '../services/classService';
import { marksService } from '../services/marksService';
import { EvaluationPeriodRecord, MasterSubjectRecord, StudentMarkRecord } from '../services/demoDataStore';
import {
  Save,
  Sparkles,
  BarChart2,
  Plus,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  XCircle,
  AlertCircle,
  UserCheck,
  UserX,
  RotateCcw,
  Search,
  Filter,
  X,
  FileSpreadsheet,
  BookOpen,
  Award
} from 'lucide-react';

interface EmployeeMarksEntryScreenProps {
  employee?: Employee;
}

export const EmployeeMarksEntryScreen: React.FC<EmployeeMarksEntryScreenProps> = ({ employee }) => {
  // 1. Central Teacher Classes & Selectors State
  const teacherClasses = useMemo(() => {
    return classService.getTeacherClasses(employee?.assignedClasses);
  }, [employee]);

  const [selectedClassObj, setSelectedClassObj] = useState(teacherClasses[0] || SCHOOL_CLASSES[7]); // Default Class 5-A
  const [evaluations, setEvaluations] = useState<EvaluationPeriodRecord[]>([]);
  const [selectedEvalId, setSelectedEvalId] = useState<string>('EVAL-HY');
  
  // Available Subjects for selected class
  const [classSubjects, setClassSubjects] = useState<MasterSubjectRecord[]>([]);
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>('SUB-MATH');

  // Active Subject details
  const activeSubject = useMemo((): MasterSubjectRecord => {
    return classSubjects.find(s => s.id === selectedSubjectId) || classSubjects[0] || {
      id: 'SUB-MATH',
      name: 'Mathematics',
      code: 'MATH101',
      type: 'Theory',
      maxMarks: 100,
      passingMarks: 33,
      theoryMaxMarks: undefined,
      practicalMaxMarks: undefined,
      applicableClasses: ['All'],
      status: 'Active'
    };
  }, [classSubjects, selectedSubjectId]);

  const activeEval = useMemo(() => {
    return evaluations.find(e => e.id === selectedEvalId) || evaluations[0] || {
      id: 'EVAL-HY',
      name: 'Half Yearly Examination',
      academicSession: '2026-27',
      type: 'Term Exam',
      status: 'Active'
    };
  }, [evaluations, selectedEvalId]);

  const isEarlyYears = classService.isEarlyYears(selectedClassObj.name) || activeSubject.type === 'Developmental';

  // 2. Students & Marks State
  const [students, setStudents] = useState<Student[]>([]);
  
  interface MarkInputState {
    theory: string;
    practical: string;
    total: string;
    isAbsent: boolean;
    rating: string;
  }
  const [marksInputs, setMarksInputs] = useState<Record<string, MarkInputState>>({});
  const [isDirty, setIsDirty] = useState<boolean>(false);
  const [saving, setSaving] = useState<boolean>(false);
  const [toastMsg, setToastMsg] = useState<{ text: string; type: 'success' | 'warning' | 'error' } | null>(null);

  // 3. Navigation Guard State
  const [pendingSelection, setPendingSelection] = useState<{ classObj?: typeof selectedClassObj; subjectId?: string; evalId?: string } | null>(null);
  const [showUnsavedModal, setShowUnsavedModal] = useState<boolean>(false);

  // 4. Modals State
  const [showAddSubjectModal, setShowAddSubjectModal] = useState<boolean>(false);
  const [showHistoryModal, setShowHistoryModal] = useState<boolean>(false);

  // Add Subject Form State
  const [newSubjName, setNewSubjName] = useState('');
  const [newSubjCode, setNewSubjCode] = useState('');
  const [newSubjType, setNewSubjType] = useState<'Theory' | 'Practical' | 'Activity' | 'Developmental'>('Theory');
  const [newSubjMax, setNewSubjMax] = useState('100');
  const [newSubjPass, setNewSubjPass] = useState('33');
  const [newSubjTheoryMax, setNewSubjTheoryMax] = useState('');
  const [newSubjPracticalMax, setNewSubjPracticalMax] = useState('');
  const [newSubjApplicable, setNewSubjApplicable] = useState<string[]>(['All']);

  // History Modal Filters & Active Tab
  const [historyTab, setHistoryTab] = useState<'all_marks' | 'student_perf' | 'class_summary'>('all_marks');
  const [histEvalFilter, setHistEvalFilter] = useState<string>('All');
  const [histClassFilter, setHistClassFilter] = useState<string>(selectedClassObj.name);
  const [histSubjectFilter, setHistSubjectFilter] = useState<string>('All');
  const [histStudentSearch, setHistStudentSearch] = useState<string>('');
  const [selectedStudentForHistory, setSelectedStudentForHistory] = useState<Student | null>(null);

  // ----------------------------------------------------
  // INITIALIZATION & DATA LOADING
  // ----------------------------------------------------
  useEffect(() => {
    const evals = marksService.getEvaluations();
    setEvaluations(evals);
    if (evals.length > 0 && !evals.some(e => e.id === selectedEvalId)) {
      setSelectedEvalId(evals[0].id);
    }
  }, []);

  // Load subjects whenever selected class changes
  useEffect(() => {
    const subjs = marksService.getSubjectsForClass(selectedClassObj.name);
    setClassSubjects(subjs);
    if (subjs.length > 0) {
      if (!subjs.some(s => s.id === selectedSubjectId)) {
        setSelectedSubjectId(subjs[0].id);
      }
    }
  }, [selectedClassObj.id, selectedClassObj.name]);

  // Load students & prefill existing saved marks
  const loadStudentsAndMarks = async () => {
    try {
      let list = await employeeService.getStudentsByClass(selectedClassObj.name, selectedClassObj.section);
      if (!list || list.length === 0) {
        const all = await studentService.getAllStudents();
        const normName = selectedClassObj.name.toLowerCase();
        list = all.filter(
          (s) =>
            s.className.toLowerCase() === normName ||
            s.className.toLowerCase() === selectedClassObj.grade.toLowerCase() ||
            s.className.toLowerCase() === selectedClassObj.id.toLowerCase()
        );
      }
      setStudents(list);

      const savedMarks = marksService.getMarks({
        className: selectedClassObj.name,
        section: selectedClassObj.section,
        evaluationId: activeEval.id,
        evaluationName: activeEval.name,
        subjectId: activeSubject.id,
        subjectName: activeSubject.name
      });

      const inputsMap: Record<string, MarkInputState> = {};
      list.forEach((stu) => {
        const existing = savedMarks.find(m => m.studentId === stu.id);
        if (existing) {
          inputsMap[stu.id] = {
            theory: existing.theoryMarks !== undefined ? String(existing.theoryMarks) : '',
            practical: existing.practicalMarks !== undefined ? String(existing.practicalMarks) : '',
            total: existing.isAbsent ? '' : String(existing.totalMarks),
            isAbsent: existing.isAbsent || existing.status === 'ABSENT',
            rating: existing.ratings?.[activeSubject.name] || '⭐ Excellent'
          };
        } else {
          inputsMap[stu.id] = {
            theory: activeSubject.theoryMaxMarks ? '65' : '',
            practical: activeSubject.practicalMaxMarks ? '18' : '',
            total: activeSubject.theoryMaxMarks || activeSubject.practicalMaxMarks ? String((65 + 18)) : '82',
            isAbsent: false,
            rating: '⭐ Excellent'
          };
        }
      });

      setMarksInputs(inputsMap);
      setIsDirty(false);
    } catch (e) {
      console.warn('Error loading students for marks entry:', e);
    }
  };

  useEffect(() => {
    loadStudentsAndMarks();
  }, [selectedClassObj.id, selectedEvalId, selectedSubjectId]);

  const showToast = (text: string, type: 'success' | 'warning' | 'error' = 'success') => {
    setToastMsg({ text, type });
    setTimeout(() => setToastMsg(null), 3000);
  };

  // ----------------------------------------------------
  // MARKS INPUT CHANGE HANDLERS & VALIDATION
  // ----------------------------------------------------
  const handleTheoryChange = (stuId: string, val: string) => {
    const num = parseFloat(val) || 0;
    const maxTheory = activeSubject.theoryMaxMarks || activeSubject.maxMarks;
    
    if (val !== '' && num > maxTheory) {
      showToast(`Theory marks cannot exceed ${maxTheory}`, 'warning');
      val = String(maxTheory);
    }

    setMarksInputs(prev => {
      const stuState = prev[stuId] || { theory: '', practical: '', total: '', isAbsent: false, rating: '⭐ Excellent' };
      const t = parseFloat(val) || 0;
      const p = parseFloat(stuState.practical) || 0;
      const tot = t + p;
      return {
        ...prev,
        [stuId]: {
          ...stuState,
          theory: val,
          total: String(tot)
        }
      };
    });
    setIsDirty(true);
  };

  const handlePracticalChange = (stuId: string, val: string) => {
    const num = parseFloat(val) || 0;
    const maxPrac = activeSubject.practicalMaxMarks || 20;

    if (val !== '' && num > maxPrac) {
      showToast(`Practical marks cannot exceed ${maxPrac}`, 'warning');
      val = String(maxPrac);
    }

    setMarksInputs(prev => {
      const stuState = prev[stuId] || { theory: '', practical: '', total: '', isAbsent: false, rating: '⭐ Excellent' };
      const t = parseFloat(stuState.theory) || 0;
      const p = parseFloat(val) || 0;
      const tot = t + p;
      return {
        ...prev,
        [stuId]: {
          ...stuState,
          practical: val,
          total: String(tot)
        }
      };
    });
    setIsDirty(true);
  };

  const handleTotalChange = (stuId: string, val: string) => {
    const num = parseFloat(val) || 0;
    if (val !== '' && num > activeSubject.maxMarks) {
      showToast(`Marks cannot exceed Maximum Marks (${activeSubject.maxMarks})`, 'warning');
      val = String(activeSubject.maxMarks);
    }

    setMarksInputs(prev => {
      const stuState = prev[stuId] || { theory: '', practical: '', total: '', isAbsent: false, rating: '⭐ Excellent' };
      return {
        ...prev,
        [stuId]: {
          ...stuState,
          total: val
        }
      };
    });
    setIsDirty(true);
  };

  const handleToggleAbsent = (stuId: string) => {
    setMarksInputs(prev => {
      const stuState = prev[stuId] || { theory: '', practical: '', total: '', isAbsent: false, rating: '⭐ Excellent' };
      const nextAbsent = !stuState.isAbsent;
      return {
        ...prev,
        [stuId]: {
          ...stuState,
          isAbsent: nextAbsent,
          total: nextAbsent ? '' : (stuState.total || '0')
        }
      };
    });
    setIsDirty(true);
  };

  const handleRatingChange = (stuId: string, val: string) => {
    setMarksInputs(prev => {
      const stuState = prev[stuId] || { theory: '', practical: '', total: '', isAbsent: false, rating: '⭐ Excellent' };
      return {
        ...prev,
        [stuId]: {
          ...stuState,
          rating: val
        }
      };
    });
    setIsDirty(true);
  };

  // ----------------------------------------------------
  // QUICK MARKS OPERATIONS
  // ----------------------------------------------------
  const handleFillAll = () => {
    setMarksInputs(prev => {
      const updated = { ...prev };
      students.forEach(s => {
        if (isEarlyYears) {
          updated[s.id] = { ...updated[s.id], rating: '⭐ Excellent', isAbsent: false };
        } else if (activeSubject.theoryMaxMarks && activeSubject.practicalMaxMarks) {
          updated[s.id] = { theory: '70', practical: '18', total: '88', isAbsent: false, rating: '⭐ Excellent' };
        } else {
          updated[s.id] = { theory: '', practical: '', total: '85', isAbsent: false, rating: '⭐ Excellent' };
        }
      });
      return updated;
    });
    setIsDirty(true);
    showToast('Filled demo marks for all students');
  };

  const handleClearAll = () => {
    setMarksInputs(prev => {
      const updated = { ...prev };
      students.forEach(s => {
        updated[s.id] = { theory: '', practical: '', total: '', isAbsent: false, rating: '⭐ Excellent' };
      });
      return updated;
    });
    setIsDirty(true);
    showToast('Cleared all marks entries', 'warning');
  };

  // ----------------------------------------------------
  // SAVE MARKS HANDLER
  // ----------------------------------------------------
  const handleSaveMarks = async (andNextSubject = false): Promise<boolean> => {
    if (students.length === 0) return false;
    setSaving(true);

    try {
      const recordsToSave: Partial<StudentMarkRecord>[] = students.map(stu => {
        const inp = marksInputs[stu.id] || { theory: '', practical: '', total: '0', isAbsent: false, rating: '⭐ Excellent' };
        
        let totalVal = parseFloat(inp.total) || 0;
        let theoryVal = inp.theory !== '' ? parseFloat(inp.theory) : undefined;
        let practicalVal = inp.practical !== '' ? parseFloat(inp.practical) : undefined;

        if (theoryVal !== undefined || practicalVal !== undefined) {
          totalVal = (theoryVal || 0) + (practicalVal || 0);
        }

        const ratingsMap = isEarlyYears ? { [activeSubject.name]: inp.rating } : undefined;

        return {
          studentId: stu.id,
          studentName: stu.name,
          admissionNumber: stu.admissionNo || 'AVM2026',
          rollNumber: stu.rollNo || 0,
          className: selectedClassObj.name,
          section: selectedClassObj.section,
          subjectId: activeSubject.id,
          subjectName: activeSubject.name,
          evaluationId: activeEval.id,
          evaluationName: activeEval.name,
          academicSession: activeEval.academicSession || '2026-27',
          theoryMarks: theoryVal,
          practicalMarks: practicalVal,
          totalMarks: totalVal,
          maximumMarks: activeSubject.maxMarks,
          isAbsent: inp.isAbsent,
          ratings: ratingsMap
        };
      });

      marksService.saveMarksBatch(
        recordsToSave,
        employee?.name || 'Mrs. Priya Sharma',
        employee?.id || 'EMP-T102'
      );

      setSaving(false);
      setIsDirty(false);
      showToast(`Marks for ${activeSubject.name} saved successfully!`, 'success');

      if (andNextSubject) {
        handleNavigateSubject('next');
      }
      return true;
    } catch (e) {
      console.error('Error saving marks:', e);
      setSaving(false);
      showToast('Failed to save marks', 'error');
      return false;
    }
  };

  // ----------------------------------------------------
  // SUBJECT NAVIGATION (Prev / Next Sequence)
  // ----------------------------------------------------
  const handleNavigateSubject = (direction: 'prev' | 'next') => {
    if (classSubjects.length === 0) return;
    const currentIdx = classSubjects.findIndex(s => s.id === selectedSubjectId);
    let targetIdx = direction === 'next' ? currentIdx + 1 : currentIdx - 1;

    if (targetIdx < 0) targetIdx = classSubjects.length - 1;
    if (targetIdx >= classSubjects.length) targetIdx = 0;

    const nextSubj = classSubjects[targetIdx];

    if (isDirty) {
      setPendingSelection({ subjectId: nextSubj.id });
      setShowUnsavedModal(true);
    } else {
      setSelectedSubjectId(nextSubj.id);
    }
  };

  const handleSelectClassWithGuard = (classObj: typeof selectedClassObj) => {
    if (classObj.id === selectedClassObj.id) return;
    if (isDirty) {
      setPendingSelection({ classObj });
      setShowUnsavedModal(true);
    } else {
      setSelectedClassObj(classObj);
    }
  };

  const handleSelectSubjectWithGuard = (subjId: string) => {
    if (subjId === selectedSubjectId) return;
    if (isDirty) {
      setPendingSelection({ subjectId: subjId });
      setShowUnsavedModal(true);
    } else {
      setSelectedSubjectId(subjId);
    }
  };

  const confirmUnsavedModalAction = async (action: 'save' | 'discard') => {
    setShowUnsavedModal(false);
    if (action === 'save') {
      const ok = await handleSaveMarks(false);
      if (!ok) return;
    }

    if (pendingSelection) {
      if (pendingSelection.classObj) setSelectedClassObj(pendingSelection.classObj);
      if (pendingSelection.subjectId) setSelectedSubjectId(pendingSelection.subjectId);
      if (pendingSelection.evalId) setSelectedEvalId(pendingSelection.evalId);
      setPendingSelection(null);
    }
    setIsDirty(false);
  };

  // ----------------------------------------------------
  // ADD SUBJECT FORM HANDLER
  // ----------------------------------------------------
  const handleSaveNewSubject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSubjName.trim()) {
      showToast('Please enter subject name', 'warning');
      return;
    }

    const saved = marksService.saveSubject({
      name: newSubjName.trim(),
      code: newSubjCode.trim() || `SUB-${Date.now()}`,
      type: newSubjType,
      maxMarks: Number(newSubjMax) || 100,
      passingMarks: Number(newSubjPass) || 33,
      theoryMaxMarks: newSubjTheoryMax ? Number(newSubjTheoryMax) : undefined,
      practicalMaxMarks: newSubjPracticalMax ? Number(newSubjPracticalMax) : undefined,
      applicableClasses: newSubjApplicable.length > 0 ? newSubjApplicable : ['All'],
      status: 'Active'
    });

    setShowAddSubjectModal(false);
    showToast(`Subject "${saved.name}" created successfully!`);

    const subjs = marksService.getSubjectsForClass(selectedClassObj.name);
    setClassSubjects(subjs);
    setSelectedSubjectId(saved.id);

    setNewSubjName('');
    setNewSubjCode('');
    setNewSubjMax('100');
    setNewSubjPass('33');
    setNewSubjTheoryMax('');
    setNewSubjPracticalMax('');
  };

  const allSavedMarksHistory = useMemo(() => {
    return marksService.getMarks({
      className: histClassFilter !== 'All' ? histClassFilter : undefined,
      evaluationName: histEvalFilter !== 'All' ? histEvalFilter : undefined,
      subjectName: histSubjectFilter !== 'All' ? histSubjectFilter : undefined
    });
  }, [histClassFilter, histEvalFilter, histSubjectFilter, showHistoryModal]);

  const classSummaryMetrics = useMemo(() => {
    return marksService.getClassResultSummary(
      selectedClassObj.name,
      selectedClassObj.section,
      activeEval.name,
      activeSubject.name
    );
  }, [selectedClassObj.name, selectedClassObj.section, activeEval.name, activeSubject.name, showHistoryModal]);

  return (
    <div style={{ padding: '16px 16px 90px 16px', display: 'flex', flexDirection: 'column', gap: 16 }}>
      {toastMsg && (
        <div style={{
          position: 'fixed',
          top: 16,
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 9999,
          backgroundColor: toastMsg.type === 'success' ? '#16A34A' : toastMsg.type === 'warning' ? '#F59E0B' : '#DC2626',
          color: '#FFF',
          padding: '10px 18px',
          borderRadius: 24,
          fontSize: 13,
          fontWeight: 700,
          boxShadow: '0 8px 24px rgba(0,0,0,0.2)',
          display: 'flex',
          alignItems: 'center',
          gap: 8
        }}>
          {toastMsg.type === 'success' && <CheckCircle2 size={16} />}
          {toastMsg.type === 'warning' && <AlertCircle size={16} />}
          {toastMsg.type === 'error' && <XCircle size={16} />}
          {toastMsg.text}
        </div>
      )}

      {/* Top Title Bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h2 style={{ fontSize: 18, fontWeight: 800, color: '#172033', margin: 0 }}>
            {isEarlyYears ? 'Developmental Assessment ERP' : 'Marks Entry Module'}
          </h2>
          <p style={{ fontSize: 12, color: '#667085', margin: 0, marginTop: 2 }}>
            Teacher: <strong>{employee?.name || 'Mrs. Priya Sharma'}</strong>
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <button
            onClick={() => setShowAddSubjectModal(true)}
            className="avm-btn-secondary"
            style={{ padding: '6px 10px', fontSize: 11, display: 'flex', alignItems: 'center', gap: 4, borderRadius: 8 }}
          >
            <Plus size={14} /> Subject
          </button>
          <button
            onClick={() => setShowHistoryModal(true)}
            style={{
              padding: '6px 12px',
              fontSize: 11,
              fontWeight: 700,
              backgroundColor: '#1E3A8A',
              color: '#FFF',
              border: 'none',
              borderRadius: 8,
              display: 'flex',
              alignItems: 'center',
              gap: 4,
              cursor: 'pointer'
            }}
          >
            <BarChart2 size={14} /> History
          </button>
        </div>
      </div>

      {/* Selectors Card */}
      <div className="avm-card" style={{ padding: 14, display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div>
          <label style={{ fontSize: 11, fontWeight: 700, color: '#475569', display: 'block', marginBottom: 4 }}>
            Evaluation Period / Exam
          </label>
          <select
            className="avm-input"
            value={selectedEvalId}
            onChange={(e) => {
              const val = e.target.value;
              if (isDirty) {
                setPendingSelection({ evalId: val });
                setShowUnsavedModal(true);
              } else {
                setSelectedEvalId(val);
              }
            }}
            style={{ fontWeight: 700, color: '#1E3A8A' }}
          >
            {evaluations.map((ev) => (
              <option key={ev.id} value={ev.id}>
                {ev.name} ({ev.academicSession})
              </option>
            ))}
          </select>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          <div>
            <label style={{ fontSize: 11, fontWeight: 700, color: '#475569', display: 'block', marginBottom: 4 }}>
              Assigned Class & Section
            </label>
            <select
              className="avm-input"
              value={selectedClassObj.id}
              onChange={(e) => {
                const found = teacherClasses.find((c) => c.id === e.target.value);
                if (found) handleSelectClassWithGuard(found);
              }}
              style={{ fontWeight: 700 }}
            >
              {teacherClasses.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label style={{ fontSize: 11, fontWeight: 700, color: '#475569', display: 'block', marginBottom: 4 }}>
              {isEarlyYears ? 'Developmental Skill' : 'Subject'}
            </label>
            <select
              className="avm-input"
              value={selectedSubjectId}
              onChange={(e) => handleSelectSubjectWithGuard(e.target.value)}
              style={{ fontWeight: 700, color: '#F97316' }}
            >
              {classSubjects.map((s) => (
                <option key={s.id} value={s.id}>{s.name} ({s.code})</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Horizontal Subject Sequence Tabs */}
      {classSubjects.length > 0 && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <button
            onClick={() => handleNavigateSubject('prev')}
            style={{
              padding: 8,
              borderRadius: 8,
              border: '1px solid #E2E8F0',
              backgroundColor: '#FFF',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <ChevronLeft size={16} color="#475569" />
          </button>

          <div style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            overflowX: 'auto',
            paddingBottom: 4,
            scrollbarWidth: 'none'
          }}>
            {classSubjects.map((sub, index) => {
              const isActive = sub.id === activeSubject.id;
              return (
                <button
                  key={sub.id}
                  onClick={() => handleSelectSubjectWithGuard(sub.id)}
                  style={{
                    padding: '6px 12px',
                    borderRadius: 20,
                    fontSize: 12,
                    fontWeight: isActive ? 800 : 600,
                    backgroundColor: isActive ? '#F97316' : '#F1F5F9',
                    color: isActive ? '#FFF' : '#475569',
                    border: 'none',
                    whiteSpace: 'nowrap',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    boxShadow: isActive ? '0 2px 8px rgba(249, 115, 22, 0.3)' : 'none'
                  }}
                >
                  <span>{index + 1}. {sub.name}</span>
                </button>
              );
            })}
          </div>

          <button
            onClick={() => handleNavigateSubject('next')}
            style={{
              padding: 8,
              borderRadius: 8,
              border: '1px solid #E2E8F0',
              backgroundColor: '#FFF',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <ChevronRight size={16} color="#475569" />
          </button>
        </div>
      )}

      {/* Top Summary Banner Card */}
      <div style={{
        backgroundColor: isEarlyYears ? '#F3E8FF' : '#EFF6FF',
        border: `1px solid ${isEarlyYears ? '#E9D5FF' : '#BFDBFE'}`,
        borderRadius: 12,
        padding: 12,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {isEarlyYears ? <Sparkles size={20} color="#7C3AED" /> : <BookOpen size={20} color="#1E3A8A" />}
          <div>
            <div style={{ fontSize: 13, fontWeight: 800, color: isEarlyYears ? '#6B21A8' : '#1E3A8A' }}>
              {activeEval.name} • {selectedClassObj.name}
            </div>
            <div style={{ fontSize: 11, color: '#475569', marginTop: 2 }}>
              Subject: <strong>{activeSubject.name}</strong> • Max: <strong>{activeSubject.maxMarks}</strong> • Pass: <strong>{activeSubject.passingMarks}</strong>
            </div>
          </div>
        </div>

        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: 16, fontWeight: 900, color: isEarlyYears ? '#7C3AED' : '#F97316' }}>
            {students.length}
          </div>
          <div style={{ fontSize: 10, fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>
            Students
          </div>
        </div>
      </div>

      {/* Quick Action Toolbar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
        <div style={{ display: 'flex', gap: 6 }}>
          <button
            onClick={handleFillAll}
            style={{
              padding: '6px 10px',
              fontSize: 11,
              fontWeight: 700,
              backgroundColor: '#F8FAFC',
              border: '1px solid #CBD5E1',
              borderRadius: 6,
              color: '#334155',
              cursor: 'pointer'
            }}
          >
            Fill Demo
          </button>
          <button
            onClick={handleClearAll}
            style={{
              padding: '6px 10px',
              fontSize: 11,
              fontWeight: 700,
              backgroundColor: '#FFF',
              border: '1px solid #CBD5E1',
              borderRadius: 6,
              color: '#DC2626',
              cursor: 'pointer'
            }}
          >
            Clear All
          </button>
        </div>

        {isDirty && (
          <span style={{ fontSize: 11, fontWeight: 700, color: '#D97706', display: 'flex', alignItems: 'center', gap: 4 }}>
            <AlertCircle size={13} /> Unsaved changes
          </span>
        )}
      </div>

      {/* Student Marks List */}
      <div className="avm-card" style={{ padding: 14 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {students.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 30, color: '#64748B', fontSize: 13 }}>
              No active students found for {selectedClassObj.name}.
            </div>
          ) : (
            students.map((stu) => {
              const inp = marksInputs[stu.id] || { theory: '', practical: '', total: '', isAbsent: false, rating: '⭐ Excellent' };
              const totalVal = parseFloat(inp.total) || 0;
              const isPass = !inp.isAbsent && totalVal >= activeSubject.passingMarks;
              const gradeStr = marksService.calculateGrade((totalVal / activeSubject.maxMarks) * 100);

              return (
                <div key={stu.id} style={{
                  padding: '10px 0',
                  borderBottom: '1px solid #F1F5F9',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 8
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <img
                        src={stu.photo || 'https://images.unsplash.com/photo-1544717305-2782549b5136?w=150'}
                        alt={stu.name}
                        style={{ width: 40, height: 40, borderRadius: '50%', objectFit: 'cover', border: '1.5px solid #CBD5E1' }}
                      />
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 800, color: '#172033' }}>{stu.name}</div>
                        <div style={{ fontSize: 11, color: '#64748B' }}>
                          Roll: <strong>{stu.rollNo || '-'}</strong> • Adm: <strong>{stu.admissionNo || 'AVM2026'}</strong>
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => handleToggleAbsent(stu.id)}
                      style={{
                        padding: '4px 8px',
                        borderRadius: 6,
                        fontSize: 10,
                        fontWeight: 800,
                        border: inp.isAbsent ? '1px solid #DC2626' : '1px solid #CBD5E1',
                        backgroundColor: inp.isAbsent ? '#FEE2E2' : '#F8FAFC',
                        color: inp.isAbsent ? '#DC2626' : '#475569',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 4
                      }}
                    >
                      {inp.isAbsent ? <UserX size={12} /> : <UserCheck size={12} />}
                      {inp.isAbsent ? 'ABSENT' : 'PRESENT'}
                    </button>
                  </div>

                  {!inp.isAbsent ? (
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginTop: 2 }}>
                      {!isEarlyYears ? (
                        <>
                          {activeSubject.theoryMaxMarks && activeSubject.practicalMaxMarks ? (
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                              <div>
                                <label style={{ fontSize: 9, color: '#64748B', fontWeight: 700, display: 'block' }}>
                                  Theory ({activeSubject.theoryMaxMarks})
                                </label>
                                <input
                                  type="number"
                                  className="avm-input"
                                  style={{ width: 60, textAlign: 'center', padding: 4, fontWeight: 700, fontSize: 13 }}
                                  value={inp.theory}
                                  onChange={(e) => handleTheoryChange(stu.id, e.target.value)}
                                  placeholder="0"
                                />
                              </div>

                              <div>
                                <label style={{ fontSize: 9, color: '#64748B', fontWeight: 700, display: 'block' }}>
                                  Practical ({activeSubject.practicalMaxMarks})
                                </label>
                                <input
                                  type="number"
                                  className="avm-input"
                                  style={{ width: 60, textAlign: 'center', padding: 4, fontWeight: 700, fontSize: 13 }}
                                  value={inp.practical}
                                  onChange={(e) => handlePracticalChange(stu.id, e.target.value)}
                                  placeholder="0"
                                />
                              </div>
                            </div>
                          ) : (
                            <div>
                              <label style={{ fontSize: 9, color: '#64748B', fontWeight: 700, display: 'block' }}>
                                Total Marks (Max {activeSubject.maxMarks})
                              </label>
                              <input
                                type="number"
                                className="avm-input"
                                style={{ width: 90, textAlign: 'center', padding: 6, fontWeight: 800, fontSize: 14 }}
                                value={inp.total}
                                onChange={(e) => handleTotalChange(stu.id, e.target.value)}
                                placeholder="0-100"
                              />
                            </div>
                          )}

                          <div style={{ textAlign: 'right' }}>
                            <div style={{ fontSize: 14, fontWeight: 900, color: isPass ? '#16A34A' : '#DC2626' }}>
                              {totalVal} / {activeSubject.maxMarks}
                            </div>
                            <span style={{
                              fontSize: 10,
                              fontWeight: 800,
                              padding: '2px 6px',
                              borderRadius: 4,
                              backgroundColor: isPass ? '#DCFCE7' : '#FEE2E2',
                              color: isPass ? '#15803D' : '#B91C1C'
                            }}>
                              {isPass ? `PASS (${gradeStr})` : `FAIL (${gradeStr})`}
                            </span>
                          </div>
                        </>
                      ) : (
                        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <label style={{ fontSize: 11, fontWeight: 700, color: '#475569' }}>
                            Rating:
                          </label>
                          <select
                            className="avm-input"
                            style={{ width: 160, padding: 6, fontSize: 12, fontWeight: 800, color: '#7C3AED' }}
                            value={inp.rating}
                            onChange={(e) => handleRatingChange(stu.id, e.target.value)}
                          >
                            <option value="⭐ Excellent">⭐ Excellent</option>
                            <option value="👍 Good">👍 Good</option>
                            <option value="💡 Needs Support">💡 Needs Support</option>
                          </select>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div style={{
                      backgroundColor: '#FEE2E2',
                      color: '#B91C1C',
                      padding: '6px 12px',
                      borderRadius: 6,
                      fontSize: 11,
                      fontWeight: 800,
                      textAlign: 'center'
                    }}>
                      Student marked ABSENT for this examination
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Sticky Action Footer */}
        <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 8 }}>
          <button
            className="avm-btn-primary"
            onClick={() => handleSaveMarks(false)}
            disabled={saving || students.length === 0}
            style={{ width: '100%', backgroundColor: isEarlyYears ? '#7C3AED' : '#F97316' }}
          >
            <Save size={16} /> {saving ? 'Saving...' : 'Save Subject Marks'}
          </button>

          <button
            onClick={() => handleSaveMarks(true)}
            disabled={saving || students.length === 0}
            style={{
              width: '100%',
              padding: 10,
              borderRadius: 8,
              fontSize: 13,
              fontWeight: 700,
              backgroundColor: '#1E3A8A',
              color: '#FFF',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6
            }}
          >
            Save & Next Subject <ChevronRight size={16} />
          </button>
        </div>
      </div>

      {/* UNSAVED CHANGES MODAL */}
      {showUnsavedModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.6)',
          zIndex: 99999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 20
        }}>
          <div style={{ backgroundColor: '#FFF', borderRadius: 16, padding: 20, maxWidth: 360, width: '100%', boxShadow: '0 10px 30px rgba(0,0,0,0.3)' }}>
            <h3 style={{ fontSize: 16, fontWeight: 800, color: '#172033', margin: 0, marginBottom: 8 }}>
              Unsaved Marks Changes
            </h3>
            <p style={{ fontSize: 13, color: '#475569', margin: 0, marginBottom: 16 }}>
              You have unsaved marks for <strong>{activeSubject.name}</strong>. Do you want to save your changes before switching?
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <button
                className="avm-btn-primary"
                onClick={() => confirmUnsavedModalAction('save')}
                style={{ width: '100%', backgroundColor: '#16A34A' }}
              >
                Save Changes & Switch
              </button>
              <button
                style={{
                  width: '100%',
                  padding: 10,
                  borderRadius: 8,
                  fontSize: 12,
                  fontWeight: 700,
                  backgroundColor: '#FEE2E2',
                  color: '#DC2626',
                  border: 'none',
                  cursor: 'pointer'
                }}
                onClick={() => confirmUnsavedModalAction('discard')}
              >
                Discard Unsaved Changes
              </button>
              <button
                style={{
                  width: '100%',
                  padding: 8,
                  fontSize: 12,
                  fontWeight: 600,
                  color: '#64748B',
                  backgroundColor: 'transparent',
                  border: 'none',
                  cursor: 'pointer'
                }}
                onClick={() => {
                  setShowUnsavedModal(false);
                  setPendingSelection(null);
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ADD SUBJECT MODAL */}
      {showAddSubjectModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.6)',
          zIndex: 99999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 16
        }}>
          <div style={{ backgroundColor: '#FFF', borderRadius: 16, padding: 20, maxWidth: 420, width: '100%', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
              <h3 style={{ fontSize: 16, fontWeight: 800, color: '#172033', margin: 0 }}>
                + Add New Subject
              </h3>
              <button onClick={() => setShowAddSubjectModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                <X size={18} color="#64748B" />
              </button>
            </div>

            <form onSubmit={handleSaveNewSubject} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div>
                <label style={{ fontSize: 11, fontWeight: 700, color: '#475569', display: 'block', marginBottom: 4 }}>
                  Subject Name *
                </label>
                <input
                  type="text"
                  className="avm-input"
                  placeholder="e.g. Environmental Studies"
                  value={newSubjName}
                  onChange={(e) => setNewSubjName(e.target.value)}
                  required
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div>
                  <label style={{ fontSize: 11, fontWeight: 700, color: '#475569', display: 'block', marginBottom: 4 }}>
                    Subject Code
                  </label>
                  <input
                    type="text"
                    className="avm-input"
                    placeholder="e.g. EVS101"
                    value={newSubjCode}
                    onChange={(e) => setNewSubjCode(e.target.value)}
                  />
                </div>

                <div>
                  <label style={{ fontSize: 11, fontWeight: 700, color: '#475569', display: 'block', marginBottom: 4 }}>
                    Subject Type
                  </label>
                  <select
                    className="avm-input"
                    value={newSubjType}
                    onChange={(e) => setNewSubjType(e.target.value as any)}
                  >
                    <option value="Theory">Theory</option>
                    <option value="Practical">Practical</option>
                    <option value="Activity">Activity</option>
                    <option value="Developmental">Developmental</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div>
                  <label style={{ fontSize: 11, fontWeight: 700, color: '#475569', display: 'block', marginBottom: 4 }}>
                    Maximum Marks
                  </label>
                  <input
                    type="number"
                    className="avm-input"
                    value={newSubjMax}
                    onChange={(e) => setNewSubjMax(e.target.value)}
                  />
                </div>

                <div>
                  <label style={{ fontSize: 11, fontWeight: 700, color: '#475569', display: 'block', marginBottom: 4 }}>
                    Passing Marks
                  </label>
                  <input
                    type="number"
                    className="avm-input"
                    value={newSubjPass}
                    onChange={(e) => setNewSubjPass(e.target.value)}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div>
                  <label style={{ fontSize: 11, fontWeight: 700, color: '#475569', display: 'block', marginBottom: 4 }}>
                    Theory Max (Optional)
                  </label>
                  <input
                    type="number"
                    className="avm-input"
                    placeholder="e.g. 80"
                    value={newSubjTheoryMax}
                    onChange={(e) => setNewSubjTheoryMax(e.target.value)}
                  />
                </div>

                <div>
                  <label style={{ fontSize: 11, fontWeight: 700, color: '#475569', display: 'block', marginBottom: 4 }}>
                    Practical Max (Optional)
                  </label>
                  <input
                    type="number"
                    className="avm-input"
                    placeholder="e.g. 20"
                    value={newSubjPracticalMax}
                    onChange={(e) => setNewSubjPracticalMax(e.target.value)}
                  />
                </div>
              </div>

              <button
                type="submit"
                className="avm-btn-primary"
                style={{ marginTop: 10, width: '100%' }}
              >
                Save Subject to Central Store
              </button>
            </form>
          </div>
        </div>
      )}

      {/* MARKS HISTORY & ANALYTICS MODAL */}
      {showHistoryModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.7)',
          zIndex: 99999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 12
        }}>
          <div style={{
            backgroundColor: '#FFF',
            borderRadius: 16,
            padding: 16,
            maxWidth: 650,
            width: '100%',
            maxHeight: '90vh',
            display: 'flex',
            flexDirection: 'column',
            gap: 12
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <BarChart2 size={20} color="#1E3A8A" />
                <h3 style={{ fontSize: 16, fontWeight: 800, color: '#172033', margin: 0 }}>
                  Marks & Evaluation History
                </h3>
              </div>
              <button onClick={() => setShowHistoryModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                <X size={20} color="#64748B" />
              </button>
            </div>

            <div style={{ display: 'flex', borderBottom: '1px solid #E2E8F0', gap: 10 }}>
              <button
                onClick={() => setHistoryTab('all_marks')}
                style={{
                  padding: '8px 12px',
                  fontSize: 12,
                  fontWeight: historyTab === 'all_marks' ? 800 : 600,
                  borderBottom: historyTab === 'all_marks' ? '2.5px solid #F97316' : 'none',
                  color: historyTab === 'all_marks' ? '#F97316' : '#64748B',
                  background: 'none',
                  cursor: 'pointer'
                }}
              >
                All Saved Entries
              </button>
              <button
                onClick={() => setHistoryTab('student_perf')}
                style={{
                  padding: '8px 12px',
                  fontSize: 12,
                  fontWeight: historyTab === 'student_perf' ? 800 : 600,
                  borderBottom: historyTab === 'student_perf' ? '2.5px solid #F97316' : 'none',
                  color: historyTab === 'student_perf' ? '#F97316' : '#64748B',
                  background: 'none',
                  cursor: 'pointer'
                }}
              >
                Student Performance
              </button>
              <button
                onClick={() => setHistoryTab('class_summary')}
                style={{
                  padding: '8px 12px',
                  fontSize: 12,
                  fontWeight: historyTab === 'class_summary' ? 800 : 600,
                  borderBottom: historyTab === 'class_summary' ? '2.5px solid #F97316' : 'none',
                  color: historyTab === 'class_summary' ? '#F97316' : '#64748B',
                  background: 'none',
                  cursor: 'pointer'
                }}
              >
                Class Result Summary
              </button>
            </div>

            {historyTab === 'all_marks' && (
              <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 10 }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                  <div>
                    <label style={{ fontSize: 10, fontWeight: 700, color: '#64748B' }}>Filter Exam</label>
                    <select
                      className="avm-input"
                      style={{ padding: 4, fontSize: 11 }}
                      value={histEvalFilter}
                      onChange={(e) => setHistEvalFilter(e.target.value)}
                    >
                      <option value="All">All Evaluations</option>
                      {evaluations.map(e => <option key={e.id} value={e.name}>{e.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={{ fontSize: 10, fontWeight: 700, color: '#64748B' }}>Filter Class</label>
                    <select
                      className="avm-input"
                      style={{ padding: 4, fontSize: 11 }}
                      value={histClassFilter}
                      onChange={(e) => setHistClassFilter(e.target.value)}
                    >
                      <option value="All">All Classes</option>
                      {teacherClasses.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                    </select>
                  </div>
                </div>

                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
                    <thead>
                      <tr style={{ backgroundColor: '#F8FAFC', color: '#475569', textAlign: 'left' }}>
                        <th style={{ padding: 8 }}>Student</th>
                        <th style={{ padding: 8 }}>Class</th>
                        <th style={{ padding: 8 }}>Subject</th>
                        <th style={{ padding: 8 }}>Exam</th>
                        <th style={{ padding: 8, textAlign: 'center' }}>Marks</th>
                        <th style={{ padding: 8, textAlign: 'center' }}>Grade</th>
                        <th style={{ padding: 8, textAlign: 'center' }}>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {allSavedMarksHistory.length === 0 ? (
                        <tr>
                          <td colSpan={7} style={{ textAlign: 'center', padding: 20, color: '#94A3B8' }}>
                            No saved marks match current filters.
                          </td>
                        </tr>
                      ) : (
                        allSavedMarksHistory.map(m => (
                          <tr key={m.id} style={{ borderBottom: '1px solid #F1F5F9' }}>
                            <td style={{ padding: 8, fontWeight: 700 }}>{m.studentName}</td>
                            <td style={{ padding: 8 }}>{m.className}</td>
                            <td style={{ padding: 8 }}>{m.subjectName}</td>
                            <td style={{ padding: 8 }}>{m.evaluationName}</td>
                            <td style={{ padding: 8, textAlign: 'center', fontWeight: 800 }}>
                              {m.isAbsent ? 'ABS' : `${m.totalMarks}/${m.maximumMarks}`}
                            </td>
                            <td style={{ padding: 8, textAlign: 'center', fontWeight: 800, color: '#1E3A8A' }}>
                              {m.grade}
                            </td>
                            <td style={{ padding: 8, textAlign: 'center' }}>
                              <span style={{
                                padding: '2px 6px',
                                borderRadius: 4,
                                fontSize: 10,
                                fontWeight: 800,
                                backgroundColor: m.status === 'PASS' ? '#DCFCE7' : '#FEE2E2',
                                color: m.status === 'PASS' ? '#15803D' : '#B91C1C'
                              }}>
                                {m.status}
                              </span>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {historyTab === 'student_perf' && (
              <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 10 }}>
                <div>
                  <label style={{ fontSize: 10, fontWeight: 700, color: '#64748B' }}>Select Student</label>
                  <select
                    className="avm-input"
                    style={{ padding: 6, fontSize: 12, fontWeight: 700 }}
                    value={selectedStudentForHistory?.id || ''}
                    onChange={(e) => {
                      const found = students.find(s => s.id === e.target.value);
                      setSelectedStudentForHistory(found || null);
                    }}
                  >
                    <option value="">-- Choose Student --</option>
                    {students.map(s => <option key={s.id} value={s.id}>{s.name} (Roll {s.rollNo || '-'})</option>)}
                  </select>
                </div>

                {selectedStudentForHistory ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    <div style={{ backgroundColor: '#F8FAFC', borderRadius: 8, padding: 10, display: 'flex', alignItems: 'center', gap: 10 }}>
                      <img
                        src={selectedStudentForHistory.photo || 'https://images.unsplash.com/photo-1544717305-2782549b5136?w=150'}
                        alt={selectedStudentForHistory.name}
                        style={{ width: 40, height: 40, borderRadius: '50%' }}
                      />
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 800 }}>{selectedStudentForHistory.name}</div>
                        <div style={{ fontSize: 11, color: '#64748B' }}>
                          Class: {selectedStudentForHistory.className} • Roll: {selectedStudentForHistory.rollNo} • Adm: {selectedStudentForHistory.admissionNo}
                        </div>
                      </div>
                    </div>

                    {marksService.getStudentExamHistory(selectedStudentForHistory.id).map(h => (
                      <div key={h.evaluationName} className="avm-card" style={{ padding: 10 }}>
                        <div style={{ fontSize: 12, fontWeight: 800, color: '#1E3A8A', marginBottom: 6 }}>
                          {h.evaluationName}
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                          {h.marks.map(m => (
                            <div key={m.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, padding: '3px 0', borderBottom: '1px solid #F1F5F9' }}>
                              <span>{m.subjectName}</span>
                              <span style={{ fontWeight: 800 }}>{m.totalMarks} / {m.maximumMarks} ({m.grade})</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div style={{ textAlign: 'center', padding: 20, color: '#94A3B8', fontSize: 12 }}>
                    Please select a student from the dropdown to view complete exam performance.
                  </div>
                )}
              </div>
            )}

            {historyTab === 'class_summary' && (
              <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div style={{ backgroundColor: '#EFF6FF', borderRadius: 10, padding: 12 }}>
                  <div style={{ fontSize: 13, fontWeight: 800, color: '#1E3A8A' }}>
                    {selectedClassObj.name} • {activeEval.name} • {activeSubject.name}
                  </div>
                  <div style={{ fontSize: 11, color: '#475569', marginTop: 2 }}>
                    Central Class Academic Metrics
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  <div className="avm-card" style={{ padding: 12, textAlign: 'center' }}>
                    <div style={{ fontSize: 20, fontWeight: 900, color: '#F97316' }}>{classSummaryMetrics.averagePercentage}%</div>
                    <div style={{ fontSize: 10, fontWeight: 700, color: '#64748B' }}>Average Score</div>
                  </div>
                  <div className="avm-card" style={{ padding: 12, textAlign: 'center' }}>
                    <div style={{ fontSize: 20, fontWeight: 900, color: '#16A34A' }}>{classSummaryMetrics.highestMarks}</div>
                    <div style={{ fontSize: 10, fontWeight: 700, color: '#64748B' }}>Highest Marks</div>
                  </div>
                  <div className="avm-card" style={{ padding: 12, textAlign: 'center' }}>
                    <div style={{ fontSize: 20, fontWeight: 900, color: '#16A34A' }}>{classSummaryMetrics.passedStudents}</div>
                    <div style={{ fontSize: 10, fontWeight: 700, color: '#64748B' }}>Passed Students</div>
                  </div>
                  <div className="avm-card" style={{ padding: 12, textAlign: 'center' }}>
                    <div style={{ fontSize: 20, fontWeight: 900, color: '#DC2626' }}>{classSummaryMetrics.failedStudents}</div>
                    <div style={{ fontSize: 10, fontWeight: 700, color: '#64748B' }}>Failed Students</div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
