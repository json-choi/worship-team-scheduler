# Worship Team Scheduler — 프로젝트 기획서

## 1. 개요

교회 찬양팀(또는 사역팀) 일정을 효율적으로 관리하는 웹앱.
멤버의 참석 가능 여부를 수집하고, 포지션별로 자동 분배하여,
관리자 승인 후 확정된 일정을 캘린더에 반영한다.

---

## 2. 유저 플로우

### 2.1 온보딩
```
신규 가입 → 프로필 입력 (이름, 연락처, 포지션) → 팀 코드 입력 → 가입 신청
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

### 2.3 일정 당일
```
인도자: 해당 일정에 콘티 작성 (곡 목록, 키, 유튜브 링크, 악보 첨부)
  ↓
멤버에게 콘티 등록 알림
  ↓
멤버: 앱에서 다가오는 일정 + 콘티 확인
```

---

## 3. 핵심 기능 상세

### 3.1 팀 관리 (관리자)

| 기능 | 설명 |
|------|------|
| 팀 생성 | 팀 이름, 설명, 정기 일정 (매주 일요일 등) 설정 |
| 포지션 관리 | 포지션 추가/수정/삭제 (싱어, 드럼, 기타, 일렉, 베이스, 건반, 세컨, 인도자, 엔지니어 등) |
| 포지션별 필요 인원 | 각 포지션별 최소/최대 인원 설정 (예: 싱어 2~4명, 드럼 1명) |
| 멤버 관리 | 가입 승인/거절, 역할 변경, 멤버 제거 |
| 일정 생성 | 다음달 스케줄 생성 (반복 패턴 기반 자동 생성 가능) |
| 분배 승인 | 자동 분배 결과 확인, 수동 조정, 최종 승인 |

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
| 이벤트 상세 | 일정 제목, 포지션, 콘티 링크 포함 |
| 양방향 동기화 | 캘린더에서 삭제/수정 시 반영 (선택) |

### 3.5 콘티 관리

| 기능 | 설명 |
|------|------|
| 콘티 작성 | 인도자가 해당 일정에 글 작성 |
| 곡 목록 | 곡 이름, 키, BPM, 순서 |
| 유튜브 링크 | 각 곡의 참고 영상 (임베드 재생) |
| 파일 첨부 | 악보 PDF, PPT 등 업로드 |
| 코멘트 | 멤버가 질문/의견 작성 |

### 3.6 알림

| 트리거 | 알림 내용 | 대상 |
|--------|----------|------|
| 스케줄 오픈 | "다음달 일정이 열렸습니다. 투표해주세요" | 전체 멤버 |
| 투표 마감 임박 | "투표 마감 D-2입니다" | 미투표 멤버 |
| 일정 확정 | "○월 ○일 찬양팀에 배정되었습니다" | 배정 멤버 |
| 콘티 등록 | "○월 ○일 콘티가 등록되었습니다" | 해당 일정 멤버 |
| 가입 신청 | "새로운 가입 신청이 있습니다" | 관리자 |
| 일정 변경 | "○월 ○일 일정이 변경되었습니다" | 해당 일정 멤버 |

---

## 4. 데이터 모델

### 4.1 ERD 개요

```
Team
├── id, name, description, invite_code, created_at
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

Setlist (콘티)
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

---

## 5. 기술 스택

| 레이어 | 기술 | 이유 |
|--------|------|------|
| **Framework** | Next.js 15 (App Router) | SSR + API Routes + Server Actions, 풀스택 |
| **UI** | React 19 + TailwindCSS + shadcn/ui | 빠른 개발, 모바일 반응형 |
| **Database** | Supabase (PostgreSQL) | 호스팅된 DB + Auth + Realtime + Storage |
| **Auth** | Supabase Auth (Google OAuth) | Google 로그인 + Calendar 권한 동시 처리 |
| **Calendar** | Google Calendar API v3 | 읽기/쓰기 양방향 연동 |
| **Push** | Web Push API + Supabase Edge Functions | 브라우저 푸시 알림 |
| **File Storage** | Supabase Storage | 악보/첨부파일 업로드 |
| **Realtime** | Supabase Realtime | 투표 현황 실시간 업데이트 |
| **Deploy** | Vercel | Next.js 최적화, 자동 배포 |
| **Mobile** | PWA (Progressive Web App) | 앱 설치 없이 홈 화면 추가 |

---

## 6. 페이지 구조

