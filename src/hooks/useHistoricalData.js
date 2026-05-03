/**
 * useHistoricalData Hook
 * 
 * Fetches historical data from REST API for a specific date
 */

import { useState, useEffect } from 'react';

export const useHistoricalData = (selectedDate, mode) => {
  const [data, setData] = useState({
    coldSpray: [],
    analog0: [],
    analog1: []
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  useEffect(() => {
    // Only fetch when in historical mode and date is selected
    if (mode !== 'historical' || !selectedDate) {
      setData({ coldSpray: [], analog0: [], analog1: [] });
      setLoading(false);
      return;
    }
    
    const fetchHistoricalData = async () => {
      setLoading(true);
      setError(null);
      
      try {
        // Parse date directly from YYYY-MM-DD format to avoid timezone issues
        // selectedDate is in format "YYYY-MM-DD" from date input
        const [year, month, day] = selectedDate.split('-');
        
        // Remove leading zeros for backend format (9/15/2025 instead of 09/15/2025)
        const monthNum = parseInt(month, 10);
        const dayNum = parseInt(day, 10);
        const formattedDate = `${monthNum}/${dayNum}/${year}`; // M/D/YYYY for backend
        
        const apiUrl = `http://localhost:8000/data/?filter_date=${formattedDate}`;
        
        // Fetch from REST API
        const response = await fetch(apiUrl);
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const result = await response.json();
        
        // Log data load summary
        if (result.data && result.data.length > 0) {
          console.log(`✓ Loaded ${result.data.length} historical data points for ${selectedDate}`);
        }
        
        // Transform historical data to match real-time format
        const transformedData = (result.data || []).map(item => ({
          // Add unix_timestamp (required for charts)
          unix_timestamp: new Date(item.Time).getTime() / 1000,
          
          // Preserve all original fields from backend
          ...item,
          
          // Field name mappings (backend → frontend):
          ṁ_pow: item.m_dot_pow,              // DB: m_dot_pow → Frontend: ṁ_pow
          σ_P: item.sigma_P,                   // DB: sigma_P → Frontend: σ_P
          dP_ac_dt: item.acoustic_power_derivative,  // DB: acoustic_power_derivative → Frontend: dP_ac_dt (for PCI calculation)
        }));
        
        // Transform analog data with unix_timestamp
        const transformedAnalog0 = (result.analog_0 || []).map(item => ({
          ...item,
          unix_timestamp: new Date(item.Time).getTime() / 1000,
        }));
        
        const transformedAnalog1 = (result.analog_1 || []).map(item => ({
          ...item,
          unix_timestamp: new Date(item.Time).getTime() / 1000,
        }));
        
        // Historical API returns data with separate analog sensor arrays
        setData({
          coldSpray: transformedData,
          analog0: transformedAnalog0,
          analog1: transformedAnalog1,
          notifications: result.notifications || []
        });
        
      } catch (err) {
        console.error('Error fetching historical data:', err);
        setError(err.message);
        setData({ coldSpray: [], analog0: [], analog1: [] });
      } finally {
        setLoading(false);
      }
    };
    
    fetchHistoricalData();
  }, [selectedDate, mode]);
  
  return { data, loading, error };
};
