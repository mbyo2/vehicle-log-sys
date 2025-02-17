
import { Routes, Route, Navigate } from 'react-router-dom';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import SignUp from '@/pages/SignUp';
import SignIn from '@/pages/SignIn';
import Dashboard from '@/pages/Dashboard';
import { Fleet } from '@/pages/Fleet';
import { Trips } from '@/pages/Trips';
import { Companies } from '@/pages/Companies';
import { Users } from '@/pages/Users';
import { Settings } from '@/pages/Settings';
import { TripApprovals } from '@/pages/TripApprovals';
import { VehicleStatus } from '@/pages/VehicleStatus';

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

      {/* Super Admin Routes */}
      <Route path="/companies" element={
        <ProtectedRoute allowedRoles={['super_admin']}>
          <Companies />
        </ProtectedRoute>
      } />

      {/* Company Admin Routes */}
      <Route path="/users" element={
        <ProtectedRoute allowedRoles={['company_admin']}>
          <Users />
        </ProtectedRoute>
      } />
      <Route path="/fleet" element={
        <ProtectedRoute allowedRoles={['company_admin', 'supervisor']}>
          <Fleet />
        </ProtectedRoute>
      } />
      <Route path="/settings" element={
        <ProtectedRoute allowedRoles={['company_admin']}>
          <Settings />
        </ProtectedRoute>
      } />

      {/* Supervisor Routes */}
      <Route path="/trip-approvals" element={
        <ProtectedRoute allowedRoles={['supervisor']}>
          <TripApprovals />
        </ProtectedRoute>
      } />

      {/* Driver Routes */}
      <Route path="/trips" element={
        <ProtectedRoute allowedRoles={['driver']}>
          <Trips />
        </ProtectedRoute>
      } />
      <Route path="/vehicle-status" element={
        <ProtectedRoute allowedRoles={['driver']}>
          <VehicleStatus />
        </ProtectedRoute>
      } />
    </Routes>
  );
}
