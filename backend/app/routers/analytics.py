from datetime import timezone

from fastapi import APIRouter, Depends
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.core.security import get_current_user
from app.database.session import get_db
from app.models.user import User
from app.models.prediction import PredictionHistory
from app.schemas.prediction import (
    AnalyticsSummary,
    AnalyticsTrends,
    DailyPerformancePoint,
    AmountBucket,
    FeatureCorrelation,
)

router = APIRouter(tags=["Analytics & Dashboard"])


def _user_query(db: Session, current_user: User):
    return db.query(PredictionHistory).filter(PredictionHistory.user_id == current_user.id)


@router.get("/dashboard", response_model=AnalyticsSummary)
def get_dashboard_metrics(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    base = _user_query(db, current_user)
    total_processed = base.count()
    volume_sum = (
        db.query(func.coalesce(func.sum(PredictionHistory.transaction_amount), 0.0))
        .filter(PredictionHistory.user_id == current_user.id)
        .scalar()
    )
    fraud_alerts = base.filter(PredictionHistory.prediction_class == 1).count()
    legitimate_count = total_processed - fraud_alerts
    false_positives = base.filter(
        PredictionHistory.prediction_class == 1,
        PredictionHistory.user_override == 0,
    ).count()
    override_count = base.filter(PredictionHistory.user_override.isnot(None)).count()
    avg_score = (
        db.query(func.avg(PredictionHistory.fraud_probability))
        .filter(PredictionHistory.user_id == current_user.id)
        .scalar()
    )

    return AnalyticsSummary(
        total_processed=total_processed,
        processed_volume=round(float(volume_sum or 0.0), 2),
        fraud_alerts=fraud_alerts,
        legitimate_count=legitimate_count,
        false_positives=false_positives,
        avg_risk_score=round(float(avg_score or 0.0), 4),
        override_count=override_count,
        latency_ms=None,
    )


@router.get("/analytics", response_model=AnalyticsTrends)
def get_analytics_trends(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    records = (
        db.query(PredictionHistory)
        .filter(PredictionHistory.user_id == current_user.id)
        .order_by(PredictionHistory.predicted_at.asc())
        .all()
    )

    daily_map = {}
    amount_buckets = {
        "$0-10": {"legitimate": 0, "fraud": 0},
        "$10-50": {"legitimate": 0, "fraud": 0},
        "$50-200": {"legitimate": 0, "fraud": 0},
        "$200-1000": {"legitimate": 0, "fraud": 0},
        "$1000+": {"legitimate": 0, "fraud": 0},
    }
    shap_sums = {}
    shap_counts = {}

    for record in records:
        ts = record.predicted_at
        if ts is not None and ts.tzinfo is None:
            ts = ts.replace(tzinfo=timezone.utc)
        date_label = ts.strftime("%b %d") if ts else "Unknown"
        bucket = daily_map.setdefault(date_label, {"transactions": 0, "fraudAlerts": 0})
        bucket["transactions"] += 1
        if record.prediction_class == 1:
            bucket["fraudAlerts"] += 1

        amount = record.transaction_amount or 0.0
        if amount < 10:
            key = "$0-10"
        elif amount < 50:
            key = "$10-50"
        elif amount < 200:
            key = "$50-200"
        elif amount < 1000:
            key = "$200-1000"
        else:
            key = "$1000+"
        class_key = "fraud" if record.prediction_class == 1 else "legitimate"
        amount_buckets[key][class_key] += 1

        if record.shap_values:
            for feat, val in record.shap_values.items():
                try:
                    shap_sums[feat] = shap_sums.get(feat, 0.0) + float(val)
                    shap_counts[feat] = shap_counts.get(feat, 0) + 1
                except (TypeError, ValueError):
                    continue

    daily_performance = [
        DailyPerformancePoint(
            date=date,
            transactions=vals["transactions"],
            fraudAlerts=vals["fraudAlerts"],
            rate=round((vals["fraudAlerts"] / vals["transactions"]) * 100, 2) if vals["transactions"] else 0,
        )
        for date, vals in daily_map.items()
    ]

    amount_distribution = [
        AmountBucket(range=label, legitimate=vals["legitimate"], fraud=vals["fraud"])
        for label, vals in amount_buckets.items()
    ]

    correlations = []
    for feat, total in shap_sums.items():
        avg = total / max(shap_counts.get(feat, 1), 1)
        direction = "increased" if avg > 0 else "decreased"
        correlations.append(
            FeatureCorrelation(
                feature=feat,
                impact=round(avg, 4),
                description=f"Average SHAP attribution {direction} predicted fraud probability",
            )
        )
    correlations.sort(key=lambda item: abs(item.impact), reverse=True)

    return AnalyticsTrends(
        dailyPerformance=daily_performance,
        amountDistribution=amount_distribution,
        topCorrelations=correlations[:8],
    )
