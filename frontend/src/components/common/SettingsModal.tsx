"use client";

import React, { useState, useEffect } from "react";
import { Key, X, CheckCircle2, Shield, Sparkles, ExternalLink } from "lucide-react";

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveKey: (key: string) => void;
}

export default function SettingsModal({ isOpen, onClose, onSaveKey }: SettingsModalProps) {
  const [apiKey, setApiKey] = useState<string>("");
  const [model, setModel] = useState<string>("gemini-3.8-flash");
  const [saved, setSaved] = useState<boolean>(false);

  useEffect(() => {
    const stored = localStorage.getItem("INSIGHTGEN_GEMINI_KEY") || "";
    setApiKey(stored);
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSave = () => {
    localStorage.setItem("INSIGHTGEN_GEMINI_KEY", apiKey.trim());
    onSaveKey(apiKey.trim());
    setSaved(true);
    setTimeout(() => {
      setSaved(false);
      onClose();
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md p-4 animate-fadeIn">
      <div className="relative w-full max-w-lg rounded-2xl border border-slate-800 bg-slate-900/95 p-6 shadow-2xl flex flex-col gap-6">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-gradient-to-tr from-brand-600 to-indigo-600 text-white shadow-md shadow-brand-500/20">
              <Key className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">AI Engine & API Settings</h3>
              <p className="text-xs text-slate-400">Configure Google Gemini for live analytical planning</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <div className="flex flex-col gap-4 text-xs">
          <div>
            <label className="font-semibold text-slate-200 block mb-1.5 flex items-center justify-between">
              <span>Google Gemini API Key</span>
              <a
                href="https://aistudio.google.com/app/apikey"
                target="_blank"
                rel="noreferrer"
                className="text-brand-400 hover:underline flex items-center gap-1 font-normal"
              >
                Get Free API Key <ExternalLink className="w-3 h-3" />
              </a>
            </label>
            <input
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="AIzaSy... or custom Gemini key"
              className="w-full rounded-xl bg-slate-950 border border-slate-800 px-3.5 py-2.5 text-slate-200 placeholder-slate-600 focus:border-brand-500 focus:outline-none font-mono"
            />
            <p className="text-[11px] text-slate-500 mt-1 flex items-center gap-1">
              <Shield className="w-3 h-3 text-emerald-400" /> Key is kept secure and never logged.
            </p>
          </div>

          <div>
            <label className="font-semibold text-slate-200 block mb-1.5">
              Active Gemini Model
            </label>
            <select
              value={model}
              onChange={(e) => setModel(e.target.value)}
              className="w-full rounded-xl bg-slate-950 border border-slate-800 px-3.5 py-2.5 text-slate-200 focus:border-brand-500 focus:outline-none"
            >
              <option value="gemini-3.8-flash">gemini-3.8-flash (Recommended, Fast & Grounded)</option>
              <option value="gemini-1.5-pro">gemini-1.5-pro (Deep Reasoning & Long Context)</option>
              <option value="gemini-1.5-flash">gemini-1.5-flash (Standard)</option>
            </select>
          </div>

          <div className="rounded-xl border border-indigo-500/20 bg-indigo-950/20 p-3.5 flex items-start gap-2.5 text-indigo-300">
            <Sparkles className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
            <p className="leading-relaxed">
              When an API key is active, Gemini will reason over schemas and synthesize executive business narratives. If no key is provided, the platform automatically uses the built-in deterministic engine!
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-800">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white transition"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-5 py-2 rounded-xl bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 text-white text-xs font-bold shadow-lg shadow-brand-500/25 transition flex items-center gap-1.5"
          >
            {saved ? (
              <>
                <CheckCircle2 className="w-4 h-4 text-emerald-300" />
                <span>Saved!</span>
              </>
            ) : (
              <span>Save Configuration</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
