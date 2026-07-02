# TheAnchor — Project Documentation

**Version:** 1.2
**Status:** MVP Development (Phase 3)
**Founder:** Afzal

---

## Tagline
"Built for the days your motivation runs out — not just the days it's high."

## Core Problem
Most people who try to build habits don't fail from lack of motivation on day 1 — they fail because **motivation naturally decays around day 3–14**, and most habit apps don't design for that dip. They just give you a prettier checklist.

**TheAnchor is engineered specifically for that dip window**, not for the initial high.

## Product Goal
Build an application that helps users remain disciplined by making it easy to:
- Build routines
- Track progress
- Recover after setbacks
- Stay motivated through progress instead of perfection

## Core Philosophy
Discipline should not depend on motivation. TheAnchor helps users return after setbacks instead of punishing them for failure.

## Target Users
**Primary audience:** students, university students, beginner entrepreneurs, developers, gym beginners, and anyone trying to improve consistency.
**Age range:** 16–30

---

## MVP Scope

**Included (V1)**
- ✅ Authentication (Magic Link)
- ✅ Anchors (create/edit/delete)
- ✅ Sessions (timer)
- ✅ Momentum
- ✅ XP
- ✅ Levels & Ranks
- ✅ Statistics
- ✅ Profile
- ✅ Settings

**Not Included in MVP** *(see Future Roadmap)*
- ❌ AI Coach
- ❌ Adaptive Difficulty
- ❌ Future-You Messages
- ❌ Accountability Duos
- ❌ Mood Tracking
- ❌ Apple Health / Wearables
- ❌ Google / Apple Sign-In *(nice-to-have, not blocking V1 ship)*

Anything not on the "Included" list does not get built until V1 ships. This section is the tie-breaker for scope arguments.

---

## Tech Stack
- **Frontend:** React Native + Expo (cross-platform iOS/Android)
- **Backend/Database:** Supabase (PostgreSQL + Auth + Row Level Security)
- **Auth:** Supabase Magic Link (email-based, passwordless); Google/Apple Sign-In deferred post-V1
- **Editor:** VS Code
- **Version control:** GitHub

### Folder Structure
```
src/
  components/
  screens/
  navigation/
  hooks/
  services/
  lib/
  supabase/
  types/
  constants/
assets/
```

---

## User Flow (MVP)

```
Open App
  ↓
Onboarding (first launch only)
  ↓
Login (Magic Link)
  ↓
Has Anchors? ──No──> Create First Anchor
  │Yes
  ↓
Home (Today's Anchors, Momentum, XP, Level, Rank)
  ↓
Select Anchor ──> Start Session (timer)
  ↓
Pause / Resume (optional)
  ↓
Finish Session
  ↓
XP Awarded → Momentum Updated → Level Check
  ↓
Back to Home / View Statistics
```

Secondary flows:
- **Home → Add/Edit/Delete Anchor**
- **Home → Statistics**
- **Home → Profile → Settings**
- **Any screen → Logout → Login**

This flow is the build order for screens — don't build Statistics before Session works end-to-end.

---

## Screen Specifications

### 1. Onboarding
- **Purpose:** First-run pitch, sets expectations before login.
- **Displayed info:** App name, tagline, 2–3 value-prop slides.
- **Buttons:** "Get Started"
- **User actions:** Swipe/tap through slides, tap Get Started → Login.
- **Edge cases:** Already-logged-in user should skip straight to Home.
- **Loading state:** N/A (static content).
- **Empty state:** N/A.
- **API calls:** None.
- **Navigation:** → Login.

### 2. Login
- **Purpose:** Authenticate via Supabase Magic Link.
- **Displayed info:** Email input, submit button, "check your email" confirmation state.
- **Buttons:** "Send Magic Link", (post-MVP: Google/Apple buttons).
- **User actions:** Enter email, submit, tap link in email, get redirected into app.
- **Edge cases:** Invalid email format; email never arrives; user taps link on a different device than they signed up on; link expired; user already has a session.
- **Loading state:** Spinner while link is sending.
- **Empty state:** N/A.
- **API calls:** `supabase.auth.signInWithOtp()`.
- **Navigation:** → Home (if Anchors exist) or → Add Anchor (if none).

