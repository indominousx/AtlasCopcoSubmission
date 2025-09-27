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
  // Debug logging
  console.log(`MetricCard ${title}: value = ${value}, type = ${typeof value}`);
  
  return (
    <div style={{
      backgroundColor: 'white',
      borderRadius: '8px',
      padding: '20px',
      boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
      border: '1px solid #e5e7eb',
      minWidth: '150px',
      minHeight: '120px',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'space-between',
      flex: '1'
    }}>
      {/* Header with icon and title */}
      <div style={{ display: 'flex', alignItems: 'flex-start', marginBottom: '12px' }}>
        <div style={{
          width: '36px',
          height: '36px',
          borderRadius: '8px',
          backgroundColor: backgroundColor,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginRight: '12px',
          fontSize: '16px',
          flexShrink: 0
        }}>
          {icon}
        </div>
        <div style={{
          fontSize: '14px',
          fontWeight: '500',
          color: '#6b7280',
          lineHeight: '1.3',
          flex: 1
        }}>
          {title}
        </div>
      </div>

      {/* Value */}
      <div style={{
        fontSize: '36px',
        fontWeight: '700',
        color: '#111827',
        marginBottom: '8px',
        lineHeight: '1',
        textAlign: 'left',
        display: 'block'
      }}>
        {value}
      </div>

      {/* Description */}
      <div style={{
        fontSize: '12px',
        color: '#9ca3af',
        lineHeight: '1.3'
      }}>
        {description}
      </div>
    </div>
  );
};

export default MetricCard;