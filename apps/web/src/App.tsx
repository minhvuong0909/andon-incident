import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Layout } from "./components/Layout";
import { DashboardPage } from "./pages/DashboardPage";
import { TechniciansPage } from "./pages/FixerPage";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<DashboardPage />} />
          <Route path="technicians" element={<TechniciansPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
