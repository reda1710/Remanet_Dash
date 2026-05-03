# Backend Historical Data Storage - Missing Fields Specification

## 📋 Overview
The frontend dashboard requires additional fields in the historical data API to display all KPIs in historical mode. Currently, only 10 fields are stored, but the real-time system provides 13+ fields.

---

## 🔴 Current State (Historical Data)

**API Endpoint:** `GET /data/?filter_date=MM/DD/YYYY`

**Response Format:**
```json
{
  "data": [
    {
      "Time": "2025-09-15T12:25:14",
      "P_Gun": 0.06076389,
      "P_PF1": 0.08680555,
      "T_Gun": 22.8,
      "T_WC": 20.17651,
      "Q_CG_PF1": 0,
      "Q_PG_N2": 0,
      "Q_WC": 26.08681,
      "R_FP": 0,
      "U3_Input": 0
    }
  ],
  "notifications": []
}
```

**Current Fields (10 total):**
- ✅ `Time` - Timestamp (ISO format)
- ✅ `P_Gun` - Gun pressure (bar)
- ✅ `P_PF1` - Powder feeder pressure (bar)
- ✅ `T_Gun` - Gun temperature (°C)
- ✅ `T_WC` - Water cooling temperature (°C)
- ✅ `Q_CG_PF1` - Carrier gas flow rate (L/min)
- ✅ `Q_PG_N2` - Propellant gas N2 flow (L/min)
- ✅ `Q_WC` - Water cooling flow (L/min)
- ✅ `R_FP` - Powder mass flow rate (g/min)
- ✅ `U3_Input` - Input parameter

---

## 🟢 Required State (Match Real-Time)

**Real-Time WebSocket provides these additional fields:**

### Critical Missing Fields (Calculations)
1. **`σ_P`** - Pressure fluctuation / standard deviation (bar)
   - **Type:** `float`
   - **Calculation:** Standard deviation of P_Gun over a rolling window
   - **Purpose:** Primary clog detection indicator
   - **Dashboard Use:** Pressure Fluctuation KPI card, PCI calculation

2. **`dP_ac/dt`** - Acoustic pressure derivative (Pa/s)
   - **Type:** `float`
   - **Calculation:** Rate of change of acoustic pressure
   - **Purpose:** Acoustic anomaly detection
   - **Dashboard Use:** PCI calculation, acoustic monitoring

### Missing Sensor Readings
3. **`P_N2_Input`** - N2 input pressure (bar)
   - **Type:** `float`
   - **Source:** Sensor reading
   - **Dashboard Use:** N₂ Input Pressure KPI card

4. **`P_Air_Input`** - Air input pressure (bar)
   - **Type:** `float`
   - **Source:** Sensor reading
   - **Dashboard Use:** Air Input Pressure KPI card

### Missing Analog Sensor Data
5. **`analog_0`** - Ultrasonic sensor data (array)
   - **Type:** `array` of objects
   - **Format:** 
     ```json
     [
       {
         "unix_timestamp": 1726406714.5,
         "value": 123.45,
         "sensor_id": "ultrasonic_0"
       }
     ]
     ```
   - **Dashboard Use:** Acoustic monitoring charts

6. **`analog_1`** - Acoustic sensor data (array)
   - **Type:** `array` of objects
   - **Format:** Same as analog_0
   - **Dashboard Use:** Acoustic monitoring charts

---

## 📊 Recommended Database Schema Updates

### Option 1: Add Fields to Existing Collection
Update the historical data collection to store all fields:

```python
# Historical data document structure
{
    "Time": datetime,
    "P_Gun": float,
    "P_PF1": float,
    "T_Gun": float,
    "T_WC": float,
    "Q_CG_PF1": float,
    "Q_PG_N2": float,
    "Q_WC": float,
    "R_FP": float,
    "U3_Input": float,
    # NEW FIELDS TO ADD:
    "σ_P": float,              # Pressure fluctuation
    "dP_ac_dt": float,         # Acoustic derivative
    "P_N2_Input": float,       # N2 input pressure
    "P_Air_Input": float,      # Air input pressure
}
```

### Option 2: Separate Analog Data Storage
Store analog sensor data in separate collections:

```python
# analog_0_historical collection
{
    "date": "2025-09-15",
    "data": [
        {
            "unix_timestamp": 1726406714.5,
            "value": 123.45,
            "sensor_id": "ultrasonic_0"
        }
    ]
}

# analog_1_historical collection
{
    "date": "2025-09-15",
    "data": [
        {
            "unix_timestamp": 1726406714.5,
            "value": 234.56,
            "sensor_id": "acoustic_1"
        }
    ]
}
```

---

## 🔧 Backend Implementation Requirements

