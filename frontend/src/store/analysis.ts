import { create } from "zustand";

export type AnalysisStep =
  | "idle"
  | "crawling"
  | "analyzing"
  | "screenshots"
  | "assets"
  | "ai"
  | "complete";

export interface DiscoveredPage {
  url: string;
  title?: string;
  type: string;
  depth: number;
  status_code?: number;
}

export interface Asset {
  type: string;
  url: string;
  filename: string;
  format?: string;
  width?: number;
  height?: number;
  file_size?: number;
  alt_text?: string;
  category?: string;
  inline_content?: string;
}

export interface Screenshot {
  viewport: string;
  data_url?: string;
  width: number;
  height: number;
  full_page: boolean;
  error?: string;
}

export interface Technology {
  name: string;
  category: string;
  confidence: number;
  version?: string;
}

export interface BrandColor {
  hex: string;
  rgb: string;
  hsl: string;
  frequency?: number;
}

export interface Font {
  family: string;
  weights?: string[];
  source?: string;
}

export interface AnalysisState {
  // Input
  url: string;
  setUrl: (url: string) => void;

  // Job
  jobId: string | null;
  step: AnalysisStep;
  progress: number;
  logs: string[];

  // Data
  pages: DiscoveredPage[];
  overview: Record<string, unknown> | null;
  brand: Record<string, unknown> | null;
  navigation: Record<string, unknown> | null;
  seo: Record<string, unknown> | null;
  technologies: Technology[];
  social: Record<string, string | null> | null;
  contacts: Record<string, unknown> | null;
  assets: Asset[];
  screenshots: Screenshot[];
  aiAnalysis: Record<string, unknown> | null;
  aiRedesign: Record<string, unknown> | null;

  // Actions
  setJobId: (id: string) => void;
  setStep: (step: AnalysisStep) => void;
  setProgress: (progress: number) => void;
  addLog: (log: string) => void;
  setLogs: (logs: string[]) => void;
  setPages: (pages: DiscoveredPage[]) => void;
  setOverview: (d: Record<string, unknown>) => void;
  setBrand: (d: Record<string, unknown>) => void;
  setNavigation: (d: Record<string, unknown>) => void;
  setSeo: (d: Record<string, unknown>) => void;
  setTechnologies: (d: Technology[]) => void;
  setSocial: (d: Record<string, string | null>) => void;
  setContacts: (d: Record<string, unknown>) => void;
  setAssets: (d: Asset[]) => void;
  setScreenshots: (d: Screenshot[]) => void;
  setAiAnalysis: (d: Record<string, unknown>) => void;
  setAiRedesign: (d: Record<string, unknown>) => void;
  reset: () => void;
}

const initialState = {
  url: "",
  jobId: null,
  step: "idle" as AnalysisStep,
  progress: 0,
  logs: [],
  pages: [],
  overview: null,
  brand: null,
  navigation: null,
  seo: null,
  technologies: [],
  social: null,
  contacts: null,
  assets: [],
  screenshots: [],
  aiAnalysis: null,
  aiRedesign: null,
};

export const useAnalysisStore = create<AnalysisState>((set) => ({
  ...initialState,

  setUrl: (url) => set({ url }),
  setJobId: (jobId) => set({ jobId }),
  setStep: (step) => set({ step }),
  setProgress: (progress) => set({ progress }),
  addLog: (log) => set((s) => ({ logs: [...s.logs, log].slice(-200) })),
  setLogs: (logs) => set({ logs }),
  setPages: (pages) => set({ pages }),
  setOverview: (overview) => set({ overview }),
  setBrand: (brand) => set({ brand }),
  setNavigation: (navigation) => set({ navigation }),
  setSeo: (seo) => set({ seo }),
  setTechnologies: (technologies) => set({ technologies }),
  setSocial: (social) => set({ social }),
  setContacts: (contacts) => set({ contacts }),
  setAssets: (assets) => set({ assets }),
  setScreenshots: (screenshots) => set({ screenshots }),
  setAiAnalysis: (aiAnalysis) => set({ aiAnalysis }),
  setAiRedesign: (aiRedesign) => set({ aiRedesign }),
  reset: () => set(initialState),
}));
