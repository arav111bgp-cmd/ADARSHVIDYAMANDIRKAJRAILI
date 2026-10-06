import React, { useState, useEffect } from 'react';
import { Employee, Student } from '../types';
import { Search, ChevronRight, UserCheck } from 'lucide-react';
import { employeeService } from '../services/employeeService';
import { studentService } from '../services/studentService';
import { classService, SCHOOL_CLASSES } from '../services/classService';
import { StudentProfileModal } from '../components/StudentProfileModal';

interface EmployeeStudentsScreenProps {
  employee?: Employee;
}

export const EmployeeStudentsScreen: React.FC<EmployeeStudentsScreenProps> = ({ employee }) => {
  const teacherClasses = classService.getTeacherClasses(employee?.assignedClasses);

  const [selectedClassObj, setSelectedClassObj] = useState(teacherClasses[0] || SCHOOL_CLASSES[5]);
  const [searchQuery, setSearchQuery] = useState('');
  const [studentsList, setStudentsList] = useState<Student[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);

  const fetchStudents = async () => {
    try {
      let data = await employeeService.getStudentsByClass(selectedClassObj.name, selectedClassObj.section);
      if (!data || data.length === 0) {
        const all = await studentService.getAllStudents();
        const normName = selectedClassObj.name.toLowerCase();
        data = all.filter((s) => {
          const sClass = (s.className || '').toLowerCase();
          const matchClass = sClass === normName ||
            sClass === selectedClassObj.grade.toLowerCase() ||
            sClass === selectedClassObj.id.toLowerCase() ||
            (s.className + '-' + s.section).toLowerCase() === normName;
          const matchSec = !selectedClassObj.section || selectedClassObj.section === 'All' || s.section.toLowerCase() === selectedClassObj.section.toLowerCase();
          return matchClass && matchSec;
        });

        // If still empty for this class (e.g. Class 3-A demo), generate dynamic demo records
        if (data.length === 0) {
          const sampleStudents: Student[] = [
            {
              id: `STU-DEMO-3A-1`,
              admissionNo: `AVM2026006`,
              rollNo: 1,
              name: 'Sneha Raj',
              photo: 'https://images.unsplash.com/photo-1544717305-2782549b5136?w=150',
              className: selectedClassObj.name,
              section: selectedClassObj.section,
              dateOfBirth: '14/05/2017',
              gender: 'Female',
              fatherName: 'Hemant Raj',
              fatherOcc: 'Teacher',
              motherName: 'Sandhya Devi',
              phone: '+91 98765 43210',
              address: 'Main Road, Kajraili, Bhagalpur',
              city: 'Bhagalpur',
              district: 'Bhagalpur',
              state: 'Bihar',
              pinCode: '812005',
              bloodGroup: 'O+',
              status: 'Active',
              admissionDate: '05/04/2024',
              previousSchool: 'AVM Primary Wing',
              totalFee: 10000,
              paidFee: 7500,
              pendingFee: 2500,
              transportRequired: true,
              transportBusNo: 'BUS-04',
              transportRoute: 'Route 2 - Kajraili Express'
            },
            {
              id: `STU-DEMO-3A-2`,
              admissionNo: `AVM2026007`,
              rollNo: 2,
              name: 'Aarav Kumar',
              photo: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
              className: selectedClassObj.name,
              section: selectedClassObj.section,
              dateOfBirth: '18/08/2017',
              gender: 'Male',
              fatherName: 'Rajesh Kumar',
              fatherOcc: 'Business',
              motherName: 'Priya Kumar',
              phone: '+91 98123 45678',
              address: 'Station Road, Kajraili',
              city: 'Bhagalpur',
              district: 'Bhagalpur',
              state: 'Bihar',
              pinCode: '812005',
              bloodGroup: 'A+',
              status: 'Active',
              admissionDate: '06/04/2024',
              totalFee: 10000,
              paidFee: 10000,
              pendingFee: 0
            }
          ];
          data = sampleStudents;
        }
      }
      setStudentsList(data);
    } catch (e) {
      console.warn('Failed to fetch students in EmployeeStudentsScreen:', e);
    }
  };

  useEffect(() => {
    fetchStudents();
  }, [selectedClassObj.id]);

  const filteredStudents = studentsList.filter(
    (s) =>
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (s.admissionNo && s.admissionNo.toLowerCase().includes(searchQuery.toLowerCase())) ||
      s.rollNo.toString().includes(searchQuery)
  );

  return (
    <div style={{ padding: '16px 16px 80px 16px', display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div>
        <h2 style={{ fontSize: 18, fontWeight: 800, color: '#172033' }}>Assigned Class Roster</h2>
        <p style={{ fontSize: 12, color: '#667085' }}>
          Teacher: <strong>{employee?.name || 'Mrs. Priya Sharma'}</strong>
        </p>
      </div>

      {/* Class Selector & Search Header Card */}
      <div className="avm-card" style={{ padding: 14, display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <div style={{ flex: 1 }}>
            <label style={{ fontSize: 11, fontWeight: 700, color: '#64748B', display: 'block', marginBottom: 3 }}>
              Assigned Class & Section
            </label>
            <select
              className="avm-input"
              value={selectedClassObj.id}
              onChange={(e) => {
                const found = teacherClasses.find((c) => c.id === e.target.value);
                if (found) setSelectedClassObj(found);
              }}
              style={{ padding: '8px 12px', fontSize: 13, width: '100%' }}
            >
              {teacherClasses.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
        </div>

        <div style={{ position: 'relative' }}>
          <Search size={18} style={{ position: 'absolute', left: 12, top: 11, color: '#94A3B8' }} />
          <input
            type="text"
            className="avm-input"
            style={{ paddingLeft: 38 }}
            placeholder="Search student name, roll or admission no..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Roster Header Banner */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 4px' }}>
        <div style={{ fontSize: 13, fontWeight: 800, color: '#172033' }}>
          {selectedClassObj.name} Student Roster ({filteredStudents.length})
        </div>
        <span style={{ fontSize: 11, fontWeight: 700, color: '#1769E0', backgroundColor: '#EAF3FF', padding: '2px 8px', borderRadius: 8 }}>
          Active Session 2026-27
        </span>
      </div>

      {/* Roster List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {filteredStudents.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 28, color: '#667085', fontSize: 13, backgroundColor: '#FFFFFF', borderRadius: 14, border: '1px dashed #CBD5E1' }}>
            No assigned students found matching "{searchQuery || selectedClassObj.name}".
          </div>
        ) : (
          filteredStudents.map((stu) => (
            <div
              key={stu.id}
              onClick={() => setSelectedStudent(stu)}
              className="avm-card avm-card-interactive"
              style={{
                padding: 14,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                cursor: 'pointer',
                backgroundColor: '#FFFFFF',
                borderRadius: 14,
                border: '1px solid #E2E8F0',
                boxShadow: '0 2px 4px rgba(0,0,0,0.02)'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <img
                  src={stu.photo || 'https://images.unsplash.com/photo-1544717305-2782549b5136?w=150'}
                  alt={stu.name}
                  style={{ width: 48, height: 48, borderRadius: '50%', objectFit: 'cover', border: '2px solid #1769E0' }}
                />
                <div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: '#172033' }}>{stu.name}</div>
                  <div style={{ fontSize: 12, color: '#1769E0', fontWeight: 700, marginTop: 2 }}>
                    Roll No: <strong>{stu.rollNo}</strong> • {classService.formatClassDisplay(stu.className, stu.section)}
                  </div>
                  <div style={{ fontSize: 11, color: '#64748B', marginTop: 1 }}>
                    Admission No: <strong>{stu.admissionNo}</strong>
                  </div>
                </div>
              </div>

              <ChevronRight size={18} color="#94A3B8" />
            </div>
          ))
        )}
      </div>

      {/* Complete Student Profile Modal */}
      <StudentProfileModal
        isOpen={!!selectedStudent}
        onClose={() => setSelectedStudent(null)}
        student={selectedStudent}
        role={employee ? 'employee' : 'admin'}
        onStudentUpdated={() => fetchStudents()}
      />
    </div>
  );
};
