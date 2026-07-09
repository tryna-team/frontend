import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface MediumStrongFullButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children?: React.ReactNode;
}

export default function MediumStrongFullButton({ children, className, ...props }: MediumStrongFullButtonProps) {
  return (
    <Button
      className={cn(
        "w-[358px] h-9 rounded-medium px-0",
        "bg-grey-opacity-100 hover:bg-grey-opacity-100",
        "default-body-large text-text-default",
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
