/* ---------------------------------------------------------------------
   Riverside Speech & Debate — Pickleball Fundraiser signup app
   ---------------------------------------------------------------------
   This is a PROTOTYPE. It stores signups in the visitor's own browser
   (localStorage) so you can click through the whole flow before wiring
   up a real shared backend. See submitToBackend() below and the README
   for how to point this at Formspree or a Google Sheet so every
   visitor's signup lands in one shared place.
   ------------------------------------------------------------------- */

const STORAGE_KEY = "rsd-pickleball-signups-v1";

function loadSignups() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : { tournament: [], openplay: [] };
  } catch (e) {
    return { tournament: [], openplay: [] };
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
   submitToBackend — THE ONE FUNCTION TO REPLACE FOR PRODUCTION
   -----------------------------------------------------------------
   Right now this just resolves immediately and saves locally.
   To collect real signups when this is deployed on GitHub Pages,
   swap the body of this function for a fetch() to Formspree,
   a Google Apps Script web app, or Airtable. Example (Formspree):

     return fetch("https://formspree.io/f/YOUR_FORM_ID", {
       method: "POST",
       headers: { "Accept": "application/json" },
       body: new FormData(formEl)
     });

   See README.md for step-by-step options.
------------------------------------------------------------------ */
function submitToBackend(type, entry) {
  return Promise.resolve({ ok: true });
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
  const tList = document.getElementById("tournamentList");
  const oList = document.getElementById("openplayList");

  document.getElementById("tCount").textContent = signups.tournament.length;
  document.getElementById("oCount").textContent = signups.openplay.length;

  tList.innerHTML = signups.tournament.length
    ? signups.tournament.map((s) => `
        <li>
          <span class="who">${escapeHtml(s.name)}${s.partner ? " &amp; " + escapeHtml(s.partner) : ""}</span>
          <span class="meta">${escapeHtml(s.skill)}${s.needPartner ? " · needs a partner" : ""}</span>
        </li>`).join("")
    : `<li class="empty">No one yet — be the first!</li>`;

  oList.innerHTML = signups.openplay.length
    ? signups.openplay.map((s) => `
        <li>
          <span class="who">${escapeHtml(s.name)}</span>
          <span class="meta">${escapeHtml(s.arrival)}${s.guests ? " · with " + escapeHtml(s.guests) : ""}</span>
        </li>`).join("")
    : `<li class="empty">No one yet — be the first!</li>`;
}

function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str ?? "";
  return div.innerHTML;
}

/* ---------------- Tournament form ---------------- */
document.getElementById("tournamentForm").addEventListener("submit", (e) => {
  e.preventDefault();
  const form = e.target;
  const entry = {
    name: form.name.value.trim(),
    email: form.email.value.trim(),
    phone: form.phone.value.trim(),
    skill: form.skill.value,
    partner: form.partner.value.trim(),
    needPartner: form.needPartner.checked,
    notes: form.notes.value.trim(),
    submittedAt: new Date().toISOString(),
  };
  if (!entry.name || !entry.email || !entry.phone || !entry.skill) return;

  submitToBackend("tournament", entry).then(() => {
    signups.tournament.push(entry);
    saveSignups(signups);
    form.reset();
    showToast(`You're in, ${entry.name.split(" ")[0]}! See you on the courts.`);
    renderRoster();
  });
});

/* ---------------- Open play form ---------------- */
document.getElementById("openplayForm").addEventListener("submit", (e) => {
  e.preventDefault();
  const form = e.target;
  const entry = {
    name: form.name.value.trim(),
    email: form.email.value.trim(),
    phone: form.phone.value.trim(),
    arrival: form.arrival.value,
    guests: form.guests.value.trim(),
    submittedAt: new Date().toISOString(),
  };
  if (!entry.name || !entry.email || !entry.phone || !entry.arrival) return;

  submitToBackend("openplay", entry).then(() => {
    signups.openplay.push(entry);
    saveSignups(signups);
    form.reset();
    showToast(`Thanks, ${entry.name.split(" ")[0]}! Come rotate in whenever you're ready.`);
    renderRoster();
  });
});

renderRoster();
