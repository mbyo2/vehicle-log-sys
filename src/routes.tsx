import { Routes, Route } from "react-router-dom";
import { ProtectedRoute } from "./components/auth/ProtectedRoute";
import { SignInForm } from "./components/auth/SignInForm";
import { SignUpForm } from "./components/auth/SignUpForm";
import Index from "./pages/Index";

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
  </Routes>
);