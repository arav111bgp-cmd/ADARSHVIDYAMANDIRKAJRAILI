import React, { useState, useEffect } from 'react';
import type { Notice, Student } from '../types';
import { noticeService } from '../services/noticeService';
import { demoDataStore } from '../services/demoDataStore';
import { Modal } from '../components/Modal';
import { Paperclip, CheckCircle2, Clock } from 'lucide-react';

interface StudentNoticesScreenProps {
  student?: Student;
}

export const StudentNoticesScreen: React.FC<StudentNoticesScreenProps> = ({ student }) => {
  const [notices, setNotices] = useState<Notice[]>([]);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [activeNoticeModal, setActiveNoticeModal] = useState<Notice | null>(null);

  const studentId = student?.id || 'STU-157';
  const className = student?.className || 'Class 5';
  const section = student?.section || 'A';

  const fetchNotices = async () => {
    try {
      const data = await noticeService.getNotices('student', {
        id: studentId,
        className,
        section
      });
      setNotices(data);
    } catch (e) {
      console.warn('Error fetching student notices:', e);
    }
  };

  useEffect(() => {
    fetchNotices();
    const unsubscribe = demoDataStore.subscribe(() => {
      fetchNotices();
    });
    return () => unsubscribe();
  }, [studentId, className, section]);

  const handleOpenNotice = async (notice: Notice) => {
    setActiveNoticeModal(notice);
    if (notice.isUnread) {
      await noticeService.markNoticeAsRead(notice.id, studentId);
      setNotices((prev) =>
        prev.map((n) => (n.id === notice.id ? { ...n, isUnread: false } : n))
      );
    }
  };

  const categories = ['All', 'General', 'Academic', 'Exam', 'Holiday', 'PTM', 'Homework', 'Fee', 'Emergency', 'Event', 'Circular'];

  const filteredNotices = selectedCategory === 'All'
    ? notices
    : notices.filter((n) => (n.type || n.category || '').toLowerCase() === selectedCategory.toLowerCase());

  const getCategoryColor = (type?: string) => {
    switch (type) {
      case 'Holiday': return { bg: '#EAF3FF', text: '#1769E0' };
      case 'Exam': return { bg: '#FFF7ED', text: '#F97316' };
      case 'PTM': return { bg: '#F3E8FF', text: '#7C3AED' };
      case 'Fee': return { bg: '#FEF2F2', text: '#EF4444' };
      case 'Emergency': return { bg: '#FEF2F2', text: '#EF4444' };
      case 'Homework': return { bg: '#FEF3C7', text: '#D97706' };
      case 'Academic': return { bg: '#F0FDF4', text: '#16A34A' };
      case 'Event': return { bg: '#FCE7F3', text: '#DB2777' };
      default: return { bg: '#F1F5F9', text: '#475569' };
    }
  };

  return (
    <div style={{ padding: '16px 16px 80px 16px', display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div>
        <h2 style={{ fontSize: 18, fontWeight: 800, color: '#172033', margin: 0 }}>School Circulars & Notices</h2>
        <p style={{ fontSize: 12, color: '#667085', margin: '4px 0 0 0' }}>
          Targeted announcements for {className}-{section}
        </p>
      </div>

      {/* Category Pills */}
      <div style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 4 }}>
        {categories.map((cat) => {
          const isSelected = selectedCategory === cat;
          return (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              style={{
                padding: '6px 14px',
                borderRadius: 20,
                border: isSelected ? 'none' : '1px solid #E2E8F0',
                backgroundColor: isSelected ? '#1769E0' : '#FFFFFF',
                color: isSelected ? '#FFFFFF' : '#64748B',
                fontWeight: 700,
                fontSize: 12,
                cursor: 'pointer',
                whiteSpace: 'nowrap'
              }}
            >
              {cat}
            </button>
          );
        })}
      </div>

      {/* Notice List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {filteredNotices.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 32, backgroundColor: '#FFFFFF', borderRadius: 12, color: '#667085', fontSize: 13, border: '1px solid #E2E8F0' }}>
            No circulars or notices found for this category.
          </div>
        ) : (
          filteredNotices.map((notice) => {
            const style = getCategoryColor(notice.type || notice.category);
            const recipients = notice.recipients || 'both';

            return (
              <div
                key={notice.id}
                className="avm-card"
                onClick={() => handleOpenNotice(notice)}
                style={{
                  padding: 16,
                  position: 'relative',
                  cursor: 'pointer',
                  borderLeft: notice.isUnread ? '4px solid #EF4444' : '4px solid #1769E0',
                  backgroundColor: notice.isUnread ? '#FFFAFA' : '#FFFFFF'
                }}
              >
                {/* Badges Row */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                    <span style={{
                      fontSize: 11,
                      fontWeight: 800,
                      backgroundColor: style.bg,
                      color: style.text,
                      padding: '3px 10px',
                      borderRadius: 12
                    }}>
                      {notice.type || notice.category || 'General'}
                    </span>

                    <span style={{
                      fontSize: 10,
                      fontWeight: 700,
                      backgroundColor: recipients === 'both' ? '#EEF2FF' : '#E0F2FE',
                      color: recipients === 'both' ? '#4F46E5' : '#0284C7',
                      padding: '2px 8px',
                      borderRadius: 10
                    }}>
                      {recipients === 'both' ? '👥 Everyone' : '👨🎓 Students'}
                    </span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ fontSize: 11, color: '#94A3B8' }}>{notice.publishDate || notice.date}</span>
                    {notice.isUnread && (
                      <span style={{
                        padding: '2px 6px',
                        borderRadius: 10,
                        backgroundColor: '#EF4444',
                        color: '#FFFFFF',
                        fontSize: 9,
                        fontWeight: 800
                      }}>
                        NEW
                      </span>
                    )}
                  </div>
                </div>

                <h3 style={{ fontSize: 15, fontWeight: 700, color: '#172033', margin: '0 0 6px 0' }}>
                  {notice.title}
                </h3>
                <p style={{
                  fontSize: 13,
                  color: '#475569',
                  lineHeight: 1.4,
                  margin: '0 0 10px 0',
                  display: '-webkit-box',
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden'
                }}>
                  {notice.description}
                </p>

                {notice.attachmentName && (
                  <div style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                    fontSize: 11,
                    fontWeight: 700,
                    color: '#1769E0',
                    backgroundColor: '#EAF3FF',
                    padding: '4px 10px',
                    borderRadius: 6
                  }}>
                    <Paperclip size={13} /> {notice.attachmentName}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Notice Detail Modal */}
      {activeNoticeModal && (
        <Modal
          isOpen={Boolean(activeNoticeModal)}
          onClose={() => setActiveNoticeModal(null)}
          title="School Notice"
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{
                fontSize: 11,
                fontWeight: 800,
                backgroundColor: getCategoryColor(activeNoticeModal.type || activeNoticeModal.category).bg,
                color: getCategoryColor(activeNoticeModal.type || activeNoticeModal.category).text,
                padding: '4px 10px',
                borderRadius: 12
              }}>
                {activeNoticeModal.type || activeNoticeModal.category || 'General'}
              </span>
              <span style={{ fontSize: 12, color: '#64748B', fontWeight: 600 }}>
                📅 {activeNoticeModal.publishDate || activeNoticeModal.date} • {activeNoticeModal.publishTime || '10:30 AM'}
              </span>
            </div>

            <h3 style={{ fontSize: 17, fontWeight: 800, color: '#0F172A', margin: 0 }}>
              {activeNoticeModal.title}
            </h3>

            <div style={{
              fontSize: 14,
              color: '#334155',
              lineHeight: 1.6,
              backgroundColor: '#F8FAFC',
              padding: 14,
              borderRadius: 10,
              border: '1px solid #E2E8F0',
              whiteSpace: 'pre-line'
            }}>
              {activeNoticeModal.description}
            </div>

            {activeNoticeModal.attachmentName && (
              <div style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                padding: '10px 14px',
                backgroundColor: '#EFF6FF',
                borderRadius: 8,
                color: '#1769E0',
                fontSize: 13,
                fontWeight: 700
              }}>
                <Paperclip size={16} /> Attached Document: {activeNoticeModal.attachmentName}
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 10 }}>
              <button
                className="avm-btn-primary"
                onClick={() => setActiveNoticeModal(null)}
                style={{ padding: '8px 20px', fontSize: 13 }}
              >
                Close Notice
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
