import { demoDataStore } from './demoDataStore';

export interface SchoolProfileSettings {
  schoolName: string;
  shortName: string;
  schoolCode: string;
  addressLine1: string;
  addressLine2: string;
  villageArea: string;
  city: string;
  district: string;
  state: string;
  pinCode: string;
  country: string;
  phone: string;
  alternatePhone: string;
  email: string;
  website: string;
  principalName: string;
  vicePrincipalName: string;
  establishedYear: string;
  affiliation: string;
  affiliationNumber: string;
  board: string;
  schoolType: string;
}

export interface SchoolBrandingSettings {
  logoUrl: string;
  faviconUrl: string;
  schoolNameDisplay: string;
  shortName: string;
  primaryColor: string;
  secondaryColor: string;
}

export interface ContactCommunicationSettings {
  phone: string;
  email: string;
  website: string;
  schoolAddress: string;
  googleMapsUrl: string;
  emergencyContact: string;
  officeHours: string;
}

export interface AcademicConfigSettings {
  workingDays: string[];
  schoolStartTime: string;
  schoolEndTime: string;
  periodDurationMins: number;
  numberOfPeriods: number;
  allowSaturdayClasses: boolean;
}

export interface GradeRangeItem {
  id: string;
  grade: string;
  minPercentage: number;
  maxPercentage: number;
  remarks: string;
}

export interface ExaminationSettingsModel {
  examTypes: string[];
  passingPercentage: number;
  gradeSystem: string;
  maximumMarksDefault: number;
  minimumPassingMarksDefault: number;
  gradeRanges: GradeRangeItem[];
}

export interface MarksResultSettingsModel {
  includePracticalMarks: boolean;
  includeInternalAssessment: boolean;
  attendanceAffectsResult: boolean;
  allowGraceMarks: boolean;
  defaultMaxMarks: number;
  passingMarks: number;
  resultStatuses: string[];
}

export interface NotificationSettingsModel {
  enableInAppNotifications: boolean;
  enableDemoPush: boolean;
  notificationSound: boolean;
  showNotificationBadge: boolean;
  autoNotificationForHomework: boolean;
  autoNotificationForAttendance: boolean;
  autoNotificationForFees: boolean;
  autoNotificationForExams: boolean;
  autoNotificationForResults: boolean;
  autoNotificationForNotices: boolean;
  autoNotificationForTimetable: boolean;
}

export interface NoticeSettingsModel {
  defaultNoticeType: string;
  allowScheduledNotices: boolean;
  allowClassTargeting: boolean;
  allowEmployeeTargeting: boolean;
  requireAdminApproval: boolean;
  noticeExpiryDays: number;
}

export interface AdminAccountSettings {
  adminName: string;
  username: string;
  email: string;
  mobile: string;
}

export interface SecuritySettingsModel {
  sessionTimeoutMins: number;
  rememberLogin: boolean;
  requirePasswordChangeDays: number;
  loginAttemptLimit: number;
  autoLogoutOnInactivity: boolean;
}

export interface AppConfigurationModel {
  appName: string;
  appVersion: string;
  environment: string;
  persistenceLayer: string;
}

export interface PrintDocumentSettingsModel {
  schoolNameOnDocuments: string;
  schoolAddressOnDocuments: string;
  logoUrlOnDocuments: string;
  principalName: string;
  signatureText: string;
  sealText: string;
  dateFormat: string;
  paperSize: string;
}

export interface DateTimeSettingsModel {
  dateFormat: string;
  timeFormat: '12 Hour' | '24 Hour';
  timezone: string;
}

export interface LanguageSettingsModel {
  defaultLanguage: 'English' | 'Hindi';
  availableLanguages: string[];
}

export interface LegalSupportSettingsModel {
  privacyPolicyUrl: string;
  termsConditionsUrl: string;
  supportEmail: string;
  supportPhone: string;
  officePhone: string;
  websiteUrl: string;
  emergencyContact: string;
}

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  adminName: string;
  module: string;
  action: 'Created' | 'Updated' | 'Deleted' | 'Archived' | 'Activated' | 'Reset' | 'Exported';
  description: string;
}

export interface CentralSystemSettings {
  schoolProfile: SchoolProfileSettings;
  branding: SchoolBrandingSettings;
  contact: ContactCommunicationSettings;
  academicConfig: AcademicConfigSettings;
  examinationSettings: ExaminationSettingsModel;
  marksSettings: MarksResultSettingsModel;
  notificationSettings: NotificationSettingsModel;
  noticeSettings: NoticeSettingsModel;
  adminAccount: AdminAccountSettings;
  securitySettings: SecuritySettingsModel;
  appConfig: AppConfigurationModel;
  printDocumentSettings: PrintDocumentSettingsModel;
  dateTimeSettings: DateTimeSettingsModel;
  languageSettings: LanguageSettingsModel;
  legalSupport: LegalSupportSettingsModel;
  auditLogs: AuditLogEntry[];
}

