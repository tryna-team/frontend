# Google Calendar 연동 및 데이터 사용 안내

tryna는 Google Calendar의 기존 일정을 불러와 표시하고 동기화하기 위해 캘린더 읽기 전용 권한을 사용합니다.

## 핵심 내용

| 구분 | 내용 |
|---|---|
| **요청 권한** | `calendar.readonly` 읽기 전용 권한 |
| **접근 정보** | 캘린더·일정 식별정보, 제목, 날짜·시간, 장소, 설명, 반복정보와 동기화 상태 |
| **이용 목적** | 기존 일정 표시·동기화 및 이용자가 요청한 일정 관련 기능 제공 |
| **쓰기 제한** | Google Calendar 일정을 생성·수정·삭제하지 않음 |
| **보관 기준** | 연동 유지 기간 동안 필요한 인증정보와 동기화 정보를 보관하고 연동 해제·탈퇴 시 삭제하는 것을 원칙으로 함 |
| **금지 목적** | 광고 타기팅, 데이터 판매, 신용평가 및 범용 AI·ML 모델 학습에 사용하지 않음 |

tryna가 Google Workspace API에서 수신한 정보의 이용은 Google API Services User Data Policy 및 Limited Use 요구사항을 따릅니다.

자세한 내용은 [Google Calendar 연동 및 데이터 사용 안내](/google-calendar-policy)와 [개인정보 처리방침](/privacy)에서 확인할 수 있습니다.
