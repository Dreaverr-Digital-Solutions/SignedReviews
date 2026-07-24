#!/usr/bin/env node
/**
 * Static site builder for signedreviews.com.
 *
 * Owns the shared header/footer used by every secondary page (legal + marketing
 * routes). The home page (`index.html`) keeps its own bespoke layout and is left
 * untouched here — only the secondary routes are generated.
 *
 * Output (relative to repo root):
 *   /privacy/index.html
 *   /terms/index.html
 *   /refund-policy/index.html
 *   /subprocessors/index.html
 *   /pricing/index.html
 *   /contact/index.html
 *   /about/index.html
 *   /sitemap.xml, /robots.txt, /favicon.svg
 */

const fs = require('node:fs');
const path = require('node:path');
const { marked } = require('marked');

const ROOT = __dirname;
const FILES_DIR = path.join(ROOT, 'files');
const SITE_URL = 'https://signedreviews.com';
const PLATFORM_URL = 'https://platform.signedreviews.com';
// Root-relative URL prefix for internal links and assets. Use "/" for the
// custom domain (served at root) or "/SignedReviews/" when deploying to the
// GitHub Pages project URL. Override with BASE_PATH=/ npm run build.
const BASE_PATH = (process.env.BASE_PATH || '/').replace(/\/+$/, '/') || '/';
const B = BASE_PATH; // shorthand

// ── PostHog analytics ────────────────────────────────────────────────────────
// Injected into every page (home + generated) when POSTHOG_KEY is set at build
// time. Leave unset to ship the site with no analytics (the snippet is omitted
// entirely). The key is a publishable client key — safe in static HTML.
//   POSTHOG_KEY=phc_xxx POSTHOG_HOST=https://us.i.posthog.com npm run build
// person_profiles:'identified_only' → anonymous visitors are measured for
// funnels but no person profile is created until they sign up (and the dashboard
// calls identify()). Session replay uses maskAllInputs (form fields —
// passwords/emails/payment — are never captured) and never auto-starts
// (disable_session_recording). It is started explicitly by the consent gate
// below: recorded by default outside the EU/EEA/UK, and only after opt-in
// inside it. Analytics (pageviews/funnels) run regardless. First-party cookie on
// the registered domain enables the landing→app funnel stitch across subdomains.
// Recording also requires "Record user sessions" enabled in the PostHog project
// settings — the client flags alone do not start replay.
// Publishable PostHog project token (client-side key — safe in static HTML).
// Override per-build with POSTHOG_KEY=... if ever needed.
const POSTHOG_KEY = process.env.POSTHOG_KEY || 'phc_oks4oQLhwDpmgqTdiwx7tjJ3FZrZPZjDWtsYtvbXG9tu';
// PostHog requests are proxied through signedreviews.com/ph so ad blockers
// see first-party calls. The analytics-proxy Cloudflare Worker must be
// deployed for this to work. Set POSTHOG_DIRECT=1 to bypass the proxy.
const POSTHOG_HOST = (process.env.POSTHOG_DIRECT === '1')
  ? (process.env.POSTHOG_HOST || 'https://us.i.posthog.com')
  : 'https://signedreviews.com/ph';
const POSTHOG_SNIPPET = POSTHOG_KEY
  ? `
  <script>
    !function(t,e){var o,n,p,r;e.__SV||(window.posthog=e,e._i=[],e.init=function(i,s,a){function g(t,e){var o=e.split(".");2==o.length&&(t=t[o[0]],e=o[1]),t[e]=function(){t.push([e].concat(Array.prototype.slice.call(arguments,0)))}}(p=t.createElement("script")).type="text/javascript",p.crossOrigin="anonymous",p.async=!0,p.src=s.api_host.replace(".i.posthog.com","-assets.i.posthog.com")+"/static/array.js",(r=t.getElementsByTagName("script")[0]).parentNode.insertBefore(p,r);var u=e;for(void 0!==a?u=e[a]=[]:a="posthog",u.people=u.people||[],u.toString=function(t){var e="posthog";return"posthog"!==a&&(e+="."+a),t||(e+=" (stub)"),e},u.people.toString=function(){return u.toString(1)+".people (stub)"},o="init capture register register_once register_for_session unregister unregister_for_session getFeatureFlag getFeatureFlagPayload isFeatureEnabled reloadFeatureFlags updateEarlyAccessFeatureEnrollment getEarlyAccessFeatures on onFeatureFlags onSessionId getSurveys getActiveMatchingSurveys renderSurvey canRenderSurvey identify setPersonProperties group resetGroups setPersonPropertiesForFlags resetPersonPropertiesForFlags setGroupPropertiesForFlags resetGroupPropertiesForFlags reset get_distinct_id getGroups get_session_id get_session_replay_url alias set_config startSessionRecording stopSessionRecording sessionRecordingStarted captureException loadToolbar get_property getSessionProperty createPersonProfile opt_in_capturing opt_out_capturing has_opted_in_capturing has_opted_out_capturing clear_opt_in_out_capturing debug getPageViewId captureTraceFeedback captureTraceMetric".split(" "),n=0;n<o.length;n++)g(u,o[n]);e._i.push([i,s,a])},e.__SV=1)}(document,window.posthog||[]);
    posthog.init('${POSTHOG_KEY}',{api_host:'${POSTHOG_HOST}',person_profiles:'identified_only',session_recording:{maskAllInputs:true},disable_session_recording:true,respect_dnt:true});
    (function(){
      var CK='sr_replay_consent', GK='sr_geo';
      var REGION=['AT','BE','BG','HR','CY','CZ','DK','EE','FI','FR','DE','GR','HU','IE','IT','LV','LT','LU','MT','NL','PL','PT','RO','SK','SI','ES','SE','IS','LI','NO','GB','CH','BR'];
      function get(k){ try{ return localStorage.getItem(k); }catch(e){ return null; } }
      function set(k,v){ try{ localStorage.setItem(k,v); }catch(e){} }
      function start(){ try{ posthog.startSessionRecording(); }catch(e){} }
      function stop(){ try{ posthog.stopSessionRecording(); }catch(e){} }
      function banner(){
        if(document.getElementById('sr-consent')) return;
        var d=document.createElement('div'); d.id='sr-consent'; d.setAttribute('role','dialog'); d.setAttribute('aria-label','Session recording consent');
        d.style.cssText='position:fixed;left:16px;right:16px;bottom:16px;margin:0 auto;max-width:520px;z-index:2147483647;background:#0b1220;color:#e7ecf3;border:1px solid #243044;border-radius:12px;padding:16px 18px;box-shadow:0 10px 30px rgba(0,0,0,.35);font:14px/1.5 system-ui,-apple-system,Segoe UI,Roboto,sans-serif';
        var p=document.createElement('div'); p.style.marginBottom='10px';
        p.innerHTML='We would like to record an anonymised, form-masked replay of your visit to help improve our site. Analytics work either way. See our <a href="/privacy/" style="color:#8ab4ff">Privacy Policy</a>.';
        var row=document.createElement('div'); row.style.cssText='display:flex;gap:8px;justify-content:flex-end';
        var dec=document.createElement('button'); dec.type='button'; dec.textContent='Decline'; dec.style.cssText='padding:8px 14px;border-radius:8px;border:1px solid #3a475c;background:transparent;color:#e7ecf3;cursor:pointer';
        var acc=document.createElement('button'); acc.type='button'; acc.textContent='Accept'; acc.style.cssText='padding:8px 14px;border-radius:8px;border:0;background:#2f6df6;color:#fff;font-weight:600;cursor:pointer';
        dec.onclick=function(){ set(CK,'denied'); stop(); d.remove(); };
        acc.onclick=function(){ set(CK,'granted'); d.remove(); start(); };
        row.appendChild(dec); row.appendChild(acc); d.appendChild(p); d.appendChild(row);
        (document.body||document.documentElement).appendChild(d);
      }
      // Footer "Privacy choices" entry point — lets anyone re-open the banner to
      // opt in or out at any time, in any region.
      window.srPrivacy=function(){ banner(); };
      // Browser-level opt-out signals (Do Not Track, Global Privacy Control):
      // never record and don't prompt.
      var dnt=navigator.doNotTrack=='1'||navigator.doNotTrack=='yes'||window.doNotTrack=='1';
      var gpc=navigator.globalPrivacyControl===true;
      if(dnt||gpc){ stop(); return; }
      function decide(inRegion){
        var c=get(CK);
        if(c==='denied'){ return; }            // persistent opt-out, honoured everywhere
        if(c==='granted'){ start(); return; }
        if(!inRegion){ start(); return; }      // outside EU/EEA/UK: record by default
        if(document.body){ banner(); }         // inside, no choice yet: ask
        else { document.addEventListener('DOMContentLoaded',banner); }
      }
      var g=get(GK);
      if(g){ decide(REGION.indexOf(g)>=0); }
      else { fetch('/cdn-cgi/trace').then(function(r){return r.text();}).then(function(t){ var m=/loc=([A-Z]{2})/.exec(t); var loc=m?m[1]:''; if(loc) set(GK,loc); decide(loc?REGION.indexOf(loc)>=0:true); }).catch(function(){ decide(true); }); }
    })();
  </script>`
  : '';

// ── Engagement tracker (scroll depth / section viewed / CTA click) ───────────
// Additive: uses the posthog global loaded by POSTHOG_SNIPPET above. Does NOT
// re-init posthog or touch the replay-consent gate. Powers the scroll funnel,
// section-engagement, and CTA-click charts in the platform admin "Marketing
// analytics" section. Gated on POSTHOG_KEY (pointless without posthog).
//   landing_scroll_depth   { depth: 25|50|75|100 }   once per threshold / page
//   landing_section_viewed { section: <data-track> }  first time a [data-track] enters view
//   landing_cta_click      { cta: <data-cta>, href }  on click of a [data-cta] element
// NOTE: no `${}` or backticks inside — it lives inside a template literal.
const SR_TRACKERS_SNIPPET = POSTHOG_KEY
  ? `
  <script>
    (function () {
      function setup() {
        var ph = window.posthog;
        if (!ph || typeof ph.capture !== 'function') return; // posthog not loaded yet
        var fired = {};
        function onScroll() {
          var doc = document.documentElement, body = document.body;
          var top = doc.scrollTop || body.scrollTop || 0;
          var max = (doc.scrollHeight || body.scrollHeight || 0) - (doc.clientHeight || 0);
          var pct = max > 0 ? (top / max) * 100 : 0;
          var ts = [25, 50, 75, 100];
          for (var i = 0; i < ts.length; i++) { var t = ts[i]; if (pct >= t && !fired[t]) { fired[t] = true; ph.capture('landing_scroll_depth', { depth: t }); } }
        }
        var ticking = false;
        window.addEventListener('scroll', function () {
          if (ticking) return; ticking = true;
          (window.requestAnimationFrame || function (cb) { setTimeout(cb, 66); })(function () { onScroll(); ticking = false; });
        }, { passive: true });
        onScroll();
        if ('IntersectionObserver' in window) {
          var seen = {};
          var io = new IntersectionObserver(function (entries) {
            for (var i = 0; i < entries.length; i++) {
              var en = entries[i];
              if (en.isIntersecting) { var n = en.target.getAttribute('data-track'); if (n && !seen[n]) { seen[n] = true; ph.capture('landing_section_viewed', { section: n }); } }
            }
          }, { threshold: 0.5 });
          var tracked = document.querySelectorAll('[data-track]');
          for (var j = 0; j < tracked.length; j++) io.observe(tracked[j]);
        }
        document.addEventListener('click', function (e) {
          var el = e.target;
          while (el && el !== document) {
            if (el.getAttribute && el.getAttribute('data-cta')) { ph.capture('landing_cta_click', { cta: el.getAttribute('data-cta'), href: el.getAttribute('href') || '' }); break; }
            el = el.parentNode;
          }
        }, true);
      }
      if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', setup); else setup();
    })();
  </script>`
  : '';

const COMPANY = {
  legalName: 'Paid Rightly LLC',
  brand: 'Signed Reviews',
  description: 'Signed Reviews is a SaaS platform that helps businesses collect verified, tamper-evident customer reviews by linking each review to a completed Stripe transaction.',
  supportEmail: 'support@signedreviews.com',
  legalEmail: 'legal@signedreviews.com',
  address: '1209 Mountain Road Pl NE, Ste N, Albuquerque, NM 87110, United States',
  copyright: '© 2026 Paid Rightly LLC. All rights reserved.',
  attribution: 'Signed Reviews is a service operated by Paid Rightly LLC.',
};

// Sitewide Organization node (emitted on every page via SHARED_HEAD; the bespoke
// homepage carries its own matching copy). `sameAs` is intentionally absent —
// verified profiles don't exist yet (github.com/signedreviews + the LinkedIn page
// both 404), and fabricated social URLs damage E-E-A-T more than a missing field.
const ORG_SCHEMA = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: COMPANY.brand,
  legalName: COMPANY.legalName,
  url: SITE_URL,
  logo: `${SITE_URL}/images/SignedReviews_logo_only.png`,
  description: COMPANY.description,
  email: COMPANY.supportEmail,
  address: {
    '@type': 'PostalAddress',
    streetAddress: '1209 Mountain Road Pl NE, Ste N',
    addressLocality: 'Albuquerque',
    addressRegion: 'NM',
    postalCode: '87110',
    addressCountry: 'US',
  },
};

// Per-page BreadcrumbList. Skipped on the homepage (a lone "Home" crumb is noise).
function breadcrumbJsonLd(title, canonical, slug) {
  if (!slug || slug === '/' || canonical === `${SITE_URL}/` || canonical === SITE_URL) return '';
  const crumbs = [{ name: 'Home', url: `${SITE_URL}/` }];
  if (slug.startsWith('/blog/') && slug !== '/blog/') {
    crumbs.push({ name: 'Blog', url: `${SITE_URL}/blog/` });
  }
  crumbs.push({ name: title.split(' — ')[0].trim() || title, url: canonical });
  return `\n  <script type="application/ld+json">${JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: crumbs.map((c, i) => ({ '@type': 'ListItem', position: i + 1, name: c.name, item: c.url })),
  })}</script>`;
}

// ── Marked configuration: anchor IDs on every heading ────────────────────────
function slugify(text) {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .slice(0, 80);
}

function renderMarkdown(md) {
  const html = marked.parse(md, { gfm: true, breaks: false });
  // Post-process: add stable IDs and anchor links to h1-h4.
  const seen = new Map();
  return html.replace(/<(h[1-4])>([\s\S]*?)<\/\1>/g, (_, tag, inner) => {
    const plain = inner.replace(/<[^>]+>/g, '').trim();
    let slug = slugify(plain);
    const count = seen.get(slug) || 0;
    seen.set(slug, count + 1);
    if (count > 0) slug = `${slug}-${count}`;
    return `<${tag} id="${slug}"><a class="anchor" href="#${slug}" aria-label="Permalink to ${escapeHtml(plain)}">#</a> ${inner}</${tag}>`;
  });
}

// ── Shared layout ────────────────────────────────────────────────────────────
const SHARED_STYLES = `
:root {
  --navy-900:#0c1320; --navy-800:#141e30; --navy-700:#1c2840; --navy-600:#243252;
  --navy-500:#2b3b60; --navy-400:#5d7aaa; --navy-300:#87a2c4; --navy-200:#aab9dc;
  --navy-100:#d5dcee; --navy-50:#eef1f8;
  --gold-600:#967f36; --gold-500:#b39d45; --gold-400:#c4ae4e; --gold-300:#d4c466;
  --gold-100:#f2edcc; --gold-50:#faf8ee;
  --bg:#f0f4f9; --surface:#ffffff; --text:#141e30; --muted:#5d7aaa;
  --border:rgba(43,59,96,.12); --code-bg:#0c1320; --code-text:#eef1f8;
  --max-prose: 72ch;
}
@media (prefers-color-scheme: dark) {
  :root.theme-auto {
    --bg:#0c1320; --surface:#141e30; --text:#eef1f8; --muted:#87a2c4;
    --border:rgba(255,255,255,.10);
  }
}
:root.theme-dark {
  --bg:#0c1320; --surface:#141e30; --text:#eef1f8; --muted:#87a2c4;
  --border:rgba(255,255,255,.10);
}
* { box-sizing: border-box; }
html { scroll-behavior: smooth; }
body {
  margin: 0;
  font-family: 'Inter', system-ui, -apple-system, Segoe UI, Roboto, sans-serif;
  font-size: 16px;
  line-height: 1.65;
  color: var(--text);
  background: var(--bg);
  -webkit-font-smoothing: antialiased;
  text-rendering: optimizeLegibility;
}
a { color: var(--navy-500); text-decoration: underline; text-underline-offset: 2px; }
a:hover { color: var(--gold-500); }
:root.theme-dark a, :root.theme-auto a { color: var(--gold-300); }

/* ── Skip link ── */
.skip-link {
  position: absolute; left: -9999px; top: 0;
  background: var(--navy-900); color: #fff; padding: .75rem 1rem;
  border-radius: 0 0 .5rem 0; z-index: 100;
}
.skip-link:focus { left: 0; outline: 3px solid var(--gold-400); }

/* ── Header / nav ── */
.site-header {
  position: sticky; top: 0; z-index: 50;
  background: rgba(255,255,255,.92);
  backdrop-filter: saturate(1.6) blur(14px);
  -webkit-backdrop-filter: saturate(1.6) blur(14px);
  border-bottom: 1px solid var(--border);
}
:root.theme-dark .site-header, :root.theme-auto .site-header {
  background: rgba(20,30,48,.85);
}
.nav-inner {
  max-width: 1100px; margin: 0 auto; padding: 0 1.25rem;
  display: flex; align-items: center; justify-content: space-between;
  height: 64px; gap: 1rem;
}
.brand { display: inline-flex; align-items: center; gap: .5rem; text-decoration: none; }
.brand img { width: auto; display: block; }
.brand .brand-icon     { height: 30px; }
.brand .brand-wordmark { height: 20px; }
@media (min-width: 640px) {
  .brand .brand-icon     { height: 34px; }
  .brand .brand-wordmark { height: 24px; }
}
/* Auto-invert the black wordmark in dark mode so it's readable */
:root.theme-dark .brand .brand-wordmark,
:root.theme-auto .brand .brand-wordmark { filter: brightness(0) invert(1); opacity: .92; }
@media (prefers-color-scheme: light) {
  :root.theme-auto .brand .brand-wordmark { filter: none; opacity: 1; }
}

.nav-links {
  display: flex; align-items: center; gap: .35rem; list-style: none; margin: 0; padding: 0;
}
.nav-links a {
  display: inline-flex; align-items: center; padding: .5rem .85rem;
  font-size: .92rem; font-weight: 500; text-decoration: none;
  color: var(--navy-700); border-radius: .55rem;
}
:root.theme-dark .nav-links a, :root.theme-auto .nav-links a { color: var(--navy-100); }
.nav-links a:hover { background: var(--navy-50); color: var(--navy-900); }
:root.theme-dark .nav-links a:hover, :root.theme-auto .nav-links a:hover { background: rgba(255,255,255,.06); color: #fff; }

.nav-cta {
  display: inline-flex; align-items: center; gap: .55rem; margin-left: .35rem;
}
.theme-toggle {
  display: inline-flex; align-items: center; justify-content: center;
  width: 36px; height: 36px; border-radius: 999px;
  background: transparent; border: 0; cursor: pointer;
  color: var(--navy-700);
}
:root.theme-dark .theme-toggle, :root.theme-auto .theme-toggle { color: var(--navy-100); }
.theme-toggle:hover { background: var(--navy-50); }
:root.theme-dark .theme-toggle:hover, :root.theme-auto .theme-toggle:hover { background: rgba(255,255,255,.06); }
.theme-toggle .icon-sun { display: none; }
.theme-toggle .icon-moon { display: block; }
:root.theme-dark .theme-toggle .icon-sun { display: block; }
:root.theme-dark .theme-toggle .icon-moon { display: none; }
@media (prefers-color-scheme: dark) {
  :root.theme-auto .theme-toggle .icon-sun { display: block; }
  :root.theme-auto .theme-toggle .icon-moon { display: none; }
}
.btn {
  display: inline-flex; align-items: center; justify-content: center;
  padding: .55rem 1rem; border-radius: .65rem; font-weight: 600; font-size: .9rem;
  text-decoration: none; border: 1px solid transparent;
  transition: transform .15s ease, background .15s ease, box-shadow .15s ease;
  cursor: pointer;
}
.btn-primary {
  color: #fff;
  background: linear-gradient(135deg, var(--gold-400), var(--gold-500) 60%, var(--gold-600));
  box-shadow: 0 4px 14px rgba(179,157,69,.32);
}
.btn-primary:hover { transform: translateY(-1px); box-shadow: 0 6px 18px rgba(179,157,69,.44); color: #fff; }
.btn-secondary {
  color: var(--navy-700); background: transparent; border-color: var(--navy-200);
}
.btn-secondary:hover { background: var(--navy-50); color: var(--navy-900); }
:root.theme-dark .btn-secondary, :root.theme-auto .btn-secondary {
  color: var(--navy-100); border-color: rgba(255,255,255,.18); background: rgba(255,255,255,.02);
}
:root.theme-dark .btn-secondary:hover, :root.theme-auto .btn-secondary:hover {
  background: rgba(255,255,255,.08); color: #fff;
}

/* ── Mobile nav: hide inline links + secondary CTA, show hamburger ── */
.menu-toggle {
  display: none; background: transparent; border: 0; padding: 0;
  width: 40px; height: 40px; border-radius: .5rem;
  align-items: center; justify-content: center;
  color: var(--navy-700); cursor: pointer;
}
:root.theme-dark .menu-toggle, :root.theme-auto .menu-toggle { color: var(--navy-100); }
.menu-toggle:hover { background: var(--navy-50); }
:root.theme-dark .menu-toggle:hover, :root.theme-auto .menu-toggle:hover { background: rgba(255,255,255,.06); }

.mobile-drawer { display: none; }
.mobile-drawer ul { list-style: none; margin: 0; padding: .5rem 1rem .75rem; }
.mobile-drawer li { margin: 0; }
.mobile-drawer a {
  display: block; padding: .75rem 1rem; border-radius: .5rem;
  font-size: 1rem; font-weight: 500; text-decoration: none;
  color: var(--navy-700);
}
:root.theme-dark .mobile-drawer a, :root.theme-auto .mobile-drawer a { color: var(--navy-100); }
.mobile-drawer a:hover { background: var(--navy-50); color: var(--navy-900); }
:root.theme-dark .mobile-drawer a:hover, :root.theme-auto .mobile-drawer a:hover { background: rgba(255,255,255,.06); color: #fff; }

@media (max-width: 720px) {
  .nav-links { display: none; }
  .nav-cta .btn-secondary { display: none; }
  .nav-cta .btn { padding: .45rem .85rem; font-size: .85rem; }
  .menu-toggle { display: inline-flex; }
  .mobile-drawer.is-open {
    display: block;
    border-top: 1px solid var(--border);
    background: var(--surface);
  }
}

/* ── Main / prose ── */
main { padding: 0; }
.page-hero {
  background: linear-gradient(180deg, var(--surface) 0%, var(--bg) 100%);
  border-bottom: 1px solid var(--border);
}
.page-hero-inner {
  max-width: 1100px; margin: 0 auto; padding: 3.5rem 1.25rem 2.25rem;
}
.page-hero h1 {
  font-family: 'Instrument Serif', Georgia, serif;
  font-size: clamp(2rem, 4vw + 1rem, 3.25rem);
  line-height: 1.1; margin: 0 0 .5rem; color: var(--navy-900); letter-spacing: -0.02em;
}
:root.theme-dark .page-hero h1, :root.theme-auto .page-hero h1 { color: #fff; }
.page-hero p { color: var(--muted); margin: 0; max-width: 60ch; font-size: 1.05rem; }
.eyebrow {
  display: inline-block;
  font-family: 'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, monospace;
  font-size: .72rem; letter-spacing: .14em; text-transform: uppercase;
  color: var(--gold-600); margin-bottom: .9rem;
}

.prose-wrap {
  max-width: 1100px; margin: 0 auto; padding: 2.5rem 1.25rem 4rem;
  display: grid; grid-template-columns: minmax(0, 1fr); gap: 2rem;
}
@media (min-width: 980px) {
  .prose-wrap.has-toc { grid-template-columns: minmax(0, 1fr) 240px; }
}

.prose {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 16px;
  padding: clamp(1.5rem, 3vw, 3rem);
  max-width: var(--max-prose);
  width: 100%;
  margin: 0;
}
.prose h1 { display: none; } /* page hero already shows the h1 */
.prose h2, .prose h3, .prose h4 {
  font-family: 'Instrument Serif', Georgia, serif;
  color: var(--navy-900);
  letter-spacing: -0.01em;
  line-height: 1.25;
  margin: 2.4rem 0 .9rem;
}
:root.theme-dark .prose h2, :root.theme-dark .prose h3, :root.theme-dark .prose h4,
:root.theme-auto .prose h2, :root.theme-auto .prose h3, :root.theme-auto .prose h4 { color: #fff; }
.prose h2 { font-size: 1.65rem; padding-top: .25rem; }
.prose h3 { font-size: 1.25rem; }
.prose h4 { font-size: 1.05rem; font-family: 'Inter', system-ui, sans-serif; font-weight: 700; }
.prose h2:first-of-type { margin-top: 0; }

.prose p, .prose li { color: var(--text); }
.prose p { margin: 0 0 1rem; }
.prose ul, .prose ol { padding-left: 1.4rem; margin: 0 0 1rem; }
.prose li { margin: .35rem 0; }

.prose strong { color: var(--navy-900); }
:root.theme-dark .prose strong, :root.theme-auto .prose strong { color: #fff; }

.prose hr {
  border: 0; height: 1px; background: var(--border); margin: 2.5rem 0;
}

.prose code {
  font-family: 'JetBrains Mono', ui-monospace, SFMono-Regular, monospace;
  font-size: .9em;
  background: var(--navy-50); color: var(--navy-700);
  padding: .12em .42em; border-radius: 4px;
}
:root.theme-dark .prose code, :root.theme-auto .prose code {
  background: rgba(255,255,255,.08); color: var(--gold-300);
}

.prose a.anchor {
  text-decoration: none; color: var(--navy-200); margin-right: .35rem;
  font-weight: 400; opacity: 0; transition: opacity .15s ease;
}
.prose h2:hover a.anchor, .prose h3:hover a.anchor, .prose h4:hover a.anchor { opacity: 1; }

.prose blockquote {
  margin: 1.5rem 0;
  padding: 1.1rem 1.25rem;
  border-left: 4px solid var(--gold-500);
  background: var(--gold-50);
  color: var(--navy-800);
  border-radius: 0 .5rem .5rem 0;
}
.prose blockquote p { margin: 0; }
.prose blockquote strong { color: var(--gold-600); }
:root.theme-dark .prose blockquote, :root.theme-auto .prose blockquote {
  background: rgba(179,157,69,.10); color: #fff;
}

.prose table {
  width: 100%;
  border-collapse: collapse;
  margin: 1.25rem 0 1.5rem;
  font-size: .92rem;
  border: 1px solid var(--border);
  border-radius: 10px;
  overflow: hidden;
  display: block;
  overflow-x: auto;
}
.prose thead { background: var(--navy-50); }
:root.theme-dark .prose thead, :root.theme-auto .prose thead { background: rgba(255,255,255,.04); }
.prose th, .prose td {
  padding: .7rem .9rem; text-align: left; vertical-align: top;
  border-bottom: 1px solid var(--border);
}
.prose th { font-weight: 600; color: var(--navy-900); }
:root.theme-dark .prose th, :root.theme-auto .prose th { color: #fff; }
.prose tbody tr:last-child td { border-bottom: 0; }
.prose tbody tr:nth-child(even) td { background: rgba(43,59,96,.025); }
:root.theme-dark .prose tbody tr:nth-child(even) td,
:root.theme-auto .prose tbody tr:nth-child(even) td { background: rgba(255,255,255,.02); }

/* ── ToC sidebar (legal pages) ── */
.toc {
  position: sticky; top: 88px; align-self: start;
  font-size: .88rem; max-height: calc(100vh - 110px); overflow-y: auto;
  padding: 1rem 1.1rem; border: 1px solid var(--border);
  background: var(--surface); border-radius: 12px;
}
.toc h2 {
  font-family: 'JetBrains Mono', ui-monospace, monospace;
  font-size: .68rem; letter-spacing: .14em; text-transform: uppercase;
  color: var(--muted); margin: 0 0 .6rem;
}
.toc ul { list-style: none; padding: 0; margin: 0; }
.toc li { margin: .15rem 0; }
.toc a {
  color: var(--navy-700); text-decoration: none; display: block;
  padding: .25rem .35rem; border-radius: .35rem; line-height: 1.35;
}
:root.theme-dark .toc a, :root.theme-auto .toc a { color: var(--navy-100); }
.toc a:hover { background: var(--navy-50); color: var(--navy-900); }
:root.theme-dark .toc a:hover, :root.theme-auto .toc a:hover { background: rgba(255,255,255,.06); color: #fff; }
@media (max-width: 980px) { .toc { display: none; } }

/* ── Marketing utility blocks ── */
.section { max-width: 1100px; margin: 0 auto; padding: 3rem 1.25rem; }
.cards { display: grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap: 1rem; }
.card {
  background: var(--surface); border: 1px solid var(--border); border-radius: 14px;
  padding: 1.5rem;
}
.card h3 {
  font-family: 'Instrument Serif', Georgia, serif; font-size: 1.4rem;
  margin: 0 0 .5rem; color: var(--navy-900);
}
:root.theme-dark .card h3, :root.theme-auto .card h3 { color: #fff; }
.card p { margin: 0; color: var(--muted); }
.card-featured {
  border-color: var(--gold-400);
  box-shadow: 0 6px 26px rgba(179,157,69,.18);
}
.badge {
  display: inline-block; padding: .25rem .55rem; border-radius: 999px;
  font-size: .72rem; font-weight: 700; letter-spacing: .04em; text-transform: uppercase;
  background: var(--gold-100); color: var(--gold-600); margin-bottom: .65rem;
}
:root.theme-dark .badge, :root.theme-auto .badge {
  background: rgba(179,157,69,.18); color: var(--gold-300);
}

.feature-list { list-style: none; padding: 0; margin: 1rem 0 1.5rem; }
.feature-list li {
  display: flex; gap: .55rem; align-items: flex-start; margin: .45rem 0;
  color: var(--text);
}
.feature-list li::before {
  content: '✓'; color: var(--gold-500); font-weight: 700; flex-shrink: 0;
}

.callout {
  border: 1px solid var(--border); border-left: 4px solid var(--gold-500);
  background: var(--surface); border-radius: 10px; padding: 1rem 1.25rem;
  margin: 1.25rem 0; color: var(--text);
}

/* ── Contact list ── */
.contact-list {
  list-style: none; padding: 0; margin: 0;
  display: grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap: 1rem;
}
.contact-list li {
  background: var(--surface); border: 1px solid var(--border);
  border-radius: 12px; padding: 1.1rem 1.25rem;
}
.contact-list .label {
  font-family: 'JetBrains Mono', ui-monospace, monospace;
  font-size: .7rem; text-transform: uppercase; letter-spacing: .12em;
  color: var(--muted); display: block; margin-bottom: .35rem;
}
.contact-list a { color: var(--navy-500); }
:root.theme-dark .contact-list a, :root.theme-auto .contact-list a { color: var(--gold-300); }

/* ── Footer ── */
.site-footer {
  border-top: 1px solid var(--border);
  background: var(--surface);
  margin-top: 2rem;
  padding: 3rem 1.25rem 2rem;
}
.footer-grid {
  max-width: 1100px; margin: 0 auto;
  display: grid; gap: 2rem;
  grid-template-columns: 1.6fr 1fr 1fr 1fr;
}
@media (max-width: 880px) { .footer-grid { grid-template-columns: 1fr 1fr; } }
@media (max-width: 480px) { .footer-grid { grid-template-columns: 1fr; } }
.footer-brand p { margin: .35rem 0; color: var(--muted); font-size: .9rem; }
.footer-brand .brand-icon     { height: 28px; }
.footer-brand .brand-wordmark { height: 20px; }
.footer-col h4 {
  font-family: 'JetBrains Mono', ui-monospace, monospace;
  font-size: .72rem; letter-spacing: .14em; text-transform: uppercase;
  color: var(--muted); margin: 0 0 .8rem;
}
.footer-col ul { list-style: none; padding: 0; margin: 0; }
.footer-col li { margin: .35rem 0; }
.footer-col a {
  color: var(--navy-700); text-decoration: none; font-size: .92rem;
}
:root.theme-dark .footer-col a, :root.theme-auto .footer-col a { color: var(--navy-100); }
.footer-col a:hover { color: var(--gold-500); text-decoration: underline; }

.footer-fineprint {
  max-width: 1100px; margin: 2.5rem auto 0; padding-top: 1.5rem;
  border-top: 1px solid var(--border);
  display: flex; flex-wrap: wrap; gap: .75rem 2rem; justify-content: space-between;
  font-size: .82rem; color: var(--muted);
}
.address-block { font-style: normal; }
`;

