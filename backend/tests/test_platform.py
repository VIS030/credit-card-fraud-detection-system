import uuid

import joblib
import pandas as pd
from fastapi.testclient import TestClient

from app.core.config import get_settings
from app.main import app
from app.services.ml_service import ml_service

client = TestClient(app)

LEGIT = {
    "time": 148230.0,
    "amount": 85.50,
    "pca_features": {
        "V1": 1.198, "V2": 0.244, "V3": 0.486, "V4": 0.599, "V5": -0.228, "V6": -0.475,
        "V7": 0.040, "V8": -0.118, "V9": 0.279, "V10": -0.180, "V11": 0.312, "V12": 0.814,
        "V13": 0.612, "V14": -0.054, "V15": 0.128, "V16": 0.164, "V17": -0.428, "V18": -0.112,
        "V19": -0.052, "V20": -0.068, "V21": -0.228, "V22": -0.584, "V23": 0.124, "V24": 0.054,
        "V25": 0.184, "V26": 0.110, "V27": -0.012, "V28": 0.018,
    },
}

FRAUD = {
    "time": 406.0,
    "amount": 1250.00,
    "pca_features": {
        "V1": -2.312, "V2": 1.952, "V3": -1.610, "V4": 3.990, "V5": -0.522, "V6": -1.410,
        "V7": -2.510, "V8": 0.857, "V9": -2.314, "V10": -3.854, "V11": 3.104, "V12": -4.812,
        "V13": 0.952, "V14": -5.610, "V15": -0.210, "V16": -2.914, "V17": -5.102, "V18": -1.810,
        "V19": 1.102, "V20": 0.124, "V21": 0.517, "V22": -0.035, "V23": -0.465, "V24": 0.142,
        "V25": 0.312, "V26": 0.518, "V27": 0.612, "V28": 0.184,
    },
}


def login(email="admin@fraudguard.ai", password="password123"):
    response = client.post("/api/v1/auth/login", json={"email": email, "password": password})
    assert response.status_code == 200, response.text
    token = response.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


def test_unauthenticated_predict_rejected():
    response = client.post("/api/v1/predict", json=LEGIT)
    assert response.status_code == 401


def test_login_invalid_credentials():
    response = client.post(
        "/api/v1/auth/login",
        json={"email": "admin@fraudguard.ai", "password": "wrong-password"},
    )
    assert response.status_code == 401


def test_login_and_protected_profile():
    headers = login()
    profile = client.get("/api/v1/auth/profile", headers=headers)
    assert profile.status_code == 200
    assert profile.json()["email"] == "admin@fraudguard.ai"


def test_register_duplicate_and_new_user():
    email = f"analyst-{uuid.uuid4().hex[:8]}@fraudguard.ai"
    created = client.post(
        "/api/v1/auth/register",
        json={"email": email, "password": "securepass", "full_name": "QA Analyst"},
    )
    assert created.status_code == 201
    duplicate = client.post(
        "/api/v1/auth/register",
        json={"email": email, "password": "securepass", "full_name": "QA Analyst"},
    )
    assert duplicate.status_code == 400
    headers = login(email, "securepass")
    history = client.get("/api/v1/history", headers=headers)
    assert history.status_code == 200
    assert history.json() == []


def test_direct_model_matches_api_for_legit_and_fraud():
    assert ml_service.is_loaded
    settings = get_settings()
    payload = joblib.load(settings.MODEL_PATH)

    def direct_score(body):
        row = {f"V{i}": float(body["pca_features"][f"V{i}"]) for i in range(1, 29)}
        row["scaled_amount"] = float(payload["amount_scaler"].transform([[body["amount"]]])[0][0])
        row["scaled_time"] = float(payload["time_scaler"].transform([[body["time"]]])[0][0])
        frame = pd.DataFrame([row])[payload["feature_columns"]]
        return float(payload["model"].predict_proba(frame)[0][1])

    headers = login()
    for body, expected_class in ((LEGIT, 0), (FRAUD, 1)):
        api = client.post("/api/v1/predict", json=body, headers=headers)
        assert api.status_code == 200, api.text
        data = api.json()
        direct = direct_score(body)
        assert abs(data["fraud_probability"] - round(direct, 4)) < 1e-6
        assert data["prediction_class"] == expected_class
        assert data["id"]


def test_invalid_zero_pca_rejected():
    headers = login()
    zeros = {f"V{i}": 0.0 for i in range(1, 29)}
    response = client.post(
        "/api/v1/predict",
        json={"time": 10, "amount": 25, "pca_features": zeros},
        headers=headers,
    )
    assert response.status_code == 422


def test_negative_amount_rejected():
    headers = login()
    body = {**LEGIT, "amount": -10}
    response = client.post("/api/v1/predict", json=body, headers=headers)
    assert response.status_code == 422


def test_history_dashboard_and_persistence():
    headers = login()
    before = client.get("/api/v1/dashboard", headers=headers).json()["total_processed"]
    created = client.post("/api/v1/predict", json=LEGIT, headers=headers)
    assert created.status_code == 200
    pred_id = created.json()["id"]
    history = client.get("/api/v1/history", headers=headers)
    assert history.status_code == 200
    ids = [item["id"] for item in history.json()]
    assert pred_id in ids
    dash = client.get("/api/v1/dashboard", headers=headers)
    assert dash.status_code == 200
    assert dash.json()["total_processed"] >= before + 1
    analytics = client.get("/api/v1/analytics", headers=headers)
    assert analytics.status_code == 200
    assert "dailyPerformance" in analytics.json()


def test_csv_prediction_and_column_validation():
    headers = login()
    legit_row = [LEGIT["time"]] + [LEGIT["pca_features"][f"V{i}"] for i in range(1, 29)] + [LEGIT["amount"]]
    fraud_row = [FRAUD["time"]] + [FRAUD["pca_features"][f"V{i}"] for i in range(1, 29)] + [FRAUD["amount"]]
    header = "Time," + ",".join(f"V{i}" for i in range(1, 29)) + ",Amount"
    csv_content = header + "\n" + ",".join(map(str, legit_row)) + "\n" + ",".join(map(str, fraud_row)) + "\n"
    files = {"file": ("batch.csv", csv_content.encode("utf-8"), "text/csv")}
    ok = client.post("/api/v1/predict/csv", files=files, headers=headers)
    assert ok.status_code == 200, ok.text
    body = ok.json()
    assert body["total_rows"] == 2
    assert body["fraud_count"] + body["legitimate_count"] == 2
    assert len(body["results"]) == 2

    missing = client.post(
        "/api/v1/predict/csv",
        files={"file": ("bad.csv", b"Time,Amount\n1,2\n", "text/csv")},
        headers=headers,
    )
    assert missing.status_code == 400

    empty = client.post(
        "/api/v1/predict/csv",
        files={"file": ("empty.csv", b"", "text/csv")},
        headers=headers,
    )
    assert empty.status_code == 400


def test_health_reports_real_services():
    health = client.get("/health")
    assert health.status_code == 200
    payload = health.json()
    assert payload["api"]["status"] == "healthy"
    assert payload["database"]["status"] == "healthy"
    assert payload["model"]["status"] == "healthy"
