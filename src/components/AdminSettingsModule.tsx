import React, { useState, useEffect } from 'react';
import {
  Building2,
  School,
  Calendar,
  Palette,
  Phone,
  Mail,
  Globe,
  MapPin,
  Clock,
  Sliders,
  Layers,
  BookOpen,
  FileCheck,
  CheckSquare,
  Bell,
  FileText,
  UserCheck,
  Shield,
  Lock,
  Laptop,
  Database,
  Download,
  Upload,
  RotateCcw,
  Eye,
  Printer,
  FileWarning,
  LifeBuoy,
  AlertCircle,
  CheckCircle2,
  Save,
  Plus,
  Edit,
  Trash2,
  X,
  ExternalLink,
  ChevronRight,
  Sparkles,
  Info,
  ShieldAlert,
  Check
} from 'lucide-react';
import {
  settingsService,
  CentralSystemSettings,
  SchoolProfileSettings,
  SchoolBrandingSettings,
  ContactCommunicationSettings,
  AcademicConfigSettings,
  ExaminationSettingsModel,
  MarksResultSettingsModel,
  NotificationSettingsModel,
  NoticeSettingsModel,
  AdminAccountSettings,
  SecuritySettingsModel,
  AppConfigurationModel,
  PrintDocumentSettingsModel,
  DateTimeSettingsModel,
  LanguageSettingsModel,
  LegalSupportSettingsModel,
  AuditLogEntry,
  GradeRangeItem
} from '../services/settingsService';
import { academicService } from '../services/academicService';
import { AcademicSession, demoDataStore } from '../services/demoDataStore';
import { Modal } from './Modal';

interface AdminSettingsModuleProps {
  onNavigateTab?: (tabId: string) => void;
  onSessionChanged?: (sessionId: string) => void;
}

