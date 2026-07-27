import { defineConfig } from 'vite'
import { resolve } from 'path'
import { fileURLToPath } from 'url'
import { dirname } from 'path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = resolve(__dirname, '../..')

export default defineConfig({
  base: '/galaxy-frontend/',
  resolve: {
    alias: {
      'postprocessing/src': resolve(root, 'node_modules/postprocessing/src'),
    },
    dedupe: ['three'],
  },
  optimizeDeps: {
    exclude: ['postprocessing'],
  },
  plugins: [
    {
      name: 'glsl-raw',
      transform(code, id) {
        if (/\.(glsl|vert|frag)$/.test(id)) {
          return { code: `export default ${JSON.stringify(code)};`, map: null }
        }
      },
    },
  ],
})
