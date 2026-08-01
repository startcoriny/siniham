import { Navigate, Route, Routes } from "react-router-dom";
import AuthPage from "./pages/AuthPage";
import CagePage from "./pages/CagePage";
import GardenPage from "./pages/GardenPage";
import ShopPage from "./pages/ShopPage";
import CollectionPage from "./pages/CollectionPage";
import SettingsPage from "./pages/SettingsPage";
import GameShell from "./layouts/GameShell";
import ProtectedRoute from "./components/ProtectedRoute";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<AuthPage />} />
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
