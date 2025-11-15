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
  const [particles, setParticles] = useState<any[]>([])
  const resultRef = useRef<HTMLDivElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  // Particle system for professional background
  useEffect(() => {
    const generateParticles = () => {
      const newParticles = []
      for (let i = 0; i < 20; i++) {
        newParticles.push({
          id: i,
          x: Math.random() * 100,
          y: Math.random() * 100,
          size: Math.random() * 3 + 1,
          speed: Math.random() * 1 + 0.2,
          opacity: Math.random() * 0.3 + 0.1
        })
      }
      setParticles(newParticles)
    }
    
    generateParticles()
    
    // Animate particles
    const interval = setInterval(() => {
      setParticles(prev => prev.map(particle => ({
        ...particle,
        y: particle.y > 100 ? 0 : particle.y + particle.speed * 0.1,
        x: particle.x + Math.sin(particle.y * 0.01) * 0.1
      })))
    }, 100)
    
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
  } : {
    labels: [],
    datasets: [{
      data: [],
      backgroundColor: [],
      borderWidth: 0
    }]
  }

  return (
    <div className="App">
      <div className="container" ref={containerRef}>
        <div className="tabs">
          <button className={activeTab === 'predict' ? 'active' : ''} onClick={() => setActiveTab('predict')}>Predict</button>
          <button className={activeTab === 'history' ? 'active' : ''} onClick={() => setActiveTab('history')}>History</button>
        </div>
        <div className="content">
          {activeTab === 'predict' && (
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Age</label>
                <input type="number" name="age" value={formData.age} onChange={handleChange} required />
              </div>
              <div className="form-group">
                <label>Annual Income</label>
                <input type="number" name="income" value={formData.income} onChange={handleChange} required />
              </div>
              <div className="form-group">
                <label>Loan Amount</label>
                <input type="number" name="loan_amount" value={formData.loan_amount} onChange={handleChange} required />
              </div>
              <div className="form-group">
                <label>Credit Score</label>
                <input type="number" name="credit_score" value={formData.credit_score} onChange={handleChange} required />
              </div>
              <div className="form-group">
                <label>Employment Years</label>
                <input type="number" name="employment_years" value={formData.employment_years} onChange={handleChange} required />
              </div>
              <div className="form-group">
                <label>Debt to Income Ratio (%)</label>
                <input type="number" name="debt_to_income" value={formData.debt_to_income} onChange={handleChange} required />
              </div>
              <button type="submit" disabled={loading}>
                {loading ? 'Predicting...' : 'Predict'}
              </button>
            </form>
          )}
          {activeTab === 'history' && (
            <div className="history">
              {history.length === 0 ? (
                <p>No history available.</p>
              ) : (
                <ul>
                  {history.map((entry, index) => (
                    <li key={index}>
                      <strong>{entry.timestamp}</strong>
                      <p>Eligible: {entry.eligible ? 'Yes' : 'No'}</p>
                      <p>Risk Category: {entry.risk_category}</p>
                      <p>Confidence: {entry.confidence.toFixed(2)}%</p>
                      <p>Risk Score: {entry.risk_score.toFixed(2)}</p>
                      <p>Monthly EMI: ${entry.monthly_emi.toFixed(2)}</p>
                      <p>Disposable Income: ${entry.disposable_income.toFixed(2)}</p>
                      <p>Debt to Income: {entry.debt_to_income.toFixed(2)}%</p>
                      <p>Tips: {entry.tips.join(', ')}</p>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>
        {result && (
          <div className="result" ref={resultRef}>
            <div className="result-header">
              <h2>Prediction Result</h2>
              <button onClick={() => setResult(null)}>Clear</button>
            </div>
            <div className="result-content">
              <div className="result-chart">
                <Pie data={pieData} />
              </div>
              <div className="result-values">
                <div className="value">
                  <h3>Confidence</h3>
                  <p>{animatedValues.confidence.toFixed(2)}%</p>
                </div>
                <div className="value">
                  <h3>Risk Score</h3>
                  <p>{animatedValues.risk.toFixed(2)}</p>
                </div>
                <div className="value">
                  <h3>Monthly EMI</h3>
                  <p>${animatedValues.emi.toFixed(2)}</p>
                </div>
                <div className="value">
                  <h3>Disposable Income</h3>
                  <p>${animatedValues.disposable.toFixed(2)}</p>
                </div>
              </div>
              <div className="result-tips">
                <h3>Tips</h3>
                <ul>
                  {result.tips.map((tip, index) => (
                    <li key={index}>{tip}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}
        {showConfetti && (
          <div className="confetti">
            <div className="confetti-particle"></div>
            <div className="confetti-particle"></div>
            <div className="confetti-particle"></div>
            <div className="confetti-particle"></div>
            <div className="confetti-particle"></div>
            <div className="confetti-particle"></div>
            <div className="confetti-particle"></div>
            <div className="confetti-particle"></div>
            <div className="confetti-particle"></div>
            <div className="confetti-particle"></div>
          </div>
        )}
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
      </div>
    </div>
  )
}

export default App