export const AdminSettingsModule: React.FC<AdminSettingsModuleProps> = ({
  onNavigateTab,
  onSessionChanged
}) => {
  // Master Settings State
  const [settings, setSettings] = useState<CentralSystemSettings>(() => settingsService.getSettings());
  const [sessions, setSessions] = useState<AcademicSession[]>(() => academicService.getSessions());
  const [activeTab, setActiveTab] = useState<string>('school-profile');
  const [saveStatusMessage, setSaveStatusMessage] = useState<string | null>(null);

  // Dynamic Store Summary Counts
  const [studentCount, setStudentCount] = useState<number>(0);
  const [employeeCount, setEmployeeCount] = useState<number>(0);

  // Modals state
  const [sessionSafetyModalOpen, setSessionSafetyModalOpen] = useState(false);
  const [pendingActiveSessionId, setPendingActiveSessionId] = useState<string | null>(null);

  const [createSessionModalOpen, setCreateSessionModalOpen] = useState(false);
  const [newSessionName, setNewSessionName] = useState('');
  const [newSessionStartDate, setNewSessionStartDate] = useState('2027-04-01');
  const [newSessionEndDate, setNewSessionEndDate] = useState('2028-03-31');
  const [newSessionMakeActive, setNewSessionMakeActive] = useState(false);

  const [resetModalOpen, setResetModalOpen] = useState(false);
  const [resetConfirmText, setResetConfirmText] = useState('');

  const [jsonImportModalOpen, setJsonImportModalOpen] = useState(false);
  const [importJsonText, setImportJsonText] = useState('');
  const [importError, setImportError] = useState<string | null>(null);

  // Forms local state for easy editing
  const [profileForm, setProfileForm] = useState<SchoolProfileSettings>(settings.schoolProfile);
  const [brandingForm, setBrandingForm] = useState<SchoolBrandingSettings>(settings.branding);
  const [contactForm, setContactForm] = useState<ContactCommunicationSettings>(settings.contact);
  const [academicConfigForm, setAcademicConfigForm] = useState<AcademicConfigSettings>(settings.academicConfig);
  const [examForm, setExamForm] = useState<ExaminationSettingsModel>(settings.examinationSettings);
  const [marksForm, setMarksForm] = useState<MarksResultSettingsModel>(settings.marksSettings);
  const [notifForm, setNotifForm] = useState<NotificationSettingsModel>(settings.notificationSettings);
  const [noticeConfigForm, setNoticeConfigForm] = useState<NoticeSettingsModel>(settings.noticeSettings);
  const [adminAccountForm, setAdminAccountForm] = useState<AdminAccountSettings>(settings.adminAccount);
  const [secForm, setSecForm] = useState<SecuritySettingsModel>(settings.securitySettings);
  const [appConfigForm, setAppConfigForm] = useState<AppConfigurationModel>(settings.appConfig);
  const [docForm, setDocForm] = useState<PrintDocumentSettingsModel>(settings.printDocumentSettings);
  const [dtForm, setDtForm] = useState<DateTimeSettingsModel>(settings.dateTimeSettings);
  const [langForm, setLangForm] = useState<LanguageSettingsModel>(settings.languageSettings);
  const [legalForm, setLegalForm] = useState<LegalSupportSettingsModel>(settings.legalSupport);

  // Password fields for Admin Account
  const [currPassword, setCurrPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passMsg, setPassMsg] = useState<{ text: string; error: boolean } | null>(null);

  // Load store metrics
  const refreshStoreMetrics = () => {
    const db = demoDataStore.getDB();
    setStudentCount(db.students?.length || 89);
    setEmployeeCount(db.employees?.length || 8);
    setSessions(academicService.getSessions());
    const latestSettings = settingsService.getSettings();
    setSettings(latestSettings);
    setProfileForm(latestSettings.schoolProfile);
    setBrandingForm(latestSettings.branding);
    setContactForm(latestSettings.contact);
    setAcademicConfigForm(latestSettings.academicConfig);
    setExamForm(latestSettings.examinationSettings);
    setMarksForm(latestSettings.marksSettings);
    setNotifForm(latestSettings.notificationSettings);
    setNoticeConfigForm(latestSettings.noticeSettings);
    setAdminAccountForm(latestSettings.adminAccount);
    setSecForm(latestSettings.securitySettings);
    setAppConfigForm(latestSettings.appConfig);
    setDocForm(latestSettings.printDocumentSettings);
    setDtForm(latestSettings.dateTimeSettings);
    setLangForm(latestSettings.languageSettings);
    setLegalForm(latestSettings.legalSupport);
  };

  useEffect(() => {
    refreshStoreMetrics();
    const unsub = demoDataStore.subscribe(() => {
      refreshStoreMetrics();
    });
    return unsub;
  }, []);

  const showToast = (msg: string) => {
    setSaveStatusMessage(msg);
    setTimeout(() => {
      setSaveStatusMessage(null);
    }, 3000);
  };

  // Active Session helper
  const activeSessionObj = sessions.find((s) => s.isActive || s.status === 'active') || sessions[0] || { id: '2026-27', name: '2026-27' };

  // Handlers for Saving Sections
  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    settingsService.updateSection('schoolProfile', profileForm);
    // Also sync document settings school name if matching default
    settingsService.updateSection('printDocumentSettings', {
      ...docForm,
      schoolNameOnDocuments: profileForm.schoolName.toUpperCase(),
      schoolAddressOnDocuments: `${profileForm.city}, ${profileForm.state} - ${profileForm.pinCode}`.toUpperCase()
    });
    settingsService.addAuditLog('School Profile', 'Updated', `Updated school profile details for ${profileForm.schoolName}`);
    showToast('School Profile saved successfully!');
  };

  const handleSaveBranding = (e: React.FormEvent) => {
    e.preventDefault();
    settingsService.updateSection('branding', brandingForm);
    settingsService.addAuditLog('Branding', 'Updated', 'Updated logo & visual branding settings');
    showToast('Branding settings saved successfully!');
  };

  const handleSaveContact = (e: React.FormEvent) => {
    e.preventDefault();
    settingsService.updateSection('contact', contactForm);
    settingsService.addAuditLog('Contact Information', 'Updated', 'Updated school contact & communication info');
    showToast('Contact & Communication settings saved successfully!');
  };

  const handleSaveAcademicConfig = (e: React.FormEvent) => {
    e.preventDefault();
    settingsService.updateSection('academicConfig', academicConfigForm);
    settingsService.addAuditLog('Academic Configuration', 'Updated', 'Updated school working days & timing schedule');
    showToast('Academic Configuration saved successfully!');
  };

  const handleSaveExamSettings = (e: React.FormEvent) => {
    e.preventDefault();
    settingsService.updateSection('examinationSettings', examForm);
    settingsService.addAuditLog('Examination Settings', 'Updated', 'Updated examination rules, passing %, and grade ranges');
    showToast('Examination Settings saved successfully!');
  };

  const handleSaveMarksSettings = (e: React.FormEvent) => {
    e.preventDefault();
    settingsService.updateSection('marksSettings', marksForm);
    settingsService.addAuditLog('Marks & Results', 'Updated', 'Updated marks evaluation criteria and toggles');
    showToast('Marks & Result Settings saved successfully!');
  };

  const handleSaveNotifSettings = (e: React.FormEvent) => {
    e.preventDefault();
    settingsService.updateSection('notificationSettings', notifForm);
    settingsService.addAuditLog('Notifications', 'Updated', 'Updated system notification preferences');
    showToast('Notification Settings saved successfully!');
  };

  const handleSaveNoticeSettings = (e: React.FormEvent) => {
    e.preventDefault();
    settingsService.updateSection('noticeSettings', noticeConfigForm);
    settingsService.addAuditLog('Notices', 'Updated', 'Updated notice broadcasting preferences');
    showToast('Notice Settings saved successfully!');
  };

  const handleSaveAdminAccount = (e: React.FormEvent) => {
    e.preventDefault();
    settingsService.updateSection('adminAccount', adminAccountForm);
    settingsService.addAuditLog('Admin Account', 'Updated', 'Updated administrator profile information');
    showToast('Admin Account details updated successfully!');
  };

  const handleChangePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassword || newPassword.length < 4) {
      setPassMsg({ text: 'New password must be at least 4 characters long.', error: true });
      return;
    }
    if (newPassword !== confirmPassword) {
      setPassMsg({ text: 'New password and confirmation do not match.', error: true });
      return;
    }
    setPassMsg({ text: 'Admin password changed successfully!', error: false });
    setCurrPassword('');
    setNewPassword('');
    setConfirmPassword('');
    settingsService.addAuditLog('Security', 'Updated', 'Changed administrator password');
  };

  const handleSaveSecurity = (e: React.FormEvent) => {
    e.preventDefault();
    settingsService.updateSection('securitySettings', secForm);
    settingsService.addAuditLog('Security', 'Updated', 'Updated login & security policies');
    showToast('Security Settings saved successfully!');
  };

  const handleSaveDocSettings = (e: React.FormEvent) => {
    e.preventDefault();
    settingsService.updateSection('printDocumentSettings', docForm);
    settingsService.addAuditLog('Print & Documents', 'Updated', 'Updated certificate and document print configuration');
    showToast('Print & Document Settings saved successfully!');
  };

  const handleSaveDateTime = (e: React.FormEvent) => {
    e.preventDefault();
    settingsService.updateSection('dateTimeSettings', dtForm);
    settingsService.addAuditLog('Date & Time', 'Updated', 'Updated date format and time options');
    showToast('Date & Time settings saved successfully!');
  };

  const handleSaveLegal = (e: React.FormEvent) => {
    e.preventDefault();
    settingsService.updateSection('legalSupport', legalForm);
    settingsService.addAuditLog('Legal & Support', 'Updated', 'Updated privacy policy and support URLs');
    showToast('Legal & Support details saved successfully!');
  };

  // --- ACADEMIC SESSION ACTIONS WITH SAFETY ---
  const requestActivateSession = (sessionId: string) => {
    setPendingActiveSessionId(sessionId);
    setSessionSafetyModalOpen(true);
  };

  const confirmActivateSession = () => {
    if (!pendingActiveSessionId) return;
    const sid = pendingActiveSessionId;
    const db = demoDataStore.getDB();
    db.academicSessions = (db.academicSessions || []).map((s) => ({
      ...s,
      isActive: s.id === sid,
      status: s.id === sid ? 'active' : s.status === 'active' ? 'archived' : s.status
    }));
    demoDataStore.saveDB(db);
    settingsService.addAuditLog('Academic Session', 'Activated', `Set active academic session to ${sid}`);
    setSessions(academicService.getSessions());
    setSessionSafetyModalOpen(false);
    setPendingActiveSessionId(null);
    showToast(`Academic session ${sid} is now ACTIVE school-wide!`);
    if (onSessionChanged) {
      onSessionChanged(sid);
    }
  };

  const handleCreateSessionSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSessionName.trim()) return;

    const db = demoDataStore.getDB();
    const sid = newSessionName.trim().replace(/\s+/g, '-');
    const existing = (db.academicSessions || []).find((s) => s.id === sid || s.name === newSessionName.trim());
    if (existing) {
      alert('Academic session with this name already exists.');
      return;
    }

    const newSess: AcademicSession = {
      id: sid,
      name: newSessionName.trim(),
      startDate: newSessionStartDate,
      endDate: newSessionEndDate,
      isActive: newSessionMakeActive,
      status: newSessionMakeActive ? 'active' : 'future'
    };

    if (newSessionMakeActive) {
      db.academicSessions = (db.academicSessions || []).map((s) => ({ ...s, isActive: false, status: s.status === 'active' ? 'archived' : s.status }));
    }
    db.academicSessions = db.academicSessions || [];
    db.academicSessions.push(newSess);
    demoDataStore.saveDB(db);

    settingsService.addAuditLog('Academic Session', 'Created', `Created new academic session ${newSessionName.trim()}`);
    setSessions(academicService.getSessions());
    setCreateSessionModalOpen(false);
    setNewSessionName('');
    showToast(`Created session ${newSessionName.trim()} successfully!`);

    if (newSessionMakeActive && onSessionChanged) {
      onSessionChanged(sid);
    }
  };

  // Danger Zone Reset Handler
  const handleResetDemoDataConfirm = () => {
    if (resetConfirmText.trim().toUpperCase() !== 'RESET') {
      alert('Please type RESET in capital letters to confirm data reset.');
      return;
    }
    demoDataStore.resetDB();
    settingsService.resetSettings();
    setResetModalOpen(false);
    setResetConfirmText('');
    refreshStoreMetrics();
    showToast('Demo store has been reset to default clean seed state!');
    if (onSessionChanged) {
      onSessionChanged('2026-27');
    }
  };

  // JSON Import Handler
  const handleImportJsonSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setImportError(null);
    const success = settingsService.importAllData(importJsonText);
    if (success) {
      setJsonImportModalOpen(false);
      setImportJsonText('');
      refreshStoreMetrics();
      showToast('Persistent demo store imported successfully!');
    } else {
      setImportError('Invalid JSON format or corrupted structure. Import failed.');
    }
  };

  const handleExportJsonDownload = () => {
    const jsonStr = settingsService.exportAllData();
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `AVM_School_ERP_Demo_Backup_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    settingsService.addAuditLog('Data Store', 'Exported', 'Exported full school database JSON backup');
    showToast('Database exported successfully as JSON file!');
  };

  interface NavItem {
    id: string;
    label: string;
    icon: any;
    badge?: string;
  }
  interface NavGroup {
    title: string;
    items: NavItem[];
  }

  // Navigation Items Grouped
  const navGroups: NavGroup[] = [
    {
      title: 'GENERAL',
      items: [
        { id: 'school-profile', label: 'School Profile', icon: Building2 },
        { id: 'academic-sessions', label: 'Academic Sessions', icon: Calendar, badge: activeSessionObj.id },
        { id: 'branding', label: 'Branding', icon: Palette },
        { id: 'contact-comm', label: 'Contact & Communication', icon: Phone }
      ]
    },
    {
      title: 'ACADEMIC',
      items: [
        { id: 'academic-config', label: 'Academic Configuration', icon: Clock },
        { id: 'classes-sections', label: 'Classes & Sections', icon: Layers },
        { id: 'subjects', label: 'Subjects', icon: BookOpen },
        { id: 'timetable-config', label: 'Periods & Timetable', icon: Sliders },
        { id: 'exam-settings', label: 'Examination Settings', icon: FileCheck },
        { id: 'marks-settings', label: 'Grading / Marks', icon: CheckSquare }
      ]
    },
    {
      title: 'COMMUNICATION',
      items: [
        { id: 'notifications', label: 'Notifications', icon: Bell },
        { id: 'notice-settings', label: 'Notices', icon: FileText },
        { id: 'message-templates', label: 'Message Templates', icon: Mail }
      ]
    },
    {
      title: 'USERS & SECURITY',
      items: [
        { id: 'admin-account', label: 'Admin Account', icon: UserCheck },
        { id: 'roles-permissions', label: 'Roles & Permissions', icon: Shield },
        { id: 'security-settings', label: 'Login & Security', icon: Lock }
      ]
    },
    {
      title: 'SYSTEM',
      items: [
        { id: 'app-config', label: 'App Configuration', icon: Laptop },
        { id: 'data-demo-store', label: 'Data & Demo Store', icon: Database },
        { id: 'backup-restore', label: 'Backup / Restore', icon: Download },
        { id: 'audit-log', label: 'Audit Log', icon: FileWarning }
      ]
    },
    {
      title: 'LEGAL & MORE',
      items: [
        { id: 'print-document', label: 'Print & Document Settings', icon: Printer },
        { id: 'date-time', label: 'Date & Time', icon: Clock },
        { id: 'language', label: 'Language Settings', icon: Globe },
        { id: 'legal-privacy', label: 'Privacy & Terms', icon: ShieldAlert },
        { id: 'support-contact', label: 'Support & Contact', icon: LifeBuoy }
      ]
    }
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20, width: '100%', maxWidth: 1400, margin: '0 auto' }}>
      
      {/* Toast Save Alert */}
      {saveStatusMessage && (
        <div style={{
          position: 'fixed',
          bottom: 24,
          right: 24,
          backgroundColor: '#0F172A',
          color: '#FFFFFF',
          padding: '12px 20px',
          borderRadius: 12,
          boxShadow: '0 10px 25px rgba(0,0,0,0.2)',
          zIndex: 9999,
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          fontWeight: 700,
          fontSize: 13,
          borderLeft: '4px solid #16A34A'
        }}>
          <CheckCircle2 size={18} color="#16A34A" />
          <span>{saveStatusMessage}</span>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 1. SETTINGS MODULE HEADER */}
      {/* ========================================================================= */}
      <div style={{
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        padding: '20px 24px',
        border: '1px solid #E2E8F0',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: 16,
        boxShadow: '0 2px 8px rgba(0,0,0,0.02)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{
            width: 48,
            height: 48,
            borderRadius: 14,
            background: 'linear-gradient(135deg, #1769E0 0%, #0F172A 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#FFFFFF',
            boxShadow: '0 4px 12px rgba(23,105,224,0.25)'
          }}>
            <Sliders size={24} />
          </div>
          <div>
            <h2 style={{ fontSize: 20, fontWeight: 900, color: '#0F172A', margin: 0, letterSpacing: '-0.02em' }}>
              Settings Module
            </h2>
            <p style={{ fontSize: 13, color: '#64748B', margin: '2px 0 0 0', fontWeight: 500 }}>
              Manage school, academic, system and application settings.
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {/* Central Active Academic Session Badge */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            backgroundColor: '#EFF6FF',
            border: '1px solid #BFDBFE',
            padding: '8px 14px',
            borderRadius: 30
          }}>
            <Calendar size={15} color="#1769E0" />
            <span style={{ fontSize: 12, fontWeight: 700, color: '#1E40AF' }}>Academic Session:</span>
            <span style={{
              backgroundColor: '#16A34A',
              color: '#FFFFFF',
              fontSize: 11,
              fontWeight: 800,
              padding: '2px 8px',
              borderRadius: 20
            }}>
              {activeSessionObj.id} • ACTIVE
            </span>
          </div>

          <button
            type="button"
            onClick={() => setActiveTab('notifications')}
            style={{
              width: 40,
              height: 40,
              borderRadius: '50%',
              backgroundColor: '#F8FAFC',
              border: '1px solid #E2E8F0',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              color: '#475569'
            }}
            title="Notification Settings"
          >
            <Bell size={18} />
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. TOP SUMMARY DASHBOARD CARDS */}
      {/* ========================================================================= */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
        gap: 16
      }}>
        {/* Card 1: School Profile */}
        <div className="avm-card" style={{ padding: 16, display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ width: 42, height: 42, borderRadius: 12, backgroundColor: '#EFF6FF', color: '#1769E0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <School size={20} />
          </div>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>School Profile</div>
            <div style={{ fontSize: 14, fontWeight: 800, color: '#0F172A', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {settings.schoolProfile.schoolName || 'Adarsh Vidya Mandir'}
            </div>
            <div style={{ fontSize: 11, color: '#16A34A', fontWeight: 700, marginTop: 2 }}>✓ Profile Configured</div>
          </div>
        </div>

        {/* Card 2: Academic Session */}
        <div className="avm-card" style={{ padding: 16, display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ width: 42, height: 42, borderRadius: 12, backgroundColor: '#F0FDF4', color: '#16A34A', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Calendar size={20} />
          </div>
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>Academic Session</div>
            <div style={{ fontSize: 15, fontWeight: 800, color: '#0F172A' }}>
              {activeSessionObj.name || activeSessionObj.id} Active
            </div>
            <div style={{ fontSize: 11, color: '#64748B', fontWeight: 600, marginTop: 2 }}>Central System Active</div>
          </div>
        </div>

        {/* Card 3: Users */}
        <div className="avm-card" style={{ padding: 16, display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ width: 42, height: 42, borderRadius: 12, backgroundColor: '#FEF3C7', color: '#D97706', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <UserCheck size={20} />
          </div>
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>User Database</div>
            <div style={{ fontSize: 14, fontWeight: 800, color: '#0F172A' }}>
              {studentCount} Students / {employeeCount} Staff
            </div>
            <div style={{ fontSize: 11, color: '#64748B', fontWeight: 600, marginTop: 2 }}>Role Managed Access</div>
          </div>
        </div>

        {/* Card 4: System Data Store */}
        <div className="avm-card" style={{ padding: 16, display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ width: 42, height: 42, borderRadius: 12, backgroundColor: '#F3E8FF', color: '#9333EA', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Database size={20} />
          </div>
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>System Storage</div>
            <div style={{ fontSize: 14, fontWeight: 800, color: '#0F172A' }}>
              Persistent Demo Store
            </div>
            <div style={{ fontSize: 11, color: '#16A34A', fontWeight: 700, marginTop: 2 }}>Capacitor + Local Storage</div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 3. SETTINGS MAIN TWO-COLUMN CONTENT AREA */}
      {/* ========================================================================= */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '260px 1fr',
        gap: 20,
        alignItems: 'start'
      }}>

        {/* LEFT SETTINGS CATEGORIES NAVIGATION */}
        <div className="avm-card" style={{ padding: 14, display: 'flex', flexDirection: 'column', gap: 16 }}>
          {navGroups.map((group) => (
            <div key={group.title}>
              <div style={{
                fontSize: 10,
                fontWeight: 900,
                color: '#94A3B8',
                letterSpacing: '0.08em',
                marginBottom: 6,
                paddingLeft: 8
              }}>
                {group.title}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {group.items.map((item) => {
                  const IconComp = item.icon;
                  const isActive = activeTab === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setActiveTab(item.id)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '9px 12px',
                        borderRadius: 10,
                        border: 'none',
                        backgroundColor: isActive ? '#1769E0' : 'transparent',
                        color: isActive ? '#FFFFFF' : '#334155',
                        fontWeight: isActive ? 700 : 600,
                        fontSize: 12.5,
                        cursor: 'pointer',
                        textAlign: 'left',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
                        <IconComp size={16} color={isActive ? '#FFFFFF' : '#64748B'} />
                        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {item.label}
                        </span>
                      </div>
                      {item.badge && (
                        <span style={{
                          fontSize: 10,
                          fontWeight: 800,
                          backgroundColor: isActive ? 'rgba(255,255,255,0.2)' : '#E2E8F0',
                          color: isActive ? '#FFFFFF' : '#475569',
                          padding: '1px 6px',
                          borderRadius: 10
                        }}>
                          {item.badge}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* RIGHT SETTINGS PANEL DISPLAY AREA */}
        <div className="avm-card" style={{ padding: 24 }}>

          {/* --------------------------------------------------------------------- */}
          {/* PANEL 1: SCHOOL PROFILE */}
          {/* --------------------------------------------------------------------- */}
          {activeTab === 'school-profile' && (
            <form onSubmit={handleSaveProfile} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              <div>
                <h3 style={{ fontSize: 16, fontWeight: 800, color: '#0F172A', margin: 0 }}>School Profile</h3>
                <p style={{ fontSize: 12, color: '#64748B', margin: '2px 0 0 0' }}>Manage school official details, location, affiliation and leadership info.</p>
              </div>

              {/* Basic Details */}
              <div style={{ borderBottom: '1px solid #F1F5F9', paddingBottom: 16 }}>
                <h4 style={{ fontSize: 13, fontWeight: 800, color: '#1769E0', marginBottom: 12 }}>1. School Basic Information</h4>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12 }}>
                  <div>
                    <label className="avm-label">School Name *</label>
                    <input type="text" className="avm-input" value={profileForm.schoolName} onChange={(e) => setProfileForm({ ...profileForm, schoolName: e.target.value })} required />
                  </div>
                  <div>
                    <label className="avm-label">Short Name</label>
                    <input type="text" className="avm-input" value={profileForm.shortName} onChange={(e) => setProfileForm({ ...profileForm, shortName: e.target.value })} />
                  </div>
                  <div>
                    <label className="avm-label">School Code</label>
                    <input type="text" className="avm-input" value={profileForm.schoolCode} onChange={(e) => setProfileForm({ ...profileForm, schoolCode: e.target.value })} />
                  </div>
                </div>
              </div>

              {/* Address Details */}
              <div style={{ borderBottom: '1px solid #F1F5F9', paddingBottom: 16 }}>
                <h4 style={{ fontSize: 13, fontWeight: 800, color: '#1769E0', marginBottom: 12 }}>2. School Address</h4>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12 }}>
                  <div style={{ gridColumn: 'span 2' }}>
                    <label className="avm-label">Address Line 1</label>
                    <input type="text" className="avm-input" value={profileForm.addressLine1} onChange={(e) => setProfileForm({ ...profileForm, addressLine1: e.target.value })} />
                  </div>
                  <div style={{ gridColumn: 'span 2' }}>
                    <label className="avm-label">Address Line 2</label>
                    <input type="text" className="avm-input" value={profileForm.addressLine2} onChange={(e) => setProfileForm({ ...profileForm, addressLine2: e.target.value })} />
                  </div>
                  <div>
                    <label className="avm-label">Village / Area</label>
                    <input type="text" className="avm-input" value={profileForm.villageArea} onChange={(e) => setProfileForm({ ...profileForm, villageArea: e.target.value })} />
                  </div>
                  <div>
                    <label className="avm-label">City</label>
                    <input type="text" className="avm-input" value={profileForm.city} onChange={(e) => setProfileForm({ ...profileForm, city: e.target.value })} />
                  </div>
                  <div>
                    <label className="avm-label">District</label>
                    <input type="text" className="avm-input" value={profileForm.district} onChange={(e) => setProfileForm({ ...profileForm, district: e.target.value })} />
                  </div>
                  <div>
                    <label className="avm-label">State</label>
                    <input type="text" className="avm-input" value={profileForm.state} onChange={(e) => setProfileForm({ ...profileForm, state: e.target.value })} />
                  </div>
                  <div>
                    <label className="avm-label">PIN Code</label>
                    <input type="text" className="avm-input" value={profileForm.pinCode} onChange={(e) => setProfileForm({ ...profileForm, pinCode: e.target.value })} />
                  </div>
                  <div>
                    <label className="avm-label">Country</label>
                    <input type="text" className="avm-input" value={profileForm.country} onChange={(e) => setProfileForm({ ...profileForm, country: e.target.value })} />
                  </div>
                </div>
              </div>

              {/* Leadership & Affiliation */}
              <div>
                <h4 style={{ fontSize: 13, fontWeight: 800, color: '#1769E0', marginBottom: 12 }}>3. Leadership & Affiliation</h4>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12 }}>
                  <div>
                    <label className="avm-label">Principal Name</label>
                    <input type="text" className="avm-input" value={profileForm.principalName} onChange={(e) => setProfileForm({ ...profileForm, principalName: e.target.value })} />
                  </div>
                  <div>
                    <label className="avm-label">Vice Principal Name</label>
                    <input type="text" className="avm-input" value={profileForm.vicePrincipalName} onChange={(e) => setProfileForm({ ...profileForm, vicePrincipalName: e.target.value })} />
                  </div>
                  <div>
                    <label className="avm-label">Established Year</label>
                    <input type="text" className="avm-input" value={profileForm.establishedYear} onChange={(e) => setProfileForm({ ...profileForm, establishedYear: e.target.value })} />
                  </div>
                  <div>
                    <label className="avm-label">Board</label>
                    <select className="avm-input" value={profileForm.board} onChange={(e) => setProfileForm({ ...profileForm, board: e.target.value })}>
                      <option value="CBSE">CBSE</option>
                      <option value="ICSE">ICSE</option>
                      <option value="State Board">State Board</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                  <div>
                    <label className="avm-label">Affiliation Pattern</label>
                    <input type="text" className="avm-input" value={profileForm.affiliation} onChange={(e) => setProfileForm({ ...profileForm, affiliation: e.target.value })} />
                  </div>
                  <div>
                    <label className="avm-label">Affiliation Number</label>
                    <input type="text" className="avm-input" value={profileForm.affiliationNumber} onChange={(e) => setProfileForm({ ...profileForm, affiliationNumber: e.target.value })} />
                  </div>
                  <div>
                    <label className="avm-label">School Type</label>
                    <input type="text" className="avm-input" value={profileForm.schoolType} onChange={(e) => setProfileForm({ ...profileForm, schoolType: e.target.value })} />
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', paddingTop: 12 }}>
                <button type="button" className="avm-btn-secondary" onClick={() => setProfileForm(settings.schoolProfile)}>
                  Reset
                </button>
                <button type="submit" className="avm-btn-primary" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Save size={16} /> Save Changes
                </button>
              </div>
            </form>
          )}

          {/* --------------------------------------------------------------------- */}
          {/* PANEL 2: ACADEMIC SESSIONS */}
          {/* --------------------------------------------------------------------- */}
          {activeTab === 'academic-sessions' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
                <div>
                  <h3 style={{ fontSize: 16, fontWeight: 800, color: '#0F172A', margin: 0 }}>Academic Session Management</h3>
                  <p style={{ fontSize: 12, color: '#64748B', margin: '2px 0 0 0' }}>Configure active academic year and archive historical sessions.</p>
                </div>
                <button
                  type="button"
                  className="avm-btn-primary"
                  onClick={() => setCreateSessionModalOpen(true)}
                  style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, padding: '8px 14px' }}
                >
                  <Plus size={16} /> Create Academic Session
                </button>
              </div>

              <div style={{ backgroundColor: '#EFF6FF', padding: 14, borderRadius: 12, border: '1px solid #BFDBFE', display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                <Info size={18} color="#1769E0" style={{ flexShrink: 0, marginTop: 2 }} />
                <div style={{ fontSize: 12, color: '#1E3A8A', lineHeight: 1.5 }}>
                  <strong>Central Academic Session Rule:</strong> Only <strong>ONE</strong> academic session can be ACTIVE at any time across the school system. All modules (Students, Attendance, Homework, Exams, Marks, Results, Fees, Notices, Timetable) dynamically use the central active session.
                </div>
              </div>

              {/* Sessions List */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {sessions.map((sess) => {
                  const isCurrentActive = sess.isActive || sess.status === 'active';
                  return (
                    <div
                      key={sess.id}
                      style={{
                        padding: 16,
                        borderRadius: 14,
                        border: isCurrentActive ? '2px solid #16A34A' : '1px solid #E2E8F0',
                        backgroundColor: isCurrentActive ? '#F0FDF4' : '#F8FAFC',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        flexWrap: 'wrap',
                        gap: 12
                      }}
                    >
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <span style={{ fontSize: 16, fontWeight: 800, color: '#0F172A' }}>{sess.name || sess.id}</span>
                          {isCurrentActive ? (
                            <span style={{ backgroundColor: '#16A34A', color: '#FFF', fontSize: 11, fontWeight: 800, padding: '3px 10px', borderRadius: 20 }}>
                              ✓ ACTIVE SESSION
                            </span>
                          ) : (
                            <span style={{ backgroundColor: '#94A3B8', color: '#FFF', fontSize: 11, fontWeight: 800, padding: '3px 10px', borderRadius: 20 }}>
                              {(sess.status || 'Archived').toUpperCase()}
                            </span>
                          )}
                        </div>
                        <div style={{ fontSize: 12, color: '#64748B', marginTop: 6 }}>
                          Duration: <strong>{sess.startDate || '01/04/2026'}</strong> to <strong>{sess.endDate || '31/03/2027'}</strong>
                        </div>
                      </div>

                      <div style={{ display: 'flex', gap: 8 }}>
                        {!isCurrentActive && (
                          <button
                            type="button"
                            onClick={() => requestActivateSession(sess.id)}
                            style={{
                              backgroundColor: '#16A34A',
                              color: '#FFFFFF',
                              border: 'none',
                              borderRadius: 8,
                              padding: '8px 14px',
                              fontSize: 12,
                              fontWeight: 700,
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: 6
                            }}
                          >
                            <CheckCircle2 size={14} /> Set Active
                          </button>
                        )}
                        {isCurrentActive && (
                          <span style={{ fontSize: 12, fontWeight: 700, color: '#16A34A', padding: '8px 12px' }}>
                            Currently Active
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* --------------------------------------------------------------------- */}
          {/* PANEL 3: BRANDING */}
          {/* --------------------------------------------------------------------- */}
          {activeTab === 'branding' && (
            <form onSubmit={handleSaveBranding} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              <div>
                <h3 style={{ fontSize: 16, fontWeight: 800, color: '#0F172A', margin: 0 }}>School Logo & Branding</h3>
                <p style={{ fontSize: 12, color: '#64748B', margin: '2px 0 0 0' }}>Configure school identity assets, themes, and official logos.</p>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 20 }}>
                {/* Logo Upload Box */}
                <div style={{ padding: 16, border: '1px dashed #CBD5E1', borderRadius: 14, textAlign: 'center', backgroundColor: '#F8FAFC' }}>
                  <label className="avm-label" style={{ marginBottom: 8, display: 'block' }}>School Logo</label>
                  <div style={{ width: 90, height: 90, borderRadius: 16, border: '2px solid #E2E8F0', overflow: 'hidden', margin: '0 auto 12px', backgroundColor: '#FFF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {brandingForm.logoUrl ? (
                      <img src={brandingForm.logoUrl} alt="Logo" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      <School size={40} color="#1769E0" />
                    )}
                  </div>
                  <input
                    type="text"
                    className="avm-input"
                    value={brandingForm.logoUrl}
                    onChange={(e) => setBrandingForm({ ...brandingForm, logoUrl: e.target.value })}
                    placeholder="Logo URL or Image Path"
                    style={{ fontSize: 11, marginBottom: 8 }}
                  />
                  <div style={{ fontSize: 11, color: '#64748B' }}>Used on Admit Cards, Report Cards, Certificates & App header.</div>
                </div>

                {/* Favicon Box */}
                <div style={{ padding: 16, border: '1px dashed #CBD5E1', borderRadius: 14, textAlign: 'center', backgroundColor: '#F8FAFC' }}>
                  <label className="avm-label" style={{ marginBottom: 8, display: 'block' }}>Favicon Icon</label>
                  <div style={{ width: 48, height: 48, borderRadius: 12, border: '2px solid #E2E8F0', overflow: 'hidden', margin: '0 auto 12px', backgroundColor: '#FFF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {brandingForm.faviconUrl ? (
                      <img src={brandingForm.faviconUrl} alt="Favicon" style={{ width: 32, height: 32 }} />
                    ) : (
                      <Sparkles size={24} color="#1769E0" />
                    )}
                  </div>
                  <input
                    type="text"
                    className="avm-input"
                    value={brandingForm.faviconUrl}
                    onChange={(e) => setBrandingForm({ ...brandingForm, faviconUrl: e.target.value })}
                    placeholder="Favicon URL"
                    style={{ fontSize: 11, marginBottom: 8 }}
                  />
                  <div style={{ fontSize: 11, color: '#64748B' }}>Displayed in browser tabs and web launcher icons.</div>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 14 }}>
                <div>
                  <label className="avm-label">School Name Display</label>
                  <input type="text" className="avm-input" value={brandingForm.schoolNameDisplay} onChange={(e) => setBrandingForm({ ...brandingForm, schoolNameDisplay: e.target.value })} />
                </div>
                <div>
                  <label className="avm-label">Short Name / Badge Text</label>
                  <input type="text" className="avm-input" value={brandingForm.shortName} onChange={(e) => setBrandingForm({ ...brandingForm, shortName: e.target.value })} />
                </div>
                <div>
                  <label className="avm-label">Primary Theme Color</label>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <input type="color" value={brandingForm.primaryColor} onChange={(e) => setBrandingForm({ ...brandingForm, primaryColor: e.target.value })} style={{ width: 42, height: 38, border: 'none', borderRadius: 8, cursor: 'pointer' }} />
                    <input type="text" className="avm-input" value={brandingForm.primaryColor} onChange={(e) => setBrandingForm({ ...brandingForm, primaryColor: e.target.value })} />
                  </div>
                </div>
                <div>
                  <label className="avm-label">Secondary Theme Color</label>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <input type="color" value={brandingForm.secondaryColor} onChange={(e) => setBrandingForm({ ...brandingForm, secondaryColor: e.target.value })} style={{ width: 42, height: 38, border: 'none', borderRadius: 8, cursor: 'pointer' }} />
                    <input type="text" className="avm-input" value={brandingForm.secondaryColor} onChange={(e) => setBrandingForm({ ...brandingForm, secondaryColor: e.target.value })} />
                  </div>
                </div>
              </div>

              {/* Scope Info Box */}
              <div style={{ backgroundColor: '#F8FAFC', padding: 14, borderRadius: 12, border: '1px solid #E2E8F0' }}>
                <div style={{ fontSize: 12, fontWeight: 800, color: '#0F172A', marginBottom: 4 }}>Branding Applies Across:</div>
                <div style={{ fontSize: 11, color: '#475569', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 6 }}>
                  <span>✓ Admin Web Dashboard</span>
                  <span>✓ Student Mobile App</span>
                  <span>✓ Employee Mobile App</span>
                  <span>✓ Official Admit Cards</span>
                  <span>✓ Report Cards & Marksheets</span>
                  <span>✓ Transfer Certificates</span>
                  <span>✓ Fee Payment Receipts</span>
                  <span>✓ PDF Export Documents</span>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <button type="submit" className="avm-btn-primary" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Save size={16} /> Save Branding
                </button>
              </div>
            </form>
          )}

          {/* --------------------------------------------------------------------- */}
          {/* PANEL 4: CONTACT & COMMUNICATION */}
          {/* --------------------------------------------------------------------- */}
          {activeTab === 'contact-comm' && (
            <form onSubmit={handleSaveContact} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              <div>
                <h3 style={{ fontSize: 16, fontWeight: 800, color: '#0F172A', margin: 0 }}>Contact & Communication</h3>
                <p style={{ fontSize: 12, color: '#64748B', margin: '2px 0 0 0' }}>School helpline, emergency phone numbers and office hours.</p>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 14 }}>
                <div>
                  <label className="avm-label">School Main Phone</label>
                  <input type="text" className="avm-input" value={contactForm.phone} onChange={(e) => setContactForm({ ...contactForm, phone: e.target.value })} />
                </div>
                <div>
                  <label className="avm-label">Official Email</label>
                  <input type="email" className="avm-input" value={contactForm.email} onChange={(e) => setContactForm({ ...contactForm, email: e.target.value })} />
                </div>
                <div>
                  <label className="avm-label">Official Website</label>
                  <input type="text" className="avm-input" value={contactForm.website} onChange={(e) => setContactForm({ ...contactForm, website: e.target.value })} />
                </div>
                <div>
                  <label className="avm-label">Emergency Helpline</label>
                  <input type="text" className="avm-input" value={contactForm.emergencyContact} onChange={(e) => setContactForm({ ...contactForm, emergencyContact: e.target.value })} />
                </div>
                <div style={{ gridColumn: 'span 2' }}>
                  <label className="avm-label">Full School Address</label>
                  <input type="text" className="avm-input" value={contactForm.schoolAddress} onChange={(e) => setContactForm({ ...contactForm, schoolAddress: e.target.value })} />
                </div>
                <div style={{ gridColumn: 'span 2' }}>
                  <label className="avm-label">Google Maps Location Link</label>
                  <input type="text" className="avm-input" value={contactForm.googleMapsUrl} onChange={(e) => setContactForm({ ...contactForm, googleMapsUrl: e.target.value })} />
                </div>
                <div>
                  <label className="avm-label">Office Hours</label>
                  <input type="text" className="avm-input" value={contactForm.officeHours} onChange={(e) => setContactForm({ ...contactForm, officeHours: e.target.value })} />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <button type="submit" className="avm-btn-primary" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Save size={16} /> Save Contact Info
                </button>
              </div>
            </form>
          )}

          {/* --------------------------------------------------------------------- */}
          {/* PANEL 5: ACADEMIC CONFIGURATION */}
          {/* --------------------------------------------------------------------- */}
          {activeTab === 'academic-config' && (
            <form onSubmit={handleSaveAcademicConfig} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              <div>
                <h3 style={{ fontSize: 16, fontWeight: 800, color: '#0F172A', margin: 0 }}>Academic Configuration</h3>
                <p style={{ fontSize: 12, color: '#64748B', margin: '2px 0 0 0' }}>Configure school working days, start/end timing, and class period durations.</p>
              </div>

              {/* Working Days */}
              <div>
                <label className="avm-label" style={{ marginBottom: 8, display: 'block' }}>School Working Days</label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
                  {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map((day) => {
                    const isChecked = academicConfigForm.workingDays.includes(day);
                    return (
                      <label
                        key={day}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 6,
                          padding: '8px 14px',
                          borderRadius: 10,
                          border: isChecked ? '1px solid #1769E0' : '1px solid #CBD5E1',
                          backgroundColor: isChecked ? '#EFF6FF' : '#F8FAFC',
                          fontSize: 12,
                          fontWeight: isChecked ? 800 : 600,
                          color: isChecked ? '#1769E0' : '#475569',
                          cursor: 'pointer'
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setAcademicConfigForm({ ...academicConfigForm, workingDays: [...academicConfigForm.workingDays, day] });
                            } else {
                              setAcademicConfigForm({ ...academicConfigForm, workingDays: academicConfigForm.workingDays.filter((d) => d !== day) });
                            }
                          }}
                        />
                        {day}
                      </label>
                    );
                  })}
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 14 }}>
                <div>
                  <label className="avm-label">School Start Time</label>
                  <input type="time" className="avm-input" value={academicConfigForm.schoolStartTime} onChange={(e) => setAcademicConfigForm({ ...academicConfigForm, schoolStartTime: e.target.value })} />
                </div>
                <div>
                  <label className="avm-label">School End Time</label>
                  <input type="time" className="avm-input" value={academicConfigForm.schoolEndTime} onChange={(e) => setAcademicConfigForm({ ...academicConfigForm, schoolEndTime: e.target.value })} />
                </div>
                <div>
                  <label className="avm-label">Default Period Duration (Mins)</label>
                  <input type="number" className="avm-input" value={academicConfigForm.periodDurationMins} onChange={(e) => setAcademicConfigForm({ ...academicConfigForm, periodDurationMins: Number(e.target.value) })} />
                </div>
                <div>
                  <label className="avm-label">Number of Periods Per Day</label>
                  <input type="number" className="avm-input" value={academicConfigForm.numberOfPeriods} onChange={(e) => setAcademicConfigForm({ ...academicConfigForm, numberOfPeriods: Number(e.target.value) })} />
                </div>
              </div>

              {/* Saturday Toggle */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: 14, backgroundColor: '#F8FAFC', borderRadius: 12, border: '1px solid #E2E8F0' }}>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 800, color: '#0F172A' }}>Allow Saturday Classes</div>
                  <div style={{ fontSize: 11, color: '#64748B' }}>Enable Saturday timetable and attendance scheduling</div>
                </div>
                <input
                  type="checkbox"
                  checked={academicConfigForm.allowSaturdayClasses}
                  onChange={(e) => setAcademicConfigForm({ ...academicConfigForm, allowSaturdayClasses: e.target.checked })}
                  style={{ width: 20, height: 20, accentColor: '#1769E0', cursor: 'pointer' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <button type="submit" className="avm-btn-primary" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Save size={16} /> Save Configuration
                </button>
              </div>
            </form>
          )}

          {/* --------------------------------------------------------------------- */}
          {/* PANEL 6: CLASSES & SECTIONS SHORTCUT */}
          {/* --------------------------------------------------------------------- */}
          {activeTab === 'classes-sections' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <h3 style={{ fontSize: 16, fontWeight: 800, color: '#0F172A', margin: 0 }}>Classes & Sections Master</h3>
                <p style={{ fontSize: 12, color: '#64748B', margin: '2px 0 0 0' }}>Manage school grade levels, class divisions, teacher assignments and student capacity.</p>
              </div>

              <div style={{ padding: 24, borderRadius: 16, border: '1px solid #BFDBFE', backgroundColor: '#EFF6FF', display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div style={{ fontSize: 15, fontWeight: 800, color: '#1E40AF' }}>Central Classes & Sections Database</div>
                <div style={{ fontSize: 12, color: '#1E3A8A', lineHeight: 1.5 }}>
                  The central Classes & Sections module maintains active class records (Nursery to Class 8) and section divisions. You can add new classes, manage class teachers, edit section capacities, and configure section rooms.
                </div>
                <div>
                  <button
                    type="button"
                    className="avm-btn-primary"
                    onClick={() => onNavigateTab && onNavigateTab('classes')}
                    style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}
                  >
                    <Layers size={16} /> Open Classes & Sections Master
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* --------------------------------------------------------------------- */}
          {/* PANEL 7: SUBJECTS SHORTCUT */}
          {/* --------------------------------------------------------------------- */}
          {activeTab === 'subjects' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <h3 style={{ fontSize: 16, fontWeight: 800, color: '#0F172A', margin: 0 }}>Subject Master Settings</h3>
                <p style={{ fontSize: 12, color: '#64748B', margin: '2px 0 0 0' }}>Configure global curriculum subjects, subject codes, and class subject mappings.</p>
              </div>

              <div style={{ padding: 24, borderRadius: 16, border: '1px solid #BFDBFE', backgroundColor: '#EFF6FF', display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div style={{ fontSize: 15, fontWeight: 800, color: '#1E40AF' }}>Central Subject Master Repository</div>
                <div style={{ fontSize: 12, color: '#1E3A8A', lineHeight: 1.5 }}>
                  Subjects remain the central academic data source across Homework, Exams, Marks, Timetable, and Report Cards. You can create master subjects, assign subject teachers, set theory/practical max marks, and filter by class.
                </div>
                <div>
                  <button
                    type="button"
                    className="avm-btn-primary"
                    onClick={() => onNavigateTab && onNavigateTab('subjects')}
                    style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}
                  >
                    <BookOpen size={16} /> Open Subjects Master
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* --------------------------------------------------------------------- */}
          {/* PANEL 8: TIMETABLE CONFIGURATION */}
          {/* --------------------------------------------------------------------- */}
          {activeTab === 'timetable-config' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              <div>
                <h3 style={{ fontSize: 16, fontWeight: 800, color: '#0F172A', margin: 0 }}>Timetable Configuration</h3>
                <p style={{ fontSize: 12, color: '#64748B', margin: '2px 0 0 0' }}>Configure period slots, subject schedules, and teacher assignments.</p>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 14 }}>
                <div style={{ padding: 16, borderRadius: 12, border: '1px solid #E2E8F0', backgroundColor: '#F8FAFC' }}>
                  <div style={{ fontSize: 13, fontWeight: 800, color: '#0F172A', marginBottom: 4 }}>Period Timings</div>
                  <div style={{ fontSize: 11, color: '#64748B', marginBottom: 10 }}>8 Periods • {academicConfigForm.periodDurationMins} Mins Duration</div>
                  <button type="button" className="avm-btn-secondary" style={{ fontSize: 11, padding: '6px 12px' }} onClick={() => setActiveTab('academic-config')}>
                    Manage Timing
                  </button>
                </div>

                <div style={{ padding: 16, borderRadius: 12, border: '1px solid #E2E8F0', backgroundColor: '#F8FAFC' }}>
                  <div style={{ fontSize: 13, fontWeight: 800, color: '#0F172A', marginBottom: 4 }}>School Working Days</div>
                  <div style={{ fontSize: 11, color: '#64748B', marginBottom: 10 }}>{academicConfigForm.workingDays.join(', ')}</div>
                  <button type="button" className="avm-btn-secondary" style={{ fontSize: 11, padding: '6px 12px' }} onClick={() => setActiveTab('academic-config')}>
                    Manage Working Days
                  </button>
                </div>
              </div>

              <div style={{ padding: 20, borderRadius: 14, border: '1px solid #BFDBFE', backgroundColor: '#EFF6FF', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 800, color: '#1E40AF' }}>Interactive Timetable Matrix</div>
                  <div style={{ fontSize: 12, color: '#1E3A8A' }}>Open full timetable module to generate class & teacher schedules.</div>
                </div>
                <button
                  type="button"
                  className="avm-btn-primary"
                  onClick={() => onNavigateTab && onNavigateTab('timetable')}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}
                >
                  <Sliders size={16} /> Open Timetable Module
                </button>
              </div>
            </div>
          )}

          {/* --------------------------------------------------------------------- */}
          {/* PANEL 9: EXAMINATION SETTINGS */}
          {/* --------------------------------------------------------------------- */}
          {activeTab === 'exam-settings' && (
            <form onSubmit={handleSaveExamSettings} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              <div>
                <h3 style={{ fontSize: 16, fontWeight: 800, color: '#0F172A', margin: 0 }}>Examination Settings</h3>
                <p style={{ fontSize: 12, color: '#64748B', margin: '2px 0 0 0' }}>Configure exam types, passing thresholds, and official grading scale.</p>
              </div>

              {/* General Exam Parameters */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 14 }}>
                <div>
                  <label className="avm-label">Passing Percentage (%)</label>
                  <input type="number" className="avm-input" value={examForm.passingPercentage} onChange={(e) => setExamForm({ ...examForm, passingPercentage: Number(e.target.value) })} />
                </div>
                <div>
                  <label className="avm-label">Grade System Scale</label>
                  <select className="avm-input" value={examForm.gradeSystem} onChange={(e) => setExamForm({ ...examForm, gradeSystem: e.target.value })}>
                    <option value="Percentage Scale">Percentage Scale (A+, A, B+, B, C, D, F)</option>
                    <option value="GPA Scale">GPA 10 Point Scale</option>
                    <option value="Letter Grades">Letter Grades</option>
                  </select>
                </div>
                <div>
                  <label className="avm-label">Default Maximum Marks</label>
                  <input type="number" className="avm-input" value={examForm.maximumMarksDefault} onChange={(e) => setExamForm({ ...examForm, maximumMarksDefault: Number(e.target.value) })} />
                </div>
                <div>
                  <label className="avm-label">Default Passing Marks</label>
                  <input type="number" className="avm-input" value={examForm.minimumPassingMarksDefault} onChange={(e) => setExamForm({ ...examForm, minimumPassingMarksDefault: Number(e.target.value) })} />
                </div>
              </div>

              {/* Grade Ranges Table */}
              <div>
                <h4 style={{ fontSize: 13, fontWeight: 800, color: '#1769E0', marginBottom: 10 }}>Grade Range Configuration</h4>
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                    <thead>
                      <tr style={{ backgroundColor: '#F8FAFC', borderBottom: '2px solid #E2E8F0', color: '#475569', textAlign: 'left' }}>
                        <th style={{ padding: '8px 12px' }}>Grade</th>
                        <th style={{ padding: '8px 12px' }}>Min %</th>
                        <th style={{ padding: '8px 12px' }}>Max %</th>
                        <th style={{ padding: '8px 12px' }}>Remarks</th>
                      </tr>
                    </thead>
                    <tbody>
                      {examForm.gradeRanges.map((g, idx) => (
                        <tr key={g.id || idx} style={{ borderBottom: '1px solid #F1F5F9' }}>
                          <td style={{ padding: '8px 12px', fontWeight: 800, color: '#0F172A' }}>
                            <input
                              type="text"
                              className="avm-input"
                              value={g.grade}
                              onChange={(e) => {
                                const nextRanges = [...examForm.gradeRanges];
                                nextRanges[idx].grade = e.target.value;
                                setExamForm({ ...examForm, gradeRanges: nextRanges });
                              }}
                              style={{ width: 60, padding: '4px 8px' }}
                            />
                          </td>
                          <td style={{ padding: '8px 12px' }}>
                            <input
                              type="number"
                              className="avm-input"
                              value={g.minPercentage}
                              onChange={(e) => {
                                const nextRanges = [...examForm.gradeRanges];
                                nextRanges[idx].minPercentage = Number(e.target.value);
                                setExamForm({ ...examForm, gradeRanges: nextRanges });
                              }}
                              style={{ width: 80, padding: '4px 8px' }}
                            />
                          </td>
                          <td style={{ padding: '8px 12px' }}>
                            <input
                              type="number"
                              className="avm-input"
                              value={g.maxPercentage}
                              onChange={(e) => {
                                const nextRanges = [...examForm.gradeRanges];
                                nextRanges[idx].maxPercentage = Number(e.target.value);
                                setExamForm({ ...examForm, gradeRanges: nextRanges });
                              }}
                              style={{ width: 80, padding: '4px 8px' }}
                            />
                          </td>
                          <td style={{ padding: '8px 12px' }}>
                            <input
                              type="text"
                              className="avm-input"
                              value={g.remarks}
                              onChange={(e) => {
                                const nextRanges = [...examForm.gradeRanges];
                                nextRanges[idx].remarks = e.target.value;
                                setExamForm({ ...examForm, gradeRanges: nextRanges });
                              }}
                              style={{ padding: '4px 8px' }}
                            />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <button type="submit" className="avm-btn-primary" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Save size={16} /> Save Examination Settings
                </button>
              </div>
            </form>
          )}

          {/* --------------------------------------------------------------------- */}
          {/* PANEL 10: MARKS & RESULT SETTINGS */}
          {/* --------------------------------------------------------------------- */}
          {activeTab === 'marks-settings' && (
            <form onSubmit={handleSaveMarksSettings} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              <div>
                <h3 style={{ fontSize: 16, fontWeight: 800, color: '#0F172A', margin: 0 }}>Marks & Result Evaluation Settings</h3>
                <p style={{ fontSize: 12, color: '#64748B', margin: '2px 0 0 0' }}>Configure practical/internal assessment inclusion, attendance impact, and grace marks policies.</p>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {/* Toggle 1 */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: 14, backgroundColor: '#F8FAFC', borderRadius: 12, border: '1px solid #E2E8F0' }}>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 800, color: '#0F172A' }}>Include Practical Marks in Total Percentage</div>
                    <div style={{ fontSize: 11, color: '#64748B' }}>Add practical exam scores to total calculated aggregate percentage</div>
                  </div>
                  <input
                    type="checkbox"
                    checked={marksForm.includePracticalMarks}
                    onChange={(e) => setMarksForm({ ...marksForm, includePracticalMarks: e.target.checked })}
                    style={{ width: 20, height: 20, accentColor: '#1769E0', cursor: 'pointer' }}
                  />
                </div>

                {/* Toggle 2 */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: 14, backgroundColor: '#F8FAFC', borderRadius: 12, border: '1px solid #E2E8F0' }}>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 800, color: '#0F172A' }}>Include Internal Assessment Marks</div>
                    <div style={{ fontSize: 11, color: '#64748B' }}>Include continuous evaluation & internal project assessments</div>
                  </div>
                  <input
                    type="checkbox"
                    checked={marksForm.includeInternalAssessment}
                    onChange={(e) => setMarksForm({ ...marksForm, includeInternalAssessment: e.target.checked })}
                    style={{ width: 20, height: 20, accentColor: '#1769E0', cursor: 'pointer' }}
                  />
                </div>

                {/* Toggle 3 */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: 14, backgroundColor: '#F8FAFC', borderRadius: 12, border: '1px solid #E2E8F0' }}>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 800, color: '#0F172A' }}>Attendance Threshold Affects Result Eligibility</div>
                    <div style={{ fontSize: 11, color: '#64748B' }}>Require minimum 75% attendance to generate PASS status on report card</div>
                  </div>
                  <input
                    type="checkbox"
                    checked={marksForm.attendanceAffectsResult}
                    onChange={(e) => setMarksForm({ ...marksForm, attendanceAffectsResult: e.target.checked })}
                    style={{ width: 20, height: 20, accentColor: '#1769E0', cursor: 'pointer' }}
                  />
                </div>

                {/* Toggle 4 */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: 14, backgroundColor: '#F8FAFC', borderRadius: 12, border: '1px solid #E2E8F0' }}>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 800, color: '#0F172A' }}>Allow Grace Marks Allocation</div>
                    <div style={{ fontSize: 11, color: '#64748B' }}>Enable admin/teacher grace mark adjustment for borderline passing subjects</div>
                  </div>
                  <input
                    type="checkbox"
                    checked={marksForm.allowGraceMarks}
                    onChange={(e) => setMarksForm({ ...marksForm, allowGraceMarks: e.target.checked })}
                    style={{ width: 20, height: 20, accentColor: '#1769E0', cursor: 'pointer' }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <button type="submit" className="avm-btn-primary" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Save size={16} /> Save Evaluation Rules
                </button>
              </div>
            </form>
          )}

          {/* --------------------------------------------------------------------- */}
          {/* PANEL 11: NOTIFICATION SETTINGS */}
          {/* --------------------------------------------------------------------- */}
          {activeTab === 'notifications' && (
            <form onSubmit={handleSaveNotifSettings} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              <div>
                <h3 style={{ fontSize: 16, fontWeight: 800, color: '#0F172A', margin: 0 }}>Notification Settings</h3>
                <p style={{ fontSize: 12, color: '#64748B', margin: '2px 0 0 0' }}>Configure in-app alert broadcasting, push notifications and automated trigger rules.</p>
              </div>

              <div style={{ backgroundColor: '#EFF6FF', padding: 14, borderRadius: 12, border: '1px solid #BFDBFE', fontSize: 12, color: '#1E3A8A' }}>
                <strong>Notification Delivery System:</strong> These preferences control the central in-app notification center and push notification queue across Student and Employee apps.
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 12 }}>
                {[
                  { key: 'enableInAppNotifications', title: 'Enable In-App Notifications', sub: 'Broadcast notifications to mobile app notification center' },
                  { key: 'enableDemoPush', title: 'Enable Push Notifications', sub: 'Trigger push notification alerts on student/staff mobile devices' },
                  { key: 'notificationSound', title: 'Notification Sound', sub: 'Play default notification alert sound on arrival' },
                  { key: 'showNotificationBadge', title: 'Show Unread Badge', sub: 'Display red unread notification counter badge' },
                  { key: 'autoNotificationForAttendance', title: 'Auto Alert for Absence', sub: 'Automatically notify parent when student is marked ABSENT' },
                  { key: 'autoNotificationForHomework', title: 'Auto Alert for Homework', sub: 'Notify class when new homework is published by teacher' },
                  { key: 'autoNotificationForFees', title: 'Auto Alert for Fee Due', sub: 'Trigger automated fee payment due reminders' },
                  { key: 'autoNotificationForExams', title: 'Auto Alert for Exams', sub: 'Notify students when exam date sheets or admit cards publish' },
                  { key: 'autoNotificationForResults', title: 'Auto Alert for Exam Results', sub: 'Notify parents when term report cards publish' },
                  { key: 'autoNotificationForNotices', title: 'Auto Alert for School Notices', sub: 'Notify all recipients upon publishing school notices' }
                ].map((item) => (
                  <div key={item.key} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: 12, backgroundColor: '#F8FAFC', borderRadius: 12, border: '1px solid #E2E8F0' }}>
                    <div style={{ paddingRight: 10 }}>
                      <div style={{ fontSize: 12.5, fontWeight: 800, color: '#0F172A' }}>{item.title}</div>
                      <div style={{ fontSize: 11, color: '#64748B' }}>{item.sub}</div>
                    </div>
                    <input
                      type="checkbox"
                      checked={(notifForm as any)[item.key]}
                      onChange={(e) => setNotifForm({ ...notifForm, [item.key]: e.target.checked })}
                      style={{ width: 18, height: 18, accentColor: '#1769E0', cursor: 'pointer', flexShrink: 0 }}
                    />
                  </div>
                ))}
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <button type="submit" className="avm-btn-primary" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Save size={16} /> Save Notification Preferences
                </button>
              </div>
            </form>
          )}

          {/* --------------------------------------------------------------------- */}
          {/* PANEL 12: NOTICE SETTINGS */}
          {/* --------------------------------------------------------------------- */}
          {activeTab === 'notice-settings' && (
            <form onSubmit={handleSaveNoticeSettings} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              <div>
                <h3 style={{ fontSize: 16, fontWeight: 800, color: '#0F172A', margin: 0 }}>Notice Broadcasting Settings</h3>
                <p style={{ fontSize: 12, color: '#64748B', margin: '2px 0 0 0' }}>Configure default notice categories, targeting options and admin approval policies.</p>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 14 }}>
                <div>
                  <label className="avm-label">Default Notice Category</label>
                  <select className="avm-input" value={noticeConfigForm.defaultNoticeType} onChange={(e) => setNoticeConfigForm({ ...noticeConfigForm, defaultNoticeType: e.target.value })}>
                    <option value="General">General Notice</option>
                    <option value="Academic">Academic Circular</option>
                    <option value="Exam">Examination Notice</option>
                    <option value="Event">Event & Holiday</option>
                  </select>
                </div>
                <div>
                  <label className="avm-label">Notice Expiry Duration (Days)</label>
                  <input type="number" className="avm-input" value={noticeConfigForm.noticeExpiryDays} onChange={(e) => setNoticeConfigForm({ ...noticeConfigForm, noticeExpiryDays: Number(e.target.value) })} />
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: 12, backgroundColor: '#F8FAFC', borderRadius: 12, border: '1px solid #E2E8F0' }}>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 800, color: '#0F172A' }}>Allow Scheduled Notice Publishing</div>
                    <div style={{ fontSize: 11, color: '#64748B' }}>Permit setting future publish dates for school circulars</div>
                  </div>
                  <input type="checkbox" checked={noticeConfigForm.allowScheduledNotices} onChange={(e) => setNoticeConfigForm({ ...noticeConfigForm, allowScheduledNotices: e.target.checked })} style={{ width: 18, height: 18, accentColor: '#1769E0', cursor: 'pointer' }} />
                </div>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: 12, backgroundColor: '#F8FAFC', borderRadius: 12, border: '1px solid #E2E8F0' }}>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 800, color: '#0F172A' }}>Allow Specific Class Targeting</div>
                    <div style={{ fontSize: 11, color: '#64748B' }}>Enable sending notices to specific classes or sections</div>
                  </div>
                  <input type="checkbox" checked={noticeConfigForm.allowClassTargeting} onChange={(e) => setNoticeConfigForm({ ...noticeConfigForm, allowClassTargeting: e.target.checked })} style={{ width: 18, height: 18, accentColor: '#1769E0', cursor: 'pointer' }} />
                </div>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: 12, backgroundColor: '#F8FAFC', borderRadius: 12, border: '1px solid #E2E8F0' }}>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 800, color: '#0F172A' }}>Require Admin Approval for Teacher Notices</div>
                    <div style={{ fontSize: 11, color: '#64748B' }}>Teacher notices require admin review before broadcasting</div>
                  </div>
                  <input type="checkbox" checked={noticeConfigForm.requireAdminApproval} onChange={(e) => setNoticeConfigForm({ ...noticeConfigForm, requireAdminApproval: e.target.checked })} style={{ width: 18, height: 18, accentColor: '#1769E0', cursor: 'pointer' }} />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <button type="submit" className="avm-btn-primary" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Save size={16} /> Save Notice Settings
                </button>
              </div>
            </form>
          )}

          {/* --------------------------------------------------------------------- */}
          {/* PANEL 13: MESSAGE TEMPLATES */}
          {/* --------------------------------------------------------------------- */}
          {activeTab === 'message-templates' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              <div>
                <h3 style={{ fontSize: 16, fontWeight: 800, color: '#0F172A', margin: 0 }}>Message & Notification Templates</h3>
                <p style={{ fontSize: 12, color: '#64748B', margin: '2px 0 0 0' }}>Pre-configured standard templates for fee reminders, attendance alerts, and exam notices.</p>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 14 }}>
                {[
                  { name: 'Fee Due Reminder', type: 'Fee', msg: 'Dear Parent, This is a gentle reminder that the school fee of ₹{Amount} for {Month} is due on {DueDate}. Kindly clear the dues on time.' },
                  { name: 'Absence Alert', type: 'Attendance', msg: 'Dear Parent, your ward {StudentName} of Class {Class} was marked ABSENT today ({Date}). Contact school office if unauthorized.' },
                  { name: 'Homework Notification', type: 'Homework', msg: 'New homework for {Subject} has been assigned for Class {Class}. Please check the student portal for details and submission deadline.' },
                  { name: 'Exam Datesheet Notice', type: 'Exam', msg: 'Half Yearly Examinations start on {Date}. Ensure student arrives by 08:30 AM with Admit Card.' },
                  { name: 'Result Announcement', type: 'Result', msg: 'Results for {ExamName} have been published. Log in to the portal to view the digital mark sheet.' }
                ].map((tmp, i) => (
                  <div key={i} style={{ padding: 14, borderRadius: 12, border: '1px solid #E2E8F0', backgroundColor: '#F8FAFC' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                      <span style={{ fontSize: 13, fontWeight: 800, color: '#0F172A' }}>{tmp.name}</span>
                      <span style={{ backgroundColor: '#EFF6FF', color: '#1769E0', fontSize: 10, fontWeight: 800, padding: '2px 8px', borderRadius: 10 }}>{tmp.type}</span>
                    </div>
                    <div style={{ fontSize: 11.5, color: '#475569', backgroundColor: '#FFF', padding: 10, borderRadius: 8, border: '1px solid #E2E8F0', fontStyle: 'italic', lineHeight: 1.4 }}>
                      "{tmp.msg}"
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* --------------------------------------------------------------------- */}
          {/* PANEL 14: ADMIN ACCOUNT SETTINGS */}
          {/* --------------------------------------------------------------------- */}
          {activeTab === 'admin-account' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
              <form onSubmit={handleSaveAdminAccount} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div>
                  <h3 style={{ fontSize: 16, fontWeight: 800, color: '#0F172A', margin: 0 }}>Administrator Profile</h3>
                  <p style={{ fontSize: 12, color: '#64748B', margin: '2px 0 0 0' }}>Manage Admin user credentials and contact profile details.</p>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 14 }}>
                  <div>
                    <label className="avm-label">Administrator Display Name</label>
                    <input type="text" className="avm-input" value={adminAccountForm.adminName} onChange={(e) => setAdminAccountForm({ ...adminAccountForm, adminName: e.target.value })} />
                  </div>
                  <div>
                    <label className="avm-label">Username</label>
                    <input type="text" className="avm-input" value={adminAccountForm.username} onChange={(e) => setAdminAccountForm({ ...adminAccountForm, username: e.target.value })} />
                  </div>
                  <div>
                    <label className="avm-label">Admin Email</label>
                    <input type="email" className="avm-input" value={adminAccountForm.email} onChange={(e) => setAdminAccountForm({ ...adminAccountForm, email: e.target.value })} />
                  </div>
                  <div>
                    <label className="avm-label">Mobile Number</label>
                    <input type="text" className="avm-input" value={adminAccountForm.mobile} onChange={(e) => setAdminAccountForm({ ...adminAccountForm, mobile: e.target.value })} />
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                  <button type="submit" className="avm-btn-primary" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Save size={16} /> Update Admin Profile
                  </button>
                </div>
              </form>

              {/* Change Password Form */}
              <form onSubmit={handleChangePasswordSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16, borderTop: '1px solid #E2E8F0', paddingTop: 20 }}>
                <div>
                  <h4 style={{ fontSize: 14, fontWeight: 800, color: '#0F172A', margin: 0 }}>Change Admin Password</h4>
                  <p style={{ fontSize: 12, color: '#64748B', margin: '2px 0 0 0' }}>Update administrator web login password.</p>
                </div>

                {passMsg && (
                  <div style={{ padding: '10px 14px', borderRadius: 10, fontSize: 12, fontWeight: 700, backgroundColor: passMsg.error ? '#FEF2F2' : '#F0FDF4', color: passMsg.error ? '#DC2626' : '#16A34A', border: `1px solid ${passMsg.error ? '#FCA5A5' : '#86EFAC'}` }}>
                    {passMsg.text}
                  </div>
                )}

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 14 }}>
                  <div>
                    <label className="avm-label">Current Password</label>
                    <input type="password" className="avm-input" value={currPassword} onChange={(e) => setCurrPassword(e.target.value)} placeholder="••••••••" required />
                  </div>
                  <div>
                    <label className="avm-label">New Password</label>
                    <input type="password" className="avm-input" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="••••••••" required />
                  </div>
                  <div>
                    <label className="avm-label">Confirm New Password</label>
                    <input type="password" className="avm-input" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="••••••••" required />
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                  <button type="submit" className="avm-btn-primary" style={{ display: 'flex', alignItems: 'center', gap: 8, backgroundColor: '#0F172A' }}>
                    <Lock size={16} /> Update Password
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* --------------------------------------------------------------------- */}
          {/* PANEL 15: ROLES & PERMISSIONS */}
          {/* --------------------------------------------------------------------- */}
          {activeTab === 'roles-permissions' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              <div>
                <h3 style={{ fontSize: 16, fontWeight: 800, color: '#0F172A', margin: 0 }}>Roles & Permissions Matrix</h3>
                <p style={{ fontSize: 12, color: '#64748B', margin: '2px 0 0 0' }}>Overview of access controls for Admin, Employee / Teacher, and Student roles.</p>
              </div>

              {/* Roles Summary Cards */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12 }}>
                <div style={{ padding: 14, borderRadius: 12, border: '1px solid #BFDBFE', backgroundColor: '#EFF6FF' }}>
                  <div style={{ fontSize: 13, fontWeight: 800, color: '#1E40AF' }}>Admin (Web Only)</div>
                  <div style={{ fontSize: 11, color: '#1E3A8A', marginTop: 4 }}>Full system access to settings, financials, academic management and data store.</div>
                </div>

                <div style={{ padding: 14, borderRadius: 12, border: '1px solid #E2E8F0', backgroundColor: '#F8FAFC' }}>
                  <div style={{ fontSize: 13, fontWeight: 800, color: '#0F172A' }}>Employee / Teacher</div>
                  <div style={{ fontSize: 11, color: '#64748B', marginTop: 4 }}>Access to attendance, homework upload, class timetable and assigned student marks.</div>
                </div>

                <div style={{ padding: 14, borderRadius: 12, border: '1px solid #E2E8F0', backgroundColor: '#F8FAFC' }}>
                  <div style={{ fontSize: 13, fontWeight: 800, color: '#0F172A' }}>Student / Parent</div>
                  <div style={{ fontSize: 11, color: '#64748B', marginTop: 4 }}>View-only access to own attendance, fee receipts, admit cards, report cards & notices.</div>
                </div>
              </div>

              {/* Permissions Matrix Table */}
              <div>
                <h4 style={{ fontSize: 13, fontWeight: 800, color: '#0F172A', marginBottom: 10 }}>Module Permissions Matrix</h4>
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12.5 }}>
                    <thead>
                      <tr style={{ backgroundColor: '#F8FAFC', borderBottom: '2px solid #E2E8F0', textAlign: 'left', color: '#475569' }}>
                        <th style={{ padding: '10px 12px' }}>Module / Feature</th>
                        <th style={{ padding: '10px 12px' }}>Admin</th>
                        <th style={{ padding: '10px 12px' }}>Employee / Teacher</th>
                        <th style={{ padding: '10px 12px' }}>Student / Parent</th>
                      </tr>
                    </thead>
                    <tbody>
                      {[
                        { module: 'Students Management', admin: 'Full Access', emp: 'Class Students Only', stu: 'Own Profile' },
                        { module: 'Employees Management', admin: 'Full Access', emp: 'Own Profile', stu: 'No Access' },
                        { module: 'Attendance Register', admin: 'Full Access', emp: 'Take & Edit Class Attendance', stu: 'View Own Record' },
                        { module: 'Homework & Assignments', admin: 'Full Access', emp: 'Upload & Review', stu: 'View & Submit' },
                        { module: 'Exams & Marks Entry', admin: 'Full Access', emp: 'Assigned Subject Marks', stu: 'View Own Results' },
                        { module: 'Fee Management & Receipts', admin: 'Full Access', emp: 'View Summary', stu: 'Pay & View Own Receipts' },
                        { module: 'Admit Cards & Certificates', admin: 'Full Access', emp: 'View & Print', stu: 'Download Own' },
                        { module: 'School Settings & System', admin: 'Full Access', emp: 'No Access', stu: 'No Access' }
                      ].map((row, i) => (
                        <tr key={i} style={{ borderBottom: '1px solid #F1F5F9' }}>
                          <td style={{ padding: '10px 12px', fontWeight: 800, color: '#0F172A' }}>{row.module}</td>
                          <td style={{ padding: '10px 12px', color: '#16A34A', fontWeight: 700 }}>✓ {row.admin}</td>
                          <td style={{ padding: '10px 12px', color: '#1769E0', fontWeight: 600 }}>{row.emp}</td>
                          <td style={{ padding: '10px 12px', color: '#475569', fontWeight: 600 }}>{row.stu}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* --------------------------------------------------------------------- */}
          {/* PANEL 16: LOGIN & SECURITY */}
          {/* --------------------------------------------------------------------- */}
          {activeTab === 'security-settings' && (
            <form onSubmit={handleSaveSecurity} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              <div>
                <h3 style={{ fontSize: 16, fontWeight: 800, color: '#0F172A', margin: 0 }}>Login & Security Policies</h3>
                <p style={{ fontSize: 12, color: '#64748B', margin: '2px 0 0 0' }}>Configure session timeout, login attempt limits, and inactivity policies.</p>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 14 }}>
                <div>
                  <label className="avm-label">Session Timeout (Minutes)</label>
                  <input type="number" className="avm-input" value={secForm.sessionTimeoutMins} onChange={(e) => setSecForm({ ...secForm, sessionTimeoutMins: Number(e.target.value) })} />
                </div>
                <div>
                  <label className="avm-label">Require Password Change (Days)</label>
                  <input type="number" className="avm-input" value={secForm.requirePasswordChangeDays} onChange={(e) => setSecForm({ ...secForm, requirePasswordChangeDays: Number(e.target.value) })} />
                </div>
                <div>
                  <label className="avm-label">Login Attempt Limit</label>
                  <input type="number" className="avm-input" value={secForm.loginAttemptLimit} onChange={(e) => setSecForm({ ...secForm, loginAttemptLimit: Number(e.target.value) })} />
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: 12, backgroundColor: '#F8FAFC', borderRadius: 12, border: '1px solid #E2E8F0' }}>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 800, color: '#0F172A' }}>Allow "Remember Login" on Web</div>
                    <div style={{ fontSize: 11, color: '#64748B' }}>Persist admin session across tab refreshes</div>
                  </div>
                  <input type="checkbox" checked={secForm.rememberLogin} onChange={(e) => setSecForm({ ...secForm, rememberLogin: e.target.checked })} style={{ width: 18, height: 18, accentColor: '#1769E0', cursor: 'pointer' }} />
                </div>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: 12, backgroundColor: '#F8FAFC', borderRadius: 12, border: '1px solid #E2E8F0' }}>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 800, color: '#0F172A' }}>Auto Logout on Inactivity</div>
                    <div style={{ fontSize: 11, color: '#64748B' }}>Automatically lock session after idle duration</div>
                  </div>
                  <input type="checkbox" checked={secForm.autoLogoutOnInactivity} onChange={(e) => setSecForm({ ...secForm, autoLogoutOnInactivity: e.target.checked })} style={{ width: 18, height: 18, accentColor: '#1769E0', cursor: 'pointer' }} />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <button type="submit" className="avm-btn-primary" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Save size={16} /> Save Security Policies
                </button>
              </div>
            </form>
          )}

          {/* --------------------------------------------------------------------- */}
          {/* PANEL 17: APP CONFIGURATION */}
          {/* --------------------------------------------------------------------- */}
          {activeTab === 'app-config' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              <div>
                <h3 style={{ fontSize: 16, fontWeight: 800, color: '#0F172A', margin: 0 }}>Application Configuration</h3>
                <p style={{ fontSize: 12, color: '#64748B', margin: '2px 0 0 0' }}>System release information and environment parameters.</p>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 14 }}>
                <div style={{ padding: 14, backgroundColor: '#F8FAFC', borderRadius: 12, border: '1px solid #E2E8F0' }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: '#64748B' }}>Application Name</div>
                  <div style={{ fontSize: 15, fontWeight: 800, color: '#0F172A', marginTop: 2 }}>{appConfigForm.appName}</div>
                </div>
                <div style={{ padding: 14, backgroundColor: '#F8FAFC', borderRadius: 12, border: '1px solid #E2E8F0' }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: '#64748B' }}>App Release Version</div>
                  <div style={{ fontSize: 15, fontWeight: 800, color: '#0F172A', marginTop: 2 }}>v{appConfigForm.appVersion}</div>
                </div>
                <div style={{ padding: 14, backgroundColor: '#FEF3C7', borderRadius: 12, border: '1px solid #FCD34D' }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: '#92400E' }}>Operating Environment</div>
                  <div style={{ fontSize: 15, fontWeight: 800, color: '#B45309', marginTop: 2 }}>{appConfigForm.environment}</div>
                </div>
                <div style={{ padding: 14, backgroundColor: '#F0FDF4', borderRadius: 12, border: '1px solid #86EFAC' }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: '#166534' }}>Persistence Engine</div>
                  <div style={{ fontSize: 15, fontWeight: 800, color: '#15803D', marginTop: 2 }}>{appConfigForm.persistenceLayer}</div>
                </div>
              </div>
            </div>
          )}

          {/* --------------------------------------------------------------------- */}
          {/* PANEL 18: DATA & DEMO STORE */}
          {/* --------------------------------------------------------------------- */}
          {activeTab === 'data-demo-store' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
              <div>
                <h3 style={{ fontSize: 16, fontWeight: 800, color: '#0F172A', margin: 0 }}>Data & Demo Store Control Center</h3>
                <p style={{ fontSize: 12, color: '#64748B', margin: '2px 0 0 0' }}>Manage local persistent database, backup JSON exports and store resets.</p>
              </div>

              {/* Status Box */}
              <div style={{ padding: 16, borderRadius: 14, backgroundColor: '#F8FAFC', border: '1px solid #E2E8F0', display: 'flex', flexDirection: 'column', gap: 10 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: 13, fontWeight: 800, color: '#0F172A' }}>Storage Status</span>
                  <span style={{ backgroundColor: '#16A34A', color: '#FFF', fontSize: 11, fontWeight: 800, padding: '2px 10px', borderRadius: 12 }}>PERSISTENCE ACTIVE</span>
                </div>
                <div style={{ fontSize: 12, color: '#475569' }}>
                  Storage Engine: <strong>Capacitor Preferences API + localStorage Sync</strong>
                </div>
                <div style={{ fontSize: 12, color: '#475569' }}>
                  Total Registered Records: <strong>{studentCount} Students, {employeeCount} Staff, {sessions.length} Sessions</strong>
                </div>
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
                <button type="button" className="avm-btn-primary" onClick={handleExportJsonDownload} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Download size={16} /> Backup & Export Demo Data
                </button>
                <button type="button" className="avm-btn-secondary" onClick={() => setJsonImportModalOpen(true)} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Upload size={16} /> Restore & Import Demo Data
                </button>
              </div>

              {/* DANGER ZONE BOX */}
              <div style={{ padding: 20, borderRadius: 14, backgroundColor: '#FEF2F2', border: '1.5px solid #FCA5A5', display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: '#DC2626' }}>
                  <AlertCircle size={20} />
                  <span style={{ fontSize: 15, fontWeight: 900 }}>Danger Zone</span>
                </div>
                <div style={{ fontSize: 12, color: '#991B1B', lineHeight: 1.5 }}>
                  Resetting demo data will clear custom admin changes from this browser session and restore default clean seed data.
                </div>
                <div>
                  <button
                    type="button"
                    onClick={() => setResetModalOpen(true)}
                    style={{
                      backgroundColor: '#DC2626',
                      color: '#FFFFFF',
                      border: 'none',
                      borderRadius: 10,
                      padding: '10px 18px',
                      fontSize: 13,
                      fontWeight: 800,
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 8
                    }}
                  >
                    <RotateCcw size={16} /> Reset Demo Data
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* --------------------------------------------------------------------- */}
          {/* PANEL 19: BACKUP / RESTORE */}
          {/* --------------------------------------------------------------------- */}
          {activeTab === 'backup-restore' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              <div>
                <h3 style={{ fontSize: 16, fontWeight: 800, color: '#0F172A', margin: 0 }}>Backup & Restore JSON Data</h3>
                <p style={{ fontSize: 12, color: '#64748B', margin: '2px 0 0 0' }}>Export full database state or import valid JSON backup files.</p>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 16 }}>
                <div style={{ padding: 20, borderRadius: 14, border: '1px solid #E2E8F0', backgroundColor: '#F8FAFC', display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <div style={{ fontSize: 14, fontWeight: 800, color: '#0F172A' }}>Export Database JSON</div>
                  <div style={{ fontSize: 12, color: '#64748B' }}>Download a complete JSON snapshot containing all students, employees, classes, fees, marks, and settings.</div>
                  <button type="button" className="avm-btn-primary" onClick={handleExportJsonDownload} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                    <Download size={16} /> Export JSON File
                  </button>
                </div>

                <div style={{ padding: 20, borderRadius: 14, border: '1px solid #E2E8F0', backgroundColor: '#F8FAFC', display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <div style={{ fontSize: 14, fontWeight: 800, color: '#0F172A' }}>Import JSON Backup</div>
                  <div style={{ fontSize: 12, color: '#64748B' }}>Upload or paste a JSON database string to restore database state.</div>
                  <button type="button" className="avm-btn-secondary" onClick={() => setJsonImportModalOpen(true)} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                    <Upload size={16} /> Open JSON Importer
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* --------------------------------------------------------------------- */}
          {/* PANEL 20: AUDIT LOG */}
          {/* --------------------------------------------------------------------- */}
          {activeTab === 'audit-log' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              <div>
                <h3 style={{ fontSize: 16, fontWeight: 800, color: '#0F172A', margin: 0 }}>System Audit Log</h3>
                <p style={{ fontSize: 12, color: '#64748B', margin: '2px 0 0 0' }}>Traceable log of administrator actions, data changes and session updates.</p>
              </div>

              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                  <thead>
                    <tr style={{ backgroundColor: '#F8FAFC', borderBottom: '2px solid #E2E8F0', color: '#475569', textAlign: 'left' }}>
                      <th style={{ padding: '10px 12px' }}>Date / Time</th>
                      <th style={{ padding: '10px 12px' }}>Admin</th>
                      <th style={{ padding: '10px 12px' }}>Module</th>
                      <th style={{ padding: '10px 12px' }}>Action</th>
                      <th style={{ padding: '10px 12px' }}>Description</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(settings.auditLogs || []).map((log) => (
                      <tr key={log.id} style={{ borderBottom: '1px solid #F1F5F9' }}>
                        <td style={{ padding: '10px 12px', whiteSpace: 'nowrap', color: '#64748B', fontWeight: 600 }}>{log.timestamp}</td>
                        <td style={{ padding: '10px 12px', fontWeight: 700, color: '#0F172A' }}>{log.adminName}</td>
                        <td style={{ padding: '10px 12px' }}>
                          <span style={{ backgroundColor: '#EFF6FF', color: '#1769E0', fontSize: 10, fontWeight: 800, padding: '2px 8px', borderRadius: 10 }}>
                            {log.module}
                          </span>
                        </td>
                        <td style={{ padding: '10px 12px', fontWeight: 800, color: log.action === 'Reset' ? '#DC2626' : log.action === 'Created' ? '#16A34A' : '#1769E0' }}>
                          {log.action}
                        </td>
                        <td style={{ padding: '10px 12px', color: '#334155' }}>{log.description}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* --------------------------------------------------------------------- */}
          {/* PANEL 21: PRINT & DOCUMENT SETTINGS */}
          {/* --------------------------------------------------------------------- */}
          {activeTab === 'print-document' && (
            <form onSubmit={handleSaveDocSettings} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              <div>
                <h3 style={{ fontSize: 16, fontWeight: 800, color: '#0F172A', margin: 0 }}>Print & Document Settings</h3>
                <p style={{ fontSize: 12, color: '#64748B', margin: '2px 0 0 0' }}>Configure default headers, signatures, seals and formats for Certificates, Admit Cards, and Report Cards.</p>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 14 }}>
                <div style={{ gridColumn: 'span 2' }}>
                  <label className="avm-label">School Name on Printed Documents</label>
                  <input type="text" className="avm-input" value={docForm.schoolNameOnDocuments} onChange={(e) => setDocForm({ ...docForm, schoolNameOnDocuments: e.target.value })} />
                </div>
                <div style={{ gridColumn: 'span 2' }}>
                  <label className="avm-label">School Header Address</label>
                  <input type="text" className="avm-input" value={docForm.schoolAddressOnDocuments} onChange={(e) => setDocForm({ ...docForm, schoolAddressOnDocuments: e.target.value })} />
                </div>
                <div>
                  <label className="avm-label">Principal Name Signature</label>
                  <input type="text" className="avm-input" value={docForm.principalName} onChange={(e) => setDocForm({ ...docForm, principalName: e.target.value })} />
                </div>
                <div>
                  <label className="avm-label">Signature Designation Text</label>
                  <input type="text" className="avm-input" value={docForm.signatureText} onChange={(e) => setDocForm({ ...docForm, signatureText: e.target.value })} />
                </div>
                <div>
                  <label className="avm-label">Date Format on Printed PDFs</label>
                  <select className="avm-input" value={docForm.dateFormat} onChange={(e) => setDocForm({ ...docForm, dateFormat: e.target.value })}>
                    <option value="DD/MM/YYYY">DD/MM/YYYY (e.g. 30/09/2026)</option>
                    <option value="DD-MM-YYYY">DD-MM-YYYY (e.g. 30-09-2026)</option>
                    <option value="YYYY-MM-DD">YYYY-MM-DD (e.g. 2026-09-30)</option>
                  </select>
                </div>
                <div>
                  <label className="avm-label">Default Paper Size</label>
                  <select className="avm-input" value={docForm.paperSize} onChange={(e) => setDocForm({ ...docForm, paperSize: e.target.value })}>
                    <option value="A4">A4 Standard (Recommended)</option>
                    <option value="Letter">Letter Format</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <button type="submit" className="avm-btn-primary" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Save size={16} /> Save Document Preferences
                </button>
              </div>
            </form>
          )}

          {/* --------------------------------------------------------------------- */}
          {/* PANEL 22: DATE & TIME */}
          {/* --------------------------------------------------------------------- */}
          {activeTab === 'date-time' && (
            <form onSubmit={handleSaveDateTime} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              <div>
                <h3 style={{ fontSize: 16, fontWeight: 800, color: '#0F172A', margin: 0 }}>Date & Time Format Settings</h3>
                <p style={{ fontSize: 12, color: '#64748B', margin: '2px 0 0 0' }}>Configure default calendar date format, clock display, and timezone.</p>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 14 }}>
                <div>
                  <label className="avm-label">System Date Format</label>
                  <select className="avm-input" value={dtForm.dateFormat} onChange={(e) => setDtForm({ ...dtForm, dateFormat: e.target.value })}>
                    <option value="DD/MM/YYYY">DD/MM/YYYY (30/09/2026)</option>
                    <option value="DD-MM-YYYY">DD-MM-YYYY (30-09-2026)</option>
                    <option value="YYYY-MM-DD">YYYY-MM-DD (2026-09-30)</option>
                  </select>
                </div>
                <div>
                  <label className="avm-label">Time Display Format</label>
                  <select className="avm-input" value={dtForm.timeFormat} onChange={(e) => setDtForm({ ...dtForm, timeFormat: e.target.value as any })}>
                    <option value="12 Hour">12 Hour Format (08:30 AM)</option>
                    <option value="24 Hour">24 Hour Format (08:30)</option>
                  </select>
                </div>
                <div>
                  <label className="avm-label">Standard Timezone</label>
                  <input type="text" className="avm-input" value={dtForm.timezone} onChange={(e) => setDtForm({ ...dtForm, timezone: e.target.value })} />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <button type="submit" className="avm-btn-primary" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Save size={16} /> Save Date & Time Settings
                </button>
              </div>
            </form>
          )}

          {/* --------------------------------------------------------------------- */}
          {/* PANEL 23: LANGUAGE SETTINGS */}
          {/* --------------------------------------------------------------------- */}
          {activeTab === 'language' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              <div>
                <h3 style={{ fontSize: 16, fontWeight: 800, color: '#0F172A', margin: 0 }}>Language & Localization</h3>
                <p style={{ fontSize: 12, color: '#64748B', margin: '2px 0 0 0' }}>Select system language preference for web admin and mobile apps.</p>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 14 }}>
                <div style={{ padding: 16, borderRadius: 12, border: '2px solid #1769E0', backgroundColor: '#EFF6FF' }}>
                  <div style={{ fontSize: 14, fontWeight: 800, color: '#1769E0' }}>English (India)</div>
                  <div style={{ fontSize: 11, color: '#1E40AF', marginTop: 4 }}>Default System Language (Active)</div>
                </div>
                <div style={{ padding: 16, borderRadius: 12, border: '1px solid #E2E8F0', backgroundColor: '#F8FAFC', opacity: 0.8 }}>
                  <div style={{ fontSize: 14, fontWeight: 800, color: '#475569' }}>Hindi (हिंदी)</div>
                  <div style={{ fontSize: 11, color: '#64748B', marginTop: 4 }}>Available for Notices & Reports</div>
                </div>
              </div>
            </div>
          )}

          {/* --------------------------------------------------------------------- */}
          {/* PANEL 24: PRIVACY & TERMS (LEGAL) */}
          {/* --------------------------------------------------------------------- */}
          {activeTab === 'legal-privacy' && (
            <form onSubmit={handleSaveLegal} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              <div>
                <h3 style={{ fontSize: 16, fontWeight: 800, color: '#0F172A', margin: 0 }}>Legal, Privacy & Terms</h3>
                <p style={{ fontSize: 12, color: '#64748B', margin: '2px 0 0 0' }}>Configure mobile app policy links, terms of service and compliance contacts.</p>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 14 }}>
                <div style={{ gridColumn: 'span 2' }}>
                  <label className="avm-label">Privacy Policy URL</label>
                  <input type="text" className="avm-input" value={legalForm.privacyPolicyUrl} onChange={(e) => setLegalForm({ ...legalForm, privacyPolicyUrl: e.target.value })} />
                </div>
                <div style={{ gridColumn: 'span 2' }}>
                  <label className="avm-label">Terms & Conditions URL</label>
                  <input type="text" className="avm-input" value={legalForm.termsConditionsUrl} onChange={(e) => setLegalForm({ ...legalForm, termsConditionsUrl: e.target.value })} />
                </div>
                <div>
                  <label className="avm-label">Compliance / Support Email</label>
                  <input type="email" className="avm-input" value={legalForm.supportEmail} onChange={(e) => setLegalForm({ ...legalForm, supportEmail: e.target.value })} />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <button type="submit" className="avm-btn-primary" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Save size={16} /> Save Policy Links
                </button>
              </div>
            </form>
          )}

          {/* --------------------------------------------------------------------- */}
          {/* PANEL 25: SUPPORT & CONTACT */}
          {/* --------------------------------------------------------------------- */}
          {activeTab === 'support-contact' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              <div>
                <h3 style={{ fontSize: 16, fontWeight: 800, color: '#0F172A', margin: 0 }}>Support & Technical Contact</h3>
                <p style={{ fontSize: 12, color: '#64748B', margin: '2px 0 0 0' }}>Official school ERP support contact numbers and office desk links.</p>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 14 }}>
                <div style={{ padding: 16, borderRadius: 12, border: '1px solid #E2E8F0', backgroundColor: '#F8FAFC' }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: '#64748B' }}>Support Phone</div>
                  <div style={{ fontSize: 15, fontWeight: 800, color: '#0F172A', marginTop: 2 }}>{settings.contact.phone}</div>
                  <a href={`tel:${settings.contact.phone}`} className="avm-btn-secondary" style={{ display: 'inline-flex', marginTop: 10, fontSize: 11, padding: '4px 10px' }}>
                    <Phone size={12} style={{ marginRight: 4 }} /> Call School Office
                  </a>
                </div>

                <div style={{ padding: 16, borderRadius: 12, border: '1px solid #E2E8F0', backgroundColor: '#F8FAFC' }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: '#64748B' }}>Support Email</div>
                  <div style={{ fontSize: 15, fontWeight: 800, color: '#0F172A', marginTop: 2 }}>{settings.contact.email}</div>
                  <a href={`mailto:${settings.contact.email}`} className="avm-btn-secondary" style={{ display: 'inline-flex', marginTop: 10, fontSize: 11, padding: '4px 10px' }}>
                    <Mail size={12} style={{ marginRight: 4 }} /> Email Support
                  </a>
                </div>

                <div style={{ padding: 16, borderRadius: 12, border: '1px solid #E2E8F0', backgroundColor: '#F8FAFC' }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: '#64748B' }}>School Website</div>
                  <div style={{ fontSize: 15, fontWeight: 800, color: '#0F172A', marginTop: 2 }}>{settings.contact.website}</div>
                  <a href={settings.contact.website} target="_blank" rel="noreferrer" className="avm-btn-secondary" style={{ display: 'inline-flex', marginTop: 10, fontSize: 11, padding: '4px 10px' }}>
                    <Globe size={12} style={{ marginRight: 4 }} /> Open Website
                  </a>
                </div>
              </div>
            </div>
          )}

        </div>
      </div>

      {/* ========================================================================= */}
      {/* MODAL 1: ACADEMIC SESSION SAFETY CONFIRMATION MODAL */}
      {/* ========================================================================= */}
      {sessionSafetyModalOpen && (
        <Modal
          isOpen={sessionSafetyModalOpen}
          onClose={() => setSessionSafetyModalOpen(false)}
          title="Change active academic session?"
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, backgroundColor: '#EFF6FF', padding: 14, borderRadius: 12, border: '1px solid #BFDBFE' }}>
              <AlertCircle size={24} color="#1769E0" style={{ flexShrink: 0, marginTop: 2 }} />
              <div>
                <div style={{ fontSize: 14, fontWeight: 800, color: '#1E40AF' }}>
                  Change active academic session to {pendingActiveSessionId}?
                </div>
                <div style={{ fontSize: 12, color: '#1E3A8A', marginTop: 4, lineHeight: 1.5 }}>
                  This will change the academic session used by the school system across Students, Attendance, Homework, Exams, Marks, Fees, and Timetable.
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
              <button
                type="button"
                className="avm-btn-secondary"
                onClick={() => setSessionSafetyModalOpen(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="avm-btn-primary"
                onClick={confirmActivateSession}
                style={{ backgroundColor: '#16A34A' }}
              >
                Change Session
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: CREATE NEW ACADEMIC SESSION MODAL */}
      {/* ========================================================================= */}
      {createSessionModalOpen && (
        <Modal
          isOpen={createSessionModalOpen}
          onClose={() => setCreateSessionModalOpen(false)}
          title="Create Academic Session"
        >
          <form onSubmit={handleCreateSessionSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div>
              <label className="avm-label">Session Name *</label>
              <input
                type="text"
                className="avm-input"
                value={newSessionName}
                onChange={(e) => setNewSessionName(e.target.value)}
                placeholder="e.g. 2027-28"
                required
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <div>
                <label className="avm-label">Start Date *</label>
                <input
                  type="date"
                  className="avm-input"
                  value={newSessionStartDate}
                  onChange={(e) => setNewSessionStartDate(e.target.value)}
                  required
                />
              </div>
              <div>
                <label className="avm-label">End Date *</label>
                <input
                  type="date"
                  className="avm-input"
                  value={newSessionEndDate}
                  onChange={(e) => setNewSessionEndDate(e.target.value)}
                  required
                />
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
              <input
                type="checkbox"
                id="makeActiveChk"
                checked={newSessionMakeActive}
                onChange={(e) => setNewSessionMakeActive(e.target.checked)}
                style={{ width: 18, height: 18, accentColor: '#1769E0' }}
              />
              <label htmlFor="makeActiveChk" style={{ fontSize: 13, fontWeight: 700, color: '#0F172A', cursor: 'pointer' }}>
                Set as current ACTIVE academic session immediately
              </label>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 10 }}>
              <button
                type="button"
                className="avm-btn-secondary"
                onClick={() => setCreateSessionModalOpen(false)}
              >
                Cancel
              </button>
              <button type="submit" className="avm-btn-primary">
                Create Session
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* ========================================================================= */}
      {/* MODAL 3: DANGER ZONE RESET DEMO DATA CONFIRMATION MODAL */}
      {/* ========================================================================= */}
      {resetModalOpen && (
        <Modal
          isOpen={resetModalOpen}
          onClose={() => setResetModalOpen(false)}
          title="Reset all demo data?"
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ backgroundColor: '#FEF2F2', border: '1px solid #FCA5A5', padding: 14, borderRadius: 12, color: '#991B1B', fontSize: 13, lineHeight: 1.5 }}>
              <strong>Warning:</strong> This will permanently remove Admin-created demo changes from this device and revert the persistent store to clean seed state.
            </div>

            <div>
              <label className="avm-label" style={{ color: '#DC2626' }}>
                Type <strong>RESET</strong> in capital letters to confirm:
              </label>
              <input
                type="text"
                className="avm-input"
                value={resetConfirmText}
                onChange={(e) => setResetConfirmText(e.target.value)}
                placeholder="RESET"
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
              <button
                type="button"
                className="avm-btn-secondary"
                onClick={() => setResetModalOpen(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleResetDemoDataConfirm}
                style={{
                  backgroundColor: '#DC2626',
                  color: '#FFFFFF',
                  border: 'none',
                  borderRadius: 10,
                  padding: '9px 16px',
                  fontSize: 13,
                  fontWeight: 800,
                  cursor: 'pointer'
                }}
              >
                Reset Demo Data
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* ========================================================================= */}
      {/* MODAL 4: JSON IMPORT MODAL */}
      {/* ========================================================================= */}
      {jsonImportModalOpen && (
        <Modal
          isOpen={jsonImportModalOpen}
          onClose={() => setJsonImportModalOpen(false)}
          title="Import Database JSON"
        >
          <form onSubmit={handleImportJsonSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {importError && (
              <div style={{ backgroundColor: '#FEF2F2', color: '#DC2626', padding: 10, borderRadius: 8, fontSize: 12, fontWeight: 700 }}>
                {importError}
              </div>
            )}
            <div>
              <label className="avm-label">Paste JSON Database string below:</label>
              <textarea
                className="avm-input"
                value={importJsonText}
                onChange={(e) => setImportJsonText(e.target.value)}
                rows={10}
                placeholder='{"academicSessions": [...], ...}'
                required
                style={{ fontFamily: 'monospace', fontSize: 11 }}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
              <button
                type="button"
                className="avm-btn-secondary"
                onClick={() => setJsonImportModalOpen(false)}
              >
                Cancel
              </button>
              <button type="submit" className="avm-btn-primary">
                Import JSON
              </button>
            </div>
          </form>
        </Modal>
      )}

    </div>
  );
};
