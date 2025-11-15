import { useState, useEffect } from 'react'
import axios from 'axios'
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title, PointElement, LineElement, RadialLinearScale, Filler } from 'chart.js'
import { Pie, Bar, Line, Radar, Doughnut } from 'react-chartjs-2'
import './App.css'

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title, PointElement, LineElement, RadialLinearScale, Filler)

interface PredictionResult {
  eligible: boolean
  risk_category: string
  confidence: number
  risk_score: number
  monthly_emi: number
  disposable_income: number
  debt_to_income: number
  tips: string[]
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
  const [history, setHistory] = useState<any[]>([])
  const [activeTab, setActiveTab] = useState('predict')

  useEffect(() => {
    // Load history from localStorage
    const savedHistory = localStorage.getItem('loanPredictionHistory')
    if (savedHistory) {
      setHistory(JSON.parse(savedHistory))
    }
  }, [])

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

      setResult(response.data)
      
      // Add to history
      const newEntry = {
        ...response.data,
        formData: {...formData},
        timestamp: new Date().toLocaleString()
      }
      
      const updatedHistory = [newEntry, ...history.slice(0, 9)] // Keep only last 10 entries
      setHistory(updatedHistory)
      localStorage.setItem('loanPredictionHistory', JSON.stringify(updatedHistory))
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to get prediction. Make sure the backend server is running.')
    } finally {
      setLoading(false)
    }
  }

  const pieData = result ? {
    labels: ['Confidence', 'Risk'],
    datasets: [{
      data: [result.confidence, 100 - result.confidence],
      backgroundColor: [
        result.eligible ? '#4CAF50' : '#f44336',
        result.eligible ? '#81C784' : '#E57373'
      ],
      borderWidth: 0,
      hoverOffset: 4
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
      backgroundColor: [
        'rgba(54, 162, 235, 0.7)',
        'rgba(75, 192, 192, 0.7)',
        'rgba(153, 102, 255, 0.7)'
      ],
      borderColor: [
        'rgba(54, 162, 235, 1)',
        'rgba(75, 192, 192, 1)',
        'rgba(153, 102, 255, 1)'
      ],
      borderWidth: 2
    }]
  } : null

  // New radar chart for risk factors
  const radarData = result ? {
    labels: ['Credit Score', 'Income Stability', 'Debt Ratio', 'Employment', 'Loan Amount', 'Age Factor'],
    datasets: [{
      label: 'Risk Factors',
      data: [
        Math.min(100, (parseFloat(formData.credit_score) / 850) * 100),
        Math.min(100, (parseFloat(formData.income) / 1000000) * 100),
        Math.min(100, parseFloat(formData.debt_to_income)),
        Math.min(100, (parseFloat(formData.employment_years) / 20) * 100),
        Math.min(100, (parseFloat(formData.loan_amount) / parseFloat(formData.income)) * 50),
        Math.min(100, ((parseFloat(formData.age) - 18) / 50) * 100)
      ],
      backgroundColor: 'rgba(255, 99, 132, 0.2)',
      borderColor: 'rgba(255, 99, 132, 1)',
      borderWidth: 2,
      pointBackgroundColor: 'rgba(255, 99, 132, 1)',
      pointBorderColor: '#fff',
      pointHoverBackgroundColor: '#fff',
      pointHoverBorderColor: 'rgba(255, 99, 132, 1)'
    }]
  } : null

  // New doughnut chart for financial health
  const doughnutData = result ? {
    labels: ['EMI Burden', 'Disposable Income', 'Savings Potential'],
    datasets: [{
      data: [
        (result.monthly_emi / (parseFloat(formData.income) / 12)) * 100,
        (result.disposable_income / (parseFloat(formData.income) / 12)) * 100,
        100 - ((result.monthly_emi / (parseFloat(formData.income) / 12)) * 100) - ((result.disposable_income / (parseFloat(formData.income) / 12)) * 100)
      ],
      backgroundColor: [
        'rgba(255, 159, 64, 0.7)',
        'rgba(75, 192, 192, 0.7)',
        'rgba(153, 102, 255, 0.7)'
      ],
      borderColor: [
        'rgba(255, 159, 64, 1)',
        'rgba(75, 192, 192, 1)',
        'rgba(153, 102, 255, 1)'
      ],
      borderWidth: 2
    }]
  } : null

  const lineData = history.length > 1 ? {
    labels: history.map((_, index) => `Prediction ${index + 1}`),
    datasets: [
      {
        label: 'Confidence Score',
        data: history.map(item => item.confidence),
        borderColor: 'rgb(75, 192, 192)',
        backgroundColor: 'rgba(75, 192, 192, 0.2)',
        tension: 0.4
      },
      {
        label: 'Risk Score',
        data: history.map(item => item.risk_score),
        borderColor: 'rgb(255, 99, 132)',
        backgroundColor: 'rgba(255, 99, 132, 0.2)',
        tension: 0.4
      }
    ]
  } : null

  const clearHistory = () => {
    setHistory([])
    localStorage.removeItem('loanPredictionHistory')
  }

  return (
    <div className="app">
      <div className="container">
        <header className="app-header">
          <h1>🏦 Loan Eligibility & Risk Predictor</h1>
          <p className="subtitle">AI-Powered Loan Assessment System</p>
        </header>

        <div className="tabs">
          <button 
            className={activeTab === 'predict' ? 'tab active' : 'tab'}
            onClick={() => setActiveTab('predict')}
          >
            Predict Loan
          </button>
          <button 
            className={activeTab === 'history' ? 'tab active' : 'tab'}
            onClick={() => setActiveTab('history')}
          >
            History ({history.length})
          </button>
          <button 
            className={activeTab === 'analytics' ? 'tab active' : 'tab'}
            onClick={() => setActiveTab('analytics')}
            disabled={!lineData}
          >
            Analytics
          </button>
        </div>

        {activeTab === 'predict' && (
          <div className="tab-content">
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
                    className="input-field"
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
                    className="input-field"
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
                    className="input-field"
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
                    className="input-field"
                  />
                  <div className="score-indicator">
                    <span className="poor">Poor</span>
                    <span className="good">Good</span>
                    <span className="excellent">Excellent</span>
                  </div>
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
                    className="input-field"
                  />
                </div>

                <div className="form-group">
                  <label>Debt-to-Income Ratio (%)</label>
                  <input
                    type="number"
                    name="debt_to_income"
                    value={formData.debt_to_income}
                    onChange={handleChange}
                    required
                    min="0"
                    max="100"
                    step="0.1"
                    className="input-field"
                  />
                </div>
              </div>

              <button type="submit" disabled={loading} className="submit-btn">
                {loading ? (
                  <span className="loading-spinner"></span>
                ) : (
                  'Check Eligibility'
                )}
              </button>
            </form>

            {error && <div className="error">{error}</div>}

            {result && (
              <div className="result">
                <div className={`result-card ${result.eligible ? 'approved' : 'rejected'}`}>
                  <h2>{result.eligible ? '✅ Loan Approved' : '❌ Loan Rejected'}</h2>
                  <div className="result-details">
                    <p><strong>Risk Level:</strong> <span className={`risk-${result.risk_category.toLowerCase().split(' ')[0]}`}>{result.risk_category}</span></p>
                    <p><strong>Confidence:</strong> {result.confidence.toFixed(2)}%</p>
                    <p><strong>Monthly EMI:</strong> ₹{result.monthly_emi.toLocaleString('en-IN')}</p>
                    <p><strong>Disposable Income:</strong> ₹{result.disposable_income.toLocaleString('en-IN')}</p>
                    <p><strong>Debt-to-Income Ratio:</strong> {result.debt_to_income.toFixed(2)}%</p>
                  </div>
                </div>

                <div className="charts">
                  <div className="chart">
                    <h3>Confidence vs Risk</h3>
                    {pieData && <Pie data={pieData} options={{ responsive: true, maintainAspectRatio: true }} />}
                  </div>
                  <div className="chart">
                    <h3>Applicant Metrics</h3>
                    {barData && <Bar data={barData} options={{ responsive: true, maintainAspectRatio: true }} />}
                  </div>
                  <div className="chart">
                    <h3>Risk Factor Analysis</h3>
                    {radarData && <Radar data={radarData} options={{ responsive: true, maintainAspectRatio: true }} />}
                  </div>
                  <div className="chart">
                    <h3>Financial Health Distribution</h3>
                    {doughnutData && <Doughnut data={doughnutData} options={{ responsive: true, maintainAspectRatio: true }} />}
                  </div>
                </div>

                {result.tips && result.tips.length > 0 && (
                  <div className="tips-section">
                    <h3>💡 Personalized Recommendations</h3>
                    <div className="tips-grid">
                      {result.tips.map((tip, index) => (
                        <div key={index} className="tip-card">
                          <div className="tip-icon">
                            {tip.includes('⚠️') ? '⚠️' : 
                             tip.includes('📈') ? '📈' : 
                             tip.includes('📊') ? '📊' : 
                             tip.includes('✅') ? '✅' : 
                             tip.includes('💰') ? '💰' : 
                             tip.includes('💡') ? '💡' : 
                             tip.includes('🏦') ? '🏦' : 
                             tip.includes('✨') ? '✨' : 
                             tip.includes('📉') ? '📉' : 
                             tip.includes('🎉') ? '🎉' : 
                             tip.includes('🔄') ? '🔄' : 
                             tip.includes('📚') ? '📚' : '💡'}
                          </div>
                          <div className="tip-content">
                            <p>{tip.replace(/^[⚠️📈📊✅💰💡🏦✨📉🎉🔄📚]\s*/, '')}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {activeTab === 'history' && (
          <div className="tab-content">
            <div className="history-header">
              <h2>📊 Prediction History</h2>
              {history.length > 0 && (
                <button onClick={clearHistory} className="clear-btn">
                  Clear History
                </button>
              )}
            </div>
            
            {history.length === 0 ? (
              <div className="empty-history">
                <p>No prediction history yet. Make your first prediction!</p>
              </div>
            ) : (
              <div className="history-list">
                {history.map((entry, index) => (
                  <div key={index} className="history-item">
                    <div className="history-summary">
                      <span className={`status ${entry.eligible ? 'approved' : 'rejected'}`}>
                        {entry.eligible ? 'Approved' : 'Rejected'}
                      </span>
                      <span className="timestamp">{entry.timestamp}</span>
                    </div>
                    <div className="history-details">
                      <p><strong>Income:</strong> ₹{entry.formData.income.toLocaleString('en-IN')}</p>
                      <p><strong>Loan:</strong> ₹{entry.formData.loan_amount.toLocaleString('en-IN')}</p>
                      <p><strong>Confidence:</strong> {entry.confidence.toFixed(1)}%</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'analytics' && (
          <div className="tab-content">
            <h2>📈 Analytics Dashboard</h2>
            {lineData ? (
              <div className="analytics-content">
                <div className="chart">
                  <h3>Confidence & Risk Trends</h3>
                  <Line data={lineData} options={{ responsive: true, maintainAspectRatio: true }} />
                </div>
                <div className="stats-grid">
                  <div className="stat-card">
                    <h4>Total Predictions</h4>
                    <p className="stat-value">{history.length}</p>
                  </div>
                  <div className="stat-card">
                    <h4>Approval Rate</h4>
                    <p className="stat-value">
                      {history.length > 0 
                        ? `${((history.filter(h => h.eligible).length / history.length) * 100).toFixed(1)}%` 
                        : '0%'}
                    </p>
                  </div>
                  <div className="stat-card">
                    <h4>Avg Confidence</h4>
                    <p className="stat-value">
                      {history.length > 0 
                        ? `${(history.reduce((sum, h) => sum + h.confidence, 0) / history.length).toFixed(1)}%` 
                        : '0%'}
                    </p>
                  </div>
                  <div className="stat-card">
                    <h4>Avg Risk Score</h4>
                    <p className="stat-value">
                      {history.length > 0 
                        ? `${(history.reduce((sum, h) => sum + h.risk_score, 0) / history.length).toFixed(1)}` 
                        : '0'}
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="empty-history">
                <p>Not enough data for analytics. Make at least 2 predictions to see trends.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default App