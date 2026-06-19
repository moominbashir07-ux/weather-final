"""
AQI Predictor - ML Training Script
Trains and compares Linear Regression, Random Forest, and Decision Tree models.
Automatically selects the best model based on R² score.
"""

import os
import pickle
import logging
import numpy as np
import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler
from sklearn.linear_model import LinearRegression
from sklearn.ensemble import RandomForestRegressor
from sklearn.tree import DecisionTreeRegressor
from sklearn.metrics import r2_score, mean_absolute_error, mean_squared_error

logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s")
logger = logging.getLogger(__name__)

FEATURES = ["temperature", "humidity", "wind_speed", "co2", "pm25", "pm10", "no2", "so2"]
TARGET = "aqi"
MODEL_PATH = os.path.join(os.path.dirname(__file__), "best_model.pkl")
SCALER_PATH = os.path.join(os.path.dirname(__file__), "scaler.pkl")
METRICS_PATH = os.path.join(os.path.dirname(__file__), "metrics.pkl")


def generate_synthetic_dataset(n_samples: int = 2000) -> pd.DataFrame:
    """Generate realistic synthetic AQI dataset for training."""
    np.random.seed(42)
    df = pd.DataFrame({
        "temperature": np.random.uniform(5, 45, n_samples),
        "humidity": np.random.uniform(20, 95, n_samples),
        "wind_speed": np.random.uniform(0, 30, n_samples),
        "co2": np.random.uniform(300, 1200, n_samples),
        "pm25": np.random.uniform(0, 500, n_samples),
        "pm10": np.random.uniform(0, 600, n_samples),
        "no2": np.random.uniform(0, 200, n_samples),
        "so2": np.random.uniform(0, 150, n_samples),
    })
    # AQI is influenced primarily by PM2.5 and PM10 with some noise
    df["aqi"] = (
        0.40 * df["pm25"] +
        0.25 * df["pm10"] +
        0.10 * df["no2"] +
        0.08 * df["so2"] +
        0.05 * df["co2"] / 10 +
        0.03 * df["temperature"] +
        0.02 * df["humidity"] -
        0.03 * df["wind_speed"] * 5 +
        np.random.normal(0, 8, n_samples)
    ).clip(0, 500)
    return df


def load_dataset(path: str | None = None) -> pd.DataFrame:
    """Load dataset from CSV or generate synthetic data."""
    if path and os.path.exists(path):
        logger.info(f"Loading dataset from {path}")
        df = pd.read_csv(path)
        # Standardize column names
        df.columns = df.columns.str.lower().str.replace(" ", "_").str.replace(".", "", regex=False)
        return df
    logger.info("No dataset found. Generating synthetic training data...")
    return generate_synthetic_dataset()


def clean_dataset(df: pd.DataFrame) -> pd.DataFrame:
    """Clean dataset: handle missing values, remove duplicates, clip outliers."""
    original_size = len(df)
    df = df.drop_duplicates()
    
    # Fill missing values with median
    for col in FEATURES + [TARGET]:
        if col in df.columns:
            df[col] = df[col].fillna(df[col].median())
    
    # Clip outliers at 1st and 99th percentiles
    for col in FEATURES:
        if col in df.columns:
            lower = df[col].quantile(0.01)
            upper = df[col].quantile(0.99)
            df[col] = df[col].clip(lower, upper)
    
    logger.info(f"Dataset cleaned: {original_size} → {len(df)} rows")
    return df


def evaluate_model(model, X_test, y_test, name: str) -> dict:
    """Evaluate a model and return metrics."""
    preds = model.predict(X_test)
    r2 = r2_score(y_test, preds)
    mae = mean_absolute_error(y_test, preds)
    rmse = np.sqrt(mean_squared_error(y_test, preds))
    logger.info(f"{name}: R²={r2:.4f}, MAE={mae:.2f}, RMSE={rmse:.2f}")
    return {"name": name, "r2": r2, "mae": mae, "rmse": rmse, "predictions": preds.tolist()}


def get_feature_importance(model, feature_names: list) -> dict:
    """Extract feature importances if available."""
    if hasattr(model, "feature_importances_"):
        return dict(zip(feature_names, model.feature_importances_.tolist()))
    elif hasattr(model, "coef_"):
        coefs = np.abs(model.coef_)
        return dict(zip(feature_names, (coefs / coefs.sum()).tolist()))
    return {}


def train(dataset_path: str | None = None) -> dict:
    """Full training pipeline. Returns metrics for all models."""
    # Load and clean
    df = load_dataset(dataset_path)
    df = clean_dataset(df)

    # Validate features
    missing = [f for f in FEATURES if f not in df.columns]
    if missing:
        raise ValueError(f"Missing features in dataset: {missing}")
    if TARGET not in df.columns:
        raise ValueError(f"Target column '{TARGET}' not found in dataset.")

    X = df[FEATURES].values
    y = df[TARGET].values

    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

    # Scale features
    scaler = StandardScaler()
    X_train_scaled = scaler.fit_transform(X_train)
    X_test_scaled = scaler.transform(X_test)

    # Define models
    models = {
        "Linear Regression": LinearRegression(),
        "Random Forest": RandomForestRegressor(n_estimators=100, random_state=42, n_jobs=-1),
        "Decision Tree": DecisionTreeRegressor(max_depth=10, random_state=42),
    }

    results = []
    trained_models = {}

    for name, model in models.items():
        logger.info(f"Training {name}...")
        model.fit(X_train_scaled, y_train)
        metrics = evaluate_model(model, X_test_scaled, y_test, name)
        metrics["feature_importance"] = get_feature_importance(model, FEATURES)
        results.append(metrics)
        trained_models[name] = model

    # Select best by R²
    best = max(results, key=lambda x: x["r2"])
    best_model = trained_models[best["name"]]
    logger.info(f"Best model: {best['name']} (R²={best['r2']:.4f})")

    # Save artifacts
    with open(MODEL_PATH, "wb") as f:
        pickle.dump({"model": best_model, "name": best["name"]}, f)
    with open(SCALER_PATH, "wb") as f:
        pickle.dump(scaler, f)
    with open(METRICS_PATH, "wb") as f:
        pickle.dump({
            "all_models": results,
            "best_model": best["name"],
            "feature_importance": best["feature_importance"],
            "y_test": y_test.tolist(),
            "best_predictions": best["predictions"],
            "feature_names": FEATURES,
        }, f)

    logger.info("Model artifacts saved.")
    return {
        "status": "success",
        "best_model": best["name"],
        "metrics": {m["name"]: {"r2": m["r2"], "mae": m["mae"], "rmse": m["rmse"]} for m in results},
        "feature_importance": best["feature_importance"],
    }


if __name__ == "__main__":
    result = train()
    print("\n=== Training Complete ===")
    print(f"Best Model: {result['best_model']}")
    for name, m in result["metrics"].items():
        print(f"  {name}: R²={m['r2']:.4f}, MAE={m['mae']:.2f}, RMSE={m['rmse']:.2f}")
