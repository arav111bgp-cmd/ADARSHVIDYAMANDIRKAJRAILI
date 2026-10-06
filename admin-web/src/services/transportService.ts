import { Bus, StudentTransportAssignment } from '../types';
import { demoDataStore } from './demoDataStore';
import { notificationService } from './notificationService';

const DEFAULT_BUSES: Bus[] = [
  {
    id: 'BUS-01',
    busNumber: 'Bus 01',
    vehicleNumber: 'BR09R5292',
    driverName: 'Raj Kumar',
    driverMobile: '9876543210',
    conductorName: 'Amit Kumar',
    capacity: 40,
    status: 'Active',
    routeArea: 'Kajraili → School'
  },
  {
    id: 'BUS-02',
    busNumber: 'Bus 02',
    vehicleNumber: 'BR10AV2652',
    driverName: 'Suresh Prasad',
    driverMobile: '9876543211',
    conductorName: 'Ramesh Kumar',
    capacity: 40,
    status: 'Active',
    routeArea: 'Amarpur → School'
  },
  {
    id: 'BUS-03',
    busNumber: 'Bus 03',
    vehicleNumber: 'BR10PB3455',
    driverName: 'Mohan Singh',
    driverMobile: '9876543212',
    conductorName: 'Vikas Verma',
    capacity: 30,
    status: 'Active',
    routeArea: 'Nathnagar → School'
  }
];

const DEFAULT_ASSIGNMENTS: StudentTransportAssignment[] = [
  {
    id: 'TA-101',
    busId: 'BUS-01',
    studentId: 'STU-101',
    studentName: 'Rahul Kumar',
    admissionNo: 'AVM2026001',
    className: 'Class 5',
    section: 'A',
    rollNo: 12,
    village: 'Kajraili',
    pickupStop: 'Kajraili Chowk',
    pickupTime: '07:15 AM',
    monthlyFee: 800,
    status: 'Active'
  },
  {
    id: 'TA-102',
    busId: 'BUS-01',
    studentId: 'STU-102',
    studentName: 'Suman Gupta',
    admissionNo: 'AVM2026002',
    className: 'Class 5',
    section: 'A',
    rollNo: 15,
    village: 'Kajraili',
    pickupStop: 'Kajraili Market',
    pickupTime: '07:15 AM',
    monthlyFee: 800,
    status: 'Active'
  },
  {
    id: 'TA-103',
    busId: 'BUS-01',
    studentId: 'STU-103',
    studentName: 'Priya Kumari',
    admissionNo: 'AVM2026003',
    className: 'Class 6',
    section: 'B',
    rollNo: 8,
    village: 'Kajraili',
    pickupStop: 'Kajraili Petrol Pump',
    pickupTime: '07:15 AM',
    monthlyFee: 900,
    status: 'Active'
  },
  {
    id: 'TA-104',
    busId: 'BUS-01',
    studentId: 'STU-104',
    studentName: 'Ananya Verma',
    admissionNo: 'AVM20260519',
    className: 'Class 5',
    section: 'A',
    rollNo: 19,
    village: 'Amarpur',
    pickupStop: 'Amarpur More',
    pickupTime: '07:25 AM',
    monthlyFee: 850,
    status: 'Active'
  },
  {
    id: 'TA-105',
    busId: 'BUS-01',
    studentId: 'STU-105',
    studentName: 'Amit Sharma',
    admissionNo: 'AVM20260520',
    className: 'Class 6',
    section: 'A',
    rollNo: 12,
    village: 'Nathnagar',
    pickupStop: 'Nathnagar Station',
    pickupTime: '07:10 AM',
    monthlyFee: 750,
    status: 'Active'
  },
  {
    id: 'TA-106',
    busId: 'BUS-02',
    studentId: 'STU-106',
    studentName: 'Rohan Singh',
    admissionNo: 'AVM2026006',
    className: 'Class 7',
    section: 'A',
    rollNo: 5,
    village: 'Amarpur',
    pickupStop: 'Amarpur Market',
    pickupTime: '07:30 AM',
    monthlyFee: 850,
    status: 'Active'
  },
  {
    id: 'TA-107',
    busId: 'BUS-03',
    studentId: 'STU-107',
    studentName: 'Kavya Singh',
    admissionNo: 'AVM2026007',
    className: 'Class 8',
    section: 'B',
    rollNo: 14,
    village: 'Nathnagar',
    pickupStop: 'Nathnagar Chowk',
    pickupTime: '07:15 AM',
    monthlyFee: 750,
    status: 'Active'
  }
];

