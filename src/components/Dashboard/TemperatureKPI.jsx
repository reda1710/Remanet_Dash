/**
 * TemperatureKPI Component
 * 
 * Organized section for temperature-related KPIs:
 * - T_Gun (Gun temperature)
 * - T_WC (Water cooling temperature)
 */

import React from 'react';
import { Card } from '@/components/ui/card';
import KPICard from '@/components/ui/KPICard';
import MultiAxisChart from '@/components/ui/MultiAxisChart';
import { THRESHOLDS } from '@/utils/thresholds';

export default function TemperatureKPI({ data }) {
  // Get latest values
  const latest = data && data.length > 0 ? data[data.length - 1] : {};
  
  const datasets = [
    {
      label: 'Gun Temperature',
      field: 'T_Gun',
      color: '#F44336',
      yAxisID: 'y',
      axisLabel: 'Temperature (°C)'
    },
    {
      label: 'Water Cooling Temperature',
      field: 'T_WC',
      color: '#2196F3',
      yAxisID: 'y',
      axisLabel: 'Temperature (°C)'
    }
  ];
  
  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <KPICard
          title="Gun Temperature"
          value={latest.T_Gun}
          unit="°C"
          thresholds={THRESHOLDS.COLD_SPRAY.T_Gun}
          subtitle="Spray gun operating temp"
        />
        <KPICard
          title="Water Cooling Temperature"
          value={latest.T_WC}
          unit="°C"
          thresholds={THRESHOLDS.COLD_SPRAY.T_WC}
          subtitle="Cooling system temp"
        />
      </div>
      
      {/* Time Series Chart */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Temperature Trends</h3>
        <MultiAxisChart
          data={data}
          datasets={datasets}
          height={350}
        />
      </Card>
    </div>
  );
}
