"use client";

import React, { useState, useEffect, useRef } from "react";
import { 
  BarChart3, 
  LineChart as LineChartIcon, 
  PieChart as PieChartIcon, 
  Table as TableIcon, 
  Sparkles,
  TrendingUp,
  Award,
  Layers,
  Download,
  Maximize2,
  Minimize2,
  BarChartHorizontal,
  FileSpreadsheet
} from "lucide-react";
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  AreaChart, 
  Area, 
  PieChart, 
  Pie, 
  Cell,
  Legend,
  LabelList
} from "recharts";
import { ChartConfig } from "@/lib/api";

interface InteractiveChartStudioProps {
  chart: ChartConfig;
  data: Record<string, any>[];
}

export default function InteractiveChartStudio({ chart, data }: InteractiveChartStudioProps) {
  const [mounted, setMounted] = useState<boolean>(false);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [chartType, setChartType] = useState<"bar" | "horizontal" | "area" | "pie" | "table">(
    chart.chart_type === "line" ? "area" : (chart.chart_type as any) || "bar"
  );

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    setChartType(chart.chart_type === "line" ? "area" : (chart.chart_type as any) || "bar");
  }, [chart.chart_type]);

  const xKey = chart.x_key;
  const yKey = chart.y_key;

  // Process data with formatted numbers and percentage shares
  const values = data.map((d) => Number(d[yKey]) || 0);
  const totalVal = values.reduce((a, b) => a + b, 0);
  const avgVal = values.length > 0 ? totalVal / values.length : 0;
  const topItem = data.length > 0 ? data.reduce((prev, curr) => 
    (Number(curr[yKey]) || 0) > (Number(prev[yKey]) || 0) ? curr : prev
  , data[0]) : null;

  const chartData = data.map((item) => ({
    name: String(item[xKey] || "Item"),
    value: Number(item[yKey]) || 0,
    formatted: Number(item[yKey]) || 0,
    share: totalVal > 0 ? (((Number(item[yKey]) || 0) / totalVal) * 100).toFixed(1) : "0",
  }));

  const isCurrency = chart.y_label.toLowerCase().includes("revenue") || 
                     chart.y_label.toLowerCase().includes("price") || 
                     chart.y_label.toLowerCase().includes("cost") || 
                     chart.y_label.toLowerCase().includes("sales");

  const formatCurrency = (val: number) => {
    if (isCurrency) {
      if (Math.abs(val) >= 1000000) return `$${(val / 1000000).toFixed(1)}M`;
      if (Math.abs(val) >= 1000) return `$${(val / 1000).toFixed(1)}k`;
      return `$${val.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 1 })}`;
    }
    if (Math.abs(val) >= 1000000) return `${(val / 1000000).toFixed(1)}M`;
    if (Math.abs(val) >= 1000) return `${(val / 1000).toFixed(1)}k`;
    return val.toLocaleString();
  };

  const formatTooltipCurrency = (val: number) => {
    if (isCurrency) {
      return `$${val.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    }
    return val.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 });
  };

  const COLORS = [
    "#3b82f6", // Electric Blue
    "#6366f1", // Indigo
    "#8b5cf6", // Violet
    "#06b6d4", // Cyan
    "#10b981", // Emerald
    "#f59e0b", // Amber
    "#ec4899", // Rose Pink
    "#14b8a6", // Teal
  ];

  // Export data as CSV
  const handleExportCSV = () => {
    if (!data.length) return;
    const headers = [chart.x_label, chart.y_label, "Percentage Share (%)"];
    const rows = chartData.map(d => `"${d.name.replace(/"/g, '""')}",${d.value},${d.share}`);
    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `${chart.title.toLowerCase().replace(/[^a-z0-9]/g, "_")}_chart_data.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Custom Glassmorphic Tooltip
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const dataPoint = payload[0].payload;
      return (
        <div className="rounded-xl border border-slate-700/90 bg-slate-900/95 backdrop-blur-xl p-3.5 shadow-2xl text-xs space-y-1.5 z-50">
          <p className="font-bold text-white text-sm flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-brand-400 inline-block" />
            {dataPoint.name || label}
          </p>
          <div className="flex items-center justify-between gap-6 pt-1.5 border-t border-slate-800">
            <span className="text-slate-400">{chart.y_label}:</span>
            <span className="font-mono font-bold text-brand-300 text-sm">
              {formatTooltipCurrency(dataPoint.value)}
            </span>
          </div>
          <div className="flex items-center justify-between gap-6">
            <span className="text-slate-400">Relative Share:</span>
            <span className="font-mono text-emerald-400 font-semibold">{dataPoint.share}%</span>
          </div>
        </div>
      );
    }
    return null;
  };

  if (!mounted) {
    return (
      <div className="rounded-2xl border border-slate-800 bg-slate-950/80 p-6 h-80 flex items-center justify-center">
        <div className="flex items-center gap-2 text-slate-400 text-xs font-mono">
          <Sparkles className="w-4 h-4 animate-spin text-brand-400" />
          <span>Rendering visual chart studio...</span>
        </div>
      </div>
    );
  }

  return (
    <div className={`rounded-2xl border border-slate-800/90 bg-gradient-to-b from-slate-900/90 via-slate-950 to-slate-950 p-6 flex flex-col gap-6 shadow-2xl backdrop-blur-xl transition-all ${
      isFullscreen ? "fixed inset-4 z-50 overflow-y-auto bg-slate-950 border-brand-500/40 p-8" : ""
    }`}>
      {/* Studio Header & Visual Mode Switcher */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 border-b border-slate-800/80 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-brand-400" />
            <h4 className="text-base font-bold text-white tracking-tight">
              {chart.title}
            </h4>
          </div>
          <span className="text-xs text-slate-400 font-mono mt-0.5 block">
            {chart.x_label} vs {chart.y_label} • {chartData.length} Data Points
          </span>
        </div>

        {/* View Mode Controls & Actions */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Chart Type Pills */}
          <div className="flex items-center gap-1 bg-slate-900/90 border border-slate-800 rounded-xl p-1 text-xs">
            <button
              type="button"
              onClick={() => setChartType("bar")}
              className={`px-2.5 py-1.5 rounded-lg flex items-center gap-1.5 font-semibold transition cursor-pointer ${
                chartType === "bar"
                  ? "bg-brand-600 text-white shadow-md shadow-brand-500/20"
                  : "text-slate-400 hover:text-white"
              }`}
              title="Vertical Bar Chart"
            >
              <BarChart3 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Vertical</span>
            </button>
            <button
              type="button"
              onClick={() => setChartType("horizontal")}
              className={`px-2.5 py-1.5 rounded-lg flex items-center gap-1.5 font-semibold transition cursor-pointer ${
                chartType === "horizontal"
                  ? "bg-brand-600 text-white shadow-md shadow-brand-500/20"
                  : "text-slate-400 hover:text-white"
              }`}
              title="Horizontal Bar Chart"
            >
              <BarChartHorizontal className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Horizontal</span>
            </button>
            <button
              type="button"
              onClick={() => setChartType("area")}
              className={`px-2.5 py-1.5 rounded-lg flex items-center gap-1.5 font-semibold transition cursor-pointer ${
                chartType === "area"
                  ? "bg-brand-600 text-white shadow-md shadow-brand-500/20"
                  : "text-slate-400 hover:text-white"
              }`}
              title="Trend / Area Curve"
            >
              <LineChartIcon className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Trend</span>
            </button>
            <button
              type="button"
              onClick={() => setChartType("pie")}
              className={`px-2.5 py-1.5 rounded-lg flex items-center gap-1.5 font-semibold transition cursor-pointer ${
                chartType === "pie"
                  ? "bg-brand-600 text-white shadow-md shadow-brand-500/20"
                  : "text-slate-400 hover:text-white"
              }`}
              title="Donut Distribution"
            >
              <PieChartIcon className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Donut</span>
            </button>
            <button
              type="button"
              onClick={() => setChartType("table")}
              className={`px-2.5 py-1.5 rounded-lg flex items-center gap-1.5 font-semibold transition cursor-pointer ${
                chartType === "table"
                  ? "bg-brand-600 text-white shadow-md shadow-brand-500/20"
                  : "text-slate-400 hover:text-white"
              }`}
              title="Data Table"
            >
              <TableIcon className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Grid</span>
            </button>
          </div>

          {/* Export & Fullscreen */}
          <button
            type="button"
            onClick={handleExportCSV}
            className="p-2 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white transition cursor-pointer"
            title="Download Chart Data as CSV"
          >
            <Download className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="p-2 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white transition cursor-pointer"
            title={isFullscreen ? "Exit Fullscreen" : "Fullscreen View"}
          >
            {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* KPI Metric Summary Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
        <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800/80 flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-emerald-500/10 text-emerald-400 shrink-0 border border-emerald-500/20">
            <Award className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <span className="text-[10px] text-slate-500 uppercase block font-semibold">Leader</span>
            <span className="font-bold text-white truncate block font-mono text-sm" title={String(topItem?.[xKey] || "N/A")}>
              {String(topItem?.[xKey] || "N/A")}
            </span>
          </div>
        </div>

        <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800/80 flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-indigo-500/10 text-indigo-400 shrink-0 border border-indigo-500/20">
            <TrendingUp className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <span className="text-[10px] text-slate-500 uppercase block font-semibold">Peak Value</span>
            <span className="font-bold text-indigo-300 font-mono text-sm">
              {formatTooltipCurrency(Number(topItem?.[yKey]) || 0)}
            </span>
          </div>
        </div>

        <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800/80 flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-blue-500/10 text-blue-400 shrink-0 border border-blue-500/20">
            <Layers className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <span className="text-[10px] text-slate-500 uppercase block font-semibold">Total Aggregation</span>
            <span className="font-bold text-slate-200 font-mono text-sm">
              {formatTooltipCurrency(totalVal)}
            </span>
          </div>
        </div>

        <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800/80 flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-purple-500/10 text-purple-400 shrink-0 border border-purple-500/20">
            <Sparkles className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <span className="text-[10px] text-slate-500 uppercase block font-semibold">Category Average</span>
            <span className="font-bold text-purple-300 font-mono text-sm">
              {formatTooltipCurrency(avgVal)}
            </span>
          </div>
        </div>
      </div>

      {/* Main Chart Canvas */}
      <div 
        style={{ height: isFullscreen ? 500 : 380, width: "100%", minHeight: isFullscreen ? 500 : 380 }}
        className="w-full min-w-0 flex items-center justify-center pt-2"
      >
        {/* 1. Vertical Bar Chart */}
        {chartType === "bar" && (
          <ResponsiveContainer width="100%" height={isFullscreen ? 500 : 380} minWidth={0}>
            <BarChart data={chartData} margin={{ top: 20, right: 30, left: 15, bottom: 25 }}>
              <defs>
                {chartData.map((_, index) => (
                  <linearGradient key={`grad-${index}`} id={`barGrad-${index}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={COLORS[index % COLORS.length]} stopOpacity={0.95} />
                    <stop offset="100%" stopColor={COLORS[index % COLORS.length]} stopOpacity={0.35} />
                  </linearGradient>
                ))}
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
              <XAxis 
                dataKey="name" 
                stroke="#64748b" 
                tick={{ fill: "#94a3b8", fontSize: 12, fontWeight: 500 }}
                tickLine={false}
              />
              <YAxis 
                stroke="#64748b" 
                tick={{ fill: "#94a3b8", fontSize: 11 }}
                tickFormatter={formatCurrency}
                tickLine={false}
                axisLine={false}
              />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(51, 65, 85, 0.25)" }} />
              <Bar 
                dataKey="value" 
                radius={[8, 8, 0, 0]}
                animationDuration={700}
              >
                {chartData.map((_, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={`url(#barGrad-${index})`}
                    stroke={COLORS[index % COLORS.length]}
                    strokeWidth={1.5}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}

        {/* 2. Horizontal Bar Chart */}
        {chartType === "horizontal" && (
          <ResponsiveContainer width="100%" height={isFullscreen ? 500 : 380} minWidth={0}>
            <BarChart 
              data={chartData} 
              layout="vertical"
              margin={{ top: 15, right: 35, left: 35, bottom: 15 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" horizontal={false} />
              <XAxis 
                type="number"
                stroke="#64748b" 
                tick={{ fill: "#94a3b8", fontSize: 11 }}
                tickFormatter={formatCurrency}
                tickLine={false}
                axisLine={false}
              />
              <YAxis 
                type="category"
                dataKey="name" 
                stroke="#64748b" 
                tick={{ fill: "#e2e8f0", fontSize: 12, fontWeight: 600 }}
                tickLine={false}
                axisLine={false}
              />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(51, 65, 85, 0.25)" }} />
              <Bar 
                dataKey="value" 
                radius={[0, 8, 8, 0]}
                animationDuration={700}
              >
                {chartData.map((_, index) => (
                  <Cell 
                    key={`cell-h-${index}`} 
                    fill={COLORS[index % COLORS.length]}
                    fillOpacity={0.85}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}

        {/* 3. Real Area / Trend Curve */}
        {chartType === "area" && (
          <ResponsiveContainer width="100%" height={isFullscreen ? 500 : 380} minWidth={0}>
            <AreaChart data={chartData} margin={{ top: 20, right: 30, left: 15, bottom: 25 }}>
              <defs>
                <linearGradient id="areaGlow" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.55} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
              <XAxis 
                dataKey="name" 
                stroke="#64748b" 
                tick={{ fill: "#94a3b8", fontSize: 12 }}
                tickLine={false}
              />
              <YAxis 
                stroke="#64748b" 
                tick={{ fill: "#94a3b8", fontSize: 11 }}
                tickFormatter={formatCurrency}
                tickLine={false}
                axisLine={false}
              />
              <Tooltip content={<CustomTooltip />} />
              <Area 
                type="monotone" 
                dataKey="value" 
                stroke="#38bdf8" 
                strokeWidth={3}
                fillOpacity={1} 
                fill="url(#areaGlow)" 
                dot={{ r: 5, fill: "#38bdf8", stroke: "#0f172a", strokeWidth: 2 }}
                activeDot={{ r: 8, fill: "#ffffff", stroke: "#38bdf8", strokeWidth: 3 }}
                animationDuration={700}
              />
            </AreaChart>
          </ResponsiveContainer>
        )}

        {/* 4. Real Donut / Pie Distribution */}
        {chartType === "pie" && (
          <ResponsiveContainer width="100%" height={isFullscreen ? 500 : 380} minWidth={0}>
            <PieChart>
              <Tooltip content={<CustomTooltip />} />
              <Pie
                data={chartData}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="48%"
                innerRadius={68}
                outerRadius={112}
                paddingAngle={4}
                animationDuration={700}
              >
                {chartData.map((_, index) => (
                  <Cell 
                    key={`cell-pie-${index}`} 
                    fill={COLORS[index % COLORS.length]} 
                    stroke="#090d16"
                    strokeWidth={2}
                  />
                ))}
              </Pie>
              <Legend 
                verticalAlign="bottom" 
                height={40} 
                formatter={(val) => <span className="text-slate-300 text-xs font-medium ml-1 mr-3">{val}</span>}
              />
            </PieChart>
          </ResponsiveContainer>
        )}

        {/* 5. Real Data Grid Table */}
        {chartType === "table" && (
          <div className="w-full h-full overflow-auto rounded-xl border border-slate-800 bg-slate-950/60">
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-slate-900/90 text-slate-300 border-b border-slate-800 uppercase sticky top-0">
                <tr>
                  <th className="py-3 px-4">#</th>
                  <th className="py-3 px-4">{chart.x_label}</th>
                  <th className="py-3 px-4">{chart.y_label}</th>
                  <th className="py-3 px-4">Relative Share (%)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-300">
                {chartData.map((row, idx) => (
                  <tr key={idx} className="hover:bg-slate-900/40 transition">
                    <td className="py-3 px-4 text-slate-500">{idx + 1}</td>
                    <td className="py-3 px-4 font-semibold text-white flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[idx % COLORS.length] }} />
                      {row.name}
                    </td>
                    <td className="py-3 px-4 text-brand-300 font-bold">{formatTooltipCurrency(row.value)}</td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <div className="w-20 h-1.5 rounded-full bg-slate-800 overflow-hidden">
                          <div 
                            className="h-full bg-gradient-to-r from-brand-500 to-indigo-500 rounded-full" 
                            style={{ width: `${row.share}%` }}
                          />
                        </div>
                        <span className="text-slate-400 font-mono">{row.share}%</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
