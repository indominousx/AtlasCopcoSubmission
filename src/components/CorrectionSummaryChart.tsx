import React, { useState, useEffect } from 'react';
import { Bar } from 'react-chartjs-2';
import { supabase } from '../supabaseClient';
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

interface CorrectionSummaryChartProps {
  refreshTrigger?: number;
}

interface IssueSummary {
  issue_type: string;
  total_count: number;
  corrected_count: number;
  uncorrected_count: number;
}

const CorrectionSummaryChart: React.FC<CorrectionSummaryChartProps> = ({ refreshTrigger = 0 }) => {
  const [chartData, setChartData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string>('');

  const fetchSummaryData = async () => {
    setIsLoading(true);
    setError('');
    
    try {
      // Get all issues with their correction status
      const { data, error } = await supabase
        .from('issues')
        .select('issue_type, is_corrected')
        .order('issue_type');

      if (error) {
        console.error('Error fetching summary data:', error);
        setError('Failed to load summary data');
        return;
      }

      if (data && data.length > 0) {
        // Group data by issue_type and count corrected/uncorrected
        const issueGroups: { [key: string]: { corrected: number; uncorrected: number } } = {};
        
        data.forEach((item: any) => {
          if (!issueGroups[item.issue_type]) {
            issueGroups[item.issue_type] = { corrected: 0, uncorrected: 0 };
          }
          
          if (item.is_corrected) {
            issueGroups[item.issue_type].corrected++;
          } else {
            issueGroups[item.issue_type].uncorrected++;
          }
        });

        // Convert to chart format
        const labels = Object.keys(issueGroups).sort();
        const correctedCounts = labels.map(label => issueGroups[label].corrected);
        const uncorrectedCounts = labels.map(label => issueGroups[label].uncorrected);

        setChartData({
          labels: labels,
          datasets: [
            {
              label: 'Uncorrected Parts',
              data: uncorrectedCounts,
              backgroundColor: 'rgba(239, 68, 68, 0.8)', // Red
              borderColor: 'rgba(239, 68, 68, 1)',
              borderWidth: 1,
              borderRadius: 0,
              borderSkipped: false,
            },
            {
              label: 'Corrected Parts',
              data: correctedCounts,
              backgroundColor: 'rgba(34, 197, 94, 0.8)', // Green
              borderColor: 'rgba(34, 197, 94, 1)',
              borderWidth: 1,
              borderRadius: 0,
              borderSkipped: false,
            }
          ],
        });
      } else {
        // No data available
        setChartData(null);
      }
    } catch (err) {
      console.error('Error fetching summary data:', err);
      setError('Failed to load summary data');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSummaryData();
  }, []);

  useEffect(() => {
    if (refreshTrigger > 0) {
      fetchSummaryData();
    }
  }, [refreshTrigger]);

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: true,
        position: 'top' as const,
        labels: {
          color: '#374151',
          font: {
            size: 12,
          },
          usePointStyle: true,
          pointStyle: 'rect' as const,
        }
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
            const label = context.dataset.label || '';
            const value = context.parsed.y;
            return `${label}: ${value} parts`;
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
          minRotation: 45,
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
        backgroundColor: 'white',
        borderRadius: '12px',
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
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
            Loading correction summary...
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
        backgroundColor: 'white',
        borderRadius: '12px',
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
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
        backgroundColor: 'white',
        borderRadius: '12px',
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
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
            Upload some data to see the correction summary.
          </p>
        </div>
      </div>
    );
  }

  // Calculate totals for summary
  const totalUncorrected = chartData.datasets[0].data.reduce((sum: number, value: number) => sum + value, 0);
  const totalCorrected = chartData.datasets[1].data.reduce((sum: number, value: number) => sum + value, 0);
  const totalParts = totalUncorrected + totalCorrected;

  return (
    <div style={{
      height: '100%',
      backgroundColor: 'white',
      borderRadius: '12px',
      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
      border: '1px solid #e5e7eb',
      padding: '24px',
      display: 'flex',
      flexDirection: 'column'
    }}>
      {/* Custom Title and Subtitle */}
      <div style={{ marginBottom: '20px' }}>
        <h3 style={{
          margin: '0 0 8px 0',
          fontSize: '1.125rem',
          fontWeight: '600',
          color: '#374151',
          lineHeight: '1.2'
        }}>
          Correction Progress Overview
        </h3>
        <p style={{
          margin: 0,
          fontSize: '0.875rem',
          color: '#6b7280',
          lineHeight: '1.4'
        }}>
          Comparison of corrected vs uncorrected parts by category
        </p>
      </div>
      
      <div style={{ flex: 1, position: 'relative', minHeight: '300px' }}>
        <Bar data={chartData} options={chartOptions} />
      </div>
      
      {/* Summary Stats */}
      <div style={{
        marginTop: '20px',
        padding: '16px',
        backgroundColor: '#f9fafb',
        borderRadius: '8px',
        border: '1px solid #e5e7eb'
      }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr 1fr',
          gap: '16px',
          textAlign: 'center'
        }}>
          <div>
            <div style={{
              fontSize: '1.5rem',
              fontWeight: '700',
              color: '#374151',
              marginBottom: '4px'
            }}>
              {totalParts}
            </div>
            <div style={{
              fontSize: '0.75rem',
              color: '#6b7280',
              textTransform: 'uppercase',
              letterSpacing: '0.05em'
            }}>
              Total Parts
            </div>
          </div>
          <div>
            <div style={{
              fontSize: '1.5rem',
              fontWeight: '700',
              color: '#ef4444',
              marginBottom: '4px'
            }}>
              {totalUncorrected}
            </div>
            <div style={{
              fontSize: '0.75rem',
              color: '#6b7280',
              textTransform: 'uppercase',
              letterSpacing: '0.05em'
            }}>
              Uncorrected
            </div>
          </div>
          <div>
            <div style={{
              fontSize: '1.5rem',
              fontWeight: '700',
              color: '#22c55e',
              marginBottom: '4px'
            }}>
              {totalCorrected}
            </div>
            <div style={{
              fontSize: '0.75rem',
              color: '#6b7280',
              textTransform: 'uppercase',
              letterSpacing: '0.05em'
            }}>
              Corrected
            </div>
          </div>
        </div>
        
        {/* Progress bar */}
        {totalParts > 0 && (
          <div style={{ marginTop: '16px' }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '8px'
            }}>
              <span style={{
                fontSize: '0.875rem',
                fontWeight: '600',
                color: '#374151'
              }}>
                Correction Progress
              </span>
              <span style={{
                fontSize: '0.875rem',
                fontWeight: '600',
                color: '#22c55e'
              }}>
                {Math.round((totalCorrected / totalParts) * 100)}%
              </span>
            </div>
            <div style={{
              width: '100%',
              height: '8px',
              backgroundColor: '#fee2e2',
              borderRadius: '4px',
              overflow: 'hidden'
            }}>
              <div style={{
                width: `${(totalCorrected / totalParts) * 100}%`,
                height: '100%',
                backgroundColor: '#22c55e',
                borderRadius: '4px',
                transition: 'width 0.5s ease'
              }} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CorrectionSummaryChart;