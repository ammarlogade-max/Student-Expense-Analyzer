import pickle
from datetime import datetime
from pathlib import Path

import pandas as pd
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import accuracy_score, classification_report, confusion_matrix
from sklearn.model_selection import train_test_split
from sklearn.pipeline import Pipeline

from data_pipeline import build_training_dataset
from utils import ensure_dir, load_config, save_json


def filter_rare_classes(df: pd.DataFrame, min_rows: int) -> pd.DataFrame:
    counts = df["category"].value_counts()
    keep = counts[counts >= min_rows].index
    return df[df["category"].isin(keep)].reset_index(drop=True)


def train() -> None:
    config = load_config()
    data_path = config["data_path"]
    random_state = config["random_state"]
    test_size = config["test_size"]
    val_size = config["val_size"]
    min_rows = config["min_rows_per_class"]

    data, y = build_training_dataset(data_path)
    data = filter_rare_classes(data, min_rows)
    X = data["merchant"]
    y = data["category"]

    X_temp, X_test, y_temp, y_test = train_test_split(
        X,
        y,
        test_size=test_size,
        random_state=random_state,
        stratify=y
    )

    val_relative_size = val_size / (1 - test_size)
    X_train, X_val, y_train, y_val = train_test_split(
        X_temp,
        y_temp,
        test_size=val_relative_size,
        random_state=random_state,
        stratify=y_temp
    )

    model = Pipeline(
        steps=[
            ("vectorizer", TfidfVectorizer(ngram_range=(1, 2))),
            (
                "classifier",
                LogisticRegression(
                    max_iter=2000,
                    class_weight="balanced"
                )
            )
        ]
    )

    model.fit(X_train, y_train)

    val_preds = model.predict(X_val)
    test_preds = model.predict(X_test)

    metrics = {
        "train_size": len(X_train),
        "val_size": len(X_val),
        "test_size": len(X_test),
        "val_accuracy": accuracy_score(y_val, val_preds),
        "test_accuracy": accuracy_score(y_test, test_preds),
        "classification_report": classification_report(
            y_test,
            test_preds,
            output_dict=True
        ),
        "confusion_matrix": confusion_matrix(y_test, test_preds).tolist()
    }

    timestamp = datetime.utcnow().strftime("%Y%m%d_%H%M%S")
    model_dir = ensure_dir(config["model_dir"])
    metrics_dir = ensure_dir(config["metrics_dir"])

    model_path = model_dir / f"expense_model_{timestamp}.pkl"
    with open(model_path, "wb") as f:
        pickle.dump(model, f)

    latest_path = model_dir / "latest_model.pkl"
    with open(latest_path, "wb") as f:
        pickle.dump(model, f)

    with open("expense_model.pkl", "wb") as f:
        pickle.dump(model, f)

    metrics_path = Path(metrics_dir) / f"metrics_{timestamp}.json"
    save_json(metrics, str(metrics_path))

    print(f"Model saved: {model_path}")
    print(f"Latest model: {latest_path}")
    print("Compatibility model: expense_model.pkl")
    print(f"Metrics saved: {metrics_path}")


if __name__ == "__main__":
    train()
