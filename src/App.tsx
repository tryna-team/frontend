import { useState } from 'react';
import WeekStrip from '@/features/calendar/components/WeekStrip';
import ScheduleBanner from '@/components/common/ScheduleBanner/ScheduleBanner';
import './App.css';

function App() {
  const [selectedDate, setSelectedDate] = useState<string>('2026-06-04');

  return (
    <div style={{ maxWidth: 393, margin: '0 auto' }}>
      <WeekStrip selectedDate={selectedDate} onSelectDate={setSelectedDate} />
      <ScheduleBanner categoryColor="green" title="아빠 생일" dateText="하루" />
      <ScheduleBanner categoryColor="apricot" title="KOTRA" dateText="3일차" />
    </div>
  );
}

export default App;