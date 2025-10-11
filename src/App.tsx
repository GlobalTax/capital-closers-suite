import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { lazy, Suspense } from "react";
import { AppLayout } from "./components/layout/AppLayout";
import { CommandPalette } from "@/components/shared/CommandPalette";
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { ErrorBoundary } from "@/components/shared/ErrorBoundary";
import { PageSkeleton } from "@/components/shared/LoadingStates";
import { queryClient } from "@/lib/query-client";

// Lazy load de páginas para mejorar performance inicial
const Login = lazy(() => import("./pages/auth/Login"));
const Mandatos = lazy(() => import("./pages/Mandatos"));
const MandatoDetalle = lazy(() => import("./pages/MandatoDetalle"));
const Contactos = lazy(() => import("./pages/Contactos"));
const ContactoDetalle = lazy(() => import("./pages/ContactoDetalle"));
const Empresas = lazy(() => import("./pages/Empresas"));
const EmpresaDetalle = lazy(() => import("./pages/EmpresaDetalle"));
const Tareas = lazy(() => import("./pages/Tareas"));
const Documentos = lazy(() => import("./pages/Documentos"));
const Reportes = lazy(() => import("./pages/Reportes"));
const NotFound = lazy(() => import("./pages/NotFound"));
const Perfil = lazy(() => import("./pages/Perfil"));
const MisHoras = lazy(() => import("./pages/MisHoras"));
const HorasEquipo = lazy(() => import("./pages/HorasEquipo"));
const AuditLogs = lazy(() => import("./pages/AuditLogs"));
const ImportarMandatos = lazy(() => import("./pages/ImportarMandatos"));
const ImportarDatos = lazy(() => import("./pages/ImportarDatos"));

function AppContent() {
  useKeyboardShortcuts();
  return (
    <>
      <CommandPalette />
      <Suspense fallback={<PageSkeleton />}>
        <Routes>
          {/* Public routes */}
          <Route path="/auth/login" element={<Login />} />

          {/* Protected routes */}
          <Route path="/" element={<Navigate to="/mandatos" replace />} />
          <Route path="/mandatos" element={<ProtectedRoute><AppLayout><Mandatos /></AppLayout></ProtectedRoute>} />
          <Route path="/mandatos/:id" element={<ProtectedRoute><AppLayout><MandatoDetalle /></AppLayout></ProtectedRoute>} />
          <Route path="/contactos" element={<ProtectedRoute><AppLayout><Contactos /></AppLayout></ProtectedRoute>} />
          <Route path="/contactos/:id" element={<ProtectedRoute><AppLayout><ContactoDetalle /></AppLayout></ProtectedRoute>} />
          <Route path="/empresas" element={<ProtectedRoute><AppLayout><Empresas /></AppLayout></ProtectedRoute>} />
          <Route path="/empresas/:id" element={<ProtectedRoute><AppLayout><EmpresaDetalle /></AppLayout></ProtectedRoute>} />
          <Route path="/tareas" element={<ProtectedRoute><AppLayout><Tareas /></AppLayout></ProtectedRoute>} />
          <Route path="/documentos" element={<ProtectedRoute><AppLayout><Documentos /></AppLayout></ProtectedRoute>} />
          <Route path="/reportes" element={<ProtectedRoute><AppLayout><Reportes /></AppLayout></ProtectedRoute>} />
          <Route path="/perfil" element={<ProtectedRoute><AppLayout><Perfil /></AppLayout></ProtectedRoute>} />
          <Route path="/mis-horas" element={<ProtectedRoute><AppLayout><MisHoras /></AppLayout></ProtectedRoute>} />
          <Route path="/horas-equipo" element={<ProtectedRoute requiredRole="super_admin"><AppLayout><HorasEquipo /></AppLayout></ProtectedRoute>} />
          <Route path="/audit-logs" element={<ProtectedRoute requiredRole="super_admin"><AppLayout><AuditLogs /></AppLayout></ProtectedRoute>} />
          <Route path="/importar-mandatos" element={<ProtectedRoute requiredRole="super_admin"><AppLayout><ImportarMandatos /></AppLayout></ProtectedRoute>} />
          <Route path="/importar-datos" element={<ProtectedRoute requiredRole="super_admin"><AppLayout><ImportarDatos /></AppLayout></ProtectedRoute>} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Suspense>
    </>
  );
}

const App = () => (
  <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <ReactQueryDevtools initialIsOpen={false} />
      <TooltipProvider>
        <ThemeProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter 
            future={{
              v7_startTransition: true,
              v7_relativeSplatPath: true
            }}
          >
            <AppContent />
          </BrowserRouter>
        </ThemeProvider>
      </TooltipProvider>
    </QueryClientProvider>
  </ErrorBoundary>
);

export default App;
