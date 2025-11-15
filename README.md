# ML-Based Loan Eligibility and Risk Predictor

A machine learning-powered web application that predicts loan eligibility and assesses risk levels for loan applicants.

## Project Structure

```
├── loan-predictor/           # Frontend React application
│   ├── src/                  # Source code
│   ├── public/               # Static assets
│   └── backend/             # Python Flask backend
└── README.md                # This file
```

## Prerequisites

- Node.js (v16 or higher)
- Python (3.9.15)
- Git
- npm or yarn

## Frontend Setup (React + Vite)

1. **Navigate to the frontend directory:**
   ```bash
   cd loan-predictor
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Run development server:**
   ```bash
   npm run dev
   ```
   Visit `http://localhost:5173` in your browser

4. **Build for production:**
   ```bash
   npm run build
   ```

## Backend Setup (Python Flask)

1. **Navigate to the backend directory:**
   ```bash
   cd loan-predictor/backend
   ```

2. **Create virtual environment:**
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

4. **Run development server:**
   ```bash
   python app.py
   ```
   Backend will be available at `http://localhost:5000`

## Deployment Instructions

### Frontend Deployment (GitHub Pages)

1. **Update API URL in [.env.production](file:///c:/Users/vinay/OneDrive/Desktop/LOAN%20ELIGIBILITY%20AND%20RISK%20PREDICTOR/loan-predictor/.env.production):**
   ```
   VITE_API_URL=https://your-backend-url.com
   ```

2. **Deploy to GitHub Pages:**
   ```bash
   npm run deploy
   ```

### Backend Deployment (Render)

1. **Create a new Web Service on Render**
2. **Connect your GitHub repository**
3. **Configure with these settings:**
   - Name: `loan-predictor-backend`
   - Environment: Python 3
   - Root Directory: `loan-predictor/backend`
   - Build Command: `pip install -r requirements.txt`
   - Start Command: `gunicorn --bind 0.0.0.0:$PORT app:app`
4. **Add Environment Variable:**
   - Key: `PYTHON_VERSION`
   - Value: `3.9.15`

## API Endpoints

### POST `/api/predict`
Predicts loan eligibility and risk level.

**Request Body:**
```json
{
  "monthly_income": 50000,
  "loan_amount": 500000,
  "credit_score": 750,
  "existing_loans": 0,
  "monthly_expenses": 20000,
  "employment_years": 5
}
```

**Response:**
```json
{
  "eligible": true,
  "confidence": 92.5,
  "risk_score": 25.3,
  "risk_category": "Low Risk",
  "monthly_emi": 4200.50,
  "disposable_income": 25800.00,
  "debt_to_income": 0.42,
  "tips": ["✅ Excellent credit score! You qualify for premium loan rates.", "..."]
}
```

## Features

- Loan eligibility prediction using machine learning
- Risk assessment with detailed scoring
- Interactive form with real-time validation
- Data visualization with charts
- Responsive design for all devices
- Currency support for Indian Rupees (₹)

## Technologies Used

### Frontend
- React with TypeScript
- Vite (Build tool)
- Axios (HTTP client)
- Chart.js (Data visualization)
- CSS3 (Styling)

### Backend
- Python Flask
- Scikit-learn (Machine Learning)
- NumPy (Numerical computing)
- Gunicorn (Production server)

## Troubleshooting

### Frontend Issues
1. **"Failed to get prediction" error:**
   - Ensure backend is running
   - Check API URL in [.env.production](file:///c:/Users/vinay/OneDrive/Desktop/LOAN%20ELIGIBILITY%20AND%20RISK%20PREDICTOR/loan-predictor/.env.production) file
   - Verify CORS settings

### Backend Issues
1. **Import errors:**
   - Ensure all dependencies are installed
   - Check Python version compatibility

2. **Port conflicts:**
   - Change port in [app.py](file:///c:/Users/vinay/OneDrive/Desktop/LOAN%20ELIGIBILITY%20AND%20RISK%20PREDICTOR/loan-predictor/backend/app.py) or use environment variables

## License

This project is for educational purposes.