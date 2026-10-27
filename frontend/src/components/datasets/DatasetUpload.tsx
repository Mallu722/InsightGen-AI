"use client";

import React, { useState, useRef } from "react";
import { UploadCloud, FileSpreadsheet, AlertCircle, CheckCircle2, Sparkles, Loader2 } from "lucide-react";
import { uploadDataset, DatasetUploadResponse } from "@/lib/api";

interface DatasetUploadProps {
  onUploadSuccess: (response: DatasetUploadResponse) => void;
}

export default function DatasetUpload({ onUploadSuccess }: DatasetUploadProps) {
  const [dragActive, setDragActive] = useState<boolean>(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelected(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileSelected(e.target.files[0]);
    }
  };

  const handleFileSelected = (file: File) => {
    setError(null);
    const validExts = [".csv", ".xlsx", ".xls"];
    const ext = file.name.slice(file.name.lastIndexOf(".")).toLowerCase();
    if (!validExts.includes(ext)) {
      setError(`Invalid file type '${ext}'. Please choose a CSV (.csv) or Excel (.xlsx, .xls) file.`);
      setSelectedFile(null);
      return;
    }
    if (file.size === 0) {
      setError("The selected file is empty (0 bytes). Please select a valid dataset.");
      setSelectedFile(null);
      return;
    }
    setSelectedFile(file);
  };

  const handleUpload = async () => {
    if (!selectedFile) return;
    setUploading(true);
    setError(null);
    try {
      const result = await uploadDataset(selectedFile);
      onUploadSuccess(result);
    } catch (err: any) {
      setError(err?.message || "File upload failed. Please verify the backend is running.");
    } finally {
      setUploading(false);
    }
  };

  // Instant demo helper: uses bundled sample sales CSV
  const handleLoadSampleData = async () => {
    setUploading(true);
    setError(null);
    try {
      const sampleCsv = `transaction_id,date,region,rep_name,product_category,units_sold,unit_price,discount,total_revenue,customer_segment
TXN-1001,2026-01-05,North,Sarah Jenkins,Electronics,12,350.00,0.05,3990.00,Enterprise
TXN-1002,2026-01-07,South,Rajesh Kumar,Office Supplies,45,22.50,0.00,1012.50,SMB
TXN-1003,2026-01-08,West,Elena Rostova,Furniture,8,420.00,0.10,3024.00,Enterprise
TXN-1004,2026-01-10,East,Michael Chen,Electronics,25,180.00,0.00,4500.00,Consumer
TXN-1005,2026-01-12,North,Sarah Jenkins,Furniture,5,750.00,0.15,3187.50,Enterprise
TXN-1006,2026-01-15,West,Elena Rostova,Electronics,30,95.00,0.00,2850.00,SMB
TXN-1007,2026-01-18,South,Rajesh Kumar,Electronics,15,350.00,0.05,4987.50,Enterprise
TXN-1008,2026-01-20,East,Michael Chen,Office Supplies,120,15.00,0.10,1620.00,Consumer
TXN-1009,2026-01-22,North,Sarah Jenkins,Office Supplies,80,18.00,0.00,1440.00,SMB
TXN-1010,2026-01-25,West,Elena Rostova,Office Supplies,60,25.00,0.05,1425.00,SMB
TXN-1011,2026-01-28,East,Michael Chen,Furniture,14,290.00,0.08,3735.20,Enterprise
TXN-1012,2026-02-01,South,Rajesh Kumar,Furniture,6,820.00,0.12,4329.60,Enterprise
TXN-1013,2026-02-03,North,Sarah Jenkins,Electronics,18,410.00,0.00,7380.00,Enterprise
TXN-1014,2026-02-05,West,Elena Rostova,Electronics,22,210.00,0.05,4389.00,Consumer
TXN-1015,2026-02-08,East,Michael Chen,Office Supplies,95,14.50,0.00,1377.50,SMB
TXN-1016,2026-02-12,South,Rajesh Kumar,Electronics,8,640.00,0.10,4608.00,Enterprise
TXN-1017,2026-02-15,North,Sarah Jenkins,Furniture,11,380.00,0.05,3971.00,SMB
TXN-1018,2026-02-18,West,Elena Rostova,Furniture,7,550.00,0.15,3272.50,Consumer
TXN-1019,2026-02-22,East,Michael Chen,Electronics,40,120.00,0.00,4800.00,Enterprise
TXN-1020,2026-02-26,South,Rajesh Kumar,Office Supplies,110,12.00,0.00,1320.00,Consumer`;

      const blob = new Blob([sampleCsv], { type: "text/csv" });
      const sampleFile = new File([blob], "sample_sales.csv", { type: "text/csv" });
      setSelectedFile(sampleFile);
      const result = await uploadDataset(sampleFile);
      onUploadSuccess(result);
    } catch (err: any) {
      setError(err?.message || "Failed to load sample dataset");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="w-full flex flex-col gap-4">
      {/* Drag & Drop Zone */}
      <div
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`relative border-2 border-dashed rounded-2xl p-8 flex flex-col items-center justify-center cursor-pointer transition-all ${
          dragActive
            ? "border-brand-500 bg-brand-500/10 scale-[1.01]"
            : "border-slate-800 bg-slate-900/40 hover:border-slate-700 hover:bg-slate-900/60"
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv,.xlsx,.xls"
          onChange={handleFileChange}
          className="hidden"
        />

        <div className="p-4 rounded-2xl bg-brand-500/10 border border-brand-500/20 text-brand-400 mb-4">
          <UploadCloud className="w-8 h-8" />
        </div>

        <h3 className="text-base font-semibold text-white mb-1">
          {selectedFile ? selectedFile.name : "Drag & drop your CSV or Excel file here"}
        </h3>
        <p className="text-xs text-slate-400 max-w-sm text-center">
          Supported formats: <span className="font-mono text-slate-300">.csv, .xlsx, .xls</span> (Up to 50MB)
        </p>

        {selectedFile && (
          <div className="mt-4 px-3 py-1.5 rounded-lg bg-slate-800/80 border border-slate-700 text-xs text-emerald-400 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4" />
            <span>Ready: {(selectedFile.size / 1024).toFixed(1)} KB</span>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        <button
          type="button"
          onClick={handleLoadSampleData}
          disabled={uploading}
          className="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-indigo-500/30 bg-indigo-950/30 hover:bg-indigo-900/40 text-indigo-300 text-xs font-semibold flex items-center justify-center gap-2 transition disabled:opacity-50 cursor-pointer"
        >
          <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
          Test with Bundled Sample (sample_sales.csv)
        </button>

        <button
          type="button"
          onClick={handleUpload}
          disabled={!selectedFile || uploading}
          className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 text-white text-xs font-bold shadow-lg shadow-brand-500/25 transition disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer"
        >
          {uploading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Profiling Dataset...</span>
            </>
          ) : (
            <>
              <FileSpreadsheet className="w-4 h-4" />
              <span>Upload & Profile</span>
            </>
          )}
        </button>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="rounded-xl border border-rose-500/30 bg-rose-950/30 p-4 text-xs text-rose-300 flex items-start gap-3">
          <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
          <p>{error}</p>
        </div>
      )}
    </div>
  );
}
