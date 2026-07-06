import { StrictMode } from "react"
import { createRoot } from "react-dom/client"
import { App } from "./App"
import { applyConfig } from "./lib/config"
import { registerServiceWorker } from "./lib/pwa"
import "./styles.css"

// Applique la configuration (couleur d'accent, titre, langue) avant le rendu.
applyConfig()

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

// Enregistre le service worker (PWA : installation + mode hors-ligne).
registerServiceWorker()
