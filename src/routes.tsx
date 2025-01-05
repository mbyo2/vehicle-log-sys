import { DashboardLayout } from "@/components/layouts/DashboardLayout";
import Index from "@/pages/Index";
import Dashboard from "@/pages/Dashboard";
import { Companies } from "@/pages/Companies";
import { Fleet } from "@/pages/Fleet";
import { Drivers } from "@/pages/Drivers";
import { Trips } from "@/pages/Trips";
import { TripApprovals } from "@/pages/TripApprovals";
import { Reports } from "@/pages/Reports";
import { Maintenance } from "@/pages/Maintenance";
import { VehicleStatus } from "@/pages/VehicleStatus";
import Settings from "@/pages/Settings";
import Profile from "@/pages/Profile";
import { Users } from "@/pages/Users";
import { Compliance } from "@/pages/Compliance";
import { Routes, Route } from "react-router-dom";

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<DashboardLayout><Index /></DashboardLayout>} />
      <Route path="/dashboard" element={<DashboardLayout><Dashboard /></DashboardLayout>} />
      <Route path="/companies" element={<DashboardLayout><Companies /></DashboardLayout>} />
      <Route path="/fleet" element={<DashboardLayout><Fleet /></DashboardLayout>} />
      <Route path="/drivers" element={<DashboardLayout><Drivers /></DashboardLayout>} />
      <Route path="/trips" element={<DashboardLayout><Trips /></DashboardLayout>} />
      <Route path="/trip-approvals" element={<DashboardLayout><TripApprovals /></DashboardLayout>} />
      <Route path="/reports" element={<DashboardLayout><Reports /></DashboardLayout>} />
      <Route path="/maintenance" element={<DashboardLayout><Maintenance /></DashboardLayout>} />
      <Route path="/vehicle-status" element={<DashboardLayout><VehicleStatus /></DashboardLayout>} />
      <Route path="/settings" element={<DashboardLayout><Settings /></DashboardLayout>} />
      <Route path="/profile" element={<DashboardLayout><Profile /></DashboardLayout>} />
      <Route path="/users" element={<DashboardLayout><Users /></DashboardLayout>} />
      <Route path="/compliance" element={<DashboardLayout><Compliance /></DashboardLayout>} />
    </Routes>
  );
}