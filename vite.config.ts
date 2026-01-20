import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

const isContentScript = process.env.BUILD_TARGET === 'content';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  base: './',
  define: {
    'process.env.NODE_ENV': JSON.stringify('production'),
  },
  build: isContentScript ? {
    // Content Script 构建配置 - 使用 IIFE 格式
    lib: {
      entry: resolve(__dirname, 'src/content/index.tsx'),
      name: 'LexiMindContent',
      formats: ['iife'],
      fileName: () => 'assets/content.js',
    },
    rollupOptions: {
      output: {
        extend: true,
        assetFileNames: 'assets/[name].[ext]',
      },
    },
    outDir: 'dist',
    emptyOutDir: false,
    cssCodeSplit: false,
    minify: true,
  } : {
    // 主构建配置 - HTML 页面和 background
    rollupOptions: {
      input: {
        popup: resolve(__dirname, 'index.html'),
        translate: resolve(__dirname, 'translate.html'),
        background: resolve(__dirname, 'src/background/index.ts'),
      },
      output: {
        entryFileNames: 'assets/[name].js',
        chunkFileNames: 'assets/[name].js',
        assetFileNames: (assetInfo) => {
          if (assetInfo.name && assetInfo.name.endsWith('.css')) {
            return 'assets/style.css';
          }
          return 'assets/[name].[ext]';
        },
      },
    },
    outDir: 'dist',
    emptyOutDir: true,
  },
})
