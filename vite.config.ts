import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import fs from 'node:fs'
import path from 'node:path'

/**
 * Serve and ship the repo-root `data/` directory.
 *
 * The dataset lives at `data/` (not `public/`) because it is a versioned,
 * committed artifact with its own README and schema. This plugin exposes it at
 * `/data/*` in dev and copies it into `dist/data` on build, so the app always
 * fetches `data/snapshot.json` and `data/countries-110m.topo.json`.
 */
function dataDirPlugin(): Plugin {
  const dataDir = path.resolve(process.cwd(), 'data')
  return {
    name: 'population-globe-data-dir',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const url = (req.url ?? '').split('?')[0] ?? ''
        if (!url.startsWith('/data/')) return next()
        const file = path.join(dataDir, url.slice('/data/'.length))
        if (file.startsWith(dataDir) && fs.existsSync(file) && fs.statSync(file).isFile()) {
          res.setHeader('Content-Type', 'application/json')
          fs.createReadStream(file).pipe(res)
          return
        }
        next()
      })
    },
    closeBundle() {
      const out = path.resolve(process.cwd(), 'dist/data')
      if (!fs.existsSync(dataDir)) return
      fs.mkdirSync(out, { recursive: true })
      // Only the two files read at runtime are published; the dataset README
      // and schema stay in the repo.
      for (const file of ['snapshot.json', 'countries-110m.topo.json']) {
        const from = path.join(dataDir, file)
        if (fs.existsSync(from)) fs.copyFileSync(from, path.join(out, file))
      }
    },
  }
}

export default defineConfig({
  // Relative asset URLs so the GitHub Pages project site (served from
  // /human-population-calculator/) resolves them, and so the same build works
  // at the domain root.
  base: './',
  plugins: [react(), dataDirPlugin()],
  build: {
    target: 'es2022',
    chunkSizeWarningLimit: 1500,
    rollupOptions: {
      output: {
        manualChunks: {
          globe: ['react-globe.gl', 'three', 'topojson-client'],
        },
      },
    },
  },
})
