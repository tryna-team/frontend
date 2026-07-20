// ============================================================
// store/useCalendarStore.ts
// 커버: B101(캘린더 메인 조회)/B102(월간 조회)/B103(날짜별 목록)/레이블(홈/레이블 수정) 화면
// ============================================================
//
// 설계 노트: 캘린더 "일정 데이터 자체"(GET /api/v1/calendars/monthly 등의 응답)는
// 서버 캐시 성격이 강하므로 React Query / SWR로 관리하는 것을 권장한다.
// (동일 월을 여러 화면에서 재조회, 백그라운드 refetch, 로딩/에러 상태 등을
//  Zustand로 직접 구현하면 React Query가 이미 잘하는 일을 재발명하게 된다.)
//
// 이 스토어는 "지금 사용자가 보고 있는 뷰 상태"와 "레이블 목록"만 담당한다.
// - currentYear/currentMonth/selectedDate → React Query의 쿼리 key로 그대로 사용
// - labels → 레이블 수는 적고(최대 수십 개) 색상 매핑 등에 화면 전체에서 자주 참조되므로
//   전역 캐시로 두면 prop drilling 없이 캘린더 셀, 이벤트 뷰, 생성 패널에서 바로 꺼내 쓸 수 있다.

import { create } from 'zustand';
import type { CalendarLabel } from './types';

interface CalendarState {
  // ── 뷰 상태 (B101/B102: 지금 화면에 어떤 월/날짜가 떠 있는지) ──
  // React Query를 쓴다면 이 두 값이 그대로 useQuery의 queryKey 일부가 된다.
  // 예: useQuery(['calendar', 'monthly', currentYear, currentMonth], fetchMonthly)
  currentYear: number; // 지금 보고 있는 연도 (예: 2026)
  currentMonth: number; // 지금 보고 있는 월, 1~12 (0~11 아님 주의)

  // B103 "날짜별 일정 목록 조회" 기준이 되는 날짜. 캘린더 셀 탭 → 하단 일정 목록이
  // 이 값을 기준으로 다시 조회(React Query라면 이 값이 바뀔 때 자동 refetch)된다.
  selectedDate: string; // 'YYYY-MM-DD' 형식 문자열

  // ── 레이블(캘린더 그룹) 캐시 ──
  // 레이블은 개수가 적고 여러 화면(캘린더 셀 색상, 이벤트 뷰, 생성 패널의 레이블 선택)에서
  // 동시에 참조되므로, 서버에서 한 번 받아온 뒤 여기 전역 캐시로 들고 있는다.
  labels: CalendarLabel[]; // 사용자가 가진 전체 레이블 목록
  selectedLabelId: string | null; // "레이블 수정" 화면에 진입할 때 대상이 되는 레이블 id (없으면 null)

  // ── 뷰 상태를 바꾸는 액션 ──
  setMonth: (year: number, month: number) => void; // 월간 캘린더에서 이전/다음 달 이동
  goToToday: () => void; // "오늘" 버튼 - 연/월/선택날짜를 전부 오늘 기준으로 되돌림
  selectDate: (date: string) => void; // 캘린더 셀을 탭했을 때 선택 날짜 갱신

  // ── 레이블 목록을 바꾸는 액션 ──
  setLabels: (labels: CalendarLabel[]) => void; // 서버에서 받아온 레이블 목록을 통째로 캐시에 반영
  upsertLabel: (label: CalendarLabel) => void; // 1-9 "레이블 수정 완료" - 있으면 수정, 없으면 추가(update-or-insert)
  removeLabel: (labelId: string) => void; // 레이블 삭제 후 캐시에서도 제거
  selectLabel: (labelId: string | null) => void; // 레이블 수정 화면 진입/이탈 시 대상 지정·해제
}

// 스토어 초기값 계산용 "오늘" — 모듈(앱) 로드 시점의 스냅샷.
// ⚠️ goToToday() 같은 액션에서는 이 상수를 재사용하면 안 됨(앱을 오래 켜두면
// 실제 오늘이 아니라 앱 로드 시점 날짜로 돌아가는 stale closure 버그) —
// 액션 내부에서는 항상 new Date()를 새로 생성해서 씀.
const today = new Date();
// Date → 'YYYY-MM-DD' 문자열 변환 헬퍼. WeekStrip.tsx/CalendarGrid.tsx가 이미 쓰는
// toLocaleDateString('sv-SE') 패턴과 동일 — 로컬 타임존 기준이라 toISOString()(UTC)의
// 자정 근처 하루 밀림 문제가 없음.
const toISODate = (d: Date) => d.toLocaleDateString('sv-SE');

export const useCalendarStore = create<CalendarState>((set) => ({
  // 초기값: 앱을 처음 열면 항상 "이번 달 오늘"이 기본 뷰가 되도록 오늘 날짜로 세팅
  currentYear: today.getFullYear(),
  currentMonth: today.getMonth() + 1, // getMonth()는 0~11이라 +1 필수
  selectedDate: toISODate(today),
  labels: [], // 앱 시작 시엔 비어있고, 로그인/앱 진입 후 API 응답으로 setLabels가 채움
  selectedLabelId: null,

  // 월 이동: currentYear/currentMonth만 바꾼다. selectedDate는 건드리지 않으므로
  // "3월 15일 보다가 4월로 넘기면 selectedDate는 여전히 3월 15일"로 남는 점 주의
  // (필요하면 여기서 selectedDate도 해당 월 1일 등으로 같이 리셋하도록 정책 확인 필요)
  setMonth: (year, month) => set({ currentYear: year, currentMonth: month }),

  // "오늘" 버튼: 연/월/선택날짜 세 값을 한 번에 오늘 기준으로 되돌림
  // (stale closure 방지: 위 모듈 스코프 today 대신 호출 시점의 실제 오늘을 새로 계산)
  goToToday: () => {
    const now = new Date();
    set({
      currentYear: now.getFullYear(),
      currentMonth: now.getMonth() + 1,
      selectedDate: toISODate(now),
    });
  },

  // 날짜 셀 탭: selectedDate만 갱신 → React Query를 쓴다면 이 값이 바뀌는 순간
  // 해당 날짜의 일정 목록 쿼리가 새 쿼리 키로 자동 refetch됨
  selectDate: (date) => set({ selectedDate: date }),

  // 서버에서 받아온 레이블 배열로 캐시를 통째로 교체 (최초 로드, 새로고침 시 사용)
  setLabels: (labels) => set({ labels }),

  // update-or-insert: id가 이미 있으면 해당 항목만 교체, 없으면 배열 끝에 추가.
  // "레이블 생성"과 "레이블 수정"을 액션 하나로 함께 처리하기 위한 설계.
  upsertLabel: (label) =>
    set((state) => {
      const exists = state.labels.some((l) => l.id === label.id);
      return {
        labels: exists
          ? state.labels.map((l) => (l.id === label.id ? label : l))
          : [...state.labels, label],
      };
    }),

  // 삭제된 레이블 id를 배열에서 필터링해서 제거
  removeLabel: (labelId) =>
    set((state) => ({ labels: state.labels.filter((l) => l.id !== labelId) })),

  // 레이블 수정 화면 진입 시 대상 id 지정, 화면 나갈 때 null로 초기화
  selectLabel: (labelId) => set({ selectedLabelId: labelId }),
}));
