/* ==========================================================================
   VectorX — main.js (Vanilla JS, no dependencies besides Bootstrap bundle)
   ========================================================================== */

/* --------------------------------------------------------------------------
   SITE CONFIGURATION — update these values in one place
   --------------------------------------------------------------------------
   whatsappNumber: international format, digits only, no "+", spaces or
                   leading zeros. Example for an Indian number: "919876543210".
                   site-contents.docx does not include a WhatsApp number, so
                   this is intentionally left empty. While empty, WhatsApp
                   still opens with the message pre-filled and the visitor
                   chooses the recipient chat.
   -------------------------------------------------------------------------- */
const SITE_CONFIG = {
  whatsappNumber: "",
  companyName: "VectorX",
  email: "support@vectorx.live",
  website: "https://vectorx.live",
};

(function () {
  "use strict";

  const doc = document.documentElement;
  doc.classList.add("js");
  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- Helpers ---------- */
  const $ = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));
  const waNumber = String(SITE_CONFIG.whatsappNumber || "").replace(/\D/g, "");

  function buildWhatsAppUrl(text) {
    const base = waNumber ? `https://wa.me/${waNumber}` : "https://wa.me/";
    return text ? `${base}?text=${encodeURIComponent(text)}` : base;
  }

  /* ---------- Preloader ---------- */
  const loader = $("#vxLoader");
  const start = performance.now();
  let loaderDone = false;

  function hideLoader() {
    if (loaderDone) return;
    loaderDone = true;
    const minShow = prefersReducedMotion ? 0 : 450;
    const wait = Math.max(0, minShow - (performance.now() - start));
    window.setTimeout(() => {
      if (loader) {
        loader.classList.add("is-hidden");
        loader.setAttribute("aria-hidden", "true");
        window.setTimeout(() => loader.remove(), 700);
      }
      document.body.classList.remove("is-loading");
      document.body.classList.add("is-ready");
    }, wait);
  }

  if (document.readyState === "complete") hideLoader();
  else window.addEventListener("load", hideLoader, { once: true });
  // Safety net: never keep the loader longer than 3.5s (slow CDN, blocked fonts, etc.)
  window.setTimeout(hideLoader, 3500);

  /* ---------- Navbar: scrolled state + back-to-top ---------- */
  const nav = $(".vx-nav");
  const toTop = $("#toTop");
  let ticking = false;

  function onScroll() {
    const y = window.scrollY;
    if (nav) nav.classList.toggle("is-scrolled", y > 24);
    if (toTop) toTop.classList.toggle("is-visible", y > 600);
    ticking = false;
  }
  window.addEventListener("scroll", () => {
    if (!ticking) { window.requestAnimationFrame(onScroll); ticking = true; }
  }, { passive: true });
  onScroll();

  if (toTop) {
    toTop.addEventListener("click", () => window.scrollTo({ top: 0, behavior: prefersReducedMotion ? "auto" : "smooth" }));
  }

  /* ---------- Close mobile menu after choosing a link / tapping outside ---------- */
  const collapseEl = $("#vxNavMenu");
  if (collapseEl && window.bootstrap) {
    const bsCollapse = bootstrap.Collapse.getOrCreateInstance(collapseEl, { toggle: false });
    $$(".nav-link, .nav-cta a", collapseEl).forEach((a) =>
      a.addEventListener("click", () => { if (collapseEl.classList.contains("show")) bsCollapse.hide(); })
    );
    document.addEventListener("click", (e) => {
      if (collapseEl.classList.contains("show") && !nav.contains(e.target)) bsCollapse.hide();
    });
  }

  /* ---------- Scroll reveal (IntersectionObserver) ---------- */
  const revealEls = $$("[data-reveal]");
  // Automatic stagger for grouped children: <div data-stagger> ... [data-reveal] ...
  $$("[data-stagger]").forEach((group) => {
    const step = parseInt(group.getAttribute("data-stagger"), 10) || 110;
    $$("[data-reveal]", group).forEach((el, i) => {
      if (!el.style.getPropertyValue("--d")) el.style.setProperty("--d", String(i * step));
    });
  });

  if (prefersReducedMotion || !("IntersectionObserver" in window)) {
    revealEls.forEach((el) => el.classList.add("is-revealed"));
  } else {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-revealed");
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.14, rootMargin: "0px 0px -6% 0px" });
    revealEls.forEach((el) => io.observe(el));
  }

  /* ---------- Card spotlight (pointer-follow glow) ---------- */
  if (!prefersReducedMotion && window.matchMedia("(hover: hover)").matches) {
    $$(".vx-card").forEach((card) => {
      card.addEventListener("pointermove", (e) => {
        const r = card.getBoundingClientRect();
        card.style.setProperty("--mx", `${e.clientX - r.left}px`);
        card.style.setProperty("--my", `${e.clientY - r.top}px`);
      });
    });
  }

  /* ---------- WhatsApp quick links (header FAB, contact cards) ---------- */
  $$("[data-wa]").forEach((el) => {
    const msg = el.getAttribute("data-wa") || `Hello ${SITE_CONFIG.companyName}, I would like to make an enquiry.`;
    el.setAttribute("href", buildWhatsAppUrl(msg));
    el.setAttribute("target", "_blank");
    el.setAttribute("rel", "noopener");
  });
  $$("[data-wa-display]").forEach((el) => {
    el.textContent = waNumber ? `+${waNumber}` : "Chat with our team on WhatsApp";
  });

  /* ---------- Footer year ---------- */
  $$("[data-year]").forEach((el) => (el.textContent = new Date().getFullYear()));

  /* ---------- Contact form → WhatsApp ---------- */
  const form = $("#enquiryForm");
  if (!form) return;

  const fields = {
    name: $("#fullName", form),
    phone: $("#phone", form),
    email: $("#email", form),
    address: $("#address", form),
    subject: $("#subject", form),
    message: $("#message", form),
  };
  const statusEl = $("#formStatus");
  const counter = $("#messageCount");

  const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
  // Accepts +, spaces, dashes, dots and brackets; requires 10–15 digits overall.
  const PHONE_CHARS_RE = /^\+?[\d\s\-().]+$/;

  const validators = {
    name: (v) => (v.length < 2 ? "Please enter your full name." : /^[\p{L}\s.'-]+$/u.test(v) ? "" : "Name can contain letters, spaces, dots, apostrophes and hyphens only."),
    phone: (v) => {
      if (!v) return "Please enter your phone number.";
      const digits = v.replace(/\D/g, "");
      if (!PHONE_CHARS_RE.test(v) || digits.length < 10 || digits.length > 15) return "Enter a valid phone number (10–15 digits, e.g. +91 98765 43210).";
      return "";
    },
    email: (v) => (!v ? "Please enter your email address." : EMAIL_RE.test(v) ? "" : "Enter a valid email address (e.g. name@example.com)."),
    address: (v) => (v.length < 3 ? "Please enter your address or city." : ""),
    subject: (v) => (!v ? "Please choose an enquiry type." : ""),
    message: (v) => (v.length < 10 ? "Please write a message (at least 10 characters)." : ""),
  };

  function validateField(key) {
    const input = fields[key];
    const value = input.value.trim();
    const error = validators[key](value);
    const fb = $(`#${input.id}Feedback`);
    input.classList.toggle("is-invalid", !!error);
    input.classList.toggle("is-valid", !error);
    input.setAttribute("aria-invalid", error ? "true" : "false");
    if (fb) fb.textContent = error;
    return !error;
  }

  Object.keys(fields).forEach((key) => {
    const input = fields[key];
    input.addEventListener("blur", () => { if (input.value.trim() || input.classList.contains("is-invalid")) validateField(key); });
    input.addEventListener("input", () => { if (input.classList.contains("is-invalid") || input.classList.contains("is-valid")) validateField(key); });
    if (input.tagName === "SELECT") input.addEventListener("change", () => validateField(key));
  });

  if (counter) {
    const max = fields.message.getAttribute("maxlength");
    const updateCount = () => (counter.textContent = `${fields.message.value.length}/${max}`);
    fields.message.addEventListener("input", updateCount);
    updateCount();
  }

  function showStatus(type, text) {
    if (!statusEl) return;
    statusEl.className = `form-status form-status--${type} is-visible`;
    statusEl.innerHTML = `<i class="bi ${type === "ok" ? "bi-check-circle-fill" : "bi-exclamation-triangle-fill"}" aria-hidden="true"></i><span></span>`;
    statusEl.querySelector("span").textContent = text;
  }

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const results = Object.keys(fields).map(validateField);
    if (results.includes(false)) {
      const firstInvalid = Object.values(fields).find((f) => f.classList.contains("is-invalid"));
      if (firstInvalid) firstInvalid.focus();
      showStatus("err", "Please correct the highlighted fields and try again.");
      return;
    }

    const v = (k) => fields[k].value.trim();
    const message = [
      "Hello, I would like to make an enquiry.",
      "",
      `Name: ${v("name")}`,
      `Phone: ${v("phone")}`,
      `Email: ${v("email")}`,
      `Address: ${v("address")}`,
      `Subject: ${v("subject")}`,
      `Message: ${v("message")}`,
    ].join("\n");

    const url = buildWhatsAppUrl(message);
    // Opened directly inside the submit handler, so popup blockers allow it.
    // wa.me hands off to the WhatsApp app on mobile and to WhatsApp Web on desktop.
    const win = window.open(url, "_blank");
    if (win) { try { win.opener = null; } catch (_) { /* cross-origin: ignore */ } }
    else window.location.href = url;

    showStatus("ok", "WhatsApp is opening with your enquiry pre-filled. Just tap Send to deliver it.");
    form.reset();
    Object.values(fields).forEach((f) => { f.classList.remove("is-valid", "is-invalid"); f.removeAttribute("aria-invalid"); });
    if (counter) counter.textContent = `0/${fields.message.getAttribute("maxlength")}`;
    // Nothing is stored: the data only exists in the WhatsApp message the visitor sends.
  });
})();
