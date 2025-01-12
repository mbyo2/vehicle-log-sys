import { Route } from "react-router-dom";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { DashboardLayout } from "@/components/layouts/DashboardLayout";
import Dashboard from "@/pages/Dashboard";
import { ServiceBookings } from "@/pages/ServiceBookings";
import { Trips } from "@/pages/Trips";
import { VehicleStatus } from "@/pages/VehicleStatus";
import { Drivers } from "@/pages/Drivers";
import { TripApprovals } from "@/pages/TripApprovals";
import { Maintenance } from "@/pages/Maintenance";

export const OperationalRoutes = () => (
  <>
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
  </>
);