import { defineConfig } from 'vite';
import path from 'node:path';
import { existsSync, readFileSync } from 'node:fs';

const extensionRoot = path.resolve(process.cwd(), 'extension');
const sourceRoot = path.resolve(extensionRoot, 'src');

function copyExtensionAssets() {
  const assets = [
    { from: path.resolve(sourceRoot, 'manifest.json'), to: 'manifest.json' },
    { from: path.resolve(sourceRoot, 'popup/index.html'), to: 'popup.html' },
    { from: path.resolve(sourceRoot, 'popup/popup.css'), to: 'popup.css' },
  ];

  return {
    name: 'neo-copy-extension-assets',
    apply: 'build',
    generateBundle() {
      for (const asset of assets) {
        if (!existsSync(asset.from)) {
          continue;
        }

        this.emitFile({
          type: 'asset',
          fileName: asset.to,
          source: readFileSync(asset.from),
        });
      }
    },
  };
}

export default defineConfig({
  build: {
    outDir: path.resolve(extensionRoot, 'dist'),
    emptyOutDir: true,
    sourcemap: false,
    rollupOptions: {
      input: {
        background: path.resolve(sourceRoot, 'background/index.ts'),
        content: path.resolve(sourceRoot, 'content/index.ts'),
        inject: path.resolve(sourceRoot, 'inject/interceptor.ts'),
        popup: path.resolve(sourceRoot, 'popup/popup.ts'),
      },
      output: {
        entryFileNames: '[name].js',
        chunkFileNames: '[name]-[hash].js',
        assetFileNames: '[name][extname]',
      },
    },
  },
  plugins: [copyExtensionAssets()],
});
