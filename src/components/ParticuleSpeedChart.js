// src/components/ParticuleSpeedChart.js
// ⚠️ WARNING: This component is DISABLED - V_Particule field removed from backend
// Will be re-enabled when backend adds this data in future
// See FRONTEND_INTEGRATION_PROMPT.md for details
import React from "react";
import BaseChart from "@/components/BaseChart";

const ParticuleSpeedChart = ({ data, isRealTime }) => {
  return (
    <BaseChart
      data={data}
      isRealTime={isRealTime}
      title="Particule Speed (V_Particule)"
      yAxisLabel="Particule Speed"
      dataKey="V_Particule"
      lineColor="rgb(255, 206, 86)"
      backgroundColor="rgba(255, 206, 86, 0.3)"
      emptyMessage="No Particule Speed data available"
    />
  );
};

export default ParticuleSpeedChart;