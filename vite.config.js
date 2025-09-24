import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { visualizer } from "rollup-plugin-visualizer";

export default defineConfig({
  plugins: [react(), visualizer()],
  server: {
    port: 3000,
    host: true,
  },
  preview: {
    port: 8080,
    host: true,
allowedHosts: ['https://newteacher.oratrics.in', 'www.oratrics.in']
  },
});
