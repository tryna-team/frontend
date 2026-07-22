import Overlay from '@/components/common/Popup/Overlay';

interface ToastPopupProps {
  GuideText: string;
  DetailText: string;
}

export default function ToastPopup({ GuideText, DetailText }: ToastPopupProps) {
  return (
    <Overlay className="flex items-center justify-center">
      <div className="flex flex-col gap-2 bg-white rounded-[24px] drop-shadow-[0px_0px_10px_rgba(0,0,0,0.08)] py-4 px-5 w-[252px]">
        <p className="default-body-strong-large text-text-default w-full">
          {GuideText}
        </p>
        <p className="default-body-medium text-text-additional w-full">
          {DetailText}
        </p>
      </div>
    </Overlay>
  );
}
