import type { MouseEvent, ReactNode } from 'react';

interface OverlayProps {
  children: ReactNode;
  // 배경(dim) 클릭 시 닫기 등. 전달 안 하면 배경 클릭에 반응하지 않음.
  // 이벤트를 받는 이유: 호출부가 이 클릭이 자신의 부모(다른 Overlay 등)로
  // 버블링되는 걸 막아야 할 때(event.stopPropagation()) 필요하다.
  onClick?: (event: MouseEvent<HTMLDivElement>) => void;
  // 콘텐츠 정렬/배치(예: items-end justify-center)는 각 호출부에서 지정
  className?: string;
}

// BottomSheet/ToastPopup 등 화면 전체를 덮는 dim 배경 색상만 담당.
// 콘텐츠를 화면 안에서 어디에 둘지는 이 컴포넌트가 알 필요 없이 각 호출부가 결정한다.
export default function Overlay({ children, onClick, className }: OverlayProps) {
  return (
    <div
      className={`fixed inset-0 z-50 bg-grey-opacity-200 ${className ?? ''}`}
      onClick={onClick}
    >
      {children}
    </div>
  );
}
