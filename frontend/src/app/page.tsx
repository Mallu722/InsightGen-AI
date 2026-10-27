"use client";

import React, { useState, useEffect } from "react";
import { 
  Activity, 
  BrainCircuit, 
  ShieldCheck, 
  RefreshCw,
  Cpu,
  ArrowRight,
  FileSpreadsheet,
  CheckCircle2,
  AlertCircle
} from "lucide-react";
import { fetchBackendHealth, HealthCheckResponse, DatasetProfileResponse, DatasetUploadResponse } from "@/lib/api";
import DatasetUpload from "@/components/datasets/DatasetUpload";
import DatasetProfileView from "@/components/datasets/DatasetProfileView";

export default function Home() {
  const [healthData, setHealthData] = useState<HealthCheckResponse | null>(null);
  const [healthLoading, setHealthLoading] = useState<boolean>(true);
  const [healthError, setHealthError] = useState<string | null>(null);
  const [latencyMs, setLatencyMs] = useState<number | null>(null);
  const [activeProfile, setActiveProfile] = useState<DatasetProfileResponse | null>(null);

  const checkConnection = async () => {
    setHealthLoading(true);
    setHealthError(null);
    const startTime = performance.now();
    try {
      const data = await fetchBackendHealth();
      setLatencyMs(Math.round(performance.now() - startTime));
      setHealthData(data);
    } catch (err: any) {
      setHealthError(err?.message || "Could not connect to FastAPI backend on http://127.0.0.1:8000");
      setHealthData(null);
    } finally {
      setHealthLoading(false);
    }
  };

  useEffect(() => {
    checkConnection();
  }, []);

  const handleUploadSuccess = (response: DatasetUploadResponse) => {
    setActiveProfile(response.profile);
  };

  return (
    <main className="min-h-screen px-4 py-8 md:px-12 max-w-7xl mx-auto flex flex-col gap-10">
      {/* Header Banner */}
      <header className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-slate-800/80 pb-6">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-gradient-to-tr from-brand-600 to-indigo-500 shadow-lg shadow-brand-500/20">
              <BrainCircuit className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-white flex items-center gap-2">
                InsightGen <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-400">AI</span>
              </h1>
              <p className="text-xs md:text-sm text-slate-400 font-medium">
                Agentic AI Data Scientist • Zero-Hallucination Analytics Platform
              </p>
            </div>
          </div>
        </div>

        {/* Live Status Badge */}
        <div className="flex items-center gap-3">
          <button
            onClick={checkConnection}
            disabled={healthLoading}
            className="flex items-center gap-2 px-3.5 py-2 rounded-lg bg-slate-900 border border-slate-800 hover:border-slate-700 text-xs text-slate-300 transition-all cursor-pointer disabled:opacity-50"
            title="Refresh Connection"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${healthLoading ? "animate-spin text-brand-400" : ""}`} />
            Refresh Ping
          </button>

          <div className={`flex items-center gap-2 px-3.5 py-2 rounded-lg border text-xs font-semibold ${
            healthData?.status === "healthy" 
              ? "bg-emerald-950/40 border-emerald-500/30 text-emerald-300"
              : healthError 
              ? "bg-rose-950/40 border-rose-500/30 text-rose-300"
              : "bg-amber-950/40 border-amber-500/30 text-amber-300"
          }`}>
            <span className={`w-2 h-2 rounded-full ${
              healthData?.status === "healthy" ? "bg-emerald-400 animate-pulse" : healthError ? "bg-rose-400" : "bg-amber-400"
            }`} />
            {healthData?.status === "healthy" ? `Backend Live (${latencyMs}ms)` : healthError ? "Backend Offline" : "Connecting..."}
          </div>
        </div>
      </header>

      {/* Day 2: Dataset Upload & Profiling MVP */}
      <section className="rounded-2xl border border-slate-800/90 bg-slate-900/60 backdrop-blur-xl p-6 md:p-8 shadow-2xl flex flex-col gap-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-brand-500/10 text-brand-400 border border-brand-500/20">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Dataset Ingestion & Profiling Engine</h2>
              <p className="text-xs text-slate-400">
                Upload CSV or Excel files. Deterministic Pandas profiling extracts schema, data types, missing values, and descriptive statistics.
              </p>
            </div>
          </div>
          <span className="text-xs font-mono px-3 py-1 rounded-md bg-brand-950/60 text-brand-300 border border-brand-500/30 font-semibold">
            Day 2 MVP
          </span>
        </div>

        {/* Upload Component */}
        <DatasetUpload onUploadSuccess={handleUploadSuccess} />

        {/* Render Profile View when dataset is uploaded */}
        {activeProfile && (
          <div className="mt-4 pt-6 border-t border-slate-800">
            <DatasetProfileView profile={activeProfile} />
          </div>
        )}
      </section>

      {/* Architecture Highlights: Agentic Planning vs Deterministic Execution */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="p-6 rounded-2xl border border-slate-800/90 bg-slate-900/40 backdrop-blur-md flex flex-col justify-between hover:border-slate-700 transition">
          <div>
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 mb-4">
              <BrainCircuit className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">1. AI Planning (Gemini)</h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              Google Gemini receives only the profiled schema metadata (column names and data types), never raw rows, to generate a structured analysis plan.
            </p>
          </div>
          <div className="mt-4 pt-4 border-t border-slate-800/80 text-xs font-semibold text-blue-400 flex items-center gap-1">
            Zero Math Hallucination <ArrowRight className="w-3.5 h-3.5" />
          </div>
        </div>

        <div className="p-6 rounded-2xl border border-slate-800/90 bg-slate-900/40 backdrop-blur-md flex flex-col justify-between hover:border-slate-700 transition">
          <div>
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 mb-4">
              <Cpu className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">2. Deterministic Engine</h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              Pandas and NumPy compute exact aggregations, statistics, and distributions on original datasets. Calculations are 100% verifiable.
            </p>
          </div>
          <div className="mt-4 pt-4 border-t border-slate-800/80 text-xs font-semibold text-indigo-400 flex items-center gap-1">
            Python & SQL Processing <ArrowRight className="w-3.5 h-3.5" />
          </div>
        </div>

        <div className="p-6 rounded-2xl border border-slate-800/90 bg-slate-900/40 backdrop-blur-md flex flex-col justify-between hover:border-slate-700 transition">
          <div>
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 mb-4">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">3. Validation & Evidence</h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              Results are sanity-checked against boundary limits, accompanied by reproducible evidence logs, interactive Plotly charts, and downloadable reports.
            </p>
          </div>
          <div className="mt-4 pt-4 border-t border-slate-800/80 text-xs font-semibold text-emerald-400 flex items-center gap-1">
            Verifiable Auditing <ArrowRight className="w-3.5 h-3.5" />
          </div>
        </div>
      </section>
    </main>
  );
}
