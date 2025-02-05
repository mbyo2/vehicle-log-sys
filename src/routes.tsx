import { Routes, Route } from "react-router-dom";
import { SignInForm } from "@/components/auth/SignInForm";
import { SignUpForm } from "@/components/auth/SignUpForm";
import { Navigate } from "react-router-dom";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { DashboardLayout } from "@/components/layouts/DashboardLayout";
import { Companies } from "@/pages/Companies";
import { Users } from "@/pages/Users";
import { Fleet } from "@/pages/Fleet";
import { Reports } from "@/pages/Reports";
import { Settings } from "@/pages/Settings";
import { Advertisements } from "@/pages/Advertisements";
import { DocumentCategories } from "@/components/documents/DocumentCategories";
import { DocumentUpload } from "@/components/documents/DocumentUpload";
import Index from "@/pages/Index";

export const AppRoutes = () => (
  <Routes>
    {/* Public Routes */}
    <Route path="/" element={<Index />} />
    <Route path="/signup" element={<SignUpForm />} />
    <Route path="/signin" element={<SignInForm />} />

    {/* Protected Document Routes */}
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

    {/* Protected Admin Routes */}
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

    {/* Catch all route - redirect to default route based on role or signin */}
    <Route path="*" element={<Navigate to="/" replace />} />
  </Routes>
);