const SHARED_HEAD = ({ title, description, canonical, slug, pageType = 'website' }) => `
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(title)}</title>
  <meta name="description" content="${escapeHtml(description)}">
  <link rel="canonical" href="${canonical}">
  <meta name="robots" content="index, follow">
  <meta name="theme-color" content="#0c1320">

  <meta property="og:type" content="${pageType}">
  <meta property="og:title" content="${escapeHtml(title)}">
  <meta property="og:description" content="${escapeHtml(description)}">
  <meta property="og:url" content="${canonical}">
  <meta property="og:site_name" content="${COMPANY.brand}">
  <meta property="og:image" content="${SITE_URL}/images/SignedReviews_full_logo.png">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${escapeHtml(title)}">
  <meta name="twitter:description" content="${escapeHtml(description)}">
  <meta name="twitter:image" content="${SITE_URL}/images/SignedReviews_full_logo.png">

  <link rel="icon" href="${B}favicon.svg" type="image/svg+xml">
  <link rel="icon" type="image/png" sizes="32x32" href="${B}images/SignedReviews_logo_only.png">
  <link rel="apple-touch-icon" href="${B}images/SignedReviews_logo_only.png">

  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link rel="preconnect" href="https://us.i.posthog.com">
  <link rel="dns-prefetch" href="https://platform.signedreviews.com">
  <link href="https://fonts.googleapis.com/css2?family=Instrument+Serif&family=Inter:wght@400;500;700&family=JetBrains+Mono:wght@400&display=swap" rel="stylesheet">

  <style>${SHARED_STYLES}</style>${POSTHOG_SNIPPET}${SR_TRACKERS_SNIPPET}
  <script type="application/ld+json">${JSON.stringify(ORG_SCHEMA)}</script>${breadcrumbJsonLd(title, canonical, slug)}
`;

const HEADER = (active = '') => `
<header class="site-header">
  <div class="nav-inner" id="navInner">
    <a class="brand" href="${B}" aria-label="${COMPANY.brand} home">
      <img class="brand-icon" src="${B}images/SignedReviews_logo_only.webp" alt="">
      <img class="brand-wordmark" src="${B}images/SignedReviews_font_only.webp" alt="${COMPANY.brand}">
    </a>
    <ul class="nav-links" role="menu">
      <li><a href="${B}pricing/"${active === 'pricing' ? ' aria-current="page"' : ''}>Pricing</a></li>
      <li><a href="${B}about/"${active === 'about' ? ' aria-current="page"' : ''}>About</a></li>
      <li><a href="${B}contact/"${active === 'contact' ? ' aria-current="page"' : ''}>Contact</a></li>
    </ul>
    <div class="nav-cta">
      <button class="theme-toggle" aria-label="Toggle dark mode" onclick="(function(){var d=document.documentElement; d.classList.remove('theme-auto'); var dark=d.classList.toggle('theme-dark'); try{localStorage.setItem('theme', dark?'dark':'light');}catch(_){}})();">
        <svg class="icon-sun" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"/></svg>
        <svg class="icon-moon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>
      </button>
      <a class="btn btn-secondary" href="${PLATFORM_URL}" rel="noopener" data-cta="login">Log in</a>
      <a class="btn btn-primary" href="${PLATFORM_URL}" rel="noopener" data-cta="signup">Sign up</a>
      <button class="menu-toggle" aria-label="Toggle navigation menu" aria-expanded="false" aria-controls="mobileDrawer" onclick="(function(b){var d=document.getElementById('mobileDrawer'); if(!d)return; var open=d.classList.toggle('is-open'); b.setAttribute('aria-expanded', open?'true':'false');})(this);">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
      </button>
    </div>
  </div>
  <div id="mobileDrawer" class="mobile-drawer" aria-label="Mobile navigation">
    <ul>
      <li><a href="${B}pricing/"${active === 'pricing' ? ' aria-current="page"' : ''}>Pricing</a></li>
      <li><a href="${B}about/"${active === 'about' ? ' aria-current="page"' : ''}>About</a></li>
      <li><a href="${B}contact/"${active === 'contact' ? ' aria-current="page"' : ''}>Contact</a></li>
      <li><a href="${PLATFORM_URL}" rel="noopener" data-cta="login">Log in</a></li>
    </ul>
  </div>
</header>`;

const FOOTER = `
<footer class="site-footer" role="contentinfo">
  <div class="footer-grid">
    <div class="footer-brand">
      <a class="brand footer-brand-link" href="${B}" aria-label="${COMPANY.brand} home">
        <img class="brand-icon" src="${B}images/SignedReviews_logo_only.webp" alt="">
        <img class="brand-wordmark" src="${B}images/SignedReviews_font_only.webp" alt="${COMPANY.brand}">
      </a>
      <p>${COMPANY.attribution}</p>
      <p>${COMPANY.copyright}</p>
      <address class="address-block"><strong>${COMPANY.legalName}</strong><br>${COMPANY.address}</address>
    </div>
    <div class="footer-col">
      <h4>Product</h4>
      <ul>
        <li><a href="${B}">Home</a></li>
        <li><a href="${B}#how-it-works">How it works</a></li>
        <li><a href="${B}#features">Features</a></li>
        <li><a href="${B}pricing/">Pricing</a></li>
      </ul>
    </div>
    <div class="footer-col">
      <h4>Company</h4>
      <ul>
        <li><a href="${B}about/">About</a></li>
        <li><a href="${B}contact/">Contact</a></li>
        <li><a href="mailto:${COMPANY.supportEmail}">Support</a></li>
      </ul>
    </div>
    <div class="footer-col">
      <h4>Legal</h4>
      <ul>
        <li><a href="${B}privacy/">Privacy Policy</a></li>
        <li><a href="${B}terms/">Terms of Service</a></li>
        <li><a href="${B}dpa/">Data Processing Agreement</a></li>
        <li><a href="${B}dmca/">DMCA Policy</a></li>
        <li><a href="${B}refund-policy/">Refund Policy</a></li>
        <li><a href="${B}subprocessors/">Sub-processors</a></li>
        <li><a href="#" onclick="if(window.srPrivacy){window.srPrivacy();}return false;">Privacy choices</a></li>
      </ul>
    </div>
  </div>
  <div class="footer-fineprint">
    <span>${COMPANY.copyright}</span>
    <span>${COMPANY.attribution}</span>
  </div>
</footer>
<script>
  // Honor stored theme preference set by index.html.
  (function () {
    try {
      var stored = localStorage.getItem('theme');
      if (stored === 'dark') document.documentElement.classList.add('theme-dark');
      else if (stored === 'light') document.documentElement.classList.remove('theme-dark');
      else document.documentElement.classList.add('theme-auto');
    } catch (_) { document.documentElement.classList.add('theme-auto'); }
  })();
</script>`;

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function page({ title, description, slug, hero, body, hasToc = false, active = '', extraStyle = '', bareBody = false, pageType = 'website' }) {
  const canonical = `${SITE_URL}${slug}`;
  const wrappedBody = bareBody
    ? body
    : `<div class="prose-wrap${hasToc ? ' has-toc' : ''}">
      ${body}
    </div>`;
  return `<!DOCTYPE html>
<html lang="en">
<head>${SHARED_HEAD({ title, description, canonical, slug, pageType })}${extraStyle ? `\n  <style>${extraStyle}</style>` : ''}</head>
<body>
  <a class="skip-link" href="#main">Skip to main content</a>
  ${HEADER(active)}
  <main id="main">
    <section class="page-hero">
      <div class="page-hero-inner">
        ${hero.eyebrow ? `<span class="eyebrow">${hero.eyebrow}</span>` : ''}
        <h1>${hero.title}</h1>
        ${hero.subtitle ? `<p>${hero.subtitle}</p>` : ''}
      </div>
    </section>
    ${wrappedBody}
  </main>
  ${FOOTER}
  <!-- Cloudflare Web Analytics (proxied) -->
  <script defer src="${B}cf/beacon.min.js" data-cf-beacon='{"token": "3db355ae0786403fbe4f7240e1130894"}'></script>
</body>
</html>
`;
}

function buildToc(html) {
  const re = /<h2 id="([^"]+)"><a class="anchor"[^>]*>#<\/a> ([\s\S]*?)<\/h2>/g;
  const items = [];
  let m;
  while ((m = re.exec(html))) {
    const stripped = m[2].replace(/<[^>]+>/g, '').trim();
    items.push({ id: m[1], text: stripped });
  }
  if (!items.length) return '';
  return `
    <nav class="toc" aria-label="On this page">
      <h2>On this page</h2>
      <ul>
        ${items.map((it) => `<li><a href="#${it.id}">${escapeHtml(it.text)}</a></li>`).join('')}
      </ul>
    </nav>`;
}

