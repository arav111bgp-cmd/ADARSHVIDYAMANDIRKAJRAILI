import { Preferences } from '@capacitor/preferences';

const STORAGE_KEY = 'avm_central_demo_db_v1';
const VERSION_KEY = 'avm_central_demo_db_version';
const CURRENT_VERSION = '1.1';

export interface AcademicSession {
  id: string; // e.g. '2026-27'
  name: string; // e.g. '2026–27'
  startDate: string; // e.g. '2026-04-01'
  endDate: string; // e.g. '2027-03-31'
  isActive: boolean; // true for current active session
  status: 'active' | 'archived' | 'future';
}

export interface StudentEnrollment {
  id: string; // e.g. 'ENR-STU-157-2026-27'
  studentId: string;
  academicSessionId: string;
  className: string;
  section: string;
  rollNo: number;
  status: 'Active' | 'Promoted' | 'Repeated' | 'Left School' | 'Transferred';
  previousDue: number;
  sessionFee: number;
  totalFee: number;
  paidFee: number;
  pendingFee: number;
}

export interface EmployeeSessionAssignment {
  id: string;
  employeeId: string;
  academicSessionId: string;
  designation: string;
  subject: string;
  assignedClasses: string[];
}

export interface SchoolSectionInfo {
  id: string;
  name: string;
  section?: string;
  teacherId?: string;
  teacherName?: string;
  classTeacherName?: string;
  roomNo?: string;
  roomNumber?: string;
  capacity: number;
  status: 'Active' | 'Inactive';
}

export interface SchoolClassRecord {
  id: string;
  name: string;
  grade: string;
  academicSessionId: string;
  classTeacherId?: string;
  classTeacherName?: string;
  capacity?: number;
  status: 'Active' | 'Inactive';
  sections: SchoolSectionInfo[];
}

export interface SchoolFeeStructureItem {
  id?: string;
  name: string;
  amount: number;
  dueDate: string;
  paidAmount?: number;
  pendingAmount?: number;
  status: 'PAID' | 'PARTIAL' | 'PENDING';
}

export interface SchoolFeePaymentHistory {
  id?: string;
  receiptNo: string;
  date: string;
  amount: number;
  paymentMode: 'Cash' | 'UPI' | 'Bank Transfer' | 'Cheque' | 'Online';
  collectedBy: string;
  transactionRef?: string;
  remarks?: string;
  status: 'PAID' | 'REFUNDED' | 'CANCELLED';
  description?: string;
}

