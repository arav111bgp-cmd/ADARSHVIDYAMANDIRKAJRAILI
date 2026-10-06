import React, { useState, useMemo } from 'react';
import {
  Printer,
  FileText,
  FileSpreadsheet,
  Users,
  Briefcase,
  Calendar,
  Award,
  Clock,
  CalendarCheck,
  CreditCard,
  Bus as BusIcon,
  Search,
  CheckCircle2,
  ChevronRight,
  ExternalLink,
  Sparkles,
  Layers,
  Filter,
  Eye,
  RefreshCw,
  FileCheck,
  ShieldCheck,
  Check
} from 'lucide-react';
import { Student, Employee } from '../types';
import { mockSchoolClasses } from '../mock/mockData';
import { Modal } from './Modal';
import { AdmitCardModal } from './AdmitCardModal';
import { ReportCardModal } from './ReportCardModal';
import { ReceiptModal } from './ReceiptModal';
import { StudentFullDataModal } from './StudentFullDataModal';

export type AdminTab =
  | 'dashboard'
  | 'students'
  | 'teachers'
  | 'classes'
  | 'subjects'
  | 'class-subjects'
  | 'attendance'
  | 'employee-attendance'
  | 'employee-leave'
  | 'staff-leaves'
  | 'homework'
  | 'exams'
  | 'marks'
  | 'results'
  | 'admitcards'
  | 'fees'
  | 'notices'
  | 'notifications'
  | 'timetable'
  | 'reports'
  | 'transport'
  | 'certificates'
  | 'settings';

interface CentralReportsModuleProps {
  onNavigateTab: (tabId: AdminTab) => void;
  students: Student[];
  employees: Employee[];
  academicYear: string;
}

export interface DocumentCardItem {
  id: string;
  category: 'registers' | 'examination' | 'academic' | 'finance' | 'certificates' | 'transport';
  categoryLabel: string;
  title: string;
  subtitle: string;
  description: string;
  printType: string;
  targetTab: AdminTab;
  icon: React.ReactNode;
  accentColor: string;
  badges: string[];
  supportsBulk: boolean;
  supportsA4: boolean;
}

