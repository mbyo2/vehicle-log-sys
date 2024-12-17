import { Routes, Route } from "react-router-dom";
import { ProtectedRoute } from "./components/auth/ProtectedRoute";
import { SignInForm } from "./components/auth/SignInForm";
import { SignUpForm } from "./components/auth/SignUpForm";
import Index from "./pages/Index";
import Profile from "./pages/Profile";

export const AppRoutes = () => (
  <Routes>
    <Route path="/signin" element={<SignInForm />} />
    <Route path="/signup" element={<SignUpForm />} />
    <Route
      path="/"
      element={
        <ProtectedRoute>
          <Index />
        </ProtectedRoute>
      }
    />
    <Route
      path="/profile"
      element={
        <ProtectedRoute>
          <Profile />
        </ProtectedRoute>
      }
    />
    {/* Example of a role-protected route */}
    <Route
      path="/admin"
      element={
        <ProtectedRoute allowedRoles={['admin']}>
          <div>Admin Dashboard</div>
        </ProtectedRoute>
      }
    />
    <Route
      path="/supervisor"
      element={
        <ProtectedRoute allowedRoles={['supervisor']}>
          <div>Supervisor Dashboard</div>
        </ProtectedRoute>
      }
    />
  </Routes>
);