import React, { useState, useEffect } from 'react';
import {
  employeeAttendanceService,
  formatMinutes,
  getCurrentTime12Hour
} from '../services/employeeAttendanceService';
import { EmployeeAttendanceRecord, EmployeeAttendanceSettings, demoDataStore } from '../services/demoDataStore';
import {
  Users,
  UserCheck,
  Clock,
  MapPin,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Calendar,
  Search,
  Filter,
  Settings,
  RefreshCw,
  Plus,
  Eye,
  Check,
  Building,
  ShieldCheck,
  Coffee
} from 'lucide-react';

export const AdminEmployeeAttendanceModule: React.FC = () => {
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [selectedDepartment, setSelectedDepartment] = useState<string>('All');
  const [selectedStatus, setSelectedStatus] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const [attendanceRecords, setAttendanceRecords] = useState<EmployeeAttendanceRecord[]>([]);
  const [employeesMaster, setEmployeesMaster] = useState<any[]>([]);
  const [settings, setSettings] = useState<EmployeeAttendanceSettings>(() =>
    employeeAttendanceService.getSettings()
  );

  // Modals
  const [showSettingsModal, setShowSettingsModal] = useState<boolean>(false);
  const [historyModalEmployee, setHistoryModalEmployee] = useState<any | null>(null);
  const [manualCheckInEmployee, setManualCheckInEmployee] = useState<any | null>(null);
  const [manualCheckInTime, setManualCheckInTime] = useState<string>('08:30 AM');
  const [manualCheckOutTime, setManualCheckOutTime] = useState<string>('02:00 PM');
  const [manualStatus, setManualStatus] = useState<'Present' | 'Late' | 'Absent' | 'On Leave'>('Present');

  // Settings form
  const [tempLat, setTempLat] = useState<number>(settings.schoolLatitude || 26.9124);
  const [tempLng, setTempLng] = useState<number>(settings.schoolLongitude || 75.7873);
  const [tempRadius, setTempRadius] = useState<number>(settings.attendanceRadius || 50);
  const [tempStartTime, setTempStartTime] = useState<string>(settings.schoolStartTime || '09:00 AM');
  const [tempLateTime, setTempLateTime] = useState<string>(settings.lateThresholdTime || '09:30 AM');
  const [tempBreakEnabled, setTempBreakEnabled] = useState<boolean>(settings.breakFeatureEnabled ?? true);

  const [toastMsg, setToastMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const loadData = () => {
    try {
      const db = demoDataStore.getDB();
      const emps = db.employees || [];
      setEmployeesMaster(emps);

      const currentSettings = employeeAttendanceService.getSettings();
      setSettings(currentSettings);
      setTempLat(currentSettings.schoolLatitude || 26.9124);
      setTempLng(currentSettings.schoolLongitude || 75.7873);
      setTempRadius(currentSettings.attendanceRadius || 50);
      setTempStartTime(currentSettings.schoolStartTime || '09:00 AM');
      setTempLateTime(currentSettings.lateThresholdTime || '09:30 AM');
      setTempBreakEnabled(currentSettings.breakFeatureEnabled ?? true);

      const records = employeeAttendanceService.getRecords(undefined, selectedDate);
      setAttendanceRecords(records);
    } catch (e) {
      console.warn('Error loading Admin Employee Attendance:', e);
    }
  };

  useEffect(() => {
    loadData();
    const unsubscribe = demoDataStore.subscribe(() => {
      loadData();
    });
    return () => unsubscribe();
  }, [selectedDate]);

  // Combine Employee Master + Today's Attendance Records
  const combinedList = employeesMaster.map((emp) => {
    const empId = emp.employeeId || emp.id || '';
    const empName = emp.name || '';
    const record = attendanceRecords.find(
      (r) => r.employeeId === empId || (r.employeeName && r.employeeName.toLowerCase().includes(empName.toLowerCase()))
    );

    return {
      employee: emp,
      empId,
      name: empName,
      designation: emp.designation || 'Teacher',
      department: emp.department || 'Academics',
      photo: emp.photo || 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150',
      record,
      checkInTime: record?.checkInTime || null,
      checkOutTime: record?.checkOutTime || null,
      workingMinutes: record?.workingMinutes || 0,
      status: record?.status || 'Not Checked In',
      locationVerified: record?.locationVerified ?? false,
      distanceFromSchool: record?.distanceFromSchool || null
    };
  });

  // Filtered List
  const filteredList = combinedList.filter((item) => {
    if (selectedDepartment !== 'All' && item.department !== selectedDepartment) return false;
    if (selectedStatus !== 'All' && item.status !== selectedStatus) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = item.name.toLowerCase().includes(q);
      const matchId = item.empId.toLowerCase().includes(q);
      if (!matchName && !matchId) return false;
    }
    return true;
  });

  // Overall Statistics Calculation
  const totalEmployees = combinedList.length;
  const presentCount = combinedList.filter((i) => i.status === 'Present').length;
  const lateCount = combinedList.filter((i) => i.status === 'Late').length;
  const absentCount = combinedList.filter((i) => i.status === 'Absent').length;
  const leaveCount = combinedList.filter((i) => i.status === 'On Leave').length;
  const notCheckedInCount = combinedList.filter((i) => i.status === 'Not Checked In').length;

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    employeeAttendanceService.updateSettings({
      schoolLatitude: tempLat,
      schoolLongitude: tempLng,
      attendanceRadius: tempRadius,
      schoolStartTime: tempStartTime,
      lateThresholdTime: tempLateTime,
      breakFeatureEnabled: tempBreakEnabled
    });
    setToastMsg({ type: 'success', text: 'Employee Attendance settings updated successfully!' });
    setShowSettingsModal(false);
    loadData();
  };

  const handleSaveManualCheckIn = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualCheckInEmployee) return;

    const emp = manualCheckInEmployee.employee;
    const empId = emp.employeeId || emp.id || 'EMP-001';
    const empName = emp.name || 'Employee';

    demoDataStore.saveEmployeeAttendanceRecord({
      id: `EMP-ATT-MANUAL-${selectedDate.replace(/-/g, '')}-${empId}`,
      employeeId: empId,
      employeeName: empName,
      designation: emp.designation || 'Teacher',
      department: emp.department || 'Academics',
      date: selectedDate,
      checkInTime: manualCheckInTime,
      checkOutTime: manualCheckOutTime,
      workingMinutes: 330,
      status: manualStatus,
      latitude: settings.schoolLatitude,
      longitude: settings.schoolLongitude,
      distanceFromSchool: 0,
      locationVerified: true,
      createdAt: `${selectedDate} ${manualCheckInTime}`
    });

    setToastMsg({ type: 'success', text: `Attendance updated manually for ${empName}` });
    setManualCheckInEmployee(null);
    loadData();
  };

  return (
    <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Page Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div
              style={{
                width: 44,
                height: 44,
                borderRadius: 14,
                background: 'linear-gradient(135deg, #1769E0 0%, #104EB0 100%)',
                color: '#FFFFFF',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <UserCheck size={24} />
            </div>
            <div>
              <h1 style={{ fontSize: 22, fontWeight: 800, color: '#0F172A', margin: 0, lineHeight: 1.2 }}>
                Employee Attendance Management
              </h1>
              <p style={{ fontSize: 13, color: '#64748B', margin: '3px 0 0 0' }}>
                Monitor staff check-ins, check-outs, geofence radius verification, and working duration
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={() => setShowSettingsModal(true)}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            padding: '10px 18px',
            borderRadius: 12,
            backgroundColor: '#1769E0',
            color: '#FFFFFF',
            border: 'none',
            fontSize: 13,
            fontWeight: 700,
            cursor: 'pointer',
            boxShadow: '0 4px 14px rgba(23,105,224,0.3)'
          }}
        >
          <Settings size={16} />
          <span>Attendance Settings</span>
        </button>
      </div>

      {/* Toast Notification */}
      {toastMsg && (
        <div
          style={{
            padding: '12px 16px',
            borderRadius: 12,
            backgroundColor: toastMsg.type === 'success' ? '#F0FDF4' : '#FEF2F2',
            color: toastMsg.type === 'success' ? '#15803D' : '#991B1B',
            border: `1px solid ${toastMsg.type === 'success' ? '#BBF7D0' : '#FECACA'}`,
            fontSize: 13,
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}
        >
          <span>{toastMsg.text}</span>
          <button
            onClick={() => setToastMsg(null)}
            style={{ border: 'none', background: 'none', cursor: 'pointer', fontWeight: 800, color: 'inherit' }}
          >
            ✕
          </button>
        </div>
      )}

      {/* SUMMARY STATS GRID */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 14 }}>
        <div style={{ padding: 16, borderRadius: 16, backgroundColor: '#FFFFFF', border: '1px solid #E2E8F0', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
          <div style={{ fontSize: 11, color: '#64748B', fontWeight: 700, textTransform: 'uppercase' }}>Total Staff</div>
          <div style={{ fontSize: 24, fontWeight: 800, color: '#0F172A', marginTop: 4 }}>{totalEmployees}</div>
          <div style={{ fontSize: 11, color: '#94A3B8', marginTop: 2 }}>Registered Master</div>
        </div>

        <div style={{ padding: 16, borderRadius: 16, backgroundColor: '#F0FDF4', border: '1px solid #BBF7D0' }}>
          <div style={{ fontSize: 11, color: '#166534', fontWeight: 700, textTransform: 'uppercase' }}>Present</div>
          <div style={{ fontSize: 24, fontWeight: 800, color: '#15803D', marginTop: 4 }}>{presentCount}</div>
          <div style={{ fontSize: 11, color: '#166534', marginTop: 2 }}>On Time</div>
        </div>

        <div style={{ padding: 16, borderRadius: 16, backgroundColor: '#FEF3C7', border: '1px solid #FDE68A' }}>
          <div style={{ fontSize: 11, color: '#92400E', fontWeight: 700, textTransform: 'uppercase' }}>Late Arrival</div>
          <div style={{ fontSize: 24, fontWeight: 800, color: '#B45309', marginTop: 4 }}>{lateCount}</div>
          <div style={{ fontSize: 11, color: '#92400E', marginTop: 2 }}>After {settings.lateThresholdTime || '09:30 AM'}</div>
        </div>

        <div style={{ padding: 16, borderRadius: 16, backgroundColor: '#FEE2E2', border: '1px solid #FCA5A5' }}>
          <div style={{ fontSize: 11, color: '#991B1B', fontWeight: 700, textTransform: 'uppercase' }}>Absent</div>
          <div style={{ fontSize: 24, fontWeight: 800, color: '#B91C1C', marginTop: 4 }}>{absentCount}</div>
          <div style={{ fontSize: 11, color: '#991B1B', marginTop: 2 }}>Unexcused</div>
        </div>

        <div style={{ padding: 16, borderRadius: 16, backgroundColor: '#F3E8FF', border: '1px solid #E9D5FF' }}>
          <div style={{ fontSize: 11, color: '#6B21A8', fontWeight: 700, textTransform: 'uppercase' }}>On Leave</div>
          <div style={{ fontSize: 24, fontWeight: 800, color: '#7E22CE', marginTop: 4 }}>{leaveCount}</div>
          <div style={{ fontSize: 11, color: '#6B21A8', marginTop: 2 }}>Approved Leave</div>
        </div>

        <div style={{ padding: 16, borderRadius: 16, backgroundColor: '#F1F5F9', border: '1px solid #CBD5E1' }}>
          <div style={{ fontSize: 11, color: '#475569', fontWeight: 700, textTransform: 'uppercase' }}>Not Checked In</div>
          <div style={{ fontSize: 24, fontWeight: 800, color: '#334155', marginTop: 4 }}>{notCheckedInCount}</div>
          <div style={{ fontSize: 11, color: '#64748B', marginTop: 2 }}>Pending Check-In</div>
        </div>
      </div>

      {/* FILTER & SEARCH TOOLBAR */}
      <div
        style={{
          padding: 16,
          backgroundColor: '#FFFFFF',
          borderRadius: 16,
          border: '1px solid #E2E8F0',
          display: 'flex',
          gap: 12,
          alignItems: 'center',
          flexWrap: 'wrap'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Calendar size={16} color="#64748B" />
          <span style={{ fontSize: 13, fontWeight: 700, color: '#334155' }}>Date:</span>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            style={{
              padding: '8px 12px',
              borderRadius: 10,
              border: '1px solid #CBD5E1',
              fontSize: 13,
              fontWeight: 600,
              outline: 'none'
            }}
          />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Building size={16} color="#64748B" />
          <span style={{ fontSize: 13, fontWeight: 700, color: '#334155' }}>Department:</span>
          <select
            value={selectedDepartment}
            onChange={(e) => setSelectedDepartment(e.target.value)}
            style={{
              padding: '8px 12px',
              borderRadius: 10,
              border: '1px solid #CBD5E1',
              fontSize: 13,
              fontWeight: 600,
              backgroundColor: '#FFFFFF'
            }}
          >
            <option value="All">All Departments</option>
            <option value="Academics">Academics</option>
            <option value="Administration">Administration</option>
            <option value="Sports">Sports</option>
            <option value="Science">Science</option>
          </select>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Filter size={16} color="#64748B" />
          <span style={{ fontSize: 13, fontWeight: 700, color: '#334155' }}>Status:</span>
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            style={{
              padding: '8px 12px',
              borderRadius: 10,
              border: '1px solid #CBD5E1',
              fontSize: 13,
              fontWeight: 600,
              backgroundColor: '#FFFFFF'
            }}
          >
            <option value="All">All Statuses</option>
            <option value="Present">Present</option>
            <option value="Late">Late</option>
            <option value="Absent">Absent</option>
            <option value="On Leave">On Leave</option>
            <option value="Not Checked In">Not Checked In</option>
          </select>
        </div>

        <div style={{ flex: 1, minWidth: 200, position: 'relative' }}>
          <Search size={16} color="#94A3B8" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)' }} />
          <input
            type="text"
            placeholder="Search employee by name or ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: '100%',
              padding: '8px 12px 8px 36px',
              borderRadius: 10,
              border: '1px solid #CBD5E1',
              fontSize: 13,
              outline: 'none'
            }}
          />
        </div>
      </div>

      {/* EMPLOYEE ATTENDANCE TABLE */}
      <div
        style={{
          backgroundColor: '#FFFFFF',
          borderRadius: 16,
          border: '1px solid #E2E8F0',
          boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
          overflow: 'hidden'
        }}
      >
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ backgroundColor: '#F8FAFC', borderBottom: '1px solid #E2E8F0' }}>
              <th style={{ padding: '14px 16px', fontSize: 12, fontWeight: 700, color: '#475569' }}>Employee ID</th>
              <th style={{ padding: '14px 16px', fontSize: 12, fontWeight: 700, color: '#475569' }}>Employee Name</th>
              <th style={{ padding: '14px 16px', fontSize: 12, fontWeight: 700, color: '#475569' }}>Designation / Dept</th>
              <th style={{ padding: '14px 16px', fontSize: 12, fontWeight: 700, color: '#475569' }}>Check-In</th>
              <th style={{ padding: '14px 16px', fontSize: 12, fontWeight: 700, color: '#475569' }}>Check-Out</th>
              <th style={{ padding: '14px 16px', fontSize: 12, fontWeight: 700, color: '#475569' }}>Working Duration</th>
              <th style={{ padding: '14px 16px', fontSize: 12, fontWeight: 700, color: '#475569' }}>Status</th>
              <th style={{ padding: '14px 16px', fontSize: 12, fontWeight: 700, color: '#475569' }}>Location Verification</th>
              <th style={{ padding: '14px 16px', fontSize: 12, fontWeight: 700, color: '#475569', textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredList.length === 0 ? (
              <tr>
                <td colSpan={9} style={{ padding: 40, textAlign: 'center', color: '#94A3B8' }}>
                  <Users size={36} style={{ opacity: 0.5, marginBottom: 8 }} />
                  <p style={{ fontSize: 14, margin: 0, fontWeight: 600 }}>No employee attendance records match your filter criteria.</p>
                </td>
              </tr>
            ) : (
              filteredList.map((item) => {
                const isPresent = item.status === 'Present';
                const isLate = item.status === 'Late';
                const isLeave = item.status === 'On Leave';
                const isAbsent = item.status === 'Absent';

                const badgeBg = isPresent
                  ? '#DCFCE7'
                  : isLate
                  ? '#FEF3C7'
                  : isLeave
                  ? '#F3E8FF'
                  : isAbsent
                  ? '#FEE2E2'
                  : '#F1F5F9';
                const badgeColor = isPresent
                  ? '#15803D'
                  : isLate
                  ? '#B45309'
                  : isLeave
                  ? '#7E22CE'
                  : isAbsent
                  ? '#B91C1C'
                  : '#475569';

                return (
                  <tr key={item.empId} style={{ borderBottom: '1px solid #F1F5F9' }}>
                    <td style={{ padding: '14px 16px', fontSize: 13, fontWeight: 800, color: '#0F172A' }}>
                      {item.empId}
                    </td>

                    <td style={{ padding: '14px 16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <img
                          src={item.photo}
                          alt={item.name}
                          style={{ width: 34, height: 34, borderRadius: '50%', objectFit: 'cover' }}
                        />
                        <span style={{ fontSize: 13, fontWeight: 700, color: '#0F172A' }}>{item.name}</span>
                      </div>
                    </td>

                    <td style={{ padding: '14px 16px', fontSize: 13, color: '#64748B' }}>
                      <div>{item.designation}</div>
                      <div style={{ fontSize: 11, color: '#94A3B8' }}>{item.department}</div>
                    </td>

                    <td style={{ padding: '14px 16px', fontSize: 13, fontWeight: 700, color: item.checkInTime ? '#0F172A' : '#94A3B8' }}>
                      {item.checkInTime || '--:--'}
                    </td>

                    <td style={{ padding: '14px 16px', fontSize: 13, fontWeight: 700, color: item.checkOutTime ? '#0F172A' : '#94A3B8' }}>
                      {item.checkOutTime || '--:--'}
                    </td>

                    <td style={{ padding: '14px 16px', fontSize: 13, color: '#475569' }}>
                      {item.workingMinutes ? formatMinutes(item.workingMinutes) : (item.checkInTime ? 'In Progress' : '--')}
                    </td>

                    <td style={{ padding: '14px 16px' }}>
                      <span
                        style={{
                          padding: '4px 10px',
                          borderRadius: 20,
                          fontSize: 11,
                          fontWeight: 800,
                          backgroundColor: badgeBg,
                          color: badgeColor
                        }}
                      >
                        {item.status}
                      </span>
                    </td>

                    <td style={{ padding: '14px 16px' }}>
                      {item.checkInTime ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <span style={{ color: item.locationVerified ? '#16A34A' : '#DC2626', fontWeight: 800, fontSize: 12 }}>
                            {item.locationVerified ? 'Verified ✓' : 'Not Verified ✕'}
                          </span>
                          <span style={{ fontSize: 11, color: '#94A3B8' }}>
                            ({item.distanceFromSchool}m)
                          </span>
                        </div>
                      ) : (
                        <span style={{ fontSize: 12, color: '#94A3B8' }}>--</span>
                      )}
                    </td>

                    <td style={{ padding: '14px 16px', textAlign: 'right' }}>
                      <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                        <button
                          onClick={() => setManualCheckInEmployee(item)}
                          style={{
                            padding: '6px 10px',
                            borderRadius: 8,
                            backgroundColor: '#EFF6FF',
                            color: '#1769E0',
                            border: '1px solid #BFDBFE',
                            fontSize: 12,
                            fontWeight: 700,
                            cursor: 'pointer'
                          }}
                        >
                          Manual Entry
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* ADMIN SETTINGS MODAL */}
      {showSettingsModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 1000,
            backgroundColor: 'rgba(15,23,42,0.6)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          <div
            style={{
              width: '100%',
              maxWidth: 520,
              backgroundColor: '#FFFFFF',
              borderRadius: 20,
              padding: 24,
              boxShadow: '0 20px 40px rgba(0,0,0,0.2)',
              display: 'flex',
              flexDirection: 'column',
              gap: 16
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h2 style={{ fontSize: 18, fontWeight: 800, color: '#0F172A', margin: 0 }}>
                  Employee Attendance Configuration
                </h2>
                <p style={{ fontSize: 12, color: '#64748B', margin: '2px 0 0 0' }}>
                  Set school geofence coordinates, radius & arrival thresholds
                </p>
              </div>

              <button
                onClick={() => setShowSettingsModal(false)}
                style={{ border: 'none', background: 'none', fontSize: 18, cursor: 'pointer', fontWeight: 800, color: '#64748B' }}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveSettings} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 700, color: '#334155', display: 'block', marginBottom: 4 }}>
                    School Latitude
                  </label>
                  <input
                    type="number"
                    step="any"
                    value={tempLat}
                    onChange={(e) => setTempLat(parseFloat(e.target.value))}
                    style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid #CBD5E1', fontSize: 13 }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: 12, fontWeight: 700, color: '#334155', display: 'block', marginBottom: 4 }}>
                    School Longitude
                  </label>
                  <input
                    type="number"
                    step="any"
                    value={tempLng}
                    onChange={(e) => setTempLng(parseFloat(e.target.value))}
                    style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid #CBD5E1', fontSize: 13 }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 700, color: '#334155', display: 'block', marginBottom: 4 }}>
                    Attendance Radius (Meters)
                  </label>
                  <select
                    value={tempRadius}
                    onChange={(e) => setTempRadius(parseInt(e.target.value, 10))}
                    style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid #CBD5E1', fontSize: 13, backgroundColor: '#FFF' }}
                  >
                    <option value={20}>20 meters</option>
                    <option value={30}>30 meters</option>
                    <option value={50}>50 meters (Default)</option>
                    <option value={100}>100 meters</option>
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: 12, fontWeight: 700, color: '#334155', display: 'block', marginBottom: 4 }}>
                    Late Threshold Time
                  </label>
                  <input
                    type="text"
                    value={tempLateTime}
                    onChange={(e) => setTempLateTime(e.target.value)}
                    placeholder="09:30 AM"
                    style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid #CBD5E1', fontSize: 13 }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 13, fontWeight: 700, color: '#334155' }}>
                  <input
                    type="checkbox"
                    checked={tempBreakEnabled}
                    onChange={(e) => setTempBreakEnabled(e.target.checked)}
                  />
                  <span>Enable Campus Break Feature (Start Break / Return)</span>
                </label>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 10 }}>
                <button
                  type="button"
                  onClick={() => setShowSettingsModal(false)}
                  style={{ padding: '8px 16px', borderRadius: 10, border: '1px solid #CBD5E1', backgroundColor: '#FFF', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{ padding: '8px 18px', borderRadius: 10, backgroundColor: '#1769E0', color: '#FFF', border: 'none', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}
                >
                  Save Settings
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MANUAL CHECK-IN MODAL */}
      {manualCheckInEmployee && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 1000,
            backgroundColor: 'rgba(15,23,42,0.6)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          <div
            style={{
              width: '100%',
              maxWidth: 440,
              backgroundColor: '#FFFFFF',
              borderRadius: 20,
              padding: 24,
              boxShadow: '0 20px 40px rgba(0,0,0,0.2)',
              display: 'flex',
              flexDirection: 'column',
              gap: 16
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h2 style={{ fontSize: 18, fontWeight: 800, color: '#0F172A', margin: 0 }}>
                  Manual Attendance Entry
                </h2>
                <p style={{ fontSize: 12, color: '#64748B', margin: '2px 0 0 0' }}>
                  {manualCheckInEmployee.name} ({manualCheckInEmployee.empId})
                </p>
              </div>

              <button
                onClick={() => setManualCheckInEmployee(null)}
                style={{ border: 'none', background: 'none', fontSize: 18, cursor: 'pointer', fontWeight: 800, color: '#64748B' }}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveManualCheckIn} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={{ fontSize: 12, fontWeight: 700, color: '#334155', display: 'block', marginBottom: 4 }}>
                  Status
                </label>
                <select
                  value={manualStatus}
                  onChange={(e: any) => setManualStatus(e.target.value)}
                  style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid #CBD5E1', fontSize: 13, backgroundColor: '#FFF' }}
                >
                  <option value="Present">Present</option>
                  <option value="Late">Late</option>
                  <option value="Absent">Absent</option>
                  <option value="On Leave">On Leave</option>
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 700, color: '#334155', display: 'block', marginBottom: 4 }}>
                    Check-In Time
                  </label>
                  <input
                    type="text"
                    value={manualCheckInTime}
                    onChange={(e) => setManualCheckInTime(e.target.value)}
                    placeholder="08:30 AM"
                    style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid #CBD5E1', fontSize: 13 }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: 12, fontWeight: 700, color: '#334155', display: 'block', marginBottom: 4 }}>
                    Check-Out Time
                  </label>
                  <input
                    type="text"
                    value={manualCheckOutTime}
                    onChange={(e) => setManualCheckOutTime(e.target.value)}
                    placeholder="02:00 PM"
                    style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid #CBD5E1', fontSize: 13 }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 10 }}>
                <button
                  type="button"
                  onClick={() => setManualCheckInEmployee(null)}
                  style={{ padding: '8px 16px', borderRadius: 10, border: '1px solid #CBD5E1', backgroundColor: '#FFF', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{ padding: '8px 18px', borderRadius: 10, backgroundColor: '#1769E0', color: '#FFF', border: 'none', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}
                >
                  Save Entry
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
