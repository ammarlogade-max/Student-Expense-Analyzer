import os
import pickle
from typing import Optional

from utils import load_config, normalize_text


def load_model(path: Optional[str] = None):
    config = load_config()
    default_path = os.path.join(config["model_dir"], "latest_model.pkl")
    model_path = path or default_path

    if not os.path.exists(model_path):
        fallback = "expense_model.pkl"
        if os.path.exists(fallback):
            model_path = fallback
        else:
            raise FileNotFoundError(
                "No model found. Train a model first."
            )

    with open(model_path, "rb") as f:
        return pickle.load(f)


def predict_category(merchant_name: str, model=None) -> str:
    if not merchant_name:
        return "Uncategorized"
    if model is None:
        model = load_model()
    normalized = normalize_text(merchant_name)
    prediction = model.predict([normalized])
    return prediction[0]


if __name__ == "__main__":
    model = load_model()
    test_cases = [
        "Swiggy",
        "Shell Petrol Pump",
        "Zara Clothing",
        "Netflix Subscription",
        "Dr. Lal Pathlabs"
    ]

    for merchant in test_cases:
        category = predict_category(merchant, model)
        print(f"Merchant: {merchant:20} -> Category: {category}")
