/* =========================================================
   DAWNTOWN DETAILING – SCRIPT.JS
   Handles: Navbar scroll, Scroll animations,
            Services carousel, Photo auto-scroll duplicate,
            Reviews carousel, FAQ accordion, Form toast
   ========================================================= */

/* ---- NAVBAR SCROLL ---- */
const navbar = document.getElementById('navbar');
window.addEventListener('scroll', () => {
  navbar.classList.toggle('scrolled', window.scrollY > 40);
});

/* ---- SCROLL ANIMATIONS ---- */
const animEls = document.querySelectorAll('[data-animate]');
const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('animated');
      observer.unobserve(entry.target);
    }
  });
}, { threshold: 0.12, rootMargin: '0px 0px -60px 0px' });
animEls.forEach((el, i) => {
  el.style.transitionDelay = (i % 4) * 0.1 + 's';
  observer.observe(el);
});

/* =========================================================
   SERVICES CAROUSEL  –  3 cards per view (JS-driven widths)
   ========================================================= */
(function () {
  const track   = document.getElementById('svc-track');
  const prevBtn = document.getElementById('svc-prev');
  const nextBtn = document.getElementById('svc-next');
  const dotsWrap = document.getElementById('svc-dots');
  const outer   = track ? track.closest('.carousel-track-outer') : null;
  if (!track || !outer) return;

  const GAP = 24;
  const cards = Array.from(track.querySelectorAll('.service-card'));
  let current = 0;

  const visibleCount = () =>
    window.innerWidth <= 768 ? 1 :
    window.innerWidth <= 1024 ? 2 : 3;

  const maxIndex = () => Math.max(0, cards.length - visibleCount());

  /* --- Set exact card widths based on outer container --- */
  function setCardWidths() {
    const vc      = visibleCount();
    const gap     = vc === 1 ? 0 : GAP;          // no gap needed for 1-card view
    const totalW  = outer.clientWidth;
    const cardW   = (totalW - gap * (vc - 1)) / vc;
    cards.forEach(c => {
      c.style.width    = cardW + 'px';
      c.style.minWidth = cardW + 'px';
    });
    track.style.gap = gap + 'px';                // sync track gap to JS gap
    return cardW;
  }

  /* --- Build dot indicators --- */
  function buildDots() {
    if (!dotsWrap) return;
    dotsWrap.innerHTML = '';
    const total = maxIndex() + 1;
    for (let i = 0; i < total; i++) {
      const dot = document.createElement('button');
      dot.className = 'carousel-dot' + (i === current ? ' active' : '');
      dot.setAttribute('aria-label', 'Go to slide ' + (i + 1));
      dot.addEventListener('click', () => { current = i; updateCarousel(); });
      dotsWrap.appendChild(dot);
    }
  }

  function updateDots() {
    if (!dotsWrap) return;
    dotsWrap.querySelectorAll('.carousel-dot').forEach((d, i) =>
      d.classList.toggle('active', i === current)
    );
  }

  /* --- Slide the track --- */
  function updateCarousel() {
    const vc     = visibleCount();
    const gap    = vc === 1 ? 0 : GAP;
    const cardW  = setCardWidths();
    const offset = current * (cardW + gap);
    track.style.transform = `translateX(-${offset}px)`;
    prevBtn.style.opacity = current === 0 ? '0.35' : '1';
    nextBtn.style.opacity = current >= maxIndex() ? '0.35' : '1';
    updateDots();
  }

  /* --- Button clicks --- */
  nextBtn.addEventListener('click', () => {
    if (current < maxIndex()) { current++; updateCarousel(); }
  });
  prevBtn.addEventListener('click', () => {
    if (current > 0) { current--; updateCarousel(); }
  });

  /* --- Touch / swipe --- */
  let startX = 0;
  track.addEventListener('touchstart', e => { startX = e.touches[0].clientX; }, { passive: true });
  track.addEventListener('touchend', e => {
    const diff = startX - e.changedTouches[0].clientX;
    if (diff > 50 && current < maxIndex()) { current++; updateCarousel(); }
    else if (diff < -50 && current > 0)   { current--; updateCarousel(); }
  });

  /* --- Resize: rebuild dots + recalculate --- */
  let resizeTimer;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      current = Math.min(current, maxIndex());
      buildDots();
      updateCarousel();
    }, 100);
  });

  /* --- Init --- */
  buildDots();
  updateCarousel();
})();

