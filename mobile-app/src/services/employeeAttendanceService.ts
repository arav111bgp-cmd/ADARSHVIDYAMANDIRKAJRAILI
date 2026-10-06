import { demoDataStore, EmployeeAttendanceRecord, EmployeeAttendanceSettings } from './demoDataStore';

export function calculateDistanceMeters(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  if (!lat1 || !lon1 || !lat2 || !lon2) return 0;
  const R = 6371e3;
  const rad = Math.PI / 180;
  const dLat = (lat2 - lat1) * rad;
  const dLon = (lon2 - lon1) * rad;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * rad) * Math.cos(lat2 * rad) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c);
}

export function parseTimeMinutes(timeStr: string): number {
  if (!timeStr) return 0;
  const match = timeStr.match(/(\d+):(\d+)\s*(AM|PM)?/i);
  if (!match) return 0;
  let hrs = parseInt(match[1], 10);
  const mins = parseInt(match[2], 10);
  const period = match[3] ? match[3].toUpperCase() : '';
  if (period === 'PM' && hrs < 12) hrs += 12;
  if (period === 'AM' && hrs === 12) hrs = 0;
  return hrs * 60 + mins;
}

export function formatMinutes(mins?: number): string {
  if (!mins || mins <= 0) return '0h 0m';
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return `${h}h ${m}m`;
}

export function getCurrentTime12Hour(): string {
  const d = new Date();
  let hrs = d.getHours();
  const mins = d.getMinutes();
  const ampm = hrs >= 12 ? 'PM' : 'AM';
  hrs = hrs % 12;
  hrs = hrs ? hrs : 12;
  const strMins = mins < 10 ? `0${mins}` : mins;
  const strHrs = hrs < 10 ? `0${hrs}` : hrs;
  return `${strHrs}:${strMins} ${ampm}`;
}

