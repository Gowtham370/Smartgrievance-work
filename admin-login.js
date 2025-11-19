// admin-login.js

// ✅ Demo allowed admin(s) — change/add your own later
const ALLOWED_ADMINS = [
  {
    geid: "GEID-1001",
    password: "Admin@123",
    name: "District Nodal Officer",
    role: "gov_admin"   // MUST stay this for dashboard auth
  }
];

document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("adminForm");
  if (!form) return;

  form.addEventListener("submit", (e) => {
    e.preventDefault();

    if (!form.checkValidity()) {
      form.classList.add("was-validated");
      return;
    }

    const geid = document.getElementById("geid").value.trim();
    const password = document.getElementById("adminPass").value.trim();

    const matched = ALLOWED_ADMINS.find(
      a => a.geid === geid && a.password === password
    );

    if (!matched) {
      alert("Invalid GEID or password. Only authorised government officials can login.");
      return;
    }

    // 🔥 Auto-session timeout: 30 minutes
    const expiresAt = Date.now() + 30 * 60 * 1000;

    const adminSession = {
      geid: matched.geid,
      name: matched.name,
      role: matched.role,            // "gov_admin"
      loginAt: new Date().toISOString(),
      expiresAt
      // later you can add: token: "<jwt-from-backend>"
    };

    localStorage.setItem("smartseva_admin", JSON.stringify(adminSession));

    // Simple login log
    const logs = JSON.parse(localStorage.getItem("smartseva_admin_logs") || "[]");
    logs.push({
      type: "login",
      geid: matched.geid,
      at: new Date().toISOString()
    });
    localStorage.setItem("smartseva_admin_logs", JSON.stringify(logs));

    // Go to dashboard
    window.location.href = "admin-dashboard.html";
  });
});
