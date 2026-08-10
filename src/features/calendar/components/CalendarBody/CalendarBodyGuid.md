# CalendarBody 설계 가이드

## 목표

월간 캘린더를 스와이프나 스크롤 스냅이 아닌 네이티브 세로 무한 스크롤로 제공한다.
사용자가 원하는 위치에서 자연스럽게 멈출 수 있어야 하며, 이전 달과 다음 달을 연속해서 볼 수 있어야 한다.

월간 캘린더 본문은 `CalendarBody`와 한 달 단위의 `CalendarMonth`로 구성한다.

## 화면 구조

```text
CalendarHeader
├─ ButtonSection
├─ MonthSection
└─ WeekdaySection

CalendarBody (세로 스크롤 영역)
├─ CalendarMonth
├─ CalendarMonth
└─ CalendarMonth
```

- 헤더와 요일 행은 월 콘텐츠의 스크롤 영역 밖에 둔다.
- FullCalendar의 기본 요일 헤더는 끈다.
- 월 콘텐츠만 세로로 스크롤한다.
- `CalendarBody` 안에 헤더를 포함하지 않는다.

## 컴포넌트 책임

### `CalendarBody.tsx`

- 월 목록을 받아 여러 `CalendarMonth`를 순서대로 렌더링한다.
- 월간 전용 목록 상태와 공용 스크롤 훅을 조합한다.
- 가장 많이 보이는 월이 바뀌면 상위 컴포넌트에 알린다.
- 개별 월의 FullCalendar 설정이나 데이터 요청을 직접 처리하지 않는다.

### `CalendarMonth.tsx`

- 한 달 분량의 FullCalendar를 렌더링한다.
- 월과 월의 경계에서 해당 월을 표시하고, 1월에는 연도까지 함께 표시한다.
- 해당 월의 이벤트와 선택 날짜를 표시한다.
- 날짜 클릭과 길게 누르기 같은 한 달 내부 상호작용을 처리한다.
- 다음 설정을 기본으로 사용한다.

```text
dayHeaders=false
headerToolbar=false
fixedWeekCount=false
showNonCurrentDates=false
height=auto
dayMaxEvents=3
```

- 한 월의 첫째·마지막 주에 포함되는 이전 달 또는 다음 달 날짜는 표시하지 않는다.
- 요일 열 정렬을 위한 빈 날짜 칸은 유지하되, 한 날짜 행에는 해당 `CalendarMonth`의 날짜만 표시한다.
- 날짜 행 높이는 플랫폼이나 화면 높이에 따라 달라지지 않도록 `CalendarBody.css`의 고정 px 값으로 관리한다.
- `vh`, `dvh`, 남은 화면 높이 분배 또는 JavaScript 측정값으로 날짜 행 높이를 계산하지 않는다.
- 4주·5주·6주 달은 행 하나의 높이는 같고, 월 전체 높이만 행 개수에 따라 달라진다.
- 이벤트가 많을 때는 `dayMaxEvents`와 `more` 링크로 처리하고 날짜 행 자체를 늘리지 않는다.
- 이벤트·오늘·선택 날짜 스타일은 `CalendarMonth` 클래스 범위에서 관리한다.
- 스와이프, 스냅, 월 미리보기 패널 로직은 사용하지 않는다.

## 스크롤 설계

### 공용 훅

경로:

```text
src/features/calendar/hooks/useCalendarScroll.ts
```

`useCalendarScroll`은 월간 캘린더와 연간 캘린더에서 함께 사용한다.

책임:

- 세로 스크롤 컨테이너를 관리한다.
- 상단·하단 도달을 감지한다.
- 양쪽 끝에서 항목을 추가·제거한 뒤에도 사용자가 보던 위치가 움직이지 않도록 스크롤 위치를 보정한다.
- 필요한 시점에 `onReachStart`, `onReachEnd` 같은 콜백을 호출한다.

책임지지 않는 것:

- 월 또는 연도 값 생성
- 월 또는 연도 데이터 요청
- 헤더에 표시할 문구 결정
- 스크롤 스냅이나 한 번의 스크롤로 다음 항목에 강제 이동하는 동작

