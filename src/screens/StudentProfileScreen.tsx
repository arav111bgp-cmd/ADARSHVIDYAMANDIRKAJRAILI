import React, { useState } from 'react';
import type { Student } from '../types';
import { classService } from '../services/classService';
import { permissionService } from '../services/permissionService';
import { cloudinaryService } from '../services/cloudinaryService';
import { demoDataStore } from '../services/demoDataStore';
import { User, Phone, Lock, LogOut, ChevronRight, Camera, Image, ShieldAlert, X } from 'lucide-react';
import { Modal } from '../components/Modal';

interface StudentProfileScreenProps {
  student: Student;
  onLogout: () => void;
}

export const StudentProfileScreen: React.FC<StudentProfileScreenProps> = ({
  student,
  onLogout
}) => {
  const [currentPhoto, setCurrentPhoto] = useState(student.photo);
  const [photoModalOpen, setPhotoModalOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');

  const [passModalOpen, setPassModalOpen] = useState(false);
  const [oldPass, setOldPass] = useState('');
  const [newPass, setNewPass] = useState('');
  const [confirmPass, setConfirmPass] = useState('');
  const [passSuccess, setPassSuccess] = useState(false);

  const handlePhotoCapture = async (source: 'camera' | 'photos') => {
    setUploadError('');
    setUploading(true);
    const res = await permissionService.capturePhoto(source);

    if (res.success && res.dataUrl) {
      try {
        const cloudRes = await cloudinaryService.uploadStudentPhoto(res.dataUrl, 'AVM');
        if (cloudRes && cloudRes.secure_url) {
          const photoUrl = cloudRes.secure_url;
          setCurrentPhoto(photoUrl);
          setPhotoModalOpen(false);

          // Save updated user photo to session & demoDataStore
          const db = demoDataStore.getDB();
          const stus = db.students || [];
          const idx = stus.findIndex((s: any) => s.id === student.id || s.admissionNo === student.admissionNo);
          if (idx !== -1) {
            stus[idx].photo = photoUrl;
            stus[idx].cloudinaryMeta = {
              secure_url: cloudRes.secure_url,
              public_id: cloudRes.public_id,
              resource_type: cloudRes.resource_type,
              format: cloudRes.format,
              bytes: cloudRes.bytes
            };
            db.students = stus;
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
        setUploadError(cloudErr?.message || 'Upload failed. Please check your internet connection and try again.');
      } finally {
        setUploading(false);
      }
    } else {
      setUploading(false);
      if (res.error) setUploadError(res.error);
    }
  };

  const handlePassSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newPass !== confirmPass) return;
    setPassSuccess(true);
    setTimeout(() => {
      setPassSuccess(false);
      setPassModalOpen(false);
    }, 1200);
  };

  return (
    <div style={{ padding: '16px 16px 80px 16px', display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Profile Card Header */}
      <div className="avm-card" style={{ padding: 20, textAlign: 'center', position: 'relative' }}>
        <div style={{ position: 'relative', width: 84, height: 84, margin: '0 auto 10px auto' }}>
          <img
            src={currentPhoto}
            alt={student.name}
            style={{
              width: 80,
              height: 80,
              borderRadius: '50%',
              objectFit: 'cover',
              border: '3px solid #1769E0'
            }}
          />
          <button
            onClick={() => { setPhotoModalOpen(true); setUploadError(''); }}
            style={{
              position: 'absolute',
              bottom: 0,
              right: 0,
              backgroundColor: '#1769E0',
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
          {student.name}
        </h2>
        <div style={{ fontSize: 12, color: '#1769E0', fontWeight: 700, marginTop: 2 }}>
          {classService.formatClassDisplay(student.className, student.section)} • Roll No. {student.rollNo}
        </div>
        <div style={{ fontSize: 11, color: '#667085', marginTop: 2 }}>
          Admission No: <strong>{student.admissionNo}</strong>
        </div>
      </div>

      {/* Personal Details Section */}
      <div className="avm-card" style={{ padding: 16 }}>
        <h3 style={{ fontSize: 14, fontWeight: 700, color: '#172033', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
          <User size={16} color="#1769E0" /> Personal Information
        </h3>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, fontSize: 12 }}>
          <div>
            <span style={{ color: '#667085' }}>Date of Birth:</span>
            <div style={{ fontWeight: 700, color: '#172033' }}>{student.dob}</div>
          </div>
          <div>
            <span style={{ color: '#667085' }}>Gender:</span>
            <div style={{ fontWeight: 700, color: '#172033' }}>{student.gender}</div>
          </div>
          <div>
            <span style={{ color: '#667085' }}>Blood Group:</span>
            <div style={{ fontWeight: 700, color: '#172033' }}>{student.bloodGroup}</div>
          </div>
          <div>
            <span style={{ color: '#667085' }}>Status:</span>
            <div style={{ fontWeight: 700, color: '#16A34A' }}>{student.status}</div>
          </div>
        </div>
      </div>

      {/* Parent & Contact Details */}
      <div className="avm-card" style={{ padding: 16 }}>
        <h3 style={{ fontSize: 14, fontWeight: 700, color: '#172033', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
          <Phone size={16} color="#1769E0" /> Parent & Contact Info
        </h3>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, fontSize: 12 }}>
          <div>
            <span style={{ color: '#667085' }}>Father's Name:</span>
            <div style={{ fontWeight: 700, color: '#172033' }}>{student.fatherName}</div>
          </div>
          <div>
            <span style={{ color: '#667085' }}>Mother's Name:</span>
            <div style={{ fontWeight: 700, color: '#172033' }}>{student.motherName}</div>
          </div>
          <div>
            <span style={{ color: '#667085' }}>Guardian Mobile:</span>
            <div style={{ fontWeight: 700, color: '#1769E0' }}>{student.phone}</div>
          </div>
          <div>
            <span style={{ color: '#667085' }}>Residential Address:</span>
            <div style={{ fontWeight: 600, color: '#172033' }}>{student.address}</div>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="avm-card" style={{ padding: 8 }}>
        <button
          onClick={() => setPassModalOpen(true)}
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
            <Lock size={18} color="#1769E0" /> Change Password
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
            <LogOut size={18} color="#EF4444" /> Logout from App
          </span>
          <ChevronRight size={16} color="#EF4444" />
        </button>
      </div>

      {/* Change Password Modal */}
      {passModalOpen && (
        <Modal isOpen={passModalOpen} onClose={() => setPassModalOpen(false)} title="Change Password">
          <form onSubmit={handlePassSubmit}>
            <div style={{ marginBottom: 12 }}>
              <label style={{ fontSize: 12, fontWeight: 700, color: '#475569', display: 'block', marginBottom: 4 }}>
                Current Password
              </label>
              <input
                type="password"
                className="avm-input"
                value={oldPass}
                onChange={(e) => setOldPass(e.target.value)}
                required
              />
            </div>
            <div style={{ marginBottom: 12 }}>
              <label style={{ fontSize: 12, fontWeight: 700, color: '#475569', display: 'block', marginBottom: 4 }}>
                New Password
              </label>
              <input
                type="password"
                className="avm-input"
                value={newPass}
                onChange={(e) => setNewPass(e.target.value)}
                required
              />
            </div>
            <div style={{ marginBottom: 16 }}>
              <label style={{ fontSize: 12, fontWeight: 700, color: '#475569', display: 'block', marginBottom: 4 }}>
                Confirm New Password
              </label>
              <input
                type="password"
                className="avm-input"
                value={confirmPass}
                onChange={(e) => setConfirmPass(e.target.value)}
                required
              />
            </div>

            {passSuccess ? (
              <div style={{ backgroundColor: '#EAF8EF', color: '#16A34A', padding: 10, borderRadius: 8, textAlign: 'center', fontWeight: 700 }}>
                Password Changed Successfully!
              </div>
            ) : (
              <div style={{ display: 'flex', gap: 10 }}>
                <button type="button" className="avm-btn-secondary" style={{ flex: 1 }} onClick={() => setPassModalOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="avm-btn-primary" style={{ flex: 1 }}>
                  Update
                </button>
              </div>
            )}
          </form>
        </Modal>
      )}

      {/* Change Photo Modal */}
      {photoModalOpen && (
        <Modal isOpen={photoModalOpen} onClose={() => setPhotoModalOpen(false)} title="Update Profile Photo">
          {uploadError && (
            <div style={{ backgroundColor: '#FEF2F2', color: '#DC2626', border: '1px solid #FCA5A5', padding: 10, borderRadius: 10, fontSize: 12, marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
              <ShieldAlert size={16} />
              <span>{uploadError}</span>
            </div>
          )}

          {uploading ? (
            <div style={{ textAlign: 'center', padding: 20, color: '#1769E0', fontWeight: 700 }}>
              Uploading Profile Photo...
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <button
                onClick={() => handlePhotoCapture('camera')}
                className="avm-btn-primary"
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, padding: 14, borderRadius: 12 }}
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
