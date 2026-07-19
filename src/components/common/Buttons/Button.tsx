import type { ReactNode } from "react";
import { Plus } from "lucide-react";

import { ShadcnButton } from "@/components/ui/shadcnButton";
import { cn } from "@/lib/utils";
import {
  buttonVariants,
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

export type ButtonProps =
  | TextButtonRenderProps
  | IconButtonRenderProps
  | IconTextButtonRenderProps<"IconTextSmall">
  | IconTextButtonRenderProps<"IconTextDefault">
  | MainCTAButtonRenderProps;

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
