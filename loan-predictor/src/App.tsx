import { useState } from 'react'
import axios from 'axios'
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title } from 'chart.js'
import { Pie, Bar } from 'react-chartjs-2'
import './App.css'

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title)

interface PredictionResult {
  eligible: boolean
  risk_level: string
  confidence: number
  recommendation: string
}

function App() {
  const [formData, setFormData] = useState({
    age: '',
    income: '',
    loan_amount: '',
    credit_score: '',
    employment_years: '',
    debt_to_income: ''
  })

  const [result, setResult] = useState<PredictionResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setResult(null)

    try {
      // Use environment variable for API URL, fallback to localhost for development
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000'
      
      const response = await axios.post(`${apiUrl}/api/predict`, {
        monthly_income: parseFloat(formData.income) / 12, // Convert annual to monthly
        loan_amount: parseFloat(formData.loan_amount),
        credit_score: parseFloat(formData.credit_score),
        existing_loans: 0, // Not in form, defaulting to 0
        monthly_expenses: (parseFloat(formData.income) / 12) * (parseFloat(formData.debt_to_income) / 100),
        employment_years: parseFloat(formData.employment_years)
      })

      // Map backend response to frontend expected structure
      setResult({
        eligible: response.data.eligible,
        risk_level: response.data.risk_category,
        confidence: response.data.confidence,
        recommendation: response.data.tips.join('. ') + '.'
      })
    } catch (err) {
      setError('Failed to get prediction. Make sure the backend server is running.')
    } finally {
      setLoading(false)
    }
  }

  const pieData = result ? {
    labels: ['Confidence', 'Risk'],
    datasets: [{
      data: [result.confidence, 100 - result.confidence],
      backgroundColor: ['#4CAF50', '#f44336'],
      borderWidth: 0
    }]
  } : null

  const barData = result ? {
    labels: ['Credit Score', 'Income (₹ lakhs)', 'Employment Years'],
    datasets: [{
      label: 'Applicant Metrics',
      data: [
        parseFloat(formData.credit_score),
        parseFloat(formData.income) / 100000,
        parseFloat(formData.employment_years)
      ],
      backgroundColor: ['#2196F3', '#4CAF50', '#FF9800']
    }]
  } : null

  return (
    <div className="app">
      <div className="container">
        <h1>🏦 Loan Eligibility & Risk Predictor</h1>
        <p className="subtitle">AI-Powered Loan Assessment System</p>

        <form onSubmit={handleSubmit} className="form">
          <div className="form-grid">
            <div className="form-group">
              <label>Age</label>
              <input
                type="number"
                name="age"
                value={formData.age}
                onChange={handleChange}
                required
                min="18"
                max="100"
              />
            </div>

            <div className="form-group">
              <label>Annual Income (₹)</label>
              <input
                type="number"
                name="income"
                value={formData.income}
                onChange={handleChange}
                required
                min="0"
              />
            </div>

            <div className="form-group">
              <label>Loan Amount (₹)</label>
              <input
                type="number"
                name="loan_amount"
                value={formData.loan_amount}
                onChange={handleChange}
                required
                min="0"
              />
            </div>

            <div className="form-group">
              <label>Credit Score</label>
              <input
                type="number"
                name="credit_score"
                value={formData.credit_score}
                onChange={handleChange}
                required
                min="300"
                max="850"
              />
            </div>

            <div className="form-group">
              <label>Employment Years</label>
              <input
                type="number"
                name="employment_years"
                value={formData.employment_years}
                onChange={handleChange}
                required
                min="0"
                step="0.1"
              />
            </div>

            <div className="form-group">
              <label>Debt-to-Income Ratio</label>
              <input
                type="number"
                name="debt_to_income"
                value={formData.debt_to_income}
                onChange={handleChange}
                required
                min="0"
                max="100"
                step="0.1"
              />
            </div>
          </div>

          <button type="submit" disabled={loading} className="submit-btn">
            {loading ? 'Processing...' : 'Check Eligibility'}
          </button>
        </form>

        {error && <div className="error">{error}</div>}

        {result && (
          <div className="result">
            <div className={`result-card ${result.eligible ? 'approved' : 'rejected'}`}>
              <h2>{result.eligible ? '✅ Loan Approved' : '❌ Loan Rejected'}</h2>
              <div className="result-details">
                <p><strong>Risk Level:</strong> <span className={`risk-${result.risk_level.toLowerCase()}`}>{result.risk_level}</span></p>
                <p><strong>Confidence:</strong> {result.confidence.toFixed(2)}%</p>
                <p><strong>Recommendation:</strong> {result.recommendation}</p>
              </div>
            </div>

            <div className="charts">
              <div className="chart">
                <h3>Confidence Score</h3>
                {pieData && <Pie data={pieData} />}
              </div>
              <div className="chart">
                <h3>Applicant Metrics</h3>
                {barData && <Bar data={barData} options={{ responsive: true, maintainAspectRatio: true }} />}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default App
