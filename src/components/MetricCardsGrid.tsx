import React from 'react';
import MetricCard from './MetricCard';

interface MetricCardsGridProps {
  totalSummary: { [key: string]: number };
}

const MetricCardsGrid: React.FC<MetricCardsGridProps> = ({ totalSummary }) => {
  if (Object.keys(totalSummary).length === 0) {
    return null;
  }

  // Calculate total parts analyzed
  const totalParts = Object.values(totalSummary).reduce((sum, count) => sum + count, 0);

  // Define card configurations for different issue types
  const getCardConfig = (category: string, count: number) => {
    const configs: { [key: string]: any } = {
      'Missing Extensions': {
        icon: '⚠️',
        color: '#ef4444',
        backgroundColor: '#fef2f2',
        description: 'New issues in period'
      },
      'Surface Bodies': {
        icon: '⚠️',
        color: '#f59e0b',
        backgroundColor: '#fffbeb',
        description: 'New issues in period'
      },
      'Incorrect Naming': {
        icon: '</>', 
        color: '#8b5cf6',
        backgroundColor: '#f3f4f6',
        description: 'Parts with non-English characters'
      },
      'Corrected Parts': {
        icon: '✓',
        color: '#10b981',
        backgroundColor: '#f0fdf4',
        description: 'Issues resolved in period'
      },
      'Parts with Issues': {
        icon: '⚠️',
        color: '#f59e0b',
        backgroundColor: '#fffbeb',
        description: 'Unique parts with one or more issues'
      },
      'default': {
        icon: '📊',
        color: '#6b7280',
        backgroundColor: '#f9fafb',
        description: 'Issues found in category'
      }
    };

    return configs[category] || configs['default'];
  };

  return (
    <div style={{ 
      maxWidth: '1200px', 
      margin: '0 auto 40px auto', 
      padding: '20px'
    }}>
      <h2 style={{ 
        textAlign: 'center', 
        marginBottom: '30px', 
        color: '#1f2937',
        fontSize: '24px',
        fontWeight: '600'
      }}>
        Issue Analysis Summary
      </h2>
      
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
        gap: '20px',
        marginBottom: '20px'
      }}>
        {/* Total Parts Card */}
        <MetricCard
          title="Total Issues"
          value={totalParts}
          description="Total issues analyzed across all categories"
          icon="📊"
          color="#3b82f6"
          backgroundColor="#eff6ff"
        />

        {/* Individual Category Cards */}
        {Object.entries(totalSummary).map(([category, count]) => {
          const config = getCardConfig(category, count);
          return (
            <MetricCard
              key={category}
              title={category}
              value={count}
              description={config.description}
              icon={config.icon}
              color={config.color}
              backgroundColor={config.backgroundColor}
            />
          );
        })}

        {/* Summary Card - Parts with Issues (if we have multiple categories) */}
        {Object.keys(totalSummary).length > 1 && (
          <MetricCard
            title="Issue Categories"
            value={Object.keys(totalSummary).length}
            description="Different types of issues identified"
            icon="📂"
            color="#8b5cf6"
            backgroundColor="#f5f3ff"
          />
        )}
      </div>
    </div>
  );
};

export default MetricCardsGrid;