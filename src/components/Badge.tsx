import React from 'react';

interface BadgeProps {
  type?: 'success' | 'warning' | 'danger' | 'purple' | 'blue' | 'gray';
  children: React.ReactNode;
  icon?: React.ReactNode;
}

export const Badge: React.FC<BadgeProps> = ({ type = 'blue', children, icon }) => {
  const styles: Record<string, { bg: string; text: string }> = {
    success: { bg: '#EAF8EF', text: '#16A34A' },
    warning: { bg: '#FFFBEB', text: '#F59E0B' },
    danger: { bg: '#FEF2F2', text: '#EF4444' },
    purple: { bg: '#F3E8FF', text: '#7C3AED' },
    blue: { bg: '#EAF3FF', text: '#1769E0' },
    gray: { bg: '#F1F5F9', text: '#475569' }
  };

  const current = styles[type] || styles.blue;

  return (
    <span style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: 4,
      padding: '3px 9px',
      borderRadius: 20,
      fontSize: 11,
      fontWeight: 700,
      backgroundColor: current.bg,
      color: current.text,
      lineHeight: 1.2
    }}>
      {icon}
      {children}
    </span>
  );
};
