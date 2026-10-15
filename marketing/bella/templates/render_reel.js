// Usage: NODE_PATH=$(npm root -g) node render_reel.js <reel.html> <outdir> <seconds> [preview t1,t2,...]
// Without a preview list, writes every frame at 30 fps as f0000.jpg... for ffmpeg.
// The page must expose window.render(t).
const { chromium } = require('playwright');
const path = require('path');
(async () => {
  const [, , html, outDir, secs, preview] = process.argv;
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 1080, height: 1920 } });
  await p.goto('file://' + path.resolve(html));
  await p.waitForTimeout(500);
  if (preview) {
    for (const t of preview.split(',').map(Number)) {
      await p.evaluate(x => window.render(x), t);
      await p.screenshot({ path: path.join(outDir, `p_${t}.png`) });
    }
  } else {
    const fps = 30, n = Math.round(Number(secs) * fps);
    for (let f = 0; f < n; f++) {
      await p.evaluate(x => window.render(x), f / fps);
      await p.screenshot({ path: path.join(outDir, `f${String(f).padStart(4, '0')}.jpg`), type: 'jpeg', quality: 88 });
    }
  }
  await b.close();
})();
