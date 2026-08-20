import Header from '@/components/common/Header/Header';

import CalendarBackButton from './CalendarBackButton';

interface MonthlyButtonSectionProps {
  variant: 'monthly';
  backLabel: string;
  onBack: () => void;
  backAriaLabel?: string;
  onSearchClick?: () => void;
  onViewToggleClick?: () => void;
  onSettingsClick?: () => void;
}

interface DailyButtonSectionProps {
  variant: 'daily';
  title: string;
  backLabel: string;
  onBack: () => void;
}

interface YearlyButtonSectionProps {
  variant: 'yearly';
  onSearchClick?: () => void;
  onViewToggleClick?: () => void;
  onSettingsClick?: () => void;
}

type ButtonSectionProps =
  | MonthlyButtonSectionProps
  | DailyButtonSectionProps
  | YearlyButtonSectionProps;

interface CalendarHeaderActionsProps {
  onSearchClick?: () => void;
  onViewToggleClick?: () => void;
  onSettingsClick?: () => void;
}

function CalendarHeaderActions({
  onSearchClick,
  onViewToggleClick,
  onSettingsClick,
}: CalendarHeaderActionsProps) {
  return (
    <div className="calendar-header-actions">
      <button
        type="button"
        className="calendar-header-action-button"
        onClick={onSearchClick}
        disabled={!onSearchClick}
        aria-label="검색"
      >
        <img src="/icon/search.svg" alt="" />
      </button>
      <button
        type="button"
        className="calendar-header-action-button"
        onClick={onViewToggleClick}
        disabled={!onViewToggleClick}
        aria-label="캘린더 뷰 전환"
      >
        <img src="/icon/icons/label_large.svg" alt="" />
      </button>
      <button
        type="button"
        className="calendar-header-action-button"
        onClick={onSettingsClick}
        disabled={!onSettingsClick}
        aria-label="설정"
      >
        <img src="/icon/settings.svg" alt="" />
      </button>
    </div>
  );
}

function ButtonSection(props: ButtonSectionProps) {
  if (props.variant === 'daily') {
    return (
      <Header
        variant="daily"
        title={props.title}
        leading={{
          type: 'icon-text',
          text: props.backLabel,
          onClick: props.onBack,
        }}
        trailing={{ type: 'none' }}
      />
    );
  }

  if (props.variant === 'yearly') {
    return (
      <div className="calendar-header-button-section calendar-header-button-section-yearly">
        <CalendarHeaderActions
          onSearchClick={props.onSearchClick}
          onViewToggleClick={props.onViewToggleClick}
          onSettingsClick={props.onSettingsClick}
        />
      </div>
    );
  }

  return (
    <div className="calendar-header-button-section">
      <CalendarBackButton
        label={props.backLabel}
        onClick={props.onBack}
        ariaLabel={props.backAriaLabel}
      />

      <CalendarHeaderActions
        onSearchClick={props.onSearchClick}
        onViewToggleClick={props.onViewToggleClick}
        onSettingsClick={props.onSettingsClick}
      />
    </div>
  );
}

export default ButtonSection;
