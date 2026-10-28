---
doc: prd
status: approved
---

# GlowApp — Product Requirements

A mobile-first makeup tutor for women who want makeup adapted to their skin without learning technique: it reads her skin today, proposes five looks, and walks her through the chosen one step by step on her own face.
Source: `scope.md > The Unique Kernel`, `scope.md > The Core Loop`.

## The Core Journey
Source: `scope.md > The Core Loop`, `scope.md > What "Working" Looks Like`.

1. She opens GlowApp and sees the **Welcome** screen: a soft, glassy hero visual and a single **Start** button.
2. She taps Start and either **takes a photo** or **uploads one**.
3. GlowApp analyzes the photo and shows the **Skin Analysis**: her skin tone summary and a card for each point found (e.g. pimples, freckles, wrinkles). Tapping a card highlights that spot on her photo.
4. She continues to **Your Looks**: five previews of her own face wearing each look, each labeled with its difficulty (at least one easy, one medium, one difficult).
5. She taps a look. The card grows in place inside the grid into a detail card: the preview and a description. *(Products carousel deferred, see Deferred From the POC.)*
6. She taps **Start makeup** and enters the **Tutorial**: a step wizard on top, her face showing only the layers applied so far, and technique tips below. Every look includes steps that correct the points found today.
7. She moves through the steps by swiping (phone) or with Next / tapping the wizard (desktop).
8. On the **Finish** screen she can **Save** the look or tap **Finish**. *(Stretch: a before/after slider comparing her original photo with the finished look.)*
9. Another day, a subtle icon on the Welcome screen opens her **Saved Looks**, where she can replay a tutorial without spending more credits.

Success: she completed a tutorial built for her face and today's skin.

## Screens and Layout
Mobile-first; also usable in a desktop browser.

1. **Welcome**: hero visual (a close-up half-face with a soft glass filter, or a makeup brush) and a **Start** button. A small, unobtrusive Saved Looks icon in the top-right corner.
2. **Add Photo**: two actions, *Take a photo* and *Upload a picture*.
3. **Skin Analysis**: her photo, a skin tone summary, and cards for each detected point. Tapping a card highlights that point on the photo.
4. **Your Looks**: a two-column grid of five look previews, each with a difficulty signal.
5. **Look Detail** (not a separate screen): the tapped card grows in place to span both columns of the grid. Inside it: the preview with its description beside it, and **Start makeup** below. The other looks stay in the grid below it; tapping another card swaps which one is grown.
6. **Tutorial**: step wizard across the top; her face filling at least half the screen; tips below.
7. **Finish**: **Save** and **Finish** buttons (+ stretch before/after slider).
8. **Saved Looks**: list of saved looks, opened from the Welcome icon.

## Look and Feel
Reference: EONA skincare e-commerce (Behance): https://www.behance.net/gallery/254730259/E-commerce-internet-magazin-dlja-brenda-kosmetiki
Learner direction: premium, "very flashy," glassy ("glass soft filter"), with secondary controls kept very subtle (`scope.md > Inspiration & Identity`). The learner rejected the first palette sketch; the design system below was proposed with the taste skill at the learner's request and is pending their approval.

**Design read:** mobile-first premium-consumer beauty app; glass-over-photo language; her face is always the hero, UI floats on top of it.

**Palette** (one accent, locked everywhere; light default, dark supported):
| Token | Light | Dark | Use |
|---|---|---|---|
| canvas | `#F6F3F5` cool porcelain | `#141116` | app background |
| surface | `#FDFCFD` | `#1D1920` | sheets, cards |
| ink | `#17141A` | `#F4EFF3` | text |
| ink-muted | `#5D5662` | `#B4AAB3` | secondary text |
| primary | gradient `#F6C1D2` → `#FCE3DA` (blush to peach) | same | primary buttons: gradient fill, ink text, white top highlight, soft rose shadow |
| pastel rose (accent) | `#EC94B0` | `#F4B6C9` | all accent uses: icons, links, active wizard step (ink text on it), point rings, difficulty bars |
| blush-wash | `#FBE8EE` | `#33222B` | selected states, chips, face placeholders |
| aurora | blush `#F3C6D3` → peach `#FDE2D6` | same, 40% | soft blurred backdrop behind glass |

