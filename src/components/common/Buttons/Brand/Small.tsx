import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface BrandButtonSmallProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children?: React.ReactNode;
}

export default function BrandButtonSmall({ children, className, ...props }: BrandButtonSmallProps) {
  return (
    <Button
      className={cn(
        "relative h-12 rounded-full overflow-hidden border-none",
        "font-[Pretendard] text-[15px] font-semibold text-white",
        "bg-white hover:bg-white px-6",
        "active:translate-y-0 focus-visible:ring-0 focus-visible:border-transparent",
        className
      )}
      {...props}
    >
      <span className="absolute inset-0 rounded-[inherit] shadow-[inset_0px_-10px_17.5px_0px_rgba(48,139,238,0.2),inset_0px_-10px_17.5px_0px_#e3fdf0,inset_-16px_-39px_19.6px_0px_rgba(41,200,120,0.6),inset_0px_-30px_21.6px_0px_#57f3a5,inset_20px_0px_10px_0px_#fcdfc5,inset_0px_-20px_10px_0px_#cfe4fc] pointer-events-none" />
      <span className="relative z-10 text-shadow-[0px_6px_13.9px_rgba(0,0,0,0.25)]">{children}</span>
    </Button>
  );
}