/* =========================================================
   ADVANCED SLIDER – SMOKE-FOCUS, SEAMLESS INFINITE LOOP
   Clone technique: original slides are duplicated at the
   end of the track. When the last clone becomes active we
   silently snap back to the matching real slide — giving a
   perfectly seamless, never-ending loop.
   ========================================================= */
(function () {
  const wrapper = document.querySelector('.slider-wrapper');
  const track   = document.getElementById('adv-slider');
  if (!track || !wrapper) return;

  const origSlides = Array.from(track.querySelectorAll('.slide'));
  if (!origSlides.length) return;

  const origCount = origSlides.length;        // 8 real slides
  const GAP       = 24;
  const TRANS_MS  = 500;                      // matches CSS: .slider { transition: transform 0.5s }

  /* ── Append clones of all originals ─────────────────── */
  origSlides.forEach(s => {
    const clone = s.cloneNode(true);
    clone.classList.remove('active');
    track.appendChild(clone);
  });

  /* allSlides = originals (0‥7) + clones (8‥15) */
  const allSlides = Array.from(track.children);

  /* Start on the original active slide */
  let index = origSlides.findIndex(s => s.classList.contains('active'));
  if (index < 0) index = 0;

  let autoTimer;
  let locked = false;    // prevent double-fire during snap

  /* ── Responsive card count ───────────────────────────── */
  function visibleCount() {
    return window.innerWidth <= 768  ? 1
         : window.innerWidth <= 1024 ? 2
         : 3;
  }

  function cardWidth() {
    const vc = visibleCount();
    return (wrapper.clientWidth - (vc - 1) * GAP) / vc;
  }

  /* ── Set widths on every slide (originals + clones) ──── */
  function setWidths() {
    const w = cardWidth();
    allSlides.forEach(s => { s.style.width = w + 'px'; });
  }

  /* ── Paint active class & translate track ────────────── */
  function paint(animate) {
    if (!animate) {
      track.style.transition = 'none';
      allSlides.forEach(s => s.style.transition = 'none');
    }
    const w   = cardWidth();
    const off = (wrapper.clientWidth / 2) - (index * (w + GAP)) - (w / 2);
    track.style.transform = `translateX(${off}px)`;

    /* Active = current index; also mirror on the original counterpart */
    allSlides.forEach((s, i) => s.classList.toggle('active', i === index));

    if (!animate) {
      /* Force reflow so the browser commits the instant snap */
      void track.offsetWidth;
      track.style.transition = '';
      allSlides.forEach(s => s.style.transition = '');
    }
  }

  function init() { setWidths(); paint(true); }

  /* ── Auto-advance with seamless wrap ─────────────────── */
  function advance() {
    if (locked) return;
    index++;
    paint(true);

    /* If we've just shown a clone, snap back to the real slide */
    if (index >= origCount) {
      locked = true;
      setTimeout(() => {
        index = index - origCount;   // maps clone N → original N
        paint(false);                // instant, no flash
        locked = false;
      }, TRANS_MS + 30);             // wait for CSS transition to finish
    }
  }

  /* ── Click any original slide to jump to it ─────────── */
  origSlides.forEach((s, i) => {
    s.addEventListener('click', () => {
      if (locked) return;
      index = i;
      paint(true);
      resetTimer();
    });
  });

  /* ── Pause on hover ──────────────────────────────────── */
  wrapper.addEventListener('mouseenter', () => clearInterval(autoTimer));
  wrapper.addEventListener('mouseleave', resetTimer);

  function resetTimer() {
    clearInterval(autoTimer);
    autoTimer = setInterval(advance, 3000);
  }

  /* ── Debounced resize ────────────────────────────────── */
  let resizeTimer;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(init, 150);
  });

  init();
  resetTimer();
})();

