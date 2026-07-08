import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface WarningButtonMediumProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children?: React.ReactNode;
}

export default function WarningButtonMedium({ children, className, ...props }: WarningButtonMediumProps) {
  return (
    <Button
      className={cn(
        "h-12 rounded-[24px] px-15",
        "bg-[rgba(28,22,48,0.05)] hover:bg-[rgba(28,22,48,0.05)]",
        "font-[Pretendard] text-[17px] font-semibold text-[#FF3E41]",
        "border-none shadow-none",
        "active:translate-y-0 focus-visible:ring-0 focus-visible:border-transparent",
        className
      )}
      {...props}
    >
      {children}
    </Button>
  );
}
