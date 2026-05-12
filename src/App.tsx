import { Navigate, Route, Routes } from "react-router-dom";
import { AppLayout } from "./components/AppLayout";
import ErrorBoundary from "./components/ErrorBoundary";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { PublicLayout } from "./components/PublicLayout";
import { PublicOnlyRoute } from "./components/PublicOnlyRoute";
import { Toaster } from "./components/ui/sonner";
import { ThemeProvider } from "./contexts/ThemeContext";
import {
  BrieferPage,
  ChatPage,
  CloserPage,
  DashboardPage,
  DemoPage,
  FoundingDealerPage,
  HunterPage,
  InboxPage,
  LandingPage,
  ListerPage,
  LoginPage,
  ResponderPage,
  ScoutPage,
  SettingsPage,
  SignupPage,
} from "./pages";

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light" switchable>
        <Toaster />
        <Routes>
          {/* Landing page has its own nav — no PublicLayout wrapper */}
          <Route path="/" element={<LandingPage />} />

          <Route element={<PublicLayout />}>
            <Route path="/demo" element={<DemoPage />} />
            <Route path="/founding-dealer" element={<FoundingDealerPage />} />
            <Route element={<PublicOnlyRoute />}>
              <Route path="/login" element={<LoginPage />} />
              <Route path="/signup" element={<SignupPage />} />
            </Route>
          </Route>

          <Route element={<ProtectedRoute />}>
            <Route element={<AppLayout />}>
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/agents/hunter" element={<HunterPage />} />
              <Route path="/agents/lister" element={<ListerPage />} />
              <Route path="/agents/responder" element={<ResponderPage />} />
              <Route path="/agents/scout" element={<ScoutPage />} />
              <Route path="/agents/briefer" element={<BrieferPage />} />
              <Route path="/agents/closer" element={<CloserPage />} />
              <Route path="/inbox" element={<InboxPage />} />
              <Route path="/chat" element={<ChatPage />} />
              <Route path="/settings" element={<SettingsPage />} />
            </Route>
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
