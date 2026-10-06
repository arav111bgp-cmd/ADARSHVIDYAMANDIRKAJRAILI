import React from 'react';
import { Inbox, AlertCircle } from 'lucide-react';

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description: string;
  actionText?: string;
  onAction?: () => void;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  actionText,
  onAction
}) => {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '40px 20px',
      textAlign: 'center',
      backgroundColor: '#FFFFFF',
      borderRadius: 16,
      border: '1px dashed #CBD5E1',
      margin: '16px 0'
    }}>
      <div style={{
        width: 56,
        height: 56,
        borderRadius: '50%',
        backgroundColor: '#EAF3FF',
        color: '#1769E0',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 12
      }}>
        {icon || <Inbox size={28} />}
      </div>
      <h3 style={{ fontSize: 16, fontWeight: 700, color: '#172033', marginBottom: 6 }}>
        {title}
      </h3>
      <p style={{ fontSize: 13, color: '#667085', maxWidth: 300, marginBottom: actionText ? 16 : 0 }}>
        {description}
      </p>
      {actionText && onAction && (
        <button className="avm-btn-secondary" onClick={onAction}>
          {actionText}
        </button>
      )}
    </div>
  );
};
