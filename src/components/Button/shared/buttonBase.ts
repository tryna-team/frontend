import type { ComponentPropsWithRef } from 'react';

/** 모든 버튼 공통 props: <button> 기본 속성. children 허용 여부는 버튼별로 정의한다 */
export type ButtonBaseProps = Omit<ComponentPropsWithRef<'button'>, 'children'>;

/** 정렬 · 키보드 포커스 표시 · disabled 동작 등 모든 버튼 공통 스타일 */
export const buttonBaseClassName = [
  'inline-flex shrink-0 items-center justify-center whitespace-nowrap',
  'border-none bg-transparent outline-none select-none transition-all',
  'focus-visible:ring-3 focus-visible:ring-ring/50', // tds에 focus 토큰이 없어 index.css의 --ring 사용
  'disabled:pointer-events-none disabled:text-text-disable',
  '[&_svg]:pointer-events-none [&_svg]:shrink-0',
].join(' ');
