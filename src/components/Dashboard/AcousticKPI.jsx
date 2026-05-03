/**
 * AcousticKPI Component
 * 
 * Organized section for acoustic sensor KPIs:
 * - RMS (Root mean square)
 * - Spectral Energy
 * - Acoustic Power Derivative (clog indicator)
 * - Dominant Frequency
 * - Spectral Centroid
 */

import React from 'react';
import { Card } from '@/components/ui/card';
import KPICard from '@/components/ui/KPICard';
import MultiAxisChart from '@/components/ui/MultiAxisChart';
import { THRESHOLDS } from '@/utils/thresholds';

export default function AcousticKPI({ analogData0, analogData1 }) {
  // Get latest values from both sensors
  const latest0 = analogData0 && analogData0.length > 0 ? analogData0[analogData0.length - 1] : {};
  const latest1 = analogData1 && analogData1.length > 0 ? analogData1[analogData1.length - 1] : {};
  
  // Prepare fused data for charts (use analog0 as primary)
  const data = analogData0 || [];
  
  const datasetsRMS = [
    {
      label: 'Analog 0 RMS',
      field: 'rms',
      color: '#2196F3',
      yAxisID: 'y',
      axisLabel: 'RMS'
    }
  ];
  
  const datasetsDerivative = [
    {
      label: 'Acoustic Power Derivative',
      field: 'acoustic_power_derivative',
      color: '#F44336',
      yAxisID: 'y',
      axisLabel: 'dP_ac/dt (dB/s)'
    }
  ];
  
  return (
    <div className="space-y-6">
      {/* Sensor 0 KPI Cards */}
      <div>
        <h3 className="text-md font-semibold mb-3">Analog Sensor 0</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
          <KPICard
            title="RMS"
            value={latest0.rms}
            unit=""
            thresholds={THRESHOLDS.ANALOG.rms}
            subtitle="Signal amplitude"
          />
          <KPICard
            title="Spectral Energy"
            value={latest0.spectral_energy}
            unit=""
            thresholds={THRESHOLDS.ANALOG.spectral_energy}
            subtitle="Total energy"
          />
          <KPICard
            title="Acoustic Derivative"
            value={latest0.acoustic_power_derivative}
            unit="dB/s"
            thresholds={THRESHOLDS.ANALOG.acoustic_power_derivative}
            subtitle="Clog indicator"
          />
          <KPICard
            title="Dominant Frequency"
            value={latest0.dominant_freq}
            unit="Hz"
            thresholds={THRESHOLDS.ANALOG.dominant_freq}
            subtitle="Peak frequency"
            showStatus={false}
          />
          <KPICard
            title="Spectral Centroid"
            value={latest0.spectral_centroid}
            unit="Hz"
            thresholds={THRESHOLDS.ANALOG.spectral_centroid}
            subtitle="Frequency center"
            showStatus={false}
          />
        </div>
      </div>
      
      {/* Sensor 1 KPI Cards */}
      <div>
        <h3 className="text-md font-semibold mb-3">Analog Sensor 1</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
          <KPICard
            title="RMS"
            value={latest1.rms}
            unit=""
            thresholds={THRESHOLDS.ANALOG.rms}
            subtitle="Signal amplitude"
          />
          <KPICard
            title="Spectral Energy"
            value={latest1.spectral_energy}
            unit=""
            thresholds={THRESHOLDS.ANALOG.spectral_energy}
            subtitle="Total energy"
          />
          <KPICard
            title="Acoustic Derivative"
            value={latest1.acoustic_power_derivative}
            unit="dB/s"
            thresholds={THRESHOLDS.ANALOG.acoustic_power_derivative}
            subtitle="Clog indicator"
          />
          <KPICard
            title="Dominant Frequency"
            value={latest1.dominant_freq}
            unit="Hz"
            thresholds={THRESHOLDS.ANALOG.dominant_freq}
            subtitle="Peak frequency"
            showStatus={false}
          />
          <KPICard
            title="Spectral Centroid"
            value={latest1.spectral_centroid}
            unit="Hz"
            thresholds={THRESHOLDS.ANALOG.spectral_centroid}
            subtitle="Frequency center"
            showStatus={false}
          />
        </div>
      </div>
      
      {/* Time Series Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">RMS Trend</h3>
          <MultiAxisChart
            data={data}
            datasets={datasetsRMS}
            height={300}
          />
        </Card>
        
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Acoustic Power Derivative</h3>
          <MultiAxisChart
            data={data}
            datasets={datasetsDerivative}
            height={300}
          />
        </Card>
      </div>
    </div>
  );
}