/* =========================================================
   REVIEWS SLIDER
   Mobile  (≤768px) : 1 card, full-width, swipeable, no smoke
   Desktop (>768px)  : smoke-focus, 3 cards, click-to-focus
   ========================================================= */
(function () {
  const wrapper = document.querySelector('.rev-slider-wrapper');
  const track   = document.getElementById('rev-slider');
  if (!track || !wrapper) return;

  const cards = Array.from(track.querySelectorAll('.review-card'));
  if (!cards.length) return;

  const GAP = 24;
  let index = cards.findIndex(c => c.classList.contains('active'));
  if (index < 0) index = 0;
  let autoTimer;

  /* Responsive: 1 card ≤768px | 2 cards ≤1024px | 3 cards desktop */
  function visibleCount() {
    return window.innerWidth <= 768 ? 1
         : window.innerWidth <= 1024 ? 2
         : 3;
  }

  function isMobile() { return visibleCount() === 1; }

  function effectiveGap() { return isMobile() ? 0 : GAP; }

  function cardWidth() {
    const vc = visibleCount();
    const g  = effectiveGap();
    return (wrapper.clientWidth - g * (vc - 1)) / vc;
  }

  function setWidths() {
    const w = cardWidth();
    cards.forEach(c => {
      c.style.width    = w + 'px';
      c.style.minWidth = w + 'px';
    });
    track.style.gap = effectiveGap() + 'px';
  }

  function updateSlider() {
    const w = cardWidth();
    const g = effectiveGap();
    let off;

    if (isMobile()) {
      /* Simple: slide each card by its full width, no peeking */
      off = -(index * w);
      wrapper.style.overflow = 'hidden';
    } else {
      /* Smoke-focus: centre the active card in the wrapper */
      off = (wrapper.clientWidth / 2) - (index * (w + g)) - (w / 2);
      wrapper.style.overflow = '';
    }

    track.style.transform = `translateX(${off}px)`;
    cards.forEach((c, i) => c.classList.toggle('active', i === index));
  }

  function init() { setWidths(); updateSlider(); }

  /* Click any card to focus it (desktop) */
  cards.forEach((c, i) => {
    c.addEventListener('click', () => { index = i; updateSlider(); resetTimer(); });
  });

  /* ── Touch / swipe ─────────────────────────────────── */
  let touchStartX = 0;
  track.addEventListener('touchstart', e => {
    touchStartX = e.touches[0].clientX;
  }, { passive: true });
  track.addEventListener('touchend', e => {
    const diff = touchStartX - e.changedTouches[0].clientX;
    if (diff > 40 && index < cards.length - 1) { index++; updateSlider(); resetTimer(); }
    else if (diff < -40 && index > 0)           { index--; updateSlider(); resetTimer(); }
  });

  /* Pause on hover (desktop) */
  wrapper.addEventListener('mouseenter', () => clearInterval(autoTimer));
  wrapper.addEventListener('mouseleave', resetTimer);

  function resetTimer() {
    clearInterval(autoTimer);
    autoTimer = setInterval(() => {
      index = (index + 1) % cards.length;
      updateSlider();
    }, 3000);
  }

  let resizeTimer;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(init, 150);
  });

  init();
  resetTimer();
})();

/* =========================================================
   FAQ ACCORDION
   ========================================================= */
function toggleFAQ(btn) {
  const item = btn.closest('.faq-item');
  const isOpen = item.classList.contains('open');

  // Close all
  document.querySelectorAll('.faq-item.open').forEach(el => el.classList.remove('open'));

  // Open clicked (if it wasn't open)
  if (!isOpen) { item.classList.add('open'); }
}

