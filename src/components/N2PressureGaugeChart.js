// src/components/N2PressureGaugeChart.js
// Gauge chart for P_N2_Input (N2 Input Pressure)
import React from 'react';
import { Doughnut } from 'react-chartjs-2';

const N2PressureGaugeChart = ({ data }) => {
  // Handle both data formats (array or object with cold_spray property)
  const dataArray = Array.isArray(data) ? data : (data?.cold_spray || []);
  
  // Get the most recent P_N2_Input value
  const currentValue = dataArray.length > 0 && dataArray[dataArray.length - 1]?.P_N2_Input != null
    ? dataArray[dataArray.length - 1].P_N2_Input
    : 0;
  
  // Define min and max values for the gauge
  const minValue = 0;
  const maxValue = 70; // Typical range for N2 pressure (bar)
  
  // Calculate percentage for gauge display
  const percentage = Math.min(100, Math.max(0, (currentValue - minValue) / (maxValue - minValue) * 100));
  
  // Define color based on value (threshold at 55 bar)
  const getColor = (value) => {
    if (value < 45) return 'rgba(255, 99, 132, 1)'; // low - red
    if (value < 55) return 'rgba(75, 192, 192, 1)'; // optimal - green
    return 'rgba(255, 205, 86, 1)'; // high - yellow
  };
  
  const color = getColor(currentValue);
  
  // Chart data
  const chartData = {
    datasets: [
      {
        data: [percentage, 100 - percentage],
        backgroundColor: [
          color,
          'rgba(220, 220, 220, 0.5)'
        ],
        borderWidth: 0,
        circumference: 180,
        rotation: 270,
      }
    ]
  };

  // Chart options
  const options = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: '75%',
    plugins: {
      legend: {
        display: false
      },
      title: {
        display: true,
        text: "N2 Input Pressure",
      },
      tooltip: {
        enabled: false
      }
    }
  };

  // Handle cases where no data is available
  if (dataArray.length === 0) {
    return (
      <div className="flex items-center justify-center bg-white rounded-lg shadow-lg p-4 h-96">
        <div className="text-center text-gray-500">
          <p>No N2 pressure data available</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative flex flex-col items-center justify-center bg-white rounded-lg shadow-lg p-4 h-96">
      <div className="text-lg font-semibold mt-10">N2 Pressure</div>
      <Doughnut data={chartData} options={options} />
      <div className="absolute top-[70%] left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center">
        <div className="text-3xl font-bold mt-10">{(currentValue ?? 0).toFixed(1)}</div>
        <div className="text-gray-500">bar</div>
      </div>
    </div>
  );
};

export default N2PressureGaugeChart;
