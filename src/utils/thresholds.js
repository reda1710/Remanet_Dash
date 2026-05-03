/**
 * Centralized KPI Threshold Definitions
 * 
 * Based on REMANET WP6.2 specifications and experimental data
 */

export const THRESHOLDS = {
  // Cold Spray KPIs
  COLD_SPRAY: {
    P_Gun: {
      min: 30,
      max: 50,
      warning: 45,
      critical: 48,
      unit: 'bar'
    },
    σ_P: {
      min: 0,
      max: 5,
      warning: 3.0,
      critical: 4.0,
      unit: 'bar'
    },
    Q_PG_N2: {
      min: 30,
      max: 60,
      warning: 48,
      critical: 55,
      unit: 'L/min'
    },
    T_Gun: {
      min: 20,
      max: 100,
      warning: 50,
      critical: 70,
      unit: '°C'
    },
    Q_WC: {
      min: 5,
      max: 15,
      warning: 12,
      critical: 14,
      unit: 'L/min'
    },
    T_WC: {
      min: 15,
      max: 30,
      warning: 25,
      critical: 28,
      unit: '°C'
    },
    ṁ_pow: {
      min: 10,
      max: 50,
      warning: 35,
      critical: 45,
      unit: 'g/min'
    },
    P_N2_Input: {
      min: 40,
      max: 70,
      warning: 55,
      critical: 65,
      unit: 'bar'
    },
    P_Air_Input: {
      min: 4,
      max: 8,
      warning: 7,
      critical: 7.5,
      unit: 'bar'
    }
  },
  
  // Analog Sensor KPIs
  ANALOG: {
    rms: {
      min: 0,
      max: 100,
      warning: 60,
      critical: 80,
      unit: ''
    },
    spectral_energy: {
      min: 0,
      max: 500,
      warning: 350,
      critical: 450,
      unit: ''
    },
    acoustic_power_derivative: {
      min: 0,
      max: 50,
      warning: 20,
      critical: 35,
      unit: 'dB/s'
    },
    dominant_freq: {
      min: 0,
      max: 25000,
      warning: null,
      critical: null,
      unit: 'Hz'
    },
    spectral_centroid: {
      min: 0,
      max: 10000,
      warning: null,
      critical: null,
      unit: 'Hz'
    }
  }
};

/**
 * Get status for a KPI value based on thresholds
 * 
 * @param {number} value - KPI value
 * @param {Object} thresholds - Threshold object with warning/critical
 * @returns {string} 'normal' | 'warning' | 'critical'
 */
export function getKPIStatus(value, thresholds) {
  if (!thresholds || value === null || value === undefined) {
    return 'normal';
  }
  
  if (thresholds.critical !== null && value > thresholds.critical) {
    return 'critical';
  }
  
  if (thresholds.warning !== null && value > thresholds.warning) {
    return 'warning';
  }
  
  return 'normal';
}

/**
 * Get color for KPI status
 * 
 * @param {string} status - 'normal' | 'warning' | 'critical'
 * @returns {string} Color code
 */
export function getStatusColor(status) {
  switch (status) {
    case 'critical':
      return '#F44336'; // Red
    case 'warning':
      return '#FF9800'; // Orange
    case 'normal':
    default:
      return '#4CAF50'; // Green
  }
}
