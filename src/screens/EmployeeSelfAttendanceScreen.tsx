import React, { useState, useEffect } from 'react';
import { Employee } from '../types';
import {
  employeeAttendanceService,
  formatMinutes,
  calculateDistanceMeters,
  getCurrentTime12Hour,
  parseTimeMinutes
} from '../services/employeeAttendanceService';
import { EmployeeAttendanceRecord, EmployeeAttendanceSettings, demoDataStore } from '../services/demoDataStore';
import {
  Clock,
  MapPin,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Calendar,
  ArrowLeft,
  ShieldCheck,
  Coffee,
  TrendingUp,
  LogOut,
  Compass,
  RefreshCw,
  Sliders,
  Filter,
  SlidersHorizontal,
  Check,
  RotateCcw,
  TestTube,
  UserCheck,
  X
} from 'lucide-react';

interface EmployeeSelfAttendanceScreenProps {
  employee: Employee;
  onBack?: () => void;
}

function format24to12(time24: string): string {
  if (!time24) return '';
  const parts = time24.split(':');
  if (parts.length < 2) return time24;
  let h = parseInt(parts[0], 10);
  const m = parseInt(parts[1], 10);
  if (isNaN(h) || isNaN(m)) return time24;
  const ampm = h >= 12 ? 'PM' : 'AM';
  h = h % 12;
  if (h === 0) h = 12;
  const hFormatted = h < 10 ? `0${h}` : `${h}`;
  const mFormatted = m < 10 ? `0${m}` : `${m}`;
  return `${hFormatted}:${mFormatted} ${ampm}`;
}

function getCurrentTime24(): string {
  const d = new Date();
  const h = d.getHours() < 10 ? `0${d.getHours()}` : `${d.getHours()}`;
  const m = d.getMinutes() < 10 ? `0${d.getMinutes()}` : `${d.getMinutes()}`;
  return `${h}:${m}`;
}

