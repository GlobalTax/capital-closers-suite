import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { lazy, Suspense } from "react";
import { AppLayout } from "./components/layout/AppLayout";
import { CommandPalette } from "@/components/shared/CommandPalette";
import { AITaskDialog } from "@/components/shared/AITaskDialog";
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { ErrorBoundary } from "@/components/shared/ErrorBoundary";
import { PageSkeleton } from "@/components/shared/LoadingStates";
import { queryClient } from "@/lib/query-client";
// Lazy load de páginas para mejorar performance inicial
const Login = lazy(() => import("./pages/auth/Login"));
const AcceptInvitation = lazy(() => import("./pages/auth/AcceptInvitation"));
const Mandatos = lazy(() => import("./pages/Mandatos"));
const Servicios = lazy(() => import("./pages/Servicios"));
const MandatoDetalle = lazy(() => import("./pages/MandatoDetalle"));
const Contactos = lazy(() => import("./pages/Contactos"));
const ContactoDetalle = lazy(() => import("./pages/ContactoDetalle"));
const Empresas = lazy(() => import("./pages/Empresas"));
const EmpresaDetalle = lazy(() => import("./pages/EmpresaDetalle"));
const Tareas = lazy(() => import("./pages/Tareas"));
const Documentos = lazy(() => import("./pages/Documentos"));
const Reportes = lazy(() => import("./pages/Reportes"));
const Calendario = lazy(() => import("./pages/Calendario"));
const NotFound = lazy(() => import("./pages/NotFound"));
const Perfil = lazy(() => import("./pages/Perfil"));
const MisHoras = lazy(() => import("./pages/MisHoras"));
const HorasEquipo = lazy(() => import("./pages/HorasEquipo"));
const AuditLogs = lazy(() => import("./pages/AuditLogs"));
const ImportarMandatos = lazy(() => import("./pages/ImportarMandatos"));
const ImportarDatos = lazy(() => import("./pages/ImportarDatos"));
const Usuarios = lazy(() => import("./pages/Usuarios"));
const DashboardTV = lazy(() => import("./pages/DashboardTV"));
const GestionLeads = lazy(() => import("./pages/GestionLeads"));
const ConfigurarDashboardTV = lazy(() => import("./pages/ConfigurarDashboardTV"));
const SyncValuations = lazy(() => import("./pages/SyncValuations"));
const SyncOperations = lazy(() => import("./pages/SyncOperations"));
const ConfiguracionTareasTiempo = lazy(() => import("./pages/ConfiguracionTareasTiempo"));
const BrevoIntegration = lazy(() => import("./pages/BrevoIntegration"));
const SyncContactsCapittal = lazy(() => import("./pages/SyncContactsCapittal"));
const GestorDocumentos = lazy(() => import("./pages/GestorDocumentos"));
const SearchFunds = lazy(() => import("./pages/SearchFunds"));
const SearchFundDetalle = lazy(() => import("./pages/SearchFundDetalle"));
const Presentaciones = lazy(() => import("./pages/Presentaciones"));
const PresentacionEditor = lazy(() => import("./pages/PresentacionEditor"));
const PresenterMode = lazy(() => import("./pages/PresenterMode"));
const PublicViewer = lazy(() => import("./pages/PublicViewer"));
const TeamWorkload = lazy(() => import("./pages/TeamWorkload"));
const Outbound = lazy(() => import("./pages/Outbound"));
const OutboundCampaignDetail = lazy(() => import("./pages/OutboundCampaignDetail"));
const SyncControl = lazy(() => import("./pages/admin/SyncControl"));
const EmpresasMonitor = lazy(() => import("./pages/admin/EmpresasMonitor"));
const SyncCenter = lazy(() => import("./pages/SyncCenter"));
const Index = lazy(() => import("./pages/Index"));
const TaskAIQA = lazy(() => import("./pages/admin/TaskAIQA"));
const PlantillasEmail = lazy(() => import("./pages/PlantillasEmail"));
const EmailQueueMonitor = lazy(() => import("./pages/EmailQueueMonitor"));

