import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ClearButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children?: React.ReactNode;
}

export default function ClearButton({ children, className, ...props }: ClearButtonProps) {
  return (
    <Button
      className={cn(
        "h-12 rounded-[24px] px-6",
        "bg-transparent hover:bg-transparent",
        "font-[Pretendard] text-[13px] font-normal text-[#1C1630]",
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
