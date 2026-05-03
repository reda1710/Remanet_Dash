# Frontend Integration Guide - RemaNet Dashboard Updates

## 🎯 Overview
The backend has been updated with new data structures and additional sensors. This guide will help you adapt the frontend dashboard and add new visualizations.

---

## 📡 WebSocket Data Structure Changes

### Connection
```javascript
const ws = new WebSocket('ws://localhost:8000/ws');
```

### Data Messages Received (3 separate JSON messages)

#### **Message 1: Combined Sensor Data**
```javascript
{
  "cold_spray": [
    {
      "Time": 1737800000,  // Unix timestamp (integer)
      "Clog_Label": 0,     // 0 or 1 (for training, don't display)
      // 13 KPI columns
      "P_Gun": 45.2,
      "σ_P": 2.1,
      "Q_PG_N2": 44.8,
      "R_FP": 0.85,
      "U3_Input": 215.5,
      "T_Gun": 47.3,
      "Q_WC": 9.8,
      "T_WC": 20.5,
      "ṁ_pow": 29.5,
      "P_PF1": 39.8,
      "Q_CG_PF1": 44.5,
      "P_N2_Input": 48.7,
      "P_Air_Input": 6.2
    }
    // ... more data points
  ],
  
  "micro_0": [...],  // Microphone 0 waveform data
  "micro_1": [...],  // Microphone 1 waveform data
  
  "analog_0": [      // NEW: Ultrasonic sensor (51.2 kHz)
    {
      "Time": 1737800000,
      "sensor_type": "analog_0",
      "clog_label": 0,  // Don't display, for training only
      // 11 feature columns
      "rms": 32.5,
      "spectral_energy": 215.8,
      "acoustic_power_derivative": 0.15,
      "kurtosis": 3.2,
      "peak_to_peak": 58.3,
      "dominant_freq": 1050.2,
      "spectral_centroid": 2100.5,
      "high_band_ratio": 0.32,
      "zero_crossing_rate": 0.16,
      "energy_entropy": 2.4
    }
    // ... more data points
  ],
  
  "analog_1": [      // NEW: Acoustic sensor (51.2 kHz)
    {
      "Time": 1737800000,
      "sensor_type": "analog_1",
      "clog_label": 0,
      // Same 11 features as analog_0
      "rms": 38.1,
      "spectral_energy": 245.2,
      // ... rest of features
    }
  ]
}
```

#### **Message 2: Notifications**
```javascript
{
  "notifications": [
    {
      "type": "warning",
      "parameter": "P_Gun",
      "value": 48.5,
      "threshold": 45,
      "timestamp": 1737800000,
      "message": "P_Gun exceeded maximum threshold: 48.5 > 45"
    },
    {
      "type": "warning",
      "parameter": "rms",
      "value": 105.2,
      "threshold": 100,
      "timestamp": 1737800000,
      "sensor_type": "analog_0",
      "message": "RMS exceeded threshold for analog_0: 105.2 > 100"
    }
    // Notifications from all sources combined
  ]
}
```

#### **Message 3: Maintenance Status**
```javascript
{
  "maintenance_required": false  // AI model prediction
}
```

---

## 🔄 Key Changes from Previous Version

### Cold Spray Data
**REMOVED Columns:**
- `V_Particule`
- `Ultrasonic_Vibration`
- `Water_Temp`
- `Water_Flow_Rate`
- `Q_CG_PF2`

**NEW Columns (13 KPIs total):**
- `P_Gun` (kept)
- `σ_P` (NEW - pressure standard deviation)
- `Q_PG_N2` (kept)
- `R_FP` (NEW - feed rate ratio)
- `U3_Input` (NEW - input voltage)
- `T_Gun` (kept)
- `Q_WC` (NEW - water cooling flow rate, replaces Water_Flow_Rate)
- `T_WC` (NEW - water cooling temperature, replaces Water_Temp)
- `ṁ_pow` (NEW - powder mass flow rate)
- `P_PF1` (NEW - powder feeder 1 pressure)
- `Q_CG_PF1` (kept)
- `P_N2_Input` (NEW - N2 input pressure)
- `P_Air_Input` (NEW - air input pressure)

