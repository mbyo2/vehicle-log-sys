
import { Routes, Route, Navigate } from 'react-router-dom';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import SignUp from '@/pages/SignUp';
import SignIn from '@/pages/SignIn';
import Dashboard from '@/pages/Dashboard';
import { Fleet } from '@/pages/Fleet';
import { Trips } from '@/pages/Trips';

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="/signup" element={<SignUp />} />
      <Route path="/signin" element={<SignIn />} />
      
      {/* Protected routes */}
      <Route path="/dashboard" element={
        <ProtectedRoute>
          <Dashboard />
        </ProtectedRoute>
      } />
      <Route path="/fleet" element={
        <ProtectedRoute>
          <Fleet />
        </ProtectedRoute>
      } />
      <Route path="/trips" element={
        <ProtectedRoute>
          <Trips />
        </ProtectedRoute>
      } />
    </Routes>
  );
}
