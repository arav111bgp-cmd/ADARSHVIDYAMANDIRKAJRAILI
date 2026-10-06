import React, { useState } from 'react';
import { authService } from '../services/authService';
import { mockSchoolInfo } from '../mock/mockData';
import { Shield, Lock, User, CheckCircle2 } from 'lucide-react';

interface AdminLoginScreenProps {
  onLoginSuccess: () => void;
}

export const AdminLoginScreen: React.FC<AdminLoginScreenProps> = ({ onLoginSuccess }) => {
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('admin123');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setLoading(true);

    try {
      const res = await authService.loginUser(username, password);
      if (res.success && res.role === 'admin') {
        onLoginSuccess();
      } else {
        setErrorMsg(res.error || 'Invalid Admin Username or Password');
      }
    } catch (e) {
      setErrorMsg('Unable to connect to Admin backend service.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#0F172A',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 24,
      fontFamily: 'Inter, sans-serif'
    }}>
      <div style={{
        backgroundColor: '#1E293B',
        borderRadius: 24,
        padding: 40,
        width: '100%',
        maxWidth: 440,
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
        border: '1px solid #334155',
        color: '#F8FAFC'
      }}>
        {/* Header Logo */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{
            width: 64,
            height: 64,
            borderRadius: 18,
            background: 'linear-gradient(135deg, #1769E0 0%, #1255B8 100%)',
            color: '#FFFFFF',
            fontWeight: 800,
            fontSize: 24,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 16px auto',
            boxShadow: '0 8px 20px rgba(23,105,224,0.4)'
          }}>
            AVM
          </div>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: '#FFFFFF', margin: 0 }}>
            {mockSchoolInfo.name}
          </h1>
          <p style={{ fontSize: 13, color: '#94A3B8', fontWeight: 600, marginTop: 4 }}>
            WEB ADMIN & PRINCIPAL PORTAL
          </p>
        </div>

        {errorMsg && (
          <div style={{
            backgroundColor: '#451A1A',
            color: '#F87171',
            border: '1px solid #7F1D1D',
            borderRadius: 10,
            padding: 12,
            fontSize: 13,
            fontWeight: 600,
            marginBottom: 20,
            textAlign: 'center'
          }}>
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleAdminLogin}>
          <div style={{ marginBottom: 18 }}>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#CBD5E1', marginBottom: 6 }}>
              Admin Username
            </label>
            <div style={{ position: 'relative' }}>
              <User size={18} style={{ position: 'absolute', left: 14, top: 13, color: '#64748B' }} />
              <input
                type="text"
                className="avm-input"
                style={{
                  paddingLeft: 42,
                  backgroundColor: '#0F172A',
                  borderColor: '#475569',
                  color: '#FFFFFF'
                }}
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="admin"
                required
              />
            </div>
          </div>

          <div style={{ marginBottom: 24 }}>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#CBD5E1', marginBottom: 6 }}>
              Admin Password
            </label>
            <div style={{ position: 'relative' }}>
              <Lock size={18} style={{ position: 'absolute', left: 14, top: 13, color: '#64748B' }} />
              <input
                type="password"
                className="avm-input"
                style={{
                  paddingLeft: 42,
                  backgroundColor: '#0F172A',
                  borderColor: '#475569',
                  color: '#FFFFFF'
                }}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="admin123"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="avm-btn-primary"
            style={{ width: '100%', padding: '14px', fontSize: 16, backgroundColor: '#1769E0' }}
          >
            {loading ? 'Authenticating Admin...' : 'Sign In to Admin Panel'}
          </button>
        </form>

        <div style={{
          marginTop: 24,
          backgroundColor: '#0F172A',
          borderRadius: 12,
          padding: 12,
          fontSize: 12,
          color: '#94A3B8',
          textAlign: 'center',
          border: '1px solid #334155'
        }}>
          Demo Admin Access: <code>admin</code> / <code>admin123</code>
        </div>
      </div>
    </div>
  );
};