**Time Format:**
- Changed from DateTime object to Unix timestamp (integer)
- Convert: `new Date(timestamp * 1000)` in JavaScript

### NEW Data Sources
- `analog_0`: Ultrasonic sensor with 11 acoustic features
- `analog_1`: Acoustic sensor with 11 acoustic features

---

## 📊 Proposed Dashboard Visualizations

### **1. Cold Spray Monitoring Section**

#### A. Multi-KPI Time Series Chart (Main Plot)
```javascript
// Line chart with 13 traces (one per KPI)
// X-axis: Time
// Y-axis: Multi-scale (normalized or separate y-axes)
// User can toggle KPIs on/off
Lines: [
  "P_Gun", "σ_P", "Q_PG_N2", "R_FP", "U3_Input", 
  "T_Gun", "Q_WC", "T_WC", "ṁ_pow", "P_PF1", 
  "Q_CG_PF1", "P_N2_Input", "P_Air_Input"
]
```

#### B. Critical Parameters Dashboard (Cards)
```javascript
// Display current values with threshold indicators
Cards: [
  { name: "Gun Pressure", value: data.P_Gun, unit: "bar", threshold: 45 },
  { name: "Gun Temperature", value: data.T_Gun, unit: "°C", threshold: 50 },
  { name: "N2 Flow Rate", value: data.Q_PG_N2, unit: "L/min", threshold: 48 },
  { name: "Powder Flow", value: data.ṁ_pow, unit: "g/min" }
]
```

#### C. Correlation Heatmap
```javascript
// Show correlations between all 13 KPIs
// Helps identify parameter dependencies
// Use color scale: -1 (red) to +1 (green)
```

#### D. Process Stability Indicator (Gauge)
```javascript
// Based on σ_P (pressure standard deviation)
// Low σ_P = stable process (green)
// High σ_P = unstable (red)
Ranges: {
  green: 0-1.5,
  yellow: 1.5-3,
  red: > 3
}
```

---

### **2. Analog Sensors Section (NEW)**

#### A. Dual Sensor Comparison - RMS Energy
```javascript
// Side-by-side or overlay line charts
// Compare analog_0 (ultrasonic) vs analog_1 (acoustic)
Chart: {
  type: "line",
  traces: [
    { name: "Ultrasonic RMS", data: analog_0.rms, color: "blue" },
    { name: "Acoustic RMS", data: analog_1.rms, color: "orange" }
  ],
  xAxis: "Time",
  yAxis: "RMS Amplitude"
}
```

#### B. Frequency Domain Analysis
```javascript
// Display dominant frequency over time
Chart: {
  type: "scatter",
  mode: "markers",
  traces: [
    { name: "Ultrasonic Freq", data: analog_0.dominant_freq },
    { name: "Acoustic Freq", data: analog_1.dominant_freq }
  ],
  yAxis: "Frequency (Hz)"
}
```

#### C. Spectral Features Grid (4x1 Mini Charts)
```javascript
// Small multiples showing key spectral features
Features: [
  { name: "Spectral Energy", field: "spectral_energy" },
  { name: "Spectral Centroid", field: "spectral_centroid" },
  { name: "High Band Ratio", field: "high_band_ratio" },
  { name: "Energy Entropy", field: "energy_entropy" }
]
// Each as a sparkline or mini area chart
```

#### D. Signal Quality Indicators (Cards)
```javascript
Cards: [
  { 
    name: "Kurtosis (Ultrasonic)", 
    value: analog_0.kurtosis, 
    info: "Signal peakedness (3 = normal)"
  },
  { 
    name: "Zero Crossing Rate", 
    value: analog_0.zero_crossing_rate,
    info: "Signal frequency content indicator"
  },
  { 
    name: "Peak-to-Peak", 
    value: analog_0.peak_to_peak,
    info: "Signal amplitude range"
  }
]
```

#### E. Acoustic Power Trend
```javascript
// Line chart showing acoustic power derivative
// Helps detect sudden changes in process acoustics
Chart: {
  type: "line",
  data: analog_0.acoustic_power_derivative,
  annotations: "Mark regions where derivative spikes",
  yAxis: "Power Derivative (dB/s)"
}
```

---

### **3. Integrated Analysis Section**

