import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react-swc'
import eslintPlugin from 'vite-plugin-eslint'

// https://vitejs.dev/config/
export default defineConfig({
  base: '/',
  plugins: [react(), eslintPlugin()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/setupTests.ts',
    css: true,
    reporters: ['verbose'],
    coverage: {
      reporter: ['text', 'json', 'html'],
      include: ['src/**/*'],
      exclude: [],
    },
  },
  server: {
    port: 5001,
    strictPort: true,
    headers: {
      'Cross-Origin-Opener-Policy': 'same-origin',
      'Cross-Origin-Embedder-Policy': 'require-corp',
    },
  },
  build: {
    rollupOptions: {
      external: id => {
        // 不要将 ort 视为外部模块（它通过 CDN 动态加载）
        return false
      },
      output: {
        // 确保 ort 被正确引用为全局变量
        globals: {},
      },
    },
  },
})
