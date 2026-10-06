import React, { useState, useEffect } from 'react';
import type { UserRole, Student, Employee } from './types';
import { mockStudents, mockEmployees } from './mock/mockData';
import { Header } from './components/Header';
import { BottomNav } from './components/BottomNav';
import { LoginScreen } from './screens/LoginScreen';
import { MobileSideDrawer } from './components/MobileSideDrawer';
import { App as CapApp } from '@capacitor/app';
import { notificationService } from './services/notificationService';
import { noticeService } from './services/noticeService';
import { demoDataStore } from './services/demoDataStore';
import { accountService } from './services/accountService';

// Student Mobile Screens
import { StudentHomeScreen } from './screens/StudentHomeScreen';
import { StudentTimetableScreen } from './screens/StudentTimetableScreen';
import { StudentAttendanceScreen } from './screens/StudentAttendanceScreen';
import { StudentHomeworkScreen } from './screens/StudentHomeworkScreen';
import { StudentExamsScreen } from './screens/StudentExamsScreen';
import { StudentResultsScreen } from './screens/StudentResultsScreen';
import { StudentFeesScreen } from './screens/StudentFeesScreen';
import { StudentNoticesScreen } from './screens/StudentNoticesScreen';
import { StudentProfileScreen } from './screens/StudentProfileScreen';

// Employee Mobile Screens
import { EmployeeHomeScreen } from './screens/EmployeeHomeScreen';
import { EmployeeTakeAttendanceScreen } from './screens/EmployeeTakeAttendanceScreen';
import { EmployeeHomeworkUploadScreen } from './screens/EmployeeHomeworkUploadScreen';
import { EmployeeMarksEntryScreen } from './screens/EmployeeMarksEntryScreen';
import { EmployeeTimetableScreen } from './screens/EmployeeTimetableScreen';
import { EmployeeStudentsScreen } from './screens/EmployeeStudentsScreen';
import { EmployeeLeaveScreen } from './screens/EmployeeLeaveScreen';
import { EmployeeNoticesScreen } from './screens/EmployeeNoticesScreen';
import { EmployeeProfileScreen } from './screens/EmployeeProfileScreen';
import { EmployeeSelfAttendanceScreen } from './screens/EmployeeSelfAttendanceScreen';

import { AdminMobileDashboard } from './screens/AdminMobileDashboard';

