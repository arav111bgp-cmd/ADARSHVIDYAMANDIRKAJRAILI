import { CertificateItem, CertificateTypeItem, CertificateTemplateItem, CertificateSettings } from '../types';
import { demoDataStore } from './demoDataStore';

const DEFAULT_TYPES: CertificateTypeItem[] = [
  { id: 'CT-01', name: 'Bonafide Certificate', code: 'BONAFIDE', description: 'Official Bonafide Student Certificate for Bank/Passport/Scholarship', status: 'Active', createdDate: '2026-04-01' },
  { id: 'CT-02', name: 'Character Certificate', code: 'CHARACTER', description: 'Student Good Conduct & Moral Character Certificate', status: 'Active', createdDate: '2026-04-01' },
  { id: 'CT-03', name: 'Transfer Certificate', code: 'TC', description: 'School Transfer Certificate upon leaving school', status: 'Active', createdDate: '2026-04-01' },
  { id: 'CT-04', name: 'Study Certificate', code: 'STUDY', description: 'Class & Session Continuation Study Certificate', status: 'Active', createdDate: '2026-04-01' },
  { id: 'CT-05', name: 'Fee Certificate', code: 'FEE', description: 'Paid School Fee Structure Verification Certificate', status: 'Active', createdDate: '2026-04-01' },
  { id: 'CT-06', name: 'DOB Certificate', code: 'DOB', description: 'Date of Birth Verification Certificate from Register', status: 'Active', createdDate: '2026-04-01' },
  { id: 'CT-07', name: 'School Leaving Certificate', code: 'SLC', description: 'School Leaving Certificate for higher education transfer', status: 'Active', createdDate: '2026-04-01' },
  { id: 'CT-08', name: 'Achievement Certificate', code: 'ACHIEVE', description: 'Academic, Sports & Extra-Curricular Achievement Award', status: 'Active', createdDate: '2026-04-01' }
];

const DEFAULT_TEMPLATES: CertificateTemplateItem[] = [
  {
    id: 'TPL-01',
    name: 'Standard Bonafide Template',
    type: 'Bonafide Certificate',
    headerText: 'ADARSH VIDYA MANDIR • KAJRAILI, BHAGALPUR',
    titleText: 'TO WHOM IT MAY CONCERN',
    bodyTemplate: 'This is to certify that {StudentName}, S/o / D/o Mr. {FatherName}, resident of {Address}. He/She is studying in our institution in {ClassName}-{Section}. Date of birth recorded in our admission register is {DOB}.',
    footerText: 'Place: Kajraili • Principal Adarsh Vidya Mandir',
    includePhoto: true,
    includeSeal: true,
    includeSignature: true,
    status: 'Active'
  },
  {
    id: 'TPL-02',
    name: 'Character Certificate Template',
    type: 'Character Certificate',
    headerText: 'ADARSH VIDYA MANDIR • KAJRAILI, BHAGALPUR',
    titleText: 'CHARACTER & CONDUCT CERTIFICATE',
    bodyTemplate: 'This is to certify that {StudentName}, Admission No. {AdmissionNo}, has been a student of Class {ClassName}-{Section}. During his/her stay in this institution, his/her character and conduct have been found EXCELLENT.',
    footerText: 'Place: Kajraili • Principal Adarsh Vidya Mandir',
    includePhoto: true,
    includeSeal: true,
    includeSignature: true,
    status: 'Active'
  }
];

const DEFAULT_SETTINGS: CertificateSettings = {
  prefix: 'CERT-2026-',
  autoNumbering: true,
  defaultIssueDate: new Date().toISOString().split('T')[0],
  includePhoto: true,
  includeAdmissionDetails: true,
  includeDateOfIssue: true,
  includeSchoolSeal: true,
  includeSignature: true,
  defaultPrintLayout: '1 Certificate Per Page (A4)'
};

const DEFAULT_ISSUED: CertificateItem[] = [
  {
    id: 'CERT-001',
    certificateNo: 'CERT-2026-001',
    type: 'Bonafide Certificate',
    studentId: 'STU-157',
    studentName: 'Rahul Kumar',
    admissionNo: 'AVM20260501',
    className: 'Class 5',
    section: 'A',
    rollNo: 1,
    dob: '17/02/2014',
    fatherName: 'Santosh Kumar Mandal',
    motherName: 'Sunita Devi',
    address: 'Kajraili, District - Bhagalpur',
    photo: 'https://images.unsplash.com/photo-1544717305-2782549b5136?w=150',
    issueDate: '24/08/2026',
    issuedBy: 'Admin Desk',
    status: 'Issued',
    createdAt: '2026-08-24'
  },
  {
    id: 'CERT-002',
    certificateNo: 'CERT-2026-002',
    type: 'Bonafide Certificate',
    studentId: 'STU-158',
    studentName: 'Ananya Verma',
    admissionNo: 'AVM20260502',
    className: 'Class 5',
    section: 'A',
    rollNo: 2,
    dob: '12/05/2015',
    fatherName: 'Ramesh Verma',
    motherName: 'Meena Devi',
    address: 'Kajraili, Bhagalpur',
    photo: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150',
    issueDate: '24/08/2026',
    issuedBy: 'Admin Desk',
    status: 'Issued',
    createdAt: '2026-08-24'
  },
  {
    id: 'CERT-003',
    certificateNo: 'CERT-2026-003',
    type: 'Character Certificate',
    studentId: 'STU-159',
    studentName: 'Amit Sharma',
    admissionNo: 'AVM20260503',
    className: 'Class 5',
    section: 'A',
    rollNo: 3,
    dob: '08/09/2014',
    fatherName: 'Vikram Sharma',
    motherName: 'Priya Sharma',
    address: 'Amarpur, Bhagalpur',
    issueDate: '20/08/2026',
    issuedBy: 'Principal Office',
    status: 'Issued',
    createdAt: '2026-08-20'
  }
];