function writePage(slug, html) {
  const outDir = path.join(ROOT, slug.replace(/^\//, '').replace(/\/$/, ''));
  fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(path.join(outDir, 'index.html'), html, 'utf8');
}

// ── Legal pages: render markdown ─────────────────────────────────────────────
const LEGAL_PAGES = [
  {
    slug: '/privacy/',
    file: 'privacy.md',
    title: 'Privacy Policy',
    eyebrow: 'Legal',
    subtitle: 'How Paid Rightly LLC collects, uses, and protects information when you use Signed Reviews.',
    metaDesc: 'Privacy Policy for Signed Reviews — operated by Paid Rightly LLC. Learn what we collect, how we use it, and your rights.',
  },
  {
    slug: '/terms/',
    file: 'terms.md',
    title: 'Terms of Service',
    eyebrow: 'Legal',
    subtitle: 'The agreement between you and Paid Rightly LLC for use of Signed Reviews.',
    metaDesc: 'Terms of Service for Signed Reviews — operated by Paid Rightly LLC. Read before using the platform.',
  },
  {
    slug: '/refund-policy/',
    file: 'refund-policy.md',
    title: 'Refund and Cancellation Policy',
    eyebrow: 'Legal',
    subtitle: 'How refunds and cancellations work for Signed Reviews.',
    metaDesc: 'Refund and Cancellation Policy for Signed Reviews. Free plan plus paid tiers from $29/mo — full policy.',
  },
  {
    slug: '/subprocessors/',
    file: 'subprocessors.md',
    title: 'Sub-processors',
    eyebrow: 'Legal',
    subtitle: 'Third-party service providers Paid Rightly LLC uses to operate Signed Reviews.',
    metaDesc: 'Full list of sub-processors used by Signed Reviews — what they do, what data they touch, and where they operate.',
  },
  {
    slug: '/dpa/',
    file: 'dpa.md',
    title: 'Data Processing Agreement',
    eyebrow: 'Legal',
    subtitle: 'Our processor obligations to you under GDPR Article 28 and equivalent privacy laws when we handle your customers\u2019 data on your behalf.',
    metaDesc: 'Data Processing Agreement (DPA) for Signed Reviews — the contract between Paid Rightly LLC (processor) and the Business User (controller) governing review-data handling under GDPR, UK GDPR, Swiss FADP, and CCPA/CPRA.',
  },
  {
    slug: '/dmca/',
    file: 'dmca.md',
    title: 'DMCA and Copyright Policy',
    eyebrow: 'Legal',
    subtitle: 'How to submit a DMCA takedown notice or counter-notification, and our designated copyright agent.',
    metaDesc: 'DMCA and Copyright Policy for Signed Reviews — submit takedown notices and counter-notifications to our designated copyright agent under 17 U.S.C. § 512.',
  },
];

function buildLegal() {
  for (const p of LEGAL_PAGES) {
    const md = fs.readFileSync(path.join(FILES_DIR, p.file), 'utf8');
    const renderedBody = renderMarkdown(md);
    // Strip the original H1 (page hero shows the title).
    const bodyNoH1 = renderedBody.replace(/<h1[^>]*>[\s\S]*?<\/h1>/, '');
    const toc = buildToc(bodyNoH1);
    const html = page({
      title: `${p.title} — ${COMPANY.brand}`,
      description: p.metaDesc,
      slug: p.slug,
      hero: { eyebrow: p.eyebrow, title: p.title, subtitle: p.subtitle },
      body: `<article class="prose">${bodyNoH1}</article>${toc}`,
      hasToc: !!toc,
    });
    writePage(p.slug, html);
    console.log(`  ✓ ${p.slug}`);
  }
}

// ── Marketing pages ──────────────────────────────────────────────────────────
const PRICING_STYLES = `
/* ── Beta banner ── */
.beta-banner {
  max-width: 1100px; margin: 2rem auto 1.5rem; padding: .9rem 1.15rem;
  display: flex; gap: .85rem; align-items: flex-start;
  background: var(--gold-50); border: 1px solid var(--gold-400);
  border-radius: 12px;
  color: var(--navy-800);
}
:root.theme-dark .beta-banner, :root.theme-auto .beta-banner {
  background: rgba(179,157,69,.10); color: #fff; border-color: rgba(179,157,69,.35);
}
.beta-banner .dot {
  flex-shrink: 0;
  width: 8px; height: 8px; border-radius: 999px;
  background: var(--gold-500);
  margin-top: .55rem;
  box-shadow: 0 0 0 4px rgba(179,157,69,.2);
}
.beta-banner p { margin: 0; font-size: .92rem; line-height: 1.55; }
.beta-banner strong { color: var(--navy-900); }
:root.theme-dark .beta-banner strong, :root.theme-auto .beta-banner strong { color: #fff; }

/* ── Tier grid ── */
.section { max-width: 1100px; margin: 0 auto; padding: 0 1.25rem; }
.tiers {
  display: grid; gap: 1.1rem;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  margin: 2rem 0 2.5rem;
}
@media (max-width: 1040px) { .tiers { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
@media (max-width: 560px)  { .tiers { grid-template-columns: 1fr; } }

.tier {
  position: relative;
  display: flex; flex-direction: column;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 20px;
  padding: 1.75rem 1.55rem;
  transition: transform .2s ease, box-shadow .2s ease, border-color .2s ease;
}
.tier:hover {
  transform: translateY(-3px);
  border-color: var(--navy-200);
  box-shadow: 0 20px 46px rgba(36,50,82,.22);
}
:root.theme-dark .tier:hover, :root.theme-auto .tier:hover {
  border-color: rgba(255,255,255,.25);
  box-shadow: 0 20px 46px rgba(93,122,170,.28);
}
.tier.is-featured {
  border-color: var(--gold-400);
  box-shadow: 0 14px 36px rgba(13,28,46,.08);
}
.tier.is-featured:hover {
  border-color: var(--gold-400);
  box-shadow: 0 22px 50px rgba(179,157,69,.36);
}
:root.theme-dark .tier.is-featured, :root.theme-auto .tier.is-featured {
  box-shadow: 0 14px 36px rgba(0,0,0,.45);
}
:root.theme-dark .tier.is-featured:hover, :root.theme-auto .tier.is-featured:hover {
  box-shadow: 0 22px 50px rgba(212,196,102,.28);
}
.tier-badge {
  position: absolute; top: -11px; left: 50%; transform: translateX(-50%);
  background: var(--gold-500);
  color: #fff;
  font-family: 'JetBrains Mono', ui-monospace, monospace;
  font-size: .62rem; letter-spacing: .18em; text-transform: uppercase; font-weight: 600;
  padding: .34rem .8rem; border-radius: 999px;
  white-space: nowrap;
}
.tier-header { margin-bottom: 1.2rem; }
.tier-name {
  font-family: 'Instrument Serif', Georgia, serif;
  font-size: 1.85rem; line-height: 1.1; letter-spacing: -0.015em;
  color: var(--navy-900); margin: 0 0 .3rem;
}
:root.theme-dark .tier-name, :root.theme-auto .tier-name { color: #fff; }
.tier-persona {
  font-size: .86rem; line-height: 1.5; color: var(--muted); margin: 0;
  min-height: 3em;
}
.tier-price-block { margin-bottom: 1.35rem; }
.tier-price {
  display: flex; align-items: baseline; gap: .35rem; margin-bottom: .6rem;
  font-family: 'Inter', system-ui, sans-serif;
  color: var(--navy-900);
}
:root.theme-dark .tier-price, :root.theme-auto .tier-price { color: #fff; }
.tier-price .amount {
  font-size: 2.75rem; font-weight: 700; line-height: 1; letter-spacing: -0.03em;
}
.tier-price .period {
  color: var(--muted); font-size: .88rem; font-weight: 500;
}
.tier-invitations {
  display: inline-flex; align-items: center; gap: .35rem;
  font-size: .78rem; font-weight: 600; letter-spacing: .005em;
  color: var(--gold-600); background: var(--gold-50);
  padding: .32rem .6rem; border-radius: 999px;
  border: 1px solid rgba(179,157,69,.22);
}
:root.theme-dark .tier-invitations, :root.theme-auto .tier-invitations {
  color: var(--gold-300); background: rgba(179,157,69,.12);
  border-color: rgba(179,157,69,.28);
}
.tier-cta { margin: 0 0 1.5rem; }
.tier-cta .btn {
  width: 100%; padding: .7rem 1rem; font-size: .92rem; border-radius: .7rem;
}
.tier-features {
  flex: 1 1 auto;
  list-style: none; padding: 1.15rem 0 0; margin: 0;
  border-top: 1px solid var(--border);
  font-size: .9rem; line-height: 1.5;
}
.tier-features li {
  display: flex; gap: .65rem; align-items: flex-start;
  padding: .38rem 0;
  color: var(--text);
}
.tier-features li::before {
  content: '';
  flex-shrink: 0;
  width: 15px; height: 15px; margin-top: 4px;
  background-image: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16'><path fill='none' stroke='%23b39d45' stroke-width='2.6' stroke-linecap='round' stroke-linejoin='round' d='M3 8.2l3.2 3.2L13 4.6'/></svg>");
  background-repeat: no-repeat;
  background-size: contain;
}
.tier-features li.feature-primary {
  color: var(--navy-900); font-weight: 600;
}
:root.theme-dark .tier-features li.feature-primary,
:root.theme-auto .tier-features li.feature-primary { color: #fff; }

/* ── Comparison table ── */
.compare-intro {
  max-width: 1100px; margin: 3rem auto 1rem; padding: 0 1.25rem;
}
.compare-intro h2 {
  font-family: 'Instrument Serif', Georgia, serif; font-size: 1.65rem;
  margin: 0 0 .35rem; color: var(--navy-900); letter-spacing: -0.01em;
}
:root.theme-dark .compare-intro h2, :root.theme-auto .compare-intro h2 { color: #fff; }
.compare-intro p { margin: 0; color: var(--muted); font-size: .95rem; }
.compare-table-wrap {
  max-width: 1100px; margin: 0 auto 3rem; padding: 0 1.25rem;
  overflow-x: auto;
}
.compare-table {
  width: 100%;
  border-collapse: separate; border-spacing: 0;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 14px;
  overflow: hidden;
  font-size: .92rem;
  min-width: 780px;
}
.compare-table thead th {
  background: var(--navy-50);
  color: var(--navy-900); font-weight: 600; text-align: left;
  padding: 1rem 1rem;
  border-bottom: 1px solid var(--border);
  font-family: 'Inter', system-ui, sans-serif;
}
:root.theme-dark .compare-table thead th,
:root.theme-auto .compare-table thead th {
  background: rgba(255,255,255,.04); color: #fff;
}
.compare-table thead th:first-child {
  font-family: 'JetBrains Mono', ui-monospace, monospace;
  font-size: .7rem; letter-spacing: .14em; text-transform: uppercase;
  color: var(--muted); font-weight: 500;
}
.compare-table thead th .col-price {
  display: block; font-family: 'Inter', system-ui, sans-serif;
  font-size: .8rem; color: var(--muted); font-weight: 500; margin-top: .15rem;
}
.compare-table td, .compare-table th {
  padding: .75rem 1rem; vertical-align: top;
  border-bottom: 1px solid var(--border);
}
.compare-table tbody th {
  text-align: left; font-weight: 500; color: var(--navy-700);
  background: transparent; font-family: 'Inter', system-ui, sans-serif;
}
:root.theme-dark .compare-table tbody th,
:root.theme-auto .compare-table tbody th { color: var(--navy-100); }
.compare-table tbody tr:last-child td,
.compare-table tbody tr:last-child th { border-bottom: 0; }
.compare-table td { color: var(--text); }
.compare-table td.dim { color: var(--muted); }
.compare-table .check { color: var(--gold-500); font-weight: 700; }

/* ── Assurances ── */
.assurances {
  max-width: 1100px; margin: 0 auto 3.5rem; padding: 0 1.25rem;
  display: grid; gap: 1rem;
  grid-template-columns: repeat(2, minmax(0, 1fr));
}
@media (max-width: 640px) { .assurances { grid-template-columns: 1fr; } }
.assurance {
  background: var(--surface); border: 1px solid var(--border); border-radius: 12px;
  padding: 1.1rem 1.2rem;
}
.assurance h3 {
  font-family: 'Instrument Serif', Georgia, serif;
  font-size: 1.15rem; margin: 0 0 .3rem; color: var(--navy-900);
}
:root.theme-dark .assurance h3, :root.theme-auto .assurance h3 { color: #fff; }
.assurance p { margin: 0; font-size: .9rem; color: var(--muted); line-height: 1.5; }

/* ── CTA bar ── */
.cta-bar {
  max-width: 1100px; margin: 0 auto 4rem; padding: 2.5rem 1.5rem;
  background: linear-gradient(135deg, var(--navy-800), var(--navy-900));
  border-radius: 18px;
  text-align: center; color: #fff;
}
.cta-bar h2 {
  font-family: 'Instrument Serif', Georgia, serif;
  font-size: clamp(1.6rem, 2.5vw + .5rem, 2.25rem);
  margin: 0 0 .4rem; letter-spacing: -0.01em; color: #fff;
}
.cta-bar p { margin: 0 0 1.4rem; color: var(--navy-200); font-size: 1rem; }
.cta-bar .btn-primary { padding: .85rem 1.6rem; font-size: 1rem; }

/* ── Billing period toggle ── */
.billing-toggle { display:flex; align-items:center; justify-content:center; gap:.5rem; max-width:1100px; margin:1.5rem auto 2rem; }
.billing-toggle .bt-btn { border:1px solid var(--border); background:var(--surface); color:var(--muted); padding:.5rem 1.15rem; border-radius:999px; font-size:.9rem; font-weight:600; cursor:pointer; transition:all .15s ease; }
.billing-toggle .bt-btn.is-active { background:var(--navy-900); color:#fff; border-color:var(--navy-900); }
:root.theme-dark .billing-toggle .bt-btn.is-active,
:root.theme-auto .billing-toggle .bt-btn.is-active { background:#fff; color:var(--navy-900); border-color:#fff; }
.billing-toggle .bt-save { font-size:.8rem; font-weight:700; color:var(--gold-500, #c9a227); margin-left:.4rem; }
`;

function buildPricing() {
  const body = `
  <div class="beta-banner" role="note">
    <span class="dot" aria-hidden="true"></span>
    <p>
      <strong>Free plan, always.</strong>
      There's a free plan for self-service collection. Paid plans from $29/mo add an automated, verified review request on every Stripe sale — see our <a href="${B}refund-policy/">Refund and Cancellation Policy</a>.
    </p>
  </div>

  <div class="billing-toggle" role="group" aria-label="Billing period">
    <button type="button" class="bt-btn is-active" data-period="monthly" aria-pressed="true">Monthly</button>
    <button type="button" class="bt-btn" data-period="annual" aria-pressed="false">Annual</button>
    <span class="bt-save">Save 2 months</span>
  </div>

  <section class="section" aria-label="Pricing tiers">
    <div class="tiers">

      <article class="tier">
        <header class="tier-header">
          <h2 class="tier-name">Free</h2>
          <p class="tier-persona">Self-service review collection — your customers come to you.</p>
        </header>
        <div class="tier-price-block">
          <div class="tier-price">
            <span class="amount">$0</span>
            <span class="period">forever</span>
          </div>
          <span class="tier-invitations">25 invitations · lifetime</span>
        </div>
        <p class="tier-cta">
          <a class="btn btn-secondary" href="${PLATFORM_URL}" rel="noopener">Start free</a>
        </p>
        <ul class="tier-features">
          <li class="feature-primary">25 review invitations, lifetime</li>
          <li>Self-service: your page + badge carry a "Leave a verified review" CTA — share your link or QR</li>
          <li>All collected reviews visible forever</li>
          <li>Hosted public review page + read-only public API + badge</li>
          <li>Build your own page with the read-only public API</li>
          <li>1 team seat</li>
          <li>Community support</li>
        </ul>
      </article>

      <article class="tier">
        <header class="tier-header">
          <h2 class="tier-name">Starter</h2>
          <p class="tier-persona">Automation starts here — a verified request on every Stripe sale.</p>
        </header>
        <div class="tier-price-block" data-m-amt="$29" data-m-per="/ month" data-a-amt="$290" data-a-per="/ year">
          <div class="tier-price">
            <span class="amount">$29</span>
            <span class="period">/ month</span>
          </div>
          <span class="tier-invitations">250 invitations / month</span>
        </div>
        <p class="tier-cta">
          <a class="btn btn-secondary" href="${PLATFORM_URL}" rel="noopener">Sign up free</a>
        </p>
        <ul class="tier-features">
          <li class="feature-primary">Automated review requests on every Stripe charge</li>
          <li class="feature-primary">250 review invitations / month</li>
          <li>2 automatic reminders · standard cadence</li>
          <li>Auto-request delay presets</li>
          <li>All collected reviews visible forever</li>
          <li>3 team seats</li>
          <li>Read-only API · 60 req/min</li>
          <li>Email support · 72-hour response</li>
        </ul>
      </article>

      <article class="tier is-featured">
        <span class="tier-badge">Most popular</span>
        <header class="tier-header">
          <h2 class="tier-name">Pro</h2>
          <p class="tier-persona">For growing brands with a team and integrations.</p>
        </header>
        <div class="tier-price-block" data-m-amt="$79" data-m-per="/ month" data-a-amt="$790" data-a-per="/ year">
          <div class="tier-price">
            <span class="amount">$79</span>
            <span class="period">/ month</span>
          </div>
          <span class="tier-invitations">1,500 invitations / month</span>
        </div>
        <p class="tier-cta">
          <a class="btn btn-primary" href="${PLATFORM_URL}" rel="noopener">Sign up free</a>
        </p>
        <ul class="tier-features">
          <li class="feature-primary">1,500 review invitations / month</li>
          <li>All collected reviews visible forever</li>
          <li>2 automatic reminders · custom cadence preset</li>
          <li>8 team seats</li>
          <li>Read-only API · 300 req/min</li>
          <li>Webhooks on new review, reply, refund</li>
          <li>CSV export of reviews + transactions</li>
          <li>Priority support · 24-hour response</li>
        </ul>
      </article>

      <article class="tier">
        <header class="tier-header">
          <h2 class="tier-name">Scale</h2>
          <p class="tier-persona">For high-volume DTC brands and review agencies.</p>
        </header>
        <div class="tier-price-block" data-m-amt="$199" data-m-per="/ month" data-a-amt="$1,990" data-a-per="/ year">
          <div class="tier-price">
            <span class="amount">$199</span>
            <span class="period">/ month</span>
          </div>
          <span class="tier-invitations">5,000 invitations / month</span>
        </div>
        <p class="tier-cta">
          <a class="btn btn-secondary" href="${PLATFORM_URL}" rel="noopener">Sign up free</a>
        </p>
        <ul class="tier-features">
          <li class="feature-primary">5,000 review invitations / month</li>
          <li>All collected reviews visible forever</li>
          <li>2 automatic reminders · custom cadence</li>
          <li>20 team seats</li>
          <li>Read-only API · 1,000 req/min</li>
          <li>Webhooks + CSV export</li>
          <li>Priority support · 12-hour response</li>
        </ul>
      </article>

    </div>
  </section>

  <div class="compare-intro">
    <h2>Compare plans in detail</h2>
    <p>Every feature, by tier — so you can see exactly where you belong.</p>
  </div>
  <div class="compare-table-wrap">
    <table class="compare-table">
      <thead>
        <tr>
          <th scope="col">Feature</th>
          <th scope="col">Free<span class="col-price">$0</span></th>
          <th scope="col">Starter<span class="col-price" data-m="$29/mo" data-a="$290/yr">$29/mo</span></th>
          <th scope="col">Pro<span class="col-price" data-m="$79/mo" data-a="$790/yr">$79/mo</span></th>
          <th scope="col">Scale<span class="col-price" data-m="$199/mo" data-a="$1,990/yr">$199/mo</span></th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <th scope="row">Automated review requests <span style="font-weight:400;color:var(--muted)">(on every Stripe charge)</span></th>
          <td class="dim">—</td>
          <td class="check">✓</td>
          <td class="check">✓</td>
          <td class="check">✓</td>
        </tr>
        <tr>
          <th scope="row">Self-service collection <span style="font-weight:400;color:var(--muted)">(page + badge CTA)</span></th>
          <td class="check">✓</td>
          <td class="check">✓</td>
          <td class="check">✓</td>
          <td class="check">✓</td>
        </tr>
        <tr>
          <th scope="row">Review invitations</th>
          <td>25 lifetime</td>
          <td>250 / mo</td>
          <td>1,500 / mo</td>
          <td>5,000 / mo</td>
        </tr>
        <tr>
          <th scope="row">Visible collected reviews</th>
          <td>Unlimited</td>
          <td>Unlimited</td>
          <td>Unlimited</td>
          <td>Unlimited</td>
        </tr>
        <tr>
          <th scope="row">Verified by Signed Reviews badge</th>
          <td class="check">✓</td>
          <td class="check">✓</td>
          <td class="check">✓</td>
          <td class="check">✓</td>
        </tr>
        <tr>
          <th scope="row">Team seats</th>
          <td>1</td>
          <td>3</td>
          <td>8</td>
          <td>20</td>
        </tr>
        <tr>
          <th scope="row">Auto-request delays</th>
          <td class="dim">—</td>
          <td>All presets</td>
          <td>All presets</td>
          <td>All presets</td>
        </tr>
        <tr>
          <th scope="row">Automatic reminder emails</th>
          <td class="dim">—</td>
          <td>2 reminders · standard</td>
          <td>2 · custom cadence</td>
          <td>2 · custom cadence</td>
        </tr>
        <tr>
          <th scope="row">Review link expiry</th>
          <td>14 days</td>
          <td>14 days</td>
          <td>14 days</td>
          <td>14 days</td>
        </tr>
        <tr>
          <th scope="row">Public API access</th>
          <td>Public page API</td>
          <td>60 req/min</td>
          <td>300 req/min</td>
          <td>1,000 req/min</td>
        </tr>
        <tr>
          <th scope="row">Webhooks</th>
          <td class="dim">—</td>
          <td class="dim">—</td>
          <td class="check">✓</td>
          <td class="check">✓</td>
        </tr>
        <tr>
          <th scope="row">CSV export</th>
          <td class="dim">—</td>
          <td class="dim">—</td>
          <td class="check">✓</td>
          <td class="check">✓</td>
        </tr>
        <tr>
          <th scope="row">Support</th>
          <td>Community</td>
          <td>Email, 72 h</td>
          <td>Priority, 24 h</td>
          <td>Priority, 12 h</td>
        </tr>
      </tbody>
    </table>
  </div>

  <section class="assurances" aria-label="Common questions">
    <article class="assurance">
      <h3>The trust badge stays on every plan.</h3>
      <p>"Verified by Signed Reviews" is how your visitors know each review was signed by a real Stripe purchase. It's a trust mark, not a paywall — it's included at every tier, including Free.</p>
    </article>
    <article class="assurance">
      <h3>Read-only Stripe access.</h3>
      <p>We never charge, refund, move funds, or modify anything in your Stripe account. We read your Stripe data only to verify reviews and to compute the public-page metrics you choose to show.</p>
    </article>
    <article class="assurance">
      <h3>The API can't create reviews.</h3>
      <p>No matter which plan you're on, reviews only come from real customers clicking real signed invitation links. Our API is read-only — it retrieves and displays reviews but can never create them. The badge stays meaningful because the rule doesn't bend.</p>
    </article>
    <article class="assurance">
      <h3>No surprise billing.</h3>
      <p>Choose a tier and cancel anytime. Annual billing saves two months — never an auto-charge.</p>
    </article>
  </section>

  <section class="cta-bar" aria-label="Get started">
    <h2>Start collecting unfakable reviews today.</h2>
    <p>Free plan available. No credit card required to start.</p>
    <a class="btn btn-primary" href="${PLATFORM_URL}" rel="noopener">Sign up free →</a>
  </section>

  <script>
  (function () {
    function setPeriod(p) {
      document.querySelectorAll('.tier-price-block[data-m-amt]').forEach(function (b) {
        b.querySelector('.amount').textContent = p === 'annual' ? b.dataset.aAmt : b.dataset.mAmt;
        b.querySelector('.period').textContent = p === 'annual' ? b.dataset.aPer : b.dataset.mPer;
      });
      document.querySelectorAll('.col-price[data-m]').forEach(function (c) {
        c.textContent = p === 'annual' ? c.dataset.a : c.dataset.m;
      });
    }
    var btns = document.querySelectorAll('.billing-toggle .bt-btn');
    btns.forEach(function (btn) {
      btn.addEventListener('click', function () {
        var period = btn.getAttribute('data-period');
        btns.forEach(function (b2) {
          var on = b2 === btn;
          b2.classList.toggle('is-active', on);
          b2.setAttribute('aria-pressed', on ? 'true' : 'false');
        });
        setPeriod(period);
      });
    });
  })();
  </script>
`;

  const html = page({
    title: `Pricing — ${COMPANY.brand}`,
    description: 'Signed Reviews pricing — Free, Starter, Pro, and Scale plans. Free plan for self-service; paid plans from $29/mo.',
    slug: '/pricing/',
    hero: {
      eyebrow: 'Pricing',
      title: 'Plans that scale with real customer reviews.',
      subtitle: 'Every plan includes the "Verified by Signed Reviews" trust badge — the mark that tells your visitors each review was signed by a real Stripe purchase.',
    },
    body,
    active: 'pricing',
    extraStyle: PRICING_STYLES,
    bareBody: true,
  });
  writePage('/pricing/', html);
  console.log('  ✓ /pricing/');
}

function buildContact() {
  const body = `
    <article class="prose" style="max-width: var(--max-prose)">
      <h2>Get in touch</h2>
      <p>For product support use the support address. For privacy requests, legal matters, data subject requests, or anything related to the Sub-processor list, use the legal address.</p>

      <ul class="contact-list" style="margin: 1.5rem 0;">
        <li>
          <span class="label">Product support</span>
          <a href="mailto:${COMPANY.supportEmail}">${COMPANY.supportEmail}</a>
          <p style="margin:.4rem 0 0; color: var(--muted); font-size:.88rem;">Account help, onboarding, billing, and bug reports.</p>
        </li>
        <li>
          <span class="label">Legal &amp; privacy</span>
          <a href="mailto:${COMPANY.legalEmail}">${COMPANY.legalEmail}</a>
          <p style="margin:.4rem 0 0; color: var(--muted); font-size:.88rem;">Privacy requests, data subject requests, legal notices, and DMCA.</p>
        </li>
      </ul>

      <h2>Mailing address</h2>
      <address class="address-block" style="font-size:1rem; line-height:1.7;">
        <strong>${COMPANY.legalName}</strong><br>
        1209 Mountain Road Pl NE, Ste N<br>
        Albuquerque, NM 87110<br>
        United States
      </address>

      <h2>Response times</h2>
      <p>We aim to respond to support inquiries within two business days and to legal or privacy inquiries within the timeframes set out in our <a href="${B}privacy/">Privacy Policy</a>.</p>
    </article>`;

  const html = page({
    title: `Contact — ${COMPANY.brand}`,
    description: `Contact Paid Rightly LLC, the operator of Signed Reviews. Support: ${COMPANY.supportEmail}. Legal: ${COMPANY.legalEmail}.`,
    slug: '/contact/',
    hero: {
      eyebrow: 'Contact',
      title: 'Talk to us',
      subtitle: 'The two best ways to reach the team behind Signed Reviews.',
    },
    body,
    active: 'contact',
  });
  writePage('/contact/', html);
  console.log('  ✓ /contact/');
}

function buildAbout() {
  const body = `
    <article class="prose" style="max-width: var(--max-prose)">
      <h2>What we do</h2>
      <p>${COMPANY.description}</p>
      <p>Every review collected through our platform is tied to a real, completed Stripe transaction. A review link is issued either automatically after a charge succeeds (emailed to the buyer's verified address) or on request from the business's public page — and in both cases the email must match an actual purchase. Each review is cryptographically signed so anyone can later verify it hasn't been altered. The result is a review record that ties back to a specific, completed payment — instead of a star rating posted by an anonymous account that may never have purchased anything.</p>

      <h2>Who operates Signed Reviews</h2>
      <p>${COMPANY.brand} is operated by <strong>${COMPANY.legalName}</strong>, a New Mexico limited liability company headquartered in Albuquerque. ${COMPANY.legalName} is the controller of business-user data and the processor of reviewer data on behalf of our business customers. The full breakdown is described in our <a href="${B}privacy/">Privacy Policy</a> and the third parties we rely on are listed in our <a href="${B}subprocessors/">Sub-processors page</a>.</p>

      <h2>How we make money</h2>
      <p>Signed Reviews offers a free plan for self-service collection, always, plus paid plans from $29/mo for automation and higher volume. See the <a href="${B}pricing/">Pricing page</a> and our <a href="${B}refund-policy/">Refund and Cancellation Policy</a>.</p>

      <h2>Things we deliberately don't do</h2>
      <ul class="feature-list">
        <li>No advertising networks, cross-site tracking, or data brokers — our only analytics is first-party PostHog (form inputs masked, no third-party trackers)</li>
        <li>No selling or sharing of personal data — we are not in the data-broker business</li>
        <li>No write access to your Stripe account — our Stripe connection is read-only</li>
        <li>No fake or seeded reviews — a review only exists if a real, completed Stripe transaction backs it</li>
      </ul>

      <h2>Contact</h2>
      <p>Product support: <a href="mailto:${COMPANY.supportEmail}">${COMPANY.supportEmail}</a><br>
      Legal &amp; privacy: <a href="mailto:${COMPANY.legalEmail}">${COMPANY.legalEmail}</a></p>
      <address class="address-block" style="font-size:.95rem;">
        <strong>${COMPANY.legalName}</strong><br>
        ${COMPANY.address}
      </address>
    </article>`;

  const html = page({
    title: `About — ${COMPANY.brand}`,
    description: `About ${COMPANY.brand}, the verified-reviews platform operated by ${COMPANY.legalName}.`,
    slug: '/about/',
    hero: {
      eyebrow: 'About',
      title: `About ${COMPANY.brand}`,
      subtitle: `${COMPANY.brand} is operated by ${COMPANY.legalName}, a New Mexico limited liability company.`,
    },
    body,
    active: 'about',
  });
  writePage('/about/', html);
  console.log('  ✓ /about/');
}

// ── FAQ page ──────────────────────────────────────────────────────────────────
function buildFaq() {
  const faqItems = [
    {
      q: 'What is a purchase-verified review?',
      a: 'A purchase-verified review is a customer review that is cryptographically linked to a completed payment transaction. Signed Reviews connects to your Stripe account and only allows reviews from customers who have actually purchased from you, making every review tamper-evident and provably authentic.',
    },
    {
      q: 'How does Signed Reviews verify reviews?',
      a: 'Signed Reviews links each review to a completed Stripe transaction. When a customer submits a review, the platform verifies the purchase against your Stripe account and cryptographically signs the review, creating a tamper-evident record that proves the reviewer is a real customer and that the review has not been altered.',
    },
    {
      q: 'How is Signed Reviews different from Trustpilot?',
      a: 'Unlike Trustpilot, which allows anyone to write a review without verifying a purchase, Signed Reviews requires a completed Stripe transaction before a review can be submitted. This means every review on Signed Reviews is backed by proof of purchase, eliminating fake reviews by design. Trustpilot removed 2.7 million fake reviews in 2022 alone — Signed Reviews prevents them from being written in the first place.',
    },
    {
      q: 'Do I need to share my Stripe API keys?',
      a: 'No. Signed Reviews uses Stripe\'s official OAuth integration, which means you grant read-only access with one click — no API keys to copy, paste, or store. We never have write access to your Stripe account and cannot charge, refund, or modify anything.',
    },
    {
      q: 'Can customers leave reviews without a purchase?',
      a: 'No. Every review requires a verified purchase. A review link is issued in one of two ways: automatically after a Stripe charge succeeds (emailed to the customer\'s verified email from the transaction), or on request — a customer can visit the business\'s public page and enter their checkout email to receive their own link. In both cases, the email must match a real completed purchase on the business\'s Stripe account. Without a matching purchase, no link is issued and no review can be submitted.',
    },
    {
      q: 'What happens if a charge is refunded?',
      a: 'If a charge is refunded, the associated review is automatically hidden from your public page and API responses. The cryptographic signature remains valid — proving the review was authentic — but the content is no longer displayed. This keeps your review feed accurate while preserving the integrity of the verification system.',
    },
    {
      q: 'How long are review invitation links valid?',
      a: 'Review links are valid for 14 days on every plan. After expiry, the link can no longer be used to submit a review. A new charge (or a fresh self-service request) generates a new invitation.',
    },
    {
      q: 'Can I customize the review request emails?',
      a: 'Yes. You can customize your logo, content alignment, and logo size from the dashboard. The email subject line reflects your business name. Review reminder emails follow the same template with a slightly different subject and lead sentence so they don\'t feel like duplicates.',
    },
    {
      q: 'Does Signed Reviews work with Shopify, WooCommerce, or Squarespace?',
      a: 'Yes. Signed Reviews is a Stripe App, so it installs in one click and connects to your Stripe account — including accounts that Shopify, WooCommerce, or Squarespace manage on your behalf. If your checkout runs on Stripe, your reviews can be verified, with no separate plugin required.',
    },
    {
      q: 'Is Signed Reviews free?',
      a: 'There is a free plan for self-service collection, forever. Paid plans from $29/mo add automation, reminders, webhooks, and higher volume. See our <a href="/pricing/">pricing page</a> for the tiers.',
    },
  ];

  const faqHtml = faqItems.map((item, i) => `
    <details class="faq-item"${i === 0 ? ' open' : ''}>
      <summary class="faq-q">${escapeHtml(item.q)}</summary>
      <div class="faq-a">${item.a}</div>
    </details>`).join('');

  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqItems.map(item => ({
      '@type': 'Question',
      name: item.q,
      acceptedAnswer: {
        '@type': 'Answer',
        text: item.a.replace(/<[^>]+>/g, ''), // strip HTML for schema
      },
    })),
  };

  const extraStyle = `
    .faq-item { border: 1px solid var(--border); border-radius: 12px; margin-bottom: .65rem; background: var(--surface); overflow: hidden; }
    .faq-q { padding: 1.1rem 1.2rem; font-weight: 600; font-size: 1.02rem; color: var(--navy-900); cursor: pointer; list-style: none; display: flex; justify-content: space-between; align-items: center; user-select: none; }
    .faq-q::-webkit-details-marker { display: none; }
    .faq-q::after { content: '+'; font-size: 1.25rem; font-weight: 400; color: var(--gold-500); margin-left: .75rem; flex-shrink: 0; transition: transform .2s ease; }
    details[open] > .faq-q::after { content: '−'; }
    :root.theme-dark .faq-q, :root.theme-auto .faq-q { color: #fff; }
    .faq-a { padding: 0 1.2rem 1.15rem; color: var(--text); line-height: 1.65; font-size: .95rem; }
    .faq-a p { margin: 0; }
  `;

  const body = `<article class="prose" style="max-width: var(--max-prose)">
    <p>Answers to the most common questions about review verification, Stripe integration, and how Signed Reviews works.</p>
    ${faqHtml}
  </article>`;

  const html = page({
    title: 'FAQ — Signed Reviews',
    description: 'Frequently asked questions about Signed Reviews: how purchase verification works, Stripe integration, pricing, security, and more.',
    slug: '/faq/',
    hero: { eyebrow: 'FAQ', title: 'Frequently Asked Questions', subtitle: 'Answers to common questions about review verification, Stripe, and pricing.' },
    body,
    extraStyle,
  });

  // Inject FAQPage schema into <head>
  const schemaTag = `\n  <script type="application/ld+json">${JSON.stringify(faqSchema)}</script>\n</head>`;
  writePage('/faq/', html.replace('</head>', schemaTag));
  console.log('  ✓ /faq/');
}

// ── Blog ──────────────────────────────────────────────────────────────────────
function buildBlog() {
  const blogDir = path.join(FILES_DIR, 'blog');
  const posts = [];

  if (fs.existsSync(blogDir)) {
    const files = fs.readdirSync(blogDir).filter(f => f.endsWith('.md')).sort().reverse();
    for (const file of files) {
      const raw = fs.readFileSync(path.join(blogDir, file), 'utf8');
      const slug = '/blog/' + file.replace(/\.md$/, '/');

      // Extract title from first H1
      const titleMatch = raw.match(/^# (.+)$/m);
      const title = titleMatch ? titleMatch[1].trim() : file.replace(/\.md$/, '').replace(/-/g, ' ');

      // Body = everything after the `---` metadata separator.
      const bodyStart = raw.indexOf('\n---\n');
      const contentBody = bodyStart >= 0 ? raw.slice(bodyStart + 5) : raw;

      // Extract description: explicit `**Description:**` metadata wins; else first body paragraph.
      // The old heuristic grabbed the first SHORT paragraph, which skipped the real (long) intro
      // and landed on a stray bullet — every post had a garbage <meta description> + hero subtitle.
      const descMatch = raw.match(/\*\*Description:\*\*\s*(.+)$/m);
      let desc;
      if (descMatch) {
        desc = descMatch[1].replace(/[#*\[\]]/g, '').replace(/\s+/g, ' ').trim().slice(0, 160);
      } else {
        const firstPara = (contentBody.trim().split(/\n\n/)[0] || '').replace(/[#*`[\]()]/g, '').replace(/\s+/g, ' ').trim();
        desc = firstPara ? firstPara.slice(0, 157) + '…' : title;
      }

      // Render markdown body (strip the first H1 — hero shows it)
      const renderedBody = renderMarkdown(contentBody).replace(/<h1[^>]*>[\s\S]*?<\/h1>/, '');

      // Stop at the `·` separator (or newline) so the date doesn't swallow a trailing `·`.
      const dateMatch = raw.match(/\*\*Published:\*\*\s*([^\n·]+)/);
      const dateStr = dateMatch ? dateMatch[1].trim() : '';

      posts.push({ title, desc, slug, file, renderedBody, dateStr });
    }
  }

  // Individual post pages
  for (const post of posts) {
    const canonical = `${SITE_URL}${post.slug}`;
    // Per-article OG image (generated by build-og-images.js).
    const ogSlug = post.file.replace(/\.md$/, '');
    const ogImage = `${SITE_URL}/images/og/${ogSlug}.png`;
    const schema = {
      '@context': 'https://schema.org',
      '@type': 'BlogPosting',
      headline: post.title,
      description: post.desc,
      datePublished: post.dateStr || undefined,
      dateModified: post.dateStr || undefined,
      mainEntityOfPage: { '@type': 'WebPage', '@id': canonical },
      image: [ogImage],
      author: { '@type': 'Organization', name: 'Signed Reviews', url: SITE_URL },
      publisher: { '@type': 'Organization', name: 'Signed Reviews', logo: { '@type': 'ImageObject', url: `${SITE_URL}/images/SignedReviews_logo_only.png` } },
    };

    const body = `<article class="prose" style="max-width: var(--max-prose)">
      ${post.dateStr ? `<p class="post-meta" style="color:var(--muted);font-size:.9rem;margin-bottom:1.5rem;">${escapeHtml(post.dateStr)}</p>` : ''}
      ${post.renderedBody}
      <p style="margin-top:2.5rem;padding-top:1.5rem;border-top:1px solid var(--border);">
        <a href="${B}blog/">← Back to blog</a>
      </p>
    </article>`;

    const html = page({
      title: `${post.title} — Signed Reviews Blog`,
      description: post.desc,
      slug: post.slug,
      pageType: 'article',
      hero: { eyebrow: 'Blog', title: post.title, subtitle: post.desc },
      body,
    });

    const ogReplace = html
      .replace(
        /<meta property="og:image" content="[^"]*">/,
        `<meta property="og:image" content="${ogImage}">`
      )
      .replace(
        /<meta name="twitter:image" content="[^"]*">/,
        `<meta name="twitter:image" content="${ogImage}">`
      );
    const schemaTag = `\n  <script type="application/ld+json">${JSON.stringify(schema)}</script>\n</head>`;
    writePage(post.slug, ogReplace.replace('</head>', schemaTag));
    console.log(`  ✓ ${post.slug}`);
  }

  // Blog index page
  const indexBody = `<article class="prose" style="max-width: var(--max-prose)">
    <p>Insights on review authenticity, e-commerce trust, Stripe integrations, and verified customer reviews from the Signed Reviews team.</p>
    ${posts.map(p => `
    <div style="margin-bottom:1.5rem;padding-bottom:1.5rem;border-bottom:1px solid var(--border);">
      <h2 style="margin:0 0 .3rem;font-size:1.25rem;"><a href="${B}${p.slug.replace(/^\//, '')}" style="text-decoration:none;">${escapeHtml(p.title)}</a></h2>
      ${p.dateStr ? `<p class="post-meta" style="color:var(--muted);font-size:.85rem;margin:0 0 .4rem;">${escapeHtml(p.dateStr)}</p>` : ''}
      <p style="margin:0;color:var(--text);font-size:.95rem;">${escapeHtml(p.desc)}</p>
    </div>`).join('')}
  </article>`;

  const indexHtml = page({
    title: 'Blog — Signed Reviews',
    description: 'Insights on review authenticity, e-commerce trust, Stripe integrations, and verified customer reviews.',
    slug: '/blog/',
    hero: { eyebrow: 'Blog', title: 'Signed Reviews Blog', subtitle: 'Insights on review authenticity, trust, and the Stripe ecosystem.' },
    body: indexBody,
  });
  writePage('/blog/', indexHtml);
  console.log('  ✓ /blog/ (index)');
  return posts.map(p => ({ slug: p.slug, lastmod: p.dateStr }));
}

// ── How It Works page ─────────────────────────────────────────────────────────
function buildHowItWorks() {
  const steps = [
    { num: '1', title: 'Connect your Stripe account', body: 'One click. You authorize Signed Reviews via Stripe\'s official OAuth flow. We get <strong>read-only</strong> access — we can verify charges but can never charge, refund, or modify anything in your Stripe account.' },
    { num: '2', title: 'Customer completes a purchase', body: 'A customer buys from you. Stripe processes the payment as usual. Signed Reviews detects the <code>charge.succeeded</code> event and automatically creates a unique, expiring review invitation linked to that specific transaction.' },
    { num: '3', title: 'Review invitation is sent', body: 'The invitation email is sent to the customer\'s verified payment email from the Stripe transaction. You control the timing — immediately, after a delay (for shipped products), or on delivery via our delivery webhook. The email carries your branding and logo.' },
    { num: '4', title: 'Customer submits their review', body: 'The customer clicks the unique link, writes their review, and submits it. At the moment of submission, the review content, transaction ID, customer email, and timestamp are <strong>cryptographically signed</strong> — creating a tamper-evident record.' },
    { num: '5', title: 'Review is verified and published', body: 'The signed review appears on your public page and in your dashboard. The cryptographic signature can be independently verified by anyone — proving the review came from a real customer, about a real purchase, and hasn\'t been altered.' },
    { num: '6', title: 'Optional: reminders and follow-ups', body: 'If the customer hasn\'t left a review after a few days, automatic reminders are sent (configurable cadence). Reminders stop when the customer clicks the link, submits a review, or unsubscribes. You can also trigger review requests at delivery time via our webhook.' },
  ];

  const extraStyle = `
    .step { display: flex; gap: 1.25rem; align-items: flex-start; padding: 1.5rem 0; border-bottom: 1px solid var(--border); }
    .step:first-of-type { padding-top: 0; }
    .step:last-of-type { border-bottom: 0; padding-bottom: 0; }
    .step-num { flex-shrink: 0; width: 44px; height: 44px; border-radius: 12px; background: linear-gradient(135deg, var(--gold-400), var(--gold-500)); color: #fff; display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 1.1rem; font-family: 'JetBrains Mono', ui-monospace, monospace; }
    .step-body h3 { font-family: 'Instrument Serif', Georgia, serif; font-size: 1.25rem; margin: 0 0 .35rem; color: var(--navy-900); }
    :root.theme-dark .step-body h3, :root.theme-auto .step-body h3 { color: #fff; }
    .step-body p { margin: 0; color: var(--text); line-height: 1.65; }
    .step-body code { font-family: 'JetBrains Mono', ui-monospace, monospace; font-size: .88em; background: var(--navy-50); color: var(--navy-700); padding: .1em .4em; border-radius: 4px; }
    :root.theme-dark .step-body code, :root.theme-auto .step-body code { background: rgba(255,255,255,.08); color: var(--gold-300); }
  `;

  const body = `<article class="prose" style="max-width: 760px">
    <p>From Stripe purchase to verified review in six steps. The entire flow is automated — you connect once, and Signed Reviews handles the rest.</p>
    ${steps.map(s => `
    <div class="step">
      <div class="step-num">${s.num}</div>
      <div class="step-body">
        <h3>${escapeHtml(s.title)}</h3>
        <p>${s.body}</p>
      </div>
    </div>`).join('')}
    <p style="text-align:center;margin-top:2.5rem;"><a class="btn btn-primary" href="${PLATFORM_URL}" rel="noopener" style="display:inline-flex;align-items:center;gap:.5rem;padding:.85rem 1.6rem">Connect your Stripe account →</a></p>
  </article>`;

  const html = page({
    title: 'How It Works — Signed Reviews',
    description: 'See how Signed Reviews verifies reviews: connect Stripe, customer purchases, auto-send invitation, customer reviews, cryptographic signing, and publishing — all automated.',
    slug: '/how-it-works/',
    hero: { eyebrow: 'How It Works', title: 'From purchase to verified review', subtitle: 'Six automated steps. Zero manual work. Every review cryptographically backed by a real Stripe transaction.' },
    body,
    extraStyle,
  });
  writePage('/how-it-works/', html);
  console.log('  ✓ /how-it-works/');
}

// ── Comparison pages: shared styles ────────────────────────────────────────────
const COMPARISON_STYLES = `
  .vs-table { width:100%; border-collapse:separate; border-spacing:0; border:1px solid var(--border); border-radius:14px; overflow:hidden; font-size:.94rem; margin:1.5rem 0 2rem; }
  .vs-table thead th { background:var(--navy-50); color:var(--navy-900); font-weight:600; text-align:left; padding:.95rem 1.1rem; border-bottom:1px solid var(--border); }
  :root.theme-dark .vs-table thead th, :root.theme-auto .vs-table thead th { background:rgba(255,255,255,.04); color:#fff; }
  .vs-table thead th:first-child { width:35%; }
  .vs-table td, .vs-table th { padding:.8rem 1.1rem; border-bottom:1px solid var(--border); vertical-align:top; }
  .vs-table td:first-child { font-weight:600; color:var(--navy-900); }
  :root.theme-dark .vs-table td:first-child, :root.theme-auto .vs-table td:first-child { color:#fff; }
  .vs-table .win  { color:var(--gold-600); font-weight:700; }
  .vs-table .lose { color:var(--muted); }
  .vs-table .tie { color:var(--text); }
  .vs-table tbody tr:last-child td { border-bottom:0; }
  .vs-table .highlight-row { background:rgba(179,157,69,.06); }
  :root.theme-dark .vs-table .highlight-row, :root.theme-auto .vs-table .highlight-row { background:rgba(179,157,69,.08); }
  .verdict { background:linear-gradient(135deg,var(--navy-800),var(--navy-900)); border-radius:14px; padding:2rem; color:#fff; margin:2rem 0; }
  .verdict h3 { font-family:'Instrument Serif',Georgia,serif; font-size:1.5rem; margin:0 0 .5rem; color:#fff; }
  .verdict p { color:var(--navy-200); margin:0; line-height:1.6; }
  .verdict-alt { background:linear-gradient(135deg,#1c2840,#243252); }
`;

// ── Comparison page: Signed Reviews vs Trustpilot ──────────────────────────────
function buildComparison() {
  const body = `<article class="prose" style="max-width: 860px">
    <p>Choosing a review platform is a trust decision. Here's how Signed Reviews compares to Trustpilot — the largest general-purpose review platform — across the dimensions that matter most for businesses that care about review authenticity.</p>

    <div class="vs-table-wrap" style="overflow-x:auto;">
    <table class="vs-table">
      <thead>
        <tr><th>Capability</th><th>Signed Reviews</th><th>Trustpilot</th></tr>
      </thead>
      <tbody>
        <tr class="highlight-row"><td>Purchase verification</td><td class="win">Required — every review is cryptographically linked to a completed Stripe transaction</td><td class="lose">Optional — businesses can invite customers, but anyone can leave a review without proof of purchase</td></tr>
        <tr><td>Fake review prevention</td><td class="win">Structural — no purchase = no invitation = no review. Impossible to post a review without a verified transaction.</td><td class="lose">Reactive — relies on automated detection and manual moderation. Trustpilot removed 2.7M fake reviews in 2022.</td></tr>
        <tr class="highlight-row"><td>Review authenticity proof</td><td class="win">Cryptographically signed — every review carries a tamper-evident digital signature that can be independently verified</td><td class="lose">No cryptographic proof — reviews are database records with no external verifiability</td></tr>
        <tr><td>Stripe integration</td><td class="win">Native — one-click OAuth, read-only access, automatic review requests on every charge</td><td class="lose">No native Stripe integration — requires third-party connectors or manual CSV imports</td></tr>
        <tr class="highlight-row"><td>Review gating</td><td class="win">Automatic — invitations go to the email on each Stripe transaction, and customers can also request their own verified link from the business's public page. Either way, a completed purchase is required.</td><td class="lose">Manual — businesses must upload customer lists or send invitations themselves</td></tr>
        <tr><td>Refund handling</td><td class="win">Automatic — refunded reviews are hidden from public display immediately via Stripe webhook</td><td class="lose">Manual — businesses must flag or report reviews from refunded customers</td></tr>
        <tr class="highlight-row"><td>API & integrations</td><td class="win">REST API, webhooks, delivery webhook, public page API</td><td class="win">Extensive API, 100+ integrations, white-label options on Enterprise</td></tr>
        <tr><td>Pricing model</td><td class="win">Free plan + paid plans from $29/mo (Starter) to $199/mo (Scale). Transparent tiered pricing with monthly invitation caps.</td><td class="lose">Free tier available; paid plans start at $99/mo (Starter, billed annually) and run to $799/mo+ (Premium). Enterprise pricing is opaque.</td></tr>
        <tr class="highlight-row"><td>Organic discoverability</td><td class="lose">Early stage — limited domain authority and no consumer-facing review directory</td><td class="win">Established — Trustpilot.com has massive organic traffic and a consumer-facing review search</td></tr>
        <tr><td>Trust mark / badge</td><td class="win">"Verified by Signed Reviews" badge links to cryptographic proof. Included on every plan, including Free.</td><td class="win">Trustpilot TrustBox widgets and star ratings. Widely recognized by consumers.</td></tr>
        <tr class="highlight-row"><td>Review ownership</td><td class="win">Business owns the reviews — Signed Reviews is the processor. Reviews belong to you.</td><td class="lose">Reviews live on Trustpilot's platform — businesses cannot export and move reviews to another provider.</td></tr>
      </tbody>
    </table>
    </div>

    <div class="verdict">
      <h3>When to choose Signed Reviews</h3>
      <p>If review authenticity is your #1 concern — if you want every review to be provably backed by a real purchase, with cryptographic proof — Signed Reviews is the right choice. It's built for businesses that process payments through Stripe and want a zero-fake-review guarantee by design, not by detection.</p>
    </div>

    <div class="verdict" style="background:linear-gradient(135deg,#1c2840,#243252)">
      <h3>When Trustpilot may be a better fit</h3>
      <p>If you need maximum consumer reach, have a large existing review base, or don't process payments through Stripe, Trustpilot's established brand recognition and consumer-facing directory give it an edge in organic discoverability. Many businesses use both — Trustpilot for breadth, Signed Reviews for verifiable depth.</p>
    </div>

    <p style="text-align:center;margin-top:2rem;"><a class="btn btn-primary" href="${PLATFORM_URL}" rel="noopener" style="display:inline-flex;align-items:center;gap:.5rem;padding:.85rem 1.6rem">Start collecting verified reviews →</a></p>
  </article>`;

  const html = page({
    title: 'Signed Reviews vs Trustpilot — Comparison',
    description: 'Detailed comparison of Signed Reviews and Trustpilot: purchase verification, fake review prevention, Stripe integration, pricing, API, review ownership, and more.',
    slug: '/vs/trustpilot/',
    hero: { eyebrow: 'Comparison', title: 'Signed Reviews vs Trustpilot', subtitle: 'A detailed comparison across the dimensions that matter for review authenticity.' },
    body,
    extraStyle: COMPARISON_STYLES,
  });
  writePage('/vs/trustpilot/', html);
  console.log('  ✓ /vs/trustpilot/');
}

// ── Comparison: Signed Reviews vs Feefo ───────────────────────────────────────
function buildComparisonFeefo() {
  const slug = '/vs/feefo/';
  const body = `<article class="prose" style="max-width: 860px">
    <p>Feefo is the closest positioning competitor to Signed Reviews — both platforms emphasize verified, invitation-only reviews. But the verification source is fundamentally different: Feefo trusts the merchant's transaction feed; Signed Reviews trusts Stripe. Here's how they compare across every dimension that matters.</p>

    <div class="vs-table-wrap" style="overflow-x:auto;">
    <table class="vs-table">
      <thead><tr><th>Capability</th><th>Signed Reviews</th><th>Feefo</th></tr></thead>
      <tbody>
        <tr class="highlight-row"><td>Verification source</td><td class="win">Stripe — an independent payment processor. Every review is attested by Stripe confirming the charge occurred.</td><td class="lose">Merchant transaction feed — the merchant provides Feefo with a log of transactions, which Feefo uses to verify. The merchant is both the subject of the review and the source of the verification data.</td></tr>
        <tr><td>Fake review prevention</td><td class="win">Structural — no Stripe charge = no invitation = no review. Impossible to post without a verified payment.</td><td class="lose">Closed/invitation-only — only invited customers can review, but verification depends on the merchant's own transaction data.</td></tr>
        <tr class="highlight-row"><td>Integration setup</td><td class="win">One-click Stripe OAuth. No code, no feed configuration, no manual data upload. Works immediately.</td><td class="lose">Requires the merchant to integrate a transaction feed — more setup overhead for the same verification concept.</td></tr>
        <tr><td>Cryptographic proof</td><td class="win">Every review is cryptographically signed at submission — tamper-evident, independently verifiable.</td><td class="lose">No cryptographic signing — reviews are database records with no external verifiability.</td></tr>
        <tr class="highlight-row"><td>Refund handling</td><td class="win">Automatic — Stripe webhook hides refunded reviews immediately. No merchant action required.</td><td class="lose">Depends on the merchant updating their transaction feed with refund status.</td></tr>
        <tr><td>Stripe integration</td><td class="win">Native — built exclusively for Stripe. One-click, read-only, zero maintenance.</td><td class="lose">No native Stripe integration — works through a generic transaction feed API.</td></tr>
        <tr class="highlight-row"><td>Pricing model</td><td class="win">Free plan + paid plans from $29/mo (Starter) to $199/mo (Scale). Transparent, per-invitation caps.</td><td class="lose">Custom pricing — typically £99–£399/month for SMB tiers. Enterprise pricing is opaque.</td></tr>
        <tr><td>Google Seller Ratings</td><td class="tie">Planned — on the roadmap for Q4 2026.</td><td class="win">Yes — Feefo is a Google Review Partner and feeds into Google Seller Ratings.</td></tr>
        <tr class="highlight-row"><td>Platform maturity</td><td class="lose">Early stage — launched 2026, building domain authority and customer base.</td><td class="win">Established — founded 2010, strong UK presence, mature enterprise offering.</td></tr>
        <tr><td>Review ownership</td><td class="win">Business owns the reviews — Signed Reviews is the processor. Exportable, portable.</td><td class="win">Business owns the reviews — Feefo's model is also merchant-owned reviews.</td></tr>
      </tbody>
    </table>
    </div>

    <div class="verdict">
      <h3>When to choose Signed Reviews</h3>
      <p>If you process payments through Stripe and want the strongest possible verification — independent attestation by a payment processor rather than a merchant-supplied feed — Signed Reviews is the answer. The one-click setup and automatic refund handling make it lower-friction than Feefo, and the cryptographic signing adds a layer of proof Feefo doesn't offer.</p>
    </div>

    <div class="verdict verdict-alt">
      <h3>When Feefo may be a better fit</h3>
      <p>If you need Google Seller Ratings today, Feefo's Google Review Partner status is a concrete advantage. If you don't process payments through Stripe, or if you need a mature, enterprise-grade platform with a long track record in the UK and EU, Feefo's 15-year history and deep integration ecosystem may outweigh the verification-method difference.</p>
    </div>

    <p style="text-align:center;margin-top:2rem;"><a class="btn btn-primary" href="${PLATFORM_URL}" rel="noopener" style="display:inline-flex;align-items:center;gap:.5rem;padding:.85rem 1.6rem">Start collecting verified reviews →</a></p>
    <p style="text-align:center;margin-top:1.25rem;font-size:.9rem;color:var(--muted);">Related: <a href="/learn/what-does-verified-buyer-mean/">What "Verified Buyer" means</a> · <a href="/vs/trustpilot/">Signed Reviews vs Trustpilot</a> · <a href="/blog/stripe-verified-reviews/">Stripe Verified Reviews</a></p>
  </article>`;

  const html = page({
    title: 'Signed Reviews vs Feefo — Comparison',
    description: 'Signed Reviews vs Feefo: both are invitation-only, but Signed Reviews verifies against Stripe itself while Feefo trusts the merchant\'s transaction feed. Detailed comparison across 10 dimensions.',
    slug,
    hero: { eyebrow: 'Comparison', title: 'Signed Reviews vs Feefo', subtitle: 'Both verify purchases. The difference is who does the verifying — the payment processor, or the merchant\'s own feed.' },
    body,
    extraStyle: COMPARISON_STYLES,
  });
  writePage(slug, html);
  console.log('  ✓ /vs/feefo/');
}

// ── Comparison: Signed Reviews vs Judge.me ────────────────────────────────────
function buildComparisonJudgeMe() {
  const slug = '/vs/judge-me/';
  const body = `<article class="prose" style="max-width: 860px">
    <p>Judge.me is the #1 Shopify review app with 127 million reviews collected. It's excellent at what it does — but its "verified" badge trusts your Shopify order data, not an independent payment processor. Here's how they compare.</p>

    <div class="vs-table-wrap" style="overflow-x:auto;">
    <table class="vs-table">
      <thead><tr><th>Capability</th><th>Signed Reviews</th><th>Judge.me</th></tr></thead>
      <tbody>
        <tr class="highlight-row"><td>Verification source</td><td class="win">Stripe — independent payment processor confirms the charge. Processor-attested (Level 4).</td><td class="lose">Shopify order data — the app matches a reviewer to a Shopify order. Merchant-supplied (Level 3).</td></tr>
        <tr><td>Fake review prevention</td><td class="win">Structural — no Stripe charge = no review. Would require faking a real payment with Stripe fees and account-closure risk.</td><td class="lose">Order-matched — reviews must match a Shopify order, but a merchant could create fake orders in their own store.</td></tr>
        <tr class="highlight-row"><td>Platform</td><td class="win">Stripe — works with any platform that uses Stripe: Shopify, WooCommerce, Squarespace, custom, SaaS.</td><td class="lose">Shopify-only — Judge.me is exclusively a Shopify app. No support for other platforms.</td></tr>
        <tr><td>Cryptographic proof</td><td class="win">Yes — every review is cryptographically signed at submission. Tamper-evident, independently verifiable.</td><td class="lose">No — reviews are database records with no cryptographic signature.</td></tr>
        <tr class="highlight-row"><td>Refund handling</td><td class="win">Automatic — Stripe refund webhook hides refunded reviews immediately.</td><td class="tie">Manual — merchants can hide reviews, but there's no automatic refund→hide pipeline.</td></tr>
        <tr><td>Pricing</td><td class="win">Free plan (25 invitations/mo) + paid from $29/mo to $199/mo.</td><td class="win">Free plan (unlimited reviews) + Awesome plan at $15/mo. Very competitive pricing.</td></tr>
        <tr class="highlight-row"><td>Review volume</td><td class="lose">Early stage — growing review base.</td><td class="win">127M+ reviews collected. Massive volume, high consumer trust through sheer scale.</td></tr>
        <tr><td>Shopify integration</td><td class="tie">Works with Shopify if you use Stripe as your payment processor (including Shopify Payments, which runs on Stripe).</td><td class="win">Native Shopify app — one-click install from the Shopify App Store. Deep Shopify admin integration.</td></tr>
        <tr class="highlight-row"><td>Review request automation</td><td class="win">Automatic — every Stripe charge triggers a review invitation. Configurable timing and reminders.</td><td class="win">Automatic — sends review requests based on order fulfillment status. Highly configurable.</td></tr>
        <tr><td>Review ownership</td><td class="win">Business owns the reviews — exportable, portable, accessible via API.</td><td class="win">Business owns the reviews — can be exported and migrated.</td></tr>
      </tbody>
    </table>
    </div>

    <div class="verdict">
      <h3>When to choose Signed Reviews</h3>
      <p>If verification strength is your #1 priority, the difference between "matched to a Shopify order" and "attested by Stripe" is the whole ballgame. Signed Reviews gives you processor-attested verification with cryptographic proof — something no Shopify review app can claim. If you sell across multiple platforms (Shopify + custom site + invoices), Signed Reviews works everywhere Stripe does.</p>
    </div>

    <div class="verdict verdict-alt">
      <h3>When Judge.me may be a better fit</h3>
      <p>If you're a Shopify-only store, want the lowest possible price ($15/mo for unlimited reviews), and need deep Shopify admin integration, Judge.me is the category leader for good reason. Its review volume and Shopify App Store presence give it distribution and credibility that a newer entrant can't match yet. If verification method isn't your differentiator, Judge.me is an excellent, affordable choice.</p>
    </div>

    <p style="text-align:center;margin-top:2rem;"><a class="btn btn-primary" href="${PLATFORM_URL}" rel="noopener" style="display:inline-flex;align-items:center;gap:.5rem;padding:.85rem 1.6rem">Start collecting verified reviews →</a></p>
    <p style="text-align:center;margin-top:1.25rem;font-size:.9rem;color:var(--muted);">Related: <a href="/learn/what-does-verified-buyer-mean/">What "Verified Buyer" means</a> · <a href="/vs/trustpilot/">Signed Reviews vs Trustpilot</a> · <a href="/blog/stripe-verified-reviews/">Stripe Verified Reviews</a></p>
  </article>`;

  const html = page({
    title: 'Signed Reviews vs Judge.me — Comparison',
    description: 'Signed Reviews vs Judge.me: both verify purchases, but Signed Reviews verifies against Stripe itself while Judge.me matches Shopify orders. 10-dimension comparison for Shopify merchants on Stripe.',
    slug,
    hero: { eyebrow: 'Comparison', title: 'Signed Reviews vs Judge.me', subtitle: 'Judge.me is excellent. But its "verified" trusts your Shopify data. Ours trusts Stripe.' },
    body,
    extraStyle: COMPARISON_STYLES,
  });
  writePage(slug, html);
  console.log('  ✓ /vs/judge-me/');
}

// ── Comparison: Signed Reviews vs Yotpo ───────────────────────────────────────
function buildComparisonYotpo() {
  const slug = '/vs/yotpo/';
  const body = `<article class="prose" style="max-width: 860px">
    <p>Yotpo is the enterprise DTC default — used by brands like Patagonia, Steve Madden, and Brooklinen. Its "Verified Buyer" badge means the merchant's Mail-After-Purchase email matched a customer record. Signed Reviews' badge means Stripe independently confirms the charge. Here's the detailed comparison.</p>

    <div class="vs-table-wrap" style="overflow-x:auto;">
    <table class="vs-table">
      <thead><tr><th>Capability</th><th>Signed Reviews</th><th>Yotpo</th></tr></thead>
      <tbody>
        <tr class="highlight-row"><td>Verification method</td><td class="win">Processor-attested — Stripe confirms the charge independently. Level 4 on the verification spectrum.</td><td class="lose">Mail-After-Purchase (MAP) — the review invitation email is matched to a merchant order record. Level 3 — merchant-supplied.</td></tr>
        <tr><td>Fake review prevention</td><td class="win">Structural — no Stripe charge = no review. Impossible to manufacture without faking a real payment.</td><td class="lose">Order-matched — reviews are matched to orders in the merchant's system. Stronger than open platforms, but the merchant controls the order data.</td></tr>
        <tr class="highlight-row"><td>Stripe integration</td><td class="win">Native — one-click OAuth, read-only, zero code. Built exclusively for Stripe.</td><td class="lose">No native Stripe integration — works through e-commerce platform connectors (Shopify, Magento, BigCommerce).</td></tr>
        <tr><td>Cryptographic proof</td><td class="win">Yes — every review carries a tamper-evident digital signature. Verifiable by anyone, anytime.</td><td class="lose">No — reviews are database records. Yotpo's moderation is algorithmic, not cryptographic.</td></tr>
        <tr class="highlight-row"><td>Refund handling</td><td class="win">Automatic — Stripe webhook hides refunded reviews immediately. No configuration needed.</td><td class="lose">Manual — merchants must manage review display for refunded orders themselves.</td></tr>
        <tr><td>Pricing</td><td class="win">Free plan + $29–$199/mo. Transparent tiered pricing with invitation caps.</td><td class="lose">Free plan (limited) + paid plans from $15/mo (Silver) to $119/mo+ (Enterprise). Many features — including Google Seller Ratings — are locked behind higher tiers.</td></tr>
        <tr class="highlight-row"><td>Enterprise features</td><td class="lose">Early stage — focused on core verification, API, and publishing. Loyalty and SMS are not yet available.</td><td class="win">Full suite — loyalty & referrals, SMS marketing, subscriptions, visual UGC, AI-powered insights. Yotpo is a marketing platform built around reviews.</td></tr>
        <tr><td>Platform support</td><td class="win">Any platform that uses Stripe — Shopify, WooCommerce, custom, SaaS, invoices.</td><td class="win">Shopify, Shopify Plus, Magento, BigCommerce, Salesforce Commerce Cloud. Broad platform support.</td></tr>
        <tr class="highlight-row"><td>UGC / visual reviews</td><td class="tie">Photo reviews supported — customers can attach images to their reviews.</td><td class="win">Best-in-class visual UGC — photo and video reviews, shoppable galleries, Instagram integration. Yotpo leads here.</td></tr>
        <tr><td>Review ownership</td><td class="win">Business owns the reviews. Exportable, portable via API.</td><td class="win">Business owns the reviews. Can be exported and migrated.</td></tr>
      </tbody>
    </table>
    </div>

    <div class="verdict">
      <h3>When to choose Signed Reviews</h3>
      <p>If you're on Stripe and review authenticity is your competitive advantage, Signed Reviews gives you something Yotpo can't: processor-attested verification. The difference between "the merchant's email system says this person bought" and "Stripe confirms this person paid" is the difference between a marketing claim and an independently verifiable fact. For businesses where trust is the product, that difference is worth more than Yotpo's feature breadth.</p>
    </div>

    <div class="verdict verdict-alt">
      <h3>When Yotpo may be a better fit</h3>
      <p>If you need a full marketing suite — loyalty programs, SMS marketing, visual UGC galleries, AI-driven insights — Yotpo's breadth is unmatched. For enterprise DTC brands spending six figures on retention, Yotpo is the category leader. If verification method is "nice to have" rather than a core differentiator, and you value the integrated marketing toolkit, Yotpo is the stronger choice.</p>
    </div>

    <p style="text-align:center;margin-top:2rem;"><a class="btn btn-primary" href="${PLATFORM_URL}" rel="noopener" style="display:inline-flex;align-items:center;gap:.5rem;padding:.85rem 1.6rem">Start collecting verified reviews →</a></p>
    <p style="text-align:center;margin-top:1.25rem;font-size:.9rem;color:var(--muted);">Related: <a href="/learn/what-does-verified-buyer-mean/">What "Verified Buyer" means</a> · <a href="/vs/feefo/">Signed Reviews vs Feefo</a> · <a href="/blog/stripe-verified-reviews/">Stripe Verified Reviews</a></p>
  </article>`;

  const html = page({
    title: 'Signed Reviews vs Yotpo — Comparison',
    description: 'Signed Reviews vs Yotpo: Yotpo\'s Verified Buyer = the MAP email matched. Ours = Stripe confirms the charge. 10-dimension comparison for DTC brands on Stripe.',
    slug,
    hero: { eyebrow: 'Comparison', title: 'Signed Reviews vs Yotpo', subtitle: 'Yotpo\'s Verified Buyer means the merchant\'s email matched. Ours means Stripe confirms the charge.' },
    body,
    extraStyle: COMPARISON_STYLES,
  });
  writePage(slug, html);
  console.log('  ✓ /vs/yotpo/');
}

// ── Comparison: Signed Reviews vs eKomi ───────────────────────────────────────
function buildComparisonEkomi() {
  const slug = '/vs/ekomi/';
  const body = `<article class="prose" style="max-width: 860px">
    <p>eKomi is the closest "transaction-verified" competitor — a Google Review Partner that verifies reviews against a merchant-supplied transaction feed. The positioning is similar; the verification source is not. eKomi trusts the feed you supply; Signed Reviews trusts Stripe. Here's how they compare.</p>

    <div class="vs-table-wrap" style="overflow-x:auto;">
    <table class="vs-table">
      <thead><tr><th>Capability</th><th>Signed Reviews</th><th>eKomi</th></tr></thead>
      <tbody>
        <tr class="highlight-row"><td>Verification source</td><td class="win">Stripe — independent payment processor. Processor-attested (Level 4).</td><td class="lose">Merchant transaction feed — the merchant provides a feed of transactions. Merchant-supplied (Level 3), despite the "transaction-verified" label.</td></tr>
        <tr><td>Fake review prevention</td><td class="win">Structural — no Stripe charge = no review. Faking requires real Stripe payments with real fees.</td><td class="lose">Feed-dependent — verification is only as strong as the integrity of the merchant's transaction feed. A feed can be fabricated.</td></tr>
        <tr class="highlight-row"><td>Stripe integration</td><td class="win">Native — one-click Stripe OAuth. No feed setup, no API configuration.</td><td class="lose">No native Stripe integration — requires the merchant to set up and maintain a transaction feed.</td></tr>
        <tr><td>Google Seller Ratings</td><td class="tie">Planned — on the roadmap for Q4 2026.</td><td class="win">Yes — eKomi is a certified Google Review Partner and feeds into Google Seller Ratings and Google Shopping.</td></tr>
        <tr class="highlight-row"><td>Cryptographic proof</td><td class="win">Yes — every review carries a tamper-evident digital signature. Independently verifiable.</td><td class="lose">No — reviews are database records. eKomi's "certificate" system provides audit-trail data but not cryptographic proof.</td></tr>
        <tr><td>Refund handling</td><td class="win">Automatic — Stripe webhook hides refunded reviews immediately. Zero merchant action.</td><td class="lose">Feed-dependent — the merchant must update the transaction feed with refund status for reviews to be flagged.</td></tr>
        <tr class="highlight-row"><td>Pricing</td><td class="win">Free plan + $29–$199/mo. Transparent, self-serve pricing.</td><td class="lose">Custom pricing — typically €49–€299/month for SMB tiers. Enterprise pricing is opaque. Requires a sales conversation.</td></tr>
        <tr><td>Platform maturity</td><td class="lose">Early stage — launched 2026.</td><td class="win">Established — founded 2008 in Berlin. 15+ years in the review space, strong EU presence, Google partnership.</td></tr>
        <tr class="highlight-row"><td>Setup complexity</td><td class="win">One click — OAuth, done. Reviews start flowing automatically.</td><td class="lose">Feed integration required — the merchant must set up and maintain a data feed. More overhead, same verification concept.</td></tr>
        <tr><td>Review ownership</td><td class="win">Business owns the reviews — exportable, portable, accessible via API.</td><td class="win">Business owns the reviews — eKomi's model is merchant-owned reviews.</td></tr>
      </tbody>
    </table>
    </div>

    <div class="verdict">
      <h3>When to choose Signed Reviews</h3>
      <p>If you're on Stripe, the choice is straightforward: Signed Reviews gives you stronger verification (processor-attested vs feed-attested) with less setup (one click vs feed integration). The cryptographic signing and automatic refund handling are features eKomi can't match because they depend on direct payment-processor integration. For Stripe-native businesses, Signed Reviews is the higher-integrity, lower-friction option.</p>
    </div>

    <div class="verdict verdict-alt">
      <h3>When eKomi may be a better fit</h3>
      <p>If Google Seller Ratings is a must-have today, eKomi's certified Google Review Partner status delivers concrete SEO value that Signed Reviews is still building toward. If you don't use Stripe as your primary processor, or if you operate primarily in the EU and value eKomi's 15-year track record and established Google partnership, eKomi is a strong choice — especially for businesses that already have the technical resources to maintain a transaction feed.</p>
    </div>

    <p style="text-align:center;margin-top:2rem;"><a class="btn btn-primary" href="${PLATFORM_URL}" rel="noopener" style="display:inline-flex;align-items:center;gap:.5rem;padding:.85rem 1.6rem">Start collecting verified reviews →</a></p>
    <p style="text-align:center;margin-top:1.25rem;font-size:.9rem;color:var(--muted);">Related: <a href="/learn/what-does-verified-buyer-mean/">What "Verified Buyer" means</a> · <a href="/vs/feefo/">Signed Reviews vs Feefo</a> · <a href="/blog/stripe-verified-reviews/">Stripe Verified Reviews</a></p>
  </article>`;

  const html = page({
    title: 'Signed Reviews vs eKomi — Comparison',
    description: 'Signed Reviews vs eKomi: eKomi verifies a transaction feed you supply; Signed Reviews verifies against Stripe itself. 10-dimension comparison including Google Seller Ratings, pricing, and setup.',
    slug,
    hero: { eyebrow: 'Comparison', title: 'Signed Reviews vs eKomi', subtitle: 'eKomi verifies a feed you supply. We verify against Stripe itself. That\'s the difference.' },
    body,
    extraStyle: COMPARISON_STYLES,
  });
  writePage(slug, html);
  console.log('  ✓ /vs/ekomi/');
}

// ── Comparison: Signed Reviews vs SiteJabber (FTC news hook) ──────────────────
function buildComparisonSiteJabber() {
  const slug = '/vs/sitejabber/';
  const body = `<article class="prose" style="max-width: 860px">
    <p><strong>In November 2024, the FTC issued a formal order against SiteJabber</strong> for publishing reviews from people who had never received the products they reviewed. SiteJabber's system allowed businesses to collect reviews at the point of sale — before the customer ever received the product. The FTC found this deceptive. Here's how Signed Reviews compares — and why our model structurally can't have the problem that got SiteJabber in trouble.</p>

    <div class="vs-table-wrap" style="overflow-x:auto;">
    <table class="vs-table">
      <thead><tr><th>Capability</th><th>Signed Reviews</th><th>SiteJabber</th></tr></thead>
      <tbody>
        <tr class="highlight-row"><td>FTC compliance</td><td class="win">FTC-compliant by construction — every review requires an independently verified Stripe charge. The purchase is confirmed by a third-party payment processor before a review can exist.</td><td class="lose">FTC Order (Nov 2024) — found to have misrepresented that reviews came from customers who'd received products. SiteJabber allowed point-of-sale collection before product receipt.</td></tr>
        <tr><td>Verification method</td><td class="win">Processor-attested (Level 4) — Stripe independently confirms the charge, and refunds auto-hide reviews.</td><td class="lose">Email + optional receipt (Level 1–2) — reviewers self-attest. SiteJabber's system did not verify product receipt at all.</td></tr>
        <tr class="highlight-row"><td>Review timing</td><td class="win">After purchase — reviews are only possible after a Stripe charge succeeds. Configurable delay for shipped products.</td><td class="lose">Point-of-sale — SiteJabber's model encouraged reviews at checkout, before the customer had the product. The FTC found this deceptive.</td></tr>
        <tr><td>Fake review prevention</td><td class="win">Structural — impossible to post a review without a verified Stripe transaction backing it.</td><td class="lose">Reactive — reviews are open to anyone with an email address. Optional receipt verification is self-attested.</td></tr>
        <tr class="highlight-row"><td>Regulatory standing</td><td class="win">Clean — launched after the FTC's 2024 rule took effect. Designed for compliance from day one.</td><td class="lose">Under FTC order — required to change practices and stop misrepresenting review authenticity.</td></tr>
        <tr><td>Stripe integration</td><td class="win">Native — one-click OAuth, read-only. Automatic on every charge.</td><td class="lose">No Stripe integration. Reviews are collected independently of payment processing.</td></tr>
        <tr class="highlight-row"><td>Pricing</td><td class="win">Free plan + $29–$199/mo. Transparent, self-serve.</td><td class="lose">Custom pricing — not publicly listed. Typically requires a sales conversation.</td></tr>
        <tr><td>Review ownership</td><td class="win">Business owns the reviews. Exportable, portable via API.</td><td class="win">Business owns the reviews.</td></tr>
      </tbody>
    </table>
    </div>

    <div class="verdict">
      <h3>Why this matters beyond SiteJabber</h3>
      <p>The SiteJabber FTC order established a precedent: the FTC will act against platforms whose review collection practices mislead consumers about authenticity. Any platform that allows reviews without independently verified proof of purchase — or that collects reviews before the customer has the product — is exposed to the same regulatory risk. Signed Reviews was designed after this precedent to be structurally compliant: no purchase verification, no review, no exceptions.</p>
    </div>

    <div class="verdict verdict-alt">
      <h3>When SiteJabber may still be relevant</h3>
      <p>SiteJabber has a large existing review base and established consumer brand recognition. For businesses already listed there with legitimate reviews, maintaining that presence has value. But as a primary review collection platform, the FTC order raises questions about both compliance risk and consumer trust that newer, structurally compliant alternatives don't face.</p>
    </div>

    <p style="text-align:center;margin-top:2rem;"><a class="btn btn-primary" href="${PLATFORM_URL}" rel="noopener" style="display:inline-flex;align-items:center;gap:.5rem;padding:.85rem 1.6rem">Start collecting FTC-compliant reviews →</a></p>
    <p style="text-align:center;margin-top:1.25rem;font-size:.9rem;color:var(--muted);">Related: <a href="/learn/what-does-verified-buyer-mean/">What "Verified Buyer" means</a> · <a href="/blog/fake-reviews/">The Fake Review Problem</a> · <a href="/vs/trustpilot/">Signed Reviews vs Trustpilot</a></p>
  </article>`;

  const html = page({
    title: 'Signed Reviews vs SiteJabber — Comparison',
    description: 'SiteJabber received an FTC order in 2024 for reviews from people who never received products. Signed Reviews is structurally FTC-compliant — every review requires a verified Stripe charge.',
    slug,
    hero: { eyebrow: 'Comparison', title: 'Signed Reviews vs SiteJabber', subtitle: 'SiteJabber got an FTC order for reviews from people who never received products. We structurally can\'t have that problem.' },
    body,
    extraStyle: COMPARISON_STYLES,
  });
  writePage(slug, html);
  console.log('  ✓ /vs/sitejabber/');
}

// ── Comparison: Signed Reviews vs Reviews.io ──────────────────────────────────
function buildComparisonReviewsIo() {
  const slug = '/vs/reviews-io/';
  const body = `<article class="prose" style="max-width: 860px">
    <p>Reviews.io is the most frequently recommended Trustpilot alternative — particularly in the UK and Europe. Its "Verified Reviewer" badge marks reviews that came through the merchant's invitation system. Here's how that compares to processor-attested verification.</p>

    <div class="vs-table-wrap" style="overflow-x:auto;">
    <table class="vs-table">
      <thead><tr><th>Capability</th><th>Signed Reviews</th><th>Reviews.io</th></tr></thead>
      <tbody>
        <tr class="highlight-row"><td>Verification source</td><td class="win">Stripe — independent payment processor. Processor-attested (Level 4).</td><td class="lose">Merchant customer data — the business provides customer lists or integrates its CRM. Merchant-supplied (Level 3).</td></tr>
        <tr><td>Fake review prevention</td><td class="win">Structural — no Stripe charge = no review. Cannot be gamed without faking a real payment.</td><td class="lose">Invitation-gated — reviews require an invitation, but invitations are sent to lists the merchant controls.</td></tr>
        <tr class="highlight-row"><td>Stripe integration</td><td class="win">Native — one-click OAuth, read-only. Built exclusively for Stripe.</td><td class="lose">No native Stripe integration — works through CRM integrations and manual customer list uploads.</td></tr>
        <tr><td>Cryptographic proof</td><td class="win">Yes — tamper-evident digital signature on every review. Independently verifiable.</td><td class="lose">No — reviews are database records with no cryptographic proof of integrity.</td></tr>
        <tr class="highlight-row"><td>Refund handling</td><td class="win">Automatic — Stripe webhook hides refunded reviews immediately.</td><td class="lose">Manual — merchants must manage review display for refunded orders.</td></tr>
        <tr><td>Pricing</td><td class="win">Free plan + $29–$199/mo. Transparent, self-serve pricing.</td><td class="lose">From £89/mo (~$113). Mid-range pricing. No free plan.</td></tr>
        <tr class="highlight-row"><td>Geographic strength</td><td class="tie">Global — Stripe is the payment processor in 40+ countries.</td><td class="win">UK/Europe — Reviews.io has strong regional presence and brand recognition in the UK and EU.</td></tr>
        <tr><td>Google integrations</td><td class="tie">Planned — Google Seller Ratings on the roadmap.</td><td class="win">Google Seller Ratings + Google Shopping integration available.</td></tr>
        <tr class="highlight-row"><td>Review ownership</td><td class="win">Business owns the reviews — exportable, portable, accessible via API.</td><td class="win">Business owns the reviews — Reviews.io is merchant-ownership by model.</td></tr>
        <tr><td>Platform maturity</td><td class="lose">Early stage — launched 2026.</td><td class="win">Established — strong reputation, particularly in UK e-commerce.</td></tr>
      </tbody>
    </table>
    </div>

    <div class="verdict">
      <h3>When to choose Signed Reviews</h3>
      <p>If you process payments through Stripe and want the strongest possible verification — independent attestation by a payment processor — Signed Reviews gives you something Reviews.io can't: verification that doesn't depend on data you supply. The lower starting price and automatic refund handling are meaningful operational advantages.</p>
    </div>

    <div class="verdict verdict-alt">
      <h3>When Reviews.io may be a better fit</h3>
      <p>If you're a UK or European business and want a local provider with established regional presence, Google integrations, and a mature platform, Reviews.io is the most frequently recommended Trustpilot alternative for good reason. It's a solid Level-3 platform with strong customer satisfaction.</p>
    </div>

    <p style="text-align:center;margin-top:2rem;"><a class="btn btn-primary" href="${PLATFORM_URL}" rel="noopener" style="display:inline-flex;align-items:center;gap:.5rem;padding:.85rem 1.6rem">Start collecting verified reviews →</a></p>
    <p style="text-align:center;margin-top:1.25rem;font-size:.9rem;color:var(--muted);">Related: <a href="/learn/what-does-verified-buyer-mean/">What "Verified Buyer" means</a> · <a href="/vs/trustpilot/">Signed Reviews vs Trustpilot</a> · <a href="/vs/feefo/">Signed Reviews vs Feefo</a></p>
  </article>`;

  const html = page({
    title: 'Signed Reviews vs Reviews.io — Comparison',
    description: 'Signed Reviews vs Reviews.io: Reviews.io verifies against customer data you supply; Signed Reviews verifies against Stripe itself. 10-dimension comparison for businesses comparing Trustpilot alternatives.',
    slug,
    hero: { eyebrow: 'Comparison', title: 'Signed Reviews vs Reviews.io', subtitle: 'The most-recommended Trustpilot alternative. But verification still depends on data you supply.' },
    body,
    extraStyle: COMPARISON_STYLES,
  });
  writePage(slug, html);
  console.log('  ✓ /vs/reviews-io/');
}

// ── Comparison: Signed Reviews vs Stamped ─────────────────────────────────────
function buildComparisonStamped() {
  const slug = '/vs/stamped/';
  const body = `<article class="prose" style="max-width: 860px">
    <p>Stamped.io (also known as Stamped) is a well-established review and loyalty platform popular with mid-market e-commerce brands. Its purchase verification matches reviews to merchant order data — solid, but still merchant-supplied. Here's how it compares to processor-attested verification.</p>

    <div class="vs-table-wrap" style="overflow-x:auto;">
    <table class="vs-table">
      <thead><tr><th>Capability</th><th>Signed Reviews</th><th>Stamped</th></tr></thead>
      <tbody>
        <tr class="highlight-row"><td>Verification source</td><td class="win">Stripe — independent payment processor. Processor-attested (Level 4).</td><td class="lose">Merchant order data — matches reviews to orders in the merchant's e-commerce platform. Merchant-supplied (Level 3).</td></tr>
        <tr><td>Stripe integration</td><td class="win">Native — one-click OAuth, read-only. Built exclusively for Stripe.</td><td class="lose">No native Stripe integration — works through e-commerce platform connectors (Shopify, BigCommerce, etc.).</td></tr>
        <tr class="highlight-row"><td>Feature breadth</td><td class="lose">Focused — core review collection, verification, API, and publishing.</td><td class="win">Broad — reviews, ratings, Q&A, loyalty & rewards, community, checkout upsells. Full retention suite.</td></tr>
        <tr><td>Cryptographic proof</td><td class="win">Yes — tamper-evident digital signature on every review.</td><td class="lose">No cryptographic signing.</td></tr>
        <tr class="highlight-row"><td>Pricing</td><td class="win">Free plan + $29–$199/mo. Transparent, self-serve.</td><td class="lose">From $23/mo (Lite) to $149/mo+ (Enterprise). Mid-range but features gated behind tiers.</td></tr>
        <tr><td>Platform support</td><td class="win">Any platform using Stripe — Shopify, WooCommerce, custom, SaaS, invoices.</td><td class="win">Shopify, BigCommerce, Magento, WooCommerce. Wide platform support.</td></tr>
        <tr class="highlight-row"><td>Review ownership</td><td class="win">Business owns the reviews.</td><td class="win">Business owns the reviews.</td></tr>
      </tbody>
    </table>
    </div>

    <div class="verdict">
      <h3>When to choose Signed Reviews</h3>
      <p>If verification strength is your priority, the difference between "matched to a merchant order" and "attested by Stripe" is the difference between a marketing claim and an independently verifiable fact. For Stripe-native businesses, Signed Reviews also offers simpler setup (one click vs platform connector configuration).</p>
    </div>

    <div class="verdict verdict-alt">
      <h3>When Stamped may be a better fit</h3>
      <p>If you need a full retention suite — reviews + loyalty + rewards + Q&A + community — Stamped's breadth is compelling, particularly for mid-market e-commerce brands that want one platform for everything. The loyalty integration is a differentiator if you're running a points-based retention program alongside reviews.</p>
    </div>

    <p style="text-align:center;margin-top:2rem;"><a class="btn btn-primary" href="${PLATFORM_URL}" rel="noopener" style="display:inline-flex;align-items:center;gap:.5rem;padding:.85rem 1.6rem">Start collecting verified reviews →</a></p>
    <p style="text-align:center;margin-top:1.25rem;font-size:.9rem;color:var(--muted);">Related: <a href="/learn/what-does-verified-buyer-mean/">What "Verified Buyer" means</a> · <a href="/vs/yotpo/">Signed Reviews vs Yotpo</a> · <a href="/vs/judge-me/">Signed Reviews vs Judge.me</a></p>
  </article>`;

  const html = page({
    title: 'Signed Reviews vs Stamped — Comparison',
    description: 'Signed Reviews vs Stamped.io: Stamped verifies against merchant order data; Signed Reviews verifies against Stripe. 7-dimension comparison for e-commerce brands.',
    slug,
    hero: { eyebrow: 'Comparison', title: 'Signed Reviews vs Stamped', subtitle: 'Stamped matches reviews to merchant orders. We match them to Stripe charges. The difference is who attests.' },
    body,
    extraStyle: COMPARISON_STYLES,
  });
  writePage(slug, html);
  console.log('  ✓ /vs/stamped/');
}

// ── Comparison: Signed Reviews vs Okendo ──────────────────────────────────────
function buildComparisonOkendo() {
  const slug = '/vs/okendo/';
  const body = `<article class="prose" style="max-width: 860px">
    <p>Okendo is the premium Shopify review app — favored by DTC brands like Skims, Haus Labs, and Olipop for its visual, brand-forward review display. Its "Verified Buyer" badge matches reviews to Shopify orders. Here's how processor-attested verification stacks up.</p>

    <div class="vs-table-wrap" style="overflow-x:auto;">
    <table class="vs-table">
      <thead><tr><th>Capability</th><th>Signed Reviews</th><th>Okendo</th></tr></thead>
      <tbody>
        <tr class="highlight-row"><td>Verification source</td><td class="win">Stripe — independent payment processor. Processor-attested (Level 4).</td><td class="lose">Shopify order data — matches reviews to orders. Merchant-supplied (Level 3).</td></tr>
        <tr><td>Stripe integration</td><td class="win">Native — one-click OAuth, read-only. Works with any Stripe-connected platform.</td><td class="lose">Shopify-only — no direct Stripe integration. Depends on the Shopify-Stripe connection.</td></tr>
        <tr class="highlight-row"><td>Review display & branding</td><td class="tie">Clean, brandable public page. Embeddable reviews via API.</td><td class="win">Best-in-class visual design — highly customizable review displays, photo/video reviews, shoppable galleries. Okendo leads on aesthetics.</td></tr>
        <tr><td>Cryptographic proof</td><td class="win">Yes — tamper-evident digital signature on every review.</td><td class="lose">No cryptographic signing.</td></tr>
        <tr class="highlight-row"><td>Customer insights</td><td class="lose">Focused on verification data — purchase confirmation, review authenticity metrics.</td><td class="win">Rich zero-party data — customer attributes, preferences, and profiles derived from reviews. Strong for segmentation.</td></tr>
        <tr><td>Pricing</td><td class="win">Free plan + $29–$199/mo. Transparent, self-serve.</td><td class="lose">From $19/mo (Essential) to $119/mo+ (Advanced). Shopify-only. Features gated behind higher tiers.</td></tr>
        <tr class="highlight-row"><td>Platform support</td><td class="win">Any platform using Stripe.</td><td class="lose">Shopify-only.</td></tr>
        <tr><td>Review ownership</td><td class="win">Business owns the reviews.</td><td class="win">Business owns the reviews. Exportable.</td></tr>
      </tbody>
    </table>
    </div>

    <div class="verdict">
      <h3>When to choose Signed Reviews</h3>
      <p>If you want the strongest verification possible — independent processor attestation with cryptographic proof — and you're on Stripe, Signed Reviews gives you a trust signal Okendo can't replicate. If you sell across multiple platforms (Shopify + custom + invoices), Signed Reviews works everywhere Stripe does, while Okendo is Shopify-only.</p>
    </div>

    <div class="verdict verdict-alt">
      <h3>When Okendo may be a better fit</h3>
      <p>If you're a Shopify DTC brand and visual brand experience is paramount, Okendo's review displays are the best in the category. Its zero-party data features — capturing customer attributes and preferences through reviews — are genuinely valuable for segmentation and personalization. For Shopify-only brands where aesthetics and customer insights outweigh verification strength, Okendo excels.</p>
    </div>

    <p style="text-align:center;margin-top:2rem;"><a class="btn btn-primary" href="${PLATFORM_URL}" rel="noopener" style="display:inline-flex;align-items:center;gap:.5rem;padding:.85rem 1.6rem">Start collecting verified reviews →</a></p>
    <p style="text-align:center;margin-top:1.25rem;font-size:.9rem;color:var(--muted);">Related: <a href="/learn/what-does-verified-buyer-mean/">What "Verified Buyer" means</a> · <a href="/vs/judge-me/">Signed Reviews vs Judge.me</a> · <a href="/vs/yotpo/">Signed Reviews vs Yotpo</a></p>
  </article>`;

  const html = page({
    title: 'Signed Reviews vs Okendo — Comparison',
    description: 'Signed Reviews vs Okendo: Okendo leads on visual design, but verifies against Shopify order data. Signed Reviews verifies against Stripe itself. 8-dimension comparison.',
    slug,
    hero: { eyebrow: 'Comparison', title: 'Signed Reviews vs Okendo', subtitle: 'Okendo\'s reviews look beautiful. But their "verified" trusts your Shopify data. Ours trusts Stripe.' },
    body,
    extraStyle: COMPARISON_STYLES,
  });
  writePage(slug, html);
  console.log('  ✓ /vs/okendo/');
}

// ── Comparison: Signed Reviews vs Loox ────────────────────────────────────────
function buildComparisonLoox() {
  const slug = '/vs/loox/';
  const body = `<article class="prose" style="max-width: 860px">
    <p>Loox is a popular Shopify review app known for its photo-first review displays and auto-discount features for photo reviews. Like other Shopify apps, its "Verified" badge matches reviews to Shopify orders. Here's how processor-attested verification compares.</p>

    <div class="vs-table-wrap" style="overflow-x:auto;">
    <table class="vs-table">
      <thead><tr><th>Capability</th><th>Signed Reviews</th><th>Loox</th></tr></thead>
      <tbody>
        <tr class="highlight-row"><td>Verification source</td><td class="win">Stripe — independent payment processor. Processor-attested (Level 4).</td><td class="lose">Shopify order data — matches reviews to orders. Merchant-supplied (Level 3).</td></tr>
        <tr><td>Stripe integration</td><td class="win">Native — one-click OAuth, read-only. Works with any Stripe-connected platform.</td><td class="lose">Shopify-only — no direct Stripe integration.</td></tr>
        <tr class="highlight-row"><td>Photo reviews</td><td class="tie">Photo reviews supported — customers can attach images.</td><td class="win">Best-in-class photo reviews — auto-discount incentives for photo submissions, beautiful photo-first gallery displays. Loox leads here.</td></tr>
        <tr><td>Cryptographic proof</td><td class="win">Yes — tamper-evident digital signature on every review.</td><td class="lose">No cryptographic signing.</td></tr>
        <tr class="highlight-row"><td>Pricing</td><td class="win">Free plan + $29–$199/mo. Transparent, self-serve.</td><td class="win">From $9.99/mo (Beginner) to $34.99/mo+ (Scale). Very affordable, especially for photo-heavy review collection.</td></tr>
        <tr><td>Platform support</td><td class="win">Any platform using Stripe.</td><td class="lose">Shopify-only.</td></tr>
        <tr class="highlight-row"><td>Referral features</td><td class="lose">Not offered — focused on review authenticity.</td><td class="win">Built-in referral program — post-review upsells and referral discounts. Loox uses reviews as a referral engine.</td></tr>
        <tr><td>Review ownership</td><td class="win">Business owns the reviews.</td><td class="win">Business owns the reviews. Exportable.</td></tr>
      </tbody>
    </table>
    </div>

    <div class="verdict">
      <h3>When to choose Signed Reviews</h3>
      <p>If you want the strongest verification possible and you're on Stripe, Signed Reviews gives you processor-attested, cryptographically signed reviews — a trust signal no Shopify review app can match. For businesses that sell across multiple platforms, Signed Reviews works everywhere Stripe does.</p>
    </div>

    <div class="verdict verdict-alt">
      <h3>When Loox may be a better fit</h3>
      <p>If you're a Shopify store and visual social proof is your primary goal, Loox's photo-first approach and auto-discount incentives consistently drive high photo-review submission rates. For businesses where the volume of visual reviews matters more than verification strength, Loox is an affordable, effective choice.</p>
    </div>

    <p style="text-align:center;margin-top:2rem;"><a class="btn btn-primary" href="${PLATFORM_URL}" rel="noopener" style="display:inline-flex;align-items:center;gap:.5rem;padding:.85rem 1.6rem">Start collecting verified reviews →</a></p>
    <p style="text-align:center;margin-top:1.25rem;font-size:.9rem;color:var(--muted);">Related: <a href="/learn/what-does-verified-buyer-mean/">What "Verified Buyer" means</a> · <a href="/vs/judge-me/">Signed Reviews vs Judge.me</a> · <a href="/vs/okendo/">Signed Reviews vs Okendo</a></p>
  </article>`;

  const html = page({
    title: 'Signed Reviews vs Loox — Comparison',
    description: 'Signed Reviews vs Loox: Loox leads on photo reviews and referrals, but verifies against Shopify orders. Signed Reviews verifies against Stripe itself. 8-dimension comparison.',
    slug,
    hero: { eyebrow: 'Comparison', title: 'Signed Reviews vs Loox', subtitle: 'Loox makes reviews beautiful. But "verified" still means matched to a Shopify order, not confirmed by Stripe.' },
    body,
    extraStyle: COMPARISON_STYLES,
  });
  writePage(slug, html);
  console.log('  ✓ /vs/loox/');
}

// ── Comparison: Signed Reviews vs Skeepers ────────────────────────────────────
function buildComparisonSkeepers() {
  const slug = '/vs/skeepers/';
  const body = `<article class="prose" style="max-width: 860px">
    <p>Skeepers (formerly Verified Reviews) is a European review and UGC platform. Its verification model relies on merchant-provided transaction data — a Level 3 approach common among enterprise-focused platforms. Here's how that compares to processor-attested verification.</p>
    <div class="vs-table-wrap" style="overflow-x:auto;">
    <table class="vs-table">
      <thead><tr><th>Capability</th><th>Signed Reviews</th><th>Skeepers</th></tr></thead>
      <tbody>
        <tr class="highlight-row"><td>Verification source</td><td class="win">Stripe — independent payment processor. Processor-attested (Level 4).</td><td class="lose">Merchant transaction feed — the business supplies the data being verified against. Merchant-supplied (Level 3).</td></tr>
        <tr><td>Fake review prevention</td><td class="win">Structural — no Stripe charge = no review. Refunds auto-hide reviews.</td><td class="lose">Feed-gated — verification quality depends on what the merchant chooses to include in the feed.</td></tr>
        <tr class="highlight-row"><td>Stripe integration</td><td class="win">Native — one-click OAuth, read-only. Built exclusively for Stripe.</td><td class="lose">No native Stripe integration — relies on merchant-provided data feeds.</td></tr>
        <tr><td>UGC breadth</td><td class="lose">Focused — review collection, verification, and publishing.</td><td class="win">Broad — reviews, ratings, video UGC, social proof widgets, influencer content.</td></tr>
        <tr class="highlight-row"><td>Pricing</td><td class="win">Free plan + $29–$199/mo. Transparent, self-serve.</td><td class="lose">Custom pricing — enterprise-focused. Not publicly listed.</td></tr>
        <tr><td>Geographic strength</td><td class="tie">Global — Stripe is the payment processor in 40+ countries.</td><td class="win">European — strong presence in France, Germany, and Southern Europe.</td></tr>
        <tr class="highlight-row"><td>Review ownership</td><td class="win">Business owns the reviews — exportable, accessible via API.</td><td class="win">Business owns the reviews.</td></tr>
      </tbody>
    </table>
    </div>
    <div class="verdict">
      <h3>When to choose Signed Reviews</h3>
      <p>If verification independence is your priority, the difference between "we verify against data you supply" and "Stripe independently confirms the charge" is the difference between a process and a guarantee. For Stripe-native businesses, Signed Reviews also offers simpler onboarding and transparent pricing.</p>
    </div>
    <div class="verdict verdict-alt">
      <h3>When Skeepers may be a better fit</h3>
      <p>If you're a European enterprise needing a broad UGC suite — reviews, video testimonials, social proof, influencer content — Skeepers covers more surface area. But for pure review authenticity, the same Level 3 limitation applies: the merchant supplies the verification data.</p>
    </div>
    <p style="text-align:center;margin-top:2rem;"><a class="btn btn-primary" href="${PLATFORM_URL}" rel="noopener" style="display:inline-flex;align-items:center;gap:.5rem;padding:.85rem 1.6rem">Start collecting verified reviews →</a></p>
    <p style="text-align:center;margin-top:1.25rem;font-size:.9rem;color:var(--muted);">Related: <a href="/learn/what-does-verified-buyer-mean/">What "Verified Buyer" means</a> · <a href="/vs/trustpilot/">Signed Reviews vs Trustpilot</a> · <a href="/vs/feefo/">Signed Reviews vs Feefo</a></p>
  </article>`;
  const html = page({
    title: 'Signed Reviews vs Skeepers — Comparison',
    description: 'Signed Reviews vs Skeepers: Skeepers verifies against merchant-supplied transaction feeds; Signed Reviews verifies against Stripe itself. Comparison for enterprise brands considering verified review platforms.',
    slug,
    hero: { eyebrow: 'Comparison', title: 'Signed Reviews vs Skeepers', subtitle: 'Skeepers verifies against data you supply. We verify against Stripe. The difference is who attests.' },
    body,
    extraStyle: COMPARISON_STYLES,
  });
  writePage(slug, html);
  console.log('  ✓ /vs/skeepers/');
}

// ── Comparison: Signed Reviews vs Google Reviews ───────────────────────────────
function buildComparisonGoogleReviews() {
  const slug = '/vs/google-reviews/';
  const body = `<article class="prose" style="max-width: 860px">
    <p>Google Reviews is the most visible review platform on the internet — powering star ratings in search results, Google Maps, and the local pack. It's free, universal, and essential for local SEO. But it has no purchase verification at all. Here's how it compares to processor-attested reviews — and why most businesses need both.</p>
    <div class="vs-table-wrap" style="overflow-x:auto;">
    <table class="vs-table">
      <thead><tr><th>Capability</th><th>Signed Reviews</th><th>Google Reviews</th></tr></thead>
      <tbody>
        <tr class="highlight-row"><td>Verification</td><td class="win">Processor-attested (Level 4) — Stripe independently confirms every charge. Tamper-evident cryptographic signatures.</td><td class="lose">None (Level 0) — anyone with a Google account can review any business. No purchase proof required or checked.</td></tr>
        <tr><td>Fake review prevention</td><td class="win">Structural — impossible to post a review without a verified Stripe transaction.</td><td class="lose">Reactive — Google uses algorithmic detection and occasional manual review. Fake reviews are common and removal is slow.</td></tr>
        <tr class="highlight-row"><td>SEO value</td><td class="tie">On-site — reviews on your own pages, eligible for review rich results via schema.</td><td class="win">Search-dominant — star ratings in SERPs, Google Maps visibility, local pack ranking factor. The most visible review surface.</td></tr>
        <tr><td>Cost</td><td class="win">Free plan + $29–$199/mo for automation and volume.</td><td class="win">Free — no cost to the business or reviewer.</td></tr>
        <tr class="highlight-row"><td>Review ownership</td><td class="win">Business owns the reviews — exportable, portable, accessible via API. Display on any site.</td><td class="lose">Google owns the reviews — they live on Google's platform. No export, no API for display elsewhere.</td></tr>
        <tr><td>Stripe integration</td><td class="win">Native — one-click OAuth, read-only. Automatic on every charge.</td><td class="lose">No Stripe integration. Reviews are completely decoupled from payment processing.</td></tr>
        <tr class="highlight-row"><td>Refund handling</td><td class="win">Automatic — Stripe webhook hides refunded-charge reviews immediately.</td><td class="lose">Manual — businesses must report and request removal of reviews from non-customers. Slow, inconsistent process.</td></tr>
      </tbody>
    </table>
    </div>
    <div class="verdict">
      <h3>You need both. Here's why.</h3>
      <p>Google Reviews and processor-attested reviews serve different purposes and reinforce each other. Google Reviews give you search visibility, local SEO, and broad consumer reach — but they carry zero purchase verification. Signed Reviews give you verified, tamper-evident reviews you own and display on your own site — but they don't directly influence Google's local pack. The strongest approach: collect verified reviews on Signed Reviews for your website + trust badges, and encourage happy verified customers to also leave a Google Review for search visibility. The verified review becomes the quality signal; Google becomes the distribution channel.</p>
    </div>
    <p style="text-align:center;margin-top:2rem;"><a class="btn btn-primary" href="${PLATFORM_URL}" rel="noopener" style="display:inline-flex;align-items:center;gap:.5rem;padding:.85rem 1.6rem">Start collecting verified reviews →</a></p>
    <p style="text-align:center;margin-top:1.25rem;font-size:.9rem;color:var(--muted);">Related: <a href="/learn/what-does-verified-buyer-mean/">What "Verified Buyer" means</a> · <a href="/blog/fake-reviews/">The Fake Review Problem</a> · <a href="/vs/yelp/">Signed Reviews vs Yelp</a></p>
  </article>`;
  const html = page({
    title: 'Signed Reviews vs Google Reviews — Comparison',
    description: 'Google Reviews has zero purchase verification but dominates search visibility. Signed Reviews has the strongest verification available. Most businesses need both — here\'s how they complement each other.',
    slug,
    hero: { eyebrow: 'Comparison', title: 'Signed Reviews vs Google Reviews', subtitle: 'Google Reviews dominates visibility. We dominate verification. Here\'s why most businesses need both.' },
    body,
    extraStyle: COMPARISON_STYLES,
  });
  writePage(slug, html);
  console.log('  ✓ /vs/google-reviews/');
}

// ── Comparison: Signed Reviews vs Yelp ─────────────────────────────────────────
function buildComparisonYelp() {
  const slug = '/vs/yelp/';
  const body = `<article class="prose" style="max-width: 860px">
    <p>Yelp is the dominant review platform for local businesses — restaurants, home services, salons, and brick-and-mortar retail. It has zero purchase verification and a controversial review-filtering algorithm. Here's how it compares to processor-attested reviews.</p>
    <div class="vs-table-wrap" style="overflow-x:auto;">
    <table class="vs-table">
      <thead><tr><th>Capability</th><th>Signed Reviews</th><th>Yelp</th></tr></thead>
      <tbody>
        <tr class="highlight-row"><td>Verification</td><td class="win">Processor-attested (Level 4) — Stripe independently confirms every charge. Tamper-evident cryptographic signatures.</td><td class="lose">None (Level 0) — anyone can review any business. Yelp's "Not Recommended" filter is algorithmic, not purchase-based.</td></tr>
        <tr><td>Review filtering</td><td class="win">Deterministic — refund = review hidden. No algorithmic guesswork. Every visible review has a confirmed transaction behind it.</td><td class="lose">Algorithmic "Not Recommended" filter — opaque, controversial. Genuinely useful reviews are often hidden; some fake reviews slip through.</td></tr>
        <tr class="highlight-row"><td>Business model</td><td class="win">SaaS — business pays for the review platform. Revenue aligned with the business's success.</td><td class="lose">Advertising — business pays Yelp for visibility. Revenue model creates tension with objective review presentation.</td></tr>
        <tr><td>Stripe integration</td><td class="win">Native — one-click OAuth, read-only. Automatic on every charge.</td><td class="lose">No Stripe integration. Reviews are completely decoupled from payment processing.</td></tr>
        <tr class="highlight-row"><td>Local discovery</td><td class="lose">Not a local discovery platform — focused on verification and publishing.</td><td class="win">Dominant — Yelp is a primary local-business discovery channel in the US, particularly restaurants and services.</td></tr>
        <tr><td>Cost</td><td class="win">Free plan + $29–$199/mo. Transparent, self-serve pricing.</td><td class="lose">Free to list, but advertising costs can be significant. Aggressive ad-sales reputation.</td></tr>
        <tr class="highlight-row"><td>Review ownership</td><td class="win">Business owns the reviews — exportable, portable via API.</td><td class="lose">Yelp owns the reviews — they live on Yelp's platform. Explicitly prohibits review export or display elsewhere.</td></tr>
        <tr><td>Sales practices</td><td class="win">Self-serve — no sales calls. Upgrade when you're ready.</td><td class="lose">Aggressive sales — widely documented pattern of persistent ad-sales calls and disputed practices around review visibility tied to ad spend.</td></tr>
      </tbody>
    </table>
    </div>
    <div class="verdict">
      <h3>The Yelp reality</h3>
      <p>Yelp is essential for local businesses — particularly restaurants, home services, and retail — because it's where consumers search. But relying on Yelp as your only review presence means trusting an opaque algorithm to fairly represent your business, with zero purchase verification on any review. The smarter play: use Signed Reviews for verified, tamper-evident reviews on your own site, maintain a clean Yelp presence for local discovery, and encourage verified customers to cross-post to Yelp if they're active there. Yelp becomes a distribution channel, not your review strategy's foundation.</p>
    </div>
    <p style="text-align:center;margin-top:2rem;"><a class="btn btn-primary" href="${PLATFORM_URL}" rel="noopener" style="display:inline-flex;align-items:center;gap:.5rem;padding:.85rem 1.6rem">Start collecting verified reviews →</a></p>
    <p style="text-align:center;margin-top:1.25rem;font-size:.9rem;color:var(--muted);">Related: <a href="/learn/what-does-verified-buyer-mean/">What "Verified Buyer" means</a> · <a href="/vs/google-reviews/">Signed Reviews vs Google Reviews</a> · <a href="/vs/trustpilot/">Signed Reviews vs Trustpilot</a></p>
  </article>`;
  const html = page({
    title: 'Signed Reviews vs Yelp — Comparison',
    description: 'Signed Reviews vs Yelp: Yelp has zero purchase verification and an opaque review filter. Signed Reviews verifies every review against Stripe. For local businesses that want review authenticity.',
    slug,
    hero: { eyebrow: 'Comparison', title: 'Signed Reviews vs Yelp', subtitle: 'Yelp\'s filter is algorithmic guesswork. Ours is deterministic: no Stripe charge = no review.' },
    body,
    extraStyle: COMPARISON_STYLES,
  });
  writePage(slug, html);
  console.log('  ✓ /vs/yelp/');
}

// ── Learn: canonical explainer (citation target for /vs/* + blog) ─────────────
// Answer-first structure: the opening paragraph is a self-contained, quotable
// definition so AI answer engines (Google AI Overviews, ChatGPT, Perplexity) can
// lift it verbatim. Backed by Article + FAQPage JSON-LD (rich results) and the
// sitewide Organization + BreadcrumbList already emitted by SHARED_HEAD.
function buildLearn() {
  const slug = '/learn/what-does-verified-buyer-mean/';
  const canonical = `${SITE_URL}${slug}`;
  const title = 'What Does "Verified Buyer" Actually Mean? — Signed Reviews';
  const description = 'What a "Verified Buyer" badge really means on Trustpilot, Yotpo, Judge.me and Reviews.io — and the 5-level verification spectrum that separates a badge from proof.';

  // ── Quotable Q/A pairs → FAQPage schema (rich results) + on-page accordion ──
  const faqItems = [
    {
      q: 'What does "Verified Buyer" mean on Trustpilot?',
      a: 'On Trustpilot, "Verified" most commonly means the business sent the reviewer a unique invitation email and Trustpilot confirmed a genuine experience — not that a payment processor independently verified the purchase. Anyone can post on Trustpilot without proof of purchase, so an unverified Trustpilot review carries no transactional evidence.',
    },
    {
      q: 'Does a "verified" badge mean a payment was actually processed?',
      a: 'Usually no. On most platforms "verified" means the reviewer appears in the merchant\'s own records — an order, an invitation, or a customer list. Only processor-attested verification, where an independent payment processor such as Stripe confirms the charge, ties a review to an independently confirmed transaction.',
    },
    {
      q: 'Which review platforms verify against the payment processor?',
      a: 'Very few. Most major platforms — Trustpilot, Yotpo, Judge.me, Reviews.io, and most Shopify review apps — verify against merchant-supplied data (Level 3). Signed Reviews is built specifically for processor-attested verification (Level 4) via Stripe.',
    },
    {
      q: 'What is the difference between merchant-supplied and processor-attested verification?',
      a: 'Merchant-supplied verification (Level 3) is attested by the merchant\'s own data — an order record, a customer list, or an invitation. Processor-attested verification (Level 4) is attested by an independent payment processor that confirms a charge occurred and whether it was later refunded. The latter cannot be derived from data the merchant curates.',
    },
    {
      q: 'Is a "verified" review guaranteed to be authentic?',
      a: 'No. "Verified" describes how the reviewer\'s purchase was checked, not whether the review\'s content is truthful. A verified buyer can still leave a biased or inaccurate review, and at lower verification levels the purchase itself may never have been independently confirmed.',
    },
    {
      q: 'What does the FTC\'s fake-review rule say about verification?',
      a: 'The FTC\'s 2024 Trade Regulation Rule (16 CFR Part 465, effective 21 October 2024) prohibits reviews that misrepresent the reviewer\'s genuine experience, plus buying or selling reviews and suppressing negative ones. Stronger verification levels make these deceptive practices structurally harder to carry out.',
    },
  ];

  const faqHtml = faqItems.map((item, i) => `
    <details class="faq-item"${i === 0 ? ' open' : ''}>
      <summary class="faq-q">${escapeHtml(item.q)}</summary>
      <div class="faq-a">${item.a}</div>
    </details>`).join('');

  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqItems.map(item => ({
      '@type': 'Question',
      name: item.q,
      acceptedAnswer: { '@type': 'Answer', text: item.a.replace(/<[^>]+>/g, '') },
    })),
  };

  const articleSchema = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: 'What Does "Verified Buyer" Actually Mean?',
    description,
    datePublished: '2026-07-23',
    dateModified: '2026-07-23',
    mainEntityOfPage: { '@type': 'WebPage', '@id': canonical },
    image: [`${SITE_URL}/images/SignedReviews_full_logo.png`],
    author: { '@type': 'Organization', name: 'Signed Reviews', url: SITE_URL },
    publisher: { '@type': 'Organization', name: 'Signed Reviews', logo: { '@type': 'ImageObject', url: `${SITE_URL}/images/SignedReviews_logo_only.png` } },
    about: { '@type': 'Thing', name: 'Review verification' },
  };

  const spectrumSteps = [
    { lvl: 'Level 0', name: 'None', desc: 'No check at all.' },
    { lvl: 'Level 1', name: 'Email ownership', desc: 'Reviewer controls an email address.' },
    { lvl: 'Level 2', name: 'Self-attested', desc: 'Reviewer claims they bought.' },
    { lvl: 'Level 3', name: 'Merchant-supplied', desc: 'Merchant\'s records show a purchase.' },
    { lvl: 'Level 4', name: 'Processor-attested', desc: 'Independent processor confirms the charge.', win: true },
  ];

  const extraStyle = `
    .vs-table { width:100%; border-collapse:separate; border-spacing:0; border:1px solid var(--border); border-radius:14px; overflow:hidden; font-size:.92rem; margin:1.5rem 0 2rem; }
    .vs-table thead th { background:var(--navy-50); color:var(--navy-900); font-weight:600; text-align:left; padding:.85rem 1rem; border-bottom:1px solid var(--border); }
    :root.theme-dark .vs-table thead th, :root.theme-auto .vs-table thead th { background:rgba(255,255,255,.04); color:#fff; }
    .vs-table td, .vs-table th { padding:.75rem 1rem; border-bottom:1px solid var(--border); vertical-align:top; }
    .vs-table td:first-child { font-weight:600; color:var(--navy-900); }
    :root.theme-dark .vs-table td:first-child, :root.theme-auto .vs-table td:first-child { color:#fff; }
    .vs-table .win { color:var(--gold-600); font-weight:700; }
    .vs-table tbody tr:last-child td { border-bottom:0; }
    .vs-table .highlight-row { background:rgba(179,157,69,.06); }
    :root.theme-dark .vs-table .highlight-row, :root.theme-auto .vs-table .highlight-row { background:rgba(179,157,69,.08); }
    .verdict { background:linear-gradient(135deg,var(--navy-800),var(--navy-900)); border-radius:14px; padding:2rem; color:#fff; margin:2rem 0; }
    .verdict h3 { font-family:'Instrument Serif',Georgia,serif; font-size:1.5rem; margin:0 0 .5rem; color:#fff; }
    .verdict p { color:var(--navy-200); margin:0; line-height:1.6; }
    .learn-tldr { background:linear-gradient(135deg,rgba(179,157,69,.10),rgba(179,157,69,.03)); border:1px solid var(--gold-500); border-radius:14px; padding:1.25rem 1.4rem; margin:1.5rem 0 2rem; font-size:1rem; line-height:1.6; }
    .learn-tldr strong { color:var(--gold-600); }
    .spectrum-wrap { overflow-x:auto; margin:1.5rem 0 .5rem; }
    .spectrum { display:grid; grid-template-columns:repeat(5,minmax(120px,1fr)); gap:.5rem; min-width:680px; }
    .spectrum-step { border:1px solid var(--border); border-radius:12px; padding:.9rem .75rem; background:var(--surface); }
    .spectrum-step .lvl { display:block; font-family:'JetBrains Mono',ui-monospace,monospace; font-size:.66rem; letter-spacing:.12em; text-transform:uppercase; color:var(--muted); }
    .spectrum-step .name { font-weight:700; font-size:.9rem; margin:.3rem 0 .35rem; color:var(--navy-900); }
    :root.theme-dark .spectrum-step .name, :root.theme-auto .spectrum-step .name { color:#fff; }
    .spectrum-step .desc { font-size:.78rem; color:var(--text); line-height:1.4; }
    .spectrum-step.win { border-color:var(--gold-500); background:rgba(179,157,69,.10); }
    .spectrum-step.win .name { color:var(--gold-600); }
    .platform-card { border:1px solid var(--border); border-radius:12px; padding:1rem 1.15rem; margin:1rem 0; background:var(--surface); }
    .platform-card.win { border-color:var(--gold-500); background:rgba(179,157,69,.06); }
    .platform-card h3 { margin:.2rem 0 .4rem; font-size:1.05rem; }
    .platform-card .level { display:block; margin-bottom:.2rem; font-family:'JetBrains Mono',ui-monospace,monospace; font-size:.68rem; letter-spacing:.1em; text-transform:uppercase; color:var(--muted); }
    .faq-item { border:1px solid var(--border); border-radius:12px; margin-bottom:.65rem; background:var(--surface); overflow:hidden; }
    .faq-q { padding:1.1rem 1.2rem; font-weight:600; font-size:1rem; color:var(--navy-900); cursor:pointer; list-style:none; display:flex; justify-content:space-between; align-items:center; user-select:none; }
    .faq-q::-webkit-details-marker { display:none; }
    .faq-q::after { content:'+'; font-size:1.25rem; font-weight:400; color:var(--gold-500); margin-left:.75rem; flex-shrink:0; }
    details[open] > .faq-q::after { content:'−'; }
    :root.theme-dark .faq-q, :root.theme-auto .faq-q { color:#fff; }
    .faq-a { padding:0 1.2rem 1.15rem; color:var(--text); line-height:1.65; font-size:.95rem; }
    .faq-a p { margin:0; }
  `;

  const body = `<article class="prose" style="max-width: 860px">
    <p><strong>"Verified Buyer" does not mean the same thing on every review platform</strong> — and on most of them it does <em>not</em> mean the reviewer's payment was independently checked. A "verified" review is usually verified against data <em>the merchant supplies</em> (an invitation email, an order record, or an uploaded customer list), not against an independent payment processor. So the badge tells you the merchant <em>believed</em> this person was a customer — not that an independent party <em>confirmed</em> money changed hands.</p>

    <p>This page explains exactly what "verified" means on each major platform, lays out the five-level verification spectrum that makes the differences legible, and shows why the distinction matters under the U.S. Federal Trade Commission's 2024 fake-review rule.</p>

    <div class="learn-tldr">
      <strong>In one sentence:</strong> "Verified" almost always means <em>the merchant vouches that you're a customer</em> (Level 3) — it rarely means <em>an independent payment processor confirms your payment</em> (Level 4). Only processor-attested verification ties a review to an independently confirmed transaction.
    </div>

    <h2 id="spectrum">The verification spectrum</h2>
    <p>Every "verified" review on the internet falls into one of five levels. The level determines <em>who is attesting</em> that a purchase happened — and that determines how hard it is to fake.</p>

    <div class="spectrum-wrap">
      <div class="spectrum">
        ${spectrumSteps.map(s => `<div class="spectrum-step${s.win ? ' win' : ''}"><span class="lvl">${s.lvl}</span><div class="name">${s.name}</div><div class="desc">${s.desc}</div></div>`).join('')}
      </div>
    </div>

    <div class="vs-table-wrap" style="overflow-x:auto;">
    <table class="vs-table">
      <thead><tr><th>Level</th><th>Name</th><th>What it verifies</th><th>Who attests</th><th>Typical examples</th></tr></thead>
      <tbody>
        <tr><td>0</td><td>None</td><td>Nothing</td><td>No one</td><td>Open forums, social-media comments</td></tr>
        <tr><td>1</td><td>Email ownership</td><td>Reviewer controls an email address</td><td>Email provider</td><td>"Confirm your email" sign-ups</td></tr>
        <tr><td>2</td><td>Self-attested</td><td>Reviewer states they purchased</td><td>The reviewer</td><td>"I purchased this product" tick-box</td></tr>
        <tr><td>3</td><td>Merchant-supplied</td><td>Merchant's order or customer records contain a matching purchase</td><td>The merchant</td><td>Trustpilot (invited), Yotpo, Judge.me, Reviews.io, most Shopify review apps</td></tr>
        <tr class="highlight-row"><td class="win">4</td><td class="win">Processor-attested</td><td class="win">An independent payment processor confirms a completed, non-refunded charge</td><td class="win">The payment processor</td><td class="win">Signed Reviews (via Stripe)</td></tr>
      </tbody>
    </table>
    </div>

    <p>The rightmost level — <strong>processor-attested</strong> — is where an independent payment processor (such as Stripe) confirms a charge occurred and whether it was later refunded. Almost no review platform operates here; most sit at Level 3.</p>

    <h2 id="by-platform">What "verified" means on each platform</h2>

    <div class="platform-card">
      <span class="level">Level 3 · Merchant-supplied</span>
      <h3>Trustpilot — "Verified"</h3>
      <p>Trustpilot is an <strong>open platform</strong>: anyone who says they've had a genuine experience with a business can write a review, and <strong>no proof of purchase is required to post</strong>. A review is marked "Verified" when Trustpilot has corroborated a genuine experience — most commonly because the <strong>business sent that person a unique review invitation by email</strong> (often automatically, by BCC-ing order-confirmation emails into Trustpilot's Automatic Feedback Service). The business decides who to invite, using its own customer data, so the verification is performed against information <em>the merchant supplies</em>, not a payment processor. (<a href="https://help.trustpilot.com/s/article/Why-are-some-reviews-marked-Verified" rel="noopener">Trustpilot's own explanation</a>.)</p>
    </div>

    <div class="platform-card">
      <span class="level">Level 3 · Merchant-supplied</span>
      <h3>Yotpo — "Verified Buyer"</h3>
      <p>Yotpo marks a review "Verified Buyer" when the reviewer's email address matches a customer record present in the merchant's store data — typically the order data from the store's e-commerce platform (for example Shopify). The match is made against the merchant's platform, so the attesting party is effectively the merchant's store, not an independent processor.</p>
    </div>

    <div class="platform-card">
      <span class="level">Level 3 · Merchant-supplied</span>
      <h3>Judge.me — "Verified"</h3>
      <p>Judge.me marks a review "Verified" when it can be matched to a real order in the store. The app operates inside the merchant's Shopify store and uses the store's order data to confirm the reviewer purchased. As with the others, the source of truth is the merchant's platform data.</p>
    </div>

    <div class="platform-card">
      <span class="level">Level 3 · Merchant-supplied</span>
      <h3>Reviews.io — "Verified Reviewer"</h3>
      <p>Reviews.io marks a reviewer "Verified Reviewer" when the review comes through its invitation system, using customer data the business provides — for example a customer-list upload or an integration that feeds the merchant's customer records into Reviews.io. The business is the source of the customer data.</p>
    </div>

    <div class="platform-card win">
      <span class="level">Level 4 · Processor-attested</span>
      <h3>Signed Reviews — "Verified by Signed Reviews"</h3>
      <p>Signed Reviews operates one level to the right: every review is <strong>processor-attested</strong>. The platform connects to a business's Stripe account (read-only) and only permits a review when the reviewer's email matches a completed Stripe charge — and it automatically hides the review if that charge is later refunded. Because the attestation comes from the <strong>payment processor</strong> — an independent third party to both the merchant and the reviewer — it isn't derived from data the merchant could curate or fabricate. Each review also carries a tamper-evident cryptographic signature so its authenticity can be checked independently later. (See <a href="/trust/">how Signed Reviews verifies reviews</a>.)</p>
    </div>

    <h2 id="why-matters">Why the level matters — the FTC's 2024 fake-review rule</h2>
    <p>On 21 October 2024 the U.S. Federal Trade Commission's <strong>Trade Regulation Rule on the Use of Consumer Reviews and Testimonials</strong> (16 CFR Part 465) took effect. Among other things, it prohibits reviews that misrepresent that the reviewer had genuine experience with a product or service, the buying or selling of reviews, undisclosed insider reviews, and the suppression of negative reviews — and it lets the FTC seek civil penalties. (<a href="https://www.ftc.gov/news-events/news/press-releases/2024/08/federal-trade-commission-announces-final-rule-banning-fake-reviews-testimonials" rel="noopener">FTC press release</a>, <a href="https://www.federalregister.gov/documents/2024/08/22/2024-18519/trade-regulation-rule-on-the-use-of-consumer-reviews-and-testimonials" rel="noopener">Federal Register text</a>.)</p>
    <p>Verification level matters because it determines how difficult it is to manufacture a review that <em>looks</em> legitimate. A Level 1 or Level 2 "verified" review can be created by almost anyone with an email address. A Level 3 review is far harder to fake as an outsider, because it requires a record in the merchant's system — but it does not independently prove that money changed hands, and it offers limited protection against a merchant who controls that system. A Level 4 (processor-attested) review is the only level where an independent party — the payment processor — confirms that a charge actually occurred, and whether it still stands.</p>

    <h2 id="how-to-tell">How to tell how strongly a review was verified</h2>
    <ul>
      <li><strong>Read the platform's own definition.</strong> Every major platform publishes what its badge means in its help center; most consumers never look.</li>
      <li><strong>Check whether the platform is open or invitation-only.</strong> Open platforms have many genuinely useful reviews, but their unverified reviews carry little transactional weight.</li>
      <li><strong>Ask who attests.</strong> If the answer is "the merchant," you're at Level 3. If it's "the payment processor," you're at Level 4.</li>
      <li><strong>Look for independent proof.</strong> Processor-attested reviews can point to evidence — Signed Reviews exposes a per-review proof page tied to the Stripe charge.</li>
    </ul>

    <h2 id="faq">Frequently asked questions</h2>
    ${faqHtml}

    <div class="verdict">
      <h3>The bottom line</h3>
      <p>"Verified" is a spectrum, not a standard. When you read the word on a review, the useful question isn't "is it verified?" but "verified by whom?" A badge backed by the merchant means the merchant vouches for you; a badge backed by the payment processor means an independent party confirms the transaction actually happened. That difference is the whole point of processor-attested verification.</p>
    </div>

    <p style="text-align:center;margin-top:2rem;"><a class="btn btn-primary" href="${PLATFORM_URL}" rel="noopener" style="display:inline-flex;align-items:center;gap:.5rem;padding:.85rem 1.6rem">Collect processor-verified reviews →</a></p>
    <p style="text-align:center;margin-top:1.25rem;font-size:.9rem;color:var(--muted);">Related: <a href="/vs/trustpilot/">Signed Reviews vs Trustpilot</a> · <a href="/trust/">How Signed Reviews verifies reviews</a> · <a href="/faq/">FAQ</a></p>
  </article>`;

  const html = page({
    title,
    description,
    slug,
    pageType: 'article',
    hero: { eyebrow: 'Learn', title: 'What Does "Verified Buyer" Actually Mean?', subtitle: 'The honest, platform-by-platform answer — and the verification spectrum that separates a badge from proof.' },
    body,
    extraStyle,
  });

  // Inject Article + FAQPage schema (two independent ld+json blocks, both valid).
  const schemaTag = `\n  <script type="application/ld+json">${JSON.stringify(articleSchema)}</script>\n  <script type="application/ld+json">${JSON.stringify(faqSchema)}</script>\n</head>`;
  writePage(slug, html.replace('</head>', schemaTag));
  console.log('  ✓ /learn/what-does-verified-buyer-mean/');
}

// ── Learn: How Fake Reviews Work ──────────────────────────────────────────────
function buildLearnFakeReviewsWork() {
  const slug = '/learn/how-fake-reviews-work/';
  const canonical = `${SITE_URL}${slug}`;
  const title = 'How Fake Reviews Work — The Economics, Methods, and Systems Behind Fake Online Reviews';
  const description = 'How fake reviews are bought, sold, manufactured, and detected — the full ecosystem explained, from click farms to AI generation, plus the structural defenses that make them harder to produce.';

  const articleSchema = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: 'How Fake Reviews Work',
    description,
    datePublished: '2026-07-24',
    dateModified: '2026-07-24',
    mainEntityOfPage: { '@type': 'WebPage', '@id': canonical },
    author: { '@type': 'Organization', name: 'Signed Reviews', url: SITE_URL },
    publisher: { '@type': 'Organization', name: 'Signed Reviews', logo: { '@type': 'ImageObject', url: `${SITE_URL}/images/SignedReviews_logo_only.png` } },
    about: { '@type': 'Thing', name: 'Fake reviews' },
  };

  const extraStyle = `
    .method-card { border:1px solid var(--border); border-radius:12px; padding:1.2rem 1.3rem; margin:1rem 0; background:var(--surface); }
    .method-card h3 { margin:0 0 .4rem; font-size:1.05rem; }
    .cost-badge { display:inline-block; font-family:'JetBrains Mono',ui-monospace,monospace; font-size:.68rem; letter-spacing:.1em; text-transform:uppercase; padding:.15rem .5rem; border-radius:999px; font-weight:600; margin-left:.5rem; }
    .cost-low { background:rgba(23,173,97,.1); color:#17ad61; }
    .cost-med { background:rgba(179,157,69,.12); color:var(--gold-600); }
    .cost-high { background:rgba(200,60,60,.1); color:#c83c3c; }
    .verdict { background:linear-gradient(135deg,var(--navy-800),var(--navy-900)); border-radius:14px; padding:2rem; color:#fff; margin:2rem 0; }
    .verdict h3 { font-family:'Instrument Serif',Georgia,serif; font-size:1.5rem; margin:0 0 .5rem; color:#fff; }
    .verdict p { color:var(--navy-200); margin:0; line-height:1.6; }
  `;

  const body = `<article class="prose" style="max-width: 860px">
    <p>Fake reviews are a multi-billion-dollar underground industry. The World Economic Forum estimates fake reviews influence <strong>\$152 billion in global consumer spending annually</strong>. They're produced at industrial scale — click farms in the Philippines, bot networks in Russia, AI-generated text farms, and "brushing" schemes where sellers ship empty boxes to fabricate verified-purchase badges. This article explains how each method works, what it costs, and — critically — why some verification models make fakes structurally impossible while others only make them slightly harder.</p>

    <h2 id="scale">The scale of the problem</h2>
    <ul>
      <li><strong>Trustpilot removed 4.5 million fake reviews in 2024</strong> — 7.4% of all submissions that year.</li>
      <li><strong>Amazon blocked over 200 million suspected fake reviews</strong> in 2022 alone.</li>
      <li><strong>Google's automated systems</strong> removed over 170 million reviews that violated policies in 2023.</li>
      <li><strong>The FTC received over 55,000 consumer complaints</strong> about fake reviews between 2022–2024.</li>
    </ul>
    <p>The scale tells you this isn't a few bad actors — it's a systematic, economically rational response to the fact that reviews drive purchasing decisions, and platforms make faking them too easy.</p>

    <h2 id="methods">How fake reviews are made</h2>

    <div class="method-card">
      <h3>1. Click farms and manual posting <span class="cost-badge cost-low">Low cost</span></h3>
      <p>Workers in low-wage countries are paid pennies per review to create accounts and post positive reviews on target platforms. A 5-star Trustpilot review from a click farm costs roughly \$1–\$5. These reviews come from real devices and real IP addresses (via residential proxies), making them hard for automated systems to detect. The limiting factor is platform account requirements — platforms that require email verification or phone verification slow this down but don't stop it.</p>
    </div>

    <div class="method-card">
      <h3>2. Bot networks and automation <span class="cost-badge cost-med">Medium cost</span></h3>
      <p>Automated scripts create accounts at scale using temporary email services and virtual phone numbers. Bots can post hundreds of reviews per hour. More sophisticated operations use AI (GPT-4-level models) to generate unique, natural-sounding review text that evades duplicate-detection algorithms. Residential proxy networks make bot traffic appear to come from real households in the target country.</p>
    </div>

    <div class="method-card">
      <h3>3. Incentivized reviews (the gray area) <span class="cost-badge cost-low">Low cost</span></h3>
      <p>Businesses offer discounts, gift cards, or free products in exchange for reviews. Amazon's Vine program and similar invite-only reviewer programs are the legitimate version of this; the illegitimate version is "refund-after-review" schemes where the seller refunds the purchase price after a 5-star review is posted. These are hard to detect because the purchase is real — the reviewer really did buy the product. The deception is in the incentive, not the transaction.</p>
    </div>

    <div class="method-card">
      <h3>4. Brushing <span class="cost-badge cost-med">Medium cost</span></h3>
      <p>A seller ships an empty box or worthless item to a real address, creating a real order record in the platform's system. The seller then writes a "Verified Purchase" review against their own transaction. Because the order actually exists in the merchant's store data, Level 3 platforms (merchant-supplied verification) mark it as "Verified Buyer." The victim at the address never ordered anything — they're collateral damage in a fake-review operation. Brushing exploits the fact that Level 3 verification trusts the merchant's data.</p>
    </div>

    <div class="method-card">
      <h3>5. AI-generated review farms <span class="cost-badge cost-high">Rising, cost falling</span></h3>
      <p>The newest and fastest-growing method: large language models generate thousands of unique, contextually relevant, grammatically flawless reviews. Each review is slightly different — different phrasing, different details, different star ratings (some 4-star to look authentic). Combined with bot account creation and proxy rotation, AI farms can produce review profiles that are nearly indistinguishable from real customers. Detection relies on statistical patterns (all reviews posted within a narrow time window, similar semantic structures) rather than obvious telltale signs.</p>
    </div>

    <h2 id="defenses">How platforms defend (and why most can't win)</h2>
    <p>Every major review platform operates a combination of these defenses:</p>
    <ul>
      <li><strong>Automated detection</strong> — machine learning models flag suspicious patterns (velocity, IP clustering, text similarity, account age). Trustpilot catches ~80% of fakes this way.</li>
      <li><strong>Manual review</strong> — human moderators investigate flagged content. Slow, expensive, doesn't scale.</li>
      <li><strong>Community reporting</strong> — users and businesses report suspicious reviews. Trustpilot received ~1.3 million reports in 2024.</li>
      <li><strong>Account verification</strong> — requiring email confirmation, phone verification, or identity proof before posting. Slows down bots but doesn't stop determined fakers.</li>
      <li><strong>Transaction verification</strong> — matching reviewers to purchase records. This is the strongest defense — <strong>if the verification data is independent of the merchant.</strong></li>
    </ul>

    <p>The fundamental problem: <strong>every defense except transaction verification is reactive.</strong> Automated systems, human moderators, and community reporting all operate on the principle of "detect and remove" — which means fake reviews exist on the platform until they're caught. And with AI-generated reviews getting better and cheaper, the detection game is getting harder, not easier.</p>

    <div class="verdict">
      <h3>The only structural defense</h3>
      <p>Transaction verification is the only defense that's <strong>preventative rather than reactive.</strong> When every review requires an independently confirmed payment, fakes are structurally blocked at submission time — not detected and removed after the fact. But this only works if the verification data comes from an independent source (Level 4 — the payment processor), not from the merchant (Level 3 — the merchant's own records). A merchant can manufacture a fake order in their own Shopify store for free. They cannot manufacture a fake Stripe charge without paying real Stripe fees and risking account termination. That economic barrier — not detection algorithms — is what makes processor-attested verification the strongest anti-fake mechanism available.</p>
    </div>

    <h2 id="economics">The economics of fake reviews</h2>
    <p>Why does the fake-review industry exist at this scale? Because the ROI is compelling for bad actors:</p>
    <ul>
      <li><strong>Cost to produce one fake 5-star review:</strong> \$1–\$15 depending on method and platform</li>
      <li><strong>Revenue impact of a one-star rating improvement:</strong> 5–9% increase in conversion rate (Harvard Business School study)</li>
      <li><strong>Detection risk:</strong> low — platforms catch 7–10% at best; most fake reviews survive indefinitely</li>
      <li><strong>Penalty if caught:</strong> review removal at worst; no meaningful legal consequences for most perpetrators</li>
    </ul>
    <p>The math is simple: spend \$50 on fake reviews, potentially earn thousands in additional revenue. Until the cost of faking exceeds the benefit, or until verification makes faking structurally impossible, the industry persists.</p>

    <h2 id="structural-fix">The structural fix: why verification level matters</h2>
    <p>Every fake-review method exploits the same vulnerability: <strong>the platform doesn't independently verify that the reviewer paid for the product.</strong> At Level 0 (no verification), anyone can post. At Level 1 (email), anyone with an email address can post. At Level 2 (self-attested), anyone willing to check a box can post. At Level 3 (merchant-supplied), anyone the merchant puts on a list can post — and the merchant can put anyone on the list.</p>
    <p>At Level 4 (processor-attested), the payment processor independently confirms the charge. Click farms can't fake a Stripe charge. AI bots can't generate a Stripe transaction ID. Brushing schemes still cost real Stripe fees. The verification moves from "the platform tries to catch fakes" to "fakes can't enter the system in the first place."</p>

    <p style="text-align:center;margin-top:2rem;"><a class="btn btn-primary" href="${PLATFORM_URL}" rel="noopener" style="display:inline-flex;align-items:center;gap:.5rem;padding:.85rem 1.6rem">Collect reviews that can't be faked →</a></p>
    <p style="text-align:center;margin-top:1.25rem;font-size:.9rem;color:var(--muted);">Related: <a href="/learn/what-does-verified-buyer-mean/">What "Verified Buyer" Actually Means</a> · <a href="/learn/ftc-fake-reviews-rules/">FTC Fake Review Rules</a> · <a href="/blog/fake-review-statistics-2026/">Fake Review Statistics 2026</a></p>
  </article>`;

  const html = page({
    title, description, slug, pageType: 'article',
    hero: { eyebrow: 'Learn', title: 'How Fake Reviews Work', subtitle: 'The methods, economics, and systems behind the \$152B fake-review industry — and the one structural defense that actually prevents them.' },
    body,
    extraStyle,
  });
  const schemaTag = `\n  <script type="application/ld+json">${JSON.stringify(articleSchema)}</script>\n</head>`;
  writePage(slug, html.replace('</head>', schemaTag));
  console.log('  ✓ /learn/how-fake-reviews-work/');
}

// ── Learn: FTC Fake Review Rules ──────────────────────────────────────────────
function buildLearnFtcRules() {
  const slug = '/learn/ftc-fake-reviews-rules/';
  const canonical = `${SITE_URL}${slug}`;
  const title = 'FTC Fake Review Rules (2024) — What Businesses Need to Know';
  const description = 'The FTC\'s 2024 Trade Regulation Rule on Consumer Reviews (16 CFR Part 465) explained — what\'s banned, who it applies to, penalties, and how to be structurally compliant.';

  const articleSchema = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: 'FTC Fake Review Rules — What Businesses Need to Know',
    description,
    datePublished: '2026-07-24',
    dateModified: '2026-07-24',
    mainEntityOfPage: { '@type': 'WebPage', '@id': canonical },
    author: { '@type': 'Organization', name: 'Signed Reviews', url: SITE_URL },
    publisher: { '@type': 'Organization', name: 'Signed Reviews', logo: { '@type': 'ImageObject', url: `${SITE_URL}/images/SignedReviews_logo_only.png` } },
    about: { '@type': 'Thing', name: 'FTC fake review regulation' },
  };

  const extraStyle = `
    .rule-card { border:1px solid var(--border); border-radius:12px; padding:1.2rem 1.3rem; margin:1rem 0; background:var(--surface); }
    .rule-card h3 { margin:0 0 .4rem; font-size:1.05rem; }
    .rule-card .status { display:inline-block; font-family:'JetBrains Mono',ui-monospace,monospace; font-size:.65rem; letter-spacing:.1em; text-transform:uppercase; padding:.15rem .5rem; border-radius:999px; font-weight:600; margin-left:.5rem; }
    .status-banned { background:rgba(200,60,60,.1); color:#c83c3c; }
    .status-compliant { background:rgba(23,173,97,.1); color:#17ad61; }
    .verdict { background:linear-gradient(135deg,var(--navy-800),var(--navy-900)); border-radius:14px; padding:2rem; color:#fff; margin:2rem 0; }
    .verdict h3 { font-family:'Instrument Serif',Georgia,serif; font-size:1.5rem; margin:0 0 .5rem; color:#fff; }
    .verdict p { color:var(--navy-200); margin:0; line-height:1.6; }
    .timeline { border-left:2px solid var(--gold-500); padding-left:1.5rem; margin:1.5rem 0; }
    .timeline-item { margin-bottom:1.25rem; position:relative; }
    .timeline-item::before { content:''; position:absolute; left:-1.66rem; top:.35rem; width:10px; height:10px; border-radius:50%; background:var(--gold-500); }
    .timeline-item .date { font-family:'JetBrains Mono',ui-monospace,monospace; font-size:.72rem; letter-spacing:.1em; color:var(--gold-600); text-transform:uppercase; }
    .timeline-item h4 { margin:.2rem 0 .3rem; font-size:1rem; }
  `;

  const body = `<article class="prose" style="max-width: 860px">
    <p>On <strong>October 21, 2024</strong>, the U.S. Federal Trade Commission's <strong>Trade Regulation Rule on the Use of Consumer Reviews and Testimonials</strong> (16 CFR Part 465) took effect. It's the most significant U.S. regulation of online reviews ever enacted — and it changes the compliance landscape for every business that collects, displays, or purchases reviews. Here's what the rule covers, what it bans, who's exposed, and how to be structurally compliant rather than policy-compliant.</p>

    <h2 id="timeline">How we got here</h2>
    <div class="timeline">
      <div class="timeline-item">
        <div class="date">June 2023</div>
        <h4>FTC proposes the rule</h4>
        <p>The FTC issues a Notice of Proposed Rulemaking, citing overwhelming evidence that fake reviews harm consumers and honest businesses. Public comment period opens.</p>
      </div>
      <div class="timeline-item">
        <div class="date">August 2024</div>
        <h4>Final rule announced</h4>
        <p>The FTC votes unanimously (5–0) to issue the final rule. Commissioner statements emphasize that the rule targets deceptive practices, not honest review collection.</p>
      </div>
      <div class="timeline-item">
        <div class="date">October 21, 2024</div>
        <h4>Rule takes effect</h4>
        <p>16 CFR Part 465 becomes enforceable. The FTC can seek civil penalties of up to \$51,744 per violation.</p>
      </div>
      <div class="timeline-item">
        <div class="date">November 2024</div>
        <h4>First enforcement: SiteJabber</h4>
        <p>The FTC issues a formal order against SiteJabber for publishing reviews from consumers who had never received the products they reviewed — collected at point of sale, before product receipt.</p>
      </div>
    </div>

    <h2 id="banned">What the rule bans</h2>

    <div class="rule-card">
      <h3>1. Fake or false reviews <span class="status status-banned">Banned</span></h3>
      <p>Reviews that misrepresent that the reviewer had genuine experience with a product, service, or business. This covers reviews by people who never used the product, reviews the business wrote about itself, and reviews the business paid someone to write without disclosure.</p>
    </div>

    <div class="rule-card">
      <h3>2. Buying or selling reviews <span class="status status-banned">Banned</span></h3>
      <p>Purchasing or selling reviews — including reviews that express a particular sentiment (positive or negative). This closes the loophole where businesses claimed they were paying for "honest" reviews, not positive ones.</p>
    </div>

    <div class="rule-card">
      <h3>3. Insider reviews without disclosure <span class="status status-banned">Banned</span></h3>
      <p>Reviews written by company insiders — officers, managers, employees, or their relatives — that don't clearly disclose the reviewer's connection to the business. An employee CAN review their employer's product if they disclose the relationship. They can't pretend to be an unconnected customer.</p>
    </div>

    <div class="rule-card">
      <h3>4. Review suppression <span class="status status-banned">Banned</span></h3>
      <p>Using threats, intimidation, or false accusations to prevent or remove negative reviews. This includes legal threats against reviewers (a common tactic) and terms of service that attempt to prohibit negative reviews. The Consumer Review Fairness Act (2016) already addressed this; the FTC rule strengthens it.</p>
    </div>

    <div class="rule-card">
      <h3>5. Fake indicators of social media influence <span class="status status-banned">Banned</span></h3>
      <p>Buying or selling fake followers, views, likes, or other social media influence indicators generated by bots or hijacked accounts — when used for commercial purposes.</p>
    </div>

    <h2 id="scope">Who it applies to</h2>
    <p>The rule applies to <strong>businesses, review platforms, and intermediaries</strong> involved in collecting, moderating, displaying, or purchasing reviews. This includes:</p>
    <ul>
      <li><strong>Businesses</strong> that collect and display reviews on their own websites</li>
      <li><strong>Review platforms</strong> (Trustpilot, Yotpo, Judge.me, Signed Reviews, etc.)</li>
      <li><strong>Marketing agencies</strong> that manage review collection for clients</li>
      <li><strong>E-commerce platforms</strong> that host reviews (Amazon, Shopify, etc.)</li>
      <li><strong>Anyone who buys, sells, or facilitates fake reviews</strong></li>
    </ul>

    <h2 id="penalties">Penalties</h2>
    <p>The FTC can seek civil penalties of up to <strong>\$51,744 per violation</strong> under the FTC Act. A business that manufactured 50 fake reviews could theoretically face penalties exceeding \$2.5 million. In practice, the FTC has indicated it will prioritize cases involving systematic deception, large-scale operations, and knowing violations — but the per-violation structure means the exposure is real for businesses of any size.</p>

    <h2 id="compliance">How to be compliant (structurally, not just by policy)</h2>
    <p>Most businesses approach FTC compliance as a policy question: "What do our terms of service say? What's our moderation process?" This is necessary but insufficient. A policy is a promise; a structural guarantee is a property of the system.</p>

    <div class="verdict">
      <h3>The compliance spectrum</h3>
      <p><strong>Policy compliance (weak):</strong> "We have a policy against fake reviews. We moderate reviews before publishing. We require reviewers to confirm they purchased." This is what gets businesses in trouble — policies are only as good as their enforcement, and enforcement is expensive, inconsistent, and reactive.</p>
      <p style="margin-top:1rem;"><strong>Structural compliance (strong):</strong> "Our review system physically cannot accept a review without an independently verified payment. A neutral third party — the payment processor — confirms the charge. If the charge is refunded, the review is hidden automatically. No human moderation required to enforce this — it's built into the code." This is compliance by construction: the system makes violations impossible, not just prohibited.</p>
    </div>

    <h2 id="impact">What this means for your review strategy</h2>
    <p>The FTC rule changes the risk calculus for review collection:</p>
    <ul>
      <li><strong>Open platforms (Level 0–1)</strong> — highest risk. Anyone can post; verification is minimal. Your business could be penalized for fake reviews on your profile, even if you didn't create them. The FTC's theory: by choosing an unverified platform, you assumed the risk of fake reviews appearing on your profile.</li>
      <li><strong>Merchant-supplied platforms (Level 3)</strong> — medium risk. Verification is stronger, but you control the verification data. If a fake review appears, you're the most likely source — whether intentional or not. The FTC's SiteJabber action shows they will hold platforms and businesses accountable for systematic verification failures.</li>
      <li><strong>Processor-attested platforms (Level 4)</strong> — lowest risk. Verification is independent. You cannot fake a review without committing payment fraud against Stripe, which carries its own severe penalties. The system is structurally compliant; you don't need to trust your policies because the code enforces the compliance.</li>
    </ul>

    <p style="text-align:center;margin-top:2rem;"><a class="btn btn-primary" href="${PLATFORM_URL}" rel="noopener" style="display:inline-flex;align-items:center;gap:.5rem;padding:.85rem 1.6rem">Collect structurally compliant reviews →</a></p>
    <p style="text-align:center;margin-top:1.25rem;font-size:.9rem;color:var(--muted);">Related: <a href="/learn/what-does-verified-buyer-mean/">What "Verified Buyer" Actually Means</a> · <a href="/learn/how-fake-reviews-work/">How Fake Reviews Work</a> · <a href="/blog/fake-review-laws-ftc/">FTC Fake Review Laws</a></p>
  </article>`;

  const html = page({
    title, description, slug, pageType: 'article',
    hero: { eyebrow: 'Learn', title: 'FTC Fake Review Rules (2024)', subtitle: 'What 16 CFR Part 465 bans, who it applies to, and how to make your review collection structurally compliant — not just policy-compliant.' },
    body,
    extraStyle,
  });
  const schemaTag = `\n  <script type="application/ld+json">${JSON.stringify(articleSchema)}</script>\n</head>`;
  writePage(slug, html.replace('</head>', schemaTag));
  console.log('  ✓ /learn/ftc-fake-reviews-rules/');
}

