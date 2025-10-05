import React, { useEffect, useState } from 'react';
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

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

interface AdminProps {
  refreshTrigger?: number;
}

interface OwnerCategoryData {
  [owner: string]: {
    [category: string]: {
      corrected: number;
      notCorrected: number;
    };
  };
}

const OWNER_TYPES = ['ACN', 'ACS', 'ACE', 'ACI', 'ACA', 'ICA'];

const Admin: React.FC<AdminProps> = ({ refreshTrigger = 0 }) => {
  const [ownerChartsData, setOwnerChartsData] = useState<OwnerCategoryData>({});
  const [issueCategories, setIssueCategories] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string>('');

  const fetchOwnerCorrectionData = async () => {
    setIsLoading(true);
    setError('');
    try {
      // First, get all unique issue types
      const { data: issueTypesData, error: issueTypesError } = await supabase
        .from('issues')
        .select('issue_type')
        .order('issue_type');

      if (issueTypesError) {
        console.error('Issue types error:', issueTypesError);
        setError(`Failed to load issue categories: ${issueTypesError.message}`);
        return;
      }

      // Get unique issue types and limit to 5
      const issueTypeSet = new Set(issueTypesData?.map(item => item.issue_type) || []);
      const uniqueIssueTypes = Array.from(issueTypeSet);
      const limitedIssueTypes = uniqueIssueTypes.slice(0, 5);
      console.log('Issue types found:', limitedIssueTypes);
      setIssueCategories(limitedIssueTypes);

      // Query all issues with owner, issue type, and correction status
      const { data, error } = await supabase
        .from('issues')
        .select('owner, issue_type, is_corrected')
        .in('owner', OWNER_TYPES);

      if (error) {
        console.error('Main query error:', error);
        setError(`Failed to load owner correction data: ${error.message}`);
        return;
      }

      console.log(`Found ${data?.length || 0} records from database`);
      console.log('Issue categories:', limitedIssueTypes);

      // Initialize data structure for each owner and category
      const ownerData: OwnerCategoryData = {};
      OWNER_TYPES.forEach(owner => {
        ownerData[owner] = {};
        limitedIssueTypes.forEach(category => {
          ownerData[owner][category] = { corrected: 0, notCorrected: 0 };
        });
      });

      // Count corrected and not corrected issues for each owner and category
      if (data) {
        data.forEach((item: any) => {
          const { owner, issue_type, is_corrected } = item;
          if (OWNER_TYPES.includes(owner) && limitedIssueTypes.includes(issue_type)) {
            if (is_corrected) {
              ownerData[owner][issue_type].corrected++;
            } else {
              ownerData[owner][issue_type].notCorrected++;
            }
          }
        });
      }

      // Log summary of processed data
      const summary = Object.keys(ownerData).map(owner => {
        const ownerTotal = Object.keys(ownerData[owner]).reduce((total, category) => {
          return total + ownerData[owner][category].corrected + ownerData[owner][category].notCorrected;
        }, 0);
        return `${owner}: ${ownerTotal} total issues`;
      }).join(', ');
      
      console.log('Data summary:', summary);
      setOwnerChartsData(ownerData);
    } catch (err) {
      console.error('Error in fetchOwnerCorrectionData:', err);
      setError(`Failed to load owner correction data: ${err}`);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchOwnerCorrectionData();
  }, []);

  useEffect(() => {
    if (refreshTrigger > 0) {
      fetchOwnerCorrectionData();
    }
  }, [refreshTrigger]);

  // Function to generate chart data for a specific owner
  const generateChartDataForOwner = (owner: string) => {
    const ownerData = ownerChartsData[owner];
    if (!ownerData) {
      console.warn(`No data found for owner: ${owner}`);
      return null;
    }

    console.log(`Generating chart data for ${owner}:`, ownerData);

    return {
      labels: issueCategories,
      datasets: [
        {
          label: 'Corrected',
          data: issueCategories.map(category => ownerData[category]?.corrected || 0),
          backgroundColor: 'rgba(34, 197, 94, 0.8)',
          borderColor: 'rgba(34, 197, 94, 1)',
          borderWidth: 1,
        },
        {
          label: 'Not Corrected', 
          data: issueCategories.map(category => ownerData[category]?.notCorrected || 0),
          backgroundColor: 'rgba(239, 68, 68, 0.8)',
          borderColor: 'rgba(239, 68, 68, 1)',
          borderWidth: 1,
        }
      ]
    };
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      tooltip: {
        callbacks: {
          label: function(context: any) {
            return `${context.dataset.label}: ${context.parsed.y} issues`;
          }
        }
      }
    },
    scales: {
      x: {
        title: {
          display: true,
          text: 'Issue Categories',
        },
        ticks: {
          color: '#374151',
          font: {
            size: 10,
          },
          maxRotation: 45,
        },
      },
      y: {
        beginAtZero: true,
        title: {
          display: true,
          text: 'Number of Issues',
        },
        ticks: {
          color: '#374151',
          font: {
            size: 10,
          },
          stepSize: 1,
        },
      },
    },
  };

  if (isLoading) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '400px',
        backgroundColor: '#ffffff',
        borderRadius: '12px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        border: '1px solid #e5e7eb',
        margin: '20px',
        padding: '40px'
      }}>
        <div style={{ textAlign: 'center', color: '#6b7280', fontSize: '18px' }}>Loading charts...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '400px',
        backgroundColor: '#ffffff',
        borderRadius: '12px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        border: '1px solid #e5e7eb',
        margin: '20px',
        padding: '40px'
      }}>
        <div style={{ textAlign: 'center', color: '#dc2626', fontSize: '18px' }}>{error}</div>
      </div>
    );
  }

  return (
    <div style={{
      padding: '20px',
      backgroundColor: '#f9fafb',
      minHeight: '100vh'
    }}>
      <h2 style={{
        color: '#1f2937',
        fontSize: '32px',
        fontWeight: '700',
        margin: '0 0 32px 0',
        textAlign: 'center'
      }}>
        Admin Panel - Owner Issue Analysis
      </h2>
      
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(600px, 1fr))',
        gap: '24px',
        maxWidth: '1400px',
        margin: '0 auto'
      }}>
        {OWNER_TYPES.map(owner => {
          const chartData = generateChartDataForOwner(owner);
          return (
            <div key={owner} style={{
              backgroundColor: '#ffffff',
              borderRadius: '12px',
              boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
              border: '1px solid #e5e7eb',
              padding: '24px'
            }}>
              <h3 style={{
                color: '#1f2937',
                fontSize: '20px',
                fontWeight: '600',
                margin: '0 0 16px 0',
                textAlign: 'center'
              }}>
                {owner} - Issues by Category
              </h3>
              <div style={{ height: '350px' }}>
                {chartData && issueCategories.length > 0 ? (
                  <Bar data={chartData} options={{
                    ...chartOptions,
                    plugins: {
                      ...chartOptions.plugins,
                      title: {
                        display: false
                      }
                    }
                  }} />
                ) : (
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    height: '100%',
                    color: '#6b7280',
                    fontSize: '16px',
                    textAlign: 'center'
                  }}>
                    {issueCategories.length === 0 ? (
                      <div>
                        <div style={{ fontSize: '48px', marginBottom: '16px', opacity: 0.5 }}>📊</div>
                        <div>No issue categories found</div>
                        <div style={{ fontSize: '14px', marginTop: '8px', opacity: 0.7 }}>
                          Upload data to see charts
                        </div>
                      </div>
                    ) : (
                      <div>
                        <div style={{ fontSize: '48px', marginBottom: '16px', opacity: 0.5 }}>📋</div>
                        <div>No data available for {owner}</div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default Admin;