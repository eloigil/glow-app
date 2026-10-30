---
doc: spec
status: approved
---

# GlowApp — Technical Spec

## How This Works, In Plain Language
GlowApp is one Next.js web app with two halves living in the same project:

- **The screens** (what she sees on her phone): Welcome, Add Photo, Skin Analysis, Your Looks, Tutorial, Finish, Saved Looks. They hold the current session in memory while she moves between them.
- **Three small server routes** (code that runs on your machine, never on her phone): they hold the YouCam and OpenAI keys and do the talking.
  1. **Analyze**: uploads her photo to YouCam once, asks YouCam's Skin Analysis what it sees today (acne, redness, dark circles...) and, if we don't already know it, asks Facial Color Tones for her exact skin color.
  2. **Looks**: hands that skin read to OpenAI, which writes six looks as strict JSON: name, description, difficulty 1 to 3, and the ordered makeup steps with colors, YouCam effect names and tips. Steps that fix today's points say which point they fix.
  3. **Render**: asks YouCam's Makeup try-on to paint a list of effects onto her photo and sends back the finished image. A preview is "all steps at once". A tutorial step is "steps 1 to N". Each render costs 1 unit.

Her skin color is remembered in the browser (localStorage), so the 20-unit tone call happens once, not every session. Saved looks keep their actual images on the device (IndexedDB), because YouCam's image links expire after 2 hours.

While building, the server routes run in **replay mode**: they answer from responses recorded once from the real APIs, so development spends 0 units. One switch turns real calls back on.

Why this shape: one project, one start command, keys stay secret, and deploying later to Vercel needs no rewrite.

## The Core Journey Through the System
PRD ref: `prd.md > The Core Journey`.

1. **Welcome** → she taps Start. Nothing is called.
2. **Add Photo** → she takes or picks a photo → the browser shrinks it to 1600px on the long side (JPEG) → `POST /api/analyze`.
3. **Analyze route** → uploads to YouCam (`file_id`) → starts Skin Analysis (SD, 6 concerns, 12 units) → if the browser sent no saved tone, also starts Facial Color Tones (20 units) → polls both until done → returns `{ fileId, concerns[], masks, skinType, tone }`. The browser saves `tone` to localStorage.
   - Unusable photo → YouCam returns an error code → route maps it to a plain message → Add Photo shows it with Retry. Failed tasks cost 0 units.
4. **Skin Analysis screen** → shows tone and one card per concern whose score is low enough to count as a point today. Tapping a card overlays that concern's mask on her photo.
5. She continues → `POST /api/looks` with concerns, skin type and tone → OpenAI returns six looks (validated: exactly six, at least one of each difficulty, every point fixed by at least one step).
6. **Your Looks** → the browser fires six `POST /api/render` calls (full effect list each, 6 units). Each card shows a skeleton until its image arrives.
7. She taps a look → the card grows in place (description, difficulty, Start makeup).
8. **Start makeup** → the browser requests one render per step (steps 1..N cumulative, about 6 units), step 1 first so she can begin while the rest finish.
9. **Tutorial** → each step shows its render, the step name ("Concealer, warm beige") and the LLM tip. Swipe / Next / tap the wizard.
10. **Finish** → Save writes the look (original photo, every step image, tips) to IndexedDB. Finish returns to Welcome.
11. **Saved Looks** → reads IndexedDB and replays the tutorial with zero API calls.

Unit budget per full session: 12 (analysis) + 20 (tone, first session only) + 5 (previews) + about 6 (steps) ≈ **43 first time, ≈23 after**. 1,000 units covers roughly 35 to 40 full live runs.

## Stack
Agreed with the learner: "recommend one web oriented" → accepted Next.js recommendation; LLM: "openai api".

