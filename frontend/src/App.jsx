import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider, useTheme } from './context/ThemeContext';
import LoginPage from './pages/auth/LoginPage';
import DashboardPage from './pages/DashboardPage';
import StudentsPage from './pages/StudentsPage';
import AttendanceByDatePage from './pages/AttendanceByDatePage';
import QRScannerPage from './pages/QRScannerPage';
import ReportsPage from './pages/ReportsPage';
import SettingsPage from './pages/SettingsPage';
import StudentRegistrationPage from './pages/StudentRegistrationPage';
import ProfilePage from './pages/ProfilePage';
import MainLayout from './layouts/MainLayout';
import NotFound from './pages/errors/NotFound';
import RegisterPage from './pages/auth/RegisterPage';
import ForgotPasswordPage from './pages/auth/ForgotPasswordPage';
import ResetPasswordPage from './pages/auth/ResetPasswordPage';
import AttendanceHistoryPage from './pages/AttendanceHistoryPage';
import WhatsAppManagementPage from './pages/WhatsAppManagementPage';

const ProtectedRoute = ({ children, adminOnly = false }) => {
  const { isAuthenticated, isAdmin, loading } = useAuth();
  const location = useLocation();

  // Add early return for loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }

  if (adminOnly && !isAdmin) {
    return <Navigate to="/" replace />;
  }

  return children;
};

const ThemedToaster = () => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  
  return (
    <Toaster
      position="top-right"
      reverseOrder={false}
      gutter={8}
      containerClassName="z-50"
      containerStyle={{
        top: 20,
        right: 20,
      }}
      toastOptions={{
        duration: 5000,
        style: {
          background: isDark ? '#1e293b' : '#ffffff',
          color: isDark ? '#f1f5f9' : '#334155',
          border: `1px solid ${isDark ? '#334155' : '#e2e8f0'}`,
          padding: '12px 16px',
          boxShadow: isDark ? '0 4px 6px rgba(0, 0, 0, 0.3)' : '0 4px 6px rgba(0, 0, 0, 0.1)',
          fontSize: '14px',
          maxWidth: '350px',
        },
        success: {
          iconTheme: {
            primary: isDark ? '#4ade80' : '#10b981',
            secondary: isDark ? '#0f172a' : '#ffffff',
          },
        },
        error: {
          iconTheme: {
            primary: isDark ? '#f87171' : '#ef4444',
            secondary: isDark ? '#0f172a' : '#ffffff',
          },
        },
        loading: {
          iconTheme: {
            primary: isDark ? '#60a5fa' : '#3b82f6',
            secondary: isDark ? '#0f172a' : '#ffffff',
          },
        },
      }}
    />
  );
};

function App() {
  return (
    <Router>
      <AuthProvider>
        <ThemeProvider>
          <div className="min-h-screen bg-gray-50 dark:bg-slate-900 transition-colors duration-200">
            <ThemedToaster />
            <Routes>
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              <Route path="/forgot-password" element={<ForgotPasswordPage />} />
              <Route path="/reset-password/:token" element={<ResetPasswordPage />} />
              
              <Route path="/" element={
                <ProtectedRoute adminOnly={true}>
                  <MainLayout />
                </ProtectedRoute>
              }>
                <Route index element={<DashboardPage />} />
                <Route path="students" element={<StudentsPage />} />
                <Route path="students/register" element={<StudentRegistrationPage />} />
                <Route path="attendance" element={<AttendanceByDatePage />} />
                <Route path="attendance/history/:studentId" element={<AttendanceHistoryPage />} />
                <Route path="scanner" element={<QRScannerPage />} />
                <Route path="reports" element={<ReportsPage />} />
                <Route path="settings" element={<SettingsPage />} />
                <Route path="profile" element={<ProfilePage />} />
                <Route
                  path="/whatsapp"
                  element={
                    <ProtectedRoute adminOnly>
                      <WhatsAppManagementPage />
                    </ProtectedRoute>
                  }
                />
                <Route path="*" element={<NotFound />} />
              </Route>
              
              <Route path="*" element={<NotFound />} />
            </Routes>
          </div>
        </ThemeProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;
