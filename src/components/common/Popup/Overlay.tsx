import { useEffect, type MouseEvent, type ReactNode } from 'react';

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
  // 부피가 큰 모달(예: h-[92dvh] Frame)이 뜰 때 배경 페이지가 같이 스크롤되지 않게
  // 잠근다. 스크롤바 자체는 index.css의 `html { scrollbar-gutter: stable }`가 항상
  // 자리를 예약해 두므로, 여기서 폭을 따로 보정하지 않아도 잠그고 풀 때 레이아웃이
  // 움찔거리거나 한쪽으로 치우치지 않는다. 오버레이가 여러 겹 뜰 수 있어(예: 일정 수정
  // 시트 위에 일정 설정 시트) 매번 "잠그기 직전 값"을 저장했다가 복원하는 방식으로
  // 중첩에도 안전하게 만든다.
  useEffect(() => {
    const { body } = document;
    const previousOverflow = body.style.overflow;

    body.style.overflow = 'hidden';

    return () => {
      body.style.overflow = previousOverflow;
    };
  }, []);

  return (
    <div
      className={`fixed inset-0 z-50 bg-grey-opacity-200 ${className ?? ''}`}
      onClick={onClick}
    >
      {children}
    </div>
  );
}
