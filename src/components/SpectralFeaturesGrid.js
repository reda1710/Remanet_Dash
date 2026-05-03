// src/components/SpectralFeaturesGrid.js
// Small multiples showing key spectral features
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
  Filler,
} from "chart.js";
import { Line } from "react-chartjs-2";

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler);

const SpectralFeaturesGrid = ({ analogData0, isRealTime }) => {
  // Process data (using analog_0 as primary sensor)
  const dataArray = Array.isArray(analogData0) ? analogData0 : [];

  const features = [
    { name: "Spectral Energy", field: "spectral_energy", color: "rgb(54, 162, 235)" },
    { name: "Spectral Centroid", field: "spectral_centroid", color: "rgb(255, 99, 132)" },
    { name: "High Band Ratio", field: "high_band_ratio", color: "rgb(75, 192, 192)" },
    { name: "Energy Entropy", field: "energy_entropy", color: "rgb(153, 102, 255)" },
  ];

  const createChartData = (field, color) => {
    const labels = dataArray.map((_, index) => index);
    const data = dataArray.map((item) => item[field] ?? 0);

    return {
      labels,
      datasets: [
        {
          data,
          borderColor: color,
          backgroundColor: color.replace("rgb", "rgba").replace(")", ", 0.2)"),
          fill: true,
          tension: 0.4,
          pointRadius: 1,
        },
      ],
    };
  };

  const miniChartOptions = (title) => ({
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      title: {
        display: true,
        text: title,
        font: { size: 12 },
      },
    },
    scales: {
      y: {
        display: true,
        ticks: { font: { size: 10 } },
      },
      x: {
        display: false,
      },
    },
  });

  if (dataArray.length === 0) {
    return (
      <div className="flex items-center justify-center bg-white rounded-lg shadow-lg p-4 h-96">
        <div className="text-center text-gray-500">
          <p>No spectral features data available</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-lg p-4">
      <h3 className="text-lg font-semibold mb-4 text-center">Spectral Features (Ultrasonic Sensor)</h3>
      <div className="grid grid-cols-2 gap-4">
        {features.map((feature) => (
          <div key={feature.field} className="h-48">
            <Line
              data={createChartData(feature.field, feature.color)}
              options={miniChartOptions(feature.name)}
            />
          </div>
        ))}
      </div>
    </div>
  );
};

export default SpectralFeaturesGrid;