### 1. Data Collection Updates
When storing real-time data to historical database:
```python
def store_historical_data(realtime_data):
    """
    Store all fields from real-time stream to historical database
    """
    historical_record = {
        "Time": realtime_data["Time"],
        "P_Gun": realtime_data["P_Gun"],
        "P_PF1": realtime_data["P_PF1"],
        "T_Gun": realtime_data["T_Gun"],
        "T_WC": realtime_data["T_WC"],
        "Q_CG_PF1": realtime_data["Q_CG_PF1"],
        "Q_PG_N2": realtime_data["Q_PG_N2"],
        "Q_WC": realtime_data["Q_WC"],
        "R_FP": realtime_data["R_FP"],
        "U3_Input": realtime_data["U3_Input"],
        # ADD THESE:
        "σ_P": realtime_data.get("σ_P"),
        "dP_ac_dt": realtime_data.get("dP_ac_dt"),
        "P_N2_Input": realtime_data.get("P_N2_Input"),
        "P_Air_Input": realtime_data.get("P_Air_Input"),
    }
    
    # Store in database
    historical_collection.insert_one(historical_record)
    
    # Store analog data separately if available
    if "analog_0" in realtime_data:
        analog_0_collection.insert_many(realtime_data["analog_0"])
    if "analog_1" in realtime_data:
        analog_1_collection.insert_many(realtime_data["analog_1"])
```

### 2. API Response Updates
Update `/data/?filter_date=MM/DD/YYYY` endpoint:

**Before:**
```json
{
  "data": [...],
  "notifications": [...]
}
```

**After:**
```json
{
  "data": [...],              // Array with ALL 14+ fields
  "analog_0": [...],          // Array of analog sensor 0 data
  "analog_1": [...],          // Array of analog sensor 1 data
  "notifications": [...]
}
```

### 3. Calculation Requirements
If `σ_P` and `dP_ac_dt` are not already calculated in real-time:

**Pressure Fluctuation (σ_P):**
```python
import numpy as np

def calculate_sigma_P(pressure_values, window_size=10):
    """
    Calculate rolling standard deviation of pressure
    """
    return np.std(pressure_values[-window_size:])
```

**Acoustic Derivative (dP_ac/dt):**
```python
def calculate_dP_ac_dt(acoustic_data):
    """
    Calculate rate of change of acoustic pressure
    """
    if len(acoustic_data) < 2:
        return 0
    
    p2, t2 = acoustic_data[-1]["value"], acoustic_data[-1]["unix_timestamp"]
    p1, t1 = acoustic_data[-2]["value"], acoustic_data[-2]["unix_timestamp"]
    
    dt = t2 - t1
    if dt == 0:
        return 0
    
    return (p2 - p1) / dt
```

---

## 🎯 Priority Levels

### High Priority (Required for Clog Detection)
1. ✅ `σ_P` - Pressure fluctuation (critical for PCI calculation)
2. ✅ `dP_ac_dt` - Acoustic derivative (critical for PCI calculation)

### Medium Priority (Improve Dashboard Completeness)
3. ✅ `P_N2_Input` - N2 input pressure
4. ✅ `P_Air_Input` - Air input pressure

### Low Priority (Nice to Have)
5. ✅ `analog_0` - Ultrasonic sensor historical data
6. ✅ `analog_1` - Acoustic sensor historical data

---

## 🧪 Testing Checklist

After implementation, verify:

- [ ] Historical API returns all 14+ fields
- [ ] `σ_P` values match real-time calculations
- [ ] `dP_ac_dt` values are reasonable (not NaN/Infinity)
- [ ] `P_N2_Input` and `P_Air_Input` have valid readings
- [ ] `analog_0` and `analog_1` arrays are present (can be empty if not stored)
- [ ] Response format matches real-time WebSocket structure
- [ ] No null/undefined values for existing data
- [ ] Performance: Query returns data within 2 seconds for 5000+ records

---

## 📞 Questions or Clarifications

Contact frontend team if you need:
- Field name clarifications
- Real-time data structure examples
- WebSocket message samples
- Calculation algorithm details

---

## 📝 Example Complete Response (Target)

```json
{
  "data": [
    {
      "Time": "2025-09-15T12:25:14",
      "P_Gun": 0.06076389,
      "P_PF1": 0.08680555,
      "T_Gun": 22.8,
      "T_WC": 20.17651,
      "Q_CG_PF1": 0,
      "Q_PG_N2": 0,
      "Q_WC": 26.08681,
      "R_FP": 0,
      "U3_Input": 0,
      "σ_P": 0.00234,
      "dP_ac_dt": 12.5,
      "P_N2_Input": 0.95,
      "P_Air_Input": 6.2
    }
  ],
  "analog_0": [
    {
      "unix_timestamp": 1726406714.5,
      "value": 123.45,
      "sensor_id": "ultrasonic_0"
    }
  ],
  "analog_1": [
    {
      "unix_timestamp": 1726406714.5,
      "value": 234.56,
      "sensor_id": "acoustic_1"
    }
  ],
  "notifications": []
}
```

---

**Document Version:** 1.0  
**Date:** January 25, 2026  
**Prepared By:** Frontend Development Team
