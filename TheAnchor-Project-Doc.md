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
- ✅ Authentication (Google Sign-In)
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
- **Auth:** Google Sign-In (Supabase OAuth) is the V1 method. Magic Link / Apple Sign-In deferred post-V1.
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
Login (Google Sign-In)
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
- **Purpose:** Authenticate via Google Sign-In (Supabase OAuth).
- **Displayed info:** "Continue with Google" button; branded, calm login surface.
- **Buttons:** "Continue with Google".
- **User actions:** Tap Google, complete the native/ web OAuth consent, get redirected into app.
- **Edge cases:** Google not configured (show a clear alert with setup steps); user cancels consent; user already has a session.
- **Loading state:** Spinner while signing in.
- **Empty state:** N/A.
- **API calls:** `supabase.auth.signInWithIdToken()` (after native Google consent).
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
- **Magic link redirect** — no longer relevant; V1 auth is Google Sign-In (OAuth via EAS dev client build). Magic Link deferred post-V1.
- **Google Sign-In** — V1 method; requires an EAS dev client build (OAuth doesn't work in plain Expo Go). Apple Sign-In deferred post-V1.
- **Habit verification** — no method is foolproof; chose time-based timer over photo proof for privacy + lower friction; accountability partner (V2) acts as the social backstop against faking
- **Anchor deletion policy** — cascade-delete vs. soft-archive sessions, not yet decided (affects Statistics)
- **Team mechanic open questions (V2):** habit visibility between partners, specific team rewards — to be decided later

---

## Technical Fixes Log

### 2026-07-19 — Build / runtime errors fixed
- **TypeScript compile error** (`FloatingActionButton.tsx`): `View` was used in the FAB's top-sheen but never imported from `react-native`. Added `View` to the import. `npx tsc --noEmit` now passes clean.
- **Invalid icon warning** (`ProgressScreen.tsx`): the "Most in a day" stat used `icon="layers"`, which is not a valid FontAwesome5 *Free* name (logged as `"layers" is not a valid icon name for family "FontAwesome5Free-Regular"`). Replaced with `icon="calendar-alt"` (valid in the free set). This was the "layering" warning seen in the logs.
- **"Linking configured in multiple places" error** (`App.js`): the `linking` config listed `Journey`/`Progress`/`Profile`/`Session` (capital) at the **top level**, but those are *nested tab screens* inside the `Index` (TabNavigator) screen. React Navigation treated the duplicate path registrations as conflicting linking sources. Fixed by nesting the tab routes under `Index` and using the real stack screen names (`session`, plus adding `EditAnchor`).
- **Android multiple-root-instance risk** (`app.config.js`): added `android.launchMode: 'singleTask'` so a cold start / deep link can't spawn a second root component (the specific Android hint in the linking error).

### Design-system refactor (this branch `security-clean-initial`)
A shared UI kit was introduced to remove duplicated inline styles:
- `src/components/ui/*` — reusable primitives (`Surface`, `IconBadge`, `ProgressRing`, `XPBar`, `StatTile`, `MomentumHero`, `AreaChart`, `Heatmap`, `Segmented`, etc.) exported via `src/components/ui/index.ts`.
- `src/theme/useThemeColors.ts` — `useThemeColors()` hook returning a resolved, theme-adaptive palette (`accent`, `surface`, `text`, `hairline`, `glass`, …) so screens stop inlining `isDark ? colors.dark.x : colors.light.x`.
- `src/supabase/analytics.js` — dashboard/analytics queries (`loadDashboardAnalytics`, `getPersonalRecords`, heatmap, trends, achievements).
- Screens (`Home`, `Journey`, `Profile`, `Progress`, `Session`) and `LevelUpModal` now consume these instead of hand-rolled styles.

---

### 2026-07-19 — Apple HIG UI audit remediation
A full-screen UI/UX audit (Apple Human Interface Guidelines lens, pre-Design-Award) was
performed and the highest-priority, systemic issues fixed:

- **Accessible color tokens added** (`src/constants/theme.ts`, `src/theme/useThemeColors.ts`):
  `primaryStrong` (`#0F766E`, teal text on light surfaces), `onAccent` (`#06201D`, ink for
  text/icon on teal **and** success fills), `errorStrong` (`#C0392B`, error text on light).
- **Button/text contrast (AA)** — every primary/success CTA now uses `onAccent` ink instead of
  white (was ~1.9:1, now ≥7:1). Teal used as *text* (eyebrows, rank chips, badges, segmented
  labels, "YOU" tag) switched to `primaryStrong`; colored pill labels now use `c.text` with the
  dot carrying the color signal.
- **`textMuted` deepened** — light `#8A9694`→`#5C6B68`, dark `#6E7C79`→`#8A9694` so secondary
  text clears WCAG AA on both themes. Tab inactive icons + sheet grabber now use theme-resolved
  `textMuted`; placeholder color hardened to `neutral[500]`.
- **iOS-blue leaks removed** — Onboarding & Login now consume `useThemeColors()` (no more
  hardcoded `#fff`/`#666`/`#007AFF`, so they respect dark mode); Add/Edit anchor color palettes
  and the custom-anchor fallback use the brand teal. Google's `#4285F4` kept as a brand exception.
- **Spacing tokens made monotonic** — `lg` 16→20, `xxl` 24→32 so `md≠lg` and `xl≠xxl` (the
  declared 8pt rhythm was previously broken by duplicate values).
- **Add Anchor is no longer a dead-end** — added a Cancel/`times` header affordance.
- **FAB gives feedback** — pressing it when nothing is due (or in the "done" state) now navigates
  to Home instead of silently doing nothing; the `done` visual no longer swallows the tap.
- **Empty states unified** — the Journey filtered-empty and Progress "No data yet" states now use
  the shared `EmptyState` component.
- **Session ring is responsive** — sized from `useWindowDimensions()` so it no longer clips on
  narrow devices (e.g. iPhone SE).
- **Reduced motion + no re-animation storms** — new `src/hooks/useReducedMotion.ts` gates the
  perpetual XP shimmer and FAB pulse. `ProgressRing`/`MomentumHero`/`AreaChart` now animate only
  on first appearance (this also fixed a live-timer bug where the session ring reset to 0 every
  tick). `npx tsc --noEmit` passes clean.

### 2026-07-19 — Follow-ups from the HIG audit (now resolved)
The four open items listed below are now addressed:

- **Icon-language unification** — `anchor`/`check` now render from the monoline
  `AchievementGlyph` set everywhere (Profile avatar, Home rank chip, Session celebrate card,
  EditAnchor color-swatch selection, AddHabit "Added" badge). FontAwesome5 remains only for
  generic UI icons (tabs, play/pause, chevrons, etc.).
- **Typography scale** — added intermediate `typography` tokens (`micro`, `bodyMd`,
  `headingSm/Md/Lg`, `displayXxs/Xs/Sm/Md/Lg`) and replaced every inline `fontSize` literal
  across screens + the UI kit with token references (no visual change — same numbers).
- **Radius tokenization** — `corner` extended with `xs:12`, `field:14`, `control:20`; the
  Add/Edit form radii no longer hardcode 12/14/16/20.
- **Tap targets** — `minHeight:44` added to Profile "Manage" and the Journey filter chips; the
  EditAnchor color swatch was bumped 40→44px. `npx tsc --noEmit` passes clean.

### Known follow-ups (resolved)
Icon-language unification, the typography scale, radius tokenization, and the sub-44pt tap
targets listed in the HIG audit are all addressed (see the 2026-07-19 entry above).

### 2026-07-19 — Pixel-perfect polish pass (Apple first-party consistency)
A production-quality polish pass (no redesign, no new features — consistency only) across every
screen. `npx tsc --noEmit` passes clean after all changes.

- **Spacing snapped to a strict 8pt scale** (`src/constants/theme.ts`) — the app now uses ONLY
  `8 / 16 / 24 / 32 / 48` (plus `4` as a micro-inset). The two off-grid tokens from the earlier
  HIG entry were resolved onto the grid: `lg` 20→**24** and `xxxl` 40→**48** (`xl` also = 24 so
  cards and section gaps share one rhythm; `md` = 16 is the tight intra-card gap). Because screens
  reference these tokens, this re-rhythmed every screen at once. Swept remaining stray literals
  (`marginTop:2`, `marginLeft:6`, `paddingVertical:5`, `spacing.sm + 2`, `padding:20`) to tokens
  across Home, Journey, Progress, Profile, Session, AddHabit, and `LevelUpModal`.
- **Alignment** — `SectionHeader` had a 4px horizontal inset that pushed every section title off
  the card/screen edge; removed so titles line up exactly with the cards beneath them.
- **Card consistency** — `StatTile` given a shared `minHeight` (112 / 96 compact) so tiles in a
  row are always equal height, plus the standard `shadow.soft`. Progress `recItem` cards moved
  `corner.md`(18)→`corner.lg`(24) with `shadow.soft`; anchor-selection modal rows aligned to the
  24px radius grid.
- **Typography** — `StatTile` inline `fontSize:26/30` replaced with the `displayXxs` token;
  Progress `MonthStat`/`Record` numbers unified to `headingLg` (were mismatched 22 vs 18).
- **Icon sizing unified** — same-importance rows now share one badge size: Journey anchor badge
  54→44 (matches Home), Progress stat badges 30/32→36, Profile setting rows 34→36; glyph sizes
  tracked to match.
- **Depth / shadows** — four components (`MomentumHero`, `Heatmap`, `AreaChart`, `Segmented`) each
  carried their own local `shadowSoft()` helper with differing values; all replaced with the
  single `shadow.soft` token and the dead helpers deleted.
- **Per screen** — Home: Momentum chart 132→160, hero-stat inner padding tightened. Journey:
  equal chip/sort-button heights (min 44), start button 44→48 to align with the ring row.
  Progress: activity chart 210→224 for focal emphasis, heatmap cell 13→14. Profile: more
  breathing room between sections (identity + card `marginBottom` → 32).
- **Bottom nav + FAB** — tab bar shadow softened (was the heavy shared `baseStyles.shadow`, now a
  quiet 0.06-opacity layer); FAB elevation 6→4 and shadow opacity trimmed.
- **Note:** `src/components/navigation/BottomTabBar.tsx` is dead code — it is exported but the app
  renders `CustomTabBar` inside `src/navigation/TabNavigator.tsx`. The live tab bar was polished;
  the unused file is a candidate for deletion in a separate cleanup.

## Author Context
- Builder: CS50 student, beginner programmer, building with heavy AI assistance (learning while shipping)
- Built during a structured 10-week summer plan covering coding skill-building, fitness, a side hustle, and this project
- Personal motivation: builder's own struggle with motivation dropping after a few days of trying to build habits — this app is being designed to solve that for themselves first

---

# Full Product Experience Review (2026-07-20)

**Reviewer lens:** Apple Design Award submission — Senior Product Designer + UX Researcher + RN Engineer + PM + Accessibility + QA + first-time & long-term user.
**Method:** Full code inspection of all 9 screens, navigation/tab system, UI kit, XP/momentum/streak/analytics logic, Supabase migrations (RLS), and auth layer.

## Executive Summary

**Overall: 5.5 / 10**

| Dimension | Score | Verdict |
|---|---|---|
| UI (visual craft) | 8 / 10 | Genuinely premium; tokens, depth, motion strong. |
| UX (flow/intuition) | 5 / 10 | Confusing redundancy, dead controls, ambiguous nav. |
| Product (philosophy) | 3.5 / 10 | Core promise contradicted by the actual build. |
| Code quality | 7 / 10 | Good structure; dead code, regressions, hardcoded colors. |
| Premium feeling | 7 / 10 | Undercut by inconsistencies and unfinished surfaces. |

- **Would I use it daily?** Not yet — the "we don't punish missed days" promise is contradicted, and I might not get past login.
- **Would I recommend it?** Not yet. Craft is launch-adjacent, but two issues are launch-blocking and one is a philosophy-level failure.

### The three things that matter most
1. **The product contradicts its own thesis.** Momentum is supposed to *replace* streaks, but in `lib/momentum.js` momentum is **computed from streak** (`getStreakBonus(streak)` adds up to +25 momentum/session by consecutive-day count). Streaks are headline stats on Progress (x2) and Profile, and the session-complete celebration reads **"Day X streak · momentum restored"** (`SessionScreen.tsx:240`). A user who reads the tagline then sees "Current streak: 0" feels exactly the punishment the app claims to abolish.
2. **Login matches the (corrected) spec.** *Correction (2026-07-20):* the product decision is **Google Sign-In as the only V1 auth** (Magic Link deferred). The shipped `LoginScreen` is Google-only by design, so it no longer "contradicts the spec." Residual, non-blocking items: the only fallback is a `__DEV__`-gated "Skip login" (fine for local testing), and Google must be configured in Supabase or the screen shows a setup alert rather than crashing.
3. **An unexplained, momentum-duplicating "Recovery Score" was promoted to a Progress hero.** `getRecoveryScore()` = `0.6 x bounce-back-rate + 0.4 x momentum` (`analytics.js:153`) — measures nearly the same thing as Momentum, with no in-app explanation.

## Screen-by-Screen

### 1. Onboarding (`OnboardingScreen.js`) — Priority: Low
- Strengths: clean, calm, on-brand; uses `useThemeColors()`; clear value cards.
- Weaknesses: `gap:20` off the 8pt grid; feature card "Momentum that never resets to zero" is the promise the rest of the app breaks.

### 2. Login (`LoginScreen.js`) — Priority: Critical
- **No Magic Link UI** — *correction:* Magic Link is not a V1 requirement; Google Sign-In is the intended V1 auth, so the absence of a magic-link UI is expected, not a defect.
- Uses `FontAwesome` (not `FontAwesome5`) — inconsistent icon import.
- No inline error state; spinner uses low-contrast `#fff`.
- A non-Google user has no way in — *accepted product scope:* V1 targets Google users. The only real risk is a misconfigured Google provider (handled with a setup alert), not a missing email fallback.

### 3. Home (`HomeScreen.tsx`) — Priority: High
- Strengths: excellent "All checked in" DoneState; beautiful Momentum hero; the "Missed a day? That's allowed" nudge is the best expression of the brand.
- Weaknesses: six-plus quantified signals compete for attention; Recovery + streak reintroduced here; `missedYesterday` uses streak===0; identity shows "there" while Profile shows email local-part (inconsistent).

### 4. Journey (`JourneyScreen.tsx`) — Priority: Medium
- Strengths: filter chips + sort, status badges, consistency ring, Reveal entrance.
- Weaknesses: tapping a card opens **Edit** (hidden/unexpected); no detail screen; completed card's Start button says "Done" but still starts a session; consistency % never explained; redundant start paths with Home.

### 5. Progress (`ProgressScreen.tsx`) — Priority: High
- Strengths: strong hierarchy; Level timeline "YOU" tag; good heatmap + area chart.
- Weaknesses: **Current/Longest streak are headline stats**; Recovery Score is an unexplained hero; **Day/Week/Month toggle from the spec is not implemented**; Achievements grid shows ~8 locked badges day 1 (reads as failure; doc defers achievements to v1.1); Level/XP/streak repeated across screens.

### 6. Profile (`ProfileScreen.tsx`) — Priority: High
- Strengths: avatar-with-level-ring; working theme Segmented control.
- Weaknesses: name = email local-part (no username editing though doc requires it); **Notifications toggle is dead** (local state, never persisted, notifications unimplemented); **Export data = fake Alert**; **Help & Support has no onPress** (dead chevron); **TheAnchor Plus subscription card** with non-functional Manage (premature for V1); **Delete Account missing** (doc-required); no "System" theme option.

### 7. Session (`SessionScreen.tsx`) — Priority: Critical (philosophy) / High (edge cases)
- Strengths: ambient BreathingPulse + ring; green "Minimum met" transition; celebration + particles + haptics; under-minimum confirm dialog.
- Weaknesses: celebration copy "Day X streak · momentum restored" (peak-moment philosophy violation); **minimum not enforced** — 1-second finish yields full XP + same "momentum restored"; **closing active timer silently discards** (doc wants confirm); **no persistence across app kill** (in-memory refs only); saving spinner `#fff` contrast.

### 8. Add Anchor (`AddHabitScreen.tsx`) — Priority: Medium
- Strengths: 16 templates; "Already added" dedupe badge.
- Weaknesses: **`isEditing` branch is dead code** (Journey routes to EditAnchor, never here with an anchor); **regresses from `useThemeColors()`** (hardcodes `colors.dark/light`); off-grid literal radii/padding; **dark-mode input border bug** (`neutral[300]` in both themes); Apple-system-color palette fights teal brand; "Sleep Early" shows "480 min"; no icon/color picker here while Edit has them (two inconsistent creation idioms).

### 9. Edit Anchor (`EditAnchorScreen.tsx`) — Priority: Low-Medium
- Strengths: proper form, icon+color pickers, live preview, confirmed delete — the right model.
- Weaknesses: also regresses from `useThemeColors()`; saving spinner `#fff`; repeats Apple-system palette; separate from Add so create vs edit feel like two apps.

### 10. Navigation / Tab Bar / FAB — Priority: Medium
- Strengths: polished TabBarIcon spring+pill; premium FAB pulse/haptics; check-in reachable everywhere.
- Weaknesses: **FAB is an unlabeled check icon** (`label` prop never passed — self-explanatory-pill design is dead code); `done` FAB (green check) navigates Home (confusing); **tab bar fetches data + holds modal state** (nav component doing data work; Home/Journey/TabBar each re-fetch anchors); icon-only tabs, "Journey"/compass undiscoverable; **`BottomTabBar.tsx` is dead, broken code** (exported, unused, calls nonexistent `anchorSelection` route — would crash if rendered).

### 11. Design System / UI Kit — Priority: Low-Medium
- Strengths: strong token system (8pt grid, radii, type scale, AA-tuned `onAccent`/`primaryStrong`); Surface, StatTile, EmptyState, QuoteCard, LevelUpModal, Segmented all well-built; good motion (Reveal, count-up, breathing pulse, particles).
- Weaknesses: two-plus icon languages coexist (monoline AchievementGlyph vs FA5; anchor mark drawn both ways); MomentumHero delta is usually "steady today" (low-info); `colors.dark/light` hardcoding leaks back into Add/Edit.

### 12. Data & Security Layer — Priority: Critical (.env) / High (RLS verify, momentum race)
- Strengths: `award_session_xp` RPC is atomic (SECURITY DEFINER, SELECT..FOR UPDATE); RLS hardening exists in `0004`; profile auto-create trigger (`0002`) fixes silent XP loss.
- Weaknesses: **momentum is streak-driven** (philosophy failure at the data layer); **momentum written client-side** (read-modify-write race, unlike XP); **`.env` ships a live paid OpenRouter key as `EXPO_PUBLIC_ANTHROPIC_API_KEY`** — `EXPO_PUBLIC_` bundles it into every user binary (extractable, chargeable); **must verify RLS `0004` is actually applied** to the live project before launch.

## Critical Issues (must fix before launch)
1. **Philosophy contradiction** — remove streak from Progress/Profile headlines and Session celebration; stop deriving momentum from streak tiers; keep Momentum as the single consistency signal.
2. **Auth (resolved):** Decision changed — **Google Sign-In is the V1 auth**; Magic Link is not required. The Google-only `LoginScreen` matches the corrected spec and is not a launch blocker. (Separate, future concern: if the app ships to the iOS App Store, Apple Guideline 4.8 may require a "Sign in with Apple" alternative — track that for the store submission, not for the core launch.)
3. **Public API key** — rotate the OpenRouter key and remove it from `EXPO_PUBLIC_`; proxy AI calls server-side.
4. **Verify RLS applied** — confirm migration `0004` is live on the target Supabase project or user data may be exposed.
5. **Session discard + persistence** — confirm before discarding an active timer; persist in-progress sessions across app kill (both are explicit doc edge cases).

## High-Impact Improvements
- Remove/fold the Recovery Score duplication; if kept, explain it in-app.
- Demote Achievements to v1.1 or show only unlocked ones (progressive disclosure).
- Fix dead Profile controls (persist/remove Notifications; wire/remove Export/Help/Manage); add Delete Account.
- Unify anchor create/edit into one idiom; adopt `useThemeColors()`; fix dark-mode input borders.
- Add tab labels / FAB label for discoverability.
- Implement the Day/Week/Month toggle on Progress or drop the claim.
- Make anchor-card tap a detail/start surface; move Edit behind an explicit affordance.
- Centralize anchor/session data in a shared hook/context instead of re-fetching in Home, Journey, and the tab bar.

## Polish Improvements
- Tokenize stray literals (`gap:20`, `borderRadius:8/12/14`, `padding:14`).
- Reconsider Apple-system anchor palette vs. calm-teal brand.
- Fix MomentumHero delta (meaningful value or remove the badge).
- Honest post-minimum finish copy, or enforce a real minimum.
- Reconcile identity display (Home "there" vs Profile email vs `user_xxx`); make display name editable.
- Extend LevelUpModal's calm-particle language to the session-complete card.
- Add a "System" theme option (Light/Dark/System).
- Fix "Sleep Early" 480-min label.
- Delete dead `BottomTabBar.tsx` and its `navigation/index.ts` re-export.
- Clarify the `done` FAB affordance.

## Future Ideas (not now)
- **Recovery Mode** (roadmap) is the correct home for bounce-back language — make it first-class and explained rather than a hidden stat.
- Surface **identity-based framing** ("you're becoming someone who shows up") in check-in celebrations and relapse/empty states.
- **Adaptive difficulty / AI Coach** could contextualize Momentum ("one session from Strong") — only after the core metric is coherent.
- **Accountability Duos** (V2) is where a shared streak could live legitimately (social, not self-punishing).
- Guided **onboarding -> first anchor** flow (60s) to serve the "first anchor within 5 minutes" success metric.

## Closing note
The craft is well above typical indie quality — design tokens, motion, empty states, and the "Missed a day? That's allowed" nudge show real product taste. But this build does not yet deliver the product it advertises. Fix the philosophy contradiction, the auth path, and the leaked key, and this becomes a genuinely launchable, distinctive app.

---

# Product Experience Review — Pass 2: UI & Design (2026-07-20)

*Reviewer lens: Apple Product Designer + UX Researcher + RN Engineer + Accessibility + QA + first-time & daily user. Full per-screen teardown below; scores at top.*

## Executive Summary
- **Overall: 7.4 / 10**
- UI: **8.0** (coherent, calm, premium tokens)
- UX: **6.8** (loading flicker, hidden affordances, dead-ends)
- Product: **7.0** (philosophy felt in copy, undercut by gamification weight + placeholders)
- Code: **7.2** (great system; dead code, debug logs, theming bypass, no a11y)
- Premium feel: **7.6**
- Would I use daily? Yes, after loading-flash + tab-bar overlap fixes.
- Would I recommend? Not yet (Profile dead-ends). *Correction: Google-only auth is no longer a blocker — it is the intended V1 method.*

## Screen-by-Screen

### 1. Onboarding (`OnboardingScreen.js`)
- **Strengths:** Tagline is excellent and on-philosophy; three feature cards are clean/branded.
- **Weaknesses:** It's a feature list, not onboarding — teaches nothing about what an "Anchor" *is* or how check-in works. `tagline` is italic `textMuted` (reads like a disclaimer). Get Started → Login is a dead-stop handoff.
- **Pain:** New user reads generic cards, hits Google login, bounces (login friction, not a missing magic link — Google is the intended V1 auth).
- **Improve:** 3-step concept walkthrough using the app's own visuals; drop italic; add "explore as guest" if a demo exists. Standardize button color on `colors.primary` (uses `c.accent`).
- **A11y:** Get Started has no label.
- **Priority: Medium** (clarity), **High** (funnels whole app).

### 2. Login (`LoginScreen.js`)
- **Strengths:** Single clear CTA, calm centered layout.
- **Weaknesses:** **Google-only by design** — *correction:* that is the intended V1 auth, so it's not a blocker. Remaining items: only a `__DEV__` skip exists (fine for testing); uses `FontAwesome` (not FA5) — only screen with a different icon set; subtitle "start building habits" contradicts the product thesis (not a habit tracker).
- **Improve:** Add Apple/Email or guest/demo; switch to FA5; rewrite subtitle to anchor/consistency language.
- **Priority: High** (icon-set + subtitle polish; Google-only is intended, not a blocker).

### 3. Home (`HomeScreen.tsx`)
- **Strengths:** Best screen. Greeting+rank chip, Momentum hero (count-up + trend), quiet Level/Recovery/XP strip, daily insight, the "Missed a day? That's allowed" nudge, and a delightful non-dead-end `DoneState`.
- **Weaknesses:**
  - **Loading flash on every tab return** — `useFocusEffect` sets `isLoading(true)` and replaces the screen with a full-screen spinner (lines 140-149, 265-268). Most-felt defect on the main surface.
  - **Stat redundancy** — Level+rank in header chip *and* strip; XP as number *and* "XP to go" *and* XPBar; Recovery here *and* Progress hero.
  - **`settleMomentum()` writes to DB on every Home focus** (lines 82-83) — a write on mere viewing.
  - New-user `RECOVERY` shows `0 /100` ("Show up today") — deflating, and per `analytics.js:127-130` it's just momentum when <2 sessions, so it isn't "recovery" yet.
  - Brand-new user momentum defaults to `on_track` ("Steady momentum…") with no history — slightly dishonest.
  - Quick-start uses `play`; central FAB uses `check` for the same action (see Navigation).
- **Improve:** Cache + in-place refresh (skeleton/shimmer), no full spinner on focus. Collapse hero strip. Don't show Recovery until `hasData`. Honest new-user momentum. Shared data hook. Avoid write-on-view.
- **A11y:** rank chip, hero columns, anchor cards unlabeled.
- **Priority: High.**

### 4. Journey (`JourneyScreen.tsx`)
- **Strengths:** Clean stat tiles, filter chips w/ live counts, sort toggle, status badges, rings; good empty state; sane due/at-risk logic.
- **Weaknesses:**
  - **Hidden edit affordance** — tapping card body → `EditAnchor` (line 139) with *no* visual cue (no chevron/"Edit"). Only "Start" reads as tappable.
  - **Loading flash** on focus (lines 166-169).
  - `dev` seeds fake anchors (lines 73-78) — masks empty/edge states.
- **Improve:** Add a trailing chevron/"Edit" affordance or explicit edit button; distinguish tap-to-start vs tap-to-manage. Shared data hook; strip dev seed from ship build.
- **A11y:** stat tiles (filter) and cards unlabeled.
- **Priority: High** (hidden edit), **Medium** (flash).

### 5. Progress (`ProgressScreen.tsx`)
- **Strengths:** Recovery hero is the clearest thesis statement; level timeline (rail + "YOU" tag) is a nice touch; charts interactive + theme-aware.
- **Weaknesses:**
  - **Heavy** — 7+ stacked sections; on first open with zero data most show flat charts, and the top empty state basically never appears (`loadDashboardAnalytics` returns a populated object even with 0 sessions).
  - Achievement glyphs `northstar`/`lightning`/`shield`/`mountain` may not exist in FA5 free → **blank boxes (icon risk)**.
  - "This month" under a "Last 6 months" card — muddy month framing.
  - Loading flash (lines 87-90).
- **Improve:** Gate secondary sections behind `recovery.hasData`; add "need more check-ins" micro-labels; verify every glyph resolves in FA5 free; extract a shared `StatCard` from `monthStat`/`recItem`.
- **A11y:** charts/heatmap have no accessible values.
- **Priority: Medium** (overload + glyph risk), **High** (flash).

### 6. Profile (`ProfileScreen.tsx`)
- **Strengths:** Avatar ring, XP card, Light/Dark toggle, tidy settings rows; logout resets nav.
- **Weaknesses:**
  - **Identity inconsistency (bug)** — Home greets `username`/"there"; Profile shows `userEmail.split('@')[0]` (line 50). Same user called two names; plus `user_xxx` auto-handle. Three identity sources.
  - **Dead-ends** — "Export data" only `Alert` (line 154); "Help & Support" has no `onPress` and renders a chevron that does nothing (line 156); membership "Manage" has no handler (line 175).
  - **Phantom subscription** — `SHOW_SUBSCRIPTION=true` renders "TheAnchor Plus" for every user, no backend.
  - Stat row duplicates Home/Progress. No editable name.
- **Improve:** Single editable display name sourced everywhere; remove/implement Export/Help/Manage; hide or honestly gate subscription; guard SettingRow against silent no-ops.
- **A11y:** toggle needs label/hint; dead-end rows shouldn't pretend to navigate.
- **Priority: Critical** (identity bug + dead-ends), **High** (subscription placeholder).

### 7. Session (`SessionScreen.tsx`)
- **Strengths:** Premium — breathing-pulse ambient, big ring, soft sheen, haptics, calm copy, completion celebration, particle burst, LevelUp modal. All on-philosophy.
- **Weaknesses:**
  - Icon mismatch: Session "Finish" is success; elsewhere start = `play`, FAB = `check`.
  - **Minimum not enforced** — `handleFinish` only *asks*; confirming always awards XP via `doFinish`. "Minimum" is decorative.
  - Celebration auto-dismisses after 1400ms *only if* leveled up (lines 143-147); otherwise waits for "Nice" — inconsistent timing.
  - Dev fake-anchor fallback (line 67) should not ship.
- **Improve:** Align primary-action icon; enforce *or* reframe the minimum (suggested, not a gate); clean dev fallback; label close/pause/finish.
- **Priority: Medium** (minimum honesty), **Low** (icon alignment).

### 8. Add Anchor (`AddHabitScreen.tsx`)
- **Strengths:** Fast template grid, "Added" dedupe badges, simple custom form.
- **Weaknesses:**
  - **Theming bypass** — inlines `isDark ? colors.dark.* : colors.light.*` (lines 200, 211, 227, 255, 265…) + `colors.neutral[300/400/500]` instead of `useThemeColors()`. Duplicates the exact system built to centralize theming; will drift. `EditAnchorScreen` does the same.
  - **Shipped debug logs** — `console.log('handleSelectTemplate called…')` etc. (lines 108, 119, 149).
  - Naming split: file `AddHabitScreen` but UI says "Anchor".
  - Weak template icons: `futbol` for Workout, `trash` for Clean; icon set diverges from `EditAnchor` (`dumbbell`/`running`/`music`).
  - Custom form is a hand-rolled absolute overlay, not a real `Modal` (no blur/dismiss/safe-area).
  - `Sleep Early` = `8*60` → "480 min" (unreadable).
- **Improve:** Route through `useThemeColors()` + `Surface`; delete debug logs; rename to `AddAnchorScreen`; fix icons (`trash`→`broom`/`wind`, `futbol`→`dumbbell`); unify icon/color sets with Edit; format long durations ("8 h"); promote custom to equal weight.
- **Priority: High** (theming bypass + logs), **Medium** (icon language, naming).

### 9. Edit Anchor (`EditAnchorScreen.tsx`)
- **Strengths:** Live preview, icon/color pickers, numeric fields, confirmed delete; far better than old template-repick flow.
- **Weaknesses:** Same **theming bypass** (`isDark ? colors.dark.* : colors.light.*`, lines 67-71, 178-184, 200…). Delete is hard-only (loses history, as the alert warns) — a *consistency* app may want "retire" without destroying the streak story. No undo.
- **Improve:** Use `Surface`/tokens; offer soft "Retire" distinct from delete; add undo/10s grace; share icon/color arrays with Add (currently duplicated/divergent).
- **Priority: Medium.**

### Navigation & Tab Bar (`TabNavigator.tsx`, `FloatingActionButton.tsx`, `TabBarIcon.tsx`)
- **Strengths:** Center FAB with glow pulse, spring, haptics, "done" state; `TabBarIcon` spring + teal pill is premium; FAB smartly auto-starts when 1 due, picker when many.
- **Weaknesses:**
  - **FAB icon ≠ rest of app** — FAB = `check`/`check-circle`; Home/Journey start = `play`. The most prominent action has a different verb glyph. `label` pill prop exists but is **never used** → action unlabeled.
  - **Content hidden behind bar (likely bug)** — custom bar is `position:absolute; bottom:0` (TabNavigator line 352); RN does **not** auto-inset for a fully custom `tabBar`. Screens pad bottom by `spacing.xxxxl` = **48px** (Home 325, Journey 264, Progress 292) but the bar is ~72–84px + inset and the FAB floats above → **last item can sit behind the bar/FAB.** Verify + add real bottom clearance (`tabBarHeight + inset + FAB clearance`).
  - **Dead code: `BottomTabBar.tsx`** — not used; `TabNavigator` defines its own `CustomTabBar`. Dead file calls `navigation.navigate('anchorSelection')` (line 39, route doesn't exist) and has nonsense `options.tabBarIcon?.toString()`. Delete it.
  - **Console noise** in `TabNavigator` on every load/FAB press (lines 74, 77, 103, 141…).
  - FAB shows on Profile too — surprising check-in button on a settings screen.
- **Improve:** Label the FAB ("Check in") or unify start verb; add bottom clearance; delete dead bar + logs; consider hiding FAB on Profile or relabeling contextually.
- **A11y:** FAB, tabs, close buttons have no `accessibilityLabel`/`Role`/`Hint`.
- **Priority: Critical** (possible content occlusion), **High** (FAB label/icon, dead code, logs).

## Critical Issues (pre-launch)
1. Google-only auth is the intended V1 method — *correction:* not a blocker. (If shipping to the iOS App Store, add Sign in with Apple per Guideline 4.8 — future compliance item, not magic-link related.)
2. Profile dead-ends (Help & Support, Export, Membership Manage) do nothing.
3. Identity inconsistency — Home (`username`/"there") vs Profile (`email`) vs `user_xxx`.
4. Possible content occlusion by the custom absolute tab bar (insufficient bottom padding).
5. Phantom subscription card rendered for every user with no backend.

## High Impact Improvements
1. Kill focus-loading flash (cache + in-place refresh, not full spinner on tab return).
2. FAB clarity (label or unify play/check across Home/Journey/FAB/Session).
3. Discoverable edit on Journey (visible affordance).
4. Route Add/Edit through `useThemeColors()`.
5. Delete dead `BottomTabBar.tsx`; strip all `console.log/warn`.
6. Honest new-user metrics (no Recovery=0 / "on_track" before data).
7. Minimum-session honesty in Session (enforce or reframe).

## Polish Improvements
- Unify icon set (FA5 everywhere; verify `northstar`/`lightning`/`shield`/`mountain`; fix `trash`→Clean, `futbol`→Workout).
- Collapse redundant stats (Level/Rank/XP/Recovery repeated across screens).
- Tokenize stray literals in Add/Edit (`gap:20`, `borderRadius:8/12/14`, `padding:14`).
- Add System theme option (Light/Dark/System).
- Extend LevelUpModal particle language to session-complete card.
- Fix "Sleep Early" 480-min label; format durations as "8 h".
- Shared anchor/session data hook (Home, Journey, tab bar re-fetch).
- Rename `AddHabitScreen`→`AddAnchorScreen`.
- Keep the `done` FAB affordance; ensure it never feels like a dead tap (haptic/toast).

## Future Ideas (not now)
- **Recovery Mode** as a first-class, explained surface (correct home for bounce-back language).
- **Identity framing** ("becoming someone who shows up") in celebrations/relapse states.
- **Adaptive Momentum context** ("one session from Strong") after the metric is coherent.
- **Accountability Duos** (V2) for a legitimate shared streak.
- **Guided onboarding → first anchor** (~60s) for a "first anchor in 5 min" metric.
- Wire Reminders toggle to a real backend.

## Closing note (Pass 2)
Craft is above typical indie quality — tokens, motion, empty states, and "Missed a day? That's allowed" show real taste; the Session screen is genuinely lovely. But a first-time user will immediately feel: the login wall, the spinner on every tab return, the hidden edit, the Profile dead-ends, and content possibly behind the tab bar. Fix those five plus the theming/icon drift, and this becomes a genuinely launchable, distinctive app.

---

# Product Experience Review — TheAnchor (Full App Audit)

**Review scope:** Every screen, component, and major file. Read the implementation, not assumptions.
**Reviewer stance:** Senior Product Designer (Apple) · UX Researcher · RN Engineer · PM · Accessibility Reviewer · First-time + Long-term user.
**Verdict up front:** The design system and motion language are genuinely award-caliber. The *core loop* — the check-in — is gated behind a live countdown timer with no "mark done" path, which contradicts the product's own philosophy ("showing up again") and is the single biggest reason a real user would quit on day one. Fix that and this becomes a strong product.

---

## Executive Summary

| Dimension | Score | Notes |
|---|---|---|
| **Overall** | **7.0 / 10** | Excellent craft, broken core loop. |
| UI | 8.5 / 10 | Calm, consistent, premium. A few dark-mode leaks. |
| UX | 6.0 / 10 | Timer-gated check-in, redundant stats, thin onboarding. |
| Product | 6.5 / 10 | Philosophy is beautiful and embedded; the loop fights it. |
| Code quality | 7.5 / 10 | Strong architecture + RLS; dead code + duplicated DB logic. |
| Premium feeling | 7.0 / 10 | Delightful moments undercut by spinner loading + a11y gaps. |

**Would I use this daily?** No — not in its current form. The only way to "show up" is to start a real-time timer and keep the app foregrounded. For a 16-anchor day that is untenable, and for "Sleep Early" / "No Phone" / "Deep Work" it is absurd.

**Would I recommend it?** Not yet. Recommendable the moment check-in becomes a one-tap "I did it" with the timer as an *optional* focus mode.

---

## Screen-by-Screen Review

### 1. OnboardingScreen.js
**Purpose:** Introduce the brand, then route to Login.
**Strengths:** Clean three-card layout, on-brand tagline, spinner gated correctly while session resolves (no flash for signed-in users).
**Weaknesses:**
- It is a *marketing* screen that never teaches the one thing the user must understand: **what "checking in" actually is** (a timer). A first-time user sails through three generic feature cards and is dropped at Login with zero mental model.
- `featureDescription` copy ("Create daily routines…", "Earn XP…", "See your progress…") describes a *habit tracker*. TheAnchor explicitly is NOT a habit tracker. The onboarding sells the wrong product.
**User pain:** Lands in the app and has no idea an "anchor" must be "started" as a session.
**Improvements:**
- Add a 4th card or a short motion clip showing the check-in (tap anchor → timer → done). Or, better, fold onboarding into the *first-anchor creation* moment (just-in-time teaching beats front-loaded marketing).
- Rewrite copy to the consistency-OS language: "Return after a missed day", "Momentum that survives the dip", "Identity, not a checklist".
**Priority:** High

### 2. LoginScreen.js
**Purpose:** Authenticate via Google.
**Strengths:** Single clear CTA, disabled/loading states handled, dev-skip hidden behind `__DEV__`.
**Weaknesses:**
- The only auth path is **Google**. No email, no Apple. On iOS, Apple Sign-In is effectively required by App Store review for apps that offer third-party social login — this is a **launch blocker** for the App Store, not just a UX gap.
- `subtitle` says "start building habits" — again, the wrong vocabulary.
- The screen is visually disconnected from the rest of the app (plain `title`/`subtitle` styles, no anchor glyph, no teal wash). It reads like a different app.
**Priority:** Critical (App Store compliance + branding)

### 3. HomeScreen.tsx
**Purpose:** Today's status + the list of anchors due, with the fastest path to a check-in.
**Strengths:** Excellent information hierarchy — greeting → Momentum hero → compact Level/Recovery/XP strip → quote → recovery nudge → anchors due. The `DoneState` is a genuinely delightful "all checked in" moment. `Reveal` stagger is tasteful. Empty state CTA is strong.
**Weaknesses:**
- **Redundant stats.** Level + Recovery + XP appear *here*, again on Progress (Recovery hero + records), and again on Profile (level card + stat row). A user sees Level/XP/Recovery at least 3× across the app. Recovery is presented twice with slightly different framing ("Bounces back fast" vs "How fast you bounce back").
- **The fastest path is a trap.** "Start check-in" and each anchor card open `SessionScreen` — the live timer. There is no "I already did this today" affordance. See the Critical Issues section.
- `getGreeting()` uses `new Date().getHours()` — fine, but `displayName` falls back to `'there'` while Profile derives the name from the email. **Two different identities** for the same user (see Profile review).
- `heroStats` uses `borderRightWidth` dividers that look cramped at 3 columns on narrow devices; the XP column's `XPBar` sits tight under a tiny label.
**Improvements:**
- Collapse the three hero stats: keep Momentum as the hero (it's the soul of the app), and move Level/Recovery to Profile/Progress only, or show them as tiny inline pills rather than a 3-up card.
- Add a one-tap "Mark done" per anchor card for sub-threshold or already-completed sessions.
**Priority:** Medium (redundancy) / Critical (check-in)

### 4. JourneyScreen.tsx
**Purpose:** Manage anchors, see status (due/at-risk/done), filter/sort, start or edit.
**Strengths:** Filters + sort are a thoughtful addition; `StatTile` filter chips are a nice touch (tap "At risk" → filters). `ProgressRing` per anchor is on-brand. Empty states are well-written.
**Weaknesses:**
- `loadAnchors` runs **N+1 queries** — one `getSessionsByAnchor` per anchor inside a loop (`JourneyScreen.tsx:59-68`). With 16 anchors that's 17 round-trips on every focus. Should be a single aggregate/edge function.
- The "Start" button on a "Done today" anchor still says "Start" and opens the timer again — re-checking in is allowed but the label implies a fresh session. Minor confusion.
- `getStatusKey` defines "at risk" as `daysSince > 2`. With momentum decay and the philosophy of grace, a 2-day gap is barely a risk; this may feel punishing and contradicts the "missed day allowed" messaging on Home.
- Status logic (done/risk/due) is re-implemented here *and* in `TabNavigator` (anchorsDueToday) *and* Home (isCompleted) — three sources of truth.
**Improvements:** Batch status computation server-side; centralize the due/risk/done derivation in one helper.
**Priority:** Medium

### 5. ProgressScreen.tsx
**Purpose:** The deep analytics view — recovery, activity, heatmap, achievements, records, level timeline.
**Strengths:** This is the visual high point. Recovery hero with `ProgressRing` glow, `AreaChart` with draw-on + press tooltip, GitHub-style `Heatmap` with tooltips, `LevelTimeline` rail, achievement grid — all cohesive and beautiful. `loadDashboardAnalytics` is a clean orchestrator.
**Weaknesses:**
- **Repetition of Home/Profile.** Recovery, Level, XP, streak, momentum all re-surface. The screen is rich but a returning user sees the same numbers they saw on Home.
- `SectionHeader subtitle="Last 6 months"` on the heatmap, but `weeks` is derived from join date (up to 26 weeks). Label can lie.
- `loadDashboardAnalytics` does `getAllSessions()` then computes *everything in JS* (streaks, heatmap, monthly, recovery, records). For a long-term user this pulls the entire session history on every focus — no pagination, no server aggregation. Will get slow.
- "This month" `MonthStat` uses fixed `width: '47%'` — fine on most phones, fragile on very narrow/large.
**Improvements:** Consider a server-side `dashboard` RPC (like `award_session_xp`) to return pre-aggregated stats; rename the heatmap subtitle to reflect actual range.
**Priority:** Medium

### 6. ProfileScreen.tsx
**Purpose:** Identity, level, stats, appearance, prefs, membership, logout.
**Strengths:** Clean identity ring, level card, Segmented theme switch (light/dark) that actually works, calm membership card.
**Weaknesses:**
- **Identity bug.** `const name = userEmail.split('@')[0];` (`ProfileScreen.tsx:50`) — it shows the email local-part (e.g. `afzalxonkarimov`) and **never reads `profile.username`**, which Home *does* use. Same user, two different names across screens. The profile name is also never editable here (no "edit name" entry), and the auto-generated `user_…` handle from migration 0002 is never cleaned up.
- **Notifications toggle is fake.** `notifications` state toggles a Switch but nothing is wired (no permission request, no scheduling). A dead control that implies a feature that doesn't exist — exactly the "good enough" trap to avoid.
- "Export data" only shows an `Alert` — a stub.
- Membership "Manage" does nothing (no paywall/store link).
- Redundant stat row (Momentum/Focus hrs/Streak) duplicates Home + Progress.
**Improvements:** Drive the name from `profile.username` (add an edit field), gate or remove the Notifications toggle until implemented, and either build or clearly defer membership/export.
**Priority:** High (identity bug) / Medium (stub controls)

### 7. AddHabitScreen.tsx (Create Anchor)
**Purpose:** Pick a template or build a custom anchor.
**Strengths:** 16 sensible templates with sensible defaults; duplicate prevention both client-side and via DB unique index (migration 0005); "Added" badge on already-owned templates; haptic on save.
**Weaknesses — this screen is the weakest-built in the app:**
- **It bypasses the design system.** It uses raw `colors.neutral[500]`, `colors.neutral[300]`, `colors.neutral[400]` for text/borders instead of `useThemeColors()` tokens, and `corner.sm` (16) while the rest of the app uses 18–24. It even does `isDark ? colors.dark.text : colors.light.text` inline rather than `c.text`. This guarantees **inconsistent typography/contrast and a dark-mode mismatch** vs every other screen.
- **Custom form is a hand-rolled `View` modal overlay**, not a navigation modal like EditAnchor. Two different modal idioms in one app.
- **"Create Custom Anchor" button is `position: absolute; bottom: 30`** with no safe-area inset and no blur/scrim of its own — it floats over the list and can feel disconnected.
- The custom `duration`/`days` inputs have **no clamping or validation** (AddHabit) unlike EditAnchor (`Math.min(7, …)`), so a user can enter 9999 minutes.
- No explanation of what "minimum duration" means or that it becomes a timer.
**Improvements:** Rebuild on `Surface` + tokens, use a real `useNavigation` modal for custom, reuse EditAnchor's pickers, add validation, show a one-line explainer ("Minimum time for one check-in session").
**Priority:** High

### 8. EditAnchorScreen.tsx
**Purpose:** Edit a single anchor's identity and targets; delete.
**Strengths:** This is the *correctly* built form — live preview, icon/color pickers, numeric fields, destructive delete with confirm, haptics, uses theme tokens. Much better than AddHabit.
**Weaknesses:**
- Divergent from AddHabit's visual language (different radii, different field treatment). Editing created anchors looks nothing like creating them.
- `days` clamps to 7 (correct) but the field can still display up to 7; if a user expects "days/week" > 7 it's silently capped — acceptable, but worth a hint.
**Improvements:** Share a single `AnchorForm` component between Add and Edit.
**Priority:** Medium

### 9. SessionScreen.tsx (Check-in) — THE CORE LOOP
**Purpose:** Run a focus session and award XP on finish.
**Strengths:** Gorgeous immersive scene — breathing pulse, gradient ambient wash, large `ProgressRing`, count-up timer, particle burst + celebration + optional `LevelUpModal`. Haptics throughout. "End early?" confirm respects the under-minimum case.
**Weaknesses — fundamental:**
- **Check-in requires a live, foreground timer.** There is no way to simply record "I did it." For "Drink Water" (5 min) the user still must start a 5-minute countdown and stay in the app; for "Sleep Early" (480 min) or "No Phone" (60 min) or "Deep Work" (60 min) the timer is nonsensical — the readout literally shows "480 min to go." A first-time user who creates "Sleep Early" and taps check-in is shown an 8-hour countdown.
- **Backgrounding/killing loses the session.** The elapsed time lives in component refs (`startTs`, `accumulated`); `setInterval` is cleared on unmount. Leave the app and the progress is gone. No persistence of an in-progress session.
- **The "minimum met" gate punishes honest check-ins.** A user who did a 10-min read but set 20 min must hit "End anyway" framed as failure ("You're under the 20-minute minimum").
- **Friction scales inversely with the philosophy.** The product is for *returning after setbacks*, yet every return demands a foreground timer. This is the central contradiction.
**Improvements (see Critical Issues):** Make check-in a one-tap "Mark done" by default; keep the timer as an *optional* Focus Mode for anchors where it makes sense (meditation, reading, deep work). Persist in-progress sessions. Drop the minimum-duration gate or make it a soft suggestion.
**Priority:** Critical

### 10. Tab Navigator + Floating Action Button + Anchor Picker
**Purpose:** Navigate the four tabs and launch check-ins.
**Strengths:** Custom FAB with pulse glow (respects reduced motion), spring scale, haptic, "done" state. `TabBarIcon` has a lovely active pill + scale. Safe-area aware.
**Weaknesses:**
- **The FAB's behavior is overloaded and surprising:** 0 due → navigates Home; 1 due → auto-starts session; >1 due → opens a hand-rolled `Modal` (`AnchorSelectionModal`). Three different outcomes from one button with no label (the FAB has no text label by default). A user cannot predict what the center button does.
- **Dark-mode bug in the picker modal.** `styles.modalContent` and `styles.anchorItem` hardcode `backgroundColor: colors.light.background` and `colors.neutral[200/500]` (`TabNavigator.tsx:399, 410, 434, 459`). So when multiple anchors are due and the picker opens, **it is always light-themed even in dark mode** — a clear, reproducible bug.
- The picker is a bespoke `Modal` living inside `TabNavigator`, not part of the navigation graph — inconsistent with the other modals.
- **Orphaned code:** `src/components/navigation/BottomTabBar.tsx` is never imported (App uses `TabNavigator`). It references `navigation.navigate('anchorSelection')` which doesn't exist in the real navigator and would crash if used. Dead, dangerous code.
**Improvements:** Give the FAB a label (or a consistent "open check-in sheet" behavior); fix the picker's theming; delete `BottomTabBar.tsx`.
**Priority:** High (dark-mode bug + FAB predictability) / Low–Medium (dead code)

---

## Critical Issues (must fix before launch)

1. **Check-in is gated behind a live timer with no "mark done" path.** (`SessionScreen.tsx`, the only finish path via `awardSessionXP`.) This breaks the core loop for most anchors and directly contradicts the "showing up again" philosophy. *Fix:* one-tap check-in as the default; timer as optional Focus Mode.
2. **App Store login compliance (iOS submission only).** Google-only auth (`LoginScreen.js`, `AuthContext.js`) may fail iOS review without "Sign in with Apple" (Apple Guideline 4.8). *Note:* this is unrelated to the magic-link decision — Google is the intended V1 auth. It only matters when submitting to the iOS App Store (not Android / TestFlight / internal); add Apple Sign-In before that submission.
3. **Dark-mode leak in the FAB anchor-picker modal.** (`TabNavigator.tsx:399,410,434,459`) Hardcoded `colors.light.background`/`colors.neutral[…]`. Pickers render light on dark devices.
4. **Profile identity mismatch.** Profile shows email-local-part; Home shows `profile.username`. Same user, two names; username never editable. (`ProfileScreen.tsx:50`)
5. **Fake/non-functional controls.** Profile "Notifications" toggle and "Export data"/"Manage" are stubs that imply features that don't exist. Remove or implement before users feel deceived.

## High-Impact Improvements

- **Centralize the "due / at-risk / done" derivation** (currently in Home, Journey, TabNavigator) into one helper fed by a single batched query; eliminates N+1 in Journey (`JourneyScreen.tsx:59`).
- **Kill stat redundancy.** Level/XP/Recovery/Momentum appear 3×. Make Home the *momentum + today* surface, Progress the *history* surface, Profile the *identity + settings* surface, with each metric living in one primary home.
- **Rebuild AddHabit on the design system** (tokens, `Surface`, real modal) to match EditAnchor; share an `AnchorForm`.
- **Onboarding that teaches the check-in**, not generic habit-tracker marketing; align copy with the consistency-OS philosophy.
- **Persist in-progress sessions** (store start timestamp) so backgrounding doesn't lose a check-in.
- **Server-side dashboard aggregation** (`loadDashboardAnalytics` pulls all sessions every focus) — add a `dashboard` RPC as was done for `award_session_xp`.

## Polish Improvements

- Replace full-screen `ActivityIndicator` spinners with **skeleton screens** (the `Reveal` system is already there; pair it with shimmer placeholders for a premium feel).
- Add **`accessibilityLabel` / `accessibilityRole`** to every tappable: tab items, FAB, anchor cards, stat tiles, icon buttons. Currently none — a hard miss for an "Apple-level" bar. Respect Dynamic Type (`allowFontScaling`).
- Strip **`console.log`** noise in `TabNavigator.tsx` and `src/supabase/*` (wrap in `__DEV__` or remove for production).
- Make the FAB have a visible label or consistent sheet behavior so its action is predictable.
- Remove redundant tokens (`corner.lg`/`corner.xl` both 24; `spacing.lg`/`spacing.xl` both 24) or document intentionally (already partly documented).
- Heatmap/Consistency subtitle should reflect the actual `weeks` range, not hardcode "6 months".
- Tab picker modal should use the navigation graph, not a standalone `Modal`.

## Future Ideas (not now)

- **Streaks with grace:** allow one "skip" token per week that doesn't break momentum — deepens the recovery philosophy.
- **Anchor templates personalized** from a short onboarding quiz (goal → suggested anchors + durations).
- **Reflection nudges:** a 1-tap "how did that feel?" after a session to feed a future sentiment trend.
- **Widgets:** "Today's anchors" home-screen widget with one-tap check-in (iOS/Android).
- **Social accountability:** share a streak with one friend (privacy-first).
- **Focus Mode sounds:** optional ambient audio during the timer for meditation-type anchors.
- **Year-in-review:** a calm annual consistency story (the heatmap already enables this).

---

## Pass 3 — Code / Architecture / Technical Debt

**Architecture (good):** Centralized design tokens (`src/constants/theme.ts`), `useThemeColors()` resolver, `ThemeProvider` with persisted manual override, atomic `award_session_xp` RPC (no client read-modify-write race), strict per-user RLS (`migrations/0004`), reduced-motion hook respected across animations, layered shadows. This is above average for an indie RN app.

**Technical debt:**

- **Orphaned/dead code.** `src/components/navigation/BottomTabBar.tsx` (never imported; references a non-existent route), `src/hooks/useTabInsets.ts` (only re-exported, unused), `StatPill` (exported, unused), and dead supabase exports `createSession`, `createProfile`, `addXP`, `subscribeToSessions`, `subscribeToAnchors`, `getWeeklyTrend`, `getTotalSessionTime`, `getTotalSessionCount` (`src/supabase/index.js`). Remove.
- **Duplicated DB logic.** `lib/momentum.js` re-implements profile reads/writes client-side (`settleMomentum`, `updateMomentum`) that duplicate what the RPC + RLS already govern; `getMomentumSnapshot` does a third profile read on every Home focus. Consolidate to server-side where possible.
- **Type/shape drift.** `Anchor` type uses camelCase (`targetDays`, `minimumDuration`) but every DB row is snake_case, and the mapping is hand-written in *every* screen (`HomeScreen.tsx:105`, `JourneyScreen.tsx:53`, `TabNavigator.tsx:80`, `SessionScreen.tsx:64`). Add a single `rowToAnchor()` mapper.
- **N+1 query** in `JourneyScreen.loadAnchors` (looped `getSessionsByAnchor`).
- **Full-history pulls** in `analytics.js` (`getAllSessions` then compute in JS) on every Progress focus.
- **Token leakage / inconsistency.** `AddHabitScreen.tsx` and `TabNavigator.tsx` (modal) bypass `useThemeColors` with raw `colors.neutral[…]` and `colors.light.background` — the root cause of the dark-mode picker bug and the AddHabit contrast mismatch.
- **No input validation** on custom anchor duration/days in `AddHabitScreen` (EditAnchor clamps; AddHabit doesn't).
- **Console logging in production paths** (`TabNavigator`, `sessions.js`, `analytics.js`) — should be `__DEV__`-guarded or removed.
- **State management.** Screen-level `useState` + `useFocusEffect` reloads are fine, but there is no shared cache; the same anchors/sessions are fetched independently by Home, Journey, TabNavigator, and Progress. A lightweight store (React Query / Zustand) would cut duplicate fetches and flicker.
- **Animation re-trigger risk.** `Reveal` replays its entrance on every focus (no `trigger` key passed on most screens), which can feel repetitive on tab switches. `ProgressRing`/`AreaChart` correctly guard against replay; `Reveal` should too.
- **Security:** Anon key is public by design (correct for Supabase); RLS is correctly strict per-user. No obvious injection (parameterized queries, RPC). The only auth gap is the missing Apple/email provider (compliance, not a vuln). `.env` is gitignored. This part is solid.

**Summary of debt priority:** (1) remove dead `BottomTabBar` + fix FAB modal theming, (2) centralize anchor mapping + due/risk logic, (3) batch Journey queries + server-side dashboard, (4) rebuild AddHabit on tokens, (5) strip dev logs + add a11y labels.

---

*End of review.*

---

# Fix Log (2026-07-20)

*Each problem from the reviews above is fixed in code here, in priority order, with the file/line changed and a verification note. Issues needing external action (Supabase dashboard, key rotation) are flagged.*

## ✅ #1 Philosophy contradiction — momentum no longer derived from streak
**Root cause:** `lib/momentum.js` `calculateMomentumChange()` added `getStreakBonus(streak)` (+5…+25 momentum/session by consecutive-day count), so momentum was literally streak-driven. Streak numbers were also headline stats on Progress/Profile and the Session celebration copy read "Day X streak · momentum restored".

**Fixes:**
- `lib/momentum.js`
  - Removed `STREAK_BONUS_TIERS` and `getStreakBonus()` entirely.
  - `calculateMomentumChange()` no longer takes `streak`; momentum now grows from *showing up* (base `MOMENTUM_PER_SESSION` raised 2→6) + session-duration bonus only. Bumped duration bonus to +2/+2 so a solid session still meaningfully moves momentum.
  - `updateMomentum()` signature dropped `streak`; internal call updated.
- `screens/SessionScreen.tsx`
  - Removed `getStreak` import; `updateMomentum` called without streak.
  - Celebration copy changed from `Day N streak · momentum restored` → `You showed up · momentum forward`. `celebration` state type simplified (no `streak`).
- `screens/ProgressScreen.tsx`
  - Hero stats: replaced `Longest streak` tile with `Check-ins` (total check-ins).
  - Personal records: removed `Current streak` record.
- `screens/ProfileScreen.tsx`
  - Stat row: replaced `Streak` tile with `Check-ins` (total check-ins).
- `screens/HomeScreen.tsx`
  - Nudge copy de-streaked: `Keep your streak alive` / `Day N and counting…` → `Keep your momentum moving` / `One session today is enough to keep moving forward`. Icon `fire` → `anchor`. Condition no longer requires `streak > 0`.

**Result:** Momentum is now the single consistency signal; streak is not shown as a headline anywhere and no longer feeds momentum.

**Remaining streak coupling (acceptable):** `HomeScreen` still uses `streak === 0` internally to decide the "Missed a day? That's allowed" nudge. It is not displayed. Can be swapped for a real "activity yesterday" check later.

## ✅ #2 Auth — Magic Link requirement WITHDRAWN (Google Sign-In is V1)
**Decision change (2026-07-20):** The product uses **Google Sign-In as the only V1 auth**; Magic Link is explicitly *not* required. The earlier reviews flagged the Google-only `LoginScreen` as a launch blocker *because the spec said Magic Link*, but that spec requirement has been reversed. No magic-link code is needed.

**Doc corrections made:**
- Spec (`MVP Scope`, `Tech Decisions`, user-flow diagram, Login spec, Known Issues) updated: "Authentication (Magic Link)" → "Google Sign-In"; Login purpose/buttons/edge-cases/API rewritten for Google OAuth.
- Review summary #2, Critical Issues #2, Login reviews (Pass 1 + Pass 2), Pass 2 summary, and the debt list re-scoped: Google-only is the intended V1 method, not a blocker. Each now carries a *correction* note.
- App Store "Sign in with Apple" compliance (Apple Guideline 4.8) kept as a **separate, iOS-submission-only** item — it is not magic-link related and doesn't block a non-App-Store launch.

**Code:** `LoginScreen.js` / `AuthContext.js` unchanged (Google auth already shipped). No code changed for this item.

**Bottom line:** Auth is no longer a launch blocker. The only auth follow-ups are polish (FA5 icon on Login, subtitle copy) and, if/when shipping to the iOS App Store, adding Sign in with Apple.

## ✅ #3 Public API key — removed from EXPO_PUBLIC_ (bundling mitigated)
**Root cause:** `.env` / `.env.example` defined a **live paid OpenRouter key** as `EXPO_PUBLIC_ANTHROPIC_API_KEY`. `EXPO_PUBLIC_*` vars are inlined into every client binary by Expo.

**Audit:** No source file (`src/`, `lib/`, `screens/`) ever references `EXPO_PUBLIC_ANTHROPIC_API_KEY`, and `app.config.js` only bundles `SUPABASE_*`/`GOOGLE_*` into `extra`. So the key was **not** actually reaching the bundle today — but the `EXPO_PUBLIC_` naming made it one reference away from being leaked.

**Fixes:**
- `.env.example`: replaced the `EXPO_PUBLIC_ANTHROPIC_API_KEY` line with a server-only `ANTHROPIC_API_KEY` + a warning comment (never use `EXPO_PUBLIC_` for LLM keys; AI must be proxied server-side).
- `.env` (local, gitignored): renamed the live key to `ANTHROPIC_API_KEY` (no `EXPO_PUBLIC_` prefix) and added a rotation warning.

**Result:** Key can no longer be bundled by Expo. 

**ACTION REQUIRED (external):** Rotate the OpenRouter key in the OpenRouter dashboard — it previously sat in `EXPO_PUBLIC_`. AI features are post-MVP; keep them server-side only.

## ✅ #4 RLS migration 0004 — file verified correct (live application needs CLI)
**Migration file:** `supabase/migrations/0004_rls_policies.sql` exists and is correct. It enables RLS on `anchors`, `sessions`, `profiles` and creates strict per-user ownership policies (`auth.uid() = user_id` / `auth.uid() = id` for all of insert/select/update/delete as applicable). It correctly notes that `award_session_xp()` is `SECURITY DEFINER` so session writes bypass RLS, while client-side momentum/profile writes rely on the `profiles` UPDATE policy. Also confirmed `0005_unique_anchor_title.sql` is present (prevents duplicate anchors).

**Live verification (external — not runnable here):** no Supabase CLI or linked project in this workspace. To confirm `0004` is actually applied on the target project, run one of:
- `supabase migration list` (after `supabase login` + link) and confirm `0004_rls_policies` shows as applied; or
- In the Supabase dashboard → Database → Extensions / SQL editor: `select * from supabase_migrations.schema_migrations order by version;` and confirm `0004` is listed; or
- Dashboard → Authentication → Policies and visually confirm the `anchors/sessions/profiles` `*_own` policies exist.

**Result:** Code-side RLS definition is sound. The only remaining risk is a project where `0004` was never pushed — verify with the command above before launch. (If the project was created only from `0001-0003`, user data could be exposed — this is why the doc flags it as launch-blocking.)

## ✅ #5 Session discard confirm + persistence (SessionScreen.tsx)
**Root cause:** Tapping the close (✕) button called `navigation.goBack()` unconditionally — an active/in-progress timer was silently discarded. Session state was in-memory only, so an app kill lost the user's time.

**Fixes:**
- **Discard confirm:** added `handleClose()`. If elapsed > 1s or the timer is active, an `Alert` ("Discard this session?") with *Keep going* / *Discard* is shown before leaving. Otherwise it closes cleanly. Blocked while `isSaving`.
- **Persistence across app kill:** added `AsyncStorage` (already a dep) persistence keyed per anchor (`theanchor:session:<id>`).
  - `handleStart` / `handlePause` persist `{ startTs, accumulated, isActive }`.
  - A mount effect restores a saved session: computes elapsed from the absolute `startTs`, restores into a **paused** state (never auto-starts) so the user re-engages intentionally.
  - `resetTimer`, `doFinish`, and the discard path all `clearPersistedSession`.
- **Spinner contrast:** no `#fff` `ActivityIndicator` exists in `SessionScreen` (the finish button uses `colors.onAccent` text on a success background), so nothing to fix there.

**Result:** Closing an active timer now asks first; an in-progress session survives an app kill and resumes paused.

**Note:** Minimum is still *not enforced* beyond the under-minimum confirm dialog (a 1s finish still awards XP). That's a product decision left as-is; the doc's "enforce a real minimum" item is separate polish.

## ✅ #6 Recovery Score duplication — explained in-app + gated on real data
**Root cause:** `getRecoveryScore()` = `0.6×bounce-back + 0.4×momentum` overlaps Momentum (and returns raw momentum when <2 sessions). It was shown as a hero on Progress and a hero-stat on Home with no explanation, and Home showed a deflating `0/100` for brand-new users.

**Decision:** The later Pass 2 review rates the Progress Recovery hero as "the clearest thesis statement," so rather than delete it I followed the Pass 1 fallback — *keep it but explain it in-app* — and removed the duplicate/deflating Home display until it has meaning.

**Fixes:**
- `screens/ProgressScreen.tsx`: added an in-app clarifying line under the Recovery hero — *"Different from Momentum: this tracks how quickly you recover after a missed day, not your current level."*
- `screens/HomeScreen.tsx`: `loadRecovery` now captures `hasData`; RECOVERY hero-stat is rendered only when `recoveryHasData` is true, so new users (<2 sessions) no longer see a `0/100` "Show up today" that isn't yet recovery. Momentum remains the single always-on consistency signal.

**Result:** Recovery is explained and no longer duplicated as a meaningless number on Home.

## ✅ #7 Profile dead-ends + Delete Account + System theme + editable name
**Fixes (`screens/ProfileScreen.tsx`, `src/theme/ThemeProvider.tsx`):**
- **Phantom subscription removed:** `SHOW_SUBSCRIPTION` set to `false` so the non-functional "TheAnchor Plus / Manage" card no longer renders for every user (no backend exists). The dead `Manage` handler is gone with it.
- **Notifications persisted:** toggle now writes to `AsyncStorage` (`theanchor.notifications`) via `persistNotifications` and is restored on focus — no longer resets every view. (The notifications *feature* itself is still unimplemented; the preference now survives restarts honestly.)
- **Export data is real:** `handleExport` gathers `anchors` + `sessions` + `profile` and shares a JSON via React Native's built-in `Share.share` (no new deps). Replaces the fake `Alert`.
- **Help & Support wired:** `handleHelp` opens `mailto:support@theanchor.app` via `Linking` (falls back to an Alert with the address).
- **Delete Account added:** destructive two-step `Alert`, then client-side cascade-deletes the user's `sessions` → `anchors` → `profiles` (owner-delete permitted by RLS `0004`) and signs out. **Limitation documented in code:** the auth *user record* itself needs server-side deletion (edge function / admin) — out of client scope.
- **System theme:** `ThemeMode` now includes `'system'`; `ThemeProvider` resolves `isDark` from `useColorScheme()` when mode is `'system'`. Profile Segmented offers Light / Dark / **System**.
- **Editable, unified display name:** Identity now sources from `profiles.username` (same as Home — fixes the "there" vs email-local-part vs `user_xxx` inconsistency). Tapping the name opens a modal `TextInput` that saves via `updateProfile({ username })`.

**Result:** No dead-end rows remain; theme has System; name is editable and consistent across screens.

## ✅ #8 Anchor create/edit theming + dark borders + dead code (AddHabitScreen, EditAnchorScreen)
**Fixes:**
- **Dead `isEditing` branch removed (AddHabitScreen):** navigation only ever opens `AddHabit` without an `anchor` param (Home/Journey → `navigate('AddHabit')`), so the edit path was unreachable. Converted AddHabit to **create-only**; editing stays in `EditAnchorScreen` (the correct model). Removed `editingAnchor`, `isEditing`, the `updateAnchor` import, and the dev-mode `console.log` spam.
- **`useThemeColors` adopted in both:** AddHabit and EditAnchor no longer hardcode `isDark ? colors.dark.* : colors.light.*`. All surfaces/text/borders now come from `useThemeColors()` so they track the active theme (incl. the new System mode).
- **Dark-mode input border bug fixed:** AddHabit's `borderColor: colors.neutral[300]` (a light grey, invisible on dark) → `c.hairline` (theme-aware) on all three modal inputs.
- **"480 min" fixed:** added `formatDuration()`; Sleep Early now reads "8 hr", e.g. "7 days • 8 hr".
- **#fff spinner fixed (EditAnchor):** save `ActivityIndicator color="#fff"` → `colors.onAccent` (proper contrast on the primary button).
- **White loading scrim fixed (AddHabit):** overlay was `rgba(255,255,255,0.7)` (blinding in dark mode) → `rgba(0,0,0,0.3)`.

**Not done (follow-ups, flagged but not executed to limit regression risk):**
- **Full merge into one component:** Add and Edit still live in two files with slightly different idioms (template grid vs. direct form). A shared `AnchorForm` would unify them; deferred.
- **Apple-system palette:** templates/color options still use iOS system colors (`#FF3B30` etc.) rather than the calm-teal brand. Cosmetic; left as-is.

## ✅ #9 Navigation: tab labels, FAB label, dead code (TabNavigator, BottomTabBar)
**Fixes:**
- **Dead code deleted:** removed the unused, broken `src/components/navigation/BottomTabBar.tsx` (it called a non-existent `anchorSelection` route and would crash if rendered) and its re-export in `src/components/navigation/index.ts`.
- **FAB now labeled:** `CustomTabBar` passes `label="Check in"` to `FloatingActionButton`, so the self-explanatory pill design is actually used (previously the `label` prop was never passed, leaving a bare unlabeled check icon). When all anchors are checked in, the FAB shows the green "All done" pill (its built-in `done` state).
- **Tab labels added:** `TabBarItem` now renders a text label under each icon (`Home / Journey / Progress / Profile`) via a new `getTabLabel()` map, so icon-only tabs (the compass for Journey) are discoverable. `tabItem` layout switched to a vertical column, with the focused tab using the primary color + bold weight.
- **Debug noise removed:** stripped the `console.log` statements from `loadAnchors` / `loadTodaySessions` / `handleFloatingPress` (the doc flags console logging in production paths).

**Limitation / follow-up:** The tab bar still fetches `anchors` + today's sessions itself (it must, to compute `anchorsDueToday` for the FAB). The doc's broader ask — centralize anchor/session data in a shared hook so Home/Journey/TabNavigator stop re-fetching independently — is a larger refactor deferred to keep this change scoped.

## ✅ #10 Progress Day/Week/Month toggle + Achievements polish (ProgressScreen, analytics.js)
**Fixes:**
- **Day/Week/Month toggle implemented (not just claimed):** added `getDailyActivity(days=30)` to `analytics.js` (daily session counts) and included it in `loadDashboardAnalytics` (plus the dev `seedAnalyticsDemo`). `ProgressScreen` now has a `range` state with a `Segmented` (Day / Week / Month) above the Activity chart. The `AreaChart` switches between daily (last 30 days, weekday labels), weekly (12 weeks), and monthly (6 months, month labels) series; subtitle + totals update per range.
- **Achievements = progressive disclosure:** instead of a grid of ~8 greyed-out locked badges (reads as failure on day 1), the grid now shows only **earned** badges. A caption shows "N earned · M to unlock" / "Keep showing up — M more to unlock." If none earned yet, a friendly prompt replaces the empty grid.
- **Glyph risk re-checked:** the doc worried `northstar`/`lightning`/`shield`/`mountain` might be missing from FA5 free. They are **not** FA5 icons here — achievements render via the custom `AchievementGlyph` monoline system, which defines all of them (confirmed `northstar` at line 88). No blank boxes.

**Result:** The spec's Day/Week/Month control is real; the achievements section no longer feels like a failure state.

## ↩️ #9 FAB label reverted (2026-07-20)
The `label="Check in"` pill added in Fix Log #9 made the check-in FAB a wide pill, which looked worse than the original clean circular icon-only button (the pill design was "dead code" the review itself flagged). Reverted the FAB to the circular icon-only check button (removed the `label` prop) and switched the overlap to a token-based `-floatingButtonSize/2 - 6` so it sits centered on the now-taller labeled tab bar. Discoverability now comes from the tab labels (Home/Journey/Progress/Profile) rather than a labelled FAB. `tsc --noEmit` passes.
