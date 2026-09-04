export interface Transaction {
  id: string;
  timestamp: string;
  amount: number;
  time: number; // Seconds since first transaction in dataset
  pcaFeatures: Record<string, number>;
  fraudProbability: number;
  predictionClass: 0 | 1;
  userOverride?: 0 | 1 | null;
  merchant: string;
  cardBrand: 'visa' | 'mastercard' | 'amex' | 'discover';
  cardLast4: string;
  location: string;
  shapValues: Record<string, number>;
  riskFactors: string[];
}

export interface ModelMetrics {
  id: string;
  version: string;
  accuracy: number;
  precision: number;
  recall: number;
  f1Score: number;
  aucRoc: number;
  deployedAt: string;
  isActive: boolean;
  algorithm: string;
}

// Preset transaction profiles for single prediction forms (easy demo testing)
export const PRESETS = {
  legitimate: {
    label: "Legitimate Transaction (Low Risk)",
    time: 148230.0,
    amount: 85.50,
    pcaFeatures: {
      V1: 1.198, V2: 0.244, V3: 0.486, V4: 0.599, V5: -0.228, V6: -0.475,
      V7: 0.040, V8: -0.118, V9: 0.279, V10: -0.180, V11: 0.312, V12: 0.814,
      V13: 0.612, V14: -0.054, V15: 0.128, V16: 0.164, V17: -0.428, V18: -0.112,
      V19: -0.052, V20: -0.068, V21: -0.228, V22: -0.584, V23: 0.124, V24: 0.054,
      V25: 0.184, V26: 0.110, V27: -0.012, V28: 0.018
    }
  },
  highRisk: {
    label: "Confirmed Fraud (High Risk)",
    time: 406.0,
    amount: 1250.00,
    pcaFeatures: {
      V1: -2.312, V2: 1.952, V3: -1.610, V4: 3.990, V5: -0.522, V6: -1.410,
      V7: -2.510, V8: 0.857, V9: -2.314, V10: -3.854, V11: 3.104, V12: -4.812,
      V13: 0.952, V14: -5.610, V15: -0.210, V16: -2.914, V17: -5.102, V18: -1.810,
      V19: 1.102, V20: 0.124, V21: 0.517, V22: -0.035, V23: -0.465, V24: 0.142,
      V25: 0.312, V26: 0.518, V27: 0.612, V28: 0.184
    }
  },
  borderline: {
    label: "Suspected Anomalous (Medium Risk)",
    time: 85210.0,
    amount: 450.00,
    pcaFeatures: {
      V1: -0.812, V2: 0.814, V3: 0.912, V4: 1.810, V5: 0.228, V6: 0.112,
      V7: -0.312, V8: 0.214, V9: -0.612, V10: -0.814, V11: 1.112, V12: -1.214,
      V13: 0.312, V14: -1.812, V15: 0.612, V16: -0.612, V17: -0.914, V18: -0.212,
      V19: 0.514, V20: 0.184, V21: 0.112, V22: 0.314, V23: -0.112, V24: -0.228,
      V25: 0.110, V26: -0.312, V27: 0.184, V28: 0.054
    }
  }
};

export const MOCK_MODELS: ModelMetrics[] = [
  {
    id: "m1",
    version: "v1.2.0-xgb",
    accuracy: 0.9995,
    precision: 0.924,
    recall: 0.865,
    f1Score: 0.893,
    aucRoc: 0.988,
    deployedAt: "2026-07-01T12:00:00Z",
    isActive: true,
    algorithm: "XGBoost Classifier (SMOTE Optimized)"
  },
  {
    id: "m2",
    version: "v1.1.0-rf",
    accuracy: 0.9992,
    precision: 0.885,
    recall: 0.821,
    f1Score: 0.852,
    aucRoc: 0.974,
    deployedAt: "2026-06-15T08:30:00Z",
    isActive: false,
    algorithm: "Random Forest Classifier"
  },
  {
    id: "m3",
    version: "v1.0.0-lr",
    accuracy: 0.9989,
    precision: 0.810,
    recall: 0.743,
    f1Score: 0.775,
    aucRoc: 0.942,
    deployedAt: "2026-05-10T14:15:00Z",
    isActive: false,
    algorithm: "Logistic Regression"
  }
];

