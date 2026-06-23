import { lazy, Suspense } from 'react'
import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { ToastProvider } from './components/Toast.jsx'
import Layout from './components/Layout.jsx'
import { ownerToken } from './api/client.js'

const HomePage = lazy(() => import('./pages/HomePage.jsx'))
const DashboardPage = lazy(() => import('./pages/DashboardPage.jsx'))
const AnalyticsPage = lazy(() => import('./pages/AnalyticsPage.jsx'))

// Guard: if no owner token in localStorage, redirect to home
function ProtectedRoute({ children }) {
  if (!ownerToken) return <Navigate to="/" replace />
  return children
}

export default function App() {
  const location = useLocation()

  return (
    <ToastProvider>
      <Layout>
        <AnimatePresence mode="wait">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.22, ease: 'easeOut' }}
          >
            <Suspense fallback={<PageFallback />}>
              <Routes location={location}>
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
            </Suspense>
          </motion.div>
        </AnimatePresence>
      </Layout>
    </ToastProvider>
  )
}

function PageFallback() {
  return (
    <div className="container" style={{ paddingTop: 72 }}>
      <div className="card skeleton" style={{ minHeight: 180 }} />
    </div>
  )
}
