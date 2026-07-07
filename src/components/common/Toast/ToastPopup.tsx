interface ToastPopupProps {
  GuideText: string;
  DetailText: string;
}

export default function ToastPopup({ GuideText, DetailText }: ToastPopupProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20">
      <div className="flex flex-col gap-2 bg-white rounded-[24px] drop-shadow-[0px_0px_10px_rgba(0,0,0,0.08)] py-4 px-5 w-[252px]">
        <p className="font-['Pretendard_Variable',Pretendard,sans-serif] text-[17px] font-semibold text-[#1C1630] leading-[26px] tracking-[-0.17px] w-full">
          {GuideText}
        </p>
        <p className="font-['Pretendard_Variable',Pretendard,sans-serif] text-[15px] font-medium text-[rgba(28,22,48,0.7)] leading-[22px] tracking-[-0.15px] w-full">
          {DetailText}
        </p>
      </div>
    </div>
  );
}
