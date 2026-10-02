/* ---------------------------------------------------------------------
   Riverside Speech & Debate — Pickleball Fundraiser signup app
   ---------------------------------------------------------------------
   This is a PROTOTYPE. It stores signups in the visitor's own browser
   (localStorage) so you can click through the whole flow before wiring
   up a real shared backend. See submitToBackend() below and the README
   for how to point this at Formspree or a Google Sheet so every
   visitor's signup lands in one shared place.
   ------------------------------------------------------------------- */

/* -----------------------------------------------------------------
   BACKEND_URL — paste your Google Apps Script Web App URL here once
   it's deployed (see backend/SETUP_BACKEND.md). Until then, this page
   runs in prototype mode: Open Play signups save to your own browser
   only, and the "Up Next" tab shows a notice instead of live courts.
------------------------------------------------------------------ */
const BACKEND_URL = "https://script.google.com/macros/s/AKfycbw-q1Xaoy99-lxBZACSLIquHPA-uLd4TGc_wbP6ess368FLCv0twFo9QOMcBFVoun7FhA/exec";

/* -----------------------------------------------------------------
   BOOSTERHUB_STORE_URL — the public store link for the $30 tournament
   entry product in BoosterHub (Store -> Products -> that product ->
   "View in store" / the public link). Paste it in once it's finalized.
------------------------------------------------------------------ */
const BOOSTERHUB_STORE_URL = "https://rhspeechanddebate.boosterhub.com/store/8518/32079";

const STORAGE_KEY = "rsd-pickleball-signups-v1";

function loadSignups() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : { openplay: [] };
  } catch (e) {
    return { openplay: [] };
  }
}

function saveSignups(data) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (e) {
    /* storage unavailable — prototype still works, just won't persist */
  }
}

let signups = loadSignups();

/* -----------------------------------------------------------------
   submitToBackend — Open Play only. Tournament entry + payment now
   happen entirely in BoosterHub (see BOOSTERHUB_STORE_URL above and
   the "Register & Pay" link in the Tournament tab), so there's no
   tournament form here anymore.
------------------------------------------------------------------ */
function submitToBackend(type, entry) {
  if (!BACKEND_URL) return Promise.resolve({ ok: true });
  return backendPost({ action: "signupOpenPlay", ...entry })
    .catch((err) => {
      console.error("submitToBackend failed", err);
      // Still resolve so the visitor isn't blocked — their entry is saved
      // locally at least, and the organizer can reconcile from the sheet.
      return { ok: false, error: String(err) };
    });
}

/* Wire up the BoosterHub registration link. */
const boosterhubLink = document.getElementById("boosterhubLink");
if (boosterhubLink) {
  if (BOOSTERHUB_STORE_URL) {
    boosterhubLink.href = BOOSTERHUB_STORE_URL;
  } else {
    boosterhubLink.classList.add("disabled");
    boosterhubLink.addEventListener("click", (e) => e.preventDefault());
    boosterhubLink.textContent = "Registration link coming soon";
  }
}

/* -----------------------------------------------------------------
   backendPost — POSTs JSON to the Apps Script Web App.
   Content-Type is deliberately "text/plain" (not application/json):
   that keeps it a "simple request" so the browser skips a CORS
   preflight, which Apps Script Web Apps don't handle.
------------------------------------------------------------------ */
function backendPost(body) {
  return fetch(BACKEND_URL, {
    method: "POST",
    headers: { "Content-Type": "text/plain;charset=utf-8" },
    body: JSON.stringify(body),
  }).then((res) => res.json());
}

function backendGet(action) {
  return fetch(BACKEND_URL + "?action=" + encodeURIComponent(action)).then((res) => res.json());
}

function showToast(message) {
  const toast = document.getElementById("toast");
  toast.textContent = message;
  toast.classList.add("show");
  clearTimeout(showToast._t);
  showToast._t = setTimeout(() => toast.classList.remove("show"), 3200);
}

/* ---------------- Tabs ---------------- */
const tabButtons = document.querySelectorAll(".tab-btn");
const panels = document.querySelectorAll(".panel");

