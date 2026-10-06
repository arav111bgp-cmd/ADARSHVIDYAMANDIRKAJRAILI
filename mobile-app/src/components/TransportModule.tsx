import React, { useState, useEffect } from 'react';
import { Bus, Student, StudentTransportAssignment } from '../types';
import { transportService } from '../services/transportService';
import {
  Bus as BusIcon,
  Plus,
  Search,
  Users,
  MapPin,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Printer,
  Edit,
  Trash2,
  ChevronDown,
  ChevronUp,
  X,
  UserPlus,
  DollarSign
} from 'lucide-react';

interface TransportModuleProps {
  students: Student[];
}

export const TransportModule: React.FC<TransportModuleProps> = ({ students }) => {
  const [buses, setBuses] = useState<Bus[]>([]);
  const [assignments, setAssignments] = useState<StudentTransportAssignment[]>([]);

  // Filtering & search states for Buses
  const [busSearch, setBusSearch] = useState('');

  // Selected / Expanded Bus state
  const [expandedBusId, setExpandedBusId] = useState<string | null>(null);

  // Student filtering inside expanded bus
  const [studentSearch, setStudentSearch] = useState('');
  const [selectedVillageFilter, setSelectedVillageFilter] = useState('All');
  const [selectedClassFilter, setSelectedClassFilter] = useState('All');

  // Modals
  const [addBusModalOpen, setAddBusModalOpen] = useState(false);
  const [editingBus, setEditingBus] = useState<Bus | null>(null);

  // Add Student to Bus Modal
  const [addStudentModalOpen, setAddStudentModalOpen] = useState(false);
  const [targetBusIdForStudent, setTargetBusIdForStudent] = useState<string>('');
  const [studentSearchInput, setStudentSearchInput] = useState('');
  const [selectedStudentForBus, setSelectedStudentForBus] = useState<Student | null>(null);

  // Edit Assignment Modal
  const [editingAssignment, setEditingAssignment] = useState<StudentTransportAssignment | null>(null);

  // Bus Form State
  const [busFormNumber, setBusFormNumber] = useState('');
  const [busFormVehicle, setBusFormVehicle] = useState('');
  const [busFormDriver, setBusFormDriver] = useState('');
  const [busFormDriverMobile, setBusFormDriverMobile] = useState('');
  const [busFormCapacity, setBusFormCapacity] = useState<number>(40);
  const [busFormRoute, setBusFormRoute] = useState('');
  const [busFormStatus, setBusFormStatus] = useState<'Active' | 'Inactive' | 'Under Maintenance'>('Active');

  // Transport Assignment Form State
  const [assignVillage, setAssignVillage] = useState('');
  const [assignStop, setAssignStop] = useState('');
  const [assignTime, setAssignTime] = useState('07:15 AM');
  const [assignFee, setAssignFee] = useState<number>(800);
  const [assignStatus, setAssignStatus] = useState<'Active' | 'Inactive'>('Active');

  // Load Data
  const refreshData = () => {
    const loadedBuses = transportService.getBuses();
    const loadedAssignments = transportService.getAssignments();
    setBuses(loadedBuses);
    setAssignments(loadedAssignments);

    // Auto-expand first bus if none expanded
    if (loadedBuses.length > 0 && !expandedBusId) {
      setExpandedBusId(loadedBuses[0].id);
    }
  };

  useEffect(() => {
    refreshData();
  }, []);

  // Summary Metrics
  const totalBuses = buses.length;
  const activeBuses = buses.filter((b) => b.status === 'Active').length;
  const totalStudentsUsingBus = assignments.filter((a) => a.status === 'Active').length;
  const totalCapacity = buses.reduce((acc, b) => acc + (Number(b.capacity) || 0), 0);
  const availableSeats = Math.max(0, totalCapacity - totalStudentsUsingBus);

  // Filtered Buses
  const filteredBuses = buses.filter((b) => {
    const query = busSearch.toLowerCase().trim();
    return (
      !query ||
      b.busNumber.toLowerCase().includes(query) ||
      b.vehicleNumber.toLowerCase().includes(query) ||
      b.driverName.toLowerCase().includes(query)
    );
  });

  // Bus Actions
  const openAddBusModal = () => {
    setEditingBus(null);
    setBusFormNumber(`Bus 0${buses.length + 1}`);
    setBusFormVehicle('');
    setBusFormDriver('');
    setBusFormDriverMobile('');
    setBusFormCapacity(40);
    setBusFormRoute('');
    setBusFormStatus('Active');
    setAddBusModalOpen(true);
  };

  const openEditBusModal = (b: Bus) => {
    setEditingBus(b);
    setBusFormNumber(b.busNumber);
    setBusFormVehicle(b.vehicleNumber);
    setBusFormDriver(b.driverName);
    setBusFormDriverMobile(b.driverMobile || '');
    setBusFormCapacity(b.capacity);
    setBusFormRoute(b.routeArea || '');
    setBusFormStatus(b.status);
    setAddBusModalOpen(true);
  };

  const handleSaveBus = (e: React.FormEvent) => {
    e.preventDefault();
    if (!busFormNumber.trim()) {
      alert('Please enter Bus Name/Number');
      return;
    }
    if (!busFormVehicle.trim()) {
      alert('Please enter Vehicle Number');
      return;
    }

    if (editingBus) {
      transportService.updateBus(editingBus.id, {
        busNumber: busFormNumber.trim(),
        vehicleNumber: busFormVehicle.trim(),
        driverName: busFormDriver.trim() || 'Unassigned',
        driverMobile: busFormDriverMobile.trim(),
        capacity: Number(busFormCapacity) || 40,
        routeArea: busFormRoute.trim(),
        status: busFormStatus
      });
    } else {
      transportService.addBus({
        busNumber: busFormNumber.trim(),
        vehicleNumber: busFormVehicle.trim(),
        driverName: busFormDriver.trim() || 'Unassigned',
        driverMobile: busFormDriverMobile.trim(),
        capacity: Number(busFormCapacity) || 40,
        routeArea: busFormRoute.trim(),
        status: busFormStatus
      });
    }

    setAddBusModalOpen(false);
    refreshData();
  };

  const handleDeleteBus = (bus: Bus) => {
    const res = transportService.deleteBus(bus.id);
    if (!res.success) {
      alert(res.error || 'Cannot delete bus');
      return;
    }
    if (window.confirm(`Are you sure you want to delete ${bus.busNumber} (${bus.vehicleNumber})?`)) {
      refreshData();
      if (expandedBusId === bus.id) {
        setExpandedBusId(null);
      }
    }
  };

  // Add Student to Bus Actions
  const openAddStudentModal = (busId?: string) => {
    const targetId = busId || (buses.length > 0 ? buses[0].id : '');
    setTargetBusIdForStudent(targetId);
    setStudentSearchInput('');
    setSelectedStudentForBus(null);
    setAssignVillage('Kajraili');
    setAssignStop('Kajraili Chowk');
    setAssignTime('07:15 AM');
    setAssignFee(800);
    setAssignStatus('Active');
    setAddStudentModalOpen(true);
  };

  // Search matching students from central Students module
  const searchedStudents = students.filter((s) => {
    if (!studentSearchInput.trim()) return false;
    const q = studentSearchInput.toLowerCase().trim();
    return (
      s.name.toLowerCase().includes(q) ||
      s.admissionNo.toLowerCase().includes(q) ||
      (s.rollNo && s.rollNo.toString().includes(q)) ||
      (s.className && s.className.toLowerCase().includes(q))
    );
  }).slice(0, 5);

  const handleAssignStudentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudentForBus) {
      alert('Please select a student from the search results');
      return;
    }
    if (!targetBusIdForStudent) {
      alert('Please select a target Bus');
      return;
    }

    transportService.assignStudent({
      busId: targetBusIdForStudent,
      studentId: selectedStudentForBus.id,
      studentName: selectedStudentForBus.name,
      admissionNo: selectedStudentForBus.admissionNo,
      className: selectedStudentForBus.className,
      section: selectedStudentForBus.section,
      rollNo: selectedStudentForBus.rollNo,
      village: assignVillage.trim() || 'Local',
      pickupStop: assignStop.trim() || assignVillage.trim() || 'Main Stop',
      pickupTime: assignTime.trim() || '07:15 AM',
      monthlyFee: Number(assignFee) || 800,
      status: assignStatus
    });

    setAddStudentModalOpen(false);
    setExpandedBusId(targetBusIdForStudent);
    refreshData();
  };

  const handleRemoveStudentAssignment = (assignmentId: string, studentName: string) => {
    if (window.confirm(`Remove ${studentName} from this bus? (This will not delete the student from school records)`)) {
      transportService.removeStudentFromBus(assignmentId);
      refreshData();
    }
  };

  const openEditAssignmentModal = (a: StudentTransportAssignment) => {
    setEditingAssignment(a);
    setAssignVillage(a.village);
    setAssignStop(a.pickupStop);
    setAssignTime(a.pickupTime);
    setAssignFee(a.monthlyFee);
    setAssignStatus(a.status);
  };

  const handleUpdateAssignmentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingAssignment) return;
    transportService.updateAssignment(editingAssignment.id, {
      village: assignVillage.trim(),
      pickupStop: assignStop.trim(),
      pickupTime: assignTime.trim(),
      monthlyFee: Number(assignFee),
      status: assignStatus
    });
    setEditingAssignment(null);
    refreshData();
  };

  // Print Bus Student List
  const handlePrintBusList = (bus: Bus) => {
    const busAssignments = assignments.filter((a) => a.busId === bus.id && a.status === 'Active');
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Bus Student List - ${bus.busNumber}</title>
          <style>
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 24px; color: #1e293b; }
            .header { text-align: center; border-bottom: 2px solid #0f172a; padding-bottom: 12px; margin-bottom: 20px; }
            .school-name { font-size: 22px; font-weight: 800; color: #1769e0; margin: 0; }
            .school-sub { font-size: 13px; color: #64748b; margin-top: 4px; }
            .doc-title { font-size: 16px; font-weight: 700; text-transform: uppercase; margin-top: 10px; color: #0f172a; }
            .info-grid { display: flex; justify-content: space-between; background: #f8fafc; padding: 12px 16px; border-radius: 8px; margin-bottom: 20px; font-size: 13px; border: 1px solid #e2e8f0; }
            table { width: 100%; border-collapse: collapse; margin-top: 10px; font-size: 12px; }
            th, td { border: 1px solid #cbd5e1; padding: 8px 12px; text-align: left; }
            th { background-color: #f1f5f9; font-weight: 700; color: #334155; }
            tr:nth-child(even) { background-color: #f8fafc; }
            .footer { margin-top: 30px; display: flex; justify-content: space-between; font-size: 12px; color: #64748b; padding-top: 20px; border-top: 1px dashed #cbd5e1; }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="school-name">ADARSH VIDYA MANDIR</div>
            <div class="school-sub">Kajraili • Bhagalpur | School ERP Transport Management</div>
            <div class="doc-title">BUS PASSENGER STUDENT LIST</div>
          </div>
          <div class="info-grid">
            <div><strong>Bus No:</strong> ${bus.busNumber} | <strong>Vehicle No:</strong> ${bus.vehicleNumber}</div>
            <div><strong>Driver:</strong> ${bus.driverName} (${bus.driverMobile || 'N/A'})</div>
            <div><strong>Total Students:</strong> ${busAssignments.length} / ${bus.capacity}</div>
          </div>
          <table>
            <thead>
              <tr>
                <th style="width:40px">S.No</th>
                <th>Student Name</th>
                <th>Admission No</th>
                <th>Class & Sec</th>
                <th>Roll No</th>
                <th>Village / Area</th>
                <th>Pickup Stop</th>
                <th>Pickup Time</th>
                <th>Monthly Fee</th>
              </tr>
            </thead>
            <tbody>
              ${busAssignments.map((a, idx) => `
                <tr>
                  <td>${idx + 1}</td>
                  <td><strong>${a.studentName}</strong></td>
                  <td>${a.admissionNo}</td>
                  <td>${a.className} - ${a.section}</td>
                  <td>${a.rollNo || '-'}</td>
                  <td>${a.village}</td>
                  <td>${a.pickupStop}</td>
                  <td>${a.pickupTime}</td>
                  <td>₹${a.monthlyFee}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
          <div class="footer">
            <div>Date Generated: ${new Date().toLocaleDateString('en-GB')}</div>
            <div>Authorized Signature: _______________________</div>
          </div>
          <script>
            window.onload = function() { window.print(); }
          </script>
        </body>
      </html>
    `;
    printWindow.document.write(htmlContent);
    printWindow.document.close();
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Header Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#FFFFFF', padding: '16px 20px', borderRadius: 16, border: '1px solid #E2E8F0' }}>
        <div>
          <h2 style={{ fontSize: 22, fontWeight: 900, color: '#0F172A', margin: 0, display: 'flex', alignItems: 'center', gap: 10 }}>
            <BusIcon size={24} color="#1769E0" /> Bus / Transport Management
          </h2>
          <p style={{ fontSize: 13, color: '#64748B', margin: '3px 0 0 0', fontWeight: 600 }}>
            Manage school buses and students travelling by bus.
          </p>
        </div>

        <div style={{ display: 'flex', gap: 10 }}>
          <button
            onClick={() => openAddStudentModal()}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              backgroundColor: '#8B5CF6',
              color: '#FFFFFF',
              border: 'none',
              borderRadius: 10,
              padding: '10px 16px',
              fontSize: 13,
              fontWeight: 700,
              cursor: 'pointer'
            }}
          >
            <UserPlus size={16} /> + Add Student to Bus
          </button>

          <button
            onClick={openAddBusModal}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              backgroundColor: '#1769E0',
              color: '#FFFFFF',
              border: 'none',
              borderRadius: 10,
              padding: '10px 18px',
              fontSize: 13,
              fontWeight: 800,
              cursor: 'pointer',
              boxShadow: '0 4px 12px rgba(23,105,224,0.25)'
            }}
          >
            <Plus size={16} /> + Add Bus
          </button>
        </div>
      </div>

      {/* Summary Metrics Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
        <div className="avm-card" style={{ padding: 18, borderLeft: '4px solid #1769E0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: 12, fontWeight: 700, color: '#64748B' }}>Total Buses</div>
            <div style={{ fontSize: 24, fontWeight: 900, color: '#0F172A', marginTop: 4 }}>{totalBuses}</div>
            <div style={{ fontSize: 11, color: '#16A34A', fontWeight: 700, marginTop: 2 }}>● {activeBuses} Active</div>
          </div>
          <div style={{ width: 42, height: 42, borderRadius: 10, backgroundColor: '#EFF6FF', color: '#1769E0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <BusIcon size={22} />
          </div>
        </div>

        <div className="avm-card" style={{ padding: 18, borderLeft: '4px solid #8B5CF6', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: 12, fontWeight: 700, color: '#64748B' }}>Students Using Bus</div>
            <div style={{ fontSize: 24, fontWeight: 900, color: '#0F172A', marginTop: 4 }}>{totalStudentsUsingBus}</div>
            <div style={{ fontSize: 11, color: '#6B7280', fontWeight: 600, marginTop: 2 }}>Assigned Passengers</div>
          </div>
          <div style={{ width: 42, height: 42, borderRadius: 10, backgroundColor: '#F3E8FF', color: '#8B5CF6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Users size={22} />
          </div>
        </div>

        <div className="avm-card" style={{ padding: 18, borderLeft: '4px solid #16A34A', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: 12, fontWeight: 700, color: '#64748B' }}>Active Buses</div>
            <div style={{ fontSize: 24, fontWeight: 900, color: '#0F172A', marginTop: 4 }}>{activeBuses}</div>
            <div style={{ fontSize: 11, color: '#16A34A', fontWeight: 700, marginTop: 2 }}>Operational</div>
          </div>
          <div style={{ width: 42, height: 42, borderRadius: 10, backgroundColor: '#F0FDF4', color: '#16A34A', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <CheckCircle2 size={22} />
          </div>
        </div>

        <div className="avm-card" style={{ padding: 18, borderLeft: '4px solid #F59E0B', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: 12, fontWeight: 700, color: '#64748B' }}>Available Seats</div>
            <div style={{ fontSize: 24, fontWeight: 900, color: '#0F172A', marginTop: 4 }}>{availableSeats}</div>
            <div style={{ fontSize: 11, color: '#64748B', fontWeight: 600, marginTop: 2 }}>Capacity: {totalCapacity}</div>
          </div>
          <div style={{ width: 42, height: 42, borderRadius: 10, backgroundColor: '#FEF3C7', color: '#D97706', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Clock size={22} />
          </div>
        </div>
      </div>

      {/* Buses & Search Section */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
          <h3 style={{ fontSize: 16, fontWeight: 800, color: '#0F172A', margin: 0 }}>
            School Buses ({filteredBuses.length})
          </h3>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ position: 'relative', width: 260 }}>
              <Search size={16} color="#94A3B8" style={{ position: 'absolute', left: 12, top: 10 }} />
              <input
                type="text"
                placeholder="Search Bus no or vehicle..."
                value={busSearch}
                onChange={(e) => setBusSearch(e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px 12px 8px 36px',
                  borderRadius: 8,
                  border: '1px solid #CBD5E1',
                  fontSize: 13,
                  outline: 'none'
                }}
              />
            </div>
          </div>
        </div>

        {/* Bus Cards List */}
        {filteredBuses.length === 0 ? (
          <div style={{ backgroundColor: '#FFFFFF', padding: 30, textAlign: 'center', borderRadius: 12, border: '1px solid #E2E8F0', color: '#64748B' }}>
            No buses found matching search criteria.
          </div>
        ) : (
          filteredBuses.map((bus) => {
            const busAssignments = assignments.filter((a) => a.busId === bus.id && a.status === 'Active');
            const studentCount = busAssignments.length;
            const freeSeats = Math.max(0, bus.capacity - studentCount);
            const isExpanded = expandedBusId === bus.id;

            // Group students by village / area
            const villagesMap: Record<string, StudentTransportAssignment[]> = {};
            busAssignments.forEach((item) => {
              const vName = item.village || 'Other Area';
              if (!villagesMap[vName]) villagesMap[vName] = [];
              villagesMap[vName].push(item);
            });

            // Filter students inside bus details view
            const filterStudentList = (list: StudentTransportAssignment[]) => {
              return list.filter((s) => {
                const q = studentSearch.toLowerCase().trim();
                const matchesSearch =
                  !q ||
                  (s.studentName && s.studentName.toLowerCase().includes(q)) ||
                  (s.admissionNo && s.admissionNo.toLowerCase().includes(q)) ||
                  (s.pickupStop && s.pickupStop.toLowerCase().includes(q));

                const matchesClass = selectedClassFilter === 'All' || s.className === selectedClassFilter;

                return matchesSearch && matchesClass;
              });
            };

            return (
              <div
                key={bus.id}
                style={{
                  backgroundColor: '#FFFFFF',
                  borderRadius: 14,
                  border: isExpanded ? '2px solid #1769E0' : '1px solid #E2E8F0',
                  boxShadow: isExpanded ? '0 4px 16px rgba(23,105,224,0.08)' : '0 2px 6px rgba(0,0,0,0.02)',
                  overflow: 'hidden',
                  transition: 'all 0.2s ease'
                }}
              >
                {/* Bus Card Main Bar */}
                <div style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                    <div
                      style={{
                        width: 44,
                        height: 44,
                        borderRadius: 10,
                        backgroundColor: isExpanded ? '#1769E0' : '#F1F5F9',
                        color: isExpanded ? '#FFFFFF' : '#1769E0',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                    >
                      <BusIcon size={22} />
                    </div>

                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <span style={{ fontSize: 16, fontWeight: 900, color: '#0F172A' }}>{bus.busNumber}</span>
                        <span
                          style={{
                            fontSize: 11,
                            fontWeight: 700,
                            padding: '2px 8px',
                            borderRadius: 12,
                            backgroundColor: bus.status === 'Active' ? '#DCFCE7' : '#FEE2E2',
                            color: bus.status === 'Active' ? '#15803D' : '#B91C1C'
                          }}
                        >
                          ● {bus.status}
                        </span>
                      </div>
                      <div style={{ fontSize: 12, color: '#64748B', fontWeight: 600, marginTop: 2 }}>
                        Vehicle No: <strong style={{ color: '#334155' }}>{bus.vehicleNumber}</strong>
                        {bus.routeArea && <span> • Route: {bus.routeArea}</span>}
                      </div>
                    </div>
                  </div>

                  {/* Bus Quick Stats Pill */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 20, backgroundColor: '#F8FAFC', padding: '8px 16px', borderRadius: 10, border: '1px solid #F1F5F9' }}>
                    <div>
                      <div style={{ fontSize: 11, color: '#64748B', fontWeight: 600 }}>Driver</div>
                      <div style={{ fontSize: 12, fontWeight: 800, color: '#0F172A' }}>{bus.driverName}</div>
                    </div>

                    <div style={{ borderLeft: '1px solid #E2E8F0', paddingLeft: 16 }}>
                      <div style={{ fontSize: 11, color: '#64748B', fontWeight: 600 }}>Capacity</div>
                      <div style={{ fontSize: 12, fontWeight: 800, color: '#0F172A' }}>{bus.capacity} Seats</div>
                    </div>

                    <div style={{ borderLeft: '1px solid #E2E8F0', paddingLeft: 16 }}>
                      <div style={{ fontSize: 11, color: '#64748B', fontWeight: 600 }}>Students</div>
                      <div style={{ fontSize: 12, fontWeight: 800, color: '#1769E0' }}>{studentCount} Assigned</div>
                    </div>

                    <div style={{ borderLeft: '1px solid #E2E8F0', paddingLeft: 16 }}>
                      <div style={{ fontSize: 11, color: '#64748B', fontWeight: 600 }}>Available</div>
                      <div style={{ fontSize: 12, fontWeight: 800, color: freeSeats > 0 ? '#16A34A' : '#DC2626' }}>
                        {freeSeats} Seats
                      </div>
                    </div>
                  </div>

                  {/* Bus Action Buttons */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <button
                      onClick={() => handlePrintBusList(bus)}
                      title="Print Bus Passenger List"
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6,
                        backgroundColor: '#F1F5F9',
                        color: '#475569',
                        border: '1px solid #CBD5E1',
                        borderRadius: 8,
                        padding: '6px 12px',
                        fontSize: 12,
                        fontWeight: 700,
                        cursor: 'pointer'
                      }}
                    >
                      <Printer size={14} /> Print List
                    </button>

                    <button
                      onClick={() => openEditBusModal(bus)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 4,
                        backgroundColor: '#EFF6FF',
                        color: '#1769E0',
                        border: 'none',
                        borderRadius: 8,
                        padding: '6px 12px',
                        fontSize: 12,
                        fontWeight: 700,
                        cursor: 'pointer'
                      }}
                    >
                      <Edit size={14} /> Edit
                    </button>

                    <button
                      onClick={() => handleDeleteBus(bus)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 4,
                        backgroundColor: '#FEE2E2',
                        color: '#DC2626',
                        border: 'none',
                        borderRadius: 8,
                        padding: '6px 12px',
                        fontSize: 12,
                        fontWeight: 700,
                        cursor: 'pointer'
                      }}
                    >
                      <Trash2 size={14} /> Delete
                    </button>

                    <button
                      onClick={() => setExpandedBusId(isExpanded ? null : bus.id)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6,
                        backgroundColor: isExpanded ? '#1769E0' : '#0F172A',
                        color: '#FFFFFF',
                        border: 'none',
                        borderRadius: 8,
                        padding: '6px 14px',
                        fontSize: 12,
                        fontWeight: 800,
                        cursor: 'pointer'
                      }}
                    >
                      {isExpanded ? (
                        <>
                          Hide Students <ChevronUp size={14} />
                        </>
                      ) : (
                        <>
                          View Students ({studentCount}) <ChevronDown size={14} />
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* EXPANDED BUS DETAILS & STUDENTS LIST GROUPED BY VILLAGE */}
                {isExpanded && (
                  <div style={{ backgroundColor: '#F8FAFC', borderTop: '1px solid #E2E8F0', padding: 20 }}>
                    {/* Bus Inner Header Bar */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 12 }}>
                      <div>
                        <h4 style={{ fontSize: 15, fontWeight: 800, color: '#0F172A', margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span>Students Assigned to {bus.busNumber}</span>
                          <span style={{ fontSize: 12, backgroundColor: '#DBEAFE', color: '#1E40AF', padding: '2px 8px', borderRadius: 12, fontWeight: 700 }}>
                            {Object.keys(villagesMap).length} Villages / Areas
                          </span>
                        </h4>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        {/* Search inside bus */}
                        <div style={{ position: 'relative', width: 220 }}>
                          <Search size={14} color="#94A3B8" style={{ position: 'absolute', left: 10, top: 9 }} />
                          <input
                            type="text"
                            placeholder="Filter student..."
                            value={studentSearch}
                            onChange={(e) => setStudentSearch(e.target.value)}
                            style={{
                              width: '100%',
                              padding: '6px 10px 6px 32px',
                              borderRadius: 6,
                              border: '1px solid #CBD5E1',
                              fontSize: 12,
                              outline: 'none'
                            }}
                          />
                        </div>

                        <button
                          onClick={() => openAddStudentModal(bus.id)}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 6,
                            backgroundColor: '#8B5CF6',
                            color: '#FFFFFF',
                            border: 'none',
                            borderRadius: 8,
                            padding: '7px 14px',
                            fontSize: 12,
                            fontWeight: 800,
                            cursor: 'pointer'
                          }}
                        >
                          <UserPlus size={14} /> + Add Student to This Bus
                        </button>
                      </div>
                    </div>

                    {/* VILLAGE / AREA GROUPED SECTIONS */}
                    {Object.keys(villagesMap).length === 0 ? (
                      <div style={{ backgroundColor: '#FFFFFF', padding: 24, textAlign: 'center', borderRadius: 10, border: '1px dashed #CBD5E1', color: '#64748B' }}>
                        No students currently assigned to this bus. Click <strong>"+ Add Student to This Bus"</strong> to add students.
                      </div>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                        {Object.entries(villagesMap).map(([villageName, villageStudents]) => {
                          const matchingStudents = filterStudentList(villageStudents);
                          if (matchingStudents.length === 0 && studentSearch) return null;

                          return (
                            <div key={villageName} style={{ backgroundColor: '#FFFFFF', borderRadius: 10, border: '1px solid #E2E8F0', overflow: 'hidden' }}>
                              {/* Group Village Header */}
                              <div style={{ backgroundColor: '#F1F5F9', padding: '10px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #E2E8F0' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, fontWeight: 800, color: '#0F172A' }}>
                                  <MapPin size={16} color="#1769E0" />
                                  <span>{villageName}</span>
                                  <span style={{ fontSize: 11, backgroundColor: '#FFFFFF', color: '#475569', padding: '2px 8px', borderRadius: 10, border: '1px solid #CBD5E1', fontWeight: 700 }}>
                                    {villageStudents.length} Students
                                  </span>
                                </div>
                              </div>

                               {/* Student & Staff Table */}
                              <div style={{ overflowX: 'auto' }}>
                                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13, textAlign: 'left' }}>
                                  <thead>
                                    <tr style={{ backgroundColor: '#FAF5FF', color: '#5B21B6', fontSize: 12, borderBottom: '1px solid #E9D5FF' }}>
                                      <th style={{ padding: '10px 14px', width: 40 }}>S.No</th>
                                      <th style={{ padding: '10px 14px' }}>Type</th>
                                      <th style={{ padding: '10px 14px' }}>ID / Adm No</th>
                                      <th style={{ padding: '10px 14px' }}>Passenger Name</th>
                                      <th style={{ padding: '10px 14px' }}>Class / Designation</th>
                                      <th style={{ padding: '10px 14px' }}>Pickup Stop</th>
                                      <th style={{ padding: '10px 14px' }}>Pickup Time</th>
                                      <th style={{ padding: '10px 14px' }}>Monthly Charge</th>
                                      <th style={{ padding: '10px 14px' }}>Status</th>
                                      <th style={{ padding: '10px 14px', textAlign: 'right' }}>Actions</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {matchingStudents.map((st, idx) => {
                                      const isStaffPass = st.isStaff || st.userType === 'Staff' || (st.admissionNo && st.admissionNo.startsWith('EMP'));
                                      return (
                                        <tr key={st.id} style={{ borderBottom: '1px solid #F1F5F9' }}>
                                          <td style={{ padding: '10px 14px', fontWeight: 600, color: '#64748B' }}>{idx + 1}</td>
                                          <td style={{ padding: '10px 14px' }}>
                                            <span style={{
                                              fontSize: 10,
                                              fontWeight: 800,
                                              padding: '2px 8px',
                                              borderRadius: 12,
                                              backgroundColor: isStaffPass ? '#F3E8FF' : '#DBEAFE',
                                              color: isStaffPass ? '#7C3AED' : '#1E40AF',
                                              textTransform: 'uppercase'
                                            }}>
                                              {isStaffPass ? 'Staff' : 'Student'}
                                            </span>
                                          </td>
                                          <td style={{ padding: '10px 14px', fontWeight: 700, color: '#1769E0' }}>{st.admissionNo}</td>
                                          <td style={{ padding: '10px 14px', fontWeight: 800, color: '#0F172A' }}>{st.studentName}</td>
                                          <td style={{ padding: '10px 14px', fontWeight: 600, color: '#334155' }}>
                                            {isStaffPass ? (st.designation || st.className || 'Staff') : `${st.className}${st.section ? ` - ${st.section}` : ''}`}
                                          </td>
                                          <td style={{ padding: '10px 14px', fontWeight: 600, color: '#334155' }}>{st.pickupStop}</td>
                                          <td style={{ padding: '10px 14px', color: '#64748B' }}>
                                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                                              <Clock size={12} color="#8B5CF6" /> {st.pickupTime}
                                            </span>
                                          </td>
                                          <td style={{ padding: '10px 14px', fontWeight: 800, color: '#16A34A' }}>₹{st.monthlyFee}</td>
                                          <td style={{ padding: '10px 14px' }}>
                                            <span style={{ fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 10, backgroundColor: st.status === 'Active' ? '#DCFCE7' : '#FEE2E2', color: st.status === 'Active' ? '#15803D' : '#B91C1C' }}>
                                              ● {st.status}
                                            </span>
                                          </td>
                                          <td style={{ padding: '10px 14px', textAlign: 'right' }}>
                                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 6 }}>
                                              <button
                                                onClick={() => openEditAssignmentModal(st)}
                                                title="Edit Transport Info"
                                                style={{ backgroundColor: '#F1F5F9', color: '#475569', border: 'none', borderRadius: 6, padding: '4px 8px', cursor: 'pointer' }}
                                              >
                                                <Edit size={13} />
                                              </button>
                                              <button
                                                onClick={() => handleRemoveStudentAssignment(st.id, st.studentName || 'Passenger')}
                                                title="Remove from Bus"
                                                style={{ backgroundColor: '#FEE2E2', color: '#DC2626', border: 'none', borderRadius: 6, padding: '4px 8px', cursor: 'pointer' }}
                                              >
                                                <Trash2 size={13} />
                                              </button>
                                            </div>
                                          </td>
                                        </tr>
                                      );
                                    })}
                                  </tbody>
                                </table>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* MODAL 1: ADD / EDIT BUS */}
      {addBusModalOpen && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(15, 23, 42, 0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div style={{ backgroundColor: '#FFFFFF', borderRadius: 16, width: '100%', maxWidth: 500, boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)', overflow: 'hidden' }}>
            <div style={{ padding: '16px 20px', backgroundColor: '#0F172A', color: '#FFFFFF', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ fontSize: 16, fontWeight: 800, margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
                <BusIcon size={18} /> {editingBus ? 'Edit Bus Details' : 'Add New School Bus'}
              </h3>
              <button onClick={() => setAddBusModalOpen(false)} style={{ background: 'none', border: 'none', color: '#94A3B8', cursor: 'pointer' }}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveBus} style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 700, color: '#334155', display: 'block', marginBottom: 4 }}>Bus Name / Number *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Bus 01"
                    value={busFormNumber}
                    onChange={(e) => setBusFormNumber(e.target.value)}
                    style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid #CBD5E1', fontSize: 13 }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: 12, fontWeight: 700, color: '#334155', display: 'block', marginBottom: 4 }}>Vehicle Number *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. BR09R5292"
                    value={busFormVehicle}
                    onChange={(e) => setBusFormVehicle(e.target.value)}
                    style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid #CBD5E1', fontSize: 13 }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 700, color: '#334155', display: 'block', marginBottom: 4 }}>Driver Name</label>
                  <input
                    type="text"
                    placeholder="e.g. Raj Kumar"
                    value={busFormDriver}
                    onChange={(e) => setBusFormDriver(e.target.value)}
                    style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid #CBD5E1', fontSize: 13 }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: 12, fontWeight: 700, color: '#334155', display: 'block', marginBottom: 4 }}>Driver Mobile</label>
                  <input
                    type="text"
                    placeholder="e.g. 9876543210"
                    value={busFormDriverMobile}
                    onChange={(e) => setBusFormDriverMobile(e.target.value)}
                    style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid #CBD5E1', fontSize: 13 }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 700, color: '#334155', display: 'block', marginBottom: 4 }}>Seat Capacity</label>
                  <input
                    type="number"
                    min="5"
                    max="100"
                    value={busFormCapacity}
                    onChange={(e) => setBusFormCapacity(Number(e.target.value))}
                    style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid #CBD5E1', fontSize: 13 }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: 12, fontWeight: 700, color: '#334155', display: 'block', marginBottom: 4 }}>Status</label>
                  <select
                    value={busFormStatus}
                    onChange={(e: any) => setBusFormStatus(e.target.value)}
                    style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid #CBD5E1', fontSize: 13 }}
                  >
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                    <option value="Under Maintenance">Under Maintenance</option>
                  </select>
                </div>
              </div>

              <div>
                <label style={{ fontSize: 12, fontWeight: 700, color: '#334155', display: 'block', marginBottom: 4 }}>Route / Area (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. Kajraili → School"
                  value={busFormRoute}
                  onChange={(e) => setBusFormRoute(e.target.value)}
                  style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid #CBD5E1', fontSize: 13 }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 10 }}>
                <button
                  type="button"
                  onClick={() => setAddBusModalOpen(false)}
                  style={{ backgroundColor: '#F1F5F9', color: '#475569', border: 'none', borderRadius: 8, padding: '8px 16px', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{ backgroundColor: '#1769E0', color: '#FFFFFF', border: 'none', borderRadius: 8, padding: '8px 20px', fontSize: 13, fontWeight: 800, cursor: 'pointer' }}
                >
                  {editingBus ? 'Save Changes' : 'Create Bus'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: ADD STUDENT TO BUS (SEARCHING CENTRAL STUDENTS) */}
      {addStudentModalOpen && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(15, 23, 42, 0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div style={{ backgroundColor: '#FFFFFF', borderRadius: 16, width: '100%', maxWidth: 540, boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)', overflow: 'hidden' }}>
            <div style={{ padding: '16px 20px', backgroundColor: '#8B5CF6', color: '#FFFFFF', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ fontSize: 16, fontWeight: 800, margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
                <UserPlus size={18} /> Add Student to School Bus
              </h3>
              <button onClick={() => setAddStudentModalOpen(false)} style={{ background: 'none', border: 'none', color: '#E9D5FF', cursor: 'pointer' }}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleAssignStudentSubmit} style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 14 }}>
              {/* Step 1: Select Bus */}
              <div>
                <label style={{ fontSize: 12, fontWeight: 700, color: '#334155', display: 'block', marginBottom: 4 }}>Select Bus *</label>
                <select
                  value={targetBusIdForStudent}
                  onChange={(e) => setTargetBusIdForStudent(e.target.value)}
                  style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid #CBD5E1', fontSize: 13, fontWeight: 700 }}
                >
                  {buses.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.busNumber} ({b.vehicleNumber}) - Driver: {b.driverName}
                    </option>
                  ))}
                </select>
              </div>

              {/* Step 2: Search Student from Central Master */}
              <div>
                <label style={{ fontSize: 12, fontWeight: 700, color: '#334155', display: 'block', marginBottom: 4 }}>Search Student from School Roster *</label>
                <div style={{ position: 'relative' }}>
                  <Search size={16} color="#94A3B8" style={{ position: 'absolute', left: 10, top: 10 }} />
                  <input
                    type="text"
                    placeholder="Type student name, admission no, or roll no..."
                    value={studentSearchInput}
                    onChange={(e) => setStudentSearchInput(e.target.value)}
                    style={{ width: '100%', padding: '8px 12px 8px 34px', borderRadius: 8, border: '1px solid #CBD5E1', fontSize: 13 }}
                  />
                </div>

                {/* Dropdown Suggestions */}
                {studentSearchInput.trim() && !selectedStudentForBus && (
                  <div style={{ marginTop: 4, backgroundColor: '#FFFFFF', border: '1px solid #CBD5E1', borderRadius: 8, maxHeight: 160, overflowY: 'auto', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' }}>
                    {searchedStudents.length === 0 ? (
                      <div style={{ padding: 12, fontSize: 12, color: '#64748B', textAlign: 'center' }}>No matching students found in Students module.</div>
                    ) : (
                      searchedStudents.map((s) => (
                        <div
                          key={s.id}
                          onClick={() => {
                            setSelectedStudentForBus(s);
                            setStudentSearchInput(s.name);
                          }}
                          style={{ padding: '8px 12px', borderBottom: '1px solid #F1F5F9', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                        >
                          <div>
                            <strong style={{ fontSize: 13, color: '#0F172A' }}>{s.name}</strong>
                            <div style={{ fontSize: 11, color: '#64748B' }}>Adm: {s.admissionNo} • {s.className}-{s.section}</div>
                          </div>
                          <span style={{ fontSize: 11, backgroundColor: '#EFF6FF', color: '#1769E0', padding: '2px 8px', borderRadius: 6, fontWeight: 700 }}>Select</span>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>

              {/* Selected Student Card */}
              {selectedStudentForBus && (
                <div style={{ backgroundColor: '#F5F3FF', padding: 12, borderRadius: 10, border: '1px solid #DDD6FE', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 800, color: '#5B21B6' }}>✓ {selectedStudentForBus.name}</div>
                    <div style={{ fontSize: 11, color: '#6D28D9', marginTop: 2 }}>
                      Admission No: {selectedStudentForBus.admissionNo} • Class {selectedStudentForBus.className}-{selectedStudentForBus.section} (Roll: {selectedStudentForBus.rollNo || '-'})
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedStudentForBus(null);
                      setStudentSearchInput('');
                    }}
                    style={{ backgroundColor: '#FFFFFF', color: '#DC2626', border: '1px solid #FECDD3', borderRadius: 6, padding: '2px 8px', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}
                  >
                    Change
                  </button>
                </div>
              )}

              {/* Transport Specific Details */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 700, color: '#334155', display: 'block', marginBottom: 4 }}>Village / Area *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Kajraili"
                    value={assignVillage}
                    onChange={(e) => setAssignVillage(e.target.value)}
                    style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid #CBD5E1', fontSize: 13 }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: 12, fontWeight: 700, color: '#334155', display: 'block', marginBottom: 4 }}>Pickup Stop *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Kajraili Chowk"
                    value={assignStop}
                    onChange={(e) => setAssignStop(e.target.value)}
                    style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid #CBD5E1', fontSize: 13 }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 700, color: '#334155', display: 'block', marginBottom: 4 }}>Pickup Time</label>
                  <input
                    type="text"
                    placeholder="e.g. 07:15 AM"
                    value={assignTime}
                    onChange={(e) => setAssignTime(e.target.value)}
                    style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid #CBD5E1', fontSize: 13 }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: 12, fontWeight: 700, color: '#334155', display: 'block', marginBottom: 4 }}>Monthly Transport Fee (₹)</label>
                  <input
                    type="number"
                    value={assignFee}
                    onChange={(e) => setAssignFee(Number(e.target.value))}
                    style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid #CBD5E1', fontSize: 13 }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 10 }}>
                <button
                  type="button"
                  onClick={() => setAddStudentModalOpen(false)}
                  style={{ backgroundColor: '#F1F5F9', color: '#475569', border: 'none', borderRadius: 8, padding: '8px 16px', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!selectedStudentForBus}
                  style={{
                    backgroundColor: selectedStudentForBus ? '#8B5CF6' : '#CBD5E1',
                    color: '#FFFFFF',
                    border: 'none',
                    borderRadius: 8,
                    padding: '8px 20px',
                    fontSize: 13,
                    fontWeight: 800,
                    cursor: selectedStudentForBus ? 'pointer' : 'not-allowed'
                  }}
                >
                  Add Student to Bus
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: EDIT TRANSPORT ASSIGNMENT */}
      {editingAssignment && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(15, 23, 42, 0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div style={{ backgroundColor: '#FFFFFF', borderRadius: 16, width: '100%', maxWidth: 450, boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)', overflow: 'hidden' }}>
            <div style={{ padding: '16px 20px', backgroundColor: '#0F172A', color: '#FFFFFF', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ fontSize: 15, fontWeight: 800, margin: 0 }}>Edit Transport: {editingAssignment.studentName}</h3>
              <button onClick={() => setEditingAssignment(null)} style={{ background: 'none', border: 'none', color: '#94A3B8', cursor: 'pointer' }}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleUpdateAssignmentSubmit} style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div>
                <label style={{ fontSize: 12, fontWeight: 700, color: '#334155', display: 'block', marginBottom: 4 }}>Village / Area</label>
                <input
                  type="text"
                  value={assignVillage}
                  onChange={(e) => setAssignVillage(e.target.value)}
                  style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid #CBD5E1', fontSize: 13 }}
                />
              </div>

              <div>
                <label style={{ fontSize: 12, fontWeight: 700, color: '#334155', display: 'block', marginBottom: 4 }}>Pickup Stop</label>
                <input
                  type="text"
                  value={assignStop}
                  onChange={(e) => setAssignStop(e.target.value)}
                  style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid #CBD5E1', fontSize: 13 }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 700, color: '#334155', display: 'block', marginBottom: 4 }}>Pickup Time</label>
                  <input
                    type="text"
                    value={assignTime}
                    onChange={(e) => setAssignTime(e.target.value)}
                    style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid #CBD5E1', fontSize: 13 }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: 12, fontWeight: 700, color: '#334155', display: 'block', marginBottom: 4 }}>Monthly Fee (₹)</label>
                  <input
                    type="number"
                    value={assignFee}
                    onChange={(e) => setAssignFee(Number(e.target.value))}
                    style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid #CBD5E1', fontSize: 13 }}
                  />
                </div>
              </div>

              <div>
                <label style={{ fontSize: 12, fontWeight: 700, color: '#334155', display: 'block', marginBottom: 4 }}>Status</label>
                <select
                  value={assignStatus}
                  onChange={(e: any) => setAssignStatus(e.target.value)}
                  style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid #CBD5E1', fontSize: 13 }}
                >
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                </select>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 10 }}>
                <button
                  type="button"
                  onClick={() => setEditingAssignment(null)}
                  style={{ backgroundColor: '#F1F5F9', color: '#475569', border: 'none', borderRadius: 8, padding: '8px 16px', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{ backgroundColor: '#1769E0', color: '#FFFFFF', border: 'none', borderRadius: 8, padding: '8px 20px', fontSize: 13, fontWeight: 800, cursor: 'pointer' }}
                >
                  Update Details
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
