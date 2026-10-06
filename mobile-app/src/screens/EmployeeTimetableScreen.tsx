import React, { useState, useEffect } from 'react';
import { Employee, TimetableSlot } from '../types';
import { classService } from '../services/classService';
import { demoDataStore } from '../services/demoDataStore';
import { timetableService } from '../services/timetableService';
import { Modal } from '../components/Modal';
import {
  Clock, MapPin, BookOpen, Calendar, ChevronRight, UserCheck, CheckCircle2,
  Sparkles, PlayCircle, ArrowRight, CheckSquare, FileText, Users, Bell
} from 'lucide-react';

interface EmployeeTimetableScreenProps {
  employee?: Employee;
  onNavigate?: (screenId: string, params?: any) => void;
}

export const EmployeeTimetableScreen: React.FC<EmployeeTimetableScreenProps> = ({
  employee,
  onNavigate
}) => {
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as const;
  const dayFullNames: Record<string, string> = {
    Mon: 'Monday',
    Tue: 'Tuesday',
    Wed: 'Wednesday',
    Thu: 'Thursday',
    Fri: 'Friday',
    Sat: 'Saturday'
  };

  const getCurrentDayKey = (): 'Mon' | 'Tue' | 'Wed' | 'Thu' | 'Fri' | 'Sat' => {
    const daysMap = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const currentDayName = daysMap[new Date().getDay()];
    if (currentDayName === 'Sun') return 'Mon';
    return (currentDayName as any) || 'Mon';
  };

  const todayKey = getCurrentDayKey();
  const [selectedDay, setSelectedDay] = useState<'Mon' | 'Tue' | 'Wed' | 'Thu' | 'Fri' | 'Sat'>(todayKey);
  const [timetableSlots, setTimetableSlots] = useState<TimetableSlot[]>([]);
  const [weeklyModalOpen, setWeeklyModalOpen] = useState(false);

  const empId = employee?.id || employee?.employeeId || 'EMP-T101';
  const empName = employee?.name || 'Mrs. Priya Sharma';

  const loadTimetable = () => {
    try {
      const db = demoDataStore.getDB();
      const allSlots: TimetableSlot[] = db.timetable || timetableService.getAllSlots();

      const teacherSlots = allSlots.filter((t: any) => {
        const matchId = t.teacherId && (t.teacherId === empId || t.teacherId === employee?.employeeId);
        const matchName = (t.teacherName || t.teacher || '').toLowerCase().includes(empName.toLowerCase()) ||
                          empName.toLowerCase().includes((t.teacherName || t.teacher || '').toLowerCase());
        return matchId || matchName;
      });

      setTimetableSlots(teacherSlots);
    } catch (e) {
      console.warn('Error loading teacher timetable:', e);
    }
  };

  useEffect(() => {
    loadTimetable();
    const unsubscribe = demoDataStore.subscribe(() => {
      loadTimetable();
    });
    return () => unsubscribe();
  }, [employee?.id, employee?.employeeId, employee?.name]);

  // Parse time helper
  const parseTimeMinutes = (timeStr: string): number => {
    if (!timeStr) return 0;
    try {
      const cleanStr = timeStr.trim().toUpperCase();
      const isPM = cleanStr.includes('PM');
      const isAM = cleanStr.includes('AM');
      const timePart = cleanStr.replace(/AM|PM/g, '').trim();
      const [hStr, mStr] = timePart.split(':');
      let hours = parseInt(hStr, 10) || 0;
      const minutes = parseInt(mStr, 10) || 0;
      if (isPM && hours < 12) hours += 12;
      if (isAM && hours === 12) hours = 0;
      return hours * 60 + minutes;
    } catch (e) {
      return 0;
    }
  };

  // Determine current active or upcoming class today
  const now = new Date();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();

  const todayFull = dayFullNames[todayKey];
  const todaySlots = timetableSlots
    .filter(t => (t.day || '').toLowerCase() === todayKey.toLowerCase() || (t.day || '').toLowerCase() === todayFull.toLowerCase())
    .sort((a, b) => (a.period || 0) - (b.period || 0));

  let activePeriod: TimetableSlot | null = null;
  let nextPeriod: TimetableSlot | null = null;

  for (const slot of todaySlots) {
    const sMin = parseTimeMinutes(slot.startTime || '');
    const eMin = parseTimeMinutes(slot.endTime || '');

    if (currentMinutes >= sMin && currentMinutes <= eMin) {
      activePeriod = slot;
    } else if (sMin > currentMinutes && !nextPeriod) {
      nextPeriod = slot;
    }
  }

  const focusPeriod = activePeriod || nextPeriod || (todaySlots.length > 0 ? todaySlots[0] : null);

  // Selected Day Slots
  const targetDayFull = dayFullNames[selectedDay] || 'Monday';
  const selectedDaySlots = timetableSlots
    .filter((t) => {
      const dayStr = (t.day || '').toLowerCase();
      return dayStr === selectedDay.toLowerCase() || dayStr === targetDayFull.toLowerCase();
    })
    .sort((a, b) => (a.period || 0) - (b.period || 0));

  // Class Teacher assignment resolution
  const isClassTeacher = employee?.isClassTeacher === 'Yes' || !!employee?.classTeacherClass || empName.toLowerCase().includes('priya');
  const ctClassDisplay = employee?.classTeacherClass && employee?.classTeacherSection
    ? classService.formatClassDisplay(employee.classTeacherClass, employee.classTeacherSection)
    : 'Class 3-A';

  // Distinct Teaching Classes
  const myTeachingClasses = Array.from(new Set(timetableSlots.map(s => {
    const cName = s.className && s.section
      ? (s.className.includes('-') ? s.className : `${s.className}-${s.section}`)
      : (s.className || 'Class 3-A');
    return `${cName}::${s.subject || 'General'}`;
  }))).map(key => {
    const [className, subject] = key.split('::');
    const periodsCount = timetableSlots.filter(s => {
      const cName = s.className && s.section
        ? (s.className.includes('-') ? s.className : `${s.className}-${s.section}`)
        : (s.className || 'Class 3-A');
      return cName === className && s.subject === subject;
    }).length;
    return { className, subject, periodsCount };
  });

  return (
    <div style={{ padding: '16px 16px 80px 16px', display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Page Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h2 style={{ fontSize: 18, fontWeight: 800, color: '#172033', margin: 0 }}>Class Timetable</h2>
          <p style={{ fontSize: 12, color: '#64748B', marginTop: 2 }}>
            Teacher: <strong>{empName}</strong> • Employee ID: <strong>{empId}</strong>
          </p>
        </div>

        <button
          type="button"
          onClick={() => setWeeklyModalOpen(true)}
          style={{
            backgroundColor: '#EAF3FF',
            color: '#1769E0',
            border: '1px solid #BAE6FD',
            borderRadius: 10,
            padding: '6px 12px',
            fontSize: 11,
            fontWeight: 800,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 4
          }}
        >
          <Calendar size={13} /> Weekly View →
        </button>
      </div>

      {/* Top Banner: NEXT CLASS / NOW ACTIVE PERIOD */}
      <div style={{
        backgroundColor: activePeriod ? '#1769E0' : '#1E293B',
        color: '#FFFFFF',
        borderRadius: 16,
        padding: 16,
        boxShadow: '0 4px 12px rgba(0,0,0,0.12)',
        position: 'relative',
        overflow: 'hidden'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <span style={{
            fontSize: 10,
            fontWeight: 900,
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
            backgroundColor: activePeriod ? '#22C55E' : 'rgba(255,255,255,0.2)',
            color: '#FFFFFF',
            padding: '3px 8px',
            borderRadius: 8,
            display: 'flex',
            alignItems: 'center',
            gap: 4
          }}>
            {activePeriod ? <PlayCircle size={12} /> : <Clock size={12} />}
            {activePeriod ? 'NOW • ACTIVE PERIOD' : 'NEXT UPCOMING CLASS'}
          </span>

          <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.8)', fontWeight: 700 }}>
            {todayFull}
          </span>
        </div>

        {focusPeriod ? (
          <div>
            <div style={{ fontSize: 20, fontWeight: 900, marginBottom: 2 }}>
              {focusPeriod.subject}
            </div>
            <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.9)', fontWeight: 700, display: 'flex', gap: 12, alignItems: 'center' }}>
              <span>{classService.formatClassDisplay(focusPeriod.className, focusPeriod.section)}</span>
              <span>•</span>
              <span>{focusPeriod.startTime || '08:00 AM'} - {focusPeriod.endTime || '08:45 AM'}</span>
            </div>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.75)', marginTop: 4, display: 'flex', alignItems: 'center', gap: 4 }}>
              <MapPin size={13} /> Room: <strong>{focusPeriod.room || 'Room 12'}</strong>
            </div>

            {onNavigate && (
              <div style={{ marginTop: 12 }}>
                <button
                  type="button"
                  onClick={() => onNavigate('employee_students')}
                  style={{
                    backgroundColor: '#FFFFFF',
                    color: activePeriod ? '#1769E0' : '#0F172A',
                    border: 'none',
                    borderRadius: 8,
                    padding: '6px 12px',
                    fontSize: 11,
                    fontWeight: 800,
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 4
                  }}
                >
                  View Class Roster →
                </button>
              </div>
            )}
          </div>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '6px 0' }}>
            <CheckCircle2 size={24} color="#4ADE80" />
            <div>
              <div style={{ fontSize: 14, fontWeight: 800 }}>No more classes scheduled today</div>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.7)' }}>Your teaching sessions for {todayFull} are complete.</div>
            </div>
          </div>
        )}
      </div>

      {/* Day Switcher Strip */}
      <div>
        <div style={{ fontSize: 12, fontWeight: 800, color: '#475569', marginBottom: 6, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>SELECT DAY</span>
          <span style={{ fontSize: 11, color: '#1769E0' }}>Showing: {targetDayFull}</span>
        </div>

        <div style={{
          display: 'flex',
          gap: 6,
          backgroundColor: '#FFFFFF',
          padding: 6,
          borderRadius: 14,
          border: '1px solid #E2E8F0',
          overflowX: 'auto'
        }}>
          {days.map((day) => {
            const isSelected = selectedDay === day;
            const isTodayDay = todayKey === day;
            return (
              <button
                key={day}
                onClick={() => setSelectedDay(day)}
                style={{
                  flex: 1,
                  minWidth: 48,
                  padding: '8px 4px',
                  borderRadius: 10,
                  border: 'none',
                  backgroundColor: isSelected ? '#1769E0' : '#F8FAFC',
                  color: isSelected ? '#FFFFFF' : '#475569',
                  fontWeight: 800,
                  fontSize: 12,
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 2,
                  position: 'relative'
                }}
              >
                <span>{day}</span>
                {isTodayDay && (
                  <span style={{
                    fontSize: 8,
                    fontWeight: 900,
                    backgroundColor: isSelected ? '#FFFFFF' : '#1769E0',
                    color: isSelected ? '#1769E0' : '#FFFFFF',
                    padding: '1px 4px',
                    borderRadius: 4
                  }}>
                    TODAY
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Today's / Selected Day Schedule List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <div style={{ fontSize: 13, fontWeight: 800, color: '#172033' }}>
          {targetDayFull.toUpperCase()} SCHEDULE ({selectedDaySlots.length} PERIODS)
        </div>

        {selectedDaySlots.length > 0 ? (
          selectedDaySlots.map((period, idx) => {
            const isCurrentPeriod = selectedDay === todayKey && isNowPeriod(period, currentMinutes);
            return (
              <div
                key={period.id || idx}
                className="avm-card"
                style={{
                  padding: 14,
                  backgroundColor: '#FFFFFF',
                  borderRadius: 14,
                  border: isCurrentPeriod ? '2px solid #1769E0' : '1px solid #E2E8F0',
                  borderLeft: isCurrentPeriod ? '6px solid #1769E0' : '4px solid #7C3AED',
                  boxShadow: isCurrentPeriod ? '0 4px 12px rgba(23,105,224,0.15)' : '0 2px 4px rgba(0,0,0,0.02)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between'
                }}
              >
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                    <span style={{
                      fontSize: 11,
                      fontWeight: 800,
                      backgroundColor: '#EAF3FF',
                      color: '#1769E0',
                      padding: '2px 8px',
                      borderRadius: 6
                    }}>
                      {classService.formatClassDisplay(period.className, period.section)}
                    </span>

                    {isCurrentPeriod && (
                      <span style={{ fontSize: 10, fontWeight: 900, backgroundColor: '#22C55E', color: '#FFFFFF', padding: '2px 6px', borderRadius: 6 }}>
                        NOW
                      </span>
                    )}

                    <span style={{ fontSize: 11, color: '#64748B' }}>
                      Period {period.period || idx + 1}
                    </span>
                  </div>

                  <h4 style={{ fontSize: 15, fontWeight: 800, color: '#172033', margin: '2px 0 4px 0' }}>
                    {period.subject}
                  </h4>

                  <div style={{ fontSize: 12, color: '#64748B', display: 'flex', alignItems: 'center', gap: 4 }}>
                    <MapPin size={12} color="#94A3B8" /> Room: <strong>{period.room || 'Room 12'}</strong>
                  </div>
                </div>

                <div style={{
                  backgroundColor: '#F8FAFC',
                  border: '1px solid #F1F5F9',
                  padding: '8px 12px',
                  borderRadius: 10,
                  fontSize: 12,
                  fontWeight: 800,
                  color: '#1769E0',
                  textAlign: 'right'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <Clock size={12} />
                    {period.startTime || '08:00 AM'}
                  </div>
                  <div style={{ fontSize: 11, color: '#64748B', fontWeight: 600, marginTop: 2 }}>
                    to {period.endTime || '08:45 AM'}
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div style={{
            textAlign: 'center',
            padding: 24,
            backgroundColor: '#FFFFFF',
            borderRadius: 14,
            border: '1px dashed #CBD5E1',
            color: '#64748B',
            fontSize: 13
          }}>
            No classes scheduled for {targetDayFull}.
            <div style={{ fontSize: 11, color: '#94A3B8', marginTop: 4 }}>
              Your timetable has no teaching sessions assigned for this day.
            </div>
          </div>
        )}
      </div>

      {/* CLASS TEACHER SECTION */}
      <div style={{ backgroundColor: '#FFFFFF', borderRadius: 16, border: '1px solid #E2E8F0', padding: 14 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
          <div style={{ fontSize: 13, fontWeight: 800, color: '#172033', display: 'flex', alignItems: 'center', gap: 6 }}>
            <UserCheck size={16} color="#1769E0" />
            CLASS TEACHER ASSIGNMENT
          </div>
          <span style={{ fontSize: 11, fontWeight: 800, color: '#16A34A', backgroundColor: '#EAF8EF', padding: '2px 8px', borderRadius: 6 }}>
            Official
          </span>
        </div>

        {isClassTeacher ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div style={{ backgroundColor: '#F8FAFC', padding: 10, borderRadius: 10, border: '1px solid #F1F5F9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: 14, fontWeight: 800, color: '#172033' }}>{ctClassDisplay}</div>
                <div style={{ fontSize: 11, color: '#64748B' }}>Class Teacher: <strong>{empName}</strong></div>
              </div>
            </div>

            {/* Quick Actions for Class Teacher */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
              <button
                type="button"
                className="avm-btn-secondary"
                style={{ fontSize: 11, padding: '8px 4px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}
                onClick={() => onNavigate?.('attendance')}
              >
                <CheckSquare size={13} color="#1769E0" /> Attendance
              </button>

              <button
                type="button"
                className="avm-btn-secondary"
                style={{ fontSize: 11, padding: '8px 4px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}
                onClick={() => onNavigate?.('homework_upload')}
              >
                <FileText size={13} color="#7C3AED" /> Homework
              </button>

              <button
                type="button"
                className="avm-btn-secondary"
                style={{ fontSize: 11, padding: '8px 4px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}
                onClick={() => onNavigate?.('employee_students')}
              >
                <Users size={13} color="#16A34A" /> Students
              </button>
            </div>
          </div>
        ) : (
          <div style={{ fontSize: 12, color: '#64748B', fontStyle: 'italic', backgroundColor: '#F8FAFC', padding: 10, borderRadius: 8 }}>
            Class Teacher: No class assigned
          </div>
        )}
      </div>

      {/* MY TEACHING CLASSES SECTION */}
      <div style={{ backgroundColor: '#FFFFFF', borderRadius: 16, border: '1px solid #E2E8F0', padding: 14 }}>
        <div style={{ fontSize: 13, fontWeight: 800, color: '#172033', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
          <BookOpen size={16} color="#7C3AED" />
          MY TEACHING CLASSES ({myTeachingClasses.length})
        </div>

        {myTeachingClasses.length > 0 ? (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            {myTeachingClasses.map((item, idx) => (
              <div key={idx} style={{ backgroundColor: '#F8FAFC', border: '1px solid #F1F5F9', padding: 10, borderRadius: 10 }}>
                <div style={{ fontSize: 13, fontWeight: 800, color: '#172033' }}>{item.className}</div>
                <div style={{ fontSize: 12, fontWeight: 700, color: '#7C3AED', marginTop: 2 }}>{item.subject}</div>
                <div style={{ fontSize: 10, color: '#64748B', marginTop: 2 }}>{item.periodsCount} periods / week</div>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ fontSize: 12, color: '#64748B', fontStyle: 'italic' }}>
            No subjects assigned yet.
          </div>
        )}
      </div>

      {/* WEEKLY TIMETABLE MODAL */}
      {weeklyModalOpen && (
        <Modal isOpen={weeklyModalOpen} onClose={() => setWeeklyModalOpen(false)} title={`Weekly Timetable - ${empName}`}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14, maxHeight: '65vh', overflowY: 'auto' }}>
            {days.map((d) => {
              const fullName = dayFullNames[d];
              const dSlots = timetableSlots
                .filter(s => (s.day || '').toLowerCase() === d.toLowerCase() || (s.day || '').toLowerCase() === fullName.toLowerCase())
                .sort((a, b) => (a.period || 0) - (b.period || 0));

              return (
                <div key={d} style={{ border: '1px solid #E2E8F0', borderRadius: 12, padding: 12, backgroundColor: '#FFFFFF' }}>
                  <div style={{ fontSize: 13, fontWeight: 800, color: '#1769E0', marginBottom: 8, borderBottom: '1px solid #F1F5F9', paddingBottom: 4 }}>
                    {fullName.toUpperCase()} ({dSlots.length} Classes)
                  </div>

                  {dSlots.length > 0 ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                      {dSlots.map((slot, sIdx) => (
                        <div key={sIdx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#F8FAFC', padding: '6px 10px', borderRadius: 8, fontSize: 12 }}>
                          <div>
                            <strong>{classService.formatClassDisplay(slot.className, slot.section)}</strong> • {slot.subject}
                            <span style={{ fontSize: 11, color: '#64748B', marginLeft: 6 }}>({slot.room || 'Room 12'})</span>
                          </div>
                          <span style={{ fontSize: 11, color: '#1769E0', fontWeight: 700 }}>
                            {slot.startTime || '08:00 AM'}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div style={{ fontSize: 11, color: '#94A3B8', fontStyle: 'italic' }}>No classes scheduled</div>
                  )}
                </div>
              );
            })}
          </div>
        </Modal>
      )}
    </div>
  );
};

const isNowPeriod = (period: TimetableSlot, currentMinutes: number) => {
  if (!period.startTime || !period.endTime) return false;
  const parse = (str: string) => {
    const cleanStr = str.trim().toUpperCase();
    const isPM = cleanStr.includes('PM');
    const isAM = cleanStr.includes('AM');
    const timePart = cleanStr.replace(/AM|PM/g, '').trim();
    const [hStr, mStr] = timePart.split(':');
    let hours = parseInt(hStr, 10) || 0;
    const minutes = parseInt(mStr, 10) || 0;
    if (isPM && hours < 12) hours += 12;
    if (isAM && hours === 12) hours = 0;
    return hours * 60 + minutes;
  };
  const startM = parse(period.startTime);
  const endM = parse(period.endTime);
  return currentMinutes >= startM && currentMinutes <= endM;
};