tabButtons.forEach((btn) => {
  btn.addEventListener("click", () => {
    tabButtons.forEach((b) => b.classList.remove("active"));
    panels.forEach((p) => p.classList.remove("active"));
    btn.classList.add("active");
    document.getElementById("panel-" + btn.dataset.tab).classList.add("active");
    if (btn.dataset.tab === "roster") renderRoster();
  });
});

/* ---------------- Roster rendering ---------------- */
function renderRoster() {
  const oList = document.getElementById("openplayList");

  document.getElementById("oCount").textContent = signups.openplay.length;

  // The tournament "paid" count comes from the live backend (it's sourced
  // from the BoosterHub payments the admin has pasted in), not from this
  // browser's local storage — there's no local tournament signup anymore.
  if (BACKEND_URL) {
    backendGet("getState")
      .then((state) => {
        if (state && typeof state.paidTournamentCount === "number") {
          document.getElementById("tCount").textContent = state.paidTournamentCount;
        }
      })
      .catch(() => {});
  }

  oList.innerHTML = signups.openplay.length
    ? signups.openplay.map((s) => `
        <li>
          <span class="who">${escapeHtml(s.firstName)} ${escapeHtml(s.lastName)}</span>
          <span class="meta">${escapeHtml(s.arrival)}${s.guests ? " · with " + escapeHtml(s.guests) : ""} · paying via ${escapeHtml(s.paymentMethod)}</span>
        </li>`).join("")
    : `<li class="empty">No one yet — be the first!</li>`;
}

function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str ?? "";
  return div.innerHTML;
}

/* ---------------- Open play form ---------------- */
document.getElementById("openplayForm").addEventListener("submit", (e) => {
  e.preventDefault();
  const form = e.target;
  const entry = {
    firstName: form.firstName.value.trim(),
    lastName: form.lastName.value.trim(),
    email: form.email.value.trim(),
    phone: form.phone.value.trim(),
    arrival: form.arrival.value,
    guests: form.guests.value.trim(),
    paymentMethod: form.paymentMethod.value,
    submittedAt: new Date().toISOString(),
  };
  if (!entry.firstName || !entry.lastName || !entry.email || !entry.phone || !entry.arrival || !entry.paymentMethod) return;

  submitToBackend("openplay", entry).then(() => {
    signups.openplay.push(entry);
    saveSignups(signups);
    form.reset();
    showToast(`Thanks, ${entry.firstName}! Come rotate in whenever you're ready.`);
    renderRoster();
  });
});

renderRoster();

/* =====================================================================
   UP NEXT BOARD
   ===================================================================== */

const upnextOffline = document.getElementById("upnextOffline");
const upnextNoBracket = document.getElementById("upnextNoBracket");
const upnextChampion = document.getElementById("upnextChampion");
const upnextLive = document.getElementById("upnextLive");
const courtGrid = document.getElementById("courtGrid");
const onDeckList = document.getElementById("onDeckList");
const liveDot = document.getElementById("liveDot");

let pollTimer = null;

function showOnly(el) {
  [upnextOffline, upnextNoBracket, upnextChampion, upnextLive].forEach((e) => {
    if (e) e.hidden = e !== el;
  });
}

function renderUpNext(state) {
  if (!state) return;

  if (!state.bracketGenerated) {
    showOnly(upnextNoBracket);
    liveDot.hidden = true;
    return;
  }

  liveDot.hidden = false;

  if (state.champion) {
    document.getElementById("championName").textContent = state.championLabel || state.champion;
    showOnly(upnextChampion);
    return;
  }

  showOnly(upnextLive);

  courtGrid.innerHTML = state.nowPlaying.length
    ? state.nowPlaying.map((m) => `
        <div class="court-card">
          <div class="court-label">Court ${escapeHtml(String(m.court))}</div>
          <div class="matchup">
            <span>${escapeHtml(m.teamALabel)}</span>
            <span class="vs">vs</span>
            <span>${escapeHtml(m.teamBLabel)}</span>
          </div>
          <div class="report-buttons">
            <button type="button" class="btn-report" data-round="${m.round}" data-slot="${m.slot}" data-side="A">${escapeHtml(m.teamALabel)} won</button>
            <button type="button" class="btn-report" data-round="${m.round}" data-slot="${m.slot}" data-side="B">${escapeHtml(m.teamBLabel)} won</button>
          </div>
        </div>`).join("")
    : `<p class="empty">No matches on courts right now.</p>`;

  onDeckList.innerHTML = state.onDeck.length
    ? state.onDeck.map((m) => `<li><span class="who">${escapeHtml(m.teamALabel)}</span> <span class="vs">vs</span> <span class="who">${escapeHtml(m.teamBLabel)}</span> <span class="meta">waiting for a court</span></li>`).join("")
    : `<li class="empty">Nothing waiting — every match has a court.</li>`;

  courtGrid.querySelectorAll(".btn-report").forEach((btn) => {
    btn.addEventListener("click", () => reportMatchWinner(btn.dataset.round, btn.dataset.slot, btn.dataset.side, btn));
  });
}

