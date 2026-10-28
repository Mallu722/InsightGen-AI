"use client";

import React, { useState } from "react";
import { 
  BrainCircuit, 
  Send, 
  Sparkles, 
  ShieldCheck, 
  Clock, 
  Database, 
  BarChart3, 
  Table as TableIcon,
  AlertCircle,
  Loader2
} from "lucide-react";
import { executeAnalysisQuery, AnalysisResponse } from "@/lib/api";
import InteractiveChartStudio from "@/components/analytics/InteractiveChartStudio";

interface AnalysisQueryBoxProps {
  datasetId: string;
}

export default function AnalysisQueryBox({ datasetId }: AnalysisQueryBoxProps) {
  const [question, setQuestion] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [response, setResponse] = useState<AnalysisResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const suggestedQuestions = [
    "Which region generated the highest revenue?",
    "What is the average revenue by product category?",
    "Compare total revenue by customer segment",
  ];

  const handleAsk = async (queryText?: string) => {
    const q = (queryText || question).trim();
    if (!q) return;

    if (queryText) {
      setQuestion(queryText);
    }

    setLoading(true);
    setError(null);
    try {
      const res = await executeAnalysisQuery(datasetId, q);
      setResponse(res);
    } catch (err: any) {
      setError(err?.message || "Failed to execute analysis query. Check backend connectivity.");
    } finally {
      setLoading(false);
    }
  };

  // Find max value in result data for bar chart scaling
  const getMaxValue = () => {
    if (!response || !response.result || !response.chart) return 1;
    const yKey = response.chart.y_key;
    const values = response.result.map((r) => Number(r[yKey]) || 0);
    return Math.max(...values, 1);
  };

  return (
    <section className="rounded-2xl border border-indigo-500/30 bg-slate-900/70 backdrop-blur-xl p-6 md:p-8 shadow-2xl flex flex-col gap-6">
      {/* Title Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-gradient-to-tr from-brand-600 to-indigo-500 text-white shadow-lg shadow-brand-500/20">
            <BrainCircuit className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              Conversational Data Scientist
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
                Zero Math Hallucination
              </span>
            </h2>
            <p className="text-xs text-slate-400">
              Ask any question. Gemini plans the operations, Pandas executes exact calculations, and findings are verified before presentation.
            </p>
          </div>
        </div>
      </div>

      {/* Suggested Questions Pills */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs text-slate-400 flex items-center gap-1.5 font-medium">
          <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
          Suggested:
        </span>
        {suggestedQuestions.map((q, idx) => (
          <button
            key={idx}
            type="button"
            onClick={() => handleAsk(q)}
            disabled={loading}
            className="px-3 py-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 text-xs text-slate-300 hover:text-white transition disabled:opacity-50 text-left cursor-pointer"
          >
            {q}
          </button>
        ))}
      </div>

      {/* Query Input Box */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleAsk();
        }}
        className="flex items-center gap-3 bg-slate-950/80 border border-slate-700/80 rounded-xl p-1.5 shadow-inner"
      >
        <input
          type="text"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder="e.g. Which region generated the highest revenue?"
          className="flex-1 bg-transparent px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none"
        />
        <button
          type="submit"
          disabled={!question.trim() || loading}
          className="px-5 py-2.5 rounded-lg bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 text-white text-xs font-bold shadow-md shadow-brand-500/20 transition flex items-center gap-2 disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Analyzing...</span>
            </>
          ) : (
            <>
              <Send className="w-4 h-4" />
              <span>Ask AI</span>
            </>
          )}
        </button>
      </form>

      {/* Error State */}
      {error && (
        <div className="rounded-xl border border-rose-500/30 bg-rose-950/30 p-4 text-xs text-rose-300 flex items-start gap-3">
          <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
          <p>{error}</p>
        </div>
      )}

      {/* Analysis Response View */}
      {response && (
        <div className="flex flex-col gap-6 pt-2 animate-fadeIn">
          {/* Executive Answer Card */}
          <div className="rounded-xl border border-emerald-500/30 bg-emerald-950/20 p-5 flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4" /> Verified Data Science Finding
              </span>
              <span className="text-[11px] font-mono text-slate-400">
                {response.evidence.execution_time_ms}ms execution
              </span>
            </div>
            <p className="text-base font-semibold text-white leading-relaxed">
              {response.summary}
            </p>
          </div>

          {/* Evidence Provenance Ribbon */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800 flex items-center gap-2">
              <Database className="w-4 h-4 text-indigo-400 shrink-0" />
              <div>
                <span className="text-[10px] text-slate-500 uppercase block font-semibold">Engine</span>
                <span className="font-mono text-slate-300">{response.evidence.deterministic_engine}</span>
              </div>
            </div>

            <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800 flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-brand-400 shrink-0" />
              <div>
                <span className="text-[10px] text-slate-500 uppercase block font-semibold">Operation</span>
                <span className="font-mono text-slate-300 truncate block max-w-[200px]" title={response.evidence.operation_performed}>
                  {response.evidence.operation_performed}
                </span>
              </div>
            </div>

            <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800 flex items-center gap-2">
              <Clock className="w-4 h-4 text-emerald-400 shrink-0" />
              <div>
                <span className="text-[10px] text-slate-500 uppercase block font-semibold">Rows Evaluated</span>
                <span className="font-mono text-slate-300">{response.evidence.row_count_analyzed} rows</span>
              </div>
            </div>
          </div>

          {/* Dynamic Visualization & Table Tabs */}
          {response.chart && response.result.length > 0 && (
            <InteractiveChartStudio chart={response.chart} data={response.result} />
          )}
        </div>
      )}
    </section>
  );
}
