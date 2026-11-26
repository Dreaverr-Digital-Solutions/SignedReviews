// Consent gate for analytics on signedreviews.com (privacy policy section 3.4a). build.js inlines
// this into the <head> of every page, before PostHog and before the visit-statistics script, with
// __SR_PH_KEY__ / __SR_PH_HOST__ replaced. One choice covers PostHog (with session replay) and our
// own visit-statistics script (analytics/tracker.js):
// - EU, EEA, UK, Switzerland and Brazil: nothing starts until the visitor accepts in the banner.
// - Everywhere else: analytics run unless the visitor declined (footer "Privacy choices").
// - Do Not Track or Global Privacy Control: nothing runs and no banner is shown.
// PostHog's stub is loaded on every page, but posthog.init() (which loads the library, sets its
// cookie and sends events) is only called once analytics are allowed, so nothing is stored or
// sent before then. The choice (sr_consent) and the visitor's country (sr_geo, from Cloudflare's
// /cdn-cgi/trace on our own domain) are kept in local storage: both are needed to show the banner
// to the right people and not ask again. The server request log needs no consent: it stores
// nothing on the device and no IP address.
// Build note: only full-line // comments are stripped; never put "</script" in this file.
(function () {
  var PH_KEY = __SR_PH_KEY__;
  var PH_HOST = __SR_PH_HOST__;
  var CK = 'sr_consent';
  var LEGACY = 'sr_replay_consent';
  var GK = 'sr_geo';
  var REGION = ['AT', 'BE', 'BG', 'HR', 'CY', 'CZ', 'DK', 'EE', 'FI', 'FR', 'DE', 'GR', 'HU', 'IE', 'IT', 'LV', 'LT', 'LU', 'MT', 'NL', 'PL', 'PT', 'RO', 'SK', 'SI', 'ES', 'SE', 'IS', 'LI', 'NO', 'GB', 'CH', 'BR'];
  var TRACKER_KEYS = ['sr_vid', 'sr_sid', 'sr_slast', 'sr_goals'];

  function get(k) {
    try {
      return localStorage.getItem(k);
    } catch (e) {
      return null;
    }
  }
  function set(k, v) {
    try {
      localStorage.setItem(k, v);
    } catch (e) {}
  }
  function del(k) {
    try {
      localStorage.removeItem(k);
    } catch (e) {}
  }

  var nav = navigator;
  var dnt = nav.doNotTrack == '1' || nav.doNotTrack == 'yes' || window.doNotTrack == '1' || nav.globalPrivacyControl === true;

  // pending | granted | denied | default (outside the consent regions, no choice made)
  var state = 'pending';
  var listeners = [];
  function allowed() {
    return !dnt && (state === 'granted' || state === 'default');
  }
  function emit() {
    for (var i = 0; i < listeners.length; i++) {
      try {
        listeners[i](allowed());
      } catch (e) {}
    }
  }
  window.srConsent = {
    allowed: allowed,
    state: function () {
      return dnt ? 'dnt' : state;
    },
    // fn(allowed) runs now if the choice is known, and again whenever it changes
    onChange: function (fn) {
      listeners.push(fn);
      if (state !== 'pending' || dnt) fn(allowed());
    },
  };

  var phStarted = false;
  function startPosthog() {
    var ph = window.posthog;
    if (!PH_KEY || !ph || typeof ph.init !== 'function') return;
    if (!phStarted) {
      phStarted = true;
      try {
        ph.init(PH_KEY, { api_host: PH_HOST, person_profiles: 'identified_only', session_recording: { maskAllInputs: true }, disable_session_recording: true, disable_surveys: true, respect_dnt: true });
      } catch (e) {}
    } else {
      try {
        ph.opt_in_capturing();
      } catch (e) {}
    }
    try {
      ph.startSessionRecording();
    } catch (e) {}
  }
  function stopAll() {
    if (phStarted) {
      try {
        window.posthog.stopSessionRecording();
        window.posthog.opt_out_capturing();
      } catch (e) {}
    }
    for (var i = 0; i < TRACKER_KEYS.length; i++) del(TRACKER_KEYS[i]);
  }
  function apply() {
    if (allowed()) startPosthog();
    else stopAll();
    emit();
  }

  function banner() {
    if (document.getElementById('sr-consent')) return;
    var d = document.createElement('div');
    d.id = 'sr-consent';
    d.setAttribute('role', 'dialog');
    d.setAttribute('aria-label', 'Analytics consent');
    d.style.cssText = 'position:fixed;left:16px;right:16px;bottom:16px;margin:0 auto;max-width:540px;z-index:2147483647;background:#0b1220;color:#e7ecf3;border:1px solid #243044;border-radius:12px;padding:16px 18px;box-shadow:0 10px 30px rgba(0,0,0,.35);font:14px/1.5 system-ui,-apple-system,Segoe UI,Roboto,sans-serif';
    var p = document.createElement('div');
    p.style.marginBottom = '10px';
    p.appendChild(document.createTextNode('May we measure your visit? With your consent we count page views and clicks with our own analytics and PostHog, and record a form-masked replay to improve the site. No advertising, and we never store your IP address. '));
    var a = document.createElement('a');
    a.href = '/privacy/';
    a.style.color = '#8ab4ff';
    a.textContent = 'Privacy Policy';
    p.appendChild(a);
    p.appendChild(document.createTextNode('.'));
    var row = document.createElement('div');
    row.style.cssText = 'display:flex;gap:8px;justify-content:flex-end';
    var dec = document.createElement('button');
    dec.type = 'button';
    dec.textContent = 'Decline';
    dec.style.cssText = 'padding:8px 14px;border-radius:8px;border:1px solid #3a475c;background:transparent;color:#e7ecf3;cursor:pointer';
    var acc = document.createElement('button');
    acc.type = 'button';
    acc.textContent = 'Accept';
    acc.style.cssText = 'padding:8px 14px;border-radius:8px;border:0;background:#2f6df6;color:#fff;font-weight:600;cursor:pointer';
    dec.onclick = function () {
      set(CK, 'denied');
      state = 'denied';
      d.remove();
      apply();
    };
    acc.onclick = function () {
      set(CK, 'granted');
      state = 'granted';
      d.remove();
      apply();
    };
    row.appendChild(dec);
    row.appendChild(acc);
    d.appendChild(p);
    d.appendChild(row);
    (document.body || document.documentElement).appendChild(d);
  }
  function showBanner() {
    if (document.body) banner();
    else document.addEventListener('DOMContentLoaded', banner);
  }
  // Footer "Privacy choices": reopen the banner in any region, at any time.
  window.srPrivacy = function () {
    showBanner();
  };

  if (dnt) {
    emit();
    return;
  }
  function decide(inRegion) {
    var c = get(CK) || get(LEGACY);
    if (c === 'granted') state = 'granted';
    else if (c === 'denied') state = 'denied';
    else if (!inRegion) state = 'default';
    else {
      state = 'pending';
      showBanner();
      return;
    }
    apply();
  }
  var g = get(GK);
  if (g) decide(REGION.indexOf(g) >= 0);
  else {
    // unknown country: ask (treated as a consent region) unless Cloudflare tells us otherwise
    fetch('/cdn-cgi/trace')
      .then(function (r) {
        return r.text();
      })
      .then(function (t) {
        var m = /loc=([A-Z]{2})/.exec(t);
        var loc = m ? m[1] : '';
        if (loc) set(GK, loc);
        decide(loc ? REGION.indexOf(loc) >= 0 : true);
      })
      .catch(function () {
        decide(true);
      });
  }
})();
