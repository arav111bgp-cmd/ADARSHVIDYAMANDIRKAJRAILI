import React, { useState, useEffect } from 'react';
import type { Student, Employee, UserRole, SavedAccount } from '../types';
import { schoolConfig } from '../config/schoolConfig';
import { classService } from '../services/classService';
import { accountService } from '../services/accountService';
import {
  X, MapPin, Globe, Phone, User, MessageSquarePlus, PlayCircle,
  Sparkles, Star, ShieldCheck, FileText, LogOut, ChevronRight,
  AlertCircle, CheckCircle, ArrowRight, ArrowLeft, Send,
  UserPlus, Check, Trash2
} from 'lucide-react';
import { App as CapApp } from '@capacitor/app';

interface MobileSideDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  userRole: UserRole | null;
  currentUser: Student | Employee | any;
  onNavigate: (screenId: string) => void;
  onLogout: () => void;
  onSwitchAccount?: (accountId: string) => void;
  onAddAccount?: () => void;
}

export const MobileSideDrawer: React.FC<MobileSideDrawerProps> = ({
  isOpen,
  onClose,
  userRole,
  currentUser,
  onNavigate,
  onLogout,
  onSwitchAccount,
  onAddAccount
}) => {
  // Modal states for Drawer items
  const [activeModal, setActiveModal] = useState<
    'concerns' | 'tutorial' | 'whats_new' | 'rate' | 'privacy' | 'terms' | 'logout_confirm' | null
  >(null);

  // Switch Account & Saved Accounts State
  const [isSwitchModalOpen, setIsSwitchModalOpen] = useState(false);
  const [savedAccounts, setSavedAccounts] = useState<SavedAccount[]>([]);
  const [accountToRemove, setAccountToRemove] = useState<SavedAccount | null>(null);

  // Concerns form state
  const [concernType, setConcernType] = useState<'Issue' | 'Suggestion'>('Issue');
  const [concernMessage, setConcernMessage] = useState('');
  const [concernSubmitted, setConcernSubmitted] = useState(false);

  // Tutorial step state
  const [tutorialStep, setTutorialStep] = useState(0);

  // Rate app state
  const [rating, setRating] = useState(5);
  const [ratingFeedback, setRatingFeedback] = useState('');
  const [ratingSubmitted, setRatingSubmitted] = useState(false);

  // Hardware Back Button listener inside MobileSideDrawer
  useEffect(() => {
    let backListener: any;
    try {
      backListener = CapApp.addListener('backButton', () => {
        if (accountToRemove) {
          setAccountToRemove(null);
        } else if (isSwitchModalOpen) {
          setIsSwitchModalOpen(false);
        } else if (activeModal) {
          setActiveModal(null);
        } else if (isOpen) {
          onClose();
        }
      });
    } catch (_) {}

    return () => {
      if (backListener) {
        backListener.then((h: any) => h?.remove());
      }
    };
  }, [accountToRemove, isSwitchModalOpen, activeModal, isOpen]);

  const handleOpenSwitchModal = async () => {
    const list = await accountService.getSavedAccounts();
    setSavedAccounts(list);
    setIsSwitchModalOpen(true);
  };

  const handleSelectAccountToSwitch = async (acc: SavedAccount) => {
    setIsSwitchModalOpen(false);
    onClose();
    if (onSwitchAccount) {
      onSwitchAccount(acc.id);
    }
  };

  const handleConfirmRemoveAccount = async () => {
    if (!accountToRemove) return;
    const targetId = accountToRemove.id;
    setAccountToRemove(null);

    const res = await accountService.removeSavedAccount(targetId);
    setSavedAccounts(res.accounts);

    if (res.removedIsActive) {
      if (res.accounts.length > 0) {
        const nextAccount = res.accounts[0];
        if (onSwitchAccount) {
          onSwitchAccount(nextAccount.id);
        }
      } else {
        setIsSwitchModalOpen(false);
        onClose();
        onLogout();
      }
    }
  };

  if (!isOpen && !activeModal && !isSwitchModalOpen && !accountToRemove) return null;

  const isStudent = userRole === 'student';
  const studentData = currentUser as Student;
  const employeeData = currentUser as Employee;

  const tutorialSteps = [
    {
      title: 'Welcome to AVM Mobile App',
      description: 'Your complete digital gateway to Adarsh Vidya Mandir Kajraili. Access attendance, homework, exams, and notices anytime.',
      icon: '🏫'
    },
    {
      title: 'Daily Attendance Tracker',
      description: 'View monthly attendance records, leave status, and real-time alerts marked by class teachers.',
      icon: '📅'
    },
    {
      title: 'Homework & Study Material',
      description: 'Check daily homework assigned by teachers, download study attachments, and submit completed tasks.',
      icon: '📚'
    },
    {
      title: 'Timetable & Class Schedule',
      description: 'Stay updated with day-wise period timings, subject teachers, and classroom room numbers.',
      icon: '🕐'
    },
    {
      title: 'Exams, Results & Admit Card',
      description: 'Download digital admit cards for term examinations and view official report cards with grade analysis.',
      icon: '📝'
    },
    {
      title: 'Notices & Instant Alerts',
      description: 'Receive instant announcements for holidays, exam dates, fee reminders, and Parent-Teacher Meetings.',
      icon: '🔔'
    }
  ];

  const handleOpenModal = (modalName: 'concerns' | 'tutorial' | 'whats_new' | 'rate' | 'privacy' | 'terms') => {
    setActiveModal(modalName);
  };

  const handleCloseModal = () => {
    setActiveModal(null);
    setConcernSubmitted(false);
    setConcernMessage('');
    setTutorialStep(0);
    setRatingSubmitted(false);
  };

  const handleSubmitConcern = (e: React.FormEvent) => {
    e.preventDefault();
    if (!concernMessage.trim()) return;
    setConcernSubmitted(true);
  };

  const handleSubmitRating = (e: React.FormEvent) => {
    e.preventDefault();
    setRatingSubmitted(true);
    try {
      window.open('https://play.google.com/store/apps/details?id=com.adarshvidyamandir.app', '_blank');
    } catch (_) {}
  };

  return (
    <>
      {/* DARK BACKDROP OVERLAY ON THE RIGHT */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.55)',
          backdropFilter: 'blur(3px)',
          zIndex: 999,
          opacity: isOpen ? 1 : 0,
          transition: 'opacity 250ms ease',
          pointerEvents: isOpen ? 'auto' : 'none'
        }}
      />

      {/* LEFT SIDE DRAWER CONTAINER */}
      <div
        style={{
          position: 'fixed',
          top: 0,
          bottom: 0,
          left: 0,
          width: '85%',
          maxWidth: 340,
          backgroundColor: '#FFFFFF',
          boxShadow: '10px 0 30px rgba(0, 0, 0, 0.25)',
          borderTopRightRadius: 24,
          borderBottomRightRadius: 24,
          zIndex: 1000,
          display: 'flex',
          flexDirection: 'column',
          transform: isOpen ? 'translateX(0)' : 'translateX(-100%)',
          transition: 'transform 280ms cubic-bezier(0.16, 1, 0.3, 1)',
          overflow: 'hidden'
        }}
      >
        {/* TOP PROFILE HEADER */}
        <div style={{
          padding: '20px 20px 14px 20px',
          background: 'linear-gradient(180deg, #F8FAFC 0%, #FFFFFF 100%)',
          borderBottom: '1px solid #F1F5F9',
          position: 'relative'
        }}>
          {/* Close button top right */}
          <button
            onClick={onClose}
            style={{
              position: 'absolute',
              top: 18,
              right: 18,
              background: '#F1F5F9',
              border: 'none',
              borderRadius: '50%',
              width: 32,
              height: 32,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#64748B',
              cursor: 'pointer'
            }}
            aria-label="Close drawer"
          >
            <X size={18} />
          </button>

          {/* DYNAMIC USER PROFILE */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 14 }}>
            <img
              src={currentUser?.photo || (isStudent ? 'https://images.unsplash.com/photo-1544717305-2782549b5136?w=150&auto=format&fit=crop&q=80' : userRole === 'admin' ? 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80' : 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80')}
              alt={currentUser?.name || 'Profile'}
              style={{
                width: 56,
                height: 56,
                borderRadius: '50%',
                objectFit: 'cover',
                border: `3px solid ${isStudent ? '#1769E0' : userRole === 'admin' ? '#6366F1' : '#0D9488'}`,
                boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
              }}
            />
            <div style={{ overflow: 'hidden' }}>
              <h3 style={{ fontSize: 16, fontWeight: 800, color: '#0F172A', margin: 0, whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
                {currentUser?.name || (isStudent ? 'Rahul Kumar' : userRole === 'admin' ? 'School Principal / Admin' : 'Mrs. Priya Sharma')}
              </h3>
              <p style={{ fontSize: 12, fontWeight: 700, color: isStudent ? '#1769E0' : userRole === 'admin' ? '#6366F1' : '#0D9488', margin: '2px 0 0 0' }}>
                {isStudent
                  ? classService.formatClassDisplay(studentData?.className, studentData?.section)
                  : userRole === 'admin'
                  ? 'Administrator • Principal'
                  : (employeeData?.designation || 'Employee / Teacher')}
              </p>
              <p style={{ fontSize: 11, color: '#64748B', margin: '2px 0 0 0' }}>
                {isStudent
                  ? `Adm: ${studentData?.admissionNo || 'AVM20260125'}`
                  : userRole === 'admin'
                  ? 'ID: admin'
                  : `ID: ${employeeData?.employeeId || 'EMP001'}`}
              </p>
            </div>
          </div>

          {/* UNIQUE TOUCH: AVM BLUE GRADIENT ACCENT LINE */}
          <div style={{
            height: 3,
            width: '100%',
            borderRadius: 2,
            background: 'linear-gradient(90deg, #1769E0 0%, #0D9488 50%, #9333EA 100%)',
            marginBottom: 12
          }} />

          {/* SCHOOL INFORMATION CARD */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            padding: '10px 12px',
            backgroundColor: '#F8FAFC',
            borderRadius: 14,
            border: '1px solid #E2E8F0',
            marginBottom: 12
          }}>
            <div style={{
              width: 32,
              height: 32,
              borderRadius: 10,
              background: 'linear-gradient(135deg, #1769E0 0%, #1255B8 100%)',
              color: '#FFFFFF',
              fontWeight: 800,
              fontSize: 14,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0
            }}>
              AVM
            </div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 800, color: '#0F172A', lineHeight: 1.1 }}>
                {schoolConfig.name}
              </div>
              <div style={{ fontSize: 11, fontWeight: 600, color: '#64748B', marginTop: 1 }}>
                {schoolConfig.location} • {schoolConfig.tagline}
              </div>
            </div>
          </div>

          {/* THREE COMPACT ACTION BUTTONS: MAP, WEBSITE, CALL */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
            <button
              onClick={() => window.open(schoolConfig.mapUrl, '_blank')}
              style={{
                background: '#EFF6FF',
                border: '1px solid #DBEAFE',
                borderRadius: 10,
                padding: '8px 4px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 5,
                color: '#1D4ED8',
                fontSize: 11,
                fontWeight: 700,
                cursor: 'pointer'
              }}
            >
              <MapPin size={14} />
              <span>Map</span>
            </button>

            <button
              onClick={() => window.open(schoolConfig.websiteUrl, '_blank')}
              style={{
                background: '#F0FDFA',
                border: '1px solid #CCFBF1',
                borderRadius: 10,
                padding: '8px 4px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 5,
                color: '#0F766E',
                fontSize: 11,
                fontWeight: 700,
                cursor: 'pointer'
              }}
            >
              <Globe size={14} />
              <span>Website</span>
            </button>

            <button
              onClick={() => window.open(`tel:${schoolConfig.contactNumber}`)}
              style={{
                background: '#FEF2F2',
                border: '1px solid #FEE2E2',
                borderRadius: 10,
                padding: '8px 4px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 5,
                color: '#DC2626',
                fontSize: 11,
                fontWeight: 700,
                cursor: 'pointer'
              }}
            >
              <Phone size={14} />
              <span>Call</span>
            </button>
          </div>
        </div>

        {/* DRAWER MENU LIST (SCROLLABLE) */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '16px 16px 24px 16px' }}>

          {/* ADMIN MODULES SECTION */}
          {userRole === 'admin' && (
            <div style={{ marginBottom: 20 }}>
              <div style={{
                fontSize: 11,
                fontWeight: 800,
                color: '#6366F1',
                letterSpacing: '0.8px',
                marginBottom: 10,
                paddingLeft: 4
              }}>
                ADMINISTRATION MODULES
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 6 }}>
                {[
                  { id: 'dashboard', label: 'Dashboard', icon: '🏠' },
                  { id: 'students', label: 'Students Master', icon: '👨‍🎓' },
                  { id: 'teachers', label: 'Employees & Teachers', icon: '👨‍🏫' },
                  { id: 'classes', label: 'Classes & Sections', icon: '🏫' },
                  { id: 'subjects', label: 'Subjects Master', icon: '📚' },
                  { id: 'class-subjects', label: 'Class Subjects Assignment', icon: '📖' },
                  { id: 'attendance', label: 'Student Attendance', icon: '✅' },
                  { id: 'employee-attendance', label: 'Employee Attendance', icon: '🕘' },
                  { id: 'homework', label: 'Homework Management', icon: '📘' },
                  { id: 'exams', label: 'Exams & Schedules', icon: '📝' },
                  { id: 'marks', label: 'Marks Entry & History', icon: '🏆' },
                  { id: 'results', label: 'Results & Report Cards', icon: '📊' },
                  { id: 'admitcards', label: 'Admit Cards Generator', icon: '🎫' },
                  { id: 'fees', label: 'Fee Management & Receipts', icon: '💰' },
                  { id: 'notices', label: 'Notice Board', icon: '📢' },
                  { id: 'notifications', label: 'Notifications Center', icon: '🔔' },
                  { id: 'timetable', label: 'Timetable Master', icon: '🗓' },
                  { id: 'reports', label: 'Reports & Print Center', icon: '📄' },
                  { id: 'certificates', label: 'Certificates Issue', icon: '📜' },
                  { id: 'transport', label: 'Transport Management', icon: '🚌' },
                  { id: 'settings', label: 'System Settings', icon: '⚙' }
                ].map((mod) => (
                  <div
                    key={mod.id}
                    onClick={() => {
                      onClose();
                      onNavigate(mod.id);
                    }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '10px 12px',
                      borderRadius: 12,
                      cursor: 'pointer',
                      backgroundColor: '#EEF2FF',
                      border: '1px solid #E0E7FF'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <span style={{ fontSize: 16 }}>{mod.icon}</span>
                      <span style={{ fontSize: 13, fontWeight: 700, color: '#3730A3' }}>{mod.label}</span>
                    </div>
                    <ChevronRight size={16} color="#6366F1" />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* SECTION 1: SUPPORT & DISCOVER */}
          <div style={{ marginBottom: 18 }}>
            <div style={{
              fontSize: 11,
              fontWeight: 800,
              color: '#94A3B8',
              letterSpacing: '0.8px',
              marginBottom: 10,
              paddingLeft: 4
            }}>
              SUPPORT & DISCOVER
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {/* CONCERNS */}
              <div
                onClick={() => handleOpenModal('concerns')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '10px 12px',
                  borderRadius: 12,
                  cursor: 'pointer',
                  backgroundColor: '#F8FAFC',
                  border: '1px solid #F1F5F9'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{
                    width: 34, height: 34, borderRadius: 10,
                    backgroundColor: '#EFF6FF', color: '#1769E0',
                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                  }}>
                    <MessageSquarePlus size={18} />
                  </div>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: '#0F172A' }}>Concerns</div>
                    <div style={{ fontSize: 11, color: '#64748B' }}>Share an issue or suggestion</div>
                  </div>
                </div>
                <ChevronRight size={16} color="#CBD5E1" />
              </div>

              {/* APP TUTORIAL */}
              <div
                onClick={() => handleOpenModal('tutorial')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '10px 12px',
                  borderRadius: 12,
                  cursor: 'pointer',
                  backgroundColor: '#F8FAFC',
                  border: '1px solid #F1F5F9'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{
                    width: 34, height: 34, borderRadius: 10,
                    backgroundColor: '#F0FDFA', color: '#0D9488',
                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                  }}>
                    <PlayCircle size={18} />
                  </div>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: '#0F172A' }}>App Tutorial</div>
                    <div style={{ fontSize: 11, color: '#64748B' }}>Learn how to use the app</div>
                  </div>
                </div>
                <ChevronRight size={16} color="#CBD5E1" />
              </div>

              {/* WHAT'S NEW */}
              <div
                onClick={() => handleOpenModal('whats_new')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '10px 12px',
                  borderRadius: 12,
                  cursor: 'pointer',
                  backgroundColor: '#F8FAFC',
                  border: '1px solid #F1F5F9'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{
                    width: 34, height: 34, borderRadius: 10,
                    backgroundColor: '#FAF5FF', color: '#9333EA',
                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                  }}>
                    <Sparkles size={18} />
                  </div>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: '#0F172A' }}>What's New</div>
                    <div style={{ fontSize: 11, color: '#64748B' }}>Latest app updates</div>
                  </div>
                </div>
                <ChevronRight size={16} color="#CBD5E1" />
              </div>

              {/* RATE THE APP */}
              <div
                onClick={() => handleOpenModal('rate')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '10px 12px',
                  borderRadius: 12,
                  cursor: 'pointer',
                  backgroundColor: '#F8FAFC',
                  border: '1px solid #F1F5F9'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{
                    width: 34, height: 34, borderRadius: 10,
                    backgroundColor: '#FEFCE8', color: '#D97706',
                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                  }}>
                    <Star size={18} />
                  </div>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: '#0F172A' }}>Rate the App</div>
                    <div style={{ fontSize: 11, color: '#64748B' }}>Tell us what you think</div>
                  </div>
                </div>
                <ChevronRight size={16} color="#CBD5E1" />
              </div>
            </div>
          </div>

          <div style={{ height: 1, backgroundColor: '#F1F5F9', marginBottom: 18 }} />

          {/* SECTION 2: LEGAL & PRIVACY */}
          <div style={{ marginBottom: 18 }}>
            <div style={{
              fontSize: 11,
              fontWeight: 800,
              color: '#94A3B8',
              letterSpacing: '0.8px',
              marginBottom: 10,
              paddingLeft: 4
            }}>
              LEGAL & PRIVACY
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {/* PRIVACY POLICY */}
              <div
                onClick={() => handleOpenModal('privacy')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '10px 12px',
                  borderRadius: 12,
                  cursor: 'pointer',
                  backgroundColor: '#F8FAFC',
                  border: '1px solid #F1F5F9'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{
                    width: 34, height: 34, borderRadius: 10,
                    backgroundColor: '#F0FDF4', color: '#16A34A',
                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                  }}>
                    <ShieldCheck size={18} />
                  </div>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: '#0F172A' }}>Privacy Policy</div>
                    <div style={{ fontSize: 11, color: '#64748B' }}>How we protect your information</div>
                  </div>
                </div>
                <ChevronRight size={16} color="#CBD5E1" />
              </div>

              {/* TERMS & CONDITIONS */}
              <div
                onClick={() => handleOpenModal('terms')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '10px 12px',
                  borderRadius: 12,
                  cursor: 'pointer',
                  backgroundColor: '#F8FAFC',
                  border: '1px solid #F1F5F9'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{
                    width: 34, height: 34, borderRadius: 10,
                    backgroundColor: '#F8FAFC', color: '#475569',
                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                  }}>
                    <FileText size={18} />
                  </div>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: '#0F172A' }}>Terms & Conditions</div>
                    <div style={{ fontSize: 11, color: '#64748B' }}>App usage terms</div>
                  </div>
                </div>
                <ChevronRight size={16} color="#CBD5E1" />
              </div>
            </div>
          </div>

          <div style={{ height: 1, backgroundColor: '#F1F5F9', marginBottom: 18 }} />

          {/* SECTION 3: ACCOUNT & LOGOUT */}
          <div>
            <div style={{
              fontSize: 11,
              fontWeight: 800,
              color: '#94A3B8',
              letterSpacing: '0.8px',
              marginBottom: 10,
              paddingLeft: 4
            }}>
              ACCOUNT
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {/* SWITCH ACCOUNT */}
              <div
                onClick={handleOpenSwitchModal}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '12px 14px',
                  borderRadius: 14,
                  backgroundColor: '#EFF6FF',
                  border: '1px solid #DBEAFE',
                  cursor: 'pointer'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{
                    width: 34, height: 34, borderRadius: 10,
                    backgroundColor: '#DBEAFE', color: '#1769E0',
                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                  }}>
                    <User size={18} />
                  </div>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: '#1769E0' }}>Switch Account</div>
                    <div style={{ fontSize: 11, color: '#2563EB' }}>Switch between saved accounts</div>
                  </div>
                </div>
                <ChevronRight size={16} color="#93C5FD" />
              </div>

              {/* ADD ACCOUNT */}
              <div
                onClick={() => {
                  onClose();
                  if (onAddAccount) onAddAccount();
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '12px 14px',
                  borderRadius: 14,
                  backgroundColor: '#F8FAFC',
                  border: '1px solid #E2E8F0',
                  cursor: 'pointer'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{
                    width: 34, height: 34, borderRadius: 10,
                    backgroundColor: '#F1F5F9', color: '#475569',
                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                  }}>
                    <UserPlus size={18} />
                  </div>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: '#0F172A' }}>Add Account</div>
                    <div style={{ fontSize: 11, color: '#64748B' }}>Sign in with another account</div>
                  </div>
                </div>
                <ChevronRight size={16} color="#CBD5E1" />
              </div>

              {/* LOGOUT */}
              <div
                onClick={() => setActiveModal('logout_confirm')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '12px 14px',
                  borderRadius: 14,
                  backgroundColor: '#FEF2F2',
                  border: '1px solid #FEE2E2',
                  cursor: 'pointer'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{
                    width: 34, height: 34, borderRadius: 10,
                    backgroundColor: '#FEE2E2', color: '#DC2626',
                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                  }}>
                    <LogOut size={18} />
                  </div>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: '#DC2626' }}>Logout</div>
                    <div style={{ fontSize: 11, color: '#EF4444' }}>Sign out of this account</div>
                  </div>
                </div>
                <ChevronRight size={16} color="#FCA5A5" />
              </div>
            </div>
          </div>
        </div>

        {/* DRAWER FOOTER */}
        <div style={{
          padding: '14px 16px',
          backgroundColor: '#F8FAFC',
          borderTop: '1px solid #F1F5F9',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: 12, fontWeight: 800, color: '#0F172A' }}>
            {schoolConfig.name}
          </div>
          <div style={{ fontSize: 11, fontWeight: 600, color: '#64748B', marginTop: 2 }}>
            {schoolConfig.location}
          </div>
          <div style={{ fontSize: 10, color: '#94A3B8', marginTop: 4 }}>
            Official Mobile App • {schoolConfig.version}
          </div>
        </div>
      </div>

      {/* --- MODAL 1: CONCERNS MODAL --- */}
      {activeModal === 'concerns' && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.7)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: 20, zIndex: 1100
        }}>
          <div className="animate-fade-in" style={{
            backgroundColor: '#FFFFFF', borderRadius: 20, padding: 24,
            width: '100%', maxWidth: 400, boxShadow: '0 20px 40px rgba(0,0,0,0.25)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h3 style={{ fontSize: 18, fontWeight: 800, color: '#0F172A', margin: 0 }}>
                Share Concern or Suggestion
              </h3>
              <button onClick={handleCloseModal} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748B' }}>
                <X size={20} />
              </button>
            </div>

            {concernSubmitted ? (
              <div style={{ textAlign: 'center', padding: '20px 0' }}>
                <CheckCircle size={48} color="#16A34A" style={{ margin: '0 auto 12px auto' }} />
                <h4 style={{ fontSize: 17, fontWeight: 800, color: '#0F172A', marginBottom: 6 }}>
                  Thank You!
                </h4>
                <p style={{ fontSize: 13, color: '#64748B', marginBottom: 20 }}>
                  Your message has been logged successfully with the Adarsh Vidya Mandir administration team.
                </p>
                <button className="avm-btn-primary" style={{ width: '100%' }} onClick={handleCloseModal}>
                  Close
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmitConcern}>
                <div style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
                  <button
                    type="button"
                    onClick={() => setConcernType('Issue')}
                    style={{
                      flex: 1, padding: '10px', borderRadius: 10, fontSize: 13, fontWeight: 700,
                      border: concernType === 'Issue' ? '2px solid #1769E0' : '1px solid #E2E8F0',
                      backgroundColor: concernType === 'Issue' ? '#EFF6FF' : '#FFFFFF',
                      color: concernType === 'Issue' ? '#1769E0' : '#64748B', cursor: 'pointer'
                    }}
                  >
                    Report Issue
                  </button>
                  <button
                    type="button"
                    onClick={() => setConcernType('Suggestion')}
                    style={{
                      flex: 1, padding: '10px', borderRadius: 10, fontSize: 13, fontWeight: 700,
                      border: concernType === 'Suggestion' ? '2px solid #0D9488' : '1px solid #E2E8F0',
                      backgroundColor: concernType === 'Suggestion' ? '#F0FDFA' : '#FFFFFF',
                      color: concernType === 'Suggestion' ? '#0D9488' : '#64748B', cursor: 'pointer'
                    }}
                  >
                    Suggestion
                  </button>
                </div>

                <div style={{ marginBottom: 16 }}>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#475569', marginBottom: 6 }}>
                    Describe your {concernType.toLowerCase()}
                  </label>
                  <textarea
                    rows={4}
                    className="avm-input"
                    placeholder={`Describe your ${concernType.toLowerCase()} in detail...`}
                    value={concernMessage}
                    onChange={(e) => setConcernMessage(e.target.value)}
                    required
                    style={{ width: '100%', resize: 'none', borderRadius: 12 }}
                  />
                </div>

                <div style={{ display: 'flex', gap: 10 }}>
                  <button type="button" className="avm-btn-secondary" style={{ flex: 1 }} onClick={handleCloseModal}>
                    Cancel
                  </button>
                  <button type="submit" className="avm-btn-primary" style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                    <Send size={16} />
                    <span>Submit</span>
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* --- MODAL 2: APP TUTORIAL MODAL --- */}
      {activeModal === 'tutorial' && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.7)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: 20, zIndex: 1100
        }}>
          <div className="animate-fade-in" style={{
            backgroundColor: '#FFFFFF', borderRadius: 20, padding: 24,
            width: '100%', maxWidth: 400, boxShadow: '0 20px 40px rgba(0,0,0,0.25)',
            textAlign: 'center'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <span style={{ fontSize: 12, fontWeight: 800, color: '#1769E0', letterSpacing: '0.5px' }}>
                STEP {tutorialStep + 1} OF {tutorialSteps.length}
              </span>
              <button onClick={handleCloseModal} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748B' }}>
                <X size={20} />
              </button>
            </div>

            <div style={{ fontSize: 48, marginBottom: 14 }}>
              {tutorialSteps[tutorialStep].icon}
            </div>

            <h3 style={{ fontSize: 18, fontWeight: 800, color: '#0F172A', marginBottom: 8 }}>
              {tutorialSteps[tutorialStep].title}
            </h3>

            <p style={{ fontSize: 13, color: '#64748B', lineHeight: 1.5, marginBottom: 24, minHeight: 60 }}>
              {tutorialSteps[tutorialStep].description}
            </p>

            <div style={{ display: 'flex', gap: 10 }}>
              {tutorialStep > 0 && (
                <button
                  type="button"
                  className="avm-btn-secondary"
                  style={{ flex: 1 }}
                  onClick={() => setTutorialStep((prev) => prev - 1)}
                >
                  Previous
                </button>
              )}

              {tutorialStep < tutorialSteps.length - 1 ? (
                <button
                  type="button"
                  className="avm-btn-primary"
                  style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
                  onClick={() => setTutorialStep((prev) => prev + 1)}
                >
                  <span>Next</span>
                  <ArrowRight size={16} />
                </button>
              ) : (
                <button
                  type="button"
                  className="avm-btn-primary"
                  style={{ flex: 1 }}
                  onClick={handleCloseModal}
                >
                  Done
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* --- MODAL 3: WHAT'S NEW MODAL --- */}
      {activeModal === 'whats_new' && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.7)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: 20, zIndex: 1100
        }}>
          <div className="animate-fade-in" style={{
            backgroundColor: '#FFFFFF', borderRadius: 20, padding: 24,
            width: '100%', maxWidth: 400, boxShadow: '0 20px 40px rgba(0,0,0,0.25)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div>
                <h3 style={{ fontSize: 18, fontWeight: 800, color: '#0F172A', margin: 0 }}>
                  What's New in {schoolConfig.version}
                </h3>
                <p style={{ fontSize: 12, color: '#64748B', margin: 0 }}>Official Release Highlights</p>
              </div>
              <button onClick={handleCloseModal} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748B' }}>
                <X size={20} />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 20, maxHeight: 300, overflowY: 'auto' }}>
              <div style={{ backgroundColor: '#EFF6FF', padding: 12, borderRadius: 12, border: '1px solid #DBEAFE' }}>
                <div style={{ fontSize: 13, fontWeight: 800, color: '#1769E0', marginBottom: 2 }}>
                  ✨ Redesigned Left Side Navigation Drawer
                </div>
                <div style={{ fontSize: 12, color: '#475569' }}>
                  Fast access to support, app tutorial, quick calls, maps, and official school policies.
                </div>
              </div>

              <div style={{ backgroundColor: '#F0FDFA', padding: 12, borderRadius: 12, border: '1px solid #CCFBF1' }}>
                <div style={{ fontSize: 13, fontWeight: 800, color: '#0D9488', marginBottom: 2 }}>
                  🎓 Streamlined Student & Employee Logins
                </div>
                <div style={{ fontSize: 12, color: '#475569' }}>
                  Unified "Login As" dropdown selector with role-specific labels and show/hide password toggle.
                </div>
              </div>

              <div style={{ backgroundColor: '#FAF5FF', padding: 12, borderRadius: 12, border: '1px solid #F3E8FF' }}>
                <div style={{ fontSize: 13, fontWeight: 800, color: '#9333EA', marginBottom: 2 }}>
                  📱 Full Android Hardware Back Button Integration
                </div>
                <div style={{ fontSize: 12, color: '#475569' }}>
                  Smooth native back navigation stack prevents accidental app closures.
                </div>
              </div>
            </div>

            <button className="avm-btn-primary" style={{ width: '100%' }} onClick={handleCloseModal}>
              Got It!
            </button>
          </div>
        </div>
      )}

      {/* --- MODAL 4: RATE THE APP MODAL --- */}
      {activeModal === 'rate' && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.7)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: 20, zIndex: 1100
        }}>
          <div className="animate-fade-in" style={{
            backgroundColor: '#FFFFFF', borderRadius: 20, padding: 24,
            width: '100%', maxWidth: 400, boxShadow: '0 20px 40px rgba(0,0,0,0.25)',
            textAlign: 'center'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h3 style={{ fontSize: 18, fontWeight: 800, color: '#0F172A', margin: 0 }}>
                Rate the App
              </h3>
              <button onClick={handleCloseModal} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748B' }}>
                <X size={20} />
              </button>
            </div>

            {ratingSubmitted ? (
              <div style={{ padding: '16px 0' }}>
                <CheckCircle size={48} color="#16A34A" style={{ margin: '0 auto 12px auto' }} />
                <h4 style={{ fontSize: 17, fontWeight: 800, color: '#0F172A', marginBottom: 6 }}>
                  Thank you for rating!
                </h4>
                <p style={{ fontSize: 13, color: '#64748B', marginBottom: 20 }}>
                  Your feedback helps us continuously improve the Adarsh Vidya Mandir mobile app experience.
                </p>
                <button className="avm-btn-primary" style={{ width: '100%' }} onClick={handleCloseModal}>
                  Close
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmitRating}>
                <p style={{ fontSize: 13, color: '#64748B', marginBottom: 16 }}>
                  How are you enjoying the Adarsh Vidya Mandir app?
                </p>

                {/* STAR RATING PICKER */}
                <div style={{ display: 'flex', justifySelf: 'center', gap: 8, marginBottom: 20 }}>
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRating(star)}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}
                    >
                      <Star
                        size={32}
                        color={star <= rating ? '#F59E0B' : '#CBD5E1'}
                        fill={star <= rating ? '#F59E0B' : 'none'}
                      />
                    </button>
                  ))}
                </div>

                <div style={{ marginBottom: 16 }}>
                  <textarea
                    rows={3}
                    className="avm-input"
                    placeholder="Tell us more about your experience (optional)..."
                    value={ratingFeedback}
                    onChange={(e) => setRatingFeedback(e.target.value)}
                    style={{ width: '100%', resize: 'none', borderRadius: 12 }}
                  />
                </div>

                <div style={{ display: 'flex', gap: 10 }}>
                  <button type="button" className="avm-btn-secondary" style={{ flex: 1 }} onClick={handleCloseModal}>
                    Later
                  </button>
                  <button type="submit" className="avm-btn-primary" style={{ flex: 1 }}>
                    Submit
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* --- MODAL 5: PRIVACY POLICY MODAL --- */}
      {activeModal === 'privacy' && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.7)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: 20, zIndex: 1100
        }}>
          <div className="animate-fade-in" style={{
            backgroundColor: '#FFFFFF', borderRadius: 20, padding: 24,
            width: '100%', maxWidth: 440, boxShadow: '0 20px 40px rgba(0,0,0,0.25)',
            maxHeight: '80vh', display: 'flex', flexDirection: 'column'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h3 style={{ fontSize: 18, fontWeight: 800, color: '#0F172A', margin: 0 }}>
                Privacy Policy
              </h3>
              <button onClick={handleCloseModal} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748B' }}>
                <X size={20} />
              </button>
            </div>

            <div style={{ flex: 1, overflowY: 'auto', fontSize: 13, color: '#475569', lineHeight: 1.6, paddingRight: 4, marginBottom: 16 }}>
              <p><strong>Adarsh Vidya Mandir Kajraili Privacy Policy</strong></p>
              <p>Adarsh Vidya Mandir ("AVM", "we", "school") respects the privacy of students, parents, and employees. This Privacy Policy governs data collected through our official mobile application.</p>
              <p><strong>1. Information We Collect</strong><br />We process academic records, attendance logs, timetable schedules, homework submissions, fee receipt histories, and guardian contact information solely for educational administration.</p>
              <p><strong>2. Data Protection & Security</strong><br />All student and staff credentials are encrypted. Your data is stored securely and never shared with third-party advertisers or unverified external organizations.</p>
              <p><strong>3. Contact Support</strong><br />For data inquiries, contact the school administration office at Kajraili, Bhagalpur, Bihar.</p>
            </div>

            <button className="avm-btn-primary" style={{ width: '100%' }} onClick={handleCloseModal}>
              Close
            </button>
          </div>
        </div>
      )}

      {/* --- MODAL 6: TERMS & CONDITIONS MODAL --- */}
      {activeModal === 'terms' && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.7)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: 20, zIndex: 1100
        }}>
          <div className="animate-fade-in" style={{
            backgroundColor: '#FFFFFF', borderRadius: 20, padding: 24,
            width: '100%', maxWidth: 440, boxShadow: '0 20px 40px rgba(0,0,0,0.25)',
            maxHeight: '80vh', display: 'flex', flexDirection: 'column'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h3 style={{ fontSize: 18, fontWeight: 800, color: '#0F172A', margin: 0 }}>
                Terms & Conditions
              </h3>
              <button onClick={handleCloseModal} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748B' }}>
                <X size={20} />
              </button>
            </div>

            <div style={{ flex: 1, overflowY: 'auto', fontSize: 13, color: '#475569', lineHeight: 1.6, paddingRight: 4, marginBottom: 16 }}>
              <p><strong>Adarsh Vidya Mandir Terms of Usage</strong></p>
              <p>By logging into the Adarsh Vidya Mandir Mobile App, users agree to adhere to official school policies and electronic communication guidelines.</p>
              <p><strong>1. Authorized Account Usage</strong><br />Accounts are issued strictly to registered students, parents, and employees of AVM Kajraili. Sharing credentials with unauthorized individuals is prohibited.</p>
              <p><strong>2. Academic Records</strong><br />Digital report cards, admit cards, and fee receipts displayed in the application are official digital representations issued by school administration.</p>
            </div>

            <button className="avm-btn-primary" style={{ width: '100%' }} onClick={handleCloseModal}>
              Close
            </button>
          </div>
        </div>
      )}

      {/* --- MODAL 7: LOGOUT CONFIRMATION MODAL --- */}
      {activeModal === 'logout_confirm' && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.7)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: 20, zIndex: 1100
        }}>
          <div className="animate-fade-in" style={{
            backgroundColor: '#FFFFFF', borderRadius: 20, padding: 24,
            width: '100%', maxWidth: 340, boxShadow: '0 20px 40px rgba(0,0,0,0.25)',
            textAlign: 'center'
          }}>
            <div style={{
              width: 52, height: 52, borderRadius: '50%',
              backgroundColor: '#FEF2F2', color: '#DC2626',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 14px auto', border: '2px solid #FEE2E2'
            }}>
              <AlertCircle size={28} />
            </div>

            <h3 style={{ fontSize: 18, fontWeight: 800, color: '#0F172A', marginBottom: 6 }}>
              Logout?
            </h3>
            <p style={{ fontSize: 13, color: '#64748B', marginBottom: 20, lineHeight: 1.4 }}>
              Are you sure you want to sign out of your account?
            </p>

            <div style={{ display: 'flex', gap: 10 }}>
              <button
                type="button"
                className="avm-btn-secondary"
                style={{ flex: 1, padding: '12px' }}
                onClick={handleCloseModal}
              >
                Cancel
              </button>
              <button
                type="button"
                className="avm-btn-primary"
                style={{ flex: 1, padding: '12px', backgroundColor: '#DC2626', borderColor: '#DC2626' }}
                onClick={() => {
                  handleCloseModal();
                  onClose();
                  onLogout();
                }}
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- MODAL 8: SWITCH ACCOUNT BOTTOM SHEET MODAL --- */}
      {isSwitchModalOpen && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.65)',
            backdropFilter: 'blur(3px)',
            display: 'flex',
            alignItems: 'flex-end',
            justifyContent: 'center',
            zIndex: 1100
          }}
          onClick={() => setIsSwitchModalOpen(false)}
        >
          <div
            className="animate-slide-up"
            style={{
              backgroundColor: '#FFFFFF',
              borderTopLeftRadius: 24,
              borderTopRightRadius: 24,
              padding: '20px 20px 24px 20px',
              width: '100%',
              maxWidth: 480,
              maxHeight: '85vh',
              display: 'flex',
              flexDirection: 'column',
              boxShadow: '0 -10px 40px rgba(0,0,0,0.25)',
              position: 'relative'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Pill Handle Bar */}
            <div style={{ width: 40, height: 4, borderRadius: 2, backgroundColor: '#E2E8F0', margin: '0 auto 14px auto' }} />

            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
              <h3 style={{ fontSize: 18, fontWeight: 800, color: '#0F172A', margin: 0 }}>
                Switch Account
              </h3>
              <button
                onClick={() => setIsSwitchModalOpen(false)}
                style={{
                  background: '#F1F5F9',
                  border: 'none',
                  borderRadius: '50%',
                  width: 32,
                  height: 32,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#64748B',
                  cursor: 'pointer'
                }}
                aria-label="Close switch account modal"
              >
                <X size={18} />
              </button>
            </div>
            <p style={{ fontSize: 13, color: '#64748B', margin: '0 0 16px 0' }}>
              Choose an account to continue
            </p>

            {/* Account Cards List */}
            <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 16 }}>
              {savedAccounts.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '24px 16px', color: '#94A3B8' }}>
                  <User size={36} style={{ margin: '0 auto 8px auto', opacity: 0.5 }} />
                  <p style={{ fontSize: 13, margin: 0 }}>No other saved accounts on this device.</p>
                </div>
              ) : (
                savedAccounts.map((acc) => {
                  const currentUserId = currentUser?.admissionNo || currentUser?.employeeId || currentUser?.id || currentUser?.username;
                  const isCurrent = acc.role === userRole && (
                    acc.userId === currentUserId ||
                    (acc.admissionNo && acc.admissionNo === currentUser?.admissionNo) ||
                    (acc.employeeId && acc.employeeId === currentUser?.employeeId)
                  );

                  return (
                    <div
                      key={acc.id}
                      onClick={() => handleSelectAccountToSwitch(acc)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '12px 14px',
                        borderRadius: 16,
                        border: isCurrent ? '2px solid #1769E0' : '1.5px solid #E2E8F0',
                        backgroundColor: isCurrent ? '#EFF6FF' : '#FFFFFF',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12, overflow: 'hidden' }}>
                        <img
                          src={acc.photo || (acc.role === 'student' ? 'https://images.unsplash.com/photo-1544717305-2782549b5136?w=150' : 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150')}
                          alt={acc.name}
                          style={{
                            width: 46,
                            height: 46,
                            borderRadius: '50%',
                            objectFit: 'cover',
                            border: `2px solid ${acc.role === 'student' ? '#1769E0' : '#0D9488'}`,
                            flexShrink: 0
                          }}
                        />
                        <div style={{ overflow: 'hidden' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <span style={{ fontSize: 14, fontWeight: 800, color: '#0F172A', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
                              {acc.name}
                            </span>
                            {isCurrent && (
                              <span style={{ fontSize: 10, fontWeight: 800, color: '#1769E0', backgroundColor: '#DBEAFE', padding: '2px 6px', borderRadius: 8 }}>
                                Current
                              </span>
                            )}
                          </div>
                          <div style={{ fontSize: 12, fontWeight: 700, color: acc.role === 'student' ? '#1769E0' : '#0D9488', marginTop: 2 }}>
                            {acc.role === 'student'
                              ? `Student • ${acc.className || 'Class 5'}${acc.section ? '-' + acc.section : ''}`
                              : `Employee • ${acc.designation || 'Teacher'}`}
                          </div>
                          <div style={{ fontSize: 11, color: '#64748B', marginTop: 2 }}>
                            {acc.role === 'student'
                              ? (acc.admissionNo || acc.userId)
                              : (acc.employeeId || acc.userId)}
                          </div>
                        </div>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        {isCurrent && (
                          <div style={{ width: 24, height: 24, borderRadius: '50%', backgroundColor: '#1769E0', color: '#FFFFFF', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                            <Check size={14} />
                          </div>
                        )}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setAccountToRemove(acc);
                          }}
                          title="Remove from this device"
                          style={{
                            background: '#F1F5F9',
                            border: 'none',
                            borderRadius: 10,
                            width: 32,
                            height: 32,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: '#94A3B8',
                            cursor: 'pointer',
                            flexShrink: 0
                          }}
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Add another account button */}
            <button
              onClick={() => {
                setIsSwitchModalOpen(false);
                onClose();
                if (onAddAccount) onAddAccount();
              }}
              style={{
                width: '100%',
                padding: '12px',
                borderRadius: 14,
                border: '1.5px dashed #1769E0',
                backgroundColor: '#EFF6FF',
                color: '#1769E0',
                fontSize: 14,
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                cursor: 'pointer'
              }}
            >
              <UserPlus size={18} />
              <span>+ Add another account</span>
            </button>
          </div>
        </div>
      )}

      {/* --- MODAL 9: REMOVE ACCOUNT CONFIRMATION MODAL --- */}
      {accountToRemove && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.75)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: 20, zIndex: 1200
        }}>
          <div className="animate-fade-in" style={{
            backgroundColor: '#FFFFFF', borderRadius: 20, padding: 24,
            width: '100%', maxWidth: 380, boxShadow: '0 20px 40px rgba(0,0,0,0.3)',
            textAlign: 'center'
          }}>
            <div style={{
              width: 52, height: 52, borderRadius: '50%', backgroundColor: '#FEF2F2',
              color: '#DC2626', display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 14px auto', border: '2px solid #FEE2E2'
            }}>
              <Trash2 size={24} />
            </div>
            <h3 style={{ fontSize: 17, fontWeight: 800, color: '#0F172A', marginBottom: 6 }}>
              Remove from this device?
            </h3>
            <p style={{ fontSize: 13, color: '#64748B', lineHeight: 1.4, marginBottom: 6 }}>
              Remove <strong>{accountToRemove.name}</strong> from saved accounts on this device?
            </p>
            <p style={{ fontSize: 11, color: '#94A3B8', marginBottom: 20 }}>
              This will not delete the student/employee record from the school database.
            </p>
            <div style={{ display: 'flex', gap: 10 }}>
              <button
                type="button"
                className="avm-btn-secondary"
                style={{ flex: 1, padding: '12px' }}
                onClick={() => setAccountToRemove(null)}
              >
                Cancel
              </button>
              <button
                type="button"
                style={{
                  flex: 1,
                  padding: '12px',
                  borderRadius: 12,
                  backgroundColor: '#DC2626',
                  color: '#FFFFFF',
                  border: 'none',
                  fontWeight: 700,
                  fontSize: 14,
                  cursor: 'pointer'
                }}
                onClick={handleConfirmRemoveAccount}
              >
                Remove
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
