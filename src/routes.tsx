import { Routes, Route, Navigate } from "react-router-dom";
import { ProtectedRoute } from "./components/auth/ProtectedRoute";
import { SignInForm } from "./components/auth/SignInForm";
import { SignUpForm } from "./components/auth/SignUpForm";
import { DashboardLayout } from "./components/layouts/DashboardLayout";
import Dashboard from "./pages/Dashboard";
import { Companies } from "./pages/Companies";
import { Drivers } from "./pages/Drivers";
import { Fleet } from "./pages/Fleet";
import { Maintenance } from "./pages/Maintenance";
import { Reports } from "./pages/Reports";
import Settings from "./pages/Settings";
import { TripApprovals } from "./pages/TripApprovals";
import { Trips } from "./pages/Trips";
import { Users } from "./pages/Users";
import { VehicleStatus } from "./pages/VehicleStatus";
import { ServiceBookings } from "./pages/ServiceBookings";
import { Advertisements } from "./pages/Advertisements";
import { DocumentCategories } from "./components/documents/DocumentCategories";
import { DocumentUpload } from "./components/documents/DocumentUpload";

export const AppRoutes = () => (
  <Routes>
    {/* Public Routes */}
    <Route path="/signup" element={<SignUpForm />} />
    <Route path="/signin" element={<SignInForm />} />
    
    {/* Root route redirects to signin */}
    <Route
      path="/"
      element={
        <Navigate to="/signin" replace />
      }
    />

    {/* Protected Routes */}
    {/* Document Management Routes */}
    <Route
      path="/documents"
      element={
        <ProtectedRoute>
          <DashboardLayout>
            <DocumentUpload />
          </DashboardLayout>
        </ProtectedRoute>
      }
    />
    <Route
      path="/document-categories"
      element={
        <ProtectedRoute allowedRoles={['company_admin']}>
          <DashboardLayout>
            <DocumentCategories />
          </DashboardLayout>
        </ProtectedRoute>
      }
    />
    
    {/* Super Admin Routes */}
    <Route
      path="/companies"
      element={
        <ProtectedRoute allowedRoles={['super_admin']}>
          <DashboardLayout>
            <Companies />
          </DashboardLayout>
        </ProtectedRoute>
      }
    />

    <Route
      path="/advertisements"
      element={
        <ProtectedRoute allowedRoles={['super_admin', 'company_admin']}>
          <DashboardLayout>
            <Advertisements />
          </DashboardLayout>
        </ProtectedRoute>
      }
    />
    
    {/* Dashboard Routes */}
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
    
    {/* Service Bookings Route */}
    <Route
      path="/service-bookings"
      element={
        <ProtectedRoute>
          <DashboardLayout>
            <ServiceBookings />
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
        <ProtectedRoute allowedRoles={['supervisor', 'company_admin']}>
          <DashboardLayout>
            <Drivers />
          </DashboardLayout>
        </ProtectedRoute>
      }
    />
    <Route
      path="/trip-approvals"
      element={
        <ProtectedRoute allowedRoles={['supervisor', 'company_admin']}>
          <DashboardLayout>
            <TripApprovals />
          </DashboardLayout>
        </ProtectedRoute>
      }
    />
    <Route
      path="/maintenance"
      element={
        <ProtectedRoute allowedRoles={['supervisor', 'company_admin']}>
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
        <ProtectedRoute allowedRoles={['company_admin']}>
          <DashboardLayout>
            <Users />
          </DashboardLayout>
        </ProtectedRoute>
      }
    />
    <Route
      path="/fleet"
      element={
        <ProtectedRoute allowedRoles={['company_admin']}>
          <DashboardLayout>
            <Fleet />
          </DashboardLayout>
        </ProtectedRoute>
      }
    />
    <Route
      path="/reports"
      element={
        <ProtectedRoute allowedRoles={['company_admin']}>
          <DashboardLayout>
            <Reports />
          </DashboardLayout>
        </ProtectedRoute>
      }
    />
    <Route
      path="/settings"
      element={
        <ProtectedRoute allowedRoles={['company_admin']}>
          <DashboardLayout>
            <Settings />
          </DashboardLayout>
        </ProtectedRoute>
      }
    />
  </Routes>
);
