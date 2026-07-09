import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface IconButtonProps extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "children"> {
  /** public/icon 기준 상대 경로 (예: "icons/plus_medium.svg") */
  icon: string;
  /** 스크린 리더용 버튼 설명 */
  alt: string;
  /** 아이콘 자체의 가로/세로 크기(px). 지정하지 않으면 svg 파일의 원본 크기를 사용합니다. */
  size?: number;
}

export default function IconButton({ icon, alt, size, className, type, ...props }: IconButtonProps) {
  return (
    <Button
      type={type ?? "button"}
      className={cn(
        "h-auto w-auto p-0 rounded-none",
        "bg-transparent hover:bg-transparent",
        "border-none shadow-none",
        "active:translate-y-0 focus-visible:ring-0 focus-visible:border-transparent",
        className
      )}
      {...props}
    >
      <img src={`/icon/${icon}`} alt={alt} width={size} height={size} />
    </Button>
  );
}
