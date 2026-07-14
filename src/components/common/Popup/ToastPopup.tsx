interface ToastPopupProps {
  GuideText: string;
  DetailText: string;
}

export default function ToastPopup({ GuideText, DetailText }: ToastPopupProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20">
      <div className="flex flex-col gap-2 bg-white rounded-[24px] drop-shadow-[0px_0px_10px_rgba(0,0,0,0.08)] py-4 px-5 w-[252px]">
        <p className="default-body-strong-large text-text-default w-full">
          {GuideText}
        </p>
        <p className="default-body-medium text-text-additional w-full">
          {DetailText}
        </p>
      </div>
    </div>
  );
}
