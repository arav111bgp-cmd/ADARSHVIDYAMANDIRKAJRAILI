import React, { useState, useEffect } from 'react';
import {
  Student,
  Employee,
  SchoolSalaryPaymentRecord,
  Exam,
  Notice,
  NoticeType,
  NoticeRecipients,
  NoticeStatus,
  StudentResult,
  NotificationItem,
  NotificationTemplate,
  NotificationType,
  NotificationPriority
} from '../types';
import {
  mockSchoolClasses,
  mockSections,
  mockSchoolInfo
} from '../mock/mockData';
import { adminService } from '../services/adminService';
import { classService } from '../services/classService';
import { admitCardService } from '../services/admitCardService';
import { apiFetch } from '../services/api';
import { feeService } from '../services/feeService';
import { noticeService } from '../services/noticeService';
import { academicService } from '../services/academicService';
import { notificationService } from '../services/notificationService';
import {
  demoDataStore,
  SchoolClassRecord,
  SchoolSectionInfo,
  INITIAL_SEED_SCHOOL_CLASSES,
  SchoolFeeRecord,
  SchoolFeePaymentHistory,
  SchoolSubjectRecord,
  SchoolAdmitCardRecord
} from '../services/demoDataStore';
import { processProfileImageFile } from '../utils/imageUtils';
import { TransportModule } from '../components/TransportModule';
import { CertificatesModule } from '../components/CertificatesModule';
import { TimetableModule } from '../components/TimetableModule';
import { AdminSettingsModule } from '../components/AdminSettingsModule';
import { CentralReportsModule } from '../components/CentralReportsModule';
import { AdminEmployeeAttendanceModule } from '../components/AdminEmployeeAttendanceModule';
import { settingsService } from '../services/settingsService';
import { transportService } from '../services/transportService';
import {
  LayoutDashboard,
  GraduationCap,
  Users,
  BookOpen,
  FileText,
  Award,
  CreditCard,
  Bell,
  Printer,
  Bus as BusIcon,
  Plus,
  Search,
  FileCheck,
  Send,
  CheckSquare,
  Clock,
  Shield,
  Inbox,
  LogOut,
  ChevronDown,
  Calendar,
  Sparkles,
  TrendingUp,
  UserCheck,
  Briefcase,
  School,
  CalendarCheck,
  Activity,
  Edit,
  Trash2,
  PieChart as PieChartIcon,
  ChevronLeft,
  ChevronRight,
  Filter,
  RefreshCw,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Eye,
  User,
  Phone,
  Mail,
  MapPin,
  Lock,
  FileSpreadsheet,
  Paperclip,
  MessageSquare,
  Radio,
  Check,
  RotateCcw,
  Sliders,
  Settings,
  Layers,
  ExternalLink,
  X
} from 'lucide-react';
import { Modal } from '../components/Modal';
import { AdmitCardModal } from '../components/AdmitCardModal';
import { ReportCardModal } from '../components/ReportCardModal';

interface AdminWebDashboardProps {
  onLogout?: () => void;
}

export type AdminTab =
  | 'dashboard'
  | 'students'
  | 'teachers'
  | 'classes'
  | 'subjects'
  | 'class-subjects'
  | 'attendance'
  | 'employee-attendance'
  | 'homework'
  | 'exams'
  | 'marks'
  | 'results'
  | 'admitcards'
  | 'fees'
  | 'notices'
  | 'notifications'
  | 'timetable'
  | 'reports'
  | 'transport'
  | 'certificates'
  | 'settings';

export const AdminWebDashboard: React.FC<AdminWebDashboardProps> = ({ onLogout }) => {
  // Initial active tab from URL path
  const getInitialTab = (): AdminTab => {
    const path = window.location.pathname.replace(/\/$/, '');
    const parts = path.split('/');
    if (parts.length >= 3 && parts[1] === 'admin') {
      const target = parts[2].toLowerCase() as AdminTab;
      const validTabs: AdminTab[] = [
        'dashboard', 'students', 'teachers', 'classes', 'subjects', 'class-subjects',
        'attendance', 'employee-attendance', 'homework', 'exams', 'marks', 'results', 'admitcards', 'fees',
        'notices', 'notifications', 'timetable', 'reports', 'transport', 'certificates', 'settings'
      ];
      if (validTabs.includes(target)) return target;
    }
    return 'dashboard';
  };

  const [activeTab, setActiveTabState] = useState<AdminTab>(getInitialTab);
  const [academicYear, setAcademicYear] = useState<string>(() => academicService.getActiveSessionId());

  // Persistent Collapsible Sidebar State
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(() => {
    try {
      return localStorage.getItem('avm_admin_sidebar_collapsed') === 'true';
    } catch (e) {
      return false;
    }
  });

  const toggleSidebar = () => {
    setIsSidebarCollapsed(prev => {
      const next = !prev;
      try {
        localStorage.setItem('avm_admin_sidebar_collapsed', String(next));
      } catch (e) { }
      return next;
    });
  };

  const setActiveTab = (tab: AdminTab) => {
    setActiveTabState(tab);
    try {
      window.history.pushState(null, '', `/admin/${tab}`);
    } catch (e) { }
  };

  // State collections from Demo Data Store
  const [students, setStudents] = useState<Student[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [exams, setExams] = useState<Exam[]>([]);
  const [notices, setNotices] = useState<Notice[]>([]);
  const [attendanceLogs, setAttendanceLogs] = useState<any[]>([]);
  const [homeworkList, setHomeworkList] = useState<any[]>([]);
  const [marksList, setMarksList] = useState<any[]>([]);
  const [notificationsList, setNotificationsList] = useState<any[]>([]);
  const [timetableList, setTimetableList] = useState<any[]>([]);
  const [feesList, setFeesList] = useState<any[]>([]);
  const [activityLogs, setActivityLogs] = useState<any[]>([]);

  // Search & Filter controls
  const [studentSearch, setStudentSearch] = useState('');
  const [classFilter, setClassFilter] = useState('All');
  const [teacherSearch, setTeacherSearch] = useState('');
  const [teacherSubFilter, setTeacherSubFilter] = useState('All');

  // Modals state
  const [addStudentModalOpen, setAddStudentModalOpen] = useState(false);
  const [editStudent, setEditStudent] = useState<Student | null>(null);
  const [viewStudent, setViewStudent] = useState<Student | null>(null);

  const [addTeacherModalOpen, setAddTeacherModalOpen] = useState(false);
  const [editTeacher, setEditTeacher] = useState<Employee | null>(null);
  const [viewTeacher, setViewTeacher] = useState<Employee | null>(null);

  const [createExamModalOpen, setCreateExamModalOpen] = useState(false);
  const [broadcastNoticeModalOpen, setBroadcastNoticeModalOpen] = useState(false);
  const [addHomeworkModalOpen, setAddHomeworkModalOpen] = useState(false);
  const [updateFeeModalOpen, setUpdateFeeModalOpen] = useState(false);
  const [addTimetableModalOpen, setAddTimetableModalOpen] = useState(false);
  const [sendNotifModalOpen, setSendNotifModalOpen] = useState(false);

  // --- NOTIFICATIONS MODULE STATE, FILTERS & MODALS ---
  const [notificationSearch, setNotificationSearch] = useState('');
  const [notificationTypeFilter, setNotificationTypeFilter] = useState('All');
  const [notificationAudienceFilter, setNotificationAudienceFilter] = useState('All');
  const [notificationStatusFilter, setNotificationStatusFilter] = useState('All');
  const [notificationDateFilter, setNotificationDateFilter] = useState('All');

  const [notifCurrentPage, setNotifCurrentPage] = useState(1);
  const [notifItemsPerPage, setNotifItemsPerPage] = useState(10);
  const [selectedNotifIds, setSelectedNotifIds] = useState<string[]>([]);

  const [viewNotifDetails, setViewNotifDetails] = useState<NotificationItem | null>(null);
  const [templatesModalOpen, setTemplatesModalOpen] = useState(false);
  const [createTemplateModalOpen, setCreateTemplateModalOpen] = useState(false);
  const [settingsModalOpen, setSettingsModalOpen] = useState(false);
  const [bellDropdownOpen, setBellDropdownOpen] = useState(false);

  // Send Notification Form State
  const [notifFormTitle, setNotifFormTitle] = useState('');
  const [notifFormType, setNotifFormType] = useState<NotificationType>('General');
  const [notifFormPriority, setNotifFormPriority] = useState<NotificationPriority>('Normal');
  const [notifFormSendTo, setNotifFormSendTo] = useState<'students' | 'employees' | 'both'>('students');
  const [notifFormTargetAudience, setNotifFormTargetAudience] = useState<string>('All Students');
  const [notifFormClass, setNotifFormClass] = useState<string>('Class 5');
  const [notifFormSection, setNotifFormSection] = useState<string>('A');
  const [notifFormTargetStudentId, setNotifFormTargetStudentId] = useState<string>('');
  const [notifFormTargetEmployeeId, setNotifFormTargetEmployeeId] = useState<string>('');
  const [notifFormMessage, setNotifFormMessage] = useState('');
  const [notifFormAttachment, setNotifFormAttachment] = useState('');
  const [notifFormActionUrl, setNotifFormActionUrl] = useState('');
  const [notifFormInApp, setNotifFormInApp] = useState(true);
  const [notifFormPush, setNotifFormPush] = useState(true);
  const [notifFormEmail, setNotifFormEmail] = useState(false);
  const [notifFormSms, setNotifFormSms] = useState(false);
  const [notifFormWhatsapp, setNotifFormWhatsapp] = useState(false);
  const [notifFormSendOption, setNotifFormSendOption] = useState<'now' | 'schedule'>('now');
  const [notifFormScheduleDate, setNotifFormScheduleDate] = useState('');
  const [notifFormScheduleTime, setNotifFormScheduleTime] = useState('10:00 AM');

  // Template Form State
  const [tplFormName, setTplFormName] = useState('');
  const [tplFormType, setTplFormType] = useState<NotificationType>('General');
  const [tplFormTitle, setTplFormTitle] = useState('');
  const [tplFormMessage, setTplFormMessage] = useState('');

  const resetSendNotifForm = () => {
    setNotifFormTitle('');
    setNotifFormType('General');
    setNotifFormPriority('Normal');
    setNotifFormSendTo('students');
    setNotifFormTargetAudience('All Students');
    setNotifFormClass('Class 5');
    setNotifFormSection('A');
    setNotifFormTargetStudentId('');
    setNotifFormTargetEmployeeId('');
    setNotifFormMessage('');
    setNotifFormAttachment('');
    setNotifFormActionUrl('');
    setNotifFormInApp(true);
    setNotifFormPush(true);
    setNotifFormEmail(false);
    setNotifFormSms(false);
    setNotifFormWhatsapp(false);
    setNotifFormSendOption('now');
    setNotifFormScheduleDate('');
    setNotifFormScheduleTime('10:00 AM');
  };

  // --- NOTICES MODULE STATE, FILTERS & MODALS ---
  const [noticeSearchQuery, setNoticeSearchQuery] = useState('');
  const [noticeTypeFilter, setNoticeTypeFilter] = useState('All');
  const [noticeRecipientFilter, setNoticeRecipientFilter] = useState('All');
  const [noticeStatusFilter, setNoticeStatusFilter] = useState('All');

  // Notice Modals State
  const [createNoticeModalOpen, setCreateNoticeModalOpen] = useState(false);
  const [viewNoticeModalNotice, setViewNoticeModalNotice] = useState<Notice | null>(null);
  const [editNoticeModalNotice, setEditNoticeModalNotice] = useState<Notice | null>(null);
  const [deleteNoticeConfirmId, setDeleteNoticeConfirmId] = useState<string | null>(null);

  // Form State for Create / Edit Notice
  const [formNoticeTitle, setFormNoticeTitle] = useState('');
  const [formNoticeType, setFormNoticeType] = useState<NoticeType>('General');
  const [formNoticeRecipients, setFormNoticeRecipients] = useState<NoticeRecipients>('students');
  const [formNoticeTargetClass, setFormNoticeTargetClass] = useState('All');
  const [formNoticeTargetSection, setFormNoticeTargetSection] = useState('All');
  const [formNoticeTargetDepartment, setFormNoticeTargetDepartment] = useState('All');
  const [formNoticeDesc, setFormNoticeDesc] = useState('');
  const [formNoticeAttachment, setFormNoticeAttachment] = useState('');
  const [formNoticeStatus, setFormNoticeStatus] = useState<NoticeStatus>('Published');
  const [formNoticePublishDate, setFormNoticePublishDate] = useState(new Date().toISOString().split('T')[0]);
  const [formNoticePublishTime, setFormNoticePublishTime] = useState('10:30 AM');
  const [formNoticeScheduledDate, setFormNoticeScheduledDate] = useState('');
  const [formNoticeScheduledTime, setFormNoticeScheduledTime] = useState('');

  const getNoticeTypeStyle = (type: string) => {
    switch (type) {
      case 'PTM': return { bg: '#F3E8FF', text: '#7C3AED' };
      case 'Exam': return { bg: '#FFF7ED', text: '#EA580C' };
      case 'Holiday': return { bg: '#E0F2FE', text: '#0284C7' };
      case 'Homework': return { bg: '#FEF3C7', text: '#D97706' };
      case 'Fee': return { bg: '#FEE2E2', text: '#DC2626' };
      case 'Emergency': return { bg: '#FEE2E2', text: '#DC2626' };
      case 'Academic': return { bg: '#F0FDF4', text: '#16A34A' };
      case 'Event': return { bg: '#FCE7F3', text: '#DB2777' };
      case 'Circular': return { bg: '#F1F5F9', text: '#475569' };
      default: return { bg: '#F1F5F9', text: '#475569' };
    }
  };

  const openCreateNoticeModal = () => {
    setEditNoticeModalNotice(null);
    setFormNoticeTitle('');
    setFormNoticeType('General');
    setFormNoticeRecipients('students');
    setFormNoticeTargetClass('All');
    setFormNoticeTargetSection('All');
    setFormNoticeTargetDepartment('All');
    setFormNoticeDesc('');
    setFormNoticeAttachment('');
    setFormNoticeStatus('Published');
    setFormNoticePublishDate(new Date().toISOString().split('T')[0]);
    setFormNoticePublishTime('10:30 AM');
    setFormNoticeScheduledDate('');
    setFormNoticeScheduledTime('');
    setCreateNoticeModalOpen(true);
  };

  const openEditNoticeModal = (n: Notice) => {
    setEditNoticeModalNotice(n);
    setFormNoticeTitle(n.title);
    setFormNoticeType(n.type || (n.category as any) || 'General');
    setFormNoticeRecipients(n.recipients || 'both');
    setFormNoticeTargetClass(n.targetClass || 'All');
    setFormNoticeTargetSection(n.targetSection || 'All');
    setFormNoticeTargetDepartment(n.targetDepartment || 'All');
    setFormNoticeDesc(n.description || '');
    setFormNoticeAttachment(n.attachmentName || '');
    setFormNoticeStatus(n.status || 'Published');
    setFormNoticePublishDate(n.publishDate || n.date || new Date().toISOString().split('T')[0]);
    setFormNoticePublishTime(n.publishTime || '10:30 AM');
    setFormNoticeScheduledDate(n.scheduledDate || '');
    setFormNoticeScheduledTime(n.scheduledTime || '');
    setCreateNoticeModalOpen(true);
  };

  const handleSaveNoticeSubmit = async (e: React.FormEvent, forceStatus?: NoticeStatus) => {
    e.preventDefault();
    if (!formNoticeTitle.trim()) {
      alert('Please enter Notice Title');
      return;
    }
    if (!formNoticeDesc.trim()) {
      alert('Please enter Notice Description');
      return;
    }

    const targetStatus = forceStatus || formNoticeStatus;

    const noticeData: Partial<Notice> = {
      title: formNoticeTitle.trim(),
      type: formNoticeType,
      category: formNoticeType,
      description: formNoticeDesc.trim(),
      recipients: formNoticeRecipients,
      targetType: formNoticeTargetClass !== 'All' ? 'class' : formNoticeTargetDepartment !== 'All' ? 'department' : 'all',
      targetClass: formNoticeTargetClass,
      targetSection: formNoticeTargetSection,
      targetDepartment: formNoticeTargetDepartment,
      attachmentName: formNoticeAttachment.trim() || undefined,
      status: targetStatus,
      publishDate: formNoticePublishDate,
      publishTime: formNoticePublishTime,
      scheduledDate: targetStatus === 'Scheduled' ? formNoticeScheduledDate : undefined,
      scheduledTime: targetStatus === 'Scheduled' ? formNoticeScheduledTime : undefined
    };

    if (editNoticeModalNotice) {
      await noticeService.updateNotice(editNoticeModalNotice.id, noticeData);
    } else {
      await noticeService.sendNotice(noticeData);
    }

    setCreateNoticeModalOpen(false);
    setEditNoticeModalNotice(null);
    await refreshAll();
  };

  const handleConfirmDeleteNotice = async () => {
    if (!deleteNoticeConfirmId) return;
    await noticeService.deleteNotice(deleteNoticeConfirmId);
    setDeleteNoticeConfirmId(null);
    if (viewNoticeModalNotice && viewNoticeModalNotice.id === deleteNoticeConfirmId) {
      setViewNoticeModalNotice(null);
    }
    await refreshAll();
  };

  const handleArchiveNotice = async (notId: string) => {
    await noticeService.archiveNotice(notId);
    if (viewNoticeModalNotice && viewNoticeModalNotice.id === notId) {
      setViewNoticeModalNotice((prev) => prev ? { ...prev, status: 'Archived' } : null);
    }
    await refreshAll();
  };

  // Print Preview Modals
  const [previewAdmitCardStudent, setPreviewAdmitCardStudent] = useState<Student | null>(null);
  const [previewReportCardStudent, setPreviewReportCardStudent] = useState<Student | null>(null);

  // --- FEES MODULE STATE & FILTERS ---
  const [feeClassFilter, setFeeClassFilter] = useState('All');
  const [feeSectionFilter, setFeeSectionFilter] = useState('All');
  const [feeStudentFilter, setFeeStudentFilter] = useState('All');
  const [feeSearchQuery, setFeeSearchQuery] = useState('');
  const [feeStatusFilter, setFeeStatusFilter] = useState('All');
  const [feeTypeFilter, setFeeTypeFilter] = useState('All');
  const [feePaymentModeFilter, setFeePaymentModeFilter] = useState('All');

  // Fees Modals state
  const [viewFeeRecord, setViewFeeRecord] = useState<SchoolFeeRecord | null>(null);
  const [updateFeeModalRecord, setUpdateFeeModalRecord] = useState<SchoolFeeRecord | null>(null);
  const [isUpdateFeeOpen, setIsUpdateFeeOpen] = useState(false);
  const [recordPaymentRecord, setRecordPaymentRecord] = useState<SchoolFeeRecord | null>(null);
  const [receiptModalRecord, setReceiptModalRecord] = useState<SchoolFeeRecord | null>(null);
  const [receiptModalPayment, setReceiptModalPayment] = useState<SchoolFeePaymentHistory | null>(null);
  const [feeToastMsg, setFeeToastMsg] = useState<string | null>(null);

  // Update Student Fee Form State
  const [formFeeStudentId, setFormFeeStudentId] = useState('');
  const [formFeeClass, setFormFeeClass] = useState('Class 5');
  const [formFeeSection, setFormFeeSection] = useState('A');
  const [formFeeType, setFormFeeType] = useState('Tuition Fee');
  const [formFeeAmount, setFormFeeAmount] = useState('');
  const [formFeeDueDate, setFormFeeDueDate] = useState('2026-10-15');
  const [formFeeRemarks, setFormFeeRemarks] = useState('');

  // Record Payment Form State
  const [pmtStudentId, setPmtStudentId] = useState('');
  const [pmtFeeType, setPmtFeeType] = useState('All');
  const [pmtAmount, setPmtAmount] = useState('');
  const [pmtDate, setPmtDate] = useState(new Date().toISOString().split('T')[0]);
  const [pmtMode, setPmtMode] = useState<'Cash' | 'UPI' | 'Bank Transfer' | 'Cheque' | 'Online'>('Cash');
  const [pmtTransactionRef, setPmtTransactionRef] = useState('');
  const [pmtRemarks, setPmtRemarks] = useState('');
  const [pmtErrorMsg, setPmtErrorMsg] = useState('');

  // Show fee toast banner
  const triggerFeeToast = (msg: string) => {
    setFeeToastMsg(msg);
    setTimeout(() => setFeeToastMsg(null), 4000);
  };

  // Open Update Student Fee modal (prefilled if updating specific student)
  const openUpdateFeeModal = (existingRecord?: SchoolFeeRecord | null, defaultStudentId?: string) => {
    if (existingRecord) {
      setUpdateFeeModalRecord(existingRecord);
      setFormFeeStudentId(existingRecord.studentId);
      setFormFeeClass(existingRecord.className || 'Class 5');
      setFormFeeSection(existingRecord.section || 'A');
      setFormFeeType('Tuition Fee');
      setFormFeeAmount('');
      setFormFeeDueDate(existingRecord.dueDate || '2026-10-15');
      setFormFeeRemarks('');
    } else {
      setUpdateFeeModalRecord(null);
      setFormFeeStudentId(defaultStudentId || (students[0]?.id || 'STU-157'));
      setFormFeeClass(feeClassFilter !== 'All' ? feeClassFilter : 'Class 5');
      setFormFeeSection(feeSectionFilter !== 'All' ? feeSectionFilter : 'A');
      setFormFeeType('Tuition Fee');
      setFormFeeAmount('');
      setFormFeeDueDate('2026-10-15');
      setFormFeeRemarks('');
    }
    setIsUpdateFeeOpen(true);
  };

  // Open Record Payment modal
  const openRecordPaymentModal = (record: SchoolFeeRecord) => {
    setRecordPaymentRecord(record);
    setPmtStudentId(record.studentId);
    setPmtFeeType('All');
    setPmtAmount(String(record.pendingFee || ''));
    setPmtDate(new Date().toISOString().split('T')[0]);
    setPmtMode('Cash');
    setPmtTransactionRef('');
    setPmtRemarks('');
    setPmtErrorMsg('');
  };

  // Open Printable Receipt Modal
  const openReceiptModal = (record: SchoolFeeRecord, pmt: SchoolFeePaymentHistory) => {
    setReceiptModalRecord(record);
    setReceiptModalPayment(pmt);
  };

  // Save Update Fee Form Handler
  const handleSaveFeeUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formFeeStudentId) {
      alert('Please select a student');
      return;
    }
    const amt = Number(formFeeAmount);
    if (isNaN(amt) || amt <= 0) {
      alert('Please enter a valid positive fee amount');
      return;
    }

    const targetStudent = students.find(s => s.id === formFeeStudentId);
    const res = feeService.addOrUpdateFeeItem({
      studentId: formFeeStudentId,
      studentName: targetStudent?.name,
      admissionNo: targetStudent?.admissionNo,
      className: formFeeClass,
      section: formFeeSection,
      feeType: formFeeType,
      amount: amt,
      dueDate: formFeeDueDate,
      remarks: formFeeRemarks,
      academicSessionId: selectedSessionId
    });

    if (res.success) {
      setIsUpdateFeeOpen(false);
      triggerFeeToast(`Fee record saved successfully for ${res.record.studentName}`);
      if (viewFeeRecord && viewFeeRecord.studentId === formFeeStudentId) {
        setViewFeeRecord(feeService.getFeeRecordByStudentId(formFeeStudentId, selectedSessionId) || null);
      }
    }
  };

  // Save Record Payment Form Handler
  const handleSavePayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!recordPaymentRecord) return;

    const amt = Number(pmtAmount);
    if (isNaN(amt) || amt <= 0) {
      setPmtErrorMsg('Please enter a valid payment amount');
      return;
    }

    if (amt > recordPaymentRecord.pendingFee) {
      setPmtErrorMsg(`Payment amount (₹${amt.toLocaleString('en-IN')}) cannot be greater than pending amount (₹${recordPaymentRecord.pendingFee.toLocaleString('en-IN')})`);
      return;
    }

    const res = feeService.recordPayment({
      studentId: recordPaymentRecord.studentId,
      feeType: pmtFeeType,
      amount: amt,
      paymentDate: pmtDate,
      paymentMode: pmtMode,
      transactionRef: pmtTransactionRef,
      remarks: pmtRemarks,
      collectedBy: 'Admin',
      academicSessionId: selectedSessionId
    });

    if (res.success && res.record) {
      const updatedRecord = res.record;
      const latestHistory = updatedRecord.paymentHistory[0];
      setRecordPaymentRecord(null);
      triggerFeeToast(`Payment of ₹${amt.toLocaleString('en-IN')} recorded successfully! Receipt: ${res.receiptNo}`);

      if (viewFeeRecord && viewFeeRecord.studentId === updatedRecord.studentId) {
        setViewFeeRecord(updatedRecord);
      }

      if (latestHistory) {
        openReceiptModal(updatedRecord, latestHistory);
      }
    } else if (res.error) {
      setPmtErrorMsg(res.error);
    }
  };

  // --- ADD / EDIT STUDENT FORM STATE & TABS ---
  const [stuFormTab, setStuFormTab] = useState<'personal' | 'academic' | 'parent' | 'address' | 'emergency' | 'account' | 'transport' | 'fees'>('personal');
  const [stuValidationError, setStuValidationError] = useState('');

  const [stuName, setStuName] = useState('');
  const [stuAdmissionNo, setStuAdmissionNo] = useState('');
  const [stuDob, setStuDob] = useState('2018-01-15');
  const [stuGender, setStuGender] = useState('Male');
  const [stuBloodGroup, setStuBloodGroup] = useState('O+');
  const [stuPhoto, setStuPhoto] = useState('');
  const [stuAadhaar, setStuAadhaar] = useState('');
  const [stuNationality, setStuNationality] = useState('Indian');
  const [stuCategory, setStuCategory] = useState('General');

  const [stuClass, setStuClass] = useState('Class 5');
  const [stuSec, setStuSec] = useState('A');
  const [stuRoll, setStuRoll] = useState('18');
  const [stuAdmissionDate, setStuAdmissionDate] = useState('2026-04-01');
  const [stuPrevSchool, setStuPrevSchool] = useState('');
  const [stuPrevClass, setStuPrevClass] = useState('');

  const [stuFather, setStuFather] = useState('');
  const [stuMother, setStuMother] = useState('');
  const [stuGuardian, setStuGuardian] = useState('');
  const [stuFatherOcc, setStuFatherOcc] = useState('Business');
  const [stuMotherOcc, setStuMotherOcc] = useState('Homemaker');
  const [stuPhone, setStuPhone] = useState('');
  const [stuAltPhone, setStuAltPhone] = useState('');
  const [stuEmail, setStuEmail] = useState('');

  const [stuAddress, setStuAddress] = useState('Main Road, Kajraili');
  const [stuCity, setStuCity] = useState('Bhagalpur');
  const [stuDistrict, setStuDistrict] = useState('Bhagalpur');
  const [stuState, setStuState] = useState('Bihar');
  const [stuPinCode, setStuPinCode] = useState('812005');

  const [stuEmgName, setStuEmgName] = useState('');
  const [stuEmgPhone, setStuEmgPhone] = useState('');
  const [stuEmgRelation, setStuEmgRelation] = useState('Father');

  const [stuPassword, setStuPassword] = useState('123456');
  const [stuStatus, setStuStatus] = useState<'Active' | 'Inactive' | 'Left' | 'Transferred' | 'Promoted' | 'Repeated' | 'Left School'>('Active');

  // Transport tab states
  const [stuTransportReq, setStuTransportReq] = useState<'Yes' | 'No'>('No');
  const [stuTransportBusId, setStuTransportBusId] = useState('');
  const [stuTransportVillage, setStuTransportVillage] = useState('Kajraili');
  const [stuTransportStop, setStuTransportStop] = useState('Kajraili Chowk');
  const [stuTransportTime, setStuTransportTime] = useState('07:15 AM');
  const [stuTransportFee, setStuTransportFee] = useState<number>(500);

  // Fees tab states
  const [stuTuitionFee, setStuTuitionFee] = useState<number>(1500);
  const [stuOtherFee, setStuOtherFee] = useState<number>(0);
  const [stuInitialPayment, setStuInitialPayment] = useState<number>(1000);
  const [stuPaymentMethod, setStuPaymentMethod] = useState<'Cash' | 'Online UPI' | 'Bank Transfer' | 'Cheque'>('Cash');
  const [stuPaymentDate, setStuPaymentDate] = useState<string>(() => new Date().toISOString().split('T')[0]);

  // --- ADD / EDIT TEACHER / STAFF FORM STATE & TABS ---
  const [empFormTab, setEmpFormTab] = useState<'personal' | 'professional' | 'academic' | 'parents' | 'address' | 'documents' | 'account' | 'transport' | 'salary'>('personal');
  const [empValidationError, setEmpValidationError] = useState('');

  // Step 1: Personal
  const [empName, setEmpName] = useState('');
  const [empCodeInput, setEmpCodeInput] = useState('');
  const [empDob, setEmpDob] = useState('1990-05-20');
  const [empGender, setEmpGender] = useState('Female');
  const [empBloodGroup, setEmpBloodGroup] = useState('B+');
  const [empCategory, setEmpCategory] = useState('General');
  const [empNationality, setEmpNationality] = useState('Indian');
  const [empAadhaar, setEmpAadhaar] = useState('');
  const [empPanNumber, setEmpPanNumber] = useState('');
  const [empPhoto, setEmpPhoto] = useState('');
  const [empPhone, setEmpPhone] = useState('');
  const [empAltPhone, setEmpAltPhone] = useState('');
  const [empEmail, setEmpEmail] = useState('');

  // Step 2: Professional
  const [empType, setEmpType] = useState('Permanent');
  const [empDepartment, setEmpDepartment] = useState('Academic');
  const [empDesig, setEmpDesig] = useState('Teacher');
  const [empJoinDate, setEmpJoinDate] = useState('2026-07-01');
  const [empStatus, setEmpStatus] = useState<'Active' | 'Inactive' | 'On Leave' | 'Resigned'>('Active');
  const [empExp, setEmpExp] = useState('3 Years');
  const [empPrevSchool, setEmpPrevSchool] = useState('');
  const [empPrevDesignation, setEmpPrevDesignation] = useState('');
  const [empUanCode, setEmpUanCode] = useState('');
  const [empEsiNumber, setEmpEsiNumber] = useState('');
  const [empPfNumber, setEmpPfNumber] = useState('');
  const [empRole, setEmpRole] = useState('Teacher');

  // Step 3: Academic & Teaching
  const [empQual, setEmpQual] = useState('B.Ed');
  const [empProfQual, setEmpProfQual] = useState('B.Ed');
  const [empSpecialization, setEmpSpecialization] = useState('Mathematics');
  const [empTeachingExp, setEmpTeachingExp] = useState('3 Years');
  const [empSubject, setEmpSubject] = useState('Mathematics');
  const [empMedium, setEmpMedium] = useState('Hindi + English');
  const [empIsClassTeacher, setEmpIsClassTeacher] = useState<'Yes' | 'No'>('No');
  const [empClassTeacherClass, setEmpClassTeacherClass] = useState('Class 5');
  const [empClassTeacherSec, setEmpClassTeacherSec] = useState('A');
  const [empAssignedClasses, setEmpAssignedClasses] = useState<string[]>(['Class 5-A', 'Class 6-A']);
  const [empTeachingSubjects, setEmpTeachingSubjects] = useState<string[]>(['Mathematics', 'Science']);

  // Step 4: Parents / Emergency Contact
  const [empFather, setEmpFather] = useState('');
  const [empMother, setEmpMother] = useState('');
  const [empSpouse, setEmpSpouse] = useState('');
  const [empGuardianName, setEmpGuardianName] = useState('');
  const [empEmgName, setEmpEmgName] = useState('');
  const [empEmgRelation, setEmpEmgRelation] = useState('Spouse');
  const [empEmgPhone, setEmpEmgPhone] = useState('');
  const [empEmgAltPhone, setEmpEmgAltPhone] = useState('');
  const [empEmgAddress, setEmpEmgAddress] = useState('');

  // Step 5: Address
  const [empAddress, setEmpAddress] = useState('Teachers Colony, Kajraili');
  const [empAddressLine2, setEmpAddressLine2] = useState('');
  const [empVillage, setEmpVillage] = useState('Kajraili');
  const [empCity, setEmpCity] = useState('Bhagalpur');
  const [empDistrict, setEmpDistrict] = useState('Bhagalpur');
  const [empState, setEmpState] = useState('Bihar');
  const [empPinCode, setEmpPinCode] = useState('812005');
  const [empSameAsCurrentAddress, setEmpSameAsCurrentAddress] = useState(true);
  const [empPermAddress, setEmpPermAddress] = useState('');
  const [empPermAddressLine2, setEmpPermAddressLine2] = useState('');
  const [empPermVillage, setEmpPermVillage] = useState('');
  const [empPermCity, setEmpPermCity] = useState('');
  const [empPermDistrict, setEmpPermDistrict] = useState('');
  const [empPermState, setEmpPermState] = useState('Bihar');
  const [empPermPinCode, setEmpPermPinCode] = useState('');

  // Step 6: Documents
  const [empDocuments, setEmpDocuments] = useState<any[]>([]);
  const [docTypeInput, setDocTypeInput] = useState('Aadhaar Card');
  const [docNumberInput, setDocNumberInput] = useState('');
  const [docFileInput, setDocFileInput] = useState('');
  const [docFileNameInput, setDocFileNameInput] = useState('');
  const [docIssueDateInput, setDocIssueDateInput] = useState('');
  const [docExpiryDateInput, setDocExpiryDateInput] = useState('');
  const [docRemarksInput, setDocRemarksInput] = useState('');

  // Step 7: Account / Credentials
  const [empUsername, setEmpUsername] = useState('');
  const [empPassword, setEmpPassword] = useState('123456');
  const [empConfirmPassword, setEmpConfirmPassword] = useState('123456');
  const [empAccountStatus, setEmpAccountStatus] = useState('Active');

  // Step 8: Transport
  const [empTransportReq, setEmpTransportReq] = useState<'Yes' | 'No'>('No');
  const [empTransportBusId, setEmpTransportBusId] = useState('');
  const [empTransportRoute, setEmpTransportRoute] = useState('Route 1 — Kajraili to School');
  const [empTransportVillage, setEmpTransportVillage] = useState('Kajraili');
  const [empTransportStop, setEmpTransportStop] = useState('Kajraili Chowk');
  const [empTransportTime, setEmpTransportTime] = useState('07:15 AM');
  const [empTransportFee, setEmpTransportFee] = useState<number>(500);
  const [empTransportStartDate, setEmpTransportStartDate] = useState<string>(() => new Date().toISOString().split('T')[0]);
  const [empTransportStatus, setEmpTransportStatus] = useState<string>('Active');

  // Step 9: Salary / Payroll & Payments & Dues
  const [empSalaryType, setEmpSalaryType] = useState<string>('Monthly');
  const [empBasicSalary, setEmpBasicSalary] = useState<number>(25000);
  const [empAllowances, setEmpAllowances] = useState<number>(3000);
  const [empDeduction, setEmpDeduction] = useState<number>(1000);
  const [empPaymentMode, setEmpPaymentMode] = useState('Bank Transfer');
  const [empBankName, setEmpBankName] = useState('');
  const [empAccountNumber, setEmpAccountNumber] = useState('');
  const [empIfscCode, setEmpIfscCode] = useState('');
  const [empSalaryStatus, setEmpSalaryStatus] = useState<'Active' | 'On Hold'>('Active');
  const [empSalaryEffectiveFrom, setEmpSalaryEffectiveFrom] = useState<string>(() => new Date().toISOString().split('T')[0]);

  // Payments List
  const [empPaidSalaryAmount, setEmpPaidSalaryAmount] = useState<number>(20000);
  const [empSalaryPaymentMonth, setEmpSalaryPaymentMonth] = useState<string>('September 2026');
  const [empSalaryPaymentDate, setEmpSalaryPaymentDate] = useState<string>(() => new Date().toISOString().split('T')[0]);
  const [empSalaryRefNo, setEmpSalaryRefNo] = useState<string>('');
  const [empSalaryRemarks, setEmpSalaryRemarks] = useState<string>('Monthly Salary Disbursement');
  const [empShowAddPayment, setEmpShowAddPayment] = useState<boolean>(false);
  const [empSalaryPaymentsList, setEmpSalaryPaymentsList] = useState<any[]>([]);

  // Dues & Charges
  const [empDues, setEmpDues] = useState<any[]>([]);
  const [empShowAddDue, setEmpShowAddDue] = useState<boolean>(false);
  const [dueTypeInput, setDueTypeInput] = useState('Uniform');
  const [dueDescInput, setDueDescInput] = useState('');
  const [dueAmountInput, setDueAmountInput] = useState<number | ''>('');
  const [dueDateInput, setDueDateInput] = useState<string>(() => new Date().toISOString().split('T')[0]);
  const [duePaidInput, setDuePaidInput] = useState<number | ''>(0);
  const [dueRemarksInput, setDueRemarksInput] = useState('');

  // Employee Profile View Tab State inside viewTeacher modal
  const [viewTeacherProfileTab, setViewTeacherProfileTab] = useState<'overview' | 'personal' | 'professional' | 'academic' | 'parents' | 'address' | 'documents' | 'account' | 'transport' | 'salary'>('overview');

  // Other Quick Forms
  const [newExamName, setNewExamName] = useState('');
  const [newExamStart, setNewExamStart] = useState('2026-10-15');

  const [noticeTitle, setNoticeTitle] = useState('');
  const [noticeCat, setNoticeCat] = useState<'Holiday' | 'Exam' | 'PTM' | 'Fee' | 'General' | 'Emergency'>('PTM');
  const [noticeDesc, setNoticeDesc] = useState('');

  const [hwClass, setHwClass] = useState('Class 5-A');
  const [hwSub, setHwSub] = useState('Mathematics');
  const [hwTitle, setHwTitle] = useState('');
  const [hwDesc, setHwDesc] = useState('');

  const [feeStudentId, setFeeStudentId] = useState('STU-157');
  const [feeTotalAmount, setFeeTotalAmount] = useState('2500');
  const [feePaidAmount, setFeePaidAmount] = useState('1500');

  const [ttPeriod, setTtPeriod] = useState('1');
  const [ttTime, setTtTime] = useState('08:00 AM - 08:45 AM');
  const [ttClass, setTtClass] = useState('Class 5-A');
  const [ttSubject, setTtSubject] = useState('Mathematics');
  const [ttTeacher, setTtTeacher] = useState('Mrs. Priya Sharma');

  const [notifTitle, setNotifTitle] = useState('');
  const [notifMsg, setNotifMsg] = useState('');

  // --- ACADEMIC SESSIONS STATE ---
  const [sessions, setSessions] = useState<any[]>(() => academicService.getSessions());
  const [selectedSessionId, setSelectedSessionId] = useState<string>(() => academicService.getActiveSessionId());
  const [activeSessionId, setActiveSessionId] = useState<string>(() => academicService.getActiveSessionId());

  // --- SUBJECT MASTER STATE ---
  const [masterSubjectsList, setMasterSubjectsList] = useState<any[]>(() => academicService.getMasterSubjects());
  const [mstSubSearch, setMstSubSearch] = useState('');
  const [mstSubCategory, setMstSubCategory] = useState('All');
  const [mstSubStatusFilter, setMstSubStatusFilter] = useState('All');
  const [isAddMasterSubjectOpen, setIsAddMasterSubjectOpen] = useState(false);
  const [editingMasterSubject, setEditingMasterSubject] = useState<any | null>(null);
  const [mSubName, setMSubName] = useState('');
  const [mSubCode, setMSubCode] = useState('');
  const [mSubCategory, setMSubCategory] = useState<'Theory' | 'Practical' | 'Activity' | 'Language'>('Theory');
  const [mSubMaxMarks, setMSubMaxMarks] = useState(100);
  const [mSubPassingMarks, setMSubPassingMarks] = useState(33);
  const [mSubStatus, setMSubStatus] = useState<'Active' | 'Inactive'>('Active');

  // --- CLASS SUBJECTS MAPPING STATE ---
  const [csClassFilter, setCsClassFilter] = useState('Class 5');
  const [csSecFilter, setCsSecFilter] = useState('All');
  const [isAssignSubjectOpen, setIsAssignSubjectOpen] = useState(false);
  const [editingClassSubject, setEditingClassSubject] = useState<any | null>(null);
  const [csSubjectId, setCsSubjectId] = useState('');
  const [csTeacherId, setCsTeacherId] = useState('');
  const [csMaxMarks, setCsMaxMarks] = useState(100);
  const [csPassingMarks, setCsPassingMarks] = useState(33);
  const [csType, setCsType] = useState<'Theory' | 'Practical' | 'Activity' | 'Language'>('Theory');

  const [manageSessionsModalOpen, setManageSessionsModalOpen] = useState(false);
  const [createSessionModalOpen, setCreateSessionModalOpen] = useState(false);
  const [promoteModalOpen, setPromoteModalOpen] = useState(false);

  // New Session form state
  const [newSessionName, setNewSessionName] = useState('2027–28');
  const [newSessionStart, setNewSessionStart] = useState('2027-04-01');
  const [newSessionEnd, setNewSessionEnd] = useState('2028-03-31');
  const [newSessionIsActive, setNewSessionIsActive] = useState(true);
  const [newSessionCopyForward, setNewSessionCopyForward] = useState(true);
  const [newSessionCarryFees, setNewSessionCarryFees] = useState(true);

  // Promotion form state
  const [promoFromClass, setPromoFromClass] = useState('Class 5-A');
  const [promoToClass, setPromoToClass] = useState('Class 6-A');
  const [promoToSessionId, setPromoToSessionId] = useState('2027-28');
  const [selectedStuForPromo, setSelectedStuForPromo] = useState<string[]>([]);

  // --- ATTENDANCE MODULE STATE ---
  const [attSubTab, setAttSubTab] = useState<'take' | 'history'>('take');
  const [attClassFilter, setAttClassFilter] = useState<string>('');
  const [attDate, setAttDate] = useState<string>(() => new Date().toISOString().split('T')[0]);
  const [attStatusFilter, setAttStatusFilter] = useState<'All' | 'present' | 'absent' | 'late'>('All');
  const [attMap, setAttMap] = useState<Record<string, 'present' | 'absent' | 'late'>>({});
  const [attSaveSuccess, setAttSaveSuccess] = useState<string | null>(null);
  const [attSaving, setAttSaving] = useState<boolean>(false);

  // Attendance History state
  const [attHistClass, setAttHistClass] = useState<string>('All');
  const [attHistStartDate, setAttHistStartDate] = useState<string>(() => {
    const d = new Date();
    d.setDate(d.getDate() - 14);
    return d.toISOString().split('T')[0];
  });
  const [attHistEndDate, setAttHistEndDate] = useState<string>(() => new Date().toISOString().split('T')[0]);

  // Class List options for Attendance
  const attendanceClassOptions = [
    'Nursery-A',
    'LKG-A',
    'UKG-A',
    'Class 1-A',
    'Class 2-A',
    'Class 3-A',
    'Class 4-A',
    'Class 5-A',
    'Class 6-A',
    'Class 7-A',
    'Class 8-A'
  ];

  // Sync attendance roster map whenever selected class, date, session or logs change
  useEffect(() => {
    if (!attClassFilter) {
      setAttMap({});
      return;
    }
    const classStus = students.filter((s) => {
      const matchesSession = !s.academicSessionId || s.academicSessionId === selectedSessionId;
      if (!matchesSession) return false;
      const fullStuClass = (s.className || '').includes('-') ? s.className : `${s.className}-${s.section || 'A'}`;
      return (
        fullStuClass.toLowerCase() === attClassFilter.toLowerCase() ||
        (s.className || '').toLowerCase() === attClassFilter.toLowerCase()
      );
    });

    const initialMap: Record<string, 'present' | 'absent' | 'late'> = {};
    classStus.forEach((s) => {
      const found = attendanceLogs.find(
        (a: any) =>
          a.studentId === s.id &&
          a.date === attDate &&
          (!a.academicSessionId || a.academicSessionId === selectedSessionId)
      );
      initialMap[s.id] = found ? (found.status.toLowerCase() as 'present' | 'absent' | 'late') : 'present';
    });
    setAttMap(initialMap);
  }, [attClassFilter, attDate, selectedSessionId, attendanceLogs, students]);

  // Helper for current class students
  const currentClassStudents = students.filter((s) => {
    if (!attClassFilter) return false;
    const matchesSession = !s.academicSessionId || s.academicSessionId === selectedSessionId;
    if (!matchesSession) return false;
    const fullStuClass = (s.className || '').includes('-') ? s.className : `${s.className}-${s.section || 'A'}`;
    return (
      fullStuClass.toLowerCase() === attClassFilter.toLowerCase() ||
      (s.className || '').toLowerCase() === attClassFilter.toLowerCase()
    );
  });

  // Filtered student roster according to attStatusFilter
  const displayedClassStudents = currentClassStudents.filter((s) => {
    if (attStatusFilter === 'All') return true;
    const status = attMap[s.id] || 'present';
    return status === attStatusFilter;
  });

  // Dynamic Summary Counts
  const attTotalCount = currentClassStudents.length;
  const attPresentCount = currentClassStudents.filter((s) => (attMap[s.id] || 'present') === 'present').length;
  const attAbsentCount = currentClassStudents.filter((s) => attMap[s.id] === 'absent').length;
  const attLateCount = currentClassStudents.filter((s) => attMap[s.id] === 'late').length;
  const attRatePercent = attTotalCount > 0 ? Math.round((attPresentCount / attTotalCount) * 100) : 0;

  // Handlers
  const handleMarkStudent = (studentId: string, status: 'present' | 'absent' | 'late') => {
    setAttMap((prev) => ({ ...prev, [studentId]: status }));
  };

  const handleMarkAllPresent = () => {
    const updated: Record<string, 'present' | 'absent' | 'late'> = {};
    currentClassStudents.forEach((s) => {
      updated[s.id] = 'present';
    });
    setAttMap(updated);
  };

  const handleMarkAllAbsent = () => {
    const updated: Record<string, 'present' | 'absent' | 'late'> = {};
    currentClassStudents.forEach((s) => {
      updated[s.id] = 'absent';
    });
    setAttMap(updated);
  };

  const handleSaveAttendance = async () => {
    if (!attClassFilter || currentClassStudents.length === 0) return;
    setAttSaving(true);
    try {
      const parts = attClassFilter.split('-');
      const cName = parts[0] || attClassFilter;
      const cSec = parts[1] || 'A';

      const recordsToSave = currentClassStudents.map((s) => ({
        id: `ATT-${s.id}-${attDate}-${selectedSessionId}`,
        academicSessionId: selectedSessionId,
        date: attDate,
        studentId: s.id,
        className: s.className || cName,
        section: s.section || cSec,
        status: attMap[s.id] || 'present',
        markedBy: 'Admin',
        teacherName: 'Principal / Admin',
        markedAt: new Date().toISOString(),
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }));

      // Post to backend API / Standalone Demo Engine
      await apiFetch('/api/attendance', {
        method: 'POST',
        body: JSON.stringify({
          records: recordsToSave,
          className: attClassFilter,
          academicSessionId: selectedSessionId,
          date: attDate
        })
      }).catch(() => null);

      // Persist in demoDataStore
      const db = demoDataStore.getDB();
      db.attendance = db.attendance || [];
      recordsToSave.forEach((rec) => {
        const idx = db.attendance.findIndex(
          (a: any) =>
            a.studentId === rec.studentId &&
            a.date === rec.date &&
            (!a.academicSessionId || a.academicSessionId === rec.academicSessionId)
        );
        if (idx !== -1) {
          db.attendance[idx] = { ...db.attendance[idx], ...rec };
        } else {
          db.attendance.push(rec);
        }
      });
      demoDataStore.saveDB(db);

      setAttSaveSuccess('Attendance saved successfully');
      setTimeout(() => setAttSaveSuccess(null), 3500);

      await refreshAll(selectedSessionId);
    } catch (e) {
      console.error('Failed to save attendance:', e);
    } finally {
      setAttSaving(false);
    }
  };

  // --- HOMEWORK MODULE STATE & HANDLERS ---
  const [hwClassFilter, setHwClassFilter] = useState<string>('');
  const [hwSubjectFilter, setHwSubjectFilter] = useState<string>('All');
  const [hwDateFilter, setHwDateFilter] = useState<string>('');

  const [publishHwModalOpen, setPublishHwModalOpen] = useState(false);
  const [editHwModalOpen, setEditHwModalOpen] = useState(false);
  const [deleteHwModalOpen, setDeleteHwModalOpen] = useState(false);
  const [selectedHwItem, setSelectedHwItem] = useState<any>(null);

  const [hwFormSessionId, setHwFormSessionId] = useState<string>('2026-27');
  const [hwFormClass, setHwFormClass] = useState<string>('Class 5-A');
  const [hwFormSubject, setHwFormSubject] = useState<string>('Mathematics');
  const [hwFormTitle, setHwFormTitle] = useState<string>('');
  const [hwFormDesc, setHwFormDesc] = useState<string>('');
  const [hwFormAssignedDate, setHwFormAssignedDate] = useState<string>(() => new Date().toISOString().split('T')[0]);
  const [hwFormDueDate, setHwFormDueDate] = useState<string>(() => {
    const d = new Date();
    d.setDate(d.getDate() + 3);
    return d.toISOString().split('T')[0];
  });
  const [hwFormTeacher, setHwFormTeacher] = useState<string>('Mrs. Priya Sharma');
  const [hwFormAttachment, setHwFormAttachment] = useState<string>('');
  const [hwSaving, setHwSaving] = useState<boolean>(false);
  const [hwSuccessMsg, setHwSuccessMsg] = useState<string | null>(null);

  // Helper for current class homework list
  const currentClassHomework = homeworkList.filter((hw: any) => {
    if (!hwClassFilter) return false;
    const matchesSession = !hw.academicSessionId || hw.academicSessionId === selectedSessionId;
    if (!matchesSession) return false;

    const fullHwClass = (hw.className || '').includes('-') ? hw.className : `${hw.className}-${hw.section || 'A'}`;
    return (
      fullHwClass.toLowerCase() === hwClassFilter.toLowerCase() ||
      (hw.className || '').toLowerCase() === hwClassFilter.toLowerCase()
    );
  });

  // Filtered by subject and date filters
  const displayedHomeworks = currentClassHomework.filter((hw: any) => {
    if (hwSubjectFilter !== 'All' && (hw.subject || '').toLowerCase() !== hwSubjectFilter.toLowerCase()) {
      return false;
    }
    if (hwDateFilter && hw.assignedDate !== hwDateFilter && hw.dueDate !== hwDateFilter) {
      return false;
    }
    return true;
  });

  // Dynamic Summary Counts
  const hwTotalCount = currentClassHomework.length;
  const hwPendingCount = currentClassHomework.filter((hw: any) => (hw.status || 'New') === 'New' || hw.status === 'Pending').length;
  const hwCompletedCount = currentClassHomework.filter((hw: any) => hw.status === 'Completed').length;
  const hwOverdueCount = currentClassHomework.filter((hw: any) => {
    if (hw.status === 'Completed') return false;
    if (!hw.dueDate) return false;
    return new Date(hw.dueDate) < new Date(new Date().toISOString().split('T')[0]);
  }).length;

  // Open Publish Modal
  const handleOpenPublishModal = () => {
    setHwFormSessionId(selectedSessionId);
    setHwFormClass(hwClassFilter || 'Class 5-A');
    setHwFormSubject('Mathematics');
    setHwFormTitle('');
    setHwFormDesc('');
    setHwFormAssignedDate(new Date().toISOString().split('T')[0]);
    const d = new Date();
    d.setDate(d.getDate() + 3);
    setHwFormDueDate(d.toISOString().split('T')[0]);
    setHwFormTeacher('Mrs. Priya Sharma');
    setHwFormAttachment('');
    setPublishHwModalOpen(true);
  };

  // Handle Submit Publish
  const handlePublishHomeworkSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!hwFormTitle || !hwFormDesc) return;
    setHwSaving(true);
    try {
      const parts = hwFormClass.split('-');
      const cName = parts[0] || hwFormClass;
      const cSec = parts[1] || 'A';

      const newRecord = {
        id: `HW-${Date.now().toString().slice(-6)}`,
        academicSessionId: hwFormSessionId || selectedSessionId,
        className: cName,
        section: cSec,
        subject: hwFormSubject,
        title: hwFormTitle,
        description: hwFormDesc,
        assignedDate: hwFormAssignedDate,
        dueDate: hwFormDueDate,
        teacherId: 'EMP-T102',
        teacherName: hwFormTeacher,
        attachmentUrl: hwFormAttachment || undefined,
        status: 'New',
        createdAt: new Date().toISOString()
      };

      // 1. Post to API / Standalone Demo Engine
      await apiFetch('/api/homework', {
        method: 'POST',
        body: JSON.stringify(newRecord)
      }).catch(() => null);

      // 2. Persist in demoDataStore
      const db = demoDataStore.getDB();
      db.homework = db.homework || [];
      db.homework.unshift(newRecord);

      db.notifications = db.notifications || [];
      db.notifications.unshift({
        id: `NOTIF-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        title: 'New Homework Assigned',
        message: `New ${newRecord.subject} homework: ${newRecord.title}. Class: ${hwFormClass}, Due: ${newRecord.dueDate}`,
        time: 'Just now',
        type: 'homework',
        targetClass: hwFormClass,
        isRead: false
      });

      demoDataStore.saveDB(db);

      setPublishHwModalOpen(false);
      setHwSuccessMsg('Homework published successfully');
      setTimeout(() => setHwSuccessMsg(null), 3500);

      await refreshAll(selectedSessionId);
    } catch (err) {
      console.error('Publish homework error:', err);
    } finally {
      setHwSaving(false);
    }
  };

  // Open Edit Modal
  const handleOpenEditHwModal = (hw: any) => {
    setSelectedHwItem(hw);
    setHwFormSessionId(hw.academicSessionId || selectedSessionId);
    setHwFormClass(hw.className && hw.section ? `${hw.className}-${hw.section}` : hw.className || hwClassFilter);
    setHwFormSubject(hw.subject || 'Mathematics');
    setHwFormTitle(hw.title || '');
    setHwFormDesc(hw.description || '');
    setHwFormAssignedDate(hw.assignedDate || new Date().toISOString().split('T')[0]);
    setHwFormDueDate(hw.dueDate || new Date().toISOString().split('T')[0]);
    setHwFormTeacher(hw.teacherName || 'Mrs. Priya Sharma');
    setHwFormAttachment(hw.attachmentUrl || '');
    setEditHwModalOpen(true);
  };

  // Handle Submit Edit
  const handleEditHomeworkSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedHwItem || !hwFormTitle) return;
    setHwSaving(true);
    try {
      const parts = hwFormClass.split('-');
      const cName = parts[0] || hwFormClass;
      const cSec = parts[1] || 'A';

      const updatedRecord = {
        ...selectedHwItem,
        academicSessionId: hwFormSessionId,
        className: cName,
        section: cSec,
        subject: hwFormSubject,
        title: hwFormTitle,
        description: hwFormDesc,
        assignedDate: hwFormAssignedDate,
        dueDate: hwFormDueDate,
        teacherName: hwFormTeacher,
        attachmentUrl: hwFormAttachment || undefined
      };

      // 1. API call
      await apiFetch(`/api/homework/${selectedHwItem.id}`, {
        method: 'PUT',
        body: JSON.stringify(updatedRecord)
      }).catch(() => null);

      // 2. Update demoDataStore
      const db = demoDataStore.getDB();
      db.homework = db.homework || [];
      const idx = db.homework.findIndex((h: any) => h.id === selectedHwItem.id);
      if (idx !== -1) {
        db.homework[idx] = updatedRecord;
      }
      demoDataStore.saveDB(db);

      setEditHwModalOpen(false);
      setSelectedHwItem(null);
      setHwSuccessMsg('Homework assignment updated successfully');
      setTimeout(() => setHwSuccessMsg(null), 3500);

      await refreshAll(selectedSessionId);
    } catch (err) {
      console.error('Edit homework error:', err);
    } finally {
      setHwSaving(false);
    }
  };

  // Open Delete Modal
  const handleOpenDeleteHwModal = (hw: any) => {
    setSelectedHwItem(hw);
    setDeleteHwModalOpen(true);
  };

  // Handle Confirm Delete
  const handleDeleteHomeworkConfirm = async () => {
    if (!selectedHwItem) return;
    setHwSaving(true);
    try {
      await apiFetch(`/api/homework/${selectedHwItem.id}`, {
        method: 'DELETE'
      }).catch(() => null);

      const db = demoDataStore.getDB();
      db.homework = (db.homework || []).filter((h: any) => h.id !== selectedHwItem.id);
      demoDataStore.saveDB(db);

      setDeleteHwModalOpen(false);
      setSelectedHwItem(null);
      setHwSuccessMsg('Homework deleted successfully');
      setTimeout(() => setHwSuccessMsg(null), 3500);

      await refreshAll(selectedSessionId);
    } catch (err) {
      console.error('Delete homework error:', err);
    } finally {
      setHwSaving(false);
    }
  };

  // --- EXAMS MODULE STATE & HANDLERS ---
  const [selectedExamId, setSelectedExamId] = useState<string | null>(null);
  const [examClassFilter, setExamClassFilter] = useState<string>('');
  const [examSchedulesList, setExamSchedulesList] = useState<any[]>([]);

  const [editScheduleModalOpen, setEditScheduleModalOpen] = useState(false);
  const [selectedScheduleItem, setSelectedScheduleItem] = useState<any>(null);

  // Form fields for Create Exam
  const [examFormSessionId, setExamFormSessionId] = useState<string>('2026-27');
  const [examFormName, setExamFormName] = useState<string>('Periodic Test 1');
  const [examFormType, setExamFormType] = useState<string>('Periodic Test 1');
  const [examFormStart, setExamFormStart] = useState<string>('2026-07-10');
  const [examFormEnd, setExamFormEnd] = useState<string>('2026-07-15');
  const [examFormDesc, setExamFormDesc] = useState<string>('First periodic assessment for the academic session.');
  const [examFormStatus, setExamFormStatus] = useState<string>('Scheduled');

  // Form fields for Edit Subject Schedule
  const [schSubject, setSchSubject] = useState<string>('Mathematics');
  const [schDate, setSchDate] = useState<string>('2026-07-10');
  const [schStartTime, setSchStartTime] = useState<string>('09:00 AM');
  const [schEndTime, setSchEndTime] = useState<string>('10:00 AM');
  const [schMaxMarks, setSchMaxMarks] = useState<number>(50);
  const [schPassMarks, setSchPassMarks] = useState<number>(17);
  const [schRoomNo, setSchRoomNo] = useState<string>('Room 5');
  const [schSaving, setSchSaving] = useState<boolean>(false);
  const [examSuccessMsg, setExamSuccessMsg] = useState<string | null>(null);

  // Dynamic Helper for subjects based on class and active academic session
  const getSubjectsForExamClass = (className: string) => {
    if (!className) return [];
    const cleanClass = className.split('-')[0].trim();
    const dynSubjects = academicService.getSubjects(cleanClass, selectedSessionId);
    if (dynSubjects && dynSubjects.length > 0) {
      return dynSubjects.map((s) => s.name);
    }
    const norm = (className || '').toLowerCase();
    if (norm.includes('nursery') || norm.includes('lkg') || norm.includes('ukg')) {
      return ['Rhymes', 'English', 'Hindi', 'Numbers', 'Drawing'];
    }
    return ['Mathematics', 'Science', 'English', 'Hindi', 'Social Science', 'Computer'];
  };

  const getSubjectsForMarksClass = (className: string) => {
    if (!className) return ['Mathematics', 'Science', 'English', 'Hindi', 'Social Science', 'Computer'];
    const cleanClass = className.split('-')[0].trim();
    const dynSubjects = academicService.getSubjects(cleanClass, selectedSessionId);
    if (dynSubjects && dynSubjects.length > 0) {
      return dynSubjects.map((s) => s.name);
    }
    const norm = (className || '').toLowerCase();
    if (norm.includes('nursery') || norm.includes('lkg') || norm.includes('ukg')) {
      return ['Rhymes', 'English', 'Hindi', 'Numbers', 'Drawing'];
    }
    return ['Mathematics', 'Science', 'English', 'Hindi', 'Social Science', 'Computer'];
  };

  // Helper for current exam object
  const currentExamObj = exams.find((e: any) => e.id === selectedExamId) ||
    (selectedExamId ? { id: selectedExamId, name: selectedExamId.includes('PT1') ? 'Periodic Test 1' : selectedExamId.includes('HY') ? 'Half-Yearly Examination' : 'Annual / Final Examination', academicSessionId: selectedSessionId, status: 'Scheduled' } : null);

  // Helper for exam schedules for current exam and selected class
  const currentClassSchedules = examSchedulesList.filter((s: any) => {
    const matchesSession = !s.academicSessionId || s.academicSessionId === selectedSessionId;
    if (!matchesSession) return false;
    const matchesExam = !selectedExamId || s.examId === selectedExamId;
    if (!matchesExam) return false;
    if (!examClassFilter) return false;

    const fullClass = (s.className || '').includes('-') ? s.className : `${s.className}-${s.section || 'A'}`;
    return (
      fullClass.toLowerCase() === examClassFilter.toLowerCase() ||
      (s.className || '').toLowerCase() === examClassFilter.toLowerCase()
    );
  });

  // Open Edit Schedule Modal for a Subject
  const handleOpenEditScheduleModal = (subj: string) => {
    const existing = currentClassSchedules.find((s: any) => s.subject.toLowerCase() === subj.toLowerCase());
    setSchSubject(subj);
    if (existing) {
      setSelectedScheduleItem(existing);
      setSchDate(existing.examDate || '2026-07-10');
      setSchStartTime(existing.startTime || '09:00 AM');
      setSchEndTime(existing.endTime || '10:00 AM');
      setSchMaxMarks(Number(existing.maximumMarks || 50));
      setSchPassMarks(Number(existing.passingMarks || 17));
      setSchRoomNo(existing.roomNo || 'Room 5');
    } else {
      setSelectedScheduleItem(null);
      setSchDate('2026-07-10');
      setSchStartTime('09:00 AM');
      setSchEndTime('10:00 AM');
      setSchMaxMarks(50);
      setSchPassMarks(17);
      setSchRoomNo('Room 5');
    }
    setEditScheduleModalOpen(true);
  };

  // Save Subject Schedule
  const handleSaveSubjectSchedule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedExamId || !examClassFilter || !schSubject) return;
    setSchSaving(true);
    try {
      const parts = examClassFilter.split('-');
      const cName = parts[0] || examClassFilter;
      const cSec = parts[1] || 'A';

      const scheduleObj = {
        id: selectedScheduleItem?.id || `SCH-${Date.now().toString().slice(-6)}`,
        examId: selectedExamId,
        academicSessionId: selectedSessionId,
        className: cName,
        section: cSec,
        subject: schSubject,
        examDate: schDate,
        startTime: schStartTime,
        endTime: schEndTime,
        maximumMarks: Number(schMaxMarks),
        passingMarks: Number(schPassMarks),
        roomNo: schRoomNo
      };

      // 1. Post to API / Standalone Demo Engine
      await apiFetch('/api/exam-schedules', {
        method: 'POST',
        body: JSON.stringify(scheduleObj)
      }).catch(() => null);

      // 2. Persist in demoDataStore
      const db = demoDataStore.getDB();
      db.examSchedules = db.examSchedules || [];
      const idx = db.examSchedules.findIndex((s: any) => s.id === scheduleObj.id || (s.examId === scheduleObj.examId && s.className === scheduleObj.className && s.subject === scheduleObj.subject));
      if (idx !== -1) {
        db.examSchedules[idx] = scheduleObj;
      } else {
        db.examSchedules.push(scheduleObj);
      }
      demoDataStore.saveDB(db);

      setEditScheduleModalOpen(false);
      setExamSuccessMsg(`Schedule updated for ${schSubject}`);
      setTimeout(() => setExamSuccessMsg(null), 3500);

      await refreshAll(selectedSessionId);
    } catch (err) {
      console.error('Save schedule error:', err);
    } finally {
      setSchSaving(false);
    }
  };

  // Submit Create Exam Modal
  const handleCreateExamSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!examFormName) return;
    setSchSaving(true);
    try {
      const newExamObj = {
        id: `EX-${Date.now().toString().slice(-6)}`,
        academicSessionId: selectedSessionId,
        name: examFormName,
        type: examFormType,
        startDate: examFormStart,
        endDate: examFormEnd,
        description: examFormDesc,
        status: examFormStatus,
        classesCount: 11,
        subjectsCount: 8
      };

      await apiFetch('/api/exams', {
        method: 'POST',
        body: JSON.stringify(newExamObj)
      }).catch(() => null);

      const db = demoDataStore.getDB();
      db.exams = db.exams || [];
      db.exams.push(newExamObj);
      demoDataStore.saveDB(db);

      setCreateExamModalOpen(false);
      setExamSuccessMsg(`Examination "${examFormName}" created successfully`);
      setTimeout(() => setExamSuccessMsg(null), 3500);

      await refreshAll(selectedSessionId);
    } catch (err) {
      console.error('Create exam error:', err);
    } finally {
      setSchSaving(false);
    }
  };

  // --- MARKS MODULE STATE & HANDLERS ---
  const [marksClassFilter, setMarksClassFilter] = useState<string>('');
  const [marksExamFilter, setMarksExamFilter] = useState<string>('Half Yearly Examination');
  const [marksSubjectFilter, setMarksSubjectFilter] = useState<string>('Mathematics');
  const [marksStudentSearch, setMarksStudentSearch] = useState<string>('');
  const [marksInputsMap, setMarksInputsMap] = useState<Record<string, number>>({});
  const [marksMaxMarksMap, setMarksMaxMarksMap] = useState<Record<string, number>>({});
  const [marksSaving, setMarksSaving] = useState<boolean>(false);
  const [marksSuccessMsg, setMarksSuccessMsg] = useState<string | null>(null);

  // --- CLASSES & SECTIONS MODULE STATE & HANDLERS ---
  const [clsSearchQuery, setClsSearchQuery] = useState<string>('');
  const [clsGradeFilter, setClsGradeFilter] = useState<string>('All');

  // Modals state for Classes
  const [viewingClassRecord, setViewingClassRecord] = useState<SchoolClassRecord | null>(null);
  const [managingSectionsClass, setManagingSectionsClass] = useState<SchoolClassRecord | null>(null);
  const [editingClassRecord, setEditingClassRecord] = useState<SchoolClassRecord | null>(null);
  const [isAddingClass, setIsAddingClass] = useState<boolean>(false);
  const [editingSectionInfo, setEditingSectionInfo] = useState<{ targetClass: SchoolClassRecord; section: SchoolSectionInfo } | null>(null);
  const [isAddingSectionToClass, setIsAddingSectionToClass] = useState<SchoolClassRecord | null>(null);
  const [deactivatingClassRecord, setDeactivatingClassRecord] = useState<SchoolClassRecord | null>(null);
  const [deletingClassRecord, setDeletingClassRecord] = useState<SchoolClassRecord | null>(null);
  const [clsErrorMsg, setClsErrorMsg] = useState<string | null>(null);
  const [clsToastMsg, setClsToastMsg] = useState<string | null>(null);

  // --- SUBJECT MANAGEMENT STATE & HANDLERS ---
  const [managingSubjectsClassRecord, setManagingSubjectsClassRecord] = useState<SchoolClassRecord | null>(null);
  const [addSubjectModalOpen, setAddSubjectModalOpen] = useState<boolean>(false);
  const [editingSubjectRecord, setEditingSubjectRecord] = useState<SchoolSubjectRecord | null>(null);
  const [deletingSubjectRecord, setDeletingSubjectRecord] = useState<SchoolSubjectRecord | null>(null);

  const [subFormName, setSubFormName] = useState<string>('');
  const [subFormCode, setSubFormCode] = useState<string>('');
  const [subFormMaxMarks, setSubFormMaxMarks] = useState<number>(100);
  const [subFormPassMarks, setSubFormPassMarks] = useState<number>(33);
  const [subFormTeacherId, setSubFormTeacherId] = useState<string>('');
  const [subFormTeacherName, setSubFormTeacherName] = useState<string>('');
  const [subFormType, setSubFormType] = useState<'Theory' | 'Practical' | 'Activity' | 'Language' | 'Academic'>('Theory');

  const resetSubjectForm = () => {
    setSubFormName('');
    setSubFormCode('');
    setSubFormMaxMarks(100);
    setSubFormPassMarks(33);
    setSubFormTeacherId(employees[0]?.id || '');
    setSubFormTeacherName(employees[0]?.name || '');
    setSubFormType('Theory');
  };

  const openAddSubjectModal = () => {
    setEditingSubjectRecord(null);
    resetSubjectForm();
    setAddSubjectModalOpen(true);
  };

  const openEditSubjectModal = (sub: SchoolSubjectRecord) => {
    setEditingSubjectRecord(sub);
    setSubFormName(sub.name);
    setSubFormCode(sub.code);
    setSubFormMaxMarks(sub.maxMarks || 100);
    setSubFormPassMarks(sub.passingMarks || 33);
    setSubFormTeacherId(sub.teacherId || '');
    setSubFormTeacherName(sub.teacherName || '');
    setSubFormType((sub.type as any) || 'Theory');
    setAddSubjectModalOpen(true);
  };

  const handleSaveSubject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!managingSubjectsClassRecord || !subFormName.trim()) {
      alert('Subject Name is required');
      return;
    }

    const cleanClass = managingSubjectsClassRecord.name.trim().split('-')[0].trim();
    if (editingSubjectRecord) {
      academicService.updateSubject(editingSubjectRecord.id, {
        name: subFormName.trim(),
        code: subFormCode.trim() || `${subFormName.slice(0, 3).toUpperCase()}101`,
        maxMarks: Number(subFormMaxMarks) || 100,
        passingMarks: Number(subFormPassMarks) || 33,
        teacherId: subFormTeacherId,
        teacherName: subFormTeacherName,
        type: subFormType
      });
    } else {
      academicService.addSubject({
        academicSessionId: selectedSessionId,
        className: cleanClass,
        name: subFormName.trim(),
        code: subFormCode.trim() || `${subFormName.slice(0, 3).toUpperCase()}101`,
        maxMarks: Number(subFormMaxMarks) || 100,
        passingMarks: Number(subFormPassMarks) || 33,
        teacherId: subFormTeacherId,
        teacherName: subFormTeacherName,
        type: subFormType
      });
    }

    setAddSubjectModalOpen(false);
    setEditingSubjectRecord(null);
    resetSubjectForm();
    refreshAll(selectedSessionId);
  };

  const handleDeleteSubjectRequest = (sub: SchoolSubjectRecord) => {
    const usage = academicService.checkSubjectUsage(sub.id);
    if (usage.count > 0) {
      setDeletingSubjectRecord(sub);
    } else {
      if (window.confirm(`Are you sure you want to delete ${sub.name} from ${sub.className}?`)) {
        academicService.deleteSubject(sub.id);
        refreshAll(selectedSessionId);
      }
    }
  };

  const handleConfirmDeleteUsedSubject = () => {
    if (deletingSubjectRecord) {
      academicService.deleteSubject(deletingSubjectRecord.id);
      setDeletingSubjectRecord(null);
      refreshAll(selectedSessionId);
    }
  };

  // --- ADMIT CARDS MODULE STATE & HANDLERS ---
  const [adcExamFilter, setAdcExamFilter] = useState<string>('First Term Examination');
  const [adcClassFilter, setAdcClassFilter] = useState<string>('All');
  const [adcSectionFilter, setAdcSectionFilter] = useState<string>('All');
  const [adcStatusFilter, setAdcStatusFilter] = useState<string>('All');
  const [adcSearchQuery, setAdcSearchQuery] = useState<string>('');
  const [selectedAdcStudentIds, setSelectedAdcStudentIds] = useState<string[]>([]);

  // Modals state for Admit Cards
  const [isGeneratingAdmitCards, setIsGeneratingAdmitCards] = useState<boolean>(false);
  const [editingAdmitCardRecord, setEditingAdmitCardRecord] = useState<SchoolAdmitCardRecord | null>(null);
  const [previewAdmitCardRecord, setPreviewAdmitCardRecord] = useState<SchoolAdmitCardRecord | null>(null);
  const [bulkPrintAdmitCardsList, setBulkPrintAdmitCardsList] = useState<SchoolAdmitCardRecord[] | null>(null);
  const [adcToastMsg, setAdcToastMsg] = useState<string | null>(null);

  // Form inputs for Generate Admit Cards Modal
  const [genAdcExamName, setGenAdcExamName] = useState<string>('First Term Examination');
  const [genAdcClassName, setGenAdcClassName] = useState<string>('Class 5');
  const [genAdcSectionName, setGenAdcSectionName] = useState<string>('A');
  const [genAdcCentre, setGenAdcCentre] = useState<string>('Adarsh Vidya Mandir, Kajraili, Bhagalpur');
  const [genAdcTime, setGenAdcTime] = useState<string>('08:30 AM');
  const [genAdcInstructions, setGenAdcInstructions] = useState<string>(
    '1. Bring original admit card every exam day.\n2. Reach reporting room by 08:30 AM.\n3. Electronic gadgets strictly prohibited.'
  );
  const [genSelectedStudentIds, setGenSelectedStudentIds] = useState<string[]>([]);

  const showAdcToast = (msg: string) => {
    setAdcToastMsg(msg);
    setTimeout(() => setAdcToastMsg(null), 3500);
  };

  const getAdmitCardRecordsList = (): SchoolAdmitCardRecord[] => {
    const db = demoDataStore.getDB();
    return db.admitCards || [];
  };

  const handleBulkGenerateAdmitCards = () => {
    let targetStudents = students.filter((stu) => {
      const sCls = (stu.className || '').trim();
      const cName = sCls.includes('-') ? sCls.split('-')[0] : sCls;
      const sSec = stu.section || (sCls.includes('-') ? sCls.split('-')[1] : 'A');

      if (genAdcClassName !== 'All' && cName.toLowerCase() !== genAdcClassName.toLowerCase()) return false;
      if (genAdcSectionName !== 'All' && sSec.toLowerCase() !== genAdcSectionName.toLowerCase()) return false;
      return true;
    });

    if (genSelectedStudentIds.length > 0) {
      targetStudents = targetStudents.filter(s => genSelectedStudentIds.includes(s.id));
    }

    if (targetStudents.length === 0) {
      alert('No matching students selected for Admit Card Generation.');
      return;
    }

    const res = admitCardService.bulkGenerateAdmitCards({
      students: targetStudents,
      examName: genAdcExamName,
      academicSessionId: selectedSessionId,
      examCentre: genAdcCentre,
      reportingTime: genAdcTime,
      instructions: genAdcInstructions
    });

    setIsGeneratingAdmitCards(false);
    showAdcToast(`Admit cards generated successfully for ${res.count} students.`);
    refreshAll(selectedSessionId);
  };

  const handleTogglePublishAdmitCard = (record: SchoolAdmitCardRecord) => {
    const newStatus = record.status === 'Published' ? 'Generated' : 'Published';
    admitCardService.saveAdmitCard({ ...record, status: newStatus });
    showAdcToast(`Admit card for ${record.studentName} is now ${newStatus}.`);
    refreshAll(selectedSessionId);
  };

  const handleSaveEditAdmitCard = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingAdmitCardRecord) return;
    admitCardService.saveAdmitCard(editingAdmitCardRecord);
    setEditingAdmitCardRecord(null);
    showAdcToast(`Admit card for ${editingAdmitCardRecord.studentName} updated successfully.`);
    refreshAll(selectedSessionId);
  };

  const showClsToast = (msg: string) => {
    setClsToastMsg(msg);
    setTimeout(() => setClsToastMsg(null), 3500);
  };

  const getSchoolClassesList = (): SchoolClassRecord[] => {
    const db = demoDataStore.getDB();
    if (db && Array.isArray(db.schoolClasses) && db.schoolClasses.length > 0) {
      return db.schoolClasses;
    }
    return INITIAL_SEED_SCHOOL_CLASSES;
  };

  const getStudentsForClass = (clsName: string): Student[] => {
    const cleanCls = clsName.trim().toLowerCase();
    return students.filter((s) => {
      const sCls = (s.className || '').trim().toLowerCase();
      if (sCls === cleanCls) return true;
      if (sCls.startsWith(`${cleanCls}-`) || sCls.startsWith(`${cleanCls} `)) return true;
      const matchedGrade = classService.getClassByName(sCls);
      return matchedGrade && matchedGrade.grade.toLowerCase() === cleanCls;
    });
  };

  const getStudentsForSection = (clsName: string, secName: string): Student[] => {
    const targetTag = `${clsName}-${secName}`.trim().toLowerCase();
    const cleanCls = clsName.trim().toLowerCase();
    const cleanSec = secName.trim().toLowerCase();

    return students.filter((s) => {
      const sCls = (s.className || '').trim().toLowerCase();
      const sSec = (s.section || '').trim().toLowerCase();

      if (sCls === targetTag) return true;
      if (sCls === cleanCls && (sSec === cleanSec || (!sSec && cleanSec === 'a'))) return true;
      if (sCls.startsWith(cleanCls) && (sCls.endsWith(`-${cleanSec}`) || sSec === cleanSec)) return true;
      return false;
    });
  };

  const handleSaveCreateClass = (data: {
    name: string;
    academicSession: string;
    classTeacherName: string;
    status: 'Active' | 'Inactive';
    capacity: number;
    sectionNames: string[];
  }) => {
    setClsErrorMsg(null);
    const cleanName = data.name.trim();
    if (!cleanName) return;

    const db = demoDataStore.getDB();
    db.schoolClasses = db.schoolClasses || [...INITIAL_SEED_SCHOOL_CLASSES];

    const teacherObj = employees.find((e) => e.name === data.classTeacherName || e.id === data.classTeacherName);
    const sectionsArr: SchoolSectionInfo[] = (data.sectionNames.length > 0 ? data.sectionNames : ['A']).map((sec, idx) => ({
      id: `${cleanName.toLowerCase().replace(/\s+/g, '-')}-${sec.toLowerCase()}`,
      name: sec,
      section: sec,
      teacherId: teacherObj ? teacherObj.id : '',
      teacherName: teacherObj ? teacherObj.name : 'Unassigned',
      classTeacherName: teacherObj ? teacherObj.name : 'Unassigned',
      roomNo: `Room ${10 + idx}`,
      roomNumber: `Room ${10 + idx}`,
      capacity: Number(data.capacity || 30),
      status: 'Active'
    }));

    const newClassRec: SchoolClassRecord = {
      id: `class-${Date.now()}`,
      name: cleanName,
      grade: cleanName,
      academicSessionId: data.academicSession || selectedSessionId,
      classTeacherId: teacherObj ? teacherObj.id : '',
      classTeacherName: teacherObj ? teacherObj.name : 'Unassigned',
      capacity: data.capacity || 30,
      status: data.status || 'Active',
      sections: sectionsArr
    };

    db.schoolClasses.push(newClassRec);
    demoDataStore.saveDB(db);
    setIsAddingClass(false);
    showClsToast(`Class "${cleanName}" created successfully.`);
  };

  const handleSaveEditClass = (data: {
    id: string;
    name: string;
    academicSession: string;
    classTeacherName: string;
    status: 'Active' | 'Inactive';
    capacity: number;
    sectionNames: string[];
  }) => {
    setClsErrorMsg(null);
    const cleanName = data.name.trim();
    if (!cleanName) return;

    const db = demoDataStore.getDB();
    db.schoolClasses = db.schoolClasses || [...INITIAL_SEED_SCHOOL_CLASSES];

    const idx = db.schoolClasses.findIndex((c) => c.id === data.id || c.name === data.name);
    if (idx !== -1) {
      const targetClassRecord = db.schoolClasses[idx];
      const teacherObj = employees.find((e) => e.name === data.classTeacherName || e.id === data.classTeacherName);

      const updatedSections: SchoolSectionInfo[] = data.sectionNames.map((sec, i) => {
        const existingSec = targetClassRecord.sections.find((s) => (s.section || s.name) === sec);
        if (existingSec) {
          return {
            ...existingSec,
            classTeacherName: teacherObj ? teacherObj.name : existingSec.classTeacherName,
            status: data.status === 'Inactive' ? 'Inactive' : existingSec.status
          };
        }
        return {
          id: `${cleanName.toLowerCase().replace(/\s+/g, '-')}-${sec.toLowerCase()}`,
          name: sec,
          section: sec,
          teacherId: teacherObj ? teacherObj.id : '',
          teacherName: teacherObj ? teacherObj.name : 'Unassigned',
          classTeacherName: teacherObj ? teacherObj.name : 'Unassigned',
          roomNo: `Room ${15 + i}`,
          roomNumber: `Room ${15 + i}`,
          capacity: Number(data.capacity || 30),
          status: 'Active'
        };
      });

      db.schoolClasses[idx] = {
        ...targetClassRecord,
        name: cleanName,
        grade: cleanName,
        classTeacherId: teacherObj ? teacherObj.id : targetClassRecord.classTeacherId,
        classTeacherName: teacherObj ? teacherObj.name : targetClassRecord.classTeacherName,
        capacity: data.capacity || 30,
        status: data.status || 'Active',
        sections: updatedSections
      };

      demoDataStore.saveDB(db);
      setEditingClassRecord(null);
      showClsToast(`Class "${cleanName}" updated successfully.`);
    }
  };

  const handleSaveAddSection = (
    targetClass: SchoolClassRecord,
    secData: { name: string; classTeacherName: string; roomNumber: string; capacity: number; status: 'Active' | 'Inactive' }
  ) => {
    setClsErrorMsg(null);
    const secTag = secData.name.trim().toUpperCase();
    if (!secTag) return;

    const db = demoDataStore.getDB();
    db.schoolClasses = db.schoolClasses || [...INITIAL_SEED_SCHOOL_CLASSES];

    const idx = db.schoolClasses.findIndex((c) => c.id === targetClass.id || c.name === targetClass.name);
    if (idx !== -1) {
      const existingSec = db.schoolClasses[idx].sections.find((s) => (s.section || s.name).toUpperCase() === secTag);
      if (existingSec) {
        showClsToast(`Section "${secTag}" already exists in ${targetClass.name}.`);
        return;
      }

      const teacherObj = employees.find((e) => e.name === secData.classTeacherName || e.id === secData.classTeacherName);

      const newSecObj: SchoolSectionInfo = {
        id: `${targetClass.name.toLowerCase().replace(/\s+/g, '-')}-${secTag.toLowerCase()}`,
        name: secTag,
        section: secTag,
        teacherId: teacherObj ? teacherObj.id : '',
        teacherName: teacherObj ? teacherObj.name : 'Unassigned',
        classTeacherName: teacherObj ? teacherObj.name : 'Unassigned',
        roomNo: secData.roomNumber || `Room ${20 + db.schoolClasses[idx].sections.length}`,
        roomNumber: secData.roomNumber || `Room ${20 + db.schoolClasses[idx].sections.length}`,
        capacity: Number(secData.capacity || 30),
        status: secData.status || 'Active'
      };

      db.schoolClasses[idx].sections.push(newSecObj);
      demoDataStore.saveDB(db);

      setManagingSectionsClass({ ...db.schoolClasses[idx] });
      setIsAddingSectionToClass(null);
      showClsToast(`Section ${secTag} added to ${targetClass.name}.`);
    }
  };

  const handleSaveEditSection = (
    targetClass: SchoolClassRecord,
    oldSectionName: string,
    secData: { name: string; classTeacherName: string; roomNumber: string; capacity: number; status: 'Active' | 'Inactive' }
  ) => {
    setClsErrorMsg(null);
    const secTag = secData.name.trim().toUpperCase();
    if (!secTag) return;

    const db = demoDataStore.getDB();
    db.schoolClasses = db.schoolClasses || [...INITIAL_SEED_SCHOOL_CLASSES];

    const classIdx = db.schoolClasses.findIndex((c) => c.id === targetClass.id || c.name === targetClass.name);
    if (classIdx !== -1) {
      const secIdx = db.schoolClasses[classIdx].sections.findIndex(
        (s) => (s.section || s.name).toUpperCase() === oldSectionName.toUpperCase() || s.name.toUpperCase() === secTag
      );
      if (secIdx !== -1) {
        const teacherObj = employees.find((e) => e.name === secData.classTeacherName || e.id === secData.classTeacherName);

        db.schoolClasses[classIdx].sections[secIdx] = {
          ...db.schoolClasses[classIdx].sections[secIdx],
          name: secTag,
          section: secTag,
          teacherId: teacherObj ? teacherObj.id : '',
          teacherName: teacherObj ? teacherObj.name : 'Unassigned',
          classTeacherName: teacherObj ? teacherObj.name : 'Unassigned',
          roomNo: secData.roomNumber,
          roomNumber: secData.roomNumber,
          capacity: Number(secData.capacity || 30),
          status: secData.status
        };

        demoDataStore.saveDB(db);
        setManagingSectionsClass({ ...db.schoolClasses[classIdx] });
        setEditingSectionInfo(null);
        showClsToast(`Section ${secTag} updated successfully.`);
      }
    }
  };

  const handleDeactivateClass = (classRecord: SchoolClassRecord) => {
    const db = demoDataStore.getDB();
    db.schoolClasses = db.schoolClasses || [...INITIAL_SEED_SCHOOL_CLASSES];
    const idx = db.schoolClasses.findIndex((c) => c.id === classRecord.id);
    if (idx !== -1) {
      db.schoolClasses[idx].status = 'Inactive';
      db.schoolClasses[idx].sections.forEach((sec) => sec.status = 'Inactive');
      demoDataStore.saveDB(db);
      setDeactivatingClassRecord(null);
      showClsToast(`Class "${classRecord.name}" has been deactivated.`);
    }
  };

  const handleDeleteClass = (classRecord: SchoolClassRecord) => {
    const db = demoDataStore.getDB();
    db.schoolClasses = db.schoolClasses || [...INITIAL_SEED_SCHOOL_CLASSES];
    db.schoolClasses = db.schoolClasses.filter((c) => c.id !== classRecord.id);
    demoDataStore.saveDB(db);
    setDeletingClassRecord(null);
    showClsToast(`Class "${classRecord.name}" removed successfully.`);
  };

  // --- RESULTS MODULE STATE & HANDLERS ---
  const [resClassFilter, setResClassFilter] = useState<string>('');
  const [resExamFilter, setResExamFilter] = useState<string>('Half Yearly Examination');
  const [viewResultStudent, setViewResultStudent] = useState<Student | null>(null);

  // Result Editing State
  const [editResultStudent, setEditResultStudent] = useState<Student | null>(null);
  const [editSubjectItems, setEditSubjectItems] = useState<{ id: string; subject: string; marksObtained: number | string; maxMarks: number | string }[]>([]);
  const [deleteConfirmSubjectIndex, setDeleteConfirmSubjectIndex] = useState<number | null>(null);
  const [editResultError, setEditResultError] = useState<string | null>(null);
  const [resultSaveToast, setResultSaveToast] = useState<string | null>(null);

  const startEditingStudentResult = (stu: Student) => {
    const targetExam = resExamFilter || 'Half Yearly Examination';
    const resObj = calculateStudentResult(stu, targetExam);

    const initialItems = resObj.marks && resObj.marks.length > 0
      ? resObj.marks.map((m: any, i: number) => ({
        id: `subj-${Date.now()}-${i}`,
        subject: m.subject,
        marksObtained: m.marksObtained,
        maxMarks: m.maxMarks || 100
      }))
      : [
        { id: `subj-${Date.now()}-1`, subject: 'Mathematics', marksObtained: 85, maxMarks: 100 },
        { id: `subj-${Date.now()}-2`, subject: 'Science', marksObtained: 88, maxMarks: 100 },
        { id: `subj-${Date.now()}-3`, subject: 'English', marksObtained: 82, maxMarks: 100 },
        { id: `subj-${Date.now()}-4`, subject: 'Hindi', marksObtained: 78, maxMarks: 100 },
        { id: `subj-${Date.now()}-5`, subject: 'Computer', marksObtained: 90, maxMarks: 100 }
      ];

    setEditSubjectItems(initialItems);
    setEditResultError(null);
    setEditResultStudent(stu);
    setViewResultStudent(null);
  };

  const handleUpdateEditSubject = (index: number, field: 'subject' | 'marksObtained' | 'maxMarks', value: any) => {
    setEditResultError(null);
    setEditSubjectItems((prev) => {
      const copy = [...prev];
      copy[index] = {
        ...copy[index],
        [field]: value
      };
      return copy;
    });
  };

  const handleAddEditSubject = () => {
    setEditResultError(null);
    setEditSubjectItems((prev) => [
      ...prev,
      { id: `subj-${Date.now()}-${prev.length}`, subject: '', marksObtained: 0, maxMarks: 100 }
    ]);
  };

  const handleSaveStudentResult = async () => {
    if (!editResultStudent) return;
    const targetExam = resExamFilter || 'Half Yearly Examination';

    if (editSubjectItems.length === 0) {
      setEditResultError('Result must contain at least one subject.');
      return;
    }

    const seenSubjects = new Set<string>();
    for (let i = 0; i < editSubjectItems.length; i++) {
      const item = editSubjectItems[i];
      const trimmedName = item.subject.trim();
      if (!trimmedName) {
        setEditResultError(`Subject #${i + 1} name cannot be empty.`);
        return;
      }
      if (seenSubjects.has(trimmedName.toLowerCase())) {
        setEditResultError(`Duplicate subject name "${trimmedName}" found. Each subject must be unique.`);
        return;
      }
      seenSubjects.add(trimmedName.toLowerCase());

      const obtained = Number(item.marksObtained);
      const max = Number(item.maxMarks);

      if (isNaN(obtained) || obtained < 0) {
        setEditResultError(`Marks obtained for "${trimmedName}" cannot be negative.`);
        return;
      }
      if (isNaN(max) || max <= 0) {
        setEditResultError(`Maximum marks for "${trimmedName}" must be greater than 0.`);
        return;
      }
      if (obtained > max) {
        setEditResultError(`Marks obtained (${obtained}) cannot be greater than Maximum Marks (${max}) for "${trimmedName}".`);
        return;
      }
    }

    const db = demoDataStore.getDB();
    db.marks = db.marks || [];

    db.marks = db.marks.filter(
      (m: any) =>
        !(
          m.studentId === editResultStudent.id &&
          (m.examId === targetExam || m.examName === targetExam) &&
          (!m.academicSessionId || m.academicSessionId === selectedSessionId)
        )
    );

    const newMarks = editSubjectItems.map((item) => {
      const obtained = Number(item.marksObtained);
      const max = Number(item.maxMarks);
      const pct = max > 0 ? Math.round((obtained / max) * 100 * 10) / 10 : 0;
      const grade = calculateGradeFromMarks(obtained, max);

      return {
        id: `MARK-${selectedSessionId}-${targetExam}-${editResultStudent.id}-${item.subject.trim()}`,
        studentId: editResultStudent.id,
        academicSessionId: selectedSessionId,
        examId: targetExam,
        examName: targetExam,
        className: editResultStudent.className,
        section: editResultStudent.section || 'A',
        subject: item.subject.trim(),
        marksObtained: obtained,
        maxMarks: max,
        percentage: pct,
        grade: grade,
        updatedAt: new Date().toISOString()
      };
    });

    db.marks.push(...newMarks);

    db.activityLog = db.activityLog || [];
    db.activityLog.unshift({
      id: `ACT-${Date.now()}`,
      title: 'Student Result Updated',
      subtitle: `${editResultStudent.name} (${editResultStudent.className}) - ${targetExam}`,
      time: 'Just now',
      type: 'marks'
    });

    demoDataStore.saveDB(db);
    setMarksList([...db.marks]);

    try {
      await apiFetch('/api/marks', {
        method: 'POST',
        body: JSON.stringify({
          marksData: newMarks,
          className: editResultStudent.className,
          section: editResultStudent.section || 'A',
          examId: targetExam,
          academicSessionId: selectedSessionId
        })
      });
    } catch (err) {
      console.warn('API sync warning:', err);
    }

    const currentStu = editResultStudent;
    setEditResultStudent(null);
    setViewResultStudent(currentStu);

    setResultSaveToast('Result updated successfully.');
    setTimeout(() => setResultSaveToast(null), 4000);
  };

  // Helper: Build dynamic StudentResult for a student and exam from real marksList
  const calculateStudentResult = (stu: Student, examNameTarget: string): StudentResult => {
    const isEarly = (stu.className || '').toLowerCase().includes('nursery') || (stu.className || '').toLowerCase().includes('lkg') || (stu.className || '').toLowerCase().includes('ukg');

    // Filter marks for this student, target exam, and selected session
    const stuMarks = marksList.filter(
      (m: any) =>
        m.studentId === stu.id &&
        (m.examId === examNameTarget || m.examName === examNameTarget) &&
        (!m.academicSessionId || m.academicSessionId === selectedSessionId)
    );

    const markItems = stuMarks.map((m: any) => {
      const obtained = Number(m.marksObtained !== undefined ? m.marksObtained : m.marks || 0);
      const max = Number(m.maxMarks || m.maximumMarks || 100);
      const grade = m.grade || calculateGradeFromMarks(obtained, max);
      return {
        subject: m.subject,
        marksObtained: obtained,
        maxMarks: max,
        grade: grade
      };
    });

    // Fallback if no marks entered yet
    const fallbackItems = markItems.length > 0 ? markItems : [
      { subject: 'Mathematics', marksObtained: 85, maxMarks: 100, grade: 'A' },
      { subject: 'Science', marksObtained: 88, maxMarks: 100, grade: 'A' },
      { subject: 'English', marksObtained: 82, maxMarks: 100, grade: 'A' },
      { subject: 'Hindi', marksObtained: 78, maxMarks: 100, grade: 'B+' },
      { subject: 'Computer', marksObtained: 90, maxMarks: 100, grade: 'A+' }
    ];

    const activeItems = markItems.length > 0 ? markItems : (isEarly ? [] : fallbackItems);
    const totalObtained = activeItems.reduce((sum, item) => sum + item.marksObtained, 0);
    const totalMax = activeItems.reduce((sum, item) => sum + item.maxMarks, 0);
    const percentage = totalMax > 0 ? Math.round((totalObtained / totalMax) * 100 * 10) / 10 : 0;
    const overallGrade = calculateGradeFromMarks(totalObtained, totalMax);
    const isPass = isEarly ? true : activeItems.every((item) => (item.maxMarks > 0 ? (item.marksObtained / item.maxMarks) >= 0.4 : true));

    const skillsEvaluation = isEarly ? [
      { category: 'Language & Oral Rhymes', rating: 'Excellent' as any, remark: 'Speaks clearly and recites rhymes fluently.' },
      { category: 'Number Work & Counting', rating: 'Good' as any, remark: 'Recognizes numbers 1 to 50 easily.' },
      { category: 'General Awareness & EVS', rating: 'Excellent' as any, remark: 'Identifies colors, shapes, and animals.' },
      { category: 'Drawing & Motor Activity', rating: 'Good' as any, remark: 'Enjoys coloring and handcraft activities.' }
    ] : undefined;

    return {
      id: `RES-${stu.id}-${selectedSessionId}-${examNameTarget}`,
      studentId: stu.id,
      examId: examNameTarget,
      examName: examNameTarget,
      className: stu.className,
      section: stu.section || 'A',
      isEarlyYears: isEarly,
      marks: activeItems,
      totalObtained: totalObtained,
      totalMax: totalMax,
      percentage: percentage,
      grade: overallGrade,
      skillsEvaluation: skillsEvaluation,
      teacherRemarks: isPass ? 'Excellent overall performance. Keep up the hard work!' : 'Needs improvement in core subjects.',
      issueDate: new Date().toISOString().split('T')[0]
    };
  };

  // Individual Student Marks Detail & Edit Modals
  const [viewStudentMarks, setViewStudentMarks] = useState<Student | null>(null);
  const [editSingleMarkModalOpen, setEditSingleMarkModalOpen] = useState(false);
  const [singleMarkStudent, setSingleMarkStudent] = useState<Student | null>(null);
  const [singleMarkExam, setSingleMarkExam] = useState<string>('Half Yearly Examination');
  const [singleMarkSubject, setSingleMarkSubject] = useState<string>('Mathematics');
  const [singleMarkVal, setSingleMarkVal] = useState<number>(85);
  const [singleMarkMaxVal, setSingleMarkMaxVal] = useState<number>(100);

  // Helper: Calculate Grade from Marks
  const calculateGradeFromMarks = (obtained: number, max: number): string => {
    if (!max || max <= 0) return 'F';
    const pct = (obtained / max) * 100;
    if (pct >= 90) return 'A+';
    if (pct >= 80) return 'A';
    if (pct >= 70) return 'B+';
    if (pct >= 60) return 'B';
    if (pct >= 50) return 'C';
    if (pct >= 40) return 'D';
    return 'F';
  };



  // Synchronize inputs map whenever class, exam, subject, session or marksList changes
  useEffect(() => {
    if (!marksClassFilter || !marksSubjectFilter || !marksExamFilter) {
      setMarksInputsMap({});
      return;
    }

    const classStus = students.filter((s) => {
      const matchesSession = !s.academicSessionId || s.academicSessionId === selectedSessionId;
      if (!matchesSession) return false;
      const fullClass = (s.className || '').includes('-') ? s.className : `${s.className}-${s.section || 'A'}`;
      return (
        fullClass.toLowerCase() === marksClassFilter.toLowerCase() ||
        (s.className || '').toLowerCase() === marksClassFilter.toLowerCase()
      );
    });

    const initialInputs: Record<string, number> = {};
    const initialMaxMap: Record<string, number> = {};

    classStus.forEach((s) => {
      const existing = marksList.find(
        (m: any) =>
          m.studentId === s.id &&
          (m.subject || '').toLowerCase() === marksSubjectFilter.toLowerCase() &&
          (m.examId === marksExamFilter || m.examName === marksExamFilter) &&
          (!m.academicSessionId || m.academicSessionId === selectedSessionId)
      );
      initialInputs[s.id] = existing ? (existing.marksObtained !== undefined ? Number(existing.marksObtained) : Number(existing.marks || 0)) : 80;
      initialMaxMap[s.id] = existing ? Number(existing.maxMarks || existing.maximumMarks || 100) : 100;
    });

    setMarksInputsMap(initialInputs);
    setMarksMaxMarksMap(initialMaxMap);
  }, [marksClassFilter, marksExamFilter, marksSubjectFilter, selectedSessionId, marksList, students]);

  // Handle Save Batch Marks
  const handleSaveBatchMarks = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!marksClassFilter || !marksExamFilter || !marksSubjectFilter) return;

    const classStus = students.filter((s) => {
      const matchesSession = !s.academicSessionId || s.academicSessionId === selectedSessionId;
      if (!matchesSession) return false;
      const fullClass = (s.className || '').includes('-') ? s.className : `${s.className}-${s.section || 'A'}`;
      return (
        fullClass.toLowerCase() === marksClassFilter.toLowerCase() ||
        (s.className || '').toLowerCase() === marksClassFilter.toLowerCase()
      );
    });

    if (classStus.length === 0) return;

    setMarksSaving(true);
    try {
      const parts = marksClassFilter.split('-');
      const cName = parts[0] || marksClassFilter;
      const cSec = parts[1] || 'A';

      const recordsToSave = classStus.map((s) => {
        const max = Number(marksMaxMarksMap[s.id] || 100);
        const rawObtained = Number(marksInputsMap[s.id] !== undefined ? marksInputsMap[s.id] : 80);
        const obtained = Math.max(0, Math.min(max, rawObtained));
        const pct = max > 0 ? Math.round((obtained / max) * 100 * 10) / 10 : 0;
        const grade = calculateGradeFromMarks(obtained, max);

        return {
          id: `MRK-${selectedSessionId}-${marksExamFilter}-${s.id}-${marksSubjectFilter}`,
          academicSessionId: selectedSessionId,
          examId: marksExamFilter,
          examName: marksExamFilter,
          studentId: s.id,
          studentName: s.name,
          rollNo: s.rollNo,
          admissionNo: s.admissionNo,
          className: s.className || cName,
          section: s.section || cSec,
          subject: marksSubjectFilter,
          marksObtained: obtained,
          marks: obtained,
          maxMarks: max,
          maximumMarks: max,
          percentage: pct,
          grade: grade,
          evaluatorId: 'EMP-ADMIN',
          evaluatorName: 'Admin',
          teacherName: 'Principal / Admin',
          updatedAt: new Date().toISOString()
        };
      });

      await apiFetch('/api/marks', {
        method: 'POST',
        body: JSON.stringify({
          marksData: recordsToSave,
          academicSessionId: selectedSessionId,
          examId: marksExamFilter,
          subject: marksSubjectFilter,
          className: marksClassFilter
        })
      }).catch(() => null);

      const db = demoDataStore.getDB();
      db.marks = db.marks || [];
      recordsToSave.forEach((rec) => {
        const idx = db.marks.findIndex(
          (m: any) =>
            m.studentId === rec.studentId &&
            (m.subject || '').toLowerCase() === rec.subject.toLowerCase() &&
            (m.examId === rec.examId || m.examName === rec.examId) &&
            (!m.academicSessionId || m.academicSessionId === rec.academicSessionId)
        );
        if (idx !== -1) {
          db.marks[idx] = { ...db.marks[idx], ...rec };
        } else {
          db.marks.push(rec);
        }
      });
      demoDataStore.saveDB(db);

      setMarksSuccessMsg(`Marks evaluation saved successfully for ${marksClassFilter} - ${marksSubjectFilter}`);
      setTimeout(() => setMarksSuccessMsg(null), 3500);

      await refreshAll(selectedSessionId);
    } catch (err) {
      console.error('Save batch marks error:', err);
    } finally {
      setMarksSaving(false);
    }
  };

  // Open Single Mark Edit Modal
  const handleOpenSingleMarkModal = (stu: Student, subj?: string, exName?: string) => {
    const targetSubj = subj || marksSubjectFilter || 'Mathematics';
    const targetExam = exName || marksExamFilter || 'Half Yearly Examination';
    setSingleMarkStudent(stu);
    setSingleMarkSubject(targetSubj);
    setSingleMarkExam(targetExam);

    const existing = marksList.find(
      (m: any) =>
        m.studentId === stu.id &&
        (m.subject || '').toLowerCase() === targetSubj.toLowerCase() &&
        (m.examId === targetExam || m.examName === targetExam) &&
        (!m.academicSessionId || m.academicSessionId === selectedSessionId)
    );

    setSingleMarkVal(existing ? Number(existing.marksObtained !== undefined ? existing.marksObtained : existing.marks) : 85);
    setSingleMarkMaxVal(existing ? Number(existing.maxMarks || existing.maximumMarks || 100) : 100);
    setEditSingleMarkModalOpen(true);
  };

  // Save Single Mark
  const handleSaveSingleMark = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!singleMarkStudent) return;
    setMarksSaving(true);
    try {
      const max = singleMarkMaxVal || 100;
      const obtained = Math.max(0, Math.min(max, singleMarkVal));
      const pct = max > 0 ? Math.round((obtained / max) * 100 * 10) / 10 : 0;
      const grade = calculateGradeFromMarks(obtained, max);

      const markRecord = {
        id: `MRK-${selectedSessionId}-${singleMarkExam}-${singleMarkStudent.id}-${singleMarkSubject}`,
        academicSessionId: selectedSessionId,
        examId: singleMarkExam,
        examName: singleMarkExam,
        studentId: singleMarkStudent.id,
        studentName: singleMarkStudent.name,
        rollNo: singleMarkStudent.rollNo,
        admissionNo: singleMarkStudent.admissionNo,
        className: singleMarkStudent.className,
        section: singleMarkStudent.section || 'A',
        subject: singleMarkSubject,
        marksObtained: obtained,
        marks: obtained,
        maxMarks: max,
        maximumMarks: max,
        percentage: pct,
        grade: grade,
        evaluatorId: 'EMP-ADMIN',
        evaluatorName: 'Admin',
        teacherName: 'Principal / Admin',
        updatedAt: new Date().toISOString()
      };

      await apiFetch('/api/marks', {
        method: 'POST',
        body: JSON.stringify({
          marksData: [markRecord],
          academicSessionId: selectedSessionId
        })
      }).catch(() => null);

      const db = demoDataStore.getDB();
      db.marks = db.marks || [];
      const idx = db.marks.findIndex(
        (m: any) =>
          m.studentId === markRecord.studentId &&
          (m.subject || '').toLowerCase() === markRecord.subject.toLowerCase() &&
          (m.examId === markRecord.examId || m.examName === markRecord.examId) &&
          (!m.academicSessionId || m.academicSessionId === markRecord.academicSessionId)
      );
      if (idx !== -1) {
        db.marks[idx] = { ...db.marks[idx], ...markRecord };
      } else {
        db.marks.push(markRecord);
      }
      demoDataStore.saveDB(db);

      setEditSingleMarkModalOpen(false);
      setMarksSuccessMsg(`Marks updated for ${singleMarkStudent.name} (${singleMarkSubject}: ${obtained}/${max})`);
      setTimeout(() => setMarksSuccessMsg(null), 3500);

      await refreshAll(selectedSessionId);
    } catch (err) {
      console.error('Save single mark error:', err);
    } finally {
      setMarksSaving(false);
    }
  };

  // Refresh all state from data store & backend API with target sessionId
  const refreshAll = async (targetSessionId?: string) => {
    const activeSesId = targetSessionId || selectedSessionId || '2026-27';
    try {
      const resSessions = await apiFetch<any>('/api/academic-sessions').catch(() => null);
      if (resSessions?.success && resSessions.data) {
        setSessions(resSessions.data);
        if (resSessions.activeSessionId) setActiveSessionId(resSessions.activeSessionId);
      }

      const stu = await apiFetch<any>(`/api/students?sessionId=${activeSesId}`).catch(() => null);
      if (stu?.success && stu.data) setStudents(stu.data);

      const emp = await apiFetch<any>(`/api/employees?sessionId=${activeSesId}`).catch(() => null);
      if (emp?.success && emp.data) setEmployees(emp.data);

      const resEx = await apiFetch<any>(`/api/exams?sessionId=${activeSesId}`).catch(() => null);
      if (resEx?.success && resEx.data) setExams(resEx.data);

      const resSch = await apiFetch<any>(`/api/exam-schedules?sessionId=${activeSesId}`).catch(() => null);
      if (resSch?.success && resSch.data) {
        setExamSchedulesList(resSch.data);
      } else {
        const db = demoDataStore.getDB();
        setExamSchedulesList(db.examSchedules || []);
      }

      const resNot = await apiFetch<any>(`/api/notices?sessionId=${activeSesId}`).catch(() => null);
      if (resNot?.success && resNot.data) setNotices(resNot.data);

      const resAtt = await apiFetch<any>(`/api/attendance?sessionId=${activeSesId}`).catch(() => null);
      if (resAtt?.success && resAtt.data) setAttendanceLogs(resAtt.data);

      const resHw = await apiFetch<any>(`/api/homework?sessionId=${activeSesId}`).catch(() => null);
      if (resHw?.success && resHw.data) setHomeworkList(resHw.data);

      const resMarks = await apiFetch<any>(`/api/marks?sessionId=${activeSesId}`).catch(() => null);
      if (resMarks?.success && resMarks.data) setMarksList(resMarks.data);

      const resNotif = await apiFetch<any>(`/api/notifications?sessionId=${activeSesId}`).catch(() => null);
      if (resNotif?.success && resNotif.data) setNotificationsList(resNotif.data);

      const resTt = await apiFetch<any>(`/api/timetable?sessionId=${activeSesId}`).catch(() => null);
      if (resTt?.success && resTt.data) setTimetableList(resTt.data);

      const resFees = await apiFetch<any>(`/api/fees?sessionId=${activeSesId}`).catch(() => null);
      if (resFees?.success && resFees.data) setFeesList(resFees.data);

      const resAct = await apiFetch<any>('/api/activities').catch(() => null);
      if (resAct?.success && resAct.data) setActivityLogs(resAct.data);
    } catch (e) {
      console.warn('Refresh error:', e);
    }
  };

  useEffect(() => {
    refreshAll(selectedSessionId);
    const unsubscribe = demoDataStore.subscribe(() => {
      refreshAll(selectedSessionId);
    });
    return () => unsubscribe();
  }, [activeTab, selectedSessionId]);

  // Derived Attendance Stats for Dashboard
  const presentCount = attendanceLogs.filter((a) => a.status === 'present').length || Math.round(students.length * 0.92);
  const absentCount = attendanceLogs.filter((a) => a.status === 'absent').length || 15;
  const leaveCount = attendanceLogs.filter((a) => a.status === 'leave').length || 5;
  const totalStudentsCount = students.length || 248;
  const attendancePercentage = Math.round((presentCount / (totalStudentsCount || 1)) * 100);

  // Student filtering
  const filteredStudents = students.filter((s) => {
    const matchesSearch = s.name.toLowerCase().includes(studentSearch.toLowerCase()) ||
      (s.admissionNo && s.admissionNo.toLowerCase().includes(studentSearch.toLowerCase())) ||
      s.rollNo.toString().includes(studentSearch);
    const matchesClass = classFilter === 'All' || s.className === classFilter || s.className === `Class ${classFilter}` || classFilter === s.className.replace('Class ', '');
    return matchesSearch && matchesClass;
  });

  // Employee filtering
  const filteredEmployees = employees.filter((e) => {
    const matchesSearch = e.name.toLowerCase().includes(teacherSearch.toLowerCase()) ||
      (e.employeeId && e.employeeId.toLowerCase().includes(teacherSearch.toLowerCase())) ||
      (e.subject && e.subject.toLowerCase().includes(teacherSearch.toLowerCase()));
    const matchesSub = teacherSubFilter === 'All' || e.subject?.toLowerCase().includes(teacherSubFilter.toLowerCase());
    return matchesSearch && matchesSub;
  });

  // --- RESET STUDENT FORM ---
  const resetStuForm = () => {
    setStuName('');
    setStuAdmissionNo('');
    setStuDob('2018-01-15');
    setStuGender('Male');
    setStuBloodGroup('O+');
    setStuPhoto('');
    setStuAadhaar('');
    setStuNationality('Indian');
    setStuCategory('General');
    setStuClass('Class 5');
    setStuSec('A');
    setStuRoll('18');
    setStuAdmissionDate('2026-04-01');
    setStuPrevSchool('');
    setStuFather('');
    setStuMother('');
    setStuGuardian('');
    setStuFatherOcc('Business');
    setStuMotherOcc('Homemaker');
    setStuPhone('');
    setStuAltPhone('');
    setStuEmail('');
    setStuAddress('Main Road, Kajraili');
    setStuCity('Bhagalpur');
    setStuDistrict('Bhagalpur');
    setStuState('Bihar');
    setStuPinCode('812005');
    setStuEmgName('');
    setStuEmgPhone('');
    setStuEmgRelation('Father');
    setStuStatus('Active');
    setStuPassword('123456');

    // Reset Transport & Fees tabs
    setStuTransportReq('No');
    const availableBuses = transportService.getBuses();
    setStuTransportBusId(availableBuses.length > 0 ? availableBuses[0].id : '');
    setStuTransportVillage('Kajraili');
    setStuTransportStop('Kajraili Chowk');
    setStuTransportTime('07:15 AM');
    setStuTransportFee(500);

    setStuTuitionFee(1500);
    setStuOtherFee(0);
    setStuInitialPayment(1000);
    setStuPaymentMethod('Cash');
    setStuPaymentDate(new Date().toISOString().split('T')[0]);

    setStuFormTab('personal');
    setStuValidationError('');
  };

  // --- PRE-FILL STUDENT FOR EDIT ---
  const openEditStudentModal = (stu: Student) => {
    setEditStudent(stu);
    setStuName(stu.name || '');
    setStuAdmissionNo(stu.admissionNo || '');
    setStuDob(stu.dob || '2018-01-15');
    setStuGender(stu.gender || 'Male');
    setStuBloodGroup(stu.bloodGroup || 'O+');
    setStuPhoto(stu.photo || '');
    setStuAadhaar(stu.aadhaar || '');
    setStuNationality(stu.nationality || 'Indian');
    setStuCategory(stu.category || 'General');

    const rawClass = stu.className || 'Class 5';
    let clsName = rawClass;
    let secName = stu.section || 'A';
    if (rawClass.includes('-')) {
      const parts = rawClass.split('-');
      clsName = parts[0];
      if (!stu.section) secName = parts[1];
    }
    if (!clsName.startsWith('Class ') && !['Nursery', 'LKG', 'UKG'].includes(clsName)) {
      clsName = `Class ${clsName}`;
    }
    setStuClass(clsName);
    setStuSec(secName);
    setStuRoll(String(stu.rollNo || 18));
    setStuAdmissionDate(stu.admissionDate || '2026-04-01');
    setStuPrevSchool(stu.previousSchool || '');

    setStuFather(stu.fatherName || '');
    setStuMother(stu.motherName || '');
    setStuGuardian(stu.guardianName || stu.fatherName || '');
    setStuFatherOcc(stu.fatherOcc || 'Business');
    setStuMotherOcc(stu.motherOcc || 'Homemaker');
    setStuPhone(stu.phone || '');
    setStuAltPhone(stu.altPhone || '');
    setStuEmail(stu.email || '');

    setStuAddress(stu.address || 'Main Road, Kajraili');
    setStuCity(stu.city || 'Bhagalpur');
    setStuDistrict(stu.district || 'Bhagalpur');
    setStuState(stu.state || 'Bihar');
    setStuPinCode(stu.pinCode || '812005');

    setStuEmgName(stu.emgName || '');
    setStuEmgPhone(stu.emgPhone || '');
    setStuEmgRelation(stu.emgRelation || 'Father');

    setStuStatus(stu.status || 'Active');
    setStuPassword(stu.password || '123456');

    // Pre-fill Transport
    const existingTransport = transportService.getAssignments().find(a => a.studentId === stu.id || a.admissionNo === stu.admissionNo);
    if (existingTransport && existingTransport.status === 'Active') {
      setStuTransportReq('Yes');
      setStuTransportBusId(existingTransport.busId);
      setStuTransportVillage(existingTransport.village);
      setStuTransportStop(existingTransport.pickupStop);
      setStuTransportTime(existingTransport.pickupTime);
      setStuTransportFee(existingTransport.monthlyFee);
    } else {
      setStuTransportReq('No');
      const bList = transportService.getBuses();
      setStuTransportBusId(bList.length > 0 ? bList[0].id : '');
      setStuTransportVillage('Kajraili');
      setStuTransportStop('Kajraili Chowk');
      setStuTransportTime('07:15 AM');
      setStuTransportFee(500);
    }

    // Pre-fill Fees
    const existingFee = feeService.getFeeRecordByStudentId(stu.id, selectedSessionId);
    if (existingFee) {
      const tuitionItem = (existingFee.feeStructure || []).find(f => f.name.toLowerCase().includes('tuition'));
      const otherItem = (existingFee.feeStructure || []).find(f => f.name.toLowerCase().includes('other'));
      setStuTuitionFee(tuitionItem ? tuitionItem.amount : (existingFee.totalFee || 1500));
      setStuOtherFee(otherItem ? otherItem.amount : 0);
      setStuInitialPayment(existingFee.paidFee || 0);
      setStuPaymentMethod((existingFee.paymentHistory && existingFee.paymentHistory.length > 0 ? existingFee.paymentHistory[0].paymentMode : 'Cash') as any);
      setStuPaymentDate(existingFee.lastPaymentDate || new Date().toISOString().split('T')[0]);
    } else {
      setStuTuitionFee(1500);
      setStuOtherFee(0);
      setStuInitialPayment(1000);
      setStuPaymentMethod('Cash');
      setStuPaymentDate(new Date().toISOString().split('T')[0]);
    }

    setStuFormTab('personal');
    setStuValidationError('');
    setAddStudentModalOpen(true);
  };

  // --- SAVE / REGISTER STUDENT ---
  const handleSaveStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    setStuValidationError('');

    if (!stuName.trim()) {
      setStuValidationError('Full Name is required.');
      setStuFormTab('personal');
      return;
    }
    if (!stuClass.trim() || !stuSec.trim()) {
      setStuValidationError('Class and Section must be selected.');
      setStuFormTab('academic');
      return;
    }
    if (!stuRoll.trim() || isNaN(Number(stuRoll))) {
      setStuValidationError('Valid Roll Number is required.');
      setStuFormTab('academic');
      return;
    }
    if (!stuFather.trim()) {
      setStuValidationError("Father's / Guardian's Name is required.");
      setStuFormTab('parent');
      return;
    }
    if (!stuPhone.trim() || stuPhone.trim().length < 7) {
      setStuValidationError('Valid Guardian Phone number is required.');
      setStuFormTab('parent');
      return;
    }

    const admNo = stuAdmissionNo.trim() || `AVM2026${Math.floor(1000 + Math.random() * 9000)}`;
    const formattedClass = stuClass.startsWith('Class ') || stuClass.includes('KG') || stuClass.includes('Nursery')
      ? (stuClass.includes('-') ? stuClass : `${stuClass}-${stuSec}`)
      : `Class ${stuClass}-${stuSec}`;

    const studentPayload = {
      id: editStudent ? editStudent.id : `STU-${Date.now().toString().slice(-4)}`,
      admissionNo: admNo,
      rollNo: Number(stuRoll),
      name: stuName.trim(),
      photo: stuPhoto,
      className: formattedClass,
      section: stuSec,
      dob: stuDob || '2018-01-15',
      gender: stuGender,
      bloodGroup: stuBloodGroup,
      fatherName: stuFather.trim(),
      motherName: stuMother.trim() || 'Mother',
      guardianName: stuGuardian.trim() || stuFather.trim(),
      fatherOcc: stuFatherOcc,
      motherOcc: stuMotherOcc,
      phone: stuPhone.trim(),
      altPhone: stuAltPhone.trim(),
      email: stuEmail.trim(),
      address: stuAddress.trim() || 'Kajraili, Bhagalpur, Bihar - 812005',
      city: stuCity.trim() || 'Bhagalpur',
      district: stuDistrict.trim() || 'Bhagalpur',
      state: stuState.trim() || 'Bihar',
      pinCode: stuPinCode.trim() || '812005',
      admissionDate: stuAdmissionDate,
      previousSchool: stuPrevSchool.trim(),
      status: stuStatus || 'Active',
      password: stuPassword || '123456',
      aadhaar: stuAadhaar,
      nationality: stuNationality,
      category: stuCategory,
      emgName: stuEmgName,
      emgPhone: stuEmgPhone,
      emgRelation: stuEmgRelation
    };

    if (editStudent) {
      await apiFetch(`/api/students/${editStudent.id}?sessionId=${selectedSessionId}`, {
        method: 'PUT',
        body: JSON.stringify(studentPayload)
      }).catch(() => null);
    } else {
      await apiFetch(`/api/students?sessionId=${selectedSessionId}`, {
        method: 'POST',
        body: JSON.stringify(studentPayload)
      }).catch(() => null);
    }

    // Save directly to persistent demo store cache
    const db = demoDataStore.getDB();
    if (!db.students) db.students = [];
    const stIdx = db.students.findIndex((s: any) => s.id === studentPayload.id);
    if (stIdx !== -1) {
      db.students[stIdx] = { ...db.students[stIdx], ...studentPayload };
    } else {
      db.students.unshift(studentPayload as any);
    }
    demoDataStore.saveDB(db);

    // Save Transport Assignment if enabled
    if (stuTransportReq === 'Yes') {
      const allBuses = transportService.getBuses();
      const targetBusId = stuTransportBusId || (allBuses.length > 0 ? allBuses[0].id : '');
      transportService.assignStudent({
        busId: targetBusId,
        studentId: studentPayload.id,
        studentName: studentPayload.name,
        admissionNo: studentPayload.admissionNo,
        className: stuClass,
        section: stuSec,
        rollNo: Number(stuRoll),
        village: stuTransportVillage.trim() || 'Kajraili',
        pickupStop: stuTransportStop.trim() || 'Kajraili Chowk',
        pickupTime: stuTransportTime.trim() || '07:15 AM',
        monthlyFee: Number(stuTransportFee),
        status: 'Active'
      });
    } else if (editStudent) {
      const existingAssign = transportService.getAssignments().find(a => a.studentId === editStudent.id);
      if (existingAssign) {
        transportService.removeStudentFromBus(existingAssign.id);
      }
    }

    // Save Fee Record & Initial Payment
    const finalTransFee = stuTransportReq === 'Yes' ? Number(stuTransportFee) : 0;
    feeService.setupRegistrationFeeRecord({
      studentId: studentPayload.id,
      studentName: studentPayload.name,
      admissionNo: studentPayload.admissionNo,
      className: stuClass,
      section: stuSec,
      rollNo: Number(stuRoll),
      tuitionFee: Number(stuTuitionFee),
      transportFee: finalTransFee,
      otherFee: Number(stuOtherFee),
      initialPayment: Number(stuInitialPayment),
      paymentMode: stuPaymentMethod,
      paymentDate: stuPaymentDate,
      academicSessionId: selectedSessionId
    });

    setAddStudentModalOpen(false);
    setEditStudent(null);
    resetStuForm();
    await refreshAll(selectedSessionId);
  };

  const handleDeleteStudent = async (student: Student) => {
    if (!window.confirm(`Are you sure you want to delete ${student.name} (Admission No: ${student.admissionNo})?`)) return;
    await apiFetch(`/api/students/${student.id}`, { method: 'DELETE' }).catch(() => null);
    await refreshAll(selectedSessionId);
  };

  // --- RESET TEACHER / STAFF FORM ---
  const resetEmpForm = () => {
    const db = demoDataStore.getDB();
    const existingEmpList: Employee[] = db.employees || [];
    let maxNum = 0;
    existingEmpList.forEach((e) => {
      const match = (e.employeeId || '').match(/EMP2026(\d+)/i) || (e.employeeId || '').match(/EMP(\d+)/i) || (e.employeeId || '').match(/T(\d+)/i);
      if (match) {
        const val = parseInt(match[1], 10);
        if (!isNaN(val) && val > maxNum) maxNum = val;
      }
    });
    const nextVal = maxNum > 0 ? maxNum + 1 : 1;
    const autoGenCode = `EMP2026${String(nextVal).padStart(3, '0')}`;

    setEmpName('');
    setEmpCodeInput(autoGenCode);
    setEmpDob('1990-05-20');
    setEmpGender('Female');
    setEmpBloodGroup('B+');
    setEmpCategory('General');
    setEmpNationality('Indian');
    setEmpAadhaar('');
    setEmpPanNumber('');
    setEmpPhoto('');
    setEmpPhone('');
    setEmpAltPhone('');
    setEmpEmail('');

    setEmpType('Permanent');
    setEmpDepartment('Academic');
    setEmpDesig('Teacher');
    setEmpJoinDate('2026-07-01');
    setEmpStatus('Active');
    setEmpExp('3 Years');
    setEmpPrevSchool('');
    setEmpPrevDesignation('');
    setEmpUanCode('');
    setEmpEsiNumber('');
    setEmpPfNumber('');
    setEmpRole('Teacher');

    setEmpQual('B.Ed');
    setEmpProfQual('B.Ed');
    setEmpSpecialization('Mathematics');
    setEmpTeachingExp('3 Years');
    setEmpSubject('Mathematics');
    setEmpMedium('Hindi + English');
    setEmpIsClassTeacher('No');
    setEmpClassTeacherClass('Class 5');
    setEmpClassTeacherSec('A');
    setEmpAssignedClasses(['Class 5-A', 'Class 6-A']);
    setEmpTeachingSubjects(['Mathematics', 'Science']);

    setEmpFather('');
    setEmpMother('');
    setEmpSpouse('');
    setEmpGuardianName('');
    setEmpEmgName('');
    setEmpEmgRelation('Spouse');
    setEmpEmgPhone('');
    setEmpEmgAltPhone('');
    setEmpEmgAddress('');

    setEmpAddress('Teachers Colony, Kajraili');
    setEmpAddressLine2('');
    setEmpVillage('Kajraili');
    setEmpCity('Bhagalpur');
    setEmpDistrict('Bhagalpur');
    setEmpState('Bihar');
    setEmpPinCode('812005');
    setEmpSameAsCurrentAddress(true);
    setEmpPermAddress('');
    setEmpPermAddressLine2('');
    setEmpPermVillage('');
    setEmpPermCity('');
    setEmpPermDistrict('');
    setEmpPermState('Bihar');
    setEmpPermPinCode('');

    setEmpDocuments([]);
    setDocTypeInput('Aadhaar Card');
    setDocNumberInput('');
    setDocFileInput('');
    setDocFileNameInput('');
    setDocIssueDateInput('');
    setDocExpiryDateInput('');
    setDocRemarksInput('');

    setEmpUsername('');
    setEmpPassword('123456');
    setEmpConfirmPassword('123456');
    setEmpAccountStatus('Active');

    setEmpTransportReq('No');
    const availableBuses = transportService.getBuses();
    setEmpTransportBusId(availableBuses.length > 0 ? availableBuses[0].id : '');
    setEmpTransportRoute(availableBuses.length > 0 ? (availableBuses[0].routeName || availableBuses[0].routeArea || 'Route 1') : 'Route 1');
    setEmpTransportVillage('Kajraili');
    setEmpTransportStop('Kajraili Chowk');
    setEmpTransportTime('07:15 AM');
    setEmpTransportFee(500);
    setEmpTransportStartDate(new Date().toISOString().split('T')[0]);
    setEmpTransportStatus('Active');

    setEmpSalaryType('Monthly');
    setEmpBasicSalary(25000);
    setEmpAllowances(3000);
    setEmpDeduction(1000);
    setEmpPaidSalaryAmount(20000);
    setEmpSalaryPaymentMonth('September 2026');
    setEmpSalaryPaymentDate(new Date().toISOString().split('T')[0]);
    setEmpSalaryRefNo('');
    setEmpSalaryRemarks('Monthly Salary Disbursement');
    setEmpShowAddPayment(false);
    setEmpPaymentMode('Bank Transfer');
    setEmpBankName('');
    setEmpAccountNumber('');
    setEmpIfscCode('');
    setEmpSalaryStatus('Active');
    setEmpSalaryEffectiveFrom(new Date().toISOString().split('T')[0]);
    setEmpSalaryPaymentsList([]);

    setEmpDues([]);
    setEmpShowAddDue(false);
    setDueTypeInput('Uniform');
    setDueDescInput('');
    setDueAmountInput('');
    setDueDateInput(new Date().toISOString().split('T')[0]);
    setDuePaidInput(0);
    setDueRemarksInput('');

    setEmpFormTab('personal');
    setEmpValidationError('');
  };

  // --- PRE-FILL TEACHER / STAFF FOR EDIT ---
  const openEditTeacherModal = (emp: Employee) => {
    setEditTeacher(emp);
    setEmpName(emp.name || '');
    setEmpCodeInput(emp.employeeId || '');
    setEmpDob(emp.dob || '1990-05-20');
    setEmpGender(emp.gender || 'Female');
    setEmpBloodGroup(emp.bloodGroup || 'B+');
    setEmpCategory(emp.category || 'General');
    setEmpNationality(emp.nationality || 'Indian');
    setEmpAadhaar(emp.aadhaar || '');
    setEmpPanNumber(emp.panNumber || '');
    setEmpPhoto(emp.photo || '');
    setEmpPhone(emp.phone || '');
    setEmpAltPhone(emp.altPhone || '');
    setEmpEmail(emp.email || '');

    setEmpType(emp.employmentType || 'Permanent');
    setEmpDepartment(emp.department || 'Academic');
    setEmpDesig(emp.designation || 'Teacher');
    setEmpJoinDate(emp.joinDate || '2026-07-01');
    setEmpStatus(emp.status as any || 'Active');
    setEmpExp(emp.experience || '3 Years');
    setEmpPrevSchool(emp.prevSchool || '');
    setEmpPrevDesignation(emp.prevDesignation || '');
    setEmpUanCode(emp.uanCode || '');
    setEmpEsiNumber(emp.esiNumber || '');
    setEmpPfNumber(emp.pfNumber || '');
    setEmpRole(emp.employeeRole || emp.designation || 'Teacher');

    setEmpQual(emp.qualification || 'B.Ed');
    setEmpProfQual(emp.profQual || 'B.Ed');
    setEmpSpecialization(emp.specialization || 'Mathematics');
    setEmpTeachingExp(emp.teachingExp || emp.experience || '3 Years');
    setEmpSubject(emp.subject || 'Mathematics');
    setEmpMedium(emp.medium || 'Hindi + English');
    setEmpIsClassTeacher(emp.isClassTeacher || (emp.employeeRole === 'Class Teacher' ? 'Yes' : 'No'));
    setEmpClassTeacherClass(emp.classTeacherClass || 'Class 5');
    setEmpClassTeacherSec(emp.classTeacherSection || 'A');
    setEmpAssignedClasses(emp.assignedClasses || ['Class 5-A']);
    setEmpTeachingSubjects(emp.teachingSubjects || (emp.subject ? [emp.subject] : ['Mathematics']));

    setEmpFather(emp.fatherName || '');
    setEmpMother(emp.motherName || '');
    setEmpSpouse(emp.spouseName || '');
    setEmpGuardianName(emp.guardianName || '');
    setEmpEmgName(emp.emgName || '');
    setEmpEmgRelation(emp.emgRelation || 'Spouse');
    setEmpEmgPhone(emp.emgPhone || '');
    setEmpEmgAltPhone(emp.emgAltPhone || '');
    setEmpEmgAddress(emp.emgAddress || '');

    setEmpAddress(emp.address || 'Teachers Colony, Kajraili');
    setEmpAddressLine2(emp.addressLine2 || '');
    setEmpVillage(emp.village || 'Kajraili');
    setEmpCity(emp.city || 'Bhagalpur');
    setEmpDistrict(emp.district || 'Bhagalpur');
    setEmpState(emp.state || 'Bihar');
    setEmpPinCode(emp.pinCode || '812005');
    setEmpSameAsCurrentAddress(emp.sameAsCurrentAddress !== false);
    setEmpPermAddress(emp.permAddress || '');
    setEmpPermAddressLine2(emp.permAddressLine2 || '');
    setEmpPermVillage(emp.permVillage || '');
    setEmpPermCity(emp.permCity || '');
    setEmpPermDistrict(emp.permDistrict || '');
    setEmpPermState(emp.permState || 'Bihar');
    setEmpPermPinCode(emp.permPinCode || '');

    setEmpDocuments(emp.documents || []);

    setEmpUsername(emp.username || emp.employeeId || '');
    setEmpPassword(emp.password || '123456');
    setEmpConfirmPassword(emp.password || '123456');
    setEmpAccountStatus(emp.status === 'Inactive' ? 'Inactive' : 'Active');

    // Pre-fill Transport
    const existingTransport = transportService.getAssignments().find(a => a.studentId === emp.id || a.admissionNo === emp.employeeId);
    if (existingTransport && existingTransport.status === 'Active') {
      setEmpTransportReq('Yes');
      setEmpTransportBusId(existingTransport.busId);
      setEmpTransportRoute(emp.transportRoute || 'Route 1');
      setEmpTransportVillage(existingTransport.village);
      setEmpTransportStop(existingTransport.pickupStop);
      setEmpTransportTime(existingTransport.pickupTime);
      setEmpTransportFee(existingTransport.monthlyFee);
      setEmpTransportStartDate(emp.transportStartDate || new Date().toISOString().split('T')[0]);
      setEmpTransportStatus('Active');
    } else {
      setEmpTransportReq(emp.transportReq || 'No');
      const bList = transportService.getBuses();
      setEmpTransportBusId(emp.transportBusId || (bList.length > 0 ? bList[0].id : ''));
      setEmpTransportRoute(emp.transportRoute || 'Route 1');
      setEmpTransportVillage(emp.transportVillage || 'Kajraili');
      setEmpTransportStop(emp.transportStop || 'Kajraili Chowk');
      setEmpTransportTime(emp.transportTime || '07:15 AM');
      setEmpTransportFee(emp.transportFee || 500);
      setEmpTransportStartDate(emp.transportStartDate || new Date().toISOString().split('T')[0]);
      setEmpTransportStatus(emp.transportStatus || 'Active');
    }

    // Pre-fill Salary / Payroll & Payments
    setEmpSalaryType(emp.salaryType || 'Monthly');
    setEmpBasicSalary(emp.basicSalary ?? 25000);
    setEmpAllowances(emp.allowances ?? 3000);
    setEmpDeduction(emp.deduction ?? 1000);
    setEmpPaidSalaryAmount(emp.paidSalary ?? 20000);
    setEmpSalaryPaymentMonth('September 2026');
    setEmpSalaryPaymentDate(new Date().toISOString().split('T')[0]);
    setEmpSalaryRefNo('');
    setEmpSalaryRemarks('Monthly Salary Disbursement');
    setEmpShowAddPayment(false);
    setEmpSalaryPaymentsList(emp.salaryPayments || []);

    setEmpDues(emp.dues || []);
    setEmpShowAddDue(false);

    setEmpPaymentMode(emp.paymentMode || 'Bank Transfer');
    setEmpBankName(emp.bankName || '');
    setEmpAccountNumber(emp.accountNumber || '');
    setEmpIfscCode(emp.ifscCode || '');
    setEmpSalaryStatus(emp.salaryStatus || 'Active');
    setEmpSalaryEffectiveFrom(emp.salaryEffectiveFrom || new Date().toISOString().split('T')[0]);

    setEmpFormTab('personal');
    setEmpValidationError('');
    setAddTeacherModalOpen(true);
  };

  // --- SAVE / REGISTER TEACHER / STAFF ---
  const handleSaveTeacher = async (e: React.FormEvent) => {
    e.preventDefault();
    setEmpValidationError('');

    if (!empName.trim()) {
      setEmpValidationError('Full Name is required.');
      setEmpFormTab('personal');
      return;
    }
    if (!empPhone.trim() || empPhone.trim().length < 7) {
      setEmpValidationError('Valid Mobile Number is required.');
      setEmpFormTab('personal');
      return;
    }
    if (!empType.trim()) {
      setEmpValidationError('Employment Type is required.');
      setEmpFormTab('professional');
      return;
    }
    if (!empDesig.trim()) {
      setEmpValidationError('Designation is required.');
      setEmpFormTab('professional');
      return;
    }
    if (!empDepartment.trim()) {
      setEmpValidationError('Department is required.');
      setEmpFormTab('professional');
      return;
    }
    if (!empJoinDate.trim()) {
      setEmpValidationError('Joining Date is required.');
      setEmpFormTab('professional');
      return;
    }

    // Password confirmation match validation
    if (empPassword !== empConfirmPassword) {
      setEmpValidationError('Password and Confirm Password do not match.');
      setEmpFormTab('account');
      return;
    }

    // Auto generate Employee ID if blank: EMP2026001, EMP2026002...
    let empCode = empCodeInput.trim();
    const db = demoDataStore.getDB();
    const existingEmpList: Employee[] = db.employees || [];

    if (!empCode) {
      let maxNum = 0;
      existingEmpList.forEach(e => {
        const match = (e.employeeId || '').match(/EMP2026(\d+)/i) || (e.employeeId || '').match(/EMP(\d+)/i) || (e.employeeId || '').match(/T(\d+)/i);
        if (match) {
          const val = parseInt(match[1], 10);
          if (!isNaN(val) && val > maxNum) maxNum = val;
        }
      });
      const nextVal = maxNum > 0 ? maxNum + 1 : 1;
      empCode = `EMP2026${String(nextVal).padStart(3, '0')}`;
    }

    // Duplicate check for Employee ID and Username (excluding edit self)
    const idDuplicate = existingEmpList.find(e => e.employeeId === empCode && (!editTeacher || e.id !== editTeacher.id));
    if (idDuplicate) {
      setEmpValidationError(`Employee ID "${empCode}" is already registered. Please use a unique Employee ID.`);
      setEmpFormTab('personal');
      return;
    }

    const uname = empUsername.trim() || empCode;
    const usernameDuplicate = existingEmpList.find(e => e.username === uname && (!editTeacher || e.id !== editTeacher.id));
    if (usernameDuplicate) {
      setEmpValidationError(`Username "${uname}" is already taken. Please choose another username.`);
      setEmpFormTab('account');
      return;
    }

    const netSalaryCalculated = Math.max(0, (Number(empBasicSalary) || 0) + (Number(empAllowances) || 0) - (Number(empDeduction) || 0));
    const paidSalaryCalculated = Number(empPaidSalaryAmount) || 0;
    const pendingSalaryCalculated = Math.max(0, netSalaryCalculated - paidSalaryCalculated);
    const salaryPaymentStatusCalculated: 'Paid' | 'Partial' | 'Pending' =
      paidSalaryCalculated >= netSalaryCalculated && netSalaryCalculated > 0
        ? 'Paid'
        : paidSalaryCalculated > 0
          ? 'Partial'
          : 'Pending';

    let updatedPaymentsList = [...empSalaryPaymentsList];
    if (paidSalaryCalculated > 0 && updatedPaymentsList.length === 0) {
      const initialPaymentRecord: SchoolSalaryPaymentRecord = {
        id: `SAL-PAY-${Date.now()}`,
        employeeId: empCode,
        employeeName: empName.trim(),
        paymentMonth: empSalaryPaymentMonth || 'September 2026',
        salaryAmount: netSalaryCalculated,
        paidAmount: paidSalaryCalculated,
        pendingAmount: pendingSalaryCalculated,
        paymentDate: empSalaryPaymentDate,
        paymentMode: empPaymentMode,
        transactionRef: empSalaryRefNo.trim(),
        remarks: empSalaryRemarks.trim(),
        status: salaryPaymentStatusCalculated,
        createdAt: new Date().toISOString()
      };
      updatedPaymentsList.push(initialPaymentRecord);
    }

    const employeePayload: Employee = {
      id: editTeacher ? editTeacher.id : `EMP-${Date.now().toString().slice(-4)}`,
      employeeId: empCode,
      name: empName.trim(),
      photo: empPhoto,
      gender: empGender as any,
      dob: empDob,
      bloodGroup: empBloodGroup,
      category: empCategory,
      nationality: empNationality,
      aadhaar: empAadhaar.trim(),
      panNumber: empPanNumber.trim(),
      phone: empPhone.trim(),
      altPhone: empAltPhone.trim(),
      email: empEmail.trim() || `${empName.toLowerCase().replace(/\s+/g, '.')}@avmkajraili.edu.in`,

      employmentType: empType,
      department: empDepartment,
      designation: empDesig.trim(),
      joinDate: empJoinDate,
      status: empStatus as any,
      workStatus: empStatus,
      experience: empExp.trim(),
      prevSchool: empPrevSchool.trim(),
      prevDesignation: empPrevDesignation.trim(),
      uanCode: empUanCode.trim(),
      esiNumber: empEsiNumber.trim(),
      pfNumber: empPfNumber.trim(),

      qualification: empQual.trim(),
      profQual: empProfQual.trim(),
      specialization: empSpecialization.trim(),
      teachingExp: empTeachingExp.trim(),
      subject: empSubject.trim() || 'General',
      medium: empMedium,
      assignedClasses: empAssignedClasses.length > 0 ? empAssignedClasses : ['Class 5-A'],
      employeeRole: empIsClassTeacher === 'Yes' ? 'Class Teacher' : empRole,

      isClassTeacher: empIsClassTeacher,
      classTeacherClass: empIsClassTeacher === 'Yes' ? empClassTeacherClass : '',
      classTeacherSection: empIsClassTeacher === 'Yes' ? empClassTeacherSec : '',
      teachingSubjects: empTeachingSubjects.length > 0 ? empTeachingSubjects : [empSubject || 'Mathematics'],

      fatherName: empFather.trim(),
      motherName: empMother.trim(),
      spouseName: empSpouse.trim(),
      guardianName: empGuardianName.trim(),
      emgName: empEmgName.trim(),
      emgRelation: empEmgRelation,
      emgPhone: empEmgPhone.trim(),
      emgAltPhone: empEmgAltPhone.trim(),
      emgAddress: empEmgAddress.trim(),

      address: empAddress.trim(),
      addressLine2: empAddressLine2.trim(),
      village: empVillage.trim(),
      city: empCity.trim(),
      district: empDistrict.trim(),
      state: empState.trim(),
      pinCode: empPinCode.trim(),
      sameAsCurrentAddress: empSameAsCurrentAddress,
      permAddress: empSameAsCurrentAddress ? empAddress.trim() : empPermAddress.trim(),
      permAddressLine2: empSameAsCurrentAddress ? empAddressLine2.trim() : empPermAddressLine2.trim(),
      permVillage: empSameAsCurrentAddress ? empVillage.trim() : empPermVillage.trim(),
      permCity: empSameAsCurrentAddress ? empCity.trim() : empPermCity.trim(),
      permDistrict: empSameAsCurrentAddress ? empDistrict.trim() : empPermDistrict.trim(),
      permState: empSameAsCurrentAddress ? empState.trim() : empPermState.trim(),
      permPinCode: empSameAsCurrentAddress ? empPinCode.trim() : empPermPinCode.trim(),

      documents: empDocuments,
      dues: empDues,

      username: uname,
      password: empPassword || '123456',

      salaryType: empSalaryType,
      basicSalary: Number(empBasicSalary) || 0,
      allowances: Number(empAllowances) || 0,
      deduction: Number(empDeduction) || 0,
      netSalary: netSalaryCalculated,
      paidSalary: paidSalaryCalculated,
      pendingSalary: pendingSalaryCalculated,
      salaryPaymentStatus: salaryPaymentStatusCalculated,
      paymentMode: empPaymentMode,
      bankName: empBankName.trim(),
      accountNumber: empAccountNumber.trim(),
      ifscCode: empIfscCode.trim(),
      salaryStatus: empSalaryStatus,
      salaryEffectiveFrom: empSalaryEffectiveFrom,
      salaryPayments: updatedPaymentsList,

      transportReq: empTransportReq,
      transportBusId: empTransportBusId,
      transportRoute: empTransportRoute,
      transportVillage: empTransportVillage.trim() || 'Kajraili',
      transportStop: empTransportStop.trim() || 'Kajraili Chowk',
      transportTime: empTransportTime.trim() || '07:15 AM',
      transportFee: Number(empTransportFee) || 0,
      transportStartDate: empTransportStartDate,
      transportStatus: empTransportStatus
    };

    if (editTeacher) {
      await apiFetch(`/api/employees/${editTeacher.id}?sessionId=${selectedSessionId}`, {
        method: 'PUT',
        body: JSON.stringify(employeePayload)
      }).catch(() => null);
    } else {
      await apiFetch(`/api/employees?sessionId=${selectedSessionId}`, {
        method: 'POST',
        body: JSON.stringify(employeePayload)
      }).catch(() => null);
    }

    // Save directly to persistent demo store cache
    if (!db.employees) db.employees = [];
    const empIdx = db.employees.findIndex((e: any) => e.id === employeePayload.id);
    if (empIdx !== -1) {
      db.employees[empIdx] = { ...db.employees[empIdx], ...employeePayload };
    } else {
      db.employees.unshift(employeePayload as any);
    }

    // Sync User login account
    if (!db.users) db.users = [];
    const userIdx = db.users.findIndex((u: any) => u.linkedEmployeeId === employeePayload.id || u.username === uname);
    const userEntry = {
      id: userIdx !== -1 ? db.users[userIdx].id : `USR-${employeePayload.employeeId}`,
      username: uname,
      password: empPassword || '123456',
      role: 'employee',
      linkedEmployeeId: employeePayload.id,
      active: empAccountStatus === 'Active'
    };
    if (userIdx !== -1) {
      db.users[userIdx] = userEntry;
    } else {
      db.users.push(userEntry);
    }

    // Sync Class Teacher assignment to Classes & Sections module
    const schoolClasses = db.schoolClasses || INITIAL_SEED_SCHOOL_CLASSES;
    // Clear old assignment if any
    schoolClasses.forEach(c => {
      if (c.classTeacherId === employeePayload.id) {
        c.classTeacherId = '';
        c.classTeacherName = 'Unassigned';
      }
      if (c.sections) {
        c.sections.forEach(s => {
          if (s.teacherId === employeePayload.id) {
            s.teacherId = '';
            s.teacherName = 'Unassigned';
            s.classTeacherName = 'Unassigned';
          }
        });
      }
    });

    if (empIsClassTeacher === 'Yes' && empClassTeacherClass && empClassTeacherSec) {
      const targetClass = schoolClasses.find(c =>
        c.name.toLowerCase() === empClassTeacherClass.toLowerCase() ||
        c.grade.toLowerCase() === empClassTeacherClass.toLowerCase() ||
        c.id.toLowerCase() === empClassTeacherClass.toLowerCase().replace(/\s+/g, '-')
      );
      if (targetClass) {
        targetClass.classTeacherId = employeePayload.id;
        targetClass.classTeacherName = employeePayload.name;
        if (targetClass.sections) {
          const targetSec = targetClass.sections.find(s =>
            s.name.toLowerCase() === empClassTeacherSec.toLowerCase() ||
            s.section?.toLowerCase() === empClassTeacherSec.toLowerCase()
          );
          if (targetSec) {
            targetSec.teacherId = employeePayload.id;
            targetSec.teacherName = employeePayload.name;
            targetSec.classTeacherName = employeePayload.name;
          }
        }
      }
    }
    db.schoolClasses = schoolClasses;

    demoDataStore.saveDB(db);

    // Save Transport Assignment if enabled
    if (empTransportReq === 'Yes') {
      const allBuses = transportService.getBuses();
      const targetBusId = empTransportBusId || (allBuses.length > 0 ? allBuses[0].id : '');
      transportService.assignStudent({
        busId: targetBusId,
        studentId: employeePayload.id,
        studentName: employeePayload.name,
        admissionNo: employeePayload.employeeId,
        className: employeePayload.designation,
        section: 'Staff',
        rollNo: 0,
        village: empTransportVillage.trim() || 'Kajraili',
        pickupStop: empTransportStop.trim() || 'Kajraili Chowk',
        pickupTime: empTransportTime.trim() || '07:15 AM',
        monthlyFee: Number(empTransportFee),
        status: 'Active',
        isStaff: true,
        designation: employeePayload.designation,
        userType: 'Staff'
      });
    } else if (editTeacher) {
      const existingAssign = transportService.getAssignments().find(a => a.studentId === editTeacher.id || a.admissionNo === editTeacher.employeeId);
      if (existingAssign) {
        transportService.removeStudentFromBus(existingAssign.id);
      }
    }

    setAddTeacherModalOpen(false);
    setEditTeacher(null);
    resetEmpForm();
    await refreshAll(selectedSessionId);
  };

  const handleDeleteEmployee = async (emp: Employee) => {
    if (!window.confirm(`Are you sure you want to delete ${emp.name} (Employee ID: ${emp.employeeId})?`)) return;
    await apiFetch(`/api/employees/${emp.id}`, { method: 'DELETE' }).catch(() => null);
    await refreshAll();
  };

  const handleCreateExam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newExamName) return;
    const res = await adminService.createExam({
      name: newExamName,
      academicYear: '2026-2027',
      startDate: newExamStart,
      endDate: '2026-10-25',
      classes: mockSchoolClasses
    });
    if (res.success && res.exam) {
      setExams((prev) => [...prev, res.exam]);
    }
    setCreateExamModalOpen(false);
    setNewExamName('');
    await refreshAll();
  };

  const handleBroadcastNotice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!noticeTitle) return;
    const res = await adminService.sendNotice({
      title: noticeTitle,
      category: noticeCat,
      description: noticeDesc,
      date: new Date().toISOString().split('T')[0],
      targetRole: 'All'
    });
    if (res.success && res.notice) {
      setNotices((prev) => [res.notice, ...prev]);
    }
    setBroadcastNoticeModalOpen(false);
    setNoticeTitle('');
    setNoticeDesc('');
    await refreshAll();
  };

  const handleDeleteNotice = async (notId: string) => {
    if (!window.confirm('Delete this notice?')) return;
    await apiFetch(`/api/notices/${notId}`, { method: 'DELETE' }).catch(() => null);
    await refreshAll();
  };

  const handleAddHomework = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!hwTitle) return;
    await apiFetch('/api/homework', {
      method: 'POST',
      body: JSON.stringify({
        className: hwClass,
        section: 'A',
        subject: hwSub,
        title: hwTitle,
        description: hwDesc,
        assignedDate: new Date().toISOString().split('T')[0],
        dueDate: '2026-10-10',
        teacherName: 'Principal / Admin'
      })
    });
    setAddHomeworkModalOpen(false);
    setHwTitle('');
    setHwDesc('');
    await refreshAll();
  };

  const handleUpdateFee = async (e: React.FormEvent) => {
    e.preventDefault();
    const tot = Number(feeTotalAmount) || 2500;
    const pd = Number(feePaidAmount) || 1500;
    const pnd = Math.max(0, tot - pd);

    await apiFetch(`/api/fees/${feeStudentId}`, {
      method: 'PUT',
      body: JSON.stringify({
        amount: tot,
        totalFee: tot,
        paidFee: pd,
        pendingFee: pnd,
        title: 'Tuition & Academic Fees'
      })
    });

    setUpdateFeeModalOpen(false);
    await refreshAll();
  };

  const handleAddTimetable = async (e: React.FormEvent) => {
    e.preventDefault();
    await apiFetch('/api/timetable', {
      method: 'POST',
      body: JSON.stringify({
        period: Number(ttPeriod),
        time: ttTime,
        className: ttClass,
        subject: ttSubject,
        teacher: ttTeacher
      })
    });
    setAddTimetableModalOpen(false);
    await refreshAll();
  };

  const handleSendNotification = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    resetSendNotifForm();
    setSendNotifModalOpen(true);
  };

  // Academic Session Actions
  const handleCreateSession = async (e: React.FormEvent) => {
    e.preventDefault();

    const trimmedName = newSessionName.trim();
    if (!trimmedName) {
      alert('Session Name is required (e.g. 2027–28).');
      return;
    }

    if (!newSessionStart || !newSessionEnd) {
      alert('Start Date and End Date are required.');
      return;
    }

    if (new Date(newSessionEnd) <= new Date(newSessionStart)) {
      alert('End Date must be after Start Date.');
      return;
    }

    const createdSessionId = trimmedName.replace(/\s+/g, '').replace('–', '-');
    if (sessions.some((s) => s.name === trimmedName || s.id === createdSessionId)) {
      alert(`Academic session ${trimmedName} already exists.`);
      return;
    }

    try {
      const res = await apiFetch<any>('/api/academic-sessions', {
        method: 'POST',
        body: JSON.stringify({
          name: trimmedName,
          id: createdSessionId,
          startDate: newSessionStart,
          endDate: newSessionEnd,
          isActive: newSessionIsActive,
          copyForward: newSessionCopyForward,
          carryFees: newSessionCarryFees
        })
      });

      if (res?.success && res.data) {
        const createdId = res.data.id || createdSessionId;
        if (newSessionIsActive) {
          setSelectedSessionId(createdId);
          setActiveSessionId(createdId);
        }
        setCreateSessionModalOpen(false);
        setManageSessionsModalOpen(false);
        alert(`Academic session ${trimmedName} created successfully.`);
        await refreshAll(newSessionIsActive ? createdId : selectedSessionId);
      } else {
        alert(res?.error || 'Unable to create academic session. Please check the console.');
      }
    } catch (err: any) {
      console.error('Session creation failed:', err);
      alert(err?.message || 'Unable to create academic session. Please check the console.');
    }
  };

  const handleActivateSession = async (sessId: string) => {
    await apiFetch(`/api/academic-sessions/${sessId}/activate`, { method: 'PUT' });
    setActiveSessionId(sessId);
    setSelectedSessionId(sessId);
    await refreshAll(sessId);
  };

  const handlePromoteStudents = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!promoToSessionId || selectedStuForPromo.length === 0) return;

    await apiFetch('/api/promote-students', {
      method: 'POST',
      body: JSON.stringify({
        fromSessionId: selectedSessionId,
        toSessionId: promoToSessionId,
        toClass: promoToClass,
        studentIds: selectedStuForPromo,
        action: 'promote'
      })
    });

    setPromoteModalOpen(false);
    setSelectedStuForPromo([]);
    await refreshAll(selectedSessionId);
  };

  // --- SUBJECT MASTER HANDLERS ---
  const filteredMasterSubjects = (masterSubjectsList || []).filter((sub: any) => {
    if (mstSubSearch) {
      const q = mstSubSearch.toLowerCase();
      const matchName = (sub.name || '').toLowerCase().includes(q);
      const matchCode = (sub.code || '').toLowerCase().includes(q);
      if (!matchName && !matchCode) return false;
    }
    if (mstSubCategory !== 'All' && sub.type !== mstSubCategory) return false;
    if (mstSubStatusFilter !== 'All' && sub.status !== mstSubStatusFilter) return false;
    return true;
  });

  const openEditMasterSubject = (sub: any) => {
    setEditingMasterSubject(sub);
    setMSubName(sub.name || '');
    setMSubCode(sub.code || '');
    setMSubCategory(sub.type || 'Theory');
    setMSubMaxMarks(sub.maxMarks || 100);
    setMSubPassingMarks(sub.passingMarks || 33);
    setMSubStatus(sub.status || 'Active');
    setIsAddMasterSubjectOpen(true);
  };

  const handleSaveMasterSubject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!mSubName.trim() || !mSubCode.trim()) {
      alert('Subject Name and Code are required.');
      return;
    }

    if (editingMasterSubject) {
      academicService.updateMasterSubject(editingMasterSubject.id, {
        name: mSubName.trim(),
        code: mSubCode.trim().toUpperCase(),
        type: mSubCategory,
        maxMarks: Number(mSubMaxMarks || 100),
        passingMarks: Number(mSubPassingMarks || 33),
        status: mSubStatus
      });
    } else {
      academicService.addMasterSubject({
        name: mSubName.trim(),
        code: mSubCode.trim().toUpperCase(),
        type: mSubCategory,
        maxMarks: Number(mSubMaxMarks || 100),
        passingMarks: Number(mSubPassingMarks || 33),
        status: mSubStatus
      });
    }

    setMasterSubjectsList(academicService.getMasterSubjects());
    setIsAddMasterSubjectOpen(false);
    setEditingMasterSubject(null);
  };

  const handleDeleteMasterSubject = (sub: any) => {
    if (!window.confirm(`Are you sure you want to delete/deactivate subject "${sub.name}" (${sub.code})?`)) return;
    academicService.deleteMasterSubject(sub.id);
    setMasterSubjectsList(academicService.getMasterSubjects());
  };

  // --- CLASS SUBJECTS MAPPING HANDLERS ---
  const currentClassAssignedSubs = academicService.getSubjects(csClassFilter, selectedSessionId);

  const openEditClassSubject = (sub: any) => {
    setEditingClassSubject(sub);
    setCsSubjectId(sub.id || sub.name);
    const empMatch = employees.find(e => e.name === sub.teacherName || e.id === sub.teacherId);
    setCsTeacherId(empMatch ? empMatch.id : '');
    setCsMaxMarks(sub.maxMarks || 100);
    setCsPassingMarks(sub.passingMarks || 33);
    setCsType(sub.type || 'Theory');
    setIsAssignSubjectOpen(true);
  };

  const handleSaveClassSubject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!csSubjectId) {
      alert('Please select or enter a subject name.');
      return;
    }

    const masterSub = masterSubjectsList.find(s => s.id === csSubjectId || s.name.toLowerCase() === csSubjectId.toLowerCase());
    const subName = masterSub ? masterSub.name : csSubjectId;
    const subCode = masterSub ? masterSub.code : (subName.slice(0, 4).toUpperCase());

    const teacherObj = employees.find(e => e.id === csTeacherId || e.name === csTeacherId);

    if (editingClassSubject) {
      academicService.updateSubject(editingClassSubject.id, {
        name: subName,
        code: subCode,
        maxMarks: Number(csMaxMarks || 100),
        passingMarks: Number(csPassingMarks || 33),
        teacherId: teacherObj ? teacherObj.id : '',
        teacherName: teacherObj ? teacherObj.name : 'Unassigned',
        type: csType
      });
    } else {
      academicService.addSubject({
        academicSessionId: selectedSessionId,
        className: csClassFilter,
        section: csSecFilter !== 'All' ? csSecFilter : 'A',
        name: subName,
        code: subCode,
        maxMarks: Number(csMaxMarks || 100),
        passingMarks: Number(csPassingMarks || 33),
        teacherId: teacherObj ? teacherObj.id : '',
        teacherName: teacherObj ? teacherObj.name : 'Unassigned',
        type: csType
      });
    }

    setIsAssignSubjectOpen(false);
    setEditingClassSubject(null);
    refreshAll(selectedSessionId);
  };

  const handleRemoveClassSubject = (sub: any) => {
    const usage = academicService.checkSubjectUsage(sub.id);
    if (usage.count > 0) {
      if (!window.confirm(`Warning: This subject is referenced in ${usage.count} marks/exam records. Deleting it may alter academic data. Remove anyway?`)) return;
    } else {
      if (!window.confirm(`Remove "${sub.name}" from ${csClassFilter}?`)) return;
    }
    academicService.deleteSubject(sub.id);
    refreshAll(selectedSessionId);
  };

  // Sidebar Menu Items
  const sidebarItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'students', label: 'Students', icon: GraduationCap, badge: students.length },
    { id: 'teachers', label: 'Employees / Teachers', icon: Users, badge: employees.length },
    { id: 'classes', label: 'Classes & Sections', icon: BookOpen },
    { id: 'subjects', label: 'Subjects Master', icon: BookOpen },
    { id: 'class-subjects', label: 'Class Subjects', icon: BookOpen },
    { id: 'attendance', label: 'Student Attendance', icon: CheckSquare },
    { id: 'employee-attendance', label: 'Employee Attendance', icon: UserCheck },
    { id: 'homework', label: 'Homework', icon: BookOpen },
    { id: 'exams', label: 'Exams', icon: FileText },
    { id: 'marks', label: 'Marks', icon: Award },
    { id: 'results', label: 'Results', icon: Award },
    { id: 'admitcards', label: 'Admit Cards', icon: FileCheck },
    { id: 'fees', label: 'Fees', icon: CreditCard },
    { id: 'notices', label: 'Notices', icon: Bell },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'timetable', label: 'Timetable', icon: Clock },
    { id: 'reports', label: 'Reports', icon: Printer },
    { id: 'transport', label: 'Bus / Transport', icon: BusIcon },
    { id: 'certificates', label: 'Certificates', icon: Award },
    { id: 'settings', label: 'Settings', icon: Shield }
  ];

  // Colorful Quick Actions (15 Modules in 3 Rows)
  const quickActions = [
    { id: 'students', label: 'Students', sub: 'Manage student records', icon: GraduationCap, color: '#1769E0' },
    { id: 'teachers', label: 'Employees / Teachers', sub: 'Teachers & staff roster', icon: Users, color: '#16A34A' },
    { id: 'classes', label: 'Classes & Sections', sub: 'Manage classes & sections', icon: BookOpen, color: '#F97316' },
    { id: 'attendance', label: 'Attendance', sub: 'View & mark attendance', icon: CheckSquare, color: '#EF4444' },
    { id: 'homework', label: 'Homework', sub: 'Assignments & homework', icon: BookOpen, color: '#7C3AED' },
    { id: 'exams', label: 'Exams', sub: 'Exams & schedules', icon: FileText, color: '#4F46E5' },
    { id: 'marks', label: 'Marks', sub: 'Enter & view student marks', icon: Award, color: '#EC4899' },
    { id: 'results', label: 'Results', sub: 'Report cards & results', icon: Award, color: '#059669' },
    { id: 'admitcards', label: 'Admit Cards', sub: 'Exam admit cards', icon: FileCheck, color: '#D97706' },
    { id: 'fees', label: 'Fees', sub: 'Fee structure & dues', icon: CreditCard, color: '#0891B2' },
    { id: 'notices', label: 'Notices', sub: 'School notices & news', icon: Bell, color: '#F43F5E' },
    { id: 'notifications', label: 'Notifications', sub: 'System alerts & updates', icon: Bell, color: '#475569' },
    { id: 'timetable', label: 'Timetable', sub: 'Class time schedule', icon: Clock, color: '#8B5CF6' },
    { id: 'reports', label: 'Reports', sub: 'ERP reports & analytics', icon: Printer, color: '#0D9488' },
    { id: 'settings', label: 'Settings', sub: 'System & school settings', icon: Shield, color: '#92400E' }
  ];

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      minHeight: '100vh',
      backgroundColor: '#F1F5F9',
      color: '#0F172A',
      fontFamily: 'Inter, system-ui, sans-serif'
    }}>
      {/* 1. TOP GLOBAL HEADER */}
      <header style={{
        height: 68,
        backgroundColor: '#0F172A',
        color: '#FFFFFF',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 24px',
        boxShadow: '0 4px 14px rgba(0,0,0,0.25)',
        zIndex: 100,
        position: 'sticky',
        top: 0
      }}>
        {/* Left Branding */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{
            width: 44,
            height: 44,
            borderRadius: 12,
            background: 'linear-gradient(135deg, #1769E0 0%, #1255B8 100%)',
            color: '#FFFFFF',
            fontWeight: 900,
            fontSize: 20,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 12px rgba(23,105,224,0.4)',
            letterSpacing: '-0.5px'
          }}>
            AVM
          </div>
          <div>
            <div style={{ fontSize: 18, fontWeight: 900, color: '#FFFFFF', letterSpacing: '-0.2px', lineHeight: 1.1 }}>
              Adarsh Vidya Mandir
            </div>
            <div style={{ fontSize: 11, color: '#94A3B8', fontWeight: 700, letterSpacing: '0.4px', marginTop: 2 }}>
              Kajraili • Bhagalpur
            </div>
          </div>
        </div>

        {/* Center Session Badge & Context */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            backgroundColor: sessions.find((s) => s.id === selectedSessionId)?.isActive ? '#FEF08A' : '#E2E8F0',
            color: sessions.find((s) => s.id === selectedSessionId)?.isActive ? '#854D0E' : '#334155',
            fontWeight: 800,
            fontSize: 13,
            padding: '6px 16px',
            borderRadius: 24,
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
          }}>
            <Calendar size={15} />
            <span>Academic Session: <strong>{sessions.find((s) => s.id === selectedSessionId)?.name || selectedSessionId}</strong> {sessions.find((s) => s.id === selectedSessionId)?.isActive ? '• ACTIVE' : '• HISTORICAL / ARCHIVED'}</span>
          </div>

          {!sessions.find((s) => s.id === selectedSessionId)?.isActive && (
            <button
              onClick={() => handleActivateSession(selectedSessionId)}
              style={{
                backgroundColor: '#16A34A',
                color: '#FFF',
                border: 'none',
                borderRadius: 20,
                padding: '6px 14px',
                fontSize: 11,
                fontWeight: 800,
                cursor: 'pointer',
                boxShadow: '0 2px 8px rgba(22,163,74,0.3)'
              }}
            >
              Set as Active Session
            </button>
          )}
        </div>

        {/* Right Admin Profile & Notifications */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
          <div
            onClick={() => setActiveTab('notifications')}
            style={{ position: 'relative', cursor: 'pointer', padding: 6, borderRadius: '50%', backgroundColor: 'rgba(255,255,255,0.08)' }}
          >
            <Bell size={20} color="#F8FAFC" />
            <span style={{
              position: 'absolute',
              top: 2,
              right: 2,
              backgroundColor: '#EF4444',
              color: '#FFF',
              fontSize: 10,
              fontWeight: 800,
              width: 16,
              height: 16,
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              3
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10, backgroundColor: 'rgba(255,255,255,0.08)', padding: '5px 12px 5px 6px', borderRadius: 24 }}>
            <div style={{
              width: 34,
              height: 34,
              borderRadius: '50%',
              backgroundColor: '#1769E0',
              color: '#FFFFFF',
              fontWeight: 800,
              fontSize: 14,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              A
            </div>
            <div style={{ textAlign: 'left', lineHeight: 1.1 }}>
              <div style={{ fontSize: 13, fontWeight: 800, color: '#FFFFFF' }}>Admin</div>
              <div style={{ fontSize: 10, color: '#CBD5E1', fontWeight: 600 }}>Principal / Administrator</div>
            </div>
            <ChevronDown size={14} color="#94A3B8" />
          </div>
        </div>
      </header>

      <div style={{ display: 'flex', flex: 1 }}>
        {/* 2. LEFT SIDEBAR (COLLAPSIBLE) */}
        <aside style={{
          position: 'relative',
          width: isSidebarCollapsed ? 72 : 260,
          backgroundColor: '#0F172A',
          color: '#F8FAFC',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: isSidebarCollapsed ? '16px 8px' : '16px 12px',
          flexShrink: 0,
          borderRight: '1px solid #1E293B',
          transition: 'width 0.25s ease-in-out, padding 0.25s ease-in-out',
          zIndex: 90
        }}>
          {/* Edge Toggle Collapse Button */}
          <button
            onClick={toggleSidebar}
            title={isSidebarCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
            style={{
              position: 'absolute',
              top: 20,
              right: -13,
              width: 26,
              height: 26,
              borderRadius: '50%',
              backgroundColor: '#1769E0',
              color: '#FFFFFF',
              border: '2px solid #0F172A',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              zIndex: 99,
              boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
              transition: 'transform 0.25s ease, background-color 0.15s ease'
            }}
          >
            {isSidebarCollapsed ? <ChevronRight size={15} /> : <ChevronLeft size={15} />}
          </button>

          <div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4, overflowY: 'auto', maxHeight: 'calc(100vh - 160px)', paddingRight: isSidebarCollapsed ? 0 : 4 }}>
              {sidebarItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;

                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveTab(item.id as any)}
                    title={item.label}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: isSidebarCollapsed ? 'center' : 'space-between',
                      padding: isSidebarCollapsed ? '12px 0' : '10px 14px',
                      borderRadius: 12,
                      border: 'none',
                      backgroundColor: isActive ? '#1769E0' : 'transparent',
                      color: isActive ? '#FFFFFF' : '#94A3B8',
                      fontWeight: isActive ? 800 : 600,
                      fontSize: 13,
                      cursor: 'pointer',
                      textAlign: isSidebarCollapsed ? 'center' : 'left',
                      transition: 'all 0.15s ease',
                      position: 'relative'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, justifyContent: isSidebarCollapsed ? 'center' : 'flex-start' }}>
                      <Icon size={18} color={isActive ? '#FFFFFF' : '#94A3B8'} />
                      {!isSidebarCollapsed && <span>{item.label}</span>}
                    </div>

                    {!isSidebarCollapsed && item.badge !== undefined && (
                      <span style={{
                        backgroundColor: isActive ? 'rgba(255,255,255,0.25)' : '#1E293B',
                        color: '#FFFFFF',
                        fontSize: 11,
                        fontWeight: 800,
                        padding: '2px 8px',
                        borderRadius: 12
                      }}>
                        {item.badge}
                      </span>
                    )}

                    {isSidebarCollapsed && item.badge !== undefined && item.badge > 0 && (
                      <span style={{
                        position: 'absolute',
                        top: 4,
                        right: 8,
                        backgroundColor: '#1769E0',
                        color: '#FFFFFF',
                        fontSize: 9,
                        fontWeight: 900,
                        width: 16,
                        height: 16,
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}>
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, paddingTop: 12, borderTop: '1px solid #1E293B' }}>
            {!isSidebarCollapsed ? (
              <>
                <div style={{
                  backgroundColor: '#1E293B',
                  borderRadius: 12,
                  padding: '10px 12px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 8
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <Calendar size={15} color="#1769E0" />
                      <span style={{ fontSize: 11, fontWeight: 800, color: '#CBD5E1' }}>Academic Session</span>
                    </div>
                    <button
                      onClick={() => setManageSessionsModalOpen(true)}
                      style={{
                        backgroundColor: '#1769E0',
                        color: '#FFF',
                        border: 'none',
                        borderRadius: 6,
                        padding: '2px 8px',
                        fontSize: 10,
                        fontWeight: 800,
                        cursor: 'pointer'
                      }}
                    >
                      Manage
                    </button>
                  </div>

                  <select
                    value={selectedSessionId}
                    onChange={(e) => {
                      setSelectedSessionId(e.target.value);
                      refreshAll(e.target.value);
                    }}
                    style={{
                      backgroundColor: '#0F172A',
                      color: '#FFFFFF',
                      border: '1px solid #334155',
                      borderRadius: 8,
                      padding: '6px 8px',
                      fontSize: 12,
                      fontWeight: 800,
                      cursor: 'pointer',
                      outline: 'none',
                      width: '100%'
                    }}
                  >
                    {sessions.map((s) => (
                      <option key={s.id} value={s.id} style={{ backgroundColor: '#1E293B' }}>
                        {s.name} {s.isActive ? '(ACTIVE)' : s.status === 'archived' ? '(HISTORICAL)' : '(FUTURE)'}
                      </option>
                    ))}
                  </select>
                </div>

                {onLogout && (
                  <button
                    onClick={onLogout}
                    style={{
                      width: '100%',
                      backgroundColor: '#EF4444',
                      color: '#FFFFFF',
                      border: 'none',
                      borderRadius: 10,
                      padding: '10px',
                      fontSize: 12,
                      fontWeight: 800,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 8
                    }}
                  >
                    <LogOut size={16} /> Sign Out Admin
                  </button>
                )}
              </>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, alignItems: 'center' }}>
                <button
                  onClick={() => setManageSessionsModalOpen(true)}
                  title={`Academic Session: ${selectedSessionId}`}
                  style={{
                    width: 42,
                    height: 42,
                    borderRadius: 10,
                    backgroundColor: '#1E293B',
                    color: '#1769E0',
                    border: '1px solid #334155',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer'
                  }}
                >
                  <Calendar size={18} />
                </button>

                {onLogout && (
                  <button
                    onClick={onLogout}
                    title="Sign Out Admin"
                    style={{
                      width: 42,
                      height: 42,
                      borderRadius: 10,
                      backgroundColor: '#EF4444',
                      color: '#FFFFFF',
                      border: 'none',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer'
                    }}
                  >
                    <LogOut size={18} />
                  </button>
                )}
              </div>
            )}
          </div>
        </aside>

        {/* 3. MAIN DASHBOARD CONTENT AREA */}
        <main style={{
          flex: 1,
          minWidth: 0,
          padding: 24,
          overflowY: 'auto',
          maxHeight: 'calc(100vh - 68px)',
          transition: 'all 0.25s ease-in-out'
        }}>
          {/* Top Banner Bar */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 20,
            backgroundColor: '#FFFFFF',
            padding: '16px 20px',
            borderRadius: 16,
            boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
            border: '1px solid #E2E8F0'
          }}>
            <div>
              <h1 style={{ fontSize: 24, fontWeight: 900, color: '#0F172A', margin: 0, textTransform: 'capitalize' }}>
                {activeTab === 'dashboard' ? 'Dashboard' : activeTab === 'reports' ? 'Official Document & Print Center' : activeTab === 'admitcards' ? 'Admit Cards Module' : activeTab === 'class-subjects' ? 'Class Subjects' : `${activeTab.replace('-', ' ')} Module`}
              </h1>
              <p style={{ fontSize: 13, color: '#64748B', margin: '2px 0 0 0', fontWeight: 600 }}>
                Welcome to Adarsh Vidya Mandir Admin Panel
              </p>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, backgroundColor: '#F8FAFC', padding: '8px 16px', borderRadius: 12, border: '1px solid #E2E8F0' }}>
                <Calendar size={18} color="#1769E0" />
                <div style={{ fontSize: 12, fontWeight: 700, color: '#334155' }}>
                  {new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })} • Academic Session: <strong style={{ color: '#1769E0' }}>2026–27 ACTIVE</strong>
                </div>
              </div>

              {/* Header Notification Bell Icon with Unread Count & Quick Panel */}
              {(() => {
                const allNotifs = notificationService.getAllNotifications();
                const unreadNotifCount = allNotifs.reduce((acc, n) => acc + (n.unreadCount || 0), 0);
                const recentNotifs = allNotifs.slice(0, 5);
                return (
                  <div style={{ position: 'relative' }}>
                    <button
                      onClick={() => setBellDropdownOpen(!bellDropdownOpen)}
                      style={{
                        backgroundColor: '#EFF6FF',
                        color: '#1769E0',
                        border: '1px solid #BFDBFE',
                        borderRadius: 12,
                        padding: '8px 14px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                        fontWeight: 800,
                        fontSize: 13
                      }}
                      title="Notifications Center"
                    >
                      <Bell size={18} />
                      {unreadNotifCount > 0 && (
                        <span style={{
                          backgroundColor: '#EF4444',
                          color: '#FFFFFF',
                          fontSize: 11,
                          fontWeight: 900,
                          borderRadius: 10,
                          padding: '2px 7px',
                          lineHeight: 1
                        }}>
                          {unreadNotifCount}
                        </span>
                      )}
                    </button>

                    {bellDropdownOpen && (
                      <div style={{
                        position: 'absolute',
                        right: 0,
                        top: 46,
                        width: 340,
                        backgroundColor: '#FFFFFF',
                        borderRadius: 14,
                        boxShadow: '0 10px 30px rgba(0,0,0,0.15)',
                        border: '1px solid #E2E8F0',
                        zIndex: 9999,
                        padding: 16
                      }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, borderBottom: '1px solid #F1F5F9', paddingBottom: 8 }}>
                          <span style={{ fontWeight: 900, fontSize: 14, color: '#0F172A' }}>Notifications</span>
                          <button
                            onClick={() => notificationService.markAllAsRead()}
                            style={{ background: 'none', border: 'none', fontSize: 11, color: '#1769E0', fontWeight: 700, cursor: 'pointer' }}
                          >
                            Mark all read
                          </button>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 280, overflowY: 'auto' }}>
                          {recentNotifs.length === 0 ? (
                            <div style={{ fontSize: 12, color: '#94A3B8', textAlign: 'center', padding: 12 }}>No notifications yet</div>
                          ) : (
                            recentNotifs.map((n) => (
                              <div
                                key={n.id}
                                onClick={() => {
                                  notificationService.markAsRead(n.id);
                                  setViewNotifDetails(n);
                                  setBellDropdownOpen(false);
                                }}
                                style={{
                                  padding: 10,
                                  borderRadius: 8,
                                  backgroundColor: n.unreadCount ? '#EFF6FF' : '#F8FAFC',
                                  borderLeft: `3px solid ${n.priority === 'Urgent' || n.priority === 'High' ? '#EF4444' : '#1769E0'}`,
                                  cursor: 'pointer'
                                }}
                              >
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, fontWeight: 800, color: '#0F172A' }}>
                                  <span>{n.title}</span>
                                  {n.unreadCount ? <span style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: '#1769E0', display: 'inline-block' }} /> : null}
                                </div>
                                <div style={{ fontSize: 11, color: '#64748B', marginTop: 3, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                                  {n.message}
                                </div>
                                <div style={{ fontSize: 10, color: '#94A3B8', marginTop: 4 }}>{n.sentAt || n.createdAt}</div>
                              </div>
                            ))
                          )}
                        </div>
                        <button
                          onClick={() => { setActiveTab('notifications'); setBellDropdownOpen(false); }}
                          style={{
                            width: '100%',
                            marginTop: 12,
                            padding: '8px 0',
                            backgroundColor: '#1769E0',
                            color: '#FFFFFF',
                            border: 'none',
                            borderRadius: 8,
                            fontSize: 12,
                            fontWeight: 800,
                            cursor: 'pointer'
                          }}
                        >
                          View All Notifications Center →
                        </button>
                      </div>
                    )}
                  </div>
                );
              })()}
            </div>
          </div>



          {/* ========================================================================= */}
          {/* TAB 1: DASHBOARD OVERVIEW HOME PAGE */}
          {/* ========================================================================= */}
          {activeTab === 'dashboard' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              {/* TOP STAT CARDS ROW */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
                <div className="avm-card" style={{ padding: 20, borderLeft: '5px solid #1769E0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 800, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Total Students</div>
                    <div style={{ fontSize: 32, fontWeight: 900, color: '#0F172A', marginTop: 4 }}>{totalStudentsCount}</div>
                    <div style={{ fontSize: 12, color: '#16A34A', fontWeight: 700, marginTop: 4 }}>+12 this month</div>
                  </div>
                  <div style={{ width: 54, height: 54, borderRadius: 16, backgroundColor: '#EFF6FF', color: '#1769E0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <GraduationCap size={28} />
                  </div>
                </div>

                <div className="avm-card" style={{ padding: 20, borderLeft: '5px solid #16A34A', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 800, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Total Employees</div>
                    <div style={{ fontSize: 32, fontWeight: 900, color: '#0F172A', marginTop: 4 }}>{employees.length || 18}</div>
                    <div style={{ fontSize: 12, color: '#16A34A', fontWeight: 700, marginTop: 4 }}>+2 new</div>
                  </div>
                  <div style={{ width: 54, height: 54, borderRadius: 16, backgroundColor: '#F0FDFA', color: '#16A34A', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <UserCheck size={28} />
                  </div>
                </div>

                <div className="avm-card" style={{ padding: 20, borderLeft: '5px solid #F97316', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 800, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Total Classes</div>
                    <div style={{ fontSize: 32, fontWeight: 900, color: '#0F172A', marginTop: 4 }}>14</div>
                    <div style={{ fontSize: 12, color: '#64748B', fontWeight: 700, marginTop: 4 }}>Nursery to Class 8</div>
                  </div>
                  <div style={{ width: 54, height: 54, borderRadius: 16, backgroundColor: '#FFF7ED', color: '#F97316', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <School size={28} />
                  </div>
                </div>

                <div className="avm-card" style={{ padding: 20, borderLeft: '5px solid #7C3AED', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 800, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Today Attendance</div>
                    <div style={{ fontSize: 32, fontWeight: 900, color: '#7C3AED', marginTop: 4 }}>{attendancePercentage}%</div>
                    <div style={{ fontSize: 12, color: '#16A34A', fontWeight: 700, marginTop: 4 }}>{presentCount} / {totalStudentsCount} Present</div>
                  </div>
                  <div style={{ width: 54, height: 54, borderRadius: 16, backgroundColor: '#F3E8FF', color: '#7C3AED', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <CalendarCheck size={28} />
                  </div>
                </div>
              </div>

              {/* OVERVIEWS & CHARTS ROW */}
              <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 16 }}>
                <div className="avm-card" style={{ padding: 20 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                    <h3 style={{ fontSize: 16, fontWeight: 800, color: '#0F172A', margin: 0 }}>Student Overview</h3>
                    <span style={{ fontSize: 11, color: '#64748B', fontWeight: 700 }}>Class Distribution</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', height: 180, padding: '0 10px', borderBottom: '2px solid #E2E8F0' }}>
                    {[
                      { label: 'Nur', val: 24 }, { label: 'LKG', val: 24 }, { label: 'UKG', val: 28 },
                      { label: '1', val: 32 }, { label: '2', val: 38 }, { label: '3', val: 28 },
                      { label: '4', val: 52 }, { label: '5', val: 56 }, { label: '6', val: 56 },
                      { label: '7', val: 62 }, { label: '8', val: 68 }
                    ].map((bar, i) => (
                      <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, flex: 1 }}>
                        <span style={{ fontSize: 10, fontWeight: 800, color: '#1769E0' }}>{bar.val}</span>
                        <div style={{ width: 22, height: `${Math.min(130, bar.val * 2.2)}px`, backgroundColor: i === 7 ? '#1769E0' : '#93C5FD', borderRadius: '6px 6px 0 0' }} />
                        <span style={{ fontSize: 11, fontWeight: 700, color: '#64748B' }}>{bar.label}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="avm-card" style={{ padding: 20 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                    <h3 style={{ fontSize: 16, fontWeight: 800, color: '#0F172A', margin: 0 }}>Attendance Overview</h3>
                    <span style={{ fontSize: 11, color: '#64748B', fontWeight: 700 }}>Today's Real-time</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 24, padding: '10px 0' }}>
                    <div style={{
                      width: 140, height: 140, borderRadius: '50%',
                      background: `conic-gradient(#16A34A 0% ${attendancePercentage}%, #EF4444 ${attendancePercentage}% ${attendancePercentage + 6}%, #F59E0B ${attendancePercentage + 6}% 100%)`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
                    }}>
                      <div style={{ width: 100, height: 100, borderRadius: '50%', backgroundColor: '#FFFFFF', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
                        <div style={{ fontSize: 24, fontWeight: 900, color: '#16A34A' }}>{attendancePercentage}%</div>
                        <div style={{ fontSize: 10, color: '#64748B', fontWeight: 700 }}>Today's Attendance</div>
                      </div>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10, flex: 1 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 13 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}><span style={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: '#16A34A' }} /><span>Present</span></div>
                        <strong>{presentCount}</strong>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 13 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}><span style={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: '#EF4444' }} /><span>Absent</span></div>
                        <strong>{absentCount}</strong>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 13 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}><span style={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: '#F59E0B' }} /><span>Leave</span></div>
                        <strong>{leaveCount}</strong>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 13, borderTop: '1px solid #E2E8F0', paddingTop: 6 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}><span style={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: '#94A3B8' }} /><span>Total</span></div>
                        <strong>{totalStudentsCount}</strong>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* QUICK ACCESS MODULES SECTION (POLISHED & ALIGNED) */}
              <div className="avm-card" style={{ padding: 20 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                  <h3 style={{ fontSize: 16, fontWeight: 800, color: '#0F172A', margin: 0 }}>
                    Quick Access Modules
                  </h3>
                  <span style={{ fontSize: 11, color: '#64748B', fontWeight: 600 }}>Click module to open</span>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 14 }}>
                  {quickActions.map((qa) => {
                    const QAIcon = qa.icon;
                    return (
                      <div
                        key={qa.id}
                        onClick={() => setActiveTab(qa.id as any)}
                        style={{
                          backgroundColor: qa.color,
                          color: '#FFFFFF',
                          borderRadius: 14,
                          padding: '16px 12px',
                          cursor: 'pointer',
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          textAlign: 'center',
                          gap: 8,
                          boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                          transition: 'transform 0.15s ease, box-shadow 0.15s ease'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.transform = 'translateY(-2px)';
                          e.currentTarget.style.boxShadow = '0 6px 16px rgba(0,0,0,0.15)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.transform = 'translateY(0)';
                          e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.08)';
                        }}
                      >
                        <div style={{
                          width: 40,
                          height: 40,
                          borderRadius: 10,
                          backgroundColor: 'rgba(255,255,255,0.22)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}>
                          <QAIcon size={20} />
                        </div>
                        <div>
                          <div style={{ fontSize: 13, fontWeight: 900, letterSpacing: '0.1px' }}>{qa.label}</div>
                          <div style={{ fontSize: 10, opacity: 0.9, marginTop: 2, fontWeight: 600, lineHeight: 1.2 }}>{qa.sub}</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* BUS / TRANSPORT MODULE TAB */}
          {/* ========================================================================= */}
          {activeTab === 'transport' && (
            <TransportModule students={students} />
          )}

          {/* ========================================================================= */}
          {/* CERTIFICATES MANAGEMENT MODULE TAB */}
          {/* ========================================================================= */}
          {activeTab === 'certificates' && (
            <CertificatesModule students={students} employees={employees} />
          )}

          {/* ========================================================================= */}
          {/* TAB 2: STUDENTS DIRECTORY PAGE */}
          {/* ========================================================================= */}
          {activeTab === 'students' && (
            <div className="avm-card" style={{ padding: 20 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <div style={{ display: 'flex', gap: 12, alignItems: 'center', flex: 1, maxWidth: 600 }}>
                  <div style={{ position: 'relative', flex: 1 }}>
                    <Search size={18} style={{ position: 'absolute', left: 12, top: 11, color: '#94A3B8' }} />
                    <input
                      type="text"
                      className="avm-input"
                      style={{ paddingLeft: 38 }}
                      placeholder="Search student by name, admission no or roll..."
                      value={studentSearch}
                      onChange={(e) => setStudentSearch(e.target.value)}
                    />
                  </div>

                  <select
                    className="avm-input"
                    style={{ width: 150 }}
                    value={classFilter}
                    onChange={(e) => setClassFilter(e.target.value)}
                  >
                    <option value="All">All Classes</option>
                    {mockSchoolClasses.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>

                <div style={{ display: 'flex', gap: 10 }}>
                  <button
                    onClick={() => setPromoteModalOpen(true)}
                    style={{
                      backgroundColor: '#7C3AED',
                      color: '#FFFFFF',
                      border: 'none',
                      borderRadius: 10,
                      padding: '10px 16px',
                      fontSize: 13,
                      fontWeight: 700,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      boxShadow: '0 4px 12px rgba(124,58,237,0.3)'
                    }}
                  >
                    <RefreshCw size={16} />
                    <span>Student Promotion</span>
                  </button>

                  <button
                    className="avm-btn-primary"
                    onClick={() => { resetStuForm(); setAddStudentModalOpen(true); }}
                  >
                    <Plus size={16} /> Add Student
                  </button>
                </div>
              </div>

              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                  <thead>
                    <tr style={{ backgroundColor: '#F8FAFC', borderBottom: '2px solid #E2E8F0', color: '#64748B', textAlign: 'left' }}>
                      <th style={{ padding: 12 }}>Student</th>
                      <th style={{ padding: 12 }}>Admission No</th>
                      <th style={{ padding: 12 }}>Class & Sec</th>
                      <th style={{ padding: 12 }}>Roll No</th>
                      <th style={{ padding: 12 }}>Father's Name</th>
                      <th style={{ padding: 12 }}>Guardian Phone</th>
                      <th style={{ padding: 12 }}>Status</th>
                      <th style={{ padding: 12, textAlign: 'right' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredStudents.map((s) => (
                      <tr key={s.id} style={{ borderBottom: '1px solid #F1F5F9' }}>
                        <td style={{ padding: 12 }}>
                          <div
                            onClick={() => setViewStudent(s)}
                            style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}
                          >
                            <img src={s.photo || 'https://images.unsplash.com/photo-1544717305-2782549b5136?w=150'} alt={s.name} style={{ width: 36, height: 36, borderRadius: '50%', objectFit: 'cover' }} />
                            <span style={{ fontWeight: 800, color: '#1769E0', textDecoration: 'underline' }}>{s.name}</span>
                          </div>
                        </td>
                        <td style={{ padding: 12, fontWeight: 800, color: '#1769E0' }}>{s.admissionNo}</td>
                        <td style={{ padding: 12, fontWeight: 700 }}>{classService.formatClassDisplay(s.className, s.section)}</td>
                        <td style={{ padding: 12, fontWeight: 700 }}>{s.rollNo}</td>
                        <td style={{ padding: 12 }}>{s.fatherName}</td>
                        <td style={{ padding: 12, color: '#64748B' }}>{s.phone}</td>
                        <td style={{ padding: 12 }}>
                          <span style={{ backgroundColor: '#DCFCE7', color: '#16A34A', fontWeight: 800, padding: '2px 8px', borderRadius: 10, fontSize: 11 }}>
                            {s.status || 'Active'}
                          </span>
                        </td>
                        <td style={{ padding: 12, textAlign: 'right' }}>
                          <button
                            onClick={() => setViewStudent(s)}
                            title="View Student Profile"
                            style={{ backgroundColor: '#F1F5F9', color: '#475569', border: 'none', borderRadius: 6, padding: '4px 8px', fontSize: 11, fontWeight: 800, cursor: 'pointer', marginRight: 4 }}
                          >
                            <Eye size={14} />
                          </button>
                          <button
                            onClick={() => openEditStudentModal(s)}
                            title="Edit Student"
                            style={{ backgroundColor: '#E0F2FE', color: '#0369A1', border: 'none', borderRadius: 6, padding: '4px 8px', fontSize: 11, fontWeight: 800, cursor: 'pointer', marginRight: 4 }}
                          >
                            <Edit size={14} />
                          </button>
                          <button
                            onClick={() => handleDeleteStudent(s)}
                            title="Delete Student"
                            style={{ backgroundColor: '#FEE2E2', color: '#EF4444', border: 'none', borderRadius: 6, padding: '4px 8px', cursor: 'pointer' }}
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
          )}

          {/* ========================================================================= */}
          {/* TAB 3: EMPLOYEES / TEACHERS PAGE */}
          {/* ========================================================================= */}
          {activeTab === 'teachers' && (
            <div className="avm-card" style={{ padding: 20 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <div style={{ display: 'flex', gap: 12, alignItems: 'center', flex: 1, maxWidth: 600 }}>
                  <div style={{ position: 'relative', flex: 1 }}>
                    <Search size={18} style={{ position: 'absolute', left: 12, top: 11, color: '#94A3B8' }} />
                    <input
                      type="text"
                      className="avm-input"
                      style={{ paddingLeft: 38 }}
                      placeholder="Search teacher by name, employee ID or subject..."
                      value={teacherSearch}
                      onChange={(e) => setTeacherSearch(e.target.value)}
                    />
                  </div>
                </div>

                <button
                  className="avm-btn-primary"
                  style={{ backgroundColor: '#16A34A' }}
                  onClick={() => { resetEmpForm(); setAddTeacherModalOpen(true); }}
                >
                  <Plus size={16} /> Add Teacher / Staff
                </button>
              </div>

              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                  <thead>
                    <tr style={{ backgroundColor: '#F8FAFC', borderBottom: '2px solid #E2E8F0', color: '#64748B', textAlign: 'left' }}>
                      <th style={{ padding: 12 }}>Employee ID</th>
                      <th style={{ padding: 12 }}>Photo & Name</th>
                      <th style={{ padding: 12 }}>Designation & Dept</th>
                      <th style={{ padding: 12 }}>Mobile Number</th>
                      <th style={{ padding: 12 }}>Class Teacher</th>
                      <th style={{ padding: 12 }}>Teaching Classes</th>
                      <th style={{ padding: 12 }}>Transport</th>
                      <th style={{ padding: 12 }}>Salary Status</th>
                      <th style={{ padding: 12 }}>Status</th>
                      <th style={{ padding: 12, textAlign: 'right' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredEmployees.map((e) => {
                      const transAssign = transportService.getAssignments().find(a => a.studentId === e.id || a.admissionNo === e.employeeId);
                      const busInfo = transAssign && transAssign.status === 'Active' ? transportService.getBuses().find(b => b.id === transAssign.busId) : null;
                      const isClsTeacher = e.isClassTeacher === 'Yes' || e.employeeRole === 'Class Teacher';
                      const clsTeacherText = isClsTeacher
                        ? `${e.classTeacherClass || 'Class 5'}-${e.classTeacherSection || 'A'}`
                        : '-';
                      const netSal = e.netSalary || Math.max(0, (e.basicSalary || 0) + (e.allowances || 0) - (e.deduction || 0));
                      const paidSal = e.paidSalary ?? (netSal > 0 ? netSal : 0);
                      const pendSal = Math.max(0, netSal - paidSal);
                      const salStatus = e.salaryPaymentStatus || (paidSal >= netSal && netSal > 0 ? 'Paid' : paidSal > 0 ? 'Partial' : 'Pending');

                      let salBadgeStyle = { bg: '#FEF3C7', color: '#D97706' };
                      if (salStatus === 'Paid') salBadgeStyle = { bg: '#DCFCE7', color: '#15803D' };
                      if (salStatus === 'Pending') salBadgeStyle = { bg: '#FEE2E2', color: '#B91C1C' };

                      return (
                        <tr key={e.id} style={{ borderBottom: '1px solid #F1F5F9' }}>
                          <td style={{ padding: 12, fontWeight: 800, color: '#7C3AED' }}>{e.employeeId}</td>
                          <td style={{ padding: 12 }}>
                            <div
                              onClick={() => setViewTeacher(e)}
                              style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}
                            >
                              <img src={e.photo || 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150'} alt={e.name} style={{ width: 36, height: 36, borderRadius: '50%', objectFit: 'cover' }} />
                              <div>
                                <span style={{ fontWeight: 800, color: '#1769E0', textDecoration: 'underline', display: 'block' }}>{e.name}</span>
                                <span style={{ fontSize: 11, color: '#64748B' }}>{e.email}</span>
                              </div>
                            </div>
                          </td>
                          <td style={{ padding: 12 }}>
                            <div style={{ fontWeight: 700, color: '#0F172A' }}>{e.designation}</div>
                            <div style={{ fontSize: 11, color: '#64748B' }}>Dept: {e.department || 'Academic'}</div>
                          </td>
                          <td style={{ padding: 12, color: '#0F172A', fontWeight: 600 }}>{e.phone}</td>
                          <td style={{ padding: 12 }}>
                            {isClsTeacher ? (
                              <span style={{ backgroundColor: '#EFF6FF', color: '#1769E0', padding: '3px 8px', borderRadius: 8, fontSize: 11, fontWeight: 800 }}>
                                👨🏫 {clsTeacherText}
                              </span>
                            ) : (
                              <span style={{ color: '#94A3B8', fontSize: 12 }}>No</span>
                            )}
                          </td>
                          <td style={{ padding: 12 }}>
                            {(e.assignedClasses || []).map((cls, i) => (
                              <span key={i} style={{ backgroundColor: '#F3E8FF', color: '#7C3AED', padding: '2px 6px', borderRadius: 4, fontSize: 11, marginRight: 4, fontWeight: 700 }}>
                                {cls}
                              </span>
                            ))}
                          </td>
                          <td style={{ padding: 12 }}>
                            {e.transportReq === 'Yes' || busInfo ? (
                              <span style={{ backgroundColor: '#F0FDF4', color: '#16A34A', padding: '3px 8px', borderRadius: 8, fontSize: 11, fontWeight: 800 }}>
                                🚌 {busInfo ? (busInfo.busNo || busInfo.busNumber) : 'School Bus'}
                              </span>
                            ) : (
                              <span style={{ color: '#94A3B8', fontSize: 12 }}>None</span>
                            )}
                          </td>
                          <td style={{ padding: 12 }}>
                            <span style={{
                              backgroundColor: salBadgeStyle.bg,
                              color: salBadgeStyle.color,
                              padding: '3px 8px',
                              borderRadius: 8,
                              fontSize: 11,
                              fontWeight: 800
                            }}>
                              {salStatus} (₹{paidSal.toLocaleString('en-IN')})
                            </span>
                          </td>
                          <td style={{ padding: 12 }}>
                            <span style={{
                              backgroundColor: (e.status || 'Active') === 'Active' ? '#DCFCE7' : '#FEE2E2',
                              color: (e.status || 'Active') === 'Active' ? '#15803D' : '#B91C1C',
                              padding: '2px 8px',
                              borderRadius: 10,
                              fontSize: 11,
                              fontWeight: 800
                            }}>
                              {e.status || 'Active'}
                            </span>
                          </td>
                          <td style={{ padding: 12, textAlign: 'right', whiteSpace: 'nowrap' }}>
                            <button
                              onClick={() => { setViewTeacher(e); setViewTeacherProfileTab('overview'); }}
                              title="View Profile"
                              style={{ backgroundColor: '#F1F5F9', color: '#475569', border: 'none', borderRadius: 6, padding: '5px 8px', fontSize: 11, fontWeight: 800, cursor: 'pointer', marginRight: 4 }}
                            >
                              <Eye size={14} />
                            </button>
                            <button
                              onClick={() => openEditTeacherModal(e)}
                              title="Edit Employee"
                              style={{ backgroundColor: '#E0F2FE', color: '#0369A1', border: 'none', borderRadius: 6, padding: '5px 8px', fontSize: 11, fontWeight: 800, cursor: 'pointer', marginRight: 4 }}
                            >
                              <Edit size={14} />
                            </button>
                            <button
                              onClick={() => { setViewTeacher(e); setViewTeacherProfileTab('salary'); }}
                              title="Salary & Payment History"
                              style={{ backgroundColor: '#DCFCE7', color: '#166534', border: 'none', borderRadius: 6, padding: '5px 8px', fontSize: 11, fontWeight: 800, cursor: 'pointer', marginRight: 4 }}
                            >
                              <CreditCard size={14} />
                            </button>
                            <button
                              onClick={() => { setViewTeacher(e); setViewTeacherProfileTab('transport'); }}
                              title="Transport Details"
                              style={{ backgroundColor: '#FEF3C7', color: '#B45309', border: 'none', borderRadius: 6, padding: '5px 8px', fontSize: 11, fontWeight: 800, cursor: 'pointer', marginRight: 4 }}
                            >
                              <BusIcon size={14} />
                            </button>
                            <button
                              onClick={() => {
                                const newStatus = (e.status || 'Active') === 'Active' ? 'Inactive' : 'Active';
                                const centralDB = demoDataStore.getDB();
                                centralDB.employees = (centralDB.employees || []).map((emp: any) => emp.id === e.id ? { ...emp, status: newStatus } : emp);
                                demoDataStore.saveDB(centralDB);
                                setEmployees(centralDB.employees);
                              }}
                              title={(e.status || 'Active') === 'Active' ? 'Deactivate Employee' : 'Activate Employee'}
                              style={{ backgroundColor: (e.status || 'Active') === 'Active' ? '#FEE2E2' : '#E0F2FE', color: (e.status || 'Active') === 'Active' ? '#B91C1C' : '#0369A1', border: 'none', borderRadius: 6, padding: '5px 8px', fontSize: 11, fontWeight: 800, cursor: 'pointer', marginRight: 4 }}
                            >
                              {(e.status || 'Active') === 'Active' ? 'Deactivate' : 'Activate'}
                            </button>
                            <button
                              onClick={() => handleDeleteEmployee(e)}
                              title="Delete Employee"
                              style={{ backgroundColor: '#FEE2E2', color: '#EF4444', border: 'none', borderRadius: 6, padding: '5px 8px', cursor: 'pointer' }}
                            >
                              <Trash2 size={14} />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 4: CLASSES & SECTIONS PAGE */}
          {/* ========================================================================= */}
          {activeTab === 'classes' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              {/* Header & KPI Summary */}
              <div className="avm-card" style={{ padding: '20px 24px', borderTop: '4px solid #1769E0' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
                  <div>
                    <h2 style={{ fontSize: 22, fontWeight: 900, color: '#0F172A', margin: 0, display: 'flex', alignItems: 'center', gap: 10 }}>
                      <School size={26} color="#1769E0" />
                      Classes & Sections Management
                    </h2>
                    <p style={{ fontSize: 13, color: '#64748B', margin: '4px 0 0 0' }}>
                      Manage school classes, sections, class teachers and student strength for academic session {selectedSessionId}.
                    </p>
                  </div>

                  <button
                    type="button"
                    className="avm-btn-primary"
                    onClick={() => {
                      setClsErrorMsg(null);
                      setIsAddingClass(true);
                    }}
                    style={{ display: 'flex', alignItems: 'center', gap: 6 }}
                  >
                    <Plus size={16} /> Add Class
                  </button>
                </div>

                {/* KPI Summary Cards */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 14, marginTop: 20 }}>
                  <div style={{ backgroundColor: '#F8FAFC', padding: 14, borderRadius: 10, border: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ width: 44, height: 44, borderRadius: 10, backgroundColor: '#EFF6FF', color: '#1769E0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <School size={22} />
                    </div>
                    <div>
                      <div style={{ fontSize: 11, color: '#64748B', fontWeight: 700, textTransform: 'uppercase' }}>Total Classes</div>
                      <div style={{ fontSize: 20, fontWeight: 900, color: '#0F172A' }}>{getSchoolClassesList().length}</div>
                    </div>
                  </div>

                  <div style={{ backgroundColor: '#F8FAFC', padding: 14, borderRadius: 10, border: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ width: 44, height: 44, borderRadius: 10, backgroundColor: '#F0FDF4', color: '#16A34A', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <BookOpen size={22} />
                    </div>
                    <div>
                      <div style={{ fontSize: 11, color: '#64748B', fontWeight: 700, textTransform: 'uppercase' }}>Total Sections</div>
                      <div style={{ fontSize: 20, fontWeight: 900, color: '#16A34A' }}>
                        {getSchoolClassesList().reduce((sum, c) => sum + c.sections.length, 0)}
                      </div>
                    </div>
                  </div>

                  <div style={{ backgroundColor: '#F8FAFC', padding: 14, borderRadius: 10, border: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ width: 44, height: 44, borderRadius: 10, backgroundColor: '#FEF3C7', color: '#D97706', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Users size={22} />
                    </div>
                    <div>
                      <div style={{ fontSize: 11, color: '#64748B', fontWeight: 700, textTransform: 'uppercase' }}>Total Students</div>
                      <div style={{ fontSize: 20, fontWeight: 900, color: '#D97706' }}>
                        {students.length}
                      </div>
                    </div>
                  </div>

                  <div style={{ backgroundColor: '#F8FAFC', padding: 14, borderRadius: 10, border: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ width: 44, height: 44, borderRadius: 10, backgroundColor: '#F3E8FF', color: '#7C3AED', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <CheckCircle2 size={22} />
                    </div>
                    <div>
                      <div style={{ fontSize: 11, color: '#64748B', fontWeight: 700, textTransform: 'uppercase' }}>Active Classes</div>
                      <div style={{ fontSize: 20, fontWeight: 900, color: '#7C3AED' }}>
                        {getSchoolClassesList().filter((c) => c.status === 'Active').length}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Toolbar & Filters */}
              <div className="avm-card" style={{ padding: 14, display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', gap: 12, flex: 1, minWidth: '300px' }}>
                  <div style={{ position: 'relative', flex: 1 }}>
                    <Search size={16} style={{ position: 'absolute', left: 12, top: 12, color: '#64748B' }} />
                    <input
                      type="text"
                      className="avm-input"
                      placeholder="Search class or teacher..."
                      value={clsSearchQuery}
                      onChange={(e) => setClsSearchQuery(e.target.value)}
                      style={{ paddingLeft: 36, height: 40 }}
                    />
                  </div>

                  <select
                    className="avm-input"
                    value={clsGradeFilter}
                    onChange={(e) => setClsGradeFilter(e.target.value)}
                    style={{ width: '180px', height: 40 }}
                  >
                    <option value="All">All Grade Classes</option>
                    <option value="Nursery">Nursery</option>
                    <option value="LKG">LKG</option>
                    <option value="UKG">UKG</option>
                    <option value="Class 1">Class 1</option>
                    <option value="Class 2">Class 2</option>
                    <option value="Class 3">Class 3</option>
                    <option value="Class 4">Class 4</option>
                    <option value="Class 5">Class 5</option>
                    <option value="Class 6">Class 6</option>
                    <option value="Class 7">Class 7</option>
                    <option value="Class 8">Class 8</option>
                  </select>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: '#475569' }}>
                  <Calendar size={15} color="#1769E0" />
                  <span>Academic Session:</span>
                  <strong style={{ color: '#1769E0', backgroundColor: '#EFF6FF', padding: '4px 10px', borderRadius: 6 }}>
                    {selectedSessionId}
                  </strong>
                </div>
              </div>

              {/* Class Cards Grid */}
              {(() => {
                const list = getSchoolClassesList().filter((cRec) => {
                  if (clsGradeFilter !== 'All' && cRec.name.toLowerCase() !== clsGradeFilter.toLowerCase() && cRec.grade.toLowerCase() !== clsGradeFilter.toLowerCase()) {
                    return false;
                  }
                  if (clsSearchQuery.trim()) {
                    const q = clsSearchQuery.trim().toLowerCase();
                    const mName = cRec.name.toLowerCase().includes(q);
                    const mTeacher = (cRec.classTeacherName || '').toLowerCase().includes(q);
                    const mSecTeacher = cRec.sections.some((s) => (s.teacherName || '').toLowerCase().includes(q));
                    if (!mName && !mTeacher && !mSecTeacher) return false;
                  }
                  return true;
                });

                if (list.length === 0) {
                  return (
                    <div className="avm-card" style={{ padding: 40, textAlign: 'center', color: '#64748B' }}>
                      <School size={48} color="#94A3B8" style={{ marginBottom: 12 }} />
                      <h3 style={{ fontSize: 18, fontWeight: 800, color: '#0F172A', margin: 0 }}>No Classes Found</h3>
                      <p style={{ fontSize: 13, color: '#64748B', marginTop: 6 }}>
                        Try changing your search or filter options, or click "+ Add Class" to create a new class.
                      </p>
                    </div>
                  );
                }

                return (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(330px, 1fr))', gap: 16 }}>
                    {list.map((cRec) => {
                      const classStudents = getStudentsForClass(cRec.name);
                      const totalCapacity = cRec.sections.reduce((acc, s) => acc + (s.capacity || 30), 0);
                      const activeSections = cRec.sections.filter((s) => s.status !== 'Inactive');

                      return (
                        <div
                          key={cRec.id}
                          className="avm-card"
                          style={{
                            padding: 18,
                            display: 'flex',
                            flexDirection: 'column',
                            justifyContent: 'space-between',
                            borderTop: `4px solid ${cRec.status === 'Active' ? '#1769E0' : '#94A3B8'}`
                          }}
                        >
                          <div>
                            {/* Card Top Title & Status */}
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                              <h3 style={{ fontSize: 18, fontWeight: 900, color: '#0F172A', margin: 0 }}>{cRec.name}</h3>
                              <span
                                style={{
                                  backgroundColor: cRec.status === 'Active' ? '#DCFCE7' : '#F1F5F9',
                                  color: cRec.status === 'Active' ? '#15803D' : '#64748B',
                                  fontWeight: 900,
                                  fontSize: 11,
                                  padding: '3px 10px',
                                  borderRadius: 12
                                }}
                              >
                                {cRec.status.toUpperCase()}
                              </span>
                            </div>

                            {/* Sections Pill Tags */}
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
                              <span style={{ fontSize: 12, color: '#64748B', fontWeight: 600 }}>Sections:</span>
                              {activeSections.map((sec) => (
                                <span
                                  key={sec.section}
                                  style={{
                                    backgroundColor: '#EFF6FF',
                                    color: '#1769E0',
                                    fontWeight: 800,
                                    fontSize: 12,
                                    padding: '2px 8px',
                                    borderRadius: 6,
                                    border: '1px solid #BFDBFE'
                                  }}
                                >
                                  {sec.section}
                                </span>
                              ))}
                            </div>

                            {/* Info Rows */}
                            <div style={{ backgroundColor: '#F8FAFC', padding: 10, borderRadius: 8, fontSize: 12, display: 'flex', flexDirection: 'column', gap: 6, margin: '10px 0' }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <span style={{ color: '#64748B' }}>Class Teacher:</span>
                                <strong style={{ color: '#0F172A' }}>{cRec.classTeacherName || 'Mrs. Priya Sharma'}</strong>
                              </div>
                              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <span style={{ color: '#64748B' }}>Students Enrolled:</span>
                                <strong style={{ color: '#16A34A', fontSize: 13 }}>{classStudents.length} Students</strong>
                              </div>
                              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <span style={{ color: '#64748B' }}>Total Capacity:</span>
                                <strong style={{ color: '#64748B' }}>{totalCapacity} Seats</strong>
                              </div>
                            </div>
                          </div>

                          {/* Card Footer Actions */}
                          <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                            <button
                              type="button"
                              className="avm-btn-secondary"
                              onClick={() => setViewingClassRecord(cRec)}
                              style={{ flex: 1, padding: '6px 10px', fontSize: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}
                            >
                              <Eye size={14} /> View
                            </button>
                            <button
                              type="button"
                              className="avm-btn-secondary"
                              onClick={() => {
                                setEditingClassRecord(cRec);
                                setClsErrorMsg(null);
                              }}
                              style={{ flex: 1, padding: '6px 10px', fontSize: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}
                            >
                              <Edit size={14} /> Edit
                            </button>
                            <button
                              type="button"
                              className="avm-btn-primary"
                              onClick={() => setManagingSectionsClass(cRec)}
                              style={{ flex: 1.1, padding: '6px 8px', fontSize: 11, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}
                            >
                              <BookOpen size={13} /> Sections
                            </button>
                            <button
                              type="button"
                              className="avm-btn-primary"
                              onClick={() => setManagingSubjectsClassRecord(cRec)}
                              style={{ flex: 1.2, padding: '6px 8px', fontSize: 11, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4, backgroundColor: '#7C3AED' }}
                            >
                              <Sparkles size={13} /> Subjects
                            </button>
                            <button
                              type="button"
                              title="Delete or Deactivate Class"
                              onClick={() => {
                                if (classStudents.length > 0) {
                                  setDeactivatingClassRecord(cRec);
                                } else {
                                  setDeletingClassRecord(cRec);
                                }
                              }}
                              style={{ backgroundColor: '#FEE2E2', color: '#DC2626', border: 'none', borderRadius: 8, padding: '6px 10px', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                );
              })()}
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB: SUBJECT MASTER (ACADEMICS -> SUBJECTS) */}
          {/* ========================================================================= */}
          {activeTab === 'subjects' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              {/* Header Banner */}
              <div className="avm-card" style={{ padding: 20, background: 'linear-gradient(135deg, #0F172A 0%, #1E293B 100%)', color: '#FFFFFF', borderRadius: 14 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 14 }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, textTransform: 'uppercase', letterSpacing: '0.8px', opacity: 0.9, fontWeight: 800 }}>
                      <BookOpen size={16} color="#38BDF8" /> Academics → Subject Master
                    </div>
                    <h2 style={{ fontSize: 22, fontWeight: 900, margin: '6px 0 4px', color: '#FFFFFF' }}>
                      Global School Subjects Catalog
                    </h2>
                    <p style={{ fontSize: 13, opacity: 0.85, margin: 0 }}>
                      Create and manage global subject names, codes, evaluation types, default maximum & passing marks.
                    </p>
                  </div>
                  <button
                    className="avm-btn-primary"
                    onClick={() => {
                      setEditingMasterSubject(null);
                      setMSubName('');
                      setMSubCode('');
                      setMSubCategory('Theory');
                      setMSubMaxMarks(100);
                      setMSubPassingMarks(33);
                      setMSubStatus('Active');
                      setIsAddMasterSubjectOpen(true);
                    }}
                    style={{ padding: '10px 20px', fontSize: 13, fontWeight: 800, borderRadius: 8, display: 'flex', alignItems: 'center', gap: 8, backgroundColor: '#1769E0' }}
                  >
                    <Plus size={16} /> Add New Subject
                  </button>
                </div>
              </div>

              {/* Search and Filters Bar */}
              <div className="avm-card" style={{ padding: 16 }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 14, alignItems: 'center' }}>
                  <div>
                    <label style={{ fontSize: 11, fontWeight: 800, color: '#64748B', display: 'block', marginBottom: 4 }}>Search Subject Name / Code:</label>
                    <div style={{ position: 'relative' }}>
                      <Search size={16} style={{ position: 'absolute', left: 12, top: 12, color: '#94A3B8' }} />
                      <input
                        type="text"
                        className="avm-input"
                        style={{ paddingLeft: 36 }}
                        placeholder="e.g. Mathematics, EVS, MATH..."
                        value={mstSubSearch}
                        onChange={(e) => setMstSubSearch(e.target.value)}
                      />
                    </div>
                  </div>
                  <div>
                    <label style={{ fontSize: 11, fontWeight: 800, color: '#64748B', display: 'block', marginBottom: 4 }}>Filter by Subject Type:</label>
                    <select className="avm-input" value={mstSubCategory} onChange={(e) => setMstSubCategory(e.target.value)}>
                      <option value="All">All Types (Theory, Practical, Activity, Language)</option>
                      <option value="Theory">Theory</option>
                      <option value="Practical">Practical</option>
                      <option value="Activity">Activity</option>
                      <option value="Language">Language</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ fontSize: 11, fontWeight: 800, color: '#64748B', display: 'block', marginBottom: 4 }}>Filter by Status:</label>
                    <select className="avm-input" value={mstSubStatusFilter} onChange={(e) => setMstSubStatusFilter(e.target.value)}>
                      <option value="All">All Statuses (Active & Inactive)</option>
                      <option value="Active">Active Only</option>
                      <option value="Inactive">Inactive Only</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Subjects List Table */}
              <div className="avm-card" style={{ padding: 20 }}>
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                    <thead>
                      <tr style={{ backgroundColor: '#F8FAFC', borderBottom: '2px solid #E2E8F0', color: '#64748B', textAlign: 'left' }}>
                        <th style={{ padding: 12 }}>Subject Name</th>
                        <th style={{ padding: 12 }}>Code</th>
                        <th style={{ padding: 12 }}>Type</th>
                        <th style={{ padding: 12 }}>Default Max Marks</th>
                        <th style={{ padding: 12 }}>Passing Marks</th>
                        <th style={{ padding: 12 }}>Status</th>
                        <th style={{ padding: 12, textAlign: 'right' }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredMasterSubjects.map((sub: any) => (
                        <tr key={sub.id} style={{ borderBottom: '1px solid #F1F5F9' }}>
                          <td style={{ padding: 12, fontWeight: 800, color: '#0F172A' }}>{sub.name}</td>
                          <td style={{ padding: 12, fontWeight: 800, color: '#1769E0' }}>{sub.code}</td>
                          <td style={{ padding: 12 }}>
                            <span style={{
                              padding: '3px 10px',
                              borderRadius: 12,
                              fontSize: 11,
                              fontWeight: 800,
                              backgroundColor: sub.type === 'Practical' ? '#E0F2FE' : sub.type === 'Activity' ? '#FEF3C7' : sub.type === 'Language' ? '#F3E8FF' : '#DCFCE7',
                              color: sub.type === 'Practical' ? '#0369A1' : sub.type === 'Activity' ? '#D97706' : sub.type === 'Language' ? '#7E22CE' : '#15803D'
                            }}>
                              {sub.type}
                            </span>
                          </td>
                          <td style={{ padding: 12, fontWeight: 700 }}>{sub.maxMarks} Marks</td>
                          <td style={{ padding: 12, color: '#64748B' }}>{sub.passingMarks} Marks</td>
                          <td style={{ padding: 12 }}>
                            <span style={{
                              padding: '3px 10px',
                              borderRadius: 12,
                              fontSize: 11,
                              fontWeight: 800,
                              backgroundColor: sub.status === 'Active' ? '#DCFCE7' : '#F1F5F9',
                              color: sub.status === 'Active' ? '#15803D' : '#64748B'
                            }}>
                              {sub.status}
                            </span>
                          </td>
                          <td style={{ padding: 12, textAlign: 'right' }}>
                            <div style={{ display: 'inline-flex', gap: 6 }}>
                              <button className="avm-btn-secondary" style={{ padding: '4px 10px', fontSize: 12 }} onClick={() => openEditMasterSubject(sub)}>Edit</button>
                              <button style={{ padding: '4px 10px', fontSize: 12, backgroundColor: '#FEF2F2', color: '#DC2626', border: '1px solid #FECACA', borderRadius: 6, fontWeight: 700, cursor: 'pointer' }} onClick={() => handleDeleteMasterSubject(sub)}>Delete</button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB: CLASS SUBJECTS MAPPING (ACADEMICS -> CLASS SUBJECTS) */}
          {/* ========================================================================= */}
          {activeTab === 'class-subjects' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              {/* Header Banner */}
              <div className="avm-card" style={{ padding: 20, background: 'linear-gradient(135deg, #1769E0 0%, #1E40AF 100%)', color: '#FFFFFF', borderRadius: 14 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 14 }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, textTransform: 'uppercase', letterSpacing: '0.8px', opacity: 0.9, fontWeight: 800 }}>
                      <BookOpen size={16} color="#93C5FD" /> Academics → Class Subjects Mapping
                    </div>
                    <h2 style={{ fontSize: 22, fontWeight: 900, margin: '6px 0 4px', color: '#FFFFFF' }}>
                      Class-Wise Subject Structure & Allocation
                    </h2>
                    <p style={{ fontSize: 13, opacity: 0.9, margin: 0 }}>
                      Configure exact subjects, subject teachers, and evaluation criteria for each class & section.
                    </p>
                  </div>
                  <button
                    className="avm-btn-primary"
                    onClick={() => {
                      setEditingClassSubject(null);
                      setCsSubjectId('');
                      setCsTeacherId('');
                      setCsMaxMarks(100);
                      setCsPassingMarks(33);
                      setCsType('Theory');
                      setIsAssignSubjectOpen(true);
                    }}
                    style={{ padding: '10px 20px', fontSize: 13, fontWeight: 800, borderRadius: 8, display: 'flex', alignItems: 'center', gap: 8, backgroundColor: '#FFFFFF', color: '#1769E0' }}
                  >
                    <Plus size={16} /> Assign Subject to {csClassFilter}
                  </button>
                </div>
              </div>

              {/* Class Selector Bar */}
              <div className="avm-card" style={{ padding: 18 }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 14, alignItems: 'center' }}>
                  <div>
                    <label style={{ fontSize: 11, fontWeight: 800, color: '#64748B', display: 'block', marginBottom: 4 }}>Academic Session:</label>
                    <select className="avm-input" value={selectedSessionId} onChange={(e) => setSelectedSessionId(e.target.value)}>
                      {sessions.map((s) => <option key={s.id} value={s.id}>{s.name} {s.isActive ? '(ACTIVE)' : ''}</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={{ fontSize: 11, fontWeight: 800, color: '#1769E0', display: 'block', marginBottom: 4 }}>Target Class:</label>
                    <select className="avm-input" style={{ border: '2px solid #1769E0', fontWeight: 800, backgroundColor: '#EFF6FF', color: '#1E40AF' }} value={csClassFilter} onChange={(e) => setCsClassFilter(e.target.value)}>
                      {['Nursery', 'LKG', 'UKG', 'Class 1', 'Class 2', 'Class 3', 'Class 4', 'Class 5', 'Class 6', 'Class 7', 'Class 8'].map((c) => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label style={{ fontSize: 11, fontWeight: 800, color: '#64748B', display: 'block', marginBottom: 4 }}>Target Section:</label>
                    <select className="avm-input" value={csSecFilter} onChange={(e) => setCsSecFilter(e.target.value)}>
                      <option value="All">All Sections (A, B, C)</option>
                      <option value="A">Section A</option>
                      <option value="B">Section B</option>
                      <option value="C">Section C</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Class Assigned Subjects Table */}
              <div className="avm-card" style={{ padding: 20 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                  <div>
                    <h3 style={{ fontSize: 17, fontWeight: 900, color: '#0F172A', margin: 0 }}>
                      {csClassFilter} Assigned Subjects ({currentClassAssignedSubs.length})
                    </h3>
                    <p style={{ fontSize: 12, color: '#64748B', margin: '2px 0 0 0' }}>
                      Subjects assigned specifically for {csClassFilter} in Academic Session {selectedSessionId}
                    </p>
                  </div>
                </div>

                {currentClassAssignedSubs.length === 0 ? (
                  <div style={{ padding: '40px 20px', textAlign: 'center', color: '#64748B', backgroundColor: '#F8FAFC', border: '2px dashed #CBD5E1', borderRadius: 12 }}>
                    <p style={{ fontSize: 15, fontWeight: 800, color: '#0F172A', margin: 0 }}>No subjects assigned to {csClassFilter} yet</p>
                    <p style={{ fontSize: 13, marginTop: 4 }}>Click "Assign Subject to {csClassFilter}" above to configure subjects for this class.</p>
                  </div>
                ) : (
                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                      <thead>
                        <tr style={{ backgroundColor: '#F8FAFC', borderBottom: '2px solid #E2E8F0', color: '#64748B', textAlign: 'left' }}>
                          <th style={{ padding: 12 }}>Subject Name</th>
                          <th style={{ padding: 12 }}>Code</th>
                          <th style={{ padding: 12 }}>Subject Type</th>
                          <th style={{ padding: 12 }}>Max Marks</th>
                          <th style={{ padding: 12 }}>Passing Marks</th>
                          <th style={{ padding: 12 }}>Assigned Teacher</th>
                          <th style={{ padding: 12, textAlign: 'right' }}>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {currentClassAssignedSubs.map((sub: any) => (
                          <tr key={sub.id} style={{ borderBottom: '1px solid #F1F5F9' }}>
                            <td style={{ padding: 12, fontWeight: 800, color: '#0F172A' }}>{sub.name}</td>
                            <td style={{ padding: 12, fontWeight: 800, color: '#1769E0' }}>{sub.code || '-'}</td>
                            <td style={{ padding: 12 }}>
                              <span style={{
                                padding: '3px 10px',
                                borderRadius: 12,
                                fontSize: 11,
                                fontWeight: 800,
                                backgroundColor: sub.type === 'Activity' ? '#FEF3C7' : '#DCFCE7',
                                color: sub.type === 'Activity' ? '#D97706' : '#15803D'
                              }}>
                                {sub.type}
                              </span>
                            </td>
                            <td style={{ padding: 12, fontWeight: 700 }}>{sub.maxMarks}</td>
                            <td style={{ padding: 12, color: '#64748B' }}>{sub.passingMarks}</td>
                            <td style={{ padding: 12, fontWeight: 700, color: '#334155' }}>{sub.teacherName || 'Unassigned'}</td>
                            <td style={{ padding: 12, textAlign: 'right' }}>
                              <div style={{ display: 'inline-flex', gap: 6 }}>
                                <button className="avm-btn-secondary" style={{ padding: '4px 10px', fontSize: 12 }} onClick={() => openEditClassSubject(sub)}>Edit</button>
                                <button style={{ padding: '4px 10px', fontSize: 12, backgroundColor: '#FEF2F2', color: '#DC2626', border: '1px solid #FECACA', borderRadius: 6, fontWeight: 700, cursor: 'pointer' }} onClick={() => handleRemoveClassSubject(sub)}>Remove</button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 5: ATTENDANCE MODULE */}
          {/* ========================================================================= */}
          {activeTab === 'attendance' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              {/* Top Header Card */}
              <div className="avm-card" style={{ padding: '20px 24px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
                  <div>
                    <h3 style={{ fontSize: 20, fontWeight: 800, color: '#0F172A', margin: 0, display: 'flex', alignItems: 'center', gap: 10 }}>
                      <CalendarCheck size={24} color="#1769E0" />
                      Attendance Management
                    </h3>
                    <p style={{ fontSize: 13, color: '#64748B', margin: '4px 0 0 0' }}>
                      Select academic session, class and date to take class attendance or view historical logs.
                    </p>
                  </div>

                  {/* Sub-tab Switcher: Take Attendance vs History */}
                  <div style={{ display: 'flex', backgroundColor: '#F1F5F9', borderRadius: 10, padding: 4, gap: 4 }}>
                    <button
                      onClick={() => setAttSubTab('take')}
                      style={{
                        padding: '8px 16px',
                        borderRadius: 8,
                        border: 'none',
                        fontSize: 13,
                        fontWeight: 700,
                        cursor: 'pointer',
                        backgroundColor: attSubTab === 'take' ? '#FFFFFF' : 'transparent',
                        color: attSubTab === 'take' ? '#1769E0' : '#64748B',
                        boxShadow: attSubTab === 'take' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                        transition: 'all 0.2s'
                      }}
                    >
                      Take Attendance
                    </button>
                    <button
                      onClick={() => setAttSubTab('history')}
                      style={{
                        padding: '8px 16px',
                        borderRadius: 8,
                        border: 'none',
                        fontSize: 13,
                        fontWeight: 700,
                        cursor: 'pointer',
                        backgroundColor: attSubTab === 'history' ? '#FFFFFF' : 'transparent',
                        color: attSubTab === 'history' ? '#1769E0' : '#64748B',
                        boxShadow: attSubTab === 'history' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                        transition: 'all 0.2s'
                      }}
                    >
                      Attendance History
                    </button>
                  </div>
                </div>

                {/* FILTERS BAR AT TOP */}
                {attSubTab === 'take' && (
                  <div
                    style={{
                      marginTop: 20,
                      paddingTop: 16,
                      borderTop: '1px solid #E2E8F0',
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                      gap: 16,
                      alignItems: 'end'
                    }}
                  >
                    {/* Academic Session Filter */}
                    <div>
                      <label style={{ fontSize: 12, fontWeight: 700, color: '#475569', display: 'block', marginBottom: 6 }}>
                        Academic Session
                      </label>
                      <select
                        value={selectedSessionId}
                        onChange={(e) => {
                          setSelectedSessionId(e.target.value);
                          refreshAll(e.target.value);
                        }}
                        style={{
                          width: '100%',
                          padding: '10px 12px',
                          borderRadius: 8,
                          border: '1px solid #CBD5E1',
                          fontSize: 14,
                          fontWeight: 700,
                          color: '#0F172A',
                          backgroundColor: '#F8FAFC'
                        }}
                      >
                        {sessions.map((s) => (
                          <option key={s.id} value={s.id}>
                            {s.name} {s.isActive ? '(ACTIVE)' : ''}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Select Class Dropdown */}
                    <div>
                      <label style={{ fontSize: 12, fontWeight: 700, color: '#475569', display: 'block', marginBottom: 6 }}>
                        Select Class <span style={{ color: '#EF4444' }}>*</span>
                      </label>
                      <select
                        value={attClassFilter}
                        onChange={(e) => setAttClassFilter(e.target.value)}
                        style={{
                          width: '100%',
                          padding: '10px 12px',
                          borderRadius: 8,
                          border: attClassFilter ? '2px solid #1769E0' : '1px solid #CBD5E1',
                          fontSize: 14,
                          fontWeight: 700,
                          color: attClassFilter ? '#1769E0' : '#64748B',
                          backgroundColor: attClassFilter ? '#EFF6FF' : '#FFFFFF'
                        }}
                      >
                        <option value="">-- Select Class --</option>
                        {attendanceClassOptions.map((c) => (
                          <option key={c} value={c}>
                            {c}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Select Date */}
                    <div>
                      <label style={{ fontSize: 12, fontWeight: 700, color: '#475569', display: 'block', marginBottom: 6 }}>
                        Select Date
                      </label>
                      <input
                        type="date"
                        value={attDate}
                        onChange={(e) => setAttDate(e.target.value)}
                        style={{
                          width: '100%',
                          padding: '9px 12px',
                          borderRadius: 8,
                          border: '1px solid #CBD5E1',
                          fontSize: 14,
                          fontWeight: 600,
                          color: '#0F172A'
                        }}
                      />
                    </div>

                    {/* Optional Attendance Status Filter */}
                    <div>
                      <label style={{ fontSize: 12, fontWeight: 700, color: '#475569', display: 'block', marginBottom: 6 }}>
                        Filter by Status
                      </label>
                      <select
                        value={attStatusFilter}
                        onChange={(e) => setAttStatusFilter(e.target.value as any)}
                        style={{
                          width: '100%',
                          padding: '10px 12px',
                          borderRadius: 8,
                          border: '1px solid #CBD5E1',
                          fontSize: 14,
                          fontWeight: 600,
                          color: '#0F172A'
                        }}
                      >
                        <option value="All">All Statuses</option>
                        <option value="present">Present Only</option>
                        <option value="absent">Absent Only</option>
                        <option value="late">Late Only</option>
                      </select>
                    </div>
                  </div>
                )}
              </div>

              {/* SAVE SUCCESS BANNER */}
              {attSaveSuccess && (
                <div
                  style={{
                    backgroundColor: '#DCFCE7',
                    border: '1px solid #86EFAC',
                    color: '#15803D',
                    padding: '12px 18px',
                    borderRadius: 10,
                    fontWeight: 700,
                    fontSize: 14,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10
                  }}
                >
                  <CheckCircle2 size={20} color="#15803D" />
                  {attSaveSuccess}
                </div>
              )}

              {/* SUB-TAB 1: TAKE ATTENDANCE */}
              {attSubTab === 'take' && (
                <>
                  {/* EMPTY STATE WHEN NO CLASS SELECTED */}
                  {!attClassFilter ? (
                    <div
                      className="avm-card"
                      style={{
                        padding: '60px 20px',
                        textAlign: 'center',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        backgroundColor: '#F8FAFC',
                        border: '2px dashed #CBD5E1'
                      }}
                    >
                      <div
                        style={{
                          width: 80,
                          height: 80,
                          borderRadius: '50%',
                          backgroundColor: '#EFF6FF',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          marginBottom: 16
                        }}
                      >
                        <CalendarCheck size={40} color="#1769E0" />
                      </div>
                      <h4 style={{ fontSize: 18, fontWeight: 800, color: '#0F172A', margin: 0 }}>
                        Select a class to view attendance
                      </h4>
                      <p style={{ fontSize: 14, color: '#64748B', marginTop: 6, maxWidth: 420 }}>
                        Choose an Academic Session and a Class from the dropdown filter at the top to load the student attendance roster.
                      </p>
                    </div>
                  ) : (
                    <>
                      {/* SUMMARY CARDS ABOVE THE LIST */}
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 14 }}>
                        <div className="avm-card" style={{ padding: 16, borderLeft: '4px solid #1769E0' }}>
                          <div style={{ fontSize: 12, fontWeight: 700, color: '#64748B', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            Total Students <Users size={16} color="#1769E0" />
                          </div>
                          <div style={{ fontSize: 24, fontWeight: 900, color: '#0F172A', marginTop: 6 }}>{attTotalCount}</div>
                          <div style={{ fontSize: 11, color: '#94A3B8', marginTop: 2 }}>{attClassFilter} • {selectedSessionId}</div>
                        </div>

                        <div className="avm-card" style={{ padding: 16, borderLeft: '4px solid #16A34A' }}>
                          <div style={{ fontSize: 12, fontWeight: 700, color: '#64748B', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            Present Today <CheckCircle2 size={16} color="#16A34A" />
                          </div>
                          <div style={{ fontSize: 24, fontWeight: 900, color: '#16A34A', marginTop: 6 }}>{attPresentCount}</div>
                          <div style={{ fontSize: 11, color: '#16A34A', fontWeight: 600, marginTop: 2 }}>
                            {attTotalCount > 0 ? Math.round((attPresentCount / attTotalCount) * 100) : 0}% of class
                          </div>
                        </div>

                        <div className="avm-card" style={{ padding: 16, borderLeft: '4px solid #EF4444' }}>
                          <div style={{ fontSize: 12, fontWeight: 700, color: '#64748B', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            Absent Today <XCircle size={16} color="#EF4444" />
                          </div>
                          <div style={{ fontSize: 24, fontWeight: 900, color: '#EF4444', marginTop: 6 }}>{attAbsentCount}</div>
                          <div style={{ fontSize: 11, color: '#EF4444', fontWeight: 600, marginTop: 2 }}>
                            {attTotalCount > 0 ? Math.round((attAbsentCount / attTotalCount) * 100) : 0}% absent
                          </div>
                        </div>

                        <div className="avm-card" style={{ padding: 16, borderLeft: '4px solid #D97706' }}>
                          <div style={{ fontSize: 12, fontWeight: 700, color: '#64748B', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            Late Today <Clock size={16} color="#D97706" />
                          </div>
                          <div style={{ fontSize: 24, fontWeight: 900, color: '#D97706', marginTop: 6 }}>{attLateCount}</div>
                          <div style={{ fontSize: 11, color: '#D97706', fontWeight: 600, marginTop: 2 }}>Marked Late</div>
                        </div>

                        <div className="avm-card" style={{ padding: 16, borderLeft: '4px solid #7C3AED' }}>
                          <div style={{ fontSize: 12, fontWeight: 700, color: '#64748B', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            Attendance Rate <Activity size={16} color="#7C3AED" />
                          </div>
                          <div style={{ fontSize: 24, fontWeight: 900, color: '#7C3AED', marginTop: 6 }}>{attRatePercent}%</div>
                          <div style={{ fontSize: 11, color: '#7C3AED', fontWeight: 600, marginTop: 2 }}>Class Average</div>
                        </div>
                      </div>

                      {/* ROSTER TABLE CARD WITH BULK ACTIONS */}
                      <div className="avm-card" style={{ padding: 20 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12, marginBottom: 16 }}>
                          <div>
                            <h4 style={{ fontSize: 16, fontWeight: 800, color: '#0F172A', margin: 0 }}>
                              Attendance Roster: <span style={{ color: '#1769E0' }}>{attClassFilter}</span>
                            </h4>
                            <p style={{ fontSize: 12, color: '#64748B', margin: '2px 0 0 0' }}>
                              Date: <strong>{new Date(attDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}</strong> • Session: <strong>{selectedSessionId}</strong>
                            </p>
                          </div>

                          {/* BULK ACTIONS */}
                          <div style={{ display: 'flex', gap: 10 }}>
                            <button
                              onClick={handleMarkAllPresent}
                              style={{
                                padding: '8px 14px',
                                borderRadius: 8,
                                border: '1px solid #16A34A',
                                backgroundColor: '#F0FDF4',
                                color: '#16A34A',
                                fontWeight: 700,
                                fontSize: 13,
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: 6,
                                transition: 'all 0.2s'
                              }}
                            >
                              <CheckCircle2 size={16} /> Mark All Present
                            </button>

                            <button
                              onClick={handleMarkAllAbsent}
                              style={{
                                padding: '8px 14px',
                                borderRadius: 8,
                                border: '1px solid #EF4444',
                                backgroundColor: '#FEF2F2',
                                color: '#EF4444',
                                fontWeight: 700,
                                fontSize: 13,
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: 6,
                                transition: 'all 0.2s'
                              }}
                            >
                              <XCircle size={16} /> Mark All Absent
                            </button>
                          </div>
                        </div>

                        {/* STUDENT LIST TABLE */}
                        {displayedClassStudents.length === 0 ? (
                          <div style={{ padding: '40px 20px', textAlign: 'center', color: '#64748B' }}>
                            <p style={{ fontSize: 14, fontWeight: 600 }}>No students found matching the selected class/filter for session {selectedSessionId}.</p>
                          </div>
                        ) : (
                          <div style={{ overflowX: 'auto' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                              <thead>
                                <tr style={{ backgroundColor: '#F8FAFC', borderBottom: '2px solid #E2E8F0', color: '#64748B', textAlign: 'left' }}>
                                  <th style={{ padding: 12, width: 80 }}>Roll No</th>
                                  <th style={{ padding: 12 }}>Student Name</th>
                                  <th style={{ padding: 12 }}>Class & Sec</th>
                                  <th style={{ padding: 12 }}>Current Status</th>
                                  <th style={{ padding: 12, textAlign: 'right' }}>Attendance Action</th>
                                </tr>
                              </thead>
                              <tbody>
                                {displayedClassStudents.map((s) => {
                                  const status = attMap[s.id] || 'present';
                                  return (
                                    <tr key={s.id} style={{ borderBottom: '1px solid #F1F5F9' }}>
                                      <td style={{ padding: 12, fontWeight: 800, color: '#1769E0' }}>{s.rollNo}</td>
                                      <td style={{ padding: 12 }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                          {s.photo ? (
                                            <img src={s.photo} alt={s.name} style={{ width: 34, height: 34, borderRadius: '50%', objectFit: 'cover' }} />
                                          ) : (
                                            <div style={{ width: 34, height: 34, borderRadius: '50%', backgroundColor: '#EFF6FF', color: '#1769E0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 13 }}>
                                              {s.name.charAt(0)}
                                            </div>
                                          )}
                                          <div>
                                            <div style={{ fontWeight: 800, color: '#0F172A' }}>{s.name}</div>
                                            <div style={{ fontSize: 11, color: '#64748B' }}>Adm: {s.admissionNo || s.id}</div>
                                          </div>
                                        </div>
                                      </td>
                                      <td style={{ padding: 12, fontWeight: 600, color: '#475569' }}>
                                        {s.className}
                                      </td>
                                      <td style={{ padding: 12 }}>
                                        <span
                                          style={{
                                            padding: '4px 10px',
                                            borderRadius: 12,
                                            fontSize: 11,
                                            fontWeight: 800,
                                            textTransform: 'uppercase',
                                            backgroundColor: status === 'present' ? '#DCFCE7' : status === 'absent' ? '#FEE2E2' : '#FEF3C7',
                                            color: status === 'present' ? '#16A34A' : status === 'absent' ? '#EF4444' : '#D97706'
                                          }}
                                        >
                                          {status}
                                        </span>
                                      </td>
                                      <td style={{ padding: 12, textAlign: 'right' }}>
                                        {/* INTERACTIVE ATTENDANCE CONTROLS */}
                                        <div style={{ display: 'inline-flex', gap: 6 }}>
                                          <button
                                            type="button"
                                            onClick={() => handleMarkStudent(s.id, 'present')}
                                            style={{
                                              padding: '6px 14px',
                                              borderRadius: 8,
                                              fontSize: 12,
                                              fontWeight: 800,
                                              cursor: 'pointer',
                                              border: status === 'present' ? '2px solid #16A34A' : '1px solid #CBD5E1',
                                              backgroundColor: status === 'present' ? '#16A34A' : '#FFFFFF',
                                              color: status === 'present' ? '#FFFFFF' : '#475569',
                                              boxShadow: status === 'present' ? '0 2px 4px rgba(22,163,74,0.3)' : 'none',
                                              transition: 'all 0.15s'
                                            }}
                                          >
                                            ✓ Present
                                          </button>

                                          <button
                                            type="button"
                                            onClick={() => handleMarkStudent(s.id, 'absent')}
                                            style={{
                                              padding: '6px 14px',
                                              borderRadius: 8,
                                              fontSize: 12,
                                              fontWeight: 800,
                                              cursor: 'pointer',
                                              border: status === 'absent' ? '2px solid #EF4444' : '1px solid #CBD5E1',
                                              backgroundColor: status === 'absent' ? '#EF4444' : '#FFFFFF',
                                              color: status === 'absent' ? '#FFFFFF' : '#475569',
                                              boxShadow: status === 'absent' ? '0 2px 4px rgba(239,68,68,0.3)' : 'none',
                                              transition: 'all 0.15s'
                                            }}
                                          >
                                            ✕ Absent
                                          </button>

                                          <button
                                            type="button"
                                            onClick={() => handleMarkStudent(s.id, 'late')}
                                            style={{
                                              padding: '6px 14px',
                                              borderRadius: 8,
                                              fontSize: 12,
                                              fontWeight: 800,
                                              cursor: 'pointer',
                                              border: status === 'late' ? '2px solid #D97706' : '1px solid #CBD5E1',
                                              backgroundColor: status === 'late' ? '#D97706' : '#FFFFFF',
                                              color: status === 'late' ? '#FFFFFF' : '#475569',
                                              boxShadow: status === 'late' ? '0 2px 4px rgba(217,119,6,0.3)' : 'none',
                                              transition: 'all 0.15s'
                                            }}
                                          >
                                            ⏰ Late
                                          </button>
                                        </div>
                                      </td>
                                    </tr>
                                  );
                                })}
                              </tbody>
                            </table>
                          </div>
                        )}

                        {/* SAVE ATTENDANCE BUTTON AT BOTTOM */}
                        <div style={{ marginTop: 24, paddingTop: 16, borderTop: '1px solid #E2E8F0', display: 'flex', justifyContent: 'flex-end' }}>
                          <button
                            className="avm-btn-primary"
                            onClick={handleSaveAttendance}
                            disabled={attSaving || currentClassStudents.length === 0}
                            style={{
                              padding: '12px 28px',
                              fontSize: 15,
                              fontWeight: 800,
                              display: 'flex',
                              alignItems: 'center',
                              gap: 8,
                              backgroundColor: '#1769E0',
                              borderRadius: 8,
                              boxShadow: '0 4px 6px -1px rgba(23, 105, 224, 0.3)'
                            }}
                          >
                            <FileCheck size={18} />
                            {attSaving ? 'Saving Attendance...' : 'Save Attendance'}
                          </button>
                        </div>
                      </div>
                    </>
                  )}
                </>
              )}

              {/* SUB-TAB 2: ATTENDANCE HISTORY */}
              {attSubTab === 'history' && (
                <div className="avm-card" style={{ padding: 20 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 12 }}>
                    <div>
                      <h4 style={{ fontSize: 16, fontWeight: 800, color: '#0F172A', margin: 0 }}>Attendance Log & History</h4>
                      <p style={{ fontSize: 12, color: '#64748B', margin: '2px 0 0 0' }}>
                        Saved attendance records for session <strong>{selectedSessionId}</strong>
                      </p>
                    </div>

                    {/* History Filters */}
                    <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
                      <select
                        value={attHistClass}
                        onChange={(e) => setAttHistClass(e.target.value)}
                        style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid #CBD5E1', fontSize: 13, fontWeight: 600 }}
                      >
                        <option value="All">All Classes</option>
                        {attendanceClassOptions.map((c) => (
                          <option key={c} value={c}>{c}</option>
                        ))}
                      </select>

                      <input
                        type="date"
                        value={attHistStartDate}
                        onChange={(e) => setAttHistStartDate(e.target.value)}
                        style={{ padding: '7px 10px', borderRadius: 8, border: '1px solid #CBD5E1', fontSize: 13 }}
                      />
                      <span style={{ fontSize: 12, color: '#64748B' }}>to</span>
                      <input
                        type="date"
                        value={attHistEndDate}
                        onChange={(e) => setAttHistEndDate(e.target.value)}
                        style={{ padding: '7px 10px', borderRadius: 8, border: '1px solid #CBD5E1', fontSize: 13 }}
                      />
                    </div>
                  </div>

                  {/* HISTORY TABLE */}
                  {(() => {
                    const filteredLogs = attendanceLogs.filter((a: any) => {
                      const matchesSession = !a.academicSessionId || a.academicSessionId === selectedSessionId;
                      if (!matchesSession) return false;

                      const matchesClass = attHistClass === 'All' || a.className === attHistClass || `${a.className}-${a.section || 'A'}` === attHistClass;
                      const matchesDate = (!attHistStartDate || a.date >= attHistStartDate) && (!attHistEndDate || a.date <= attHistEndDate);
                      return matchesClass && matchesDate;
                    });

                    if (filteredLogs.length === 0) {
                      return (
                        <div style={{ padding: '40px 20px', textAlign: 'center', color: '#64748B' }}>
                          <p style={{ fontSize: 14, fontWeight: 600 }}>No attendance records found for the selected session and filter range.</p>
                        </div>
                      );
                    }

                    return (
                      <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                          <thead>
                            <tr style={{ backgroundColor: '#F8FAFC', borderBottom: '2px solid #E2E8F0', color: '#64748B', textAlign: 'left' }}>
                              <th style={{ padding: 12 }}>Date</th>
                              <th style={{ padding: 12 }}>Student ID & Name</th>
                              <th style={{ padding: 12 }}>Class & Sec</th>
                              <th style={{ padding: 12 }}>Status</th>
                              <th style={{ padding: 12 }}>Time</th>
                              <th style={{ padding: 12 }}>Recorded By</th>
                            </tr>
                          </thead>
                          <tbody>
                            {filteredLogs.map((att: any, i: number) => {
                              const stu = students.find((s) => s.id === att.studentId);
                              return (
                                <tr key={att.id || i} style={{ borderBottom: '1px solid #F1F5F9' }}>
                                  <td style={{ padding: 12, fontWeight: 700, color: '#0F172A' }}>{att.date}</td>
                                  <td style={{ padding: 12 }}>
                                    <div style={{ fontWeight: 800, color: '#1769E0' }}>{stu?.name || att.studentId}</div>
                                    <div style={{ fontSize: 11, color: '#64748B' }}>ID: {att.studentId}</div>
                                  </td>
                                  <td style={{ padding: 12, fontWeight: 600 }}>{att.className || 'Class 5-A'}</td>
                                  <td style={{ padding: 12 }}>
                                    <span
                                      style={{
                                        backgroundColor: att.status === 'present' ? '#DCFCE7' : att.status === 'absent' ? '#FEE2E2' : '#FEF3C7',
                                        color: att.status === 'present' ? '#16A34A' : att.status === 'absent' ? '#EF4444' : '#D97706',
                                        fontWeight: 800,
                                        padding: '3px 10px',
                                        borderRadius: 12,
                                        textTransform: 'capitalize'
                                      }}
                                    >
                                      {att.status}
                                    </span>
                                  </td>
                                  <td style={{ padding: 12, color: '#64748B' }}>{att.time || '08:15 AM'}</td>
                                  <td style={{ padding: 12, fontWeight: 600, color: '#475569' }}>{att.markedBy || att.teacherName || 'Mrs. Priya Sharma'}</td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    );
                  })()}
                </div>
              )}
            </div>
          )}

          {/* ========================================================================= */}
          {/* EMPLOYEE ATTENDANCE MANAGEMENT MODULE */}
          {/* ========================================================================= */}
          {activeTab === 'employee-attendance' && (
            <AdminEmployeeAttendanceModule />
          )}

          {/* ========================================================================= */}
          {/* TAB 6: HOMEWORK MODULE */}
          {/* ========================================================================= */}
          {activeTab === 'homework' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              {/* Top Header Card */}
              <div className="avm-card" style={{ padding: '20px 24px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
                  <div>
                    <h3 style={{ fontSize: 20, fontWeight: 800, color: '#0F172A', margin: 0, display: 'flex', alignItems: 'center', gap: 10 }}>
                      <BookOpen size={24} color="#1769E0" />
                      Class Homework & Assignments
                    </h3>
                    <p style={{ fontSize: 13, color: '#64748B', margin: '4px 0 0 0' }}>
                      Select academic session and class to view, publish and manage class homework assignments.
                    </p>
                  </div>

                  {hwClassFilter && (
                    <button
                      className="avm-btn-primary"
                      onClick={handleOpenPublishModal}
                      style={{
                        padding: '10px 20px',
                        fontSize: 14,
                        fontWeight: 700,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                        backgroundColor: '#1769E0',
                        borderRadius: 8
                      }}
                    >
                      <Plus size={18} /> + Publish Homework
                    </button>
                  )}
                </div>

                {/* FILTERS BAR AT TOP */}
                <div
                  style={{
                    marginTop: 20,
                    paddingTop: 16,
                    borderTop: '1px solid #E2E8F0',
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                    gap: 16,
                    alignItems: 'end'
                  }}
                >
                  {/* Academic Session Filter */}
                  <div>
                    <label style={{ fontSize: 12, fontWeight: 700, color: '#475569', display: 'block', marginBottom: 6 }}>
                      Academic Session
                    </label>
                    <select
                      value={selectedSessionId}
                      onChange={(e) => {
                        setSelectedSessionId(e.target.value);
                        refreshAll(e.target.value);
                      }}
                      style={{
                        width: '100%',
                        padding: '10px 12px',
                        borderRadius: 8,
                        border: '1px solid #CBD5E1',
                        fontSize: 14,
                        fontWeight: 700,
                        color: '#0F172A',
                        backgroundColor: '#F8FAFC'
                      }}
                    >
                      {sessions.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.name} {s.isActive ? '(ACTIVE)' : ''}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Select Class Dropdown */}
                  <div>
                    <label style={{ fontSize: 12, fontWeight: 700, color: '#475569', display: 'block', marginBottom: 6 }}>
                      Select Class <span style={{ color: '#EF4444' }}>*</span>
                    </label>
                    <select
                      value={hwClassFilter}
                      onChange={(e) => setHwClassFilter(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '10px 12px',
                        borderRadius: 8,
                        border: hwClassFilter ? '2px solid #1769E0' : '1px solid #CBD5E1',
                        fontSize: 14,
                        fontWeight: 700,
                        color: hwClassFilter ? '#1769E0' : '#64748B',
                        backgroundColor: hwClassFilter ? '#EFF6FF' : '#FFFFFF'
                      }}
                    >
                      <option value="">-- Select Class --</option>
                      {attendanceClassOptions.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Subject Filter */}
                  <div>
                    <label style={{ fontSize: 12, fontWeight: 700, color: '#475569', display: 'block', marginBottom: 6 }}>
                      Filter by Subject
                    </label>
                    <select
                      value={hwSubjectFilter}
                      onChange={(e) => setHwSubjectFilter(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '10px 12px',
                        borderRadius: 8,
                        border: '1px solid #CBD5E1',
                        fontSize: 14,
                        fontWeight: 600,
                        color: '#0F172A'
                      }}
                    >
                      <option value="All">All Subjects</option>
                      <option value="Mathematics">Mathematics</option>
                      <option value="Science">Science</option>
                      <option value="English">English</option>
                      <option value="Hindi">Hindi</option>
                      <option value="Social Science">Social Science</option>
                      <option value="Computer">Computer</option>
                    </select>
                  </div>

                  {/* Select Date */}
                  <div>
                    <label style={{ fontSize: 12, fontWeight: 700, color: '#475569', display: 'block', marginBottom: 6 }}>
                      Filter by Date
                    </label>
                    <input
                      type="date"
                      value={hwDateFilter}
                      onChange={(e) => setHwDateFilter(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '9px 12px',
                        borderRadius: 8,
                        border: '1px solid #CBD5E1',
                        fontSize: 14,
                        fontWeight: 600,
                        color: '#0F172A'
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* SUCCESS BANNER */}
              {hwSuccessMsg && (
                <div
                  style={{
                    backgroundColor: '#DCFCE7',
                    border: '1px solid #86EFAC',
                    color: '#15803D',
                    padding: '12px 18px',
                    borderRadius: 10,
                    fontWeight: 700,
                    fontSize: 14,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10
                  }}
                >
                  <CheckCircle2 size={20} color="#15803D" />
                  {hwSuccessMsg}
                </div>
              )}

              {/* EMPTY STATE WHEN NO CLASS IS SELECTED */}
              {!hwClassFilter ? (
                <div
                  className="avm-card"
                  style={{
                    padding: '60px 20px',
                    textAlign: 'center',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: '#F8FAFC',
                    border: '2px dashed #CBD5E1'
                  }}
                >
                  <div
                    style={{
                      width: 80,
                      height: 80,
                      borderRadius: '50%',
                      backgroundColor: '#EFF6FF',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginBottom: 16
                    }}
                  >
                    <BookOpen size={40} color="#1769E0" />
                  </div>
                  <h4 style={{ fontSize: 18, fontWeight: 800, color: '#0F172A', margin: 0 }}>
                    Select a class to view homework
                  </h4>
                  <p style={{ fontSize: 14, color: '#64748B', marginTop: 6, maxWidth: 440 }}>
                    Choose an Academic Session and a Class from the dropdown filter at the top to load homework assignments and study material.
                  </p>
                </div>
              ) : (
                <>
                  {/* CLASS SUMMARY CARDS */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 14 }}>
                    <div className="avm-card" style={{ padding: 16, borderLeft: '4px solid #1769E0' }}>
                      <div style={{ fontSize: 12, fontWeight: 700, color: '#64748B', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        Total Homework <BookOpen size={16} color="#1769E0" />
                      </div>
                      <div style={{ fontSize: 24, fontWeight: 900, color: '#0F172A', marginTop: 6 }}>{hwTotalCount}</div>
                      <div style={{ fontSize: 11, color: '#94A3B8', marginTop: 2 }}>{hwClassFilter} • {selectedSessionId}</div>
                    </div>

                    <div className="avm-card" style={{ padding: 16, borderLeft: '4px solid #D97706' }}>
                      <div style={{ fontSize: 12, fontWeight: 700, color: '#64748B', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        Pending Tasks <Clock size={16} color="#D97706" />
                      </div>
                      <div style={{ fontSize: 24, fontWeight: 900, color: '#D97706', marginTop: 6 }}>{hwPendingCount}</div>
                      <div style={{ fontSize: 11, color: '#D97706', fontWeight: 600, marginTop: 2 }}>Active Assignments</div>
                    </div>

                    <div className="avm-card" style={{ padding: 16, borderLeft: '4px solid #16A34A' }}>
                      <div style={{ fontSize: 12, fontWeight: 700, color: '#64748B', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        Completed <CheckCircle2 size={16} color="#16A34A" />
                      </div>
                      <div style={{ fontSize: 24, fontWeight: 900, color: '#16A34A', marginTop: 6 }}>{hwCompletedCount}</div>
                      <div style={{ fontSize: 11, color: '#16A34A', fontWeight: 600, marginTop: 2 }}>Submissions Done</div>
                    </div>

                    <div className="avm-card" style={{ padding: 16, borderLeft: '4px solid #EF4444' }}>
                      <div style={{ fontSize: 12, fontWeight: 700, color: '#64748B', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        Overdue <AlertCircle size={16} color="#EF4444" />
                      </div>
                      <div style={{ fontSize: 24, fontWeight: 900, color: '#EF4444', marginTop: 6 }}>{hwOverdueCount}</div>
                      <div style={{ fontSize: 11, color: '#EF4444', fontWeight: 600, marginTop: 2 }}>Past Due Date</div>
                    </div>
                  </div>

                  {/* HOMEWORK LIST / CARDS */}
                  <div className="avm-card" style={{ padding: 20 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 12 }}>
                      <div>
                        <h4 style={{ fontSize: 16, fontWeight: 800, color: '#0F172A', margin: 0 }}>
                          Homework Assignments: <span style={{ color: '#1769E0' }}>{hwClassFilter}</span>
                        </h4>
                        <p style={{ fontSize: 12, color: '#64748B', margin: '2px 0 0 0' }}>
                          Academic Session: <strong>{selectedSessionId}</strong>
                        </p>
                      </div>

                      <button
                        className="avm-btn-primary"
                        onClick={handleOpenPublishModal}
                        style={{ padding: '8px 16px', fontSize: 13, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6 }}
                      >
                        <Plus size={16} /> + Publish Homework
                      </button>
                    </div>

                    {displayedHomeworks.length === 0 ? (
                      <div style={{ padding: '40px 20px', textAlign: 'center', color: '#64748B' }}>
                        <p style={{ fontSize: 14, fontWeight: 600 }}>
                          No homework assignments published for {hwClassFilter} in session {selectedSessionId}.
                        </p>
                      </div>
                    ) : (
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 16 }}>
                        {displayedHomeworks.map((hw: any) => (
                          <div
                            key={hw.id}
                            className="avm-card"
                            style={{
                              padding: 18,
                              borderLeft: '4px solid #1769E0',
                              display: 'flex',
                              flexDirection: 'column',
                              justifyContent: 'space-between',
                              backgroundColor: '#FFFFFF',
                              boxShadow: '0 2px 5px rgba(0,0,0,0.04)'
                            }}
                          >
                            <div>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                                <span
                                  style={{
                                    backgroundColor: '#EFF6FF',
                                    color: '#1769E0',
                                    fontWeight: 800,
                                    fontSize: 11,
                                    padding: '4px 10px',
                                    borderRadius: 12,
                                    textTransform: 'uppercase'
                                  }}
                                >
                                  {hw.subject || 'General'}
                                </span>
                                <span style={{ fontSize: 11, color: '#EF4444', fontWeight: 700 }}>
                                  Due: {hw.dueDate}
                                </span>
                              </div>

                              <h4 style={{ fontSize: 16, fontWeight: 800, color: '#0F172A', margin: '6px 0' }}>
                                {hw.title}
                              </h4>

                              <p style={{ fontSize: 13, color: '#475569', marginBottom: 12, lineHeight: 1.4 }}>
                                {hw.description}
                              </p>
                            </div>

                            <div style={{ paddingTop: 12, borderTop: '1px solid #F1F5F9', marginTop: 12 }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#64748B', marginBottom: 10 }}>
                                <span>Assigned: <strong>{hw.assignedDate || 'Today'}</strong></span>
                                <span>Teacher: <strong>{hw.teacherName || 'Mrs. Priya Sharma'}</strong></span>
                              </div>

                              {hw.attachmentUrl && (
                                <div style={{ fontSize: 11, marginBottom: 10, color: '#1769E0', fontWeight: 600 }}>
                                  📎 Attachment: <a href={hw.attachmentUrl} target="_blank" rel="noreferrer" style={{ textDecoration: 'underline' }}>View File</a>
                                </div>
                              )}

                              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
                                <button
                                  type="button"
                                  onClick={() => handleOpenEditHwModal(hw)}
                                  style={{
                                    padding: '5px 12px',
                                    borderRadius: 6,
                                    border: '1px solid #CBD5E1',
                                    backgroundColor: '#F8FAFC',
                                    color: '#334155',
                                    fontSize: 12,
                                    fontWeight: 700,
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 4
                                  }}
                                >
                                  <Edit size={13} /> Edit
                                </button>

                                <button
                                  type="button"
                                  onClick={() => handleOpenDeleteHwModal(hw)}
                                  style={{
                                    padding: '5px 12px',
                                    borderRadius: 6,
                                    border: '1px solid #FCA5A5',
                                    backgroundColor: '#FEF2F2',
                                    color: '#EF4444',
                                    fontSize: 12,
                                    fontWeight: 700,
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 4
                                  }}
                                >
                                  <Trash2 size={13} /> Delete
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          )}

          {activeTab === 'exams' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              {/* Top Banner Alert Message if action succeeded */}
              {examSuccessMsg && (
                <div style={{ backgroundColor: '#DEF7EC', border: '1px solid #31C48D', color: '#03543F', padding: '12px 16px', borderRadius: 10, fontSize: 14, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 10 }}>
                  <CheckCircle2 size={18} color="#31C48D" />
                  {examSuccessMsg}
                </div>
              )}

              {/* Main Exams Header Card */}
              <div className="avm-card" style={{ padding: 20, background: 'linear-gradient(135deg, #1769E0 0%, #1E40AF 100%)', color: '#FFFFFF', borderRadius: 14 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 14 }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, textTransform: 'uppercase', letterSpacing: '0.8px', opacity: 0.9, fontWeight: 800 }}>
                      <Calendar size={16} /> Examinations Management Module
                    </div>
                    <h2 style={{ fontSize: 22, fontWeight: 900, margin: '6px 0 4px', color: '#FFFFFF' }}>
                      Academic Session: {selectedSessionId}
                    </h2>
                    <p style={{ fontSize: 13, opacity: 0.9, margin: 0 }}>
                      Comprehensive class-wise exam scheduling, subject evaluation, and student performance tracking.
                    </p>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <button
                      className="avm-btn-secondary"
                      onClick={() => setCreateExamModalOpen(true)}
                      style={{ backgroundColor: '#FFFFFF', color: '#1769E0', fontWeight: 800, padding: '10px 18px', borderRadius: 8, display: 'flex', alignItems: 'center', gap: 6, border: 'none', cursor: 'pointer', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}
                    >
                      <Plus size={16} /> Create Examination
                    </button>
                  </div>
                </div>
              </div>

              {/* VIEW MODE 1: MAIN EXAMS DASHBOARD (3 Large Standard Exam Cards) */}
              {!selectedExamId ? (
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                    <h3 style={{ fontSize: 16, fontWeight: 800, color: '#0F172A', margin: 0 }}>
                      Standard Academic Session Examinations
                    </h3>
                    <span style={{ fontSize: 12, color: '#64748B', fontWeight: 700 }}>
                      Academic Session {selectedSessionId}
                    </span>
                  </div>

                  {/* 3 Main Standard Exam Cards */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 16 }}>
                    {/* Card 1: Periodic Test 1 */}
                    <div className="avm-card" style={{ padding: 20, borderTop: '4px solid #1769E0', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                      <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                          <div>
                            <h4 style={{ fontSize: 18, fontWeight: 900, color: '#0F172A', margin: 0 }}>Periodic Test 1</h4>
                            <div style={{ fontSize: 12, color: '#64748B', fontWeight: 700, marginTop: 2 }}>First Assessment</div>
                          </div>
                          <span style={{ backgroundColor: '#E0F2FE', color: '#0369A1', fontWeight: 800, padding: '4px 10px', borderRadius: 20, fontSize: 11 }}>
                            Scheduled
                          </span>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, backgroundColor: '#F8FAFC', padding: 12, borderRadius: 8, margin: '14px 0', fontSize: 12 }}>
                          <div>
                            <span style={{ color: '#64748B', display: 'block', fontSize: 11 }}>Classes:</span>
                            <strong style={{ color: '#0F172A', fontSize: 14 }}>11 Classes</strong>
                          </div>
                          <div>
                            <span style={{ color: '#64748B', display: 'block', fontSize: 11 }}>Subjects:</span>
                            <strong style={{ color: '#0F172A', fontSize: 14 }}>8 Subjects</strong>
                          </div>
                        </div>

                        <div style={{ fontSize: 12, color: '#475569', marginBottom: 16 }}>
                          Schedule: <strong>10-07-2026</strong> to <strong>15-07-2026</strong>
                        </div>
                      </div>

                      <button
                        className="avm-btn-primary"
                        style={{ width: '100%', padding: '10px', fontSize: 13, fontWeight: 800, borderRadius: 8 }}
                        onClick={() => setSelectedExamId('EX-PT1-' + selectedSessionId)}
                      >
                        View Exam Details & Schedule →
                      </button>
                    </div>

                    {/* Card 2: Half-Yearly Examination */}
                    <div className="avm-card" style={{ padding: 20, borderTop: '4px solid #7C3AED', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                      <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                          <div>
                            <h4 style={{ fontSize: 18, fontWeight: 900, color: '#0F172A', margin: 0 }}>Half-Yearly Examination</h4>
                            <div style={{ fontSize: 12, color: '#64748B', fontWeight: 700, marginTop: 2 }}>Mid-Term Examination</div>
                          </div>
                          <span style={{ backgroundColor: '#F3E8FF', color: '#6B21A8', fontWeight: 800, padding: '4px 10px', borderRadius: 20, fontSize: 11 }}>
                            Scheduled
                          </span>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, backgroundColor: '#F8FAFC', padding: 12, borderRadius: 8, margin: '14px 0', fontSize: 12 }}>
                          <div>
                            <span style={{ color: '#64748B', display: 'block', fontSize: 11 }}>Classes:</span>
                            <strong style={{ color: '#0F172A', fontSize: 14 }}>11 Classes</strong>
                          </div>
                          <div>
                            <span style={{ color: '#64748B', display: 'block', fontSize: 11 }}>Subjects:</span>
                            <strong style={{ color: '#0F172A', fontSize: 14 }}>8 Subjects</strong>
                          </div>
                        </div>

                        <div style={{ fontSize: 12, color: '#475569', marginBottom: 16 }}>
                          Schedule: <strong>15-10-2026</strong> to <strong>25-10-2026</strong>
                        </div>
                      </div>

                      <button
                        className="avm-btn-primary"
                        style={{ width: '100%', padding: '10px', fontSize: 13, fontWeight: 800, borderRadius: 8, backgroundColor: '#7C3AED' }}
                        onClick={() => setSelectedExamId('EX-HY-' + selectedSessionId)}
                      >
                        View Exam Details & Schedule →
                      </button>
                    </div>

                    {/* Card 3: Annual / Final Examination */}
                    <div className="avm-card" style={{ padding: 20, borderTop: '4px solid #059669', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                      <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                          <div>
                            <h4 style={{ fontSize: 18, fontWeight: 900, color: '#0F172A', margin: 0 }}>Annual / Final Examination</h4>
                            <div style={{ fontSize: 12, color: '#64748B', fontWeight: 700, marginTop: 2 }}>Final Examination</div>
                          </div>
                          <span style={{ backgroundColor: '#D1FAE5', color: '#065F46', fontWeight: 800, padding: '4px 10px', borderRadius: 20, fontSize: 11 }}>
                            Scheduled
                          </span>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, backgroundColor: '#F8FAFC', padding: 12, borderRadius: 8, margin: '14px 0', fontSize: 12 }}>
                          <div>
                            <span style={{ color: '#64748B', display: 'block', fontSize: 11 }}>Classes:</span>
                            <strong style={{ color: '#0F172A', fontSize: 14 }}>11 Classes</strong>
                          </div>
                          <div>
                            <span style={{ color: '#64748B', display: 'block', fontSize: 11 }}>Subjects:</span>
                            <strong style={{ color: '#0F172A', fontSize: 14 }}>8 Subjects</strong>
                          </div>
                        </div>

                        <div style={{ fontSize: 12, color: '#475569', marginBottom: 16 }}>
                          Schedule: <strong>01-03-2027</strong> to <strong>15-03-2027</strong>
                        </div>
                      </div>

                      <button
                        className="avm-btn-primary"
                        style={{ width: '100%', padding: '10px', fontSize: 13, fontWeight: 800, borderRadius: 8, backgroundColor: '#059669' }}
                        onClick={() => setSelectedExamId('EX-ANNUAL-' + selectedSessionId)}
                      >
                        View Exam Details & Schedule →
                      </button>
                    </div>
                  </div>

                  {/* Additional / Custom Examinations List if any exist */}
                  {exams.filter((ex) => !['Periodic Test 1', 'Half-Yearly Examination', 'Annual / Final Examination'].includes(ex.name)).length > 0 && (
                    <div style={{ marginTop: 24 }}>
                      <h4 style={{ fontSize: 15, fontWeight: 800, color: '#0F172A', marginBottom: 12 }}>Custom / Special Examinations</h4>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                        {exams.filter((ex) => !['Periodic Test 1', 'Half-Yearly Examination', 'Annual / Final Examination'].includes(ex.name)).map((ex) => (
                          <div key={ex.id} className="avm-card" style={{ padding: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div>
                              <h5 style={{ fontSize: 15, fontWeight: 800, color: '#0F172A', margin: 0 }}>{ex.name}</h5>
                              <div style={{ fontSize: 12, color: '#64748B', marginTop: 2 }}>{ex.description || 'Special examination'} • Dates: {ex.startDate} to {ex.endDate}</div>
                            </div>
                            <button
                              className="avm-btn-secondary"
                              onClick={() => setSelectedExamId(ex.id)}
                              style={{ padding: '6px 14px', fontSize: 12, fontWeight: 700 }}
                            >
                              Manage Schedule
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                /* VIEW MODE 2: EXAM DETAILS & CLASS SELECTION WORKFLOW */
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  {/* Top Control Bar */}
                  <div className="avm-card" style={{ padding: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 14 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <button
                        className="avm-btn-secondary"
                        onClick={() => setSelectedExamId(null)}
                        style={{ padding: '8px 14px', fontSize: 13, fontWeight: 800, display: 'flex', alignItems: 'center', gap: 6 }}
                      >
                        ← Back to All Exams
                      </button>
                      <div>
                        <h3 style={{ fontSize: 16, fontWeight: 900, color: '#0F172A', margin: 0 }}>
                          {currentExamObj?.name || 'Exam Details'}
                        </h3>
                        <div style={{ fontSize: 12, color: '#64748B' }}>
                          Academic Session: <strong>{selectedSessionId}</strong>
                        </div>
                      </div>
                    </div>

                    {/* Filters: Exam Selector & Class Selector */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                      <div>
                        <label style={{ fontSize: 11, fontWeight: 800, color: '#64748B', display: 'block', marginBottom: 2 }}>
                          Select Exam:
                        </label>
                        <select
                          value={selectedExamId}
                          onChange={(e) => setSelectedExamId(e.target.value)}
                          style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid #CBD5E1', fontSize: 13, fontWeight: 700, backgroundColor: '#FFFFFF' }}
                        >
                          <option value={'EX-PT1-' + selectedSessionId}>Periodic Test 1</option>
                          <option value={'EX-HY-' + selectedSessionId}>Half-Yearly Examination</option>
                          <option value={'EX-ANNUAL-' + selectedSessionId}>Annual / Final Examination</option>
                          {exams.filter((ex) => !['Periodic Test 1', 'Half-Yearly Examination', 'Annual / Final Examination'].includes(ex.name)).map((ex) => (
                            <option key={ex.id} value={ex.id}>{ex.name}</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label style={{ fontSize: 11, fontWeight: 800, color: '#1769E0', display: 'block', marginBottom: 2 }}>
                          Select Class:
                        </label>
                        <select
                          value={examClassFilter}
                          onChange={(e) => setExamClassFilter(e.target.value)}
                          style={{ padding: '8px 14px', borderRadius: 8, border: '2px solid #1769E0', fontSize: 13, fontWeight: 800, backgroundColor: '#EFF6FF', color: '#1E40AF', cursor: 'pointer' }}
                        >
                          <option value="">-- Select Class --</option>
                          {mockSchoolClasses.map((c) => (
                            <option key={c} value={c}>{c}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* IF NO CLASS IS SELECTED: Show clean empty state prompt */}
                  {!examClassFilter ? (
                    <div className="avm-card" style={{ padding: 48, textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                      <div style={{ width: 64, height: 64, borderRadius: 32, backgroundColor: '#EFF6FF', color: '#1769E0', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
                        <GraduationCap size={32} />
                      </div>
                      <h3 style={{ fontSize: 18, fontWeight: 900, color: '#0F172A', margin: '0 0 8px' }}>
                        Select a class to manage examination
                      </h3>
                      <p style={{ fontSize: 13, color: '#64748B', maxWidth: 440, margin: 0 }}>
                        Please select a class from the dropdown above to view subject-wise exam schedules, manage timing & maximum marks, and view enrolled students.
                      </p>
                    </div>
                  ) : (
                    /* IF CLASS IS SELECTED: Show Summary + Subject Schedules + Student List */
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                      {/* Summary Banner Card */}
                      <div className="avm-card" style={{ padding: 16, backgroundColor: '#F8FAFC', borderLeft: '4px solid #1769E0' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                          <div>
                            <span style={{ fontSize: 11, fontWeight: 800, color: '#1769E0', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                              Academic Session {selectedSessionId}
                            </span>
                            <h3 style={{ fontSize: 17, fontWeight: 900, color: '#0F172A', margin: '2px 0 0' }}>
                              {currentExamObj?.name || 'Periodic Test 1'} — {examClassFilter}
                            </h3>
                          </div>
                          <span style={{ backgroundColor: '#DCFCE7', color: '#15803D', fontWeight: 800, padding: '4px 12px', borderRadius: 20, fontSize: 12 }}>
                            Status: Scheduled
                          </span>
                        </div>

                        {/* Summary Metrics */}
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 12, marginTop: 12 }}>
                          <div style={{ backgroundColor: '#FFFFFF', padding: 12, borderRadius: 8, border: '1px solid #E2E8F0' }}>
                            <div style={{ fontSize: 11, color: '#64748B', fontWeight: 700 }}>Total Students</div>
                            <div style={{ fontSize: 18, fontWeight: 900, color: '#0F172A', marginTop: 2 }}>
                              {students.filter((s) => (s.className + '-' + s.section) === examClassFilter || s.className === examClassFilter).length}
                            </div>
                          </div>
                          <div style={{ backgroundColor: '#FFFFFF', padding: 12, borderRadius: 8, border: '1px solid #E2E8F0' }}>
                            <div style={{ fontSize: 11, color: '#64748B', fontWeight: 700 }}>Subjects</div>
                            <div style={{ fontSize: 18, fontWeight: 900, color: '#1769E0', marginTop: 2 }}>
                              {getSubjectsForExamClass(examClassFilter).length}
                            </div>
                          </div>
                          <div style={{ backgroundColor: '#FFFFFF', padding: 12, borderRadius: 8, border: '1px solid #E2E8F0' }}>
                            <div style={{ fontSize: 11, color: '#64748B', fontWeight: 700 }}>Scheduled Exams</div>
                            <div style={{ fontSize: 18, fontWeight: 900, color: '#7C3AED', marginTop: 2 }}>
                              {currentClassSchedules.length || getSubjectsForExamClass(examClassFilter).length}
                            </div>
                          </div>
                          <div style={{ backgroundColor: '#FFFFFF', padding: 12, borderRadius: 8, border: '1px solid #E2E8F0' }}>
                            <div style={{ fontSize: 11, color: '#64748B', fontWeight: 700 }}>Completed Exams</div>
                            <div style={{ fontSize: 18, fontWeight: 900, color: '#059669', marginTop: 2 }}>0</div>
                          </div>
                          <div style={{ backgroundColor: '#FFFFFF', padding: 12, borderRadius: 8, border: '1px solid #E2E8F0' }}>
                            <div style={{ fontSize: 11, color: '#64748B', fontWeight: 700 }}>Pending Marks</div>
                            <div style={{ fontSize: 18, fontWeight: 900, color: '#D97706', marginTop: 2 }}>
                              {students.filter((s) => (s.className + '-' + s.section) === examClassFilter || s.className === examClassFilter).length * getSubjectsForExamClass(examClassFilter).length}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Subject-wise Exam Schedule Cards Grid */}
                      <div className="avm-card" style={{ padding: 20 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                          <h4 style={{ fontSize: 15, fontWeight: 800, color: '#0F172A', margin: 0, display: 'flex', alignItems: 'center', gap: 6 }}>
                            <BookOpen size={16} color="#1769E0" /> Subject-wise Exam Schedule ({examClassFilter})
                          </h4>
                          <span style={{ fontSize: 12, color: '#64748B' }}>Click [ Edit ] to modify timing, room or marks</span>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 14 }}>
                          {getSubjectsForExamClass(examClassFilter).map((subj, idx) => {
                            const schItem = currentClassSchedules.find((s: any) => s.subject.toLowerCase() === subj.toLowerCase());
                            const examDate = schItem?.examDate || `2026-07-${10 + idx}`;
                            const startTime = schItem?.startTime || '09:00 AM';
                            const endTime = schItem?.endTime || '10:00 AM';
                            const maxMarks = schItem?.maximumMarks || 50;
                            const passMarks = schItem?.passingMarks || 17;
                            const roomNo = schItem?.roomNo || `Room ${5 + idx}`;

                            return (
                              <div key={subj} style={{ backgroundColor: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 10, padding: 14, boxShadow: '0 1px 3px rgba(0,0,0,0.05)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                                <div>
                                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                                    <h5 style={{ fontSize: 15, fontWeight: 800, color: '#0F172A', margin: 0 }}>{subj}</h5>
                                    <span style={{ backgroundColor: '#EFF6FF', color: '#1769E0', fontWeight: 800, padding: '2px 8px', borderRadius: 12, fontSize: 11 }}>
                                      {maxMarks} Marks
                                    </span>
                                  </div>

                                  <div style={{ fontSize: 12, color: '#475569', display: 'flex', flexDirection: 'column', gap: 4, margin: '8px 0 12px' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                      <Calendar size={13} color="#64748B" /> <span>Date: <strong>{examDate}</strong></span>
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                      <Clock size={13} color="#64748B" /> <span>Time: <strong>{startTime} – {endTime}</strong></span>
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                      <School size={13} color="#64748B" /> <span>Room: <strong>{roomNo}</strong> (Pass Marks: {passMarks})</span>
                                    </div>
                                  </div>
                                </div>

                                <button
                                  className="avm-btn-secondary"
                                  onClick={() => handleOpenEditScheduleModal(subj)}
                                  style={{ width: '100%', padding: '6px', fontSize: 12, fontWeight: 700, borderRadius: 6 }}
                                >
                                  Edit Schedule
                                </button>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {/* Class Student Roster Table */}
                      <div className="avm-card" style={{ padding: 20 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                          <h4 style={{ fontSize: 15, fontWeight: 800, color: '#0F172A', margin: 0, display: 'flex', alignItems: 'center', gap: 6 }}>
                            <User size={16} color="#1769E0" /> Enrolled Students ({examClassFilter})
                          </h4>
                          <span style={{ fontSize: 12, color: '#64748B', fontWeight: 700 }}>
                            Only showing {examClassFilter} students for Session {selectedSessionId}
                          </span>
                        </div>

                        {students.filter((s) => (s.className + '-' + s.section) === examClassFilter || s.className === examClassFilter).length === 0 ? (
                          <div style={{ padding: 24, textAlign: 'center', color: '#94A3B8', fontSize: 13 }}>
                            No students registered in {examClassFilter} for Academic Session {selectedSessionId}.
                          </div>
                        ) : (
                          <div style={{ overflowX: 'auto' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                              <thead>
                                <tr style={{ backgroundColor: '#F8FAFC', borderBottom: '2px solid #E2E8F0', color: '#64748B', textAlign: 'left' }}>
                                  <th style={{ padding: 10 }}>Roll No</th>
                                  <th style={{ padding: 10 }}>Student Name</th>
                                  <th style={{ padding: 10 }}>Admission No</th>
                                  <th style={{ padding: 10 }}>Class & Sec</th>
                                  <th style={{ padding: 10 }}>Exam Status</th>
                                </tr>
                              </thead>
                              <tbody>
                                {students
                                  .filter((s) => (s.className + '-' + s.section) === examClassFilter || s.className === examClassFilter)
                                  .map((stu) => (
                                    <tr key={stu.id} style={{ borderBottom: '1px solid #F1F5F9' }}>
                                      <td style={{ padding: 10, fontWeight: 700 }}>{stu.rollNo || '-'}</td>
                                      <td style={{ padding: 10, fontWeight: 800, color: '#0F172A' }}>{stu.name}</td>
                                      <td style={{ padding: 10, fontWeight: 700, color: '#1769E0' }}>{stu.admissionNo}</td>
                                      <td style={{ padding: 10 }}>{stu.className}-{stu.section || 'A'}</td>
                                      <td style={{ padding: 10 }}>
                                        <span style={{ backgroundColor: '#E0F2FE', color: '#0369A1', fontWeight: 800, padding: '3px 10px', borderRadius: 12, fontSize: 11 }}>
                                          Scheduled
                                        </span>
                                      </td>
                                    </tr>
                                  ))}
                              </tbody>
                            </table>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {activeTab === 'marks' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              {/* Top Banner Alert Message if action succeeded */}
              {marksSuccessMsg && (
                <div style={{ backgroundColor: '#DEF7EC', border: '1px solid #31C48D', color: '#03543F', padding: '12px 16px', borderRadius: 10, fontSize: 14, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 10 }}>
                  <CheckCircle2 size={18} color="#31C48D" />
                  {marksSuccessMsg}
                </div>
              )}

              {/* Main Marks Header Banner */}
              <div className="avm-card" style={{ padding: 20, background: 'linear-gradient(135deg, #1769E0 0%, #1E40AF 100%)', color: '#FFFFFF', borderRadius: 14 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 14 }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, textTransform: 'uppercase', letterSpacing: '0.8px', opacity: 0.9, fontWeight: 800 }}>
                      <Award size={16} /> Marks & Academic Evaluation Module
                    </div>
                    <h2 style={{ fontSize: 22, fontWeight: 900, margin: '6px 0 4px', color: '#FFFFFF' }}>
                      Academic Session: {selectedSessionId}
                    </h2>
                    <p style={{ fontSize: 13, opacity: 0.9, margin: 0 }}>
                      Class-wise student marks entry, evaluation registers, and performance tracking.
                    </p>
                  </div>
                </div>
              </div>

              {/* TOP FILTERS BAR */}
              <div className="avm-card" style={{ padding: 18, backgroundColor: '#FFFFFF', borderRadius: 12, boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 14, alignItems: 'center' }}>
                  {/* Filter 1: Academic Session */}
                  <div>
                    <label style={{ fontSize: 11, fontWeight: 800, color: '#64748B', display: 'block', marginBottom: 4 }}>
                      Academic Session:
                    </label>
                    <select
                      value={selectedSessionId}
                      onChange={(e) => setSelectedSessionId(e.target.value)}
                      style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1px solid #CBD5E1', fontSize: 13, fontWeight: 700, backgroundColor: '#F8FAFC' }}
                    >
                      {sessions.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.name} {s.isActive ? '(ACTIVE)' : '(HISTORICAL)'}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Filter 2: Select Class */}
                  <div>
                    <label style={{ fontSize: 11, fontWeight: 800, color: '#1769E0', display: 'block', marginBottom: 4 }}>
                      Select Class:
                    </label>
                    <select
                      value={marksClassFilter}
                      onChange={(e) => setMarksClassFilter(e.target.value)}
                      style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '2px solid #1769E0', fontSize: 13, fontWeight: 800, backgroundColor: '#EFF6FF', color: '#1E40AF', cursor: 'pointer' }}
                    >
                      <option value="">-- Select Class --</option>
                      {mockSchoolClasses.map((c) => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </div>

                  {/* Filter 3: Select Examination */}
                  <div>
                    <label style={{ fontSize: 11, fontWeight: 800, color: '#64748B', display: 'block', marginBottom: 4 }}>
                      Select Examination:
                    </label>
                    <select
                      value={marksExamFilter}
                      onChange={(e) => setMarksExamFilter(e.target.value)}
                      style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1px solid #CBD5E1', fontSize: 13, fontWeight: 700, backgroundColor: '#FFFFFF' }}
                    >
                      <option value="First Term Examination">First Term Examination</option>
                      <option value="Half Yearly Examination">Half Yearly Examination</option>
                      <option value="Annual Examination">Annual Examination</option>
                      {exams.filter((ex) => !['First Term Examination', 'Half Yearly Examination', 'Annual Examination'].includes(ex.name)).map((ex) => (
                        <option key={ex.id} value={ex.name}>{ex.name}</option>
                      ))}
                    </select>
                  </div>

                  {/* Filter 4: Select Subject */}
                  <div>
                    <label style={{ fontSize: 11, fontWeight: 800, color: '#64748B', display: 'block', marginBottom: 4 }}>
                      Select Subject:
                    </label>
                    <select
                      value={marksSubjectFilter}
                      onChange={(e) => setMarksSubjectFilter(e.target.value)}
                      style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1px solid #CBD5E1', fontSize: 13, fontWeight: 700, backgroundColor: '#FFFFFF' }}
                    >
                      {getSubjectsForMarksClass(marksClassFilter).map((sub) => (
                        <option key={sub} value={sub}>{sub}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* WORKFLOW VIEW: BATCH MARKS ENTRY TABLE IF CLASS IS SELECTED */}
              {marksClassFilter ? (
                <div className="avm-card" style={{ padding: 20 }}>
                  <form onSubmit={handleSaveBatchMarks}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 12 }}>
                      <div>
                        <span style={{ fontSize: 11, fontWeight: 800, color: '#1769E0', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                          Academic Session {selectedSessionId}
                        </span>
                        <h3 style={{ fontSize: 17, fontWeight: 900, color: '#0F172A', margin: '2px 0 0' }}>
                          Marks Entry: {marksClassFilter} — {marksSubjectFilter} ({marksExamFilter})
                        </h3>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <button
                          type="submit"
                          className="avm-btn-primary"
                          disabled={marksSaving}
                          style={{ padding: '9px 20px', fontSize: 13, fontWeight: 800, borderRadius: 8, display: 'flex', alignItems: 'center', gap: 6 }}
                        >
                          <FileText size={16} /> {marksSaving ? 'Saving Marks...' : 'Save Marks Evaluation'}
                        </button>
                      </div>
                    </div>

                    {/* Class Students Roster Marks Input Grid */}
                    {students.filter((s) => (s.className + '-' + s.section) === marksClassFilter || s.className === marksClassFilter).length === 0 ? (
                      <div style={{ padding: 36, textAlign: 'center', color: '#94A3B8', fontSize: 13, backgroundColor: '#F8FAFC', borderRadius: 10 }}>
                        No students enrolled in {marksClassFilter} for Academic Session {selectedSessionId}.
                      </div>
                    ) : (
                      <div style={{ overflowX: 'auto', border: '1px solid #E2E8F0', borderRadius: 10 }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                          <thead>
                            <tr style={{ backgroundColor: '#F8FAFC', borderBottom: '2px solid #E2E8F0', color: '#64748B', textAlign: 'left' }}>
                              <th style={{ padding: 12 }}>Roll No</th>
                              <th style={{ padding: 12 }}>Admission No</th>
                              <th style={{ padding: 12 }}>Student Name</th>
                              <th style={{ padding: 12 }}>Marks Obtained</th>
                              <th style={{ padding: 12 }}>Maximum Marks</th>
                              <th style={{ padding: 12 }}>Percentage</th>
                              <th style={{ padding: 12 }}>Grade</th>
                              <th style={{ padding: 12, textAlign: 'right' }}>Actions</th>
                            </tr>
                          </thead>
                          <tbody>
                            {students
                              .filter((s) => (s.className + '-' + s.section) === marksClassFilter || s.className === marksClassFilter)
                              .map((stu) => {
                                const obtainedVal = marksInputsMap[stu.id] !== undefined ? marksInputsMap[stu.id] : 80;
                                const maxVal = marksMaxMarksMap[stu.id] || 100;
                                const pct = maxVal > 0 ? Math.round((obtainedVal / maxVal) * 100 * 10) / 10 : 0;
                                const grade = calculateGradeFromMarks(obtainedVal, maxVal);

                                return (
                                  <tr key={stu.id} style={{ borderBottom: '1px solid #F1F5F9' }}>
                                    <td style={{ padding: 12, fontWeight: 700 }}>{stu.rollNo || '-'}</td>
                                    <td style={{ padding: 12, fontWeight: 800, color: '#1769E0' }}>{stu.admissionNo}</td>
                                    <td style={{ padding: 12, fontWeight: 800, color: '#0F172A' }}>
                                      <button
                                        type="button"
                                        onClick={() => setViewStudentMarks(stu)}
                                        style={{ background: 'none', border: 'none', color: '#1769E0', fontWeight: 800, cursor: 'pointer', padding: 0, textDecoration: 'underline' }}
                                      >
                                        {stu.name}
                                      </button>
                                    </td>
                                    <td style={{ padding: 12 }}>
                                      <input
                                        type="number"
                                        min={0}
                                        max={maxVal}
                                        value={obtainedVal}
                                        onChange={(e) => {
                                          const val = Math.max(0, Math.min(maxVal, Number(e.target.value)));
                                          setMarksInputsMap((prev) => ({ ...prev, [stu.id]: val }));
                                        }}
                                        style={{ width: 80, padding: '6px 10px', borderRadius: 6, border: '1px solid #CBD5E1', fontSize: 14, fontWeight: 800, color: '#0F172A', textAlign: 'center' }}
                                      />
                                    </td>
                                    <td style={{ padding: 12 }}>
                                      <input
                                        type="number"
                                        min={1}
                                        value={maxVal}
                                        onChange={(e) => {
                                          const val = Math.max(1, Number(e.target.value));
                                          setMarksMaxMarksMap((prev) => ({ ...prev, [stu.id]: val }));
                                        }}
                                        style={{ width: 70, padding: '6px 8px', borderRadius: 6, border: '1px solid #E2E8F0', fontSize: 13, fontWeight: 700, color: '#64748B', textAlign: 'center', backgroundColor: '#F8FAFC' }}
                                      />
                                    </td>
                                    <td style={{ padding: 12, fontWeight: 800, color: '#475569' }}>
                                      {pct}%
                                    </td>
                                    <td style={{ padding: 12 }}>
                                      <span style={{
                                        backgroundColor: grade === 'A+' ? '#DCFCE7' : grade === 'A' ? '#EFF6FF' : grade === 'B+' ? '#F3E8FF' : '#FEF3C7',
                                        color: grade === 'A+' ? '#15803D' : grade === 'A' ? '#1D4ED8' : grade === 'B+' ? '#7E22CE' : '#B45309',
                                        fontWeight: 900,
                                        padding: '4px 10px',
                                        borderRadius: 12,
                                        fontSize: 12
                                      }}>
                                        {grade}
                                      </span>
                                    </td>
                                    <td style={{ padding: 12, textAlign: 'right' }}>
                                      <button
                                        type="button"
                                        className="avm-btn-secondary"
                                        onClick={() => handleOpenSingleMarkModal(stu)}
                                        style={{ padding: '5px 12px', fontSize: 12, fontWeight: 700 }}
                                      >
                                        Edit
                                      </button>
                                    </td>
                                  </tr>
                                );
                              })}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </form>
                </div>
              ) : (
                /* PROMPT IF NO CLASS SELECTED */
                <div className="avm-card" style={{ padding: 40, textAlign: 'center' }}>
                  <div style={{ width: 56, height: 56, borderRadius: 28, backgroundColor: '#EFF6FF', color: '#1769E0', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px' }}>
                    <Award size={28} />
                  </div>
                  <h3 style={{ fontSize: 17, fontWeight: 900, color: '#0F172A', margin: '0 0 6px' }}>
                    Select a Class to Enter & Filter Student Marks
                  </h3>
                  <p style={{ fontSize: 13, color: '#64748B', maxWidth: 460, margin: '0 auto' }}>
                    Please select a class from the dropdown filter above to open batch marks evaluation register for Academic Session {selectedSessionId}.
                  </p>
                </div>
              )}

              {/* MARKS EVALUATION REGISTER (FILTERED DATA LIST) */}
              <div className="avm-card" style={{ padding: 20 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                  <h3 style={{ fontSize: 16, fontWeight: 800, color: '#0F172A', margin: 0 }}>
                    Marks Evaluation Register ({selectedSessionId})
                  </h3>
                  <span style={{ fontSize: 12, color: '#64748B', fontWeight: 700 }}>
                    {marksList.filter((m: any) => !m.academicSessionId || m.academicSessionId === selectedSessionId).length} Records Found
                  </span>
                </div>

                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                    <thead>
                      <tr style={{ backgroundColor: '#F8FAFC', borderBottom: '2px solid #E2E8F0', color: '#64748B', textAlign: 'left' }}>
                        <th style={{ padding: 12 }}>Exam</th>
                        <th style={{ padding: 12 }}>Student ID</th>
                        <th style={{ padding: 12 }}>Roll No</th>
                        <th style={{ padding: 12 }}>Student Name</th>
                        <th style={{ padding: 12 }}>Class</th>
                        <th style={{ padding: 12 }}>Subject</th>
                        <th style={{ padding: 12 }}>Marks Obtained</th>
                        <th style={{ padding: 12 }}>Percentage</th>
                        <th style={{ padding: 12 }}>Grade</th>
                        <th style={{ padding: 12 }}>Evaluator</th>
                        <th style={{ padding: 12, textAlign: 'right' }}>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {marksList
                        .filter((m: any) => {
                          const matchesSession = !m.academicSessionId || m.academicSessionId === selectedSessionId;
                          if (!matchesSession) return false;
                          if (marksClassFilter && !((m.className || '').toLowerCase().includes(marksClassFilter.toLowerCase()))) return false;
                          if (marksExamFilter && m.examId !== marksExamFilter && m.examName !== marksExamFilter) return false;
                          if (marksSubjectFilter && (m.subject || '').toLowerCase() !== marksSubjectFilter.toLowerCase()) return false;
                          return true;
                        })
                        .map((m: any, i: number) => {
                          const obtained = Number(m.marksObtained !== undefined ? m.marksObtained : m.marks || 0);
                          const max = Number(m.maxMarks || m.maximumMarks || 100);
                          const pct = m.percentage !== undefined ? m.percentage : Math.round((obtained / max) * 100 * 10) / 10;
                          const grade = m.grade || calculateGradeFromMarks(obtained, max);
                          const matchingStu = students.find((s) => s.id === m.studentId);

                          return (
                            <tr key={i} style={{ borderBottom: '1px solid #F1F5F9' }}>
                              <td style={{ padding: 12, fontWeight: 700, color: '#0F172A' }}>{m.examName || m.examId}</td>
                              <td style={{ padding: 12, fontWeight: 800, color: '#1769E0' }}>{m.studentId}</td>
                              <td style={{ padding: 12, fontWeight: 700 }}>{m.rollNo || matchingStu?.rollNo || '-'}</td>
                              <td style={{ padding: 12, fontWeight: 800, color: '#0F172A' }}>
                                {matchingStu ? (
                                  <button
                                    type="button"
                                    onClick={() => setViewStudentMarks(matchingStu)}
                                    style={{ background: 'none', border: 'none', color: '#1769E0', fontWeight: 800, cursor: 'pointer', padding: 0, textDecoration: 'underline' }}
                                  >
                                    {m.studentName || matchingStu.name}
                                  </button>
                                ) : (
                                  m.studentName || 'Student'
                                )}
                              </td>
                              <td style={{ padding: 12 }}>{m.className || 'Class 5-A'}</td>
                              <td style={{ padding: 12, fontWeight: 800 }}>{m.subject}</td>
                              <td style={{ padding: 12, fontWeight: 900, color: '#16A34A' }}>
                                {obtained} / {max}
                              </td>
                              <td style={{ padding: 12, fontWeight: 700, color: '#475569' }}>
                                {pct}%
                              </td>
                              <td style={{ padding: 12 }}>
                                <span style={{
                                  backgroundColor: grade === 'A+' ? '#DCFCE7' : grade === 'A' ? '#EFF6FF' : grade === 'B+' ? '#F3E8FF' : '#FEF3C7',
                                  color: grade === 'A+' ? '#15803D' : grade === 'A' ? '#1D4ED8' : grade === 'B+' ? '#7E22CE' : '#B45309',
                                  fontWeight: 900,
                                  padding: '3px 8px',
                                  borderRadius: 10,
                                  fontSize: 11
                                }}>
                                  {grade}
                                </span>
                              </td>
                              <td style={{ padding: 12, color: '#64748B' }}>{m.teacherName || m.evaluatorName || 'Mrs. Priya Sharma'}</td>
                              <td style={{ padding: 12, textAlign: 'right' }}>
                                {matchingStu && (
                                  <button
                                    type="button"
                                    className="avm-btn-secondary"
                                    onClick={() => handleOpenSingleMarkModal(matchingStu, m.subject, m.examId || m.examName)}
                                    style={{ padding: '4px 10px', fontSize: 11, fontWeight: 700 }}
                                  >
                                    Edit
                                  </button>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'results' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              {/* Main Results Header Banner */}
              <div className="avm-card" style={{ padding: 20, background: 'linear-gradient(135deg, #1769E0 0%, #1E40AF 100%)', color: '#FFFFFF', borderRadius: 14 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 14 }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, textTransform: 'uppercase', letterSpacing: '0.8px', opacity: 0.9, fontWeight: 800 }}>
                      <FileCheck size={16} /> Results & Report Card Management Module
                    </div>
                    <h2 style={{ fontSize: 22, fontWeight: 900, margin: '6px 0 4px', color: '#FFFFFF' }}>
                      Academic Session: {selectedSessionId}
                    </h2>
                    <p style={{ fontSize: 13, opacity: 0.9, margin: 0 }}>
                      Generate official school report cards, calculate examination totals, and review student academic performance.
                    </p>
                  </div>
                </div>
              </div>

              {/* TOP FILTERS BAR */}
              <div className="avm-card" style={{ padding: 18, backgroundColor: '#FFFFFF', borderRadius: 12, boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 14, alignItems: 'center' }}>
                  {/* Filter 1: Academic Session */}
                  <div>
                    <label style={{ fontSize: 11, fontWeight: 800, color: '#64748B', display: 'block', marginBottom: 4 }}>
                      Academic Session:
                    </label>
                    <select
                      value={selectedSessionId}
                      onChange={(e) => setSelectedSessionId(e.target.value)}
                      style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1px solid #CBD5E1', fontSize: 13, fontWeight: 700, backgroundColor: '#F8FAFC' }}
                    >
                      {sessions.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.name} {s.isActive ? '(ACTIVE)' : '(HISTORICAL)'}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Filter 2: Select Class */}
                  <div>
                    <label style={{ fontSize: 11, fontWeight: 800, color: '#1769E0', display: 'block', marginBottom: 4 }}>
                      Select Class:
                    </label>
                    <select
                      value={resClassFilter}
                      onChange={(e) => setResClassFilter(e.target.value)}
                      style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '2px solid #1769E0', fontSize: 13, fontWeight: 800, backgroundColor: '#EFF6FF', color: '#1E40AF', cursor: 'pointer' }}
                    >
                      <option value="">-- Select Class --</option>
                      {mockSchoolClasses.map((c) => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </div>

                  {/* Filter 3: Select Examination */}
                  <div>
                    <label style={{ fontSize: 11, fontWeight: 800, color: '#64748B', display: 'block', marginBottom: 4 }}>
                      Select Examination:
                    </label>
                    <select
                      value={resExamFilter}
                      onChange={(e) => setResExamFilter(e.target.value)}
                      style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1px solid #CBD5E1', fontSize: 13, fontWeight: 700, backgroundColor: '#FFFFFF' }}
                    >
                      <option value="First Term Examination">First Term Examination</option>
                      <option value="Half Yearly Examination">Half Yearly Examination</option>
                      <option value="Annual Examination">Annual Examination</option>
                      {exams.filter((ex) => !['First Term Examination', 'Half Yearly Examination', 'Annual Examination'].includes(ex.name)).map((ex) => (
                        <option key={ex.id} value={ex.name}>{ex.name}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* STUDENT CARDS GRID IF CLASS IS SELECTED */}
              {!resClassFilter ? (
                <div className="avm-card" style={{ padding: 48, textAlign: 'center' }}>
                  <div style={{ width: 60, height: 60, borderRadius: 30, backgroundColor: '#EFF6FF', color: '#1769E0', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                    <FileCheck size={30} />
                  </div>
                  <h3 style={{ fontSize: 18, fontWeight: 900, color: '#0F172A', margin: '0 0 6px' }}>
                    Select a Class to View Student Results & Generate Report Cards
                  </h3>
                  <p style={{ fontSize: 13, color: '#64748B', maxWidth: 460, margin: '0 auto' }}>
                    Please select a class from the top filter to generate official report cards and review examination results for Academic Session {selectedSessionId}.
                  </p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h3 style={{ fontSize: 16, fontWeight: 800, color: '#0F172A', margin: 0 }}>
                      Student Results Roster — {resClassFilter} ({resExamFilter})
                    </h3>
                    <span style={{ fontSize: 12, color: '#64748B', fontWeight: 700 }}>
                      {students.filter((s) => (s.className + '-' + s.section) === resClassFilter || s.className === resClassFilter).length} Enrolled Students
                    </span>
                  </div>

                  {students.filter((s) => (s.className + '-' + s.section) === resClassFilter || s.className === resClassFilter).length === 0 ? (
                    <div className="avm-card" style={{ padding: 36, textAlign: 'center', color: '#94A3B8', fontSize: 13 }}>
                      No students found in {resClassFilter} for Academic Session {selectedSessionId}.
                    </div>
                  ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 16 }}>
                      {students
                        .filter((s) => (s.className + '-' + s.section) === resClassFilter || s.className === resClassFilter)
                        .map((stu) => {
                          const resObj = calculateStudentResult(stu, resExamFilter);
                          const isPass = (resObj.percentage ?? 0) >= 40;
                          const isEarly = resObj.isEarlyYears;

                          return (
                            <div key={stu.id} className="avm-card" style={{ padding: 18, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', borderTop: '4px solid #1769E0' }}>
                              <div>
                                <div style={{ display: 'flex', gap: 14, alignItems: 'center', marginBottom: 12 }}>
                                  <img
                                    src={stu.photo || 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150'}
                                    alt={stu.name}
                                    style={{ width: 56, height: 56, borderRadius: 28, objectFit: 'cover', border: '2px solid #1769E0' }}
                                  />
                                  <div>
                                    <h4 style={{ fontSize: 16, fontWeight: 900, color: '#0F172A', margin: 0 }}>{stu.name}</h4>
                                    <div style={{ fontSize: 12, color: '#1769E0', fontWeight: 800, marginTop: 2 }}>{stu.admissionNo}</div>
                                    <div style={{ fontSize: 11, color: '#64748B', marginTop: 1 }}>
                                      Roll No: <strong>{stu.rollNo || '-'}</strong> • {stu.className}-{stu.section || 'A'}
                                    </div>
                                  </div>
                                </div>

                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, backgroundColor: '#F8FAFC', padding: 10, borderRadius: 8, margin: '12px 0', fontSize: 11 }}>
                                  <div style={{ textAlign: 'center' }}>
                                    <span style={{ color: '#64748B', display: 'block', fontSize: 10 }}>Percentage:</span>
                                    <strong style={{ color: '#1769E0', fontSize: 13 }}>{resObj.percentage}%</strong>
                                  </div>
                                  <div style={{ textAlign: 'center' }}>
                                    <span style={{ color: '#64748B', display: 'block', fontSize: 10 }}>Overall Grade:</span>
                                    <strong style={{ color: '#16A34A', fontSize: 13 }}>{resObj.grade}</strong>
                                  </div>
                                  <div style={{ textAlign: 'center' }}>
                                    <span style={{ color: '#64748B', display: 'block', fontSize: 10 }}>Status:</span>
                                    <strong style={{ color: isEarly ? '#1769E0' : isPass ? '#16A34A' : '#DC2626', fontSize: 11 }}>
                                      {isEarly ? 'PROGRESS' : isPass ? 'PASS' : 'FAIL'}
                                    </strong>
                                  </div>
                                </div>
                              </div>

                              <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                                <button
                                  type="button"
                                  className="avm-btn-secondary"
                                  onClick={() => setViewResultStudent(stu)}
                                  style={{ flex: 1, padding: '8px', fontSize: 12, fontWeight: 800 }}
                                >
                                  View Result
                                </button>
                                <button
                                  type="button"
                                  className="avm-btn-primary"
                                  onClick={() => setPreviewReportCardStudent(stu)}
                                  style={{ flex: 1, padding: '8px', fontSize: 12, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}
                                >
                                  <Printer size={14} /> Report Card
                                </button>
                              </div>
                            </div>
                          );
                        })}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {activeTab === 'admitcards' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              {/* 1. Page Header & Actions */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#FFFFFF', padding: '20px 24px', borderRadius: 16, border: '1px solid #E2E8F0', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
                <div>
                  <h2 style={{ fontSize: 22, fontWeight: 900, color: '#0F172A', margin: 0, letterSpacing: '-0.3px' }}>
                    Admit Cards Module
                  </h2>
                  <p style={{ fontSize: 13, color: '#64748B', margin: '4px 0 0 0' }}>
                    Generate, manage and print examination admit cards for students
                  </p>
                </div>
                <div style={{ display: 'flex', gap: 10 }}>
                  <button
                    type="button"
                    className="avm-btn-primary"
                    onClick={() => {
                      setGenAdcExamName(adcExamFilter || 'First Term Examination');
                      setGenAdcClassName(adcClassFilter !== 'All' ? adcClassFilter : 'Class 5');
                      setGenAdcSectionName(adcSectionFilter !== 'All' ? adcSectionFilter : 'A');
                      setIsGeneratingAdmitCards(true);
                    }}
                    style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '10px 18px', fontSize: 14 }}
                  >
                    <Plus size={18} /> + Generate Admit Cards
                  </button>
                </div>
              </div>

              {/* 2. Dynamic KPI Summary Cards */}
              {(() => {
                const allAdcRecords = getAdmitCardRecordsList();
                const totalStudentsCount = students.length;

                const examAdcRecords = allAdcRecords.filter(
                  (a) => (a.academicSessionId || '2026-27') === selectedSessionId && (!adcExamFilter || a.examName === adcExamFilter || a.examId === adcExamFilter)
                );

                const generatedCount = examAdcRecords.length;
                const publishedCount = examAdcRecords.filter((a) => a.status === 'Published').length;
                const pendingCount = Math.max(0, totalStudentsCount - generatedCount);

                return (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
                    <div className="avm-card" style={{ padding: 18, borderLeft: '4px solid #1769E0', backgroundColor: '#FFFFFF' }}>
                      <div style={{ fontSize: 12, fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>Total Students</div>
                      <div style={{ fontSize: 26, fontWeight: 900, color: '#0F172A', marginTop: 4 }}>{totalStudentsCount}</div>
                      <div style={{ fontSize: 11, color: '#1769E0', marginTop: 2, fontWeight: 700 }}>Active Enrolled Students</div>
                    </div>

                    <div className="avm-card" style={{ padding: 18, borderLeft: '4px solid #2563EB', backgroundColor: '#FFFFFF' }}>
                      <div style={{ fontSize: 12, fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>Generated</div>
                      <div style={{ fontSize: 26, fontWeight: 900, color: '#2563EB', marginTop: 4 }}>{generatedCount}</div>
                      <div style={{ fontSize: 11, color: '#64748B', marginTop: 2 }}>Admit Cards Created</div>
                    </div>

                    <div className="avm-card" style={{ padding: 18, borderLeft: '4px solid #D97706', backgroundColor: '#FFFFFF' }}>
                      <div style={{ fontSize: 12, fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>Pending</div>
                      <div style={{ fontSize: 26, fontWeight: 900, color: '#D97706', marginTop: 4 }}>{pendingCount}</div>
                      <div style={{ fontSize: 11, color: '#D97706', marginTop: 2, fontWeight: 700 }}>Awaiting Generation</div>
                    </div>

                    <div className="avm-card" style={{ padding: 18, borderLeft: '4px solid #16A34A', backgroundColor: '#FFFFFF' }}>
                      <div style={{ fontSize: 12, fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>Published</div>
                      <div style={{ fontSize: 26, fontWeight: 900, color: '#16A34A', marginTop: 4 }}>{publishedCount}</div>
                      <div style={{ fontSize: 11, color: '#16A34A', marginTop: 2, fontWeight: 700 }}>Visible in Student App</div>
                    </div>
                  </div>
                );
              })()}

              {/* 3. Toolbar & Filters */}
              <div className="avm-card" style={{ padding: 18, backgroundColor: '#FFFFFF', display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12 }}>
                  <div>
                    <label style={{ fontSize: 11, fontWeight: 800, color: '#475569', display: 'block', marginBottom: 4, textTransform: 'uppercase' }}>Academic Session:</label>
                    <select
                      className="avm-input"
                      value={selectedSessionId}
                      onChange={(e) => setSelectedSessionId(e.target.value)}
                      style={{ padding: '8px 12px', fontSize: 13, fontWeight: 800, backgroundColor: '#FEF08A', color: '#854D0E', border: '1px solid #FDE047' }}
                    >
                      {sessions.map((s) => (
                        <option key={s.id} value={s.id}>{s.name} {s.isActive ? '• ACTIVE' : ''}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label style={{ fontSize: 11, fontWeight: 800, color: '#475569', display: 'block', marginBottom: 4, textTransform: 'uppercase' }}>Examination:</label>
                    <select
                      className="avm-input"
                      value={adcExamFilter}
                      onChange={(e) => setAdcExamFilter(e.target.value)}
                      style={{ padding: '8px 12px', fontSize: 13, fontWeight: 800 }}
                    >
                      {['First Term Examination', 'Half Yearly Examination', 'Annual / Final Examination'].map((ex) => (
                        <option key={ex} value={ex}>{ex}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label style={{ fontSize: 11, fontWeight: 800, color: '#475569', display: 'block', marginBottom: 4, textTransform: 'uppercase' }}>Class Filter:</label>
                    <select
                      className="avm-input"
                      value={adcClassFilter}
                      onChange={(e) => setAdcClassFilter(e.target.value)}
                      style={{ padding: '8px 12px', fontSize: 13 }}
                    >
                      <option value="All">All Classes</option>
                      {['Nursery', 'LKG', 'UKG', 'Class 1', 'Class 2', 'Class 3', 'Class 4', 'Class 5', 'Class 6', 'Class 7', 'Class 8'].map((cName) => (
                        <option key={cName} value={cName}>{cName}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label style={{ fontSize: 11, fontWeight: 800, color: '#475569', display: 'block', marginBottom: 4, textTransform: 'uppercase' }}>Section:</label>
                    <select
                      className="avm-input"
                      value={adcSectionFilter}
                      onChange={(e) => setAdcSectionFilter(e.target.value)}
                      style={{ padding: '8px 12px', fontSize: 13 }}
                    >
                      <option value="All">All Sections</option>
                      <option value="A">Section A</option>
                      <option value="B">Section B</option>
                      <option value="C">Section C</option>
                    </select>
                  </div>

                  <div>
                    <label style={{ fontSize: 11, fontWeight: 800, color: '#475569', display: 'block', marginBottom: 4, textTransform: 'uppercase' }}>Status:</label>
                    <select
                      className="avm-input"
                      value={adcStatusFilter}
                      onChange={(e) => setAdcStatusFilter(e.target.value)}
                      style={{ padding: '8px 12px', fontSize: 13 }}
                    >
                      <option value="All">All Statuses</option>
                      <option value="Published">Published</option>
                      <option value="Generated">Generated</option>
                      <option value="Pending">Pending</option>
                    </select>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                  <div style={{ position: 'relative', flex: 1 }}>
                    <Search size={16} color="#64748B" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)' }} />
                    <input
                      type="text"
                      className="avm-input"
                      placeholder="Search student name, admission number, roll no..."
                      value={adcSearchQuery}
                      onChange={(e) => setAdcSearchQuery(e.target.value)}
                      style={{ paddingLeft: 36 }}
                    />
                  </div>

                  {selectedAdcStudentIds.length > 0 && (
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                      <span style={{ fontSize: 12, fontWeight: 800, color: '#1769E0' }}>
                        {selectedAdcStudentIds.length} Selected
                      </span>

                      <button
                        type="button"
                        className="avm-btn-primary"
                        onClick={() => {
                          const res = academicService.generateAdmitCards({
                            studentIds: selectedAdcStudentIds,
                            examId: adcExamFilter,
                            examName: adcExamFilter,
                            sessionId: selectedSessionId
                          });
                          showAdcToast(`Generated admit cards for ${res.count} selected students.`);
                          refreshAll(selectedSessionId);
                        }}
                        style={{ padding: '6px 12px', fontSize: 12 }}
                      >
                        Generate Selected
                      </button>

                      <button
                        type="button"
                        className="avm-btn-primary"
                        onClick={() => {
                          const allAdc = getAdmitCardRecordsList();
                          const targetAdcIds = allAdc
                            .filter((a) => selectedAdcStudentIds.includes(a.studentId) || selectedAdcStudentIds.includes(a.admissionNo))
                            .map((a) => a.id);

                          if (targetAdcIds.length === 0) {
                            alert('No generated admit cards found. Please click "Generate Selected" first.');
                            return;
                          }
                          academicService.updateAdmitCardStatus(targetAdcIds, 'Published');
                          showAdcToast(`Published ${targetAdcIds.length} admit cards to Student App.`);
                          refreshAll(selectedSessionId);
                        }}
                        style={{ padding: '6px 12px', fontSize: 12, backgroundColor: '#16A34A' }}
                      >
                        Publish Selected
                      </button>

                      <button
                        type="button"
                        className="avm-btn-secondary"
                        onClick={() => {
                          const recordsToPrint = getAdmitCardRecordsList().filter(
                            (a) => selectedAdcStudentIds.includes(a.studentId) || selectedAdcStudentIds.includes(a.admissionNo)
                          );
                          if (recordsToPrint.length === 0) {
                            alert('No generated admit cards found for selected students.');
                            return;
                          }
                          setBulkPrintAdmitCardsList(recordsToPrint);
                        }}
                        style={{ padding: '6px 12px', fontSize: 12 }}
                      >
                        <Printer size={14} /> Print Selected ({selectedAdcStudentIds.length})
                      </button>
                    </div>
                  )}

                  <button
                    type="button"
                    className="avm-btn-secondary"
                    onClick={() => {
                      const allCurrentRecords = getAdmitCardRecordsList().filter(
                        (a) => (a.academicSessionId || '2026-27') === selectedSessionId && (!adcExamFilter || a.examName === adcExamFilter)
                      );
                      if (allCurrentRecords.length === 0) {
                        alert('No admit cards generated yet for bulk print.');
                        return;
                      }
                      setBulkPrintAdmitCardsList(allCurrentRecords);
                    }}
                    style={{ padding: '8px 14px', fontSize: 13, display: 'flex', alignItems: 'center', gap: 6 }}
                  >
                    <Printer size={15} /> Print All Admit Cards
                  </button>
                </div>
              </div>

              {/* 4. Student Admit Cards List Table */}
              {(() => {
                const allAdcRecords = getAdmitCardRecordsList();

                const filteredStudents = students.filter((stu) => {
                  const sCls = (stu.className || '').trim();
                  const cName = sCls.includes('-') ? sCls.split('-')[0] : sCls;
                  const sSec = stu.section || (sCls.includes('-') ? sCls.split('-')[1] : 'A');

                  if (adcClassFilter !== 'All' && cName.toLowerCase() !== adcClassFilter.toLowerCase()) return false;
                  if (adcSectionFilter !== 'All' && sSec.toLowerCase() !== adcSectionFilter.toLowerCase()) return false;

                  const existingAdc = allAdcRecords.find(
                    (a) =>
                      (a.studentId === stu.id || a.admissionNo === stu.admissionNo) &&
                      (a.examName === adcExamFilter || a.examId === adcExamFilter) &&
                      (a.academicSessionId || '2026-27') === selectedSessionId
                  );

                  const curStatus = existingAdc ? existingAdc.status : 'Pending';
                  if (adcStatusFilter !== 'All' && curStatus.toLowerCase() !== adcStatusFilter.toLowerCase()) return false;

                  if (adcSearchQuery.trim()) {
                    const q = adcSearchQuery.trim().toLowerCase();
                    const matchName = (stu.name || '').toLowerCase().includes(q);
                    const matchAdm = (stu.admissionNo || '').toLowerCase().includes(q);
                    const matchRoll = String(stu.rollNo || '').includes(q);
                    if (!matchName && !matchAdm && !matchRoll) return false;
                  }

                  return true;
                });

                if (filteredStudents.length === 0) {
                  return (
                    <div className="avm-card" style={{ padding: 40, textAlign: 'center', backgroundColor: '#FFFFFF' }}>
                      <FileCheck size={48} color="#94A3B8" style={{ marginBottom: 12 }} />
                      <h4 style={{ fontSize: 16, fontWeight: 800, color: '#0F172A', margin: 0 }}>No Admit Cards Found</h4>
                      <p style={{ fontSize: 13, color: '#64748B', marginTop: 4 }}>
                        No students match your selected filters. Try changing search or click "+ Generate Admit Cards" to get started.
                      </p>
                    </div>
                  );
                }

                const isAllSelected = filteredStudents.length > 0 && filteredStudents.every((s) => selectedAdcStudentIds.includes(s.id));

                return (
                  <div className="avm-card" style={{ backgroundColor: '#FFFFFF', padding: 0, overflow: 'hidden' }}>
                    <div style={{ overflowX: 'auto' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                        <thead>
                          <tr style={{ backgroundColor: '#1769E0', color: '#FFFFFF', textAlign: 'left' }}>
                            <th style={{ padding: '12px 14px', width: 40 }}>
                              <input
                                type="checkbox"
                                checked={isAllSelected}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setSelectedAdcStudentIds(filteredStudents.map((s) => s.id));
                                  } else {
                                    setSelectedAdcStudentIds([]);
                                  }
                                }}
                                style={{ width: 16, height: 16, accentColor: '#1769E0', cursor: 'pointer' }}
                              />
                            </th>
                            <th style={{ padding: '12px 14px' }}>Student</th>
                            <th style={{ padding: '12px 14px' }}>Admission No</th>
                            <th style={{ padding: '12px 14px' }}>Class & Sec</th>
                            <th style={{ padding: '12px 14px' }}>Roll No</th>
                            <th style={{ padding: '12px 14px' }}>Exam</th>
                            <th style={{ padding: '12px 14px' }}>Status</th>
                            <th style={{ padding: '12px 14px', textAlign: 'right' }}>Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredStudents.map((stu, idx) => {
                            const adcRecord = allAdcRecords.find(
                              (a) =>
                                (a.studentId === stu.id || a.admissionNo === stu.admissionNo) &&
                                (a.examName === adcExamFilter || a.examId === adcExamFilter) &&
                                (a.academicSessionId || '2026-27') === selectedSessionId
                            );

                            const isSelected = selectedAdcStudentIds.includes(stu.id);
                            const status = adcRecord ? adcRecord.status : 'Pending';
                            const formattedClassSec = classService.formatClassDisplay(stu.className, stu.section);

                            return (
                              <tr key={stu.id} style={{ borderBottom: '1px solid #F1F5F9', backgroundColor: idx % 2 === 0 ? '#FFFFFF' : '#F8FAFC' }}>
                                <td style={{ padding: '12px 14px' }}>
                                  <input
                                    type="checkbox"
                                    checked={isSelected}
                                    onChange={(e) => {
                                      if (e.target.checked) {
                                        setSelectedAdcStudentIds((prev) => [...prev, stu.id]);
                                      } else {
                                        setSelectedAdcStudentIds((prev) => prev.filter((id) => id !== stu.id));
                                      }
                                    }}
                                    style={{ width: 16, height: 16, accentColor: '#1769E0', cursor: 'pointer' }}
                                  />
                                </td>

                                <td style={{ padding: '12px 14px' }}>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                    {stu.photo ? (
                                      <img src={stu.photo} alt={stu.name} style={{ width: 34, height: 34, borderRadius: '50%', objectFit: 'cover', border: '1px solid #CBD5E1' }} />
                                    ) : (
                                      <div style={{ width: 34, height: 34, borderRadius: '50%', backgroundColor: '#E2E8F0', color: '#475569', fontSize: 11, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        {stu.name.slice(0, 2).toUpperCase()}
                                      </div>
                                    )}
                                    <div>
                                      <div style={{ fontWeight: 800, color: '#0F172A' }}>{stu.name}</div>
                                      <div style={{ fontSize: 11, color: '#64748B' }}>F: {stu.fatherName || 'Parent'}</div>
                                    </div>
                                  </div>
                                </td>

                                <td style={{ padding: '12px 14px', fontWeight: 800, color: '#1769E0' }}>
                                  {stu.admissionNo}
                                </td>

                                <td style={{ padding: '12px 14px', fontWeight: 800, color: '#0F172A' }}>
                                  {formattedClassSec}
                                </td>

                                <td style={{ padding: '12px 14px', fontWeight: 800, color: '#334155' }}>
                                  {stu.rollNo || '-'}
                                </td>

                                <td style={{ padding: '12px 14px', fontWeight: 700, color: '#475569' }}>
                                  {adcExamFilter}
                                </td>

                                <td style={{ padding: '12px 14px' }}>
                                  <span style={{
                                    backgroundColor: status === 'Published' ? '#DCFCE7' : status === 'Generated' ? '#EFF6FF' : '#F1F5F9',
                                    color: status === 'Published' ? '#15803D' : status === 'Generated' ? '#1D4ED8' : '#64748B',
                                    fontWeight: 800,
                                    fontSize: 11,
                                    padding: '3px 10px',
                                    borderRadius: 12
                                  }}>
                                    {status.toUpperCase()}
                                  </span>
                                </td>

                                <td style={{ padding: '12px 14px', textAlign: 'right' }}>
                                  <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                                    <button
                                      type="button"
                                      className="avm-btn-secondary"
                                      onClick={() => {
                                        setPreviewAdmitCardRecord(
                                          adcRecord || {
                                            id: `ADC-${stu.id}-TEMP`,
                                            studentId: stu.id,
                                            studentName: stu.name,
                                            admissionNo: stu.admissionNo,
                                            className: stu.className ? stu.className.split('-')[0] : 'Class 5',
                                            section: stu.section || 'A',
                                            rollNo: stu.rollNo || 1,
                                            examId: adcExamFilter,
                                            examName: adcExamFilter,
                                            academicSessionId: selectedSessionId,
                                            examCentre: 'Adarsh Vidya Mandir, Kajraili, Bhagalpur',
                                            reportingTime: '08:30 AM',
                                            status: 'Generated'
                                          }
                                        );
                                      }}
                                      style={{ padding: '4px 10px', fontSize: 11, fontWeight: 700 }}
                                    >
                                      View
                                    </button>

                                    {adcRecord && (
                                      <>
                                        <button
                                          type="button"
                                          className="avm-btn-secondary"
                                          onClick={() => setEditingAdmitCardRecord({ ...adcRecord })}
                                          style={{ padding: '4px 10px', fontSize: 11, fontWeight: 700 }}
                                        >
                                          Edit
                                        </button>

                                        <button
                                          type="button"
                                          onClick={() => handleTogglePublishAdmitCard(adcRecord)}
                                          style={{
                                            backgroundColor: adcRecord.status === 'Published' ? '#FEF3C7' : '#DCFCE7',
                                            color: adcRecord.status === 'Published' ? '#B45309' : '#15803D',
                                            border: 'none',
                                            borderRadius: 6,
                                            padding: '4px 10px',
                                            fontSize: 11,
                                            fontWeight: 800,
                                            cursor: 'pointer'
                                          }}
                                        >
                                          {adcRecord.status === 'Published' ? 'Unpublish' : 'Publish'}
                                        </button>
                                      </>
                                    )}
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                );
              })()}
            </div>
          )}

          {activeTab === 'fees' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              {/* Header Bar */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#FFFFFF', padding: '20px 24px', borderRadius: 16, border: '1px solid #E2E8F0', boxShadow: '0 2px 8px rgba(0,0,0,0.04)', flexWrap: 'wrap', gap: 14 }}>
                <div>
                  <h2 style={{ fontSize: 22, fontWeight: 900, color: '#0F172A', margin: 0, letterSpacing: '-0.3px', display: 'flex', alignItems: 'center', gap: 10 }}>
                    <CreditCard size={24} color="#1769E0" />
                    Fees Module
                  </h2>
                  <p style={{ fontSize: 13, color: '#64748B', margin: '4px 0 0 0' }}>
                    Welcome to Adarsh Vidya Mandir Admin Panel • Academic Session: <strong style={{ color: '#1769E0' }}>{selectedSessionId}</strong>
                  </p>
                </div>

                <div style={{ display: 'flex', gap: 10 }}>
                  <button
                    type="button"
                    className="avm-btn-primary"
                    onClick={() => openUpdateFeeModal(null)}
                    style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '10px 18px', fontSize: 14 }}
                  >
                    <Plus size={18} /> + Update Student Fee
                  </button>
                </div>
              </div>

              {/* Filter Section */}
              <div className="avm-card" style={{ padding: 18, backgroundColor: '#FFFFFF', display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: 12 }}>
                  <div>
                    <label style={{ fontSize: 11, fontWeight: 800, color: '#475569', display: 'block', marginBottom: 4, textTransform: 'uppercase' }}>Academic Session:</label>
                    <select
                      className="avm-input"
                      value={selectedSessionId}
                      onChange={(e) => setSelectedSessionId(e.target.value)}
                      style={{ padding: '8px 12px', fontSize: 13, fontWeight: 800, backgroundColor: '#FEF08A', color: '#854D0E', border: '1px solid #FDE047' }}
                    >
                      {sessions.map((s) => (
                        <option key={s.id} value={s.id}>{s.name} {s.isActive ? '• ACTIVE' : ''}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label style={{ fontSize: 11, fontWeight: 800, color: '#475569', display: 'block', marginBottom: 4, textTransform: 'uppercase' }}>Class:</label>
                    <select
                      className="avm-input"
                      value={feeClassFilter}
                      onChange={(e) => {
                        setFeeClassFilter(e.target.value);
                        setFeeStudentFilter('All');
                      }}
                      style={{ padding: '8px 12px', fontSize: 13 }}
                    >
                      <option value="All">All Classes</option>
                      {['Nursery', 'LKG', 'UKG', 'Class 1', 'Class 2', 'Class 3', 'Class 4', 'Class 5', 'Class 6', 'Class 7', 'Class 8'].map((c) => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label style={{ fontSize: 11, fontWeight: 800, color: '#475569', display: 'block', marginBottom: 4, textTransform: 'uppercase' }}>Section:</label>
                    <select
                      className="avm-input"
                      value={feeSectionFilter}
                      onChange={(e) => {
                        setFeeSectionFilter(e.target.value);
                        setFeeStudentFilter('All');
                      }}
                      style={{ padding: '8px 12px', fontSize: 13 }}
                    >
                      <option value="All">All Sections</option>
                      <option value="A">Section A</option>
                      <option value="B">Section B</option>
                      <option value="C">Section C</option>
                    </select>
                  </div>

                  <div>
                    <label style={{ fontSize: 11, fontWeight: 800, color: '#475569', display: 'block', marginBottom: 4, textTransform: 'uppercase' }}>Student:</label>
                    <select
                      className="avm-input"
                      value={feeStudentFilter}
                      onChange={(e) => setFeeStudentFilter(e.target.value)}
                      style={{ padding: '8px 12px', fontSize: 13 }}
                    >
                      <option value="All">All Students</option>
                      {students
                        .filter((s) => {
                          const matchesClass = feeClassFilter === 'All' || s.className === feeClassFilter || s.className?.startsWith(feeClassFilter);
                          const matchesSec = feeSectionFilter === 'All' || s.section === feeSectionFilter;
                          return matchesClass && matchesSec;
                        })
                        .map((s) => (
                          <option key={s.id} value={s.id}>{s.name} ({s.admissionNo})</option>
                        ))}
                    </select>
                  </div>

                  <div>
                    <label style={{ fontSize: 11, fontWeight: 800, color: '#475569', display: 'block', marginBottom: 4, textTransform: 'uppercase' }}>Fee Status:</label>
                    <select
                      className="avm-input"
                      value={feeStatusFilter}
                      onChange={(e) => setFeeStatusFilter(e.target.value)}
                      style={{ padding: '8px 12px', fontSize: 13 }}
                    >
                      <option value="All">All Statuses</option>
                      <option value="PAID">PAID</option>
                      <option value="PARTIAL">PARTIAL</option>
                      <option value="PENDING">PENDING</option>
                    </select>
                  </div>

                  <div>
                    <label style={{ fontSize: 11, fontWeight: 800, color: '#475569', display: 'block', marginBottom: 4, textTransform: 'uppercase' }}>Fee Type:</label>
                    <select
                      className="avm-input"
                      value={feeTypeFilter}
                      onChange={(e) => setFeeTypeFilter(e.target.value)}
                      style={{ padding: '8px 12px', fontSize: 13 }}
                    >
                      <option value="All">All Fee Types</option>
                      <option value="Tuition Fee">Tuition Fee</option>
                      <option value="Annual Fee">Annual Fee</option>
                      <option value="Exam Fee">Exam Fee</option>
                      <option value="Computer Fee">Computer Fee</option>
                      <option value="Development Fee">Development Fee</option>
                      <option value="Transport Fee">Transport Fee</option>
                      <option value="Other Fee">Other Fee</option>
                    </select>
                  </div>

                  <div>
                    <label style={{ fontSize: 11, fontWeight: 800, color: '#475569', display: 'block', marginBottom: 4, textTransform: 'uppercase' }}>Payment Mode:</label>
                    <select
                      className="avm-input"
                      value={feePaymentModeFilter}
                      onChange={(e) => setFeePaymentModeFilter(e.target.value)}
                      style={{ padding: '8px 12px', fontSize: 13 }}
                    >
                      <option value="All">All Payment Modes</option>
                      <option value="Cash">Cash</option>
                      <option value="UPI">UPI</option>
                      <option value="Bank Transfer">Bank Transfer</option>
                      <option value="Cheque">Cheque</option>
                      <option value="Online">Online</option>
                    </select>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                  <div style={{ position: 'relative', flex: 1 }}>
                    <Search size={16} color="#64748B" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)' }} />
                    <input
                      type="text"
                      className="avm-input"
                      placeholder="Search by student name, admission no., or student ID..."
                      value={feeSearchQuery}
                      onChange={(e) => setFeeSearchQuery(e.target.value)}
                      style={{ paddingLeft: 36 }}
                    />
                  </div>

                  <button
                    type="button"
                    className="avm-btn-secondary"
                    onClick={() => {
                      setFeeClassFilter('All');
                      setFeeSectionFilter('All');
                      setFeeStudentFilter('All');
                      setFeeSearchQuery('');
                      setFeeStatusFilter('All');
                      setFeeTypeFilter('All');
                      setFeePaymentModeFilter('All');
                    }}
                    style={{ padding: '8px 16px', fontSize: 13, fontWeight: 700 }}
                  >
                    Reset
                  </button>
                </div>
              </div>

              {/* Dynamic KPI Summary Cards */}
              {(() => {
                const allFeeRecords = feeService.getAllFeeRecords(selectedSessionId);
                const filteredRecords = allFeeRecords.filter((f) => {
                  if (feeClassFilter !== 'All') {
                    const c = (f.className || '').toLowerCase();
                    const targetC = feeClassFilter.toLowerCase();
                    if (!c.includes(targetC)) return false;
                  }
                  if (feeSectionFilter !== 'All') {
                    if (f.section !== feeSectionFilter) return false;
                  }
                  if (feeStudentFilter !== 'All') {
                    if (f.studentId !== feeStudentFilter) return false;
                  }
                  if (feeStatusFilter !== 'All') {
                    if (f.status !== feeStatusFilter) return false;
                  }
                  if (feeTypeFilter !== 'All') {
                    const hasType = (f.feeStructure || []).some(item => item.name.toLowerCase() === feeTypeFilter.toLowerCase());
                    if (!hasType) return false;
                  }
                  if (feePaymentModeFilter !== 'All') {
                    const hasMode = (f.paymentHistory || []).some(h => h.paymentMode.toLowerCase() === feePaymentModeFilter.toLowerCase());
                    if (!hasMode) return false;
                  }
                  if (feeSearchQuery.trim()) {
                    const q = feeSearchQuery.toLowerCase().trim();
                    const nameMatch = (f.studentName || '').toLowerCase().includes(q);
                    const admMatch = (f.admissionNo || '').toLowerCase().includes(q);
                    const idMatch = (f.studentId || '').toLowerCase().includes(q);
                    if (!nameMatch && !admMatch && !idMatch) return false;
                  }
                  return true;
                });

                const totalStudentsCount = filteredRecords.length;
                const totalFeeSum = filteredRecords.reduce((sum, r) => sum + r.totalFee, 0);
                const totalCollectedSum = filteredRecords.reduce((sum, r) => sum + r.paidFee, 0);
                const totalPendingSum = filteredRecords.reduce((sum, r) => sum + r.pendingFee, 0);

                return (
                  <>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
                      <div className="avm-card" style={{ padding: 18, borderLeft: '4px solid #1769E0', backgroundColor: '#FFFFFF' }}>
                        <div style={{ fontSize: 12, fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>Total Students</div>
                        <div style={{ fontSize: 26, fontWeight: 900, color: '#0F172A', marginTop: 4 }}>{totalStudentsCount}</div>
                        <div style={{ fontSize: 11, color: '#1769E0', marginTop: 2, fontWeight: 700 }}>Matching Filters</div>
                      </div>

                      <div className="avm-card" style={{ padding: 18, borderLeft: '4px solid #4F46E5', backgroundColor: '#FFFFFF' }}>
                        <div style={{ fontSize: 12, fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>Total Fee</div>
                        <div style={{ fontSize: 26, fontWeight: 900, color: '#4F46E5', marginTop: 4 }}>₹{totalFeeSum.toLocaleString('en-IN')}</div>
                        <div style={{ fontSize: 11, color: '#64748B', marginTop: 2 }}>Session Fee Demand</div>
                      </div>

                      <div className="avm-card" style={{ padding: 18, borderLeft: '4px solid #16A34A', backgroundColor: '#FFFFFF' }}>
                        <div style={{ fontSize: 12, fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>Total Collected</div>
                        <div style={{ fontSize: 26, fontWeight: 900, color: '#16A34A', marginTop: 4 }}>₹{totalCollectedSum.toLocaleString('en-IN')}</div>
                        <div style={{ fontSize: 11, color: '#16A34A', marginTop: 2, fontWeight: 700 }}>Fee Received</div>
                      </div>

                      <div className="avm-card" style={{ padding: 18, borderLeft: '4px solid #EF4444', backgroundColor: '#FFFFFF' }}>
                        <div style={{ fontSize: 12, fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>Total Pending</div>
                        <div style={{ fontSize: 26, fontWeight: 900, color: '#EF4444', marginTop: 4 }}>₹{totalPendingSum.toLocaleString('en-IN')}</div>
                        <div style={{ fontSize: 11, color: '#EF4444', marginTop: 2, fontWeight: 700 }}>Outstanding Balance</div>
                      </div>
                    </div>

                    {/* Fee Management Table */}
                    <div className="avm-card" style={{ padding: 20 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                        <h3 style={{ fontSize: 16, fontWeight: 800, color: '#0F172A', margin: 0 }}>
                          Student Fee Records ({filteredRecords.length})
                        </h3>
                        {feeClassFilter !== 'All' && (
                          <span style={{ fontSize: 12, fontWeight: 800, color: '#1769E0', backgroundColor: '#EFF6FF', padding: '4px 12px', borderRadius: 12 }}>
                            {feeClassFilter}{feeSectionFilter !== 'All' ? `-${feeSectionFilter}` : ''} • {filteredRecords.length} Students
                          </span>
                        )}
                      </div>

                      {filteredRecords.length === 0 ? (
                        <div style={{ padding: '60px 20px', textAlign: 'center', color: '#64748B' }}>
                          <div style={{ width: 60, height: 60, borderRadius: '50%', backgroundColor: '#F1F5F9', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px', color: '#94A3B8' }}>
                            <CreditCard size={28} />
                          </div>
                          <h4 style={{ fontSize: 16, fontWeight: 800, color: '#0F172A', margin: 0 }}>No fee records found</h4>
                          <p style={{ fontSize: 13, color: '#64748B', marginTop: 4 }}>Try changing the class, section or search criteria.</p>
                        </div>
                      ) : (
                        <div style={{ overflowX: 'auto' }}>
                          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                            <thead>
                              <tr style={{ backgroundColor: '#F8FAFC', borderBottom: '2px solid #E2E8F0', color: '#64748B', textAlign: 'left' }}>
                                <th style={{ padding: '12px 14px' }}>Student ID</th>
                                <th style={{ padding: '12px 14px' }}>Admission No.</th>
                                <th style={{ padding: '12px 14px' }}>Student Name</th>
                                <th style={{ padding: '12px 14px' }}>Class & Section</th>
                                <th style={{ padding: '12px 14px' }}>Fee Breakdown</th>
                                <th style={{ padding: '12px 14px' }}>Total Fee</th>
                                <th style={{ padding: '12px 14px' }}>Paid</th>
                                <th style={{ padding: '12px 14px' }}>Pending</th>
                                <th style={{ padding: '12px 14px' }}>Last Payment</th>
                                <th style={{ padding: '12px 14px' }}>Status</th>
                                <th style={{ padding: '12px 14px', textAlign: 'right' }}>Actions</th>
                              </tr>
                            </thead>
                            <tbody>
                              {filteredRecords.map((r, idx) => {
                                const cleanC = r.className ? r.className.split('-')[0].trim() : 'Class 5';
                                const cleanS = r.section || 'A';
                                const classDisplay = `${cleanC}-${cleanS}`;

                                return (
                                  <tr key={r.id || r.studentId} style={{ borderBottom: '1px solid #F1F5F9', backgroundColor: idx % 2 === 0 ? '#FFFFFF' : '#F8FAFC' }}>
                                    <td style={{ padding: '12px 14px', fontWeight: 800, color: '#1769E0' }}>{r.studentId}</td>
                                    <td style={{ padding: '12px 14px', fontWeight: 700, color: '#475569' }}>{r.admissionNo}</td>
                                    <td style={{ padding: '12px 14px' }}>
                                      <strong style={{ color: '#0F172A', display: 'block' }}>{r.studentName}</strong>
                                      <span style={{ fontSize: 11, color: '#64748B' }}>Roll: {r.rollNo || '-'}</span>
                                    </td>
                                    <td style={{ padding: '12px 14px', fontWeight: 800, color: '#0F172A' }}>{classDisplay}</td>
                                    <td style={{ padding: '12px 14px', fontSize: 12, color: '#475569' }}>
                                      {(r.feeStructure || []).map(item => item.name).join(', ') || 'Tuition Fee'}
                                    </td>
                                    <td style={{ padding: '12px 14px', fontWeight: 800, color: '#0F172A' }}>₹{r.totalFee.toLocaleString('en-IN')}</td>
                                    <td style={{ padding: '12px 14px', fontWeight: 800, color: '#16A34A' }}>₹{r.paidFee.toLocaleString('en-IN')}</td>
                                    <td style={{ padding: '12px 14px', fontWeight: 800, color: '#EF4444' }}>₹{r.pendingFee.toLocaleString('en-IN')}</td>
                                    <td style={{ padding: '12px 14px', fontSize: 12, color: '#64748B' }}>{r.lastPaymentDate || '-'}</td>
                                    <td style={{ padding: '12px 14px' }}>
                                      <span style={{
                                        backgroundColor: r.status === 'PAID' ? '#DCFCE7' : r.status === 'PARTIAL' ? '#EFF6FF' : '#FEF2F2',
                                        color: r.status === 'PAID' ? '#15803D' : r.status === 'PARTIAL' ? '#1D4ED8' : '#DC2626',
                                        fontWeight: 900,
                                        fontSize: 11,
                                        padding: '4px 10px',
                                        borderRadius: 12
                                      }}>
                                        {r.status}
                                      </span>
                                    </td>
                                    <td style={{ padding: '12px 14px', textAlign: 'right' }}>
                                      <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                                        <button
                                          type="button"
                                          className="avm-btn-secondary"
                                          onClick={() => setViewFeeRecord(r)}
                                          style={{ padding: '4px 10px', fontSize: 11, fontWeight: 700 }}
                                        >
                                          View
                                        </button>
                                        <button
                                          type="button"
                                          className="avm-btn-secondary"
                                          onClick={() => openUpdateFeeModal(r)}
                                          style={{ padding: '4px 10px', fontSize: 11, fontWeight: 700, borderColor: '#1769E0', color: '#1769E0' }}
                                        >
                                          Update Fee
                                        </button>
                                        {r.pendingFee > 0 && (
                                          <button
                                            type="button"
                                            className="avm-btn-primary"
                                            onClick={() => openRecordPaymentModal(r)}
                                            style={{ padding: '4px 10px', fontSize: 11, fontWeight: 800, backgroundColor: '#16A34A' }}
                                          >
                                            + Record Payment
                                          </button>
                                        )}
                                      </div>
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  </>
                );
              })()}
            </div>
          )}

          {activeTab === 'notices' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              {/* Top Header & Search/Filter Toolbar Card */}
              <div className="avm-card" style={{ padding: 24, background: 'linear-gradient(135deg, #FFFFFF 0%, #F8FAFC 100%)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
                  <div>
                    <h2 style={{ fontSize: 20, fontWeight: 800, color: '#0F172A', margin: 0, display: 'flex', alignItems: 'center', gap: 10 }}>
                      <Bell size={24} style={{ color: '#1769E0' }} />
                      Notices Module
                    </h2>
                    <p style={{ fontSize: 13, color: '#64748B', margin: '4px 0 0 0', fontWeight: 500 }}>
                      Manage and broadcast school notices, circulars and announcements.
                    </p>
                  </div>
                  <button
                    className="avm-btn-primary"
                    onClick={openCreateNoticeModal}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 8,
                      padding: '10px 20px',
                      fontSize: 14,
                      fontWeight: 800,
                      borderRadius: 10,
                      boxShadow: '0 4px 12px rgba(23,105,224,0.25)'
                    }}
                  >
                    <Plus size={18} /> + Create New Notice
                  </button>
                </div>

                {/* Filter and Search Toolbar */}
                <div style={{
                  marginTop: 20,
                  paddingTop: 16,
                  borderTop: '1px solid #E2E8F0',
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                  gap: 12,
                  alignItems: 'center'
                }}>
                  {/* Search Input */}
                  <div style={{ position: 'relative' }}>
                    <Search size={16} style={{ position: 'absolute', left: 12, top: 12, color: '#94A3B8' }} />
                    <input
                      type="text"
                      className="avm-input"
                      placeholder="Search notices..."
                      value={noticeSearchQuery}
                      onChange={(e) => setNoticeSearchQuery(e.target.value)}
                      style={{ paddingLeft: 36, height: 40, fontSize: 13 }}
                    />
                  </div>

                  {/* Notice Type Filter */}
                  <div>
                    <select
                      className="avm-input"
                      value={noticeTypeFilter}
                      onChange={(e) => setNoticeTypeFilter(e.target.value)}
                      style={{ height: 40, fontSize: 13 }}
                    >
                      <option value="All">All Types</option>
                      <option value="General">General</option>
                      <option value="Academic">Academic</option>
                      <option value="Exam">Exam</option>
                      <option value="Holiday">Holiday</option>
                      <option value="PTM">PTM</option>
                      <option value="Homework">Homework</option>
                      <option value="Fee">Fee</option>
                      <option value="Emergency">Emergency</option>
                      <option value="Event">Event</option>
                      <option value="Circular">Circular</option>
                    </select>
                  </div>

                  {/* Recipient Filter */}
                  <div>
                    <select
                      className="avm-input"
                      value={noticeRecipientFilter}
                      onChange={(e) => setNoticeRecipientFilter(e.target.value)}
                      style={{ height: 40, fontSize: 13 }}
                    >
                      <option value="All">All Recipients</option>
                      <option value="Students">Students</option>
                      <option value="Employees">Employees</option>
                      <option value="Students + Employees">Students + Employees</option>
                    </select>
                  </div>

                  {/* Status Filter */}
                  <div>
                    <select
                      className="avm-input"
                      value={noticeStatusFilter}
                      onChange={(e) => setNoticeStatusFilter(e.target.value)}
                      style={{ height: 40, fontSize: 13 }}
                    >
                      <option value="All">All Statuses</option>
                      <option value="Published">Published</option>
                      <option value="Draft">Draft</option>
                      <option value="Scheduled">Scheduled</option>
                      <option value="Archived">Archived</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Notice History List Section */}
              <div className="avm-card" style={{ padding: 24 }}>
                {(() => {
                  const filteredNotices = notices.filter((n) => {
                    if (noticeSearchQuery) {
                      const q = noticeSearchQuery.toLowerCase();
                      const matchTitle = (n.title || '').toLowerCase().includes(q);
                      const matchDesc = (n.description || '').toLowerCase().includes(q);
                      const matchType = (n.type || n.category || '').toLowerCase().includes(q);
                      if (!matchTitle && !matchDesc && !matchType) return false;
                    }

                    if (noticeTypeFilter !== 'All') {
                      if ((n.type || n.category || '').toLowerCase() !== noticeTypeFilter.toLowerCase()) return false;
                    }

                    if (noticeRecipientFilter !== 'All') {
                      const r = n.recipients || 'both';
                      if (noticeRecipientFilter === 'Students' && r !== 'students') return false;
                      if (noticeRecipientFilter === 'Employees' && r !== 'employees') return false;
                      if (noticeRecipientFilter === 'Students + Employees' && r !== 'both') return false;
                    }

                    if (noticeStatusFilter !== 'All') {
                      if ((n.status || 'Published').toLowerCase() !== noticeStatusFilter.toLowerCase()) return false;
                    }

                    return true;
                  });

                  return (
                    <>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                        <div>
                          <h3 style={{ fontSize: 16, fontWeight: 800, color: '#0F172A', margin: 0 }}>Notice History</h3>
                          <p style={{ fontSize: 12, color: '#64748B', margin: '2px 0 0 0' }}>
                            Showing {filteredNotices.length} notices in persistent ERP history
                          </p>
                        </div>
                      </div>

                      {filteredNotices.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '40px 20px', color: '#64748B' }}>
                          <AlertCircle size={36} style={{ color: '#CBD5E1', marginBottom: 8 }} />
                          <p style={{ fontSize: 14, fontWeight: 700, margin: '4px 0' }}>No notices found</p>
                          <p style={{ fontSize: 12, margin: 0 }}>Try clearing search criteria or creating a new notice.</p>
                        </div>
                      ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                          {filteredNotices.map((n) => {
                            const stats = noticeService.getNoticeReadStats(n);
                            const typeStyle = getNoticeTypeStyle(n.type || n.category || 'General');
                            const recipients = n.recipients || 'both';

                            return (
                              <div
                                key={n.id}
                                className="avm-card"
                                style={{
                                  padding: 18,
                                  borderLeft: `4px solid ${n.status === 'Draft' ? '#94A3B8' : n.status === 'Archived' ? '#EF4444' : n.status === 'Scheduled' ? '#F59E0B' : '#1769E0'}`,
                                  transition: 'all 0.2s ease',
                                  boxShadow: '0 2px 6px rgba(0,0,0,0.03)'
                                }}
                              >
                                {/* Badges Row */}
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8, marginBottom: 10 }}>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                                    {/* Notice Type Badge */}
                                    <span style={{
                                      fontSize: 11,
                                      fontWeight: 800,
                                      backgroundColor: typeStyle.bg,
                                      color: typeStyle.text,
                                      padding: '4px 10px',
                                      borderRadius: 12
                                    }}>
                                      {n.type || n.category || 'General'}
                                    </span>

                                    {/* Recipient Badge */}
                                    {recipients === 'students' && (
                                      <span style={{
                                        fontSize: 11,
                                        fontWeight: 800,
                                        backgroundColor: '#E0F2FE',
                                        color: '#0284C7',
                                        padding: '4px 10px',
                                        borderRadius: 12,
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        gap: 4
                                      }}>
                                        👨🎓 Students
                                      </span>
                                    )}
                                    {recipients === 'employees' && (
                                      <span style={{
                                        fontSize: 11,
                                        fontWeight: 800,
                                        backgroundColor: '#F3E8FF',
                                        color: '#7C3AED',
                                        padding: '4px 10px',
                                        borderRadius: 12,
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        gap: 4
                                      }}>
                                        👨🏫 Employees
                                      </span>
                                    )}
                                    {recipients === 'both' && (
                                      <span style={{
                                        fontSize: 11,
                                        fontWeight: 800,
                                        backgroundColor: '#EEF2FF',
                                        color: '#4F46E5',
                                        padding: '4px 10px',
                                        borderRadius: 12,
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        gap: 4
                                      }}>
                                        👥 Students + Employees
                                      </span>
                                    )}

                                    {/* Target Details Badge */}
                                    {n.targetClass && n.targetClass !== 'All' && (
                                      <span style={{ fontSize: 11, fontWeight: 700, backgroundColor: '#F1F5F9', color: '#475569', padding: '3px 8px', borderRadius: 6 }}>
                                        Class: {n.targetClass} {n.targetSection && n.targetSection !== 'All' ? `(${n.targetSection})` : ''}
                                      </span>
                                    )}

                                    {n.targetDepartment && n.targetDepartment !== 'All' && (
                                      <span style={{ fontSize: 11, fontWeight: 700, backgroundColor: '#F1F5F9', color: '#475569', padding: '3px 8px', borderRadius: 6 }}>
                                        Dept: {n.targetDepartment}
                                      </span>
                                    )}
                                  </div>

                                  {/* Status Badge */}
                                  <div>
                                    <span style={{
                                      fontSize: 11,
                                      fontWeight: 800,
                                      padding: '4px 10px',
                                      borderRadius: 12,
                                      backgroundColor: n.status === 'Published' ? '#DCFCE7' : n.status === 'Draft' ? '#F1F5F9' : n.status === 'Scheduled' ? '#FEF3C7' : '#FEE2E2',
                                      color: n.status === 'Published' ? '#15803D' : n.status === 'Draft' ? '#64748B' : n.status === 'Scheduled' ? '#D97706' : '#B91C1C'
                                    }}>
                                      ● {n.status || 'Published'}
                                    </span>
                                  </div>
                                </div>

                                {/* Content */}
                                <h4 style={{ fontSize: 16, fontWeight: 800, color: '#0F172A', margin: '6px 0' }}>
                                  {n.title}
                                </h4>
                                <p style={{ fontSize: 13, color: '#475569', margin: '0 0 12px 0', lineHeight: 1.5, whiteSpace: 'pre-line' }}>
                                  {n.description}
                                </p>

                                {/* Attachment */}
                                {n.attachmentName && (
                                  <div style={{ marginBottom: 12 }}>
                                    <span style={{
                                      fontSize: 11,
                                      fontWeight: 700,
                                      color: '#1769E0',
                                      backgroundColor: '#EAF3FF',
                                      padding: '4px 10px',
                                      borderRadius: 6,
                                      display: 'inline-flex',
                                      alignItems: 'center',
                                      gap: 6
                                    }}>
                                      <Paperclip size={13} /> {n.attachmentName}
                                    </span>
                                  </div>
                                )}

                                {/* Footer & Actions */}
                                <div style={{
                                  display: 'flex',
                                  justifyContent: 'space-between',
                                  alignItems: 'center',
                                  flexWrap: 'wrap',
                                  gap: 12,
                                  paddingTop: 10,
                                  borderTop: '1px solid #F1F5F9',
                                  fontSize: 12
                                }}>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap', color: '#64748B' }}>
                                    <span>
                                      📅 {n.publishDate || n.date} • {n.publishTime || '10:30 AM'}
                                    </span>
                                    <span style={{ fontWeight: 700, color: '#1769E0' }}>
                                      📊 {stats.totalEligible} Recipients ({stats.readCount} Read • {stats.unreadCount} Unread)
                                    </span>
                                  </div>

                                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                    <button
                                      type="button"
                                      onClick={() => setViewNoticeModalNotice(n)}
                                      className="avm-btn-secondary"
                                      style={{ padding: '4px 10px', fontSize: 12, display: 'inline-flex', alignItems: 'center', gap: 4 }}
                                    >
                                      <Eye size={13} /> View
                                    </button>

                                    <button
                                      type="button"
                                      onClick={() => openEditNoticeModal(n)}
                                      className="avm-btn-secondary"
                                      style={{ padding: '4px 10px', fontSize: 12, display: 'inline-flex', alignItems: 'center', gap: 4 }}
                                    >
                                      <Edit size={13} /> Edit
                                    </button>

                                    {n.status !== 'Archived' && (
                                      <button
                                        type="button"
                                        onClick={() => handleArchiveNotice(n.id)}
                                        className="avm-btn-secondary"
                                        style={{ padding: '4px 10px', fontSize: 12, color: '#D97706' }}
                                      >
                                        Archive
                                      </button>
                                    )}

                                    <button
                                      type="button"
                                      onClick={() => setDeleteNoticeConfirmId(n.id)}
                                      style={{
                                        background: 'none',
                                        border: 'none',
                                        color: '#EF4444',
                                        cursor: 'pointer',
                                        padding: '4px 8px',
                                        borderRadius: 4,
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        gap: 4
                                      }}
                                    >
                                      <Trash2 size={14} /> Delete
                                    </button>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </>
                  );
                })()}
              </div>
            </div>
          )}

          {activeTab === 'notifications' && (() => {
            const allNotifications = notificationService.getAllNotifications();

            // Filters logic
            const filteredNotifications = allNotifications.filter((n) => {
              // Search filter
              if (notificationSearch.trim()) {
                const q = notificationSearch.toLowerCase();
                const matchTitle = n.title.toLowerCase().includes(q);
                const matchMsg = n.message.toLowerCase().includes(q);
                const matchSender = (n.senderName || '').toLowerCase().includes(q);
                if (!matchTitle && !matchMsg && !matchSender) return false;
              }

              // Type filter
              if (notificationTypeFilter !== 'All' && n.type !== notificationTypeFilter) {
                return false;
              }

              // Audience filter
              if (notificationAudienceFilter !== 'All') {
                if (notificationAudienceFilter === 'Students' && n.audienceType === 'employees') return false;
                if (notificationAudienceFilter === 'Employees' && n.audienceType === 'students') return false;
                if (notificationAudienceFilter === 'Both' && n.audienceType !== 'both') return false;
              }

              // Status filter
              if (notificationStatusFilter !== 'All' && (n.status || 'Sent') !== notificationStatusFilter) {
                return false;
              }

              // Date filter
              if (notificationDateFilter !== 'All') {
                const todayStr = new Date().toISOString().split('T')[0];
                const sentDate = (n.sentAt || n.createdAt || '').slice(0, 10);
                if (notificationDateFilter === 'Today' && sentDate !== todayStr) return false;
              }

              return true;
            });

            // Statistics Counts
            const totalNotifsCount = allNotifications.length;
            const todayStr = new Date().toISOString().split('T')[0];
            const sentTodayCount = allNotifications.filter(n => (n.sentAt || n.createdAt || '').slice(0, 10) === todayStr).length;
            const totalUnreadCount = allNotifications.reduce((sum, n) => sum + (n.unreadCount || 0), 0);
            const scheduledCount = allNotifications.filter(n => n.status === 'Scheduled').length;

            // Pagination logic
            const totalPages = Math.ceil(filteredNotifications.length / notifItemsPerPage) || 1;
            const currentPageSafe = Math.min(notifCurrentPage, totalPages);
            const startIndex = (currentPageSafe - 1) * notifItemsPerPage;
            const paginatedNotifs = filteredNotifications.slice(startIndex, startIndex + notifItemsPerPage);

            const toggleSelectAll = () => {
              if (selectedNotifIds.length === paginatedNotifs.length) {
                setSelectedNotifIds([]);
              } else {
                setSelectedNotifIds(paginatedNotifs.map(n => n.id));
              }
            };

            const toggleSelectNotif = (id: string) => {
              if (selectedNotifIds.includes(id)) {
                setSelectedNotifIds(selectedNotifIds.filter(i => i !== id));
              } else {
                setSelectedNotifIds([...selectedNotifIds, id]);
              }
            };

            const handleBulkDelete = () => {
              if (selectedNotifIds.length === 0) return;
              if (window.confirm(`Are you sure you want to delete ${selectedNotifIds.length} notification(s)?`)) {
                notificationService.bulkDeleteNotifications(selectedNotifIds);
                setSelectedNotifIds([]);
              }
            };

            const handleBulkMarkRead = () => {
              if (selectedNotifIds.length === 0) return;
              notificationService.bulkMarkAsRead(selectedNotifIds);
              setSelectedNotifIds([]);
            };

            const getTypeBadgeStyle = (type: NotificationType) => {
              switch (type) {
                case 'General': return { bg: '#F1F5F9', color: '#475569' };
                case 'Academic': return { bg: '#E0F2FE', color: '#0369A1' };
                case 'Homework': return { bg: '#FEF3C7', color: '#B45309' };
                case 'Attendance': return { bg: '#FEE2E2', color: '#B91C1C' };
                case 'Fee': return { bg: '#DCFCE7', color: '#15803D' };
                case 'Exam': return { bg: '#F3E8FF', color: '#7C3AED' };
                case 'Result': return { bg: '#FCE7F3', color: '#BE185D' };
                case 'Notice': return { bg: '#E0E7FF', color: '#4338CA' };
                case 'Timetable': return { bg: '#E0F2FE', color: '#0284C7' };
                case 'Transport': return { bg: '#ECFDF5', color: '#047857' };
                case 'Event': return { bg: '#FFF7ED', color: '#C2410C' };
                case 'Emergency': return { bg: '#FEE2E2', color: '#DC2626' };
                default: return { bg: '#F1F5F9', color: '#475569' };
              }
            };

            return (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                {/* 1. PAGE HEADER */}
                <div className="avm-card" style={{ padding: '20px 24px', borderTop: '4px solid #1769E0' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
                    <div>
                      <h2 style={{ fontSize: 22, fontWeight: 900, color: '#0F172A', margin: 0, display: 'flex', alignItems: 'center', gap: 10 }}>
                        <Bell size={26} color="#1769E0" /> Notifications Center
                      </h2>
                      <p style={{ fontSize: 13, color: '#64748B', margin: '4px 0 0 0', fontWeight: 600 }}>
                        Manage, send and track notifications for students, employees and school users.
                      </p>
                    </div>

                    <div style={{ display: 'flex', gap: 10 }}>
                      <button
                        onClick={() => setTemplatesModalOpen(true)}
                        className="avm-btn-secondary"
                        style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 16px', fontSize: 13, fontWeight: 700 }}
                      >
                        <FileText size={16} /> Notification Templates
                      </button>

                      <button
                        onClick={() => { resetSendNotifForm(); setSendNotifModalOpen(true); }}
                        className="avm-btn-primary"
                        style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 18px', fontSize: 13, fontWeight: 800, backgroundColor: '#1769E0' }}
                      >
                        <Plus size={16} /> Send Notification
                      </button>
                    </div>
                  </div>
                </div>

                {/* 2. TOP STATISTICS CARDS */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
                  <div className="avm-card" style={{ padding: '16px 20px', borderLeft: '4px solid #1769E0' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <div style={{ fontSize: 11, fontWeight: 800, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Total Notifications</div>
                        <div style={{ fontSize: 26, fontWeight: 900, color: '#0F172A', marginTop: 4 }}>{totalNotifsCount}</div>
                      </div>
                      <div style={{ width: 44, height: 44, borderRadius: 12, backgroundColor: '#EFF6FF', color: '#1769E0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Bell size={22} />
                      </div>
                    </div>
                  </div>

                  <div className="avm-card" style={{ padding: '16px 20px', borderLeft: '4px solid #16A34A' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <div style={{ fontSize: 11, fontWeight: 800, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Sent Today</div>
                        <div style={{ fontSize: 26, fontWeight: 900, color: '#16A34A', marginTop: 4 }}>{sentTodayCount}</div>
                      </div>
                      <div style={{ width: 44, height: 44, borderRadius: 12, backgroundColor: '#DCFCE7', color: '#16A34A', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Send size={22} />
                      </div>
                    </div>
                  </div>

                  <div className="avm-card" style={{ padding: '16px 20px', borderLeft: '4px solid #EA580C' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <div style={{ fontSize: 11, fontWeight: 800, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Total Unread</div>
                        <div style={{ fontSize: 26, fontWeight: 900, color: '#EA580C', marginTop: 4 }}>{totalUnreadCount}</div>
                      </div>
                      <div style={{ width: 44, height: 44, borderRadius: 12, backgroundColor: '#FFF7ED', color: '#EA580C', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Inbox size={22} />
                      </div>
                    </div>
                  </div>

                  <div className="avm-card" style={{ padding: '16px 20px', borderLeft: '4px solid #7C3AED' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <div style={{ fontSize: 11, fontWeight: 800, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Scheduled</div>
                        <div style={{ fontSize: 26, fontWeight: 900, color: '#7C3AED', marginTop: 4 }}>{scheduledCount}</div>
                      </div>
                      <div style={{ width: 44, height: 44, borderRadius: 12, backgroundColor: '#F3E8FF', color: '#7C3AED', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Clock size={22} />
                      </div>
                    </div>
                  </div>
                </div>

                {/* 3. QUICK ACTIONS ROW */}
                <div className="avm-card" style={{ padding: '14px 20px', backgroundColor: '#F8FAFC', border: '1px solid #E2E8F0' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
                    <div style={{ fontSize: 12, fontWeight: 800, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Quick Actions:</div>
                    <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                      <button
                        onClick={() => { resetSendNotifForm(); setSendNotifModalOpen(true); }}
                        style={{ backgroundColor: '#1769E0', color: '#FFF', border: 'none', borderRadius: 8, padding: '8px 14px', fontSize: 12, fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}
                      >
                        <Plus size={14} /> + Send Notification
                      </button>

                      <button
                        onClick={() => setCreateTemplateModalOpen(true)}
                        style={{ backgroundColor: '#0D9488', color: '#FFF', border: 'none', borderRadius: 8, padding: '8px 14px', fontSize: 12, fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}
                      >
                        <FileText size={14} /> Create Template
                      </button>

                      <button
                        onClick={() => {
                          setNotificationSearch('');
                          setNotificationTypeFilter('All');
                          setNotificationAudienceFilter('All');
                          setNotificationStatusFilter('All');
                          setNotificationDateFilter('All');
                        }}
                        style={{ backgroundColor: '#F1F5F9', color: '#334155', border: '1px solid #CBD5E1', borderRadius: 8, padding: '8px 14px', fontSize: 12, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}
                      >
                        <RotateCcw size={14} /> View Notification History
                      </button>

                      <button
                        onClick={() => setSettingsModalOpen(true)}
                        style={{ backgroundColor: '#F1F5F9', color: '#334155', border: '1px solid #CBD5E1', borderRadius: 8, padding: '8px 14px', fontSize: 12, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}
                      >
                        <Settings size={14} /> Notification Settings
                      </button>
                    </div>
                  </div>
                </div>

                {/* 4. FILTERS BAR */}
                <div className="avm-card" style={{ padding: 16 }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr auto', gap: 10, alignItems: 'center' }}>
                    <div style={{ position: 'relative' }}>
                      <Search size={16} style={{ position: 'absolute', left: 10, top: 10, color: '#94A3B8' }} />
                      <input
                        type="text"
                        className="avm-input"
                        style={{ paddingLeft: 34, fontSize: 12 }}
                        placeholder="Search notifications by title, content or sender..."
                        value={notificationSearch}
                        onChange={(e) => setNotificationSearch(e.target.value)}
                      />
                    </div>

                    <div>
                      <select
                        className="avm-select"
                        style={{ fontSize: 12 }}
                        value={notificationTypeFilter}
                        onChange={(e) => setNotificationTypeFilter(e.target.value)}
                      >
                        <option value="All">All Notification Types</option>
                        <option value="General">General</option>
                        <option value="Academic">Academic</option>
                        <option value="Homework">Homework</option>
                        <option value="Attendance">Attendance</option>
                        <option value="Fee">Fee</option>
                        <option value="Exam">Exam</option>
                        <option value="Result">Result</option>
                        <option value="Notice">Notice</option>
                        <option value="Timetable">Timetable</option>
                        <option value="Transport">Transport</option>
                        <option value="Event">Event</option>
                        <option value="Emergency">Emergency</option>
                      </select>
                    </div>

                    <div>
                      <select
                        className="avm-select"
                        style={{ fontSize: 12 }}
                        value={notificationAudienceFilter}
                        onChange={(e) => setNotificationAudienceFilter(e.target.value)}
                      >
                        <option value="All">All Audiences</option>
                        <option value="Students">Students Only</option>
                        <option value="Employees">Employees Only</option>
                        <option value="Both">Both Students & Staff</option>
                      </select>
                    </div>

                    <div>
                      <select
                        className="avm-select"
                        style={{ fontSize: 12 }}
                        value={notificationStatusFilter}
                        onChange={(e) => setNotificationStatusFilter(e.target.value)}
                      >
                        <option value="All">All Statuses</option>
                        <option value="Sent">Sent</option>
                        <option value="Scheduled">Scheduled</option>
                        <option value="Draft">Draft</option>
                        <option value="Failed">Failed</option>
                      </select>
                    </div>

                    <div>
                      <select
                        className="avm-select"
                        style={{ fontSize: 12 }}
                        value={notificationDateFilter}
                        onChange={(e) => setNotificationDateFilter(e.target.value)}
                      >
                        <option value="All">All Dates</option>
                        <option value="Today">Today</option>
                        <option value="This Week">This Week</option>
                        <option value="This Month">This Month</option>
                      </select>
                    </div>

                    <div style={{ display: 'flex', gap: 6 }}>
                      <button
                        onClick={() => setNotifCurrentPage(1)}
                        style={{ backgroundColor: '#1769E0', color: '#FFF', border: 'none', borderRadius: 8, padding: '8px 12px', fontSize: 12, fontWeight: 800, cursor: 'pointer' }}
                      >
                        Apply Filter
                      </button>
                      <button
                        onClick={() => {
                          setNotificationSearch('');
                          setNotificationTypeFilter('All');
                          setNotificationAudienceFilter('All');
                          setNotificationStatusFilter('All');
                          setNotificationDateFilter('All');
                        }}
                        style={{ backgroundColor: '#F1F5F9', color: '#64748B', border: '1px solid #CBD5E1', borderRadius: 8, padding: '8px 10px', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}
                        title="Clear Filters"
                      >
                        Clear
                      </button>
                    </div>
                  </div>
                </div>

                {/* 5. NOTIFICATION HISTORY TABLE & BULK ACTIONS */}
                <div className="avm-card" style={{ padding: 20 }}>
                  {/* Bulk Action Controls */}
                  {selectedNotifIds.length > 0 && (
                    <div style={{ backgroundColor: '#EFF6FF', border: '1px solid #BFDBFE', borderRadius: 10, padding: '10px 14px', marginBottom: 14, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ fontSize: 12, fontWeight: 800, color: '#1E40AF' }}>
                        ✓ {selectedNotifIds.length} notification(s) selected
                      </div>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <button
                          onClick={handleBulkMarkRead}
                          style={{ backgroundColor: '#16A34A', color: '#FFF', border: 'none', borderRadius: 6, padding: '5px 12px', fontSize: 11, fontWeight: 800, cursor: 'pointer' }}
                        >
                          Mark as Read
                        </button>
                        <button
                          onClick={handleBulkDelete}
                          style={{ backgroundColor: '#EF4444', color: '#FFF', border: 'none', borderRadius: 6, padding: '5px 12px', fontSize: 11, fontWeight: 800, cursor: 'pointer' }}
                        >
                          Delete Selected
                        </button>
                      </div>
                    </div>
                  )}

                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                      <thead>
                        <tr style={{ backgroundColor: '#F8FAFC', borderBottom: '2px solid #E2E8F0', color: '#64748B', textAlign: 'left' }}>
                          <th style={{ padding: 10, width: 30 }}>
                            <input
                              type="checkbox"
                              checked={paginatedNotifs.length > 0 && selectedNotifIds.length === paginatedNotifs.length}
                              onChange={toggleSelectAll}
                            />
                          </th>
                          <th style={{ padding: 12 }}>Notification Title & Content</th>
                          <th style={{ padding: 12 }}>Type</th>
                          <th style={{ padding: 12 }}>Target Audience</th>
                          <th style={{ padding: 12 }}>Sent By</th>
                          <th style={{ padding: 12 }}>Date & Time</th>
                          <th style={{ padding: 12 }}>Status</th>
                          <th style={{ padding: 12 }}>Recipients</th>
                          <th style={{ padding: 12 }}>Read Count</th>
                          <th style={{ padding: 12, textAlign: 'right' }}>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {paginatedNotifs.length === 0 ? (
                          <tr>
                            <td colSpan={10} style={{ textAlign: 'center', padding: 30, color: '#94A3B8', fontSize: 13 }}>
                              No notifications found matching your search filters.
                            </td>
                          </tr>
                        ) : (
                          paginatedNotifs.map((n) => {
                            const tStyle = getTypeBadgeStyle(n.type);
                            const isSelected = selectedNotifIds.includes(n.id);
                            const isUnread = (n.unreadCount || 0) > 0;

                            return (
                              <tr key={n.id} style={{ borderBottom: '1px solid #F1F5F9', backgroundColor: isSelected ? '#EFF6FF' : 'transparent' }}>
                                <td style={{ padding: 10 }}>
                                  <input
                                    type="checkbox"
                                    checked={isSelected}
                                    onChange={() => toggleSelectNotif(n.id)}
                                  />
                                </td>
                                <td style={{ padding: 12, maxWidth: 300 }}>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                    {isUnread && <span style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: '#1769E0', flexShrink: 0 }} title="Unread" />}
                                    <span
                                      onClick={() => setViewNotifDetails(n)}
                                      style={{ fontWeight: 800, color: '#0F172A', cursor: 'pointer', fontSize: 13, textDecoration: 'none' }}
                                    >
                                      {n.title}
                                    </span>
                                    {n.priority && (
                                      <span style={{
                                        fontSize: 9, fontWeight: 800, padding: '1px 6px', borderRadius: 6,
                                        backgroundColor: n.priority === 'Urgent' ? '#FEE2E2' : n.priority === 'High' ? '#FFF7ED' : '#F1F5F9',
                                        color: n.priority === 'Urgent' ? '#B91C1C' : n.priority === 'High' ? '#C2410C' : '#64748B'
                                      }}>
                                        {n.priority}
                                      </span>
                                    )}
                                  </div>
                                  <div style={{ fontSize: 11, color: '#64748B', marginTop: 2, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                                    {n.message}
                                  </div>
                                </td>
                                <td style={{ padding: 12 }}>
                                  <span style={{ backgroundColor: tStyle.bg, color: tStyle.color, padding: '3px 8px', borderRadius: 8, fontSize: 11, fontWeight: 800 }}>
                                    {n.type}
                                  </span>
                                </td>
                                <td style={{ padding: 12 }}>
                                  <span style={{ backgroundColor: '#F1F5F9', color: '#334155', padding: '3px 8px', borderRadius: 8, fontSize: 11, fontWeight: 700 }}>
                                    👥 {n.targetAudience || (n.audienceType === 'students' ? 'Students' : n.audienceType === 'employees' ? 'Staff' : 'Both')}
                                    {n.targetClass ? ` (${n.targetClass})` : ''}
                                  </span>
                                </td>
                                <td style={{ padding: 12, color: '#475569', fontWeight: 600 }}>{n.senderName || 'Admin'}</td>
                                <td style={{ padding: 12, color: '#64748B', fontSize: 11 }}>{n.sentAt || n.createdAt}</td>
                                <td style={{ padding: 12 }}>
                                  <span style={{
                                    backgroundColor: (n.status || 'Sent') === 'Sent' ? '#DCFCE7' : n.status === 'Scheduled' ? '#F3E8FF' : '#FEE2E2',
                                    color: (n.status || 'Sent') === 'Sent' ? '#15803D' : n.status === 'Scheduled' ? '#7C3AED' : '#B91C1C',
                                    padding: '2px 8px', borderRadius: 10, fontSize: 11, fontWeight: 800
                                  }}>
                                    {(n.status || 'Sent')}
                                  </span>
                                </td>
                                <td style={{ padding: 12, fontWeight: 800, color: '#0F172A' }}>{n.recipientCount || 50}</td>
                                <td style={{ padding: 12 }}>
                                  <span style={{ backgroundColor: '#E0F2FE', color: '#0369A1', padding: '2px 8px', borderRadius: 8, fontSize: 11, fontWeight: 800 }}>
                                    {n.readCount ?? Math.round((n.recipientCount || 50) * 0.7)} Read
                                  </span>
                                </td>
                                <td style={{ padding: 12, textAlign: 'right', whiteSpace: 'nowrap' }}>
                                  <button
                                    onClick={() => setViewNotifDetails(n)}
                                    title="View Details"
                                    style={{ backgroundColor: '#F1F5F9', color: '#475569', border: 'none', borderRadius: 6, padding: '5px 8px', fontSize: 11, fontWeight: 800, cursor: 'pointer', marginRight: 4 }}
                                  >
                                    <Eye size={14} />
                                  </button>
                                  <button
                                    onClick={() => {
                                      if (window.confirm('Delete this notification?')) {
                                        notificationService.deleteNotification(n.id);
                                      }
                                    }}
                                    title="Delete Notification"
                                    style={{ backgroundColor: '#FEE2E2', color: '#EF4444', border: 'none', borderRadius: 6, padding: '5px 8px', cursor: 'pointer' }}
                                  >
                                    <Trash2 size={14} />
                                  </button>
                                </td>
                              </tr>
                            );
                          })
                        )}
                      </tbody>
                    </table>
                  </div>

                  {/* 6. PAGINATION FOOTER */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 16, paddingTop: 12, borderTop: '1px solid #F1F5F9', flexWrap: 'wrap', gap: 12 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 12, color: '#64748B' }}>
                      <span>Items per page:</span>
                      <select
                        className="avm-select"
                        style={{ width: 70, padding: '4px 8px', fontSize: 12 }}
                        value={notifItemsPerPage}
                        onChange={(e) => { setNotifItemsPerPage(Number(e.target.value)); setNotifCurrentPage(1); }}
                      >
                        <option value={10}>10</option>
                        <option value={25}>25</option>
                        <option value={50}>50</option>
                        <option value={100}>100</option>
                      </select>
                      <span>Showing {startIndex + 1}–{Math.min(startIndex + notifItemsPerPage, filteredNotifications.length)} of {filteredNotifications.length} notifications</span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <button
                        disabled={currentPageSafe === 1}
                        onClick={() => setNotifCurrentPage(currentPageSafe - 1)}
                        style={{
                          backgroundColor: currentPageSafe === 1 ? '#F1F5F9' : '#FFFFFF',
                          color: currentPageSafe === 1 ? '#94A3B8' : '#0F172A',
                          border: '1px solid #CBD5E1', borderRadius: 6, padding: '5px 12px', fontSize: 12, fontWeight: 700, cursor: currentPageSafe === 1 ? 'not-allowed' : 'pointer'
                        }}
                      >
                        ← Previous
                      </button>

                      <span style={{ fontSize: 12, fontWeight: 800, color: '#0F172A', padding: '0 8px' }}>
                        Page {currentPageSafe} of {totalPages}
                      </span>

                      <button
                        disabled={currentPageSafe >= totalPages}
                        onClick={() => setNotifCurrentPage(currentPageSafe + 1)}
                        style={{
                          backgroundColor: currentPageSafe >= totalPages ? '#F1F5F9' : '#FFFFFF',
                          color: currentPageSafe >= totalPages ? '#94A3B8' : '#0F172A',
                          border: '1px solid #CBD5E1', borderRadius: 6, padding: '5px 12px', fontSize: 12, fontWeight: 700, cursor: currentPageSafe >= totalPages ? 'not-allowed' : 'pointer'
                        }}
                      >
                        Next →
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })()}

          {activeTab === 'timetable' && (
            <TimetableModule students={students} employees={employees} />
          )}

          {activeTab === 'reports' && (
            <CentralReportsModule
              onNavigateTab={(tabId) => setActiveTab(tabId)}
              students={students}
              employees={employees}
              academicYear={academicYear}
            />
          )}

          {activeTab === 'settings' && (
            <AdminSettingsModule
              onNavigateTab={(tabId) => setActiveTab(tabId as any)}
              onSessionChanged={(sid) => {
                setSelectedSessionId(sid);
                setActiveSessionId(sid);
                setAcademicYear(sid);
                refreshAll(sid);
              }}
            />
          )}
        </main>
      </div>

      {/* ========================================================================= */}
      {/* MODAL 1: ADD / EDIT STUDENT MODAL (COMPLETE SECTIONED FORM) */}
      {/* ========================================================================= */}
      {addStudentModalOpen && (
        <Modal
          isOpen={addStudentModalOpen}
          onClose={() => { setAddStudentModalOpen(false); setEditStudent(null); }}
          title={editStudent ? 'Edit Student Details' : 'Register New Student'}
        >
          <form onSubmit={handleSaveStudent} style={{ display: 'flex', flexDirection: 'column', gap: 14, maxHeight: '75vh', overflowY: 'auto' }}>
            {/* Validation Error Alert */}
            {stuValidationError && (
              <div style={{ backgroundColor: '#FEF2F2', color: '#DC2626', padding: '10px 14px', borderRadius: 10, fontSize: 13, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8 }}>
                <AlertCircle size={16} />
                <span>{stuValidationError}</span>
              </div>
            )}

            {/* Modal Section Tabs */}
            <div style={{ display: 'flex', gap: 4, backgroundColor: '#F1F5F9', padding: 4, borderRadius: 10, overflowX: 'auto' }}>
              {[
                { id: 'personal', label: '1. Personal' },
                { id: 'academic', label: '2. Academic' },
                { id: 'parent', label: '3. Parents' },
                { id: 'address', label: '4. Address' },
                { id: 'account', label: '5. Account' },
                { id: 'transport', label: '6. Transport' },
                { id: 'fees', label: '7. Fees' }
              ].map((tb) => (
                <button
                  key={tb.id}
                  type="button"
                  onClick={() => setStuFormTab(tb.id as any)}
                  style={{
                    flex: 1,
                    padding: '6px 10px',
                    borderRadius: 8,
                    border: 'none',
                    backgroundColor: stuFormTab === tb.id ? '#FFFFFF' : 'transparent',
                    color: stuFormTab === tb.id ? '#1769E0' : '#64748B',
                    fontWeight: stuFormTab === tb.id ? 800 : 600,
                    fontSize: 12,
                    cursor: 'pointer',
                    boxShadow: stuFormTab === tb.id ? '0 2px 4px rgba(0,0,0,0.05)' : 'none',
                    whiteSpace: 'nowrap'
                  }}
                >
                  {tb.label}
                </button>
              ))}
            </div>

            {/* TAB 1: PERSONAL DETAILS */}
            {stuFormTab === 'personal' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 800, color: '#475569', display: 'block', marginBottom: 4 }}>
                    Student Full Name *
                  </label>
                  <input type="text" className="avm-input" value={stuName} onChange={(e) => setStuName(e.target.value)} placeholder="e.g. Amit Kumar" required />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  <div>
                    <label style={{ fontSize: 12, fontWeight: 700, color: '#475569', display: 'block', marginBottom: 4 }}>Date of Birth</label>
                    <input type="date" className="avm-input" value={stuDob} onChange={(e) => setStuDob(e.target.value)} />
                  </div>
                  <div>
                    <label style={{ fontSize: 12, fontWeight: 700, color: '#475569', display: 'block', marginBottom: 4 }}>Gender</label>
                    <select className="avm-input" value={stuGender} onChange={(e) => setStuGender(e.target.value)}>
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  <div>
                    <label style={{ fontSize: 12, fontWeight: 700, color: '#475569', display: 'block', marginBottom: 4 }}>Blood Group</label>
                    <select className="avm-input" value={stuBloodGroup} onChange={(e) => setStuBloodGroup(e.target.value)}>
                      {['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'].map((bg) => (
                        <option key={bg} value={bg}>{bg}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label style={{ fontSize: 12, fontWeight: 700, color: '#475569', display: 'block', marginBottom: 4 }}>Category</label>
                    <select className="avm-input" value={stuCategory} onChange={(e) => setStuCategory(e.target.value)}>
                      <option value="General">General</option>
                      <option value="OBC">OBC</option>
                      <option value="SC">SC</option>
                      <option value="ST">ST</option>
                    </select>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  <div>
                    <label style={{ fontSize: 12, fontWeight: 700, color: '#475569', display: 'block', marginBottom: 4 }}>Aadhaar No (Optional)</label>
                    <input type="text" className="avm-input" value={stuAadhaar} onChange={(e) => setStuAadhaar(e.target.value)} placeholder="12-digit Aadhaar" />
                  </div>
                  <div>
                    <label style={{ fontSize: 12, fontWeight: 700, color: '#475569', display: 'block', marginBottom: 4 }}>Nationality</label>
                    <input type="text" className="avm-input" value={stuNationality} onChange={(e) => setStuNationality(e.target.value)} placeholder="Indian" />
                  </div>
                </div>

                {/* PROFILE PHOTO MANAGEMENT */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, backgroundColor: '#F8FAFC', padding: 14, borderRadius: 12, border: '1px solid #E2E8F0' }}>
                  <label style={{ fontSize: 12, fontWeight: 800, color: '#475569' }}>PROFILE PHOTO</label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                    <div style={{
                      width: 72,
                      height: 72,
                      borderRadius: '50%',
                      backgroundColor: '#E2E8F0',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      overflow: 'hidden',
                      border: '2px solid #CBD5E1',
                      boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
                      flexShrink: 0
                    }}>
                      {stuPhoto ? (
                        <img src={stuPhoto} alt="Student Profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', color: '#94A3B8' }}>
                          <User size={28} />
                          <span style={{ fontSize: 9, fontWeight: 700, marginTop: 2 }}>No Photo</span>
                        </div>
                      )}
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, flex: 1 }}>
                      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                        <label style={{
                          backgroundColor: '#1769E0',
                          color: '#FFFFFF',
                          padding: '6px 14px',
                          borderRadius: 8,
                          fontSize: 12,
                          fontWeight: 700,
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 6,
                          boxShadow: '0 2px 4px rgba(23,105,224,0.2)'
                        }}>
                          <Sparkles size={14} />
                          {stuPhoto ? 'Change Photo' : 'Add Photo'}
                          <input
                            type="file"
                            accept="image/jpeg,image/jpg,image/png,image/webp"
                            style={{ display: 'none' }}
                            onChange={async (e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                try {
                                  const dataUrl = await processProfileImageFile(file);
                                  setStuPhoto(dataUrl);
                                } catch (err: any) {
                                  alert(err.message || 'Error processing image.');
                                }
                              }
                            }}
                          />
                        </label>

                        {stuPhoto && (
                          <button
                            type="button"
                            onClick={() => {
                              if (window.confirm('Remove this profile photo?')) {
                                setStuPhoto('');
                              }
                            }}
                            style={{
                              backgroundColor: '#FEF2F2',
                              color: '#DC2626',
                              border: '1px solid #FCA5A5',
                              padding: '6px 12px',
                              borderRadius: 8,
                              fontSize: 12,
                              fontWeight: 700,
                              cursor: 'pointer'
                            }}
                          >
                            Remove Photo
                          </button>
                        )}
                      </div>
                      <span style={{ fontSize: 11, color: '#64748B' }}>Supported formats: JPG, PNG, WEBP.</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: ACADEMIC DETAILS */}
            {stuFormTab === 'academic' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
                  <div>
                    <label style={{ fontSize: 12, fontWeight: 800, color: '#475569', display: 'block', marginBottom: 4 }}>Class *</label>
                    <select className="avm-input" value={stuClass} onChange={(e) => setStuClass(e.target.value)}>
                      {['Nursery', 'LKG', 'UKG', 'Class 1', 'Class 2', 'Class 3', 'Class 4', 'Class 5', 'Class 6', 'Class 7', 'Class 8'].map((c) => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label style={{ fontSize: 12, fontWeight: 800, color: '#475569', display: 'block', marginBottom: 4 }}>Section *</label>
                    <select className="avm-input" value={stuSec} onChange={(e) => setStuSec(e.target.value)}>
                      <option value="A">A</option>
                      <option value="B">B</option>
                      <option value="C">C</option>
                    </select>
                  </div>

                  <div>
                    <label style={{ fontSize: 12, fontWeight: 800, color: '#475569', display: 'block', marginBottom: 4 }}>Roll No *</label>
                    <input type="number" className="avm-input" value={stuRoll} onChange={(e) => setStuRoll(e.target.value)} required />
                  </div>
                </div>

                <div>
                  <label style={{ fontSize: 12, fontWeight: 700, color: '#475569', display: 'block', marginBottom: 4 }}>
                    Admission Number (Leave blank to auto-generate)
                  </label>
                  <input type="text" className="avm-input" value={stuAdmissionNo} onChange={(e) => setStuAdmissionNo(e.target.value)} placeholder="e.g. AVM2026001" />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  <div>
                    <label style={{ fontSize: 12, fontWeight: 700, color: '#475569', display: 'block', marginBottom: 4 }}>Admission Date</label>
                    <input type="date" className="avm-input" value={stuAdmissionDate} onChange={(e) => setStuAdmissionDate(e.target.value)} />
                  </div>
                  <div>
                    <label style={{ fontSize: 12, fontWeight: 700, color: '#475569', display: 'block', marginBottom: 4 }}>Student Status</label>
                    <select className="avm-input" value={stuStatus} onChange={(e) => setStuStatus(e.target.value as any)}>
                      <option value="Active">Active</option>
                      <option value="Inactive">Inactive</option>
                      <option value="Left">Left</option>
                      <option value="Transferred">Transferred</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label style={{ fontSize: 12, fontWeight: 700, color: '#475569', display: 'block', marginBottom: 4 }}>Previous School (If applicable)</label>
                  <input type="text" className="avm-input" value={stuPrevSchool} onChange={(e) => setStuPrevSchool(e.target.value)} placeholder="Previous School Name" />
                </div>
              </div>
            )}

            {/* TAB 3: PARENT DETAILS */}
            {stuFormTab === 'parent' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  <div>
                    <label style={{ fontSize: 12, fontWeight: 800, color: '#475569', display: 'block', marginBottom: 4 }}>Father's Name *</label>
                    <input type="text" className="avm-input" value={stuFather} onChange={(e) => setStuFather(e.target.value)} placeholder="Father Full Name" required />
                  </div>
                  <div>
                    <label style={{ fontSize: 12, fontWeight: 700, color: '#475569', display: 'block', marginBottom: 4 }}>Mother's Name</label>
                    <input type="text" className="avm-input" value={stuMother} onChange={(e) => setStuMother(e.target.value)} placeholder="Mother Full Name" />
                  </div>
                </div>

                <div>
                  <label style={{ fontSize: 12, fontWeight: 700, color: '#475569', display: 'block', marginBottom: 4 }}>Guardian Name (If different from Father)</label>
                  <input type="text" className="avm-input" value={stuGuardian} onChange={(e) => setStuGuardian(e.target.value)} placeholder="Guardian Name" />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  <div>
                    <label style={{ fontSize: 12, fontWeight: 800, color: '#475569', display: 'block', marginBottom: 4 }}>Guardian Phone *</label>
                    <input type="text" className="avm-input" value={stuPhone} onChange={(e) => setStuPhone(e.target.value)} placeholder="+91 98765 43210" required />
                  </div>
                  <div>
                    <label style={{ fontSize: 12, fontWeight: 700, color: '#475569', display: 'block', marginBottom: 4 }}>Alternate Phone</label>
                    <input type="text" className="avm-input" value={stuAltPhone} onChange={(e) => setStuAltPhone(e.target.value)} placeholder="+91 98000 00000" />
                  </div>
                </div>

                <div>
                  <label style={{ fontSize: 12, fontWeight: 700, color: '#475569', display: 'block', marginBottom: 4 }}>Guardian Email</label>
                  <input type="email" className="avm-input" value={stuEmail} onChange={(e) => setStuEmail(e.target.value)} placeholder="guardian@example.com" />
                </div>
              </div>
            )}

            {/* TAB 4: ADDRESS DETAILS */}
            {stuFormTab === 'address' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 700, color: '#475569', display: 'block', marginBottom: 4 }}>Full Address Line</label>
                  <input type="text" className="avm-input" value={stuAddress} onChange={(e) => setStuAddress(e.target.value)} placeholder="Street / Village / Main Road" />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  <div>
                    <label style={{ fontSize: 12, fontWeight: 700, color: '#475569', display: 'block', marginBottom: 4 }}>City / Village</label>
                    <input type="text" className="avm-input" value={stuCity} onChange={(e) => setStuCity(e.target.value)} placeholder="Kajraili" />
                  </div>
                  <div>
                    <label style={{ fontSize: 12, fontWeight: 700, color: '#475569', display: 'block', marginBottom: 4 }}>District</label>
                    <input type="text" className="avm-input" value={stuDistrict} onChange={(e) => setStuDistrict(e.target.value)} placeholder="Bhagalpur" />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  <div>
                    <label style={{ fontSize: 12, fontWeight: 700, color: '#475569', display: 'block', marginBottom: 4 }}>State</label>
                    <input type="text" className="avm-input" value={stuState} onChange={(e) => setStuState(e.target.value)} placeholder="Bihar" />
                  </div>
                  <div>
                    <label style={{ fontSize: 12, fontWeight: 700, color: '#475569', display: 'block', marginBottom: 4 }}>PIN Code</label>
                    <input type="text" className="avm-input" value={stuPinCode} onChange={(e) => setStuPinCode(e.target.value)} placeholder="812005" />
                  </div>
                </div>
              </div>
            )}

            {/* TAB 5: ACCOUNT CREDENTIALS */}
            {stuFormTab === 'account' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12, backgroundColor: '#F8FAFC', padding: 14, borderRadius: 12, border: '1px solid #E2E8F0' }}>
                <div style={{ fontSize: 13, fontWeight: 800, color: '#0F172A' }}>Mobile App Credentials</div>
                <div style={{ fontSize: 11, color: '#64748B' }}>
                  The student can log into the Mobile Android App using their Admission Number / Username and password below.
                </div>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 700, color: '#475569', display: 'block', marginBottom: 4 }}>Default Password</label>
                  <input type="text" className="avm-input" value={stuPassword} onChange={(e) => setStuPassword(e.target.value)} />
                </div>
              </div>
            )}

            {/* TAB 6: BUS TRANSPORT */}
            {stuFormTab === 'transport' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 800, color: '#475569', display: 'block', marginBottom: 6 }}>
                    Transport Required *
                  </label>
                  <div style={{ display: 'flex', gap: 10 }}>
                    {['Yes', 'No'].map((opt) => (
                      <button
                        key={opt}
                        type="button"
                        onClick={() => {
                          setStuTransportReq(opt as any);
                          if (opt === 'No') {
                            setStuTransportFee(0);
                          } else if (stuTransportFee === 0) {
                            setStuTransportFee(500);
                          }
                        }}
                        style={{
                          flex: 1,
                          padding: '8px 16px',
                          borderRadius: 8,
                          border: stuTransportReq === opt ? '2px solid #1769E0' : '1px solid #CBD5E1',
                          backgroundColor: stuTransportReq === opt ? '#EFF6FF' : '#FFFFFF',
                          color: stuTransportReq === opt ? '#1769E0' : '#475569',
                          fontWeight: 800,
                          fontSize: 13,
                          cursor: 'pointer'
                        }}
                      >
                        {opt === 'Yes' ? '🚌 Yes (School Bus Transport)' : '🚶 No (Independent Commute)'}
                      </button>
                    ))}
                  </div>
                </div>

                {stuTransportReq === 'Yes' ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12, backgroundColor: '#F8FAFC', padding: 14, borderRadius: 12, border: '1px solid #E2E8F0' }}>
                    <div>
                      <label style={{ fontSize: 12, fontWeight: 800, color: '#475569', display: 'block', marginBottom: 4 }}>
                        Bus Number *
                      </label>
                      <select
                        className="avm-input"
                        value={stuTransportBusId}
                        onChange={(e) => {
                          const selectedBusId = e.target.value;
                          setStuTransportBusId(selectedBusId);
                          const b = transportService.getBuses().find(x => x.id === selectedBusId);
                          if (b) {
                            if (b.stops && b.stops.length > 0) {
                              setStuTransportStop(b.stops[0].name);
                              setStuTransportTime(b.stops[0].pickupTime);
                            }
                            if (b.feePerMonth) {
                              setStuTransportFee(b.feePerMonth);
                            }
                          }
                        }}
                      >
                        {transportService.getBuses().map((b) => (
                          <option key={b.id} value={b.id}>
                            {b.busNo || b.busNumber} — {b.vehicleNo || b.vehicleNumber} ({b.routeName || b.routeArea || 'School Route'})
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Selected Bus Details Preview */}
                    {(() => {
                      const selectedBus = transportService.getBuses().find(b => b.id === stuTransportBusId) || transportService.getBuses()[0];
                      if (!selectedBus) return null;
                      return (
                        <div style={{ backgroundColor: '#FFFFFF', padding: 12, borderRadius: 8, border: '1px solid #CBD5E1', fontSize: 12, display: 'flex', flexDirection: 'column', gap: 6 }}>
                          <div style={{ fontWeight: 800, color: '#0F172A', display: 'flex', justifyContent: 'space-between' }}>
                            <span>{selectedBus.busNo || selectedBus.busNumber} ({selectedBus.vehicleNo || selectedBus.vehicleNumber})</span>
                            <span style={{ color: '#1769E0' }}>{selectedBus.routeName || selectedBus.routeArea}</span>
                          </div>
                          <div style={{ color: '#64748B', fontSize: 11 }}>
                            Driver: <strong>{selectedBus.driverName} ({selectedBus.driverPhone || selectedBus.driverMobile})</strong> • Conductor: <strong>{selectedBus.conductorName}</strong>
                          </div>
                        </div>
                      );
                    })()}

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                      <div>
                        <label style={{ fontSize: 12, fontWeight: 700, color: '#475569', display: 'block', marginBottom: 4 }}>
                          Village / Area Name *
                        </label>
                        <input
                          type="text"
                          className="avm-input"
                          value={stuTransportVillage}
                          onChange={(e) => setStuTransportVillage(e.target.value)}
                          placeholder="e.g. Kajraili"
                        />
                      </div>

                      <div>
                        <label style={{ fontSize: 12, fontWeight: 700, color: '#475569', display: 'block', marginBottom: 4 }}>
                          Pickup Stop *
                        </label>
                        <select
                          className="avm-input"
                          value={stuTransportStop}
                          onChange={(e) => {
                            const stopName = e.target.value;
                            setStuTransportStop(stopName);
                            const b = transportService.getBuses().find(x => x.id === stuTransportBusId);
                            const foundStop = b?.stops?.find(s => s.name === stopName);
                            if (foundStop) setStuTransportTime(foundStop.pickupTime);
                          }}
                        >
                          {(() => {
                            const b = transportService.getBuses().find(x => x.id === stuTransportBusId);
                            const stops = b?.stops || [
                              { name: 'Kajraili Chowk', pickupTime: '07:15 AM' },
                              { name: 'Amarpur More', pickupTime: '07:30 AM' }
                            ];
                            return stops.map((s, idx) => (
                              <option key={idx} value={s.name}>
                                {s.name} ({s.pickupTime})
                              </option>
                            ));
                          })()}
                        </select>
                      </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                      <div>
                        <label style={{ fontSize: 12, fontWeight: 700, color: '#475569', display: 'block', marginBottom: 4 }}>
                          Pickup Time
                        </label>
                        <input
                          type="text"
                          className="avm-input"
                          value={stuTransportTime}
                          onChange={(e) => setStuTransportTime(e.target.value)}
                          placeholder="07:15 AM"
                        />
                      </div>

                      <div>
                        <label style={{ fontSize: 12, fontWeight: 700, color: '#475569', display: 'block', marginBottom: 4 }}>
                          Monthly Transport Fee (₹) *
                        </label>
                        <input
                          type="number"
                          className="avm-input"
                          value={stuTransportFee}
                          onChange={(e) => setStuTransportFee(Number(e.target.value) || 0)}
                          placeholder="500"
                        />
                      </div>
                    </div>
                  </div>
                ) : (
                  <div style={{ backgroundColor: '#F8FAFC', padding: 16, borderRadius: 12, border: '1px solid #E2E8F0', color: '#64748B', fontSize: 12, textAlign: 'center' }}>
                    No school bus transport required for this student. Transport fee will be set to ₹0.
                  </div>
                )}
              </div>
            )}

            {/* TAB 7: STUDENT FEE & INITIAL PAYMENT */}
            {stuFormTab === 'fees' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div style={{ fontSize: 13, fontWeight: 800, color: '#0F172A' }}>Monthly Fee Structure Setup</div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  <div>
                    <label style={{ fontSize: 12, fontWeight: 700, color: '#475569', display: 'block', marginBottom: 4 }}>
                      Monthly Tuition Fee (₹) *
                    </label>
                    <input
                      type="number"
                      className="avm-input"
                      value={stuTuitionFee}
                      onChange={(e) => setStuTuitionFee(Number(e.target.value) || 0)}
                      placeholder="1500"
                      required
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: 12, fontWeight: 700, color: '#475569', display: 'block', marginBottom: 4 }}>
                      Transport Fee (₹) {stuTransportReq === 'Yes' ? '(From Tab 6)' : '(Disabled)'}
                    </label>
                    <input
                      type="number"
                      className="avm-input"
                      value={stuTransportReq === 'Yes' ? stuTransportFee : 0}
                      onChange={(e) => {
                        if (stuTransportReq === 'Yes') setStuTransportFee(Number(e.target.value) || 0);
                      }}
                      disabled={stuTransportReq === 'No'}
                      style={{ backgroundColor: stuTransportReq === 'No' ? '#F1F5F9' : '#FFFFFF' }}
                    />
                  </div>
                </div>

                <div>
                  <label style={{ fontSize: 12, fontWeight: 700, color: '#475569', display: 'block', marginBottom: 4 }}>
                    Other Monthly Fee (₹)
                  </label>
                  <input
                    type="number"
                    className="avm-input"
                    value={stuOtherFee}
                    onChange={(e) => setStuOtherFee(Number(e.target.value) || 0)}
                    placeholder="0"
                  />
                </div>

                {/* TOTAL MONTHLY FEE BOX */}
                {(() => {
                  const transFeeVal = stuTransportReq === 'Yes' ? Number(stuTransportFee) || 0 : 0;
                  const totalMonthlyFee = (Number(stuTuitionFee) || 0) + transFeeVal + (Number(stuOtherFee) || 0);
                  const paidVal = Number(stuInitialPayment) || 0;
                  const pendingVal = Math.max(0, totalMonthlyFee - paidVal);
                  let statusBadge = { bg: '#FEF3C7', color: '#D97706', text: 'Partial' };
                  if (paidVal >= totalMonthlyFee && totalMonthlyFee > 0) {
                    statusBadge = { bg: '#DCFCE7', color: '#15803D', text: 'Paid' };
                  } else if (paidVal <= 0) {
                    statusBadge = { bg: '#FEE2E2', color: '#B91C1C', text: 'Pending' };
                  }

                  return (
                    <>
                      <div style={{ backgroundColor: '#1769E0', color: '#FFFFFF', padding: 14, borderRadius: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                          <span style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.5, opacity: 0.85, fontWeight: 700, display: 'block' }}>
                            Total Monthly Fee
                          </span>
                          <span style={{ fontSize: 20, fontWeight: 900 }}>₹{totalMonthlyFee.toLocaleString('en-IN')}</span>
                        </div>
                        <div style={{ fontSize: 11, textAlign: 'right', opacity: 0.9 }}>
                          Tuition ₹{stuTuitionFee} + Trans ₹{transFeeVal} + Other ₹{stuOtherFee}
                        </div>
                      </div>

                      <div style={{ fontSize: 13, fontWeight: 800, color: '#0F172A', marginTop: 4 }}>Initial Admission Payment</div>

                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                        <div>
                          <label style={{ fontSize: 12, fontWeight: 700, color: '#475569', display: 'block', marginBottom: 4 }}>
                            Initial Payment Amount (₹)
                          </label>
                          <input
                            type="number"
                            className="avm-input"
                            value={stuInitialPayment}
                            onChange={(e) => setStuInitialPayment(Number(e.target.value) || 0)}
                            placeholder="1000"
                          />
                        </div>

                        <div>
                          <label style={{ fontSize: 12, fontWeight: 700, color: '#475569', display: 'block', marginBottom: 4 }}>
                            Computed Payment Status
                          </label>
                          <div style={{
                            height: 38,
                            borderRadius: 8,
                            backgroundColor: statusBadge.bg,
                            color: statusBadge.color,
                            fontWeight: 800,
                            fontSize: 13,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}>
                            {statusBadge.text} (Paid ₹{paidVal} / Pending ₹{pendingVal})
                          </div>
                        </div>
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                        <div>
                          <label style={{ fontSize: 12, fontWeight: 700, color: '#475569', display: 'block', marginBottom: 4 }}>
                            Payment Method
                          </label>
                          <select
                            className="avm-input"
                            value={stuPaymentMethod}
                            onChange={(e) => setStuPaymentMethod(e.target.value as any)}
                          >
                            <option value="Cash">Cash</option>
                            <option value="UPI">UPI / QR</option>
                            <option value="Bank Transfer">Bank Transfer</option>
                            <option value="Cheque">Cheque</option>
                            <option value="Other">Other</option>
                          </select>
                        </div>

                        <div>
                          <label style={{ fontSize: 12, fontWeight: 700, color: '#475569', display: 'block', marginBottom: 4 }}>
                            Payment Date
                          </label>
                          <input
                            type="date"
                            className="avm-input"
                            value={stuPaymentDate}
                            onChange={(e) => setStuPaymentDate(e.target.value)}
                          />
                        </div>
                      </div>
                    </>
                  );
                })()}
              </div>
            )}

            <div style={{ display: 'flex', gap: 10, marginTop: 10 }}>
              <button type="button" className="avm-btn-secondary" style={{ flex: 1 }} onClick={() => { setAddStudentModalOpen(false); setEditStudent(null); }}>
                Cancel
              </button>
              <button type="submit" className="avm-btn-primary" style={{ flex: 1 }}>
                {editStudent ? 'Update Student Record' : 'Save & Register Student'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: REGISTER NEW TEACHER / STAFF MODAL (7 TABS FULL ERP FLOW) */}
      {/* ========================================================================= */}
      {addTeacherModalOpen && (
        <Modal
          isOpen={addTeacherModalOpen}
          onClose={() => { setAddTeacherModalOpen(false); setEditTeacher(null); }}
          title={editTeacher ? 'Edit Teacher / Staff Details' : 'Register New Teacher / Staff'}
        >
          <form onSubmit={handleSaveTeacher} style={{ display: 'flex', flexDirection: 'column', gap: 14, maxHeight: '75vh', overflowY: 'auto' }}>
            {empValidationError && (
              <div style={{ backgroundColor: '#FEF2F2', color: '#DC2626', padding: '10px 14px', borderRadius: 10, fontSize: 13, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8 }}>
                <AlertCircle size={16} />
                <span>{empValidationError}</span>
              </div>
            )}

            {/* 9-Step Tab Navigation Bar */}
            <div style={{ display: 'flex', gap: 6, backgroundColor: '#F1F5F9', padding: 6, borderRadius: 12, overflowX: 'auto', flexShrink: 0 }}>
              {[
                { id: 'personal', label: '1. Personal' },
                { id: 'professional', label: '2. Professional' },
                { id: 'academic', label: '3. Academic & Teaching' },
                { id: 'parents', label: '4. Parents / Emergency' },
                { id: 'address', label: '5. Address' },
                { id: 'documents', label: '6. Documents' },
                { id: 'account', label: '7. Account' },
                { id: 'transport', label: '8. Transport' },
                { id: 'salary', label: '9. Salary & Payments' }
              ].map((tb) => (
                <button
                  key={tb.id}
                  type="button"
                  onClick={() => setEmpFormTab(tb.id as any)}
                  style={{
                    flexShrink: 0,
                    padding: '8px 12px',
                    borderRadius: 8,
                    border: 'none',
                    backgroundColor: empFormTab === tb.id ? '#FFFFFF' : 'transparent',
                    color: empFormTab === tb.id ? '#1769E0' : '#64748B',
                    fontWeight: empFormTab === tb.id ? 800 : 600,
                    fontSize: 12,
                    cursor: 'pointer',
                    boxShadow: empFormTab === tb.id ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                    whiteSpace: 'nowrap',
                    transition: 'all 0.15s ease'
                  }}
                >
                  {tb.label}
                </button>
              ))}
            </div>

            {/* Scrollable Form Body */}
            <div style={{ flex: 1, overflowY: 'auto', paddingRight: 4, display: 'flex', flexDirection: 'column', gap: 16 }}>
              {/* STEP 1: PERSONAL INFORMATION */}
              {empFormTab === 'personal' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, borderBottom: '2px solid #E2E8F0', paddingBottom: 8 }}>
                    <User size={18} color="#1769E0" />
                    <h3 style={{ fontSize: 14, fontWeight: 800, color: '#0F172A', margin: 0 }}>Step 1 — Personal Information</h3>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                    <div style={{ gridColumn: 'span 2' }}>
                      <label style={{ fontSize: 12, fontWeight: 700, color: '#475569', display: 'block', marginBottom: 4 }}>
                        Full Name <span style={{ color: '#DC2626' }}>*</span>
                      </label>
                      <input
                        type="text"
                        className="avm-input"
                        value={empName}
                        onChange={(e) => setEmpName(e.target.value)}
                        placeholder="e.g. Priya Sharma"
                        required
                      />
                    </div>

                    <div>
                      <label style={{ fontSize: 12, fontWeight: 700, color: '#475569', display: 'block', marginBottom: 4 }}>
                        Employee ID (Auto-generated if left blank)
                      </label>
                      <input
                        type="text"
                        className="avm-input"
                        value={empCodeInput}
                        onChange={(e) => setEmpCodeInput(e.target.value)}
                        placeholder="e.g. EMP2026001 (Leave blank to auto-generate)"
                      />
                    </div>

                    <div>
                      <label style={{ fontSize: 12, fontWeight: 700, color: '#475569', display: 'block', marginBottom: 4 }}>Date of Birth</label>
                      <input
                        type="date"
                        className="avm-input"
                        value={empDob}
                        onChange={(e) => setEmpDob(e.target.value)}
                      />
                    </div>

                    <div>
                      <label style={{ fontSize: 12, fontWeight: 700, color: '#475569', display: 'block', marginBottom: 4 }}>Gender</label>
                      <select className="avm-select" value={empGender} onChange={(e) => setEmpGender(e.target.value)}>
                        <option value="Female">Female</option>
                        <option value="Male">Male</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>

                    <div>
                      <label style={{ fontSize: 12, fontWeight: 700, color: '#475569', display: 'block', marginBottom: 4 }}>Blood Group</label>
                      <select className="avm-select" value={empBloodGroup} onChange={(e) => setEmpBloodGroup(e.target.value)}>
                        <option value="A+">A+</option>
                        <option value="A-">A-</option>
                        <option value="B+">B+</option>
                        <option value="B-">B-</option>
                        <option value="O+">O+</option>
                        <option value="O-">O-</option>
                        <option value="AB+">AB+</option>
                        <option value="AB-">AB-</option>
                      </select>
                    </div>

                    <div>
                      <label style={{ fontSize: 12, fontWeight: 700, color: '#475569', display: 'block', marginBottom: 4 }}>Category</label>
                      <select className="avm-select" value={empCategory} onChange={(e) => setEmpCategory(e.target.value)}>
                        <option value="General">General</option>
                        <option value="OBC">OBC</option>
                        <option value="SC">SC</option>
                        <option value="ST">ST</option>
                        <option value="EWS">EWS</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>

                    <div>
                      <label style={{ fontSize: 12, fontWeight: 700, color: '#475569', display: 'block', marginBottom: 4 }}>Nationality</label>
                      <input
                        type="text"
                        className="avm-input"
                        value={empNationality}
                        onChange={(e) => setEmpNationality(e.target.value)}
                        placeholder="Indian"
                      />
                    </div>

                    <div>
                      <label style={{ fontSize: 12, fontWeight: 700, color: '#475569', display: 'block', marginBottom: 4 }}>Aadhaar Number</label>
                      <input
                        type="text"
                        className="avm-input"
                        value={empAadhaar}
                        onChange={(e) => setEmpAadhaar(e.target.value)}
                        placeholder="12-digit Aadhaar Number"
                      />
                    </div>

                    <div>
                      <label style={{ fontSize: 12, fontWeight: 700, color: '#475569', display: 'block', marginBottom: 4 }}>PAN Number</label>
                      <input
                        type="text"
                        className="avm-input"
                        value={empPanNumber}
                        onChange={(e) => setEmpPanNumber(e.target.value.toUpperCase())}
                        placeholder="e.g. ABCDE1234F"
                      />
                    </div>

                    <div>
                      <label style={{ fontSize: 12, fontWeight: 700, color: '#475569', display: 'block', marginBottom: 4 }}>
                        Mobile Number <span style={{ color: '#DC2626' }}>*</span>
                      </label>
                      <input
                        type="tel"
                        className="avm-input"
                        value={empPhone}
                        onChange={(e) => setEmpPhone(e.target.value)}
                        placeholder="10-digit mobile number"
                        required
                      />
                    </div>

                    <div>
                      <label style={{ fontSize: 12, fontWeight: 700, color: '#475569', display: 'block', marginBottom: 4 }}>Alternate Mobile</label>
                      <input
                        type="tel"
                        className="avm-input"
                        value={empAltPhone}
                        onChange={(e) => setEmpAltPhone(e.target.value)}
                        placeholder="Alternate contact number"
                      />
                    </div>

                    <div style={{ gridColumn: 'span 2' }}>
                      <label style={{ fontSize: 12, fontWeight: 700, color: '#475569', display: 'block', marginBottom: 4 }}>Email Address</label>
                      <input
                        type="email"
                        className="avm-input"
                        value={empEmail}
                        onChange={(e) => setEmpEmail(e.target.value)}
                        placeholder="priya.sharma@avm.edu.in"
                      />
                    </div>

                    <div style={{ gridColumn: 'span 2' }}>
                      <label style={{ fontSize: 12, fontWeight: 700, color: '#475569', display: 'block', marginBottom: 4 }}>Profile Photo</label>
                      <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                        <img
                          src={empPhoto || 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150'}
                          alt="Profile Preview"
                          style={{ width: 54, height: 54, borderRadius: '50%', objectFit: 'cover', border: '2px solid #1769E0' }}
                        />
                        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 4 }}>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={async (e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                const base64 = await processProfileImageFile(file);
                                setEmpPhoto(base64);
                              }
                            }}
                            style={{ fontSize: 12 }}
                          />
                          <input
                            type="text"
                            className="avm-input"
                            value={empPhoto}
                            onChange={(e) => setEmpPhoto(e.target.value)}
                            placeholder="Or paste photo URL here..."
                            style={{ fontSize: 12, padding: '6px 10px' }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 2: PROFESSIONAL INFORMATION */}
              {empFormTab === 'professional' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, borderBottom: '2px solid #E2E8F0', paddingBottom: 8 }}>
                    <Briefcase size={18} color="#1769E0" />
                    <h3 style={{ fontSize: 14, fontWeight: 800, color: '#0F172A', margin: 0 }}>Step 2 — Professional Information</h3>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                    <div>
                      <label style={{ fontSize: 12, fontWeight: 700, color: '#475569', display: 'block', marginBottom: 4 }}>
                        Designation <span style={{ color: '#DC2626' }}>*</span>
                      </label>
                      <select className="avm-select" value={empDesig} onChange={(e) => setEmpDesig(e.target.value)}>
                        <option value="Principal">Principal</option>
                        <option value="Vice Principal">Vice Principal</option>
                        <option value="Teacher">Teacher</option>
                        <option value="Accountant">Accountant</option>
                        <option value="Clerk">Clerk</option>
                        <option value="Librarian">Librarian</option>
                        <option value="Lab Assistant">Lab Assistant</option>
                        <option value="Receptionist">Receptionist</option>
                        <option value="Driver">Driver</option>
                        <option value="Conductor">Conductor</option>
                        <option value="Peon">Peon</option>
                        <option value="Security">Security</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>

                    <div>
                      <label style={{ fontSize: 12, fontWeight: 700, color: '#475569', display: 'block', marginBottom: 4 }}>
                        Department <span style={{ color: '#DC2626' }}>*</span>
                      </label>
                      <select className="avm-select" value={empDepartment} onChange={(e) => setEmpDepartment(e.target.value)}>
                        <option value="Academic">Academic</option>
                        <option value="Administration">Administration</option>
                        <option value="Accounts">Accounts</option>
                        <option value="Transport">Transport</option>
                        <option value="Office">Office</option>
                        <option value="Support Staff">Support Staff</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>

                    <div>
                      <label style={{ fontSize: 12, fontWeight: 700, color: '#475569', display: 'block', marginBottom: 4 }}>
                        Date of Joining <span style={{ color: '#DC2626' }}>*</span>
                      </label>
                      <input
                        type="date"
                        className="avm-input"
                        value={empJoinDate}
                        onChange={(e) => setEmpJoinDate(e.target.value)}
                        required
                      />
                    </div>

                    <div>
                      <label style={{ fontSize: 12, fontWeight: 700, color: '#475569', display: 'block', marginBottom: 4 }}>Employment Type</label>
                      <select className="avm-select" value={empType} onChange={(e) => setEmpType(e.target.value)}>
                        <option value="Permanent">Permanent</option>
                        <option value="Contract">Contract</option>
                        <option value="Temporary">Temporary</option>
                        <option value="Part Time">Part Time</option>
                      </select>
                    </div>

                    <div>
                      <label style={{ fontSize: 12, fontWeight: 700, color: '#475569', display: 'block', marginBottom: 4 }}>Work Status</label>
                      <select className="avm-select" value={empStatus} onChange={(e) => setEmpStatus(e.target.value as any)}>
                        <option value="Active">Active</option>
                        <option value="Inactive">Inactive</option>
                        <option value="On Leave">On Leave</option>
                        <option value="Resigned">Resigned</option>
                      </select>
                    </div>

                    <div>
                      <label style={{ fontSize: 12, fontWeight: 700, color: '#475569', display: 'block', marginBottom: 4 }}>Overall Experience</label>
                      <input
                        type="text"
                        className="avm-input"
                        value={empExp}
                        onChange={(e) => setEmpExp(e.target.value)}
                        placeholder="e.g. 5 Years"
                      />
                    </div>

                    <div>
                      <label style={{ fontSize: 12, fontWeight: 700, color: '#475569', display: 'block', marginBottom: 4 }}>Previous School / Organization</label>
                      <input
                        type="text"
                        className="avm-input"
                        value={empPrevSchool}
                        onChange={(e) => setEmpPrevSchool(e.target.value)}
                        placeholder="e.g. St. Xavier School"
                      />
                    </div>

                    <div>
                      <label style={{ fontSize: 12, fontWeight: 700, color: '#475569', display: 'block', marginBottom: 4 }}>Previous Designation</label>
                      <input
                        type="text"
                        className="avm-input"
                        value={empPrevDesignation}
                        onChange={(e) => setEmpPrevDesignation(e.target.value)}
                        placeholder="e.g. Senior Teacher"
                      />
                    </div>

                    <div>
                      <label style={{ fontSize: 12, fontWeight: 700, color: '#475569', display: 'block', marginBottom: 4 }}>Employee Code / UAN (Optional)</label>
                      <input
                        type="text"
                        className="avm-input"
                        value={empUanCode}
                        onChange={(e) => setEmpUanCode(e.target.value)}
                        placeholder="UAN Number"
                      />
                    </div>

                    <div>
                      <label style={{ fontSize: 12, fontWeight: 700, color: '#475569', display: 'block', marginBottom: 4 }}>ESI Number (Optional)</label>
                      <input
                        type="text"
                        className="avm-input"
                        value={empEsiNumber}
                        onChange={(e) => setEmpEsiNumber(e.target.value)}
                        placeholder="ESI Account Number"
                      />
                    </div>

                    <div style={{ gridColumn: 'span 2' }}>
                      <label style={{ fontSize: 12, fontWeight: 700, color: '#475569', display: 'block', marginBottom: 4 }}>PF Number (Optional)</label>
                      <input
                        type="text"
                        className="avm-input"
                        value={empPfNumber}
                        onChange={(e) => setEmpPfNumber(e.target.value)}
                        placeholder="PF Account Number"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 3: ACADEMIC & TEACHING INFORMATION */}
              {empFormTab === 'academic' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, borderBottom: '2px solid #E2E8F0', paddingBottom: 8 }}>
                    <BookOpen size={18} color="#1769E0" />
                    <h3 style={{ fontSize: 14, fontWeight: 800, color: '#0F172A', margin: 0 }}>Step 3 — Academic & Teaching Information</h3>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                    <div>
                      <label style={{ fontSize: 12, fontWeight: 700, color: '#475569', display: 'block', marginBottom: 4 }}>Highest Qualification</label>
                      <input
                        type="text"
                        className="avm-input"
                        value={empQual}
                        onChange={(e) => setEmpQual(e.target.value)}
                        placeholder="e.g. M.Sc, M.A, B.Sc"
                      />
                    </div>

                    <div>
                      <label style={{ fontSize: 12, fontWeight: 700, color: '#475569', display: 'block', marginBottom: 4 }}>Professional Qualification</label>
                      <input
                        type="text"
                        className="avm-input"
                        value={empProfQual}
                        onChange={(e) => setEmpProfQual(e.target.value)}
                        placeholder="e.g. B.Ed, D.El.Ed, M.Ed"
                      />
                    </div>

                    <div>
                      <label style={{ fontSize: 12, fontWeight: 700, color: '#475569', display: 'block', marginBottom: 4 }}>Specialization</label>
                      <input
                        type="text"
                        className="avm-input"
                        value={empSpecialization}
                        onChange={(e) => setEmpSpecialization(e.target.value)}
                        placeholder="e.g. Pure Mathematics, Physics"
                      />
                    </div>

                    <div>
                      <label style={{ fontSize: 12, fontWeight: 700, color: '#475569', display: 'block', marginBottom: 4 }}>Teaching Experience</label>
                      <input
                        type="text"
                        className="avm-input"
                        value={empTeachingExp}
                        onChange={(e) => setEmpTeachingExp(e.target.value)}
                        placeholder="e.g. 4 Years"
                      />
                    </div>

                    <div>
                      <label style={{ fontSize: 12, fontWeight: 700, color: '#475569', display: 'block', marginBottom: 4 }}>Primary Subject</label>
                      <input
                        type="text"
                        className="avm-input"
                        value={empSubject}
                        onChange={(e) => setEmpSubject(e.target.value)}
                        placeholder="e.g. Mathematics"
                      />
                    </div>

                    <div>
                      <label style={{ fontSize: 12, fontWeight: 700, color: '#475569', display: 'block', marginBottom: 4 }}>Teaching Medium</label>
                      <select className="avm-select" value={empMedium} onChange={(e) => setEmpMedium(e.target.value)}>
                        <option value="Hindi">Hindi</option>
                        <option value="English">English</option>
                        <option value="Hindi + English">Hindi + English</option>
                      </select>
                    </div>

                    {/* Class Teacher Assignment */}
                    <div style={{ gridColumn: 'span 2', backgroundColor: '#F0FDFA', padding: 12, borderRadius: 10, border: '1px solid #99F6E4' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                        <label style={{ fontSize: 13, fontWeight: 800, color: '#0D9488' }}>Is Class Teacher?</label>
                        <div style={{ display: 'flex', gap: 12 }}>
                          <label style={{ fontSize: 12, fontWeight: 700, color: '#0F172A', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>
                            <input
                              type="radio"
                              name="isClassTeacher"
                              value="Yes"
                              checked={empIsClassTeacher === 'Yes'}
                              onChange={() => setEmpIsClassTeacher('Yes')}
                            />
                            YES
                          </label>
                          <label style={{ fontSize: 12, fontWeight: 700, color: '#0F172A', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>
                            <input
                              type="radio"
                              name="isClassTeacher"
                              value="No"
                              checked={empIsClassTeacher === 'No'}
                              onChange={() => setEmpIsClassTeacher('No')}
                            />
                            NO
                          </label>
                        </div>
                      </div>

                      {empIsClassTeacher === 'Yes' && (
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 8 }}>
                          <div>
                            <label style={{ fontSize: 11, fontWeight: 700, color: '#0F172A', display: 'block', marginBottom: 4 }}>Assigned Class</label>
                            <select className="avm-select" value={empClassTeacherClass} onChange={(e) => setEmpClassTeacherClass(e.target.value)}>
                              {(demoDataStore.getDB().schoolClasses || [{ id: '1', name: 'Class 5' }]).map((c: any) => (
                                <option key={c.id || c.name || c.className} value={c.name || c.className}>{c.name || c.className}</option>
                              ))}
                            </select>
                          </div>
                          <div>
                            <label style={{ fontSize: 11, fontWeight: 700, color: '#0F172A', display: 'block', marginBottom: 4 }}>Section</label>
                            <select className="avm-select" value={empClassTeacherSec} onChange={(e) => setEmpClassTeacherSec(e.target.value)}>
                              <option value="A">Section A</option>
                              <option value="B">Section B</option>
                              <option value="C">Section C</option>
                            </select>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Teaching Classes Multi-Select */}
                    <div style={{ gridColumn: 'span 2' }}>
                      <label style={{ fontSize: 12, fontWeight: 700, color: '#475569', display: 'block', marginBottom: 6 }}>
                        Teaching Classes (Multi-Select):
                      </label>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, backgroundColor: '#F8FAFC', padding: 10, borderRadius: 10, border: '1px solid #E2E8F0' }}>
                        {['Nursery-A', 'LKG-A', 'UKG-A', 'Class 1-A', 'Class 2-A', 'Class 3-A', 'Class 4-A', 'Class 5-A', 'Class 6-A', 'Class 7-A', 'Class 8-A'].map((cls) => {
                          const isChecked = empAssignedClasses.includes(cls);
                          return (
                            <label
                              key={cls}
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 6,
                                padding: '4px 10px',
                                borderRadius: 6,
                                backgroundColor: isChecked ? '#EFF6FF' : '#FFFFFF',
                                border: `1px solid ${isChecked ? '#1769E0' : '#CBD5E1'}`,
                                color: isChecked ? '#1769E0' : '#475569',
                                fontSize: 12,
                                fontWeight: isChecked ? 800 : 600,
                                cursor: 'pointer'
                              }}
                            >
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setEmpAssignedClasses([...empAssignedClasses, cls]);
                                  } else {
                                    setEmpAssignedClasses(empAssignedClasses.filter(c => c !== cls));
                                  }
                                }}
                              />
                              {cls}
                            </label>
                          );
                        })}
                      </div>
                    </div>

                    {/* Teaching Subjects Multi-Select */}
                    <div style={{ gridColumn: 'span 2' }}>
                      <label style={{ fontSize: 12, fontWeight: 700, color: '#475569', display: 'block', marginBottom: 6 }}>
                        Teaching Subjects (From Subjects Master):
                      </label>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, backgroundColor: '#F8FAFC', padding: 10, borderRadius: 10, border: '1px solid #E2E8F0' }}>
                        {(demoDataStore.getDB().masterSubjects || [{ name: 'Mathematics' }, { name: 'Science' }, { name: 'Computer' }, { name: 'English' }, { name: 'Hindi' }]).map((subObj: any) => {
                          const sName = typeof subObj === 'string' ? subObj : subObj.name;
                          const isChecked = empTeachingSubjects.includes(sName);
                          return (
                            <label
                              key={sName}
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 6,
                                padding: '4px 10px',
                                borderRadius: 6,
                                backgroundColor: isChecked ? '#F3E8FF' : '#FFFFFF',
                                border: `1px solid ${isChecked ? '#7C3AED' : '#CBD5E1'}`,
                                color: isChecked ? '#7C3AED' : '#475569',
                                fontSize: 12,
                                fontWeight: isChecked ? 800 : 600,
                                cursor: 'pointer'
                              }}
                            >
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setEmpTeachingSubjects([...empTeachingSubjects, sName]);
                                  } else {
                                    setEmpTeachingSubjects(empTeachingSubjects.filter(s => s !== sName));
                                  }
                                }}
                              />
                              {sName}
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 4: PARENTS / EMERGENCY INFORMATION */}
              {empFormTab === 'parents' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, borderBottom: '2px solid #E2E8F0', paddingBottom: 8 }}>
                    <Users size={18} color="#1769E0" />
                    <h3 style={{ fontSize: 14, fontWeight: 800, color: '#0F172A', margin: 0 }}>Step 4 — Family & Emergency Contacts</h3>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                    <div>
                      <label style={{ fontSize: 12, fontWeight: 700, color: '#475569', display: 'block', marginBottom: 4 }}>Father Name</label>
                      <input
                        type="text"
                        className="avm-input"
                        value={empFather}
                        onChange={(e) => setEmpFather(e.target.value)}
                        placeholder="Father's full name"
                      />
                    </div>

                    <div>
                      <label style={{ fontSize: 12, fontWeight: 700, color: '#475569', display: 'block', marginBottom: 4 }}>Mother Name</label>
                      <input
                        type="text"
                        className="avm-input"
                        value={empMother}
                        onChange={(e) => setEmpMother(e.target.value)}
                        placeholder="Mother's full name"
                      />
                    </div>

                    <div>
                      <label style={{ fontSize: 12, fontWeight: 700, color: '#475569', display: 'block', marginBottom: 4 }}>Spouse Name</label>
                      <input
                        type="text"
                        className="avm-input"
                        value={empSpouse}
                        onChange={(e) => setEmpSpouse(e.target.value)}
                        placeholder="Spouse name (if applicable)"
                      />
                    </div>

                    <div>
                      <label style={{ fontSize: 12, fontWeight: 700, color: '#475569', display: 'block', marginBottom: 4 }}>Guardian Name</label>
                      <input
                        type="text"
                        className="avm-input"
                        value={empGuardianName}
                        onChange={(e) => setEmpGuardianName(e.target.value)}
                        placeholder="Guardian full name"
                      />
                    </div>

                    {/* Emergency Contact Card */}
                    <div style={{ gridColumn: 'span 2', backgroundColor: '#FEF2F2', padding: 12, borderRadius: 10, border: '1px solid #FECACA' }}>
                      <h4 style={{ fontSize: 13, fontWeight: 800, color: '#DC2626', margin: '0 0 10px', display: 'flex', alignItems: 'center', gap: 6 }}>
                        <Phone size={15} /> Emergency Contact Details
                      </h4>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                        <div>
                          <label style={{ fontSize: 11, fontWeight: 700, color: '#0F172A', display: 'block', marginBottom: 4 }}>Contact Person Name</label>
                          <input
                            type="text"
                            className="avm-input"
                            value={empEmgName}
                            onChange={(e) => setEmpEmgName(e.target.value)}
                            placeholder="e.g. Ramesh Sharma"
                          />
                        </div>
                        <div>
                          <label style={{ fontSize: 11, fontWeight: 700, color: '#0F172A', display: 'block', marginBottom: 4 }}>Relationship</label>
                          <input
                            type="text"
                            className="avm-input"
                            value={empEmgRelation}
                            onChange={(e) => setEmpEmgRelation(e.target.value)}
                            placeholder="e.g. Spouse / Brother"
                          />
                        </div>
                        <div>
                          <label style={{ fontSize: 11, fontWeight: 700, color: '#0F172A', display: 'block', marginBottom: 4 }}>Emergency Mobile Number</label>
                          <input
                            type="tel"
                            className="avm-input"
                            value={empEmgPhone}
                            onChange={(e) => setEmpEmgPhone(e.target.value)}
                            placeholder="10-digit emergency number"
                          />
                        </div>
                        <div>
                          <label style={{ fontSize: 11, fontWeight: 700, color: '#0F172A', display: 'block', marginBottom: 4 }}>Alternate Number</label>
                          <input
                            type="tel"
                            className="avm-input"
                            value={empEmgAltPhone}
                            onChange={(e) => setEmpEmgAltPhone(e.target.value)}
                            placeholder="Alternate contact"
                          />
                        </div>
                        <div style={{ gridColumn: 'span 2' }}>
                          <label style={{ fontSize: 11, fontWeight: 700, color: '#0F172A', display: 'block', marginBottom: 4 }}>Emergency Address</label>
                          <input
                            type="text"
                            className="avm-input"
                            value={empEmgAddress}
                            onChange={(e) => setEmpEmgAddress(e.target.value)}
                            placeholder="Full emergency contact address"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 5: ADDRESS INFORMATION */}
              {empFormTab === 'address' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, borderBottom: '2px solid #E2E8F0', paddingBottom: 8 }}>
                    <MapPin size={18} color="#1769E0" />
                    <h3 style={{ fontSize: 14, fontWeight: 800, color: '#0F172A', margin: 0 }}>Step 5 — Residential & Permanent Address</h3>
                  </div>

                  {/* Present Address */}
                  <div style={{ backgroundColor: '#F8FAFC', padding: 12, borderRadius: 10, border: '1px solid #E2E8F0' }}>
                    <h4 style={{ fontSize: 13, fontWeight: 800, color: '#1769E0', margin: '0 0 10px' }}>Present Address</h4>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                      <div style={{ gridColumn: 'span 2' }}>
                        <label style={{ fontSize: 11, fontWeight: 700, color: '#475569', display: 'block', marginBottom: 4 }}>House No. / Street / Colony</label>
                        <input
                          type="text"
                          className="avm-input"
                          value={empAddress}
                          onChange={(e) => {
                            setEmpAddress(e.target.value);
                            if (empSameAsCurrentAddress) setEmpPermAddress(e.target.value);
                          }}
                          placeholder="e.g. House No. 42, Teachers Colony"
                        />
                      </div>
                      <div>
                        <label style={{ fontSize: 11, fontWeight: 700, color: '#475569', display: 'block', marginBottom: 4 }}>Village / City</label>
                        <input
                          type="text"
                          className="avm-input"
                          value={empVillage || empCity}
                          onChange={(e) => {
                            setEmpVillage(e.target.value);
                            setEmpCity(e.target.value);
                            if (empSameAsCurrentAddress) {
                              setEmpPermVillage(e.target.value);
                              setEmpPermCity(e.target.value);
                            }
                          }}
                          placeholder="e.g. Kajraili / Bhagalpur"
                        />
                      </div>
                      <div>
                        <label style={{ fontSize: 11, fontWeight: 700, color: '#475569', display: 'block', marginBottom: 4 }}>District</label>
                        <input
                          type="text"
                          className="avm-input"
                          value={empDistrict}
                          onChange={(e) => {
                            setEmpDistrict(e.target.value);
                            if (empSameAsCurrentAddress) setEmpPermDistrict(e.target.value);
                          }}
                          placeholder="Bhagalpur"
                        />
                      </div>
                      <div>
                        <label style={{ fontSize: 11, fontWeight: 700, color: '#475569', display: 'block', marginBottom: 4 }}>State</label>
                        <input
                          type="text"
                          className="avm-input"
                          value={empState}
                          onChange={(e) => {
                            setEmpState(e.target.value);
                            if (empSameAsCurrentAddress) setEmpPermState(e.target.value);
                          }}
                          placeholder="Bihar"
                        />
                      </div>
                      <div>
                        <label style={{ fontSize: 11, fontWeight: 700, color: '#475569', display: 'block', marginBottom: 4 }}>PIN Code</label>
                        <input
                          type="text"
                          className="avm-input"
                          value={empPinCode}
                          onChange={(e) => {
                            setEmpPinCode(e.target.value);
                            if (empSameAsCurrentAddress) setEmpPermPinCode(e.target.value);
                          }}
                          placeholder="812005"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Same address checkbox */}
                  <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, fontWeight: 800, color: '#0F172A', cursor: 'pointer', margin: '4px 0' }}>
                    <input
                      type="checkbox"
                      checked={empSameAsCurrentAddress}
                      onChange={(e) => {
                        const checked = e.target.checked;
                        setEmpSameAsCurrentAddress(checked);
                        if (checked) {
                          setEmpPermAddress(empAddress);
                          setEmpPermVillage(empVillage);
                          setEmpPermCity(empCity);
                          setEmpPermDistrict(empDistrict);
                          setEmpPermState(empState);
                          setEmpPermPinCode(empPinCode);
                        }
                      }}
                    />
                    ☑ Permanent Address same as Present Address
                  </label>

                  {/* Permanent Address */}
                  {!empSameAsCurrentAddress && (
                    <div style={{ backgroundColor: '#F8FAFC', padding: 12, borderRadius: 10, border: '1px solid #E2E8F0' }}>
                      <h4 style={{ fontSize: 13, fontWeight: 800, color: '#7C3AED', margin: '0 0 10px' }}>Permanent Address</h4>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                        <div style={{ gridColumn: 'span 2' }}>
                          <label style={{ fontSize: 11, fontWeight: 700, color: '#475569', display: 'block', marginBottom: 4 }}>House No. / Street / Colony</label>
                          <input
                            type="text"
                            className="avm-input"
                            value={empPermAddress}
                            onChange={(e) => setEmpPermAddress(e.target.value)}
                            placeholder="Permanent house details"
                          />
                        </div>
                        <div>
                          <label style={{ fontSize: 11, fontWeight: 700, color: '#475569', display: 'block', marginBottom: 4 }}>Village / City</label>
                          <input
                            type="text"
                            className="avm-input"
                            value={empPermVillage || empPermCity}
                            onChange={(e) => { setEmpPermVillage(e.target.value); setEmpPermCity(e.target.value); }}
                            placeholder="Village or City"
                          />
                        </div>
                        <div>
                          <label style={{ fontSize: 11, fontWeight: 700, color: '#475569', display: 'block', marginBottom: 4 }}>District</label>
                          <input
                            type="text"
                            className="avm-input"
                            value={empPermDistrict}
                            onChange={(e) => setEmpPermDistrict(e.target.value)}
                            placeholder="District"
                          />
                        </div>
                        <div>
                          <label style={{ fontSize: 11, fontWeight: 700, color: '#475569', display: 'block', marginBottom: 4 }}>State</label>
                          <input
                            type="text"
                            className="avm-input"
                            value={empPermState}
                            onChange={(e) => setEmpPermState(e.target.value)}
                            placeholder="State"
                          />
                        </div>
                        <div>
                          <label style={{ fontSize: 11, fontWeight: 700, color: '#475569', display: 'block', marginBottom: 4 }}>PIN Code</label>
                          <input
                            type="text"
                            className="avm-input"
                            value={empPermPinCode}
                            onChange={(e) => setEmpPermPinCode(e.target.value)}
                            placeholder="PIN Code"
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* STEP 6: DOCUMENTS */}
              {empFormTab === 'documents' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, borderBottom: '2px solid #E2E8F0', paddingBottom: 8 }}>
                    <FileText size={18} color="#1769E0" />
                    <h3 style={{ fontSize: 14, fontWeight: 800, color: '#0F172A', margin: 0 }}>Step 6 — Employee Document Repository</h3>
                  </div>

                  {/* Add Document Card */}
                  <div style={{ backgroundColor: '#F8FAFC', padding: 14, borderRadius: 12, border: '1px solid #E2E8F0' }}>
                    <h4 style={{ fontSize: 13, fontWeight: 800, color: '#1769E0', margin: '0 0 10px', display: 'flex', alignItems: 'center', gap: 6 }}>
                      <Paperclip size={15} /> Upload / Attach New Document
                    </h4>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                      <div>
                        <label style={{ fontSize: 11, fontWeight: 700, color: '#475569', display: 'block', marginBottom: 4 }}>Document Type</label>
                        <select className="avm-select" value={docTypeInput} onChange={(e) => setDocTypeInput(e.target.value)}>
                          <option value="Aadhaar Card">Aadhaar Card</option>
                          <option value="PAN Card">PAN Card</option>
                          <option value="Educational Certificate">Educational Certificate</option>
                          <option value="Experience Certificate">Experience Certificate</option>
                          <option value="Joining Letter">Joining Letter</option>
                          <option value="Address Proof">Address Proof</option>
                          <option value="Other Document">Other Document</option>
                        </select>
                      </div>

                      <div>
                        <label style={{ fontSize: 11, fontWeight: 700, color: '#475569', display: 'block', marginBottom: 4 }}>Document Number</label>
                        <input
                          type="text"
                          className="avm-input"
                          value={docNumberInput}
                          onChange={(e) => setDocNumberInput(e.target.value)}
                          placeholder="e.g. DOC-2026-981"
                        />
                      </div>

                      <div>
                        <label style={{ fontSize: 11, fontWeight: 700, color: '#475569', display: 'block', marginBottom: 4 }}>Issue Date</label>
                        <input
                          type="date"
                          className="avm-input"
                          value={docIssueDateInput}
                          onChange={(e) => setDocIssueDateInput(e.target.value)}
                        />
                      </div>

                      <div>
                        <label style={{ fontSize: 11, fontWeight: 700, color: '#475569', display: 'block', marginBottom: 4 }}>Expiry Date (Optional)</label>
                        <input
                          type="date"
                          className="avm-input"
                          value={docExpiryDateInput}
                          onChange={(e) => setDocExpiryDateInput(e.target.value)}
                        />
                      </div>

                      <div style={{ gridColumn: 'span 2' }}>
                        <label style={{ fontSize: 11, fontWeight: 700, color: '#475569', display: 'block', marginBottom: 4 }}>Remarks / Description</label>
                        <input
                          type="text"
                          className="avm-input"
                          value={docRemarksInput}
                          onChange={(e) => setDocRemarksInput(e.target.value)}
                          placeholder="e.g. Verified original copy"
                        />
                      </div>

                      <div style={{ gridColumn: 'span 2' }}>
                        <label style={{ fontSize: 11, fontWeight: 700, color: '#475569', display: 'block', marginBottom: 4 }}>Select File / Attachment</label>
                        <input
                          type="file"
                          onChange={async (e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              setDocFileNameInput(file.name);
                              const base64 = await processProfileImageFile(file);
                              setDocFileInput(base64);
                            }
                          }}
                          style={{ fontSize: 12 }}
                        />
                      </div>
                    </div>

                    <button
                      type="button"
                      className="avm-btn-primary"
                      style={{ marginTop: 12, width: '100%', backgroundColor: '#0D9488' }}
                      onClick={() => {
                        if (!docTypeInput) return;
                        const newDoc = {
                          id: `DOC-${Date.now()}`,
                          documentType: docTypeInput,
                          documentNumber: docNumberInput || 'N/A',
                          fileUrl: docFileInput || 'https://images.unsplash.com/photo-1568602471122-7832951cc4c5?w=200',
                          fileName: docFileNameInput || `${docTypeInput}.pdf`,
                          issueDate: docIssueDateInput || new Date().toISOString().split('T')[0],
                          expiryDate: docExpiryDateInput,
                          remarks: docRemarksInput
                        };
                        setEmpDocuments([...empDocuments, newDoc]);
                        setDocNumberInput('');
                        setDocFileInput('');
                        setDocFileNameInput('');
                        setDocRemarksInput('');
                      }}
                    >
                      <Plus size={16} /> Attach Document to Employee File
                    </button>
                  </div>

                  {/* List of Documents */}
                  <div>
                    <h4 style={{ fontSize: 13, fontWeight: 800, color: '#0F172A', margin: '10px 0 8px' }}>
                      Attached Documents ({empDocuments.length})
                    </h4>
                    {empDocuments.length === 0 ? (
                      <div style={{ padding: 16, textAlign: 'center', backgroundColor: '#F8FAFC', borderRadius: 10, border: '1px dashed #CBD5E1', color: '#94A3B8', fontSize: 12 }}>
                        No documents uploaded yet. Fill the form above to add documents.
                      </div>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        {empDocuments.map((doc, idx) => (
                          <div key={doc.id || idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#FFFFFF', padding: '10px 14px', borderRadius: 10, border: '1px solid #E2E8F0', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                              <FileCheck size={20} color="#1769E0" />
                              <div>
                                <div style={{ fontSize: 13, fontWeight: 800, color: '#0F172A' }}>{doc.documentType}</div>
                                <div style={{ fontSize: 11, color: '#64748B' }}>
                                  No: {doc.documentNumber} • Issued: {doc.issueDate} {doc.remarks ? `• ${doc.remarks}` : ''}
                                </div>
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={() => setEmpDocuments(empDocuments.filter((_, i) => i !== idx))}
                              style={{ backgroundColor: '#FEE2E2', color: '#DC2626', border: 'none', padding: '4px 8px', borderRadius: 6, fontSize: 11, fontWeight: 700, cursor: 'pointer' }}
                            >
                              Remove
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* STEP 7: ACCOUNT / LOGIN */}
              {empFormTab === 'account' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, borderBottom: '2px solid #E2E8F0', paddingBottom: 8 }}>
                    <Lock size={18} color="#1769E0" />
                    <h3 style={{ fontSize: 14, fontWeight: 800, color: '#0F172A', margin: 0 }}>Step 7 — Login Account & Portal Credentials</h3>
                  </div>

                  <div style={{ backgroundColor: '#FEF3C7', color: '#92400E', padding: '10px 14px', borderRadius: 10, fontSize: 12, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Shield size={16} />
                    <span>Existing user logins (e.g. priya / 123456) stay fully connected with the authentication system.</span>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                    <div>
                      <label style={{ fontSize: 12, fontWeight: 700, color: '#475569', display: 'block', marginBottom: 4 }}>
                        Username <span style={{ color: '#DC2626' }}>*</span>
                      </label>
                      <input
                        type="text"
                        className="avm-input"
                        value={empUsername}
                        onChange={(e) => setEmpUsername(e.target.value.trim().toLowerCase())}
                        placeholder="e.g. priya"
                        required
                      />
                    </div>

                    <div>
                      <label style={{ fontSize: 12, fontWeight: 700, color: '#475569', display: 'block', marginBottom: 4 }}>Role Access</label>
                      <select className="avm-select" value={empRole} onChange={(e) => setEmpRole(e.target.value)}>
                        <option value="Teacher">Teacher</option>
                        <option value="Employee">Employee</option>
                        <option value="Principal">Principal</option>
                        <option value="Accountant">Accountant</option>
                        <option value="Staff">Staff</option>
                      </select>
                    </div>

                    <div>
                      <label style={{ fontSize: 12, fontWeight: 700, color: '#475569', display: 'block', marginBottom: 4 }}>
                        Password <span style={{ color: '#DC2626' }}>*</span>
                      </label>
                      <input
                        type="password"
                        className="avm-input"
                        value={empPassword}
                        onChange={(e) => setEmpPassword(e.target.value)}
                        placeholder="Default: 123456"
                        required
                      />
                    </div>

                    <div>
                      <label style={{ fontSize: 12, fontWeight: 700, color: '#475569', display: 'block', marginBottom: 4 }}>
                        Confirm Password <span style={{ color: '#DC2626' }}>*</span>
                      </label>
                      <input
                        type="password"
                        className="avm-input"
                        value={empConfirmPassword}
                        onChange={(e) => setEmpConfirmPassword(e.target.value)}
                        placeholder="Re-enter password"
                        required
                      />
                    </div>

                    <div style={{ gridColumn: 'span 2' }}>
                      <label style={{ fontSize: 12, fontWeight: 700, color: '#475569', display: 'block', marginBottom: 4 }}>Account Status</label>
                      <select className="avm-select" value={empAccountStatus} onChange={(e) => setEmpAccountStatus(e.target.value)}>
                        <option value="Active">Active — Login Enabled</option>
                        <option value="Inactive">Inactive — Login Disabled</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 8: TRANSPORT SECTION */}
              {empFormTab === 'transport' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, borderBottom: '2px solid #E2E8F0', paddingBottom: 8 }}>
                    <BusIcon size={18} color="#1769E0" />
                    <h3 style={{ fontSize: 14, fontWeight: 800, color: '#0F172A', margin: 0 }}>Step 8 — Employee Transport & Bus Assignment</h3>
                  </div>

                  <div style={{ backgroundColor: '#F0FDF4', padding: 14, borderRadius: 12, border: '1px solid #BBF7D0' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                      <label style={{ fontSize: 13, fontWeight: 800, color: '#16A34A' }}>
                        Does this employee use school transport?
                      </label>
                      <div style={{ display: 'flex', gap: 12 }}>
                        <label style={{ fontSize: 12, fontWeight: 800, color: '#0F172A', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>
                          <input
                            type="radio"
                            name="empTransportReq"
                            value="Yes"
                            checked={empTransportReq === 'Yes'}
                            onChange={() => setEmpTransportReq('Yes')}
                          />
                          YES
                        </label>
                        <label style={{ fontSize: 12, fontWeight: 800, color: '#0F172A', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>
                          <input
                            type="radio"
                            name="empTransportReq"
                            value="No"
                            checked={empTransportReq === 'No'}
                            onChange={() => setEmpTransportReq('No')}
                          />
                          NO
                        </label>
                      </div>
                    </div>

                    {empTransportReq === 'Yes' && (
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 8 }}>
                        <div>
                          <label style={{ fontSize: 12, fontWeight: 700, color: '#0F172A', display: 'block', marginBottom: 4 }}>Assigned Bus</label>
                          <select
                            className="avm-select"
                            value={empTransportBusId}
                            onChange={(e) => {
                              const bId = e.target.value;
                              setEmpTransportBusId(bId);
                              const foundB = transportService.getBuses().find(b => b.id === bId);
                              if (foundB) {
                                setEmpTransportRoute(foundB.routeName || foundB.routeArea || 'Route 1');
                                if ((foundB as any).farePerMonth || (foundB as any).feePerMonth) setEmpTransportFee((foundB as any).farePerMonth || (foundB as any).feePerMonth);
                              }
                            }}
                          >
                            {transportService.getBuses().map((b) => (
                              <option key={b.id} value={b.id}>
                                {b.busNo || b.busNumber} — {b.routeName || b.routeArea || 'Route'} (Cap: {b.capacity})
                              </option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label style={{ fontSize: 12, fontWeight: 700, color: '#0F172A', display: 'block', marginBottom: 4 }}>Route Description</label>
                          <input
                            type="text"
                            className="avm-input"
                            value={empTransportRoute}
                            onChange={(e) => setEmpTransportRoute(e.target.value)}
                            placeholder="e.g. Route 2 — Kajraili to AVM Campus"
                          />
                        </div>

                        <div>
                          <label style={{ fontSize: 12, fontWeight: 700, color: '#0F172A', display: 'block', marginBottom: 4 }}>Pickup Stop</label>
                          <input
                            type="text"
                            className="avm-input"
                            value={empTransportStop}
                            onChange={(e) => setEmpTransportStop(e.target.value)}
                            placeholder="e.g. Kajraili Chowk"
                          />
                        </div>

                        <div>
                          <label style={{ fontSize: 12, fontWeight: 700, color: '#0F172A', display: 'block', marginBottom: 4 }}>Pickup Time</label>
                          <input
                            type="text"
                            className="avm-input"
                            value={empTransportTime}
                            onChange={(e) => setEmpTransportTime(e.target.value)}
                            placeholder="e.g. 07:15 AM"
                          />
                        </div>

                        <div>
                          <label style={{ fontSize: 12, fontWeight: 700, color: '#0F172A', display: 'block', marginBottom: 4 }}>Monthly Transport Fee (₹)</label>
                          <input
                            type="number"
                            className="avm-input"
                            value={empTransportFee}
                            onChange={(e) => setEmpTransportFee(Number(e.target.value) || 0)}
                            placeholder="700"
                          />
                        </div>

                        <div>
                          <label style={{ fontSize: 12, fontWeight: 700, color: '#0F172A', display: 'block', marginBottom: 4 }}>Transport Start Date</label>
                          <input
                            type="date"
                            className="avm-input"
                            value={empTransportStartDate}
                            onChange={(e) => setEmpTransportStartDate(e.target.value)}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* STEP 9: SALARY & PAYMENTS & DUES */}
              {empFormTab === 'salary' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, borderBottom: '2px solid #E2E8F0', paddingBottom: 8 }}>
                    <CreditCard size={18} color="#1769E0" />
                    <h3 style={{ fontSize: 14, fontWeight: 800, color: '#0F172A', margin: 0 }}>Step 9 — Salary, Payroll & Other Dues</h3>
                  </div>

                  {/* Section A: Monthly Salary Calculation Card */}
                  <div style={{ backgroundColor: '#F8FAFC', padding: 14, borderRadius: 12, border: '1px solid #E2E8F0' }}>
                    <h4 style={{ fontSize: 13, fontWeight: 800, color: '#1769E0', margin: '0 0 10px' }}>EMPLOYEE SALARY & PAYROLL STRUCTURE</h4>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
                      <div>
                        <label style={{ fontSize: 11, fontWeight: 700, color: '#475569', display: 'block', marginBottom: 4 }}>
                          Basic Salary (₹) <span style={{ color: '#DC2626' }}>*</span>
                        </label>
                        <input
                          type="number"
                          className="avm-input"
                          value={empBasicSalary}
                          onChange={(e) => setEmpBasicSalary(Number(e.target.value) || 0)}
                          placeholder="20000"
                        />
                      </div>

                      <div>
                        <label style={{ fontSize: 11, fontWeight: 700, color: '#475569', display: 'block', marginBottom: 4 }}>Allowances (₹)</label>
                        <input
                          type="number"
                          className="avm-input"
                          value={empAllowances}
                          onChange={(e) => setEmpAllowances(Number(e.target.value) || 0)}
                          placeholder="5000"
                        />
                      </div>

                      <div>
                        <label style={{ fontSize: 11, fontWeight: 700, color: '#475569', display: 'block', marginBottom: 4 }}>Deductions (₹)</label>
                        <input
                          type="number"
                          className="avm-input"
                          value={empDeduction}
                          onChange={(e) => setEmpDeduction(Number(e.target.value) || 0)}
                          placeholder="1000"
                        />
                      </div>

                      <div style={{ gridColumn: 'span 3', backgroundColor: '#EFF6FF', padding: 12, borderRadius: 10, border: '1px solid #BFDBFE', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                          <span style={{ fontSize: 12, color: '#1E40AF', fontWeight: 700 }}>Calculated Net Monthly Salary:</span>
                          <div style={{ fontSize: 20, fontWeight: 900, color: '#1769E0' }}>
                            ₹{Math.max(0, (empBasicSalary || 0) + (empAllowances || 0) - (empDeduction || 0)).toLocaleString('en-IN')}
                          </div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <span style={{ fontSize: 11, color: '#64748B' }}>Payment Frequency:</span>
                          <select
                            className="avm-select"
                            style={{ padding: '4px 8px', fontSize: 12 }}
                            value={empSalaryType}
                            onChange={(e) => setEmpSalaryType(e.target.value)}
                          >
                            <option value="Monthly">Monthly</option>
                            <option value="Weekly">Weekly</option>
                            <option value="Daily">Daily</option>
                            <option value="Other">Other</option>
                          </select>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Section B: Record Salary Payment */}
                  <div style={{ backgroundColor: '#F0FDF4', padding: 14, borderRadius: 12, border: '1px solid #BBF7D0' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                      <h4 style={{ fontSize: 13, fontWeight: 800, color: '#16A34A', margin: 0 }}>SALARY PAYMENT RECORDING</h4>
                      <button
                        type="button"
                        className="avm-btn-secondary"
                        style={{ fontSize: 11, padding: '4px 10px', backgroundColor: '#DCFCE7', color: '#15803D', border: '1px solid #86EFAC' }}
                        onClick={() => setEmpShowAddPayment(!empShowAddPayment)}
                      >
                        {empShowAddPayment ? 'Close Payment Box' : '+ Add Salary Payment'}
                      </button>
                    </div>

                    {empShowAddPayment && (
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 8 }}>
                        <div>
                          <label style={{ fontSize: 11, fontWeight: 700, color: '#0F172A', display: 'block', marginBottom: 4 }}>Payment Month</label>
                          <input
                            type="text"
                            className="avm-input"
                            value={empSalaryPaymentMonth}
                            onChange={(e) => setEmpSalaryPaymentMonth(e.target.value)}
                            placeholder="September 2026"
                          />
                        </div>

                        <div>
                          <label style={{ fontSize: 11, fontWeight: 700, color: '#0F172A', display: 'block', marginBottom: 4 }}>Paid Amount (₹)</label>
                          <input
                            type="number"
                            className="avm-input"
                            value={empPaidSalaryAmount}
                            onChange={(e) => setEmpPaidSalaryAmount(Number(e.target.value) || 0)}
                            placeholder="20000"
                          />
                        </div>

                        <div>
                          <label style={{ fontSize: 11, fontWeight: 700, color: '#0F172A', display: 'block', marginBottom: 4 }}>Payment Date</label>
                          <input
                            type="date"
                            className="avm-input"
                            value={empSalaryPaymentDate}
                            onChange={(e) => setEmpSalaryPaymentDate(e.target.value)}
                          />
                        </div>

                        <div>
                          <label style={{ fontSize: 11, fontWeight: 700, color: '#0F172A', display: 'block', marginBottom: 4 }}>Payment Mode</label>
                          <select className="avm-select" value={empPaymentMode} onChange={(e) => setEmpPaymentMode(e.target.value)}>
                            <option value="Cash">Cash</option>
                            <option value="Bank Transfer">Bank Transfer</option>
                            <option value="UPI">UPI</option>
                            <option value="Cheque">Cheque</option>
                            <option value="Other">Other</option>
                          </select>
                        </div>

                        <div style={{ gridColumn: 'span 2' }}>
                          <label style={{ fontSize: 11, fontWeight: 700, color: '#0F172A', display: 'block', marginBottom: 4 }}>Transaction ID / Ref Number</label>
                          <input
                            type="text"
                            className="avm-input"
                            value={empSalaryRefNo}
                            onChange={(e) => setEmpSalaryRefNo(e.target.value)}
                            placeholder="e.g. UPI/20260930/9871"
                          />
                        </div>

                        <button
                          type="button"
                          className="avm-btn-primary"
                          style={{ gridColumn: 'span 2', backgroundColor: '#16A34A' }}
                          onClick={() => {
                            const net = Math.max(0, (empBasicSalary || 0) + (empAllowances || 0) - (empDeduction || 0));
                            const paid = empPaidSalaryAmount;
                            const pend = Math.max(0, net - paid);
                            const rec = {
                              id: `PAY-${Date.now()}`,
                              month: empSalaryPaymentMonth || 'September 2026',
                              salaryDue: net,
                              paidAmount: paid,
                              pendingAmount: pend,
                              paymentDate: empSalaryPaymentDate,
                              paymentMode: empPaymentMode,
                              transactionId: empSalaryRefNo || 'N/A',
                              status: pend === 0 ? 'Paid' : paid > 0 ? 'Partially Paid' : 'Pending',
                              remarks: empSalaryRemarks
                            };
                            setEmpSalaryPaymentsList([...empSalaryPaymentsList, rec]);
                            setEmpShowAddPayment(false);
                          }}
                        >
                          Confirm & Add Salary Payment Record
                        </button>
                      </div>
                    )}

                    {/* Salary Payment History List */}
                    {empSalaryPaymentsList.length > 0 && (
                      <div style={{ marginTop: 12, overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
                          <thead>
                            <tr style={{ backgroundColor: '#DCFCE7', color: '#15803D', textAlign: 'left' }}>
                              <th style={{ padding: 6 }}>Month</th>
                              <th style={{ padding: 6 }}>Due</th>
                              <th style={{ padding: 6 }}>Paid</th>
                              <th style={{ padding: 6 }}>Pending</th>
                              <th style={{ padding: 6 }}>Mode</th>
                              <th style={{ padding: 6 }}>Status</th>
                            </tr>
                          </thead>
                          <tbody>
                            {empSalaryPaymentsList.map((p, i) => (
                              <tr key={i} style={{ borderBottom: '1px solid #E2E8F0' }}>
                                <td style={{ padding: 6, fontWeight: 700 }}>{p.month}</td>
                                <td style={{ padding: 6 }}>₹{p.salaryDue}</td>
                                <td style={{ padding: 6, color: '#16A34A', fontWeight: 800 }}>₹{p.paidAmount}</td>
                                <td style={{ padding: 6, color: '#DC2626', fontWeight: 800 }}>₹{p.pendingAmount}</td>
                                <td style={{ padding: 6 }}>{p.paymentMode}</td>
                                <td style={{ padding: 6, fontWeight: 800 }}>{p.status}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>

                  {/* Section C: Employee Dues / Other Charges */}
                  <div style={{ backgroundColor: '#FDF4FF', padding: 14, borderRadius: 12, border: '1px solid #F5D0FE' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                      <h4 style={{ fontSize: 13, fontWeight: 800, color: '#7C3AED', margin: 0 }}>EMPLOYEE DUES & CHARGES</h4>
                      <button
                        type="button"
                        className="avm-btn-secondary"
                        style={{ fontSize: 11, padding: '4px 10px', backgroundColor: '#F3E8FF', color: '#7C3AED', border: '1px solid #D8B4FE' }}
                        onClick={() => setEmpShowAddDue(!empShowAddDue)}
                      >
                        {empShowAddDue ? 'Close Due Box' : '+ Add Employee Due'}
                      </button>
                    </div>

                    {empShowAddDue && (
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 8 }}>
                        <div>
                          <label style={{ fontSize: 11, fontWeight: 700, color: '#0F172A', display: 'block', marginBottom: 4 }}>Due Type</label>
                          <select className="avm-select" value={dueTypeInput} onChange={(e) => setDueTypeInput(e.target.value)}>
                            <option value="Uniform">Uniform</option>
                            <option value="ID Card">ID Card</option>
                            <option value="Transport">Transport</option>
                            <option value="Advance">Advance</option>
                            <option value="Loan">Loan</option>
                            <option value="Fine">Fine</option>
                            <option value="Other">Other</option>
                          </select>
                        </div>

                        <div>
                          <label style={{ fontSize: 11, fontWeight: 700, color: '#0F172A', display: 'block', marginBottom: 4 }}>Total Amount (₹)</label>
                          <input
                            type="number"
                            className="avm-input"
                            value={dueAmountInput}
                            onChange={(e) => setDueAmountInput(Number(e.target.value) || '')}
                            placeholder="700"
                          />
                        </div>

                        <div>
                          <label style={{ fontSize: 11, fontWeight: 700, color: '#0F172A', display: 'block', marginBottom: 4 }}>Paid Amount (₹)</label>
                          <input
                            type="number"
                            className="avm-input"
                            value={duePaidInput}
                            onChange={(e) => setDuePaidInput(Number(e.target.value) || '')}
                            placeholder="500"
                          />
                        </div>

                        <div>
                          <label style={{ fontSize: 11, fontWeight: 700, color: '#0F172A', display: 'block', marginBottom: 4 }}>Due Date</label>
                          <input
                            type="date"
                            className="avm-input"
                            value={dueDateInput}
                            onChange={(e) => setDueDateInput(e.target.value)}
                          />
                        </div>

                        <div style={{ gridColumn: 'span 2' }}>
                          <label style={{ fontSize: 11, fontWeight: 700, color: '#0F172A', display: 'block', marginBottom: 4 }}>Description / Remarks</label>
                          <input
                            type="text"
                            className="avm-input"
                            value={dueRemarksInput}
                            onChange={(e) => setDueRemarksInput(e.target.value)}
                            placeholder="e.g. Uniform Set Charge"
                          />
                        </div>

                        <button
                          type="button"
                          className="avm-btn-primary"
                          style={{ gridColumn: 'span 2', backgroundColor: '#7C3AED' }}
                          onClick={() => {
                            const tot = Number(dueAmountInput) || 0;
                            const pd = Number(duePaidInput) || 0;
                            const pend = Math.max(0, tot - pd);
                            const newDue = {
                              id: `DUE-${Date.now()}`,
                              dueType: dueTypeInput,
                              description: dueDescInput || `${dueTypeInput} Charge`,
                              amount: tot,
                              dueDate: dueDateInput,
                              paidAmount: pd,
                              pendingAmount: pend,
                              status: pend === 0 ? 'Paid' : pd > 0 ? 'Partial' : 'Pending',
                              remarks: dueRemarksInput
                            };
                            setEmpDues([...empDues, newDue]);
                            setEmpShowAddDue(false);
                            setDueAmountInput('');
                            setDuePaidInput(0);
                            setDueRemarksInput('');
                          }}
                        >
                          Save Employee Due Record
                        </button>
                      </div>
                    )}

                    {/* Dues List */}
                    {empDues.length > 0 && (
                      <div style={{ marginTop: 12, overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
                          <thead>
                            <tr style={{ backgroundColor: '#F3E8FF', color: '#7C3AED', textAlign: 'left' }}>
                              <th style={{ padding: 6 }}>Type</th>
                              <th style={{ padding: 6 }}>Amount</th>
                              <th style={{ padding: 6 }}>Paid</th>
                              <th style={{ padding: 6 }}>Pending</th>
                              <th style={{ padding: 6 }}>Status</th>
                            </tr>
                          </thead>
                          <tbody>
                            {empDues.map((d, i) => (
                              <tr key={i} style={{ borderBottom: '1px solid #E2E8F0' }}>
                                <td style={{ padding: 6, fontWeight: 700 }}>{d.dueType}</td>
                                <td style={{ padding: 6 }}>₹{d.amount}</td>
                                <td style={{ padding: 6, color: '#16A34A', fontWeight: 800 }}>₹{d.paidAmount}</td>
                                <td style={{ padding: 6, color: '#DC2626', fontWeight: 800 }}>₹{d.pendingAmount}</td>
                                <td style={{ padding: 6, fontWeight: 800 }}>{d.status}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Bottom Fixed Modal Action Bar */}
            <div style={{ display: 'flex', gap: 10, marginTop: 8, paddingTop: 10, borderTop: '1px solid #E2E8F0', flexShrink: 0 }}>
              <button
                type="button"
                className="avm-btn-secondary"
                style={{ flex: 1 }}
                onClick={() => { setAddTeacherModalOpen(false); setEditTeacher(null); }}
              >
                Cancel
              </button>

              {empFormTab !== 'personal' && (
                <button
                  type="button"
                  className="avm-btn-secondary"
                  style={{ flex: 1 }}
                  onClick={() => {
                    const tabs = ['personal', 'professional', 'academic', 'parents', 'address', 'documents', 'account', 'transport', 'salary'];
                    const idx = tabs.indexOf(empFormTab);
                    if (idx > 0) setEmpFormTab(tabs[idx - 1] as any);
                  }}
                >
                  Previous
                </button>
              )}

              {empFormTab !== 'salary' ? (
                <button
                  type="button"
                  className="avm-btn-primary"
                  style={{ flex: 1 }}
                  onClick={() => {
                    const tabs = ['personal', 'professional', 'academic', 'parents', 'address', 'documents', 'account', 'transport', 'salary'];
                    const idx = tabs.indexOf(empFormTab);
                    if (idx < tabs.length - 1) setEmpFormTab(tabs[idx + 1] as any);
                  }}
                >
                  Next Step
                </button>
              ) : (
                <button type="submit" className="avm-btn-primary" style={{ flex: 1.5, backgroundColor: '#16A34A' }}>
                  {editTeacher ? 'Update Employee Record' : 'Save & Register Employee'}
                </button>
              )}
            </div>
          </form>
        </Modal>
      )}

      {/* VIEW STUDENT PROFILE MODAL (COMPLETE PROFILE DETAILS) */}
      {viewStudent && (
        <Modal isOpen={!!viewStudent} onClose={() => setViewStudent(null)} title="Student Profile Details">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16, maxHeight: '75vh', overflowY: 'auto', paddingRight: 4 }}>
            {/* Top Header Card */}
            <div style={{ display: 'flex', gap: 16, alignItems: 'center', backgroundColor: '#EFF6FF', padding: 16, borderRadius: 16, border: '1px solid #BFDBFE' }}>
              <img
                src={viewStudent.photo || 'https://images.unsplash.com/photo-1544717305-2782549b5136?w=150'}
                alt={viewStudent.name}
                style={{ width: 72, height: 72, borderRadius: '50%', objectFit: 'cover', border: '3px solid #FFFFFF', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}
              />
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <h3 style={{ fontSize: 20, fontWeight: 900, color: '#0F172A', margin: 0 }}>{viewStudent.name || 'Not provided'}</h3>
                  <span style={{
                    backgroundColor: (viewStudent.status || 'Active') === 'Active' ? '#DCFCE7' : '#FEE2E2',
                    color: (viewStudent.status || 'Active') === 'Active' ? '#15803D' : '#B91C1C',
                    padding: '3px 10px',
                    borderRadius: 12,
                    fontSize: 11,
                    fontWeight: 800
                  }}>
                    {viewStudent.status || 'Active'}
                  </span>
                </div>
                <div style={{ fontSize: 13, color: '#1769E0', fontWeight: 800, marginTop: 4 }}>
                  Admission No: {viewStudent.admissionNo || 'Not provided'} • Roll No: {viewStudent.rollNo || 'Not provided'}
                </div>
                <div style={{ fontSize: 12, color: '#475569', fontWeight: 600, marginTop: 2 }}>
                  Class: {classService.formatClassDisplay(viewStudent.className, viewStudent.section)}
                </div>
              </div>
            </div>

            {/* SECTION A: Student Information */}
            <div style={{ backgroundColor: '#F8FAFC', padding: 14, borderRadius: 12, border: '1px solid #E2E8F0' }}>
              <h4 style={{ fontSize: 13, fontWeight: 800, color: '#1769E0', margin: '0 0 10px', display: 'flex', alignItems: 'center', gap: 6 }}>
                <User size={15} /> A. Student Personal Information
              </h4>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, fontSize: 12 }}>
                <div>
                  <span style={{ color: '#64748B', fontSize: 11, display: 'block' }}>Student ID:</span>
                  <span style={{ fontWeight: 700, color: '#0F172A' }}>{viewStudent.id || 'Not provided'}</span>
                </div>
                <div>
                  <span style={{ color: '#64748B', fontSize: 11, display: 'block' }}>Admission No (Permanent):</span>
                  <span style={{ fontWeight: 700, color: '#0F172A' }}>{viewStudent.admissionNo || 'Not provided'}</span>
                </div>
                <div>
                  <span style={{ color: '#64748B', fontSize: 11, display: 'block' }}>Date of Birth:</span>
                  <span style={{ fontWeight: 700, color: '#0F172A' }}>{viewStudent.dob || 'Not provided'}</span>
                </div>
                <div>
                  <span style={{ color: '#64748B', fontSize: 11, display: 'block' }}>Gender & Blood Group:</span>
                  <span style={{ fontWeight: 700, color: '#0F172A' }}>{viewStudent.gender || 'Not provided'} ({viewStudent.bloodGroup || 'Not provided'})</span>
                </div>
                <div>
                  <span style={{ color: '#64748B', fontSize: 11, display: 'block' }}>Admission Date:</span>
                  <span style={{ fontWeight: 700, color: '#0F172A' }}>{viewStudent.admissionDate || 'Not provided'}</span>
                </div>
                <div>
                  <span style={{ color: '#64748B', fontSize: 11, display: 'block' }}>Category & Nationality:</span>
                  <span style={{ fontWeight: 700, color: '#0F172A' }}>{viewStudent.category || 'General'} ({viewStudent.nationality || 'Indian'})</span>
                </div>
              </div>
            </div>

            {/* SECTION B: Parent / Guardian Information */}
            <div style={{ backgroundColor: '#F8FAFC', padding: 14, borderRadius: 12, border: '1px solid #E2E8F0' }}>
              <h4 style={{ fontSize: 13, fontWeight: 800, color: '#1769E0', margin: '0 0 10px', display: 'flex', alignItems: 'center', gap: 6 }}>
                <Users size={15} /> B. Parent / Guardian Information
              </h4>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, fontSize: 12 }}>
                <div>
                  <span style={{ color: '#64748B', fontSize: 11, display: 'block' }}>Father's Name:</span>
                  <span style={{ fontWeight: 700, color: '#0F172A' }}>{viewStudent.fatherName || 'Not provided'}</span>
                </div>
                <div>
                  <span style={{ color: '#64748B', fontSize: 11, display: 'block' }}>Mother's Name:</span>
                  <span style={{ fontWeight: 700, color: '#0F172A' }}>{viewStudent.motherName || 'Not provided'}</span>
                </div>
                <div>
                  <span style={{ color: '#64748B', fontSize: 11, display: 'block' }}>Guardian Name:</span>
                  <span style={{ fontWeight: 700, color: '#0F172A' }}>{viewStudent.guardianName || viewStudent.fatherName || 'Not provided'}</span>
                </div>
                <div>
                  <span style={{ color: '#64748B', fontSize: 11, display: 'block' }}>Guardian Phone:</span>
                  <span style={{ fontWeight: 800, color: '#1769E0' }}>{viewStudent.phone || 'Not provided'}</span>
                </div>
                <div>
                  <span style={{ color: '#64748B', fontSize: 11, display: 'block' }}>Alternate Phone:</span>
                  <span style={{ fontWeight: 700, color: '#0F172A' }}>{viewStudent.altPhone || 'Not provided'}</span>
                </div>
                <div>
                  <span style={{ color: '#64748B', fontSize: 11, display: 'block' }}>Guardian Email:</span>
                  <span style={{ fontWeight: 700, color: '#0F172A' }}>{viewStudent.email || 'Not provided'}</span>
                </div>
              </div>
            </div>

            {/* SECTION C: Address */}
            <div style={{ backgroundColor: '#F8FAFC', padding: 14, borderRadius: 12, border: '1px solid #E2E8F0' }}>
              <h4 style={{ fontSize: 13, fontWeight: 800, color: '#1769E0', margin: '0 0 10px', display: 'flex', alignItems: 'center', gap: 6 }}>
                <MapPin size={15} /> C. Address Details
              </h4>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, fontSize: 12 }}>
                <div style={{ gridColumn: '1 / -1' }}>
                  <span style={{ color: '#64748B', fontSize: 11, display: 'block' }}>Full Address:</span>
                  <span style={{ fontWeight: 700, color: '#0F172A' }}>{viewStudent.address || 'Not provided'}</span>
                </div>
                <div>
                  <span style={{ color: '#64748B', fontSize: 11, display: 'block' }}>City / Village:</span>
                  <span style={{ fontWeight: 700, color: '#0F172A' }}>{viewStudent.city || 'Not provided'}</span>
                </div>
                <div>
                  <span style={{ color: '#64748B', fontSize: 11, display: 'block' }}>District:</span>
                  <span style={{ fontWeight: 700, color: '#0F172A' }}>{viewStudent.district || 'Not provided'}</span>
                </div>
                <div>
                  <span style={{ color: '#64748B', fontSize: 11, display: 'block' }}>State:</span>
                  <span style={{ fontWeight: 700, color: '#0F172A' }}>{viewStudent.state || 'Not provided'}</span>
                </div>
                <div>
                  <span style={{ color: '#64748B', fontSize: 11, display: 'block' }}>PIN Code:</span>
                  <span style={{ fontWeight: 700, color: '#0F172A' }}>{viewStudent.pinCode || 'Not provided'}</span>
                </div>
              </div>
            </div>

            {/* SECTION D: Academic Information */}
            <div style={{ backgroundColor: '#F8FAFC', padding: 14, borderRadius: 12, border: '1px solid #E2E8F0' }}>
              <h4 style={{ fontSize: 13, fontWeight: 800, color: '#1769E0', margin: '0 0 10px', display: 'flex', alignItems: 'center', gap: 6 }}>
                <GraduationCap size={15} /> D. Academic Information ({selectedSessionId})
              </h4>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, fontSize: 12 }}>
                <div>
                  <span style={{ color: '#64748B', fontSize: 11, display: 'block' }}>Academic Session:</span>
                  <span style={{ fontWeight: 800, color: '#1769E0' }}>{selectedSessionId}</span>
                </div>
                <div>
                  <span style={{ color: '#64748B', fontSize: 11, display: 'block' }}>Class & Section:</span>
                  <span style={{ fontWeight: 800, color: '#0F172A' }}>{classService.formatClassDisplay(viewStudent.className, viewStudent.section)}</span>
                </div>
                <div>
                  <span style={{ color: '#64748B', fontSize: 11, display: 'block' }}>Roll Number:</span>
                  <span style={{ fontWeight: 800, color: '#0F172A' }}>{viewStudent.rollNo || 'Not provided'}</span>
                </div>
                <div>
                  <span style={{ color: '#64748B', fontSize: 11, display: 'block' }}>Previous School:</span>
                  <span style={{ fontWeight: 700, color: '#0F172A' }}>{viewStudent.previousSchool || 'Not provided'}</span>
                </div>
              </div>
            </div>

            {/* SECTION E: Login Information */}
            <div style={{ backgroundColor: '#F8FAFC', padding: 14, borderRadius: 12, border: '1px solid #E2E8F0' }}>
              <h4 style={{ fontSize: 13, fontWeight: 800, color: '#1769E0', margin: '0 0 10px', display: 'flex', alignItems: 'center', gap: 6 }}>
                <Lock size={15} /> E. Mobile App Login Information
              </h4>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, fontSize: 12 }}>
                <div>
                  <span style={{ color: '#64748B', fontSize: 11, display: 'block' }}>Username / Login ID:</span>
                  <span style={{ fontWeight: 800, color: '#0F172A' }}>{viewStudent.admissionNo || viewStudent.phone || 'Not provided'}</span>
                </div>
                <div>
                  <span style={{ color: '#64748B', fontSize: 11, display: 'block' }}>Account Status:</span>
                  <span style={{ fontWeight: 800, color: '#16A34A' }}>Active / Mobile Access Enabled</span>
                </div>
              </div>
            </div>

            {/* SECTION F: Transport Information */}
            {(() => {
              const transAssign = transportService.getAssignments().find(a => a.studentId === viewStudent.id || a.admissionNo === viewStudent.admissionNo);
              const busInfo = transAssign ? transportService.getBuses().find(b => b.id === transAssign.busId) : null;
              return (
                <div style={{ backgroundColor: '#F8FAFC', padding: 14, borderRadius: 12, border: '1px solid #E2E8F0' }}>
                  <h4 style={{ fontSize: 13, fontWeight: 800, color: '#1769E0', margin: '0 0 10px', display: 'flex', alignItems: 'center', gap: 6 }}>
                    <BusIcon size={15} /> F. Transport Information
                  </h4>
                  {transAssign && transAssign.status === 'Active' ? (
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, fontSize: 12 }}>
                      <div>
                        <span style={{ color: '#64748B', fontSize: 11, display: 'block' }}>Bus Number:</span>
                        <span style={{ fontWeight: 800, color: '#0F172A' }}>{busInfo ? (busInfo.busNo || busInfo.busNumber) : 'Assigned'}</span>
                      </div>
                      <div>
                        <span style={{ color: '#64748B', fontSize: 11, display: 'block' }}>Vehicle No:</span>
                        <span style={{ fontWeight: 800, color: '#0F172A' }}>{busInfo ? (busInfo.vehicleNo || busInfo.vehicleNumber) : '-'}</span>
                      </div>
                      <div>
                        <span style={{ color: '#64748B', fontSize: 11, display: 'block' }}>Route:</span>
                        <span style={{ fontWeight: 700, color: '#1769E0' }}>{busInfo ? (busInfo.routeName || busInfo.routeArea) : '-'}</span>
                      </div>
                      <div>
                        <span style={{ color: '#64748B', fontSize: 11, display: 'block' }}>Pickup Stop & Time:</span>
                        <span style={{ fontWeight: 700, color: '#0F172A' }}>{transAssign.pickupStop} ({transAssign.pickupTime})</span>
                      </div>
                      <div>
                        <span style={{ color: '#64748B', fontSize: 11, display: 'block' }}>Village / Area:</span>
                        <span style={{ fontWeight: 700, color: '#0F172A' }}>{transAssign.village}</span>
                      </div>
                      <div>
                        <span style={{ color: '#64748B', fontSize: 11, display: 'block' }}>Monthly Transport Fee:</span>
                        <span style={{ fontWeight: 800, color: '#16A34A' }}>₹{transAssign.monthlyFee}</span>
                      </div>
                    </div>
                  ) : (
                    <div style={{ fontSize: 12, color: '#64748B' }}>
                      No school bus transport assigned. Student commutes independently.
                    </div>
                  )}
                </div>
              );
            })()}

            {/* SECTION G: Fee & Payment Summary */}
            {(() => {
              const feeRec = feeService.getFeeRecordByStudentId(viewStudent.id, selectedSessionId);
              const tuition = feeRec?.feeStructure?.find(f => f.name.toLowerCase().includes('tuition'))?.amount || 1500;
              const transport = feeRec?.feeStructure?.find(f => f.name.toLowerCase().includes('transport'))?.amount || 0;
              const other = feeRec?.feeStructure?.find(f => f.name.toLowerCase().includes('other'))?.amount || 0;
              const total = feeRec?.totalFee || (tuition + transport + other);
              const paid = feeRec?.paidFee || 0;
              const pending = feeRec?.pendingFee || Math.max(0, total - paid);
              const status = feeRec?.status || (paid >= total && total > 0 ? 'Paid' : paid > 0 ? 'Partial' : 'Pending');

              let badgeStyle = { bg: '#FEF3C7', color: '#D97706' };
              if (status === 'Paid') badgeStyle = { bg: '#DCFCE7', color: '#15803D' };
              if (status === 'Pending') badgeStyle = { bg: '#FEE2E2', color: '#B91C1C' };

              return (
                <div style={{ backgroundColor: '#F8FAFC', padding: 14, borderRadius: 12, border: '1px solid #E2E8F0' }}>
                  <h4 style={{ fontSize: 13, fontWeight: 800, color: '#1769E0', margin: '0 0 10px', display: 'flex', alignItems: 'center', gap: 6 }}>
                    <CreditCard size={15} /> G. Fees & Payment Summary ({selectedSessionId})
                  </h4>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, fontSize: 12 }}>
                    <div>
                      <span style={{ color: '#64748B', fontSize: 11, display: 'block' }}>Tuition Fee:</span>
                      <span style={{ fontWeight: 700, color: '#0F172A' }}>₹{tuition}</span>
                    </div>
                    <div>
                      <span style={{ color: '#64748B', fontSize: 11, display: 'block' }}>Transport Fee:</span>
                      <span style={{ fontWeight: 700, color: '#0F172A' }}>₹{transport}</span>
                    </div>
                    <div>
                      <span style={{ color: '#64748B', fontSize: 11, display: 'block' }}>Monthly Total Fee:</span>
                      <span style={{ fontWeight: 900, color: '#1769E0' }}>₹{total}</span>
                    </div>
                    <div>
                      <span style={{ color: '#64748B', fontSize: 11, display: 'block' }}>Payment Status:</span>
                      <span style={{
                        display: 'inline-block',
                        padding: '2px 8px',
                        borderRadius: 6,
                        backgroundColor: badgeStyle.bg,
                        color: badgeStyle.color,
                        fontWeight: 800,
                        fontSize: 11
                      }}>
                        {status} (Paid ₹{paid} / Pending ₹{pending})
                      </span>
                    </div>
                  </div>
                </div>
              );
            })()}

            <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
              <button
                type="button"
                className="avm-btn-secondary"
                style={{ flex: 1 }}
                onClick={() => setViewStudent(null)}
              >
                Close Profile
              </button>
              <button
                type="button"
                className="avm-btn-primary"
                style={{ flex: 1 }}
                onClick={() => {
                  const s = viewStudent;
                  setViewStudent(null);
                  openEditStudentModal(s);
                }}
              >
                Edit Student Profile
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* ========================================================================= */}
      {/* VIEW TEACHER / EMPLOYEE ERP PROFILE MODAL (10 INTERACTIVE TABS) */}
      {/* ========================================================================= */}
      {viewTeacher && (
        <Modal isOpen={!!viewTeacher} onClose={() => setViewTeacher(null)} title={`Employee Profile: ${viewTeacher.name} (${viewTeacher.employeeId || 'EMP'})`}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14, maxHeight: '82vh' }}>
            {/* Top Employee Card */}
            <div style={{ display: 'flex', gap: 16, alignItems: 'center', backgroundColor: '#F0FDFA', padding: 14, borderRadius: 16, border: '1px solid #99F6E4', flexShrink: 0 }}>
              <img
                src={viewTeacher.photo || 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150'}
                alt={viewTeacher.name}
                style={{ width: 68, height: 68, borderRadius: '50%', objectFit: 'cover', border: '3px solid #FFFFFF', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}
              />
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <h3 style={{ fontSize: 18, fontWeight: 900, color: '#0F172A', margin: 0 }}>{viewTeacher.name}</h3>
                  <span style={{
                    backgroundColor: (viewTeacher.status || 'Active') === 'Active' ? '#DCFCE7' : '#FEE2E2',
                    color: (viewTeacher.status || 'Active') === 'Active' ? '#15803D' : '#B91C1C',
                    padding: '3px 10px',
                    borderRadius: 12,
                    fontSize: 11,
                    fontWeight: 800
                  }}>
                    {viewTeacher.status || 'Active'}
                  </span>
                </div>
                <div style={{ fontSize: 12, color: '#0D9488', fontWeight: 800, marginTop: 4 }}>
                  ID: {viewTeacher.employeeId} • {viewTeacher.designation || 'Teacher'} ({viewTeacher.department || 'Academic'})
                </div>
                <div style={{ fontSize: 11, color: '#64748B', marginTop: 2 }}>
                  Mobile: <strong>{viewTeacher.phone}</strong> • Email: <strong>{viewTeacher.email || 'N/A'}</strong>
                </div>
              </div>
            </div>

            {/* 10-Tab Bar */}
            <div style={{ display: 'flex', gap: 4, backgroundColor: '#F1F5F9', padding: 4, borderRadius: 12, overflowX: 'auto', flexShrink: 0 }}>
              {[
                { id: 'overview', label: 'Overview' },
                { id: 'personal', label: 'Personal' },
                { id: 'professional', label: 'Professional' },
                { id: 'academic', label: 'Academic & Teaching' },
                { id: 'parents', label: 'Parents' },
                { id: 'address', label: 'Address' },
                { id: 'documents', label: 'Documents' },
                { id: 'account', label: 'Account' },
                { id: 'transport', label: 'Transport' },
                { id: 'salary', label: 'Salary & Payments' }
              ].map((tb) => (
                <button
                  key={tb.id}
                  type="button"
                  onClick={() => setViewTeacherProfileTab(tb.id as any)}
                  style={{
                    flexShrink: 0,
                    padding: '6px 12px',
                    borderRadius: 8,
                    border: 'none',
                    backgroundColor: viewTeacherProfileTab === tb.id ? '#FFFFFF' : 'transparent',
                    color: viewTeacherProfileTab === tb.id ? '#1769E0' : '#64748B',
                    fontWeight: viewTeacherProfileTab === tb.id ? 800 : 600,
                    fontSize: 11,
                    cursor: 'pointer',
                    boxShadow: viewTeacherProfileTab === tb.id ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                    whiteSpace: 'nowrap'
                  }}
                >
                  {tb.label}
                </button>
              ))}
            </div>

            {/* Scrollable Body */}
            <div style={{ flex: 1, overflowY: 'auto', paddingRight: 4, display: 'flex', flexDirection: 'column', gap: 14 }}>
              {/* TAB 1: OVERVIEW */}
              {viewTeacherProfileTab === 'overview' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  {/* KPI Cards Grid */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
                    <div style={{ backgroundColor: '#EFF6FF', padding: 10, borderRadius: 10, border: '1px solid #BFDBFE' }}>
                      <span style={{ fontSize: 10, fontWeight: 700, color: '#1E40AF', textTransform: 'uppercase' }}>Employee ID</span>
                      <div style={{ fontSize: 15, fontWeight: 900, color: '#1769E0', marginTop: 2 }}>{viewTeacher.employeeId}</div>
                    </div>
                    <div style={{ backgroundColor: '#F0FDFA', padding: 10, borderRadius: 10, border: '1px solid #99F6E4' }}>
                      <span style={{ fontSize: 10, fontWeight: 700, color: '#0F766E', textTransform: 'uppercase' }}>Designation</span>
                      <div style={{ fontSize: 14, fontWeight: 900, color: '#0D9488', marginTop: 2 }}>{viewTeacher.designation}</div>
                    </div>
                    <div style={{ backgroundColor: '#F5F3FF', padding: 10, borderRadius: 10, border: '1px solid #DDD6FE' }}>
                      <span style={{ fontSize: 10, fontWeight: 700, color: '#6D28D9', textTransform: 'uppercase' }}>Department</span>
                      <div style={{ fontSize: 14, fontWeight: 900, color: '#7C3AED', marginTop: 2 }}>{viewTeacher.department || 'Academic'}</div>
                    </div>
                    <div style={{ backgroundColor: '#FEF3C7', padding: 10, borderRadius: 10, border: '1px solid #FDE68A' }}>
                      <span style={{ fontSize: 10, fontWeight: 700, color: '#92400E', textTransform: 'uppercase' }}>Joining Date</span>
                      <div style={{ fontSize: 13, fontWeight: 800, color: '#D97706', marginTop: 2 }}>{viewTeacher.joinDate || 'N/A'}</div>
                    </div>
                    <div style={{ backgroundColor: '#DCFCE7', padding: 10, borderRadius: 10, border: '1px solid #86EFAC' }}>
                      <span style={{ fontSize: 10, fontWeight: 700, color: '#15803D', textTransform: 'uppercase' }}>Status</span>
                      <div style={{ fontSize: 13, fontWeight: 900, color: '#16A34A', marginTop: 2 }}>{viewTeacher.status || 'Active'}</div>
                    </div>
                    <div style={{ backgroundColor: '#E0F2FE', padding: 10, borderRadius: 10, border: '1px solid #BAE6FD' }}>
                      <span style={{ fontSize: 10, fontWeight: 700, color: '#0369A1', textTransform: 'uppercase' }}>Class Teacher</span>
                      <div style={{ fontSize: 13, fontWeight: 800, color: '#0284C7', marginTop: 2 }}>
                        {viewTeacher.isClassTeacher === 'Yes' ? `${viewTeacher.classTeacherClass || 'Class 5'}-${viewTeacher.classTeacherSection || 'A'}` : 'No'}
                      </div>
                    </div>
                    <div style={{ backgroundColor: '#FDF4FF', padding: 10, borderRadius: 10, border: '1px solid #F5D0FE' }}>
                      <span style={{ fontSize: 10, fontWeight: 700, color: '#7E22CE', textTransform: 'uppercase' }}>Transport</span>
                      <div style={{ fontSize: 13, fontWeight: 800, color: '#A855F7', marginTop: 2 }}>
                        {viewTeacher.transportReq === 'Yes' ? (viewTeacher.transportRoute || 'School Bus') : 'None'}
                      </div>
                    </div>
                    <div style={{ backgroundColor: '#ECFDF5', padding: 10, borderRadius: 10, border: '1px solid #A7F3D0' }}>
                      <span style={{ fontSize: 10, fontWeight: 700, color: '#047857', textTransform: 'uppercase' }}>Monthly Salary</span>
                      <div style={{ fontSize: 15, fontWeight: 900, color: '#059669', marginTop: 2 }}>
                        ₹{(viewTeacher.netSalary || viewTeacher.basicSalary || 25000).toLocaleString('en-IN')}
                      </div>
                    </div>
                    <div style={{ backgroundColor: '#FEF2F2', padding: 10, borderRadius: 10, border: '1px solid #FECACA' }}>
                      <span style={{ fontSize: 10, fontWeight: 700, color: '#B91C1C', textTransform: 'uppercase' }}>Current Due</span>
                      <div style={{ fontSize: 15, fontWeight: 900, color: '#DC2626', marginTop: 2 }}>
                        ₹{(viewTeacher.pendingSalary ?? 5000).toLocaleString('en-IN')}
                      </div>
                    </div>
                  </div>

                  {/* Quick Summary Box */}
                  <div style={{ backgroundColor: '#F8FAFC', padding: 12, borderRadius: 12, border: '1px solid #E2E8F0', fontSize: 12 }}>
                    <div style={{ fontWeight: 800, color: '#0F172A', marginBottom: 6 }}>Key ERP Summary:</div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, color: '#475569' }}>
                      <div>Qualification: <strong>{viewTeacher.qualification || 'B.Ed'}</strong></div>
                      <div>Primary Subject: <strong>{viewTeacher.subject || 'Mathematics'}</strong></div>
                      <div>Teaching Classes: <strong>{(viewTeacher.assignedClasses || ['Class 5-A']).join(', ')}</strong></div>
                      <div>Teaching Subjects: <strong>{(viewTeacher.teachingSubjects || ['Mathematics', 'Science']).join(', ')}</strong></div>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: PERSONAL */}
              {viewTeacherProfileTab === 'personal' && (
                <div style={{ backgroundColor: '#F8FAFC', padding: 14, borderRadius: 12, border: '1px solid #E2E8F0', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, fontSize: 12 }}>
                  <div><span style={{ color: '#64748B', display: 'block', fontSize: 11 }}>Full Name:</span> <strong>{viewTeacher.name}</strong></div>
                  <div><span style={{ color: '#64748B', display: 'block', fontSize: 11 }}>Employee ID:</span> <strong>{viewTeacher.employeeId}</strong></div>
                  <div><span style={{ color: '#64748B', display: 'block', fontSize: 11 }}>Date of Birth:</span> <strong>{viewTeacher.dob || '1990-05-20'}</strong></div>
                  <div><span style={{ color: '#64748B', display: 'block', fontSize: 11 }}>Gender:</span> <strong>{viewTeacher.gender || 'Female'}</strong></div>
                  <div><span style={{ color: '#64748B', display: 'block', fontSize: 11 }}>Blood Group:</span> <strong>{viewTeacher.bloodGroup || 'B+'}</strong></div>
                  <div><span style={{ color: '#64748B', display: 'block', fontSize: 11 }}>Category:</span> <strong>{viewTeacher.category || 'General'}</strong></div>
                  <div><span style={{ color: '#64748B', display: 'block', fontSize: 11 }}>Nationality:</span> <strong>{viewTeacher.nationality || 'Indian'}</strong></div>
                  <div><span style={{ color: '#64748B', display: 'block', fontSize: 11 }}>Aadhaar Number:</span> <strong>{viewTeacher.aadhaar || 'N/A'}</strong></div>
                  <div><span style={{ color: '#64748B', display: 'block', fontSize: 11 }}>PAN Number:</span> <strong>{viewTeacher.panNumber || 'N/A'}</strong></div>
                  <div><span style={{ color: '#64748B', display: 'block', fontSize: 11 }}>Mobile Number:</span> <strong>{viewTeacher.phone}</strong></div>
                  <div><span style={{ color: '#64748B', display: 'block', fontSize: 11 }}>Alternate Mobile:</span> <strong>{viewTeacher.altPhone || 'N/A'}</strong></div>
                  <div><span style={{ color: '#64748B', display: 'block', fontSize: 11 }}>Email Address:</span> <strong>{viewTeacher.email || 'N/A'}</strong></div>
                </div>
              )}

              {/* TAB 3: PROFESSIONAL */}
              {viewTeacherProfileTab === 'professional' && (
                <div style={{ backgroundColor: '#F8FAFC', padding: 14, borderRadius: 12, border: '1px solid #E2E8F0', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, fontSize: 12 }}>
                  <div><span style={{ color: '#64748B', display: 'block', fontSize: 11 }}>Designation:</span> <strong>{viewTeacher.designation}</strong></div>
                  <div><span style={{ color: '#64748B', display: 'block', fontSize: 11 }}>Department:</span> <strong>{viewTeacher.department || 'Academic'}</strong></div>
                  <div><span style={{ color: '#64748B', display: 'block', fontSize: 11 }}>Date of Joining:</span> <strong>{viewTeacher.joinDate}</strong></div>
                  <div><span style={{ color: '#64748B', display: 'block', fontSize: 11 }}>Employment Type:</span> <strong>{viewTeacher.employmentType || 'Permanent'}</strong></div>
                  <div><span style={{ color: '#64748B', display: 'block', fontSize: 11 }}>Work Status:</span> <strong>{viewTeacher.status || 'Active'}</strong></div>
                  <div><span style={{ color: '#64748B', display: 'block', fontSize: 11 }}>Overall Experience:</span> <strong>{viewTeacher.experience || '3 Years'}</strong></div>
                  <div><span style={{ color: '#64748B', display: 'block', fontSize: 11 }}>Previous Organization:</span> <strong>{viewTeacher.prevSchool || 'N/A'}</strong></div>
                  <div><span style={{ color: '#64748B', display: 'block', fontSize: 11 }}>Previous Designation:</span> <strong>{viewTeacher.prevDesignation || 'N/A'}</strong></div>
                  <div><span style={{ color: '#64748B', display: 'block', fontSize: 11 }}>UAN Code:</span> <strong>{viewTeacher.uanCode || 'N/A'}</strong></div>
                  <div><span style={{ color: '#64748B', display: 'block', fontSize: 11 }}>ESI Number:</span> <strong>{viewTeacher.esiNumber || 'N/A'}</strong></div>
                  <div><span style={{ color: '#64748B', display: 'block', fontSize: 11 }}>PF Number:</span> <strong>{viewTeacher.pfNumber || 'N/A'}</strong></div>
                </div>
              )}

              {/* TAB 4: ACADEMIC & TEACHING */}
              {viewTeacherProfileTab === 'academic' && (
                <div style={{ backgroundColor: '#F8FAFC', padding: 14, borderRadius: 12, border: '1px solid #E2E8F0', display: 'flex', flexDirection: 'column', gap: 10, fontSize: 12 }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                    <div><span style={{ color: '#64748B', display: 'block', fontSize: 11 }}>Highest Qualification:</span> <strong>{viewTeacher.qualification || 'B.Ed'}</strong></div>
                    <div><span style={{ color: '#64748B', display: 'block', fontSize: 11 }}>Professional Qualification:</span> <strong>{viewTeacher.profQual || 'B.Ed'}</strong></div>
                    <div><span style={{ color: '#64748B', display: 'block', fontSize: 11 }}>Specialization:</span> <strong>{viewTeacher.specialization || 'Mathematics'}</strong></div>
                    <div><span style={{ color: '#64748B', display: 'block', fontSize: 11 }}>Teaching Medium:</span> <strong>{viewTeacher.medium || 'Hindi + English'}</strong></div>
                  </div>

                  <div style={{ backgroundColor: '#EFF6FF', padding: 10, borderRadius: 10, border: '1px solid #BFDBFE' }}>
                    <span style={{ color: '#1E40AF', fontWeight: 800, fontSize: 12 }}>Class Teacher Status:</span>
                    <div style={{ fontSize: 13, fontWeight: 900, color: '#1769E0', marginTop: 2 }}>
                      {viewTeacher.isClassTeacher === 'Yes' ? `👨🏫 Class Teacher of ${viewTeacher.classTeacherClass || 'Class 5'}-${viewTeacher.classTeacherSection || 'A'}` : 'Regular Teacher'}
                    </div>
                  </div>

                  <div>
                    <span style={{ color: '#64748B', display: 'block', fontSize: 11, marginBottom: 4 }}>Teaching Classes:</span>
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                      {(viewTeacher.assignedClasses || ['Class 5-A', 'Class 6-A']).map((cls, i) => (
                        <span key={i} style={{ backgroundColor: '#F3E8FF', color: '#7C3AED', padding: '3px 8px', borderRadius: 6, fontWeight: 800, fontSize: 11 }}>
                          {cls}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div>
                    <span style={{ color: '#64748B', display: 'block', fontSize: 11, marginBottom: 4 }}>Teaching Subjects:</span>
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                      {(viewTeacher.teachingSubjects || ['Mathematics', 'Science']).map((sub, i) => (
                        <span key={i} style={{ backgroundColor: '#DCFCE7', color: '#15803D', padding: '3px 8px', borderRadius: 6, fontWeight: 800, fontSize: 11 }}>
                          {sub}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 5: PARENTS / FAMILY */}
              {viewTeacherProfileTab === 'parents' && (
                <div style={{ backgroundColor: '#F8FAFC', padding: 14, borderRadius: 12, border: '1px solid #E2E8F0', display: 'flex', flexDirection: 'column', gap: 12, fontSize: 12 }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                    <div><span style={{ color: '#64748B', display: 'block', fontSize: 11 }}>Father Name:</span> <strong>{viewTeacher.fatherName || 'N/A'}</strong></div>
                    <div><span style={{ color: '#64748B', display: 'block', fontSize: 11 }}>Mother Name:</span> <strong>{viewTeacher.motherName || 'N/A'}</strong></div>
                    <div><span style={{ color: '#64748B', display: 'block', fontSize: 11 }}>Spouse Name:</span> <strong>{viewTeacher.spouseName || 'N/A'}</strong></div>
                    <div><span style={{ color: '#64748B', display: 'block', fontSize: 11 }}>Guardian Name:</span> <strong>{viewTeacher.guardianName || 'N/A'}</strong></div>
                  </div>

                  <div style={{ backgroundColor: '#FEF2F2', padding: 10, borderRadius: 10, border: '1px solid #FECACA' }}>
                    <span style={{ color: '#B91C1C', fontWeight: 800, fontSize: 12 }}>Emergency Contact Details:</span>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, marginTop: 4 }}>
                      <div>Contact Person: <strong>{viewTeacher.emgName || 'N/A'}</strong></div>
                      <div>Relationship: <strong>{viewTeacher.emgRelation || 'Spouse'}</strong></div>
                      <div>Mobile: <strong>{viewTeacher.emgPhone || 'N/A'}</strong></div>
                      <div>Alt Mobile: <strong>{viewTeacher.emgAltPhone || 'N/A'}</strong></div>
                      <div style={{ gridColumn: 'span 2' }}>Address: <strong>{viewTeacher.emgAddress || 'N/A'}</strong></div>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 6: ADDRESS */}
              {viewTeacherProfileTab === 'address' && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, fontSize: 12 }}>
                  <div style={{ backgroundColor: '#F8FAFC', padding: 12, borderRadius: 10, border: '1px solid #E2E8F0' }}>
                    <h4 style={{ fontSize: 13, fontWeight: 800, color: '#1769E0', margin: '0 0 8px' }}>Present Address</h4>
                    <div>{viewTeacher.address || 'Teachers Colony, Kajraili'}</div>
                    <div>City: {viewTeacher.city || 'Bhagalpur'}</div>
                    <div>District: {viewTeacher.district || 'Bhagalpur'}</div>
                    <div>State: {viewTeacher.state || 'Bihar'} - {viewTeacher.pinCode || '812005'}</div>
                  </div>
                  <div style={{ backgroundColor: '#F8FAFC', padding: 12, borderRadius: 10, border: '1px solid #E2E8F0' }}>
                    <h4 style={{ fontSize: 13, fontWeight: 800, color: '#7C3AED', margin: '0 0 8px' }}>Permanent Address</h4>
                    <div>{viewTeacher.permAddress || viewTeacher.address || 'Same as present address'}</div>
                    <div>City: {viewTeacher.permCity || viewTeacher.city || 'Bhagalpur'}</div>
                    <div>District: {viewTeacher.permDistrict || viewTeacher.district || 'Bhagalpur'}</div>
                    <div>State: {viewTeacher.permState || viewTeacher.state || 'Bihar'} - {viewTeacher.permPinCode || viewTeacher.pinCode || '812005'}</div>
                  </div>
                </div>
              )}

              {/* TAB 7: DOCUMENTS */}
              {viewTeacherProfileTab === 'documents' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <h4 style={{ fontSize: 13, fontWeight: 800, color: '#0F172A', margin: 0 }}>Uploaded Documents</h4>
                  {(!viewTeacher.documents || viewTeacher.documents.length === 0) ? (
                    <div style={{ padding: 16, textAlign: 'center', backgroundColor: '#F8FAFC', borderRadius: 10, border: '1px dashed #CBD5E1', color: '#94A3B8', fontSize: 12 }}>
                      No digital documents uploaded for this employee record yet.
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {viewTeacher.documents.map((doc: any, i: number) => (
                        <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#F8FAFC', padding: 10, borderRadius: 10, border: '1px solid #E2E8F0' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <FileCheck size={20} color="#1769E0" />
                            <div>
                              <div style={{ fontSize: 12, fontWeight: 800, color: '#0F172A' }}>{doc.documentType}</div>
                              <div style={{ fontSize: 11, color: '#64748B' }}>No: {doc.documentNumber} • Issue: {doc.issueDate}</div>
                            </div>
                          </div>
                          {doc.fileUrl && (
                            <a href={doc.fileUrl} target="_blank" rel="noreferrer" style={{ fontSize: 11, fontWeight: 800, color: '#1769E0', textDecoration: 'underline' }}>
                              View Doc
                            </a>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* TAB 8: ACCOUNT */}
              {viewTeacherProfileTab === 'account' && (
                <div style={{ backgroundColor: '#F8FAFC', padding: 14, borderRadius: 12, border: '1px solid #E2E8F0', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, fontSize: 12 }}>
                  <div><span style={{ color: '#64748B', display: 'block', fontSize: 11 }}>Portal Username:</span> <strong>{viewTeacher.username || 'priya'}</strong></div>
                  <div><span style={{ color: '#64748B', display: 'block', fontSize: 11 }}>Portal Role:</span> <strong>{viewTeacher.employeeRole || 'Teacher'}</strong></div>
                  <div><span style={{ color: '#64748B', display: 'block', fontSize: 11 }}>Account Status:</span> <strong style={{ color: '#16A34A' }}>{viewTeacher.accountStatus || 'Active'}</strong></div>
                  <div><span style={{ color: '#64748B', display: 'block', fontSize: 11 }}>Auth System Sync:</span> <strong style={{ color: '#1769E0' }}>Synced with db.users</strong></div>
                </div>
              )}

              {/* TAB 9: TRANSPORT */}
              {viewTeacherProfileTab === 'transport' && (
                <div style={{ backgroundColor: '#F0FDF4', padding: 14, borderRadius: 12, border: '1px solid #BBF7D0', display: 'flex', flexDirection: 'column', gap: 10, fontSize: 12 }}>
                  <div style={{ fontSize: 13, fontWeight: 800, color: '#16A34A' }}>Employee Transport Record</div>
                  {viewTeacher.transportReq === 'Yes' ? (
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                      <div>Bus: <strong>{viewTeacher.transportBusId || 'Bus 2'}</strong></div>
                      <div>Route: <strong>{viewTeacher.transportRoute || 'Route 2'}</strong></div>
                      <div>Pickup Stop: <strong>{viewTeacher.transportStop || 'Kajraili Chowk'}</strong></div>
                      <div>Pickup Time: <strong>{viewTeacher.transportTime || '07:15 AM'}</strong></div>
                      <div>Monthly Transport Charge: <strong>₹{viewTeacher.transportFee ?? 700}</strong></div>
                      <div>Status: <strong style={{ color: '#16A34A' }}>{viewTeacher.transportStatus || 'Active'}</strong></div>
                    </div>
                  ) : (
                    <div style={{ color: '#64748B' }}>Employee does not use school transport.</div>
                  )}
                </div>
              )}

              {/* TAB 10: SALARY & PAYMENTS & DUES */}
              {viewTeacherProfileTab === 'salary' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  {/* Financial Summary */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
                    <div style={{ backgroundColor: '#EFF6FF', padding: 8, borderRadius: 8, textAlign: 'center' }}>
                      <span style={{ fontSize: 10, color: '#1E40AF', fontWeight: 700 }}>Monthly Salary</span>
                      <div style={{ fontSize: 14, fontWeight: 900, color: '#1769E0' }}>₹{(viewTeacher.netSalary || 25000).toLocaleString('en-IN')}</div>
                    </div>
                    <div style={{ backgroundColor: '#DCFCE7', padding: 8, borderRadius: 8, textAlign: 'center' }}>
                      <span style={{ fontSize: 10, color: '#15803D', fontWeight: 700 }}>Total Paid</span>
                      <div style={{ fontSize: 14, fontWeight: 900, color: '#16A34A' }}>₹{(viewTeacher.paidSalary ?? 20000).toLocaleString('en-IN')}</div>
                    </div>
                    <div style={{ backgroundColor: '#FEE2E2', padding: 8, borderRadius: 8, textAlign: 'center' }}>
                      <span style={{ fontSize: 10, color: '#B91C1C', fontWeight: 700 }}>Pending Due</span>
                      <div style={{ fontSize: 14, fontWeight: 900, color: '#DC2626' }}>₹{(viewTeacher.pendingSalary ?? 5000).toLocaleString('en-IN')}</div>
                    </div>
                    <div style={{ backgroundColor: '#F3E8FF', padding: 8, borderRadius: 8, textAlign: 'center' }}>
                      <span style={{ fontSize: 10, color: '#6D28D9', fontWeight: 700 }}>Payment Status</span>
                      <div style={{ fontSize: 12, fontWeight: 900, color: '#7C3AED', marginTop: 2 }}>{viewTeacher.salaryPaymentStatus || 'Partial'}</div>
                    </div>
                  </div>

                  {/* Payment History Table */}
                  <div>
                    <h4 style={{ fontSize: 12, fontWeight: 800, color: '#0F172A', margin: '0 0 6px' }}>Salary Payment History</h4>
                    {(!viewTeacher.salaryPaymentsHistory || viewTeacher.salaryPaymentsHistory.length === 0) ? (
                      <div style={{ padding: 12, backgroundColor: '#F8FAFC', borderRadius: 8, border: '1px solid #E2E8F0', fontSize: 11, color: '#64748B' }}>
                        Default Payment: September 2026 | Due ₹{(viewTeacher.netSalary || 25000)} | Paid ₹{(viewTeacher.paidSalary ?? 20000)} | Pending ₹{(viewTeacher.pendingSalary ?? 5000)} | UPI | Partial
                      </div>
                    ) : (
                      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
                        <thead>
                          <tr style={{ backgroundColor: '#F8FAFC', color: '#64748B', textAlign: 'left' }}>
                            <th style={{ padding: 6 }}>Month</th>
                            <th style={{ padding: 6 }}>Salary Due</th>
                            <th style={{ padding: 6 }}>Paid</th>
                            <th style={{ padding: 6 }}>Pending</th>
                            <th style={{ padding: 6 }}>Payment Date</th>
                            <th style={{ padding: 6 }}>Mode</th>
                            <th style={{ padding: 6 }}>Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {viewTeacher.salaryPaymentsHistory.map((rec: any, idx: number) => (
                            <tr key={idx} style={{ borderBottom: '1px solid #F1F5F9' }}>
                              <td style={{ padding: 6, fontWeight: 800 }}>{rec.month}</td>
                              <td style={{ padding: 6 }}>₹{rec.salaryDue}</td>
                              <td style={{ padding: 6, color: '#16A34A', fontWeight: 800 }}>₹{rec.paidAmount}</td>
                              <td style={{ padding: 6, color: '#DC2626', fontWeight: 800 }}>₹{rec.pendingAmount}</td>
                              <td style={{ padding: 6 }}>{rec.paymentDate}</td>
                              <td style={{ padding: 6 }}>{rec.paymentMode}</td>
                              <td style={{ padding: 6, fontWeight: 800 }}>{rec.status}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                  </div>

                  {/* Dues History Table */}
                  <div>
                    <h4 style={{ fontSize: 12, fontWeight: 800, color: '#7C3AED', margin: '6px 0' }}>Employee Charges & Dues</h4>
                    {(!viewTeacher.dues || viewTeacher.dues.length === 0) ? (
                      <div style={{ padding: 10, backgroundColor: '#FDF4FF', borderRadius: 8, border: '1px solid #F5D0FE', fontSize: 11, color: '#7C3AED' }}>
                        No extra employee charges/dues recorded.
                      </div>
                    ) : (
                      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
                        <thead>
                          <tr style={{ backgroundColor: '#F3E8FF', color: '#7C3AED', textAlign: 'left' }}>
                            <th style={{ padding: 6 }}>Type</th>
                            <th style={{ padding: 6 }}>Description</th>
                            <th style={{ padding: 6 }}>Amount</th>
                            <th style={{ padding: 6 }}>Paid</th>
                            <th style={{ padding: 6 }}>Pending</th>
                            <th style={{ padding: 6 }}>Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {viewTeacher.dues.map((d: any, idx: number) => (
                            <tr key={idx} style={{ borderBottom: '1px solid #F1F5F9' }}>
                              <td style={{ padding: 6, fontWeight: 800 }}>{d.dueType}</td>
                              <td style={{ padding: 6 }}>{d.description}</td>
                              <td style={{ padding: 6 }}>₹{d.amount}</td>
                              <td style={{ padding: 6, color: '#16A34A', fontWeight: 800 }}>₹{d.paidAmount}</td>
                              <td style={{ padding: 6, color: '#DC2626', fontWeight: 800 }}>₹{d.pendingAmount}</td>
                              <td style={{ padding: 6, fontWeight: 800 }}>{d.status}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Modal Bottom Buttons */}
            <div style={{ display: 'flex', gap: 10, paddingTop: 10, borderTop: '1px solid #E2E8F0', flexShrink: 0 }}>
              <button
                type="button"
                className="avm-btn-secondary"
                style={{ flex: 1 }}
                onClick={() => setViewTeacher(null)}
              >
                Close Profile
              </button>
              <button
                type="button"
                className="avm-btn-primary"
                style={{ flex: 1, backgroundColor: '#16A34A' }}
                onClick={() => {
                  const t = viewTeacher;
                  setViewTeacher(null);
                  openEditTeacherModal(t);
                }}
              >
                Edit Employee Details
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Quick Other Modals (Exams, Notices, Fees, Homework, Timetable, Notifications) */}
      {createExamModalOpen && (
        <Modal isOpen={createExamModalOpen} onClose={() => setCreateExamModalOpen(false)} title="Create Examination">
          <form onSubmit={handleCreateExam}>
            <div style={{ marginBottom: 12 }}>
              <label style={{ fontSize: 12, fontWeight: 700, color: '#475569', display: 'block', marginBottom: 4 }}>Exam Name</label>
              <input type="text" className="avm-input" value={newExamName} onChange={(e) => setNewExamName(e.target.value)} placeholder="e.g. Unit Test 2" required />
            </div>
            <div style={{ marginBottom: 16 }}>
              <label style={{ fontSize: 12, fontWeight: 700, color: '#475569', display: 'block', marginBottom: 4 }}>Start Date</label>
              <input type="date" className="avm-input" value={newExamStart} onChange={(e) => setNewExamStart(e.target.value)} required />
            </div>
            <button type="submit" className="avm-btn-primary" style={{ width: '100%' }}>Create Exam</button>
          </form>
        </Modal>
      )}

      {/* --- CREATE / EDIT NOTICE MODAL --- */}
      {createNoticeModalOpen && (
        <Modal
          isOpen={createNoticeModalOpen}
          onClose={() => setCreateNoticeModalOpen(false)}
          title={editNoticeModalNotice ? "Edit Notice" : "Create New Notice"}
        >
          <form onSubmit={(e) => handleSaveNoticeSubmit(e)}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {/* Notice Title */}
              <div>
                <label style={{ fontSize: 12, fontWeight: 700, color: '#475569', display: 'block', marginBottom: 4 }}>
                  Notice Title *
                </label>
                <input
                  type="text"
                  className="avm-input"
                  value={formNoticeTitle}
                  onChange={(e) => setFormNoticeTitle(e.target.value)}
                  placeholder="e.g. Parent-Teacher Meeting"
                  required
                />
              </div>

              {/* Notice Type Dropdown */}
              <div>
                <label style={{ fontSize: 12, fontWeight: 700, color: '#475569', display: 'block', marginBottom: 4 }}>
                  Notice Type *
                </label>
                <select
                  className="avm-input"
                  value={formNoticeType}
                  onChange={(e) => setFormNoticeType(e.target.value as NoticeType)}
                  required
                >
                  <option value="General">General</option>
                  <option value="Academic">Academic</option>
                  <option value="Exam">Exam</option>
                  <option value="Holiday">Holiday</option>
                  <option value="PTM">PTM</option>
                  <option value="Homework">Homework</option>
                  <option value="Fee">Fee</option>
                  <option value="Emergency">Emergency</option>
                  <option value="Event">Event</option>
                  <option value="Circular">Circular</option>
                </select>
              </div>

              {/* Send To (Segmented Selection Cards - VERY IMPORTANT) */}
              <div>
                <label style={{ fontSize: 12, fontWeight: 700, color: '#475569', display: 'block', marginBottom: 6 }}>
                  Send To * (Select Recipient Group)
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
                  {/* Students Card */}
                  <div
                    onClick={() => setFormNoticeRecipients('students')}
                    style={{
                      padding: 12,
                      borderRadius: 10,
                      border: formNoticeRecipients === 'students' ? '2px solid #1769E0' : '1px solid #E2E8F0',
                      backgroundColor: formNoticeRecipients === 'students' ? '#EFF6FF' : '#FFFFFF',
                      cursor: 'pointer',
                      textAlign: 'center',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    <div style={{ fontSize: 20, marginBottom: 2 }}>👨🎓</div>
                    <div style={{ fontSize: 13, fontWeight: 800, color: formNoticeRecipients === 'students' ? '#1769E0' : '#1E293B' }}>
                      Students
                    </div>
                    <div style={{ fontSize: 10, color: '#64748B', marginTop: 2 }}>
                      Send to all students
                    </div>
                  </div>

                  {/* Employees Card */}
                  <div
                    onClick={() => setFormNoticeRecipients('employees')}
                    style={{
                      padding: 12,
                      borderRadius: 10,
                      border: formNoticeRecipients === 'employees' ? '2px solid #7C3AED' : '1px solid #E2E8F0',
                      backgroundColor: formNoticeRecipients === 'employees' ? '#F3E8FF' : '#FFFFFF',
                      cursor: 'pointer',
                      textAlign: 'center',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    <div style={{ fontSize: 20, marginBottom: 2 }}>👨🏫</div>
                    <div style={{ fontSize: 13, fontWeight: 800, color: formNoticeRecipients === 'employees' ? '#7C3AED' : '#1E293B' }}>
                      Employees
                    </div>
                    <div style={{ fontSize: 10, color: '#64748B', marginTop: 2 }}>
                      Send to teachers & staff
                    </div>
                  </div>

                  {/* Everyone Card */}
                  <div
                    onClick={() => setFormNoticeRecipients('both')}
                    style={{
                      padding: 12,
                      borderRadius: 10,
                      border: formNoticeRecipients === 'both' ? '2px solid #4F46E5' : '1px solid #E2E8F0',
                      backgroundColor: formNoticeRecipients === 'both' ? '#EEF2FF' : '#FFFFFF',
                      cursor: 'pointer',
                      textAlign: 'center',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    <div style={{ fontSize: 20, marginBottom: 2 }}>👥</div>
                    <div style={{ fontSize: 13, fontWeight: 800, color: formNoticeRecipients === 'both' ? '#4F46E5' : '#1E293B' }}>
                      Everyone
                    </div>
                    <div style={{ fontSize: 10, color: '#64748B', marginTop: 2 }}>
                      Students + Employees
                    </div>
                  </div>
                </div>
              </div>

              {/* Target Audience Scope Filters */}
              {(formNoticeRecipients === 'students' || formNoticeRecipients === 'both') && (
                <div style={{ backgroundColor: '#F8FAFC', padding: 12, borderRadius: 8, border: '1px dashed #CBD5E1' }}>
                  <label style={{ fontSize: 11, fontWeight: 800, color: '#334155', display: 'block', marginBottom: 6 }}>
                    🎯 Student Target Scope
                  </label>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                    <div>
                      <label style={{ fontSize: 11, color: '#64748B', display: 'block', marginBottom: 2 }}>Class</label>
                      <select
                        className="avm-input"
                        value={formNoticeTargetClass}
                        onChange={(e) => setFormNoticeTargetClass(e.target.value)}
                        style={{ height: 36, fontSize: 12 }}
                      >
                        <option value="All">All Classes</option>
                        <option value="Nursery">Nursery</option>
                        <option value="LKG">LKG</option>
                        <option value="UKG">UKG</option>
                        <option value="Class 1">Class 1</option>
                        <option value="Class 2">Class 2</option>
                        <option value="Class 3">Class 3</option>
                        <option value="Class 4">Class 4</option>
                        <option value="Class 5">Class 5</option>
                        <option value="Class 6">Class 6</option>
                        <option value="Class 7">Class 7</option>
                        <option value="Class 8">Class 8</option>
                      </select>
                    </div>

                    <div>
                      <label style={{ fontSize: 11, color: '#64748B', display: 'block', marginBottom: 2 }}>Section</label>
                      <select
                        className="avm-input"
                        value={formNoticeTargetSection}
                        onChange={(e) => setFormNoticeTargetSection(e.target.value)}
                        style={{ height: 36, fontSize: 12 }}
                      >
                        <option value="All">All Sections</option>
                        <option value="A">Section A</option>
                        <option value="B">Section B</option>
                        <option value="C">Section C</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {(formNoticeRecipients === 'employees' || formNoticeRecipients === 'both') && (
                <div style={{ backgroundColor: '#F8FAFC', padding: 12, borderRadius: 8, border: '1px dashed #CBD5E1' }}>
                  <label style={{ fontSize: 11, fontWeight: 800, color: '#334155', display: 'block', marginBottom: 6 }}>
                    🎯 Employee Target Scope
                  </label>
                  <div>
                    <label style={{ fontSize: 11, color: '#64748B', display: 'block', marginBottom: 2 }}>Department</label>
                    <select
                      className="avm-input"
                      value={formNoticeTargetDepartment}
                      onChange={(e) => setFormNoticeTargetDepartment(e.target.value)}
                      style={{ height: 36, fontSize: 12 }}
                    >
                      <option value="All">All Employees / Staff</option>
                      <option value="Academics">Academics / Teaching Staff</option>
                      <option value="Administration">Administration</option>
                      <option value="Transport">Transport Staff</option>
                      <option value="Sports">Sports Department</option>
                    </select>
                  </div>
                </div>
              )}

              {/* Notice Description */}
              <div>
                <label style={{ fontSize: 12, fontWeight: 700, color: '#475569', display: 'block', marginBottom: 4 }}>
                  Notice Description *
                </label>
                <textarea
                  className="avm-input"
                  rows={4}
                  value={formNoticeDesc}
                  onChange={(e) => setFormNoticeDesc(e.target.value)}
                  placeholder="Parent-Teacher Meeting is scheduled for Saturday, 12 July 2026. Parents are requested to attend..."
                  required
                />
              </div>

              {/* Attachment */}
              <div>
                <label style={{ fontSize: 12, fontWeight: 700, color: '#475569', display: 'block', marginBottom: 4 }}>
                  Attachment (Optional - PDF, Image, Document)
                </label>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <input
                    type="text"
                    className="avm-input"
                    value={formNoticeAttachment}
                    onChange={(e) => setFormNoticeAttachment(e.target.value)}
                    placeholder="e.g. PTM_Schedule_Jul2026.pdf"
                    style={{ flex: 1 }}
                  />
                  <label className="avm-btn-secondary" style={{ padding: '8px 12px', fontSize: 12, cursor: 'pointer', whiteSpace: 'nowrap' }}>
                    📁 Select File
                    <input
                      type="file"
                      style={{ display: 'none' }}
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) setFormNoticeAttachment(file.name);
                      }}
                    />
                  </label>
                </div>
                {formNoticeAttachment && (
                  <div style={{ fontSize: 11, color: '#1769E0', marginTop: 4, fontWeight: 600 }}>
                    Attached file: {formNoticeAttachment}
                  </div>
                )}
              </div>

              {/* Publish Options */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 700, color: '#475569', display: 'block', marginBottom: 4 }}>
                    Publish Date *
                  </label>
                  <input
                    type="date"
                    className="avm-input"
                    value={formNoticePublishDate}
                    onChange={(e) => setFormNoticePublishDate(e.target.value)}
                    required
                  />
                </div>

                <div>
                  <label style={{ fontSize: 12, fontWeight: 700, color: '#475569', display: 'block', marginBottom: 4 }}>
                    Publish Time
                  </label>
                  <input
                    type="text"
                    className="avm-input"
                    value={formNoticePublishTime}
                    onChange={(e) => setFormNoticePublishTime(e.target.value)}
                    placeholder="10:30 AM"
                  />
                </div>
              </div>

              {/* Status Radio options */}
              <div>
                <label style={{ fontSize: 12, fontWeight: 700, color: '#475569', display: 'block', marginBottom: 6 }}>
                  Publishing Status
                </label>
                <div style={{ display: 'flex', gap: 16 }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, cursor: 'pointer', fontWeight: 600 }}>
                    <input
                      type="radio"
                      name="noticeStatus"
                      checked={formNoticeStatus === 'Published'}
                      onChange={() => setFormNoticeStatus('Published')}
                    />
                    Publish Now
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, cursor: 'pointer', fontWeight: 600 }}>
                    <input
                      type="radio"
                      name="noticeStatus"
                      checked={formNoticeStatus === 'Draft'}
                      onChange={() => setFormNoticeStatus('Draft')}
                    />
                    Draft
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, cursor: 'pointer', fontWeight: 600 }}>
                    <input
                      type="radio"
                      name="noticeStatus"
                      checked={formNoticeStatus === 'Scheduled'}
                      onChange={() => setFormNoticeStatus('Scheduled')}
                    />
                    Scheduled
                  </label>
                </div>
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 10 }}>
                <button
                  type="button"
                  className="avm-btn-secondary"
                  onClick={() => setCreateNoticeModalOpen(false)}
                >
                  Cancel
                </button>

                <button
                  type="button"
                  className="avm-btn-secondary"
                  onClick={(e) => handleSaveNoticeSubmit(e, 'Draft')}
                >
                  Save Draft
                </button>

                <button
                  type="submit"
                  className="avm-btn-primary"
                >
                  {formNoticeStatus === 'Draft' ? 'Save Notice' : 'Publish Notice'}
                </button>
              </div>
            </div>
          </form>
        </Modal>
      )}

      {/* --- NOTICE DETAILS MODAL --- */}
      {viewNoticeModalNotice && (
        <Modal
          isOpen={Boolean(viewNoticeModalNotice)}
          onClose={() => setViewNoticeModalNotice(null)}
          title="Notice Details"
        >
          {(() => {
            const n = viewNoticeModalNotice;
            const stats = noticeService.getNoticeReadStats(n);
            const recipients = n.recipients || 'both';

            return (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {/* Header info */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 8 }}>
                  <div>
                    <span style={{
                      fontSize: 11,
                      fontWeight: 800,
                      backgroundColor: getNoticeTypeStyle(n.type || n.category || 'General').bg,
                      color: getNoticeTypeStyle(n.type || n.category || 'General').text,
                      padding: '4px 10px',
                      borderRadius: 12,
                      display: 'inline-block',
                      marginBottom: 6
                    }}>
                      {n.type || n.category || 'General'}
                    </span>
                    <h3 style={{ fontSize: 18, fontWeight: 800, color: '#0F172A', margin: 0 }}>{n.title}</h3>
                  </div>

                  <span style={{
                    fontSize: 11,
                    fontWeight: 800,
                    padding: '4px 10px',
                    borderRadius: 12,
                    backgroundColor: n.status === 'Published' ? '#DCFCE7' : n.status === 'Draft' ? '#F1F5F9' : n.status === 'Scheduled' ? '#FEF3C7' : '#FEE2E2',
                    color: n.status === 'Published' ? '#15803D' : n.status === 'Draft' ? '#64748B' : n.status === 'Scheduled' ? '#D97706' : '#B91C1C'
                  }}>
                    ● {n.status || 'Published'}
                  </span>
                </div>

                {/* Scope & Timing grid */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, backgroundColor: '#F8FAFC', padding: 14, borderRadius: 10 }}>
                  <div>
                    <span style={{ fontSize: 11, color: '#64748B', display: 'block' }}>Recipients</span>
                    <span style={{ fontSize: 13, fontWeight: 800, color: '#0F172A' }}>
                      {recipients === 'students' ? '👨🎓 Students' : recipients === 'employees' ? '👨🏫 Employees' : '👥 Students + Employees'}
                    </span>
                  </div>

                  <div>
                    <span style={{ fontSize: 11, color: '#64748B', display: 'block' }}>Published Timestamp</span>
                    <span style={{ fontSize: 13, fontWeight: 700, color: '#0F172A' }}>
                      {n.publishDate || n.date} • {n.publishTime || '10:30 AM'}
                    </span>
                  </div>

                  <div>
                    <span style={{ fontSize: 11, color: '#64748B', display: 'block' }}>Target Student Class</span>
                    <span style={{ fontSize: 12, fontWeight: 700, color: '#334155' }}>
                      {n.targetClass || 'All Classes'} {n.targetSection && n.targetSection !== 'All' ? `(${n.targetSection})` : ''}
                    </span>
                  </div>

                  <div>
                    <span style={{ fontSize: 11, color: '#64748B', display: 'block' }}>Target Employee Dept</span>
                    <span style={{ fontSize: 12, fontWeight: 700, color: '#334155' }}>
                      {n.targetDepartment || 'All Departments'}
                    </span>
                  </div>
                </div>

                {/* Read statistics breakdown */}
                <div style={{ backgroundColor: '#EFF6FF', border: '1px solid #BFDBFE', padding: 14, borderRadius: 10 }}>
                  <div style={{ fontSize: 13, fontWeight: 800, color: '#1769E0', marginBottom: 6 }}>
                    📊 Recipient Engagement & Read Tracking Statistics
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, textAlign: 'center' }}>
                    <div style={{ backgroundColor: '#FFFFFF', padding: 8, borderRadius: 6 }}>
                      <div style={{ fontSize: 16, fontWeight: 800, color: '#0F172A' }}>{stats.totalEligible}</div>
                      <div style={{ fontSize: 10, color: '#64748B' }}>Total Recipients</div>
                    </div>
                    <div style={{ backgroundColor: '#FFFFFF', padding: 8, borderRadius: 6 }}>
                      <div style={{ fontSize: 16, fontWeight: 800, color: '#16A34A' }}>{stats.readCount}</div>
                      <div style={{ fontSize: 10, color: '#64748B' }}>Read Notices</div>
                    </div>
                    <div style={{ backgroundColor: '#FFFFFF', padding: 8, borderRadius: 6 }}>
                      <div style={{ fontSize: 16, fontWeight: 800, color: '#DC2626' }}>{stats.unreadCount}</div>
                      <div style={{ fontSize: 10, color: '#64748B' }}>Unread Notices</div>
                    </div>
                  </div>
                </div>

                {/* Description */}
                <div>
                  <span style={{ fontSize: 12, fontWeight: 700, color: '#475569', display: 'block', marginBottom: 4 }}>Description</span>
                  <div style={{ fontSize: 14, color: '#1E293B', lineHeight: 1.6, backgroundColor: '#FFFFFF', padding: 14, borderRadius: 8, border: '1px solid #E2E8F0', whiteSpace: 'pre-line' }}>
                    {n.description}
                  </div>
                </div>

                {/* Attachment */}
                {n.attachmentName && (
                  <div>
                    <span style={{ fontSize: 12, fontWeight: 700, color: '#475569', display: 'block', marginBottom: 4 }}>Attachment</span>
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 12px', backgroundColor: '#F1F5F9', borderRadius: 8, fontSize: 13, fontWeight: 700, color: '#1769E0' }}>
                      <Paperclip size={16} /> {n.attachmentName}
                    </div>
                  </div>
                )}

                {/* Action buttons */}
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 10, paddingTop: 10, borderTop: '1px solid #E2E8F0' }}>
                  <button
                    className="avm-btn-secondary"
                    onClick={() => {
                      setViewNoticeModalNotice(null);
                      openEditNoticeModal(n);
                    }}
                  >
                    Edit Notice
                  </button>

                  {n.status !== 'Archived' && (
                    <button
                      className="avm-btn-secondary"
                      style={{ color: '#D97706' }}
                      onClick={() => handleArchiveNotice(n.id)}
                    >
                      Archive Notice
                    </button>
                  )}

                  <button
                    className="avm-btn-secondary"
                    style={{ color: '#DC2626' }}
                    onClick={() => {
                      setDeleteNoticeConfirmId(n.id);
                    }}
                  >
                    Delete Notice
                  </button>

                  <button
                    className="avm-btn-primary"
                    onClick={() => setViewNoticeModalNotice(null)}
                  >
                    Close
                  </button>
                </div>
              </div>
            );
          })()}
        </Modal>
      )}

      {/* --- CONFIRM DELETE NOTICE MODAL --- */}
      {deleteNoticeConfirmId && (
        <Modal
          isOpen={Boolean(deleteNoticeConfirmId)}
          onClose={() => setDeleteNoticeConfirmId(null)}
          title="Confirm Delete Notice"
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, backgroundColor: '#FEF2F2', padding: 14, borderRadius: 10, color: '#991B1B' }}>
              <AlertCircle size={24} />
              <div style={{ fontSize: 14, fontWeight: 700 }}>
                Are you sure you want to delete this notice?
              </div>
            </div>
            <p style={{ fontSize: 13, color: '#475569', margin: 0 }}>
              This notice will be permanently removed from school history and recipient feeds.
            </p>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 10 }}>
              <button
                className="avm-btn-secondary"
                onClick={() => setDeleteNoticeConfirmId(null)}
              >
                Cancel
              </button>
              <button
                className="avm-btn-primary"
                style={{ backgroundColor: '#DC2626' }}
                onClick={handleConfirmDeleteNotice}
              >
                Yes, Delete Notice
              </button>
            </div>
          </div>
        </Modal>
      )}

      {updateFeeModalOpen && (
        <Modal isOpen={updateFeeModalOpen} onClose={() => setUpdateFeeModalOpen(false)} title="Update Student Fee">
          <form onSubmit={handleUpdateFee}>
            <div style={{ marginBottom: 12 }}>
              <label style={{ fontSize: 12, fontWeight: 700, color: '#475569', display: 'block', marginBottom: 4 }}>Student ID / Admission No</label>
              <input type="text" className="avm-input" value={feeStudentId} onChange={(e) => setFeeStudentId(e.target.value)} required />
            </div>
            <div style={{ marginBottom: 12 }}>
              <label style={{ fontSize: 12, fontWeight: 700, color: '#475569', display: 'block', marginBottom: 4 }}>Total Fee Amount (₹)</label>
              <input type="number" className="avm-input" value={feeTotalAmount} onChange={(e) => setFeeTotalAmount(e.target.value)} required />
            </div>
            <div style={{ marginBottom: 16 }}>
              <label style={{ fontSize: 12, fontWeight: 700, color: '#475569', display: 'block', marginBottom: 4 }}>Paid Fee Amount (₹)</label>
              <input type="number" className="avm-input" value={feePaidAmount} onChange={(e) => setFeePaidAmount(e.target.value)} required />
            </div>
            <button type="submit" className="avm-btn-primary" style={{ width: '100%' }}>Save Fee Update</button>
          </form>
        </Modal>
      )}

      {/* HOMEWORK MODULE MODALS (PUBLISH, EDIT, DELETE) */}
      {publishHwModalOpen && (
        <Modal isOpen={publishHwModalOpen} onClose={() => setPublishHwModalOpen(false)} title="Publish Homework Assignment">
          <form onSubmit={handlePublishHomeworkSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <label style={{ fontSize: 12, fontWeight: 700, color: '#475569', display: 'block', marginBottom: 4 }}>
                  Academic Session
                </label>
                <input type="text" className="avm-input" value={hwFormSessionId} readOnly style={{ backgroundColor: '#F8FAFC', fontWeight: 700 }} />
              </div>

              <div>
                <label style={{ fontSize: 12, fontWeight: 700, color: '#475569', display: 'block', marginBottom: 4 }}>
                  Class & Section <span style={{ color: '#EF4444' }}>*</span>
                </label>
                <select className="avm-input" value={hwFormClass} onChange={(e) => setHwFormClass(e.target.value)} required>
                  {attendanceClassOptions.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <label style={{ fontSize: 12, fontWeight: 700, color: '#475569', display: 'block', marginBottom: 4 }}>
                  Subject <span style={{ color: '#EF4444' }}>*</span>
                </label>
                <select className="avm-input" value={hwFormSubject} onChange={(e) => setHwFormSubject(e.target.value)} required>
                  <option value="Mathematics">Mathematics</option>
                  <option value="Science">Science</option>
                  <option value="English">English</option>
                  <option value="Hindi">Hindi</option>
                  <option value="Social Science">Social Science</option>
                  <option value="Computer">Computer</option>
                  <option value="General">General</option>
                </select>
              </div>

              <div>
                <label style={{ fontSize: 12, fontWeight: 700, color: '#475569', display: 'block', marginBottom: 4 }}>
                  Teacher Name <span style={{ color: '#EF4444' }}>*</span>
                </label>
                <input type="text" className="avm-input" value={hwFormTeacher} onChange={(e) => setHwFormTeacher(e.target.value)} placeholder="Teacher Name" required />
              </div>
            </div>

            <div>
              <label style={{ fontSize: 12, fontWeight: 700, color: '#475569', display: 'block', marginBottom: 4 }}>
                Homework Title <span style={{ color: '#EF4444' }}>*</span>
              </label>
              <input type="text" className="avm-input" value={hwFormTitle} onChange={(e) => setHwFormTitle(e.target.value)} placeholder="e.g. Fractions Chapter 4" required />
            </div>

            <div>
              <label style={{ fontSize: 12, fontWeight: 700, color: '#475569', display: 'block', marginBottom: 4 }}>
                Description / Homework Instructions <span style={{ color: '#EF4444' }}>*</span>
              </label>
              <textarea className="avm-input" rows={3} value={hwFormDesc} onChange={(e) => setHwFormDesc(e.target.value)} placeholder="Solve questions 1–10 from Chapter 4." required />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <label style={{ fontSize: 12, fontWeight: 700, color: '#475569', display: 'block', marginBottom: 4 }}>
                  Assigned Date
                </label>
                <input type="date" className="avm-input" value={hwFormAssignedDate} onChange={(e) => setHwFormAssignedDate(e.target.value)} required />
              </div>

              <div>
                <label style={{ fontSize: 12, fontWeight: 700, color: '#475569', display: 'block', marginBottom: 4 }}>
                  Due Date <span style={{ color: '#EF4444' }}>*</span>
                </label>
                <input type="date" className="avm-input" value={hwFormDueDate} onChange={(e) => setHwFormDueDate(e.target.value)} required />
              </div>
            </div>

            <div>
              <label style={{ fontSize: 12, fontWeight: 700, color: '#475569', display: 'block', marginBottom: 4 }}>
                Attachment (Optional File / Image URL)
              </label>
              <input type="text" className="avm-input" value={hwFormAttachment} onChange={(e) => setHwFormAttachment(e.target.value)} placeholder="https://..." />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 10 }}>
              <button type="button" className="avm-btn-secondary" onClick={() => setPublishHwModalOpen(false)}>Cancel</button>
              <button type="submit" className="avm-btn-primary" disabled={hwSaving}>
                {hwSaving ? 'Publishing...' : 'Publish Homework'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {editHwModalOpen && (
        <Modal isOpen={editHwModalOpen} onClose={() => setEditHwModalOpen(false)} title="Edit Homework Assignment">
          <form onSubmit={handleEditHomeworkSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <label style={{ fontSize: 12, fontWeight: 700, color: '#475569', display: 'block', marginBottom: 4 }}>
                  Academic Session
                </label>
                <input type="text" className="avm-input" value={hwFormSessionId} readOnly style={{ backgroundColor: '#F8FAFC', fontWeight: 700 }} />
              </div>

              <div>
                <label style={{ fontSize: 12, fontWeight: 700, color: '#475569', display: 'block', marginBottom: 4 }}>
                  Class & Section
                </label>
                <select className="avm-input" value={hwFormClass} onChange={(e) => setHwFormClass(e.target.value)} required>
                  {attendanceClassOptions.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <label style={{ fontSize: 12, fontWeight: 700, color: '#475569', display: 'block', marginBottom: 4 }}>
                  Subject
                </label>
                <select className="avm-input" value={hwFormSubject} onChange={(e) => setHwFormSubject(e.target.value)} required>
                  <option value="Mathematics">Mathematics</option>
                  <option value="Science">Science</option>
                  <option value="English">English</option>
                  <option value="Hindi">Hindi</option>
                  <option value="Social Science">Social Science</option>
                  <option value="Computer">Computer</option>
                  <option value="General">General</option>
                </select>
              </div>

              <div>
                <label style={{ fontSize: 12, fontWeight: 700, color: '#475569', display: 'block', marginBottom: 4 }}>
                  Teacher
                </label>
                <input type="text" className="avm-input" value={hwFormTeacher} onChange={(e) => setHwFormTeacher(e.target.value)} required />
              </div>
            </div>

            <div>
              <label style={{ fontSize: 12, fontWeight: 700, color: '#475569', display: 'block', marginBottom: 4 }}>
                Homework Title
              </label>
              <input type="text" className="avm-input" value={hwFormTitle} onChange={(e) => setHwFormTitle(e.target.value)} required />
            </div>

            <div>
              <label style={{ fontSize: 12, fontWeight: 700, color: '#475569', display: 'block', marginBottom: 4 }}>
                Description / Homework Instructions
              </label>
              <textarea className="avm-input" rows={3} value={hwFormDesc} onChange={(e) => setHwFormDesc(e.target.value)} required />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <label style={{ fontSize: 12, fontWeight: 700, color: '#475569', display: 'block', marginBottom: 4 }}>
                  Assigned Date
                </label>
                <input type="date" className="avm-input" value={hwFormAssignedDate} onChange={(e) => setHwFormAssignedDate(e.target.value)} required />
              </div>

              <div>
                <label style={{ fontSize: 12, fontWeight: 700, color: '#475569', display: 'block', marginBottom: 4 }}>
                  Due Date
                </label>
                <input type="date" className="avm-input" value={hwFormDueDate} onChange={(e) => setHwFormDueDate(e.target.value)} required />
              </div>
            </div>

            <div>
              <label style={{ fontSize: 12, fontWeight: 700, color: '#475569', display: 'block', marginBottom: 4 }}>
                Attachment (Optional File / Image URL)
              </label>
              <input type="text" className="avm-input" value={hwFormAttachment} onChange={(e) => setHwFormAttachment(e.target.value)} />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 10 }}>
              <button type="button" className="avm-btn-secondary" onClick={() => setEditHwModalOpen(false)}>Cancel</button>
              <button type="submit" className="avm-btn-primary" disabled={hwSaving}>
                {hwSaving ? 'Saving Changes...' : 'Save Changes'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {deleteHwModalOpen && selectedHwItem && (
        <Modal isOpen={deleteHwModalOpen} onClose={() => setDeleteHwModalOpen(false)} title="Delete Homework Assignment">
          <div style={{ padding: 10 }}>
            <p style={{ fontSize: 14, color: '#0F172A', fontWeight: 600, marginBottom: 8 }}>
              Are you sure you want to delete this homework assignment?
            </p>
            <div style={{ padding: 12, backgroundColor: '#FEF2F2', borderRadius: 8, borderLeft: '4px solid #EF4444', marginBottom: 16 }}>
              <div style={{ fontWeight: 800, color: '#991B1B', fontSize: 13 }}>{selectedHwItem.title}</div>
              <div style={{ fontSize: 12, color: '#B91C1C', marginTop: 2 }}>
                Subject: {selectedHwItem.subject} • Class: {selectedHwItem.className}
              </div>
            </div>
            <p style={{ fontSize: 12, color: '#64748B' }}>
              This action will remove the assignment from both the Admin Panel and Student Mobile Apps.
            </p>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 20 }}>
              <button type="button" className="avm-btn-secondary" onClick={() => setDeleteHwModalOpen(false)}>Cancel</button>
              <button
                type="button"
                onClick={handleDeleteHomeworkConfirm}
                disabled={hwSaving}
                style={{
                  padding: '8px 18px',
                  borderRadius: 8,
                  backgroundColor: '#EF4444',
                  color: '#FFFFFF',
                  fontWeight: 800,
                  fontSize: 13,
                  border: 'none',
                  cursor: 'pointer'
                }}
              >
                {hwSaving ? 'Deleting...' : 'Delete Homework'}
              </button>
            </div>
          </div>
        </Modal>
      )}

      {addTimetableModalOpen && (
        <Modal isOpen={addTimetableModalOpen} onClose={() => setAddTimetableModalOpen(false)} title="Add Timetable Slot">
          <form onSubmit={handleAddTimetable}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 12 }}>
              <div>
                <label style={{ fontSize: 12, fontWeight: 700, color: '#475569', display: 'block', marginBottom: 4 }}>Period</label>
                <input type="number" className="avm-input" value={ttPeriod} onChange={(e) => setTtPeriod(e.target.value)} required />
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 700, color: '#475569', display: 'block', marginBottom: 4 }}>Time Slot</label>
                <input type="text" className="avm-input" value={ttTime} onChange={(e) => setTtTime(e.target.value)} required />
              </div>
            </div>
            <div style={{ marginBottom: 12 }}>
              <label style={{ fontSize: 12, fontWeight: 700, color: '#475569', display: 'block', marginBottom: 4 }}>Class</label>
              <select className="avm-input" value={ttClass} onChange={(e) => setTtClass(e.target.value)}>
                {mockSchoolClasses.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div style={{ marginBottom: 12 }}>
              <label style={{ fontSize: 12, fontWeight: 700, color: '#475569', display: 'block', marginBottom: 4 }}>Subject</label>
              <input type="text" className="avm-input" value={ttSubject} onChange={(e) => setTtSubject(e.target.value)} required />
            </div>
            <div style={{ marginBottom: 16 }}>
              <label style={{ fontSize: 12, fontWeight: 700, color: '#475569', display: 'block', marginBottom: 4 }}>Teacher</label>
              <input type="text" className="avm-input" value={ttTeacher} onChange={(e) => setTtTeacher(e.target.value)} required />
            </div>
            <button type="submit" className="avm-btn-primary" style={{ width: '100%' }}>Add Timetable Slot</button>
          </form>
        </Modal>
      )}


      {previewAdmitCardStudent && (
        <AdmitCardModal
          isOpen={!!previewAdmitCardStudent}
          onClose={() => setPreviewAdmitCardStudent(null)}
          student={previewAdmitCardStudent}
          examName={exams[0]?.name || 'Half Yearly Examination'}
        />
      )}

      {previewReportCardStudent && (
        <ReportCardModal
          isOpen={!!previewReportCardStudent}
          onClose={() => setPreviewReportCardStudent(null)}
          student={previewReportCardStudent}
          result={{
            id: `RES-${previewReportCardStudent.id}`,
            studentId: previewReportCardStudent.id,
            examId: 'EX-HY-2026',
            examName: 'Half Yearly Examination 2026',
            className: previewReportCardStudent.className,
            section: previewReportCardStudent.section,
            isEarlyYears: previewReportCardStudent.className.toLowerCase().includes('nursery'),
            issueDate: '2026-09-25',
            marks: [
              { subject: 'Hindi', marksObtained: 78, maxMarks: 100, grade: 'B1' },
              { subject: 'English', marksObtained: 84, maxMarks: 100, grade: 'A2' },
              { subject: 'Mathematics', marksObtained: 82, maxMarks: 100, grade: 'A2' },
              { subject: 'Science', marksObtained: 88, maxMarks: 100, grade: 'A1' },
              { subject: 'Computer', marksObtained: 91, maxMarks: 100, grade: 'A1' }
            ],
            totalObtained: 423,
            totalMax: 500,
            percentage: 84.6,
            grade: 'A',
            teacherRemarks: 'Hardworking and focused student.'
          }}
        />
      )}

      {/* MANAGE ACADEMIC SESSIONS MODAL */}
      {manageSessionsModalOpen && (
        <Modal isOpen={manageSessionsModalOpen} onClose={() => setManageSessionsModalOpen(false)} title="Manage Academic Sessions">
          <div style={{ padding: '4px 0' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div>
                <h4 style={{ fontSize: 14, fontWeight: 800, margin: 0, color: '#0F172A' }}>School Academic Sessions</h4>
                <p style={{ fontSize: 12, color: '#64748B', margin: '2px 0 0' }}>All historical & current academic years</p>
              </div>
              <button
                onClick={() => setCreateSessionModalOpen(true)}
                className="avm-btn-primary"
                style={{ fontSize: 12, padding: '8px 14px' }}
              >
                + Create New Session
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, maxHeight: 320, overflowY: 'auto' }}>
              {sessions.map((s) => (
                <div
                  key={s.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '12px 16px',
                    borderRadius: 12,
                    border: '1px solid #E2E8F0',
                    backgroundColor: s.isActive ? '#EFF6FF' : '#F8FAFC'
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontSize: 15, fontWeight: 800, color: '#0F172A' }}>{s.name}</span>
                      {s.isActive ? (
                        <span style={{ backgroundColor: '#16A34A', color: '#FFF', fontSize: 10, fontWeight: 800, padding: '2px 8px', borderRadius: 10 }}>ACTIVE</span>
                      ) : (
                        <span style={{ backgroundColor: '#94A3B8', color: '#FFF', fontSize: 10, fontWeight: 800, padding: '2px 8px', borderRadius: 10 }}>{(s.status || 'Archived').toUpperCase()}</span>
                      )}
                    </div>
                    <div style={{ fontSize: 11, color: '#64748B', marginTop: 4 }}>
                      Duration: {s.startDate || '01-04-2026'} to {s.endDate || '31-03-2027'}
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: 8 }}>
                    <button
                      onClick={() => {
                        setSelectedSessionId(s.id);
                        refreshAll(s.id);
                        setManageSessionsModalOpen(false);
                      }}
                      style={{
                        backgroundColor: selectedSessionId === s.id ? '#1769E0' : '#E2E8F0',
                        color: selectedSessionId === s.id ? '#FFF' : '#334155',
                        border: 'none',
                        borderRadius: 8,
                        padding: '6px 12px',
                        fontSize: 11,
                        fontWeight: 700,
                        cursor: 'pointer'
                      }}
                    >
                      {selectedSessionId === s.id ? 'Viewing Now' : 'View Session'}
                    </button>
                    {!s.isActive && (
                      <button
                        onClick={() => handleActivateSession(s.id)}
                        style={{
                          backgroundColor: '#16A34A',
                          color: '#FFF',
                          border: 'none',
                          borderRadius: 8,
                          padding: '6px 12px',
                          fontSize: 11,
                          fontWeight: 700,
                          cursor: 'pointer'
                        }}
                      >
                        Set Active
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Modal>
      )}

      {/* CREATE NEW ACADEMIC SESSION MODAL */}
      {createSessionModalOpen && (
        <Modal isOpen={createSessionModalOpen} onClose={() => setCreateSessionModalOpen(false)} title="Create New Academic Session">
          <form onSubmit={handleCreateSession} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ backgroundColor: '#EFF6FF', padding: 12, borderRadius: 10, border: '1px solid #BFDBFE' }}>
              <div style={{ fontSize: 13, fontWeight: 800, color: '#1E40AF', marginBottom: 2 }}>Automatic Copy Forward & Promotion</div>
              <div style={{ fontSize: 11, color: '#1E3A8A' }}>Creating a new session automatically carries forward students, teacher assignments, and outstanding fee balances into the new session. Historical records remain preserved.</div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <label style={{ fontSize: 12, fontWeight: 700, color: '#475569', display: 'block', marginBottom: 4 }}>Session Name *</label>
                <input
                  type="text"
                  className="avm-input"
                  value={newSessionName}
                  onChange={(e) => setNewSessionName(e.target.value)}
                  placeholder="e.g. 2027–28"
                  required
                />
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 700, color: '#475569', display: 'block', marginBottom: 4 }}>Set as Active Session?</label>
                <select
                  className="avm-input"
                  value={newSessionIsActive ? 'yes' : 'no'}
                  onChange={(e) => setNewSessionIsActive(e.target.value === 'yes')}
                >
                  <option value="yes">YES — Switch Mobile & Admin Apps to New Session</option>
                  <option value="no">NO — Prepare as Future Session</option>
                </select>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <label style={{ fontSize: 12, fontWeight: 700, color: '#475569', display: 'block', marginBottom: 4 }}>Start Date</label>
                <input
                  type="date"
                  className="avm-input"
                  value={newSessionStart}
                  onChange={(e) => setNewSessionStart(e.target.value)}
                  required
                />
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 700, color: '#475569', display: 'block', marginBottom: 4 }}>End Date</label>
                <input
                  type="date"
                  className="avm-input"
                  value={newSessionEnd}
                  onChange={(e) => setNewSessionEnd(e.target.value)}
                  required
                />
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, padding: 12, backgroundColor: '#F8FAFC', borderRadius: 10, border: '1px solid #E2E8F0' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 12, fontWeight: 700, color: '#334155' }}>
                <input
                  type="checkbox"
                  checked={newSessionCopyForward}
                  onChange={(e) => setNewSessionCopyForward(e.target.checked)}
                />
                Copy Forward Students & Teachers (Auto-promote students to next class)
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 12, fontWeight: 700, color: '#334155' }}>
                <input
                  type="checkbox"
                  checked={newSessionCarryFees}
                  onChange={(e) => setNewSessionCarryFees(e.target.checked)}
                />
                Carry Forward Outstanding Fee Dues as Opening Balance in New Session
              </label>
            </div>

            <button type="submit" className="avm-btn-primary" style={{ width: '100%', marginTop: 6 }}>
              Create Session & Copy Data
            </button>
          </form>
        </Modal>
      )}

      {/* STUDENT PROMOTION MODAL */}
      {promoteModalOpen && (
        <Modal isOpen={promoteModalOpen} onClose={() => setPromoteModalOpen(false)} title="Batch Student Promotion">
          <form onSubmit={handlePromoteStudents} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <label style={{ fontSize: 12, fontWeight: 700, color: '#475569', display: 'block', marginBottom: 4 }}>From Session</label>
                <input type="text" className="avm-input" value={selectedSessionId} disabled />
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 700, color: '#475569', display: 'block', marginBottom: 4 }}>Target Promoted Session *</label>
                <select
                  className="avm-input"
                  value={promoToSessionId}
                  onChange={(e) => setPromoToSessionId(e.target.value)}
                >
                  {sessions.map((s) => (
                    <option key={s.id} value={s.id}>{s.name} ({s.status})</option>
                  ))}
                  {!sessions.some((s) => s.id === '2027-28') && (
                    <option value="2027-28">2027–28</option>
                  )}
                </select>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <label style={{ fontSize: 12, fontWeight: 700, color: '#475569', display: 'block', marginBottom: 4 }}>From Class</label>
                <select
                  className="avm-input"
                  value={promoFromClass}
                  onChange={(e) => setPromoFromClass(e.target.value)}
                >
                  {mockSchoolClasses.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 700, color: '#475569', display: 'block', marginBottom: 4 }}>To Class *</label>
                <select
                  className="avm-input"
                  value={promoToClass}
                  onChange={(e) => setPromoToClass(e.target.value)}
                >
                  {mockSchoolClasses.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                <label style={{ fontSize: 12, fontWeight: 700, color: '#475569' }}>Select Students to Promote:</label>
                <button
                  type="button"
                  onClick={() => {
                    const matchStus = students.filter((s) => s.className === promoFromClass).map((s) => s.id);
                    setSelectedStuForPromo(matchStus);
                  }}
                  style={{ fontSize: 11, color: '#1769E0', background: 'none', border: 'none', fontWeight: 700, cursor: 'pointer' }}
                >
                  Select All {promoFromClass}
                </button>
              </div>

              <div style={{ maxHeight: 180, overflowY: 'auto', border: '1px solid #E2E8F0', borderRadius: 8, padding: 8, display: 'flex', flexDirection: 'column', gap: 6 }}>
                {students.filter((s) => s.className === promoFromClass).length === 0 ? (
                  <div style={{ fontSize: 12, color: '#94A3B8', textAlign: 'center', padding: 12 }}>No students found in {promoFromClass}</div>
                ) : (
                  students.filter((s) => s.className === promoFromClass).map((stu) => {
                    const isChecked = selectedStuForPromo.includes(stu.id);
                    return (
                      <label key={stu.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 8px', borderRadius: 6, backgroundColor: isChecked ? '#EFF6FF' : 'transparent', cursor: 'pointer' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={(e) => {
                              if (e.target.checked) setSelectedStuForPromo((prev) => [...prev, stu.id]);
                              else setSelectedStuForPromo((prev) => prev.filter((id) => id !== stu.id));
                            }}
                          />
                          <span style={{ fontSize: 13, fontWeight: 700, color: '#0F172A' }}>{stu.name}</span>
                        </div>
                        <span style={{ fontSize: 11, color: '#64748B' }}>Roll: {stu.rollNo} • Admission: {stu.admissionNo}</span>
                      </label>
                    );
                  })
                )}
              </div>
            </div>

            <button
              type="submit"
              className="avm-btn-primary"
              disabled={selectedStuForPromo.length === 0}
              style={{ width: '100%', marginTop: 6 }}
            >
              Promote Selected ({selectedStuForPromo.length}) to {promoToClass}
            </button>
          </form>
        </Modal>
      )}

      {/* MODAL: Create Examination */}
      {createExamModalOpen && (
        <Modal isOpen={createExamModalOpen} title="Create New Examination" onClose={() => setCreateExamModalOpen(false)}>
          <form onSubmit={handleCreateExamSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div>
              <label style={{ fontSize: 12, fontWeight: 700, color: '#475569', display: 'block', marginBottom: 4 }}>Academic Session:</label>
              <input
                type="text"
                className="avm-input"
                value={selectedSessionId}
                disabled
                style={{ backgroundColor: '#F1F5F9', fontWeight: 800 }}
              />
            </div>

            <div>
              <label style={{ fontSize: 12, fontWeight: 700, color: '#475569', display: 'block', marginBottom: 4 }}>Exam Name:</label>
              <input
                type="text"
                className="avm-input"
                value={examFormName}
                onChange={(e) => setExamFormName(e.target.value)}
                placeholder="e.g. Periodic Test 1"
                required
              />
            </div>

            <div>
              <label style={{ fontSize: 12, fontWeight: 700, color: '#475569', display: 'block', marginBottom: 4 }}>Exam Type:</label>
              <select
                className="avm-input"
                value={examFormType}
                onChange={(e) => setExamFormType(e.target.value)}
              >
                <option value="Periodic Test 1">Periodic Test 1</option>
                <option value="Half-Yearly Examination">Half-Yearly Examination</option>
                <option value="Annual / Final Examination">Annual / Final Examination</option>
                <option value="Other">Other / Special Exam</option>
              </select>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <label style={{ fontSize: 12, fontWeight: 700, color: '#475569', display: 'block', marginBottom: 4 }}>Start Date:</label>
                <input
                  type="date"
                  className="avm-input"
                  value={examFormStart}
                  onChange={(e) => setExamFormStart(e.target.value)}
                  required
                />
              </div>

              <div>
                <label style={{ fontSize: 12, fontWeight: 700, color: '#475569', display: 'block', marginBottom: 4 }}>End Date:</label>
                <input
                  type="date"
                  className="avm-input"
                  value={examFormEnd}
                  onChange={(e) => setExamFormEnd(e.target.value)}
                  required
                />
              </div>
            </div>

            <div>
              <label style={{ fontSize: 12, fontWeight: 700, color: '#475569', display: 'block', marginBottom: 4 }}>Description / Instructions:</label>
              <textarea
                className="avm-input"
                rows={3}
                value={examFormDesc}
                onChange={(e) => setExamFormDesc(e.target.value)}
                placeholder="First periodic assessment for the academic session..."
              />
            </div>

            <div>
              <label style={{ fontSize: 12, fontWeight: 700, color: '#475569', display: 'block', marginBottom: 4 }}>Exam Status:</label>
              <select
                className="avm-input"
                value={examFormStatus}
                onChange={(e) => setExamFormStatus(e.target.value)}
              >
                <option value="Scheduled">Scheduled</option>
                <option value="Ongoing">Ongoing</option>
                <option value="Completed">Completed</option>
                <option value="Cancelled">Cancelled</option>
              </select>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 10 }}>
              <button type="button" className="avm-btn-secondary" onClick={() => setCreateExamModalOpen(false)}>Cancel</button>
              <button type="submit" className="avm-btn-primary" disabled={schSaving}>
                {schSaving ? 'Creating...' : 'Create Examination'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* MODAL: Edit Subject Exam Schedule */}
      {editScheduleModalOpen && (
        <Modal isOpen={editScheduleModalOpen} title={`Edit Schedule — ${schSubject} (${examClassFilter})`} onClose={() => setEditScheduleModalOpen(false)}>
          <form onSubmit={handleSaveSubjectSchedule} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div>
              <label style={{ fontSize: 12, fontWeight: 700, color: '#475569', display: 'block', marginBottom: 4 }}>Subject Name:</label>
              <input type="text" className="avm-input" value={schSubject} disabled style={{ backgroundColor: '#F1F5F9', fontWeight: 800 }} />
            </div>

            <div>
              <label style={{ fontSize: 12, fontWeight: 700, color: '#475569', display: 'block', marginBottom: 4 }}>Exam Date:</label>
              <input
                type="date"
                className="avm-input"
                value={schDate}
                onChange={(e) => setSchDate(e.target.value)}
                required
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <label style={{ fontSize: 12, fontWeight: 700, color: '#475569', display: 'block', marginBottom: 4 }}>Start Time:</label>
                <input
                  type="text"
                  className="avm-input"
                  value={schStartTime}
                  onChange={(e) => setSchStartTime(e.target.value)}
                  placeholder="09:00 AM"
                  required
                />
              </div>

              <div>
                <label style={{ fontSize: 12, fontWeight: 700, color: '#475569', display: 'block', marginBottom: 4 }}>End Time:</label>
                <input
                  type="text"
                  className="avm-input"
                  value={schEndTime}
                  onChange={(e) => setSchEndTime(e.target.value)}
                  placeholder="10:00 AM"
                  required
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <label style={{ fontSize: 12, fontWeight: 700, color: '#475569', display: 'block', marginBottom: 4 }}>Maximum Marks:</label>
                <input
                  type="number"
                  className="avm-input"
                  value={schMaxMarks}
                  onChange={(e) => setSchMaxMarks(Number(e.target.value))}
                  required
                />
              </div>

              <div>
                <label style={{ fontSize: 12, fontWeight: 700, color: '#475569', display: 'block', marginBottom: 4 }}>Passing Marks:</label>
                <input
                  type="number"
                  className="avm-input"
                  value={schPassMarks}
                  onChange={(e) => setSchPassMarks(Number(e.target.value))}
                  required
                />
              </div>
            </div>

            <div>
              <label style={{ fontSize: 12, fontWeight: 700, color: '#475569', display: 'block', marginBottom: 4 }}>Room No / Location:</label>
              <input
                type="text"
                className="avm-input"
                value={schRoomNo}
                onChange={(e) => setSchRoomNo(e.target.value)}
                placeholder="Room 5"
                required
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 10 }}>
              <button type="button" className="avm-btn-secondary" onClick={() => setEditScheduleModalOpen(false)}>Cancel</button>
              <button type="submit" className="avm-btn-primary" disabled={schSaving}>
                {schSaving ? 'Saving...' : 'Save Schedule'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* MODAL: Edit Single Student Mark */}
      {editSingleMarkModalOpen && singleMarkStudent && (
        <Modal isOpen={editSingleMarkModalOpen} title={`Edit Marks — ${singleMarkStudent.name} (${singleMarkSubject})`} onClose={() => setEditSingleMarkModalOpen(false)}>
          <form onSubmit={handleSaveSingleMark} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ backgroundColor: '#F8FAFC', padding: 12, borderRadius: 8, border: '1px solid #E2E8F0', fontSize: 12, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              <div><span style={{ color: '#64748B' }}>Student Name:</span> <strong style={{ color: '#0F172A' }}>{singleMarkStudent.name}</strong></div>
              <div><span style={{ color: '#64748B' }}>Admission No:</span> <strong style={{ color: '#1769E0' }}>{singleMarkStudent.admissionNo}</strong></div>
              <div><span style={{ color: '#64748B' }}>Class & Section:</span> <strong style={{ color: '#0F172A' }}>{singleMarkStudent.className}-{singleMarkStudent.section || 'A'}</strong></div>
              <div><span style={{ color: '#64748B' }}>Session:</span> <strong style={{ color: '#0F172A' }}>{selectedSessionId}</strong></div>
            </div>

            <div>
              <label style={{ fontSize: 12, fontWeight: 700, color: '#475569', display: 'block', marginBottom: 4 }}>Examination:</label>
              <select
                className="avm-input"
                value={singleMarkExam}
                onChange={(e) => setSingleMarkExam(e.target.value)}
              >
                <option value="First Term Examination">First Term Examination</option>
                <option value="Half Yearly Examination">Half Yearly Examination</option>
                <option value="Annual Examination">Annual Examination</option>
              </select>
            </div>

            <div>
              <label style={{ fontSize: 12, fontWeight: 700, color: '#475569', display: 'block', marginBottom: 4 }}>Subject:</label>
              <input type="text" className="avm-input" value={singleMarkSubject} disabled style={{ backgroundColor: '#F1F5F9', fontWeight: 800 }} />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <label style={{ fontSize: 12, fontWeight: 700, color: '#475569', display: 'block', marginBottom: 4 }}>Marks Obtained:</label>
                <input
                  type="number"
                  min={0}
                  max={singleMarkMaxVal}
                  className="avm-input"
                  value={singleMarkVal}
                  onChange={(e) => setSingleMarkVal(Number(e.target.value))}
                  required
                />
              </div>

              <div>
                <label style={{ fontSize: 12, fontWeight: 700, color: '#475569', display: 'block', marginBottom: 4 }}>Maximum Marks:</label>
                <input
                  type="number"
                  min={1}
                  className="avm-input"
                  value={singleMarkMaxVal}
                  onChange={(e) => setSingleMarkMaxVal(Number(e.target.value))}
                  required
                />
              </div>
            </div>

            <div style={{ backgroundColor: '#EFF6FF', padding: 10, borderRadius: 8, display: 'flex', justifyContent: 'space-between', fontSize: 13, fontWeight: 800, color: '#1E40AF' }}>
              <span>Percentage: {singleMarkMaxVal > 0 ? Math.round((singleMarkVal / singleMarkMaxVal) * 100 * 10) / 10 : 0}%</span>
              <span>Grade: {calculateGradeFromMarks(singleMarkVal, singleMarkMaxVal)}</span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 10 }}>
              <button type="button" className="avm-btn-secondary" onClick={() => setEditSingleMarkModalOpen(false)}>Cancel</button>
              <button type="submit" className="avm-btn-primary" disabled={marksSaving}>
                {marksSaving ? 'Saving...' : 'Save Marks'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* MODAL: View Student Academic Marks Sheet */}
      {viewStudentMarks && (
        <Modal isOpen={!!viewStudentMarks} title={`Academic Performance — ${viewStudentMarks.name}`} onClose={() => setViewStudentMarks(null)} maxWidth="680px">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ backgroundColor: '#F8FAFC', padding: 14, borderRadius: 12, border: '1px solid #E2E8F0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h4 style={{ fontSize: 16, fontWeight: 900, color: '#0F172A', margin: 0 }}>{viewStudentMarks.name}</h4>
                <div style={{ fontSize: 12, color: '#64748B', marginTop: 2 }}>
                  Admission: <strong>{viewStudentMarks.admissionNo}</strong> • Roll: <strong>{viewStudentMarks.rollNo || '-'}</strong> • Class: <strong>{viewStudentMarks.className}-{viewStudentMarks.section || 'A'}</strong>
                </div>
              </div>
              <span style={{ backgroundColor: '#EFF6FF', color: '#1769E0', fontWeight: 800, padding: '4px 12px', borderRadius: 20, fontSize: 12 }}>
                Session {selectedSessionId}
              </span>
            </div>

            {['First Term Examination', 'Half Yearly Examination', 'Annual Examination'].map((exName) => {
              const stuExamMarks = marksList.filter(
                (m: any) =>
                  m.studentId === viewStudentMarks.id &&
                  (m.examId === exName || m.examName === exName) &&
                  (!m.academicSessionId || m.academicSessionId === selectedSessionId)
              );

              const totalObtained = stuExamMarks.reduce((acc, curr) => acc + Number(curr.marksObtained !== undefined ? curr.marksObtained : curr.marks || 0), 0);
              const totalMax = stuExamMarks.reduce((acc, curr) => acc + Number(curr.maxMarks || curr.maximumMarks || 100), 0);
              const totalPct = totalMax > 0 ? Math.round((totalObtained / totalMax) * 100 * 10) / 10 : 0;
              const totalGrade = calculateGradeFromMarks(totalObtained, totalMax);

              return (
                <div key={exName} style={{ border: '1px solid #E2E8F0', borderRadius: 10, overflow: 'hidden' }}>
                  <div style={{ backgroundColor: '#F1F5F9', padding: '10px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h5 style={{ fontSize: 14, fontWeight: 800, color: '#0F172A', margin: 0 }}>{exName}</h5>
                    {totalMax > 0 && (
                      <span style={{ fontSize: 12, fontWeight: 800, color: '#1769E0' }}>
                        Total: {totalObtained} / {totalMax} ({totalPct}% — Grade {totalGrade})
                      </span>
                    )}
                  </div>

                  {stuExamMarks.length === 0 ? (
                    <div style={{ padding: 14, fontSize: 12, color: '#94A3B8', textAlign: 'center' }}>
                      No marks recorded for {exName} yet.
                    </div>
                  ) : (
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                      <thead>
                        <tr style={{ backgroundColor: '#FAFAFA', borderBottom: '1px solid #E2E8F0', color: '#64748B', textAlign: 'left' }}>
                          <th style={{ padding: '8px 12px' }}>Subject</th>
                          <th style={{ padding: '8px 12px' }}>Marks Obtained</th>
                          <th style={{ padding: '8px 12px' }}>Max Marks</th>
                          <th style={{ padding: '8px 12px' }}>Percentage</th>
                          <th style={{ padding: '8px 12px' }}>Grade</th>
                          <th style={{ padding: '8px 12px', textAlign: 'right' }}>Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {stuExamMarks.map((m: any, idx: number) => {
                          const obtained = Number(m.marksObtained !== undefined ? m.marksObtained : m.marks || 0);
                          const max = Number(m.maxMarks || m.maximumMarks || 100);
                          const pct = m.percentage !== undefined ? m.percentage : Math.round((obtained / max) * 100 * 10) / 10;
                          const grade = m.grade || calculateGradeFromMarks(obtained, max);

                          return (
                            <tr key={idx} style={{ borderBottom: '1px solid #F1F5F9' }}>
                              <td style={{ padding: '8px 12px', fontWeight: 800 }}>{m.subject}</td>
                              <td style={{ padding: '8px 12px', fontWeight: 800, color: '#16A34A' }}>{obtained}</td>
                              <td style={{ padding: '8px 12px', color: '#64748B' }}>{max}</td>
                              <td style={{ padding: '8px 12px', fontWeight: 700 }}>{pct}%</td>
                              <td style={{ padding: '8px 12px' }}>
                                <span style={{ backgroundColor: '#EFF6FF', color: '#1D4ED8', fontWeight: 800, padding: '2px 6px', borderRadius: 8, fontSize: 11 }}>
                                  {grade}
                                </span>
                              </td>
                              <td style={{ padding: '8px 12px', textAlign: 'right' }}>
                                <button
                                  type="button"
                                  className="avm-btn-secondary"
                                  onClick={() => handleOpenSingleMarkModal(viewStudentMarks, m.subject, exName)}
                                  style={{ padding: '3px 8px', fontSize: 11, fontWeight: 700 }}
                                >
                                  Edit
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  )}
                </div>
              );
            })}
          </div>
        </Modal>
      )}

      {/* MODAL: View Result Details */}
      {viewResultStudent && (
        <Modal isOpen={!!viewResultStudent} title={`Result Details — ${viewResultStudent.name}`} onClose={() => setViewResultStudent(null)} maxWidth="640px">
          {(() => {
            const resObj = calculateStudentResult(viewResultStudent, resExamFilter || 'Half Yearly Examination');
            const isEarly = resObj.isEarlyYears;
            const isPass = (resObj.percentage ?? 0) >= 40;

            return (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {/* Result Header */}
                <div style={{ backgroundColor: '#F8FAFC', padding: 16, borderRadius: 12, border: '1px solid #E2E8F0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <h3 style={{ fontSize: 17, fontWeight: 900, color: '#0F172A', margin: 0 }}>{viewResultStudent.name}</h3>
                    <div style={{ fontSize: 12, color: '#64748B', marginTop: 4 }}>
                      Admission: <strong style={{ color: '#1769E0' }}>{viewResultStudent.admissionNo}</strong> • Roll: <strong>{viewResultStudent.rollNo || '-'}</strong> • Class: <strong>{viewResultStudent.className}-{viewResultStudent.section || 'A'}</strong>
                    </div>
                    <div style={{ fontSize: 12, color: '#475569', marginTop: 2 }}>
                      Exam: <strong>{resObj.examName}</strong> • Session: <strong>{selectedSessionId}</strong>
                    </div>
                  </div>
                  <span style={{
                    backgroundColor: isEarly ? '#EFF6FF' : isPass ? '#DCFCE7' : '#FEE2E2',
                    color: isEarly ? '#1D4ED8' : isPass ? '#15803D' : '#B91C1C',
                    fontWeight: 900,
                    padding: '6px 14px',
                    borderRadius: 20,
                    fontSize: 13
                  }}>
                    {isEarly ? 'DEVELOPMENTAL ASSESSMENT' : isPass ? 'RESULT: PASS' : 'RESULT: FAIL'}
                  </span>
                </div>

                {/* Subject Marks Table */}
                {!isEarly && resObj.marks ? (
                  <div style={{ border: '1px solid #E2E8F0', borderRadius: 10, overflow: 'hidden' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                      <thead>
                        <tr style={{ backgroundColor: '#1769E0', color: '#FFFFFF', textAlign: 'left' }}>
                          <th style={{ padding: 10 }}>Subject</th>
                          <th style={{ padding: 10, textAlign: 'center' }}>Obtained</th>
                          <th style={{ padding: 10, textAlign: 'center' }}>Maximum</th>
                          <th style={{ padding: 10, textAlign: 'center' }}>Percentage</th>
                          <th style={{ padding: 10, textAlign: 'center' }}>Grade</th>
                        </tr>
                      </thead>
                      <tbody>
                        {resObj.marks.map((item: any, idx: number) => {
                          const pct = item.maxMarks > 0 ? Math.round((item.marksObtained / item.maxMarks) * 100 * 10) / 10 : 0;
                          return (
                            <tr key={idx} style={{ borderBottom: '1px solid #F1F5F9' }}>
                              <td style={{ padding: 10, fontWeight: 800, color: '#0F172A' }}>{item.subject}</td>
                              <td style={{ padding: 10, textAlign: 'center', fontWeight: 900, color: '#16A34A' }}>{item.marksObtained}</td>
                              <td style={{ padding: 10, textAlign: 'center', color: '#64748B' }}>{item.maxMarks}</td>
                              <td style={{ padding: 10, textAlign: 'center', fontWeight: 700 }}>{pct}%</td>
                              <td style={{ padding: 10, textAlign: 'center' }}>
                                <span style={{ backgroundColor: '#EFF6FF', color: '#1D4ED8', fontWeight: 800, padding: '2px 8px', borderRadius: 10, fontSize: 11 }}>
                                  {item.grade}
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                        <tr style={{ backgroundColor: '#EFF6FF', fontWeight: 900 }}>
                          <td style={{ padding: 12, color: '#1E40AF' }}>TOTAL / OVERALL</td>
                          <td style={{ padding: 12, textAlign: 'center', color: '#16A34A', fontSize: 15 }}>{resObj.totalObtained}</td>
                          <td style={{ padding: 12, textAlign: 'center', color: '#64748B' }}>{resObj.totalMax}</td>
                          <td style={{ padding: 12, textAlign: 'center', color: '#1E40AF' }}>{resObj.percentage}%</td>
                          <td style={{ padding: 12, textAlign: 'center' }}>
                            <span style={{ backgroundColor: '#1769E0', color: '#FFFFFF', padding: '3px 10px', borderRadius: 12, fontSize: 12 }}>
                              {resObj.grade}
                            </span>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                ) : (
                  /* Early Years Developmental Assessment */
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {resObj.skillsEvaluation?.map((sk: any, idx: number) => (
                      <div key={idx} style={{ backgroundColor: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 10, padding: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                          <div style={{ fontWeight: 800, color: '#0F172A', fontSize: 13 }}>{sk.category}</div>
                          <div style={{ fontSize: 11, color: '#64748B', marginTop: 2 }}>{sk.remark}</div>
                        </div>
                        <span style={{ backgroundColor: '#DCFCE7', color: '#15803D', fontWeight: 900, padding: '4px 12px', borderRadius: 20, fontSize: 12 }}>
                          {sk.rating}
                        </span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Footer Actions */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 10 }}>
                  <button type="button" className="avm-btn-secondary" onClick={() => setViewResultStudent(null)}>
                    Close
                  </button>
                  <div style={{ display: 'flex', gap: 10 }}>
                    <button
                      type="button"
                      className="avm-btn-secondary"
                      onClick={() => startEditingStudentResult(viewResultStudent)}
                      style={{ display: 'flex', alignItems: 'center', gap: 6, borderColor: '#1769E0', color: '#1769E0' }}
                    >
                      <Edit size={15} /> Edit Result
                    </button>
                    <button
                      type="button"
                      className="avm-btn-primary"
                      onClick={() => {
                        setPreviewReportCardStudent(viewResultStudent);
                        setViewResultStudent(null);
                      }}
                      style={{ display: 'flex', alignItems: 'center', gap: 6 }}
                    >
                      <Printer size={15} /> Generate Official Report Card
                    </button>
                  </div>
                </div>
              </div>
            );
          })()}
        </Modal>
      )}

      {/* MODAL: Edit Result Details */}
      {editResultStudent && (
        <Modal
          isOpen={!!editResultStudent}
          title={`Edit Result — ${editResultStudent.name}`}
          onClose={() => {
            setEditResultStudent(null);
            setEditResultError(null);
          }}
          maxWidth="720px"
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* Student Header Info */}
            <div style={{ backgroundColor: '#F8FAFC', padding: 14, borderRadius: 10, border: '1px solid #E2E8F0', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 10, fontSize: 12 }}>
              <div><span style={{ color: '#64748B' }}>Student Name:</span> <strong style={{ color: '#0F172A', display: 'block', fontSize: 13 }}>{editResultStudent.name}</strong></div>
              <div><span style={{ color: '#64748B' }}>Admission No:</span> <strong style={{ color: '#1769E0', display: 'block', fontSize: 13 }}>{editResultStudent.admissionNo}</strong></div>
              <div><span style={{ color: '#64748B' }}>Roll / Class:</span> <strong style={{ color: '#0F172A', display: 'block' }}>Roll: {editResultStudent.rollNo || '-'} • {editResultStudent.className}-{editResultStudent.section || 'A'}</strong></div>
              <div><span style={{ color: '#64748B' }}>Examination:</span> <strong style={{ color: '#0F172A', display: 'block' }}>{resExamFilter || 'Half Yearly Examination'}</strong></div>
              <div><span style={{ color: '#64748B' }}>Academic Session:</span> <strong style={{ color: '#1769E0', display: 'block' }}>{selectedSessionId}</strong></div>
            </div>

            {/* Error Banner */}
            {editResultError && (
              <div style={{ backgroundColor: '#FEF2F2', border: '1px solid #FCA5A5', color: '#B91C1C', padding: '10px 14px', borderRadius: 8, fontSize: 13, display: 'flex', alignItems: 'center', gap: 8 }}>
                <AlertCircle size={16} />
                <span>{editResultError}</span>
              </div>
            )}

            {/* Subject Table */}
            <div style={{ border: '1px solid #E2E8F0', borderRadius: 10, overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead>
                  <tr style={{ backgroundColor: '#1769E0', color: '#FFFFFF', textAlign: 'left' }}>
                    <th style={{ padding: 10 }}>Subject</th>
                    <th style={{ padding: 10, textAlign: 'center', width: '130px' }}>Marks Obtained</th>
                    <th style={{ padding: 10, textAlign: 'center', width: '130px' }}>Maximum Marks</th>
                    <th style={{ padding: 10, textAlign: 'center', width: '90px' }}>Percentage</th>
                    <th style={{ padding: 10, textAlign: 'center', width: '80px' }}>Grade</th>
                    <th style={{ padding: 10, textAlign: 'center', width: '60px' }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {editSubjectItems.map((item, idx) => {
                    const obtained = Number(item.marksObtained || 0);
                    const max = Number(item.maxMarks || 0);
                    const pct = max > 0 ? Math.round((obtained / max) * 100 * 10) / 10 : 0;
                    const grade = calculateGradeFromMarks(obtained, max);

                    return (
                      <tr key={item.id || idx} style={{ borderBottom: '1px solid #F1F5F9', backgroundColor: idx % 2 === 0 ? '#FFFFFF' : '#F8FAFC' }}>
                        <td style={{ padding: '8px 10px' }}>
                          <input
                            type="text"
                            className="avm-input"
                            placeholder="e.g. Mathematics"
                            value={item.subject}
                            onChange={(e) => handleUpdateEditSubject(idx, 'subject', e.target.value)}
                            style={{ padding: '6px 10px', fontSize: 13, width: '100%' }}
                          />
                        </td>
                        <td style={{ padding: '8px 10px', textAlign: 'center' }}>
                          <input
                            type="number"
                            className="avm-input"
                            min="0"
                            max={item.maxMarks}
                            value={item.marksObtained}
                            onChange={(e) => handleUpdateEditSubject(idx, 'marksObtained', e.target.value === '' ? '' : Number(e.target.value))}
                            style={{ padding: '6px 8px', fontSize: 13, textAlign: 'center', fontWeight: 800, color: '#16A34A', width: '100px' }}
                          />
                        </td>
                        <td style={{ padding: '8px 10px', textAlign: 'center' }}>
                          <input
                            type="number"
                            className="avm-input"
                            min="1"
                            value={item.maxMarks}
                            onChange={(e) => handleUpdateEditSubject(idx, 'maxMarks', e.target.value === '' ? '' : Number(e.target.value))}
                            style={{ padding: '6px 8px', fontSize: 13, textAlign: 'center', color: '#64748B', width: '100px' }}
                          />
                        </td>
                        <td style={{ padding: '8px 10px', textAlign: 'center', fontWeight: 700, color: '#1E40AF' }}>
                          {pct}%
                        </td>
                        <td style={{ padding: '8px 10px', textAlign: 'center' }}>
                          <span style={{ backgroundColor: '#EFF6FF', color: '#1D4ED8', fontWeight: 800, padding: '3px 10px', borderRadius: 10, fontSize: 12 }}>
                            {grade}
                          </span>
                        </td>
                        <td style={{ padding: '8px 10px', textAlign: 'center' }}>
                          <button
                            type="button"
                            title="Remove Subject"
                            onClick={() => setDeleteConfirmSubjectIndex(idx)}
                            style={{ backgroundColor: '#FEE2E2', border: 'none', color: '#DC2626', width: 32, height: 32, borderRadius: 8, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}
                          >
                            <Trash2 size={15} />
                          </button>
                        </td>
                      </tr>
                    );
                  })}

                  {/* TOTAL / OVERALL ROW */}
                  {(() => {
                    const totObtained = editSubjectItems.reduce((acc, curr) => acc + Number(curr.marksObtained || 0), 0);
                    const totMax = editSubjectItems.reduce((acc, curr) => acc + Number(curr.maxMarks || 0), 0);
                    const overallPct = totMax > 0 ? Math.round((totObtained / totMax) * 100 * 10) / 10 : 0;
                    const overallGrade = calculateGradeFromMarks(totObtained, totMax);

                    return (
                      <tr style={{ backgroundColor: '#EFF6FF', fontWeight: 900 }}>
                        <td style={{ padding: 12, color: '#1E40AF' }}>TOTAL / OVERALL</td>
                        <td style={{ padding: 12, textAlign: 'center', color: '#16A34A', fontSize: 15 }}>{totObtained}</td>
                        <td style={{ padding: 12, textAlign: 'center', color: '#64748B' }}>{totMax}</td>
                        <td style={{ padding: 12, textAlign: 'center', color: '#1E40AF' }}>{overallPct}%</td>
                        <td style={{ padding: 12, textAlign: 'center' }}>
                          <span style={{ backgroundColor: '#1769E0', color: '#FFFFFF', padding: '3px 10px', borderRadius: 12, fontSize: 12 }}>
                            {overallGrade}
                          </span>
                        </td>
                        <td></td>
                      </tr>
                    );
                  })()}
                </tbody>
              </table>
            </div>

            {/* Add Subject Button */}
            <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
              <button
                type="button"
                className="avm-btn-secondary"
                onClick={handleAddEditSubject}
                style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 14px', fontSize: 13, borderColor: '#1769E0', color: '#1769E0' }}
              >
                <Plus size={15} /> Add Subject
              </button>
            </div>

            {/* Modal Actions */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 12 }}>
              <button
                type="button"
                className="avm-btn-secondary"
                onClick={() => {
                  setEditResultStudent(null);
                  setEditResultError(null);
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                className="avm-btn-primary"
                onClick={handleSaveStudentResult}
                style={{ padding: '8px 22px', fontSize: 14 }}
              >
                Save Result
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Confirmation Modal for Subject Deletion */}
      {deleteConfirmSubjectIndex !== null && editSubjectItems[deleteConfirmSubjectIndex] && (
        <Modal
          isOpen={deleteConfirmSubjectIndex !== null}
          title="Confirm Remove Subject"
          onClose={() => setDeleteConfirmSubjectIndex(null)}
          maxWidth="400px"
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: '#DC2626' }}>
              <AlertCircle size={22} />
              <strong style={{ fontSize: 15 }}>Remove Subject</strong>
            </div>
            <p style={{ margin: 0, fontSize: 13, color: '#475569' }}>
              Are you sure you want to remove <strong>"{editSubjectItems[deleteConfirmSubjectIndex].subject || 'this subject'}"</strong>?
            </p>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 10 }}>
              <button
                type="button"
                className="avm-btn-secondary"
                onClick={() => setDeleteConfirmSubjectIndex(null)}
              >
                Cancel
              </button>
              <button
                type="button"
                style={{ backgroundColor: '#DC2626', color: '#FFFFFF', border: 'none', borderRadius: 8, padding: '8px 16px', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}
                onClick={() => {
                  setEditSubjectItems((prev) => prev.filter((_, idx) => idx !== deleteConfirmSubjectIndex));
                  setDeleteConfirmSubjectIndex(null);
                }}
              >
                Remove Subject
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Save Success Toast */}
      {resultSaveToast && (
        <div style={{
          position: 'fixed',
          bottom: 24,
          right: 24,
          backgroundColor: '#16A34A',
          color: '#FFFFFF',
          padding: '12px 20px',
          borderRadius: 10,
          boxShadow: '0 4px 14px rgba(0,0,0,0.18)',
          fontWeight: 800,
          fontSize: 14,
          zIndex: 9999,
          display: 'flex',
          alignItems: 'center',
          gap: 8
        }}>
          <CheckCircle2 size={18} />
          <span>{resultSaveToast}</span>
        </div>
      )}

      {/* MODAL: Printable Official Report Card */}
      {previewReportCardStudent && (
        <ReportCardModal
          isOpen={!!previewReportCardStudent}
          onClose={() => setPreviewReportCardStudent(null)}
          student={previewReportCardStudent}
          result={calculateStudentResult(previewReportCardStudent, resExamFilter || 'Half Yearly Examination')}
        />
      )}

      {/* ========================================================= */}
      {/* CLASSES & SECTIONS MANAGEMENT MODALS                      */}
      {/* ========================================================= */}

      {/* 1. MODAL: View Class Details */}
      {viewingClassRecord && (
        <Modal
          isOpen={!!viewingClassRecord}
          title={`Class Overview — ${viewingClassRecord.name}`}
          onClose={() => setViewingClassRecord(null)}
          maxWidth="700px"
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            <div style={{ backgroundColor: '#F8FAFC', padding: 16, borderRadius: 12, border: '1px solid #E2E8F0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h3 style={{ fontSize: 20, fontWeight: 900, color: '#0F172A', margin: 0 }}>{viewingClassRecord.name}</h3>
                <div style={{ fontSize: 13, color: '#64748B', marginTop: 4 }}>
                  Academic Session: <strong style={{ color: '#1769E0' }}>{selectedSessionId}</strong> • Main Teacher: <strong>{viewingClassRecord.classTeacherName || 'Not Assigned'}</strong>
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <span style={{ backgroundColor: viewingClassRecord.status === 'Active' ? '#DCFCE7' : '#F1F5F9', color: viewingClassRecord.status === 'Active' ? '#15803D' : '#64748B', fontWeight: 800, padding: '4px 12px', borderRadius: 20, fontSize: 12 }}>
                  {viewingClassRecord.status || 'Active'}
                </span>
                <div style={{ fontSize: 13, fontWeight: 800, color: '#1769E0', marginTop: 6 }}>
                  Total Students: {getStudentsForClass(viewingClassRecord.name).length}
                </div>
              </div>
            </div>

            <div style={{ fontSize: 14, fontWeight: 800, color: '#334155' }}>
              Section-wise Breakdown ({viewingClassRecord.sections.length} Sections)
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 14 }}>
              {viewingClassRecord.sections.map((sec) => {
                const secStuCount = getStudentsForSection(viewingClassRecord.name, sec.name).length;
                return (
                  <div key={sec.id || sec.name} style={{ backgroundColor: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 12, padding: 14, boxShadow: '0 2px 6px rgba(0,0,0,0.03)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                      <span style={{ fontSize: 15, fontWeight: 900, color: '#1E40AF', backgroundColor: '#EFF6FF', padding: '4px 10px', borderRadius: 8 }}>
                        SECTION {sec.name}
                      </span>
                      <span style={{ fontSize: 11, fontWeight: 700, color: sec.status === 'Active' ? '#16A34A' : '#94A3B8' }}>
                        {sec.status || 'Active'}
                      </span>
                    </div>

                    <div style={{ fontSize: 12, color: '#475569', marginBottom: 4 }}>
                      Teacher: <strong>{sec.classTeacherName || 'Not Assigned'}</strong>
                    </div>
                    {sec.roomNumber && (
                      <div style={{ fontSize: 12, color: '#64748B', marginBottom: 4 }}>
                        Room: <strong>{sec.roomNumber}</strong>
                      </div>
                    )}
                    <div style={{ fontSize: 12, color: '#475569', marginBottom: 12 }}>
                      Students: <strong>{secStuCount}</strong> / {sec.capacity || 30}
                    </div>

                    <button
                      type="button"
                      className="avm-btn-secondary"
                      onClick={() => {
                        setViewingClassRecord(null);
                        setClassFilter(`${viewingClassRecord.name}-${sec.name}`);
                        setActiveTab('students');
                      }}
                      style={{ width: '100%', fontSize: 12, padding: '6px', justifyContent: 'center' }}
                    >
                      View Students
                    </button>
                  </div>
                );
              })}
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 10 }}>
              <button type="button" className="avm-btn-secondary" onClick={() => setViewingClassRecord(null)}>
                Close
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* 2. MODAL: Manage Sections */}
      {managingSectionsClass && (
        <Modal
          isOpen={!!managingSectionsClass}
          title={`Manage Sections — ${managingSectionsClass.name}`}
          onClose={() => setManagingSectionsClass(null)}
          maxWidth="640px"
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ fontSize: 13, color: '#64748B' }}>
              Manage and configure sections for <strong>{managingSectionsClass.name}</strong> (Academic Session: {selectedSessionId})
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {managingSectionsClass.sections.map((sec) => {
                const secStuCount = getStudentsForSection(managingSectionsClass.name, sec.name).length;
                return (
                  <div key={sec.id || sec.name} style={{ backgroundColor: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 10, padding: 14, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ fontSize: 15, fontWeight: 900, color: '#0F172A' }}>Section {sec.name}</span>
                        <span style={{ backgroundColor: sec.status === 'Active' ? '#DCFCE7' : '#F1F5F9', color: sec.status === 'Active' ? '#15803D' : '#64748B', fontSize: 11, fontWeight: 800, padding: '2px 8px', borderRadius: 12 }}>
                          {sec.status || 'Active'}
                        </span>
                      </div>
                      <div style={{ fontSize: 12, color: '#475569', marginTop: 4 }}>
                        Teacher: <strong>{sec.classTeacherName || 'Not Assigned'}</strong> • Students: <strong>{secStuCount}</strong> • Capacity: <strong>{sec.capacity || 30}</strong> {sec.roomNumber ? `• Room: ${sec.roomNumber}` : ''}
                      </div>
                    </div>

                    <button
                      type="button"
                      className="avm-btn-secondary"
                      onClick={() => setEditingSectionInfo({ targetClass: managingSectionsClass, section: sec })}
                      style={{ padding: '6px 14px', fontSize: 12 }}
                    >
                      Edit
                    </button>
                  </div>
                );
              })}
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 12 }}>
              <button
                type="button"
                className="avm-btn-primary"
                onClick={() => {
                  setIsAddingSectionToClass(managingSectionsClass);
                }}
                style={{ display: 'flex', alignItems: 'center', gap: 6 }}
              >
                <Plus size={16} /> + Add Section
              </button>
              <button type="button" className="avm-btn-secondary" onClick={() => setManagingSectionsClass(null)}>
                Done
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* MODAL: Manage Class Subjects */}
      {managingSubjectsClassRecord && (
        <Modal
          isOpen={!!managingSubjectsClassRecord}
          title={`Class Subjects — ${managingSubjectsClassRecord.name}`}
          onClose={() => setManagingSubjectsClassRecord(null)}
          maxWidth="720px"
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: 13, color: '#64748B' }}>
                  Session: <strong style={{ color: '#1769E0' }}>{selectedSessionId}</strong> • Class: <strong>{managingSubjectsClassRecord.name}</strong>
                </div>
                <div style={{ fontSize: 12, color: '#475569', marginTop: 2 }}>
                  Configure academic & co-curricular subjects taught in this class.
                </div>
              </div>
              <button
                type="button"
                className="avm-btn-primary"
                onClick={openAddSubjectModal}
                style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', fontSize: 13 }}
              >
                <Plus size={16} /> + Add Subject
              </button>
            </div>

            {/* Subjects Table */}
            {(() => {
              const currentSubs = academicService.getSubjects(managingSubjectsClassRecord.name, selectedSessionId);
              if (currentSubs.length === 0) {
                return (
                  <div style={{ padding: 30, textAlign: 'center', backgroundColor: '#F8FAFC', borderRadius: 8, border: '1px dashed #CBD5E1' }}>
                    <BookOpen size={36} color="#94A3B8" style={{ marginBottom: 8 }} />
                    <div style={{ fontSize: 15, fontWeight: 800, color: '#0F172A' }}>No Subjects Configured</div>
                    <div style={{ fontSize: 12, color: '#64748B', marginTop: 4 }}>Click "+ Add Subject" to create subjects for {managingSubjectsClassRecord.name}.</div>
                  </div>
                );
              }

              return (
                <div style={{ border: '1px solid #E2E8F0', borderRadius: 8, overflow: 'hidden' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                    <thead>
                      <tr style={{ backgroundColor: '#1769E0', color: '#FFFFFF', textAlign: 'left' }}>
                        <th style={{ padding: '10px 12px' }}>S.No</th>
                        <th style={{ padding: '10px 12px' }}>Subject Name</th>
                        <th style={{ padding: '10px 12px' }}>Code</th>
                        <th style={{ padding: '10px 12px' }}>Max Marks</th>
                        <th style={{ padding: '10px 12px' }}>Pass Marks</th>
                        <th style={{ padding: '10px 12px' }}>Teacher</th>
                        <th style={{ padding: '10px 12px' }}>Type</th>
                        <th style={{ padding: '10px 12px', textAlign: 'right' }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {currentSubs.map((sub, idx) => (
                        <tr key={sub.id} style={{ borderBottom: '1px solid #F1F5F9', backgroundColor: idx % 2 === 0 ? '#FFFFFF' : '#F8FAFC' }}>
                          <td style={{ padding: '10px 12px', fontWeight: 700, color: '#64748B' }}>{idx + 1}</td>
                          <td style={{ padding: '10px 12px', fontWeight: 900, color: '#0F172A' }}>{sub.name}</td>
                          <td style={{ padding: '10px 12px', fontWeight: 800, color: '#1769E0' }}>{sub.code}</td>
                          <td style={{ padding: '10px 12px', fontWeight: 800 }}>{sub.maxMarks}</td>
                          <td style={{ padding: '10px 12px', color: '#64748B' }}>{sub.passingMarks}</td>
                          <td style={{ padding: '10px 12px', fontWeight: 600 }}>{sub.teacherName || 'Unassigned'}</td>
                          <td style={{ padding: '10px 12px' }}>
                            <span style={{
                              backgroundColor: sub.type === 'Activity' ? '#F3E8FF' : '#EFF6FF',
                              color: sub.type === 'Activity' ? '#7C3AED' : '#1D4ED8',
                              fontWeight: 800,
                              fontSize: 10,
                              padding: '2px 8px',
                              borderRadius: 8
                            }}>
                              {sub.type}
                            </span>
                          </td>
                          <td style={{ padding: '10px 12px', textAlign: 'right' }}>
                            <button
                              type="button"
                              className="avm-btn-secondary"
                              onClick={() => openEditSubjectModal(sub)}
                              style={{ padding: '4px 8px', fontSize: 11, marginRight: 6 }}
                            >
                              Edit
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteSubjectRequest(sub)}
                              style={{ backgroundColor: '#FEE2E2', color: '#DC2626', border: 'none', borderRadius: 6, padding: '4px 8px', fontSize: 11, fontWeight: 800, cursor: 'pointer' }}
                            >
                              Remove
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              );
            })()}

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 10 }}>
              <button type="button" className="avm-btn-secondary" onClick={() => setManagingSubjectsClassRecord(null)}>
                Done
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* MODAL: Add / Edit Subject Form */}
      {addSubjectModalOpen && (
        <Modal
          isOpen={addSubjectModalOpen}
          title={editingSubjectRecord ? `Edit Subject — ${editingSubjectRecord.name}` : `Add Subject — ${managingSubjectsClassRecord?.name}`}
          onClose={() => setAddSubjectModalOpen(false)}
          maxWidth="480px"
        >
          <form onSubmit={handleSaveSubject}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={{ fontSize: 12, fontWeight: 700, color: '#475569', display: 'block', marginBottom: 4 }}>Subject Name *</label>
                <input
                  type="text"
                  className="avm-input"
                  placeholder="e.g. Mathematics, Science, Rhymes, Moral Science"
                  value={subFormName}
                  onChange={(e) => setSubFormName(e.target.value)}
                  required
                />
              </div>

              <div>
                <label style={{ fontSize: 12, fontWeight: 700, color: '#475569', display: 'block', marginBottom: 4 }}>Subject Code</label>
                <input
                  type="text"
                  className="avm-input"
                  placeholder="e.g. MATH501"
                  value={subFormCode}
                  onChange={(e) => setSubFormCode(e.target.value)}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 700, color: '#475569', display: 'block', marginBottom: 4 }}>Maximum Marks *</label>
                  <input
                    type="number"
                    min={1}
                    max={200}
                    className="avm-input"
                    value={subFormMaxMarks}
                    onChange={(e) => setSubFormMaxMarks(Number(e.target.value))}
                    required
                  />
                </div>

                <div>
                  <label style={{ fontSize: 12, fontWeight: 700, color: '#475569', display: 'block', marginBottom: 4 }}>Passing Marks *</label>
                  <input
                    type="number"
                    min={1}
                    max={200}
                    className="avm-input"
                    value={subFormPassMarks}
                    onChange={(e) => setSubFormPassMarks(Number(e.target.value))}
                    required
                  />
                </div>
              </div>

              <div>
                <label style={{ fontSize: 12, fontWeight: 700, color: '#475569', display: 'block', marginBottom: 4 }}>Subject Teacher</label>
                <select
                  className="avm-input"
                  value={subFormTeacherId}
                  onChange={(e) => {
                    setSubFormTeacherId(e.target.value);
                    const emp = employees.find((em) => em.id === e.target.value);
                    if (emp) setSubFormTeacherName(emp.name);
                  }}
                >
                  <option value="">-- Select Employee --</option>
                  {employees.map((emp) => (
                    <option key={emp.id} value={emp.id}>{emp.name} ({emp.designation || 'Teacher'})</option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ fontSize: 12, fontWeight: 700, color: '#475569', display: 'block', marginBottom: 4 }}>Subject Type</label>
                <select
                  className="avm-input"
                  value={subFormType}
                  onChange={(e) => setSubFormType(e.target.value as 'Academic' | 'Activity')}
                >
                  <option value="Academic">Academic</option>
                  <option value="Activity">Activity / Co-Curricular</option>
                </select>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 10 }}>
                <button type="button" className="avm-btn-secondary" onClick={() => setAddSubjectModalOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="avm-btn-primary">
                  Save Subject
                </button>
              </div>
            </div>
          </form>
        </Modal>
      )}

      {/* MODAL: Subject Deletion Safety Warning */}
      {deletingSubjectRecord && (
        <Modal
          isOpen={!!deletingSubjectRecord}
          title={`Delete Subject — ${deletingSubjectRecord.name}`}
          onClose={() => setDeletingSubjectRecord(null)}
          maxWidth="460px"
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: '#DC2626' }}>
              <AlertCircle size={26} />
              <strong style={{ fontSize: 15 }}>Warning: Subject In Use</strong>
            </div>

            <p style={{ margin: 0, fontSize: 13, color: '#475569', lineHeight: 1.5 }}>
              This subject (<strong>{deletingSubjectRecord.name}</strong>) is already used in examinations or marks registers. Deleting it may affect student academic records. Are you sure you want to delete it?
            </p>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 10 }}>
              <button type="button" className="avm-btn-secondary" onClick={() => setDeletingSubjectRecord(null)}>
                Cancel
              </button>
              <button
                type="button"
                style={{ backgroundColor: '#DC2626', color: '#FFFFFF', border: 'none', borderRadius: 8, padding: '8px 16px', fontWeight: 800, fontSize: 13, cursor: 'pointer' }}
                onClick={handleConfirmDeleteUsedSubject}
              >
                Delete Subject
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* MODAL: Add / Edit Master Subject */}
      {isAddMasterSubjectOpen && (
        <Modal
          isOpen={isAddMasterSubjectOpen}
          title={editingMasterSubject ? `Edit Subject Master — ${editingMasterSubject.name}` : 'Add New Master Subject'}
          onClose={() => {
            setIsAddMasterSubjectOpen(false);
            setEditingMasterSubject(null);
          }}
          maxWidth="500px"
        >
          <form onSubmit={handleSaveMasterSubject}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={{ fontSize: 12, fontWeight: 700, color: '#475569', display: 'block', marginBottom: 4 }}>Subject Name *</label>
                <input
                  type="text"
                  className="avm-input"
                  placeholder="e.g. Environmental Studies, Mathematics..."
                  value={mSubName}
                  onChange={(e) => setMSubName(e.target.value)}
                  required
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 700, color: '#475569', display: 'block', marginBottom: 4 }}>Subject Code *</label>
                  <input
                    type="text"
                    className="avm-input"
                    placeholder="e.g. EVS, MATH"
                    value={mSubCode}
                    onChange={(e) => setMSubCode(e.target.value)}
                    required
                  />
                </div>

                <div>
                  <label style={{ fontSize: 12, fontWeight: 700, color: '#475569', display: 'block', marginBottom: 4 }}>Subject Type *</label>
                  <select
                    className="avm-input"
                    value={mSubCategory}
                    onChange={(e) => setMSubCategory(e.target.value as any)}
                  >
                    <option value="Theory">Theory</option>
                    <option value="Practical">Practical</option>
                    <option value="Activity">Activity</option>
                    <option value="Language">Language</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 700, color: '#475569', display: 'block', marginBottom: 4 }}>Default Max Marks *</label>
                  <input
                    type="number"
                    className="avm-input"
                    value={mSubMaxMarks}
                    onChange={(e) => setMSubMaxMarks(Number(e.target.value))}
                    required
                  />
                </div>

                <div>
                  <label style={{ fontSize: 12, fontWeight: 700, color: '#475569', display: 'block', marginBottom: 4 }}>Default Passing Marks *</label>
                  <input
                    type="number"
                    className="avm-input"
                    value={mSubPassingMarks}
                    onChange={(e) => setMSubPassingMarks(Number(e.target.value))}
                    required
                  />
                </div>
              </div>

              <div>
                <label style={{ fontSize: 12, fontWeight: 700, color: '#475569', display: 'block', marginBottom: 4 }}>Status *</label>
                <select
                  className="avm-input"
                  value={mSubStatus}
                  onChange={(e) => setMSubStatus(e.target.value as any)}
                >
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                </select>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 10 }}>
                <button type="button" className="avm-btn-secondary" onClick={() => {
                  setIsAddMasterSubjectOpen(false);
                  setEditingMasterSubject(null);
                }}>
                  Cancel
                </button>
                <button type="submit" className="avm-btn-primary">
                  {editingMasterSubject ? 'Save Changes' : 'Create Master Subject'}
                </button>
              </div>
            </div>
          </form>
        </Modal>
      )}

      {/* MODAL: Assign Subject to Class */}
      {isAssignSubjectOpen && (
        <Modal
          isOpen={isAssignSubjectOpen}
          title={editingClassSubject ? `Edit ${editingClassSubject.name} — ${csClassFilter}` : `Assign Subject to ${csClassFilter}`}
          onClose={() => {
            setIsAssignSubjectOpen(false);
            setEditingClassSubject(null);
          }}
          maxWidth="500px"
        >
          <form onSubmit={handleSaveClassSubject}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={{ fontSize: 12, fontWeight: 700, color: '#475569', display: 'block', marginBottom: 4 }}>Select Subject from Master Catalog *</label>
                {editingClassSubject ? (
                  <input type="text" className="avm-input" value={editingClassSubject.name} disabled style={{ backgroundColor: '#F1F5F9', fontWeight: 800 }} />
                ) : (
                  <select
                    className="avm-input"
                    value={csSubjectId}
                    onChange={(e) => {
                      setCsSubjectId(e.target.value);
                      const m = masterSubjectsList.find(s => s.id === e.target.value || s.name === e.target.value);
                      if (m) {
                        setCsMaxMarks(m.maxMarks || 100);
                        setCsPassingMarks(m.passingMarks || 33);
                        setCsType(m.type || 'Theory');
                      }
                    }}
                    required
                  >
                    <option value="">-- Select Master Subject --</option>
                    {masterSubjectsList.map((m) => (
                      <option key={m.id} value={m.id}>{m.name} ({m.code} • {m.type})</option>
                    ))}
                  </select>
                )}
              </div>

              <div>
                <label style={{ fontSize: 12, fontWeight: 700, color: '#475569', display: 'block', marginBottom: 4 }}>Subject Teacher</label>
                <select
                  className="avm-input"
                  value={csTeacherId}
                  onChange={(e) => setCsTeacherId(e.target.value)}
                >
                  <option value="">-- Select Teacher (Optional) --</option>
                  {employees.map((emp) => (
                    <option key={emp.id} value={emp.id}>{emp.name} ({emp.designation || 'Teacher'})</option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 700, color: '#475569', display: 'block', marginBottom: 4 }}>Subject Type</label>
                  <select className="avm-input" value={csType} onChange={(e) => setCsType(e.target.value as any)}>
                    <option value="Theory">Theory</option>
                    <option value="Practical">Practical</option>
                    <option value="Activity">Activity</option>
                    <option value="Language">Language</option>
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: 12, fontWeight: 700, color: '#475569', display: 'block', marginBottom: 4 }}>Max Marks</label>
                  <input type="number" className="avm-input" value={csMaxMarks} onChange={(e) => setCsMaxMarks(Number(e.target.value))} required />
                </div>

                <div>
                  <label style={{ fontSize: 12, fontWeight: 700, color: '#475569', display: 'block', marginBottom: 4 }}>Passing Marks</label>
                  <input type="number" className="avm-input" value={csPassingMarks} onChange={(e) => setCsPassingMarks(Number(e.target.value))} required />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 10 }}>
                <button type="button" className="avm-btn-secondary" onClick={() => {
                  setIsAssignSubjectOpen(false);
                  setEditingClassSubject(null);
                }}>
                  Cancel
                </button>
                <button type="submit" className="avm-btn-primary">
                  {editingClassSubject ? 'Save Subject Mapping' : `Assign to ${csClassFilter}`}
                </button>
              </div>
            </div>
          </form>
        </Modal>
      )}

      {/* 3. MODAL: Add / Edit Section */}
      {(isAddingSectionToClass || editingSectionInfo) && (
        <Modal
          isOpen={true}
          title={editingSectionInfo ? `Edit Section ${editingSectionInfo.section.name} — ${editingSectionInfo.targetClass.name}` : `Add Section — ${isAddingSectionToClass?.name}`}
          onClose={() => {
            setIsAddingSectionToClass(null);
            setEditingSectionInfo(null);
          }}
          maxWidth="480px"
        >
          <form onSubmit={(e) => {
            e.preventDefault();
            const form = e.currentTarget;
            const secName = (form.elements.namedItem('secName') as HTMLInputElement).value;
            const teacherName = (form.elements.namedItem('secTeacher') as HTMLSelectElement).value;
            const roomNumber = (form.elements.namedItem('secRoom') as HTMLInputElement).value;
            const capacity = Number((form.elements.namedItem('secCapacity') as HTMLInputElement).value) || 30;
            const status = (form.elements.namedItem('secStatus') as HTMLSelectElement).value as 'Active' | 'Inactive';

            if (editingSectionInfo) {
              handleSaveEditSection(editingSectionInfo.targetClass, editingSectionInfo.section.name, {
                name: secName,
                classTeacherName: teacherName,
                roomNumber,
                capacity,
                status
              });
            } else if (isAddingSectionToClass) {
              handleSaveAddSection(isAddingSectionToClass, {
                name: secName,
                classTeacherName: teacherName,
                roomNumber,
                capacity,
                status
              });
            }
          }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={{ fontSize: 12, fontWeight: 700, color: '#475569', display: 'block', marginBottom: 4 }}>Section Name *</label>
                <select name="secName" className="avm-input" defaultValue={editingSectionInfo?.section.name || 'A'} required>
                  {['A', 'B', 'C', 'D', 'E'].map((s) => (
                    <option key={s} value={s}>Section {s}</option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ fontSize: 12, fontWeight: 700, color: '#475569', display: 'block', marginBottom: 4 }}>Class Teacher</label>
                <select name="secTeacher" className="avm-input" defaultValue={editingSectionInfo?.section.classTeacherName || (editingSectionInfo ? editingSectionInfo.targetClass.classTeacherName : isAddingSectionToClass?.classTeacherName || employees[0]?.name || '')}>
                  <option value="">-- Select Employee / Teacher --</option>
                  {employees.map((emp) => (
                    <option key={emp.id} value={emp.name}>{emp.name} ({emp.designation || 'Teacher'})</option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ fontSize: 12, fontWeight: 700, color: '#475569', display: 'block', marginBottom: 4 }}>Room Number</label>
                <input type="text" name="secRoom" className="avm-input" placeholder="e.g. Room 12" defaultValue={editingSectionInfo?.section.roomNumber || ''} />
              </div>

              <div>
                <label style={{ fontSize: 12, fontWeight: 700, color: '#475569', display: 'block', marginBottom: 4 }}>Maximum Capacity</label>
                <input type="number" name="secCapacity" min={1} max={100} className="avm-input" defaultValue={editingSectionInfo?.section.capacity || 30} required />
              </div>

              <div>
                <label style={{ fontSize: 12, fontWeight: 700, color: '#475569', display: 'block', marginBottom: 4 }}>Status</label>
                <select name="secStatus" className="avm-input" defaultValue={editingSectionInfo?.section.status || 'Active'}>
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                </select>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 10 }}>
                <button
                  type="button"
                  className="avm-btn-secondary"
                  onClick={() => {
                    setIsAddingSectionToClass(null);
                    setEditingSectionInfo(null);
                  }}
                >
                  Cancel
                </button>
                <button type="submit" className="avm-btn-primary">
                  Save Section
                </button>
              </div>
            </div>
          </form>
        </Modal>
      )}

      {/* 4. MODAL: Add / Edit Class */}
      {(isAddingClass || editingClassRecord) && (
        <Modal
          isOpen={true}
          title={editingClassRecord ? `Edit Class — ${editingClassRecord.name}` : 'Add New Class'}
          onClose={() => {
            setIsAddingClass(false);
            setEditingClassRecord(null);
          }}
          maxWidth="520px"
        >
          <form onSubmit={(e) => {
            e.preventDefault();
            const form = e.currentTarget;
            const clsName = (form.elements.namedItem('clsName') as HTMLSelectElement).value;
            const sessionName = (form.elements.namedItem('clsSession') as HTMLInputElement).value;
            const teacherName = (form.elements.namedItem('clsTeacher') as HTMLSelectElement).value;
            const defaultCap = Number((form.elements.namedItem('clsCap') as HTMLInputElement).value) || 30;
            const clsStatus = (form.elements.namedItem('clsStatus') as HTMLSelectElement).value as 'Active' | 'Inactive';

            // Selected section checkboxes
            const selectedSecs: string[] = [];
            ['A', 'B', 'C', 'D', 'E'].forEach((secKey) => {
              const el = form.elements.namedItem(`sec_chk_${secKey}`) as HTMLInputElement;
              if (el && el.checked) selectedSecs.push(secKey);
            });

            if (selectedSecs.length === 0) {
              alert('Please select at least one section (e.g. A).');
              return;
            }

            if (editingClassRecord) {
              handleSaveEditClass({
                id: editingClassRecord.id,
                name: clsName,
                academicSession: sessionName,
                classTeacherName: teacherName,
                status: clsStatus,
                capacity: defaultCap,
                sectionNames: selectedSecs
              });
            } else {
              handleSaveCreateClass({
                name: clsName,
                academicSession: sessionName,
                classTeacherName: teacherName,
                status: clsStatus,
                capacity: defaultCap,
                sectionNames: selectedSecs
              });
            }
          }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={{ fontSize: 12, fontWeight: 700, color: '#475569', display: 'block', marginBottom: 4 }}>Class Name *</label>
                <select name="clsName" className="avm-input" defaultValue={editingClassRecord?.name || 'Class 1'} required>
                  {['Nursery', 'LKG', 'UKG', 'Class 1', 'Class 2', 'Class 3', 'Class 4', 'Class 5', 'Class 6', 'Class 7', 'Class 8'].map((cName) => (
                    <option key={cName} value={cName}>{cName}</option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ fontSize: 12, fontWeight: 700, color: '#475569', display: 'block', marginBottom: 4 }}>Academic Session *</label>
                <input type="text" name="clsSession" className="avm-input" value={selectedSessionId} readOnly style={{ backgroundColor: '#F1F5F9', fontWeight: 800 }} />
              </div>

              <div>
                <label style={{ fontSize: 12, fontWeight: 700, color: '#475569', display: 'block', marginBottom: 4 }}>Class Teacher</label>
                <select name="clsTeacher" className="avm-input" defaultValue={editingClassRecord?.classTeacherName || employees[0]?.name || ''}>
                  <option value="">-- Select Employee / Teacher --</option>
                  {employees.map((emp) => (
                    <option key={emp.id} value={emp.name}>{emp.name} ({emp.designation || 'Teacher'})</option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ fontSize: 12, fontWeight: 700, color: '#475569', display: 'block', marginBottom: 6 }}>Sections *</label>
                <div style={{ display: 'flex', gap: 16 }}>
                  {['A', 'B', 'C', 'D', 'E'].map((secKey) => {
                    const isCheckedDefault = editingClassRecord ? editingClassRecord.sections.some((s) => s.name === secKey) : ['A', 'B', 'C'].includes(secKey);
                    return (
                      <label key={secKey} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
                        <input type="checkbox" name={`sec_chk_${secKey}`} defaultChecked={isCheckedDefault} style={{ width: 16, height: 16, accentColor: '#1769E0' }} />
                        <span>Section {secKey}</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              <div>
                <label style={{ fontSize: 12, fontWeight: 700, color: '#475569', display: 'block', marginBottom: 4 }}>Default Section Capacity</label>
                <input type="number" name="clsCap" min={1} max={100} className="avm-input" defaultValue={editingClassRecord?.capacity || 30} required />
              </div>

              <div>
                <label style={{ fontSize: 12, fontWeight: 700, color: '#475569', display: 'block', marginBottom: 4 }}>Status</label>
                <select name="clsStatus" className="avm-input" defaultValue={editingClassRecord?.status || 'Active'}>
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                </select>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 10 }}>
                <button
                  type="button"
                  className="avm-btn-secondary"
                  onClick={() => {
                    setIsAddingClass(false);
                    setEditingClassRecord(null);
                  }}
                >
                  Cancel
                </button>
                <button type="submit" className="avm-btn-primary">
                  {editingClassRecord ? 'Save Changes' : 'Create Class'}
                </button>
              </div>
            </div>
          </form>
        </Modal>
      )}

      {/* 5. MODAL: Confirm Deactivate Class */}
      {deactivatingClassRecord && (
        <Modal
          isOpen={!!deactivatingClassRecord}
          title={`Deactivate Class — ${deactivatingClassRecord.name}`}
          onClose={() => setDeactivatingClassRecord(null)}
          maxWidth="460px"
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: '#D97706' }}>
              <AlertCircle size={24} />
              <strong style={{ fontSize: 15 }}>Deactivate Class Confirmation</strong>
            </div>

            <p style={{ margin: 0, fontSize: 13, color: '#475569', lineHeight: 1.5 }}>
              This class currently contains <strong>{getStudentsForClass(deactivatingClassRecord.name).length} students</strong>. Deactivating it will prevent new student assignments but preserve all existing academic records.
            </p>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 10 }}>
              <button type="button" className="avm-btn-secondary" onClick={() => setDeactivatingClassRecord(null)}>
                Cancel
              </button>
              <button
                type="button"
                style={{ backgroundColor: '#D97706', color: '#FFFFFF', border: 'none', borderRadius: 8, padding: '8px 16px', fontWeight: 800, fontSize: 13, cursor: 'pointer' }}
                onClick={() => handleDeactivateClass(deactivatingClassRecord)}
              >
                Confirm Deactivation
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* 6. MODAL: Confirm Delete Empty Class */}
      {deletingClassRecord && (
        <Modal
          isOpen={!!deletingClassRecord}
          title={`Delete Class — ${deletingClassRecord.name}`}
          onClose={() => setDeletingClassRecord(null)}
          maxWidth="460px"
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: '#DC2626' }}>
              <AlertCircle size={24} />
              <strong style={{ fontSize: 15 }}>Delete Empty Class</strong>
            </div>

            <p style={{ margin: 0, fontSize: 13, color: '#475569', lineHeight: 1.5 }}>
              Are you sure you want to permanently delete <strong>{deletingClassRecord.name}</strong>? This action cannot be undone.
            </p>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 10 }}>
              <button type="button" className="avm-btn-secondary" onClick={() => setDeletingClassRecord(null)}>
                Cancel
              </button>
              <button
                type="button"
                style={{ backgroundColor: '#DC2626', color: '#FFFFFF', border: 'none', borderRadius: 8, padding: '8px 16px', fontWeight: 800, fontSize: 13, cursor: 'pointer' }}
                onClick={() => handleDeleteClass(deletingClassRecord)}
              >
                Delete Class
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* ========================================================= */}
      {/* ADMIT CARDS MANAGEMENT MODALS                             */}
      {/* ========================================================= */}

      {/* 1. MODAL: Generate Admit Cards */}
      {isGeneratingAdmitCards && (() => {
        const genMatchingStudents = students.filter((stu) => {
          const sCls = (stu.className || '').trim();
          const cName = sCls.includes('-') ? sCls.split('-')[0] : sCls;
          const sSec = stu.section || (sCls.includes('-') ? sCls.split('-')[1] : 'A');
          if (genAdcClassName !== 'All' && cName.toLowerCase() !== genAdcClassName.toLowerCase()) return false;
          if (genAdcSectionName !== 'All' && sSec.toLowerCase() !== genAdcSectionName.toLowerCase()) return false;
          return true;
        });

        const selectedCount = genSelectedStudentIds.length === 0
          ? genMatchingStudents.length
          : genMatchingStudents.filter(s => genSelectedStudentIds.includes(s.id)).length;

        return (
          <Modal
            isOpen={isGeneratingAdmitCards}
            title="Generate Admit Cards"
            onClose={() => setIsGeneratingAdmitCards(false)}
            maxWidth="600px"
          >
            <form onSubmit={(e) => {
              e.preventDefault();
              handleBulkGenerateAdmitCards();
            }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 700, color: '#475569', display: 'block', marginBottom: 4 }}>Academic Session *</label>
                  <input type="text" className="avm-input" value={selectedSessionId} readOnly style={{ backgroundColor: '#F1F5F9', fontWeight: 800 }} />
                </div>

                <div>
                  <label style={{ fontSize: 12, fontWeight: 700, color: '#475569', display: 'block', marginBottom: 4 }}>Examination *</label>
                  <select className="avm-input" value={genAdcExamName} onChange={(e) => setGenAdcExamName(e.target.value)} required>
                    {['First Term Examination', 'Half Yearly Examination', 'Annual / Final Examination'].map((ex) => (
                      <option key={ex} value={ex}>{ex}</option>
                    ))}
                  </select>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div>
                    <label style={{ fontSize: 12, fontWeight: 700, color: '#475569', display: 'block', marginBottom: 4 }}>Target Class *</label>
                    <select className="avm-input" value={genAdcClassName} onChange={(e) => setGenAdcClassName(e.target.value)}>
                      <option value="All">All Classes</option>
                      {['Nursery', 'LKG', 'UKG', 'Class 1', 'Class 2', 'Class 3', 'Class 4', 'Class 5', 'Class 6', 'Class 7', 'Class 8'].map((cName) => (
                        <option key={cName} value={cName}>{cName}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label style={{ fontSize: 12, fontWeight: 700, color: '#475569', display: 'block', marginBottom: 4 }}>Target Section *</label>
                    <select className="avm-input" value={genAdcSectionName} onChange={(e) => setGenAdcSectionName(e.target.value)}>
                      <option value="All">All Sections</option>
                      <option value="A">Section A</option>
                      <option value="B">Section B</option>
                      <option value="C">Section C</option>
                    </select>
                  </div>
                </div>

                {/* Target Class Student List Checklist */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                    <label style={{ fontSize: 12, fontWeight: 800, color: '#0F172A' }}>
                      Class Roster ({selectedCount} / {genMatchingStudents.length} Students Selected):
                    </label>
                    <div style={{ display: 'flex', gap: 10 }}>
                      <button
                        type="button"
                        style={{ background: 'none', border: 'none', color: '#1769E0', fontSize: 11, fontWeight: 800, cursor: 'pointer' }}
                        onClick={() => setGenSelectedStudentIds(genMatchingStudents.map(s => s.id))}
                      >
                        [✓ Select All]
                      </button>
                      <button
                        type="button"
                        style={{ background: 'none', border: 'none', color: '#EF4444', fontSize: 11, fontWeight: 800, cursor: 'pointer' }}
                        onClick={() => setGenSelectedStudentIds([])}
                      >
                        [Clear All]
                      </button>
                    </div>
                  </div>

                  <div style={{ maxHeight: 150, overflowY: 'auto', border: '1px solid #E2E8F0', borderRadius: 8, padding: 8, backgroundColor: '#F8FAFC', display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {genMatchingStudents.length === 0 ? (
                      <div style={{ fontSize: 12, color: '#64748B', textAlign: 'center', padding: 12 }}>No students enrolled in selected class/section.</div>
                    ) : (
                      genMatchingStudents.map((stu) => {
                        const isChecked = genSelectedStudentIds.length === 0 || genSelectedStudentIds.includes(stu.id);
                        return (
                          <label key={stu.id} style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 12, cursor: 'pointer', backgroundColor: '#FFFFFF', padding: '6px 10px', borderRadius: 6, border: '1px solid #E2E8F0' }}>
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setGenSelectedStudentIds([...genSelectedStudentIds, stu.id]);
                                } else {
                                  setGenSelectedStudentIds(genSelectedStudentIds.filter(id => id !== stu.id));
                                }
                              }}
                            />
                            <img src={stu.photo || 'https://images.unsplash.com/photo-1544717305-2782549b5136?w=150'} alt={stu.name} style={{ width: 24, height: 24, borderRadius: '50%', objectFit: 'cover' }} />
                            <div style={{ flex: 1 }}>
                              <strong style={{ color: '#0F172A' }}>{stu.name}</strong> • Roll: <strong>{stu.rollNo || '-'}</strong> ({stu.admissionNo})
                            </div>
                          </label>
                        );
                      })
                    )}
                  </div>
                </div>

                <div>
                  <label style={{ fontSize: 12, fontWeight: 700, color: '#475569', display: 'block', marginBottom: 4 }}>Exam Centre</label>
                  <input
                    type="text"
                    className="avm-input"
                    value={genAdcCentre}
                    onChange={(e) => setGenAdcCentre(e.target.value)}
                    placeholder="e.g. Adarsh Vidya Mandir, Kajraili, Bhagalpur"
                    required
                  />
                </div>

                <div>
                  <label style={{ fontSize: 12, fontWeight: 700, color: '#475569', display: 'block', marginBottom: 4 }}>Reporting Time</label>
                  <input
                    type="text"
                    className="avm-input"
                    value={genAdcTime}
                    onChange={(e) => setGenAdcTime(e.target.value)}
                    placeholder="e.g. 08:30 AM"
                    required
                  />
                </div>

                <div>
                  <label style={{ fontSize: 12, fontWeight: 700, color: '#475569', display: 'block', marginBottom: 4 }}>Instructions for Examinees</label>
                  <textarea
                    className="avm-input"
                    rows={3}
                    value={genAdcInstructions}
                    onChange={(e) => setGenAdcInstructions(e.target.value)}
                  />
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 10 }}>
                  <button type="button" className="avm-btn-secondary" onClick={() => setIsGeneratingAdmitCards(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="avm-btn-primary">
                    Generate Admit Cards ({selectedCount})
                  </button>
                </div>
              </div>
            </form>
          </Modal>
        );
      })()}

      {/* 2. MODAL: Edit Admit Card Details */}
      {editingAdmitCardRecord && (
        <Modal
          isOpen={!!editingAdmitCardRecord}
          title={`Edit Admit Card — ${editingAdmitCardRecord.studentName}`}
          onClose={() => setEditingAdmitCardRecord(null)}
          maxWidth="520px"
        >
          <form onSubmit={handleSaveEditAdmitCard}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{ backgroundColor: '#F8FAFC', padding: 12, borderRadius: 8, border: '1px solid #E2E8F0', fontSize: 13 }}>
                <div>Student: <strong style={{ color: '#0F172A' }}>{editingAdmitCardRecord.studentName}</strong></div>
                <div>Admission No: <strong style={{ color: '#1769E0' }}>{editingAdmitCardRecord.admissionNo}</strong></div>
                <div>Class & Section: <strong>{editingAdmitCardRecord.className}-{editingAdmitCardRecord.section}</strong> • Roll: <strong>{editingAdmitCardRecord.rollNo || '-'}</strong></div>
                <div>Exam: <strong>{editingAdmitCardRecord.examName}</strong></div>
              </div>

              <div>
                <label style={{ fontSize: 12, fontWeight: 700, color: '#475569', display: 'block', marginBottom: 4 }}>Exam Centre</label>
                <input
                  type="text"
                  className="avm-input"
                  value={editingAdmitCardRecord.examCentre || ''}
                  onChange={(e) => setEditingAdmitCardRecord({ ...editingAdmitCardRecord, examCentre: e.target.value })}
                  required
                />
              </div>

              <div>
                <label style={{ fontSize: 12, fontWeight: 700, color: '#475569', display: 'block', marginBottom: 4 }}>Reporting Time</label>
                <input
                  type="text"
                  className="avm-input"
                  value={editingAdmitCardRecord.reportingTime || ''}
                  onChange={(e) => setEditingAdmitCardRecord({ ...editingAdmitCardRecord, reportingTime: e.target.value })}
                  required
                />
              </div>

              <div>
                <label style={{ fontSize: 12, fontWeight: 700, color: '#475569', display: 'block', marginBottom: 4 }}>Instructions</label>
                <textarea
                  className="avm-input"
                  rows={3}
                  value={editingAdmitCardRecord.instructions || ''}
                  onChange={(e) => setEditingAdmitCardRecord({ ...editingAdmitCardRecord, instructions: e.target.value })}
                />
              </div>

              <div>
                <label style={{ fontSize: 12, fontWeight: 700, color: '#475569', display: 'block', marginBottom: 4 }}>Status</label>
                <select
                  className="avm-input"
                  value={editingAdmitCardRecord.status}
                  onChange={(e) => setEditingAdmitCardRecord({ ...editingAdmitCardRecord, status: e.target.value as any })}
                >
                  <option value="Draft">Draft</option>
                  <option value="Generated">Generated</option>
                  <option value="Published">Published (Visible in Student App)</option>
                </select>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 10 }}>
                <button type="button" className="avm-btn-secondary" onClick={() => setEditingAdmitCardRecord(null)}>
                  Cancel
                </button>
                <button type="submit" className="avm-btn-primary">
                  Save Admit Card
                </button>
              </div>
            </div>
          </form>
        </Modal>
      )}

      {/* 3. MODAL: Preview Digital Admit Card */}
      {previewAdmitCardRecord && (() => {
        const matchingStu = students.find((s) => s.id === previewAdmitCardRecord.studentId || s.admissionNo === previewAdmitCardRecord.admissionNo) || {
          id: previewAdmitCardRecord.studentId,
          name: previewAdmitCardRecord.studentName,
          admissionNo: previewAdmitCardRecord.admissionNo,
          className: previewAdmitCardRecord.className,
          section: previewAdmitCardRecord.section,
          rollNo: previewAdmitCardRecord.rollNo,
          photo: '',
          fatherName: 'Shri Ramesh Sharma',
          motherName: 'Smt. Sunita Sharma',
          dob: '2015-05-15'
        };

        return (
          <AdmitCardModal
            isOpen={!!previewAdmitCardRecord}
            onClose={() => setPreviewAdmitCardRecord(null)}
            student={matchingStu as Student}
            admitCard={previewAdmitCardRecord}
            examName={previewAdmitCardRecord.examName}
          />
        );
      })()}

      {/* 4. MODAL: Bulk A4 Print View */}
      {bulkPrintAdmitCardsList && (
        <Modal
          isOpen={!!bulkPrintAdmitCardsList}
          title={`Bulk Print Admit Cards (${bulkPrintAdmitCardsList.length} Students)`}
          onClose={() => setBulkPrintAdmitCardsList(null)}
          maxWidth="840px"
        >
          <style>{`
            @media print {
              body * {
                visibility: hidden;
              }
              .bulk-admit-card-container, .bulk-admit-card-container * {
                visibility: visible;
              }
              .bulk-admit-card-container {
                position: absolute;
                left: 0;
                top: 0;
                width: 100%;
              }
              .single-page-admit-card {
                page-break-after: always !important;
                margin: 0 !important;
                padding: 10mm !important;
              }
              .no-print {
                display: none !important;
              }
              @page {
                size: A4 portrait;
                margin: 8mm;
              }
            }
          `}</style>

          <div className="bulk-admit-card-container" style={{ display: 'flex', flexDirection: 'column', gap: 24, maxHeight: '70vh', overflowY: 'auto', paddingRight: 8 }}>
            {bulkPrintAdmitCardsList.map((rec, idx) => {
              const matchingStu = students.find((s) => s.id === rec.studentId || s.admissionNo === rec.admissionNo) || {
                id: rec.studentId,
                name: rec.studentName,
                admissionNo: rec.admissionNo,
                className: rec.className,
                section: rec.section,
                rollNo: rec.rollNo,
                photo: '',
                fatherName: 'Shri Ramesh Sharma',
                motherName: 'Smt. Sunita Sharma',
                dob: '2015-05-15'
              };

              return (
                <div key={idx} className="single-page-admit-card" style={{ border: '2px solid #1769E0', borderRadius: 12, padding: 20, backgroundColor: '#FFFFFF' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid #1769E0', paddingBottom: 10, marginBottom: 14 }}>
                    <div>
                      <h3 style={{ fontSize: 18, fontWeight: 900, color: '#0F172A', margin: 0 }}>ADARSH VIDYA MANDIR</h3>
                      <div style={{ fontSize: 11, color: '#475569', fontWeight: 700 }}>KAJRAILI, BHAGALPUR • OFFICIAL ADMIT CARD</div>
                      <div style={{ fontSize: 11, fontWeight: 800, color: '#1769E0', marginTop: 2 }}>{rec.examName.toUpperCase()} • SESSION {rec.academicSessionId || selectedSessionId}</div>
                    </div>
                    <div style={{ textAlign: 'right', fontSize: 11, fontWeight: 800, color: '#15803D', backgroundColor: '#DCFCE7', padding: '4px 10px', borderRadius: 12 }}>
                      OFFICIAL DRAFT
                    </div>
                  </div>

                  {/* Student Details Grid */}
                  <div style={{ display: 'grid', gridTemplateColumns: '80px 1fr', gap: 14, backgroundColor: '#F8FAFC', padding: 12, borderRadius: 10, marginBottom: 14 }}>
                    {matchingStu.photo ? (
                      <img src={matchingStu.photo} alt={matchingStu.name} style={{ width: 80, height: 96, borderRadius: 6, objectFit: 'cover', border: '1px solid #1769E0' }} />
                    ) : (
                      <div style={{ width: 80, height: 96, borderRadius: 6, backgroundColor: '#E2E8F0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 12, color: '#64748B' }}>
                        PHOTO
                      </div>
                    )}

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px 12px', fontSize: 12 }}>
                      <div><span style={{ color: '#64748B' }}>Name:</span> <strong style={{ color: '#0F172A' }}>{matchingStu.name}</strong></div>
                      <div><span style={{ color: '#64748B' }}>Admission No:</span> <strong style={{ color: '#1769E0' }}>{matchingStu.admissionNo}</strong></div>
                      <div><span style={{ color: '#64748B' }}>Class & Sec:</span> <strong>{matchingStu.className}-{matchingStu.section}</strong></div>
                      <div><span style={{ color: '#64748B' }}>Roll No:</span> <strong>{matchingStu.rollNo || '-'}</strong></div>
                      <div><span style={{ color: '#64748B' }}>Father's Name:</span> <strong>{matchingStu.fatherName || '-'}</strong></div>
                      <div><span style={{ color: '#64748B' }}>Reporting Time:</span> <strong style={{ color: '#D97706' }}>{rec.reportingTime || '08:30 AM'}</strong></div>
                    </div>
                  </div>

                  <div style={{ fontSize: 11, color: '#475569', backgroundColor: '#EFF6FF', padding: 8, borderRadius: 6, marginBottom: 10 }}>
                    <strong>Exam Centre:</strong> {rec.examCentre || 'Adarsh Vidya Mandir, Kajraili, Bhagalpur'}
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 16, paddingTop: 10, borderTop: '1px dashed #CBD5E1', fontSize: 11, color: '#64748B' }}>
                    <div>Student Signature</div>
                    <div>Class Teacher Signature</div>
                    <div style={{ fontWeight: 800, color: '#1769E0' }}>Principal Signature</div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="no-print" style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 16 }}>
            <button type="button" className="avm-btn-secondary" onClick={() => setBulkPrintAdmitCardsList(null)}>
              Close
            </button>
            <button type="button" className="avm-btn-primary" onClick={() => window.print()} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <Printer size={16} /> Print All ({bulkPrintAdmitCardsList.length} Admit Cards)
            </button>
          </div>
        </Modal>
      )}

      {/* ========================================================================= */}
      {/* FEES MODULE MODALS                                                        */}
      {/* ========================================================================= */}

      {/* 1. MODAL: View Student Fee Details */}
      {viewFeeRecord && (
        <Modal
          isOpen={!!viewFeeRecord}
          title={`Fee Details — ${viewFeeRecord.studentName}`}
          onClose={() => setViewFeeRecord(null)}
          maxWidth="750px"
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            {/* Header Info */}
            <div style={{ backgroundColor: '#F8FAFC', padding: 16, borderRadius: 12, border: '1px solid #E2E8F0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
              <div>
                <h3 style={{ fontSize: 18, fontWeight: 900, color: '#0F172A', margin: 0 }}>{viewFeeRecord.studentName}</h3>
                <div style={{ fontSize: 12, color: '#64748B', marginTop: 4 }}>
                  Admission No: <strong style={{ color: '#1769E0' }}>{viewFeeRecord.admissionNo}</strong> • Student ID: <strong>{viewFeeRecord.studentId}</strong> • Roll: <strong>{viewFeeRecord.rollNo || '-'}</strong>
                </div>
                <div style={{ fontSize: 12, color: '#475569', marginTop: 2 }}>
                  Class & Section: <strong>{viewFeeRecord.className}-{viewFeeRecord.section}</strong> • Session: <strong>{viewFeeRecord.academicSessionId || selectedSessionId}</strong>
                </div>
              </div>

              <span style={{
                backgroundColor: viewFeeRecord.status === 'PAID' ? '#DCFCE7' : viewFeeRecord.status === 'PARTIAL' ? '#EFF6FF' : '#FEF2F2',
                color: viewFeeRecord.status === 'PAID' ? '#15803D' : viewFeeRecord.status === 'PARTIAL' ? '#1D4ED8' : '#DC2626',
                fontWeight: 900,
                padding: '6px 16px',
                borderRadius: 20,
                fontSize: 13
              }}>
                STATUS: {viewFeeRecord.status === 'PARTIAL' ? 'PARTIAL PAYMENT' : viewFeeRecord.status}
              </span>
            </div>

            {/* Fee Summary Box */}
            <div style={{ border: '1px solid #E2E8F0', borderRadius: 12, overflow: 'hidden' }}>
              <div style={{ backgroundColor: '#1769E0', color: '#FFFFFF', padding: '10px 16px', fontWeight: 800, fontSize: 14 }}>
                FEE STRUCTURE BREAKDOWN
              </div>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead>
                  <tr style={{ backgroundColor: '#F8FAFC', borderBottom: '1px solid #E2E8F0', color: '#64748B', textAlign: 'left' }}>
                    <th style={{ padding: '10px 14px' }}>Fee Type</th>
                    <th style={{ padding: '10px 14px' }}>Due Date</th>
                    <th style={{ padding: '10px 14px' }}>Total Amount</th>
                    <th style={{ padding: '10px 14px' }}>Paid</th>
                    <th style={{ padding: '10px 14px' }}>Pending</th>
                    <th style={{ padding: '10px 14px' }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {(viewFeeRecord.feeStructure || []).map((item, idx) => (
                    <tr key={item.id || idx} style={{ borderBottom: '1px solid #F1F5F9' }}>
                      <td style={{ padding: '10px 14px', fontWeight: 800, color: '#0F172A' }}>{item.name}</td>
                      <td style={{ padding: '10px 14px', fontSize: 12, color: '#64748B' }}>Due: {item.dueDate || '30 Sep 2026'}</td>
                      <td style={{ padding: '10px 14px', fontWeight: 800 }}>₹{item.amount.toLocaleString('en-IN')}</td>
                      <td style={{ padding: '10px 14px', fontWeight: 800, color: '#16A34A' }}>₹{item.paidAmount.toLocaleString('en-IN')}</td>
                      <td style={{ padding: '10px 14px', fontWeight: 800, color: '#EF4444' }}>₹{item.pendingAmount.toLocaleString('en-IN')}</td>
                      <td style={{ padding: '10px 14px' }}>
                        <span style={{
                          backgroundColor: item.status === 'PAID' ? '#DCFCE7' : item.status === 'PARTIAL' ? '#EFF6FF' : '#FEF2F2',
                          color: item.status === 'PAID' ? '#15803D' : item.status === 'PARTIAL' ? '#1D4ED8' : '#DC2626',
                          fontWeight: 800,
                          fontSize: 10,
                          padding: '2px 8px',
                          borderRadius: 8
                        }}>
                          {item.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                  <tr style={{ backgroundColor: '#EFF6FF', fontWeight: 900, borderTop: '2px solid #CBD5E1' }}>
                    <td colSpan={2} style={{ padding: '12px 14px', color: '#1E40AF' }}>TOTAL SUMMARY</td>
                    <td style={{ padding: '12px 14px', fontSize: 15, color: '#0F172A' }}>₹{viewFeeRecord.totalFee.toLocaleString('en-IN')}</td>
                    <td style={{ padding: '12px 14px', fontSize: 15, color: '#16A34A' }}>₹{viewFeeRecord.paidFee.toLocaleString('en-IN')}</td>
                    <td style={{ padding: '12px 14px', fontSize: 15, color: '#EF4444' }}>₹{viewFeeRecord.pendingFee.toLocaleString('en-IN')}</td>
                    <td></td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Payment History Section */}
            <div style={{ border: '1px solid #E2E8F0', borderRadius: 12, overflow: 'hidden' }}>
              <div style={{ backgroundColor: '#0F172A', color: '#FFFFFF', padding: '10px 16px', fontWeight: 800, fontSize: 14 }}>
                PAYMENT HISTORY ({viewFeeRecord.paymentHistory?.length || 0})
              </div>
              {(!viewFeeRecord.paymentHistory || viewFeeRecord.paymentHistory.length === 0) ? (
                <div style={{ padding: '24px', textAlign: 'center', color: '#64748B', fontSize: 13 }}>
                  No fee payment history recorded for this student yet.
                </div>
              ) : (
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                  <thead>
                    <tr style={{ backgroundColor: '#F8FAFC', borderBottom: '1px solid #E2E8F0', color: '#64748B', textAlign: 'left' }}>
                      <th style={{ padding: '10px 14px' }}>Date</th>
                      <th style={{ padding: '10px 14px' }}>Receipt No.</th>
                      <th style={{ padding: '10px 14px' }}>Amount</th>
                      <th style={{ padding: '10px 14px' }}>Payment Mode</th>
                      <th style={{ padding: '10px 14px' }}>Collected By</th>
                      <th style={{ padding: '10px 14px' }}>Status</th>
                      <th style={{ padding: '10px 14px', textAlign: 'right' }}>Receipt</th>
                    </tr>
                  </thead>
                  <tbody>
                    {viewFeeRecord.paymentHistory.map((h, idx) => (
                      <tr key={idx} style={{ borderBottom: '1px solid #F1F5F9' }}>
                        <td style={{ padding: '10px 14px', fontWeight: 700, color: '#0F172A' }}>{h.date}</td>
                        <td style={{ padding: '10px 14px', fontWeight: 800, color: '#1769E0' }}>{h.receiptNo}</td>
                        <td style={{ padding: '10px 14px', fontWeight: 900, color: '#16A34A' }}>₹{h.amount.toLocaleString('en-IN')}</td>
                        <td style={{ padding: '10px 14px', fontWeight: 700 }}>{h.paymentMode}</td>
                        <td style={{ padding: '10px 14px', color: '#64748B' }}>{h.collectedBy || 'Admin'}</td>
                        <td style={{ padding: '10px 14px' }}>
                          <span style={{ backgroundColor: '#DCFCE7', color: '#15803D', fontWeight: 800, fontSize: 10, padding: '2px 8px', borderRadius: 8 }}>
                            {h.status || 'PAID'}
                          </span>
                        </td>
                        <td style={{ padding: '10px 14px', textAlign: 'right' }}>
                          <button
                            type="button"
                            className="avm-btn-secondary"
                            onClick={() => openReceiptModal(viewFeeRecord, h)}
                            style={{ padding: '4px 10px', fontSize: 11, fontWeight: 700 }}
                          >
                            View Receipt
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            {/* Modal Actions */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 }}>
              <button type="button" className="avm-btn-secondary" onClick={() => setViewFeeRecord(null)}>
                Close
              </button>
              <div style={{ display: 'flex', gap: 10 }}>
                <button
                  type="button"
                  className="avm-btn-secondary"
                  onClick={() => {
                    const r = viewFeeRecord;
                    setViewFeeRecord(null);
                    openUpdateFeeModal(r);
                  }}
                  style={{ borderColor: '#1769E0', color: '#1769E0', fontWeight: 700 }}
                >
                  + Update Fee Structure
                </button>

                {viewFeeRecord.pendingFee > 0 && (
                  <button
                    type="button"
                    className="avm-btn-primary"
                    onClick={() => {
                      const r = viewFeeRecord;
                      setViewFeeRecord(null);
                      openRecordPaymentModal(r);
                    }}
                    style={{ backgroundColor: '#16A34A', fontWeight: 800 }}
                  >
                    + Record Payment
                  </button>
                )}
              </div>
            </div>
          </div>
        </Modal>
      )}

      {/* 2. MODAL: Update Student Fee */}
      {isUpdateFeeOpen && (
        <Modal
          isOpen={isUpdateFeeOpen}
          title="Update Student Fee"
          onClose={() => setIsUpdateFeeOpen(false)}
          maxWidth="550px"
        >
          <form onSubmit={handleSaveFeeUpdate}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{ backgroundColor: '#F8FAFC', padding: 12, borderRadius: 8, border: '1px solid #E2E8F0', fontSize: 12, color: '#475569' }}>
                Academic Session: <strong style={{ color: '#1769E0' }}>{selectedSessionId}</strong> • Add or modify fee structure items for a student.
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 800, color: '#475569', display: 'block', marginBottom: 4 }}>Class *</label>
                  <select
                    className="avm-input"
                    value={formFeeClass}
                    onChange={(e) => setFormFeeClass(e.target.value)}
                  >
                    {['Nursery', 'LKG', 'UKG', 'Class 1', 'Class 2', 'Class 3', 'Class 4', 'Class 5', 'Class 6', 'Class 7', 'Class 8'].map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: 12, fontWeight: 800, color: '#475569', display: 'block', marginBottom: 4 }}>Section *</label>
                  <select
                    className="avm-input"
                    value={formFeeSection}
                    onChange={(e) => setFormFeeSection(e.target.value)}
                  >
                    <option value="A">Section A</option>
                    <option value="B">Section B</option>
                    <option value="C">Section C</option>
                  </select>
                </div>
              </div>

              <div>
                <label style={{ fontSize: 12, fontWeight: 800, color: '#475569', display: 'block', marginBottom: 4 }}>Select Student *</label>
                <select
                  className="avm-input"
                  value={formFeeStudentId}
                  onChange={(e) => setFormFeeStudentId(e.target.value)}
                  required
                >
                  {students.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.admissionNo}) — {s.className}-{s.section || 'A'}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ fontSize: 12, fontWeight: 800, color: '#475569', display: 'block', marginBottom: 4 }}>Fee Type *</label>
                <select
                  className="avm-input"
                  value={formFeeType}
                  onChange={(e) => setFormFeeType(e.target.value)}
                >
                  <option value="Tuition Fee">Tuition Fee</option>
                  <option value="Admission Fee">Admission Fee</option>
                  <option value="Annual Fee">Annual Fee</option>
                  <option value="Development Fee">Development Fee</option>
                  <option value="Computer Fee">Computer Fee</option>
                  <option value="Activity Fee">Activity Fee</option>
                  <option value="Exam Fee">Exam Fee</option>
                  <option value="Transport Fee">Transport Fee</option>
                  <option value="Other Fee">Other Fee</option>
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 800, color: '#475569', display: 'block', marginBottom: 4 }}>Amount (₹) *</label>
                  <input
                    type="number"
                    className="avm-input"
                    value={formFeeAmount}
                    onChange={(e) => setFormFeeAmount(e.target.value)}
                    placeholder="e.g. 4500"
                    required
                    min="1"
                  />
                </div>

                <div>
                  <label style={{ fontSize: 12, fontWeight: 800, color: '#475569', display: 'block', marginBottom: 4 }}>Due Date *</label>
                  <input
                    type="date"
                    className="avm-input"
                    value={formFeeDueDate}
                    onChange={(e) => setFormFeeDueDate(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div>
                <label style={{ fontSize: 12, fontWeight: 700, color: '#475569', display: 'block', marginBottom: 4 }}>Remarks (Optional)</label>
                <input
                  type="text"
                  className="avm-input"
                  value={formFeeRemarks}
                  onChange={(e) => setFormFeeRemarks(e.target.value)}
                  placeholder="e.g. Q3 installment updated"
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 10 }}>
                <button type="button" className="avm-btn-secondary" onClick={() => setIsUpdateFeeOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="avm-btn-primary" style={{ padding: '8px 20px' }}>
                  Save Fee
                </button>
              </div>
            </div>
          </form>
        </Modal>
      )}

      {/* 3. MODAL: Record Payment */}
      {recordPaymentRecord && (
        <Modal
          isOpen={!!recordPaymentRecord}
          title="Record Payment"
          onClose={() => setRecordPaymentRecord(null)}
          maxWidth="550px"
        >
          <form onSubmit={handleSavePayment}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {/* Student Overview Box */}
              <div style={{ backgroundColor: '#F8FAFC', padding: 12, borderRadius: 10, border: '1px solid #E2E8F0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <h4 style={{ fontSize: 15, fontWeight: 900, color: '#0F172A', margin: 0 }}>{recordPaymentRecord.studentName}</h4>
                  <div style={{ fontSize: 12, color: '#64748B', marginTop: 2 }}>
                    Admission No: <strong style={{ color: '#1769E0' }}>{recordPaymentRecord.admissionNo}</strong> • Class: <strong>{recordPaymentRecord.className}-{recordPaymentRecord.section}</strong>
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 10, fontWeight: 800, color: '#64748B', textTransform: 'uppercase' }}>Pending Balance</div>
                  <div style={{ fontSize: 18, fontWeight: 900, color: '#DC2626' }}>₹{recordPaymentRecord.pendingFee.toLocaleString('en-IN')}</div>
                </div>
              </div>

              {pmtErrorMsg && (
                <div style={{ backgroundColor: '#FEF2F2', border: '1px solid #FCA5A5', color: '#B91C1C', padding: '10px 14px', borderRadius: 8, fontSize: 13, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <AlertCircle size={16} />
                  <span>{pmtErrorMsg}</span>
                </div>
              )}

              <div>
                <label style={{ fontSize: 12, fontWeight: 800, color: '#475569', display: 'block', marginBottom: 4 }}>Fee Type</label>
                <select
                  className="avm-input"
                  value={pmtFeeType}
                  onChange={(e) => setPmtFeeType(e.target.value)}
                >
                  <option value="All">All Fees (General Payment)</option>
                  {(recordPaymentRecord.feeStructure || []).map(item => (
                    <option key={item.name} value={item.name}>
                      {item.name} (Pending: ₹{item.pendingAmount.toLocaleString('en-IN')})
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 800, color: '#475569', display: 'block', marginBottom: 4 }}>Payment Amount (₹) *</label>
                  <input
                    type="number"
                    className="avm-input"
                    value={pmtAmount}
                    onChange={(e) => {
                      setPmtAmount(e.target.value);
                      setPmtErrorMsg('');
                    }}
                    placeholder="Enter amount"
                    required
                    min="1"
                    max={recordPaymentRecord.pendingFee}
                  />
                </div>

                <div>
                  <label style={{ fontSize: 12, fontWeight: 800, color: '#475569', display: 'block', marginBottom: 4 }}>Payment Date *</label>
                  <input
                    type="date"
                    className="avm-input"
                    value={pmtDate}
                    onChange={(e) => setPmtDate(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 800, color: '#475569', display: 'block', marginBottom: 4 }}>Payment Mode *</label>
                  <select
                    className="avm-input"
                    value={pmtMode}
                    onChange={(e) => setPmtMode(e.target.value as any)}
                  >
                    <option value="Cash">Cash</option>
                    <option value="UPI">UPI</option>
                    <option value="Bank Transfer">Bank Transfer</option>
                    <option value="Cheque">Cheque</option>
                    <option value="Online">Online</option>
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: 12, fontWeight: 700, color: '#475569', display: 'block', marginBottom: 4 }}>Txn / Ref No. (Optional)</label>
                  <input
                    type="text"
                    className="avm-input"
                    value={pmtTransactionRef}
                    onChange={(e) => setPmtTransactionRef(e.target.value)}
                    placeholder="e.g. UPI/981726384"
                  />
                </div>
              </div>

              <div>
                <label style={{ fontSize: 12, fontWeight: 700, color: '#475569', display: 'block', marginBottom: 4 }}>Remarks (Optional)</label>
                <input
                  type="text"
                  className="avm-input"
                  value={pmtRemarks}
                  onChange={(e) => setPmtRemarks(e.target.value)}
                  placeholder="e.g. Received by Admin at fee counter"
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 10 }}>
                <button type="button" className="avm-btn-secondary" onClick={() => setRecordPaymentRecord(null)}>
                  Cancel
                </button>
                <button type="submit" className="avm-btn-primary" style={{ backgroundColor: '#16A34A', padding: '8px 22px' }}>
                  Save Payment
                </button>
              </div>
            </div>
          </form>
        </Modal>
      )}

      {/* 4. MODAL: Printable Fee Payment Receipt */}
      {receiptModalRecord && receiptModalPayment && (
        <Modal
          isOpen={!!receiptModalPayment}
          title="Fee Payment Receipt"
          onClose={() => {
            setReceiptModalRecord(null);
            setReceiptModalPayment(null);
          }}
          maxWidth="680px"
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* Printable Receipt Layout Container */}
            <div
              className="printable-fee-receipt"
              style={{
                backgroundColor: '#FFFFFF',
                border: '2px solid #0F172A',
                borderRadius: 12,
                padding: 24,
                fontFamily: 'Inter, sans-serif',
                color: '#0F172A'
              }}
            >
              {/* Header */}
              <div style={{ textAlign: 'center', borderBottom: '2px solid #0F172A', paddingBottom: 14, marginBottom: 16 }}>
                <h2 style={{ fontSize: 20, fontWeight: 900, color: '#1769E0', margin: 0, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  ADARSH VIDYA MANDIR
                </h2>
                <div style={{ fontSize: 12, fontWeight: 700, color: '#475569', marginTop: 2 }}>
                  Kajraili, Bhagalpur, Bihar - 812005
                </div>
                <div style={{
                  display: 'inline-block',
                  backgroundColor: '#0F172A',
                  color: '#FFFFFF',
                  padding: '4px 16px',
                  borderRadius: 12,
                  fontSize: 12,
                  fontWeight: 900,
                  marginTop: 8,
                  letterSpacing: '1px'
                }}>
                  FEE PAYMENT RECEIPT
                </div>
              </div>

              {/* Receipt Meta Details */}
              <div style={{ display: 'flex', justifyContent: 'space-between', backgroundColor: '#F8FAFC', padding: 12, borderRadius: 8, border: '1px solid #E2E8F0', fontSize: 12, marginBottom: 16 }}>
                <div>
                  <div>Receipt No: <strong style={{ color: '#1769E0', fontSize: 13 }}>{receiptModalPayment.receiptNo}</strong></div>
                  <div>Payment Date: <strong>{receiptModalPayment.date}</strong></div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div>Academic Session: <strong>{receiptModalRecord.academicSessionId || selectedSessionId}</strong></div>
                  <div>Status: <strong style={{ color: '#16A34A' }}>{receiptModalPayment.status || 'PAID'}</strong></div>
                </div>
              </div>

              {/* Student Details Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, fontSize: 12, borderBottom: '1px solid #E2E8F0', paddingBottom: 14, marginBottom: 14 }}>
                <div>Student Name: <strong style={{ fontSize: 13 }}>{receiptModalRecord.studentName}</strong></div>
                <div>Admission No: <strong style={{ color: '#1769E0' }}>{receiptModalRecord.admissionNo}</strong></div>
                <div>Class & Section: <strong>{receiptModalRecord.className}-{receiptModalRecord.section}</strong></div>
                <div>Roll No: <strong>{receiptModalRecord.rollNo || '-'}</strong></div>
              </div>

              {/* Fee Breakdown Table */}
              <div style={{ border: '1px solid #E2E8F0', borderRadius: 8, overflow: 'hidden', marginBottom: 16 }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                  <thead>
                    <tr style={{ backgroundColor: '#F1F5F9', borderBottom: '1px solid #CBD5E1', textAlign: 'left', fontWeight: 800 }}>
                      <th style={{ padding: '8px 12px' }}>Description / Fee Type</th>
                      <th style={{ padding: '8px 12px', textAlign: 'right' }}>Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr style={{ borderBottom: '1px solid #F1F5F9' }}>
                      <td style={{ padding: '8px 12px', fontWeight: 700 }}>{receiptModalPayment.description || 'School Fee Payment'}</td>
                      <td style={{ padding: '8px 12px', textAlign: 'right', fontWeight: 800 }}>₹{receiptModalPayment.amount.toLocaleString('en-IN')}</td>
                    </tr>
                    <tr style={{ backgroundColor: '#F8FAFC', fontWeight: 800 }}>
                      <td style={{ padding: '8px 12px' }}>Total Session Fee Demand</td>
                      <td style={{ padding: '8px 12px', textAlign: 'right' }}>₹{receiptModalRecord.totalFee.toLocaleString('en-IN')}</td>
                    </tr>
                    <tr style={{ backgroundColor: '#F8FAFC', fontWeight: 800 }}>
                      <td style={{ padding: '8px 12px' }}>Total Paid To Date</td>
                      <td style={{ padding: '8px 12px', textAlign: 'right', color: '#16A34A' }}>₹{receiptModalRecord.paidFee.toLocaleString('en-IN')}</td>
                    </tr>
                    <tr style={{ backgroundColor: '#FEF2F2', fontWeight: 900 }}>
                      <td style={{ padding: '8px 12px', color: '#991B1B' }}>Remaining Balance Pending</td>
                      <td style={{ padding: '8px 12px', textAlign: 'right', color: '#DC2626' }}>₹{receiptModalRecord.pendingFee.toLocaleString('en-IN')}</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Payment Mode & Collected By Info */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, fontSize: 12, backgroundColor: '#F8FAFC', padding: 12, borderRadius: 8, marginBottom: 18 }}>
                <div>Payment Mode: <strong>{receiptModalPayment.paymentMode}</strong></div>
                <div>Transaction ID: <strong>{receiptModalPayment.transactionRef || 'N/A'}</strong></div>
                <div>Collected By: <strong>{receiptModalPayment.collectedBy || 'Admin'}</strong></div>
                <div>Remarks: <strong>{receiptModalPayment.remarks || 'None'}</strong></div>
              </div>

              {/* Highlight Amount Paid Box */}
              <div style={{
                backgroundColor: '#DCFCE7',
                border: '2px solid #16A34A',
                borderRadius: 10,
                padding: '12px 18px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: 24
              }}>
                <div style={{ fontSize: 13, fontWeight: 800, color: '#15803D' }}>Amount Paid This Receipt:</div>
                <div style={{ fontSize: 22, fontWeight: 900, color: '#15803D' }}>₹{receiptModalPayment.amount.toLocaleString('en-IN')}</div>
              </div>

              {/* Signatures & Stamp Area */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 30, paddingTop: 20, borderTop: '1px dashed #CBD5E1', marginTop: 10 }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ height: 40, display: 'flex', alignItems: 'flex-end', justifyContent: 'center', fontSize: 11, color: '#94A3B8' }}>
                    [ School Stamp ]
                  </div>
                  <div style={{ borderTop: '1px solid #94A3B8', paddingTop: 4, fontSize: 11, fontWeight: 700, color: '#475569' }}>
                    School Stamp
                  </div>
                </div>

                <div style={{ textAlign: 'center' }}>
                  <div style={{ height: 40, display: 'flex', alignItems: 'flex-end', justifyContent: 'center', fontSize: 11, color: '#1769E0', fontWeight: 800 }}>
                    Adarsh Vidya Mandir Accounts
                  </div>
                  <div style={{ borderTop: '1px solid #94A3B8', paddingTop: 4, fontSize: 11, fontWeight: 700, color: '#475569' }}>
                    Authorized Signature
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="no-print" style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 10 }}>
              <button
                type="button"
                className="avm-btn-secondary"
                onClick={() => {
                  setReceiptModalRecord(null);
                  setReceiptModalPayment(null);
                }}
              >
                Close
              </button>
              <button
                type="button"
                className="avm-btn-primary"
                onClick={() => window.print()}
                style={{ display: 'flex', alignItems: 'center', gap: 6 }}
              >
                <Printer size={16} /> Print Receipt
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Fee Action Success Toast */}
      {feeToastMsg && (
        <div style={{
          position: 'fixed',
          bottom: 24,
          right: 24,
          backgroundColor: '#16A34A',
          color: '#FFFFFF',
          padding: '12px 20px',
          borderRadius: 10,
          boxShadow: '0 4px 14px rgba(0,0,0,0.18)',
          fontWeight: 800,
          fontSize: 14,
          zIndex: 9999,
          display: 'flex',
          alignItems: 'center',
          gap: 8
        }}>
          <CheckCircle2 size={18} />
          <span>{feeToastMsg}</span>
        </div>
      )}

      {/* Toast Notification */}
      {adcToastMsg && (
        <div style={{
          position: 'fixed',
          bottom: 24,
          right: 24,
          backgroundColor: '#16A34A',
          color: '#FFFFFF',
          padding: '12px 20px',
          borderRadius: 10,
          boxShadow: '0 4px 14px rgba(0,0,0,0.18)',
          fontWeight: 800,
          fontSize: 14,
          zIndex: 9999,
          display: 'flex',
          alignItems: 'center',
          gap: 8
        }}>
          <CheckCircle2 size={18} />
          <span>{adcToastMsg}</span>
        </div>
      )}

      {/* ========================================================================= */}
      {/* NOTIFICATIONS MODULE MODALS */}
      {/* ========================================================================= */}

      {/* 1. SEND NOTIFICATION MODAL WITH LIVE PREVIEW */}
      {sendNotifModalOpen && (
        <Modal
          isOpen={sendNotifModalOpen}
          title="Send New Notification"
          onClose={() => setSendNotifModalOpen(false)}
          maxWidth="780px"
        >
          <form onSubmit={(e) => {
            e.preventDefault();
            if (!notifFormTitle.trim()) {
              alert('Please enter Notification Title');
              return;
            }
            if (!notifFormMessage.trim()) {
              alert('Please enter Notification Message');
              return;
            }

            const targetClassVal = (notifFormTargetAudience === 'Class' || notifFormTargetAudience === 'Section') ? notifFormClass : undefined;
            const targetSecVal = notifFormTargetAudience === 'Section' ? notifFormSection : undefined;

            let selectedStudentObj = students.find(s => s.id === notifFormTargetStudentId);
            let selectedEmpObj = employees.find(emp => emp.id === notifFormTargetEmployeeId);

            let recipientsList: any[] = [];
            if (notifFormTargetAudience === 'Individual Student' && selectedStudentObj) {
              recipientsList = [{ id: selectedStudentObj.id, name: selectedStudentObj.name, roleOrClass: `${selectedStudentObj.className || 'Class 5'}-${selectedStudentObj.section || 'A'}`, deliveryStatus: 'Delivered', readStatus: 'Unread' }];
            } else if (notifFormTargetAudience === 'Individual Employee' && selectedEmpObj) {
              recipientsList = [{ id: selectedEmpObj.id, name: selectedEmpObj.name, roleOrClass: selectedEmpObj.designation || 'Staff', deliveryStatus: 'Delivered', readStatus: 'Unread' }];
            } else if (notifFormTargetAudience === 'Class') {
              const matchedStudents = students.filter(s => (s.className || '').toLowerCase().replace(/class\s*/i, '').trim() === notifFormClass.toLowerCase().replace(/class\s*/i, '').trim());
              recipientsList = matchedStudents.map(s => ({ id: s.id, name: s.name, roleOrClass: `${s.className}-${s.section}`, deliveryStatus: 'Delivered', readStatus: 'Unread' }));
            } else if (notifFormTargetAudience === 'Section') {
              const matchedStudents = students.filter(s =>
                (s.className || '').toLowerCase().replace(/class\s*/i, '').trim() === notifFormClass.toLowerCase().replace(/class\s*/i, '').trim() &&
                (s.section || '').toUpperCase() === notifFormSection.toUpperCase()
              );
              recipientsList = matchedStudents.map(s => ({ id: s.id, name: s.name, roleOrClass: `${s.className}-${s.section}`, deliveryStatus: 'Delivered', readStatus: 'Unread' }));
            } else if (notifFormSendTo === 'students' || notifFormTargetAudience === 'All Students') {
              recipientsList = students.map(s => ({ id: s.id, name: s.name, roleOrClass: `${s.className}-${s.section}`, deliveryStatus: 'Delivered', readStatus: 'Unread' }));
            } else if (notifFormSendTo === 'employees' || notifFormTargetAudience === 'All Employees' || notifFormTargetAudience === 'Teachers' || notifFormTargetAudience === 'Non-Teaching Staff') {
              let targetEmps = employees;
              if (notifFormTargetAudience === 'Teachers') {
                targetEmps = employees.filter(e => (e.designation || '').toLowerCase().includes('teacher'));
              } else if (notifFormTargetAudience === 'Non-Teaching Staff') {
                targetEmps = employees.filter(e => !(e.designation || '').toLowerCase().includes('teacher'));
              }
              recipientsList = targetEmps.map(e => ({ id: e.id, name: e.name, roleOrClass: e.designation || 'Staff', deliveryStatus: 'Delivered', readStatus: 'Unread' }));
            } else if (notifFormSendTo === 'both' || notifFormTargetAudience === 'Students + Employees') {
              const stuRecs = students.map(s => ({ id: s.id, name: s.name, roleOrClass: `${s.className}-${s.section}`, deliveryStatus: 'Delivered', readStatus: 'Unread' }));
              const empRecs = employees.map(e => ({ id: e.id, name: e.name, roleOrClass: e.designation || 'Staff', deliveryStatus: 'Delivered', readStatus: 'Unread' }));
              recipientsList = [...stuRecs, ...empRecs];
            }

            const payload: Partial<NotificationItem> = {
              title: notifFormTitle.trim(),
              type: notifFormType,
              priority: notifFormPriority,
              audienceType: notifFormSendTo,
              targetAudience: notifFormTargetAudience,
              targetClass: targetClassVal,
              targetSection: targetSecVal,
              targetStudentId: notifFormTargetStudentId || undefined,
              targetStudentName: selectedStudentObj?.name,
              targetEmployeeId: notifFormTargetEmployeeId || undefined,
              targetEmployeeName: selectedEmpObj?.name,
              message: notifFormMessage.trim(),
              attachmentName: notifFormAttachment.trim() || undefined,
              actionUrl: notifFormActionUrl.trim() || undefined,
              channels: [
                ...(notifFormInApp ? ['in_app' as const] : []),
                ...(notifFormPush ? ['push' as const] : [])
              ],
              status: notifFormSendOption === 'schedule' ? 'Scheduled' : 'Sent',
              scheduledAt: notifFormSendOption === 'schedule' ? `${notifFormScheduleDate} ${notifFormScheduleTime}` : undefined,
              recipientCount: recipientsList.length > 0 ? recipientsList.length : 50,
              deliveredCount: recipientsList.length > 0 ? recipientsList.length : 50,
              readCount: 0,
              unreadCount: recipientsList.length > 0 ? recipientsList.length : 50,
              recipients: recipientsList
            };

            notificationService.sendNotification(payload);
            setSendNotifModalOpen(false);
            resetSendNotifForm();
            alert(notifFormSendOption === 'schedule' ? 'Notification Scheduled Successfully!' : 'Notification Sent Successfully!');
          }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 20 }}>
              {/* Left Column: Form Fields */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 800, color: '#0F172A', display: 'block', marginBottom: 4 }}>
                    Notification Title *
                  </label>
                  <input
                    type="text"
                    className="avm-input"
                    placeholder="e.g. Tomorrow Holiday Announcement"
                    value={notifFormTitle}
                    onChange={(e) => setNotifFormTitle(e.target.value)}
                    required
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  <div>
                    <label style={{ fontSize: 12, fontWeight: 800, color: '#0F172A', display: 'block', marginBottom: 4 }}>
                      Notification Type
                    </label>
                    <select
                      className="avm-select"
                      value={notifFormType}
                      onChange={(e) => setNotifFormType(e.target.value as any)}
                    >
                      <option value="General">General</option>
                      <option value="Academic">Academic</option>
                      <option value="Homework">Homework</option>
                      <option value="Attendance">Attendance</option>
                      <option value="Fee">Fee</option>
                      <option value="Exam">Exam</option>
                      <option value="Result">Result</option>
                      <option value="Notice">Notice</option>
                      <option value="Timetable">Timetable</option>
                      <option value="Transport">Transport</option>
                      <option value="Event">Event</option>
                      <option value="Emergency">Emergency</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>

                  <div>
                    <label style={{ fontSize: 12, fontWeight: 800, color: '#0F172A', display: 'block', marginBottom: 4 }}>
                      Priority Level
                    </label>
                    <select
                      className="avm-select"
                      value={notifFormPriority}
                      onChange={(e) => setNotifFormPriority(e.target.value as any)}
                    >
                      <option value="Low">Low</option>
                      <option value="Normal">Normal</option>
                      <option value="High">High</option>
                      <option value="Urgent">Urgent</option>
                    </select>
                  </div>
                </div>

                {/* Target Audience & Selection */}
                <div style={{ backgroundColor: '#F8FAFC', padding: 12, borderRadius: 10, border: '1px solid #E2E8F0', display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <label style={{ fontSize: 12, fontWeight: 800, color: '#1769E0', display: 'block' }}>
                    👥 Target Recipient Group *
                  </label>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
                    {[
                      { id: 'students', label: 'Students' },
                      { id: 'employees', label: 'Employees' },
                      { id: 'both', label: 'Students + Staff' }
                    ].map(aud => (
                      <button
                        key={aud.id}
                        type="button"
                        onClick={() => {
                          setNotifFormSendTo(aud.id as any);
                          if (aud.id === 'students') setNotifFormTargetAudience('All Students');
                          if (aud.id === 'employees') setNotifFormTargetAudience('All Employees');
                          if (aud.id === 'both') setNotifFormTargetAudience('Students + Employees');
                        }}
                        style={{
                          padding: '6px 10px',
                          borderRadius: 8,
                          fontSize: 12,
                          fontWeight: 800,
                          cursor: 'pointer',
                          backgroundColor: notifFormSendTo === aud.id ? '#EFF6FF' : '#FFFFFF',
                          border: `1px solid ${notifFormSendTo === aud.id ? '#1769E0' : '#CBD5E1'}`,
                          color: notifFormSendTo === aud.id ? '#1769E0' : '#475569'
                        }}
                      >
                        {aud.label}
                      </button>
                    ))}
                  </div>

                  {notifFormSendTo === 'students' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 4 }}>
                      <label style={{ fontSize: 11, fontWeight: 700, color: '#475569' }}>Student Targeting Mode:</label>
                      <select
                        className="avm-select"
                        value={notifFormTargetAudience}
                        onChange={(e) => setNotifFormTargetAudience(e.target.value)}
                      >
                        <option value="All Students">All Students (School Wide)</option>
                        <option value="Class">Specific Class</option>
                        <option value="Section">Specific Class & Section</option>
                        <option value="Individual Student">Individual Student</option>
                      </select>

                      {(notifFormTargetAudience === 'Class' || notifFormTargetAudience === 'Section') && (
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                          <div>
                            <label style={{ fontSize: 10, fontWeight: 700, color: '#64748B' }}>Select Class</label>
                            <select className="avm-select" value={notifFormClass} onChange={(e) => setNotifFormClass(e.target.value)}>
                              {['Nursery', 'LKG', 'UKG', 'Class 1', 'Class 2', 'Class 3', 'Class 4', 'Class 5', 'Class 6', 'Class 7', 'Class 8'].map(c => (
                                <option key={c} value={c}>{c}</option>
                              ))}
                            </select>
                          </div>
                          {notifFormTargetAudience === 'Section' && (
                            <div>
                              <label style={{ fontSize: 10, fontWeight: 700, color: '#64748B' }}>Select Section</label>
                              <select className="avm-select" value={notifFormSection} onChange={(e) => setNotifFormSection(e.target.value)}>
                                <option value="A">Section A</option>
                                <option value="B">Section B</option>
                                <option value="C">Section C</option>
                              </select>
                            </div>
                          )}
                        </div>
                      )}

                      {notifFormTargetAudience === 'Individual Student' && (
                        <div>
                          <label style={{ fontSize: 10, fontWeight: 700, color: '#64748B' }}>Search & Select Student</label>
                          <select className="avm-select" value={notifFormTargetStudentId} onChange={(e) => setNotifFormTargetStudentId(e.target.value)}>
                            <option value="">-- Select Student --</option>
                            {students.map(s => (
                              <option key={s.id} value={s.id}>{s.name} ({s.admissionNo}) — {s.className}-{s.section}</option>
                            ))}
                          </select>
                        </div>
                      )}
                    </div>
                  )}

                  {notifFormSendTo === 'employees' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 4 }}>
                      <label style={{ fontSize: 11, fontWeight: 700, color: '#475569' }}>Employee Targeting Mode:</label>
                      <select
                        className="avm-select"
                        value={notifFormTargetAudience}
                        onChange={(e) => setNotifFormTargetAudience(e.target.value)}
                      >
                        <option value="All Employees">All Employees / Staff</option>
                        <option value="Teachers">Teachers Only</option>
                        <option value="Non-Teaching Staff">Non-Teaching Staff Only</option>
                        <option value="Individual Employee">Individual Employee</option>
                      </select>

                      {notifFormTargetAudience === 'Individual Employee' && (
                        <div>
                          <label style={{ fontSize: 10, fontWeight: 700, color: '#64748B' }}>Select Employee</label>
                          <select className="avm-select" value={notifFormTargetEmployeeId} onChange={(e) => setNotifFormTargetEmployeeId(e.target.value)}>
                            <option value="">-- Select Employee --</option>
                            {employees.map(emp => (
                              <option key={emp.id} value={emp.id}>{emp.name} ({emp.employeeId}) — {emp.designation}</option>
                            ))}
                          </select>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <div>
                  <label style={{ fontSize: 12, fontWeight: 800, color: '#0F172A', display: 'block', marginBottom: 4 }}>
                    Message Content *
                  </label>
                  <textarea
                    rows={4}
                    className="avm-input"
                    placeholder="Write your notification message here..."
                    value={notifFormMessage}
                    onChange={(e) => setNotifFormMessage(e.target.value)}
                    required
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  <div>
                    <label style={{ fontSize: 11, fontWeight: 700, color: '#475569', display: 'block', marginBottom: 4 }}>Attachment File Name (PDF/Doc/Image)</label>
                    <input
                      type="text"
                      className="avm-input"
                      placeholder="e.g. Holiday_Notice_2026.pdf"
                      value={notifFormAttachment}
                      onChange={(e) => setNotifFormAttachment(e.target.value)}
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: 11, fontWeight: 700, color: '#475569', display: 'block', marginBottom: 4 }}>Action URL (Optional)</label>
                    <input
                      type="text"
                      className="avm-input"
                      placeholder="e.g. /student/homework"
                      value={notifFormActionUrl}
                      onChange={(e) => setNotifFormActionUrl(e.target.value)}
                    />
                  </div>
                </div>

                {/* Delivery Channels */}
                <div>
                  <label style={{ fontSize: 11, fontWeight: 800, color: '#475569', display: 'block', marginBottom: 6 }}>
                    Delivery Channels:
                  </label>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, fontSize: 11, fontWeight: 700 }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: 4, cursor: 'pointer', color: '#1769E0' }}>
                      <input type="checkbox" checked={notifFormInApp} onChange={(e) => setNotifFormInApp(e.target.checked)} /> ☑ In-App Notification
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: 4, cursor: 'pointer', color: '#16A34A' }}>
                      <input type="checkbox" checked={notifFormPush} onChange={(e) => setNotifFormPush(e.target.checked)} /> ☑ Push Notification (Demo)
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: 4, opacity: 0.6, cursor: 'not-allowed' }}>
                      <input type="checkbox" disabled checked={notifFormEmail} onChange={(e) => setNotifFormEmail(e.target.checked)} /> Email (Future)
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: 4, opacity: 0.6, cursor: 'not-allowed' }}>
                      <input type="checkbox" disabled checked={notifFormSms} onChange={(e) => setNotifFormSms(e.target.checked)} /> SMS (Future)
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: 4, opacity: 0.6, cursor: 'not-allowed' }}>
                      <input type="checkbox" disabled checked={notifFormWhatsapp} onChange={(e) => setNotifFormWhatsapp(e.target.checked)} /> WhatsApp (Future)
                    </label>
                  </div>
                </div>

                {/* Send Options: Send Now vs Schedule */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, backgroundColor: '#F1F5F9', padding: 10, borderRadius: 8 }}>
                  <div>
                    <label style={{ fontSize: 11, fontWeight: 800, color: '#475569', display: 'block', marginBottom: 4 }}>Dispatch Mode</label>
                    <select className="avm-select" value={notifFormSendOption} onChange={(e) => setNotifFormSendOption(e.target.value as any)}>
                      <option value="now">Send Instantly Now</option>
                      <option value="schedule">Schedule for Later</option>
                    </select>
                  </div>

                  {notifFormSendOption === 'schedule' && (
                    <div style={{ display: 'flex', gap: 6 }}>
                      <div style={{ flex: 1 }}>
                        <label style={{ fontSize: 10, fontWeight: 700, color: '#64748B' }}>Date</label>
                        <input type="date" className="avm-input" value={notifFormScheduleDate} onChange={(e) => setNotifFormScheduleDate(e.target.value)} required />
                      </div>
                      <div style={{ width: 90 }}>
                        <label style={{ fontSize: 10, fontWeight: 700, color: '#64748B' }}>Time</label>
                        <input type="text" className="avm-input" value={notifFormScheduleTime} onChange={(e) => setNotifFormScheduleTime(e.target.value)} placeholder="10:00 AM" />
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Right Column: LIVE PREVIEW CARD */}
              <div style={{ backgroundColor: '#F8FAFC', padding: 16, borderRadius: 12, border: '1px solid #CBD5E1', display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div style={{ fontSize: 12, fontWeight: 900, color: '#1769E0', textTransform: 'uppercase', letterSpacing: '0.5px', borderBottom: '1px solid #E2E8F0', paddingBottom: 8 }}>
                  📱 Live Notification Preview
                </div>

                {/* Simulated Phone Card Container */}
                <div style={{ backgroundColor: '#FFFFFF', padding: 14, borderRadius: 12, borderLeft: '4px solid #1769E0', boxShadow: '0 4px 12px rgba(0,0,0,0.06)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <div style={{ width: 22, height: 22, borderRadius: 6, backgroundColor: '#EFF6FF', color: '#1769E0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: 11 }}>🔔</div>
                      <span style={{ fontWeight: 800, fontSize: 13, color: '#0F172A' }}>
                        {notifFormTitle || 'Notification Title Preview'}
                      </span>
                    </div>
                    <span style={{ fontSize: 10, color: '#94A3B8' }}>Just now</span>
                  </div>

                  <p style={{ fontSize: 12, color: '#475569', margin: '6px 0', lineHeight: 1.4 }}>
                    {notifFormMessage || 'Your typed notification message body content will appear here live as you type...'}
                  </p>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 10, paddingTop: 8, borderTop: '1px solid #F1F5F9', fontSize: 10 }}>
                    <span style={{ backgroundColor: '#EFF6FF', color: '#1769E0', padding: '2px 6px', borderRadius: 4, fontWeight: 700 }}>
                      Type: {notifFormType}
                    </span>
                    <span style={{ color: '#64748B', fontWeight: 700 }}>
                      Target: {notifFormTargetAudience}
                    </span>
                  </div>
                </div>

                <div style={{ fontSize: 11, color: '#64748B', fontStyle: 'italic', lineHeight: 1.3 }}>
                  ℹ️ This preview simulates how students & teachers will see the push alert on their mobile devices & portal inbox.
                </div>
              </div>
            </div>

            {/* Modal Sticky Actions */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 20, paddingTop: 14, borderTop: '1px solid #E2E8F0' }}>
              <button type="button" className="avm-btn-secondary" onClick={() => setSendNotifModalOpen(false)}>
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  if (!notifFormTitle.trim() || !notifFormMessage.trim()) { alert('Title and Message required'); return; }
                  notificationService.sendNotification({
                    title: notifFormTitle,
                    message: notifFormMessage,
                    type: notifFormType,
                    priority: notifFormPriority,
                    audienceType: notifFormSendTo,
                    targetAudience: notifFormTargetAudience,
                    status: 'Draft'
                  });
                  setSendNotifModalOpen(false);
                  resetSendNotifForm();
                  alert('Notification Saved as Draft');
                }}
                style={{ backgroundColor: '#F1F5F9', color: '#475569', border: '1px solid #CBD5E1', borderRadius: 8, padding: '8px 16px', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}
              >
                Save as Draft
              </button>
              <button type="submit" className="avm-btn-primary" style={{ backgroundColor: '#1769E0', padding: '8px 24px' }}>
                {notifFormSendOption === 'schedule' ? 'Schedule Notification' : 'Send Now'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* 2. NOTIFICATION DETAILS & RECIPIENTS MODAL */}
      {viewNotifDetails && (
        <Modal
          isOpen={!!viewNotifDetails}
          title="Notification Execution & Delivery Details"
          onClose={() => setViewNotifDetails(null)}
          maxWidth="700px"
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* Header Title Card */}
            <div style={{ backgroundColor: '#F8FAFC', padding: 14, borderRadius: 12, borderLeft: '4px solid #1769E0', border: '1px solid #E2E8F0' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ fontSize: 16, fontWeight: 900, color: '#0F172A', margin: 0 }}>{viewNotifDetails.title}</h3>
                <span style={{ backgroundColor: '#DCFCE7', color: '#15803D', padding: '2px 8px', borderRadius: 8, fontSize: 11, fontWeight: 800 }}>
                  {viewNotifDetails.status || 'Sent'}
                </span>
              </div>
              <p style={{ fontSize: 13, color: '#334155', margin: '8px 0 0 0', lineHeight: 1.4 }}>{viewNotifDetails.message}</p>
              <div style={{ display: 'flex', gap: 16, marginTop: 10, fontSize: 11, color: '#64748B' }}>
                <span>Type: <strong>{viewNotifDetails.type}</strong></span>
                <span>Priority: <strong>{viewNotifDetails.priority || 'Normal'}</strong></span>
                <span>Sent By: <strong>{viewNotifDetails.senderName || 'Admin'}</strong></span>
                <span>Timestamp: <strong>{viewNotifDetails.sentAt || viewNotifDetails.createdAt}</strong></span>
              </div>
            </div>

            {/* Recipient Statistics Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10, textAlign: 'center' }}>
              <div style={{ backgroundColor: '#EFF6FF', padding: 10, borderRadius: 8 }}>
                <span style={{ fontSize: 10, color: '#1E40AF', fontWeight: 800 }}>Total Target</span>
                <div style={{ fontSize: 18, fontWeight: 900, color: '#1769E0' }}>{viewNotifDetails.recipientCount || 50}</div>
              </div>
              <div style={{ backgroundColor: '#DCFCE7', padding: 10, borderRadius: 8 }}>
                <span style={{ fontSize: 10, color: '#15803D', fontWeight: 800 }}>Delivered</span>
                <div style={{ fontSize: 18, fontWeight: 900, color: '#16A34A' }}>{viewNotifDetails.deliveredCount || viewNotifDetails.recipientCount || 50}</div>
              </div>
              <div style={{ backgroundColor: '#E0F2FE', padding: 10, borderRadius: 8 }}>
                <span style={{ fontSize: 10, color: '#0369A1', fontWeight: 800 }}>Read</span>
                <div style={{ fontSize: 18, fontWeight: 900, color: '#0284C7' }}>{viewNotifDetails.readCount ?? Math.round((viewNotifDetails.recipientCount || 50) * 0.7)}</div>
              </div>
              <div style={{ backgroundColor: '#FFF7ED', padding: 10, borderRadius: 8 }}>
                <span style={{ fontSize: 10, color: '#C2410C', fontWeight: 800 }}>Unread</span>
                <div style={{ fontSize: 18, fontWeight: 900, color: '#EA580C' }}>{viewNotifDetails.unreadCount ?? Math.round((viewNotifDetails.recipientCount || 50) * 0.3)}</div>
              </div>
            </div>

            {/* Recipient List Table */}
            <div>
              <h4 style={{ fontSize: 13, fontWeight: 800, color: '#0F172A', margin: '0 0 8px' }}>Recipient Delivery Log</h4>
              <div style={{ maxHeight: 220, overflowY: 'auto', border: '1px solid #E2E8F0', borderRadius: 8 }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
                  <thead>
                    <tr style={{ backgroundColor: '#F8FAFC', color: '#64748B', textAlign: 'left' }}>
                      <th style={{ padding: 8 }}>Recipient Name</th>
                      <th style={{ padding: 8 }}>Class / Role</th>
                      <th style={{ padding: 8 }}>Delivery Status</th>
                      <th style={{ padding: 8 }}>Read Status</th>
                      <th style={{ padding: 8 }}>Read Time</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(viewNotifDetails.recipients && viewNotifDetails.recipients.length > 0
                      ? viewNotifDetails.recipients
                      : [
                        { id: 'STU-157', name: 'Aarav Kumar', roleOrClass: 'Class 5-A', deliveryStatus: 'Delivered', readStatus: 'Read', readAt: '10:15 AM' },
                        { id: 'STU-158', name: 'Ananya Sharma', roleOrClass: 'Class 5-A', deliveryStatus: 'Delivered', readStatus: 'Unread' },
                        { id: 'STU-159', name: 'Rohan Gupta', roleOrClass: 'Class 5-A', deliveryStatus: 'Delivered', readStatus: 'Read', readAt: '10:45 AM' }
                      ]
                    ).map((r: any, idx: number) => (
                      <tr key={idx} style={{ borderBottom: '1px solid #F1F5F9' }}>
                        <td style={{ padding: 8, fontWeight: 700 }}>{r.name}</td>
                        <td style={{ padding: 8 }}>{r.roleOrClass}</td>
                        <td style={{ padding: 8 }}>
                          <span style={{ color: '#16A34A', fontWeight: 800 }}>✓ {r.deliveryStatus || 'Delivered'}</span>
                        </td>
                        <td style={{ padding: 8 }}>
                          <span style={{
                            backgroundColor: r.readStatus === 'Read' ? '#DCFCE7' : '#EFF6FF',
                            color: r.readStatus === 'Read' ? '#15803D' : '#1769E0',
                            padding: '2px 6px', borderRadius: 6, fontWeight: 800
                          }}>
                            {r.readStatus === 'Read' ? 'Read' : 'Unread'}
                          </span>
                        </td>
                        <td style={{ padding: 8, color: '#64748B' }}>{r.readAt || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 10 }}>
              <button type="button" className="avm-btn-secondary" onClick={() => setViewNotifDetails(null)}>
                Close Details
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* 3. NOTIFICATION TEMPLATES MASTER MODAL */}
      {templatesModalOpen && (
        <Modal
          isOpen={templatesModalOpen}
          title="Notification Templates Master"
          onClose={() => setTemplatesModalOpen(false)}
          maxWidth="750px"
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <p style={{ fontSize: 12, color: '#64748B', margin: 0 }}>
                Select a pre-built template to quickly compose standard school notifications.
              </p>
              <button
                onClick={() => setCreateTemplateModalOpen(true)}
                style={{ backgroundColor: '#0D9488', color: '#FFF', border: 'none', borderRadius: 8, padding: '6px 12px', fontSize: 12, fontWeight: 800, cursor: 'pointer' }}
              >
                + Create New Template
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, maxHeight: 380, overflowY: 'auto' }}>
              {notificationService.getTemplates().map((tpl) => (
                <div
                  key={tpl.id}
                  style={{ backgroundColor: '#F8FAFC', padding: 14, borderRadius: 10, border: '1px solid #E2E8F0', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: 10 }}
                >
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontWeight: 900, fontSize: 13, color: '#0F172A' }}>{tpl.name}</span>
                      <span style={{ backgroundColor: '#E0F2FE', color: '#0369A1', padding: '2px 6px', borderRadius: 6, fontSize: 10, fontWeight: 800 }}>
                        {tpl.type}
                      </span>
                    </div>
                    <div style={{ fontSize: 11, fontWeight: 700, color: '#1769E0', marginTop: 4 }}>Subject: {tpl.title}</div>
                    <p style={{ fontSize: 11, color: '#475569', margin: '4px 0 0 0', lineHeight: 1.4 }}>{tpl.message}</p>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 8, borderTop: '1px solid #E2E8F0' }}>
                    <button
                      onClick={() => {
                        notificationService.deleteTemplate(tpl.id);
                        alert('Template deleted');
                      }}
                      style={{ background: 'none', border: 'none', color: '#EF4444', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}
                    >
                      Delete
                    </button>

                    <button
                      onClick={() => {
                        resetSendNotifForm();
                        setNotifFormTitle(tpl.title);
                        setNotifFormType(tpl.type);
                        setNotifFormMessage(tpl.message);
                        setTemplatesModalOpen(false);
                        setSendNotifModalOpen(true);
                      }}
                      style={{ backgroundColor: '#1769E0', color: '#FFF', border: 'none', borderRadius: 6, padding: '4px 10px', fontSize: 11, fontWeight: 800, cursor: 'pointer' }}
                    >
                      Use Template →
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Modal>
      )}

      {/* 4. CREATE NEW TEMPLATE MODAL */}
      {createTemplateModalOpen && (
        <Modal
          isOpen={createTemplateModalOpen}
          title="Create Notification Template"
          onClose={() => setCreateTemplateModalOpen(false)}
          maxWidth="500px"
        >
          <form onSubmit={(e) => {
            e.preventDefault();
            if (!tplFormName.trim() || !tplFormTitle.trim() || !tplFormMessage.trim()) {
              alert('Please fill all required fields');
              return;
            }
            notificationService.saveTemplate({
              name: tplFormName.trim(),
              type: tplFormType,
              title: tplFormTitle.trim(),
              message: tplFormMessage.trim()
            });
            setCreateTemplateModalOpen(false);
            setTplFormName('');
            setTplFormTitle('');
            setTplFormMessage('');
            alert('Template Saved Successfully!');
          }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div>
                <label style={{ fontSize: 12, fontWeight: 800, color: '#0F172A', display: 'block', marginBottom: 4 }}>Template Name *</label>
                <input type="text" className="avm-input" placeholder="e.g. Fee Due Reminder" value={tplFormName} onChange={(e) => setTplFormName(e.target.value)} required />
              </div>

              <div>
                <label style={{ fontSize: 12, fontWeight: 800, color: '#0F172A', display: 'block', marginBottom: 4 }}>Type</label>
                <select className="avm-select" value={tplFormType} onChange={(e) => setTplFormType(e.target.value as any)}>
                  <option value="General">General</option>
                  <option value="Academic">Academic</option>
                  <option value="Homework">Homework</option>
                  <option value="Attendance">Attendance</option>
                  <option value="Fee">Fee</option>
                  <option value="Exam">Exam</option>
                  <option value="Result">Result</option>
                  <option value="Notice">Notice</option>
                  <option value="Timetable">Timetable</option>
                  <option value="Transport">Transport</option>
                  <option value="Event">Event</option>
                  <option value="Emergency">Emergency</option>
                </select>
              </div>

              <div>
                <label style={{ fontSize: 12, fontWeight: 800, color: '#0F172A', display: 'block', marginBottom: 4 }}>Notification Title Template *</label>
                <input type="text" className="avm-input" placeholder="e.g. School Fee Due Notice" value={tplFormTitle} onChange={(e) => setTplFormTitle(e.target.value)} required />
              </div>

              <div>
                <label style={{ fontSize: 12, fontWeight: 800, color: '#0F172A', display: 'block', marginBottom: 4 }}>Message Template Body *</label>
                <textarea rows={4} className="avm-input" placeholder="Dear Parent, school fees are due on {DueDate}..." value={tplFormMessage} onChange={(e) => setTplFormMessage(e.target.value)} required />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 10 }}>
                <button type="button" className="avm-btn-secondary" onClick={() => setCreateTemplateModalOpen(false)}>Cancel</button>
                <button type="submit" className="avm-btn-primary" style={{ backgroundColor: '#0D9488' }}>Save Template</button>
              </div>
            </div>
          </form>
        </Modal>
      )}

      {/* 5. NOTIFICATION SETTINGS MODAL */}
      {settingsModalOpen && (
        <Modal
          isOpen={settingsModalOpen}
          title="Notification Center Configuration"
          onClose={() => setSettingsModalOpen(false)}
          maxWidth="520px"
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ backgroundColor: '#EFF6FF', padding: 12, borderRadius: 8, fontSize: 12, color: '#1769E0', fontWeight: 700 }}>
              ⚙️ Configure dispatch channels, quiet hours, and auto-notification triggers for Adarsh Vidya Mandir.
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, fontSize: 12 }}>
              <label style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#F8FAFC', padding: 10, borderRadius: 8 }}>
                <span>Enable In-App Popups</span>
                <input type="checkbox" defaultChecked />
              </label>

              <label style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#F8FAFC', padding: 10, borderRadius: 8 }}>
                <span>Enable Native Mobile Push Notifications</span>
                <input type="checkbox" defaultChecked />
              </label>

              <label style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#F8FAFC', padding: 10, borderRadius: 8 }}>
                <span>Auto-notify parents on Student Absence</span>
                <input type="checkbox" defaultChecked />
              </label>

              <label style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#F8FAFC', padding: 10, borderRadius: 8 }}>
                <span>Auto-notify students on New Homework</span>
                <input type="checkbox" defaultChecked />
              </label>

              <div>
                <label style={{ fontSize: 11, fontWeight: 700, color: '#475569', display: 'block', marginBottom: 4 }}>Default Notification Priority</label>
                <select className="avm-select" defaultValue="Normal">
                  <option value="Normal">Normal</option>
                  <option value="High">High</option>
                </select>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 10 }}>
              <button type="button" className="avm-btn-primary" onClick={() => { setSettingsModalOpen(false); alert('Settings Saved!'); }}>
                Save Settings
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

