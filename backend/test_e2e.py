import requests
import json

BASE_URL = "http://127.0.0.1:8000/api/v1"

def test_e2e():
    print("--- 1. TESTING AUTH LOGIN ---")
    login_resp = requests.post(f"{BASE_URL}/auth/login", json={"email": "admin@fraudguard.ai", "password": "password123"})
    print("Login status:", login_resp.status_code)
    assert login_resp.status_code == 200, f"Login failed: {login_resp.text}"
    token_data = login_resp.json()
    token = token_data["access_token"]
    headers = {"Authorization": f"Bearer {token}"}
    print("Token obtained successfully.")

    print("\n--- 2. TESTING SINGLE PREDICTIONS ---")
    # Legitimate transaction input
    legit_payload = {
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
    p_legit = requests.post(f"{BASE_URL}/predict", json=legit_payload, headers=headers).json()
    print("Legit Prediction:", p_legit["fraud_probability"], "Class:", p_legit["prediction_class"])

    # High Risk Fraud transaction input
    fraud_payload = {
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
    p_fraud = requests.post(f"{BASE_URL}/predict", json=fraud_payload, headers=headers).json()
    print("Fraud Prediction:", p_fraud["fraud_probability"], "Class:", p_fraud["prediction_class"])

    assert p_legit["prediction_class"] == 0, "Legit should be class 0"
    assert p_fraud["prediction_class"] == 1, "Fraud should be class 1"
    assert p_legit["fraud_probability"] != p_fraud["fraud_probability"], "Predictions must be dynamic!"

    print("\n--- 3. TESTING DASHBOARD METRICS ---")
    dash_res = requests.get(f"{BASE_URL}/dashboard", headers=headers).json()
    print("Dashboard total processed:", dash_res["total_processed"])
    print("Dashboard volume sum:", dash_res["processed_volume"])
    print("Dashboard fraud alerts count:", dash_res["fraud_alerts"])
    assert dash_res["total_processed"] >= 2, "Dashboard should reflect saved predictions!"

    print("\n--- 4. TESTING HISTORY ENDPOINT ---")
    hist_res = requests.get(f"{BASE_URL}/history", headers=headers).json()
    print("History records returned:", len(hist_res))
    assert len(hist_res) >= 2, "History must return stored DB records!"

    print("\n--- 5. TESTING ANALYST OVERRIDE ---")
    pred_id = hist_res[0]["id"]
    override_res = requests.patch(f"{BASE_URL}/history/{pred_id}/override", json={"user_override": 0}, headers=headers).json()
    print("Override status:", override_res["user_override"])
    assert override_res["user_override"] == 0, "Override failed!"

    print("\n--- 6. TESTING BULK CSV UPLOAD ---")
    csv_content = "Time,V1,V2,V3,V4,V5,V6,V7,V8,V9,V10,V11,V12,V13,V14,V15,V16,V17,V18,V19,V20,V21,V22,V23,V24,V25,V26,V27,V28,Amount\n0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,10.0\n406,-2.3,1.9,-1.6,3.9,-0.5,-1.4,-2.5,0.85,-2.3,-3.8,3.1,-4.8,0.95,-5.6,-0.2,-2.9,-5.1,-1.8,1.1,0.12,0.51,-0.03,-0.46,0.14,0.31,0.51,0.61,0.18,1250.0\n"
    files = {"file": ("test_batch.csv", csv_content.encode("utf-8"), "text/csv")}
    bulk_res = requests.post(f"{BASE_URL}/predict/csv", files=files, headers=headers).json()
    print("Bulk upload status:", bulk_res["status"], "Total rows:", bulk_res["total_rows"])
    assert bulk_res["total_rows"] == 2, "Bulk upload failed!"

    print("\n=== ALL E2E BACKEND TESTS PASSED SUCCESSFULLY! ===")

if __name__ == "__main__":
    test_e2e()
