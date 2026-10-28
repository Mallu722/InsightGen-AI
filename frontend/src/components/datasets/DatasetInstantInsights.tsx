"use client";

import React from "react";
import { 
  Sparkles, 
  ShieldCheck, 
  TrendingUp, 
  FileCheck2, 
  AlertTriangle,
  ArrowRight,
  Database
} from "lucide-react";
import { DatasetProfileResponse } from "@/lib/api";

interface DatasetInstantInsightsProps {
  profile: DatasetProfileResponse;
  onAskQuestion: (q: string) => void;
}

export default function DatasetInstantInsights({ profile, onAskQuestion }: DatasetInstantInsightsProps) {
  const { metadata, columns } = profile;

  // Calculate a Data Health Score (0 - 100)
  const totalCells = metadata.row_count * metadata.column_count;
  const totalNulls = columns.reduce((acc, c) => acc + c.null_count, 0);
  const nullPenalty = totalCells > 0 ? (totalNulls / totalCells) * 50 : 0;
  const duplicatePenalty = metadata.row_count > 0 ? (metadata.duplicate_rows / metadata.row_count) * 30 : 0;
  const healthScore = Math.max(20, Math.round(100 - nullPenalty - duplicatePenalty));

  // Determine top numeric and categorical columns
  const numericCols = columns.filter((c) => c.dtype === "numeric");
  const categoricalCols = columns.filter((c) => c.dtype === "categorical" || c.dtype === "text");

  const primaryMetric = numericCols.find((c) => c.name.includes("revenue") || c.name.includes("sales")) || numericCols[0];
  const primaryCategory = categoricalCols.find((c) => c.name.includes("region") || c.name.includes("category")) || categoricalCols[0];

  const suggestedQuestions = [
    primaryCategory && primaryMetric ? `Which ${primaryCategory.name.replace("_", " ")} generated the highest ${primaryMetric.name.replace("_", " ")}?` : "Show dataset summary",
    primaryMetric ? `What is the average ${primaryMetric.name.replace("_", " ")} across categories?` : "Count records by group",
    categoricalCols.length > 1 && primaryMetric ? `Compare ${primaryMetric.name.replace("_", " ")} by ${categoricalCols[1].name.replace("_", " ")}` : "Identify top performers",
  ];

  return (
    <div className="rounded-2xl border border-indigo-500/20 bg-gradient-to-br from-indigo-950/30 via-slate-900/60 to-slate-950 p-6 flex flex-col gap-6 shadow-2xl backdrop-blur-xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-800/80 pb-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-gradient-to-tr from-brand-600 to-indigo-600 text-white shadow-lg shadow-brand-500/20">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              Instant AI Dataset Briefing
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                Automated
              </span>
            </h3>
            <p className="text-xs text-slate-400">
              Immediate statistical diagnostics generated for <span className="text-slate-200 font-mono">{metadata.filename}</span>
            </p>
          </div>
        </div>

        {/* Health Score Pill */}
        <div className="flex items-center gap-3 px-4 py-2 rounded-xl bg-slate-950/80 border border-slate-800">
          <div className="text-right">
            <span className="text-[10px] text-slate-500 uppercase block font-semibold">Health Score</span>
            <span className="text-lg font-black text-emerald-400 font-mono">{healthScore}/100</span>
          </div>
          <div className="w-10 h-10 rounded-full border-2 border-emerald-500/30 bg-emerald-500/10 flex items-center justify-center text-emerald-400">
            <ShieldCheck className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Highlights Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
        <div className="p-4 rounded-xl bg-slate-900/50 border border-slate-800 flex flex-col gap-1.5">
          <span className="text-slate-400 font-medium flex items-center gap-1.5">
            <Database className="w-3.5 h-3.5 text-brand-400" /> Completeness & Quality
          </span>
          <p className="text-sm font-semibold text-white">
            {totalNulls === 0 ? "100% Complete Data" : `${totalNulls} missing values detected`}
          </p>
          <span className="text-[11px] text-slate-500">
            {metadata.duplicate_rows === 0 ? "Zero duplicate rows found" : `${metadata.duplicate_rows} duplicate rows present`}
          </span>
        </div>

        <div className="p-4 rounded-xl bg-slate-900/50 border border-slate-800 flex flex-col gap-1.5">
          <span className="text-slate-400 font-medium flex items-center gap-1.5">
            <TrendingUp className="w-3.5 h-3.5 text-indigo-400" /> Primary Analytical Metric
          </span>
          <p className="text-sm font-semibold text-white font-mono truncate">
            {primaryMetric ? primaryMetric.name : "N/A"}
          </p>
          <span className="text-[11px] text-slate-500">
            {primaryMetric?.numeric_stats ? `Max: $${primaryMetric.numeric_stats.max?.toLocaleString()} | Mean: $${primaryMetric.numeric_stats.mean?.toLocaleString()}` : "Ready for analysis"}
          </span>
        </div>

        <div className="p-4 rounded-xl bg-slate-900/50 border border-slate-800 flex flex-col gap-1.5">
          <span className="text-slate-400 font-medium flex items-center gap-1.5">
            <FileCheck2 className="w-3.5 h-3.5 text-emerald-400" /> Dimensions
          </span>
          <p className="text-sm font-semibold text-white font-mono">
            {metadata.row_count} rows × {metadata.column_count} columns
          </p>
          <span className="text-[11px] text-slate-500">
            {numericCols.length} Numeric • {categoricalCols.length} Categorical
          </span>
        </div>
      </div>

      {/* Click-to-Ask Starters */}
      <div className="flex flex-col gap-2 pt-1">
        <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-brand-400" />
          Recommended Exploratory Questions:
        </span>
        <div className="flex flex-wrap items-center gap-2">
          {suggestedQuestions.map((q, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => onAskQuestion(q)}
              className="px-3.5 py-2 rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-slate-800 hover:border-brand-500/40 text-xs text-slate-300 hover:text-white transition flex items-center gap-1.5 cursor-pointer shadow-sm group"
            >
              <span>{q}</span>
              <ArrowRight className="w-3 h-3 text-slate-500 group-hover:text-brand-400 group-hover:translate-x-0.5 transition" />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
