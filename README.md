# 🎵 Worship Team Scheduler

교회 사역팀 일정관리 앱 — 포지션별 스케줄링, 자동 분배, 캘린더 연동

## 핵심 기능

- **팀 관리**: 관리자가 팀 생성, 포지션 설정, 인원 관리
- **스케줄 투표**: 멤버가 참석 가능 일정에 투표
- **자동 분배**: 포지션별 필요 인원에 맞춰 골고루 자동 배정
- **캘린더 연동**: Google Calendar 등 기존 캘린더와 양방향 연동
- **콘티 관리**: 인도자가 곡 목록, 유튜브 링크, 첨부파일 공유
- **알림**: 투표 마감, 일정 확정, 콘티 등록 시 푸시 알림

## Tech Stack

- **Frontend**: Next.js 15 (App Router) + React 19 + TailwindCSS + shadcn/ui
- **Backend**: Next.js API Routes + Server Actions
- **Database**: Supabase (PostgreSQL + Auth + Realtime)
- **Calendar**: Google Calendar API
- **Push**: Web Push API + FCM
- **Deploy**: Vercel

## Getting Started

```bash
bun install
bun dev
```
