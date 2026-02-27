import re
from typing import Dict, Optional

import pandas as pd


PATTERNS = {
    "amount": r"(?:rs\.?|inr|₹)\s*(\d+(?:\.\d{1,2})?)",
    "date": r"(\d{2}[-/]\d{2}[-/]\d{4})",
    "merchant_context": r"(?:at|to|for|on)\s+([A-Za-z0-9\s\&\.\-]+?)(?=\.|at|on|using|via|txn|ref|$)"
}


def parse_sms(text: str) -> Dict[str, Optional[str]]:
    data: Dict[str, Optional[str]] = {
        "amount": None,
        "date": None,
        "merchant": None
    }

    if not text:
        return data

    amount_match = re.search(PATTERNS["amount"], text, re.IGNORECASE)
    if amount_match:
        data["amount"] = amount_match.group(1)

    date_match = re.search(PATTERNS["date"], text)
    if date_match:
        data["date"] = date_match.group(1)

    merchant_match = re.search(
        PATTERNS["merchant_context"],
        text,
        re.IGNORECASE
    )
    if merchant_match:
        raw = merchant_match.group(1).strip()
        clean = re.sub(r"\b(rs|inr)\b", "", raw, flags=re.IGNORECASE)
        data["merchant"] = re.sub(r"\s+", " ", clean).strip()

    return data


def parse_dataset(path: str, output_path: str = "parsed_transactions.csv") -> pd.DataFrame:
    df = pd.read_csv(path)
    parsed_rows = []

    for _, row in df.iterrows():
        raw_text = row.get("sms_text", "")
        extracted = parse_sms(raw_text)
        parsed_rows.append(
            {
                "amount": extracted["amount"],
                "merchant": extracted["merchant"],
                "date": extracted["date"],
                "original_text": raw_text,
                "true_category": row.get("category")
            }
        )

    results_df = pd.DataFrame(parsed_rows)
    results_df.dropna(subset=["amount"], inplace=True)
    results_df.to_csv(output_path, index=False)
    return results_df


if __name__ == "__main__":
    data = parse_dataset("bank_sms_data.csv")
    print(f"Parsed {len(data)} transactions.")
