import React, { useState, useEffect } from 'react';
import type { Student, Employee, Exam, Notice, UserRole, NoticeRecipients, AttendanceRecord } from '../types';
import { demoDataStore } from '../services/demoDataStore';
import { studentService } from '../services/studentService';
import { employeeService } from '../services/employeeService';
import { classService } from '../services/classService';
import { academicService } from '../services/academicService';
import { attendanceService } from '../services/attendanceService';
import { employeeAttendanceService } from '../services/employeeAttendanceService';
import { homeworkService } from '../services/homeworkService';
import { examService } from '../services/examService';
import { marksService } from '../services/marksService';
import { resultService } from '../services/resultService';
import { feeService } from '../services/feeService';
import { noticeService } from '../services/noticeService';
import { notificationService } from '../services/notificationService';
import { settingsService } from '../services/settingsService';
import { accountService } from '../services/accountService';

import {
  Menu, Search, Plus, Filter, RefreshCw, CheckCircle, XCircle, Clock,
  Users, GraduationCap, School, BookOpen, FileText, Award, CreditCard,
  Bell, Calendar, Shield, Edit, Trash2, Eye, ChevronRight, X, UserCheck,
  Briefcase, CheckSquare, Sparkles, Sliders, ArrowRight, Printer, Bus,
  ArrowLeft, LogOut, UserPlus, ShieldCheck, MapPin, Globe, Phone
} from 'lucide-react';

import { AdminSettingsModule } from '../components/AdminSettingsModule';
import { TransportModule } from '../components/TransportModule';
import { CertificatesModule } from '../components/CertificatesModule';
import { TimetableModule } from '../components/TimetableModule';
import { CentralReportsModule } from '../components/CentralReportsModule';
import { AdminEmployeeAttendanceModule } from '../components/AdminEmployeeAttendanceModule';
import { AdminEmployeeLeaveModule } from '../components/AdminEmployeeLeaveModule';
import { AdminMarksModule } from '../components/AdminMarksModule';
import { AdmitCardModal } from '../components/AdmitCardModal';
import { ReportCardModal } from '../components/ReportCardModal';
import { ReceiptModal } from '../components/ReceiptModal';
import { StudentFullDataModal } from '../components/StudentFullDataModal';

interface AdminMobileDashboardProps {
  onOpenDrawer: () => void;
  onLogout: () => void;
  onSwitchAccount?: (accountId: string) => void;
  onAddAccount?: () => void;
  activeTab?: string;
  onTabChange?: (tab: string) => void;
}

