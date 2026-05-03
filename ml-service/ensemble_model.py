"""Modelo ensemble (Random Forest + Gradient Boosting) compartido entre app y entrenamiento."""

from __future__ import annotations

import numpy as np
from sklearn.ensemble import GradientBoostingRegressor, RandomForestRegressor
from sklearn.model_selection import train_test_split


class EnsembleModel:
    def __init__(self) -> None:
        self.models = {
            "random_forest": RandomForestRegressor(n_estimators=100, random_state=42),
            "gradient_boosting": GradientBoostingRegressor(n_estimators=100, random_state=42),
        }
        self.weights = {"random_forest": 0.5, "gradient_boosting": 0.5}
        self.is_trained = False

    def train(self, X, y) -> None:
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

        individual: dict[str, float] = {}
        for i, name in enumerate(self.models.keys()):
            individual[name] = float(preds[i][0])

        return {
            "yield": float(ensemble[0]),
            "confidence_interval": [ci_low, ci_high],
            "individual_predictions": individual,
            "model_weights": {k: float(v) for k, v in self.weights.items()},
        }
