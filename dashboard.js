/* =========================
   SmartSeva – User Dashboard JS
   ========================= */

/**
 * Base URL of your backend API.
 * Change this to your Spring/Django/Node server.
 */
const API_BASE_URL = "http://localhost:8080/api";   // <-- update as needed

/**
 * Key name used in login/signup pages.
 * We already stored user JSON as:
 *   localStorage.setItem("smartseva_user", JSON.stringify(payload));
 */
const USER_STORAGE_KEY = "smartseva_user";

/* ---------- Helpers ---------- */

/** Get currently logged-in user from localStorage. */
function getCurrentUser() {
  const raw = localStorage.getItem(USER_STORAGE_KEY);
  if (!raw) return null;

  try {
    return JSON.parse(raw);
  } catch (e) {
    console.error("Invalid user JSON in localStorage", e);
    return null;
  }
}

/** If user not logged in → send back to login page. */
function requireLogin() {
  const user = getCurrentUser();
  if (!user) {
    window.location.href = "login.html";
    return null;
  }
  return user;
}

/** Small util to format dates nicely. */
function formatDate(isoString) {
  if (!isoString) return "";
  const d = new Date(isoString);
  return d.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric"
  });
}

/* ---------- API calls (no DB, only fetch) ---------- */

/**
 * Fetch complaints belonging to the current user.
 * Adjust the URL and headers to match your backend.
 *
 * Recommended backend endpoint:
 *   GET /api/complaints/my
 *   - Auth token in Authorization header (for Google/local login)
 *
 * Example response (array):
 * [
 *   {
 *     "id": 123,
 *     "title": "Street light not working",
 *     "category": "Electricity",
 *     "status": "RAISED",          // or IN_PROGRESS / RESOLVED
 *     "priority": "HIGH",
 *     "createdAt": "2025-11-18T06:40:00Z",
 *     "updatedAt": "2025-11-18T07:10:00Z",
 *     "ticketId": "SS-2025-000123"
 *   }
 * ]
 */
async function fetchUserComplaints(user) {
  const headers = {
    "Content-Type": "application/json"
  };

  // If you are using JWT / Google token for auth:
  if (user.provider === "google" && user.id_token) {
    headers["Authorization"] = "Bearer " + user.id_token;
  }

  // If you authenticate by email/session cookie instead, you can
  // send email as a query param or header. Example:
  if (user.provider === "local" && user.email) {
    headers["X-User-Email"] = user.email; // OPTIONAL – use only if your backend expects it
  }

  // 👉 Change URL to match your backend
  const url = `${API_BASE_URL}/complaints/my`;

  const res = await fetch(url, { headers, credentials: "include" });
  if (!res.ok) {
    throw new Error(`Failed to fetch complaints: ${res.status}`);
  }

  return res.json();
}

/* ---------- Rendering ---------- */

/** Create a single complaint card HTML. */
function renderComplaintCard(complaint) {
  const {
    ticketId,
    title,
    category,
    status,
    priority,
    createdAt,
    updatedAt
  } = complaint;

  const statusLabel = (status || "").replace("_", " ");
  const created = formatDate(createdAt);
  const updated = formatDate(updatedAt);

  return `
    <div class="card shadow-sm mb-3 border-0 rounded-3">
      <div class="card-body p-3">
        <div class="d-flex justify-content-between align-items-start mb-1">
          <div>
            <div class="small text-muted">Ticket ID</div>
            <div class="fw-semibold">${ticketId || "-"}</div>
          </div>
          <span class="badge text-bg-light border">
            ${statusLabel}
          </span>
        </div>

        <h6 class="mb-1">${title || "Complaint"}</h6>
        <p class="small text-muted mb-2">
          Category: <span class="fw-semibold">${category || "-"}</span>
        </p>

        <div class="d-flex justify-content-between align-items-center small text-muted">
          <span>Priority: <span class="fw-semibold">${priority || "NORMAL"}</span></span>
          <span>
            Created: ${created}
            ${updated ? ` · Updated: ${updated}` : ""}
          </span>
        </div>
      </div>
    </div>
  `;
}

/**
 * Render all complaints into the 3 sections:
 *   - RAISED / NEW
 *   - IN_PROGRESS
 *   - RESOLVED
 */
function renderDashboard(complaints) {
  const raisedContainer      = document.getElementById("raisedList");
  const inProgressContainer  = document.getElementById("inProgressList");
  const resolvedContainer    = document.getElementById("resolvedList");

  const raisedCountEl        = document.getElementById("raisedCount");
  const inProgressCountEl    = document.getElementById("inProgressCount");
  const resolvedCountEl      = document.getElementById("resolvedCount");

  if (!raisedContainer || !inProgressContainer || !resolvedContainer) {
    console.warn("Dashboard containers missing in HTML");
    return;
  }

  // Clear old
  raisedContainer.innerHTML     = "";
  inProgressContainer.innerHTML = "";
  resolvedContainer.innerHTML   = "";

  // Simple status mapping
  complaints.forEach(c => {
    const status = (c.status || "").toUpperCase();

    if (status === "RESOLVED" || status === "CLOSED") {
      resolvedContainer.innerHTML += renderComplaintCard(c);
    } else if (status === "IN_PROGRESS" || status === "UNDER_REVIEW") {
      inProgressContainer.innerHTML += renderComplaintCard(c);
    } else {
      // default → Raised / New
      raisedContainer.innerHTML += renderComplaintCard(c);
    }
  });

  // Update counters
  if (raisedCountEl) {
    raisedCountEl.textContent = raisedContainer.children.length;
  }
  if (inProgressCountEl) {
    inProgressCountEl.textContent = inProgressContainer.children.length;
  }
  if (resolvedCountEl) {
    resolvedCountEl.textContent = resolvedContainer.children.length;
  }

  // If any section empty, show a friendly message
  [ [raisedContainer, "No complaints raised yet."],
    [inProgressContainer, "No complaints currently in progress."],
    [resolvedContainer, "No complaints resolved yet."] ]
    .forEach(([el, msg]) => {
      if (el && !el.innerHTML.trim()) {
        el.innerHTML = `<p class="text-muted small mb-0">${msg}</p>`;
      }
    });
}

/* ---------- Main loader ---------- */

async function initDashboard() {
  const user = requireLogin(); // redirects if not logged in
  if (!user) return;

  // Put user name/email somewhere in UI
  const userNameLabel = document.getElementById("userNameLabel");
  if (userNameLabel) {
    userNameLabel.textContent = user.name || user.email || "SmartSeva User";
  }

  const loadingEl = document.getElementById("complaintsLoading");
  const errorEl   = document.getElementById("complaintsError");

  if (loadingEl) loadingEl.classList.remove("d-none");
  if (errorEl)   errorEl.classList.add("d-none");

  try {
    const complaints = await fetchUserComplaints(user);
    renderDashboard(complaints || []);
  } catch (err) {
    console.error(err);
    if (errorEl) {
      errorEl.textContent = "Could not load your complaints. Please try again.";
      errorEl.classList.remove("d-none");
    }
  } finally {
    if (loadingEl) loadingEl.classList.add("d-none");
  }
}

/* Run when dashboard page is loaded */
document.addEventListener("DOMContentLoaded", initDashboard);