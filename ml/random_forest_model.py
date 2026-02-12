import pandas as pd
import pickle
from sklearn.feature_extraction.text import CountVectorizer
from sklearn.ensemble import RandomForestClassifier  # <--- NEW IMPORT
from sklearn.pipeline import make_pipeline
from sklearn.model_selection import train_test_split
import time

# --- 1. LOAD DATA ---
print("⏳ Loading data...")
df = pd.read_csv("bank_sms_data.csv")

X = df['true_merchant']
y = df['category']

# --- 2. SPLIT DATA ---
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

# --- 3. BUILD THE PIPELINE (Random Forest Version) ---
# We use 100 "Trees" in our forest. More trees = smarter but slower.
print("🌲 Building Random Forest (100 Trees)...")
model = make_pipeline(CountVectorizer(), RandomForestClassifier(n_estimators=100, n_jobs=-1))

# --- 4. TRAIN THE MODEL ---
start_time = time.time()
print("🧠 Training the brain... (This might take a moment)")
model.fit(X_train, y_train)
end_time = time.time()

print(f"⏱️ Training Time: {end_time - start_time:.2f} seconds")

# --- 5. TEST ACCURACY ---
score = model.score(X_test, y_test)
print(f"✅ Random Forest Accuracy: {score * 100:.2f}%")

# --- 6. SAVE THE BRAIN ---
with open("expense_model.pkl", "wb") as f:
    pickle.dump(model, f)
    
print("💾 Model saved to 'expense_model.pkl'")

# --- 7. LIVE TEST ---
print("\n--- 🤖 LIVE TEST (Random Forest) ---")
test_merchants = ["Starbucks Coffee", "Uber Rides", "PVR Cinemas", "Apollo Pharmacy", "Unknown Shop 123"]
predictions = model.predict(test_merchants)

for merchant, category in zip(test_merchants, predictions):
    print(f"Spent at '{merchant}' --> Categorized as: {category}")


