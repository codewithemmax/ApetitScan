# Progress Tracker

Update this file after every meaningful implementation change.

## Current Phase
* Pre-build: architecture and safety-language rules agreed, no code written yet.

## Current Goal
* Scaffold the repo, stand up the Supabase schema, and get one dish (from `dish_cache`) working end to end: photo in, correct verified flags and questions out.

## Current State (as of this context file's creation)
* App name: not yet finalized (working name used in planning: WetinDey).
* Dish(es) for `dish_cache`: not yet finalized. Egusi soup, jollof rice, and moin moin were discussed as strong candidates (recognizable, real non-obvious allergen risk, genuine household variation).
* Stack decided: Next.js + Tailwind + Supabase + Gemini (primary) + Groq (fallback) + Vercel, all free tier, no card on file.
* Not yet decided: final allergen list beyond the starting examples (lactose, peanut/groundnut, shellfish/crayfish, egg), whether this is a solo build or has a confirmed teammate.

## Completed
* (none yet)

## In Progress
* (not started)

## Next Up
* Finalize app name and the 3-5 dishes for `dish_cache`.
* Scaffold the Next.js repo, set up Supabase project and free-tier Gemini/Groq keys.
* Write the migration for `users`, `allergy_profiles`, `dish_cache`, `dish_ingredients`, `scans`.
* Hand-verify ingredient data for the first cached dish, this is the highest-leverage early task.

## Open Questions
* Final app name.
* Final dish list for the hackathon demo.
* Whether the team is solo or has a confirmed second person, and if so, how work is split (unlike Vouch's frontend/backend split, this repo is full-stack in one place, so any split needs its own convention decided here).

## Architecture Decisions
* (leave blank, fill in as real decisions get made)

## Session Notes
* Target: working end-to-end demo for StacStart's Borderless Bytes hackathon, submission deadline September 28, 2026, 11:59 PM WAT.
* Daily control loop: pull latest, review this file, complete one unit from `7-units.md`, test it against the verification checklist in `5-ai-workflow-rules.md`, commit, update this file with what's next.
