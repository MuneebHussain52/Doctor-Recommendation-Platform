"""
Simple ML Model Performance Evaluation
Tests the model using the Flask API endpoint
"""
import sys
import io
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

import requests
import pandas as pd
import random
from collections import Counter

print("="*70)
print("ML SPECIALIST PREDICTION MODEL - PERFORMANCE EVALUATION")
print("="*70)
print()

# Load dataset
print("[1/5] Loading Specialist.csv dataset...")
df = pd.read_csv("../Specialist.csv")
print(f"✓ Dataset loaded: {df.shape[0]} samples")
print(f"✓ Number of specialists: {df['Disease'].nunique()}")
specialist_counts = df['Disease'].value_counts()
print(f"✓ Samples per specialist: {specialist_counts.min()} to {specialist_counts.max()}")
print()

# Get symptom columns and prepare test samples
symptom_cols = df.columns[1:-1]  # Skip first (index) and last (Disease)
target_col = df.columns[-1]

# Sample 100 random test cases
print("[2/5] Selecting 100 random test samples...")
test_samples = df.sample(n=min(100, len(df)), random_state=42)
print(f"✓ Selected {len(test_samples)} test samples")
print()

# Test predictions
print("[3/5] Testing predictions via Flask API...")
correct = 0
total = 0
predictions_by_specialist = {}

for idx, row in test_samples.iterrows():
    # Get symptoms that are present (value = 1)
    symptoms = [symptom_cols[i] for i, val in enumerate(row[1:-1]) if val == 1]
    actual_specialist = row[target_col]

    if len(symptoms) == 0:
        continue

    # Call API
    try:
        response = requests.post(
            "http://127.0.0.1:5174/predict",
            json={"symptoms": symptoms[:10]},  # Limit to first 10 symptoms
            timeout=2
        )

        if response.status_code == 200:
            data = response.json()
            predicted = data.get("predicted_specialist", "Unknown")

            # Track predictions
            if actual_specialist not in predictions_by_specialist:
                predictions_by_specialist[actual_specialist] = {"correct": 0, "total": 0, "predictions": []}

            predictions_by_specialist[actual_specialist]["total"] += 1
            predictions_by_specialist[actual_specialist]["predictions"].append(predicted)

            if predicted == actual_specialist:
                correct += 1
                predictions_by_specialist[actual_specialist]["correct"] += 1

            total += 1

            if total % 20 == 0:
                print(f"  Tested {total} samples...")
    except Exception as e:
        print(f"  ⚠ API Error for sample {total}: {str(e)[:50]}")
        continue

print(f"✓ Completed {total} predictions")
print()

# Calculate metrics
print("[4/5] Calculating performance metrics...")
print()
print("-" * 70)
print("OVERALL PERFORMANCE")
print("-" * 70)

if total > 0:
    accuracy = correct / total
    print(f"Accuracy: {accuracy:.4f} ({accuracy*100:.2f}%)")
    print(f"Correct: {correct}/{total}")
else:
    print("⚠ No predictions were made")
    exit(1)

print()

# Per-specialist analysis
print("-" * 70)
print("PER-SPECIALIST PERFORMANCE")
print("-" * 70)
print(f"{'Specialist':<25} {'Accuracy':<12} {'Correct':<10} {'Total'}")
print("-" * 70)

specialist_scores = []
for specialist in sorted(predictions_by_specialist.keys()):
    stats = predictions_by_specialist[specialist]
    acc = stats["correct"] / stats["total"] if stats["total"] > 0 else 0
    specialist_scores.append((specialist, acc, stats["correct"], stats["total"]))
    print(f"{specialist:<25} {acc:.2%}          {stats['correct']:<10} {stats['total']}")

print()

# Recommendations
print("[5/5] Generating recommendations...")
print()
print("-" * 70)
print("IDENTIFIED ISSUES & RECOMMENDATIONS")
print("-" * 70)
print()

issues_found = False

if accuracy < 0.80:
    issues_found = True
    print(f"⚠ LOW ACCURACY ({accuracy*100:.2f}%)")
    print("  Recommendations:")
    print("  • Collect more diverse training data")
    print("  • Improve feature engineering")
    print("  • Tune hyperparameters (learning_rate, max_depth)")
    print("  • Try different ML algorithms or ensemble methods")
    print()

poor_performers = [s for s in specialist_scores if s[1] < 0.70]
if len(poor_performers) > 0:
    issues_found = True
    print(f"⚠ POORLY PERFORMING SPECIALISTS ({len(poor_performers)} found)")
    for specialist, acc, corr, tot in poor_performers:
        print(f"  • {specialist}: {acc:.1%} accuracy ({corr}/{tot})")
    print()
    print("  Recommendations:")
    print("  • Add more training samples for these specialists")
    print("  • Review symptom patterns for overlapping conditions")
    print("  • Apply SMOTE or oversampling for underrepresented classes")
    print()

# Check class imbalance
max_samples = specialist_counts.max()
min_samples = specialist_counts.min()
imbalance_ratio = max_samples / min_samples

if imbalance_ratio > 3:
    issues_found = True
    print(f"⚠ CLASS IMBALANCE (Ratio: {imbalance_ratio:.1f}:1)")
    print(f"  Max samples: {max_samples}, Min samples: {min_samples}")
    print("  Recommendations:")
    print("  • Use class weights during training")
    print("  • Apply oversampling (SMOTE) for minority classes")
    print("  • Collect more data for underrepresented specialists")
    print()

if not issues_found:
    print("✓ MODEL PERFORMANCE IS GOOD")
    print("  The model shows acceptable performance.")
    print()

print("="*70)
print("SUMMARY")
print("="*70)
print(f"Overall Accuracy: {accuracy*100:.2f}%")
print(f"Test Samples: {total}")
print(f"Specialists Evaluated: {len(predictions_by_specialist)}")

if accuracy >= 0.90:
    print("\n✓ EXCELLENT: Model performance is excellent!")
elif accuracy >= 0.80:
    print("\n✓ GOOD: Model performance is good")
elif accuracy >= 0.70:
    print("\n⚠ FAIR: Model needs improvement")
else:
    print("\n✗ POOR: Model needs significant improvement")

print("="*70)
