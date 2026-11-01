import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    host: "0.0.0.0",
    port: 3000,
    proxy: {
      "/api/auth": {
        target: process.env.VITE_AUTH_PROXY || "http://127.0.0.1:8000",
        changeOrigin: true,
      },
      "/api/catalog": {
        target: process.env.VITE_CATALOG_PROXY || "http://127.0.0.1:8001",
        changeOrigin: true,
      },
      "/api/commerce": {
        target: process.env.VITE_COMMERCE_PROXY || "http://127.0.0.1:8002",
        changeOrigin: true,
      },
      "/api/notice": {
        target: process.env.VITE_NOTICE_PROXY || "http://127.0.0.1:8003",
        changeOrigin: true,
      },
    },
  },
});
