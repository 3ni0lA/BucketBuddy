import dotenv from 'dotenv';
dotenv.config();
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import runtimeErrorOverlay from "@replit/vite-plugin-runtime-error-modal";
import { fileURLToPath } from "url";
import path from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default defineConfig({
  plugins: [
    react(),
    runtimeErrorOverlay(),
    ...(process.env.NODE_ENV !== "production" &&
    process.env.REPL_ID !== undefined
      ? [
          await import("@replit/vite-plugin-cartographer").then((m) =>
            m.cartographer(),
          ),
        ]
      : []),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "client", "src"),
      "@shared": path.resolve(__dirname, "shared"),
      "@assets": path.resolve(__dirname, "attached_assets"),
    },
  },
  root: path.resolve(__dirname, "client"),
  build: {
    outDir: path.resolve(__dirname, "dist/public"),
    emptyOutDir: true,
  },
});
// This Vite configuration file sets up a React project with various plugins and configurations.
// It includes runtime error overlays for development, resolves aliases for easier imports, and specifies the build output directory.
// The configuration also conditionally includes the Cartographer plugin for Replit environments, enhancing the development experience.
// The use of dotenv allows for environment variables to be loaded, which is essential for managing sensitive information like database URLs.
// The file uses ES module syntax, which is compatible with modern JavaScript environments and tools.
// The configuration is designed to work seamlessly with both development and production environments, ensuring a smooth development workflow.