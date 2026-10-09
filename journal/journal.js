/**
 * Red Flag Journal – homepage "Explore" cards from posts published in /admin.
 *
 * Add once to the home page, right before </body>:   <script src="/journal.js" defer></script>
 *
 * It reads published posts (Firestore collection "posts", status "published") with the site's own
 * /firebase-applet-config.json, shows up to 3 in the existing Explore grid using the page's own
 * renderArticleCard() design, and makes each card open /journal/<slug>.
 * Empty slots keep the original static articles. If anything fails, the page stays exactly as it was.
 */
(function () {
  'use strict';
  var HOME_SLOTS = 3;

  function val(v) {
    if (!v) return null;
    if ('stringValue' in v) return v.stringValue;
    if ('booleanValue' in v) return v.booleanValue;
    if ('integerValue' in v) return Number(v.integerValue);
    if ('doubleValue' in v) return v.doubleValue;
    if ('timestampValue' in v) return v.timestampValue;
    if ('arrayValue' in v) return (v.arrayValue.values || []).map(val);
    if ('mapValue' in v) { var o = {}, f = v.mapValue.fields || {}; for (var k in f) o[k] = val(f[k]); return o; }
    return null;
  }

  // Published posts, pinned first (homeOrder 1, 2, 3…), then newest. Shared with /journal pages.
  window.rfLoadPosts = function () {
    return fetch('/firebase-applet-config.json').then(function (r) { return r.json(); }).then(function (cfg) {
      var url = 'https://firestore.googleapis.com/v1/projects/' + cfg.projectId + '/databases/' +
        encodeURIComponent(cfg.firestoreDatabaseId || '(default)') + '/documents:runQuery?key=' + encodeURIComponent(cfg.apiKey);
      return fetch(url, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ structuredQuery: { from: [{ collectionId: 'posts' }], where: { fieldFilter: { field: { fieldPath: 'status' }, op: 'EQUAL', value: { stringValue: 'published' } } }, limit: 300 } })
      });
    }).then(function (r) { if (!r.ok) throw new Error('posts ' + r.status); return r.json(); }).then(function (rows) {
      return rows.filter(function (x) { return x.document; }).map(function (x) {
        var f = x.document.fields || {}, o = { id: x.document.name.split('/').pop() };
        for (var k in f) o[k] = val(f[k]);
        return o;
      }).sort(function (a, b) {
        var pa = a.homeOrder > 0 ? a.homeOrder : 1e9, pb = b.homeOrder > 0 ? b.homeOrder : 1e9;
        if (pa !== pb) return pa - pb;
        return (Date.parse(b.publishedAt) || 0) - (Date.parse(a.publishedAt) || 0);
      });
    });
  };

  function renderHome(posts) {
    var grid = document.getElementById('ac-grid');
    if (!grid || typeof renderArticleCard !== 'function') return;
    var home = posts.filter(function (p) { return p.showOnHome !== false && p.slug; }).slice(0, HOME_SLOTS);
    if (!home.length) return; // nothing published yet: keep the original cards
    try { exploreRendered = true; } catch (e) {} // stop the page's own renderer from overwriting these cards
    var cards = home.map(function (p) {
      return {
        headline: p.title || '', excerpt: p.excerpt || '', cover: p.cover || '', tag: p.tag || '',
        readingTime: p.readSeconds || 0, writer: p.author || 'Red Flag Homes',
        publishedAt: p.publishedAt ? new Date(p.publishedAt) : null, clampLines: 3,
        href: '/journal/' + encodeURIComponent(p.slug)
      };
    });
    var statics = (typeof articles !== 'undefined' && Array.isArray(articles)) ? articles : [];
    cards = cards.concat(statics.slice(0, Math.max(0, HOME_SLOTS - cards.length)));
    grid.innerHTML = '';
    cards.forEach(function (a) {
      var card = renderArticleCard(a);
      if (!a.href) { grid.appendChild(card); return; }
      var link = document.createElement('a');
      link.href = a.href; link.setAttribute('aria-label', a.headline);
      link.style.cssText = 'display:block;color:inherit;text-decoration:none;border-radius:24px;';
      link.appendChild(card); grid.appendChild(link);
    });
    if (!document.getElementById('ac-all')) {
      var more = document.createElement('p');
      more.id = 'ac-all'; more.style.cssText = 'text-align:center;margin:32px 0 0;';
      more.innerHTML = '<a href="/journal/" style="color:inherit;text-decoration:none;border-bottom:1px solid currentColor;padding-bottom:2px;font-size:15px;opacity:.85">All stories →</a>';
      grid.parentNode.appendChild(more);
    }
  }

  function start() {
    if (!document.getElementById('ac-grid')) return; // only the home page has the Explore grid
    window.rfLoadPosts().then(renderHome).catch(function (e) { if (window.console) console.info('Journal: keeping the default Explore cards (' + e.message + ')'); });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start); else start();
})();
