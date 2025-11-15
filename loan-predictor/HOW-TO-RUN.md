# Loan Eligibility & Risk Predictor

A simple ML-based loan eligibility and risk prediction website for Indian borrowers (INR currency).

## Features

- ✅ ML-powered loan eligibility prediction
- 📊 Interactive charts (Risk assessment, Monthly breakdown)
- 💰 INR currency formatting throughout
- 📈 Credit score evaluation (300-900 CIBIL scale)
- 💡 Personalized tips and recommendations
- 🎯 Risk categorization (Low/Medium/High)
- 💳 EMI calculation and affordability analysis

## Quick Start

### Backend (Flask + ML Model)

1. Navigate to backend folder:
```bash
cd backend
```

2. Install Python dependencies:
```bash
pip install -r requirements.txt
```

3. Start Flask server:
```bash
python app.py
```

Server runs on: http://localhost:5000

### Frontend (React + Vite)

1. From project root, install dependencies:
```bash
npm install
```

2. Start development server:
```bash
npm run dev
```

Frontend runs on: http://localhost:5173

## How to Use

1. Fill in your financial details:
   - Monthly Income (₹)
   - Desired Loan Amount (₹)
   - Monthly Expenses (₹)
   - Credit Score (300-900)
   - Number of Existing Loans
   - Years of Employment

2. Click "Check Eligibility" button

3. View your results:
   - Eligibility status with confidence score
   - Risk assessment chart
   - Monthly breakdown (EMI, expenses, disposable income)
   - Personalized tips for improvement
   - Key financial metrics

## Technologies Used

- **Frontend**: React, Vite, Chart.js
- **Backend**: Flask (Python)
- **ML**: Scikit-learn (Random Forest Classifier)
- **Styling**: Custom CSS with gradient themes

## Tips for Better Eligibility

- Maintain credit score above 750
- Keep debt-to-income ratio below 40%
- Reduce existing loans before applying
- Ensure positive disposable income after EMI
- Build emergency fund (6 months expenses)

## Note

This is a demo application. Actual loan decisions involve many more factors and should be made in consultation with financial institutions and advisors.
