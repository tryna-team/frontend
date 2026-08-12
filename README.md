# 🗓️ tryna Frontend

> **일정과 연결된 맥락을 함께 기억하는 퍼스널 비서형 캘린더**
> 

---

## 📖 프로젝트 소개

**tryna**는 도메인 온톨로지 기반의 퍼스널 캘린더 서비스입니다.

기존 캘린더가 일정을 단순한 날짜와 시간 정보로 관리했다면, **tryna**는 사람, 장소, 준비물, 해야 할 일 등 일정과 연결된 **맥락(Context)** 을 함께 관리합니다.

사용자가 자연어로 일정을 입력하면 필요한 준비물과 해야 할 일을 제안하고, 중요한 순간에 다시 알려주는 **개인 비서형 캘린더 경험**을 제공합니다.

---

## 👥 팀원 및 프론트엔드 역할 분담

| 이름 | 담당 페이지 | 담당 공용 컴포넌트 |
|------|------------|------------------|
| 스카 (박남은) | 이벤트 뷰 (생성, 삭제, 편집) | Popup (BottomSheet · QuickModal · ToastPopup) |
| 유요미 (최유연) | 스플래시, 홈, 데일리, 연간 캘린더 | ScheduleBanner |
| 갱 (유경민) | 이벤트 생성 | Checklist |

---

## 🛠️ 기술 스택

| 구분 | 기술 |
| --- | --- |
| Framework | React 19 |
| Language | TypeScript |
| Build Tool | Vite |
| Routing | React Router |
| Server State | TanStack Query (React Query) |
| Client State | Zustand |
| HTTP | Axios |
| Calendar | FullCalendar (dayGrid, multiMonth, interaction) |
| Date | date-fns |
| Styling | Tailwind CSS |
| UI Library | shadcn/ui, `@tryna/tds` (디자인 시스템) |
| Formatter | Prettier |
| Linter | ESLint |

### 상태 관리 구분

- **서버에서 온 데이터**는 React Query가 담당합니다. 캐시 키는 `hooks/queries/queryKeys.ts`에서 한 곳으로 모아 관리합니다.
- **화면 상태**(선택한 날짜, 보고 있는 연·월, 로그인 토큰 등)는 Zustand 스토어(`stores/`)가 담당합니다.
- 두 곳에 같은 데이터를 중복해서 두지 않습니다.

---

## 📁 폴더 구조

```
src/
├── apis/                     # 서버 통신 계층
│   ├── client.ts             # axios 인스턴스, 토큰 자동 첨부, 401 재발급
│   ├── endpoints.ts          # 엔드포인트 경로 상수
│   ├── bootstrap.ts          # 앱 진입 흐름 (재발급 → 상태 확인 → 비회원 생성)
│   ├── queryClient.ts        # React Query 클라이언트
│   ├── services/             # 도메인별 API 함수 (event, calendar, label, auth 등)
│   └── types/                # API 요청·응답 타입
├── stores/                   # Zustand 스토어
│   ├── authStore.ts          # 토큰·권한
│   ├── calendarStore.ts      # 선택 날짜, 보고 있는 연·월, 라벨 캐시
│   └── eventCreationStore.ts # 일정 생성 중간 상태
├── hooks/                    # 전역 커스텀 훅
│   └── queries/              # React Query 훅 + queryKeys
├── components/
│   ├── ui/                   # shadcn/ui 컴포넌트
│   └── common/               # 화면에 종속되지 않는 공용 컴포넌트
│       ├── Buttons/  Checklist/  CreateModal/  Header/
│       ├── Input/  LabelModal/  ColorPicker/  ActionRow/
│       └── Popup/            # 바텀시트, 모달, 토스트
├── features/                 # 도메인별 화면 구성 요소
│   ├── calendar/             # 캘린더 (월간·연간·검색)
│   │   ├── components/       # CalendarHeader, MonthCalendarBody, YearCalendarBody,
│   │   │                     # ScheduleCard, SearchOverlay
│   │   ├── hooks/            # 스크롤·페이징·월별 일정 조합
│   │   └── utils/
│   ├── event/                # 일정 생성·수정
│   ├── settings/             # 설정 시트
│   ├── legal/                # 약관·개인정보 문서
│   └── splash/
├── pages/                    # 라우트 단위 화면 조립
│   ├── Splash/  Home/  Daily/  EventView/  YearCalendar/  Legal/
├── routes/                   # 라우터, 경로 상수, 화면 간 navigation state
├── colors/                   # 라벨 색상 토큰
├── utils/                    # 공통 유틸 (deviceId, 개발용 콘솔 헬퍼 등)
├── types/                    # 화면 공용 타입
└── lib/
```

> `features`와 `pages`의 구분: `pages`는 라우트에 대응하는 조립 지점이고, 실제 UI와 로직은
> `features` 아래 도메인별로 둡니다. 여러 화면에서 함께 쓰는 것만 `components/common`으로 올립니다.

---

## 🧩 공용 컴포넌트

`components/common` — 특정 화면에 종속되지 않고 여러 곳에서 재사용하는 컴포넌트입니다.