export const employeeAttendanceService = {
  getSettings(): EmployeeAttendanceSettings {
    return demoDataStore.getEmployeeAttendanceSettings();
  },

  updateSettings(settings: Partial<EmployeeAttendanceSettings>): void {
    demoDataStore.updateEmployeeAttendanceSettings(settings);
  },

  getRecords(employeeId?: string, dateStr?: string, monthKey?: string): EmployeeAttendanceRecord[] {
    let records = demoDataStore.getEmployeeAttendanceRecords();
    if (employeeId) {
      records = records.filter(
        r => r.employeeId === employeeId || r.employeeId?.toLowerCase() === employeeId.toLowerCase()
      );
    }
    if (dateStr) {
      records = records.filter(r => r.date === dateStr);
    }
    if (monthKey) {
      records = records.filter(r => r.date.startsWith(monthKey));
    }
    return records;
  },

  getTodayRecord(employeeId: string, dateStr?: string): EmployeeAttendanceRecord | null {
    const today = dateStr || new Date().toISOString().split('T')[0];
    const records = this.getRecords(employeeId, today);
    return records.length > 0 ? records[0] : null;
  },

  checkIn({
    employeeId,
    employeeName,
    designation,
    department,
    latitude,
    longitude,
    overrideTime,
    simulatedDistance,
    dateStr,
    allowOverwrite
  }: {
    employeeId: string;
    employeeName: string;
    designation?: string;
    department?: string;
    latitude?: number;
    longitude?: number;
    overrideTime?: string;
    simulatedDistance?: number;
    dateStr?: string;
    allowOverwrite?: boolean;
  }): { success: boolean; message: string; record?: EmployeeAttendanceRecord } {
    const targetDate = dateStr || new Date().toISOString().split('T')[0];
    const existing = this.getTodayRecord(employeeId, targetDate);
    if (existing && existing.checkInTime && !allowOverwrite) {
      return { success: false, message: `Already checked in for ${targetDate} at ${existing.checkInTime}` };
    }

    const settings = this.getSettings();
    const timeStr = overrideTime || getCurrentTime12Hour();
    const checkInMins = parseTimeMinutes(timeStr);
    const lateThresholdMins = parseTimeMinutes(settings.lateThresholdTime || '09:30 AM');
    const schoolStartMins = parseTimeMinutes(settings.schoolStartTime || '09:00 AM');

    const status: 'Present' | 'Late' = checkInMins > lateThresholdMins ? 'Late' : 'Present';
    const lateMinutes = checkInMins > lateThresholdMins ? checkInMins - lateThresholdMins : 0;
    const isEarlyCheckIn = checkInMins < schoolStartMins;

    const schoolLat = settings.schoolLatitude || 26.9124;
    const schoolLng = settings.schoolLongitude || 75.7873;
    const radius = settings.attendanceRadius || 50;

    let dist = simulatedDistance !== undefined ? simulatedDistance : 34;
    let verified = dist <= radius;
    if (simulatedDistance === undefined && latitude && longitude) {
      dist = calculateDistanceMeters(latitude, longitude, schoolLat, schoolLng);
      verified = dist <= radius;
    }

    if (!verified) {
      return {
        success: false,
        message: `Check-In disabled: You are outside the school attendance radius (${dist}m away). Max allowed radius is ${radius}m.`
      };
    }

    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const parts = targetDate.split('-').map(Number);
    const dateObj = parts.length === 3 ? new Date(parts[0], parts[1] - 1, parts[2]) : new Date();
    const currentDayName = dayNames[dateObj.getDay()] || 'Friday';

    const record: EmployeeAttendanceRecord = {
      id: existing?.id || `EMP-ATT-${targetDate.replace(/-/g, '')}-${Math.floor(100 + Math.random() * 900)}`,
      employeeId,
      employeeName,
      designation: designation || 'Teacher',
      department: department || 'Academics',
      date: targetDate,
      dayOfWeek: currentDayName,
      checkInTime: timeStr,
      checkOutTime: existing?.checkOutTime,
      workingMinutes: existing?.workingMinutes || 0,
      lateMinutes,
      isEarlyCheckIn,
      status,
      latitude: latitude || schoolLat,
      longitude: longitude || schoolLng,
      distanceFromSchool: dist,
      locationVerified: verified,
      createdAt: existing?.createdAt || `${targetDate} ${timeStr}`,
      updatedAt: `${targetDate} ${timeStr}`
    };

    demoDataStore.saveEmployeeAttendanceRecord(record);

    // Read-back verification
    const verifiedRecord = this.getTodayRecord(employeeId, targetDate);
    return {
      success: true,
      message: `Checked in successfully at ${timeStr} (${status}${lateMinutes > 0 ? ` - Late by ${lateMinutes}m` : ''})`,
      record: verifiedRecord || record
    };
  },

  checkOut({
    employeeId,
    latitude,
    longitude,
    overrideTime,
    dateStr
  }: {
    employeeId: string;
    latitude?: number;
    longitude?: number;
    overrideTime?: string;
    dateStr?: string;
  }): { success: boolean; message: string; record?: EmployeeAttendanceRecord } {
    const targetDate = dateStr || new Date().toISOString().split('T')[0];
    const record = this.getTodayRecord(employeeId, targetDate);
    if (!record || !record.checkInTime) {
      return { success: false, message: `Please check in first for ${targetDate} before checking out.` };
    }

    const timeStr = overrideTime || getCurrentTime12Hour();
    const inMins = parseTimeMinutes(record.checkInTime);
    const outMins = parseTimeMinutes(timeStr);
    const duration = Math.max(0, outMins - inMins);

    const updatedRecord: EmployeeAttendanceRecord = {
      ...record,
      checkOutTime: timeStr,
      workingMinutes: duration,
      updatedAt: `${targetDate} ${timeStr}`
    };

    demoDataStore.saveEmployeeAttendanceRecord(updatedRecord);

    // Read-back verification
    const verifiedRecord = this.getTodayRecord(employeeId, targetDate);
    return {
      success: true,
      message: `Checked out successfully at ${timeStr}. Total working duration: ${formatMinutes(duration)}`,
      record: verifiedRecord || updatedRecord
    };
  },

  deleteRecord(employeeId: string, dateStr: string): void {
    demoDataStore.deleteEmployeeAttendanceRecord(employeeId, dateStr);
  },

  startBreak(employeeId: string): { success: boolean; message: string; record?: EmployeeAttendanceRecord } {
    const today = new Date().toISOString().split('T')[0];
    const record = this.getTodayRecord(employeeId, today);
    if (!record || !record.checkInTime) {
      return { success: false, message: 'You must check in first before starting a break.' };
    }
    const timeStr = getCurrentTime12Hour();
    const updatedRecord: EmployeeAttendanceRecord = {
      ...record,
      breakOutTime: timeStr,
      updatedAt: `${today} ${timeStr}`
    };
    demoDataStore.saveEmployeeAttendanceRecord(updatedRecord);
    return { success: true, message: `Campus break started at ${timeStr}`, record: updatedRecord };
  },

  endBreak(employeeId: string): { success: boolean; message: string; record?: EmployeeAttendanceRecord } {
    const today = new Date().toISOString().split('T')[0];
    const record = this.getTodayRecord(employeeId, today);
    if (!record || !record.breakOutTime) {
      return { success: false, message: 'No active break to return from.' };
    }
    const timeStr = getCurrentTime12Hour();
    const updatedRecord: EmployeeAttendanceRecord = {
      ...record,
      breakInTime: timeStr,
      updatedAt: `${today} ${timeStr}`
    };
    demoDataStore.saveEmployeeAttendanceRecord(updatedRecord);
    return { success: true, message: `Returned to campus at ${timeStr}`, record: updatedRecord };
  },

  getAttendanceHistory({
    employeeId,
    year,
    month,
    status
  }: {
    employeeId: string;
    year?: string;
    month?: string;
    status?: string;
  }): EmployeeAttendanceRecord[] {
    let records = demoDataStore.getEmployeeAttendanceRecords();
    if (employeeId) {
      records = records.filter(
        r => r.employeeId === employeeId || r.employeeId?.toLowerCase() === employeeId.toLowerCase()
      );
    }
    if (year && year !== 'All') {
      records = records.filter(r => r.date.startsWith(year));
    }
    if (month && month !== 'All') {
      const monthPadded = month.length === 1 ? `0${month}` : month;
      records = records.filter(r => {
        const parts = r.date.split('-');
        return parts.length >= 2 && parts[1] === monthPadded;
      });
    }
    if (status && status !== 'All') {
      records = records.filter(r => r.status.toLowerCase() === status.toLowerCase());
    }
    return records.sort((a, b) => b.date.localeCompare(a.date));
  },

  getMonthlySummary(employeeId: string, monthKey?: string, yearKey?: string) {
    let records = demoDataStore.getEmployeeAttendanceRecords();
    if (employeeId) {
      records = records.filter(
        r => r.employeeId === employeeId || r.employeeId?.toLowerCase() === employeeId.toLowerCase()
      );
    }
    if (yearKey && yearKey !== 'All') {
      records = records.filter(r => r.date.startsWith(yearKey));
    }
    if (monthKey && monthKey !== 'All') {
      const monthPadded = monthKey.length === 1 ? `0${monthKey}` : monthKey;
      records = records.filter(r => {
        const parts = r.date.split('-');
        return parts.length >= 2 && parts[1] === monthPadded;
      });
    }

    const presentCount = records.filter(r => r.status === 'Present').length;
    const lateCount = records.filter(r => r.status === 'Late').length;
    const absentCount = records.filter(r => r.status === 'Absent').length;
    const leaveCount = records.filter(r => r.status === 'On Leave').length;
    const halfDayCount = records.filter(r => r.status === 'Half Day').length;

    const totalWorkingMinutes = records.reduce((sum, r) => sum + (r.workingMinutes || 0), 0);
    const totalHours = Math.floor(totalWorkingMinutes / 60);
    const totalMins = totalWorkingMinutes % 60;
    const totalWorkingHoursStr = `${totalHours} hrs ${totalMins} min`;

    const totalWorkingDays = records.length || 24;
    const attendedDays = presentCount + lateCount + halfDayCount * 0.5;
    const pct = totalWorkingDays > 0 ? Math.min(100, (attendedDays / totalWorkingDays) * 100).toFixed(2) : '100.00';

    return {
      monthKey: monthKey || 'Current',
      yearKey: yearKey || '2026',
      totalWorkingDays,
      presentCount,
      lateCount,
      absentCount,
      leaveCount,
      halfDayCount,
      attendancePercentage: parseFloat(pct),
      totalWorkingMinutes,
      totalWorkingHoursStr
    };
  }
};
