import { Routes, Route } from "react-router-dom";
import { ProtectedRoute } from "./components/auth/ProtectedRoute";
import { SignInForm } from "./components/auth/SignInForm";
import { SignUpForm } from "./components/auth/SignUpForm";
import { DashboardLayout } from "./components/layouts/DashboardLayout";
import Dashboard from "./pages/Dashboard";
import { Drivers } from "./pages/Drivers";
import { Fleet } from "./pages/Fleet";
import { Maintenance } from "./pages/Maintenance";
import { Reports } from "./pages/Reports";
import Settings from "./pages/Settings";
import { TripApprovals } from "./pages/TripApprovals";
import { Trips } from "./pages/Trips";
import { Users } from "./pages/Users";
import { VehicleStatus } from "./pages/VehicleStatus";

export const AppRoutes = () => (
  <Routes>
    <Route path="/signin" element={<SignInForm />} />
    <Route path="/signup" element={<SignUpForm />} />
    
    {/* Dashboard Routes */}
    <Route
      path="/"
      element={
        <ProtectedRoute>
          <DashboardLayout>
            <Dashboard />
          </DashboardLayout>
        </ProtectedRoute>
      }
    />
    <Route
      path="/dashboard"
      element={
        <ProtectedRoute>
          <DashboardLayout>
            <Dashboard />
          </DashboardLayout>
        </ProtectedRoute>
      }
    />
    
    {/* Driver Routes */}
    <Route
      path="/trips"
      element={
        <ProtectedRoute>
          <DashboardLayout>
            <Trips />
          </DashboardLayout>
        </ProtectedRoute>
      }
    />
    <Route
      path="/vehicle-status"
      element={
        <ProtectedRoute>
          <DashboardLayout>
            <VehicleStatus />
          </DashboardLayout>
        </ProtectedRoute>
      }
    />
    
    {/* Supervisor Routes */}
    <Route
      path="/drivers"
      element={
        <ProtectedRoute allowedRoles={['supervisor', 'admin']}>
          <DashboardLayout>
            <Drivers />
          </DashboardLayout>
        </ProtectedRoute>
      }
    />
    <Route
      path="/trip-approvals"
      element={
        <ProtectedRoute allowedRoles={['supervisor', 'admin']}>
          <DashboardLayout>
            <TripApprovals />
          </DashboardLayout>
        </ProtectedRoute>
      }
    />
    <Route
      path="/maintenance"
      element={
        <ProtectedRoute allowedRoles={['supervisor', 'admin']}>
          <DashboardLayout>
            <Maintenance />
          </DashboardLayout>
        </ProtectedRoute>
      }
    />
    
    {/* Admin Routes */}
    <Route
      path="/users"
      element={
        <ProtectedRoute allowedRoles={['admin']}>
          <DashboardLayout>
            <Users />
          </DashboardLayout>
        </ProtectedRoute>
      }
    />
    <Route
      path="/fleet"
      element={
        <ProtectedRoute allowedRoles={['admin']}>
          <DashboardLayout>
            <Fleet />
          </DashboardLayout>
        </ProtectedRoute>
      }
    />
    <Route
      path="/reports"
      element={
        <ProtectedRoute allowedRoles={['admin']}>
          <DashboardLayout>
            <Reports />
          </DashboardLayout>
        </ProtectedRoute>
      }
    />
    <Route
      path="/settings"
      element={
        <ProtectedRoute allowedRoles={['admin']}>
          <DashboardLayout>
            <Settings />
          </DashboardLayout>
        </ProtectedRoute>
      }
    />
  </Routes>
);