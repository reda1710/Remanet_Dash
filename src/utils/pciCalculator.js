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
 */
function normalize(value, min, max) {
  if (max === min) return 0;
  const normalized = (value - min) / (max - min);
  return Math.max(0, Math.min(1, normalized)); // Clamp to [0, 1]
}

/**
 * Calculate normalized pressure fluctuation
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
        sigma_P: 0,
        sigma_P_normalized: 0,
        dP_ac_dt: 0,
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
 */
export function calculatePCITimeSeries(dataPoints, options = {}) {
  return dataPoints.map(point => ({
    timestamp: point.timestamp,
    Time: point.Time,
    ...calculatePCI(point.σ_P || point.sigma_P, point.acoustic_power_derivative, options)
  }));
}

/**
 * Calculate rolling PCI average (smoothed)
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