### 3. Home
- **Purpose:** Daily command center.
- **Displayed info:** Today's Anchors, Momentum, XP bar, Level, Rank, Weekly Progress summary.
- **Buttons:** "+ Add Anchor", tap an Anchor to open it, profile icon.
- **User actions:** Start a session directly from an Anchor card, navigate to Add/Edit, Statistics, Profile.
- **Edge cases:** User has zero Anchors; all Anchors already completed today; Momentum data hasn't loaded yet.
- **Loading state:** Skeleton cards while fetching Anchors + profile.
- **Empty state:** "Create your first Anchor" prompt with CTA.
- **API calls:** Fetch `anchors` for user, fetch `profiles` row, fetch today's `sessions`.
- **Navigation:** → Add/Edit Anchor, → Session, → Statistics, → Profile.

### 4. Add / Edit Anchor
- **Purpose:** Create or modify an Anchor.
- **Displayed info:** Title field, icon picker, color picker, target days, minimum duration.
- **Buttons:** "Save", "Delete" (edit mode only), "Cancel".
- **User actions:** Fill form, save, or delete existing Anchor.
- **Edge cases:** Empty title; duplicate Anchor name; deleting an Anchor that has existing sessions (see Edge Cases section below); no icon/color selected (needs a default).
- **Loading state:** Spinner on save/delete.
- **Empty state:** N/A (form always has default values).
- **API calls:** Insert/update/delete on `anchors`.
- **Navigation:** → Home on save/cancel.

### 5. Session
- **Purpose:** Timed execution of an Anchor.
- **Displayed info:** Anchor name/icon, running timer, pause/resume/finish controls.
- **Buttons:** Start, Pause, Resume, Finish, (Cancel/Discard).
- **User actions:** Start timer, pause, resume, finish to log session.
- **Edge cases:** App backgrounded/killed mid-session; phone dies mid-session; user tries to start a second session while one is active; timer left running for an extreme duration (see Edge Cases); user finishes with 0 seconds elapsed.
- **Loading state:** Spinner while XP/Momentum are being calculated and written on Finish.
- **Empty state:** N/A.
- **API calls:** Insert into `sessions`; update `profiles.total_xp`/`level`/`momentum`.
- **Navigation:** → Home (with XP/level-up confirmation) after Finish.

### 6. Statistics
- **Purpose:** Progress review.
- **Displayed info:** Daily/weekly/monthly charts, total sessions, total time focused, average session length, Momentum history, XP history.
- **Buttons:** Date-range toggle (Day/Week/Month).
- **User actions:** Switch time range, tap into a specific Anchor's stats.
- **Edge cases:** No sessions logged yet; partial data for the current period.
- **Loading state:** Skeleton charts.
- **Empty state:** "Complete your first session to see stats here."
- **API calls:** Aggregate queries on `sessions` (and `profiles` for XP/Momentum history if tracked over time).
- **Navigation:** → Home, → Anchor detail (optional for MVP).

### 7. Profile
- **Purpose:** Account overview and access to Settings.
- **Displayed info:** Username/avatar, Level, Rank, total XP, member since date.
- **Buttons:** "Settings", "Logout".
- **User actions:** Edit username/avatar, open Settings, log out.
- **Edge cases:** Avatar upload fails; username taken (if usernames become unique later).
- **Loading state:** Spinner while profile loads/saves.
- **Empty state:** N/A.
- **API calls:** Read/update `profiles`.
- **Navigation:** → Settings, → Login (on logout).

### 8. Settings
- **Purpose:** User preferences and account controls.
- **Displayed info/options:**
  - Dark mode toggle
  - Notification preferences (see Notification Strategy)
  - Units (minutes vs. hours display)
  - Time format (12h/24h)
  - Delete account
  - Export data
