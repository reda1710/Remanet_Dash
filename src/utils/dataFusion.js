/**
 * Multi-Sensor Data Fusion Utilities
 * 
 * Synchronize data from multiple sensors (cold spray + analog sensors)
 * by timestamp for composite analysis
 */

/**
 * Fuse cold spray and analog sensor data by matching timestamps
 * 
 * @param {Array} coldSprayData - Cold spray KPI data with Time field
 * @param {Array} analogData0 - Analog sensor 0 data with Time field
 * @param {Array} analogData1 - Analog sensor 1 data with Time field
 * @returns {Array} Fused data array with all sensors synchronized
 */
export function fuseMultiSensorData(coldSprayData, analogData0, analogData1) {
  if (!coldSprayData || coldSprayData.length === 0) {
    return [];
  }
  
  const fusedData = [];
  
  // Create maps for quick lookup by timestamp
  const analogMap0 = new Map();
  const analogMap1 = new Map();
  
  (analogData0 || []).forEach(point => {
    if (point.Time) {
      analogMap0.set(point.Time, point);
    }
  });
  
  (analogData1 || []).forEach(point => {
    if (point.Time) {
      analogMap1.set(point.Time, point);
    }
  });
  
  // Fuse data by matching timestamps (within tolerance)
  coldSprayData.forEach(coldPoint => {
    const timestamp = coldPoint.Time;
    
    // Find nearest analog data points (within 1 second tolerance)
    const analog0Point = findNearestByTime(analogMap0, timestamp, 1000);
    const analog1Point = findNearestByTime(analogMap1, timestamp, 1000);
    
    fusedData.push({
      timestamp: timestamp,
      Time: timestamp,
      // Cold spray data
      ...coldPoint,
      // Analog sensor 0 data (prefixed)
      analog0_rms: analog0Point?.rms ?? null,
      analog0_spectral_energy: analog0Point?.spectral_energy ?? null,
      analog0_acoustic_power_derivative: analog0Point?.acoustic_power_derivative ?? null,
      analog0_dominant_freq: analog0Point?.dominant_freq ?? null,
      analog0_spectral_centroid: analog0Point?.spectral_centroid ?? null,
      // Analog sensor 1 data (prefixed)
      analog1_rms: analog1Point?.rms ?? null,
      analog1_spectral_energy: analog1Point?.spectral_energy ?? null,
      analog1_acoustic_power_derivative: analog1Point?.acoustic_power_derivative ?? null,
      analog1_dominant_freq: analog1Point?.dominant_freq ?? null,
      analog1_spectral_centroid: analog1Point?.spectral_centroid ?? null,
    });
  });
  
  return fusedData;
}

/**
 * Find nearest data point by timestamp from a Map
 * 
 * @param {Map} dataMap - Map of timestamp -> data point
 * @param {number} targetTime - Target timestamp
 * @param {number} tolerance - Maximum time difference in ms (default: 1000ms)
 * @returns {Object|null} Nearest data point or null
 */
function findNearestByTime(dataMap, targetTime, tolerance = 1000) {
  let nearest = null;
  let minDiff = Infinity;
  
  for (const [time, point] of dataMap.entries()) {
    const diff = Math.abs(time - targetTime);
    
    if (diff < minDiff && diff <= tolerance) {
      minDiff = diff;
      nearest = point;
    }
  }
  
  return nearest;
}

/**
 * Calculate average acoustic power derivative from both analog sensors
 * 
 * @param {Object} fusedPoint - Fused data point
 * @returns {number} Average acoustic power derivative
 */
export function getAverageAcousticDerivative(fusedPoint) {
  const d0 = fusedPoint.analog0_acoustic_power_derivative;
  const d1 = fusedPoint.analog1_acoustic_power_derivative;
  
  if (d0 !== null && d1 !== null) {
    return (d0 + d1) / 2;
  } else if (d0 !== null) {
    return d0;
  } else if (d1 !== null) {
    return d1;
  }
  
  return 0;
}

/**
 * Extract PCI-relevant data from fused data
 * 
 * @param {Array} fusedData - Fused multi-sensor data
 * @returns {Array} Data points with sigma_P and acoustic_power_derivative
 */
export function extractPCIData(fusedData) {
  return fusedData.map(point => ({
    timestamp: point.timestamp,
    Time: point.Time,
    σ_P: point.σ_P ?? 0,
    sigma_P: point.σ_P ?? 0,
    acoustic_power_derivative: getAverageAcousticDerivative(point)
  }));
}
