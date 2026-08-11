interface MonthSectionProps {
  currentMonth: number;
}

function MonthSection({ currentMonth }: MonthSectionProps) {
  return <span className="calendar-header-month">{currentMonth}</span>;
}

export default MonthSection;