#### A. Multi-Sensor Status Board
```javascript
// Grid layout showing health of all sensors
Grid: [
  { sensor: "Cold Spray", status: "normal", lastUpdate: timestamp },
  { sensor: "Microphone 0", status: "normal", lastUpdate: timestamp },
  { sensor: "Microphone 1", status: "normal", lastUpdate: timestamp },
  { sensor: "Ultrasonic", status: "warning", lastUpdate: timestamp },
  { sensor: "Acoustic", status: "normal", lastUpdate: timestamp }
]
```

#### B. Correlation Explorer (Advanced)
```javascript
// Interactive scatter plot
// X-axis: Select any KPI from cold_spray
// Y-axis: Select any feature from analog sensors
// Color: Time gradient
// Helps discover process-acoustic relationships
```

#### C. Anomaly Timeline
```javascript
// Timeline showing all threshold exceedances
// Color-coded by sensor type and severity
Timeline: {
  events: notifications,
  groupBy: "sensor_type",
  colorScale: { cold_spray: "red", analog_0: "blue", analog_1: "orange" }
}
```

---

## 🛠️ Implementation Tasks

### Task 1: Update Data Parsing
```javascript
// Update WebSocket message handler
ws.onmessage = (event) => {
  const message = JSON.parse(event.data);
  
  // Check message type
  if (message.cold_spray) {
    // Combined sensor data
    updateColdSprayCharts(message.cold_spray);
    updateMicrophoneCharts(message.micro_0, message.micro_1);
    updateAnalogCharts(message.analog_0, message.analog_1);  // NEW
  }
  else if (message.notifications) {
    updateNotificationPanel(message.notifications);
  }
  else if (message.maintenance_required !== undefined) {
    updateMaintenanceStatus(message.maintenance_required);
  }
  else if (message.type === "ping") {
    ws.send(JSON.stringify({ type: "pong" }));
  }
};
```

### Task 2: Remove Obsolete Cold Spray Fields
```javascript
// Remove these from charts/displays:
const REMOVED_FIELDS = [
  'V_Particule', 
  'Ultrasonic_Vibration', 
  'Water_Temp', 
  'Water_Flow_Rate', 
  'Q_CG_PF2'
];
```

### Task 3: Add New Cold Spray Fields
```javascript
const NEW_COLDSPRAY_FIELDS = {
  'σ_P': { label: 'Pressure StdDev', unit: 'bar', threshold: null },
  'R_FP': { label: 'Feed Rate Ratio', unit: '', threshold: null },
  'U3_Input': { label: 'Input Voltage', unit: 'V', threshold: 240 },
  'Q_WC': { label: 'Water Cooling Flow', unit: 'L/min', threshold: null },
  'T_WC': { label: 'Water Cooling Temp', unit: '°C', threshold: 25 },
  'ṁ_pow': { label: 'Powder Mass Flow', unit: 'g/min', threshold: null },
  'P_PF1': { label: 'Feeder 1 Pressure', unit: 'bar', threshold: null },
  'P_N2_Input': { label: 'N2 Input Pressure', unit: 'bar', threshold: 55 },
  'P_Air_Input': { label: 'Air Input Pressure', unit: 'bar', threshold: 7 }
};
```

### Task 4: Create Analog Sensor Components
```javascript
// New React components or dashboard sections
<AnalogSensorDashboard>
  <RMSComparisonChart data={analogData} />
  <FrequencyAnalysisChart data={analogData} />
  <SpectralFeaturesGrid data={analogData} />
  <SignalQualityCards data={analogData} />
</AnalogSensorDashboard>
```

### Task 5: Update Notification Handling
```javascript
// Notifications now include sensor_type field for analog sensors
function displayNotification(notification) {
  const icon = getIconForSensorType(notification.sensor_type || 'cold_spray');
  const color = notification.type === 'warning' ? 'red' : 'yellow';
  
  return {
    icon,
    color,
    title: notification.parameter,
    message: notification.message,
    timestamp: new Date(notification.timestamp * 1000)
  };
}
```

### Task 6: Handle Date Filtering
```javascript
// Send filter to backend
function applyDateFilter(date) {
  const formattedDate = date.toLocaleDateString('en-US'); // "MM/DD/YYYY"
  ws.send(JSON.stringify({ filter_date: formattedDate }));
}

// Reset to real-time
function clearFilter() {
  ws.send(JSON.stringify({ filter_date: null }));
}
```

