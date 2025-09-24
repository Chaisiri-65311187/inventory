import { Routes, Route, Navigate } from "react-router-dom";
import HomePage from "./components/HomePage";
import LoginPage from "./components/LoginPage";
import EquipmentCreate from "./components/EquipmentCreate";
import WarrantyExpiringPage from "./components/WarrantyExpiringPage";
import EquipmentsList from "./components/EquipmentsList";
import EquipmentEdit from "./components/EquipmentEdit";


function readJSONSafe(key, fallback = null) {
  try {
    const raw = localStorage.getItem(key);
    if (!raw || raw === "undefined") return fallback;
    return JSON.parse(raw);
  } catch { return fallback; }
}

function RequireAuth({ children }) {
  const user = readJSONSafe("auth_user");
  return user ? children : <Navigate to="/login" replace />;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/" element={<RequireAuth><HomePage /></RequireAuth>} />
      <Route path="*" element={<Navigate to="/" replace />} />
      <Route path="/equipments/new" element={
        <RequireAuth><EquipmentCreate /></RequireAuth>
      } />
      <Route path="/reports/expiring" element={
        <RequireAuth><WarrantyExpiringPage /></RequireAuth>
      } />
      <Route path="/equipments" element={
        <RequireAuth><EquipmentsList /></RequireAuth>
      } />
      <Route path="/equipments/:id/edit" element={
        <RequireAuth><EquipmentEdit /></RequireAuth>
      } />
    </Routes>

  );
}