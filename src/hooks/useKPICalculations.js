/**
 * Custom React Hook: useKPICalculations
 * 
 * Combines multi-sensor data fusion with PCI calculation
 * to provide real-time clog risk assessment
 */

import { useMemo } from 'react';
import { 
  calculatePCI, 
  calculatePCITimeSeries, 
  smoothPCI, 
  detectPCITrend,
  getPCIColor 
} from '../utils/pciCalculator';
import { 
  fuseMultiSensorData, 
  extractPCIData,
  getAverageAcousticDerivative 
} from '../utils/dataFusion';
import { filterByTimeWindow } from '../utils/chartHelpers';

/**
 * Main hook for KPI calculations
 * 
 * @param {Array} coldSprayData - Cold spray data with σ_P
 * @param {Array} analogData0 - Analog sensor 0 data
 * @param {Array} analogData1 - Analog sensor 1 data
 * @param {string} timeWindow - Time window filter
 * @returns {Object} Calculated KPIs and risk metrics
 */
export function useKPICalculations(coldSprayData, analogData0, analogData1, timeWindow = '30min') {
  // Fuse multi-sensor data
  const fusedData = useMemo(() => {
    return fuseMultiSensorData(coldSprayData, analogData0, analogData1);
  }, [coldSprayData, analogData0, analogData1]);
  
  // Filter by time window
  const filteredData = useMemo(() => {
    return filterByTimeWindow(fusedData, timeWindow);
  }, [fusedData, timeWindow]);
  
  // Extract PCI-relevant data
  const pciData = useMemo(() => {
    return extractPCIData(filteredData);
  }, [filteredData]);
  
  // Calculate PCI time series
  const pciTimeSeries = useMemo(() => {
    return calculatePCITimeSeries(pciData);
  }, [pciData]);
  
  // Smooth PCI (optional)
  const smoothedPCI = useMemo(() => {
    return smoothPCI(pciTimeSeries, 10);
  }, [pciTimeSeries]);
  
  // Detect PCI trend
  const pciTrend = useMemo(() => {
    return detectPCITrend(pciTimeSeries, 20);
  }, [pciTimeSeries]);
  
  // Get current PCI (latest data point)
  const currentPCI = useMemo(() => {
    if (!pciTimeSeries || pciTimeSeries.length === 0) {
      return {
        pci: 0,
        risk_level: 'UNKNOWN',
        risk_percentage: 0,
        color: '#9E9E9E',
        components: {
          sigma_P: 0,
          sigma_P_normalized: 0,
          dP_ac_dt: 0,
          dP_ac_dt_normalized: 0
        }
      };
    }
    
    const latest = pciTimeSeries[pciTimeSeries.length - 1];
    return {
      ...latest,
      color: getPCIColor(latest.pci)
    };
  }, [pciTimeSeries]);
  
  // Calculate summary statistics
  const statistics = useMemo(() => {
    if (!pciTimeSeries || pciTimeSeries.length === 0) {
      return {
        avg_pci: 0,
        max_pci: 0,
        min_pci: 0,
        std_pci: 0
      };
    }
    
    const pciValues = pciTimeSeries.map(p => p.pci);
    const avg = pciValues.reduce((a, b) => a + b, 0) / pciValues.length;
    const max = Math.max(...pciValues);
    const min = Math.min(...pciValues);
    
    // Standard deviation
    const variance = pciValues.reduce((sum, val) => sum + Math.pow(val - avg, 2), 0) / pciValues.length;
    const std = Math.sqrt(variance);
    
    return {
      avg_pci: avg,
      max_pci: max,
      min_pci: min,
      std_pci: std
    };
  }, [pciTimeSeries]);
  
  return {
    fusedData,
    filteredData,
    pciTimeSeries,
    smoothedPCI,
    currentPCI,
    pciTrend,
    statistics,
    dataPoints: filteredData.length
  };
}
