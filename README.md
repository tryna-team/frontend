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
| 스카 (박남은) | 이벤트 뷰 (생성, 삭제, 편집) | FloatingButton, Button |
| 유요미 (최유연) | 스플래시, 홈, 데일리 | CalendarGrid |
| 갱 (유경민) | 이벤트 생성 | Header, Checklist, CreateModal |

---

## 🛠️ 기술 스택

| 구분 | 기술 |
| --- | --- |
| Framework | React |
| Language | TypeScript |
| Build Tool | Vite |
| Styling | Tailwind CSS |
| UI Library | shadcn/ui |
| Formatter | Prettier |
| Linter | ESLint |

---

## 📁 폴더 구조

```
src/
├── components/
│   ├── ui/                  # shadcn/ui 컴포넌트
│   └── common/              # Tryna 공용 컴포넌트
│       ├── Header/
│       ├── CalendarGrid/
│       ├── Buttons/
│       ├── Checklist/
│       └── CreateModal/
├── features/
│   ├── splash/              # O. 스플래시
│   ├── calendar/            # A. 홈 (월간)
│   │   ├── components/
│   │   ├── hooks/           # useCalendar, useMonthDates
│   │   └── utils/           # 날짜 그리드 계산
│   └── event/               # B. 생성 + C. 상세
│       ├── components/      # EventForm, EventDetail, EventCard
│       └── hooks/
├── apis/                    # axios 인스턴스, 공통 API 설정
├── hooks/                   # 전역 커스텀 훅
├── types/                   # Event, Checklist, Calendar 타입
└── pages/                   # 라우트 조립
```

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
npm run dev
```

---

## 📱 화면 목록 및 플로우

### 화면 목록

- Splash
- Home (월간 캘린더)
- Daily (일간 일정)
- Event View (이벤트 상세)

### 화면 플로우

#### 🏠 Home

```
[앱 실행]
    │
    ▼
[Splash]
    │
    ▼
[Home]
    │
    ├─ 날짜 click ─────────────▶ [Daily]
    │
    ├─ 날짜 long press ────────▶ [Event Create]
    │
    └─ 추가 버튼 클릭 ─────────────▶ [Event Create]
```

#### 📋 Daily

```
[Daily]
    │
    ├─ 체크리스트 완료
    │
    ├─ 일정 선택 ─────────────▶ [Event View]
    │
    ├─ 추가 버튼 클릭 ───────────▶ [Event Create]
    │
    ├─ 날짜 선택 ─────────────▶ [해당 날짜 Daily]
    │ 
    └─ 뒤로가기 ──────────────▶ [Home]
```

#### ➕ Event Create

```
[Event Create]
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
    ├─ 그룹 선택
    │
    │
    └─ 저장 ───────────────▶ [Home] 또는 [Daily]
```

#### 📝 Event View

```
[Event View]
        │
        ├─ 수정 ───────────────▶ [Event Create]
        │
        ├─ 이벤트 삭제
        │        │
        │        ▼
        │   삭제 확인 팝업
        │        ├─ 취소 ─────▶ [Event View]
        │        └─ 삭제 ─────▶ [Daily]
        │
        └─ 뒤로가기 ─────────▶ [Daily]
```