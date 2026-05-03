// src/components/GunVibrationChart.js
// ⚠️ WARNING: This component is DISABLED - Ultrasonic_Vibration field removed from backend
// Will be replaced with analog_0/analog_1 sensor features in future
// See FRONTEND_INTEGRATION_PROMPT.md for details
import React from "react";
import BaseChart from "@/components/BaseChart";

const GunVibrationChart = ({ data, isRealTime }) => {
  return (
    <BaseChart
      data={data}
      isRealTime={isRealTime}
      title="Gun Vibrations (Accelerometer)"
      yAxisLabel="Vibrations"
      dataKey="Ultrasonic_Vibration"
      lineColor="rgb(75, 192, 192)"
      backgroundColor="rgba(75, 192, 192, 0.5)"
      emptyMessage="No Vibrations data available"
    />
  );
};

export default GunVibrationChart;