// Usage: NODE_PATH=$(npm root -g) node render_stories.js <stories.json> <outdir>
// stories.json: [{name, ...story data for story_tpl.html renderStory()}]
const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');
(async () => {
  const [, , jsonPath, outDir] = process.argv;
  const stories = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 1080, height: 1920 } });
  await p.goto('file://' + path.join(__dirname, 'story_tpl.html'));
  for (const st of stories) {
    await p.evaluate(d => window.renderStory(d), st);
    await p.waitForTimeout(150);
    const overflow = await p.evaluate(() => {
      const s = document.getElementById('s').getBoundingClientRect();
      const bad = [];
      for (const el of document.querySelectorAll('.wrap, .cta')) {
        const r = el.getBoundingClientRect();
        if (r.bottom > s.bottom - 250 || r.top < 250) bad.push(el.className + ' ' + Math.round(r.top) + '-' + Math.round(r.bottom));
      }
      const wrap = document.querySelector('.wrap').getBoundingClientRect();
      const cta = document.querySelector('.cta');
      if (cta && wrap.bottom > cta.getBoundingClientRect().top - 30) bad.push('wrap overlaps cta');
      return bad;
    });
    await p.screenshot({ path: path.join(outDir, st.name + '.png') });
    console.log(st.name, overflow.length ? 'LAYOUT WARN: ' + overflow.join('; ') : 'ok');
  }
  await b.close();
})();
