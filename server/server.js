import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DB_FILE = path.join(__dirname, 'db.json');

const app = express();
const PORT = process.env.PORT || 3001;

app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, Accept, Access-Control-Allow-Private-Network');
  res.header('Access-Control-Allow-Private-Network', 'true');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept', 'Access-Control-Allow-Private-Network']
}));
app.use(express.json());

// Health Check Endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    mode: process.env.APP_MODE || 'demo'
  });
});

const AVM_OFFICIAL_CLASSES = [
  'Nursery-A', 'LKG-A', 'UKG-A',
  'Class 1-A', 'Class 2-A', 'Class 3-A', 'Class 4-A', 'Class 5-A', 'Class 6-A', 'Class 7-A', 'Class 8-A'
];

// Helper to normalize class names e.g. "Class 5" -> "Class 5-A", "nursery" -> "Nursery-A"
const normalizeClassName = (name) => {
  if (!name) return 'Class 5-A';
  let s = String(name).trim();
  const lower = s.toLowerCase();

  if (lower.includes('nursery')) return 'Nursery-A';
  if (lower.includes('lkg')) return 'LKG-A';
  if (lower.includes('ukg')) return 'UKG-A';

  const digitMatch = lower.match(/\d+/);
  if (digitMatch) {
    return `Class ${digitMatch[0]}-A`;
  }

  const found = AVM_OFFICIAL_CLASSES.find((c) => c.toLowerCase() === lower);
  return found || s;
};

// Helper to read DB
const readDB = () => {
  try {
    const data = fs.readFileSync(DB_FILE, 'utf8');
    const parsed = JSON.parse(data);
    return {
      academicSessions: parsed.academicSessions || [],
      studentEnrollments: parsed.studentEnrollments || [],
      employeeSessionAssignments: parsed.employeeSessionAssignments || [],
      users: parsed.users || [],
      students: parsed.students || [],
      employees: parsed.employees || [],
      classes: parsed.classes || [],
      sections: parsed.sections || ['A', 'B', 'C'],
      attendance: parsed.attendance || [],
      homework: parsed.homework || [],
      exams: parsed.exams || [],
      marks: parsed.marks || [],
      fees: parsed.fees || [],
      notices: parsed.notices || [],
      notifications: parsed.notifications || [],
      timetable: parsed.timetable || [],
      admitCards: parsed.admitCards || [],
      leaveApplications: parsed.leaveApplications || []
    };
  } catch (err) {
    console.error('Error reading DB:', err);
    return {
      academicSessions: [],
      studentEnrollments: [],
      employeeSessionAssignments: [],
      users: [],
      students: [],
      employees: [],
      classes: [],
      sections: [],
      attendance: [],
      homework: [],
      exams: [],
      marks: [],
      fees: [],
      notices: [],
      notifications: [],
      timetable: [],
      admitCards: [],
      leaveApplications: []
    };
  }
};

