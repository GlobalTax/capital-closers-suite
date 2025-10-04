import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AppLayout } from "./components/layout/AppLayout";
import { CommandPalette } from "@/components/shared/CommandPalette";
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts";
import Mandatos from "./pages/Mandatos";
import MandatoDetalle from "./pages/MandatoDetalle";
import Clientes from "./pages/Clientes";
import EmpresasTarget from "./pages/EmpresasTarget";
import Tareas from "./pages/Tareas";
import Documentos from "./pages/Documentos";
import Reportes from "./pages/Reportes";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

function AppContent() {
  useKeyboardShortcuts();
  return (
    <>
      <CommandPalette />
      <Routes>
        <Route path="/" element={<Navigate to="/mandatos" replace />} />
        <Route path="/mandatos" element={<AppLayout><Mandatos /></AppLayout>} />
        <Route path="/mandatos/:id" element={<AppLayout><MandatoDetalle /></AppLayout>} />
        <Route path="/clientes" element={<AppLayout><Clientes /></AppLayout>} />
        <Route path="/targets" element={<AppLayout><EmpresasTarget /></AppLayout>} />
        <Route path="/tareas" element={<AppLayout><Tareas /></AppLayout>} />
        <Route path="/documentos" element={<AppLayout><Documentos /></AppLayout>} />
        <Route path="/reportes" element={<AppLayout><Reportes /></AppLayout>} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AppContent />
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
