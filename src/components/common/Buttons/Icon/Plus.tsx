import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface PlusButtonProps {
  onClick: () => void;
  className?: string;
}

export default function PlusButton({ onClick, className }: PlusButtonProps) {
  return (
    <Button
      onClick={onClick}
      className={cn(
        "fixed bottom-6 right-6 size-[92px] p-0 border-none shadow-none bg-transparent hover:bg-transparent",
        "active:translate-y-0 focus-visible:ring-0 focus-visible:border-transparent",
        className
      )}
    >
      <img src="/icon/Icon_Plus.svg" alt="추가" className="size-full" />
    </Button>
  );
}