| Piece | Choice | Why |
|---|---|---|
| Framework | **Next.js** (App Router, current stable; pin the version at scaffold) + **TypeScript** | Screens and server routes in one project; keys stay server-side; one-step Vercel deploy later. Tradeoff accepted: heavier than plain Vite. https://nextjs.org/docs |
| Styling | **Tailwind CSS v4**, tokens in `@theme` | Fast to express the PRD tokens. https://tailwindcss.com/docs |
| Motion | **Motion** (`motion/react`) | Card growing in place (`layout`), layer cross-fade, scan sweep, all with reduced-motion fallbacks. https://motion.dev/docs/react |
| Icons | **Hugeicons** (`@hugeicons/react` + `@hugeicons/core-free-icons`, MIT) | Learner's pick. Verify early that the blush brush exists in the free set; fallback is `@iconify/react` with the `hugeicons` set. https://hugeicons.com/docs |
| Fonts | `next/font/google`: **Unbounded** (display), **Geist** (UI) | From `prd.md > Look and Feel`. |
| LLM | **OpenAI** Node SDK (`openai`) with Structured Outputs + **zod** schemas; model name hardcoded as `OPENAI_MODEL` in `lib/openai/model.ts` | Strict JSON for looks. https://platform.openai.com/docs/guides/structured-outputs |
| Beauty AI | **YouCam API** (Skin Analysis, Facial Color Tones, Makeup VTO) | Hackathon requirement and the kernel. https://docs.perfectcorp.com/ |
| On-device storage | `localStorage` (tone), **idb-keyval** (saved looks in IndexedDB) | Tone is tiny JSON; saved looks hold image blobs. https://github.com/jakearchibald/idb-keyval |

## Where It Runs and How Someone Tries It
- **Runtime:** Node.js 20+ locally. Browser: phone-sized Chrome/Safari (DevTools device mode is fine for recording).
- **Setup:** `npm install`, copy `.env.example` to `.env` (gitignored).
- **Start:** `npm run dev`, open `http://localhost:3000` (use phone size).
- **Env vars:**
  - `API_MODE=replay|record|live` (default `replay`)
  - `YOUCAM_API_KEY` (needed for record/live)
  - `OPENAI_API_KEY` (needed for record/live)
- **Judges without keys:** the committed fixtures make the full journey run in `replay` mode with no keys at all. The README says this first.
- **Demo recording:** one `live` run with the demo photo, to show real YouCam output (about 43 units). The YouCam demo video must name the APIs used: Skin Analysis, Facial Color Tones, Makeup VTO.
- **Deployment:** not now (learner: "do not deploy yet, leave it prepared"). Prepared means: no file-system writes outside `record` mode, all config via env vars, `.env.example` complete. Later: import the repo into Vercel, set env vars with `API_MODE=live`. `record` mode is local only.

## Look and Feel
From `prd.md > Look and Feel`, as implementable tokens in `app/globals.css` (`@theme`), light default plus `prefers-color-scheme: dark`:

- **Colors:**
  - canvas `#F6F3F5`, surface `#FDFCFD`, ink `#17141A`, ink-muted `#5D5662`, line `#EDE4EA`.
  - The one accent is **pastel rose `#EC94B0`**: icons, links, active wizard step (ink text on it), concern rings and mask tint, difficulty bars on white.
  - blush-wash `#FBE8EE`.
  - Dark: canvas `#141116`, surface `#1D1920`, ink `#F4EFF3`, rose `#F4B6C9`.
- **Primary button:**
  - gradient `#F6C1D2` → `#FCE3DA`, ink text, 8px corners, inner white top highlight, soft rose shadow.
  - **Exception:** the Welcome Start button is an ink `#17141A` pill with white text.
- **Shapes:** cards and photo frames 10px, bottom sheets 14px top corners, thumbnails 8px, chips and the wizard stay pills.
- **Glass:** only over photos (wizard, tips sheet, concern cards, Saved Looks icon): `backdrop-filter: blur(24px) saturate(170%)`, 1px white inner edge, solid fallback under `prefers-reduced-transparency`.
- **Difficulty signal:**
  - On photos: white bars with drop shadow, empty bars fully transparent, no chip.
  - On white: rose bars.
