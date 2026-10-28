"use client";

import React, { useState, useEffect } from "react";
import { 
  Activity, 
  BrainCircuit, 
  RefreshCw, 
  FileSpreadsheet, 
  Sparkles, 
  Sliders, 
  Plus, 
  Trash2, 
  BarChart3, 
  Table, 
  MessageSquare,
  ShieldCheck,
  CheckCircle2,
  ExternalLink
} from "lucide-react";
import { 
  fetchBackendHealth, 
  HealthCheckResponse, 
  DatasetProfileResponse, 
  DatasetUploadResponse,
  deleteDataset
} from "@/lib/api";
import DatasetUpload from "@/components/datasets/DatasetUpload";
import DatasetProfileView from "@/components/datasets/DatasetProfileView";
import ConversationalStream from "@/components/analytics/ConversationalStream";
import DatasetInstantInsights from "@/components/datasets/DatasetInstantInsights";
import SettingsModal from "@/components/common/SettingsModal";

export default function Home() {
  const [healthData, setHealthData] = useState<HealthCheckResponse | null>(null);
  const [healthLoading, setHealthLoading] = useState<boolean>(true);
  const [healthError, setHealthError] = useState<string | null>(null);
  const [latencyMs, setLatencyMs] = useState<number | null>(null);
  const [activeProfile, setActiveProfile] = useState<DatasetProfileResponse | null>(null);
  const [activeTab, setActiveTab] = useState<"chat" | "quality" | "preview">("chat");
  const [settingsOpen, setSettingsOpen] = useState<boolean>(false);
  const [externalTriggerQ, setExternalTriggerQ] = useState<string | undefined>(undefined);

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
    setActiveTab("chat");
  };

  const handleResetDataset = () => {
    setActiveProfile(null);
  };

  const handleDeleteCurrentDataset = async () => {
    if (!activeProfile) return;
    try {
      await deleteDataset(activeProfile.metadata.dataset_id);
      setActiveProfile(null);
    } catch (err) {
      setActiveProfile(null);
    }
  };

  const handleAskStarter = (q: string) => {
    setActiveTab("chat");
    setExternalTriggerQ(q);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-brand-500 selection:text-white">
      {/* Top Navbar */}
      <nav className="sticky top-0 z-40 border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-xl px-4 md:px-8 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-gradient-to-tr from-brand-600 via-indigo-600 to-purple-600 shadow-lg shadow-brand-500/25">
            <BrainCircuit className="w-6 h-6 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-lg font-black tracking-tight text-white">InsightGen</span>
              <span className="text-xs font-bold px-2 py-0.5 rounded-md bg-gradient-to-r from-blue-500 to-indigo-500 text-white">
                AI Data Scientist
              </span>
            </div>
            <p className="text-[11px] text-slate-400 font-medium hidden sm:block">
              Zero-Hallucination Analytics • Gemini Planning • Pandas Calculation
            </p>
          </div>
        </div>

        {/* Right Nav Actions */}
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setSettingsOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 text-xs text-slate-300 hover:text-white transition cursor-pointer"
            title="Configure Gemini API Settings"
          >
            <Sliders className="w-3.5 h-3.5 text-indigo-400" />
            <span className="hidden md:inline">API Settings</span>
          </button>

          <button
            onClick={checkConnection}
            disabled={healthLoading}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-semibold cursor-pointer ${
              healthData?.status === "healthy"
                ? "bg-emerald-950/40 border-emerald-500/30 text-emerald-300"
                : healthError
                ? "bg-rose-950/40 border-rose-500/30 text-rose-300"
                : "bg-amber-950/40 border-amber-500/30 text-amber-300"
            }`}
          >
            <span
              className={`w-2 h-2 rounded-full ${
                healthData?.status === "healthy" ? "bg-emerald-400 animate-pulse" : "bg-rose-400"
              }`}
            />
            <span>{healthData?.status === "healthy" ? `Backend Live (${latencyMs}ms)` : "Offline"}</span>
          </button>
        </div>
      </nav>

      {/* Main App Workspace */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-8 flex flex-col gap-8">
        {/* Case A: No Dataset Loaded — Upload View */}
        {!activeProfile && (
          <div className="flex flex-col gap-10 py-6 max-w-4xl mx-auto w-full animate-fadeIn">
            {/* Hero Banner */}
            <div className="text-center space-y-3">
              <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-brand-500/10 border border-brand-500/20 text-brand-300 text-xs font-semibold">
                <Sparkles className="w-3.5 h-3.5" /> Next-Generation Agentic Analytics
              </div>
              <h1 className="text-3xl md:text-5xl font-black text-white tracking-tight leading-tight">
                Ask Questions. Get Verified Data Insights.
              </h1>
              <p className="text-sm md:text-base text-slate-400 max-w-2xl mx-auto leading-relaxed">
                Upload your CSV or Excel dataset. InsightGen AI automatically profiles data quality, plans your queries with Gemini, and deterministically computes exact numbers using Python and Pandas.
              </p>
            </div>

            {/* Ingestion Dropzone */}
            <div className="rounded-3xl border border-slate-800 bg-slate-900/60 backdrop-blur-xl p-8 shadow-2xl">
              <DatasetUpload onUploadSuccess={handleUploadSuccess} />
            </div>

            {/* Pillar Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              <div className="p-5 rounded-2xl bg-slate-900/40 border border-slate-800/80">
                <div className="w-8 h-8 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center mb-3">
                  <BrainCircuit className="w-4 h-4" />
                </div>
                <h4 className="text-sm font-bold text-white mb-1">1. Gemini AI Planning</h4>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Translates ambiguous natural language into structured, safe execution plans.
                </p>
              </div>

              <div className="p-5 rounded-2xl bg-slate-900/40 border border-slate-800/80">
                <div className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center mb-3">
                  <Activity className="w-4 h-4" />
                </div>
                <h4 className="text-sm font-bold text-white mb-1">2. Deterministic Math</h4>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Pandas executes exact calculations. No LLM ever guesses or hallucinates figures.
                </p>
              </div>

              <div className="p-5 rounded-2xl bg-slate-900/40 border border-slate-800/80">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center mb-3">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <h4 className="text-sm font-bold text-white mb-1">3. Verifiable Evidence</h4>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Every answer includes execution provenance, latency badges, and charts.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Case B: Active Dataset Loaded — Studio Workspace */}
        {activeProfile && (
          <div className="flex flex-col gap-8 animate-fadeIn">
            {/* Active Dataset Ribbon */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-xl">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-brand-500/10 text-brand-400 border border-brand-500/20">
                  <FileSpreadsheet className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-white font-mono">{activeProfile.metadata.filename}</span>
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-800 text-slate-300">
                      {(activeProfile.metadata.file_size_bytes / 1024).toFixed(1)} KB
                    </span>
                  </div>
                  <span className="text-xs text-slate-400">
                    {activeProfile.metadata.row_count} rows • {activeProfile.metadata.column_count} columns • {activeProfile.metadata.duplicate_rows} duplicate rows
                  </span>
                </div>
              </div>

              {/* Dataset Actions */}
              <div className="flex items-center gap-2">
                <button
                  onClick={handleResetDataset}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs text-slate-300 transition cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Upload Different Dataset</span>
                </button>
                <button
                  onClick={handleDeleteCurrentDataset}
                  className="p-2 rounded-xl bg-slate-800 hover:bg-rose-950 hover:text-rose-400 text-slate-400 transition cursor-pointer"
                  title="Delete Dataset"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Instant AI Briefing & Health Score Card */}
            <DatasetInstantInsights
              profile={activeProfile}
              onAskQuestion={handleAskStarter}
            />

            {/* Primary Workspace Navigation Tabs */}
            <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
              <button
                type="button"
                onClick={() => setActiveTab("chat")}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                  activeTab === "chat"
                    ? "bg-brand-600 text-white shadow-lg shadow-brand-500/20"
                    : "text-slate-400 hover:text-white hover:bg-slate-900"
                }`}
              >
                <MessageSquare className="w-4 h-4" />
                <span>AI Data Scientist Chat</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab("quality")}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                  activeTab === "quality"
                    ? "bg-brand-600 text-white shadow-lg shadow-brand-500/20"
                    : "text-slate-400 hover:text-white hover:bg-slate-900"
                }`}
              >
                <BarChart3 className="w-4 h-4" />
                <span>Data Quality Studio ({activeProfile.columns.length} Columns)</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab("preview")}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                  activeTab === "preview"
                    ? "bg-brand-600 text-white shadow-lg shadow-brand-500/20"
                    : "text-slate-400 hover:text-white hover:bg-slate-900"
                }`}
              >
                <Table className="w-4 h-4" />
                <span>Tabular Preview (Top 10 Rows)</span>
              </button>
            </div>

            {/* Tab 1: AI Chat Stream */}
            {activeTab === "chat" && (
              <ConversationalStream
                datasetId={activeProfile.metadata.dataset_id}
                columns={activeProfile.columns}
                externalQuery={externalTriggerQ}
              />
            )}

            {/* Tab 2 & 3: Profile & Preview Views */}
            {(activeTab === "quality" || activeTab === "preview") && (
              <DatasetProfileView profile={activeProfile} />
            )}
          </div>
        )}
      </main>

      {/* Settings Modal */}
      <SettingsModal
        isOpen={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        onSaveKey={(k) => {
          checkConnection();
        }}
      />
    </div>
  );
}
