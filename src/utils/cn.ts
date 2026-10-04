import { clsx, type ClassValue } from 'clsx';
import { extendTailwindMerge } from 'tailwind-merge';

// cn(): 조건부 클래스 합치기(clsx) + 같은 CSS 속성을 지정하는 클래스 중 뒤의 것만 남기기(tailwind-merge).
//
// tailwind-merge는 Tailwind 기본 이름 규칙(sm/md/lg, 숫자 등)만 알고 있어서
// @tryna/tds 토큰(rounded-medium, px-padding-xlarge, gap-xsmall 등)을 충돌로 인식하지 못한다.
// 이 경우 두 클래스가 모두 남고, className 순서가 아닌 CSS 선언 순서로 결과가 정해진다.
// (사용처의 className 덮어쓰기가 무시되거나, dev와 프로덕션 결과가 달라질 수 있음)
// → tds 토큰을 아래처럼 등록한다. tds에 토큰이 추가되면 이 목록도 갱신할 것.
//
// TODO: 이 목록은 tds와 수동으로 맞춰야 한다. @tryna/tds 패키지가 tailwind-merge 설정
// (예: `tdsMergeConfig`)을 함께 export하도록 바꾸면, 토큰 추가 시 자동으로 동기화되어
// 이 목록을 관리할 필요가 없어진다.
const twMerge = extendTailwindMerge({
  extend: {
    // tds가 @theme 변수(--radius-*, --spacing-*)로 정의한 토큰은 "값 이름"을 등록한다.
    // → rounded-t-medium, px-padding-xlarge 등 모든 접두사 조합을 인식한다.
    theme: {
      radius: ['xsmall', 'small', 'medium', 'large'],
      spacing: [
        'padding-xxsmall',
        'padding-xsmall',
        'padding-small',
        'padding-medium',
        'padding-large',
        'padding-xlarge',
        'margin-xxsmall',
        'margin-xsmall',
        'margin-small',
        'margin-medium',
        'margin-large',
      ],
    },
    // tds가 @utility로 클래스 자체를 정의한 토큰은 클래스 이름을 그대로 등록한다.
    classGroups: {
      gap: ['gap-xsmall', 'gap-small', 'gap-medium', 'gap-large', 'gap-xlarge'],
    },
  },
});

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
