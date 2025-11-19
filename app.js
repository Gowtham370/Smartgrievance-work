// Scroll progress bar
const bar = document.getElementById('scrollBar');
function updateScrollBar() {
  const h = document.documentElement;
  const scrollable = h.scrollHeight - h.clientHeight;
  const scrolled = scrollable > 0 ? (h.scrollTop / scrollable) * 100 : 0;
  bar.style.width = scrolled + '%';
}
document.addEventListener('scroll', updateScrollBar, { passive: true });
window.addEventListener('load', updateScrollBar);
window.addEventListener('resize', updateScrollBar);

// Reveal-on-scroll
const reveals = document.querySelectorAll('.reveal');
const io = new IntersectionObserver((entries) => {
  entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('show'); });
}, { threshold: 0.15 });
reveals.forEach(el => io.observe(el));



// Optional: Smooth scroll for in-page links (enhanced)
document.querySelectorAll('a[href^="#"]').forEach(a => {
  a.addEventListener('click', (e) => {
    const id = a.getAttribute('href');
    if (id.length > 1) {
      const el = document.querySelector(id);
      if (el) {
        e.preventDefault();
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }
  });
});
// Toggle .active for touch / click. Keeps default link clicks functional.
document.addEventListener('click', (e) => {
  const card = e.target.closest('.interactive-card');

  // clicked outside any card → close all
  if (!card) {
    document.querySelectorAll('.interactive-card.active').forEach(c => c.classList.remove('active'));
    return;
  }

  // if clicked on action link, allow normal navigation
  if (e.target.closest('.card-actions')) return;

  // toggle active on clicked card
  if (card.classList.contains('active')) {
    card.classList.remove('active');
  } else {
    document.querySelectorAll('.interactive-card.active').forEach(c => c.classList.remove('active'));
    card.classList.add('active');
  }
});

// optional: close on ESC
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    document.querySelectorAll('.interactive-card.active').forEach(c => c.classList.remove('active'));
  }
});

    (function () {
      // helper to smooth-scroll and focus an element
      function focusAndHighlight(el) {
        if (!el) return;
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        // if focusable, focus it
        try { el.focus({ preventScroll: true }); } catch (e) { el.focus(); }
        // flash highlight
        el.classList.add('step-target-highlight');
        setTimeout(() => el.classList.remove('step-target-highlight'), 1100);
      }

      // mapping step -> action
      function handleStep(step) {
        // targets in your raise-a-complaint form. These IDs come from your form page:
        // #department (optional select), #description, #photoInput, #manualLocation, #complaintForm, #submitComplaint
        const department = document.getElementById('department');
        const description = document.getElementById('description');
        const photoInput = document.getElementById('photoInput');
        const manualLocation = document.getElementById('manualLocation');
        const complaintForm = document.getElementById('complaintForm');
        const submitBtn = document.getElementById('submitComplaint') || document.querySelector('#complaintForm button[type="submit"]');

        if (step === 1) {
          // prefer department if present, otherwise fall back to description
          if (department) {
            focusAndHighlight(department);
          } else if (description) {
            focusAndHighlight(description);
          } else if (manualLocation) {
            focusAndHighlight(manualLocation);
          } else if (complaintForm) {
            focusAndHighlight(complaintForm);
          }
        } else if (step === 2) {
          if (description) {
            focusAndHighlight(description);
          } else if (manualLocation) {
            focusAndHighlight(manualLocation);
          }
        } else if (step === 3) {
          // open file dialog if possible
          if (photoInput) {
            // small delay so scroll occurs first
            focusAndHighlight(photoInput);
            setTimeout(() => {
              try { photoInput.click(); } catch (e) { /* ignore */ }
            }, 450);
          } else {
            // fallback: focus the form
            if (complaintForm) focusAndHighlight(complaintForm);
          }
        } else if (step === 4) {
          // scroll to form and highlight submit button
          if (submitBtn) {
            focusAndHighlight(submitBtn);
          } else if (complaintForm) {
            focusAndHighlight(complaintForm);
          }
        }
      }

      // attach handlers to all step cards
      const stepCards = document.querySelectorAll('#how-it-works .step-action');
      stepCards.forEach(card => {
        // click
        card.addEventListener('click', () => {
          const step = Number(card.dataset.step || 0);
          handleStep(step);
        });

        // keyboard (Enter / Space)
        card.addEventListener('keydown', (e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            card.click();
          }
        });
      });

      // optional: show small tooltip-like feedback when action happens
      // (already handled by highlight + focus; so not needed)

    })();
 
