import os
from typing import Dict, Any, Tuple, List

import joblib
import numpy as np
import pandas as pd

from app.core.config import get_settings

settings = get_settings()

FEATURE_COLUMNS_DEFAULT = [f"V{i}" for i in range(1, 29)] + ["scaled_amount", "scaled_time"]
PCA_COLUMNS = [f"V{i}" for i in range(1, 29)]


class MLServiceError(RuntimeError):
    pass


class MLService:
    def __init__(self):
        self.model = None
        self.amount_scaler = None
        self.time_scaler = None
        self.feature_columns = FEATURE_COLUMNS_DEFAULT
        self.explainer = None
        self.metrics: Dict[str, Any] = {}
        self.is_loaded = False
        self.load_error: str | None = None
        self.model_path = settings.MODEL_PATH
        self.load_model()

    def load_model(self, model_path: str = None):
        path = model_path or settings.MODEL_PATH
        self.model_path = path
        if not os.path.exists(path):
            self.is_loaded = False
            self.load_error = f"Model file not found at {path}"
            print(f"[Error] {self.load_error}")
            return

        try:
            payload = joblib.load(path)
            self.model = payload.get("model")
            self.amount_scaler = payload.get("amount_scaler")
            self.time_scaler = payload.get("time_scaler")
            self.feature_columns = payload.get("feature_columns", FEATURE_COLUMNS_DEFAULT)
            self.metrics = payload.get("metrics", {})

            if self.model is None:
                raise ValueError("Serialized payload is missing the 'model' key")

            try:
                import shap

                self.explainer = shap.TreeExplainer(self.model)
            except Exception as e:
                print(f"[Warning] Could not initialize SHAP TreeExplainer: {e}")
                self.explainer = None

            self.is_loaded = True
            self.load_error = None
            print(f"[Success] Loaded fraud detection model from {path}")
        except Exception as e:
            self.is_loaded = False
            self.load_error = str(e)
            print(f"[Error] Failed to load model from {path}: {e}")

    def _require_loaded(self):
        if not self.is_loaded or self.model is None:
            raise MLServiceError(
                self.load_error or "Fraud detection model is not loaded. Cannot generate predictions."
            )

    def _scale_amount(self, amounts: np.ndarray) -> np.ndarray:
        values = amounts.reshape(-1, 1)
        if self.amount_scaler is not None:
            return self.amount_scaler.transform(values).reshape(-1)
        return amounts.astype(float)

    def _scale_time(self, times: np.ndarray) -> np.ndarray:
        values = times.reshape(-1, 1)
        if self.time_scaler is not None:
            return self.time_scaler.transform(values).reshape(-1)
        return times.astype(float)

    def _feature_frame(self, pca_matrix: np.ndarray, amounts: np.ndarray, times: np.ndarray) -> pd.DataFrame:
        scaled_amount = self._scale_amount(amounts)
        scaled_time = self._scale_time(times)
        data = {col: pca_matrix[:, idx] for idx, col in enumerate(PCA_COLUMNS)}
        data["scaled_amount"] = scaled_amount
        data["scaled_time"] = scaled_time
        frame = pd.DataFrame(data)
        return frame[self.feature_columns]

    def _shap_for_row(self, df_row: pd.DataFrame) -> Dict[str, float]:
        if not self.explainer:
            return {}
        try:
            shap_vals = self.explainer.shap_values(df_row)
            if isinstance(shap_vals, list):
                vals = shap_vals[1][0] if len(shap_vals) > 1 else shap_vals[0][0]
            else:
                vals = shap_vals[0]
            shap_dict = {}
            for col, val in zip(self.feature_columns, vals):
                display_name = "Amount" if col == "scaled_amount" else ("Time" if col == "scaled_time" else col)
                shap_dict[display_name] = round(float(val), 4)
            return shap_dict
        except Exception as e:
            print(f"[Warning] SHAP computation error: {e}")
            return {}

    def _risk_factors(self, shap_dict: Dict[str, float], fraud_prob: float) -> List[str]:
        risk_factors: List[str] = []
        sorted_shap = sorted(shap_dict.items(), key=lambda x: abs(x[1]), reverse=True)
        for feat, val in sorted_shap[:3]:
            if val > 0.05:
                risk_factors.append(f"Feature '{feat}' increased the fraud score")
            elif val < -0.05:
                risk_factors.append(f"Feature '{feat}' decreased the fraud score")
        if fraud_prob >= settings.FRAUD_THRESHOLD and not risk_factors:
            risk_factors.append("Model score exceeded the fraud classification threshold")
        return risk_factors

    def predict_single(
        self, time_val: float, amount_val: float, pca_features: Dict[str, float]
    ) -> Tuple[float, int, Dict[str, float], List[str]]:
        self._require_loaded()
        pca_matrix = np.array([[float(pca_features[col]) for col in PCA_COLUMNS]], dtype=float)
        df_row = self._feature_frame(
            pca_matrix,
            np.array([float(amount_val)], dtype=float),
            np.array([float(time_val)], dtype=float),
        )
        probs = self.model.predict_proba(df_row)[0]
        fraud_prob = float(probs[1])
        pred_class = int(fraud_prob >= settings.FRAUD_THRESHOLD)
        shap_dict = self._shap_for_row(df_row)
        return round(fraud_prob, 4), pred_class, shap_dict, self._risk_factors(shap_dict, fraud_prob)

    def predict_df(self, df: pd.DataFrame) -> pd.DataFrame:
        self._require_loaded()
        pca_matrix = df[PCA_COLUMNS].astype(float).to_numpy()
        amounts = df["Amount"].astype(float).to_numpy()
        times = df["Time"].astype(float).to_numpy()
        feature_frame = self._feature_frame(pca_matrix, amounts, times)
        probs = self.model.predict_proba(feature_frame)[:, 1]
        pred_class = (probs >= settings.FRAUD_THRESHOLD).astype(int)
        result = df.copy().reset_index(drop=True)
        result["fraud_probability"] = np.round(probs.astype(float), 4)
        result["prediction_class"] = pred_class
        return result


ml_service = MLService()
