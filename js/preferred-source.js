/* Google "Preferred Sources" footer button.
 * Manual/custom flow: our styled button opens Google's seamless add-preferred-
 * source popup via publisher.js. Falls back to the deeplink if the library
 * hasn't loaded (ad-blockers, async race). Loaded via <script defer>. */
(function () {
  'use strict';
  var ATTR = 'data-sr-preferred-source';
  var DEEPLINK = 'https://www.google.com/preferences/source?q=' + encodeURIComponent(location.hostname);
  var psInstance = null;

  // Google's queue pattern: drained on lib load, or hijacked by the lib so a
  // late push fires immediately. Either order works.
  (self.PREFERRED_SOURCE = self.PREFERRED_SOURCE || []).push(function (ps) {
    var root = document.documentElement;
    var dark = root.classList.contains('theme-dark') || root.classList.contains('dark') ||
      (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches);
    try { ps.init({ theme: dark ? 'dark' : 'light', lang: 'en' }); } catch (_) {}
    psInstance = ps;
  });

  function markAdded(btn) {
    btn.setAttribute('data-added', 'true');
    btn.classList.add('sr-preferred-btn--added');
    var label = btn.querySelector('.sr-preferred-label');
    if (label) label.textContent = '✓ Added to Google';
  }

  function onClick(e) {
    if (psInstance && typeof psInstance.addPreferredSource === 'function') {
      try {
        var p = psInstance.addPreferredSource();
        if (p && typeof p.then === 'function') {
          p.then(function (res) {
            var st = null;
            try { st = res && res.getStatus && res.getStatus(); } catch (_) {}
            // enum: 3=SUCCESS, 1=ALREADY_ADDED, 2=INELIGIBLE
            if (st === 3 || st === 1) markAdded(e.currentTarget);
          }).catch(function () { /* popup closed — leave button as-is */ });
        }
        return;
      } catch (_) { /* fall through to deeplink */ }
    }
    // Library blocked/not ready → open the manual deeplink (inside user gesture).
    window.open(DEEPLINK, '_blank', 'noopener');
  }

  function bind() {
    var nodes = document.querySelectorAll('[' + ATTR + ']');
    for (var i = 0; i < nodes.length; i++) {
      if (nodes[i].__srPsBound) continue;
      nodes[i].__srPsBound = true;
      nodes[i].addEventListener('click', onClick);
    }
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', bind);
  else bind();
})();
