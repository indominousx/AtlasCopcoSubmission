import React from 'react';
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

interface TotalIssuesSummaryProps {
  totalSummary: { [key: string]: number };
}

const TotalIssuesSummary: React.FC<TotalIssuesSummaryProps> = ({ totalSummary }) => {
  if (Object.keys(totalSummary).length === 0) {
    return null;
  }

  const grandTotal = Object.values(totalSummary).reduce((sum, count) => sum + count, 0);

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
        Issue Distribution
      </h3>
      <p style={{ 
        margin: '0 0 20px 0', 
        color: '#6b7280',
        fontSize: '14px'
      }}>
        Breakdown of new part number issues by category.
      </p>
      <div style={{ flex: 1, minHeight: 0 }}>
        <Bar 
          data={{
            labels: Object.keys(totalSummary),
            datasets: [{
              label: 'Total Unique Issues (All Time)',
              data: Object.values(totalSummary),
            backgroundColor: [
              'rgba(255, 99, 132, 0.8)',
              'rgba(54, 162, 235, 0.8)',
              'rgba(255, 205, 86, 0.8)',
              'rgba(75, 192, 192, 0.8)',
              'rgba(153, 102, 255, 0.8)',
              'rgba(255, 159, 64, 0.8)',
              'rgba(199, 199, 199, 0.8)',
              'rgba(83, 102, 255, 0.8)'
            ],
            borderColor: [
              'rgba(255, 99, 132, 1)',
              'rgba(54, 162, 235, 1)',
              'rgba(255, 205, 86, 1)',
              'rgba(75, 192, 192, 1)',
              'rgba(153, 102, 255, 1)',
              'rgba(255, 159, 64, 1)',
              'rgba(199, 199, 199, 1)',
              'rgba(83, 102, 255, 1)'
            ],
            borderWidth: 2,
          }],
          }}
          options={{
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: {
                position: 'top' as const,
              },
              title: {
                display: false,
              },
              tooltip: {
                callbacks: {
                  label: function(context) {
                    return `${context.dataset.label}: ${context.parsed.y.toLocaleString()} issues`;
                  }
                }
              }
            },
            scales: {
              y: {
                beginAtZero: true,
                title: {
                  display: true,
                  text: 'Number of Unique Issues'
                },
                ticks: {
                  stepSize: 1,
                  precision: 0,
                  callback: function(value) {
                    return typeof value === 'number' && Number.isInteger(value) ? value.toLocaleString() : '';
                  }
                }
              },
              x: {
                title: {
                  display: true,
                  text: 'Issue Categories'
                }
              }
            }
          }}
        />
      </div>
    </div>
  );
};

export default TotalIssuesSummary;