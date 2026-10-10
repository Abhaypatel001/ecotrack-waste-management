
import { Navigate, Route, Routes } from "react-router-dom";

import AppLayout from "../components/layout/AppLayout";
import ProtectedRoute from "../components/auth/ProtectedRoute";

import Home from "../pages/Home";
import AuthPage from "../pages/auth/AuthPage";
import Dashboard from "../pages/dashboard/Dashboard";
import UserDashboard from "../pages/user/UserDashboard";
import ReportIssue from "../pages/user/ReportIssue";
import IssueReports from "../pages/dashboard/IssueReports";
import PickupRequests from "../pages/dashboard/PickupRequests";
import AdminSection from "../pages/dashboard/AdminSection";

export default function AppRoutes() {
  return (
    <Routes>
      {/* Public pages */}
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<AuthPage />} />
      <Route path="/signup" element={<AuthPage />} />

      {/* User-only pages */}
      <Route
        path="/user/dashboard"
        element={
          <ProtectedRoute allowedRoles={["user"]}>
            <UserDashboard />
          </ProtectedRoute>
        }
      />

      <Route
        path="/user/report-issue"
        element={
          <ProtectedRoute allowedRoles={["user"]}>
            <ReportIssue />
          </ProtectedRoute>
        }
      />

      {/* Admin-only pages */}
      <Route
        path="/admin"
        element={
          <ProtectedRoute allowedRoles={["admin"]}>
            <AppLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="dashboard" replace />} />

        <Route path="dashboard" element={<Dashboard />} />
        <Route path="requests" element={<PickupRequests />} />
        <Route path="schedule" element={<AdminSection />} />
        <Route path="collectors" element={<AdminSection />} />
        <Route path="users" element={<AdminSection />} />
        <Route path="categories" element={<AdminSection />} />
        <Route path="complaints" element={<AdminSection />} />
        <Route path="issue-reports" element={<IssueReports />} />
        <Route path="reports" element={<AdminSection />} />
        <Route path="settings" element={<AdminSection />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
