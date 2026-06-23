import { Routes, Route, Navigate } from 'react-router-dom'
import { ToastProvider } from './components/Toast.jsx'
import Layout from './components/Layout.jsx'
import HomePage from './pages/HomePage.jsx'
import DashboardPage from './pages/DashboardPage.jsx'
import AnalyticsPage from './pages/AnalyticsPage.jsx'
import { ownerToken } from './api/client.js'

// Guard: if no owner token in localStorage, redirect to home
function ProtectedRoute({ children }) {
  if (!ownerToken) return <Navigate to="/" replace />
  return children
}

export default function App() {
  return (
    <ToastProvider>
      <Layout>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/dashboard" element={
            <ProtectedRoute>
              <DashboardPage />
            </ProtectedRoute>
          } />
          <Route path="/analytics/:code" element={
            <ProtectedRoute>
              <AnalyticsPage />
            </ProtectedRoute>
          } />
        </Routes>
      </Layout>
    </ToastProvider>
  )
}
