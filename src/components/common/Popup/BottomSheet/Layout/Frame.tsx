import type { ReactNode } from 'react';

interface FrameProps {
  children: ReactNode;
  // 내부 padding/gap 등은 바텀시트 유형마다 달라서 호출부에서 지정
  className?: string;
  'aria-labelledby'?: string;
  'aria-describedby'?: string;
}

// 화면 끝까지의 하단 여백: 기본 4px, 홈 인디케이터가 있는 기기에서는 그만큼(env) 확보
const FRAME_BOTTOM_SPACING = 'max(0.25rem,env(safe-area-inset-bottom))';

// 바텀시트류 모달의 공통 틀(둥근 모서리·배경·그림자·화면 여백)을 관리.
// 실제 내용(아이콘/제목/버튼, 설정 목록 등)은 children으로 받아 그대로 렌더링한다.
export default function Frame({
  children,
  className,
  'aria-labelledby': ariaLabelledBy,
  'aria-describedby': ariaDescribedBy,
}: FrameProps) {
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby={ariaLabelledBy}
      aria-describedby={ariaDescribedBy}
      className={`flex flex-col items-center w-[calc(100%-8px)] bg-background-white rounded-medium shadow-[0px_0px_20px_0px_rgba(0,0,0,0.08)] overflow-clip ${className ?? ''}`}
      style={{ marginBottom: FRAME_BOTTOM_SPACING }}
      onClick={(e) => e.stopPropagation()}
    >
      {children}
    </div>
  );
}
