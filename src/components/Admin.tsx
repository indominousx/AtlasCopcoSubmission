import React from 'react';

interface AdminProps {
  refreshTrigger?: number;
}

const Admin: React.FC<AdminProps> = ({ refreshTrigger = 0 }) => {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '400px',
      backgroundColor: '#ffffff',
      borderRadius: '12px',
      boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
      border: '1px solid #e5e7eb',
      margin: '20px'
    }}>
      <div style={{
        textAlign: 'center',
        padding: '40px'
      }}>
        <h2 style={{
          color: '#1f2937',
          fontSize: '28px',
          fontWeight: '600',
          margin: '0 0 16px 0'
        }}>
          Admin Panel
        </h2>
        <p style={{
          color: '#6b7280',
          fontSize: '18px',
          margin: 0,
          fontWeight: '400'
        }}>
          Will be updated soon
        </p>
      </div>
    </div>
  );
};

export default Admin;