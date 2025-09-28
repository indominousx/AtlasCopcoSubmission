import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';

interface HistoryRecord {
  id: string;
  file_name: string;
  uploaded_at: string;
  total_issues: number;
}

const History: React.FC = () => {
  const [historyData, setHistoryData] = useState<HistoryRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string>('');

  const fetchHistoryData = async () => {
    setIsLoading(true);
    setError('');
    
    try {
      const { data, error } = await supabase
        .from('reports')
        .select('id, file_name, uploaded_at, total_issues')
        .order('uploaded_at', { ascending: false });

      if (error) {
        console.error('Error fetching history data:', error);
        setError('Failed to load upload history');
        return;
      }

      setHistoryData(data || []);
    } catch (err) {
      console.error('Error fetching history data:', err);
      setError('Failed to load upload history');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchHistoryData();
  }, []);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
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
            borderTop: '4px solid #1e40af',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite'
          }} />
          <p style={{
            color: '#6b7280',
            fontSize: '0.875rem',
            margin: 0
          }}>
            Loading upload history...
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
        minHeight: '400px',
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

  return (
    <div style={{
      maxWidth: '1200px',
      margin: '0 auto',
      padding: '20px'
    }}>
      {/* Header */}
      <div style={{
        marginBottom: '30px',
        textAlign: 'center'
      }}>
        <h2 style={{
          color: '#1f2937',
          fontSize: '24px',
          fontWeight: '600',
          margin: '0 0 8px 0'
        }}>
          Upload History
        </h2>
        <p style={{
          color: '#6b7280',
          fontSize: '14px',
          margin: 0
        }}>
          Complete history of all uploaded Excel files
        </p>
      </div>

      {/* Table Container */}
      <div style={{
        backgroundColor: '#ffffff',
        borderRadius: '12px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        border: '1px solid #e5e7eb',
        overflow: 'hidden'
      }}>
        {/* Table Header */}
        <div style={{
          padding: '20px',
          borderBottom: '1px solid #e5e7eb',
          backgroundColor: '#f9fafb'
        }}>
          <h3 style={{
            margin: '0 0 8px 0',
            fontSize: '18px',
            fontWeight: '600',
            color: '#1f2937'
          }}>
            File Upload Records
          </h3>
          <p style={{
            margin: 0,
            color: '#6b7280',
            fontSize: '14px'
          }}>
            {historyData.length} total uploads found
          </p>
        </div>

        {/* Table */}
        {historyData.length > 0 ? (
          <div style={{ overflowX: 'auto' }}>
            <table style={{
              width: '100%',
              borderCollapse: 'collapse'
            }}>
              <thead>
                <tr style={{ backgroundColor: '#f9fafb' }}>
                  <th style={{
                    padding: '16px 20px',
                    textAlign: 'left',
                    fontSize: '12px',
                    fontWeight: '600',
                    color: '#374151',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    borderBottom: '1px solid #e5e7eb',
                    width: '80px'
                  }}>
                    Index
                  </th>
                  <th style={{
                    padding: '16px 20px',
                    textAlign: 'left',
                    fontSize: '12px',
                    fontWeight: '600',
                    color: '#374151',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    borderBottom: '1px solid #e5e7eb'
                  }}>
                    File Name
                  </th>
                  <th style={{
                    padding: '16px 20px',
                    textAlign: 'left',
                    fontSize: '12px',
                    fontWeight: '600',
                    color: '#374151',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    borderBottom: '1px solid #e5e7eb'
                  }}>
                    Date Uploaded
                  </th>
                  <th style={{
                    padding: '16px 20px',
                    textAlign: 'left',
                    fontSize: '12px',
                    fontWeight: '600',
                    color: '#374151',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    borderBottom: '1px solid #e5e7eb'
                  }}>
                    Total Issues
                  </th>
                </tr>
              </thead>
              <tbody>
                {historyData.map((record, index) => (
                  <tr
                    key={record.id}
                    style={{
                      borderBottom: index < historyData.length - 1 ? '1px solid #e5e7eb' : 'none',
                      backgroundColor: index % 2 === 0 ? '#ffffff' : '#f9fafb'
                    }}
                  >
                    <td style={{
                      padding: '16px 20px',
                      fontSize: '14px',
                      color: '#1f2937',
                      fontWeight: '600'
                    }}>
                      {index + 1}
                    </td>
                    <td style={{
                      padding: '16px 20px',
                      fontSize: '14px',
                      color: '#1f2937',
                      fontFamily: 'monospace',
                      wordBreak: 'break-all'
                    }}>
                      {record.file_name}
                    </td>
                    <td style={{
                      padding: '16px 20px',
                      fontSize: '14px',
                      color: '#6b7280'
                    }}>
                      {formatDate(record.uploaded_at)}
                    </td>
                    <td style={{
                      padding: '16px 20px',
                      fontSize: '14px',
                      color: '#6b7280'
                    }}>
                      {record.total_issues?.toLocaleString() || 0}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div style={{
            textAlign: 'center',
            padding: '60px 20px',
            color: '#6b7280'
          }}>
            <div style={{
              fontSize: '3rem',
              marginBottom: '16px',
              opacity: 0.5
            }}>📄</div>
            <h3 style={{
              color: '#374151',
              fontSize: '18px',
              fontWeight: '600',
              margin: '0 0 8px 0'
            }}>
              No Upload History
            </h3>
            <p style={{
              fontSize: '14px',
              margin: 0,
              lineHeight: '1.5'
            }}>
              Upload your first Excel file to see the history here.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default History;