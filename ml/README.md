# ML Module (Production-Ready Baseline)

This folder contains a reproducible, baseline ML pipeline for classifying expenses from merchant names parsed from SMS transactions.

## Quick Start

1. Create a virtual environment and install deps:
   ```bash
   python -m venv .venv
   .venv\Scripts\activate
   pip install -r requirements.txt
   ```
2. (Optional) Regenerate synthetic data:
   ```bash
   python generate_data.py
   ```
3. Build training dataset and train model:
   ```bash
   python train_model.py
   ```
4. Test predictions:
   ```bash
   python predictor.py
   ```

## Artifacts
- Models: `artifacts/models/`
- Metrics: `artifacts/metrics/`

## Notes
- This is a **baseline** pipeline meant for production readiness, not a final model.
- Replace synthetic data with real, anonymized SMS data for real-world accuracy.
