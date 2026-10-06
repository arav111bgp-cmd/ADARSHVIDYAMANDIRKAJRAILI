import React, { useState, useEffect } from 'react';
import { Employee } from '../types';
import { classService } from '../services/classService';
import { noticeService } from '../services/noticeService';
import { demoDataStore } from '../services/demoDataStore';
import {
  CheckSquare,
  BookOpen,
  Award,
  Clock,
  Users,
  Bell,
  Calendar,
  AlertCircle,
  PlusCircle,
  FileCheck,
  UserCheck
} from 'lucide-react';
import { employeeAttendanceService } from '../services/employeeAttendanceService';

interface EmployeeHomeScreenProps {
  employee: Employee;
  onNavigate: (screen: string) => void;
}

export const EmployeeHomeScreen: React.FC<EmployeeHomeScreenProps> = ({
  employee,
  onNavigate
}) => {
  const [unreadNoticesCount, setUnreadNoticesCount] = useState<number>(0);
  const [todayClassesCount, setTodayClassesCount] = useState<number>(0);
  const [uploadedHwCount, setUploadedHwCount] = useState<number>(0);
  const [isAttendanceDone, setIsAttendanceDone] = useState<boolean>(false);
  const [selfAttendanceToday, setSelfAttendanceToday] = useState<any>(null);

  const teacherClasses = classService.getTeacherClasses(employee?.assignedClasses);
  const primaryClass = teacherClasses[0]?.name || 'Nursery-A';

  const fetchDashboardData = async () => {
    try {
      const empId = employee.id || employee.employeeId || 'EMP-T101';
      const empName = employee.name || 'Priya Sharma';

      const nots = await noticeService.getNotices('employee', {
        id: empId,
        department: employee.department || 'Academics'
      });
      const unread = nots.filter((n) => n.isUnread).length;
      setUnreadNoticesCount(unread);

      const db = demoDataStore.getDB();
      const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      const currentDay = dayNames[new Date().getDay()] || 'Monday';
      const allTimetable = db.timetable || [];
      const teacherSlots = allTimetable.filter((t: any) => {
        const matchesTeacher =
          (t.teacherId && (t.teacherId === empId || t.teacherId === employee.employeeId)) ||
          (t.teacherName && (t.teacherName.toLowerCase().includes(empName.toLowerCase()) || empName.toLowerCase().includes(t.teacherName.toLowerCase()))) ||
          (t.teacher && (t.teacher.toLowerCase().includes(empName.toLowerCase()) || empName.toLowerCase().includes(t.teacher.toLowerCase())));
        const matchesDay = !t.day || t.day.toLowerCase() === currentDay.toLowerCase() || t.day.toLowerCase() === 'mon' || t.day.toLowerCase() === 'monday';
        return matchesTeacher && matchesDay;
      });
      setTodayClassesCount(teacherSlots.length > 0 ? teacherSlots.length : Math.max(1, teacherClasses.length));

      const allHw = db.homework || [];
      const empHw = allHw.filter((h: any) =>
        h.teacherId === empId || (h.teacherName && h.teacherName.toLowerCase().includes(empName.toLowerCase()))
      );
      setUploadedHwCount(empHw.length);

      const todayDateStr = new Date().toISOString().split('T')[0];
      const allAtt = db.attendance || [];
      const markedToday = allAtt.some((a: any) => a.date === todayDateStr && (a.teacherId === empId || a.teacherName?.includes(empName)));
      setIsAttendanceDone(markedToday);

      const selfAtt = employeeAttendanceService.getTodayRecord(empId);
      setSelfAttendanceToday(selfAtt);
    } catch (e) {
      console.warn('Error fetching employee dashboard data:', e);
    }
  };

  useEffect(() => {
    fetchDashboardData();
    const unsubscribe = demoDataStore.subscribe(() => {
      fetchDashboardData();
    });
    return () => unsubscribe();
  }, [employee.id, employee.department]);

  const quickActions = [
    { id: 'employee_self_attendance', title: 'My Attendance', subtitle: selfAttendanceToday?.checkInTime ? `Checked In ${selfAttendanceToday.checkInTime}` : 'Check-In • Check-Out', icon: UserCheck, color: '#16A34A', bg: '#DCFCE7', badge: selfAttendanceToday?.status || 'Pending' },
    { id: 'attendance', title: 'Take Attendance', subtitle: `Mark Today ${primaryClass}`, icon: CheckSquare, color: '#16A34A', bg: '#EAF8EF', badge: isAttendanceDone ? 'Completed' : 'Pending' },
    { id: 'homework_upload', title: 'Upload Homework', subtitle: 'Assign new task', icon: BookOpen, color: '#7C3AED', bg: '#F3E8FF' },
    { id: 'marks_entry', title: 'Marks Entry', subtitle: 'Half Yearly Marks', icon: Award, color: '#F97316', bg: '#FFF7ED' },
    { id: 'employee_timetable', title: 'My Schedule', subtitle: `${todayClassesCount} Classes Today`, icon: Clock, color: '#1769E0', bg: '#EAF3FF' },
    { id: 'employee_students', title: 'My Students', subtitle: 'View Student Roster', icon: Users, color: '#0284C7', bg: '#E0F2FE' },
    { id: 'employee_leave', title: 'Apply Leave', subtitle: 'Leave Balance & Logs', icon: Calendar, color: '#DB2777', bg: '#FCE7F3' },
    { id: 'employee_notices', title: 'Notices', subtitle: unreadNoticesCount > 0 ? `${unreadNoticesCount} Staff Circulars` : 'All Circulars Read', icon: Bell, color: '#2563EB', bg: '#EFF6FF', badge: unreadNoticesCount > 0 ? String(unreadNoticesCount) : undefined }
  ];

  return (
    <div style={{ padding: '16px 16px 80px 16px', display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Employee Profile Header */}
      <div style={{
        background: 'linear-gradient(135deg, #7C3AED 0%, #5B21B6 100%)',
        borderRadius: 20,
        padding: 20,
        color: '#FFFFFF',
        boxShadow: '0 8px 20px rgba(124,58,237,0.25)',
        position: 'relative',
        overflow: 'hidden'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <img
            src={employee.photo}
            alt={employee.name}
            style={{
              width: 58,
              height: 58,
              borderRadius: '50%',
              objectFit: 'cover',
              border: '3px solid rgba(255,255,255,0.8)'
            }}
          />
          <div>
            <div style={{ fontSize: 12, opacity: 0.85, fontWeight: 600 }}>Good Morning 👋</div>
            <h2 style={{ fontSize: 19, fontWeight: 800, margin: 0, lineHeight: 1.2 }}>
              {employee.name}
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
              <span>{employee.designation}</span>
              <span>•</span>
              <span>ID: {employee.employeeId}</span>
            </div>
          </div>
        </div>
      </div>

      {/* MY ATTENDANCE SELF CARD */}
      <div className="avm-card" style={{ padding: 16, borderLeft: '4px solid #16A34A', background: 'linear-gradient(135deg, #FFFFFF 0%, #F0FDF4 100%)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{
              width: 44,
              height: 44,
              borderRadius: 14,
              backgroundColor: '#DCFCE7',
              color: '#15803D',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <UserCheck size={22} />
            </div>
            <div>
              <div style={{ fontSize: 11, color: '#15803D', fontWeight: 700, letterSpacing: 0.5, textTransform: 'uppercase' }}>
                MY ATTENDANCE
              </div>
              <div style={{ fontSize: 14, fontWeight: 800, color: '#0F172A', marginTop: 2 }}>
                {selfAttendanceToday?.checkInTime
                  ? (selfAttendanceToday.checkOutTime ? `Checked Out (${selfAttendanceToday.checkOutTime})` : `Checked In at ${selfAttendanceToday.checkInTime}`)
                  : 'Not Checked In Today'}
              </div>
              <div style={{ fontSize: 11, color: '#64748B', marginTop: 2 }}>
                Check-In • Check-Out • Attendance History
              </div>
            </div>
          </div>

          <button
            className="avm-btn-primary"
            onClick={() => onNavigate('employee_self_attendance')}
            style={{ padding: '8px 14px', fontSize: 12, backgroundColor: '#16A34A', border: 'none', borderRadius: 12, fontWeight: 700, cursor: 'pointer' }}
          >
            {selfAttendanceToday?.checkInTime ? 'View Status' : 'Check In'}
          </button>
        </div>
      </div>

      {/* Attendance Pending Alert */}
      <div className="avm-card" style={{ padding: 16, borderLeft: '4px solid #F59E0B' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 40,
              height: 40,
              borderRadius: 12,
              backgroundColor: '#FFFBEB',
              color: '#F59E0B',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <AlertCircle size={22} />
            </div>
            <div>
              <div style={{ fontSize: 11, color: '#667085', fontWeight: 600 }}>ATTENDANCE STATUS</div>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#172033' }}>
                {primaryClass} Attendance Pending
              </div>
            </div>
          </div>

          <button
            className="avm-btn-primary"
            onClick={() => onNavigate('attendance')}
            style={{ padding: '8px 14px', fontSize: 12, backgroundColor: '#1769E0' }}
          >
            Mark Now
          </button>
        </div>
      </div>

      {/* Summary KPI Cards Row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
        <div className="avm-card" style={{ padding: 12, textAlign: 'center' }}>
          <div style={{ fontSize: 11, color: '#667085', fontWeight: 600 }}>Today Classes</div>
          <div style={{ fontSize: 18, fontWeight: 800, color: '#1769E0', marginTop: 2 }}>{todayClassesCount} Sessions</div>
        </div>
        <div className="avm-card" style={{ padding: 12, textAlign: 'center' }}>
          <div style={{ fontSize: 11, color: '#667085', fontWeight: 600 }}>Homework</div>
          <div style={{ fontSize: 18, fontWeight: 800, color: '#7C3AED', marginTop: 2 }}>{uploadedHwCount} Uploaded</div>
        </div>
        <div className="avm-card" style={{ padding: 12, textAlign: 'center' }}>
          <div style={{ fontSize: 11, color: '#667085', fontWeight: 600 }}>Pending Marks</div>
          <div style={{ fontSize: 18, fontWeight: 800, color: '#F97316', marginTop: 2 }}>{primaryClass}</div>
        </div>
      </div>

      {/* Assigned Classes Quick Strip */}
      <div className="avm-card" style={{ padding: 14 }}>
        <h4 style={{ fontSize: 13, fontWeight: 700, color: '#172033', marginBottom: 8 }}>
          Assigned Teaching Classes
        </h4>
        <div style={{ display: 'flex', gap: 8, overflowX: 'auto' }}>
          {teacherClasses.map((cls) => (
            <span key={cls.id} style={{
              backgroundColor: '#F3E8FF',
              color: '#7C3AED',
              fontWeight: 700,
              fontSize: 12,
              padding: '6px 12px',
              borderRadius: 20,
              whiteSpace: 'nowrap'
            }}>
              {cls.name}
            </span>
          ))}
        </div>
      </div>

      {/* Quick Actions Grid */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h3 style={{ fontSize: 16, fontWeight: 800, color: '#172033' }}>
          Teacher Quick Actions
        </h3>
      </div>

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
                minHeight: 104
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
    </div>
  );
};
