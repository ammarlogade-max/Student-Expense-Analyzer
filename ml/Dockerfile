# ── ExpenseIQ ML Service — Dockerfile ────────────────────────────────────────
FROM python:3.11-slim

WORKDIR /app

# Install deps
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy service code
COPY main.py utils.py ./

# Copy model file (must exist at build time — see README for how to add it)
# If the model file doesn't exist, the service falls back to rule-based logic
COPY expense_model.pkl* ./

# Non-root user
RUN useradd -m appuser
USER appuser

EXPOSE 8001

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8001", "--workers", "1"]
