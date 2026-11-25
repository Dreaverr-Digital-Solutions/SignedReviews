// First-party visit tracker for signedreviews.com (see /privacy/ and platform/ANALYTICS.md).
// build.js inlines this file into every page, replacing __SR_FPA_CONFIG__ with the client part of
// analytics/analytics.config.json. It sends small JSON beacons to /api/e, which the apex Worker
// forwards to our own database together with the request's IP address and approximate location.
// Reports: page views, clicks (sign-up buttons are the conversions), the custom events of the
// tracking plan, choices, scroll depth, engaged time, Core Web Vitals and JavaScript errors.
// Nothing typed into a field is ever read.
// Not sent at all when the browser sends Do Not Track or Global Privacy Control, for automated
// browsers, outside signedreviews.com (dev server, previews), or after opting out with
// ?sr-track=off (stored in this browser's local storage; ?sr-track=on reverses it).
// Identity: a random visitor id in local storage and a session id that ends after 30 idle
// minutes. No cookies.
// Build note: only full-line // comments are stripped; never put "</script" in this file.
(function () {
  var C = __SR_FPA_CONFIG__;
  var P = C.prefix + '_';
  var SESSION_MS = 30 * 60 * 1000;
  var ID = /^[a-z0-9]{8,40}$/;
  var nav = navigator;

  function get(k) {
    try {
      return localStorage.getItem(P + k);
    } catch (e) {
      return null;
    }
  }
  function set(k, v) {
    try {
      localStorage.setItem(P + k, v);
    } catch (e) {}
  }
  function del(k) {
    try {
      localStorage.removeItem(P + k);
    } catch (e) {}
  }
  function rid() {
    var a = new Uint8Array(10);
    crypto.getRandomValues(a);
    var s = '';
    for (var i = 0; i < a.length; i++) s += (a[i] % 36).toString(36) + (Math.floor(a[i] / 36) % 36).toString(36);
    return s.slice(0, 16);
  }
  function hostOf(h) {
    return String(h || '').toLowerCase().replace(/^www\./, '');
  }

  // opt-out / opt-in switch, e.g. /privacy/?sr-track=off
  var sw = null;
  try {
    sw = new URLSearchParams(location.search).get(C.prefix + '-track');
  } catch (e) {}
  if (sw === 'off') set('ignore', '1');
  if (sw === 'on') del('ignore');

  // a stub so calls made before this script loads are queued, then replayed below
  var queued = (window.fpa && window.fpa.q) || [];
  window.fpa = { q: [], track: function () {} };

  if (hostOf(location.hostname) !== C.host) return;
  if (nav.webdriver || nav.doNotTrack === '1' || nav.globalPrivacyControl === true || get('ignore') === '1') return;

  var vid = get('vid');
  var newVisitor = false;
  if (!vid || !ID.test(vid)) {
    vid = rid();
    set('vid', vid);
    newVisitor = true;
  }
  // The session is chosen when a page is shown (load or back/forward restore) and kept for that
  // page view, so a click after a long idle period still belongs to the session of its page view.
  var sid = '';
  function pickSession() {
    var s = get('sid');
    if (!s || !ID.test(s) || Date.now() - Number(get('slast') || 0) > SESSION_MS) {
      sid = rid();
      set('sid', sid);
    } else sid = s;
  }
  pickSession();
  var pid = rid();

  function send(e) {
    set('slast', String(Date.now())); // keeps the session alive across tabs
    var o = { v: vid, s: sid, p: pid, u: location.pathname };
    for (var k in e) if (e[k] !== undefined) o[k] = e[k];
    var body = JSON.stringify(o);
    try {
      if (nav.sendBeacon && nav.sendBeacon(C.endpoint, body)) return;
    } catch (err) {}
    try {
      fetch(C.endpoint, { method: 'POST', body: body, keepalive: true, headers: { 'Content-Type': 'text/plain' } }).catch(function () {});
    } catch (err) {}
  }

  // ---- pageview goals: at most once per session ----
  function pageGoal() {
    var path = location.pathname;
    for (var i = 0; i < C.pageGoals.length; i++) {
      var g = C.pageGoals[i];
      var hit = g.match === 'prefix' ? path.indexOf(g.path) === 0 : path === g.path;
      if (!hit) continue;
      var seen = {};
      try {
        seen = JSON.parse(get('goals') || '{}');
      } catch (e) {}
      if (seen.sid !== sid) seen = { sid: sid, g: [] };
      if (seen.g.indexOf(g.name) >= 0) return undefined;
      seen.g.push(g.name);
      set('goals', JSON.stringify(seen));
      return g.name;
    }
    return undefined;
  }

  // ---- page view ----
  function pageview(bf) {
    var navEntry = performance.getEntriesByType ? performance.getEntriesByType('navigation')[0] : null;
    var conn = nav.connection;
    var tz;
    try {
      tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    } catch (e) {}
    send({
      t: 'pv',
      q: location.search,
      r: document.referrer,
      ti: document.title,
      sw: screen.width,
      sh: screen.height,
      vw: innerWidth,
      vh: innerHeight,
      dpr: devicePixelRatio,
      lg: nav.language,
      tz: tz,
      mt: nav.maxTouchPoints,
      nt: bf ? 'bfcache' : navEntry && navEntry.type,
      cn: conn && conn.effectiveType,
      nv: newVisitor ? 1 : 0,
      bf: bf ? 1 : 0,
      g: pageGoal(),
    });
    newVisitor = false;
  }
  pageview(false);

  // ---- engaged time, scroll depth, web vitals (sent when the page is hidden or left) ----
  var engaged = 0;
  var lastActive = Date.now();
  var maxScroll = 0;
  var sentKey = '';
  var sentEngaged = 0;
  var vit = {};
  function active() {
    lastActive = Date.now();
  }
  ['pointerdown', 'pointermove', 'keydown', 'scroll', 'touchstart', 'wheel'].forEach(function (t) {
    addEventListener(t, active, { passive: true, capture: true });
  });
  setInterval(function () {
    if (document.visibilityState === 'visible' && Date.now() - lastActive < 120000) engaged += 1000;
  }, 1000);
  var ticking = false;
  function measure() {
    ticking = false;
    var h = Math.max(document.documentElement.scrollHeight, document.body ? document.body.scrollHeight : 0);
    var pct = h > 0 ? Math.min(100, Math.round(((scrollY + innerHeight) / h) * 100)) : 100;
    if (pct > maxScroll) maxScroll = pct;
  }
  addEventListener(
    'scroll',
    function () {
      if (!ticking) {
        ticking = true;
        requestAnimationFrame(measure);
      }
    },
    { passive: true }
  );
  addEventListener('load', measure);
  measure();

  function po(type, cb, extra) {
    try {
      var opts = { type: type, buffered: true };
      for (var k in extra || {}) opts[k] = extra[k];
      new PerformanceObserver(cb).observe(opts);
    } catch (e) {}
  }
  po('largest-contentful-paint', function (l) {
    var e = l.getEntries();
    if (e.length) vit.lcp = Math.round(e[e.length - 1].startTime);
  });
  po('paint', function (l) {
    l.getEntries().forEach(function (e) {
      if (e.name === 'first-contentful-paint') vit.fcp = Math.round(e.startTime);
    });
  });
  var cls = 0;
  var win = 0;
  var winStart = 0;
  var winLast = 0;
  po('layout-shift', function (l) {
    l.getEntries().forEach(function (e) {
      if (e.hadRecentInput) return;
      if (win && e.startTime - winLast < 1000 && e.startTime - winStart < 5000) win += e.value;
      else {
        win = e.value;
        winStart = e.startTime;
      }
      winLast = e.startTime;
      if (win > cls) cls = win;
    });
    vit.cls = Math.round(cls * 1000) / 1000;
  });
  po(
    'event',
    function (l) {
      l.getEntries().forEach(function (e) {
        if (e.interactionId && e.duration > (vit.inp || 0)) vit.inp = Math.round(e.duration);
      });
    },
    { durationThreshold: 16 }
  );
  try {
    var n0 = performance.getEntriesByType('navigation')[0];
    if (n0) vit.ttfb = Math.round(n0.responseStart);
  } catch (e) {}

  function flush() {
    measure();
    var key = pid + ':' + engaged + ':' + maxScroll;
    if (key === sentKey) return;
    sentKey = key;
    // en = total for this page view, ed = new since the last report (added to the session total)
    send({ t: 'end', en: engaged, ed: engaged - sentEngaged, sc: maxScroll, vt: vit });
    sentEngaged = engaged;
  }
  document.addEventListener('visibilitychange', function () {
    if (document.visibilityState === 'hidden') flush();
  });
  addEventListener('pagehide', flush);
  // back/forward cache restore = a new page view
  addEventListener('pageshow', function (e) {
    if (!e.persisted) return;
    pickSession();
    pid = rid();
    engaged = 0;
    sentEngaged = 0;
    maxScroll = 0;
    sentKey = '';
    vit = {};
    pageview(true);
  });

  // ---- clicks ----
  var here = hostOf(location.hostname);
  function entitySlug() {
    if (!C.entity || !C.entity.path) return '';
    var parts = C.entity.path.split('{slug}');
    var pre = parts[0];
    var post = parts[1] || '';
    var p = location.pathname;
    if (p.indexOf(pre) !== 0 || p.length <= pre.length + post.length || p.slice(p.length - post.length) !== post) return '';
    var slug = p.slice(pre.length, p.length - post.length);
    return /^[a-z0-9-]{1,80}$/.test(slug) ? slug : '';
  }
  function linkKind(a) {
    var u;
    try {
      u = new URL(a.href, location.href);
    } catch (e) {
      return 'outbound';
    }
    var h = hostOf(u.hostname);
    if (u.protocol === 'tel:') return 'phone';
    if (u.protocol === 'mailto:') return 'email';
    if (u.protocol === 'whatsapp:' || /^(wa\.me|api\.whatsapp\.com|chat\.whatsapp\.com|whatsapp\.com)$/.test(h)) return 'whatsapp';
    if (h === here) {
      if (u.pathname === location.pathname && u.hash) return 'anchor';
      if (/\.(pdf|zip|csv|xlsx?|docx?|pptx?|dmg|exe|apk|msi|txt)$/i.test(u.pathname)) return 'download';
      return 'internal';
    }
    for (var i = 0; i < C.linkKinds.length; i++) {
      var k = C.linkKinds[i];
      var hostOk = k.hosts.some(function (x) {
        return h === x || h.slice(-(x.length + 1)) === '.' + x;
      });
      var pathOk =
        !k.paths ||
        k.paths.some(function (p) {
          return u.pathname.indexOf(p) === 0;
        });
      if (hostOk && pathOk) return k.kind;
    }
    return 'outbound';
  }
  var conv = {};
  C.conversions.forEach(function (c) {
    conv[c.kind] = c.scope;
  });
  var lastEl = null;
  var streak = [];
  document.addEventListener(
    'click',
    function (ev) {
      try {
        var target = ev.target;
        var el = target && target.closest ? target.closest('a[href],button,summary,[data-cta],[data-conversion],[data-event],input[type=submit],input[type=button],[role=button]') : null;
        if (!el) return;
        var a = el.closest('a[href]');
        var ent = el.closest('[data-entity]');
        var kind = a ? linkKind(a) : 'button';
        if (ent && kind === 'outbound') kind = 'website';
        var marked = el.closest('[data-conversion]');
        if (marked && marked.getAttribute('data-conversion')) kind = marked.getAttribute('data-conversion');
        var scope = conv[kind];
        var isConv = !!marked || scope === 'anywhere' || (scope === 'entity' && !!ent);
        var listing = (ent && ent.getAttribute('data-entity')) || entitySlug();
        var t = Date.now();
        streak =
          el === lastEl
            ? streak
                .filter(function (x) {
                  return t - x < 1000;
                })
                .concat(t)
            : [t];
        lastEl = el;
        if (streak.length > 3) return; // a rage click is reported once (on the third), not per click
        var label = (el.getAttribute('data-cta') || el.getAttribute('aria-label') || el.innerText || el.textContent || el.value || '').replace(/\s+/g, ' ').trim().slice(0, 100);
        send({
          t: 'click',
          h: a ? a.href : '',
          k: kind,
          l: listing || undefined,
          ld: isConv ? 1 : 0,
          x: label,
          c: (ent && ent.getAttribute('data-entity-context')) || undefined,
          px: Math.round((ev.clientX / Math.max(1, innerWidth)) * 1000),
          py: Math.round(ev.pageY),
          dh: document.documentElement.scrollHeight,
          rg: streak.length === 3 ? 1 : 0,
        });
        var evEl = el.closest('[data-event]');
        if (evEl && streak.length === 1) track(evEl.getAttribute('data-event'), { entity: listing || undefined });
      } catch (err) {}
    },
    { capture: true, passive: true }
  );

  // ---- choices (select, checkbox, radio; never typed text) ----
  var only = C.choices && C.choices.names && C.choices.names.length ? C.choices.names : null;
  document.addEventListener(
    'change',
    function (ev) {
      var t = ev.target;
      if (!t || !t.name) return;
      var type = t.type;
      if (!(t.tagName === 'SELECT' || type === 'checkbox' || type === 'radio')) return;
      if (only && only.indexOf(t.name) < 0) return;
      var value = type === 'checkbox' ? (t.checked ? t.value || 'on' : 'off') : t.value || '(any)';
      send({ t: 'filter', n: t.name, val: value, f: (t.form && (t.form.id || t.form.getAttribute('aria-label'))) || '' });
    },
    { capture: true, passive: true }
  );

  // ---- custom events: window.fpa.track(name, { val, num, entity, props }) ----
  function track(name, o) {
    if (typeof name !== 'string' || !name) return;
    o = o || {};
    var val = o.val === undefined ? undefined : String(o.val).slice(0, 100);
    if (name === 'search' && C.search) {
      val = String(o.val || '').trim().toLowerCase().slice(0, 60);
      if (!val || val.indexOf('@') >= 0 || (val.match(/\d/g) || []).length >= 6) return;
    }
    var props;
    if (o.props && typeof o.props === 'object') {
      props = {};
      var n = 0;
      for (var k in o.props) {
        if (n >= 4) break;
        var v = o.props[k];
        if (typeof v === 'string') props[k] = v.slice(0, 60);
        else if (typeof v === 'number' && isFinite(v)) props[k] = v;
        else continue;
        n++;
      }
    }
    send({ t: 'ev', n: name.slice(0, 40), val: val, num: typeof o.num === 'number' && isFinite(o.num) ? o.num : undefined, l: o.entity || undefined, pr: props });
  }
  window.fpa = { q: [], track: track };
  queued.forEach(function (c) {
    try {
      track(c[0], c[1]);
    } catch (e) {}
  });

  // ---- JavaScript errors (max 5 per page) ----
  var errs = 0;
  addEventListener('error', function (e) {
    if (errs++ >= 5) return;
    send({ t: 'error', m: String(e.message || 'Error'), src: (e.filename || '') + ':' + (e.lineno || 0) + ':' + (e.colno || 0) });
  });
  addEventListener('unhandledrejection', function (e) {
    if (errs++ >= 5) return;
    var r = e.reason;
    send({ t: 'error', m: 'Unhandled rejection: ' + String((r && r.message) || r || ''), src: location.pathname });
  });
})();
