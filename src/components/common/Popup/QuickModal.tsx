// 코드래빗 적용_Escape 키 닫기, 다이얼로그 접근성 속성에 필요
import { useEffect, useId } from 'react';

import Button from '@/components/common/Buttons/Button';
import type { TextButtonType } from '@/components/common/Buttons/ButtonType';

interface QuickModalAction {
  text: string;
  onClick: () => void;
}

interface QuickModalProps {
  message?: string;
  // 반복 일정 삭제처럼 선택지가 두 개 필요한 경우 secondaryAction을 같이 전달한다
  // (Figma "3-3. 이벤트 뷰/이벤트 삭제" 참고 — 두 버튼 모두 동일한 위험 액션 스타일).
  primaryAction: QuickModalAction;
  secondaryAction?: QuickModalAction;
  onClose: () => void;
  // 다이얼로그 자체 너비. 기본은 삭제/로그아웃류 확인창 폭 — 버튼 라벨이 길어지는
  // 호출부(예: 일정 수정 "완료" 시 저장 범위 선택)에서만 넓게 덮어쓴다.
  widthClassName?: string;
  // 버튼 색상/스타일. 기본은 삭제류 위험 액션을 나타내는 빨간색(LargeWarningRegular).
  buttonVariant?: TextButtonType;
  // 기본은 'default'(화면 하단에서 22.75 여백을 두고 고정). 'bottom'은 바닥에서
  // 아주 살짝만(safe area 고려) 띄운 위치 — 일정 수정 저장 범위 확인 모달 전용.
  // 'top'은 반복/체크리스트 등으로 콘텐츠가 길어 하단 고정 위치가 가려지기 쉬운
  // 호출부에서 헤더 바로 아래에 띄울 때 쓴다.
  position?: 'default' | 'bottom' | 'top';
}

export default function QuickModal({
  message = '이 이벤트를 삭제하시겠습니까?',
  primaryAction,
  secondaryAction,
  onClose,
  widthClassName = 'w-61.25',
  buttonVariant = 'LargeWarningRegular',
  position = 'default',
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
      {/* 공용 Overlay(z-50) 위에서 바깥 클릭을 정상적으로 가로챈다. */}
      <div className="fixed inset-0 z-60" onClick={onClose} />
      {/* 코드래빗 적용_role/aria-modal/aria-labelledby로 다이얼로그임을 스크린 리더에 안내 */}
      {/*
        위치: position='default'는 모바일 화면(뷰포트) 하단 기준 고정. 기존엔
        top-144.75(임의의 절대 픽셀 값)라 페이지 레이아웃이 바뀌면 위치가 어긋났음. Figma
        "이벤트 뷰/이벤트 삭제" 프레임(node 1246:16377, 852px 높이) 기준 QuickModal
        인스턴스(node 1296:22740, y=579, h=182) 좌표로 계산한 바닥 여백
        852-(579+182)=91px을 bottom에 적용해 화면 하단(플로팅 삭제 버튼 바로 위)에
        안정적으로 고정.

        position='bottom'은 default보다 더 아래, 바닥에 거의 붙되 살짝만 띄운 위치 —
        일정 수정(EventEditBottomSheet) 저장 범위 확인 모달 전용. 최소 0.75rem을
        띄우고, 홈 인디케이터가 있으면 safe-area-inset-bottom만큼 자동으로 더 확보한다.

        position='top'은 반복/체크리스트 등으로 콘텐츠가 길어 하단 고정 위치가
        가려지기 쉬운 호출부에서 헤더 바로 아래에 띄울 때 쓴다. 오프셋 계산: Overlay가
        Frame(h-[92dvh])을 화면 하단에 붙이므로 Frame 상단은 뷰포트 위에서 8dvh 지점,
        그 안 헤더 wrapper의 pt-4(16px) + Header modal variant 높이(68px, Header.tsx
        HEADER_STYLE.modal.container)를 더해 헤더 바로 아래 지점을 계산한다.
      */}
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={messageId}
        className={`fixed ${
          position === 'top'
            ? 'top-[calc(8dvh+84px)]'
            : position === 'bottom'
              ? 'bottom-[max(2rem,env(safe-area-inset-bottom))]'
              : 'bottom-22.75'
        } left-1/2 z-70 flex ${widthClassName} -translate-x-1/2 flex-col items-center gap-6 rounded-medium bg-white py-4 drop-shadow-[0px_0px_10px_rgba(0,0,0,0.08)]`}
      >
        <div className="flex items-center pl-5 pr-3 w-full">
          {/* 코드래빗 적용_위 aria-labelledby가 참조하는 id */}
          <p
            id={messageId}
            className="font-['Pretendard_Variable',sans-serif] text-[17px] font-semibold text-[#1C1630] leading-6.5 tracking-[-0.17px] flex-1"
          >
            {message}
          </p>
        </div>
        <div className="flex flex-col items-start gap-2 px-6 w-full">
          <Button variant={buttonVariant} className="w-full" onClick={primaryAction.onClick}>
            {primaryAction.text}
          </Button>
          {secondaryAction && (
            <Button variant={buttonVariant} className="w-full" onClick={secondaryAction.onClick}>
              {secondaryAction.text}
            </Button>
          )}
        </div>
      </div>
    </>
  );
}
