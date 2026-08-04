import { Navigate, Route, Routes } from "react-router-dom";
import StartPage from "./pages/StartPage";
import LoginPage from "./pages/LoginPage";
import SignupPage from "./pages/SignupPage";
import TermsPage from "./pages/legal/TermsPage";
import PrivacyPage from "./pages/legal/PrivacyPage";
import CagePage from "./pages/CagePage";
import GardenPage from "./pages/GardenPage";
import ShopPage from "./pages/ShopPage";
import CollectionPage from "./pages/CollectionPage";
import SettingsPage from "./pages/SettingsPage";
import OnboardingPage from "./pages/OnboardingPage";
import GameShell from "./layouts/GameShell";
import ProtectedRoute from "./components/ProtectedRoute";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<StartPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/signup" element={<SignupPage />} />
      {/* 약관은 가입 전에도 읽을 수 있어야 하므로 로그인 밖에 둔다 */}
      <Route path="/terms" element={<TermsPage />} />
      <Route path="/privacy" element={<PrivacyPage />} />
      <Route path="/onboarding" element={<ProtectedRoute><OnboardingPage /></ProtectedRoute>} />
      <Route
        path="/home"
        element={
          <ProtectedRoute>
            <GameShell />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="cage" replace />} />
        <Route path="cage" element={<CagePage />} />
        <Route path="garden" element={<GardenPage />} />
        <Route path="shop" element={<ShopPage />} />
        <Route path="collection" element={<CollectionPage />} />
        <Route path="settings" element={<SettingsPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
