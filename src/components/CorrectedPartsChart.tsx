import React, { useState, useEffect } from 'react';
import { Bar } from 'react-chartjs-2';
import { db } from '../mysqlClient';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

interface CorrectedPartsChartProps {
  refreshTrigger?: number;
}

interface CorrectedPartsSummary {
  issue_type: string;
  corrected_count: number;
}

const CorrectedPartsChart: React.FC<CorrectedPartsChartProps> = ({ refreshTrigger = 0 }) => {
  const [chartData, setChartData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string>('');

  const fetchCorrectedPartsData = async () => {
    setIsLoading(true);
    setError('');
    
    try {
      // First, get all possible issue types from the database
      const { data: allIssuesData, error: allIssuesError } = await db
        .from('issues')
        .select('issue_type')
        .order('issue_type');

      if (allIssuesError) {
        console.error('Error fetching all issues data:', allIssuesError);
        setError('Failed to load corrected parts data');
        return;
      }

      // Get unique issue types
      const issueTypeSet = new Set(allIssuesData?.map((item: any) => item.issue_type) || []);
      const allIssueTypes = Array.from(issueTypeSet) as string[];
      
      // Query corrected parts grouped by issue_type
      const { data: correctedData, error } = await db
        .from('issues')
        .select('issue_type')
        .eq('is_corrected', true)
        .order('issue_type');

      if (error) {
        console.error('Error fetching corrected parts data:', error);
        setError('Failed to load corrected parts data');
        return;
      }

      // Initialize all issue types with 0 count
      const issueGroups: { [key: string]: number } = {};
      allIssueTypes.forEach((issueType: string) => {
        issueGroups[issueType] = 0;
      });
      
      // Count corrected parts for each issue type
      if (correctedData) {
        correctedData.forEach((item: any) => {
          if (issueGroups.hasOwnProperty(item.issue_type)) {
            issueGroups[item.issue_type]++;
          }
        });
      }

      // Convert to chart format - show all categories
      const labels = allIssueTypes;
      const counts = labels.map((label: string) => issueGroups[label]);

      // Use consistent green color for all bars (matching the image)
      const backgroundColor = 'rgba(34, 197, 94, 0.8)'; // Green color
      const borderColor = 'rgba(34, 197, 94, 1)';

      setChartData({
        labels: labels,
        datasets: [{
          label: 'Corrected Parts',
          data: counts,
          backgroundColor: backgroundColor,
          borderColor: borderColor,
          borderWidth: 1,
          borderRadius: 0, // Sharp corners like in the image
          borderSkipped: false,
        }],
      });
    } catch (err) {
      console.error('Error fetching corrected parts data:', err);
      setError('Failed to load corrected parts data');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCorrectedPartsData();
  }, []);

  useEffect(() => {
    console.log('CorrectedPartsChart refreshTrigger changed:', refreshTrigger);
    if (refreshTrigger > 0) {
      console.log('CorrectedPartsChart refreshing data...');
      fetchCorrectedPartsData();
    }
  }, [refreshTrigger]);

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false, // Hide legend
      },
      title: {
        display: false, // We'll add custom title outside the chart
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleColor: '#fff',
        bodyColor: '#fff',
        borderColor: '#374151',
        borderWidth: 1,
        cornerRadius: 8,
        callbacks: {
          label: function(context: any) {
            return `${context.parsed.y} corrected parts`;
          }
        }
      }
    },
    scales: {
      x: {
        grid: {
          display: false,
        },
        ticks: {
          color: '#6b7280',
          font: {
            size: 10,
          },
          maxRotation: 45,
          minRotation: 45, // Rotate labels like in the image
        },
      },
      y: {
        beginAtZero: true,
        grid: {
          display: true,
          color: 'rgba(0, 0, 0, 0.1)',
          drawBorder: false,
        },
        ticks: {
          color: '#6b7280',
          font: {
            size: 10,
          },
          stepSize: 1, // Ensure whole numbers only
        },
      },
    },
    animation: {
      duration: 1000,
      easing: 'easeInOutQuart' as const,
    },
  };

  if (isLoading) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100%',
        backgroundColor: '#ffffff',
        borderRadius: '12px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        border: '1px solid #e5e7eb'
      }}>
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '12px'
        }}>
          <div style={{
            width: '40px',
            height: '40px',
            border: '4px solid #f3f4f6',
            borderTop: '4px solid #4A90E2',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite'
          }} />
          <p style={{
            color: '#6b7280',
            fontSize: '0.875rem',
            margin: 0
          }}>
            Loading corrected parts data...
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
        height: '100%',
        backgroundColor: '#ffffff',
        borderRadius: '12px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        border: '1px solid #e5e7eb'
      }}>
        <div style={{
          textAlign: 'center',
          padding: '20px'
        }}>
          <div style={{
            fontSize: '2rem',
            marginBottom: '12px'
          }}>⚠️</div>
          <p style={{
            color: '#dc2626',
            fontSize: '0.875rem',
            margin: 0,
            fontWeight: '500'
          }}>
            {error}
          </p>
        </div>
      </div>
    );
  }

  if (!chartData) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100%',
        backgroundColor: '#ffffff',
        borderRadius: '12px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        border: '1px solid #e5e7eb'
      }}>
        <div style={{
          textAlign: 'center',
          padding: '40px'
        }}>
          <div style={{
            fontSize: '3rem',
            marginBottom: '16px',
            opacity: 0.5
          }}>📊</div>
          <h3 style={{
            color: '#374151',
            fontSize: '1.125rem',
            fontWeight: '600',
            margin: '0 0 8px 0'
          }}>
            No Data Available
          </h3>
          <p style={{
            color: '#6b7280',
            fontSize: '0.875rem',
            margin: 0,
            lineHeight: '1.5'
          }}>
            Upload some data to see the correction status distribution.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ 
      width: '100%', 
      height: '100%',
      padding: '20px', 
      backgroundColor: '#ffffff', 
      borderRadius: '12px',
      boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
      border: '1px solid #e5e7eb',
      display: 'flex',
      flexDirection: 'column'
    }}>
      <h3 style={{ 
        margin: '0 0 8px 0', 
        color: '#1f2937',
        fontSize: '18px',
        fontWeight: '600'
      }}>
        Correction Status Distribution
      </h3>
      <p style={{ 
        margin: '0 0 20px 0', 
        color: '#6b7280',
        fontSize: '14px'
      }}>
        Distribution of parts corrected in each category
      </p>
      <div style={{ flex: 1, minHeight: 0 }}>
        <Bar data={chartData} options={chartOptions} />
      </div>
    </div>
  );
};

export default CorrectedPartsChart;