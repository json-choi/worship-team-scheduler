# Church Ministry Scheduler (교회 사역팀 일정관리) — 프로젝트 기획서

## 1. 개요

교회 사역팀(찬양팀, 주일학교, 중보기도팀, 미디어팀, 봉사팀 등)의 일정을 효율적으로 관리하는 모바일 앱.
멤버의 참석 가능 여부를 수집하고, 포지션/역할별로 자동 분배하여,
관리자 승인 후 확정된 일정을 캘린더에 반영한다.

> **파일럿 케이스**: 첫 번째 대상은 **워십팀(찬양팀)**이며, 검증 후 다른 사역팀으로 확장한다.

---

## 2. 유저 플로우

### 2.1 온보딩
```
신규 가입 → 프로필 입력 (이름, 연락처, 역할/포지션) → 팀 코드 입력 → 가입 신청
  ↓
관리자에게 알림 → 관리자 승인/거절 → 승인 시 팀 합류 완료
```

### 2.2 월간 스케줄 사이클
```
매월 20일경: 관리자가 다음달 스케줄 오픈 (또는 자동)
  ↓
멤버: 내 캘린더 보면서 참석 가능 일정에 투표 (가능/불가/미정)
  ↓
투표 마감 (마감일 알림)
  ↓
시스템: 포지션별 필요 인원 기준으로 자동 분배 (공평하게)
  ↓
관리자: 분배 결과 확인 → 수동 조정 가능 → 최종 승인
  ↓
멤버에게 확정 알림 + Google Calendar에 일정 자동 추가
```

### 2.3 일정 당일 — 사역 자료 공유
```
담당자: 해당 일정에 사역 자료 작성
  - 워십팀: 콘티 (곡 목록, 키, 유튜브 링크, 악보 첨부)
  - 기타 사역팀: 공지사항, 준비물, 참고 자료 등
  ↓
멤버에게 자료 등록 알림
  ↓
멤버: 앱에서 다가오는 일정 + 사역 자료 확인
```

---

## 3. 핵심 기능 상세

### 3.1 팀 관리 (관리자)

| 기능 | 설명 |
|------|------|
| 팀 생성 | 팀 이름, 팀 유형(워십, 주일학교, 미디어 등), 설명, 정기 일정 설정 |
| 포지션/역할 관리 | 팀 유형에 따라 포지션 추가/수정/삭제 |
| 포지션별 필요 인원 | 각 포지션별 최소/최대 인원 설정 |
| 멤버 관리 | 가입 승인/거절, 역할 변경, 멤버 제거 |
| 일정 생성 | 다음달 스케줄 생성 (반복 패턴 기반 자동 생성 가능) |
| 분배 승인 | 자동 분배 결과 확인, 수동 조정, 최종 승인 |

> **팀 유형별 포지션 예시**:
> - 워십팀: 싱어, 드럼, 기타, 일렉, 베이스, 건반, 세컨, 인도자, 엔지니어
> - 주일학교: 설교, 찬양인도, 게임진행, 반별교사, 간식담당
> - 미디어팀: 카메라, 자막, 음향, 조명, 방송송출
> - 봉사팀: 주차, 안내, 접수, 식당

### 3.2 스케줄 투표 (멤버)

| 기능 | 설명 |
|------|------|
| 캘린더 뷰 | 내 Google Calendar 일정과 팀 일정을 겹쳐서 표시 |
| 투표 | 각 날짜별 가능/불가/미정 선택 (되도록 많이 가능으로) |
| 한눈에 보기 | 투표 현황 — 누가 언제 가능한지 매트릭스 뷰 |
| 투표 수정 | 마감 전까지 변경 가능 |

### 3.3 자동 분배 알고리즘

**목표**: 포지션별 필요 인원을 충족하면서, 멤버 간 참여 횟수를 균등하게 분배