// ── Integrations hub ──────────────────────────────────────────────────────────
function buildIntegrations() {
  const slug = '/integrations/';
  const canonical = `${SITE_URL}${slug}`;
  const title = 'Integrations — Signed Reviews';
  const description = 'Connect Signed Reviews to your existing stack. Native Stripe App with one-click install, plus REST API, webhooks, and ecosystem integrations.';

  const extraStyle = `
    .integration-card { border: 1px solid var(--border); border-radius: 14px; padding: 1.5rem; margin: 1.25rem 0; background: var(--surface); display: flex; gap: 1.25rem; align-items: flex-start; }
    .integration-card .ic-icon { flex-shrink: 0; width: 48px; height: 48px; border-radius: 12px; display: flex; align-items: center; justify-content: center; font-size: 1.4rem; font-weight: 700; }
    .integration-card .ic-body { flex: 1; }
    .integration-card .ic-body h3 { margin: 0 0 .35rem; font-size: 1.1rem; color: var(--navy-900); }
    :root.theme-dark .integration-card .ic-body h3, :root.theme-auto .integration-card .ic-body h3 { color: #fff; }
    .integration-card .ic-body p { margin: 0 0 .75rem; color: var(--text); line-height: 1.6; font-size: .93rem; }
    .integration-card .ic-body .ic-cta { font-weight: 600; font-size: .9rem; }
    .ic-stripe { background: linear-gradient(135deg, #635bff, #827af8); color: #fff; }
    .ic-api { background: linear-gradient(135deg, var(--navy-700), var(--navy-900)); color: #fff; }
    .ic-webhook { background: linear-gradient(135deg, var(--gold-400), var(--gold-600)); color: #fff; }
    .ic-planned { opacity: .65; }
    .ic-badge { display: inline-block; font-family: 'JetBrains Mono', ui-monospace, monospace; font-size: .65rem; letter-spacing: .1em; text-transform: uppercase; padding: .2rem .55rem; border-radius: 999px; font-weight: 600; }
    .ic-badge-live { background: rgba(23,173,97,.12); color: #17ad61; border: 1px solid rgba(23,173,97,.25); }
    .ic-badge-planned { background: rgba(179,157,69,.12); color: var(--gold-600); border: 1px solid rgba(179,157,69,.25); }
  `;

  const body = `<article class="prose" style="max-width: 860px">
    <p>Signed Reviews plugs into your existing payment and e-commerce stack. Every integration is designed around one principle: <strong>verification against the payment processor, not merchant-supplied data</strong>.</p>

    <div class="integration-card">
      <div class="ic-icon ic-stripe">S</div>
      <div class="ic-body">
        <h3>Stripe <span class="ic-badge ic-badge-live">Live</span></h3>
        <p>The native integration. One-click OAuth, read-only, zero code. Every Stripe charge automatically generates a verified review invitation. Refund-aware — reviews for refunded charges are hidden automatically. Works with Stripe Billing, Stripe Connect, and Stripe Checkout.</p>
        <a class="ic-cta" href="${B}integrations/stripe/">Stripe integration details →</a>
      </div>
    </div>

    <div class="integration-card">
      <div class="ic-icon ic-api">A</div>
      <div class="ic-body">
        <h3>REST API <span class="ic-badge ic-badge-live">Live</span></h3>
        <p>Programmatic access to your verified reviews. Embed reviews on your website, build custom dashboards, or integrate review collection into your own application. Authenticated via publishable + secret keys, with rate limiting and CORS support.</p>
        <a class="ic-cta" href="${B}api/">API reference →</a>
      </div>
    </div>

    <div class="integration-card">
      <div class="ic-icon ic-webhook">W</div>
      <div class="ic-body">
        <h3>Webhooks <span class="ic-badge ic-badge-live">Live</span></h3>
        <p>Real-time event delivery: review submitted, review updated, review hidden (refund), invitation sent, invitation expired. Deliver to your own endpoint. Includes a delivery webhook for triggering review invitations at exactly the right moment (e.g., when the tracking number shows "delivered").</p>
        <a class="ic-cta" href="${B}docs/">Documentation →</a>
      </div>
    </div>

    <div class="integration-card ic-planned">
      <div class="ic-icon" style="background:rgba(255,255,255,.06);border:1px dashed var(--border);color:var(--muted);">S</div>
      <div class="ic-body">
        <h3>Shopify <span class="ic-badge ic-badge-planned">Planned</span></h3>
        <p>For Shopify merchants using Stripe as their payment processor (including Shopify Payments, which runs on Stripe). Automatic review invitations on every Shopify order. Install from the Shopify App Store.</p>
      </div>
    </div>

    <div class="integration-card ic-planned">
      <div class="ic-icon" style="background:rgba(255,255,255,.06);border:1px dashed var(--border);color:var(--muted);">W</div>
      <div class="ic-body">
        <h3>WooCommerce <span class="ic-badge ic-badge-planned">Planned</span></h3>
        <p>WordPress + WooCommerce plugin for stores using the Stripe payment gateway. Connect once, and every WooCommerce order paid via Stripe triggers a verified review invitation.</p>
      </div>
    </div>

    <div class="integration-card ic-planned">
      <div class="ic-icon" style="background:rgba(255,255,255,.06);border:1px dashed var(--border);color:var(--muted);">C</div>
      <div class="ic-body">
        <h3>Custom / SaaS <span class="ic-badge ic-badge-planned">Planned</span></h3>
        <p>For SaaS companies and custom-built platforms on Stripe Billing. Every subscription payment is a verification opportunity. SDKs and drop-in components for React, Vue, and plain JavaScript.</p>
      </div>
    </div>

    <h2 id="how-they-work">How our integrations work</h2>
    <p>Every Signed Reviews integration follows the same pattern:</p>
    <ol>
      <li><strong>Connect</strong> — link your Stripe account (or install the platform-specific app) in one click.</li>
      <li><strong>Detect</strong> — Signed Reviews watches for new Stripe charges automatically.</li>
      <li><strong>Invite</strong> — a unique, expiring review invitation is sent to the customer's verified payment email.</li>
      <li><strong>Sign</strong> — the review is cryptographically signed at submission, creating a tamper-evident record.</li>
      <li><strong>Publish</strong> — the verified review appears on your public page and via the API.</li>
    </ol>
    <p>Because every integration verifies against Stripe — not merchant-supplied data — the verification chain is independent of which platform or plugin you use. <a href="/learn/what-does-verified-buyer-mean/">Learn why that matters →</a></p>

    <p style="text-align:center;margin-top:2.5rem;"><a class="btn btn-primary" href="${PLATFORM_URL}" rel="noopener" style="display:inline-flex;align-items:center;gap:.5rem;padding:.85rem 1.6rem">Connect your Stripe account →</a></p>
    <p style="text-align:center;margin-top:1.25rem;font-size:.9rem;color:var(--muted);">Related: <a href="/integrations/stripe/">Stripe integration details</a> · <a href="/api/">API reference</a> · <a href="/docs/">Documentation</a> · <a href="/blog/stripe-verified-reviews/">Stripe Verified Reviews guide</a></p>
  </article>`;

  const html = page({
    title,
    description,
    slug,
    hero: { eyebrow: 'Integrations', title: 'Connect Your Stack', subtitle: 'One-click Stripe integration plus REST API, webhooks, and planned ecosystem connectors — every one tied to processor-attested verification.' },
    body,
    extraStyle,
  });
  writePage(slug, html);
  console.log('  ✓ /integrations/');
}

