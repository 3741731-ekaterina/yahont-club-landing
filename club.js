(function () {
  'use strict';
  // All courses start collapsed; a programme opens in a dismissible dialog.
  var grid = document.getElementById('coursesGrid');
  var cards = Array.from(grid.querySelectorAll('.course-btn'));
  var details = Array.from(document.querySelectorAll('.course-detail'));
  var programme = document.createElement('div');
  programme.className = 'course-program-modal';
  programme.hidden = true;
  programme.innerHTML = '<div class="course-program-dialog" role="dialog" aria-modal="true" tabindex="-1"><button type="button" class="course-program-close" aria-label="Закрыть программу курса">×</button><div class="course-program-body"></div></div>';
  document.body.appendChild(programme);
  var programmeBody = programme.querySelector('.course-program-body');
  var programmeDialog = programme.querySelector('.course-program-dialog');
  var programmeClose = programme.querySelector('.course-program-close');
  var programmeTrigger = null;
  var programmeOverflow = '';
  function closeProgramme() {
    if (programme.hidden) return;
    programme.hidden = true;
    document.body.style.overflow = programmeOverflow;
    details.forEach(function (detail) { detail.hidden = true; detail.classList.remove('open'); });
    cards.forEach(function (card) {
      card.classList.remove('active');
      card.setAttribute('aria-expanded', 'false');
      card.querySelector('.course-toggle').textContent = 'Посмотреть программу ↓';
    });
    if (programmeTrigger) programmeTrigger.focus({preventScroll: true});
  }
  details.forEach(function (detail) { detail.hidden = true; detail.classList.remove('open'); });
  cards.forEach(function (card) {
    card.classList.remove('active');
    card.setAttribute('aria-expanded', 'false');
    card.setAttribute('aria-haspopup', 'dialog');
    card.setAttribute('aria-controls', 'detail-' + card.dataset.course);
    card.querySelector('.course-toggle').textContent = 'Посмотреть программу ↓';
    card.addEventListener('click', function () {
      closeProgramme();
      var detail = document.getElementById('detail-' + card.dataset.course);
      programmeTrigger = card;
      programmeOverflow = document.body.style.overflow;
      programmeBody.appendChild(detail);
      detail.hidden = false;
      detail.classList.add('open');
      var heading = detail.querySelector('h3');
      heading.id = 'programme-title-' + card.dataset.course;
      programmeDialog.setAttribute('aria-labelledby', heading.id);
      card.classList.add('active');
      card.setAttribute('aria-expanded', 'true');
      card.querySelector('.course-toggle').textContent = 'Программа открыта ↑';
      document.body.style.overflow = 'hidden';
      programme.hidden = false;
      programmeDialog.scrollTop = 0;
      programmeClose.focus({preventScroll: true});
    });
  });
  programmeClose.addEventListener('click', closeProgramme);
  programme.addEventListener('click', function (event) { if (event.target === programme) closeProgramme(); });
  document.addEventListener('keydown', function (event) { if (event.key === 'Escape') closeProgramme(); });

  // Strategy screenshots: one full, uncropped image per slide.
  var gallery = document.getElementById('strategyReviews');
  var slides = Array.from(gallery.querySelectorAll('a'));
  var previous = document.getElementById('strategyReviewsPrev');
  var next = document.getElementById('strategyReviewsNext');
  var count = document.getElementById('strategyReviewsCount');
  function currentSlide() {
    return slides.reduce(function (closest, slide, index) {
      return Math.abs(slide.offsetLeft - slides[0].offsetLeft - gallery.scrollLeft) <
        Math.abs(slides[closest].offsetLeft - slides[0].offsetLeft - gallery.scrollLeft) ? index : closest;
    }, 0);
  }
  function updateGallery() {
    var index = currentSlide();
    var image = slides[index].querySelector('img');
    if (image.naturalWidth && image.naturalHeight) {
      var maximum = matchMedia('(max-width: 680px)').matches ? 460 : 440;
      var height = Math.max(120, Math.min(maximum, gallery.clientWidth * image.naturalHeight / image.naturalWidth));
      gallery.style.setProperty('--strategy-gallery-height', Math.round(height) + 'px');
    }
    count.textContent = (index + 1) + ' / ' + slides.length;
    previous.disabled = index === 0;
    next.disabled = index === slides.length - 1;
  }
  function moveGallery(direction) {
    var index = Math.max(0, Math.min(slides.length - 1, currentSlide() + direction));
    gallery.scrollTo({left: slides[index].offsetLeft - slides[0].offsetLeft,
      behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth'});
  }
  previous.addEventListener('click', function () { moveGallery(-1); });
  next.addEventListener('click', function () { moveGallery(1); });
  gallery.addEventListener('scroll', updateGallery, {passive: true});
  slides.forEach(function (slide) { slide.querySelector('img').addEventListener('load', updateGallery); });
  gallery.addEventListener('keydown', function (event) {
    if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
      event.preventDefault();
      moveGallery(event.key === 'ArrowRight' ? 1 : -1);
    }
  });
  window.addEventListener('resize', updateGallery);
  updateGallery();

  // Promotions: one display per tab session, counted only while the page is visible.
  // Timed invitations remain enabled; moving toward browser controls is not a trigger.
  var autoPromotionsEnabled = true;
  var sessionKey = 'yahont-club-promos-v1';
  var buyerKey = 'yahont-club-purchase-clicked-v1';
  var state = {tourSeen: false, lessonSeen: false, finished: false, elapsed: 0};
  try {
    var saved = JSON.parse(sessionStorage.getItem(sessionKey) || 'null');
    if (saved && typeof saved === 'object') {
      ['tourSeen', 'lessonSeen', 'finished'].forEach(function (key) { state[key] = saved[key] === true; });
      if (Number.isFinite(saved.elapsed) && saved.elapsed >= 0) state.elapsed = saved.elapsed;
    }
    if (localStorage.getItem(buyerKey) === '1') state.finished = true;
  } catch (error) { /* In-memory state works if storage is unavailable. */ }
  function save() {
    try { sessionStorage.setItem(sessionKey, JSON.stringify(state)); } catch (error) {}
  }
  var overlay = document.createElement('div');
  overlay.className = 'promo-modal';
  overlay.hidden = true;
  overlay.innerHTML = '<div class="promo-dialog" role="dialog" aria-modal="true" aria-labelledby="promoTitle" aria-describedby="promoText" tabindex="-1"><button class="promo-close" type="button" aria-label="Закрыть предложение">×</button><div class="promo-label">Клуб «Яхонт»</div><h2 id="promoTitle"></h2><div id="promoText"></div><a class="btn btn-primary" target="_blank" rel="noopener noreferrer"></a></div>';
  document.body.appendChild(overlay);
  var close = overlay.querySelector('.promo-close');
  var title = overlay.querySelector('h2');
  var text = overlay.querySelector('#promoText');
  var action = overlay.querySelector('a');
  var current = null;
  var trigger = null;
  var previousOverflow = '';
  var parentVisible = true;
  var lastTick = performance.now();
  var parentOrigin = null;
  try { if (window.parent !== window) parentOrigin = new URL(document.referrer).origin; } catch (error) {}

  function visible() { return !document.hidden && parentVisible; }
  function busy() { return document.querySelector('.payment-modal.open, .mobile-nav.open, .course-program-modal:not([hidden])'); }
  function hide(restoreFocus) {
    if (!current) return;
    overlay.hidden = true;
    current = null;
    document.body.style.overflow = previousOverflow;
    if (restoreFocus && trigger && trigger.isConnected) trigger.focus({preventScroll: true});
  }
  function show(kind, reason) {
    if (!autoPromotionsEnabled || state.finished || current || busy() || !visible()) return false;
    if (kind === 'tour' && (state.tourSeen || state.lessonSeen)) return false;
    if (kind === 'lesson' && state.lessonSeen) return false;
    if (kind === 'tour') {
      state.tourSeen = true;
      title.textContent = reason === 'exit' ? 'Уже уходите?' : 'Посмотрите клуб изнутри';
      text.innerHTML = '<p>Ещё не оставили заявку на вступление? Приглашаю вас на онлайн-экскурсию в клуб «Яхонт».</p><p>За 20 минут вы увидите, как устроен клуб изнутри, познакомитесь с его возможностями и поймёте, подходит ли он вам.</p>';
      action.textContent = 'Онлайн-экскурсия в клуб';
      action.href = 'https://youtu.be/kokOmS5_dXg';
    } else {
      state.lessonSeen = true;
      title.textContent = 'Заберите один урок из клуба бесплатно';
      text.innerHTML = '<p>Хотите оценить качество материалов клуба? Открываю бесплатный доступ к уроку «Финансовый дашборд с ИИ за 30 минут».</p><p>На практике вы научитесь создавать финансовый дашборд с помощью нейросетей.</p><p>Нажмите «Смотреть урок», чтобы перейти в Telegram-бот и получить доступ.</p>';
      action.textContent = 'Смотреть урок';
      action.href = 'https://t.me/finyahontovaBot?start=dl-1791200473287672dc770a';
    }
    current = kind;
    trigger = document.activeElement;
    previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    overlay.hidden = false;
    close.focus({preventScroll: true});
    save();
    return true;
  }
  close.addEventListener('click', function () {
    var wasTour = current === 'tour';
    hide(true);
    if (wasTour) show('lesson', 'close');
    else { state.finished = true; save(); }
  });
  action.addEventListener('click', function () {
    // Clicking the invitation must not start another invitation.
    state.finished = true;
    save();
    hide(true);
  });
  document.addEventListener('keydown', function (event) {
    if (current && event.key === 'Escape') {
      var wasLesson = current === 'lesson';
      hide(true);
      if (wasLesson) state.finished = true;
      save();
    }
    var dialog = document.querySelector('.payment-modal.open, .course-program-modal:not([hidden])') || (!overlay.hidden && overlay);
    if (dialog && event.key === 'Tab') {
      var stops = Array.from(dialog.querySelectorAll('button, a[href], iframe, input, select, textarea, [tabindex="0"]'))
        .filter(function (el) { return el.getClientRects().length; });
      if (!stops.length) return;
      var first = stops[0], last = stops[stops.length - 1];
      if (event.shiftKey && (document.activeElement === first || !dialog.contains(document.activeElement))) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    }
  });
  function suppressForPurchase() {
    state.finished = true;
    save();
    try { localStorage.setItem(buyerKey, '1'); } catch (error) {}
    hide(false);
  }
  window.addEventListener('yahont:purchase', suppressForPurchase);
  document.addEventListener('click', function (event) {
    if (event.target.closest('a.btn[href="#pricing"]')) suppressForPurchase();
  });
  function accountTime() {
    var now = performance.now();
    if (visible()) state.elapsed += Math.max(0, now - lastTick);
    lastTick = now;
  }
  function tick() {
    accountTime();
    save();
    if (!visible() || state.finished) return;
    if (state.elapsed >= 20 * 60 * 1000) show('lesson', 'timer');
    else if (state.elapsed >= 10 * 60 * 1000) show('tour', 'timer');
  }
  document.addEventListener('visibilitychange', function () {
    // Charge the just-ended visible segment, not the entire hidden interval.
    var now = performance.now();
    if (document.hidden && parentVisible) state.elapsed += Math.max(0, now - lastTick);
    lastTick = now;
    save();
  });
  window.addEventListener('pagehide', function () { accountTime(); save(); });
  window.addEventListener('message', function (event) {
    if (!parentOrigin || event.source !== window.parent || event.origin !== parentOrigin || !event.data) return;
    if (event.data.type === 'yahont:visibility' && typeof event.data.visible === 'boolean') {
      accountTime();
      parentVisible = event.data.visible;
      lastTick = performance.now();
    }
  });
  if (parentOrigin) window.parent.postMessage({type: 'yahont:ready'}, parentOrigin);
  if (autoPromotionsEnabled) setInterval(tick, 1000);
})();
