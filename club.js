(function () {
  'use strict';
  // Place the selected programme directly below its row (below its card on mobile).
  var grid = document.getElementById('coursesGrid');
  // The expanded curriculum is taller than a viewport; don't hide its whole grid
  // behind an intersection ratio which can never be reached on small screens.
  grid.classList.remove('reveal');
  var cards = Array.from(grid.querySelectorAll('.course-btn'));
  var details = Array.from(document.querySelectorAll('.course-detail'));
  var parking = document.createElement('div');
  parking.hidden = true;
  grid.after(parking);
  var selected = 'c1';
  function positionProgramme() {
    details.forEach(function (detail) {
      var open = detail.id === 'detail-' + selected;
      detail.hidden = !open;
      detail.classList.toggle('open', open);
      parking.appendChild(detail);
    });
    cards.forEach(function (card) {
      var open = card.dataset.course === selected;
      card.classList.toggle('active', open);
      card.setAttribute('aria-expanded', String(open));
      card.setAttribute('aria-controls', 'detail-' + card.dataset.course);
      card.querySelector('.course-toggle').textContent = open ? 'Свернуть программу ↑' : 'Посмотреть программу ↓';
    });
    if (!selected) return;
    var index = cards.findIndex(function (card) { return card.dataset.course === selected; });
    var columns = getComputedStyle(grid).gridTemplateColumns.split(' ').length;
    var end = Math.min(cards.length - 1, Math.floor(index / columns) * columns + columns - 1);
    cards[end].after(document.getElementById('detail-' + selected));
  }
  cards.forEach(function (card) {
    card.addEventListener('click', function () {
      selected = selected === card.dataset.course ? null : card.dataset.course;
      positionProgramme();
      if (selected) document.getElementById('detail-' + selected).scrollIntoView({behavior: 'smooth', block: 'start'});
    });
  });
  positionProgramme();
  var resizeFrame;
  window.addEventListener('resize', function () {
    cancelAnimationFrame(resizeFrame);
    resizeFrame = requestAnimationFrame(positionProgramme);
  });

  // Promotions: one display per tab session, counted only while the page is visible.
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
  function busy() { return document.querySelector('.payment-modal.open, .mobile-nav.open'); }
  function hide(restoreFocus) {
    if (!current) return;
    overlay.hidden = true;
    current = null;
    document.body.style.overflow = previousOverflow;
    if (restoreFocus && trigger && trigger.isConnected) trigger.focus({preventScroll: true});
  }
  function show(kind, reason) {
    if (state.finished || current || busy() || !visible()) return false;
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
    var dialog = document.querySelector('.payment-modal.open') || (!overlay.hidden && overlay);
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
    if (event.data.type === 'yahont:exit') show('tour', 'exit');
  });
  if (parentOrigin) window.parent.postMessage({type: 'yahont:ready'}, parentOrigin);
  document.addEventListener('mouseout', function (event) {
    if (window.parent === window && !event.relatedTarget && event.clientY <= 0 && matchMedia('(hover: hover) and (pointer: fine)').matches) show('tour', 'exit');
  });
  setInterval(tick, 1000);
})();