// ── Integrations: Stripe ─────────────────────────────────────────────────────
// Product-led page: what the Stripe integration does, how to set it up, and
// where to go next. Includes SoftwareApplication + HowTo JSON-LD (rich results).
function buildIntegrationsStripe() {
  const slug = '/integrations/stripe/';
  const canonical = `${SITE_URL}${slug}`;
  const title = 'Stripe Integration for Verified Reviews — Signed Reviews';
  const description = 'Connect your Stripe account in one click and automatically collect verified, tamper-evident reviews on every charge. Read-only, no-code setup.';

  const softwareSchema = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: 'Signed Reviews — Stripe Integration',
    applicationCategory: 'BusinessApplication',
    operatingSystem: 'Web',
    description,
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'USD',
      name: 'Free plan',
    },
  };

  const howToSchema = {
    '@context': 'https://schema.org',
    '@type': 'HowTo',
    name: 'Connect Stripe to Signed Reviews',
    description: 'One-click OAuth setup — no code, no API keys, read-only access.',
    step: [
      { '@type': 'HowToStep', position: 1, name: 'Sign up or log in', text: 'Create a free Signed Reviews account at platform.signedreviews.com. No credit card required.' },
      { '@type': 'HowToStep', position: 2, name: 'Click "Connect Stripe"', text: 'In your dashboard, click the Stripe connection button. You\'ll be redirected to Stripe\'s official OAuth page.' },
      { '@type': 'HowToStep', position: 3, name: 'Authorize read-only access', text: 'Stripe shows you exactly which permissions are requested: read charges, read customers, read subscriptions. No write access — Signed Reviews cannot charge, refund, or modify anything in your Stripe account.' },
      { '@type': 'HowToStep', position: 4, name: 'Configure auto-requests', text: 'Choose when review invitations go out: immediately after purchase, after a delay for shipped products, or on your delivery webhook.' },
      { '@type': 'HowToStep', position: 5, name: 'Customize your branding', text: 'Add your logo, brand colors, and email sender name. Review invitations carry your branding.' },
      { '@type': 'HowToStep', position: 6, name: 'Go live', text: 'Every new Stripe charge automatically generates a verified review invitation. No ongoing management needed.' },
    ],
  };

  const extraStyle = `
    .howto-steps { counter-reset: step; list-style: none; padding: 0; margin: 1.5rem 0 2rem; }
    .howto-steps li { counter-increment: step; display: flex; gap: 1.2rem; align-items: flex-start; padding: 1.25rem 0; border-bottom: 1px solid var(--border); }
    .howto-steps li:first-child { padding-top: 0; }
    .howto-steps li:last-child { border-bottom: 0; padding-bottom: 0; }
    .howto-steps .step-num { flex-shrink: 0; width: 40px; height: 40px; border-radius: 10px; background: linear-gradient(135deg, #635bff, #827af8); color: #fff; display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 1rem; font-family: 'JetBrains Mono', ui-monospace, monospace; }
    .howto-steps .step-num::before { content: counter(step); }
    .howto-steps h3 { margin: 0 0 .3rem; font-family: 'Instrument Serif', Georgia, serif; font-size: 1.15rem; color: var(--navy-900); }
    :root.theme-dark .howto-steps h3, :root.theme-auto .howto-steps h3 { color: #fff; }
    .howto-steps p { margin: 0; color: var(--text); line-height: 1.6; }
    .perm-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: .75rem; margin: 1.25rem 0 2rem; }
    .perm-card { border: 1px solid var(--border); border-radius: 10px; padding: 1rem 1.1rem; background: var(--surface); }
    .perm-card h4 { margin: 0 0 .3rem; font-size: .92rem; font-family: 'JetBrains Mono', ui-monospace, monospace; color: var(--navy-900); }
    :root.theme-dark .perm-card h4, :root.theme-auto .perm-card h4 { color: #fff; }
    .perm-card p { margin: 0; font-size: .85rem; color: var(--text); line-height: 1.5; }
    .faq-item { border: 1px solid var(--border); border-radius: 12px; margin-bottom: .65rem; background: var(--surface); overflow: hidden; }
    .faq-q { padding: 1.1rem 1.2rem; font-weight: 600; font-size: 1rem; color: var(--navy-900); cursor: pointer; list-style: none; display: flex; justify-content: space-between; align-items: center; user-select: none; }
    .faq-q::-webkit-details-marker { display: none; }
    .faq-q::after { content: '+'; font-size: 1.25rem; font-weight: 400; color: var(--gold-500); margin-left: .75rem; flex-shrink: 0; }
    details[open] > .faq-q::after { content: '−'; }
    :root.theme-dark .faq-q, :root.theme-auto .faq-q { color: #fff; }
    .faq-a { padding: 0 1.2rem 1.15rem; color: var(--text); line-height: 1.65; font-size: .95rem; }
  `;

  const faqItems = [
    { q: 'Is the Stripe connection really read-only?', a: 'Yes. The OAuth scope is limited to reading charges, customers, and subscriptions. Signed Reviews cannot create charges, issue refunds, update subscriptions, modify customers, or initiate any write operation in your Stripe account. This is enforced by Stripe\'s permission model — not by policy.' },
    { q: 'Does this work with Stripe Connect platforms?', a: 'Yes — if your platform processes payments through Stripe Connect and you have access to the Stripe account, you can connect it. Each connected account is treated independently.' },
    { q: 'What happens if a charge is refunded?', a: 'Stripe sends a charge.refunded webhook. Signed Reviews automatically hides the associated review from your public page. No manual moderation. The review record is preserved for audit but not displayed.' },
    { q: 'Do I need to change anything in my Stripe account?', a: 'No. You don\'t need to add webhooks, modify API keys, or change any settings in your Stripe dashboard. The OAuth connection handles everything.' },
    { q: 'Can I disconnect at any time?', a: 'Yes. Disconnect from your Signed Reviews dashboard or revoke access from your Stripe dashboard. Your existing verified reviews remain — the cryptographic signatures are independent of the active connection.' },
    { q: 'Does this work with Stripe test mode?', a: 'Yes. You can connect a Stripe test-mode account during onboarding. Switch to live mode when you\'re ready to go to production.' },
  ];

  const faqHtml = faqItems.map((item, i) => `
    <details class="faq-item"${i === 0 ? ' open' : ''}>
      <summary class="faq-q">${escapeHtml(item.q)}</summary>
      <div class="faq-a"><p>${item.a}</p></div>
    </details>`).join('');

  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqItems.map(item => ({
      '@type': 'Question',
      name: item.q,
      acceptedAnswer: { '@type': 'Answer', text: item.a },
    })),
  };

  const body = `<article class="prose" style="max-width: 860px">
    <p>The Signed Reviews Stripe integration connects in one click — no code, no API keys, no webhook configuration. Once connected, every new Stripe charge automatically generates a verified review invitation. The connection is <strong>read-only</strong> (enforced by Stripe's OAuth model), so there is zero risk to your Stripe account.</p>

    <h2 id="permissions">What we can (and can't) do</h2>
    <div class="perm-grid">
      <div class="perm-card"><h4>✅ Read charges</h4><p>Verify that a purchase happened and match it to a reviewer.</p></div>
      <div class="perm-card"><h4>✅ Read customers</h4><p>Match a reviewer's email to the Stripe customer record.</p></div>
      <div class="perm-card"><h4>✅ Read subscriptions</h4><p>Support subscription businesses with recurring verification.</p></div>
      <div class="perm-card"><h4>✅ Read refunds</h4><p>Automatically hide reviews for refunded charges.</p></div>
      <div class="perm-card"><h4>❌ Create charges</h4><p>We <strong>cannot</strong> charge your customers or create payment intents.</p></div>
      <div class="perm-card"><h4>❌ Issue refunds</h4><p>We <strong>cannot</strong> refund or modify any transaction in your account.</p></div>
    </div>

    <h2 id="setup">How to connect</h2>
    <ol class="howto-steps">
      <li><div class="step-num"></div><div><h3>Sign up or log in</h3><p>Create a free Signed Reviews account at <a href="${PLATFORM_URL}" rel="noopener">platform.signedreviews.com</a>. No credit card required. The Free plan includes Stripe integration with up to 25 review invitations per month.</p></div></li>
      <li><div class="step-num"></div><div><h3>Click "Connect Stripe"</h3><p>In your dashboard, click the Stripe connection button. You'll be redirected to Stripe's official OAuth authorization page — the same flow used by thousands of Stripe App installations.</p></div></li>
      <li><div class="step-num"></div><div><h3>Authorize read-only access</h3><p>Stripe shows you exactly which permissions are requested. All are read-only. Review and click "Connect." The redirect brings you back to your Signed Reviews dashboard.</p></div></li>
      <li><div class="step-num"></div><div><h3>Configure auto-requests</h3><p>Choose your invitation timing: immediately after purchase (digital products), after a configurable delay (physical products), or triggered by your delivery webhook. Set reminder cadence — standard is 3 and 7 days.</p></div></li>
      <li><div class="step-num"></div><div><h3>Customize your branding</h3><p>Upload your logo, set brand colors, and customize the email sender name. Every review invitation carries your branding — your customers see your business, not ours.</p></div></li>
      <li><div class="step-num"></div><div><h3>Go live</h3><p>Switch from test mode to live. Every new Stripe charge automatically generates a verified review invitation. Your public review page is live immediately at <code>signedreviews.com/yourbusiness</code>.</p></div></li>
    </ol>

    <h2 id="beyond">Beyond the integration</h2>
    <p>Once connected, you get more than automated review collection:</p>
    <ul>
      <li><strong>Public review page</strong> — a hosted, branded page showing every verified review with cryptographic proof badges.</li>
      <li><strong>Public API</strong> — embed reviews on your own website (<a href="/api/">API docs</a>).</li>
      <li><strong>Trust badge</strong> — "Verified by Signed Reviews" badge to display on your site and in email footers.</li>
      <li><strong>Delivery webhook</strong> — trigger review invitations at exactly the right moment (e.g., when the tracking number shows "delivered").</li>
      <li><strong>Analytics</strong> — invitation sent/opened/submitted rates, review volume over time, average rating trends.</li>
    </ul>

    <h2 id="faq">Frequently asked questions</h2>
    ${faqHtml}

    <p style="text-align:center;margin-top:2.5rem;"><a class="btn btn-primary" href="${PLATFORM_URL}" rel="noopener" style="display:inline-flex;align-items:center;gap:.5rem;padding:.85rem 1.6rem">Connect your Stripe account →</a></p>
    <p style="text-align:center;margin-top:1.25rem;font-size:.9rem;color:var(--muted);">Related: <a href="/blog/stripe-verified-reviews/">Stripe Verified Reviews guide</a> · <a href="/how-it-works/">How it works</a> · <a href="/api/">API reference</a></p>
  </article>`;

  const html = page({
    title,
    description,
    slug,
    pageType: 'article',
    hero: { eyebrow: 'Integrations', title: 'Stripe Integration', subtitle: 'One click. Read-only. Automatically collect verified reviews on every Stripe charge.' },
    body,
    extraStyle,
  });

  const schemaTag = `\n  <script type="application/ld+json">${JSON.stringify(softwareSchema)}</script>\n  <script type="application/ld+json">${JSON.stringify(howToSchema)}</script>\n  <script type="application/ld+json">${JSON.stringify(faqSchema)}</script>\n</head>`;
  writePage(slug, html.replace('</head>', schemaTag));
  console.log('  ✓ /integrations/stripe/');
}

