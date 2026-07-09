const currentPath = window.location.pathname.replace(/\/$/, "") || "/";

document.querySelectorAll(".site-nav a").forEach((link) => {
  const linkPath = new URL(link.href).pathname.replace(/\/$/, "") || "/";
  if (linkPath === currentPath) {
    link.setAttribute("aria-current", "page");
  }
});

document.querySelectorAll(".contact-form").forEach((form) => {
  const status = form.querySelector("[data-form-status]");
  form.addEventListener("submit", () => {
    if (status) {
      status.textContent = "Skickar formuläret…";
    }
  });
});

/* ============================================================
   PREMIUM BACKGROUND ANIMATIONS - JavaScript
   ============================================================ */

const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

// Mouse-following gradient orbs
function initMouseOrbs() {
  if (prefersReducedMotion) return;
  
  const container = document.querySelector(".mouse-orb-container");
  if (!container) return;
  
  const orbs = container.querySelectorAll(".mouse-orb");
  let mouseX = 0;
  let mouseY = 0;
  let currentX = 0;
  let currentY = 0;
  
  // Track mouse position
  document.addEventListener("mousemove", (e) => {
    mouseX = e.clientX;
    mouseY = e.clientY;
  });
  
  // Touch support
  document.addEventListener("touchmove", (e) => {
    if (e.touches[0]) {
      mouseX = e.touches[0].clientX;
      mouseY = e.touches[0].clientY;
    }
  }, { passive: true });
  
  // Click/tap burst effect
  document.addEventListener("click", (e) => {
    orbs.forEach((orb) => {
      orb.style.left = e.clientX + "px";
      orb.style.top = e.clientY + "px";
      orb.classList.add("burst");
      setTimeout(() => orb.classList.remove("burst"), 600);
    });
  });
  
  // Touch burst
  document.addEventListener("touchstart", (e) => {
    if (e.touches[0]) {
      const x = e.touches[0].clientX;
      const y = e.touches[0].clientY;
      orbs.forEach((orb) => {
        orb.style.left = x + "px";
        orb.style.top = y + "px";
        orb.classList.add("burst");
        setTimeout(() => orb.classList.remove("burst"), 600);
      });
    }
  }, { passive: true });
  
  // Smooth follow animation
  function animateOrbs() {
    // Smooth interpolation for each orb with different speeds
    orbs.forEach((orb, index) => {
      const speed = [0.15, 0.08, 0.04][index]; // Primary, secondary, tertiary
      currentX += (mouseX - currentX) * speed;
      currentY += (mouseY - currentY) * speed;
      
      orb.style.left = currentX + "px";
      orb.style.top = currentY + "px";
      orb.style.opacity = "0.6";
    });
    
    requestAnimationFrame(animateOrbs);
  }
  
  // Start animation
  requestAnimationFrame(animateOrbs);
}

// CSS-only constellation stars (generates stars dynamically)
function initConstellation() {
  if (prefersReducedMotion) return;
  
  const container = document.querySelector(".constellation-css");
  if (!container) return;
  
  const starCount = 35;
  const colors = [
    "rgba(31, 111, 82, 0.6)",
    "rgba(45, 95, 122, 0.6)",
    "rgba(189, 116, 29, 0.5)",
    "rgba(31, 111, 82, 0.4)",
    "rgba(45, 95, 122, 0.4)"
  ];
  
  for (let i = 0; i < starCount; i++) {
    const star = document.createElement("div");
    star.className = "star";
    star.style.cssText = `
      position: absolute;
      width: ${2 + Math.random() * 3}px;
      height: ${2 + Math.random() * 3}px;
      border-radius: 50%;
      background: ${colors[Math.floor(Math.random() * colors.length)]};
      left: ${Math.random() * 100}%;
      top: ${Math.random() * 100}%;
      animation: star-twinkle ${2 + Math.random() * 3}s ease-in-out infinite;
      animation-delay: ${Math.random() * 2}s;
      --star-angle: ${Math.random() * 360}deg;
      will-change: opacity, transform;
    `;
    
    // Add connection line pseudo-element via style
    star.addEventListener("mouseenter", () => {
      star.style.setProperty("--connection-opacity", "1");
    });
    star.addEventListener("mouseleave", () => {
      star.style.setProperty("--connection-opacity", "0");
    });
    star.addEventListener("focus", () => {
      star.style.setProperty("--connection-opacity", "1");
    });
    star.addEventListener("blur", () => {
      star.style.setProperty("--connection-opacity", "0");
    });
    
    container.appendChild(star);
  }
}

