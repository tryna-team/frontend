import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import path from 'path';
import { ICON_DIR, generateIconPaths } from './scripts/icon-paths.mjs';

// public/icon의 svg 목록으로 IconPath 타입(src/constants/iconPaths.ts)을 생성한다.
// 개발 서버 시작·빌드 시 한 번 생성하고, 개발 중에는 svg가 추가·삭제될 때마다 다시 생성한다.
function iconPathsPlugin(): Plugin {
  let root = process.cwd();

  return {
    name: 'tryna:icon-paths',
    configResolved(config) {
      root = config.root;
    },
    buildStart() {
      generateIconPaths(root);
    },
    configureServer(server) {
      const iconDir = path.resolve(root, ICON_DIR);
      const regenerateIfIcon = (file: string) => {
        const relativePath = path.relative(iconDir, file);
        const isOutside = relativePath.startsWith(`..${path.sep}`) || path.isAbsolute(relativePath);
        if (!isOutside && file.endsWith('.svg')) generateIconPaths(root);
      };

      server.watcher.add(iconDir);
      server.watcher.on('add', regenerateIfIcon);
      server.watcher.on('unlink', regenerateIfIcon);
    },
  };
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss(), iconPathsPlugin()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
