"use client";

import React, { useState } from "react";
import { 
  Table, 
  Columns, 
  Hash, 
  Layers, 
  Copy, 
  Check, 
  FileCheck2, 
  BarChart3, 
  AlertTriangle,
  Info,
  PieChart as PieChartIcon,
  TrendingUp,
  Sparkles
} from "lucide-react";
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip as RechartsTooltip, 
  PieChart, 
  Pie, 
  Cell, 
  Legend 
} from "recharts";
import { DatasetProfileResponse, ColumnProfile } from "@/lib/api";

interface DatasetProfileViewProps {
  profile: DatasetProfileResponse;
}

export default function DatasetProfileView({ profile }: DatasetProfileViewProps) {
  const [activeTab, setActiveTab] = useState<"columns" | "charts" | "preview">("columns");
  const [copiedId, setCopiedId] = useState<boolean>(false);
  const { metadata, columns, preview_rows } = profile;

  const copyDatasetId = () => {
    navigator.clipboard.writeText(metadata.dataset_id);
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 2000);
  };

  const formatBytes = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  const getTypeBadgeColor = (type: string) => {
    switch (type.toLowerCase()) {
      case "numeric":
        return "bg-blue-500/10 text-blue-400 border-blue-500/20";
      case "categorical":
        return "bg-purple-500/10 text-purple-400 border-purple-500/20";
      case "datetime":
        return "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
      case "boolean":
        return "bg-amber-500/10 text-amber-400 border-amber-500/20";
      default:
        return "bg-slate-500/10 text-slate-400 border-slate-500/20";
    }
  };

  // Compute Dtype Breakdown for Donut Chart
  const typeCounts: Record<string, number> = {};
  columns.forEach((c) => {
    const t = c.dtype.charAt(0).toUpperCase() + c.dtype.slice(1);
    typeCounts[t] = (typeCounts[t] || 0) + 1;
  });
  const typeChartData = Object.entries(typeCounts).map(([name, value]) => ({ name, value }));

  const TYPE_COLORS: Record<string, string> = {
    Numeric: "#3b82f6",
    Categorical: "#8b5cf6",
    Datetime: "#10b981",
    Boolean: "#f59e0b",
    Text: "#06b6d4",
    Other: "#64748b"
  };

  // Extract numeric columns with stats for comparison chart
  const numericColumns = columns.filter((c) => c.numeric_stats !== null);
  const numericComparisonData = numericColumns.map((c) => ({
    name: c.name,
    mean: Number(c.numeric_stats?.mean) || 0,
    median: Number(c.numeric_stats?.median) || 0,
    max: Number(c.numeric_stats?.max) || 0,
  }));

  // Extract top categorical columns and their preview frequency
  const categoricalColumns = columns.filter((c) => c.dtype.toLowerCase() === "categorical");
  const categoricalBreakdowns = categoricalColumns.slice(0, 3).map((col) => {
    const counts: Record<string, number> = {};
    preview_rows.forEach((r) => {
      const val = String(r[col.name] ?? "Unknown");
      counts[val] = (counts[val] || 0) + 1;
    });
    const data = Object.entries(counts).map(([name, count]) => ({ name, count }));
    return { colName: col.name, data };
  });

  const CHART_PALETTE = ["#3b82f6", "#6366f1", "#8b5cf6", "#06b6d4", "#10b981", "#f59e0b"];

  return (
    <div className="flex flex-col gap-6">
      {/* Overview Stat Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
            <span>Total Rows</span>
            <Table className="w-3.5 h-3.5 text-brand-400" />
          </div>
          <p className="text-2xl font-black text-white">{metadata.row_count.toLocaleString()}</p>
        </div>

        <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
            <span>Columns</span>
            <Columns className="w-3.5 h-3.5 text-indigo-400" />
          </div>
          <p className="text-2xl font-black text-white">{metadata.column_count}</p>
        </div>

        <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
            <span>Duplicate Rows</span>
            {metadata.duplicate_rows === 0 ? (
              <FileCheck2 className="w-3.5 h-3.5 text-emerald-400" />
            ) : (
              <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
            )}
          </div>
          <p className={`text-2xl font-black ${metadata.duplicate_rows === 0 ? "text-emerald-400" : "text-amber-400"}`}>
            {metadata.duplicate_rows}
          </p>
        </div>

        <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
            <span>File Size</span>
            <Layers className="w-3.5 h-3.5 text-blue-400" />
          </div>
          <p className="text-2xl font-black text-slate-200">{formatBytes(metadata.file_size_bytes)}</p>
        </div>
      </div>

      {/* Dataset Header Ribbon */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 rounded-xl bg-slate-900/40 border border-slate-800/80">
        <div>
          <span className="text-xs text-slate-400">Active Dataset File:</span>
          <p className="text-sm font-semibold text-white font-mono">{metadata.filename}</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={copyDatasetId}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs text-slate-300 font-mono transition cursor-pointer"
            title="Copy Dataset ID for API query"
          >
            {copiedId ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>ID: {metadata.dataset_id.slice(0, 8)}...</span>
          </button>
        </div>
      </div>

      {/* Tab Switcher */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
        <button
          onClick={() => setActiveTab("columns")}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition cursor-pointer ${
            activeTab === "columns"
              ? "bg-brand-600 text-white shadow-md shadow-brand-500/20"
              : "text-slate-400 hover:text-white hover:bg-slate-800"
          }`}
        >
          <BarChart3 className="w-3.5 h-3.5" />
          <span>Columns & Quality ({columns.length})</span>
        </button>

        <button
          onClick={() => setActiveTab("charts")}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition cursor-pointer ${
            activeTab === "charts"
              ? "bg-brand-600 text-white shadow-md shadow-brand-500/20"
              : "text-slate-400 hover:text-white hover:bg-slate-800"
          }`}
        >
          <PieChartIcon className="w-3.5 h-3.5" />
          <span>Visual Distributions & Charts</span>
        </button>

        <button
          onClick={() => setActiveTab("preview")}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition cursor-pointer ${
            activeTab === "preview"
              ? "bg-brand-600 text-white shadow-md shadow-brand-500/20"
              : "text-slate-400 hover:text-white hover:bg-slate-800"
          }`}
        >
          <Table className="w-3.5 h-3.5" />
          <span>Tabular Preview (Top {preview_rows.length})</span>
        </button>
      </div>

      {/* Tab 1: Columns & Data Quality Table */}
      {activeTab === "columns" && (
        <div className="rounded-xl border border-slate-800 overflow-x-auto bg-slate-950/40">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-900/80 text-slate-300 border-b border-slate-800 uppercase font-mono tracking-wider">
              <tr>
                <th className="py-3 px-4">Column Name</th>
                <th className="py-3 px-4">Inferred Type</th>
                <th className="py-3 px-4">Missing Values</th>
                <th className="py-3 px-4">Unique</th>
                <th className="py-3 px-4">Statistical Summary / Samples</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              {columns.map((col: ColumnProfile) => (
                <tr key={col.name} className="hover:bg-slate-900/30 transition">
                  <td className="py-3 px-4 font-mono font-semibold text-white">
                    {col.name}
                  </td>
                  <td className="py-3 px-4">
                    <span className={`px-2 py-0.5 rounded-full border text-[11px] font-semibold uppercase ${getTypeBadgeColor(col.dtype)}`}>
                      {col.dtype}
                    </span>
                    <span className="block text-[10px] text-slate-500 font-mono mt-0.5">{col.python_dtype}</span>
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      <div className="w-16 h-1.5 rounded-full bg-slate-800 overflow-hidden">
                        <div
                          className={`h-full ${col.null_count > 0 ? "bg-amber-400" : "bg-emerald-400"}`}
                          style={{ width: `${Math.min(100, Math.max(4, col.null_percentage))}%` }}
                        />
                      </div>
                      <span className={col.null_count > 0 ? "text-amber-300 font-medium" : "text-emerald-400"}>
                        {col.null_count} ({col.null_percentage}%)
                      </span>
                    </div>
                  </td>
                  <td className="py-3 px-4 font-mono">
                    {col.unique_count.toLocaleString()}
                  </td>
                  <td className="py-3 px-4">
                    {col.numeric_stats ? (
                      <div className="flex flex-wrap items-center gap-2 font-mono text-[11px] text-slate-300">
                        <span className="px-1.5 py-0.5 rounded bg-slate-800">
                          μ: {col.numeric_stats.mean?.toLocaleString()}
                        </span>
                        <span className="px-1.5 py-0.5 rounded bg-slate-800">
                          min: {col.numeric_stats.min?.toLocaleString()}
                        </span>
                        <span className="px-1.5 py-0.5 rounded bg-slate-800">
                          med: {col.numeric_stats.median?.toLocaleString()}
                        </span>
                        <span className="px-1.5 py-0.5 rounded bg-slate-800">
                          max: {col.numeric_stats.max?.toLocaleString()}
                        </span>
                      </div>
                    ) : (
                      <div className="flex flex-wrap items-center gap-1.5 text-[11px] text-slate-400">
                        {col.sample_values.map((s, idx) => (
                          <span key={idx} className="px-1.5 py-0.5 rounded bg-slate-800/80 font-mono truncate max-w-[120px]">
                            {String(s)}
                          </span>
                        ))}
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Tab 2: Visual Distribution Charts */}
      {activeTab === "charts" && (
        <div className="flex flex-col gap-6 animate-fadeIn">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Chart A: Column Data Type Distribution */}
            <div className="p-6 rounded-2xl border border-slate-800 bg-slate-900/60 backdrop-blur-xl flex flex-col gap-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <PieChartIcon className="w-4 h-4 text-brand-400" />
                  <h4 className="text-sm font-bold text-white">Schema Type Composition</h4>
                </div>
                <span className="text-xs font-mono text-slate-400">{columns.length} Total Columns</span>
              </div>

              <div className="w-full h-64 min-w-0">
                <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                  <PieChart>
                    <RechartsTooltip 
                      contentStyle={{ backgroundColor: "#0f172a", borderColor: "#334155", borderRadius: "0.75rem", fontSize: "12px" }}
                    />
                    <Pie
                      data={typeChartData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={80}
                      paddingAngle={5}
                    >
                      {typeChartData.map((entry, index) => (
                        <Cell 
                          key={`cell-${index}`} 
                          fill={TYPE_COLORS[entry.name] || CHART_PALETTE[index % CHART_PALETTE.length]} 
                        />
                      ))}
                    </Pie>
                    <Legend 
                      verticalAlign="bottom" 
                      height={36} 
                      formatter={(val) => <span className="text-slate-300 text-xs font-medium ml-1 mr-3">{val}</span>}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Chart B: Numeric Means Comparison */}
            <div className="p-6 rounded-2xl border border-slate-800 bg-slate-900/60 backdrop-blur-xl flex flex-col gap-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-indigo-400" />
                  <h4 className="text-sm font-bold text-white">Numeric Columns Mean & Median</h4>
                </div>
                <span className="text-xs font-mono text-slate-400">{numericColumns.length} Numeric Metrics</span>
              </div>

              <div className="w-full h-64 min-w-0">
                <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                  <BarChart data={numericComparisonData} margin={{ top: 10, right: 20, left: 10, bottom: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                    <XAxis dataKey="name" stroke="#64748b" tick={{ fill: "#94a3b8", fontSize: 11 }} />
                    <YAxis stroke="#64748b" tick={{ fill: "#94a3b8", fontSize: 11 }} />
                    <RechartsTooltip 
                      contentStyle={{ backgroundColor: "#0f172a", borderColor: "#334155", borderRadius: "0.75rem", fontSize: "12px" }}
                    />
                    <Legend verticalAlign="bottom" height={36} />
                    <Bar dataKey="mean" name="Mean (μ)" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="median" name="Median" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Categorical Preview Breakdown Cards */}
          {categoricalBreakdowns.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {categoricalBreakdowns.map((cat, idx) => (
                <div key={idx} className="p-5 rounded-2xl border border-slate-800 bg-slate-900/50 flex flex-col gap-3">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                    <span className="text-xs font-bold text-white font-mono">{cat.colName}</span>
                    <span className="text-[10px] text-slate-400">Sample Frequency</span>
                  </div>
                  <div className="w-full h-44 min-w-0">
                    <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                      <BarChart data={cat.data} layout="vertical" margin={{ top: 5, right: 20, left: 20, bottom: 5 }}>
                        <XAxis type="number" stroke="#64748b" tick={{ fill: "#94a3b8", fontSize: 10 }} />
                        <YAxis type="category" dataKey="name" stroke="#64748b" tick={{ fill: "#cbd5e1", fontSize: 11 }} />
                        <RechartsTooltip 
                          contentStyle={{ backgroundColor: "#0f172a", borderColor: "#334155", borderRadius: "0.75rem", fontSize: "11px" }}
                        />
                        <Bar dataKey="count" fill={CHART_PALETTE[idx % CHART_PALETTE.length]} radius={[0, 4, 4, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab 3: Tabular Preview */}
      {activeTab === "preview" && (
        <div className="rounded-xl border border-slate-800 overflow-x-auto bg-slate-950/40">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-900/80 text-slate-300 border-b border-slate-800 uppercase font-mono tracking-wider">
              <tr>
                <th className="py-2.5 px-3 text-slate-500">#</th>
                {columns.map((col) => (
                  <th key={col.name} className="py-2.5 px-3 text-slate-300 font-semibold whitespace-nowrap">
                    {col.name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono text-slate-300">
              {preview_rows.map((row, idx) => (
                <tr key={idx} className="hover:bg-slate-900/40 transition">
                  <td className="py-2 px-3 text-slate-500 text-[11px]">{idx + 1}</td>
                  {columns.map((col) => (
                    <td key={col.name} className="py-2 px-3 whitespace-nowrap text-slate-300 text-[11px]">
                      {row[col.name] !== null && row[col.name] !== undefined ? String(row[col.name]) : (
                        <span className="text-slate-600 italic">null</span>
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