function reportMatchWinner(round, slot, side, btnEl) {
  const buttons = btnEl.closest(".court-card").querySelectorAll("button");
  buttons.forEach((b) => (b.disabled = true));
  backendPost({ action: "reportWinner", round: Number(round), slot: Number(slot), side })
    .then((res) => {
      if (!res.ok) {
        showToast(res.error || "Couldn't report that result — try again.");
        buttons.forEach((b) => (b.disabled = false));
        return;
      }
      showToast("Result reported — next match is loading in.");
      pollState();
    })
    .catch(() => {
      showToast("Couldn't reach the server — check your connection and try again.");
      buttons.forEach((b) => (b.disabled = false));
    });
}

function pollState() {
  if (!BACKEND_URL) {
    showOnly(upnextOffline);
    renderTournamentBracket(null);
    return;
  }
  backendGet("getState")
    .then((state) => {
      if (!state.ok && state.ok !== undefined) throw new Error(state.error || "backend error");
      renderUpNext(state);
      renderTournamentBracket(state);
    })
    .catch((err) => {
      console.error("pollState failed", err);
      showOnly(upnextOffline);
    });
}

function startPolling() {
  if (!BACKEND_URL || pollTimer) return;
  pollState();
  pollTimer = setInterval(pollState, 20000);
}

// Poll right away (not just once someone clicks "Up Next") so the Tournament
// tab — the default landing tab — can swap itself over to the live bracket
// the moment the organizer generates it, without anyone needing to go look
// for it on a different tab first.
startPolling();

// If the backend isn't configured yet, show the offline notice immediately
// so neither tab is blank if someone looks before startPolling's first
// response comes back.
if (!BACKEND_URL) { showOnly(upnextOffline); renderTournamentBracket(null); }

/* =====================================================================
   TOURNAMENT BRACKET VIEW
   Replaces the registration content on the Tournament tab once the
   organizer generates the bracket (state.bracketGenerated). Renders every
   round as its own column, left (round 1) to right (final), with "TBD"
   placeholders for later-round matchups that don't exist yet because the
   teams that'll play them haven't been decided — mirrors a normal printed
   bracket instead of just "now playing / on deck".
   ===================================================================== */

const tournamentRegister = document.getElementById("tournamentRegister");
const tournamentBracket = document.getElementById("tournamentBracket");
const bracketRounds = document.getElementById("bracketRounds");
const bracketChampion = document.getElementById("bracketChampion");
const bracketChampionName = document.getElementById("bracketChampionName");
const bracketLiveDot = document.getElementById("bracketLiveDot");

function roundName(roundNum, totalRounds, bracketSize) {
  const fromEnd = totalRounds - roundNum + 1; // 1 = final, 2 = semis, 3 = quarters...
  if (fromEnd === 1) return "Final";
  if (fromEnd === 2) return "Semifinals";
  if (fromEnd === 3) return "Quarterfinals";
  const teamsInRound = bracketSize / Math.pow(2, roundNum - 1);
  return "Round of " + teamsInRound;
}

