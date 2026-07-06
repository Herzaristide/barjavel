// Enregistrement du service worker pour le support PWA (hors-ligne + installation).
//
// Le service worker (`public/sw.js`) et le manifeste sont servis à la racine du
// site. On respecte `import.meta.env.BASE_URL` pour rester compatible avec un
// déploiement dans un sous-chemin (ex. GitHub Pages : /repo/).

export function registerServiceWorker(): void {
  if (import.meta.env.DEV) return
  if (typeof navigator === "undefined" || !("serviceWorker" in navigator)) return

  const base = import.meta.env.BASE_URL || "/"
  const swUrl = `${base}sw.js`

  window.addEventListener("load", () => {
    navigator.serviceWorker.register(swUrl, { scope: base }).catch((err) => {
      console.error("Échec de l'enregistrement du service worker :", err)
    })
  })
}
