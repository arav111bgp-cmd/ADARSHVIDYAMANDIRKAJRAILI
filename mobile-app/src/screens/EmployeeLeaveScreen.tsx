import React, { useState, useEffect, useRef } from 'react';
import { LeaveApplication, Employee } from '../types';
import { employeeService } from '../services/employeeService';
import { cloudinaryService } from '../services/cloudinaryService';
import { demoDataStore } from '../services/demoDataStore';

import {
  Calendar,
  CheckCircle2,
  Clock,
  Camera,
  Image as ImageIcon,
  Trash2,
  Eye,
  FileText,
  AlertCircle,
  XCircle,
  ArrowLeft,
  X,
  Paperclip,
  Check,
  RotateCcw,
  UserCheck
} from 'lucide-react';

interface EmployeeLeaveScreenProps {
  employee?: Employee;
  onBack?: () => void;
}

export const EmployeeLeaveScreen: React.FC<EmployeeLeaveScreenProps> = ({ employee, onBack }) => {
  const empId = employee?.id || employee?.employeeId || 'EMP-T101';
  const empName = employee?.name || 'Mrs. Priya Sharma';
  const empDept = employee?.department || 'Academics';
  const empDesig = employee?.designation || 'Senior Mathematics Teacher';

  const todayStr = new Date().toISOString().split('T')[0];

  const [leaves, setLeaves] = useState<LeaveApplication[]>([]);
  const [fromDate, setFromDate] = useState<string>(todayStr);
  const [toDate, setToDate] = useState<string>(todayStr);
  const [reason, setReason] = useState<string>('');

  // Supporting Document State
  const [documentPhoto, setDocumentPhoto] = useState<string | undefined>(undefined);
  const [documentFileName, setDocumentFileName] = useState<string | undefined>(undefined);

  // Modal States
  const [showConfirmModal, setShowConfirmModal] = useState<boolean>(false);
  const [showHistoryModal, setShowHistoryModal] = useState<boolean>(false);
  const [selectedLeaveDetail, setSelectedLeaveDetail] = useState<LeaveApplication | null>(null);
  const [fullScreenImage, setFullScreenImage] = useState<string | null>(null);
  const [confirmCancelLeaveId, setConfirmCancelLeaveId] = useState<string | null>(null);

  // History Filter States
  const [historyYear, setHistoryYear] = useState<string>('2026');
  const [historyMonth, setHistoryMonth] = useState<string>('All');
  const [historyStatus, setHistoryStatus] = useState<string>('All');

  const [submitting, setSubmitting] = useState(false);
  const [alertMsg, setAlertMsg] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);

  // Hidden File Inputs for Fallback Camera & Gallery
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);

  const fetchLeaves = async () => {
    try {
      const records = await employeeService.getLeaves(empId);
      setLeaves(records);
    } catch (e) {
      console.warn('Error fetching leave applications:', e);
    }
  };

  useEffect(() => {
    fetchLeaves();
    const unsubscribe = demoDataStore.subscribe(() => {
      fetchLeaves();
    });
    return () => unsubscribe();
  }, [empId]);

  // Duration calculation
  const calculateDurationDays = (startStr: string, endStr: string): number => {
    if (!startStr || !endStr) return 0;
    const dStart = new Date(startStr);
    const dEnd = new Date(endStr);
    if (isNaN(dStart.getTime()) || isNaN(dEnd.getTime())) return 0;
    const diffTime = dEnd.getTime() - dStart.getTime();
    if (diffTime < 0) return 0;
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
  };

  const totalDays = calculateDurationDays(fromDate, toDate);

  // File Upload Handlers
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>, isCamera = false) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const allowed = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'application/pdf'];
    if (!allowed.includes(file.type.toLowerCase()) && !file.type.startsWith('image/')) {
      setAlertMsg({ type: 'error', text: 'Please select a valid file format (JPG, PNG, WEBP, PDF).' });
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setAlertMsg({ type: 'error', text: 'File size exceeds maximum limit of 10 MB.' });
      return;
    }

    const reader = new FileReader();
    reader.onload = async () => {
      const resultStr = reader.result as string;
      const fileName = file.name || (isCamera ? 'Camera_Application_Photo.jpg' : 'Gallery_Application_Photo.jpg');

      try {
        const cloudRes = await cloudinaryService.uploadLeaveDocument(
          resultStr,
          `leave_${empId}`,
          'AVM'
        );
        if (cloudRes && cloudRes.secure_url) {
          setDocumentPhoto(cloudRes.secure_url);
          setDocumentFileName(fileName);
          setAlertMsg({ type: 'success', text: 'Application document uploaded to Cloudinary ✓' });
        } else {
          throw new Error('Upload failed. Please check your internet connection and try again.');
        }
      } catch (err: any) {
        console.error('Leave document Cloudinary upload error:', err);
        setDocumentPhoto(undefined);
        setDocumentFileName(undefined);
        setAlertMsg({ type: 'error', text: 'Upload failed. Please check your internet connection and try again.' });
      }
    };
    reader.readAsDataURL(file);
  };

  const triggerCamera = () => {
    if (cameraInputRef.current) {
      cameraInputRef.current.click();
    }
  };

  const triggerGallery = () => {
    if (galleryInputRef.current) {
      galleryInputRef.current.click();
    }
  };

  const handleRemovePhoto = () => {
    setDocumentPhoto(undefined);
    setDocumentFileName(undefined);
    setAlertMsg({ type: 'info', text: 'Attached photo removed.' });
  };

  // Form Submit Verification
  const handleOpenConfirm = (e: React.FormEvent) => {
    e.preventDefault();
    setAlertMsg(null);

    if (!fromDate || !toDate) {
      setAlertMsg({ type: 'error', text: 'Please select both From Date and To Date.' });
      return;
    }

    const dFrom = new Date(fromDate);
    const dTo = new Date(toDate);
    if (dTo < dFrom) {
      setAlertMsg({ type: 'error', text: 'To Date cannot be before From Date.' });
      return;
    }

    if (!reason.trim()) {
      setAlertMsg({ type: 'error', text: 'Please write a clear reason for your leave request.' });
      return;
    }

    setShowConfirmModal(true);
  };

  const handleConfirmSubmit = async () => {
    setShowConfirmModal(false);
    setSubmitting(true);
    setAlertMsg(null);

    const res = await employeeService.applyLeave({
      employeeId: empId,
      employeeName: empName,
      employeeDepartment: empDept,
      employeeDesignation: empDesig,
      fromDate,
      toDate,
      reason,
      documentPhoto,
      documentFileName
    });

    setSubmitting(false);

    if (res.success) {
      setAlertMsg({
        type: 'success',
        text: `✓ Leave application submitted successfully. Application ID: ${res.id}`
      });
      setReason('');
      setDocumentPhoto(undefined);
      setDocumentFileName(undefined);
      fetchLeaves();
    } else {
      setAlertMsg({ type: 'error', text: 'Failed to submit leave application.' });
    }
  };

  const handleConfirmCancelLeave = async (leaveId: string) => {
    await employeeService.cancelLeave(leaveId);
    setConfirmCancelLeaveId(null);
    setSelectedLeaveDetail(null);
    fetchLeaves();
    setAlertMsg({ type: 'info', text: `Leave application ${leaveId} cancelled.` });
  };

  // Date Formatting Helper
  const getFullFormattedDate = (dateStr: string) => {
    if (!dateStr) return '';
    const parts = dateStr.split('-').map(Number);
    if (parts.length < 3) return dateStr;
    const d = new Date(parts[0], parts[1] - 1, parts[2]);
    return d.toLocaleDateString('en-GB', {
      weekday: 'long',
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    });
  };

  const getStatusBadgeColor = (status?: string) => {
    const s = (status || '').toUpperCase();
    switch (s) {
      case 'APPROVED':
      case 'APPROVED ✓':
        return { bg: '#DCFCE7', color: '#15803D', border: '#86EFAC', icon: '🟢' };
      case 'REJECTED':
      case 'REJECTED ✕':
        return { bg: '#FEE2E2', color: '#B91C1C', border: '#FCA5A5', icon: '🔴' };
      case 'CANCELLED':
        return { bg: '#F1F5F9', color: '#64748B', border: '#CBD5E1', icon: '⚪' };
      default:
        return { bg: '#FEF3C7', color: '#B45309', border: '#FDE68A', icon: '🟠' };
    }
  };

  // Filtered History List
  const filteredHistory = leaves.filter((l) => {
    const statusUpper = (l.status || '').toUpperCase();
    if (historyStatus !== 'All' && statusUpper !== historyStatus.toUpperCase()) {
      return false;
    }
    if (historyYear !== 'All' && !l.fromDate?.startsWith(historyYear)) {
      return false;
    }
    if (historyMonth !== 'All') {
      const parts = l.fromDate?.split('-');
      if (parts && parts.length >= 2 && parts[1] !== historyMonth) {
        return false;
      }
    }
    return true;
  });

  const monthList = [
    { value: 'All', label: 'All Months' },
    { value: '01', label: 'January' },
    { value: '02', label: 'February' },
    { value: '03', label: 'March' },
    { value: '04', label: 'April' },
    { value: '05', label: 'May' },
    { value: '06', label: 'June' },
    { value: '07', label: 'July' },
    { value: '08', label: 'August' },
    { value: '09', label: 'September' },
    { value: '10', label: 'October' },
    { value: '11', label: 'November' },
    { value: '12', label: 'December' }
  ];

  return (
    <div style={{ padding: '16px 16px 80px 16px', display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Hidden File Inputs for Camera & Gallery */}
      <input
        type="file"
        ref={cameraInputRef}
        accept="image/*"
        capture="environment"
        style={{ display: 'none' }}
        onChange={(e) => handleFileSelect(e, true)}
      />
      <input
        type="file"
        ref={galleryInputRef}
        accept="image/*"
        style={{ display: 'none' }}
        onChange={(e) => handleFileSelect(e, false)}
      />

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {onBack && (
            <button
              onClick={onBack}
              style={{
                width: 38,
                height: 38,
                borderRadius: 12,
                border: '1px solid #E2E8F0',
                backgroundColor: '#FFFFFF',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#1E293B',
                cursor: 'pointer'
              }}
            >
              <ArrowLeft size={18} />
            </button>
          )}
          <div>
            <h1 style={{ fontSize: 20, fontWeight: 800, color: '#0F172A', margin: 0, lineHeight: 1.2 }}>
              Apply Leave
            </h1>
            <p style={{ fontSize: 13, color: '#64748B', margin: '2px 0 0 0' }}>
              Staff Leave Application & History
            </p>
          </div>
        </div>

        <button
          onClick={() => setShowHistoryModal(true)}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            padding: '8px 14px',
            borderRadius: 12,
            backgroundColor: '#1769E0',
            color: '#FFFFFF',
            border: 'none',
            fontSize: 13,
            fontWeight: 800,
            cursor: 'pointer',
            boxShadow: '0 4px 12px rgba(23,105,224,0.3)'
          }}
        >
          <Calendar size={15} />
          <span>View History</span>
        </button>
      </div>

      {/* Alert Banner */}
      {alertMsg && (
        <div
          style={{
            padding: '12px 14px',
            borderRadius: 14,
            fontSize: 13,
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            backgroundColor:
              alertMsg.type === 'success' ? '#F0FDF4' : alertMsg.type === 'error' ? '#FEF2F2' : '#EFF6FF',
            color:
              alertMsg.type === 'success' ? '#166534' : alertMsg.type === 'error' ? '#991B1B' : '#1E40AF',
            border: `1px solid ${
              alertMsg.type === 'success' ? '#BBF7D0' : alertMsg.type === 'error' ? '#FECACA' : '#BFDBFE'
            }`
          }}
        >
          {alertMsg.type === 'success' ? (
            <CheckCircle2 size={18} />
          ) : alertMsg.type === 'error' ? (
            <XCircle size={18} />
          ) : (
            <AlertCircle size={18} />
          )}
          <span style={{ flex: 1 }}>{alertMsg.text}</span>
        </div>
      )}

      {/* LEAVE APPLICATION FORM CARD */}
      <form onSubmit={handleOpenConfirm} className="avm-card" style={{ padding: 18, display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ fontSize: 16, fontWeight: 800, color: '#0F172A', margin: 0 }}>
            Leave Application Form
          </h3>
          <span style={{ fontSize: 11, fontWeight: 700, color: '#64748B' }}>
            {empName}
          </span>
        </div>

        {/* Date Inputs */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div>
            <label style={{ fontSize: 11, fontWeight: 800, color: '#475569', display: 'block', marginBottom: 4 }}>
              From Date
            </label>
            <input
              type="date"
              className="avm-input"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              required
              style={{ width: '100%', padding: '10px 12px', borderRadius: 12, border: '1px solid #CBD5E1', fontSize: 13, fontWeight: 700 }}
            />
          </div>

          <div>
            <label style={{ fontSize: 11, fontWeight: 800, color: '#475569', display: 'block', marginBottom: 4 }}>
              To Date
            </label>
            <input
              type="date"
              className="avm-input"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              required
              style={{ width: '100%', padding: '10px 12px', borderRadius: 12, border: '1px solid #CBD5E1', fontSize: 13, fontWeight: 700 }}
            />
          </div>
        </div>

        {/* Leave Duration Badge */}
        <div
          style={{
            padding: '10px 14px',
            borderRadius: 12,
            backgroundColor: totalDays > 0 ? '#EFF6FF' : '#FEF2F2',
            border: `1px solid ${totalDays > 0 ? '#BFDBFE' : '#FECACA'}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            fontSize: 13
          }}
        >
          <span style={{ color: '#475569', fontWeight: 600 }}>Calculated Leave Duration:</span>
          <span style={{ fontWeight: 800, color: totalDays > 0 ? '#1D4ED8' : '#DC2626' }}>
            {totalDays > 0 ? `${totalDays} ${totalDays === 1 ? 'Day' : 'Days'}` : 'Invalid Date Range'}
          </span>
        </div>

        {/* Reason for Leave */}
        <div>
          <label style={{ fontSize: 11, fontWeight: 800, color: '#475569', display: 'block', marginBottom: 4 }}>
            Reason for Leave
          </label>
          <textarea
            className="avm-input"
            rows={3}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Write clear reason for leave request..."
            required
            style={{ width: '100%', padding: '10px 12px', borderRadius: 12, border: '1px solid #CBD5E1', fontSize: 13 }}
          />
        </div>

        {/* Supporting Document / Leave Application Photo Upload */}
        <div style={{ padding: 14, borderRadius: 14, backgroundColor: '#F8FAFC', border: '1px solid #E2E8F0', display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div>
            <div style={{ fontSize: 13, fontWeight: 800, color: '#0F172A' }}>
              Supporting Document / Leave Application
            </div>
            <div style={{ fontSize: 11, color: '#64748B', marginTop: 2 }}>
              Optional — Upload a photo of your written leave application or medical certificate.
            </div>
          </div>

          {!documentPhoto ? (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <button
                type="button"
                onClick={triggerCamera}
                style={{
                  padding: '12px 10px',
                  borderRadius: 12,
                  border: '1.5px dashed #1769E0',
                  backgroundColor: '#EFF6FF',
                  color: '#1D4ED8',
                  fontSize: 12,
                  fontWeight: 800,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 6,
                  cursor: 'pointer'
                }}
              >
                <Camera size={16} />
                <span>📷 Take Photo</span>
              </button>

              <button
                type="button"
                onClick={triggerGallery}
                style={{
                  padding: '12px 10px',
                  borderRadius: 12,
                  border: '1px solid #CBD5E1',
                  backgroundColor: '#FFFFFF',
                  color: '#475569',
                  fontSize: 12,
                  fontWeight: 800,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 6,
                  cursor: 'pointer'
                }}
              >
                <ImageIcon size={16} />
                <span>🖼 Choose Gallery</span>
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 10, borderRadius: 12, backgroundColor: '#FFFFFF', border: '1px solid #BBF7D0' }}>
                <img
                  src={documentPhoto}
                  alt="Application Preview"
                  onClick={() => setFullScreenImage(documentPhoto)}
                  style={{ width: 48, height: 48, borderRadius: 8, objectFit: 'cover', cursor: 'pointer', border: '1px solid #CBD5E1' }}
                />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 12, fontWeight: 800, color: '#15803D', display: 'flex', alignItems: 'center', gap: 4 }}>
                    <CheckCircle2 size={14} />
                    <span>Application Photo Attached</span>
                  </div>
                  <div style={{ fontSize: 11, color: '#64748B', marginTop: 2 }}>
                    {documentFileName || 'Leave_Application_Photo.jpg'}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setFullScreenImage(documentPhoto)}
                  style={{ padding: '6px 10px', borderRadius: 8, border: '1px solid #CBD5E1', backgroundColor: '#F8FAFC', fontSize: 11, fontWeight: 700, color: '#475569', cursor: 'pointer' }}
                >
                  <Eye size={14} />
                </button>
              </div>

              <div style={{ display: 'flex', gap: 10 }}>
                <button
                  type="button"
                  onClick={triggerCamera}
                  style={{ flex: 1, padding: '8px', borderRadius: 8, border: '1px solid #CBD5E1', backgroundColor: '#FFFFFF', fontSize: 11, fontWeight: 700, color: '#475569', cursor: 'pointer' }}
                >
                  Replace Photo
                </button>

                <button
                  type="button"
                  onClick={handleRemovePhoto}
                  style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid #FCA5A5', backgroundColor: '#FEF2F2', fontSize: 11, fontWeight: 700, color: '#B91C1C', cursor: 'pointer' }}
                >
                  Remove
                </button>
              </div>
            </div>
          )}
        </div>

        <button
          type="submit"
          disabled={submitting || totalDays <= 0}
          style={{
            width: '100%',
            padding: '14px',
            borderRadius: 14,
            backgroundColor: totalDays > 0 ? '#1769E0' : '#94A3B8',
            color: '#FFFFFF',
            border: 'none',
            fontSize: 15,
            fontWeight: 800,
            cursor: totalDays > 0 ? 'pointer' : 'not-allowed',
            boxShadow: totalDays > 0 ? '0 4px 14px rgba(23,105,224,0.3)' : 'none',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8
          }}
        >
          <FileText size={18} />
          <span>{submitting ? 'Submitting...' : 'Submit Application'}</span>
        </button>
      </form>

      {/* RECENT LEAVE APPLICATION LOGS CARD */}
      <div className="avm-card" style={{ padding: 18 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <h3 style={{ fontSize: 15, fontWeight: 800, color: '#0F172A', margin: 0 }}>
            Leave Application Logs
          </h3>
          <span style={{ fontSize: 12, fontWeight: 700, color: '#1769E0' }}>
            {leaves.length} Total
          </span>
        </div>

        {leaves.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '30px 10px', color: '#94A3B8' }}>
            <Calendar size={36} style={{ opacity: 0.5, marginBottom: 8 }} />
            <div style={{ fontSize: 14, fontWeight: 700, color: '#475569' }}>No Leave Applications Yet</div>
            <div style={{ fontSize: 12, color: '#94A3B8', marginTop: 2 }}>Your submitted leave applications will appear here.</div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {leaves.slice(0, 4).map((l) => {
              const badge = getStatusBadgeColor(l.status);
              return (
                <div
                  key={l.id}
                  onClick={() => setSelectedLeaveDetail(l)}
                  style={{
                    backgroundColor: '#FFFFFF',
                    borderRadius: 14,
                    padding: 14,
                    border: '1px solid #E2E8F0',
                    boxShadow: '0 2px 6px rgba(0,0,0,0.03)',
                    cursor: 'pointer',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}
                >
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 800, color: '#0F172A' }}>
                      {l.fromDate} to {l.toDate} ({l.totalDays || 1} {l.totalDays === 1 ? 'Day' : 'Days'})
                    </div>
                    <div style={{ fontSize: 12, color: '#475569', marginTop: 4, fontWeight: 600 }}>
                      {l.reason}
                    </div>
                    <div style={{ fontSize: 11, color: '#64748B', marginTop: 3, display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span>Submitted: {l.submittedAt || l.appliedOn}</span>
                      {l.documentPhoto && (
                        <span style={{ color: '#1769E0', fontWeight: 700 }}>📎 Photo</span>
                      )}
                    </div>
                  </div>

                  <span
                    style={{
                      fontSize: 11,
                      fontWeight: 800,
                      padding: '4px 10px',
                      borderRadius: 12,
                      backgroundColor: badge.bg,
                      color: badge.color,
                      border: `1px solid ${badge.border}`
                    }}
                  >
                    {badge.icon} {l.status}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* CONFIRMATION MODAL BEFORE SUBMIT */}
      {showConfirmModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 1100,
            backgroundColor: 'rgba(15,23,42,0.65)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 20
          }}
        >
          <div
            style={{
              backgroundColor: '#FFFFFF',
              borderRadius: 20,
              padding: 22,
              maxWidth: 400,
              width: '100%',
              display: 'flex',
              flexDirection: 'column',
              gap: 14,
              boxShadow: '0 8px 32px rgba(0,0,0,0.2)'
            }}
          >
            <div style={{ fontSize: 18, fontWeight: 800, color: '#0F172A' }}>
              Submit Leave Application?
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, fontSize: 13, color: '#475569' }}>
              <div>Employee: <strong style={{ color: '#0F172A' }}>{empName}</strong></div>
              <div>Leave Period: <strong style={{ color: '#0F172A' }}>{fromDate} – {toDate}</strong></div>
              <div>Duration: <strong style={{ color: '#1769E0' }}>{totalDays} {totalDays === 1 ? 'Day' : 'Days'}</strong></div>
              <div>Reason: <strong style={{ color: '#0F172A' }}>{reason}</strong></div>
              <div>Supporting Document: <strong style={{ color: documentPhoto ? '#15803D' : '#64748B' }}>{documentPhoto ? 'Attached ✓' : 'None'}</strong></div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 10 }}>
              <button
                type="button"
                onClick={() => setShowConfirmModal(false)}
                style={{
                  padding: '12px',
                  borderRadius: 12,
                  border: '1px solid #CBD5E1',
                  backgroundColor: '#FFFFFF',
                  color: '#475569',
                  fontWeight: 700,
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmSubmit}
                style={{
                  padding: '12px',
                  borderRadius: 12,
                  border: 'none',
                  backgroundColor: '#1769E0',
                  color: '#FFFFFF',
                  fontWeight: 800,
                  cursor: 'pointer',
                  boxShadow: '0 4px 12px rgba(23,105,224,0.3)'
                }}
              >
                Confirm Submit
              </button>
            </div>
          </div>
        </div>
      )}

      {/* LEAVE DETAILS MODAL */}
      {selectedLeaveDetail && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 1100,
            backgroundColor: 'rgba(15,23,42,0.65)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 20
          }}
        >
          <div
            style={{
              backgroundColor: '#FFFFFF',
              borderRadius: 20,
              padding: 22,
              maxWidth: 440,
              width: '100%',
              maxHeight: '90vh',
              overflowY: 'auto',
              display: 'flex',
              flexDirection: 'column',
              gap: 14
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h3 style={{ fontSize: 18, fontWeight: 800, color: '#0F172A', margin: 0 }}>
                  Leave Details
                </h3>
                <div style={{ fontSize: 12, color: '#64748B', marginTop: 2 }}>
                  Application ID: {selectedLeaveDetail.id || selectedLeaveDetail.leaveId}
                </div>
              </div>

              <button
                onClick={() => setSelectedLeaveDetail(null)}
                style={{ width: 32, height: 32, borderRadius: 10, backgroundColor: '#F1F5F9', border: 'none', fontWeight: 800, color: '#64748B', cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, fontSize: 13 }}>
              <div style={{ padding: 12, borderRadius: 12, backgroundColor: '#F8FAFC', border: '1px solid #E2E8F0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontSize: 11, color: '#64748B', fontWeight: 600 }}>Applicant Employee</div>
                  <div style={{ fontSize: 14, fontWeight: 800, color: '#0F172A', marginTop: 2 }}>{selectedLeaveDetail.employeeName || empName}</div>
                  <div style={{ fontSize: 11, color: '#475569' }}>ID: {selectedLeaveDetail.employeeId || empId}</div>
                </div>

                <span
                  style={{
                    fontSize: 11,
                    fontWeight: 800,
                    padding: '4px 10px',
                    borderRadius: 12,
                    backgroundColor: getStatusBadgeColor(selectedLeaveDetail.status).bg,
                    color: getStatusBadgeColor(selectedLeaveDetail.status).color,
                    border: `1px solid ${getStatusBadgeColor(selectedLeaveDetail.status).border}`
                  }}
                >
                  {getStatusBadgeColor(selectedLeaveDetail.status).icon} {selectedLeaveDetail.status}
                </span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div>
                  <div style={{ fontSize: 11, color: '#64748B', fontWeight: 600 }}>From Date</div>
                  <div style={{ fontWeight: 800, color: '#0F172A', marginTop: 2 }}>{getFullFormattedDate(selectedLeaveDetail.fromDate)}</div>
                </div>
                <div>
                  <div style={{ fontSize: 11, color: '#64748B', fontWeight: 600 }}>To Date</div>
                  <div style={{ fontWeight: 800, color: '#0F172A', marginTop: 2 }}>{getFullFormattedDate(selectedLeaveDetail.toDate)}</div>
                </div>
              </div>

              <div>
                <div style={{ fontSize: 11, color: '#64748B', fontWeight: 600 }}>Total Duration</div>
                <div style={{ fontWeight: 800, color: '#1769E0', marginTop: 2 }}>{selectedLeaveDetail.totalDays || 1} {selectedLeaveDetail.totalDays === 1 ? 'Day' : 'Days'}</div>
              </div>

              <div>
                <div style={{ fontSize: 11, color: '#64748B', fontWeight: 600 }}>Reason</div>
                <div style={{ fontWeight: 700, color: '#0F172A', marginTop: 2, lineHeight: 1.4 }}>{selectedLeaveDetail.reason}</div>
              </div>

              <div>
                <div style={{ fontSize: 11, color: '#64748B', fontWeight: 600 }}>Submitted On</div>
                <div style={{ color: '#475569', marginTop: 2 }}>{selectedLeaveDetail.submittedAt || selectedLeaveDetail.appliedOn}</div>
              </div>

              {selectedLeaveDetail.reviewedBy && (
                <div style={{ padding: 12, borderRadius: 12, backgroundColor: '#EFF6FF', border: '1px solid #BFDBFE' }}>
                  <div style={{ fontSize: 11, color: '#1E40AF', fontWeight: 700 }}>Reviewed By Admin</div>
                  <div style={{ fontSize: 12, color: '#1E3A8A', marginTop: 2 }}>
                    <strong>{selectedLeaveDetail.reviewedBy}</strong> ({selectedLeaveDetail.reviewedAt})
                  </div>
                  {selectedLeaveDetail.adminRemarks && (
                    <div style={{ fontSize: 12, color: '#1E3A8A', marginTop: 4, fontStyle: 'italic' }}>
                      Admin Remarks: "{selectedLeaveDetail.adminRemarks}"
                    </div>
                  )}
                </div>
              )}

              {selectedLeaveDetail.documentPhoto && (
                <div style={{ marginTop: 4 }}>
                  <div style={{ fontSize: 11, color: '#64748B', fontWeight: 600, marginBottom: 4 }}>Supporting Document</div>
                  <button
                    type="button"
                    onClick={() => setFullScreenImage(selectedLeaveDetail.documentPhoto!)}
                    style={{
                      width: '100%',
                      padding: '10px',
                      borderRadius: 12,
                      border: '1px solid #CBD5E1',
                      backgroundColor: '#F8FAFC',
                      color: '#1769E0',
                      fontWeight: 800,
                      fontSize: 12,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 6,
                      cursor: 'pointer'
                    }}
                  >
                    <Eye size={16} />
                    <span>View Application Photo</span>
                  </button>
                </div>
              )}
            </div>

            {selectedLeaveDetail.status === 'PENDING' && (
              <div style={{ marginTop: 10 }}>
                <button
                  type="button"
                  onClick={() => setConfirmCancelLeaveId(selectedLeaveDetail.id)}
                  style={{
                    width: '100%',
                    padding: '12px',
                    borderRadius: 12,
                    border: '1px solid #FCA5A5',
                    backgroundColor: '#FEF2F2',
                    color: '#B91C1C',
                    fontWeight: 800,
                    fontSize: 13,
                    cursor: 'pointer'
                  }}
                >
                  Cancel Leave Application
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* FULL SCREEN IMAGE PREVIEW MODAL */}
      {fullScreenImage && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 1200,
            backgroundColor: 'rgba(0,0,0,0.9)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 20
          }}
        >
          <button
            onClick={() => setFullScreenImage(null)}
            style={{
              position: 'absolute',
              top: 20,
              right: 20,
              width: 40,
              height: 40,
              borderRadius: 20,
              backgroundColor: 'rgba(255,255,255,0.2)',
              border: 'none',
              color: '#FFFFFF',
              fontSize: 20,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            ✕
          </button>

          <img
            src={fullScreenImage}
            alt="Leave Application Full Document"
            style={{ maxWidth: '100%', maxHeight: '80vh', objectFit: 'contain', borderRadius: 12 }}
          />

          <div style={{ color: '#FFFFFF', fontSize: 13, marginTop: 16, opacity: 0.8 }}>
            Supporting Leave Application Photo
          </div>
        </div>
      )}

      {/* CONFIRMATION MODAL FOR CANCELING LEAVE */}
      {confirmCancelLeaveId && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 1150,
            backgroundColor: 'rgba(15,23,42,0.65)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 20
          }}
        >
          <div
            style={{
              backgroundColor: '#FFFFFF',
              borderRadius: 20,
              padding: 22,
              maxWidth: 380,
              width: '100%',
              display: 'flex',
              flexDirection: 'column',
              gap: 14
            }}
          >
            <div style={{ fontSize: 16, fontWeight: 800, color: '#0F172A' }}>
              Cancel Leave Application?
            </div>
            <div style={{ fontSize: 13, color: '#64748B', lineHeight: 1.4 }}>
              Are you sure you want to cancel this leave application? The status will be updated to CANCELLED.
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 10 }}>
              <button
                onClick={() => setConfirmCancelLeaveId(null)}
                style={{
                  padding: '10px',
                  borderRadius: 12,
                  border: '1px solid #CBD5E1',
                  backgroundColor: '#FFFFFF',
                  color: '#475569',
                  fontWeight: 700,
                  cursor: 'pointer'
                }}
              >
                Back
              </button>
              <button
                onClick={() => handleConfirmCancelLeave(confirmCancelLeaveId)}
                style={{
                  padding: '10px',
                  borderRadius: 12,
                  border: 'none',
                  backgroundColor: '#DC2626',
                  color: '#FFFFFF',
                  fontWeight: 800,
                  cursor: 'pointer'
                }}
              >
                Confirm Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* FULL LEAVE HISTORY MODAL */}
      {showHistoryModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 1000,
            backgroundColor: 'rgba(15,23,42,0.65)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'flex-end',
            justifyContent: 'center'
          }}
        >
          <div
            style={{
              width: '100%',
              maxWidth: 500,
              maxHeight: '90vh',
              backgroundColor: '#FFFFFF',
              borderTopLeftRadius: 24,
              borderTopRightRadius: 24,
              padding: 20,
              display: 'flex',
              flexDirection: 'column',
              gap: 14,
              overflowY: 'auto'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h2 style={{ fontSize: 18, fontWeight: 800, color: '#0F172A', margin: 0 }}>
                  Leave Application History
                </h2>
                <p style={{ fontSize: 12, color: '#64748B', margin: '2px 0 0 0' }}>
                  Filter and track your leave request records
                </p>
              </div>

              <button
                onClick={() => setShowHistoryModal(false)}
                style={{ width: 32, height: 32, borderRadius: 10, backgroundColor: '#F1F5F9', border: 'none', fontWeight: 800, color: '#64748B', cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>

            {/* Filter Controls */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
              <div>
                <label style={{ fontSize: 11, fontWeight: 700, color: '#64748B', display: 'block', marginBottom: 3 }}>Year</label>
                <select
                  value={historyYear}
                  onChange={(e) => setHistoryYear(e.target.value)}
                  style={{ width: '100%', padding: '7px 8px', borderRadius: 10, border: '1px solid #CBD5E1', fontSize: 12, fontWeight: 700 }}
                >
                  <option value="All">All Years</option>
                  <option value="2025">2025</option>
                  <option value="2026">2026</option>
                  <option value="2027">2027</option>
                </select>
              </div>

              <div>
                <label style={{ fontSize: 11, fontWeight: 700, color: '#64748B', display: 'block', marginBottom: 3 }}>Month</label>
                <select
                  value={historyMonth}
                  onChange={(e) => setHistoryMonth(e.target.value)}
                  style={{ width: '100%', padding: '7px 8px', borderRadius: 10, border: '1px solid #CBD5E1', fontSize: 12, fontWeight: 700 }}
                >
                  {monthList.map((m) => (
                    <option key={m.value} value={m.value}>{m.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ fontSize: 11, fontWeight: 700, color: '#64748B', display: 'block', marginBottom: 3 }}>Status</label>
                <select
                  value={historyStatus}
                  onChange={(e) => setHistoryStatus(e.target.value)}
                  style={{ width: '100%', padding: '7px 8px', borderRadius: 10, border: '1px solid #CBD5E1', fontSize: 12, fontWeight: 700 }}
                >
                  <option value="All">All Status</option>
                  <option value="PENDING">Pending</option>
                  <option value="APPROVED">Approved</option>
                  <option value="REJECTED">Rejected</option>
                  <option value="CANCELLED">Cancelled</option>
                </select>
              </div>
            </div>

            {/* Records List */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 4 }}>
              {filteredHistory.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '30px 10px', color: '#94A3B8' }}>
                  <Calendar size={36} style={{ opacity: 0.5, marginBottom: 8 }} />
                  <div style={{ fontSize: 14, fontWeight: 700, color: '#475569' }}>No Leave Records Found</div>
                  <div style={{ fontSize: 12, color: '#94A3B8', marginTop: 2 }}>No leave applications match the selected period or status filter.</div>
                </div>
              ) : (
                filteredHistory.map((l) => {
                  const badge = getStatusBadgeColor(l.status);
                  const fromFormatted = getFullFormattedDate(l.fromDate);
                  const toFormatted = getFullFormattedDate(l.toDate);

                  return (
                    <div
                      key={l.id}
                      onClick={() => setSelectedLeaveDetail(l)}
                      style={{
                        padding: 14,
                        borderRadius: 14,
                        backgroundColor: '#FFFFFF',
                        border: '1px solid #E2E8F0',
                        boxShadow: '0 2px 6px rgba(0,0,0,0.03)',
                        cursor: 'pointer',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                      }}
                    >
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 800, color: '#0F172A' }}>
                          {fromFormatted} {l.fromDate !== l.toDate ? `to ${toFormatted}` : ''}
                        </div>
                        <div style={{ fontSize: 12, color: '#1769E0', fontWeight: 800, marginTop: 2 }}>
                          {l.totalDays || 1} {l.totalDays === 1 ? 'Day' : 'Days'} • ID: {l.id || l.leaveId}
                        </div>
                        <div style={{ fontSize: 12, color: '#475569', marginTop: 3, fontWeight: 600 }}>
                          Reason: {l.reason}
                        </div>
                        {l.documentPhoto && (
                          <div style={{ fontSize: 11, color: '#15803D', fontWeight: 700, marginTop: 2 }}>
                            📎 Supporting Photo Attached
                          </div>
                        )}
                      </div>

                      <span
                        style={{
                          padding: '4px 10px',
                          borderRadius: 12,
                          fontSize: 11,
                          fontWeight: 800,
                          backgroundColor: badge.bg,
                          color: badge.color,
                          border: `1px solid ${badge.border}`
                        }}
                      >
                        {badge.icon} {l.status}
                      </span>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
