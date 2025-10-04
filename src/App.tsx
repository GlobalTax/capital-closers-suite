import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AppLayout } from "./components/layout/AppLayout";
import Mandatos from "./pages/Mandatos";
import Clientes from "./pages/Clientes";
import EmpresasTarget from "./pages/EmpresasTarget";
import Tareas from "./pages/Tareas";
import Documentos from "./pages/Documentos";
import Reportes from "./pages/Reportes";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Navigate to="/mandatos" replace />} />
          <Route
            path="/mandatos"
            element={
              <AppLayout>
                <Mandatos />
              </AppLayout>
            }
          />
          <Route
            path="/clientes"
            element={
              <AppLayout>
                <Clientes />
              </AppLayout>
            }
          />
          <Route
            path="/empresas-target"
            element={
              <AppLayout>
                <EmpresasTarget />
              </AppLayout>
            }
          />
          <Route
            path="/tareas"
            element={
              <AppLayout>
                <Tareas />
              </AppLayout>
            }
          />
          <Route
            path="/documentos"
            element={
              <AppLayout>
                <Documentos />
              </AppLayout>
            }
          />
          <Route
            path="/reportes"
            element={
              <AppLayout>
                <Reportes />
              </AppLayout>
            }
          />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