function AppContent() {
  useKeyboardShortcuts();
  return (
    <>
      <CommandPalette />
      <AITaskDialog />
      <Suspense fallback={<PageSkeleton />}>
        <Routes>
          {/* Public routes */}
          <Route path="/auth/login" element={<Login />} />
          <Route path="/auth/accept-invitation" element={<AcceptInvitation />} />

          {/* Protected routes */}
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<ProtectedRoute><AppLayout><Index /></AppLayout></ProtectedRoute>} />
          <Route path="/mandatos" element={<ProtectedRoute><AppLayout><Mandatos /></AppLayout></ProtectedRoute>} />
          <Route path="/mandatos/:id" element={<ProtectedRoute><AppLayout><MandatoDetalle /></AppLayout></ProtectedRoute>} />
          <Route path="/servicios" element={<ProtectedRoute><AppLayout><Servicios /></AppLayout></ProtectedRoute>} />
          <Route path="/search-funds" element={<ProtectedRoute><SearchFunds /></ProtectedRoute>} />
          <Route path="/search-funds/:id" element={<ProtectedRoute><SearchFundDetalle /></ProtectedRoute>} />
          <Route path="/contactos" element={<ProtectedRoute><AppLayout><Contactos /></AppLayout></ProtectedRoute>} />
          <Route path="/contactos/:id" element={<ProtectedRoute><AppLayout><ContactoDetalle /></AppLayout></ProtectedRoute>} />
          <Route path="/empresas" element={<ProtectedRoute><AppLayout><Empresas /></AppLayout></ProtectedRoute>} />
          <Route path="/empresas/:id" element={<ProtectedRoute><AppLayout><EmpresaDetalle /></AppLayout></ProtectedRoute>} />
          <Route path="/tareas" element={<ProtectedRoute><AppLayout><Tareas /></AppLayout></ProtectedRoute>} />
          <Route path="/documentos" element={<ProtectedRoute><AppLayout><Documentos /></AppLayout></ProtectedRoute>} />
          <Route path="/gestor-documentos" element={<ProtectedRoute><AppLayout><GestorDocumentos /></AppLayout></ProtectedRoute>} />
          <Route path="/reportes" element={<ProtectedRoute><AppLayout><Reportes /></AppLayout></ProtectedRoute>} />
          <Route path="/calendario" element={<ProtectedRoute><AppLayout><Calendario /></AppLayout></ProtectedRoute>} />
          <Route path="/perfil" element={<ProtectedRoute><AppLayout><Perfil /></AppLayout></ProtectedRoute>} />
          <Route path="/mis-horas" element={<ProtectedRoute><AppLayout><MisHoras /></AppLayout></ProtectedRoute>} />
          <Route path="/horas-equipo" element={<ProtectedRoute requiredRole="super_admin"><AppLayout><HorasEquipo /></AppLayout></ProtectedRoute>} />
          <Route path="/audit-logs" element={<ProtectedRoute requiredRole="super_admin"><AppLayout><AuditLogs /></AppLayout></ProtectedRoute>} />
          <Route path="/email-queue" element={<ProtectedRoute requiredRole="super_admin"><AppLayout><EmailQueueMonitor /></AppLayout></ProtectedRoute>} />
          <Route path="/usuarios" element={<ProtectedRoute requiredRole="super_admin"><AppLayout><Usuarios /></AppLayout></ProtectedRoute>} />
          <Route path="/importar-mandatos" element={<ProtectedRoute requiredRole="super_admin"><AppLayout><ImportarMandatos /></AppLayout></ProtectedRoute>} />
          <Route path="/importar-datos" element={<ProtectedRoute requiredRole="super_admin"><AppLayout><ImportarDatos /></AppLayout></ProtectedRoute>} />
            <Route path="/dashboard-tv" element={<ProtectedRoute><DashboardTV /></ProtectedRoute>} />
            <Route path="/dashboard-tv/configurar" element={<ProtectedRoute requiredRole="admin"><ConfigurarDashboardTV /></ProtectedRoute>} />
            <Route path="/gestion-leads" element={<ProtectedRoute requiredRole="admin"><AppLayout><GestionLeads /></AppLayout></ProtectedRoute>} />
            <Route path="/sync-valuations" element={<ProtectedRoute requiredRole="super_admin"><AppLayout><SyncValuations /></AppLayout></ProtectedRoute>} />
            <Route path="/sync-operations" element={<ProtectedRoute requiredRole="super_admin"><SyncOperations /></ProtectedRoute>} />
            <Route path="/configuracion/tareas-tiempo" element={<ProtectedRoute requiredRole="admin"><ConfiguracionTareasTiempo /></ProtectedRoute>} />
            <Route path="/integraciones/brevo" element={<ProtectedRoute requiredRole="super_admin"><BrevoIntegration /></ProtectedRoute>} />
            <Route path="/sync-contacts-capittal" element={<ProtectedRoute requiredRole="super_admin"><AppLayout><SyncContactsCapittal /></AppLayout></ProtectedRoute>} />
            <Route path="/team-workload" element={<ProtectedRoute requiredRole="admin"><AppLayout><TeamWorkload /></AppLayout></ProtectedRoute>} />
            <Route path="/outbound" element={<ProtectedRoute requiredRole="admin"><AppLayout><Outbound /></AppLayout></ProtectedRoute>} />
            <Route path="/outbound/:id" element={<ProtectedRoute requiredRole="admin"><AppLayout><OutboundCampaignDetail /></AppLayout></ProtectedRoute>} />
            <Route path="/admin/sync-control" element={<ProtectedRoute requiredRole="super_admin"><AppLayout><SyncControl /></AppLayout></ProtectedRoute>} />
            <Route path="/admin/empresas-monitor" element={<ProtectedRoute requiredRole="super_admin"><AppLayout><EmpresasMonitor /></AppLayout></ProtectedRoute>} />
            <Route path="/admin/task-ai-qa" element={<ProtectedRoute requiredRole="admin"><AppLayout><TaskAIQA /></AppLayout></ProtectedRoute>} />
            <Route path="/sync-center" element={<ProtectedRoute requiredRole="super_admin"><SyncCenter /></ProtectedRoute>} />
            <Route path="/plantillas-email" element={<ProtectedRoute requiredRole="admin"><AppLayout><PlantillasEmail /></AppLayout></ProtectedRoute>} />
          
          {/* Presentation routes */}
          <Route path="/presentaciones" element={<ProtectedRoute><AppLayout><Presentaciones /></AppLayout></ProtectedRoute>} />
          <Route path="/presentaciones/:id/editor" element={<ProtectedRoute><PresentacionEditor /></ProtectedRoute>} />
          <Route path="/presentaciones/:id/present" element={<ProtectedRoute><PresenterMode /></ProtectedRoute>} />
          
          {/* Public share link viewer */}
          <Route path="/p/:token" element={<PublicViewer />} />
          
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Suspense>
    </>
  );
}

const App = () => (
  <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      {import.meta.env.DEV && <ReactQueryDevtools initialIsOpen={false} />}
      <AuthProvider>
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
      </AuthProvider>
    </QueryClientProvider>
  </ErrorBoundary>
);

export default App;
