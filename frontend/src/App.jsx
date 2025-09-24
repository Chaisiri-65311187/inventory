import { Routes, Route, Navigate } from "react-router-dom";
import LoginPage from "./components/LoginPage.jsx";
import HomePage from "./components/HomePage.jsx";

const PrivateRoute = ({ children }) => {
  const raw = localStorage.getItem("auth_user");
  return raw ? children : <Navigate to="/login" replace />;
};

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="/login" element={<LoginPage />} />
      <Route
        path="/home"
        element={
          <PrivateRoute>
            <HomePage />
          </PrivateRoute>
        }
      />
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}
