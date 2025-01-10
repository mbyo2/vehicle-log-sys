import { Routes } from "react-router-dom";
import { AuthRoutes } from "./routes/AuthRoutes";
import { DocumentRoutes } from "./routes/DocumentRoutes";
import { AdminRoutes } from "./routes/AdminRoutes";
import { OperationalRoutes } from "./routes/OperationalRoutes";

export const AppRoutes = () => (
  <Routes>
    <AuthRoutes />
    <DocumentRoutes />
    <AdminRoutes />
    <OperationalRoutes />
  </Routes>
);