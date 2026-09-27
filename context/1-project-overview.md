# Project Overview

[App Name TBD] identifies a photographed Nigerian dish and flags which of the user's known allergens are commonly, sometimes, or not typically found in that dish, then generates a plain-language question the user can ask whoever cooked it.

North star: one photo, one dish, a clear set of questions worth asking before eating something that could hurt someone.

## Why this exists
Existing food-allergen apps (Yuka, Intol, EatSafe, and similar) all read a barcode and a printed ingredient label. That doesn't work for food eaten in Nigeria: home-cooked meals, restaurant and buka plates, roadside food, none of it packaged or labeled. This app is built for that gap specifically.

## Target Users (Hackathon MVP)
* Anyone managing a food allergy or intolerance (starting examples used in planning: lactose, peanut/groundnut, shellfish/crayfish, egg) eating unlabeled, unpackaged Nigerian food.
* Secondary: hackathon judges evaluating problem fit and technical execution for the Access & Inclusion track.

## Core User Flow
1. Select or create an allergy profile (fixed demo profiles for the hackathon, no full auth required).
2. Photograph the dish.
3. App identifies the dish: checks `dish_cache` first, falls back to live LLM reasoning if not found.
4. Flagged allergens are shown, tiered (always / commonly / sometimes) and labeled by source (Verified / Estimated).
5. Each flag comes with a plain-language question to ask the cook.

## What This App Must NOT Claim
* That a dish "is safe" or "does not contain" an allergen, ever. Absence in the cache is not proof of absence in a specific plate.
* Any medical or diagnostic claim (this is not a substitute for a doctor, an allergist, or reading a real label when one exists).
* Certainty for LLM-fallback results. These are estimates, and must read as estimates.

## Team and Ownership
* Emmanuel: full stack, backend and frontend, on this repo.
* Teammate(s): TBD, update this section once confirmed.

## Scope for Hackathon Submission (Borderless Bytes, deadline September 28, 2026, 11:59 PM WAT)
* At least 3-5 dishes hand-verified and present in `dish_cache`, with real, checked ingredient/allergen data.
* Live demo works end-to-end only on cached, verified dishes.
* LLM fallback exists, is tested privately, and is discussed in the pitch as the path to covering "any Nigerian dish," but is not relied on live.
* Allergen flagging, tiering, and the "ask the cook" question generator all work.
* Mobile-usable, single clear flow, no login friction for the demo.

## Out of Scope for Hackathon Submission
* Full user accounts / authentication.
* Cuisines outside Nigeria (Kenya, Uganda, Ghana explicitly deferred, even though the hackathon spans all four countries).
* Payments, monetization, or any commerce feature.
* Any feature that reads as a medical or diagnostic claim.
* A large, auto-populated `dish_cache`. Quality and verification over coverage for the demo.

## Success Criteria
A judge can watch someone photograph a real, verified dish, see it correctly identified, see accurate allergen flags with the right tier and source label, and see a usable "ask the cook" question, all without the app ever claiming certainty it doesn't have.
