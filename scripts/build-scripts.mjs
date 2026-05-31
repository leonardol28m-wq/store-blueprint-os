/**
 * Store Blueprint OS — Scripts Builder
 * Uses esbuild to compile content + background scripts as IIFE/ESM bundles
 * Also copies manifest.json → dist/manifest.json
 */
import { build } from 'esbuild';
import { copyFileSync } from 'fs';

const sharedConfig = {
  bundle: true,
  platform: 'browser',
  target: 'chrome114',
  define: { 'process.env.NODE_ENV': '"production"' },
  minify: true,
  sourcemap: false,
  treeShaking: true,
  logLevel: 'info',
};

// Content script — IIFE (injected into pages as classic script)
await build({
  ...sharedConfig,
  entryPoints: { content: 'src/content/content-script.ts' },
  outdir: 'dist',
  format: 'iife',
  globalName: '__StoreBlueprintContent',
  tsconfig: 'tsconfig.json',
  alias: { '@': './src' },
});

// Background service worker — ESM module
await build({
  ...sharedConfig,
  entryPoints: { background: 'src/background/service-worker.ts' },
  outdir: 'dist',
  format: 'esm',
  tsconfig: 'tsconfig.json',
  alias: { '@': './src' },
});

// Copy manifest.json → dist/manifest.json
copyFileSync('manifest.json', 'dist/manifest.json');
console.log('✅ Copied manifest.json → dist/manifest.json');

console.log('✅ Scripts built: content.js (IIFE) + background.js (ESM)');