- **Buttons:** Toggles per setting, "Delete Account" (destructive, needs confirmation), "Export Data".
- **User actions:** Toggle preferences, request data export, delete account.
- **Edge cases:** Delete account while sessions are mid-sync; export takes long time for heavy users.
- **Loading state:** Spinner on export/delete.
- **Empty state:** N/A.
- **API calls:** Update local/`profiles` preferences; Supabase auth `deleteUser` flow (or request-based deletion); export generates a file from `anchors`/`sessions`.
- **Navigation:** → Profile (back).

---

## Momentum & XP Mechanics

### Momentum (not simple streaks)
Traditional streaks reset to 0 on one missed day — this kills motivation precisely during the dip. **Momentum** increases with consistent completion and decreases gradually when users stop, but never instantly resets to zero. One bad day doesn't erase weeks of progress.

### Identity-Based Framing
Progress is framed as identity change ("You're becoming someone who works out") rather than raw streak counts, per the Atomic Habits principle that identity-based habits stick better than goal-based ones.

### XP Calculation (per session)
- Base: **20 XP** per completed session
- Bonus: **+1 XP per minute** tracked, capped at **+30 XP** (30 min or more)
- **Max per session: 50 XP**

### Level Curve
| Level | Total XP Required |
|-------|-------------------|
| 1 | 0 |
| 2 | 100 |
| 3 | 250 |
| 4 | 450 |
| 5 | 700 |
| 6 | 1,000 |
| 7 | 1,400 |
| 8 | 1,900 |
| 9 | 2,500 |
| 10 | 3,200 |

*(Continues on an exponential curve past level 10.)*

### Ranks
| Rank | Levels |
|------|--------|
| Spark | 1–3 |
| Ember | 4–7 |
| Flame | 8–12 |
| Anchor | 13–18 |
| Forged | 19+ |

### Scope
XP/Level is **account-wide** (one overall level across all Anchors), not per-habit — keeps it simple and makes comparing levels between accountability partners straightforward later.

---

## Database Schema (Supabase)

```sql
-- Profiles (per-user)
create table profiles (
  id uuid references auth.users(id) primary key,
  username text,
  avatar_url text,
  total_xp integer default 0,
  level integer default 1,
  momentum integer default 50,
  created_at timestamp default now()
);

-- Anchors
create table anchors (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade,
  title text not null,
  color text,
  icon text,
  target_days integer,
  minimum_duration integer,
  created_at timestamp default now()
);

-- Sessions
create table sessions (
  id uuid default gen_random_uuid() primary key,
  anchor_id uuid references anchors(id) on delete cascade,
  user_id uuid references auth.users(id) on delete cascade,
  duration_seconds integer not null,
  xp integer not null,
  created_at timestamp default now()
);
```

`user_id` was added directly to `sessions` (not just inferred through `anchor_id`) so RLS policies can check `auth.uid() = user_id` on sessions without a join — simpler policies, faster queries.

**RLS:** enabled on all tables. `profiles` locked via `auth.uid() = id`. `anchors`/`sessions` currently use permissive policies during development — **must be tightened to `auth.uid() = user_id` before public launch** (Phase 4).

---

## Settings (Detail)
- **Dark mode** — system default, with manual override
- **Notifications** — master toggle + per-type toggles (see below)
- **Units** — minutes vs. hours for durations
- **Time format** — 12h / 24h
- **Delete account** — destructive action, requires confirmation step, should cascade-delete `anchors`/`sessions` or anonymize per data policy
- **Export data** — generates a downloadable file (CSV/JSON) of the user's Anchors and Sessions

---

## Notification Strategy

| Notification | Trigger | MVP? |
|---|---|---|
| Morning reminder | Scheduled local time, if Anchors exist | ✅ |
| Missed session reminder | No session logged by a set time/day | ✅ |
| Weekly review | End of week summary | ✅ |
| Level up | XP crosses a level threshold | ✅ |
| Achievement unlocked | Milestone reached (if achievements ship in v1.1) | ⏳ v1.1 |
| Partner reminder | Duo partner's activity | ⏳ v2.0 |

