// scripts/icon-paths.mjs의 타입 선언 (vite.config.ts에서 import할 때 사용)

/** 아이콘 svg 폴더 (프로젝트 루트 기준) */
export declare const ICON_DIR: 'public/icon';

/** 생성되는 IconPath 타입 파일 (프로젝트 루트 기준) */
export declare const OUTPUT_FILE: 'src/constants/iconPaths.ts';

/** IconPath 타입 파일을 생성한다. 내용이 바뀐 경우에만 파일을 쓰고 true를 반환한다 */
export declare function generateIconPaths(root?: string): boolean;
