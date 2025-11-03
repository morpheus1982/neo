import { defineConfig } from 'vite';
import { crx } from '@crxjs/vite-plugin';
import manifest from './src/manifest.json';

export default defineConfig({
  plugins: [crx({ manifest })],
  build: {
    outDir: 'dist',
    rollupOptions: {
      input: {
        content: 'src/content/index.ts',
        background: 'src/background/index.ts',
        popup: 'src/popup/index.html'
      }
    }
  }
});