/* About section interactions & animations
   - Counts up stat numbers when visible
   - Reveals .reveal elements on scroll
*/
(function () {
  // simple intersection reveal
  const revealEls = document.querySelectorAll('#about .reveal');
  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        e.target.classList.add('show');
        revealObserver.unobserve(e.target);
      }
    });
  }, { threshold: 0.12 });
  revealEls.forEach(el => revealObserver.observe(el));

  // Count-up for stats
  function animateNumber(el, end, opts = {}) {
    const duration = opts.duration || 1400; // ms
    const start = 0;
    let startTime = null;
    function tick(ts) {
      if (!startTime) startTime = ts;
      const progress = Math.min((ts - startTime) / duration, 1);
      const val = Math.floor(start + (end - start) * progress);
      // percent formatting for SLA (if end <= 100 and original had %)
      if (opts.suffix === '%') {
        el.textContent = val + '%';
      } else {
        el.textContent = val.toLocaleString();
      }
      if (progress < 1) window.requestAnimationFrame(tick);
    }
    window.requestAnimationFrame(tick);
  }

  // Observe the analytics area
  const analyticsSection = document.getElementById('analytics');
  if (analyticsSection) {
    const statsObserver = new IntersectionObserver((entries) => {
      entries.forEach(e => {
        if (e.isIntersecting) {
          // each tile
          e.target.querySelectorAll('.stat-tile').forEach(tile => {
            const valEl = tile.querySelector('.stat-value');
            if (!valEl) return;
            // guard: run only once
            if (valEl.dataset.animated) return;
            valEl.dataset.animated = 'true';
            // read target
            const rawTarget = valEl.getAttribute('data-target') || valEl.textContent.replace(/[^\d]/g, '');
            const target = Number(rawTarget) || 0;
            // choose suffix (for SLA percent)
            const suffix = (target <= 100 && valEl.textContent.includes('%')) ? '%' : '';
            animateNumber(valEl, target, { suffix: suffix, duration: 1400 });
          });
          statsObserver.unobserve(e.target);
        }
      });
    }, { threshold: 0.25 });
    statsObserver.observe(analyticsSection);
  }

  // accessibility: allow Enter on CTA to focus the complaint form if exists
  const ctaRaise = document.getElementById('cta-raise');
  if (ctaRaise) {
    ctaRaise.addEventListener('click', (ev) => {
      // if form exists and has an input #description focus it (smooth)
      const form = document.getElementById('complaintForm');
      if (form) {
        ev.preventDefault();
        const desc = document.getElementById('description') || form.querySelector('textarea, input');
        if (desc) {
          desc.scrollIntoView({ behavior: 'smooth', block: 'center' });
          setTimeout(() => desc.focus(), 450);
        } else {
          form.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }
    });
  }
})();
(function(){
    const v = document.getElementById('heroVideo');

    // Try to play and handle promise for browsers that restrict autoplay.
    function tryPlay() {
      if (!v) return;
      const p = v.play();
      if (p !== undefined) {
        p.catch(() => {
          // Autoplay blocked — leave muted and user can tap to play
          v.muted = true;
        });
      }
    }

    // On load try to play
    window.addEventListener('load', tryPlay);

    // If page becomes visible again, ensure play
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') tryPlay();
    });

    // Optional: small parallax movement while scrolling (only if not reduced motion)
    if (window.matchMedia('(prefers-reduced-motion: no-preference)').matches) {
      window.addEventListener('scroll', () => {
        const rect = document.getElementById('hero-video').getBoundingClientRect();
        // apply very small translate for parallax feel
        const pct = Math.max(-0.03, Math.min(0.03, (rect.top / window.innerHeight) ));
        v.style.transform = `scale(1.02) translateY(${pct * 100}px)`;
      }, { passive: true });
    }
  })();
  // reveal on scroll
const revealObserver = new IntersectionObserver(
  entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) entry.target.classList.add("show");
    });
  },
  { threshold: 0.15 }
);

document.querySelectorAll(".reveal").forEach(el => revealObserver.observe(el));

 (function(){
    // Replace with your data source or function that gets current user
    const USER = {
      name: "Gowtham Reddy",          // full name -> displayed in navbar
      avatar: "./assets/avatar-placeholder.png"
    };

    const nameEl = document.getElementById('userFullName');
    const avatarEl = document.getElementById('userAvatar');

    if (nameEl) nameEl.textContent = USER.name;
    if (avatarEl) avatarEl.src = USER.avatar;
  })();
  