function renderBracketMatch(m) {
  const resolved = m.status === "done" || m.status === "bye";
  const aWon = resolved && m.winner && m.winner === m.teamA;
  const bWon = resolved && m.winner && m.teamB && m.winner === m.teamB;
  const teamALabel = m.teamALabel || "TBD";
  const teamBLabel = m.teamB ? (m.teamBLabel || "TBD") : (m.status === "bye" ? "— bye —" : "TBD");
  const statusTag =
    m.status === "active" ? `<span class="bracket-status live">Court ${escapeHtml(String(m.court))}</span>`
    : m.status === "done" ? `<span class="bracket-status done">Final</span>`
    : m.status === "bye" ? `<span class="bracket-status bye">Bye</span>`
    : `<span class="bracket-status pending">Waiting</span>`;
  return `<div class="bracket-match">
      <div class="bracket-team${aWon ? " winner" : ""}">${escapeHtml(teamALabel)}</div>
      <div class="bracket-team${bWon ? " winner" : ""}">${escapeHtml(teamBLabel)}</div>
      ${statusTag}
    </div>`;
}

function renderBracketPlaceholder() {
  return `<div class="bracket-match placeholder">
      <div class="bracket-team tbd">TBD</div>
      <div class="bracket-team tbd">TBD</div>
      <span class="bracket-status pending">Waiting</span>
    </div>`;
}

function renderTournamentBracket(state) {
  if (!tournamentBracket || !tournamentRegister) return;

  if (!state || !state.bracketGenerated) {
    tournamentBracket.hidden = true;
    tournamentRegister.hidden = false;
    return;
  }

  tournamentRegister.hidden = true;
  tournamentBracket.hidden = false;
  if (bracketLiveDot) bracketLiveDot.hidden = !!state.champion;

  if (state.champion) {
    bracketChampionName.textContent = state.championLabel || state.champion;
    bracketChampion.hidden = false;
  } else {
    bracketChampion.hidden = true;
  }

  const matches = state.allMatches || [];
  const round1 = matches.filter((m) => m.round === 1);
  const bracketSize = round1.length * 2;

  if (!bracketSize) {
    bracketRounds.innerHTML = `<p class="empty">Bracket is generating…</p>`;
    return;
  }

  const totalRounds = Math.round(Math.log2(bracketSize));
  const byRound = {};
  matches.forEach((m) => {
    (byRound[m.round] = byRound[m.round] || []).push(m);
  });

  let html = "";
  for (let r = 1; r <= totalRounds; r++) {
    const slotsInRound = bracketSize / Math.pow(2, r);
    const existingBySlot = {};
    (byRound[r] || []).forEach((m) => { existingBySlot[m.slot] = m; });
    let roundHtml = "";
    for (let slot = 0; slot < slotsInRound; slot++) {
      const m = existingBySlot[slot];
      roundHtml += m ? renderBracketMatch(m) : renderBracketPlaceholder();
    }
    html += `<div class="bracket-round">
        <h3 class="bracket-round-title">${escapeHtml(roundName(r, totalRounds, bracketSize))}</h3>
        <div class="bracket-matches">${roundHtml}</div>
      </div>`;
  }
  bracketRounds.innerHTML = html;
}

/* -------------------- Admin: generate / reset bracket ------------------- */

const adminToggle = document.getElementById("adminToggle");
const adminPanel = document.getElementById("adminPanel");
const adminKeyInput = document.getElementById("adminKey");

adminToggle.addEventListener("click", () => {
  adminPanel.hidden = !adminPanel.hidden;
});

/* -------------------- Admin: review BoosterHub payments -> teams -------------------- *
   Tournament entry/payment happens entirely in BoosterHub now. To build the
   bracket: the admin pastes the BoosterHub Product Report export into the
   "BoosterHubPayments" tab of the spreadsheet, clicks "Load Payment Review"
   below to fetch one suggested team per paid entry (Player 1 = purchaser,
   Player 2 = the "Partner name" add-on), fixes anything flagged (a shared/
   bundled order, a missing partner name, a proxy purchase like "Payment for
   Anamika"), then confirms — only then does the bracket get built, and only
   from rows that actually show up in a real BoosterHub payment export. That's
   what makes "signed up but didn't pay" impossible to end up in the bracket. */

const reviewPanel = document.getElementById("reviewPanel");
const reviewList = document.getElementById("reviewList");
const reviewPaidCount = document.getElementById("reviewPaidCount");

let reviewTeams = []; // [{ player1, player2, flagged, flags }]

