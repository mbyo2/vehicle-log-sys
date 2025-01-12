import { Routes, Route } from "react-router-dom";
import { AuthRoutes } from "./routes/AuthRoutes";
import { DocumentRoutes } from "./routes/DocumentRoutes";
import { AdminRoutes } from "./routes/AdminRoutes";
import { OperationalRoutes } from "./routes/OperationalRoutes";

export const AppRoutes = () => (
  <Routes>
    {/* Use fragments to group routes from different modules */}
    <>
      <AuthRoutes />
      <DocumentRoutes />
      <AdminRoutes />
      <OperationalRoutes />
    </>
  </Routes>
);