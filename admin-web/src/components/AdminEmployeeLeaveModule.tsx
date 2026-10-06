import React, { useState, useEffect } from 'react';
import { demoDataStore } from '../services/demoDataStore';
import { LeaveApplication } from '../types';
import {
  FileText,
  CheckCircle2,
  XCircle,
  Clock,
  Search,
  Filter,
  Eye,
  Check,
  X,
  AlertCircle,
  Paperclip,
  Calendar,
  User,
  Building,
  Briefcase,
  Maximize2
} from 'lucide-react';

export const AdminEmployeeLeaveModule: React.FC = () => {
  const [leaves, setLeaves] = useState<LeaveApplication[]>([]);
  const [selectedStatus, setSelectedStatus] = useState<string>('All');
  const [selectedDepartment, setSelectedDepartment] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Modals
  const [viewLeaveModal, setViewLeaveModal] = useState<LeaveApplication | null>(null);
  const [approveLeaveModal, setApproveLeaveModal] = useState<LeaveApplication | null>(null);
  const [rejectLeaveModal, setRejectLeaveModal] = useState<LeaveApplication | null>(null);
  const [fullScreenPhoto, setFullScreenPhoto] = useState<string | null>(null);

  // Form Inputs
  const [approveRemarks, setApproveRemarks] = useState<string>('Approved for family event.');
  const [rejectRemarks, setRejectRemarks] = useState<string>('Leave cannot be approved due to examination duty.');

  const [toastMsg, setToastMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const loadLeaves = () => {
    try {
      const records = demoDataStore.getLeaveApplications();
      setLeaves(records);
    } catch (e) {
      console.warn('Error loading leave applications in Admin Web:', e);
    }
  };

  useEffect(() => {
    loadLeaves();
    const unsubscribe = demoDataStore.subscribe(() => {
      loadLeaves();
    });
    return () => unsubscribe();
  }, []);

  // Filtered List
  const filteredLeaves = leaves.filter((l) => {
    const statusUpper = (l.status || '').toUpperCase();

    if (selectedStatus !== 'All' && statusUpper !== selectedStatus.toUpperCase()) {
      return false;
    }

    if (selectedDepartment !== 'All' && l.employeeDepartment !== selectedDepartment) {
      return false;
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = (l.employeeName || '').toLowerCase().includes(q);
      const matchId = (l.employeeId || '').toLowerCase().includes(q);
      const matchReason = (l.reason || '').toLowerCase().includes(q);
      if (!matchName && !matchId && !matchReason) return false;
    }

    return true;
  });

  // Overview Counts
  const totalCount = leaves.length;
  const pendingCount = leaves.filter((l) => (l.status || '').toUpperCase() === 'PENDING').length;
  const approvedCount = leaves.filter((l) => (l.status || '').toUpperCase() === 'APPROVED').length;
  const rejectedCount = leaves.filter((l) => (l.status || '').toUpperCase() === 'REJECTED').length;

  // Approve Handler
  const handleConfirmApprove = () => {
    if (!approveLeaveModal) return;
    const updated = demoDataStore.updateLeaveStatus(
      approveLeaveModal.id,
      'APPROVED',
      'Admin Principal',
      approveRemarks.trim() || 'Approved by Admin'
    );

    if (updated) {
      setToastMsg({
        type: 'success',
        text: `✓ Leave application ${approveLeaveModal.id} for ${approveLeaveModal.employeeName} APPROVED.`
      });
      loadLeaves();
    }
    setApproveLeaveModal(null);
  };

  // Reject Handler
  const handleConfirmReject = () => {
    if (!rejectLeaveModal) return;
    if (!rejectRemarks.trim()) {
      setToastMsg({ type: 'error', text: 'Please enter a valid rejection reason for the employee.' });
      return;
    }

    const updated = demoDataStore.updateLeaveStatus(
      rejectLeaveModal.id,
      'REJECTED',
      'Admin Principal',
      rejectRemarks.trim()
    );

    if (updated) {
      setToastMsg({
        type: 'success',
        text: `Leave application ${rejectLeaveModal.id} for ${rejectLeaveModal.employeeName} REJECTED.`
      });
      loadLeaves();
    }
    setRejectLeaveModal(null);
  };

  const getStatusBadge = (status?: string) => {
    const s = (status || '').toUpperCase();
    switch (s) {
      case 'APPROVED':
        return { bg: '#DCFCE7', color: '#15803D', border: '#86EFAC', icon: '🟢', label: 'APPROVED' };
      case 'REJECTED':
        return { bg: '#FEE2E2', color: '#B91C1C', border: '#FCA5A5', icon: '🔴', label: 'REJECTED' };
      case 'CANCELLED':
        return { bg: '#F1F5F9', color: '#64748B', border: '#CBD5E1', icon: '⚪', label: 'CANCELLED' };
      default:
        return { bg: '#FEF3C7', color: '#B45309', border: '#FDE68A', icon: '🟠', label: 'PENDING' };
    }
  };

  return (
    <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Page Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div
            style={{
              width: 46,
              height: 46,
              borderRadius: 14,
              background: 'linear-gradient(135deg, #1769E0 0%, #104EB0 100%)',
              color: '#FFFFFF',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <FileText size={24} />
          </div>
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 800, color: '#0F172A', margin: 0, lineHeight: 1.2 }}>
              Employee Leave Applications
            </h1>
            <p style={{ fontSize: 13, color: '#64748B', margin: '3px 0 0 0' }}>
              Review staff leave requests, inspect supporting photos, approve or reject applications
            </p>
          </div>
        </div>
      </div>

      {/* Toast Banner */}
      {toastMsg && (
        <div
          style={{
            padding: '12px 16px',
            borderRadius: 12,
            backgroundColor: toastMsg.type === 'success' ? '#F0FDF4' : '#FEF2F2',
            color: toastMsg.type === 'success' ? '#15803D' : '#991B1B',
            border: `1px solid ${toastMsg.type === 'success' ? '#BBF7D0' : '#FECACA'}`,
            fontSize: 13,
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}
        >
          <span>{toastMsg.text}</span>
          <button onClick={() => setToastMsg(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontWeight: 800 }}>✕</button>
        </div>
      )}

      {/* SUMMARY METRICS METRICS OVERVIEW */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
        <div className="avm-card" style={{ padding: 18, borderLeft: '4px solid #1769E0' }}>
          <div style={{ fontSize: 12, color: '#64748B', fontWeight: 700 }}>TOTAL APPLICATIONS</div>
          <div style={{ fontSize: 26, fontWeight: 800, color: '#0F172A', marginTop: 4 }}>{totalCount}</div>
          <div style={{ fontSize: 11, color: '#1769E0', fontWeight: 600, marginTop: 4 }}>All Staff Submissions</div>
        </div>

        <div className="avm-card" style={{ padding: 18, borderLeft: '4px solid #F59E0B' }}>
          <div style={{ fontSize: 12, color: '#B45309', fontWeight: 700 }}>PENDING REVIEW</div>
          <div style={{ fontSize: 26, fontWeight: 800, color: '#B45309', marginTop: 4 }}>{pendingCount}</div>
          <div style={{ fontSize: 11, color: '#D97706', fontWeight: 600, marginTop: 4 }}>Requires Admin Action</div>
        </div>

        <div className="avm-card" style={{ padding: 18, borderLeft: '4px solid #16A34A' }}>
          <div style={{ fontSize: 12, color: '#15803D', fontWeight: 700 }}>APPROVED LEAVES</div>
          <div style={{ fontSize: 26, fontWeight: 800, color: '#15803D', marginTop: 4 }}>{approvedCount}</div>
          <div style={{ fontSize: 11, color: '#16A34A', fontWeight: 600, marginTop: 4 }}>Granted & Confirmed</div>
        </div>

        <div className="avm-card" style={{ padding: 18, borderLeft: '4px solid #DC2626' }}>
          <div style={{ fontSize: 12, color: '#991B1B', fontWeight: 700 }}>REJECTED LEAVES</div>
          <div style={{ fontSize: 26, fontWeight: 800, color: '#991B1B', marginTop: 4 }}>{rejectedCount}</div>
          <div style={{ fontSize: 11, color: '#DC2626', fontWeight: 600, marginTop: 4 }}>Declined by Admin</div>
        </div>
      </div>

      {/* FILTER CONTROLS */}
      <div className="avm-card" style={{ padding: 18, display: 'flex', flexWrap: 'wrap', gap: 14, alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1, minWidth: 260 }}>
          <Search size={18} color="#64748B" />
          <input
            type="text"
            placeholder="Search by Employee Name, ID or Reason..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              flex: 1,
              padding: '10px 14px',
              borderRadius: 10,
              border: '1px solid #CBD5E1',
              fontSize: 13
            }}
          />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div>
            <label style={{ fontSize: 11, fontWeight: 700, color: '#64748B', marginRight: 6 }}>Department:</label>
            <select
              value={selectedDepartment}
              onChange={(e) => setSelectedDepartment(e.target.value)}
              style={{ padding: '8px 12px', borderRadius: 10, border: '1px solid #CBD5E1', fontSize: 13, fontWeight: 700 }}
            >
              <option value="All">All Departments</option>
              <option value="Academics">Academics</option>
              <option value="Administration">Administration</option>
              <option value="Sports">Sports</option>
            </select>
          </div>

          <div>
            <label style={{ fontSize: 11, fontWeight: 700, color: '#64748B', marginRight: 6 }}>Status:</label>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              style={{ padding: '8px 12px', borderRadius: 10, border: '1px solid #CBD5E1', fontSize: 13, fontWeight: 700 }}
            >
              <option value="All">All Status</option>
              <option value="PENDING">Pending</option>
              <option value="APPROVED">Approved</option>
              <option value="REJECTED">Rejected</option>
              <option value="CANCELLED">Cancelled</option>
            </select>
          </div>
        </div>
      </div>

      {/* APPLICATIONS TABLE / LIST */}
      <div className="avm-card" style={{ padding: 0, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: 13 }}>
          <thead>
            <tr style={{ backgroundColor: '#F8FAFC', borderBottom: '1px solid #E2E8F0', color: '#475569', fontWeight: 800 }}>
              <th style={{ padding: '14px 18px' }}>Application ID</th>
              <th style={{ padding: '14px 18px' }}>Employee</th>
              <th style={{ padding: '14px 18px' }}>Leave Dates</th>
              <th style={{ padding: '14px 18px' }}>Duration</th>
              <th style={{ padding: '14px 18px' }}>Reason</th>
              <th style={{ padding: '14px 18px' }}>Document</th>
              <th style={{ padding: '14px 18px' }}>Status</th>
              <th style={{ padding: '14px 18px', textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredLeaves.length === 0 ? (
              <tr>
                <td colSpan={8} style={{ padding: 40, textAlign: 'center', color: '#94A3B8' }}>
                  <FileText size={40} style={{ opacity: 0.4, marginBottom: 8 }} />
                  <div style={{ fontSize: 14, fontWeight: 700, color: '#475569' }}>No Leave Applications Found</div>
                  <div style={{ fontSize: 12 }}>No employee leave applications match the selected filters.</div>
                </td>
              </tr>
            ) : (
              filteredLeaves.map((l) => {
                const badge = getStatusBadge(l.status);
                const isPending = (l.status || '').toUpperCase() === 'PENDING';

                return (
                  <tr key={l.id} style={{ borderBottom: '1px solid #F1F5F9' }}>
                    <td style={{ padding: '14px 18px', fontWeight: 800, color: '#1769E0' }}>
                      {l.id || l.leaveId}
                    </td>

                    <td style={{ padding: '14px 18px' }}>
                      <div style={{ fontWeight: 800, color: '#0F172A' }}>{l.employeeName}</div>
                      <div style={{ fontSize: 11, color: '#64748B' }}>
                        ID: {l.employeeId} • {l.employeeDesignation || 'Teacher'}
                      </div>
                    </td>

                    <td style={{ padding: '14px 18px', fontWeight: 700, color: '#0F172A' }}>
                      {l.fromDate} to {l.toDate}
                    </td>

                    <td style={{ padding: '14px 18px', fontWeight: 800, color: '#1769E0' }}>
                      {l.totalDays || 1} {l.totalDays === 1 ? 'Day' : 'Days'}
                    </td>

                    <td style={{ padding: '14px 18px', color: '#334155', maxWidth: 220, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {l.reason}
                    </td>

                    <td style={{ padding: '14px 18px' }}>
                      {l.documentPhoto ? (
                        <button
                          onClick={() => setFullScreenPhoto(l.documentPhoto!)}
                          style={{
                            padding: '4px 10px',
                            borderRadius: 8,
                            backgroundColor: '#EFF6FF',
                            border: '1px solid #BFDBFE',
                            color: '#1D4ED8',
                            fontSize: 11,
                            fontWeight: 800,
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 4,
                            cursor: 'pointer'
                          }}
                        >
                          <Paperclip size={12} />
                          <span>View Photo</span>
                        </button>
                      ) : (
                        <span style={{ fontSize: 11, color: '#94A3B8' }}>None</span>
                      )}
                    </td>

                    <td style={{ padding: '14px 18px' }}>
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
                        {badge.icon} {badge.label}
                      </span>
                    </td>

                    <td style={{ padding: '14px 18px', textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: 8 }}>
                        <button
                          onClick={() => setViewLeaveModal(l)}
                          style={{
                            padding: '6px 12px',
                            borderRadius: 8,
                            backgroundColor: '#F1F5F9',
                            border: '1px solid #CBD5E1',
                            color: '#475569',
                            fontSize: 12,
                            fontWeight: 700,
                            cursor: 'pointer'
                          }}
                        >
                          View
                        </button>

                        {isPending && (
                          <>
                            <button
                              onClick={() => {
                                setApproveRemarks('Approved for personal/family reason.');
                                setApproveLeaveModal(l);
                              }}
                              style={{
                                padding: '6px 12px',
                                borderRadius: 8,
                                backgroundColor: '#16A34A',
                                border: 'none',
                                color: '#FFFFFF',
                                fontSize: 12,
                                fontWeight: 800,
                                cursor: 'pointer',
                                boxShadow: '0 2px 6px rgba(22,163,74,0.3)'
                              }}
                            >
                              Approve
                            </button>

                            <button
                              onClick={() => {
                                setRejectRemarks('Leave cannot be approved due to examination duty.');
                                setRejectLeaveModal(l);
                              }}
                              style={{
                                padding: '6px 12px',
                                borderRadius: 8,
                                backgroundColor: '#DC2626',
                                border: 'none',
                                color: '#FFFFFF',
                                fontSize: 12,
                                fontWeight: 800,
                                cursor: 'pointer',
                                boxShadow: '0 2px 6px rgba(220,38,38,0.3)'
                              }}
                            >
                              Reject
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* VIEW DETAILS MODAL */}
      {viewLeaveModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 1000,
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
              padding: 24,
              maxWidth: 480,
              width: '100%',
              maxHeight: '90vh',
              overflowY: 'auto',
              display: 'flex',
              flexDirection: 'column',
              gap: 16
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h3 style={{ fontSize: 18, fontWeight: 800, color: '#0F172A', margin: 0 }}>
                  Leave Application Details
                </h3>
                <div style={{ fontSize: 12, color: '#64748B', marginTop: 2 }}>ID: {viewLeaveModal.id || viewLeaveModal.leaveId}</div>
              </div>
              <button
                onClick={() => setViewLeaveModal(null)}
                style={{ width: 32, height: 32, borderRadius: 10, backgroundColor: '#F1F5F9', border: 'none', fontWeight: 800, color: '#64748B', cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, fontSize: 13 }}>
              <div style={{ padding: 14, borderRadius: 14, backgroundColor: '#F8FAFC', border: '1px solid #E2E8F0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontSize: 11, color: '#64748B', fontWeight: 600 }}>Employee Profile</div>
                  <div style={{ fontSize: 15, fontWeight: 800, color: '#0F172A', marginTop: 2 }}>{viewLeaveModal.employeeName}</div>
                  <div style={{ fontSize: 12, color: '#475569' }}>ID: {viewLeaveModal.employeeId} • {viewLeaveModal.employeeDesignation || 'Teacher'} ({viewLeaveModal.employeeDepartment || 'Academics'})</div>
                </div>

                <span
                  style={{
                    padding: '4px 12px',
                    borderRadius: 14,
                    fontSize: 12,
                    fontWeight: 800,
                    backgroundColor: getStatusBadge(viewLeaveModal.status).bg,
                    color: getStatusBadge(viewLeaveModal.status).color,
                    border: `1px solid ${getStatusBadge(viewLeaveModal.status).border}`
                  }}
                >
                  {getStatusBadge(viewLeaveModal.status).icon} {getStatusBadge(viewLeaveModal.status).label}
                </span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <div style={{ fontSize: 11, color: '#64748B', fontWeight: 600 }}>From Date</div>
                  <div style={{ fontWeight: 800, color: '#0F172A', marginTop: 2 }}>{viewLeaveModal.fromDate}</div>
                </div>
                <div>
                  <div style={{ fontSize: 11, color: '#64748B', fontWeight: 600 }}>To Date</div>
                  <div style={{ fontWeight: 800, color: '#0F172A', marginTop: 2 }}>{viewLeaveModal.toDate}</div>
                </div>
              </div>

              <div>
                <div style={{ fontSize: 11, color: '#64748B', fontWeight: 600 }}>Total Duration</div>
                <div style={{ fontWeight: 800, color: '#1769E0', marginTop: 2 }}>{viewLeaveModal.totalDays || 1} Days</div>
              </div>

              <div>
                <div style={{ fontSize: 11, color: '#64748B', fontWeight: 600 }}>Reason for Leave</div>
                <div style={{ fontWeight: 700, color: '#0F172A', marginTop: 2, lineHeight: 1.4 }}>{viewLeaveModal.reason}</div>
              </div>

              <div>
                <div style={{ fontSize: 11, color: '#64748B', fontWeight: 600 }}>Submitted Timestamp</div>
                <div style={{ color: '#475569', marginTop: 2 }}>{viewLeaveModal.submittedAt || viewLeaveModal.appliedOn}</div>
              </div>

              {viewLeaveModal.reviewedBy && (
                <div style={{ padding: 12, borderRadius: 12, backgroundColor: '#EFF6FF', border: '1px solid #BFDBFE' }}>
                  <div style={{ fontSize: 11, color: '#1E40AF', fontWeight: 700 }}>Review Information</div>
                  <div style={{ fontSize: 12, color: '#1E3A8A', marginTop: 2 }}>Reviewed by <strong>{viewLeaveModal.reviewedBy}</strong> on {viewLeaveModal.reviewedAt}</div>
                  {viewLeaveModal.adminRemarks && (
                    <div style={{ fontSize: 12, color: '#1E3A8A', marginTop: 4, fontStyle: 'italic' }}>
                      Remarks: "{viewLeaveModal.adminRemarks}"
                    </div>
                  )}
                </div>
              )}

              {viewLeaveModal.documentPhoto && (
                <div>
                  <div style={{ fontSize: 11, color: '#64748B', fontWeight: 600, marginBottom: 6 }}>Supporting Application Photo</div>
                  <div style={{ position: 'relative', borderRadius: 12, overflow: 'hidden', border: '1px solid #CBD5E1' }}>
                    <img
                      src={viewLeaveModal.documentPhoto}
                      alt="Application Document"
                      style={{ width: '100%', maxHeight: 220, objectFit: 'cover' }}
                    />
                    <button
                      onClick={() => setFullScreenPhoto(viewLeaveModal.documentPhoto!)}
                      style={{
                        position: 'absolute',
                        bottom: 10,
                        right: 10,
                        padding: '6px 12px',
                        borderRadius: 8,
                        backgroundColor: 'rgba(15,23,42,0.8)',
                        color: '#FFFFFF',
                        border: 'none',
                        fontSize: 11,
                        fontWeight: 800,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6,
                        cursor: 'pointer'
                      }}
                    >
                      <Maximize2 size={12} />
                      <span>Zoom Photo</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* APPROVE CONFIRMATION MODAL */}
      {approveLeaveModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 1100,
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
              padding: 24,
              maxWidth: 420,
              width: '100%',
              display: 'flex',
              flexDirection: 'column',
              gap: 14
            }}
          >
            <div style={{ fontSize: 18, fontWeight: 800, color: '#16A34A' }}>
              Approve Leave Application?
            </div>
            <div style={{ fontSize: 13, color: '#475569', lineHeight: 1.4 }}>
              Approve leave for <strong>{approveLeaveModal.employeeName}</strong> ({approveLeaveModal.fromDate} to {approveLeaveModal.toDate} - {approveLeaveModal.totalDays || 1} Days)?
            </div>

            <div>
              <label style={{ fontSize: 11, fontWeight: 700, color: '#475569', display: 'block', marginBottom: 4 }}>
                Admin Remarks (Optional)
              </label>
              <input
                type="text"
                value={approveRemarks}
                onChange={(e) => setApproveRemarks(e.target.value)}
                placeholder="e.g. Approved for personal reason"
                style={{ width: '100%', padding: '10px 12px', borderRadius: 10, border: '1px solid #CBD5E1', fontSize: 13 }}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 10 }}>
              <button
                onClick={() => setApproveLeaveModal(null)}
                style={{ padding: '10px', borderRadius: 12, border: '1px solid #CBD5E1', backgroundColor: '#FFFFFF', color: '#475569', fontWeight: 700, cursor: 'pointer' }}
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmApprove}
                style={{ padding: '10px', borderRadius: 12, border: 'none', backgroundColor: '#16A34A', color: '#FFFFFF', fontWeight: 800, cursor: 'pointer' }}
              >
                Approve Leave
              </button>
            </div>
          </div>
        </div>
      )}

      {/* REJECT CONFIRMATION MODAL */}
      {rejectLeaveModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 1100,
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
              padding: 24,
              maxWidth: 420,
              width: '100%',
              display: 'flex',
              flexDirection: 'column',
              gap: 14
            }}
          >
            <div style={{ fontSize: 18, fontWeight: 800, color: '#DC2626' }}>
              Reject Leave Application
            </div>
            <div style={{ fontSize: 13, color: '#475569', lineHeight: 1.4 }}>
              Reject leave request for <strong>{rejectLeaveModal.employeeName}</strong> ({rejectLeaveModal.fromDate} to {rejectLeaveModal.toDate}).
            </div>

            <div>
              <label style={{ fontSize: 11, fontWeight: 700, color: '#991B1B', display: 'block', marginBottom: 4 }}>
                Rejection Reason / Admin Remarks *
              </label>
              <textarea
                rows={3}
                value={rejectRemarks}
                onChange={(e) => setRejectRemarks(e.target.value)}
                placeholder="Write reason for rejection (e.g. Leave cannot be approved due to examination duty)..."
                required
                style={{ width: '100%', padding: '10px 12px', borderRadius: 10, border: '1px solid #FCA5A5', fontSize: 13 }}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 10 }}>
              <button
                onClick={() => setRejectLeaveModal(null)}
                style={{ padding: '10px', borderRadius: 12, border: '1px solid #CBD5E1', backgroundColor: '#FFFFFF', color: '#475569', fontWeight: 700, cursor: 'pointer' }}
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmReject}
                style={{ padding: '10px', borderRadius: 12, border: 'none', backgroundColor: '#DC2626', color: '#FFFFFF', fontWeight: 800, cursor: 'pointer' }}
              >
                Reject Application
              </button>
            </div>
          </div>
        </div>
      )}

      {/* FULLSCREEN PHOTO ZOOM MODAL */}
      {fullScreenPhoto && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 1300,
            backgroundColor: 'rgba(0,0,0,0.92)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 20
          }}
        >
          <button
            onClick={() => setFullScreenPhoto(null)}
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
            src={fullScreenPhoto}
            alt="Application Full Screen"
            style={{ maxWidth: '100%', maxHeight: '82vh', objectFit: 'contain', borderRadius: 12 }}
          />
          <div style={{ color: '#FFFFFF', fontSize: 13, marginTop: 14, opacity: 0.8 }}>
            Uploaded Leave Application Document
          </div>
        </div>
      )}
    </div>
  );
};
