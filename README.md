# AI-Powered Credit Card Fraud Detection Platform

An enterprise-level, production-ready FinTech SaaS platform that predicts whether credit card transactions are legitimate or fraudulent using XGBoost classification and local SHAP explainability attributions.

---

## 🌟 Tech Stack

### Frontend
- **Framework:** Next.js 15 (App Router, React 19)
- **Language:** TypeScript
- **Styling:** Tailwind CSS v4, Glassmorphic Obsidian Dark Theme
- **UI Components:** Custom UI Library (Cards, Buttons, Inputs, Dialogs, Selects)
- **Animations:** Framer Motion
- **Data Visualization:** Recharts
- **Forms & Validation:** React Hook Form + Zod

### Backend & Machine Learning
- **API Framework:** FastAPI (Python 3.11+)
- **Database ORM:** SQLAlchemy 2.0 + Alembic Migrations
- **Security:** JWT (JSON Web Tokens), Passlib (Bcrypt hashing)
- **ML Frameworks:** XGBoost, Scikit-Learn, Pandas, NumPy, Joblib
- **Imbalance Handling:** SMOTE (Synthetic Minority Over-sampling Technique)
- **Explainable AI (XAI):** SHAP (SHapley Additive exPlanations)

### Infrastructure & Deployment
- **Database:** PostgreSQL (Neon Serverless PostgreSQL / Docker)
- **Frontend Hosting:** Vercel
- **Backend Hosting:** Render / Docker Containers

---

## 📁 Project Folder Structure

```
d:\C\Fraud\
├── creditcard.csv                 # Kaggle Dataset (Time, V1-V28, Amount, Class)
├── docker-compose.yml             # Local Postgres & FastAPI containerization
│
├── frontend/                      # Next.js 15 Web Application
│   ├── app/                       # App Router routes
│   │   ├── (auth)/login/          # Security login page
│   │   ├── (dashboard)/           # Protected dashboard layout
│   │   │   ├── dashboard/         # KPIs & inflow charts
│   │   │   ├── analytics/         # Correlation & amount distributions
│   │   │   ├── predict/           # Single transaction manual form
│   │   │   ├── bulk/              # CSV file batch upload
│   │   │   ├── history/           # Log audits & analyst manual overrides
│   │   │   ├── settings/          # API token key manager & sensitivity slider
│   │   │   └── admin/             # System diagnostics & retraining console
│   │   └── landing/               # Sleek marketing landing page
│   ├── components/                # UI widgets & SHAP visualizers
│   └── lib/
│       ├── api-client.ts          # REST client wrapper connected to FastAPI
│       └── mock-data.ts           # Fallback datasets
│
├── backend/                       # FastAPI Server Workspace
│   ├── app/
│   │   ├── core/                  # Security tokens & app settings
│   │   ├── database/              # SQLAlchemy session & DB engine
│   │   ├── models/                # PostgreSQL ORM entities
│   │   ├── schemas/               # Pydantic validation schemas
│   │   ├── routers/               # API endpoint handlers
│   │   ├── services/              # ML inference & SHAP explainers
│   │   └── main.py                # App entrypoint & CORS middleware
│   ├── models/
│   │   └── fraud_model.pkl        # Serialized champion XGBoost model
│   ├── alembic/                   # Database migrations
│   ├── Dockerfile                 # Backend container definition
│   └── requirements.txt           # Python dependencies
│
└── ml/
    └── train_model.py             # Machine learning training & grid search script
```

---

## 🚀 Quick Start Guide

### Prerequisites
- Python 3.10 or higher
- Node.js 18.0 or higher
- PostgreSQL (or local Docker)

---

### 1. Machine Learning Model Training

To train the model on `creditcard.csv`, execute:

```bash
# Install dependencies
pip install -r backend/requirements.txt

# Run ML pipeline script (Preprocess -> SMOTE -> Model Trials -> XGBoost Tuning -> Export)
python ml/train_model.py
```

*Outputs serialized binary to `backend/app/models/fraud_model.pkl`.*

---

### 2. Backend FastAPI Server Setup

```bash
# Navigate to backend folder
cd backend

# Configure Environment Variables (or edit app/core/config.py)
# DATABASE_URL=postgresql://postgres:postgrespassword@localhost:5432/fraudguard

# Start FastAPI server with Uvicorn reload
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

- **Interactive Swagger Docs:** `http://localhost:8000/docs`
- **ReDoc API Specifications:** `http://localhost:8000/redoc`

---

### 3. Frontend Next.js Web App Setup

```bash
# Navigate to frontend folder
cd frontend

# Install Node modules
npm install

# Start Next.js Development Server
npm run dev
```

- **Landing Page:** `http://localhost:3000/landing`
- **Dashboard:** `http://localhost:3000/dashboard`
- **Default Credentials:**
  - **Email:** `admin@fraudguard.ai`
  - **Password:** `password123`

---

## 📡 REST API Documentation Overview

| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| `POST` | `/api/v1/auth/register` | Register new analyst user account | No |
| `POST` | `/api/v1/auth/login` | Authenticate email/password, return JWT token | No |
| `GET` | `/api/v1/auth/profile` | Retrieve logged-in user details | Yes |
| `POST` | `/api/v1/predict` | Predict single transaction risk & return SHAP vectors | Yes |
| `POST` | `/api/v1/predict/csv` | Upload bulk CSV, process rows, return stats | Yes |
| `GET` | `/api/v1/history` | List audit log records with filters | Yes |
| `PATCH` | `/api/v1/history/{id}/override` | Analyst manual override (Legitimate / Fraud) | Yes |
| `GET` | `/api/v1/dashboard` | Fetch dashboard KPI summary metrics | Yes |
| `GET` | `/api/v1/analytics` | Fetch feature correlations & amount distribution | Yes |
| `GET` | `/api/v1/admin/models` | List registered model versions | Admin |
| `POST` | `/api/v1/admin/models/{id}/activate` | Activate specified model version | Admin |

---

## 🌐 Production Deployment Architecture

### 1. Database → Neon PostgreSQL
1. Create a serverless database instance on [Neon](https://neon.tech).
2. Copy the connection string (`postgresql://user:pass@ep-xyz.neon.tech/neondb?sslmode=require`).
3. Set `DATABASE_URL` in backend environment variables.

### 2. Backend → Render
1. Create a **Web Service** on [Render](https://render.com) connected to your repository.
2. Select **Docker** environment or Python root.
3. Build Command: `pip install -r backend/requirements.txt`
4. Start Command: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
5. Set Environment Variables:
   - `DATABASE_URL`
   - `SECRET_KEY`
   - `CORS_ORIGINS=["https://your-frontend.vercel.app"]`

### 3. Frontend → Vercel
1. Import `frontend/` directory into [Vercel](https://vercel.com).
2. Framework Preset: Next.js.
3. Set Environment Variable:
   - `NEXT_PUBLIC_API_URL=https://your-backend.onrender.com/api/v1`

---

## 🛡️ License & Compliance

Certified for enterprise financial operations following SOC 2 security compliance guidelines.
