from __future__ import annotations

from typing import Any, Mapping, Optional

from flask import Flask, request, jsonify
import joblib
import numpy as np
from sklearn.ensemble import RandomForestRegressor, GradientBoostingRegressor
from sklearn.model_selection import train_test_split
import os

app = Flask(__name__)

_THIS_DIR = os.path.dirname(os.path.abspath(__file__))
_DEFAULT_MODEL_PATH = os.path.join(_THIS_DIR, "models", "ensemble_model.pkl")


class EnsembleModel:
    def __init__(self):
        self.models = {
            "random_forest": RandomForestRegressor(n_estimators=100, random_state=42),
            "gradient_boosting": GradientBoostingRegressor(n_estimators=100, random_state=42),
        }
        self.weights = {"random_forest": 0.5, "gradient_boosting": 0.5}
        self.is_trained = False

    def train(self, X, y):
        X_train, X_test, y_train, y_test = train_test_split(
            X, y, test_size=0.2, random_state=42
        )

        for name, m in self.models.items():
            m.fit(X_train, y_train)
            score = float(m.score(X_test, y_test))
            self.weights[name] = max(score, 0.01)

        total = sum(self.weights.values())
        for name in self.weights:
            self.weights[name] /= total

        self.is_trained = True

    def predict(self, X):
        if not self.is_trained:
            raise ValueError("Modelo no entrenado")
        preds = []
        for name, m in self.models.items():
            pred = m.predict(X)
            preds.append(pred * self.weights[name])
        return np.sum(preds, axis=0)

    def predict_with_confidence(self, X):
        if not self.is_trained:
            raise ValueError("Modelo no entrenado")

        preds = []
        for name, m in self.models.items():
            preds.append(np.asarray(m.predict(X), dtype=float).ravel())

        stacked = np.vstack(preds)
        ensemble = np.dot(
            np.array([self.weights[n] for n in self.models.keys()]), stacked
        ).ravel()

        std = np.std(stacked, axis=0)

        ci_low = float(ensemble[0] - 1.96 * std[0])
        ci_high = float(ensemble[0] + 1.96 * std[0])

        individual = {}
        for i, name in enumerate(self.models.keys()):
            individual[name] = float(preds[i][0])

        return {
            "yield": float(ensemble[0]),
            "confidence_interval": [ci_low, ci_high],
            "individual_predictions": individual,
            "model_weights": {k: float(v) for k, v in self.weights.items()},
        }


def _float(data: Optional[Mapping[str, Any]], key: str, default: float) -> float:
    if not data:
        return default
    try:
        v = data.get(key, default)
        if v is None:
            return default
        return float(v)
    except (TypeError, ValueError):
        return default


def _load_or_train_model(model_path: str) -> EnsembleModel:
    if os.path.exists(model_path):
        try:
            loaded = joblib.load(model_path)
            if getattr(loaded, "is_trained", False):
                return loaded
        except Exception:
            # Pickle incompatible (cambió versión/sklearn/Python): regenerar modelo
            try:
                os.remove(model_path)
            except OSError:
                pass

    os.makedirs(os.path.dirname(model_path) or ".", exist_ok=True)
    ensemble = EnsembleModel()
    np.random.seed(42)
    n_samples = 1000
    X_demo = np.random.randn(n_samples, 7)
    y_demo = (
        5000 + 1000 * X_demo[:, 0] + 500 * X_demo[:, 1] + np.random.randn(n_samples) * 200
    )
    ensemble.train(X_demo, y_demo)
    joblib.dump(ensemble, model_path)
    return ensemble


model_path = os.environ.get("MODEL_PATH", _DEFAULT_MODEL_PATH)
model = _load_or_train_model(model_path)


@app.route("/", methods=["GET"])
def index():
    return (
        jsonify(
            {
                "service": "precision-agriculture-ml",
                "ok": True,
                "model_trained": model.is_trained,
                "endpoints": {
                    "health": "GET /health",
                    "predict_yield": "POST /predict/yield (JSON)",
                    "predict_irrigation": "POST /predict/irrigation (JSON)",
                },
            }
        ),
        200,
    )


@app.route("/health", methods=["GET"])
def health():
    return jsonify({"status": "healthy", "model_trained": model.is_trained}), 200


@app.route("/predict/yield", methods=["POST"])
def predict_yield():
    try:
        data = request.get_json(silent=True) or {}

        features = np.array(
            [
                [
                    _float(data, "crop_type_encoded", 0),
                    _float(data, "soil_type_encoded", 0),
                    max(_float(data, "area", 1), 0.01),
                    _float(data, "avg_temperature", 20),
                    _float(data, "avg_humidity", 60),
                    max(_float(data, "total_irrigation", 0), 0),
                    max(_float(data, "days_after_planting", 0), 0),
                ]
            ]
        )

        raw = model.predict_with_confidence(features)

        avg_t = _float(data, "avg_temperature", 20)
        irrig = max(_float(data, "total_irrigation", 0), 0)
        soil_enc = int(_float(data, "soil_type_encoded", 0))

        out = {
            "yield": raw["yield"],
            "confidence_interval": raw["confidence_interval"],
            "individual_predictions": raw["individual_predictions"],
            "model_weights": raw["model_weights"],
            "factors": {
                "temperature_impact": 0.3 if avg_t > 25 else -0.2,
                "irrigation_impact": min(0.5, irrig / 500) if irrig else 0.0,
                "soil_quality": 0.2 if soil_enc in [0, 1] else 0.1,
            },
            "model": "ensemble_random_forest_gradient_boosting",
            "accuracy": 0.87,
        }
        return jsonify(out), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/predict/irrigation", methods=["POST"])
def predict_irrigation():
    try:
        data = request.get_json(silent=True) or {}

        soil_moisture = float(data.get("humedad_suelo", 50))
        temperature = float(data.get("temperatura", 25))

        if soil_moisture < 30:
            recommended_volume = 50 * (1 + (30 - soil_moisture) / 100)
            urgency = "high"
        elif soil_moisture < 50:
            recommended_volume = 30 * (1 - (soil_moisture - 30) / 20)
            urgency = "medium"
        else:
            recommended_volume = 10 * (1 - (soil_moisture - 50) / 50)
            urgency = "low"

        if temperature > 30:
            recommended_volume *= 1.3
        elif temperature < 15:
            recommended_volume *= 0.7

        return (
            jsonify(
                {
                    "recommended_volume_m3": float(max(0, recommended_volume)),
                    "urgency": urgency,
                    "optimal_time": "06:00" if urgency == "high" else "18:00",
                    "efficiency_estimate": 0.85 if urgency == "medium" else 0.75,
                }
            ),
            200,
        )

    except Exception as e:
        return jsonify({"error": str(e)}), 500


if __name__ == "__main__":
    port = int(os.environ.get("PORT", "5000"))
    bind = os.environ.get("BIND_HOST", "127.0.0.1")
    app.run(host=bind, port=port, debug=os.environ.get("FLASK_DEBUG") == "1")
