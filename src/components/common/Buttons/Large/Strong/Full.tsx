import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface LargeStrongFullButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children?: React.ReactNode;
}

export default function LargeStrongFullButton({ children, className, ...props }: LargeStrongFullButtonProps) {
  return (
    <Button
      className={cn(
        "w-[358px] h-12 rounded-medium px-0",
        "bg-grey-opacity-100 hover:bg-grey-opacity-100",
        "default-body-strong-large text-text-default",
        "border-none shadow-none",
        "active:translate-y-0 focus-visible:ring-0 focus-visible:border-transparent",
        "disabled:text-text-disable disabled:opacity-100",
        className
      )}
      {...props}
    >
      {children}
    </Button>
  );
}