export function App() {
  // Authentication State
  const [userRole, setUserRole] = useState<UserRole | null>(null);
  const [currentUser, setCurrentUser] = useState<Student | Employee | any>(null);

  // Dynamic Notice Unread Badge Count
  const [unreadNoticesCount, setUnreadNoticesCount] = useState<number>(0);

  // Mobile Navigation History Stack & Bottom Tabs
  const [screenHistory, setScreenHistory] = useState<string[]>(['home']);
  const [mobileTab, setMobileTab] = useState('home');

  // Side Drawer Open State
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  // Admin Active Tab State
  const [adminActiveTab, setAdminActiveTab] = useState('dashboard');

  const activeScreen = screenHistory[screenHistory.length - 1] || 'home';

  // Calculate unread notice badge count
  const fetchUnreadNoticeCount = async () => {
    if (!currentUser || !userRole || userRole === 'admin') {
      setUnreadNoticesCount(0);
      return;
    }
    const role = userRole;
    const userId = currentUser.id || (role === 'student' ? currentUser.admissionNo : currentUser.employeeId);
    const cName = currentUser.className || 'Class 5';
    const sSec = currentUser.section || 'A';
    const dept = currentUser.department || 'Academics';

    const nots = await noticeService.getNotices(role, { id: userId, className: cName, section: sSec, department: dept });
    const unreadCount = nots.filter((n) => n.isUnread).length;
    setUnreadNoticesCount(unreadCount);
  };

  useEffect(() => {
    fetchUnreadNoticeCount();
    const unsubscribe = demoDataStore.subscribe(() => {
      fetchUnreadNoticeCount();
    });
    return () => unsubscribe();
  }, [currentUser, userRole]);

  // Load persisted session on initial mount & initialize notification click listener
  useEffect(() => {
    try {
      demoDataStore.initAsync();
      const activeSession = accountService.getActiveSession();
      if (activeSession && (activeSession.role === 'student' || activeSession.role === 'employee' || activeSession.role === 'admin')) {
        setUserRole(activeSession.role);
        setCurrentUser(activeSession.user);
      }
      notificationService.init((targetScreen) => {
        navigateToScreen(targetScreen);
      });
    } catch (e) {
      console.warn('Session load error:', e);
    }
  }, []);

  // Capacitor Native Android Hardware Back Button Handler
  useEffect(() => {
    let listener: any;
    try {
      listener = CapApp.addListener('backButton', () => {
        if (isDrawerOpen) {
          setIsDrawerOpen(false);
        } else if (!userRole) {
          CapApp.exitApp();
        } else if (screenHistory.length > 1) {
          handleBack();
        } else {
          CapApp.exitApp();
        }
      });
    } catch (e) {
      console.log('Capacitor App listener not available');
    }

    return () => {
      if (listener) {
        listener.then((h: any) => h?.remove());
      }
    };
  }, [isDrawerOpen, screenHistory, userRole]);

  const handleLoginSuccess = async (role: UserRole, user: Student | Employee | any) => {
    try {
      await accountService.saveAccount(role, user);
    } catch (e) {
      console.warn('[AUTH-WARN] Could not persist session:', e);
    }
    setUserRole(role);
    setCurrentUser(user);
    setScreenHistory(['home']);
    setMobileTab('home');
    setIsDrawerOpen(false);
  };

  const handleLogout = async () => {
    await accountService.clearActiveSession();
    setUserRole(null);
    setCurrentUser(null);
    setScreenHistory(['home']);
    setMobileTab('home');
    setIsDrawerOpen(false);
  };

  const handleSwitchAccount = async (accountId: string) => {
    const res = await accountService.switchAccount(accountId);
    if (res) {
      setUserRole(res.role);
      setCurrentUser(res.user);
      setScreenHistory(['home']);
      setMobileTab('home');
      setIsDrawerOpen(false);
    }
  };

  const handleAddAccount = async () => {
    await accountService.clearActiveSession();
    setUserRole(null);
    setCurrentUser(null);
    setScreenHistory(['home']);
    setMobileTab('home');
    setIsDrawerOpen(false);
  };

  const navigateToScreen = (screenId: string) => {
    if (userRole === 'admin') {
      setAdminActiveTab(screenId);
      return;
    }
    if (activeScreen !== screenId) {
      setScreenHistory((prev) => [...prev, screenId]);
    }
  };

  const handleBack = () => {
    if (screenHistory.length > 1) {
      const nextHistory = screenHistory.slice(0, screenHistory.length - 1);
      setScreenHistory(nextHistory);

      const topScreen = nextHistory[nextHistory.length - 1];
      if (topScreen === 'home') setMobileTab('home');
      else if (topScreen === 'homework') setMobileTab('academics');
      else if (topScreen === 'employee_students') setMobileTab('classes');
      else if (topScreen === 'notices' || topScreen === 'employee_notices') setMobileTab('notifications');
      else if (topScreen === 'profile') setMobileTab('profile');
    }
  };

  const handleBottomTabChange = (tabId: string) => {
    setMobileTab(tabId);
    let targetScreen = 'home';
    if (tabId === 'home') targetScreen = 'home';
    else if (tabId === 'academics') targetScreen = 'homework';
    else if (tabId === 'classes') targetScreen = 'employee_students';
    else if (tabId === 'notifications') targetScreen = userRole === 'student' ? 'notices' : 'employee_notices';
    else if (tabId === 'profile') targetScreen = 'profile';

    if (targetScreen === 'home') {
      setScreenHistory(['home']);
    } else {
      setScreenHistory(['home', targetScreen]);
    }
  };

  const getScreenTitle = (screen: string) => {
    switch (screen) {
      case 'home':
        return 'ADARSH VIDYA MANDIR';
      case 'timetable':
      case 'employee_timetable':
        return 'Class Timetable';
      case 'attendance':
        return userRole === 'student' ? 'Attendance Record' : 'Take Class Attendance';
      case 'homework':
        return 'Homework & Assignments';
      case 'homework_upload':
        return 'Upload Homework';
      case 'exams':
      case 'admitcard':
        return 'Exams & Admit Card';
      case 'results':
        return 'Academic Results';
      case 'marks_entry':
        return 'Marks Entry';
      case 'fees':
        return 'Fee Details & Payments';
      case 'notices':
      case 'employee_notices':
        return 'School Notice Board';
      case 'employee_students':
        return 'Assigned Class Roster';
      case 'employee_leave':
        return 'Leave Applications';
      case 'profile':
        return 'My Profile';
      default:
        return 'ADARSH VIDYA MANDIR';
    }
  };

  // Render Sub-screen Content for Student
  const renderStudentScreen = () => {
    const studentData = (currentUser && (currentUser.role === 'student' || currentUser.admissionNo || currentUser.id?.startsWith('STU'))) ? (currentUser as Student) : currentUser || mockStudents[0];

    switch (activeScreen) {
      case 'timetable':
        return <StudentTimetableScreen />;
      case 'attendance':
        return <StudentAttendanceScreen student={studentData} />;
      case 'homework':
        return <StudentHomeworkScreen student={studentData} />;
      case 'exams':
      case 'admitcard':
        return <StudentExamsScreen student={studentData} />;
      case 'results':
        return <StudentResultsScreen student={studentData} />;
      case 'fees':
        return <StudentFeesScreen student={studentData} />;
      case 'notices':
        return <StudentNoticesScreen student={studentData} />;
      case 'profile':
        return <StudentProfileScreen student={studentData} onLogout={handleLogout} />;
      case 'home':
      default:
        return <StudentHomeScreen student={studentData} onNavigate={navigateToScreen} />;
    }
  };

  // Render Sub-screen Content for Employee
  const renderEmployeeScreen = () => {
    const rawEmp = (currentUser && (currentUser.role === 'employee' || currentUser.employeeId || currentUser.id?.startsWith('EMP'))) ? (currentUser as Employee) : currentUser;
    const empIdToFetch = rawEmp?.employeeId || rawEmp?.id;
    const liveEmp = empIdToFetch ? demoDataStore.getEmployeeById(empIdToFetch) : null;
    const employeeData = liveEmp ? { ...rawEmp, ...liveEmp } : (rawEmp || mockEmployees[0]);

    switch (activeScreen) {
      case 'employee_self_attendance':
      case 'my_attendance':
        return <EmployeeSelfAttendanceScreen employee={employeeData} onBack={handleBack} />;
      case 'attendance':
        return <EmployeeTakeAttendanceScreen employee={employeeData} />;
      case 'homework_upload':
        return <EmployeeHomeworkUploadScreen employee={employeeData} />;
      case 'marks_entry':
        return <EmployeeMarksEntryScreen employee={employeeData} />;
      case 'employee_timetable':
        return <EmployeeTimetableScreen employee={employeeData} />;
      case 'employee_students':
        return <EmployeeStudentsScreen employee={employeeData} />;
      case 'employee_leave':
        return <EmployeeLeaveScreen employee={employeeData} />;
      case 'employee_notices':
        return <EmployeeNoticesScreen employee={employeeData} />;
      case 'profile':
        return <EmployeeProfileScreen employee={employeeData} onLogout={handleLogout} />;
      case 'home':
      default:
        return <EmployeeHomeScreen employee={employeeData} onNavigate={navigateToScreen} />;
    }
  };

  if (!userRole) {
    return <LoginScreen onLoginSuccess={handleLoginSuccess} />;
  }

  // IF ADMIN ROLE IS LOGGED IN
  if (userRole === 'admin') {
    return (
      <div className="avm-mobile-container" style={{ minHeight: '100vh', backgroundColor: '#F8FAFC' }}>
        <AdminMobileDashboard
          onOpenDrawer={() => setIsDrawerOpen(true)}
          onLogout={handleLogout}
          onSwitchAccount={handleSwitchAccount}
          activeTab={adminActiveTab}
          onTabChange={(tab) => setAdminActiveTab(tab)}
        />
        <MobileSideDrawer
          isOpen={isDrawerOpen}
          onClose={() => setIsDrawerOpen(false)}
          userRole={userRole}
          currentUser={currentUser}
          onNavigate={navigateToScreen}
          onLogout={handleLogout}
          onSwitchAccount={handleSwitchAccount}
          onAddAccount={handleAddAccount}
        />
      </div>
    );
  }

  return (
    <div className="avm-mobile-container" style={{ minHeight: '100vh', backgroundColor: '#F8FAFC', paddingBottom: 70 }}>
      {/* Dynamic Header */}
      <Header
        title={getScreenTitle(activeScreen)}
        subtitle={activeScreen === 'home' ? (userRole === 'student' ? 'Student Mobile App' : 'Employee Mobile App') : undefined}
        showBack={screenHistory.length > 1}
        onBack={handleBack}
        unreadNotifications={unreadNoticesCount}
        onNotificationClick={() => navigateToScreen(userRole === 'student' ? 'notices' : 'employee_notices')}
        userRole={userRole}
        userName={currentUser?.name || (userRole === 'student' ? 'Aarav Kumar' : 'Mrs. Priya Sharma')}
        onOpenDrawer={() => setIsDrawerOpen(true)}
      />

      {/* Main Screen Content */}
      <main style={{ padding: activeScreen === 'home' ? '0' : '16px' }}>
        {userRole === 'student' ? renderStudentScreen() : renderEmployeeScreen()}
      </main>

      {/* Persistent Bottom Navigation */}
      <BottomNav
        role={(userRole as 'student' | 'employee') || 'student'}
        activeTab={mobileTab}
        onTabChange={handleBottomTabChange}
        unreadCount={unreadNoticesCount}
      />

      {/* Mobile Navigation Drawer */}
      <MobileSideDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        userRole={userRole}
        currentUser={currentUser}
        onNavigate={navigateToScreen}
        onLogout={handleLogout}
        onSwitchAccount={handleSwitchAccount}
        onAddAccount={handleAddAccount}
      />
    </div>
  );
}

export default App;