//   <!-- Translation script (API-based) -->
    (function(){
      const API_URL = "https://libretranslate.de/translate"; 
      // In production, host your own translation service or proxy this endpoint from your backend.

      let currentLang = "en";

      // helper: is this text worth translating?
      function shouldTranslateText(text) {
        if (!text) return false;
        const t = text.trim();
        if (!t) return false;
        if (!/[A-Za-z]/.test(t)) return false;      // skip pure numbers / symbols
        if (t.includes("@")) return false;          // skip emails
        if (t.length < 2) return false;
        return true;
      }

      // Collect all elements that are safe to auto-translate:
      //  - only one child
      //  - that child is a text node
      //  - and text looks like normal text (not just numbers / email)
      const translatableEls = Array.from(document.querySelectorAll("body *"))
        .filter(el => {
          if (el.closest("script,style")) return false;
          if (el.classList.contains("no-translate")) return false;
          if (el.childNodes.length !== 1) return false;
          const node = el.firstChild;
          if (node.nodeType !== Node.TEXT_NODE) return false;
          return shouldTranslateText(node.textContent);
        });

      // Save original English text once
      translatableEls.forEach(el => {
        if (!el.dataset.tSource) {
          el.dataset.tSource = el.textContent.trim();
        }
      });

      async function translateText(text, target) {
        const res = await fetch(API_URL, {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            q: text,
            source: "en",
            target: target,
            format: "text"
            // api_key: "YOUR_KEY_IF_NEEDED"
          })
        });
        const data = await res.json();
        return data.translatedText || text;
      }

      async function applyLanguage(lang) {
        if (lang === currentLang) return;
        currentLang = lang;
        document.documentElement.lang = lang;

        // If English → restore originals and exit
        if (lang === "en") {
          translatableEls.forEach(el => {
            if (el.dataset.tSource) {
              el.textContent = el.dataset.tSource;
            }
          });
          return;
        }

        // For hi / te → use cache if available, else fetch
        const cacheKey = "t" + lang;  // e.g. data-thi, data-tte

        for (const el of translatableEls) {
          const original = el.dataset.tSource || el.textContent.trim();
          if (!shouldTranslateText(original)) continue;

          // Cached?
          if (el.dataset[cacheKey]) {
            el.textContent = el.dataset[cacheKey];
            continue;
          }

          try {
            const translated = await translateText(original, lang);
            el.dataset[cacheKey] = translated;
            el.textContent = translated;
          } catch (err) {
            console.error("Translate error:", err);
            // Fallback: keep original
          }
        }
      }

      // Wire language buttons (desktop + mobile)
      document.querySelectorAll(".lang-switch").forEach(btn => {
        btn.addEventListener("click", async () => {
          const lang = btn.dataset.lang || "en";
          await applyLanguage(lang);
        });
      });

      // initial lang state
      document.documentElement.lang = "en";
    })();
// app.js

// cache for translations so we don’t call API again and again
const translationCache = {
  hi: null,
  te: null
};

// current language
let currentLang = 'en';

// get all translatable elements once
const i18nNodes = Array.from(document.querySelectorAll('[data-i18n="true"]'));

// store original English text in data-original-text
i18nNodes.forEach(node => {
  if (!node.dataset.originalText) {
    node.dataset.originalText = node.innerText.trim();
  }
});

// apply texts (array of strings) to DOM nodes in order
function applyTranslations(texts) {
  i18nNodes.forEach((node, idx) => {
    if (texts[idx] !== undefined) {
      node.innerText = texts[idx];
    }
  });
}

// reset to English (original)
function setEnglish() {
  i18nNodes.forEach(node => {
    if (node.dataset.originalText) {
      node.innerText = node.dataset.originalText;
    }
  });
}

// call backend to translate all texts to target lang
async function fetchTranslations(targetLang) {
  const originals = i18nNodes.map(node => node.dataset.originalText || node.innerText.trim());

  const resp = await fetch('/api/translate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      texts: originals,
      target: targetLang
    })
  });

  if (!resp.ok) {
    throw new Error('Translation API error');
  }

  const data = await resp.json();
  return data.translations || [];
}

