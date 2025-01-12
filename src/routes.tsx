import { Routes } from "react-router-dom";
import { AuthRoutes } from "./routes/AuthRoutes";
import { DocumentRoutes } from "./routes/DocumentRoutes";
import { AdminRoutes } from "./routes/AdminRoutes";
import { OperationalRoutes } from "./routes/OperationalRoutes";

export const AppRoutes = () => (
  <Routes>
    {/* Each route group component will return its own Route elements */}
    <AuthRoutes />
    <DocumentRoutes />
    <AdminRoutes />
    <OperationalRoutes />
  </Routes>
);