export const AdminMobileDashboard: React.FC<AdminMobileDashboardProps> = ({
  onOpenDrawer,
  onLogout,
  onSwitchAccount,
  onAddAccount,
  activeTab: externalTab,
  onTabChange
}) => {
  const [activeTab, setActiveTab] = useState<string>(externalTab || 'home');

  useEffect(() => {
    if (externalTab) {
      setActiveTab(externalTab);
    }
  }, [externalTab]);

  const handleSelectTab = (tab: string) => {
    setActiveTab(tab);
    if (onTabChange) {
      onTabChange(tab);
    }
  };

  // Central Database state
  const [dbVersion, setDbVersion] = useState(0);

  useEffect(() => {
    const unsub = demoDataStore.subscribe(() => {
      setDbVersion((v) => v + 1);
    });
    return () => unsub();
  }, []);

  const db = demoDataStore.getDB() as any;
  const students: Student[] = db.students || [];
  const employees: Employee[] = db.employees || [];
  const classes = db.classes || [];
  const notices: Notice[] = db.notices || [];
  const homeworkList = db.homework || [];

  // Feedback Toast
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3000);
  };

  // Modals state
  const [selectedStudentForModal, setSelectedStudentForModal] = useState<Student | null>(null);
  const [selectedStudentForReportCard, setSelectedStudentForReportCard] = useState<any | null>(null);
  const [selectedAdmitCardExam, setSelectedAdmitCardExam] = useState<Exam | null>(null);
  const [selectedReceipt, setSelectedReceipt] = useState<any | null>(null);

  // Form modals state
  const [addStudentOpen, setAddStudentOpen] = useState(false);
  const [addEmployeeOpen, setAddEmployeeOpen] = useState(false);
  const [createNoticeOpen, setCreateNoticeOpen] = useState(false);
  const [createHomeworkOpen, setCreateHomeworkOpen] = useState(false);

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedClassFilter, setSelectedClassFilter] = useState('All');

  // Attendance Form State
  const [attDate, setAttDate] = useState(new Date().toISOString().split('T')[0]);
  const [attClass, setAttClass] = useState('Class 5');
  const [attSection, setAttSection] = useState('A');
  const [attRecords, setAttRecords] = useState<Record<string, 'present' | 'absent' | 'leave'>>({});

  useEffect(() => {
    const classStudents = students.filter(
      (s: any) => s.className === attClass && (attSection === 'All' || s.section === attSection)
    );
    const initialAtt: Record<string, 'present' | 'absent' | 'leave'> = {};
    classStudents.forEach((s: any) => {
      initialAtt[s.id || s.admissionNo] = 'present';
    });
    setAttRecords(initialAtt);
  }, [attClass, attSection, students]);

  const handleSaveStudentAttendance = async () => {
    const listToSave: AttendanceRecord[] = Object.keys(attRecords).map((stuId) => ({
      studentId: stuId,
      date: attDate,
      status: attRecords[stuId],
      className: attClass,
      section: attSection
    }));
    await attendanceService.submitAttendance(attDate, attClass, attSection, listToSave);
    showToast(`Saved attendance for ${listToSave.length} students in ${attClass}-${attSection}!`);
  };

  // Marks Entry Form State
  const [marksExam, setMarksExam] = useState('EX-HY-2026');
  const [marksClass, setMarksClass] = useState('Class 5');
  const [marksSection, setMarksSection] = useState('A');
  const [marksSubject, setMarksSubject] = useState('Mathematics');
  const [marksInput, setMarksInput] = useState<Record<string, number>>({});

  useEffect(() => {
    const classStudents = students.filter(
      (s: any) => s.className === marksClass && (marksSection === 'All' || s.section === marksSection)
    );
    const initialMarks: Record<string, number> = {};
    classStudents.forEach((s: any) => {
      initialMarks[s.id || s.admissionNo] = s.marks?.[marksSubject] || Math.floor(Math.random() * 30) + 70;
    });
    setMarksInput(initialMarks);
  }, [marksClass, marksSection, marksSubject, students]);

  const handleSaveMarks = async () => {
    const records = Object.keys(marksInput).map((stuId) => ({
      studentId: stuId,
      examId: marksExam,
      className: marksClass,
      section: marksSection,
      subject: marksSubject,
      obtainedMarks: Number(marksInput[stuId]) || 0,
      maxMarks: 100
    }));
    await marksService.saveMarksBatch(records);
    showToast(`Successfully saved ${marksSubject} marks for ${records.length} students!`);
  };

  // Add Student Form State
  const [newStuName, setNewStuName] = useState('');
  const [newStuAdmNo, setNewStuAdmNo] = useState('');
  const [newStuClass, setNewStuClass] = useState('Class 5');
  const [newStuSec, setNewStuSec] = useState('A');
  const [newStuFather, setNewStuFather] = useState('');
  const [newStuPhone, setNewStuPhone] = useState('');

  const handleCreateStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStuName || !newStuAdmNo) return;
    await studentService.addStudent({
      admissionNo: newStuAdmNo,
      rollNo: Math.floor(Math.random() * 30) + 1,
      name: newStuName,
      photo: 'https://images.unsplash.com/photo-1544717305-2782549b5136?w=150',
      className: newStuClass,
      section: newStuSec,
      fatherName: newStuFather || 'Guardian',
      motherName: 'Mother',
      phone: newStuPhone || '9876543210',
      address: 'Kajraili, Bhagalpur',
      bloodGroup: 'B+',
      gender: 'Male',
      status: 'Active'
    });
    setAddStudentOpen(false);
    setNewStuName('');
    setNewStuAdmNo('');
    showToast(`New student ${newStuName} registered successfully!`);
  };

  // Add Employee Form State
  const [newEmpName, setNewEmpName] = useState('');
  const [newEmpId, setNewEmpId] = useState('');
  const [newEmpDesig, setNewEmpDesig] = useState('Teacher');
  const [newEmpDept, setNewEmpDept] = useState('Academics');
  const [newEmpPhone, setNewEmpPhone] = useState('');

  const handleCreateEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmpName || !newEmpId) return;
    await employeeService.addEmployee({
      employeeId: newEmpId,
      name: newEmpName,
      designation: newEmpDesig,
      department: newEmpDept,
      phone: newEmpPhone || '9876543210',
      email: `${newEmpId.toLowerCase()}@avm.edu.in`,
      qualification: 'B.Ed, M.Sc',
      status: 'Active',
      photo: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150',
      joinDate: '2026-04-01',
      subject: 'Mathematics',
      assignedClasses: ['Class 5-A']
    });
    setAddEmployeeOpen(false);
    setNewEmpName('');
    setNewEmpId('');
    showToast(`Employee ${newEmpName} registered successfully!`);
  };

  // Create Notice State
  const [noticeTitle, setNoticeTitle] = useState('');
  const [noticeContent, setNoticeContent] = useState('');
  const [noticeTarget, setNoticeTarget] = useState<NoticeRecipients>('All');

  const handleCreateNotice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!noticeTitle || !noticeContent) return;
    await noticeService.sendNotice({
      title: noticeTitle,
      description: noticeContent,
      type: 'General',
      date: new Date().toISOString().split('T')[0],
      recipients: noticeTarget,
      status: 'Published'
    });
    setCreateNoticeOpen(false);
    setNoticeTitle('');
    setNoticeContent('');
    showToast(`Notice "${noticeTitle}" published to school noticeboard!`);
  };

  // Module categories for Dashboard Grid
  const moduleCategories = [
    {
      category: '👥 PEOPLE MANAGEMENT',
      items: [
        { id: 'students', title: 'Students Master', desc: `${students.length} Enrolled • Directory, profiles & fees`, icon: '👨‍🎓', bg: '#EFF6FF', color: '#1769E0' },
        { id: 'teachers', title: 'Employees & Staff', desc: `${employees.length} Active • Faculty, staff & salaries`, icon: '👨‍🏫', bg: '#F0FDFA', color: '#0D9488' }
      ]
    },
    {
      category: '🏫 ACADEMICS & TIMETABLE',
      items: [
        { id: 'classes', title: 'Classes & Sections', desc: '14 Classes • Nursery to Class 12', icon: '🏫', bg: '#F3E8FF', color: '#9333EA' },
        { id: 'subjects', title: 'Subjects Master', desc: 'Core, Language & Elective subjects', icon: '📚', bg: '#FEF3C7', color: '#D97706' },
        { id: 'class-subjects', title: 'Class Subjects', desc: 'Subject allocation & pass criteria', icon: '📖', bg: '#ECFDF5', color: '#059669' },
        { id: 'homework', title: 'Homework Manager', desc: 'Daily class homework & assignments', icon: '📘', bg: '#EEF2FF', color: '#4F46E5' },
        { id: 'timetable', title: 'Timetable Master', desc: 'Class schedules & teacher periods', icon: '🗓', bg: '#FFF7ED', color: '#EA580C' }
      ]
    },
    {
      category: '✅ ATTENDANCE & LEAVES',
      items: [
        { id: 'attendance', title: 'Student Attendance', desc: 'Class attendance & daily register', icon: '✅', bg: '#DCFCE7', color: '#16A34A' },
        { id: 'employee-attendance', title: 'Employee Attendance', desc: 'Check-in/out logs & duration', icon: '🕘', bg: '#E0F2FE', color: '#0284C7' },
        { id: 'employee-leave', title: 'Staff Leave Requests', desc: 'Leave approvals & photo attachments', icon: '🌴', bg: '#FEF2F2', color: '#DC2626' }
      ]
    },
    {
      category: '📝 EXAMINATION & MARKS',
      items: [
        { id: 'exams', title: 'Exams & Schedules', desc: 'Half Yearly, Unit Tests & Annual Exams', icon: '📝', bg: '#F5F3FF', color: '#7C3AED' },
        { id: 'marks', title: 'Marks Entry Console', desc: 'Subject marks entry & history', icon: '🏆', bg: '#FEF9C3', color: '#CA8A04' },
        { id: 'results', title: 'Results & Report Cards', desc: 'Percentage, grade & Report Cards', icon: '📊', bg: '#E0E7FF', color: '#4338CA' },
        { id: 'admitcards', title: 'Admit Cards Generator', desc: 'Generate & print digital admit cards', icon: '🎫', bg: '#FCE7F3', color: '#DB2777' }
      ]
    },
    {
      category: '💰 FINANCE & FEES',
      items: [
        { id: 'fees', title: 'Fee Management', desc: 'Collection, due ledgers & receipts', icon: '💰', bg: '#ECFDF5', color: '#047857' }
      ]
    },
    {
      category: '📢 COMMUNICATION',
      items: [
        { id: 'notices', title: 'Notice Board', desc: 'Announcements, holidays & PTM', icon: '📢', bg: '#FEE2E2', color: '#B91C1C' },
        { id: 'notifications', title: 'Notifications Center', desc: 'System alerts & push notifications', icon: '🔔', bg: '#EFF6FF', color: '#2563EB' }
      ]
    },
    {
      category: '📄 REPORTS & CERTIFICATES',
      items: [
        { id: 'reports', title: 'Central Reports & Print', desc: 'Registers, Exam & Fee Reports, Excel export', icon: '📄', bg: '#F1F5F9', color: '#334155' },
        { id: 'certificates', title: 'Certificates Engine', desc: 'Transfer, Character & Service Certificates', icon: '📜', bg: '#FFF1F2', color: '#E11D48' },
        { id: 'transport', title: 'Transport Management', desc: 'Bus routes, vehicles & allocations', icon: '🚌', bg: '#F0FDFA', color: '#0F766E' }
      ]
    },
    {
      category: '⚙ SYSTEM & CONFIGURATION',
      items: [
        { id: 'settings', title: 'System Settings', desc: 'School profile, session, roles & backup', icon: '⚙', bg: '#F3F4F6', color: '#4B5563' }
      ]
    }
  ];

  const isHomeOrDashboard = activeTab === 'home' || activeTab === 'dashboard' || activeTab === 'modules';

  return (
    <div style={{ backgroundColor: '#F8FAFC', minHeight: '100vh', paddingBottom: 40 }}>
      {/* STICKY TOP APP HEADER */}
      <div style={{
        position: 'sticky',
        top: 0,
        zIndex: 900,
        backgroundColor: '#4338CA',
        backgroundImage: 'linear-gradient(135deg, #3730A3 0%, #4F46E5 50%, #4338CA 100%)',
        color: '#FFFFFF',
        boxShadow: '0 4px 16px rgba(55, 48, 163, 0.25)',
        padding: '12px 16px 10px 16px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            {!isHomeOrDashboard ? (
              <button
                onClick={() => handleSelectTab('home')}
                style={{
                  background: 'rgba(255,255,255,0.2)',
                  border: 'none',
                  borderRadius: 12,
                  width: 36,
                  height: 36,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#FFFFFF',
                  cursor: 'pointer'
                }}
              >
                <ArrowLeft size={20} />
              </button>
            ) : (
              <button
                onClick={onOpenDrawer}
                style={{
                  background: 'rgba(255,255,255,0.2)',
                  border: 'none',
                  borderRadius: 12,
                  width: 36,
                  height: 36,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#FFFFFF',
                  cursor: 'pointer'
                }}
              >
                <Menu size={20} />
              </button>
            )}

            <div>
              <h1 style={{ fontSize: 16, fontWeight: 800, margin: 0, color: '#FFFFFF', letterSpacing: '-0.3px' }}>
                {isHomeOrDashboard ? 'AVM Admin Console' : activeTab.toUpperCase().replace('-', ' ')}
              </h1>
              <p style={{ fontSize: 11, margin: 0, color: '#E0E7FF', fontWeight: 600 }}>
                Adarsh Vidya Mandir • Administrator
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{
              backgroundColor: '#EEF2FF',
              color: '#3730A3',
              fontSize: 10,
              fontWeight: 800,
              padding: '4px 10px',
              borderRadius: 20
            }}>
              2026–27 ACTIVE
            </span>
          </div>
        </div>
      </div>

      {/* TOAST NOTIFICATION */}
      {toastMsg && (
        <div style={{
          position: 'fixed',
          top: 70,
          left: 16,
          right: 16,
          backgroundColor: '#0F172A',
          color: '#FFFFFF',
          padding: '12px 16px',
          borderRadius: 14,
          boxShadow: '0 10px 25px rgba(0,0,0,0.3)',
          zIndex: 1100,
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          fontSize: 13,
          fontWeight: 600
        }}>
          <CheckCircle size={18} color="#10B981" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* MAIN CONTENT AREA */}
      <div style={{ padding: '16px' }}>

        {/* ============================================================ */}
        {/* ADMIN DASHBOARD HOME (MAIN REQUIREMENT) */}
        {/* ============================================================ */}
        {isHomeOrDashboard && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

            {/* WELCOME BANNER & STATS GRID */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                <div>
                  <h2 style={{ fontSize: 20, fontWeight: 800, color: '#0F172A', margin: 0 }}>
                    Welcome, Administrator 🛡️
                  </h2>
                  <p style={{ fontSize: 12, color: '#64748B', margin: '2px 0 0 0' }}>
                    School ERP Master Control Panel
                  </p>
                </div>
              </div>

              {/* QUICK STATISTICS GRID */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12 }}>
                <div style={{ backgroundColor: '#FFFFFF', padding: 14, borderRadius: 16, border: '1.5px solid #E2E8F0', boxShadow: '0 2px 8px rgba(0,0,0,0.03)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#1769E0', marginBottom: 4 }}>
                    <GraduationCap size={18} />
                    <span style={{ fontSize: 11, fontWeight: 700, color: '#64748B' }}>Total Students</span>
                  </div>
                  <div style={{ fontSize: 22, fontWeight: 800, color: '#0F172A' }}>{students.length}</div>
                  <div style={{ fontSize: 10, color: '#10B981', fontWeight: 700, marginTop: 2 }}>Class Nursery - 12</div>
                </div>

                <div style={{ backgroundColor: '#FFFFFF', padding: 14, borderRadius: 16, border: '1.5px solid #E2E8F0', boxShadow: '0 2px 8px rgba(0,0,0,0.03)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#0D9488', marginBottom: 4 }}>
                    <Users size={18} />
                    <span style={{ fontSize: 11, fontWeight: 700, color: '#64748B' }}>Faculty & Staff</span>
                  </div>
                  <div style={{ fontSize: 22, fontWeight: 800, color: '#0F172A' }}>{employees.length}</div>
                  <div style={{ fontSize: 10, color: '#0D9488', fontWeight: 700, marginTop: 2 }}>Active Teachers</div>
                </div>

                <div style={{ backgroundColor: '#FFFFFF', padding: 14, borderRadius: 16, border: '1.5px solid #E2E8F0', boxShadow: '0 2px 8px rgba(0,0,0,0.03)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#9333EA', marginBottom: 4 }}>
                    <School size={18} />
                    <span style={{ fontSize: 11, fontWeight: 700, color: '#64748B' }}>Classes & Sec</span>
                  </div>
                  <div style={{ fontSize: 22, fontWeight: 800, color: '#0F172A' }}>{classes.length || 14}</div>
                  <div style={{ fontSize: 10, color: '#9333EA', fontWeight: 700, marginTop: 2 }}>42 Sections Total</div>
                </div>

                <div style={{ backgroundColor: '#FFFFFF', padding: 14, borderRadius: 16, border: '1.5px solid #E2E8F0', boxShadow: '0 2px 8px rgba(0,0,0,0.03)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#F59E0B', marginBottom: 4 }}>
                    <CreditCard size={18} />
                    <span style={{ fontSize: 11, fontWeight: 700, color: '#64748B' }}>Pending Fees</span>
                  </div>
                  <div style={{ fontSize: 20, fontWeight: 800, color: '#D97706' }}>₹4.50 Lakh</div>
                  <div style={{ fontSize: 10, color: '#F59E0B', fontWeight: 700, marginTop: 2 }}>Session Due</div>
                </div>
              </div>
            </div>

            {/* CATEGORIZED MODULE CARDS SECTION */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
              {moduleCategories.map((cat, idx) => (
                <div key={idx}>
                  <div style={{
                    fontSize: 11,
                    fontWeight: 800,
                    color: '#475569',
                    letterSpacing: '0.8px',
                    marginBottom: 10,
                    paddingLeft: 4
                  }}>
                    {cat.category}
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10 }}>
                    {cat.items.map((item) => (
                      <div
                        key={item.id}
                        onClick={() => handleSelectTab(item.id)}
                        style={{
                          backgroundColor: '#FFFFFF',
                          borderRadius: 16,
                          padding: 14,
                          border: '1.5px solid #E2E8F0',
                          cursor: 'pointer',
                          boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
                          display: 'flex',
                          flexDirection: 'column',
                          justifyContent: 'space-between',
                          transition: 'transform 0.15s ease'
                        }}
                      >
                        <div>
                          <div style={{
                            width: 40,
                            height: 40,
                            borderRadius: 12,
                            backgroundColor: item.bg,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: 20,
                            marginBottom: 10
                          }}>
                            {item.icon}
                          </div>
                          <div style={{ fontSize: 14, fontWeight: 800, color: '#0F172A', lineHeight: 1.2 }}>
                            {item.title}
                          </div>
                          <div style={{ fontSize: 11, color: '#64748B', marginTop: 4, lineHeight: 1.3 }}>
                            {item.desc}
                          </div>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', marginTop: 10, color: item.color }}>
                          <ChevronRight size={16} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ============================================================ */}
        {/* INDIVIDUAL ADMIN MODULE SCREENS */}
        {/* ============================================================ */}

        {/* 1. STUDENTS */}
        {activeTab === 'students' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
              <div style={{ flex: 1, position: 'relative' }}>
                <Search size={18} style={{ position: 'absolute', left: 12, top: 12, color: '#94A3B8' }} />
                <input
                  type="text"
                  placeholder="Search by student name or roll no..."
                  className="avm-input"
                  style={{ paddingLeft: 38, borderRadius: 12, fontSize: 13 }}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <button
                onClick={() => setAddStudentOpen(true)}
                style={{
                  backgroundColor: '#4F46E5',
                  color: '#FFFFFF',
                  border: 'none',
                  borderRadius: 12,
                  padding: '10px 14px',
                  fontWeight: 700,
                  fontSize: 13,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  cursor: 'pointer'
                }}
              >
                <Plus size={16} /> Add
              </button>
            </div>

            <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 4 }}>
              {['All', 'Class 5', 'Class 6', 'Class 7', 'Class 8', 'Class 9', 'Class 10'].map((c) => (
                <button
                  key={c}
                  onClick={() => setSelectedClassFilter(c)}
                  style={{
                    padding: '5px 12px',
                    borderRadius: 16,
                    fontSize: 12,
                    fontWeight: 700,
                    border: selectedClassFilter === c ? 'none' : '1px solid #CBD5E1',
                    backgroundColor: selectedClassFilter === c ? '#4F46E5' : '#FFFFFF',
                    color: selectedClassFilter === c ? '#FFFFFF' : '#475569',
                    cursor: 'pointer'
                  }}
                >
                  {c}
                </button>
              ))}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {students
                .filter((s: any) => selectedClassFilter === 'All' || s.className === selectedClassFilter)
                .filter((s: any) => !searchQuery || s.name.toLowerCase().includes(searchQuery.toLowerCase()) || s.admissionNo.toLowerCase().includes(searchQuery.toLowerCase()))
                .map((stu: Student) => (
                  <div
                    key={stu.id || stu.admissionNo}
                    style={{
                      backgroundColor: '#FFFFFF',
                      borderRadius: 16,
                      padding: 14,
                      border: '1.5px solid #E2E8F0',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <img
                        src={stu.photo || 'https://images.unsplash.com/photo-1544717305-2782549b5136?w=150'}
                        alt={stu.name}
                        style={{ width: 44, height: 44, borderRadius: '50%', objectFit: 'cover', border: '2px solid #1769E0' }}
                      />
                      <div>
                        <div style={{ fontSize: 14, fontWeight: 800, color: '#0F172A' }}>{stu.name}</div>
                        <div style={{ fontSize: 12, fontWeight: 700, color: '#1769E0' }}>
                          {stu.className} - {stu.section} • Roll #{stu.rollNo}
                        </div>
                        <div style={{ fontSize: 11, color: '#64748B' }}>Adm: {stu.admissionNo} • Ph: {stu.phone}</div>
                      </div>
                    </div>
                    <button
                      onClick={() => setSelectedStudentForModal(stu)}
                      style={{
                        backgroundColor: '#EEF2FF',
                        color: '#4F46E5',
                        border: 'none',
                        borderRadius: 10,
                        padding: '8px 12px',
                        fontSize: 12,
                        fontWeight: 700,
                        cursor: 'pointer'
                      }}
                    >
                      View Profile
                    </button>
                  </div>
                ))}
            </div>
          </div>
        )}

        {/* 2. EMPLOYEES / TEACHERS */}
        {activeTab === 'teachers' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
              <div style={{ flex: 1, position: 'relative' }}>
                <Search size={18} style={{ position: 'absolute', left: 12, top: 12, color: '#94A3B8' }} />
                <input
                  type="text"
                  placeholder="Search staff by name or ID..."
                  className="avm-input"
                  style={{ paddingLeft: 38, borderRadius: 12, fontSize: 13 }}
                />
              </div>
              <button
                onClick={() => setAddEmployeeOpen(true)}
                style={{
                  backgroundColor: '#0D9488',
                  color: '#FFFFFF',
                  border: 'none',
                  borderRadius: 12,
                  padding: '10px 14px',
                  fontWeight: 700,
                  fontSize: 13,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  cursor: 'pointer'
                }}
              >
                <Plus size={16} /> Add Staff
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {employees.map((emp: Employee) => (
                <div
                  key={emp.id || emp.employeeId}
                  style={{
                    backgroundColor: '#FFFFFF',
                    borderRadius: 16,
                    padding: 14,
                    border: '1.5px solid #E2E8F0',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <img
                      src={emp.photo || 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150'}
                      alt={emp.name}
                      style={{ width: 44, height: 44, borderRadius: '50%', objectFit: 'cover', border: '2px solid #0D9488' }}
                    />
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 800, color: '#0F172A' }}>{emp.name}</div>
                      <div style={{ fontSize: 12, fontWeight: 700, color: '#0D9488' }}>
                        {emp.designation || 'Teacher'} • {emp.department || 'Academics'}
                      </div>
                      <div style={{ fontSize: 11, color: '#64748B' }}>ID: {emp.employeeId} • {emp.phone}</div>
                    </div>
                  </div>
                  <span style={{
                    backgroundColor: emp.status === 'Active' ? '#DCFCE7' : '#FEF3C7',
                    color: emp.status === 'Active' ? '#15803D' : '#D97706',
                    fontSize: 10,
                    fontWeight: 800,
                    padding: '4px 8px',
                    borderRadius: 12
                  }}>
                    {emp.status || 'Active'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 3. CLASSES & SECTIONS */}
        {activeTab === 'classes' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <h3 style={{ fontSize: 15, fontWeight: 800, color: '#0F172A', margin: 0 }}>School Classes Master</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              {['Class 5', 'Class 6', 'Class 7', 'Class 8', 'Class 9', 'Class 10', 'Class 11', 'Class 12'].map((cName) => (
                <div key={cName} style={{ backgroundColor: '#FFFFFF', padding: 14, borderRadius: 16, border: '1.5px solid #E2E8F0' }}>
                  <div style={{ fontSize: 15, fontWeight: 800, color: '#4F46E5' }}>{cName}</div>
                  <div style={{ fontSize: 12, color: '#64748B', marginTop: 2 }}>Sections: A, B, C</div>
                  <div style={{ fontSize: 11, color: '#10B981', fontWeight: 700, marginTop: 4 }}>42 Students • Class Teacher Assigned</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 4. SUBJECTS MASTER */}
        {activeTab === 'subjects' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <h3 style={{ fontSize: 15, fontWeight: 800, color: '#0F172A', margin: 0 }}>Academic Subjects Master</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {[
                { name: 'Mathematics', code: 'MATH-101', type: 'Core', max: 100, pass: 33 },
                { name: 'Science', code: 'SCI-102', type: 'Core', max: 100, pass: 33 },
                { name: 'Hindi', code: 'HIN-103', type: 'Language', max: 100, pass: 33 },
                { name: 'English', code: 'ENG-104', type: 'Language', max: 100, pass: 33 },
                { name: 'Social Studies', code: 'SST-105', type: 'Core', max: 100, pass: 33 },
                { name: 'Sanskrit', code: 'SAN-106', type: 'Elective', max: 100, pass: 33 }
              ].map((sub) => (
                <div key={sub.code} style={{ backgroundColor: '#FFFFFF', padding: 12, borderRadius: 14, border: '1px solid #E2E8F0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 800, color: '#0F172A' }}>{sub.name}</div>
                    <div style={{ fontSize: 11, color: '#64748B' }}>Code: {sub.code} • Max: {sub.max} | Pass: {sub.pass}</div>
                  </div>
                  <span style={{ backgroundColor: '#EEF2FF', color: '#4F46E5', fontSize: 11, fontWeight: 700, padding: '4px 8px', borderRadius: 10 }}>
                    {sub.type}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 5. CLASS SUBJECTS */}
        {activeTab === 'class-subjects' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <h3 style={{ fontSize: 15, fontWeight: 800, color: '#0F172A', margin: 0 }}>Class-Subject Mapping</h3>
            <div style={{ backgroundColor: '#FFFFFF', padding: 14, borderRadius: 16, border: '1.5px solid #E2E8F0' }}>
              <div style={{ fontSize: 14, fontWeight: 800, color: '#1769E0', marginBottom: 8 }}>Class 5 - Section A</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {['Mathematics', 'Science', 'Hindi', 'English', 'Social Studies', 'Computer'].map((s) => (
                  <span key={s} style={{ backgroundColor: '#F1F5F9', color: '#334155', fontSize: 12, fontWeight: 700, padding: '6px 10px', borderRadius: 12 }}>
                    📖 {s}
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* 6. STUDENT ATTENDANCE */}
        {activeTab === 'attendance' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ backgroundColor: '#FFFFFF', padding: 14, borderRadius: 16, border: '1.5px solid #E2E8F0' }}>
              <h3 style={{ fontSize: 14, fontWeight: 800, color: '#0F172A', margin: '0 0 10px 0' }}>Mark Student Attendance</h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 12 }}>
                <div>
                  <label style={{ fontSize: 11, fontWeight: 700, color: '#64748B' }}>Date</label>
                  <input type="date" value={attDate} onChange={(e) => setAttDate(e.target.value)} className="avm-input" style={{ fontSize: 12, padding: 8 }} />
                </div>
                <div>
                  <label style={{ fontSize: 11, fontWeight: 700, color: '#64748B' }}>Class</label>
                  <select value={attClass} onChange={(e) => setAttClass(e.target.value)} className="avm-input" style={{ fontSize: 12, padding: 8 }}>
                    {['Class 5', 'Class 6', 'Class 7', 'Class 8', 'Class 9', 'Class 10'].map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
              </div>

              <button
                onClick={handleSaveStudentAttendance}
                style={{
                  width: '100%',
                  backgroundColor: '#10B981',
                  color: '#FFFFFF',
                  border: 'none',
                  borderRadius: 12,
                  padding: 10,
                  fontSize: 13,
                  fontWeight: 800,
                  cursor: 'pointer'
                }}
              >
                💾 Save Attendance
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {students
                .filter((s: any) => s.className === attClass)
                .map((stu: Student) => {
                  const sId = stu.id || stu.admissionNo;
                  const currentStatus = attRecords[sId] || 'present';
                  return (
                    <div key={sId} style={{ backgroundColor: '#FFFFFF', padding: 12, borderRadius: 14, border: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 800, color: '#0F172A' }}>{stu.name}</div>
                        <div style={{ fontSize: 11, color: '#64748B' }}>Roll #{stu.rollNo}</div>
                      </div>
                      <div style={{ display: 'flex', gap: 4 }}>
                        {(['present', 'absent', 'leave'] as const).map((st) => (
                          <button
                            key={st}
                            onClick={() => setAttRecords((prev) => ({ ...prev, [sId]: st }))}
                            style={{
                              border: 'none',
                              borderRadius: 8,
                              padding: '6px 8px',
                              fontSize: 11,
                              fontWeight: 800,
                              cursor: 'pointer',
                              backgroundColor: currentStatus === st
                                ? (st === 'present' ? '#10B981' : st === 'absent' ? '#EF4444' : '#6366F1')
                                : '#F1F5F9',
                              color: currentStatus === st ? '#FFFFFF' : '#64748B'
                            }}
                          >
                            {st[0].toUpperCase()}
                          </button>
                        ))}
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>
        )}

        {/* 7. EMPLOYEE ATTENDANCE */}
        {activeTab === 'employee-attendance' && (
          <AdminEmployeeAttendanceModule />
        )}

        {/* 8. EMPLOYEE LEAVE */}
        {activeTab === 'employee-leave' && (
          <AdminEmployeeLeaveModule />
        )}

        {/* 9. HOMEWORK */}
        {activeTab === 'homework' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <h3 style={{ fontSize: 15, fontWeight: 800, color: '#0F172A', margin: 0 }}>Homework Assignments</h3>
              <button
                onClick={() => setCreateHomeworkOpen(true)}
                style={{ backgroundColor: '#4F46E5', color: '#FFFFFF', border: 'none', borderRadius: 10, padding: '8px 12px', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}
              >
                + Create
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {homeworkList.map((hw: any) => (
                <div key={hw.id} style={{ backgroundColor: '#FFFFFF', padding: 14, borderRadius: 16, border: '1.5px solid #E2E8F0' }}>
                  <div style={{ fontSize: 14, fontWeight: 800, color: '#0F172A' }}>{hw.title}</div>
                  <div style={{ fontSize: 12, color: '#4F46E5', fontWeight: 700, marginTop: 2 }}>
                    {hw.subject} • {hw.className || 'Class 5'}
                  </div>
                  <div style={{ fontSize: 11, color: '#64748B', marginTop: 4 }}>Due Date: {hw.dueDate}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 10. EXAMS */}
        {activeTab === 'exams' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <h3 style={{ fontSize: 15, fontWeight: 800, color: '#0F172A', margin: 0 }}>Examinations & Schedules</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {[
                { name: 'Half Yearly Examination 2026', academicYear: '2026-2027', dates: '10 Oct - 20 Oct 2026', status: 'Scheduled' },
                { name: 'Unit Test 1', academicYear: '2026-2027', dates: '15 Aug - 20 Aug 2026', status: 'Completed' },
                { name: 'Annual Examination 2027', academicYear: '2026-2027', dates: '01 Mar - 15 Mar 2027', status: 'Upcoming' }
              ].map((ex, idx) => (
                <div key={idx} style={{ backgroundColor: '#FFFFFF', padding: 14, borderRadius: 16, border: '1.5px solid #E2E8F0' }}>
                  <div style={{ fontSize: 14, fontWeight: 800, color: '#0F172A' }}>{ex.name}</div>
                  <div style={{ fontSize: 12, color: '#64748B', marginTop: 2 }}>Session: {ex.academicYear} • Dates: {ex.dates}</div>
                  <span style={{ backgroundColor: ex.status === 'Scheduled' ? '#DCFCE7' : '#F1F5F9', color: ex.status === 'Scheduled' ? '#15803D' : '#475569', fontSize: 11, fontWeight: 800, padding: '3px 8px', borderRadius: 10, display: 'inline-block', marginTop: 6 }}>
                    {ex.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 11. MARKS ENTRY */}
        {activeTab === 'marks' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ backgroundColor: '#FFFFFF', padding: 14, borderRadius: 16, border: '1.5px solid #E2E8F0' }}>
              <h3 style={{ fontSize: 14, fontWeight: 800, color: '#0F172A', margin: '0 0 10px 0' }}>Marks Entry Console</h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 10 }}>
                <div>
                  <label style={{ fontSize: 11, fontWeight: 700, color: '#64748B' }}>Class</label>
                  <select value={marksClass} onChange={(e) => setMarksClass(e.target.value)} className="avm-input" style={{ fontSize: 12, padding: 6 }}>
                    {['Class 5', 'Class 6', 'Class 7', 'Class 8'].map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: 11, fontWeight: 700, color: '#64748B' }}>Subject</label>
                  <select value={marksSubject} onChange={(e) => setMarksSubject(e.target.value)} className="avm-input" style={{ fontSize: 12, padding: 6 }}>
                    {['Mathematics', 'Science', 'Hindi', 'English'].map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              </div>

              <button
                onClick={handleSaveMarks}
                style={{ width: '100%', backgroundColor: '#D97706', color: '#FFFFFF', border: 'none', borderRadius: 10, padding: 10, fontWeight: 800, fontSize: 13, cursor: 'pointer' }}
              >
                💾 Save Marks
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {students
                .filter((s: any) => s.className === marksClass)
                .map((stu: Student) => {
                  const sId = stu.id || stu.admissionNo;
                  return (
                    <div key={sId} style={{ backgroundColor: '#FFFFFF', padding: 12, borderRadius: 14, border: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 800, color: '#0F172A' }}>{stu.name}</div>
                        <div style={{ fontSize: 11, color: '#64748B' }}>Roll #{stu.rollNo}</div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <input
                          type="number"
                          className="avm-input"
                          style={{ width: 60, textAlign: 'center', fontWeight: 800, fontSize: 14, padding: 6 }}
                          value={marksInput[sId] ?? 85}
                          onChange={(e) => setMarksInput((prev) => ({ ...prev, [sId]: Number(e.target.value) }))}
                          max={100}
                        />
                        <span style={{ fontSize: 12, color: '#94A3B8', fontWeight: 700 }}>/ 100</span>
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>
        )}

        {/* 12. RESULTS & REPORT CARDS */}
        {activeTab === 'results' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <h3 style={{ fontSize: 15, fontWeight: 800, color: '#0F172A', margin: 0 }}>Student Results & Report Cards</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {students.slice(0, 5).map((stu: Student) => (
                <div key={stu.id || stu.admissionNo} style={{ backgroundColor: '#FFFFFF', padding: 14, borderRadius: 16, border: '1.5px solid #E2E8F0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 800, color: '#0F172A' }}>{stu.name}</div>
                    <div style={{ fontSize: 12, color: '#1769E0', fontWeight: 700 }}>{stu.className} • Roll #{stu.rollNo}</div>
                    <div style={{ fontSize: 11, color: '#10B981', fontWeight: 700, marginTop: 2 }}>Percentage: 86.4% • Grade: A1</div>
                  </div>
                  <button
                    onClick={() => setSelectedStudentForReportCard(stu)}
                    style={{ backgroundColor: '#EEF2FF', color: '#4F46E5', border: 'none', borderRadius: 10, padding: '8px 12px', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}
                  >
                    Report Card
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 13. ADMIT CARDS */}
        {activeTab === 'admitcards' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ backgroundColor: '#FFFFFF', padding: 16, borderRadius: 16, border: '1.5px solid #E2E8F0' }}>
              <h3 style={{ fontSize: 15, fontWeight: 800, color: '#0F172A', margin: '0 0 8px 0' }}>Admit Cards Generator</h3>
              <p style={{ fontSize: 12, color: '#64748B', margin: '0 0 12px 0' }}>Select examination to preview and issue digital admit cards.</p>
              <button
                onClick={() => setSelectedAdmitCardExam({ id: 'EX-HY-2026', name: 'Half Yearly Examination 2026', academicYear: '2026-2027', startDate: '2026-10-10', endDate: '2026-10-20', status: 'Scheduled' })}
                style={{ backgroundColor: '#9333EA', color: '#FFFFFF', border: 'none', borderRadius: 12, padding: '10px 16px', fontSize: 13, fontWeight: 800, cursor: 'pointer', width: '100%' }}
              >
                🎫 Generate Half Yearly Admit Cards
              </button>
            </div>
          </div>
        )}

        {/* 14. FEE MANAGER */}
        {activeTab === 'fees' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ backgroundColor: '#FFFFFF', padding: 16, borderRadius: 16, border: '1.5px solid #E2E8F0' }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#64748B' }}>Total Session Collection</div>
              <div style={{ fontSize: 24, fontWeight: 800, color: '#10B981', marginTop: 2 }}>₹14,85,000</div>
              <div style={{ fontSize: 11, color: '#F59E0B', fontWeight: 700, marginTop: 4 }}>Pending Due: ₹4,50,000</div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {students.slice(0, 5).map((stu: Student) => (
                <div key={stu.id || stu.admissionNo} style={{ backgroundColor: '#FFFFFF', padding: 12, borderRadius: 14, border: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 800, color: '#0F172A' }}>{stu.name}</div>
                    <div style={{ fontSize: 11, color: '#64748B' }}>Adm: {stu.admissionNo} • {stu.className}</div>
                    <div style={{ fontSize: 11, color: '#10B981', fontWeight: 700 }}>Paid: ₹12,000 | Pending: ₹0</div>
                  </div>
                  <button
                    onClick={() => setSelectedReceipt({ studentName: stu.name, admissionNo: stu.admissionNo, className: stu.className, amount: 12000, date: '05 Oct 2026', receiptNo: 'RCP-2026-089' })}
                    style={{ backgroundColor: '#F0FDF4', color: '#166534', border: 'none', borderRadius: 8, padding: '6px 10px', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}
                  >
                    Receipt
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 15. NOTICES */}
        {activeTab === 'notices' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <h3 style={{ fontSize: 15, fontWeight: 800, color: '#0F172A', margin: 0 }}>School Notice Board</h3>
              <button
                onClick={() => setCreateNoticeOpen(true)}
                style={{ backgroundColor: '#EF4444', color: '#FFFFFF', border: 'none', borderRadius: 10, padding: '8px 12px', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}
              >
                + New Notice
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {notices.map((n: Notice) => (
                <div key={n.id} style={{ backgroundColor: '#FFFFFF', padding: 14, borderRadius: 16, border: '1.5px solid #E2E8F0' }}>
                  <div style={{ fontSize: 14, fontWeight: 800, color: '#0F172A' }}>{n.title}</div>
                  <div style={{ fontSize: 12, color: '#64748B', marginTop: 4, lineHeight: 1.4 }}>{n.description || n.body}</div>
                  <div style={{ fontSize: 11, color: '#94A3B8', marginTop: 8, display: 'flex', justifyContent: 'space-between' }}>
                    <span>📅 {n.date || 'Today'}</span>
                    <span>By: {n.recipients || 'All'}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 16. NOTIFICATIONS CENTER */}
        {activeTab === 'notifications' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <h3 style={{ fontSize: 15, fontWeight: 800, color: '#0F172A', margin: 0 }}>System Notifications Log</h3>
            <div style={{ backgroundColor: '#FFFFFF', padding: 14, borderRadius: 16, border: '1.5px solid #E2E8F0' }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#0F172A' }}>Fee Due Alert Broadcast</div>
              <div style={{ fontSize: 12, color: '#64748B', marginTop: 2 }}>Automated SMS & Push alerts sent to 45 parents.</div>
            </div>
          </div>
        )}

        {/* 17. TIMETABLE MODULE */}
        {activeTab === 'timetable' && (
          <TimetableModule />
        )}

        {/* 18. REPORTS & PRINT CENTER */}
        {activeTab === 'reports' && (
          <CentralReportsModule
            onNavigateTab={(tab: any) => handleSelectTab(tab)}
            students={students}
            employees={employees}
            academicYear="2026-2027"
          />
        )}

        {/* 19. CERTIFICATES MODULE */}
        {activeTab === 'certificates' && (
          <CertificatesModule />
        )}

        {/* 20. TRANSPORT MODULE */}
        {activeTab === 'transport' && (
          <TransportModule students={students} />
        )}

        {/* 21. SETTINGS MODULE */}
        {activeTab === 'settings' && (
          <AdminSettingsModule />
        )}

        {/* 22. ADMIN PROFILE */}
        {activeTab === 'profile' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ backgroundColor: '#FFFFFF', padding: 20, borderRadius: 20, border: '1.5px solid #E2E8F0', display: 'flex', alignItems: 'center', gap: 14 }}>
              <img
                src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150"
                alt="Admin Profile"
                style={{ width: 64, height: 64, borderRadius: '50%', border: '3px solid #6366F1' }}
              />
              <div>
                <h3 style={{ fontSize: 17, fontWeight: 800, color: '#0F172A', margin: 0 }}>Principal / Admin</h3>
                <p style={{ fontSize: 12, fontWeight: 700, color: '#6366F1', margin: '2px 0 0 0' }}>School Administrator</p>
                <p style={{ fontSize: 11, color: '#64748B', margin: '2px 0 0 0' }}>ID: admin • Adarsh Vidya Mandir</p>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {onSwitchAccount && (
                <button
                  onClick={() => onSwitchAccount('admin-admin')}
                  className="avm-btn-secondary"
                  style={{ width: '100%', padding: '12px', borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, color: '#1769E0', fontWeight: 700 }}
                >
                  <Users size={18} /> Switch Account
                </button>
              )}
              {onAddAccount && (
                <button
                  onClick={onAddAccount}
                  className="avm-btn-secondary"
                  style={{ width: '100%', padding: '12px', borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, color: '#475569', fontWeight: 700 }}
                >
                  <UserPlus size={18} /> Add Account
                </button>
              )}
              <button
                onClick={onLogout}
                style={{
                  width: '100%',
                  padding: '12px',
                  borderRadius: 14,
                  backgroundColor: '#FEF2F2',
                  color: '#DC2626',
                  border: '1px solid #FCA5A5',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                  fontWeight: 800,
                  cursor: 'pointer'
                }}
              >
                <LogOut size={18} /> Logout Admin Account
              </button>
            </div>
          </div>
        )}
      </div>

      {/* MODALS */}

      {/* STUDENT FULL DATA MODAL */}
      {selectedStudentForModal && (
        <StudentFullDataModal
          isOpen={true}
          onClose={() => setSelectedStudentForModal(null)}
          students={[selectedStudentForModal]}
          academicSession="2026-2027"
        />
      )}

      {/* REPORT CARD MODAL */}
      {selectedStudentForReportCard && (
        <ReportCardModal
          isOpen={true}
          onClose={() => setSelectedStudentForReportCard(null)}
          student={selectedStudentForReportCard}
          result={{
            id: `RES-${selectedStudentForReportCard.id || selectedStudentForReportCard.admissionNo}`,
            studentId: selectedStudentForReportCard.id || selectedStudentForReportCard.admissionNo,
            examId: 'EX-HY-2026',
            examName: 'Half Yearly Examination 2026',
            className: selectedStudentForReportCard.className || 'Class 5',
            section: selectedStudentForReportCard.section || 'A',
            isEarlyYears: false,
            marks: [
              { subject: 'Hindi', marksObtained: 78, maxMarks: 100, grade: 'B1' },
              { subject: 'English', marksObtained: 84, maxMarks: 100, grade: 'A2' },
              { subject: 'Mathematics', marksObtained: 82, maxMarks: 100, grade: 'A2' },
              { subject: 'Science', marksObtained: 90, maxMarks: 100, grade: 'A1' },
              { subject: 'Social Studies', marksObtained: 75, maxMarks: 100, grade: 'B1' }
            ],
            totalObtained: 409,
            totalMax: 500,
            percentage: 81.8,
            grade: 'A2',
            teacherRemarks: 'Excellent academic progress.',
            issueDate: '2026-10-05'
          }}
        />
      )}

      {/* ADMIT CARD MODAL */}
      {selectedAdmitCardExam && students.length > 0 && (
        <AdmitCardModal
          isOpen={true}
          onClose={() => setSelectedAdmitCardExam(null)}
          student={students[0]}
          examName={selectedAdmitCardExam.name}
        />
      )}

      {/* RECEIPT MODAL */}
      {selectedReceipt && students.length > 0 && (
        <ReceiptModal
          isOpen={true}
          onClose={() => setSelectedReceipt(null)}
          student={students[0]}
          payment={{
            receiptNo: selectedReceipt.receiptNo,
            amount: selectedReceipt.amount,
            date: selectedReceipt.date,
            paymentMode: 'Cash',
            status: 'Paid',
            description: 'Tuition Fee'
          }}
        />
      )}

      {/* ADD STUDENT MODAL */}
      {addStudentOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(15,23,42,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, zIndex: 1000 }}>
          <div style={{ backgroundColor: '#FFFFFF', borderRadius: 20, padding: 20, width: '100%', maxWidth: 400 }}>
            <h3 style={{ fontSize: 17, fontWeight: 800, margin: '0 0 14px 0' }}>Add New Student</h3>
            <form onSubmit={handleCreateStudent} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <input type="text" placeholder="Student Full Name" value={newStuName} onChange={(e) => setNewStuName(e.target.value)} className="avm-input" required />
              <input type="text" placeholder="Admission Number (e.g. AVM2026101)" value={newStuAdmNo} onChange={(e) => setNewStuAdmNo(e.target.value)} className="avm-input" required />
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                <select value={newStuClass} onChange={(e) => setNewStuClass(e.target.value)} className="avm-input">
                  {['Class 5', 'Class 6', 'Class 7', 'Class 8', 'Class 9', 'Class 10'].map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
                <select value={newStuSec} onChange={(e) => setNewStuSec(e.target.value)} className="avm-input">
                  {['A', 'B', 'C'].map((s) => <option key={s} value={s}>Section {s}</option>)}
                </select>
              </div>
              <input type="text" placeholder="Father Name" value={newStuFather} onChange={(e) => setNewStuFather(e.target.value)} className="avm-input" />
              <input type="text" placeholder="Contact Mobile Number" value={newStuPhone} onChange={(e) => setNewStuPhone(e.target.value)} className="avm-input" />
              <div style={{ display: 'flex', gap: 10, marginTop: 10 }}>
                <button type="button" onClick={() => setAddStudentOpen(false)} className="avm-btn-secondary" style={{ flex: 1 }}>Cancel</button>
                <button type="submit" className="avm-btn-primary" style={{ flex: 1, backgroundColor: '#4F46E5' }}>Save Student</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ADD EMPLOYEE MODAL */}
      {addEmployeeOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(15,23,42,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, zIndex: 1000 }}>
          <div style={{ backgroundColor: '#FFFFFF', borderRadius: 20, padding: 20, width: '100%', maxWidth: 400 }}>
            <h3 style={{ fontSize: 17, fontWeight: 800, margin: '0 0 14px 0' }}>Add New Staff / Teacher</h3>
            <form onSubmit={handleCreateEmployee} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <input type="text" placeholder="Employee Name" value={newEmpName} onChange={(e) => setNewEmpName(e.target.value)} className="avm-input" required />
              <input type="text" placeholder="Employee ID (e.g. EMP005)" value={newEmpId} onChange={(e) => setNewEmpId(e.target.value)} className="avm-input" required />
              <input type="text" placeholder="Designation (e.g. Senior Teacher)" value={newEmpDesig} onChange={(e) => setNewEmpDesig(e.target.value)} className="avm-input" />
              <input type="text" placeholder="Contact Mobile Number" value={newEmpPhone} onChange={(e) => setNewEmpPhone(e.target.value)} className="avm-input" />
              <div style={{ display: 'flex', gap: 10, marginTop: 10 }}>
                <button type="button" onClick={() => setAddEmployeeOpen(false)} className="avm-btn-secondary" style={{ flex: 1 }}>Cancel</button>
                <button type="submit" className="avm-btn-primary" style={{ flex: 1, backgroundColor: '#0D9488' }}>Save Staff</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CREATE NOTICE MODAL */}
      {createNoticeOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(15,23,42,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, zIndex: 1000 }}>
          <div style={{ backgroundColor: '#FFFFFF', borderRadius: 20, padding: 20, width: '100%', maxWidth: 400 }}>
            <h3 style={{ fontSize: 17, fontWeight: 800, margin: '0 0 14px 0' }}>Publish New Notice</h3>
            <form onSubmit={handleCreateNotice} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <input type="text" placeholder="Notice Title" value={noticeTitle} onChange={(e) => setNoticeTitle(e.target.value)} className="avm-input" required />
              <textarea placeholder="Notice Description Content" value={noticeContent} onChange={(e) => setNoticeContent(e.target.value)} className="avm-input" style={{ minHeight: 80 }} required />
              <select value={noticeTarget} onChange={(e: any) => setNoticeTarget(e.target.value)} className="avm-input">
                <option value="All">Target: All (Students & Employees)</option>
                <option value="Students">Target: Students Only</option>
                <option value="Teachers">Target: Teachers Only</option>
              </select>
              <div style={{ display: 'flex', gap: 10, marginTop: 10 }}>
                <button type="button" onClick={() => setCreateNoticeOpen(false)} className="avm-btn-secondary" style={{ flex: 1 }}>Cancel</button>
                <button type="submit" className="avm-btn-primary" style={{ flex: 1, backgroundColor: '#EF4444' }}>Publish Notice</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