**알고리즘**:
1. 각 일정별로 가능한 멤버 목록 수집
2. 포지션별 필요 인원 확인
3. 우선순위: (참여 횟수 적은 순 > 연속 참여 방지 > 가능 투표 수 적은 멤버 우선)
4. 제약 조건:
   - 한 일정에 같은 사람이 2개 포지션 불가 (옵션으로 허용 가능)
   - 최소 인원 미달 시 관리자에게 경고
   - 연속 3주 이상 참여 방지 (설정 가능)
5. 결과: 일정별 포지션-멤버 매핑

### 3.4 캘린더 연동

| 기능 | 설명 |
|------|------|
| Google Calendar 읽기 | OAuth2로 연동, 투표 시 내 일정 표시 |
| 확정 일정 쓰기 | 승인된 일정을 Google Calendar에 이벤트로 추가 |
| 이벤트 상세 | 일정 제목, 포지션, 사역 자료 링크 포함 |
| 양방향 동기화 | 캘린더에서 삭제/수정 시 반영 (선택) |

### 3.5 사역 자료 관리

사역 자료는 팀 유형에 따라 다른 형태를 가집니다:

#### 공통 기능 (모든 사역팀)

| 기능 | 설명 |
|------|------|
| 자료 작성 | 담당자가 해당 일정에 공지/자료 작성 |
| 파일 첨부 | PDF, PPT 등 자료 업로드 (Supabase Storage) |
| 코멘트 | 멤버가 질문/의견 작성 |

#### 워십팀 전용 기능

| 기능 | 설명 |
|------|------|
| 콘티(셋리스트) 작성 | 인도자가 해당 일정에 콘티 작성 |
| 곡 목록 | 곡 이름, 키, BPM, 순서 |
| 유튜브 링크 | 각 곡의 참고 영상 (임베드 재생) |
| 악보 첨부 | 악보 PDF 업로드 |

> **향후 확장**: `setlists` 테이블은 현재 워십팀 전용으로 설계되어 있으나, 향후 "팀 자료(team_resources)" 테이블로 일반화하여 모든 사역팀이 유형에 맞는 자료를 관리할 수 있도록 확장할 수 있습니다.

### 3.6 알림

| 트리거 | 알림 내용 | 대상 |
|--------|----------|------|
| 스케줄 오픈 | "다음달 일정이 열렸습니다. 투표해주세요" | 전체 멤버 |
| 투표 마감 임박 | "투표 마감 D-2입니다" | 미투표 멤버 |
| 일정 확정 | "○월 ○일 사역팀에 배정되었습니다" | 배정 멤버 |
| 자료 등록 | "○월 ○일 사역 자료가 등록되었습니다" | 해당 일정 멤버 |
| 가입 신청 | "새로운 가입 신청이 있습니다" | 관리자 |
| 일정 변경 | "○월 ○일 일정이 변경되었습니다" | 해당 일정 멤버 |

---

## 4. 데이터 모델

### 4.1 ERD 개요

```
Team
├── id, name, description, invite_code, created_at
├── team_type (worship | sunday_school | media | service | prayer | custom)
├── schedule_pattern (JSON: 반복 요일/시간)
└── settings (JSON: 연속참여제한, 투표마감일 등)

TeamPosition
├── id, team_id, name, sort_order
├── min_required, max_required
└── icon, color

User
├── id, email, name, phone, avatar_url
├── google_calendar_token (encrypted)
└── push_subscription (JSON)

TeamMember
├── id, team_id, user_id
├── role (admin | member)
├── positions[] (가능한 포지션 목록)
├── status (pending | active | inactive)
└── joined_at

Schedule
├── id, team_id, date, time_start, time_end
├── title, description
├── status (draft | voting | closed | confirmed)
├── voting_deadline
└── created_by

ScheduleVote
├── id, schedule_id, user_id
├── availability (available | unavailable | maybe)
└── voted_at

ScheduleAssignment
├── id, schedule_id, user_id, position_id
├── status (auto | manual | confirmed)
└── assigned_at

Setlist (콘티 — 워십팀 전용)
├── id, schedule_id, created_by
├── content (Rich Text)
├── songs[] (JSON: [{name, key, bpm, youtube_url, order}])
├── attachments[] (파일 URL 목록)
└── created_at, updated_at

SetlistComment
├── id, setlist_id, user_id
├── content
└── created_at

Notification
├── id, user_id, type, title, body
├── data (JSON: 관련 링크 등)
├── read_at
└── created_at
```

