import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { serviceWorker } from "./scripts/sw-plugin.ts";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), serviceWorker()],
  base: "/japan-2026/",
});
