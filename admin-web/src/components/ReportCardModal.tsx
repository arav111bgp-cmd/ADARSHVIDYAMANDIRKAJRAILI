import React, { useState, useEffect } from 'react';
import { Modal } from './Modal';
import { Student, StudentResult } from '../types';
import { mockSchoolInfo } from '../mock/mockData';
import { classService } from '../services/classService';
import { attendanceService } from '../services/attendanceService';
import { demoDataStore } from '../services/demoDataStore';
import { Printer, Award, CheckCircle2, Star, Edit3, Save, Check } from 'lucide-react';

interface ReportCardModalProps {
  isOpen: boolean;
  onClose: () => void;
  student: Student;
  result: StudentResult;
}

export const ReportCardModal: React.FC<ReportCardModalProps> = ({
  isOpen,
  onClose,
  student,
  result
}) => {
  const [attendanceStats, setAttendanceStats] = useState<{ totalDays: number; present: number; absent: number; pct: number } | null>(null);
  const [teacherRemarks, setTeacherRemarks] = useState<string>(result.teacherRemarks || 'Excellent overall academic performance. Keep up the hard work!');
  const [isEditingRemarks, setIsEditingRemarks] = useState<boolean>(false);
  const [savedSuccess, setSavedSuccess] = useState<boolean>(false);

  const isEarlyYears = result.isEarlyYears || classService.isEarlyYears(student.className);

  useEffect(() => {
    setTeacherRemarks(result.teacherRemarks || 'Excellent overall academic performance. Keep up the hard work!');
    let isMounted = true;

    // Load dynamic attendance records for this student
    attendanceService.getAttendance(student.id).then((records) => {
      if (!isMounted) return;
      if (records && records.length > 0) {
        const present = records.filter((r) => (r.status || '').toLowerCase() === 'present').length;
        const absent = records.filter((r) => (r.status || '').toLowerCase() === 'absent').length;
        const totalDays = records.length;
        const pct = Math.round((present / totalDays) * 100 * 10) / 10;
        setAttendanceStats({ totalDays, present, absent, pct });
      } else {
        // Fallback: Check central demoDataStore attendance array
        const db = demoDataStore.getDB();
        const dbRecs = (db.attendance || []).filter((a: any) => a.studentId === student.id || a.studentId === student.admissionNo);
        if (dbRecs && dbRecs.length > 0) {
          const present = dbRecs.filter((r: any) => (r.status || '').toLowerCase() === 'present').length;
          const absent = dbRecs.filter((r: any) => (r.status || '').toLowerCase() === 'absent').length;
          const totalDays = dbRecs.length;
          const pct = Math.round((present / totalDays) * 100 * 10) / 10;
          setAttendanceStats({ totalDays, present, absent, pct });
        } else {
          setAttendanceStats(null);
        }
      }
    });

    return () => { isMounted = false; };
  }, [student.id, result]);

  const handlePrint = () => {
    window.print();
  };

  const handleSaveRemarks = () => {
    setIsEditingRemarks(false);
    result.teacherRemarks = teacherRemarks;
    const db = demoDataStore.getDB();
    db.marks = db.marks || [];
    db.marks.forEach((m: any) => {
      if (m.studentId === student.id && (m.examId === result.examName || m.examName === result.examName)) {
        m.teacherRemarks = teacherRemarks;
      }
    });
    demoDataStore.saveDB(db);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2500);
  };

  // Dynamically calculate summary metrics from result marks
  const markItems = result.marks || [];
  const totalObtained = result.totalObtained ?? markItems.reduce((acc, item) => acc + item.marksObtained, 0);
  const totalMax = result.totalMax ?? markItems.reduce((acc, item) => acc + item.maxMarks, 0);
  const percentage = result.percentage ?? (totalMax > 0 ? Math.round((totalObtained / totalMax) * 100 * 10) / 10 : 0);

  const calculateGrade = (pct: number): string => {
    if (pct >= 90) return 'A+';
    if (pct >= 80) return 'A';
    if (pct >= 70) return 'B+';
    if (pct >= 60) return 'B';
    if (pct >= 50) return 'C';
    if (pct >= 40) return 'D';
    return 'E';
  };

  const overallGrade = result.grade || calculateGrade(percentage);
  const isPass = isEarlyYears ? true : (percentage >= 40 && markItems.every((item) => (item.maxMarks > 0 ? (item.marksObtained / item.maxMarks) >= 0.4 : true)));
  const formattedClass = classService.formatClassDisplay(student.className, student.section);
  const sessionName = result.academicSessionId || '2026–27';

  // Co-curricular Assessment items for Early Years
  const coCurricularItems = [
    { activity: 'Communication & Expression', rating: 'Excellent' },
    { activity: 'Social & Emotional Behaviour', rating: 'Very Good' },
    { activity: 'Discipline & Cleanliness', rating: 'Excellent' },
    { activity: 'Creativity & Arts', rating: 'Very Good' },
    { activity: 'Physical Activity & Health', rating: 'Good' },
    { activity: 'Classroom Participation', rating: 'Excellent' }
  ];

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={isEarlyYears ? "Early Years Evaluation Report" : "Official Academic Report Card"} maxWidth="800px">
      {/* Inject Print-Specific CSS */}
      <style>{`
        @media print {
          @page {
            size: A4 portrait;
            margin: 6mm;
          }
          html, body {
            background: #ffffff !important;
            margin: 0 !important;
            padding: 0 !important;
            width: 100% !important;
            height: auto !important;
            overflow: visible !important;
          }
          body * {
            visibility: hidden !important;
          }
          .report-card-a4-sheet, .report-card-a4-sheet * {
            visibility: visible !important;
          }
          .report-card-a4-sheet {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            max-width: 100% !important;
            margin: 0 !important;
            padding: 8mm !important;
            box-shadow: none !important;
            border: 2px solid #0F172A !important;
            background: #ffffff !important;
            page-break-inside: avoid !important;
          }
          .no-print {
            display: none !important;
          }
        }
      `}</style>

      {/* Printable A4 Document Sheet */}
      <div className="printable-document">
        <div
          className="report-card-a4-sheet"
          style={{
            border: '2px solid #0F172A',
            borderRadius: 8,
            padding: '24px 28px',
            backgroundColor: '#FFFFFF',
            maxWidth: '100%',
            margin: '0 auto',
            color: '#0F172A',
            fontFamily: "'Inter', sans-serif",
            boxSizing: 'border-box'
          }}
        >
          {/* 1. Official School Header */}
          <div
            style={{
              textAlign: 'center',
              borderBottom: '2px solid #0F172A',
              paddingBottom: 12,
              marginBottom: 14,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 6 }}>
              {/* Emblem Badge */}
              <div
                style={{
                  width: 50,
                  height: 50,
                  borderRadius: 12,
                  backgroundColor: '#1769E0',
                  color: '#FFFFFF',
                  fontWeight: 900,
                  fontSize: 20,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 4px 10px rgba(23,105,224,0.3)',
                  border: '2px solid #0F172A'
                }}
              >
                AVM
              </div>
              <div style={{ textAlign: 'left' }}>
                <h1 style={{ fontSize: 24, fontWeight: 900, color: '#0F172A', margin: 0, letterSpacing: '0.5px', textTransform: 'uppercase' }}>
                  {mockSchoolInfo.name}
                </h1>
                <div style={{ fontSize: 11, fontWeight: 800, color: '#1769E0', letterSpacing: '0.8px', textTransform: 'uppercase' }}>
                  KAJRAILI, BHAGALPUR, BIHAR • AFFILIATED TO CBSE
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 4 }}>
              <span
                style={{
                  backgroundColor: '#0F172A',
                  color: '#FFFFFF',
                  fontSize: 12,
                  fontWeight: 800,
                  padding: '3px 14px',
                  borderRadius: 4,
                  letterSpacing: '0.5px'
                }}
              >
                OFFICIAL ACADEMIC REPORT CARD
              </span>
              <span style={{ fontSize: 12, fontWeight: 800, color: '#1769E0' }}>
                Academic Session: {sessionName}
              </span>
              <span style={{ fontSize: 12, fontWeight: 800, color: '#475569' }}>
                • Exam: {result.examName}
              </span>
            </div>
          </div>

          {/* 2. Student Information Section */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '84px 1fr',
              gap: 14,
              backgroundColor: '#F8FAFC',
              border: '1px solid #CBD5E1',
              borderRadius: 8,
              padding: 12,
              marginBottom: 14
            }}
          >
            <img
              src={student.photo || 'https://images.unsplash.com/photo-1544717305-2782549b5136?w=150'}
              alt={student.name}
              style={{
                width: 84,
                height: 96,
                borderRadius: 6,
                objectFit: 'cover',
                border: '2px solid #1769E0'
              }}
            />
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '6px 12px', fontSize: 12 }}>
              <div>
                <span style={{ color: '#64748B', fontSize: 11, display: 'block' }}>Student Name:</span>
                <strong style={{ color: '#0F172A', fontSize: 13 }}>{student.name}</strong>
              </div>
              <div>
                <span style={{ color: '#64748B', fontSize: 11, display: 'block' }}>Admission No.:</span>
                <strong style={{ color: '#1769E0', fontSize: 13 }}>{student.admissionNo}</strong>
              </div>
              <div>
                <span style={{ color: '#64748B', fontSize: 11, display: 'block' }}>Roll Number:</span>
                <strong style={{ color: '#0F172A' }}>{student.rollNo || '-'}</strong>
              </div>
              <div>
                <span style={{ color: '#64748B', fontSize: 11, display: 'block' }}>Class & Section:</span>
                <strong style={{ color: '#0F172A' }}>{formattedClass}</strong>
              </div>
              <div>
                <span style={{ color: '#64748B', fontSize: 11, display: 'block' }}>Date of Birth:</span>
                <strong style={{ color: '#0F172A' }}>{student.dob || '12-04-2016'}</strong>
              </div>
              <div>
                <span style={{ color: '#64748B', fontSize: 11, display: 'block' }}>Academic Session:</span>
                <strong style={{ color: '#1769E0' }}>{sessionName}</strong>
              </div>
              <div>
                <span style={{ color: '#64748B', fontSize: 11, display: 'block' }}>Father's Name:</span>
                <strong style={{ color: '#0F172A' }}>{student.fatherName || 'Rajesh Kumar'}</strong>
              </div>
              <div>
                <span style={{ color: '#64748B', fontSize: 11, display: 'block' }}>Mother's Name:</span>
                <strong style={{ color: '#0F172A' }}>{student.motherName || 'Sunita Devi'}</strong>
              </div>
              <div>
                <span style={{ color: '#64748B', fontSize: 11, display: 'block' }}>Examination:</span>
                <strong style={{ color: '#0F172A' }}>{result.examName}</strong>
              </div>
            </div>
          </div>

          {/* 3. Scholastic Performance Table / Early Years Assessment */}
          {!isEarlyYears ? (
            <div style={{ marginBottom: 14 }}>
              <div style={{ fontSize: 13, fontWeight: 900, color: '#1769E0', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                SCHOLASTIC PERFORMANCE
              </div>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                <thead>
                  <tr style={{ backgroundColor: '#0F172A', color: '#FFFFFF', textAlign: 'left' }}>
                    <th style={{ padding: '8px 10px', width: '45px', textAlign: 'center' }}>S.No.</th>
                    <th style={{ padding: '8px 10px' }}>Subject</th>
                    <th style={{ padding: '8px 10px', textAlign: 'center', width: '110px' }}>Maximum Marks</th>
                    <th style={{ padding: '8px 10px', textAlign: 'center', width: '110px' }}>Marks Obtained</th>
                    <th style={{ padding: '8px 10px', textAlign: 'center', width: '90px' }}>Percentage</th>
                    <th style={{ padding: '8px 10px', textAlign: 'center', width: '80px' }}>Grade</th>
                  </tr>
                </thead>
                <tbody>
                  {markItems.map((item, idx) => {
                    const pct = item.maxMarks > 0 ? Math.round((item.marksObtained / item.maxMarks) * 100 * 10) / 10 : 0;
                    const itemGrade = item.grade || calculateGrade(pct);

                    return (
                      <tr key={idx} style={{ borderBottom: '1px solid #E2E8F0', backgroundColor: idx % 2 === 0 ? '#FFFFFF' : '#F8FAFC' }}>
                        <td style={{ padding: '7px 10px', textAlign: 'center', color: '#64748B', fontWeight: 600 }}>{idx + 1}</td>
                        <td style={{ padding: '7px 10px', fontWeight: 800, color: '#0F172A' }}>{item.subject}</td>
                        <td style={{ padding: '7px 10px', textAlign: 'center', color: '#64748B' }}>{item.maxMarks}</td>
                        <td style={{ padding: '7px 10px', textAlign: 'center', fontWeight: 900, color: '#16A34A' }}>{item.marksObtained}</td>
                        <td style={{ padding: '7px 10px', textAlign: 'center', fontWeight: 700, color: '#1E40AF' }}>{pct}%</td>
                        <td style={{ padding: '7px 10px', textAlign: 'center' }}>
                          <span style={{ backgroundColor: '#EFF6FF', color: '#1D4ED8', fontWeight: 900, padding: '2px 8px', borderRadius: 4, fontSize: 11 }}>
                            {itemGrade}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                  {/* Total & Overall Row */}
                  <tr style={{ backgroundColor: '#EFF6FF', borderTop: '2px solid #1769E0', fontWeight: 900 }}>
                    <td colSpan={2} style={{ padding: '9px 10px', color: '#1E40AF', fontSize: 13 }}>TOTAL / OVERALL SUMMARY</td>
                    <td style={{ padding: '9px 10px', textAlign: 'center', color: '#64748B', fontSize: 13 }}>{totalMax}</td>
                    <td style={{ padding: '9px 10px', textAlign: 'center', color: '#16A34A', fontSize: 14 }}>{totalObtained}</td>
                    <td style={{ padding: '9px 10px', textAlign: 'center', color: '#1E40AF', fontSize: 13 }}>{percentage}%</td>
                    <td style={{ padding: '9px 10px', textAlign: 'center' }}>
                      <span style={{ backgroundColor: '#1769E0', color: '#FFFFFF', padding: '3px 10px', borderRadius: 4, fontSize: 12 }}>
                        {overallGrade}
                      </span>
                    </td>
                  </tr>
                </tbody>
              </table>

              {/* Grading Key Footer Bar */}
              <div style={{ backgroundColor: '#F1F5F9', border: '1px solid #CBD5E1', borderRadius: '0 0 6px 6px', padding: '4px 10px', fontSize: 10, color: '#475569', display: 'flex', justifyContent: 'space-between', marginTop: 2 }}>
                <span><strong>GRADING SCALE:</strong> A+ (90–100%) • A (80–89%) • B+ (70–79%) • B (60–69%) • C (50–59%) • D (40–49%) • E (&lt;40%)</span>
                <span>Passing Criteria: Min 40% per subject</span>
              </div>
            </div>
          ) : (
            /* Early Years Evaluation Table */
            <div style={{ marginBottom: 14 }}>
              <div style={{ fontSize: 13, fontWeight: 900, color: '#1769E0', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                EARLY YEARS DEVELOPMENTAL & SKILL ASSESSMENT
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {result.skillsEvaluation?.map((sk, idx) => (
                  <div key={idx} style={{ backgroundColor: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 6, padding: '8px 12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ fontWeight: 800, color: '#0F172A', fontSize: 12 }}>{sk.category}</div>
                      <div style={{ fontSize: 11, color: '#64748B', marginTop: 1 }}>{sk.remark}</div>
                    </div>
                    <span style={{ backgroundColor: sk.rating === 'Excellent' ? '#DCFCE7' : '#EFF6FF', color: sk.rating === 'Excellent' ? '#15803D' : '#1D4ED8', fontWeight: 900, fontSize: 11, padding: '3px 10px', borderRadius: 12 }}>
                      {sk.rating}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 4. Overall Performance Summary & Result Status Banner */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10, marginBottom: 14 }}>
            <div style={{ backgroundColor: '#F8FAFC', border: '1px solid #E2E8F0', padding: 10, borderRadius: 6, textAlign: 'center' }}>
              <span style={{ fontSize: 10, color: '#64748B', display: 'block', textTransform: 'uppercase', fontWeight: 700 }}>Total Marks</span>
              <strong style={{ fontSize: 16, color: '#0F172A' }}>{totalObtained} / {totalMax}</strong>
            </div>
            <div style={{ backgroundColor: '#F8FAFC', border: '1px solid #E2E8F0', padding: 10, borderRadius: 6, textAlign: 'center' }}>
              <span style={{ fontSize: 10, color: '#64748B', display: 'block', textTransform: 'uppercase', fontWeight: 700 }}>Percentage</span>
              <strong style={{ fontSize: 16, color: '#1769E0' }}>{percentage}%</strong>
            </div>
            <div style={{ backgroundColor: '#F8FAFC', border: '1px solid #E2E8F0', padding: 10, borderRadius: 6, textAlign: 'center' }}>
              <span style={{ fontSize: 10, color: '#64748B', display: 'block', textTransform: 'uppercase', fontWeight: 700 }}>Overall Grade</span>
              <strong style={{ fontSize: 16, color: '#16A34A' }}>{overallGrade}</strong>
            </div>
            <div style={{ backgroundColor: isEarlyYears ? '#EFF6FF' : isPass ? '#DCFCE7' : '#FEE2E2', border: `1px solid ${isEarlyYears ? '#BFDBFE' : isPass ? '#86EFAC' : '#FCA5A5'}`, padding: 10, borderRadius: 6, textAlign: 'center' }}>
              <span style={{ fontSize: 10, color: isEarlyYears ? '#1E40AF' : isPass ? '#15803D' : '#991B1B', display: 'block', textTransform: 'uppercase', fontWeight: 800 }}>Result Status</span>
              <strong style={{ fontSize: 14, color: isEarlyYears ? '#1D4ED8' : isPass ? '#15803D' : '#DC2626' }}>
                {isEarlyYears ? 'PROGRESS EVALUATED' : isPass ? 'PASSED' : 'FAILED'}
              </strong>
            </div>
          </div>

          {/* 5. Co-Scholastic & Personal Development Section (Optional for Nursery/LKG/UKG) */}
          {isEarlyYears && (
            <div style={{ marginBottom: 14 }}>
              <div style={{ fontSize: 12, fontWeight: 900, color: '#1769E0', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                CO-CURRICULAR & PERSONAL DEVELOPMENT
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, fontSize: 11 }}>
                {coCurricularItems.map((c, i) => (
                  <div key={i} style={{ backgroundColor: '#F8FAFC', border: '1px solid #E2E8F0', padding: '6px 10px', borderRadius: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ color: '#475569', fontWeight: 600 }}>{c.activity}:</span>
                    <strong style={{ color: '#16A34A' }}>{c.rating}</strong>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 6. Attendance Summary Section */}
          <div style={{ backgroundColor: '#F8FAFC', border: '1px solid #CBD5E1', borderRadius: 6, padding: '8px 12px', marginBottom: 14, fontSize: 11 }}>
            <div style={{ fontWeight: 800, color: '#1769E0', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              ATTENDANCE SUMMARY
            </div>
            {attendanceStats ? (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8, color: '#0F172A' }}>
                <div>Total Working Days: <strong>{attendanceStats.totalDays}</strong></div>
                <div>Days Present: <strong style={{ color: '#16A34A' }}>{attendanceStats.present}</strong></div>
                <div>Days Absent: <strong style={{ color: '#DC2626' }}>{attendanceStats.absent}</strong></div>
                <div>Attendance: <strong style={{ color: '#1769E0' }}>{attendanceStats.pct}%</strong></div>
              </div>
            ) : (
              <div style={{ color: '#64748B', fontStyle: 'italic' }}>
                Attendance: <strong>Not Available</strong>
              </div>
            )}
          </div>

          {/* 7. Class Teacher Remarks Section */}
          <div style={{ backgroundColor: '#F8FAFC', border: '1px solid #CBD5E1', borderRadius: 6, padding: 10, marginBottom: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
              <div style={{ fontSize: 11, fontWeight: 900, color: '#1769E0', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                CLASS TEACHER'S REMARKS:
              </div>
              <div className="no-print">
                {!isEditingRemarks ? (
                  <button
                    type="button"
                    onClick={() => setIsEditingRemarks(true)}
                    style={{ background: 'none', border: 'none', color: '#1769E0', cursor: 'pointer', fontSize: 11, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 4 }}
                  >
                    <Edit3 size={13} /> Edit Remarks
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleSaveRemarks}
                    style={{ backgroundColor: '#1769E0', color: '#FFFFFF', border: 'none', borderRadius: 4, padding: '2px 8px', cursor: 'pointer', fontSize: 11, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 4 }}
                  >
                    <Save size={13} /> Save
                  </button>
                )}
              </div>
            </div>

            {!isEditingRemarks ? (
              <p style={{ fontSize: 12, color: '#0F172A', fontStyle: 'italic', margin: 0, fontWeight: 600 }}>
                "{teacherRemarks}"
              </p>
            ) : (
              <div className="no-print">
                <textarea
                  className="avm-input"
                  rows={2}
                  value={teacherRemarks}
                  onChange={(e) => setTeacherRemarks(e.target.value)}
                  style={{ fontSize: 12, padding: 6, width: '100%' }}
                />
              </div>
            )}
            {savedSuccess && (
              <span className="no-print" style={{ color: '#16A34A', fontSize: 10, fontWeight: 800, marginTop: 2, display: 'block' }}>
                ✓ Remarks saved successfully.
              </span>
            )}
          </div>

          {/* 8. Signatures Section */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: 24, paddingTop: 10, fontSize: 11, color: '#475569' }}>
            <div style={{ textAlign: 'center', width: '160px' }}>
              <div style={{ borderBottom: '1px dashed #94A3B8', paddingBottom: 4, marginBottom: 4, fontWeight: 800, color: '#0F172A', minHeight: 24 }}>
                Mrs. Priya Sharma
              </div>
              <div style={{ fontWeight: 700 }}>Class Teacher Signature</div>
            </div>

            <div style={{ textAlign: 'center', width: '160px' }}>
              <div style={{ borderBottom: '1px dashed #94A3B8', paddingBottom: 4, marginBottom: 4, fontWeight: 800, color: '#0F172A', minHeight: 24 }}>
                {student.fatherName || 'Parent / Guardian'}
              </div>
              <div style={{ fontWeight: 700 }}>Parent / Guardian Signature</div>
            </div>

            <div style={{ textAlign: 'center', width: '130px' }}>
              <div style={{ border: '1px dashed #94A3B8', height: 40, borderRadius: 4, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, color: '#94A3B8', fontWeight: 700, marginBottom: 4 }}>
                [ SCHOOL STAMP ]
              </div>
              <div style={{ fontWeight: 700 }}>School Stamp</div>
            </div>

            <div style={{ textAlign: 'center', width: '160px' }}>
              <div style={{ borderBottom: '1px dashed #94A3B8', paddingBottom: 4, marginBottom: 4, fontWeight: 900, color: '#1769E0', minHeight: 24 }}>
                Dr. S. C. Sharma
              </div>
              <div style={{ fontWeight: 700 }}>Principal Signature</div>
            </div>
          </div>

          {/* 9. Official School Footer */}
          <div style={{ marginTop: 20, paddingTop: 8, borderTop: '1px solid #E2E8F0', textAlign: 'center', fontSize: 10, color: '#64748B', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>Adarsh Vidya Mandir • Kajraili, Bhagalpur, Bihar</span>
            <span>Official Academic Report Card • Session {sessionName}</span>
            <span>Generated via AVM ERP</span>
          </div>
        </div>
      </div>

      {/* Screen Action Buttons */}
      <div className="no-print" style={{ display: 'flex', gap: 12, marginTop: 16, justifyContent: 'flex-end' }}>
        <button type="button" className="avm-btn-secondary" onClick={onClose}>
          Close
        </button>
        <button type="button" className="avm-btn-primary" onClick={handlePrint} style={{ padding: '10px 22px' }}>
          <Printer size={16} /> Print Report Card
        </button>
      </div>
    </Modal>
  );
};

