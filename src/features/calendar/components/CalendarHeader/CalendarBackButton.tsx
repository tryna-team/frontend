interface CalendarBackButtonProps {
  label: string;
  onClick: () => void;
  ariaLabel?: string;
}

function CalendarBackButton({ label, onClick, ariaLabel }: CalendarBackButtonProps) {
  return (
    <button
      type="button"
      className="calendar-back-button"
      onClick={onClick}
      aria-label={ariaLabel ?? `${label} 화면으로 이동`}
    >
      <img src="/icon/chevron/left_small.svg" alt="" />
      <span className="calendar-back-label">{label}</span>
    </button>
  );
}

export default CalendarBackButton;
