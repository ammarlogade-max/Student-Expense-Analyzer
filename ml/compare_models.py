import random
import time

import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestClassifier
from sklearn.feature_extraction.text import CountVectorizer, TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import accuracy_score, classification_report
from sklearn.model_selection import train_test_split
from sklearn.pipeline import Pipeline

print("\nSIDE-BY-SIDE MODEL COMPARISON (parsed_transactions.csv, merchant)\n")

# -----------------------------
# 1) LOAD DATA
# -----------------------------
df = pd.read_csv("parsed_transactions.csv")
df = df.dropna(subset=["merchant", "true_category"]).copy()

X = df["merchant"].astype(str)
y = df["true_category"].astype(str)
print(f"Total samples: {len(X)}")
print(f"Unique merchants: {X.nunique()}")

# -----------------------------
# 2) DEFINE MODELS
# -----------------------------
models = {
    "Logistic Regression (TF-IDF Char+Word)": Pipeline(
        [
            (
                "vectorizer",
                TfidfVectorizer(
                    max_features=12000,
                    ngram_range=(2, 4),
                    analyzer="char_wb",
                    sublinear_tf=True
                ),
            ),
            ("classifier", LogisticRegression(max_iter=3000, C=2.0)),
        ]
    ),
    "Random Forest (CountVectorizer)": Pipeline(
        [
            (
                "vectorizer",
                CountVectorizer(ngram_range=(1, 1), max_features=1200),
            ),
            (
                "classifier",
                RandomForestClassifier(
                    n_estimators=120,
                    max_depth=12,
                    min_samples_leaf=3,
                    min_samples_split=6,
                    max_features="sqrt",
                    random_state=42,
                    n_jobs=-1,
                ),
            ),
        ]
    ),
}

results = {}

# -----------------------------
# 3) TRAIN & EVALUATE
# -----------------------------
X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=42, stratify=y
)
print(f"Train size: {len(X_train)} | Test size: {len(X_test)}")

for name, model in models.items():
    print(f"\nTraining: {name}")

    start = time.time()
    model.fit(X_train, y_train)
    train_time = time.time() - start

    start = time.time()
    predictions = model.predict(X_test)
    inference_time = time.time() - start

    accuracy = accuracy_score(y_test, predictions)

    results[name] = {
        "accuracy": float(accuracy),
        "train_time": float(train_time),
        "inference_time": float(inference_time),
    }

    print(f"Accuracy: {accuracy * 100:.2f}%")
    print(f"Training Time: {train_time:.2f}s")
    print(f"Inference Time: {inference_time:.4f}s")

    print("\nClassification Report:")
    print(classification_report(y_test, predictions))

# -----------------------------
# 4) FINAL COMPARISON SUMMARY
# -----------------------------
print("\n==============================")
print("FINAL COMPARISON SUMMARY")
print("==============================")

for name, metrics in results.items():
    print(f"\n{name}")
    print(f"Accuracy        : {metrics['accuracy'] * 100:.2f}%")
    print(f"Training Time   : {metrics['train_time']:.2f}s")
    print(f"Inference Time  : {metrics['inference_time']:.4f}s")

print("\nCOMPARISON COMPLETE\n")
