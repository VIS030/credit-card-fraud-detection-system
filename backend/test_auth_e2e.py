import requests
import json

BASE_URL = "http://127.0.0.1:8000/api/v1"

def test_full_auth_and_prediction():
    print("==================================================")
    print("STEP 1: UNAUTHENTICATED PREDICTION REQUEST CHECK")
    print("==================================================")
    unauth_resp = requests.post(f"{BASE_URL}/predict", json={"time": 100, "amount": 50, "pca_features": {}})
    print("Unauthenticated Response Status:", unauth_resp.status_code)
    print("Unauthenticated Response Detail:", unauth_resp.json())
    assert unauth_resp.status_code == 401, "Unauthenticated request MUST be rejected with 401!"
    print("[OK] Backend correctly enforces 401 Unauthorized on protected prediction endpoint.")

    print("\n==================================================")
    print("STEP 2: AUTHENTICATION LOGIN & TOKEN GENERATION")
    print("==================================================")
    login_resp = requests.post(f"{BASE_URL}/auth/login", json={"email": "admin@fraudguard.ai", "password": "password123"})
    print("Login Status Code:", login_resp.status_code)
    assert login_resp.status_code == 200, f"Login failed: {login_resp.text}"
    token_data = login_resp.json()
    access_token = token_data["access_token"]
    print("[OK] Access Token Created Successfully.")
    print("  Token preview:", access_token[:35] + "...")

    headers = {"Authorization": f"Bearer {access_token}"}

    print("\n==================================================")
    print("STEP 3: PROFILE VERIFICATION WITH AUTHORIZATION HEADER")
    print("==================================================")
    profile_resp = requests.get(f"{BASE_URL}/auth/profile", headers=headers)
    print("Profile Status:", profile_resp.status_code)
    profile_data = profile_resp.json()
    print("Profile Email:", profile_data["email"], "Role:", profile_data["role"])
    assert profile_resp.status_code == 200, "Profile check failed"
    assert profile_data["email"] == "admin@fraudguard.ai", "User email mismatch"
    print("[OK] Bearer token validated by FastAPI security dependency.")

    print("\n==================================================")
    print("STEP 4: MULTIPLE PREDICTION INPUT TEST (REAL ML MODEL)")
    print("==================================================")
    
    # Input 1: Legitimate Profile
    legit_input = {
        "time": 148230.0,
        "amount": 85.50,
        "pca_features": {
            "V1": 1.198, "V2": 0.244, "V3": 0.486, "V4": 0.599, "V5": -0.228, "V6": -0.475,
            "V7": 0.040, "V8": -0.118, "V9": 0.279, "V10": -0.180, "V11": 0.312, "V12": 0.814,
            "V13": 0.612, "V14": -0.054, "V15": 0.128, "V16": 0.164, "V17": -0.428, "V18": -0.112,
            "V19": -0.052, "V20": -0.068, "V21": -0.228, "V22": -0.584, "V23": 0.124, "V24": 0.054,
            "V25": 0.184, "V26": 0.110, "V27": -0.012, "V28": 0.018
        }
    }
    res_legit = requests.post(f"{BASE_URL}/predict", json=legit_input, headers=headers).json()
    print(f"Legit Profile  -> Probability: {res_legit['fraud_probability']} ({res_legit['fraud_probability']*100:.2f}%), Class: {res_legit['prediction_class']}")

    # Input 2: Confirmed Fraud Profile
    fraud_input = {
        "time": 406.0,
        "amount": 1250.00,
        "pca_features": {
            "V1": -2.312, "V2": 1.952, "V3": -1.610, "V4": 3.990, "V5": -0.522, "V6": -1.410,
            "V7": -2.510, "V8": 0.857, "V9": -2.314, "V10": -3.854, "V11": 3.104, "V12": -4.812,
            "V13": 0.952, "V14": -5.610, "V15": -0.210, "V16": -2.914, "V17": -5.102, "V18": -1.810,
            "V19": 1.102, "V20": 0.124, "V21": 0.517, "V22": -0.035, "V23": -0.465, "V24": 0.142,
            "V25": 0.312, "V26": 0.518, "V27": 0.612, "V28": 0.184
        }
    }
    res_fraud = requests.post(f"{BASE_URL}/predict", json=fraud_input, headers=headers).json()
    print(f"Fraud Profile  -> Probability: {res_fraud['fraud_probability']} ({res_fraud['fraud_probability']*100:.2f}%), Class: {res_fraud['prediction_class']}")

    # Input 3: Borderline Profile
    borderline_input = {
        "time": 85210.0,
        "amount": 450.00,
        "pca_features": {
            "V1": -0.812, "V2": 0.814, "V3": 0.912, "V4": 1.810, "V5": 0.228, "V6": 0.112,
            "V7": -0.312, "V8": 0.214, "V9": -0.612, "V10": -0.814, "V11": 1.112, "V12": -1.214,
            "V13": 0.312, "V14": -1.812, "V15": 0.612, "V16": -0.612, "V17": -0.914, "V18": -0.212,
            "V19": 0.514, "V20": 0.184, "V21": 0.112, "V22": 0.314, "V23": -0.112, "V24": -0.228,
            "V25": 0.110, "V26": -0.312, "V27": 0.184, "V28": 0.054
        }
    }
    res_borderline = requests.post(f"{BASE_URL}/predict", json=borderline_input, headers=headers).json()
    print(f"Borderline     -> Probability: {res_borderline['fraud_probability']} ({res_borderline['fraud_probability']*100:.2f}%), Class: {res_borderline['prediction_class']}")

    assert res_legit["prediction_class"] == 0, "Legit class failed"
    assert res_fraud["prediction_class"] == 1, "Fraud class failed"
    assert res_legit["fraud_probability"] != res_fraud["fraud_probability"], "Predictions must be dynamic!"
    print("[OK] ML Model generated fresh dynamic probability scores for all test inputs.")

    print("\n==================================================")
    print("STEP 5: DATABASE PERSISTENCE & HISTORY AUDIT")
    print("==================================================")
    history_resp = requests.get(f"{BASE_URL}/history", headers=headers).json()
    print("Total History Records in DB:", len(history_resp))
    assert len(history_resp) >= 3, "Prediction records MUST be stored in DB!"
    latest_record = history_resp[0]
    print("Latest Record ID:", latest_record["id"], "Amount:", latest_record["amount"], "Fraud Prob:", latest_record["fraud_probability"])
    print("[OK] Predictions persisted to PostgreSQL/SQLite database.")

    print("\n==================================================")
    print("STEP 6: DASHBOARD METRICS UPDATE")
    print("==================================================")
    dash_resp = requests.get(f"{BASE_URL}/dashboard", headers=headers).json()
    print("Dashboard Total Processed:", dash_resp["total_processed"])
    print("Dashboard Volume Sum:", dash_resp["processed_volume"])
    print("Dashboard Fraud Alerts:", dash_resp["fraud_alerts"])
    assert dash_resp["total_processed"] >= 3, "Dashboard total processed count updated."
    print("✓ Dashboard metrics and aggregated stats dynamically reflect DB state.")

    print("\n==================================================")
    print("SUCCESS: ALL AUTHENTICATION & E2E VERIFICATION CHECKS PASSED!")
    print("==================================================")

if __name__ == "__main__":
    test_full_auth_and_prediction()
