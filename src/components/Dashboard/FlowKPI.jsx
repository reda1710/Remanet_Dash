/**
 * FlowKPI Component
 * 
 * Organized section for flow-related KPIs:
 * - Q_PG_N2 (Process gas N2 flow rate)
 * - Q_WC (Water cooling flow rate)
 * - ṁ_pow (Powder mass flow rate)
 */

import React from 'react';
import { Card } from '@/components/ui/card';
import KPICard from '@/components/ui/KPICard';
import MultiAxisChart from '@/components/ui/MultiAxisChart';
import { THRESHOLDS } from '@/utils/thresholds';

export default function FlowKPI({ data }) {
  // Get latest values
  const latest = data && data.length > 0 ? data[data.length - 1] : {};
  
  const datasets = [
    {
      label: 'N₂ Flow Rate',
      field: 'Q_PG_N2',
      color: '#2196F3',
      yAxisID: 'y',
      axisLabel: 'Flow Rate (L/min)'
    },
    {
      label: 'Water Flow Rate',
      field: 'Q_WC',
      color: '#00BCD4',
      yAxisID: 'y',
      axisLabel: 'Flow Rate (L/min)'
    },
    {
      label: 'Powder Mass Flow',
      field: 'ṁ_pow',
      color: '#FF9800',
      yAxisID: 'y1',
      position: 'right',
      axisLabel: 'Powder Flow (g/min)'
    }
  ];
  
  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <KPICard
          title="N₂ Flow Rate"
          value={latest.Q_PG_N2}
          unit="L/min"
          thresholds={THRESHOLDS.COLD_SPRAY.Q_PG_N2}
          subtitle="Process gas flow"
        />
        <KPICard
          title="Water Cooling Flow"
          value={latest.Q_WC}
          unit="L/min"
          thresholds={THRESHOLDS.COLD_SPRAY.Q_WC}
          subtitle="Cooling system flow"
        />
        <KPICard
          title="Powder Mass Flow"
          value={latest.ṁ_pow}
          unit="g/min"
          thresholds={THRESHOLDS.COLD_SPRAY.ṁ_pow}
          subtitle="Powder feed rate"
        />
      </div>
      
      {/* Time Series Chart */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Flow Rate Trends</h3>
        <MultiAxisChart
          data={data}
          datasets={datasets}
          height={350}
        />
      </Card>
    </div>
  );
}
