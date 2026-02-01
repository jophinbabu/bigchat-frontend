import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { nodePolyfills } from 'vite-plugin-node-polyfills'
import basicSsl from '@vitejs/plugin-basic-ssl'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), nodePolyfills(), basicSsl()],
  server: {
    host: '0.0.0.0', // Allow network access
    port: 5173,
    proxy: {
      "/api": {
        target: "https://localhost:5000",
        changeOrigin: true,
        secure: false,
      },
      "/socket.io": {
        target: "https://localhost:5000",
        changeOrigin: true,
        secure: false,
        ws: true,
      },
    },
  },
})
