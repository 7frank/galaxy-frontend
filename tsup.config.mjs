import { defineConfig } from 'tsup';
import { resolve } from 'path';

export default defineConfig({
    entry: {
        index: 'js/index.js',
    },
    format: ['esm', 'cjs'],
    outDir: 'dist',
    splitting: false,
    sourcemap: true,
    clean: true,
    dts: false,
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
            three: resolve('node_modules/three'),
            'postprocessing/src': resolve('node_modules/postprocessing/src'),
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
