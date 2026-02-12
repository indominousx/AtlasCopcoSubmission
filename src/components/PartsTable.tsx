import React, { useState, useEffect, useCallback, useRef } from 'react';
import { db } from '../mysqlClient';

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
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState<string>('');
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [showCalendar, setShowCalendar] = useState<boolean>(false);
  const [categories, setCategories] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedIssueIds, setSelectedIssueIds] = useState<Set<string>>(new Set());
  const [isBulkUpdating, setIsBulkUpdating] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const calendarRef = useRef<HTMLDivElement>(null);
  const itemsPerPage = 10;
  const [jumpPage, setJumpPage] = useState<string>('');

  const fetchIssues = useCallback(async (page: number, search: string = '') => {
    setIsLoading(true);
    
    try {
      // First, get all issues without pagination to group them
      let query = db
        .from('issues')
        .select('*')
        .eq('is_corrected', false)
        .order('created_at', { ascending: false });

      // Add search filter if search term is provided
      if (search.trim()) {
        const searchInput = search.trim();
        
        // Check if multiple part numbers are provided (separated by /)
        if (searchInput.includes('/')) {
          const partNumbers = searchInput.split('/').map(part => part.trim()).filter(part => part.length > 0);
          
          if (partNumbers.length > 0) {
            // Create OR conditions for each part number
            const partNumberConditions = partNumbers.map(partNum => `part_number.ilike.%${partNum}%`).join(',');
            const ownerConditions = partNumbers.map(partNum => `owner.ilike.%${partNum}%`).join(',');
            query = query.or(`${partNumberConditions},${ownerConditions}`);
          }
        } else {
          // Single search term - search in both part_number and owner
          query = query.or(`part_number.ilike.%${searchInput}%,owner.ilike.%${searchInput}%`);
        }
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching issues:', error);
        return;
      }

      if (data) {
        // Group issues by part_number and owner combination
        const groupedIssues = new Map<string, Issue>();
        
        data.forEach((issue: Issue) => {
          const key = `${issue.part_number}|${issue.owner || 'null'}`;
          
          if (groupedIssues.has(key)) {
            // Combine issue types for the same part
            const existingIssue = groupedIssues.get(key)!;
            const combinedIssueTypes = existingIssue.issue_type.split(', ');
            if (!combinedIssueTypes.includes(issue.issue_type)) {
              combinedIssueTypes.push(issue.issue_type);
              existingIssue.issue_type = combinedIssueTypes.join(', ');
            }
            // Keep the earliest created_at date
            if (new Date(issue.created_at) < new Date(existingIssue.created_at)) {
              existingIssue.created_at = issue.created_at;
            }
          } else {
            // Add new unique part
            groupedIssues.set(key, { ...issue });
          }
        });

        // Convert back to array
        const uniqueIssuesAll = Array.from(groupedIssues.values());

        // Compute available categories from the raw grouped results
        const categorySet = new Set<string>();
        uniqueIssuesAll.forEach((issue: Issue) => {
          issue.issue_type.split(', ').forEach(type => {
            if (type && type.trim()) categorySet.add(type.trim());
          });
        });
        setCategories(Array.from(categorySet).sort());

        // Apply category filter if set
        let uniqueIssues = uniqueIssuesAll;
        if (selectedCategory) {
          uniqueIssues = uniqueIssuesAll.filter(issue =>
            issue.issue_type.split(', ').map(s => s.trim()).includes(selectedCategory)
          );
        }

        const totalUniqueCount = uniqueIssues.length;

        // Apply pagination to grouped results
        const from = (page - 1) * itemsPerPage;
        const to = from + itemsPerPage;
        const paginatedIssues = uniqueIssues.slice(from, to);

        setIssues(paginatedIssues);
        setTotalCount(totalUniqueCount);
      } else {
        setIssues([]);
        setTotalCount(0);
      }
    } catch (error) {
      console.error('Error fetching issues:', error);
    } finally {
      setIsLoading(false);
    }
  }, [selectedCategory]);

  const fetchCorrectedParts = useCallback(async (page: number, search: string = '') => {
    setIsLoading(true);
    
    try {
      // First, get all corrected issues without pagination to group them
      let query = db
        .from('issues')
        .select('*')
        .eq('is_corrected', true)
        .order('corrected_at', { ascending: false });

      // Add search filter if search term is provided
      if (search.trim()) {
        const searchInput = search.trim();
        
        // Check if multiple part numbers are provided (separated by /)
        if (searchInput.includes('/')) {
          const partNumbers = searchInput.split('/').map(part => part.trim()).filter(part => part.length > 0);
          
          if (partNumbers.length > 0) {
            // Create OR conditions for each part number
            const partNumberConditions = partNumbers.map(partNum => `part_number.ilike.%${partNum}%`).join(',');
            const ownerConditions = partNumbers.map(partNum => `owner.ilike.%${partNum}%`).join(',');
            query = query.or(`${partNumberConditions},${ownerConditions}`);
          }
        } else {
          // Single search term - search in both part_number and owner
          query = query.or(`part_number.ilike.%${searchInput}%,owner.ilike.%${searchInput}%`);
        }
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching corrected parts:', error);
        return;
      }

      if (data) {
        // Group corrected issues by part_number and owner combination
        const groupedCorrectedParts = new Map<string, Issue>();
        
        data.forEach((issue: Issue) => {
          const key = `${issue.part_number}|${issue.owner || 'null'}`;
          
          if (groupedCorrectedParts.has(key)) {
            // Combine issue types for the same part
            const existingIssue = groupedCorrectedParts.get(key)!;
            const combinedIssueTypes = existingIssue.issue_type.split(', ');
            if (!combinedIssueTypes.includes(issue.issue_type)) {
              combinedIssueTypes.push(issue.issue_type);
              existingIssue.issue_type = combinedIssueTypes.join(', ');
            }
            // Keep the latest corrected_at date
            if (issue.corrected_at && existingIssue.corrected_at) {
              if (new Date(issue.corrected_at) > new Date(existingIssue.corrected_at)) {
                existingIssue.corrected_at = issue.corrected_at;
              }
            }
          } else {
            // Add new unique corrected part
            groupedCorrectedParts.set(key, { ...issue });
          }
        });

        // Convert back to array
        const uniqueCorrectedAll = Array.from(groupedCorrectedParts.values());

        // Compute available categories from the raw grouped corrected results
        const categorySet = new Set<string>();
        uniqueCorrectedAll.forEach((issue: Issue) => {
          issue.issue_type.split(', ').forEach(type => {
            if (type && type.trim()) categorySet.add(type.trim());
          });
        });
        // Merge with existing categories (so tabs share the same set)
        setCategories(prev => Array.from(new Set([...prev, ...Array.from(categorySet)])).sort());

        // Apply category filter if set
        let uniqueCorrectedParts = uniqueCorrectedAll;
        if (selectedCategory) {
          uniqueCorrectedParts = uniqueCorrectedAll.filter(issue =>
            issue.issue_type.split(', ').map(s => s.trim()).includes(selectedCategory)
          );
        }

        const totalUniqueCorrectedCount = uniqueCorrectedParts.length;

        // Apply pagination to grouped results
        const from = (page - 1) * itemsPerPage;
        const to = from + itemsPerPage;
        const paginatedCorrectedParts = uniqueCorrectedParts.slice(from, to);

        setCorrectedParts(paginatedCorrectedParts);
        setCorrectedTotalCount(totalUniqueCorrectedCount);
      } else {
        setCorrectedParts([]);
        setCorrectedTotalCount(0);
      }
    } catch (error) {
      console.error('Error fetching corrected parts:', error);
    } finally {
      setIsLoading(false);
    }
  }, [selectedCategory]);

  // Debounce search term
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Close calendar when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (calendarRef.current && !calendarRef.current.contains(event.target as Node)) {
        setShowCalendar(false);
      }
    };

    if (showCalendar) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showCalendar]);

  useEffect(() => {
    setCurrentPage(1);
    setCorrectedCurrentPage(1);
  }, [debouncedSearchTerm]);

  // Reset pagination when category filter changes
  useEffect(() => {
    setCurrentPage(1);
    setCorrectedCurrentPage(1);
  }, [selectedCategory]);

  // Clear selections when changing tabs or pages
  useEffect(() => {
    setSelectedIssueIds(new Set());
  }, [activeTab, currentPage, correctedCurrentPage]);

  useEffect(() => {
    if (activeTab === 'issues') {
      fetchIssues(currentPage, debouncedSearchTerm);
    } else {
      fetchCorrectedParts(correctedCurrentPage, debouncedSearchTerm);
    }
  }, [currentPage, correctedCurrentPage, debouncedSearchTerm, activeTab, selectedCategory]);

  // Refresh data when refreshTrigger changes (e.g., after file upload)
  useEffect(() => {
    if (refreshTrigger > 0) {
      if (activeTab === 'issues') {
        fetchIssues(currentPage, debouncedSearchTerm);
      } else {
        fetchCorrectedParts(correctedCurrentPage, debouncedSearchTerm);
      }
    }
  }, [refreshTrigger, currentPage, correctedCurrentPage, debouncedSearchTerm, activeTab]);

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
    // Handle multiple issue types separated by commas
    const issueTypes = issueType.split(', ');
    
    if (issueTypes.length === 1) {
      // Single issue type
      const color = getIssueTypeColor(issueTypes[0]);
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
          {issueTypes[0]}
        </span>
      );
    } else {
      // Multiple issue types - show as separate badges
      return (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
          {issueTypes.map((type, index) => {
            const color = getIssueTypeColor(type);
            return (
              <span
                key={index}
                style={{
                  backgroundColor: color,
                  color: 'white',
                  padding: '2px 6px',
                  borderRadius: '3px',
                  fontSize: '0.65rem',
                  fontWeight: '500',
                  textTransform: 'uppercase',
                  letterSpacing: '0.025em'
                }}
              >
                {type}
              </span>
            );
          })}
        </div>
      );
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const markAsCorrected = async (partNumber: string, owner: string | null) => {
    setIsUpdating(`${partNumber}|${owner ?? 'null'}`);
    try {
      // Update all records with the same part_number and owner
      const { error } = await db
        .from('issues')
        .update({ 
          is_corrected: true, 
          corrected_at: new Date().toISOString() 
        })
        .eq('part_number', partNumber)
        .eq('owner', owner);

      if (error) {
        console.error('Error marking as corrected:', error);
        return;
      }

      // Clear selection and refresh both tables
      setSelectedIssueIds(new Set());
      fetchIssues(currentPage, debouncedSearchTerm);
      fetchCorrectedParts(correctedCurrentPage, debouncedSearchTerm);
      
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

  const markAsIncorrect = async (partNumber: string, owner: string | null) => {
    setIsUpdating(`${partNumber}|${owner ?? 'null'}`);
    try {
      // Update all records with the same part_number and owner
      const { error } = await db
        .from('issues')
        .update({ 
          is_corrected: false, 
          corrected_at: null 
        })
        .eq('part_number', partNumber)
        .eq('owner', owner);

      if (error) {
        console.error('Error marking as incorrect:', error);
        return;
      }

      // Clear selection and refresh both tables
      setSelectedIssueIds(new Set());
      fetchIssues(currentPage, debouncedSearchTerm);
      fetchCorrectedParts(correctedCurrentPage, debouncedSearchTerm);
      
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

  const handleSelectAll = (checked: boolean) => {
    const currentList = activeTab === 'issues' ? issues : correctedParts;
    if (checked) {
      setSelectedIssueIds(new Set(currentList.map(issue => issue.id)));
    } else {
      setSelectedIssueIds(new Set());
    }
  };

  const handleSelectIssue = (issueId: string, checked: boolean) => {
    const newSelection = new Set(selectedIssueIds);
    if (checked) {
      newSelection.add(issueId);
    } else {
      newSelection.delete(issueId);
    }
    setSelectedIssueIds(newSelection);
  };

  const bulkMarkAsCorrected = async () => {
    if (selectedIssueIds.size === 0) return;
    
    setIsBulkUpdating(true);
    try {
      const currentList = activeTab === 'issues' ? issues : correctedParts;
      const selectedIssues = currentList.filter(issue => selectedIssueIds.has(issue.id));
      
      // Get unique part_number and owner combinations
      const uniqueParts = new Map<string, { part_number: string; owner: string | null }>();
      selectedIssues.forEach(issue => {
        const key = `${issue.part_number}|${issue.owner || 'null'}`;
        if (!uniqueParts.has(key)) {
          uniqueParts.set(key, { part_number: issue.part_number, owner: issue.owner });
        }
      });

      // Update each unique part
      for (const part of Array.from(uniqueParts.values())) {
        const { error } = await db
          .from('issues')
          .update({ 
            is_corrected: true, 
            corrected_at: new Date().toISOString() 
          })
          .eq('part_number', part.part_number)
          .eq('owner', part.owner);

        if (error) {
          console.error('Error in bulk update:', error);
        }
      }

      // Clear selection and refresh
      setSelectedIssueIds(new Set());
      fetchIssues(currentPage, debouncedSearchTerm);
      fetchCorrectedParts(correctedCurrentPage, debouncedSearchTerm);
      
      if (onRefreshCharts) {
        onRefreshCharts();
      }
    } catch (error) {
      console.error('Error in bulk mark as corrected:', error);
    } finally {
      setIsBulkUpdating(false);
    }
  };

  const bulkMarkAsIncorrect = async () => {
    if (selectedIssueIds.size === 0) return;
    
    setIsBulkUpdating(true);
    try {
      const currentList = activeTab === 'issues' ? issues : correctedParts;
      const selectedIssues = currentList.filter(issue => selectedIssueIds.has(issue.id));
      
      // Get unique part_number and owner combinations
      const uniqueParts = new Map<string, { part_number: string; owner: string | null }>();
      selectedIssues.forEach(issue => {
        const key = `${issue.part_number}|${issue.owner || 'null'}`;
        if (!uniqueParts.has(key)) {
          uniqueParts.set(key, { part_number: issue.part_number, owner: issue.owner });
        }
      });

      // Update each unique part
      for (const part of Array.from(uniqueParts.values())) {
        const { error } = await db
          .from('issues')
          .update({ 
            is_corrected: false, 
            corrected_at: null 
          })
          .eq('part_number', part.part_number)
          .eq('owner', part.owner);

        if (error) {
          console.error('Error in bulk update:', error);
        }
      }

      // Clear selection and refresh
      setSelectedIssueIds(new Set());
      fetchIssues(currentPage, debouncedSearchTerm);
      fetchCorrectedParts(correctedCurrentPage, debouncedSearchTerm);
      
      if (onRefreshCharts) {
        onRefreshCharts();
      }
    } catch (error) {
      console.error('Error in bulk mark as incorrect:', error);
    } finally {
      setIsBulkUpdating(false);
    }
  };

  const totalPages = Math.ceil(totalCount / itemsPerPage);
  const correctedTotalPages = Math.ceil(correctedTotalCount / itemsPerPage);

  const handleJumpToPage = () => {
    const raw = jumpPage.trim();
    if (!raw) return;
    const target = Math.max(1, Math.floor(Number(raw)));
    if (activeTab === 'issues') {
      const clamped = Math.min(totalPages || 1, target);
      setCurrentPage(clamped);
    } else {
      const clamped = Math.min(correctedTotalPages || 1, target);
      setCorrectedCurrentPage(clamped);
    }
    setJumpPage('');
  };

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
        borderBottom: '1px solid #e5e7eb'
      }}>
        {/* Top row with title and search */}
        <div style={{ 
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          gap: '20px',
          flexWrap: 'wrap',
          marginBottom: '20px'
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
              {selectedIssueIds.size > 0 && (
                <span style={{ fontWeight: '600', marginLeft: '8px', color: '#4A90E2' }}>
                  ({selectedIssueIds.size} selected)
                </span>
              )}
              {debouncedSearchTerm && (
                <span style={{ fontStyle: 'italic', marginLeft: '8px' }}>
                  {debouncedSearchTerm.includes('/') 
                    ? `(filtered by ${debouncedSearchTerm.split('/').length} part numbers)`
                    : `(filtered by "${debouncedSearchTerm}")`
                  }
                </span>
              )}
              {selectedDate && (
                <span style={{ fontStyle: 'italic', marginLeft: '8px' }}>
                  (filtered by date: {new Date(selectedDate).toLocaleDateString()})
                </span>
              )}
            </p>
          </div>
        
          {/* Small Search Bar - Top Right */}
          <div style={{ position: 'relative', width: '280px' }}>
            <input
              ref={searchInputRef}
              type="text"
              placeholder="Search parts (use / for multiple)"
              value={searchTerm}
              onChange={(e) => {
                const newValue = e.target.value;
                const cursorPosition = e.target.selectionStart;
                setSearchTerm(newValue);
                
                // Restore cursor position after state update
                setTimeout(() => {
                  if (searchInputRef.current) {
                    searchInputRef.current.setSelectionRange(cursorPosition, cursorPosition);
                  }
                }, 0);
              }}
              style={{
                width: '100%',
                padding: '8px 12px 8px 32px',
                paddingRight: searchTerm ? '32px' : '12px',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                fontSize: '0.875rem',
                outline: 'none',
                transition: 'border-color 0.2s ease',
                boxSizing: 'border-box'
              }}
              onFocus={(e) => {
                e.target.style.borderColor = '#4A90E2';
                e.target.style.boxShadow = '0 0 0 2px rgba(74, 144, 226, 0.1)';
              }}
              onBlur={(e) => {
                e.target.style.borderColor = '#d1d5db';
                e.target.style.boxShadow = 'none';
              }}
            />
            <svg
              style={{
                position: 'absolute',
                left: '10px',
                top: '50%',
                transform: 'translateY(-50%)',
                width: '14px',
                height: '14px',
                color: '#9ca3af'
              }}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                style={{
                  position: 'absolute',
                  right: '8px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: '#9ca3af',
                  padding: '2px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
                title="Clear search"
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
                </svg>
              </button>
            )}
          </div>
        </div>

        {/* Bulk Action Buttons */}
        {selectedIssueIds.size > 0 && (
          <div style={{ 
            display: 'flex',
            gap: '12px',
            marginTop: '16px',
            paddingTop: '16px',
            borderTop: '1px solid #e5e7eb'
          }}>
            {activeTab === 'issues' ? (
              <button
                onClick={bulkMarkAsCorrected}
                disabled={isBulkUpdating}
                style={{
                  backgroundColor: isBulkUpdating ? '#9ca3af' : '#10b981',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  padding: '10px 20px',
                  fontSize: '0.875rem',
                  fontWeight: '600',
                  cursor: isBulkUpdating ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  transition: 'all 0.2s ease',
                  opacity: isBulkUpdating ? 0.7 : 1
                }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
                </svg>
                {isBulkUpdating ? 'Updating...' : `Mark ${selectedIssueIds.size} as Corrected`}
              </button>
            ) : (
              <button
                onClick={bulkMarkAsIncorrect}
                disabled={isBulkUpdating}
                style={{
                  backgroundColor: isBulkUpdating ? '#9ca3af' : '#dc2626',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  padding: '10px 20px',
                  fontSize: '0.875rem',
                  fontWeight: '600',
                  cursor: isBulkUpdating ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  transition: 'all 0.2s ease',
                  opacity: isBulkUpdating ? 0.7 : 1
                }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/>
                </svg>
                {isBulkUpdating ? 'Updating...' : `Mark ${selectedIssueIds.size} as Incorrect`}
              </button>
            )}
            <button
              onClick={() => setSelectedIssueIds(new Set())}
              disabled={isBulkUpdating}
              style={{
                backgroundColor: 'white',
                color: '#374151',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                padding: '10px 20px',
                fontSize: '0.875rem',
                fontWeight: '600',
                cursor: isBulkUpdating ? 'not-allowed' : 'pointer',
                transition: 'all 0.2s ease'
              }}
            >
              Clear Selection
            </button>
          </div>
        )}
        

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
                textAlign: 'center',
                fontSize: '0.75rem',
                fontWeight: '600',
                color: '#374151',
                width: '50px',
                borderBottom: '1px solid #e5e7eb'
              }}>
                <input
                  type="checkbox"
                  checked={selectedIssueIds.size > 0 && selectedIssueIds.size === (activeTab === 'issues' ? issues : correctedParts).length}
                  onChange={(e) => handleSelectAll(e.target.checked)}
                  style={{
                    width: '16px',
                    height: '16px',
                    cursor: 'pointer',
                    accentColor: '#4A90E2'
                  }}
                  title="Select all on this page"
                />
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
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
                  <span>Issue Categories</span>
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    style={{
                      padding: '6px 8px',
                      border: '1px solid #d1d5db',
                      borderRadius: '6px',
                      fontSize: '0.75rem',
                      color: '#374151',
                      background: 'white',
                      cursor: 'pointer'
                    }}
                    title="Filter by issue category"
                  >
                    <option value="">All Categories</option>
                    {categories.map((cat) => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
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
                borderBottom: '1px solid #e5e7eb',
                position: 'relative'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span>{activeTab === 'issues' ? 'Date Added' : 'Date Corrected'}</span>
                  <div style={{ position: 'relative' }} ref={calendarRef}>
                    <button
                      onClick={() => setShowCalendar(!showCalendar)}
                      style={{
                        background: 'none',
                        border: '1px solid #d1d5db',
                        borderRadius: '4px',
                        padding: '4px 8px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        fontSize: '0.75rem',
                        color: '#6b7280',
                        transition: 'all 0.2s ease'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.borderColor = '#4A90E2';
                        e.currentTarget.style.backgroundColor = '#f8fafc';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.borderColor = '#d1d5db';
                        e.currentTarget.style.backgroundColor = 'transparent';
                      }}
                    >
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                        <line x1="16" y1="2" x2="16" y2="6"></line>
                        <line x1="8" y1="2" x2="8" y2="6"></line>
                        <line x1="3" y1="10" x2="21" y2="10"></line>
                      </svg>
                      <svg width="8" height="8" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M7 10l5 5 5-5z"/>
                      </svg>
                    </button>
                    
                    {showCalendar && (
                      <div style={{
                        position: 'absolute',
                        top: '100%',
                        right: '0',
                        zIndex: 1000,
                        backgroundColor: 'white',
                        border: '1px solid #d1d5db',
                        borderRadius: '8px',
                        boxShadow: '0 10px 25px rgba(0, 0, 0, 0.15)',
                        padding: '16px',
                        minWidth: '280px',
                        marginTop: '4px'
                      }}>
                        <div style={{ marginBottom: '12px' }}>
                          <h4 style={{ margin: '0 0 8px 0', fontSize: '0.875rem', fontWeight: '600', color: '#111827' }}>
                            Filter by Date
                          </h4>
                          <input
                            type="date"
                            value={selectedDate}
                            onChange={(e) => setSelectedDate(e.target.value)}
                            style={{
                              width: '100%',
                              padding: '8px 12px',
                              border: '1px solid #d1d5db',
                              borderRadius: '6px',
                              fontSize: '0.875rem',
                              outline: 'none',
                              transition: 'border-color 0.2s ease',
                              boxSizing: 'border-box'
                            }}
                            onFocus={(e) => {
                              e.target.style.borderColor = '#4A90E2';
                            }}
                            onBlur={(e) => {
                              e.target.style.borderColor = '#d1d5db';
                            }}
                          />
                        </div>
                        <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                          <button
                            onClick={() => {
                              setSelectedDate('');
                              setShowCalendar(false);
                            }}
                            style={{
                              padding: '6px 12px',
                              border: '1px solid #d1d5db',
                              borderRadius: '4px',
                              fontSize: '0.75rem',
                              backgroundColor: 'white',
                              color: '#374151',
                              cursor: 'pointer',
                              transition: 'all 0.2s ease'
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.backgroundColor = '#f3f4f6';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.backgroundColor = 'white';
                            }}
                          >
                            Clear
                          </button>
                          <button
                            onClick={() => {
                              setShowCalendar(false);
                              // Here you can add logic to filter by the selected date
                              console.log('Filter by date:', selectedDate);
                            }}
                            style={{
                              padding: '6px 12px',
                              border: 'none',
                              borderRadius: '4px',
                              fontSize: '0.75rem',
                              backgroundColor: '#4A90E2',
                              color: 'white',
                              cursor: 'pointer',
                              transition: 'all 0.2s ease'
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.backgroundColor = '#3b82f6';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.backgroundColor = '#4A90E2';
                            }}
                          >
                            Apply
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
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
                  backgroundColor: selectedIssueIds.has(issue.id) ? '#eff6ff' : (hoveredRowId === issue.id ? '#f9fafb' : 'transparent'),
                  cursor: 'pointer',
                  transition: 'background-color 0.2s ease'
                }}
                onMouseEnter={() => setHoveredRowId(issue.id)}
                onMouseLeave={() => setHoveredRowId(null)}
              >
                <td style={{ 
                  padding: '16px',
                  textAlign: 'center'
                }}>
                  <input
                    type="checkbox"
                    checked={selectedIssueIds.has(issue.id)}
                    onChange={(e) => {
                      e.stopPropagation();
                      handleSelectIssue(issue.id, e.target.checked);
                    }}
                    style={{
                      width: '16px',
                      height: '16px',
                      cursor: 'pointer',
                      accentColor: '#4A90E2'
                    }}
                  />
                </td>
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
                      onClick={() => markAsCorrected(issue.part_number, issue.owner)}
                      disabled={isUpdating === `${issue.part_number}|${issue.owner ?? 'null'}`}
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
                      onClick={() => markAsIncorrect(issue.part_number, issue.owner)}
                      disabled={isUpdating === `${issue.part_number}|${issue.owner ?? 'null'}`}
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
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {/* Page number buttons */}
            {(() => {
              const pagesToShow = 9; // max number of page buttons to display
              const total = activeTab === 'issues' ? totalPages : correctedTotalPages;
              const current = activeTab === 'issues' ? currentPage : correctedCurrentPage;
              if (total <= 1) return null;

              const pageItems: (number | '...')[] = [];

              if (total <= pagesToShow) {
                for (let i = 1; i <= total; i++) pageItems.push(i);
              } else {
                const side = Math.floor((pagesToShow - 3) / 2); // pages around current
                let left = Math.max(2, current - side);
                let right = Math.min(total - 1, current + side);

                // adjust if we're near the start or end
                if (current - 1 <= side) {
                  left = 2;
                  right = pagesToShow - 2;
                } else if (total - current <= side) {
                  left = total - (pagesToShow - 3);
                  right = total - 1;
                }

                pageItems.push(1);
                if (left > 2) pageItems.push('...');
                for (let i = left; i <= right; i++) pageItems.push(i);
                if (right < total - 1) pageItems.push('...');
                pageItems.push(total);
              }

              return pageItems.map((p, idx) => {
                if (p === '...') {
                  return (
                    <span key={`dots-${idx}`} style={{ color: '#9ca3af' }}>…</span>
                  );
                }
                const pageNum = p as number;
                const isActive = pageNum === (activeTab === 'issues' ? currentPage : correctedCurrentPage);
                return (
                  <button
                    key={pageNum}
                    onClick={() => {
                      if (activeTab === 'issues') setCurrentPage(pageNum);
                      else setCorrectedCurrentPage(pageNum);
                    }}
                    style={{
                      padding: '6px 8px',
                      border: 'none',
                      background: 'transparent',
                      color: isActive ? 'white' : '#2563eb',
                      backgroundColor: isActive ? '#2563eb' : 'transparent',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      minWidth: '28px',
                      textAlign: 'center'
                    }}
                  >
                    {pageNum}
                  </button>
                );
              });
            })()}
          </div>
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