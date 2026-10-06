import React from 'react';
import { Home, GraduationCap, Bell, User, BookOpen, Users } from 'lucide-react';

interface BottomNavProps {
  role: 'student' | 'employee' | 'admin';
  activeTab: string;
  onTabChange: (tab: string) => void;
  unreadCount?: number;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  role,
  activeTab,
  onTabChange,
  unreadCount = 2
}) => {
  const studentTabs = [
    { id: 'home', label: 'Home', icon: Home },
    { id: 'academics', label: 'Academics', icon: GraduationCap },
    { id: 'notifications', label: 'Notices', icon: Bell, badge: unreadCount },
    { id: 'profile', label: 'Profile', icon: User }
  ];

  const employeeTabs = [
    { id: 'home', label: 'Home', icon: Home },
    { id: 'classes', label: 'Classes', icon: BookOpen },
    { id: 'notifications', label: 'Notices', icon: Bell, badge: unreadCount },
    { id: 'profile', label: 'Profile', icon: User }
  ];

  const adminTabs = [
    { id: 'home', label: 'Dashboard', icon: Home },
    { id: 'modules', label: 'Modules', icon: BookOpen },
    { id: 'notices', label: 'Notices', icon: Bell, badge: unreadCount },
    { id: 'profile', label: 'Profile', icon: User }
  ];

  const tabs = role === 'student' ? studentTabs : role === 'admin' ? adminTabs : employeeTabs;

  return (
    <nav style={{
      position: 'fixed',
      bottom: 0,
      left: 0,
      right: 0,
      maxWidth: 480,
      margin: '0 auto',
      backgroundColor: '#FFFFFF',
      borderTop: '1px solid #E2E8F0',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-around',
      padding: '8px 4px calc(8px + env(safe-area-inset-bottom, 8px)) 4px',
      zIndex: 100,
      boxShadow: '0 -4px 16px rgba(0,0,0,0.06)'
    }}>
      {tabs.map((tab) => {
        const IconComponent = tab.icon;
        const isActive = activeTab === tab.id;

        return (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            style={{
              background: 'none',
              border: 'none',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 4,
              cursor: 'pointer',
              color: isActive ? '#1769E0' : '#667085',
              fontWeight: isActive ? 700 : 500,
              fontSize: 11,
              position: 'relative',
              flex: 1,
              padding: '4px 0'
            }}
          >
            <div style={{
              position: 'relative',
              padding: '4px 12px',
              borderRadius: 16,
              backgroundColor: isActive ? '#EAF3FF' : 'transparent',
              transition: 'background-color 0.2s ease'
            }}>
              <IconComponent size={20} strokeWidth={isActive ? 2.4 : 1.8} />
              {tab.badge && tab.badge > 0 ? (
                <span style={{
                  position: 'absolute',
                  top: 0,
                  right: 4,
                  backgroundColor: '#EF4444',
                  color: '#FFFFFF',
                  fontSize: 9,
                  fontWeight: 700,
                  width: 15,
                  height: 15,
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  {tab.badge}
                </span>
              ) : null}
            </div>
            <span>{tab.label}</span>
          </button>
        );
      })}
    </nav>
  );
};
