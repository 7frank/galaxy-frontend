import { defineConfig } from 'vite';
import { resolve } from 'path';
import { visualizer } from 'rollup-plugin-visualizer';

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
    plugins: [
        process.env.ANALYZE && visualizer({
            filename: 'build/stats.html',
            open: true,
            gzipSize: true,
            brotliSize: true,
        }),
    ].filter(Boolean),
});