export const CentralReportsModule: React.FC<CentralReportsModuleProps> = ({
  onNavigateTab,
  students,
  employees,
  academicYear
}) => {
  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedSession, setSelectedSession] = useState<string>(academicYear || '2026-27');
  const [selectedClass, setSelectedClass] = useState<string>('All');
  const [selectedSection, setSelectedSection] = useState<string>('All');

  // Quick Action Modal State
  const [quickModalCard, setQuickModalCard] = useState<DocumentCardItem | null>(null);
  const [selectedStudentForPrint, setSelectedStudentForPrint] = useState<Student | null>(null);

  // Active Modals for direct print preview
  const [admitCardModalOpen, setAdmitCardModalOpen] = useState(false);
  const [reportCardModalOpen, setReportCardModalOpen] = useState(false);
  const [receiptModalOpen, setReceiptModalOpen] = useState(false);
  const [studentFullDataModalOpen, setStudentFullDataModalOpen] = useState(false);
  const [selectedSampleStudent, setSelectedSampleStudent] = useState<Student | null>(null);

  // Define Document Cards derived from actual supported features
  const documentCards: DocumentCardItem[] = useMemo(() => [
    // -------------------------------------------------------------------------
    // OFFICIAL REGISTERS
    // -------------------------------------------------------------------------
    {
      id: 'student-register',
      category: 'registers',
      categoryLabel: 'OFFICIAL REGISTERS',
      title: 'Student Register',
      subtitle: 'Complete student admission & class enrollment register',
      description: 'Print complete student registers filtered by class, section and academic session with photos & contact details.',
      printType: 'A4 Master Register Layout',
      targetTab: 'students',
      icon: <Users size={24} color="#FFFFFF" />,
      accentColor: '#1769E0',
      badges: ['Bulk Register', 'A4 Supported', 'Class-wise'],
      supportsBulk: true,
      supportsA4: true
    },
    {
      id: 'student-full-data',
      category: 'registers',
      categoryLabel: 'OFFICIAL REGISTERS',
      title: 'Student Full Data / Student Master Data',
      subtitle: 'Complete student master information & Excel spreadsheet export',
      description: 'View and export complete student information for the selected class and section into Microsoft Excel.',
      printType: 'Excel (.xlsx) / A4 Landscape',
      targetTab: 'students',
      icon: <FileSpreadsheet size={24} color="#FFFFFF" />,
      accentColor: '#059669',
      badges: ['Excel Export (.xlsx)', 'A4 Landscape Print', 'Full Student Profile'],
      supportsBulk: true,
      supportsA4: true
    },
    {
      id: 'employee-register',
      category: 'registers',
      categoryLabel: 'OFFICIAL REGISTERS',
      title: 'Employee / Staff Register',
      subtitle: 'Official staff directory and employee records',
      description: 'Print staff lists, teaching & non-teaching staff directory by department with designations and qualifications.',
      printType: 'A4 Staff Directory Layout',
      targetTab: 'teachers',
      icon: <Briefcase size={24} color="#FFFFFF" />,
      accentColor: '#16A34A',
      badges: ['Staff Directory', 'A4 Supported', 'Dept-wise'],
      supportsBulk: true,
      supportsA4: true
    },

    // -------------------------------------------------------------------------
    // EXAMINATION
    // -------------------------------------------------------------------------
    {
      id: 'admit-cards',
      category: 'examination',
      categoryLabel: 'EXAMINATION',
      title: 'Admit Cards',
      subtitle: 'Examination entry passes & admit cards',
      description: 'Generate and bulk print examination admit cards with QR code verification, photo & sitting timetable.',
      printType: 'A4 Single Page Per Student',
      targetTab: 'admitcards',
      icon: <FileCheck size={24} color="#FFFFFF" />,
      accentColor: '#7C3AED',
      badges: ['Bulk Batch Print', 'QR Security', 'A4 Single Page'],
      supportsBulk: true,
      supportsA4: true
    },
    {
      id: 'exam-schedule',
      category: 'examination',
      categoryLabel: 'EXAMINATION',
      title: 'Exam Schedule / Datesheet',
      subtitle: 'Class-wise examination timetable datesheet',
      description: 'Print class-wise examination datesheets, subject timings, exam center details and invigilation sittings.',
      printType: 'A4 Examination Schedule',
      targetTab: 'exams',
      icon: <Calendar size={24} color="#FFFFFF" />,
      accentColor: '#D97706',
      badges: ['Datesheet Print', 'A4 Supported', 'Class-wise'],
      supportsBulk: true,
      supportsA4: true
    },
    {
      id: 'marksheet-report-card',
      category: 'examination',
      categoryLabel: 'EXAMINATION',
      title: 'Marksheet / Report Card',
      subtitle: 'Official student progress report card with CBSE grading',
      description: 'Generate and bulk print official student report cards with scholastic marks, attendance summary & teacher remarks.',
      printType: 'A4 Official Report Card Sheet',
      targetTab: 'results',
      icon: <Award size={24} color="#FFFFFF" />,
      accentColor: '#2563EB',
      badges: ['Bulk Batch Print', 'CBSE Grading', 'A4 Portrait'],
      supportsBulk: true,
      supportsA4: true
    },

    // -------------------------------------------------------------------------
    // ACADEMIC
    // -------------------------------------------------------------------------
    {
      id: 'class-timetable',
      category: 'academic',
      categoryLabel: 'ACADEMIC',
      title: 'Class & Teacher Timetable',
      subtitle: 'Weekly class schedule & teacher period distribution',
      description: 'Print class-wise weekly timetables and individual teacher period allocation schedules with timing grids.',
      printType: 'A4 Grid Schedule Layout',
      targetTab: 'timetable',
      icon: <Clock size={24} color="#FFFFFF" />,
      accentColor: '#4F46E5',
      badges: ['Class & Teacher', 'Weekly Grid', 'A4 Supported'],
      supportsBulk: true,
      supportsA4: true
    },
    {
      id: 'attendance-reports',
      category: 'academic',
      categoryLabel: 'ACADEMIC',
      title: 'Attendance Reports',
      subtitle: 'Daily & monthly student attendance registers',
      description: 'Print daily class attendance logs, monthly percentage summaries and absentee tracking reports.',
      printType: 'A4 Monthly Attendance Sheet',
      targetTab: 'attendance',
      icon: <CalendarCheck size={24} color="#FFFFFF" />,
      accentColor: '#0D9488',
      badges: ['Monthly Register', 'Attendance %', 'A4 Supported'],
      supportsBulk: true,
      supportsA4: true
    },

    // -------------------------------------------------------------------------
    // FINANCE
    // -------------------------------------------------------------------------
    {
      id: 'fee-receipts',
      category: 'finance',
      categoryLabel: 'FINANCE',
      title: 'Fee Payment Receipts',
      subtitle: 'Official fee payment receipt slips & breakdown',
      description: 'Print official student fee collection receipts with receipt numbers, payment mode & fee head breakdown.',
      printType: 'A4 / Receipt Slip Format',
      targetTab: 'fees',
      icon: <CreditCard size={24} color="#FFFFFF" />,
      accentColor: '#059669',
      badges: ['Receipt Slip', 'Official Stamp', 'Instant Print'],
      supportsBulk: false,
      supportsA4: true
    },
    {
      id: 'fee-statements',
      category: 'finance',
      categoryLabel: 'FINANCE',
      title: 'Fee Statements & Pending Dues',
      subtitle: 'Class fee collection summary & pending dues list',
      description: 'Print class-wise fee collection registers, pending fee balance statements and defaulter reports.',
      printType: 'A4 Fee Statement Register',
      targetTab: 'fees',
      icon: <FileText size={24} color="#FFFFFF" />,
      accentColor: '#EA580C',
      badges: ['Pending Dues', 'Collection Summary', 'A4 Supported'],
      supportsBulk: true,
      supportsA4: true
    },

    // -------------------------------------------------------------------------
    // CERTIFICATES
    // -------------------------------------------------------------------------
    {
      id: 'student-certificates',
      category: 'certificates',
      categoryLabel: 'CERTIFICATES',
      title: 'Student Certificates',
      subtitle: 'Bonafide, TC, Character, Merit & Fee Clearance',
      description: 'Generate & bulk print Bonafide Certificates, Transfer Certificates, Character Certificates & Merit Awards.',
      printType: 'A4 Certificate Layout (1, 2 or 4/page)',
      targetTab: 'certificates',
      icon: <Award size={24} color="#FFFFFF" />,
      accentColor: '#E11D48',
      badges: ['Bulk Certificate', 'Multi-Layout', 'A4 Supported'],
      supportsBulk: true,
      supportsA4: true
    },
    {
      id: 'employee-certificates',
      category: 'certificates',
      categoryLabel: 'CERTIFICATES',
      title: 'Employee / Staff Certificates',
      subtitle: 'Experience, Relieving, Salary & Service Certificates',
      description: 'Generate & print official staff Experience Certificates, Relieving Letters, Salary Certificates & NOCs.',
      printType: 'A4 Staff Certificate Letterhead',
      targetTab: 'certificates',
      icon: <ShieldCheck size={24} color="#FFFFFF" />,
      accentColor: '#9333EA',
      badges: ['Staff Documents', 'Letterhead', 'A4 Supported'],
      supportsBulk: true,
      supportsA4: true
    },

    // -------------------------------------------------------------------------
    // TRANSPORT
    // -------------------------------------------------------------------------
    {
      id: 'transport-reports',
      category: 'transport',
      categoryLabel: 'TRANSPORT',
      title: 'Bus & Transport Route Reports',
      subtitle: 'Bus route passenger list & vehicle stop manifests',
      description: 'Print vehicle passenger manifests, bus route student lists, pickup stop schedules and transport fee status.',
      printType: 'A4 Route Manifest Register',
      targetTab: 'transport',
      icon: <BusIcon size={24} color="#FFFFFF" />,
      accentColor: '#D97706',
      badges: ['Route Manifest', 'Stop List', 'A4 Supported'],
      supportsBulk: true,
      supportsA4: true
    }
  ], []);

  // Filter cards by search and category
  const filteredCards = useMemo(() => {
    return documentCards.filter((card) => {
      const matchesCategory = selectedCategory === 'all' || card.category === selectedCategory;
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        card.title.toLowerCase().includes(q) ||
        card.subtitle.toLowerCase().includes(q) ||
        card.description.toLowerCase().includes(q) ||
        card.badges.some((b) => b.toLowerCase().includes(q));
      return matchesCategory && matchesSearch;
    });
  }, [documentCards, selectedCategory, searchQuery]);

  // Group filtered cards by section
  const groupedSections = useMemo(() => {
    const sections: { key: string; title: string; cards: DocumentCardItem[] }[] = [
      { key: 'registers', title: 'OFFICIAL REGISTERS', cards: [] },
      { key: 'examination', title: 'EXAMINATION DOCUMENTS', cards: [] },
      { key: 'academic', title: 'ACADEMIC & TIMETABLE', cards: [] },
      { key: 'finance', title: 'FINANCE & FEE STATEMENTS', cards: [] },
      { key: 'certificates', title: 'CERTIFICATES & DOCUMENTS', cards: [] },
      { key: 'transport', title: 'TRANSPORT & LOGISTICS', cards: [] }
    ];

    filteredCards.forEach((card) => {
      const sec = sections.find((s) => s.key === card.category);
      if (sec) sec.cards.push(card);
    });

    return sections.filter((s) => s.cards.length > 0);
  }, [filteredCards]);

  // Handle direct print action or quick launcher
  const handleOpenPrint = (card: DocumentCardItem) => {
    if (card.id === 'student-full-data') {
      setStudentFullDataModalOpen(true);
      return;
    }
    // Smoothly navigate directly to the target module's print screen
    onNavigateTab(card.targetTab);
  };

  // Helper sample student selection
  const sampleStudent = students[0] || {
    id: 'STU-001',
    name: 'Aarav Kumar',
    admissionNo: 'AVM2026001',
    className: 'Class 5',
    section: 'A',
    rollNo: '01',
    fatherName: 'Rajesh Kumar',
    motherName: 'Sunita Devi',
    dob: '2015-05-15',
    mobile: '9876543210',
    address: 'Kajraili, Bhagalpur'
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24, paddingBottom: 40 }}>
      {/* --------------------------------------------------------------------- */}
      {/* 1. HEADER BANNER & TITLE */}
      {/* --------------------------------------------------------------------- */}
      <div
        className="avm-card"
        style={{
          padding: '24px 28px',
          background: 'linear-gradient(135deg, #0F172A 0%, #1E293B 100%)',
          color: '#FFFFFF',
          borderRadius: 16,
          boxShadow: '0 4px 20px rgba(15,23,42,0.15)',
          position: 'relative',
          overflow: 'hidden'
        }}
      >
        <div
          style={{
            position: 'absolute',
            right: -20,
            bottom: -30,
            opacity: 0.06,
            pointerEvents: 'none'
          }}
        >
          <Printer size={240} color="#FFFFFF" />
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16, position: 'relative', zIndex: 2 }}>
          <div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, backgroundColor: 'rgba(23,105,224,0.25)', color: '#60A5FA', padding: '4px 12px', borderRadius: 20, fontSize: 12, fontWeight: 800, marginBottom: 10, border: '1px solid rgba(96,165,250,0.3)' }}>
              <Printer size={14} /> CENTRAL PRINT & DOCUMENT CENTER
            </div>
            <h1 style={{ fontSize: 26, fontWeight: 900, color: '#FFFFFF', margin: 0, letterSpacing: '-0.4px' }}>
              Official Document & Print Center
            </h1>
            <p style={{ fontSize: 14, color: '#94A3B8', margin: '6px 0 0 0', maxWidth: 680, lineHeight: 1.5 }}>
              Generate, preview and print official school documents and reports from one place.
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
            <div style={{ backgroundColor: 'rgba(255,255,255,0.08)', padding: '10px 16px', borderRadius: 12, border: '1px solid rgba(255,255,255,0.12)', textAlign: 'center' }}>
              <span style={{ fontSize: 11, color: '#94A3B8', display: 'block', textTransform: 'uppercase', fontWeight: 700 }}>Available Categories</span>
              <strong style={{ fontSize: 18, color: '#38BDF8', fontWeight: 900 }}>6 Hubs</strong>
            </div>
            <div style={{ backgroundColor: 'rgba(255,255,255,0.08)', padding: '10px 16px', borderRadius: 12, border: '1px solid rgba(255,255,255,0.12)', textAlign: 'center' }}>
              <span style={{ fontSize: 11, color: '#94A3B8', display: 'block', textTransform: 'uppercase', fontWeight: 700 }}>Print Formats</span>
              <strong style={{ fontSize: 18, color: '#4ADE80', fontWeight: 900 }}>12 Documents</strong>
            </div>
          </div>
        </div>
      </div>

      {/* --------------------------------------------------------------------- */}
      {/* 2. SEARCH & SMART FILTER CONTROLS */}
      {/* --------------------------------------------------------------------- */}
      <div className="avm-card" style={{ padding: 20, backgroundColor: '#FFFFFF', borderRadius: 14, boxShadow: '0 2px 8px rgba(0,0,0,0.04)', display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 14, alignItems: 'center' }}>
          {/* Quick Search Input */}
          <div style={{ position: 'relative', flex: 1 }}>
            <Search size={18} style={{ position: 'absolute', left: 14, top: 12, color: '#94A3B8' }} />
            <input
              type="text"
              className="avm-input"
              style={{ paddingLeft: 42, height: 42, fontSize: 14, borderRadius: 10, width: '100%' }}
              placeholder="Search Print & Reports (e.g. admit, certificate, timetable, marksheet, fee)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                style={{ position: 'absolute', right: 12, top: 11, background: 'none', border: 'none', color: '#94A3B8', cursor: 'pointer', fontSize: 13, fontWeight: 700 }}
              >
                Clear
              </button>
            )}
          </div>

          {/* Academic Session Smart Filter */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <label style={{ fontSize: 12, fontWeight: 800, color: '#475569', whiteSpace: 'nowrap' }}>Session:</label>
            <select
              className="avm-input"
              style={{ height: 42, borderRadius: 10, fontWeight: 700, fontSize: 13, flex: 1 }}
              value={selectedSession}
              onChange={(e) => setSelectedSession(e.target.value)}
            >
              <option value="2026-27">Academic Session 2026–27</option>
              <option value="2025-26">Academic Session 2025–26</option>
            </select>
          </div>

          {/* Class Smart Filter */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <label style={{ fontSize: 12, fontWeight: 800, color: '#475569', whiteSpace: 'nowrap' }}>Class:</label>
            <select
              className="avm-input"
              style={{ height: 42, borderRadius: 10, fontWeight: 700, fontSize: 13, flex: 1 }}
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
            >
              <option value="All">All Classes</option>
              {mockSchoolClasses.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Category Pills Switcher */}
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', borderTop: '1px solid #F1F5F9', paddingTop: 14 }}>
          {[
            { key: 'all', label: 'All Document Categories' },
            { key: 'registers', label: 'Official Registers' },
            { key: 'examination', label: 'Examination' },
            { key: 'academic', label: 'Academic & Timetable' },
            { key: 'finance', label: 'Finance & Receipts' },
            { key: 'certificates', label: 'Certificates' },
            { key: 'transport', label: 'Transport' }
          ].map((cat) => {
            const isActive = selectedCategory === cat.key;
            return (
              <button
                key={cat.key}
                type="button"
                onClick={() => setSelectedCategory(cat.key)}
                style={{
                  padding: '7px 14px',
                  borderRadius: 20,
                  fontSize: 12,
                  fontWeight: 800,
                  border: isActive ? '1px solid #1769E0' : '1px solid #E2E8F0',
                  backgroundColor: isActive ? '#EFF6FF' : '#FFFFFF',
                  color: isActive ? '#1D4ED8' : '#475569',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
              >
                {cat.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* --------------------------------------------------------------------- */}
      {/* 3. CATEGORIZED PRINT CARDS SECTIONS */}
      {/* --------------------------------------------------------------------- */}
      {groupedSections.length === 0 ? (
        <div className="avm-card" style={{ padding: 40, textAlign: 'center', backgroundColor: '#FFFFFF' }}>
          <Search size={44} color="#94A3B8" style={{ margin: '0 auto 12px auto' }} />
          <h3 style={{ fontSize: 16, fontWeight: 800, color: '#0F172A', margin: 0 }}>No document print operations match your search</h3>
          <p style={{ fontSize: 13, color: '#64748B', marginTop: 4 }}>Try clearing the search text or switching categories.</p>
          <button
            type="button"
            className="avm-btn-secondary"
            onClick={() => { setSearchQuery(''); setSelectedCategory('all'); }}
            style={{ marginTop: 12 }}
          >
            Reset Filters
          </button>
        </div>
      ) : (
        groupedSections.map((sec) => (
          <div key={sec.key} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {/* Section Header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 4, height: 18, backgroundColor: '#1769E0', borderRadius: 2 }}></div>
              <h2 style={{ fontSize: 14, fontWeight: 900, color: '#0F172A', letterSpacing: '0.6px', margin: 0, textTransform: 'uppercase' }}>
                {sec.title}
              </h2>
              <span style={{ backgroundColor: '#F1F5F9', color: '#64748B', fontSize: 11, fontWeight: 800, padding: '2px 8px', borderRadius: 10 }}>
                {sec.cards.length} {sec.cards.length === 1 ? 'Option' : 'Options'}
              </span>
            </div>

            {/* Cards Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 18 }}>
              {sec.cards.map((card) => (
                <div
                  key={card.id}
                  className="avm-card"
                  style={{
                    padding: 20,
                    backgroundColor: '#FFFFFF',
                    borderRadius: 14,
                    border: '1px solid #E2E8F0',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    gap: 16,
                    transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.03)'
                  }}
                >
                  {/* Top Card Info */}
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                      {/* Icon Badge */}
                      <div
                        style={{
                          width: 48,
                          height: 48,
                          borderRadius: 12,
                          backgroundColor: card.accentColor,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          boxShadow: `0 4px 12px ${card.accentColor}33`
                        }}
                      >
                        {card.icon}
                      </div>

                      {/* Print Format Tag */}
                      <span
                        style={{
                          backgroundColor: '#F8FAFC',
                          color: '#475569',
                          border: '1px solid #E2E8F0',
                          fontSize: 11,
                          fontWeight: 800,
                          padding: '4px 10px',
                          borderRadius: 20
                        }}
                      >
                        {card.printType}
                      </span>
                    </div>

                    <h3 style={{ fontSize: 16, fontWeight: 900, color: '#0F172A', margin: '0 0 4px 0' }}>
                      {card.title}
                    </h3>
                    <p style={{ fontSize: 12, fontWeight: 700, color: '#1769E0', margin: '0 0 8px 0' }}>
                      {card.subtitle}
                    </p>
                    <p style={{ fontSize: 13, color: '#64748B', margin: 0, lineHeight: 1.45 }}>
                      {card.description}
                    </p>

                    {/* Badges List */}
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 12 }}>
                      {card.badges.map((b, idx) => (
                        <span
                          key={idx}
                          style={{
                            backgroundColor: '#EFF6FF',
                            color: '#1D4ED8',
                            fontSize: 10,
                            fontWeight: 800,
                            padding: '2px 8px',
                            borderRadius: 6
                          }}
                        >
                          ✓ {b}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Bottom Action Footer */}
                  <div style={{ borderTop: '1px solid #F1F5F9', paddingTop: 14, display: 'flex', gap: 10, alignItems: 'center' }}>
                    <button
                      type="button"
                      className="avm-btn-primary"
                      onClick={() => handleOpenPrint(card)}
                      style={{
                        flex: 1,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 8,
                        padding: '10px 16px',
                        fontSize: 13,
                        fontWeight: 800,
                        backgroundColor: card.accentColor,
                        borderColor: card.accentColor
                      }}
                    >
                      <Printer size={16} /> Open Print
                    </button>
                    <button
                      type="button"
                      className="avm-btn-secondary"
                      onClick={() => setQuickModalCard(card)}
                      title="Quick Preview Print Info"
                      style={{ padding: '10px 12px' }}
                    >
                      <Eye size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))
      )}

      {/* --------------------------------------------------------------------- */}
      {/* 4. QUICK PREVIEW MODAL */}
      {/* --------------------------------------------------------------------- */}
      {quickModalCard && (
        <Modal
          isOpen={!!quickModalCard}
          onClose={() => setQuickModalCard(null)}
          title={`Central Print — ${quickModalCard.title}`}
          maxWidth="600px"
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div
              style={{
                backgroundColor: '#F8FAFC',
                border: '1px solid #E2E8F0',
                borderRadius: 12,
                padding: 16,
                display: 'flex',
                gap: 14,
                alignItems: 'center'
              }}
            >
              <div
                style={{
                  width: 52,
                  height: 52,
                  borderRadius: 12,
                  backgroundColor: quickModalCard.accentColor,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                {quickModalCard.icon}
              </div>
              <div>
                <h4 style={{ fontSize: 16, fontWeight: 900, color: '#0F172A', margin: 0 }}>
                  {quickModalCard.title}
                </h4>
                <p style={{ fontSize: 12, color: '#64748B', margin: '2px 0 0 0' }}>
                  {quickModalCard.subtitle}
                </p>
                <div style={{ fontSize: 11, fontWeight: 800, color: '#1769E0', marginTop: 4 }}>
                  Target Module: {quickModalCard.targetTab.toUpperCase()}
                </div>
              </div>
            </div>

            <div style={{ fontSize: 13, color: '#334155', lineHeight: 1.5 }}>
              <strong>Description:</strong> {quickModalCard.description}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, fontSize: 12 }}>
              <div style={{ backgroundColor: '#EFF6FF', padding: 10, borderRadius: 8, border: '1px solid #BFDBFE' }}>
                <span style={{ color: '#1E40AF', fontWeight: 800, display: 'block' }}>Print Format</span>
                <strong style={{ color: '#0F172A' }}>{quickModalCard.printType}</strong>
              </div>
              <div style={{ backgroundColor: '#F0FDF4', padding: 10, borderRadius: 8, border: '1px solid #BBF7D0' }}>
                <span style={{ color: '#15803D', fontWeight: 800, display: 'block' }}>Bulk Batch Support</span>
                <strong style={{ color: '#0F172A' }}>{quickModalCard.supportsBulk ? 'Yes (Bulk Class Action)' : 'Individual Action'}</strong>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 8 }}>
              <button
                type="button"
                className="avm-btn-secondary"
                onClick={() => setQuickModalCard(null)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="avm-btn-primary"
                onClick={() => {
                  const target = quickModalCard.targetTab;
                  setQuickModalCard(null);
                  onNavigateTab(target);
                }}
                style={{
                  backgroundColor: quickModalCard.accentColor,
                  borderColor: quickModalCard.accentColor,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8
                }}
              >
                <Printer size={16} /> Launch Print Interface
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Direct Modal Triggers if sample selected */}
      {admitCardModalOpen && selectedSampleStudent && (
        <AdmitCardModal
          isOpen={admitCardModalOpen}
          onClose={() => setAdmitCardModalOpen(false)}
          student={selectedSampleStudent}
        />
      )}

      {reportCardModalOpen && selectedSampleStudent && (
        <ReportCardModal
          isOpen={reportCardModalOpen}
          onClose={() => setReportCardModalOpen(false)}
          student={selectedSampleStudent}
          result={{
            id: 'RES-SAMPLE-001',
            studentId: selectedSampleStudent.id,
            examId: 'EX-001',
            examName: 'First Term Examination',
            className: selectedSampleStudent.className,
            section: selectedSampleStudent.section,
            academicSessionId: selectedSession,
            isEarlyYears: false,
            marks: [
              { subject: 'Mathematics', maxMarks: 100, marksObtained: 88, grade: 'A+' },
              { subject: 'Science', maxMarks: 100, marksObtained: 85, grade: 'A+' },
              { subject: 'English', maxMarks: 100, marksObtained: 78, grade: 'B+' },
              { subject: 'Hindi', maxMarks: 100, marksObtained: 82, grade: 'A' },
              { subject: 'Social Science', maxMarks: 100, marksObtained: 90, grade: 'A+' }
            ],
            totalObtained: 423,
            totalMax: 500,
            percentage: 84.6,
            grade: 'A+',
            teacherRemarks: 'Outstanding academic performance and exemplary conduct throughout the session.',
            issueDate: '2026-10-01'
          }}
        />
      )}

      {receiptModalOpen && selectedSampleStudent && (
        <ReceiptModal
          isOpen={receiptModalOpen}
          onClose={() => setReceiptModalOpen(false)}
          student={selectedSampleStudent}
          payment={{
            receiptNo: 'REC-2026-001',
            date: '2026-10-01',
            amount: 4500,
            paymentMode: 'Cash',
            status: 'Paid',
            description: 'Monthly Tuition & Annual Development Fee'
          }}
        />
      )}

      {studentFullDataModalOpen && (
        <StudentFullDataModal
          isOpen={studentFullDataModalOpen}
          onClose={() => setStudentFullDataModalOpen(false)}
          students={students}
          academicSession={selectedSession}
        />
      )}
    </div>
  );
};
