import type { ReactNode } from 'react';

import './Frame.css';

interface FrameProps {
  children: ReactNode;
  // 내부 padding/gap 등은 바텀시트 유형마다 달라서 호출부에서 지정
  className?: string;
  'aria-labelledby'?: string;
  'aria-describedby'?: string;
}

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
      className={`flex flex-col items-center w-[calc(100%_-_8px)] bg-background-white rounded-medium shadow-[0px_0px_20px_0px_rgba(0,0,0,0.08)] overflow-clip frame-bottom-spacing frame-slide-up ${className ?? ''}`}
      onClick={(e) => e.stopPropagation()}
    >
      {children}
    </div>
  );
}
