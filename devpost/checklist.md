---
doc: checklist
status: approved
---

# Build Checklist

Build mode: fast

Workflow (learner's loop): coding subagents where useful (Sonnet for non-critical code); before every commit a review subagent runs `mattpocock-skills:code-review` on the staged change, findings are fixed, then commit.

## Slices

- [x] **1. Upload a photo and see today's skin read**
  Becomes usable: Open the app, tap Start, take or upload a face photo, and see the Skin Analysis screen: skin tone chip and one glass card per point. Tapping a card lights up that area's mask on her photo. Runs fully from recorded fixtures with no keys.
  Why now: YouCam is the riskiest unknown (upload flow, polling, latency, image limits, mask cross-origin). Proving it first, with real responses recorded, means every later slice builds on known data. Scaffold and design tokens come along because this slice needs real screens.
  PRD ref: `prd.md > The Core Journey` (steps 1-3), `prd.md > Welcome and Photo Capture`, `prd.md > Skin Analysis`, `prd.md > Look and Feel`
  Spec ref: `spec.md > Stack`, `spec.md > Look and Feel`, `spec.md > Analyze Route (app/api/analyze/route.ts)`, `spec.md > YouCam Client (lib/youcam/)`, `spec.md > Replay Layer (lib/replay.ts)`, `spec.md > Session Store (lib/session.tsx)`, `spec.md > Welcome (app/page.tsx)`, `spec.md > Add Photo (app/photo/page.tsx)`, `spec.md > Skin Analysis (app/analysis/page.tsx)`, `spec.md > Data Model`, `spec.md > Verify early in the build`
  Build: Scaffold Next.js + TypeScript + Tailwind v4 + Motion + Hugeicons; tokens and fonts in `app/globals.css` / `app/layout.tsx`; `.env.example`; welcome photo in `public/`. YouCam client (upload, create task, poll), replay layer with replay/record/live, analyze route (Skin Analysis 6 concerns SD + Facial Color Tones when no tone sent), tone cached in localStorage. Session Store, Welcome, Add Photo (resize to 1600px JPEG, scan sweep while waiting), Skin Analysis with Concern Cards and mask highlight. One `record` run with the demo photo to create fixtures.
  Verify (mechanical): `npm run build` and `npm run lint` pass. With `API_MODE=replay` and no keys set, `POST /api/analyze` with the fixture photo returns concerns with scores and masks plus a tone. In the browser at phone size, the journey Welcome to Analysis renders, a card tap shows its mask, and there are no console errors. Record the real latency and whether masks load cross-origin under `## Revisions` if they differ from the spec.
  Learner check: Run `npm run dev`, open http://localhost:3000 at phone size, tap Start, upload your demo photo, and look at the skin read: does the tone look right, and does tapping a card light up the right area?
  Commit: `Add photo upload and YouCam skin analysis with replay fixtures`

- [x] **2. A tutorial built layer by layer on her face**
  Becomes usable: From the Skin Analysis screen, tap Continue and get one personalized look, then step through its tutorial. Each step shows her photo with only the layers so far, the step name and an LLM tip, and steps that fix today's points say so. Wizard taps, swipe and Next all work.
  Why now: This is `scope.md > The Unique Kernel`. Building it second, with one look and no grid, proves the whole idea (OpenAI plan to YouCam cumulative renders to tutorial) before anything around it.
  PRD ref: `prd.md > Step-by-Step Tutorial`, `prd.md > The Core Journey` (steps 6-7)
  Spec ref: `spec.md > Looks Route (app/api/looks/route.ts)`, `spec.md > Render Route (app/api/render/route.ts)`, `spec.md > Tutorial (app/tutorial/page.tsx)`, `spec.md > Data Model`, `spec.md > OpenAI API`, `spec.md > Makeup VTO` row in `spec.md > YouCam API`
  Build: zod `LookPlan` schema and OpenAI plan call with validation and one retry; allowed pattern list in `lib/youcam/patterns.json`; render route returning data URLs; Tutorial screen with glass Step Wizard, layer cross-fade, glass Tips Sheet, swipe/Next/wizard navigation. Temporarily route Continue straight to look 1's tutorial. Record fixtures for one look's steps (live calls allowed here only if replay can't answer, per the learner's rule).
  Verify (mechanical): `npm run build` and `npm run lint` pass. In replay, `POST /api/looks` returns five schema-valid looks with at least one of each difficulty and every point covered by a `corrects` step; `POST /api/render` for steps 1..N returns N distinct images. In the browser, every wizard step shows a different image and its tip, and swipe and Next both advance.
  Learner check: Upload your photo, continue, and walk the whole tutorial. Do the layers build up the way you pictured, and do the tips read like real advice for your face today?
  Commit: `Add layer-by-layer makeup tutorial from OpenAI look plan`

- [x] **3. Five looks to choose from**
  Becomes usable: After the skin read, she sees five previews of her own face in a two-column grid with white signal bars. Tapping one grows it in place with its description and Start makeup, which opens that look's tutorial.
  Why now: With the kernel proven, the choice step can wrap it. Previews reuse the render route, so it's mostly UI plus 5 units per session.
  PRD ref: `prd.md > Look Proposals`, `prd.md > The Core Journey` (steps 4-5)
  Spec ref: `spec.md > Your Looks (app/looks/page.tsx)`, `spec.md > Shared UI (components/)`, `spec.md > Look and Feel`
  Build: Your Looks screen, LookCard with Motion `layout` grow-in-place, SignalBars (`onPhoto` white variant and rose variant), skeletons for pending previews, five parallel preview renders, Start makeup to Tutorial for the chosen look. Remove slice 2's shortcut. Record preview fixtures.
  Verify (mechanical): `npm run build` and `npm run lint` pass. In replay, the grid shows exactly five cards with 1, 2 or 3 bars and at least one of each, skeletons show before previews land, tapping a card grows it without a route change, and Start makeup opens that look's tutorial.
  Learner check: Go from photo to the looks grid. Do the five previews feel different enough, does the card grow the way you designed it, and does Start makeup take you into the right tutorial?
  Commit: `Add five-look grid with previews and grow-in-place card`

- [x] **4. Save a look and replay it later**
  Becomes usable: After the last step she sees Finish with Save and Finish. Saved looks appear behind the subtle icon on Welcome and replay fully, offline, with no API calls.
  Why now: Depends on a complete tutorial and is the "come back another day" half of the core loop.
  PRD ref: `prd.md > Finish and Saved Looks`, `prd.md > The Core Journey` (steps 8-9)
  Spec ref: `spec.md > Saved Looks (app/saved/page.tsx)`, `spec.md > Tutorial (app/tutorial/page.tsx)` (Finish view), `spec.md > Data Model` (SavedLook)
  Build: Finish view in Tutorial; `lib/saved.ts` with idb-keyval (original, preview, step images as blobs, tips); Saved Looks list (preview, name, saved date) with empty state; opening one loads the tutorial from IndexedDB.
  Verify (mechanical): `npm run build` and `npm run lint` pass. In the browser: save a look, reload, open Saved Looks and replay every step with the network tab showing no `/api/*` requests.
  Learner check: Finish a tutorial, tap Save, close the tab, come back, open the saved look from the Welcome icon and step through it.
  Commit: `Add saved looks stored on device with offline replay`

- [x] **5. Graceful failures, motion polish and a README judges can follow**
  Becomes usable: Bad photos get a plain message and Retry; credit or YouCam failures show the demo message; reduced-motion and dark mode both look right; the README explains running in replay with no keys, the APIs used, and credits. Stretch: before/after slider on Finish, if time allows.
  Why now: Hardening comes after the journey works end to end, and the README must describe the finished app.
  PRD ref: `prd.md > States and Boundaries`, `prd.md > Look and Feel`, `prd.md > Finish and Saved Looks` (stretch)
  Spec ref: `spec.md > Important Failure Modes`, `spec.md > Where It Runs and How Someone Tries It`, `spec.md > Look and Feel`
  Build: `lib/youcam/errors.ts` mapping wired into Add Photo and all routes; out-of-credits message; replay fixtures for one unusable photo; reduced-motion and dark-mode pass; README (replay quick start, env vars, APIs used, Unsplash credit, Hugeicons/fonts licenses); optional before/after slider.
  Verify (mechanical): `npm run build` and `npm run lint` pass. The unusable-photo fixture shows its mapped message with Retry; forcing a `CreditInsufficiency` response shows the credits message; a fresh clone with no `.env.local` runs the full journey in replay following only the README.
  Learner check: Try a photo with no face (or the bad-photo fixture), then follow the README from scratch in a new terminal.
  Commit: `Add failure states, polish, and README`

## Hands-on Checkpoints

- [x] Early usable behavior explored — after slice 2 (the layer-by-layer tutorial), while feedback can still shape the grid, saving and polish
- [x] Final kick-the-tires exploration and feedback completed

## Final Review

- [x] Final review complete — feedback resolved and learner confirms ready to ship

Final review outcome: learner tried the full journey and asked for no changes ("Tried it all, nothing to change. Ready to ship."). Agent-side final review (code-review skill on slices 3-5) fixes landed in a06ae7f, 8e0cef6, a145f8c and 8897a6d; fresh clone with no keys replays the full journey with 31/31 real renders.

## Code Tour and App Map

- [ ] Learning activity complete — guided route, focused alternative, prior practice connected, or brief recap
- [ ] Optional edit and transfer reflection addressed — offered/declined/already covered/not applicable as appropriate
- [ ] `devpost/app-map.html` generated from finished code, checked, and shown, including a project-grounded practice to reuse

Activity and evidence: 
Route and stops: 
Edit outcome: 
Reflection: 
Activity mode: 

## Revisions

- OpenAI model is a hardcoded constant (`OPENAI_MODEL` in `lib/openai/model.ts`), not an env var — learner's call at build start. Keys live in `.env` (gitignored), not `.env.local`.
- Point threshold raised from `uiScore < 60` to `< 85`, and points are now derived on every request instead of being stored — the first real run scored visible freckles and under-eye shadows 79-81 and clean areas 96-99, so 60 would have found nothing.
- Masks are inlined as `data:image/png` in the analyze response (YouCam serves them as `binary/octet-stream`, so the type is sniffed from magic bytes); no cross-origin issue remains. Real Skin Analysis + Facial Color Tones latency was about 10s together.
- YouCam Skin Analysis needs the face wider than 60% of the image, so ordinary selfies may fail with "move closer"; the demo photo is cropped to 67%. Slice 5's error copy covers it and Add Photo should hint at filling the frame.
- Skin Analysis layout: the photo keeps the top 58% and the sheet overlaps only its bottom edge (with Continue pinned), because a full-bleed photo hid the face and its highlights under the sheet; masks render as a glowing fill over a light scrim since the soft rose tint was invisible on sparse masks.

- Replay returns the one recorded analysis for any upload and shows the recorded demo face, instead of keying by a hash of the photo — a photo hash would never match a new upload, and showing the recorded face keeps the masks aligned. Renders (slice 2+) are keyed by a hash of their effect list as planned.
- Looks replay uses one fixed fixture (`fixtures/looks.json`) like analyze, since a request hash would never match a new upload; renders are keyed by a hash of their full effect list, so editing constants in `lib/youcam/effects.ts` invalidates recorded renders (re-record after such changes).
- Render route takes `steps` (validated with the zod `StepSchema`) and maps them to YouCam effects on the server, instead of the spec's `effects[]` from the browser — keeps the YouCam schema server-side. On a replay miss it returns the unpainted recorded photo with `placeholder: true` rather than "the closest recorded step".
- Step/Look types are inferred from the zod schema: `pattern` and `corrects` are `null` when absent (Structured Outputs requires every field), and the spec's `texture` is `finish` (mapped per category to YouCam textures). Model is `gpt-5.4-mini`, confirmed available on the learner's key.
- Look plans needed product rules the spec didn't have: a `CORRECTORS` map (only concealer/foundation/highlighter may fix a point), `corrects` became an array so one under-eye concealer can fix dark circles and puffy eyes together, every look must add cheek color and end with lips, and intensities have per-category ranges — the first real plans gamed "corrects" (eyebrows fixing puffy eyes) and rendered layers too faint to see. Renders are re-encoded to JPEG with sharp (2.5MB PNG to about 200KB). Real timings: look plan about 21s, each step render 11-15s.
- A look's grid preview is its last tutorial step (same full effect list, same fixture), so previews cost no extra units beyond the tutorial and need no separate fixtures. The grown card moves to the top of the grid, matching the approved PRD companion page.
- Saved looks embed the whole `Look` plus today's concerns (for the step chips) and a schema version, and reuse the last step image as the preview instead of a separate `preview` Blob — the tutorial replays straight from that record.
- Result-image downloads can exceed the 15s fetch timeout under parallel load (one render timed out mid-download and succeeded on retry); slice 5 gives downloads a longer timeout.
- Unusable-photo handling is verified against the real API (a no-face photo returns `error_no_face`, mapped to its message, 0 units) plus a mapping check of every error class, instead of a committed bad-photo replay fixture — replay serves one fixed analysis for any upload, so a second analyze fixture could not be selected.
