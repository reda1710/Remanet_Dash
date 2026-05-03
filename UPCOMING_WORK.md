# Upcoming Work - Historical Mode Completion

**Date:** January 26, 2026  
**Status:** 🟡 Partial Implementation - Missing 3 Backend Fields

---

## 🎯 Current Status Summary

### ✅ **Working Features**
- Historical mode UI (date picker, mode toggle)
- Data fetching from REST API
- Charts rendering with historical data
- Field mappings:
  - `m_dot_pow` → `ṁ_pow` ✓
  - Analog sensor data (RMS, acoustic_power_derivative, spectral_energy) ✓
- All 10 base cold spray fields displaying correctly
- Analog 0 & 1 sensor data displaying correctly

### ⚠️ **Missing Features** (3 Backend Fields)
These fields exist in real-time WebSocket data but are **NOT stored in historical database**:
1. `σ_P` - Pressure fluctuation (standard deviation)
2. `P_N2_Input` - N₂ input pressure
3. `P_Air_Input` - Air input pressure
4. `dP_ac_dt` - Acoustic power derivative (may be calculated differently)

**Impact:** KPI cards for these fields show `--` in historical mode.

---

## 🔧 BACKEND TASKS (Priority: HIGH)

### Task 1: Add Missing Fields to Database Schema
**File to modify:** Backend data storage/insertion logic

**Current database fields (10):**
```python
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
    "m_dot_pow": float,  # Already added ✓
}
```

**Add these fields:**
```python
{
    # ... existing fields ...
    
    # NEW FIELDS TO ADD:
    "sigma_P": float,      # Pressure fluctuation (std dev)
    "P_N2_Input": float,   # N2 input pressure
    "P_Air_Input": float,  # Air input pressure
    "dP_ac_dt": float,     # Acoustic derivative (optional)
}
```

**Where to get values:**
- Check if these fields already exist in your **real-time WebSocket data stream**
- If yes: Simply add them to the historical storage
- If no: May need to add sensors or calculate from existing data

---

### Task 2: Update Data Insertion Logic
**Action:** When saving real-time data to historical database, include new fields

**Example Python code:**
```python
def store_historical_record(realtime_data):
    """Store real-time data point to historical database"""
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
        "m_dot_pow": realtime_data.get("m_dot_pow", 0),
        
        # ADD THESE NEW FIELDS:
        "sigma_P": realtime_data.get("sigma_P", None),
        "P_N2_Input": realtime_data.get("P_N2_Input", None),
        "P_Air_Input": realtime_data.get("P_Air_Input", None),
        "dP_ac_dt": realtime_data.get("dP_ac_dt", None),
    }
    
    # Insert to database
    db.cold_spray_historical.insert_one(historical_record)
```

---

### Task 3: Update Historical API Response
**Endpoint:** `GET /data/?filter_date=M/D/YYYY`

**Current response:**
```json
{
  "data": [
    {
      "Time": "2025-09-15T12:25:14",
      "P_Gun": 0.06,
      // ... 10 fields total
    }
  ],
  "analog_0": [...],
  "analog_1": [...],
  "notifications": []
}
```

**Updated response (add 3+ fields):**
```json
{
  "data": [
    {
      "Time": "2025-09-15T12:25:14",
      "P_Gun": 0.06,
      // ... existing fields ...
      "sigma_P": 0.00234,
      "P_N2_Input": 0.95,
      "P_Air_Input": 6.2,
      "dP_ac_dt": 12.5
    }
  ],
  "analog_0": [...],
  "analog_1": [...],
  "notifications": []
}
```

---

### Task 4: Calculate σ_P (Pressure Fluctuation)
**If not already calculated in real-time:**

```python
import numpy as np

def calculate_sigma_P(pressure_values, window_size=10):
    """
    Calculate rolling standard deviation of gun pressure
    
    Args:
        pressure_values: List of recent P_Gun values
        window_size: Number of samples for rolling window
    
    Returns:
        Standard deviation (float)
    """
    if len(pressure_values) < window_size:
        return 0.0
    
    recent_values = pressure_values[-window_size:]
    return float(np.std(recent_values))

# Usage example:
pressure_buffer = [0.05, 0.06, 0.055, 0.058, 0.062, ...]  # Keep last N values
sigma_P = calculate_sigma_P(pressure_buffer, window_size=10)
```

**When to calculate:**
- Calculate BEFORE storing to historical database
- Store the calculated value in `sigma_P` field

---

### Task 5: Verify Sensor Data for P_N2_Input and P_Air_Input
**Action:** Check if these sensors exist in your system

**Option A:** Sensors exist
- Add sensor readings to real-time data stream
- Store values in historical database

**Option B:** Sensors don't exist yet
- May need to add hardware sensors
- Or use placeholder/calculated values temporarily

---

## 💻 FRONTEND TASKS (Priority: LOW)

### Task 1: Update Field Mappings (After Backend Ready)
**File:** `src/hooks/useHistoricalData.js`

**Current code:**
```javascript
// Field name mappings (backend → frontend):
ṁ_pow: item.m_dot_pow,
σ_P: undefined,           // TO REMOVE AFTER BACKEND UPDATE
P_N2_Input: undefined,    // TO REMOVE AFTER BACKEND UPDATE
P_Air_Input: undefined,   // TO REMOVE AFTER BACKEND UPDATE
dP_ac_dt: undefined,      // TO REMOVE AFTER BACKEND UPDATE
```

