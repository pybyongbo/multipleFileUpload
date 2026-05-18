import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import path from 'path'
import vueJsx from '@vitejs/plugin-vue-jsx';
import { createHtmlPlugin } from 'vite-plugin-html';
import { createSvgIconsPlugin } from 'vite-plugin-svg-icons'


function createSvgIcon(isBuild) {
    return createSvgIconsPlugin({
		iconDirs: [path.resolve(process.cwd(), 'src/assets/icons/svg')],
        symbolId: 'icon-[dir]-[name]',
        svgoOptions: isBuild
    })
}
// https://vite.dev/config/
export default defineConfig({
    base: '',
    plugins: [vue(), vueJsx(), createHtmlPlugin(),
    createSvgIcon(process.env.NODE_ENV === 'production')
    ],
    resolve: {
      alias: {
        '@': path.join(__dirname, 'src'),
        '/image': '/src/assets/images',
      },
      extensions: ['.vue','.mjs', '.js', '.ts', '.jsx', '.tsx', '.json'],
    },
    server: {
      host: true, // 同时监听 localhost 与 127.0.0.1（微信本地调试常用 127.0.0.1）
      port: 5173,
      open: false,
    },
build: {
    chunkSizeWarningLimit: 1000,
    outDir: 'dist', // 打包后文件包名称
    
    rollupOptions: {
      output: {
        entryFileNames: 'js/[name]-[hash].js',
        chunkFileNames: 'js/[name]-[hash].js',
        assetFileNames: (assetInfo) => {
          if (assetInfo.name.endsWith('.css')) {
            return 'css/[name]-[hash].css';
          }
          const imgExts = [
            '.png',
            '.jpg',
            '.jpeg',
            '.webp',
            '.svg',
            '.gif',
            '.ico',
          ];
          if (imgExts.some((ext) => assetInfo.name.endsWith(ext))) {
            return 'imgs/[name]-[hash].[ext]';
          }
          return 'assets/[name]-[hash].[ext]';
        },
        manualChunks(id) {
          if (id.includes('node_modules')) {
            return id
              .toString()
              .split('node_modules/')[1]
              .split('/')[0]
              .toString();
          }
        },
      },
    },
    minify: 'terser', // 启用 terser 压缩
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true,
      },
    },
  },
});