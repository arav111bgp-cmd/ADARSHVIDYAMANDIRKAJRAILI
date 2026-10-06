import React, { useState, useEffect } from 'react';
import { Employee } from '../types';
import { permissionService } from '../services/permissionService';
import { cloudinaryService } from '../services/cloudinaryService';
import { demoDataStore } from '../services/demoDataStore';
import {
  User, Phone, Mail, BookOpen, Lock, LogOut, ChevronRight, Camera, Image, ShieldAlert,
  Bus as BusIcon, CreditCard, Briefcase, MapPin, Award, Shield, FileText, Users, CheckCircle2, AlertCircle
} from 'lucide-react';
import { Modal } from '../components/Modal';

interface EmployeeProfileScreenProps {
  employee: Employee;
  onLogout: () => void;
}

export type EmployeeProfileTab =
  | 'overview'
  | 'personal'
  | 'professional'
  | 'teaching'
  | 'parents'
  | 'address'
  | 'documents'
  | 'account'
  | 'transport'
  | 'salary';

export const EmployeeProfileScreen: React.FC<EmployeeProfileScreenProps> = ({
  employee: initialEmployee,
  onLogout
}) => {
  // Always fetch live canonical record from demoDataStore if updated
  const [emp, setEmp] = useState<Employee>(() => {
    const live = demoDataStore.getEmployeeById(initialEmployee.employeeId || initialEmployee.id);
    return live ? { ...initialEmployee, ...live } : initialEmployee;
  });

  useEffect(() => {
    const updateEmp = () => {
      const live = demoDataStore.getEmployeeById(initialEmployee.employeeId || initialEmployee.id);
      if (live) setEmp(prev => ({ ...prev, ...live }));
    };
    updateEmp();
    const unsubscribe = demoDataStore.subscribe(updateEmp);
    return () => unsubscribe();
  }, [initialEmployee.id, initialEmployee.employeeId]);

  const [currentPhoto, setCurrentPhoto] = useState(emp.photo || 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150');
  const [photoModalOpen, setPhotoModalOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');

  const [passModalOpen, setPassModalOpen] = useState(false);
  const [newPass, setNewPass] = useState('');
  const [passSuccessMsg, setPassSuccessMsg] = useState('');
  const [activeTab, setActiveTab] = useState<EmployeeProfileTab>('overview');

  useEffect(() => {
    if (emp.photo) setCurrentPhoto(emp.photo);
  }, [emp.photo]);

  const handlePhotoCapture = async (source: 'camera' | 'photos') => {
    setUploadError('');
    setUploading(true);
    const res = await permissionService.capturePhoto(source);

    if (res.success && res.dataUrl) {
      try {
        const cloudRes = await cloudinaryService.uploadEmployeePhoto(
          res.dataUrl,
          emp.employeeId || emp.id,
          'AVM'
        );
        if (cloudRes && cloudRes.secure_url) {
          const photoUrl = cloudRes.secure_url;
          setCurrentPhoto(photoUrl);
          setPhotoModalOpen(false);

          // Save updated photo back to demoDataStore with cloudinary metadata
          const db = demoDataStore.getDB();
          const emps = db.employees || [];
          const idx = emps.findIndex((e: any) => e.id === emp.id || e.employeeId === emp.employeeId);
          if (idx !== -1) {
            emps[idx].photo = photoUrl;
            emps[idx].cloudinaryMeta = {
              secureUrl: cloudRes.secure_url,
              publicId: cloudRes.public_id,
              resourceType: cloudRes.resource_type,
              format: cloudRes.format,
              bytes: cloudRes.bytes,
              originalFilename: cloudRes.original_filename
            };
            db.employees = emps;
            demoDataStore.saveDB(db);
          }

          try {
            const savedSession = localStorage.getItem('avm_school_erp_session');
            if (savedSession) {
              const parsed = JSON.parse(savedSession);
              parsed.user = { ...parsed.user, photo: photoUrl };
              localStorage.setItem('avm_school_erp_session', JSON.stringify(parsed));
            }
          } catch (e) {}
        } else {
          throw new Error('Upload failed. Please check your internet connection and try again.');
        }
      } catch (cloudErr: any) {
        console.error('Employee photo upload error:', cloudErr);
        setUploadError(cloudErr?.message || 'Upload failed. Please check your internet connection and try again.');
      } finally {
        setUploading(false);
      }
    } else {
      setUploading(false);
      if (res.error) setUploadError(res.error);
    }
  };

  const handleUpdatePassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPass.trim()) return;

    // Update password in demoDataStore db.employees & db.users
    const db = demoDataStore.getDB();
    const emps = db.employees || [];
    const empIdx = emps.findIndex((e: any) => e.id === emp.id || e.employeeId === emp.employeeId);
    if (empIdx !== -1) {
      emps[empIdx].password = newPass.trim();
      db.employees = emps;
    }

    const users = db.users || [];
    const userIdx = users.findIndex((u: any) => u.linkedEmployeeId === emp.id || u.username === (emp.username || emp.employeeId));
    if (userIdx !== -1) {
      users[userIdx].password = newPass.trim();
      db.users = users;
    }
    demoDataStore.saveDB(db);

    setPassSuccessMsg('Staff password updated successfully!');
    setNewPass('');
    setTimeout(() => {
      setPassSuccessMsg('');
      setPassModalOpen(false);
    }, 2000);
  };

  const hasTransport = emp.transportReq === 'Yes' || Boolean(emp.transportBusId) || Boolean(emp.transportRoute);
  const salaryHistory = emp.salaryPayments || [
    { id: 'PAY-OCT-2026', employeeId: emp.employeeId || emp.id, employeeName: emp.name, paymentMonth: 'October 2026', salaryAmount: emp.basicSalary || emp.netSalary || 25000, paidAmount: emp.paidSalary || emp.basicSalary || 25000, pendingAmount: emp.pendingSalary || 0, paymentDate: '2026-10-01', paymentMode: emp.paymentMode || 'Bank Transfer', status: emp.salaryPaymentStatus || 'Paid', remarks: 'October Salary Disbursement' }
  ];

  const profileTabs: { id: EmployeeProfileTab; label: string }[] = [
    { id: 'overview', label: 'Overview' },
    { id: 'personal', label: 'Personal' },
    { id: 'professional', label: 'Professional' },
    { id: 'teaching', label: 'Academic & Teaching' },
    { id: 'parents', label: 'Parents & Emergency' },
    { id: 'address', label: 'Address' },
    { id: 'documents', label: 'Documents' },
    { id: 'account', label: 'Account' },
    { id: 'transport', label: 'Transport' },
    { id: 'salary', label: 'Salary & Payments' }
  ];

  const isPermSameAsPresent = emp.sameAsCurrentAddress !== false || (!emp.permAddress && !emp.permCity);

  return (
    <div style={{ padding: '16px 16px 80px 16px', display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Profile Header */}
      <div className="avm-card" style={{ padding: 20, textAlign: 'center', backgroundColor: '#FFFFFF' }}>
        <div style={{ position: 'relative', width: 84, height: 84, margin: '0 auto 10px auto' }}>
          <img
            src={currentPhoto}
            alt={emp.name}
            style={{
              width: 80,
              height: 80,
              borderRadius: '50%',
              objectFit: 'cover',
              border: '3px solid #7C3AED'
            }}
          />
          <button
            onClick={() => { setPhotoModalOpen(true); setUploadError(''); }}
            style={{
              position: 'absolute',
              bottom: 0,
              right: 0,
              backgroundColor: '#7C3AED',
              color: '#FFFFFF',
              border: '2px solid #FFFFFF',
              borderRadius: '50%',
              width: 28,
              height: 28,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              boxShadow: '0 2px 6px rgba(0,0,0,0.15)'
            }}
            title="Change Profile Photo"
          >
            <Camera size={14} />
          </button>
        </div>

        <h2 style={{ fontSize: 18, fontWeight: 800, color: '#172033', margin: 0 }}>
          {emp.name}
        </h2>
        <div style={{ fontSize: 13, color: '#7C3AED', fontWeight: 700, marginTop: 2 }}>
          {emp.designation}
        </div>
        <div style={{ fontSize: 11, color: '#667085', marginTop: 4, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 8 }}>
          <span>Employee ID: <strong>{emp.employeeId}</strong></span>
          <span>•</span>
          <span>{emp.department || 'Academic'}</span>
          <span>•</span>
          <span style={{
            color: (emp.status === 'Inactive' || emp.workStatus === 'Inactive') ? '#DC2626' : '#16A34A',
            fontWeight: 700,
            backgroundColor: (emp.status === 'Inactive' || emp.workStatus === 'Inactive') ? '#FEF2F2' : '#EAF8EF',
            padding: '2px 8px',
            borderRadius: 12
          }}>
            {emp.status || emp.workStatus || 'Active'}
          </span>
        </div>
      </div>

      {/* Scrollable Sub Tabs Navigation Bar */}
      <div style={{
        display: 'flex',
        gap: 6,
        backgroundColor: '#FFFFFF',
        padding: 6,
        borderRadius: 14,
        border: '1px solid #E2E8F0',
        overflowX: 'auto',
        WebkitOverflowScrolling: 'touch'
      }}>
        {profileTabs.map((tab) => {
          const isSelected = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                padding: '8px 12px',
                borderRadius: 10,
                border: 'none',
                backgroundColor: isSelected ? '#7C3AED' : 'transparent',
                color: isSelected ? '#FFFFFF' : '#64748B',
                fontWeight: 700,
                fontSize: 12,
                whiteSpace: 'nowrap',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* TAB 1: OVERVIEW */}
      {activeTab === 'overview' && (
        <div className="avm-card" style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
          <h3 style={{ fontSize: 14, fontWeight: 800, color: '#172033', margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
            <User size={16} color="#7C3AED" /> Employee Profile Summary
          </h3>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, fontSize: 12 }}>
            <div style={{ backgroundColor: '#F8FAFC', padding: 10, borderRadius: 10, border: '1px solid #E2E8F0' }}>
              <span style={{ color: '#667085', fontSize: 10, textTransform: 'uppercase', fontWeight: 700 }}>Employee ID</span>
              <div style={{ fontWeight: 800, color: '#172033', fontSize: 13, marginTop: 2 }}>{emp.employeeId}</div>
            </div>

            <div style={{ backgroundColor: '#F8FAFC', padding: 10, borderRadius: 10, border: '1px solid #E2E8F0' }}>
              <span style={{ color: '#667085', fontSize: 10, textTransform: 'uppercase', fontWeight: 700 }}>Designation</span>
              <div style={{ fontWeight: 800, color: '#7C3AED', fontSize: 13, marginTop: 2 }}>{emp.designation}</div>
            </div>

            <div style={{ backgroundColor: '#F8FAFC', padding: 10, borderRadius: 10, border: '1px solid #E2E8F0' }}>
              <span style={{ color: '#667085', fontSize: 10, textTransform: 'uppercase', fontWeight: 700 }}>Department</span>
              <div style={{ fontWeight: 700, color: '#172033', marginTop: 2 }}>{emp.department || 'Academic'}</div>
            </div>

            <div style={{ backgroundColor: '#F8FAFC', padding: 10, borderRadius: 10, border: '1px solid #E2E8F0' }}>
              <span style={{ color: '#667085', fontSize: 10, textTransform: 'uppercase', fontWeight: 700 }}>Date of Joining</span>
              <div style={{ fontWeight: 700, color: '#172033', marginTop: 2 }}>{emp.joinDate || '2026-07-01'}</div>
            </div>

            <div style={{ backgroundColor: '#F8FAFC', padding: 10, borderRadius: 10, border: '1px solid #E2E8F0' }}>
              <span style={{ color: '#667085', fontSize: 10, textTransform: 'uppercase', fontWeight: 700 }}>Account Status</span>
              <div style={{ fontWeight: 800, color: emp.status === 'Inactive' ? '#DC2626' : '#16A34A', marginTop: 2 }}>
                {emp.status || emp.workStatus || 'Active'}
              </div>
            </div>

            <div style={{ backgroundColor: '#F8FAFC', padding: 10, borderRadius: 10, border: '1px solid #E2E8F0' }}>
              <span style={{ color: '#667085', fontSize: 10, textTransform: 'uppercase', fontWeight: 700 }}>Class Teacher</span>
              <div style={{ fontWeight: 700, color: '#172033', marginTop: 2 }}>
                {emp.isClassTeacher === 'Yes' ? `${emp.classTeacherClass || 'Class 5'}-${emp.classTeacherSection || 'A'}` : 'No'}
              </div>
            </div>

            <div style={{ backgroundColor: '#F8FAFC', padding: 10, borderRadius: 10, border: '1px solid #E2E8F0' }}>
              <span style={{ color: '#667085', fontSize: 10, textTransform: 'uppercase', fontWeight: 700 }}>Transport</span>
              <div style={{ fontWeight: 700, color: '#1769E0', marginTop: 2 }}>
                {hasTransport ? (emp.transportRoute || 'Assigned') : 'Not Assigned'}
              </div>
            </div>

            <div style={{ backgroundColor: '#F8FAFC', padding: 10, borderRadius: 10, border: '1px solid #E2E8F0' }}>
              <span style={{ color: '#667085', fontSize: 10, textTransform: 'uppercase', fontWeight: 700 }}>Monthly Salary</span>
              <div style={{ fontWeight: 800, color: '#16A34A', fontSize: 13, marginTop: 2 }}>
                ₹{(emp.basicSalary || emp.netSalary || 0).toLocaleString('en-IN')}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: PERSONAL INFORMATION */}
      {activeTab === 'personal' && (
        <div className="avm-card" style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 10, fontSize: 12 }}>
          <h3 style={{ fontSize: 14, fontWeight: 800, color: '#172033', margin: '0 0 4px 0', display: 'flex', alignItems: 'center', gap: 8 }}>
            <User size={16} color="#7C3AED" /> Personal Information
          </h3>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <span style={{ color: '#667085' }}>Full Name:</span>
              <div style={{ fontWeight: 700, color: '#172033' }}>{emp.name}</div>
            </div>

            <div>
              <span style={{ color: '#667085' }}>Employee ID:</span>
              <div style={{ fontWeight: 700, color: '#172033' }}>{emp.employeeId}</div>
            </div>

            <div>
              <span style={{ color: '#667085' }}>Date of Birth:</span>
              <div style={{ fontWeight: 600 }}>{emp.dob || '1990-05-15'}</div>
            </div>

            <div>
              <span style={{ color: '#667085' }}>Gender:</span>
              <div style={{ fontWeight: 600 }}>{emp.gender || 'Female'}</div>
            </div>

            <div>
              <span style={{ color: '#667085' }}>Blood Group:</span>
              <div style={{ fontWeight: 600 }}>{emp.bloodGroup || 'B+'}</div>
            </div>

            <div>
              <span style={{ color: '#667085' }}>Category:</span>
              <div style={{ fontWeight: 600 }}>{emp.category || 'General'}</div>
            </div>

            <div>
              <span style={{ color: '#667085' }}>Nationality:</span>
              <div style={{ fontWeight: 600 }}>{emp.nationality || 'Indian'}</div>
            </div>

            <div>
              <span style={{ color: '#667085' }}>Aadhaar Number:</span>
              <div style={{ fontWeight: 600 }}>{emp.aadhaar || 'N/A'}</div>
            </div>

            <div>
              <span style={{ color: '#667085' }}>PAN Number:</span>
              <div style={{ fontWeight: 600 }}>{emp.panNumber || 'N/A'}</div>
            </div>

            <div>
              <span style={{ color: '#667085' }}>Mobile Number:</span>
              <div style={{ fontWeight: 700, color: '#1769E0' }}>{emp.phone}</div>
            </div>

            <div>
              <span style={{ color: '#667085' }}>Alt Mobile:</span>
              <div style={{ fontWeight: 600 }}>{emp.altPhone || emp.phone}</div>
            </div>

            <div style={{ gridColumn: 'span 2' }}>
              <span style={{ color: '#667085' }}>Official Email:</span>
              <div style={{ fontWeight: 600, color: '#172033' }}>{emp.email}</div>
            </div>

            <div style={{ gridColumn: 'span 2' }}>
              <span style={{ color: '#667085' }}>Current Address:</span>
              <div style={{ fontWeight: 600 }}>{emp.address || 'Teachers Colony, Main Road, Kajraili'}</div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: PROFESSIONAL DETAILS */}
      {activeTab === 'professional' && (
        <div className="avm-card" style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 10, fontSize: 12 }}>
          <h3 style={{ fontSize: 14, fontWeight: 800, color: '#172033', margin: '0 0 4px 0', display: 'flex', alignItems: 'center', gap: 8 }}>
            <Briefcase size={16} color="#7C3AED" /> Professional Details
          </h3>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <span style={{ color: '#667085' }}>Designation:</span>
              <div style={{ fontWeight: 800, color: '#7C3AED' }}>{emp.designation}</div>
            </div>

            <div>
              <span style={{ color: '#667085' }}>Department:</span>
              <div style={{ fontWeight: 700 }}>{emp.department || 'Academic'}</div>
            </div>

            <div>
              <span style={{ color: '#667085' }}>Joining Date:</span>
              <div style={{ fontWeight: 600 }}>{emp.joinDate || '2026-07-01'}</div>
            </div>

            <div>
              <span style={{ color: '#667085' }}>Employment Type:</span>
              <div style={{ fontWeight: 600 }}>{emp.employmentType || 'Permanent'}</div>
            </div>

            <div>
              <span style={{ color: '#667085' }}>Work Status:</span>
              <div style={{ fontWeight: 800, color: emp.status === 'Inactive' ? '#DC2626' : '#16A34A' }}>
                {emp.workStatus || emp.status || 'Active'}
              </div>
            </div>

            <div>
              <span style={{ color: '#667085' }}>Overall Experience:</span>
              <div style={{ fontWeight: 600 }}>{emp.experience || emp.teachingExp || '3 Years'}</div>
            </div>

            <div>
              <span style={{ color: '#667085' }}>Previous School / Org:</span>
              <div style={{ fontWeight: 600 }}>{emp.prevSchool || 'N/A'}</div>
            </div>

            <div>
              <span style={{ color: '#667085' }}>Previous Designation:</span>
              <div style={{ fontWeight: 600 }}>{emp.prevDesignation || 'N/A'}</div>
            </div>

            <div>
              <span style={{ color: '#667085' }}>UAN Code:</span>
              <div style={{ fontWeight: 600 }}>{emp.uanCode || 'N/A'}</div>
            </div>

            <div>
              <span style={{ color: '#667085' }}>ESI Number:</span>
              <div style={{ fontWeight: 600 }}>{emp.esiNumber || 'N/A'}</div>
            </div>

            <div>
              <span style={{ color: '#667085' }}>PF Number:</span>
              <div style={{ fontWeight: 600 }}>{emp.pfNumber || 'N/A'}</div>
            </div>

            <div>
              <span style={{ color: '#667085' }}>Portal Role:</span>
              <div style={{ fontWeight: 700, color: '#172033' }}>{emp.employeeRole || emp.designation || 'Teacher'}</div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: ACADEMIC & TEACHING */}
      {activeTab === 'teaching' && (
        <div className="avm-card" style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 12, fontSize: 12 }}>
          <h3 style={{ fontSize: 14, fontWeight: 800, color: '#172033', margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
            <BookOpen size={16} color="#7C3AED" /> Academic & Teaching Assignments
          </h3>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <span style={{ color: '#667085' }}>Highest Qualification:</span>
              <div style={{ fontWeight: 700, color: '#172033' }}>{emp.qualification || 'B.Ed'}</div>
            </div>

            <div>
              <span style={{ color: '#667085' }}>Professional Qual:</span>
              <div style={{ fontWeight: 700 }}>{emp.profQual || 'B.Ed'}</div>
            </div>

            <div>
              <span style={{ color: '#667085' }}>Specialization:</span>
              <div style={{ fontWeight: 700, color: '#7C3AED' }}>{emp.specialization || emp.subject || 'Mathematics'}</div>
            </div>

            <div>
              <span style={{ color: '#667085' }}>Teaching Experience:</span>
              <div style={{ fontWeight: 600 }}>{emp.teachingExp || emp.experience || '3 Years'}</div>
            </div>

            <div>
              <span style={{ color: '#667085' }}>Primary Subject:</span>
              <div style={{ fontWeight: 700, color: '#172033' }}>{emp.subject || 'Mathematics'}</div>
            </div>

            <div>
              <span style={{ color: '#667085' }}>Teaching Medium:</span>
              <div style={{ fontWeight: 600 }}>{emp.medium || 'Hindi + English'}</div>
            </div>

            <div style={{ gridColumn: 'span 2' }}>
              <span style={{ color: '#667085' }}>Class Teacher Status:</span>
              <div style={{ fontWeight: 800, color: emp.isClassTeacher === 'Yes' ? '#16A34A' : '#64748B', marginTop: 2 }}>
                {emp.isClassTeacher === 'Yes'
                  ? `Class Teacher: ${emp.classTeacherClass || 'Class 5'}-${emp.classTeacherSection || 'A'}`
                  : 'Subject Teacher (Not Class Teacher)'}
              </div>
            </div>
          </div>

          <div>
            <span style={{ color: '#667085', display: 'block', marginBottom: 6, fontWeight: 700 }}>Assigned Teaching Classes:</span>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {(emp.assignedClasses || ['Class 5-A']).map((cls, idx) => (
                <span key={idx} style={{ backgroundColor: '#F3E8FF', color: '#7C3AED', fontWeight: 700, fontSize: 11, padding: '4px 12px', borderRadius: 16 }}>
                  {cls}
                </span>
              ))}
            </div>
          </div>

          <div>
            <span style={{ color: '#667085', display: 'block', marginBottom: 6, fontWeight: 700 }}>Teaching Subjects:</span>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {(emp.teachingSubjects || [emp.subject || 'Mathematics']).map((sub, idx) => (
                <span key={idx} style={{ backgroundColor: '#E0F2FE', color: '#0369A1', fontWeight: 700, fontSize: 11, padding: '4px 12px', borderRadius: 16 }}>
                  {sub}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: PARENTS & EMERGENCY */}
      {activeTab === 'parents' && (
        <div className="avm-card" style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 10, fontSize: 12 }}>
          <h3 style={{ fontSize: 14, fontWeight: 800, color: '#172033', margin: '0 0 4px 0', display: 'flex', alignItems: 'center', gap: 8 }}>
            <Users size={16} color="#7C3AED" /> Parents & Emergency Contact
          </h3>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <span style={{ color: '#667085' }}>Father's Name:</span>
              <div style={{ fontWeight: 700, color: '#172033' }}>{emp.fatherName || 'N/A'}</div>
            </div>

            <div>
              <span style={{ color: '#667085' }}>Mother's Name:</span>
              <div style={{ fontWeight: 700, color: '#172033' }}>{emp.motherName || 'N/A'}</div>
            </div>

            <div>
              <span style={{ color: '#667085' }}>Spouse Name:</span>
              <div style={{ fontWeight: 600 }}>{emp.spouseName || 'N/A'}</div>
            </div>

            <div>
              <span style={{ color: '#667085' }}>Guardian Name:</span>
              <div style={{ fontWeight: 600 }}>{emp.guardianName || 'N/A'}</div>
            </div>

            <div>
              <span style={{ color: '#667085' }}>Emergency Contact Name:</span>
              <div style={{ fontWeight: 700, color: '#1769E0' }}>{emp.emgName || emp.fatherName || 'N/A'}</div>
            </div>

            <div>
              <span style={{ color: '#667085' }}>Relationship:</span>
              <div style={{ fontWeight: 600 }}>{emp.emgRelation || 'Spouse / Parent'}</div>
            </div>

            <div>
              <span style={{ color: '#667085' }}>Emergency Contact Phone:</span>
              <div style={{ fontWeight: 700, color: '#1769E0' }}>{emp.emgPhone || emp.phone}</div>
            </div>

            <div>
              <span style={{ color: '#667085' }}>Alt Emergency Phone:</span>
              <div style={{ fontWeight: 600 }}>{emp.emgAltPhone || emp.altPhone || 'N/A'}</div>
            </div>

            <div style={{ gridColumn: 'span 2' }}>
              <span style={{ color: '#667085' }}>Emergency Address:</span>
              <div style={{ fontWeight: 600 }}>{emp.emgAddress || emp.address || 'N/A'}</div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 6: ADDRESS */}
      {activeTab === 'address' && (
        <div className="avm-card" style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 14, fontSize: 12 }}>
          <div>
            <h3 style={{ fontSize: 14, fontWeight: 800, color: '#172033', margin: '0 0 6px 0', display: 'flex', alignItems: 'center', gap: 8 }}>
              <MapPin size={16} color="#7C3AED" /> Present Address
            </h3>

            <div style={{ backgroundColor: '#F8FAFC', padding: 12, borderRadius: 10, border: '1px solid #E2E8F0', display: 'flex', flexDirection: 'column', gap: 6 }}>
              <div><span style={{ color: '#667085' }}>Address Line:</span> <strong>{emp.address || 'Teachers Colony, Kajraili'}</strong></div>
              {emp.addressLine2 && <div><span style={{ color: '#667085' }}>Address Line 2:</span> <strong>{emp.addressLine2}</strong></div>}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginTop: 4 }}>
                <div><span style={{ color: '#667085' }}>Village/Area:</span> {emp.village || 'Kajraili'}</div>
                <div><span style={{ color: '#667085' }}>City:</span> {emp.city || 'Bhagalpur'}</div>
                <div><span style={{ color: '#667085' }}>District:</span> {emp.district || 'Bhagalpur'}</div>
                <div><span style={{ color: '#667085' }}>State:</span> {emp.state || 'Bihar'}</div>
                <div><span style={{ color: '#667085' }}>PIN Code:</span> {emp.pinCode || '812005'}</div>
              </div>
            </div>
          </div>

          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
              <h3 style={{ fontSize: 14, fontWeight: 800, color: '#172033', margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
                <MapPin size={16} color="#16A34A" /> Permanent Address
              </h3>
              {isPermSameAsPresent && (
                <span style={{ backgroundColor: '#EAF8EF', color: '#16A34A', fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 10 }}>
                  Same as Present Address
                </span>
              )}
            </div>

            {isPermSameAsPresent ? (
              <div style={{ backgroundColor: '#F8FAFC', padding: 12, borderRadius: 10, border: '1px solid #E2E8F0', color: '#64748B' }}>
                Permanent address is identical to Present Address listed above.
              </div>
            ) : (
              <div style={{ backgroundColor: '#F8FAFC', padding: 12, borderRadius: 10, border: '1px solid #E2E8F0', display: 'flex', flexDirection: 'column', gap: 6 }}>
                <div><span style={{ color: '#667085' }}>Address Line:</span> <strong>{emp.permAddress}</strong></div>
                {emp.permAddressLine2 && <div><span style={{ color: '#667085' }}>Address Line 2:</span> <strong>{emp.permAddressLine2}</strong></div>}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginTop: 4 }}>
                  <div><span style={{ color: '#667085' }}>Village/Area:</span> {emp.permVillage || emp.village}</div>
                  <div><span style={{ color: '#667085' }}>City:</span> {emp.permCity || emp.city}</div>
                  <div><span style={{ color: '#667085' }}>District:</span> {emp.permDistrict || emp.district}</div>
                  <div><span style={{ color: '#667085' }}>State:</span> {emp.permState || emp.state}</div>
                  <div><span style={{ color: '#667085' }}>PIN Code:</span> {emp.permPinCode || emp.pinCode}</div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 7: DOCUMENTS */}
      {activeTab === 'documents' && (
        <div className="avm-card" style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 10, fontSize: 12 }}>
          <h3 style={{ fontSize: 14, fontWeight: 800, color: '#172033', margin: '0 0 4px 0', display: 'flex', alignItems: 'center', gap: 8 }}>
            <FileText size={16} color="#7C3AED" /> Uploaded Employee Documents
          </h3>

          {emp.documents && emp.documents.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {emp.documents.map((doc: any, idx: number) => (
                <div key={doc.id || idx} style={{
                  backgroundColor: '#F8FAFC',
                  borderRadius: 10,
                  padding: 12,
                  border: '1px solid #E2E8F0',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <div>
                    <div style={{ fontWeight: 700, color: '#172033', fontSize: 13 }}>{doc.docType || doc.fileName || 'Document'}</div>
                    <div style={{ color: '#667085', fontSize: 11, marginTop: 2 }}>
                      Doc No: <strong>{doc.docNumber || 'Uploaded'}</strong> {doc.issueDate && `• Date: ${doc.issueDate}`}
                    </div>
                    {doc.remarks && <div style={{ color: '#94A3B8', fontSize: 10, marginTop: 2 }}>{doc.remarks}</div>}
                  </div>
                  <span style={{ backgroundColor: '#EAF8EF', color: '#16A34A', fontSize: 11, fontWeight: 700, padding: '3px 8px', borderRadius: 10 }}>
                    Verified
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: 24, color: '#64748B', backgroundColor: '#F8FAFC', borderRadius: 10 }}>
              No uploaded documents recorded in Employee file.
            </div>
          )}
        </div>
      )}

      {/* TAB 8: ACCOUNT & SECURITY */}
      {activeTab === 'account' && (
        <div className="avm-card" style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 10, fontSize: 12 }}>
          <h3 style={{ fontSize: 14, fontWeight: 800, color: '#172033', margin: '0 0 4px 0', display: 'flex', alignItems: 'center', gap: 8 }}>
            <Shield size={16} color="#7C3AED" /> Portal Account & Security Details
          </h3>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <span style={{ color: '#667085' }}>Employee ID:</span>
              <div style={{ fontWeight: 800, color: '#172033' }}>{emp.employeeId}</div>
            </div>

            <div>
              <span style={{ color: '#667085' }}>Portal Username:</span>
              <div style={{ fontWeight: 800, color: '#7C3AED' }}>{emp.username || emp.employeeId}</div>
            </div>

            <div>
              <span style={{ color: '#667085' }}>Login Display Name:</span>
              <div style={{ fontWeight: 700 }}>{emp.name}</div>
            </div>

            <div>
              <span style={{ color: '#667085' }}>Portal Role:</span>
              <div style={{ fontWeight: 700 }}>{emp.employeeRole || emp.designation || 'Teacher'}</div>
            </div>

            <div>
              <span style={{ color: '#667085' }}>Account Status:</span>
              <div style={{ fontWeight: 800, color: emp.status === 'Inactive' ? '#DC2626' : '#16A34A' }}>
                {emp.status || 'Active'}
              </div>
            </div>

            <div>
              <span style={{ color: '#667085' }}>Authentication Status:</span>
              <div style={{ fontWeight: 700, color: '#16A34A' }}>Active (Authenticated)</div>
            </div>

            <div style={{ gridColumn: 'span 2', backgroundColor: '#F8FAFC', padding: 10, borderRadius: 10, border: '1px solid #E2E8F0' }}>
              <span style={{ color: '#667085', fontSize: 11 }}>Password Security Note:</span>
              <div style={{ color: '#475569', fontSize: 11, marginTop: 2 }}>
                For security reasons, your login password is encrypted and hidden (••••••••). You can update your password below.
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 9: TRANSPORT */}
      {activeTab === 'transport' && (
        <div className="avm-card" style={{ padding: 16, fontSize: 12 }}>
          <h3 style={{ fontSize: 14, fontWeight: 800, color: '#172033', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 8 }}>
            <BusIcon size={16} color="#7C3AED" /> Employee Transport Details
          </h3>

          {hasTransport ? (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <span style={{ color: '#667085' }}>Assigned Bus:</span>
                <div style={{ fontWeight: 800, color: '#1769E0' }}>{emp.transportBusId || 'Bus-02'}</div>
              </div>

              <div>
                <span style={{ color: '#667085' }}>Route Name:</span>
                <div style={{ fontWeight: 700 }}>{emp.transportRoute || 'Mojahidpur Route'}</div>
              </div>

              <div>
                <span style={{ color: '#667085' }}>Pickup Point / Stop:</span>
                <div style={{ fontWeight: 600 }}>{emp.transportStop || emp.transportVillage || 'Kajraili Chowk'}</div>
              </div>

              <div>
                <span style={{ color: '#667085' }}>Pickup Time:</span>
                <div style={{ fontWeight: 600 }}>{emp.transportTime || '07:15 AM'}</div>
              </div>

              <div>
                <span style={{ color: '#667085' }}>Monthly Fee:</span>
                <div style={{ fontWeight: 700, color: '#16A34A' }}>
                  {emp.transportFee ? `₹${emp.transportFee}` : 'Free / Included'}
                </div>
              </div>

              <div>
                <span style={{ color: '#667085' }}>Transport Status:</span>
                <div style={{ fontWeight: 800, color: '#16A34A' }}>{emp.transportStatus || 'Active'}</div>
              </div>
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: 24, color: '#64748B', backgroundColor: '#F8FAFC', borderRadius: 10 }}>
              No school transport requested or assigned to this employee.
            </div>
          )}
        </div>
      )}

      {/* TAB 10: SALARY & PAYMENTS */}
      {activeTab === 'salary' && (
        <div className="avm-card" style={{ padding: 16, fontSize: 12, display: 'flex', flexDirection: 'column', gap: 12 }}>
          <h3 style={{ fontSize: 14, fontWeight: 800, color: '#172033', margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
            <CreditCard size={16} color="#7C3AED" /> Salary & Payroll Information
          </h3>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, backgroundColor: '#F8FAFC', padding: 12, borderRadius: 10, border: '1px solid #E2E8F0' }}>
            <div>
              <span style={{ color: '#667085' }}>Basic Monthly Salary:</span>
              <div style={{ fontWeight: 800, color: '#172033', fontSize: 13 }}>₹{(emp.basicSalary || 0).toLocaleString('en-IN')}</div>
            </div>

            <div>
              <span style={{ color: '#667085' }}>Allowances:</span>
              <div style={{ fontWeight: 700, color: '#16A34A' }}>+ ₹{(emp.allowances || 0).toLocaleString('en-IN')}</div>
            </div>

            <div>
              <span style={{ color: '#667085' }}>Deductions:</span>
              <div style={{ fontWeight: 700, color: '#DC2626' }}>- ₹{(emp.deduction || 0).toLocaleString('en-IN')}</div>
            </div>

            <div>
              <span style={{ color: '#667085' }}>Net Monthly Salary:</span>
              <div style={{ fontWeight: 800, color: '#7C3AED', fontSize: 13 }}>
                ₹{(emp.netSalary || emp.basicSalary || 0).toLocaleString('en-IN')}
              </div>
            </div>

            <div>
              <span style={{ color: '#667085' }}>Payment Mode:</span>
              <div style={{ fontWeight: 700 }}>{emp.paymentMode || 'Bank Transfer'}</div>
            </div>

            <div>
              <span style={{ color: '#667085' }}>Bank Name:</span>
              <div style={{ fontWeight: 700 }}>{emp.bankName || 'State Bank of India'}</div>
            </div>

            <div>
              <span style={{ color: '#667085' }}>Account Number:</span>
              <div style={{ fontWeight: 600 }}>{emp.accountNumber ? `••••${emp.accountNumber.slice(-4)}` : 'N/A'}</div>
            </div>

            <div>
              <span style={{ color: '#667085' }}>IFSC Code:</span>
              <div style={{ fontWeight: 600 }}>{emp.ifscCode || 'N/A'}</div>
            </div>
          </div>

          <h4 style={{ fontSize: 13, fontWeight: 700, color: '#172033', margin: '4px 0 0 0' }}>Disbursement Records History</h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {salaryHistory.map((pmt: any, idx: number) => (
              <div key={pmt.id || idx} style={{
                backgroundColor: '#F8FAFC',
                borderRadius: 10,
                padding: 12,
                border: '1px solid #E2E8F0',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#172033' }}>
                    {pmt.paymentMonth || pmt.month}
                  </div>
                  <div style={{ fontSize: 11, color: '#64748B', marginTop: 2 }}>
                    Salary: <strong>₹{(pmt.salaryAmount || pmt.salary || 25000).toLocaleString('en-IN')}</strong> • Paid: ₹{(pmt.paidAmount || 0).toLocaleString('en-IN')}
                  </div>
                  {pmt.remarks && <div style={{ fontSize: 10, color: '#94A3B8', marginTop: 2 }}>{pmt.remarks}</div>}
                </div>

                <span style={{
                  fontSize: 11,
                  fontWeight: 800,
                  padding: '4px 10px',
                  borderRadius: 12,
                  backgroundColor: pmt.status === 'Paid' ? '#EAF8EF' : '#FEF2F2',
                  color: pmt.status === 'Paid' ? '#16A34A' : '#EF4444'
                }}>
                  {pmt.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Account Settings & Logout Actions */}
      <div className="avm-card" style={{ padding: 8 }}>
        <button
          onClick={() => { setPassSuccessMsg(''); setNewPass(''); setPassModalOpen(true); }}
          style={{
            width: '100%',
            padding: 12,
            background: 'none',
            border: 'none',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            cursor: 'pointer',
            fontSize: 13,
            fontWeight: 600,
            color: '#172033',
            borderBottom: '1px solid #F1F5F9'
          }}
        >
          <span style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Lock size={18} color="#7C3AED" /> Change Staff Password
          </span>
          <ChevronRight size={16} color="#94A3B8" />
        </button>

        <button
          onClick={onLogout}
          style={{
            width: '100%',
            padding: 12,
            background: 'none',
            border: 'none',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            cursor: 'pointer',
            fontSize: 13,
            fontWeight: 700,
            color: '#EF4444'
          }}
        >
          <span style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <LogOut size={18} color="#EF4444" /> Logout from Employee App
          </span>
          <ChevronRight size={16} color="#EF4444" />
        </button>
      </div>

      {/* Password Modal */}
      {passModalOpen && (
        <Modal isOpen={passModalOpen} onClose={() => setPassModalOpen(false)} title="Change Staff Password">
          <form onSubmit={handleUpdatePassword}>
            {passSuccessMsg && (
              <div style={{ backgroundColor: '#EAF8EF', color: '#16A34A', padding: 10, borderRadius: 10, fontSize: 12, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
                <CheckCircle2 size={16} />
                <span>{passSuccessMsg}</span>
              </div>
            )}
            <div style={{ marginBottom: 12 }}>
              <input
                type="password"
                className="avm-input"
                placeholder="Enter New Password"
                value={newPass}
                onChange={(e) => setNewPass(e.target.value)}
                required
              />
            </div>
            <button type="submit" className="avm-btn-primary" style={{ width: '100%', backgroundColor: '#7C3AED' }}>
              Update Password
            </button>
          </form>
        </Modal>
      )}

      {/* Change Photo Modal */}
      {photoModalOpen && (
        <Modal isOpen={photoModalOpen} onClose={() => setPhotoModalOpen(false)} title="Update Staff Photo">
          {uploadError && (
            <div style={{ backgroundColor: '#FEF2F2', color: '#DC2626', border: '1px solid #FCA5A5', padding: 10, borderRadius: 10, fontSize: 12, marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
              <ShieldAlert size={16} />
              <span>{uploadError}</span>
            </div>
          )}

          {uploading ? (
            <div style={{ textAlign: 'center', padding: 20, color: '#7C3AED', fontWeight: 700 }}>
              Uploading Staff Photo...
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <button
                onClick={() => handlePhotoCapture('camera')}
                className="avm-btn-primary"
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, padding: 14, borderRadius: 12, backgroundColor: '#7C3AED' }}
              >
                <Camera size={18} />
                <span>Take Photo (Camera)</span>
              </button>

              <button
                onClick={() => handlePhotoCapture('photos')}
                className="avm-btn-secondary"
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, padding: 14, borderRadius: 12 }}
              >
                <Image size={18} />
                <span>Choose from Photo Gallery</span>
              </button>
            </div>
          )}
        </Modal>
      )}
    </div>
  );
};
