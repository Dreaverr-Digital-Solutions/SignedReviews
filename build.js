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
const BASE_PATH = (process.env.BASE_PATH || '/SignedReviews/').replace(/\/+$/, '/') || '/';
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
const POSTHOG_KEY = process.env.POSTHOG_KEY || 'phc_mTGzatRy8CDWz3YnSAgAukvT2QRdR9yd72URWw26UWh2';
const POSTHOG_HOST = process.env.POSTHOG_HOST || 'https://us.i.posthog.com';
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

const SHARED_HEAD = ({ title, description, canonical, pageType = 'website' }) => `
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

  <link rel="icon" href="${B}favicon.svg" type="image/svg+xml">
  <link rel="icon" type="image/png" sizes="32x32" href="${B}images/SignedReviews_logo_only.png">
  <link rel="apple-touch-icon" href="${B}images/SignedReviews_logo_only.png">

  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link rel="preconnect" href="https://us.i.posthog.com">
  <link rel="dns-prefetch" href="https://platform.signedreviews.com">
  <link rel="preload" href="https://fonts.gstatic.com/s/instrumentserif/v18/jiz2RFNlSmViCztYvS2ZTOdC0D5n.woff2" as="font" type="font/woff2" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Instrument+Serif&family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet">

  <style>${SHARED_STYLES}</style>${POSTHOG_SNIPPET}
`;

const HEADER = (active = '') => `
<header class="site-header">
  <div class="nav-inner" id="navInner">
    <a class="brand" href="${B}" aria-label="${COMPANY.brand} home">
      <img class="brand-icon" src="${B}images/SignedReviews_logo_only.png" alt="">
      <img class="brand-wordmark" src="${B}images/SignedReviews_font_only.png" alt="${COMPANY.brand}">
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
      <a class="btn btn-secondary" href="${PLATFORM_URL}" rel="noopener">Log in</a>
      <a class="btn btn-primary" href="${PLATFORM_URL}" rel="noopener">Sign up</a>
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
      <li><a href="${PLATFORM_URL}" rel="noopener">Log in</a></li>
    </ul>
  </div>
</header>`;

const FOOTER = `
<footer class="site-footer" role="contentinfo">
  <div class="footer-grid">
    <div class="footer-brand">
      <a class="brand footer-brand-link" href="${B}" aria-label="${COMPANY.brand} home">
        <img class="brand-icon" src="${B}images/SignedReviews_logo_only.png" alt="">
        <img class="brand-wordmark" src="${B}images/SignedReviews_font_only.png" alt="${COMPANY.brand}">
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

function page({ title, description, slug, hero, body, hasToc = false, active = '', extraStyle = '', bareBody = false }) {
  const canonical = `${SITE_URL}${slug}`;
  const wrappedBody = bareBody
    ? body
    : `<div class="prose-wrap${hasToc ? ' has-toc' : ''}">
      ${body}
    </div>`;
  return `<!DOCTYPE html>
<html lang="en">
<head>${SHARED_HEAD({ title, description, canonical })}${extraStyle ? `\n  <style>${extraStyle}</style>` : ''}</head>
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
    metaDesc: 'Refund and Cancellation Policy for Signed Reviews. Currently free during beta — full policy for future paid tiers.',
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
  max-width: 1100px; margin: 2rem auto 0; padding: .9rem 1.15rem;
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

