import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import Index from "./pages/Index";
import BiblePage from "./pages/BiblePage";
import SearchPage from "./pages/SearchPage";
import FavoritesPage from "./pages/FavoritesPage";
import NotesPage from "./pages/NotesPage";
import GroupsPage from "./pages/GroupsPage";
import GroupChatPage from "./pages/GroupChatPage";
import ProfilePage from "./pages/ProfilePage";
import SettingsPage from "./pages/SettingsPage";
import PreachingPage from "./pages/PreachingPage";
import HistoryPage from "./pages/HistoryPage";
import AuthPage from "./pages/AuthPage";
import AboutPage from "./pages/AboutPage";
import ChurchesPage from "./pages/ChurchesPage";
import ChurchDetailPage from "./pages/ChurchDetailPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="min-h-screen bg-background flex items-center justify-center"><div className="h-8 w-8 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>;
  if (!user) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

const AppRoutes = () => {
  const { user, loading } = useAuth();

  return (
    <Routes>
      <Route
        path="/login"
        element={loading ? <div className="min-h-screen bg-background flex items-center justify-center"><div className="h-8 w-8 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div> : user ? <Navigate to="/" replace /> : <AuthPage />}
      />
      {/* Modo anônimo: leitura, favoritos, notas e perfil funcionam sem login */}
      <Route path="/" element={<Index />} />
      <Route path="/biblia" element={<BiblePage />} />
      <Route path="/buscar" element={<SearchPage />} />
      <Route path="/favoritos" element={<FavoritesPage />} />
      <Route path="/notas" element={<NotesPage />} />
      <Route path="/perfil" element={<ProfilePage />} />
      <Route path="/configuracoes" element={<SettingsPage />} />
      <Route path="/historico" element={<HistoryPage />} />
      <Route path="/sobre" element={<AboutPage />} />
      {/* Recursos sociais ainda exigem login */}
      <Route path="/grupos" element={<ProtectedRoute><GroupsPage /></ProtectedRoute>} />
      <Route path="/grupos/:id" element={<ProtectedRoute><GroupChatPage /></ProtectedRoute>} />
      <Route path="/pregacao" element={<ProtectedRoute><PreachingPage /></ProtectedRoute>} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