export interface SchoolFeeRecord {
  id: string;
  studentId: string;
  studentName: string;
  admissionNo: string;
  className: string;
  section: string;
  rollNo?: number;
  academicSessionId: string;
  totalFee: number;
  paidFee: number;
  pendingFee: number;
  status: 'PAID' | 'PARTIAL' | 'PENDING';
  lastPaymentDate?: string;
  feeStructure: SchoolFeeStructureItem[];
  paymentHistory: SchoolFeePaymentHistory[];
  dueDate?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface SchoolSubjectRecord {
  id: string;
  academicSessionId: string;
  className: string; // e.g. 'Class 5', 'Nursery'
  section?: string;  // optional or 'All'
  name: string;      // e.g. 'Mathematics', 'Science', 'Moral Science', 'Rhymes', 'Drawing'
  code: string;      // e.g. 'MATH101'
  maxMarks: number;  // e.g. 100
  passingMarks: number; // e.g. 33
  theoryMarks?: number;
  practicalMarks?: number;
  isCompulsory?: boolean;
  teacherId?: string;
  teacherName?: string;
  type: 'Core' | 'Optional' | 'Activity' | 'Language' | 'Theory' | 'Practical' | 'Academic';
  createdAt?: string;
  updatedAt?: string;
}

export interface SchoolExamRecord {
  id: string;
  academicSessionId: string;
  name: string;      // e.g. 'First Term Examination'
  shortName: string; // e.g. 'First Term'
  startDate: string;
  endDate: string;
  classes: string[]; // e.g. ['Nursery', 'Class 5']
  status: 'Draft' | 'Scheduled' | 'Published' | 'Completed' | 'Archived' | 'Active' | 'Inactive';
  createdAt?: string;
  updatedAt?: string;
}

export interface SchoolExamSubjectSchedule {
  id: string;
  examId: string;
  academicSessionId: string;
  className: string;
  section: string;
  subjectId?: string;
  subjectName: string;
  maxMarks: number;
  passingMarks: number;
  examDate: string;
  sitting?: 'First Sitting' | 'Second Sitting' | string;
  startTime: string;
  endTime: string;
  roomNo?: string;
  invigilatorId?: string;
  invigilatorName?: string;
}

export interface SchoolAdmitCardRecord {
  id: string;
  studentId: string;
  studentName: string;
  fatherName?: string;
  motherName?: string;
  dob?: string;
  photo?: string;
  admissionNo: string;
  className: string;
  section: string;
  rollNo: number;
  examId: string;
  examName: string;
  academicSessionId: string;
  examCentre: string;
  reportingTime: string;
  instructions?: string;
  selectedSubjectIds?: string[];
  sittingFilter?: 'All Sittings' | 'First Sitting' | 'Second Sitting';
  status: 'Draft' | 'Generated' | 'Published' | 'Cancelled';
  createdAt?: string;
  updatedAt?: string;
}

export interface MasterSubjectRecord {
  id: string;
  name: string;      // e.g. 'Mathematics', 'Environmental Studies'
  code: string;      // e.g. 'MATH', 'EVS'
  type: 'Theory' | 'Practical' | 'Activity' | 'Developmental' | 'Core' | 'Optional' | 'Language' | 'Academic';
  maxMarks: number;  // e.g. 100
  passingMarks: number; // e.g. 33
  theoryMaxMarks?: number;
  practicalMaxMarks?: number;
  isCompulsory?: boolean;
  applicableClasses?: string[];
  status?: 'Active' | 'Inactive' | string;
  createdAt?: string;
  updatedAt?: string;
}

export interface EvaluationPeriodRecord {
  id: string;
  name: string;      // e.g. 'Unit Test 1', 'Half Yearly Examination', 'Unit Test 2', 'Annual Examination'
  academicSession: string; // e.g. '2026-27'
  type: 'Unit Test' | 'Term Exam' | 'Annual' | 'Activity' | 'Developmental';
  startDate?: string;
  endDate?: string;
  status: 'Active' | 'Inactive';
  description?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface StudentMarkRecord {
  id: string;
  markId?: string;
  studentId: string;
  studentName: string;
  admissionNumber: string;
  rollNumber: number | string;
  classId?: string;
  className: string;
  section: string;
  subjectId: string;
  subjectName: string;
  evaluationId: string;
  evaluationName: string;
  academicSession: string;
  theoryMarks?: number;
  practicalMarks?: number;
  totalMarks: number;
  maximumMarks: number;
  percentage: number;
  grade: string;
  status: 'PASS' | 'FAIL' | 'ABSENT' | 'NOT ENTERED';
  isAbsent?: boolean;
  ratings?: Record<string, string>;
  enteredBy: string;
  enteredByEmployeeId?: string;
  enteredAt: string;
  updatedAt: string;
  updatedBy: string;
}

export interface EmployeeAttendanceRecord {
  id: string;
  employeeId: string;
  employeeName: string;
  designation?: string;
  department?: string;
  date: string; // YYYY-MM-DD
  dayOfWeek?: string; // e.g. "Friday"
  checkInTime?: string;
  checkOutTime?: string;
  breakOutTime?: string;
  breakInTime?: string;
  workingMinutes?: number;
  lateMinutes?: number;
  isEarlyCheckIn?: boolean;
  status: 'Present' | 'Late' | 'Absent' | 'On Leave' | 'Half Day' | 'Checked Out' | 'Not Checked In';
  latitude?: number;
  longitude?: number;
  distanceFromSchool?: number;
  locationVerified?: boolean;
  remarks?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface EmployeeAttendanceSettings {
  schoolLatitude: number;
  schoolLongitude: number;
  attendanceRadius: number;
  schoolStartTime: string;
  lateThresholdTime: string;
  workingDays: string[];
  checkInEnabled: boolean;
  checkOutEnabled: boolean;
  breakFeatureEnabled: boolean;
}

export interface DemoDBStructure {
  academicSessions: AcademicSession[];
  studentEnrollments: StudentEnrollment[];
  employeeSessionAssignments: EmployeeSessionAssignment[];
  users: any[];
  employees: any[];
  students: any[];
  classes: string[];
  schoolClasses?: SchoolClassRecord[];
  masterSubjects?: MasterSubjectRecord[];
  schoolSubjects?: SchoolSubjectRecord[];
  evaluationPeriods?: EvaluationPeriodRecord[];
  sections: string[];
  attendance: any[];
  homework: any[];
  marks: any[];
  notices: any[];
  notifications: any[];
  notificationTemplates?: any[];
  timetable: any[];
  fees: any[];
  exams: any[];
  examSchedules: any[];
  admitCards: any[];
  leaveApplications: any[];
  activityLog: any[];
  employeePayments?: any[];
  employeeTransport?: any[];
  books?: any[];
  libraryCategories?: any[];
  libraryTransactions?: any[];
  hostels?: any[];
  hostelRooms?: any[];
  hostelBeds?: any[];
  hostelAssignments?: any[];
  buses?: any[];
  drivers?: any[];
  conductors?: any[];
  routes?: any[];
  routeStops?: any[];
  studentTransportAssignments?: any[];
  certificateTypes?: any[];
  certificates?: any[];
  certificateTemplates?: any[];
  certificateSettings?: any;
  periods?: any[];
  classSubjects?: any[];
  teachingAssignments?: any[];
  transportAttendance?: any[];
  vehicleMaintenance?: any[];
  systemSettings?: any;
  employeeAttendance?: EmployeeAttendanceRecord[];
  employeeAttendanceSettings?: EmployeeAttendanceSettings;
}

export const INITIAL_SEED_SCHOOL_CLASSES: SchoolClassRecord[] = [
  {
    id: 'nursery',
    name: 'Nursery',
    grade: 'Nursery',
    academicSessionId: '2026-27',
    classTeacherId: 'EMP-T101',
    classTeacherName: 'Mrs. Priya Sharma',
    status: 'Active',
    sections: [
      { id: 'nursery-a', name: 'A', section: 'A', teacherId: 'EMP-T101', teacherName: 'Mrs. Priya Sharma', classTeacherName: 'Mrs. Priya Sharma', roomNo: 'Room 1', roomNumber: 'Room 1', capacity: 30, status: 'Active' },
      { id: 'nursery-b', name: 'B', section: 'B', teacherId: 'EMP-T102', teacherName: 'Mr. Amit Kumar', classTeacherName: 'Mr. Amit Kumar', roomNo: 'Room 2', roomNumber: 'Room 2', capacity: 30, status: 'Active' },
      { id: 'nursery-c', name: 'C', section: 'C', teacherId: '', teacherName: 'Unassigned', classTeacherName: 'Unassigned', roomNo: 'Room 3', roomNumber: 'Room 3', capacity: 30, status: 'Active' }
    ]
  },
  {
    id: 'lkg',
    name: 'LKG',
    grade: 'LKG',
    academicSessionId: '2026-27',
    classTeacherId: 'EMP-T102',
    classTeacherName: 'Mr. Amit Kumar',
    status: 'Active',
    sections: [
      { id: 'lkg-a', name: 'A', section: 'A', teacherId: 'EMP-T102', teacherName: 'Mr. Amit Kumar', classTeacherName: 'Mr. Amit Kumar', roomNo: 'Room 4', roomNumber: 'Room 4', capacity: 30, status: 'Active' },
      { id: 'lkg-b', name: 'B', section: 'B', teacherId: 'EMP-T101', teacherName: 'Mrs. Priya Sharma', classTeacherName: 'Mrs. Priya Sharma', roomNo: 'Room 5', roomNumber: 'Room 5', capacity: 30, status: 'Active' },
      { id: 'lkg-c', name: 'C', section: 'C', teacherId: '', teacherName: 'Unassigned', classTeacherName: 'Unassigned', roomNo: 'Room 6', roomNumber: 'Room 6', capacity: 30, status: 'Active' }
    ]
  },
  {
    id: 'ukg',
    name: 'UKG',
    grade: 'UKG',
    academicSessionId: '2026-27',
    classTeacherId: 'EMP-T101',
    classTeacherName: 'Mrs. Priya Sharma',
    status: 'Active',
    sections: [
      { id: 'ukg-a', name: 'A', section: 'A', teacherId: 'EMP-T101', teacherName: 'Mrs. Priya Sharma', classTeacherName: 'Mrs. Priya Sharma', roomNo: 'Room 7', roomNumber: 'Room 7', capacity: 30, status: 'Active' },
      { id: 'ukg-b', name: 'B', section: 'B', teacherId: 'EMP-T102', teacherName: 'Mr. Amit Kumar', classTeacherName: 'Mr. Amit Kumar', roomNo: 'Room 8', roomNumber: 'Room 8', capacity: 30, status: 'Active' },
      { id: 'ukg-c', name: 'C', section: 'C', teacherId: '', teacherName: 'Unassigned', classTeacherName: 'Unassigned', roomNo: 'Room 9', roomNumber: 'Room 9', capacity: 30, status: 'Active' }
    ]
  },
  {
    id: 'class-1',
    name: 'Class 1',
    grade: 'Class 1',
    academicSessionId: '2026-27',
    classTeacherId: 'EMP-T102',
    classTeacherName: 'Mr. Amit Kumar',
    status: 'Active',
    sections: [
      { id: 'class-1-a', name: 'A', section: 'A', teacherId: 'EMP-T102', teacherName: 'Mr. Amit Kumar', classTeacherName: 'Mr. Amit Kumar', roomNo: 'Room 10', roomNumber: 'Room 10', capacity: 30, status: 'Active' },
      { id: 'class-1-b', name: 'B', section: 'B', teacherId: 'EMP-T101', teacherName: 'Mrs. Priya Sharma', classTeacherName: 'Mrs. Priya Sharma', roomNo: 'Room 11', roomNumber: 'Room 11', capacity: 30, status: 'Active' },
      { id: 'class-1-c', name: 'C', section: 'C', teacherId: '', teacherName: 'Unassigned', classTeacherName: 'Unassigned', roomNo: 'Room 12', roomNumber: 'Room 12', capacity: 30, status: 'Active' }
    ]
  },
  {
    id: 'class-2',
    name: 'Class 2',
    grade: 'Class 2',
    academicSessionId: '2026-27',
    classTeacherId: 'EMP-T101',
    classTeacherName: 'Mrs. Priya Sharma',
    status: 'Active',
    sections: [
      { id: 'class-2-a', name: 'A', section: 'A', teacherId: 'EMP-T101', teacherName: 'Mrs. Priya Sharma', classTeacherName: 'Mrs. Priya Sharma', roomNo: 'Room 14', roomNumber: 'Room 14', capacity: 30, status: 'Active' },
      { id: 'class-2-b', name: 'B', section: 'B', teacherId: 'EMP-T102', teacherName: 'Mr. Amit Kumar', classTeacherName: 'Mr. Amit Kumar', roomNo: 'Room 15', roomNumber: 'Room 15', capacity: 30, status: 'Active' },
      { id: 'class-2-c', name: 'C', section: 'C', teacherId: '', teacherName: 'Unassigned', classTeacherName: 'Unassigned', roomNo: 'Room 16', roomNumber: 'Room 16', capacity: 30, status: 'Active' }
    ]
  },
  {
    id: 'class-3',
    name: 'Class 3',
    grade: 'Class 3',
    academicSessionId: '2026-27',
    classTeacherId: 'EMP-T102',
    classTeacherName: 'Mr. Amit Kumar',
    status: 'Active',
    sections: [
      { id: 'class-3-a', name: 'A', section: 'A', teacherId: 'EMP-T102', teacherName: 'Mr. Amit Kumar', classTeacherName: 'Mr. Amit Kumar', roomNo: 'Room 17', roomNumber: 'Room 17', capacity: 30, status: 'Active' },
      { id: 'class-3-b', name: 'B', section: 'B', teacherId: 'EMP-T101', teacherName: 'Mrs. Priya Sharma', classTeacherName: 'Mrs. Priya Sharma', roomNo: 'Room 18', roomNumber: 'Room 18', capacity: 30, status: 'Active' },
      { id: 'class-3-c', name: 'C', section: 'C', teacherId: '', teacherName: 'Unassigned', classTeacherName: 'Unassigned', roomNo: 'Room 19', roomNumber: 'Room 19', capacity: 30, status: 'Active' }
    ]
  },
  {
    id: 'class-4',
    name: 'Class 4',
    grade: 'Class 4',
    academicSessionId: '2026-27',
    classTeacherId: 'EMP-T101',
    classTeacherName: 'Mrs. Priya Sharma',
    status: 'Active',
    sections: [
      { id: 'class-4-a', name: 'A', section: 'A', teacherId: 'EMP-T101', teacherName: 'Mrs. Priya Sharma', classTeacherName: 'Mrs. Priya Sharma', roomNo: 'Room 20', roomNumber: 'Room 20', capacity: 30, status: 'Active' },
      { id: 'class-4-b', name: 'B', section: 'B', teacherId: 'EMP-T102', teacherName: 'Mr. Amit Kumar', classTeacherName: 'Mr. Amit Kumar', roomNo: 'Room 21', roomNumber: 'Room 21', capacity: 30, status: 'Active' },
      { id: 'class-4-c', name: 'C', section: 'C', teacherId: '', teacherName: 'Unassigned', classTeacherName: 'Unassigned', roomNo: 'Room 22', roomNumber: 'Room 22', capacity: 30, status: 'Active' }
    ]
  },
  {
    id: 'class-5',
    name: 'Class 5',
    grade: 'Class 5',
    academicSessionId: '2026-27',
    classTeacherId: 'EMP-T101',
    classTeacherName: 'Mrs. Priya Sharma',
    status: 'Active',
    sections: [
      { id: 'class-5-a', name: 'A', section: 'A', teacherId: 'EMP-T101', teacherName: 'Mrs. Priya Sharma', classTeacherName: 'Mrs. Priya Sharma', roomNo: 'Room 23', roomNumber: 'Room 23', capacity: 30, status: 'Active' },
      { id: 'class-5-b', name: 'B', section: 'B', teacherId: 'EMP-T102', teacherName: 'Mr. Amit Kumar', classTeacherName: 'Mr. Amit Kumar', roomNo: 'Room 24', roomNumber: 'Room 24', capacity: 30, status: 'Active' },
      { id: 'class-5-c', name: 'C', section: 'C', teacherId: '', teacherName: 'Unassigned', classTeacherName: 'Unassigned', roomNo: 'Room 25', roomNumber: 'Room 25', capacity: 30, status: 'Active' }
    ]
  },
  {
    id: 'class-6',
    name: 'Class 6',
    grade: 'Class 6',
    academicSessionId: '2026-27',
    classTeacherId: 'EMP-T102',
    classTeacherName: 'Mr. Amit Kumar',
    status: 'Active',
    sections: [
      { id: 'class-6-a', name: 'A', section: 'A', teacherId: 'EMP-T102', teacherName: 'Mr. Amit Kumar', classTeacherName: 'Mr. Amit Kumar', roomNo: 'Room 26', roomNumber: 'Room 26', capacity: 30, status: 'Active' },
      { id: 'class-6-b', name: 'B', section: 'B', teacherId: 'EMP-T101', teacherName: 'Mrs. Priya Sharma', classTeacherName: 'Mrs. Priya Sharma', roomNo: 'Room 27', roomNumber: 'Room 27', capacity: 30, status: 'Active' },
      { id: 'class-6-c', name: 'C', section: 'C', teacherId: '', teacherName: 'Unassigned', classTeacherName: 'Unassigned', roomNo: 'Room 28', roomNumber: 'Room 28', capacity: 30, status: 'Active' }
    ]
  },
  {
    id: 'class-7',
    name: 'Class 7',
    grade: 'Class 7',
    academicSessionId: '2026-27',
    classTeacherId: 'EMP-T101',
    classTeacherName: 'Mrs. Priya Sharma',
    status: 'Active',
    sections: [
      { id: 'class-7-a', name: 'A', section: 'A', teacherId: 'EMP-T101', teacherName: 'Mrs. Priya Sharma', classTeacherName: 'Mrs. Priya Sharma', roomNo: 'Room 29', roomNumber: 'Room 29', capacity: 30, status: 'Active' },
      { id: 'class-7-b', name: 'B', section: 'B', teacherId: 'EMP-T102', teacherName: 'Mr. Amit Kumar', classTeacherName: 'Mr. Amit Kumar', roomNo: 'Room 30', roomNumber: 'Room 30', capacity: 30, status: 'Active' },
      { id: 'class-7-c', name: 'C', section: 'C', teacherId: '', teacherName: 'Unassigned', classTeacherName: 'Unassigned', roomNo: 'Room 31', roomNumber: 'Room 31', capacity: 30, status: 'Active' }
    ]
  },
  {
    id: 'class-8',
    name: 'Class 8',
    grade: 'Class 8',
    academicSessionId: '2026-27',
    classTeacherId: 'EMP-T102',
    classTeacherName: 'Mr. Amit Kumar',
    status: 'Active',
    sections: [
      { id: 'class-8-a', name: 'A', section: 'A', teacherId: 'EMP-T102', teacherName: 'Mr. Amit Kumar', classTeacherName: 'Mr. Amit Kumar', roomNo: 'Room 32', roomNumber: 'Room 32', capacity: 30, status: 'Active' },
      { id: 'class-8-b', name: 'B', section: 'B', teacherId: 'EMP-T101', teacherName: 'Mrs. Priya Sharma', classTeacherName: 'Mrs. Priya Sharma', roomNo: 'Room 33', roomNumber: 'Room 33', capacity: 30, status: 'Active' },
      { id: 'class-8-c', name: 'C', section: 'C', teacherId: '', teacherName: 'Unassigned', classTeacherName: 'Unassigned', roomNo: 'Room 34', roomNumber: 'Room 34', capacity: 30, status: 'Active' }
    ]
  }
];

const INITIAL_SEED_DB: DemoDBStructure = {
  academicSessions: [
    {
      id: '2026-27',
      name: '2026–27',
      startDate: '2026-04-01',
      endDate: '2027-03-31',
      isActive: true,
      status: 'active'
    }
  ],
  studentEnrollments: [
    {
      id: 'ENR-STU-157-2026-27',
      studentId: 'STU-157',
      academicSessionId: '2026-27',
      className: 'Class 5-A',
      section: 'A',
      rollNo: 17,
      status: 'Active',
      previousDue: 0,
      sessionFee: 2500,
      totalFee: 2500,
      paidFee: 1500,
      pendingFee: 1000
    },
    {
      id: 'ENR-STU-101-2026-27',
      studentId: 'STU-101',
      academicSessionId: '2026-27',
      className: 'Class 5-A',
      section: 'A',
      rollNo: 1,
      status: 'Active',
      previousDue: 0,
      sessionFee: 2500,
      totalFee: 2500,
      paidFee: 2500,
      pendingFee: 0
    },
    {
      id: 'ENR-STU-102-2026-27',
      studentId: 'STU-102',
      academicSessionId: '2026-27',
      className: 'Class 5-A',
      section: 'A',
      rollNo: 2,
      status: 'Active',
      previousDue: 0,
      sessionFee: 2500,
      totalFee: 2500,
      paidFee: 2500,
      pendingFee: 0
    }
  ],
  employeeSessionAssignments: [
    {
      id: 'ASSIGN-EMP-T101-2026-27',
      employeeId: 'EMP-T101',
      academicSessionId: '2026-27',
      designation: 'Senior Mathematics Teacher',
      subject: 'Mathematics',
      assignedClasses: ['Nursery-A', 'LKG-A', 'UKG-A', 'Class 1-A', 'Class 2-A']
    },
    {
      id: 'ASSIGN-EMP-T102-2026-27',
      employeeId: 'EMP-T102',
      academicSessionId: '2026-27',
      designation: 'Senior Science Teacher',
      subject: 'Science',
      assignedClasses: ['Class 3-A', 'Class 4-A', 'Class 5-A', 'Class 7-A']
    }
  ],
  users: [
    {
      id: 'USR-ADMIN',
      username: 'admin',
      password: '123456',
      role: 'admin',
      active: true
    },
    {
      id: 'USR-T101',
      username: 'priya',
      password: '123456',
      role: 'employee',
      linkedEmployeeId: 'EMP-T101',
      active: true
    },
    {
      id: 'USR-EMP2026001',
      username: 'EMP2026001',
      password: 'ruhi@12345',
      role: 'employee',
      linkedEmployeeId: 'EMP-2026001',
      active: true
    },
    {
      id: 'USR-EMP2026103',
      username: 'EMP2026103',
      password: 'Arav@123',
      role: 'employee',
      linkedEmployeeId: 'EMP-2026103',
      active: true
    },
    {
      id: 'USR-ARRR',
      username: 'ARRR',
      password: 'Arav@123',
      role: 'employee',
      linkedEmployeeId: 'EMP-2026103',
      active: true
    },
    {
      id: 'USR-S157',
      username: 'rahul',
      password: '123456',
      role: 'student',
      linkedStudentId: 'STU-157',
      active: true
    }
  ],
  employees: [
    {
      id: 'EMP-T101',
      employeeId: 'T101',
      name: 'Priya Sharma',
      photo: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150',
      designation: 'Senior Mathematics Teacher',
      department: 'Mathematics',
      subject: 'Mathematics',
      teachingSubjects: ['Mathematics'],
      phone: '+91 98123 45678',
      altPhone: '+91 98123 45679',
      email: 'priya.sharma@avmkajraili.edu.in',
      assignedClasses: ['Nursery-A', 'LKG-A', 'UKG-A', 'Class 1-A', 'Class 2-A'],
      joinDate: '2018-07-15',
      dob: '1990-05-15',
      gender: 'Female',
      bloodGroup: 'B+',
      category: 'General',
      nationality: 'Indian',
      aadhaar: '1234-5678-9012',
      panNumber: 'ABCDE1234F',
      qualification: 'M.Sc. Mathematics',
      profQual: 'B.Ed',
      specialization: 'Applied Mathematics',
      teachingExp: '8 Years',
      medium: 'English + Hindi',
      experience: '8 Years',
      employmentType: 'Permanent',
      workStatus: 'Active',
      status: 'Active',
      prevSchool: 'St. Joseph School',
      prevDesignation: 'Math Teacher',
      uanCode: '100987654321',
      esiNumber: '3100098765',
      pfNumber: 'BHAGALPUR/0012345',
      isClassTeacher: 'Yes',
      classTeacherClass: 'Nursery',
      classTeacherSection: 'A',
      fatherName: 'Mr. Ramesh Sharma',
      motherName: 'Mrs. Sunita Sharma',
      emgName: 'Mr. Ramesh Sharma',
      emgRelation: 'Father',
      emgPhone: '+91 98123 45679',
      address: 'Teachers Colony, Main Road, Kajraili',
      city: 'Bhagalpur',
      state: 'Bihar',
      pinCode: '812005',
      username: 'priya',
      password: '123456',
      transportReq: 'Yes',
      transportBusId: 'BUS-2',
      transportRoute: 'Mojahidpur Route',
      transportStop: 'Main Road',
      transportStatus: 'Active',
      basicSalary: 25000,
      netSalary: 25000,
      salaryType: 'Monthly',
      salaryPaymentStatus: 'Paid',
      paymentMode: 'Bank Transfer',
      bankName: 'State Bank of India',
      accountNumber: '30987654321',
      ifscCode: 'SBIN0001234',
      salaryStatus: 'Active',
      salaryPayments: [
        { id: 'PAY-OCT-2026', employeeId: 'EMP-T101', employeeName: 'Priya Sharma', paymentMonth: 'October 2026', salaryAmount: 25000, paidAmount: 25000, pendingAmount: 0, paymentDate: '2026-10-01', paymentMode: 'Bank Transfer', status: 'Paid', remarks: 'October Salary Disbursement' },
        { id: 'PAY-NOV-2026', employeeId: 'EMP-T101', employeeName: 'Priya Sharma', paymentMonth: 'November 2026', salaryAmount: 25000, paidAmount: 0, pendingAmount: 25000, paymentDate: '', paymentMode: 'Bank Transfer', status: 'Pending', remarks: 'Pending November Salary' }
      ]
    },
    {
      id: 'EMP-T102',
      employeeId: 'T102',
      name: 'Mr. Amit Kumar',
      photo: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=150',
      designation: 'Senior Science Teacher',
      department: 'Academics',
      subject: 'Science',
      phone: '+91 98234 56789',
      email: 'amit.kumar@avmkajraili.edu.in',
      assignedClasses: ['Class 3-A', 'Class 4-A', 'Class 5-A', 'Class 7-A'],
      joinDate: '2019-04-10'
    },
    {
      id: 'EMP-2026001',
      employeeId: 'EMP2026001',
      name: 'ruhi',
      photo: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150',
      designation: 'Teacher',
      department: 'Academic',
      subject: 'English',
      teachingSubjects: ['Mathematics', 'Science', 'Hindi', 'Rhymes', 'Drawing'],
      phone: '8809722576',
      email: 'RUHI@gmail.com',
      assignedClasses: ['Class 5-A', 'Class 6-A', 'Class 8-A', 'Class 7-A'],
      joinDate: '2026-07-01',
      status: 'Active',
      workStatus: 'Active',
      isClassTeacher: 'No',
      qualification: 'B.Ed',
      profQual: 'B.Ed',
      specialization: 'English Literature',
      medium: 'English + Hindi',
      username: 'EMP2026001',
      password: 'ruhi@12345',
      transportReq: 'Yes',
      transportRoute: 'kankaithi',
      transportVillage: 'kankaithi',
      transportStop: 'kankaithi',
      transportStatus: 'Active',
      basicSalary: 7000,
      netSalary: 7000,
      paidSalary: 7000,
      pendingSalary: 0,
      salaryType: 'Monthly',
      salaryPaymentStatus: 'Paid',
      paymentMode: 'Cash',
      salaryStatus: 'Active',
      salaryPayments: [
        { id: 'PAY-EMP2026001-OCT', employeeId: 'EMP2026001', employeeName: 'ruhi', paymentMonth: 'October 2026', salaryAmount: 7000, paidAmount: 7000, pendingAmount: 0, paymentDate: '2026-10-01', paymentMode: 'Cash', status: 'Paid', remarks: 'October Salary Disbursement' }
      ]
    },
    {
      id: 'EMP-2026103',
      employeeId: 'EMP2026103',
      name: 'ARRR',
      photo: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150',
      designation: 'Teacher',
      department: 'Academic',
      subject: 'Mathematics',
      teachingSubjects: ['Mathematics', 'Science'],
      phone: '9006696047',
      email: 'arav111bgp@gmail.com',
      assignedClasses: ['Class 5-A', 'Class 6-A'],
      joinDate: '2026-07-01',
      status: 'Active',
      workStatus: 'Active',
      isClassTeacher: 'No',
      qualification: 'B.Ed',
      profQual: 'B.Ed',
      specialization: 'Mathematics',
      medium: 'English + Hindi',
      username: 'EMP2026103',
      password: 'Arav@123',
      transportReq: 'No',
      basicSalary: 27000,
      netSalary: 27000,
      paidSalary: 20000,
      pendingSalary: 7000,
      dues: 7000,
      salaryType: 'Monthly',
      salaryPaymentStatus: 'Partial',
      paymentMode: 'Bank Transfer',
      salaryStatus: 'Active',
      salaryPayments: [
        { id: 'PAY-EMP2026103-OCT', employeeId: 'EMP2026103', employeeName: 'ARRR', paymentMonth: 'October 2026', salaryAmount: 27000, paidAmount: 20000, pendingAmount: 7000, paymentDate: '2026-10-01', paymentMode: 'Bank Transfer', status: 'Partial', remarks: 'October Salary Partial Payment' }
      ]
    }
  ],
  students: [
    {
      id: 'STU-157',
      admissionNo: 'AVM2026157',
      name: 'Rahul Kumar',
      fatherName: 'Mr. Suresh Kumar',
      motherName: 'Mrs. Anita Devi',
      className: 'Class 5',
      section: 'A',
      rollNo: 17,
      gender: 'Male',
      dateOfBirth: '2018-01-15',
      phone: '+91 9860039555',
      address: 'Kajraili, Bhagalpur, Bihar - 812005',
      photo: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150',
      bloodGroup: 'O+',
      status: 'Active'
    },
    {
      id: 'STU-101',
      admissionNo: 'AVM2026201',
      name: 'Aarav Sharma',
      fatherName: 'Ramesh Sharma',
      motherName: 'Sunita Sharma',
      className: 'Class 5',
      section: 'A',
      rollNo: 1,
      gender: 'Male',
      dateOfBirth: '2018-01-15',
      phone: '+91 9849814961',
      address: 'Kajraili, Bhagalpur, Bihar - 812005',
      photo: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=150',
      bloodGroup: 'O+',
      status: 'Active'
    },
    {
      id: 'STU-102',
      admissionNo: 'AVM2026202',
      name: 'Ananya Verma',
      fatherName: 'Sanjay Verma',
      motherName: 'Pooja Verma',
      className: 'Class 5',
      section: 'A',
      rollNo: 2,
      gender: 'Female',
      dateOfBirth: '2018-02-15',
      phone: '+91 9882453702',
      address: 'Kajraili, Bhagalpur, Bihar - 812005',
      photo: 'https://images.unsplash.com/photo-1544717305-2782549b5136?w=150',
      bloodGroup: 'B+',
      status: 'Active'
    },
    {
      id: 'STU-103',
      admissionNo: 'AVM2026203',
      name: 'Vikash Kumar',
      fatherName: 'Manoj Kumar',
      motherName: 'Rekha Devi',
      className: 'Class 5',
      section: 'A',
      rollNo: 3,
      gender: 'Male',
      dateOfBirth: '2018-03-10',
      phone: '+91 9876543210',
      address: 'Kajraili, Bhagalpur, Bihar - 812005',
      photo: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
      bloodGroup: 'A+',
      status: 'Active'
    },
    {
      id: 'STU-104',
      admissionNo: 'AVM2026204',
      name: 'Priya Kumari',
      fatherName: 'Subhash Prasad',
      motherName: 'Meena Devi',
      className: 'Class 5',
      section: 'B',
      rollNo: 1,
      gender: 'Female',
      dateOfBirth: '2018-04-12',
      phone: '+91 9811223344',
      address: 'Kajraili, Bhagalpur, Bihar - 812005',
      photo: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
      bloodGroup: 'AB+',
      status: 'Active'
    },
    {
      id: 'STU-001',
      admissionNo: 'AVM2026001',
      name: 'Vivaan Kumar',
      fatherName: 'Rajesh Kumar',
      motherName: 'Suman Devi',
      className: 'Nursery',
      section: 'A',
      rollNo: 1,
      gender: 'Male',
      dateOfBirth: '2022-05-15',
      phone: '+91 9800112233',
      address: 'Kajraili, Bhagalpur, Bihar',
      photo: 'https://images.unsplash.com/photo-1503454537195-1dcabb73ffb9?w=150',
      status: 'Active'
    },
    {
      id: 'STU-001B',
      admissionNo: 'AVM2026001B',
      name: 'Ananya Roy',
      fatherName: 'Sumit Roy',
      motherName: 'Kavita Roy',
      className: 'Nursery',
      section: 'A',
      rollNo: 2,
      gender: 'Female',
      dateOfBirth: '2022-06-10',
      phone: '+91 9800112234',
      address: 'Kajraili, Bhagalpur, Bihar',
      photo: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150',
      status: 'Active'
    },
    {
      id: 'STU-001C',
      admissionNo: 'AVM2026001C',
      name: 'Samar Sharma',
      fatherName: 'Vikas Sharma',
      motherName: 'Meera Sharma',
      className: 'Nursery',
      section: 'A',
      rollNo: 3,
      gender: 'Male',
      dateOfBirth: '2022-07-20',
      phone: '+91 9800112235',
      address: 'Kajraili, Bhagalpur, Bihar',
      photo: 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=150',
      status: 'Active'
    },
    {
      id: 'STU-002',
      admissionNo: 'AVM2026002',
      name: 'Ishita Kumari',
      fatherName: 'Deepak Kumar',
      motherName: 'Sunita Devi',
      className: 'LKG',
      section: 'A',
      rollNo: 1,
      gender: 'Female',
      dateOfBirth: '2021-06-20',
      phone: '+91 9811334455',
      address: 'Kajraili, Bhagalpur, Bihar',
      photo: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150',
      status: 'Active'
    },
    {
      id: 'STU-002B',
      admissionNo: 'AVM2026002B',
      name: 'Kavyansh Gupta',
      fatherName: 'Rohit Gupta',
      motherName: 'Shweta Gupta',
      className: 'LKG',
      section: 'A',
      rollNo: 2,
      gender: 'Male',
      dateOfBirth: '2021-04-12',
      phone: '+91 9811334456',
      address: 'Kajraili, Bhagalpur, Bihar',
      photo: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
      status: 'Active'
    },
    {
      id: 'STU-002C',
      admissionNo: 'AVM2026002C',
      name: 'Aarohi Patel',
      fatherName: 'Anand Patel',
      motherName: 'Pooja Patel',
      className: 'LKG',
      section: 'A',
      rollNo: 3,
      gender: 'Female',
      dateOfBirth: '2021-08-05',
      phone: '+91 9811334457',
      address: 'Kajraili, Bhagalpur, Bihar',
      photo: 'https://images.unsplash.com/photo-1544717305-2782549b5136?w=150',
      status: 'Active'
    },
    {
      id: 'STU-003',
      admissionNo: 'AVM2026003',
      name: 'Reyansh Singh',
      fatherName: 'Vikram Singh',
      motherName: 'Kavita Singh',
      className: 'UKG',
      section: 'A',
      rollNo: 1,
      gender: 'Male',
      dateOfBirth: '2020-08-11',
      phone: '+91 9822445566',
      address: 'Kajraili, Bhagalpur, Bihar',
      photo: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150',
      status: 'Active'
    },
    {
      id: 'STU-003B',
      admissionNo: 'AVM2026003B',
      name: 'Shanaya Verma',
      fatherName: 'Ashish Verma',
      motherName: 'Ritu Verma',
      className: 'UKG',
      section: 'A',
      rollNo: 2,
      gender: 'Female',
      dateOfBirth: '2020-09-15',
      phone: '+91 9822445567',
      address: 'Kajraili, Bhagalpur, Bihar',
      photo: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
      status: 'Active'
    },
    {
      id: 'STU-003C',
      admissionNo: 'AVM2026003C',
      name: 'Atharv Choudhary',
      fatherName: 'Nitin Choudhary',
      motherName: 'Suman Choudhary',
      className: 'UKG',
      section: 'A',
      rollNo: 3,
      gender: 'Male',
      dateOfBirth: '2020-02-28',
      phone: '+91 9822445568',
      address: 'Kajraili, Bhagalpur, Bihar',
      photo: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150',
      status: 'Active'
    },
    {
      id: 'STU-004',
      admissionNo: 'AVM2026004',
      name: 'Aditi Mishra',
      fatherName: 'Alok Mishra',
      motherName: 'Shalini Mishra',
      className: 'Class 1',
      section: 'A',
      rollNo: 1,
      gender: 'Female',
      dateOfBirth: '2019-09-05',
      phone: '+91 9833556677',
      address: 'Kajraili, Bhagalpur, Bihar',
      photo: 'https://images.unsplash.com/photo-1544717305-2782549b5136?w=150',
      status: 'Active'
    },
    {
      id: 'STU-004B',
      admissionNo: 'AVM2026004B',
      name: 'Devansh Kumar',
      fatherName: 'Praveen Kumar',
      motherName: 'Anita Kumar',
      className: 'Class 1',
      section: 'A',
      rollNo: 2,
      gender: 'Male',
      dateOfBirth: '2019-10-18',
      phone: '+91 9833556678',
      address: 'Kajraili, Bhagalpur, Bihar',
      photo: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
      status: 'Active'
    },
    {
      id: 'STU-004C',
      admissionNo: 'AVM2026004C',
      name: 'Myra Joshi',
      fatherName: 'Gaurav Joshi',
      motherName: 'Neha Joshi',
      className: 'Class 1',
      section: 'A',
      rollNo: 3,
      gender: 'Female',
      dateOfBirth: '2019-03-25',
      phone: '+91 9833556679',
      address: 'Kajraili, Bhagalpur, Bihar',
      photo: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150',
      status: 'Active'
    },
    {
      id: 'STU-005',
      admissionNo: 'AVM2026005',
      name: 'Rudra Prasad',
      fatherName: 'Shiv Prasad',
      motherName: 'Parvati Devi',
      className: 'Class 2',
      section: 'A',
      rollNo: 1,
      gender: 'Male',
      dateOfBirth: '2018-11-22',
      phone: '+91 9844667788',
      address: 'Kajraili, Bhagalpur, Bihar',
      photo: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150',
      status: 'Active'
    },
    {
      id: 'STU-005B',
      admissionNo: 'AVM2026005B',
      name: 'Anvi Singh',
      fatherName: 'Ranveer Singh',
      motherName: 'Pooja Singh',
      className: 'Class 2',
      section: 'A',
      rollNo: 2,
      gender: 'Female',
      dateOfBirth: '2018-12-05',
      phone: '+91 9844667789',
      address: 'Kajraili, Bhagalpur, Bihar',
      photo: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
      status: 'Active'
    },
    {
      id: 'STU-005C',
      admissionNo: 'AVM2026005C',
      name: 'Shlok Mehta',
      fatherName: 'Jitendra Mehta',
      motherName: 'Sneha Mehta',
      className: 'Class 2',
      section: 'A',
      rollNo: 3,
      gender: 'Male',
      dateOfBirth: '2018-05-14',
      phone: '+91 9844667790',
      address: 'Kajraili, Bhagalpur, Bihar',
      photo: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=150',
      status: 'Active'
    },
    {
      id: 'STU-006',
      admissionNo: 'AVM2026006',
      name: 'Sneha Raj',
      fatherName: 'Hemant Raj',
      motherName: 'Sandhya Devi',
      className: 'Class 3',
      section: 'A',
      rollNo: 1,
      gender: 'Female',
      dateOfBirth: '2017-02-14',
      phone: '+91 9855778899',
      address: 'Kajraili, Bhagalpur, Bihar',
      photo: 'https://images.unsplash.com/photo-1544717305-2782549b5136?w=150',
      status: 'Active'
    },
    {
      id: 'STU-006B',
      admissionNo: 'AVM2026006B',
      name: 'Arush Kumar',
      fatherName: 'Santosh Kumar',
      motherName: 'Pramila Devi',
      className: 'Class 3',
      section: 'A',
      rollNo: 2,
      gender: 'Male',
      dateOfBirth: '2017-06-30',
      phone: '+91 9855778900',
      address: 'Kajraili, Bhagalpur, Bihar',
      photo: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
      status: 'Active'
    },
    {
      id: 'STU-006C',
      admissionNo: 'AVM2026006C',
      name: 'Pari Sharma',
      fatherName: 'Sunil Sharma',
      motherName: 'Pinky Sharma',
      className: 'Class 3',
      section: 'A',
      rollNo: 3,
      gender: 'Female',
      dateOfBirth: '2017-09-12',
      phone: '+91 9855778901',
      address: 'Kajraili, Bhagalpur, Bihar',
      photo: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150',
      status: 'Active'
    },
    {
      id: 'STU-007',
      admissionNo: 'AVM2026007',
      name: 'Ayush Yadav',
      fatherName: 'Dhirendra Yadav',
      motherName: 'Usha Devi',
      className: 'Class 4',
      section: 'A',
      rollNo: 1,
      gender: 'Male',
      dateOfBirth: '2016-04-18',
      phone: '+91 9866889900',
      address: 'Kajraili, Bhagalpur, Bihar',
      photo: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150',
      status: 'Active'
    },
    {
      id: 'STU-007B',
      admissionNo: 'AVM2026007B',
      name: 'Saanvi Kumari',
      fatherName: 'Rajendra Prasad',
      motherName: 'Urmila Devi',
      className: 'Class 4',
      section: 'A',
      rollNo: 2,
      gender: 'Female',
      dateOfBirth: '2016-07-22',
      phone: '+91 9866889901',
      address: 'Kajraili, Bhagalpur, Bihar',
      photo: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
      status: 'Active'
    },
    {
      id: 'STU-007C',
      admissionNo: 'AVM2026007C',
      name: 'Utkarsh Raj',
      fatherName: 'Dharmendra Raj',
      motherName: 'Sudha Devi',
      className: 'Class 4',
      section: 'A',
      rollNo: 3,
      gender: 'Male',
      dateOfBirth: '2016-11-10',
      phone: '+91 9866889902',
      address: 'Kajraili, Bhagalpur, Bihar',
      photo: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150',
      status: 'Active'
    },
    {
      id: 'STU-008',
      admissionNo: 'AVM2026008',
      name: 'Piyush Anand',
      fatherName: 'Vivek Anand',
      motherName: 'Rinku Devi',
      className: 'Class 6',
      section: 'A',
      rollNo: 1,
      gender: 'Male',
      dateOfBirth: '2014-07-30',
      phone: '+91 9877990011',
      address: 'Kajraili, Bhagalpur, Bihar',
      photo: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
      status: 'Active'
    },
    {
      id: 'STU-008B',
      admissionNo: 'AVM2026008B',
      name: 'Advika Das',
      fatherName: 'Subir Das',
      motherName: 'Payal Das',
      className: 'Class 6',
      section: 'A',
      rollNo: 2,
      gender: 'Female',
      dateOfBirth: '2014-03-15',
      phone: '+91 9877990012',
      address: 'Kajraili, Bhagalpur, Bihar',
      photo: 'https://images.unsplash.com/photo-1544717305-2782549b5136?w=150',
      status: 'Active'
    },
    {
      id: 'STU-008C',
      admissionNo: 'AVM2026008C',
      name: 'Tanmay Kapoor',
      fatherName: 'Anil Kapoor',
      motherName: 'Seema Kapoor',
      className: 'Class 6',
      section: 'A',
      rollNo: 3,
      gender: 'Male',
      dateOfBirth: '2014-09-28',
      phone: '+91 9877990013',
      address: 'Kajraili, Bhagalpur, Bihar',
      photo: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=150',
      status: 'Active'
    },
    {
      id: 'STU-009',
      admissionNo: 'AVM2026009',
      name: 'Riya Sen',
      fatherName: 'Tarun Sen',
      motherName: 'Mona Sen',
      className: 'Class 7',
      section: 'A',
      rollNo: 1,
      gender: 'Female',
      dateOfBirth: '2013-10-12',
      phone: '+91 9888001122',
      address: 'Kajraili, Bhagalpur, Bihar',
      photo: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150',
      status: 'Active'
    },
    {
      id: 'STU-009B',
      admissionNo: 'AVM2026009B',
      name: 'Parth Kumar',
      fatherName: 'Mukul Kumar',
      motherName: 'Nisha Devi',
      className: 'Class 7',
      section: 'A',
      rollNo: 2,
      gender: 'Male',
      dateOfBirth: '2013-05-19',
      phone: '+91 9888001123',
      address: 'Kajraili, Bhagalpur, Bihar',
      photo: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150',
      status: 'Active'
    },
    {
      id: 'STU-009C',
      admissionNo: 'AVM2026009C',
      name: 'Navya Pandey',
      fatherName: 'Ramesh Pandey',
      motherName: 'Pushpa Pandey',
      className: 'Class 7',
      section: 'A',
      rollNo: 3,
      gender: 'Female',
      dateOfBirth: '2013-11-04',
      phone: '+91 9888001124',
      address: 'Kajraili, Bhagalpur, Bihar',
      photo: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
      status: 'Active'
    },
    {
      id: 'STU-010',
      admissionNo: 'AVM2026010',
      name: 'Manav Jha',
      fatherName: 'Binod Jha',
      motherName: 'Kiran Devi',
      className: 'Class 8',
      section: 'A',
      rollNo: 1,
      gender: 'Male',
      dateOfBirth: '2012-12-25',
      phone: '+91 9899112233',
      address: 'Kajraili, Bhagalpur, Bihar',
      photo: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
      status: 'Active'
    },
    {
      id: 'STU-010B',
      admissionNo: 'AVM2026010B',
      name: 'Diya Kumari',
      fatherName: 'Shambhu Singh',
      motherName: 'Mamta Devi',
      className: 'Class 8',
      section: 'A',
      rollNo: 2,
      gender: 'Female',
      dateOfBirth: '2012-08-14',
      phone: '+91 9899112234',
      address: 'Kajraili, Bhagalpur, Bihar',
      photo: 'https://images.unsplash.com/photo-1544717305-2782549b5136?w=150',
      status: 'Active'
    },
    {
      id: 'STU-010C',
      admissionNo: 'AVM2026010C',
      name: 'Aditya Raj',
      fatherName: 'Birendra Raj',
      motherName: 'Shobha Devi',
      className: 'Class 8',
      section: 'A',
      rollNo: 3,
      gender: 'Male',
      dateOfBirth: '2012-02-10',
      phone: '+91 9899112235',
      address: 'Kajraili, Bhagalpur, Bihar',
      photo: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150',
      status: 'Active'
    }
  ],
  classes: [
    'Nursery-A', 'LKG-A', 'UKG-A',
    'Class 1-A', 'Class 2-A', 'Class 3-A', 'Class 4-A', 'Class 5-A', 'Class 6-A', 'Class 7-A', 'Class 8-A'
  ],
  sections: ['A', 'B', 'C'],
  attendance: [
    {
      id: 'ATT-1001',
      studentId: 'STU-157',
      className: 'Class 5-A',
      date: new Date().toISOString().split('T')[0],
      status: 'present',
      teacherId: 'EMP-T101',
      teacherName: 'Mrs. Priya Sharma',
      time: '08:15 AM'
    }
  ],
  homework: [
    {
      id: 'HW-101',
      className: 'Class 5-A',
      section: 'A',
      subject: 'Mathematics',
      title: 'Fractions & Decimals Exercise 4.2',
      description: 'Complete questions 1 to 10 from Chapter 4 in your fair notebook.',
      assignedDate: new Date().toISOString().split('T')[0],
      dueDate: new Date(Date.now() + 86400000).toISOString().split('T')[0],
      teacherName: 'Mrs. Priya Sharma',
      status: 'New'
    }
  ],
  marks: [
    { examId: 'Half Yearly Examination 2026', className: 'Class 5-A', section: 'A', subject: 'Mathematics', studentId: 'STU-157', marksObtained: 82, maxMarks: 100, teacherName: 'Mrs. Priya Sharma' },
    { examId: 'Half Yearly Examination 2026', className: 'Class 5-A', section: 'A', subject: 'Science', studentId: 'STU-157', marksObtained: 88, maxMarks: 100, teacherName: 'Mr. Amit Kumar' },
    { examId: 'Half Yearly Examination 2026', className: 'Class 5-A', section: 'A', subject: 'English', studentId: 'STU-157', marksObtained: 84, maxMarks: 100, teacherName: 'Mrs. Neha Singh' },
    { examId: 'Half Yearly Examination 2026', className: 'Class 5-A', section: 'A', subject: 'Hindi', studentId: 'STU-157', marksObtained: 78, maxMarks: 100, teacherName: 'Mrs. Priya Sharma' },
    { examId: 'Half Yearly Examination 2026', className: 'Class 5-A', section: 'A', subject: 'Computer', studentId: 'STU-157', marksObtained: 91, maxMarks: 100, teacherName: 'Subject Teacher' }
  ],
  notices: [
    {
      id: 'NOT-101',
      title: 'Parent-Teacher Meeting',
      type: 'PTM',
      category: 'PTM',
      description: 'Parent-Teacher Meeting scheduled for Saturday, 12 July 2026 to discuss Q2 progress and student development.',
      recipients: 'both',
      targetType: 'all',
      targetClass: 'All',
      targetSection: 'All',
      targetDepartment: 'All',
      status: 'Published',
      publishDate: '2026-07-12',
      publishTime: '10:30 AM',
      createdAt: '2026-07-12T10:30:00.000Z',
      readBy: { 'STU-157': '2026-07-12T11:00:00.000Z', 'EMP-T101': '2026-07-12T10:45:00.000Z' }
    },
    {
      id: 'NOT-102',
      title: 'Half Yearly Exam Schedule',
      type: 'Exam',
      category: 'Exam',
      description: 'Half Yearly Examination timetable released for Class 1 to Class 8. Examinations start on 28th September 2026.',
      recipients: 'students',
      targetType: 'all',
      targetClass: 'All',
      targetSection: 'All',
      status: 'Published',
      publishDate: '2026-09-15',
      publishTime: '09:00 AM',
      createdAt: '2026-09-15T09:00:00.000Z',
      readBy: { 'STU-157': '2026-09-15T10:15:00.000Z' }
    },
    {
      id: 'NOT-103',
      title: 'School Holiday Announcement',
      type: 'Holiday',
      category: 'Holiday',
      description: 'School will remain closed tomorrow due to heavy rainfall warning issued by the district magistrate.',
      recipients: 'both',
      targetType: 'all',
      targetClass: 'All',
      targetSection: 'All',
      targetDepartment: 'All',
      status: 'Published',
      publishDate: '2026-09-27',
      publishTime: '04:00 PM',
      createdAt: '2026-09-27T16:00:00.000Z',
      readBy: {}
    }
  ],
  notifications: [
    {
      id: 'NTF-101',
      title: 'New Homework Assigned',
      message: 'New Mathematics homework: Fractions & Decimals Exercise 4.2. Class: Class 5-A, Due: Tomorrow, Teacher: Mrs. Priya Sharma',
      time: '10 mins ago',
      type: 'homework',
      targetClass: 'Class 5-A',
      isRead: false
    }
  ],
  timetable: [
    // Priya Sharma (EMP-T101) Schedule
    { id: 'TT-P1-MON', day: 'Monday', period: 1, subject: 'Mathematics', teacherName: 'Priya Sharma', teacherId: 'EMP-T101', time: '08:00 AM - 08:40 AM', startTime: '08:00 AM', endTime: '08:40 AM', className: 'Class 3-A', section: 'A', room: 'Room 12', status: 'Active' },
    { id: 'TT-P2-MON', day: 'Monday', period: 2, subject: 'English', teacherName: 'Priya Sharma', teacherId: 'EMP-T101', time: '08:40 AM - 09:20 AM', startTime: '08:40 AM', endTime: '09:20 AM', className: 'Class 5-A', section: 'A', room: 'Room 8', status: 'Active' },
    { id: 'TT-P3-MON', day: 'Monday', period: 3, subject: 'EVS', teacherName: 'Priya Sharma', teacherId: 'EMP-T101', time: '09:20 AM - 10:00 AM', startTime: '09:20 AM', endTime: '10:00 AM', className: 'Class 2-A', section: 'A', room: 'Room 5', status: 'Active' },

    { id: 'TT-P1-TUE', day: 'Tuesday', period: 1, subject: 'Mathematics', teacherName: 'Priya Sharma', teacherId: 'EMP-T101', time: '08:00 AM - 08:40 AM', startTime: '08:00 AM', endTime: '08:40 AM', className: 'Class 4-A', section: 'A', room: 'Room 10', status: 'Active' },
    { id: 'TT-P2-TUE', day: 'Tuesday', period: 2, subject: 'EVS', teacherName: 'Priya Sharma', teacherId: 'EMP-T101', time: '08:40 AM - 09:20 AM', startTime: '08:40 AM', endTime: '09:20 AM', className: 'Class 3-A', section: 'A', room: 'Room 12', status: 'Active' },

    { id: 'TT-P1-WED', day: 'Wednesday', period: 1, subject: 'Mathematics', teacherName: 'Priya Sharma', teacherId: 'EMP-T101', time: '08:00 AM - 08:40 AM', startTime: '08:00 AM', endTime: '08:40 AM', className: 'Class 5-A', section: 'A', room: 'Room 8', status: 'Active' },
    { id: 'TT-P2-WED', day: 'Wednesday', period: 2, subject: 'Science', teacherName: 'Priya Sharma', teacherId: 'EMP-T101', time: '09:20 AM - 10:00 AM', startTime: '09:20 AM', endTime: '10:00 AM', className: 'Class 3-A', section: 'A', room: 'Room 12', status: 'Active' },

    { id: 'TT-P1-THU', day: 'Thursday', period: 1, subject: 'Mathematics', teacherName: 'Priya Sharma', teacherId: 'EMP-T101', time: '08:00 AM - 08:40 AM', startTime: '08:00 AM', endTime: '08:40 AM', className: 'Class 2-A', section: 'A', room: 'Room 5', status: 'Active' },

    { id: 'TT-P1-FRI', day: 'Friday', period: 1, subject: 'Mathematics', teacherName: 'Priya Sharma', teacherId: 'EMP-T101', time: '08:40 AM - 09:20 AM', startTime: '08:40 AM', endTime: '09:20 AM', className: 'Class 3-A', section: 'A', room: 'Room 12', status: 'Active' },

    { id: 'TT-P1-SAT', day: 'Saturday', period: 1, subject: 'Mathematics', teacherName: 'Priya Sharma', teacherId: 'EMP-T101', time: '08:00 AM - 08:40 AM', startTime: '08:00 AM', endTime: '08:40 AM', className: 'Class 5-A', section: 'A', room: 'Room 8', status: 'Active' },

    // Other Teachers
    { id: 'TT-201', day: 'Monday', period: 2, subject: 'Science', teacherName: 'Mr. Amit Kumar', teacherId: 'EMP-T102', time: '08:45 AM - 09:30 AM', startTime: '08:45 AM', endTime: '09:30 AM', className: 'Class 5-A', section: 'A', room: 'Room 23', status: 'Active' },

    // Ruhi (EMP-2026001 / EMP2026001) Schedule
    { id: 'TT-R1-MON', day: 'Monday', period: 1, subject: 'English', teacherName: 'ruhi', teacherId: 'EMP-2026001', time: '08:00 AM - 08:45 AM', startTime: '08:00 AM', endTime: '08:45 AM', className: 'Class 5-A', section: 'A', room: 'Room 21', status: 'Active' },
    { id: 'TT-R2-MON', day: 'Monday', period: 2, subject: 'Mathematics', teacherName: 'ruhi', teacherId: 'EMP-2026001', time: '08:45 AM - 09:30 AM', startTime: '08:45 AM', endTime: '09:30 AM', className: 'Class 6-A', section: 'A', room: 'Room 22', status: 'Active' },
    { id: 'TT-R3-MON', day: 'Monday', period: 3, subject: 'Science', teacherName: 'ruhi', teacherId: 'EMP-2026001', time: '09:30 AM - 10:15 AM', startTime: '09:30 AM', endTime: '10:15 AM', className: 'Class 7-A', section: 'A', room: 'Room 24', status: 'Active' },
    { id: 'TT-R4-MON', day: 'Monday', period: 4, subject: 'Hindi', teacherName: 'ruhi', teacherId: 'EMP-2026001', time: '10:30 AM - 11:15 AM', startTime: '10:30 AM', endTime: '11:15 AM', className: 'Class 8-A', section: 'A', room: 'Room 25', status: 'Active' },

    { id: 'TT-R1-TUE', day: 'Tuesday', period: 1, subject: 'Rhymes', teacherName: 'ruhi', teacherId: 'EMP-2026001', time: '08:00 AM - 08:45 AM', startTime: '08:00 AM', endTime: '08:45 AM', className: 'Class 5-A', section: 'A', room: 'Room 21', status: 'Active' },
    { id: 'TT-R2-TUE', day: 'Tuesday', period: 2, subject: 'Drawing', teacherName: 'ruhi', teacherId: 'EMP-2026001', time: '08:45 AM - 09:30 AM', startTime: '08:45 AM', endTime: '09:30 AM', className: 'Class 6-A', section: 'A', room: 'Room 22', status: 'Active' },

    { id: 'TT-R1-WED', day: 'Wednesday', period: 1, subject: 'English', teacherName: 'ruhi', teacherId: 'EMP-2026001', time: '08:00 AM - 08:45 AM', startTime: '08:00 AM', endTime: '08:45 AM', className: 'Class 7-A', section: 'A', room: 'Room 24', status: 'Active' },
    { id: 'TT-R2-WED', day: 'Wednesday', period: 2, subject: 'Science', teacherName: 'ruhi', teacherId: 'EMP-2026001', time: '08:45 AM - 09:30 AM', startTime: '08:45 AM', endTime: '09:30 AM', className: 'Class 8-A', section: 'A', room: 'Room 25', status: 'Active' },

    { id: 'TT-R1-THU', day: 'Thursday', period: 1, subject: 'Mathematics', teacherName: 'ruhi', teacherId: 'EMP-2026001', time: '08:00 AM - 08:45 AM', startTime: '08:00 AM', endTime: '08:45 AM', className: 'Class 5-A', section: 'A', room: 'Room 21', status: 'Active' },
    { id: 'TT-R2-THU', day: 'Thursday', period: 2, subject: 'Hindi', teacherName: 'ruhi', teacherId: 'EMP-2026001', time: '08:45 AM - 09:30 AM', startTime: '08:45 AM', endTime: '09:30 AM', className: 'Class 6-A', section: 'A', room: 'Room 22', status: 'Active' },

    { id: 'TT-R1-FRI', day: 'Friday', period: 1, subject: 'English', teacherName: 'ruhi', teacherId: 'EMP-2026001', time: '08:00 AM - 08:45 AM', startTime: '08:00 AM', endTime: '08:45 AM', className: 'Class 7-A', section: 'A', room: 'Room 24', status: 'Active' },
    { id: 'TT-R2-FRI', day: 'Friday', period: 2, subject: 'Drawing', teacherName: 'ruhi', teacherId: 'EMP-2026001', time: '08:45 AM - 09:30 AM', startTime: '08:45 AM', endTime: '09:30 AM', className: 'Class 8-A', section: 'A', room: 'Room 25', status: 'Active' },

    { id: 'TT-R1-SAT', day: 'Saturday', period: 1, subject: 'Mathematics', teacherName: 'ruhi', teacherId: 'EMP-2026001', time: '08:00 AM - 08:45 AM', startTime: '08:00 AM', endTime: '08:45 AM', className: 'Class 5-A', section: 'A', room: 'Room 21', status: 'Active' },

    // ARRR (EMP-2026103 / EMP2026103) Schedule
    { id: 'TT-AR1-MON', day: 'Monday', period: 1, subject: 'Mathematics', teacherName: 'ARRR', teacherId: 'EMP-2026103', time: '08:00 AM - 08:45 AM', startTime: '08:00 AM', endTime: '08:45 AM', className: 'Class 5-A', section: 'A', room: 'Room 15', status: 'Active' },
    { id: 'TT-AR2-MON', day: 'Monday', period: 2, subject: 'Science', teacherName: 'ARRR', teacherId: 'EMP-2026103', time: '08:45 AM - 09:30 AM', startTime: '08:45 AM', endTime: '09:30 AM', className: 'Class 6-A', section: 'A', room: 'Room 16', status: 'Active' },

    { id: 'TT-AR1-TUE', day: 'Tuesday', period: 1, subject: 'Mathematics', teacherName: 'ARRR', teacherId: 'EMP-2026103', time: '08:00 AM - 08:45 AM', startTime: '08:00 AM', endTime: '08:45 AM', className: 'Class 5-A', section: 'A', room: 'Room 15', status: 'Active' },
    { id: 'TT-AR2-TUE', day: 'Tuesday', period: 2, subject: 'Science', teacherName: 'ARRR', teacherId: 'EMP-2026103', time: '08:45 AM - 09:30 AM', startTime: '08:45 AM', endTime: '09:30 AM', className: 'Class 6-A', section: 'A', room: 'Room 16', status: 'Active' },

    { id: 'TT-AR1-WED', day: 'Wednesday', period: 1, subject: 'Mathematics', teacherName: 'ARRR', teacherId: 'EMP-2026103', time: '08:00 AM - 08:45 AM', startTime: '08:00 AM', endTime: '08:45 AM', className: 'Class 5-A', section: 'A', room: 'Room 15', status: 'Active' },
    { id: 'TT-AR2-WED', day: 'Wednesday', period: 2, subject: 'Science', teacherName: 'ARRR', teacherId: 'EMP-2026103', time: '08:45 AM - 09:30 AM', startTime: '08:45 AM', endTime: '09:30 AM', className: 'Class 6-A', section: 'A', room: 'Room 16', status: 'Active' },

    { id: 'TT-AR1-THU', day: 'Thursday', period: 1, subject: 'Mathematics', teacherName: 'ARRR', teacherId: 'EMP-2026103', time: '08:00 AM - 08:45 AM', startTime: '08:00 AM', endTime: '08:45 AM', className: 'Class 5-A', section: 'A', room: 'Room 15', status: 'Active' },
    { id: 'TT-AR2-THU', day: 'Thursday', period: 2, subject: 'Science', teacherName: 'ARRR', teacherId: 'EMP-2026103', time: '08:45 AM - 09:30 AM', startTime: '08:45 AM', endTime: '09:30 AM', className: 'Class 6-A', section: 'A', room: 'Room 16', status: 'Active' },

    { id: 'TT-AR1-FRI', day: 'Friday', period: 1, subject: 'Mathematics', teacherName: 'ARRR', teacherId: 'EMP-2026103', time: '08:00 AM - 08:45 AM', startTime: '08:00 AM', endTime: '08:45 AM', className: 'Class 5-A', section: 'A', room: 'Room 15', status: 'Active' },
    { id: 'TT-AR2-FRI', day: 'Friday', period: 2, subject: 'Science', teacherName: 'ARRR', teacherId: 'EMP-2026103', time: '08:45 AM - 09:30 AM', startTime: '08:45 AM', endTime: '09:30 AM', className: 'Class 6-A', section: 'A', room: 'Room 16', status: 'Active' },

    { id: 'TT-AR1-SAT', day: 'Saturday', period: 1, subject: 'Mathematics', teacherName: 'ARRR', teacherId: 'EMP-2026103', time: '08:00 AM - 08:45 AM', startTime: '08:00 AM', endTime: '08:45 AM', className: 'Class 5-A', section: 'A', room: 'Room 15', status: 'Active' }
  ],
  fees: [
    {
      id: 'FEE-101',
      studentId: 'STU-157',
      title: 'Q3 Tuition Fee (Oct - Dec 2026)',
      amount: 2500,
      totalFee: 2500,
      paidFee: 1500,
      pendingFee: 1000,
      dueDate: '2026-10-10',
      status: 'Pending'
    },
    {
      id: 'FEE-100',
      studentId: 'STU-157',
      title: 'Q2 Tuition Fee (Jul - Sep 2026)',
      amount: 4500,
      totalFee: 4500,
      paidFee: 4500,
      pendingFee: 0,
      dueDate: '2026-07-10',
      status: 'Paid',
      paidDate: '2026-07-05'
    }
  ],
  exams: [
    { id: 'EX-HY-2026', name: 'Half Yearly Examination 2026', startDate: '2026-09-28', endDate: '2026-10-05', status: 'Upcoming' }
  ],
  examSchedules: [],
  admitCards: [],
  leaveApplications: [],
  activityLog: [
    { id: 'ACT-1', title: 'New student added', subtitle: 'Amit Kumar (Class 5-A)', time: 'Today', type: 'student' },
    { id: 'ACT-2', title: 'Homework published', subtitle: 'Class 5 - Mathematics', time: 'Yesterday', type: 'homework' },
    { id: 'ACT-3', title: 'Marks updated', subtitle: 'Class 6 - Science (30 students)', time: '2 days ago', type: 'marks' },
    { id: 'ACT-4', title: 'Notice published', subtitle: 'Half Yearly Exam Schedule', time: '3 days ago', type: 'notice' }
  ]
};

// In-Memory Fast Synchronous Cache
let memoryDB: DemoDBStructure | null = null;
const listeners: Array<() => void> = [];

export function isStudentInClass(student: any, className: string, section?: string): boolean {
  if (!student) return false;

  const sClass = String(student.className || '').trim().toLowerCase();
  const sSec = String(student.section || 'A').trim().toLowerCase();
  const reqClass = String(className || '').trim().toLowerCase();
  const reqSec = section ? String(section).trim().toLowerCase() : '';

  // Direct match: e.g. "class 5-a" === "class 5-a"
  if (sClass === reqClass) {
    if (!reqSec || sSec === reqSec || sClass.endsWith(`-${reqSec}`)) {
      return true;
    }
  }

  // Parse grade and section from reqClass e.g. "Class 5-A" -> grade "class 5", sec "a"
  let gradePart = reqClass;
  let secPart = reqSec;
  if (reqClass.includes('-')) {
    const parts = reqClass.split('-');
    gradePart = parts[0].trim();
    if (!secPart) secPart = parts[1].trim();
  }

  let studentGradePart = sClass;
  let studentSecPart = sSec;
  if (sClass.includes('-')) {
    const parts = sClass.split('-');
    studentGradePart = parts[0].trim();
    studentSecPart = parts[1].trim();
  }

  const normGrade = (g: string) => g.replace(/^class\s*/i, '').trim();

  const matchGrade = studentGradePart === gradePart || normGrade(studentGradePart) === normGrade(gradePart);
  const matchSec = !secPart || studentSecPart === secPart;

  return matchGrade && matchSec;
}

function ensureSessionData(db: DemoDBStructure): DemoDBStructure {
  let changed = false;
  if (!db.academicSessions || !Array.isArray(db.academicSessions) || db.academicSessions.length === 0) {
    db.academicSessions = [
      { id: '2026-27', name: '2026–27', startDate: '2026-04-01', endDate: '2027-03-31', isActive: true, status: 'active' }
    ];
    changed = true;
  }

  if (!db.students || !Array.isArray(db.students) || db.students.length === 0) {
    db.students = JSON.parse(JSON.stringify(INITIAL_SEED_DB.students));
    changed = true;
  } else {
    // Ensure every standard class has student records in db.students
    const requiredClassGrades = ['Nursery', 'LKG', 'UKG', 'Class 1', 'Class 2', 'Class 3', 'Class 4', 'Class 5', 'Class 6', 'Class 7', 'Class 8'];
    requiredClassGrades.forEach((cGrade) => {
      const hasStudents = db.students.some((s: any) => isStudentInClass(s, cGrade, 'A'));
      if (!hasStudents) {
        const seedForGrade = INITIAL_SEED_DB.students.filter((s: any) => isStudentInClass(s, cGrade, 'A'));
        seedForGrade.forEach((seedStu) => {
          if (!db.students.some((s: any) => s.id === seedStu.id)) {
            db.students.push(JSON.parse(JSON.stringify(seedStu)));
            changed = true;
          }
        });
      }
    });
  }

  if (!db.attendance || !Array.isArray(db.attendance)) {
    db.attendance = [];
    changed = true;
  }
  if (!db.employees || !Array.isArray(db.employees)) {
    db.employees = INITIAL_SEED_DB.employees;
    changed = true;
  }
  const priyaEmp = db.employees.find((e: any) => e.id === 'EMP-T101' || e.employeeId === 'T101');
  if (priyaEmp && (!priyaEmp.assignedClasses || priyaEmp.assignedClasses.length < 11)) {
    priyaEmp.assignedClasses = ['Nursery-A', 'LKG-A', 'UKG-A', 'Class 1-A', 'Class 2-A', 'Class 3-A', 'Class 4-A', 'Class 5-A', 'Class 6-A', 'Class 7-A', 'Class 8-A'];
    priyaEmp.department = 'Mathematics';
    priyaEmp.subject = 'Mathematics';
    priyaEmp.transportReq = 'Yes';
    priyaEmp.transportRoute = 'Mojahidpur Route';
    priyaEmp.transportBusId = 'BUS-2';
    changed = true;
  }
  if (!db.users || !Array.isArray(db.users)) {
    db.users = INITIAL_SEED_DB.users;
    changed = true;
  }
  if (!db.users.some((u: any) => u.username === 'priya')) {
    db.users.push({
      id: 'USR-T101',
      username: 'priya',
      password: '123456',
      role: 'employee',
      linkedEmployeeId: 'EMP-T101',
      active: true
    });
    changed = true;
  }
  if (!db.leaveApplications || !Array.isArray(db.leaveApplications) || db.leaveApplications.length === 0) {
    db.leaveApplications = [
      {
        id: 'LV-2026-0001',
        leaveId: 'LV-2026-0001',
        employeeId: 'EMP-T101',
        employeeName: 'Mrs. Priya Sharma',
        employeeDepartment: 'Academics',
        employeeDesignation: 'Senior Mathematics Teacher',
        fromDate: '2026-09-15',
        toDate: '2026-09-16',
        totalDays: 2,
        reason: 'Urgent personal work at bank and property registration',
        status: 'APPROVED',
        submittedAt: '14 September 2026 • 05:30 PM',
        appliedOn: '2026-09-14',
        reviewedAt: '15 September 2026 • 08:00 AM',
        reviewedBy: 'Admin Principal',
        adminRemarks: 'Approved for personal work.'
      },
      {
        id: 'LV-2026-0002',
        leaveId: 'LV-2026-0002',
        employeeId: 'EMP-T101',
        employeeName: 'Mrs. Priya Sharma',
        employeeDepartment: 'Academics',
        employeeDesignation: 'Senior Mathematics Teacher',
        fromDate: '2026-10-05',
        toDate: '2026-10-07',
        totalDays: 3,
        reason: 'Family event and wedding function in Patna',
        status: 'PENDING',
        submittedAt: '01 October 2026 • 06:15 PM',
        appliedOn: '2026-10-01'
      },
      {
        id: 'LV-2026-0003',
        leaveId: 'LV-2026-0003',
        employeeId: 'EMP-T101',
        employeeName: 'Mrs. Priya Sharma',
        employeeDepartment: 'Academics',
        employeeDesignation: 'Senior Mathematics Teacher',
        fromDate: '2026-09-22',
        toDate: '2026-09-22',
        totalDays: 1,
        reason: 'Attending external mathematics workshop outside city',
        status: 'REJECTED',
        submittedAt: '20 September 2026 • 04:00 PM',
        appliedOn: '2026-09-20',
        reviewedAt: '21 September 2026 • 09:30 AM',
        reviewedBy: 'Admin Principal',
        adminRemarks: 'Leave cannot be approved due to mid-term exam duty.'
      }
    ];
    changed = true;
  }
  if (!db.studentEnrollments || !Array.isArray(db.studentEnrollments) || db.studentEnrollments.length === 0) {
    db.studentEnrollments = (db.students || []).map((s: any) => ({
      id: `ENR-${s.id}-2026-27`,
      studentId: s.id,
      academicSessionId: '2026-27',
      className: s.className || 'Class 5-A',
      section: s.section || 'A',
      rollNo: Number(s.rollNo || 1),
      status: s.status || 'Active',
      previousDue: 0,
      sessionFee: 2500,
      totalFee: 2500,
      paidFee: 1500,
      pendingFee: 1000
    }));
    changed = true;
  }
  if (!db.employeeSessionAssignments || !Array.isArray(db.employeeSessionAssignments) || db.employeeSessionAssignments.length === 0) {
    db.employeeSessionAssignments = (db.employees || []).map((e: any) => ({
      id: `ASSIGN-${e.id}-2026-27`,
      employeeId: e.id,
      academicSessionId: '2026-27',
      designation: e.designation || 'Teacher',
      subject: e.subject || 'General',
      assignedClasses: e.assignedClasses || ['Class 5-A']
    }));
    changed = true;
  }

  if (!db.examSchedules || !Array.isArray(db.examSchedules)) {
    db.examSchedules = [];
    changed = true;
  }

  // Ensure default masterSubjects exist
  if (!db.masterSubjects || !Array.isArray(db.masterSubjects) || db.masterSubjects.length === 0) {
    db.masterSubjects = [
      { id: 'SUB-MATH', name: 'Mathematics', code: 'MATH', type: 'Theory', maxMarks: 100, passingMarks: 33, status: 'Active' },
      { id: 'SUB-HIN', name: 'Hindi', code: 'HIN', type: 'Language', maxMarks: 100, passingMarks: 33, status: 'Active' },
      { id: 'SUB-ENG', name: 'English', code: 'ENG', type: 'Language', maxMarks: 100, passingMarks: 33, status: 'Active' },
      { id: 'SUB-SCI', name: 'Science', code: 'SCI', type: 'Theory', maxMarks: 100, passingMarks: 33, status: 'Active' },
      { id: 'SUB-SST', name: 'Social Science', code: 'SST', type: 'Theory', maxMarks: 100, passingMarks: 33, status: 'Active' },
      { id: 'SUB-CS', name: 'Computer Science', code: 'CS', type: 'Practical', maxMarks: 100, passingMarks: 33, status: 'Active' },
      { id: 'SUB-EVS', name: 'EVS', code: 'EVS', type: 'Theory', maxMarks: 100, passingMarks: 33, status: 'Active' },
      { id: 'SUB-GK', name: 'GK', code: 'GK', type: 'Theory', maxMarks: 50, passingMarks: 17, status: 'Active' },
      { id: 'SUB-DRAW', name: 'Drawing', code: 'DRAW', type: 'Activity', maxMarks: 50, passingMarks: 17, status: 'Active' },
      { id: 'SUB-RHY', name: 'Rhymes', code: 'RHY', type: 'Activity', maxMarks: 50, passingMarks: 17, status: 'Active' }
    ];
    changed = true;
  }

  // Ensure default schoolSubjects exist for 2026-27
  if (!db.schoolSubjects || !Array.isArray(db.schoolSubjects) || db.schoolSubjects.length === 0) {
    const seedSubjects: SchoolSubjectRecord[] = [
      // Class 5
      { id: 'SUB-2026-27-C5-MATH', academicSessionId: '2026-27', className: 'Class 5', name: 'Mathematics', code: 'MATH501', maxMarks: 100, passingMarks: 33, teacherId: 'EMP-T101', teacherName: 'Mrs. Priya Sharma', type: 'Academic' },
      { id: 'SUB-2026-27-C5-SCI', academicSessionId: '2026-27', className: 'Class 5', name: 'Science', code: 'SCI501', maxMarks: 100, passingMarks: 33, teacherId: 'EMP-T102', teacherName: 'Mr. Amit Kumar', type: 'Academic' },
      { id: 'SUB-2026-27-C5-ENG', academicSessionId: '2026-27', className: 'Class 5', name: 'English', code: 'ENG501', maxMarks: 100, passingMarks: 33, teacherId: 'EMP-T101', teacherName: 'Mrs. Neha Singh', type: 'Academic' },
      { id: 'SUB-2026-27-C5-HIN', academicSessionId: '2026-27', className: 'Class 5', name: 'Hindi', code: 'HIN501', maxMarks: 100, passingMarks: 33, teacherId: 'EMP-T101', teacherName: 'Mrs. Priya Sharma', type: 'Academic' },
      { id: 'SUB-2026-27-C5-SST', academicSessionId: '2026-27', className: 'Class 5', name: 'Social Science', code: 'SST501', maxMarks: 100, passingMarks: 33, teacherId: 'EMP-T102', teacherName: 'Mr. Amit Kumar', type: 'Academic' },
      { id: 'SUB-2026-27-C5-CMP', academicSessionId: '2026-27', className: 'Class 5', name: 'Computer', code: 'CMP501', maxMarks: 50, passingMarks: 17, teacherId: 'EMP-T102', teacherName: 'Subject Teacher', type: 'Academic' },

      // Class 4
      { id: 'SUB-2026-27-C4-HIN', academicSessionId: '2026-27', className: 'Class 4', name: 'Hindi', code: 'HIN401', maxMarks: 100, passingMarks: 33, teacherId: 'EMP-T101', teacherName: 'Mrs. Priya Sharma', type: 'Academic' },
      { id: 'SUB-2026-27-C4-ENG', academicSessionId: '2026-27', className: 'Class 4', name: 'English', code: 'ENG401', maxMarks: 100, passingMarks: 33, teacherId: 'EMP-T101', teacherName: 'Mrs. Neha Singh', type: 'Academic' },
      { id: 'SUB-2026-27-C4-MATH', academicSessionId: '2026-27', className: 'Class 4', name: 'Mathematics', code: 'MATH401', maxMarks: 100, passingMarks: 33, teacherId: 'EMP-T101', teacherName: 'Mrs. Priya Sharma', type: 'Academic' },
      { id: 'SUB-2026-27-C4-EVS', academicSessionId: '2026-27', className: 'Class 4', name: 'EVS', code: 'EVS401', maxMarks: 100, passingMarks: 33, teacherId: 'EMP-T102', teacherName: 'Mr. Amit Kumar', type: 'Academic' },
      { id: 'SUB-2026-27-C4-CMP', academicSessionId: '2026-27', className: 'Class 4', name: 'Computer', code: 'CMP401', maxMarks: 50, passingMarks: 17, teacherId: 'EMP-T102', teacherName: 'Subject Teacher', type: 'Academic' },

      // Nursery
      { id: 'SUB-2026-27-NUR-RHY', academicSessionId: '2026-27', className: 'Nursery', name: 'Rhymes', code: 'RHY001', maxMarks: 50, passingMarks: 17, teacherId: 'EMP-T101', teacherName: 'Mrs. Priya Sharma', type: 'Activity' },
      { id: 'SUB-2026-27-NUR-ENG', academicSessionId: '2026-27', className: 'Nursery', name: 'English', code: 'ENG001', maxMarks: 50, passingMarks: 17, teacherId: 'EMP-T101', teacherName: 'Mrs. Neha Singh', type: 'Academic' },
      { id: 'SUB-2026-27-NUR-HIN', academicSessionId: '2026-27', className: 'Nursery', name: 'Hindi', code: 'HIN001', maxMarks: 50, passingMarks: 17, teacherId: 'EMP-T101', teacherName: 'Mrs. Priya Sharma', type: 'Academic' },
      { id: 'SUB-2026-27-NUR-NUM', academicSessionId: '2026-27', className: 'Nursery', name: 'Numbers', code: 'NUM001', maxMarks: 50, passingMarks: 17, teacherId: 'EMP-T101', teacherName: 'Mrs. Priya Sharma', type: 'Academic' },
      { id: 'SUB-2026-27-NUR-DRW', academicSessionId: '2026-27', className: 'Nursery', name: 'Drawing', code: 'DRW001', maxMarks: 50, passingMarks: 17, teacherId: 'EMP-T101', teacherName: 'Subject Teacher', type: 'Activity' },

      // LKG
      { id: 'SUB-2026-27-LKG-RHY', academicSessionId: '2026-27', className: 'LKG', name: 'Rhymes', code: 'RHY002', maxMarks: 50, passingMarks: 17, teacherId: 'EMP-T102', teacherName: 'Mr. Amit Kumar', type: 'Activity' },
      { id: 'SUB-2026-27-LKG-ENG', academicSessionId: '2026-27', className: 'LKG', name: 'English', code: 'ENG002', maxMarks: 50, passingMarks: 17, teacherId: 'EMP-T102', teacherName: 'Mr. Amit Kumar', type: 'Academic' },
      { id: 'SUB-2026-27-LKG-HIN', academicSessionId: '2026-27', className: 'LKG', name: 'Hindi', code: 'HIN002', maxMarks: 50, passingMarks: 17, teacherId: 'EMP-T101', teacherName: 'Mrs. Priya Sharma', type: 'Academic' },
      { id: 'SUB-2026-27-LKG-NUM', academicSessionId: '2026-27', className: 'LKG', name: 'Numbers', code: 'NUM002', maxMarks: 50, passingMarks: 17, teacherId: 'EMP-T102', teacherName: 'Mr. Amit Kumar', type: 'Academic' },
      { id: 'SUB-2026-27-LKG-DRW', academicSessionId: '2026-27', className: 'LKG', name: 'Drawing', code: 'DRW002', maxMarks: 50, passingMarks: 17, teacherId: 'EMP-T101', teacherName: 'Mrs. Priya Sharma', type: 'Activity' },

      // UKG
      { id: 'SUB-2026-27-UKG-RHY', academicSessionId: '2026-27', className: 'UKG', name: 'Rhymes', code: 'RHY003', maxMarks: 50, passingMarks: 17, teacherId: 'EMP-T101', teacherName: 'Mrs. Priya Sharma', type: 'Activity' },
      { id: 'SUB-2026-27-UKG-ENG', academicSessionId: '2026-27', className: 'UKG', name: 'English', code: 'ENG003', maxMarks: 50, passingMarks: 17, teacherId: 'EMP-T101', teacherName: 'Mrs. Priya Sharma', type: 'Academic' },
      { id: 'SUB-2026-27-UKG-HIN', academicSessionId: '2026-27', className: 'UKG', name: 'Hindi', code: 'HIN003', maxMarks: 50, passingMarks: 17, teacherId: 'EMP-T101', teacherName: 'Mrs. Priya Sharma', type: 'Academic' },
      { id: 'SUB-2026-27-UKG-NUM', academicSessionId: '2026-27', className: 'UKG', name: 'Numbers', code: 'NUM003', maxMarks: 50, passingMarks: 17, teacherId: 'EMP-T101', teacherName: 'Mrs. Priya Sharma', type: 'Academic' },
      { id: 'SUB-2026-27-UKG-DRW', academicSessionId: '2026-27', className: 'UKG', name: 'Drawing', code: 'DRW003', maxMarks: 50, passingMarks: 17, teacherId: 'EMP-T101', teacherName: 'Subject Teacher', type: 'Activity' }
    ];

    // Standard subjects for Class 1 to 3 and Class 6 to 8
    ['Class 1', 'Class 2', 'Class 3'].forEach((cName) => {
      const cTag = cName.replace(/\s+/g, '');
      seedSubjects.push(
        { id: `SUB-2026-27-${cTag}-HIN`, academicSessionId: '2026-27', className: cName, name: 'Hindi', code: 'HIN100', maxMarks: 100, passingMarks: 33, teacherId: 'EMP-T101', teacherName: 'Mrs. Priya Sharma', type: 'Academic' },
        { id: `SUB-2026-27-${cTag}-ENG`, academicSessionId: '2026-27', className: cName, name: 'English', code: 'ENG100', maxMarks: 100, passingMarks: 33, teacherId: 'EMP-T101', teacherName: 'Mrs. Neha Singh', type: 'Academic' },
        { id: `SUB-2026-27-${cTag}-MATH`, academicSessionId: '2026-27', className: cName, name: 'Mathematics', code: 'MATH100', maxMarks: 100, passingMarks: 33, teacherId: 'EMP-T101', teacherName: 'Mrs. Priya Sharma', type: 'Academic' },
        { id: `SUB-2026-27-${cTag}-EVS`, academicSessionId: '2026-27', className: cName, name: 'EVS', code: 'EVS100', maxMarks: 100, passingMarks: 33, teacherId: 'EMP-T102', teacherName: 'Mr. Amit Kumar', type: 'Academic' },
        { id: `SUB-2026-27-${cTag}-CMP`, academicSessionId: '2026-27', className: cName, name: 'Computer', code: 'CMP100', maxMarks: 50, passingMarks: 17, teacherId: 'EMP-T102', teacherName: 'Subject Teacher', type: 'Academic' }
      );
    });

    ['Class 6', 'Class 7', 'Class 8'].forEach((cName) => {
      const cTag = cName.replace(/\s+/g, '');
      seedSubjects.push(
        { id: `SUB-2026-27-${cTag}-HIN`, academicSessionId: '2026-27', className: cName, name: 'Hindi', code: 'HIN600', maxMarks: 100, passingMarks: 33, teacherId: 'EMP-T101', teacherName: 'Mrs. Priya Sharma', type: 'Academic' },
        { id: `SUB-2026-27-${cTag}-ENG`, academicSessionId: '2026-27', className: cName, name: 'English', code: 'ENG600', maxMarks: 100, passingMarks: 33, teacherId: 'EMP-T101', teacherName: 'Mrs. Neha Singh', type: 'Academic' },
        { id: `SUB-2026-27-${cTag}-MATH`, academicSessionId: '2026-27', className: cName, name: 'Mathematics', code: 'MATH600', maxMarks: 100, passingMarks: 33, teacherId: 'EMP-T101', teacherName: 'Mrs. Priya Sharma', type: 'Academic' },
        { id: `SUB-2026-27-${cTag}-SCI`, academicSessionId: '2026-27', className: cName, name: 'Science', code: 'SCI600', maxMarks: 100, passingMarks: 33, teacherId: 'EMP-T102', teacherName: 'Mr. Amit Kumar', type: 'Academic' },
        { id: `SUB-2026-27-${cTag}-SST`, academicSessionId: '2026-27', className: cName, name: 'Social Science', code: 'SST600', maxMarks: 100, passingMarks: 33, teacherId: 'EMP-T102', teacherName: 'Mr. Amit Kumar', type: 'Academic' },
        { id: `SUB-2026-27-${cTag}-CMP`, academicSessionId: '2026-27', className: cName, name: 'Computer', code: 'CMP600', maxMarks: 100, passingMarks: 33, teacherId: 'EMP-T102', teacherName: 'Subject Teacher', type: 'Academic' }
      );
    });

    db.schoolSubjects = seedSubjects;
    changed = true;
  }

  // Ensure 3 standard examinations exist for every academic session
  (db.academicSessions || []).forEach((sess: any) => {
    const sessId = sess.id;
    db.exams = db.exams || [];

    const stdExams = [
      {
        id: `EX-PT1-${sessId}`,
        academicSessionId: sessId,
        name: 'Periodic Test 1',
        type: 'Periodic Test 1',
        description: 'First periodic assessment for the academic session.',
        startDate: sessId === '2026-27' ? '2026-07-10' : '2027-07-10',
        endDate: sessId === '2026-27' ? '2026-07-15' : '2027-07-15',
        status: 'Scheduled',
        classesCount: 11,
        subjectsCount: 8
      },
      {
        id: `EX-HY-${sessId}`,
        academicSessionId: sessId,
        name: 'Half-Yearly Examination',
        type: 'Half-Yearly Examination',
        description: 'Mid-term comprehensive examination.',
        startDate: sessId === '2026-27' ? '2026-09-28' : '2027-09-28',
        endDate: sessId === '2026-27' ? '2026-10-05' : '2027-10-05',
        status: 'Scheduled',
        classesCount: 11,
        subjectsCount: 8
      },
      {
        id: `EX-ANNUAL-${sessId}`,
        academicSessionId: sessId,
        name: 'Annual / Final Examination',
        type: 'Annual / Final Examination',
        description: 'Final annual promotional examination.',
        startDate: sessId === '2026-27' ? '2027-03-10' : '2028-03-10',
        endDate: sessId === '2026-27' ? '2027-03-20' : '2028-03-20',
        status: 'Scheduled',
        classesCount: 11,
        subjectsCount: 8
      }
    ];

    stdExams.forEach((stdEx) => {
      const exists = db.exams.some(
        (e: any) => e.academicSessionId === sessId && (e.name === stdEx.name || e.id === stdEx.id || e.type === stdEx.type)
      );
      if (!exists) {
        db.exams.push(stdEx);
        changed = true;
      }
    });
  });

  // Seed default exam schedule for Class 5-A in 2026-27 if missing
  if (db.examSchedules.length === 0) {
    db.examSchedules = [
      {
        id: 'SCH-PT1-MATH-CLASS5',
        examId: 'EX-PT1-2026-27',
        academicSessionId: '2026-27',
        className: 'Class 5-A',
        section: 'A',
        subject: 'Mathematics',
        examDate: '2026-07-10',
        startTime: '09:00 AM',
        endTime: '10:00 AM',
        maximumMarks: 50,
        passingMarks: 17,
        roomNo: 'Room 5'
      },
      {
        id: 'SCH-PT1-ENG-CLASS5',
        examId: 'EX-PT1-2026-27',
        academicSessionId: '2026-27',
        className: 'Class 5-A',
        section: 'A',
        subject: 'English',
        examDate: '2026-07-11',
        startTime: '09:00 AM',
        endTime: '10:00 AM',
        maximumMarks: 50,
        passingMarks: 17,
        roomNo: 'Room 5'
      },
      {
        id: 'SCH-PT1-SCI-CLASS5',
        examId: 'EX-PT1-2026-27',
        academicSessionId: '2026-27',
        className: 'Class 5-A',
        section: 'A',
        subject: 'Science',
        examDate: '2026-07-12',
        startTime: '09:00 AM',
        endTime: '10:00 AM',
        maximumMarks: 50,
        passingMarks: 17,
        roomNo: 'Room 5'
      },
      {
        id: 'SCH-HY-MATH-CLASS5',
        examId: 'EX-HY-2026-27',
        academicSessionId: '2026-27',
        className: 'Class 5-A',
        section: 'A',
        subject: 'Mathematics',
        examDate: '2026-09-28',
        startTime: '09:00 AM',
        endTime: '12:00 PM',
        maximumMarks: 100,
        passingMarks: 33,
        roomNo: 'Room 5'
      },
      {
        id: 'SCH-HY-ENG-CLASS5',
        examId: 'EX-HY-2026-27',
        academicSessionId: '2026-27',
        className: 'Class 5-A',
        section: 'A',
        subject: 'English',
        examDate: '2026-09-30',
        startTime: '09:00 AM',
        endTime: '12:00 PM',
        maximumMarks: 100,
        passingMarks: 33,
        roomNo: 'Room 5'
      }
    ];
    changed = true;
  }

  // Tag operational records with academicSessionId if missing
  ['attendance', 'homework', 'marks', 'notices', 'fees', 'exams', 'examSchedules', 'timetable', 'admitCards'].forEach((key) => {
    if (Array.isArray((db as any)[key])) {
      (db as any)[key].forEach((item: any) => {
        if (!item.academicSessionId) {
          item.academicSessionId = '2026-27';
          changed = true;
        }
      });
    }
  });

  // Normalize notices schema
  if (Array.isArray(db.notices)) {
    db.notices.forEach((n: any) => {
      if (!n.type) { n.type = n.category || 'General'; changed = true; }
      if (!n.category) { n.category = n.type; changed = true; }
      if (!n.recipients) {
        if (n.targetAudience === 'Student') n.recipients = 'students';
        else if (n.targetAudience === 'Employee') n.recipients = 'employees';
        else n.recipients = 'both';
        changed = true;
      }
      if (!n.status) { n.status = 'Published'; changed = true; }
      if (!n.publishDate) { n.publishDate = n.date || '2026-09-28'; changed = true; }
      if (!n.publishTime) { n.publishTime = '10:30 AM'; changed = true; }
      if (!n.readBy || typeof n.readBy !== 'object') { n.readBy = {}; changed = true; }
    });
  }

  if (!Array.isArray((db as any).schoolClasses) || (db as any).schoolClasses.length === 0) {
    (db as any).schoolClasses = INITIAL_SEED_SCHOOL_CLASSES;
    changed = true;
  }

  if (!Array.isArray((db as any).admitCards) || (db as any).admitCards.length === 0) {
    const seedAdmitCards: SchoolAdmitCardRecord[] = [];
    const studentsArr = Array.isArray(db.students) ? db.students : [];
    
    studentsArr.forEach((stu: any) => {
      const cName = stu.className ? stu.className.split('-')[0] : 'Class 5';
      const sName = stu.section || (stu.className && stu.className.includes('-') ? stu.className.split('-')[1] : 'A');
      
      // Seed First Term Examination admit card
      seedAdmitCards.push({
        id: `ADC-${stu.id || stu.admissionNo}-PT1-2026-27`,
        studentId: stu.id,
        studentName: stu.name,
        admissionNo: stu.admissionNo,
        className: cName,
        section: sName,
        rollNo: stu.rollNo || 1,
        examId: 'EX-PT1-2026-27',
        examName: 'First Term Examination',
        academicSessionId: '2026-27',
        examCentre: 'Adarsh Vidya Mandir, Kajraili, Bhagalpur',
        reportingTime: '08:30 AM',
        instructions: '1. Bring original admit card every exam day.\n2. Reach reporting room by 08:30 AM.\n3. Electronic gadgets strictly prohibited.',
        status: 'Published',
        createdAt: new Date().toISOString()
      });

      // Seed Half Yearly Examination admit card
      seedAdmitCards.push({
        id: `ADC-${stu.id || stu.admissionNo}-HY-2026-27`,
        studentId: stu.id,
        studentName: stu.name,
        admissionNo: stu.admissionNo,
        className: cName,
        section: sName,
        rollNo: stu.rollNo || 1,
        examId: 'EX-HY-2026-27',
        examName: 'Half Yearly Examination',
        academicSessionId: '2026-27',
        examCentre: 'Adarsh Vidya Mandir, Kajraili, Bhagalpur',
        reportingTime: '08:30 AM',
        instructions: '1. Bring original admit card every exam day.\n2. Reach reporting room by 08:30 AM.\n3. Electronic gadgets strictly prohibited.',
        status: 'Generated',
        createdAt: new Date().toISOString()
      });
    });

    (db as any).admitCards = seedAdmitCards;
    changed = true;
  }

  if (!Array.isArray((db as any).fees) || (db as any).fees.length === 0 || !(db as any).fees[0]?.feeStructure) {
    const seedFees: SchoolFeeRecord[] = [];
    const studentsArr = Array.isArray(db.students) ? db.students : [];

    studentsArr.forEach((stu: any) => {
      const cleanClass = stu.className ? stu.className.split('-')[0].trim() : 'Class 5';
      const cleanSec = stu.section || (stu.className && stu.className.includes('-') ? stu.className.split('-')[1].trim() : 'A');

      if (stu.id === 'STU-157') {
        // Rahul Kumar - specific prompt requirements
        seedFees.push({
          id: `FEE-${stu.id}-2026-27`,
          studentId: stu.id,
          studentName: stu.name,
          admissionNo: stu.admissionNo,
          className: cleanClass,
          section: cleanSec,
          rollNo: stu.rollNo || 17,
          academicSessionId: '2026-27',
          totalFee: 7500,
          paidFee: 5000,
          pendingFee: 2500,
          status: 'PARTIAL',
          lastPaymentDate: '2026-09-25',
          dueDate: '2026-09-30',
          feeStructure: [
            { id: 'FS-157-1', name: 'Tuition Fee', amount: 4500, dueDate: '2026-09-30', paidAmount: 3000, pendingAmount: 1500, status: 'PARTIAL' },
            { id: 'FS-157-2', name: 'Annual Fee', amount: 2000, dueDate: '2026-04-15', paidAmount: 2000, pendingAmount: 0, status: 'PAID' },
            { id: 'FS-157-3', name: 'Exam Fee', amount: 500, dueDate: '2026-10-10', paidAmount: 0, pendingAmount: 500, status: 'PENDING' },
            { id: 'FS-157-4', name: 'Computer Fee', amount: 500, dueDate: '2026-10-10', paidAmount: 0, pendingAmount: 500, status: 'PENDING' }
          ],
          paymentHistory: [
            { receiptNo: 'REC-2026-00125', date: '2026-09-18', amount: 2000, paymentMode: 'Cash', collectedBy: 'Admin', status: 'PAID', description: 'Annual Fee Payment' },
            { receiptNo: 'REC-2026-00141', date: '2026-09-25', amount: 3000, paymentMode: 'UPI', collectedBy: 'Admin', status: 'PAID', description: 'Tuition Fee Payment' }
          ]
        });
      } else if (stu.id === 'STU-101') {
        // Aarav Sharma - Fully PAID
        seedFees.push({
          id: `FEE-${stu.id}-2026-27`,
          studentId: stu.id,
          studentName: stu.name,
          admissionNo: stu.admissionNo,
          className: cleanClass,
          section: cleanSec,
          rollNo: stu.rollNo || 1,
          academicSessionId: '2026-27',
          totalFee: 7000,
          paidFee: 7000,
          pendingFee: 0,
          status: 'PAID',
          lastPaymentDate: '2026-04-10',
          dueDate: '2026-09-30',
          feeStructure: [
            { id: `FS-${stu.id}-1`, name: 'Tuition Fee', amount: 4500, dueDate: '2026-09-30', paidAmount: 4500, pendingAmount: 0, status: 'PAID' },
            { id: `FS-${stu.id}-2`, name: 'Annual Fee', amount: 2000, dueDate: '2026-04-15', paidAmount: 2000, pendingAmount: 0, status: 'PAID' },
            { id: `FS-${stu.id}-3`, name: 'Exam Fee', amount: 500, dueDate: '2026-10-10', paidAmount: 500, pendingAmount: 0, status: 'PAID' }
          ],
          paymentHistory: [
            { receiptNo: 'REC-2026-00098', date: '2026-04-10', amount: 7000, paymentMode: 'Online', collectedBy: 'Admin', status: 'PAID', description: 'Full Session Fee Payment' }
          ]
        });
      } else if (stu.id === 'STU-102') {
        // Ananya Verma - Fully PENDING
        seedFees.push({
          id: `FEE-${stu.id}-2026-27`,
          studentId: stu.id,
          studentName: stu.name,
          admissionNo: stu.admissionNo,
          className: cleanClass,
          section: cleanSec,
          rollNo: stu.rollNo || 2,
          academicSessionId: '2026-27',
          totalFee: 6500,
          paidFee: 0,
          pendingFee: 6500,
          status: 'PENDING',
          dueDate: '2026-09-30',
          feeStructure: [
            { id: `FS-${stu.id}-1`, name: 'Tuition Fee', amount: 4500, dueDate: '2026-09-30', paidAmount: 0, pendingAmount: 4500, status: 'PENDING' },
            { id: `FS-${stu.id}-2`, name: 'Annual Fee', amount: 2000, dueDate: '2026-04-15', paidAmount: 0, pendingAmount: 2000, status: 'PENDING' }
          ],
          paymentHistory: []
        });
      } else {
        // Default realistic fee record based on rollNo / index
        const isPaid = (stu.rollNo || 1) % 3 === 0;
        const isPartial = (stu.rollNo || 1) % 3 === 1;
        const total = cleanClass.toLowerCase().includes('nursery') || cleanClass.toLowerCase().includes('kg') ? 5000 : 8000;
        const paid = isPaid ? total : (isPartial ? Math.floor(total / 2) : 0);
        const pending = total - paid;
        const status = paid === total ? 'PAID' : (paid > 0 ? 'PARTIAL' : 'PENDING');

        seedFees.push({
          id: `FEE-${stu.id}-2026-27`,
          studentId: stu.id,
          studentName: stu.name,
          admissionNo: stu.admissionNo,
          className: cleanClass,
          section: cleanSec,
          rollNo: stu.rollNo || 1,
          academicSessionId: '2026-27',
          totalFee: total,
          paidFee: paid,
          pendingFee: pending,
          status: status as any,
          lastPaymentDate: paid > 0 ? '2026-08-15' : undefined,
          dueDate: '2026-10-15',
          feeStructure: [
            { id: `FS-${stu.id}-1`, name: 'Tuition Fee', amount: Math.floor(total * 0.6), dueDate: '2026-09-30', paidAmount: isPaid ? Math.floor(total * 0.6) : (isPartial ? Math.floor(total * 0.3) : 0), pendingAmount: isPaid ? 0 : (isPartial ? Math.floor(total * 0.3) : Math.floor(total * 0.6)), status: isPaid ? 'PAID' : (isPartial ? 'PARTIAL' : 'PENDING') },
            { id: `FS-${stu.id}-2`, name: 'Annual Fee', amount: Math.floor(total * 0.4), dueDate: '2026-04-15', paidAmount: isPaid ? Math.floor(total * 0.4) : (isPartial ? Math.floor(total * 0.2) : 0), pendingAmount: isPaid ? 0 : (isPartial ? Math.floor(total * 0.2) : Math.floor(total * 0.4)), status: isPaid ? 'PAID' : (isPartial ? 'PARTIAL' : 'PENDING') }
          ],
          paymentHistory: paid > 0 ? [
            { receiptNo: `REC-2026-000${stu.rollNo || 5}`, date: '2026-08-15', amount: paid, paymentMode: 'Cash', collectedBy: 'Admin', status: 'PAID', description: 'School Fee Payment' }
          ] : []
        });
      }
    });

    (db as any).fees = seedFees;
    changed = true;
  }

  // Ensure Department Module initial seed data
  if (!Array.isArray(db.libraryCategories) || db.libraryCategories.length === 0) {
    db.libraryCategories = [
      { id: 'CAT-1', name: 'Mathematics', description: 'Maths textbooks and reference guides', status: 'Active' },
      { id: 'CAT-2', name: 'Science', description: 'Physics, Chemistry, Biology & General Science', status: 'Active' },
      { id: 'CAT-3', name: 'English', description: 'Grammar, literature and reader books', status: 'Active' },
      { id: 'CAT-4', name: 'Hindi', description: 'Hindi Vyakaran and Sahitya', status: 'Active' },
      { id: 'CAT-5', name: 'Computer', description: 'Computer Science, IT & Coding', status: 'Active' },
      { id: 'CAT-6', name: 'General Knowledge', description: 'Current Affairs & Quiz books', status: 'Active' },
      { id: 'CAT-7', name: 'Story Books', description: 'Children fiction and moral stories', status: 'Active' },
      { id: 'CAT-8', name: 'Reference', description: 'Dictionaries and Encyclopedias', status: 'Active' },
      { id: 'CAT-9', name: 'Other', description: 'Miscellaneous books', status: 'Active' }
    ];
    changed = true;
  }

  if (!Array.isArray(db.books) || db.books.length === 0) {
    db.books = [
      {
        id: 'BK-101',
        bookId: 'BK-101',
        title: 'Science Class 5',
        author: 'NCERT Board',
        isbn: '978-81-7450-482-5',
        publisher: 'NCERT',
        category: 'Science',
        edition: '2025 Edition',
        language: 'English',
        price: 150,
        quantity: 10,
        availableQuantity: 10,
        shelfNumber: 'Rack A-1',
        description: 'Standard textbook for Class 5 Science curriculum.',
        status: 'Available',
        createdAt: '2026-04-01'
      },
      {
        id: 'BK-102',
        bookId: 'BK-102',
        title: 'Mathematics Explorer',
        author: 'R.D. Sharma',
        isbn: '978-93-5144-889-1',
        publisher: 'Dhanpat Rai',
        category: 'Mathematics',
        edition: '12th Edition',
        language: 'English',
        price: 280,
        quantity: 15,
        availableQuantity: 15,
        shelfNumber: 'Rack M-2',
        description: 'Comprehensive math problems and practice exercises.',
        status: 'Available',
        createdAt: '2026-04-01'
      },
      {
        id: 'BK-103',
        bookId: 'BK-103',
        title: 'Computer Application & IT',
        author: 'Sumita Arora',
        isbn: '978-93-8917-456-1',
        publisher: 'Dhanpat Rai',
        category: 'Computer',
        edition: '2026 Edition',
        language: 'English',
        price: 320,
        quantity: 8,
        availableQuantity: 8,
        shelfNumber: 'Rack C-3',
        description: 'Introduction to computers, digital skills, and basic coding.',
        status: 'Available',
        createdAt: '2026-04-01'
      }
    ];
    changed = true;
  }

  if (!Array.isArray(db.libraryTransactions)) {
    db.libraryTransactions = [];
    changed = true;
  }

  if (!Array.isArray(db.hostels) || db.hostels.length === 0) {
    db.hostels = [
      {
        id: 'HST-1',
        name: 'Boys Hostel',
        type: 'Boys',
        wardenName: 'Mr. Rakesh Sharma',
        contactNumber: '9876543210',
        address: 'North Campus Wing, Adarsh Vidya Mandir, Bhagalpur',
        status: 'Active'
      },
      {
        id: 'HST-2',
        name: 'Girls Hostel',
        type: 'Girls',
        wardenName: 'Mrs. Sunita Verma',
        contactNumber: '9876543211',
        address: 'South Campus Wing, Adarsh Vidya Mandir, Bhagalpur',
        status: 'Active'
      }
    ];
    changed = true;
  }

  if (!Array.isArray(db.hostelRooms) || db.hostelRooms.length === 0) {
    db.hostelRooms = [
      {
        id: 'RM-101',
        hostelId: 'HST-1',
        hostelName: 'Boys Hostel',
        roomNumber: '101',
        floor: '1st Floor',
        roomType: 'Dormitory',
        bedCapacity: 4,
        currentOccupancy: 0,
        availableBeds: 4,
        status: 'Available'
      },
      {
        id: 'RM-102',
        hostelId: 'HST-1',
        hostelName: 'Boys Hostel',
        roomNumber: '102',
        floor: '1st Floor',
        roomType: 'Double',
        bedCapacity: 2,
        currentOccupancy: 0,
        availableBeds: 2,
        status: 'Available'
      },
      {
        id: 'RM-201',
        hostelId: 'HST-2',
        hostelName: 'Girls Hostel',
        roomNumber: '201',
        floor: '1st Floor',
        roomType: 'Triple',
        bedCapacity: 3,
        currentOccupancy: 0,
        availableBeds: 3,
        status: 'Available'
      }
    ];
    changed = true;
  }

  if (!Array.isArray(db.hostelBeds) || db.hostelBeds.length === 0) {
    db.hostelBeds = [
      { id: 'BED-101-1', roomId: 'RM-101', roomNumber: '101', hostelId: 'HST-1', bedNumber: 'Bed 1', status: 'Available' },
      { id: 'BED-101-2', roomId: 'RM-101', roomNumber: '101', hostelId: 'HST-1', bedNumber: 'Bed 2', status: 'Available' },
      { id: 'BED-101-3', roomId: 'RM-101', roomNumber: '101', hostelId: 'HST-1', bedNumber: 'Bed 3', status: 'Available' },
      { id: 'BED-101-4', roomId: 'RM-101', roomNumber: '101', hostelId: 'HST-1', bedNumber: 'Bed 4', status: 'Available' },
      { id: 'BED-102-1', roomId: 'RM-102', roomNumber: '102', hostelId: 'HST-1', bedNumber: 'Bed 1', status: 'Available' },
      { id: 'BED-102-2', roomId: 'RM-102', roomNumber: '102', hostelId: 'HST-1', bedNumber: 'Bed 2', status: 'Available' },
      { id: 'BED-201-1', roomId: 'RM-201', roomNumber: '201', hostelId: 'HST-2', bedNumber: 'Bed 1', status: 'Available' },
      { id: 'BED-201-2', roomId: 'RM-201', roomNumber: '201', hostelId: 'HST-2', bedNumber: 'Bed 2', status: 'Available' },
      { id: 'BED-201-3', roomId: 'RM-201', roomNumber: '201', hostelId: 'HST-2', bedNumber: 'Bed 3', status: 'Available' }
    ];
    changed = true;
  }

  if (!Array.isArray(db.hostelAssignments)) {
    db.hostelAssignments = [];
    changed = true;
  }

  if (!Array.isArray(db.buses) || db.buses.length === 0) {
    db.buses = [
      {
        id: 'BUS-1',
        busNumber: 'Bus 1',
        vehicleRegNumber: 'BR09R5292',
        vehicleType: 'School Bus',
        capacity: 40,
        currentOccupancy: 2,
        availableSeats: 38,
        model: 'Tata Starbus 40S',
        manufacturer: 'Tata Motors',
        purchaseYear: '2023',
        insuranceNumber: 'INS-BR09-2026-88',
        insuranceExpiry: '2027-03-31',
        fitnessCertNumber: 'FC-BR09-9941',
        fitnessExpiry: '2027-05-31',
        permitNumber: 'PER-BR-5520',
        permitExpiry: '2028-01-31',
        gpsDeviceId: 'GPS-BUS-101',
        driverId: 'DRV-1',
        driverName: 'Raj Kumar',
        driverPhone: '9988776655',
        conductorId: 'CND-1',
        conductorName: 'Amit Kumar',
        conductorPhone: '9988776644',
        routeId: 'RT-1',
        routeName: 'Route 1 — Kajraili to School',
        status: 'Active',
        notes: 'Primary route bus serving Kajraili & Amarpur'
      },
      {
        id: 'BUS-2',
        busNumber: 'Bus 2',
        vehicleRegNumber: 'BR10AV2652',
        vehicleType: 'School Bus',
        capacity: 40,
        currentOccupancy: 1,
        availableSeats: 39,
        model: 'Eicher Skyline Pro',
        manufacturer: 'Eicher Motors',
        purchaseYear: '2024',
        insuranceNumber: 'INS-BR10-2026-99',
        insuranceExpiry: '2027-06-30',
        fitnessCertNumber: 'FC-BR10-8832',
        fitnessExpiry: '2027-08-31',
        permitNumber: 'PER-BR-6610',
        permitExpiry: '2028-04-30',
        gpsDeviceId: 'GPS-BUS-102',
        driverId: 'DRV-2',
        driverName: 'Suresh Prasad',
        driverPhone: '9876511223',
        conductorId: 'CND-2',
        conductorName: 'Ramesh Kumar',
        conductorPhone: '9876522334',
        routeId: 'RT-2',
        routeName: 'Route 2 — Nathnagar to School',
        status: 'Active',
        notes: 'Serves Nathnagar & Champanagar route'
      },
      {
        id: 'BUS-3',
        busNumber: 'Bus 3',
        vehicleRegNumber: 'BR10PB3455',
        vehicleType: 'Mini School Bus',
        capacity: 30,
        currentOccupancy: 0,
        availableSeats: 30,
        model: 'Mahindra Cruzio',
        manufacturer: 'Mahindra & Mahindra',
        purchaseYear: '2024',
        insuranceNumber: 'INS-BR10-2026-77',
        insuranceExpiry: '2027-09-30',
        fitnessCertNumber: 'FC-BR10-7711',
        fitnessExpiry: '2027-11-30',
        permitNumber: 'PER-BR-7730',
        permitExpiry: '2028-06-30',
        gpsDeviceId: 'GPS-BUS-103',
        driverId: 'DRV-3',
        driverName: 'Mohan Singh',
        driverPhone: '9765433445',
        conductorId: 'CND-3',
        conductorName: 'Vikas Verma',
        conductorPhone: '9765444556',
        routeId: 'RT-3',
        routeName: 'Route 3 — Sultanganj to School',
        status: 'Active',
        notes: 'Long distance express route'
      }
    ];
    changed = true;
  }

  if (!Array.isArray(db.drivers) || db.drivers.length === 0) {
    db.drivers = [
      {
        id: 'DRV-1',
        employeeId: 'EMP-DRV-01',
        name: 'Raj Kumar',
        mobile: '9988776655',
        dob: '1985-06-15',
        address: 'Kajraili Village, Bhagalpur',
        licenseNumber: 'BR-DRIVER-2020-9988',
        licenseType: 'Heavy Commercial Vehicle (HCV)',
        licenseExpiry: '2028-12-31',
        joiningDate: '2022-04-01',
        assignedBusId: 'BUS-1',
        assignedBusNumber: 'Bus 1',
        emergencyContact: '9876500112',
        status: 'Active'
      },
      {
        id: 'DRV-2',
        employeeId: 'EMP-DRV-02',
        name: 'Suresh Prasad',
        mobile: '9876511223',
        dob: '1988-03-22',
        address: 'Nathnagar, Bhagalpur',
        licenseNumber: 'BR-DRIVER-2021-4433',
        licenseType: 'Heavy Commercial Vehicle (HCV)',
        licenseExpiry: '2029-05-20',
        joiningDate: '2023-02-10',
        assignedBusId: 'BUS-2',
        assignedBusNumber: 'Bus 2',
        emergencyContact: '9876500114',
        status: 'Active'
      },
      {
        id: 'DRV-3',
        employeeId: 'EMP-DRV-03',
        name: 'Mohan Singh',
        mobile: '9765433445',
        dob: '1982-11-10',
        address: 'Sultanganj, Bhagalpur',
        licenseNumber: 'BR-DRIVER-2019-7722',
        licenseType: 'Heavy Commercial Vehicle (HCV)',
        licenseExpiry: '2027-10-15',
        joiningDate: '2021-08-01',
        assignedBusId: 'BUS-3',
        assignedBusNumber: 'Bus 3',
        emergencyContact: '9876500115',
        status: 'Active'
      }
    ];
    changed = true;
  }

  if (!Array.isArray(db.conductors) || db.conductors.length === 0) {
    db.conductors = [
      {
        id: 'CND-1',
        employeeId: 'EMP-CND-01',
        name: 'Amit Kumar',
        mobile: '9988776644',
        address: 'Amarpur, Bhagalpur',
        joiningDate: '2023-01-15',
        assignedBusId: 'BUS-1',
        assignedBusNumber: 'Bus 1',
        emergencyContact: '9876500113',
        status: 'Active'
      },
      {
        id: 'CND-2',
        employeeId: 'EMP-CND-02',
        name: 'Ramesh Kumar',
        mobile: '9876522334',
        address: 'Champanagar, Bhagalpur',
        joiningDate: '2023-06-01',
        assignedBusId: 'BUS-2',
        assignedBusNumber: 'Bus 2',
        emergencyContact: '9876500116',
        status: 'Active'
      },
      {
        id: 'CND-3',
        employeeId: 'EMP-CND-03',
        name: 'Vikas Verma',
        mobile: '9765444556',
        address: 'Akbarnagar, Bhagalpur',
        joiningDate: '2024-01-10',
        assignedBusId: 'BUS-3',
        assignedBusNumber: 'Bus 3',
        emergencyContact: '9876500117',
        status: 'Active'
      }
    ];
    changed = true;
  }

  if (!Array.isArray(db.routes) || db.routes.length === 0) {
    db.routes = [
      {
        id: 'RT-1',
        routeName: 'Route 1 — Kajraili',
        routeCode: 'RT-001',
        startingPoint: 'Kajraili',
        endingPoint: 'Adarsh Vidya Mandir',
        description: 'Kajraili → Amarpur → Main Road → School',
        estimatedDuration: '45 Minutes',
        distance: '12 KM',
        morningStartTime: '07:15 AM',
        schoolArrivalTime: '07:50 AM',
        schoolDepartureTime: '02:00 PM',
        eveningEndTime: '04:10 PM',
        monthlyTransportFee: 800,
        status: 'Active'
      },
      {
        id: 'RT-2',
        routeName: 'Route 2 — Amarpur',
        routeCode: 'RT-002',
        startingPoint: 'Amarpur',
        endingPoint: 'Adarsh Vidya Mandir',
        description: 'Amarpur → Champanagar → University Road → School',
        estimatedDuration: '40 Minutes',
        distance: '15 KM',
        morningStartTime: '07:10 AM',
        schoolArrivalTime: '07:50 AM',
        schoolDepartureTime: '02:00 PM',
        eveningEndTime: '04:20 PM',
        monthlyTransportFee: 900,
        status: 'Active'
      },
      {
        id: 'RT-3',
        routeName: 'Route 3 — Bhagalpur',
        routeCode: 'RT-003',
        startingPoint: 'Bhagalpur Junction',
        endingPoint: 'Adarsh Vidya Mandir',
        description: 'Bhagalpur → Akbarnagar → Bypass Junction → School',
        estimatedDuration: '50 Minutes',
        distance: '22 KM',
        morningStartTime: '07:00 AM',
        schoolArrivalTime: '07:50 AM',
        schoolDepartureTime: '02:00 PM',
        eveningEndTime: '04:45 PM',
        monthlyTransportFee: 1100,
        status: 'Active'
      }
    ];
    changed = true;
  }

  if (!Array.isArray(db.routeStops) || db.routeStops.length === 0) {
    db.routeStops = [
      // Route 1 Stops
      { id: 'STP-101', routeId: 'RT-1', stopName: 'Kajraili', stopCode: 'STP-01', landmark: 'Kajraili Chowk', stopOrder: 1, pickupTime: '07:15 AM', dropTime: '02:15 PM', distance: '12 KM', transportFee: 800, status: 'Active' },
      { id: 'STP-102', routeId: 'RT-1', stopName: 'Amarpur', stopCode: 'STP-02', landmark: 'Near High School', stopOrder: 2, pickupTime: '07:25 AM', dropTime: '02:25 PM', distance: '8 KM', transportFee: 700, status: 'Active' },
      { id: 'STP-103', routeId: 'RT-1', stopName: 'Main Road', stopCode: 'STP-03', landmark: 'Petrol Pump Junction', stopOrder: 3, pickupTime: '07:35 AM', dropTime: '02:35 PM', distance: '4 KM', transportFee: 600, status: 'Active' },
      { id: 'STP-104', routeId: 'RT-1', stopName: 'School', stopCode: 'STP-04', landmark: 'Adarsh Vidya Mandir Gate', stopOrder: 4, pickupTime: '07:50 AM', dropTime: '02:00 PM', distance: '0 KM', transportFee: 0, status: 'Active' },

      // Route 2 Stops
      { id: 'STP-201', routeId: 'RT-2', stopName: 'Nathnagar', stopCode: 'STP-05', landmark: 'Nathnagar Station', stopOrder: 1, pickupTime: '07:10 AM', dropTime: '02:20 PM', distance: '15 KM', transportFee: 900, status: 'Active' },
      { id: 'STP-202', routeId: 'RT-2', stopName: 'Champanagar', stopCode: 'STP-06', landmark: 'Silk Factory Gate', stopOrder: 2, pickupTime: '07:20 AM', dropTime: '02:30 PM', distance: '11 KM', transportFee: 850, status: 'Active' },
      { id: 'STP-203', routeId: 'RT-2', stopName: 'University Road', stopCode: 'STP-07', landmark: 'TMBU Campus Gate', stopOrder: 3, pickupTime: '07:30 AM', dropTime: '02:40 PM', distance: '6 KM', transportFee: 700, status: 'Active' },
      { id: 'STP-204', routeId: 'RT-2', stopName: 'School', stopCode: 'STP-08', landmark: 'Adarsh Vidya Mandir Gate', stopOrder: 4, pickupTime: '07:50 AM', dropTime: '02:00 PM', distance: '0 KM', transportFee: 0, status: 'Active' },

      // Route 3 Stops
      { id: 'STP-301', routeId: 'RT-3', stopName: 'Bhagalpur Junction', stopCode: 'STP-09', landmark: 'Railway Station', stopOrder: 1, pickupTime: '07:00 AM', dropTime: '02:30 PM', distance: '22 KM', transportFee: 1100, status: 'Active' },
      { id: 'STP-302', routeId: 'RT-3', stopName: 'Akbarnagar', stopCode: 'STP-10', landmark: 'Akbarnagar Police Station', stopOrder: 2, pickupTime: '07:20 AM', dropTime: '02:45 PM', distance: '14 KM', transportFee: 950, status: 'Active' },
      { id: 'STP-303', routeId: 'RT-3', stopName: 'Bypass Junction', stopCode: 'STP-11', landmark: 'NH-80 Bypass Signal', stopOrder: 3, pickupTime: '07:35 AM', dropTime: '02:55 PM', distance: '7 KM', transportFee: 750, status: 'Active' },
      { id: 'STP-304', routeId: 'RT-3', stopName: 'School', stopCode: 'STP-12', landmark: 'Adarsh Vidya Mandir Gate', stopOrder: 4, pickupTime: '07:50 AM', dropTime: '02:00 PM', distance: '0 KM', transportFee: 0, status: 'Active' }
    ];
    changed = true;
  }

  if (!Array.isArray(db.studentTransportAssignments) || db.studentTransportAssignments.length === 0) {
    db.studentTransportAssignments = [
      {
        id: 'BUS-ASN-101',
        studentId: 'STU-157',
        studentName: 'Rahul Kumar',
        admissionNo: 'AVM20260518',
        className: 'Class 5',
        section: 'A',
        rollNo: 1,
        academicSessionId: '2026-27',
        busId: 'BUS-1',
        busNumber: 'Bus 1',
        vehicleRegNumber: 'BR09R5292',
        routeId: 'RT-1',
        routeName: 'Route 1 — Kajraili to School',
        pickupStopId: 'STP-101',
        pickupStopName: 'Kajraili',
        dropStopName: 'School',
        pickupTime: '07:15 AM',
        dropTime: '02:15 PM',
        monthlyTransportFee: 800,
        effectiveFrom: '2026-04-01',
        driverName: 'Raj Kumar',
        driverPhone: '9988776655',
        conductorName: 'Amit Kumar',
        conductorPhone: '9988776644',
        status: 'Active'
      },
      {
        id: 'BUS-ASN-102',
        studentId: 'STU-158',
        studentName: 'Ananya Verma',
        admissionNo: 'AVM20260519',
        className: 'Class 5',
        section: 'A',
        rollNo: 2,
        academicSessionId: '2026-27',
        busId: 'BUS-1',
        busNumber: 'Bus 1',
        vehicleRegNumber: 'BR09R5292',
        routeId: 'RT-1',
        routeName: 'Route 1 — Kajraili to School',
        pickupStopId: 'STP-102',
        pickupStopName: 'Amarpur',
        dropStopName: 'School',
        pickupTime: '07:25 AM',
        dropTime: '02:25 PM',
        monthlyTransportFee: 700,
        effectiveFrom: '2026-04-01',
        driverName: 'Raj Kumar',
        driverPhone: '9988776655',
        conductorName: 'Amit Kumar',
        conductorPhone: '9988776644',
        status: 'Active'
      },
      {
        id: 'BUS-ASN-103',
        studentId: 'STU-159',
        studentName: 'Amit Sharma',
        admissionNo: 'AVM20260520',
        className: 'Class 6',
        section: 'A',
        rollNo: 5,
        academicSessionId: '2026-27',
        busId: 'BUS-2',
        busNumber: 'Bus 2',
        vehicleRegNumber: 'BR10AV2652',
        routeId: 'RT-2',
        routeName: 'Route 2 — Nathnagar to School',
        pickupStopId: 'STP-201',
        pickupStopName: 'Nathnagar',
        dropStopName: 'School',
        pickupTime: '07:10 AM',
        dropTime: '02:20 PM',
        monthlyTransportFee: 900,
        effectiveFrom: '2026-04-01',
        driverName: 'Suresh Prasad',
        driverPhone: '9876511223',
        conductorName: 'Ramesh Kumar',
        conductorPhone: '9876522334',
        status: 'Active'
      }
    ];
    changed = true;
  }

  if (!Array.isArray(db.vehicleMaintenance)) {
    db.vehicleMaintenance = [
      {
        id: 'MAINT-101',
        busId: 'BUS-1',
        busNumber: 'Bus 1',
        vehicleRegNumber: 'BR09R5292',
        serviceDate: '2026-08-10',
        nextServiceDate: '2026-11-10',
        serviceType: 'Routine Oil & Brake Service',
        description: 'Engine oil replaced, brake pad check, wheel alignment',
        cost: 4500,
        workshop: 'Tata Authorized Motors Workshop, Bhagalpur',
        invoiceNumber: 'INV-2026-441',
        remarks: 'All safety checks cleared cleanly.',
        createdAt: '2026-08-10'
      }
    ];
    changed = true;
  }

  if (!Array.isArray(db.certificateTypes) || db.certificateTypes.length === 0) {
    db.certificateTypes = [
      { id: 'CT-1', code: 'BC', name: 'Bonafide Certificate', prefix: 'BC', description: 'Official proof of student enrollment', status: 'Active' },
      { id: 'CT-2', code: 'CC', name: 'Character Certificate', prefix: 'CC', description: 'Proof of student moral conduct', status: 'Active' },
      { id: 'CT-3', code: 'TC', name: 'Transfer Certificate', prefix: 'TC', description: 'School transfer / leaving certificate', status: 'Active' },
      { id: 'CT-4', code: 'SC', name: 'Study Certificate', prefix: 'SC', description: 'Study verification certificate', status: 'Active' },
      { id: 'CT-5', code: 'FC', name: 'Fee Certificate', prefix: 'FC', description: 'Fee payment receipt and clearance certificate', status: 'Active' },
      { id: 'CT-6', code: 'DBC', name: 'Date of Birth Certificate', prefix: 'DBC', description: 'Official DOB verification certificate', status: 'Active' },
      { id: 'CT-7', code: 'SLC', name: 'School Leaving Certificate', prefix: 'SLC', description: 'School exit certificate', status: 'Active' },
      { id: 'CT-8', code: 'AC', name: 'Achievement Certificate', prefix: 'AC', description: 'Academic or sports accomplishment award', status: 'Active' },
      { id: 'CT-9', code: 'CUST', name: 'Custom Certificate', prefix: 'CUST', description: 'Custom text certificate', status: 'Active' }
    ];
    changed = true;
  }

  if (!Array.isArray(db.certificates)) {
    db.certificates = [];
    changed = true;
  }

  if (!Array.isArray(db.notifications) || db.notifications.length === 0) {
    db.notifications = [
      {
        id: 'NFT-2026-001',
        title: 'Tomorrow Holiday Notice',
        message: 'School will remain closed tomorrow on account of Gandhi Jayanti. Online homework is assigned.',
        type: 'Notice',
        priority: 'High',
        senderName: 'Principal Office',
        senderId: 'ADMIN-001',
        audienceType: 'students',
        targetAudience: 'All Students',
        status: 'Sent',
        sentAt: '2026-09-30 09:30 AM',
        createdAt: '2026-09-30 09:30 AM',
        channels: ['in_app', 'push'],
        recipientCount: 89,
        deliveredCount: 89,
        readCount: 64,
        unreadCount: 25,
        recipients: [
          { id: 'STU-157', name: 'Aarav Kumar', roleOrClass: 'Class 5-A', deliveryStatus: 'Delivered', readStatus: 'Unread' },
          { id: 'STU-158', name: 'Ananya Sharma', roleOrClass: 'Class 5-A', deliveryStatus: 'Delivered', readStatus: 'Read', readAt: '2026-09-30 10:15 AM' },
          { id: 'STU-159', name: 'Rohan Gupta', roleOrClass: 'Class 5-A', deliveryStatus: 'Delivered', readStatus: 'Read', readAt: '2026-09-30 10:45 AM' }
        ]
      },
      {
        id: 'NFT-2026-002',
        title: 'Parent Teacher Meeting (PTM) Reminder',
        message: 'Dear Parents & Teachers, PTM is scheduled for Saturday 4th Oct from 09:00 AM to 01:00 PM.',
        type: 'Event',
        priority: 'Urgent',
        senderName: 'Admin Desk',
        senderId: 'ADMIN-001',
        audienceType: 'both',
        targetAudience: 'Students + Employees',
        status: 'Sent',
        sentAt: '2026-09-29 04:15 PM',
        createdAt: '2026-09-29 04:00 PM',
        channels: ['in_app', 'push'],
        recipientCount: 110,
        deliveredCount: 110,
        readCount: 92,
        unreadCount: 18,
        recipients: [
          { id: 'STU-157', name: 'Aarav Kumar', roleOrClass: 'Class 5-A', deliveryStatus: 'Delivered', readStatus: 'Read', readAt: '2026-09-29 05:00 PM' },
          { id: 'EMP-T102', name: 'Mrs. Priya Sharma', roleOrClass: 'Teacher', deliveryStatus: 'Delivered', readStatus: 'Read', readAt: '2026-09-29 04:30 PM' }
        ]
      },
      {
        id: 'NFT-2026-003',
        title: 'Mathematics Homework Assigned (Class 5-A)',
        message: 'Fractions Exercise 4B has been assigned by Mrs. Priya Sharma. Due date: Oct 3rd.',
        type: 'Homework',
        priority: 'Normal',
        senderName: 'Mrs. Priya Sharma',
        senderId: 'EMP-T102',
        audienceType: 'students',
        targetAudience: 'Class',
        targetClass: 'Class 5',
        targetSection: 'A',
        status: 'Sent',
        sentAt: '2026-09-29 02:30 PM',
        createdAt: '2026-09-29 02:30 PM',
        channels: ['in_app', 'push'],
        recipientCount: 32,
        deliveredCount: 32,
        readCount: 27,
        unreadCount: 5,
        recipients: [
          { id: 'STU-157', name: 'Aarav Kumar', roleOrClass: 'Class 5-A', deliveryStatus: 'Delivered', readStatus: 'Unread' }
        ]
      },
      {
        id: 'NFT-2026-004',
        title: 'Quarterly Fee Reminder Notice',
        message: 'Second installment fee for Session 2026-27 is due on October 15th, 2026. Pay online to avoid late fee.',
        type: 'Fee',
        priority: 'High',
        senderName: 'Accounts Office',
        senderId: 'ADMIN-001',
        audienceType: 'students',
        targetAudience: 'All Students',
        status: 'Sent',
        sentAt: '2026-09-28 11:00 AM',
        createdAt: '2026-09-28 10:45 AM',
        channels: ['in_app', 'push'],
        recipientCount: 150,
        deliveredCount: 150,
        readCount: 120,
        unreadCount: 30
      },
      {
        id: 'NFT-2026-005',
        title: 'Half Yearly Exam Timetable Published',
        message: 'The datesheet for Half Yearly Exams 2026 is published on the portal. Please download your admit cards.',
        type: 'Exam',
        priority: 'High',
        senderName: 'Exam Controller',
        senderId: 'ADMIN-001',
        audienceType: 'students',
        targetAudience: 'All Students',
        status: 'Sent',
        sentAt: '2026-09-27 10:00 AM',
        createdAt: '2026-09-27 09:30 AM',
        channels: ['in_app', 'push'],
        recipientCount: 450,
        deliveredCount: 450,
        readCount: 390,
        unreadCount: 60
      }
    ];
    changed = true;
  }

  if (!Array.isArray(db.notificationTemplates) || db.notificationTemplates.length === 0) {
    db.notificationTemplates = [
      { id: 'TMP-001', name: 'Fee Due Reminder', type: 'Fee', title: 'School Fee Payment Reminder', message: 'Dear Parent, This is a gentle reminder that the school fee of ₹{Amount} for {Month} is due on {DueDate}. Kindly clear the dues on time.', createdAt: '2026-09-01' },
      { id: 'TMP-002', name: 'Homework Assigned', type: 'Homework', title: 'New Homework Assigned', message: 'New homework for {Subject} has been assigned for Class {Class}. Please check the student portal for details and submission deadline.', createdAt: '2026-09-01' },
      { id: 'TMP-003', name: 'Attendance Alert', type: 'Attendance', title: 'Absence Alert', message: 'Dear Parent, your ward {StudentName} of Class {Class} was marked ABSENT today ({Date}). Contact school office if unauthorized.', createdAt: '2026-09-01' },
      { id: 'TMP-004', name: 'Exam Reminder', type: 'Exam', title: 'Upcoming Examination Notice', message: 'Half Yearly Examinations start on {Date}. Ensure student arrives by 08:30 AM with Admit Card.', createdAt: '2026-09-01' },
      { id: 'TMP-005', name: 'Result Published', type: 'Result', title: 'Exam Result Published', message: 'Results for {ExamName} have been published. Log in to the portal to view the digital mark sheet.', createdAt: '2026-09-01' },
      { id: 'TMP-006', name: 'Holiday Notice', type: 'Notice', title: 'School Holiday Announcement', message: 'School will remain closed on {Date} on account of {Reason}. Classes will resume as usual on next working day.', createdAt: '2026-09-01' },
      { id: 'TMP-007', name: 'PTM Reminder', type: 'Event', title: 'Parent Teacher Meeting (PTM)', message: 'Parent-Teacher Meeting (PTM) is scheduled on {Date} from 09:00 AM to 01:00 PM. Your presence is highly requested.', createdAt: '2026-09-01' },
      { id: 'TMP-008', name: 'Transport Update', type: 'Transport', title: 'School Bus Route Notice', message: 'Bus #{BusNo} route schedule has been updated. Pickup time for stop {StopName} is now {Time}.', createdAt: '2026-09-01' }
    ];
    changed = true;
  }

  if (!db.employeeAttendanceSettings) {
    db.employeeAttendanceSettings = {
      schoolLatitude: 26.9124,
      schoolLongitude: 75.7873,
      attendanceRadius: 50,
      schoolStartTime: '09:00 AM',
      lateThresholdTime: '09:30 AM',
      workingDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
      checkInEnabled: true,
      checkOutEnabled: true,
      breakFeatureEnabled: true
    };
    changed = true;
  }

  if (!Array.isArray(db.employeeAttendance) || db.employeeAttendance.length === 0) {
    db.employeeAttendance = [
      {
        id: 'EMP-ATT-20261002-001',
        employeeId: 'EMP-T101',
        employeeName: 'Mrs. Priya Sharma',
        designation: 'Senior Teacher',
        department: 'Academics',
        date: '2026-10-02',
        dayOfWeek: 'Friday',
        checkInTime: '07:12 AM',
        checkOutTime: '02:08 PM',
        workingMinutes: 416,
        status: 'Present',
        lateMinutes: 0,
        isEarlyCheckIn: true,
        latitude: 26.9124,
        longitude: 75.7873,
        distanceFromSchool: 34,
        locationVerified: true,
        createdAt: '2026-10-02 07:12 AM',
        updatedAt: '2026-10-02 02:08 PM'
      },
      {
        id: 'EMP-ATT-20261001-001',
        employeeId: 'EMP-T101',
        employeeName: 'Mrs. Priya Sharma',
        designation: 'Senior Teacher',
        department: 'Academics',
        date: '2026-10-01',
        dayOfWeek: 'Thursday',
        checkInTime: '09:42 AM',
        checkOutTime: '02:10 PM',
        workingMinutes: 268,
        status: 'Late',
        lateMinutes: 12,
        isEarlyCheckIn: false,
        latitude: 26.9124,
        longitude: 75.7873,
        distanceFromSchool: 41,
        locationVerified: true,
        createdAt: '2026-10-01 09:42 AM',
        updatedAt: '2026-10-01 02:10 PM'
      },
      {
        id: 'EMP-ATT-20260930-001',
        employeeId: 'EMP-T101',
        employeeName: 'Mrs. Priya Sharma',
        designation: 'Senior Teacher',
        department: 'Academics',
        date: '2026-09-30',
        dayOfWeek: 'Wednesday',
        checkInTime: '08:45 AM',
        checkOutTime: '02:15 PM',
        workingMinutes: 330,
        status: 'Present',
        lateMinutes: 0,
        isEarlyCheckIn: true,
        latitude: 26.9124,
        longitude: 75.7873,
        distanceFromSchool: 28,
        locationVerified: true,
        createdAt: '2026-09-30 08:45 AM',
        updatedAt: '2026-09-30 02:15 PM'
      },
      {
        id: 'EMP-ATT-20260929-001',
        employeeId: 'EMP-T101',
        employeeName: 'Mrs. Priya Sharma',
        designation: 'Senior Teacher',
        department: 'Academics',
        date: '2026-09-29',
        dayOfWeek: 'Tuesday',
        checkInTime: '08:50 AM',
        checkOutTime: '02:00 PM',
        workingMinutes: 310,
        status: 'Present',
        lateMinutes: 0,
        isEarlyCheckIn: true,
        latitude: 26.9124,
        longitude: 75.7873,
        distanceFromSchool: 32,
        locationVerified: true,
        createdAt: '2026-09-29 08:50 AM',
        updatedAt: '2026-09-29 02:00 PM'
      },
      {
        id: 'EMP-ATT-20260928-001',
        employeeId: 'EMP-T101',
        employeeName: 'Mrs. Priya Sharma',
        designation: 'Senior Teacher',
        department: 'Academics',
        date: '2026-09-28',
        dayOfWeek: 'Monday',
        checkInTime: '09:35 AM',
        checkOutTime: '02:10 PM',
        workingMinutes: 275,
        status: 'Late',
        lateMinutes: 5,
        isEarlyCheckIn: false,
        latitude: 26.9124,
        longitude: 75.7873,
        distanceFromSchool: 45,
        locationVerified: true,
        createdAt: '2026-09-28 09:35 AM'
      },
      {
        id: 'EMP-ATT-20260926-001',
        employeeId: 'EMP-T101',
        employeeName: 'Mrs. Priya Sharma',
        designation: 'Senior Teacher',
        department: 'Academics',
        date: '2026-09-26',
        dayOfWeek: 'Saturday',
        checkInTime: '',
        checkOutTime: '',
        workingMinutes: 0,
        status: 'On Leave',
        remarks: 'Casual Leave Approved',
        createdAt: '2026-09-26'
      },
      {
        id: 'EMP-ATT-20260925-001',
        employeeId: 'EMP-T101',
        employeeName: 'Mrs. Priya Sharma',
        designation: 'Senior Teacher',
        department: 'Academics',
        date: '2026-09-25',
        dayOfWeek: 'Friday',
        checkInTime: '07:05 AM',
        checkOutTime: '02:05 PM',
        workingMinutes: 420,
        status: 'Present',
        lateMinutes: 0,
        isEarlyCheckIn: true,
        latitude: 26.9124,
        longitude: 75.7873,
        distanceFromSchool: 25,
        locationVerified: true,
        createdAt: '2026-09-25 07:05 AM'
      },
      {
        id: 'EMP-ATT-20261002-002',
        employeeId: 'EMP-T102',
        employeeName: 'Mr. Raj Kumar',
        designation: 'Assistant Teacher',
        department: 'Academics',
        date: '2026-10-02',
        dayOfWeek: 'Friday',
        checkInTime: '08:50 AM',
        checkOutTime: '02:00 PM',
        workingMinutes: 310,
        status: 'Present',
        latitude: 26.9124,
        longitude: 75.7873,
        distanceFromSchool: 22,
        locationVerified: true,
        createdAt: '2026-10-02 08:50 AM'
      },
      {
        id: 'EMP-ATT-20261002-003',
        employeeId: 'EMP-T103',
        employeeName: 'Mrs. Sunita Verma',
        designation: 'Primary Teacher',
        department: 'Academics',
        date: '2026-10-02',
        dayOfWeek: 'Friday',
        checkInTime: '09:40 AM',
        checkOutTime: '02:15 PM',
        workingMinutes: 275,
        status: 'Late',
        lateMinutes: 10,
        latitude: 26.9124,
        longitude: 75.7873,
        distanceFromSchool: 18,
        locationVerified: true,
        createdAt: '2026-10-02 09:40 AM'
      }
    ];
    changed = true;
  }

  if (changed) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(db));
    } catch(e){}
  }
  return db;
}

