import React, { useState, useEffect } from 'react';
import { AdminLoginScreen } from './screens/AdminLoginScreen';
import { AdminWebDashboard } from './screens/AdminWebDashboard';
import { authService } from './services/authService';
import { demoDataStore } from './services/demoDataStore';
import './App.css';

export const App: React.FC = () => {
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState<boolean>(() => {
    try {
      return localStorage.getItem('avm_admin_authenticated') === 'true';
    } catch {
      return false;
    }
  });

  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    // Initialize persistent demo store asynchronously
    demoDataStore.initAsync().then(() => {
      setIsLoading(false);
    }).catch(() => {
      setIsLoading(false);
    });
  }, []);

  const handleAdminLoginSuccess = () => {
    try {
      localStorage.setItem('avm_admin_authenticated', 'true');
    } catch (e) {
      console.warn(e);
    }
    setIsAdminLoggedIn(true);
  };

  const handleAdminLogout = () => {
    try {
      localStorage.removeItem('avm_admin_authenticated');
    } catch (e) {
      console.warn(e);
    }
    setIsAdminLoggedIn(false);
  };

  if (isLoading) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#0F172A',
        color: '#FFFFFF',
        fontFamily: 'Inter, system-ui, sans-serif'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: 48,
            height: 48,
            borderRadius: 14,
            background: 'linear-gradient(135deg, #1769E0 0%, #1255B8 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 18,
            fontWeight: 800,
            margin: '0 auto 16px',
            boxShadow: '0 4px 14px rgba(23,105,224,0.4)'
          }}>
            AVM
          </div>
          <div style={{ fontSize: 16, fontWeight: 700, color: '#F8FAFC' }}>Loading AVM Admin Panel...</div>
          <div style={{ fontSize: 12, color: '#94A3B8', marginTop: 4 }}>Initializing Central Persistent Store</div>
        </div>
      </div>
    );
  }

  if (!isAdminLoggedIn) {
    return <AdminLoginScreen onLoginSuccess={handleAdminLoginSuccess} />;
  }

  return <AdminWebDashboard onLogout={handleAdminLogout} />;
};

export default App;