export const DEFAULT_CENTRAL_SETTINGS: CentralSystemSettings = {
  schoolProfile: {
    schoolName: 'Adarsh Vidya Mandir',
    shortName: 'AVM',
    schoolCode: 'AVM-812005',
    addressLine1: 'Adarsh Vidya Mandir Main Road',
    addressLine2: 'Kajraili, Near Police Station',
    villageArea: 'Kajraili',
    city: 'Bhagalpur',
    district: 'Bhagalpur',
    state: 'Bihar',
    pinCode: '812005',
    country: 'India',
    phone: '+91 98123 45678',
    alternatePhone: '+91 98765 43210',
    email: 'info@avmkajraili.edu.in',
    website: 'https://adarshvidyamandir.edu.in',
    principalName: 'Dr. R. K. Sharma',
    vicePrincipalName: 'Mrs. Sunita Verma',
    establishedYear: '1998',
    affiliation: 'CBSE Curriculum',
    affiliationNumber: 'CBSE/AFF/330912',
    board: 'CBSE',
    schoolType: 'Co-Educational Senior Secondary'
  },
  branding: {
    logoUrl: 'https://images.unsplash.com/photo-1546410531-bb4caa6b424d?w=150',
    faviconUrl: 'https://images.unsplash.com/photo-1546410531-bb4caa6b424d?w=32',
    schoolNameDisplay: 'Adarsh Vidya Mandir',
    shortName: 'AVM',
    primaryColor: '#1769E0',
    secondaryColor: '#0F172A'
  },
  contact: {
    phone: '+91 98123 45678',
    email: 'info@avmkajraili.edu.in',
    website: 'https://adarshvidyamandir.edu.in',
    schoolAddress: 'Kajraili, Bhagalpur, Bihar - 812005',
    googleMapsUrl: 'https://maps.google.com/?q=Adarsh+Vidya+Mandir+Kajraili+Bhagalpur',
    emergencyContact: '+91 94312 99999',
    officeHours: '08:00 AM - 03:00 PM (Mon - Sat)'
  },
  academicConfig: {
    workingDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
    schoolStartTime: '08:00',
    schoolEndTime: '14:00',
    periodDurationMins: 45,
    numberOfPeriods: 8,
    allowSaturdayClasses: true
  },
  examinationSettings: {
    examTypes: ['Unit Test', 'First Term', 'Half Yearly', 'Second Term', 'Annual Examination', 'Final Examination'],
    passingPercentage: 33,
    gradeSystem: 'Percentage Scale',
    maximumMarksDefault: 100,
    minimumPassingMarksDefault: 33,
    gradeRanges: [
      { id: 'g1', grade: 'A+', minPercentage: 90, maxPercentage: 100, remarks: 'Outstanding Performance' },
      { id: 'g2', grade: 'A', minPercentage: 80, maxPercentage: 89, remarks: 'Excellent' },
      { id: 'g3', grade: 'B+', minPercentage: 75, maxPercentage: 79, remarks: 'Very Good' },
      { id: 'g4', grade: 'B', minPercentage: 60, maxPercentage: 74, remarks: 'Good' },
      { id: 'g5', grade: 'C', minPercentage: 45, maxPercentage: 59, remarks: 'Satisfactory' },
      { id: 'g6', grade: 'D', minPercentage: 33, maxPercentage: 44, remarks: 'Pass / Needs Improvement' },
      { id: 'g7', grade: 'F', minPercentage: 0, maxPercentage: 32, remarks: 'Needs Significant Improvement' }
    ]
  },
  marksSettings: {
    includePracticalMarks: true,
    includeInternalAssessment: true,
    attendanceAffectsResult: false,
    allowGraceMarks: true,
    defaultMaxMarks: 100,
    passingMarks: 33,
    resultStatuses: ['PASS', 'FAIL', 'ABSENT']
  },
  notificationSettings: {
    enableInAppNotifications: true,
    enableDemoPush: true,
    notificationSound: true,
    showNotificationBadge: true,
    autoNotificationForHomework: true,
    autoNotificationForAttendance: true,
    autoNotificationForFees: true,
    autoNotificationForExams: true,
    autoNotificationForResults: true,
    autoNotificationForNotices: true,
    autoNotificationForTimetable: true
  },
  noticeSettings: {
    defaultNoticeType: 'General',
    allowScheduledNotices: true,
    allowClassTargeting: true,
    allowEmployeeTargeting: true,
    requireAdminApproval: false,
    noticeExpiryDays: 30
  },
  adminAccount: {
    adminName: 'Principal Office / Admin',
    username: 'admin',
    email: 'admin@avmkajraili.edu.in',
    mobile: '+91 98123 45678'
  },
  securitySettings: {
    sessionTimeoutMins: 60,
    rememberLogin: true,
    requirePasswordChangeDays: 90,
    loginAttemptLimit: 5,
    autoLogoutOnInactivity: true
  },
  appConfig: {
    appName: 'Adarsh Vidya Mandir',
    appVersion: '1.0.0',
    environment: 'DEMO / TEST MODE',
    persistenceLayer: 'Central Persistent Demo Store'
  },
  printDocumentSettings: {
    schoolNameOnDocuments: 'ADARSH VIDYA MANDIR',
    schoolAddressOnDocuments: 'KAJRAILI, BHAGALPUR, BIHAR - 812005',
    logoUrlOnDocuments: 'https://images.unsplash.com/photo-1546410531-bb4caa6b424d?w=150',
    principalName: 'Dr. R. K. Sharma',
    signatureText: 'Authorized Signatory',
    sealText: 'AVM School Seal',
    dateFormat: 'DD/MM/YYYY',
    paperSize: 'A4'
  },
  dateTimeSettings: {
    dateFormat: 'DD/MM/YYYY',
    timeFormat: '12 Hour',
    timezone: 'Asia/Kolkata (IST)'
  },
  languageSettings: {
    defaultLanguage: 'English',
    availableLanguages: ['English', 'Hindi']
  },
  legalSupport: {
    privacyPolicyUrl: 'https://adarshvidyamandir.edu.in/privacy',
    termsConditionsUrl: 'https://adarshvidyamandir.edu.in/terms',
    supportEmail: 'support@avmkajraili.edu.in',
    supportPhone: '+91 98123 45678',
    officePhone: '+91 641 2456789',
    websiteUrl: 'https://adarshvidyamandir.edu.in',
    emergencyContact: '+91 94312 99999'
  },
  auditLogs: [
    {
      id: 'log-101',
      timestamp: '30 Sep 2026 04:15 PM',
      adminName: 'Admin',
      module: 'Timetable',
      action: 'Created',
      description: 'Created Mathematics timetable for Class 5-A'
    },
    {
      id: 'log-102',
      timestamp: '30 Sep 2026 03:40 PM',
      adminName: 'Admin',
      module: 'Student',
      action: 'Updated',
      description: 'Updated Rahul Kumar profile and address details'
    },
    {
      id: 'log-103',
      timestamp: '30 Sep 2026 02:10 PM',
      adminName: 'Admin',
      module: 'Fees',
      action: 'Updated',
      description: 'Updated Q3 fee structure and receipt records'
    },
    {
      id: 'log-104',
      timestamp: '30 Sep 2026 11:30 AM',
      adminName: 'Admin',
      module: 'Settings',
      action: 'Activated',
      description: 'Verified central settings store and session 2026-27'
    }
  ]
};

