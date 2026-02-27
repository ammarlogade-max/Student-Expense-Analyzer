"""
ExpenseIQ ML Microservice
FastAPI server that loads the sklearn model ONCE at startup
and serves predictions in ~10ms instead of 2-4s per spawn.

Endpoints:
  GET  /health                    — liveness check
  POST /predict/merchant          — category from merchant name
  POST /predict/sms               — parse SMS + predict category
  POST /predict/batch             — categorize many merchants at once
  GET  /model/info                — model metadata
"""

import logging
import os
import pickle
import re
import time
from contextlib import asynccontextmanager
from pathlib import Path
from typing import Optional

import numpy as np
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

# ── Logging ────────────────────────────────────────────────────────────────────
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s  %(levelname)-8s  %(message)s",
    datefmt="%H:%M:%S",
)
log = logging.getLogger("ml_service")

# ── Config ─────────────────────────────────────────────────────────────────────
MODEL_PATH = os.getenv("MODEL_PATH", "../expense_model.pkl")
SERVICE_PORT = int(os.getenv("ML_SERVICE_PORT", "8001"))
ALLOWED_ORIGINS = os.getenv("ML_ALLOWED_ORIGINS", "http://localhost:3000").split(",")

CATEGORIES = [
    "Food", "Shopping", "Travel", "Transport", "Health",
    "Entertainment", "Education", "Housing", "Other",
]

# ── SMS regex patterns (same as your sms_parser.py) ───────────────────────────
_AMOUNT_RE = re.compile(r"(?:rs\.?|inr|₹)\s*(\d+(?:\.\d{1,2})?)", re.IGNORECASE)
_DATE_RE   = re.compile(r"(\d{2}[-/]\d{2}[-/]\d{4})")
_MERCH_RE  = re.compile(
    r"(?:at|to|for|towards)\s+"
    r"((?!rs\.?[\s\d]|inr[\s\d])[A-Za-z0-9][A-Za-z0-9\s\&\.\-]{0,35}?)"
    r"(?=\s*(?:\.|on\s|\d{2}[-/]\d{2}|using|via\s+upi|via\s+[a-z]+|txn|ref|avl|bal|clear|\Z))",
    re.IGNORECASE,
)
_SKIP_WORDS = re.compile(
    r"^(rs|inr|upi|debit|credit|card|bank|acct|acc|a\/c|hdfc|sbi|icici|kotak|axis)$",
    re.IGNORECASE,
)
_ATM_RE = re.compile(
    r"(atm|cash\s*withdraw|atm\s*withdraw|withdrawn\s*from\s*atm)", re.IGNORECASE
)


# ── Global model holder ────────────────────────────────────────────────────────
class ModelStore:
    pipeline = None          # sklearn Pipeline (TF-IDF + LogisticRegression)
    loaded_at: float = 0
    model_path: str = ""
    load_time_ms: float = 0


store = ModelStore()


def load_model() -> None:
    """Load (or reload) the pickle model into memory."""
    paths_to_try = [
        MODEL_PATH,
        Path(__file__).parent / "expense_model.pkl",
        Path(__file__).parent / "artifacts" / "models" / "latest_model.pkl",
    ]
    for p in paths_to_try:
        p = Path(p)
        if p.exists():
            t0 = time.perf_counter()
            with open(p, "rb") as f:
                store.pipeline = pickle.load(f)
            store.load_time_ms = (time.perf_counter() - t0) * 1000
            store.loaded_at = time.time()
            store.model_path = str(p)
            log.info(f"✅ Model loaded from {p}  ({store.load_time_ms:.1f} ms)")
            return
    log.error("❌ No model file found — predictions will use rule-based fallback")


def _normalize(text: str) -> str:
    """Lowercase, strip punctuation — matches train_model.py normalize_text."""
    text = text.lower().strip()
    text = re.sub(r"[^a-z0-9\s]", " ", text)
    return re.sub(r"\s+", " ", text).strip()


