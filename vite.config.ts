import { reactRouter } from '@react-router/dev/vite';
import { sentryVitePlugin } from '@sentry/vite-plugin';
import { visualizer } from 'rollup-plugin-visualizer';
import UnoCSS from 'unocss/vite';
import type { PluginOption } from 'vite';
import { defineConfig } from 'vite';
import { nodePolyfills } from 'vite-plugin-node-polyfills';
import { optimizeCssModules } from 'vite-plugin-optimize-css-modules';
import tsconfigPaths from 'vite-tsconfig-paths';

export default defineConfig((config) => {
  const isProduction = config.mode === 'production';
  
  return {
    server: {
      fs: {
        strict: false,
      },
    },
    define: {
      'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV),
      // ✅ FIX: Добавляем global для браузерной совместимости
      global: 'globalThis',
    },
    build: {
      target: 'esnext',
      // ✅ FIX: Отключаем sourcemaps в production — экономит память и убирает предупреждения
      sourcemap: isProduction ? false : true,
      // ✅ FIX: Увеличиваем лимит чанков чтобы не было предупреждений
      chunkSizeWarningLimit: 2000,
      rollupOptions: {
        external: ['undici', 'util/types', 'node:util/types'],
        output: {
          // ✅ FIX: Ручное разделение чанков — снижает пиковое потребление памяти
          manualChunks: {
            // React и основные библиотеки
            'vendor-core': ['react', 'react-dom', 'react-router', 'react/jsx-runtime'],
            // UI компоненты
            'vendor-ui': [
              '@radix-ui/react-dialog',
              '@radix-ui/react-dropdown-menu',
              '@radix-ui/react-tooltip',
              'framer-motion',
              'class-variance-authority',
            ],
            // Редактор кода
            'vendor-editor': [
              '@codemirror/view',
              '@codemirror/state',
              '@codemirror/language',
              '@uiw/codemirror-theme-vscode',
              '@lezer/highlight',
            ],
            // AI SDK
            'vendor-ai': ['ai', '@ai-sdk/react', '@ai-sdk/openai', '@ai-sdk/anthropic'],
            // Утилиты
            'vendor-utils': ['date-fns', 'diff', 'dompurify', 'shiki', 'nanostores'],
          },
        },
      },
      // ✅ FIX: Оптимизация для снижения потребления памяти
      minify: 'terser',
      terserOptions: {
        compress: {
          drop_console: isProduction,
          drop_debugger: isProduction,
        },
      },
    },
    resolve: {
      dedupe: [
        'react',
        'react-dom',
        'react/jsx-runtime',
        'react/jsx-dev-runtime',
        'react-dom/client',
        'react-router',
        '@nanostores/react',
      ],
      alias: {
        'util/types': 'rollup-plugin-node-polyfills/polyfills/empty',
        'node:util/types': 'rollup-plugin-node-polyfills/polyfills/empty',
        // ✅ FIX: Алиас для istextorbinary — заменяем проблемный импорт path.basename
        'istextorbinary/edition-browsers/index.js': 'istextorbinary/edition-node/index.js',
      },
    },
    ssr: {
      noExternal: [],
      external: [
        'stream',
        'node:stream',
        'util',
        'util/types',
        'node:util',
        'node:util/types',
        'buffer',
        'node:buffer',
        'react-window',
      ],
    },
    plugins: [
      // ✅ FIX: Добавляем 'path' в include и настраиваем exports для basename
      nodePolyfills({
        include: ['buffer', 'process', 'util', 'path'], // ✅ Добавили path
        globals: {
          Buffer: true,
          process: true,
          global: true,
        },
        protocolImports: true,
        exclude: ['child_process', 'fs', 'stream'], // ✅ Убрали path из exclude
      }),
      {
        name: 'buffer-polyfill',
        transform(code: string, id: string) {
          if (id.includes('env.mjs')) {
            return {
              code: `import { Buffer } from 'buffer';\n${code}`,
              map: null,
            };
          }
          return null;
        },
      },
      // ✅ FIX: Плагин для исправления istextorbinary basename
      {
        name: 'fix-istextorbinary',
        transform(code: string, id: string) {
          if (id.includes('istextorbinary') && id.includes('edition-browsers')) {
            // Заменяем проблемный импорт basename на безопасный аналог
            return {
              code: code.replace(
                /import\s*\{\s*basename\s*\}\s*from\s*['"]path['"]/g,
                `const basename = (p) => p.split('/').pop().split('\\\\').pop()`
              ),
              map: null,
            };
          }
          return null;
        },
      },
      reactRouter(),
      UnoCSS(),
      tsconfigPaths(),
      isProduction && optimizeCssModules({ apply: 'build' }),
      process.env.ANALYZE
        ? visualizer({
            filename: 'stats.html',
            open: true,
            gzipSize: true,
            brotliSize: true,
          })
        : false,
      isProduction &&
        process.env.SENTRY_AUTH_TOKEN &&
        sentryVitePlugin({
          org: process.env.SENTRY_ORG,
          project: process.env.SENTRY_PROJECT,
          authToken: process.env.SENTRY_AUTH_TOKEN,
          sourcemaps: {
            filesToDeleteAfterUpload: ['./build/**/*.map'],
          },
          telemetry: false,
        }),
    ].filter(Boolean) as PluginOption[],
    envPrefix: [
      'VITE_',
      'OPENAI_LIKE_API_BASE_URL',
      'OPENAI_LIKE_API_MODELS',
      'OLLAMA_API_BASE_URL',
      'LMSTUDIO_API_BASE_URL',
      'TOGETHER_API_BASE_URL',
      'SENTRY_DSN',
    ],
    css: {
      preprocessorOptions: {
        scss: {
          api: 'modern-compiler',
        },
      },
    },
    optimizeDeps: {
      include: [
        'react',
        'react-dom',
        'react/jsx-runtime',
        'react/jsx-dev-runtime',
        'react-dom/client',
        'react-dnd',
        'react-dnd-html5-backend',
        '@ai-sdk/react',
        '@nanostores/react',
        'framer-motion',
        'react-toastify',
        'react-markdown',
        'react-resizable-panels',
        'react-window',
        'react-qrcode-logo',
        'react-chartjs-2',
        'class-variance-authority',
        'date-fns',
        'diff',
        'dompurify',
        'shiki',
        'chart.js',
        'file-saver',
        'jspdf',
        'jszip',
        'ignore',
        'istextorbinary', // ✅ Оставляем для pre-bundle
        'js-cookie',
        'nanostores',
        'path-browserify',
        'mime',
        'rehype-raw',
        'rehype-sanitize',
        'remark-gfm',
        'unist-util-visit',
        'isomorphic-git',
        '@radix-ui/react-checkbox',
        '@radix-ui/react-collapsible',
        '@radix-ui/react-context-menu',
        '@radix-ui/react-dialog',
        '@radix-ui/react-dropdown-menu',
        '@radix-ui/react-label',
        '@radix-ui/react-popover',
        '@radix-ui/react-scroll-area',
        '@radix-ui/react-separator',
        '@radix-ui/react-switch',
        '@radix-ui/react-tabs',
        '@radix-ui/react-tooltip',
        '@radix-ui/react-visually-hidden',
        '@codemirror/autocomplete',
        '@codemirror/commands',
        '@codemirror/lang-cpp',
        '@codemirror/lang-css',
        '@codemirror/lang-html',
        '@codemirror/lang-javascript',
        '@codemirror/lang-json',
        '@codemirror/lang-markdown',
        '@codemirror/lang-python',
        '@codemirror/lang-sass',
        '@codemirror/lang-vue',
        '@codemirror/lang-wast',
        '@codemirror/language',
        '@codemirror/search',
        '@codemirror/state',
        '@codemirror/view',
        '@uiw/codemirror-theme-vscode',
        '@lezer/highlight',
        '@xterm/addon-fit',
        '@xterm/addon-web-links',
        '@xterm/xterm',
      ],
      exclude: ['undici'],
    },
  };
});