// ── Integrations: Shopify ─────────────────────────────────────────────────────
function buildIntegrationsShopify() {
  const slug = '/integrations/shopify/';
  const canonical = `${SITE_URL}${slug}`;
  const title = 'Shopify Integration (Planned) — Signed Reviews';
  const description = 'Shopify integration for Signed Reviews — collect verified reviews on every Shopify order processed through Stripe. Currently planned.';

  const softwareSchema = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: 'Signed Reviews — Shopify Integration',
    applicationCategory: 'BusinessApplication',
    operatingSystem: 'Web',
    description,
  };

  const extraStyle = `
    .planned-banner { background:linear-gradient(135deg,rgba(179,157,69,.08),rgba(179,157,69,.03)); border:1px solid var(--gold-500); border-radius:14px; padding:1.25rem 1.5rem; margin:1.5rem 0 2rem; text-align:center; }
    .planned-banner .badge { display:inline-block; font-family:'JetBrains Mono',ui-monospace,monospace; font-size:.7rem; letter-spacing:.15em; text-transform:uppercase; padding:.25rem .7rem; border-radius:999px; background:rgba(179,157,69,.15); color:var(--gold-600); font-weight:700; margin-bottom:.75rem; }
    .planned-banner h2 { margin:.5rem 0; font-size:1.25rem; }
    .feature-grid { display:grid; grid-template-columns:repeat(auto-fit,minmax(240px,1fr)); gap:.75rem; margin:1.5rem 0 2rem; }
    .feature-card { border:1px solid var(--border); border-radius:10px; padding:1rem 1.1rem; background:var(--surface); }
    .feature-card h3 { margin:0 0 .35rem; font-size:.95rem; }
    .feature-card p { margin:0; font-size:.88rem; color:var(--text); line-height:1.5; }
  `;

  const body = `<article class="prose" style="max-width: 860px">
    <div class="planned-banner">
      <div class="badge">Planned</div>
      <h2>Shopify integration — coming soon</h2>
      <p style="color:var(--text);margin:.5rem 0 0;">We're building a native Shopify integration for stores using Stripe as their payment processor. Sign up now and we'll notify you when it's ready.</p>
    </div>

    <h2 id="what">What it will do</h2>
    <p>For Shopify merchants using Stripe (including Shopify Payments, which runs on Stripe infrastructure), every order will automatically trigger a verified review invitation — with the same processor-attested (Level 4) verification that the direct Stripe integration provides.</p>

    <div class="feature-grid">
      <div class="feature-card"><h3>Auto-detection</h3><p>Every Shopify order paid via Stripe triggers a review invitation automatically.</p></div>
      <div class="feature-card"><h3>Processor-attested</h3><p>Level 4 verification — Stripe independently confirms every charge.</p></div>
      <div class="feature-card"><h3>Refund-aware</h3><p>Refunded orders automatically hide associated reviews.</p></div>
      <div class="feature-card"><h3>App Store install</h3><p>One-click install from the Shopify App Store — no code required.</p></div>
    </div>

    <h2 id="today">What you can do today</h2>
    <p>If your Shopify store uses Stripe as a payment processor (not just Shopify Payments), you can connect your Stripe account directly to Signed Reviews right now — the same Level 4 verification, the same automatic invitations on every charge. The Shopify App Store integration will make this even easier. <a href="/integrations/stripe/">Set up the Stripe integration →</a></p>

    <p style="text-align:center;margin-top:2.5rem;"><a class="btn btn-primary" href="${PLATFORM_URL}" rel="noopener" style="display:inline-flex;align-items:center;gap:.5rem;padding:.85rem 1.6rem">Join the waitlist →</a></p>
    <p style="text-align:center;margin-top:1.25rem;font-size:.9rem;color:var(--muted);">Related: <a href="/integrations/stripe/">Stripe integration</a> · <a href="/integrations/">All integrations</a> · <a href="/blog/stripe-verified-reviews/">Stripe Verified Reviews</a></p>
  </article>`;

  const html = page({
    title, description, slug, pageType: 'article',
    hero: { eyebrow: 'Integrations', title: 'Shopify Integration', subtitle: 'Coming soon: one-click Shopify App Store install for processor-attested verified reviews on every order.' },
    body,
    extraStyle,
  });
  const schemaTag = `\n  <script type="application/ld+json">${JSON.stringify(softwareSchema)}</script>\n</head>`;
  writePage(slug, html.replace('</head>', schemaTag));
  console.log('  ✓ /integrations/shopify/');
}

