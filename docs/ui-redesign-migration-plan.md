# Ambitious UI Redesign Build Plan

## Goal

Blast the current UI into the `proposed-redesign-concept` direction over a couple of focused development sessions. This is a personal project, so optimize for velocity, visible transformation, and a working local app over slow migration ceremony.

The end state should feel much closer to a desktop Oura-style health OS:

- Atmospheric full-window shell.
- Health-first navigation.
- Curated `Today` view.
- Dedicated Sleep, Readiness, Activity, Resilience, Trends, Journal, Dashboards, and AI Analyst areas.
- Contextual right rail with sync, ring, timeline, and AI shortcuts.
- Existing local Oura data and custom widgets integrated into the new experience instead of sitting in a separate old dashboard app.

Use git checkpoints aggressively. No PR flow needed.

## What We Keep

Keep the pieces that already make the app useful:

- `DashboardProvider` for app state, selected date, dashboards, panels, and persistence.
- `useOuraData`, `useConnectionHealth`, and `/api/days/{date}`.
- `/api/query` for trends and historical mini charts.
- `/api/advisor/chat` and `useChat`.
- `DashboardGrid`, `WidgetRegistry`, and existing widgets, but move them into the redesigned shell.
- `SettingsPanel` and `WidgetEditorPanel`, restyled later if needed.

Everything else is fair game.

## Product Direction

Treat the concept as the new default app, not an optional skin.

The current configurable dashboard becomes one destination inside a broader health app. The first screen should be `Today`, not an empty custom dashboard. The custom dashboard remains valuable for power users, but it should no longer define the whole product.

User-facing naming:

- Use `Cracked Oura` for the app.
- Use `AI Analyst` or `Health Analyst`, not `Oura Advisor`.
- Use Oura-style health concepts where the local export supports them.
- Avoid fake official claims, but do not let that slow down the UI. Missing data gets confident empty states and placeholders wired to future data.

## Target Information Architecture

Primary destinations:

- `Today`: curated daily command center.
- `Sleep`: score, sleep duration, sessions, stages, HR, HRV.
- `Readiness`: score, contributors, recovery markers.
- `Activity`: score, steps, calories, workouts, movement.
- `Resilience`: resilience level and stress/recovery data when present.
- `Trends`: historical explorer powered by existing query endpoints.
- `Journal`: tags and notes. Start read-only if needed, but build the screen.
- `Dashboards`: existing custom dashboards and widget editing.
- `AI Analyst`: current chat, redesigned as a premium local-data analyst.
- `Settings`: sync, import, AI endpoint, theme/preferences.

Secondary/sidebar details:

- Rest Mode toggle.
- Sync action/status.
- Ring battery/status when data exists.
- User/app identity card.

## Build Philosophy

- Make the new shell first, even if some sections start shallow.
- Prefer concept-level completeness over perfect data coverage.
- Use real data wherever it exists.
- For missing data, create honest placeholders that make the future data contract obvious.
- Do not spend time preserving old visual hierarchy.
- Do not split into PRs. Work in git checkpoints:
  - checkpoint before shell replacement
  - checkpoint after shell compiles
  - checkpoint after Today works
  - checkpoint after dedicated views are wired
  - checkpoint after visual polish

## Session 1: Replace The App Shell And Land Today

### 1. Create A Redesign Branch

Create a working branch such as:

`codex/oura-redesign-blast`

Commit before major steps. The branch is the safety net.

### 2. Add The View Model Adapter

Create:

`frontend/src/lib/day-summary.ts`

Purpose:

- Convert raw `useOuraData(date)` output into a stable UI model.
- Normalize Sleep, Readiness, Activity scores.
- Format durations, steps, calories, bpm, HRV, battery, and missing values.
- Select the primary sleep session.
- Build a timeline from available local records:
  - sleep sessions
  - workouts
  - meditation
  - ring battery samples
  - tags if present
- Generate deterministic daily insight text.

Do this quickly. It does not need to model every Oura field on day one.

### 3. Replace `MainLayout` With The New Shell

Replace the current layout with:

- `AppShell`
- `HealthSidebar`
- `TopDateBar`
- `ContextRail`

