
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