```
/ (랜딩)
├── /login — Google 로그인
├── /onboarding — 프로필 입력 + 팀 참가
│
├── /dashboard — 메인 대시보드
│   ├── 다가오는 내 일정 카드
│   ├── 미투표 스케줄 알림
│   └── 최근 콘티 알림
│
├── /schedule — 스케줄
│   ├── /schedule/[month] — 월별 스케줄 뷰
│   ├── /schedule/[id] — 일정 상세 (투표 + 콘티)
│   └── /schedule/[id]/vote — 투표 화면
│
├── /team — 팀 관리
│   ├── /team/members — 멤버 목록
│   ├── /team/positions — 포지션 관리
│   └── /team/settings — 팀 설정
│
├── /admin — 관리자
│   ├── /admin/schedule/new — 스케줄 생성
│   ├── /admin/schedule/[id]/assign — 분배 확인/승인
│   └── /admin/members — 가입 승인
│
├── /setlist — 콘티
│   ├── /setlist/[schedule_id] — 콘티 보기
│   └── /setlist/[schedule_id]/edit — 콘티 작성/수정
│
├── /calendar — 캘린더 뷰 (Google Calendar 통합)
├── /notifications — 알림 목록
└── /settings — 개인 설정 (알림, 캘린더 연동)
```

---

## 7. 개발 Phase

### Phase 1 — 기반 (MVP Core)
- [ ] P1-1: Next.js 프로젝트 셋업 (Bun + TailwindCSS + shadcn/ui)
- [ ] P1-2: Supabase 설정 (DB 스키마, Auth, Storage)
- [ ] P1-3: Google OAuth 로그인
- [ ] P1-4: 온보딩 플로우 (프로필 입력 + 팀 참가 신청)
- [ ] P1-5: 팀 생성 + 관리자 대시보드
- [ ] P1-6: 포지션 관리 CRUD

### Phase 2 — 스케줄링 핵심
- [ ] P2-1: 스케줄 생성 (관리자, 반복 패턴)
- [ ] P2-2: 투표 UI (캘린더 뷰 + 가능/불가/미정)
- [ ] P2-3: 투표 현황 매트릭스 뷰
- [ ] P2-4: 자동 분배 알고리즘 구현
- [ ] P2-5: 분배 결과 확인 + 수동 조정 UI
- [ ] P2-6: 관리자 최종 승인 플로우

### Phase 3 — 캘린더 연동
- [ ] P3-1: Google Calendar OAuth 스코프 추가
- [ ] P3-2: 내 캘린더 읽기 (투표 화면에 표시)
- [ ] P3-3: 확정 일정 → Google Calendar에 이벤트 추가
- [ ] P3-4: 이벤트 상세 (포지션, 콘티 링크 포함)

### Phase 4 — 콘티 & 소통
- [ ] P4-1: 콘티 작성 UI (Rich Text + 곡 목록)
- [ ] P4-2: 유튜브 링크 임베드
- [ ] P4-3: 파일 첨부 (Supabase Storage)
- [ ] P4-4: 코멘트 시스템

### Phase 5 — 알림 & PWA
- [ ] P5-1: Web Push 알림 설정
- [ ] P5-2: 알림 트리거 구현 (투표 마감, 일정 확정, 콘티 등록)
- [ ] P5-3: 인앱 알림 센터
- [ ] P5-4: PWA 매니페스트 + 오프라인 지원
- [ ] P5-5: 모바일 최적화

### Phase 6 — 폴리시
- [ ] P6-1: 대시보드 위젯 (다가오는 일정, 미투표)
- [ ] P6-2: 통계 (참여율, 포지션별 분포)
- [ ] P6-3: 다크모드
- [ ] P6-4: 멀티 팀 지원 (한 사람이 여러 팀)
- [ ] P6-5: 카카오톡 알림 연동 (선택)

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
- **Server Components 우선**: 가능하면 서버 컴포넌트, 클라이언트 최소화
- **테스트**: 핵심 로직 (분배 알고리즘, 투표 집계) 유닛 테스트 필수

---

## 10. MVP 범위 (Phase 1-2)

**포함**:
- Google 로그인
- 팀 생성/참가
- 포지션 관리
- 스케줄 생성 + 투표
- 자동 분배 + 관리자 승인

**제외 (나중에)**:
- Google Calendar 연동
- 콘티 시스템
- 푸시 알림
- PWA
