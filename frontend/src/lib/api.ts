export interface HealthCheckResponse {
  status: string;
  app_name: string;
  version: string;
  environment: string;
  timestamp: string;
}

export interface NumericStats {
  mean?: number | null;
  std?: number | null;
  min?: number | null;
  q25?: number | null;
  median?: number | null;
  q75?: number | null;
  max?: number | null;
}

export interface ColumnProfile {
  name: string;
  dtype: string;
  python_dtype: string;
  total_count: number;
  null_count: number;
  null_percentage: number;
  unique_count: number;
  sample_values: any[];
  numeric_stats?: NumericStats | null;
}

export interface DatasetMetadata {
  dataset_id: string;
  filename: string;
  file_size_bytes: number;
  row_count: number;
  column_count: number;
  duplicate_rows: number;
  created_at: string;
}

export interface DatasetProfileResponse {
  metadata: DatasetMetadata;
  columns: ColumnProfile[];
  preview_rows: Record<string, any>[];
}

export interface DatasetUploadResponse {
  success: boolean;
  message: string;
  profile: DatasetProfileResponse;
}

export interface AnalysisPlan {
  intent: string;
  operation: string;
  group_by_columns: string[];
  metric_column: string;
  aggregation_function: string;
  sort_order: string;
  limit?: number;
  recommended_chart: string;
  chart_title: string;
}

export interface AnalysisEvidence {
  operation_performed: string;
  columns_used: string[];
  row_count_analyzed: number;
  execution_time_ms: number;
  deterministic_engine: string;
}

export interface ChartConfig {
  chart_type: string;
  x_key: string;
  y_key: string;
  title: string;
  x_label: string;
  y_label: string;
}

export interface AnalysisResponse {
  success: boolean;
  question: string;
  summary: string;
  plan: AnalysisPlan;
  result: Record<string, any>[];
  chart?: ChartConfig | null;
  evidence: AnalysisEvidence;
}

export function getBackendUrl(): string {
  if (typeof window !== "undefined") {
    const custom = localStorage.getItem("INSIGHTGEN_BACKEND_URL");
    if (custom && custom.trim()) {
      return custom.trim().replace(/\/+$/, "");
    }
  }
  if (process.env.NEXT_PUBLIC_API_URL && process.env.NEXT_PUBLIC_API_URL.trim()) {
    return process.env.NEXT_PUBLIC_API_URL.trim().replace(/\/+$/, "");
  }
  if (typeof window !== "undefined" && window.location.hostname.includes("vercel.app")) {
    return "https://insightgen-ai-1.onrender.com";
  }
  return "http://127.0.0.1:8000";
}

export async function fetchBackendHealth(): Promise<HealthCheckResponse> {
  const response = await fetch(`${getBackendUrl()}/health`, {
    cache: "no-store",
  });
  if (!response.ok) {
    throw new Error(`Failed to fetch backend health status (HTTP ${response.status})`);
  }
  return response.json();
}

export async function uploadDataset(file: File): Promise<DatasetUploadResponse> {
  const formData = new FormData();
  formData.append("file", file);

  const response = await fetch(`${getBackendUrl()}/api/datasets/upload`, {
    method: "POST",
    body: formData,
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.detail || `Upload failed with status ${response.status}`);
  }
  return data;
}

export async function fetchDatasetProfile(datasetId: string): Promise<DatasetProfileResponse> {
  const response = await fetch(`${getBackendUrl()}/api/datasets/${datasetId}/profile`, {
    cache: "no-store",
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.detail || `Failed to fetch dataset profile`);
  }
  return data;
}

export async function deleteDataset(datasetId: string): Promise<{ success: boolean; message: string }> {
  const response = await fetch(`${getBackendUrl()}/api/datasets/${datasetId}`, {
    method: "DELETE",
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.detail || `Failed to delete dataset`);
  }
  return data;
}

export async function executeAnalysisQuery(datasetId: string, question: string): Promise<AnalysisResponse> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  if (typeof window !== "undefined") {
    const customKey = localStorage.getItem("INSIGHTGEN_GEMINI_KEY");
    if (customKey && customKey.trim()) {
      headers["x-gemini-key"] = customKey.trim();
    }
  }

  const response = await fetch(`${getBackendUrl()}/api/analysis/query`, {
    method: "POST",
    headers,
    body: JSON.stringify({
      dataset_id: datasetId,
      question: question.trim(),
    }),
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.detail || `Analysis query failed`);
  }
  return data;
}
