// src/components/FrequencyAnalysisChart.js
// Frequency domain analysis chart showing dominant frequency over time
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
import { Scatter } from "react-chartjs-2";

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

const FrequencyAnalysisChart = ({ analogData0, analogData1, isRealTime }) => {
  // Process data
  const dataArray0 = Array.isArray(analogData0) ? analogData0 : [];
  const dataArray1 = Array.isArray(analogData1) ? analogData1 : [];

  // Extract timestamps and dominant frequency values
  const scatterData0 = dataArray0.map((item, index) => ({
    x: index,
    y: item.dominant_freq ?? 0,
  }));

  const scatterData1 = dataArray1.map((item, index) => ({
    x: index,
    y: item.dominant_freq ?? 0,
  }));

  const chartData = {
    datasets: [
      {
        label: "Ultrasonic Frequency (analog_0)",
        data: scatterData0,
        backgroundColor: "rgba(126, 87, 194, 0.8)",
        pointRadius: 5,
      },
      {
        label: "Acoustic Frequency (analog_1)",
        data: scatterData1,
        backgroundColor: "rgba(255, 112, 67, 0.8)",
        pointRadius: 5,
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
        text: "Dominant Frequency Analysis",
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        title: {
          display: true,
          text: "Frequency (Hz)",
        },
      },
      x: {
        title: {
          display: true,
          text: "Sample Index",
        },
      },
    },
  };

  if (dataArray0.length === 0 && dataArray1.length === 0) {
    return (
      <div className="flex items-center justify-center bg-white rounded-lg shadow-lg p-4 h-96">
        <div className="text-center text-gray-500">
          <p>No frequency data available</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-lg p-4 h-96">
      <Scatter data={chartData} options={options} />
    </div>
  );
};

export default FrequencyAnalysisChart;
