import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AppLayout } from "./components/layout/AppLayout";
import { CommandPalette } from "@/components/shared/CommandPalette";
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { ErrorBoundary } from "@/components/shared/ErrorBoundary";
import Login from "./pages/auth/Login";
import Mandatos from "./pages/Mandatos";
import MandatoDetalle from "./pages/MandatoDetalle";
import Clientes from "./pages/Clientes";
import ClienteDetalle from "./pages/ClienteDetalle";
import EmpresasTarget from "./pages/EmpresasTarget";
import TargetDetalle from "./pages/TargetDetalle";
import Tareas from "./pages/Tareas";
import Documentos from "./pages/Documentos";
import Reportes from "./pages/Reportes";
import NotFound from "./pages/NotFound";
import Perfil from "./pages/Perfil";

const queryClient = new QueryClient();

function AppContent() {
  useKeyboardShortcuts();
  return (
    <>
      <CommandPalette />
      <Routes>
        {/* Public routes */}
        <Route path="/auth/login" element={<Login />} />

        {/* Protected routes */}
        <Route path="/" element={<Navigate to="/mandatos" replace />} />
        <Route path="/mandatos" element={<ProtectedRoute><AppLayout><Mandatos /></AppLayout></ProtectedRoute>} />
        <Route path="/mandatos/:id" element={<ProtectedRoute><AppLayout><MandatoDetalle /></AppLayout></ProtectedRoute>} />
        <Route path="/clientes" element={<ProtectedRoute><AppLayout><Clientes /></AppLayout></ProtectedRoute>} />
        <Route path="/clientes/:id" element={<ProtectedRoute><AppLayout><ClienteDetalle /></AppLayout></ProtectedRoute>} />
        <Route path="/targets" element={<ProtectedRoute><AppLayout><EmpresasTarget /></AppLayout></ProtectedRoute>} />
        <Route path="/targets/:id" element={<ProtectedRoute><AppLayout><TargetDetalle /></AppLayout></ProtectedRoute>} />
          <Route path="/tareas" element={<ProtectedRoute><AppLayout><Tareas /></AppLayout></ProtectedRoute>} />
          <Route path="/documentos" element={<ProtectedRoute><AppLayout><Documentos /></AppLayout></ProtectedRoute>} />
          <Route path="/reportes" element={<ProtectedRoute><AppLayout><Reportes /></AppLayout></ProtectedRoute>} />
          <Route path="/perfil" element={<ProtectedRoute><AppLayout><Perfil /></AppLayout></ProtectedRoute>} />
          <Route path="*" element={<NotFound />} />
      </Routes>
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