> **DB 스키마 참고**: `teams`, `teamPositions` 등 핵심 테이블은 이미 사역팀 유형에 무관하게 일반화되어 있습니다. `setlists` 테이블은 워십팀 전용 기능으로 유지하되, 향후 모든 사역팀이 사용할 수 있는 `team_resources` 테이블로 일반화할 수 있습니다.

---

## 5. 기술 스택

| 레이어 | 기술 | 버전 | 이유 |
|--------|------|------|------|
| **Mobile App** | Expo (React Native) | 54.x | iOS/Android 네이티브 앱 출시, EAS Build |
| **Navigation** | Expo Router | 6.x | 파일 기반 라우팅, 딥링크 지원 |
| **UI** | React Native + NativeWind + gluestack-ui | latest | Tailwind 스타일 + 네이티브 컴포넌트 |
| **Backend API** | Hono | 4.x | 경량 + Vercel 배포 최적화, RPC 타입 안전 |
| **Deploy (API)** | Vercel (Serverless Functions) | - | Hono 네이티브 지원, 무료 티어 |
| **Database** | Supabase (PostgreSQL) | - | 호스팅 DB + Auth + Realtime + Storage |
| **Auth** | Supabase Auth (Google OAuth) | - | Google 로그인 + Calendar 권한 동시 처리 |
| **Calendar** | Google Calendar API v3 | - | 읽기/쓰기 양방향 연동 |
| **Push** | Expo Notifications + FCM/APNs | - | 네이티브 푸시 알림 |
| **File Storage** | Supabase Storage | - | 사역 자료/첨부파일 업로드 |
| **Realtime** | Supabase Realtime | - | 투표 현황 실시간 업데이트 |
| **Validation** | Zod | latest | API + 클라이언트 공유 스키마 |
| **State** | TanStack Query (React Query) | latest | 서버 상태 관리, 캐싱, 오프라인 지원 |

### 모노레포 구조
```
worship-team-scheduler/
├── apps/
│   └── mobile/          — Expo 앱 (React Native)
├── packages/
│   ├── api/             — Hono API 서버 (Vercel 배포)
│   ├── db/              — Supabase 스키마 + Drizzle ORM
│   └── shared/          — 공유 타입, Zod 스키마, 유틸
├── package.json         — Bun workspace root
└── turbo.json           — Turborepo 빌드 설정
```

---

## 6. 화면 구조 (Expo Router)

```
apps/mobile/app/
├── (auth)/              — 인증 전 화면
│   ├── login.tsx        — Google 로그인
│   └── onboarding.tsx   — 프로필 입력 + 팀 참가
│
├── (tabs)/              — 메인 탭 네비게이션
│   ├── _layout.tsx      — 하단 탭 바 (홈/스케줄/캘린더/알림/설정)
│   ├── index.tsx        — 홈 (다가오는 일정, 미투표 알림, 최근 자료)
│   ├── schedule/
│   │   ├── index.tsx    — 월별 스케줄 리스트
│   │   ├── [id].tsx     — 일정 상세 (투표 + 배정 결과 + 사역 자료)
│   │   └── [id]/vote.tsx — 투표 화면
│   ├── calendar.tsx     — 캘린더 뷰 (Google Calendar 통합)
│   ├── notifications.tsx — 알림 목록
│   └── settings.tsx     — 개인 설정
│
├── team/                — 팀 관리 (스택 네비게이션)
│   ├── members.tsx      — 멤버 목록
│   ├── positions.tsx    — 포지션 관리
│   └── settings.tsx     — 팀 설정
│
├── admin/               — 관리자 전용
│   ├── schedule/
│   │   ├── new.tsx      — 스케줄 생성
│   │   └── [id]/assign.tsx — 분배 확인/수동 조정/승인
│   └── members.tsx      — 가입 승인
│
├── resources/           — 사역 자료
│   ├── [scheduleId].tsx — 자료 보기 (워십팀: 콘티 | 기타: 공지/자료)
│   └── [scheduleId]/edit.tsx — 자료 작성/수정
│
└── _layout.tsx          — 루트 레이아웃 (auth 체크)
```

