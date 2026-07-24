import { defineConfig } from 'tsup';
import { resolve } from 'path';

export default defineConfig({
    entry: {
        graph:         'js/view/GraphView3D.js',
        config:        'js/cluster/configs/Default3DGraphConfig.js',
        data:          'js/data/index.js',
        hull:          'js/cluster/hull/index.js',
        distributions: 'js/cluster/distributions/index.js',
    },
    format: ['esm', 'cjs'],
    outDir: 'dist',
    splitting: true,
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
