/* =========================================================
   Portfolio interactions
   No libraries, no build step.
   1 Theme      2 Mobile menu      3 Scroll spy    4 Progress bar
   5 Filter     6 Image viewer     7 Certificate deck
   8 Reveals    9 Counters        10 Terminal
   11 Back to top  12 Contact form  13 Year
   ========================================================= */
(function () {
  "use strict";

  var reduceMotion = window.matchMedia &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- 1. Theme (light / dark), remembered per browser ---------- */
  var root = document.documentElement;
  var themeBtn = document.getElementById("themeToggle");

  function applyTheme(mode) {
    root.setAttribute("data-theme", mode);
    var dark = mode === "dark";
    themeBtn.setAttribute("aria-pressed", String(dark));
    themeBtn.setAttribute("aria-label", dark ? "Switch to light theme" : "Switch to dark theme");
    themeBtn.querySelector(".iconbtn__glyph").textContent = dark ? "◑" : "◐";
    try { localStorage.setItem("theme", mode); } catch (e) { /* storage blocked */ }
  }

  var saved = null;
  try { saved = localStorage.getItem("theme"); } catch (e) { /* storage blocked */ }
  var prefersDark = window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
  applyTheme(saved || (prefersDark ? "dark" : "light"));

  themeBtn.addEventListener("click", function () {
    applyTheme(root.getAttribute("data-theme") === "dark" ? "light" : "dark");
  });

  /* ---------- 2. Mobile menu ---------- */
  var menuBtn = document.getElementById("menuToggle");
  var nav = document.getElementById("nav");

  menuBtn.addEventListener("click", function () {
    var open = nav.classList.toggle("is-open");
    menuBtn.setAttribute("aria-expanded", String(open));
  });

  nav.addEventListener("click", function (e) {
    if (e.target.closest("a")) {
      nav.classList.remove("is-open");
      menuBtn.setAttribute("aria-expanded", "false");
    }
  });

  /* ---------- 3. Highlight the section you're reading ---------- */
  var navLinks = Array.prototype.slice.call(nav.querySelectorAll("a[href^='#']"));
  var sections = navLinks
    .map(function (a) { return document.querySelector(a.getAttribute("href")); })
    .filter(Boolean);

  if ("IntersectionObserver" in window && sections.length) {
    var spy = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        navLinks.forEach(function (a) {
          a.classList.toggle("is-current", a.getAttribute("href") === "#" + entry.target.id);
        });
      });
    }, { rootMargin: "-45% 0px -50% 0px", threshold: 0 });

    sections.forEach(function (s) { spy.observe(s); });
  }

  /* ---------- 4. Reading progress bar ---------- */
  var bar = document.getElementById("progressBar");

  function updateProgress() {
    var max = document.documentElement.scrollHeight - window.innerHeight;
    var pct = max > 0 ? (window.scrollY / max) * 100 : 0;
    bar.style.width = Math.min(100, Math.max(0, pct)) + "%";
  }
  window.addEventListener("scroll", updateProgress, { passive: true });
  window.addEventListener("resize", updateProgress);
  updateProgress();

  /* ---------- 5. Project filter ---------- */
  var chips = document.querySelectorAll(".chip");
  var projects = document.querySelectorAll("#projectList .project");
  var emptyNote = document.getElementById("projectsEmpty");

  chips.forEach(function (chip) {
    chip.addEventListener("click", function () {
      var want = chip.dataset.filter;
      chips.forEach(function (c) { c.classList.toggle("is-active", c === chip); });

      var shown = 0;
      projects.forEach(function (p) {
        var types = (p.dataset.type || "").split(/\s+/);
        var match = want === "all" || types.indexOf(want) !== -1;
        p.hidden = !match;
        if (match) shown++;
      });
      emptyNote.hidden = shown !== 0;
    });
  });

  /* ---------- 6. Image viewer ----------
     Any element with data-full can open it:
       data-full        the large image
       data-caption     the line shown underneath
       data-link        optional external page
       data-link-label  optional text for that link button
     Elements inside the same [data-gallery] form one set, so the
     arrows step through that project's or stint's photos only.
  ------------------------------------------ */
  var box = document.getElementById("lightbox");
  var boxImg = document.getElementById("lightboxImg");
  var boxCap = document.getElementById("lightboxCaption");
  var boxCount = document.getElementById("lightboxCount");
  var boxLink = document.getElementById("lightboxLink");
  var boxClose = document.getElementById("lightboxClose");
  var boxPrev = document.getElementById("lightboxPrev");
  var boxNext = document.getElementById("lightboxNext");

  var group = [];
  var index = 0;
  var lastFocused = null;

  function render() {
    var btn = group[index];
    boxImg.src = btn.dataset.full;
    boxImg.alt = btn.dataset.caption || btn.dataset.name || "Image";
    boxCap.textContent = btn.dataset.caption || btn.dataset.name || "";

    var many = group.length > 1;
    boxPrev.hidden = !many;
    boxNext.hidden = !many;
    boxCount.textContent = many ? (index + 1) + " / " + group.length : "";

    if (btn.dataset.link) {
      boxLink.href = btn.dataset.link;
      boxLink.textContent = btn.dataset.linkLabel || "Open link";
      boxLink.hidden = false;
      boxLink.style.display = "";
    } else {
      boxLink.href = "#";
      boxLink.textContent = "";
      boxLink.hidden = true;
      boxLink.style.display = "none";
    }
  }

  function openViewer(btn) {
    var holder = btn.closest("[data-gallery]");
    group = holder
      ? Array.prototype.slice.call(holder.querySelectorAll("[data-full]"))
      : [btn];
    index = group.indexOf(btn);
    if (index < 0) index = 0;

    lastFocused = btn;
    render();
    box.hidden = false;
    document.body.style.overflow = "hidden";
    boxClose.focus();
  }

  function closeViewer() {
    box.hidden = true;
    boxImg.src = "";
    document.body.style.overflow = "";
    if (lastFocused) lastFocused.focus();
  }

  function step(by) {
    if (group.length < 2) return;
    index = (index + by + group.length) % group.length;
    render();
  }

  /* certificate thumbnails switch the deck instead of opening the viewer,
     so they are excluded here */
  document.querySelectorAll("[data-full]:not(.certthumb)").forEach(function (btn) {
    btn.addEventListener("click", function () { openViewer(btn); });
  });

  boxClose.addEventListener("click", closeViewer);
  boxPrev.addEventListener("click", function () { step(-1); });
  boxNext.addEventListener("click", function () { step(1); });
  box.addEventListener("click", function (e) { if (e.target === box) closeViewer(); });

  document.addEventListener("keydown", function (e) {
    if (box.hidden) return;
    if (e.key === "Escape") closeViewer();
    if (e.key === "ArrowLeft") step(-1);
    if (e.key === "ArrowRight") step(1);
  });

  /* ---------- 7. Certificate deck ----------
     One large certificate at a time, with arrows and a thumbnail rail.
     Everything is read from the rail buttons, so adding a certificate
     means adding one <li> in index.html and nothing here.
  ------------------------------------------ */
  var deck = document.getElementById("certDeck");

  if (deck) {
    var thumbs = Array.prototype.slice.call(deck.querySelectorAll(".certthumb"));
    var stageImg = document.getElementById("certStageImg");
    var certName = document.getElementById("certName");
    var certIssuer = document.getElementById("certIssuer");
    var certCount = document.getElementById("certCount");
    var certLink = document.getElementById("certLink");
    var certPrev = document.getElementById("certPrev");
    var certNext = document.getElementById("certNext");
    var certZoom = document.getElementById("certZoom");
    var certZoomBtn = document.getElementById("certZoomBtn");
    var rail = document.getElementById("certRail");
    var current = 0;

    function showCert(i, scrollRail) {
      current = (i + thumbs.length) % thumbs.length;
      var t = thumbs[current];

      stageImg.src = t.dataset.full;
      stageImg.alt = t.dataset.caption || t.dataset.name || "Certificate";
      certName.textContent = t.dataset.name || "";
      certIssuer.textContent = t.dataset.issuer || "";
      certCount.textContent = (current + 1) + " / " + thumbs.length;

      if (t.dataset.link) {
        certLink.href = t.dataset.link;
        certLink.querySelector("span").textContent = t.dataset.linkLabel || "View credential";
        certLink.style.display = ""; 
        certLink.hidden = false;
      } else {
        certLink.style.display = "none"; 
        certLink.hidden = true;
      }

      thumbs.forEach(function (other, n) { other.classList.toggle("is-active", n === current); });

      if (scrollRail && rail.scrollWidth > rail.clientWidth) {
        var item = t.parentNode;
        var target = item.offsetLeft - (rail.clientWidth - item.offsetWidth) / 2;
        rail.scrollTo({ left: target, behavior: reduceMotion ? "auto" : "smooth" });
      }
    }

    thumbs.forEach(function (t, i) {
      t.addEventListener("click", function () { showCert(i, false); });
    });
    certPrev.addEventListener("click", function () { showCert(current - 1, true); });
    certNext.addEventListener("click", function () { showCert(current + 1, true); });

    function zoom() { openViewer(thumbs[current]); }
    certZoom.addEventListener("click", zoom);
    certZoomBtn.addEventListener("click", zoom);

    /* left / right arrows work while the deck is on screen and the viewer is closed */
    document.addEventListener("keydown", function (e) {
      if (!box.hidden) return;
      if (e.key !== "ArrowLeft" && e.key !== "ArrowRight") return;
      var r = deck.getBoundingClientRect();
      var onScreen = r.top < window.innerHeight * 0.6 && r.bottom > window.innerHeight * 0.3;
      if (!onScreen) return;
      showCert(current + (e.key === "ArrowRight" ? 1 : -1), true);
    });

    /* a missing certificate image hides its thumbnail rather than breaking the rail */
    thumbs.forEach(function (t) {
      var img = t.querySelector("img");
      img.addEventListener("error", function () { t.parentNode.hidden = true; });
    });

    showCert(0, false);
  }

  /* Missing project or OJT images hide themselves too.
     Delete this block once every image is in place. */
  document.querySelectorAll(".shots img").forEach(function (img) {
    img.addEventListener("error", function () {
      var item = img.closest("li");
      if (item) item.hidden = true;
    });
  });
  var portrait = document.querySelector(".portrait img");
  if (portrait) {
    portrait.addEventListener("error", function () {
      var fig = portrait.closest(".portrait");
      if (fig) fig.style.display = "none";
    });
  }

  /* ---------- 8. Reveal content as it scrolls into view ---------- */
  var revealTargets = document.querySelectorAll(
    ".section .record__meta, .project, .stint, .certdeck, .seminar, .skillset, .prose, .contact > *"
  );

  if (!reduceMotion && "IntersectionObserver" in window) {
    revealTargets.forEach(function (el) { el.classList.add("reveal"); });

    var shower = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-in");
        shower.unobserve(entry.target);
      });
    }, { rootMargin: "0px 0px -8% 0px", threshold: 0.12 });

    revealTargets.forEach(function (el) { shower.observe(el); });
  }

  /* ---------- 9. Count up numbers marked with data-count ---------- */
  document.querySelectorAll("[data-count]").forEach(function (el) {
    var target = parseInt(el.dataset.count, 10);
    if (isNaN(target)) return;
    if (reduceMotion) { el.textContent = String(target); return; }

    var start = performance.now();
    (function frame(now) {
      var t = Math.min(1, ((now || start) - start) / 900);
      el.textContent = String(Math.round(target * (1 - Math.pow(1 - t, 3))));
      if (t < 1) requestAnimationFrame(frame);
    })(start);
  });

  /* ---------- 10. Terminal line in the hero ----------
     Edit this list to change what it types.
  ------------------------------------------ */
  var LINES = [
    "whoami  →  Mars J Mathew A. Lim",
    "cat profile.txt  →  BSIT Student @ Laguna, PH",
    "ls skills/  →  system-administration  networking  it-support",
    "echo $STATUS  →  open_to_work"
  ];

  var out = document.getElementById("termOut");
  if (out) {
    if (reduceMotion) {
      out.textContent = LINES[0];
    } else {
      var li = 0, ci = 0, erasing = false;

      (function type() {
        var text = LINES[li];
        out.textContent = text.slice(0, ci);

        var wait = erasing ? 18 : 42;
        if (!erasing && ci === text.length) { erasing = true; wait = 1800; }
        else if (erasing && ci === 0) { erasing = false; li = (li + 1) % LINES.length; wait = 350; }
        else { ci += erasing ? -1 : 1; }

        setTimeout(type, wait);
      })();
    }
  }

  /* ---------- 11. Back to top ---------- */
  var toTop = document.getElementById("toTop");
  window.addEventListener("scroll", function () {
    toTop.hidden = window.scrollY < 600;
  }, { passive: true });
  toTop.addEventListener("click", function () {
    window.scrollTo({ top: 0, behavior: reduceMotion ? "auto" : "smooth" });
  });

  /* ---------- 12. Contact form ----------
     Removed: GitHub Pages can't run a server to receive submissions, and the
     Contact section now uses plain mailto / GitHub / LinkedIn / CV links
     instead, which work with no backend.

     If you ever add a form back, restore this block and give the form an
     endpoint from formspree.io (or similar) — the "if (form)" guard below
     means nothing breaks if the form isn't on the page.
  ------------------------------------------ */
  var form = document.getElementById("contactForm");
  if (form) {
    var FORM_ENDPOINT = "";            // e.g. "https://formspree.io/f/abcdwxyz"
    var MY_EMAIL = "marsjmathewlim@gmail.com";
    var status = document.getElementById("formStatus");

    var setError = function (id, message) {
      var input = document.getElementById(id);
      var slot = document.querySelector("[data-error-for='" + id + "']");
      input.closest(".field").classList.toggle("is-invalid", Boolean(message));
      input.setAttribute("aria-invalid", message ? "true" : "false");
      slot.textContent = message || "";
    };

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      status.textContent = "";

      var name = document.getElementById("cName").value.trim();
      var email = document.getElementById("cEmail").value.trim();
      var message = document.getElementById("cMessage").value.trim();
      var ok = true;

      if (!name) { setError("cName", "Tell me what to call you."); ok = false; } else setError("cName", "");
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        setError("cEmail", "Use a full email address, like name@email.com."); ok = false;
      } else setError("cEmail", "");
      if (message.length < 10) { setError("cMessage", "Add a few more details — 10 characters minimum."); ok = false; }
      else setError("cMessage", "");

      if (!ok) return;

      if (FORM_ENDPOINT) {
        status.textContent = "Sending…";
        fetch(FORM_ENDPOINT, {
          method: "POST",
          headers: { "Accept": "application/json", "Content-Type": "application/json" },
          body: JSON.stringify({ name: name, email: email, message: message })
        }).then(function (res) {
          if (!res.ok) throw new Error("Request failed");
          form.reset();
          status.textContent = "Sent. I'll reply within a day.";
        }).catch(function () {
          status.textContent = "That didn't go through. Email me directly at " + MY_EMAIL + ".";
        });
        return;
      }

      var subject = encodeURIComponent("Portfolio message from " + name);
      var body = encodeURIComponent(message + "\n\n— " + name + " (" + email + ")");
      window.location.href = "mailto:" + MY_EMAIL + "?subject=" + subject + "&body=" + body;
      status.textContent = "Opening your email app…";
    });
  }

  /* ---------- 13. Footer year ---------- */
  var year = document.getElementById("year");
  if (year) year.textContent = String(new Date().getFullYear());
})();
