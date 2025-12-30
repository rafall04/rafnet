import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AuthProvider, ThemeProvider } from './contexts'
import { ProtectedRoute } from './components/ProtectedRoute'
import { 
  IndexPage, 
  LoginPage, 
  AdminLayout, 
  DashboardPage,
  PackagesPage, 
  VouchersPage 
} from './pages'

/**
 * Main Application Component
 * Configures routing for public and protected admin routes
 * Requirements: 2.3, 5.1
 */
function App() {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <AuthProvider>
          <Routes>
            {/* Public routes */}
            <Route path="/" element={<IndexPage />} />
            <Route path="/admin/login" element={<LoginPage />} />
            
            {/* Protected admin routes */}
            <Route 
              path="/admin" 
              element={
                <ProtectedRoute>
                  <AdminLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<DashboardPage />} />
              <Route path="packages" element={<PackagesPage />} />
              <Route path="vouchers" element={<VouchersPage />} />
            </Route>
          </Routes>
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  )
}

export default App
