# Historical Mode & PCI Visualization - Enhancement Guide

## 📋 Overview
This guide extends the existing dashboard implementation with:
1. **Historical Mode**: View past data by selecting specific dates
2. **Full Timeline Display**: Show complete day data with zoom/pan capabilities
3. **PCI Real-Time & Historical**: Dedicated PCI chart with trend analysis
4. **Mode Switching**: Seamless transition between real-time and historical modes

---

## 🎯 Architecture Overview

### Mode System
```
Dashboard Modes:
├── Real-Time Mode (default)
│   ├── Live WebSocket streaming
│   ├── Auto-update charts
│   ├── Latest data only (configurable window)
│   └── PCI calculated on-the-fly
│
└── Historical Mode
    ├── Date picker UI
    ├── Load full day data from backend
    ├── Display complete timeline (00:00 - 23:59)
    ├── Full zoom/pan/scroll capabilities
    └── PCI calculated from stored data
```

---

## 🔄 Real-Time vs Historical Mode Comparison

| Feature | Real-Time Mode | Historical Mode |
|---------|---------------|-----------------|
| **Data Source** | WebSocket stream | REST API endpoint |
| **Time Range** | Last N minutes (selectable) | Full selected day |
| **Updates** | Auto-refresh (live) | Static (load once) |
| **X-Axis** | Rolling window | Fixed day range (00:00-23:59) |
| **Zoom** | Available within window | Available across full day |
| **PCI** | Latest value + short trend | Full day trend + statistics |
| **Use Case** | Monitoring current process | Analysis & debugging |

---

## 🏗️ Component Architecture

### New/Modified Components

```
src/
├── components/
│   ├── Dashboard/
│   │   ├── DashboardLayout.jsx              # MODIFIED: Add mode switcher
│   │   ├── ModeSelector.jsx                 # NEW: Real-time/Historical toggle
│   │   └── HistoricalDatePicker.jsx         # NEW: Date selection UI
│   ├── Common/
│   │   ├── FullTimelineChart.jsx            # NEW: Chart for full day data
│   │   └── PCIChart.jsx                     # NEW: Dedicated PCI visualization
│   └── Composite/
│       └── PCITrendAnalysis.jsx             # NEW: Advanced PCI insights
├── hooks/
│   ├── useHistoricalData.js                 # NEW: Fetch historical data
│   └── useDashboardMode.js                  # NEW: Mode state management
└── utils/
    ├── timelineHelpers.js                   # NEW: Full day time handling
    └── pciVisualization.js                  # NEW: PCI chart configurations
```

---

## 🎛️ Mode Selector Component

### File: `components/Dashboard/ModeSelector.jsx`
```jsx
import React from 'react';

const ModeSelector = ({ mode, onModeChange, selectedDate, onDateChange }) => {
  return (
    <div className="mode-selector">
      <div className="mode-toggle">
        <button 
          className={`mode-btn ${mode === 'realtime' ? 'active' : ''}`}
          onClick={() => onModeChange('realtime')}
        >
          🔴 Real-Time
        </button>
        <button 
          className={`mode-btn ${mode === 'historical' ? 'active' : ''}`}
          onClick={() => onModeChange('historical')}
        >
          📅 Historical
        </button>
      </div>
      
      {mode === 'historical' && (
        <div className="date-picker-container">
          <label htmlFor="historical-date">Select Date:</label>
          <input 
            type="date" 
            id="historical-date"
            value={selectedDate}
            max={new Date().toISOString().split('T')[0]} // Can't select future
            onChange={(e) => onDateChange(e.target.value)}
          />
          <button 
            className="btn-load-data"
            onClick={() => onModeChange('historical')}
          >
            Load Data
          </button>
        </div>
      )}
      
      {mode === 'realtime' && (
        <div className="realtime-indicator">
          <span className="pulse-dot"></span>
          <span>Live Streaming</span>
        </div>
      )}
    </div>
  );
};

export default ModeSelector;
```

---

## 🔌 Historical Data Hook

