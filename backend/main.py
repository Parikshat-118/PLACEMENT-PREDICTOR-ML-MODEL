from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import pickle
import numpy as np

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

with open("model.pkl", "rb") as f:
    model = pickle.load(f)

IQ_MIN, IQ_MAX = 70, 160
CGPA_MIN, CGPA_MAX = 4.0, 10.0

def normalize(val, mn, mx):
    return (val - mn) / (mx - mn) * 8 - 4

class StudentInput(BaseModel):
    iq: float
    cgpa: float

@app.post("/predict")
def predict(data: StudentInput):
    x1 = normalize(data.iq, IQ_MIN, IQ_MAX)
    x2 = normalize(data.cgpa, CGPA_MIN, CGPA_MAX)
    features = np.array([[x1, x2]])
    prediction = int(model.predict(features)[0])
    probabilities = model.predict_proba(features)[0].tolist()
    return {
        "prediction": prediction,
        "placed": prediction == 1,
        "probability_placed": round(probabilities[1] * 100, 1),
        "probability_not_placed": round(probabilities[0] * 100, 1),
    }

@app.get("/health")
def health():
    return {"status": "ok"}