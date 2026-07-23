import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
    root: '.',
    resolve: {
        alias: {
            three: resolve(__dirname, 'node_modules/three'),
        },
        dedupe: ['three'],
    },
    build: {
        outDir: 'build',
        emptyOutDir: true,
        rollupOptions: {
            input: resolve(__dirname, 'index.html'),
        },
    },
    server: {
        port: 8080,
        open: '/index.html',
    },
    plugins: [],
});
