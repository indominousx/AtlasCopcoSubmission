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

interface CurrentIssuesChartProps {
  chartData: any;
  isLoading: boolean;
}

const CurrentIssuesChart: React.FC<CurrentIssuesChartProps> = ({ chartData, isLoading }) => {
  const options = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: 'Current Report - Issues per Category',
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        title: {
          display: true,
          text: 'Number of Issues'
        }
      },
      x: {
        title: {
          display: true,
          text: 'Issue Type (Sheet Name)'
        }
      }
    }
  };

  return (
    <div style={{ 
      maxWidth: '800px', 
      margin: '0 auto 40px auto', 
      padding: '20px', 
      backgroundColor: '#fff', 
      borderRadius: '8px',
      boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
    }}>
      <h2 style={{ textAlign: 'center', marginBottom: '20px', color: '#333' }}>
        Current Report Analysis
      </h2>
      {isLoading ? (
        <p style={{ textAlign: 'center', padding: '40px' }}>Loading Chart Data...</p>
      ) : chartData && chartData.labels && chartData.labels.length > 0 ? (
        <Bar data={chartData} options={options} />
      ) : (
        <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
          <p>No current report data available.</p>
          <p style={{ fontSize: '0.9em', fontStyle: 'italic' }}>
            Upload an Excel file to see analysis for the current report.
          </p>
        </div>
      )}
    </div>
  );
};

export default CurrentIssuesChart;