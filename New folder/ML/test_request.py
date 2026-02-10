import requests


url = "http://127.0.0.1:5174/predict"
data = {
    "symptoms": ["chills", "vomiting", "nausea", "abdominal_pain","high_fever","fatigue","breathlessness","dizziness","constipation","toxic_look_(typhos)","belly_pain"]
}

response = requests.post(url, json=data)
print(response.json()["predicted_specialist"])
