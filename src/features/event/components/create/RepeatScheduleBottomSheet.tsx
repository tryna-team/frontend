import { useEffect, useId } from 'react';

import Button from '@/components/common/Buttons/Button';
import { useCreateModalViewport } from '@/components/common/CreateModal/hooks/useViewport';
import Frame from '@/components/common/Popup/BottomSheet/Layout/Frame';
import Overlay from '@/components/common/Popup/Overlay';

import ScheduleDateTimeFields, { type ScheduleDateTimeFieldsProps } from './ScheduleDateTimeFields';

// 하루종일/시작·종료/반복 필드 자체는 ScheduleDateTimeFields로 옮겼다(EventEditBottomSheet도
// 동일 컴포넌트를 인라인으로 재사용). 이 컴포넌트는 그 필드들을 바텀시트 껍데기(Overlay/Frame/
// 배경비디오/Escape 닫기/"닫기" 버튼)로 감싸는 역할만 한다 — footer는 이 컴포넌트가 직접
// 채우므로 외부에 노출하지 않는다(호출부가 중복으로 넘기지 못하게 Omit).
export type RepeatScheduleBottomSheetProps = Omit<ScheduleDateTimeFieldsProps, 'footer'> & {
  onClose: () => void;
  // 일정 생성 모달(CreateModal)에서 쓰던 배경 비디오. 생성 흐름이 아닌 곳(수정 등)에서는
  // 어울리지 않아 꺼둘 수 있게 옵션으로 뺐다. 기존 사용처(CreateModal) 동작은 그대로 유지.
  showBackgroundVideo?: boolean;
};

export default function RepeatScheduleBottomSheet({
  onClose,
  showBackgroundVideo = true,
  ...fieldsProps
}: RepeatScheduleBottomSheetProps) {
  const titleId = useId();
  const { appFrameRect } = useCreateModalViewport();

  // Escape 입력으로 바텀시트를 닫는다.
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  return (
    <Overlay className="flex items-end justify-center" onClick={onClose}>
      {showBackgroundVideo && (
        <video
          src="/BlendDimVideo.mp4"
          autoPlay
          loop
          muted
          playsInline
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 z-0 h-full w-full object-cover opacity-100"
        />
      )}

      <div
        className="absolute z-10 flex items-end justify-center"
        style={{
          left: appFrameRect.left,
          width: appFrameRect.width,
          top: 0,
          bottom: 0,
        }}
      >
        <Frame
          data-scroll-lock-allow="true"
          // 콘텐츠가 화면 높이를 초과하는 경우에만 세로 스크롤을 허용한다.
          className="max-h-[calc(100dvh-16px)] overflow-y-auto overscroll-contain gap-2 !bg-white px-4 pt-5 pb-1"
          aria-labelledby={titleId}
        >
          <h2 id={titleId} className="sr-only">
            반복 일정 설정
          </h2>

          <ScheduleDateTimeFields
            {...fieldsProps}
            footer={
              <Button variant="LargeDefaultFull" onClick={onClose}>
                닫기
              </Button>
            }
          />
        </Frame>
      </div>
    </Overlay>
  );
}
