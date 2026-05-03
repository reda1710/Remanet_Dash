/**
 * Chart.js Helper Utilities
 * 
 * Time window filtering and chart configuration helpers
 */

/**
 * Filter data by time window
 * 
 * @param {Array} data - Data array with unix_timestamp field
 * @param {string} timeWindow - '5min' | '15min' | '30min' | '1hr' | '6hr' | '24hr' | 'all'
 * @returns {Array} Filtered data
 */
export function filterByTimeWindow(data, timeWindow = '30min') {
  if (!data || data.length === 0) return [];
  
  // In 'all' mode, return all data without filtering (used for historical mode)
  if (timeWindow === 'all') return data;
  
  const now = Date.now() / 1000; // Current time in seconds
  
  // Convert time window to seconds
  const windowSeconds = {
    '5min': 5 * 60,
    '15min': 15 * 60,
    '30min': 30 * 60,
    '1hr': 60 * 60,
    '6hr': 6 * 60 * 60,
    '24hr': 24 * 60 * 60
  }[timeWindow] || 30 * 60;
  
  const cutoffTime = now - windowSeconds;
  
  // Filter data where timestamp > cutoff
  return data.filter(point => {
    const timestamp = point.unix_timestamp || point.Time || point.timestamp;
    return timestamp >= cutoffTime;
  });
}

/**
 * Decimate data for performance (reduce number of points)
 * 
 * @param {Array} data - Data array
 * @param {number} maxPoints - Maximum number of points to keep (default: 500)
 * @returns {Array} Decimated data
 */
export function decimateData(data, maxPoints = 500) {
  if (!data || data.length <= maxPoints) return data;
  
  const step = Math.ceil(data.length / maxPoints);
  return data.filter((_, index) => index % step === 0);
}

/**
 * Format timestamp for display
 * 
 * @param {number} timestamp - Unix timestamp (seconds)
 * @returns {string} Formatted time string
 */
export function formatTimestamp(timestamp) {
  const date = new Date(timestamp * 1000);
  return date.toLocaleTimeString();
}

/**
 * Create default chart options with zoom and pan
 * 
 * @param {Object} overrides - Custom options to merge
 * @returns {Object} Chart.js options
 */
export function createChartOptions(overrides = {}) {
  return {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: 'index',
      intersect: false,
    },
    plugins: {
      zoom: {
        pan: {
          enabled: true,
          mode: 'x',
        },
        zoom: {
          wheel: {
            enabled: true,
          },
          pinch: {
            enabled: true
          },
          mode: 'x',
        }
      },
      legend: {
        position: 'top',
      },
      tooltip: {
        enabled: true,
        mode: 'index',
        intersect: false,
      }
    },
    scales: {
      x: {
        type: 'time',
        time: {
          displayFormats: {
            second: 'HH:mm:ss',
            minute: 'HH:mm',
            hour: 'HH:mm'
          }
        },
        title: {
          display: true,
          text: 'Time'
        }
      },
      y: {
        beginAtZero: false,
        title: {
          display: true,
          text: 'Value'
        }
      }
    },
    ...overrides
  };
}