// Add constellation hover connection lines via CSS custom properties
function addConstellationStyles() {
  if (prefersReducedMotion) return;
  
  const style = document.createElement("style");
  style.textContent = `
    .constellation-css .star::before {
      content: "";
      position: absolute;
      top: 50%;
      left: 50%;
      width: 1px;
      height: 150px;
      background: linear-gradient(180deg, 
        rgba(31, 111, 82, 0) 0%, 
        rgba(31, 111, 82, 0.15) 50%, 
        rgba(31, 111, 82, 0) 100%);
      transform-origin: top center;
      transform: translateX(-50%) rotate(var(--star-angle));
      opacity: var(--connection-opacity, 0);
      transition: opacity 0.3s ease;
      pointer-events: none;
    }
    
    .constellation-css .star:hover::before,
    .constellation-css .star:focus::before {
      opacity: 1;
    }
    
    .constellation-css.dark .star::before {
      background: linear-gradient(180deg, 
        rgba(45, 95, 122, 0) 0%, 
        rgba(45, 95, 122, 0.15) 50%, 
        rgba(189, 116, 29, 0.15) 100%, 
        rgba(45, 95, 122, 0) 100%);
    }
  `;
  document.head.appendChild(style);
}

// Intersection observer for section-specific animations
function initSectionAnimations() {
  if (prefersReducedMotion) return;
  
  const sections = document.querySelectorAll("section");
  
  const sectionObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("section-visible");
        
        // Update mouse orb colors for dark sections
        const orbs = document.querySelectorAll(".mouse-orb");
        if (entry.target.classList.contains("cta-section") || 
            entry.target.classList.contains("site-footer")) {
          orbs.forEach(orb => orb.classList.add("dark"));
        } else {
          orbs.forEach(orb => orb.classList.remove("dark"));
        }
      } else {
        entry.target.classList.remove("section-visible");
      }
    });
  }, {
    rootMargin: "0px",
    threshold: 0.1
  });
  
  sections.forEach(section => sectionObserver.observe(section));
}

// Initialize all premium animations
function initPremiumAnimations() {
  if (prefersReducedMotion) return;
  
  // Small delay to ensure DOM is ready
  setTimeout(() => {
    initMouseOrbs();
    initConstellation();
    addConstellationStyles();
    initSectionAnimations();
  }, 100);
}

// Initialize on DOM ready
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initPremiumAnimations);
} else {
  initPremiumAnimations();
}

/* ============================================================
   INTERSECTION OBSERVER FOR STAGGERED ENTRANCE ANIMATIONS
   ============================================================ */

// ... rest of existing code

if (!prefersReducedMotion) {
  // Observe individual elements with entrance-animate class
  const entranceObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("visible");
          entranceObserver.unobserve(entry.target);
        }
      });
    },
    {
      rootMargin: "0px 0px -50px 0px",
      threshold: 0.1,
    }
  );

  document.querySelectorAll(".entrance-animate").forEach((el) => {
    entranceObserver.observe(el);
  });

  // Observe sections for staggered card animations
  const sectionObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("visible");
          sectionObserver.unobserve(entry.target);
        }
      });
    },
    {
      rootMargin: "0px 0px -80px 0px",
      threshold: 0.1,
    }
  );

  document.querySelectorAll(".section-entrance").forEach((el) => {
    sectionObserver.observe(el);
  });
} else {
  // Reduced motion: show all immediately
  document.querySelectorAll(".entrance-animate").forEach((el) => {
    el.classList.add("visible");
    el.style.opacity = "1";
  });
  document.querySelectorAll(".section-entrance .entrance-animate").forEach((el) => {
    el.style.opacity = "1";
  });
}

