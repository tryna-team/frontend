export const hitAreaPresetPx = { small: 24, medium: 36, large: 48 } as const;

type HitAreaValue = number | keyof typeof hitAreaPresetPx;
export type HitArea = HitAreaValue | { width?: HitAreaValue; height?: HitAreaValue };

export interface HitAreaProps {
  /**
   * 실제 버튼(클릭) 영역. 숫자/프리셋이면 정사각형, 객체면 가로·세로를 각각 지정한다. 생략 시 콘텐츠 크기.
   * 인라인 style로 적용되므로 className의 너비·높이보다 우선하며, 사용자 style이 가장 우선한다.
   */
  hitArea?: HitArea;
}

const toPx = (value?: HitAreaValue) =>
  value === undefined ? undefined : typeof value === 'number' ? value : hitAreaPresetPx[value];

/** hitArea 값을 style에 넣을 { width, height }(px)로 변환한다 */
export function resolveHitAreaSize(hitArea?: HitArea): { width?: number; height?: number } {
  if (hitArea === undefined) return {};
  if (typeof hitArea !== 'object') return { width: toPx(hitArea), height: toPx(hitArea) };
  return { width: toPx(hitArea.width), height: toPx(hitArea.height) };
}