export const demoDataStore = {
  // Synchronous Read (returns memory cache immediately, initializes if null)
  getDB(): DemoDBStructure {
    if (memoryDB) return ensureSessionData(memoryDB);

    // 1. Try reading from localStorage synchronously
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        memoryDB = ensureSessionData(JSON.parse(raw));
        return memoryDB!;
      }
    } catch (e) {
      console.warn('[DEMO STORE] localStorage read error:', e);
    }

    // 2. Initialize Seed Data ONCE if no stored data exists
    memoryDB = ensureSessionData(INITIAL_SEED_DB);
    this.saveDB(memoryDB);
    return memoryDB;
  },

  // Async Initialization (loads from Capacitor Preferences on app launch)
  async initAsync(): Promise<DemoDBStructure> {
    try {
      const { value } = await Preferences.get({ key: STORAGE_KEY });
      if (value) {
        memoryDB = JSON.parse(value);
        try { localStorage.setItem(STORAGE_KEY, value); } catch (e) {}
        console.log('[DEMO STORE] Successfully loaded stored demo database from Capacitor Preferences');
        return memoryDB!;
      }
    } catch (e) {
      console.warn('[DEMO STORE] Capacitor Preferences read error:', e);
    }

    // If not found in Preferences, try localStorage
    return this.getDB();
  },

  // Save DB to both memory cache, localStorage, and Capacitor Preferences
  saveDB(dbData: DemoDBStructure) {
    memoryDB = dbData;
    const jsonStr = JSON.stringify(dbData);

    // Save to localStorage synchronously
    try {
      localStorage.setItem(STORAGE_KEY, jsonStr);
      localStorage.setItem(VERSION_KEY, CURRENT_VERSION);
    } catch (e) {
      console.warn('[DEMO STORE] localStorage save error:', e);
    }

    // Save to Capacitor Preferences asynchronously for native Android persistence
    Preferences.set({ key: STORAGE_KEY, value: jsonStr }).catch((err) => {
      console.warn('[DEMO STORE] Capacitor Preferences save error:', err);
    });

    // Notify subscribed UI screens to re-render
    listeners.forEach((fn) => fn());
  },

  // Subscribe to changes
  subscribe(fn: () => void) {
    listeners.push(fn);
    return () => {
      const idx = listeners.indexOf(fn);
      if (idx !== -1) listeners.splice(idx, 1);
    };
  },

  // Reset database back to seed state
  resetDB() {
    memoryDB = ensureSessionData(JSON.parse(JSON.stringify(INITIAL_SEED_DB)));
    this.saveDB(memoryDB);
    return memoryDB;
  },

  // Helper: Retrieve canonical employee by ID, Employee ID, or Username
  getEmployeeById(idOrEmpId: string): any {
    if (!idOrEmpId) return null;
    const db = this.getDB();
    const emps = db.employees || [];
    const search = idOrEmpId.trim().toLowerCase();
    const normalize = (s?: string) => s ? s.trim().toLowerCase().replace(/^(mr|mrs|ms|dr|miss)\.?\s+/i, '').trim() : '';

    return emps.find((e: any) =>
      (e.id && e.id.toLowerCase() === search) ||
      (e.employeeId && e.employeeId.toLowerCase() === search) ||
      (e.username && e.username.toLowerCase() === search) ||
      (e.name && (e.name.toLowerCase() === search || normalize(e.name) === normalize(search)))
    ) || null;
  },

  getEmployeeAttendanceRecords(): EmployeeAttendanceRecord[] {
    const db = this.getDB();
    return db.employeeAttendance || [];
  },

  getEmployeeAttendanceSettings(): EmployeeAttendanceSettings {
    const db = this.getDB();
    return db.employeeAttendanceSettings || {
      schoolLatitude: 26.9124,
      schoolLongitude: 75.7873,
      attendanceRadius: 50,
      schoolStartTime: '09:00 AM',
      lateThresholdTime: '09:30 AM',
      workingDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
      checkInEnabled: true,
      checkOutEnabled: true,
      breakFeatureEnabled: true
    };
  },

  updateEmployeeAttendanceSettings(settings: Partial<EmployeeAttendanceSettings>): void {
    const db = this.getDB();
    db.employeeAttendanceSettings = {
      ...(db.employeeAttendanceSettings || {
        schoolLatitude: 26.9124,
        schoolLongitude: 75.7873,
        attendanceRadius: 50,
        schoolStartTime: '09:00 AM',
        lateThresholdTime: '09:30 AM',
        workingDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
        checkInEnabled: true,
        checkOutEnabled: true,
        breakFeatureEnabled: true
      }),
      ...settings
    };
    this.saveDB(db);
  },

  saveEmployeeAttendanceRecord(record: EmployeeAttendanceRecord): void {
    const db = this.getDB();
    if (!Array.isArray(db.employeeAttendance)) {
      db.employeeAttendance = [];
    }
    const idx = db.employeeAttendance.findIndex(r => r.id === record.id || (r.employeeId === record.employeeId && r.date === record.date));
    if (idx >= 0) {
      db.employeeAttendance[idx] = { ...db.employeeAttendance[idx], ...record };
    } else {
      db.employeeAttendance.unshift(record);
    }
    this.saveDB(db);
  },

  deleteEmployeeAttendanceRecord(employeeId: string, dateStr: string): void {
    const db = this.getDB();
    if (Array.isArray(db.employeeAttendance)) {
      db.employeeAttendance = db.employeeAttendance.filter(
        r => !(r.employeeId === employeeId && r.date === dateStr)
      );
      this.saveDB(db);
    }
  },

  getLeaveApplications(employeeId?: string): any[] {
    const db = this.getDB();
    let list = db.leaveApplications || [];
    if (employeeId && employeeId !== 'All') {
      const targetId = employeeId.toLowerCase();
      list = list.filter(
        (l: any) =>
          l.employeeId?.toLowerCase() === targetId ||
          (targetId === 't102' && l.employeeId === 'EMP-T101') ||
          (targetId === 'emp-t101' && l.employeeId === 'T102')
      );
    }
    return list;
  },

  saveLeaveApplication(leave: any): void {
    const db = this.getDB();
    if (!Array.isArray(db.leaveApplications)) {
      db.leaveApplications = [];
    }
    const idx = db.leaveApplications.findIndex((l: any) => l.id === leave.id);
    if (idx >= 0) {
      db.leaveApplications[idx] = { ...db.leaveApplications[idx], ...leave };
    } else {
      db.leaveApplications.unshift(leave);
    }
    this.saveDB(db);
  },

  updateLeaveStatus(leaveId: string, status: 'APPROVED' | 'REJECTED' | 'CANCELLED' | 'PENDING' | string, reviewedBy?: string, adminRemarks?: string): any | null {
    const db = this.getDB();
    if (!Array.isArray(db.leaveApplications)) return null;
    const idx = db.leaveApplications.findIndex((l: any) => l.id === leaveId || l.leaveId === leaveId);
    if (idx < 0) return null;

    const now = new Date();
    const formattedNow = `${now.toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' })} • ${now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}`;

    const updated = {
      ...db.leaveApplications[idx],
      status,
      reviewedBy: reviewedBy || 'Admin',
      reviewedAt: formattedNow,
      adminRemarks: adminRemarks || (status === 'APPROVED' ? 'Approved by Admin' : 'Rejected by Admin')
    };

    db.leaveApplications[idx] = updated;

    // Create Notification for Employee
    if (!Array.isArray(db.notifications)) db.notifications = [];
    const notifMsg = status === 'APPROVED'
      ? `Your leave application for ${updated.fromDate} – ${updated.toDate} (${updated.totalDays} Days) has been approved.`
      : status === 'REJECTED'
      ? `Your leave application for ${updated.fromDate} – ${updated.toDate} has been rejected. Remark: ${adminRemarks || 'Exam duty'}`
      : `Your leave application for ${updated.fromDate} – ${updated.toDate} has been cancelled.`;

    db.notifications.unshift({
      id: `NOTIF-LV-${Date.now()}`,
      recipientRole: 'Teacher',
      employeeId: updated.employeeId,
      title: `Leave Application ${status === 'APPROVED' ? 'Approved ✓' : status === 'REJECTED' ? 'Rejected ✕' : 'Cancelled'}`,
      message: notifMsg,
      timestamp: formattedNow,
      read: false,
      type: 'Notice'
    });

    this.saveDB(db);
    return updated;
  }
};