const ensureSessionData = (db) => {
  let changed = false;
  if (!db.academicSessions || !Array.isArray(db.academicSessions) || db.academicSessions.length === 0) {
    db.academicSessions = [
      { id: '2026-27', name: '2026–27', startDate: '2026-04-01', endDate: '2027-03-31', isActive: true, status: 'active' }
    ];
    changed = true;
  }
  if (!db.studentEnrollments || !Array.isArray(db.studentEnrollments) || db.studentEnrollments.length === 0) {
    db.studentEnrollments = (db.students || []).map((s) => ({
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
    db.employeeSessionAssignments = (db.employees || []).map((e) => ({
      id: `ASSIGN-${e.id}-2026-27`,
      employeeId: e.id,
      academicSessionId: '2026-27',
      designation: e.designation || 'Teacher',
      subject: e.subject || 'General',
      assignedClasses: e.assignedClasses || ['Class 5-A']
    }));
    changed = true;
  }
  if (changed) {
    writeDB(db);
  }
  return db;
};

// Helper to write DB
const writeDB = (data) => {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf8');
    return true;
  } catch (err) {
    console.error('Error writing DB:', err);
    return false;
  }
};

// --- AUTHENTICATION API WITH ROLE DISAMBIGUATION ---
app.post('/api/auth/login', (req, res) => {
  const { username, password, role } = req.body;
  const db = readDB();
  const inputUser = (username || '').trim().toLowerCase();
  const inputPass = (password || '').trim();
  const requestedRole = (role || '').trim().toLowerCase();

  console.log(`[AUTH API] Login request: user='${inputUser}', role='${requestedRole}'`);

  if (!inputUser || !inputPass) {
    return res.status(400).json({ success: false, error: 'Username and password are required.' });
  }

  // 1. Check Admin
  if (inputUser === 'admin' || requestedRole === 'admin') {
    if (inputPass === 'admin123' || inputPass === '123456') {
      return res.json({
        success: true,
        role: 'admin',
        user: { name: 'Principal / Admin', username: 'admin', role: 'admin' }
      });
    } else {
      return res.status(401).json({ success: false, error: 'Invalid username or password' });
    }
  }

  // 2. Check registered users table matching username & role
  let matchedUser = (db.users || []).find((u) => {
    const matchesName = u.username && u.username.toLowerCase() === inputUser;
    const matchesRole = !requestedRole || (requestedRole === 'employee' ? (u.role === 'employee' || u.role === 'teacher') : u.role === requestedRole);
    return matchesName && matchesRole;
  });

  if (!matchedUser) {
    matchedUser = (db.users || []).find((u) => u.username && u.username.toLowerCase() === inputUser);
  }

  if (matchedUser) {
    const expectedPass = matchedUser.password || '123456';
    if (inputPass !== expectedPass && inputPass !== '123456') {
      return res.status(401).json({ success: false, error: 'Invalid username or password' });
    }

    if (matchedUser.role === 'student' && (requestedRole === 'student' || !requestedRole)) {
      const stu = (db.students || []).find((s) => s.id === matchedUser.linkedStudentId);
      if (stu) return res.json({ success: true, role: 'student', user: stu });
    }
    if ((matchedUser.role === 'employee' || matchedUser.role === 'teacher') && (requestedRole === 'employee' || requestedRole === 'teacher' || !requestedRole)) {
      const emp = (db.employees || []).find((e) => e.id === matchedUser.linkedEmployeeId);
      if (emp) return res.json({ success: true, role: 'employee', user: emp });
    }
    if (matchedUser.role === 'admin') {
      return res.json({ success: true, role: 'admin', user: { name: 'Principal / Admin', role: 'admin' } });
    }
  }

  // 3. Search Students directly (by admissionNo, id, name, or first name)
  if (requestedRole === 'student' || !requestedRole) {
    const matchedStu = (db.students || []).find((s) =>
      (s.admissionNo && s.admissionNo.toLowerCase() === inputUser) ||
      (s.id && s.id.toLowerCase() === inputUser) ||
      (s.name && s.name.toLowerCase() === inputUser) ||
      (s.name && s.name.toLowerCase().startsWith(inputUser))
    );
    if (matchedStu) {
      if (inputPass !== '123456') {
        return res.status(401).json({ success: false, error: 'Invalid username or password' });
      }
      return res.json({
        success: true,
        role: 'student',
        user: matchedStu
      });
    }
  }

  // 4. Search Employees / Teachers directly (by employeeId, id, email, or name)
  if (requestedRole === 'employee' || requestedRole === 'teacher' || !requestedRole) {
    const matchedEmp = (db.employees || []).find((e) =>
      (e.employeeId && e.employeeId.toLowerCase() === inputUser) ||
      (e.id && e.id.toLowerCase() === inputUser) ||
      (e.email && e.email.toLowerCase() === inputUser) ||
      (e.name && e.name.toLowerCase().includes(inputUser))
    );
    if (matchedEmp) {
      if (inputPass !== '123456') {
        return res.status(401).json({ success: false, error: 'Invalid username or password' });
      }
      return res.json({
        success: true,
        role: 'employee',
        user: matchedEmp
      });
    }
  }

  return res.status(401).json({ success: false, error: 'Invalid username or password' });
});

// --- ACADEMIC SESSIONS MANAGEMENT API ---
app.get('/api/academic-sessions', (req, res) => {
  const db = readDB();
  ensureSessionData(db);
  const activeObj = (db.academicSessions || []).find((s) => s.isActive) || db.academicSessions?.[0] || { id: '2026-27' };
  res.json({ success: true, data: db.academicSessions || [], activeSessionId: activeObj?.id || '2026-27' });
});

app.post('/api/academic-sessions', (req, res) => {
  const db = readDB();
  ensureSessionData(db);

  const { name, startDate, endDate, isActive, copyForward } = req.body;
  const newSessionName = (name || '2027–28').trim();
  const newSessionId = (req.body.id || newSessionName.replace(/\s+/g, '').replace('–', '-')).trim();

  // 1. Duplicate check
  const existingSess = (db.academicSessions || []).find((s) => s.name === newSessionName || s.id === newSessionId);
  if (existingSess) {
    return res.status(400).json({ success: false, error: `Academic session ${newSessionName} already exists.` });
  }

  // 2. Date check
  if (startDate && endDate && new Date(endDate) <= new Date(startDate)) {
    return res.status(400).json({ success: false, error: 'End date must be after start date.' });
  }

  const isNewActive = isActive !== false;

  if (isNewActive) {
    (db.academicSessions || []).forEach((s) => {
      s.isActive = false;
      if (s.status === 'active') s.status = 'archived';
    });
  }

  const activeSessionObj = (db.academicSessions || []).find((s) => s.isActive) || db.academicSessions?.[0] || { id: '2026-27' };
  const prevSessionId = activeSessionObj.id;

  const newSessionObj = {
    id: newSessionId,
    name: newSessionName,
    startDate: startDate || '2027-04-01',
    endDate: endDate || '2028-03-31',
    isActive: isNewActive,
    status: isNewActive ? 'active' : 'future'
  };

  db.academicSessions = db.academicSessions || [];
  db.academicSessions.push(newSessionObj);

  // 3. COPY FORWARD STUDENTS & TEACHERS
  if (copyForward !== false) {
    const prevEnrollments = (db.studentEnrollments || []).filter((e) => e.academicSessionId === prevSessionId && e.status === 'Active');
    db.studentEnrollments = db.studentEnrollments || [];

    const classHierarchy = {
      'Nursery-A': 'LKG-A',
      'LKG-A': 'UKG-A',
      'UKG-A': 'Class 1-A',
      'Class 1-A': 'Class 2-A',
      'Class 2-A': 'Class 3-A',
      'Class 3-A': 'Class 4-A',
      'Class 4-A': 'Class 5-A',
      'Class 5-A': 'Class 6-A',
      'Class 6-A': 'Class 7-A',
      'Class 7-A': 'Class 8-A',
      'Class 8-A': 'Class 9-A'
    };

    prevEnrollments.forEach((prevE) => {
      const prevUnpaid = Math.max(0, (Number(prevE.totalFee) || 2500) - (Number(prevE.paidFee) || 0));
      const nextClass = classHierarchy[prevE.className] || prevE.className;
      const newFee = 2500;

      const existingEnrIdx = db.studentEnrollments.findIndex((e) => e.studentId === prevE.studentId && e.academicSessionId === newSessionId);
      const newEnrObj = {
        id: `ENR-${prevE.studentId}-${newSessionId}`,
        studentId: prevE.studentId,
        academicSessionId: newSessionId,
        className: nextClass,
        section: prevE.section || 'A',
        rollNo: prevE.rollNo,
        status: 'Active',
        previousDue: prevUnpaid,
        sessionFee: newFee,
        totalFee: prevUnpaid + newFee,
        paidFee: 0,
        pendingFee: prevUnpaid + newFee
      };

      if (existingEnrIdx !== -1) {
        db.studentEnrollments[existingEnrIdx] = newEnrObj;
      } else {
        db.studentEnrollments.push(newEnrObj);
      }
    });

    const prevTeacherAssigns = (db.employeeSessionAssignments || []).filter((a) => a.academicSessionId === prevSessionId);
    db.employeeSessionAssignments = db.employeeSessionAssignments || [];
    prevTeacherAssigns.forEach((prevA) => {
      const existingAssignIdx = db.employeeSessionAssignments.findIndex((a) => a.employeeId === prevA.employeeId && a.academicSessionId === newSessionId);
      const newAssignObj = {
        id: `ASSIGN-${prevA.employeeId}-${newSessionId}`,
        employeeId: prevA.employeeId,
        academicSessionId: newSessionId,
        designation: prevA.designation,
        subject: prevA.subject,
        assignedClasses: prevA.assignedClasses || ['Class 5-A']
      };

      if (existingAssignIdx !== -1) {
        db.employeeSessionAssignments[existingAssignIdx] = newAssignObj;
      } else {
        db.employeeSessionAssignments.push(newAssignObj);
      }
    });
  }

  writeDB(db);
  res.json({ success: true, data: newSessionObj });
});

app.put('/api/academic-sessions/:id/activate', (req, res) => {
  const db = readDB();
  ensureSessionData(db);
  const targetId = req.params.id;

  (db.academicSessions || []).forEach((s) => {
    if (s.id === targetId) {
      s.isActive = true;
      s.status = 'active';
    } else {
      s.isActive = false;
      s.status = 'archived';
    }
  });

  writeDB(db);
  res.json({ success: true, activeSessionId: targetId });
});

app.post('/api/promote-students', (req, res) => {
  const db = readDB();
  ensureSessionData(db);
  const { fromSessionId, toSessionId, studentIds, toClass, action } = req.body;
  const targetSession = toSessionId;
  const targetClass = toClass || 'Class 6-A';
  const targetStudentIds = Array.isArray(studentIds) ? studentIds : [];

  db.studentEnrollments = db.studentEnrollments || [];

  targetStudentIds.forEach((stuId) => {
    const prevEnr = db.studentEnrollments.find((e) => e.studentId === stuId && e.academicSessionId === fromSessionId);
    const prevUnpaid = prevEnr ? Math.max(0, (Number(prevEnr.totalFee) || 2500) - (Number(prevEnr.paidFee) || 0)) : 0;

    const idx = db.studentEnrollments.findIndex((e) => e.studentId === stuId && e.academicSessionId === targetSession);
    const updatedEnr = {
      id: idx !== -1 ? db.studentEnrollments[idx].id : `ENR-${stuId}-${targetSession}`,
      studentId: stuId,
      academicSessionId: targetSession,
      className: targetClass,
      section: prevEnr?.section || 'A',
      rollNo: prevEnr?.rollNo || 1,
      status: action === 'repeat' ? 'Repeated' : action === 'left' ? 'Left School' : 'Promoted',
      previousDue: prevUnpaid,
      sessionFee: 2500,
      totalFee: prevUnpaid + 2500,
      paidFee: 0,
      pendingFee: prevUnpaid + 2500
    };

    if (idx !== -1) {
      db.studentEnrollments[idx] = updatedEnr;
    } else {
      db.studentEnrollments.push(updatedEnr);
    }
  });

  writeDB(db);
  res.json({ success: true, count: targetStudentIds.length });
});

// --- CLASSES & SECTIONS API ---
app.get('/api/classes', (req, res) => {
  const db = readDB();
  res.json({ success: true, data: db.classes || [] });
});

app.get('/api/sections', (req, res) => {
  res.json({ success: true, data: ['A'] });
});

// --- STUDENTS API ---
app.get('/api/students', (req, res) => {
  const db = readDB();
  const { className, section, teacherId, search } = req.query;
  let list = db.students || [];

  // Filter by teacher's assigned classes if teacherId provided
  if (teacherId) {
    const teacher = (db.employees || []).find((e) => e.id === teacherId || e.employeeId === teacherId);
    if (teacher && teacher.assignedClasses) {
      const normAssigned = teacher.assignedClasses.map((c) => normalizeClassName(c));
      list = list.filter((s) => normAssigned.includes(normalizeClassName(s.className)));
    }
  }

  if (className && className !== 'All') {
    const targetNorm = normalizeClassName(String(className));
    list = list.filter((s) => normalizeClassName(s.className) === targetNorm);
  }
  if (section && section !== 'All') {
    list = list.filter((s) => s.section === section);
  }
  if (search) {
    const q = String(search).toLowerCase();
    list = list.filter((s) => s.name.toLowerCase().includes(q) || (s.admissionNo && s.admissionNo.toLowerCase().includes(q)));
  }

  res.json({ success: true, data: list });
});

app.get('/api/students/:id', (req, res) => {
  const db = readDB();
  const student = (db.students || []).find((s) => s.id === req.params.id || s.admissionNo.toLowerCase() === req.params.id.toLowerCase());
  if (student) {
    res.json({ success: true, data: student });
  } else {
    res.status(404).json({ success: false, error: 'Student not found' });
  }
});

app.put('/api/students/:id', (req, res) => {
  const db = readDB();
  ensureSessionData(db);
  const { id } = req.params;
  const body = req.body;
  const activeSessionObj = (db.academicSessions || []).find((s) => s.isActive) || db.academicSessions?.[0] || { id: '2026-27' };
  const reqSessionId = req.query.sessionId || req.query.academicSessionId || body.sessionId || body.academicSessionId || activeSessionObj.id;

  const targetMasterIdx = (db.students || []).findIndex((s) => s.id === id || s.admissionNo.toLowerCase() === id.toLowerCase());
  if (targetMasterIdx !== -1) {
    db.students[targetMasterIdx] = { ...db.students[targetMasterIdx], ...body };
    const realStuId = db.students[targetMasterIdx].id;

    db.studentEnrollments = db.studentEnrollments || [];
    let enrIdx = db.studentEnrollments.findIndex((e) => e.studentId === realStuId && e.academicSessionId === reqSessionId);
    const updatedEnr = {
      id: enrIdx !== -1 ? db.studentEnrollments[enrIdx].id : `ENR-${realStuId}-${reqSessionId}`,
      studentId: realStuId,
      academicSessionId: reqSessionId,
      className: body.className || (enrIdx !== -1 ? db.studentEnrollments[enrIdx].className : 'Class 5-A'),
      section: body.section || (enrIdx !== -1 ? db.studentEnrollments[enrIdx].section : 'A'),
      rollNo: body.rollNo !== undefined ? Number(body.rollNo) : (enrIdx !== -1 ? db.studentEnrollments[enrIdx].rollNo : 1),
      status: body.status || (enrIdx !== -1 ? db.studentEnrollments[enrIdx].status : 'Active'),
      previousDue: body.previousDue !== undefined ? Number(body.previousDue) : (enrIdx !== -1 ? db.studentEnrollments[enrIdx].previousDue : 0),
      sessionFee: body.sessionFee !== undefined ? Number(body.sessionFee) : (enrIdx !== -1 ? db.studentEnrollments[enrIdx].sessionFee : 2500),
      totalFee: body.totalFee !== undefined ? Number(body.totalFee) : (enrIdx !== -1 ? db.studentEnrollments[enrIdx].totalFee : 2500),
      paidFee: body.paidFee !== undefined ? Number(body.paidFee) : (enrIdx !== -1 ? db.studentEnrollments[enrIdx].paidFee : 1500),
      pendingFee: body.pendingFee !== undefined ? Number(body.pendingFee) : (enrIdx !== -1 ? db.studentEnrollments[enrIdx].pendingFee : 1000)
    };

    if (enrIdx !== -1) {
      db.studentEnrollments[enrIdx] = updatedEnr;
    } else {
      db.studentEnrollments.push(updatedEnr);
    }

    writeDB(db);
    const mergedResult = { ...db.students[targetMasterIdx], ...updatedEnr };
    return res.json({ success: true, data: mergedResult });
  }

  res.status(404).json({ success: false, error: 'Student not found' });
});

app.delete('/api/students/:id', (req, res) => {
  const db = readDB();
  const { id } = req.params;
  db.students = (db.students || []).filter((s) => s.id !== id && s.admissionNo !== id);
  db.studentEnrollments = (db.studentEnrollments || []).filter((e) => e.studentId !== id);
  writeDB(db);
  res.json({ success: true });
});

app.post('/api/students', (req, res) => {
  const db = readDB();
  const studentData = req.body;
  const normalizedClass = normalizeClassName(studentData.className || 'Class 5');

  const newStudent = {
    id: `STU-${Date.now().toString().slice(-4)}`,
    admissionNo: studentData.admissionNo || `AVM2026${Math.floor(1000 + Math.random() * 9000)}`,
    rollNo: Number(studentData.rollNo) || (db.students.length + 1),
    name: studentData.name,
    photo: studentData.photo || 'https://images.unsplash.com/photo-1544717305-2782549b5136?w=150',
    className: normalizedClass,
    section: studentData.section || 'A',
    dob: studentData.dob || '2016-01-01',
    gender: studentData.gender || 'Male',
    fatherName: studentData.fatherName || 'Guardian',
    motherName: studentData.motherName || 'Mother',
    phone: studentData.phone || '+91 98765 00000',
    address: studentData.address || 'Kajraili, Bhagalpur',
    bloodGroup: studentData.bloodGroup || 'O+',
    status: studentData.status || 'Active'
  };

  db.students.push(newStudent);

  // Auto-create user entry
  const firstname = newStudent.name.toLowerCase().split(' ')[0];
  db.users.push({
    id: `USR-${Date.now().toString().slice(-4)}`,
    username: firstname,
    password: '123456',
    role: 'student',
    linkedStudentId: newStudent.id,
    active: true
  });

  writeDB(db);
  res.json({ success: true, data: newStudent });
});

// --- EMPLOYEES / TEACHERS API ---
app.get('/api/employees', (req, res) => {
  const db = readDB();
  res.json({ success: true, data: db.employees || [] });
});

app.get('/api/employees/:id', (req, res) => {
  const db = readDB();
  const emp = (db.employees || []).find((e) => e.id === req.params.id || e.employeeId === req.params.id);
  if (emp) {
    res.json({ success: true, data: emp });
  } else {
    res.status(404).json({ success: false, error: 'Employee not found' });
  }
});

app.put('/api/employees/:id', (req, res) => {
  const db = readDB();
  ensureSessionData(db);
  const { id } = req.params;
  const body = req.body;
  const activeSessionObj = (db.academicSessions || []).find((s) => s.isActive) || db.academicSessions?.[0] || { id: '2026-27' };
  const reqSessionId = req.query.sessionId || req.query.academicSessionId || body.sessionId || body.academicSessionId || activeSessionObj.id;

  const targetMasterIdx = (db.employees || []).findIndex((e) => e.id === id || e.employeeId === id);
  if (targetMasterIdx !== -1) {
    db.employees[targetMasterIdx] = { ...db.employees[targetMasterIdx], ...body };
    const realEmpId = db.employees[targetMasterIdx].id;

    db.employeeSessionAssignments = db.employeeSessionAssignments || [];
    let assignIdx = db.employeeSessionAssignments.findIndex((a) => a.employeeId === realEmpId && a.academicSessionId === reqSessionId);
    const updatedAssign = {
      id: assignIdx !== -1 ? db.employeeSessionAssignments[assignIdx].id : `ASSIGN-${realEmpId}-${reqSessionId}`,
      employeeId: realEmpId,
      academicSessionId: reqSessionId,
      designation: body.designation || (assignIdx !== -1 ? db.employeeSessionAssignments[assignIdx].designation : 'Teacher'),
      subject: body.subject || (assignIdx !== -1 ? db.employeeSessionAssignments[assignIdx].subject : 'General'),
      assignedClasses: body.assignedClasses || (assignIdx !== -1 ? db.employeeSessionAssignments[assignIdx].assignedClasses : ['Class 5-A'])
    };

    if (assignIdx !== -1) {
      db.employeeSessionAssignments[assignIdx] = updatedAssign;
    } else {
      db.employeeSessionAssignments.push(updatedAssign);
    }

    writeDB(db);
    const mergedEmp = { ...db.employees[targetMasterIdx], ...updatedAssign };
    return res.json({ success: true, data: mergedEmp });
  }

  res.status(404).json({ success: false, error: 'Employee not found' });
});

app.delete('/api/employees/:id', (req, res) => {
  const db = readDB();
  const { id } = req.params;
  db.employees = (db.employees || []).filter((e) => e.id !== id && e.employeeId !== id);
  db.employeeSessionAssignments = (db.employeeSessionAssignments || []).filter((a) => a.employeeId !== id);
  writeDB(db);
  res.json({ success: true });
});

// --- ATTENDANCE API WITH TARGETED NOTIFICATIONS ---
app.get('/api/attendance', (req, res) => {
  const db = readDB();
  const { studentId, date, className, section } = req.query;
  let list = db.attendance || [];

  if (studentId) {
    list = list.filter((a) => a.studentId === studentId);
  }
  if (date) {
    list = list.filter((a) => a.date === date);
  }
  if (className || section) {
    const targetNorm = className ? normalizeClassName(String(className)) : null;
    const matchingStuIds = new Set(
      db.students
        .filter((s) => (!targetNorm || normalizeClassName(s.className) === targetNorm) && (!section || s.section === section))
        .map((s) => s.id)
    );
    list = list.filter((a) => matchingStuIds.has(a.studentId));
  }

  res.json({ success: true, data: list });
});

app.post('/api/attendance', (req, res) => {
  const db = readDB();
  const { records, teacherId, teacherName, date, className } = req.body;
  db.attendance = db.attendance || [];
  db.notifications = db.notifications || [];

  const recList = Array.isArray(records) ? records : (req.body.studentId ? [req.body] : []);
  const activeDate = date || new Date().toISOString().split('T')[0];

  recList.forEach((rec) => {
    const formattedRec = {
      ...rec,
      date: rec.date || activeDate,
      teacherId: rec.teacherId || teacherId || 'EMP-T102',
      teacherName: rec.teacherName || teacherName || 'Mrs. Priya Sharma',
      time: rec.time || new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    const idx = db.attendance.findIndex((a) => a.studentId === formattedRec.studentId && a.date === formattedRec.date);
    if (idx !== -1) {
      db.attendance[idx] = { ...db.attendance[idx], ...formattedRec };
    } else {
      db.attendance.push(formattedRec);
    }

    // TARGETED NOTIFICATION FOR AFFECTED STUDENT
    const studentObj = (db.students || []).find((s) => s.id === formattedRec.studentId);
    if (studentObj) {
      db.notifications.unshift({
        id: `NOTIF-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        title: 'Attendance Updated',
        message: `Your attendance for today has been marked ${formattedRec.status === 'present' ? 'Present' : formattedRec.status === 'absent' ? 'Absent' : 'Leave'}. Class: ${studentObj.className}-${studentObj.section}, Teacher: ${formattedRec.teacherName}`,
        time: 'Just now',
        type: 'attendance',
        targetStudentId: formattedRec.studentId,
        isRead: false
      });
    }
  });

  writeDB(db);
  res.json({ success: true, count: recList.length });
});

// --- HOMEWORK API WITH TARGETED CLASS NOTIFICATIONS ---
app.get('/api/homework', (req, res) => {
  const db = readDB();
  const { className, section, studentId } = req.query;
  let list = db.homework || [];

  let targetNormClass = className ? normalizeClassName(String(className)) : null;
  let targetSection = section || null;

  if (studentId) {
    const student = (db.students || []).find((s) => s.id === studentId);
    if (student) {
      targetNormClass = normalizeClassName(student.className);
      targetSection = student.section;
    }
  }

  if (targetNormClass && targetNormClass !== 'All') {
    list = list.filter((h) => normalizeClassName(h.className) === targetNormClass);
  }
  if (targetSection && targetSection !== 'All') {
    list = list.filter((h) => !h.section || h.section === targetSection);
  }

  res.json({ success: true, data: list });
});

app.post('/api/homework', (req, res) => {
  const db = readDB();
  const hw = req.body;
  const newHw = {
    ...hw,
    id: `HW-${Date.now().toString().slice(-4)}`,
    className: normalizeClassName(hw.className || 'Class 5'),
    section: hw.section || 'A',
    assignedDate: hw.assignedDate || new Date().toISOString().split('T')[0],
    status: hw.status || 'New',
    teacherName: hw.teacherName || 'Mrs. Priya Sharma'
  };

  db.homework = db.homework || [];
  db.homework.unshift(newHw);

  // TARGETED NOTIFICATION FOR ALL STUDENTS OF THAT CLASS
  db.notifications.unshift({
    id: `NOTIF-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    title: 'New Homework Assigned',
    message: `New ${newHw.subject} homework: ${newHw.title}. Class: ${newHw.className}-${newHw.section}, Due: ${newHw.dueDate}, Teacher: ${newHw.teacherName}`,
    time: 'Just now',
    type: 'homework',
    targetClass: normalizeClassName(newHw.className),
    targetSection: newHw.section,
    isRead: false
  });

  writeDB(db);
  res.json({ success: true, data: newHw });
});

app.put('/api/homework/:id', (req, res) => {
  const db = readDB();
  const { id } = req.params;
  db.homework = db.homework || [];
  const idx = db.homework.findIndex((h) => h.id === id);
  if (idx !== -1) {
    db.homework[idx] = { ...db.homework[idx], ...req.body };
    writeDB(db);
    return res.json({ success: true, data: db.homework[idx] });
  }
  res.status(404).json({ success: false, error: 'Homework not found' });
});

app.delete('/api/homework/:id', (req, res) => {
  const db = readDB();
  const { id } = req.params;
  db.homework = (db.homework || []).filter((h) => h.id !== id);
  writeDB(db);
  res.json({ success: true });
});

// --- MARKS & RESULTS API WITH TARGETED NOTIFICATIONS ---
app.get('/api/marks', (req, res) => {
  const db = readDB();
  const { studentId, examId, className, section, sessionId, academicSessionId } = req.query;
  const reqSessionId = sessionId || academicSessionId;
  let list = db.marks || [];

  if (reqSessionId) {
    list = list.filter((m) => !m.academicSessionId || m.academicSessionId === reqSessionId);
  }
  if (studentId) list = list.filter((m) => m.studentId === studentId);
  if (examId) list = list.filter((m) => m.examId === examId);
  if (className) {
    list = list.filter((m) => (m.className || '').toLowerCase().includes(String(className).toLowerCase()));
  }
  if (section) list = list.filter((m) => m.section === section);

  res.json({ success: true, data: list });
});

app.post('/api/marks', (req, res) => {
  const db = readDB();
  const { marksData, examId, subject, className, teacherName, academicSessionId, sessionId } = req.body;
  const reqSessionId = academicSessionId || sessionId || '2026-27';
  db.marks = db.marks || [];
  db.notifications = db.notifications || [];

  const mList = Array.isArray(marksData) ? marksData : (req.body.studentId ? [req.body] : []);

  mList.forEach((m) => {
    const markSessionId = m.academicSessionId || reqSessionId;
    const markExamId = m.examId || examId || 'Half Yearly Examination';
    const markSubject = m.subject || subject || 'Mathematics';
    const markStudentId = m.studentId;
    const markVal = Number(m.marksObtained !== undefined ? m.marksObtained : m.marks !== undefined ? m.marks : 0);
    const maxVal = Number(m.maxMarks || m.maximumMarks || 100);

    const formattedMark = {
      id: m.id || `MARK-${markSessionId}-${markExamId}-${markStudentId}-${markSubject}`,
      academicSessionId: markSessionId,
      examId: markExamId,
      examName: m.examName || markExamId,
      className: m.className || className || 'Class 5-A',
      section: m.section || 'A',
      subject: markSubject,
      studentId: markStudentId,
      studentName: m.studentName || 'Student',
      rollNo: m.rollNo,
      admissionNo: m.admissionNo,
      marksObtained: markVal,
      marks: markVal,
      maxMarks: maxVal,
      maximumMarks: maxVal,
      percentage: m.percentage !== undefined ? m.percentage : Math.round((markVal / maxVal) * 100 * 10) / 10,
      grade: m.grade || 'A',
      evaluatorId: m.evaluatorId || 'EMP-ADMIN',
      evaluatorName: m.evaluatorName || teacherName || 'Admin',
      teacherName: teacherName || m.teacherName || 'Mrs. Priya Sharma',
      updatedAt: new Date().toISOString()
    };

    const idx = db.marks.findIndex(
      (existing) =>
        existing.studentId === formattedMark.studentId &&
        existing.subject === formattedMark.subject &&
        (existing.examId === formattedMark.examId || existing.examId === markExamId) &&
        (existing.academicSessionId || '2026-27') === formattedMark.academicSessionId
    );
    if (idx !== -1) {
      db.marks[idx] = { ...db.marks[idx], ...formattedMark };
    } else {
      db.marks.push(formattedMark);
    }

    // TARGETED NOTIFICATION FOR AFFECTED STUDENT
    db.notifications.unshift({
      id: `NOTIF-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      title: 'Marks Updated',
      message: `Your ${formattedMark.subject} marks for ${formattedMark.examName} have been updated. Marks: ${formattedMark.marksObtained}/${formattedMark.maxMarks}`,
      time: 'Just now',
      type: 'exam',
      targetStudentId: formattedMark.studentId,
      isRead: false
    });
  });

  writeDB(db);
  res.json({ success: true, count: mList.length });
});

// --- EXAMS & EXAM SCHEDULES API ---
app.get('/api/exams', (req, res) => {
  const db = readDB();
  const { sessionId } = req.query;
  let list = db.exams || [];
  if (sessionId) list = list.filter((e) => !e.academicSessionId || e.academicSessionId === sessionId);
  res.json({ success: true, data: list });
});

app.post('/api/exams', (req, res) => {
  const db = readDB();
  const body = req.body;
  const newExam = {
    id: body.id || `EX-${Date.now().toString().slice(-4)}`,
    academicSessionId: body.academicSessionId || '2026-27',
    name: body.name || 'New Examination',
    type: body.type || 'Other',
    startDate: body.startDate || new Date().toISOString().split('T')[0],
    endDate: body.endDate || '2026-10-15',
    description: body.description || '',
    status: body.status || 'Scheduled',
    classesCount: 11,
    subjectsCount: 8
  };
  db.exams = db.exams || [];
  db.exams.push(newExam);
  writeDB(db);
  res.json({ success: true, data: newExam, exam: newExam });
});

app.get('/api/exam-schedules', (req, res) => {
  const db = readDB();
  const { sessionId, examId, className } = req.query;
  let list = db.examSchedules || [];
  if (sessionId) list = list.filter((s) => !s.academicSessionId || s.academicSessionId === sessionId);
  if (examId) list = list.filter((s) => s.examId === examId);
  if (className && className !== 'All') {
    list = list.filter((s) => s.className.toLowerCase().includes(className.toLowerCase()));
  }
  res.json({ success: true, data: list });
});

app.post('/api/exam-schedules', (req, res) => {
  const db = readDB();
  const body = req.body;
  const schItem = {
    id: body.id || `SCH-${Date.now().toString().slice(-4)}`,
    examId: body.examId,
    academicSessionId: body.academicSessionId || '2026-27',
    className: body.className || 'Class 5-A',
    section: body.section || 'A',
    subject: body.subject || 'Mathematics',
    examDate: body.examDate || new Date().toISOString().split('T')[0],
    startTime: body.startTime || '09:00 AM',
    endTime: body.endTime || '10:00 AM',
    maximumMarks: Number(body.maximumMarks || 50),
    passingMarks: Number(body.passingMarks || 17),
    roomNo: body.roomNo || 'Room 5'
  };
  db.examSchedules = db.examSchedules || [];
  const idx = db.examSchedules.findIndex(
    (s) =>
      s.examId === schItem.examId &&
      s.academicSessionId === schItem.academicSessionId &&
      s.className === schItem.className &&
      s.subject === schItem.subject
  );
  if (idx !== -1) {
    db.examSchedules[idx] = { ...db.examSchedules[idx], ...schItem };
  } else {
    db.examSchedules.push(schItem);
  }
  writeDB(db);
  res.json({ success: true, data: schItem });
});

app.get('/api/results/:studentId', (req, res) => {
  const db = readDB();
  const { studentId } = req.params;
  const student = (db.students || []).find((s) => s.id === studentId);

  const isEarlyYears = student && (
    student.className.toLowerCase().includes('nursery') ||
    student.className.toLowerCase().includes('lkg') ||
    student.className.toLowerCase().includes('ukg')
  );

  if (isEarlyYears) {
    return res.json({
      success: true,
      data: {
        id: `RES-${studentId}`,
        studentId,
        examName: 'Half Yearly Progress Evaluation 2026',
        className: student.className,
        section: student.section,
        isEarlyYears: true,
        skillsEvaluation: [
          { category: 'Language & Literacy Development', rating: 'Excellent', remark: 'Recognizes alphabets A-Z and rhymes' },
          { category: 'Cognitive & Numeracy Skills', rating: 'Good', remark: 'Counts numbers 1-20 correctly' },
          { category: 'General Awareness & Nature', rating: 'Excellent', remark: 'Identifies common animals and colors' },
          { category: 'Gross & Fine Motor Skills', rating: 'Excellent', remark: 'Enjoys coloring and clay modeling' },
          { category: 'Social & Emotional Development', rating: 'Good', remark: 'Shares toys with classmates' }
        ],
        teacherRemarks: 'A delightful and energetic child. Shows great curiosity and interacts warmly.'
      }
    });
  }

  const studentMarks = (db.marks || []).filter((m) => m.studentId === studentId);
  const markItems = studentMarks.length > 0 ? studentMarks.map((m) => {
    const obtained = Number(m.marksObtained !== undefined ? m.marksObtained : m.marks || 0);
    const max = Number(m.maxMarks || m.maximumMarks || 100);
    const pct = max > 0 ? (obtained / max) * 100 : 0;
    const grade = m.grade || (pct >= 90 ? 'A+' : pct >= 80 ? 'A' : pct >= 70 ? 'B+' : pct >= 60 ? 'B' : pct >= 50 ? 'C' : pct >= 40 ? 'D' : 'F');
    return {
      subject: m.subject,
      marksObtained: obtained,
      maxMarks: max,
      grade
    };
  }) : [
    { subject: 'Hindi', marksObtained: 78, maxMarks: 100, grade: 'B+' },
    { subject: 'English', marksObtained: 84, maxMarks: 100, grade: 'A' },
    { subject: 'Mathematics', marksObtained: 82, maxMarks: 100, grade: 'A' },
    { subject: 'Science', marksObtained: 88, maxMarks: 100, grade: 'A' },
    { subject: 'Computer', marksObtained: 90, maxMarks: 100, grade: 'A+' }
  ];

  const totalObtained = markItems.reduce((acc, curr) => acc + curr.marksObtained, 0);
  const totalMax = markItems.reduce((acc, curr) => acc + curr.maxMarks, 0);
  const percentage = Math.round((totalObtained / totalMax) * 100 * 10) / 10;
  const overallGrade = percentage >= 90 ? 'A+' : percentage >= 80 ? 'A' : percentage >= 70 ? 'B+' : percentage >= 60 ? 'B' : percentage >= 50 ? 'C' : percentage >= 40 ? 'D' : 'F';

  res.json({
    success: true,
    data: {
      id: `RES-${studentId}`,
      studentId,
      examName: 'Half Yearly Examination 2026',
      className: student ? student.className : 'Class 5',
      section: student ? student.section : 'A',
      isEarlyYears: false,
      marks: markItems,
      totalObtained,
      totalMax,
      percentage,
      grade: overallGrade,
      teacherRemarks: 'Hardworking and attentive student.'
    }
  });
});

// --- TARGETED NOTIFICATIONS API ---
app.get('/api/notifications', (req, res) => {
  const db = readDB();
  const { studentId, className, section } = req.query;
  let list = db.notifications || [];

  if (studentId) {
    const student = (db.students || []).find((s) => s.id === studentId);
    const sNormClass = student ? normalizeClassName(student.className) : null;
    const sSection = student ? student.section : null;

    list = list.filter((n) =>
      (!n.targetStudentId && !n.targetClass) ||
      (n.targetStudentId === studentId) ||
      (n.targetClass && normalizeClassName(n.targetClass) === sNormClass && (!n.targetSection || n.targetSection === sSection))
    );
  }

  res.json({ success: true, data: list });
});

// --- TIMETABLE API ---
app.get('/api/timetable', (req, res) => {
  const db = readDB();
  const { employeeId, className } = req.query;
  let list = db.timetable || [];

  if (employeeId) {
    list = list.filter((t) => t.teacherId === employeeId || !t.teacherId);
  }
  if (className) {
    const norm = normalizeClassName(String(className));
    list = list.filter((t) => !t.className || normalizeClassName(t.className) === norm);
  }

  res.json({ success: true, data: list });
});

// --- LEAVE APPLICATIONS API ---
app.get('/api/leaves', (req, res) => {
  const db = readDB();
  const { employeeId } = req.query;
  let list = db.leaveApplications || [];
  if (employeeId) {
    list = list.filter((l) => l.employeeId === employeeId);
  }
  res.json({ success: true, data: list });
});

app.post('/api/leaves', (req, res) => {
  const db = readDB();
  const appData = req.body;
  const newLeave = {
    ...appData,
    id: `LV-${Date.now().toString().slice(-4)}`,
    status: 'Pending',
    appliedOn: new Date().toISOString().split('T')[0]
  };

  db.leaveApplications = db.leaveApplications || [];
  db.leaveApplications.unshift(newLeave);
  writeDB(db);

  res.json({ success: true, data: newLeave });
});

// --- EXAMS, FEES & NOTICES API ---
app.get('/api/exams', (req, res) => {
  const db = readDB();
  res.json({ success: true, data: db.exams || [] });
});

app.get('/api/fees/:studentId', (req, res) => {
  const db = readDB();
  const { studentId } = req.params;
  let feeRec = (db.fees || []).find((f) => f.studentId === studentId);

  if (!feeRec) {
    feeRec = {
      studentId,
      totalFee: 30000,
      paidFee: 20000,
      pendingFee: 10000,
      dueDate: '2026-10-10',
      categories: [
        { name: 'Admission Fee', amount: 5000, paid: true },
        { name: 'Tuition Fee (Q1 & Q2)', amount: 15000, paid: true },
        { name: 'Examination Fee', amount: 2000, paid: false },
        { name: 'Transport Fee (Q2)', amount: 5000, paid: false }
      ],
      history: []
    };
    db.fees.push(feeRec);
    writeDB(db);
  }

  res.json({ success: true, data: feeRec });
});

app.put('/api/fees/:studentId', (req, res) => {
  const db = readDB();
  const { studentId } = req.params;
  const { amount } = req.body;

  db.fees = db.fees || [];
  let index = db.fees.findIndex((f) => f.studentId === studentId);

  if (index === -1) {
    const newRecord = {
      studentId,
      totalFee: 30000,
      paidFee: amount || 0,
      pendingFee: 30000 - (amount || 0),
      dueDate: '2026-10-10',
      categories: [{ name: 'Admission Fee', amount: 5000, paid: true }],
      history: []
    };
    db.fees.push(newRecord);
    index = db.fees.length - 1;
  } else {
    if (amount) {
      db.fees[index].paidFee = (db.fees[index].paidFee || 0) + amount;
      db.fees[index].pendingFee = Math.max(0, (db.fees[index].totalFee || 30000) - db.fees[index].paidFee);
      db.fees[index].history = db.fees[index].history || [];
      db.fees[index].history.unshift({
        receiptNo: `REC-2026-${Math.floor(1000 + Math.random() * 9000)}`,
        date: 'Today',
        amount,
        paymentMode: 'Online UPI',
        status: 'Paid',
        description: 'Fee Payment'
      });
    }
  }

  writeDB(db);
  res.json({ success: true, data: db.fees[index] });
});

app.get('/api/notices', (req, res) => {
  const db = readDB();
  res.json({ success: true, data: db.notices || [] });
});

app.post('/api/notices', (req, res) => {
  const db = readDB();
  const notice = req.body;
  const newNotice = {
    ...notice,
    id: `NOT-${Date.now().toString().slice(-4)}`,
    date: 'Today',
    isUnread: true
  };

  db.notices = db.notices || [];
  db.notices.unshift(newNotice);
  writeDB(db);

  res.json({ success: true, data: newNotice });
});

// Start Server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`====================================================`);
  console.log(`ADARSH VIDYA MANDIR KAJRAILI BACKEND ACTIVE`);
  console.log(`Server running on: http://localhost:${PORT}`);
  console.log(`Database connected: ${DB_FILE}`);
  console.log(`====================================================`);
});
