import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.tsx";
import { AppResetProvider } from "@/providers/app-reset-provider";
import { startEngine } from "@/lib/engine/engine";
import { removeLegacyStudyData } from "@/lib/engine/legacy-storage-cleanup";

removeLegacyStudyData();
startEngine();

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <AppResetProvider>
      <App />
    </AppResetProvider>
  </StrictMode>
);
