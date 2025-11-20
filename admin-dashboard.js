// admin-dashboard.js
(function () {
  const INACTIVITY_LIMIT_MS = 30 * 60 * 1000; // 30 min
  let complaints = []; // in-memory list

  // ===== 1. Auth gate (role + timeout) =====
  function requireAdminAuth() {
    const raw = localStorage.getItem("smartseva_admin");
    if (!raw) {
      window.location.href = "adminlogin.html";
      return null;
    }

    try {
      const admin = JSON.parse(raw);

      if (admin.expiresAt && Date.now() > admin.expiresAt) {
        localStorage.removeItem("smartseva_admin");
        alert("Admin session expired. Please login again.");
        window.location.href = "adminlogin.html";
        return null;
      }

      if (!admin.geid || admin.role !== "gov_admin") {
        window.location.href = "adminlogin.html";
        return null;
      }

      return admin;
    } catch (e) {
      localStorage.removeItem("smartseva_admin");
      window.location.href = "adminlogin.html";
      return null;
    }
  }

  // ===== 2. Activity logs =====
  function logAdminActivity(action, meta = {}) {
    try {
      const raw = localStorage.getItem("smartseva_admin_logs");
      const logs = raw ? JSON.parse(raw) : [];
      logs.push({
        at: new Date().toISOString(),
        action,
        meta
      });
      localStorage.setItem("smartseva_admin_logs", JSON.stringify(logs));
    } catch (e) {
      console.warn("Could not write admin logs", e);
    }
  }

  // ===== 3. Fetch complaints =====
  async function fetchComplaintsFromServer() {
    // 🔥  First: try localStorage (data from raise.html)
    try {
      const local = JSON.parse(localStorage.getItem("smartseva_complaints") || "[]");
      if (local.length) return local;
    } catch (e) {
      console.warn("Could not read local complaints", e);
    }

    // 👉 If no local data, use backend (when ready) or demo data
    try {
      const res = await fetch("/api/admin/complaints", {
        headers: { "Content-Type": "application/json" }
      });
      if (!res.ok) throw new Error("API error " + res.status);
      return await res.json();
    } catch (err) {
      console.error("Fetch complaints failed, using demo data.", err);
      return [
        {
          id: 1,
          token: "SV-2025-0001",
          citizenName: "Ravi Kumar",
          category: "Garbage",
          location: "Ward 12, Near Bus Stop",
          severity: "High",
          raisedAt: "2025-11-10T09:30:00Z",
          status: "pending",
          description: "Overflowing garbage pile blocking footpath for 3 days.",
          imageData: null
        }
      ];
    }
  }

  // ===== 4. Update status (server placeholder) =====
  async function updateComplaintStatusOnServer(id, newStatus) {
    try {
      const res = await fetch(`/api/admin/complaints/${id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus })
      });
      if (!res.ok) throw new Error("Status update failed: " + res.status);
      return true;
    } catch (err) {
      console.warn("Status API not wired, mocking success.", err);
      return true;
    }
  }

  // ===== 5. Helpers =====
  function formatDate(iso) {
    if (!iso) return "-";
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return iso;
    return d.toLocaleString();
  }

  function statusClass(status) {
    switch (status) {
      case "pending":  return "status-pill status-pending";
      case "approved": return "status-pill status-approved";
      case "sent":     return "status-pill status-sent";
      case "rejected": return "status-pill status-rejected";
      default:         return "status-pill status-pending";
    }
  }

  function renderStats() {
    const sent     = complaints.filter(c => c.status === "sent").length;
    const rejected = complaints.filter(c => c.status === "rejected").length;

    const sentEl = document.getElementById("statSent");
    const rejEl  = document.getElementById("statRejected");

    if (sentEl) sentEl.textContent = sent;
    if (rejEl)  rejEl.textContent  = rejected;
  }

  function renderTable() {
    const tbody = document.getElementById("complaintsBody");
    if (!tbody) return;

    const filterEl = document.getElementById("statusFilter");
    const filter = filterEl ? filterEl.value : "all";

    let list = complaints;
    if (filter !== "all") {
      list = complaints.filter(c => c.status === filter);
    }

    tbody.innerHTML = "";

    if (!list.length) {
      tbody.innerHTML = `
        <tr>
          <td colspan="8" class="text-center text-muted py-4 small">
            No complaints found for this filter.
          </td>
        </tr>`;
      return;
    }

    for (const c of list) {
      const tr = document.createElement("tr");
      tr.dataset.id = c.id;

      tr.innerHTML = `
        <td>${c.token || "-"}</td>
        <td>${c.citizenName || "-"}</td>
        <td>${c.category || "-"}</td>
        <td>${c.location || "-"}</td>
        <td>${c.severity || "-"}</td>
        <td>${formatDate(c.raisedAt)}</td>
        <td><span class="${statusClass(c.status)}">${c.status}</span></td>
        <td class="text-end">
          <button class="btn btn-outline-secondary btn-action btn-sm me-1" data-action="view">
            <i class="bi bi-eye"></i>
          </button>
          <button class="btn btn-outline-success btn-action btn-sm me-1" data-action="approve">
            Approve
          </button>
          <button class="btn btn-outline-primary btn-action btn-sm me-1" data-action="send">
            Send
          </button>
          <button class="btn btn-outline-danger btn-action btn-sm" data-action="reject">
            Reject
          </button>
        </td>
      `;
      tbody.appendChild(tr);
    }
  }

  // ===== 6. Detail modal (with image) =====
  function openDetailModal(complaint) {
    if (!complaint) return;

    document.getElementById("detailToken").textContent       = complaint.token || "-";
    document.getElementById("detailCitizen").textContent     = complaint.citizenName || "-";
    document.getElementById("detailCategory").textContent    = complaint.category || "-";
    document.getElementById("detailLocation").textContent    = complaint.location || "-";
    document.getElementById("detailSeverity").textContent    = complaint.severity || "-";
    document.getElementById("detailRaised").textContent      = formatDate(complaint.raisedAt);
    document.getElementById("detailDescription").textContent = complaint.description || "-";
    document.getElementById("detailStatus").textContent      = complaint.status || "-";

    // 🔥 IMAGE HANDLING
    const imgEl = document.getElementById("detailImage");
    const placeholder = document.getElementById("detailImagePlaceholder");

    if (complaint.imageData) {
      imgEl.src = complaint.imageData;
      imgEl.classList.remove("d-none");
      if (placeholder) placeholder.classList.add("d-none");
    } else {
      imgEl.src = "";
      imgEl.classList.add("d-none");
      if (placeholder) placeholder.classList.remove("d-none");
    }

    const modalEl = document.getElementById("complaintModal");
    if (!modalEl) return;
    const modal = new bootstrap.Modal(modalEl);
    modal.show();
  }

  // ===== 7. Approve / Reject / Send pipeline =====
  async function handleRowAction(e) {
    const btn = e.target.closest("button[data-action]");
    if (!btn) return;

    const action = btn.dataset.action;
    const row = btn.closest("tr");
    const id = row && row.dataset.id;
    if (!id) return;

    const complaint = complaints.find(c => String(c.id) === String(id));
    if (!complaint) return;

    if (action === "view") {
      openDetailModal(complaint);
      logAdminActivity("view_complaint", { id: complaint.id, token: complaint.token });
      return;
    }

    let newStatus = complaint.status;

    if (action === "approve") {
      if (complaint.status !== "pending") {
        const ok = confirm(
          `This complaint is currently "${complaint.status}". Mark as APPROVED anyway?`
        );
        if (!ok) return;
      }
      newStatus = "approved";
    } else if (action === "reject") {
      const ok = confirm("Are you sure you want to reject this complaint?");
      if (!ok) return;
      newStatus = "rejected";
    } else if (action === "send") {
      if (complaint.status !== "approved") {
        const ok = confirm(
          `Complaint is "${complaint.status}", usually we send only APPROVED ones.\nSend to department anyway?`
        );
        if (!ok) return;
      }
      newStatus = "sent";
    }

    const ok = await updateComplaintStatusOnServer(complaint.id, newStatus);
    if (!ok) {
      alert("Could not update status. Please try again.");
      return;
    }

    complaint.status = newStatus;
    renderStats();
    renderTable();

    logAdminActivity("update_status", {
      id: complaint.id,
      token: complaint.token,
      to: newStatus,
      action
    });
  }

  // ===== 8. Logout + inactivity =====
  function setupLogout() {
    const logoutFn = (reason = "manual") => {
      const raw = localStorage.getItem("smartseva_admin");
      const logs = JSON.parse(localStorage.getItem("smartseva_admin_logs") || "[]");
      if (raw) {
        const admin = JSON.parse(raw);
        logs.push({
          type: "logout",
          geid: admin.geid,
          reason,
          at: new Date().toISOString()
        });
        localStorage.setItem("smartseva_admin_logs", JSON.stringify(logs));
      }
      localStorage.removeItem("smartseva_admin");
      window.location.href = "adminlogin.html";
    };

    const btn1 = document.getElementById("btnAdminLogout");
    const btn2 = document.getElementById("btnAdminLogoutMobile");

    if (btn1) btn1.addEventListener("click", () => logoutFn("manual"));
    if (btn2) btn2.addEventListener("click", () => logoutFn("manual"));

    return logoutFn;
  }

  function setupInactivityTimer(doLogout) {
    let timerId = null;

    const reset = () => {
      if (timerId) clearTimeout(timerId);
      timerId = setTimeout(() => {
        alert("Session timed out due to inactivity. Please log in again.");
        doLogout("timeout");
      }, INACTIVITY_LIMIT_MS);
    };

    ["click", "mousemove", "keydown", "scroll", "touchstart"].forEach(evt => {
      document.addEventListener(evt, reset, { passive: true });
    });

    reset();
  }

  // ===== 9. Init =====
  document.addEventListener("DOMContentLoaded", async () => {
    const admin = requireAdminAuth();
    if (!admin) return;

    const geidLabel = document.getElementById("adminGeidLabel");
    if (geidLabel && admin.geid) {
      geidLabel.textContent = `GEID: ${admin.geid}`;
    }

    const doLogout = setupLogout();
    setupInactivityTimer(doLogout);

    const statusFilter = document.getElementById("statusFilter");
    if (statusFilter) {
      statusFilter.addEventListener("change", renderTable);
    }

    const tbody = document.getElementById("complaintsBody");
    if (tbody) {
      tbody.addEventListener("click", handleRowAction);
    }

    complaints = await fetchComplaintsFromServer();
    renderStats();
    renderTable();

    const lastSyncLabel = document.getElementById("lastSyncLabel");
    if (lastSyncLabel) {
      lastSyncLabel.textContent = new Date().toLocaleString();
    }

    logAdminActivity("dashboard_loaded", { geid: admin.geid });
  });
})();