export const MOCK_DASHBOARD_STATS = {
  totalProcessed: 145920,
  processedVolume: 12485900.50,
  fraudAlerts: 247,
  falsePositives: 18,
  avgRiskScore: 0.012,
  accuracyRate: 99.94,
  latencyMs: 38,
  activeAlerts: [
    { id: "tx-101", amount: 2500.00, probability: 0.965, merchant: "Target Store #2214", location: "Minneapolis, MN", timeAgo: "2 mins ago" },
    { id: "tx-102", amount: 489.90, probability: 0.884, merchant: "BestBuy Online", location: "Digital", timeAgo: "12 mins ago" },
    { id: "tx-103", amount: 1543.00, probability: 0.921, merchant: "Apple Store Infinite Loop", location: "Cupertino, CA", timeAgo: "45 mins ago" }
  ]
};

export const MOCK_HISTORY_TRANSACTIONS: Transaction[] = [
  {
    id: "tx-1290",
    timestamp: "2026-07-16T16:55:00Z",
    amount: 1250.00,
    time: 406.0,
    pcaFeatures: PRESETS.highRisk.pcaFeatures,
    fraudProbability: 0.9650,
    predictionClass: 1,
    merchant: "Electronics Depot Store",
    cardBrand: "visa",
    cardLast4: "4321",
    location: "Miami, FL",
    shapValues: { V17: -0.45, V14: -0.38, V12: -0.32, Amount: 0.28, V4: 0.22, V3: -0.15 },
    riskFactors: ["Extreme negative score on V17/V14/V12 indicators", "Unusually high transaction volume relative to historical benchmark", "Location mismatch vs card billing footprint"]
  },
  {
    id: "tx-1289",
    timestamp: "2026-07-16T16:42:00Z",
    amount: 85.50,
    time: 148230.0,
    pcaFeatures: PRESETS.legitimate.pcaFeatures,
    fraudProbability: 0.0012,
    predictionClass: 0,
    merchant: "Whole Foods Market",
    cardBrand: "mastercard",
    cardLast4: "8821",
    location: "Austin, TX",
    shapValues: { V12: 0.15, V25: 0.08, V14: 0.05, Amount: -0.02 },
    riskFactors: []
  },
  {
    id: "tx-1288",
    timestamp: "2026-07-16T15:20:00Z",
    amount: 450.00,
    time: 85210.0,
    pcaFeatures: PRESETS.borderline.pcaFeatures,
    fraudProbability: 0.5840,
    predictionClass: 1,
    merchant: "Nordstrom Mall Plaza",
    cardBrand: "amex",
    cardLast4: "1004",
    location: "Seattle, WA",
    shapValues: { V14: -0.22, V12: -0.18, Amount: 0.12, V11: 0.10, V2: 0.05 },
    riskFactors: ["Elevated signal V14/V12 anomalies", "High transaction value"]
  },
  {
    id: "tx-1287",
    timestamp: "2026-07-16T14:10:00Z",
    amount: 15.30,
    time: 148110.0,
    pcaFeatures: PRESETS.legitimate.pcaFeatures,
    fraudProbability: 0.0040,
    predictionClass: 0,
    merchant: "Starbucks Coffee",
    cardBrand: "visa",
    cardLast4: "5543",
    location: "Seattle, WA",
    shapValues: { V12: 0.08, Amount: -0.11 },
    riskFactors: []
  },
  {
    id: "tx-1286",
    timestamp: "2026-07-16T12:05:00Z",
    amount: 2200.00,
    time: 147500.0,
    pcaFeatures: PRESETS.highRisk.pcaFeatures,
    fraudProbability: 0.9412,
    predictionClass: 1,
    merchant: "Luxury Watch Retailer",
    cardBrand: "discover",
    cardLast4: "9900",
    location: "New York, NY",
    shapValues: { V17: -0.42, V14: -0.35, V12: -0.30, Amount: 0.32 },
    riskFactors: ["Extreme signature deviation", "High-value high-risk merchant category"]
  },
  {
    id: "tx-1285",
    timestamp: "2026-07-16T10:15:00Z",
    amount: 120.00,
    time: 147100.0,
    pcaFeatures: PRESETS.legitimate.pcaFeatures,
    fraudProbability: 0.0150,
    predictionClass: 0,
    userOverride: null,
    merchant: "Shell Fuel Station",
    cardBrand: "visa",
    cardLast4: "3022",
    location: "Chicago, IL",
    shapValues: { Amount: -0.05, V12: 0.04 },
    riskFactors: []
  },
  {
    id: "tx-1284",
    timestamp: "2026-07-16T09:45:00Z",
    amount: 980.00,
    time: 146800.0,
    pcaFeatures: PRESETS.borderline.pcaFeatures,
    fraudProbability: 0.7250,
    predictionClass: 1,
    userOverride: 0, // Analyst marked as False Positive (Override = Legitimate)
    merchant: "Apple Online Store",
    cardBrand: "amex",
    cardLast4: "5002",
    location: "Digital",
    shapValues: { V14: -0.28, V12: -0.21, Amount: 0.15 },
    riskFactors: ["Anomalous feature values", "Marked as legitimate by user override (False Positive)"]
  }
];

