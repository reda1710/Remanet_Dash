/**
 * PCIChart Component
 * 
 * Dedicated visualization for PCI (Pressure-Acoustic Concordance Index)
 * Features:
 * - PCI trend over time
 * - Risk zone annotations (LOW/MEDIUM/HIGH/CRITICAL)
 * - Component breakdown (σ_P and acoustic derivative)
 * - Statistics panel with risk distribution
 * - Zoom and pan capabilities
 */

import React, { useEffect, useRef, useMemo } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  TimeScale,
  Filler
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import zoomPlugin from 'chartjs-plugin-zoom';
import annotationPlugin from 'chartjs-plugin-annotation';
import 'chartjs-adapter-date-fns';
import { getPCIColor, PCI_THRESHOLDS } from '@/utils/pciCalculator';
import { Card } from '@/components/ui/card';
import { RotateCcw } from 'lucide-react';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  TimeScale,
  Filler,
  zoomPlugin,
  annotationPlugin
);

export default function PCIChart({ 
  pciData, 
  mode, 
  selectedDate,
  height = 450 
}) {
  const chartRef = useRef(null);
  
  // Calculate statistics
  const stats = useMemo(() => {
    if (!pciData || pciData.length === 0) {
      return {
        max: 0,
        min: 0,
        avg: 0,
        current: 0,
        zoneCounts: { low: 0, medium: 0, high: 0, critical: 0 },
        total: 0
      };
    }
    
    const pciValues = pciData.map(d => d.pci);
    const max = Math.max(...pciValues);
    const min = Math.min(...pciValues);
    const avg = pciValues.reduce((a, b) => a + b, 0) / pciValues.length;
    const current = pciValues[pciValues.length - 1];
    
    // Count time in each risk zone
    const zoneCounts = {
      low: pciValues.filter(v => v < PCI_THRESHOLDS.PCI.LOW).length,
      medium: pciValues.filter(v => v >= PCI_THRESHOLDS.PCI.LOW && v < PCI_THRESHOLDS.PCI.MEDIUM).length,
      high: pciValues.filter(v => v >= PCI_THRESHOLDS.PCI.MEDIUM && v < PCI_THRESHOLDS.PCI.HIGH).length,
      critical: pciValues.filter(v => v >= PCI_THRESHOLDS.PCI.HIGH).length
    };
    
    return {
      max: (max * 100).toFixed(1),
      min: (min * 100).toFixed(1),
      avg: (avg * 100).toFixed(1),
      current: (current * 100).toFixed(1),
      zoneCounts,
      total: pciValues.length
    };
  }, [pciData]);
  
  // Prepare chart data
  const chartData = useMemo(() => {
    if (!pciData || pciData.length === 0) {
      return {
        datasets: []
      };
    }
    
    const timeData = pciData.map(d => ({
      x: new Date(d.timestamp * 1000),
      y: d.pci * 100
    }));
    
    const sigmaData = pciData.map(d => ({
      x: new Date(d.timestamp * 1000),
      y: (d.components?.sigma_P_normalized ?? 0) * 100
    }));
    
    const acousticData = pciData.map(d => ({
      x: new Date(d.timestamp * 1000),
      y: (d.components?.dP_ac_dt_normalized ?? 0) * 100
    }));
    
    return {
      datasets: [
        {
          label: 'PCI Risk Index',
          data: timeData,
          borderColor: 'rgb(75, 192, 192)',
          backgroundColor: function(context) {
            const chart = context.chart;
            const {ctx, chartArea} = chart;
            if (!chartArea) return 'rgba(75, 192, 192, 0.1)';
            
            const gradient = ctx.createLinearGradient(0, chartArea.bottom, 0, chartArea.top);
            gradient.addColorStop(0, 'rgba(76, 175, 80, 0.2)');
            gradient.addColorStop(0.3, 'rgba(255, 193, 7, 0.2)');
            gradient.addColorStop(0.6, 'rgba(255, 152, 0, 0.2)');
            gradient.addColorStop(1, 'rgba(244, 67, 54, 0.2)');
            return gradient;
          },
          fill: true,
          tension: 0.4,
          borderWidth: 3,
          pointRadius: mode === 'historical' ? 0 : 2,
          pointHoverRadius: 5
        },
        {
          label: 'σ_P Component',
          data: sigmaData,
          borderColor: 'rgba(255, 99, 132, 0.6)',
          borderWidth: 2,
          borderDash: [5, 5],
          fill: false,
          tension: 0.4,
          pointRadius: 0,
          hidden: true
        },
        {
          label: 'Acoustic Component',
          data: acousticData,
          borderColor: 'rgba(54, 162, 235, 0.6)',
          borderWidth: 2,
          borderDash: [5, 5],
          fill: false,
          tension: 0.4,
          pointRadius: 0,
          hidden: true
        }
      ]
    };
  }, [pciData, mode]);
  
  // Chart options
  const chartOptions = useMemo(() => {
    const isHistorical = mode === 'historical';
    let dayStart, dayEnd;
    
    if (isHistorical && selectedDate) {
      dayStart = new Date(selectedDate);
      dayStart.setHours(0, 0, 0, 0);
      
      dayEnd = new Date(selectedDate);
      dayEnd.setHours(23, 59, 59, 999);
    }
    
    return {
      responsive: true,
      maintainAspectRatio: false,
      interaction: {
        mode: 'index',
        intersect: false
      },
      scales: {
        x: {
          type: 'time',
          ...(isHistorical && dayStart && dayEnd && {
            min: dayStart,
            max: dayEnd
          }),
          time: {
            unit: isHistorical ? 'hour' : 'minute',
            displayFormats: {
              hour: 'HH:mm',
              minute: 'HH:mm'
            },
            tooltipFormat: 'yyyy-MM-dd HH:mm:ss'
          },
          title: {
            display: true,
            text: isHistorical ? `PCI Timeline - ${selectedDate}` : 'Time'
          }
        },
        y: {
          min: 0,
          max: 100,
          title: {
            display: true,
            text: 'PCI Risk (%)'
          },
          ticks: {
            callback: function(value) {
              return value + '%';
            }
          }
        }
      },
      plugins: {
        legend: {
          position: 'top',
          onClick: function(e, legendItem, legend) {
            const index = legendItem.datasetIndex;
            const ci = legend.chart;
            const meta = ci.getDatasetMeta(index);
            meta.hidden = meta.hidden === null ? !ci.data.datasets[index].hidden : null;
            ci.update();
          }
        },
        tooltip: {
          callbacks: {
            label: function(context) {
              let label = context.dataset.label || '';
              if (label) label += ': ';
              label += context.parsed.y.toFixed(1) + '%';
              
              if (context.datasetIndex === 0) {
                const pci = context.parsed.y / 100;
                let risk = 'LOW';
                if (pci >= PCI_THRESHOLDS.PCI.HIGH) risk = 'CRITICAL';
                else if (pci >= PCI_THRESHOLDS.PCI.MEDIUM) risk = 'HIGH';
                else if (pci >= PCI_THRESHOLDS.PCI.LOW) risk = 'MEDIUM';
                label += ` (${risk})`;
              }
              
              return label;
            }
          }
        },
        annotation: {
          annotations: {
            lowLine: {
              type: 'line',
              yMin: PCI_THRESHOLDS.PCI.LOW * 100,
              yMax: PCI_THRESHOLDS.PCI.LOW * 100,
              borderColor: '#FFC107',
              borderWidth: 2,
              borderDash: [10, 5],
              label: {
                display: true,
                content: 'Medium Risk (30%)',
                position: 'end',
                backgroundColor: '#FFC107',
                color: '#000',
                font: { size: 10 }
              }
            },
            mediumLine: {
              type: 'line',
              yMin: PCI_THRESHOLDS.PCI.MEDIUM * 100,
              yMax: PCI_THRESHOLDS.PCI.MEDIUM * 100,
              borderColor: '#FF9800',
              borderWidth: 2,
              borderDash: [10, 5],
              label: {
                display: true,
                content: 'High Risk (60%)',
                position: 'end',
                backgroundColor: '#FF9800',
                color: '#fff',
                font: { size: 10 }
              }
            },
            highLine: {
              type: 'line',
              yMin: PCI_THRESHOLDS.PCI.HIGH * 100,
              yMax: PCI_THRESHOLDS.PCI.HIGH * 100,
              borderColor: '#F44336',
              borderWidth: 2,
              borderDash: [10, 5],
              label: {
                display: true,
                content: 'Critical Risk (80%)',
                position: 'end',
                backgroundColor: '#F44336',
                color: '#fff',
                font: { size: 10 }
              }
            }
          }
        },
        zoom: {
          zoom: {
            wheel: { enabled: true },
            pinch: { enabled: true },
            mode: 'x'
          },
          pan: {
            enabled: true,
            mode: 'x'
          },
          ...(isHistorical && dayStart && dayEnd && {
            limits: {
              x: {
                min: dayStart.getTime(),
                max: dayEnd.getTime()
              }
            }
          })
        }
      }
    };
  }, [mode, selectedDate]);
  
  const resetZoom = () => {
    if (chartRef.current) {
      chartRef.current.resetZoom();
    }
  };
  
  if (!pciData || pciData.length === 0) {
    return (
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">PCI (Pressure-Acoustic Concordance Index)</h3>
        <div className="flex items-center justify-center h-64 text-muted-foreground">
          No PCI data available
        </div>
      </Card>
    );
  }
  
  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">PCI (Pressure-Acoustic Concordance Index)</h3>
        <button 
          onClick={resetZoom} 
          className="flex items-center gap-2 px-3 py-2 text-sm bg-secondary hover:bg-secondary/80 rounded-md transition-colors"
        >
          <RotateCcw className="h-4 w-4" />
          Reset Zoom
        </button>
      </div>
      
      {/* Statistics Panel */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="p-3 rounded-lg border bg-card">
          <div className="text-xs text-muted-foreground mb-1">Current</div>
          <div className="text-2xl font-bold" style={{ color: getPCIColor(stats.current / 100) }}>
            {stats.current}%
          </div>
        </div>
        <div className="p-3 rounded-lg border bg-card">
          <div className="text-xs text-muted-foreground mb-1">Average</div>
          <div className="text-2xl font-bold">{stats.avg}%</div>
        </div>
        <div className="p-3 rounded-lg border bg-card">
          <div className="text-xs text-muted-foreground mb-1">Maximum</div>
          <div className="text-2xl font-bold">{stats.max}%</div>
        </div>
        <div className="p-3 rounded-lg border bg-card">
          <div className="text-xs text-muted-foreground mb-1">Minimum</div>
          <div className="text-2xl font-bold">{stats.min}%</div>
        </div>
      </div>
      
      {/* Risk Distribution Bar */}
      {stats.total > 0 && (
        <div className="mb-6">
          <div className="text-sm font-medium mb-2">Time in Risk Zones:</div>
          <div className="flex h-8 rounded-md overflow-hidden border">
            <div 
              className="bg-green-500 flex items-center justify-center text-xs font-medium text-white"
              style={{ width: `${(stats.zoneCounts.low / stats.total) * 100}%` }}
            >
              {stats.zoneCounts.low > 0 && `${((stats.zoneCounts.low / stats.total) * 100).toFixed(0)}%`}
            </div>
            <div 
              className="bg-yellow-500 flex items-center justify-center text-xs font-medium text-white"
              style={{ width: `${(stats.zoneCounts.medium / stats.total) * 100}%` }}
            >
              {stats.zoneCounts.medium > 0 && `${((stats.zoneCounts.medium / stats.total) * 100).toFixed(0)}%`}
            </div>
            <div 
              className="bg-orange-500 flex items-center justify-center text-xs font-medium text-white"
              style={{ width: `${(stats.zoneCounts.high / stats.total) * 100}%` }}
            >
              {stats.zoneCounts.high > 0 && `${((stats.zoneCounts.high / stats.total) * 100).toFixed(0)}%`}
            </div>
            <div 
              className="bg-red-500 flex items-center justify-center text-xs font-medium text-white"
              style={{ width: `${(stats.zoneCounts.critical / stats.total) * 100}%` }}
            >
              {stats.zoneCounts.critical > 0 && `${((stats.zoneCounts.critical / stats.total) * 100).toFixed(0)}%`}
            </div>
          </div>
          <div className="flex justify-between mt-2 text-xs text-muted-foreground">
            <span>Low</span>
            <span>Medium</span>
            <span>High</span>
            <span>Critical</span>
          </div>
        </div>
      )}
      
      {/* Chart */}
      <div style={{ height: `${height}px`, position: 'relative' }}>
        <Line ref={chartRef} data={chartData} options={chartOptions} />
      </div>
      
      <div className="mt-4 text-xs text-muted-foreground text-center">
        💡 Use mouse wheel to zoom, drag to pan. Click legend items to toggle components.
      </div>
    </Card>
  );
}
