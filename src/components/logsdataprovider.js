"use client";

import * as React from "react";
import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";

import {
  ArrowUpDown,
  ChevronDown,
  Search,
  X,
  Download,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

// Define columns for Cold Spray data - all important parameters
const createColdSprayColumns = () => [
  {
    accessorKey: "Time",
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        Time
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => {
      const timestamp = row.original.Time;
      if (!timestamp) return <div className="text-xs">N/A</div>;
      
      // Backend sends ISO strings, parse directly
      const date = new Date(timestamp);
      if (isNaN(date.getTime())) return <div className="text-xs">Invalid</div>;
      
      return (
        <div className="text-xs">
          {date.toLocaleString('en-GB', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
          }).replace(',', '')}
        </div>
      );
    },
  },
  {
    accessorKey: "T_Gun",
    header: ({ column }) => (
      <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
        T Gun (°C) <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => <span className="text-xs">{row.getValue("T_Gun")?.toFixed(2)}</span>,
  },
  {
    accessorKey: "P_Gun",
    header: ({ column }) => (
      <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
        P Gun (bar) <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => <span className="text-xs">{row.getValue("P_Gun")?.toFixed(3)}</span>,
  },
  {
    accessorKey: "Q_PG_N2",
    header: ({ column }) => (
      <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
        Q PG N₂ <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => <span className="text-xs">{row.getValue("Q_PG_N2")?.toFixed(2)}</span>,
  },
 
  {
    accessorKey: "T_WC",
    header: ({ column }) => (
      <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
        T WC (°C) <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => <span className="text-xs">{row.getValue("T_WC")?.toFixed(2)}</span>,
  },
  {
    accessorKey: "Q_WC",
    header: ({ column }) => (
      <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
        Q WC <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => <span className="text-xs">{row.getValue("Q_WC")?.toFixed(2)}</span>,
  },
  {
    accessorKey: "R_FP",
    header: ({ column }) => (
      <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
        R FP <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => <span className="text-xs">{row.getValue("R_FP")?.toFixed(2)}</span>,
  },
  {
    accessorKey: "U3_Input",
    header: ({ column }) => (
      <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
        U3 Input <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => <span className="text-xs">{row.getValue("U3_Input")?.toFixed(2)}</span>,
  },
];

// Define columns for Analog Sensor 0 (Ultrasonic)
const createAnalog0Columns = () => [
  {
    accessorKey: "Time",
    header: ({ column }) => (
      <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
        Time <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => {
      const timestamp = row.original.Time;
      if (!timestamp) return <div className="text-xs">N/A</div>;
      
      const date = new Date(timestamp);
      if (isNaN(date.getTime())) return <div className="text-xs">Invalid</div>;
      
      return (
        <div className="text-xs">
          {date.toLocaleString('en-GB', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
          }).replace(',', '')}
        </div>
      );
    },
  },
  {
    accessorKey: "RMS",
    header: ({ column }) => (
      <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
        RMS <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => <span className="text-xs">{row.getValue("RMS")?.toFixed(4)}</span>,
  },
  {
    accessorKey: "Spectral_Energy",
    header: ({ column }) => (
      <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
        Spectral Energy <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => <span className="text-xs">{row.getValue("Spectral_Energy")?.toFixed(4)}</span>,
  },
  {
    accessorKey: "Peak_Frequency",
    header: ({ column }) => (
      <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
        Peak Freq (Hz) <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => <span className="text-xs">{row.getValue("Peak_Frequency")?.toFixed(2)}</span>,
  },
];

// Define columns for Analog Sensor 1 (Acoustic)
const createAnalog1Columns = () => [
  {
    accessorKey: "Time",
    header: ({ column }) => (
      <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
        Time <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => {
      const timestamp = row.original.Time;
      if (!timestamp) return <div className="text-xs">N/A</div>;
      
      const date = new Date(timestamp);
      if (isNaN(date.getTime())) return <div className="text-xs">Invalid</div>;
      
      return (
        <div className="text-xs">
          {date.toLocaleString('en-GB', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
          }).replace(',', '')}
        </div>
      );
    },
  },
  {
    accessorKey: "RMS",
    header: ({ column }) => (
      <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
        RMS <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => <span className="text-xs">{row.getValue("RMS")?.toFixed(4)}</span>,
  },
  {
    accessorKey: "Spectral_Energy",
    header: ({ column }) => (
      <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
        Spectral Energy <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => <span className="text-xs">{row.getValue("Spectral_Energy")?.toFixed(4)}</span>,
  },
  {
    accessorKey: "Acoustic_Derivative",
    header: ({ column }) => (
      <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
        Acoustic Deriv <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => <span className="text-xs">{row.getValue("Acoustic_Derivative")?.toFixed(4)}</span>,
  },
  {
    accessorKey: "Peak_Frequency",
    header: ({ column }) => (
      <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
        Peak Freq (Hz) <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => <span className="text-xs">{row.getValue("Peak_Frequency")?.toFixed(2)}</span>,
  },
];

// Main column selection function - returns columns based on data source
const createColumns = (dataSource = 'coldspray') => {
  const baseColumns = [
    {
      id: "select",
      enableSorting: false,
      enableHiding: false,
    }
  ];

  let dataColumns;
  switch (dataSource) {
    case 'analog0':
      dataColumns = createAnalog0Columns();
      break;
    case 'analog1':
      dataColumns = createAnalog1Columns();
      break;
    case 'coldspray':
    default:
      dataColumns = createColdSprayColumns();
      break;
  }

  return [...baseColumns, ...dataColumns];
};

export default function LogsDataProvider({ data, isLoading, error, onRefresh, onFilteredDataChange, dataSource = 'coldspray' }) {
  const [sorting, setSorting] = React.useState([]);
  const [columnFilters, setColumnFilters] = React.useState([]);
  const [columnVisibility, setColumnVisibility] = React.useState({});
  const [globalFilter, setGlobalFilter] = React.useState("");
  const [dateRange, setDateRange] = React.useState({ from: "", to: "" });

  // Fetch data on mount
  React.useEffect(() => {
    onRefresh();
  }, []);

  const columns = React.useMemo(() => createColumns(dataSource), [dataSource]);

  const table = useReactTable({
    data,
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onGlobalFilterChange: setGlobalFilter,
    getPaginationRowModel: getPaginationRowModel(),
    initialState: { pagination: { pageSize: 15 } },
    state: { sorting, columnFilters, columnVisibility, globalFilter },
  });

  // Update parent component with filtered data stats
  React.useEffect(() => {
    const filteredRows = table.getFilteredRowModel().rows;
    if (filteredRows.length > 0 && onFilteredDataChange) {
      const filteredData = filteredRows.map(row => row.original);
      const dates = filteredData.map(log => new Date(log.Time)).sort((a, b) => a - b);
      
      const firstDate = dates[0]?.toLocaleDateString('en-GB') || 'N/A';
      const lastDate = dates[dates.length - 1]?.toLocaleDateString('en-GB') || 'N/A';
      const dateRange = firstDate === lastDate ? firstDate : `${firstDate} - ${lastDate}`;

      const firstTime = dates[0]?.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }) || 'N/A';
      const lastTime = dates[dates.length - 1]?.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }) || 'N/A';

      onFilteredDataChange({
        total: filteredData.length,
        dateRange,
        firstLog: `${firstDate} ${firstTime}`,
        lastLog: `${lastDate} ${lastTime}`
      });
    } else if (filteredRows.length === 0 && onFilteredDataChange) {
      onFilteredDataChange({
        total: 0,
        dateRange: 'No data',
        firstLog: 'N/A',
        lastLog: 'N/A'
      });
    }
  }, [table.getFilteredRowModel().rows, onFilteredDataChange]);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  const handleDateRangeFilter = () => {
    const timeCol = table.getColumn("Time");
    if (timeCol && (dateRange.from || dateRange.to)) {
      timeCol.setFilterValue({ from: dateRange.from, to: dateRange.to });
    }
  };

  const clearAllFilters = () => {
    setGlobalFilter("");
    setDateRange({ from: "", to: "" });
    table.resetColumnFilters();
  };

  const exportToCSV = () => {
    const rows = table.getFilteredRowModel().rows;
    if (rows.length === 0) return;

    const headers = table.getAllColumns()
      .filter(col => col.getIsVisible() && col.id !== 'select')
      .map(col => col.id);

    const csvContent = [
      headers.join(','),
      ...rows.map(row =>
        headers.map(header => {
          const value = row.getValue(header);
          return typeof value === 'string' ? `"${value}"` : value;
        }).join(',')
      )
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `logs_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  return (
    <div className="w-full space-y-4">
      {/* Filters Section */}
      <div className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center gap-3">
          {/* Global Search */}
          <div className="relative flex-1 min-w-[250px]">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Search all columns..."
              value={globalFilter}
              onChange={(e) => setGlobalFilter(e.target.value)}
              className="pl-9 h-10"
            />
            {globalFilter && (
              <button
                onClick={() => setGlobalFilter("")}
                className="absolute right-2 top-1/2 transform -translate-y-1/2"
              >
                <X className="w-4 h-4 text-gray-400 hover:text-gray-600" />
              </button>
            )}
          </div>

          {/* Date Range */}
          <div className="flex items-center gap-2">
            <Input
              type="date"
              placeholder="From"
              value={dateRange.from}
              onChange={(e) => setDateRange(prev => ({ ...prev, from: e.target.value }))}
              className="w-40 h-10"
            />
            <span className="text-gray-500">to</span>
            <Input
              type="date"
              placeholder="To"
              value={dateRange.to}
              onChange={(e) => setDateRange(prev => ({ ...prev, to: e.target.value }))}
              className="w-40 h-10"
            />
            <Button variant="outline" size="sm" onClick={handleDateRangeFilter}>
              Apply
            </Button>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 ml-auto">
            <Button
              variant="outline"
              size="sm"
              onClick={clearAllFilters}
              className="h-10"
            >
              <X className="w-4 h-4 mr-1" />
              Clear Filters
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={exportToCSV}
              className="h-10"
            >
              <Download className="w-4 h-4 mr-1" />
              Export CSV
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="h-10">
                  Columns <ChevronDown className="ml-2 h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {table.getAllColumns()
                  .filter(col => col.getCanHide())
                  .map(col => (
                    <DropdownMenuCheckboxItem
                      key={col.id}
                      className="capitalize"
                      checked={col.getIsVisible()}
                      onCheckedChange={v => col.toggleVisibility(!!v)}
                    >{col.id}</DropdownMenuCheckboxItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Active Filters Display */}
        {(globalFilter || dateRange.from || dateRange.to) && (
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <span>Active filters:</span>
            {globalFilter && (
              <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded">
                Search: "{globalFilter}"
              </span>
            )}
            {(dateRange.from || dateRange.to) && (
              <span className="bg-green-100 text-green-700 px-2 py-1 rounded">
                Date: {dateRange.from || '...'} to {dateRange.to || '...'}
              </span>
            )}
          </div>
        )}
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {/* Table display */}
      <div className="rounded-lg border shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-gray-50">
              {table.getHeaderGroups().map(hg => (
                <TableRow key={hg.id}>
                  {hg.headers.map(header => (
                    <TableHead 
                      key={header.id}
                      className="text-center align-middle font-semibold"
                    >
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                    </TableHead>
                  ))}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {table.getRowModel().rows.length > 0 ? (
                table.getRowModel().rows.map(row => (
                  <TableRow 
                    key={row.id}
                    className="hover:bg-gray-50 transition-colors"
                  >
                    {row.getVisibleCells().map(cell => (
                      <TableCell 
                        key={cell.id}
                        className="text-center align-middle"
                      >
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext()
                        )}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={table.getAllColumns().length}
                    className="h-32 text-center align-middle text-gray-500"
                  >
                    No logs found. Try adjusting your filters.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between">
        <div className="text-sm text-gray-600">
          Showing {table.getFilteredRowModel().rows.length > 0 ? (table.getState().pagination.pageIndex * table.getState().pagination.pageSize) + 1 : 0} to{' '}
          {Math.min((table.getState().pagination.pageIndex + 1) * table.getState().pagination.pageSize, table.getFilteredRowModel().rows.length)} of{' '}
          {table.getFilteredRowModel().rows.length} results
        </div>
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => table.previousPage()} 
            disabled={!table.getCanPreviousPage()}
          >
            Previous
          </Button>
          <span className="text-sm text-gray-600">
            Page {table.getState().pagination.pageIndex + 1} of {table.getPageCount()}
          </span>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => table.nextPage()} 
            disabled={!table.getCanNextPage()}
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  );
}
