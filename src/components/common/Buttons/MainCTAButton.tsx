import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function MainCTAButton({
  className,
  type,
  "aria-label": ariaLabel,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <Button
      type={type ?? "button"}
      aria-label={ariaLabel ?? "일정 추가"}
      className={cn(
        "fixed right-5 bottom-5 z-50",
        "size-16 rounded-medium p-1.5",
        "bg-transparent hover:bg-transparent",
        "border-none shadow-none",
        "active:translate-y-0 focus-visible:ring-0 focus-visible:border-transparent",
        className
      )}
      {...props}
    >
      <span className="flex size-full items-center justify-center rounded-medium bg-text-default">
        <Plus className="size-6 text-icon-white" strokeWidth={2} />
      </span>
    </Button>
  );
}
