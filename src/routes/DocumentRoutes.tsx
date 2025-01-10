import { Route } from "react-router-dom";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { DashboardLayout } from "@/components/layouts/DashboardLayout";
import { DocumentCategories } from "@/components/documents/DocumentCategories";
import { DocumentUpload } from "@/components/documents/DocumentUpload";

export const DocumentRoutes = () => {
  return (
    <>
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
    </>
  );
};