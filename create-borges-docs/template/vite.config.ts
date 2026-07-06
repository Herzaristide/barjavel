import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"

// `base: './'` : chemins relatifs, pour que le site fonctionne quel que soit
// le sous-chemin où il est servi (ex. GitHub Pages : https://user.github.io/repo/).
export default defineConfig({
  base: "./",
  plugins: [react()],
})
