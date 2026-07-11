import { ShadcnButton } from '@/components/ui/shadcnButton';

type HeaderProps = {
  title: string;
  leftText?: string;
  rightText?: string;
  showMenuButton?: boolean;
};

export default function Header({
  title,
  leftText,
  rightText,
  showMenuButton = false,
}: HeaderProps) {
  return (
    <header className="relative flex h-[52px] w-full items-center justify-between border-b border-[#EDEDF2] bg-white px-5">
      {/* Left */}
      <ShadcnButton
        type="button"
        variant="ghost"
        className="flex h-[25px] basis-[104px] items-center justify-start gap-2 p-0 hover:bg-transparent"
        aria-label="뒤로가기"
      >
        <img
          src="/icon/Header_back.png"
          alt="Back"
          className="h-6 w-6 object-contain"
        />

        {leftText && (
          <span className="flex h-[26px] w-[72px] items-center text-[17px] font-medium leading-6 tracking-[-0.43px] text-[#201A36]">
            {leftText}
          </span>
        )}
      </ShadcnButton>

      {/* Title */}
      <h1 className="absolute left-1/2 flex h-[26px] w-[157px] -translate-x-1/2 items-center justify-center text-center text-[17px] font-semibold leading-6 tracking-[-0.43px] text-[#201A36]">
        {title}
      </h1>

      {/* Right */}
      <div className="flex h-6 basis-[104px] items-center justify-end">
        {showMenuButton ? (
          <ShadcnButton
            type="button"
            variant="ghost"
            size="icon"
            className="h-6 w-6 p-0 hover:bg-transparent"
            aria-label="메뉴"
          >
            <img
              src="/icon/Header_hamburger.png"
              alt="Menu"
              className="h-6 w-6 object-contain"
            />
          </ShadcnButton>
        ) : rightText ? (
          <ShadcnButton
            type="button"
            variant="ghost"
            className="h-6 w-[104px] justify-end p-0 text-[17px] font-medium leading-6 tracking-[-0.43px] text-[#201A36] hover:bg-transparent"
            aria-label="오른쪽 버튼"
          >
            {rightText}
          </ShadcnButton>
        ) : (
          <div className="h-6 w-6" />
        )}
      </div>
    </header>
  );
}