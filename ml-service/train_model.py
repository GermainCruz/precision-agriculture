"""
Entrena un ensemble (Random Forest + Gradient Boosting) con datos sintéticos
de agricultura de precisión: humedad, temperatura, nitrógeno, fósforo, potasio.

El artefacto se guarda en models/ensemble_model.joblib (rutas relativas al
directorio que contiene este script).
"""

from __future__ import annotations

from pathlib import Path

import joblib
import numpy as np

from ensemble_model import EnsembleModel

# Rutas relativas al directorio de este archivo (independiente del CWD)
_SCRIPT_DIR = Path(__file__).resolve().parent
_MODELS_DIR = _SCRIPT_DIR / "models"
_OUTPUT_PATH = _MODELS_DIR / "ensemble_model.joblib"


def _build_synthetic_dataset(
    n_samples: int = 5000,
    random_state: int = 42,
) -> tuple[np.ndarray, np.ndarray]:
    """
    Genera X: [humedad %, temperatura °C, N, P, K] y un objetivo tipo rendimiento (kg/ha).
    """
    rng = np.random.default_rng(random_state)
    humedad = rng.uniform(25.0, 95.0, n_samples)
    temperatura = rng.uniform(12.0, 38.0, n_samples)
    nitrogeno = rng.uniform(10.0, 120.0, n_samples)
    fosforo = rng.uniform(5.0, 80.0, n_samples)
    potasio = rng.uniform(20.0, 200.0, n_samples)

    X = np.column_stack([humedad, temperatura, nitrogeno, fosforo, potasio])

    # Relación sintética plausible: más humedad moderada y NPK favorecen el rendimiento;
    # temperaturas extremas lo penalizan.
    y = (
        2500.0
        + 18.0 * (humedad - 55.0)
        - 45.0 * np.abs(temperatura - 24.0)
        + 11.0 * nitrogeno
        + 16.0 * fosforo
        + 5.5 * potasio
        + rng.normal(0.0, 450.0, n_samples)
    )
    y = np.clip(y, 400.0, 14000.0)
    return X, y


def main() -> None:
    _MODELS_DIR.mkdir(parents=True, exist_ok=True)

    X, y = _build_synthetic_dataset()
    model = EnsembleModel()
    model.train(X, y)

    joblib.dump(model, _OUTPUT_PATH)
    print(f"Modelo guardado en: {_OUTPUT_PATH}")


if __name__ == "__main__":
    main()
