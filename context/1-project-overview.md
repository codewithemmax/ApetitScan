# Project Overview

ApetitScan is an AI food intelligence platform for African diets. A user photographs a meal. The system identifies the foods, portion, and preparation, estimates carbohydrate exposure as a range, and returns a Meal Impact score (Low / Moderate / High, with a confidence percentage). It then suggests realistic actions instead of telling the user what not to eat.

ApetitScan replaces the earlier PetitScan allergy-scanner concept. Same repo, same stack, same auth and history plumbing. Different product, different claims, different data.

North star: one photo, an honest estimate, one realistic next step, and a question whenever the app is unsure instead of a guess.

## Why this exists
Millions of people make daily food decisions with no easy way to understand the carbohydrate burden of African meals. Existing nutrition apps require manual food search and are built on Western food databases. A phone camera cannot measure blood glucose, so this product does not claim to.


## Core Loop
Scan (photo) → Understand (food ID, portion, preparation) → Estimate (carb exposure) → Explain (Sugar Spoon Index, Meal Impact) → Act (Buffer Engine) → Learn (user corrections are saved)

## Target Users (Hackathon MVP)
* People who want to understand the carbohydrate load of everyday African meals, including households cooking for a family. No user health data is collected and no health condition is assumed.
* Secondary: hackathon judges evaluating problem fit, technical execution, and how carefully the app avoids overclaiming.
* Later, not in this build: nutrition platforms, wellness apps, food companies, and researchers buying the API (Phase 2).

## Core User Flow (MVP)
1. Sign up or log in (Supabase Auth, email + password). This is a real multi-page app: landing, signup, login, home, scan, history, profile are separate routes.
2. Photograph the meal on `/scan`.
3. The vision model identifies each component with a portion guess (Small / Medium / Large) and a preparation guess, each with its own confidence.
4. Every uncertain step becomes a question, not a guess: portion as Small/Medium/Large, preparation as a short multiple choice ("fried or boiled?"). If the dish cannot be identified at all, the app says so and asks the user to name the main carbohydrate.
5. The Nutrition Engine turns confirmed food + preparation + portion into a carbohydrate range using hand-verified food data. The total is shown as a range.
6. The result screen shows the Sugar Spoon Index (a range of spoons), the Meal Impact profile (Low / Moderate / High + confidence %), the main drivers, and the "not a glucose measurement" disclaimer, visible on screen.
7. The app asks "meal already prepared?" and the Buffer Engine returns Prepare / Adjust / Recover actions, ranked by feasibility.
8. Any user correction is saved with the scan. The scan is saved to history automatically, viewable from `/history`.

## What This App Must NOT Claim
* That it measures, predicts, or estimates blood glucose. It estimates carbohydrate exposure only.
* Any diagnosis, disease prediction, or medical advice.
* False precision. Portion uncertain means a range. Food uncertain means ask. Preparation uncertain means disclose it. Every estimate is labeled as an estimate.
* Exact carbohydrate grams, exact food weights, or exact palm-oil quantities from a single image.
* Guaranteed outcomes from a suggestion (for example "this drops your spike by 15%").
* That any food is "bad" or that the user should not eat it.

## Explicitly Do Not Build
Actual glucose measurement, medical diagnosis, disease prediction, exact blood-glucose prediction, exact palm-oil or food-weight measurement from a single image, guaranteed percentage reductions, HMO integration, or a large food database. Any of these appearing in the demo is a credibility risk, not a feature.

## Team and Ownership
* Emmanuel: full stack, backend and frontend, on this repo.
* Teammate(s): TBD, update this section once confirmed.

## Scope for Hackathon Submission (StacStart Borderless Bytes, deadline September 30, 2026; confirm the cutoff time)
* Real signup and login (Supabase Auth) and persistent per-user scan history (already built for PetitScan, reused).
* Camera capture (take or upload) on `/scan`.
* Food recognition for a limited set of Nigerian dishes and foods, backed by a small hand-verified food set.
* Portion estimation as Small / Medium / Large only.
* Preparation detection where reliable, user-confirmed where not.
* Carbohydrate estimate shown as a range, never a single number.
* Sugar Spoon Index visual with its disclaimer on screen.
* Meal Impact score (Low / Moderate / High + confidence %) with the disclaimer on screen.
* Confidence Engine scoring vision, portion, and nutrition separately.
* Buffer Engine (Prepare / Adjust / Recover), gated by "meal already prepared?".
* A correction flow for every uncertain step, with corrections stored.
* The two demo plates working end to end (see Success Criteria).
* Mobile-usable, polished, multi-page flow.

## Out of Scope for Hackathon Submission
* Everything under "Explicitly Do Not Build".
* Cuisines outside Nigeria for the verified food set (Kenya, Uganda, Ghana deferred). The brief says "Nigerian/African"; this build keeps the verified set Nigerian for data quality.
* Payments, premium tiers, household tracking, or any commerce feature (Phase 1 premium is a pitch item only).
* The B2B African Food Intelligence API (Phase 2) and anything healthcare or HMO related (Phase 3). Pitch only for Phase 2; Phase 3 is not part of the hackathon pitch.
* CGM integration. A post-MVP idea, not promised now.
* Retraining or automatically updating the model from corrections. The data flywheel is described in the pitch; the build only stores corrections.
* A large, auto-populated food database. Quality and verification over coverage.

## Business Model (Pitch Only, Staged)
* Phase 1, Consumer: free meal scanning and basic impact estimate. Premium later: history, personalized patterns, household tracking.
* Phase 2, B2B: African Food Intelligence API returning foods, portion estimate, carbohydrate range, impact estimate, confidence, and recommendations as structured JSON.
* Phase 3, Healthcare / HMO: only after validation, published evidence, safeguards, and regulatory review.
* Long-term moat: a structured African food database (food, preparation, ingredients, serving size, macros, GI evidence with its source, confidence score per entry) plus a correction-driven data flywheel.

## Success Criteria
A judge can watch the two demo plates and see the system judge food + preparation + portion + context, not a fixed "this food is bad" list:

1. Plate 1: white rice, fried plantain, stew, chicken. The app identifies each component, shows the carbohydrate load and Meal Impact as High with a visible confidence percentage, and shows the Sugar Spoon Index with its disclaimer on screen. The app asks "meal already prepared?", the user says yes, and the Buffer Engine responds with Adjust actions (reduce rice, add vegetables or protein), not "replace the rice".
2. Plate 2: boiled plantain, vegetables, fish. Shown side by side with plate 1, with a visibly lower impact than plate 1.

At no point does the app claim to measure glucose, promise a percentage reduction, or present an estimate as a fact.
