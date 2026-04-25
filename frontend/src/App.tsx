import { Routes, Route, Navigate } from "react-router-dom";
import { AppShell } from "./components/layout/AppShell";
import { Dashboard } from "./pages/Dashboard";
import { EstateList } from "./pages/EstateList";
import { EstateDetail } from "./pages/EstateDetail";
import { BeneficiariesPage } from "./pages/BeneficiariesPage";
import { LegalQueuePage } from "./pages/LegalQueuePage";
import { TransfersPage } from "./pages/TransfersPage";
import { AuditLogPage } from "./pages/AuditLogPage";

export default function App() {
  return (
    <AppShell>
      <Routes>
        <Route path="/"               element={<Dashboard />} />
        <Route path="/estates"        element={<EstateList />} />
        <Route path="/estates/:id"    element={<EstateDetail />} />
        <Route path="/beneficiaries"  element={<BeneficiariesPage />} />
        <Route path="/legal"          element={<LegalQueuePage />} />
        <Route path="/transfers"      element={<TransfersPage />} />
        <Route path="/audit"          element={<AuditLogPage />} />
        <Route path="*"               element={<Navigate to="/" replace />} />
      </Routes>
    </AppShell>
  );
}
