# Riverside Speech & Debate — Pickleball Fundraiser Signup

A signup site with three parts — **Tournament Bracket**, **Open Play**, and a live **Up Next** board — plus a "Who's In" roster view.

**Tournament registration and payment happen entirely in BoosterHub**, not on this site — the Tournament tab just links to the $30/player BoosterHub product. That's deliberate: last year's event had people sign up without ever actually paying, so this year the bracket is built directly from BoosterHub's own payment records (see step 3 below), which makes an unpaid entry impossible to end up in it.

Open Play is still a form on this site. Out of the box (before you wire up the backend), Open Play signups save in each visitor's own browser (localStorage) so you can click through the whole thing locally. Once you deploy the backend in step 3, every Open Play signup lands in one shared Google Sheet, and the Up Next tab goes live with real courts, an automated bracket, and honor-system result reporting.

## 1. Try it now

Open `index.html` in a browser (double-click it, or drag it into a browser window). Fill out the Open Play form, then check the "Who's In" tab. (The Tournament tab's "Register & Pay" button won't go anywhere until the BoosterHub product link is added — see step 3.)

## 2. Deploy it on GitHub Pages (free, ~10 minutes)

1. Create a new GitHub repo (public works fine — this has no secrets in it).
2. Upload these four files (`index.html`, `styles.css`, `app.js`, `manifest.json`) to the repo root.
3. In the repo, go to **Settings → Pages**.
4. Under "Build and deployment," set Source to **Deploy from a branch**, branch **main**, folder **/(root)**.
5. Save. GitHub gives you a URL like `https://yourname.github.io/pickleball-signup/` within a minute or two.
6. If you want it on your own domain (e.g. `pickleball.larkinsrestaurants.com` or a page on your existing site), add a `CNAME` file with that domain in the repo, and point a DNS CNAME record at `yourname.github.io`. GitHub's docs walk through this ("Custom domain" under Pages settings) — happy to do this step with you once you know which domain you want to use.

That's genuinely the easy part. GitHub Pages only serves static files, though — it can't run a server to store form submissions. That's what the next section is for.

## 3. Making signups actually shared, and turning on the live Up Next board

This runs on a free **Google Sheet + Apps Script** backend, already built (`backend/Code.gs`). It gives you:

- A live spreadsheet of every open-play signup, no database needed.
- A **Up Next** tab on the page showing which teams are on which court right now, and who's on deck.
- A **payment-verified, semi-automated bracket**: the organizer pastes a BoosterHub payment export into a sheet tab, the page turns it into suggested teams (reviewable/editable before anything's locked in), and only confirmed teams become the bracket — so an unpaid signup can never make it in. See "Tournament entries: BoosterHub, not this form" in the setup guide for the full loop.
- **Skill-based pairing and seeding**: solo registrants (anyone who writes "needs a partner" instead of a real partner name) get auto-paired with another solo player of a similar skill level instead of being matched arbitrarily, and the bracket itself is seeded by skill rather than randomly shuffled, so e.g. two Advanced teams can't land opposite each other in round 1. See "Skill-based pairing & seeding" in the setup guide.
- A fully automated single-elimination bracket once teams are confirmed: matches advance themselves as results come in.
- A **live bracket view**: once the organizer generates the bracket, the Tournament tab swaps itself from the registration page to a full bracket tree — every round, "TBD" placeholders for matchups that haven't been decided yet, and the winner highlighted as results come in. No separate step needed to see it; it updates on its own.
- Honor-system result reporting — whoever's at the court taps "[Team] won" on their phone, no login needed.

Full click-by-click setup, including the BoosterHub product (the $30/player entry fee + "Player's Name" / "Partner name" / "Skill Level" add-ons) and the payment-review workflow, is in **[`backend/SETUP_BACKEND.md`](backend/SETUP_BACKEND.md)** — about 10–15 minutes for the Sheet/Apps Script part, no coding required on your end. Once it's deployed, the two things to set in this project are the `BACKEND_URL` and `BOOSTERHUB_STORE_URL` constants at the top of `app.js`.

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

- `index.html` — the page markup: the BoosterHub registration link, the live bracket view, the Open Play form, the roster view, and the Up Next board
- `styles.css` — all styling
- `app.js` — tab switching, the BoosterHub link, Open Play form handling, roster rendering, the live tournament bracket view, Up Next polling/rendering, and the admin payment-review/generate/reset-bracket controls. `BACKEND_URL` and `BOOSTERHUB_STORE_URL` at the top are the two lines to set once things are deployed.
- `manifest.json` — lets phones add this to the home screen like an app
- `backend/Code.gs` — the Google Apps Script backend (open-play signups, reading the BoosterHub payments export into team suggestions, skill-based pairing, skill-seeded bracket generation, match reporting, live state)
- `backend/SETUP_BACKEND.md` — step-by-step deployment guide for the backend, including the BoosterHub product, the payment-review workflow, and skill-based pairing/seeding
- `backend/boosterhub-live-capture.html` — the optional script pasted into BoosterHub's Webmaster → Scripts field to auto-capture payments the moment they happen, instead of waiting for a CSV export
