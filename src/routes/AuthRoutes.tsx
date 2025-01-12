import { Route } from "react-router-dom";
import { SignInForm } from "@/components/auth/SignInForm";
import { SignUpForm } from "@/components/auth/SignUpForm";
import { Navigate } from "react-router-dom";

export const AuthRoutes = () => (
  <>
    <Route path="/signup" element={<SignUpForm />} />
    <Route path="/signin" element={<SignInForm />} />
    <Route path="/" element={<Navigate to="/signin" replace />} />
  </>
);