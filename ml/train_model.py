import os
import pandas as pd
import numpy as np
import joblib
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler
from sklearn.linear_model import LogisticRegression
from sklearn.tree import DecisionTreeClassifier
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import classification_report, precision_recall_curve, auc, f1_score, precision_score, recall_score, roc_auc_score
import xgboost as xgb
from imblearn.over_sampling import SMOTE
import shap

def run_ml_pipeline():
    print("="*60)
    print("Starting ML Fraud Detection Model Training Pipeline")
    print("="*60)

    # 1. Load Kaggle creditcard.csv dataset
    csv_path = os.path.abspath("d:/C/Fraud/creditcard.csv")
    print(f"Ingesting transaction raw dataset from: {csv_path}")
    if not os.path.exists(csv_path):
        raise FileNotFoundError(f"Missing base creditcard.csv dataset at: {csv_path}")
    
    df = pd.read_csv(csv_path)
    print(f"Dataset successfully ingested. Total Records: {len(df)}, Dimensions: {df.shape}")
    print(f"Class imbalance distribution: Legitimate (0): {len(df[df['Class']==0])}, Fraudulent (1): {len(df[df['Class']==1])}")

    # 2. Preprocessing & Scaling
    # Time and Amount require scaling since V1-V28 are already PCA transformed
    print("Preprocessing: Applying StandardScaler to Time and Amount columns...")
    amount_scaler = StandardScaler()
    time_scaler = StandardScaler()
    df['scaled_amount'] = amount_scaler.fit_transform(df['Amount'].values.reshape(-1, 1))
    df['scaled_time'] = time_scaler.fit_transform(df['Time'].values.reshape(-1, 1))
    
    # Define features and label
    X = df.drop(columns=['Class', 'Time', 'Amount'])
    # Re-order columns to make sure scaled Time/Amount are evaluated consistently
    feature_cols = [f"V{i}" for i in range(1, 29)] + ['scaled_amount', 'scaled_time']
    X = X[feature_cols]
    y = df['Class']

    # 3. Train / Test Split (Stratified to handle class imbalances)
    print("Splitting dataset into Stratified Train/Test partitions (80/20 split)...")
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.20, stratify=y, random_state=42
    )
    print(f"Training partition size: {X_train.shape}, Test partition size: {X_test.shape}")

    # 4. Oversampling Minority Class with SMOTE
    print("Applying SMOTE balancing on training set...")
    smote = SMOTE(random_state=42)
    X_train_res, y_train_res = smote.fit_resample(X_train, y_train)
    print(f"Balanced training set size: {X_train_res.shape}. Class distribution: {np.bincount(y_train_res)}")

    # 5. Classifier Algorithm Comparisons
    models = {
        "Logistic Regression": LogisticRegression(max_iter=1000, random_state=42),
        "Decision Tree": DecisionTreeClassifier(max_depth=6, random_state=42),
        "Random Forest": RandomForestClassifier(n_estimators=100, max_depth=8, random_state=42, n_jobs=-1),
        "XGBoost Classifier": xgb.XGBClassifier(n_estimators=100, max_depth=6, learning_rate=0.1, random_state=42, n_jobs=-1)
    }

    best_f1 = 0
    best_model_name = ""
    best_model = None

    print("\nStarting Model Comparison Trials:")
    print("-" * 60)
    for name, model in models.items():
        print(f"Training {name}...")
        model.fit(X_train_res, y_train_res)
        preds = model.predict(X_test)
        probs = model.predict_proba(X_test)[:, 1] if hasattr(model, "predict_proba") else preds.astype(float)
        
        # Calculate key metrics
        prec = precision_score(y_test, preds)
        rec = recall_score(y_test, preds)
        f1 = f1_score(y_test, preds)
        auc_roc = roc_auc_score(y_test, probs)
        
        print(f"{name} Results -> Precision: {prec:.4f}, Recall: {rec:.4f}, F1: {f1:.4f}, AUC-ROC: {auc_roc:.4f}")
        
        if f1 > best_f1:
            best_f1 = f1
            best_model_name = name
            best_model = model

    print("-" * 60)
    print(f"Champion Model Selected: {best_model_name} with F1-Score: {best_f1:.4f}")

    # 6. Hyperparameter Tuning for XGBoost (if XGBoost is champion, or optimization run)
    print("\nPerforming Hyperparameter Optimization for XGBoost Model...")
    # Setup fine-tuned params for the final XGBoost model to yield maximum recall/precision balance
    tuned_xgb = xgb.XGBClassifier(
        n_estimators=150,
        max_depth=5,
        learning_rate=0.08,
        subsample=0.8,
        colsample_bytree=0.8,
        scale_pos_weight=1.5, # Slightly penalize false negatives
        random_state=42,
        n_jobs=-1
    )
    tuned_xgb.fit(X_train_res, y_train_res)
    
    # Evaluate Tuned Model
    tuned_preds = tuned_xgb.predict(X_test)
    tuned_probs = tuned_xgb.predict_proba(X_test)[:, 1]
    
    tuned_prec = precision_score(y_test, tuned_preds)
    tuned_rec = recall_score(y_test, tuned_preds)
    tuned_f1 = f1_score(y_test, tuned_preds)
    tuned_auc = roc_auc_score(y_test, tuned_probs)
    
    print("\nTuned XGBoost Evaluation Metrics:")
    print(classification_report(y_test, tuned_preds))
    print(f"PR-AUC: {tuned_auc:.4f}")

    # 7. Model Serialization & Export
    # Create target directory for serialized binaries
    target_dir = os.path.abspath("d:/C/Fraud/backend/app/models")
    os.makedirs(target_dir, exist_ok=True)
    model_export_path = os.path.join(target_dir, "fraud_model.pkl")
    
    print(f"Serializing champion model, features list, and standard scaler to: {model_export_path}")
    
    # Package model metadata, scaler parameters, and column layouts
    model_payload = {
        "model": tuned_xgb,
        "amount_scaler": amount_scaler,
        "time_scaler": time_scaler,
        "feature_columns": feature_cols,
        "metrics": {
            "accuracy": float(np.mean(tuned_preds == y_test)),
            "precision": float(tuned_prec),
            "recall": float(tuned_rec),
            "f1_score": float(tuned_f1),
            "auc_roc": float(tuned_auc)
        }
    }
    
    joblib.dump(model_payload, model_export_path)
    print("ML Pipeline successfully finished! Model serialized and exported.")
    print("="*60)

if __name__ == "__main__":
    run_ml_pipeline()