export const settingsService = {
  getSettings(): CentralSystemSettings {
    const db = demoDataStore.getDB();
    if (!db.systemSettings) {
      db.systemSettings = JSON.parse(JSON.stringify(DEFAULT_CENTRAL_SETTINGS));
      demoDataStore.saveDB(db);
    }
    return db.systemSettings;
  },

  updateSettings(partial: Partial<CentralSystemSettings>): CentralSystemSettings {
    const db = demoDataStore.getDB();
    const current = db.systemSettings || JSON.parse(JSON.stringify(DEFAULT_CENTRAL_SETTINGS));
    
    db.systemSettings = {
      ...current,
      ...partial
    };

    demoDataStore.saveDB(db);
    return db.systemSettings;
  },

  updateSection<K extends keyof CentralSystemSettings>(section: K, value: CentralSystemSettings[K]): CentralSystemSettings {
    const db = demoDataStore.getDB();
    const current = db.systemSettings || JSON.parse(JSON.stringify(DEFAULT_CENTRAL_SETTINGS));

    db.systemSettings = {
      ...current,
      [section]: value
    };

    demoDataStore.saveDB(db);
    return db.systemSettings;
  },

  addAuditLog(module: string, action: AuditLogEntry['action'], description: string, adminName: string = 'Admin'): AuditLogEntry {
    const settings = this.getSettings();
    const newLog: AuditLogEntry = {
      id: `log-${Date.now()}`,
      timestamp: new Date().toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
      }) + ' ' + new Date().toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      }),
      adminName,
      module,
      action,
      description
    };

    const logs = [newLog, ...(settings.auditLogs || [])];
    this.updateSection('auditLogs', logs.slice(0, 100)); // keep last 100 logs
    return newLog;
  },

  resetSettings(): CentralSystemSettings {
    const db = demoDataStore.getDB();
    db.systemSettings = JSON.parse(JSON.stringify(DEFAULT_CENTRAL_SETTINGS));
    demoDataStore.saveDB(db);
    this.addAuditLog('Settings', 'Reset', 'Reset all school system settings to initial default configuration');
    return db.systemSettings;
  },

  exportAllData(): string {
    const db = demoDataStore.getDB();
    return JSON.stringify(db, null, 2);
  },

  importAllData(jsonContent: string): boolean {
    try {
      const parsed = JSON.parse(jsonContent);
      if (!parsed || typeof parsed !== 'object') {
        throw new Error('Invalid JSON data format');
      }
      demoDataStore.saveDB(parsed);
      this.addAuditLog('Data Store', 'Updated', 'Imported external backup JSON data into persistent demo store');
      return true;
    } catch (err) {
      console.error('[SETTINGS SERVICE] Import error:', err);
      return false;
    }
  }
};