/* ── Add-on card ── */
.addon-card {
  max-width: 1100px; margin: 0 auto 1rem; padding: 1.4rem 1.5rem;
  display: flex; gap: 1.25rem; align-items: center; flex-wrap: wrap;
  background: var(--surface); border: 1px solid var(--border); border-radius: 14px;
}
.addon-card:last-of-type { margin-bottom: 3rem; }
.addon-card .addon-name {
  font-family: 'Instrument Serif', Georgia, serif;
  font-size: 1.35rem; color: var(--navy-900); margin: 0;
}
:root.theme-dark .addon-card .addon-name,
:root.theme-auto .addon-card .addon-name { color: #fff; }
.addon-card p { margin: .25rem 0 0; color: var(--muted); font-size: .92rem; }
.addon-card .addon-price {
  margin-left: auto;
  font-size: 1.15rem; font-weight: 600; color: var(--navy-900);
}
:root.theme-dark .addon-card .addon-price,
:root.theme-auto .addon-card .addon-price { color: var(--gold-300); }
@media (max-width: 560px) { .addon-card .addon-price { margin-left: 0; } }

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
`;

function buildPricing() {
  const body = `
  <div class="beta-banner" role="note">
    <span class="dot" aria-hidden="true"></span>
    <p>
      <strong>Free during beta.</strong>
      Signed Reviews is currently free for every business. The plans below describe how pricing will work when we exit beta. Existing accounts will get at least 30 days' email notice before any charges begin — see our
      <a href="${B}refund-policy/">Refund and Cancellation Policy</a>.
    </p>
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
          <li>AI Style Generator · 3 runs/day</li>
          <li>Community support</li>
        </ul>
      </article>

      <article class="tier">
        <header class="tier-header">
          <h2 class="tier-name">Starter</h2>
          <p class="tier-persona">Automation starts here — a verified request on every Stripe sale.</p>
        </header>
        <div class="tier-price-block">
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
          <li>60-day review link expiry</li>
          <li>Unlimited AI Style Generator runs</li>
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
        <div class="tier-price-block">
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
          <li>90-day review link expiry</li>
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
        <div class="tier-price-block">
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
          <li>2 automatic reminders · custom cadence + copy</li>
          <li>20 team seats</li>
          <li>90-day review link expiry</li>
          <li>Read-only API · 1,000 req/min</li>
          <li>Webhooks + CSV export</li>
          <li>Priority support · 12-hour response</li>
        </ul>
      </article>

    </div>
  </section>

  <div class="addon-card" role="region" aria-label="Invitation pack add-on">
    <div>
      <h2 class="addon-name">Add-on — Invitation Pack</h2>
      <p>+100 review invitations, one-time. Stackable on any paid plan — perfect for a bursty sales month without committing to a tier upgrade.</p>
    </div>
    <span class="addon-price">$15 / pack</span>
  </div>

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
          <th scope="col">Starter<span class="col-price">$29/mo</span></th>
          <th scope="col">Pro<span class="col-price">$79/mo</span></th>
          <th scope="col">Scale<span class="col-price">$199/mo</span></th>
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
          <td>2 · custom cadence + copy</td>
        </tr>
        <tr>
          <th scope="row">Review link expiry</th>
          <td>14 days</td>
          <td>60 days</td>
          <td>90 days</td>
          <td>90 days</td>
        </tr>
        <tr>
          <th scope="row">AI Style Generator</th>
          <td>3 runs / day</td>
          <td>Unlimited</td>
          <td>Unlimited</td>
          <td>Unlimited</td>
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
      <p>We never charge, refund, move funds, or modify anything in your Stripe account. We read your Stripe data only to verify reviews and to compute the Trust Profile metrics you choose to show.</p>
    </article>
    <article class="assurance">
      <h3>The API can't create reviews.</h3>
      <p>No matter which plan you're on, reviews only come from real customers clicking real signed invitation links. The write API handles replies, moderation, and sending invitations — never creating review records. The badge stays meaningful because the rule doesn't bend.</p>
    </article>
    <article class="assurance">
      <h3>No surprise billing.</h3>
      <p>Beta is free for everyone today. When paid plans activate, every existing account gets at least 30 days' email notice and a chance to choose its tier before any charge.</p>
    </article>
  </section>

  <section class="cta-bar" aria-label="Get started">
    <h2>Start collecting unfakable reviews today.</h2>
    <p>Free during beta. No credit card required.</p>
    <a class="btn btn-primary" href="${PLATFORM_URL}" rel="noopener">Sign up free →</a>
  </section>
`;

  const html = page({
    title: `Pricing — ${COMPANY.brand}`,
    description: 'Signed Reviews pricing — Free, Starter, Pro, and Scale plans. Free during beta; no credit card required.',
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
      <p>Each review collected through our platform is invited only after a real Stripe transaction completes, is delivered to the buyer's verified email address, and is cryptographically signed so anyone can later verify the review hasn't been altered. The result is a review record that ties back to a specific, completed payment — instead of a star rating posted by an anonymous account that may never have purchased anything.</p>

      <h2>Who operates Signed Reviews</h2>
      <p>${COMPANY.brand} is operated by <strong>${COMPANY.legalName}</strong>, a New Mexico limited liability company headquartered in Albuquerque. ${COMPANY.legalName} is the controller of business-user data and the processor of reviewer data on behalf of our business customers. The full breakdown is described in our <a href="${B}privacy/">Privacy Policy</a> and the third parties we rely on are listed in our <a href="${B}subprocessors/">Sub-processors page</a>.</p>

      <h2>How we make money</h2>
      <p>Signed Reviews is currently free during beta. If and when we introduce paid plans, we will publish updated pricing first and notify users by email at least 30 days before any charges take effect. See the <a href="${B}pricing/">Pricing page</a> and our <a href="${B}refund-policy/">Refund and Cancellation Policy</a>.</p>

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
      a: 'No. A review can only be submitted through a unique, expiring invitation link that is generated after a Stripe charge succeeds. The link is emailed to the customer\'s verified email address from the Stripe transaction. Without a completed purchase, no invitation link exists.',
    },
    {
      q: 'What happens if a charge is refunded?',
      a: 'If a charge is refunded, the associated review is automatically hidden from your public page and API responses. The cryptographic signature remains valid — proving the review was authentic — but the content is no longer displayed. This keeps your review feed accurate while preserving the integrity of the verification system.',
    },
    {
      q: 'How long are review invitation links valid?',
      a: 'Review links are valid for 14 days on the Free plan, 60 days on Starter, and 90 days on Pro and Scale plans. After expiry, the link can no longer be used to submit a review. A new charge generates a fresh invitation.',
    },
    {
      q: 'Can I customize the review request emails?',
      a: 'Yes. You can customize your logo, brand colors, content alignment, and logo size from the dashboard. The email subject line reflects your business name. Review reminder emails follow the same template with a slightly different subject and lead sentence so they don\'t feel like duplicates. Custom reminder copy is available on the Scale plan.',
    },
    {
      q: 'Does Signed Reviews work with Shopify or WooCommerce?',
      a: 'Signed Reviews works with any platform that processes payments through Stripe. If your Shopify or WooCommerce store uses Stripe as the payment processor, Signed Reviews connects directly to your Stripe account and works automatically — no Shopify/WooCommerce plugin needed.',
    },
    {
      q: 'Is Signed Reviews free?',
      a: 'Signed Reviews is free during beta. When paid plans launch, every existing account will receive at least 30 days\' email notice before any charges begin. See our <a href="/pricing/">pricing page</a> for the planned tiers.',
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

      // Extract first paragraph after frontmatter-like header as description
      const bodyStart = raw.indexOf('\n---\n');
      const contentBody = bodyStart >= 0 ? raw.slice(bodyStart + 5) : raw;
      const firstPara = contentBody.match(/\n\n(.{50,200})\n/);
      const desc = firstPara ? firstPara[1].replace(/[#*\[\]]/g, '').trim().slice(0, 160) : title;

      // Render markdown body (strip the first H1 — hero shows it)
      const renderedBody = renderMarkdown(contentBody).replace(/<h1[^>]*>[\s\S]*?<\/h1>/, '');

      const dateMatch = raw.match(/\*\*Published:\*\*\s*(.+?)\s*[*\n]/);
      const dateStr = dateMatch ? dateMatch[1].trim() : '';

      posts.push({ title, desc, slug, file, renderedBody, dateStr });
    }
  }

  // Individual post pages
  for (const post of posts) {
    const schema = {
      '@context': 'https://schema.org',
      '@type': 'BlogPosting',
      headline: post.title,
      description: post.desc,
      datePublished: post.dateStr || undefined,
      author: { '@type': 'Organization', name: 'Signed Reviews' },
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
      hero: { eyebrow: 'Blog', title: post.title, subtitle: post.desc },
      body,
    });

    const schemaTag = `\n  <script type="application/ld+json">${JSON.stringify(schema)}</script>\n</head>`;
    writePage(post.slug, html.replace('</head>', schemaTag));
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

// ── Comparison page: Signed Reviews vs Trustpilot ──────────────────────────────
function buildComparison() {
  const extraStyle = `
    .vs-hero { display: flex; align-items: center; gap: .75rem; flex-wrap: wrap; margin: 1rem 0; }
    .vs-hero .vs-label { font-family: 'JetBrains Mono', ui-monospace, monospace; font-size: .68rem; letter-spacing: .14em; text-transform: uppercase; color: var(--muted); }
    .vs-table { width: 100%; border-collapse: separate; border-spacing: 0; border: 1px solid var(--border); border-radius: 14px; overflow: hidden; font-size: .94rem; margin: 1.5rem 0 2rem; }
    .vs-table thead th { background: var(--navy-50); color: var(--navy-900); font-weight: 600; text-align: left; padding: .95rem 1.1rem; border-bottom: 1px solid var(--border); }
    :root.theme-dark .vs-table thead th, :root.theme-auto .vs-table thead th { background: rgba(255,255,255,.04); color: #fff; }
    .vs-table thead th:first-child { width: 38%; }
    .vs-table td, .vs-table th { padding: .8rem 1.1rem; border-bottom: 1px solid var(--border); vertical-align: top; }
    .vs-table td:first-child { font-weight: 600; color: var(--navy-900); }
    :root.theme-dark .vs-table td:first-child, :root.theme-auto .vs-table td:first-child { color: #fff; }
    .vs-table .win  { color: var(--gold-600); font-weight: 700; }
    .vs-table .lose { color: var(--muted); }
    .vs-table tbody tr:last-child td { border-bottom: 0; }
    .vs-table .highlight-row { background: rgba(179,157,69,.06); }
    :root.theme-dark .vs-table .highlight-row, :root.theme-auto .vs-table .highlight-row { background: rgba(179,157,69,.08); }
    .verdict { background: linear-gradient(135deg, var(--navy-800), var(--navy-900)); border-radius: 14px; padding: 2rem; color: #fff; margin: 2rem 0; }
    .verdict h3 { font-family: 'Instrument Serif', Georgia, serif; font-size: 1.5rem; margin: 0 0 .5rem; color: #fff; }
    .verdict p { color: var(--navy-200); margin: 0; line-height: 1.6; }
  `;

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
        <tr class="highlight-row"><td>Review gating</td><td class="win">Automatic — only paying customers receive invitation links, sent to the email on their Stripe transaction</td><td class="lose">Manual — businesses must upload customer lists or send invitations themselves</td></tr>
        <tr><td>Refund handling</td><td class="win">Automatic — refunded reviews are hidden from public display immediately via Stripe webhook</td><td class="lose">Manual — businesses must flag or report reviews from refunded customers</td></tr>
        <tr class="highlight-row"><td>API & integrations</td><td class="win">REST API, webhooks, delivery webhook, embeddable widget, public page API</td><td class="win">Extensive API, 100+ integrations, white-label options on Enterprise</td></tr>
        <tr><td>Pricing model</td><td class="win">Free during beta. Paid plans from $29/mo (Starter) to $199/mo (Scale). Transparent per-invitation pricing.</td><td class="lose">Free tier available, but paid plans start at $299/mo for the "Growth" tier (as of 2025). Enterprise pricing is opaque.</td></tr>
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
    extraStyle,
  });
  writePage('/vs/trustpilot/', html);
  console.log('  ✓ /vs/trustpilot/');
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
      <li>Compute aggregate Trust Profile metrics (when enabled)</li>
    </ul>

    <h3>No fake reviews by design</h3>
    <p>Most review platforms fight fake reviews with detection algorithms — a reactive approach. Signed Reviews prevents fake reviews structurally: a review invitation link is only generated when a Stripe charge succeeds, it's sent to the customer's verified payment email, and it expires after a set period. There is no "write a review" button on the platform. No purchase = no invitation = no review.</p>

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
    desc: 'Explore the full feature set of Signed Reviews: automated review collection, tamper-proof verification, Stripe integration, Trust Profile metrics, and more.',
    eyebrow: 'Features',
    heading: 'Signed Reviews Features',
    subtitle: 'A complete overview of what Signed Reviews can do for your business.',
  },
  {
    slug: '/integrations/',
    title: 'Integrations — Signed Reviews',
    desc: 'Signed Reviews integrates with Stripe, Shopify, WooCommerce, and more. Connect your stack with our API and webhooks.',
    eyebrow: 'Integrations',
    heading: 'Integrations',
    subtitle: 'Connect Signed Reviews to your existing stack.',
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
    desc: 'Technical documentation for Signed Reviews: API reference, integration guides, widget setup, and webhook configuration.',
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
    });
    writePage(p.slug, html);
    console.log(`  ✓ ${p.slug}`);
  }
}

// ── robots / sitemap / favicon ───────────────────────────────────────────────
function buildSeoFiles() {
  const today = new Date().toISOString().slice(0, 10);
  const urls = ['/', '/pricing/', '/about/', '/contact/', '/features/', '/blog/', '/integrations/', '/faq/', '/how-it-works/', '/demo/', '/docs/', '/api/', '/trust/', '/vs/trustpilot/', '/privacy/', '/terms/', '/dpa/', '/dmca/', '/refund-policy/', '/subprocessors/'];
  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls
  .map(
    (u) => `  <url>
    <loc>${SITE_URL}${u}</loc>
    <lastmod>${today}</lastmod>
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

# ── AI Training Crawlers (blocked) ────────────────────────────────
User-agent: ClaudeBot
Disallow: /

User-agent: PerplexityBot
Disallow: /

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
buildBlog();
buildComparison();
console.log('\nComing-soon pages:');
buildComingSoon();
console.log('\nSEO files:');
buildSeoFiles();

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
  'features', 'blog', 'integrations', 'faq', 'how-it-works', 'demo', 'docs', 'api',
  '_headers', 'b2f3a1c8d9e0475f8a6c1d3b5e7f9a2c.txt',
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
      fs.writeFileSync(distIndex, html.replace('</head>', `${POSTHOG_SNIPPET}\n</head>`), 'utf8');
      console.log('  ✓ injected PostHog snippet into index.html');
    }
  }
}
console.log(`  ✓ dist/ (${PUBLISH.length} entries)`);

console.log('\nBuild complete.');
