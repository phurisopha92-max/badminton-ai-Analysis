import "@/App.css";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/context/AuthContext";
import Sidebar from "@/components/Sidebar";
import HomePage from "@/pages/HomePage";
import AnalysisPage from "@/pages/AnalysisPage";
import HistoryPage from "@/pages/HistoryPage";
import ReferencePage from "@/pages/ReferencePage";
import ProgressPage from "@/pages/ProgressPage";
import ComparePage from "@/pages/ComparePage";
import GameAnalysisPage from "@/pages/GameAnalysisPage";
import CurrentAnalysisPage from "@/pages/CurrentAnalysisPage";
import LoginPage from "@/pages/LoginPage";
import AuthCallbackPage from "@/pages/AuthCallbackPage";
import SharedAnalysisPage from "@/pages/SharedAnalysisPage";
import CoachDashboardPage from "@/pages/CoachDashboardPage";
import SubscriptionPage from "@/pages/SubscriptionPage";
import SubscriptionSuccessPage from "@/pages/SubscriptionSuccessPage";
import { Loader2 } from "lucide-react";

// Protected Route wrapper - redirects to login if not authenticated
const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-[#09090b] flex items-center justify-center">
        <Loader2 className="w-12 h-12 text-primary animate-spin" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

// App content with routes
const AppContent = () => {
  const { login, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-[#09090b] flex items-center justify-center">
        <Loader2 className="w-12 h-12 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <Routes>
      {/* Public routes without sidebar */}
      <Route path="/login" element={<LoginPage onLogin={login} />} />
      <Route path="/auth/callback" element={<AuthCallbackPage onLogin={login} />} />
      <Route path="/shared/:shareId" element={<SharedAnalysisPage />} />

      {/* Routes with sidebar - some public, some protected */}
      <Route
        path="/*"
        element={
          <Sidebar>
            <Routes>
              {/* Public pages - can view without login */}
              <Route path="/" element={<HomePage />} />
              <Route path="/reference" element={<ReferencePage />} />
              <Route path="/subscription" element={<SubscriptionPage />} />
              
              {/* Protected pages - require login */}
              <Route path="/current-analysis" element={<ProtectedRoute><CurrentAnalysisPage /></ProtectedRoute>} />
              <Route path="/analysis/:id" element={<ProtectedRoute><AnalysisPage /></ProtectedRoute>} />
              <Route path="/history" element={<ProtectedRoute><HistoryPage /></ProtectedRoute>} />
              <Route path="/progress" element={<ProtectedRoute><ProgressPage /></ProtectedRoute>} />
              <Route path="/compare" element={<ProtectedRoute><ComparePage /></ProtectedRoute>} />
              <Route path="/game-analysis" element={<ProtectedRoute><GameAnalysisPage /></ProtectedRoute>} />
              <Route path="/coach" element={<ProtectedRoute><CoachDashboardPage /></ProtectedRoute>} />
              <Route path="/subscription/success" element={<ProtectedRoute><SubscriptionSuccessPage /></ProtectedRoute>} />
            </Routes>
          </Sidebar>
        }
      />
    </Routes>
  );
};

function App() {
  return (
    <div className="App">
      <BrowserRouter>
        <AuthProvider>
          <AppContent />
        </AuthProvider>
      </BrowserRouter>
    </div>
  );
}

export default App;