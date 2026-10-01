# Riverside Speech & Debate — Pickleball Fundraiser Signup

A prototype signup site with two paths — **Tournament Bracket** and **Open Play** — plus a "Who's In" roster view. Right now signups are saved in each visitor's own browser (localStorage) so you can click through the whole thing. Before the real event, swap in one of the backend options below so every visitor's signup lands in one shared place.

## 1. Try it now

Open `index.html` in a browser (double-click it, or drag it into a browser window). Fill out both forms, then check the "Who's In" tab.

## 2. Deploy it on GitHub Pages (free, ~10 minutes)

1. Create a new GitHub repo (public works fine — this has no secrets in it).
2. Upload these four files (`index.html`, `styles.css`, `app.js`, `manifest.json`) to the repo root.
3. In the repo, go to **Settings → Pages**.
4. Under "Build and deployment," set Source to **Deploy from a branch**, branch **main**, folder **/(root)**.
5. Save. GitHub gives you a URL like `https://yourname.github.io/pickleball-signup/` within a minute or two.
6. If you want it on your own domain (e.g. `pickleball.larkinsrestaurants.com` or a page on your existing site), add a `CNAME` file with that domain in the repo, and point a DNS CNAME record at `yourname.github.io`. GitHub's docs walk through this ("Custom domain" under Pages settings) — happy to do this step with you once you know which domain you want to use.

That's genuinely the easy part. GitHub Pages only serves static files, though — it can't run a server to store form submissions. That's what the next section is for.

## 3. Making signups actually shared (pick one)

Right now `app.js` has a single function, `submitToBackend()`, that's the one place to change. Three options, easiest first:

**Formspree (simplest, free tier)** — Sign up at formspree.io, create a form, and it gives you an endpoint URL. Replace `submitToBackend()` with a `fetch()` POST to that URL (there's a commented example already in the code). Every submission shows up in the Formspree dashboard and can email you. No database, no code beyond that one function.

**Google Sheet + Apps Script** — Slightly more setup, but you get a live spreadsheet of signups you can sort/filter, and it's free. Create a Sheet, add a small Apps Script "web app" that appends a row on each POST, and point `submitToBackend()` at that script's URL. I can build this out with you if you want it — just say the word.

**Airtable / a small database** — Overkill for a one-day fundraiser, but worth it if you go the "pickup games site" route below, since you'll want real accounts and search eventually.

For a single fundraiser, Formspree is the right amount of effort.

## 4. Do you need to put this in the App Store?

No. This is a website, not a native app, so there's nothing to submit to Apple or Google, no developer account fee, and no review wait. `manifest.json` is already in place so a visitor can tap "Add to Home Screen" on their phone and it'll behave like an app icon — that's the practical middle ground between "just a webpage" and "a real app," and it costs you nothing extra.

## 5. Turning this into a pickup-games / court-finder site later

The bones for that are already here — the "Who's In" roster is basically a stripped-down version of "who wants to play right now." Turning it into an ongoing pickup-games and court-finder site is a real step up in scope, though, not a small tweak:

- **Real accounts.** Right now anyone can type any name. A pickup site needs login (even something lightweight) so people are accountable and can see their own history.
- **A real database**, not localStorage — this is where Airtable, Supabase, or Firebase come in.
- **Recurring events instead of one date** — courts, days/times, and open slots that reset every week.
- **Location/court data** — either you maintain a list of local courts, or pull from something like a public parks-and-rec dataset.
- **Notifications** — "a 4th player is needed at Cleveland Park at 6pm Thursday" is the kind of feature that makes a pickup site actually useful, and it needs some kind of email/text integration.

None of that is out of reach, but I'd treat it as its own project once the fundraiser's behind you — the two don't need to be built at the same time, and starting simple (this prototype) is the right move for the event itself.

## Files

- `index.html` — the page markup and both forms
- `styles.css` — all styling
- `app.js` — tab switching, form handling, roster rendering, and the one function to replace for a real backend
- `manifest.json` — lets phones add this to the home screen like an app
