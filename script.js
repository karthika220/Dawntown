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
    window.innerWidth <= 600 ? 1 :
    window.innerWidth <= 1024 ? 2 : 3;

  const maxIndex = () => Math.max(0, cards.length - visibleCount());

  /* --- Set exact card widths based on outer container --- */
  function setCardWidths() {
    const vc      = visibleCount();
    const totalW  = outer.clientWidth;
    const cardW   = (totalW - GAP * (vc - 1)) / vc;
    cards.forEach(c => {
      c.style.width    = cardW + 'px';
      c.style.minWidth = cardW + 'px';
    });
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
    const cardW  = setCardWidths();
    const offset = current * (cardW + GAP);
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
   ADVANCED SLIDER – SMOKE-FOCUS, RESPONSIVE CARDS PER VIEW
   ========================================================= */
(function () {
  const wrapper = document.querySelector('.slider-wrapper');
  const track   = document.getElementById('adv-slider');
  if (!track || !wrapper) return;

  const slides = Array.from(track.querySelectorAll('.slide'));
  if (!slides.length) return;

  const GAP = 24;
  let index = slides.findIndex(s => s.classList.contains('active'));
  if (index < 0) index = 0;
  let autoTimer;

  /* Responsive: 1 card ≤480px | 2 cards ≤1024px | 3 cards desktop */
  function visibleCount() {
    return window.innerWidth <= 480 ? 1
         : window.innerWidth <= 1024 ? 2
         : 3;
  }

  /* Card width fills exactly visibleCount cards in the wrapper */
  function cardWidth() {
    const vc = visibleCount();
    return (wrapper.clientWidth - (vc - 1) * GAP) / vc;
  }

  /* Set every slide's width */
  function setWidths() {
    const w = cardWidth();
    slides.forEach(s => { s.style.width = w + 'px'; });
  }

  /* Translate the track so the active card is centred in the wrapper */
  function updateSlider() {
    const w   = cardWidth();
    const off = (wrapper.clientWidth / 2) - (index * (w + GAP)) - (w / 2);
    track.style.transform = `translateX(${off}px)`;

    slides.forEach((s, i) => {
      s.classList.toggle('active', i === index);
    });
  }

  function init() {
    setWidths();
    updateSlider();
  }

  /* Click any card to focus it */
  slides.forEach((s, i) => {
    s.addEventListener('click', () => {
      index = i;
      updateSlider();
      resetTimer();
    });
  });

  /* Pause on hover */
  wrapper.addEventListener('mouseenter', () => clearInterval(autoTimer));
  wrapper.addEventListener('mouseleave', resetTimer);

  function resetTimer() {
    clearInterval(autoTimer);
    autoTimer = setInterval(() => {
      index = (index + 1) % slides.length;
      updateSlider();
    }, 3000);
  }

  /* Debounced resize */
  let resizeTimer;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(init, 150);
  });

  init();
  resetTimer();
})();

/* =========================================================
   REVIEWS SLIDER – SMOKE-FOCUS, RESPONSIVE CARDS PER VIEW
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

  /* Responsive: 1 card ≤480px | 2 cards ≤1024px | 3 cards desktop */
  function visibleCount() {
    return window.innerWidth <= 480 ? 1
         : window.innerWidth <= 1024 ? 2
         : 3;
  }

  function cardWidth() {
    const vc = visibleCount();
    return (wrapper.clientWidth - (vc - 1) * GAP) / vc;
  }

  function setWidths() {
    const w = cardWidth();
    cards.forEach(c => { c.style.width = w + 'px'; });
  }

  function updateSlider() {
    const w   = cardWidth();
    const off = (wrapper.clientWidth / 2) - (index * (w + GAP)) - (w / 2);
    track.style.transform = `translateX(${off}px)`;
    cards.forEach((c, i) => c.classList.toggle('active', i === index));
  }

  function init() { setWidths(); updateSlider(); }

  cards.forEach((c, i) => {
    c.addEventListener('click', () => { index = i; updateSlider(); resetTimer(); });
  });

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
   FORM SUBMIT – TOAST + GA4 / GOOGLE ADS TRACKING
   ========================================================= */
function handleForm(e, formId) {
  e.preventDefault();
  const toast = document.getElementById('toast');
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 4000);

  /* ── GA4: generate_lead ──
     GTM trigger: Custom Event = generate_lead
     GA4 tag: Event name = generate_lead  */
  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push({
    event: 'generate_lead',
    form_id: formId,
    form_name: formId === 'hero-form' ? 'Hero Booking Form' : 'Contact Form'
  });

  /* ── Google Ads Conversion (form lead) ──
     GTM trigger: Custom Event = generate_lead
     Google Ads Conversion tag: Conversion ID = AW-XXXXXXXXXX / Label = xxxx  */
  window.dataLayer.push({
    event: 'ads_conversion_lead',
    send_to: 'AW-XXXXXXXXXX/xxxxxxxxxxxxxxxxxxxx'   // ← replace with your Conversion ID/Label
  });

  // Reset form
  document.getElementById(formId).reset();
}

/* =========================================================
   GTM / GA4 — CLICK EVENT TRACKING
   (runs after DOM is ready so all elements exist)
   ========================================================= */
document.addEventListener('DOMContentLoaded', () => {
  window.dataLayer = window.dataLayer || [];

  /* ── 1. CALL CLICK ──────────────────────────────────────
     Fires on every tel: link (navbar, floating button, etc.)
     GA4 Event : call_click
     Google Ads: ads_conversion_call  */
  document.querySelectorAll('a[href^="tel:"]').forEach(el => {
    el.addEventListener('click', () => {
      window.dataLayer.push({
        event: 'call_click',
        phone_number: el.getAttribute('href').replace('tel:', '')
      });
      /* Google Ads call conversion */
      window.dataLayer.push({
        event: 'ads_conversion_call',
        send_to: 'AW-XXXXXXXXXX/xxxxxxxxxxxxxxxxxxxx'  // ← replace
      });
    });
  });

  /* ── 2. WHATSAPP CLICK ──────────────────────────────────
     Fires on the floating WhatsApp button
     GA4 Event : whatsapp_click  */
  const waBtn = document.querySelector('.floating-whatsapp');
  if (waBtn) {
    waBtn.addEventListener('click', () => {
      window.dataLayer.push({ event: 'whatsapp_click' });
    });
  }

  /* ── 3. CTA / BOOK APPOINTMENT CLICK ───────────────────
     Fires on all "Book Your Appointment" scroll-to-form links
     GA4 Event : cta_click  */
  document.querySelectorAll('a[href="#contact"]').forEach(el => {
    el.addEventListener('click', () => {
      window.dataLayer.push({
        event: 'cta_click',
        cta_text: el.textContent.trim()
      });
    });
  });
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
