import React, { useState } from 'react';
import { Student } from '../types';
import { demoDataStore, SchoolAdmitCardRecord } from '../services/demoDataStore';
import { AdmitCardModal } from '../components/AdmitCardModal';
import { Download, CheckCircle, Calendar } from 'lucide-react';

interface StudentExamsScreenProps {
  student: Student;
}

export const StudentExamsScreen: React.FC<StudentExamsScreenProps> = ({ student }) => {
  const [tab, setTab] = useState<'Upcoming' | 'AdmitCard'>('Upcoming');
  const [selectedAdmitCardRecord, setSelectedAdmitCardRecord] = useState<SchoolAdmitCardRecord | null>(null);

  const db = demoDataStore.getDB();
  const examsList = db.exams && db.exams.length > 0 ? db.exams : [
    { id: 'EX-PT1-2026-27', name: 'First Term Examination', startDate: '2026-07-10', endDate: '2026-07-20', academicYear: '2026-27' },
    { id: 'EX-HY-2026-27', name: 'Half Yearly Examination', startDate: '2026-09-25', endDate: '2026-10-10', academicYear: '2026-27' },
    { id: 'EX-ANNUAL-2026-27', name: 'Annual / Final Examination', startDate: '2027-02-15', endDate: '2027-03-05', academicYear: '2026-27' }
  ];

  const admitCardsList = db.admitCards || [];

  return (
    <div style={{ padding: '16px 16px 80px 16px', display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div>
        <h2 style={{ fontSize: 18, fontWeight: 800, color: '#172033' }}>Examinations</h2>
        <p style={{ fontSize: 12, color: '#667085' }}>Exam Schedules & Official Admit Cards</p>
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
          onClick={() => setTab('Upcoming')}
          style={{
            padding: '8px',
            borderRadius: 10,
            border: 'none',
            backgroundColor: tab === 'Upcoming' ? '#FFFFFF' : 'transparent',
            color: tab === 'Upcoming' ? '#1769E0' : '#64748B',
            fontWeight: 700,
            fontSize: 13,
            cursor: 'pointer'
          }}
        >
          Upcoming Exams
        </button>
        <button
          onClick={() => setTab('AdmitCard')}
          style={{
            padding: '8px',
            borderRadius: 10,
            border: 'none',
            backgroundColor: tab === 'AdmitCard' ? '#FFFFFF' : 'transparent',
            color: tab === 'AdmitCard' ? '#1769E0' : '#64748B',
            fontWeight: 700,
            fontSize: 13,
            cursor: 'pointer'
          }}
        >
          Digital Admit Card
        </button>
      </div>

      {/* Exam Cards */}
      {examsList.map((exam: any) => {
        const studentAdmitCard = admitCardsList.find(
          (a: SchoolAdmitCardRecord) =>
            (a.studentId === student.id || a.admissionNo === student.admissionNo) &&
            (a.examName === exam.name || a.examId === exam.id || a.examId === exam.name) &&
            a.status === 'Published'
        );

        const isPublished = !!studentAdmitCard;

        if (tab === 'AdmitCard' && !isPublished) {
          return null;
        }

        return (
          <div key={exam.id} className="avm-card" style={{ padding: 18, borderLeft: '4px solid #1769E0' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
              <span style={{
                fontSize: 11,
                fontWeight: 800,
                backgroundColor: '#EAF3FF',
                color: '#1769E0',
                padding: '3px 10px',
                borderRadius: 12
              }}>
                SESSION {exam.academicYear || exam.academicSessionId || '2026-27'}
              </span>

              {isPublished ? (
                <span style={{
                  fontSize: 11,
                  fontWeight: 800,
                  backgroundColor: '#DCFCE7',
                  color: '#15803D',
                  padding: '3px 10px',
                  borderRadius: 12,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 4
                }}>
                  <CheckCircle size={12} /> Admit Card Released
                </span>
              ) : (
                <span style={{
                  fontSize: 11,
                  fontWeight: 700,
                  backgroundColor: '#FEF3C7',
                  color: '#D97706',
                  padding: '3px 10px',
                  borderRadius: 12
                }}>
                  Pending Release
                </span>
              )}
            </div>

            <h3 style={{ fontSize: 16, fontWeight: 800, color: '#172033', margin: '4px 0 6px 0' }}>
              {exam.name}
            </h3>

            <div style={{ fontSize: 13, color: '#667085', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 6 }}>
              <Calendar size={14} color="#1769E0" />
              <span>Schedule: <strong>{exam.startDate || '2026-09-25'}</strong> to <strong>{exam.endDate || '2026-10-10'}</strong></span>
            </div>

            {isPublished ? (
              <button
                className="avm-btn-primary"
                style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
                onClick={() => setSelectedAdmitCardRecord(studentAdmitCard)}
              >
                <Download size={16} /> View & Download Admit Card
              </button>
            ) : (
              <div style={{
                fontSize: 12,
                color: '#667085',
                backgroundColor: '#F8FAFC',
                padding: 10,
                borderRadius: 8,
                textAlign: 'center',
                fontWeight: 600
              }}>
                Admit Card will be published prior to examination by the admin.
              </div>
            )}
          </div>
        );
      })}

      {/* Modal Popup for Admit Card */}
      {selectedAdmitCardRecord && (
        <AdmitCardModal
          isOpen={!!selectedAdmitCardRecord}
          onClose={() => setSelectedAdmitCardRecord(null)}
          student={student}
          admitCard={selectedAdmitCardRecord}
          examName={selectedAdmitCardRecord.examName}
        />
      )}
    </div>
  );
};