def _rule_based_category(merchant: str) -> str:
    """Keyword fallback used when model is not loaded."""
    v = merchant.lower()
    if re.search(r"zomato|swiggy|food|restaurant|cafe|pizza|burger|biryani|kfc|domino|mcdonalds|starbucks|tea|snack", v):
        return "Food"
    if re.search(r"uber|ola|rapido|metro|bus|auto|petrol|fuel|irctc|indigo|spicejet|rapido", v):
        return "Travel"
    if re.search(r"amazon|flipkart|myntra|zara|shopping|store|mall|meesho|ajio", v):
        return "Shopping"
    if re.search(r"doctor|pharmacy|apollo|medplus|hospital|clinic|1mg|netmeds|health", v):
        return "Health"
    if re.search(r"netflix|hotstar|prime|spotify|bookmyshow|pvr|inox|cinema|game", v):
        return "Entertainment"
    if re.search(r"college|school|course|udemy|fees|tuition|book|byju|unacademy", v):
        return "Education"
    if re.search(r"rent|pg|hostel|housing|maintenance", v):
        return "Housing"
    return "Other"


def _predict_single(merchant: str) -> tuple[str, float]:
    """Return (category, confidence). Uses ML model or falls back to rules."""
    if not merchant.strip():
        return "Other", 0.0

    normalized = _normalize(merchant)

    if store.pipeline is not None:
        try:
            proba = store.pipeline.predict_proba([normalized])[0]
            idx   = int(np.argmax(proba))
            cat   = store.pipeline.classes_[idx]
            conf  = float(proba[idx])
            return cat, conf
        except Exception as exc:
            log.warning(f"Model predict failed: {exc} — using rule fallback")

    return _rule_based_category(merchant), 0.0


def _parse_sms(text: str) -> dict:
    """Extract amount, date, merchant from raw SMS text."""
    result = {"amount": None, "date": None, "merchant": None, "is_atm": False}

    if not text:
        return result

    # ATM withdrawal detection (check before merchant parsing)
    if _ATM_RE.search(text):
        result["is_atm"] = True

    m = _AMOUNT_RE.search(text)
    if m:
        result["amount"] = m.group(1)

    m = _DATE_RE.search(text)
    if m:
        result["date"] = m.group(1)

    # Try each keyword match in order; skip generic/currency words
    for m in _MERCH_RE.finditer(text):
        candidate = m.group(1).strip()
        if _SKIP_WORDS.match(candidate):
            continue
        if len(candidate) < 2:
            continue
        if re.match(r"^\d+$", candidate):   # pure number → skip
            continue
        result["merchant"] = re.sub(r"\s+", " ", candidate).strip()
        break

    return result


# ── Lifespan: load model at startup ───────────────────────────────────────────
@asynccontextmanager
async def lifespan(app: FastAPI):
    log.info("🚀 ExpenseIQ ML Service starting...")
    load_model()
    yield
    log.info("💤 ML Service shutting down")


# ── App ────────────────────────────────────────────────────────────────────────
app = FastAPI(
    title="ExpenseIQ ML Service",
    version="1.0.0",
    description="Category prediction microservice for ExpenseIQ",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_methods=["GET", "POST"],
    allow_headers=["*"],
)


# ── Schemas ────────────────────────────────────────────────────────────────────
class MerchantRequest(BaseModel):
    merchant: str

class SmsRequest(BaseModel):
    sms_text: str

class BatchRequest(BaseModel):
    merchants: list[str]

class PredictionResponse(BaseModel):
    merchant: str
    category: str
    confidence: float
    used_model: bool

class SmsResponse(BaseModel):
    amount: Optional[str]
    date: Optional[str]
    merchant: str
    category: str
    confidence: float
    type: str           # "expense" | "cash_withdrawal"
    used_model: bool

class BatchResponse(BaseModel):
    results: list[PredictionResponse]
    count: int
    duration_ms: float


# ── Routes ─────────────────────────────────────────────────────────────────────
@app.get("/health")
def health():
    return {
        "status": "ok",
        "model_loaded": store.pipeline is not None,
        "model_path": store.model_path,
        "uptime_seconds": round(time.time() - store.loaded_at, 1) if store.loaded_at else 0,
    }


@app.post("/predict/merchant", response_model=PredictionResponse)
def predict_merchant(req: MerchantRequest):
    """Predict expense category from a merchant name."""
    if not req.merchant.strip():
        raise HTTPException(status_code=422, detail="merchant must not be empty")

    t0  = time.perf_counter()
    cat, conf = _predict_single(req.merchant)
    ms  = (time.perf_counter() - t0) * 1000

    log.info(f"predict merchant='{req.merchant}' → {cat} ({conf:.2f}) in {ms:.1f}ms")
    return PredictionResponse(
        merchant=req.merchant,
        category=cat,
        confidence=round(conf, 4),
        used_model=store.pipeline is not None,
    )


