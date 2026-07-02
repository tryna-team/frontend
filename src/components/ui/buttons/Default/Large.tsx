import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface DefaultButtonLargeProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children?: React.ReactNode;
}

export default function DefaultButtonLarge({ children, className, ...props }: DefaultButtonLargeProps) {
  return (
    <Button
      className={cn(
        "w-[358px] h-12 rounded-[24px]",
        "bg-[rgba(28,22,48,0.05)] hover:bg-[rgba(28,22,48,0.05)]",
        "font-[Pretendard] text-[15px] font-semibold text-[#1C1630]",
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