월간과 연간은 같은 스크롤 동작을 사용하되 목록 계산은 각각 분리한다.

```text
월간 화면: 월 목록 상태 및 이전·다음 월 생성
연간 화면: 연도 목록 상태 및 이전·다음 연도 생성
공용 훅: 스크롤 감지 및 위치 보정
```

## 현재 표시 월 결정

두 달이 화면에 걸쳐 있으면 스크롤 영역 안에서 실제로 보이는 세로 픽셀 높이가 가장 큰 달을 현재 월로 판단한다.

```text
visibleHeight =
  max(0, min(monthBottom, viewportBottom) - max(monthTop, viewportTop))
```

- 월 전체 높이에 대한 비율이 아니라 실제 노출 픽셀을 비교한다.
- 4주·5주·6주 달처럼 월별 높이가 달라도 같은 기준을 적용한다.
- 노출 높이가 같으면 기존에 표시 중인 월을 유지해 헤더가 흔들리지 않게 한다.
- 판단 결과가 실제로 달라졌을 때만 `MonthSection`의 월을 변경한다.
- 이 계산은 `CalendarBody`에서 분리된 가시성 훅으로 관리한다.

## 월 목록 관리

월 목록을 만드는 로직은 `useCalendarScroll`에 넣지 않고 월간 화면 전용 훅으로 분리한다.

책임:

- 최초 표시 월을 기준으로 최소 이전 달·현재 달·다음 달을 미리 준비한다.
- `CalendarBody`는 준비된 월마다 `CalendarMonth` 인스턴스를 렌더링한다.
- 상단 도달 시 이전 월을 추가한다.
- 하단 도달 시 다음 월을 추가한다.
- 렌더링되는 월은 최대 7개만 유지하고, 새 월을 추가한 반대쪽의 가장 먼 월을 제거한다.
- 외부 날짜 이동 요청의 월이 목록에 없으면 해당 월을 중심으로 목록을 재설정한다.

최초에는 이전·현재·다음 달을 준비하고, 스크롤하면서 최대 7개까지 확장한다.

## 데이터 책임

- `CalendarBody`와 `CalendarMonth` 내부에서 API 요청을 직접 만들지 않는다.
- `useCalendarMonthEvents`가 현재 표시 월을 기준으로 이전·현재·다음 달 이벤트를 준비해 전달한다.
- 여러 달을 렌더링할 때 이벤트 상세 요청이 월 수만큼 중복되지 않도록 데이터 요청 전략을 별도로 설계한다.
- 여러 FullCalendar 인스턴스의 `datesSet`이 전역 날짜 상태를 경쟁적으로 변경하게 만들지 않는다.

## 유지하는 FullCalendar 표시 규칙

- `CalendarMonthEvent` 타입
- FullCalendar 표시 옵션
- 날짜 숫자의 `일` 제거
- `more` 링크 표시 방식
- 이벤트·오늘·선택 날짜의 시각 스타일
- 날짜 클릭 및 길게 누르기 동작의 개념

## 사용하지 않는 레거시 동작

- `MonthPeekGrid`
- 세로 3패널 트랙
- 드래그 거리와 임계값에 따른 월 전환
- wheel 이벤트 차단
- 강제 스크롤 스냅
- 화면 높이에 맞춘 날짜 행 높이 계산
- 각 FullCalendar의 `datesSet`을 통한 전역 월 변경

## 적용 순서

1. 한 달 단위의 표시를 담당하는 `CalendarMonth`를 구현한다.
2. 월 목록 관리 로직으로 최소 이전 달·현재 달·다음 달을 준비한다.
3. `CalendarBody`에서 준비된 여러 `CalendarMonth`를 함께 렌더링한다.
4. 월·연간 공용 `useCalendarScroll`을 구현한다.
5. 실제 노출 높이를 계산하는 가시성 훅을 구현한다.
6. `CalendarBody`에서 월 목록과 스크롤·가시성 훅을 조합한다.
7. `HomePage`에서 `CalendarHeader`와 `CalendarBody`를 조합한다.
8. 월 목록 제한, 외부 날짜 이동, 여러 달 이벤트 조회를 연결한다.
