import React, { useState, useEffect, useMemo } from 'react';
import { marksService } from '../services/marksService';
import { demoDataStore, MasterSubjectRecord, EvaluationPeriodRecord, StudentMarkRecord } from '../services/demoDataStore';
import { SCHOOL_CLASSES } from '../services/classService';
import {
  BarChart2,
  BookOpen,
  Calendar,
  Plus,
  Search,
  Filter,
  FileSpreadsheet,
  Printer,
  Edit3,
  Trash2,
  CheckCircle2,
  XCircle,
  AlertCircle,
  X,
  Sparkles,
  Users,
  Award,
  Layers,
  Settings
} from 'lucide-react';

export const AdminMarksModule: React.FC = () => {
  const [evaluations, setEvaluations] = useState<EvaluationPeriodRecord[]>([]);
  const [masterSubjects, setMasterSubjects] = useState<MasterSubjectRecord[]>([]);
  const [allMarks, setAllMarks] = useState<StudentMarkRecord[]>([]);

  // Filter States
  const [sessionFilter, setSessionFilter] = useState('2026-27');
  const [evalFilter, setEvalFilter] = useState('All');
  const [classFilter, setClassFilter] = useState('All');
  const [subjectFilter, setSubjectFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [studentSearch, setStudentSearch] = useState('');

  // Modals
  const [showAddSubjectModal, setShowAddSubjectModal] = useState(false);
  const [showEvalModal, setShowEvalModal] = useState(false);
  const [editMarkRecord, setEditMarkRecord] = useState<StudentMarkRecord | null>(null);
  const [toastMsg, setToastMsg] = useState<{ text: string; type: 'success' | 'warning' | 'error' } | null>(null);

  // Form State for New/Edit Subject
  const [subjForm, setSubjForm] = useState({
    id: '',
    name: '',
    code: '',
    type: 'Theory' as const,
    maxMarks: '100',
    passingMarks: '33',
    theoryMaxMarks: '',
    practicalMaxMarks: '',
    status: 'Active' as const
  });

  // Form State for New/Edit Evaluation
  const [evalForm, setEvalForm] = useState({
    id: '',
    name: '',
    academicSession: '2026-27',
    type: 'Term Exam' as const,
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
    status: 'Active' as const,
    description: ''
  });

  // Form State for Edit Mark Single Student
  const [editMarkForm, setEditMarkForm] = useState({
    theory: '',
    practical: '',
    total: '',
    isAbsent: false,
    status: 'PASS'
  });

  const refreshData = () => {
    setEvaluations(marksService.getAllEvaluations());
    setMasterSubjects(marksService.getAllMasterSubjects());
    setAllMarks(marksService.getMarks());
  };

  useEffect(() => {
    refreshData();
  }, []);

  const showToast = (text: string, type: 'success' | 'warning' | 'error' = 'success') => {
    setToastMsg({ text, type });
    setTimeout(() => setToastMsg(null), 3000);
  };

  // Filtered Marks list
  const filteredMarks = useMemo(() => {
    return allMarks.filter(m => {
      if (sessionFilter && m.academicSession !== sessionFilter) return false;
      if (evalFilter !== 'All' && m.evaluationName !== evalFilter && m.evaluationId !== evalFilter) return false;
      if (classFilter !== 'All' && m.className !== classFilter) return false;
      if (subjectFilter !== 'All' && m.subjectName !== subjectFilter && m.subjectId !== subjectFilter) return false;
      if (statusFilter !== 'All' && m.status !== statusFilter) return false;

      if (studentSearch.trim()) {
        const query = studentSearch.toLowerCase().trim();
        const matchesName = m.studentName.toLowerCase().includes(query);
        const matchesAdm = m.admissionNumber.toLowerCase().includes(query);
        const matchesRoll = String(m.rollNumber).includes(query);
        if (!matchesName && !matchesAdm && !matchesRoll) return false;
      }
      return true;
    });
  }, [allMarks, sessionFilter, evalFilter, classFilter, subjectFilter, statusFilter, studentSearch]);

  // Dashboard Cards metrics
  const totalEntriesCount = filteredMarks.length;
  const passedCount = filteredMarks.filter(m => m.status === 'PASS').length;
  const failedCount = filteredMarks.filter(m => m.status === 'FAIL').length;
  const absentCount = filteredMarks.filter(m => m.isAbsent || m.status === 'ABSENT').length;

  // Handlers
  const handleSaveSubject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!subjForm.name.trim()) {
      showToast('Please enter subject name', 'warning');
      return;
    }

    marksService.saveSubject({
      id: subjForm.id || undefined,
      name: subjForm.name.trim(),
      code: subjForm.code.trim() || `SUB-${Date.now()}`,
      type: subjForm.type,
      maxMarks: Number(subjForm.maxMarks) || 100,
      passingMarks: Number(subjForm.passingMarks) || 33,
      theoryMaxMarks: subjForm.theoryMaxMarks ? Number(subjForm.theoryMaxMarks) : undefined,
      practicalMaxMarks: subjForm.practicalMaxMarks ? Number(subjForm.practicalMaxMarks) : undefined,
      status: subjForm.status
    });

    setShowAddSubjectModal(false);
    refreshData();
    showToast(`Subject "${subjForm.name}" saved successfully!`);
  };

  const handleSaveEvaluation = (e: React.FormEvent) => {
    e.preventDefault();
    if (!evalForm.name.trim()) {
      showToast('Please enter evaluation name', 'warning');
      return;
    }

    marksService.saveEvaluation({
      id: evalForm.id || undefined,
      name: evalForm.name.trim(),
      academicSession: evalForm.academicSession,
      type: evalForm.type,
      startDate: evalForm.startDate,
      endDate: evalForm.endDate,
      status: evalForm.status,
      description: evalForm.description
    });

    setShowEvalModal(false);
    refreshData();
    showToast(`Evaluation Period "${evalForm.name}" saved successfully!`);
  };

  const handleOpenEditMark = (mark: StudentMarkRecord) => {
    setEditMarkRecord(mark);
    setEditMarkForm({
      theory: mark.theoryMarks !== undefined ? String(mark.theoryMarks) : '',
      practical: mark.practicalMarks !== undefined ? String(mark.practicalMarks) : '',
      total: String(mark.totalMarks),
      isAbsent: mark.isAbsent || mark.status === 'ABSENT',
      status: mark.status
    });
  };

  const handleSaveEditMark = () => {
    if (!editMarkRecord) return;
    const maxMarks = editMarkRecord.maximumMarks || 100;
    const total = editMarkForm.isAbsent ? 0 : Number(editMarkForm.total) || 0;
    const theory = editMarkForm.theory !== '' ? Number(editMarkForm.theory) : undefined;
    const practical = editMarkForm.practical !== '' ? Number(editMarkForm.practical) : undefined;

    marksService.saveMarksBatch([{
      ...editMarkRecord,
      totalMarks: total,
      theoryMarks: theory,
      practicalMarks: practical,
      isAbsent: editMarkForm.isAbsent,
      status: editMarkForm.isAbsent ? 'ABSENT' : (total >= (editMarkRecord.maximumMarks * 0.33) ? 'PASS' : 'FAIL')
    }], 'Admin Web', 'EMP-ADMIN');

    setEditMarkRecord(null);
    refreshData();
    showToast(`Marks updated for ${editMarkRecord.studentName}`);
  };

  const handleExportCSV = () => {
    if (filteredMarks.length === 0) {
      showToast('No marks available to export', 'warning');
      return;
    }

    let csvContent = 'data:text/csv;charset=utf-8,';
    csvContent += 'Student Name,Admission No,Roll No,Class,Section,Subject,Evaluation,Max Marks,Total Marks,Percentage,Grade,Status,Entered By,Last Updated\n';

    filteredMarks.forEach(m => {
      const row = [
        `"${m.studentName}"`,
        `"${m.admissionNumber}"`,
        `"${m.rollNumber}"`,
        `"${m.className}"`,
        `"${m.section}"`,
        `"${m.subjectName}"`,
        `"${m.evaluationName}"`,
        m.maximumMarks,
        m.totalMarks,
        `"${m.percentage}%"`,
        `"${m.grade}"`,
        `"${m.status}"`,
        `"${m.enteredBy}"`,
        `"${m.updatedAt}"`
      ].join(',');
      csvContent += row + '\n';
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `AVM_Marks_Report_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Marks exported to CSV file successfully!');
  };

  const handlePrintReport = () => {
    window.print();
  };

  return (
    <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 20, backgroundColor: '#F8FAFC', minHeight: '100vh' }}>
      {/* Toast Notification */}
      {toastMsg && (
        <div style={{
          position: 'fixed',
          top: 20,
          right: 20,
          zIndex: 99999,
          backgroundColor: toastMsg.type === 'success' ? '#16A34A' : toastMsg.type === 'warning' ? '#F59E0B' : '#DC2626',
          color: '#FFF',
          padding: '12px 20px',
          borderRadius: 8,
          fontSize: 13,
          fontWeight: 700,
          boxShadow: '0 8px 24px rgba(0,0,0,0.2)',
          display: 'flex',
          alignItems: 'center',
          gap: 8
        }}>
          {toastMsg.type === 'success' && <CheckCircle2 size={16} />}
          {toastMsg.type === 'warning' && <AlertCircle size={16} />}
          {toastMsg.type === 'error' && <XCircle size={16} />}
          {toastMsg.text}
        </div>
      )}

      {/* Title & Action Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 900, color: '#0F172A', margin: 0, display: 'flex', alignItems: 'center', gap: 10 }}>
            <Award size={28} color="#1E3A8A" /> School ERP Marks Management Module
          </h1>
          <p style={{ fontSize: 13, color: '#64748B', margin: '4px 0 0 0' }}>
            Central Marks Entry, Subject Master, Evaluation Periods & Class Performance Analytics
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <button
            onClick={() => {
              setSubjForm({ id: '', name: '', code: '', type: 'Theory', maxMarks: '100', passingMarks: '33', theoryMaxMarks: '', practicalMaxMarks: '', status: 'Active' });
              setShowAddSubjectModal(true);
            }}
            style={{
              padding: '10px 16px',
              backgroundColor: '#F97316',
              color: '#FFF',
              border: 'none',
              borderRadius: 8,
              fontSize: 13,
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 6
            }}
          >
            <Plus size={16} /> Add Subject
          </button>

          <button
            onClick={() => {
              setEvalForm({ id: '', name: '', academicSession: '2026-27', type: 'Term Exam', startDate: new Date().toISOString().split('T')[0], endDate: new Date().toISOString().split('T')[0], status: 'Active', description: '' });
              setShowEvalModal(true);
            }}
            style={{
              padding: '10px 16px',
              backgroundColor: '#1E3A8A',
              color: '#FFF',
              border: 'none',
              borderRadius: 8,
              fontSize: 13,
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 6
            }}
          >
            <Settings size={16} /> Manage Evaluations
          </button>

          <button
            onClick={handleExportCSV}
            style={{
              padding: '10px 16px',
              backgroundColor: '#16A34A',
              color: '#FFF',
              border: 'none',
              borderRadius: 8,
              fontSize: 13,
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 6
            }}
          >
            <FileSpreadsheet size={16} /> Export (.csv)
          </button>

          <button
            onClick={handlePrintReport}
            style={{
              padding: '10px 16px',
              backgroundColor: '#475569',
              color: '#FFF',
              border: 'none',
              borderRadius: 8,
              fontSize: 13,
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 6
            }}
          >
            <Printer size={16} /> Print Report
          </button>
        </div>
      </div>

      {/* Metric Stat Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
        <div style={{ backgroundColor: '#FFF', padding: 20, borderRadius: 12, border: '1px solid #E2E8F0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>Total Marks Entries</div>
          <div style={{ fontSize: 28, fontWeight: 900, color: '#0F172A', marginTop: 4 }}>{totalEntriesCount}</div>
          <div style={{ fontSize: 11, color: '#16A34A', marginTop: 4 }}>Across selected class & exam filters</div>
        </div>

        <div style={{ backgroundColor: '#FFF', padding: 20, borderRadius: 12, border: '1px solid #E2E8F0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>Passed Entries</div>
          <div style={{ fontSize: 28, fontWeight: 900, color: '#16A34A', marginTop: 4 }}>{passedCount}</div>
          <div style={{ fontSize: 11, color: '#64748B', marginTop: 4 }}>Passing percentage achieved</div>
        </div>

        <div style={{ backgroundColor: '#FFF', padding: 20, borderRadius: 12, border: '1px solid #E2E8F0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>Failed Entries</div>
          <div style={{ fontSize: 28, fontWeight: 900, color: '#DC2626', marginTop: 4 }}>{failedCount}</div>
          <div style={{ fontSize: 11, color: '#DC2626', marginTop: 4 }}>Requires academic attention</div>
        </div>

        <div style={{ backgroundColor: '#FFF', padding: 20, borderRadius: 12, border: '1px solid #E2E8F0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>Absent / Unverified</div>
          <div style={{ fontSize: 28, fontWeight: 900, color: '#D97706', marginTop: 4 }}>{absentCount}</div>
          <div style={{ fontSize: 11, color: '#64748B', marginTop: 4 }}>Students absent during exam</div>
        </div>
      </div>

      {/* Filter Controls Bar */}
      <div style={{ backgroundColor: '#FFF', padding: 16, borderRadius: 12, border: '1px solid #E2E8F0', display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div style={{ fontSize: 14, fontWeight: 800, color: '#0F172A', display: 'flex', alignItems: 'center', gap: 6 }}>
          <Filter size={16} color="#1E3A8A" /> Filter Marks Records
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 12 }}>
          <div>
            <label style={{ fontSize: 11, fontWeight: 700, color: '#475569', display: 'block', marginBottom: 4 }}>Evaluation / Exam</label>
            <select
              style={{ width: '100%', padding: '8px 12px', borderRadius: 6, border: '1px solid #CBD5E1', fontSize: 12, fontWeight: 700 }}
              value={evalFilter}
              onChange={(e) => setEvalFilter(e.target.value)}
            >
              <option value="All">All Evaluations</option>
              {evaluations.map(e => <option key={e.id} value={e.name}>{e.name}</option>)}
            </select>
          </div>

          <div>
            <label style={{ fontSize: 11, fontWeight: 700, color: '#475569', display: 'block', marginBottom: 4 }}>Class & Section</label>
            <select
              style={{ width: '100%', padding: '8px 12px', borderRadius: 6, border: '1px solid #CBD5E1', fontSize: 12, fontWeight: 700 }}
              value={classFilter}
              onChange={(e) => setClassFilter(e.target.value)}
            >
              <option value="All">All Classes</option>
              {SCHOOL_CLASSES.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
            </select>
          </div>

          <div>
            <label style={{ fontSize: 11, fontWeight: 700, color: '#475569', display: 'block', marginBottom: 4 }}>Subject</label>
            <select
              style={{ width: '100%', padding: '8px 12px', borderRadius: 6, border: '1px solid #CBD5E1', fontSize: 12, fontWeight: 700 }}
              value={subjectFilter}
              onChange={(e) => setSubjectFilter(e.target.value)}
            >
              <option value="All">All Subjects</option>
              {masterSubjects.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
            </select>
          </div>

          <div>
            <label style={{ fontSize: 11, fontWeight: 700, color: '#475569', display: 'block', marginBottom: 4 }}>Status</label>
            <select
              style={{ width: '100%', padding: '8px 12px', borderRadius: 6, border: '1px solid #CBD5E1', fontSize: 12, fontWeight: 700 }}
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="All">All Statuses</option>
              <option value="PASS">PASS</option>
              <option value="FAIL">FAIL</option>
              <option value="ABSENT">ABSENT</option>
            </select>
          </div>

          <div>
            <label style={{ fontSize: 11, fontWeight: 700, color: '#475569', display: 'block', marginBottom: 4 }}>Search Student</label>
            <div style={{ position: 'relative' }}>
              <input
                type="text"
                placeholder="Search name, admission..."
                style={{ width: '100%', padding: '8px 12px 8px 30px', borderRadius: 6, border: '1px solid #CBD5E1', fontSize: 12 }}
                value={studentSearch}
                onChange={(e) => setStudentSearch(e.target.value)}
              />
              <Search size={14} color="#94A3B8" style={{ position: 'absolute', left: 10, top: 10 }} />
            </div>
          </div>
        </div>
      </div>

      {/* Main Data Table */}
      <div style={{ backgroundColor: '#FFF', borderRadius: 12, border: '1px solid #E2E8F0', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead>
            <tr style={{ backgroundColor: '#F1F5F9', color: '#334155', textAlign: 'left', fontWeight: 800 }}>
              <th style={{ padding: '12px 16px' }}>Student Name</th>
              <th style={{ padding: '12px 16px' }}>Admission No</th>
              <th style={{ padding: '12px 16px' }}>Roll</th>
              <th style={{ padding: '12px 16px' }}>Class</th>
              <th style={{ padding: '12px 16px' }}>Subject</th>
              <th style={{ padding: '12px 16px' }}>Evaluation</th>
              <th style={{ padding: '12px 16px', textAlign: 'center' }}>Total Marks</th>
              <th style={{ padding: '12px 16px', textAlign: 'center' }}>Percentage</th>
              <th style={{ padding: '12px 16px', textAlign: 'center' }}>Grade</th>
              <th style={{ padding: '12px 16px', textAlign: 'center' }}>Status</th>
              <th style={{ padding: '12px 16px' }}>Entered By</th>
              <th style={{ padding: '12px 16px', textAlign: 'center' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredMarks.length === 0 ? (
              <tr>
                <td colSpan={12} style={{ textAlign: 'center', padding: 40, color: '#64748B' }}>
                  No student marks records match your selected filters.
                </td>
              </tr>
            ) : (
              filteredMarks.map((m) => (
                <tr key={m.id} style={{ borderBottom: '1px solid #F1F5F9' }}>
                  <td style={{ padding: '12px 16px', fontWeight: 800, color: '#0F172A' }}>{m.studentName}</td>
                  <td style={{ padding: '12px 16px', color: '#475569' }}>{m.admissionNumber}</td>
                  <td style={{ padding: '12px 16px', color: '#475569' }}>{m.rollNumber || '-'}</td>
                  <td style={{ padding: '12px 16px', fontWeight: 700, color: '#1E3A8A' }}>{m.className}</td>
                  <td style={{ padding: '12px 16px', fontWeight: 700, color: '#F97316' }}>{m.subjectName}</td>
                  <td style={{ padding: '12px 16px', color: '#475569' }}>{m.evaluationName}</td>
                  <td style={{ padding: '12px 16px', textAlign: 'center', fontWeight: 900 }}>
                    {m.isAbsent ? 'ABSENT' : `${m.totalMarks} / ${m.maximumMarks}`}
                  </td>
                  <td style={{ padding: '12px 16px', textAlign: 'center', fontWeight: 800 }}>
                    {m.isAbsent ? '-' : `${m.percentage}%`}
                  </td>
                  <td style={{ padding: '12px 16px', textAlign: 'center', fontWeight: 900, color: '#1E3A8A' }}>
                    {m.grade}
                  </td>
                  <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                    <span style={{
                      padding: '4px 8px',
                      borderRadius: 6,
                      fontSize: 11,
                      fontWeight: 800,
                      backgroundColor: m.status === 'PASS' ? '#DCFCE7' : m.status === 'ABSENT' ? '#FEF3C7' : '#FEE2E2',
                      color: m.status === 'PASS' ? '#15803D' : m.status === 'ABSENT' ? '#B45309' : '#B91C1C'
                    }}>
                      {m.status}
                    </span>
                  </td>
                  <td style={{ padding: '12px 16px', fontSize: 11, color: '#64748B' }}>
                    <div>{m.enteredBy}</div>
                    <div style={{ fontSize: 10, color: '#94A3B8' }}>{new Date(m.updatedAt || Date.now()).toLocaleDateString()}</div>
                  </td>
                  <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                    <button
                      onClick={() => handleOpenEditMark(m)}
                      style={{
                        padding: 6,
                        backgroundColor: '#F1F5F9',
                        border: '1px solid #CBD5E1',
                        borderRadius: 6,
                        cursor: 'pointer',
                        color: '#1E3A8A'
                      }}
                      title="Edit Marks Record"
                    >
                      <Edit3 size={14} />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* EDIT MARK MODAL */}
      {editMarkRecord && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.6)',
          zIndex: 99999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 20
        }}>
          <div style={{ backgroundColor: '#FFF', borderRadius: 16, padding: 24, maxWidth: 440, width: '100%' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <h3 style={{ fontSize: 16, fontWeight: 800, color: '#0F172A', margin: 0 }}>
                Edit Marks: {editMarkRecord.studentName}
              </h3>
              <button onClick={() => setEditMarkRecord(null)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                <X size={18} color="#64748B" />
              </button>
            </div>

            <div style={{ fontSize: 12, color: '#64748B', marginBottom: 16 }}>
              {editMarkRecord.className} • {editMarkRecord.subjectName} • {editMarkRecord.evaluationName}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div>
                <label style={{ fontSize: 11, fontWeight: 700, color: '#475569', display: 'block', marginBottom: 4 }}>
                  Total Obtained Marks (Max {editMarkRecord.maximumMarks})
                </label>
                <input
                  type="number"
                  disabled={editMarkForm.isAbsent}
                  style={{ width: '100%', padding: 8, borderRadius: 6, border: '1px solid #CBD5E1', fontWeight: 800, fontSize: 14 }}
                  value={editMarkForm.total}
                  onChange={(e) => setEditMarkForm(prev => ({ ...prev, total: e.target.value }))}
                />
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <input
                  type="checkbox"
                  id="chkAbsent"
                  checked={editMarkForm.isAbsent}
                  onChange={(e) => setEditMarkForm(prev => ({ ...prev, isAbsent: e.target.checked }))}
                />
                <label htmlFor="chkAbsent" style={{ fontSize: 12, fontWeight: 700, color: '#DC2626', cursor: 'pointer' }}>
                  Mark Student as ABSENT
                </label>
              </div>

              <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
                <button
                  onClick={handleSaveEditMark}
                  style={{ flex: 1, padding: 10, backgroundColor: '#16A34A', color: '#FFF', border: 'none', borderRadius: 8, fontWeight: 700, cursor: 'pointer' }}
                >
                  Save Changes
                </button>
                <button
                  onClick={() => setEditMarkRecord(null)}
                  style={{ padding: 10, backgroundColor: '#F1F5F9', color: '#475569', border: 'none', borderRadius: 8, fontWeight: 700, cursor: 'pointer' }}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ADD SUBJECT MODAL */}
      {showAddSubjectModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.6)',
          zIndex: 99999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 20
        }}>
          <div style={{ backgroundColor: '#FFF', borderRadius: 16, padding: 24, maxWidth: 460, width: '100%' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <h3 style={{ fontSize: 16, fontWeight: 800, color: '#0F172A', margin: 0 }}>
                Subject Master — Create Subject
              </h3>
              <button onClick={() => setShowAddSubjectModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                <X size={18} color="#64748B" />
              </button>
            </div>

            <form onSubmit={handleSaveSubject} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div>
                <label style={{ fontSize: 11, fontWeight: 700, color: '#475569', display: 'block', marginBottom: 4 }}>Subject Name *</label>
                <input
                  type="text"
                  placeholder="e.g. Mathematics"
                  style={{ width: '100%', padding: 8, borderRadius: 6, border: '1px solid #CBD5E1', fontSize: 13 }}
                  value={subjForm.name}
                  onChange={(e) => setSubjForm(prev => ({ ...prev, name: e.target.value }))}
                  required
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div>
                  <label style={{ fontSize: 11, fontWeight: 700, color: '#475569', display: 'block', marginBottom: 4 }}>Subject Code</label>
                  <input
                    type="text"
                    placeholder="e.g. MATH101"
                    style={{ width: '100%', padding: 8, borderRadius: 6, border: '1px solid #CBD5E1', fontSize: 13 }}
                    value={subjForm.code}
                    onChange={(e) => setSubjForm(prev => ({ ...prev, code: e.target.value }))}
                  />
                </div>

                <div>
                  <label style={{ fontSize: 11, fontWeight: 700, color: '#475569', display: 'block', marginBottom: 4 }}>Type</label>
                  <select
                    style={{ width: '100%', padding: 8, borderRadius: 6, border: '1px solid #CBD5E1', fontSize: 13 }}
                    value={subjForm.type}
                    onChange={(e) => setSubjForm(prev => ({ ...prev, type: e.target.value as any }))}
                  >
                    <option value="Theory">Theory</option>
                    <option value="Practical">Practical</option>
                    <option value="Activity">Activity</option>
                    <option value="Developmental">Developmental</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div>
                  <label style={{ fontSize: 11, fontWeight: 700, color: '#475569', display: 'block', marginBottom: 4 }}>Maximum Marks</label>
                  <input
                    type="number"
                    style={{ width: '100%', padding: 8, borderRadius: 6, border: '1px solid #CBD5E1', fontSize: 13 }}
                    value={subjForm.maxMarks}
                    onChange={(e) => setSubjForm(prev => ({ ...prev, maxMarks: e.target.value }))}
                  />
                </div>

                <div>
                  <label style={{ fontSize: 11, fontWeight: 700, color: '#475569', display: 'block', marginBottom: 4 }}>Passing Marks</label>
                  <input
                    type="number"
                    style={{ width: '100%', padding: 8, borderRadius: 6, border: '1px solid #CBD5E1', fontSize: 13 }}
                    value={subjForm.passingMarks}
                    onChange={(e) => setSubjForm(prev => ({ ...prev, passingMarks: e.target.value }))}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', gap: 10, marginTop: 12 }}>
                <button
                  type="submit"
                  style={{ flex: 1, padding: 10, backgroundColor: '#F97316', color: '#FFF', border: 'none', borderRadius: 8, fontWeight: 700, cursor: 'pointer' }}
                >
                  Save Subject
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MANAGE EVALUATIONS MODAL */}
      {showEvalModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.6)',
          zIndex: 99999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 20
        }}>
          <div style={{ backgroundColor: '#FFF', borderRadius: 16, padding: 24, maxWidth: 460, width: '100%' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <h3 style={{ fontSize: 16, fontWeight: 800, color: '#0F172A', margin: 0 }}>
                Evaluation Master — Add Period
              </h3>
              <button onClick={() => setShowEvalModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                <X size={18} color="#64748B" />
              </button>
            </div>

            <form onSubmit={handleSaveEvaluation} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div>
                <label style={{ fontSize: 11, fontWeight: 700, color: '#475569', display: 'block', marginBottom: 4 }}>Evaluation Name *</label>
                <input
                  type="text"
                  placeholder="e.g. Unit Test 1, Half Yearly Examination"
                  style={{ width: '100%', padding: 8, borderRadius: 6, border: '1px solid #CBD5E1', fontSize: 13 }}
                  value={evalForm.name}
                  onChange={(e) => setEvalForm(prev => ({ ...prev, name: e.target.value }))}
                  required
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div>
                  <label style={{ fontSize: 11, fontWeight: 700, color: '#475569', display: 'block', marginBottom: 4 }}>Academic Session</label>
                  <input
                    type="text"
                    style={{ width: '100%', padding: 8, borderRadius: 6, border: '1px solid #CBD5E1', fontSize: 13 }}
                    value={evalForm.academicSession}
                    onChange={(e) => setEvalForm(prev => ({ ...prev, academicSession: e.target.value }))}
                  />
                </div>

                <div>
                  <label style={{ fontSize: 11, fontWeight: 700, color: '#475569', display: 'block', marginBottom: 4 }}>Type</label>
                  <select
                    style={{ width: '100%', padding: 8, borderRadius: 6, border: '1px solid #CBD5E1', fontSize: 13 }}
                    value={evalForm.type}
                    onChange={(e) => setEvalForm(prev => ({ ...prev, type: e.target.value as any }))}
                  >
                    <option value="Unit Test">Unit Test</option>
                    <option value="Term Exam">Term Exam</option>
                    <option value="Annual">Annual</option>
                    <option value="Activity">Activity</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'flex', gap: 10, marginTop: 12 }}>
                <button
                  type="submit"
                  style={{ flex: 1, padding: 10, backgroundColor: '#1E3A8A', color: '#FFF', border: 'none', borderRadius: 8, fontWeight: 700, cursor: 'pointer' }}
                >
                  Save Evaluation Period
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