export const transportService = {
  getBuses(): Bus[] {
    const db = demoDataStore.getDB();
    if (!db.buses || db.buses.length === 0) {
      db.buses = [...DEFAULT_BUSES];
      demoDataStore.saveDB(db);
    }
    return db.buses;
  },

  getAssignments(): StudentTransportAssignment[] {
    const db = demoDataStore.getDB();
    if (!db.studentTransportAssignments || db.studentTransportAssignments.length === 0) {
      db.studentTransportAssignments = [...DEFAULT_ASSIGNMENTS];
      demoDataStore.saveDB(db);
    }
    return db.studentTransportAssignments;
  },

  addBus(busData: Partial<Bus>): Bus {
    const db = demoDataStore.getDB();
    const buses = this.getBuses();
    const newBus: Bus = {
      id: `BUS-${Date.now()}`,
      busNumber: busData.busNumber || `Bus 0${buses.length + 1}`,
      vehicleNumber: busData.vehicleNumber || 'BR09XXXX',
      driverName: busData.driverName || 'Driver Name',
      driverMobile: busData.driverMobile || '',
      conductorName: busData.conductorName || '',
      capacity: Number(busData.capacity) || 40,
      status: busData.status || 'Active',
      routeArea: busData.routeArea || '',
      notes: busData.notes || ''
    };
    db.buses = [newBus, ...buses];
    demoDataStore.saveDB(db);
    return newBus;
  },

  updateBus(busId: string, updates: Partial<Bus>): Bus | null {
    const db = demoDataStore.getDB();
    const buses = this.getBuses();
    const idx = buses.findIndex((b) => b.id === busId);
    if (idx === -1) return null;
    buses[idx] = { ...buses[idx], ...updates };
    db.buses = [...buses];
    demoDataStore.saveDB(db);
    return buses[idx];
  },

  deleteBus(busId: string): { success: boolean; error?: string } {
    const db = demoDataStore.getDB();
    const assignments = this.getAssignments().filter((a) => a.busId === busId);
    if (assignments.length > 0) {
      return {
        success: false,
        error: `This bus currently has ${assignments.length} student(s) assigned. Please remove/reassign students before deleting.`
      };
    }
    db.buses = this.getBuses().filter((b) => b.id !== busId);
    demoDataStore.saveDB(db);
    return { success: true };
  },

  assignStudent(assignmentData: Partial<StudentTransportAssignment>): StudentTransportAssignment {
    const db = demoDataStore.getDB();
    const assignments = this.getAssignments();

    // Check if student already assigned to a bus; if so, update existing or create new
    const existingIdx = assignments.findIndex(
      (a) => a.studentId === assignmentData.studentId && a.busId === assignmentData.busId
    );

    const newAssignment: StudentTransportAssignment = {
      id: existingIdx !== -1 ? assignments[existingIdx].id : `TA-${Date.now()}`,
      busId: assignmentData.busId || '',
      studentId: assignmentData.studentId || '',
      studentName: assignmentData.studentName || '',
      admissionNo: assignmentData.admissionNo || '',
      className: assignmentData.className || '',
      section: assignmentData.section || '',
      rollNo: assignmentData.rollNo || 0,
      village: assignmentData.village || 'Local',
      pickupStop: assignmentData.pickupStop || assignmentData.village || 'School Stop',
      pickupTime: assignmentData.pickupTime || '07:15 AM',
      monthlyFee: Number(assignmentData.monthlyFee) || 800,
      status: assignmentData.status || 'Active'
    };

    if (existingIdx !== -1) {
      assignments[existingIdx] = newAssignment;
      db.studentTransportAssignments = [...assignments];
    } else {
      db.studentTransportAssignments = [newAssignment, ...assignments];
    }
    demoDataStore.saveDB(db);

    try {
      notificationService.notifyTransportAssigned(
        newAssignment.studentName || 'Student',
        newAssignment.busId,
        newAssignment.pickupStop || 'School Bus Stop'
      );
    } catch (e) {}

    return newAssignment;
  },

  updateAssignment(id: string, updates: Partial<StudentTransportAssignment>): StudentTransportAssignment | null {
    const db = demoDataStore.getDB();
    const assignments = this.getAssignments();
    const idx = assignments.findIndex((a) => a.id === id);
    if (idx === -1) return null;
    assignments[idx] = { ...assignments[idx], ...updates };
    db.studentTransportAssignments = [...assignments];
    demoDataStore.saveDB(db);
    return assignments[idx];
  },

  removeStudentFromBus(assignmentId: string): boolean {
    const db = demoDataStore.getDB();
    const assignments = this.getAssignments().filter((a) => a.id !== assignmentId);
    db.studentTransportAssignments = assignments;
    demoDataStore.saveDB(db);
    return true;
  }
};
