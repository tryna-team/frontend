import Overlay from '@/components/common/Popup/Overlay';
import Button from '@/components/common/Buttons/Button';

interface ToastPopupProps {
  GuideText: string;
  DetailText?: string;
  confirmText?: string;
  onConfirm?: () => void;
  onClose?: () => void;
}

export default function ToastPopup({
  GuideText,
  DetailText,
  confirmText,
  onConfirm,
  onClose,
}: ToastPopupProps) {
  return (
    <Overlay
      className="flex items-center justify-center"
      onClick={(event) => {
        // 코드래빗 리뷰 반영: 이 Overlay 자체가 ToastPopup을 다른 Overlay(예: LabelEditSheet)
        // 안에 형제로 띄우는 화면에서는 DOM상 중첩된다. stopPropagation 없이 onClose만
        // 부르면 이 클릭이 바깥 Overlay까지 버블링돼, 토스트만 닫으려던 탭이 그 바깥
        // 시트까지 같이 닫아버리고(저장 안 한 입력을 날림) 만다.
        event.stopPropagation();
        onClose?.();
      }}
    >
      {/* 카드 자체는 클릭을 막지 않는다 — 화면 어디를 눌러도(카드 포함) 위 Overlay의
          onClick(onClose)까지 그대로 버블링돼 토스트가 닫힌다. 확인 버튼만 자기
          onClick에서 전파를 막아, 누르면 onConfirm만 실행되고 곧바로 닫히지 않는다. */}
      <div
        role="alertdialog"
        aria-label={GuideText}
        className="flex w-[252px] flex-col gap-2 rounded-[24px] bg-white px-5 py-4 drop-shadow-[0px_0px_10px_rgba(0,0,0,0.08)]"
      >
        <p className="w-full text-text-default default-body-strong-large">{GuideText}</p>
        {DetailText && (
          <p className="w-full text-text-additional default-body-medium">{DetailText}</p>
        )}
        {confirmText && onConfirm && (
          <Button
            variant="MediumDefaultFit"
            className="w-full"
            onClick={(event) => {
              event.stopPropagation();
              onConfirm();
            }}
          >
            {confirmText}
          </Button>
        )}
      </div>
    </Overlay>
  );
}
