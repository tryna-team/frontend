import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router';
import { useQuery, keepPreviousData } from '@tanstack/react-query';

import { Button } from '@/components/common/Buttons';
import { eventService } from '@/apis/services/eventService';
import type { EventSearchResult } from '@/apis/types/event';
import { queryKeys } from '@/hooks/queries/queryKeys';
import { generateEventPath } from '@/routes/paths';

import './SearchOverlay.css';

// 타이핑 한 글자마다 요청이 나가지 않도록 대기하는 시간
const SEARCH_DEBOUNCE_DELAY = 300;

// 라벨이 없는 결과에 쓸 기본 색. 서버의 기본 라벨도 GREEN이라 값을 맞췄다.
const FALLBACK_DOT_COLOR = 'green';

// B107 결과에는 sourceType이 없어 외부 캘린더 일정인지 구분할 수 없다. 다만 응답의
// label에 색이 함께 오므로 그 값을 쓰면 되고, 폴백은 label 자체가 없을 때만 걸린다.

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

// 같은 결과가 두 번 렌더링되지 않도록 종류까지 포함해 키를 만든다.
// (일정과 그 일정의 준비 항목이 함께 검색되면 eventId가 겹친다)
function getResultKey(result: EventSearchResult) {
  return `${result.type}-${result.eventId}-${result.actionItemId ?? 'event'}`;
}

interface SearchOverlayProps {
  isOpen: boolean;
  onClose: () => void;
}

function SearchOverlay({ isOpen, onClose }: SearchOverlayProps) {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');

  // 서버가 앞뒤 공백을 제거한 뒤 빈 문자열이면 400을 주므로, 프론트에서도 같은 기준으로 자른다.
  const keyword = debouncedQuery.trim();
  const hasKeyword = keyword !== '';
  // 입력은 있는데 디바운스 대기 중인 상태 — 결과가 아직 갱신되지 않았음을 표시하는 데 쓴다
  const isTyping = query.trim() !== keyword;

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedQuery(query);
    }, SEARCH_DEBOUNCE_DELAY);

    return () => window.clearTimeout(timer);
  }, [query]);

  const { data, isFetching, isError } = useQuery({
    queryKey: queryKeys.events.search(keyword),
    queryFn: ({ signal }) => eventService.search(keyword, signal),
    // 빈 검색어로는 요청하지 않는다 (B107_EVENT_SEARCH_400 방지)
    enabled: isOpen && hasKeyword,
    // 검색어를 이어서 칠 때 결과가 사라졌다 나타나는 깜빡임 방지
    placeholderData: keepPreviousData,
  });

  // ⚠️ 정렬은 서버가 한다 (오늘 기준 날짜가 가까운 순 → 같은 날짜면 시간 순 → 날짜 없는 건 하단).
  // 여기서 다시 정렬하면 그 순서가 깨지므로, 받은 순서를 유지한 채 연속된 같은 날짜만 묶는다.
  const groupedResults = useMemo(() => {
    const groups: { date: string; items: EventSearchResult[] }[] = [];

    for (const result of data?.results ?? []) {
      const lastGroup = groups[groups.length - 1];

      if (lastGroup && lastGroup.date === result.date) {
        lastGroup.items.push(result);
      } else {
        groups.push({ date: result.date, items: [result] });
      }
    }

    return groups;
  }, [data]);

  const handleClose = () => {
    setQuery('');
    setDebouncedQuery('');
    onClose();
  };

  // 검색 결과 클릭 -> 일정 상세 페이지(EventView) 이동, 오버레이는 닫음
  // 준비/실행 항목이 검색된 경우에도 그 항목이 속한 부모 일정으로 이동한다.
  //
  // occurrenceDate를 함께 넘긴다. 없이 이동하면 상세 화면의 준비/실행 항목 조회(F103)가
  // 400으로 떨어져 "준비 항목을 불러오지 못했어요"가 뜬다. 홈·데일리에서 넘어갈 때는
  // 이미 넘기고 있어서 검색으로 들어온 경우에만 나던 증상이다.
  //
  // 검색 결과의 date는 그 일정(또는 항목)이 걸린 날짜라 반복 일정의 회차와도 맞는다.
  const handleResultClick = (eventId: number, occurrenceDate: string) => {
    handleClose();
    navigate(generateEventPath.view(String(eventId), occurrenceDate));
  };

  if (!isOpen) return null;

  const hasResults = groupedResults.length > 0;
  // 요청이 끝났고 결과가 비어 있을 때만 "결과 없음"을 보여준다 (타이핑 중 깜빡임 방지)
  const isEmpty = hasKeyword && !isTyping && !isFetching && !isError && !hasResults;

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
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.currentTarget.blur(); // 포커스 해제 -> 모바일 키보드 닫힘
              }
            }}
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

        {hasKeyword && (
          <div className="search-overlay-results-wrap">
            <div className="search-overlay-results-panel">
              {isError && (
                <p className="search-overlay-message">
                  검색에 실패했어요. 잠시 후 다시 시도해주세요.
                </p>
              )}

              {isEmpty && <p className="search-overlay-message">검색 결과가 없어요.</p>}

              {groupedResults.map((group, index) => (
                <div key={group.date} className="search-overlay-group">
                  <h3 className="search-overlay-date-header">
                    {formatDateHeader(group.date, index === 0)}
                  </h3>
                  <ul className="search-overlay-result-list">
                    {group.items.map((item) => (
                      <li
                        key={getResultKey(item)}
                        className="search-overlay-result-item"
                        onClick={() => handleResultClick(item.eventId, item.date)}
                        role="button"
                        tabIndex={0}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault(); // role="button"이라 Space의 기본 스크롤 동작을 브라우저가 안 막아줌 — 직접 방지
                            handleResultClick(item.eventId, item.date);
                          }
                        }}
                      >
                        <img
                          src={`/icon/alert_indicator/dot_${
                            item.label?.color.toLowerCase() ?? FALLBACK_DOT_COLOR
                          }.svg`}
                          alt=""
                          className="search-overlay-result-dot"
                        />
                        <div className="search-overlay-result-text">
                          <span className="search-overlay-result-title">{item.title}</span>
                          {/* 준비/실행 항목이면 어느 일정에 속한 항목인지, 일정이면 장소를 보여준다 */}
                          {(item.parentEventTitle ?? item.location) && (
                            <span className="search-overlay-result-location">
                              {item.parentEventTitle ?? item.location}
                            </span>
                          )}
                        </div>
                        <div className="search-overlay-result-time">
                          {item.startTime && <span>{item.startTime}</span>}
                          {item.endTime && (
                            <span className="search-overlay-result-time-end">~{item.endTime}</span>
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
