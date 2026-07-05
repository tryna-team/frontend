import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface DefaultButtonSmallProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children?: React.ReactNode;
}

export default function DefaultButtonSmall({ children, className, ...props }: DefaultButtonSmallProps) {
  return (
    <Button
      className={cn(
        "h-12 rounded-[24px] px-6",
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
