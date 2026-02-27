#!/bin/bash
# ── ExpenseIQ ML Service — start script ───────────────────────────────────────
# Run this from the ml_service/ folder:
#   chmod +x start.sh
#   ./start.sh

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# ── 1. Create venv if it doesn't exist ────────────────────────────────────────
if [ ! -d ".venv" ]; then
  echo "📦 Creating virtual environment..."
  python3 -m venv .venv
fi

# ── 2. Activate venv ──────────────────────────────────────────────────────────
if [[ "$OSTYPE" == "msys" || "$OSTYPE" == "win32" ]]; then
  source .venv/Scripts/activate
else
  source .venv/bin/activate
fi

# ── 3. Install / upgrade deps ─────────────────────────────────────────────────
echo "📥 Installing dependencies..."
pip install -q -r requirements.txt

# ── 4. Check for model file ───────────────────────────────────────────────────
MODEL_PATH="${MODEL_PATH:-../expense_model.pkl}"
if [ ! -f "$MODEL_PATH" ]; then
  echo ""
  echo "⚠️  Model not found at: $MODEL_PATH"
  echo "   Train it first from your ml/ folder:"
  echo "   cd .. && python train_model.py"
  echo ""
  echo "   The service will start anyway with rule-based fallback."
  echo ""
fi

# ── 5. Start FastAPI ──────────────────────────────────────────────────────────
PORT="${ML_SERVICE_PORT:-8001}"
echo "🚀 Starting ML service on port $PORT ..."
echo "   Docs:   http://localhost:$PORT/docs"
echo "   Health: http://localhost:$PORT/health"
echo ""

uvicorn main:app --host 0.0.0.0 --port "$PORT" --workers 1