The shell should immediately look like the concept:

- dark atmospheric background
- glass sidebar
- slim glass top bar
- main scroll region
- right rail on desktop
- compact health navigation

Use the concept background images if packaging works quickly:

- `proposed-redesign-concept/public/images/oura-bg-day.jpg`
- `proposed-redesign-concept/public/images/oura-bg-night.jpg`

If asset copying slows things down, use CSS background treatment first and add images later.

### 4. Expand App Navigation State

Replace the narrow `activeView: 'dashboard' | 'chat-page'` model with a broader view union:

- `today`
- `sleep`
- `readiness`
- `activity`
- `resilience`
- `trends`
- `journal`
- `dashboards`
- `ai`

Keep settings/editor/chat side panels as panels where useful.

Default view should become `today`.

### 5. Build The Today View

Create:

- `frontend/src/components/views/TodayView.tsx`
- `frontend/src/components/health/ScoreRing.tsx`
- `frontend/src/components/health/DailyInsightCard.tsx`
- `frontend/src/components/health/MetricPill.tsx`
- `frontend/src/components/health/MiniTrendStrip.tsx`

Today should include:

- greeting based on time of day
- selected date summary
- Sleep, Readiness, Activity score rings
- one large daily insight card
- quick metrics:
  - steps
  - total sleep
  - resting HR
  - HRV
  - calories
  - resilience
- quick links into Sleep, Readiness, Activity
- top tags or "No tags logged"
- 7/30-day score trend strip using `/api/query`

This page is the redesign anchor. Make it visually strong.

### 6. Move Existing Dashboards Into The New Shell

The `Dashboards` destination renders the existing `DashboardGrid`.

Keep:

- edit layout
- add widget
- widget editor
- dashboard create/rename/delete
- layout persistence

Restyle only what is necessary to avoid visual clash. Full widget polish can wait.

### 7. Wire AI Analyst Into The Shell

Rename the chat destination to `AI Analyst`.

Keep the existing backend and hook. Redesign the page header and suggestion prompts to match the concept. Add selected-date-aware prompt buttons, for example:

- "Summarize this day"
- "Why was my sleep score low?"
- "Compare readiness to the last 30 days"
- "What should I watch this week?"

### Session 1 Exit Criteria

- App launches into the redesigned shell.
- `Today`, `Dashboards`, `AI Analyst`, and `Settings` are reachable.
- Selected date changes the Today data.
- Existing custom dashboards still render.
- AI chat still sends messages.
- Sync/backend status is visible.
- Build passes or has only known non-blocking lint polish.

## Session 2: Fill The Health App

### 1. Build Dedicated Health Views

Create these views using the same adapter layer:

- `SleepView`
- `ReadinessView`
- `ActivityView`
- `ResilienceView`

Do not wait for perfect charts. Each page should have:

- hero score card
- contributor/metric list
- one main visualization area
- compact explanatory insight
- missing-data empty state

Reuse existing widgets or simple SVG/CSS visualizations. The goal is useful and coherent, not exhaustive.

### 2. Build Trends As A Real Destination

Use current query infrastructure to create a polished trends explorer:

- quick metric presets
- score comparison for Sleep, Readiness, Activity
- range selector
- chart area
- empty/loading states

This can initially wrap existing trend widgets if faster.

### 3. Build Journal

Create the Journal screen even if write support is basic.

Minimum useful version:

- selected date notes area
- tag list from imported data if available
- common tag chips as UI placeholders
- message explaining whether edits are local-only or read-only

If backend write support is quick, add local persistence. If not, keep the UI and mark save disabled with clear copy.

### 4. Build The Context Rail

The right rail should become the daily cockpit:

- ring/sync card
- selected date timeline
- battery information
- latest workout/sleep session summary
- quick AI prompts

Use real data first. If something is missing, show compact placeholders rather than removing the section.

### 5. Restyle Shared UI

Bring visual cohesion across:

- `WidgetCard`
- `ChatPage`
- `SettingsPanel`
- `WidgetEditorPanel`
- buttons and side panel surfaces

Move toward:

- glass panels
- tighter radii
- dark health-app palette
- meaningful score colors
- compact professional spacing

