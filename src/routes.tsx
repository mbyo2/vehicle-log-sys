import { Routes, Route } from "react-router-dom";
import { AuthRoutes } from "./routes/AuthRoutes";
import { DocumentRoutes } from "./routes/DocumentRoutes";
import { AdminRoutes } from "./routes/AdminRoutes";
import { OperationalRoutes } from "./routes/OperationalRoutes";

export const AppRoutes = () => (
  <Routes>
    <Route>
      <Route>
        <AuthRoutes />
      </Route>
      <Route>
        <DocumentRoutes />
      </Route>
      <Route>
        <AdminRoutes />
      </Route>
      <Route>
        <OperationalRoutes />
      </Route>
    </Route>
  </Routes>
);