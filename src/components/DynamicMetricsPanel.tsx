import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';

interface DynamicMetricsPanelProps {
  refreshTrigger?: number;
}

interface MetricData {
  category: string;
  total: number;
  corrected: number;
  remaining: number;
  icon: string;
  backgroundColor: string;
  description: string;
}

interface CategoryStats {
  [category: string]: {
    total: number;
    corrected: number;
    remaining: number;
  };
}

const DynamicMetricsPanel: React.FC<DynamicMetricsPanelProps> = ({ refreshTrigger = 0 }) => {
  const [metricsData, setMetricsData] = useState<MetricData[]>([]);
  const [totalStats, setTotalStats] = useState({ total: 0, corrected: 0, remaining: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string>('');

  // Define icons and styling for different issue categories
  const getCategoryConfig = (category: string) => {
    const configs: { [key: string]: { icon: string; baseColor: string; description: string } } = {
      'ToolBox Parts': { 
        icon: "⚠️", 
        baseColor: "#f59e0b", 
        description: "Parts missing file extensions" 
      },
      'Surface Parts': { 
        icon: "🔍", 
        baseColor: "#8b5cf6", 
        description: "Parts with surface body issues" 
      },
      'Missing Extensions': { 
        icon: "</>" , 
        baseColor: "#06b6d4", 
        description: "Parts with naming issues" 
      },
      'Non English Characters': { 
        icon: "🔤", 
        baseColor: "#10b981", 
        description: "Parts with character encoding issues" 
      },
      'Part Number Validation': { 
        icon: "🔢", 
        baseColor: "#ef4444", 
        description: "Parts with invalid numbers" 
      },
      'Default': { 
        icon: "📋", 
        baseColor: "#6b7280", 
        description: "Issue count for category" 
      }
    };
    
    return configs[category] || configs['Default'];
  };

  // Get background color based on correction status
  const getBackgroundColor = (corrected: number, total: number, baseColor: string) => {
    if (total === 0) return '#f3f4f6'; // Gray for no data
    if (corrected === total) return '#dcfce7'; // Green for fully corrected
    if (corrected > 0) return '#fef3c7'; // Yellow for partially corrected
    return '#fee2e2'; // Light red for no corrections
  };

  // Fetch correction data from database
  const fetchMetricsData = async () => {
    setIsLoading(true);
    setError('');
    
    try {
      const { data, error } = await supabase
        .from('issues')
        .select('part_number, owner, issue_type, is_corrected');

      if (error) {
        console.error('Error fetching metrics data:', error);
        setError('Failed to load metrics data');
        return;
      }

      // Group issues by part_number and owner combination (same logic as PartsTable)
      const groupedIssues = new Map<string, { issue_types: Set<string>, is_corrected: boolean }>();
      
      if (data) {
        data.forEach((item: any) => {
          const key = `${item.part_number}|${item.owner || 'null'}`;
          
          if (!groupedIssues.has(key)) {
            groupedIssues.set(key, {
              issue_types: new Set([item.issue_type]),
              is_corrected: item.is_corrected
            });
          } else {
            const existing = groupedIssues.get(key)!;
            existing.issue_types.add(item.issue_type);
            // If any issue for this part is corrected, consider the part corrected
            if (item.is_corrected) {
              existing.is_corrected = true;
            }
          }
        });
      }

      // Process the grouped data to get counts by category
      const categoryStats: CategoryStats = {};
      let totalCount = 0;
      let totalCorrected = 0;
      
      // Count unique parts per category
      groupedIssues.forEach((partData) => {
        const isPartCorrected = partData.is_corrected;
        totalCount++;
        
        if (isPartCorrected) {
          totalCorrected++;
        }
        
        // Count this part for each issue type it has
        partData.issue_types.forEach((issueType) => {
          if (!categoryStats[issueType]) {
            categoryStats[issueType] = { total: 0, corrected: 0, remaining: 0 };
          }
          
          categoryStats[issueType].total++;
          
          if (isPartCorrected) {
            categoryStats[issueType].corrected++;
          } else {
            categoryStats[issueType].remaining++;
          }
        });
      });

      // Calculate total stats by summing up all category stats
      let totalIssuesCount = 0;
      let totalCorrectedIssues = 0;
      let totalRemainingIssues = 0;

      Object.values(categoryStats).forEach(stats => {
        totalIssuesCount += stats.total;
        totalCorrectedIssues += stats.corrected;
        totalRemainingIssues += stats.remaining;
      });

      // Set total stats based on sum of all categories
      setTotalStats({
        total: totalIssuesCount,
        corrected: totalCorrectedIssues,
        remaining: totalRemainingIssues
      });

      // Convert to metrics data format (limit to 5 categories)
      const categories = Object.keys(categoryStats).slice(0, 5);
        const metrics: MetricData[] = categories.map(category => {
        const stats = categoryStats[category];
        const config = getCategoryConfig(category);
        
        return {
          category,
          total: stats.total,
          corrected: stats.corrected,
          remaining: stats.remaining,
          icon: config.icon, // Always use the original icon
          backgroundColor: config.baseColor + '20', // Light version of base color
          description: config.description
        };
      });      setMetricsData(metrics);
    } catch (err) {
      console.error('Error fetching metrics data:', err);
      setError('Failed to load metrics data');
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch data on component mount and when refreshTrigger changes
  useEffect(() => {
    fetchMetricsData();
  }, []);

  useEffect(() => {
    if (refreshTrigger > 0) {
      fetchMetricsData();
    }
  }, [refreshTrigger]);

  // Individual metric card component
  const MetricCard: React.FC<{ metric: MetricData; isTotal?: boolean }> = ({ metric, isTotal = false }) => {
    const displayValue = metric.remaining; // Always show remaining issues for both total and category cards

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
            backgroundColor: metric.backgroundColor,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginRight: '12px',
            fontSize: '16px',
            flexShrink: 0
          }}>
            {metric.icon}
          </div>
          <div style={{
            fontSize: '14px',
            fontWeight: '500',
            color: '#6b7280',
            lineHeight: '1.3',
            flex: 1
          }}>
            {isTotal ? 'Remaining Issues' : metric.category}
          </div>
        </div>

        {/* Main value */}
        <div style={{
          fontSize: '36px',
          fontWeight: '700',
          color: '#111827',
          marginBottom: '8px',
          lineHeight: '1',
          textAlign: 'left',
          display: 'block'
        }}>
          {displayValue}
        </div>

        {/* Simple description */}
        <div style={{
          fontSize: '12px',
          color: '#9ca3af',
          lineHeight: '1.3'
        }}>
          {metric.description}
        </div>
      </div>
    );
  };

  if (isLoading) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '200px',
        backgroundColor: '#ffffff',
        borderRadius: '12px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        border: '1px solid #e5e7eb',
        margin: '20px 0'
      }}>
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '16px'
        }}>
          <div style={{
            width: '48px',
            height: '48px',
            border: '4px solid #f3f4f6',
            borderTop: '4px solid #3b82f6',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite'
          }} />
          <p style={{
            color: '#6b7280',
            fontSize: '16px',
            margin: 0
          }}>
            Loading metrics data...
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '200px',
        backgroundColor: '#ffffff',
        borderRadius: '12px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        border: '1px solid #e5e7eb',
        margin: '20px 0'
      }}>
        <div style={{
          textAlign: 'center',
          padding: '40px'
        }}>
          <div style={{
            fontSize: '48px',
            marginBottom: '16px',
            opacity: 0.5
          }}>⚠️</div>
          <h3 style={{
            color: '#dc2626',
            fontSize: '18px',
            fontWeight: '600',
            margin: '0 0 8px 0'
          }}>
            Error Loading Data
          </h3>
          <p style={{
            color: '#6b7280',
            fontSize: '14px',
            margin: 0
          }}>
            {error}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ 
      maxWidth: '1400px', 
      margin: '0 auto 20px auto', 
      padding: '0 20px'
    }}>


      {/* Metrics Grid */}
      <div style={{
        display: 'flex',
        gap: '16px',
        overflowX: 'auto',
        paddingBottom: '10px'
      }}>
        {/* Remaining Issues Card */}
        <MetricCard 
          metric={{
            category: 'Remaining',
            total: totalStats.total,
            corrected: totalStats.corrected,
            remaining: totalStats.remaining,
            icon: totalStats.remaining === 0 ? "🎉" : "�",
            backgroundColor: totalStats.remaining === 0 ? "#dcfce7" : "#fef3c7",
            description: 'Uncorrected issues across all categories'
          }}
          isTotal={true}
        />

        {/* Category Cards */}
        {metricsData.map((metric, index) => (
          <MetricCard key={metric.category} metric={metric} />
        ))}

        {/* Empty state for when no categories exist */}
        {metricsData.length === 0 && !isLoading && (
          <div style={{
            gridColumn: '1 / -1',
            textAlign: 'center',
            padding: '60px 20px',
            backgroundColor: '#ffffff',
            borderRadius: '12px',
            border: '2px dashed #d1d5db'
          }}>
            <div style={{
              fontSize: '64px',
              marginBottom: '24px',
              opacity: 0.5
            }}>📊</div>
            <h3 style={{
              color: '#374151',
              fontSize: '20px',
              fontWeight: '600',
              margin: '0 0 12px 0'
            }}>
              No Issues Found
            </h3>
            <p style={{
              color: '#6b7280',
              fontSize: '16px',
              margin: 0,
              lineHeight: '1.5'
            }}>
              Upload some data to see issue metrics and track correction progress.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default DynamicMetricsPanel;