export const certificateService = {
  getCertificates(): CertificateItem[] {
    const db = demoDataStore.getDB();
    if (!Array.isArray(db.certificates) || db.certificates.length === 0) {
      db.certificates = [...DEFAULT_ISSUED];
      demoDataStore.saveDB(db);
    }
    return db.certificates;
  },

  getCertificateTypes(): CertificateTypeItem[] {
    const db = demoDataStore.getDB();
    if (!Array.isArray(db.certificateTypes) || db.certificateTypes.length === 0) {
      db.certificateTypes = [...DEFAULT_TYPES];
      demoDataStore.saveDB(db);
    }
    return db.certificateTypes;
  },

  getTemplates(): CertificateTemplateItem[] {
    const db = demoDataStore.getDB();
    if (!Array.isArray(db.certificateTemplates) || db.certificateTemplates.length === 0) {
      db.certificateTemplates = [...DEFAULT_TEMPLATES];
      demoDataStore.saveDB(db);
    }
    return db.certificateTemplates;
  },

  getSettings(): CertificateSettings {
    const db = demoDataStore.getDB();
    if (!db.certificateSettings) {
      db.certificateSettings = { ...DEFAULT_SETTINGS };
      demoDataStore.saveDB(db);
    }
    return db.certificateSettings;
  },

  issueCertificate(data: Partial<CertificateItem>): CertificateItem {
    const db = demoDataStore.getDB();
    const existing = this.getCertificates();
    const settings = this.getSettings();

    const certSeq = existing.length + 1;
    const certNo = data.certificateNo || `${settings.prefix}${String(certSeq).padStart(3, '0')}`;
    const newId = `CERT-${Date.now().toString().slice(-6)}`;

    const newCert: CertificateItem = {
      id: newId,
      certificateNo: certNo,
      type: data.type || 'Bonafide Certificate',
      studentId: data.studentId || 'STU-101',
      studentName: data.studentName || 'Student Name',
      admissionNo: data.admissionNo || 'AVM2026001',
      className: data.className || 'Class 5',
      section: data.section || 'A',
      rollNo: data.rollNo || 1,
      dob: data.dob || '17/02/2014',
      fatherName: data.fatherName || 'Father Name',
      motherName: data.motherName || 'Mother Name',
      address: data.address || 'Kajraili, Bhagalpur',
      photo: data.photo,
      issueDate: data.issueDate || new Date().toISOString().split('T')[0],
      issuedBy: data.issuedBy || 'Admin Desk',
      purpose: data.purpose,
      remarks: data.remarks,
      status: data.status || 'Issued',
      createdAt: new Date().toISOString().split('T')[0]
    };

    db.certificates = [newCert, ...existing];
    demoDataStore.saveDB(db);
    return newCert;
  },

  addCertificateType(typeData: Partial<CertificateTypeItem>): CertificateTypeItem {
    const db = demoDataStore.getDB();
    const types = this.getCertificateTypes();
    const newType: CertificateTypeItem = {
      id: `CT-${Date.now().toString().slice(-4)}`,
      name: typeData.name || 'New Certificate',
      code: (typeData.code || typeData.name || 'CERT').toUpperCase().replace(/\s+/g, '_'),
      description: typeData.description || '',
      status: typeData.status || 'Active',
      createdDate: new Date().toISOString().split('T')[0]
    };

    db.certificateTypes = [newType, ...types];
    demoDataStore.saveDB(db);
    return newType;
  },

  updateCertificateType(id: string, updates: Partial<CertificateTypeItem>): CertificateTypeItem | null {
    const db = demoDataStore.getDB();
    const types = this.getCertificateTypes();
    const idx = types.findIndex((t) => t.id === id);
    if (idx === -1) return null;

    types[idx] = { ...types[idx], ...updates };
    db.certificateTypes = [...types];
    demoDataStore.saveDB(db);
    return types[idx];
  },

  deleteCertificateType(id: string): void {
    const db = demoDataStore.getDB();
    db.certificateTypes = this.getCertificateTypes().filter((t) => t.id !== id);
    demoDataStore.saveDB(db);
  },

  saveSettings(newSettings: Partial<CertificateSettings>): CertificateSettings {
    const db = demoDataStore.getDB();
    db.certificateSettings = { ...this.getSettings(), ...newSettings };
    demoDataStore.saveDB(db);
    return db.certificateSettings;
  },

  revokeCertificate(id: string): void {
    const db = demoDataStore.getDB();
    const certs = this.getCertificates();
    const cert = certs.find((c) => c.id === id);
    if (cert) {
      cert.status = 'Revoked';
      demoDataStore.saveDB(db);
    }
  }
};
