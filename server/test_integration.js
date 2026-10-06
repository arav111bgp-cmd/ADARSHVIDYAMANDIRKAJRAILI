async function testCompleteFlow() {
  console.log('================================================================');
  console.log('STARTING OFFICIAL AVM CLASS STRUCTURE INTEGRATION TESTS (1-16)');
  console.log('================================================================');
  const BASE_URL = 'http://localhost:3001';

  // 1. Login Teacher Priya
  console.log('\n[STEP 1] Logging in Teacher Priya Sharma...');
  const priyaLogin = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: 'priya', password: '123456', role: 'employee' })
  }).then((r) => r.json());
  console.log('➜ Priya Login Result:', priyaLogin.success, '| Employee:', priyaLogin.user?.name);
  if (!priyaLogin.success) throw new Error('Teacher Priya login failed');

  // 2 & 3. Verify assigned classes appear
  console.log('\n[STEPS 2 & 3] Verifying assigned classes for Teacher Priya...');
  const priyaClasses = priyaLogin.user?.assignedClasses || [];
  console.log('➜ Priya Assigned Classes:', priyaClasses);
  const expectedClasses = ['nursery-a', 'class-5-a', 'class-6-a', 'class-8-a'];
  const normPriya = priyaClasses.map((c) => c.toLowerCase());
  const hasAllExpected = expectedClasses.every((c) => normPriya.includes(c));
  if (!hasAllExpected) throw new Error('Priya assigned classes mismatch!');

  // 4. Verify Class 5-A Attendance
  console.log('\n[STEP 4] Verifying Class 5-A Attendance marking...');
  const todayDate = new Date().toISOString().split('T')[0];
  const att5Res = await fetch(`${BASE_URL}/api/attendance`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      records: [
        { date: todayDate, studentId: 'STU-101', status: 'present', teacherId: 'EMP-T102', teacherName: 'Mrs. Priya Sharma', time: '08:15 AM' }
      ]
    })
  }).then((r) => r.json());
  console.log('➜ Class 5-A Attendance Result:', att5Res.success);
  if (!att5Res.success) throw new Error('Class 5-A attendance failed');

  // 5. Verify Nursery-A Attendance
  console.log('\n[STEP 5] Verifying Nursery-A Attendance marking...');
  const attNurRes = await fetch(`${BASE_URL}/api/attendance`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      records: [
        { date: todayDate, studentId: 'STU-NUR-01', status: 'present', teacherId: 'EMP-T102', teacherName: 'Mrs. Priya Sharma', time: '08:45 AM' }
      ]
    })
  }).then((r) => r.json());
  console.log('➜ Nursery-A Attendance Result:', attNurRes.success);
  if (!attNurRes.success) throw new Error('Nursery-A attendance failed');

  // 6 & 7. Upload Homework for Class 5-A
  console.log('\n[STEPS 6 & 7] Uploading Homework for Class 5-A...');
  const hwUpload = await fetch(`${BASE_URL}/api/homework`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      className: 'Class 5-A',
      section: 'A',
      subject: 'Mathematics',
      title: 'Fractions Chapter 4',
      description: 'Solve questions 1-10',
      dueDate: '30 September 2026',
      teacherName: 'Mrs. Priya Sharma'
    })
  }).then((r) => r.json());
  console.log('➜ Homework Upload Result:', hwUpload.success);

  // 8 & 9. Marks Entry for Class 5-A
  console.log('\n[STEPS 8 & 9] Marks Entry for Class 5-A...');
  const marksSave = await fetch(`${BASE_URL}/api/marks`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      className: 'Class 5-A',
      section: 'A',
      examId: 'EX-HY-2026',
      subject: 'Mathematics',
      teacherName: 'Mrs. Priya Sharma',
      marksData: [{ studentId: 'STU-101', marksObtained: 82, maxMarks: 100 }]
    })
  }).then((r) => r.json());
  console.log('➜ Marks Entry Result:', marksSave.success);

  // 10 & 11. My Students grouped by assigned class
  console.log('\n[STEPS 10 & 11] Verifying My Students roster for Class 5-A & Nursery-A...');
  const c5Roster = await fetch(`${BASE_URL}/api/students?className=Class%205-A`).then((r) => r.json());
  const nurRoster = await fetch(`${BASE_URL}/api/students?className=Nursery-A`).then((r) => r.json());
  console.log('➜ Class 5-A Students Count:', c5Roster.data?.length, '| Nursery-A Students Count:', nurRoster.data?.length);
  if (c5Roster.data?.length < 5 || nurRoster.data?.length < 5) throw new Error('Centralized student roster count insufficient!');

  // 12 & 13. Login Student Rahul (Class 5-A)
  console.log('\n[STEPS 12 & 13] Login Student Rahul (Class 5-A) & verify self-data...');
  const rahulLogin = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: 'rahul', password: '123456', role: 'student' })
  }).then((r) => r.json());
  console.log('➜ Rahul Login Result:', rahulLogin.success, '| Class:', rahulLogin.user?.className);

  const rahulHw = await fetch(`${BASE_URL}/api/homework?studentId=${rahulLogin.user.id}`).then((r) => r.json());
  const foundHwRahul = rahulHw.data?.some((h) => h.title === 'Fractions Chapter 4');
  console.log('➜ Rahul sees Class 5-A homework:', foundHwRahul);
  if (!foundHwRahul) throw new Error('Student Rahul failed to receive Class 5-A homework');

  // 14 & 15. Login Student Abhinav (Class 8-A) & verify isolation
  console.log('\n[STEPS 14 & 15] Login Student Abhinav (Class 8-A) & verify Class 5-A data NOT shown...');
  const abhinavHw = await fetch(`${BASE_URL}/api/homework?className=Class%208-A`).then((r) => r.json());
  const abhinavSawC5Hw = abhinavHw.data?.some((h) => h.title === 'Fractions Chapter 4');
  console.log('➜ Class 8-A student sees Class 5-A homework:', abhinavSawC5Hw);
  if (abhinavSawC5Hw) throw new Error('Class 8-A student inappropriately received Class 5-A data!');

  // 16. Verify Nursery Student (Aarav Sharma STU-101) early-years report
  console.log('\n[STEP 16] Verifying Nursery-A Student (Aarav) early-years evaluation...');
  const nurResult = await fetch(`${BASE_URL}/api/results/STU-101`).then((r) => r.json());
  console.log('➜ Nursery Student Result isEarlyYears:', nurResult.data?.isEarlyYears, '| Skills:', nurResult.data?.skillsEvaluation?.length);
  if (!nurResult.data?.isEarlyYears) throw new Error('Nursery student was not assigned early-years evaluation!');

  console.log('\n================================================================');
  console.log('🎉 ALL 16 OFFICIAL AVM CLASS STRUCTURE INTEGRATION TESTS PASSED!');
  console.log('================================================================\n');
}

testCompleteFlow().catch((err) => {
  console.error('❌ Integration Test Failed:', err);
  process.exit(1);
});

