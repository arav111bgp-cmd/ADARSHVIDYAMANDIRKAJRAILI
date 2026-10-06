import React, { useState, useMemo } from 'react';
import { Student } from '../types';
import { classService } from '../services/classService';
import { mockSchoolInfo } from '../mock/mockData';
import { demoDataStore } from '../services/demoDataStore';
import { Modal } from './Modal';
import {
  FileSpreadsheet,
  Printer,
  Search,
  Users,
  Filter,
  CheckCircle2,
  X,
  Download,
  Calendar,
  Layers,
  Sparkles,
  ArrowRight
} from 'lucide-react';
import * as XLSX from 'xlsx';

interface StudentFullDataModalProps {
  isOpen: boolean;
  onClose: () => void;
  students?: Student[];
  academicSession?: string;
}

export const StudentFullDataModal: React.FC<StudentFullDataModalProps> = ({
  isOpen,
  onClose,
  students: propStudents,
  academicSession = '2026-27'
}) => {
  // Load dynamic classes list from classService
  const masterClasses = useMemo(() => {
    return classService.getAllClasses();
  }, []);

  // Filter Controls State
  const [selectedSession, setSelectedSession] = useState<string>(academicSession || '2026-27');
  const [selectedClassGrade, setSelectedClassGrade] = useState<string>('Class 5');
  const [selectedSection, setSelectedSection] = useState<string>('A');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Extract unique grades list (e.g. Nursery, LKG, UKG, Class 1 ... Class 8)
  const availableGrades = useMemo(() => {
    const grades = new Set<string>();
    masterClasses.forEach((c) => {
      if (c.grade) grades.add(c.grade);
    });
    // Fallback standard grades if empty
    if (grades.size === 0) {
      ['Nursery', 'LKG', 'UKG', 'Class 1', 'Class 2', 'Class 3', 'Class 4', 'Class 5', 'Class 6', 'Class 7', 'Class 8'].forEach(g => grades.add(g));
    }
    return Array.from(grades);
  }, [masterClasses]);

  // Extract sections available for selected grade
  const availableSections = useMemo(() => {
    const secs = new Set<string>();
    masterClasses.forEach((c) => {
      if (c.grade.toLowerCase() === selectedClassGrade.toLowerCase() && c.section) {
        secs.add(c.section);
      }
    });
    if (secs.size === 0) {
      ['A', 'B', 'C', 'D'].forEach((s) => secs.add(s));
    }
    return ['All', ...Array.from(secs)];
  }, [masterClasses, selectedClassGrade]);

  // Fetch all students from central demoDataStore / propStudents
  const allStudentsList = useMemo(() => {
    if (propStudents && propStudents.length > 0) return propStudents;
    const db = demoDataStore.getDB();
    return db.students || [];
  }, [propStudents]);

  // Filter students by selected Class, Section, Session & Search Query
  const filteredStudents = useMemo(() => {
    return allStudentsList.filter((stu) => {
      const rawClass = (stu.className || '').trim();
      const cleanBaseClass = rawClass.split('-')[0].trim();
      const stuSection = stu.section || (rawClass.includes('-') ? rawClass.split('-')[1].trim() : 'A');

      // Match Class Grade
      const matchesClass =
        cleanBaseClass.toLowerCase() === selectedClassGrade.toLowerCase() ||
        rawClass.toLowerCase() === selectedClassGrade.toLowerCase() ||
        rawClass.toLowerCase().startsWith(selectedClassGrade.toLowerCase());

      // Match Section
      const matchesSection =
        selectedSection === 'All' ||
        stuSection.toLowerCase() === selectedSection.toLowerCase();

      // Match Search Query
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        stu.name.toLowerCase().includes(q) ||
        (stu.admissionNo || '').toLowerCase().includes(q) ||
        String(stu.rollNo || '').includes(q) ||
        (stu.fatherName || '').toLowerCase().includes(q) ||
        (stu.phone || '').includes(q);

      return matchesClass && matchesSection && matchesSearch;
    });
  }, [allStudentsList, selectedClassGrade, selectedSection, searchQuery]);

  // ---------------------------------------------------------------------------
  // EXCEL EXPORT FUNCTION
  // ---------------------------------------------------------------------------
  const handleExportExcel = () => {
    if (filteredStudents.length === 0) {
      alert('No student records found matching the selected class and filters.');
      return;
    }

    const metaRows = [
      ['ADARSH VIDYA MANDIR'],
      ['KAJRAILI, BHAGALPUR, BIHAR • OFFICIAL ERP REPORT'],
      ['STUDENT MASTER DATA & FULL PROFILE EXPORT'],
      [
        `Academic Session: ${selectedSession}`,
        `Class: ${selectedClassGrade}`,
        `Section: ${selectedSection}`,
        `Total Records: ${filteredStudents.length}`,
        `Export Date: ${new Date().toLocaleDateString('en-GB')}`
      ],
      []
    ];

    const tableHeaders = [
      'S.No.',
      'Admission No',
      'Student ID',
      'Student Full Name',
      'Roll No',
      'Class',
      'Section',
      'Academic Session',
      'Gender',
      'Date of Birth',
      'Blood Group',
      'Category',
      'Nationality',
      'Aadhaar Number',
      'Father Name',
      'Father Occupation',
      'Mother Name',
      'Mother Occupation',
      'Guardian Name',
      'Contact Phone',
      'Alternate Phone',
      'Email Address',
      'Address',
      'City',
      'District',
      'State',
      'Pin Code',
      'Admission Date',
      'Previous School',
      'Transport Opted',
      'Transport Route',
      'Pickup Stop',
      'Transport Fee',
      'Previous Dues',
      'Session Fee',
      'Total Fee',
      'Paid Fee',
      'Pending Fee',
      'Emergency Contact',
      'Emergency Phone',
      'Status'
    ];

    const dataRows = filteredStudents.map((stu, idx) => [
      idx + 1,
      stu.admissionNo || '',
      stu.id || '',
      stu.name || '',
      stu.rollNo || '-',
      stu.className || selectedClassGrade,
      stu.section || selectedSection,
      stu.academicSessionId || selectedSession,
      stu.gender || '',
      stu.dob || stu.dateOfBirth || '',
      stu.bloodGroup || '',
      stu.category || 'General',
      stu.nationality || 'Indian',
      stu.aadhaar || '',
      stu.fatherName || '',
      stu.fatherOcc || '',
      stu.motherName || '',
      stu.motherOcc || '',
      stu.guardianName || '',
      stu.phone || '',
      stu.altPhone || '',
      stu.email || '',
      stu.address || '',
      stu.city || 'Bhagalpur',
      stu.district || 'Bhagalpur',
      stu.state || 'Bihar',
      stu.pinCode || '812005',
      stu.admissionDate || '',
      stu.previousSchool || '',
      stu.transportReq || 'No',
      stu.transportRoute || '',
      stu.transportVillage || stu.transportStop || '',
      stu.transportFee || 0,
      stu.previousDue || 0,
      stu.sessionFee || 0,
      stu.totalFee || 0,
      stu.paidFee || 0,
      stu.pendingFee || 0,
      stu.emgName || '',
      stu.emgPhone || '',
      stu.status || 'Active'
    ]);

    // Build Master Data Sheet
    const wsMaster = XLSX.utils.aoa_to_sheet([...metaRows, tableHeaders, ...dataRows]);

    wsMaster['!cols'] = [
      { wch: 6 },  { wch: 15 }, { wch: 12 }, { wch: 24 }, { wch: 8 },
      { wch: 10 }, { wch: 8 },  { wch: 16 }, { wch: 10 }, { wch: 12 },
      { wch: 12 }, { wch: 12 }, { wch: 12 }, { wch: 16 }, { wch: 22 },
      { wch: 18 }, { wch: 22 }, { wch: 18 }, { wch: 20 }, { wch: 15 },
      { wch: 15 }, { wch: 22 }, { wch: 32 }, { wch: 14 }, { wch: 14 },
      { wch: 12 }, { wch: 10 }, { wch: 14 }, { wch: 22 }, { wch: 14 },
      { wch: 18 }, { wch: 18 }, { wch: 14 }, { wch: 14 }, { wch: 14 },
      { wch: 14 }, { wch: 14 }, { wch: 14 }, { wch: 18 }, { wch: 15 },
      { wch: 10 }
    ];

    // Build Parents Sheet
    const parentHeaders = ['S.No.', 'Admission No', 'Student Name', 'Class-Sec', 'Father Name', 'Father Occupation', 'Mother Name', 'Mother Occupation', 'Guardian Name', 'Phone', 'Alt Phone', 'Address'];
    const parentRows = filteredStudents.map((stu, idx) => [
      idx + 1,
      stu.admissionNo || '',
      stu.name || '',
      `${stu.className || selectedClassGrade}-${stu.section || selectedSection}`,
      stu.fatherName || '',
      stu.fatherOcc || '',
      stu.motherName || '',
      stu.motherOcc || '',
      stu.guardianName || '',
      stu.phone || '',
      stu.altPhone || '',
      stu.address || ''
    ]);
    const wsParents = XLSX.utils.aoa_to_sheet([...metaRows, parentHeaders, ...parentRows]);

    // Build Financial & Transport Sheet
    const finHeaders = ['S.No.', 'Admission No', 'Student Name', 'Class-Sec', 'Session Fee', 'Total Fee', 'Paid Fee', 'Pending Fee', 'Transport Required', 'Route', 'Transport Fee'];
    const finRows = filteredStudents.map((stu, idx) => [
      idx + 1,
      stu.admissionNo || '',
      stu.name || '',
      `${stu.className || selectedClassGrade}-${stu.section || selectedSection}`,
      stu.sessionFee || 0,
      stu.totalFee || 0,
      stu.paidFee || 0,
      stu.pendingFee || 0,
      stu.transportReq || 'No',
      stu.transportRoute || '',
      stu.transportFee || 0
    ]);
    const wsFin = XLSX.utils.aoa_to_sheet([...metaRows, finHeaders, ...finRows]);

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, wsMaster, 'Student Master Data');
    XLSX.utils.book_append_sheet(wb, wsParents, 'Parent & Guardian Details');
    XLSX.utils.book_append_sheet(wb, wsFin, 'Financial & Transport');

    const cleanClass = selectedClassGrade.replace(/\s+/g, '_');
    const fileName = `AVM_Student_Full_Data_${cleanClass}_${selectedSection}_${selectedSession.replace(/\s+/g, '_')}.xlsx`;
    XLSX.writeFile(wb, fileName);
  };

  // ---------------------------------------------------------------------------
  // PRINT FUNCTION
  // ---------------------------------------------------------------------------
  const handlePrint = () => {
    window.print();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Student Master Data & Export — ${selectedClassGrade}-${selectedSection}`}
      maxWidth="1100px"
    >
      {/* Inject Print-Specific CSS */}
      <style>{`
        @media print {
          @page {
            size: A4 landscape;
            margin: 8mm;
          }
          body * {
            visibility: hidden !important;
          }
          .printable-student-full-data-sheet, .printable-student-full-data-sheet * {
            visibility: visible !important;
          }
          .printable-student-full-data-sheet {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            margin: 0 !important;
            padding: 4mm !important;
            box-shadow: none !important;
            background: #ffffff !important;
          }
          .no-print {
            display: none !important;
          }
        }
      `}</style>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
        {/* ------------------------------------------------------------------- */}
        {/* TOP CONTROLS & FILTER BAR */}
        {/* ------------------------------------------------------------------- */}
        <div className="no-print" style={{ backgroundColor: '#F8FAFC', padding: 16, borderRadius: 12, border: '1px solid #E2E8F0', display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12, alignItems: 'center' }}>
            {/* Academic Session */}
            <div>
              <label style={{ fontSize: 11, fontWeight: 800, color: '#475569', display: 'block', marginBottom: 4 }}>
                Academic Session:
              </label>
              <select
                className="avm-input"
                style={{ width: '100%', fontWeight: 700 }}
                value={selectedSession}
                onChange={(e) => setSelectedSession(e.target.value)}
              >
                <option value="2026-27">Academic Session 2026–27</option>
                <option value="2025-26">Academic Session 2025–26</option>
              </select>
            </div>

            {/* Class Dropdown */}
            <div>
              <label style={{ fontSize: 11, fontWeight: 800, color: '#475569', display: 'block', marginBottom: 4 }}>
                Class:
              </label>
              <select
                className="avm-input"
                style={{ width: '100%', fontWeight: 800, color: '#1769E0' }}
                value={selectedClassGrade}
                onChange={(e) => setSelectedClassGrade(e.target.value)}
              >
                {availableGrades.map((g) => (
                  <option key={g} value={g}>{g}</option>
                ))}
              </select>
            </div>

            {/* Section Dropdown */}
            <div>
              <label style={{ fontSize: 11, fontWeight: 800, color: '#475569', display: 'block', marginBottom: 4 }}>
                Section:
              </label>
              <select
                className="avm-input"
                style={{ width: '100%', fontWeight: 700 }}
                value={selectedSection}
                onChange={(e) => setSelectedSection(e.target.value)}
              >
                {availableSections.map((s) => (
                  <option key={s} value={s}>{s === 'All' ? 'All Sections' : `Section ${s}`}</option>
                ))}
              </select>
            </div>

            {/* Search Input */}
            <div style={{ flex: 1 }}>
              <label style={{ fontSize: 11, fontWeight: 800, color: '#475569', display: 'block', marginBottom: 4 }}>
                Search Student:
              </label>
              <div style={{ position: 'relative' }}>
                <Search size={16} style={{ position: 'absolute', left: 10, top: 9, color: '#94A3B8' }} />
                <input
                  type="text"
                  className="avm-input"
                  style={{ paddingLeft: 34, width: '100%', fontSize: 13 }}
                  placeholder="Filter name, admission no, phone..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Quick Stats & Action Buttons Bar */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #CBD5E1', paddingTop: 12, flexWrap: 'wrap', gap: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ backgroundColor: '#1769E0', color: '#FFFFFF', fontSize: 12, fontWeight: 900, padding: '4px 12px', borderRadius: 20 }}>
                {filteredStudents.length} Students Found
              </span>
              <span style={{ fontSize: 12, color: '#475569', fontWeight: 700 }}>
                Class: <strong style={{ color: '#0F172A' }}>{selectedClassGrade}-{selectedSection}</strong> • Session {selectedSession}
              </span>
            </div>

            <div style={{ display: 'flex', gap: 10 }}>
              <button
                type="button"
                className="avm-btn-primary"
                onClick={handleExportExcel}
                style={{ backgroundColor: '#16A34A', borderColor: '#16A34A', display: 'flex', alignItems: 'center', gap: 8, padding: '8px 18px', fontWeight: 800 }}
              >
                <FileSpreadsheet size={18} /> Export Excel (.xlsx)
              </button>
              <button
                type="button"
                className="avm-btn-secondary"
                onClick={handlePrint}
                style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 16px', fontWeight: 800 }}
              >
                <Printer size={16} /> Print Report
              </button>
            </div>
          </div>
        </div>

        {/* ------------------------------------------------------------------- */}
        {/* PRINTABLE SHEET CONTAINER / PREVIEW TABLE */}
        {/* ------------------------------------------------------------------- */}
        <div className="printable-student-full-data-sheet">
          {/* Print Header */}
          <div style={{ textAlign: 'center', borderBottom: '2px solid #0F172A', paddingBottom: 10, marginBottom: 14 }}>
            <h2 style={{ fontSize: 20, fontWeight: 900, color: '#0F172A', margin: 0, letterSpacing: '0.5px' }}>
              ADARSH VIDYA MANDIR
            </h2>
            <p style={{ fontSize: 11, color: '#475569', fontWeight: 700, margin: '2px 0 4px 0' }}>
              KAJRAILI, BHAGALPUR, BIHAR • OFFICIAL STUDENT MASTER DATA REPORT
            </p>
            <div style={{ display: 'flex', justifyContent: 'center', gap: 16, fontSize: 11, fontWeight: 800, color: '#1769E0', marginTop: 4 }}>
              <span>ACADEMIC SESSION: {selectedSession}</span>
              <span>CLASS & SECTION: {selectedClassGrade}-{selectedSection}</span>
              <span>TOTAL STUDENTS: {filteredStudents.length}</span>
              <span>DATE: {new Date().toLocaleDateString('en-GB')}</span>
            </div>
          </div>

          {/* Student Table */}
          <div style={{ overflowX: 'auto', border: '1px solid #CBD5E1', borderRadius: 8 }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
              <thead>
                <tr style={{ backgroundColor: '#0F172A', color: '#FFFFFF', textAlign: 'left' }}>
                  <th style={{ padding: '8px 10px', width: 40, textAlign: 'center' }}>S.No.</th>
                  <th style={{ padding: '8px 10px' }}>Admission No</th>
                  <th style={{ padding: '8px 10px' }}>Roll</th>
                  <th style={{ padding: '8px 10px' }}>Student Name</th>
                  <th style={{ padding: '8px 10px' }}>Gender</th>
                  <th style={{ padding: '8px 10px' }}>DOB</th>
                  <th style={{ padding: '8px 10px' }}>Father's Name</th>
                  <th style={{ padding: '8px 10px' }}>Mother's Name</th>
                  <th style={{ padding: '8px 10px' }}>Contact Phone</th>
                  <th style={{ padding: '8px 10px' }}>Category / Blood</th>
                  <th style={{ padding: '8px 10px' }}>Address</th>
                  <th style={{ padding: '8px 10px', textAlign: 'center' }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredStudents.length === 0 ? (
                  <tr>
                    <td colSpan={12} style={{ padding: 24, textAlign: 'center', color: '#64748B', fontStyle: 'italic' }}>
                      No active student records found for {selectedClassGrade}-{selectedSection}.
                    </td>
                  </tr>
                ) : (
                  filteredStudents.map((stu, idx) => (
                    <tr
                      key={stu.id || idx}
                      style={{
                        borderBottom: '1px solid #E2E8F0',
                        backgroundColor: idx % 2 === 0 ? '#FFFFFF' : '#F8FAFC'
                      }}
                    >
                      <td style={{ padding: '7px 10px', textAlign: 'center', fontWeight: 600, color: '#64748B' }}>
                        {idx + 1}
                      </td>
                      <td style={{ padding: '7px 10px', fontWeight: 800, color: '#1769E0', whiteSpace: 'nowrap' }}>
                        {stu.admissionNo}
                      </td>
                      <td style={{ padding: '7px 10px', fontWeight: 800, color: '#0F172A', textAlign: 'center' }}>
                        {stu.rollNo || '-'}
                      </td>
                      <td style={{ padding: '7px 10px', fontWeight: 900, color: '#0F172A' }}>
                        {stu.name}
                      </td>
                      <td style={{ padding: '7px 10px', color: '#475569' }}>
                        {stu.gender}
                      </td>
                      <td style={{ padding: '7px 10px', color: '#475569', whiteSpace: 'nowrap' }}>
                        {stu.dob || stu.dateOfBirth || '-'}
                      </td>
                      <td style={{ padding: '7px 10px', fontWeight: 700, color: '#334155' }}>
                        {stu.fatherName || '-'}
                      </td>
                      <td style={{ padding: '7px 10px', color: '#475569' }}>
                        {stu.motherName || '-'}
                      </td>
                      <td style={{ padding: '7px 10px', fontWeight: 800, color: '#059669', whiteSpace: 'nowrap' }}>
                        {stu.phone || '-'}
                      </td>
                      <td style={{ padding: '7px 10px', color: '#475569' }}>
                        {stu.category || 'General'} ({stu.bloodGroup || 'O+'})
                      </td>
                      <td style={{ padding: '7px 10px', color: '#64748B', maxWidth: 200, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {stu.address || '-'}
                      </td>
                      <td style={{ padding: '7px 10px', textAlign: 'center' }}>
                        <span style={{ backgroundColor: '#DCFCE7', color: '#15803D', fontSize: 10, fontWeight: 900, padding: '2px 8px', borderRadius: 10 }}>
                          {stu.status || 'Active'}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Print Footer */}
          <div style={{ marginTop: 14, paddingTop: 8, borderTop: '1px solid #CBD5E1', display: 'flex', justifyContent: 'space-between', fontSize: 10, color: '#64748B' }}>
            <span>Adarsh Vidya Mandir • Student Full Data Master Export</span>
            <span>Generated via AVM ERP Print Center</span>
            <span>Page 1 of 1</span>
          </div>
        </div>

        {/* Modal Bottom Actions */}
        <div className="no-print" style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 10 }}>
          <button type="button" className="avm-btn-secondary" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </Modal>
  );
};
