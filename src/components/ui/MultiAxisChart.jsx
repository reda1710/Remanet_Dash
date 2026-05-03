/**
 * MultiAxisChart Component
 * 
 * Reusable line chart with multiple Y-axes for comparing different KPIs
 */

import React, { useRef, useMemo, useEffect, useState } from 'react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  TimeScale
} from 'chart.js';
import zoomPlugin from 'chartjs-plugin-zoom';
import 'chartjs-adapter-date-fns';
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
  zoomPlugin
);

function MultiAxisChart({ 
  data, 
  datasets, 
  title,
  height = 300,
  showLegend = true 
}) {
  const chartRef = useRef(null);
  
  const handleResetZoom = () => {
    if (chartRef.current) {
      chartRef.current.resetZoom();
    }
  };
  
  // Prepare chart data (memoized to prevent zoom reset)
  const chartData = useMemo(() => ({
    labels: data.map(point => new Date((point.unix_timestamp || point.Time || point.timestamp) * 1000)),
    datasets: datasets.map((dataset, idx) => ({
      label: dataset.label,
      data: data.map(point => point[dataset.field]),
      borderColor: dataset.color || `hsl(${idx * 60}, 70%, 50%)`,
      backgroundColor: dataset.backgroundColor || `hsla(${idx * 60}, 70%, 50%, 0.1)`,
      yAxisID: dataset.yAxisID || 'y',
      tension: 0.3,
      pointRadius: 1,
      borderWidth: 2,
      fill: dataset.fill || false
    }))
  }), [data, datasets]);
  
  // Build Y-axes configuration (memoized)
  const yAxes = useMemo(() => {
    const axes = {};
    datasets.forEach(dataset => {
      const axisId = dataset.yAxisID || 'y';
      if (!axes[axisId]) {
        axes[axisId] = {
          type: 'linear',
          display: true,
          position: dataset.position || 'left',
          title: {
            display: true,
            text: dataset.axisLabel || dataset.label
          },
          grid: {
            drawOnChartArea: axisId === 'y'
          }
        };
      }
    });
    return axes;
  }, [datasets]);
  
  // Chart options (memoized to prevent zoom reset)
  const options = useMemo(() => ({
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: 'index',
      intersect: false
    },
    plugins: {
      title: {
        display: !!title,
        text: title
      },
      legend: {
        display: showLegend,
        position: 'top',
        onClick: function(e, legendItem, legend) {
          const index = legendItem.datasetIndex;
          const ci = legend.chart;
          const meta = ci.getDatasetMeta(index);
          meta.hidden = meta.hidden === null ? !ci.data.datasets[index].hidden : null;
          ci.update();
        }
      },
      zoom: {
        zoom: {
          wheel: { 
            enabled: true,
            modifierKey: null
          },
          pinch: { enabled: true },
          mode: 'x'
        },
        pan: {
          enabled: true,
          mode: 'x',
          modifierKey: null
        }
      }
    },
    scales: {
      x: {
        type: 'time',
        time: {
          displayFormats: {
            second: 'HH:mm:ss',
            minute: 'HH:mm',
            hour: 'HH:mm'
          }
        },
        title: {
          display: true,
          text: 'Time'
        }
      },
      ...yAxes
    }
  }), [title, showLegend, yAxes]);
  
  // Manually update chart data without resetting zoom
  useEffect(() => {
    if (chartRef.current) {
      const chart = chartRef.current;
      
      // Update data without triggering a full re-render
      chartData.datasets.forEach((dataset, i) => {
        if (chart.data.datasets[i]) {
          chart.data.datasets[i].data = dataset.data;
        }
      });
      
      // Update with 'none' mode to preserve zoom
      chart.update('none');
    }
  }, [chartData]);
  
  return (
    <div>
      <div className="flex justify-between items-center mb-2">
        <span className="text-xs text-muted-foreground">
          💡 Use mouse wheel to zoom, drag to pan. Click legend items to toggle components.
        </span>
        <button
          onClick={handleResetZoom}
          className="flex items-center gap-1 px-2 py-1 text-xs bg-secondary hover:bg-secondary/80 rounded transition-colors"
          title="Reset zoom"
        >
          <RotateCcw className="w-3 h-3" />
          Reset
        </button>
      </div>
      <div style={{ height: `${height}px` }}>
        <Line 
          ref={chartRef} 
          data={chartData} 
          options={options}
          redraw={false}
        />
      </div>
    </div>
  );
}

// Memoize component to prevent unnecessary re-renders
export default React.memo(MultiAxisChart, (prevProps, nextProps) => {
  // Only re-render if data length changes or datasets change
  return (
    prevProps.data.length === nextProps.data.length &&
    prevProps.datasets === nextProps.datasets &&
    prevProps.title === nextProps.title &&
    prevProps.showLegend === nextProps.showLegend &&
    prevProps.height === nextProps.height
  );
});
