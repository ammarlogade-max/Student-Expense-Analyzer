import datetime
import random

import pandas as pd


NUM_SAMPLES = 8000

MASK_RATE = 0.0

base_merchants = {
    "Food": [
        "Zomato",
        "Swiggy",
        "Starbucks",
        "McDonalds",
        "Dominos",
        "Burger King",
        "KFC",
        "Subway",
        "Cafe Coffee Day",
        "Pizza Hut",
        "Haldirams"
    ],
    "Travel": [
        "Uber",
        "Ola",
        "Rapido",
        "Shell Petrol",
        "Metro",
        "Indian Oil",
        "IRCTC",
        "RedBus",
        "IndiGo",
        "SpiceJet"
    ],
    "Shopping": [
        "Amazon",
        "Flipkart",
        "Myntra",
        "Zara",
        "H&M",
        "Ajio",
        "Reliance Trends",
        "Decathlon",
        "Croma",
        "Nike"
    ],
    "Entertainment": [
        "Netflix",
        "BookMyShow",
        "PVR",
        "Spotify",
        "Hotstar",
        "Prime Video",
        "Gaana",
        "SonyLIV"
    ],
    "Health": [
        "Apollo Pharmacy",
        "Practo",
        "Gym Membership",
        "1mg",
        "Dr Lal Pathlabs",
        "Netmeds"
    ],
    "Groceries": [
        "BigBasket",
        "Blinkit",
        "Reliance Fresh",
        "Dmart",
        "More Supermarket",
        "Spencers"
    ]
}

suffixes = [
    ""
]


def expand_merchants():
    merchants = {}
    for category, names in base_merchants.items():
        expanded = []
        for name in names:
            for suffix in suffixes:
                expanded.append(f"{name}{suffix}".strip())
        merchants[category] = list(set(expanded))
    return merchants

templates = [
    "Rs. {amount} debited from a/c ending XX1234 on {date} to {merchant}. Avl Bal: Rs 15000.",
    "Dear User, INR {amount} spent on {merchant} at {date}. Ref: 8932742.",
    "Alert: You have spent Rs {amount} at {merchant} on {date}. Clear bal: Rs. 1200.00",
    "Txn of INR {amount} done at {merchant} on {date} using UPI.",
    "Paid Rs {amount} to {merchant} via UPI on {date}. Txn ID: 998877.",
    "Acct XX999 debited by Rs {amount} for {merchant} on {date}.",
    "INR {amount} charged on card ending 4455 at {merchant} on {date}.",
    "You paid Rs {amount} at {merchant} via POS on {date}.",
    "UPI txn of Rs {amount} to {merchant} on {date} is successful."
]


def get_random_date():
    start_date = datetime.date.today() - datetime.timedelta(days=30)
    random_days = random.randint(0, 30)
    return (start_date + datetime.timedelta(days=random_days)).strftime("%d-%m-%Y")


def generate_dataset():
    merchants = expand_merchants()
    data = []
    print(f"Generating {NUM_SAMPLES} fake SMS messages...")

    for _ in range(NUM_SAMPLES):
        category = random.choice(list(merchants.keys()))
        merchant = random.choice(merchants[category])

        if category == "Food":
            amount = random.randint(100, 1500)
        elif category == "Shopping":
            amount = random.randint(500, 5000)
        else:
            amount = random.randint(50, 2000)

        template = random.choice(templates)
        date = get_random_date()
        if random.random() < MASK_RATE:
            masked = "Merchant" if random.random() < 0.5 else "POS Merchant"
            sms_text = template.format(amount=amount, merchant=masked, date=date)
        else:
            sms_text = template.format(amount=amount, merchant=merchant, date=date)

        data.append(
            {
                "sms_text": sms_text,
                "category": category,
                "true_merchant": merchant,
                "true_amount": amount
            }
        )

    df = pd.DataFrame(data)
    df.to_csv("bank_sms_data.csv", index=False)
    print("Success! File 'bank_sms_data.csv' created.")
    print(df.head())


if __name__ == "__main__":
    generate_dataset()
