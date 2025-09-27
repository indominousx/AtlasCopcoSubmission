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
      maxWidth: '800px', 
      margin: '0 auto 40px auto', 
      padding: '20px', 
      backgroundColor: '#f8f9fa', 
      borderRadius: '8px',
      boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
    }}>
      <h2 style={{ textAlign: 'center', marginBottom: '20px', color: '#333' }}>
        Total Issues by Category (All Time)
      </h2>
      <div style={{ textAlign: 'center', marginBottom: '15px' }}>
        <span style={{ 
          fontSize: '1.2em', 
          fontWeight: 'bold', 
          color: '#2c3e50' 
        }}>
          Grand Total: {grandTotal.toLocaleString()} unique issues
        </span>
      </div>
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
                callback: function(value) {
                  return typeof value === 'number' ? value.toLocaleString() : value;
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
  );
};

export default TotalIssuesSummary;