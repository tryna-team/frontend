import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface WarningButtonMediumProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children?: React.ReactNode;
}

export default function WarningButtonMedium({ children, className, ...props }: WarningButtonMediumProps) {
  return (
    <Button
      className={cn(
        "h-[48px] rounded-[24px] px-[60px]",
        "bg-[rgba(28,22,48,0.05)] hover:bg-[rgba(28,22,48,0.08)]",
        "shadow-[0px_0px_20px_0px_rgba(0,0,0,0.08)]",
        "font-[Pretendard] text-[17px] font-semibold text-[#FF3E41]",
        "border-none",
        className
      )}
      {...props}
    >
      {children}
    </Button>
  );
}
