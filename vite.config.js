import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  build: {
    // three.js + the viewer form one lazy chunk (~270 kB gzipped) that loads after the page.
    chunkSizeWarningLimit: 1100,
  },
});
