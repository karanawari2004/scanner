import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import Login from "./pages/Login";
import ScanInfo from "./pages/Scaninfo";

const AUTH_KEY = "rizzscan_authenticated";

const isAuthenticated = () =>
  localStorage.getItem(AUTH_KEY) === "true" ||
  sessionStorage.getItem(AUTH_KEY) === "true";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/"
          element={
            isAuthenticated() ? <Navigate to="/scanInfo" replace /> : <Login />
          }
        />
        <Route
          path="/scanInfo"
          element={
            isAuthenticated() ? <ScanInfo /> : <Navigate to="/" replace />
          }
        />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;