export const EmployeeSelfAttendanceScreen: React.FC<EmployeeSelfAttendanceScreenProps> = ({
  employee,
  onBack
}) => {
  const empId = employee.id || employee.employeeId || 'EMP-T101';
  const empName = employee.name || 'Mrs. Priya Sharma';

  const [settings, setSettings] = useState<EmployeeAttendanceSettings>(() =>
    employeeAttendanceService.getSettings()
  );
  const [todayRecord, setTodayRecord] = useState<EmployeeAttendanceRecord | null>(null);

  // Filters for History View
  const currentDateObj = new Date();
  const currentYearStr = currentDateObj.getFullYear().toString();
  const currentMonthStr = (currentDateObj.getMonth() + 1).toString().padStart(2, '0');
  const todayISO = currentDateObj.toISOString().split('T')[0];

  const [selectedYear, setSelectedYear] = useState<string>(currentYearStr);
  const [selectedMonth, setSelectedMonth] = useState<string>(currentMonthStr);
  const [selectedDayFilter, setSelectedDayFilter] = useState<string>('All');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>('All');
  const [historyQuickFilter, setHistoryQuickFilter] = useState<'All' | 'Today' | 'ThisWeek' | 'ThisMonth'>('All');

  const [monthlySummary, setMonthlySummary] = useState<any>(null);
  const [historyRecords, setHistoryRecords] = useState<EmployeeAttendanceRecord[]>([]);
  const [showHistoryModal, setShowHistoryModal] = useState<boolean>(false);

  // DEMO TEST MODE vs REAL GPS STATE
  // Mode options: 'simulated_inside' | 'simulated_outside' | 'real_gps'
  const [locationMode, setLocationMode] = useState<'simulated_inside' | 'simulated_outside' | 'real_gps'>(
    'simulated_inside'
  );
  const [distanceMeters, setDistanceMeters] = useState<number>(25);
  const [isInsideRadius, setIsInsideRadius] = useState<boolean>(true);
  const [realLat, setRealLat] = useState<number | null>(null);
  const [realLng, setRealLng] = useState<number | null>(null);
  const [isLocating, setIsLocating] = useState<boolean>(false);
  const [gpsErrorMsg, setGpsErrorMsg] = useState<string | null>(null);

  // Modals for Demo Manual Attendance
  const [showCheckInModal, setShowCheckInModal] = useState<boolean>(false);
  const [showCheckOutModal, setShowCheckOutModal] = useState<boolean>(false);
  const [modalCheckInTime, setModalCheckInTime] = useState<string>('07:00 AM');
  const [modalCheckOutTime, setModalCheckOutTime] = useState<string>('02:00 PM');
  const [confirmResetDate, setConfirmResetDate] = useState<string | null>(null);

  // Alert message banner
  const [alertMsg, setAlertMsg] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);

  const fetchAttendanceData = () => {
    try {
      const currentSettings = employeeAttendanceService.getSettings();
      setSettings(currentSettings);

      const rec = employeeAttendanceService.getTodayRecord(empId, todayISO);
      setTodayRecord(rec);

      const summary = employeeAttendanceService.getMonthlySummary(empId, selectedMonth, selectedYear);
      setMonthlySummary(summary);

      let hist = employeeAttendanceService.getAttendanceHistory({
        employeeId: empId,
        year: selectedYear,
        month: selectedMonth,
        status: selectedStatusFilter
      });

      if (selectedDayFilter !== 'All') {
        const dayPadded = selectedDayFilter.length === 1 ? `0${selectedDayFilter}` : selectedDayFilter;
        hist = hist.filter((r) => {
          const parts = r.date.split('-');
          return parts.length === 3 && parts[2] === dayPadded;
        });
      }

      if (historyQuickFilter === 'Today') {
        hist = hist.filter((r) => r.date === todayISO);
      } else if (historyQuickFilter === 'ThisMonth') {
        hist = hist.filter((r) => r.date.startsWith(todayISO.substring(0, 7)));
      }

      setHistoryRecords(hist);
    } catch (e) {
      console.warn('Error fetching attendance data:', e);
    }
  };

  useEffect(() => {
    fetchAttendanceData();
    const unsubscribe = demoDataStore.subscribe(() => {
      fetchAttendanceData();
    });
    return () => unsubscribe();
  }, [empId, selectedMonth, selectedYear, selectedStatusFilter, selectedDayFilter, historyQuickFilter]);

  // Handle Location & Mode Switching
  useEffect(() => {
    const radius = settings.attendanceRadius || 50;

    if (locationMode === 'simulated_inside') {
      setDistanceMeters(25);
      setIsInsideRadius(true);
      setGpsErrorMsg(null);
    } else if (locationMode === 'simulated_outside') {
      setDistanceMeters(150);
      setIsInsideRadius(false);
      setGpsErrorMsg(null);
    } else if (locationMode === 'real_gps') {
      if (!navigator.geolocation) {
        setGpsErrorMsg('Geolocation API is not supported on this device/browser.');
        setIsInsideRadius(false);
        return;
      }

      setIsLocating(true);
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setIsLocating(false);
          setGpsErrorMsg(null);
          const lat = pos.coords.latitude;
          const lng = pos.coords.longitude;
          setRealLat(lat);
          setRealLng(lng);

          const dist = calculateDistanceMeters(
            lat,
            lng,
            settings.schoolLatitude || 26.9124,
            settings.schoolLongitude || 75.7873
          );
          setDistanceMeters(dist);
          setIsInsideRadius(dist <= radius);
        },
        (err) => {
          setIsLocating(false);
          console.warn('GPS location error:', err);
          setGpsErrorMsg('Location permission denied or GPS disabled. Please turn on device GPS.');
          setIsInsideRadius(false);
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );
    }
  }, [locationMode, settings.attendanceRadius, settings.schoolLatitude, settings.schoolLongitude]);

  // Actions with immediate read-back confirmation
  const handleCheckInRealOrSim = () => {
    setAlertMsg(null);
    if (!isInsideRadius) {
      setAlertMsg({
        type: 'error',
        text: `Check-In Disabled: You are outside the 50m school attendance radius (${distanceMeters}m away). Please move inside the school area.`
      });
      return;
    }

    const res = employeeAttendanceService.checkIn({
      employeeId: empId,
      employeeName: empName,
      designation: employee.designation || 'Teacher',
      department: employee.department || 'Academics',
      latitude: realLat || settings.schoolLatitude || 26.9124,
      longitude: realLng || settings.schoolLongitude || 75.7873,
      simulatedDistance: locationMode === 'real_gps' ? undefined : distanceMeters
    });

    if (res.success) {
      fetchAttendanceData();
      const freshRecord = employeeAttendanceService.getTodayRecord(empId);
      if (freshRecord && freshRecord.checkInTime) {
        setAlertMsg({
          type: 'success',
          text: `✓ Check-In Confirmed & Saved: ${freshRecord.checkInTime} (${freshRecord.status}${freshRecord.lateMinutes ? ` - Late by ${freshRecord.lateMinutes}m` : ''})`
        });
      }
    } else {
      setAlertMsg({ type: 'error', text: res.message });
    }
  };

  const handleCheckOutRealOrSim = () => {
    setAlertMsg(null);
    const res = employeeAttendanceService.checkOut({
      employeeId: empId,
      latitude: realLat || settings.schoolLatitude || 26.9124,
      longitude: realLng || settings.schoolLongitude || 75.7873
    });

    if (res.success) {
      fetchAttendanceData();
      const freshRecord = employeeAttendanceService.getTodayRecord(empId);
      if (freshRecord && freshRecord.checkOutTime) {
        setAlertMsg({
          type: 'success',
          text: `✓ Check-Out Confirmed & Saved: ${freshRecord.checkOutTime}. Working duration: ${formatMinutes(freshRecord.workingMinutes)}`
        });
      }
    } else {
      setAlertMsg({ type: 'error', text: res.message });
    }
  };

  // Confirm Manual Demo Check-In from Modal
  const handleConfirmDemoCheckIn = () => {
    setAlertMsg(null);
    if (todayRecord && todayRecord.checkInTime) {
      setAlertMsg({
        type: 'error',
        text: `Already Checked In today at ${todayRecord.checkInTime}`
      });
      setShowCheckInModal(false);
      return;
    }

    const res = employeeAttendanceService.checkIn({
      employeeId: empId,
      employeeName: empName,
      designation: employee.designation || 'Teacher',
      department: employee.department || 'Academics',
      overrideTime: modalCheckInTime,
      simulatedDistance: distanceMeters,
      dateStr: todayISO,
      allowOverwrite: true
    });

    setShowCheckInModal(false);
    if (res.success) {
      fetchAttendanceData();
      const freshRec = employeeAttendanceService.getTodayRecord(empId, todayISO);
      const statusLabel = freshRec?.isEarlyCheckIn
        ? 'Present (Early)'
        : freshRec?.status === 'Late'
        ? `Late by ${freshRec.lateMinutes}m`
        : 'Present';

      setAlertMsg({
        type: 'success',
        text: `✓ Demo Check-In recorded at ${modalCheckInTime} (${statusLabel})`
      });
    } else {
      setAlertMsg({ type: 'error', text: res.message });
    }
  };

  // Confirm Manual Demo Check-Out from Modal
  const handleConfirmDemoCheckOut = () => {
    setAlertMsg(null);
    if (!todayRecord || !todayRecord.checkInTime) {
      setAlertMsg({
        type: 'error',
        text: 'Please Check-In first before checking out.'
      });
      setShowCheckOutModal(false);
      return;
    }

    if (todayRecord.checkOutTime) {
      setAlertMsg({
        type: 'error',
        text: `Today's attendance is already completed. Checked out at ${todayRecord.checkOutTime}`
      });
      setShowCheckOutModal(false);
      return;
    }

    const inMins = parseTimeMinutes(todayRecord.checkInTime);
    const outMins = parseTimeMinutes(modalCheckOutTime);

    if (outMins <= inMins) {
      setAlertMsg({
        type: 'error',
        text: `Check-Out time (${modalCheckOutTime}) cannot be before or equal to Check-In time (${todayRecord.checkInTime}).`
      });
      return;
    }

    const res = employeeAttendanceService.checkOut({
      employeeId: empId,
      overrideTime: modalCheckOutTime,
      dateStr: todayISO
    });

    setShowCheckOutModal(false);
    if (res.success) {
      fetchAttendanceData();
      const freshRec = employeeAttendanceService.getTodayRecord(empId, todayISO);
      const durationStr = freshRec?.workingMinutes ? formatMinutes(freshRec.workingMinutes) : '0h 0m';
      setAlertMsg({
        type: 'success',
        text: `✓ Demo Check-Out recorded at ${modalCheckOutTime} (Working Duration: ${durationStr})`
      });
    } else {
      setAlertMsg({ type: 'error', text: res.message });
    }
  };

  const handleResetDemoRecord = (targetDate: string) => {
    employeeAttendanceService.deleteRecord(empId, targetDate);
    fetchAttendanceData();
    setAlertMsg({
      type: 'info',
      text: `Reset demo attendance for ${targetDate}`
    });
    setConfirmResetDate(null);
  };

  // Helper formatting for date displays
  const getFullFormattedDate = (dateStr: string) => {
    if (!dateStr) return '';
    const parts = dateStr.split('-').map(Number);
    if (parts.length < 3) return dateStr;
    const d = new Date(parts[0], parts[1] - 1, parts[2]);
    return d.toLocaleDateString('en-GB', {
      weekday: 'long',
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    });
  };

  const todayFormattedHeader = new Date().toLocaleDateString('en-GB', {
    weekday: 'long',
    day: '2-digit',
    month: 'long',
    year: 'numeric'
  });

  const getStatusBadgeColor = (status?: string) => {
    switch (status) {
      case 'Present':
        return { bg: '#DCFCE7', color: '#15803D', border: '#86EFAC', icon: '🟢' };
      case 'Late':
        return { bg: '#FEF3C7', color: '#B45309', border: '#FDE68A', icon: '🟠' };
      case 'Checked Out':
        return { bg: '#E0F2FE', color: '#0369A1', border: '#BAE6FD', icon: '🔵' };
      case 'On Leave':
        return { bg: '#F3E8FF', color: '#6B21A8', border: '#E9D5FF', icon: '🟣' };
      case 'Absent':
        return { bg: '#FEE2E2', color: '#B91C1C', border: '#FCA5A5', icon: '🔴' };
      default:
        return { bg: '#F1F5F9', color: '#475569', border: '#CBD5E1', icon: '⚪' };
    }
  };

  const statusBadge = getStatusBadgeColor(todayRecord?.checkOutTime ? 'Checked Out' : todayRecord?.status);

  // Calculated Status Preview for Check-In Modal
  const getModalCalculatedStatus = (timeStr: string) => {
    if (!timeStr) return { label: 'Present', color: '#15803D', bg: '#DCFCE7', icon: '🟢' };
    const checkInMins = parseTimeMinutes(timeStr);
    const schoolStartMins = parseTimeMinutes(settings.schoolStartTime || '09:00 AM');
    const lateThresholdMins = parseTimeMinutes(settings.lateThresholdTime || '09:30 AM');

    if (checkInMins < schoolStartMins) {
      return { label: 'Present (Early)', color: '#15803D', bg: '#DCFCE7', icon: '🟢' };
    } else if (checkInMins <= lateThresholdMins) {
      return { label: 'Present', color: '#15803D', bg: '#DCFCE7', icon: '🟢' };
    } else {
      const lateMins = checkInMins - lateThresholdMins;
      return { label: `Late by ${lateMins} mins`, color: '#B45309', bg: '#FEF3C7', icon: '🟠' };
    }
  };

  const modalCalcStatus = getModalCalculatedStatus(modalCheckInTime);

  // Month names for history filter
  const monthList = [
    { value: 'All', label: 'All Months' },
    { value: '01', label: 'January' },
    { value: '02', label: 'February' },
    { value: '03', label: 'March' },
    { value: '04', label: 'April' },
    { value: '05', label: 'May' },
    { value: '06', label: 'June' },
    { value: '07', label: 'July' },
    { value: '08', label: 'August' },
    { value: '09', label: 'September' },
    { value: '10', label: 'October' },
    { value: '11', label: 'November' },
    { value: '12', label: 'December' }
  ];

  const daysList = ['All', ...Array.from({ length: 31 }, (_, i) => (i + 1).toString().padStart(2, '0'))];

  const checkInPresets = ['07:00 AM', '08:30 AM', '09:00 AM', '09:25 AM', '09:35 AM'];
  const checkOutPresets = ['01:30 PM', '02:00 PM', '02:08 PM', '04:00 PM', '05:00 PM'];

  return (
    <div style={{ padding: '16px 16px 80px 16px', display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {onBack && (
            <button
              onClick={onBack}
              style={{
                width: 38,
                height: 38,
                borderRadius: 12,
                border: '1px solid #E2E8F0',
                backgroundColor: '#FFFFFF',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#1E293B',
                cursor: 'pointer'
              }}
            >
              <ArrowLeft size={18} />
            </button>
          )}
          <div>
            <h1 style={{ fontSize: 20, fontWeight: 800, color: '#0F172A', margin: 0, lineHeight: 1.2 }}>
              My Attendance
            </h1>
            <p style={{ fontSize: 13, color: '#64748B', margin: '2px 0 0 0' }}>
              Track your daily school attendance
            </p>
          </div>
        </div>

        <button
          onClick={() => setShowHistoryModal(true)}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            padding: '8px 14px',
            borderRadius: 12,
            backgroundColor: '#1769E0',
            color: '#FFFFFF',
            border: 'none',
            fontSize: 13,
            fontWeight: 800,
            cursor: 'pointer',
            boxShadow: '0 4px 12px rgba(23,105,224,0.3)'
          }}
        >
          <Calendar size={15} />
          <span>History</span>
        </button>
      </div>

      {/* DEMO TEST CONTROL BOX */}
      <div
        style={{
          padding: 14,
          borderRadius: 16,
          backgroundColor: '#FFFBEB',
          border: '1px solid #FDE68A',
          boxShadow: '0 2px 8px rgba(245,158,11,0.1)'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#B45309', fontWeight: 800, fontSize: 12 }}>
            <Sliders size={16} />
            <span>⚙ DEMO TEST MODE (Location Simulation)</span>
          </div>
          <span style={{ fontSize: 10, fontWeight: 700, backgroundColor: '#FEF3C7', color: '#B45309', padding: '2px 8px', borderRadius: 10 }}>
            TEST CONTROL
          </span>
        </div>

        <p style={{ fontSize: 11, color: '#78350F', margin: '0 0 10px 0', lineHeight: 1.3 }}>
          Select a location scenario below to test Check-In / Check-Out flows without physical GPS restrictions.
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
          <button
            onClick={() => setLocationMode('simulated_inside')}
            style={{
              padding: '8px 6px',
              borderRadius: 10,
              fontSize: 11,
              fontWeight: 800,
              border: locationMode === 'simulated_inside' ? '2px solid #16A34A' : '1px solid #CBD5E1',
              backgroundColor: locationMode === 'simulated_inside' ? '#DCFCE7' : '#FFFFFF',
              color: locationMode === 'simulated_inside' ? '#15803D' : '#475569',
              cursor: 'pointer',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 2
            }}
          >
            <span>📍 Inside (25m)</span>
            <span style={{ fontSize: 9, opacity: 0.8 }}>Check-In Allowed</span>
          </button>

          <button
            onClick={() => setLocationMode('simulated_outside')}
            style={{
              padding: '8px 6px',
              borderRadius: 10,
              fontSize: 11,
              fontWeight: 800,
              border: locationMode === 'simulated_outside' ? '2px solid #DC2626' : '1px solid #CBD5E1',
              backgroundColor: locationMode === 'simulated_outside' ? '#FEE2E2' : '#FFFFFF',
              color: locationMode === 'simulated_outside' ? '#B91C1C' : '#475569',
              cursor: 'pointer',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 2
            }}
          >
            <span>🚫 Outside (150m)</span>
            <span style={{ fontSize: 9, opacity: 0.8 }}>Check-In Disabled</span>
          </button>

          <button
            onClick={() => setLocationMode('real_gps')}
            style={{
              padding: '8px 6px',
              borderRadius: 10,
              fontSize: 11,
              fontWeight: 800,
              border: locationMode === 'real_gps' ? '2px solid #1769E0' : '1px solid #CBD5E1',
              backgroundColor: locationMode === 'real_gps' ? '#EFF6FF' : '#FFFFFF',
              color: locationMode === 'real_gps' ? '#1D4ED8' : '#475569',
              cursor: 'pointer',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 2
            }}
          >
            <span>🛰️ Real GPS</span>
            <span style={{ fontSize: 9, opacity: 0.8 }}>Device Geolocation</span>
          </button>
        </div>
      </div>

      {/* Alert Notification Banner */}
      {alertMsg && (
        <div
          style={{
            padding: '12px 14px',
            borderRadius: 14,
            fontSize: 13,
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            backgroundColor:
              alertMsg.type === 'success' ? '#F0FDF4' : alertMsg.type === 'error' ? '#FEF2F2' : '#EFF6FF',
            color:
              alertMsg.type === 'success' ? '#166534' : alertMsg.type === 'error' ? '#991B1B' : '#1E40AF',
            border: `1px solid ${
              alertMsg.type === 'success' ? '#BBF7D0' : alertMsg.type === 'error' ? '#FECACA' : '#BFDBFE'
            }`
          }}
        >
          {alertMsg.type === 'success' ? (
            <CheckCircle2 size={18} />
          ) : alertMsg.type === 'error' ? (
            <XCircle size={18} />
          ) : (
            <AlertCircle size={18} />
          )}
          <span style={{ flex: 1 }}>{alertMsg.text}</span>
        </div>
      )}

      {/* TODAY'S ATTENDANCE MAIN CARD */}
      <div
        className="avm-card"
        style={{
          padding: 20,
          background: 'linear-gradient(135deg, #1769E0 0%, #104EB0 100%)',
          color: '#FFFFFF',
          borderRadius: 20,
          boxShadow: '0 8px 24px rgba(23,105,224,0.3)',
          position: 'relative',
          overflow: 'hidden'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: 0.8, opacity: 0.85, textTransform: 'uppercase' }}>
              TODAY • {todayFormattedHeader}
            </div>
            <div style={{ fontSize: 20, fontWeight: 800, marginTop: 4 }}>
              {employee.name}
            </div>
            <div style={{ fontSize: 12, opacity: 0.85, marginTop: 2 }}>
              ID: {empId} • {employee.designation || 'Teacher'}
            </div>
          </div>

          <div
            style={{
              padding: '6px 14px',
              borderRadius: 20,
              backgroundColor: 'rgba(255,255,255,0.2)',
              backdropFilter: 'blur(8px)',
              fontSize: 12,
              fontWeight: 800,
              display: 'flex',
              alignItems: 'center',
              gap: 6
            }}
          >
            <span>{statusBadge.icon}</span>
            <span>
              {todayRecord?.checkOutTime
                ? 'Checked Out'
                : todayRecord?.isEarlyCheckIn
                ? 'Present (Early)'
                : todayRecord?.status || 'Not Checked In'}
            </span>
          </div>
        </div>

        <div
          style={{
            marginTop: 20,
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: 12,
            backgroundColor: 'rgba(255,255,255,0.12)',
            borderRadius: 14,
            padding: 14
          }}
        >
          <div>
            <div style={{ fontSize: 11, opacity: 0.75, fontWeight: 600 }}>Check-In Time</div>
            <div style={{ fontSize: 16, fontWeight: 800, marginTop: 2 }}>
              {todayRecord?.checkInTime || 'Not checked in'}
            </div>
          </div>

          <div>
            <div style={{ fontSize: 11, opacity: 0.75, fontWeight: 600 }}>Check-Out Time</div>
            <div style={{ fontSize: 16, fontWeight: 800, marginTop: 2 }}>
              {todayRecord?.checkOutTime || 'Not checked out'}
            </div>
          </div>

          <div>
            <div style={{ fontSize: 11, opacity: 0.75, fontWeight: 600 }}>Working Duration</div>
            <div style={{ fontSize: 16, fontWeight: 800, marginTop: 2 }}>
              {todayRecord?.workingMinutes
                ? formatMinutes(todayRecord.workingMinutes)
                : todayRecord?.checkInTime
                ? 'In Progress'
                : '--'}
            </div>
          </div>

          <div>
            <div style={{ fontSize: 11, opacity: 0.75, fontWeight: 600 }}>Status Details</div>
            <div style={{ fontSize: 14, fontWeight: 800, marginTop: 2 }}>
              {todayRecord?.status === 'Late'
                ? `Late by ${todayRecord.lateMinutes || 12} mins`
                : todayRecord?.isEarlyCheckIn
                ? 'Present (Early)'
                : todayRecord?.status || 'Not Marked'}
            </div>
          </div>
        </div>
      </div>

      {/* SCHOOL ATTENDANCE AREA GEOFENCE CARD */}
      <div className="avm-card" style={{ padding: 18 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div
              style={{
                width: 42,
                height: 42,
                borderRadius: 14,
                backgroundColor: isInsideRadius ? '#DCFCE7' : '#FEE2E2',
                color: isInsideRadius ? '#15803D' : '#B91C1C',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <MapPin size={22} />
            </div>
            <div>
              <div style={{ fontSize: 14, fontWeight: 800, color: '#0F172A' }}>
                School Attendance Area
              </div>
              <div style={{ fontSize: 12, color: '#64748B' }}>
                Allowed Radius: {settings.attendanceRadius || 50} meters
              </div>
            </div>
          </div>

          <span
            style={{
              padding: '4px 12px',
              borderRadius: 14,
              fontSize: 12,
              fontWeight: 800,
              backgroundColor: isInsideRadius ? '#F0FDF4' : '#FEF2F2',
              color: isInsideRadius ? '#166534' : '#991B1B',
              border: `1px solid ${isInsideRadius ? '#BBF7D0' : '#FECACA'}`
            }}
          >
            {isInsideRadius ? 'Inside Area ✓' : 'Outside Area ✕'}
          </span>
        </div>

        <div
          style={{
            marginTop: 14,
            padding: 12,
            borderRadius: 12,
            backgroundColor: '#F8FAFC',
            border: '1px solid #E2E8F0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            fontSize: 13
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#475569' }}>
            <Compass size={16} />
            <span>Distance from School:</span>
          </div>
          <span style={{ fontWeight: 800, fontSize: 14, color: isInsideRadius ? '#166534' : '#DC2626' }}>
            {distanceMeters} meters
          </span>
        </div>

        {gpsErrorMsg && locationMode === 'real_gps' && (
          <div style={{ marginTop: 12, padding: 10, borderRadius: 10, backgroundColor: '#FFFBEB', border: '1px solid #FDE68A', fontSize: 12, color: '#92400E' }}>
            ⚠️ {gpsErrorMsg}
          </div>
        )}
      </div>

      {/* MANUAL DEMO ATTENDANCE CARD - VISIBLE ONLY IN DEMO TEST MODE */}
      {locationMode !== 'real_gps' && (
        <div
          className="avm-card"
          style={{
            padding: 18,
            backgroundColor: '#FFFFFF',
            borderRadius: 20,
            border: '1px solid #CBD5E1',
            boxShadow: '0 4px 16px rgba(0,0,0,0.05)',
            display: 'flex',
            flexDirection: 'column',
            gap: 12
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <TestTube size={18} color="#1769E0" />
                <h2 style={{ fontSize: 16, fontWeight: 800, color: '#0F172A', margin: 0 }}>
                  Manual Attendance Test
                </h2>
              </div>
              <p style={{ fontSize: 12, color: '#64748B', margin: '2px 0 0 0' }}>
                Test Check-In / Check-Out without real GPS
              </p>
            </div>

            <span
              style={{
                padding: '3px 8px',
                borderRadius: 8,
                fontSize: 10,
                fontWeight: 800,
                backgroundColor: '#FFFBEB',
                color: '#B45309',
                border: '1px solid #FDE68A'
              }}
            >
              DEMO MODE
            </span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 4 }}>
            {/* MANUAL CHECK-IN BUTTON */}
            <button
              onClick={() => {
                if (todayRecord && todayRecord.checkInTime) {
                  setAlertMsg({
                    type: 'info',
                    text: `Already Checked In today at ${todayRecord.checkInTime}`
                  });
                } else {
                  setShowCheckInModal(true);
                }
              }}
              style={{
                padding: '14px',
                borderRadius: 14,
                backgroundColor: todayRecord?.checkInTime ? '#DCFCE7' : '#1769E0',
                color: todayRecord?.checkInTime ? '#15803D' : '#FFFFFF',
                border: todayRecord?.checkInTime ? '1px solid #86EFAC' : 'none',
                fontSize: 14,
                fontWeight: 800,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                cursor: 'pointer',
                boxShadow: todayRecord?.checkInTime ? 'none' : '0 4px 12px rgba(23,105,224,0.35)'
              }}
            >
              <Clock size={18} />
              <span>{todayRecord?.checkInTime ? `✓ Checked In (${todayRecord.checkInTime})` : 'CHECK-IN'}</span>
            </button>

            {/* MANUAL CHECK-OUT BUTTON */}
            <button
              onClick={() => {
                if (!todayRecord || !todayRecord.checkInTime) {
                  setAlertMsg({
                    type: 'error',
                    text: 'Please Check-In first before checking out.'
                  });
                } else if (todayRecord.checkOutTime) {
                  setAlertMsg({
                    type: 'info',
                    text: `Today's attendance is already completed. Checked out at ${todayRecord.checkOutTime}`
                  });
                } else {
                  setShowCheckOutModal(true);
                }
              }}
              disabled={!todayRecord || !todayRecord.checkInTime || !!todayRecord.checkOutTime}
              style={{
                padding: '14px',
                borderRadius: 14,
                backgroundColor:
                  !todayRecord || !todayRecord.checkInTime
                    ? '#E2E8F0'
                    : todayRecord.checkOutTime
                    ? '#F0F9FF'
                    : '#DC2626',
                color:
                  !todayRecord || !todayRecord.checkInTime
                    ? '#94A3B8'
                    : todayRecord.checkOutTime
                    ? '#0369A1'
                    : '#FFFFFF',
                border: todayRecord?.checkOutTime ? '1px solid #BAE6FD' : 'none',
                fontSize: 14,
                fontWeight: 800,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                cursor: !todayRecord || !todayRecord.checkInTime || !!todayRecord.checkOutTime ? 'not-allowed' : 'pointer',
                boxShadow:
                  !todayRecord || !todayRecord.checkInTime || !!todayRecord.checkOutTime
                    ? 'none'
                    : '0 4px 12px rgba(220,38,38,0.35)'
              }}
            >
              <LogOut size={18} />
              <span>{todayRecord?.checkOutTime ? `✓ Completed` : 'CHECK-OUT'}</span>
            </button>
          </div>

          <div style={{ fontSize: 11, color: '#64748B', textAlign: 'center', marginTop: 2, fontStyle: 'italic' }}>
            Demo Mode only — attendance will be saved locally for testing.
          </div>
        </div>
      )}

      {/* DEMO CHECK-IN MODAL / BOTTOM SHEET */}
      {showCheckInModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 1100,
            backgroundColor: 'rgba(15,23,42,0.65)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'flex-end',
            justifyContent: 'center'
          }}
        >
          <div
            style={{
              width: '100%',
              maxWidth: 480,
              backgroundColor: '#FFFFFF',
              borderTopLeftRadius: 24,
              borderTopRightRadius: 24,
              padding: 22,
              display: 'flex',
              flexDirection: 'column',
              gap: 16,
              boxShadow: '0 -8px 32px rgba(0,0,0,0.2)'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h3 style={{ fontSize: 18, fontWeight: 800, color: '#0F172A', margin: 0 }}>
                  Demo Check-In
                </h3>
                <p style={{ fontSize: 12, color: '#64748B', margin: '2px 0 0 0' }}>
                  Select or enter your test check-in time
                </p>
              </div>
              <button
                onClick={() => setShowCheckInModal(false)}
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 10,
                  backgroundColor: '#F1F5F9',
                  border: 'none',
                  color: '#64748B',
                  fontWeight: 800,
                  cursor: 'pointer'
                }}
              >
                <X size={18} />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ padding: 12, borderRadius: 12, backgroundColor: '#F8FAFC', border: '1px solid #E2E8F0' }}>
                <div style={{ fontSize: 11, color: '#64748B', fontWeight: 600 }}>Employee</div>
                <div style={{ fontSize: 14, fontWeight: 800, color: '#0F172A', marginTop: 2 }}>{empName}</div>
                <div style={{ fontSize: 11, color: '#475569', marginTop: 1 }}>ID: {empId} • Date: {todayFormattedHeader}</div>
              </div>

              <div>
                <label style={{ fontSize: 12, fontWeight: 800, color: '#0F172A', display: 'block', marginBottom: 6 }}>
                  Check-In Time
                </label>
                <input
                  type="text"
                  value={modalCheckInTime}
                  onChange={(e) => setModalCheckInTime(e.target.value)}
                  placeholder="e.g. 07:00 AM"
                  style={{
                    width: '100%',
                    padding: '12px 14px',
                    borderRadius: 12,
                    border: '1.5px solid #1769E0',
                    fontSize: 16,
                    fontWeight: 800,
                    color: '#0F172A',
                    backgroundColor: '#F0F7FF'
                  }}
                />
              </div>

              {/* Quick Presets */}
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#64748B', marginBottom: 6 }}>Quick Time Presets:</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {checkInPresets.map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setModalCheckInTime(preset)}
                      style={{
                        padding: '6px 10px',
                        borderRadius: 8,
                        fontSize: 12,
                        fontWeight: 800,
                        border: modalCheckInTime === preset ? '1.5px solid #1769E0' : '1px solid #CBD5E1',
                        backgroundColor: modalCheckInTime === preset ? '#EFF6FF' : '#FFFFFF',
                        color: modalCheckInTime === preset ? '#1D4ED8' : '#475569',
                        cursor: 'pointer'
                      }}
                    >
                      {preset}
                    </button>
                  ))}
                </div>
              </div>

              {/* Status Preview */}
              <div
                style={{
                  padding: 10,
                  borderRadius: 12,
                  backgroundColor: modalCalcStatus.bg,
                  border: `1px solid ${modalCalcStatus.color}40`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between'
                }}
              >
                <span style={{ fontSize: 12, fontWeight: 700, color: '#475569' }}>Calculated Status:</span>
                <span style={{ fontSize: 13, fontWeight: 800, color: modalCalcStatus.color }}>
                  {modalCalcStatus.icon} {modalCalcStatus.label}
                </span>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 4 }}>
              <button
                onClick={() => setShowCheckInModal(false)}
                style={{
                  padding: '12px',
                  borderRadius: 12,
                  border: '1px solid #CBD5E1',
                  backgroundColor: '#FFFFFF',
                  color: '#475569',
                  fontWeight: 700,
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDemoCheckIn}
                style={{
                  padding: '12px',
                  borderRadius: 12,
                  border: 'none',
                  backgroundColor: '#16A34A',
                  color: '#FFFFFF',
                  fontWeight: 800,
                  cursor: 'pointer',
                  boxShadow: '0 4px 12px rgba(22,163,74,0.3)'
                }}
              >
                Confirm Check-In
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DEMO CHECK-OUT MODAL / BOTTOM SHEET */}
      {showCheckOutModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 1100,
            backgroundColor: 'rgba(15,23,42,0.65)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'flex-end',
            justifyContent: 'center'
          }}
        >
          <div
            style={{
              width: '100%',
              maxWidth: 480,
              backgroundColor: '#FFFFFF',
              borderTopLeftRadius: 24,
              borderTopRightRadius: 24,
              padding: 22,
              display: 'flex',
              flexDirection: 'column',
              gap: 16,
              boxShadow: '0 -8px 32px rgba(0,0,0,0.2)'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h3 style={{ fontSize: 18, fontWeight: 800, color: '#0F172A', margin: 0 }}>
                  Demo Check-Out
                </h3>
                <p style={{ fontSize: 12, color: '#64748B', margin: '2px 0 0 0' }}>
                  Select or enter your test check-out time
                </p>
              </div>
              <button
                onClick={() => setShowCheckOutModal(false)}
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 10,
                  backgroundColor: '#F1F5F9',
                  border: 'none',
                  color: '#64748B',
                  fontWeight: 800,
                  cursor: 'pointer'
                }}
              >
                <X size={18} />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ padding: 12, borderRadius: 12, backgroundColor: '#F8FAFC', border: '1px solid #E2E8F0' }}>
                <div style={{ fontSize: 11, color: '#64748B', fontWeight: 600 }}>Check-In Recorded</div>
                <div style={{ fontSize: 14, fontWeight: 800, color: '#0F172A', marginTop: 2 }}>
                  Check-In: <strong>{todayRecord?.checkInTime}</strong>
                </div>
              </div>

              <div>
                <label style={{ fontSize: 12, fontWeight: 800, color: '#0F172A', display: 'block', marginBottom: 6 }}>
                  Check-Out Time
                </label>
                <input
                  type="text"
                  value={modalCheckOutTime}
                  onChange={(e) => setModalCheckOutTime(e.target.value)}
                  placeholder="e.g. 02:00 PM"
                  style={{
                    width: '100%',
                    padding: '12px 14px',
                    borderRadius: 12,
                    border: '1.5px solid #DC2626',
                    fontSize: 16,
                    fontWeight: 800,
                    color: '#0F172A',
                    backgroundColor: '#FEF2F2'
                  }}
                />
              </div>

              {/* Quick Presets */}
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#64748B', marginBottom: 6 }}>Quick Time Presets:</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {checkOutPresets.map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setModalCheckOutTime(preset)}
                      style={{
                        padding: '6px 10px',
                        borderRadius: 8,
                        fontSize: 12,
                        fontWeight: 800,
                        border: modalCheckOutTime === preset ? '1.5px solid #DC2626' : '1px solid #CBD5E1',
                        backgroundColor: modalCheckOutTime === preset ? '#FEE2E2' : '#FFFFFF',
                        color: modalCheckOutTime === preset ? '#B91C1C' : '#475569',
                        cursor: 'pointer'
                      }}
                    >
                      {preset}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 4 }}>
              <button
                onClick={() => setShowCheckOutModal(false)}
                style={{
                  padding: '12px',
                  borderRadius: 12,
                  border: '1px solid #CBD5E1',
                  backgroundColor: '#FFFFFF',
                  color: '#475569',
                  fontWeight: 700,
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDemoCheckOut}
                style={{
                  padding: '12px',
                  borderRadius: 12,
                  border: 'none',
                  backgroundColor: '#DC2626',
                  color: '#FFFFFF',
                  fontWeight: 800,
                  cursor: 'pointer',
                  boxShadow: '0 4px 12px rgba(220,38,38,0.3)'
                }}
              >
                Confirm Check-Out
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal for Resetting Demo Record */}
      {confirmResetDate && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 1100,
            backgroundColor: 'rgba(15,23,42,0.65)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 20
          }}
        >
          <div
            style={{
              backgroundColor: '#FFFFFF',
              borderRadius: 20,
              padding: 24,
              maxWidth: 380,
              width: '100%',
              display: 'flex',
              flexDirection: 'column',
              gap: 14
            }}
          >
            <div style={{ fontSize: 16, fontWeight: 800, color: '#0F172A' }}>
              Reset Demo Attendance?
            </div>
            <div style={{ fontSize: 13, color: '#64748B', lineHeight: 1.4 }}>
              Are you sure you want to reset demo attendance for <strong>{confirmResetDate}</strong>? This action only removes test demo data for this date.
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 10 }}>
              <button
                onClick={() => setConfirmResetDate(null)}
                style={{
                  padding: '10px',
                  borderRadius: 12,
                  border: '1px solid #CBD5E1',
                  backgroundColor: '#FFFFFF',
                  color: '#475569',
                  fontWeight: 700,
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
              <button
                onClick={() => handleResetDemoRecord(confirmResetDate)}
                style={{
                  padding: '10px',
                  borderRadius: 12,
                  border: 'none',
                  backgroundColor: '#DC2626',
                  color: '#FFFFFF',
                  fontWeight: 800,
                  cursor: 'pointer'
                }}
              >
                Reset
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MAIN REAL/SIMULATED CHECK-IN & CHECK-OUT ACTION BUTTONS */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {!todayRecord || !todayRecord.checkInTime ? (
          <button
            onClick={handleCheckInRealOrSim}
            disabled={!isInsideRadius}
            style={{
              width: '100%',
              padding: '16px',
              borderRadius: 16,
              backgroundColor: isInsideRadius ? '#16A34A' : '#94A3B8',
              color: '#FFFFFF',
              border: 'none',
              fontSize: 16,
              fontWeight: 800,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 10,
              boxShadow: isInsideRadius ? '0 6px 18px rgba(22,163,74,0.35)' : 'none',
              cursor: isInsideRadius ? 'pointer' : 'not-allowed'
            }}
          >
            <Clock size={20} />
            <span>{isInsideRadius ? 'CHECK IN NOW' : 'CHECK IN DISABLED (Outside Radius)'}</span>
          </button>
        ) : !todayRecord.checkOutTime ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div
              style={{
                padding: '12px 16px',
                borderRadius: 14,
                backgroundColor: '#DCFCE7',
                border: '1px solid #86EFAC',
                color: '#15803D',
                textAlign: 'center',
                fontSize: 14,
                fontWeight: 800,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8
              }}
            >
              <CheckCircle2 size={18} />
              <span>✓ Checked In Today at {todayRecord.checkInTime}</span>
            </div>

            <button
              onClick={handleCheckOutRealOrSim}
              style={{
                width: '100%',
                padding: '16px',
                borderRadius: 16,
                backgroundColor: '#DC2626',
                color: '#FFFFFF',
                border: 'none',
                fontSize: 16,
                fontWeight: 800,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 10,
                boxShadow: '0 6px 18px rgba(220,38,38,0.35)',
                cursor: 'pointer'
              }}
            >
              <LogOut size={20} />
              <span>CHECK OUT NOW</span>
            </button>
          </div>
        ) : (
          <div
            style={{
              padding: 18,
              borderRadius: 16,
              backgroundColor: '#F0F9FF',
              border: '1px solid #BAE6FD',
              color: '#0369A1',
              textAlign: 'center'
            }}
          >
            <div style={{ fontSize: 16, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
              <CheckCircle2 size={22} color="#0284C7" />
              <span>✓ Today's Attendance Completed</span>
            </div>
            <div style={{ fontSize: 13, marginTop: 6, fontWeight: 600, opacity: 0.9 }}>
              Check-In: <strong>{todayRecord.checkInTime}</strong> • Check-Out: <strong>{todayRecord.checkOutTime}</strong> ({formatMinutes(todayRecord.workingMinutes)})
            </div>
          </div>
        )}
      </div>

      {/* MONTHLY SUMMARY CARD AT BOTTOM OF MAIN VIEW */}
      {monthlySummary && (
        <div className="avm-card" style={{ padding: 18 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            <div>
              <h3 style={{ fontSize: 15, fontWeight: 800, color: '#0F172A', margin: 0 }}>
                Monthly Attendance Overview
              </h3>
              <p style={{ fontSize: 12, color: '#64748B', margin: '2px 0 0 0' }}>
                Summary for {selectedMonth}/{selectedYear}
              </p>
            </div>

            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 18, fontWeight: 800, color: '#1769E0' }}>
                {monthlySummary.attendancePercentage}%
              </div>
              <div style={{ fontSize: 10, color: '#64748B', fontWeight: 600 }}>Attendance %</div>
            </div>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(4, 1fr)',
              gap: 8,
              textAlign: 'center'
            }}
          >
            <div style={{ padding: 10, borderRadius: 12, backgroundColor: '#F0FDF4', border: '1px solid #BBF7D0' }}>
              <div style={{ fontSize: 16, fontWeight: 800, color: '#166534' }}>{monthlySummary.presentCount}</div>
              <div style={{ fontSize: 11, color: '#15803D', fontWeight: 600, marginTop: 2 }}>Present</div>
            </div>

            <div style={{ padding: 10, borderRadius: 12, backgroundColor: '#FEF3C7', border: '1px solid #FDE68A' }}>
              <div style={{ fontSize: 16, fontWeight: 800, color: '#B45309' }}>{monthlySummary.lateCount}</div>
              <div style={{ fontSize: 11, color: '#92400E', fontWeight: 600, marginTop: 2 }}>Late</div>
            </div>

            <div style={{ padding: 10, borderRadius: 12, backgroundColor: '#FEE2E2', border: '1px solid #FCA5A5' }}>
              <div style={{ fontSize: 16, fontWeight: 800, color: '#991B1B' }}>{monthlySummary.absentCount}</div>
              <div style={{ fontSize: 11, color: '#B91C1C', fontWeight: 600, marginTop: 2 }}>Absent</div>
            </div>

            <div style={{ padding: 10, borderRadius: 12, backgroundColor: '#F3E8FF', border: '1px solid #E9D5FF' }}>
              <div style={{ fontSize: 16, fontWeight: 800, color: '#6B21A8' }}>{monthlySummary.leaveCount}</div>
              <div style={{ fontSize: 11, color: '#7E22CE', fontWeight: 600, marginTop: 2 }}>Leave</div>
            </div>
          </div>
        </div>
      )}

      {/* FULL ATTENDANCE HISTORY MODAL WITH DAY + DATE + MONTH + YEAR */}
      {showHistoryModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 1000,
            backgroundColor: 'rgba(15,23,42,0.65)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'flex-end',
            justifyContent: 'center'
          }}
        >
          <div
            style={{
              width: '100%',
              maxWidth: 500,
              maxHeight: '90vh',
              backgroundColor: '#FFFFFF',
              borderTopLeftRadius: 24,
              borderTopRightRadius: 24,
              padding: 20,
              display: 'flex',
              flexDirection: 'column',
              gap: 14,
              overflowY: 'auto'
            }}
          >
            {/* Modal Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h2 style={{ fontSize: 18, fontWeight: 800, color: '#0F172A', margin: 0 }}>
                  Attendance History
                </h2>
                <p style={{ fontSize: 12, color: '#64748B', margin: '2px 0 0 0' }}>
                  Complete day, date, month & year attendance records
                </p>
              </div>

              <button
                onClick={() => setShowHistoryModal(false)}
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 10,
                  backgroundColor: '#F1F5F9',
                  border: 'none',
                  fontWeight: 800,
                  color: '#64748B',
                  cursor: 'pointer'
                }}
              >
                ✕
              </button>
            </div>

            {/* Quick Filter Pills */}
            <div style={{ display: 'flex', gap: 6 }}>
              {(['All', 'Today', 'ThisMonth'] as const).map((kf) => (
                <button
                  key={kf}
                  onClick={() => setHistoryQuickFilter(kf)}
                  style={{
                    padding: '6px 12px',
                    borderRadius: 10,
                    fontSize: 11,
                    fontWeight: 800,
                    border: historyQuickFilter === kf ? '1.5px solid #1769E0' : '1px solid #CBD5E1',
                    backgroundColor: historyQuickFilter === kf ? '#EFF6FF' : '#FFFFFF',
                    color: historyQuickFilter === kf ? '#1D4ED8' : '#64748B',
                    cursor: 'pointer'
                  }}
                >
                  {kf === 'All' ? 'All Records' : kf === 'Today' ? 'Today' : 'This Month'}
                </button>
              ))}
            </div>

            {/* MONTH, YEAR, DAY & STATUS FILTERS */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 6 }}>
              <div>
                <label style={{ fontSize: 10, fontWeight: 700, color: '#64748B', display: 'block', marginBottom: 2 }}>Month</label>
                <select
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                  style={{ width: '100%', padding: '6px 8px', borderRadius: 10, border: '1px solid #CBD5E1', fontSize: 11, fontWeight: 700 }}
                >
                  {monthList.map((m) => (
                    <option key={m.value} value={m.value}>{m.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ fontSize: 10, fontWeight: 700, color: '#64748B', display: 'block', marginBottom: 2 }}>Year</label>
                <select
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(e.target.value)}
                  style={{ width: '100%', padding: '6px 8px', borderRadius: 10, border: '1px solid #CBD5E1', fontSize: 11, fontWeight: 700 }}
                >
                  <option value="All">All Years</option>
                  <option value="2025">2025</option>
                  <option value="2026">2026</option>
                  <option value="2027">2027</option>
                </select>
              </div>

              <div>
                <label style={{ fontSize: 10, fontWeight: 700, color: '#64748B', display: 'block', marginBottom: 2 }}>Day</label>
                <select
                  value={selectedDayFilter}
                  onChange={(e) => setSelectedDayFilter(e.target.value)}
                  style={{ width: '100%', padding: '6px 8px', borderRadius: 10, border: '1px solid #CBD5E1', fontSize: 11, fontWeight: 700 }}
                >
                  {daysList.map((d) => (
                    <option key={d} value={d}>{d === 'All' ? 'All Days' : d}</option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ fontSize: 10, fontWeight: 700, color: '#64748B', display: 'block', marginBottom: 2 }}>Status</label>
                <select
                  value={selectedStatusFilter}
                  onChange={(e) => setSelectedStatusFilter(e.target.value)}
                  style={{ width: '100%', padding: '6px 8px', borderRadius: 10, border: '1px solid #CBD5E1', fontSize: 11, fontWeight: 700 }}
                >
                  <option value="All">All</option>
                  <option value="Present">Present</option>
                  <option value="Late">Late</option>
                  <option value="Absent">Absent</option>
                  <option value="On Leave">Leave</option>
                </select>
              </div>
            </div>

            {/* MONTHLY SUMMARY CARD INSIDE HISTORY */}
            {monthlySummary && (
              <div style={{ padding: 14, borderRadius: 16, backgroundColor: '#F8FAFC', border: '1px solid #E2E8F0' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <div style={{ fontSize: 13, fontWeight: 800, color: '#0F172A' }}>
                    Summary ({selectedMonth === 'All' ? 'All Months' : monthList.find(m => m.value === selectedMonth)?.label} {selectedYear})
                  </div>
                  <div style={{ fontSize: 14, fontWeight: 800, color: '#1769E0' }}>
                    {monthlySummary.attendancePercentage}% Attendance
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 6, textAlign: 'center', fontSize: 11, fontWeight: 700 }}>
                  <div style={{ padding: 6, borderRadius: 8, backgroundColor: '#FFFFFF', border: '1px solid #E2E8F0' }}>
                    <div style={{ color: '#166534', fontWeight: 800 }}>{monthlySummary.presentCount}</div>
                    <div style={{ color: '#64748B', fontSize: 10 }}>Present</div>
                  </div>
                  <div style={{ padding: 6, borderRadius: 8, backgroundColor: '#FFFFFF', border: '1px solid #E2E8F0' }}>
                    <div style={{ color: '#B45309', fontWeight: 800 }}>{monthlySummary.lateCount}</div>
                    <div style={{ color: '#64748B', fontSize: 10 }}>Late</div>
                  </div>
                  <div style={{ padding: 6, borderRadius: 8, backgroundColor: '#FFFFFF', border: '1px solid #E2E8F0' }}>
                    <div style={{ color: '#B91C1C', fontWeight: 800 }}>{monthlySummary.absentCount}</div>
                    <div style={{ color: '#64748B', fontSize: 10 }}>Absent</div>
                  </div>
                  <div style={{ padding: 6, borderRadius: 8, backgroundColor: '#FFFFFF', border: '1px solid #E2E8F0' }}>
                    <div style={{ color: '#7E22CE', fontWeight: 800 }}>{monthlySummary.leaveCount}</div>
                    <div style={{ color: '#64748B', fontSize: 10 }}>Leave</div>
                  </div>
                  <div style={{ padding: 6, borderRadius: 8, backgroundColor: '#FFFFFF', border: '1px solid #E2E8F0' }}>
                    <div style={{ color: '#1769E0', fontWeight: 800 }}>{monthlySummary.totalWorkingDays}</div>
                    <div style={{ color: '#64748B', fontSize: 10 }}>Days</div>
                  </div>
                </div>

                <div style={{ fontSize: 11, color: '#64748B', fontWeight: 600, marginTop: 8, textAlign: 'right' }}>
                  Total Working Duration: <strong style={{ color: '#0F172A' }}>{monthlySummary.totalWorkingHoursStr}</strong>
                </div>
              </div>
            )}

            {/* FULL DATE CONTEXT RECORDS LIST */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {historyRecords.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '30px 10px', color: '#94A3B8' }}>
                  <Calendar size={36} style={{ opacity: 0.5, marginBottom: 8 }} />
                  <p style={{ fontSize: 14, margin: 0, fontWeight: 600 }}>No attendance records match the selected filter.</p>
                </div>
              ) : (
                historyRecords.map((r) => {
                  const badge = getStatusBadgeColor(r.status);
                  // Full date formatting: e.g. 02 October 2026 • Friday
                  const dObj = getFullFormattedDate(r.date);

                  return (
                    <div
                      key={r.id}
                      style={{
                        padding: 14,
                        borderRadius: 14,
                        backgroundColor: '#FFFFFF',
                        border: '1px solid #E2E8F0',
                        boxShadow: '0 2px 6px rgba(0,0,0,0.03)',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                      }}
                    >
                      <div>
                        <div style={{ fontSize: 14, fontWeight: 800, color: '#0F172A' }}>
                          {dObj || r.date}
                        </div>

                        <div style={{ fontSize: 12, color: '#475569', marginTop: 4, fontWeight: 600 }}>
                          Check-In: <strong>{r.checkInTime || '--:--'}</strong> • Check-Out: <strong>{r.checkOutTime || '--:--'}</strong>
                        </div>

                        <div style={{ fontSize: 11, color: '#64748B', marginTop: 3 }}>
                          Duration: <strong>{r.workingMinutes ? formatMinutes(r.workingMinutes) : '--'}</strong>
                          {r.lateMinutes ? ` • Late by ${r.lateMinutes} mins` : ''}
                          {r.isEarlyCheckIn ? ' • Early Check-In' : ''}
                        </div>
                      </div>

                      <span
                        style={{
                          padding: '4px 10px',
                          borderRadius: 12,
                          fontSize: 11,
                          fontWeight: 800,
                          backgroundColor: badge.bg,
                          color: badge.color,
                          border: `1px solid ${badge.border}`
                        }}
                      >
                        {badge.icon} {r.status}
                      </span>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
