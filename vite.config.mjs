import { defineConfig } from 'vite';
import { resolve } from 'path';
import { visualizer } from 'rollup-plugin-visualizer';

export default defineConfig({
    root: '.',
    base: process.env.GITHUB_ACTIONS ? '/cluster-graph-3d/' : '/',
    resolve: {
        alias: {
            three: resolve(__dirname, 'node_modules/three'),
            'postprocessing/src': resolve(__dirname, 'node_modules/postprocessing/src'),
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
    optimizeDeps: {
        exclude: ['postprocessing'],
    },
    plugins: [
        {
            name: 'glsl-raw',
            transform(code, id) {
                if (/\.(glsl|vert|frag)$/.test(id)) {
                    return { code: `export default ${JSON.stringify(code)};`, map: null };
                }
            },
        },
        process.env.ANALYZE && visualizer({
            filename: 'build/stats.html',
            open: true,
            gzipSize: true,
            brotliSize: true,
        }),
    ].filter(Boolean),
});
