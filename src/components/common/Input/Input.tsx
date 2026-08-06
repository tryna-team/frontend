import Button from '@/components/common/Buttons/Button';

type InputTrailingAction = {
  label: string;
  onClick?: () => void;
  disabled?: boolean;
};

type InputProps = {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  ariaLabel?: string;
  // x 버튼 자리 — 라벨 수정 Input은 이것만 사용
  onClear?: () => void;
  // 텍스트 버튼 자리 — 검색 Input의 "닫기", CreateModal Input의 "생성" 등
  trailingAction?: InputTrailingAction;
  className?: string;
};

// 박스(배경/그림자/패딩)는 포함하지 않음 — 사용처의 상위 컨테이너가 담당.
// onClear/trailingAction 조합으로 검색 Input(x + 닫기), CreateModal Input(생성만)의
// 자리도 확보해뒀지만, 두 파일에 실제로 적용하는 작업은 이번 범위에서 제외함.
export default function Input({
  value,
  onChange,
  placeholder,
  ariaLabel,
  onClear,
  trailingAction,
  className,
}: InputProps) {
  return (
    <div className={`flex w-full items-center gap-2 ${className ?? ''}`}>
      <input
        type="text"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        aria-label={ariaLabel}
        className="h-9 min-w-0 flex-1 bg-transparent pl-1 text-text-default outline-none placeholder:text-text-disable default-body-medium"
      />

      {(onClear || trailingAction) && (
        <div className="flex shrink-0 items-center gap-2">
          {onClear && (
            <Button
              variant="Icon"
              icon="icons/delete_small.svg"
              alt="입력 지우기"
              hitArea="small"
              onClick={onClear}
            />
          )}

          {trailingAction && (
            <Button
              variant="MediumDefaultFit"
              onClick={trailingAction.onClick}
              disabled={trailingAction.disabled}
            >
              {trailingAction.label}
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