| 컴포넌트 | 설명 |
| --- | --- |
| `Buttons/` | 공용 버튼. variant로 크기·강조·아이콘 조합을 지정합니다 |
| `Header/` | 상단 헤더 |
| `Input/` | 텍스트 입력 |
| `Checklist/` | 준비·실행 항목 목록. `iconSize`와 `radioVariant`로 화면별 형태를 구분합니다 |
| `ActionRow/` | 아이콘 + 텍스트 + 우측 요소로 구성된 행 |
| `CreateModal/` | 자연어 일정 입력·저장 모달 |
| `LabelModal/`, `ColorPicker/` | 라벨 선택과 색상 선택 |
| `ScheduleBanner/` | 하루 종일 일정 요약 배너 (Daily · Event View) |
| `Popup/` | 오버레이 계열 모음 — `BottomSheet`, `QuickModal`(확인 팝업), `ToastPopup`, `GlobalBottomSheet` |
| `WebIntro/` | 데스크톱 폭에서 앱 프레임 옆에 보여주는 소개 영역 |

> **캘린더 관련 컴포넌트는 여기 없습니다.** `CalendarHeader`, `MonthCalendarBody`,
> `YearCalendarBody`, `ScheduleCard`, `SearchOverlay`는 캘린더 도메인 전용이라
> `features/calendar/components/` 아래에 있습니다.

> **오버레이는 한 곳에서만 렌더링합니다.** 설정 시트와 로그인 시트는 `App`에 있는
> `GlobalSettings` · `GlobalBottomSheet`가 담당하고, 화면에서는 스토어를 통해 열기만 합니다.
> 화면마다 따로 렌더링하면 같은 시트가 중복으로 뜹니다.

---

## 🌱 브랜치 · 커밋 · PR 컨벤션

### 🌿 브랜치 전략

모든 작업은 아래 브랜치 전략을 따릅니다.

```
main
└── dev
    └── feature/{기능이름}
```

| 브랜치 | 설명 |
| --- | --- |
| `main` | 최종 배포 가능한 안정적인 버전의 코드 |
| `dev` | 개발이 완료된 기능들이 통합되는 메인 개발 브랜치 |
| `feature/{기능이름}` | 새로운 기능을 개발하는 브랜치 |

> **규칙**
> 
> - `main` 브랜치에 직접 커밋하지 않습니다.
> - `feature` 브랜치는 반드시 `dev` 브랜치에서 생성합니다.

### 💬 커밋 컨벤션

커밋 메시지는 아래 형식을 따릅니다.

```
타입: 제목
```

#### Commit Type

| 타입 | 설명 |
| --- | --- |
| `feat` | 새로운 기능 추가 |
| `fix` | 버그 수정 |
| `docs` | 문서 수정 |
| `style` | 코드 스타일 수정 (기능 변경 없음) |
| `refactor` | 코드 구조 개선 |
| `test` | 테스트 코드 추가 |
| `chore` | 기타 작업 (빌드 설정, 패키지 관리 등) |

#### 예시

```
feat: 로그인 페이지 구현
fix: 회원가입 오류 수정
docs: README 업데이트
chore: Tailwind 및 ESLint 설정
```

### 🔀 Pull Request

모든 코드는 **Pull Request(PR)** 를 통해 `dev` 브랜치에 병합합니다.

#### Workflow

1. `dev` 브랜치에서 `feature/{기능이름}` 브랜치를 생성합니다.
2. 기능 개발 후 커밋합니다.
3. 원격 저장소로 Push 합니다.

```bash
git push origin feature/{기능이름}
```

1. GitHub에서 `dev` 브랜치로 Pull Request를 생성합니다.
2. 팀원의 리뷰 및 승인(Approve) 후 `dev` 브랜치에 Merge 합니다.
3. Merge가 완료된 `feature` 브랜치는 삭제합니다.

---

## 🚀 실행 방법

```bash
npm install
cp .env.example .env.development   # 최초 1회
npm run dev
```

### 환경변수

`.env` 파일은 `.gitignore`에 있어 저장소에 올라가지 않습니다. 클론 직후에는 `.env.example`을
복사해서 만들어야 합니다. 값이 없으면 API 요청이 전부 실패하거나 구글 로그인 버튼이 동작하지 않습니다.

| 변수 | 설명 |
| --- | --- |
| `VITE_API_BASE_URL` | API 서버 주소. **`/api/v1`까지 포함해야 합니다.** 빠지면 모든 요청이 404·401로 떨어집니다 |
| `VITE_GOOGLE_CLIENT_ID` | 구글 로그인용 OAuth 클라이언트 ID |

로컬은 `.env.development`, 빌드는 `.env.production`을 사용합니다.

> **⚠️ 배포 시 주의**
>
> Vite는 환경변수를 **빌드 시점에 코드에 그대로 새겨 넣습니다.** 실행 중에 읽는 것이 아닙니다.
> 그래서 Vercel 같은 배포 환경에서는 두 가지를 모두 해야 합니다.
>
> 1. 배포 환경의 Environment Variables에 값을 등록 (`.env` 파일은 저장소에 없으므로 빌드 머신에 존재하지 않습니다)
> 2. **등록 후 재배포** — 변수만 추가하면 이미 올라간 빌드는 바뀌지 않습니다
>
> 값을 붙여넣을 때 앞뒤 공백이 섞이지 않도록 주의하세요. 눈에 보이지 않아 원인을 찾기 어렵습니다.

