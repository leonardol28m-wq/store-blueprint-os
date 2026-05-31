/**
 * Store Blueprint OS — Scripts Builder
 * Uses esbuild to compile content + background scripts as IIFE/ESM bundles
 */
import { build } from 'esbuild';

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

console.log('✅ Scripts built: content.js (IIFE) + background.js (ESM)');
