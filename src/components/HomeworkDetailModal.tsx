import React, { useState } from 'react';
import { Homework } from '../types';
import { Modal } from './Modal';
import { Calendar, User, Clock, FileText, Download, Edit3, Trash2, X, ZoomIn, ZoomOut, RotateCcw, Image as ImageIcon, ExternalLink, CheckCircle2 } from 'lucide-react';

interface HomeworkDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  homework: Homework | null;
  role?: 'employee' | 'student' | 'admin';
  onEdit?: (homework: Homework) => void;
  onDelete?: (homeworkId: string) => void;
  onSubmitSolution?: (homework: Homework) => void;
}

export const HomeworkDetailModal: React.FC<HomeworkDetailModalProps> = ({
  isOpen,
  onClose,
  homework,
  role = 'student',
  onEdit,
  onDelete,
  onSubmitSolution
}) => {
  const [fullscreenImage, setFullscreenImage] = useState<string | null>(null);
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);

  if (!isOpen || !homework) return null;

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return 'N/A';
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr;
      return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
    } catch (e) {
      return dateStr;
    }
  };

  const formatTimeStr = (isoStr?: string) => {
    if (!isoStr) return '';
    try {
      const d = new Date(isoStr);
      if (isNaN(d.getTime())) return '';
      return d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
    } catch (e) {
      return '';
    }
  };

  // Collect attachments (both attachmentUrl and attachments array)
  const allAttachments: { name: string; url: string; type: 'image' | 'file'; size?: string }[] = [];

  if (homework.attachmentUrl) {
    const isImg = homework.attachmentUrl.startsWith('data:image') || homework.attachmentUrl.match(/\.(jpg|jpeg|png|webp|gif)/i);
    allAttachments.push({
      name: 'Homework Attachment',
      url: homework.attachmentUrl,
      type: isImg ? 'image' : 'file'
    });
  }

  if (homework.attachments && homework.attachments.length > 0) {
    homework.attachments.forEach((att: any, idx: number) => {
      const url = att.uri || att.dataUrl || att.url || (typeof att === 'string' ? att : '');
      if (url && url !== homework.attachmentUrl) {
        const isImg = url.startsWith('data:image') || (att.type && att.type.includes('image')) || (att.name && att.name.match(/\.(jpg|jpeg|png|webp|gif)/i));
        allAttachments.push({
          name: att.name || `Attachment ${idx + 1}`,
          url,
          type: isImg ? 'image' : 'file',
          size: att.size ? `${Math.round(att.size / 1024)} KB` : undefined
        });
      }
    });
  }

  const handleDelete = () => {
    if (onDelete && homework.id) {
      onDelete(homework.id);
      setDeleteConfirmOpen(false);
      onClose();
    }
  };

  const fullClassSection = homework.className && homework.section
    ? (homework.className.includes('-') ? homework.className : `${homework.className}-${homework.section}`)
    : (homework.className || 'Class 5-A');

  return (
    <>
      <Modal isOpen={isOpen} onClose={onClose} title="Homework Details" maxWidth="620px">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Header Badges & Title */}
          <div style={{ borderBottom: '1px solid #F1F5F9', paddingBottom: 14 }}>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center', marginBottom: 10 }}>
              <span style={{
                fontSize: 12,
                fontWeight: 800,
                color: '#7C3AED',
                backgroundColor: '#F3E8FF',
                padding: '4px 12px',
                borderRadius: 20
              }}>
                {fullClassSection}
              </span>

              <span style={{
                fontSize: 12,
                fontWeight: 800,
                color: '#1769E0',
                backgroundColor: '#EAF3FF',
                padding: '4px 12px',
                borderRadius: 20
              }}>
                {homework.subject}
              </span>

              <span style={{
                fontSize: 11,
                fontWeight: 700,
                padding: '4px 10px',
                borderRadius: 20,
                marginLeft: 'auto',
                backgroundColor: homework.status === 'Completed' ? '#EAF8EF' : homework.status === 'New' ? '#FEF2F2' : '#FFFBEB',
                color: homework.status === 'Completed' ? '#16A34A' : homework.status === 'New' ? '#EF4444' : '#D97706'
              }}>
                {homework.status || 'Assigned'}
              </span>
            </div>

            <h3 style={{ fontSize: 18, fontWeight: 800, color: '#172033', margin: '0 0 6px 0', lineHeight: 1.3 }}>
              {homework.title}
            </h3>

            <div style={{ fontSize: 12, color: '#64748B', display: 'flex', alignItems: 'center', gap: 6 }}>
              <User size={14} color="#7C3AED" />
              <span>Teacher: <strong>{homework.createdByEmployeeName || homework.teacherName || 'Mrs. Priya Sharma'}</strong></span>
              {homework.createdByEmployeeId && <span style={{ color: '#94A3B8' }}>({homework.createdByEmployeeId})</span>}
            </div>
          </div>

          {/* Metadata Grid */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: 12,
            backgroundColor: '#F8FAFC',
            padding: 14,
            borderRadius: 14,
            border: '1px solid #E2E8F0'
          }}>
            <div>
              <div style={{ fontSize: 11, color: '#64748B', fontWeight: 600, marginBottom: 2, display: 'flex', alignItems: 'center', gap: 4 }}>
                <Calendar size={13} color="#1769E0" /> Homework Date
              </div>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#172033' }}>
                {formatDate(homework.homeworkDate || homework.assignedDate)}
              </div>
            </div>

            <div>
              <div style={{ fontSize: 11, color: '#EF4444', fontWeight: 600, marginBottom: 2, display: 'flex', alignItems: 'center', gap: 4 }}>
                <Clock size={13} color="#EF4444" /> Submission Due Date
              </div>
              <div style={{ fontSize: 13, fontWeight: 800, color: '#EF4444' }}>
                {formatDate(homework.dueDate)}
              </div>
            </div>

            <div style={{ gridColumn: 'span 2', borderTop: '1px dashed #E2E8F0', paddingTop: 8, marginTop: 2 }}>
              <div style={{ fontSize: 11, color: '#94A3B8' }}>
                Record ID: <strong style={{ color: '#64748B' }}>{homework.id}</strong>
                {homework.createdAt && (
                  <span style={{ marginLeft: 12 }}>
                    Uploaded: {formatDate(homework.createdAt)} {formatTimeStr(homework.createdAt)}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Detailed Instructions */}
          <div>
            <h4 style={{ fontSize: 13, fontWeight: 700, color: '#475569', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 6 }}>
              <FileText size={16} color="#7C3AED" />
              Detailed Instructions
            </h4>
            <div style={{
              backgroundColor: '#FFFFFF',
              border: '1px solid #E2E8F0',
              borderRadius: 12,
              padding: 14,
              fontSize: 13,
              color: '#334155',
              lineHeight: 1.5,
              whiteSpace: 'pre-wrap'
            }}>
              {homework.instructions || homework.description || 'No detailed instructions provided.'}
            </div>
          </div>

          {/* Attachments Section */}
          {allAttachments.length > 0 && (
            <div>
              <h4 style={{ fontSize: 13, fontWeight: 700, color: '#475569', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
                <ImageIcon size={16} color="#1769E0" />
                Attachments ({allAttachments.length})
              </h4>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {allAttachments.map((att, index) => (
                  <div key={index}>
                    {att.type === 'image' ? (
                      <div
                        onClick={() => {
                          setFullscreenImage(att.url);
                          setZoomLevel(1);
                        }}
                        style={{
                          border: '1.5px solid #CBD5E1',
                          borderRadius: 14,
                          overflow: 'hidden',
                          backgroundColor: '#F1F5F9',
                          cursor: 'pointer',
                          position: 'relative'
                        }}
                      >
                        <img
                          src={att.url}
                          alt={att.name}
                          style={{
                            width: '100%',
                            maxHeight: 220,
                            objectFit: 'contain',
                            backgroundColor: '#0F172A',
                            display: 'block'
                          }}
                        />
                        <div style={{
                          position: 'absolute',
                          bottom: 10,
                          right: 10,
                          backgroundColor: 'rgba(15, 23, 42, 0.75)',
                          color: '#FFFFFF',
                          padding: '4px 10px',
                          borderRadius: 20,
                          fontSize: 11,
                          fontWeight: 700,
                          display: 'flex',
                          alignItems: 'center',
                          gap: 4
                        }}>
                          <ExternalLink size={12} /> Tap for Full Screen
                        </div>
                      </div>
                    ) : (
                      <div style={{
                        border: '1px solid #E2E8F0',
                        borderRadius: 12,
                        padding: 12,
                        backgroundColor: '#F8FAFC',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between'
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <div style={{
                            width: 38,
                            height: 38,
                            borderRadius: 10,
                            backgroundColor: '#1769E0',
                            color: '#FFFFFF',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontWeight: 800,
                            fontSize: 11
                          }}>
                            FILE
                          </div>
                          <div>
                            <div style={{ fontSize: 13, fontWeight: 700, color: '#172033' }}>{att.name}</div>
                            {att.size && <div style={{ fontSize: 11, color: '#64748B' }}>{att.size}</div>}
                          </div>
                        </div>

                        <a
                          href={att.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          download={att.name}
                          className="avm-btn-secondary"
                          style={{ textDecoration: 'none', fontSize: 12, padding: '6px 12px', display: 'flex', alignItems: 'center', gap: 4 }}
                        >
                          <Download size={14} /> View Document
                        </a>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Action Buttons Footer */}
          <div style={{ display: 'flex', gap: 10, borderTop: '1px solid #F1F5F9', paddingTop: 14, marginTop: 6 }}>
            <button type="button" className="avm-btn-secondary" style={{ flex: 1 }} onClick={onClose}>
              Back / Close
            </button>

            {role === 'student' && onSubmitSolution && homework.status !== 'Completed' && (
              <button
                type="button"
                className="avm-btn-primary"
                style={{ flex: 1.5, backgroundColor: '#1769E0' }}
                onClick={() => {
                  onClose();
                  onSubmitSolution(homework);
                }}
              >
                Submit Solution
              </button>
            )}

            {(role === 'employee' || role === 'admin') && (
              <>
                {onEdit && (
                  <button
                    type="button"
                    className="avm-btn-secondary"
                    style={{ flex: 1, color: '#7C3AED', borderColor: '#DDD6FE', backgroundColor: '#F3E8FF' }}
                    onClick={() => {
                      onClose();
                      onEdit(homework);
                    }}
                  >
                    <Edit3 size={14} /> Edit
                  </button>
                )}

                {onDelete && (
                  <button
                    type="button"
                    className="avm-btn-secondary"
                    style={{ flex: 1, color: '#EF4444', borderColor: '#FECACA', backgroundColor: '#FEF2F2' }}
                    onClick={() => setDeleteConfirmOpen(true)}
                  >
                    <Trash2 size={14} /> Delete
                  </button>
                )}
              </>
            )}
          </div>
        </div>
      </Modal>

      {/* --- DELETE CONFIRMATION MODAL --- */}
      {deleteConfirmOpen && (
        <Modal isOpen={deleteConfirmOpen} onClose={() => setDeleteConfirmOpen(false)} title="Delete Homework">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <p style={{ fontSize: 13, color: '#334155', lineHeight: 1.4 }}>
              Are you sure you want to delete <strong>"{homework.title}"</strong> ({homework.subject} - {fullClassSection})?
              This record will be permanently removed from all student and admin views.
            </p>

            <div style={{ display: 'flex', gap: 10, marginTop: 10 }}>
              <button type="button" className="avm-btn-secondary" style={{ flex: 1 }} onClick={() => setDeleteConfirmOpen(false)}>
                Cancel
              </button>
              <button type="button" className="avm-btn-primary" style={{ flex: 1, backgroundColor: '#EF4444' }} onClick={handleDelete}>
                Confirm Delete
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* --- FULL-SCREEN IMAGE VIEWER MODAL --- */}
      {fullscreenImage && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.95)',
          backdropFilter: 'blur(8px)',
          zIndex: 2000,
          display: 'flex',
          flexDirection: 'column'
        }}>
          {/* Viewer Toolbar */}
          <div style={{
            padding: '12px 20px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            borderBottom: '1px solid rgba(255, 255, 255, 0.1)'
          }}>
            <div style={{ color: '#FFFFFF', fontSize: 13, fontWeight: 700 }}>
              Uploaded Image Preview ({Math.round(zoomLevel * 100)}%)
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <button
                type="button"
                onClick={() => setZoomLevel(prev => Math.min(prev + 0.25, 3))}
                style={{ background: 'rgba(255,255,255,0.15)', border: 'none', color: '#FFF', borderRadius: 8, padding: '6px 10px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, fontSize: 12 }}
              >
                <ZoomIn size={16} />
              </button>

              <button
                type="button"
                onClick={() => setZoomLevel(prev => Math.max(prev - 0.25, 0.5))}
                style={{ background: 'rgba(255,255,255,0.15)', border: 'none', color: '#FFF', borderRadius: 8, padding: '6px 10px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, fontSize: 12 }}
              >
                <ZoomOut size={16} />
              </button>

              <button
                type="button"
                onClick={() => setZoomLevel(1)}
                style={{ background: 'rgba(255,255,255,0.15)', border: 'none', color: '#FFF', borderRadius: 8, padding: '6px 10px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, fontSize: 12 }}
              >
                <RotateCcw size={14} /> Reset
              </button>

              <button
                type="button"
                onClick={() => setFullscreenImage(null)}
                style={{ background: '#EF4444', border: 'none', color: '#FFF', borderRadius: '50%', width: 32, height: 32, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >
                <X size={18} />
              </button>
            </div>
          </div>

          {/* Image Canvas Container */}
          <div style={{
            flex: 1,
            overflow: 'auto',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 20
          }}>
            <img
              src={fullscreenImage}
              alt="Full Screen View"
              style={{
                transform: `scale(${zoomLevel})`,
                transition: 'transform 0.15s ease-out',
                maxWidth: '100%',
                maxHeight: '100%',
                objectFit: 'contain',
                borderRadius: 8,
                boxShadow: '0 20px 40px rgba(0,0,0,0.5)'
              }}
            />
          </div>
        </div>
      )}
    </>
  );
};
