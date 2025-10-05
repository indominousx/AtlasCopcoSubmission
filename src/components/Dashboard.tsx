import React, { useState, useEffect } from 'react';
import * as XLSX from 'xlsx';
import { supabase } from '../supabaseClient';
import { v4 as uuidv4 } from 'uuid';
import TotalIssuesSummary from './TotalIssuesSummary';
import DynamicMetricsPanel from './DynamicMetricsPanel';
import LastUploadedChart from './LastUploadedChart';
import PartsTable from './PartsTable';
import CorrectedPartsChart from './CorrectedPartsChart';
import CorrectionSummaryChart from './CorrectionSummaryChart';
import NavigationBar from './NavigationBar';
import History from './History';
import Admin from './Admin';

// Define a type for the data returned by our Supabase function for type safety
type IssueTypeSummary = {
  issue_type: string;
  error_count: number;
};

const Dashboard: React.FC = () => {
  const [chartData, setChartData] = useState<any>(null);
  const [error, setError] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [totalSummary, setTotalSummary] = useState<{[key: string]: number}>({});
  const [refreshTrigger, setRefreshTrigger] = useState<number>(0);
  const [activeNavTab, setActiveNavTab] = useState<string>('Dashboard');

  // Function to trigger refresh of all charts when parts are corrected/marked incorrect
  const triggerChartsRefresh = () => {
    console.log('triggerChartsRefresh called');
    setRefreshTrigger(prev => {
      console.log('refreshTrigger updated from', prev, 'to', prev + 1);
      return prev + 1;
    });
  };

  // This function fetches the aggregated data from the DB and populates the chart
  const fetchChartData = async () => {
    setIsLoading(true);
    setError('');
    
    try {
      // Query issues table directly and group by issue_type
      const { data, error } = await supabase
        .from('issues')
        .select('issue_type, part_number')
        .order('issue_type');

      // Also fetch the latest report to get the filename
      const { data: latestReport, error: reportError } = await supabase
        .from('reports')
        .select('file_name, uploaded_at')
        .order('uploaded_at', { ascending: false })
        .limit(1)
        .single();

      if (error) {
        // If table doesn't exist or no data, show helpful message
        setError('No data available. Please upload an Excel file to view charts.');
        console.warn('Supabase query failed:', error.message);
      } else if (data && data.length > 0) {
        // Group data by issue_type and count unique part numbers
        const issueGroups: { [key: string]: Set<string> } = {};
        
        data.forEach((item: any) => {
          if (!issueGroups[item.issue_type]) {
            issueGroups[item.issue_type] = new Set();
          }
          issueGroups[item.issue_type].add(item.part_number);
        });

        // Convert to chart format
        const labels = Object.keys(issueGroups);
        const counts = labels.map(label => issueGroups[label].size);

        // Create total summary object
        const summary: {[key: string]: number} = {};
        labels.forEach((label, index) => {
          summary[label] = counts[index];
        });
        setTotalSummary(summary);

        setChartData({
          labels: labels,
          datasets: [{
            label: 'Total Unique Issues Recorded',
            data: counts,
            backgroundColor: 'rgba(75, 192, 192, 0.6)',
            borderColor: 'rgba(75, 192, 192, 1)',
            borderWidth: 1,
          }],
          // Include filename from latest report if available
          fileName: !reportError && latestReport ? latestReport.file_name : null,
        });
      } else {
        // No data in database
        setError('No data available. Please upload an Excel file to view charts.');
      }
    } catch (err) {
      setError('Database connection failed. Please upload an Excel file to view data.');
      console.warn('Supabase error:', err);
    }
    setIsLoading(false);
  };

  // Fetch initial data when the component loads
  useEffect(() => {
    fetchChartData();
  }, []);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError('');
    setIsUploading(true);
    const reportId = uuidv4();

    try {
      // Parse the Excel file locally
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data, { type: 'array' });
      const sheetNames = workbook.SheetNames;
      
      if (sheetNames.length === 0) {
        throw new Error('The uploaded Excel file has no sheets.');
      }

      let allPartsToProcess: any[] = [];
      let totalPartsAnalyzed = 0;

      // Process each sheet and collect data for Supabase
      const issueCounts = sheetNames.map(sheetName => {
        const worksheet = workbook.Sheets[sheetName];
        const jsonData: any[] = XLSX.utils.sheet_to_json(worksheet);

        // Deduplication logic based on Part Number and Owner
        const seen = new Set<string>();
        const uniqueIssues = jsonData.filter(row => {
          // Check if the required columns exist in the row
          if (row['Part Number'] === undefined || row['Part Number'] === '') {
            return false;
          }

          // Use the Part Number as the base for the unique key
          const partNumber = String(row['Part Number']);
          
          // Check if an Owner exists and has a value for this row
          const owner = row['Owner'] ? String(row['Owner']) : '';
          
          // Create a unique key
          const key = owner ? `${partNumber}|${owner}` : partNumber;

          // If the key has been seen before, it's a duplicate
          if (seen.has(key)) {
            return false;
          } else {
            // If the key is new, add it to our set and keep the row
            seen.add(key);
            return true;
          }
        });

        // Prepare data for Supabase insertion
        const partsForDb = uniqueIssues
          .filter(issue => issue['Part Number'])
          .map(issue => ({
            part_number: String(issue['Part Number']),
            owner: issue['Owner'] ? String(issue['Owner']) : null,
            issue_type: sheetName,
            report_id: reportId,
            created_at: new Date().toISOString()
          }));
        
        allPartsToProcess.push(...partsForDb);
        totalPartsAnalyzed += uniqueIssues.length;

        return uniqueIssues.length;
      });

      // Save to Supabase tables (assuming you have a 'reports' and 'issues' table)
      try {
        // 1. Insert report summary
        const { error: reportError } = await supabase
          .from('reports')
          .insert([
            {
              id: reportId,
              file_name: file.name,
              total_issues: totalPartsAnalyzed,
              uploaded_at: new Date().toISOString()
            }
          ]);

        if (reportError) {
          console.warn('Failed to save report summary:', reportError.message);
        }

        // 2. Insert individual issues
        if (allPartsToProcess.length > 0) {
          const { error: issuesError } = await supabase
            .from('issues')
            .insert(allPartsToProcess);

          if (issuesError) {
            console.warn('Failed to save issues:', issuesError.message);
          }
        }

      } catch (supabaseError) {
        console.warn('Supabase operation failed, continuing with local processing:', supabaseError);
      }

      // Create chart data (works regardless of Supabase success/failure)
      setChartData({
        fileName: file.name,
        labels: sheetNames,
        datasets: [
          {
            label: 'Number of Unique Issues',
            data: issueCounts,
            backgroundColor: 'rgba(75, 192, 192, 0.6)',
            borderColor: 'rgba(75, 192, 192, 1)',
            borderWidth: 1,
          },
        ],
      });

      // Try to refresh chart data from Supabase
      try {
        await fetchChartData();
        // Trigger PartsTable refresh by updating the refresh trigger
        setRefreshTrigger(prev => prev + 1);
      } catch (fetchError) {
        // If fetching from Supabase fails, we already have local chart data
        console.warn('Failed to fetch updated data from Supabase:', fetchError);
        // Still trigger PartsTable refresh even if chart data fetch fails
        setRefreshTrigger(prev => prev + 1);
      }

    } catch (e: any) {
      setError(`There was an error processing the Excel file: ${e.message}`);
      console.error(e);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div style={{ fontFamily: 'Arial, sans-serif' }}>
      {/* Navigation Bar */}
      <NavigationBar 
        activeTab={activeNavTab}
        onTabChange={setActiveNavTab}
      />
      
      {/* Conditional Content Based on Active Tab */}
      {activeNavTab === 'History' ? (
        <History />
      ) : activeNavTab === 'Admin' ? (
        <Admin refreshTrigger={refreshTrigger} />
      ) : (
        /* Main Dashboard Content */
        <div style={{ padding: '20px' }}>

      {/* Upload Section */}
      <div style={{ 
        maxWidth: '600px', 
        margin: '0 auto 40px auto', 
        position: 'relative'
      }}>
        <label 
          htmlFor="file-upload" 
          style={{ 
            display: 'block',
            padding: '60px 40px',
            border: '2px dashed #4A90E2',
            borderRadius: '12px',
            backgroundColor: '#f8f9ff',
            textAlign: 'center',
            cursor: isUploading || isLoading ? 'not-allowed' : 'pointer',
            transition: 'all 0.3s ease',
            opacity: isUploading || isLoading ? 0.6 : 1
          }}
          onDragOver={(e) => {
            e.preventDefault();
            e.currentTarget.style.backgroundColor = '#e6f0ff';
            e.currentTarget.style.borderColor = '#2563eb';
          }}
          onDragLeave={(e) => {
            e.preventDefault();
            e.currentTarget.style.backgroundColor = '#f8f9ff';
            e.currentTarget.style.borderColor = '#4A90E2';
          }}
          onDrop={(e) => {
            e.preventDefault();
            e.currentTarget.style.backgroundColor = '#f8f9ff';
            e.currentTarget.style.borderColor = '#4A90E2';
            
            const files = e.dataTransfer.files;
            if (files.length > 0 && !isUploading && !isLoading) {
              const fakeEvent = {
                target: { files: files }
              } as React.ChangeEvent<HTMLInputElement>;
              handleFileUpload(fakeEvent);
            }
          }}
        >
          <div style={{ marginBottom: '20px' }}>
            <svg 
              width="48" 
              height="48" 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="#4A90E2" 
              strokeWidth="2" 
              style={{ marginBottom: '16px' }}
            >
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
              <polyline points="7,10 12,15 17,10"/>
              <line x1="12" y1="15" x2="12" y2="3"/>
            </svg>
          </div>
          
          <div style={{ 
            fontSize: '1.2em', 
            fontWeight: '600', 
            color: '#4A90E2',
            marginBottom: '8px'
          }}>
            {isUploading ? 'Processing Report...' : 'Click to upload or drag and drop'}
          </div>
          
          <div style={{ 
            fontSize: '0.95em', 
            color: '#6b7280',
            fontWeight: '400'
          }}>
            XLSX or XLS files supported
          </div>
        </label>
        
        <input
          id="file-upload" 
          type="file" 
          accept=".xlsx, .xls"
          onChange={handleFileUpload}
          style={{ 
            position: 'absolute',
            opacity: 0,
            width: '100%',
            height: '100%',
            top: 0,
            left: 0,
            cursor: 'pointer'
          }}
          disabled={isUploading || isLoading}
        />
      </div>

      {error && <p style={{ color: 'red', textAlign: 'center' }}>{error}</p>}

      {/* Dynamic Metrics Panel */}
      <DynamicMetricsPanel refreshTrigger={refreshTrigger} />

      {/* Charts Section - 2x2 Grid Layout */}
      <div style={{ 
        maxWidth: '1400px', 
        margin: '0 auto 40px auto', 
        display: 'grid', 
        gridTemplateColumns: '1fr 1fr', 
        gridTemplateRows: '1fr 1fr',
        gap: '50px',
        padding: '40px'
      }}>
        {/* Top Left - Issue Distribution (Total Issues Summary) */}
        <div style={{ minWidth: '0', height: '400px' }}>
          <TotalIssuesSummary totalSummary={totalSummary} />
        </div>

        {/* Top Right - Issue Proportion (Last Uploaded Chart) */}
        <div style={{ minWidth: '0', height: '400px' }}>
          <LastUploadedChart 
            chartData={chartData} 
            isLoading={isLoading} 
          />
        </div>

        {/* Bottom Left - Corrected Parts Chart */}
        <div style={{ minWidth: '0', height: '400px' }}>
          <CorrectedPartsChart refreshTrigger={refreshTrigger} />
        </div>

        {/* Bottom Right - Correction Summary Chart */}
        <div style={{ minWidth: '0', height: '400px' }}>
          <CorrectionSummaryChart refreshTrigger={refreshTrigger} />
        </div>
      </div>

      {/* Parts Table Section */}
      <div style={{ 
        maxWidth: '1400px', 
        margin: '0 auto',
        padding: '0 20px'
      }}>


        {/* Parts Table */}
        <PartsTable refreshTrigger={refreshTrigger} onRefreshCharts={triggerChartsRefresh} />
        </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;