# GlowApp

GlowApp reads your skin today, designs six makeup looks for it, and teaches the one you pick step by step, on your own face. Each step shows your photo with only the layers applied so far, plus a tip written for your skin today.

Built for the [YouCam API Skin AI & eCommerce VTO Hackathon](https://youcam-api-skin-ai-ecommerce.devpost.com/) (Skin AI track).

## Try it in 2 minutes, no keys needed

The repo ships with recorded API responses, so the whole journey runs offline in **replay** mode.

```bash
npm install
npm run dev
```

1. Open http://localhost:3000. Use your browser's phone view (DevTools, device toolbar), because GlowApp is mobile-first.
2. Tap **Start**, then upload any photo. Replay always shows the recorded demo face so the skin masks line up.
3. Tap a card on **Your skin today** to see that area glow on the face, then **Continue**.
4. Pick one of the six looks, tap **Start makeup**, and walk the layers. Swipe, use Next, tap the step bar, or press the arrow keys.
5. On **Finish**, compare before and after, then **Save look**. Reopen it later from the bookmark icon on the welcome screen. Saved looks replay offline.

If port 3000 is busy, run `npm run dev -- -p 3100`.

## Run it against the real APIs

```bash
cp .env.example .env
```

Fill in `.env`:

| Variable | What it does |
|---|---|
| `API_MODE` | `replay` (default): answers from `fixtures/`, no keys, 0 units. `live`: real calls. `record`: real calls, saved to `fixtures/` |
| `YOUCAM_API_KEY` | YouCam API key, from the [YouCam API console](https://yce.makeupar.com/api-console/en/api-keys/) |
| `OPENAI_API_KEY` | OpenAI key for the look planner |

The OpenAI model is set in `lib/openai/model.ts`.

Live tips:
- **Fill the frame.** YouCam Skin Analysis needs the face to be wider than 60% of the photo. Front-facing, soft even light.
- **It takes a moment.** The skin read takes about 10 seconds, the six looks about 20, and each layer about 12. Step 1 shows first while the rest paint.
- **Cost per first session:** about 44 YouCam units (12 skin analysis, 20 skin tone, 6 look previews, about 6 tutorial layers). Your skin tone is cached on the device, so later sessions skip the 20-unit tone call. Tasks YouCam rejects (no face, too dark) cost nothing; a render that succeeds but then fails to download has already used its unit, and Retry uses another.

## How it uses the YouCam API

| YouCam API | Used for |
|---|---|
| [AI Skin Analysis](https://docs.perfectcorp.com/reference/description/ai_skin_analysis.md) | Today's skin read: blemishes, redness, dark circles, spots, shine and puffy eyes, with a mask per concern that GlowApp lights up on your face |
| [AI Facial Color Tones](https://docs.perfectcorp.com/reference/description/ai_face_tone_analyzer.md) | Your exact skin, lip and brow colors, which the look planner matches shades to |
| [AI Makeup Virtual Try-On](https://docs.perfectcorp.com/reference/description/ai_makeup_vto.md) | Every look preview, and every tutorial step: steps 1 to N painted cumulatively on your photo |

OpenAI turns the skin read into six looks as strict JSON. Each look has a difficulty (low, medium, high), ordered steps with YouCam pattern names and colors, and a tip for every step. A validator makes sure every concern found today gets a step that actually fixes it, for example concealer for dark circles and never eyebrows.

## How it's built

- **Stack:** Next.js 16 (App Router) with TypeScript, Tailwind CSS v4, Motion, Hugeicons, the OpenAI SDK with zod, and idb-keyval.
- **Three server routes** hold the keys and do the talking:
  - `app/api/analyze`: upload, Skin Analysis and Facial Color Tones.
  - `app/api/looks`: OpenAI look plan.
  - `app/api/render`: Makeup VTO, returned as an inline JPEG so it never expires.
- **Replay layer:** `lib/replay.ts` switches every provider call between replay, record and live.
- **Storage:** saved looks live on your device in IndexedDB. There are no accounts.

```
app/        screens (/, /photo, /analysis, /looks, /tutorial, /saved) and api/ routes
components/ glass sheets, step wizard, look cards, signal bars, finish view
lib/        youcam/ client, effects and errors; openai/ planner; replay, session, saved looks
fixtures/   recorded responses for replay mode
devpost/    planning documents (scope, PRD, spec, build checklist)
```

## Credits

- **Demo face:** photo from [Unsplash](https://unsplash.com/photos/womans-face-EGVccebWodM), free under the Unsplash License.
- **Welcome image:** [blush bubbles](https://unsplash.com/photos/water-droplets-on-red-surface-jbHZ6S8AcaA) from Unsplash, free under the Unsplash License.
- **Icons:** [Hugeicons](https://hugeicons.com) free set (MIT).
- **Fonts:** Unbounded and Geist (SIL Open Font License), via `next/font`.
