// src/components/PressureChart.js
import React from "react";
import BaseChart from "@/components/BaseChart";

const PressureChart = ({ data, isRealTime }) => {
  return (
    <BaseChart
      data={data}
      isRealTime={isRealTime}
      title="Pressure (P_Gun)"
      yAxisLabel="Pressure"
      dataKey="P_Gun"
      lineColor="rgb(53, 162, 235)"
      backgroundColor="rgba(53, 162, 235, 0.5)"
      emptyMessage="No pressure data available"
    />
  );
};

export default PressureChart;