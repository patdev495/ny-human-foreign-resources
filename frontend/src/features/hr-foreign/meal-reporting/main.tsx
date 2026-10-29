import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '../../../index.css'
import { MealReportingApp } from './MealReportingApp'

createRoot(document.getElementById('root')!).render(
  <StrictMode><MealReportingApp /></StrictMode>,
)