### File: `hooks/useHistoricalData.js`
```javascript
import { useState, useEffect } from 'react';

/**
 * Hook to fetch and manage historical data
 */
export const useHistoricalData = (selectedDate, mode) => {
  const [data, setData] = useState({
    coldSpray: [],
    analog0: [],
    analog1: [],
    pci: []
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  useEffect(() => {
    if (mode !== 'historical' || !selectedDate) {
      setData({ coldSpray: [], analog0: [], analog1: [], pci: [] });
      return;
    }
    
    const fetchHistoricalData = async () => {
      setLoading(true);
      setError(null);
      
      try {
        // Format date as MM/DD/YYYY for backend
        const dateObj = new Date(selectedDate);
        const formattedDate = `${String(dateObj.getMonth() + 1).padStart(2, '0')}/${String(dateObj.getDate()).padStart(2, '0')}/${dateObj.getFullYear()}`;
        
        // Fetch from REST API
        const response = await fetch(
          `http://localhost:8000/data/?filter_date=${formattedDate}`
        );
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const result = await response.json();
        
        // Process and set data
        setData({
          coldSpray: result.cold_spray || [],
          analog0: result.analog_0 || [],
          analog1: result.analog_1 || [],
          pci: result.pci || [] // Backend pre-calculates PCI for historical data
        });
        
      } catch (err) {
        console.error('Error fetching historical data:', err);
        setError(err.message);
        setData({ coldSpray: [], analog0: [], analog1: [], pci: [] });
      } finally {
        setLoading(false);
      }
    };
    
    fetchHistoricalData();
  }, [selectedDate, mode]);
  
  return { data, loading, error };
};
```

### File: `hooks/useDashboardMode.js`
```javascript
import { useState, useCallback } from 'react';

/**
 * Hook to manage dashboard mode state
 */
export const useDashboardMode = () => {
  const [mode, setMode] = useState('realtime'); // 'realtime' or 'historical'
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split('T')[0] // Today's date
  );
  
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
    isRealtime: mode === 'realtime',
    isHistorical: mode === 'historical'
  };
};
```

---

## 📊 Full Timeline Chart Component

### File: `components/Common/FullTimelineChart.jsx`
```jsx
import React, { useEffect, useRef } from 'react';
import Chart from 'chart.js/auto';
import 'chartjs-adapter-date-fns';
import zoomPlugin from 'chartjs-plugin-zoom';
import annotationPlugin from 'chartjs-plugin-annotation';

Chart.register(zoomPlugin, annotationPlugin);

/**
 * Chart component optimized for displaying full day timeline
 * Features:
 * - Full day x-axis (00:00 to 23:59)
 * - Zoom and pan enabled
 * - Auto-scale based on data
 * - No data decimation (show all points)
 */
