// src/components/RMSComparisonChart.js
// Dual sensor RMS comparison chart for analog_0 (ultrasonic) vs analog_1 (acoustic)
import React from "react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import { Line } from "react-chartjs-2";

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

const RMSComparisonChart = ({ analogData0, analogData1, isRealTime }) => {
  // Process data
  const dataArray0 = Array.isArray(analogData0) ? analogData0 : [];
  const dataArray1 = Array.isArray(analogData1) ? analogData1 : [];

  // Extract timestamps and RMS values
  const labels = dataArray0.map((item) => {
    const date = new Date(item.Time * 1000);
    return date.toLocaleTimeString();
  });

  const rmsData0 = dataArray0.map((item) => item.rms ?? 0);
  const rmsData1 = dataArray1.map((item) => item.rms ?? 0);

  const chartData = {
    labels,
    datasets: [
      {
        label: "Ultrasonic RMS (analog_0)",
        data: rmsData0,
        borderColor: "rgb(126, 87, 194)",
        backgroundColor: "rgba(126, 87, 194, 0.3)",
        tension: 0.4,
      },
      {
        label: "Acoustic RMS (analog_1)",
        data: rmsData1,
        borderColor: "rgb(255, 112, 67)",
        backgroundColor: "rgba(255, 112, 67, 0.3)",
        tension: 0.4,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "top",
      },
      title: {
        display: true,
        text: "RMS Energy Comparison - Ultrasonic vs Acoustic",
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        title: {
          display: true,
          text: "RMS Amplitude",
        },
      },
      x: {
        title: {
          display: true,
          text: "Time",
        },
      },
    },
  };

  if (dataArray0.length === 0 && dataArray1.length === 0) {
    return (
      <div className="flex items-center justify-center bg-white rounded-lg shadow-lg p-4 h-96">
        <div className="text-center text-gray-500">
          <p>No analog sensor data available</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-lg p-4 h-96">
      <Line data={chartData} options={options} />
    </div>
  );
};

export default RMSComparisonChart;