### Hono API 라우트 (packages/api/)
```
src/
├── index.ts             — Hono app 엔트리
├── routes/
│   ├── auth.ts          — 인증 (Google OAuth callback)
│   ├── teams.ts         — 팀 CRUD, 가입 신청/승인
│   ├── positions.ts     — 포지션 CRUD
│   ├── schedules.ts     — 스케줄 생성/조회
│   ├── votes.ts         — 투표 CRUD
│   ├── assignments.ts   — 자동 분배, 수동 조정, 승인
│   ├── resources.ts     — 사역 자료 CRUD (워십팀: 콘티 포함)
│   ├── notifications.ts — 알림 조회/읽음 처리
│   └── calendar.ts      — Google Calendar 연동
├── middleware/
│   ├── auth.ts          — JWT 검증 미들웨어
│   └── validate.ts      — Zod 검증 미들웨어
├── lib/
│   ├── supabase.ts      — Supabase 클라이언트
│   ├── assignment.ts    — 자동 분배 알고리즘
│   └── calendar.ts      — Google Calendar 헬퍼
└── types.ts             — Hono RPC 타입 export
```

---

## 7. 개발 Phase

### Phase 1 — 기반
- [ ] P1-1: 모노레포 셋업 (Bun workspace + Turborepo)
- [ ] P1-2: Expo 앱 초기화 (Expo 54 + Expo Router 6 + NativeWind)
- [ ] P1-3: Hono API 서버 초기화 (Vercel 배포 설정)
- [ ] P1-4: Supabase 설정 (DB 스키마 + Drizzle ORM + Auth)
- [ ] P1-5: 공유 패키지 (Zod 스키마, 타입, 유틸)
- [ ] P1-6: Google OAuth 로그인 (Expo AuthSession + Supabase Auth)
- [ ] P1-7: 온보딩 플로우 (프로필 입력 + 팀 참가 신청)
- [ ] P1-8: 팀 생성 + 관리자 대시보드 (팀 유형 선택 포함)
- [ ] P1-9: 포지션 관리 CRUD (팀 유형별 기본 포지션 템플릿)

### Phase 2 — 스케줄링 핵심
- [ ] P2-1: 스케줄 생성 API + UI (관리자, 반복 패턴)
- [ ] P2-2: 투표 UI (캘린더 뷰 + 가능/불가/미정)
- [ ] P2-3: 투표 현황 매트릭스 뷰
- [ ] P2-4: 자동 분배 알고리즘 구현 (packages/api/src/lib/assignment.ts)
- [ ] P2-5: 분배 결과 확인 + 수동 조정 UI
- [ ] P2-6: 관리자 최종 승인 플로우

### Phase 3 — 캘린더 연동
- [ ] P3-1: Google Calendar OAuth 스코프 추가
- [ ] P3-2: 내 캘린더 읽기 (투표 화면에 기존 일정 표시)
- [ ] P3-3: 확정 일정 → Google Calendar에 이벤트 추가
- [ ] P3-4: 이벤트 상세 (포지션, 사역 자료 링크 포함)

