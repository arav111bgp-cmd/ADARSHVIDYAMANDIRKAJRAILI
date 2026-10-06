import React, { useState, useEffect } from 'react';
import type { Notice, Employee } from '../types';
import { noticeService } from '../services/noticeService';
import { demoDataStore } from '../services/demoDataStore';
import { Modal } from '../components/Modal';
import { Paperclip, Bell } from 'lucide-react';

interface EmployeeNoticesScreenProps {
  employee?: Employee;
}

export const EmployeeNoticesScreen: React.FC<EmployeeNoticesScreenProps> = ({ employee }) => {
  const [staffNotices, setStaffNotices] = useState<Notice[]>([]);
  const [activeNoticeModal, setActiveNoticeModal] = useState<Notice | null>(null);

  const employeeId = employee?.id || 'EMP-T101';
  const department = employee?.department || 'Academics';

  const fetchNotices = async () => {
    try {
      const data = await noticeService.getNotices('employee', {
        id: employeeId,
        department
      });
      setStaffNotices(data);
    } catch (e) {
      console.warn('Error fetching employee notices:', e);
    }
  };

  useEffect(() => {
    fetchNotices();
    const unsubscribe = demoDataStore.subscribe(() => {
      fetchNotices();
    });
    return () => unsubscribe();
  }, [employeeId, department]);

  const handleOpenNotice = async (notice: Notice) => {
    setActiveNoticeModal(notice);
    if (notice.isUnread) {
      await noticeService.markNoticeAsRead(notice.id, employeeId);
      setStaffNotices((prev) =>
        prev.map((n) => (n.id === notice.id ? { ...n, isUnread: false } : n))
      );
    }
  };

  const getCategoryColor = (type?: string) => {
    switch (type) {
      case 'Holiday': return { bg: '#EAF3FF', text: '#1769E0' };
      case 'Exam': return { bg: '#FFF7ED', text: '#F97316' };
      case 'PTM': return { bg: '#F3E8FF', text: '#7C3AED' };
      case 'Fee': return { bg: '#FEF2F2', text: '#EF4444' };
      case 'Emergency': return { bg: '#FEF2F2', text: '#EF4444' };
      case 'Academic': return { bg: '#F0FDF4', text: '#16A34A' };
      case 'Event': return { bg: '#FCE7F3', text: '#DB2777' };
      default: return { bg: '#F1F5F9', text: '#475569' };
    }
  };

  return (
    <div style={{ padding: '16px 16px 80px 16px', display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div>
        <h2 style={{ fontSize: 18, fontWeight: 800, color: '#172033', margin: 0 }}>Staff Circulars & Notices</h2>
        <p style={{ fontSize: 12, color: '#667085', margin: '4px 0 0 0' }}>
          Internal Announcements for {department} Department
        </p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {staffNotices.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 32, backgroundColor: '#FFFFFF', borderRadius: 12, color: '#667085', fontSize: 13, border: '1px solid #E2E8F0' }}>
            No staff notices found.
          </div>
        ) : (
          staffNotices.map((notice) => {
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
                  borderLeft: notice.isUnread ? '4px solid #EF4444' : '4px solid #7C3AED',
                  backgroundColor: notice.isUnread ? '#FFFAFA' : '#FFFFFF'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
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
                      backgroundColor: recipients === 'both' ? '#EEF2FF' : '#F3E8FF',
                      color: recipients === 'both' ? '#4F46E5' : '#7C3AED',
                      padding: '2px 8px',
                      borderRadius: 10
                    }}>
                      {recipients === 'both' ? '👥 Everyone' : '👨🏫 Employees'}
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
                  margin: 0,
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
                    color: '#7C3AED',
                    backgroundColor: '#F3E8FF',
                    padding: '4px 10px',
                    borderRadius: 6,
                    marginTop: 8
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
          title="Staff Notice"
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
                backgroundColor: '#F3E8FF',
                borderRadius: 8,
                color: '#7C3AED',
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
