export type UserRole = 'student' | 'employee' | 'admin';

export type AssessmentLevel = 'Excellent' | 'Good' | 'Needs Improvement';

export interface Student {
  id: string;
  admissionNo: string;
  rollNo: number;
  name: string;
  photo: string;
  className: string; // e.g. 'Class 5' or 'Nursery'
  section: string;   // 'A' | 'B' | 'C'
  dob?: string;
  dateOfBirth?: string;
  gender: 'Male' | 'Female' | 'Other';
  fatherName: string;
  motherName: string;
  guardianName?: string;
  guardianRelation?: string;
  guardianPhone?: string;
  fatherOcc?: string;
  motherOcc?: string;
  phone: string;
  altPhone?: string;
  email?: string;
  address: string;
  permanentAddress?: string;
  city?: string;
  district?: string;
  state?: string;
  pinCode?: string;
  bloodGroup: string;
  status: 'Active' | 'Inactive' | 'Promoted' | 'Repeated' | 'Left School' | 'Left' | 'Transferred';
  admissionDate?: string;
  previousSchool?: string;
  previousClass?: string;
  houseGroup?: string;
  academicSessionId?: string;
  previousDue?: number;
  sessionFee?: number;
  totalFee?: number;
  paidFee?: number;
  pendingFee?: number;
  marks?: Record<string, number>;
  aadhaar?: string;
  nationality?: string;
  category?: string;
  motherTongue?: string;
  religion?: string;
  emgName?: string;
  emgPhone?: string;
  emgRelation?: string;
  medicalNotes?: string;
  allergies?: string;
  transportRequired?: boolean;
  transportBusNo?: string;
  transportRoute?: string;
  transportStop?: string;
  transportPickupPoint?: string;
  transportDropPoint?: string;
  driverName?: string;
  driverPhone?: string;
  driverContact?: string;
  documents?: Record<string, boolean | string>;
  password?: string;
}

export interface SchoolSalaryPaymentRecord {
  id: string;
  employeeId: string;
  employeeName: string;
  paymentMonth: string;
  salaryAmount: number;
  paidAmount: number;
  pendingAmount: number;
  paymentDate: string;
  paymentMode: string;
  transactionRef?: string;
  remarks?: string;
  status: 'Paid' | 'Partial' | 'Pending';
  createdAt?: string;
}

export interface EmployeeDocument {
  id: string;
  docType: string;
  docNumber: string;
  fileUrl?: string;
  fileName?: string;
  issueDate?: string;
  expiryDate?: string;
  remarks?: string;
}

export interface EmployeeDueRecord {
  id: string;
  dueType: string;
  description: string;
  amount: number;
  dueDate: string;
  paidAmount: number;
  pendingAmount: number;
  status: 'Paid' | 'Partial' | 'Pending';
  remarks?: string;
  createdAt?: string;
}

