/**
 * PressureKPI Component
 * 
 * Organized section for pressure-related KPIs:
 * - P_Gun (Gun pressure)
 * - σ_P (Pressure fluctuation / standard deviation)
 * - Q_WC (Water flow rate)
 * - T_WC (Water temperature)
 */

import React from 'react';
import { Card } from '@/components/ui/card';
import KPICard from '@/components/ui/KPICard';
import UPlotChart from '@/components/ui/UPlotChart';
import { THRESHOLDS } from '@/utils/thresholds';
import { useDashboardMode } from '@/hooks/useDashboardMode';

export default function PressureKPI({ data }) {
  // Get latest values
  const latest = data && data.length > 0 ? data[data.length - 1] : {};
  const { mode } = useDashboardMode();
  const isHistorical = mode === 'historical';
  
  const datasets = [
    {
      label: 'Gun Pressure',
      field: 'P_Gun',
      color: '#2196F3',
      yAxisID: 'y',
      axisLabel: 'Gun Pressure (bar)'
    },
    {
      label: 'Pressure Fluctuation (σ_P)',
      field: 'σ_P',
      color: '#F44336',
      yAxisID: 'y1',
      position: 'right',
      axisLabel: 'σ_P (bar)'
    }
  ];
  
  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          title="Gun Pressure"
          value={latest.P_Gun}
          unit="bar"
          thresholds={THRESHOLDS.COLD_SPRAY.P_Gun}
          subtitle="Primary process pressure"
        />
        <KPICard
          title="Pressure Fluctuation"
          value={latest.σ_P}
          unit="bar"
          thresholds={THRESHOLDS.COLD_SPRAY.σ_P}
          subtitle="Std dev (clog indicator)"
        />
        <KPICard
          title="Water Flow Rate"
          value={latest.Q_WC}
          unit="L/min"
          thresholds={THRESHOLDS.COLD_SPRAY.Q_WC}
          subtitle="Cooling water flow"
        />
        <KPICard
          title="Water Temperature"
          value={latest.T_WC}
          unit="°C"
          thresholds={THRESHOLDS.COLD_SPRAY.T_WC}
          subtitle="Cooling system temp"
        />
      </div>
      
      {/* Time Series Chart */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Pressure Trends</h3>
        <UPlotChart
          data={data}
          datasets={datasets}
          height={350}
          enableZoom={isHistorical}
        />
      </Card>
    </div>
  );
}
