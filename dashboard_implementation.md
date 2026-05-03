# Real-Time Clog Detection Dashboard - Implementation Guide

## 📋 Table of Contents
1. [Dashboard Architecture](#dashboard-architecture)
2. [PCI Calculation Logic](#pci-calculation-logic)
3. [React Component Structure](#react-component-structure)
4. [KPI Organization by Sensor](#kpi-organization-by-sensor)
5. [Chart.js Implementation](#chartjs-implementation)
6. [WebSocket Integration](#websocket-integration)
7. [Complete Code Examples](#complete-code-examples)

---

## 🏗️ Dashboard Architecture

### Overall Structure
```
src/
├── components/
│   ├── Dashboard/
│   │   ├── DashboardLayout.jsx          # Main container
│   │   ├── ClogRiskOverview.jsx         # Top-level risk assessment
│   │   └── AlertPanel.jsx               # Real-time notifications
│   ├── ColdSpray/
│   │   ├── ColdSpraySection.jsx         # Cold spray container
│   │   ├── PressureKPI.jsx              # P_Gun + σ_P charts
│   │   ├── FlowKPI.jsx                  # Q_PG_N2 + R_FP charts
│   │   ├── TemperatureKPI.jsx           # T_Gun + U3_Input charts
│   │   └── PowderKPI.jsx                # ṁ_pow + P_PF1 charts
│   ├── AnalogSensors/
│   │   ├── AnalogSensorSection.jsx      # Analog container
│   │   ├── VibrationKPI.jsx             # RMS (analog_0 + analog_1)
│   │   ├── AcousticKPI.jsx              # Spectral energy + derivative
│   │   ├── FrequencyKPI.jsx             # Dominant freq + centroid
│   │   └── SpectralFeaturesGrid.jsx     # All spectral features
│   ├── Composite/
│   │   ├── PCICalculator.jsx            # PCI computation
│   │   ├── PCIGauge.jsx                 # Visual risk gauge
│   │   └── CompositeKPIChart.jsx        # Multi-sensor fusion chart
│   └── Common/
│       ├── TimeWindowSelector.jsx       # Time range picker
│       ├── KPICard.jsx                  # Reusable metric card
│       ├── MultiAxisChart.jsx           # Chart.js wrapper with zoom
│       └── ThresholdIndicator.jsx       # Visual threshold lines
├── hooks/
│   ├── useWebSocket.js                  # WebSocket connection
│   ├── useKPICalculations.js            # Real-time KPI math
│   └── useDataDecimation.js             # Time-series optimization
├── utils/
│   ├── pciCalculator.js                 # PCI algorithm
│   ├── dataFusion.js                    # Multi-sensor synchronization
│   ├── thresholds.js                    # KPI threshold definitions
│   └── chartHelpers.js                  # Chart.js utilities
└── contexts/
    └── DashboardContext.jsx             # Global state management
```

---

## 🧮 PCI Calculation Logic

### Overview
**PCI (Pressure-Acoustic Concordance Index)** is a composite KPI that combines pressure instability with acoustic anomalies to predict nozzle clogging.

### Formula
```
PCI = σ_P_normalized × |dP_ac/dt|_normalized × scaling_factor
```

### Implementation

#### File: `utils/pciCalculator.js`
```javascript
/**
 * PCI (Pressure-Acoustic Concordance Index) Calculator
 * 
 * Combines pressure fluctuation (σ_P) with acoustic power derivative (dP_ac/dt)
 * to create a composite early-warning metric for nozzle clogging.
 * 
 * Reference: KPI #15 from REMANET WP6.2 specification
 */

// Threshold definitions based on experimental data
const PCI_THRESHOLDS = {
  // Pressure fluctuation limits (bar)
  SIGMA_P: {
    MIN: 0,
    MAX: 5.0,        // σ_P > 5 is severe instability
    WARNING: 3.0,    // σ_P > 3 triggers warning
    CRITICAL: 4.0    // σ_P > 4 is critical
  },
  
  // Acoustic power derivative limits (dB/s or normalized units)
  DP_AC_DT: {
    MIN: 0,
    MAX: 50.0,       // Adjust based on sensor calibration
    WARNING: 20.0,
    CRITICAL: 35.0
  },
  
  // PCI risk levels
  PCI: {
    LOW: 0.3,        // < 30% = Normal operation
    MEDIUM: 0.6,     // 30-60% = Monitor closely
    HIGH: 0.8,       // 60-80% = Warning
    CRITICAL: 1.0    // > 80% = Imminent clog
  }
};

/**
 * Normalize a value to [0, 1] range using min-max scaling
 * 
 * @param {number} value - Raw value to normalize
 * @param {number} min - Minimum expected value
 * @param {number} max - Maximum expected value
 * @returns {number} Normalized value between 0 and 1
 */
function normalize(value, min, max) {
  if (max === min) return 0;
  const normalized = (value - min) / (max - min);
  return Math.max(0, Math.min(1, normalized)); // Clamp to [0, 1]
}

/**
 * Calculate normalized pressure fluctuation
 * 
 * @param {number} sigma_P - Standard deviation of gun pressure (bar)
 * @returns {number} Normalized σ_P value [0, 1]
 */
function normalizeSigmaP(sigma_P) {
  return normalize(
    sigma_P, 
    PCI_THRESHOLDS.SIGMA_P.MIN, 
    PCI_THRESHOLDS.SIGMA_P.MAX
  );
}

/**
 * Calculate normalized acoustic power derivative
 * 
 * @param {number} dP_ac_dt - Rate of change of acoustic power
 * @returns {number} Normalized |dP_ac/dt| value [0, 1]
 */
function normalizeDPacDt(dP_ac_dt) {
  const abs_dP_ac_dt = Math.abs(dP_ac_dt);
  return normalize(
    abs_dP_ac_dt, 
    PCI_THRESHOLDS.DP_AC_DT.MIN, 
    PCI_THRESHOLDS.DP_AC_DT.MAX
  );
}

/**
 * Calculate PCI (Pressure-Acoustic Concordance Index)
 * 
 * @param {number} sigma_P - Pressure fluctuation (bar)
 * @param {number} dP_ac_dt - Acoustic power derivative
 * @param {Object} options - Optional configuration
 * @param {number} options.scalingFactor - Amplification factor (default: 1.0)
 * @param {boolean} options.applyWeighting - Use weighted formula (default: false)
 * @returns {Object} { pci, risk_level, components }
 */
export function calculatePCI(sigma_P, dP_ac_dt, options = {}) {
  const {
    scalingFactor = 1.0,
    applyWeighting = false
  } = options;
  
  // Handle null/undefined/NaN values
  if (!isFinite(sigma_P) || !isFinite(dP_ac_dt)) {
    return {
      pci: 0,
      risk_level: 'UNKNOWN',
      risk_percentage: 0,
      components: {
        sigma_P_normalized: 0,
        dP_ac_dt_normalized: 0
      }
    };
  }
  
  // Normalize components
  const sigma_P_norm = normalizeSigmaP(sigma_P);
  const dP_ac_dt_norm = normalizeDPacDt(dP_ac_dt);
  
  // Calculate PCI
  let pci;
  
  if (applyWeighting) {
    // Weighted formula: Give more importance to pressure (70%) vs acoustic (30%)
    // Research shows pressure fluctuation is more predictive
    pci = (0.7 * sigma_P_norm + 0.3 * dP_ac_dt_norm) * scalingFactor;
  } else {
    // Multiplicative formula: Both must be high for high PCI
    pci = sigma_P_norm * dP_ac_dt_norm * scalingFactor;
  }
  
  // Clamp PCI to [0, 1]
  pci = Math.max(0, Math.min(1, pci));
  
  // Determine risk level
  let risk_level;
  if (pci < PCI_THRESHOLDS.PCI.LOW) {
    risk_level = 'LOW';
  } else if (pci < PCI_THRESHOLDS.PCI.MEDIUM) {
    risk_level = 'MEDIUM';
  } else if (pci < PCI_THRESHOLDS.PCI.HIGH) {
    risk_level = 'HIGH';
  } else {
    risk_level = 'CRITICAL';
  }
  
  return {
    pci: pci,
    risk_level: risk_level,
    risk_percentage: Math.round(pci * 100),
    components: {
      sigma_P: sigma_P,
      sigma_P_normalized: sigma_P_norm,
      dP_ac_dt: dP_ac_dt,
      dP_ac_dt_normalized: dP_ac_dt_norm
    },
    thresholds: {
      sigma_P_warning: sigma_P > PCI_THRESHOLDS.SIGMA_P.WARNING,
      sigma_P_critical: sigma_P > PCI_THRESHOLDS.SIGMA_P.CRITICAL,
      dP_ac_dt_warning: Math.abs(dP_ac_dt) > PCI_THRESHOLDS.DP_AC_DT.WARNING,
      dP_ac_dt_critical: Math.abs(dP_ac_dt) > PCI_THRESHOLDS.DP_AC_DT.CRITICAL
    }
  };
}

/**
 * Calculate PCI from array of data points (time series)
 * 
 * @param {Array} dataPoints - Array of {sigma_P, dP_ac_dt, timestamp}
 * @param {Object} options - PCI calculation options
 * @returns {Array} Array of PCI values with timestamps
 */
export function calculatePCITimeSeries(dataPoints, options = {}) {
  return dataPoints.map(point => ({
    timestamp: point.timestamp,
    unix_timestamp: point.unix_timestamp,
    ...calculatePCI(point.sigma_P, point.dP_ac_dt, options)
  }));
}

/**
 * Calculate rolling PCI average (smoothed)
 * 
 * @param {Array} pciTimeSeries - Array from calculatePCITimeSeries
 * @param {number} windowSize - Number of points to average (default: 10)
 * @returns {Array} Smoothed PCI time series
 */
export function smoothPCI(pciTimeSeries, windowSize = 10) {
  return pciTimeSeries.map((point, idx, arr) => {
    const start = Math.max(0, idx - windowSize + 1);
    const window = arr.slice(start, idx + 1);
    const avgPCI = window.reduce((sum, p) => sum + p.pci, 0) / window.length;
    
    return {
      ...point,
      pci_smoothed: avgPCI,
      pci_original: point.pci
    };
  });
}

/**
 * Detect PCI trend (increasing = higher clog risk)
 * 
 * @param {Array} pciTimeSeries - Recent PCI values
 * @param {number} lookbackPoints - Points to analyze (default: 20)
 * @returns {Object} { trend, slope, is_increasing }
 */
export function detectPCITrend(pciTimeSeries, lookbackPoints = 20) {
  if (pciTimeSeries.length < 2) {
    return { trend: 'INSUFFICIENT_DATA', slope: 0, is_increasing: false };
  }
  
  const recent = pciTimeSeries.slice(-lookbackPoints);
  
  // Simple linear regression
  const n = recent.length;
  const x = Array.from({ length: n }, (_, i) => i);
  const y = recent.map(p => p.pci);
  
  const sum_x = x.reduce((a, b) => a + b, 0);
  const sum_y = y.reduce((a, b) => a + b, 0);
  const sum_xy = x.reduce((sum, xi, i) => sum + xi * y[i], 0);
  const sum_xx = x.reduce((sum, xi) => sum + xi * xi, 0);
  
  const slope = (n * sum_xy - sum_x * sum_y) / (n * sum_xx - sum_x * sum_x);
  
  let trend;
  if (slope > 0.01) {
    trend = 'INCREASING';
  } else if (slope < -0.01) {
    trend = 'DECREASING';
  } else {
    trend = 'STABLE';
  }
  
  return {
    trend: trend,
    slope: slope,
    is_increasing: slope > 0.01,
    is_critical: slope > 0.05 && recent[recent.length - 1].pci > 0.6
  };
}

/**
 * Get color for PCI value (for UI visualization)
 * 
 * @param {number} pci - PCI value [0, 1]
 * @returns {string} Color code
 */
export function getPCIColor(pci) {
  if (pci < PCI_THRESHOLDS.PCI.LOW) {
    return '#4CAF50'; // Green
  } else if (pci < PCI_THRESHOLDS.PCI.MEDIUM) {
    return '#FFC107'; // Yellow
  } else if (pci < PCI_THRESHOLDS.PCI.HIGH) {
    return '#FF9800'; // Orange
  } else {
    return '#F44336'; // Red
  }
}

/**
 * Export thresholds for UI configuration
 */
export { PCI_THRESHOLDS };
```

---

## ⚛️ React Component Structure

### 1. Main Dashboard Layout

#### File: `components/Dashboard/DashboardLayout.jsx`
```jsx
import React, { useState, useEffect } from 'react';
import { useWebSocket } from '../../hooks/useWebSocket';
import { useKPICalculations } from '../../hooks/useKPICalculations';
import ClogRiskOverview from './ClogRiskOverview';
import AlertPanel from './AlertPanel';
import ColdSpraySection from '../ColdSpray/ColdSpraySection';
import AnalogSensorSection from '../AnalogSensors/AnalogSensorSection';
import CompositeSection from '../Composite/CompositeSection';
import TimeWindowSelector from '../Common/TimeWindowSelector';

const DashboardLayout = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [timeWindow, setTimeWindow] = useState('30min');
  const [alerts, setAlerts] = useState([]);
  
  // WebSocket connection
  const { 
    coldSprayData, 
    analogData, 
    notifications, 
    maintenanceStatus,
    isConnected 
  } = useWebSocket('ws://localhost:8000/ws');
  
  // Real-time KPI calculations (includes PCI)
  const { 
    fusedData, 
    pciData, 
    currentRisk 
  } = useKPICalculations(coldSprayData, analogData);
  
  // Handle new notifications
  useEffect(() => {
    if (notifications.length > 0) {
      setAlerts(prev => [...notifications, ...prev].slice(0, 50)); // Keep last 50
    }
  }, [notifications]);
  
  return (
    <div className="dashboard-container">
      {/* Header */}
      <header className="dashboard-header">
        <h1>Cold Spray Clog Detection System</h1>
        <div className="connection-status">
          <span className={isConnected ? 'connected' : 'disconnected'}>
            {isConnected ? '● Connected' : '○ Disconnected'}
          </span>
        </div>
        <TimeWindowSelector 
          value={timeWindow} 
          onChange={setTimeWindow}
        />
      </header>
      
      {/* Top-Level Risk Overview */}
      <ClogRiskOverview 
        currentRisk={currentRisk}
        pciData={pciData}
        maintenanceStatus={maintenanceStatus}
      />
      
      {/* Main Content Area */}
      <div className="dashboard-content">
        <div className="main-area">
          {/* Tab Navigation */}
          <nav className="tab-navigation">
            <button 
              className={activeTab === 'overview' ? 'active' : ''}
              onClick={() => setActiveTab('overview')}
            >
              Overview
            </button>
            <button 
              className={activeTab === 'coldspray' ? 'active' : ''}
              onClick={() => setActiveTab('coldspray')}
            >
              Cold Spray KPIs
            </button>
            <button 
              className={activeTab === 'analog' ? 'active' : ''}
              onClick={() => setActiveTab('analog')}
            >
              Analog Sensors
            </button>
            <button 
              className={activeTab === 'composite' ? 'active' : ''}
              onClick={() => setActiveTab('composite')}
            >
              Composite Analysis
            </button>
          </nav>
          
          {/* Tab Content */}
          <div className="tab-content">
            {activeTab === 'overview' && (
              <CompositeSection 
                fusedData={fusedData}
                pciData={pciData}
                timeWindow={timeWindow}
              />
            )}
            
            {activeTab === 'coldspray' && (
              <ColdSpraySection 
                data={coldSprayData}
                timeWindow={timeWindow}
              />
            )}
            
            {activeTab === 'analog' && (
              <AnalogSensorSection 
                analog0={analogData.analog_0}
                analog1={analogData.analog_1}
                timeWindow={timeWindow}
              />
            )}
            
            {activeTab === 'composite' && (
              <CompositeSection 
                fusedData={fusedData}
                pciData={pciData}
                timeWindow={timeWindow}
                showAdvanced={true}
              />
            )}
          </div>
        </div>
        
        {/* Sidebar: Alerts */}
        <aside className="sidebar">
          <AlertPanel alerts={alerts} />
        </aside>
      </div>
    </div>
  );
};

export default DashboardLayout;
```

### 2. Clog Risk Overview Component

#### File: `components/Dashboard/ClogRiskOverview.jsx`
```jsx
import React from 'react';
import PCIGauge from '../Composite/PCIGauge';
import { getPCIColor } from '../../utils/pciCalculator';

const ClogRiskOverview = ({ currentRisk, pciData, maintenanceStatus }) => {
  if (!currentRisk) {
    return (
      <div className="risk-overview loading">
        <p>Waiting for data...</p>
      </div>
    );
  }
  
  const { pci, risk_level, risk_percentage, components, thresholds } = currentRisk;
  const riskColor = getPCIColor(pci);
  
  return (
    <div className="risk-overview" style={{ borderTopColor: riskColor }}>
      <div className="risk-header">
        <h2>Clog Risk Status</h2>
        <span className={`risk-badge ${risk_level.toLowerCase()}`}>
          {risk_level}
        </span>
      </div>
      
      <div className="risk-metrics">
        {/* PCI Gauge */}
        <div className="metric-card pci-card">
          <PCIGauge value={pci} percentage={risk_percentage} />
        </div>
        
        {/* Component Indicators */}
        <div className="metric-card">
          <h4>Pressure Stability</h4>
          <div className="metric-value">
            <span className="value">{components.sigma_P?.toFixed(2)}</span>
            <span className="unit">bar</span>
          </div>
          <div className="threshold-status">
            {thresholds.sigma_P_critical && (
              <span className="critical">⚠ Critical</span>
            )}
            {thresholds.sigma_P_warning && !thresholds.sigma_P_critical && (
              <span className="warning">⚡ Warning</span>
            )}
            {!thresholds.sigma_P_warning && (
              <span className="normal">✓ Normal</span>
            )}
          </div>
          <div className="normalized-bar">
            <div 
              className="fill" 
              style={{ 
                width: `${components.sigma_P_normalized * 100}%`,
                backgroundColor: thresholds.sigma_P_critical ? '#f44336' : 
                                thresholds.sigma_P_warning ? '#ff9800' : '#4caf50'
              }}
            />
          </div>
        </div>
        
        <div className="metric-card">
          <h4>Acoustic Anomaly</h4>
          <div className="metric-value">
            <span className="value">{Math.abs(components.dP_ac_dt)?.toFixed(2)}</span>
            <span className="unit">dB/s</span>
          </div>
          <div className="threshold-status">
            {thresholds.dP_ac_dt_critical && (
              <span className="critical">⚠ Critical</span>
            )}
            {thresholds.dP_ac_dt_warning && !thresholds.dP_ac_dt_critical && (
              <span className="warning">⚡ Warning</span>
            )}
            {!thresholds.dP_ac_dt_warning && (
              <span className="normal">✓ Normal</span>
            )}
          </div>
          <div className="normalized-bar">
            <div 
              className="fill" 
              style={{ 
                width: `${components.dP_ac_dt_normalized * 100}%`,
                backgroundColor: thresholds.dP_ac_dt_critical ? '#f44336' : 
                                thresholds.dP_ac_dt_warning ? '#ff9800' : '#4caf50'
              }}
            />
          </div>
        </div>
        
        {/* Maintenance Status */}
        <div className="metric-card maintenance-card">
          <h4>Maintenance</h4>
          <div className={`maintenance-status ${maintenanceStatus ? 'required' : 'ok'}`}>
            {maintenanceStatus ? (
              <>
                <span className="icon">🔧</span>
                <span className="text">Required</span>
              </>
            ) : (
              <>
                <span className="icon">✓</span>
                <span className="text">OK</span>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ClogRiskOverview;
```

### 3. Cold Spray Section (KPI Organized)

#### File: `components/ColdSpray/ColdSpraySection.jsx`
```jsx
import React from 'react';
import PressureKPI from './PressureKPI';
import FlowKPI from './FlowKPI';
import TemperatureKPI from './TemperatureKPI';
import PowderKPI from './PowderKPI';

const ColdSpraySection = ({ data, timeWindow }) => {
  return (
    <div className="coldspray-section">
      <h2>Cold Spray Machine KPIs</h2>
      
      <div className="kpi-grid">
        {/* Pressure KPIs: P_Gun + σ_P */}
        <div className="kpi-group">
          <PressureKPI data={data} timeWindow={timeWindow} />
        </div>
        
        {/* Flow KPIs: Q_PG_N2 + R_FP */}
        <div className="kpi-group">
          <FlowKPI data={data} timeWindow={timeWindow} />
        </div>
        
        {/* Temperature KPIs: T_Gun + U3_Input */}
        <div className="kpi-group">
          <TemperatureKPI data={data} timeWindow={timeWindow} />
        </div>
        
        {/* Powder KPIs: ṁ_pow + P_PF1 + Q_CG_PF1 */}
        <div className="kpi-group">
          <PowderKPI data={data} timeWindow={timeWindow} />
        </div>
      </div>
    </div>
  );
};

export default ColdSpraySection;
```

#### File: `components/ColdSpray/PressureKPI.jsx`
```jsx
import React from 'react';
import MultiAxisChart from '../Common/MultiAxisChart';
import KPICard from '../Common/KPICard';
import { filterByTimeWindow } from '../../utils/chartHelpers';

const PressureKPI = ({ data, timeWindow }) => {
  const filteredData = filterByTimeWindow(data, timeWindow);
  
  const chartData = {
    datasets: [
      {
        label: 'Gun Pressure (P_Gun)',
        data: filteredData.map(d => ({
          x: new Date(d.unix_timestamp * 1000),
          y: d.P_Gun
        })),
        borderColor: 'rgb(54, 162, 235)',
        backgroundColor: 'rgba(54, 162, 235, 0.1)',
        yAxisID: 'y1'
      },
      {
        label: 'Pressure Fluctuation (σ_P)',
        data: filteredData.map(d => ({
          x: new Date(d.unix_timestamp * 1000),
          y: d.sigma_P
        })),
        borderColor: 'rgb(255, 99, 132)',
        backgroundColor: 'rgba(255, 99, 132, 0.1)',
        yAxisID: 'y2'
      }
    ]
  };
  
  const chartOptions = {
    scales: {
      y1: {
        type: 'linear',
        position: 'left',
        title: { display: true, text: 'P_Gun (bar)' },
        min: 30,
        max: 50
      },
      y2: {
        type: 'linear',
        position: 'right',
        title: { display: true, text: 'σ_P (bar)' },
        min: 0,
        max: 5,
        grid: { drawOnChartArea: false }
      }
    },
    plugins: {
      annotation: {
        annotations: {
          p_gun_threshold: {
            type: 'line',
            yMin: 45,
            yMax: 45,
            yScaleID: 'y1',
            borderColor: 'red',
            borderWidth: 2,
            borderDash: [5, 5],
            label: {
              display: true,
              content: 'P_Gun Threshold',
              position: 'end'
            }
          },
          sigma_p_warning: {
            type: 'line',
            yMin: 3,
            yMax: 3,
            yScaleID: 'y2',
            borderColor: 'orange',
            borderWidth: 2,
            borderDash: [5, 5],
            label: {
              display: true,
              content: 'σ_P Warning',
              position: 'start'
            }
          }
        }
      }
    }
  };
  
  // Latest values for cards
  const latest = filteredData[filteredData.length - 1] || {};
  
  return (
    <div className="pressure-kpi">
      <h3>Pressure Monitoring</h3>
      
      <div className="kpi-cards">
        <KPICard
          title="Gun Pressure"
          value={latest.P_Gun}
          unit="bar"
          threshold={45}
          status={latest.P_Gun > 45 ? 'warning' : 'normal'}
        />
        <KPICard
          title="Pressure Fluctuation"
          value={latest.sigma_P}
          unit="bar"
          threshold={3}
          status={latest.sigma_P > 3 ? 'warning' : 'normal'}
        />
      </div>
      
      <div className="chart-container">
        <MultiAxisChart data={chartData} options={chartOptions} />
      </div>
    </div>
  );
};

export default PressureKPI;
```

### 4. Analog Sensor Section (KPI Organized)

#### File: `components/AnalogSensors/AnalogSensorSection.jsx`
```jsx
import React from 'react';
import VibrationKPI from './VibrationKPI';
import AcousticKPI from './AcousticKPI';
import FrequencyKPI from './FrequencyKPI';
import SpectralFeaturesGrid from './SpectralFeaturesGrid';

const AnalogSensorSection = ({ analog0, analog1, timeWindow }) => {
  return (
    <div className="analog-section">
      <h2>Analog Sensor Analysis</h2>
      
      <div className="sensor-labels">
        <span className="label analog-0">● Analog 0 (Ultrasonic)</span>
        <span className="label analog-1">● Analog 1 (Acoustic)</span>
      </div>
      
      <div className="kpi-grid">
        {/* Vibration KPI: RMS */}
        <div className="kpi-group full-width">
          <VibrationKPI 
            analog0={analog0} 
            analog1={analog1} 
            timeWindow={timeWindow} 
          />
        </div>
        
        {/* Acoustic KPI: Spectral Energy + Derivative */}
        <div className="kpi-group full-width">
          <AcousticKPI 
            analog0={analog0} 
            analog1={analog1} 
            timeWindow={timeWindow} 
          />
        </div>
        
        {/* Frequency KPI: Dominant Freq + Centroid */}
        <div className="kpi-group full-width">
          <FrequencyKPI 
            analog0={analog0} 
            analog1={analog1} 
            timeWindow={timeWindow} 
          />
        </div>
        
        {/* All Spectral Features Grid */}
        <div className="kpi-group full-width">
          <SpectralFeaturesGrid 
            analog0={analog0} 
            analog1={analog1} 
            timeWindow={timeWindow} 
          />
        </div>
      </div>
    </div>
  );
};

export default AnalogSensorSection;
```

#### File: `components/AnalogSensors/VibrationKPI.jsx`
```jsx
import React from 'react';
import MultiAxisChart from '../Common/MultiAxisChart';
import KPICard from '../Common/KPICard';
import { filterByTimeWindow } from '../../utils/chartHelpers';

const VibrationKPI = ({ analog0, analog1, timeWindow }) => {
  const filtered0 = filterByTimeWindow(analog0, timeWindow);
  const filtered1 = filterByTimeWindow(analog1, timeWindow);
  
  const chartData = {
    datasets: [
      {
        label: 'RMS - Ultrasonic (Analog 0)',
        data: filtered0.map(d => ({
          x: new Date(d.unix_timestamp * 1000),
          y: d.rms
        })),
        borderColor: 'rgb(153, 102, 255)',
        backgroundColor: 'rgba(153, 102, 255, 0.1)',
        tension: 0.4
      },
      {
        label: 'RMS - Acoustic (Analog 1)',
        data: filtered1.map(d => ({
          x: new Date(d.unix_timestamp * 1000),
          y: d.rms
        })),
        borderColor: 'rgb(255, 159, 64)',
        backgroundColor: 'rgba(255, 159, 64, 0.1)',
        tension: 0.4
      }
    ]
  };
  
  const chartOptions = {
    plugins: {
      title: {
        display: true,
        text: 'Vibration RMS Comparison (KPI #14)'
      },
      annotation: {
        annotations: {
          rms_threshold: {
            type: 'line',
            yMin: 100,
            yMax: 100,
            borderColor: 'red',
            borderWidth: 2,
            borderDash: [5, 5],
            label: {
              display: true,
              content: 'RMS Threshold',
              position: 'end'
            }
          }
        }
      }
    }
  };
  
  const latest0 = filtered0[filtered0.length - 1] || {};
  const latest1 = filtered1[filtered1.length - 1] || {};
  
  return (
    <div className="vibration-kpi">
      <h3>Vibration Monitoring (RMS)</h3>
      
      <div className="kpi-cards">
        <KPICard
          title="Ultrasonic RMS"
          value={latest0.rms}
          unit="a.u."
          threshold={100}
          status={latest0.rms > 100 ? 'warning' : 'normal'}
          color="#9966FF"
        />
        <KPICard
          title="Acoustic RMS"
          value={latest1.rms}
          unit="a.u."
          threshold={100}
          status={latest1.rms > 100 ? 'warning' : 'normal'}
          color="#FF9F40"
        />
      </div>
      
      <div className="chart-container">
        <MultiAxisChart data={chartData} options={chartOptions} />
      </div>
    </div>
  );
};

export default VibrationKPI;
```

### 5. Composite Section with PCI

#### File: `components/Composite/CompositeSection.jsx`
```jsx
import React from 'react';
import PCICalculator from './PCICalculator';
import CompositeKPIChart from './CompositeKPIChart';
import { calculatePCITimeSeries, detectPCITrend } from '../../utils/pciCalculator';

const CompositeSection = ({ fusedData, pciData, timeWindow, showAdvanced = false }) => {
  // Calculate PCI trend
  const trend = pciData ? detectPCITrend(pciData, 20) : null;
  
  return (
    <div className="composite-section">
      <h2>Multi-Sensor Composite Analysis</h2>
      
      {/* PCI Calculator & Display */}
      <div className="pci-analysis">
        <PCICalculator pciData={pciData} trend={trend} />
      </div>
      
      {/* Multi-KPI Overlay Chart */}
      <div className="composite-chart-container">
        <h3>Critical KPIs Overview</h3>
        <CompositeKPIChart 
          fusedData={fusedData} 
          timeWindow={timeWindow}
          includeKPIs={['sigma_P', 'P_Gun', 'R_FP', 'rms_analog0', 'pci']}
        />
      </div>
      
      {showAdvanced && (
        <div className="advanced-analysis">
          {/* Correlation matrix, scatter plots, etc. */}
        </div>
      )}
    </div>
  );
};

export default CompositeSection;
```

#### File: `components/Composite/PCIGauge.jsx`
```jsx
import React, { useEffect, useRef } from 'react';
import Chart from 'chart.js/auto';
import { getPCIColor } from '../../utils/pciCalculator';

const PCIGauge = ({ value, percentage }) => {
  const canvasRef = useRef(null);
  const chartRef = useRef(null);
  
  useEffect(() => {
    if (!canvasRef.current) return;
    
    const ctx = canvasRef.current.getContext('2d');
    
    // Destroy previous chart
    if (chartRef.current) {
      chartRef.current.destroy();
    }
    
    // Create gauge chart
    chartRef.current = new Chart(ctx, {
      type: 'doughnut',
      data: {
        datasets: [{
          data: [value * 100, (1 - value) * 100],
          backgroundColor: [
            getPCIColor(value),
            'rgba(200, 200, 200, 0.2)'
          ],
          borderWidth: 0,
          circumference: 180,
          rotation: 270
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: true,
        plugins: {
          legend: { display: false },
          tooltip: { enabled: false }
        }
      }
    });
    
    return () => {
      if (chartRef.current) {
        chartRef.current.destroy();
      }
    };
  }, [value]);
  
  return (
    <div className="pci-gauge">
      <div className="gauge-chart">
        <canvas ref={canvasRef}></canvas>
        <div className="gauge-value">
          <span className="percentage">{percentage}</span>
          <span className="unit">%</span>
        </div>
      </div>
      <div className="gauge-label">PCI Risk</div>
    </div>
  );
};

export default PCIGauge;
```

---

## 🔌 WebSocket Integration

#### File: `hooks/useWebSocket.js`
```javascript
import { useState, useEffect, useCallback, useRef } from 'react';

export const useWebSocket = (url) => {
  const [coldSprayData, setColdSprayData] = useState([]);
  const [analogData, setAnalogData] = useState({ analog_0: [], analog_1: [] });
  const [notifications, setNotifications] = useState([]);
  const [maintenanceStatus, setMaintenanceStatus] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  
  const ws = useRef(null);
  const reconnectTimeout = useRef(null);
  
  const connect = useCallback(() => {
    ws.current = new WebSocket(url);
    
    ws.current.onopen = () => {
      console.log('WebSocket connected');
      setIsConnected(true);
    };
    
    ws.current.onmessage = (event) => {
      const message = JSON.parse(event.data);
      
      // Handle different message types
      if (message.cold_spray) {
        // Combined sensor data
        setColdSprayData(prev => {
          const newData = [...prev, ...message.cold_spray];
          // Keep last 24 hours
          const dayAgo = Date.now() / 1000 - (24 * 60 * 60);
          return newData.filter(d => d.unix_timestamp >= dayAgo);
        });
        
        // Update analog data
        if (message.analog_0) {
          setAnalogData(prev => ({
            analog_0: [...prev.analog_0, ...message.analog_0].filter(d => d.unix_timestamp >= dayAgo),
            analog_1: prev.analog_1
          }));
        }
        
        if (message.analog_1) {
          setAnalogData(prev => ({
            analog_0: prev.analog_0,
            analog_1: [...prev.analog_1, ...message.analog_1].filter(d => d.unix_timestamp >= dayAgo)
          }));
        }
      }
      else if (message.notifications) {
        setNotifications(message.notifications);
      }
      else if (message.maintenance_required !== undefined) {
        setMaintenanceStatus(message.maintenance_required);
      }
      else if (message.type === 'ping') {
        ws.current.send(JSON.stringify({ type: 'pong' }));
      }
    };
    
    ws.current.onerror = (error) => {
      console.error('WebSocket error:', error);
    };
    
    ws.current.onclose = () => {
      console.log('WebSocket disconnected');
      setIsConnected(false);
      
      // Attempt reconnection after 3 seconds
      reconnectTimeout.current = setTimeout(() => {
        console.log('Attempting to reconnect...');
        connect();
      }, 3000);
    };
  }, [url]);
  
  useEffect(() => {
    connect();
    
    return () => {
      if (ws.current) {
        ws.current.close();
      }
      if (reconnectTimeout.current) {
        clearTimeout(reconnectTimeout.current);
      }
    };
  }, [connect]);
  
  return {
    coldSprayData,
    analogData,
    notifications,
    maintenanceStatus,
    isConnected
  };
};
```

#### File: `hooks/useKPICalculations.js`
```javascript
import { useState, useEffect } from 'react';
import { calculatePCI, calculatePCITimeSeries } from '../utils/pciCalculator';
import { fuseMultiSensorData } from '../utils/dataFusion';

export const useKPICalculations = (coldSprayData, analogData) => {
  const [fusedData, setFusedData] = useState([]);
  const [pciData, setPciData] = useState([]);
  const [currentRisk, setCurrentRisk] = useState(null);
  
  useEffect(() => {
    if (!coldSprayData.length || !analogData.analog_0.length) return;
    
    // Fuse cold spray and analog data by timestamp
    const fused = fuseMultiSensorData(coldSprayData, analogData.analog_0, analogData.analog_1);
    setFusedData(fused);
    
    // Calculate PCI for all data points
    const pciTimeSeries = calculatePCITimeSeries(
      fused.map(d => ({
        sigma_P: d.sigma_P,
        dP_ac_dt: d.acoustic_power_derivative || 0,
        timestamp: d.unix_timestamp,
        unix_timestamp: d.unix_timestamp
      }))
    );
    setPciData(pciTimeSeries);
    
    // Get current risk (latest point)
    if (pciTimeSeries.length > 0) {
      setCurrentRisk(pciTimeSeries[pciTimeSeries.length - 1]);
    }
  }, [coldSprayData, analogData]);
  
  return {
    fusedData,
    pciData,
    currentRisk
  };
};
```

---

## 📊 Chart.js Implementation with Zoom

#### File: `components/Common/MultiAxisChart.jsx`
```jsx
import React, { useEffect, useRef } from 'react';
import Chart from 'chart.js/auto';
import 'chartjs-adapter-date-fns';
import zoomPlugin from 'chartjs-plugin-zoom';
import annotationPlugin from 'chartjs-plugin-annotation';

Chart.register(zoomPlugin, annotationPlugin);

const MultiAxisChart = ({ data, options = {}, height = 400 }) => {
  const canvasRef = useRef(null);
  const chartRef = useRef(null);
  
  useEffect(() => {
    if (!canvasRef.current) return;
    
    const ctx = canvasRef.current.getContext('2d');
    
    // Destroy previous chart
    if (chartRef.current) {
      chartRef.current.destroy();
    }
    
    // Default options
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
          time: {
            unit: 'minute',
            displayFormats: {
              minute: 'HH:mm',
              hour: 'HH:mm'
            }
          },
          title: {
            display: true,
            text: 'Time'
          },
          ticks: {
            maxRotation: 45,
            autoSkip: true,
            maxTicksLimit: 15
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
        zoom: {
          zoom: {
            wheel: {
              enabled: true
            },
            pinch: {
              enabled: true
            },
            mode: 'x'
          },
          pan: {
            enabled: true,
            mode: 'x'
          },
          limits: {
            x: { min: 'original', max: 'original' }
          }
        }
      }
    };
    
    // Merge options
    const mergedOptions = {
      ...defaultOptions,
      ...options,
      scales: { ...defaultOptions.scales, ...options.scales },
      plugins: { ...defaultOptions.plugins, ...options.plugins }
    };
    
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
  }, [data, options]);
  
  const resetZoom = () => {
    if (chartRef.current) {
      chartRef.current.resetZoom();
    }
  };
  
  return (
    <div className="chart-wrapper">
      <div className="chart-controls">
        <button onClick={resetZoom} className="btn-reset-zoom">
          Reset Zoom
        </button>
      </div>
      <div style={{ height: `${height}px`, position: 'relative' }}>
        <canvas ref={canvasRef}></canvas>
      </div>
    </div>
  );
};

export default MultiAxisChart;
```

---

## 🛠️ Utility Functions

#### File: `utils/dataFusion.js`
```javascript
/**
 * Fuse multi-sensor data by synchronizing timestamps
 * 
 * @param {Array} coldSprayData - Cold spray KPI data
 * @param {Array} analog0Data - Analog sensor 0 data
 * @param {Array} analog1Data - Analog sensor 1 data
 * @param {number} tolerance - Time synchronization tolerance in seconds
 * @returns {Array} Fused data array
 */
export function fuseMultiSensorData(coldSprayData, analog0Data, analog1Data, tolerance = 1) {
  return coldSprayData.map(cs => {
    // Find closest analog_0 data point
    const analog0 = findClosestTimestamp(analog0Data, cs.unix_timestamp, tolerance);
    
    // Find closest analog_1 data point
    const analog1 = findClosestTimestamp(analog1Data, cs.unix_timestamp, tolerance);
    
    return {
      unix_timestamp: cs.unix_timestamp,
      // Cold spray KPIs
      P_Gun: cs.P_Gun,
      sigma_P: cs.sigma_P || cs.σ_P, // Handle both naming conventions
      Q_PG_N2: cs.Q_PG_N2,
      R_FP: cs.R_FP,
      T_Gun: cs.T_Gun,
      U3_Input: cs.U3_Input,
      Q_WC: cs.Q_WC,
      T_WC: cs.T_WC,
      m_dot_pow: cs.m_dot_pow || cs.ṁ_pow,
      P_PF1: cs.P_PF1,
      Q_CG_PF1: cs.Q_CG_PF1,
      // Analog sensor 0 (ultrasonic)
      rms_analog0: analog0?.rms || 0,
      spectral_energy_analog0: analog0?.spectral_energy || 0,
      acoustic_power_derivative: analog0?.acoustic_power_derivative || 0,
      dominant_freq_analog0: analog0?.dominant_freq || 0,
      spectral_centroid_analog0: analog0?.spectral_centroid || 0,
      // Analog sensor 1 (acoustic)
      rms_analog1: analog1?.rms || 0,
      spectral_energy_analog1: analog1?.spectral_energy || 0,
      dominant_freq_analog1: analog1?.dominant_freq || 0,
      spectral_centroid_analog1: analog1?.spectral_centroid || 0
    };
  });
}

/**
 * Find closest data point by timestamp
 */
function findClosestTimestamp(dataArray, targetTimestamp, tolerance) {
  if (!dataArray || dataArray.length === 0) return null;
  
  let closest = null;
  let minDiff = Infinity;
  
  for (const item of dataArray) {
    const diff = Math.abs(item.unix_timestamp - targetTimestamp);
    if (diff < minDiff && diff <= tolerance) {
      minDiff = diff;
      closest = item;
    }
  }
  
  return closest;
}
```

#### File: `utils/chartHelpers.js`
```javascript
/**
 * Filter data by time window
 */
export function filterByTimeWindow(data, windowKey) {
  const TIME_WINDOWS = {
    '5min': 5 * 60,
    '30min': 30 * 60,
    '1hour': 60 * 60,
    '6hours': 6 * 60 * 60,
    '24hours': 24 * 60 * 60,
    'all': null
  };
  
  const windowSeconds = TIME_WINDOWS[windowKey];
  if (!windowSeconds || !data.length) return data;
  
  const now = Math.floor(Date.now() / 1000);
  const cutoff = now - windowSeconds;
  
  return data.filter(d => d.unix_timestamp >= cutoff);
}

/**
 * Decimate data for performance (downsample)
 */
export function decimateData(dataArray, maxPoints = 500) {
  if (dataArray.length <= maxPoints) return dataArray;
  
  const step = Math.ceil(dataArray.length / maxPoints);
  return dataArray.filter((_, idx) => idx % step === 0);
}
```

---

## 📝 Summary of KPIs by Sensor

### Cold Spray Machine KPIs (13 total)
| KPI # | Name | Description | Threshold |
|-------|------|-------------|-----------|
| 1 | P_Gun | Gun pressure | > 45 bar (warning) |
| 2 | σ_P | Pressure fluctuation | > 3 bar (warning) |
| 3 | Q_PG_N2 | N2 gas flow rate | - |
| 4 | R_FP | Flow/pressure ratio | < 0.7 (warning) |
| 5 | U3_Input | Gas temperature at nozzle | - |
| 6 | T_Gun | Gun body temperature | > 800°C (warning) |
| 7a | Q_WC | Cooling water flow | - |
| 7b | T_WC | Cooling water temp | > 25°C (warning) |
| 8 | ṁ_pow | Powder feed rate | Detect oscillations |
| 9 | P_PF1 | Powder pot pressure | - |
| 18 | Q_CG_PF1 | Carrier gas flow | - |
| - | P_N2_Input | N2 input pressure | > 55 bar (warning) |
| - | P_Air_Input | Air input pressure | > 7 bar (warning) |

### Analog Sensor KPIs (11 features × 2 sensors)
| Feature | Description | Threshold |
|---------|-------------|-----------|
| rms | Vibration RMS amplitude (KPI #14) | > 100 (warning) |
| spectral_energy | Acoustic power (KPI #12) | Monitor trends |
| acoustic_power_derivative | dP_ac/dt (KPI #13) | > 20 (warning) |
| kurtosis | Signal impulsiveness | > 5 (spikes detected) |
| peak_to_peak | Amplitude range | - |
| dominant_freq | Main frequency component | Monitor shifts |
| spectral_centroid | Frequency center of mass | - |
| high_band_ratio | Ultrasonic band energy | > 0.4 (turbulence) |

### Composite KPIs
| KPI # | Name | Formula | Threshold |
|-------|------|---------|-----------|
| 15 | PCI | σ_P × \|dP_ac/dt\| (normalized) | > 0.6 (warning), > 0.8 (critical) |

---

## 🎨 CSS Styling Recommendations

```css
/* Risk Level Colors */
.risk-badge.low { background: #4CAF50; }
.risk-badge.medium { background: #FFC107; }
.risk-badge.high { background: #FF9800; }
.risk-badge.critical { background: #F44336; }

/* Sensor Colors */
.analog-0 { color: #9966FF; } /* Purple - Ultrasonic */
.analog-1 { color: #FF9F40; } /* Orange - Acoustic */

/* Layout */
.dashboard-content {
  display: grid;
  grid-template-columns: 1fr 300px;
  gap: 20px;
}

.kpi-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
  gap: 20px;
}

.kpi-group.full-width {
  grid-column: 1 / -1;
}
```

---

## ✅ Implementation Checklist

- [ ] Install dependencies: `chart.js`, `chartjs-plugin-zoom`, `chartjs-plugin-annotation`
- [ ] Implement PCI calculator (`utils/pciCalculator.js`)
- [ ] Create WebSocket hook (`hooks/useWebSocket.js`)
- [ ] Build main dashboard layout (`DashboardLayout.jsx`)
- [ ] Implement Cold Spray KPI components (4 groups)
- [ ] Implement Analog Sensor KPI components (4 components)
- [ ] Create PCI gauge and composite section
- [ ] Add time window selector
- [ ] Test data fusion and synchronization
- [ ] Optimize chart performance with decimation
- [ ] Add threshold annotations to charts
- [ ] Implement alert panel with notifications
- [ ] Test with real WebSocket data
- [ ] Deploy and monitor performance

---

**End of Implementation Guide**