@app.post("/predict/sms", response_model=SmsResponse)
def predict_sms(req: SmsRequest):
    """Parse SMS text, extract merchant, predict category."""
    if not req.sms_text.strip():
        raise HTTPException(status_code=422, detail="sms_text must not be empty")

    t0     = time.perf_counter()
    parsed = _parse_sms(req.sms_text)
    ms     = (time.perf_counter() - t0) * 1000

    # ATM withdrawal — no category prediction needed
    if parsed["is_atm"]:
        log.info(f"SMS → ATM withdrawal  amount={parsed['amount']} in {ms:.1f}ms")
        return SmsResponse(
            amount=parsed["amount"],
            date=parsed["date"],
            merchant="ATM",
            category="Other",
            confidence=1.0,
            type="cash_withdrawal",
            used_model=False,
        )

    merchant = parsed["merchant"] or ""
    cat, conf = _predict_single(merchant) if merchant else ("Other", 0.0)

    log.info(f"SMS → merchant='{merchant}' cat={cat} ({conf:.2f}) in {ms:.1f}ms")
    return SmsResponse(
        amount=parsed["amount"],
        date=parsed["date"],
        merchant=merchant,
        category=cat if cat != "Uncategorized" else "Other",
        confidence=round(conf, 4),
        type="expense",
        used_model=store.pipeline is not None,
    )


@app.post("/predict/batch", response_model=BatchResponse)
def predict_batch(req: BatchRequest):
    """Categorize multiple merchants in one request."""
    if not req.merchants:
        raise HTTPException(status_code=422, detail="merchants list must not be empty")
    if len(req.merchants) > 500:
        raise HTTPException(status_code=422, detail="Max 500 merchants per batch")

    t0 = time.perf_counter()
    results = []

    # Batch through model for speed (single predict_proba call)
    if store.pipeline is not None:
        try:
            normalized = [_normalize(m) for m in req.merchants]
            probas     = store.pipeline.predict_proba(normalized)
            classes    = store.pipeline.classes_

            for i, merchant in enumerate(req.merchants):
                idx  = int(np.argmax(probas[i]))
                cat  = classes[idx]
                conf = float(probas[i][idx])
                results.append(PredictionResponse(
                    merchant=merchant, category=cat,
                    confidence=round(conf, 4), used_model=True,
                ))
        except Exception as exc:
            log.warning(f"Batch model failed: {exc} — falling back to rules")
            results = [
                PredictionResponse(
                    merchant=m, category=_rule_based_category(m),
                    confidence=0.0, used_model=False,
                )
                for m in req.merchants
            ]
    else:
        results = [
            PredictionResponse(
                merchant=m, category=_rule_based_category(m),
                confidence=0.0, used_model=False,
            )
            for m in req.merchants
        ]

    ms = (time.perf_counter() - t0) * 1000
    log.info(f"Batch {len(req.merchants)} merchants in {ms:.1f}ms")
    return BatchResponse(results=results, count=len(results), duration_ms=round(ms, 2))


@app.get("/model/info")
def model_info():
    """Return model metadata — useful for debugging."""
    if store.pipeline is None:
        return {"loaded": False, "reason": "No model file found at startup"}

    try:
        classes = list(store.pipeline.classes_)
        steps   = [s[0] for s in store.pipeline.steps]
    except Exception:
        classes = []
        steps   = []

    return {
        "loaded": True,
        "path": store.model_path,
        "loaded_at": store.loaded_at,
        "load_time_ms": round(store.load_time_ms, 1),
        "classes": classes,
        "pipeline_steps": steps,
    }


@app.post("/model/reload")
def reload_model():
    """Hot-reload the model without restarting the service."""
    load_model()
    return {
        "reloaded": True,
        "model_loaded": store.pipeline is not None,
        "path": store.model_path,
    }


# ── Dev entry point ────────────────────────────────────────────────────────────
if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=SERVICE_PORT, reload=False)