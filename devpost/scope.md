---
doc: scope
status: approved
---

# GlowApp

A makeup tutor that reads your skin today and walks you, step by step, through a look rendered on your own face.

## The Unique Kernel
Not "here's you, here's the end result." It's: **this is you, today; these are the products you need; this is the step-by-step tutorial for applying them, tailored to your face and your skin's current state.** Each step shows your own photo with only the layers applied so far (base, then base + eyeliner, ...), plus technique guidance. You get the whole look without investing in learning makeup.

## Who It's For
Women who want good makeup adapted to their skin but don't want to spend time learning makeup technique. Includes days with a pimple or a skin condition, but also everyday use. Today they guess, or watch generic tutorials made for someone else's face.

## The Core Loop
Open the app → upload a current face photo → see the skin analysis (a few concerns highlighted) → get five personalized looks for today, with tones matched to her skin, always including at least one easy, one medium, and one difficult → pick one and see the products it needs → follow the step-by-step tutorial, one rendered layer per step with an LLM-written explanation of the technique, tips, and tricks → optionally save it as a favorite.
She comes back because her skin changes day to day, and saved looks can be replayed without regenerating.

## Inspiration & Identity
Target competition: YouCam API Skin AI & eCommerce VTO Hackathon (Skin AI track): https://youcam-api-skin-ai-ecommerce.devpost.com/
Learner wants it "very flashy," with real chances to win.
Mobile-first. The tutorial screen has a step wizard across the top, her face filling at least half the screen ("you have to see what to do"), and the tips below. "I think it will look incredible." Judging: technical implementation, design ("a complete, coherent product experience"), potential impact, and quality of idea ("not surface-level wrappers").

## Why This Matters to the Learner
"I want to create a very flashy product that has real chances to win."

## What "Working" Looks Like
Demo with a face photo: upload → a couple of skin concerns highlighted on her face → personalized makeup looks designed for her → select one → all its products shown → tutorial phase, step by step, each step her own face with that layer applied plus technique text → save as a preferred look to replicate later.
The "oh, that's cool" beat: the tutorial building up layer by layer on *her* face, adapted to *today's* skin.

## The POC Boundary
- Face photo upload
- YouCam Skin AI analysis, with concerns highlighted on the photo
- Five personalized looks for today (skin tone + current concerns), labeled by difficulty: always at least one easy, one medium, one difficult, plus two more
- Product list per look, with plain product links (no affiliate)
- Step-by-step tutorial: per-step render of the cumulative layers on her photo + LLM technique explanation
- Save a look as a favorite, replayable without spending more API credits

Constraints: about 3 days; 1,000 free YouCam API units; keep Claude usage costs reasonable (well under €1,000). Rendering cost per step must be budgeted (e.g. render only the chosen look). Open for the spec: whether each of the five proposals gets its own preview render, or only the chosen look is rendered.

## Later
- **"Use what I own"**: user lists her products; some proposals (e.g. 2 of 5) use them. Shape the data model/API now so adding this later isn't a big change.
- **Brush animation** on each step: standalone feature, easy to add later.
- Affiliate links (Amazon referrals, etc.).

## Explicitly Cut
Nothing cut outright.

## Notes
- Demo photo must be one the learner has rights to (own face, friend with consent, licensed stock, or AI-generated). YouCam rules forbid third-party copyrighted material.
- Learner plans to build with their own agent loop (Sonnet coding, Opus orchestration/validation); see learner profile.