const FullTimelineChart = ({ 
  data, 
  options = {}, 
  height = 400,
  selectedDate 
}) => {
  const canvasRef = useRef(null);
  const chartRef = useRef(null);
  
  useEffect(() => {
    if (!canvasRef.current || !data.datasets) return;
    
    const ctx = canvasRef.current.getContext('2d');
    
    // Destroy previous chart
    if (chartRef.current) {
      chartRef.current.destroy();
    }
    
    // Calculate day boundaries
    const dayStart = new Date(selectedDate);
    dayStart.setHours(0, 0, 0, 0);
    
    const dayEnd = new Date(selectedDate);
    dayEnd.setHours(23, 59, 59, 999);
    
    // Default options for full timeline
    const defaultOptions = {
      responsive: true,
      maintainAspectRatio: false,
      interaction: {
        mode: 'index',
        intersect: false
      },
      scales: {
        x: {
          type: 'time',
          min: dayStart,
          max: dayEnd,
          time: {
            unit: 'hour',
            stepSize: 1,
            displayFormats: {
              hour: 'HH:mm',
              minute: 'HH:mm'
            },
            tooltipFormat: 'yyyy-MM-dd HH:mm:ss'
          },
          title: {
            display: true,
            text: `Timeline - ${selectedDate}`
          },
          ticks: {
            maxRotation: 0,
            autoSkip: false, // Show all hour marks
            maxTicksLimit: 24
          },
          grid: {
            display: true,
            color: 'rgba(0, 0, 0, 0.05)'
          }
        }
      },
      plugins: {
        legend: {
          position: 'top',
          labels: {
            usePointStyle: true,
            boxWidth: 6
          }
        },
        tooltip: {
          callbacks: {
            title: function(context) {
              const date = new Date(context[0].parsed.x);
              return date.toLocaleString();
            }
          }
        },
        zoom: {
          zoom: {
            wheel: {
              enabled: true,
              speed: 0.1
            },
            pinch: {
              enabled: true
            },
            mode: 'x',
            onZoomComplete: ({ chart }) => {
              // Update time unit based on zoom level
              const xScale = chart.scales.x;
              const range = xScale.max - xScale.min;
              const rangeHours = range / (1000 * 60 * 60);
              
              if (rangeHours < 2) {
                xScale.options.time.unit = 'minute';
                xScale.options.time.stepSize = 5;
              } else if (rangeHours < 6) {
                xScale.options.time.unit = 'minute';
                xScale.options.time.stepSize = 30;
              } else {
                xScale.options.time.unit = 'hour';
                xScale.options.time.stepSize = 1;
              }
              chart.update('none');
            }
          },
          pan: {
            enabled: true,
            mode: 'x'
          },
          limits: {
            x: { 
              min: dayStart.getTime(),
              max: dayEnd.getTime()
            }
          }
        }
      }
    };
    
    // Deep merge options
    const mergedOptions = mergeDeep(defaultOptions, options);
    
    // Create chart
    chartRef.current = new Chart(ctx, {
      type: 'line',
      data: data,
      options: mergedOptions
    });
    
    return () => {
      if (chartRef.current) {
        chartRef.current.destroy();
      }
    };
  }, [data, options, selectedDate]);
  
  const resetZoom = () => {
    if (chartRef.current) {
      chartRef.current.resetZoom();
    }
  };
  
  const zoomToRange = (startHour, endHour) => {
    if (!chartRef.current) return;
    
    const dayStart = new Date(selectedDate);
    const zoomStart = new Date(dayStart);
    zoomStart.setHours(startHour, 0, 0, 0);
    
    const zoomEnd = new Date(dayStart);
    zoomEnd.setHours(endHour, 0, 0, 0);
    
    chartRef.current.zoomScale('x', {
      min: zoomStart.getTime(),
      max: zoomEnd.getTime()
    });
  };
  
  return (
    <div className="full-timeline-chart">
      <div className="chart-controls">
        <button onClick={resetZoom} className="btn-control">
          Reset Zoom
        </button>
        <div className="quick-zoom">
          <span>Quick Zoom:</span>
          <button onClick={() => zoomToRange(0, 6)} className="btn-control-sm">
            00:00-06:00
          </button>
          <button onClick={() => zoomToRange(6, 12)} className="btn-control-sm">
            06:00-12:00
          </button>
          <button onClick={() => zoomToRange(12, 18)} className="btn-control-sm">
            12:00-18:00
          </button>
          <button onClick={() => zoomToRange(18, 24)} className="btn-control-sm">
            18:00-24:00
          </button>
        </div>
      </div>
      <div style={{ height: `${height}px`, position: 'relative' }}>
        <canvas ref={canvasRef}></canvas>
      </div>
      <div className="chart-info">
        <span>💡 Use mouse wheel to zoom, drag to pan</span>
      </div>
    </div>
  );
};

// Deep merge helper
function mergeDeep(target, source) {
  const output = { ...target };
  if (isObject(target) && isObject(source)) {
    Object.keys(source).forEach(key => {
      if (isObject(source[key])) {
        if (!(key in target))
          output[key] = source[key];
        else
          output[key] = mergeDeep(target[key], source[key]);
      } else {
        output[key] = source[key];
      }
    });
  }
  return output;
}

function isObject(item) {
  return item && typeof item === 'object' && !Array.isArray(item);
}

export default FullTimelineChart;
```

---

## 📈 Dedicated PCI Chart Component

### File: `components/Common/PCIChart.jsx`
```jsx
import React, { useEffect, useRef, useMemo } from 'react';
import Chart from 'chart.js/auto';
import 'chartjs-adapter-date-fns';
import zoomPlugin from 'chartjs-plugin-zoom';
import annotationPlugin from 'chartjs-plugin-annotation';
import { getPCIColor, PCI_THRESHOLDS } from '../../utils/pciCalculator';