---

## 🎨 UI/UX Recommendations

### Layout Structure
```
┌─────────────────────────────────────────────┐
│ Header: System Status | Active Alerts: 2    │
├─────────────────────────────────────────────┤
│ [Cold Spray]  [Analog]  [Microphone]  Tabs  │
├─────────────────────────────────────────────┤
│                                             │
│  Main Time Series Chart (full width)       │
│  - 13 KPIs for Cold Spray OR               │
│  - 11 Features for Analog Sensors          │
│                                             │
├──────────────┬──────────────────────────────┤
│ KPI Cards    │  Notifications Panel         │
│ (4x2 grid)   │  - Real-time alerts          │
│              │  - Scroll for history        │
├──────────────┴──────────────────────────────┤
│ Correlation Heatmap | Process Stability     │
└─────────────────────────────────────────────┘
```

### Color Scheme for Sensors
- **Cold Spray**: Blue tones (#1E88E5)
- **Analog 0 (Ultrasonic)**: Purple tones (#7E57C2)
- **Analog 1 (Acoustic)**: Orange tones (#FF7043)
- **Microphones**: Green tones (#66BB6A)

### Interactive Features
1. **Toggle KPIs**: Click legend items to show/hide traces
2. **Zoom & Pan**: Enable on all time series charts
3. **Hover Tooltips**: Show exact values + units
4. **Export Data**: Button to download current view as CSV
5. **Threshold Lines**: Dashed horizontal lines on charts
6. **Time Range Selector**: Last 1hr / 6hr / 24hr / Custom

---

## 📝 Data Processing Tips

### Convert Unix Timestamps
```javascript
// Backend sends integer timestamps
const timestamp = 1737800000;
const date = new Date(timestamp * 1000);  // Multiply by 1000!
```

### Handle Missing Data
```javascript
// Some fields may be null/undefined
const safeValue = data?.P_Gun ?? 0;
```

### Normalize Multi-Scale Data
```javascript
// KPIs have different ranges, normalize for overlay visualization
function normalize(value, min, max) {
  return (value - min) / (max - min);
}
```

### Calculate Statistics
```javascript
// For rolling averages, std dev, etc.
const rollingAvg = (data, windowSize = 10) => {
  return data.map((val, idx, arr) => {
    const start = Math.max(0, idx - windowSize + 1);
    const window = arr.slice(start, idx + 1);
    return window.reduce((a, b) => a + b, 0) / window.length;
  });
};
```

---

## 🧪 Testing Checklist

- [ ] WebSocket connects successfully
- [ ] All 5 data sources render (cold_spray, micro_0, micro_1, analog_0, analog_1)
- [ ] Notifications display with correct sensor types
- [ ] Date filter works (send MM/DD/YYYY format)
- [ ] Real-time updates work (data refreshes automatically)
- [ ] Threshold lines show on charts
- [ ] Maintenance status updates correctly
- [ ] Old fields (V_Particule, etc.) removed from UI
- [ ] New KPIs (σ_P, R_FP, etc.) display correctly
- [ ] Analog sensor charts render 11 features
- [ ] Handle disconnections gracefully

---

## 📚 Additional Resources

### Backend Endpoints
- WebSocket: `ws://localhost:8000/ws`
- REST API: `GET http://localhost:8000/data/?filter_date=01/25/2026`
- Health Check: `GET http://localhost:8000/health`

### Data Sampling Rates
- Cold Spray: 1 Hz (1 sample/second)
- Microphones: 51.2 kHz (waveform)
- Analog Sensors: 0.2 second windows (5 Hz)

### Configuration
All thresholds are configurable in backend `config.py` - coordinate with backend team for threshold values.

---

## 🚀 Next Steps

1. Review this document with your frontend team
2. Update TypeScript interfaces / data models
3. Implement new analog sensor visualizations
4. Remove obsolete cold spray field references
5. Test with real data from backend
6. Optimize rendering performance for high-frequency data
7. Add user preferences (save chart configurations)
8. Implement data export functionality

---

**Questions or issues?** Contact the backend team or check the server logs at `Server/` directory.
