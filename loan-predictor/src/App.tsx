import { useState, useEffect, useRef } from 'react'
import axios from 'axios'
import { 
  Chart as ChartJS, 
  ArcElement, 
  Tooltip, 
  Legend, 
  CategoryScale, 
  LinearScale, 
  BarElement, 
  Title, 
  PointElement, 
  LineElement, 
  RadialLinearScale, 
  Filler,
  ChartData
} from 'chart.js'
import { Pie, Bar, Line, Radar, Doughnut } from 'react-chartjs-2'
import './App.css'

ChartJS.register(
  ArcElement, 
  Tooltip, 
  Legend, 
  CategoryScale, 
  LinearScale, 
  BarElement, 
  Title, 
  PointElement, 
  LineElement, 
  RadialLinearScale, 
  Filler
)

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

interface DetailedRecommendation {
  category: string
  priority: 'high' | 'medium' | 'low'
  recommendation: string
  impact: string
  action_steps: string[]
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
  const [particles, setParticles] = useState<any[]>([])
  const resultRef = useRef<HTMLDivElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  // Particle system for professional background
  useEffect(() => {
    const generateParticles = () => {
      const newParticles = []
      for (let i = 0; i < 30; i++) {
        newParticles.push({
          id: i,
          x: Math.random() * 100,
          y: Math.random() * 100,
          size: Math.random() * 4 + 1,
          speed: Math.random() * 1.5 + 0.3,
          opacity: Math.random() * 0.4 + 0.1
        })
      }
      setParticles(newParticles)
    }
    
    generateParticles()
    
    // Animate particles
    const interval = setInterval(() => {
      setParticles(prev => prev.map(particle => ({
        ...particle,
        y: particle.y > 100 ? 0 : particle.y + particle.speed * 0.15,
        x: particle.x + Math.sin(particle.y * 0.015) * 0.15
      })))
    }, 80)
    
    return () => clearInterval(interval)
  }, [])

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

  // Generate detailed recommendations
  const generateDetailedRecommendations = (): DetailedRecommendation[] => {
    if (!result || !formData) return []
    
    const recommendations: DetailedRecommendation[] = []
    const creditScore = parseFloat(formData.credit_score)
    const income = parseFloat(formData.income)
    const loanAmount = parseFloat(formData.loan_amount)
    const dti = parseFloat(formData.debt_to_income)
    const employmentYears = parseFloat(formData.employment_years)
    
    // Credit score recommendations
    if (creditScore < 650) {
      recommendations.push({
        category: "Credit Score Improvement",
        priority: "high",
        recommendation: "Your credit score is below optimal. Focus on making all payments on time, reduce credit utilization below 30%, and avoid new credit applications for 6 months.",
        impact: "Can improve confidence by 15-20%",
        action_steps: [
          "Pay all bills on time for the next 6 months",
          "Reduce credit card balances to under 30% of limits",
          "Avoid applying for new credit cards or loans",
          "Check credit report for errors and dispute inaccuracies"
        ]
      })
    } else if (creditScore < 750) {
      recommendations.push({
        category: "Credit Score Enhancement",
        priority: "medium",
        recommendation: "Your credit score is good but can be excellent. Continue timely payments and consider becoming an authorized user on accounts with long positive histories.",
        impact: "Can improve confidence by 5-10%",
        action_steps: [
          "Maintain perfect payment history for 12 months",
          "Keep credit utilization under 10%",
          "Become authorized user on well-established accounts",
          "Consider a secured credit card to build history"
        ]
      })
    }
    
    // Income to loan ratio recommendations
    const incomeToLoanRatio = loanAmount / income
    if (incomeToLoanRatio > 0.5) {
      recommendations.push({
        category: "Loan Amount Optimization",
        priority: "high",
        recommendation: "Your loan amount is high relative to income. Consider reducing the loan amount by 20-30% or adding a co-applicant to improve approval chances.",
        impact: "Can improve confidence by 20-25%",
        action_steps: [
          "Reduce loan amount by 20-30%",
          "Add a co-applicant with strong credit history",
          "Increase down payment to reduce loan requirement",
          "Consider extending loan term to reduce monthly payments"
        ]
      })
    } else if (incomeToLoanRatio > 0.3) {
      recommendations.push({
        category: "Loan Amount Review",
        priority: "medium",
        recommendation: "Your loan amount is reasonable but could be optimized. A 10-15% reduction might significantly improve your approval odds.",
        impact: "Can improve confidence by 8-12%",
        action_steps: [
          "Reduce loan amount by 10-15%",
          "Explore government assistance programs",
          "Consider alternative financing options",
          "Negotiate better terms with lender"
        ]
      })
    }
    
    // Debt-to-income recommendations
    if (dti > 40) {
      recommendations.push({
        category: "Debt Management",
        priority: "high",
        recommendation: "Your debt-to-income ratio is high. Focus on paying down existing debts before applying for new loans. Consider debt consolidation options.",
        impact: "Can improve confidence by 15-25%",
        action_steps: [
          "Create debt repayment plan prioritizing high-interest debts",
          "Consider debt consolidation or balance transfer",
          "Reduce discretionary spending to allocate more to debt payments",
          "Explore debt management programs"
        ]
      })
    } else if (dti > 30) {
      recommendations.push({
        category: "Debt Optimization",
        priority: "medium",
        recommendation: "Your debt-to-income ratio is manageable but could be improved. Pay down credit cards to below 20% utilization.",
        impact: "Can improve confidence by 5-10%",
        action_steps: [
          "Pay down credit card balances to under 20% utilization",
          "Avoid taking on new debt before loan application",
          "Consider paying bi-weekly instead of monthly",
          "Explore balance transfer options for lower interest rates"
        ]
      })
    }
    
    // Employment recommendations
    if (employmentYears < 2) {
      recommendations.push({
        category: "Employment History Strengthening",
        priority: "medium",
        recommendation: "Your employment history is limited. Provide additional documentation of stable income such as bank statements or freelance contracts.",
        impact: "Can improve confidence by 8-12%",
        action_steps: [
          "Provide 12 months of bank statements showing consistent income",
          "Obtain employment verification letter from current employer",
          "Include freelance or contract work documentation",
          "Add a co-applicant with established employment history"
        ]
      })
    }
    
    return recommendations
  }

