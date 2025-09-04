import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { VitePWA } from "vite-plugin-pwa";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [
    react(),
   VitePWA({
      registerType: "autoUpdate",   // 新バージョンを自動取得
      injectRegister: "auto",       // main.tsx への登録コードは不要
      manifest: {
        name: "気分で選ぶ本 - 今読みたい本の検索システム",
        short_name: "気分で選ぶ本",
        start_url: "/",
        display: "standalone",
        background_color: "#ffffff",
        theme_color: "#38bdf8",
        icons: [
          { src: "/icon-192x192.png", sizes: "192x192", type: "image/png" },
          { src: "/icon-512x512.png", sizes: "512x512", type: "image/png" }
        ]
      },
    })  
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
