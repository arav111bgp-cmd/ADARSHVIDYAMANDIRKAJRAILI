import React, { useState, useEffect } from 'react';
import { Student, Employee, AttendanceRecord } from '../types';
import { employeeService } from '../services/employeeService';
import { studentService } from '../services/studentService';
import { attendanceService } from '../services/attendanceService';
import { classService, SCHOOL_CLASSES } from '../services/classService';
import { Modal } from '../components/Modal';

interface EmployeeTakeAttendanceScreenProps {
  employee?: Employee;
}

export const EmployeeTakeAttendanceScreen: React.FC<EmployeeTakeAttendanceScreenProps> = ({ employee }) => {
  const teacherClasses = classService.getTeacherClasses(employee?.assignedClasses);

  const [selectedClassObj, setSelectedClassObj] = useState(teacherClasses[0] || SCHOOL_CLASSES[7]);
  const [attendanceDate, setAttendanceDate] = useState(new Date().toISOString().split('T')[0]);
  const [students, setStudents] = useState<Student[]>([]);
  const [hasExistingRecord, setHasExistingRecord] = useState(false);

  // Student roster state with attendance status
  const [studentsStatus, setStudentsStatus] = useState<Record<string, 'present' | 'absent' | 'leave'>>({});
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const [historyModalOpen, setHistoryModalOpen] = useState(false);
  const [historyTab, setHistoryTab] = useState<'Daily' | 'Monthly'>('Daily');
  const [classAttendanceLogs, setClassAttendanceLogs] = useState<AttendanceRecord[]>([]);

  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  // Synchronize selected class if teacherClasses updates
  useEffect(() => {
    if (teacherClasses.length > 0 && !teacherClasses.some(c => c.id === selectedClassObj.id)) {
      setSelectedClassObj(teacherClasses[0]);
    }
  }, [employee?.assignedClasses]);

  const loadRoster = async () => {
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

      // Fetch existing attendance for selected date
      const existing = await attendanceService.getAttendance(undefined, attendanceDate, selectedClassObj.name, selectedClassObj.section);
      const matchForDate = existing.filter((a) => a.date === attendanceDate);
      setHasExistingRecord(matchForDate.length > 0);

      const initialMap: Record<string, 'present' | 'absent' | 'leave'> = {};
      list.forEach((s) => {
        const found = matchForDate.find((a) => a.studentId === s.id);
        initialMap[s.id] = found ? (found.status as any) : 'present';
      });
      setStudentsStatus(initialMap);

      // Load all attendance records for class history
      const allClassRecords = await attendanceService.getAttendance(undefined, undefined, selectedClassObj.name, selectedClassObj.section);
      setClassAttendanceLogs(allClassRecords);
    } catch (e) {
      console.warn('Error loading attendance roster:', e);
    }
  };

  useEffect(() => {
    loadRoster();
  }, [selectedClassObj.id, attendanceDate]);

  const handleToggle = (studentId: string, status: 'present' | 'absent' | 'leave') => {
    setStudentsStatus((prev) => ({
      ...prev,
      [studentId]: status
    }));
  };

  const handleMarkAllPresent = () => {
    const updated: Record<string, 'present' | 'absent' | 'leave'> = {};
    students.forEach((s) => {
      updated[s.id] = 'present';
    });
    setStudentsStatus(updated);
  };

  const handleMarkAllAbsent = () => {
    const updated: Record<string, 'present' | 'absent' | 'leave'> = {};
    students.forEach((s) => {
      updated[s.id] = 'absent';
    });
    setStudentsStatus(updated);
  };

  const handleConfirmSubmit = async () => {
    setSubmitting(true);
    const records = students.map((s) => ({
      date: attendanceDate,
      studentId: s.id,
      studentName: s.name,
      admissionNo: s.admissionNo || s.id,
      rollNo: s.rollNo,
      className: selectedClassObj.name,
      section: selectedClassObj.section,
      status: studentsStatus[s.id] || 'present',
      teacherId: employee?.id || 'EMP-T102',
      teacherName: employee?.name || 'Mrs. Priya Sharma',
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }));

    await attendanceService.submitAttendance(attendanceDate, selectedClassObj.name, selectedClassObj.section, records);
    setSubmitting(false);
    setSubmitted(true);
    setHasExistingRecord(true);
    setTimeout(() => {
      setSubmitted(false);
      setConfirmModalOpen(false);
      loadRoster();
    }, 1800);
  };

  const presentCount = Object.values(studentsStatus).filter((s) => s === 'present').length;
  const absentCount = Object.values(studentsStatus).filter((s) => s === 'absent').length;
  const totalCount = students.length;
  const attendancePercent = totalCount > 0 ? ((presentCount / totalCount) * 100).toFixed(2) : '0.00';

  // Group class logs by date for Daily History
  const dailyHistoryMap = classAttendanceLogs.reduce((acc, rec) => {
    if (!acc[rec.date]) {
      acc[rec.date] = { date: rec.date, present: 0, absent: 0, leave: 0, total: 0 };
    }
    acc[rec.date].total += 1;
    if (rec.status === 'present') acc[rec.date].present += 1;
    else if (rec.status === 'absent') acc[rec.date].absent += 1;
    else if (rec.status === 'leave') acc[rec.date].leave += 1;
    return acc;
  }, {} as Record<string, { date: string; present: number; absent: number; leave: number; total: number }>);

  const dailyHistoryList = Object.values(dailyHistoryMap).sort((a, b) => b.date.localeCompare(a.date));

  return (
    <div style={{ padding: '16px 16px 80px 16px', display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h2 style={{ fontSize: 18, fontWeight: 800, color: '#172033' }}>Take Class Attendance</h2>
          <p style={{ fontSize: 12, color: '#667085' }}>
            Teacher: <strong>{employee?.name || 'Mrs. Priya Sharma'}</strong>
          </p>
        </div>

        <button
          type="button"
          onClick={() => setHistoryModalOpen(true)}
          style={{
            backgroundColor: '#EFF6FF',
            color: '#1769E0',
            border: '1px solid #BFDBFE',
            padding: '8px 12px',
            borderRadius: 10,
            fontSize: 12,
            fontWeight: 700,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 4
          }}
        >
          📊 View Attendance History
        </button>
      </div>

      {/* Selector Controls */}
      <div className="avm-card" style={{ padding: 14, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        <div>
          <label style={{ fontSize: 11, fontWeight: 700, color: '#475569', display: 'block', marginBottom: 4 }}>
            Assigned Class & Section
          </label>
          <select
            className="avm-input"
            value={selectedClassObj.id}
            onChange={(e) => {
              const found = teacherClasses.find((c) => c.id === e.target.value);
              if (found) setSelectedClassObj(found);
            }}
            style={{ padding: '8px 10px', fontSize: 13, width: '100%' }}
          >
            {teacherClasses.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>

        <div>
          <label style={{ fontSize: 11, fontWeight: 700, color: '#475569', display: 'block', marginBottom: 4 }}>
            Attendance Date
          </label>
          <input
            type="date"
            className="avm-input"
            value={attendanceDate}
            onChange={(e) => setAttendanceDate(e.target.value)}
            style={{ padding: '8px 10px', fontSize: 13, width: '100%' }}
          />
        </div>
      </div>

      {/* Notice Banner if No Saved Attendance for Date */}
      {!hasExistingRecord && students.length > 0 && (
        <div style={{
          backgroundColor: '#FFFBEB',
          border: '1px solid #FCD34D',
          borderRadius: 8,
          padding: '10px 12px',
          fontSize: 12,
          color: '#B45309',
          fontWeight: 600
        }}>
          ⚠️ Attendance not recorded for this date ({attendanceDate}). Mark attendance below and click Save.
        </div>
      )}

      {/* Roster & Stats Banner */}
      <div className="avm-card" style={{ padding: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
        <div>
          <div style={{ fontSize: 13, fontWeight: 800, color: '#172033' }}>
            Roster: {totalCount} Students
          </div>
          <div style={{ fontSize: 12, color: '#667085', marginTop: 2 }}>
            <span style={{ color: '#16A34A', fontWeight: 700 }}>{presentCount} Present</span> • <span style={{ color: '#EF4444', fontWeight: 700 }}>{absentCount} Absent</span> • <strong>{attendancePercent}% Attendance</strong>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 6 }}>
          <button
            type="button"
            onClick={handleMarkAllPresent}
            style={{
              backgroundColor: '#EAF8EF',
              color: '#16A34A',
              border: '1px solid #BBF7D0',
              padding: '6px 10px',
              borderRadius: 20,
              fontSize: 11,
              fontWeight: 700,
              cursor: 'pointer'
            }}
          >
            ✓ Mark All Present
          </button>
          <button
            type="button"
            onClick={handleMarkAllAbsent}
            style={{
              backgroundColor: '#FEF2F2',
              color: '#EF4444',
              border: '1px solid #FECACA',
              padding: '6px 10px',
              borderRadius: 20,
              fontSize: 11,
              fontWeight: 700,
              cursor: 'pointer'
            }}
          >
            ✕ Mark All Absent
          </button>
        </div>
      </div>

      {/* Student Cards List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {students.length === 0 ? (
          <div className="avm-card" style={{ textAlign: 'center', padding: 24, color: '#667085', fontSize: 13 }}>
            No students found in Class {selectedClassObj.name}.
          </div>
        ) : (
          students.map((student) => {
            const currentStatus = studentsStatus[student.id] || 'present';

            return (
              <div
                key={student.id}
                className="avm-card"
                style={{
                  padding: 12,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  borderLeft: currentStatus === 'present' ? '4px solid #16A34A' : currentStatus === 'absent' ? '4px solid #EF4444' : '4px solid #F59E0B'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <img
                    src={student.photo || 'https://images.unsplash.com/photo-1544717305-2782549b5136?w=150'}
                    alt={student.name}
                    style={{
                      width: 44,
                      height: 44,
                      borderRadius: '50%',
                      objectFit: 'cover',
                      border: '2px solid #E2E8F0'
                    }}
                  />
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: '#172033' }}>
                      {student.name}
                    </div>
                    <div style={{ fontSize: 11, color: '#667085' }}>
                      Admission No: <strong>{student.admissionNo || student.id}</strong> • Roll No: <strong>{student.rollNo}</strong>
                    </div>
                  </div>
                </div>

                {/* Status Toggle Buttons */}
                <div style={{ display: 'flex', gap: 4 }}>
                  <button
                    type="button"
                    onClick={() => handleToggle(student.id, 'present')}
                    style={{
                      padding: '6px 10px',
                      borderRadius: 8,
                      border: 'none',
                      backgroundColor: currentStatus === 'present' ? '#16A34A' : '#F1F5F9',
                      color: currentStatus === 'present' ? '#FFFFFF' : '#64748B',
                      fontWeight: 700,
                      fontSize: 11,
                      cursor: 'pointer'
                    }}
                  >
                    Present
                  </button>

                  <button
                    type="button"
                    onClick={() => handleToggle(student.id, 'absent')}
                    style={{
                      padding: '6px 10px',
                      borderRadius: 8,
                      border: 'none',
                      backgroundColor: currentStatus === 'absent' ? '#EF4444' : '#F1F5F9',
                      color: currentStatus === 'absent' ? '#FFFFFF' : '#64748B',
                      fontWeight: 700,
                      fontSize: 11,
                      cursor: 'pointer'
                    }}
                  >
                    Absent
                  </button>

                  <button
                    type="button"
                    onClick={() => handleToggle(student.id, 'leave')}
                    style={{
                      padding: '6px 10px',
                      borderRadius: 8,
                      border: 'none',
                      backgroundColor: currentStatus === 'leave' ? '#F59E0B' : '#F1F5F9',
                      color: currentStatus === 'leave' ? '#FFFFFF' : '#64748B',
                      fontWeight: 700,
                      fontSize: 11,
                      cursor: 'pointer'
                    }}
                  >
                    Leave
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Save Button */}
      <button
        className="avm-btn-primary"
        onClick={() => setConfirmModalOpen(true)}
        disabled={students.length === 0}
        style={{ width: '100%', marginTop: 8 }}
      >
        Save Attendance ({presentCount}/{students.length} Present)
      </button>

      {/* Confirmation Modal */}
      {confirmModalOpen && (
        <Modal isOpen={confirmModalOpen} onClose={() => setConfirmModalOpen(false)} title="Confirm Attendance Submission">
          <div>
            <p style={{ fontSize: 13, color: '#475569', marginBottom: 16 }}>
              Are you sure you want to save attendance for <strong>{selectedClassObj.name}</strong> on <strong>{attendanceDate}</strong>?
            </p>

            <div style={{ backgroundColor: '#F8FAFC', padding: 12, borderRadius: 10, fontSize: 13, marginBottom: 16 }}>
              <div>• Total Students: <strong>{students.length}</strong></div>
              <div>• Present: <strong>{presentCount}</strong></div>
              <div>• Absent: <strong>{absentCount}</strong></div>
              <div>• Attendance Percentage: <strong>{attendancePercent}%</strong></div>
            </div>

            {submitted ? (
              <div style={{ backgroundColor: '#EAF8EF', color: '#16A34A', padding: 12, borderRadius: 8, textAlign: 'center', fontWeight: 700, fontSize: 13 }}>
                ✓ Attendance saved successfully for Class {selectedClassObj.name} — {students.length} students
              </div>
            ) : (
              <div style={{ display: 'flex', gap: 10 }}>
                <button className="avm-btn-secondary" style={{ flex: 1 }} onClick={() => setConfirmModalOpen(false)}>
                  Cancel
                </button>
                <button className="avm-btn-primary" style={{ flex: 1 }} onClick={handleConfirmSubmit} disabled={submitting}>
                  {submitting ? 'Saving...' : 'Save Attendance'}
                </button>
              </div>
            )}
          </div>
        </Modal>
      )}

      {/* Attendance History Modal */}
      {historyModalOpen && (
        <Modal isOpen={historyModalOpen} onClose={() => setHistoryModalOpen(false)} title={`Attendance History — ${selectedClassObj.name}`}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {/* Tabs */}
            <div style={{ backgroundColor: '#F1F5F9', padding: 3, borderRadius: 10, display: 'grid', gridTemplateColumns: '1fr 1fr' }}>
              <button
                type="button"
                onClick={() => setHistoryTab('Daily')}
                style={{
                  padding: '6px 12px',
                  borderRadius: 8,
                  border: 'none',
                  backgroundColor: historyTab === 'Daily' ? '#FFFFFF' : 'transparent',
                  color: historyTab === 'Daily' ? '#1769E0' : '#64748B',
                  fontWeight: 700,
                  fontSize: 12,
                  cursor: 'pointer'
                }}
              >
                Daily History
              </button>
              <button
                type="button"
                onClick={() => setHistoryTab('Monthly')}
                style={{
                  padding: '6px 12px',
                  borderRadius: 8,
                  border: 'none',
                  backgroundColor: historyTab === 'Monthly' ? '#FFFFFF' : 'transparent',
                  color: historyTab === 'Monthly' ? '#1769E0' : '#64748B',
                  fontWeight: 700,
                  fontSize: 12,
                  cursor: 'pointer'
                }}
              >
                Monthly Summary
              </button>
            </div>

            {historyTab === 'Daily' ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, maxHeight: 350, overflowY: 'auto' }}>
                {dailyHistoryList.length === 0 ? (
                  <div style={{ textAlign: 'center', color: '#667085', fontSize: 13, padding: 20 }}>
                    No recorded attendance logs found for {selectedClassObj.name}.
                  </div>
                ) : (
                  dailyHistoryList.map((log) => {
                    const pct = log.total > 0 ? ((log.present / log.total) * 100).toFixed(1) : '0';
                    return (
                      <div
                        key={log.date}
                        style={{
                          padding: 12,
                          borderRadius: 8,
                          border: '1px solid #E2E8F0',
                          backgroundColor: '#F8FAFC',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          cursor: 'pointer'
                        }}
                        onClick={() => {
                          setAttendanceDate(log.date);
                          setHistoryModalOpen(false);
                        }}
                      >
                        <div>
                          <div style={{ fontSize: 13, fontWeight: 700, color: '#172033' }}>📅 {log.date}</div>
                          <div style={{ fontSize: 11, color: '#667085', marginTop: 2 }}>
                            Total: {log.total} • <span style={{ color: '#16A34A', fontWeight: 600 }}>{log.present} Present</span> • <span style={{ color: '#EF4444', fontWeight: 600 }}>{log.absent} Absent</span>
                          </div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <span style={{ fontSize: 14, fontWeight: 800, color: '#1769E0' }}>{pct}%</span>
                          <div style={{ fontSize: 10, color: '#94A3B8' }}>Click to view</div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, maxHeight: 350, overflowY: 'auto' }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: '#475569' }}>
                  Student-wise Monthly Summary ({selectedClassObj.name})
                </div>
                <table style={{ width: '100%', fontSize: 11, borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ backgroundColor: '#F1F5F9', textAlign: 'left' }}>
                      <th style={{ padding: 6, borderBottom: '1px solid #CBD5E1' }}>Student</th>
                      <th style={{ padding: 6, borderBottom: '1px solid #CBD5E1', textAlign: 'center' }}>Total</th>
                      <th style={{ padding: 6, borderBottom: '1px solid #CBD5E1', textAlign: 'center' }}>P</th>
                      <th style={{ padding: 6, borderBottom: '1px solid #CBD5E1', textAlign: 'center' }}>A</th>
                      <th style={{ padding: 6, borderBottom: '1px solid #CBD5E1', textAlign: 'center' }}>%</th>
                    </tr>
                  </thead>
                  <tbody>
                    {students.map((stu) => {
                      const stuLogs = classAttendanceLogs.filter((a) => a.studentId === stu.id);
                      const pCount = stuLogs.filter((a) => a.status === 'present').length;
                      const aCount = stuLogs.filter((a) => a.status === 'absent').length;
                      const tCount = stuLogs.length;
                      const pct = tCount > 0 ? Math.round((pCount / tCount) * 100) : 100;

                      return (
                        <tr key={stu.id} style={{ borderBottom: '1px solid #F1F5F9' }}>
                          <td style={{ padding: '6px 4px', fontWeight: 600, color: '#172033' }}>{stu.name}</td>
                          <td style={{ padding: '6px 4px', textAlign: 'center' }}>{tCount}</td>
                          <td style={{ padding: '6px 4px', textAlign: 'center', color: '#16A34A', fontWeight: 700 }}>{pCount}</td>
                          <td style={{ padding: '6px 4px', textAlign: 'center', color: '#EF4444', fontWeight: 700 }}>{aCount}</td>
                          <td style={{ padding: '6px 4px', textAlign: 'center', fontWeight: 700, color: '#1769E0' }}>{pct}%</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </Modal>
      )}
    </div>
  );
};