### 구글 로그인을 로컬에서 테스트할 때

GCP 콘솔의 **승인된 자바스크립트 원본**에 실행 중인 주소가 등록돼 있어야 팝업이 뜹니다.
`http://localhost:5173`이 기본으로 등록돼 있으므로 **다른 포트로 띄우면 로그인과 API 호출(CORS)이 모두 막힙니다.**

---

## 📱 화면 목록 및 플로우

화면은 **라우트 화면**과 **오버레이**로 나뉩니다. 오버레이는 주소가 바뀌지 않고 현재 화면 위에 열립니다.

### 라우트 화면

| 경로 | 화면 | 설명 |
| --- | --- | --- |
| `/` | Splash | 앱 진입. 부트스트랩이 끝나면 Home으로 이동 |
| `/home` | Home | 월간 캘린더 |
| `/calendar/year` | Year Calendar | 연간 캘린더 |
| `/daily/:date` | Daily | 하루 일정과 준비·실행 항목 |
| `/event/:eventId` | Event View | 일정 상세 |
| `/terms`, `/privacy` | Legal | 약관·개인정보 문서. **로그인 없이 열리는 독립 페이지**로, 앱 셸과 부트스트랩을 거치지 않습니다 |

### 오버레이

| 이름 | 여는 곳 | 설명 |
| --- | --- | --- |
| Create Modal | Home · Year Calendar · Daily | 자연어 일정 입력과 저장 |
| Search Overlay | Home · Year Calendar | 일정·항목 키워드 검색 |
| Label 시트 | Home · Year Calendar | 라벨 목록 · 수정 · 생성 |
| Settings 시트 | Home · Year Calendar | 설정, 약관 보기, 로그아웃·탈퇴 |
| Event Edit 시트 | Event View | 일정 수정 |

### 화면 플로우

#### 🏠 Home (월간 캘린더)

```
[앱 실행]
    │
    ▼
[Splash] ──▶ [Home]

[Home]
    │
    ├─ 날짜 빈 곳 click ───────▶ [Daily]
    │
    ├─ 일정 블록 click ────────▶ [Event View]   ※ 반복 일정은 누른 회차로 열림
    │
    ├─ 날짜 long press ────────▶ (Create Modal)
    │
    ├─ 추가 버튼 click ────────▶ (Create Modal)
    │
    ├─ 헤더 뒤로가기 ──────────▶ [Year Calendar]
    │
    └─ 헤더 검색 / 라벨 / 설정 ─▶ (각 오버레이)
```

#### 🗓️ Year Calendar (연간 캘린더)

```
[Year Calendar]
    │
    ├─ 월 선택 ────────────────▶ [Home] (해당 월)
    │
    ├─ 추가 버튼 click ────────▶ (Create Modal)
    │
    └─ 헤더 검색 / 라벨 / 설정 ─▶ (각 오버레이)
```

#### 📋 Daily

```
[Daily]
    │
    ├─ 일정 카드 click ────────▶ [Event View]   ※ 카드 전체가 터치 영역
    │
    ├─ 주간 날짜 선택 ─────────▶ [해당 날짜 Daily]
    │
    ├─ 추가 버튼 click ────────▶ (Create Modal)
    │
    └─ 뒤로가기 ──────────────▶ [Home]
```

#### ➕ Create Modal (일정 생성)

```
(Create Modal)
    │
    ├─ 자연어 일정 입력
    │        │
    │        ▼
    │   AI 일정 분석
    │        │
    │        ▼
    │   추천 준비물 · 할 일 생성 + 날짜 자동 설정
    │        ├─ 추천 항목 수정
    │        └─ 직접 항목 추가
    │
    ├─ 날짜 선택
    │        │
    │        ▼
    │   [Calendar Picker]
    │        ├─ 시간 설정
    │        └─ 반복 설정
    │
    ├─ 라벨 선택
    │        └─ 새 라벨 만들기 ──▶ (Label Create 시트)
    │
    └─ 저장 ───────────────▶ 열었던 화면으로 복귀 (캘린더 갱신)
```

#### 📝 Event View (일정 상세)

```
[Event View]
        │
        ├─ 수정 ───────────────▶ (Event Edit 시트)
        │                          └─ 저장 ──▶ [Event View] 갱신
        │
        ├─ 준비·실행 항목 체크
        │
        ├─ 이벤트 삭제
        │        │
        │        ▼
        │   삭제 확인 팝업
        │        ├─ 취소 ─────▶ [Event View]
        │        └─ 삭제 ─────▶ [Home] 또는 [Daily]
        │
        └─ 뒤로가기 ─────────▶ 직전 화면 ([Home] 또는 [Daily])
```

#### 🔍 Search Overlay

```
(Search Overlay)
    │
    ├─ 키워드 입력 ── 일정·준비 항목 검색
    │
    └─ 결과 선택 ──────────────▶ [Event View]
```
