import React, { useState, useEffect } from 'react';
import { AttendanceRecord, Student } from '../types';
import { attendanceService } from '../services/attendanceService';
import { studentService } from '../services/studentService';

interface StudentAttendanceScreenProps {
  student?: Student;
}

export const StudentAttendanceScreen: React.FC<StudentAttendanceScreenProps> = ({ student }) => {
  const [tab, setTab] = useState<'Monthly' | 'Overall'>('Monthly');
  const [records, setRecords] = useState<AttendanceRecord[]>([]);

  const fetchAttendance = async () => {
    try {
      const studentId = student?.id || 'STU-157';
      const data = await attendanceService.getAttendance(studentId);
      if (data && data.length > 0) {
        setRecords(data);
      } else {
        const fallback = await studentService.getAttendance(studentId);
        setRecords(fallback);
      }
    } catch (e) {
      console.warn('Error fetching attendance in StudentAttendanceScreen:', e);
    }
  };

  useEffect(() => {
    fetchAttendance();
  }, [student?.id]);

  const presentCount = records.filter((a) => a.status === 'present').length;
  const absentCount = records.filter((a) => a.status === 'absent').length;
  const leaveCount = records.filter((a) => a.status === 'leave').length;
  const totalDays = records.length;
  const percentage = totalDays > 0 ? Math.round((presentCount / totalDays) * 100) : 100;

  // Determine active month from latest record or current date
  const latestDate = records.length > 0 && records[0].date ? records[0].date : new Date().toISOString().split('T')[0];
  const activeMonthStr = latestDate.substring(0, 7); // e.g. "2026-10" or "2026-09"
  
  const displayMonthName = (() => {
    try {
      const [y, m] = activeMonthStr.split('-');
      const d = new Date(parseInt(y), parseInt(m) - 1, 1);
      return d.toLocaleString('default', { month: 'long', year: 'numeric' });
    } catch (e) {
      return 'Academic Record';
    }
  })();

  const daysInMonth = (() => {
    try {
      const [y, m] = activeMonthStr.split('-');
      return new Date(parseInt(y), parseInt(m), 0).getDate();
    } catch (e) {
      return 30;
    }
  })();

  const calendarDays = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  const getDayStatus = (dayNum: number) => {
    const dateStr = `${activeMonthStr}-${dayNum < 10 ? '0' + dayNum : dayNum}`;
    const rec = records.find((r) => r.date === dateStr);
    return rec ? rec.status : null;
  };

  return (
    <div style={{ padding: '16px 16px 80px 16px', display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div>
        <h2 style={{ fontSize: 18, fontWeight: 800, color: '#172033' }}>My Attendance</h2>
        <p style={{ fontSize: 12, color: '#667085' }}>{displayMonthName} Academic Record</p>
      </div>

      {/* Tabs */}
      <div style={{
        backgroundColor: '#E2E8F0',
        borderRadius: 12,
        padding: 3,
        display: 'grid',
        gridTemplateColumns: '1fr 1fr'
      }}>
        <button
          onClick={() => setTab('Monthly')}
          style={{
            padding: '8px',
            borderRadius: 10,
            border: 'none',
            backgroundColor: tab === 'Monthly' ? '#FFFFFF' : 'transparent',
            color: tab === 'Monthly' ? '#1769E0' : '#64748B',
            fontWeight: 700,
            fontSize: 13,
            cursor: 'pointer'
          }}
        >
          Monthly View
        </button>
        <button
          onClick={() => setTab('Overall')}
          style={{
            padding: '8px',
            borderRadius: 10,
            border: 'none',
            backgroundColor: tab === 'Overall' ? '#FFFFFF' : 'transparent',
            color: tab === 'Overall' ? '#1769E0' : '#64748B',
            fontWeight: 700,
            fontSize: 13,
            cursor: 'pointer'
          }}
        >
          Overall Summary
        </button>
      </div>

      {/* Overview Percentage Card */}
      <div className="avm-card" style={{
        padding: 20,
        background: 'linear-gradient(135deg, #EAF3FF 0%, #FFFFFF 100%)',
        border: '1px solid #BEDBFF',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        <div>
          <div style={{ fontSize: 12, fontWeight: 700, color: '#1769E0' }}>OVERALL ATTENDANCE</div>
          <div style={{ fontSize: 32, fontWeight: 800, color: '#172033', lineHeight: 1.1, marginTop: 4 }}>
            {percentage}%
          </div>
          <div style={{ fontSize: 11, color: '#16A34A', fontWeight: 600, marginTop: 4 }}>
            ✓ Eligible for Half Yearly Examinations
          </div>
        </div>

        {/* Circular indicator style */}
        <div style={{
          width: 64,
          height: 64,
          borderRadius: '50%',
          border: '6px solid #1769E0',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 14,
          fontWeight: 800,
          color: '#1769E0',
          backgroundColor: '#FFFFFF'
        }}>
          {percentage}%
        </div>
      </div>

      {/* Status Counters Row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
        <div className="avm-card" style={{ padding: 12, textAlign: 'center', borderTop: '3px solid #16A34A' }}>
          <div style={{ fontSize: 11, color: '#667085', fontWeight: 600 }}>Present</div>
          <div style={{ fontSize: 20, fontWeight: 800, color: '#16A34A', marginTop: 2 }}>{presentCount}</div>
        </div>
        <div className="avm-card" style={{ padding: 12, textAlign: 'center', borderTop: '3px solid #EF4444' }}>
          <div style={{ fontSize: 11, color: '#667085', fontWeight: 600 }}>Absent</div>
          <div style={{ fontSize: 20, fontWeight: 800, color: '#EF4444', marginTop: 2 }}>{absentCount}</div>
        </div>
        <div className="avm-card" style={{ padding: 12, textAlign: 'center', borderTop: '3px solid #F59E0B' }}>
          <div style={{ fontSize: 11, color: '#667085', fontWeight: 600 }}>Leave</div>
          <div style={{ fontSize: 20, fontWeight: 800, color: '#F59E0B', marginTop: 2 }}>{leaveCount}</div>
        </div>
      </div>

      {/* Monthly Calendar View */}
      {tab === 'Monthly' && (
        <div className="avm-card" style={{ padding: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            <h4 style={{ fontSize: 14, fontWeight: 700, color: '#172033' }}>{displayMonthName}</h4>
            <span style={{ fontSize: 11, color: '#667085' }}>{daysInMonth} Days Total</span>
          </div>

          {/* Calendar Grid */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(7, 1fr)',
            gap: 6,
            textAlign: 'center'
          }}>
            {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
              <div key={i} style={{ fontSize: 11, fontWeight: 700, color: '#94A3B8', paddingBottom: 6 }}>
                {d}
              </div>
            ))}

            {calendarDays.map((d) => {
              const status = getDayStatus(d);
              let bg = '#F1F5F9';
              let text = '#64748B';

              if (status === 'present') {
                bg = '#EAF8EF';
                text = '#16A34A';
              } else if (status === 'absent') {
                bg = '#FEF2F2';
                text = '#EF4444';
              } else if (status === 'leave') {
                bg = '#FFFBEB';
                text = '#F59E0B';
              }

              return (
                <div
                  key={d}
                  style={{
                    aspectRatio: '1',
                    borderRadius: 8,
                    backgroundColor: bg,
                    color: text,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 12,
                    fontWeight: 700
                  }}
                >
                  {d}
                </div>
              );
            })}
          </div>

          {/* Legend */}
          <div style={{ display: 'flex', justifyContent: 'center', gap: 16, marginTop: 16, fontSize: 11, color: '#667085' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <span style={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: '#16A34A' }} /> Present
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <span style={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: '#EF4444' }} /> Absent
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <span style={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: '#F59E0B' }} /> Leave
            </span>
          </div>
        </div>
      )}

      {/* Attendance History */}
      <div className="avm-card" style={{ padding: 16 }}>
        <h4 style={{ fontSize: 14, fontWeight: 700, color: '#172033', marginBottom: 12 }}>
          Recent Log
        </h4>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {records.length === 0 ? (
            <div style={{ fontSize: 12, color: '#667085', textAlign: 'center' }}>No attendance records recorded yet.</div>
          ) : (
            records.slice(0, 5).map((rec, i) => (
              <div key={i} style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '8px 0',
                borderBottom: i < records.length - 1 ? '1px solid #F1F5F9' : 'none'
              }}>
                <span style={{ fontSize: 13, fontWeight: 600, color: '#172033' }}>{rec.date}</span>
                <span style={{
                  fontSize: 11,
                  fontWeight: 700,
                  padding: '3px 10px',
                  borderRadius: 12,
                  backgroundColor: rec.status === 'present' ? '#EAF8EF' : rec.status === 'absent' ? '#FEF2F2' : '#FFFBEB',
                  color: rec.status === 'present' ? '#16A34A' : rec.status === 'absent' ? '#EF4444' : '#F59E0B',
                  textTransform: 'capitalize'
                }}>
                  {rec.status} {rec.remark ? `(${rec.remark})` : ''}
                </span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

