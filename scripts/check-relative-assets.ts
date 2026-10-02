/**
 * Guard the GitHub Pages sub-path build.
 *
 * `vite preview` and the E2E suite serve the app from the domain root, so a
 * regression to root-absolute asset URLs (`/assets/...`) passes every test and
 * only fails on the deployed project site (`/human-population-calculator/`).
 * This cheap check runs as part of `bun run build`, so both CI and the deploy
 * workflow fail if the emitted `index.html` references any root-absolute asset.
 */
import { readFile } from 'node:fs/promises'
import path from 'node:path'

const indexPath = path.join(process.cwd(), 'dist', 'index.html')
const html = await readFile(indexPath, 'utf8')
const absolute = [...html.matchAll(/(?:src|href)="(\/[^"]*)"/g)].map((match) => match[1]!)

if (absolute.length > 0) {
  console.error(`✗ ${path.relative(process.cwd(), indexPath)} uses root-absolute asset URLs:`)
  for (const url of absolute) console.error(`    ${url}`)
  console.error("  Set `base: './'` in vite.config.ts so GitHub Pages project sites resolve assets.")
  process.exit(1)
}

console.log('✓ dist/index.html uses relative asset URLs')
