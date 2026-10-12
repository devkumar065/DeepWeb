import axios from "axios";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";

const api = axios.create({
  baseURL: API_URL,
  timeout: 120000, // 2 min for long operations
  headers: { "Content-Type": "application/json" },
});

// ── Crawl ──────────────────────────────────────────────────────────────
export const crawlApi = {
  start: (url: string, maxPages = 100) =>
    api.post("/crawl/start", { url, max_pages: maxPages }),
  status: (jobId: string) =>
    api.get(`/crawl/status/${jobId}`),
  pages: (jobId: string) =>
    api.get(`/crawl/pages/${jobId}`),
};

// ── Unified Scan (New Pipeline) ───────────────────────────────────────────
// Replaces the old crawl → analysis → screenshots → assets flow
export const scanApi = {
  start: (url: string, maxPages = 20) =>
    api.post("/scan/start", { url, max_pages: maxPages }),
  status: (scanId: string) =>
    api.get(`/scan/status/${scanId}`),
  results: (scanId: string) =>
    api.get(`/scan/results/${scanId}`),
  streamUrl: (scanId: string) =>
    `${API_URL}/scan/stream/${scanId}`,
};

// ── Analysis ───────────────────────────────────────────────────────────
export const analysisApi = {
  analyze: (url: string, jobId?: string) =>
    api.post("/analysis/website", { url, job_id: jobId }),
};

// ── Screenshots ────────────────────────────────────────────────────────
export const screenshotsApi = {
  capture: (url: string, jobId?: string, viewports?: string[]) =>
    api.post("/screenshots/capture", {
      url,
      job_id: jobId,
      viewports: viewports || ["desktop", "tablet", "mobile"],
      full_page: true,
    }),
  get: (jobId: string) =>
    api.get(`/screenshots/${jobId}`),
};

// ── Assets ─────────────────────────────────────────────────────────────
export const assetsApi = {
  extract: (url: string, jobId?: string) =>
    api.post("/assets/extract", { url, job_id: jobId }),
  get: (jobId: string) =>
    api.get(`/assets/${jobId}`),
  downloadUrl: (assetUrl: string) =>
    `${API_URL}/assets/download?asset_url=${encodeURIComponent(assetUrl)}`,
};

// ── AI ─────────────────────────────────────────────────────────────────
export const aiApi = {
  analyze: (url: string, jobId: string, analysisData: Record<string, unknown>) =>
    api.post("/ai/analyze", { url, job_id: jobId, analysis_data: analysisData }),
  redesign: (url: string, style: string, analysisData: Record<string, unknown>) =>
    api.post("/ai/redesign", { url, style, analysis_data: analysisData }),
  content: (url: string, htmlContent?: string) =>
    api.post("/ai/content", { url, html_content: htmlContent }),
};

// ── Export ─────────────────────────────────────────────────────────────
export const exportApi = {
  json: (data: Record<string, unknown>, url: string, jobId: string) =>
    api.post("/export/json", { data, url, job_id: jobId, format: "json" }, { responseType: "blob" }),
  txt: (data: Record<string, unknown>, url: string, jobId: string) =>
    api.post("/export/txt", { data, url, job_id: jobId, format: "txt" }, { responseType: "blob" }),
  csv: (data: Record<string, unknown>, url: string, jobId: string) =>
    api.post("/export/csv", { data, url, job_id: jobId, format: "csv" }, { responseType: "blob" }),
  markdown: (data: Record<string, unknown>, url: string, jobId: string) =>
    api.post("/export/markdown", { data, url, job_id: jobId, format: "markdown" }, { responseType: "blob" }),
  html: (data: Record<string, unknown>, url: string, jobId: string) =>
    api.post("/export/html", { data, url, job_id: jobId, format: "html" }, { responseType: "blob" }),
  zip: (data: Record<string, unknown>, url: string, jobId: string) =>
    api.post("/export/zip", { data, url, job_id: jobId, format: "zip" }, { responseType: "blob" }),
};

// ── Stats ──────────────────────────────────────────────────────────────
export const statsApi = {
  get: () => api.get("/stats/"),
};

export default api;

