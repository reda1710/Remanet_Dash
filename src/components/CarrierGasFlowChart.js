// src/components/CarrierGasFlowChart.js
// ⚠️ WARNING: This component is DISABLED - Q_CG_PF2 field removed from backend
// Currently only Q_CG_PF1 is available. Q_CG_PF2 will be added in future
// See FRONTEND_INTEGRATION_PROMPT.md for details
import React from "react";
import BaseChart from "@/components/BaseChart";

const CarrierGasFlowChart = ({ data, isRealTime }) => {
  return (
    <BaseChart
      data={data}
      isRealTime={isRealTime}
      title="Carrier Gas Flow (Q_CG_PF1 & Q_CG_PF2)"
      yAxisLabel="Flow Rate"
      dataKey="Q_CG_PF1"
      lineColor="rgb(75,192,192)"
      backgroundColor="transparent"
      dataKey1="Q_CG_PF2"
      lineColor1="rgb(255,99,132)"
      backgroundColor1="transparent"
      emptyMessage="No flow rate data available"
    />
  );
};

export default CarrierGasFlowChart;
