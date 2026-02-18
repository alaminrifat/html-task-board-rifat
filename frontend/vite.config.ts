import path from "path"
import { reactRouter } from "@react-router/dev/vite";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  plugins: [
    tailwindcss(),
    reactRouter(),
    tsconfigPaths(),
    VitePWA({
      registerType: "autoUpdate",
      workbox: {
        globPatterns: ["**/*.{js,css,ico,png,svg,woff,woff2}"],
        runtimeCaching: [
          {
            urlPattern: ({ url, request }) =>
              url.pathname.startsWith("/api") && request.method === "GET",
            handler: "NetworkFirst",
            options: {
              cacheName: "api-cache",
              networkTimeoutSeconds: 3,
              cacheableResponse: { statuses: [0, 200] },
              expiration: { maxEntries: 200, maxAgeSeconds: 60 * 60 * 24 },
            },
          },
          {
            urlPattern: ({ request }) => request.mode === "navigate",
            handler: "NetworkFirst",
            options: {
              cacheName: "pages-cache",
              networkTimeoutSeconds: 3,
              cacheableResponse: { statuses: [0, 200] },
              expiration: { maxEntries: 50, maxAgeSeconds: 60 * 60 * 24 },
            },
          },
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: "StaleWhileRevalidate",
            options: {
              cacheName: "google-fonts-stylesheets",
              expiration: { maxEntries: 10, maxAgeSeconds: 60 * 60 * 24 * 365 },
            },
          },
          {
            urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
            handler: "CacheFirst",
            options: {
              cacheName: "google-fonts-webfonts",
              cacheableResponse: { statuses: [0, 200] },
              expiration: { maxEntries: 30, maxAgeSeconds: 60 * 60 * 24 * 365 },
            },
          },
        ],
        navigateFallback: null,
      },
      manifest: {
        name: "Taskboard",
        short_name: "Taskboard",
        description: "Project management taskboard",
        theme_color: "#4A90D9",
        background_color: "#F9FAFB",
        display: "standalone",
        start_url: "/projects",
        icons: [
          { src: "/favicon.ico", sizes: "64x64", type: "image/x-icon" },
        ],
      },
    }),
  ],
  resolve: {
    alias: {
      "~": path.resolve(__dirname, "./app"),
    },
  },
});