/* =========================================================
   FORM SUBMIT — redirect to Thank You page
   Conversion fires on thank-you.html page load via GTM.
   This ensures 100% accurate tracking — no ghost fires.
   ========================================================= */
function handleForm(e, formId) {
  e.preventDefault();

  /* Capture which form was submitted before reset */
  const formName = formId === 'hero-form' ? 'Hero Booking Form' : 'Contact Form';

  /* Reset form fields */
  document.getElementById(formId).reset();

  /* ── Redirect to Thank You page ──────────────────────────
     GTM fires 'form_submission' event on that page load.
     This is the ONLY point the conversion counts — the user
     must physically see the confirmation page.               */
  window.location.href = 'thank-you.html?src=' + encodeURIComponent(formName);
}

/* =========================================================
   CONVERSION TRACKING — 3 clean events, no duplicates
   All listeners attached once on DOMContentLoaded.
   ========================================================= */
document.addEventListener('DOMContentLoaded', () => {
  window.dataLayer = window.dataLayer || [];

  /* ═══════════════════════════════════════════════════════
     EVENT 1 — CALL CLICK
     Covers ALL tel: links on the page:
       • Navbar "Contact Us Now"
       • CTA Banner "Schedule Your Service"
       • Contact section phone number
       • Floating call button (bottom-right)

     Google Ads Conversion ID : AW-17986636188
     ⚠️  Replace CALL_CONVERSION_LABEL with the label from
         Google Ads → Goals → Conversions → [Call action]
  ═══════════════════════════════════════════════════════ */
  document.querySelectorAll('a[href^="tel:"]').forEach(el => {
    el.addEventListener('click', () => {
      /* GA4 / GTM dataLayer event */
      window.dataLayer.push({
        event        : 'call_click',
        button_label : el.textContent.trim() || el.getAttribute('aria-label') || 'Call Button',
        phone_number : '+91900311338'
      });
      /* Google Ads conversion — fires directly via gtag */
      if (typeof gtag === 'function') {
        gtag('event', 'conversion', {
          'send_to': 'AW-17986636188/CALL_CONVERSION_LABEL'
        });
      }
    });
  });

  /* ═══════════════════════════════════════════════════════
     EVENT 2 — WHATSAPP CLICK
     Covers ALL wa.me links on the page:
       • Floating WhatsApp button (bottom-left)

     Google Ads Conversion ID : AW-17986636188
     ⚠️  Replace WA_CONVERSION_LABEL with the label from
         Google Ads → Goals → Conversions → [WhatsApp action]
  ═══════════════════════════════════════════════════════ */
  document.querySelectorAll('a[href^="https://wa.me/"]').forEach(el => {
    el.addEventListener('click', () => {
      /* GA4 / GTM dataLayer event */
      window.dataLayer.push({
        event        : 'whatsapp_click',
        button_label : el.textContent.trim() || el.getAttribute('aria-label') || 'WhatsApp Button',
        phone_number : '+91900311338'
      });
      /* Google Ads conversion — fires directly via gtag */
      if (typeof gtag === 'function') {
        gtag('event', 'conversion', {
          'send_to': 'AW-17986636188/WA_CONVERSION_LABEL'
        });
      }
    });
  });

  /* ═══════════════════════════════════════════════════════
     EVENT 3 — FORM SUBMISSION
     Conversion fires on thank-you.html page load via gtag.
     No action needed here — see thank-you.html.
  ═══════════════════════════════════════════════════════ */
});

/* =========================================================
   VIDEO FALLBACK – hide fallback if video loads
   ========================================================= */
document.addEventListener('DOMContentLoaded', () => {
  const video = document.querySelector('.brand-video');
  const fallback = document.querySelector('.video-fallback');
  if (video && fallback) {
    video.addEventListener('loadeddata', () => {
      fallback.style.display = 'none';
    });
  }
});
