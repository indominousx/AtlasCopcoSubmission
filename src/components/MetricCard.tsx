import React from 'react';

interface MetricCardProps {
  title: string;
  value: number;
  description: string;
  icon: string;
  color: string;
  backgroundColor: string;
}

const MetricCard: React.FC<MetricCardProps> = ({ 
  title, 
  value, 
  description, 
  icon, 
  color, 
  backgroundColor 
}) => {
  return (
    <div style={{
      backgroundColor: 'white',
      borderRadius: '12px',
      padding: '24px',
      boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
      border: '1px solid #f0f0f0',
      minHeight: '140px',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'space-between'
    }}>
      {/* Header with icon and title */}
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: '16px' }}>
        <div style={{
          width: '40px',
          height: '40px',
          borderRadius: '50%',
          backgroundColor: backgroundColor,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginRight: '12px',
          fontSize: '18px'
        }}>
          {icon}
        </div>
        <div style={{
          fontSize: '16px',
          fontWeight: '500',
          color: '#6b7280',
          lineHeight: '1.2'
        }}>
          {title}
        </div>
      </div>

      {/* Value */}
      <div style={{
        fontSize: '32px',
        fontWeight: '700',
        color: '#1f2937',
        marginBottom: '8px',
        lineHeight: '1'
      }}>
        {value.toLocaleString()}
      </div>

      {/* Description */}
      <div style={{
        fontSize: '14px',
        color: '#9ca3af',
        lineHeight: '1.4'
      }}>
        {description}
      </div>
    </div>
  );
};

export default MetricCard;