import React from 'react';
import MetricCard from './MetricCard';

interface MetricCardsGridProps {
  totalSummary: { [key: string]: number };
}

const MetricCardsGrid: React.FC<MetricCardsGridProps> = ({ totalSummary }) => {
  // Calculate total parts analyzed
  const totalParts = Object.values(totalSummary).reduce((sum, count) => sum + count, 0);

  // Get all issue categories from totalSummary
  const issueCategories = Object.keys(totalSummary);
  
  // Define icons and colors for different issue types
  const getIssueCardConfig = (issueType: string) => {
    const configs: { [key: string]: { icon: string; backgroundColor: string; description: string } } = {
      'ToolBox Parts': { 
        icon: "⚠️", 
        backgroundColor: "#fee2e2", 
        description: "Parts missing file extensions" 
      },
      'Surface Parts': { 
        icon: "🔍", 
        backgroundColor: "#fef3c7", 
        description: "Parts with surface body issues" 
      },
      'Missing Extensions': { 
        icon: "</>" , 
        backgroundColor: "#ede9fe", 
        description: "Parts with naming issues" 
      },
      'Non English Characters': { 
        icon: "✓", 
        backgroundColor: "#dcfce7", 
        description: "Issues resolved in period" 
      },
      'Part Number Validation': { 
        icon: "✓", 
        backgroundColor: "#dcfce7", 
        description: "Issues resolved in period" 
      },
      'Default': { 
        icon: "📋", 
        backgroundColor: "#f3f4f6", 
        description: "Issue count for category" 
      }
    };
    
    return configs[issueType] || configs['Default'];
  };

  // Create metrics array starting with total card
  const metrics = [
    {
      title: "Total Issues",
      value: totalParts,
      description: "Total issues across all categories",
      icon: "📊",
      backgroundColor: "#dbeafe"
    }
  ];

  // Add cards for each issue category (limit to 5 as requested)
  const limitedCategories = issueCategories.slice(0, 5);
  limitedCategories.forEach(category => {
    const config = getIssueCardConfig(category);
    metrics.push({
      title: category,
      value: totalSummary[category] || 0,
      description: config.description,
      icon: config.icon,
      backgroundColor: config.backgroundColor
    });
  });

  return (
    <div style={{ 
      maxWidth: '1400px', 
      margin: '0 auto 30px auto', 
      padding: '0 20px'
    }}>
      <div style={{
        display: 'flex',
        gap: '16px',
        overflowX: 'auto',
        paddingBottom: '10px'
      }}>
        {metrics.map((metric, index) => (
          <MetricCard
            key={metric.title}
            title={metric.title}
            value={metric.value}
            description={metric.description}
            icon={metric.icon}
            color="#374151"
            backgroundColor={metric.backgroundColor}
          />
        ))}
      </div>
    </div>
  );
};

export default MetricCardsGrid;