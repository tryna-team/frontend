// 코드래빗 적용_Escape 키 닫기, 다이얼로그 접근성 속성에 필요
import { useEffect, useId } from 'react';

import Button from '@/components/common/Buttons/Button';
import Overlay from '@/components/common/Popup/Overlay';
import Frame from '@/components/common/Popup/BottomSheet/Layout/Frame';

type IconType = 'default' | 'warning' | 'danger' | 'information';

const ICON_MAP: Record<IconType, string> = {
  default: '/icon/logo/Logo_Default.svg',
  warning: '/icon/logo/Logo_Warning.svg',
  danger: '/icon/logo/Logo_Danger.svg',
  information: '/icon/logo/Logo_Information.svg',
};

interface ModalProps {
  icon: IconType;
  title: string;
  description: string;
  confirmText: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel?: () => void;
  onClose: () => void;
}

export default function Modal({
  icon,
  title,
  description,
  confirmText,
  cancelText,
  onConfirm,
  onCancel,
  onClose,
}: ModalProps) {
  // 코드래빗 적용_aria-labelledby/aria-describedby로 연결할 제목·설명 id
  const titleId = useId();
  const descriptionId = useId();

  // 코드래빗 적용_Escape 키로 모달 닫기
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  return (
    <Overlay className="flex items-end justify-center" onClick={onClose}>
      <Frame className="gap-6 pt-5 pb-8 px-5" aria-labelledby={titleId} aria-describedby={descriptionId}>
        {/* 콘텐츠 영역 */}
        <div className="flex flex-col gap-2 items-start w-full">
          <img src={ICON_MAP[icon]} alt={icon} className="size-23 shrink-0 -m-2" />
          {/* 코드래빗 적용_위 aria-labelledby/aria-describedby가 참조하는 id */}
          <p id={titleId} className="default-heading-small text-text-default w-full">{title}</p>
          <p id={descriptionId} className="default-body-medium text-text-additional w-full">{description}</p>
        </div>

        {/* 버튼 영역 */}
        <div className="flex flex-col gap-3 items-center justify-center w-full shrink-0">
          <Button variant="LargeDefaultRegular" className="w-full" onClick={onConfirm}>
            {confirmText}
          </Button>
          {cancelText && (
            // 코드래빗 적용_onCancel 미전달 시 onClose로 대체(취소 버튼 먹통 방지)
            <Button variant="Small" onClick={onCancel ?? onClose}>
              {cancelText}
            </Button>
          )}
        </div>
      </Frame>
    </Overlay>
  );
}