Chart.register(zoomPlugin, annotationPlugin);

/**
 * Dedicated PCI visualization component
 * Shows:
 * - PCI trend over time
 * - Risk zones (LOW/MEDIUM/HIGH/CRITICAL)
 * - Component breakdown (σ_P and dP_ac/dt)
 * - Statistics panel
 */
const PCIChart = ({ 
  pciData, 
  mode, 
  selectedDate,
  height = 500 
}) => {
  const canvasRef = useRef(null);
  const chartRef = useRef(null);
  
  // Calculate statistics
  const stats = useMemo(() => {
    if (!pciData || pciData.length === 0) return null;
    
    const pciValues = pciData.map(d => d.pci);
    const max = Math.max(...pciValues);
    const min = Math.min(...pciValues);
    const avg = pciValues.reduce((a, b) => a + b, 0) / pciValues.length;
    const current = pciValues[pciValues.length - 1];
    
    // Count time in each risk zone
    const zoneCounts = {
      low: pciValues.filter(v => v < PCI_THRESHOLDS.PCI.LOW).length,
      medium: pciValues.filter(v => v >= PCI_THRESHOLDS.PCI.LOW && v < PCI_THRESHOLDS.PCI.MEDIUM).length,
      high: pciValues.filter(v => v >= PCI_THRESHOLDS.PCI.MEDIUM && v < PCI_THRESHOLDS.PCI.HIGH).length,
      critical: pciValues.filter(v => v >= PCI_THRESHOLDS.PCI.HIGH).length
    };
    
    return {
      max: (max * 100).toFixed(1),
      min: (min * 100).toFixed(1),
      avg: (avg * 100).toFixed(1),
      current: (current * 100).toFixed(1),
      zoneCounts,
      total: pciValues.length
    };
  }, [pciData]);
  
  useEffect(() => {
    if (!canvasRef.current || !pciData || pciData.length === 0) return;
    
    const ctx = canvasRef.current.getContext('2d');
    
    if (chartRef.current) {
      chartRef.current.destroy();
    }
    
    // Prepare data
    const timeData = pciData.map(d => ({
      x: new Date(d.unix_timestamp * 1000),
      y: d.pci * 100 // Convert to percentage
    }));
    
    // Component data for stacked view
    const sigmaData = pciData.map(d => ({
      x: new Date(d.unix_timestamp * 1000),
      y: d.components.sigma_P_normalized * 100
    }));
    
    const acousticData = pciData.map(d => ({
      x: new Date(d.unix_timestamp * 1000),
      y: d.components.dP_ac_dt_normalized * 100
    }));
    
    // Configure chart based on mode
    const isHistorical = mode === 'historical';
    const dayStart = isHistorical ? new Date(selectedDate) : undefined;
    const dayEnd = isHistorical ? new Date(selectedDate) : undefined;
    
    if (dayStart) dayStart.setHours(0, 0, 0, 0);
    if (dayEnd) dayEnd.setHours(23, 59, 59, 999);
    
    const chartConfig = {
      type: 'line',
      data: {
        datasets: [
          {
            label: 'PCI Risk Index',
            data: timeData,
            borderColor: 'rgb(75, 192, 192)',
            backgroundColor: function(context) {
              const chart = context.chart;
              const {ctx, chartArea} = chart;
              if (!chartArea) return;
              
              // Gradient based on risk zones
              const gradient = ctx.createLinearGradient(0, chartArea.bottom, 0, chartArea.top);
              gradient.addColorStop(0, 'rgba(76, 175, 80, 0.2)'); // Green (low)
              gradient.addColorStop(0.3, 'rgba(255, 193, 7, 0.2)'); // Yellow (medium)
              gradient.addColorStop(0.6, 'rgba(255, 152, 0, 0.2)'); // Orange (high)
              gradient.addColorStop(1, 'rgba(244, 67, 54, 0.2)'); // Red (critical)
              return gradient;
            },
            fill: true,
            tension: 0.4,
            borderWidth: 3,
            pointRadius: isHistorical ? 0 : 3,
            pointHoverRadius: 5
          },
          {
            label: 'σ_P Component',
            data: sigmaData,
            borderColor: 'rgba(255, 99, 132, 0.5)',
            borderWidth: 1,
            borderDash: [5, 5],
            fill: false,
            tension: 0.4,
            pointRadius: 0,
            hidden: false // Can be toggled
          },
          {
            label: 'Acoustic Component',
            data: acousticData,
            borderColor: 'rgba(54, 162, 235, 0.5)',
            borderWidth: 1,
            borderDash: [5, 5],
            fill: false,
            tension: 0.4,
            pointRadius: 0,
            hidden: false // Can be toggled
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: {
          mode: 'index',
          intersect: false
        },
        scales: {
          x: {
            type: 'time',
            ...(isHistorical && {
              min: dayStart,
              max: dayEnd
            }),
            time: {
              unit: isHistorical ? 'hour' : 'minute',
              displayFormats: {
                hour: 'HH:mm',
                minute: 'HH:mm'
              },
              tooltipFormat: 'yyyy-MM-dd HH:mm:ss'
            },
            title: {
              display: true,
              text: isHistorical ? `PCI Timeline - ${selectedDate}` : 'Time'
            }
          },
          y: {
            min: 0,
            max: 100,
            title: {
              display: true,
              text: 'PCI Risk (%)'
            },
            ticks: {
              callback: function(value) {
                return value + '%';
              }
            }
          }
        },
        plugins: {
          legend: {
            position: 'top'
          },
          tooltip: {
            callbacks: {
              label: function(context) {
                let label = context.dataset.label || '';
                if (label) label += ': ';
                label += context.parsed.y.toFixed(1) + '%';
                
                // Add risk level for main PCI line
                if (context.datasetIndex === 0) {
                  const pci = context.parsed.y / 100;
                  let risk = 'LOW';
                  if (pci >= PCI_THRESHOLDS.PCI.HIGH) risk = 'CRITICAL';
                  else if (pci >= PCI_THRESHOLDS.PCI.MEDIUM) risk = 'HIGH';
                  else if (pci >= PCI_THRESHOLDS.PCI.LOW) risk = 'MEDIUM';
                  label += ` (${risk})`;
                }
                
                return label;
              }
            }
          },
          annotation: {
            annotations: {
              lowLine: {
                type: 'line',
                yMin: PCI_THRESHOLDS.PCI.LOW * 100,
                yMax: PCI_THRESHOLDS.PCI.LOW * 100,
                borderColor: '#FFC107',
                borderWidth: 2,
                borderDash: [10, 5],
                label: {
                  display: true,
                  content: 'Medium Risk (30%)',
                  position: 'end',
                  backgroundColor: '#FFC107',
                  color: '#000'
                }
              },
              mediumLine: {
                type: 'line',
                yMin: PCI_THRESHOLDS.PCI.MEDIUM * 100,
                yMax: PCI_THRESHOLDS.PCI.MEDIUM * 100,
                borderColor: '#FF9800',
                borderWidth: 2,
                borderDash: [10, 5],
                label: {
                  display: true,
                  content: 'High Risk (60%)',
                  position: 'end',
                  backgroundColor: '#FF9800',
                  color: '#fff'
                }
              },
              highLine: {
                type: 'line',
                yMin: PCI_THRESHOLDS.PCI.HIGH * 100,
                yMax: PCI_THRESHOLDS.PCI.HIGH * 100,
                borderColor: '#F44336',
                borderWidth: 2,
                borderDash: [10, 5],
                label: {
                  display: true,
                  content: 'Critical Risk (80%)',
                  position: 'end',
                  backgroundColor: '#F44336',
                  color: '#fff'
                }
              }
            }
          },
          zoom: {
            zoom: {
              wheel: { enabled: true },
              pinch: { enabled: true },
              mode: 'x'
            },
            pan: {
              enabled: true,
              mode: 'x'
            },
            ...(isHistorical && {
              limits: {
                x: {
                  min: dayStart.getTime(),
                  max: dayEnd.getTime()
                }
              }
            })
          }
        }
      }
    };
    
    chartRef.current = new Chart(ctx, chartConfig);
    
    return () => {
      if (chartRef.current) {
        chartRef.current.destroy();
      }
    };
  }, [pciData, mode, selectedDate]);
  
  const resetZoom = () => {
    if (chartRef.current) {
      chartRef.current.resetZoom();
    }
  };
  
  return (
    <div className="pci-chart-container">
      <div className="pci-chart-header">
        <h3>PCI (Pressure-Acoustic Concordance Index)</h3>
        <button onClick={resetZoom} className="btn-reset">
          Reset Zoom
        </button>
      </div>
      
      {stats && (
        <div className="pci-statistics">
          <div className="stat-card">
            <span className="stat-label">Current</span>
            <span className="stat-value" style={{ color: getPCIColor(stats.current / 100) }}>
              {stats.current}%
            </span>
          </div>
          <div className="stat-card">
            <span className="stat-label">Average</span>
            <span className="stat-value">{stats.avg}%</span>
          </div>
          <div className="stat-card">
            <span className="stat-label">Max</span>
            <span className="stat-value">{stats.max}%</span>
          </div>
          <div className="stat-card">
            <span className="stat-label">Min</span>
            <span className="stat-value">{stats.min}%</span>
          </div>
          
          <div className="risk-distribution">
            <span className="dist-label">Time in Risk Zones:</span>
            <div className="dist-bars">
              <div className="dist-bar low" style={{ width: `${(stats.zoneCounts.low / stats.total) * 100}%` }}>
                {((stats.zoneCounts.low / stats.total) * 100).toFixed(0)}% Low
              </div>
              <div className="dist-bar medium" style={{ width: `${(stats.zoneCounts.medium / stats.total) * 100}%` }}>
                {((stats.zoneCounts.medium / stats.total) * 100).toFixed(0)}% Med
              </div>
              <div className="dist-bar high" style={{ width: `${(stats.zoneCounts.high / stats.total) * 100}%` }}>
                {((stats.zoneCounts.high / stats.total) * 100).toFixed(0)}% High
              </div>
              <div className="dist-bar critical" style={{ width: `${(stats.zoneCounts.critical / stats.total) * 100}%` }}>
                {((stats.zoneCounts.critical / stats.total) * 100).toFixed(0)}% Crit
              </div>
            </div>
          </div>
        </div>
      )}
      
      <div style={{ height: `${height}px`, position: 'relative' }}>
        <canvas ref={canvasRef}></canvas>
      </div>
    </div>
  );
};

export default PCIChart;
```

---

## 🔧 Modified Dashboard Layout

### File: `components/Dashboard/DashboardLayout.jsx` (MODIFICATIONS)
```jsx
// ADD THESE IMPORTS
import { useDashboardMode } from '../../hooks/useDashboardMode';
import { useHistoricalData } from '../../hooks/useHistoricalData';
import ModeSelector from './ModeSelector';
import PCIChart from '../Common/PCIChart';

const DashboardLayout = () => {
  // ... existing state ...
  
  // ADD: Mode management
  const {
    mode,
    selectedDate,
    handleModeChange,
    handleDateChange,
    isRealtime,
    isHistorical
  } = useDashboardMode();
  
  // ADD: Historical data fetching
  const { 
    data: historicalData, 
    loading: historicalLoading, 
    error: historicalError 
  } = useHistoricalData(selectedDate, mode);
  
  // MODIFY: Data source selection
  const currentData = isHistorical ? {
    coldSprayData: historicalData.coldSpray,
    analogData: {
      analog_0: historicalData.analog0,
      analog_1: historicalData.analog1
    },
    pciData: historicalData.pci
  } : {
    coldSprayData,
    analogData,
    pciData
  };
  
  return (
    <div className="dashboard-container">
      <header className="dashboard-header">
        <h1>Cold Spray Clog Detection System</h1>
        
        {/* ADD: Mode Selector */}
        <ModeSelector
          mode={mode}
          onModeChange={handleModeChange}
          selectedDate={selectedDate}
          onDateChange={handleDateChange}
        />
        
        <div className="connection-status">
          {isRealtime && (
            <span className={isConnected ? 'connected' : 'disconnected'}>
              {isConnected ? '● Connected' : '○ Disconnected'}
            </span>
          )}
          {isHist