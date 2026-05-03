"use client";

import React, { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useWebSocketConnection } from "@/utils/websocketConnection";
import { Activity, Database, Zap, Clock } from "lucide-react";

const Home = () => {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { data, isConnected, lastUpdated } = useWebSocketConnection();
  const [systemStatus, setSystemStatus] = useState(null);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/");
    }
  }, [status, router]);

  // Calculate system status from WebSocket data
  useEffect(() => {
    if (data?.cold_spray && data.cold_spray.length > 0) {
      setSystemStatus({
        connected: isConnected,
        activeSensors: 5,
        lastUpdate: lastUpdated
      });
    } else if (isConnected) {
      setSystemStatus({
        connected: isConnected,
        activeSensors: 5,
        lastUpdate: lastUpdated
      });
    }
  }, [data, isConnected, lastUpdated]);

  if (!session) {
    return (
      <div className="w-full h-screen flex items-center justify-center bg-[#f0f0f0]">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-800 mb-4">Access Denied</h1>
          <p className="text-gray-600">Please sign in to access the dashboard</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full min-h-screen bg-[#f0f0f0] flex flex-col">
      <div className="flex-1">
        {/* Hero Section */}
        <section className="max-w-screen-2xl mx-auto px-4 py-6">
          <div className="bg-gradient-to-r from-[#41463b] to-[#707766] text-white rounded-2xl shadow-lg p-8">
            <div className="flex flex-col lg:flex-row items-center justify-between gap-6">
              <div className="flex-1">
                <h1 className="text-3xl lg:text-4xl font-bold mb-3">
                  RemaNet Cold Spray Monitoring System
                </h1>
                <p className="text-lg text-gray-200 mb-6">
                  AI-Powered Predictive Maintenance for Nozzle Clog Detection
                </p>
                <div className="flex flex-wrap gap-3">
                  <button
                    onClick={() => router.push("/sensors/ColdSpray")}
                    className="bg-white text-[#41463b] px-6 py-2.5 rounded-lg font-semibold hover:bg-gray-100 transition-colors"
                  >
                    Open Dashboard
                  </button>
                  <button
                    onClick={() => router.push("/logs")}
                    className="bg-[#707766] text-white px-6 py-2.5 rounded-lg font-semibold hover:bg-[#5a5e51] transition-colors border border-white/20"
                  >
                    View Logs
                  </button>
                </div>
              </div>
              
              {/* System Status Indicator */}
              {systemStatus && (
                <div className="bg-white/10 backdrop-blur-md rounded-xl p-5 min-w-[260px] border border-white/20">
                  <h3 className="text-base font-semibold mb-3 flex items-center gap-2">
                    <Activity className="w-4 h-4" />
                    System Status
                  </h3>
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Connection</span>
                      <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                        systemStatus.connected ? 'bg-green-500' : 'bg-red-500'
                      }`}>
                        {systemStatus.connected ? '● Online' : '○ Offline'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Active Sensors</span>
                      <span className="font-semibold text-sm">{systemStatus.activeSensors}/5</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Last Update</span>
                      <span className="font-semibold text-xs">{systemStatus.lastUpdate || 'N/A'}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>

      {/* System Overview */}
      <section className="max-w-screen-2xl mx-auto px-4 py-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-6">System Overview</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          <StatCard
            title="Connection Status"
            value={isConnected ? "Active" : "Disconnected"}
            unit=""
            icon={<Zap className="w-7 h-7" />}
            trend="WebSocket Live"
            color={isConnected ? "green" : "red"}
          />
          <StatCard
            title="Data Capacity"
            value="Real-Time"
            unit=""
            icon={<Database className="w-7 h-7" />}
            trend="Unlimited streaming"
            color="blue"
          />
          <StatCard
            title="Sensor Network"
            value="5"
            unit="active"
            icon={<Activity className="w-7 h-7" />}
            trend="Real-time monitoring"
            color="purple"
          />
          <StatCard
            title="Update Frequency"
            value="<1"
            unit="sec"
            icon={<Clock className="w-7 h-7" />}
            trend="Sub-second latency"
            color="orange"
          />
        </div>
      </section>

      {/* About Section */}
      <section className="max-w-screen-2xl mx-auto px-4 py-6 pb-10">
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-8 shadow-sm">
          <h3 className="text-xl font-bold text-gray-800 mb-4">About This System</h3>
          <p className="text-gray-700 leading-relaxed mb-6">
            The RemaNet Cold Spray Monitoring System is part of the WP6.2 research project at LGIPM, 
            Lorraine University. It represents the first fully integrated AI-based predictive maintenance 
            solution for nozzle clog detection in Cold Spray Additive Manufacturing (CSAM). 
            The system combines multi-sensor data fusion with advanced LSTM neural networks to predict 
            nozzle clogging events before they impact production quality.
          </p>
        </div>
      </section>
      </div>

      {/* Footer */}
      <footer className="bg-[#41463b] text-white py-6 mt-auto">
        <div className="max-w-screen-2xl mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="text-center md:text-left">
              <p className="text-sm">&copy; {new Date().getFullYear()} LGIPM - Lorraine University</p>
              <p className="text-xs text-gray-300 mt-1">RemaNet Cold Spray Monitoring System</p>
            </div>
            <div className="flex flex-wrap justify-center gap-6 text-sm">
              <a href="#" className="text-gray-300 hover:text-white transition-colors">Privacy Policy</a>
              <a href="#" className="text-gray-300 hover:text-white transition-colors">Terms of Service</a>
              <a href="#" className="text-gray-300 hover:text-white transition-colors">Contact</a>
            </div>
            <div className="text-center md:text-right text-xs text-gray-300">
              <p>RemaNet</p>
              <p className="mt-1">Version 1.0.0</p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

// Reusable Components
const StatCard = ({ title, value, unit, icon, trend, color }) => {
  const colorClasses = {
    blue: "text-blue-600",
    green: "text-green-600",
    red: "text-red-600",
    purple: "text-purple-600",
    orange: "text-orange-600"
  };

  return (
    <div className="bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow p-5">
      <div className="flex items-center justify-between mb-3">
        <span className={colorClasses[color]}>{icon}</span>
      </div>
      <h3 className="text-gray-600 text-xs font-medium mb-1 uppercase tracking-wide">{title}</h3>
      <div className="flex items-baseline gap-2 mb-1">
        <span className="text-2xl font-bold text-gray-800">{value}</span>
        {unit && <span className="text-gray-500 text-sm">{unit}</span>}
      </div>
      <span className="text-xs text-gray-500">{trend}</span>
    </div>
  );
};

const InfoBadge = ({ label, value }) => (
  <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-lg shadow-sm">
    <span className="text-gray-600 text-sm">{label}:</span>
    <span className="font-semibold text-gray-800">{value}</span>
  </div>
);

export default Home;
