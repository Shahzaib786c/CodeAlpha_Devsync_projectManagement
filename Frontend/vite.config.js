import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const target = env.API_PROXY_TARGET || "http://127.0.0.1:5000";
  return {
    plugins: [react()],
    server: {
      port: 5173,
      strictPort: true,
      proxy: { "/api": { target }, "/socket.io": { target, ws: true } },
    },
    build: {
      rollupOptions: {
        output: {
          manualChunks: {
            motion: ["framer-motion"],
            state: ["@reduxjs/toolkit", "react-redux"],
            socket: ["socket.io-client"],
          },
        },
      },
    },
  };
});
