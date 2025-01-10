import { Route } from "react-router-dom";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { DashboardLayout } from "@/components/layouts/DashboardLayout";
import { Companies } from "@/pages/Companies";
import { Users } from "@/pages/Users";
import { Fleet } from "@/pages/Fleet";
import { Reports } from "@/pages/Reports";
import { Settings } from "@/pages/Settings";
import { Advertisements } from "@/pages/Advertisements";

export const AdminRoutes = () => {
  return (
    <>
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
    </>
  );
};