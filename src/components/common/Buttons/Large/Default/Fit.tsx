import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface LargeDefaultFitButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children?: React.ReactNode;
}

export default function LargeDefaultFitButton({ children, className, ...props }: LargeDefaultFitButtonProps) {
  return (
    <Button
      className={cn(
        "h-12 rounded-medium px-6",
        "bg-grey-opacity-100 hover:bg-grey-opacity-100",
        "default-body-strong-medium text-text-default",
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
