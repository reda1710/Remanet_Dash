/**
 * KPICard Component
 * 
 * Reusable card for displaying KPI values with status indicators
 */

import React from 'react';
import { getKPIStatus, getStatusColor } from '@/utils/thresholds';

export default function KPICard({ 
  title, 
  value, 
  unit, 
  thresholds, 
  subtitle, 
  icon,
  showStatus = true,
  className = '' 
}) {
  const status = showStatus ? getKPIStatus(value, thresholds) : 'normal';
  const statusColor = getStatusColor(status);
  
  const formattedValue = typeof value === 'number' 
    ? value.toFixed(2) 
    : value ?? '--';
  
  return (
    <div 
      className={`rounded-lg border bg-card p-4 shadow-sm transition-all hover:shadow-md ${className}`}
      style={{ borderLeft: showStatus ? `4px solid ${statusColor}` : undefined }}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <h3 className="text-sm font-medium text-muted-foreground">
            {title}
          </h3>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold">
              {formattedValue}
            </span>
            {unit && (
              <span className="text-sm text-muted-foreground">
                {unit}
              </span>
            )}
          </div>
          {subtitle && (
            <p className="mt-1 text-xs text-muted-foreground">
              {subtitle}
            </p>
          )}
        </div>
        {icon && (
          <div className="ml-4 text-muted-foreground">
            {icon}
          </div>
        )}
      </div>
      
      {showStatus && thresholds && (
        <div className="mt-3 flex items-center gap-2">
          <div 
            className="h-2 w-2 rounded-full" 
            style={{ backgroundColor: statusColor }}
          />
          <span className="text-xs font-medium capitalize" style={{ color: statusColor }}>
            {status}
          </span>
          {thresholds.warning !== null && (
            <span className="text-xs text-muted-foreground">
              Warning: {thresholds.warning} {unit}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
