/**
 * DashboardLayout Component
 * 
 * Main dashboard container with tabbed navigation:
 * - Overview: PCI risk assessment and key metrics
 * - Cold Spray: Pressure, flow, temperature KPIs
 * - Analog Sensors: Acoustic monitoring
 * - Composite: Advanced multi-sensor analysis
 */

'use client';

import React, { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import TimeWindowSelector from '@/components/ui/TimeWindowSelector';
import ModeSelector from './ModeSelector';
import PCIChart from './PCIChart';
import ClogRiskOverview from './ClogRiskOverview';
import PressureKPI from './PressureKPI';
import FlowKPI from './FlowKPI';
import TemperatureKPI from './TemperatureKPI';
import AcousticKPI from './AcousticKPI';
import { useWebSocketConnection } from '@/utils/websocketConnection';
import { useKPICalculations } from '@/hooks/useKPICalculations';
import { useDashboardMode } from '@/hooks/useDashboardMode';
import { useHistoricalData } from '@/hooks/useHistoricalData';
import { filterByTimeWindow } from '@/utils/chartHelpers';
import { Activity, Droplets, Thermometer, AudioLines, TrendingUp, Loader2, AlertCircle } from 'lucide-react';

export default function DashboardLayout() {
  const [activeTab, setActiveTab] = useState('overview');
  const [timeWindow, setTimeWindow] = useState('30min');
  
  // Mode management (real-time vs historical)
  const {
    mode,
    selectedDate,
    handleModeChange,
    handleDateChange,
    isRealtime,
    isHistorical
  } = useDashboardMode();
  
  // Get real-time data from WebSocket
  const { 
    data, 
    analogData0, 
    analogData1,
    handleDateChange: wsHandleDateChange,
    isConnected 
  } = useWebSocketConnection();
  
  // Fetch historical data when in historical mode
  const { 
    data: historicalData, 
    loading: historicalLoading, 
    error: historicalError 
  } = useHistoricalData(selectedDate, mode);
  
  // Select data source based on mode
  // Map real-time field names to match historical data format
  const coldSprayData = isHistorical 
    ? (historicalData?.coldSpray || []) 
    : (data?.cold_spray || []).map(item => ({
        ...item,
        σ_P: item.sigma_P || item.σ_P,                    // Map sigma_P → σ_P
        dP_ac_dt: item.acoustic_power_derivative || item.dP_ac_dt,  // Map acoustic_power_derivative → dP_ac_dt
        ṁ_pow: item.m_dot_pow || item.ṁ_pow              // Map m_dot_pow → ṁ_pow
      }));
  const currentAnalogData0 = isHistorical ? (historicalData?.analog0 || []) : analogData0;
  const currentAnalogData1 = isHistorical ? (historicalData?.analog1 || []) : analogData1;
  
  // No need for manual date handling - useHistoricalData hook handles it automatically
  
  // Calculate PCI and risk metrics
  // In historical mode, pass 'all' to show entire day's data without time window filtering
  const effectiveTimeWindow = isHistorical ? 'all' : timeWindow;
  
  const {
    filteredData,
    pciTimeSeries,
    currentPCI,
    pciTrend,
    statistics,
    dataPoints
  } = useKPICalculations(coldSprayData, currentAnalogData0, currentAnalogData1, effectiveTimeWindow);
  
  // Filter analog data by time window (use all data in historical mode)
  const filteredAnalog0 = filterByTimeWindow(currentAnalogData0, effectiveTimeWindow);
  const filteredAnalog1 = filterByTimeWindow(currentAnalogData1, effectiveTimeWindow);
  
  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">Cold Spray Monitoring Dashboard</h1>
            <p className="text-muted-foreground mt-1">
              {isRealtime ? 'Real-time clog detection and process monitoring' : `Historical data analysis - ${selectedDate}`}
            </p>
          </div>
          
          <div className="flex items-center gap-4">
            {isRealtime && (
              <div className="flex items-center gap-2">
                <div className={`h-2 w-2 rounded-full ${isConnected ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`} />
                <span className="text-sm text-muted-foreground">
                  {isConnected ? 'Live' : 'Disconnected'} • {dataPoints} points
                </span>
              </div>
            )}
            {isHistorical && historicalLoading && (
              <div className="flex items-center gap-2 text-blue-500">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="text-sm font-medium">Loading historical data...</span>
              </div>
            )}
            {isHistorical && !historicalLoading && coldSprayData.length > 0 && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <span className="text-sm">✓ Loaded {coldSprayData.length} data points</span>
              </div>
            )}
            {isRealtime && (
              <TimeWindowSelector 
                value={timeWindow} 
                onChange={setTimeWindow}
              />
            )}
          </div>
        </div>
        
        {/* Historical Mode Error Alert */}
        {isHistorical && historicalError && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Failed to load historical data: {historicalError}
            </AlertDescription>
          </Alert>
        )}
        
        {/* Historical Mode - No Data Alert */}
        {isHistorical && !historicalLoading && !historicalError && coldSprayData.length === 0 && (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              No data available for {selectedDate}. Try selecting a different date.
            </AlertDescription>
          </Alert>
        )}
        
        {/* Mode Selector */}
        <ModeSelector
          mode={mode}
          onModeChange={handleModeChange}
          selectedDate={selectedDate}
          onDateChange={handleDateChange}
          loading={historicalLoading}
        />
      </div>
      
      {/* Tabbed Navigation */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2 lg:grid-cols-6 h-auto">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="pci" className="flex items-center gap-2">
            <Activity className="h-4 w-4" />
            PCI Analysis
          </TabsTrigger>
          <TabsTrigger value="pressure" className="flex items-center gap-2">
            <Activity className="h-4 w-4" />
            Pressure
          </TabsTrigger>
          <TabsTrigger value="flow" className="flex items-center gap-2">
            <Droplets className="h-4 w-4" />
            Flow
          </TabsTrigger>
          <TabsTrigger value="temperature" className="flex items-center gap-2">
            <Thermometer className="h-4 w-4" />
            Temperature
          </TabsTrigger>
          <TabsTrigger value="acoustic" className="flex items-center gap-2">
            <AudioLines className="h-4 w-4" />
            Acoustic
          </TabsTrigger>
        </TabsList>
        
        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6 mt-6">
          <ClogRiskOverview
            currentPCI={currentPCI}
            pciTrend={pciTrend}
            statistics={statistics}
          />
          
          {/* Quick Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="p-6">
              <h3 className="text-sm font-medium text-muted-foreground mb-2">
                Current Gun Pressure
              </h3>
              <div className="text-3xl font-bold">
                {filteredData.length > 0 
                  ? filteredData[filteredData.length - 1].P_Gun?.toFixed(2) 
                  : '--'} bar
              </div>
            </Card>
            
            <Card className="p-6">
              <h3 className="text-sm font-medium text-muted-foreground mb-2">
                Pressure Fluctuation (σ_P)
              </h3>
              <div className="text-3xl font-bold">
                {filteredData.length > 0 
                  ? filteredData[filteredData.length - 1].σ_P?.toFixed(3)
                  : '--'} bar
              </div>
            </Card>
            
            <Card className="p-6">
              <h3 className="text-sm font-medium text-muted-foreground mb-2">
                Acoustic Derivative
              </h3>
              <div className="text-3xl font-bold">
                {filteredAnalog0.length > 0 
                  ? filteredAnalog0[filteredAnalog0.length - 1].acoustic_power_derivative?.toFixed(2)
                  : '--'} dB/s
              </div>
            </Card>
          </div>
        </TabsContent>
        
        {/* PCI Analysis Tab */}
        <TabsContent value="pci" className="mt-6">
          <PCIChart
            pciData={pciTimeSeries}
            mode={mode}
            selectedDate={selectedDate}
            height={500}
          />
        </TabsContent>
        
        {/* Pressure Tab */}
        <TabsContent value="pressure" className="mt-6">
          <PressureKPI data={filteredData} />
        </TabsContent>
        
        {/* Flow Tab */}
        <TabsContent value="flow" className="mt-6">
          <FlowKPI data={filteredData} />
        </TabsContent>
        
        {/* Temperature Tab */}
        <TabsContent value="temperature" className="mt-6">
          <TemperatureKPI data={filteredData} />
        </TabsContent>
        
        {/* Acoustic Tab */}
        <TabsContent value="acoustic" className="mt-6">
          <AcousticKPI 
            analogData0={filteredAnalog0}
            analogData1={filteredAnalog1}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
