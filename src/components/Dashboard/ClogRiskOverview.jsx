/**
 * ClogRiskOverview Component
 * 
 * Comprehensive overview of clog risk with PCI gauge, trend indicators,
 * and actionable insights
 */

import React from 'react';
import PCIGauge from '@/components/Composite/PCIGauge';
import { Card } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { 
  TrendingUp, 
  TrendingDown, 
  Minus, 
  AlertTriangle, 
  CheckCircle2,
  XCircle 
} from 'lucide-react';

export default function ClogRiskOverview({ currentPCI, pciTrend, statistics }) {
  const { risk_level, components, thresholds = {} } = currentPCI || {};
  const { trend, is_increasing, is_critical, slope } = pciTrend || {};
  
  // Get trend icon
  const getTrendIcon = () => {
    if (trend === 'INCREASING') {
      return <TrendingUp className="h-5 w-5 text-red-500" />;
    } else if (trend === 'DECREASING') {
      return <TrendingDown className="h-5 w-5 text-green-500" />;
    } else {
      return <Minus className="h-5 w-5 text-gray-500" />;
    }
  };
  
  // Get alert severity
  const getAlertSeverity = () => {
    if (risk_level === 'CRITICAL') {
      return { variant: 'destructive', icon: XCircle, title: 'Critical Clog Risk' };
    } else if (risk_level === 'HIGH') {
      return { variant: 'default', icon: AlertTriangle, title: 'High Clog Risk', className: 'border-orange-500 bg-orange-50' };
    } else if (risk_level === 'MEDIUM') {
      return { variant: 'default', icon: AlertTriangle, title: 'Medium Clog Risk', className: 'border-yellow-500 bg-yellow-50' };
    } else {
      return { variant: 'default', icon: CheckCircle2, title: 'Normal Operation', className: 'border-green-500 bg-green-50' };
    }
  };
  
  const alertConfig = getAlertSeverity();
  const AlertIcon = alertConfig.icon;
  
  return (
    <div className="space-y-6">
      {/* Main PCI Gauge */}
      <Card className="p-6">
        <h2 className="text-lg font-semibold mb-4">Clog Risk Index (PCI)</h2>
        <div className="flex flex-col md:flex-row items-center justify-around gap-6">
          <PCIGauge pciData={currentPCI} size={250} />
          
          <div className="flex-1 space-y-4">
            {/* Alert */}
            <Alert variant={alertConfig.variant} className={alertConfig.className}>
              <AlertIcon className="h-4 w-4" />
              <AlertTitle>{alertConfig.title}</AlertTitle>
              <AlertDescription>
                {risk_level === 'CRITICAL' && 
                  'Immediate action required. High probability of nozzle clog detected.'}
                {risk_level === 'HIGH' && 
                  'Elevated risk detected. Monitor closely and prepare for maintenance.'}
                {risk_level === 'MEDIUM' && 
                  'Moderate risk level. Continue monitoring sensor readings.'}
                {risk_level === 'LOW' && 
                  'System operating within normal parameters.'}
              </AlertDescription>
            </Alert>
            
            {/* Trend Indicator */}
            <div className="flex items-center gap-3 p-3 rounded-lg bg-secondary">
              {getTrendIcon()}
              <div>
                <div className="text-sm font-medium">
                  Trend: {trend ?? 'UNKNOWN'}
                </div>
                <div className="text-xs text-muted-foreground">
                  Slope: {slope?.toFixed(4) ?? '0.0000'} per sample
                </div>
              </div>
            </div>
            
            {/* Critical Warnings */}
            {is_critical && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  PCI is rapidly increasing! Risk of imminent clog.
                </AlertDescription>
              </Alert>
            )}
          </div>
        </div>
      </Card>
      
      {/* Component Breakdown */}
      <Card className="p-6">
        <h3 className="text-md font-semibold mb-4">PCI Components</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Pressure Fluctuation */}
          <div className="p-4 rounded-lg border">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Pressure Fluctuation (σ_P)</span>
              {thresholds?.sigma_P_critical && (
                <span className="text-xs font-semibold text-red-500">CRITICAL</span>
              )}
              {thresholds?.sigma_P_warning && !thresholds?.sigma_P_critical && (
                <span className="text-xs font-semibold text-orange-500">WARNING</span>
              )}
            </div>
            <div className="text-2xl font-bold">
              {components?.sigma_P?.toFixed(2) ?? '--'} bar
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              Normalized: {((components?.sigma_P_normalized ?? 0) * 100).toFixed(1)}%
            </div>
          </div>
          
          {/* Acoustic Power Derivative */}
          <div className="p-4 rounded-lg border">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Acoustic Power Derivative</span>
              {thresholds?.dP_ac_dt_critical && (
                <span className="text-xs font-semibold text-red-500">CRITICAL</span>
              )}
              {thresholds?.dP_ac_dt_warning && !thresholds?.dP_ac_dt_critical && (
                <span className="text-xs font-semibold text-orange-500">WARNING</span>
              )}
            </div>
            <div className="text-2xl font-bold">
              {components?.dP_ac_dt?.toFixed(2) ?? '--'} dB/s
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              Normalized: {((components?.dP_ac_dt_normalized ?? 0) * 100).toFixed(1)}%
            </div>
          </div>
        </div>
      </Card>
      
      {/* Statistics */}
      <Card className="p-6">
        <h3 className="text-md font-semibold mb-4">PCI Statistics</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <div className="text-xs text-muted-foreground">Average</div>
            <div className="text-lg font-semibold">
              {((statistics?.avg_pci ?? 0) * 100).toFixed(1)}%
            </div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground">Maximum</div>
            <div className="text-lg font-semibold">
              {((statistics?.max_pci ?? 0) * 100).toFixed(1)}%
            </div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground">Minimum</div>
            <div className="text-lg font-semibold">
              {((statistics?.min_pci ?? 0) * 100).toFixed(1)}%
            </div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground">Std Dev</div>
            <div className="text-lg font-semibold">
              {((statistics?.std_pci ?? 0) * 100).toFixed(1)}%
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
