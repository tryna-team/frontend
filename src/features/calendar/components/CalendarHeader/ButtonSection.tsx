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

type ButtonSectionProps = MonthlyButtonSectionProps | DailyButtonSectionProps;

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

  return (
    <div className="calendar-header-button-section">
      <CalendarBackButton
        label={props.backLabel}
        onClick={props.onBack}
        ariaLabel={props.backAriaLabel}
      />

      <div className="calendar-header-actions">
        <button
          type="button"
          className="calendar-header-action-button"
          onClick={props.onSearchClick}
          aria-label="검색"
        >
          <img src="/icon/search.svg" alt="" />
        </button>
        <button
          type="button"
          className="calendar-header-action-button"
          onClick={props.onViewToggleClick}
          aria-label="캘린더 뷰 전환"
        >
          <img src="/icon/icons/label_small.svg" alt="" />
        </button>
        <button
          type="button"
          className="calendar-header-action-button"
          onClick={props.onSettingsClick}
          aria-label="설정"
        >
          <img src="/icon/settings.svg" alt="" />
        </button>
      </div>
    </div>
  );
}

export default ButtonSection;
