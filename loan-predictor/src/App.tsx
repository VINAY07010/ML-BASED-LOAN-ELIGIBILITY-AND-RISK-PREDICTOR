import { useState, useEffect, useRef } from 'react'
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
  const [animatedValues, setAnimatedValues] = useState({
    confidence: 0,
    risk: 0,
    emi: 0,
    disposable: 0
  })
  const [showConfetti, setShowConfetti] = useState(false)
  const resultRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    // Load history from localStorage
    const savedHistory = localStorage.getItem('loanPredictionHistory')
    if (savedHistory) {
      setHistory(JSON.parse(savedHistory))
    }
  }, [])

  // Animation effect for result values
  useEffect(() => {
    if (result) {
      const animateValue = (start: number, end: number, duration: number, setter: (val: number) => void) => {
        const startTime = performance.now()
        const animate = (currentTime: number) => {
          const elapsed = currentTime - startTime
          const progress = Math.min(elapsed / duration, 1)
          const currentValue = start + (end - start) * progress
          setter(currentValue)
          if (progress < 1) {
            requestAnimationFrame(animate)
          }
        }
        requestAnimationFrame(animate)
      }

      animateValue(0, result.confidence, 2000, (val) => setAnimatedValues(prev => ({...prev, confidence: val})))
      animateValue(0, result.risk_score, 2000, (val) => setAnimatedValues(prev => ({...prev, risk: val})))
      animateValue(0, result.monthly_emi, 2000, (val) => setAnimatedValues(prev => ({...prev, emi: val})))
      animateValue(0, result.disposable_income, 2000, (val) => setAnimatedValues(prev => ({...prev, disposable: val})))
      
      // Show confetti for approved loans
      if (result.eligible) {
        setShowConfetti(true)
        setTimeout(() => setShowConfetti(false), 3000)
      }
    }
  }, [result])

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
    setAnimatedValues({confidence: 0, risk: 0, emi: 0, disposable: 0})

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
      hoverOffset: 8
    }]
  } : null

  const barData = result ? {
    labels: ['Credit Score', 'Income (₹ lakhs)', 'Employment Years', 'DTI Ratio', 'Age Factor'],
    datasets: [{
      label: 'Applicant Metrics',
      data: [
        parseFloat(formData.credit_score),
        parseFloat(formData.income) / 100000,
        parseFloat(formData.employment_years),
        parseFloat(formData.debt_to_income),
        Math.min(100, (parseFloat(formData.age) - 18) * 2)
      ],
      backgroundColor: [
        'rgba(54, 162, 235, 0.8)',
        'rgba(75, 192, 192, 0.8)',
        'rgba(153, 102, 255, 0.8)',
        'rgba(255, 159, 64, 0.8)',
        'rgba(255, 99, 132, 0.8)'
      ],
      borderColor: [
        'rgba(54, 162, 235, 1)',
        'rgba(75, 192, 192, 1)',
        'rgba(153, 102, 255, 1)',
        'rgba(255, 159, 64, 1)',
        'rgba(255, 99, 132, 1)'
      ],
      borderWidth: 2,
      borderRadius: 8
    }]
  } : null

  // New radar chart for risk factors
  const radarData = result ? {
    labels: ['Credit Score', 'Income Stability', 'Debt Ratio', 'Employment', 'Loan Amount', 'Age Factor'],
    datasets: [{
      label: 'Risk Factors (0-100)',
      data: [
        Math.min(100, (parseFloat(formData.credit_score) / 850) * 100),
        Math.min(100, (parseFloat(formData.income) / 1000000) * 100),
        Math.min(100, parseFloat(formData.debt_to_income)),
        Math.min(100, (parseFloat(formData.employment_years) / 20) * 100),
        Math.min(100, (parseFloat(formData.loan_amount) / parseFloat(formData.income)) * 50),
        Math.min(100, ((parseFloat(formData.age) - 18) / 50) * 100)
      ],
      backgroundColor: 'rgba(255, 99, 132, 0.3)',
      borderColor: 'rgba(255, 99, 132, 1)',
      borderWidth: 3,
      pointBackgroundColor: 'rgba(255, 99, 132, 1)',
      pointBorderColor: '#fff',
      pointHoverBackgroundColor: '#fff',
      pointHoverBorderColor: 'rgba(255, 99, 132, 1)',
      pointRadius: 6
    }]
  } : null

  // New doughnut chart for financial health
  const doughnutData = result ? {
    labels: ['EMI Burden', 'Disposable Income', 'Savings Potential'],
    datasets: [{
      data: [
        Math.max(0, (result.monthly_emi / (parseFloat(formData.income) / 12)) * 100),
        Math.max(0, (result.disposable_income / (parseFloat(formData.income) / 12)) * 100),
        Math.max(0, 100 - ((result.monthly_emi / (parseFloat(formData.income) / 12)) * 100) - ((result.disposable_income / (parseFloat(formData.income) / 12)) * 100))
      ],
      backgroundColor: [
        'rgba(255, 159, 64, 0.8)',
        'rgba(75, 192, 192, 0.8)',
        'rgba(153, 102, 255, 0.8)'
      ],
      borderColor: [
        'rgba(255, 159, 64, 1)',
        'rgba(75, 192, 192, 1)',
        'rgba(153, 102, 255, 1)'
      ],
      borderWidth: 3,
      hoverOffset: 12
    }]
  } : null

  // New line chart for trend analysis
  const lineData = history.length > 1 ? {
    labels: history.slice(0, 5).map((_, index) => `Prediction ${index + 1}`),
    datasets: [
      {
        label: 'Confidence Score',
        data: history.slice(0, 5).map(item => item.confidence),
        borderColor: 'rgb(75, 192, 192)',
        backgroundColor: 'rgba(75, 192, 192, 0.2)',
        tension: 0.4,
        fill: true,
        pointRadius: 6,
        pointHoverRadius: 8
      },
      {
        label: 'Risk Score',
        data: history.slice(0, 5).map(item => item.risk_score),
        borderColor: 'rgb(255, 99, 132)',
        backgroundColor: 'rgba(255, 99, 132, 0.2)',
        tension: 0.4,
        fill: true,
        pointRadius: 6,
        pointHoverRadius: 8
      }
    ]
  } : null

  // Enhanced bubble chart for financial ratios
  const bubbleData = result ? {
    datasets: [{
      label: 'Financial Ratios',
      data: [
        {
          x: parseFloat(formData.credit_score),
          y: result.confidence,
          r: Math.max(5, (parseFloat(formData.income) / 1000000) * 20)
        },
        {
          x: parseFloat(formData.employment_years),
          y: 100 - result.risk_score,
          r: Math.max(5, (parseFloat(formData.loan_amount) / 1000000) * 20)
        },
        {
          x: parseFloat(formData.debt_to_income),
          y: result.disposable_income / 1000,
          r: Math.max(5, result.monthly_emi / 10000)
        }
      ],
      backgroundColor: [
        'rgba(255, 99, 132, 0.6)',
        'rgba(54, 162, 235, 0.6)',
        'rgba(75, 192, 192, 0.6)'
      ],
      borderColor: [
        'rgba(255, 99, 132, 1)',
        'rgba(54, 162, 235, 1)',
        'rgba(75, 192, 192, 1)'
      ],
      borderWidth: 2
    }]
  } : null

  const clearHistory = () => {
    setHistory([])
    localStorage.removeItem('loanPredictionHistory')
  }

  // Generate detailed recommendations based on specific factors
  const generateDetailedRecommendations = () => {
    if (!result || !formData) return []
    
    const recommendations = []
    
    // Credit score recommendations
    const creditScore = parseFloat(formData.credit_score)
    if (creditScore < 650) {
      recommendations.push({
        category: "Credit Score",
        priority: "high",
        recommendation: "Your credit score is below optimal. Focus on making all payments on time, reduce credit utilization below 30%, and avoid new credit applications for 6 months.",
        impact: "Can improve confidence by 15-20%"
      })
    } else if (creditScore < 750) {
      recommendations.push({
        category: "Credit Score",
        priority: "medium",
        recommendation: "Your credit score is good but can be excellent. Continue timely payments and consider becoming an authorized user on accounts with long positive histories.",
        impact: "Can improve confidence by 5-10%"
      })
    } else {
      recommendations.push({
        category: "Credit Score",
        priority: "low",
        recommendation: "Excellent credit score! Maintain responsible credit habits to keep it strong.",
        impact: "Strong foundation for loan approval"
      })
    }
    
    // Income to loan ratio recommendations
    const incomeToLoanRatio = parseFloat(formData.loan_amount) / parseFloat(formData.income)
    if (incomeToLoanRatio > 0.5) {
      recommendations.push({
        category: "Loan Amount",
        priority: "high",
        recommendation: "Your loan amount is high relative to income. Consider reducing the loan amount by 20-30% or adding a co-applicant to improve approval chances.",
        impact: "Can improve confidence by 20-25%"
      })
    } else if (incomeToLoanRatio > 0.3) {
      recommendations.push({
        category: "Loan Amount",
        priority: "medium",
        recommendation: "Your loan amount is reasonable but could be optimized. A 10-15% reduction might significantly improve your approval odds.",
        impact: "Can improve confidence by 8-12%"
      })
    }
    
    // Debt-to-income recommendations
    const dti = parseFloat(formData.debt_to_income)
    if (dti > 40) {
      recommendations.push({
        category: "Debt Management",
        priority: "high",
        recommendation: "Your debt-to-income ratio is high. Focus on paying down existing debts before applying for new loans. Consider debt consolidation options.",
        impact: "Can improve confidence by 15-25%"
      })
    } else if (dti > 30) {
      recommendations.push({
        category: "Debt Management",
        priority: "medium",
        recommendation: "Your debt-to-income ratio is manageable but could be improved. Pay down credit cards to below 20% utilization.",
        impact: "Can improve confidence by 5-10%"
      })
    }
    
    // Employment recommendations
    const employmentYears = parseFloat(formData.employment_years)
    if (employmentYears < 2) {
      recommendations.push({
        category: "Employment History",
        priority: "medium",
        recommendation: "Your employment history is limited. Provide additional documentation of stable income such as bank statements or freelance contracts.",
        impact: "Can improve confidence by 8-12%"
      })
    }
    
    // Age factor recommendations
    const age = parseFloat(formData.age)
    if (age < 25) {
      recommendations.push({
        category: "Profile Strength",
        priority: "medium",
        recommendation: "As a younger applicant, consider adding a co-signer or demonstrating financial responsibility through consistent savings and investments.",
        impact: "Can improve confidence by 10-15%"
      })
    }
    
    return recommendations
  }

  const detailedRecommendations = generateDetailedRecommendations()

  return (
    <div className="app">
      {/* Confetti effect for approved loans */}
      {showConfetti && (
        <div className="confetti-container">
          {[...Array(150)].map((_, i) => (
            <div 
              key={i} 
              className="confetti-piece"
              style={{
                left: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 2}s`,
                backgroundColor: `hsl(${Math.random() * 360}, 100%, 50%)`,
                transform: `rotate(${Math.random() * 360}deg)`
              }}
            />
          ))}
        </div>
      )}
      
      <div className="container">
        <header className="app-header">
          <h1 className="animated-title">🏦 Loan Eligibility & Risk Predictor</h1>
          <p className="subtitle">AI-Powered Loan Assessment System with Advanced Analytics</p>
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
          <button 
            className={activeTab === 'recommendations' ? 'tab active' : 'tab'}
            onClick={() => setActiveTab('recommendations')}
            disabled={!result}
          >
            Detailed Recommendations
          </button>
        </div>

        {activeTab === 'predict' && (
          <div className="tab-content">
            <form onSubmit={handleSubmit} className="form">
              <div className="form-grid">
                <div className="form-group">
                  <label>👤 Age</label>
                  <input
                    type="number"
                    name="age"
                    value={formData.age}
                    onChange={handleChange}
                    required
                    min="18"
                    max="100"
                    className="input-field animated-input"
                  />
                  <div className="input-hint">Applicant's age in years</div>
                </div>

                <div className="form-group">
                  <label>💰 Annual Income (₹)</label>
                  <input
                    type="number"
                    name="income"
                    value={formData.income}
                    onChange={handleChange}
                    required
                    min="0"
                    className="input-field animated-input"
                  />
                  <div className="input-hint">Total annual income before taxes</div>
                </div>

                <div className="form-group">
                  <label>💸 Loan Amount (₹)</label>
                  <input
                    type="number"
                    name="loan_amount"
                    value={formData.loan_amount}
                    onChange={handleChange}
                    required
                    min="0"
                    className="input-field animated-input"
                  />
                  <div className="input-hint">Requested loan amount</div>
                </div>

                <div className="form-group">
                  <label>📊 Credit Score</label>
                  <input
                    type="number"
                    name="credit_score"
                    value={formData.credit_score}
                    onChange={handleChange}
                    required
                    min="300"
                    max="850"
                    className="input-field animated-input"
                  />
                  <div className="score-indicator">
                    <span className="poor">Poor (300-579)</span>
                    <span className="good">Good (580-739)</span>
                    <span className="excellent">Excellent (740-850)</span>
                  </div>
                  <div className="input-hint">Higher scores improve approval chances</div>
                </div>

                <div className="form-group">
                  <label>💼 Employment Years</label>
                  <input
                    type="number"
                    name="employment_years"
                    value={formData.employment_years}
                    onChange={handleChange}
                    required
                    min="0"
                    step="0.1"
                    className="input-field animated-input"
                  />
                  <div className="input-hint">Years with current employer</div>
                </div>

                <div className="form-group">
                  <label>📈 Debt-to-Income Ratio (%)</label>
                  <input
                    type="number"
                    name="debt_to_income"
                    value={formData.debt_to_income}
                    onChange={handleChange}
                    required
                    min="0"
                    max="100"
                    step="0.1"
                    className="input-field animated-input"
                  />
                  <div className="input-hint">Monthly debt payments ÷ monthly income × 100</div>
                </div>
              </div>

              <button type="submit" disabled={loading} className="submit-btn animated-button">
                {loading ? (
                  <span className="loading-spinner"></span>
                ) : (
                  '🚀 Check Eligibility & Risk Assessment'
                )}
              </button>
            </form>

            {error && <div className="error animated-error">{error}</div>}

            {result && (
              <div ref={resultRef} className="result animated-result">
                <div className={`result-card ${result.eligible ? 'approved' : 'rejected'} animated-card`}>
                  <h2 className="result-title">
                    {result.eligible ? '✅ Loan Approved - Congratulations!' : '❌ Loan Rejected - Improvement Needed'}
                  </h2>
                  <div className="result-details">
                    <div className="metric-card">
                      <div className="metric-label">Confidence Score</div>
                      <div className="metric-value">{animatedValues.confidence.toFixed(1)}%</div>
                      <div className="metric-bar">
                        <div 
                          className="metric-fill" 
                          style={{width: `${animatedValues.confidence}%`, backgroundColor: result.eligible ? '#4CAF50' : '#f44336'}}
                        ></div>
                      </div>
                    </div>
                    
                    <div className="metric-card">
                      <div className="metric-label">Risk Level</div>
                      <div className={`metric-value risk-${result.risk_category.toLowerCase().split(' ')[0]}`}>
                        {result.risk_category}
                      </div>
                      <div className="metric-bar">
                        <div 
                          className="metric-fill" 
                          style={{width: `${animatedValues.risk}%`, backgroundColor: '#ff9800'}}
                        ></div>
                      </div>
                    </div>
                    
                    <div className="metric-card">
                      <div className="metric-label">Monthly EMI</div>
                      <div className="metric-value">₹{animatedValues.emi.toLocaleString('en-IN', {maximumFractionDigits: 0})}</div>
                    </div>
                    
                    <div className="metric-card">
                      <div className="metric-label">Disposable Income</div>
                      <div className="metric-value">₹{animatedValues.disposable.toLocaleString('en-IN', {maximumFractionDigits: 0})}</div>
                    </div>
                  </div>
                </div>

                <div className="charts-grid">
                  <div className="chart-container animated-chart">
                    <h3>🎯 Confidence vs Risk Analysis</h3>
                    <div className="chart-wrapper">
                      {pieData && <Pie data={pieData} options={{ responsive: true, maintainAspectRatio: true }} />}
                    </div>
                  </div>
                  
                  <div className="chart-container animated-chart">
                    <h3>📊 Applicant Metrics Comparison</h3>
                    <div className="chart-wrapper">
                      {barData && <Bar data={barData} options={{ responsive: true, maintainAspectRatio: true }} />}
                    </div>
                  </div>
                  
                  <div className="chart-container animated-chart">
                    <h3>📡 Risk Factor Radar</h3>
                    <div className="chart-wrapper">
                      {radarData && <Radar data={radarData} options={{ responsive: true, maintainAspectRatio: true }} />}
                    </div>
                  </div>
                  
                  <div className="chart-container animated-chart">
                    <h3>🍩 Financial Health Distribution</h3>
                    <div className="chart-wrapper">
                      {doughnutData && <Doughnut data={doughnutData} options={{ responsive: true, maintainAspectRatio: true }} />}
                    </div>
                  </div>
                </div>

                {result.tips && result.tips.length > 0 && (
                  <div className="tips-section animated-tips">
                    <h3>💡 Personalized Actionable Recommendations</h3>
                    <div className="tips-grid">
                      {result.tips.map((tip, index) => (
                        <div key={index} className="tip-card animated-tip">
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
              <h2>📊 Prediction History & Trends</h2>
              {history.length > 0 && (
                <button onClick={clearHistory} className="clear-btn animated-button">
                  🗑️ Clear History
                </button>
              )}
            </div>
            
            {history.length === 0 ? (
              <div className="empty-history animated-empty">
                <div className="empty-icon">📋</div>
                <p>No prediction history yet. Make your first prediction to start tracking your loan eligibility trends!</p>
              </div>
            ) : (
              <div className="history-content">
                <div className="history-list">
                  {history.map((entry, index) => (
                    <div key={index} className="history-item animated-history-item">
                      <div className="history-summary">
                        <span className={`status ${entry.eligible ? 'approved' : 'rejected'}`}>
                          {entry.eligible ? '✅ Approved' : '❌ Rejected'}
                        </span>
                        <span className="timestamp">⏱️ {entry.timestamp}</span>
                      </div>
                      <div className="history-details">
                        <p><strong>💰 Income:</strong> ₹{entry.formData.income?.toLocaleString('en-IN')}</p>
                        <p><strong>💸 Loan:</strong> ₹{entry.formData.loan_amount?.toLocaleString('en-IN')}</p>
                        <p><strong>📊 Confidence:</strong> {entry.confidence?.toFixed(1)}%</p>
                        <p><strong>📡 Risk:</strong> {entry.risk_category}</p>
                      </div>
                      <div className="history-metrics">
                        <div className="metric">
                          <span className="metric-label">EMI</span>
                          <span className="metric-value">₹{(entry.monthly_emi || 0).toLocaleString('en-IN', {maximumFractionDigits: 0})}</span>
                        </div>
                        <div className="metric">
                          <span className="metric-label">DTI</span>
                          <span className="metric-value">{entry.debt_to_income?.toFixed(1)}%</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'analytics' && (
          <div className="tab-content">
            <h2 className="section-title">📈 Advanced Analytics Dashboard</h2>
            {lineData ? (
              <div className="analytics-content">
                <div className="chart-container animated-chart">
                  <h3>📊 Confidence & Risk Trends Over Time</h3>
                  <div className="chart-wrapper">
                    <Line data={lineData} options={{ responsive: true, maintainAspectRatio: true }} />
                  </div>
                </div>
                
                <div className="stats-grid">
                  <div className="stat-card animated-stat">
                    <div className="stat-icon">📋</div>
                    <h4>Total Predictions</h4>
                    <p className="stat-value">{history.length}</p>
                  </div>
                  <div className="stat-card animated-stat">
                    <div className="stat-icon">✅</div>
                    <h4>Approval Rate</h4>
                    <p className="stat-value">
                      {history.length > 0 
                        ? `${((history.filter(h => h.eligible).length / history.length) * 100).toFixed(1)}%` 
                        : '0%'}
                    </p>
                  </div>
                  <div className="stat-card animated-stat">
                    <div className="stat-icon">🎯</div>
                    <h4>Avg Confidence</h4>
                    <p className="stat-value">
                      {history.length > 0 
                        ? `${(history.reduce((sum, h) => sum + h.confidence, 0) / history.length).toFixed(1)}%` 
                        : '0%'}
                    </p>
                  </div>
                  <div className="stat-card animated-stat">
                    <div className="stat-icon">📡</div>
                    <h4>Avg Risk Score</h4>
                    <p className="stat-value">
                      {history.length > 0 
                        ? `${(history.reduce((sum, h) => sum + h.risk_score, 0) / history.length).toFixed(1)}` 
                        : '0'}
                    </p>
                  </div>
                </div>
                
                {bubbleData && (
                  <div className="chart-container animated-chart">
                    <h3>🔬 Financial Ratios Analysis</h3>
                    <div className="chart-wrapper bubble-chart">
                      <Bar data={bubbleData} options={{ responsive: true, maintainAspectRatio: true }} />
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="empty-history animated-empty">
                <div className="empty-icon">📊</div>
                <p>Not enough data for analytics. Make at least 2 predictions to see trends and patterns.</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'recommendations' && (
          <div className="tab-content">
            <h2 className="section-title">📘 Detailed Personalized Recommendations</h2>
            {detailedRecommendations.length > 0 ? (
              <div className="recommendations-content">
                <div className="recommendations-grid">
                  {detailedRecommendations.map((rec, index) => (
                    <div key={index} className={`recommendation-card priority-${rec.priority} animated-recommendation`}>
                      <div className="rec-header">
                        <div className="rec-category">{rec.category}</div>
                        <div className={`rec-priority priority-${rec.priority}`}>
                          {rec.priority === 'high' ? '🔴 High Priority' : 
                           rec.priority === 'medium' ? '🟡 Medium Priority' : 
                           '🟢 Low Priority'}
                        </div>
                      </div>
                      <div className="rec-content">
                        <p>{rec.recommendation}</p>
                        <div className="rec-impact">
                          <strong>📈 Potential Impact:</strong> {rec.impact}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                
                <div className="recommendation-summary">
                  <h3>📋 Action Plan Summary</h3>
                  <ul>
                    {detailedRecommendations
                      .filter(rec => rec.priority === 'high')
                      .map((rec, index) => (
                        <li key={index}>
                          <strong>High Priority:</strong> {rec.category} - {rec.recommendation.substring(0, 50)}...
                        </li>
                      ))}
                    {detailedRecommendations.length === 0 && (
                      <li>Your profile is strong! Maintain current financial habits for optimal loan eligibility.</li>
                    )}
                  </ul>
                </div>
              </div>
            ) : (
              <div className="empty-history animated-empty">
                <div className="empty-icon">📘</div>
                <p>Make a prediction first to receive detailed personalized recommendations.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default App