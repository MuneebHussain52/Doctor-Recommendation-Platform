"""
ML Model Performance Evaluation Script
Analyzes the XGBoost specialist prediction model performance
"""
import sys
import io
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

import joblib
import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.metrics import (
    accuracy_score, precision_score, recall_score, f1_score,
    classification_report, confusion_matrix
)
import warnings
warnings.filterwarnings("ignore")

print("="*70)
print("ML SPECIALIST PREDICTION MODEL - PERFORMANCE EVALUATION")
print("="*70)
print()

# Load the dataset
print("[1/6] Loading Specialist.csv dataset...")
try:
    df = pd.read_csv("../Specialist.csv")
    print(f"✓ Dataset loaded: {df.shape[0]} samples, {df.shape[1]} features")
    print(f"✓ Target column: {df.columns[-1]}")
    print(f"✓ Number of unique specialists: {df[df.columns[-1]].nunique()}")
    print()
except Exception as e:
    print(f"✗ Error loading dataset: {e}")
    exit(1)

# Load the trained model
print("[2/6] Loading trained XGBoost model...")
try:
    model = joblib.load("xgb_specialist_model.joblib")
    label_encoder = joblib.load("label_encoder.joblib")
    feature_columns = joblib.load("feature_columns.joblib")
    print(f"✓ Model loaded successfully")
    print(f"✓ Number of features: {len(feature_columns)}")
    print(f"✓ Number of specialist classes: {len(label_encoder.classes_)}")
    print()
except Exception as e:
    print(f"✗ Error loading model: {e}")
    exit(1)

# Prepare data
print("[3/6] Preparing dataset for evaluation...")
# Drop first column (unnamed index) and use all except last as features
X = df.iloc[:, 1:-1]  # Skip first column (index), all columns except last
y = df.iloc[:, -1]     # Last column (specialist)

# Ensure feature alignment - match features with model's expected features
available_features = [col for col in feature_columns if col in X.columns]
if len(available_features) != len(feature_columns):
    print(f"⚠ Warning: Using {len(available_features)}/{len(feature_columns)} matching features")
    X = X[available_features]
else:
    X = X[feature_columns]

# Encode target labels
y_encoded = label_encoder.transform(y)

# Split data (using same split as training would have used)
X_train, X_test, y_train, y_test = train_test_split(
    X, y_encoded, test_size=0.2, random_state=42, stratify=y_encoded
)
print(f"✓ Training set: {X_train.shape[0]} samples")
print(f"✓ Test set: {X_test.shape[0]} samples")
print()

# Make predictions
print("[4/6] Generating predictions...")
y_pred = model.predict(X_test)
y_pred_labels = label_encoder.inverse_transform(y_pred)
y_test_labels = label_encoder.inverse_transform(y_test)
print(f"✓ Predictions generated for {len(y_test)} samples")
print()

# Calculate metrics
print("[5/6] Calculating performance metrics...")
print()
print("-" * 70)
print("OVERALL PERFORMANCE METRICS")
print("-" * 70)

accuracy = accuracy_score(y_test, y_pred)
precision = precision_score(y_test, y_pred, average='weighted', zero_division=0)
recall = recall_score(y_test, y_pred, average='weighted', zero_division=0)
f1 = f1_score(y_test, y_pred, average='weighted', zero_division=0)

print(f"Accuracy:  {accuracy:.4f} ({accuracy*100:.2f}%)")
print(f"Precision: {precision:.4f} ({precision*100:.2f}%)")
print(f"Recall:    {recall:.4f} ({recall*100:.2f}%)")
print(f"F1-Score:  {f1:.4f} ({f1*100:.2f}%)")
print()

# Per-class performance
print("-" * 70)
print("PER-SPECIALIST PERFORMANCE")
print("-" * 70)
print()
report = classification_report(y_test_labels, y_pred_labels, output_dict=True, zero_division=0)

# Sort specialists by F1-score
specialist_scores = []
for specialist in label_encoder.classes_:
    if specialist in report:
        specialist_scores.append({
            'Specialist': specialist,
            'Precision': report[specialist]['precision'],
            'Recall': report[specialist]['recall'],
            'F1-Score': report[specialist]['f1-score'],
            'Support': int(report[specialist]['support'])
        })

specialist_df = pd.DataFrame(specialist_scores)
specialist_df = specialist_df.sort_values('F1-Score', ascending=False)

print(specialist_df.to_string(index=False))
print()

# Identify problem areas
print("-" * 70)
print("IDENTIFIED ISSUES & RECOMMENDATIONS")
print("-" * 70)
print()

issues_found = False

# Check overall accuracy
if accuracy < 0.80:
    issues_found = True
    print(f"⚠ LOW ACCURACY ({accuracy*100:.2f}%)")
    print("  Recommendations:")
    print("  • Collect more training data")
    print("  • Feature engineering: create new symptom combinations")
    print("  • Try hyperparameter tuning (learning_rate, max_depth, n_estimators)")
    print("  • Consider ensemble methods or different algorithms")
    print()

# Check for poorly performing specialists
poor_performers = specialist_df[specialist_df['F1-Score'] < 0.70]
if len(poor_performers) > 0:
    issues_found = True
    print(f"⚠ POORLY PERFORMING SPECIALISTS ({len(poor_performers)} found)")
    print("  Specialists with F1-Score < 0.70:")
    for _, row in poor_performers.iterrows():
        print(f"  • {row['Specialist']}: F1={row['F1-Score']:.3f} (Support: {row['Support']})")
    print()
    print("  Recommendations:")
    print("  • Collect more samples for underrepresented specialists")
    print("  • Check for symptom overlap between similar specialists")
    print("  • Review and clean training data for these classes")
    print("  • Consider SMOTE or other oversampling techniques")
    print()

# Check class imbalance
class_distribution = pd.Series(y_test_labels).value_counts()
max_samples = class_distribution.max()
min_samples = class_distribution.min()
imbalance_ratio = max_samples / min_samples

if imbalance_ratio > 3:
    issues_found = True
    print(f"⚠ CLASS IMBALANCE DETECTED (Ratio: {imbalance_ratio:.1f}:1)")
    print(f"  Max samples: {max_samples}, Min samples: {min_samples}")
    print("  Recommendations:")
    print("  • Use stratified sampling")
    print("  • Apply class weights in model training")
    print("  • Use oversampling (SMOTE) or undersampling techniques")
    print("  • Collect more data for underrepresented classes")
    print()

if not issues_found:
    print("✓ MODEL PERFORMANCE IS GOOD")
    print("  The model shows acceptable performance across all metrics.")
    print()

print("[6/6] Evaluation complete!")
print()
print("="*70)
print("SUMMARY")
print("="*70)
print(f"Overall Accuracy: {accuracy*100:.2f}%")
print(f"Average F1-Score: {f1*100:.2f}%")
print(f"Total Specialists: {len(label_encoder.classes_)}")
print(f"Test Samples: {len(y_test)}")

if accuracy >= 0.90:
    print("\n✓ EXCELLENT: Model performance is excellent!")
elif accuracy >= 0.80:
    print("\n✓ GOOD: Model performance is good, minor improvements possible")
elif accuracy >= 0.70:
    print("\n⚠ FAIR: Model needs improvement")
else:
    print("\n✗ POOR: Model needs significant improvement")

print("="*70)
