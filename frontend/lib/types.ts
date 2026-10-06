export interface UserProfile {
  id: string;
  email: string;
  full_name: string | null;
  role: "admin" | "analyst" | string;
  is_active: boolean;
  created_at: string;
}

export interface TokenResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
  user: UserProfile;
}

export interface PredictRequest {
  time: number;
  amount: number;
  pca_features: Record<string, number>;
}

export interface PredictResponse {
  id: string;
  fraud_probability: number;
  prediction_class: 0 | 1;
  shap_values: Record<string, number>;
  risk_factors: string[];
  predicted_at: string;
  model_loaded?: boolean;
}

export interface HistoryItem {
  id: string;
  timestamp: string;
  amount: number;
  time: number;
  fraud_probability: number;
  prediction_class: 0 | 1;
  user_override: 0 | 1 | null;
  pca_features?: Record<string, number> | null;
  shap_values?: Record<string, number> | null;
  risk_factors?: string[] | null;
  file_id?: string | null;
}

export interface DashboardMetrics {
  total_processed: number;
  processed_volume: number;
  fraud_alerts: number;
  legitimate_count: number;
  false_positives: number;
  avg_risk_score: number;
  override_count: number;
  latency_ms: number | null;
}

export interface AnalyticsTrends {
  dailyPerformance: Array<{ date: string; transactions: number; fraudAlerts: number; rate: number }>;
  amountDistribution: Array<{ range: string; legitimate: number; fraud: number }>;
  topCorrelations: Array<{ feature: string; impact: number; description: string }>;
}

export interface BulkUploadResponse {
  file_id: string;
  file_name: string;
  status: string;
  total_rows: number;
  processed_rows: number;
  fraud_count: number;
  legitimate_count: number;
  results: Array<{
    id: string;
    amount: number;
    time: number;
    fraud_probability: number;
    prediction_class: 0 | 1;
  }>;
}

export interface ModelVersion {
  id: string;
  version: string;
  algorithm: string;
  accuracy: number | null;
  precision: number | null;
  recall: number | null;
  f1_score: number | null;
  auc_roc: number | null;
  is_active: boolean;
  deployed_at: string;
}

export interface ServiceStatus {
  name: string;
  status: string;
  detail: string;
}

export interface SystemDiagnostics {
  overall: string;
  api: ServiceStatus;
  database: ServiceStatus;
  model: ServiceStatus;
  authentication: ServiceStatus;
  environment: ServiceStatus;
}

export function mapHistoryToTransaction(item: HistoryItem) {
  return {
    id: item.id,
    timestamp: item.timestamp,
    amount: item.amount,
    time: item.time,
    pcaFeatures: item.pca_features || {},
    fraudProbability: item.fraud_probability,
    predictionClass: item.prediction_class,
    userOverride: item.user_override,
    shapValues: item.shap_values || {},
    riskFactors: item.risk_factors || [],
  };
}