/* ============================================================
   3D TILT EFFECT ON CARDS (MOUSE MOVE)
   ============================================================ */

function initTiltEffect() {
  if (prefersReducedMotion) return;

  const tiltElements = document.querySelectorAll(".service-card, .price-card, .card, .case-card, .form-panel");

  tiltElements.forEach((card) => {
    card.classList.add("tilt-3d");
    card.style.transformStyle = "preserve-3d";
    card.style.perspective = "1000px";

    // Add inner wrapper for 3D depth if not present
    if (!card.querySelector(".tilt-3d-inner")) {
      const inner = document.createElement("div");
      inner.className = "tilt-3d-inner";
      while (card.firstChild) {
        inner.appendChild(card.firstChild);
      }
      card.appendChild(inner);
    }
  });

  document.addEventListener("mousemove", (e) => {
    tiltElements.forEach((card) => {
      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      // Only apply tilt when mouse is over the card
      if (x >= 0 && x <= rect.width && y >= 0 && y <= rect.height) {
        const centerX = rect.width / 2;
        const centerY = rect.height / 2;
        const rotateX = ((y - centerY) / centerY) * -8; // max 8deg
        const rotateY = ((x - centerX) / centerX) * 8;  // max 8deg

        card.style.setProperty("--rotate-x", `${rotateX}deg`);
        card.style.setProperty("--rotate-y", `${rotateY}deg`);
      } else {
        // Reset when mouse leaves
        card.style.setProperty("--rotate-x", "0deg");
        card.style.setProperty("--rotate-y", "0deg");
      }
    });
  });

  // Reset on mouse leave
  document.addEventListener("mouseleave", () => {
    tiltElements.forEach((card) => {
      card.style.setProperty("--rotate-x", "0deg");
      card.style.setProperty("--rotate-y", "0deg");
    });
  });
}

// Initialize tilt effect after DOM is ready
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initTiltEffect);
} else {
  initTiltEffect();
}

/* ============================================================
   ENHANCED CARD INTERACTIONS
   ============================================================ */

function initCardInteractions() {
  if (prefersReducedMotion) return;

  const cards = document.querySelectorAll(".service-card, .price-card, .card, .case-card");

  cards.forEach((card) => {
    // Add shimmer sweep class
    card.classList.add("shimmer-sweep-subtle");

    // Add border glow class
    card.classList.add("border-glow");

    // Add card lift class
    card.classList.add("card-lift");
    card.classList.add("layered-shadows");

    // Featured price card gets intense glow
    if (card.classList.contains("featured")) {
      card.classList.add("intense");
    }
  });
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initCardInteractions);
} else {
  initCardInteractions();
}

/* ============================================================
   TESTIMONIAL SLIDER / CAROUSEL
   ============================================================ */

