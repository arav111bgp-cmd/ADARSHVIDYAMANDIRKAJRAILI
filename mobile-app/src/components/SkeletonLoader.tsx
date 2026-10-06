import React from 'react';

export const SkeletonCard: React.FC = () => {
  return (
    <div className="avm-card animate-pulse" style={{ padding: 16, marginBottom: 12 }}>
      <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 12 }}>
        <div style={{ width: 44, height: 44, borderRadius: '50%', backgroundColor: '#E2E8F0' }} />
        <div style={{ flex: 1 }}>
          <div style={{ width: '60%', height: 14, backgroundColor: '#E2E8F0', borderRadius: 4, marginBottom: 6 }} />
          <div style={{ width: '40%', height: 10, backgroundColor: '#E2E8F0', borderRadius: 4 }} />
        </div>
      </div>
      <div style={{ width: '100%', height: 12, backgroundColor: '#E2E8F0', borderRadius: 4, marginBottom: 6 }} />
      <div style={{ width: '80%', height: 12, backgroundColor: '#E2E8F0', borderRadius: 4 }} />
    </div>
  );
};

export const SkeletonDashboard: React.FC = () => {
  return (
    <div style={{ padding: 16 }}>
      <div className="animate-pulse" style={{ height: 120, borderRadius: 16, backgroundColor: '#E2E8F0', marginBottom: 16 }} />
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
        <div className="animate-pulse" style={{ height: 90, borderRadius: 14, backgroundColor: '#E2E8F0' }} />
        <div className="animate-pulse" style={{ height: 90, borderRadius: 14, backgroundColor: '#E2E8F0' }} />
      </div>
      <SkeletonCard />
      <SkeletonCard />
    </div>
  );
};
