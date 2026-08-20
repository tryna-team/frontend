import { clsx, type ClassValue } from "clsx"
import { extendTailwindMerge } from "tailwind-merge"

// tailwind-merge는 표준 Tailwind 클래스(rounded-sm/md/lg/xl 등)끼리의 충돌만 기본
// 인식한다. @tryna/tds가 만드는 커스텀 radius 클래스(rounded-xsmall/small/medium/large,
// --radius-*  토큰 기반)는 이름이 달라서 충돌로 인식되지 않아, shadcn 기본 Button의
// rounded-lg와 우리 Button.tsx가 얹는 rounded-medium이 둘 다 살아남는 문제가 있었다
// (어느 게 이기는지는 그 시점 컴파일된 CSS의 규칙 순서에 좌우돼 dev/프로덕션에서
// 결과가 달랐다 — 프로덕션 빌드의 모든 버튼이 모서리가 각지게 보이던 원인).
// classGroups에 등록해서 표준 rounded-* 그룹과 같은 충돌 그룹으로 취급하게 한다.
const twMerge = extendTailwindMerge({
  extend: {
    classGroups: {
      rounded: ["rounded-xsmall", "rounded-small", "rounded-medium", "rounded-large"],
    },
  },
})

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
