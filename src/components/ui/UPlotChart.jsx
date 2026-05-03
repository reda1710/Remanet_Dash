/**
 * UPlotChart Component
 * 
 * High-performance time-series chart using uPlot (Grafana's library)
 * Features:
 * - Fast rendering for large datasets
 * - Smooth zoom/pan that actually works
 * - Multiple Y-axes support
 * - Low memory footprint
 */

import React, { useRef, useEffect, useMemo, useState } from 'react';
import uPlot from 'uplot';
import 'uplot/dist/uPlot.min.css';
import { RotateCcw } from 'lucide-react';

function UPlotChart({ 
  data, 
  datasets, 
  title,
  height = 300,
  showLegend = true,
  enableZoom = true
}) {
  const chartRef = useRef(null);
  const containerRef = useRef(null);
  
  // Prepare data in uPlot format [timestamps, ...values]
  const uplotData = useMemo(() => {
    if (!data || data.length === 0) {
      return [[], ...datasets.map(() => [])];
    }
    
    const timestamps = data.map(point => 
      (point.unix_timestamp || point.Time || point.timestamp)
    );
    
    const series = datasets.map(dataset => 
      data.map(point => point[dataset.field])
    );
    
    return [timestamps, ...series];
  }, [data, datasets]);
  
  // Configure chart options
  const options = useMemo(() => {
    // Get container width dynamically
    const containerWidth = containerRef.current?.offsetWidth || 800;
    
    // Build axes configuration
    const axes = [
      {
        // X-axis (time)
        space: 80,
        incrs: [
          1,
          2,
          5,
          10,
          30,
          60,
          120,
          300,
          600,
          1800,
          3600,
          7200,
          14400,
          28800
        ],
        values: (u, vals) => vals.map(v => {
          const date = new Date(v * 1000);
          return date.toLocaleTimeString('en-US', { 
            hour: '2-digit', 
            minute: '2-digit',
            second: '2-digit'
          });
        })
      }
    ];
    
    // Add Y-axes for each dataset
    datasets.forEach((dataset, idx) => {
      axes.push({
        side: dataset.position === 'right' ? 1 : 3,
        scale: dataset.yAxisID || `y${idx}`,
        label: dataset.axisLabel || dataset.label,
        labelGap: 8,
        labelSize: 30,
        size: 60,
        gap: 5,
        grid: { show: idx === 0 },
        ticks: { show: true },
        values: (u, vals) => vals.map(v => v?.toFixed(2))
      });
    });
    
    // Configure series (lines)
    const series = [
      {},
      ...datasets.map((dataset, idx) => ({
        label: dataset.label,
        stroke: dataset.color || `hsl(${idx * 60}, 70%, 50%)`,
        width: 2,
        scale: dataset.yAxisID || `y${idx}`,
        points: { show: false },
        spanGaps: true
      }))
    ];
    
    // Build scales
    const scales = { x: { time: true } };
    datasets.forEach((dataset, idx) => {
      const scaleId = dataset.yAxisID || `y${idx}`;
      if (!scales[scaleId]) {
        scales[scaleId] = { auto: true };
      }
    });
    
    return {
      width: containerWidth,
      height: height,
      title: title || '',
      legend: {
        show: showLegend
      },
      padding: [10, datasets.some(d => d.position === 'right') ? 70 : 10, 0, 70],
      axes,
      series,
      scales,
      cursor: enableZoom ? {
        drag: {
          x: true,
          y: false
        }
      } : {
        drag: {
          x: false,
          y: false
        }
      }
    };
  }, [datasets, title, height, showLegend, enableZoom]);
  
  // Create chart once on mount
  useEffect(() => {
    if (!containerRef.current || uplotData[0].length === 0) return;
    
    // Create new chart
    chartRef.current = new uPlot(options, uplotData, containerRef.current);
    
    return () => {
      if (chartRef.current) {
        chartRef.current.destroy();
        chartRef.current = null;
      }
    };
  }, []); // Empty deps - create once only
  
  // Update data when it changes (for real-time)
  useEffect(() => {
    if (chartRef.current && uplotData[0].length > 0) {
      chartRef.current.setData(uplotData);
    }
  }, [uplotData]);
  
  // Recreate chart when options change (mode switch, dataset structure, etc.)
  useEffect(() => {
    if (!chartRef.current || !containerRef.current) return;
    
    const currentData = chartRef.current.data;
    chartRef.current.destroy();
    chartRef.current = new uPlot(options, currentData, containerRef.current);
  }, [options]);
  
  const handleResetZoom = () => {
    if (chartRef.current && uplotData[0].length > 0) {
      chartRef.current.setScale('x', { 
        min: uplotData[0][0], 
        max: uplotData[0][uplotData[0].length - 1] 
      });
    }
  };
  
  return (
    <div style={{ width: '100%' }}>
      {enableZoom && (
        <div className="flex justify-between items-center mb-2">
          <span className="text-xs text-muted-foreground">
            💡 Scroll to zoom, drag to pan. Click legend to toggle series.
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
      )}
      <div ref={containerRef} style={{ width: '100%' }} />
    </div>
  );
}

export default React.memo(UPlotChart);
