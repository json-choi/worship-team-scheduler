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

- **Mobile**: Expo 54 (React Native) + Expo Router 6
- **UI**: NativeWind (TailwindCSS) + gluestack-ui
- **Backend**: Hono 4.x on Vercel (Serverless)
- **Database**: Supabase (PostgreSQL + Auth + Realtime + Storage)
- **Calendar**: Google Calendar API v3
- **Push**: Expo Notifications (FCM + APNs)
- **Monorepo**: Bun Workspaces + Turborepo

## Project Structure

```
apps/mobile/       — Expo 앱 (iOS/Android)
packages/api/      — Hono API 서버 (Vercel)
packages/db/       — Supabase 스키마 + Drizzle
packages/shared/   — 공유 타입, Zod 스키마
```

## Getting Started

```bash
bun install
bun dev          # 전체 (Expo + API)
bun dev:mobile   # Expo만
bun dev:api      # API만
```
