from flask import Flask, request, jsonify
import joblib
import pandas as pd
import difflib
import warnings

warnings.filterwarnings("ignore")


MODEL_FILE = "xgb_specialist_model.joblib"
LABEL_ENCODER_FILE = "label_encoder.joblib"
FEATURES_FILE = "feature_columns.joblib"

try:
    model = joblib.load(MODEL_FILE)
    label_encoder = joblib.load(LABEL_ENCODER_FILE)
    feature_columns = joblib.load(FEATURES_FILE)
except Exception as e:
    print(f"Failed to load: {e}")
    raise

def normalize_name(name):
    return name.strip().lower().replace(" ", "_").replace("-", "_")

feature_map = {c: c for c in feature_columns}
feature_lower_map = {normalize_name(c): c for c in feature_columns}
feature_list_lower = list(feature_lower_map.keys())

from flask_cors import CORS
app = Flask(__name__)
CORS(app)

@app.route("/", methods=["GET"])
def home():
    return jsonify({"message": "Specialist Prediction API running!"})

@app.route("/predict", methods=["POST"])
def predict():
    data = request.get_json(force=True)
    symptoms = data.get("symptoms", [])

    if not isinstance(symptoms, list) or len(symptoms) == 0:
        return jsonify({"error": "Please provide a list of symptoms"}), 400

    sample = pd.DataFrame([[0]*len(feature_columns)], columns=feature_columns)
    recognized = []
    unrecognized = []

    for s in symptoms:
        key = normalize_name(s)
        if key in feature_lower_map:
            col = feature_lower_map[key]
            sample.at[0, col] = 1
            recognized.append(col)
        else:
            suggestions = difflib.get_close_matches(key, feature_list_lower, n=1, cutoff=0.7)
            if suggestions:
                col = feature_lower_map[suggestions[0]]
                sample.at[0, col] = 1
                recognized.append(col)
            else:
                unrecognized.append(s)

    if not recognized:
        return jsonify({"error": "No valid symptoms recognized"}), 400

    pred = model.predict(sample)
    pred_label = label_encoder.inverse_transform(pred)[0]

    return jsonify({
        "predicted_specialist": pred_label,
        "recognized_symptoms": recognized,
        "unrecognized_symptoms": unrecognized
    })

if __name__ == "__main__":
    app.run(debug=True, host="0.0.0.0", port=5174)
