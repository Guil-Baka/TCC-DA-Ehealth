import { Navigate, Outlet, Route, Routes } from "react-router-dom";
import { AppShell } from "./components/layout/AppShell";
import { ThemeToggle } from "./components/ui/ThemeToggle";
import { useAuth } from "./context/AuthContext";
import { AgendaPage } from "./pages/AgendaPage";
import { AuthPage } from "./pages/AuthPage";
import { DashboardPage } from "./pages/DashboardPage";
import { HomePage } from "./pages/HomePage";
import { LandingPage } from "./pages/LandingPage";
import { PacientesPage } from "./pages/PacientesPage";
import { RegistrosPage } from "./pages/RegistrosPage";

export default function App() {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <p className="p-8 text-center text-slate-600">
        Carregando autenticação...
      </p>
    );
  }

  return (
    <>
      <ThemeToggle />
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route
          path="/auth"
          element={
            isAuthenticated ? (
              <Navigate to="/dashboard" replace />
            ) : (
              <AuthPage />
            )
          }
        />
        <Route element={<ProtectedLayout />}>
          <Route path="/inicio" element={<HomePage />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/pacientes" element={<PacientesPage />} />
          <Route path="/agenda" element={<AgendaPage />} />
          <Route path="/registros" element={<RegistrosPage />} />
        </Route>
        <Route
          path="*"
          element={
            <Navigate to={isAuthenticated ? "/dashboard" : "/"} replace />
          }
        />
      </Routes>
    </>
  );
}

function ProtectedLayout() {
  const { isAuthenticated } = useAuth();
  if (!isAuthenticated) {
    return <Navigate to="/auth" replace />;
  }

  return (
    <AppShell>
      <Outlet />
    </AppShell>
  );
}
