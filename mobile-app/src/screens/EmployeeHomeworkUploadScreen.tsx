import React, { useState, useEffect } from 'react';
import { Employee, Homework } from '../types';
import { employeeService } from '../services/employeeService';
import { classService, SCHOOL_CLASSES } from '../services/classService';
import { academicService } from '../services/academicService';
import { homeworkService } from '../services/homeworkService';
import { permissionService } from '../services/permissionService';
import { cloudinaryService } from '../services/cloudinaryService';
import { UploadCloud, Plus, Edit2, History, BookOpen, Calendar, Filter, X, ChevronRight, Eye, ExternalLink } from 'lucide-react';
import { Modal } from '../components/Modal';
import { HomeworkDetailModal } from '../components/HomeworkDetailModal';

interface EmployeeHomeworkUploadScreenProps {
  employee?: Employee;
}

export const EmployeeHomeworkUploadScreen: React.FC<EmployeeHomeworkUploadScreenProps> = ({ employee }) => {
  const teacherClasses = classService.getTeacherClasses(employee?.assignedClasses);
  const todayStr = new Date().toISOString().split('T')[0];

  const [selectedClassObj, setSelectedClassObj] = useState(teacherClasses[0] || SCHOOL_CLASSES[7]);
  const [subjects, setSubjects] = useState<string[]>([]);
  const [subject, setSubject] = useState(employee?.subject || 'Mathematics');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [homeworkDate, setHomeworkDate] = useState(todayStr);
  const [dueDate, setDueDate] = useState(todayStr);
  const [attachment, setAttachment] = useState<any>(null);
  const [uploadingAttachment, setUploadingAttachment] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const handleAttachFile = async (name: string, dataUrl: string, size?: number) => {
    setUploadingAttachment(true);
    setUploadProgress(0);
    try {
      const cloudRes = await cloudinaryService.uploadHomeworkAttachment(
        dataUrl,
        title || name,
        'AVM',
        (percent) => setUploadProgress(percent)
      );
      if (cloudRes && cloudRes.secure_url) {
        setAttachment({
          name: cloudRes.original_filename || name,
          dataUrl: cloudRes.secure_url,
          publicId: cloudRes.public_id,
          resourceType: cloudRes.resource_type,
          size: cloudRes.bytes || size
        });
      } else {
        throw new Error('Upload failed. Please check your internet connection and try again.');
      }
    } catch (err: any) {
      console.error('Homework attachment upload failed:', err);
      alert('Upload failed. Please check your internet connection and try again.');
      setAttachment(null);
    } finally {
      setUploadingAttachment(false);
    }
  };

  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  // Subject Modal States
  const [addSubjectModalOpen, setAddSubjectModalOpen] = useState(false);
  const [newSubjName, setNewSubjName] = useState('');
  const [newSubjCode, setNewSubjCode] = useState('');
  const [newSubjStatus, setNewSubjStatus] = useState<'Active' | 'Inactive'>('Active');

  const [editSubjectModalOpen, setEditSubjectModalOpen] = useState(false);
  const [selectedSubjToEdit, setSelectedSubjToEdit] = useState<string>('');
  const [editSubjName, setEditSubjName] = useState('');
  const [editSubjCode, setEditSubjCode] = useState('');
  const [editSubjStatus, setEditSubjStatus] = useState<'Active' | 'Inactive'>('Active');

  // Homework History Modal States
  const [historyModalOpen, setHistoryModalOpen] = useState(false);
  const [historyList, setHistoryList] = useState<Homework[]>([]);
  const [historyClassFilter, setHistoryClassFilter] = useState<string>('All');
  const [historySubjectFilter, setHistorySubjectFilter] = useState<string>('All');
  const [historyDateFilter, setHistoryDateFilter] = useState<string>('');
  
  // Selected Detail View State
  const [selectedDetailHw, setSelectedDetailHw] = useState<Homework | null>(null);

  // Load active master subjects from academicService
  const refreshSubjects = () => {
    const masterList = academicService.getMasterSubjects();
    const activeSubjs = masterList.filter(s => s.status === 'Active').map(s => s.name);
    if (activeSubjs.length > 0) {
      setSubjects(activeSubjs);
      if (!activeSubjs.includes(subject)) {
        setSubject(activeSubjs[0]);
      }
    } else {
      const defaults = ['Mathematics', 'Science', 'English', 'Hindi', 'Computer Science', 'EVS', 'Social Science', 'GK', 'Drawing'];
      setSubjects(defaults);
    }
  };

  useEffect(() => {
    refreshSubjects();
  }, []);

  // Fetch History and deduplicate by ID
  const loadHistory = async () => {
    try {
      const allHw = await homeworkService.getHomework(null, null);
      // Deduplicate records strictly by ID to prevent UI duplication
      const uniqueHwMap = new Map<string, Homework>();
      allHw.forEach(h => {
        if (h && h.id) uniqueHwMap.set(h.id, h);
      });
      setHistoryList(Array.from(uniqueHwMap.values()));
    } catch (e) {
      console.warn('Failed to load homework history:', e);
    }
  };

  const handleOpenHistory = async () => {
    await loadHistory();
    setHistoryModalOpen(true);
  };

  // Add Subject submit
  const handleAddSubjectSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSubjName.trim()) return;
    const added = academicService.addMasterSubject({
      name: newSubjName.trim(),
      code: newSubjCode.trim() || newSubjName.trim().slice(0, 4).toUpperCase(),
      type: 'Theory',
      maxMarks: 100,
      passingMarks: 33,
      status: newSubjStatus
    });

    refreshSubjects();
    setSubject(added.name);
    setNewSubjName('');
    setNewSubjCode('');
    setAddSubjectModalOpen(false);
  };

  // Edit Subject submit
  const handleEditSubjectSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSubjToEdit || !editSubjName.trim()) return;
    const masterList = academicService.getMasterSubjects();
    const target = masterList.find(s => s.name === selectedSubjToEdit);
    if (target) {
      academicService.updateMasterSubject(target.id, {
        name: editSubjName.trim(),
        code: editSubjCode.trim().toUpperCase(),
        status: editSubjStatus
      });
      refreshSubjects();
      setSubject(editSubjName.trim());
    }
    setEditSubjectModalOpen(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !description) return;
    setSubmitting(true);

    await employeeService.uploadHomework(
      {
        subject,
        title,
        description,
        instructions: description,
        assignedDate: homeworkDate,
        homeworkDate: homeworkDate,
        dueDate,
        className: selectedClassObj.name,
        section: selectedClassObj.section,
        attachmentUrl: attachment ? (attachment.dataUrl || attachment.uri || attachment) : undefined,
        attachments: attachment ? [{ name: attachment.name || 'Attachment', uri: attachment.dataUrl || attachment }] : [],
        teacherId: employee?.id || 'EMP-T102',
        createdByEmployeeId: employee?.id || 'EMP-T102',
        createdByEmployeeName: employee?.name || 'Mrs. Priya Sharma',
        status: 'New'
      },
      employee?.name || 'Mrs. Priya Sharma'
    );

    setSubmitting(false);
    setSuccess(true);
    setTimeout(() => {
      setSuccess(false);
      setTitle('');
      setDescription('');
      setAttachment(null);
    }, 1500);
  };

  // Filtered history list based on Class, Subject, and exact Date
  const filteredHistory = historyList.filter(hw => {
    if (historyClassFilter !== 'All') {
      const matchClass = (hw.className || '').toLowerCase().includes(historyClassFilter.toLowerCase());
      if (!matchClass) return false;
    }
    if (historySubjectFilter !== 'All') {
      if ((hw.subject || '').toLowerCase() !== historySubjectFilter.toLowerCase()) return false;
    }
    if (historyDateFilter) {
      const hwDate = hw.homeworkDate || hw.assignedDate || '';
      if (hwDate !== historyDateFilter) return false;
    }
    return true;
  });

  return (
    <div style={{ padding: '16px 16px 80px 16px', display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ fontSize: 18, fontWeight: 800, color: '#172033' }}>Upload Homework</h2>
          <p style={{ fontSize: 12, color: '#667085' }}>
            Teacher: <strong>{employee?.name || 'Mrs. Priya Sharma'}</strong>
          </p>
        </div>

        <button
          type="button"
          onClick={handleOpenHistory}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            backgroundColor: '#F3E8FF',
            color: '#7C3AED',
            border: '1px solid #DDD6FE',
            borderRadius: 12,
            padding: '8px 14px',
            fontSize: 12,
            fontWeight: 700,
            cursor: 'pointer'
          }}
        >
          <History size={16} />
          <span>View History</span>
        </button>
      </div>

      <form onSubmit={handleSubmit} className="avm-card" style={{ padding: 18 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
          <div>
            <label style={{ fontSize: 12, fontWeight: 700, color: '#475569', display: 'block', marginBottom: 4 }}>
              Assigned Class & Section
            </label>
            <select
              className="avm-input"
              value={selectedClassObj.id}
              onChange={(e) => {
                const found = teacherClasses.find((c) => c.id === e.target.value);
                if (found) setSelectedClassObj(found);
              }}
            >
              {teacherClasses.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
              <label style={{ fontSize: 12, fontWeight: 700, color: '#475569' }}>
                Subject
              </label>
            </div>

            <select
              className="avm-input"
              value={subject}
              onChange={(e) => {
                const val = e.target.value;
                if (val === '__ADD_NEW__') {
                  setAddSubjectModalOpen(true);
                } else if (val === '__EDIT_SUBJ__') {
                  setSelectedSubjToEdit(subject);
                  setEditSubjName(subject);
                  setEditSubjectModalOpen(true);
                } else {
                  setSubject(val);
                }
              }}
            >
              {subjects.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
              <option disabled>──────────</option>
              <option value="__ADD_NEW__">+ Add New Subject</option>
              <option value="__EDIT_SUBJ__">✏ Edit Subjects</option>
            </select>

            <div style={{ display: 'flex', gap: 10, marginTop: 6 }}>
              <button
                type="button"
                onClick={() => setAddSubjectModalOpen(true)}
                style={{ background: 'none', border: 'none', color: '#7C3AED', fontSize: 11, fontWeight: 700, cursor: 'pointer', padding: 0 }}
              >
                + Add New Subject
              </button>
              <span style={{ color: '#CBD5E1', fontSize: 11 }}>|</span>
              <button
                type="button"
                onClick={() => {
                  setSelectedSubjToEdit(subject);
                  setEditSubjName(subject);
                  setEditSubjectModalOpen(true);
                }}
                style={{ background: 'none', border: 'none', color: '#475569', fontSize: 11, fontWeight: 700, cursor: 'pointer', padding: 0 }}
              >
                ✏ Edit Subjects
              </button>
            </div>
          </div>
        </div>

        <div style={{ marginBottom: 14 }}>
          <label style={{ fontSize: 12, fontWeight: 700, color: '#475569', display: 'block', marginBottom: 4 }}>
            Homework Title
          </label>
          <input
            type="text"
            className="avm-input"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Fractions Exercise"
            required
          />
        </div>

        <div style={{ marginBottom: 14 }}>
          <label style={{ fontSize: 12, fontWeight: 700, color: '#475569', display: 'block', marginBottom: 4 }}>
            Detailed Instructions
          </label>
          <textarea
            className="avm-input"
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Write clear instructions for students..."
            required
          />
        </div>

        {/* Date Row: Homework Date & Due Date */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
          <div>
            <label style={{ fontSize: 12, fontWeight: 700, color: '#475569', display: 'block', marginBottom: 4 }}>
              Homework Date
            </label>
            <input
              type="date"
              className="avm-input"
              value={homeworkDate}
              onChange={(e) => setHomeworkDate(e.target.value)}
              required
            />
          </div>

          <div>
            <label style={{ fontSize: 12, fontWeight: 700, color: '#475569', display: 'block', marginBottom: 4 }}>
              Due Date
            </label>
            <input
              type="date"
              className="avm-input"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              required
            />
          </div>
        </div>

        {/* Media & Attachment Picker */}
        <div style={{ marginBottom: 16 }}>
          <label style={{ fontSize: 12, fontWeight: 700, color: '#475569', display: 'block', marginBottom: 6 }}>
            Attach Worksheets, Photos or Documents
          </label>

          {uploadingAttachment ? (
            <div style={{ border: '1.5px dashed #7C3AED', backgroundColor: '#F3E8FF', borderRadius: 12, padding: 14, textAlign: 'center' }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#7C3AED', marginBottom: 6 }}>
                Uploading to Cloudinary... {uploadProgress}%
              </div>
              <div style={{ width: '100%', height: 6, backgroundColor: '#DDD6FE', borderRadius: 3, overflow: 'hidden' }}>
                <div style={{ width: `${uploadProgress}%`, height: '100%', backgroundColor: '#7C3AED', transition: 'width 0.2s ease-in-out' }} />
              </div>
            </div>
          ) : attachment ? (
            <div style={{ border: '1.5px solid #7C3AED', backgroundColor: '#F3E8FF', borderRadius: 12, padding: 12, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                {attachment.dataUrl?.startsWith('http') || attachment.dataUrl?.startsWith('data:image') ? (
                  <img src={attachment.dataUrl} alt="Preview" style={{ width: 44, height: 44, borderRadius: 8, objectFit: 'cover' }} />
                ) : (
                  <div style={{ width: 44, height: 44, borderRadius: 8, backgroundColor: '#7C3AED', color: '#FFF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 11 }}>
                    DOC
                  </div>
                )}
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#172033', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {attachment.name}
                  </div>
                  <div style={{ fontSize: 11, color: '#667085' }}>
                    {attachment.publicId ? 'Uploaded to Cloudinary ✓' : attachment.size ? `${Math.round(attachment.size / 1024)} KB` : 'Attached'}
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setAttachment(null)}
                style={{ background: 'none', border: 'none', color: '#EF4444', fontWeight: 700, cursor: 'pointer', fontSize: 12 }}
              >
                Remove
              </button>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <button
                type="button"
                onClick={async () => {
                  const res = await permissionService.capturePhoto('camera');
                  if (res.success && res.dataUrl) {
                    await handleAttachFile('Class_Photo_' + Date.now().toString().slice(-4) + '.jpg', res.dataUrl, 120000);
                  }
                }}
                className="avm-btn-secondary"
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: 12, borderRadius: 12, fontSize: 12, fontWeight: 700 }}
              >
                <UploadCloud size={16} color="#7C3AED" />
                <span>Camera Photo</span>
              </button>

              <button
                type="button"
                onClick={async () => {
                  const res = await permissionService.pickDocument('image/*,video/*,application/pdf');
                  if (res.success && res.dataUrl) {
                    await handleAttachFile(res.name || 'Worksheet_Doc', res.dataUrl, res.size);
                  }
                }}
                className="avm-btn-secondary"
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: 12, borderRadius: 12, fontSize: 12, fontWeight: 700 }}
              >
                <UploadCloud size={16} color="#7C3AED" />
                <span>Gallery / File</span>
              </button>
            </div>
          )}
        </div>

        {success ? (
          <div style={{ backgroundColor: '#EAF8EF', color: '#16A34A', padding: 12, borderRadius: 10, textAlign: 'center', fontWeight: 700 }}>
            ✓ Homework Assigned to {selectedClassObj.name}!
          </div>
        ) : (
          <button type="submit" className="avm-btn-primary" style={{ width: '100%', backgroundColor: '#7C3AED' }} disabled={submitting}>
            {submitting ? 'Publishing Homework...' : 'Send Homework to Students'}
          </button>
        )}
      </form>

      {/* --- ADD NEW SUBJECT MODAL --- */}
      <Modal isOpen={addSubjectModalOpen} onClose={() => setAddSubjectModalOpen(false)} title="Add New Subject">
        <form onSubmit={handleAddSubjectSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <label style={{ fontSize: 12, fontWeight: 700, color: '#475569', display: 'block', marginBottom: 4 }}>
              Subject Name <span style={{ color: '#EF4444' }}>*</span>
            </label>
            <input
              type="text"
              className="avm-input"
              value={newSubjName}
              onChange={(e) => setNewSubjName(e.target.value)}
              placeholder="e.g. General Knowledge"
              required
            />
          </div>

          <div>
            <label style={{ fontSize: 12, fontWeight: 700, color: '#475569', display: 'block', marginBottom: 4 }}>
              Subject Code (Optional)
            </label>
            <input
              type="text"
              className="avm-input"
              value={newSubjCode}
              onChange={(e) => setNewSubjCode(e.target.value)}
              placeholder="e.g. GK"
            />
          </div>

          <div>
            <label style={{ fontSize: 12, fontWeight: 700, color: '#475569', display: 'block', marginBottom: 4 }}>
              Status
            </label>
            <select
              className="avm-input"
              value={newSubjStatus}
              onChange={(e) => setNewSubjStatus(e.target.value as any)}
            >
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
            </select>
          </div>

          <div style={{ display: 'flex', gap: 10, marginTop: 10 }}>
            <button type="button" className="avm-btn-secondary" style={{ flex: 1 }} onClick={() => setAddSubjectModalOpen(false)}>
              Cancel
            </button>
            <button type="submit" className="avm-btn-primary" style={{ flex: 1, backgroundColor: '#7C3AED' }}>
              Save Subject
            </button>
          </div>
        </form>
      </Modal>

      {/* --- EDIT SUBJECT MODAL --- */}
      <Modal isOpen={editSubjectModalOpen} onClose={() => setEditSubjectModalOpen(false)} title="Edit Subjects">
        <form onSubmit={handleEditSubjectSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <label style={{ fontSize: 12, fontWeight: 700, color: '#475569', display: 'block', marginBottom: 4 }}>
              Select Subject to Edit
            </label>
            <select
              className="avm-input"
              value={selectedSubjToEdit}
              onChange={(e) => {
                const s = e.target.value;
                setSelectedSubjToEdit(s);
                setEditSubjName(s);
                const master = academicService.getMasterSubjects().find(m => m.name === s);
                if (master) {
                  setEditSubjCode(master.code || '');
                  setEditSubjStatus((master.status as 'Active' | 'Inactive') || 'Active');
                }
              }}
            >
              {subjects.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>

          <div>
            <label style={{ fontSize: 12, fontWeight: 700, color: '#475569', display: 'block', marginBottom: 4 }}>
              Updated Subject Name <span style={{ color: '#EF4444' }}>*</span>
            </label>
            <input
              type="text"
              className="avm-input"
              value={editSubjName}
              onChange={(e) => setEditSubjName(e.target.value)}
              required
            />
          </div>

          <div>
            <label style={{ fontSize: 12, fontWeight: 700, color: '#475569', display: 'block', marginBottom: 4 }}>
              Subject Code
            </label>
            <input
              type="text"
              className="avm-input"
              value={editSubjCode}
              onChange={(e) => setEditSubjCode(e.target.value)}
            />
          </div>

          <div>
            <label style={{ fontSize: 12, fontWeight: 700, color: '#475569', display: 'block', marginBottom: 4 }}>
              Status
            </label>
            <select
              className="avm-input"
              value={editSubjStatus}
              onChange={(e) => setEditSubjStatus(e.target.value as any)}
            >
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
            </select>
          </div>

          <div style={{ display: 'flex', gap: 10, marginTop: 10 }}>
            <button type="button" className="avm-btn-secondary" style={{ flex: 1 }} onClick={() => setEditSubjectModalOpen(false)}>
              Cancel
            </button>
            <button type="submit" className="avm-btn-primary" style={{ flex: 1, backgroundColor: '#7C3AED' }}>
              Save Changes
            </button>
          </div>
        </form>
      </Modal>

      {/* --- HOMEWORK HISTORY MODAL --- */}
      <Modal isOpen={historyModalOpen} onClose={() => setHistoryModalOpen(false)} title="Uploaded Homework History" maxWidth="640px">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {/* History Filters */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, backgroundColor: '#F8FAFC', padding: 12, borderRadius: 12, border: '1px solid #E2E8F0' }}>
            <div>
              <label style={{ fontSize: 11, fontWeight: 700, color: '#64748B', display: 'block', marginBottom: 2 }}>Class</label>
              <select
                className="avm-input"
                style={{ padding: '6px 8px', fontSize: 11 }}
                value={historyClassFilter}
                onChange={(e) => setHistoryClassFilter(e.target.value)}
              >
                <option value="All">All Classes</option>
                {SCHOOL_CLASSES.map(c => (
                  <option key={c.id} value={c.name}>{c.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label style={{ fontSize: 11, fontWeight: 700, color: '#64748B', display: 'block', marginBottom: 2 }}>Subject</label>
              <select
                className="avm-input"
                style={{ padding: '6px 8px', fontSize: 11 }}
                value={historySubjectFilter}
                onChange={(e) => setHistorySubjectFilter(e.target.value)}
              >
                <option value="All">All Subjects</option>
                {subjects.map(s => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>

            <div>
              <label style={{ fontSize: 11, fontWeight: 700, color: '#64748B', display: 'block', marginBottom: 2 }}>Date</label>
              <input
                type="date"
                className="avm-input"
                style={{ padding: '4px 6px', fontSize: 11 }}
                value={historyDateFilter}
                onChange={(e) => setHistoryDateFilter(e.target.value)}
              />
            </div>
          </div>

          {/* History Cards List */}
          {filteredHistory.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 24, color: '#667085', fontSize: 13 }}>
              No homework found for the selected filter.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, maxHeight: '60vh', overflowY: 'auto' }}>
              {filteredHistory.map((hw) => (
                <div
                  key={hw.id}
                  onClick={() => setSelectedDetailHw(hw)}
                  style={{
                    border: '1px solid #E2E8F0',
                    borderRadius: 12,
                    padding: 14,
                    backgroundColor: '#FFFFFF',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease-in-out',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.02)'
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.borderColor = '#7C3AED')}
                  onMouseLeave={(e) => (e.currentTarget.style.borderColor = '#E2E8F0')}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
                    <div>
                      <span style={{ fontSize: 11, fontWeight: 800, color: '#7C3AED', backgroundColor: '#F3E8FF', padding: '2px 8px', borderRadius: 8, marginRight: 6 }}>
                        {hw.className || 'Class 5-A'}
                      </span>
                      <span style={{ fontSize: 11, fontWeight: 700, color: '#1769E0', backgroundColor: '#EAF3FF', padding: '2px 8px', borderRadius: 8 }}>
                        {hw.subject}
                      </span>
                    </div>

                    <span style={{ fontSize: 11, color: '#64748B', fontWeight: 600 }}>
                      HW Date: <strong>{hw.homeworkDate || hw.assignedDate}</strong>
                    </span>
                  </div>

                  <h4 style={{ fontSize: 14, fontWeight: 700, color: '#172033', margin: '4px 0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span>{hw.title}</span>
                    <span style={{ fontSize: 11, color: '#7C3AED', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 2 }}>
                      View Detail <ChevronRight size={14} />
                    </span>
                  </h4>
                  <p style={{ fontSize: 12, color: '#475569', margin: '0 0 8px 0', lineHeight: 1.4, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                    {hw.instructions || hw.description}
                  </p>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #F1F5F9', paddingTop: 8, fontSize: 11, color: '#64748B' }}>
                    <div>Teacher: <strong>{hw.createdByEmployeeName || hw.teacherName}</strong></div>
                    <div style={{ color: '#EF4444', fontWeight: 700 }}>Due: {hw.dueDate}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </Modal>

      {/* --- COMPLETE HOMEWORK DETAIL MODAL --- */}
      <HomeworkDetailModal
        isOpen={!!selectedDetailHw}
        onClose={() => setSelectedDetailHw(null)}
        homework={selectedDetailHw}
        role="employee"
        onDelete={async (id) => {
          await homeworkService.deleteHomework(id);
          await loadHistory();
          setSelectedDetailHw(null);
        }}
      />
    </div>
  );
};
