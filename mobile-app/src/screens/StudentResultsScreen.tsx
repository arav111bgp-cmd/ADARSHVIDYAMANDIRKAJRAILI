import React, { useState, useEffect } from 'react';
import type { Student, StudentResult } from '../types';
import { studentService } from '../services/studentService';
import { ReportCardModal } from '../components/ReportCardModal';
import { SkeletonCard } from '../components/SkeletonLoader';
import { Printer } from 'lucide-react';

interface StudentResultsScreenProps {
  student: Student;
}

export const StudentResultsScreen: React.FC<StudentResultsScreenProps> = ({ student }) => {
  const [result, setResult] = useState<StudentResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    let isMounted = true;
    studentService.getResult(student.id).then((res) => {
      if (isMounted) {
        setResult(res);
        setLoading(false);
      }
    });
    return () => { isMounted = false; };
  }, [student.id]);

  if (loading) return <div style={{ padding: 16 }}><SkeletonCard /><SkeletonCard /></div>;

  const isEarlyYears = result?.isEarlyYears || student.className.toLowerCase().includes('nursery') || student.className.toLowerCase().includes('lkg') || student.className.toLowerCase().includes('ukg');

  return (
    <div style={{ padding: '16px 16px 80px 16px', display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div>
        <h2 style={{ fontSize: 18, fontWeight: 800, color: '#172033' }}>Academic Results</h2>
        <p style={{ fontSize: 12, color: '#667085' }}>
          {isEarlyYears ? 'Nursery / Early Years Progress Assessment' : 'Class 5-A Half Yearly Evaluation'}
        </p>
      </div>

      {result && (
        <>
          {/* Header Summary Banner */}
          <div style={{
            background: 'linear-gradient(135deg, #1769E0 0%, #1255B8 100%)',
            borderRadius: 18,
            padding: 20,
            color: '#FFFFFF',
            boxShadow: '0 8px 20px rgba(23,105,224,0.25)'
          }}>
            <div style={{ fontSize: 12, opacity: 0.85, fontWeight: 600 }}>{result.examName}</div>
            
            {!isEarlyYears ? (
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: 8 }}>
                <div>
                  <div style={{ fontSize: 32, fontWeight: 800, lineHeight: 1.1 }}>
                    {result.percentage}%
                  </div>
                  <div style={{ fontSize: 13, marginTop: 4, opacity: 0.9 }}>
                    Total: {result.totalObtained} / {result.totalMax} Marks
                  </div>
                </div>

                <div style={{
                  backgroundColor: '#FFFFFF',
                  color: '#1769E0',
                  padding: '6px 14px',
                  borderRadius: 14,
                  fontWeight: 800,
                  fontSize: 16
                }}>
                  Grade {result.grade}
                </div>
              </div>
            ) : (
              <div style={{ marginTop: 8 }}>
                <div style={{ fontSize: 22, fontWeight: 800 }}>Overall Performance: Excellent</div>
                <div style={{ fontSize: 12, opacity: 0.9, marginTop: 4 }}>
                  Comprehensive Skill & Activity Based Evaluation
                </div>
              </div>
            )}
          </div>

          {/* CLASS 1 TO 8 MARKS TABLE OR EARLY YEARS SKILLS EVALUATION */}
          <div className="avm-card" style={{ padding: 16 }}>
            <h3 style={{ fontSize: 15, fontWeight: 700, color: '#172033', marginBottom: 12 }}>
              {isEarlyYears ? 'Skill & Development Evaluation' : 'Subject Wise Marks'}
            </h3>

            {!isEarlyYears && result.marks ? (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                  <thead>
                    <tr style={{ borderBottom: '2px solid #E2E8F0', color: '#64748B', textAlign: 'left' }}>
                      <th style={{ padding: '8px 4px' }}>Subject</th>
                      <th style={{ padding: '8px 4px', textAlign: 'center' }}>Marks</th>
                      <th style={{ padding: '8px 4px', textAlign: 'center' }}>Max</th>
                      <th style={{ padding: '8px 4px', textAlign: 'right' }}>Grade</th>
                    </tr>
                  </thead>
                  <tbody>
                    {result.marks.map((item, idx) => (
                      <tr key={idx} style={{ borderBottom: '1px solid #F1F5F9' }}>
                        <td style={{ padding: '10px 4px', fontWeight: 700, color: '#172033' }}>{item.subject}</td>
                        <td style={{ padding: '10px 4px', textAlign: 'center', fontWeight: 800, color: '#1769E0' }}>{item.marksObtained}</td>
                        <td style={{ padding: '10px 4px', textAlign: 'center', color: '#64748B' }}>{item.maxMarks}</td>
                        <td style={{ padding: '10px 4px', textAlign: 'right' }}>
                          <span style={{
                            backgroundColor: '#EAF8EF',
                            color: '#16A34A',
                            fontWeight: 700,
                            padding: '2px 8px',
                            borderRadius: 10,
                            fontSize: 11
                          }}>
                            {item.grade}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {result.skillsEvaluation?.map((sk, idx) => (
                  <div key={idx} style={{
                    backgroundColor: '#F8FAFC',
                    borderRadius: 10,
                    padding: 10,
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}>
                    <div>
                      <div style={{ fontWeight: 700, color: '#172033', fontSize: 13 }}>{sk.category}</div>
                      <div style={{ fontSize: 11, color: '#64748B' }}>{sk.remark}</div>
                    </div>
                    <span style={{
                      backgroundColor: sk.rating === 'Excellent' ? '#EAF8EF' : '#EAF3FF',
                      color: sk.rating === 'Excellent' ? '#16A34A' : '#1769E0',
                      fontWeight: 800,
                      fontSize: 11,
                      padding: '3px 10px',
                      borderRadius: 12
                    }}>
                      {sk.rating}
                    </span>
                  </div>
                ))}
              </div>
            )}

            {/* Teacher Remarks Box */}
            <div style={{
              marginTop: 16,
              backgroundColor: '#F8FAFC',
              border: '1px solid #E2E8F0',
              borderRadius: 10,
              padding: 12
            }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#1769E0', marginBottom: 2 }}>
                TEACHER REMARKS
              </div>
              <p style={{ fontSize: 12, color: '#475569', fontStyle: 'italic', margin: 0 }}>
                "{result.teacherRemarks}"
              </p>
            </div>

            <button
              className="avm-btn-primary"
              onClick={() => setModalOpen(true)}
              style={{ width: '100%', marginTop: 16 }}
            >
              <Printer size={16} /> View & Print Official Report Card
            </button>
          </div>

          {/* Modal popup for Printable Report Card */}
          <ReportCardModal
            isOpen={modalOpen}
            onClose={() => setModalOpen(false)}
            student={student}
            result={result}
          />
        </>
      )}
    </div>
  );
};
