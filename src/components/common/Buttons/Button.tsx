import type { ReactNode } from "react";
import { format } from "date-fns";
import { Plus } from "lucide-react";

import { ShadcnButton } from "@/components/ui/shadcnButton";
import { cn } from "@/lib/utils";
import {
  buttonVariants,
  chipButtonClassNames,
  gapClassNames,
  iconButtonClassNames,
  iconTextButtonClassNames,
  mainCTAButtonClassNames,
  resolveHitAreaSize,
  textColorClassNames,
  textStyleClassNames,
  widthClassNames,
  type ButtonGap,
  type ButtonHitArea,
} from "./ButtonVariants";
import {
  iconTextButtonConfig,
  textButtonConfig,
  type IconTextButtonType,
  type TextButtonType,
} from "./ButtonType";

type ButtonBaseProps = Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "children">;

// 칩에 표시할 날짜. actionItem API의 EventActionItem.displayDate/TimedActionItem.displayDate
// ('YYYY-MM-DD' 문자열 | null)를 가공 없이 그대로 넘길 수 있도록 string | Date | null을 모두 허용.
export type ChipButtonDate = Date | string | null;

const CHIP_DATE_FORMAT = "MM. dd.";

// ActionItemChecklistSection.formatEventDate와 동일한 방식으로 'YYYY-MM-DD' 문자열을
// 로컬 자정 기준으로 파싱한다 — new Date('YYYY-MM-DD')는 UTC 자정으로 해석되어
// 음수 UTC 오프셋 시간대에서 하루 밀리는 문제가 있다.
function parseChipDate(date?: ChipButtonDate): Date | null {
  if (!date) return null;
  const parsed =
    date instanceof Date
      ? date
      : /^\d{4}-\d{2}-\d{2}$/.test(date)
        ? new Date(`${date}T00:00:00`)
        : new Date(date);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

type TextButtonRenderProps = ButtonBaseProps & {
  variant: TextButtonType;
  children: ReactNode;
  icon?: never;
  alt?: never;
  size?: never;
};

type IconButtonRenderProps = ButtonBaseProps & {
  variant: "Icon";
  /** public/icon 기준 상대 경로 (예: "icons/plus_medium.svg") */
  icon: string;
  /** 스크린 리더용 버튼 설명 */
  alt: string;
  /** 아이콘 자체의 가로/세로 크기(px). 지정하지 않으면 svg 파일의 원본 크기를 사용합니다. */
  size?: number;
  /** 버튼의 절대적인 터치 영역. 지정하지 않으면 아이콘 크기 그대로(기존 동작)입니다. */
  hitArea?: ButtonHitArea;
  children?: never;
};

// V를 판별자 리터럴 하나로 고정해 ButtonProps 유니온의 각 멤버(IconTextSmall/IconTextDefault)가
// Icon/MainCTAButton처럼 단일 리터럴 discriminant를 갖도록 함.
// (variant를 IconTextButtonType 유니온 하나로 두면, TypeScript가 개별 리터럴 체크를 순차로
//  거쳐도 해당 멤버를 완전히 좁혀내지 못하는 narrowing 이슈가 있어 이렇게 분리함)
type IconTextButtonRenderProps<V extends IconTextButtonType = IconTextButtonType> = ButtonBaseProps & {
  /** "IconTextSmall"(캡션형, 20px 아이콘) | "IconTextDefault"(Header Left형, 24px 아이콘) */
  variant: V;
  children: ReactNode;
  /** public/icon 기준 상대 경로 (예: "chevron/left_medium.svg") */
  icon: string;
  /** 아이콘 alt 텍스트. children(라벨)이 이미 접근성 이름을 제공하므로 장식용이면 생략 가능(기본값: "") */
  alt?: string;
  /** 아이콘 자체의 가로/세로 크기(px). 지정하지 않으면 프리셋 기본값(IconTextButtonConfig.iconSize)을 사용합니다. */
  size?: number;
  /** 아이콘-텍스트 간격. 지정하지 않으면 프리셋 기본값(IconTextButtonConfig.gap)이 적용됩니다. */
  gap?: ButtonGap;
  /** 버튼의 절대적인 터치 영역. 지정하지 않으면 아이콘+텍스트 크기 그대로(기존 동작)입니다. */
  hitArea?: ButtonHitArea;
};

type MainCTAButtonRenderProps = ButtonBaseProps & {
  variant: "MainCTAButton";
  children?: never;
  icon?: never;
  alt?: never;
  size?: never;
};

type CheckCTAButtonRenderProps = ButtonBaseProps & {
  variant: "CheckCTAButton";
  children?: never;
  icon?: never;
  alt?: never;
  size?: never;
};

type ChipButtonRenderProps = ButtonBaseProps & {
  variant: "Chip";
  /** 칩에 표시할 텍스트를 직접 입력(예: "당일"). date를 지정하면 무시됩니다. */
  children?: ReactNode;
  /** actionItem API의 displayDate 등 'YYYY-MM-DD' 문자열 | Date | null을 그대로 전달 가능.
   *  지정하면 "MM. dd." 형식으로 자동 포맷되어 children보다 우선 표시됩니다. */
  date?: ChipButtonDate;
  icon?: never;
  alt?: never;
  size?: never;
};

export type ButtonProps =
  | TextButtonRenderProps
  | IconButtonRenderProps
  | IconTextButtonRenderProps<"IconTextSmall">
  | IconTextButtonRenderProps<"IconTextDefault">
  | MainCTAButtonRenderProps
  | CheckCTAButtonRenderProps
  | ChipButtonRenderProps;

function renderIconTextButton(props: IconTextButtonRenderProps) {
  // variant는 ShadcnButton의 자체 variant prop과 이름이 겹쳐 spread에서 제외(config 조회엔 사용)
  const { variant, icon, alt, size, gap, hitArea, children, className, type, style, ...buttonProps } = props;
  const config = iconTextButtonConfig[variant];
  return (
    <ShadcnButton
      type={type ?? "button"}
      className={cn(
        iconTextButtonClassNames,
        gapClassNames[gap ?? config.gap],
        config.textClassName,
        config.colorClassName,
        className,
      )}
      style={{ ...resolveHitAreaSize(hitArea), ...style }}
      {...buttonProps}
    >
      <img
        src={`/icon/${icon}`}
        alt={alt ?? ""}
        width={size ?? config.iconSize}
        height={size ?? config.iconSize}
        className={config.iconOpacityClassName}
      />
      {children}
    </ShadcnButton>
  );
}

export default function Button(props: ButtonProps) {
  if (props.variant === "Icon") {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars -- ShadcnButton의 자체 variant prop과 이름이 겹쳐 spread에서 제외
    const { variant, icon, alt, size, hitArea, className, type, style, ...buttonProps } = props;
    return (
      <ShadcnButton
        type={type ?? "button"}
        className={cn(iconButtonClassNames, className)}
        style={{ ...resolveHitAreaSize(hitArea), ...style }}
        {...buttonProps}
      >
        <img src={`/icon/${icon}`} alt={alt} width={size} height={size} />
      </ShadcnButton>
    );
  }

  // IconTextSmall/IconTextDefault를 하나의 `||` 조건으로 묶으면 이후 TextButton 분기에서
  // props가 제대로 좁혀지지 않는 TypeScript narrowing 이슈가 있어, 개별 리터럴 체크로 분리.
  if (props.variant === "IconTextSmall") {
    return renderIconTextButton(props);
  }
  if (props.variant === "IconTextDefault") {
    return renderIconTextButton(props);
  }

  if (props.variant === "MainCTAButton") {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars -- ShadcnButton의 자체 variant prop과 이름이 겹쳐 spread에서 제외
    const { variant, className, type, "aria-label": ariaLabel, ...buttonProps } = props;
    return (
      <ShadcnButton
        type={type ?? "button"}
        aria-label={ariaLabel ?? "일정 추가"}
        className={cn(mainCTAButtonClassNames, className)}
        {...buttonProps}
      >
        <span className="flex size-full items-center justify-center rounded-medium bg-text-default">
          <Plus className="size-6 text-icon-white" strokeWidth={2} />
        </span>
      </ShadcnButton>
    );
  }

  if (props.variant === "CheckCTAButton") {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars -- 공통 Button의 variant를 DOM에 전달하지 않는다.
    const { variant, className, type, "aria-label": ariaLabel, ...buttonProps } = props;
    return (
      <ShadcnButton
        type={type ?? "button"}
        aria-label={ariaLabel ?? "일정 생성"}
        className={cn(
          "size-12 rounded-full border-none bg-icon-default p-0 text-icon-white shadow-none",
          "hover:bg-icon-default active:translate-y-0",
          "disabled:bg-grey-opacity-100 disabled:text-icon-disable disabled:opacity-100",
          className,
        )}
        {...buttonProps}
      >
        <span
          aria-hidden="true"
          className="size-6 bg-current"
          style={{
            WebkitMask: "url('/icon/icons/check_medium.svg') center / contain no-repeat",
            mask: "url('/icon/icons/check_medium.svg') center / contain no-repeat",
          }}
        />
      </ShadcnButton>
    );
  }

  if (props.variant === "Chip") {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars -- ShadcnButton에 전달하지 않는 전용 prop 제외
    const { variant, children, date, className, type, ...buttonProps } = props;
    const parsedDate = parseChipDate(date);
    return (
      <ShadcnButton
        type={type ?? "button"}
        className={cn(chipButtonClassNames, className)}
        {...buttonProps}
      >
        {parsedDate ? format(parsedDate, CHIP_DATE_FORMAT) : children}
      </ShadcnButton>
    );
  }

  const { variant, children, className, type, ...buttonProps } = props;
  const config = textButtonConfig[variant];
  const isSmall = config.size === "small";

  return (
    <ShadcnButton
      type={type ?? "button"}
      className={cn(
        buttonVariants({ size: config.size }),
        !isSmall && config.width && widthClassNames[config.width][config.size as "medium" | "large"],
        !isSmall && config.textSize && textStyleClassNames[config.textSize][config.size as "medium" | "large"],
        textColorClassNames[config.textColor][config.size],
        className,
      )}
      {...buttonProps}
    >
      {children}
    </ShadcnButton>
  );
}
