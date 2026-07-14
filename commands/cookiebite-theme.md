---
description: Open the cookiebite theme studio (live theme editor)
---
Use the **edit-cookiebite-theme** skill to open the cookiebite theme studio
(`assets/theme-studio.html`) in the browser.

Once it's open, briefly walk the user through the flow: start from a preset, tweak the
accent / neutrals / semantic colors / font / locale in the live preview, then export the
theme and paste it back. The export is a `ThemeDocument` — the same `{ schemaVersion,
seed, … }` object the TSX pipeline expects. Drop it into a report's `<Report theme={…}>`
prop for one report, or save it as your default. Run `/cookiebite-apply` with the pasted
output to have it applied for you.

If the user just wants one of the built-in presets (persimmon, neutral, stripe, vercel,
linear, notion, supabase, sentry, resend, raycast), they don't need the studio at all —
import it from `cookiebite/themes` and pass it to `theme`.
