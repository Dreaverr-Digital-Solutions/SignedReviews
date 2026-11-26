/* Google "Preferred Sources" footer button.
 * Opens Google's own "add a preferred source" page in a new tab when clicked. Google's
 * publisher.js used to be loaded on every page for an in-page popup; that sent every visitor's
 * IP address to Google before they did anything (the Google Fonts problem again), so nothing
 * from Google loads until the visitor asks for it by clicking. Loaded via <script defer>. */
(function () {
  'use strict';
  var ATTR = 'data-sr-preferred-source';
  var DEEPLINK = 'https://www.google.com/preferences/source?q=' + encodeURIComponent(location.hostname.replace(/^www\./, ''));

  function onClick() {
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