// ── Integrations: WooCommerce ──────────────────────────────────────────────────
function buildIntegrationsWooCommerce() {
  const slug = '/integrations/woocommerce/';
  const canonical = `${SITE_URL}${slug}`;
  const title = 'WooCommerce Integration (Planned) — Signed Reviews';
  const description = 'WooCommerce plugin for Signed Reviews — collect verified reviews on every WooCommerce order paid via Stripe. Currently planned.';

  const softwareSchema = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: 'Signed Reviews — WooCommerce Integration',
    applicationCategory: 'BusinessApplication',
    operatingSystem: 'Web',
    description,
  };

  const extraStyle = `
    .planned-banner { background:linear-gradient(135deg,rgba(179,157,69,.08),rgba(179,157,69,.03)); border:1px solid var(--gold-500); border-radius:14px; padding:1.25rem 1.5rem; margin:1.5rem 0 2rem; text-align:center; }
    .planned-banner .badge { display:inline-block; font-family:'JetBrains Mono',ui-monospace,monospace; font-size:.7rem; letter-spacing:.15em; text-transform:uppercase; padding:.25rem .7rem; border-radius:999px; background:rgba(179,157,69,.15); color:var(--gold-600); font-weight:700; margin-bottom:.75rem; }
    .planned-banner h2 { margin:.5rem 0; font-size:1.25rem; }
    .feature-grid { display:grid; grid-template-columns:repeat(auto-fit,minmax(240px,1fr)); gap:.75rem; margin:1.5rem 0 2rem; }
    .feature-card { border:1px solid var(--border); border-radius:10px; padding:1rem 1.1rem; background:var(--surface); }
    .feature-card h3 { margin:0 0 .35rem; font-size:.95rem; }
    .feature-card p { margin:0; font-size:.88rem; color:var(--text); line-height:1.5; }
  `;

  const body = `<article class="prose" style="max-width: 860px">
    <div class="planned-banner">
      <div class="badge">Planned</div>
      <h2>WooCommerce integration — coming soon</h2>
      <p style="color:var(--text);margin:.5rem 0 0;">We're building a WordPress/WooCommerce plugin for stores using the Stripe payment gateway. Sign up now and we'll notify you when it's ready.</p>
    </div>

    <h2 id="what">What it will do</h2>
    <p>A lightweight WordPress plugin that connects your WooCommerce store to Signed Reviews. Every WooCommerce order paid via the Stripe gateway triggers a processor-attested (Level 4) verified review invitation — automatically, with no manual configuration beyond installing and authenticating the plugin.</p>

    <div class="feature-grid">
      <div class="feature-card"><h3>WordPress-native</h3><p>Install from the WordPress plugin directory. Configure in the WordPress admin.</p></div>
      <div class="feature-card"><h3>Stripe gateway</h3><p>Works with the official WooCommerce Stripe Payment Gateway plugin.</p></div>
      <div class="feature-card"><h3>Processor-attested</h3><p>Level 4 verification — Stripe independently confirms every charge.</p></div>
      <div class="feature-card"><h3>Zero-code setup</h3><p>Install the plugin, authenticate with Stripe OAuth, go live. No developer required.</p></div>
    </div>

    <h2 id="today">What you can do today</h2>
    <p>If your WooCommerce store uses the Stripe payment gateway, you can connect your Stripe account directly to Signed Reviews right now. Every Stripe charge — including those processed through WooCommerce — triggers a verified review invitation. The plugin will make setup a one-click WordPress-admin experience. <a href="/integrations/stripe/">Set up the Stripe integration →</a></p>

    <p style="text-align:center;margin-top:2.5rem;"><a class="btn btn-primary" href="${PLATFORM_URL}" rel="noopener" style="display:inline-flex;align-items:center;gap:.5rem;padding:.85rem 1.6rem">Join the waitlist →</a></p>
    <p style="text-align:center;margin-top:1.25rem;font-size:.9rem;color:var(--muted);">Related: <a href="/integrations/stripe/">Stripe integration</a> · <a href="/integrations/">All integrations</a> · <a href="/integrations/shopify/">Shopify integration</a></p>
  </article>`;

  const html = page({
    title, description, slug, pageType: 'article',
    hero: { eyebrow: 'Integrations', title: 'WooCommerce Integration', subtitle: 'Coming soon: a WordPress plugin for processor-attested verified reviews on every WooCommerce + Stripe order.' },
    body,
    extraStyle,
  });
  const schemaTag = `\n  <script type="application/ld+json">${JSON.stringify(softwareSchema)}</script>\n</head>`;
  writePage(slug, html.replace('</head>', schemaTag));
  console.log('  ✓ /integrations/woocommerce/');
}

