// public/icon의 svg 목록으로 IconPath 타입 파일(src/constants/iconPaths.ts)을 생성한다.
// - CLI: scripts/generate-icon-paths.mjs (npm run gen:icons, 빌드 전 prebuild에서 자동 실행)
// - Vite 플러그인: vite.config.ts의 iconPathsPlugin (개발 서버 시작 시, svg 추가·삭제 시)
import { existsSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';

export const ICON_DIR = 'public/icon';
export const OUTPUT_FILE = 'src/constants/iconPaths.ts';

const HEADER = '// ⚠️ 자동 생성 파일 — 직접 수정하지 마세요. (npm run gen:icons)';

function createContent(iconPaths) {
  if (iconPaths.length === 0) return `${HEADER}\nexport type IconPath = never;\n`;

  const members = iconPaths.map((iconPath) => `  | '${iconPath.replaceAll("'", "\\'")}'`);
  return `${HEADER}\nexport type IconPath =\n${members.join('\n')};\n`;
}

/**
 * IconPath 타입 파일을 생성한다. 내용이 바뀐 경우에만 파일을 쓰고 true를 반환한다.
 * @param {string} [root] 프로젝트 루트 (기본: 현재 작업 디렉터리)
 */
export function generateIconPaths(root = process.cwd()) {
  const iconPaths = readdirSync(path.join(root, ICON_DIR), { recursive: true })
    .map((file) => file.split(path.sep).join('/'))
    .filter((file) => file.endsWith('.svg'))
    .sort();

  const content = createContent(iconPaths);
  const outputPath = path.join(root, OUTPUT_FILE);
  // git이 줄바꿈을 CRLF로 바꿔 둔 경우(Windows)에도 같은 내용으로 보고 다시 쓰지 않는다
  const current = existsSync(outputPath)
    ? readFileSync(outputPath, 'utf8').replace(/\r\n/g, '\n')
    : null;
  if (current === content) return false;

  writeFileSync(outputPath, content);
  return true;
}
