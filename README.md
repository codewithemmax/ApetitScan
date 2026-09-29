# ApetitScan

ApetitScan is a Next.js and Supabase app for honest meal context. The planned MVP identifies foods, portion, and preparation from a meal photo, asks when uncertain, and estimates carbohydrate exposure as a range from hand-verified data.

## Stack

- Next.js App Router and Tailwind CSS
- Supabase Auth and Postgres
- Gemini with Groq fallback for food identification
- Vercel Hobby

## Development

Run npm install, then npm run dev.

Set the Supabase and server-side provider variables from .env.example in a local .env.local. Never expose provider keys or the Supabase service role key to the browser.

The implementation plan and safety rules are in context/1-project-overview.md through context/7-units.md. Work proceeds one unit at a time.