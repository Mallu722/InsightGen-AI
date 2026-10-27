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
  Info
} from "lucide-react";
import { DatasetProfileResponse, ColumnProfile } from "@/lib/api";

interface DatasetProfileViewProps {
  profile: DatasetProfileResponse;
}

export default function DatasetProfileView({ profile }: DatasetProfileViewProps) {
  const [activeTab, setActiveTab] = useState<"columns" | "preview">("columns");
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
          Columns & Data Quality ({columns.length})
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
          Tabular Preview (Top {preview_rows.length} Rows)
        </button>
      </div>

      {/* Tab Content: Columns & Data Quality */}
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

      {/* Tab Content: Tabular Preview */}
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