// ── Trust / Security page ─────────────────────────────────────────────────────
function buildTrust() {
  const body = `<article class="prose" style="max-width: var(--max-prose)">
    <h2>How we keep reviews authentic</h2>
    <p>Signed Reviews is built on a simple premise: <strong>a review should only exist if a real purchase backs it</strong>. Every design decision flows from this principle.</p>

    <h3>Cryptographic signing</h3>
    <p>Every review collected through Signed Reviews is cryptographically signed at the moment of submission. The signature binds together the review content, the Stripe transaction ID, the reviewer's email, and a timestamp — creating a tamper-evident record. Anyone can verify this signature later to confirm the review has not been altered.</p>

    <h3>Read-only Stripe access</h3>
    <p>Our Stripe integration is scoped to read-only permissions. We <strong>cannot</strong> charge, refund, transfer funds, create customers, update subscriptions, or modify anything in your Stripe account. We read your Stripe data only to:</p>
    <ul>
      <li>Verify that a reviewer completed a purchase from your business</li>
      <li>Match the reviewer to the correct transaction</li>
      <li>Detect refunds and automatically hide refunded reviews</li>
      <li>Compute aggregate public-page metrics (when enabled)</li>
    </ul>

    <h3>No fake reviews by design</h3>
    <p>Most review platforms fight fake reviews with detection algorithms — a reactive approach. Signed Reviews prevents fake reviews structurally: every review requires a verified purchase. A review link is issued either automatically after a Stripe charge succeeds or on request from the business's public page — and in both cases the email must match a real completed purchase. Links are single-use and expire after a set period. No matching purchase = no link = no review.</p>

    <h3>Data ownership</h3>
    <p>You own your review data. Signed Reviews is the processor; your business is the controller. Reviews collected through our platform belong to you — we do not sell, share, or use your review data for any purpose other than providing the service. See our <a href="/privacy/">Privacy Policy</a> and <a href="/dpa/">Data Processing Agreement</a> for the full legal framework.</p>

    <h3>Infrastructure security</h3>
    <p>Signed Reviews is hosted on Railway (AWS us-east-1) with PostgreSQL on Supabase. All data is encrypted in transit (TLS 1.3) and at rest (AES-256). API keys and Stripe access tokens are encrypted at the application layer using AES-256-GCM before storage. Our full list of sub-processors is published on our <a href="/subprocessors/">Sub-processors page</a>.</p>

    <h3>Compliance</h3>
    <p>Signed Reviews is operated by Paid Rightly LLC, a New Mexico limited liability company. Our Data Processing Agreement incorporates Standard Contractual Clauses (SCCs) for GDPR compliance. We maintain a <a href="/dmca/">DMCA policy</a> for copyright matters and publish our <a href="/terms/">Terms of Service</a> transparently.</p>

    <h3>Report a concern</h3>
    <p>If you believe a review violates our Terms of Service — for example, contains illegal content, harassment, defamation, impersonation, or spam — you can report it through the abuse-report link on any review page. Every report is reviewed by our trust & safety team within 7 business days, per our Terms of Service.</p>
  </article>`;

  const html = page({
    title: 'Trust & Security — Signed Reviews',
    description: 'How Signed Reviews keeps reviews authentic: cryptographic signing, read-only Stripe access, fake-review prevention by design, data ownership, and infrastructure security.',
    slug: '/trust/',
    hero: { eyebrow: 'Trust', title: 'Trust & Security', subtitle: 'How we ensure every review is authentic, every transaction is verified, and your data stays yours.' },
    body,
  });
  writePage('/trust/', html);
  console.log('  ✓ /trust/');
}

// ── Stub SEO pages (coming soon) ──────────────────────────────────────────────
// These routes currently return the SPA shell with generic <title>SignedReviews</title>.
// Each stub page gets a unique server-rendered <title>, <meta description>, and
// <link rel="canonical"> so Google can index them meaningfully. Replace with full
// content pages in Phase 2.
const COMING_SOON_PAGES = [
  {
    slug: '/features/',
    title: 'Features — Signed Reviews',
    desc: 'Explore the full feature set of Signed Reviews: automated review collection, tamper-evident verification, Stripe integration, and more.',
    eyebrow: 'Features',
    heading: 'Signed Reviews Features',
    subtitle: 'A complete overview of what Signed Reviews can do for your business.',
  },
  {
    slug: '/demo/',
    title: 'Request a Demo — Signed Reviews',
    desc: 'See Signed Reviews in action. Request a personalized demo to learn how verified reviews can build trust for your business.',
    eyebrow: 'Demo',
    heading: 'Request a Demo',
    subtitle: 'See how Signed Reviews works with a personalized walkthrough.',
  },
  {
    slug: '/docs/',
    title: 'Documentation — Signed Reviews',
    desc: 'Technical documentation for Signed Reviews: API reference, integration guides, and webhook configuration.',
    eyebrow: 'Docs',
    heading: 'Documentation',
    subtitle: 'API reference, integration guides, and technical documentation.',
  },
  {
    slug: '/api/',
    title: 'API Reference — Signed Reviews',
    desc: 'Signed Reviews REST API reference: authentication, endpoints, rate limits, and code examples for integrating review collection into your app.',
    eyebrow: 'API',
    heading: 'API Reference',
    subtitle: 'Integrate Signed Reviews into your application with our REST API.',
  },
];

function buildComingSoon() {
  for (const p of COMING_SOON_PAGES) {
    const body = `<article class="prose" style="max-width: var(--max-prose)">
      <p>This page is coming soon. In the meantime, explore our <a href="${B}">homepage</a> or check out our <a href="${B}pricing/">pricing</a>.</p>
    </article>`;
    const html = page({
      title: p.title,
      description: p.desc,
      slug: p.slug,
      hero: { eyebrow: p.eyebrow, title: p.heading, subtitle: p.subtitle },
      body,
    }).replace('<meta name="robots" content="index, follow">', '<meta name="robots" content="noindex, follow">');
    writePage(p.slug, html);
    console.log(`  ✓ ${p.slug}`);
  }
}

// ── robots / sitemap / favicon ───────────────────────────────────────────────
function buildSeoFiles(blogPosts = []) {
  // Blog posts carry their own publish date as lastmod; static pages share a stable
  // constant that is bumped ONLY when their content materially changes. Stamping
  // today's date on every URL makes lastmod flap on every build, which teaches
  // crawlers to ignore the signal entirely.
  const STATIC_PAGES_LASTMOD = '2026-07-24';
  const blogLastmod = new Map(blogPosts.map(p => [p.slug, p.lastmod]));
  const urls = ['/', '/pricing/', '/about/', '/contact/', '/features/', '/blog/', '/integrations/', '/integrations/stripe/', '/integrations/shopify/', '/integrations/woocommerce/', '/faq/', '/how-it-works/', '/demo/', '/docs/', '/api/', '/trust/', '/vs/trustpilot/', '/vs/feefo/', '/vs/judge-me/', '/vs/yotpo/', '/vs/ekomi/', '/vs/sitejabber/', '/vs/reviews-io/', '/vs/stamped/', '/vs/okendo/', '/vs/loox/', '/vs/skeepers/', '/vs/google-reviews/', '/vs/yelp/', '/learn/what-does-verified-buyer-mean/', '/learn/how-fake-reviews-work/', '/learn/ftc-fake-reviews-rules/', '/privacy/', '/terms/', '/dpa/', '/dmca/', '/refund-policy/', '/subprocessors/', ...blogPosts.map(p => p.slug)];
  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls
  .map(
    (u) => `  <url>
    <loc>${SITE_URL}${u}</loc>
    <lastmod>${blogLastmod.get(u) || STATIC_PAGES_LASTMOD}</lastmod>
  </url>`
  )
  .join('\n')}
</urlset>
`;
  fs.writeFileSync(path.join(ROOT, 'sitemap.xml'), sitemap, 'utf8');

  const robots = `# Signed Reviews — AI Crawler & SEO Policy
# Google Search (full crawl — must be allowed for indexation)
User-agent: Googlebot
Allow: /

# Bing / Microsoft (full crawl)
User-agent: Bingbot
Allow: /

# ── AI Search Crawlers (visibility, no training) ──────────────────
# Google AI Overviews — allow for AI search visibility, block training use
User-agent: Google-Extended
Allow: /
Content-Signal: ai-train=no, use=reference

# ChatGPT / Perplexity — allow for search visibility, block training
User-agent: GPTBot
Allow: /
Content-Signal: ai-train=no, use=reference

# Common Crawl (powers many LLM training datasets)
User-agent: CCBot
Allow: /
Content-Signal: ai-train=no, use=reference

# ── AI Search Crawlers (continued) ─────────────────────────────────
# Claude — allow for search visibility (Claude web search), block training
User-agent: ClaudeBot
Allow: /
Content-Signal: ai-train=no, use=reference

# Perplexity — allow for search visibility, block training
User-agent: PerplexityBot
Allow: /
Content-Signal: ai-train=no, use=reference

User-agent: Applebot-Extended
Disallow: /

User-agent: meta-externalagent
Disallow: /

User-agent: cohere-ai
Disallow: /

# ── Everyone else ──────────────────────────────────────────────────
User-agent: *
Allow: /

Sitemap: ${SITE_URL}/sitemap.xml
`;
  fs.writeFileSync(path.join(ROOT, 'robots.txt'), robots, 'utf8');

  const favicon = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="64" y2="64" gradientUnits="userSpaceOnUse">
      <stop offset="0" stop-color="#1c2840"/>
      <stop offset="1" stop-color="#2b3b60"/>
    </linearGradient>
  </defs>
  <rect width="64" height="64" rx="14" fill="url(#g)"/>
  <text x="32" y="42" text-anchor="middle"
        font-family="Georgia, 'Instrument Serif', serif"
        font-size="34" font-weight="400" fill="#d4c466"
        font-style="italic">SR</text>
</svg>
`;
  fs.writeFileSync(path.join(ROOT, 'favicon.svg'), favicon, 'utf8');

  console.log('  ✓ sitemap.xml, robots.txt, favicon.svg');
}

// ── Run ──────────────────────────────────────────────────────────────────────
console.log('Building signedreviews.com...');
console.log('\nLegal pages:');
buildLegal();
console.log('\nMarketing pages:');
buildPricing();
buildContact();
buildAbout();
buildFaq();
buildTrust();
buildHowItWorks();
const blogPosts = buildBlog() || [];
buildComparison();
buildComparisonFeefo();
buildComparisonJudgeMe();
buildComparisonYotpo();
buildComparisonEkomi();
buildComparisonSiteJabber();
buildComparisonReviewsIo();
buildComparisonStamped();
buildComparisonOkendo();
buildComparisonLoox();
buildComparisonSkeepers();
buildComparisonGoogleReviews();
buildComparisonYelp();
buildLearn();
buildLearnFakeReviewsWork();
buildLearnFtcRules();
buildIntegrations();
buildIntegrationsStripe();
buildIntegrationsShopify();
buildIntegrationsWooCommerce();
console.log('\nComing-soon pages:');
buildComingSoon();
console.log('\nSEO files:');
buildSeoFiles(blogPosts);

// ── Cloudflare Pages output ──────────────────────────────────────────────────
// The in-place writes above support GitHub Pages, which serves the repo root.
// Cloudflare Pages wants a single output directory, and uploading the full repo
// would include node_modules + Playwright artifacts (likely over the 20k-file
// deploy limit). Assemble a clean dist/ from the generated tree.
console.log('\nCloudflare dist/:');
const DIST_DIR = path.join(ROOT, 'dist');
fs.rmSync(DIST_DIR, { recursive: true, force: true });
fs.mkdirSync(DIST_DIR, { recursive: true });

const PUBLISH = [
  'index.html', 'favicon.svg', 'sitemap.xml', 'robots.txt', 'CNAME',
  'about', 'contact', 'dpa', 'files', 'images', 'output.css', 'trust', 'vs',
  'privacy', 'refund-policy', 'subprocessors', 'terms', 'pricing', 'dmca',
  'features', 'blog', 'integrations', 'faq', 'how-it-works', 'demo', 'docs', 'api', 'learn',
  '_headers', 'js', 'llms.txt', 'b2f3a1c8d9e0475f8a6c1d3b5e7f9a2c.txt',
];

for (const entry of PUBLISH) {
  const src = path.join(ROOT, entry);
  if (fs.existsSync(src)) {
    fs.cpSync(src, path.join(DIST_DIR, entry), { recursive: true });
  }
}

// The home page (index.html) is bespoke and not generated through SHARED_HEAD,
// so inject the PostHog snippet into its dist copy here (keeps the source file
// clean and the key in one place). No-op when POSTHOG_KEY is unset.
if (POSTHOG_SNIPPET) {
  const distIndex = path.join(DIST_DIR, 'index.html');
  if (fs.existsSync(distIndex)) {
    const html = fs.readFileSync(distIndex, 'utf8');
    if (!html.includes('posthog.init(')) {
      fs.writeFileSync(distIndex, html.replace('</head>', `${POSTHOG_SNIPPET}${SR_TRACKERS_SNIPPET}\n</head>`), 'utf8');
      console.log('  ✓ injected PostHog snippet into index.html');
    }
  }
}
console.log(`  ✓ dist/ (${PUBLISH.length} entries)`);

console.log('\nBuild complete.');