Avoid: saturated pink/rose or ink-black buttons (learner rejected both), brown-toned placeholders, beige/cream + brass, purple AI glows, more than one accent.

**Type:** display `Unbounded` (wide, echoes EONA's extended headings), used sparingly for screen titles and the wordmark; UI and body `Geist`. Weight and color carry hierarchy, not size.

**Shape rule:** buttons 8px (learner chose "gradient with squared"), except the Welcome **Start** button, which stays a black (`#17141A`) pill with white text; chips stay pills; cards and photo frames 10px; bottom sheets 14px top corners; product thumbnails 8px. (Learner asked for less rounded corners overall.)

**Materials:** frosted glass (backdrop blur, 1px inner highlight border, tinted soft shadow) only where UI sits over her photo: the step wizard, the tips sheet, the analysis point cards. Solid fallback when transparency is reduced. Everywhere else, solid surfaces.

**Icons:** Hugeicons (MIT), rounded outlines with beauty-specific glyphs like the blush brush; picked by the learner from a 7-set comparison (`devpost/icon-options.html`). Sized up: 24px in lists and cards, 28px for primary actions.

**Difficulty signal:** three ascending bars like phone coverage; filled bars = level (low, medium, high). On look photos: white bars with a soft drop shadow, empty bars fully transparent (only the filled bars show), no chip or glass behind them. On solid surfaces (the grown card's text): pastel rose bars, empty bars in blush-wash.

**Imagery:** Welcome uses soft blush photography with translucent bubbles, close to EONA's mood. Free under the Unsplash License, e.g. https://unsplash.com/photos/water-droplets-on-red-surface-jbHZ6S8AcaA and https://unsplash.com/photos/close-up-photo-of-water-drops-fOXvuWswMDs. Face placeholders (before her photo loads) are light pink, never brown.

**Motion** (each one communicates something; all collapse under reduced motion):
- Analysis: a light sweep scans across her photo while YouCam works (state).
- Point card tap: ring pulse on that spot, once (feedback).
- Look card → detail: the tapped card grows in place within the grid while the others reflow (state transition).
- Tutorial step change: new layer cross-fades onto her face (storytelling, the kernel moment).
- Look generation: skeleton cards in the grid shape, not spinners (loading).
- Buttons: slight press-down on tap (feedback).

## Features and Behavior

### Welcome and Photo Capture
- She can start with one tap and choose either the camera or an existing picture.
  - [ ] Welcome shows the hero visual, a Start button, and a small Saved Looks icon top-right.
  - [ ] Both *Take a photo* and *Upload a picture* lead to analysis with the chosen image.

### Skin Analysis
Source: `scope.md > The POC Boundary` (analysis with concerns highlighted).
- She sees what GlowApp read from her skin today.
  - [ ] Shows a skin tone summary.
  - [ ] Shows one card per point returned by the YouCam skin analysis.
  - [ ] Tapping a card visibly highlights that point's location on her photo.

### Look Proposals
Source: `scope.md > The POC Boundary` (five looks, difficulty tiers).
- She gets five looks personalized to her skin tone and today's points.
  - [ ] Exactly five looks appear, each a preview of *her* face wearing the look.
  - [ ] Each look shows its difficulty as signal bars, like phone coverage: 1 bar low, 2 medium, 3 high. At least one of each appears.
  - [ ] Tapping a look grows that card in place within the grid (no new screen), showing description and Start makeup.


### Step-by-Step Tutorial
Source: `scope.md > The Unique Kernel`.
- She follows the look on her own face, one layer at a time.
  - [ ] Each step shows her photo with only the layers applied up to and including that step.
  - [ ] Each step shows technique tips and tricks (LLM-written) for that step.
  - [ ] When the analysis found points, the tutorial contains steps that correct them, and those steps' tips refer to the point being corrected.
  - [ ] The wizard shows progress and the current step; tapping a wizard step jumps to it.
  - [ ] Phone: swipe moves between steps. Desktop: a Next button moves between steps.

### Finish and Saved Looks
Source: `scope.md > The Core Loop` (save and replay).
- She can keep a look and replay it later.
  - [ ] The Finish screen offers Save and Finish.
  - [ ] A saved look appears in Saved Looks after closing and reopening the app.
  - [ ] Replaying a saved look shows the full tutorial without new YouCam or LLM calls.
  - [ ] *(Stretch)* A before/after slider compares her original photo with the finished look.

## States and Boundaries
- **First use**: Welcome with Start; Saved Looks is empty.
- **Unusable photo** (no face, blurry, too dark): show the reason, using what YouCam's API reports, plus a **Retry** button back to Add Photo.
- **No points found**: no correction steps; she still gets five looks for her skin tone. Defects are not required.
- **YouCam failure or credits exhausted**: a message that the demo has run out of credits and to try later.
- **Saved looks persist** on the device between sessions; there are no accounts.

## Product Decisions
- Minimal Welcome with a single Start — keep the entry basic.
- Look cards show only preview + difficulty; details on tap — keeps the grid clean.
- **Products deferred (decided in `4-spec`):** YouCam's API has no product catalog, so the learner chose to skip products for now rather than build a separate catalog. Each tutorial step still names what it applies (e.g. "Concealer, warm beige").
- Look detail grows inside the grid rather than opening a new screen.
- Difficulty reads like phone signal bars, not text labels.
- Primary buttons: blush-to-peach gradient, 8px corners, ink text (picked from six variants in `devpost/button-options.html`). One pastel rose accent (learner preferred the first rose, "just a bit more pastel"; plum rejected). Cuter, bigger icons: Hugeicons, chosen from a side-by-side of seven sets.
- Correction is automatic: "add the proper steps to correct this defect" — she doesn't choose what to fix.
- Swipe on phone, Next/wizard on desktop — both work.
- Save sits on the Finish screen; Saved Looks entry is "very, very subtle."
- No points is fine — "no need to have defects to use it."
- Out of credits → simple demo message rather than a fallback.
- Before/after slider is stretch: "if you can build it, build it; if not, I'll try it later."

**Assumptions (agent-made, confirm or correct):**
- Analysis and look generation take noticeable time, so each shows a loading state.
- Each Saved Looks entry shows the look's preview, name, and the date it was saved.

## What We're Building
Welcome → photo capture → skin analysis with tappable highlights → five looks with difficulty tiers → look detail growing in the grid → layer-by-layer tutorial with correction steps and tips → Finish with Save → Saved Looks replay. Plus the four states above. Stretch: before/after slider.

## Deferred From the POC
- **Accounts and cloud sync**: saved looks live on one device; no sign-in needed to prove the kernel.
- **Products** (carousel, product modal, store links): YouCam has no product data; adding them later means a small hand-made catalog matched by category and shade hex. Deferred in `4-spec` at the learner's direction.
- **"Use what I own"** (`scope.md > Later`): product inventory and looks built from owned products. Keep the product data shaped so this is a small change later.

## Possible Later Enhancements
- Brush animation on each tutorial step (`scope.md > Later`).
- Affiliate links (Amazon referrals, etc.).
- Before/after slider, if not built as stretch.

## Non-Goals
- Not a skincare treatment or medical advice tool: points are cosmetic, for makeup only.
- No general makeup course: it teaches only *this* look on *this* face.
- No checkout or purchasing inside the app: links go to external stores.

## Open Questions
- **Name for the "points" cards** (the learner wants something fancier than "defects"). Can wait; decide during build.
- ~~Preview cost~~ Answered in `spec.md`: a render costs 1 unit, so five previews cost 5 units per session.
- ~~Unusable-photo errors~~ Answered in `spec.md > Important Failure Modes`.
