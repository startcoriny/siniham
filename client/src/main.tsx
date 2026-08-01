// React 앱 진입점
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import { AuthProvider } from "./context/AuthContext";
import { GameStateProvider } from "./context/GameStateContext";
import { ToastProvider } from "./components/common/Toast";
import "./index.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <GameStateProvider>
          <ToastProvider>
            <App />
          </ToastProvider>
        </GameStateProvider>
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>,
);
