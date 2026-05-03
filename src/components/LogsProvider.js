// src/components/LogsProvider.js

import React from "react";
import LogsDataProvider from "@/components/logsdataprovider";
import { FileText, Calendar, Clock, Database } from "lucide-react";

const LogsProvider = () => {
  const [logs, setLogs] = React.useState([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState(null);
  const [lastUpdated, setLastUpdated] = React.useState(null);
  const [filteredStats, setFilteredStats] = React.useState(null);
  const [dataSource, setDataSource] = React.useState("coldspray"); // coldspray, analog0, analog1

  const fetchLogs = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`http://localhost:8000/logs/?dataSource=${dataSource}`);
      if (!response.ok) {
        throw new Error(`Failed to fetch logs: ${response.status}`);
      }
      const result = await response.json();

      if (!result || !result.data) {
        throw new Error("Invalid data format from API");
      }

      setLogs(result.data);
      setLastUpdated(new Date().toLocaleTimeString());
    } catch (err) {
      console.error("Error fetching logs:", err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  React.useEffect(() => {
    fetchLogs();
  }, [dataSource]); // Re-fetch when dataSource changes

  // Calculate statistics from total logs
  const totalStats = React.useMemo(() => {
    if (!logs || logs.length === 0) {
      return { total: 0, dateRange: 'N/A', firstLog: 'N/A', lastLog: 'N/A' };
    }

    // Backend sends ISO strings, parse directly
    const dates = logs.map(log => new Date(log.Time)).sort((a, b) => a - b);
    const firstDate = dates[0]?.toLocaleDateString('en-GB') || 'N/A';
    const lastDate = dates[dates.length - 1]?.toLocaleDateString('en-GB') || 'N/A';
    const dateRange = firstDate === lastDate ? firstDate : `${firstDate} - ${lastDate}`;

    const firstTime = dates[0]?.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }) || 'N/A';
    const lastTime = dates[dates.length - 1]?.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }) || 'N/A';

    return {
      total: logs.length,
      dateRange,
      firstLog: `${firstDate} ${firstTime}`,
      lastLog: `${lastDate} ${lastTime}`
    };
  }, [logs]);

  // Use filtered stats if available, otherwise use total stats
  const displayStats = filteredStats || totalStats;

  // Get data source display name
  const getDataSourceName = () => {
    switch (dataSource) {
      case 'analog0':
        return 'Analog Sensor 0 (Ultrasonic)';
      case 'analog1':
        return 'Analog Sensor 1 (Acoustic)';
      case 'coldspray':
      default:
        return 'Cold Spray System';
    }
  };

  return (
    <div className="w-full min-h-screen bg-[#f0f0f0] py-6">
      <div className="max-w-screen-2xl mx-auto px-4">
        {/* Header Section */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-800 mb-2">
                System Logs
              </h1>
              <p className="text-gray-600">
                View and analyze {getDataSourceName()} operation logs
              </p>
            </div>
            <div className="flex items-center gap-3">
              {/* Data Source Selector */}
              <select
                value={dataSource}
                onChange={(e) => setDataSource(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-700 font-medium hover:border-gray-400 transition-colors"
              >
                <option value="coldspray">Cold Spray</option>
                <option value="analog0">Analog Sensor 0</option>
                <option value="analog1">Analog Sensor 1</option>
              </select>
              
              <button
                onClick={fetchLogs}
                disabled={isLoading}
                className="flex items-center gap-2 bg-[#41463b] text-white px-4 py-2 rounded-lg hover:bg-[#5a5e51] transition-colors disabled:opacity-50"
              >
                <Database className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                Refresh
              </button>
            </div>
          </div>

          {/* Statistics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <StatCard
              icon={<FileText className="w-6 h-6 text-blue-600" />}
              title="Total Records"
              value={displayStats.total}
              subtitle={filteredStats ? `Filtered from ${totalStats.total}` : (lastUpdated ? `Updated ${lastUpdated}` : 'Loading...')}
            />
            <StatCard
              icon={<Calendar className="w-6 h-6 text-green-600" />}
              title="Date Range"
              value={displayStats.dateRange}
              subtitle={filteredStats ? "Current filter" : "All data"}
            />
            <StatCard
              icon={<Clock className="w-6 h-6 text-orange-600" />}
              title="First Log"
              value={displayStats.firstLog}
              subtitle="Earliest record"
            />
            <StatCard
              icon={<Clock className="w-6 h-6 text-purple-600" />}
              title="Last Log"
              value={displayStats.lastLog}
              subtitle="Latest record"
            />
          </div>
        </div>

        {/* Logs Table */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <LogsDataProvider
            data={logs}
            isLoading={isLoading}
            error={error}
            onRefresh={fetchLogs}
            onFilteredDataChange={setFilteredStats}
            dataSource={dataSource}
          />
        </div>
      </div>
    </div>
  );
};

const StatCard = ({ icon, title, value, subtitle }) => (
  <div className="bg-white rounded-xl shadow-sm p-5 hover:shadow-md transition-shadow">
    <div className="flex items-center gap-3 mb-3">
      {icon}
      <h3 className="text-sm font-medium text-gray-600">{title}</h3>
    </div>
    <p className="text-xl font-bold text-gray-800 mb-1 truncate" title={value}>{value}</p>
    <p className="text-xs text-gray-500">{subtitle}</p>
  </div>
);

export default LogsProvider;
