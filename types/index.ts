// types/index.ts — Global TypeScript interfaces for LUMINARY

export type RiskTier    = "NOMINAL" | "ELEVATED" | "CRITICAL";
export type Severity    = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
export type SignalType  = "MOBILITY" | "AIR_QUALITY" | "NOISE" | "SENTIMENT" | "ENERGY" | "SAFETY";
export type UserRole    = "ADMIN" | "ANALYST" | "VIEWER";

export interface CityKPIs {
  mobilityIndex:    number;
  mobilityDelta:    number;
  openAnomalies:    number;
  criticalAlerts:   number;
  zonesMonitored:   number;
  computedAt:       string;
}

export interface ZoneRisk {
  zoneId:       string;
  zoneName:     string;
  zoneCode:     string;
  district:     string;
  lat:          number;
  lng:          number;
  riskScore:    number;
  riskTier:     RiskTier;
  riskRank:     number;
  weeklyDrift:  number;
  anomalyCount: number;
  avgMobility:  number;
}

export interface AnomalyRecord {
  id:          string;
  zoneId:      string;
  signalType:  SignalType;
  zScore:      number;
  baselineVal: number;
  actualVal:   number;
  severity:    Severity;
  resolved:    boolean;
  detectedAt:  string;
  resolvedAt:  string | null;
  zone: {
    name: string;
    code: string;
    district: { name: string };
  };
}

export interface MobilityPoint {
  day:         string;
  avgScore:    number;
  pedestrians: number;
  vehicles:    number;
}

export interface SentimentSummary {
  zoneId:   string;
  topic:    string;
  avgScore: number;
  volume:   number;
  category: "POSITIVE" | "NEUTRAL" | "NEGATIVE";
}
