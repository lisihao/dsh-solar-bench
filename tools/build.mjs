import { execFileSync } from 'node:child_process'
import { cp, mkdir, rm, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { build } from 'esbuild'

const root = fileURLToPath(new URL('../', import.meta.url))
await rm(join(root, 'lib'), { recursive: true, force: true })
await build({
  entryPoints: ['src/index.ts', 'src/typert.ts', 'src/cli-main.ts'],
  absWorkingDir: root,
  outdir: 'lib',
  bundle: true,
  packages: 'external',
  platform: 'node',
  target: 'node22',
  format: 'esm',
  sourcemap: true,
})
// The CLI bootstrap must register its resolve hook before any bundled import runs, so it is transpiled alone.
await build({ entryPoints: ['src/cli.ts'], absWorkingDir: root, outfile: 'lib/cli.js', bundle: false, platform: 'node', target: 'node22', format: 'esm', banner: { js: '#!/usr/bin/env node' }, sourcemap: true })
await build({ entryPoints: ['src/client.ts'], absWorkingDir: root, outfile: 'lib/client.cjs', bundle: true, platform: 'browser', target: 'es2022', format: 'cjs', loader: { '.css': 'text' }, external: ['@deepseek-ai/*', 'react', 'react-dom'], banner: { js: 'window.__ModuleLoader__.load({ id: "@lisihao/dsh-solar-bench", factory: (require) => { var module = { exports: {} }; var exports = module.exports;' }, footer: { js: 'return module.exports; } });' }, sourcemap: true })
const declarations = join(root, '.build-types')
await rm(declarations, { recursive: true, force: true })
const config = join(root, '.build-types.tsconfig.json')
await writeFile(config, JSON.stringify({
  extends: './tsconfig.json',
  compilerOptions: { noEmit: false, declaration: true, emitDeclarationOnly: true, rootDir: 'src', outDir: '.build-types' },
  include: ['src/**/*.ts'],
}, null, 2) + '\n')
try {
  execFileSync(join(root, 'node_modules/.bin/tsc'), ['-p', config], { cwd: root, stdio: 'inherit' })
} finally {
  await rm(config, { force: true })
}
await mkdir(join(root, 'lib', 'types'), { recursive: true })
await cp(declarations, join(root, 'lib', 'types'), { recursive: true })
await rm(declarations, { recursive: true, force: true })
console.log('Built lib/ and declarations.')
