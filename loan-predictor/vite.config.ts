import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  base: '/ML-BASED-LOAN-ELIGIBILITY-AND-RISK-PREDICTOR/', // Replace with your repo name
})
