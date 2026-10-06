import React from 'react';
import { ArrowLeft, Bell, Menu } from 'lucide-react';
import { mockSchoolInfo } from '../mock/mockData';

interface HeaderProps {
  title?: string;
  subtitle?: string;
  showBack?: boolean;
  onBack?: () => void;
  unreadNotifications?: number;
  onNotificationClick?: () => void;
  userRole?: 'student' | 'employee' | 'admin';
  userName?: string;
  onOpenDrawer?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  title,
  subtitle,
  showBack = false,
  onBack,
  unreadNotifications = 2,
  onNotificationClick,
  userRole,
  userName,
  onOpenDrawer
}) => {
  return (
    <header style={{
      backgroundColor: '#FFFFFF',
      borderBottom: '1px solid #E2E8F0',
      padding: '12px 16px',
      position: 'sticky',
      top: 0,
      zIndex: 100,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      boxShadow: '0 2px 8px rgba(0,0,0,0.03)'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        {showBack ? (
          <button
            onClick={onBack}
            style={{
              background: '#F1F5F9',
              border: 'none',
              borderRadius: '50%',
              width: 36,
              height: 36,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              color: '#1E293B'
            }}
            aria-label="Go back"
          >
            <ArrowLeft size={20} />
          </button>
        ) : onOpenDrawer ? (
          <button
            onClick={onOpenDrawer}
            style={{
              background: 'linear-gradient(135deg, #EFF6FF 0%, #DBEAFE 100%)',
              border: '1px solid #BFDBFE',
              borderRadius: '50%',
              width: 36,
              height: 36,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              color: '#1769E0',
              boxShadow: '0 2px 6px rgba(23,105,224,0.15)'
            }}
            aria-label="Open left navigation menu"
          >
            <Menu size={20} />
          </button>
        ) : null}

        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {/* Logo Badge */}
          <div style={{
            width: 38,
            height: 38,
            borderRadius: 10,
            background: 'linear-gradient(135deg, #1769E0 0%, #1255B8 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#FFFFFF',
            fontWeight: 800,
            fontSize: 16,
            boxShadow: '0 3px 8px rgba(23,105,224,0.3)',
            flexShrink: 0
          }}>
            AVM
          </div>

          <div>
            <h1 style={{ fontSize: title ? 16 : 14, fontWeight: 700, color: '#172033', lineHeight: 1.2 }}>
              {title || mockSchoolInfo.name}
            </h1>
            <p style={{ fontSize: 11, color: '#667085', fontWeight: 500 }}>
              {subtitle || 'KAJRAILI • SCHOOL ERP'}
            </p>
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        {onNotificationClick && (
          <button
            onClick={onNotificationClick}
            style={{
              background: '#F6F8FC',
              border: '1px solid #E2E8F0',
              borderRadius: '50%',
              width: 36,
              height: 36,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              color: '#172033',
              position: 'relative'
            }}
            aria-label="Notifications"
          >
            <Bell size={18} />
            {unreadNotifications > 0 && (
              <span style={{
                position: 'absolute',
                top: 2,
                right: 2,
                backgroundColor: '#EF4444',
                color: '#FFFFFF',
                borderRadius: '50%',
                width: 15,
                height: 15,
                fontSize: 10,
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: '2px solid #FFFFFF'
              }}>
                {unreadNotifications}
              </span>
            )}
          </button>
        )}

        {showBack && onOpenDrawer && (
          <button
            onClick={onOpenDrawer}
            style={{
              background: 'linear-gradient(135deg, #EFF6FF 0%, #DBEAFE 100%)',
              border: '1px solid #BFDBFE',
              borderRadius: '50%',
              width: 36,
              height: 36,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              color: '#1769E0',
              boxShadow: '0 2px 6px rgba(23,105,224,0.15)'
            }}
            aria-label="Open profile menu"
          >
            <Menu size={18} />
          </button>
        )}
      </div>
    </header>
  );
};


