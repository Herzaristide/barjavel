import typography from "@tailwindcss/typography"

/** @type {import('tailwindcss').Config} */
export default {
  darkMode: "class",
  // Note : le CLI barjavel surcharge `content` avec des chemins absolus vers app/.
  content: ["./app/index.html", "./app/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // Accent unique, piloté par docs.config.ts via les variables CSS.
        accent: "rgb(var(--accent) / <alpha-value>)",
        void: "rgb(var(--void) / <alpha-value>)",
        panel: "rgb(var(--panel) / <alpha-value>)",
        ink: "rgb(var(--ink) / <alpha-value>)",
        "ink-dim": "rgb(var(--ink-dim) / <alpha-value>)",
        "ink-faint": "rgb(var(--ink-faint) / <alpha-value>)",
        line: "rgb(var(--line) / <alpha-value>)",
      },
      fontFamily: {
        // Les polices de karenine : Inter pour tout, JetBrains Mono pour le code.
        sans: ["Inter", "-apple-system", "BlinkMacSystemFont", "Segoe UI", "Roboto", "sans-serif"],
        mono: ["JetBrains Mono", "ui-monospace", "SF Mono", "Menlo", "monospace"],
      },
      keyframes: {
        rise: {
          from: { opacity: "0", transform: "translateY(10px)" },
          to: { opacity: "1", transform: "none" },
        },
        fade: {
          from: { opacity: "0" },
          to: { opacity: "1" },
        },
      },
      animation: {
        // Les courbes de karenine : OutCubic, sans rebond.
        rise: "rise 0.4s cubic-bezier(0.33, 1, 0.68, 1)",
        fade: "fade 0.16s cubic-bezier(0.33, 1, 0.68, 1)",
      },
    },
  },
  plugins: [typography],
}
