import React, { useState, useEffect } from 'react';
import { Homework, Student } from '../types';
import { studentService } from '../services/studentService';
import { homeworkService } from '../services/homeworkService';
import { academicService } from '../services/academicService';
import { UploadCloud, CheckCircle2, History, Calendar, BookOpen, Clock, ChevronRight } from 'lucide-react';
import { Modal } from '../components/Modal';
import { HomeworkDetailModal } from '../components/HomeworkDetailModal';

interface StudentHomeworkScreenProps {
  student?: Student;
}

export const StudentHomeworkScreen: React.FC<StudentHomeworkScreenProps> = ({ student }) => {
  const [subjectFilter, setSubjectFilter] = useState('All');
  const [viewMode, setViewMode] = useState<'today' | 'history'>('today');
  const [homeworkList, setHomeworkList] = useState<Homework[]>([]);
  
  // Selected Detail Modal State
  const [selectedDetailHw, setSelectedDetailHw] = useState<Homework | null>(null);

  // Solution Submission Modal State
  const [solutionHw, setSolutionHw] = useState<Homework | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  const studentClass = student?.className || 'Class 5';
  const studentSec = student?.section || 'A';
  const fullClassDisplay = studentClass.includes('-') ? studentClass : `${studentClass}-${studentSec}`;

  const fetchHomework = async () => {
    try {
      const data = await homeworkService.getHomework(studentClass, studentSec);
      if (data && data.length > 0) {
        // Deduplicate records by ID
        const uniqueHwMap = new Map<string, Homework>();
        data.forEach(h => {
          if (h && h.id) uniqueHwMap.set(h.id, h);
        });
        setHomeworkList(Array.from(uniqueHwMap.values()));
      } else {
        const fallback = await studentService.getHomework(studentClass, studentSec);
        setHomeworkList(fallback || []);
      }
    } catch (e) {
      console.warn('Error fetching student homework:', e);
    }
  };

  useEffect(() => {
    fetchHomework();
  }, [studentClass, studentSec]);

  // Dynamically load active subjects
  const masterSubjs = academicService.getMasterSubjects().filter(s => s.status === 'Active').map(s => s.name);
  const subjects = ['All', ...Array.from(new Set([...masterSubjs, 'Mathematics', 'Science', 'English', 'Hindi', 'Computer Science']))];

  const todayStr = new Date().toISOString().split('T')[0];

  // Filter homeworks for current student's class & section
  const filteredHomeworks = homeworkList.filter((hw) => {
    if (subjectFilter !== 'All' && hw.subject.toLowerCase() !== subjectFilter.toLowerCase()) {
      return false;
    }
    const hwDate = hw.homeworkDate || hw.assignedDate || '';
    if (viewMode === 'today') {
      return hwDate === todayStr || hw.status !== 'Completed';
    }
    return true; // History returns all
  });

  const handleSubmitDemo = async () => {
    if (!solutionHw) return;
    setSubmitting(true);
    await studentService.submitHomework(solutionHw.id, 'solution_photo.jpg');
    setSubmitting(false);
    setSubmitSuccess(true);
    setHomeworkList((prev) => prev.map((item) => item.id === solutionHw.id ? { ...item, status: 'Completed' } : item));
    setTimeout(() => {
      setSubmitSuccess(false);
      setSolutionHw(null);
    }, 1200);
  };

  const getStatusBadge = (hw: Homework) => {
    const isCompleted = hw.status === 'Completed';
    const isDueToday = hw.dueDate === todayStr;
    const isOverdue = !isCompleted && hw.dueDate < todayStr;
    const isNew = hw.status === 'New';

    let label = hw.status || 'Pending';
    let bg = '#FFFBEB';
    let color = '#F59E0B';

    if (isCompleted) {
      label = 'Completed';
      bg = '#EAF8EF';
      color = '#16A34A';
    } else if (isOverdue) {
      label = 'Overdue';
      bg = '#FEF2F2';
      color = '#EF4444';
    } else if (isDueToday) {
      label = 'Due Today';
      bg = '#FEF3C7';
      color = '#D97706';
    } else if (isNew) {
      label = 'New';
      bg = '#EAF3FF';
      color = '#1769E0';
    }

    return (
      <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 9px', borderRadius: 12, backgroundColor: bg, color: color }}>
        {label}
      </span>
    );
  };

  return (
    <div style={{ padding: '16px 16px 80px 16px', display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ fontSize: 18, fontWeight: 800, color: '#172033' }}>My Homework</h2>
          <p style={{ fontSize: 12, color: '#667085' }}>{fullClassDisplay} Daily Assignments</p>
        </div>

        {/* Toggle between Recent & History */}
        <div style={{ display: 'flex', backgroundColor: '#F1F5F9', borderRadius: 10, padding: 2 }}>
          <button
            type="button"
            onClick={() => setViewMode('today')}
            style={{
              padding: '6px 12px',
              borderRadius: 8,
              border: 'none',
              backgroundColor: viewMode === 'today' ? '#FFFFFF' : 'transparent',
              color: viewMode === 'today' ? '#1769E0' : '#64748B',
              fontWeight: 700,
              fontSize: 11,
              cursor: 'pointer',
              boxShadow: viewMode === 'today' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none'
            }}
          >
            Active
          </button>
          <button
            type="button"
            onClick={() => setViewMode('history')}
            style={{
              padding: '6px 12px',
              borderRadius: 8,
              border: 'none',
              backgroundColor: viewMode === 'history' ? '#FFFFFF' : 'transparent',
              color: viewMode === 'history' ? '#1769E0' : '#64748B',
              fontWeight: 700,
              fontSize: 11,
              cursor: 'pointer',
              boxShadow: viewMode === 'history' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none'
            }}
          >
            History
          </button>
        </div>
      </div>

      {/* Subject Filter Tags */}
      <div style={{
        display: 'flex',
        gap: 8,
        overflowX: 'auto',
        paddingBottom: 4
      }}>
        {subjects.map((sub) => {
          const isSelected = subjectFilter === sub;
          return (
            <button
              key={sub}
              onClick={() => setSubjectFilter(sub)}
              style={{
                padding: '6px 14px',
                borderRadius: 20,
                backgroundColor: isSelected ? '#1769E0' : '#FFFFFF',
                color: isSelected ? '#FFFFFF' : '#64748B',
                fontWeight: 700,
                fontSize: 12,
                cursor: 'pointer',
                boxShadow: '0 2px 4px rgba(0,0,0,0.04)',
                border: isSelected ? 'none' : '1px solid #E2E8F0',
                whiteSpace: 'nowrap'
              }}
            >
              {sub}
            </button>
          );
        })}
      </div>

      {/* Homework Cards List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        {filteredHomeworks.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 24, color: '#667085', fontSize: 13, backgroundColor: '#FFFFFF', borderRadius: 14, border: '1px dashed #CBD5E1' }}>
            No homework assignments found for {fullClassDisplay}.
          </div>
        ) : (
          filteredHomeworks.map((hw) => {
            const isCompleted = hw.status === 'Completed';

            return (
              <div
                key={hw.id}
                className="avm-card"
                onClick={() => setSelectedDetailHw(hw)}
                style={{ padding: 16, cursor: 'pointer', transition: 'all 0.15s ease-in-out' }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                  <span style={{
                    fontSize: 11,
                    fontWeight: 800,
                    color: '#1769E0',
                    backgroundColor: '#EAF3FF',
                    padding: '3px 10px',
                    borderRadius: 12
                  }}>
                    {hw.subject}
                  </span>

                  {getStatusBadge(hw)}
                </div>

                <h3 style={{ fontSize: 15, fontWeight: 700, color: '#172033', margin: '0 0 6px 0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span>{hw.title}</span>
                  <span style={{ fontSize: 11, color: '#1769E0', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 2 }}>
                    Details <ChevronRight size={14} />
                  </span>
                </h3>

                <p style={{ fontSize: 13, color: '#475569', marginBottom: 12, lineHeight: 1.4, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                  {hw.instructions || hw.description}
                </p>

                {hw.attachmentUrl && (
                  <div style={{ marginBottom: 12 }}>
                    {hw.attachmentUrl.startsWith('data:image') ? (
                      <img
                        src={hw.attachmentUrl}
                        alt="Homework Attachment"
                        style={{
                          width: '100%',
                          maxHeight: 140,
                          objectFit: 'cover',
                          borderRadius: 10,
                          border: '1px solid #E2E8F0'
                        }}
                      />
                    ) : (
                      <div style={{ padding: 10, borderRadius: 10, backgroundColor: '#F8FAFC', border: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, fontWeight: 700, color: '#475569' }}>
                        <UploadCloud size={16} color="#1769E0" />
                        <span>Attached Worksheet / Document</span>
                      </div>
                    )}
                  </div>
                )}

                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  borderTop: '1px solid #F1F5F9',
                  paddingTop: 10,
                  fontSize: 11,
                  color: '#667085'
                }}>
                  <div>
                    Assigned: <strong>{hw.homeworkDate || hw.assignedDate}</strong>
                    <br />
                    Teacher: <strong>{hw.createdByEmployeeName || hw.teacherName}</strong>
                  </div>
                  <div style={{ color: '#EF4444', fontWeight: 700, textAlign: 'right' }}>
                    Due Date:
                    <br />
                    {hw.dueDate}
                  </div>
                </div>

                {!isCompleted && (
                  <button
                    className="avm-btn-primary"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSolutionHw(hw);
                    }}
                    style={{ width: '100%', marginTop: 12, padding: '10px', fontSize: 13 }}
                  >
                    <UploadCloud size={16} /> Submit Solution
                  </button>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* --- COMPLETE HOMEWORK DETAIL MODAL --- */}
      <HomeworkDetailModal
        isOpen={!!selectedDetailHw}
        onClose={() => setSelectedDetailHw(null)}
        homework={selectedDetailHw}
        role="student"
        onSubmitSolution={(hw) => setSolutionHw(hw)}
      />

      {/* --- SUBMISSION MODAL --- */}
      {solutionHw && (
        <Modal isOpen={!!solutionHw} onClose={() => setSolutionHw(null)} title={`Submit Solution - ${solutionHw.subject}`}>
          <div>
            <h4 style={{ fontSize: 14, fontWeight: 700, color: '#172033', marginBottom: 4 }}>
              {solutionHw.title}
            </h4>
            <p style={{ fontSize: 12, color: '#667085', marginBottom: 16 }}>
              Upload your notebook photo or PDF file to submit homework to {solutionHw.createdByEmployeeName || solutionHw.teacherName}.
            </p>

            <div style={{
              border: '2px dashed #1769E0',
              borderRadius: 14,
              backgroundColor: '#EAF3FF',
              padding: 24,
              textAlign: 'center',
              marginBottom: 16,
              cursor: 'pointer'
            }}>
              <UploadCloud size={32} color="#1769E0" style={{ margin: '0 auto 8px auto' }} />
              <div style={{ fontSize: 13, fontWeight: 700, color: '#1769E0' }}>
                Tap to Select Photo / Document
              </div>
              <div style={{ fontSize: 11, color: '#667085', marginTop: 2 }}>
                Supports JPG, PNG, PDF up to 10MB
              </div>
            </div>

            {submitSuccess ? (
              <div style={{
                backgroundColor: '#EAF8EF',
                color: '#16A34A',
                padding: 12,
                borderRadius: 10,
                textAlign: 'center',
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8
              }}>
                <CheckCircle2 size={18} /> Homework Submitted Successfully!
              </div>
            ) : (
              <div style={{ display: 'flex', gap: 10 }}>
                <button className="avm-btn-secondary" style={{ flex: 1 }} onClick={() => setSolutionHw(null)}>
                  Cancel
                </button>
                <button className="avm-btn-primary" style={{ flex: 1 }} onClick={handleSubmitDemo} disabled={submitting}>
                  {submitting ? 'Uploading...' : 'Confirm Submission'}
                </button>
              </div>
            )}
          </div>
        </Modal>
      )}
    </div>
  );
};
