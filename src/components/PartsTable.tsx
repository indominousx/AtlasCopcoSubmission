import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';

/* 
DATABASE SCHEMA UPDATE REQUIRED:
Add the following columns to your 'issues' table in Supabase:
- is_corrected BOOLEAN DEFAULT FALSE
- corrected_at TIMESTAMP NULL

SQL:
ALTER TABLE issues 
ADD COLUMN is_corrected BOOLEAN DEFAULT FALSE,
ADD COLUMN corrected_at TIMESTAMP NULL;
*/

interface Issue {
  id: string;
  part_number: string;
  owner: string | null;
  issue_type: string;
  created_at: string;
  is_corrected?: boolean;
  corrected_at?: string;
}

interface PartsTableProps {
  refreshTrigger?: number;
  onRefreshCharts?: () => void;
}

const PartsTable: React.FC<PartsTableProps> = ({ refreshTrigger = 0, onRefreshCharts }) => {
  const [issues, setIssues] = useState<Issue[]>([]);
  const [correctedParts, setCorrectedParts] = useState<Issue[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [correctedCurrentPage, setCorrectedCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [correctedTotalCount, setCorrectedTotalCount] = useState(0);
  const [hoveredRowId, setHoveredRowId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'issues' | 'corrected'>('issues');
  const [isUpdating, setIsUpdating] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const itemsPerPage = 10;

  const fetchIssues = async (page: number, search: string = '') => {
    setIsLoading(true);
    
    try {
      let query = supabase
        .from('issues')
        .select('*', { count: 'exact' })
        .eq('is_corrected', false)
        .order('created_at', { ascending: false });

      // Add search filter if search term is provided
      if (search.trim()) {
        query = query.or(`part_number.ilike.%${search}%,owner.ilike.%${search}%`);
      }

      // Add pagination
      const from = (page - 1) * itemsPerPage;
      const to = from + itemsPerPage - 1;
      query = query.range(from, to);

      const { data, error, count } = await query;

      if (error) {
        console.error('Error fetching issues:', error);
        return;
      }

      setIssues(data || []);
      setTotalCount(count || 0);
    } catch (error) {
      console.error('Error fetching issues:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchCorrectedParts = async (page: number, search: string = '') => {
    setIsLoading(true);
    
    try {
      let query = supabase
        .from('issues')
        .select('*', { count: 'exact' })
        .eq('is_corrected', true)
        .order('corrected_at', { ascending: false });

      // Add search filter if search term is provided
      if (search.trim()) {
        query = query.or(`part_number.ilike.%${search}%,owner.ilike.%${search}%`);
      }

      // Add pagination
      const from = (page - 1) * itemsPerPage;
      const to = from + itemsPerPage - 1;
      query = query.range(from, to);

      const { data, error, count } = await query;

      if (error) {
        console.error('Error fetching corrected parts:', error);
        return;
      }

      setCorrectedParts(data || []);
      setCorrectedTotalCount(count || 0);
    } catch (error) {
      console.error('Error fetching corrected parts:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'issues') {
      fetchIssues(currentPage, searchTerm);
    } else {
      fetchCorrectedParts(correctedCurrentPage, searchTerm);
    }
  }, [currentPage, correctedCurrentPage, searchTerm, activeTab]);

  useEffect(() => {
    setCurrentPage(1);
    setCorrectedCurrentPage(1);
  }, [searchTerm]);

  // Refresh data when refreshTrigger changes (e.g., after file upload)
  useEffect(() => {
    if (refreshTrigger > 0) {
      if (activeTab === 'issues') {
        fetchIssues(currentPage, searchTerm);
      } else {
        fetchCorrectedParts(correctedCurrentPage, searchTerm);
      }
    }
  }, [refreshTrigger, currentPage, correctedCurrentPage, searchTerm, activeTab]);

  const getIssueTypeColor = (issueType: string) => {
    const colors: { [key: string]: string } = {
      'MISSING EXTENSION': '#dc2626',
      'INVALID FORMAT': '#2563eb',
      'INCORRECT NAMING': '#f59e0b',
      'SURFACE BODY': '#ea580c',
      'NON 10 DIGIT': '#7c3aed'
    };
    return colors[issueType] || '#6b7280';
  };

  const getIssueTypeBadge = (issueType: string) => {
    const color = getIssueTypeColor(issueType);
    return (
      <span
        style={{
          backgroundColor: color,
          color: 'white',
          padding: '4px 8px',
          borderRadius: '4px',
          fontSize: '0.75rem',
          fontWeight: '500',
          textTransform: 'uppercase',
          letterSpacing: '0.025em'
        }}
      >
        {issueType}
      </span>
    );
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const markAsCorrected = async (issueId: string) => {
    setIsUpdating(issueId);
    try {
      const { error } = await supabase
        .from('issues')
        .update({ 
          is_corrected: true, 
          corrected_at: new Date().toISOString() 
        })
        .eq('id', issueId);

      if (error) {
        console.error('Error marking as corrected:', error);
        return;
      }

      // Refresh both tables
      fetchIssues(currentPage, searchTerm);
      fetchCorrectedParts(correctedCurrentPage, searchTerm);
      
      // Trigger charts refresh
      if (onRefreshCharts) {
        onRefreshCharts();
      }
    } catch (error) {
      console.error('Error marking as corrected:', error);
    } finally {
      setIsUpdating(null);
    }
  };

  const markAsIncorrect = async (issueId: string) => {
    setIsUpdating(issueId);
    try {
      const { error } = await supabase
        .from('issues')
        .update({ 
          is_corrected: false, 
          corrected_at: null 
        })
        .eq('id', issueId);

      if (error) {
        console.error('Error marking as incorrect:', error);
        return;
      }

      // Refresh both tables
      fetchIssues(currentPage, searchTerm);
      fetchCorrectedParts(correctedCurrentPage, searchTerm);
      
      // Trigger charts refresh
      if (onRefreshCharts) {
        onRefreshCharts();
      }
    } catch (error) {
      console.error('Error marking as incorrect:', error);
    } finally {
      setIsUpdating(null);
    }
  };

  const totalPages = Math.ceil(totalCount / itemsPerPage);
  const correctedTotalPages = Math.ceil(correctedTotalCount / itemsPerPage);

  if (isLoading) {
    return (
      <div style={{ 
        textAlign: 'center', 
        padding: '40px',
        color: '#6b7280'
      }}>
        Loading parts...
      </div>
    );
  }

  return (
    <div style={{ 
      backgroundColor: 'white',
      borderRadius: '8px',
      boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
      overflow: 'hidden'
    }}>
      {/* Tabs */}
      <div style={{ 
        display: 'flex',
        borderBottom: '1px solid #e5e7eb'
      }}>
        <button
          onClick={() => setActiveTab('issues')}
          style={{
            padding: '16px 24px',
            border: 'none',
            backgroundColor: activeTab === 'issues' ? '#4A90E2' : 'transparent',
            color: activeTab === 'issues' ? 'white' : '#6b7280',
            fontSize: '0.875rem',
            fontWeight: '600',
            cursor: 'pointer',
            borderRadius: '0',
            transition: 'all 0.2s ease'
          }}
        >
          Part Number Issues ({totalCount})
        </button>
        <button
          onClick={() => setActiveTab('corrected')}
          style={{
            padding: '16px 24px',
            border: 'none',
            backgroundColor: activeTab === 'corrected' ? '#4A90E2' : 'transparent',
            color: activeTab === 'corrected' ? 'white' : '#6b7280',
            fontSize: '0.875rem',
            fontWeight: '600',
            cursor: 'pointer',
            borderRadius: '0',
            transition: 'all 0.2s ease'
          }}
        >
          Corrected Parts ({correctedTotalCount})
        </button>
      </div>

      {/* Header */}
      <div style={{ 
        padding: '20px',
        borderBottom: '1px solid #e5e7eb',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start'
      }}>
        <div>
          <h2 style={{ 
            margin: '0 0 8px 0',
            fontSize: '1.25rem',
            fontWeight: '600',
            color: '#111827'
          }}>
            {activeTab === 'issues' ? 'Part Number Issues' : 'Corrected Parts'}
          </h2>
          <p style={{ 
            margin: 0,
            color: '#6b7280',
            fontSize: '0.875rem'
          }}>
            {activeTab === 'issues' 
              ? `${totalCount} total issues found` 
              : `${correctedTotalCount} corrected parts`
            }
          </p>
        </div>
        
        {/* Search Bar */}
        <div style={{ position: 'relative', width: '280px' }}>
          <input
            type="text"
            placeholder="Search parts (use / to activate)"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              width: '100%',
              padding: '8px 16px 8px 40px',
              border: '1px solid #d1d5db',
              borderRadius: '6px',
              fontSize: '0.875rem',
              outline: 'none',
              transition: 'border-color 0.2s ease',
            }}
            onFocus={(e) => {
              e.target.style.borderColor = '#4A90E2';
              e.target.style.boxShadow = '0 0 0 3px rgba(74, 144, 226, 0.1)';
            }}
            onBlur={(e) => {
              e.target.style.borderColor = '#d1d5db';
              e.target.style.boxShadow = 'none';
            }}
          />
          <svg
            style={{
              position: 'absolute',
              left: '12px',
              top: '50%',
              transform: 'translateY(-50%)',
              width: '16px',
              height: '16px',
              color: '#9ca3af'
            }}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
      </div>

      {/* Table */}
      <div style={{ overflowX: 'auto' }}>
        <table style={{ 
          width: '100%',
          borderCollapse: 'collapse'
        }}>
          <thead>
            <tr style={{ backgroundColor: '#f9fafb' }}>
              <th style={{ 
                padding: '12px 16px',
                textAlign: 'left',
                fontSize: '0.75rem',
                fontWeight: '600',
                color: '#374151',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                borderBottom: '1px solid #e5e7eb'
              }}>
                Part Number
              </th>
              <th style={{ 
                padding: '12px 16px',
                textAlign: 'left',
                fontSize: '0.75rem',
                fontWeight: '600',
                color: '#374151',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                borderBottom: '1px solid #e5e7eb'
              }}>
                Issue Categories
              </th>
              <th style={{ 
                padding: '12px 16px',
                textAlign: 'left',
                fontSize: '0.75rem',
                fontWeight: '600',
                color: '#374151',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                borderBottom: '1px solid #e5e7eb'
              }}>
                Owner
              </th>
              <th style={{ 
                padding: '12px 16px',
                textAlign: 'left',
                fontSize: '0.75rem',
                fontWeight: '600',
                color: '#374151',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                borderBottom: '1px solid #e5e7eb'
              }}>
                {activeTab === 'issues' ? 'Date Added' : 'Date Corrected'}
              </th>
              <th style={{ 
                padding: '12px 16px',
                textAlign: 'left',
                fontSize: '0.75rem',
                fontWeight: '600',
                color: '#374151',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                borderBottom: '1px solid #e5e7eb'
              }}>
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {(activeTab === 'issues' ? issues : correctedParts).map((issue, index) => (
              <tr 
                key={issue.id}
                style={{ 
                  borderBottom: index < (activeTab === 'issues' ? issues : correctedParts).length - 1 ? '1px solid #e5e7eb' : 'none',
                  backgroundColor: hoveredRowId === issue.id ? '#f9fafb' : 'transparent',
                  cursor: 'pointer',
                  transition: 'background-color 0.2s ease'
                }}
                onMouseEnter={() => setHoveredRowId(issue.id)}
                onMouseLeave={() => setHoveredRowId(null)}
              >
                <td style={{ 
                  padding: '16px',
                  fontSize: '0.875rem',
                  color: '#111827',
                  fontFamily: 'monospace'
                }}>
                  {issue.part_number}
                </td>
                <td style={{ padding: '16px' }}>
                  {getIssueTypeBadge(issue.issue_type)}
                </td>
                <td style={{ 
                  padding: '16px',
                  fontSize: '0.875rem',
                  color: '#6b7280'
                }}>
                  {issue.owner || '-'}
                </td>
                <td style={{ 
                  padding: '16px',
                  fontSize: '0.875rem',
                  color: '#6b7280'
                }}>
                  {activeTab === 'issues' 
                    ? formatDate(issue.created_at)
                    : formatDate(issue.corrected_at || issue.created_at)
                  }
                </td>
                <td style={{ padding: '16px' }}>
                  {activeTab === 'issues' ? (
                    <button
                      style={{
                        backgroundColor: isUpdating === issue.id ? '#9ca3af' : '#10b981',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        padding: '6px 12px',
                        fontSize: '0.75rem',
                        fontWeight: '500',
                        cursor: isUpdating === issue.id ? 'not-allowed' : 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        opacity: isUpdating === issue.id ? 0.7 : 1
                      }}
                      onClick={() => markAsCorrected(issue.id)}
                      disabled={isUpdating === issue.id}
                    >
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
                      </svg>
                      {isUpdating === issue.id ? 'Updating...' : 'Mark Corrected'}
                    </button>
                  ) : (
                    <button
                      style={{
                        backgroundColor: isUpdating === issue.id ? '#9ca3af' : '#dc2626',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        padding: '6px 12px',
                        fontSize: '0.75rem',
                        fontWeight: '500',
                        cursor: isUpdating === issue.id ? 'not-allowed' : 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        opacity: isUpdating === issue.id ? 0.7 : 1
                      }}
                      onClick={() => markAsIncorrect(issue.id)}
                      disabled={isUpdating === issue.id}
                    >
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M6 6l12 12M6 18L18 6"/>
                      </svg>
                      {isUpdating === issue.id ? 'Updating...' : 'Mark Incorrect'}
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {(activeTab === 'issues' ? totalPages : correctedTotalPages) > 1 && (
        <div style={{ 
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '16px 20px',
          borderTop: '1px solid #e5e7eb',
          backgroundColor: '#f9fafb'
        }}>
          <div style={{ 
            display: 'flex',
            gap: '8px',
            alignItems: 'center'
          }}>
            <button
              onClick={() => activeTab === 'issues' 
                ? setCurrentPage(Math.max(1, currentPage - 1))
                : setCorrectedCurrentPage(Math.max(1, correctedCurrentPage - 1))
              }
              disabled={activeTab === 'issues' ? currentPage === 1 : correctedCurrentPage === 1}
              style={{
                padding: '6px 12px',
                border: '1px solid #d1d5db',
                borderRadius: '4px',
                backgroundColor: (activeTab === 'issues' ? currentPage === 1 : correctedCurrentPage === 1) ? '#f3f4f6' : 'white',
                color: (activeTab === 'issues' ? currentPage === 1 : correctedCurrentPage === 1) ? '#9ca3af' : '#374151',
                cursor: (activeTab === 'issues' ? currentPage === 1 : correctedCurrentPage === 1) ? 'not-allowed' : 'pointer',
                fontSize: '0.875rem'
              }}
            >
              Previous
            </button>
            <button
              onClick={() => activeTab === 'issues' 
                ? setCurrentPage(Math.min(totalPages, currentPage + 1))
                : setCorrectedCurrentPage(Math.min(correctedTotalPages, correctedCurrentPage + 1))
              }
              disabled={activeTab === 'issues' ? currentPage === totalPages : correctedCurrentPage === correctedTotalPages}
              style={{
                padding: '6px 12px',
                border: '1px solid #d1d5db',
                borderRadius: '4px',
                backgroundColor: (activeTab === 'issues' ? currentPage === totalPages : correctedCurrentPage === correctedTotalPages) ? '#f3f4f6' : 'white',
                color: (activeTab === 'issues' ? currentPage === totalPages : correctedCurrentPage === correctedTotalPages) ? '#9ca3af' : '#374151',
                cursor: (activeTab === 'issues' ? currentPage === totalPages : correctedCurrentPage === correctedTotalPages) ? 'not-allowed' : 'pointer',
                fontSize: '0.875rem'
              }}
            >
              Next
            </button>
          </div>
          
          <span style={{ 
            fontSize: '0.875rem',
            color: '#6b7280'
          }}>
            Page {activeTab === 'issues' ? currentPage : correctedCurrentPage} of {activeTab === 'issues' ? totalPages : correctedTotalPages}
          </span>
        </div>
      )}

      {(activeTab === 'issues' ? issues : correctedParts).length === 0 && (
        <div style={{ 
          textAlign: 'center',
          padding: '40px',
          color: '#6b7280'
        }}>
          {activeTab === 'issues' ? 'No issues found.' : 'No corrected parts found.'}
        </div>
      )}
    </div>
  );
};

export default PartsTable;