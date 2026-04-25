import { Routes, Route, Navigate } from "react-router-dom";
import { AppShell } from "./components/layout/AppShell";
import { Dashboard } from "./pages/Dashboard";
import { EstateList } from "./pages/EstateList";
import { EstateDetail } from "./pages/EstateDetail";

export default function App() {
  return (
    <AppShell>
      <Routes>
        <Route path="/"               element={<Dashboard />} />
        <Route path="/estates"        element={<EstateList />} />
        <Route path="/estates/:id"    element={<EstateDetail />} />
        <Route path="*"               element={<Navigate to="/" replace />} />
      </Routes>
    </AppShell>
  );
}
