import React, { useState, useEffect, useMemo } from 'react';
import { Student, Employee, TimetableSlot, PeriodRecord, ClassSubjectRecord, TeachingAssignmentRecord } from '../types';
import { timetableService } from '../services/timetableService';
import { demoDataStore } from '../services/demoDataStore';
import { Modal } from './Modal';
import {
  Clock,
  Plus,
  Settings,
  Printer,
  Search,
  Eye,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Maximize2,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Layers,
  Calendar,
  Award,
  Trash2,
  Edit,
  RotateCcw,
  CheckSquare,
  Square,
  Users,
  GraduationCap,
  Briefcase,
  UserCheck,
  BookOpen,
  FileText,
  AlertTriangle,
  Link as LinkIcon
} from 'lucide-react';

interface TimetableModuleProps {
  students?: Student[];
  employees?: Employee[];
}

export const TimetableModule: React.FC<TimetableModuleProps> = ({
  students: propStudents,
  employees: propEmployees
}) => {
  // Top View Tab: 'class' (default), 'teacher', 'weekly', 'periods', 'class_subjects', 'teaching_assignments'
  const [activeTab, setActiveTab] = useState<'class' | 'teacher' | 'weekly' | 'periods' | 'class_subjects' | 'teaching_assignments'>('class');

  // Filter State
  const [selectedClass, setSelectedClass] = useState<string>('Class 5');
  const [selectedSection, setSelectedSection] = useState<string>('A');
  const [selectedTeacher, setSelectedTeacher] = useState<string>('All');
  const [selectedDay, setSelectedDay] = useState<string>('All');
  const [selectedSubjectFilter, setSelectedSubjectFilter] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Collections State
  const [timetableSlots, setTimetableSlots] = useState<TimetableSlot[]>([]);
  const [periods, setPeriods] = useState<PeriodRecord[]>([]);
  const [masterSubjects, setMasterSubjects] = useState<any[]>([]);
  const [classSubjects, setClassSubjects] = useState<ClassSubjectRecord[]>([]);
  const [teachingAssignments, setTeachingAssignments] = useState<TeachingAssignmentRecord[]>([]);

  // Modals
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editSlot, setEditSlot] = useState<TimetableSlot | null>(null);
  const [managePeriodsModalOpen, setManagePeriodsModalOpen] = useState(false);
  const [manageSubjectsModalOpen, setManageSubjectsModalOpen] = useState(false);
  const [manageClassSubjectsModalOpen, setManageClassSubjectsModalOpen] = useState(false);
  const [manageTeachingAssignmentsModalOpen, setManageTeachingAssignmentsModalOpen] = useState(false);
  const [addSubjectModalOpen, setAddSubjectModalOpen] = useState(false);
  const [addPeriodModalOpen, setAddPeriodModalOpen] = useState(false);
  const [conflictError, setConflictError] = useState<string | null>(null);

  // Form State: Create/Edit Timetable Entry
  const [formDay, setFormDay] = useState<string>('Monday');
  const [formPeriod, setFormPeriod] = useState<number>(1);
  const [formStartTime, setFormStartTime] = useState<string>('08:00 AM');
  const [formEndTime, setFormEndTime] = useState<string>('08:45 AM');
  const [formClass, setFormClass] = useState<string>('Class 5');
  const [formSection, setFormSection] = useState<string>('A');
  const [formSubject, setFormSubject] = useState<string>('Mathematics');
  const [formTeacher, setFormTeacher] = useState<string>('Mrs. Priya Sharma');
  const [formRoom, setFormRoom] = useState<string>('Room 204');
  const [formType, setFormType] = useState<'Regular' | 'Break' | 'Lunch' | 'Assembly' | 'Activity'>('Regular');
  const [formApplyAllDays, setFormApplyAllDays] = useState<boolean>(false);

  // Form State: Add Subject Modal
  const [subjFormName, setSubjFormName] = useState('');
  const [subjFormCode, setSubjFormCode] = useState('');
  const [subjFormType, setSubjFormType] = useState('Core');
  const [subjFormClass, setSubjFormClass] = useState('All Classes');
  const [subjFormDesc, setSubjFormDesc] = useState('');
  const [subjAssignToCurrentClass, setSubjAssignToCurrentClass] = useState(true);

  // Form State: Add/Edit Period Modal
  const [periodNum, setPeriodNum] = useState<number>(1);
  const [periodName, setPeriodName] = useState<string>('Period 1');
  const [periodStart, setPeriodStart] = useState<string>('08:00 AM');
  const [periodEnd, setPeriodEnd] = useState<string>('08:45 AM');
  const [periodType, setPeriodType] = useState<'Regular' | 'Break' | 'Lunch' | 'Assembly' | 'Activity'>('Regular');

  // Form State: Class Subject Manager
  const [csClass, setCsClass] = useState<string>('Class 5');
  const [csSection, setCsSection] = useState<string>('A');
  const [csSubjectName, setCsSubjectName] = useState<string>('');

  // Form State: Teaching Assignment Manager
  const [taTeacherName, setTaTeacherName] = useState<string>('');
  const [taSubjectName, setTaSubjectName] = useState<string>('');
  const [taClass, setTaClass] = useState<string>('Class 5');
  const [taSection, setTaSection] = useState<string>('A');

  // Load Store Data
  const loadData = () => {
    const db = demoDataStore.getDB();
    const slots = timetableService.getAllSlots();
    const prds = timetableService.getPeriods();
    const clsSubjs = timetableService.getClassSubjects();
    const tAssigns = timetableService.getTeachingAssignments();
    const subjs = db.masterSubjects || db.schoolSubjects || [
      { id: 'SUB-1', name: 'Mathematics', code: 'MATH', type: 'Core' },
      { id: 'SUB-2', name: 'Science', code: 'SCI', type: 'Core' },
      { id: 'SUB-3', name: 'English', code: 'ENG', type: 'Language' },
      { id: 'SUB-4', name: 'Hindi', code: 'HIN', type: 'Language' },
      { id: 'SUB-5', name: 'Social Studies', code: 'SST', type: 'Core' },
      { id: 'SUB-6', name: 'Computer Science', code: 'CS', type: 'Optional' },
      { id: 'SUB-7', name: 'Environmental Studies', code: 'EVS', type: 'Core' },
      { id: 'SUB-8', name: 'General Knowledge', code: 'GK', type: 'Activity' },
      { id: 'SUB-9', name: 'Physical Education', code: 'PE', type: 'Activity' }
    ];

    setTimetableSlots([...slots]);
    setPeriods([...prds]);
    setClassSubjects([...clsSubjs]);
    setTeachingAssignments([...tAssigns]);
    setMasterSubjects([...subjs]);
  };

  useEffect(() => {
    loadData();
    const unsubscribe = demoDataStore.subscribe(() => {
      loadData();
    });
    return () => unsubscribe();
  }, []);

  // Available Master Collections
  const availableClasses = useMemo(() => [
    'Nursery', 'LKG', 'UKG',
    'Class 1', 'Class 2', 'Class 3', 'Class 4',
    'Class 5', 'Class 6', 'Class 7', 'Class 8'
  ], []);

  const availableSections = useMemo(() => ['A', 'B', 'C'], []);
  const availableDays = useMemo(() => ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'], []);

  // Employees List from Central Store
  const availableTeachers = useMemo(() => {
    const emps = propEmployees && propEmployees.length > 0 ? propEmployees : (demoDataStore.getDB().employees || []);
    if (emps.length === 0) {
      return [
        { id: 'EMP-T101', name: 'Mrs. Priya Sharma', designation: 'Senior Teacher' },
        { id: 'EMP-T102', name: 'Mr. Amit Kumar', designation: 'Senior Teacher' },
        { id: 'EMP-T103', name: 'Mr. Rajesh Varma', designation: 'Teacher' },
        { id: 'EMP-T104', name: 'Mrs. Sunita Devi', designation: 'Teacher' },
        { id: 'EMP-IT401', name: 'Mr. Deepak Roy', designation: 'Computer Teacher' },
        { id: 'EMP-SP301', name: 'Mrs. Kavita Sharma', designation: 'PE Teacher' }
      ];
    }
    return emps;
  }, [propEmployees]);

  // Master Subjects List
  const availableMasterSubjects = useMemo(() => {
    return masterSubjects.map(s => s.name || s);
  }, [masterSubjects]);

  // CASCADING 1: Compute Subjects assigned specifically to currently selected Class & Section in form
  const formClassSubjectOptions = useMemo(() => {
    const assigned = classSubjects.filter(cs =>
      (cs.className || '').toLowerCase().replace(/class\s*/i, '').trim() === formClass.toLowerCase().replace(/class\s*/i, '').trim() &&
      (cs.section || '').toUpperCase() === formSection.toUpperCase()
    ).map(cs => cs.subjectName);

    if (assigned.length > 0) return assigned;

    // Fallback: If no explicit class subjects assigned yet, return master subjects
    return availableMasterSubjects;
  }, [classSubjects, formClass, formSection, availableMasterSubjects]);

  // CASCADING 2: Compute Teachers assigned to currently selected Class, Section & Subject
  const formRecommendedTeachers = useMemo(() => {
    const assigned = teachingAssignments.filter(ta =>
      (ta.className || '').toLowerCase().replace(/class\s*/i, '').trim() === formClass.toLowerCase().replace(/class\s*/i, '').trim() &&
      (ta.section || '').toUpperCase() === formSection.toUpperCase() &&
      (ta.subjectName || '').toLowerCase() === formSubject.toLowerCase()
    ).map(ta => ta.teacherName);

    return assigned;
  }, [teachingAssignments, formClass, formSection, formSubject]);

  // Filtered Slots for Active View
  const filteredSlots = useMemo(() => {
    return timetableSlots.filter(s => {
      const matchCls = selectedClass === 'All' || (s.className || '').toLowerCase().replace(/class\s*/i, '').trim() === selectedClass.toLowerCase().replace(/class\s*/i, '').trim();
      const matchSec = selectedSection === 'All' || (s.section || '').toUpperCase() === selectedSection.toUpperCase();
      const matchTeacher = selectedTeacher === 'All' || (s.teacherName || '').toLowerCase().includes(selectedTeacher.toLowerCase());
      const matchDay = selectedDay === 'All' || (s.day || '').toLowerCase() === selectedDay.toLowerCase();
      const matchSubj = selectedSubjectFilter === 'All' || (s.subject || '').toLowerCase() === selectedSubjectFilter.toLowerCase();
      const matchSearch = searchQuery === '' ||
                          (s.subject && s.subject.toLowerCase().includes(searchQuery.toLowerCase())) ||
                          (s.teacherName && s.teacherName.toLowerCase().includes(searchQuery.toLowerCase())) ||
                          (s.className && s.className.toLowerCase().includes(searchQuery.toLowerCase())) ||
                          (s.room && s.room.toLowerCase().includes(searchQuery.toLowerCase()));

      return matchCls && matchSec && matchTeacher && matchDay && matchSubj && matchSearch;
    });
  }, [timetableSlots, selectedClass, selectedSection, selectedTeacher, selectedDay, selectedSubjectFilter, searchQuery]);

  // Auto time fill when Period selected in form
  const handlePeriodChange = (pNum: number) => {
    setFormPeriod(pNum);
    const pRecord = periods.find(p => p.periodNumber === pNum);
    if (pRecord) {
      setFormStartTime(pRecord.startTime);
      setFormEndTime(pRecord.endTime);
      if (pRecord.type !== 'Regular') {
        setFormType(pRecord.type);
        setFormSubject(pRecord.name);
        setFormTeacher('Unassigned');
      }
    }
  };

  // Auto update subjects & teacher when Form Class or Section changes
  useEffect(() => {
    if (formClassSubjectOptions.length > 0 && !formClassSubjectOptions.includes(formSubject)) {
      setFormSubject(formClassSubjectOptions[0]);
    }
  }, [formClass, formSection, formClassSubjectOptions]);

  useEffect(() => {
    if (formRecommendedTeachers.length > 0) {
      setFormTeacher(formRecommendedTeachers[0]);
    }
  }, [formSubject, formRecommendedTeachers]);

  // Open Create Modal
  const handleOpenCreateModal = () => {
    setEditSlot(null);
    setConflictError(null);
    setFormDay('Monday');
    setFormPeriod(1);
    setFormStartTime('08:00 AM');
    setFormEndTime('08:45 AM');

    const cls = selectedClass === 'All' ? 'Class 5' : selectedClass;
    const sec = selectedSection === 'All' ? 'A' : selectedSection;

    setFormClass(cls);
    setFormSection(sec);

    const initialSubjs = timetableService.getClassSubjects(cls, sec).map(cs => cs.subjectName);
    const initialSubj = initialSubjs.length > 0 ? initialSubjs[0] : (availableMasterSubjects[0] || 'Mathematics');

    setFormSubject(initialSubj);

    const initialTeachers = timetableService.getTeachingAssignments(cls, sec, initialSubj).map(ta => ta.teacherName);
    setFormTeacher(initialTeachers.length > 0 ? initialTeachers[0] : (availableTeachers[0]?.name || 'Mrs. Priya Sharma'));
    setFormRoom('Room 204');
    setFormType('Regular');
    setFormApplyAllDays(false);
    setCreateModalOpen(true);
  };

  // Open Edit Modal
  const handleOpenEditModal = (slot: TimetableSlot) => {
    setEditSlot(slot);
    setConflictError(null);
    setFormDay(slot.day);
    setFormPeriod(slot.period);
    setFormStartTime(slot.startTime);
    setFormEndTime(slot.endTime);
    setFormClass(slot.className);
    setFormSection(slot.section);
    setFormSubject(slot.subject);
    setFormTeacher(slot.teacherName);
    setFormRoom(slot.room || '');
    setFormType(slot.type || 'Regular');
    setFormApplyAllDays(false);
    setCreateModalOpen(true);
  };

  // Save Timetable Entry Form
  const handleSaveSlotForm = (e: React.FormEvent) => {
    e.preventDefault();
    setConflictError(null);

    const targetDays = formApplyAllDays ? availableDays : [formDay];

    try {
      if (editSlot) {
        timetableService.updateTimetableSlot(editSlot.id, {
          day: formDay as any,
          period: Number(formPeriod),
          startTime: formStartTime,
          endTime: formEndTime,
          className: formClass,
          section: formSection,
          subject: formSubject,
          teacherName: formTeacher,
          room: formRoom,
          type: formType
        });
      } else {
        for (const d of targetDays) {
          timetableService.addTimetableSlot({
            day: d as any,
            period: Number(formPeriod),
            startTime: formStartTime,
            endTime: formEndTime,
            className: formClass,
            section: formSection,
            subject: formSubject,
            teacherName: formTeacher,
            room: formRoom,
            type: formType
          });
        }
      }

      setCreateModalOpen(false);
      loadData();
    } catch (err: any) {
      setConflictError(err.message || 'Timetable Assignment Conflict Detected');
    }
  };

  // Delete Slot
  const handleDeleteSlot = (id: string) => {
    if (confirm('Delete this timetable entry?')) {
      timetableService.deleteTimetableSlot(id);
      loadData();
    }
  };

  // Add Subject Form Submit
  const handleSaveSubjectForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!subjFormName.trim()) {
      alert('Please enter Subject Name');
      return;
    }

    const db = demoDataStore.getDB();
    const currentSubjs = db.masterSubjects || [];
    const newSubj = {
      id: `SUB-${Date.now().toString().slice(-4)}`,
      name: subjFormName.trim(),
      code: subjFormCode.trim() || subjFormName.trim().toUpperCase().slice(0, 4),
      type: subjFormType as any,
      class: subjFormClass,
      description: subjFormDesc.trim(),
      maxMarks: 100,
      passingMarks: 33,
      status: 'Active' as const
    };

    db.masterSubjects = [newSubj, ...currentSubjs];
    demoDataStore.saveDB(db);

    // If checkbox checked, also assign immediately to form class & section
    if (subjAssignToCurrentClass && formClass && formSection) {
      timetableService.addClassSubject(formClass, formSection, newSubj.id, newSubj.name);
    }

    setAddSubjectModalOpen(false);
    setSubjFormName('');
    setSubjFormCode('');
    setSubjFormDesc('');
    loadData();

    // Auto set selected in form
    setFormSubject(newSubj.name);
    alert(`Subject "${newSubj.name}" Created & Assigned to ${formClass}-${formSection}!`);
  };

  // Save Period Master Form Submit
  const handleSavePeriodMaster = (e: React.FormEvent) => {
    e.preventDefault();
    const newPeriod: PeriodRecord = {
      id: `PRD-${Date.now().toString().slice(-4)}`,
      periodNumber: Number(periodNum),
      name: periodName.trim(),
      startTime: periodStart,
      endTime: periodEnd,
      type: periodType
    };

    const updated = [...periods, newPeriod].sort((a, b) => a.periodNumber - b.periodNumber);
    timetableService.savePeriods(updated);
    setAddPeriodModalOpen(false);
    loadData();
    alert(`Period "${newPeriod.name}" Added Successfully!`);
  };

  // Save Class Subject Assignment
  const handleAddClassSubject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!csSubjectName) {
      alert('Please select or enter a subject');
      return;
    }

    timetableService.addClassSubject(csClass, csSection, `SUB-${Date.now().toString().slice(-4)}`, csSubjectName);
    loadData();
    alert(`Subject "${csSubjectName}" assigned to ${csClass}-${csSection}!`);
  };

  // Save Teaching Assignment
  const handleAddTeachingAssignment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!taTeacherName || !taSubjectName) {
      alert('Please select teacher and subject');
      return;
    }

    const tObj = availableTeachers.find(t => t.name === taTeacherName);
    timetableService.addTeachingAssignment(tObj?.id || `EMP-${Date.now().toString().slice(-4)}`, taTeacherName, taSubjectName, taClass, taSection);
    loadData();
    alert(`Assigned ${taTeacherName} to teach ${taSubjectName} in ${taClass}-${taSection}!`);
  };

  // Trigger Print
  const handleTriggerPrint = () => {
    setTimeout(() => {
      window.print();
    }, 200);
  };

  // Custom Form Select Component
  const CustomSelect: React.FC<{
    value: string;
    onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
    options: { label: string; value: string }[];
    label?: string;
    required?: boolean;
    style?: React.CSSProperties;
  }> = ({ value, onChange, options, label, required, style }) => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, flex: 1, minWidth: 160 }}>
      {label && (
        <label style={{ fontSize: 13, fontWeight: 700, color: '#334155' }}>
          {label} {required && <span style={{ color: '#EF4444' }}>*</span>}
        </label>
      )}
      <div style={{ position: 'relative' }}>
        <select
          value={value}
          onChange={onChange}
          style={{
            width: '100%',
            height: 42,
            padding: '8px 36px 8px 14px',
            borderRadius: 8,
            border: '1px solid #CBD5E1',
            backgroundColor: '#FFFFFF',
            color: '#0F172A',
            fontSize: 13.5,
            fontWeight: 600,
            outline: 'none',
            appearance: 'none',
            WebkitAppearance: 'none',
            MozAppearance: 'none',
            cursor: 'pointer',
            boxShadow: '0 1px 2px rgba(0, 0, 0, 0.04)',
            transition: 'border-color 0.15s ease, box-shadow 0.15s ease',
            ...style
          }}
        >
          {options.map((opt, i) => (
            <option key={i} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        <ChevronDown
          size={18}
          color="#64748B"
          style={{
            position: 'absolute',
            right: 12,
            top: '50%',
            transform: 'translateY(-50%)',
            pointerEvents: 'none'
          }}
        />
      </div>
    </div>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

      {/* ========================================================================= */}
      {/* 1. PAGE HEADER */}
      {/* ========================================================================= */}
      <div className="avm-card no-print" style={{ padding: '20px 24px', borderTop: '4px solid #1769E0' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
          <div>
            <h2 style={{ fontSize: 22, fontWeight: 900, color: '#0F172A', margin: 0, display: 'flex', alignItems: 'center', gap: 10 }}>
              <Clock size={28} color="#1769E0" /> Timetable Management
            </h2>
            <p style={{ fontSize: 13, color: '#64748B', margin: '4px 0 0 0', fontWeight: 600 }}>
              Create, manage and print complete weekly schedules for classes and teachers.
            </p>
          </div>

          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <button
              onClick={() => setManageClassSubjectsModalOpen(true)}
              className="avm-btn-secondary"
              style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '10px 14px', fontSize: 13, fontWeight: 700 }}
            >
              <BookOpen size={16} color="#1769E0" /> Class Subjects
            </button>

            <button
              onClick={() => setManageTeachingAssignmentsModalOpen(true)}
              className="avm-btn-secondary"
              style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '10px 14px', fontSize: 13, fontWeight: 700 }}
            >
              <LinkIcon size={16} color="#8B5CF6" /> Teaching Assignments
            </button>

            <button
              onClick={() => setManagePeriodsModalOpen(true)}
              className="avm-btn-secondary"
              style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '10px 14px', fontSize: 13, fontWeight: 700 }}
            >
              <Settings size={16} /> Manage Periods
            </button>

            <button
              onClick={handleTriggerPrint}
              className="avm-btn-secondary"
              style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '10px 14px', fontSize: 13, fontWeight: 700 }}
            >
              <Printer size={16} color="#16A34A" /> Print Timetable
            </button>

            <button
              onClick={handleOpenCreateModal}
              className="avm-btn-primary"
              style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 18px', fontSize: 13, fontWeight: 800, backgroundColor: '#1769E0' }}
            >
              <Plus size={16} /> Create Timetable
            </button>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. TOP VIEW SELECTOR TABS & FILTERS */}
      {/* ========================================================================= */}
      <div className="avm-card no-print" style={{ padding: '16px 20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #E2E8F0', paddingBottom: 14, flexWrap: 'wrap', gap: 12 }}>
          {/* VIEW TABS */}
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <button
              onClick={() => setActiveTab('class')}
              style={{
                padding: '8px 16px',
                borderRadius: 8,
                fontSize: 13,
                fontWeight: 800,
                border: 'none',
                cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: 6,
                backgroundColor: activeTab === 'class' ? '#1769E0' : '#F1F5F9',
                color: activeTab === 'class' ? '#FFFFFF' : '#64748B'
              }}
            >
              <BookOpen size={15} /> Class Timetable
            </button>

            <button
              onClick={() => setActiveTab('teacher')}
              style={{
                padding: '8px 16px',
                borderRadius: 8,
                fontSize: 13,
                fontWeight: 800,
                border: 'none',
                cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: 6,
                backgroundColor: activeTab === 'teacher' ? '#1769E0' : '#F1F5F9',
                color: activeTab === 'teacher' ? '#FFFFFF' : '#64748B'
              }}
            >
              <UserCheck size={15} /> Teacher Timetable
            </button>

            <button
              onClick={() => setActiveTab('weekly')}
              style={{
                padding: '8px 16px',
                borderRadius: 8,
                fontSize: 13,
                fontWeight: 800,
                border: 'none',
                cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: 6,
                backgroundColor: activeTab === 'weekly' ? '#1769E0' : '#F1F5F9',
                color: activeTab === 'weekly' ? '#FFFFFF' : '#64748B'
              }}
            >
              <Calendar size={15} /> Weekly Grid
            </button>

            <button
              onClick={() => setActiveTab('class_subjects')}
              style={{
                padding: '8px 16px',
                borderRadius: 8,
                fontSize: 13,
                fontWeight: 800,
                border: 'none',
                cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: 6,
                backgroundColor: activeTab === 'class_subjects' ? '#1769E0' : '#F1F5F9',
                color: activeTab === 'class_subjects' ? '#FFFFFF' : '#64748B'
              }}
            >
              <Layers size={15} /> Class Subjects
            </button>

            <button
              onClick={() => setActiveTab('teaching_assignments')}
              style={{
                padding: '8px 16px',
                borderRadius: 8,
                fontSize: 13,
                fontWeight: 800,
                border: 'none',
                cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: 6,
                backgroundColor: activeTab === 'teaching_assignments' ? '#1769E0' : '#F1F5F9',
                color: activeTab === 'teaching_assignments' ? '#FFFFFF' : '#64748B'
              }}
            >
              <LinkIcon size={15} /> Teaching Assignments
            </button>

            <button
              onClick={() => setActiveTab('periods')}
              style={{
                padding: '8px 16px',
                borderRadius: 8,
                fontSize: 13,
                fontWeight: 800,
                border: 'none',
                cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: 6,
                backgroundColor: activeTab === 'periods' ? '#1769E0' : '#F1F5F9',
                color: activeTab === 'periods' ? '#FFFFFF' : '#64748B'
              }}
            >
              <Clock size={15} /> Periods Master
            </button>
          </div>

          {/* SEARCH BOX */}
          <div style={{ position: 'relative', width: 240 }}>
            <Search size={16} style={{ position: 'absolute', left: 12, top: 11, color: '#94A3B8' }} />
            <input
              type="text"
              className="avm-input"
              style={{ paddingLeft: 36, height: 38, fontSize: 12.5 }}
              placeholder="Search subject, teacher, room..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {/* CONTROLS ROW */}
        {['class', 'teacher', 'weekly'].includes(activeTab) && (
          <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', alignItems: 'flex-end', marginTop: 14 }}>
            <CustomSelect
              label="Class"
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              options={['All', ...availableClasses].map(c => ({ label: c, value: c }))}
            />

            <CustomSelect
              label="Section"
              value={selectedSection}
              onChange={(e) => setSelectedSection(e.target.value)}
              options={['All', ...availableSections].map(s => ({ label: s, value: s }))}
            />

            <CustomSelect
              label="Teacher"
              value={selectedTeacher}
              onChange={(e) => setSelectedTeacher(e.target.value)}
              options={['All', ...availableTeachers.map(t => t.name)].map(t => ({ label: t, value: t }))}
            />

            <CustomSelect
              label="Day"
              value={selectedDay}
              onChange={(e) => setSelectedDay(e.target.value)}
              options={['All', ...availableDays].map(d => ({ label: d, value: d }))}
            />

            <CustomSelect
              label="Subject Filter"
              value={selectedSubjectFilter}
              onChange={(e) => setSelectedSubjectFilter(e.target.value)}
              options={['All', ...availableMasterSubjects].map(s => ({ label: s, value: s }))}
            />
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* VIEW 1: CLASS TIMETABLE */}
      {/* ========================================================================= */}
      {activeTab === 'class' && (
        <div className="avm-card no-print" style={{ padding: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h3 style={{ fontSize: 16, fontWeight: 900, color: '#0F172A', margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
              <BookOpen size={20} color="#1769E0" /> {selectedClass === 'All' ? 'All Classes' : selectedClass} - {selectedSection === 'All' ? 'All Sections' : selectedSection} Timetable
            </h3>
            <span style={{ backgroundColor: '#EFF6FF', color: '#1769E0', padding: '4px 12px', borderRadius: 16, fontSize: 12, fontWeight: 800 }}>
              {filteredSlots.length} Scheduled Slots
            </span>
          </div>

          <div style={{ overflowX: 'auto', border: '1px solid #E2E8F0', borderRadius: 8 }}>
            <table className="avm-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ backgroundColor: '#F8FAFC', borderBottom: '2px solid #E2E8F0' }}>
                  <th style={{ padding: 12, fontSize: 12, fontWeight: 800, color: '#475569', textAlign: 'center', width: 90 }}>Day</th>
                  <th style={{ padding: 12, fontSize: 12, fontWeight: 800, color: '#475569', textAlign: 'center', width: 90 }}>Period</th>
                  <th style={{ padding: 12, fontSize: 12, fontWeight: 800, color: '#475569', textAlign: 'center', width: 140 }}>Time Slot</th>
                  <th style={{ padding: 12, fontSize: 12, fontWeight: 800, color: '#475569', textAlign: 'left', width: 120 }}>Class & Sec</th>
                  <th style={{ padding: 12, fontSize: 12, fontWeight: 800, color: '#475569', textAlign: 'left' }}>Subject</th>
                  <th style={{ padding: 12, fontSize: 12, fontWeight: 800, color: '#475569', textAlign: 'left' }}>Assigned Teacher</th>
                  <th style={{ padding: 12, fontSize: 12, fontWeight: 800, color: '#475569', textAlign: 'center', width: 100 }}>Room</th>
                  <th style={{ padding: 12, fontSize: 12, fontWeight: 800, color: '#475569', textAlign: 'center', width: 120 }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredSlots.length > 0 ? (
                  filteredSlots.map((slot) => (
                    <tr key={slot.id} style={{ borderBottom: '1px solid #F1F5F9' }}>
                      <td style={{ padding: 12, fontSize: 13, fontWeight: 800, color: '#0F172A', textAlign: 'center' }}>{slot.day}</td>
                      <td style={{ padding: 12, fontSize: 13, fontWeight: 800, color: '#64748B', textAlign: 'center' }}>Period {slot.period}</td>
                      <td style={{ padding: 12, fontSize: 12.5, fontWeight: 700, color: '#1769E0', textAlign: 'center' }}>{slot.startTime} - {slot.endTime}</td>
                      <td style={{ padding: 12, fontSize: 13, fontWeight: 800, color: '#0F172A' }}>{slot.className}-{slot.section}</td>
                      <td style={{ padding: 12, fontSize: 13.5, fontWeight: 900, color: '#0F172A' }}>
                        <span style={{
                          backgroundColor: slot.type === 'Lunch' || slot.type === 'Break' ? '#FEF3C7' : '#EFF6FF',
                          color: slot.type === 'Lunch' || slot.type === 'Break' ? '#D97706' : '#1769E0',
                          padding: '3px 10px', borderRadius: 6, display: 'inline-block'
                        }}>
                          {slot.subject}
                        </span>
                      </td>
                      <td style={{ padding: 12, fontSize: 13, fontWeight: 700, color: '#475569' }}>{slot.teacherName}</td>
                      <td style={{ padding: 12, fontSize: 12.5, fontWeight: 700, color: '#64748B', textAlign: 'center' }}>{slot.room || 'Room 204'}</td>
                      <td style={{ padding: 12, textAlign: 'center' }}>
                        <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
                          <button
                            onClick={() => handleOpenEditModal(slot)}
                            style={{ background: 'none', border: 'none', color: '#1769E0', cursor: 'pointer' }}
                            title="Edit Slot"
                          >
                            <Edit size={16} />
                          </button>
                          <button
                            onClick={() => handleDeleteSlot(slot.id)}
                            style={{ background: 'none', border: 'none', color: '#EF4444', cursor: 'pointer' }}
                            title="Delete Slot"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={8} style={{ textAlign: 'center', padding: 30, color: '#64748B', fontSize: 13.5 }}>
                      No timetable slots found for the selected filter criteria.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* VIEW 2: TEACHER TIMETABLE */}
      {/* ========================================================================= */}
      {activeTab === 'teacher' && (
        <div className="avm-card no-print" style={{ padding: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h3 style={{ fontSize: 16, fontWeight: 900, color: '#0F172A', margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
              <UserCheck size={20} color="#1769E0" /> Teacher Schedule: {selectedTeacher === 'All' ? 'All Teachers' : selectedTeacher}
            </h3>
            <span style={{ backgroundColor: '#DCFCE7', color: '#15803D', padding: '4px 12px', borderRadius: 16, fontSize: 12, fontWeight: 800 }}>
              Derived from Central Store
            </span>
          </div>

          <div style={{ overflowX: 'auto', border: '1px solid #E2E8F0', borderRadius: 8 }}>
            <table className="avm-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ backgroundColor: '#F8FAFC', borderBottom: '2px solid #E2E8F0' }}>
                  <th style={{ padding: 12, fontSize: 12, fontWeight: 800, color: '#475569', textAlign: 'left' }}>Teacher Name</th>
                  <th style={{ padding: 12, fontSize: 12, fontWeight: 800, color: '#475569', textAlign: 'center' }}>Day</th>
                  <th style={{ padding: 12, fontSize: 12, fontWeight: 800, color: '#475569', textAlign: 'center' }}>Period</th>
                  <th style={{ padding: 12, fontSize: 12, fontWeight: 800, color: '#475569', textAlign: 'center' }}>Time Slot</th>
                  <th style={{ padding: 12, fontSize: 12, fontWeight: 800, color: '#475569', textAlign: 'left' }}>Class & Section</th>
                  <th style={{ padding: 12, fontSize: 12, fontWeight: 800, color: '#475569', textAlign: 'left' }}>Subject</th>
                  <th style={{ padding: 12, fontSize: 12, fontWeight: 800, color: '#475569', textAlign: 'center' }}>Room</th>
                </tr>
              </thead>
              <tbody>
                {filteredSlots.length > 0 ? (
                  filteredSlots.map((slot) => (
                    <tr key={slot.id} style={{ borderBottom: '1px solid #F1F5F9' }}>
                      <td style={{ padding: 12, fontSize: 13.5, fontWeight: 800, color: '#0F172A' }}>{slot.teacherName}</td>
                      <td style={{ padding: 12, fontSize: 13, fontWeight: 800, color: '#475569', textAlign: 'center' }}>{slot.day}</td>
                      <td style={{ padding: 12, fontSize: 13, fontWeight: 800, color: '#64748B', textAlign: 'center' }}>Period {slot.period}</td>
                      <td style={{ padding: 12, fontSize: 12.5, fontWeight: 700, color: '#1769E0', textAlign: 'center' }}>{slot.startTime} - {slot.endTime}</td>
                      <td style={{ padding: 12, fontSize: 13, fontWeight: 800, color: '#1769E0' }}>{slot.className}-{slot.section}</td>
                      <td style={{ padding: 12, fontSize: 13, fontWeight: 800, color: '#0F172A' }}>{slot.subject}</td>
                      <td style={{ padding: 12, fontSize: 12.5, fontWeight: 700, color: '#64748B', textAlign: 'center' }}>{slot.room || 'Room 204'}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} style={{ textAlign: 'center', padding: 30, color: '#64748B', fontSize: 13.5 }}>
                      No teacher timetable slots found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* VIEW 3: WEEKLY GRID VIEW */}
      {/* ========================================================================= */}
      {activeTab === 'weekly' && (
        <div className="avm-card no-print" style={{ padding: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h3 style={{ fontSize: 16, fontWeight: 900, color: '#0F172A', margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
              <Calendar size={20} color="#1769E0" /> Weekly Schedule Matrix: {selectedClass} - {selectedSection}
            </h3>
          </div>

          <div style={{ overflowX: 'auto', border: '1px solid #E2E8F0', borderRadius: 8 }}>
            <table className="avm-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ backgroundColor: '#F8FAFC', borderBottom: '2px solid #E2E8F0' }}>
                  <th style={{ padding: 12, fontSize: 12, fontWeight: 800, color: '#475569', textAlign: 'center', width: 100 }}>Day / Period</th>
                  {periods.map(p => (
                    <th key={p.id} style={{ padding: 10, fontSize: 11.5, fontWeight: 800, color: '#475569', textAlign: 'center', minWidth: 110 }}>
                      <div>{p.name}</div>
                      <div style={{ fontSize: 10, color: '#1769E0', marginTop: 2 }}>{p.startTime} - {p.endTime}</div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {availableDays.map(d => (
                  <tr key={d} style={{ borderBottom: '1px solid #F1F5F9' }}>
                    <td style={{ padding: 12, fontSize: 13, fontWeight: 900, color: '#0F172A', backgroundColor: '#F8FAFC', textAlign: 'center' }}>{d}</td>
                    {periods.map(p => {
                      const matched = timetableSlots.find(s => {
                        const matchDay = (s.day || '').toLowerCase() === d.toLowerCase();
                        const matchPeriod = Number(s.period) === p.periodNumber;
                        const matchCls = (s.className || '').toLowerCase().replace(/class\s*/i, '').trim() === selectedClass.toLowerCase().replace(/class\s*/i, '').trim();
                        const matchSec = (s.section || '').toUpperCase() === selectedSection.toUpperCase();
                        return matchDay && matchPeriod && matchCls && matchSec;
                      });

                      return (
                        <td key={p.id} style={{ padding: 8, textAlign: 'center', verticalAlign: 'top' }}>
                          {matched ? (
                            <div style={{
                              backgroundColor: p.type === 'Lunch' || p.type === 'Break' ? '#FEF3C7' : '#EFF6FF',
                              border: '1px solid #BFDBFE',
                              borderRadius: 6,
                              padding: 6,
                              fontSize: 11.5
                            }}>
                              <div style={{ fontWeight: 900, color: '#0F172A' }}>{matched.subject}</div>
                              <div style={{ fontSize: 10.5, color: '#1769E0', marginTop: 2, fontWeight: 700 }}>{matched.teacherName}</div>
                              <div style={{ fontSize: 9.5, color: '#64748B', marginTop: 2 }}>{matched.room || 'Room 204'}</div>
                            </div>
                          ) : (
                            <div style={{ color: '#CBD5E1', fontSize: 11, paddingTop: 10 }}>-</div>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* VIEW 4: CLASS SUBJECTS MANAGER */}
      {/* ========================================================================= */}
      {activeTab === 'class_subjects' && (
        <div className="avm-card no-print" style={{ padding: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h3 style={{ fontSize: 16, fontWeight: 900, color: '#0F172A', margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
              <Layers size={20} color="#1769E0" /> Class-Wise Subjects Assignment
            </h3>

            <button
              onClick={() => setManageClassSubjectsModalOpen(true)}
              className="avm-btn-primary"
              style={{ backgroundColor: '#1769E0', padding: '8px 16px', fontSize: 13, fontWeight: 800 }}
            >
              + Assign Subject to Class
            </button>
          </div>

          <div style={{ overflowX: 'auto', border: '1px solid #E2E8F0', borderRadius: 8 }}>
            <table className="avm-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ backgroundColor: '#F8FAFC', borderBottom: '2px solid #E2E8F0' }}>
                  <th style={{ padding: 12, fontSize: 12, fontWeight: 800, color: '#475569', textAlign: 'left' }}>Class</th>
                  <th style={{ padding: 12, fontSize: 12, fontWeight: 800, color: '#475569', textAlign: 'center' }}>Section</th>
                  <th style={{ padding: 12, fontSize: 12, fontWeight: 800, color: '#475569', textAlign: 'left' }}>Assigned Subject</th>
                  <th style={{ padding: 12, fontSize: 12, fontWeight: 800, color: '#475569', textAlign: 'center' }}>Status</th>
                  <th style={{ padding: 12, fontSize: 12, fontWeight: 800, color: '#475569', textAlign: 'center', width: 100 }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {classSubjects.map(cs => (
                  <tr key={cs.id} style={{ borderBottom: '1px solid #F1F5F9' }}>
                    <td style={{ padding: 12, fontSize: 13.5, fontWeight: 800, color: '#0F172A' }}>{cs.className}</td>
                    <td style={{ padding: 12, fontSize: 13, fontWeight: 800, color: '#1769E0', textAlign: 'center' }}>{cs.section}</td>
                    <td style={{ padding: 12, fontSize: 13.5, fontWeight: 800, color: '#0F172A' }}>{cs.subjectName}</td>
                    <td style={{ padding: 12, textAlign: 'center' }}>
                      <span style={{ backgroundColor: '#DCFCE7', color: '#15803D', padding: '3px 10px', borderRadius: 12, fontSize: 11.5, fontWeight: 800 }}>
                        {cs.status || 'Active'}
                      </span>
                    </td>
                    <td style={{ padding: 12, textAlign: 'center' }}>
                      <button
                        onClick={() => {
                          if (confirm(`Remove ${cs.subjectName} from ${cs.className}-${cs.section}?`)) {
                            timetableService.removeClassSubject(cs.id);
                            loadData();
                          }
                        }}
                        style={{ background: 'none', border: 'none', color: '#EF4444', cursor: 'pointer' }}
                        title="Remove Subject"
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* VIEW 5: TEACHING ASSIGNMENTS MANAGER */}
      {/* ========================================================================= */}
      {activeTab === 'teaching_assignments' && (
        <div className="avm-card no-print" style={{ padding: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h3 style={{ fontSize: 16, fontWeight: 900, color: '#0F172A', margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
              <LinkIcon size={20} color="#8B5CF6" /> Teacher-Subject Teaching Assignments
            </h3>

            <button
              onClick={() => setManageTeachingAssignmentsModalOpen(true)}
              className="avm-btn-primary"
              style={{ backgroundColor: '#8B5CF6', padding: '8px 16px', fontSize: 13, fontWeight: 800 }}
            >
              + Assign Teacher to Subject
            </button>
          </div>

          <div style={{ overflowX: 'auto', border: '1px solid #E2E8F0', borderRadius: 8 }}>
            <table className="avm-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ backgroundColor: '#F8FAFC', borderBottom: '2px solid #E2E8F0' }}>
                  <th style={{ padding: 12, fontSize: 12, fontWeight: 800, color: '#475569', textAlign: 'left' }}>Teacher Name</th>
                  <th style={{ padding: 12, fontSize: 12, fontWeight: 800, color: '#475569', textAlign: 'left' }}>Subject</th>
                  <th style={{ padding: 12, fontSize: 12, fontWeight: 800, color: '#475569', textAlign: 'left' }}>Class</th>
                  <th style={{ padding: 12, fontSize: 12, fontWeight: 800, color: '#475569', textAlign: 'center' }}>Section</th>
                  <th style={{ padding: 12, fontSize: 12, fontWeight: 800, color: '#475569', textAlign: 'center', width: 100 }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {teachingAssignments.map(ta => (
                  <tr key={ta.id} style={{ borderBottom: '1px solid #F1F5F9' }}>
                    <td style={{ padding: 12, fontSize: 13.5, fontWeight: 800, color: '#0F172A' }}>{ta.teacherName}</td>
                    <td style={{ padding: 12, fontSize: 13.5, fontWeight: 800, color: '#1769E0' }}>{ta.subjectName}</td>
                    <td style={{ padding: 12, fontSize: 13, fontWeight: 700, color: '#475569' }}>{ta.className}</td>
                    <td style={{ padding: 12, fontSize: 13, fontWeight: 800, color: '#475569', textAlign: 'center' }}>{ta.section}</td>
                    <td style={{ padding: 12, textAlign: 'center' }}>
                      <button
                        onClick={() => {
                          if (confirm(`Remove teaching assignment for ${ta.teacherName}?`)) {
                            timetableService.removeTeachingAssignment(ta.id);
                            loadData();
                          }
                        }}
                        style={{ background: 'none', border: 'none', color: '#EF4444', cursor: 'pointer' }}
                        title="Remove Assignment"
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* VIEW 6: PERIODS MASTER */}
      {/* ========================================================================= */}
      {activeTab === 'periods' && (
        <div className="avm-card no-print" style={{ padding: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h3 style={{ fontSize: 16, fontWeight: 900, color: '#0F172A', margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
              <Clock size={20} color="#1769E0" /> School Periods Master
            </h3>
            <button
              onClick={() => setManagePeriodsModalOpen(true)}
              className="avm-btn-primary"
              style={{ backgroundColor: '#1769E0', padding: '8px 16px', fontSize: 13, fontWeight: 800 }}
            >
              + Add Period
            </button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 16 }}>
            {periods.map(p => (
              <div key={p.id} style={{ border: '1px solid #CBD5E1', borderRadius: 8, padding: 16, backgroundColor: '#FFFFFF' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <span style={{ fontSize: 11, fontWeight: 900, backgroundColor: '#EFF6FF', color: '#1769E0', padding: '2px 8px', borderRadius: 4 }}>
                    Period {p.periodNumber}
                  </span>
                  <span style={{ fontSize: 11, fontWeight: 800, color: p.type === 'Regular' ? '#16A34A' : '#D97706' }}>
                    {p.type}
                  </span>
                </div>

                <h4 style={{ fontSize: 15, fontWeight: 900, color: '#0F172A', margin: '4px 0 8px 0' }}>{p.name}</h4>

                <div style={{ fontSize: 13, fontWeight: 800, color: '#1769E0', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Clock size={14} /> {p.startTime} - {p.endTime}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 1: CREATE / EDIT TIMETABLE ENTRY (WITH ADMIN-MANAGED CASCADING DROPDOWNS) */}
      {/* ========================================================================= */}
      <Modal isOpen={createModalOpen} onClose={() => setCreateModalOpen(false)} title={editSlot ? 'Edit Timetable Entry' : 'Create Timetable Entry'}>
        <form onSubmit={handleSaveSlotForm} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {conflictError && (
            <div style={{ backgroundColor: '#FEE2E2', border: '1px solid #FCA5A5', color: '#991B1B', padding: 12, borderRadius: 8, fontSize: 12.5, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8 }}>
              <AlertTriangle size={18} color="#DC2626" />
              <span>{conflictError}</span>
            </div>
          )}

          {/* Day & Period */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={{ fontSize: 13, fontWeight: 700, color: '#334155', display: 'block', marginBottom: 4 }}>Day *</label>
              <select
                required
                className="avm-input"
                value={formDay}
                onChange={(e) => setFormDay(e.target.value)}
              >
                {availableDays.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>

            <div>
              <label style={{ fontSize: 13, fontWeight: 700, color: '#334155', display: 'block', marginBottom: 4 }}>Period *</label>
              <select
                required
                className="avm-input"
                value={formPeriod}
                onChange={(e) => {
                  const val = e.target.value;
                  if (val === 'ADD_PERIOD') {
                    setCreateModalOpen(false);
                    setManagePeriodsModalOpen(true);
                  } else {
                    handlePeriodChange(Number(val));
                  }
                }}
              >
                <optgroup label="ADMIN MANAGED PERIODS">
                  {periods.map(p => (
                    <option key={p.id} value={p.periodNumber}>
                      {p.name} — {p.startTime} to {p.endTime}
                    </option>
                  ))}
                </optgroup>
                <optgroup label="──────────────────">
                  <option value="ADD_PERIOD">+ Create / Manage Periods</option>
                </optgroup>
              </select>
            </div>
          </div>

          {/* Time Slots */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={{ fontSize: 13, fontWeight: 700, color: '#334155', display: 'block', marginBottom: 4 }}>Start Time</label>
              <input
                type="text"
                className="avm-input"
                value={formStartTime}
                onChange={(e) => setFormStartTime(e.target.value)}
              />
            </div>

            <div>
              <label style={{ fontSize: 13, fontWeight: 700, color: '#334155', display: 'block', marginBottom: 4 }}>End Time</label>
              <input
                type="text"
                className="avm-input"
                value={formEndTime}
                onChange={(e) => setFormEndTime(e.target.value)}
              />
            </div>
          </div>

          {/* Class & Section */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={{ fontSize: 13, fontWeight: 700, color: '#334155', display: 'block', marginBottom: 4 }}>Class *</label>
              <select
                required
                className="avm-input"
                value={formClass}
                onChange={(e) => setFormClass(e.target.value)}
              >
                {availableClasses.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>

            <div>
              <label style={{ fontSize: 13, fontWeight: 700, color: '#334155', display: 'block', marginBottom: 4 }}>Section *</label>
              <select
                required
                className="avm-input"
                value={formSection}
                onChange={(e) => setFormSection(e.target.value)}
              >
                {availableSections.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>

          {/* CASCADING SUBJECT DROPDOWN (CLASS-SPECIFIC) */}
          <div>
            <label style={{ fontSize: 13, fontWeight: 700, color: '#334155', display: 'block', marginBottom: 4 }}>
              Subject (Assigned to {formClass}-{formSection}) *
            </label>
            <select
              required
              className="avm-input"
              value={formSubject}
              onChange={(e) => {
                const val = e.target.value;
                if (val === 'ADD_NEW_SUBJECT') {
                  setAddSubjectModalOpen(true);
                } else if (val === 'MANAGE_CLASS_SUBJECTS') {
                  setCreateModalOpen(false);
                  setManageClassSubjectsModalOpen(true);
                } else {
                  setFormSubject(val);
                }
              }}
            >
              <optgroup label={`SUBJECTS FOR ${formClass.toUpperCase()}-${formSection}`}>
                {formClassSubjectOptions.map((subj, idx) => (
                  <option key={idx} value={subj}>
                    {subj}
                  </option>
                ))}
              </optgroup>
              <optgroup label="──────────────────">
                <option value="ADD_NEW_SUBJECT">+ Add New Subject</option>
                <option value="MANAGE_CLASS_SUBJECTS">Manage Class Subjects ({formClass}-{formSection})</option>
              </optgroup>
            </select>
          </div>

          {/* CASCADING TEACHER DROPDOWN */}
          <div>
            <label style={{ fontSize: 13, fontWeight: 700, color: '#334155', display: 'block', marginBottom: 4 }}>
              Assigned Teacher *
            </label>
            <select
              required
              className="avm-input"
              value={formTeacher}
              onChange={(e) => {
                const val = e.target.value;
                if (val === 'MANAGE_TEACHING_ASSIGNMENTS') {
                  setCreateModalOpen(false);
                  setManageTeachingAssignmentsModalOpen(true);
                } else {
                  setFormTeacher(val);
                }
              }}
            >
              {formRecommendedTeachers.length > 0 && (
                <optgroup label={`RECOMMENDED TEACHERS FOR ${formSubject.toUpperCase()}`}>
                  {formRecommendedTeachers.map((t, idx) => (
                    <option key={`rec-${idx}`} value={t}>{t} ★ (Assigned to {formSubject})</option>
                  ))}
                </optgroup>
              )}

              <optgroup label="ALL EMPLOYEES / TEACHERS">
                {availableTeachers.map((t, i) => (
                  <option key={i} value={t.name}>{t.name} ({t.designation || 'Teacher'})</option>
                ))}
              </optgroup>

              <optgroup label="──────────────────">
                <option value="MANAGE_TEACHING_ASSIGNMENTS">Manage Teaching Assignments</option>
              </optgroup>
            </select>
          </div>

          {/* Room / Lab */}
          <div>
            <label style={{ fontSize: 13, fontWeight: 700, color: '#334155', display: 'block', marginBottom: 4 }}>Room No / Lab</label>
            <input
              type="text"
              className="avm-input"
              placeholder="e.g. Room 204 or Science Lab"
              value={formRoom}
              onChange={(e) => setFormRoom(e.target.value)}
            />
          </div>

          {!editSlot && (
            <label style={{ fontSize: 12.5, fontWeight: 700, color: '#334155', display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={formApplyAllDays}
                onChange={(e) => setFormApplyAllDays(e.target.checked)}
              /> Apply same period assignment to all 6 days (Mon-Sat)
            </label>
          )}

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 10 }}>
            <button type="button" onClick={() => setCreateModalOpen(false)} className="avm-btn-secondary">Cancel</button>
            <button type="submit" className="avm-btn-primary" style={{ backgroundColor: '#1769E0' }}>Save Timetable Entry</button>
          </div>
        </form>
      </Modal>

      {/* ========================================================================= */}
      {/* MODAL 2: ADD SUBJECT MODAL */}
      {/* ========================================================================= */}
      <Modal isOpen={addSubjectModalOpen} onClose={() => setAddSubjectModalOpen(false)} title="Add New Subject">
        <form onSubmit={handleSaveSubjectForm} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <label style={{ fontSize: 13, fontWeight: 700, color: '#334155', display: 'block', marginBottom: 4 }}>Subject Name *</label>
            <input
              type="text"
              required
              className="avm-input"
              placeholder="e.g. Environmental Studies"
              value={subjFormName}
              onChange={(e) => setSubjFormName(e.target.value)}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={{ fontSize: 13, fontWeight: 700, color: '#334155', display: 'block', marginBottom: 4 }}>Subject Code</label>
              <input
                type="text"
                className="avm-input"
                placeholder="e.g. EVS"
                value={subjFormCode}
                onChange={(e) => setSubjFormCode(e.target.value)}
              />
            </div>

            <div>
              <label style={{ fontSize: 13, fontWeight: 700, color: '#334155', display: 'block', marginBottom: 4 }}>Subject Type</label>
              <select
                className="avm-input"
                value={subjFormType}
                onChange={(e) => setSubjFormType(e.target.value)}
              >
                <option value="Core">Core</option>
                <option value="Language">Language</option>
                <option value="Optional">Optional</option>
                <option value="Activity">Activity</option>
                <option value="Practical">Practical</option>
              </select>
            </div>
          </div>

          <label style={{ fontSize: 12.5, fontWeight: 700, color: '#334155', display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={subjAssignToCurrentClass}
              onChange={(e) => setSubjAssignToCurrentClass(e.target.checked)}
            /> Assign immediately to {formClass}-{formSection}
          </label>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 10 }}>
            <button type="button" onClick={() => setAddSubjectModalOpen(false)} className="avm-btn-secondary">Cancel</button>
            <button type="submit" className="avm-btn-primary" style={{ backgroundColor: '#1769E0' }}>Save Subject</button>
          </div>
        </form>
      </Modal>

      {/* ========================================================================= */}
      {/* MODAL 3: MANAGE CLASS SUBJECTS MODAL */}
      {/* ========================================================================= */}
      <Modal isOpen={manageClassSubjectsModalOpen} onClose={() => setManageClassSubjectsModalOpen(false)} title="Manage Class-Wise Subjects">
        <form onSubmit={handleAddClassSubject} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
            <div>
              <label style={{ fontSize: 12, fontWeight: 700, color: '#64748B' }}>Class</label>
              <select className="avm-input" value={csClass} onChange={e => setCsClass(e.target.value)}>
                {availableClasses.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>

            <div>
              <label style={{ fontSize: 12, fontWeight: 700, color: '#64748B' }}>Section</label>
              <select className="avm-input" value={csSection} onChange={e => setCsSection(e.target.value)}>
                {availableSections.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>

            <div>
              <label style={{ fontSize: 12, fontWeight: 700, color: '#64748B' }}>Select Subject</label>
              <select className="avm-input" value={csSubjectName} onChange={e => setCsSubjectName(e.target.value)}>
                <option value="">-- Choose --</option>
                {availableMasterSubjects.map((s, i) => <option key={i} value={s}>{s}</option>)}
              </select>
            </div>
          </div>

          <button type="submit" className="avm-btn-primary" style={{ backgroundColor: '#1769E0', alignSelf: 'flex-end', fontSize: 12, padding: '6px 16px' }}>
            + Assign Subject to {csClass}-{csSection}
          </button>

          <div style={{ border: '1px solid #E2E8F0', borderRadius: 8, overflow: 'hidden', marginTop: 10 }}>
            <div style={{ padding: 10, backgroundColor: '#F8FAFC', fontWeight: 800, fontSize: 12, color: '#475569' }}>
              Subjects Currently Assigned to {csClass}-{csSection}:
            </div>
            <div style={{ padding: 12, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {timetableService.getClassSubjects(csClass, csSection).map(cs => (
                <span key={cs.id} style={{ backgroundColor: '#EFF6FF', color: '#1769E0', border: '1px solid #BFDBFE', padding: '4px 10px', borderRadius: 16, fontSize: 12, fontWeight: 800, display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                  {cs.subjectName}
                  <button
                    type="button"
                    onClick={() => {
                      timetableService.removeClassSubject(cs.id);
                      loadData();
                    }}
                    style={{ background: 'none', border: 'none', color: '#EF4444', cursor: 'pointer', padding: 0 }}
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          </div>
        </form>
      </Modal>

      {/* ========================================================================= */}
      {/* MODAL 4: MANAGE TEACHING ASSIGNMENTS MODAL */}
      {/* ========================================================================= */}
      <Modal isOpen={manageTeachingAssignmentsModalOpen} onClose={() => setManageTeachingAssignmentsModalOpen(false)} title="Manage Teaching Assignments">
        <form onSubmit={handleAddTeachingAssignment} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <div>
              <label style={{ fontSize: 12, fontWeight: 700, color: '#64748B' }}>Teacher *</label>
              <select className="avm-input" value={taTeacherName} onChange={e => setTaTeacherName(e.target.value)}>
                <option value="">-- Choose Teacher --</option>
                {availableTeachers.map((t, i) => <option key={i} value={t.name}>{t.name}</option>)}
              </select>
            </div>

            <div>
              <label style={{ fontSize: 12, fontWeight: 700, color: '#64748B' }}>Subject *</label>
              <select className="avm-input" value={taSubjectName} onChange={e => setTaSubjectName(e.target.value)}>
                <option value="">-- Choose Subject --</option>
                {availableMasterSubjects.map((s, i) => <option key={i} value={s}>{s}</option>)}
              </select>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <div>
              <label style={{ fontSize: 12, fontWeight: 700, color: '#64748B' }}>Class</label>
              <select className="avm-input" value={taClass} onChange={e => setTaClass(e.target.value)}>
                {availableClasses.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>

            <div>
              <label style={{ fontSize: 12, fontWeight: 700, color: '#64748B' }}>Section</label>
              <select className="avm-input" value={taSection} onChange={e => setTaSection(e.target.value)}>
                {availableSections.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>

          <button type="submit" className="avm-btn-primary" style={{ backgroundColor: '#8B5CF6', alignSelf: 'flex-end', fontSize: 12, padding: '6px 16px' }}>
            + Save Teaching Assignment
          </button>
        </form>
      </Modal>

      {/* ========================================================================= */}
      {/* MODAL 5: MANAGE PERIODS MODAL */}
      {/* ========================================================================= */}
      <Modal isOpen={managePeriodsModalOpen} onClose={() => setManagePeriodsModalOpen(false)} title="Manage School Periods">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <form onSubmit={handleSavePeriodMaster} style={{ backgroundColor: '#F8FAFC', padding: 14, borderRadius: 8, border: '1px solid #E2E8F0', display: 'flex', flexDirection: 'column', gap: 12 }}>
            <h4 style={{ margin: 0, fontSize: 13.5, fontWeight: 800, color: '#0F172A' }}>+ Add New Period</h4>

            <div style={{ display: 'grid', gridTemplateColumns: '80px 1fr 120px 120px', gap: 10 }}>
              <input
                type="number"
                placeholder="No."
                className="avm-input"
                value={periodNum}
                onChange={(e) => setPeriodNum(Number(e.target.value))}
              />
              <input
                type="text"
                placeholder="Period Name"
                className="avm-input"
                value={periodName}
                onChange={(e) => setPeriodName(e.target.value)}
              />
              <input
                type="text"
                placeholder="Start"
                className="avm-input"
                value={periodStart}
                onChange={(e) => setPeriodStart(e.target.value)}
              />
              <input
                type="text"
                placeholder="End"
                className="avm-input"
                value={periodEnd}
                onChange={(e) => setPeriodEnd(e.target.value)}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <select
                className="avm-input"
                style={{ width: 160 }}
                value={periodType}
                onChange={(e: any) => setPeriodType(e.target.value)}
              >
                <option value="Regular">Regular</option>
                <option value="Break">Break</option>
                <option value="Lunch">Lunch</option>
                <option value="Assembly">Assembly</option>
              </select>

              <button type="submit" className="avm-btn-primary" style={{ backgroundColor: '#1769E0', fontSize: 12, padding: '6px 14px' }}>Save Period</button>
            </div>
          </form>

          <div style={{ border: '1px solid #E2E8F0', borderRadius: 8, overflow: 'hidden' }}>
            <table className="avm-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ backgroundColor: '#F8FAFC', borderBottom: '1px solid #E2E8F0' }}>
                  <th style={{ padding: 8, fontSize: 12, fontWeight: 800, textAlign: 'center' }}>#</th>
                  <th style={{ padding: 8, fontSize: 12, fontWeight: 800, textAlign: 'left' }}>Period Name</th>
                  <th style={{ padding: 8, fontSize: 12, fontWeight: 800, textAlign: 'center' }}>Time</th>
                  <th style={{ padding: 8, fontSize: 12, fontWeight: 800, textAlign: 'center' }}>Type</th>
                  <th style={{ padding: 8, fontSize: 12, fontWeight: 800, textAlign: 'center', width: 80 }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {periods.map(p => (
                  <tr key={p.id} style={{ borderBottom: '1px solid #F1F5F9' }}>
                    <td style={{ padding: 8, fontSize: 12, fontWeight: 800, textAlign: 'center' }}>{p.periodNumber}</td>
                    <td style={{ padding: 8, fontSize: 12.5, fontWeight: 800 }}>{p.name}</td>
                    <td style={{ padding: 8, fontSize: 12, color: '#1769E0', textAlign: 'center', fontWeight: 700 }}>{p.startTime} - {p.endTime}</td>
                    <td style={{ padding: 8, fontSize: 11.5, textAlign: 'center' }}>{p.type}</td>
                    <td style={{ padding: 8, textAlign: 'center' }}>
                      <button
                        onClick={() => {
                          if (confirm(`Delete period ${p.name}?`)) {
                            timetableService.deletePeriod(p.id);
                            loadData();
                          }
                        }}
                        style={{ background: 'none', border: 'none', color: '#EF4444', cursor: 'pointer' }}
                        title="Delete Period"
                      >
                        <Trash2 size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </Modal>

      {/* ========================================================================= */}
      {/* PRINT CONTAINER: SINGLE-CLICK A4 PRINT ENGINE */}
      {/* ========================================================================= */}
      <div className="print-only-container" style={{ display: 'none' }}>
        <div style={{ padding: '40px 50px', backgroundColor: '#FFFFFF', width: '100%', height: '100vh', boxSizing: 'border-box' }}>
          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '3px double #1769E0', paddingBottom: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <div style={{ width: 60, height: 60, backgroundColor: '#1769E0', color: '#FFFFFF', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: 22 }}>
                AVM
              </div>
              <div>
                <h1 style={{ fontSize: 24, fontWeight: 900, color: '#0F172A', margin: 0 }}>ADARSH VIDYA MANDIR</h1>
                <div style={{ fontSize: 13, color: '#64748B', fontWeight: 800 }}>KAJRAILI • BHAGALPUR, BIHAR - 812005</div>
                <div style={{ fontSize: 11, color: '#1769E0', fontWeight: 700 }}>Affiliated to CBSE Board • School Timetable Schedule</div>
              </div>
            </div>

            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 14, fontWeight: 900, color: '#0F172A' }}>
                {activeTab === 'teacher' ? `TEACHER: ${selectedTeacher}` : `CLASS: ${selectedClass}-${selectedSection}`}
              </div>
              <div style={{ fontSize: 11, color: '#64748B', fontWeight: 700 }}>Academic Session 2026–27</div>
            </div>
          </div>

          {/* Weekly Schedule Table Grid for Print */}
          <div style={{ marginTop: 24 }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid #0F172A' }}>
              <thead>
                <tr style={{ backgroundColor: '#F1F5F9', borderBottom: '2px solid #0F172A' }}>
                  <th style={{ border: '1px solid #0F172A', padding: 8, fontSize: 11, fontWeight: 900 }}>Day / Period</th>
                  {periods.map(p => (
                    <th key={p.id} style={{ border: '1px solid #0F172A', padding: 6, fontSize: 10, fontWeight: 900, textAlign: 'center' }}>
                      {p.name}<br />({p.startTime})
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {availableDays.map(d => (
                  <tr key={d} style={{ borderBottom: '1px solid #0F172A' }}>
                    <td style={{ border: '1px solid #0F172A', padding: 8, fontSize: 11, fontWeight: 900, backgroundColor: '#F8FAFC' }}>{d}</td>
                    {periods.map(p => {
                      const matched = timetableSlots.find(s => {
                        const matchDay = (s.day || '').toLowerCase() === d.toLowerCase();
                        const matchPeriod = Number(s.period) === p.periodNumber;
                        const matchCls = activeTab === 'teacher' || (s.className || '').toLowerCase().replace(/class\s*/i, '').trim() === selectedClass.toLowerCase().replace(/class\s*/i, '').trim();
                        const matchSec = activeTab === 'teacher' || (s.section || '').toUpperCase() === selectedSection.toUpperCase();
                        const matchTeach = activeTab !== 'teacher' || (s.teacherName || '').toLowerCase().includes(selectedTeacher.toLowerCase());
                        return matchDay && matchPeriod && matchCls && matchSec && matchTeach;
                      });

                      return (
                        <td key={p.id} style={{ border: '1px solid #0F172A', padding: 6, fontSize: 9.5, textAlign: 'center', verticalAlign: 'top' }}>
                          {matched ? (
                            <div>
                              <div style={{ fontWeight: 'bold' }}>{matched.subject}</div>
                              <div style={{ fontSize: 8.5 }}>{matched.teacherName}</div>
                              <div style={{ fontSize: 8 }}>{matched.className}-{matched.section}</div>
                            </div>
                          ) : '-'}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Footer */}
          <div style={{ marginTop: 40, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
            <div style={{ fontSize: 11, color: '#475569' }}>
              <div>Date of Print: <strong>{new Date().toLocaleDateString('en-GB')}</strong></div>
              <div>Place: <strong>Kajraili, Bhagalpur</strong></div>
            </div>

            <div style={{ textAlign: 'center' }}>
              <div style={{ fontFamily: 'cursive', fontSize: 16, color: '#1769E0', fontWeight: 'bold' }}>Principal</div>
              <div style={{ fontSize: 11, color: '#0F172A', fontWeight: 900, borderTop: '1px solid #0F172A', paddingTop: 4 }}>
                Principal & Academic Controller<br />Adarsh Vidya Mandir
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Global CSS for Print */}
      <style>{`
        @media print {
          body * {
            visibility: hidden !important;
          }
          .no-print {
            display: none !important;
          }
          .print-only-container, .print-only-container * {
            visibility: visible !important;
            display: block !important;
          }
          .print-only-container {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
          }
          @page {
            size: A4 landscape;
            margin: 0;
          }
        }
      `}</style>
    </div>
  );
};
