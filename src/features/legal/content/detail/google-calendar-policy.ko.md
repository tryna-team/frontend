# Google Calendar 연동 및 데이터 사용 안내

시행일: 2026년 8월 20일

tryna는 이용자가 기존 일정을 한곳에서 확인할 수 있도록 Google Calendar 연동 기능을 제공합니다. 본 안내는 연동 과정에서 요청하는 권한과 Google 사용자 데이터의 접근·이용·보관·삭제 기준을 설명하며, [개인정보 처리방침](/privacy) 및 [서비스 이용약관](/terms)과 함께 적용됩니다.

## 1. 연동 목적

Google Calendar 연동은 다음 기능을 제공하기 위해 사용됩니다.

- Google Calendar의 기존 일정을 tryna 캘린더에서 함께 표시
- Google Calendar에서 변경된 일정 내용을 tryna에 동기화
- 일정과 연결된 준비물·할 일 제안 등 이용자가 요청한 일정 관련 기능 제공

Google Calendar 연동은 선택사항이며, 이용자는 언제든지 연동을 해제할 수 있습니다.

## 2. 요청하는 권한

| 구분 | 내용 |
|---|---|
| OAuth 범위 | `https://www.googleapis.com/auth/calendar.readonly` |
| 접근 수준 | 이용자가 접근할 수 있는 Google Calendar와 일정의 읽기 및 다운로드 |
| 쓰기 권한 | 요청하지 않음 |

tryna는 읽기 전용 권한으로 Google Calendar의 일정을 생성·수정·삭제하지 않습니다.

로그인과 계정 식별을 위해 Google 계정의 기본 프로필 및 이메일 권한이 함께 요청될 수 있습니다.

## 3. 접근하는 정보

연동 기능 제공에 필요한 범위에서 다음 정보에 접근할 수 있습니다.

- 캘린더 및 일정 식별정보
- 캘린더 이름과 기본 시간대
- 일정 제목
- 시작·종료 날짜와 시간
- 장소와 설명
- 반복 일정 정보
- 일정의 변경 및 동기화 상태

tryna는 이용자가 권한을 부여한 Google 계정에서 위 정보를 읽으며, 요청한 기능과 관계없는 목적으로 사용하지 않습니다.

## 4. 데이터 이용 목적

Google Calendar에서 받은 정보는 다음 목적으로만 이용합니다.

- tryna 화면에서 기존 일정 표시
- 외부 일정의 최신 상태 동기화
- 일정 충돌 방지와 일정 확인 기능 제공
- 해당 이용자를 위한 준비물·할 일 제안 등 화면에 명확히 표시되는 사용자 기능 제공
- 연동 오류 확인, 보안 유지 및 이용자 문의 대응

Google 사용자 데이터는 광고 타기팅, 데이터 판매, 신용평가 또는 대출 결정에 사용하지 않습니다. 또한 특정 이용자에게 제공되는 기능을 벗어나 범용 인공지능 또는 머신러닝 모델을 생성·학습·개선하는 데 사용하지 않습니다.

## 5. 데이터 보관 및 삭제

연동을 유지하고 일정을 동기화하기 위해 다음 정보가 서비스 서버에 보관될 수 있습니다.

- Google OAuth 연결 유지에 필요한 인증정보
- 동기화된 일정정보와 외부 일정 식별정보
- 마지막 동기화 시각 및 동기화 상태

이 정보는 Google Calendar 연동을 유지하는 동안 보관하는 것을 원칙으로 합니다. 이용자가 연동을 해제하거나 회원 탈퇴를 완료하면 관련 인증정보와 동기화된 외부 일정정보를 삭제하는 것을 원칙으로 하며, 법령상 보관 의무 또는 백업 보관 주기가 적용되는 경우에는 [개인정보 처리방침](/privacy)에 따릅니다.

이용자는 서비스 내 Google Calendar 연결 해제 기능을 이용하거나 `tryingtotryna@gmail.com`으로 요청하여 연동 해제와 데이터 삭제를 요청할 수 있습니다.

## 6. 데이터 제공 및 사람에 의한 열람 제한

Google 사용자 데이터는 원칙적으로 제3자에게 판매하거나 제공하지 않습니다. 다만 다음 경우에는 필요한 최소 범위에서 처리 또는 제공될 수 있습니다.

- 이용자가 요청한 사용자 기능을 제공하거나 개선하기 위해 이용자의 동의를 받은 경우
- 부정 이용 조사 등 보안을 위해 필요한 경우
- 관련 법령이나 적법한 절차를 준수해야 하는 경우

tryna 담당자는 이용자의 명시적인 동의가 있거나, 보안상 필요한 경우, 법령상 의무를 이행하는 경우를 제외하고 Google 사용자 데이터를 임의로 열람하지 않습니다. 내부 운영을 위한 통계는 관련 법령에 따라 집계·비식별화된 형태로 처리합니다.

## 7. Google 사용자 데이터 정책 준수

tryna가 Google Workspace API에서 수신한 정보의 이용은 [Google API Services User Data Policy](https://developers.google.com/terms/api-services-user-data-policy)와 [Google Workspace API User Data and Developer Policy](https://developers.google.com/workspace/workspace-api-user-data-developer-policy)를 준수하며, **Limited Use 요구사항을 포함한 제한적 이용 원칙을 따릅니다.**

> tryna's use and transfer of information received from Google APIs to any other app will adhere to the Google API Services User Data Policy, including the Limited Use requirements.

이에 따라 Google 사용자 데이터는 이용자가 확인할 수 있는 tryna의 사용자 기능을 제공하거나 개선하는 범위에서만 사용되며, 허용되지 않은 이전·판매·광고 활용 또는 범용 AI 모델 학습에 사용되지 않습니다.

## 8. 보호조치

tryna는 Google 사용자 데이터를 보호하기 위해 접근 권한 관리, 전송 구간 보호, 인증정보의 제한적 취급, 연동 해제 시 데이터 삭제 등 합리적인 기술적·관리적 조치를 적용합니다. 구체적인 개인정보 보호조치는 [개인정보 처리방침](/privacy)에서 확인할 수 있습니다.

## 9. 안내 변경 및 문의

연동 방식, 요청 권한 또는 Google 사용자 데이터의 이용 목적이 변경되는 경우 본 안내와 개인정보 처리방침을 갱신하고 필요한 경우 이용자의 동의를 다시 받습니다.

- 이메일: `tryingtotryna@gmail.com`
- 개인정보 처리방침: [확인하기](/privacy)
- 서비스 이용약관: [확인하기](/terms)
