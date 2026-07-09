import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface SmallDefaultButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children?: React.ReactNode;
}

export default function SmallDefaultButton({ children, className, ...props }: SmallDefaultButtonProps) {
  return (
    <Button
      className={cn(
        "h-auto rounded-none px-0.5 py-0",
        "bg-transparent hover:bg-transparent",
        "default-body-medium text-text-additional",
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