### 6. Responsive Pass

Add a quick responsive layer:

- collapse/hide right rail below desktop width
- make sidebar narrower or icon-only
- make Today score cards stack cleanly
- ensure the dashboard grid does not become unusable

Do not over-optimize mobile unless the desktop app already feels complete.

### Session 2 Exit Criteria

- All primary destinations exist.
- No concept screen is purely mock-only.
- Missing data states are intentional.
- The app feels like one redesigned product, not old dashboard plus new pages.
- Build runs.
- The UI is good enough to use daily and iterate from.

## Aggressive Component Map

Create or replace:

- `frontend/src/components/layout/AppShell.tsx`
- `frontend/src/components/layout/HealthSidebar.tsx`
- `frontend/src/components/layout/TopDateBar.tsx`
- `frontend/src/components/layout/ContextRail.tsx`
- `frontend/src/components/views/TodayView.tsx`
- `frontend/src/components/views/SleepView.tsx`
- `frontend/src/components/views/ReadinessView.tsx`
- `frontend/src/components/views/ActivityView.tsx`
- `frontend/src/components/views/ResilienceView.tsx`
- `frontend/src/components/views/TrendsView.tsx`
- `frontend/src/components/views/JournalView.tsx`
- `frontend/src/components/views/AIAnalystView.tsx`
- `frontend/src/components/health/ScoreRing.tsx`
- `frontend/src/components/health/MetricPill.tsx`
- `frontend/src/components/health/DailyInsightCard.tsx`
- `frontend/src/components/health/TimelineList.tsx`
- `frontend/src/lib/day-summary.ts`

Refactor heavily:

- `frontend/src/App.tsx`
- `frontend/src/contexts/DashboardContext.tsx`
- `frontend/src/components/layout/MainLayout.tsx`
- `frontend/src/components/layout/AppSidebar.tsx`
- `frontend/src/components/dashboard/ChatPage.tsx`
- `frontend/src/components/dashboard/WidgetCard.tsx`

Keep mostly intact:

- `DashboardGrid`
- `WidgetRegistry`
- current widgets
- API hooks
- backend routes

## Data Mapping Priorities

### Must Work Immediately

- Sleep score
- Readiness score
- Activity score
- Steps
- Total sleep duration
- Calories
- Workouts
- Sync status
- AI chat
- Dashboard widgets

### Should Work In Session 2

- Primary sleep session details
- Resting heart rate
- HRV
- Sleep stages if available
- Resilience level
- Battery samples
- Tags
- Timeline

### Can Be Placeholder-Backed

- Rest Mode behavior
- Body clock
- Chronotype
- advanced stress narrative
- journal writing
- ring firmware/model display
- search

## Visual Direction

Use the concept's high-end dark health OS style:

- black/charcoal base
- cool blue for sleep
- teal/green for readiness and recovery
- amber/coral for activity and strain
- glass nav/card surfaces
- slim top bar
- strong score rings
- subtle atmospheric background
- compact right rail

Make it distinctive, but avoid burning time on decorative complexity before all views exist.

## Git Workflow

No PRs. Use local commits as save points:

1. `checkpoint: before redesign shell`
2. `redesign: add health shell`
3. `redesign: add today view`
4. `redesign: move dashboards into shell`
5. `redesign: add health section views`
6. `redesign: polish analyst and context rail`
7. `redesign: final visual pass`

Run build before any commit that feels like a stable checkpoint.

## Verification

Fast verification only:

- `npm run build`
- launch dev app
- click every nav item
- change dates
- send one AI message
- edit one dashboard widget
- open settings
- confirm disconnected backend state does not wreck the shell

Use visual inspection over exhaustive testing for the redesign sessions. Add focused tests only for the data adapter if it starts getting tricky.

## Definition Of Done

The redesign is done enough when:

- The app opens to a compelling Today view.
- The old dashboard is no longer the center of gravity.
- All primary health destinations are present.
- Real local data appears wherever available.
- Missing data is handled cleanly.
- AI Analyst is integrated into the product instead of bolted on.
- The app can be used as the daily driver for exploring Oura export data.

After that, iterate ruthlessly from actual use.
