import React from 'react';

interface NavigationBarProps {
  activeTab?: string;
  onTabChange?: (tab: string) => void;
}

const NavigationBar: React.FC<NavigationBarProps> = ({ activeTab = 'Dashboard', onTabChange }) => {
  const handleTabClick = (tab: string) => {
    if (onTabChange) {
      onTabChange(tab);
    }
  };

  return (
    <nav style={{
      backgroundColor: '#1e40af', // Blue background similar to the image
      color: 'white',
      padding: '0 20px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      height: '60px',
      boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
      position: 'sticky',
      top: 0,
      zIndex: 1000
    }}>
      {/* Left side - Logo/Title */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '12px'
      }}>
        {/* Icon/Logo */}
        <div style={{
          width: '32px',
          height: '32px',
          backgroundColor: 'rgba(255, 255, 255, 0.2)',
          borderRadius: '4px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <svg 
            width="20" 
            height="20" 
            viewBox="0 0 24 24" 
            fill="currentColor"
          >
            <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
          </svg>
        </div>
        
        {/* Title */}
        <h1 style={{
          margin: 0,
          fontSize: '18px',
          fontWeight: '600',
          letterSpacing: '0.5px'
        }}>
          PRISM – PLM Records Integrity & Standards Management
        </h1>
      </div>

      {/* Right side - Navigation Items */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px'
      }}>
        {['Admin', 'Dashboard', 'History', 'Chatbot'].map((tab) => (
          <button
            key={tab}
            onClick={() => handleTabClick(tab)}
            style={{
              backgroundColor: activeTab === tab ? 'rgba(255, 255, 255, 0.2)' : 'transparent',
              color: 'white',
              border: 'none',
              padding: '8px 16px',
              borderRadius: '6px',
              fontSize: '14px',
              fontWeight: '500',
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => {
              if (activeTab !== tab) {
                e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
              }
            }}
            onMouseLeave={(e) => {
              if (activeTab !== tab) {
                e.currentTarget.style.backgroundColor = 'transparent';
              }
            }}
          >
            {tab}
          </button>
        ))}
      </div>
    </nav>
  );
};

export default NavigationBar;