/* Keep the latest tagged visit within this tab; never mix different campaigns. */
(function () {
  'use strict';
  var key = 'yahont-club-utm-v1';
  var current = new URL(window.location.href);
  var tags = {};
  current.searchParams.forEach(function (value, name) {
    if (/^utm_[a-z0-9_]+$/.test(name) && value) tags[name] = value;
  });
  try {
    if (Object.keys(tags).length) {
      window.sessionStorage.setItem(key, JSON.stringify(tags));
    } else {
      var saved = JSON.parse(window.sessionStorage.getItem(key) || '{}');
      if (saved && typeof saved === 'object') {
        Object.keys(saved).forEach(function (name) {
          if (/^utm_[a-z0-9_]+$/.test(name) && typeof saved[name] === 'string' && saved[name]) {
            tags[name] = saved[name];
          }
        });
      }
    }
  } catch (error) { /* Tracking still works when browser storage is unavailable. */ }

  var frame = document.getElementById('yahontFrame');
  if (frame && frame.hasAttribute('data-club-src')) {
    // Runs on Tilda: transfer only campaign parameters, not arbitrary visitor data.
    var target = new URL(frame.getAttribute('data-club-src'));
    Object.keys(tags).forEach(function (name) { target.searchParams.set(name, tags[name]); });
    frame.src = target.href;
  } else {
    // Runs before GetCourse scripts: their native widgets copy location.search.
    Object.keys(tags).forEach(function (name) { current.searchParams.set(name, tags[name]); });
    if (current.href !== window.location.href) {
      window.history.replaceState(window.history.state, '', current.href);
    }
  }
})();
