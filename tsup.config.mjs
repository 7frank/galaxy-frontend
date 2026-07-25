import { defineConfig } from 'tsup';
import { resolve } from 'path';
import { brotliDecompress } from 'zlib';

export default defineConfig({
    entry: {
        index: 'js/index.ts',
        hull: 'js/hull.ts',
    },
    format: ['esm', 'cjs'],
    outDir: 'dist',
    splitting: false,
    sourcemap: true,
    clean: true,
    dts: true,
    external: [
        'three',
        'postprocessing',
        'd3-force-3d',
        'dagre',
        'lodash',
        'rxjs',
        'socket.io',
        'tweakpane',
        'mousetrap',
        '@tweenjs/tween.js',
        'hexasphere.js',
        'monotone-convex-hull-2d',
        'papaparse',
        'qwest',
        'easy-color',
        'three.meshline',
    ],
    esbuildOptions(options) {
        options.alias = {
            three: resolve('node_modules/three')
        };
        options.loader = {
            '.glsl': 'text',
            '.vert': 'text',
            '.frag': 'text',
            '.css': 'text',
            '.html': 'text',
            '.png': 'dataurl',
        };
    },
});
