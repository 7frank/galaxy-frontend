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
            treeshake: {
                moduleSideEffects: false,
                propertyReadSideEffects: false,
                unknownGlobalSideEffects: false,
            },
            output: {
                manualChunks(id) {
                    if (id.includes('node_modules/three/')) return 'three';
                    if (id.includes('node_modules/postprocessing/')) return 'postprocessing';
                    if (id.includes('node_modules/three.meshline/')) return 'three';
                },
            },
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