export interface Employee {
  id: string;
  employeeId: string;
  name: string;
  photo: string;
  designation: string; // e.g. 'Senior Teacher', 'Class Teacher'
  department: string;
  subject: string;
  addSubjects?: string;
  gender?: 'Male' | 'Female' | 'Other';
  dob?: string;
  bloodGroup?: string;
  category?: string;
  nationality?: string;
  aadhaar?: string;
  panNumber?: string;
  qualification?: string;
  profQual?: string;
  specialization?: string;
  teachingExp?: string;
  medium?: string;
  experience?: string;
  employmentType?: string;
  workStatus?: string;
  prevSchool?: string;
  prevDesignation?: string;
  uanCode?: string;
  esiNumber?: string;
  pfNumber?: string;
  employeeRole?: string;
  phone: string;
  altPhone?: string;
  email: string;
  fatherName?: string;
  motherName?: string;
  spouseName?: string;
  guardianName?: string;
  emgName?: string;
  emgRelation?: string;
  emgPhone?: string;
  emgAltPhone?: string;
  emgAddress?: string;
  address?: string;
  addressLine2?: string;
  village?: string;
  city?: string;
  district?: string;
  state?: string;
  pinCode?: string;
  sameAsCurrentAddress?: boolean;
  permAddress?: string;
  permAddressLine2?: string;
  permVillage?: string;
  permCity?: string;
  permDistrict?: string;
  permState?: string;
  permPinCode?: string;
  username?: string;
  assignedClasses: string[]; // e.g. ['Class 5-A', 'Class 8-B', 'Nursery-A']
  joinDate: string;
  academicSessionId?: string;
  status?: 'Active' | 'Inactive' | 'On Leave' | 'Resigned';
  password?: string;
  // Class Teacher Assignment
  isClassTeacher?: 'Yes' | 'No';
  classTeacherClass?: string; // e.g. 'Class 5'
  classTeacherSection?: string; // e.g. 'A'
  // Teaching Subjects
  teachingSubjects?: string[]; // e.g. ['Mathematics', 'Science']
  // Documents
  documents?: EmployeeDocument[];
  // Dues
  dues?: EmployeeDueRecord[];
  // Salary / Payroll
  salaryType?: 'Monthly' | 'Daily' | 'Contract' | string;
  basicSalary?: number;
  allowances?: number;
  deduction?: number;
  netSalary?: number;
  paidSalary?: number;
  pendingSalary?: number;
  salaryPaymentStatus?: 'Paid' | 'Partial' | 'Pending';
  paymentMode?: string;
  bankName?: string;
  accountNumber?: string;
  ifscCode?: string;
  accountStatus?: string;
  salaryStatus?: 'Active' | 'On Hold';
  salaryEffectiveFrom?: string;
  salaryPayments?: SchoolSalaryPaymentRecord[];
  salaryPaymentsHistory?: SchoolSalaryPaymentRecord[];
  // Transport
  transportReq?: 'Yes' | 'No';
  transportBusId?: string;
  transportRoute?: string;
  transportVillage?: string;
  transportStop?: string;
  transportTime?: string;
  transportFee?: number;
  transportStartDate?: string;
  transportStatus?: string;
}

