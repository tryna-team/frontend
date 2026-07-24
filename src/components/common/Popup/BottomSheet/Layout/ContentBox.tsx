import type { ReactNode } from 'react';

interface ContentBoxProps {
  // 박스 상단에 표시되는 섹션 제목 (예: "Gmail", "tryna")
  title: string;
  children: ReactNode;
  // 'default': 일반 유형(그림자로 카드가 떠 있는 느낌)
  // 'bottom' : 가장 밑의 컨텐츠박스(그림자 없이 경계가 흐려지는 느낌)
  variant?: 'default' | 'bottom';
}

const VARIANT_SHADOW_CLASSNAMES: Record<NonNullable<ContentBoxProps['variant']>, string> = {
  default: 'shadow-[0px_4px_8px_rgba(0,0,0,0.04),0px_9.701px_29.104px_rgba(0,0,0,0.1)]',
  bottom: '',
};

// 바텀시트 안에서 반복되는 "제목 + 목록" 형태의 컨텐츠 박스.
// 라벨 수정처럼 여러 개를 세로로 쌓아 쓸 때, 마지막 박스만 variant="bottom"으로 지정한다.
export default function ContentBox({ title, children, variant = 'default' }: ContentBoxProps) {
  return (
    <div
      className={`flex w-full flex-col items-start gap-3 rounded-medium bg-background-white pb-1 ${VARIANT_SHADOW_CLASSNAMES[variant]}`}
    >
      <div className="flex w-full items-center justify-center pt-3 pl-4">
        <p className="default-body-medium w-full flex-1 text-text-additional">{title}</p>
      </div>
      <div className="flex w-full flex-col items-start px-3">{children}</div>
    </div>
  );
}
