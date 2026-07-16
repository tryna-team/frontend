import { useState, useMemo } from 'react';
import { Button } from "@/components/common/Buttons";
import { MOCK_SCHEDULES } from '@/features/calendar/mockData';
import './SearchOverlay.css';

function formatDateHeader(dateStr: string, isFirst: boolean): string {
  const [yearStr, monthStr, dayStr] = dateStr.split('-');
  const date = new Date(Number(yearStr), Number(monthStr) - 1, Number(dayStr));
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const day = date.getDate();
  const weekday = ['일', '월', '화', '수', '목', '금', '토'][date.getDay()];
  return isFirst
    ? `${year}년 ${month}월 ${day}일 (${weekday})`
    : `${month}월 ${day}일 (${weekday})`;
}

interface SearchOverlayProps {
  isOpen: boolean;
  onClose: () => void;
}

function SearchOverlay({ isOpen, onClose }: SearchOverlayProps) {
  const [query, setQuery] = useState('');

  const hasQuery = query.trim() !== '';

const groupedResults = useMemo(() => {
  if (!hasQuery) return [];
  const lowerQuery = query.toLowerCase();
  const filtered = MOCK_SCHEDULES.filter((item) =>
    item.title.toLowerCase().includes(lowerQuery) || item.location?.toLowerCase().includes(lowerQuery)
  );
  const sorted = [...filtered].sort((a, b) => a.date.localeCompare(b.date));
  const groups: { date: string; items: typeof filtered }[] = [];
  for (const item of sorted) {
    const lastGroup = groups[groups.length - 1];
    if (lastGroup && lastGroup.date === item.date) {
      lastGroup.items.push(item);
    } else {
      groups.push({ date: item.date, items: [item] });
    }
  }
  return groups;
}, [query, hasQuery]);

  const handleClose = () => {
    setQuery('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="search-overlay">
      <div className="search-overlay-stack">
        <div className="search-overlay-input-box">
          <input
            type="text"
            className="search-overlay-input"
            placeholder="일정을 검색하세요."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            autoFocus
          />
          <button
            type="button"
            className="search-overlay-clear"
            onClick={() => setQuery('')}
            aria-label="검색어 지우기"
          >
            <img src="/icon/icons/delete_small.svg" alt="" />
          </button>
          <div className="search-overlay-close-wrap">
  <Button variant="MediumDefaultFit" onClick={handleClose}>
    닫기
  </Button>
</div>
        </div>

        {hasQuery && (
          <div className="search-overlay-results-wrap">
            <div className="search-overlay-results-panel">
              {groupedResults.map((group, index) => (
                <div key={group.date} className="search-overlay-group">
                  <h3 className="search-overlay-date-header">
                    {formatDateHeader(group.date, index === 0)}
                  </h3>
                  <ul className="search-overlay-result-list">
                    {group.items.map((item) => (
                      <li key={item.id} className="search-overlay-result-item">
                        <img
                          src={`/icon/alert_indicator/dot_${item.categoryColor}.svg`}
                          alt=""
                          className="search-overlay-result-dot"
                        />
                        <div className="search-overlay-result-text">
                          <span className="search-overlay-result-title">{item.title}</span>
                          {item.location && (
                            <span className="search-overlay-result-location">
                              {item.location}
                            </span>
                          )}
                        </div>
                        <div className="search-overlay-result-time">
                          <span>{item.startTime}</span>
                          {item.endTime && (
                            <span className="search-overlay-result-time-end">
                              ~{item.endTime}
                            </span>
                          )}
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>

            
          </div>
        )}
      </div>
    </div>
  );
}

export default SearchOverlay;