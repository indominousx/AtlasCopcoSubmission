import React, { useState, useEffect } from 'react';
import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

interface LastUploadedChartProps {
  chartData: any;
  isLoading: boolean;
}

const LastUploadedChart: React.FC<LastUploadedChartProps> = ({ chartData, isLoading }) => {
  const [lastUploadedFileName, setLastUploadedFileName] = useState<string>('');

  // Extract filename from chartData when it changes
  useEffect(() => {
    console.log('Chart data received:', chartData); // Debug log
    if (chartData && chartData.fileName) {
      console.log('Setting filename:', chartData.fileName); // Debug log
      setLastUploadedFileName(chartData.fileName);
    } else if (chartData) {
      console.log('Chart data exists but no fileName property:', Object.keys(chartData)); // Debug log
    }
  }, [chartData]);

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: false
      },
      tooltip: {
        callbacks: {
          label: function(context: any) {
            return `${context.dataset.label}: ${context.parsed.y.toLocaleString()} parts`;
          }
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        title: {
          display: true,
          text: 'Number of Parts'
        },
        ticks: {
          stepSize: 1,
          precision: 0,
          callback: function(value: any) {
            return typeof value === 'number' && Number.isInteger(value) ? value.toLocaleString() : '';
          }
        }
      },
      x: {
        title: {
          display: true,
          text: 'Issue Categories'
        },
        ticks: {
          maxRotation: 45,
          minRotation: 0,
          callback: function(value: any, index: number, ticks: any[]): string {
            // Get the actual label from chartData
            if (chartData && chartData.labels && chartData.labels[index]) {
              const label = chartData.labels[index];
              // Truncate long labels and add ellipsis
              if (label && label.length > 15) {
                return label.substring(0, 12) + '...';
              }
              return label;
            }
            return value;
          }
        }
      }
    },
    layout: {
      padding: {
        left: 10,
        right: 10,
        top: 10,
        bottom: 10
      }
    }
  };

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
      {/* Header Section */}
      <div style={{ marginBottom: '4px' }}>
        <h3 style={{ 
          color: '#1f2937', 
          margin: '0 0 4px 0',
          fontSize: '18px',
          fontWeight: '600'
        }}>
          Issue Proportion
        </h3>
        
        {/* Last Uploaded File Link */}
        {lastUploadedFileName ? (
          <p style={{ 
            margin: '0 0 12px 0', 
            color: '#131c2aff',
            fontSize: '20px',
            fontWeight: '500'
          }}>
            Last File Uploaded: {lastUploadedFileName}
          </p>
        ) : chartData && chartData.labels && chartData.labels.length > 0 && (
          <p style={{ 
            margin: '0 0 12px 0', 
            color: '#6b7280',
            fontSize: '20px'
          }}>
            Last File Uploaded: (name not available)
          </p>
        )}
      </div>

      {/* Chart Section */}
      <div style={{ 
        backgroundColor: '#f9fafb', 
        padding: '20px', 
        borderRadius: '8px',
        border: '1px solid #e5e7eb',
        flex: 1,
        minHeight: 0
      }}>
        {isLoading ? (
          <div style={{ textAlign: 'center', padding: '60px' }}>
            <div style={{ 
              fontSize: '18px', 
              color: '#6b7280',
              marginBottom: '8px'
            }}>
              Loading Chart Data...
            </div>
            <div style={{
              width: '40px',
              height: '40px',
              border: '4px solid #e5e7eb',
              borderTop: '4px solid #3b82f6',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite',
              margin: '0 auto'
            }}></div>
          </div>
        ) : chartData && chartData.labels && chartData.labels.length > 0 ? (
          <div style={{ height: '100%', position: 'relative' }}>
            <Bar data={chartData} options={options} />
          </div>
        ) : (
          <div style={{ 
            textAlign: 'center', 
            padding: '60px', 
            color: '#6b7280',
            backgroundColor: '#ffffff',
            borderRadius: '8px',
            border: '2px dashed #d1d5db'
          }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>📊</div>
            <h3 style={{ 
              fontSize: '18px', 
              margin: '0 0 8px 0',
              color: '#374151'
            }}>
              No Data Available
            </h3>
            <p style={{ 
              fontSize: '14px', 
              margin: '0',
              lineHeight: '1.5'
            }}>
              Upload an Excel file to see the analysis of parts with issues.<br/>
              The chart will display the number of parts for each issue category.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default LastUploadedChart;