export interface AttendanceRecord {
  id?: string;
  date: string; // YYYY-MM-DD
  studentId: string;
  studentName?: string;
  admissionNo?: string;
  rollNo?: number;
  photo?: string;
  className?: string;
  section?: string;
  academicSessionId?: string;
  status: 'present' | 'absent' | 'leave';
  remark?: string;
  teacherId?: string;
  teacherName?: string;
  time?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Homework {
  id: string;
  subject: string;
  subjectId?: string;
  title: string;
  description: string;
  instructions?: string;
  assignedDate: string;
  homeworkDate?: string;
  dueDate: string;
  className: string;
  section: string;
  teacherName: string;
  teacherId?: string;
  createdByEmployeeId?: string;
  createdByEmployeeName?: string;
  status: 'New' | 'Pending' | 'Due Today' | 'Overdue' | 'Completed' | 'Late' | string;
  attachmentUrl?: string;
  fileUrl?: string;
  cloudinaryPublicId?: string;
  attachments?: any[];
  schoolId?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Exam {
  id: string;
  name: string; // e.g. 'Half Yearly Examination 2026'
  academicYear?: string;
  academicSessionId?: string;
  type?: string;
  startDate: string;
  endDate: string;
  description?: string;
  status?: string;
  classesCount?: number;
  subjectsCount?: number;
  classes?: string[];
  isAdmitCardPublished?: boolean;
}

export interface MarkItem {
  subject: string;
  marksObtained: number;
  maxMarks: number;
  grade: string;
}

export interface EarlyYearSkillEvaluation {
  category: string; // e.g. 'Language Development', 'Numeracy Skills'
  rating: AssessmentLevel;
  remark: string;
}

export interface StudentResult {
  id: string;
  studentId: string;
  examId: string;
  examName: string;
  className: string;
  section: string;
  academicSessionId?: string;
  sessionName?: string;
  isEarlyYears: boolean; // True for Nursery, LKG, UKG
  marks?: MarkItem[];
  totalObtained?: number;
  totalMax?: number;
  percentage?: number;
  grade?: string;
  skillsEvaluation?: EarlyYearSkillEvaluation[];
  teacherRemarks: string;
  issueDate: string;
}

export interface FeeCategory {
  name: string;
  amount: number;
  paid: boolean;
}

export interface FeePayment {
  receiptNo: string;
  date: string;
  amount: number;
  paymentMode: 'Online UPI' | 'Cash' | 'Bank Transfer' | 'Cheque' | 'Online' | 'UPI';
  status: 'Paid' | 'Pending' | 'Failed' | 'PAID' | 'REFUNDED' | 'CANCELLED';
  description: string;
}

export interface StudentFeeDetails {
  studentId: string;
  studentName?: string;
  className?: string;
  section?: string;
  academicYear?: string;
  totalFee: number;
  paidFee: number;
  pendingFee?: number;
  dueFee?: number;
  dueDate?: string;
  lastPaymentDate?: string;
  status?: string;
  receipts?: any[];
  categories?: FeeCategory[];
  history?: FeePayment[];
}

export type NoticeType =
  | 'General'
  | 'Academic'
  | 'Exam'
  | 'Holiday'
  | 'PTM'
  | 'Homework'
  | 'Fee'
  | 'Emergency'
  | 'Event'
  | 'Circular';

export type NoticeRecipients = 'students' | 'employees' | 'both' | 'all' | 'All' | string;

export type NoticeStatus = 'Published' | 'Draft' | 'Scheduled' | 'Archived';

export interface Notice {
  id: string;
  title: string;
  type?: NoticeType;
  category?: string; // fallback alias for type
  description?: string;
  body?: string;
  recipients?: NoticeRecipients;
  targetType?: 'all' | 'class' | 'department';
  targetClassId?: string;
  targetClass?: string;   // e.g. 'Class 5' or 'All'
  targetSection?: string; // e.g. 'A' or 'All'
  targetDepartment?: string; // e.g. 'Academics' or 'All'
  targetEmployeeIds?: string[];
  attachmentName?: string;
  attachmentUrl?: string;
  fileUrl?: string;
  cloudinaryPublicId?: string;
  cloudinaryId?: string;
  schoolId?: string;
  status?: NoticeStatus;
  publishDate?: string; // YYYY-MM-DD
  publishTime?: string; // HH:MM AM/PM
  scheduledDate?: string;
  scheduledTime?: string;
  createdAt?: string;
  updatedAt?: string;
  readBy?: Record<string, string>; // userId -> timestamp read
  isUnread?: boolean;
  date?: string; // legacy fallback
  targetAudience?: string; // legacy fallback
  target?: string;
  targetRole?: string;
}

export interface PeriodRecord {
  id: string;
  periodNumber: number;
  name: string;
  startTime: string;
  endTime: string;
  type: 'Regular' | 'Break' | 'Lunch' | 'Assembly' | 'Activity';
}

export interface ClassSubjectRecord {
  id: string;
  className: string;
  section: string;
  subjectId: string;
  subjectName: string;
  status?: 'Active' | 'Inactive';
}

export interface TeachingAssignmentRecord {
  id: string;
  teacherId: string;
  teacherName: string;
  subjectId?: string;
  subjectName: string;
  className: string;
  section: string;
}

export interface TimetableSlot {
  id: string;
  academicSessionId?: string;
  day: 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday' | 'Mon' | 'Tue' | 'Wed' | 'Thu' | 'Fri' | 'Sat' | string;
  period: number;
  periodId?: string;
  periodName?: string;
  startTime: string;
  endTime: string;
  subject: string;
  subjectId?: string;
  teacherName: string;
  teacherId?: string;
  className: string;
  section: string;
  room?: string;
  type?: 'Regular' | 'Break' | 'Lunch' | 'Assembly' | 'Activity';
  status?: 'Active' | 'Cancelled';
  createdAt?: string;
  updatedAt?: string;
}

export interface LeaveApplication {
  id: string;
  leaveId?: string;
  employeeId: string;
  employeeName: string;
  employeeDepartment?: string;
  employeeDesignation?: string;
  fromDate: string;
  toDate: string;
  totalDays?: number;
  reason: string;
  documentPhoto?: string;
  documentFileName?: string;
  fileUrl?: string;
  cloudinaryPublicId?: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED' | 'Pending' | 'Approved' | 'Rejected' | 'Cancelled';
  submittedAt?: string;
  appliedOn?: string;
  reviewedAt?: string;
  reviewedBy?: string;
  adminRemarks?: string;
}

export interface NotificationRecipientRecord {
  id: string;
  name: string;
  roleOrClass: string;
  deliveryStatus: 'Delivered' | 'Pending' | 'Failed';
  readStatus: 'Read' | 'Unread';
  readAt?: string;
}

export type NotificationType = 'General' | 'Academic' | 'Homework' | 'Attendance' | 'Fee' | 'Exam' | 'Result' | 'Notice' | 'Timetable' | 'Transport' | 'Event' | 'Emergency' | 'Other';
export type NotificationPriority = 'Low' | 'Normal' | 'High' | 'Urgent';

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  time?: string;
  type: NotificationType;
  priority?: NotificationPriority;
  senderId?: string;
  senderName?: string;
  audienceType?: 'students' | 'employees' | 'both';
  targetAudience?: 'All Students' | 'Class' | 'Section' | 'Individual Student' | 'All Employees' | 'Teachers' | 'Non-Teaching Staff' | 'Individual Employee' | string;
  targetClass?: string;
  targetSection?: string;
  targetStudentId?: string;
  targetStudentName?: string;
  targetEmployeeId?: string;
  targetEmployeeName?: string;
  attachmentName?: string;
  attachmentUrl?: string;
  actionUrl?: string;
  channels?: ('in_app' | 'push' | 'email' | 'sms' | 'whatsapp')[];
  status?: 'Sent' | 'Scheduled' | 'Draft' | 'Failed';
  scheduledAt?: string;
  sentAt?: string;
  createdAt?: string;
  recipientCount?: number;
  deliveredCount?: number;
  readCount?: number;
  unreadCount?: number;
  recipients?: NotificationRecipientRecord[];
  isRead?: boolean;
}

export interface NotificationTemplate {
  id: string;
  name: string;
  type: NotificationType;
  title: string;
  message: string;
  createdAt: string;
}
export interface Bus {
  id: string;
  busNumber: string;
  vehicleNumber: string;
  driverName: string;
  driverMobile?: string;
  driverPhone?: string;
  conductorName?: string;
  capacity: number;
  status: 'Active' | 'Inactive' | 'Under Maintenance';
  routeArea?: string;
  notes?: string;
  busNo?: string;
  vehicleNo?: string;
  routeName?: string;
  feePerMonth?: number;
  stops?: Array<{ name: string; pickupTime: string }>;
}

export interface StudentTransportAssignment {
  id: string;
  busId: string;
  studentId: string;
  studentName?: string;
  admissionNo?: string;
  className?: string;
  section?: string;
  rollNo?: number;
  village: string;
  pickupStop: string;
  pickupTime: string;
  monthlyFee: number;
  status: 'Active' | 'Inactive';
  isStaff?: boolean;
  designation?: string;
  userType?: 'Student' | 'Staff';
}

export interface CertificateItem {
  id: string;
  certificateNo: string;
  type: string;
  recipientType?: 'student' | 'employee';
  studentId?: string;
  studentName?: string;
  employeeId?: string;
  employeeName?: string;
  designation?: string;
  department?: string;
  joinDate?: string;
  qualification?: string;
  admissionNo?: string;
  className?: string;
  section?: string;
  rollNo?: number;
  dob?: string;
  fatherName?: string;
  motherName?: string;
  address?: string;
  photo?: string;
  issueDate: string;
  issuedBy: string;
  purpose?: string;
  remarks?: string;
  status: 'Issued' | 'Pending' | 'Draft' | 'Revoked';
  createdAt?: string;
}

export interface CertificateTypeItem {
  id: string;
  name: string;
  code: string;
  description: string;
  templateId?: string;
  status: 'Active' | 'Inactive';
  createdDate?: string;
}

export interface CertificateTemplateItem {
  id: string;
  name: string;
  type: string;
  headerText: string;
  titleText: string;
  bodyTemplate: string;
  footerText: string;
  includePhoto: boolean;
  includeSeal: boolean;
  includeSignature: boolean;
  status: 'Active' | 'Draft';
}

export interface CertificateSettings {
  prefix: string;
  autoNumbering: boolean;
  defaultIssueDate: string;
  includePhoto: boolean;
  includeAdmissionDetails: boolean;
  includeDateOfIssue: boolean;
  includeSchoolSeal: boolean;
  includeSignature: boolean;
  defaultPrintLayout: '1 Certificate Per Page (A4)' | '2 Certificates Per Page' | '4 Certificates Per Page';
}

export interface SavedAccount {
  id: string;
  userId: string;
  role: UserRole;
  name: string;
  className?: string;
  section?: string;
  admissionNo?: string;
  employeeId?: string;
  designation?: string;
  photo?: string;
  lastActiveTime?: number;
  userObj?: Student | Employee | any;
}

