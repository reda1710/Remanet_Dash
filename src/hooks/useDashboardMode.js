/**
 * Custom Hook: useDashboardMode
 * 
 * Manages dashboard mode state (real-time vs historical)
 * Integrates with existing WebSocket filter mechanism
 */

import { useState, useCallback } from 'react';

export function useDashboardMode() {
  const [mode, setMode] = useState('realtime'); // 'realtime' or 'historical'
  
  // Initialize with today's date in local timezone (YYYY-MM-DD format)
  const getTodayLocalDate = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };
  
  const [selectedDate, setSelectedDate] = useState(getTodayLocalDate());
  
  const switchToRealtime = useCallback(() => {
    setMode('realtime');
  }, []);
  
  const switchToHistorical = useCallback((date) => {
    setMode('historical');
    if (date) {
      setSelectedDate(date);
    }
  }, []);
  
  const handleModeChange = useCallback((newMode) => {
    if (newMode === 'realtime') {
      switchToRealtime();
    } else {
      switchToHistorical(selectedDate);
    }
  }, [switchToRealtime, switchToHistorical, selectedDate]);
  
  const handleDateChange = useCallback((date) => {
    setSelectedDate(date);
  }, []);
  
  return {
    mode,
    selectedDate,
    handleModeChange,
    handleDateChange,
    switchToRealtime,
    switchToHistorical,
    isRealtime: mode === 'realtime',
    isHistorical: mode === 'historical'
  };
}