// main switch function
async function switchLanguage(lang) {
  if (lang === currentLang) return;

  if (lang === 'en') {
    setEnglish();
    currentLang = 'en';
    document.documentElement.lang = 'en';
    return;
  }

  // if cached, just apply
  if (translationCache[lang]) {
    applyTranslations(translationCache[lang]);
    currentLang = lang;
    document.documentElement.lang = lang;
    return;
  }

  // else, fetch from backend
  try {
    // small visual feedback (optional)
    document.body.style.cursor = 'wait';

    const translations = await fetchTranslations(lang);
    translationCache[lang] = translations;
    applyTranslations(translations);

    currentLang = lang;
    document.documentElement.lang = lang;
  } catch (err) {
    console.error(err);
    alert('Could not translate page right now.');
  } finally {
    document.body.style.cursor = 'default';
  }
}

// hook language buttons
document.querySelectorAll('.lang-option').forEach(btn => {
  btn.addEventListener('click', () => {
    const lang = btn.dataset.lang;
    if (!lang) return;
    switchLanguage(lang);
  });
});

  // ---- Helper: get current user from localStorage ----
  function getSmartSevaUser() {
    try {
      const raw = localStorage.getItem("smartseva_user");
      if (!raw) return null;
      return JSON.parse(raw);
    } catch (e) {
      console.warn("Invalid smartseva_user JSON", e);
      return null;
    }
  }

  // ---- Build display name & avatar initial from stored user ----
  function getUserDisplayInfo(user) {
    if (!user) return { name: "User", initial: "U", avatarUrl: null };

    const name =
      user.name ||
      user.fullName ||
      user.displayName ||
      user.given_name ||
      (user.email ? user.email.split("@")[0] : "User");

    const initial = name && name.trim().length
      ? name.trim().charAt(0).toUpperCase()
      : "U";

    const avatarUrl = user.picture || user.avatarUrl || null; // if you store google picture

    return { name, initial, avatarUrl };
  }

  // ---- Render navbar auth state ----
  function renderNavbarAuth() {
    const loggedOutEl = document.getElementById("navAuthLoggedOut");
    const loggedInEl  = document.getElementById("navAuthLoggedIn");
    const nameEl      = document.getElementById("navUserName");
    const avatarEl    = document.getElementById("navUserAvatar");
    const logoutBtn   = document.getElementById("btnNavLogout");

    if (!loggedOutEl || !loggedInEl) return;

    const user = getSmartSevaUser();

    if (!user) {
      // Not logged in
      loggedOutEl.classList.remove("d-none");
      loggedInEl.classList.add("d-none");
      return;
    }

    // Logged in
    const info = getUserDisplayInfo(user);

    if (nameEl)   nameEl.textContent = info.name;
    if (avatarEl) {
      if (info.avatarUrl) {
        // show image if available
        avatarEl.style.backgroundImage = `url("${info.avatarUrl}")`;
        avatarEl.style.backgroundSize = "cover";
        avatarEl.style.backgroundPosition = "center";
        avatarEl.textContent = ""; // hide initial text
      } else {
        // fallback initial
        avatarEl.style.backgroundImage = "none";
        avatarEl.textContent = info.initial;
      }
    }

    loggedOutEl.classList.add("d-none");
    loggedInEl.classList.remove("d-none");

    if (logoutBtn && !logoutBtn.dataset._bound) {
      logoutBtn.dataset._bound = "1";
      logoutBtn.addEventListener("click", () => {
        localStorage.removeItem("smartseva_user");   // user session
        // optional: also clear admin if you want
        // localStorage.removeItem("smartseva_admin");
        window.location.href = "index.html";
      });
    }
  }

  // Init on DOM ready
  document.addEventListener("DOMContentLoaded", () => {
    renderNavbarAuth();
  });

  // Optional: if you update localStorage from other scripts and want nav to react,
  // you can call renderNavbarAuth() again after login/signup success.

document.addEventListener("DOMContentLoaded", () => {
  const currentPage = window.location.pathname.split("/").pop().toLowerCase();
  const currentHash = window.location.hash.toLowerCase();

  document.querySelectorAll(".navbar-nav .nav-link").forEach(link => {
    const linkHref = link.getAttribute("href")?.toLowerCase() || "";

    // Case 1: Exact page match
    if (linkHref === currentPage && currentPage !== "") {
      link.classList.add("active");
      return;
    }

    // Case 2: index sections (#about, #contact, etc.)
    if (currentPage === "index.html") {
      if (linkHref.includes(currentHash) && currentHash !== "") {
        link.classList.add("active");
        return;
      }
    }

    // Case 3: Home page of domain without filename (like domain.com/)
    if ((currentPage === "" || currentPage === "index.html") && linkHref.includes("#home")) {
      link.classList.add("active");
    }
  });
});
