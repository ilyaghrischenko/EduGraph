// vite.config.ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
    plugins: [react(), tailwindcss()],
    server: {
        proxy: {
            '/api': 'http://localhost:5074',
        },
    },
    optimizeDeps: {
        // react-force-graph-2d ships CJS internally; tell Vite to pre-bundle it
        include: ['react-force-graph-2d'],
    },
});