async function initTestimonialSlider() {
  const slider = document.querySelector('.testimonial-slider');
  if (!slider) return;

  // Load testimonials from JSON
  let testimonials = [];
  try {
    const response = await fetch('/testimonials.json');
    if (response.ok) {
      const data = await response.json();
      testimonials = data.testimonials || [];
    }
  } catch (e) {
    console.warn('Could not load testimonials.json, using fallback');
  }

  // Fallback testimonials if JSON fails to load
  if (testimonials.length === 0) {
    testimonials = [
      {
        quote: 'Fick text till tre produkter på en dag. Tydligare rubriker, bättre beskrivningar och kunder ställer färre frågor.',
        author: 'Erik',
        role: 'Köperiet i Alvesta'
      },
      {
        quote: 'Startsidan på hemsidan var en välkommen-text. Nu står det vad vi gör och vad kunden ska göra näst. Färre frågor på mail, fler besök i butik.',
        author: 'Maria',
        role: 'Blomsterbutik i Växjö'
      },
      {
        quote: 'Skickade en bild på min gamla produktbild. Fick tillbaka förslag på bildfix och en text som faktiskt säljer produkten. Tryckte ut och hängde upp i butiken samma vecka.',
        author: 'Johan',
        role: 'Verktygsshop i Ljungby'
      }
    ];
  }

  // Build slider HTML
  const track = document.createElement('div');
  track.className = 'testimonial-slider-track';
  track.setAttribute('role', 'list');
  track.setAttribute('aria-label', 'Ömdömen');

  testimonials.forEach((testimonial, index) => {
    const slide = document.createElement('div');
    slide.className = 'testimonial-slide';
    slide.setAttribute('role', 'listitem');
    slide.setAttribute('tabindex', '0');
    slide.innerHTML = `
      <article class="testimonial-card entrance-animate stagger-${(index % 3) + 1}">
        <blockquote>
          <p>${testimonial.quote}</p>
        </blockquote>
        <footer>
          <cite>${testimonial.author}, ${testimonial.role}</cite>
        </footer>
      </article>
    `;
    track.appendChild(slide);
  });

  slider.innerHTML = '';
  slider.appendChild(track);

  // Create navigation
  const nav = document.createElement('div');
  nav.className = 'testimonial-slider-nav';
  nav.setAttribute('role', 'navigation');
  nav.setAttribute('aria-label', 'Ömdömen navigation');

  const prevBtn = document.createElement('button');
  prevBtn.className = 'testimonial-slider-arrow';
  prevBtn.setAttribute('aria-label', 'Föregående ömdöme');
  prevBtn.setAttribute('type', 'button');
  prevBtn.innerHTML = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M15 18l-6-6 6-6" stroke="currentColor"/>
    </svg>
  `;

  const dotsContainer = document.createElement('div');
  dotsContainer.className = 'testimonial-slider-dots';
  dotsContainer.setAttribute('role', 'tablist');
  dotsContainer.setAttribute('aria-label', 'Välj ömdöme');

  testimonials.forEach((_, index) => {
    const dot = document.createElement('button');
    dot.className = 'testimonial-slider-dot' + (index === 0 ? ' active' : '');
    dot.setAttribute('role', 'tab');
    dot.setAttribute('aria-label', `Ömdöme ${index + 1}`);
    dot.setAttribute('aria-selected', index === 0 ? 'true' : 'false');
    dot.setAttribute('tabindex', index === 0 ? '0' : '-1');
    dot.dataset.index = index;
    dotsContainer.appendChild(dot);
  });

  const nextBtn = document.createElement('button');
  nextBtn.className = 'testimonial-slider-arrow';
  nextBtn.setAttribute('aria-label', 'Nästa ömdöme');
  nextBtn.setAttribute('type', 'button');
  nextBtn.innerHTML = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M9 6l6 6-6 6" stroke="currentColor"/>
    </svg>
  `;

  nav.appendChild(prevBtn);
  nav.appendChild(dotsContainer);
  nav.appendChild(nextBtn);
  slider.appendChild(nav);

  // Slider logic
  const slides = track.querySelectorAll('.testimonial-slide');
  const dots = dotsContainer.querySelectorAll('.testimonial-slider-dot');
  let currentIndex = 0;
  let isDragging = false;
  let startX = 0;
  let currentTranslate = 0;
  let prevTranslate = 0;
  let animationId = 0;

  const slideWidth = () => slides[0]?.offsetWidth + 16 || 0; // width + gap
  const maxIndex = Math.max(0, slides.length - getSlidesPerView());
  const getSlidesPerView = () => {
    if (window.innerWidth >= 1024) return 3;
    if (window.innerWidth >= 640) return 2;
    return 1;
  };

  function updateSlider(animate = true) {
    const perView = getSlidesPerView();
    const maxIdx = Math.max(0, slides.length - perView);
    currentIndex = Math.min(currentIndex, maxIdx);
    
    const translateX = -currentIndex * slideWidth();
    track.style.transition = animate ? 'transform 0.4s cubic-bezier(0.16, 1, 0.3, 1)' : 'none';
    track.style.transform = `translateX(${translateX}px)`;
    
    // Update dots
    dots.forEach((dot, i) => {
      const isActive = i === currentIndex;
      dot.classList.toggle('active', isActive);
      dot.setAttribute('aria-selected', isActive);
      dot.setAttribute('tabindex', isActive ? '0' : '-1');
    });

    // Update arrows
    prevBtn.disabled = currentIndex === 0;
    nextBtn.disabled = currentIndex >= maxIdx;
  }

  function goToSlide(index) {
    currentIndex = index;
    updateSlider();
  }

  function goPrev() {
    if (currentIndex > 0) {
      currentIndex--;
      updateSlider();
    }
  }

  function goNext() {
    const perView = getSlidesPerView();
    const maxIdx = Math.max(0, slides.length - perView);
    if (currentIndex < maxIdx) {
      currentIndex++;
      updateSlider();
    }
  }

  // Dot click handlers
  dots.forEach((dot, index) => {
    dot.addEventListener('click', () => goToSlide(index));
    dot.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        goToSlide(index);
      }
    });
  });

  // Arrow click handlers
  prevBtn.addEventListener('click', goPrev);
  nextBtn.addEventListener('click', goNext);

  // Keyboard navigation for slides
  track.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowLeft') {
      e.preventDefault();
      goPrev();
    } else if (e.key === 'ArrowRight') {
      e.preventDefault();
      goNext();
    }
  });

  // Touch/swipe support
  function getPositionX(event) {
    return event.type.includes('mouse') ? event.pageX : event.touches[0].clientX;
  }

  function dragStart(event) {
    if (event.type === 'mousedown' && event.button !== 0) return;
    const target = event.target.closest('.testimonial-slider-arrow, .testimonial-slider-dot');
    if (target) return;
    
    isDragging = true;
    startX = getPositionX(event);
    prevTranslate = -currentIndex * slideWidth();
    slider.classList.add('dragging');
    track.style.transition = 'none';
    cancelAnimationFrame(animationId);
  }

  function dragMove(event) {
    if (!isDragging) return;
    event.preventDefault();
    const currentX = getPositionX(event);
    const diff = currentX - startX;
    currentTranslate = prevTranslate + diff;
    track.style.transform = `translateX(${currentTranslate}px)`;
  }

  function dragEnd() {
    if (!isDragging) return;
    isDragging = false;
    slider.classList.remove('dragging');
    
    const movedBy = currentTranslate - prevTranslate;
    const threshold = slideWidth() * 0.15; // 15% threshold
    
    if (movedBy < -threshold && currentIndex < maxIndex) {
      currentIndex++;
    } else if (movedBy > threshold && currentIndex > 0) {
      currentIndex--;
    }
    
    updateSlider();
  }

  slider.addEventListener('mousedown', dragStart);
  slider.addEventListener('touchstart', dragStart, { passive: true });
  window.addEventListener('mousemove', dragMove);
  window.addEventListener('touchmove', dragMove, { passive: false });
  window.addEventListener('mouseup', dragEnd);
  window.addEventListener('touchend', dragEnd);

  // Handle resize
  let resizeTimeout;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(() => {
      updateSlider(false);
    }, 150);
  });

  // Initialize
  updateSlider(false);

  // Observe entrance animations
  if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
        }
      });
    }, { rootMargin: '0px 0px -50px 0px', threshold: 0.1 });

    track.querySelectorAll('.entrance-animate').forEach((el) => observer.observe(el));
  } else {
    track.querySelectorAll('.entrance-animate').forEach((el) => {
      el.classList.add('visible');
      el.style.opacity = '1';
    });
  }
}

// Initialize testimonial slider on DOM ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initTestimonialSlider);
} else {
  initTestimonialSlider();
}