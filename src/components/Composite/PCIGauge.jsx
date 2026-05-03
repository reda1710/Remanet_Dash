/**
 * PCIGauge Component
 * 
 * Visual gauge for displaying PCI (Pressure-Acoustic Concordance Index)
 * with risk level indicators
 */

import React, { useEffect, useRef } from 'react';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { Doughnut } from 'react-chartjs-2';
import { getPCIColor } from '@/utils/pciCalculator';

ChartJS.register(ArcElement, Tooltip, Legend);

export default function PCIGauge({ pciData, size = 200 }) {
  const { pci, risk_level, risk_percentage } = pciData;
  
  const color = getPCIColor(pci);
  
  // Gauge data (doughnut chart)
  const data = {
    labels: ['PCI', 'Remaining'],
    datasets: [
      {
        data: [pci * 100, (1 - pci) * 100],
        backgroundColor: [color, '#E0E0E0'],
        borderWidth: 0,
        circumference: 180,
        rotation: 270,
      }
    ]
  };
  
  const options = {
    responsive: true,
    maintainAspectRatio: true,
    cutout: '75%',
    plugins: {
      legend: {
        display: false
      },
      tooltip: {
        enabled: false
      }
    }
  };
  
  return (
    <div className="flex flex-col items-center gap-4">
      <div style={{ width: size, height: size / 2, position: 'relative' }}>
        <Doughnut data={data} options={options} />
        <div 
          style={{
            position: 'absolute',
            bottom: '10px',
            left: '50%',
            transform: 'translateX(-50%)',
            textAlign: 'center'
          }}
        >
          <div className="text-3xl font-bold" style={{ color }}>
            {risk_percentage}%
          </div>
          <div className="text-xs text-muted-foreground">
            PCI Index
          </div>
        </div>
      </div>
      
      <div className="flex items-center gap-2">
        <div 
          className="h-3 w-3 rounded-full" 
          style={{ backgroundColor: color }}
        />
        <span 
          className="text-sm font-semibold uppercase tracking-wide" 
          style={{ color }}
        >
          {risk_level} Risk
        </span>
      </div>
    </div>
  );
}
