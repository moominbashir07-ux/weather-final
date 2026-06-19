# 🌬️ AQI Predictor — Air Quality Forecasting System

A production-ready full-stack web application that predicts Air Quality Index (AQI) using machine learning. Built with React + FastAPI + scikit-learn.

![AQI Predictor](https://img.shields.io/badge/ML-Powered-22d3ee?style=for-the-badge)
![Python](https://img.shields.io/badge/Python-3.11+-3776ab?style=for-the-badge&logo=python)
![React](https://img.shields.io/badge/React-18-61dafb?style=for-the-badge&logo=react)
![FastAPI](https://img.shields.io/badge/FastAPI-0.111-009688?style=for-the-badge&logo=fastapi)

---

## ✨ Features

- **ML Prediction Engine** — Compares Linear Regression, Random Forest, and Decision Tree; auto-selects best model
- **7-Day Forecast** — AQI predictions for the upcoming week with confidence scores
- **Interactive Dashboard** — Rich charts: pollution trends, feature importance, predicted vs actual
- **Health Advisories** — WHO/EPA-aligned AQI categories with actionable health guidance
- **Admin Panel** — Retrain models on-demand with live training logs
- **Dark Mode** — Beautiful dark cyberpunk aesthetic with animated gradients

---

## 🏗️ Project Structure

```
aqi-predictor/
├── backend/
│   ├── app.py                  # FastAPI application (all routes)
│   ├── requirements.txt        # Python dependencies
│   ├── ml_model/
│   │   ├── train.py            # ML training pipeline
│   │   ├── best_model.pkl      # Saved best model (auto-generated)
│   │   ├── scaler.pkl          # Feature scaler (auto-generated)
│   │   └── metrics.pkl         # Training metrics (auto-generated)
│   ├── datasets/
│   │   └── aqi_dataset.csv     # Optional: your CSV dataset
│   └── logs/
│       └── app.log             # Runtime logs
│
└── frontend/
    ├── src/
    │   ├── App.jsx             # Router
    │   ├── main.jsx            # Entry point
    │   ├── index.css           # Global styles + Tailwind
    │   ├── components/
    │   │   ├── Navbar.jsx      # Navigation
    │   │   ├── AQIGauge.jsx    # SVG semicircle gauge
    │   │   ├── ParamInput.jsx  # Slider + number input
    │   │   └── StatCard.jsx    # Metric card
    │   ├── pages/
    │   │   ├── Home.jsx        # Landing page
    │   │   ├── Predictor.jsx   # AQI prediction form
    │   │   ├── Forecast.jsx    # 7-day forecast
    │   │   ├── Analytics.jsx   # Charts & model metrics
    │   │   └── Admin.jsx       # Admin / retrain panel
    │   └── utils/
    │       ├── api.js          # Axios API calls
    │       └── aqi.js          # AQI categories & helpers
    ├── package.json
    ├── vite.config.js
    └── tailwind.config.js
```

---

## 🚀 Quick Start

### 1. Backend Setup

```bash
cd backend

# Install Python dependencies
pip install -r requirements.txt

# Train the model (auto-generates synthetic data if no CSV provided)
python ml_model/train.py

# Start the API server
python app.py
# OR: uvicorn app:app --reload --port 8000
```

API runs at: **http://localhost:8000**
Interactive docs: **http://localhost:8000/docs**

### 2. Frontend Setup

```bash
cd frontend

# Install npm packages
npm install

# Start development server
npm run dev
```

Frontend runs at: **http://localhost:3000**

---

## 📊 Dataset Format

Place your CSV at `backend/datasets/aqi_dataset.csv` with these columns:

| Column | Type | Unit | Description |
|--------|------|------|-------------|
| `temperature` | float | °C | Ambient temperature |
| `humidity` | float | % | Relative humidity |
| `wind_speed` | float | km/h | Wind speed |
| `co2` | float | ppm | CO2 concentration |
| `pm25` | float | µg/m³ | Particulate matter 2.5µm |
| `pm10` | float | µg/m³ | Particulate matter 10µm |
| `no2` | float | µg/m³ | Nitrogen dioxide |
| `so2` | float | µg/m³ | Sulfur dioxide |
| `aqi` | float | — | Target: Air Quality Index |

**Data Sources:**
- [OpenAQ API](https://api.openaq.org) — Real-time global AQ data
- [Kaggle AQI Datasets](https://www.kaggle.com/search?q=air+quality+index)
- [US EPA AQS](https://aqs.epa.gov/aqsweb/documents/data_api.html)
- [India CPCB](https://app.cpcbccr.com/ccr/#/caaqm-dashboard-all/caaqm-landing)

---

## 🔌 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/` | API info |
| `GET` | `/health` | System health check |
| `POST` | `/predict` | Predict AQI from parameters |
| `POST` | `/train` | Retrain ML model |
| `GET` | `/aqi-history?days=30` | Historical AQI data |
| `GET` | `/forecast?days=7` | 7-day AQI forecast |
| `GET` | `/metrics` | Model training metrics |

### Example: POST /predict

```bash
curl -X POST http://localhost:8000/predict \
  -H "Content-Type: application/json" \
  -d '{
    "temperature": 28,
    "humidity": 65,
    "wind_speed": 8,
    "co2": 550,
    "pm25": 45,
    "pm10": 90,
    "no2": 55,
    "so2": 30
  }'
```

Response:
```json
{
  "aqi": 87.3,
  "category": "Moderate",
  "color": "#FFFF00",
  "health_message": "Acceptable air quality...",
  "model_used": "Linear Regression",
  "confidence": "High"
}
```

---

## 🤖 ML Models

| Model | R² | Notes |
|-------|-----|-------|
| Linear Regression | ~98.8% | Best performer on synthetic data |
| Random Forest | ~97.9% | Robust to real-world noise |
| Decision Tree | ~95.3% | Fast but less accurate |

The system **automatically selects** the model with the highest R² score.

---

## 🎨 AQI Categories

| AQI Range | Category | Color |
|-----------|----------|-------|
| 0–50 | Good | 🟢 Green |
| 51–100 | Moderate | 🟡 Yellow |
| 101–150 | Unhealthy for Sensitive Groups | 🟠 Orange |
| 151–200 | Unhealthy | 🔴 Red |
| 201–300 | Very Unhealthy | 🟣 Purple |
| 301+ | Hazardous | 🟤 Maroon |

---

## 🌐 Deployment

### Frontend → Vercel

```bash
cd frontend
npm run build
# Push to GitHub, connect to Vercel
# Set env: VITE_API_URL=https://your-backend.onrender.com
```

### Backend → Render

1. Create new Web Service on [render.com](https://render.com)
2. Set root directory to `backend/`
3. Build command: `pip install -r requirements.txt && python ml_model/train.py`
4. Start command: `uvicorn app:app --host 0.0.0.0 --port $PORT`

### Backend → Railway

```bash
railway login
railway init
railway up
```

---

## ⚙️ Environment Variables

**Frontend** (`.env`):
```
VITE_API_URL=http://localhost:8000
```

**Backend** (`.env`):
```
PORT=8000
LOG_LEVEL=info
```

---

## 📦 Requirements

**Python:** 3.10+
**Node.js:** 18+

```bash
# Python
fastapi, uvicorn, scikit-learn, pandas, numpy, pydantic

# JavaScript  
react, react-router-dom, recharts, framer-motion, lucide-react, axios, tailwindcss
```

---

## 🏥 Health & Safety Disclaimer

AQI predictions are for informational purposes only. Always consult official government air quality monitoring agencies for health decisions.

---

## 🛠️ Modern Stack Setup & Conventions

### 1. Component Path Convention (`/components/ui`)
In this codebase, standard reusable UI components are stored in `src/components/ui/` (mapped via Vite/TypeScript path alias `@/components/ui/`).
- **Why it matters:** Centering base components in `/components/ui/` keeps standard primitives (like buttons, dialogs, and loaders) separated from high-level page-specific components. This guarantees seamless compatibility with standard copy-paste shadcn templates and CLI imports.

### 2. Setting Up TypeScript
If you want to migrate this project to full TypeScript support:
1. Install TypeScript compiler and type declarations:
   ```bash
   cd frontend
   npm install -D typescript @types/react @types/react-dom @types/node
   ```
2. Initialize TypeScript config:
   ```bash
   npx tsc --init
   ```
3. Rename source files from `.js` / `.jsx` to `.ts` / `.tsx`.
4. Update `vite.config.js` to support TS extensions if necessary.

### 3. Setting Up Tailwind CSS (Already Configured)
To set up Tailwind CSS from scratch in a new React project:
1. Install Tailwind and its peers:
   ```bash
   npm install -D tailwindcss postcss autoprefixer
   npx tailwindcss init -p
   ```
2. Configure template paths in `tailwind.config.js`:
   ```javascript
   content: [
     "./index.html",
     "./src/**/*.{js,ts,jsx,tsx}",
   ]
   ```
3. Add Tailwind directives to `index.css`:
   ```css
   @tailwind base;
   @tailwind components;
   @tailwind utilities;
   ```

### 4. Setting Up shadcn CLI
To initialize and manage shadcn components:
1. Run the shadcn initialization CLI:
   ```bash
   npx shadcn@latest init
   ```
2. Configure directories (select React/Vite, select CSS variables, specify `@/lib/utils` and `@/components` paths).
3. Install new components on-demand:
   ```bash
   npx shadcn@latest add button card dialog
   ```

---

*Built with ❤️ using React + FastAPI + scikit-learn*
