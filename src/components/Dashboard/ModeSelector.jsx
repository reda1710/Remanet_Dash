/**
 * ModeSelector Component
 * 
 * Toggle between real-time and historical modes with date selection
 */

import React from 'react';
import { Calendar, Activity, Loader2 } from 'lucide-react';

export default function ModeSelector({ 
  mode, 
  onModeChange, 
  selectedDate, 
  onDateChange,
  loading 
}) {
  // Get today's date in local timezone for max attribute
  const getTodayString = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };
  
  const handleDateInputChange = (e) => {
    const newDate = e.target.value;
    console.log('Date picker changed to:', newDate);
    onDateChange(newDate);
  };
  
  return (
    <div className="flex flex-col md:flex-row items-start md:items-center gap-4 p-4 bg-card rounded-lg border shadow-sm">
      {/* Mode Toggle Buttons */}
      <div className="flex gap-2">
        <button 
          className={`flex items-center gap-2 px-4 py-2 rounded-md font-medium transition-all ${
            mode === 'realtime' 
              ? 'bg-green-500 text-white shadow-md' 
              : 'bg-secondary text-muted-foreground hover:bg-secondary/80'
          }`}
          onClick={() => onModeChange('realtime')}
          disabled={loading}
        >
          <Activity className="h-4 w-4" />
          Real-Time
        </button>
        <button 
          className={`flex items-center gap-2 px-4 py-2 rounded-md font-medium transition-all ${
            mode === 'historical' 
              ? 'bg-blue-500 text-white shadow-md' 
              : 'bg-secondary text-muted-foreground hover:bg-secondary/80'
          }`}
          onClick={() => onModeChange('historical')}
          disabled={loading}
        >
          <Calendar className="h-4 w-4" />
          Historical
        </button>
      </div>
      
      {/* Historical Mode Controls */}
      {mode === 'historical' && (
        <div className="flex items-center gap-3">
          <label htmlFor="historical-date" className="text-sm font-medium">
            Select Date:
          </label>
          <input 
            type="date" 
            id="historical-date"
            value={selectedDate}
            max={getTodayString()}
            onChange={handleDateInputChange}
            disabled={loading}
            className="px-3 py-2 border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          />
          {loading && (
            <div className="flex items-center gap-2 text-blue-500">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span className="text-sm">Loading...</span>
            </div>
          )}
        </div>
      )}
      
      {/* Real-Time Indicator */}
      {mode === 'realtime' && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
          </span>
          <span className="font-medium">Live Streaming</span>
        </div>
      )}
    </div>
  );
}