**Updated code (after backend provides fields):**
```javascript
// Field name mappings (backend → frontend):
ṁ_pow: item.m_dot_pow,
σ_P: item.sigma_P,        // Backend field name
P_N2_Input: item.P_N2_Input,
P_Air_Input: item.P_Air_Input,
dP_ac_dt: item.dP_ac_dt,  // If backend provides this
```

---

### Task 2: Remove Debug Logging
**File:** `src/hooks/useHistoricalData.js` (Lines 52-60)

**Remove these console logs after testing:**
```javascript
// DELETE THESE AFTER BACKEND IS STABLE:
console.log('🔍 Backend field names:', Object.keys(result.data[0]));
console.log('🔍 First data sample:', result.data[0]);
console.log('🔍 Analog 0 fields:', Object.keys(result.analog_0[0]));
console.log('🔍 Analog 0 sample:', result.analog_0[0]);
```

Keep only:
```javascript
console.log(`✓ Loaded ${result.data.length} historical data points for ${selectedDate}`);
```

---

### Task 3: Add Missing Data Indicator (Optional Enhancement)
**File:** Create `src/components/Dashboard/HistoricalDataBadge.jsx`

**Purpose:** Show visual indicator when historical data is incomplete

```jsx
export function HistoricalDataBadge({ missingFields }) {
  if (!missingFields || missingFields.length === 0) return null;
  
  return (
    <Alert variant="warning" className="mb-4">
      <AlertCircle className="h-4 w-4" />
      <AlertDescription>
        Historical data incomplete. Missing fields: {missingFields.join(', ')}
      </AlertDescription>
    </Alert>
  );
}
```

---

## 🧪 TESTING TASKS

### Backend Testing Checklist
- [ ] **Database schema updated** with 3 new fields
- [ ] **Real-time data capture** includes new fields
- [ ] **Historical API** returns new fields in response
- [ ] **Field values are valid** (not null/NaN/Infinity)
- [ ] **Performance:** Query returns data within 2 seconds
- [ ] **Test with multiple dates** (today, yesterday, last week)

### Frontend Testing Checklist
- [ ] **KPI cards display values** instead of `--`
- [ ] **Charts render correctly** with new fields
- [ ] **No console errors** when loading historical data
- [ ] **Mode switching** works smoothly (real-time ↔ historical)
- [ ] **PCI calculation** works in historical mode (needs σ_P)
- [ ] **Date picker** respects local timezone

### Integration Testing
- [ ] **Real-time → Historical:** Start real-time, switch to historical
- [ ] **Historical → Real-time:** Start historical, switch to real-time
- [ ] **Multiple date selections:** Switch between different dates
- [ ] **Edge cases:** No data for date, invalid date, future date

---

## 📋 PRIORITY MATRIX

### 🔴 Critical (Do Tomorrow)
1. ✅ **Backend:** Add `sigma_P`, `P_N2_Input`, `P_Air_Input` to database schema
2. ✅ **Backend:** Update data insertion to store new fields
3. ✅ **Backend:** Update API response to return new fields
4. ✅ **Frontend:** Update field mappings (remove `undefined` assignments)
5. ✅ **Testing:** Verify new fields display in dashboard

### 🟡 Medium (This Week)
1. **Backend:** Implement σ_P calculation if not already present
2. **Backend:** Verify sensor data sources for P_N2_Input, P_Air_Input
3. **Frontend:** Remove debug console logs
4. **Testing:** Full integration testing across multiple dates

### 🟢 Low (Nice to Have)
1. **Frontend:** Add historical data completeness indicator
2. **Documentation:** Update API documentation with new fields
3. **Performance:** Add caching for recently viewed dates
4. **Feature:** Date range selector (start date → end date)

---

## 🎯 SUCCESS CRITERIA

**Historical mode is 100% complete when:**
- ✅ All KPI cards show values (no `--` placeholders)
- ✅ All charts render with complete data
- ✅ PCI calculation works in historical mode
- ✅ No missing field errors in console
- ✅ Performance: Load time < 2 seconds for 5000 records
- ✅ Seamless switching between real-time and historical modes

---

## 📞 COORDINATION

### Backend Team Needs:
- Field names confirmed: `sigma_P`, `P_N2_Input`, `P_Air_Input`
- Data type: All `float` values
- Nullability: Can be `null` if sensor not available
- Calculation method for σ_P (standard deviation of P_Gun)

### Frontend Team Needs:
- Notification when backend fields are ready
- Sample API response with new fields for validation
- Confirmation of field names (case-sensitive)

---

## 📝 NOTES

- **Backward compatibility:** Old historical data will have `null` for new fields (acceptable)
- **Real-time priority:** Ensure new fields don't break existing real-time functionality
- **Data migration:** No need to backfill old data (new fields start from tomorrow)
- **Analog sensors:** Already working perfectly ✓

---

**Next Update:** After backend implements the 3 missing fields  
**Review Date:** January 27, 2026  
**Estimated Completion:** 1-2 days (depends on backend sensor availability)
