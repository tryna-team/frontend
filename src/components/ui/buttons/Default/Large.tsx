import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface DefaultButtonLargeProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children?: React.ReactNode;
}

export default function DefaultButtonLarge({ children, className, ...props }: DefaultButtonLargeProps) {
  return (
    <Button
      className={cn(
        "w-[358px] h-[48px] rounded-[24px]",
        "bg-[rgba(28,22,48,0.05)] hover:bg-[rgba(28,22,48,0.08)]",
        "shadow-[0px_0px_20px_0px_rgba(0,0,0,0.08)]",
        "font-[Pretendard] text-[15px] font-semibold text-[#1C1630]",
        "border-none",
        className
      )}
      {...props}
    >
      {children}
    </Button>
  );
}
