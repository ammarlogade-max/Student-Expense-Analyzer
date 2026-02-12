import argparse
import json
import os
import sys

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
os.chdir(BASE_DIR)
sys.path.insert(0, BASE_DIR)

from predictor import predict_category
from sms_parser import parse_sms


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--sms", type=str, default=None)
    parser.add_argument("--merchant", type=str, default=None)
    args = parser.parse_args()

    if not args.sms and not args.merchant:
        print(json.dumps({"error": "sms or merchant required"}))
        sys.exit(1)

    if args.sms:
        parsed = parse_sms(args.sms)
        merchant = parsed.get("merchant") or ""
        category = predict_category(merchant) if merchant else "Uncategorized"
        result = {
            "amount": parsed.get("amount"),
            "date": parsed.get("date"),
            "merchant": merchant,
            "category": category
        }
        print(json.dumps(result))
        return

    category = predict_category(args.merchant)
    print(json.dumps({"merchant": args.merchant, "category": category}))


if __name__ == "__main__":
    main()
