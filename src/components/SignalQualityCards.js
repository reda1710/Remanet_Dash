// src/components/SignalQualityCards.js
// Cards displaying signal quality indicators
import React from "react";

const SignalQualityCards = ({ analogData0 }) => {
  // Process data (using analog_0 as primary sensor)
  const dataArray = Array.isArray(analogData0) ? analogData0 : [];
  const latestData = dataArray.length > 0 ? dataArray[dataArray.length - 1] : null;

  const indicators = [
    {
      name: "Kurtosis",
      value: latestData?.kurtosis ?? 0,
      info: "Signal peakedness (3 = normal)",
      unit: "",
      getStatus: (val) => {
        const diff = Math.abs(val - 3);
        if (diff < 0.5) return "good";
        if (diff < 1.5) return "warning";
        return "critical";
      },
    },
    {
      name: "Zero Crossing Rate",
      value: latestData?.zero_crossing_rate ?? 0,
      info: "Frequency content indicator",
      unit: "",
      getStatus: (val) => {
        if (val > 0.1 && val < 0.3) return "good";
        if (val > 0.05 && val < 0.4) return "warning";
        return "critical";
      },
    },
    {
      name: "Peak-to-Peak",
      value: latestData?.peak_to_peak ?? 0,
      info: "Signal amplitude range",
      unit: "",
      getStatus: (val) => {
        if (val > 30 && val < 80) return "good";
        if (val > 20 && val < 100) return "warning";
        return "critical";
      },
    },
    {
      name: "RMS",
      value: latestData?.rms ?? 0,
      info: "Root mean square amplitude",
      unit: "",
      getStatus: (val) => {
        if (val > 20 && val < 60) return "good";
        if (val > 10 && val < 80) return "warning";
        return "critical";
      },
    },
  ];

  const getStatusColor = (status) => {
    switch (status) {
      case "good":
        return "bg-green-100 border-green-500 text-green-800";
      case "warning":
        return "bg-yellow-100 border-yellow-500 text-yellow-800";
      case "critical":
        return "bg-red-100 border-red-500 text-red-800";
      default:
        return "bg-gray-100 border-gray-500 text-gray-800";
    }
  };

  if (!latestData) {
    return (
      <div className="flex items-center justify-center bg-white rounded-lg shadow-lg p-4 h-96">
        <div className="text-center text-gray-500">
          <p>No signal quality data available</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-lg p-4">
      <h3 className="text-lg font-semibold mb-4 text-center">Signal Quality Indicators (Ultrasonic)</h3>
      <div className="grid grid-cols-2 gap-4">
        {indicators.map((indicator) => {
          const status = indicator.getStatus(indicator.value);
          const colorClass = getStatusColor(status);

          return (
            <div
              key={indicator.name}
              className={`border-l-4 rounded-lg p-4 ${colorClass}`}
            >
              <h4 className="font-semibold text-sm mb-1">{indicator.name}</h4>
              <p className="text-2xl font-bold mb-2">
                {indicator.value.toFixed(2)}
                {indicator.unit}
              </p>
              <p className="text-xs opacity-75">{indicator.info}</p>
              <div className="mt-2">
                <span className="text-xs font-semibold uppercase">{status}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default SignalQualityCards;
