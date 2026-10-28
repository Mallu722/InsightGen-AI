"use client";

import React, { useState, useEffect, useRef } from "react";
import { 
  BrainCircuit, 
  User, 
  Send, 
  Sparkles, 
  ShieldCheck, 
  Code2, 
  ChevronDown, 
  ChevronUp, 
  Trash2, 
  Download,
  Loader2,
  Clock,
  ArrowRight,
  FileText
} from "lucide-react";
import { executeAnalysisQuery, AnalysisResponse, ColumnProfile } from "@/lib/api";
import InteractiveChartStudio from "@/components/analytics/InteractiveChartStudio";

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content?: string;
  response?: AnalysisResponse;
  timestamp: string;
}

interface ConversationalStreamProps {
  datasetId: string;
  columns?: ColumnProfile[];
  externalQuery?: string;
}

export default function ConversationalStream({ datasetId, columns, externalQuery }: ConversationalStreamProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputQuestion, setInputQuestion] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [expandedCodeId, setExpandedCodeId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Dynamically compute intelligent suggested questions tailored to ANY uploaded dataset
  const numericCols = (columns || []).filter((c) => c.dtype === "numeric");
  const categoricalCols = (columns || []).filter((c) => c.dtype === "categorical" || c.dtype === "text");

  const primaryMetric = numericCols.find((c) => 
    c.name.includes("revenue") || c.name.includes("sales") || c.name.includes("salary") || 
    c.name.includes("score") || c.name.includes("price") || c.name.includes("amount")
  ) || numericCols[0];

  const primaryCategory = categoricalCols.find((c) => 
    c.name.includes("region") || c.name.includes("category") || c.name.includes("department") || 
    c.name.includes("segment") || c.name.includes("type") || c.name.includes("brand")
  ) || categoricalCols[0];

  const suggestedQuestions = [
    primaryCategory && primaryMetric 
      ? `Which ${primaryCategory.name.replace(/_/g, " ")} generated the highest ${primaryMetric.name.replace(/_/g, " ")}?` 
      : "Summarize this dataset and list key columns",
    primaryMetric && primaryCategory
      ? `What is the average ${primaryMetric.name.replace(/_/g, " ")} by ${primaryCategory.name.replace(/_/g, " ")}?` 
      : primaryMetric 
      ? `What is the total ${primaryMetric.name.replace(/_/g, " ")}?` 
      : "What columns are in this dataset?",
    categoricalCols.length > 1 && primaryMetric
      ? `Compare ${primaryMetric.name.replace(/_/g, " ")} across ${categoricalCols[1].name.replace(/_/g, " ")}`
      : "Tell me about this dataset",
  ];

  // Restore messages from sessionStorage for active dataset
  useEffect(() => {
    try {
      const saved = sessionStorage.getItem(`insightgen_chat_${datasetId}`);
      if (saved) {
        setMessages(JSON.parse(saved));
      }
    } catch {
      // Ignore storage errors
    }
  }, [datasetId]);

  // Persist messages to sessionStorage
  useEffect(() => {
    if (messages.length > 0) {
      try {
        sessionStorage.setItem(`insightgen_chat_${datasetId}`, JSON.stringify(messages));
      } catch {
        // Ignore storage errors
      }
    }
  }, [messages, datasetId]);

  // Auto-scroll on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  // Listen to external query trigger (e.g. from Starter buttons)
  useEffect(() => {
    if (externalQuery && externalQuery.trim()) {
      handleSend(externalQuery.trim());
    }
  }, [externalQuery]);

  const handleSend = async (customQ?: string) => {
    const q = (customQ || inputQuestion).trim();
    if (!q || loading) return;

    setInputQuestion("");
    setError(null);

    const userMsgId = `user_${Date.now()}`;
    const userMsg: ChatMessage = {
      id: userMsgId,
      role: "user",
      content: q,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setLoading(true);

    try {
      const res = await executeAnalysisQuery(datasetId, q);
      const assistantMsg: ChatMessage = {
        id: `ai_${Date.now()}`,
        role: "assistant",
        response: res,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };
      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err: any) {
      setError(err?.message || "Failed to execute query.");
    } finally {
      setLoading(false);
    }
  };

  const handleClearHistory = () => {
    setMessages([]);
    setError(null);
    try {
      sessionStorage.removeItem(`insightgen_chat_${datasetId}`);
    } catch {
      // Ignore
    }
  };

  const handleExportReport = () => {
    if (messages.length === 0) return;
    let md = `# InsightGen AI — Analytical Briefing Report\n\n`;
    md += `*Generated: ${new Date().toLocaleString()}*\n`;
    md += `*Dataset ID: ${datasetId}*\n\n---\n\n`;

    messages.forEach((m) => {
      if (m.role === "user") {
        md += `### ❓ Query: "${m.content}"\n\n`;
      } else if (m.role === "assistant" && m.response) {
        md += `**Verified Finding:**\n${m.response.summary}\n\n`;
        md += `**Execution Provenance:**\n- Engine: ${m.response.evidence.deterministic_engine}\n- Operation: \`${m.response.evidence.operation_performed}\`\n- Execution Latency: ${m.response.evidence.execution_time_ms}ms\n\n`;
        if (m.response.result.length > 0) {
          md += `**Data Results:**\n\n`;
          const keys = Object.keys(m.response.result[0]);
          md += `| ${keys.join(" | ")} |\n`;
          md += `| ${keys.map(() => "---").join(" | ")} |\n`;
          m.response.result.forEach((row) => {
            md += `| ${keys.map((k) => String(row[k])).join(" | ")} |\n`;
          });
          md += `\n`;
        }
        md += `---\n\n`;
      }
    });

    const blob = new Blob([md], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `insightgen_analytics_briefing_${Date.now()}.md`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const toggleCode = (msgId: string) => {
    setExpandedCodeId(expandedCodeId === msgId ? null : msgId);
  };

  return (
    <div className="flex flex-col gap-6 w-full min-w-0">
      {/* Stream Controls */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <BrainCircuit className="w-5 h-5 text-brand-400" />
          <h3 className="text-base font-bold text-white">AI Data Scientist Conversation</h3>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
            {Math.floor(messages.length / 2)} Queries Run
          </span>
        </div>

        <div className="flex items-center gap-2">
          {messages.length > 0 && (
            <>
              <button
                type="button"
                onClick={handleExportReport}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs text-slate-300 hover:text-white bg-slate-900 hover:bg-slate-850 border border-slate-800 transition cursor-pointer"
                title="Download Executive Markdown Report"
              >
                <FileText className="w-3.5 h-3.5 text-indigo-400" />
                <span className="hidden sm:inline">Export Report</span>
              </button>
              <button
                type="button"
                onClick={handleClearHistory}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs text-slate-400 hover:text-rose-400 hover:bg-rose-950/20 border border-transparent hover:border-rose-900 transition cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Clear Thread</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* Suggested Questions Pills */}
      {messages.length === 0 && (
        <div className="flex flex-wrap items-center gap-2 p-4 rounded-xl bg-slate-900/40 border border-slate-800/80">
          <span className="text-xs text-slate-400 font-semibold flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-brand-400" />
            Suggested Questions:
          </span>
          {suggestedQuestions.map((q, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => handleSend(q)}
              className="px-3 py-1.5 rounded-lg bg-slate-850 hover:bg-slate-800 border border-slate-750 text-xs text-slate-300 hover:text-white transition cursor-pointer"
            >
              {q}
            </button>
          ))}
        </div>
      )}

      {/* Chat Messages Timeline */}
      <div className="flex flex-col gap-8 min-h-[150px] w-full min-w-0">
        {messages.map((msg) => (
          <div key={msg.id} className="flex flex-col gap-3 animate-fadeIn w-full min-w-0">
            {/* User Message */}
            {msg.role === "user" && (
              <div className="flex items-start gap-3.5 justify-end">
                <div className="flex flex-col items-end gap-1 max-w-2xl">
                  <div className="px-5 py-3 rounded-2xl rounded-tr-sm bg-gradient-to-r from-brand-600 to-indigo-600 text-white text-sm font-medium shadow-lg shadow-brand-500/20">
                    {msg.content}
                  </div>
                  <span className="text-[10px] text-slate-500 font-mono">{msg.timestamp}</span>
                </div>
                <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-300 shrink-0">
                  <User className="w-4 h-4" />
                </div>
              </div>
            )}

            {/* AI Assistant Message */}
            {msg.role === "assistant" && msg.response && (
              <div className="flex items-start gap-3.5 justify-start w-full min-w-0">
                <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-brand-600 to-indigo-600 text-white flex items-center justify-center shrink-0 shadow-md shadow-brand-500/20 mt-1">
                  <BrainCircuit className="w-4 h-4" />
                </div>

                <div className="flex flex-col gap-4 max-w-4xl flex-1 min-w-0">
                  {/* Verified Executive Narrative */}
                  <div className="p-5 rounded-2xl rounded-tl-sm bg-slate-900/90 border border-slate-800 shadow-xl flex flex-col gap-3">
                    <div className="flex items-center justify-between border-b border-slate-800/80 pb-2.5">
                      <span className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
                        <ShieldCheck className="w-4 h-4" />
                        {msg.response.plan?.intent === "greeting"
                          ? "AI Data Scientist Assistant"
                          : msg.response.plan?.intent === "dataset_info"
                          ? "Dataset Profile & Intelligence"
                          : "Verified Data Science Finding"}
                      </span>
                      <span className="text-[10px] font-mono text-slate-400 flex items-center gap-1">
                        <Clock className="w-3 h-3 text-slate-500" />
                        {msg.response.evidence.execution_time_ms}ms • {msg.response.evidence.row_count_analyzed} records
                      </span>
                    </div>

                    <p className="text-sm md:text-base font-semibold text-slate-100 leading-relaxed whitespace-pre-line">
                      {msg.response.summary}
                    </p>

                    {/* Code Drawer Toggle (Only show when deterministic code was executed) */}
                    {msg.response.result && msg.response.result.length > 0 && (
                      <>
                        <div className="pt-2 border-t border-slate-800/60 flex items-center justify-between">
                          <button
                            onClick={() => toggleCode(msg.id)}
                            className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1.5 font-medium transition cursor-pointer"
                          >
                            <Code2 className="w-3.5 h-3.5" />
                            <span>{expandedCodeId === msg.id ? "Hide Execution Provenance" : "Inspect Python / Pandas Code"}</span>
                            {expandedCodeId === msg.id ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                          </button>
                        </div>

                        {/* Collapsible Code Drawer */}
                        {expandedCodeId === msg.id && (
                          <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 font-mono text-xs text-slate-300 flex flex-col gap-2 mt-1 animate-fadeIn">
                            <div className="flex items-center justify-between text-slate-500 text-[10px]">
                              <span>DETERMINISTIC EXPRESSION</span>
                              <span>{msg.response.evidence.deterministic_engine}</span>
                            </div>
                            <code className="text-emerald-400 bg-slate-900/80 p-2 rounded-lg block overflow-x-auto">
                              {msg.response.evidence.operation_performed}
                            </code>
                            <div className="text-[11px] text-slate-400">
                              Columns evaluated: <span className="text-indigo-300">{msg.response.evidence.columns_used.join(", ")}</span>
                            </div>
                          </div>
                        )}
                      </>
                    )}
                  </div>

                  {/* Interactive Chart Studio */}
                  {msg.response.chart && msg.response.result.length > 0 && (
                    <div className="w-full min-w-0">
                      <InteractiveChartStudio
                        chart={msg.response.chart}
                        data={msg.response.result}
                      />
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        ))}

        {/* Loading Indicator Bubble */}
        {loading && (
          <div className="flex items-start gap-3.5">
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-brand-600 to-indigo-600 text-white flex items-center justify-center shrink-0 animate-pulse">
              <BrainCircuit className="w-4 h-4" />
            </div>
            <div className="p-4 rounded-2xl rounded-tl-sm bg-slate-900/80 border border-slate-800 flex items-center gap-3 text-slate-300 text-xs">
              <Loader2 className="w-4 h-4 animate-spin text-brand-400" />
              <span>Gemini is planning analysis; Pandas is calculating verified numbers...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Error Banner */}
      {error && (
        <div className="rounded-xl border border-rose-500/30 bg-rose-950/30 p-3.5 text-xs text-rose-300">
          {error}
        </div>
      )}

      {/* Sticky Bottom Input Bar */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSend();
        }}
        className="sticky bottom-4 bg-slate-950/90 backdrop-blur-xl border border-slate-800 rounded-2xl p-2 shadow-2xl flex items-center gap-3 z-20"
      >
        <input
          type="text"
          value={inputQuestion}
          onChange={(e) => setInputQuestion(e.target.value)}
          placeholder="Ask a question about your data (e.g. Which region had the top sales?)..."
          disabled={loading}
          className="flex-1 bg-transparent px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none"
        />
        <button
          type="submit"
          disabled={!inputQuestion.trim() || loading}
          className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 text-white text-xs font-bold shadow-lg shadow-brand-500/20 transition flex items-center gap-2 disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed"
        >
          {loading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <>
              <Send className="w-4 h-4" />
              <span>Ask AI</span>
            </>
          )}
        </button>
      </form>
    </div>
  );
}