- **Imagery:**
  - Welcome uses the Unsplash blush-bubbles photo, saved to `public/` and credited in the README (https://unsplash.com/photos/water-droplets-on-red-surface-jbHZ6S8AcaA).
  - Placeholders are light pink, never brown.
- **Type:** Unbounded for screen titles and wordmark only; Geist everywhere else. Icons 24px in lists, 28px for primary actions.
- **Motion** (all off under `prefers-reduced-motion`):
  - scan sweep during analysis
  - one ring pulse when a concern is tapped
  - step layer cross-fade
  - look card grows in place (`layout`)
  - skeleton shimmer for pending previews
  - press-down on buttons
- **Copy tone:** short, warm, second person ("Your skin today").

## Components

### Server

#### Analyze Route (`app/api/analyze/route.ts`)
Receives the photo (multipart) and optional `hasTone` flag. Uploads once to YouCam, runs Skin Analysis (+ Facial Color Tones when needed) in parallel, polls, returns a normalized result. Maps YouCam error codes via `lib/youcam/errors.ts`.
PRD ref: `prd.md > Skin Analysis`, `prd.md > States and Boundaries`.

#### Looks Route (`app/api/looks/route.ts`)
Builds the prompt from concerns + skin type + tone, calls OpenAI with the `LookPlan` zod schema, then validates: 6 looks, difficulty mix, every point covered by a `corrects` step, every `pattern` name exists in the allowed YouCam pattern list. One automatic retry on validation failure, with the problems listed.
PRD ref: `prd.md > Look Proposals`, `prd.md > Step-by-Step Tutorial`.

#### Render Route (`app/api/render/route.ts`)
Receives `{ fileId, effects[] }`, runs one Makeup VTO task, polls, downloads the result and returns it as a data URL (so it never expires on the client). Sets `skin_smooth` explicitly so layers stay honest.
PRD ref: `prd.md > Look Proposals` (previews), `prd.md > Step-by-Step Tutorial` (steps).

#### YouCam Client (`lib/youcam/`)
- `client.ts`: authed fetch to `https://yce-api-01.makeupar.com`.
- `tasks.ts`: upload, create, and poll every 2s with a 60s timeout.
- `errors.ts`: code → user message.
- `patterns.ts`: allowed pattern names per category, fetched once from YouCam's pattern catalogs and committed as JSON.

#### Replay Layer (`lib/replay.ts`)
Wraps every YouCam and OpenAI call, keyed by a hash of the request:
- **replay** (default): reads `fixtures/`.
- **record**: calls for real and writes `fixtures/`.
- **live**: calls for real, writes nothing.

A render missing from fixtures in replay returns the closest recorded step image with a small "replay" tag, so the UI still flows.

**Rule for the build** (learner's condition): stay in replay. Switch to live only while building the step-by-step tutorial rendering, and only if replay can't answer the question being tested.

### Screens

#### Session Store (`lib/session.tsx`)
React context in the root layout: photo (blob + object URL), `fileId`, analysis, tone, looks, preview images, step images. Lives in memory. A reload sends her back to Welcome.

#### Welcome (`app/page.tsx`)
Bubble photo, Unbounded title, ink pill Start, glass Saved Looks icon top-right.
PRD ref: `prd.md > Welcome and Photo Capture`.

#### Add Photo (`app/photo/page.tsx`)
Two buttons over one `<input type="file" accept="image/*">`: *Take a photo* uses `capture="user"`, *Upload a picture* has no capture. Resizes the photo (`lib/image.ts`), calls Analyze, shows the scan sweep while waiting, shows error + Retry.
PRD ref: `prd.md > Welcome and Photo Capture`, `prd.md > States and Boundaries`.

#### Skin Analysis (`app/analysis/page.tsx`)
Photo, glass sheet with the tone chip and **Concern Cards**. Tapping a card overlays its mask (CSS `mask-image` tinted rose) with one ring pulse. Continue → Looks route.
PRD ref: `prd.md > Skin Analysis`.

#### Your Looks (`app/looks/page.tsx`)
Two-column grid of **Look Cards** with white **Signal Bars** on the preview. The grown card spans both columns (Motion `layout`), showing description, rose bars + label, and the gradient Start makeup button. Skeletons for previews still rendering.
PRD ref: `prd.md > Look Proposals`.

#### Tutorial (`app/tutorial/page.tsx`)
- **Step Wizard** (glass pill) on top.
- Her face at least half the screen, with layers cross-fading.
- **Tips Sheet** (glass) below: step name, tip, Back/Next.
- Swipe via Motion drag on touch, Next button on desktop.
- After the last step: **Finish** view with Save and Finish (stretch: before/after slider).

PRD ref: `prd.md > Step-by-Step Tutorial`, `prd.md > Finish and Saved Looks`.

#### Saved Looks (`app/saved/page.tsx`)
List from IndexedDB (preview, name, saved date). Opening one loads it into the session and opens Tutorial, with no network calls.
PRD ref: `prd.md > Finish and Saved Looks`.

#### Shared UI (`components/`)
- `Button` (gradient / ink-pill / quiet)
- `GlassSheet`
- `StepWizard`
- `LookCard`
- `SignalBars` (`onPhoto` variant)
- `ConcernCard`
- `MaskHighlight`
- `ScanSweep`
- `Skeleton`
- `Icon` (Hugeicons wrapper with sizes)

## Data Model

```ts
type Concern = { key: "acne"|"redness"|"dark_circle_v2"|"age_spot"|"oiliness"|"eye_bag";
  label: string; uiScore: number; isPoint: boolean; maskUrl?: string };
type Tone = { skinHex: string; lipHex: string; browHex: string; label: string };
type Step = { title: string; category: string; pattern?: string; colors: string[];
  intensity: number; texture?: string; tip: string; corrects?: Concern["key"] };
type Look = { id: string; name: string; description: string; difficulty: 1|2|3;
  minutes: number; steps: Step[] };
type SavedLook = { id: string; name: string; difficulty: 1|2|3; savedAt: string;
  original: Blob; preview: Blob; steps: { title: string; tip: string; image: Blob }[] };
```

| Data | Lives in | Updated when | After leaving and coming back |
|---|---|---|---|
| Photo, `fileId`, analysis, looks, previews, step images | Session Store (memory) | Each screen's call returns | Gone. Back to Welcome. |
| Tone | `localStorage` key `glow.tone` (learner's choice) | First successful analysis | Reused. The tone call is skipped. |
| Saved looks | IndexedDB via idb-keyval, key `glow.saved.<id>` | Save on Finish | Listed in Saved Looks, fully replayable offline |
| Recorded API responses | `fixtures/` in the repo | `API_MODE=record` runs | Committed. Replay works for anyone. |

A concern counts as a **point** when `uiScore < 60` (YouCam scores 1 to 100, higher is healthier). Tune this threshold in `lib/youcam/concerns.ts` once real data is in.

## File Structure

```
GlowApp/
├── app/
│   ├── layout.tsx            # fonts, theme tokens, Session Store provider
│   ├── globals.css           # Tailwind v4 @theme tokens, glass utilities
│   ├── page.tsx              # Welcome
│   ├── photo/page.tsx        # Add Photo (+ errors, Retry)
│   ├── analysis/page.tsx     # Skin Analysis with Concern Cards + masks
│   ├── looks/page.tsx        # Your Looks grid, card grows in place
│   ├── tutorial/page.tsx     # Step Wizard, layers, Tips Sheet, Finish view
│   ├── saved/page.tsx        # Saved Looks from IndexedDB
│   └── api/
│       ├── analyze/route.ts  # upload + Skin Analysis + Facial Color Tones
│       ├── looks/route.ts    # OpenAI look plan + validation
│       └── render/route.ts   # Makeup VTO, returns data URL
├── components/               # Button, GlassSheet, StepWizard, LookCard, SignalBars,
│                             # ConcernCard, MaskHighlight, ScanSweep, Skeleton, Icon
├── lib/
│   ├── youcam/
│   │   ├── client.ts         # base URL + Bearer auth
│   │   ├── tasks.ts          # upload, create task, poll
│   │   ├── errors.ts         # error code -> message
│   │   ├── concerns.ts       # concern list, labels, point threshold
│   │   └── patterns.json     # allowed pattern names per category
│   ├── openai/
│   │   ├── schema.ts         # zod LookPlan
│   │   └── plan.ts           # prompt + call + validation
│   ├── replay.ts             # API_MODE replay/record/live
│   ├── session.tsx           # in-memory session context
│   ├── saved.ts              # idb-keyval save/list/load
│   └── image.ts              # resize to 1600px JPEG
├── fixtures/                 # recorded API responses + images (committed)
├── public/welcome.mp4 + welcome-poster.jpg
├── .env.example
├── README.md                 # run in replay, APIs used, credits
└── devpost/                  # planning docs
```

## External Services and Dependencies

### YouCam API
Docs: https://docs.perfectcorp.com/. Auth: `Authorization: Bearer $YOUCAM_API_KEY`, base `https://yce-api-01.makeupar.com`. Server-side only. Rate limit: 250 requests per 300s. Units are charged only on `success`.

| Call | Endpoint | Key payload | Returns | Units |
|---|---|---|---|---|
| Upload | `POST /s2s/v2.0/file` then `PUT` bytes to the returned URL | `content_type, file_name, file_size` | `file_id` | 0 |
| Skin Analysis | `POST /s2s/v2.0/task/skin-analysis`, poll `GET .../{task_id}` | `src_file_id`, `dst_actions: [acne, redness, dark_circle_v2, age_spot, oiliness, eye_bag]`, `format: "json"` | per-concern `ui_score`, `mask_urls`, `skin_type` | 12 (SD, 5-8 concerns) |
| Facial Color Tones | `POST /s2s/v2.0/task/skin-tone-analysis`, poll | `src_file_id` | `skin_color`, `lip_color`, `eyebrow_color` hex | 20 |
| Makeup VTO | `POST /s2s/v2.0/task/makeup-vto`, poll | `src_file_id`, `effects[]` (category, `pattern.name`, `palettes[{color, colorIntensity, texture}]`) | result image `url` (2h) | 1 |

Docs used:
- https://docs.perfectcorp.com/reference/description/ai_skin_analysis.md
- https://docs.perfectcorp.com/reference/description/ai_face_tone_analyzer.md
- https://docs.perfectcorp.com/reference/description/ai_makeup_vto.md
- https://docs.perfectcorp.com/develop/error_codes.md

Pattern catalogs, e.g. https://plugins-media.makeupar.com/wcm-saas/patterns/eyeshadow.json. The palette count must match the pattern's `colorNum`.

### OpenAI API
`responses` / chat completion with Structured Outputs from the zod `LookPlan` schema. One call per session (plus at most one retry). Model from the `OPENAI_MODEL` constant in `lib/openai/model.ts`. Docs: https://platform.openai.com/docs/guides/structured-outputs.

### Verify early in the build
1. Makeup VTO image limits: the docs disagree (long side under 1920 vs height under 1080). Test 1600px portrait in record mode.
2. Typical task latency (not documented). Set poll interval and loading copy from real numbers.
3. Whether mask URLs load cross-origin into CSS `mask-image`. If not, proxy them through the Analyze route as data URLs.
4. That every category's `pattern` + `colorNum` rules accept what the LLM produces.

## Important Failure Modes
- **Unusable photo** → YouCam error code mapped to a message, plus Retry (`prd.md > States and Boundaries`):

  | Error codes | Message |
  |---|---|
  | `error_no_face` | "We couldn't find a face. Try a front-facing photo." |
  | `error_multiple_people` | "Only one face, please." |
  | `error_src_face_too_small`, `error_face_position_too_small` | "Move closer so your face fills the frame." |
  | `error_large_face_angle`, `error_face_angle_*` | "Face the camera straight on." |
  | `error_lighting_dark` | "It's a bit dark. Try softer, brighter light." |
  | anything else image-related | "This photo didn't work. Try another." |

  Blur has no YouCam code, so it falls into the generic message.
- **Credits gone or YouCam failing** (`CreditInsufficiency`, 5xx, `TaskTimeout`, 60s poll timeout) → "We ran out of credits for the demo. Try later."
- **LLM output breaks the rules** (wrong count, missing difficulty, unknown pattern) → one automatic retry with the errors; if it fails again, drop invalid steps and fill the difficulty gap by relabeling. A look is never shown with an unrenderable step.

## What Was Simplified and Why
- **No products** instead of carousel + modal + links: YouCam has no product data, and the learner chose to skip rather than hand-build a catalog. Later: a small JSON catalog matched by category and shade hex.
- **Session in memory** instead of persisted sessions: only saved looks need to survive. A reload restarting at Welcome is fine for the demo.
- **Tone cached forever in localStorage** instead of per session: saves 20 units per run. The fuller version would offer "re-check my tone".
- **Polling** instead of YouCam webhooks: webhooks need a public URL. Polling works locally.
- **Replay fixtures** instead of always-live calls: protects the 1,000 units and lets judges run it without keys.

## Decisions and Open Issues
**Learner decisions:**
- Stack: accepted the recommended Next.js + TypeScript + Tailwind v4 + Motion setup ("recommend one web oriented").
- LLM: OpenAI.
- Deployment: none now, prepared for later. No live URL is required by YouCam or Devpost Learn.
- Products: skip, since YouCam has no catalog ("or else skip the feature for now").
- Skin tone: Facial Color Tones API, stored in localStorage.
- Replay mode: yes, with live calls only "sporadically" while building the step-by-step tutorial "if it's needed only".
- Build workflow: the learner designs their own loop (Sonnet coding, Opus orchestration and validation), per `learner-profile.md`.

**Implementation details derived from those decisions (agent):**
- six concerns in SD (12 units)
- point threshold `uiScore < 60`
- route split
- idb-keyval for saved looks
- data URLs for renders
- one retry on bad LLM output

**Learner uncertainty:** none raised during this interview. The open technical unknowns are on the API side and listed under **Verify early in the build**.

**Still open:**
- Name for the "points" cards (from `prd.md > Open Questions`). Decide during the build; default label "Today's focus".
- The demo face photo: must be one the learner has rights to. It is also the photo committed in `fixtures/`, so it becomes public in the repo.