export const MOCK_ANALYTICS_TRENDS = {
  dailyPerformance: [
    { date: "Jul 10", transactions: 24500, fraudAlerts: 41, rate: 0.16 },
    { date: "Jul 11", transactions: 23100, fraudAlerts: 38, rate: 0.16 },
    { date: "Jul 12", transactions: 21200, fraudAlerts: 29, rate: 0.13 },
    { date: "Jul 13", transactions: 25400, fraudAlerts: 48, rate: 0.18 },
    { date: "Jul 14", transactions: 26800, fraudAlerts: 52, rate: 0.19 },
    { date: "Jul 15", transactions: 24920, fraudAlerts: 39, rate: 0.15 },
    { date: "Jul 16", transactions: 145920, fraudAlerts: 247, rate: 0.17 }
  ],
  amountDistribution: [
    { range: "$0-10", legitimate: 45000, fraud: 12 },
    { range: "$10-50", legitimate: 52000, fraud: 25 },
    { range: "$50-200", legitimate: 38000, fraud: 65 },
    { range: "$200-1000", legitimate: 9500, fraud: 85 },
    { range: "$1000+", legitimate: 1420, fraud: 60 }
  ],
  topCorrelations: [
    { feature: "V17", impact: -0.65, description: "Strong negative correlation; lower V17 signals high fraud likelihood" },
    { feature: "V14", impact: -0.58, description: "Strong negative correlation; principal anomaly marker" },
    { feature: "V12", impact: -0.52, description: "Moderate negative correlation; key variance indicators" },
    { feature: "V10", impact: -0.48, description: "Moderate negative correlation" },
    { feature: "Amount", impact: 0.35, description: "Positive correlation; larger amounts marginally increase risk thresholds" },
    { feature: "V4", impact: 0.32, description: "Positive correlation; indicates high anomaly alignment" }
  ]
};

export const MOCK_DIAGNOSTICS = {
  cpu: { usage: 22, temp: 42, history: [18, 24, 21, 15, 29, 22] },
  memory: { usage: 48, limit: 16, history: [45, 46, 47, 48, 48, 48] },
  dbPool: { active: 12, idle: 38, max: 100 },
  retrainLog: [
    { stage: "Data ingestion", status: "completed", timestamp: "2026-07-16T12:00:00Z" },
    { stage: "Undersampling / SMOTE Balancing", status: "completed", timestamp: "2026-07-16T12:05:00Z" },
    { stage: "XGBoost Hyperparameter GridSearch", status: "completed", timestamp: "2026-07-16T12:35:00Z" },
    { stage: "SHAP Explainer pre-calculation", status: "completed", timestamp: "2026-07-16T12:45:00Z" },
    { stage: "Model serialization and local registry save", status: "completed", timestamp: "2026-07-16T12:50:00Z" }
  ]
};