  const detailedRecommendations = generateDetailedRecommendations()

  // Chart data
  const pieData: ChartData<'pie', number[], string> = result ? {
    labels: ['Confidence', 'Risk'],
    datasets: [{
      data: [result.confidence, 100 - result.confidence],
      backgroundColor: [
        result.eligible ? '#10b981' : '#ef4444',
        result.eligible ? '#86efac' : '#fecaca'
      ],
      borderWidth: 0,
      hoverOffset: 8
    }]
  } : {
    labels: [],
    datasets: [{
      data: [],
      backgroundColor: [],
      borderWidth: 0
    }]
  }

  const barData: ChartData<'bar', number[], string> = result ? {
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
        'rgba(59, 130, 246, 0.8)',
        'rgba(16, 185, 129, 0.8)',
        'rgba(139, 92, 246, 0.8)',
        'rgba(245, 158, 11, 0.8)',
        'rgba(239, 68, 68, 0.8)'
      ],
      borderColor: [
        'rgba(59, 130, 246, 1)',
        'rgba(16, 185, 129, 1)',
        'rgba(139, 92, 246, 1)',
        'rgba(245, 158, 11, 1)',
        'rgba(239, 68, 68, 1)'
      ],
      borderWidth: 1
    }]
  } : {
    labels: [],
    datasets: [{
      label: '',
      data: [],
      backgroundColor: [],
      borderColor: [],
      borderWidth: 0
    }]
  }

  const radarData: ChartData<'radar', number[], string> = result ? {
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
      backgroundColor: 'rgba(59, 130, 246, 0.2)',
      borderColor: 'rgba(59, 130, 246, 1)',
      borderWidth: 2,
      pointBackgroundColor: 'rgba(59, 130, 246, 1)',
      pointBorderColor: '#fff',
      pointHoverBackgroundColor: '#fff',
      pointHoverBorderColor: 'rgba(59, 130, 246, 1)'
    }]
  } : {
    labels: [],
    datasets: [{
      label: '',
      data: [],
      backgroundColor: '',
      borderColor: '',
      borderWidth: 0,
      pointBackgroundColor: '',
      pointBorderColor: '',
      pointHoverBackgroundColor: '',
      pointHoverBorderColor: ''
    }]
  }

  const doughnutData: ChartData<'doughnut', number[], string> = result ? {
    labels: ['EMI Burden', 'Disposable Income', 'Savings Potential'],
    datasets: [{
      data: [
        Math.max(0, (result.monthly_emi / (parseFloat(formData.income) / 12)) * 100),
        Math.max(0, (result.disposable_income / (parseFloat(formData.income) / 12)) * 100),
        Math.max(0, 100 - ((result.monthly_emi / (parseFloat(formData.income) / 12)) * 100) - ((result.disposable_income / (parseFloat(formData.income) / 12)) * 100))
      ],
      backgroundColor: [
        'rgba(245, 158, 11, 0.8)',
        'rgba(16, 185, 129, 0.8)',
        'rgba(139, 92, 246, 0.8)'
      ],
      borderColor: [
        'rgba(245, 158, 11, 1)',
        'rgba(16, 185, 129, 1)',
        'rgba(139, 92, 246, 1)'
      ],
      borderWidth: 2
    }]
  } : {
    labels: [],
    datasets: [{
      data: [],
      backgroundColor: [],
      borderColor: [],
      borderWidth: 0
    }]
  }

  return (
    <div className="App">
      {/* Particles background */}
      <div className="particles">
        {particles.map(particle => (
          <div
            key={particle.id}
            className="particle"
            style={{
              left: `${particle.x}%`,
              top: `${particle.y}%`,
              width: `${particle.size}px`,
              height: `${particle.size}px`,
              opacity: particle.opacity
            }}
          ></div>
        ))}
      </div>
      
      {/* Confetti effect */}
      {showConfetti && (
        <div className="confetti">
          {[...Array(20)].map((_, i) => (
            <div 
              key={i} 
              className="confetti-particle"
              style={{
                left: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 2}s`,
                backgroundColor: `hsl(${Math.random() * 360}, 70%, 60%)`
              }}
            />
          ))}
        </div>
      )}
      
      <div className="container" ref={containerRef}>
        <header className="app-header">
          <h1>🏦 Loan Eligibility & Risk Predictor</h1>
          <p className="subtitle">AI-Powered Financial Assessment with Detailed Analytics</p>
        </header>
        
        <nav className="navigation">
          <button 
            className={activeTab === 'predict' ? 'nav-button active' : 'nav-button'}
            onClick={() => setActiveTab('predict')}
          >
            Predict Loan
          </button>
          <button 
            className={activeTab === 'analytics' ? 'nav-button active' : 'nav-button'}
            onClick={() => setActiveTab('analytics')}
          >
            Detailed Analytics
          </button>
          <button 
            className={activeTab === 'recommendations' ? 'nav-button active' : 'nav-button'}
            onClick={() => setActiveTab('recommendations')}
            disabled={!result}
          >
            Actionable Recommendations
          </button>
          <button 
            className={activeTab === 'history' ? 'nav-button active' : 'nav-button'}
            onClick={() => setActiveTab('history')}
          >
            History ({history.length})
          </button>
        </nav>
        
        <main className="main-content">
          {activeTab === 'predict' && (
            <section className="predict-section">
              <form onSubmit={handleSubmit} className="loan-form">
                <div className="form-grid">
                  <div className="form-group">
                    <label htmlFor="age">👤 Age (Years)</label>
                    <input
                      type="number"
                      id="age"
                      name="age"
                      value={formData.age}
                      onChange={handleChange}
                      required
                      min="18"
                      max="100"
                      className="form-input"
                    />
                    <p className="input-hint">Applicant's current age</p>
                  </div>
                  
                  <div className="form-group">
                    <label htmlFor="income">💰 Annual Income (₹)</label>
                    <input
                      type="number"
                      id="income"
                      name="income"
                      value={formData.income}
                      onChange={handleChange}
                      required
                      min="0"
                      className="form-input"
                    />
                    <p className="input-hint">Total annual income before taxes</p>
                  </div>
                  
                  <div className="form-group">
                    <label htmlFor="loan_amount">💸 Loan Amount (₹)</label>
                    <input
                      type="number"
                      id="loan_amount"
                      name="loan_amount"
                      value={formData.loan_amount}
                      onChange={handleChange}
                      required
                      min="0"
                      className="form-input"
                    />
                    <p className="input-hint">Requested loan amount</p>
                  </div>
                  
                  <div className="form-group">
                    <label htmlFor="credit_score">📊 Credit Score</label>
                    <input
                      type="number"
                      id="credit_score"
                      name="credit_score"
                      value={formData.credit_score}
                      onChange={handleChange}
                      required
                      min="300"
                      max="850"
                      className="form-input"
                    />
                    <div className="credit-score-indicator">
                      <span className="score-poor">Poor (300-579)</span>
                      <span className="score-good">Good (580-739)</span>
                      <span className="score-excellent">Excellent (740-850)</span>
                    </div>
                    <p className="input-hint">Higher scores improve approval chances</p>
                  </div>
                  
                  <div className="form-group">
                    <label htmlFor="employment_years">💼 Employment Years</label>
                    <input
                      type="number"
                      id="employment_years"
                      name="employment_years"
                      value={formData.employment_years}
                      onChange={handleChange}
                      required
                      min="0"
                      step="0.1"
                      className="form-input"
                    />
                    <p className="input-hint">Years with current employer</p>
                  </div>
                  
                  <div className="form-group">
                    <label htmlFor="debt_to_income">📈 Debt-to-Income Ratio (%)</label>
                    <input
                      type="number"
                      id="debt_to_income"
                      name="debt_to_income"
                      value={formData.debt_to_income}
                      onChange={handleChange}
                      required
                      min="0"
                      max="100"
                      step="0.1"
                      className="form-input"
                    />
                    <p className="input-hint">Monthly debt payments ÷ monthly income × 100</p>
                  </div>
                </div>
                
                <button type="submit" disabled={loading} className="submit-button">
                  {loading ? (
                    <>
                      <span className="spinner"></span>
                      Analyzing...
                    </>
                  ) : (
                    '🚀 Analyze Loan Eligibility & Risk'
                  )}
                </button>
              </form>
              
              {error && (
                <div className="error-message">
                  <p>❌ {error}</p>
                </div>
              )}
              
              {result && (
                <div className="result-section" ref={resultRef}>
                  <div className={`result-card ${result.eligible ? 'approved' : 'rejected'}`}>
                    <div className="result-header">
                      <h2>
                        {result.eligible ? '✅ Loan Approved' : '❌ Loan Rejected'}
                      </h2>
                      <p className="result-subtitle">
                        {result.eligible ? 'Congratulations! You meet the eligibility criteria.' : 'Improvement needed to qualify for this loan.'}
                      </p>
                    </div>
                    
                    <div className="result-metrics">
                      <div className="metric">
                        <div className="metric-label">Confidence Score</div>
                        <div className="metric-value">{animatedValues.confidence.toFixed(1)}%</div>
                        <div className="metric-bar">
                          <div 
                            className="metric-fill" 
                            style={{width: `${animatedValues.confidence}%`, backgroundColor: result.eligible ? '#10b981' : '#ef4444'}}
                          ></div>
                        </div>
                      </div>
                      
                      <div className="metric">
                        <div className="metric-label">Risk Level</div>
                        <div className={`metric-value risk-${result.risk_category.toLowerCase().split(' ')[0]}`}>
                          {result.risk_category}
                        </div>
                        <div className="metric-bar">
                          <div 
                            className="metric-fill" 
                            style={{width: `${animatedValues.risk}%`, backgroundColor: '#f59e0b'}}
                          ></div>
                        </div>
                      </div>
                      
                      <div className="metric">
                        <div className="metric-label">Monthly EMI</div>
                        <div className="metric-value">₹{animatedValues.emi.toLocaleString('en-IN', {maximumFractionDigits: 0})}</div>
                      </div>
                      
                      <div className="metric">
                        <div className="metric-label">Disposable Income</div>
                        <div className="metric-value">₹{animatedValues.disposable.toLocaleString('en-IN', {maximumFractionDigits: 0})}</div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="charts-section">
                    <h3>📊 Comprehensive Financial Analysis</h3>
                    <div className="charts-grid">
                      <div className="chart-container">
                        <h4>Confidence vs Risk</h4>
                        <div className="chart-wrapper">
                          <Pie data={pieData} options={{ responsive: true, maintainAspectRatio: true }} />
                        </div>
                      </div>
                      
                      <div className="chart-container">
                        <h4>Applicant Metrics Comparison</h4>
                        <div className="chart-wrapper">
                          <Bar data={barData} options={{ responsive: true, maintainAspectRatio: true }} />
                        </div>
                      </div>
                      
                      <div className="chart-container">
                        <h4>Risk Factor Analysis</h4>
                        <div className="chart-wrapper">
                          <Radar data={radarData} options={{ responsive: true, maintainAspectRatio: true }} />
                        </div>
                      </div>
                      
                      <div className="chart-container">
                        <h4>Financial Health Distribution</h4>
                        <div className="chart-wrapper">
                          <Doughnut data={doughnutData} options={{ responsive: true, maintainAspectRatio: true }} />
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="tips-section">
                    <h3>💡 Personalized Recommendations</h3>
                    <div className="tips-list">
                      {result.tips.map((tip, index) => (
                        <div key={index} className="tip-item">
                          <span className="tip-icon">
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
                          </span>
                          <span className="tip-text">{tip.replace(/^[⚠️📈📊✅💰💡🏦✨📉🎉🔄📚]\s*/, '')}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </section>
          )}
          
          {activeTab === 'analytics' && (
            <section className="analytics-section">
              <h2>📈 Detailed Financial Analytics</h2>
              <p className="section-description">
                Comprehensive analysis of your financial profile with detailed metrics and trends.
              </p>
              
              {result ? (
                <div className="analytics-content">
                  <div className="analytics-grid">
                    <div className="analytics-card">
                      <h3>Financial Ratios</h3>
                      <div className="ratio-grid">
                        <div className="ratio-item">
                          <span className="ratio-label">Income to Loan Ratio</span>
                          <span className="ratio-value">
                            {(parseFloat(formData.loan_amount) / parseFloat(formData.income)).toFixed(2)}
                          </span>
                          <p className="ratio-description">Lower is better for approval</p>
                        </div>
                        
                        <div className="ratio-item">
                          <span className="ratio-label">Savings Rate</span>
                          <span className="ratio-value">
                            {((result.disposable_income / (parseFloat(formData.income) / 12)) * 100).toFixed(1)}%
                          </span>
                          <p className="ratio-description">Higher indicates financial health</p>
                        </div>
                        
                        <div className="ratio-item">
                          <span className="ratio-label">EMI to Income Ratio</span>
                          <span className="ratio-value">
                            {((result.monthly_emi / (parseFloat(formData.income) / 12)) * 100).toFixed(1)}%
                          </span>
                          <p className="ratio-description">Should be under 40%</p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="analytics-card">
                      <h3>Risk Assessment</h3>
                      <div className="risk-breakdown">
                        <div className="risk-item">
                          <span className="risk-label">Credit Risk</span>
                          <div className="risk-meter">
                            <div 
                              className="risk-fill" 
                              style={{width: `${Math.min(100, (parseFloat(formData.credit_score) / 850) * 100)}%`}}
                            ></div>
                          </div>
                          <span className="risk-value">{Math.min(100, (parseFloat(formData.credit_score) / 850) * 100).toFixed(1)}%</span>
                        </div>
                        
                        <div className="risk-item">
                          <span className="risk-label">Income Stability</span>
                          <div className="risk-meter">
                            <div 
                              className="risk-fill" 
                              style={{width: `${Math.min(100, (parseFloat(formData.income) / 1000000) * 100)}%`}}
                            ></div>
                          </div>
                          <span className="risk-value">{Math.min(100, (parseFloat(formData.income) / 1000000) * 100).toFixed(1)}%</span>
                        </div>
                        
                        <div className="risk-item">
                          <span className="risk-label">Employment Risk</span>
                          <div className="risk-meter">
                            <div 
                              className="risk-fill" 
                              style={{width: `${Math.min(100, (parseFloat(formData.employment_years) / 20) * 100)}%`}}
                            ></div>
                          </div>
                          <span className="risk-value">{Math.min(100, (parseFloat(formData.employment_years) / 20) * 100).toFixed(1)}%</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="detailed-charts">
                    <div className="chart-container large">
                      <h3>Comprehensive Risk Profile</h3>
                      <div className="chart-wrapper large">
                        <Radar data={radarData} options={{ responsive: true, maintainAspectRatio: true }} />
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="empty-state">
                  <p>📊 Make a prediction first to view detailed analytics.</p>
                </div>
              )}
            </section>
          )}
          
          {activeTab === 'recommendations' && (
            <section className="recommendations-section">
              <h2>📘 Actionable Recommendations</h2>
              <p className="section-description">
                Personalized, detailed recommendations to improve your loan eligibility and financial health.
              </p>
              
              {detailedRecommendations.length > 0 ? (
                <div className="recommendations-content">
                  <div className="recommendations-list">
                    {detailedRecommendations.map((rec, index) => (
                      <div key={index} className={`recommendation-card priority-${rec.priority}`}>
                        <div className="rec-header">
                          <h3>{rec.category}</h3>
                          <span className={`priority-badge priority-${rec.priority}`}>
                            {rec.priority === 'high' ? '🔴 High Priority' : 
                             rec.priority === 'medium' ? '🟡 Medium Priority' : 
                             '🟢 Low Priority'}
                          </span>
                        </div>
                        
                        <div className="rec-content">
                          <p className="rec-description">{rec.recommendation}</p>
                          <div className="rec-impact">
                            <strong>Potential Impact:</strong> {rec.impact}
                          </div>
                          
                          <div className="action-steps">
                            <h4>Action Steps:</h4>
                            <ul>
                              {rec.action_steps.map((step, stepIndex) => (
                                <li key={stepIndex}>{step}</li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  <div className="action-plan">
                    <h3>📋 Your Action Plan</h3>
                    <div className="plan-steps">
                      {detailedRecommendations
                        .filter(rec => rec.priority === 'high')
                        .map((rec, index) => (
                          <div key={index} className="plan-item">
                            <span className="plan-number">{index + 1}</span>
                            <span className="plan-text">{rec.category}: {rec.action_steps[0]}</span>
                          </div>
                        ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="empty-state">
                  <p>📘 Make a prediction first to receive detailed recommendations.</p>
                </div>
              )}
            </section>
          )}
          
          {activeTab === 'history' && (
            <section className="history-section">
              <h2>📜 Prediction History</h2>
              <p className="section-description">
                Track your loan eligibility predictions over time.
              </p>
              
              {history.length > 0 ? (
                <div className="history-content">
                  <div className="history-list">
                    {history.map((entry, index) => (
                      <div key={index} className="history-item">
                        <div className="history-header">
                          <div className="history-status">
                            <span className={`status-badge ${entry.eligible ? 'approved' : 'rejected'}`}>
                              {entry.eligible ? '✅ Approved' : '❌ Rejected'}
                            </span>
                            <span className="history-date">{entry.timestamp}</span>
                          </div>
                        </div>
                        
                        <div className="history-details">
                          <div className="detail-row">
                            <span className="detail-label">Income:</span>
                            <span className="detail-value">₹{entry.formData.income?.toLocaleString('en-IN')}</span>
                          </div>
                          
                          <div className="detail-row">
                            <span className="detail-label">Loan Amount:</span>
                            <span className="detail-value">₹{entry.formData.loan_amount?.toLocaleString('en-IN')}</span>
                          </div>
                          
                          <div className="detail-row">
                            <span className="detail-label">Confidence:</span>
                            <span className="detail-value">{entry.confidence?.toFixed(1)}%</span>
                          </div>
                          
                          <div className="detail-row">
                            <span className="detail-label">Risk Level:</span>
                            <span className="detail-value">{entry.risk_category}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="empty-state">
                  <p>📜 No prediction history yet. Make your first prediction to start tracking!</p>
                </div>
              )}
            </section>
          )}
        </main>
      </div>
    </div>
  )
}

export default App