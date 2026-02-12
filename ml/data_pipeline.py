from typing import Tuple

import pandas as pd

from sms_parser import parse_sms
from utils import normalize_text


def build_training_dataset(path: str) -> Tuple[pd.DataFrame, pd.Series]:
    df = pd.read_csv(path)

    merchants = []
    categories = []

    for _, row in df.iterrows():
        sms_text = row.get("sms_text", "")
        true_merchant = row.get("true_merchant")
        category = row.get("category")

        merchant = None
        if isinstance(true_merchant, str) and true_merchant.strip():
            merchant = true_merchant.strip()
        else:
            parsed = parse_sms(sms_text)
            merchant = parsed.get("merchant")

        if not merchant or not category:
            continue

        merchants.append(normalize_text(merchant))
        categories.append(category)

    data = pd.DataFrame({"merchant": merchants, "category": categories})
    X = data["merchant"]
    y = data["category"]
    return data, y
