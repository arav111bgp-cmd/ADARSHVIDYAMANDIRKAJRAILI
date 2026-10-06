import { demoDataStore, DemoDBStructure } from './demoDataStore';

export function handleStandaloneDemoRequest<T>(endpoint: string, options: RequestInit = {}): T {
  const db: DemoDBStructure = demoDataStore.getDB();
  const urlObj = new URL(endpoint, 'http://standalone.local');
  const path = urlObj.pathname;
  const query = urlObj.searchParams;
  const method = (options.method || 'GET').toUpperCase();

  // Active Session context
  const activeSessionObj = (db.academicSessions || []).find((s: any) => s.isActive) || db.academicSessions?.[0] || { id: '2026-27', name: '2026–27' };
  const activeSessionId = activeSessionObj.id;

  let body: any = {};
  try {
    body = typeof options.body === 'string' ? JSON.parse(options.body) : (options.body || {});
  } catch (e) {}

  const reqSessionId = query.get('sessionId') || query.get('academicSessionId') || body?.sessionId || body?.academicSessionId || activeSessionId;

  console.log(`[STANDALONE DEMO ENGINE] Intercepted ${method} ${path} (Session: ${reqSessionId})`);

  // 1. Health check
  if (path === '/api/health') {
    return { status: 'ok', mode: 'standalone-demo', activeSessionId, reqSessionId } as any;
  }

  // Auth Login Endpoint for Standalone Demo Engine
  if (path === '/api/auth/login' && method === 'POST') {
    const rawUser = (body.username || '').trim();
    const inputUser = rawUser.toLowerCase();
    const inputPass = (body.password || '').trim();
    const requestedRole = (body.role || '').trim().toLowerCase();

    // 1. Admin login check
    if (inputUser === 'admin' || requestedRole === 'admin') {
      if (inputPass === 'admin123' || inputPass === '123456') {
        return {
          success: true,
          role: 'admin',
          user: { name: 'Principal / Admin', username: 'admin', role: 'admin' }
        } as any;
      } else {
        return { success: false, error: 'Invalid username or password' } as any;
      }
    }

    const dbUsers = db.users || [];
    const dbEmployees = db.employees || [];
    const dbStudents = db.students || [];

    const normalize = (s?: string) => {
      if (!s) return '';
      return s.trim().toLowerCase().replace(/^(mr|mrs|ms|dr|miss)\.?\s+/i, '').trim();
    };

    const isStrMatch = (val?: string) => {
      if (!val) return false;
      const v = val.trim().toLowerCase();
      if (v === inputUser) return true;
      if (normalize(v) === normalize(rawUser)) return true;
      return false;
    };

    // Find candidate employees in dbEmployees by Employee ID, Name, Username, or Record ID
    const matchingEmployees = dbEmployees.filter((e: any) =>
      isStrMatch(e.employeeId) ||
      isStrMatch(e.name) ||
      isStrMatch(e.username) ||
      isStrMatch(e.id)
    );

    // Duplicate Name check if input matches multiple distinct active employees by name
    if (matchingEmployees.length > 1) {
      const activeEmps = matchingEmployees.filter((e: any) => e.status !== 'Inactive' && e.workStatus !== 'Inactive');
      const uniqueCodes = new Set(activeEmps.map((e: any) => e.employeeId || e.id));
      if (uniqueCodes.size > 1) {
        return { success: false, error: 'Multiple employees found with this name. Please use your Employee ID.' } as any;
      }
    }

    // 2. Check matched user account from dbUsers
    const matchingUsers = dbUsers.filter((u: any) =>
      isStrMatch(u.username) ||
      isStrMatch(u.id) ||
      isStrMatch(u.linkedEmployeeId)
    );

    for (const u of matchingUsers) {
      if (u.role === 'employee' || u.linkedEmployeeId) {
        if (u.active === false) {
          return { success: false, error: 'Your employee account is inactive. Please contact the school administrator.' } as any;
        }
        if (u.password === inputPass) {
          const emp = dbEmployees.find((e: any) =>
            e.id === u.linkedEmployeeId ||
            e.employeeId === u.linkedEmployeeId ||
            (e.employeeId && e.employeeId.toLowerCase() === u.linkedEmployeeId?.toLowerCase()) ||
            isStrMatch(e.employeeId) ||
            isStrMatch(e.name) ||
            isStrMatch(e.username) ||
            isStrMatch(e.id)
          ) || matchingEmployees[0];

          if (emp) {
            if (emp.status === 'Inactive' || emp.workStatus === 'Inactive') {
              return { success: false, error: 'Your employee account is inactive. Please contact the school administrator.' } as any;
            }
            return { success: true, role: 'employee', user: { ...emp, role: 'employee' } } as any;
          }
        }
      }
    }

    // 3. Direct lookup in dbEmployees if user account record wasn't matched above
    if (matchingEmployees.length > 0) {
      const emp = matchingEmployees[0];
      if (emp.status === 'Inactive' || emp.workStatus === 'Inactive') {
        return { success: false, error: 'Your employee account is inactive. Please contact the school administrator.' } as any;
      }
      const validPass = emp.password || '123456';
      if (inputPass === validPass) {
        // Sync user entry to db.users for future persistence
        const userExists = dbUsers.some((u: any) => u.linkedEmployeeId === emp.id || isStrMatch(u.username));
        if (!userExists) {
          dbUsers.push({
            id: `USR-${emp.employeeId || emp.id}`,
            username: emp.username || emp.employeeId || emp.name,
            password: validPass,
            role: 'employee',
            linkedEmployeeId: emp.id,
            active: true
          });
          db.users = dbUsers;
          demoDataStore.saveDB(db);
        }
        return { success: true, role: 'employee', user: { ...emp, role: 'employee' } } as any;
      } else {
        return { success: false, error: 'Invalid username or password' } as any;
      }
    }

    // 4. Student lookup directly in db.students
    const stuMatch = dbStudents.find(
      (s: any) =>
        isStrMatch(s.username) ||
        isStrMatch(s.admissionNo) ||
        isStrMatch(s.id) ||
        (inputUser === 'rahul' && (s.id === 'STU-157' || s.admissionNo === 'AVM2026157'))
    );

    if (stuMatch) {
      const validPass = stuMatch.password || '123456';
      if (inputPass === validPass) {
        return { success: true, role: 'student', user: { ...stuMatch, role: 'student' } } as any;
      } else {
        return { success: false, error: 'Invalid username or password' } as any;
      }
    }

    return { success: false, error: 'Invalid username or password' } as any;
  }

  // 2. Academic Sessions Management API
  if (path === '/api/academic-sessions') {
    if (method === 'POST') {
      const newSessionName = (body.name || body.id || '2027–28').trim();
      const newSessionId = (body.id || newSessionName.replace(/\s+/g, '').replace('–', '-')).trim();

      // 1. Duplicate check
      const existingSess = (db.academicSessions || []).find((s: any) => s.name === newSessionName || s.id === newSessionId);
      if (existingSess) {
        return { success: false, error: `Academic session ${newSessionName} already exists.` } as any;
      }

      // 2. Date check
      if (body.startDate && body.endDate && new Date(body.endDate) <= new Date(body.startDate)) {
        return { success: false, error: 'End date must be after start date.' } as any;
      }

      const isNewActive = body.isActive !== false;

      if (isNewActive) {
        (db.academicSessions || []).forEach((s: any) => {
          s.isActive = false;
          if (s.status === 'active') s.status = 'archived';
        });
      }

      const newSessionObj = {
        id: newSessionId,
        name: newSessionName,
        startDate: body.startDate || '2027-04-01',
        endDate: body.endDate || '2028-03-31',
        isActive: isNewActive,
        status: (isNewActive ? 'active' : 'future') as 'active' | 'archived' | 'future'
      };

      db.academicSessions = db.academicSessions || [];
      db.academicSessions.push(newSessionObj);

      // COPY FORWARD & PROMOTE STUDENTS
      if (body.copyForward !== false) {
        const prevSessionId = activeSessionId;
        const prevEnrollments = (db.studentEnrollments || []).filter((e: any) => e.academicSessionId === prevSessionId && e.status === 'Active');

        db.studentEnrollments = db.studentEnrollments || [];

        const classHierarchy: Record<string, string> = {
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

        prevEnrollments.forEach((prevE: any) => {
          const prevUnpaid = Math.max(0, (Number(prevE.totalFee) || 2500) - (Number(prevE.paidFee) || 0));
          const nextClass = classHierarchy[prevE.className] || prevE.className;
          const newFee = 2500;

          const existingEnrIdx = db.studentEnrollments.findIndex((e: any) => e.studentId === prevE.studentId && e.academicSessionId === newSessionId);
          const newEnrObj = {
            id: `ENR-${prevE.studentId}-${newSessionId}`,
            studentId: prevE.studentId,
            academicSessionId: newSessionId,
            className: nextClass,
            section: prevE.section || 'A',
            rollNo: prevE.rollNo,
            status: 'Active' as const,
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

        // COPY TEACHER ASSIGNMENTS
        const prevTeacherAssigns = (db.employeeSessionAssignments || []).filter((a: any) => a.academicSessionId === prevSessionId);
        db.employeeSessionAssignments = db.employeeSessionAssignments || [];
        prevTeacherAssigns.forEach((prevA: any) => {
          const existingAssignIdx = db.employeeSessionAssignments.findIndex((a: any) => a.employeeId === prevA.employeeId && a.academicSessionId === newSessionId);
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

      // Log Activity
      db.activityLog = db.activityLog || [];
      db.activityLog.unshift({
        id: `ACT-${Date.now()}`,
        title: 'New Session Created',
        subtitle: `${newSessionName} (Copy Forward complete)`,
        time: 'Just now',
        type: 'session'
      });

      demoDataStore.saveDB(db);
      return { success: true, data: newSessionObj } as any;
    }

    return { success: true, data: db.academicSessions || [], activeSessionId } as any;
  }

  if (path.startsWith('/api/academic-sessions/') && path.endsWith('/activate')) {
    const targetId = path.replace('/api/academic-sessions/', '').replace('/activate', '');
    (db.academicSessions || []).forEach((s: any) => {
      if (s.id === targetId) {
        s.isActive = true;
        s.status = 'active';
      } else {
        s.isActive = false;
        s.status = 'archived';
      }
    });
    demoDataStore.saveDB(db);
    return { success: true, activeSessionId: targetId } as any;
  }

  if (path === '/api/promote-students' && method === 'POST') {
    const { fromSessionId, toSessionId, studentIds, toClass, action } = body;
    const targetSession = toSessionId || reqSessionId;
    const targetClass = toClass || 'Class 6-A';
    const targetStudentIds = Array.isArray(studentIds) ? studentIds : [];

    db.studentEnrollments = db.studentEnrollments || [];

    targetStudentIds.forEach((stuId: string) => {
      const prevEnr = db.studentEnrollments.find((e: any) => e.studentId === stuId && e.academicSessionId === fromSessionId);
      const prevUnpaid = prevEnr ? Math.max(0, (Number(prevEnr.totalFee) || 2500) - (Number(prevEnr.paidFee) || 0)) : 0;

      const idx = db.studentEnrollments.findIndex((e: any) => e.studentId === stuId && e.academicSessionId === targetSession);
      const updatedEnr = {
        id: idx !== -1 ? db.studentEnrollments[idx].id : `ENR-${stuId}-${targetSession}`,
        studentId: stuId,
        academicSessionId: targetSession,
        className: targetClass,
        section: prevEnr?.section || 'A',
        rollNo: prevEnr?.rollNo || 1,
        status: (action === 'repeat' ? 'Repeated' : action === 'left' ? 'Left School' : 'Promoted') as any,
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

    demoDataStore.saveDB(db);
    return { success: true, count: targetStudentIds.length } as any;
  }

  // 3. Classes & Sections
  if (path === '/api/classes') {
    return { success: true, data: db.classes } as any;
  }
  if (path === '/api/sections') {
    return { success: true, data: db.sections } as any;
  }

  // 4. Students API (Session Aware)
  if (path === '/api/students') {
    if (method === 'POST') {
      const targetSession = body.sessionId || body.academicSessionId || reqSessionId;
      const stuId = body.id || `STU-${Date.now().toString().slice(-4)}`;
      const admNo = body.admissionNo || `AVM2026${Math.floor(1000 + Math.random() * 9000)}`;

      const masterStudent = {
        id: stuId,
        admissionNo: admNo,
        name: body.name || 'New Student',
        photo: body.photo || 'https://images.unsplash.com/photo-1544717305-2782549b5136?w=150',
        dob: body.dob || '2018-01-01',
        gender: body.gender || 'Male',
        fatherName: body.fatherName || 'Guardian',
        motherName: body.motherName || 'Mother',
        phone: body.phone || '+91 98765 00000',
        address: body.address || 'Kajraili, Bhagalpur',
        bloodGroup: body.bloodGroup || 'O+',
        status: 'Active'
      };

      const existingMasterIdx = db.students.findIndex((s: any) => s.id === stuId || s.admissionNo === admNo);
      if (existingMasterIdx !== -1) {
        db.students[existingMasterIdx] = { ...db.students[existingMasterIdx], ...masterStudent };
      } else {
        db.students.push(masterStudent);
      }

      // Create Session Enrollment
      db.studentEnrollments = db.studentEnrollments || [];
      const enrollmentObj = {
        id: `ENR-${stuId}-${targetSession}`,
        studentId: stuId,
        academicSessionId: targetSession,
        className: body.className || 'Class 5-A',
        section: body.section || 'A',
        rollNo: Number(body.rollNo || 1),
        status: 'Active' as any,
        previousDue: Number(body.previousDue || 0),
        sessionFee: Number(body.sessionFee || 2500),
        totalFee: Number(body.totalFee || 2500),
        paidFee: Number(body.paidFee || 0),
        pendingFee: Number(body.pendingFee || 2500)
      };

      const existingEnrIdx = db.studentEnrollments.findIndex((e: any) => e.studentId === stuId && e.academicSessionId === targetSession);
      if (existingEnrIdx !== -1) {
        db.studentEnrollments[existingEnrIdx] = enrollmentObj;
      } else {
        db.studentEnrollments.push(enrollmentObj);
      }

      // User account credentials
      db.users = db.users || [];
      if (!db.users.some((u: any) => u.username.toLowerCase() === admNo.toLowerCase())) {
        db.users.push({
          id: `USR-${stuId}`,
          username: admNo,
          password: body.password || '123456',
          role: 'student',
          linkedStudentId: stuId,
          active: true
        });
      }

      // Log Activity
      db.activityLog = db.activityLog || [];
      db.activityLog.unshift({
        id: `ACT-${Date.now()}`,
        title: 'New student added',
        subtitle: `${masterStudent.name} (${enrollmentObj.className})`,
        time: 'Just now',
        type: 'student'
      });

      demoDataStore.saveDB(db);
      const mergedNewStu = { ...masterStudent, ...enrollmentObj };
      return { success: true, data: mergedNewStu, student: mergedNewStu } as any;
    }

    // GET Students (Merged with Enrollment for reqSessionId)
    let list = (db.students || []).map((s: any) => {
      const enr = (db.studentEnrollments || []).find((e: any) => e.studentId === s.id && e.academicSessionId === reqSessionId);
      return {
        ...s,
        className: enr ? enr.className : (s.className || 'Class 5-A'),
        section: enr ? enr.section : (s.section || 'A'),
        rollNo: enr ? enr.rollNo : (s.rollNo || 1),
        status: enr ? enr.status : (s.status || 'Active'),
        previousDue: enr ? enr.previousDue : 0,
        sessionFee: enr ? enr.sessionFee : 2500,
        totalFee: enr ? enr.totalFee : 2500,
        paidFee: enr ? enr.paidFee : 1500,
        pendingFee: enr ? enr.pendingFee : 1000,
        academicSessionId: reqSessionId
      };
    });

    const className = query.get('className');
    const search = query.get('search');
    if (className && className !== 'All') {
      list = list.filter((s: any) => s.className?.toLowerCase().includes(className.toLowerCase()));
    }
    if (search) {
      const q = search.toLowerCase();
      list = list.filter((s: any) => s.name.toLowerCase().includes(q) || s.admissionNo?.toLowerCase().includes(q));
    }
    return { success: true, data: list } as any;
  }

  if (path.startsWith('/api/students/')) {
    const studentId = path.replace('/api/students/', '');
    if (method === 'DELETE') {
      db.students = (db.students || []).filter((s: any) => s.id !== studentId && s.admissionNo !== studentId);
      db.studentEnrollments = (db.studentEnrollments || []).filter((e: any) => e.studentId !== studentId);
      demoDataStore.saveDB(db);
      return { success: true } as any;
    }
    if (method === 'PUT') {
      const targetMasterIdx = (db.students || []).findIndex((s: any) => s.id === studentId || s.admissionNo === studentId);
      if (targetMasterIdx !== -1) {
        db.students[targetMasterIdx] = { ...db.students[targetMasterIdx], ...body };
        const realStuId = db.students[targetMasterIdx].id;

        // Session Isolated Enrollment Update
        db.studentEnrollments = db.studentEnrollments || [];
        let enrIdx = db.studentEnrollments.findIndex((e: any) => e.studentId === realStuId && e.academicSessionId === reqSessionId);
        const updatedEnr = {
          id: enrIdx !== -1 ? db.studentEnrollments[enrIdx].id : `ENR-${realStuId}-${reqSessionId}`,
          studentId: realStuId,
          academicSessionId: reqSessionId,
          className: body.className || (enrIdx !== -1 ? db.studentEnrollments[enrIdx].className : 'Class 5-A'),
          section: body.section || (enrIdx !== -1 ? db.studentEnrollments[enrIdx].section : 'A'),
          rollNo: body.rollNo !== undefined ? Number(body.rollNo) : (enrIdx !== -1 ? db.studentEnrollments[enrIdx].rollNo : 1),
          status: (body.status || (enrIdx !== -1 ? db.studentEnrollments[enrIdx].status : 'Active')) as any,
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

        demoDataStore.saveDB(db);
        const mergedResult = { ...db.students[targetMasterIdx], ...updatedEnr };
        return { success: true, data: mergedResult } as any;
      }
    }

    const masterStu = (db.students || []).find((s: any) => s.id === studentId || s.admissionNo.toLowerCase() === studentId.toLowerCase()) || db.students[0];
    const enrObj = (db.studentEnrollments || []).find((e: any) => e.studentId === masterStu.id && e.academicSessionId === reqSessionId);
    const mergedStu = { ...masterStu, ...enrObj, academicSessionId: reqSessionId };
    return { success: true, data: mergedStu } as any;
  }

  // 5. Employees API (Session Aware)
  if (path === '/api/employees') {
    if (method === 'POST') {
      const targetSession = body.sessionId || body.academicSessionId || reqSessionId;
      const empId = body.id || `EMP-${Date.now().toString().slice(-4)}`;
      const empCode = body.employeeId || `T${Math.floor(100 + Math.random() * 900)}`;

      const masterEmp = {
        ...body,
        id: empId,
        employeeId: empCode,
        name: body.name || 'New Staff Member',
        photo: body.photo || 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150',
        phone: body.phone || '+91 98123 00000',
        email: body.email || 'staff@avmkajraili.edu.in',
        joinDate: body.joinDate || new Date().toISOString().split('T')[0]
      };

      const existingMasterIdx = db.employees.findIndex((e: any) => e.id === empId || e.employeeId === empCode);
      if (existingMasterIdx !== -1) {
        db.employees[existingMasterIdx] = { ...db.employees[existingMasterIdx], ...masterEmp };
      } else {
        db.employees.unshift(masterEmp);
      }

      // Create Session Assignment
      db.employeeSessionAssignments = db.employeeSessionAssignments || [];
      const assignObj = {
        id: `ASSIGN-${empId}-${targetSession}`,
        employeeId: empId,
        academicSessionId: targetSession,
        designation: body.designation || 'Teacher',
        subject: body.subject || 'General',
        assignedClasses: body.assignedClasses || ['Class 5-A']
      };

      const existingAssignIdx = db.employeeSessionAssignments.findIndex((a: any) => a.employeeId === empId && a.academicSessionId === targetSession);
      if (existingAssignIdx !== -1) {
        db.employeeSessionAssignments[existingAssignIdx] = assignObj;
      } else {
        db.employeeSessionAssignments.push(assignObj);
      }

      // Credentials Sync
      db.users = db.users || [];
      const uname = (body.username || empCode || '').trim();
      const pass = body.password || '123456';
      const userIdx = db.users.findIndex((u: any) => u.linkedEmployeeId === empId || u.username?.toLowerCase() === uname.toLowerCase());
      const userEntry = {
        id: userIdx !== -1 ? db.users[userIdx].id : `USR-${empId}`,
        username: uname,
        password: pass,
        role: 'employee',
        linkedEmployeeId: empId,
        active: body.status !== 'Inactive' && body.workStatus !== 'Inactive'
      };
      if (userIdx !== -1) {
        db.users[userIdx] = userEntry;
      } else {
        db.users.push(userEntry);
      }

      // Log Activity
      db.activityLog = db.activityLog || [];
      db.activityLog.unshift({
        id: `ACT-${Date.now()}`,
        title: 'Staff registered',
        subtitle: `${masterEmp.name} (${assignObj.subject})`,
        time: 'Just now',
        type: 'employee'
      });

      demoDataStore.saveDB(db);
      const mergedEmp = { ...masterEmp, ...assignObj };
      return { success: true, data: mergedEmp, employee: mergedEmp } as any;
    }

    // GET Employees (Merged for reqSessionId)
    let list = (db.employees || []).map((e: any) => {
      const assign = (db.employeeSessionAssignments || []).find((a: any) => a.employeeId === e.id && a.academicSessionId === reqSessionId);
      return {
        ...e,
        designation: assign ? assign.designation : (e.designation || 'Teacher'),
        subject: assign ? assign.subject : (e.subject || 'General'),
        assignedClasses: assign ? assign.assignedClasses : (e.assignedClasses || ['Class 5-A']),
        academicSessionId: reqSessionId
      };
    });

    return { success: true, data: list } as any;
  }

  if (path.startsWith('/api/employees/')) {
    const empId = path.replace('/api/employees/', '');
    if (method === 'DELETE') {
      db.employees = (db.employees || []).filter((e: any) => e.id !== empId && e.employeeId !== empId);
      db.employeeSessionAssignments = (db.employeeSessionAssignments || []).filter((a: any) => a.employeeId !== empId);
      db.users = (db.users || []).filter((u: any) => u.linkedEmployeeId !== empId);
      demoDataStore.saveDB(db);
      return { success: true } as any;
    }
    if (method === 'PUT') {
      const targetMasterIdx = (db.employees || []).findIndex((e: any) => e.id === empId || e.employeeId === empId);
      if (targetMasterIdx !== -1) {
        db.employees[targetMasterIdx] = { ...db.employees[targetMasterIdx], ...body };
        const realEmpId = db.employees[targetMasterIdx].id;

        db.employeeSessionAssignments = db.employeeSessionAssignments || [];
        let assignIdx = db.employeeSessionAssignments.findIndex((a: any) => a.employeeId === realEmpId && a.academicSessionId === reqSessionId);
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

        // Credentials Sync
        db.users = db.users || [];
        const uname = (body.username || db.employees[targetMasterIdx].employeeId || realEmpId).trim();
        const pass = body.password || db.employees[targetMasterIdx].password || '123456';
        const userIdx = db.users.findIndex((u: any) => u.linkedEmployeeId === realEmpId || u.username?.toLowerCase() === uname.toLowerCase());
        const userEntry = {
          id: userIdx !== -1 ? db.users[userIdx].id : `USR-${realEmpId}`,
          username: uname,
          password: pass,
          role: 'employee',
          linkedEmployeeId: realEmpId,
          active: body.status !== 'Inactive' && body.workStatus !== 'Inactive'
        };
        if (userIdx !== -1) {
          db.users[userIdx] = userEntry;
        } else {
          db.users.push(userEntry);
        }

        demoDataStore.saveDB(db);
        const mergedEmp = { ...db.employees[targetMasterIdx], ...updatedAssign };
        return { success: true, data: mergedEmp } as any;
      }
    }

    const masterEmp = (db.employees || []).find((e: any) => e.id === empId || e.employeeId === empId) || db.employees[0];
    const assignObj = (db.employeeSessionAssignments || []).find((a: any) => a.employeeId === masterEmp.id && a.academicSessionId === reqSessionId);
    const mergedEmp = { ...masterEmp, ...assignObj, academicSessionId: reqSessionId };
    return { success: true, data: mergedEmp } as any;
  }

  // 6. Attendance API (Session Aware)
  if (path === '/api/attendance') {
    if (method === 'POST') {
      db.attendance = db.attendance || [];
      db.notifications = db.notifications || [];

      const recList = Array.isArray(body.records) ? body.records : (body.studentId ? [body] : []);
      const activeDate = body.date || new Date().toISOString().split('T')[0];

      recList.forEach((rec: any) => {
        const formattedRec = {
          id: rec.id || `ATT-${Date.now()}-${Math.floor(Math.random()*1000)}`,
          academicSessionId: rec.academicSessionId || body.academicSessionId || reqSessionId,
          date: rec.date || activeDate,
          studentId: rec.studentId,
          status: (rec.status || 'present').toLowerCase(),
          teacherId: rec.teacherId || 'EMP-T101',
          teacherName: rec.teacherName || 'Mrs. Priya Sharma',
          time: rec.time || new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };

        const idx = db.attendance.findIndex((a: any) => a.studentId === formattedRec.studentId && a.date === formattedRec.date && a.academicSessionId === formattedRec.academicSessionId);
        if (idx !== -1) {
          db.attendance[idx] = { ...db.attendance[idx], ...formattedRec };
        } else {
          db.attendance.push(formattedRec);
        }

        db.notifications.unshift({
          id: `NOTIF-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
          title: 'Attendance Updated',
          message: `Your attendance for ${formattedRec.date} has been marked ${formattedRec.status === 'present' ? 'Present' : formattedRec.status === 'absent' ? 'Absent' : 'Leave'}. Marked by ${formattedRec.teacherName}`,
          time: 'Just now',
          type: 'attendance',
          targetStudentId: formattedRec.studentId,
          isRead: false
        });
      });

      db.activityLog = db.activityLog || [];
      db.activityLog.unshift({
        id: `ACT-${Date.now()}`,
        title: 'Attendance updated',
        subtitle: `${body.className || 'Class 5-A'} (${recList.length} students)`,
        time: 'Just now',
        type: 'attendance'
      });

      demoDataStore.saveDB(db);
      return { success: true, count: recList.length } as any;
    }

    let list = (db.attendance || []).filter((a: any) => !a.academicSessionId || a.academicSessionId === reqSessionId);
    const studentId = query.get('studentId');
    const date = query.get('date');
    const className = query.get('className');
    if (studentId) {
      list = list.filter((a: any) => a.studentId === studentId);
    }
    if (date) {
      list = list.filter((a: any) => a.date === date);
    }
    if (className && className !== 'All') {
      const matchStuIds = new Set(
        (db.students || [])
          .filter((s: any) => {
            const enr = (db.studentEnrollments || []).find((e: any) => e.studentId === s.id && e.academicSessionId === reqSessionId);
            const cName = enr ? enr.className : s.className;
            return cName?.toLowerCase().includes(className.toLowerCase());
          })
          .map((s: any) => s.id)
      );
      list = list.filter((a: any) => matchStuIds.has(a.studentId));
    }
    return { success: true, data: list } as any;
  }

  // 7. Homework API (Session Aware)
  if (path === '/api/homework') {
    if (method === 'POST') {
      const newHw = {
        id: `HW-${Date.now().toString().slice(-4)}`,
        academicSessionId: body.academicSessionId || reqSessionId,
        className: body.className || 'Class 5-A',
        section: body.section || 'A',
        subject: body.subject || 'Mathematics',
        title: body.title || 'Assignment',
        description: body.description || '',
        assignedDate: body.assignedDate || new Date().toISOString().split('T')[0],
        dueDate: body.dueDate || '2026-09-30',
        teacherName: body.teacherName || 'Mrs. Priya Sharma',
        attachmentUrl: body.attachmentUrl,
        status: 'New'
      };

      db.homework = db.homework || [];
      db.homework.unshift(newHw);

      db.notifications = db.notifications || [];
      db.notifications.unshift({
        id: `NOTIF-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        title: 'New Homework Assigned',
        message: `New ${newHw.subject} homework: ${newHw.title}. Class: ${newHw.className}, Due: ${newHw.dueDate}`,
        time: 'Just now',
        type: 'homework',
        targetClass: newHw.className,
        isRead: false
      });

      db.activityLog = db.activityLog || [];
      db.activityLog.unshift({
        id: `ACT-${Date.now()}`,
        title: 'Homework published',
        subtitle: `${newHw.className} - ${newHw.subject}`,
        time: 'Just now',
        type: 'homework'
      });

      demoDataStore.saveDB(db);
      return { success: true, data: newHw } as any;
    }

    let list = (db.homework || []).filter((h: any) => !h.academicSessionId || h.academicSessionId === reqSessionId);
    const className = query.get('className');
    const studentId = query.get('studentId');
    if (studentId) {
      const enr = (db.studentEnrollments || []).find((e: any) => e.studentId === studentId && e.academicSessionId === reqSessionId);
      const stuClass = enr ? enr.className : db.students.find((s: any) => s.id === studentId)?.className;
      if (stuClass) {
        list = list.filter((h: any) => h.className?.toLowerCase().includes(stuClass.toLowerCase()));
      }
    } else if (className && className !== 'All') {
      list = list.filter((h: any) => h.className?.toLowerCase().includes(className.toLowerCase()));
    }
    return { success: true, data: list } as any;
  }

  if (path.startsWith('/api/homework/')) {
    const hwId = path.replace('/api/homework/', '');
    if (method === 'DELETE') {
      db.homework = (db.homework || []).filter((h: any) => h.id !== hwId);
      demoDataStore.saveDB(db);
      return { success: true } as any;
    }
    if (method === 'PUT') {
      db.homework = db.homework || [];
      const idx = db.homework.findIndex((h: any) => h.id === hwId);
      if (idx !== -1) {
        db.homework[idx] = { ...db.homework[idx], ...body };
        demoDataStore.saveDB(db);
        return { success: true, data: db.homework[idx] } as any;
      }
      return { success: false, error: 'Homework not found' } as any;
    }
  }

  // 8. Marks & Results API (Session Aware)
  if (path === '/api/marks') {
    if (method === 'POST') {
      db.marks = db.marks || [];
      db.notifications = db.notifications || [];

      const mList = Array.isArray(body.marksData) ? body.marksData : (body.studentId ? [body] : []);
      const examId = body.examId || 'Half Yearly Examination';
      const subject = body.subject || 'Mathematics';

      mList.forEach((m: any) => {
        const markSessionId = m.academicSessionId || body.academicSessionId || reqSessionId;
        const markExamId = m.examId || examId;
        const markSubject = m.subject || subject;
        const markStudentId = m.studentId;
        const markVal = Number(m.marksObtained !== undefined ? m.marksObtained : m.marks !== undefined ? m.marks : 0);
        const maxVal = Number(m.maxMarks || m.maximumMarks || 100);

        const formattedMark = {
          id: m.id || `MARK-${markSessionId}-${markExamId}-${markStudentId}-${markSubject}`,
          academicSessionId: markSessionId,
          examId: markExamId,
          examName: m.examName || markExamId,
          className: m.className || body.className || 'Class 5-A',
          section: m.section || body.section || 'A',
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
          evaluatorName: m.evaluatorName || body.teacherName || 'Admin',
          teacherName: body.teacherName || m.teacherName || 'Mrs. Priya Sharma',
          updatedAt: new Date().toISOString()
        };

        const idx = db.marks.findIndex(
          (existing: any) =>
            existing.studentId === formattedMark.studentId &&
            existing.subject === formattedMark.subject &&
            (existing.examId === formattedMark.examId || existing.examId === markExamId) &&
            (existing.academicSessionId || reqSessionId) === formattedMark.academicSessionId
        );
        if (idx !== -1) {
          db.marks[idx] = { ...db.marks[idx], ...formattedMark };
        } else {
          db.marks.push(formattedMark);
        }

        db.notifications.unshift({
          id: `NOTIF-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
          title: 'Marks Updated',
          message: `Your ${formattedMark.subject} marks for ${formattedMark.examName} have been updated to ${formattedMark.marksObtained}/${formattedMark.maxMarks}.`,
          time: 'Just now',
          type: 'exam',
          targetStudentId: formattedMark.studentId,
          isRead: false
        });
      });

      db.activityLog = db.activityLog || [];
      db.activityLog.unshift({
        id: `ACT-${Date.now()}`,
        title: 'Marks updated',
        subtitle: `${body.className || 'Class 5-A'} - ${subject}`,
        time: 'Just now',
        type: 'marks'
      });

      demoDataStore.saveDB(db);
      return { success: true, count: mList.length } as any;
    }

    let list = (db.marks || []).filter((m: any) => !m.academicSessionId || m.academicSessionId === reqSessionId);
    const studentId = query.get('studentId');
    const className = query.get('className');
    const examId = query.get('examId');
    if (studentId) list = list.filter((m: any) => m.studentId === studentId);
    if (examId) list = list.filter((m: any) => m.examId === examId);
    if (className) list = list.filter((m: any) => (m.className || '').toLowerCase().includes(className.toLowerCase()));
    return { success: true, data: list } as any;
  }

  if (path.startsWith('/api/results/')) {
    const studentId = path.replace('/api/results/', '');
    const masterStu = (db.students || []).find((s: any) => s.id === studentId || s.admissionNo.toLowerCase() === studentId.toLowerCase()) || db.students[0];
    const enrObj = (db.studentEnrollments || []).find((e: any) => e.studentId === masterStu.id && e.academicSessionId === reqSessionId);
    
    const studentMarks = (db.marks || []).filter((m: any) => (m.studentId === masterStu.id || m.studentId === studentId) && (!m.academicSessionId || m.academicSessionId === reqSessionId));
    const markItems = studentMarks.length > 0 ? studentMarks.map((m: any) => {
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

    const totalObtained = markItems.reduce((acc: number, curr: any) => acc + curr.marksObtained, 0);
    const totalMax = markItems.reduce((acc: number, curr: any) => acc + curr.maxMarks, 0);
    const percentage = Math.round((totalObtained / totalMax) * 100 * 10) / 10;
    const overallGrade = percentage >= 90 ? 'A+' : percentage >= 80 ? 'A' : percentage >= 70 ? 'B+' : percentage >= 60 ? 'B' : percentage >= 50 ? 'C' : percentage >= 40 ? 'D' : 'F';

    const currentSessionName = (db.academicSessions || []).find((s: any) => s.id === reqSessionId)?.name || reqSessionId;

    return {
      success: true,
      data: {
        id: `RES-${masterStu.id}-${reqSessionId}`,
        studentId: masterStu.id,
        examName: `Annual Examination ${currentSessionName}`,
        className: enrObj ? enrObj.className : masterStu.className,
        section: enrObj ? enrObj.section : masterStu.section,
        academicSessionId: reqSessionId,
        sessionName: currentSessionName,
        isEarlyYears: false,
        marks: markItems,
        totalObtained,
        totalMax,
        percentage,
        grade: overallGrade,
        teacherRemarks: 'Hardworking and focused student.'
      }
    } as any;
  }

  // 9. Notices API (Session Aware & Audience Filtered)
  if (path === '/api/notices') {
    if (method === 'POST') {
      const nowStr = new Date().toISOString();
      const newNotice = {
        id: body.id || `NOT-${Date.now().toString().slice(-4)}`,
        academicSessionId: body.academicSessionId || reqSessionId,
        title: body.title || 'Notice Announcement',
        type: body.type || body.category || 'General',
        category: body.type || body.category || 'General',
        description: body.description || body.content || '',
        recipients: body.recipients || 'both',
        targetType: body.targetType || 'all',
        targetClass: body.targetClass || 'All',
        targetSection: body.targetSection || 'All',
        targetDepartment: body.targetDepartment || 'All',
        attachmentName: body.attachmentName,
        attachmentUrl: body.attachmentUrl,
        status: body.status || 'Published',
        publishDate: body.publishDate || body.date || new Date().toISOString().split('T')[0],
        publishTime: body.publishTime || '10:30 AM',
        scheduledDate: body.scheduledDate,
        scheduledTime: body.scheduledTime,
        createdAt: nowStr,
        readBy: body.readBy || {}
      };

      db.notices = db.notices || [];
      db.notices.unshift(newNotice);

      // Create notification log item if published
      if (newNotice.status === 'Published') {
        db.notifications = db.notifications || [];
        db.notifications.unshift({
          id: `NOTIF-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
          title: `Notice: ${newNotice.title}`,
          message: newNotice.description,
          time: 'Just now',
          type: 'notice',
          isRead: false
        });

        db.activityLog = db.activityLog || [];
        db.activityLog.unshift({
          id: `ACT-${Date.now()}`,
          title: 'Notice published',
          subtitle: `${newNotice.title} (${newNotice.recipients})`,
          time: 'Just now',
          type: 'notice'
        });
      }

      demoDataStore.saveDB(db);
      return { success: true, data: newNotice, notice: newNotice } as any;
    }

    // GET /api/notices
    const role = query.get('role')?.toLowerCase();
    const userId = query.get('userId');
    const className = query.get('className');
    const section = query.get('section');
    const department = query.get('department');

    let list = db.notices || [];

    if (role === 'student') {
      list = list.filter((n: any) => {
        // Only active published notices
        if (n.status !== 'Published') return false;
        // Recipient filter
        if (n.recipients !== 'students' && n.recipients !== 'both') return false;

        // Class filter
        if (n.targetClass && n.targetClass !== 'All' && className) {
          const reqClassClean = className.toLowerCase().trim();
          const targetClassClean = n.targetClass.toLowerCase().trim();
          if (!reqClassClean.includes(targetClassClean) && !targetClassClean.includes(reqClassClean)) {
            return false;
          }
        }
        // Section filter
        if (n.targetSection && n.targetSection !== 'All' && section) {
          if (n.targetSection.toLowerCase().trim() !== section.toLowerCase().trim()) {
            return false;
          }
        }

        return true;
      }).map((n: any) => ({
        ...n,
        isUnread: userId ? !(n.readBy && n.readBy[userId]) : true
      }));
    } else if (role === 'employee') {
      list = list.filter((n: any) => {
        // Only active published notices
        if (n.status !== 'Published') return false;
        // Recipient filter
        if (n.recipients !== 'employees' && n.recipients !== 'both') return false;

        // Department filter
        if (n.targetDepartment && n.targetDepartment !== 'All' && department) {
          if (!n.targetDepartment.toLowerCase().includes(department.toLowerCase().trim())) {
            return false;
          }
        }

        return true;
      }).map((n: any) => ({
        ...n,
        isUnread: userId ? !(n.readBy && n.readBy[userId]) : true
      }));
    }

    return { success: true, data: list } as any;
  }

  if (path.startsWith('/api/notices/')) {
    const subPath = path.replace('/api/notices/', '');
    if (subPath.endsWith('/read') && method === 'POST') {
      const noticeId = subPath.replace('/read', '');
      const readerId = body.userId;
      db.notices = db.notices || [];
      const nIdx = db.notices.findIndex((n: any) => n.id === noticeId);
      if (nIdx !== -1) {
        db.notices[nIdx].readBy = db.notices[nIdx].readBy || {};
        if (readerId && !db.notices[nIdx].readBy[readerId]) {
          db.notices[nIdx].readBy[readerId] = new Date().toISOString();
          demoDataStore.saveDB(db);
        }
        return { success: true, data: db.notices[nIdx] } as any;
      }
      return { success: false, error: 'Notice not found' } as any;
    }

    const notId = subPath;
    if (method === 'DELETE') {
      db.notices = (db.notices || []).filter((n: any) => n.id !== notId);
      demoDataStore.saveDB(db);
      return { success: true } as any;
    }

    if (method === 'PUT') {
      db.notices = db.notices || [];
      const nIdx = db.notices.findIndex((n: any) => n.id === notId);
      if (nIdx !== -1) {
        db.notices[nIdx] = { ...db.notices[nIdx], ...body, updatedAt: new Date().toISOString() };
        demoDataStore.saveDB(db);
        return { success: true, data: db.notices[nIdx] } as any;
      }
      return { success: false, error: 'Notice not found' } as any;
    }
  }

  // 10. Notifications API
  if (path === '/api/notifications') {
    const studentId = query.get('studentId');
    let list = db.notifications || [];
    if (studentId) {
      const enr = (db.studentEnrollments || []).find((e: any) => e.studentId === studentId && e.academicSessionId === reqSessionId);
      const stuClass = enr ? enr.className : db.students.find((s: any) => s.id === studentId)?.className;
      list = list.filter((n: any) =>
        !n.targetStudentId ||
        n.targetStudentId === studentId ||
        (n.targetClass && stuClass && n.targetClass.toLowerCase().includes(stuClass.toLowerCase()))
      );
    }
    return { success: true, data: list } as any;
  }

  // 11. Timetable (Session Aware)
  if (path === '/api/timetable') {
    if (method === 'POST') {
      const ttObj = {
        ...body,
        academicSessionId: body.academicSessionId || reqSessionId
      };
      db.timetable = db.timetable || [];
      db.timetable.push(ttObj);
      demoDataStore.saveDB(db);
      return { success: true, data: ttObj } as any;
    }
    let list = (db.timetable || []).filter((t: any) => !t.academicSessionId || t.academicSessionId === reqSessionId);
    return { success: true, data: list } as any;
  }

  // 12. Fees API (Session Aware + Multi-Session History)
  if (path === '/api/fees') {
    if (method === 'POST') {
      const feeItem = {
        id: body.id || `FEE-${Date.now().toString().slice(-4)}`,
        academicSessionId: body.academicSessionId || reqSessionId,
        studentId: body.studentId || 'STU-157',
        title: body.title || 'Tuition Fee',
        amount: Number(body.amount || body.totalFee || 2500),
        totalFee: Number(body.totalFee || body.amount || 2500),
        paidFee: Number(body.paidFee || 0),
        pendingFee: Number(body.pendingFee || body.amount || 2500),
        dueDate: body.dueDate || '2026-10-10',
        status: body.status || 'Pending'
      };
      db.fees = db.fees || [];
      db.fees.unshift(feeItem);

      db.activityLog = db.activityLog || [];
      db.activityLog.unshift({
        id: `ACT-${Date.now()}`,
        title: 'Fee structure updated',
        subtitle: `Student ID: ${feeItem.studentId}`,
        time: 'Just now',
        type: 'fee'
      });

      demoDataStore.saveDB(db);
      return { success: true, data: feeItem } as any;
    }
    let list = (db.fees || []).filter((f: any) => !f.academicSessionId || f.academicSessionId === reqSessionId);
    return { success: true, data: list } as any;
  }

  if (path.startsWith('/api/fees/')) {
    const studentId = path.replace('/api/fees/', '');
    if (method === 'PUT') {
      db.fees = db.fees || [];
      const idx = db.fees.findIndex((f: any) => f.studentId === studentId && (f.academicSessionId || reqSessionId) === reqSessionId);
      const updatedAmount = Number(body.amount || body.totalFee || 2500);
      const updatedPaid = Number(body.paidFee !== undefined ? body.paidFee : (idx !== -1 ? db.fees[idx].paidFee : 0));
      const updatedPending = Number(body.pendingFee !== undefined ? body.pendingFee : (updatedAmount - updatedPaid));

      const updatedFeeObj = {
        id: idx !== -1 ? db.fees[idx].id : `FEE-${Date.now().toString().slice(-4)}`,
        academicSessionId: reqSessionId,
        studentId,
        title: body.title || (idx !== -1 ? db.fees[idx].title : 'School Fee'),
        amount: updatedAmount,
        totalFee: updatedAmount,
        paidFee: updatedPaid,
        pendingFee: Math.max(0, updatedPending),
        dueDate: body.dueDate || '2026-10-10',
        status: updatedPending <= 0 ? 'Paid' : 'Pending'
      };

      if (idx !== -1) {
        db.fees[idx] = updatedFeeObj;
      } else {
        db.fees.unshift(updatedFeeObj);
      }

      // Also update student enrollment fee breakdown for current session
      const enrIdx = (db.studentEnrollments || []).findIndex((e: any) => e.studentId === studentId && e.academicSessionId === reqSessionId);
      if (enrIdx !== -1) {
        db.studentEnrollments[enrIdx].paidFee = updatedPaid;
        db.studentEnrollments[enrIdx].pendingFee = Math.max(0, updatedPending);
      }

      db.activityLog = db.activityLog || [];
      db.activityLog.unshift({
        id: `ACT-${Date.now()}`,
        title: 'Fee payment updated',
        subtitle: `Fee for ${studentId}: ₹${updatedPaid} paid`,
        time: 'Just now',
        type: 'fee'
      });

      demoDataStore.saveDB(db);
      return { success: true, data: updatedFeeObj, receiptNo: `REC-2026-${Math.floor(1000 + Math.random() * 9000)}` } as any;
    }

    // GET Student Fee Details (Includes Multi-Session Fee History!)
    const masterStu = (db.students || []).find((s: any) => s.id === studentId || s.admissionNo.toLowerCase() === studentId.toLowerCase()) || db.students[0];
    const currentEnr = (db.studentEnrollments || []).find((e: any) => e.studentId === masterStu.id && e.academicSessionId === reqSessionId);
    
    const allEnrollments = (db.studentEnrollments || []).filter((e: any) => e.studentId === masterStu.id);
    const feeHistory = allEnrollments.map((e: any) => {
      const sessObj = (db.academicSessions || []).find((s: any) => s.id === e.academicSessionId) || { name: e.academicSessionId };
      return {
        academicSessionId: e.academicSessionId,
        sessionName: sessObj.name || e.academicSessionId,
        className: e.className,
        previousDue: e.previousDue || 0,
        sessionFee: e.sessionFee || 2500,
        totalFee: e.totalFee || 2500,
        paidFee: e.paidFee || 0,
        pendingFee: e.pendingFee || 0,
        status: e.pendingFee <= 0 ? 'Paid' : 'Pending'
      };
    });

    const activeFee = currentEnr ? {
      totalFee: currentEnr.totalFee,
      paidFee: currentEnr.paidFee,
      pendingFee: currentEnr.pendingFee,
      previousDue: currentEnr.previousDue,
      dueDate: '2026-10-10'
    } : { totalFee: 2500, paidFee: 1500, pendingFee: 1000, previousDue: 0, dueDate: '2026-10-10' };

    return {
      success: true,
      data: {
        studentId: masterStu.id,
        totalFee: activeFee.totalFee,
        paidFee: activeFee.paidFee,
        pendingFee: activeFee.pendingFee,
        previousDue: activeFee.previousDue,
        dueDate: activeFee.dueDate,
        categories: [
          { name: 'Previous Session Outstanding Due', amount: activeFee.previousDue, paid: activeFee.previousDue === 0 },
          { name: 'Current Session Fee', amount: activeFee.totalFee - activeFee.previousDue, paid: activeFee.pendingFee === 0 }
        ],
        history: feeHistory
      }
    } as any;
  }

  // 13. Activities Log
  if (path === '/api/activities') {
    return { success: true, data: db.activityLog || [] } as any;
  }

  // 14. Exams & Exam Schedules API (Session Aware)
  if (path === '/api/exams') {
    if (method === 'POST') {
      const newExam = {
        id: body.id || `EX-${Date.now().toString().slice(-4)}`,
        academicSessionId: body.academicSessionId || reqSessionId,
        name: body.name || 'New Examination',
        type: body.type || 'Other',
        startDate: body.startDate || new Date().toISOString().split('T')[0],
        endDate: body.endDate || '2026-10-15',
        description: body.description || '',
        status: body.status || 'Scheduled',
        classesCount: body.classesCount || 11,
        subjectsCount: body.subjectsCount || 8
      };
      db.exams = db.exams || [];
      db.exams.push(newExam);
      demoDataStore.saveDB(db);
      return { success: true, data: newExam, exam: newExam } as any;
    }
    const list = (db.exams || []).filter((e: any) => !e.academicSessionId || e.academicSessionId === reqSessionId);
    return { success: true, data: list } as any;
  }

  if (path === '/api/exam-schedules') {
    if (method === 'POST') {
      const schItem = {
        id: body.id || `SCH-${Date.now().toString().slice(-4)}`,
        examId: body.examId,
        academicSessionId: body.academicSessionId || reqSessionId,
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
        (s: any) =>
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
      demoDataStore.saveDB(db);
      return { success: true, data: schItem } as any;
    }

    let list = (db.examSchedules || []).filter((s: any) => !s.academicSessionId || s.academicSessionId === reqSessionId);
    const examId = query.get('examId');
    const className = query.get('className');
    if (examId) list = list.filter((s: any) => s.examId === examId);
    if (className && className !== 'All') {
      list = list.filter((s: any) => s.className?.toLowerCase().includes(className.toLowerCase()));
    }
    return { success: true, data: list } as any;
  }

  // 15. Employee Leaves API
  if (path === '/api/leaves') {
    if (method === 'POST') {
      const newLeave = {
        id: body.id || `LV-${Date.now().toString().slice(-4)}`,
        employeeId: body.employeeId || 'T101',
        employeeName: body.employeeName || 'Priya Sharma',
        fromDate: body.fromDate || new Date().toISOString().split('T')[0],
        toDate: body.toDate || new Date().toISOString().split('T')[0],
        reason: body.reason || '',
        status: body.status || 'Pending',
        appliedOn: body.appliedOn || new Date().toISOString().split('T')[0]
      };
      db.leaveApplications = db.leaveApplications || [];
      db.leaveApplications.unshift(newLeave);
      demoDataStore.saveDB(db);
      return { success: true, data: newLeave, id: newLeave.id } as any;
    }
    const empId = query.get('employeeId');
    let list = db.leaveApplications || [];
    if (empId) {
      list = list.filter((l: any) => l.employeeId === empId || l.employeeId === `EMP-${empId}` || empId.includes(l.employeeId));
    }
    return { success: true, data: list } as any;
  }

  if (path.startsWith('/api/leaves/')) {
    const leaveId = path.replace('/api/leaves/', '');
    if (method === 'PUT') {
      db.leaveApplications = db.leaveApplications || [];
      const idx = db.leaveApplications.findIndex((l: any) => l.id === leaveId);
      if (idx !== -1) {
        db.leaveApplications[idx] = { ...db.leaveApplications[idx], ...body };
        demoDataStore.saveDB(db);
        return { success: true, data: db.leaveApplications[idx] } as any;
      }
    }
  }

  // 16. Employee Payments API
  if (path === '/api/employee-payments') {
    if (method === 'POST') {
      const pmtRecord = {
        id: body.id || `PAY-${Date.now().toString().slice(-4)}`,
        employeeId: body.employeeId || 'EMP-T101',
        employeeName: body.employeeName || 'Priya Sharma',
        paymentMonth: body.paymentMonth || 'October 2026',
        salaryAmount: Number(body.salaryAmount || body.salary || 25000),
        paidAmount: Number(body.paidAmount || 25000),
        pendingAmount: Number(body.pendingAmount || 0),
        paymentDate: body.paymentDate || new Date().toISOString().split('T')[0],
        paymentMode: body.paymentMode || 'Bank Transfer',
        remarks: body.remarks || 'Salary Disbursement',
        status: body.status || 'Paid'
      };
      db.employeePayments = db.employeePayments || [];
      db.employeePayments.unshift(pmtRecord);
      demoDataStore.saveDB(db);
      return { success: true, data: pmtRecord } as any;
    }
    const empId = query.get('employeeId');
    let list = db.employeePayments || [];
    if (empId) {
      list = list.filter((p: any) => p.employeeId === empId || p.employeeId === `EMP-${empId}` || empId.includes(p.employeeId));
    }
    return { success: true, data: list } as any;
  }

  // Default fallback for any other GET endpoint
  return { success: true, data: [] } as any;
}
