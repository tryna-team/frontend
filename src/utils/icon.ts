import type { IconPath } from '@/constants/iconPaths';

/** public/icon 기준 경로(IconPath)를 실제 src 경로로 변환 */
export const iconSrc = (path: IconPath) => `/icon/${path}`;
