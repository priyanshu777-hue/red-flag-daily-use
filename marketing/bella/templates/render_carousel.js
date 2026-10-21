// Usage: NODE_PATH=$(npm root -g) node render_carousel.js <carousel.json> <outdir>
// carousel.json: {slides:[{name, ...slide data for carousel_tpl.html renderSlide()}]}
const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');
(async () => {
  const [, , jsonPath, outDir] = process.argv;
  const { slides } = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 1080, height: 1350 } });
  await p.goto('file://' + path.join(__dirname, 'carousel_tpl.html'));
  for (const [i, sl] of slides.entries()) {
    await p.evaluate(d => window.renderSlide(d), { ...sl, n: i + 1, total: slides.length });
    await p.waitForTimeout(120);
    const warn = await p.evaluate(() => {
      const w = document.querySelector('.wrap').getBoundingClientRect();
      const f = document.querySelector('.foot').getBoundingClientRect();
      return w.bottom > f.top - 30 ? 'content overlaps footer (' + Math.round(w.bottom) + ' > ' + Math.round(f.top - 30) + ')' : '';
    });
    await p.screenshot({ path: path.join(outDir, sl.name + '.png') });
    console.log(sl.name, warn ? 'LAYOUT WARN: ' + warn : 'ok');
  }
  await b.close();
})();
