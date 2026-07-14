// 코드래빗 적용_Escape 키 닫기, 다이얼로그 접근성 속성에 필요
import { useEffect, useId } from 'react';

import Button from '@/components/common/Buttons/Button';

interface QuickModalProps {
  message?: string;
  confirmText?: string;
  onConfirm: () => void;
  onClose: () => void;
}

export default function QuickModal({
  message = '이 이벤트를 삭제하시겠습니까?',
  confirmText = '이벤트 삭제',
  onConfirm,
  onClose,
}: QuickModalProps) {
  // 코드래빗 적용_aria-labelledby로 연결할 메시지 id
  const messageId = useId();

  // 코드래빗 적용_Escape 키로 모달 닫기
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  return (
    <>
      {/* 위치 고정 */}
      <div className="fixed inset-0 z-40" onClick={onClose} />
      {/* 코드래빗 적용_role/aria-modal/aria-labelledby로 다이얼로그임을 스크린 리더에 안내 */}
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={messageId}
        className="fixed top-144.75 left-1/2 -translate-x-1/2 z-50 bg-white rounded-[24px] drop-shadow-[0px_0px_10px_rgba(0,0,0,0.08)] flex flex-col gap-6 items-center py-4 w-61.25"
      >
        <div className="flex items-center pl-5 pr-3 w-full">
          {/* 코드래빗 적용_위 aria-labelledby가 참조하는 id */}
          <p id={messageId} className="font-['Pretendard_Variable',Pretendard,sans-serif] text-[17px] font-semibold text-[#1C1630] leading-6.5 tracking-[-0.17px] flex-1">
            {message}
          </p>
        </div>
        <div className="flex flex-col items-start px-6 w-full">
          <Button variant="LargeWarningRegular" className="w-full" onClick={onConfirm}>
            {confirmText}
          </Button>
        </div>
      </div>
    </>
  );
}
