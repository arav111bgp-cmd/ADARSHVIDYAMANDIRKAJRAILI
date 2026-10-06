import React from 'react';
import { Modal } from './Modal';
import { Student } from '../types';
import { mockSchoolInfo } from '../mock/mockData';
import { classService } from '../services/classService';
import { demoDataStore, SchoolAdmitCardRecord } from '../services/demoDataStore';
import { Printer, CheckCircle, QrCode } from 'lucide-react';

interface AdmitCardModalProps {
  isOpen: boolean;
  onClose: () => void;
  student: Student;
  admitCard?: SchoolAdmitCardRecord | null;
  examName?: string;
}

export const AdmitCardModal: React.FC<AdmitCardModalProps> = ({
  isOpen,
  onClose,
  student,
  admitCard,
  examName = 'First Term Examination'
}) => {
  const currentExamTitle = admitCard?.examName || examName || 'First Term Examination';
  const currentSession = admitCard?.academicSessionId || '2026-27';
  const examCentre = admitCard?.examCentre || 'Adarsh Vidya Mandir, Kajraili, Bhagalpur, Bihar';
  const reportingTime = admitCard?.reportingTime || '08:30 AM';

  // Sourced dynamically from demoDataStore examSchedules or class subjects
  const db = demoDataStore.getDB();
  const rawClass = student.className ? student.className.trim() : 'Class 5';
  const cleanClassTag = rawClass.includes('-') ? rawClass : `${rawClass}-${student.section || 'A'}`;
  const cleanBaseClass = rawClass.split('-')[0].trim();

  let matchingSchedules = (db.examSchedules || []).filter(
    (s: any) =>
      (!s.academicSessionId || s.academicSessionId === currentSession) &&
      (s.examId === currentExamTitle || s.examName === currentExamTitle || currentExamTitle.toLowerCase().includes(s.examName?.toLowerCase() || 'first')) &&
      ((s.className || '').toLowerCase() === cleanClassTag.toLowerCase() || (s.className || '').toLowerCase() === cleanBaseClass.toLowerCase() || (s.className || '').toLowerCase() === rawClass.toLowerCase())
  );

  // Apply sitting filter if specified
  if (admitCard?.sittingFilter && admitCard.sittingFilter !== 'All Sittings') {
    matchingSchedules = matchingSchedules.filter((s: any) => s.sitting === admitCard.sittingFilter);
  }

  // Apply selected subjects filter if specified
  if (admitCard?.selectedSubjectIds && admitCard.selectedSubjectIds.length > 0) {
    matchingSchedules = matchingSchedules.filter((s: any) => 
      admitCard.selectedSubjectIds?.includes(s.subjectId) ||
      admitCard.selectedSubjectIds?.includes(s.id) ||
      admitCard.selectedSubjectIds?.includes(s.subjectName || s.subject)
    );
  }

  // If matching schedules exist, map them. Otherwise, dynamically build schedule from Admin Class Subjects.
  let scheduleList: Array<{ date: string; sitting: string; time: string; subject: string; room: string }> = [];

  if (matchingSchedules.length > 0) {
    scheduleList = matchingSchedules.map((s: any) => ({
      date: s.examDate || '2026-10-01',
      sitting: s.sitting || 'First Sitting',
      time: s.startTime && s.endTime ? `${s.startTime} - ${s.endTime}` : (s.sitting === 'Second Sitting' ? '01:00 PM - 03:00 PM' : '09:00 AM - 11:00 AM'),
      subject: s.subjectName || s.subject || 'Subject',
      room: s.roomNo || 'Room 5'
    }));
  } else {
    // Dynamic fallback: Load subjects configured by Admin for this specific class
    const classSubs = (db.schoolSubjects || []).filter((sub: any) => 
      (!sub.academicSessionId || sub.academicSessionId === currentSession) &&
      sub.className.toLowerCase() === cleanBaseClass.toLowerCase()
    );

    const baseDate = new Date(2026, 9, 1); // 01 Oct 2026
    scheduleList = (classSubs.length > 0 ? classSubs : [
      { name: 'Mathematics' }, { name: 'Science' }, { name: 'English' }, { name: 'Hindi' }, { name: 'Computer' }
    ]).map((sub: any, idx: number) => {
      const d = new Date(baseDate);
      d.setDate(baseDate.getDate() + (idx * 2));
      const dateStr = d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
      const isSecond = idx % 2 === 1;
      return {
        date: dateStr,
        sitting: isSecond ? 'Second Sitting' : 'First Sitting',
        time: isSecond ? '01:00 PM - 03:00 PM' : '09:00 AM - 11:00 AM',
        subject: sub.name,
        room: `Room ${(idx % 5) + 1}`
      };
    });
  }

  const handlePrint = () => {
    window.print();
  };

  const qrCodeText = `${student.admissionNo}|${student.id}|${currentSession}|${currentExamTitle}`;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Admit Card — ${student.name}`} maxWidth="720px">
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          .printable-admit-card-frame, .printable-admit-card-frame * {
            visibility: visible;
          }
          .printable-admit-card-frame {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            margin: 0;
            padding: 15mm !important;
            border: 2px solid #000 !important;
            box-shadow: none !important;
          }
          .no-print {
            display: none !important;
          }
          @page {
            size: A4 portrait;
            margin: 10mm;
          }
        }
      `}</style>

      <div>
        {/* Printable Admit Card Frame */}
        <div
          className="printable-admit-card-frame"
          style={{
            border: '2px solid #1769E0',
            borderRadius: 14,
            padding: 20,
            backgroundColor: '#FFFFFF',
            boxShadow: '0 4px 14px rgba(0,0,0,0.06)'
          }}
        >
          {/* Header */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderBottom: '2px solid #1769E0',
            paddingBottom: 14,
            marginBottom: 16
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <div style={{
                width: 52,
                height: 52,
                borderRadius: 12,
                background: 'linear-gradient(135deg, #1769E0 0%, #1255B8 100%)',
                color: '#FFF',
                fontWeight: 900,
                fontSize: 22,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 3px 8px rgba(23,105,224,0.3)'
              }}>
                AVM
              </div>
              <div>
                <h2 style={{ fontSize: 20, fontWeight: 900, color: '#0F172A', margin: 0, letterSpacing: '-0.3px' }}>
                  ADARSH VIDYA MANDIR
                </h2>
                <p style={{ fontSize: 12, color: '#475569', fontWeight: 700, margin: '2px 0 4px 0' }}>
                  KAJRAILI, BHAGALPUR, BIHAR • OFFICIAL ADMIT CARD
                </p>
                <div style={{
                  display: 'inline-block',
                  backgroundColor: '#EFF6FF',
                  color: '#1D4ED8',
                  fontSize: 11,
                  fontWeight: 900,
                  padding: '3px 10px',
                  borderRadius: 12,
                  border: '1px solid #BFDBFE'
                }}>
                  {currentExamTitle.toUpperCase()} • SESSION {currentSession}
                </div>
              </div>
            </div>

            {/* Verification Badge & QR Code */}
            <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
              <span style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 4,
                color: '#15803D',
                backgroundColor: '#DCFCE7',
                padding: '4px 10px',
                borderRadius: 20,
                fontSize: 11,
                fontWeight: 800
              }}>
                <CheckCircle size={13} /> OFFICIAL ADMIT CARD
              </span>

              {/* QR Code Graphic */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                backgroundColor: '#F8FAFC',
                padding: '4px 8px',
                borderRadius: 6,
                border: '1px solid #E2E8F0',
                marginTop: 4
              }}>
                <QrCode size={26} color="#1E40AF" />
                <div style={{ textAlign: 'left', lineHeight: 1 }}>
                  <div style={{ fontSize: 9, fontWeight: 800, color: '#334155' }}>VERIFY STUDENT</div>
                  <div style={{ fontSize: 9, color: '#64748B', fontFamily: 'monospace' }}>{student.admissionNo}</div>
                </div>
              </div>
            </div>
          </div>

          {/* Student Profile Info Section */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '95px 1fr',
            gap: 16,
            backgroundColor: '#F8FAFC',
            padding: 14,
            borderRadius: 12,
            border: '1px solid #E2E8F0',
            marginBottom: 16
          }}>
            {/* Student Photo */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              {student.photo ? (
                <img
                  src={student.photo}
                  alt={student.name}
                  style={{
                    width: 90,
                    height: 108,
                    borderRadius: 8,
                    objectFit: 'cover',
                    border: '2px solid #1769E0',
                    boxShadow: '0 2px 6px rgba(0,0,0,0.1)'
                  }}
                />
              ) : (
                <div style={{
                  width: 90,
                  height: 108,
                  borderRadius: 8,
                  backgroundColor: '#E2E8F0',
                  border: '2px dashed #94A3B8',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#64748B',
                  fontWeight: 800,
                  fontSize: 13
                }}>
                  PHOTO
                </div>
              )}
              <span style={{ fontSize: 10, fontWeight: 800, color: '#64748B', marginTop: 4 }}>PASSPORT PHOTO</span>
            </div>

            {/* Details Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px 16px', fontSize: 13 }}>
              <div>
                <span style={{ color: '#64748B', fontSize: 11, fontWeight: 600 }}>Student Name:</span>
                <div style={{ fontWeight: 900, color: '#0F172A', fontSize: 14 }}>{student.name}</div>
              </div>
              <div>
                <span style={{ color: '#64748B', fontSize: 11, fontWeight: 600 }}>Admission Number:</span>
                <div style={{ fontWeight: 900, color: '#1769E0', fontSize: 14 }}>{student.admissionNo}</div>
              </div>
              <div>
                <span style={{ color: '#64748B', fontSize: 11, fontWeight: 600 }}>Class & Section:</span>
                <div style={{ fontWeight: 800, color: '#0F172A' }}>
                  {classService.formatClassDisplay(student.className, student.section)}
                </div>
              </div>
              <div>
                <span style={{ color: '#64748B', fontSize: 11, fontWeight: 600 }}>Roll Number:</span>
                <div style={{ fontWeight: 900, color: '#0F172A' }}>{student.rollNo || '-'}</div>
              </div>
              <div>
                <span style={{ color: '#64748B', fontSize: 11, fontWeight: 600 }}>Father's Name:</span>
                <div style={{ fontWeight: 700, color: '#334155' }}>{student.fatherName || 'Shri Ramesh Sharma'}</div>
              </div>
              <div>
                <span style={{ color: '#64748B', fontSize: 11, fontWeight: 600 }}>Mother's Name:</span>
                <div style={{ fontWeight: 700, color: '#334155' }}>{student.motherName || 'Smt. Sunita Sharma'}</div>
              </div>
              <div>
                <span style={{ color: '#64748B', fontSize: 11, fontWeight: 600 }}>Date of Birth:</span>
                <div style={{ fontWeight: 700, color: '#334155' }}>{student.dob || '2015-05-15'}</div>
              </div>
              <div>
                <span style={{ color: '#64748B', fontSize: 11, fontWeight: 600 }}>Reporting Time:</span>
                <div style={{ fontWeight: 800, color: '#D97706' }}>{reportingTime}</div>
              </div>
            </div>
          </div>

          {/* Exam Schedule Table */}
          <h4 style={{ fontSize: 13, fontWeight: 900, color: '#0F172A', margin: '0 0 8px 0', letterSpacing: '0.3px' }}>
            EXAMINATION SCHEDULE & TIMETABLE
          </h4>
          <table style={{
            width: '100%',
            borderCollapse: 'collapse',
            fontSize: 12,
            marginBottom: 14,
            border: '1px solid #E2E8F0',
            borderRadius: 8,
            overflow: 'hidden'
          }}>
            <thead>
              <tr style={{ backgroundColor: '#1769E0', color: '#FFFFFF', textAlign: 'left' }}>
                <th style={{ padding: '8px 10px' }}>Date</th>
                <th style={{ padding: '8px 10px' }}>Sitting</th>
                <th style={{ padding: '8px 10px' }}>Subject</th>
                <th style={{ padding: '8px 10px' }}>Timing</th>
                <th style={{ padding: '8px 10px' }}>Hall / Room No</th>
              </tr>
            </thead>
            <tbody>
              {scheduleList.map((row, idx) => (
                <tr key={idx} style={{
                  borderBottom: '1px solid #E2E8F0',
                  backgroundColor: idx % 2 === 0 ? '#FFFFFF' : '#F8FAFC'
                }}>
                  <td style={{ padding: '8px 10px', fontWeight: 800, whiteSpace: 'nowrap' }}>{row.date}</td>
                  <td style={{ padding: '8px 10px', fontWeight: 800, color: row.sitting === 'Second Sitting' ? '#D97706' : '#1D4ED8' }}>
                    {row.sitting}
                  </td>
                  <td style={{ padding: '8px 10px', fontWeight: 900, color: '#0F172A' }}>{row.subject}</td>
                  <td style={{ padding: '8px 10px', color: '#475569', fontSize: 11 }}>{row.time}</td>
                  <td style={{ padding: '8px 10px', fontWeight: 700, color: '#334155' }}>{row.room}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Examination Centre */}
          <div style={{ backgroundColor: '#EFF6FF', padding: 10, borderRadius: 8, border: '1px solid #BFDBFE', marginBottom: 12, fontSize: 12 }}>
            <span style={{ color: '#1E40AF', fontWeight: 800 }}>Examination Centre: </span>
            <strong style={{ color: '#0F172A' }}>{examCentre}</strong>
          </div>

          {/* Instructions */}
          <div style={{ fontSize: 11, color: '#475569', backgroundColor: '#FFFBEB', padding: 10, borderRadius: 8, border: '1px solid #FDE68A' }}>
            <strong style={{ color: '#92400E' }}>IMPORTANT INSTRUCTIONS FOR EXAMINEE:</strong>
            <ol style={{ paddingLeft: 16, margin: '4px 0 0 0', lineHeight: 1.4 }}>
              <li>Bring this original Admit Card to the examination hall every day.</li>
              <li>Report to the examination room strictly before the reporting time ({reportingTime}).</li>
              <li>Mobile phones, smartwatches, calculators, and unauthorized paper items are strictly prohibited.</li>
              <li>Maintain strict discipline inside the examination hall and follow all instructions given by the invigilator.</li>
            </ol>
          </div>

          {/* Footer Signatures */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-end',
            marginTop: 22,
            paddingTop: 12,
            borderTop: '1px dashed #CBD5E1',
            fontSize: 11,
            color: '#64748B'
          }}>
            <div style={{ textAlign: 'center', width: 140 }}>
              <div style={{ height: 28, borderBottom: '1px solid #CBD5E1', marginBottom: 4 }}></div>
              <div style={{ fontWeight: 700, color: '#334155' }}>Student Signature</div>
            </div>

            <div style={{ textAlign: 'center', width: 140 }}>
              <div style={{ height: 28, borderBottom: '1px solid #CBD5E1', marginBottom: 4, fontWeight: 700, color: '#0F172A', fontStyle: 'italic', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                Priya Sharma
              </div>
              <div style={{ fontWeight: 700, color: '#334155' }}>Class Teacher</div>
            </div>

            <div style={{ textAlign: 'center', width: 160 }}>
              <div style={{
                height: 28,
                fontWeight: 900,
                color: '#1769E0',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 12
              }}>
                Dr. S. C. Sharma
              </div>
              <div style={{ fontWeight: 800, color: '#0F172A' }}>Principal / Controller of Exam</div>
            </div>
          </div>
        </div>
      </div>

      {/* Modal Actions */}
      <div className="no-print" style={{ display: 'flex', gap: 10, marginTop: 16, justifyContent: 'flex-end' }}>
        <button type="button" className="avm-btn-secondary" onClick={onClose}>
          Close
        </button>
        <button type="button" className="avm-btn-primary" onClick={handlePrint} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <Printer size={16} /> Print / Save as PDF
        </button>
      </div>
    </Modal>
  );
};

