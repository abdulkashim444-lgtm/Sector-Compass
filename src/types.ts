export type SectorIndex =
  | "Nifty Bank"
  | "Nifty Private Bank"
  | "Nifty PSU Bank"
  | "Nifty IT"
  | "Nifty Auto"
  | "Nifty Pharma"
  | "Nifty Metal"
  | "Nifty FMCG"
  | "Nifty Energy"
  | "Nifty Realty"
  | "Nifty Media"
  | "Nifty Financial Services"
  | "Nifty Healthcare"
  | "Nifty Consumer";

export type MarketRegime = "Risk-On Trending" | "Risk-Off Dislocated" | "Range-Bound";

export interface ModelConfig {
  architecture: "GCN" | "GAT" | "GATv2" | "TGAT" | "Relational GAT" | "Signed GAT" | "Regime-MoE";
  layers: number;
  heads: number;
  features: string[]; // "momentum" | "volatility" | "breadth" | "macro"
  adjacencyMethod: "correlation" | "partial_correlation" | "mutual_info";
  adjacencyThreshold: number;
  addFullConnectivity: boolean;
  mcSamples: number;
  conformalAlpha: number;
  eventGating: boolean;
  dropEdgeRate: number;
  weightDecay: number;
}

export interface BacktestMetrics {
  totalReturn: number;
  benchReturn: number;
  cagr: number;
  volatility: number;
  ir: number; // Information Ratio
  trackingError: number;
  hitRate: number;
  maxDrawdown: number;
  meanIc: number; // Information Coefficient
  icir: number; // Stability of IC
  pbo: number; // Probability of Backtest Overfitting
  dsr: number; // Deflated Sharpe Ratio
}

export interface ScenarioDefinition {
  id: string;
  name: string;
  trigger: string;
  description: string;
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  expectedPattern: string;
}

export interface CampaignLevel {
  level: number;
  title: string;
  objective: string;
  scenarioId: string;
  unlockPoints: number;
  minIc: number;
  minIr: number;
  requiredArchitecture: string[];
  requiredFeatures: string[];
  instructions: string[];
}

export interface SectorDataPoint {
  date: string; // YYYY-MM-DD
  prices: Record<SectorIndex, number>;
  volumes: Record<SectorIndex, number>;
  returns: Record<SectorIndex, number>;
  regime: MarketRegime;
  regimePosterior: Record<MarketRegime, number>;
  macro: {
    usdInr: number;
    gilt10y: number;
    brentCrude: number;
  };
}

export interface AttentionEdge {
  source: SectorIndex;
  target: SectorIndex;
  weight: number;
  type?: "correlation" | "leads" | "co_flows";
  sign?: "positive" | "negative";
}