### Phase 4 — 사역 자료 & 소통
- [ ] P4-1: 사역 자료 작성 UI (공통: 공지/자료)
- [ ] P4-2: 워십팀 전용 — 콘티 작성 UI (곡 목록 + 키 + BPM)
- [ ] P4-3: 워십팀 전용 — 유튜브 링크 임베드 (react-native-youtube-iframe)
- [ ] P4-4: 파일 첨부 (Supabase Storage + expo-document-picker)
- [ ] P4-5: 코멘트 시스템 (Supabase Realtime)

### Phase 5 — 알림 & 앱 출시
- [ ] P5-1: Expo Notifications 설정 (FCM + APNs)
- [ ] P5-2: 알림 트리거 구현 (Supabase Edge Functions 또는 Hono cron)
- [ ] P5-3: 인앱 알림 센터
- [ ] P5-4: EAS Build + EAS Submit (App Store + Play Store)
- [ ] P5-5: 앱 아이콘, 스플래시, 스토어 에셋

### Phase 6 — 폴리시
- [ ] P6-1: 대시보드 위젯 (다가오는 일정, 미투표)
- [ ] P6-2: 통계 (참여율, 포지션별 분포 차트)
- [ ] P6-3: 다크모드 (NativeWind dark scheme)
- [ ] P6-4: 멀티 팀 지원 (한 사람이 여러 사역팀)
- [ ] P6-5: 카카오톡/문자 알림 연동 (선택)
- [ ] P6-6: 오프라인 지원 (TanStack Query persistence)
- [ ] P6-7: team_resources 테이블 일반화 (setlists → 모든 사역팀 자료 통합)

---

## 8. 자동 분배 알고리즘 상세

```python
# 의사코드
def auto_assign(schedule, votes, history):
    assignments = {}
    
    for position in schedule.positions:
        candidates = [
            member for member in votes
            if member.availability == 'available'
            and position.id in member.positions
            and member.id not in assignments.values()
        ]
        
        # 정렬 기준: 참여 횟수 적은 순 → 연속 미참여 많은 순
        candidates.sort(key=lambda m: (
            history.count(m.id),           # 총 참여 횟수 (적을수록 우선)
            -history.consecutive_gap(m.id), # 연속 안 한 횟수 (클수록 우선)
            random.random()                 # 동점일 때 랜덤
        ))
        
        needed = position.min_required
        for candidate in candidates[:needed]:
            assignments[position.id].append(candidate.id)
    
    # 검증: 최소 인원 미달 포지션 경고
    for position in schedule.positions:
        if len(assignments[position.id]) < position.min_required:
            warn(f"{position.name}: {len(assignments[position.id])}/{position.min_required}")
    
    return assignments
```

---

## 9. Coding Guidelines

- **라이브러리 최신 유지**: 항상 latest stable 사용, 에러 시 버전 먼저 확인
- **공식 문서 우선**: Next.js 15 App Router 패턴, Supabase v2 클라이언트
- **TypeScript strict mode**: `any` 최소화
- **Expo 최신**: Expo SDK 54, Expo Router 6, React Native 최신 안정 버전
- **Hono RPC**: 클라이언트에서 타입 안전한 API 호출 (`hc<AppType>`)
- **테스트**: 핵심 로직 (분배 알고리즘, 투표 집계) 유닛 테스트 필수

---

## 10. MVP 범위 (Phase 1-2)

**포함 (Phase 1-2)**:
- Expo 앱 + Hono API 모노레포 셋업
- Google 로그인 (Supabase Auth)
- 팀 생성/참가 (팀 유형 선택)
- 포지션 관리
- 스케줄 생성 + 투표
- 자동 분배 + 관리자 승인

**파일럿**: 워십팀(찬양팀)으로 먼저 검증

**제외 (Phase 3+)**:
- Google Calendar 연동
- 사역 자료 시스템 (콘티 포함)
- 푸시 알림
- 앱 스토어 출시
