// src/components/NewKPIsChart.js
// Multi-line chart for new KPI fields
import React from "react";
import BaseChart from "@/components/BaseChart";

const NewKPIsChart = ({ data, isRealTime, selectedKPI = "σ_P" }) => {
  const kpiConfigs = {
    "σ_P": {
      title: "Pressure Standard Deviation (σ_P)",
      yAxisLabel: "Std Dev (bar)",
      dataKey: "σ_P",
      lineColor: "rgb(153, 102, 255)",
      backgroundColor: "rgba(153, 102, 255, 0.3)"
    },
    "R_FP": {
      title: "Feed Rate Ratio (R_FP)",
      yAxisLabel: "Ratio",
      dataKey: "R_FP",
      lineColor: "rgb(255, 159, 64)",
      backgroundColor: "rgba(255, 159, 64, 0.3)"
    },
    "U3_Input": {
      title: "Input Voltage (U3_Input)",
      yAxisLabel: "Voltage (V)",
      dataKey: "U3_Input",
      lineColor: "rgb(54, 162, 235)",
      backgroundColor: "rgba(54, 162, 235, 0.3)"
    },
    "ṁ_pow": {
      title: "Powder Mass Flow (ṁ_pow)",
      yAxisLabel: "Flow (g/min)",
      dataKey: "ṁ_pow",
      lineColor: "rgb(75, 192, 192)",
      backgroundColor: "rgba(75, 192, 192, 0.3)"
    },
    "P_PF1": {
      title: "Powder Feeder 1 Pressure (P_PF1)",
      yAxisLabel: "Pressure (bar)",
      dataKey: "P_PF1",
      lineColor: "rgb(255, 99, 132)",
      backgroundColor: "rgba(255, 99, 132, 0.3)"
    },
    "P_N2_Input": {
      title: "N2 Input Pressure (P_N2_Input)",
      yAxisLabel: "Pressure (bar)",
      dataKey: "P_N2_Input",
      lineColor: "rgb(201, 203, 207)",
      backgroundColor: "rgba(201, 203, 207, 0.3)"
    },
    "P_Air_Input": {
      title: "Air Input Pressure (P_Air_Input)",
      yAxisLabel: "Pressure (bar)",
      dataKey: "P_Air_Input",
      lineColor: "rgb(255, 205, 86)",
      backgroundColor: "rgba(255, 205, 86, 0.3)"
    }
  };

  const config = kpiConfigs[selectedKPI] || kpiConfigs["σ_P"];

  return (
    <BaseChart
      data={data}
      isRealTime={isRealTime}
      title={config.title}
      yAxisLabel={config.yAxisLabel}
      dataKey={config.dataKey}
      lineColor={config.lineColor}
      backgroundColor={config.backgroundColor}
      emptyMessage={`No ${selectedKPI} data available`}
    />
  );
};

export default NewKPIsChart;
