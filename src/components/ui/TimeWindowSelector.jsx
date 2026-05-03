/**
 * TimeWindowSelector Component
 * 
 * Dropdown selector for time window filtering
 */

import React from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const TIME_WINDOWS = [
  { value: '5min', label: 'Last 5 minutes' },
  { value: '15min', label: 'Last 15 minutes' },
  { value: '30min', label: 'Last 30 minutes' },
  { value: '1hr', label: 'Last 1 hour' },
  { value: '6hr', label: 'Last 6 hours' },
  { value: '24hr', label: 'Last 24 hours' },
  { value: 'all', label: 'All data' }
];

export default function TimeWindowSelector({ value, onChange, className = '' }) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className={`w-[180px] ${className}`}>
        <SelectValue placeholder="Select time window" />
      </SelectTrigger>
      <SelectContent>
        {TIME_WINDOWS.map(window => (
          <SelectItem key={window.value} value={window.value}>
            {window.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
