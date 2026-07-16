import { useState } from 'react';
import CalendarGrid from '@/components/common/CalendarGrid/CalendarGrid';
import SearchOverlay from '@/features/calendar/components/SearchOverlay';
import { MOCK_SCHEDULES } from '@/features/calendar/mockData';
import './HomePage.css';

interface HomePageProps {
  onSelectDate?: (date: string) => void;
}

const CATEGORY_COLOR_MAP: Record<string, string> = {
  green: '#E3FDF0',
  apricot: '#FFEEDF',
  blue: '#E2EFFD',
  pink: '#FFEFF7',
  purple: '#F6EFFE',
  yellow: '#FDFEE4',
};

const calendarEvents = MOCK_SCHEDULES.map((schedule) => ({
  title: schedule.title,
  date: schedule.date,
  backgroundColor: CATEGORY_COLOR_MAP[schedule.categoryColor] ?? CATEGORY_COLOR_MAP.yellow,
  textColor: '#1C1630',
  borderColor: 'transparent',
}));

function HomePage({ onSelectDate }: HomePageProps) {
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  const handleSelectDate = (date: string) => {
    setSelectedDate(date);
    onSelectDate?.(date);
  };

  return (
    <div className="home-page">
      <CalendarGrid
        events={calendarEvents}
        selectedDate={selectedDate}
        onSelectDate={handleSelectDate}
        onSearchClick={() => setIsSearchOpen(true)}
        onViewToggleClick={() => {}}
        onSettingsClick={() => {}}
      />

      {isSearchOpen && (
        <SearchOverlay
          isOpen={isSearchOpen}
          onClose={() => setIsSearchOpen(false)}
        />
      )}
    </div>
  );
}

export default HomePage;