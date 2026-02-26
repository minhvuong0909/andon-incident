import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { LoginPage } from "./pages/AuthPage";
import { TechniciansPage } from "./pages/FixerPage";
import { RegisterUserPage } from "./pages/RegisterPage";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { StaffManagementPage } from "./pages/StaffPage";
import { DashboardPage } from "./pages/DashboardPage";
import { Layout } from "./components/Layout";

// export const API_URL = "https://andon-incident.onrender.com"; // production
export const API_URL = "http://localhost:4000"; // local
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
            path="/technicians"
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
