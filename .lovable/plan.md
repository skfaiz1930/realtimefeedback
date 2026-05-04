# Manager Development Tracker — Nudges & Focused Journey

Add a new capability that turns each at-risk / watch manager's weakest dimension into a personalized **Nudge Plan**, and puts those managers on a **Development Track** that the CHRO can monitor over time.

## What the user will see

### 1. New sidebar item: "Development Tracks"
Route: `/development-tracks`. Placed between **Culture Map** and **Trends**. Icon: `Target`.

### 2. New page: Development Tracks
Three sections stacked:

**A. Header strip**
"6 managers on active development tracks · 18 nudges sent this cycle · 4 showing improvement"

**B. Track cards grid (2 columns on desktop, 1 on mobile)**
One card per manager currently on a track. Each card shows:
- Avatar + name + team size
- Risk pill + current CDI score with delta
- **Weakest dimension** chip (e.g. "Develop · 52/100") — auto-derived as the lowest-scoring dimension for that manager
- **Track status**: `Just started` / `Week 2 of 6` / `Improving` / `Stalled` (with colored dot)
- Progress bar (weeks elapsed vs 6-week track)
- **Active nudges count**: "3 active nudges"
- Buttons: `View plan` (opens drawer) · `Send new nudge` (opens nudge composer)

**C. Eligible managers strip**
Horizontal scroller of managers NOT yet on a track but flagged at-risk/watch. Each shows a `+ Start track` button.

### 3. Track detail drawer (right side, opens on "View plan")
- Manager header (same style as existing manager drawer)
- **Focus area** banner: "Focus: Develop — score 52, dropped 9 pts this cycle"
- **AI-generated 6-week Development Plan** (streamed via new edge function, markdown). Sections: Week 1–2 Foundations, Week 3–4 Practice, Week 5–6 Reinforce, Success signals to watch.
- **Nudge timeline**: list of nudges sent — date, channel (Email / Slack / In-app), title, status (Sent / Opened / Acted on)
- **Suggested nudges** (3 AI suggestions): each a small card with title, 1-line rationale, `Send` button
- "Pause track" / "Mark complete" footer actions

### 4. Nudge composer modal
Opens from `Send new nudge`. Fields:
- Channel (Email / Slack / In-app) — segmented control
- Template dropdown (pre-filled by weakest dimension): e.g. for Develop → "Career conversation prompt", "Feedback framework share", "Skill goal check-in"
- Subject + body (editable, AI pre-fills based on template + manager context)
- `✦ Improve with AI` button regenerates body
- Send / Cancel

### 5. Cross-page touches
- **Overview page**: each manager card in "Teams Needing Attention" gets a small `On track` badge (green) when active, or a `+ Track` quick action on hover.
- **Manager drawer (existing)**: add an "On Development Track" section under Coaching Brief showing weak area + active nudges count + link to full plan.

## How it works (technical)

### Database (new tables, RLS enabled, public read for demo since app has no auth yet — same posture as rest of app)
```
development_tracks
  id uuid pk, manager_id text, focus_dimension text,
  start_date timestamptz default now(), status text default 'active',
  weeks_total int default 6, created_at timestamptz default now()

manager_nudges
  id uuid pk, track_id uuid fk, manager_id text,
  channel text, template_key text, subject text, body text,
  status text default 'sent', sent_at timestamptz default now(),
  opened_at timestamptz, acted_at timestamptz
```
For the demo we keep `manager_id` as text matching `src/lib/data.ts` ids. Public RLS policies (select/insert/update for anon) — consistent with the app's current no-auth demo state.

### Edge functions
- `development-plan` — streams a 6-week markdown plan. Inputs: manager + focus dimension + recent score trend. Uses `google/gemini-2.5-flash` via Lovable AI gateway, mirrors `coaching-brief` structure and reuses `streamEdgeFunction`.
- `suggest-nudges` — non-streaming JSON; returns 3 nudge suggestions `{title, rationale, suggested_subject, suggested_body}` for the focus dimension.
- `compose-nudge` — non-streaming; given template_key + manager + dimension, returns subject + body. Used by `✦ Improve with AI`.

### Frontend pieces
- `src/pages/DevelopmentTracks.tsx` — new page, wired in `App.tsx`.
- `src/components/pulse/Sidebar.tsx` — add nav item between Culture Map and Trends.
- `src/components/pulse/TrackCard.tsx`, `TrackDrawer.tsx`, `NudgeComposer.tsx`, `NudgeTimeline.tsx` — new components.
- `src/lib/tracks.ts` — supabase data helpers (start track, list tracks, list nudges, send nudge, update status); derives weakest dimension from `dimensions` data.
- Reuse existing `Drawer`, `usePeriod`, `aiStream`, markdown rendering pattern from `CoachingBrief`.

### Animations
- Track cards: stagger fade-up 60ms apart.
- Nudge timeline items: slide-in from left on append.
- Nudge composer: scale 0.96→1 + fade 150ms.
- "Mark complete" triggers green confetti-free check pulse on the card.

## Out of scope (call out)
- Real email/Slack delivery — `Send` records the nudge and marks `status = sent`; no external integration.
- Cross-cycle longitudinal scoring — uses current `dimensions` data; no new historical store.
