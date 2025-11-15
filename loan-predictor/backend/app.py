from flask import Flask, request, jsonify
from flask_cors import CORS
import numpy as np
from sklearn.ensemble import RandomForestClassifier
from sklearn.preprocessing import StandardScaler
import joblib

app = Flask(__name__)
CORS(app)

# Simple ML model for loan eligibility
class LoanPredictor:
    def __init__(self):
        # Initialize with a pre-trained model (for demo, we'll create a simple one)
        self.model = RandomForestClassifier(n_estimators=100, random_state=42)
        self.scaler = StandardScaler()
        self._train_model()
    
    def _train_model(self):
        # Simple training data (in production, use real historical data)
        # Features: [income, loan_amount, credit_score, existing_loans, monthly_expenses, employment_years]
        X_train = np.array([
            [50000, 500000, 750, 0, 20000, 5],
            [80000, 1000000, 800, 1, 30000, 8],
            [30000, 300000, 650, 2, 15000, 2],
            [120000, 2000000, 850, 0, 40000, 10],
            [25000, 400000, 600, 1, 18000, 1],
            [90000, 1500000, 780, 1, 35000, 7],
            [45000, 600000, 720, 0, 22000, 4],
            [150000, 3000000, 900, 0, 50000, 15],
            [20000, 250000, 550, 2, 12000, 1],
            [70000, 900000, 760, 1, 28000, 6],
        ])
        # Labels: 1 = Approved, 0 = Rejected
        y_train = np.array([1, 1, 0, 1, 0, 1, 1, 1, 0, 1])
        
        self.scaler.fit(X_train)
        X_scaled = self.scaler.transform(X_train)
        self.model.fit(X_scaled, y_train)
    
    def predict(self, income, loan_amount, credit_score, existing_loans, monthly_expenses, employment_years):
        features = np.array([[income, loan_amount, credit_score, existing_loans, monthly_expenses, employment_years]])
        features_scaled = self.scaler.transform(features)
        
        # Get probability predictions
        eligibility_prob = self.model.predict_proba(features_scaled)[0]
        prediction = self.model.predict(features_scaled)[0]
        
        # Calculate risk score (0-100)
        dti_ratio = (monthly_expenses + (loan_amount * 0.01)) / income  # Simplified DTI
        credit_risk = max(0, (850 - credit_score) / 850 * 100)
        loan_to_income = (loan_amount / (income * 12)) * 100
        
        risk_score = min(100, (dti_ratio * 30 + credit_risk * 40 + loan_to_income * 0.3 + existing_loans * 10))
        
        return {
            'eligible': bool(prediction),
            'confidence': float(eligibility_prob[1] * 100),
            'risk_score': float(risk_score),
            'risk_category': self._get_risk_category(risk_score)
        }
    
    def _get_risk_category(self, risk_score):
        if risk_score < 30:
            return 'Low Risk'
        elif risk_score < 60:
            return 'Medium Risk'
        else:
            return 'High Risk'

predictor = LoanPredictor()

@app.route('/api/predict', methods=['POST'])
def predict_loan():
    try:
        data = request.json
        
        income = float(data.get('monthly_income', 0))
        loan_amount = float(data.get('loan_amount', 0))
        credit_score = int(data.get('credit_score', 300))
        existing_loans = int(data.get('existing_loans', 0))
        monthly_expenses = float(data.get('monthly_expenses', 0))
        employment_years = int(data.get('employment_years', 0))
        
        # Get prediction
        result = predictor.predict(income, loan_amount, credit_score, existing_loans, monthly_expenses, employment_years)
        
        # Calculate additional metrics
        monthly_emi = calculate_emi(loan_amount, 8.5, 20)  # 8.5% interest, 20 years
        disposable_income = income - monthly_expenses - monthly_emi
        
        # Generate tips
        tips = generate_tips(result, credit_score, income, monthly_expenses, loan_amount, existing_loans)
        
        response = {
            **result,
            'monthly_emi': round(monthly_emi, 2),
            'disposable_income': round(disposable_income, 2),
            'debt_to_income': round(((monthly_expenses + monthly_emi) / income) * 100, 2),
            'tips': tips
        }
        
        return jsonify(response)
    
    except Exception as e:
        return jsonify({'error': str(e)}), 400

def calculate_emi(principal, annual_rate, years):
    """Calculate EMI using standard formula"""
    monthly_rate = annual_rate / 12 / 100
    months = years * 12
    
    if monthly_rate == 0:
        return principal / months
    
    emi = principal * monthly_rate * ((1 + monthly_rate) ** months) / (((1 + monthly_rate) ** months) - 1)
    return emi

def generate_tips(result, credit_score, income, expenses, loan_amount, existing_loans):
    """Generate personalized tips based on the analysis"""
    tips = []
    
    if result['risk_category'] == 'High Risk':
        tips.append("⚠️ Your application shows high risk. Consider improving your financial profile before applying.")
    
    if credit_score < 700:
        tips.append("📈 Improve your credit score to 750+ for better loan terms. Pay bills on time and reduce credit utilization.")
    elif credit_score < 750:
        tips.append("📊 Good credit score! Aim for 750+ to get the best interest rates.")
    else:
        tips.append("✅ Excellent credit score! You qualify for premium loan rates.")
    
    dti = ((expenses + (loan_amount * 0.01)) / income)
    if dti > 0.5:
        tips.append("💰 Your debt-to-income ratio is high (>50%). Reduce monthly expenses or increase income.")
    elif dti > 0.36:
        tips.append("💡 Consider reducing your loan amount or monthly expenses to improve affordability.")
    
    if existing_loans > 2:
        tips.append("🏦 You have multiple existing loans. Try consolidating or paying off some before applying.")
    elif existing_loans == 0:
        tips.append("✨ No existing loans! This strengthens your application.")
    
    if loan_amount > income * 36:
        tips.append("📉 Loan amount is high relative to annual income. Consider a lower amount or co-applicant.")
    
    if result['eligible']:
        tips.append("🎉 You're likely eligible! Prepare documents: ID proof, income proof, bank statements.")
        tips.append("💼 Compare offers from 3-4 banks to get the best interest rate.")
    else:
        tips.append("🔄 Build your profile: Save for a larger down payment to reduce loan amount.")
        tips.append("📅 Wait 6-12 months while improving credit score and reducing expenses.")
    
    tips.append("📚 Consider financial planning: Emergency fund should be 6 months of expenses.")
    
    return tips

@app.route('/api/health', methods=['GET'])
def health():
    return jsonify({'status': 'healthy'})

if __name__ == '__main__':
    app.run(debug=True, port=5000)
