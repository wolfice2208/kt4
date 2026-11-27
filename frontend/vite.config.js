import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Прокси /api -> FastAPI, чтобы EventSource обращался к тому же origin
// и обходился без кросс-доменных настроек в браузере.
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5180,
    strictPort: true,
    watch: {
      // Игнорируем временные файлы/каталоги редакторов и инструментов,
      // иначе watcher может упасть с EBUSY на Windows.
      ignored: ['**/*.tmp', '**/*.tmpdir/**', '**/.*.tmpdir/**'],
    },
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:8010',
        changeOrigin: true,
        // SSE требует, чтобы прокси не буферизовал поток.
        configure: (proxy) => {
          proxy.on('proxyRes', (proxyRes) => {
            proxyRes.headers['cache-control'] = 'no-cache';
          });
        },
      },
    },
  },
});
