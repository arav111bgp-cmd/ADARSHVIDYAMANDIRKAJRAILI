import React, { useState, useEffect } from 'react';
import { Student, AttendanceRecord, Homework, StudentResult, StudentFeeDetails } from '../types';
import { Modal } from './Modal';
import { attendanceService } from '../services/attendanceService';
import { homeworkService } from '../services/homeworkService';
import { resultService } from '../services/resultService';
import { feeService } from '../services/feeService';
import { studentService } from '../services/studentService';
import { demoDataStore } from '../services/demoDataStore';
import { 
  User, Phone, Mail, MapPin, Calendar, BookOpen, Award, DollarSign, 
  Bus, FileText, HeartPulse, Shield, ChevronDown, ChevronUp, ExternalLink, 
  CheckCircle2, XCircle, Clock, Edit3, AlertCircle
} from 'lucide-react';

interface StudentProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  student: Student | null;
  role?: 'employee' | 'admin' | 'student';
  onStudentUpdated?: () => void;
}

export const StudentProfileModal: React.FC<StudentProfileModalProps> = ({
  isOpen,
  onClose,
  student,
  role = 'employee',
  onStudentUpdated
}) => {
  const [collapsedSections, setCollapsedSections] = useState<Record<string, boolean>>({});

  // Sub-modal states
  const [attendanceHistoryOpen, setAttendanceHistoryOpen] = useState(false);
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);

  const [homeworkModalOpen, setHomeworkModalOpen] = useState(false);
  const [studentHomeworks, setStudentHomeworks] = useState<Homework[]>([]);

  const [resultModalOpen, setResultModalOpen] = useState(false);
  const [studentResult, setStudentResult] = useState<StudentResult | null>(null);

  const [feeModalOpen, setFeeModalOpen] = useState(false);
  const [feeDetails, setFeeDetails] = useState<StudentFeeDetails | null>(null);

  // Admin Edit Modal state
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editForm, setEditForm] = useState<Partial<Student>>({});

  useEffect(() => {
    if (student) {
      loadStudentRelatedData();
      setEditForm({ ...student });
    }
  }, [student?.id]);

  const loadStudentRelatedData = async () => {
    if (!student) return;
    try {
      // Load Attendance
      const att = await attendanceService.getAttendance(student.id);
      setAttendanceRecords(att || []);

      // Load Homework
      const hw = await homeworkService.getHomework(student.className, student.section);
      setStudentHomeworks(hw || []);

      // Load Result
      const res = await resultService.getResultForStudent(student.id);
      setStudentResult(res || null);

      // Load Fees
      const fee = await feeService.getFeeDetails(student.id);
      setFeeDetails(fee || null);
    } catch (e) {
      console.warn('Error loading student profile related data:', e);
    }
  };

  if (!isOpen || !student) return null;

  const isAdmin = role === 'admin';

  const toggleSection = (sectionKey: string) => {
    setCollapsedSections(prev => ({ ...prev, [sectionKey]: !prev[sectionKey] }));
  };

  // Calculate Attendance Stats safely handling string status
  const totalDays = attendanceRecords.length || 180;
  const presentDays = attendanceRecords.filter(r => (r.status || '').toLowerCase() === 'present').length || (attendanceRecords.length === 0 ? 171 : 0);
  const absentDays = attendanceRecords.filter(r => (r.status || '').toLowerCase() === 'absent').length || (attendanceRecords.length === 0 ? 5 : 0);
  const leaveDays = attendanceRecords.filter(r => (r.status || '').toLowerCase() === 'leave').length || (attendanceRecords.length === 0 ? 4 : 0);
  const attPercentage = totalDays > 0 ? Math.round((presentDays / totalDays) * 100) : 95;

  // Calculate Homework Stats
  const totalHw = studentHomeworks.length;
  const completedHw = studentHomeworks.filter(h => h.status === 'Completed').length;
  const pendingHw = totalHw - completedHw;

  // Transport details resolution
  const hasTransport = student.transportRequired || !!student.transportBusNo || (!!student.transportRoute && student.transportRoute !== 'None');
  const busNo = student.transportBusNo || 'BUS-05';
  const route = student.transportRoute || 'Kajraili → School';
  const stop = student.transportStop || student.transportPickupPoint || 'Kajraili Chowk';
  const dropPoint = student.transportDropPoint || 'School Gate';
  const driverName = student.driverName || 'Rakesh Kumar';
  const driverPhone = student.driverPhone || student.driverContact || '+91 98765 43210';

  // Admin Save Edit Handler
  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!student) return;
    try {
      const allStudents = await studentService.getAllStudents();
      const idx = allStudents.findIndex(s => s.id === student.id);
      if (idx !== -1) {
        Object.assign(allStudents[idx], editForm);
        const db = demoDataStore.getDB();
        db.students = allStudents;
        demoDataStore.saveDB(db);
      }
      setEditModalOpen(false);
      if (onStudentUpdated) onStudentUpdated();
    } catch (err) {
      console.error('Failed to update student profile:', err);
    }
  };

  const fullClassDisplay = student.className && student.section
    ? (student.className.includes('-') ? student.className : `${student.className}-${student.section}`)
    : (student.className || 'Class 3-A');

  return (
    <>
      <Modal isOpen={isOpen} onClose={onClose} title="Student Information" maxWidth="640px">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Header Card */}
          <div style={{
            backgroundColor: '#F8FAFC',
            borderRadius: 16,
            padding: 16,
            border: '1px solid #E2E8F0',
            display: 'flex',
            alignItems: 'center',
            gap: 16
          }}>
            <img
              src={student.photo || 'https://images.unsplash.com/photo-1544717305-2782549b5136?w=150'}
              alt={student.name}
              style={{
                width: 72,
                height: 72,
                borderRadius: '50%',
                objectFit: 'cover',
                border: '3px solid #1769E0',
                boxShadow: '0 4px 10px rgba(0,0,0,0.1)'
              }}
            />

            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <h3 style={{ fontSize: 18, fontWeight: 800, color: '#172033', margin: 0 }}>
                  {student.name}
                </h3>

                <span style={{
                  fontSize: 11,
                  fontWeight: 800,
                  padding: '3px 10px',
                  borderRadius: 12,
                  backgroundColor: (student.status || 'Active') === 'Active' ? '#EAF8EF' : '#FEF2F2',
                  color: (student.status || 'Active') === 'Active' ? '#16A34A' : '#EF4444'
                }}>
                  {student.status || 'Active'}
                </span>
              </div>

              <div style={{ fontSize: 13, fontWeight: 700, color: '#1769E0', marginTop: 3 }}>
                {fullClassDisplay} • Roll No. {student.rollNo}
              </div>

              <div style={{ fontSize: 11, color: '#64748B', marginTop: 2 }}>
                Admission No: <strong>{student.admissionNo || 'AVM2026006'}</strong>
              </div>
            </div>
          </div>

          {/* Quick Stats Strip - Responsive 3 Columns for Employee, 4 Columns for Admin */}
          <div style={{ display: 'grid', gridTemplateColumns: isAdmin ? '1fr 1fr 1fr 1fr' : '1fr 1fr 1fr', gap: 8 }}>
            <div style={{ backgroundColor: '#EAF3FF', borderRadius: 12, padding: 10, textAlign: 'center' }}>
              <div style={{ fontSize: 10, color: '#1769E0', fontWeight: 700 }}>ATTENDANCE</div>
              <div style={{ fontSize: 16, fontWeight: 900, color: '#1769E0' }}>{attPercentage}%</div>
            </div>
            <div style={{ backgroundColor: '#F3E8FF', borderRadius: 12, padding: 10, textAlign: 'center' }}>
              <div style={{ fontSize: 10, color: '#7C3AED', fontWeight: 700 }}>HOMEWORK</div>
              <div style={{ fontSize: 16, fontWeight: 900, color: '#7C3AED' }}>{completedHw}/{totalHw}</div>
            </div>
            <div style={{ backgroundColor: '#FEF3C7', borderRadius: 12, padding: 10, textAlign: 'center' }}>
              <div style={{ fontSize: 10, color: '#D97706', fontWeight: 700 }}>RESULT</div>
              <div style={{ fontSize: 16, fontWeight: 900, color: '#D97706' }}>
                {studentResult?.percentage ? `${studentResult.percentage}%` : '84.6%'}
              </div>
            </div>
            {isAdmin && (
              <div style={{ backgroundColor: '#EAF8EF', borderRadius: 12, padding: 10, textAlign: 'center' }}>
                <div style={{ fontSize: 10, color: '#16A34A', fontWeight: 700 }}>FEE STATUS</div>
                <div style={{ fontSize: 12, fontWeight: 800, color: '#16A34A', marginTop: 4 }}>
                  {feeDetails?.pendingFee ? `₹${feeDetails.pendingFee} Due` : 'Clear'}
                </div>
              </div>
            )}
          </div>

          {/* Collapsible Section Cards */}

          {/* 1. Personal Information */}
          <div style={{ border: '1px solid #E2E8F0', borderRadius: 14, overflow: 'hidden' }}>
            <div
              onClick={() => toggleSection('personal')}
              style={{ padding: 14, backgroundColor: '#F8FAFC', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, fontWeight: 800, color: '#172033' }}>
                <User size={16} color="#1769E0" /> PERSONAL INFORMATION
              </div>
              {collapsedSections['personal'] ? <ChevronDown size={18} /> : <ChevronUp size={18} />}
            </div>

            {!collapsedSections['personal'] && (
              <div style={{ padding: 14, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, fontSize: 12 }}>
                <div><span style={{ color: '#64748B' }}>Full Name:</span> <strong>{student.name}</strong></div>
                <div><span style={{ color: '#64748B' }}>Admission No:</span> <strong>{student.admissionNo}</strong></div>
                <div><span style={{ color: '#64748B' }}>Roll Number:</span> <strong>{student.rollNo}</strong></div>
                <div><span style={{ color: '#64748B' }}>Class & Section:</span> <strong>{fullClassDisplay}</strong></div>
                <div><span style={{ color: '#64748B' }}>Date of Birth:</span> <strong>{student.dateOfBirth || student.dob || '14/05/2017'}</strong></div>
                <div><span style={{ color: '#64748B' }}>Gender:</span> <strong>{student.gender || 'Female'}</strong></div>
                <div><span style={{ color: '#64748B' }}>Blood Group:</span> <strong>{student.bloodGroup || 'O+'}</strong></div>
                <div><span style={{ color: '#64748B' }}>Category:</span> <strong>{student.category || 'General'}</strong></div>
                <div><span style={{ color: '#64748B' }}>Nationality:</span> <strong>{student.nationality || 'Indian'}</strong></div>
                <div><span style={{ color: '#64748B' }}>Mother Tongue:</span> <strong>{student.motherTongue || 'Hindi'}</strong></div>
                <div><span style={{ color: '#64748B' }}>Religion:</span> <strong>{student.religion || 'Hindu'}</strong></div>
                <div><span style={{ color: '#64748B' }}>Aadhaar No:</span> <strong>{student.aadhaar || 'XXXX-XXXX-8910'}</strong></div>
              </div>
            )}
          </div>

          {/* 2. Parent / Guardian Information */}
          <div style={{ border: '1px solid #E2E8F0', borderRadius: 14, overflow: 'hidden' }}>
            <div
              onClick={() => toggleSection('parents')}
              style={{ padding: 14, backgroundColor: '#F8FAFC', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, fontWeight: 800, color: '#172033' }}>
                <Phone size={16} color="#7C3AED" /> PARENT & GUARDIAN DETAILS
              </div>
              {collapsedSections['parents'] ? <ChevronDown size={18} /> : <ChevronUp size={18} />}
            </div>

            {!collapsedSections['parents'] && (
              <div style={{ padding: 14, display: 'flex', flexDirection: 'column', gap: 10, fontSize: 12 }}>
                <div style={{ backgroundColor: '#F8FAFC', padding: 10, borderRadius: 10, border: '1px solid #F1F5F9' }}>
                  <div style={{ fontWeight: 800, color: '#1769E0', marginBottom: 4 }}>Father's Details</div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
                    <div><span style={{ color: '#64748B' }}>Name:</span> <strong>{student.fatherName}</strong></div>
                    <div><span style={{ color: '#64748B' }}>Occupation:</span> <strong>{student.fatherOcc || 'Business / Private Service'}</strong></div>
                    <div style={{ gridColumn: 'span 2', display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
                      <span style={{ color: '#64748B' }}>Mobile:</span>
                      <a href={`tel:${student.phone}`} style={{ color: '#1769E0', fontWeight: 800, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 4 }}>
                        <Phone size={12} /> {student.phone}
                      </a>
                    </div>
                  </div>
                </div>

                <div style={{ backgroundColor: '#F8FAFC', padding: 10, borderRadius: 10, border: '1px solid #F1F5F9' }}>
                  <div style={{ fontWeight: 800, color: '#7C3AED', marginBottom: 4 }}>Mother's Details</div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
                    <div><span style={{ color: '#64748B' }}>Name:</span> <strong>{student.motherName || 'Sandhya Devi'}</strong></div>
                    <div><span style={{ color: '#64748B' }}>Occupation:</span> <strong>{student.motherOcc || 'Homemaker'}</strong></div>
                    {student.altPhone && (
                      <div style={{ gridColumn: 'span 2', display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
                        <span style={{ color: '#64748B' }}>Mobile:</span>
                        <a href={`tel:${student.altPhone}`} style={{ color: '#7C3AED', fontWeight: 800, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 4 }}>
                          <Phone size={12} /> {student.altPhone}
                        </a>
                      </div>
                    )}
                  </div>
                </div>

                {(student.emgName || student.emgPhone) && (
                  <div style={{ backgroundColor: '#FEF2F2', padding: 10, borderRadius: 10, border: '1px solid #FECACA' }}>
                    <div style={{ fontWeight: 800, color: '#EF4444', marginBottom: 4 }}>Emergency Contact</div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
                      <div><span style={{ color: '#64748B' }}>Name:</span> <strong>{student.emgName || student.fatherName}</strong></div>
                      <div><span style={{ color: '#64748B' }}>Relation:</span> <strong>{student.emgRelation || 'Father'}</strong></div>
                      <div style={{ gridColumn: 'span 2', marginTop: 2 }}>
                        <a href={`tel:${student.emgPhone || student.phone}`} style={{ color: '#EF4444', fontWeight: 800, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 4 }}>
                          <Phone size={12} /> {student.emgPhone || student.phone}
                        </a>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* 3. Address Information */}
          <div style={{ border: '1px solid #E2E8F0', borderRadius: 14, overflow: 'hidden' }}>
            <div
              onClick={() => toggleSection('address')}
              style={{ padding: 14, backgroundColor: '#F8FAFC', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, fontWeight: 800, color: '#172033' }}>
                <MapPin size={16} color="#16A34A" /> ADDRESS DETAILS
              </div>
              {collapsedSections['address'] ? <ChevronDown size={18} /> : <ChevronUp size={18} />}
            </div>

            {!collapsedSections['address'] && (
              <div style={{ padding: 14, display: 'flex', flexDirection: 'column', gap: 8, fontSize: 12 }}>
                <div>
                  <span style={{ color: '#64748B', display: 'block', marginBottom: 2 }}>Current Residential Address:</span>
                  <strong style={{ color: '#172033', lineHeight: 1.4 }}>{student.address || 'Main Road, Kajraili, Bhagalpur'}</strong>
                </div>

                <div style={{ borderTop: '1px dashed #E2E8F0', paddingTop: 8, marginTop: 4 }}>
                  <span style={{ color: '#64748B', display: 'block', marginBottom: 2 }}>Permanent Address:</span>
                  <strong style={{ color: '#475569' }}>
                    {student.permanentAddress || 'Same as current address'}
                  </strong>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginTop: 4, backgroundColor: '#F8FAFC', padding: 8, borderRadius: 8 }}>
                  <div><span style={{ color: '#64748B' }}>City:</span> <strong>{student.city || 'Bhagalpur'}</strong></div>
                  <div><span style={{ color: '#64748B' }}>State:</span> <strong>{student.state || 'Bihar'}</strong></div>
                  <div><span style={{ color: '#64748B' }}>PIN:</span> <strong>{student.pinCode || '812005'}</strong></div>
                </div>
              </div>
            )}
          </div>

          {/* 4. Academic Summary Card */}
          <div style={{ border: '1px solid #E2E8F0', borderRadius: 14, overflow: 'hidden' }}>
            <div
              onClick={() => toggleSection('academic')}
              style={{ padding: 14, backgroundColor: '#F8FAFC', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, fontWeight: 800, color: '#172033' }}>
                <BookOpen size={16} color="#D97706" /> ACADEMIC INFORMATION
              </div>
              {collapsedSections['academic'] ? <ChevronDown size={18} /> : <ChevronUp size={18} />}
            </div>

            {!collapsedSections['academic'] && (
              <div style={{ padding: 14, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, fontSize: 12 }}>
                <div><span style={{ color: '#64748B' }}>Academic Session:</span> <strong>2026-2027</strong></div>
                <div><span style={{ color: '#64748B' }}>Admission Date:</span> <strong>{student.admissionDate || '05/04/2024'}</strong></div>
                <div><span style={{ color: '#64748B' }}>Previous School:</span> <strong>{student.previousSchool || 'AVM Primary Wing'}</strong></div>
                <div><span style={{ color: '#64748B' }}>Previous Class:</span> <strong>{student.previousClass || 'Class 2'}</strong></div>
                <div><span style={{ color: '#64748B' }}>House / Group:</span> <strong>{student.houseGroup || 'Tagore House'}</strong></div>
                <div><span style={{ color: '#64748B' }}>Academic Status:</span> <strong style={{ color: '#16A34A' }}>{student.status || 'Active'}</strong></div>
              </div>
            )}
          </div>

          {/* 5. Attendance Summary Section */}
          <div style={{ border: '1px solid #DDD6FE', borderRadius: 14, padding: 14, backgroundColor: '#FFFFFF' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <div style={{ fontSize: 13, fontWeight: 800, color: '#172033', display: 'flex', alignItems: 'center', gap: 6 }}>
                <Calendar size={16} color="#1769E0" />
                Attendance Summary ({attPercentage}%)
              </div>

              <button
                type="button"
                onClick={() => setAttendanceHistoryOpen(true)}
                style={{ background: 'none', border: 'none', color: '#1769E0', fontSize: 12, fontWeight: 800, cursor: 'pointer', padding: 0 }}
              >
                View History →
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 8, backgroundColor: '#F8FAFC', padding: 10, borderRadius: 10, textAlign: 'center', fontSize: 11 }}>
              <div><span style={{ color: '#64748B' }}>Total Days</span><div style={{ fontWeight: 800, fontSize: 13, color: '#172033' }}>{totalDays}</div></div>
              <div><span style={{ color: '#16A34A' }}>Present</span><div style={{ fontWeight: 800, fontSize: 13, color: '#16A34A' }}>{presentDays}</div></div>
              <div><span style={{ color: '#EF4444' }}>Absent</span><div style={{ fontWeight: 800, fontSize: 13, color: '#EF4444' }}>{absentDays}</div></div>
              <div><span style={{ color: '#F59E0B' }}>Leave</span><div style={{ fontWeight: 800, fontSize: 13, color: '#F59E0B' }}>{leaveDays}</div></div>
            </div>
          </div>

          {/* 6. Homework Summary Section */}
          <div style={{ border: '1px solid #E2E8F0', borderRadius: 14, padding: 14, backgroundColor: '#FFFFFF' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <div style={{ fontSize: 13, fontWeight: 800, color: '#172033', display: 'flex', alignItems: 'center', gap: 6 }}>
                <BookOpen size={16} color="#7C3AED" />
                Homework ({completedHw}/{totalHw} Completed)
              </div>

              <button
                type="button"
                onClick={() => setHomeworkModalOpen(true)}
                style={{ background: 'none', border: 'none', color: '#7C3AED', fontSize: 12, fontWeight: 800, cursor: 'pointer', padding: 0 }}
              >
                View Homework →
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, backgroundColor: '#F8FAFC', padding: 10, borderRadius: 10, textAlign: 'center', fontSize: 11 }}>
              <div><span style={{ color: '#64748B' }}>Total Assigned</span><div style={{ fontWeight: 800, fontSize: 13, color: '#172033' }}>{totalHw}</div></div>
              <div><span style={{ color: '#16A34A' }}>Completed</span><div style={{ fontWeight: 800, fontSize: 13, color: '#16A34A' }}>{completedHw}</div></div>
              <div><span style={{ color: '#EF4444' }}>Pending</span><div style={{ fontWeight: 800, fontSize: 13, color: '#EF4444' }}>{pendingHw}</div></div>
            </div>
          </div>

          {/* 7. Exam & Results Summary Section */}
          <div style={{ border: '1px solid #E2E8F0', borderRadius: 14, padding: 14, backgroundColor: '#FFFFFF' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <div style={{ fontSize: 13, fontWeight: 800, color: '#172033', display: 'flex', alignItems: 'center', gap: 6 }}>
                <Award size={16} color="#D97706" />
                Latest Examination Result
              </div>

              <button
                type="button"
                onClick={() => setResultModalOpen(true)}
                style={{ background: 'none', border: 'none', color: '#D97706', fontSize: 12, fontWeight: 800, cursor: 'pointer', padding: 0 }}
              >
                View Results →
              </button>
            </div>

            <div style={{ backgroundColor: '#FEF3C7', padding: 12, borderRadius: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: 13, fontWeight: 800, color: '#92400E' }}>
                  {studentResult?.examName || 'Half Yearly Examination 2026'}
                </div>
                <div style={{ fontSize: 11, color: '#B45309' }}>
                  Marks: {studentResult?.totalObtained || 423} / {studentResult?.totalMax || 500} • Grade: {studentResult?.grade || 'A'}
                </div>
              </div>
              <span style={{ fontSize: 12, fontWeight: 900, backgroundColor: '#16A34A', color: '#FFFFFF', padding: '4px 10px', borderRadius: 12 }}>
                PASS
              </span>
            </div>
          </div>

          {/* 8. Fee Summary Section (STRICTLY HIDDEN FOR EMPLOYEE, VISIBLE FOR ADMIN ONLY) */}
          {isAdmin && (
            <div style={{ border: '1px solid #E2E8F0', borderRadius: 14, padding: 14, backgroundColor: '#FFFFFF' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <div style={{ fontSize: 13, fontWeight: 800, color: '#172033', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <DollarSign size={16} color="#16A34A" />
                  Fee Details Summary
                </div>

                <button
                  type="button"
                  onClick={() => setFeeModalOpen(true)}
                  style={{ background: 'none', border: 'none', color: '#16A34A', fontSize: 12, fontWeight: 800, cursor: 'pointer', padding: 0 }}
                >
                  View Fee Details →
                </button>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, backgroundColor: '#F8FAFC', padding: 10, borderRadius: 10, textAlign: 'center', fontSize: 11 }}>
                <div><span style={{ color: '#64748B' }}>Total Fee</span><div style={{ fontWeight: 800, fontSize: 13, color: '#172033' }}>₹{feeDetails?.totalFee || student.totalFee || 10000}</div></div>
                <div><span style={{ color: '#16A34A' }}>Paid Amount</span><div style={{ fontWeight: 800, fontSize: 13, color: '#16A34A' }}>₹{feeDetails?.paidFee || student.paidFee || 7500}</div></div>
                <div><span style={{ color: '#EF4444' }}>Pending</span><div style={{ fontWeight: 800, fontSize: 13, color: '#EF4444' }}>₹{feeDetails?.pendingFee || student.pendingFee || 2500}</div></div>
              </div>
            </div>
          )}

          {/* 9. Transport Information */}
          <div style={{ border: '1px solid #E2E8F0', borderRadius: 14, padding: 14, backgroundColor: '#FFFFFF' }}>
            <div style={{ fontSize: 13, fontWeight: 800, color: '#172033', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
              <Bus size={16} color="#0284C7" />
              Transport Details
            </div>
            {hasTransport ? (
              <div style={{ fontSize: 12, color: '#475569', display: 'flex', flexDirection: 'column', gap: 6 }}>
                <div style={{ backgroundColor: '#F0F9FF', padding: 10, borderRadius: 10, border: '1px solid #BAE6FD', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ color: '#0369A1', fontWeight: 700 }}>Bus Number:</span>
                  <strong style={{ fontSize: 14, color: '#0284C7', fontWeight: 900 }}>{busNo}</strong>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginTop: 4 }}>
                  <div><span style={{ color: '#64748B' }}>Route:</span> <strong>{route}</strong></div>
                  <div><span style={{ color: '#64748B' }}>Pickup Point:</span> <strong>{stop}</strong></div>
                  <div><span style={{ color: '#64748B' }}>Drop Point:</span> <strong>{dropPoint}</strong></div>
                  <div><span style={{ color: '#64748B' }}>Driver:</span> <strong>{driverName}</strong></div>
                  <div style={{ gridColumn: 'span 2', display: 'flex', alignItems: 'center', gap: 6, marginTop: 2 }}>
                    <span style={{ color: '#64748B' }}>Driver Contact:</span>
                    <a href={`tel:${driverPhone}`} style={{ color: '#0284C7', fontWeight: 800, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 4 }}>
                      <Phone size={12} /> {driverPhone}
                    </a>
                  </div>
                </div>
              </div>
            ) : (
              <div style={{ fontSize: 12, color: '#64748B', fontStyle: 'italic', backgroundColor: '#F8FAFC', padding: 10, borderRadius: 8 }}>
                Transport not assigned (Self / Private Transport)
              </div>
            )}
          </div>

          {/* Action Footer Buttons */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, borderTop: '1px solid #F1F5F9', paddingTop: 14, marginTop: 4 }}>
            <button
              type="button"
              className="avm-btn-secondary"
              style={{ flex: 1, fontSize: 12, padding: '8px 12px' }}
              onClick={() => setAttendanceHistoryOpen(true)}
            >
              View Attendance
            </button>

            <button
              type="button"
              className="avm-btn-secondary"
              style={{ flex: 1, fontSize: 12, padding: '8px 12px' }}
              onClick={() => setHomeworkModalOpen(true)}
            >
              View Homework
            </button>

            <button
              type="button"
              className="avm-btn-secondary"
              style={{ flex: 1, fontSize: 12, padding: '8px 12px' }}
              onClick={() => setResultModalOpen(true)}
            >
              View Results
            </button>

            {isAdmin && (
              <>
                <button
                  type="button"
                  className="avm-btn-secondary"
                  style={{ flex: 1, fontSize: 12, padding: '8px 12px', color: '#16A34A', borderColor: '#BBF7D0' }}
                  onClick={() => setFeeModalOpen(true)}
                >
                  View Fees
                </button>
                <button
                  type="button"
                  className="avm-btn-primary"
                  style={{ flex: 1.2, backgroundColor: '#7C3AED', fontSize: 12, padding: '8px 12px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}
                  onClick={() => setEditModalOpen(true)}
                >
                  <Edit3 size={14} /> Edit Student
                </button>
              </>
            )}
          </div>
        </div>
      </Modal>

      {/* --- SUB-MODAL 1: ATTENDANCE HISTORY --- */}
      {attendanceHistoryOpen && (
        <Modal isOpen={attendanceHistoryOpen} onClose={() => setAttendanceHistoryOpen(false)} title={`Attendance History - ${student.name}`}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#F8FAFC', padding: 12, borderRadius: 10 }}>
              <div style={{ fontSize: 13, fontWeight: 800, color: '#172033' }}>Total Days: {totalDays}</div>
              <div style={{ fontSize: 13, fontWeight: 800, color: '#16A34A' }}>Attendance: {attPercentage}%</div>
            </div>

            {attendanceRecords.length === 0 ? (
              <div style={{ textAlign: 'center', padding: 20, color: '#64748B', fontSize: 12 }}>
                No attendance records logged yet for current session.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: '50vh', overflowY: 'auto' }}>
                {attendanceRecords.map((r, i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', border: '1px solid #E2E8F0', borderRadius: 10 }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: '#172033' }}>{r.date}</div>
                    <span style={{
                      fontSize: 11,
                      fontWeight: 800,
                      padding: '2px 8px',
                      borderRadius: 10,
                      backgroundColor: (r.status || '').toLowerCase() === 'present' ? '#EAF8EF' : (r.status || '').toLowerCase() === 'absent' ? '#FEF2F2' : '#FFFBEB',
                      color: (r.status || '').toLowerCase() === 'present' ? '#16A34A' : (r.status || '').toLowerCase() === 'absent' ? '#EF4444' : '#D97706'
                    }}>
                      {r.status}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </Modal>
      )}

      {/* --- SUB-MODAL 2: HOMEWORK LIST --- */}
      {homeworkModalOpen && (
        <Modal isOpen={homeworkModalOpen} onClose={() => setHomeworkModalOpen(false)} title={`Class Homework - ${fullClassDisplay}`}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, maxHeight: '60vh', overflowY: 'auto' }}>
            {studentHomeworks.length === 0 ? (
              <div style={{ textAlign: 'center', padding: 20, color: '#64748B', fontSize: 12 }}>
                No homework assignments for {fullClassDisplay}.
              </div>
            ) : (
              studentHomeworks.map((hw) => (
                <div key={hw.id} style={{ border: '1px solid #E2E8F0', borderRadius: 12, padding: 12, backgroundColor: '#FFFFFF' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <span style={{ fontSize: 11, fontWeight: 800, color: '#7C3AED', backgroundColor: '#F3E8FF', padding: '2px 8px', borderRadius: 6 }}>
                      {hw.subject}
                    </span>
                    <span style={{ fontSize: 11, color: '#EF4444', fontWeight: 700 }}>Due: {hw.dueDate}</span>
                  </div>
                  <h4 style={{ fontSize: 14, fontWeight: 700, color: '#172033', margin: '4px 0' }}>{hw.title}</h4>
                  <p style={{ fontSize: 12, color: '#475569', margin: '0 0 6px 0' }}>{hw.instructions || hw.description}</p>
                </div>
              ))
            )}
          </div>
        </Modal>
      )}

      {/* --- SUB-MODAL 3: EXAMINATION RESULTS --- */}
      {resultModalOpen && (
        <Modal isOpen={resultModalOpen} onClose={() => setResultModalOpen(false)} title={`Exam Results - ${student.name}`}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ backgroundColor: '#FEF3C7', padding: 12, borderRadius: 12, textAlign: 'center' }}>
              <div style={{ fontSize: 14, fontWeight: 900, color: '#92400E' }}>
                {studentResult?.examName || 'Half Yearly Examination 2026'}
              </div>
              <div style={{ fontSize: 18, fontWeight: 900, color: '#16A34A', marginTop: 4 }}>
                {studentResult?.totalObtained || 423} / {studentResult?.totalMax || 500} ({studentResult?.percentage || 84.6}%)
              </div>
            </div>

            {studentResult?.marks && studentResult.marks.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {studentResult.marks.map((m, idx) => (
                  <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 12px', border: '1px solid #E2E8F0', borderRadius: 8, fontSize: 12 }}>
                    <span>{m.subject}</span>
                    <strong>{m.marksObtained} / {m.maxMarks} ({m.grade})</strong>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 12px', border: '1px solid #E2E8F0', borderRadius: 8, fontSize: 12 }}><span>Mathematics</span><strong>88 / 100</strong></div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 12px', border: '1px solid #E2E8F0', borderRadius: 8, fontSize: 12 }}><span>Science</span><strong>85 / 100</strong></div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 12px', border: '1px solid #E2E8F0', borderRadius: 8, fontSize: 12 }}><span>English</span><strong>84 / 100</strong></div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 12px', border: '1px solid #E2E8F0', borderRadius: 8, fontSize: 12 }}><span>Hindi</span><strong>78 / 100</strong></div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 12px', border: '1px solid #E2E8F0', borderRadius: 8, fontSize: 12 }}><span>Social Science</span><strong>88 / 100</strong></div>
              </div>
            )}
          </div>
        </Modal>
      )}

      {/* --- SUB-MODAL 4: FEE DETAILS (STRICTLY ADMIN ONLY) --- */}
      {isAdmin && feeModalOpen && (
        <Modal isOpen={feeModalOpen} onClose={() => setFeeModalOpen(false)} title={`Fee Details - ${student.name}`}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ backgroundColor: '#F8FAFC', padding: 14, borderRadius: 12, border: '1px solid #E2E8F0', display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, textAlign: 'center', fontSize: 12 }}>
              <div><span style={{ color: '#64748B' }}>Total Fee</span><div style={{ fontWeight: 800, fontSize: 14 }}>₹{feeDetails?.totalFee || student.totalFee || 10000}</div></div>
              <div><span style={{ color: '#16A34A' }}>Paid</span><div style={{ fontWeight: 800, fontSize: 14, color: '#16A34A' }}>₹{feeDetails?.paidFee || student.paidFee || 7500}</div></div>
              <div><span style={{ color: '#EF4444' }}>Pending</span><div style={{ fontWeight: 800, fontSize: 14, color: '#EF4444' }}>₹{feeDetails?.pendingFee || student.pendingFee || 2500}</div></div>
            </div>
          </div>
        </Modal>
      )}
        </Modal>
      )}

      {/* --- ADMIN EDIT STUDENT MODAL --- */}
      {editModalOpen && (
        <Modal isOpen={editModalOpen} onClose={() => setEditModalOpen(false)} title={`Edit Student - ${student.name}`}>
          <form onSubmit={handleSaveEdit} style={{ display: 'flex', flexDirection: 'column', gap: 12, maxHeight: '65vh', overflowY: 'auto' }}>
            <div>
              <label style={{ fontSize: 11, fontWeight: 700, color: '#475569' }}>Student Full Name</label>
              <input
                type="text"
                className="avm-input"
                value={editForm.name || ''}
                onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                required
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <div>
                <label style={{ fontSize: 11, fontWeight: 700, color: '#475569' }}>Roll No</label>
                <input
                  type="number"
                  className="avm-input"
                  value={editForm.rollNo || ''}
                  onChange={(e) => setEditForm({ ...editForm, rollNo: parseInt(e.target.value) || 0 })}
                  required
                />
              </div>
              <div>
                <label style={{ fontSize: 11, fontWeight: 700, color: '#475569' }}>Father Name</label>
                <input
                  type="text"
                  className="avm-input"
                  value={editForm.fatherName || ''}
                  onChange={(e) => setEditForm({ ...editForm, fatherName: e.target.value })}
                />
              </div>
            </div>

            <div>
              <label style={{ fontSize: 11, fontWeight: 700, color: '#475569' }}>Guardian Phone</label>
              <input
                type="text"
                className="avm-input"
                value={editForm.phone || ''}
                onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
              />
            </div>

            <div>
              <label style={{ fontSize: 11, fontWeight: 700, color: '#475569' }}>Address</label>
              <textarea
                className="avm-input"
                rows={2}
                value={editForm.address || ''}
                onChange={(e) => setEditForm({ ...editForm, address: e.target.value })}
              />
            </div>

            <div style={{ display: 'flex', gap: 10, marginTop: 10 }}>
              <button type="button" className="avm-btn-secondary" style={{ flex: 1 }} onClick={() => setEditModalOpen(false)}>
                Cancel
              </button>
              <button type="submit" className="avm-btn-primary" style={{ flex: 1, backgroundColor: '#7C3AED' }}>
                Save Profile Changes
              </button>
            </div>
          </form>
        </Modal>
      )}
    </>
  );
};