All notifications respect the Settings toggle and should default to **on** but be easy to turn off (Non-Goal: no dark patterns, no endless notifications).

---

## Error States

| Scenario | Expected Behavior |
|---|---|
| Internet disappears mid-use | Show offline banner; queue writes locally where possible; retry on reconnect |
| Timer crashes / app killed mid-session | On relaunch, detect an "in-progress" session and prompt to resume or discard |
| Supabase is down | Show a friendly service-status message; don't lose local session data |
| User logs out mid-session | Confirm before discarding an active, unsaved session |
| Sync fails after Finish | Retry with backoff; keep the session cached locally until confirmed written |

---

## Analytics Events

Track at minimum:
```
signup
login
anchor_created
anchor_edited
anchor_deleted
session_started
session_paused
session_resumed
session_completed
session_discarded
xp_awarded
level_up
momentum_increased
momentum_decreased
settings_changed
account_deleted
```
These inform whether the app is actually solving the motivation-dip problem, not just whether it was downloaded.

---

## Success Metrics
- User creates their first Anchor within 5 minutes of signup
- 70% of users complete a session on Day 1
- 35% of users return on Day 7
- Average session length > 20 minutes
- Users understand Momentum without needing it explained

## Non-Goals
- No advertisements
- No public leaderboards
- No social feed
- No endless notifications
- No dark patterns
- No punishment for missing one day

## Product Principle
Every feature must answer one question: **"Does this help users regain momentum?"** If the answer is no, the feature should not be added.

---

## Edge Cases

| Case | Expected Behavior |
|---|---|
| User deletes an Anchor with 200 sessions | Confirm destructively; either cascade-delete sessions or soft-archive the Anchor to preserve historical stats (decide before launch — affects Statistics accuracy) |
| User changes timezone | Session timestamps stored in UTC; display converted to local device timezone; daily/weekly boundaries follow the device's current timezone |
| Timer reaches an extreme duration (e.g. 5+ hours) | Cap XP bonus at 30 min regardless; consider a soft warning/auto-pause after a sanity threshold (e.g. 3 hours) to catch forgotten-running timers |
| User starts two sessions at once | Block starting a second session while one is active; surface the in-progress session instead |
| Phone dies mid-session | On next launch, detect the unfinished session (via locally persisted start time) and prompt: resume, log partial time, or discard |

---

## Future Roadmap *(explicitly not MVP)*

**V1.1**
- Notifications (full rollout)
- Achievements
- More analytics

**V2.0**
- Accountability Duos (personal Momentum + Team Streak, dual visibility TBD)
- Recovery Mode
- Future-You Messages
- AI Coach
- Adaptive Difficulty
- Mood Tracking

**V3.0**
- Apple Health / Wearables integration
- Desktop app
- Web dashboard
- Public API

---

## Known Issues / In-Progress Decisions
- **Magic link redirect** doesn't work reliably in plain Expo Go — requires EAS dev client build (in progress, iPhone + Windows = cloud build via EAS, not local)
- **Google/Apple sign-in** — deferred post-V1, since OAuth requires a dev client anyway (doesn't work in Expo Go)
- **Habit verification** — no method is foolproof; chose time-based timer over photo proof for privacy + lower friction; accountability partner (V2) acts as the social backstop against faking
- **Anchor deletion policy** — cascade-delete vs. soft-archive sessions, not yet decided (affects Statistics)
- **Team mechanic open questions (V2):** habit visibility between partners, specific team rewards — to be decided later

---

## Author Context
- Builder: CS50 student, beginner programmer, building with heavy AI assistance (learning while shipping)
- Built during a structured 10-week summer plan covering coding skill-building, fitness, a side hustle, and this project
- Personal motivation: builder's own struggle with motivation dropping after a few days of trying to build habits — this app is being designed to solve that for themselves first