function renderReviewList() {
  reviewList.innerHTML = reviewTeams.length
    ? reviewTeams.map((t, i) => `
        <div class="review-row${t.flagged ? " flagged" : ""}" data-index="${i}">
          <input type="text" class="review-player1" placeholder="Player 1" value="${escapeHtml(t.player1)}" />
          <span class="review-and">&amp;</span>
          <input type="text" class="review-player2" placeholder="Player 2 (or leave blank)" value="${escapeHtml(t.player2)}" />
          <button type="button" class="link-btn review-remove" title="Remove this team">Remove</button>
          ${t.flagged ? `<div class="review-flags">${t.flags.map((f) => `⚠️ ${escapeHtml(f)}`).join("<br>")}</div>` : ""}
        </div>`).join("")
    : `<p class="empty">No paid entries found in the BoosterHubPayments sheet.</p>`;

  reviewList.querySelectorAll(".review-row").forEach((rowEl) => {
    const i = Number(rowEl.dataset.index);
    rowEl.querySelector(".review-player1").addEventListener("input", (e) => { reviewTeams[i].player1 = e.target.value; });
    rowEl.querySelector(".review-player2").addEventListener("input", (e) => { reviewTeams[i].player2 = e.target.value; });
    rowEl.querySelector(".review-remove").addEventListener("click", () => {
      reviewTeams.splice(i, 1);
      renderReviewList();
    });
  });
}

document.getElementById("loadReviewBtn").addEventListener("click", () => {
  if (!BACKEND_URL) { showToast("Backend isn't connected yet."); return; }
  backendPost({ action: "suggestTeams", adminKey: adminKeyInput.value })
    .then((res) => {
      if (!res.ok) { showToast(res.error || "Couldn't load the payment review."); return; }
      reviewTeams = res.suggestions.map((s) => ({ player1: s.player1, player2: s.player2, flagged: s.flagged, flags: s.flags }));
      reviewPaidCount.textContent = res.paidCount;
      reviewPanel.hidden = false;
      renderReviewList();
      if (!res.suggestions.length) {
        showToast("No paid entries found — paste the BoosterHub export into the BoosterHubPayments sheet tab first.");
      } else if (res.suggestions.some((s) => s.flagged)) {
        showToast("Loaded — check the flagged rows before confirming.");
      } else {
        showToast("Loaded — review looks clean.");
      }
    })
    .catch(() => showToast("Couldn't reach the server."));
});

document.getElementById("addTeamRowBtn").addEventListener("click", () => {
  reviewTeams.push({ player1: "", player2: "", flagged: false, flags: [] });
  renderReviewList();
});

document.getElementById("confirmTeamsBtn").addEventListener("click", () => {
  if (!BACKEND_URL) { showToast("Backend isn't connected yet."); return; }
  const teams = reviewTeams
    .map((t) => ({ player1: t.player1.trim(), player2: t.player2.trim() }))
    .filter((t) => t.player1);
  if (!teams.length) { showToast("No teams to generate — load and fill in the review list first."); return; }
  if (!confirm(`Generate the bracket with these ${teams.length} teams? This locks them in and builds the courts.`)) return;
  backendPost({ action: "generateBracket", adminKey: adminKeyInput.value, teams })
    .then((res) => {
      if (!res.ok) { showToast(res.error || "Couldn't generate the bracket."); return; }
      showToast(`Bracket generated — ${res.teamCount} teams, ${res.matchCount} matches.`);
      reviewPanel.hidden = true;
      startPolling();
      pollState();
    })
    .catch(() => showToast("Couldn't reach the server."));
});

document.getElementById("resetBracketBtn").addEventListener("click", () => {
  if (!BACKEND_URL) { showToast("Backend isn't connected yet."); return; }
  if (!confirm("Reset the bracket? This clears all courts/matches (signups are kept).")) return;
  backendPost({ action: "resetBracket", adminKey: adminKeyInput.value })
    .then((res) => {
      if (!res.ok) { showToast(res.error || "Couldn't reset the bracket."); return; }
      showToast("Bracket reset.");
      pollState();
    })
    .catch(() => showToast("Couldn't reach the server."));
});
