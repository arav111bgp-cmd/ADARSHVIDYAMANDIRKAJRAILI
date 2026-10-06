import React, { useState, useEffect } from 'react';
import type { Student, AttendanceRecord, Homework } from '../types';
import { attendanceService } from '../services/attendanceService';
import { homeworkService } from '../services/homeworkService';
import { feeService } from '../services/feeService';
import { noticeService } from '../services/noticeService';
import { demoDataStore } from '../services/demoDataStore';
import { classService } from '../services/classService';
import {
  BookOpen,
  CheckSquare,
  FileText,
  Award,
  CreditCard,
  Bell,
  Clock,
  Sparkles,
  FileCheck
} from 'lucide-react';

interface StudentHomeScreenProps {
  student: Student;
  onNavigate: (screen: string) => void;
}

export const StudentHomeScreen: React.FC<StudentHomeScreenProps> = ({
  student,
  onNavigate
}) => {
  const [todayAttendance, setTodayAttendance] = useState<AttendanceRecord | null>(null);
  const [monthlyPercentage, setMonthlyPercentage] = useState<number>(95);
  const [pendingHwCount, setPendingHwCount] = useState<number>(3);
  const [dueFeeAmount, setDueFeeAmount] = useState<number>(10000);
  const [unreadNoticesCount, setUnreadNoticesCount] = useState<number>(0);

  const loadData = async () => {
    try {
      // Load attendance history for student
      const studentId = student.id || student.admissionNo || 'STU-157';
      const records = await attendanceService.getAttendance(studentId);
      
      const todayStr = new Date().toISOString().split('T')[0];
      const foundToday = records.find((r) => r.date === todayStr) || (records.length > 0 ? records[0] : null);
      if (foundToday) {
        setTodayAttendance(foundToday);
      }

      if (records.length > 0) {
        const presentCount = records.filter((r) => r.status === 'present').length;
        const pct = Math.round((presentCount / records.length) * 100);
        setMonthlyPercentage(pct);
      }

      // Load homework for student class
      const hws = await homeworkService.getHomework(student.className || 'Class 5', student.section || 'A');
      if (hws) {
        const pending = hws.filter((h) => h.status !== 'Completed').length;
        setPendingHwCount(pending);
      }

      // Load fee info
      const feeInfo = await feeService.getStudentFeeDetails(studentId);
      if (feeInfo && feeInfo.dueFee !== undefined) {
        setDueFeeAmount(feeInfo.dueFee);
      }

      // Load unread notices count
      const nots = await noticeService.getNotices('student', {
        id: studentId,
        className: student.className || 'Class 5',
        section: student.section || 'A'
      });
      const unreadCount = nots.filter((n) => n.isUnread).length;
      setUnreadNoticesCount(unreadCount);
    } catch (e) {
      console.warn('Error fetching student home screen dynamic data:', e);
    }
  };

  useEffect(() => {
    loadData();
    const unsubscribe = demoDataStore.subscribe(() => {
      loadData();
    });
    return () => unsubscribe();
  }, [student.id, student.className, student.section]);

  const quickActions = [
    { id: 'timetable', title: 'Timetable', subtitle: 'Weekly Schedule', icon: Clock, color: '#1769E0', bg: '#EAF3FF' },
    { id: 'homework', title: 'Homework', subtitle: `${pendingHwCount} Pending Assignments`, icon: BookOpen, color: '#7C3AED', bg: '#F3E8FF', badge: String(pendingHwCount) },
    { id: 'attendance', title: 'Attendance', subtitle: `${monthlyPercentage}% Monthly Record`, icon: CheckSquare, color: '#16A34A', bg: '#EAF8EF' },
    { id: 'exams', title: 'Exams', subtitle: 'Half Yearly 2026', icon: FileText, color: '#F97316', bg: '#FFF7ED', badge: 'New' },
    { id: 'admitcard', title: 'Admit Card', subtitle: 'Download Digital Card', icon: FileCheck, color: '#0284C7', bg: '#E0F2FE' },
    { id: 'results', title: 'Results', subtitle: 'Report Card & Grades', icon: Award, color: '#DB2777', bg: '#FCE7F3' },
    { id: 'fees', title: 'Fee Details', subtitle: dueFeeAmount > 0 ? `₹${dueFeeAmount.toLocaleString('en-IN')} Pending` : 'Fee Paid', icon: CreditCard, color: '#EA580C', bg: '#FFEDD5' },
    { id: 'notices', title: 'Notices', subtitle: unreadNoticesCount > 0 ? `${unreadNoticesCount} Unread Alerts` : 'All Circulars Read', icon: Bell, color: '#2563EB', bg: '#EFF6FF', badge: unreadNoticesCount > 0 ? String(unreadNoticesCount) : undefined }
  ];

  return (
    <div style={{ padding: '16px 16px 80px 16px', display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Profile Header Banner */}
      <div style={{
        background: 'linear-gradient(135deg, #1769E0 0%, #1255B8 100%)',
        borderRadius: 20,
        padding: 20,
        color: '#FFFFFF',
        boxShadow: '0 8px 20px rgba(23,105,224,0.25)',
        position: 'relative',
        overflow: 'hidden'
      }}>
        {/* Subtle background circles decor */}
        <div style={{
          position: 'absolute',
          right: -20,
          bottom: -20,
          width: 140,
          height: 140,
          borderRadius: '50%',
          background: 'rgba(255,255,255,0.08)'
        }} />

        <div style={{ display: 'flex', alignItems: 'center', gap: 14, position: 'relative', zIndex: 1 }}>
          <img
            src={student.photo || 'https://images.unsplash.com/photo-1544717305-2782549b5136?w=150'}
            alt={student.name}
            style={{
              width: 58,
              height: 58,
              borderRadius: '50%',
              objectFit: 'cover',
              border: '3px solid rgba(255,255,255,0.8)',
              boxShadow: '0 4px 10px rgba(0,0,0,0.15)'
            }}
          />
          <div>
            <div style={{ fontSize: 12, opacity: 0.85, fontWeight: 600 }}>Good Morning 👋</div>
            <h2 style={{ fontSize: 19, fontWeight: 800, margin: 0, lineHeight: 1.2 }}>
              {student.name}
            </h2>
            <div style={{
              display: 'inline-flex',
              gap: 8,
              marginTop: 6,
              fontSize: 12,
              fontWeight: 600,
              background: 'rgba(255,255,255,0.18)',
              padding: '3px 10px',
              borderRadius: 20
            }}>
              <span>{classService.formatClassDisplay(student.className, student.section)}</span>
              <span>•</span>
              <span>Roll No. {student.rollNo}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Today's Attendance Overview Card */}
      <div className="avm-card" style={{ padding: 16, borderLeft: todayAttendance?.status === 'absent' ? '4px solid #EF4444' : '4px solid #16A34A' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 40,
              height: 40,
              borderRadius: 12,
              backgroundColor: todayAttendance?.status === 'absent' ? '#FEF2F2' : '#EAF8EF',
              color: todayAttendance?.status === 'absent' ? '#EF4444' : '#16A34A',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <CheckSquare size={22} />
            </div>
            <div>
              <div style={{ fontSize: 11, color: '#667085', fontWeight: 600 }}>TODAY'S ATTENDANCE</div>
              <div style={{ fontSize: 14, fontWeight: 700, color: todayAttendance?.status === 'absent' ? '#EF4444' : '#16A34A', textTransform: 'capitalize' }}>
                {todayAttendance?.status || 'Present'} {todayAttendance?.time ? `• Marked at ${todayAttendance.time}` : ''}
              </div>
              {todayAttendance?.teacherName && (
                <div style={{ fontSize: 11, color: '#475569', marginTop: 2 }}>
                  Marked by: <strong>{todayAttendance.teacherName}</strong>
                </div>
              )}
            </div>
          </div>

          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 18, fontWeight: 800, color: '#172033' }}>{monthlyPercentage}%</div>
            <div style={{ fontSize: 10, color: '#667085' }}>Monthly Record</div>
          </div>
        </div>
      </div>

      {/* Summary Stat Cards Row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
        <div className="avm-card" style={{ padding: 12, textAlign: 'center' }}>
          <div style={{ fontSize: 11, color: '#667085', fontWeight: 600 }}>Homework</div>
          <div style={{ fontSize: 18, fontWeight: 800, color: '#7C3AED', marginTop: 2 }}>{pendingHwCount} Pending</div>
        </div>
        <div className="avm-card" style={{ padding: 12, textAlign: 'center' }}>
          <div style={{ fontSize: 11, color: '#667085', fontWeight: 600 }}>Exams</div>
          <div style={{ fontSize: 18, fontWeight: 800, color: '#F97316', marginTop: 2 }}>2 Upcoming</div>
        </div>
        <div className="avm-card" style={{ padding: 12, textAlign: 'center' }}>
          <div style={{ fontSize: 11, color: '#667085', fontWeight: 600 }}>Fee Due</div>
          <div style={{ fontSize: 16, fontWeight: 800, color: '#EF4444', marginTop: 2 }}>₹{dueFeeAmount.toLocaleString('en-IN')}</div>
        </div>
      </div>

      {/* Section Title */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h3 style={{ fontSize: 16, fontWeight: 800, color: '#172033' }}>
          Quick Actions & Modules
        </h3>
        <span style={{ fontSize: 12, color: '#1769E0', fontWeight: 600 }}>{classService.formatClassDisplay(student.className, student.section)}</span>
      </div>

      {/* 2-Column Quick Action Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        {quickActions.map((action) => {
          const Icon = action.icon;

          return (
            <div
              key={action.id}
              onClick={() => onNavigate(action.id)}
              className="avm-card avm-card-interactive"
              style={{
                padding: 14,
                cursor: 'pointer',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                minHeight: 104,
                position: 'relative',
                overflow: 'hidden'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{
                  width: 38,
                  height: 38,
                  borderRadius: 12,
                  backgroundColor: action.bg,
                  color: action.color,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <Icon size={20} />
                </div>

                {action.badge && (
                  <span style={{
                    backgroundColor: action.color,
                    color: '#FFFFFF',
                    fontSize: 10,
                    fontWeight: 700,
                    padding: '2px 7px',
                    borderRadius: 10
                  }}>
                    {action.badge}
                  </span>
                )}
              </div>

              <div>
                <h4 style={{ fontSize: 14, fontWeight: 700, color: '#172033', margin: 0 }}>
                  {action.title}
                </h4>
                <p style={{ fontSize: 11, color: '#667085', margin: '2px 0 0 0' }}>
                  {action.subtitle}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Upcoming Exam Banner */}
      <div style={{
        backgroundColor: '#FFF7ED',
        border: '1px solid #FFEDD5',
        borderRadius: 16,
        padding: 14,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Sparkles size={24} color="#F97316" />
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#9A3412' }}>
              Half Yearly Exam 2026
            </div>
            <div style={{ fontSize: 11, color: '#C2410C' }}>
              Starting 28th Sep • Digital Admit Card Available
            </div>
          </div>
        </div>

        <button
          onClick={() => onNavigate('admitcard')}
          style={{
            backgroundColor: '#F97316',
            color: '#FFFFFF',
            border: 'none',
            borderRadius: 8,
            padding: '6px 12px',
            fontSize: 11,
            fontWeight: 700,
            cursor: 'pointer'
          }}
        >
          View Admit Card
        </button>
      </div>
    </div>
  );
};

