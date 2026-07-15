import { useState } from 'react';
import CalendarGrid from '@/components/common/CalendarGrid/CalendarGrid';
import SearchOverlay from '@/features/calendar/components/SearchOverlay';
import { MOCK_SCHEDULES } from '@/features/calendar/mockData';
import './HomePage.css';

interface HomePageProps {
  onSelectDate?: (date: string) => void;
}

function HomePage({ onSelectDate }: HomePageProps) {
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  const handleSelectDate = (date: string) => {
    setSelectedDate(date);
    onSelectDate?.(date);
  };

  const calendarEvents = MOCK_SCHEDULES.map((schedule) => ({
    title: schedule.title,
    date: schedule.date,
    backgroundColor:
      schedule.categoryColor === 'green' ? '#E3FDF0' :
      schedule.categoryColor === 'apricot' ? '#FFEEDF' :
      schedule.categoryColor === 'blue' ? '#E2EFFD' :
      schedule.categoryColor === 'pink' ? '#FFEFF7' :
      schedule.categoryColor === 'purple' ? '#F6EFFE' :
      '#FDFEE4', // yellow
    textColor: '#1C1630',
    borderColor: 'transparent',
  }));

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