import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Layout } from "./components/Layout";
import { LoginPage } from "./pages/AuthPage";
import { TechniciansPage } from "./pages/FixerPage";
import { RegisterUserPage } from "./pages/RegisterPage";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { StaffManagementPage } from "./pages/StaffPage";
import { DashboardPage } from "./pages/DashboardPage";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public */}
        <Route path="/login" element={<LoginPage />} />

        {/* Protected Layout */}
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }
        >
          {/* / */}
          <Route index element={<DashboardPage />} />

          {/* /technicians */}
          <Route
            path="technicians"
            element={
              <ProtectedRoute allowedRoles={["admin"]}>
                <TechniciansPage />
              </ProtectedRoute>
            }
          />

          {/* staff */}
          <Route
            path="/staffs"
            element={
              <ProtectedRoute allowedRoles={["admin"]}>
                <StaffManagementPage />
              </ProtectedRoute>
            }
          />
          {/* /register - admin only */}
          <Route
            path="/register"
            element={
              <ProtectedRoute allowedRoles={["admin"]}>
                <RegisterUserPage />
              </ProtectedRoute>
            }
          />
        </Route>

        {/* fallback */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
