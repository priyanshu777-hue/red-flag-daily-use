const { chromium } = require('playwright');
(async()=>{const b=await chromium.launch();const p=await b.newPage({viewport:{width:1080,height:1920}});
await p.goto('file://'+process.argv[2]);await p.waitForTimeout(500);
for(const id of ['s1','s2','s3']){await p.evaluate(i=>{document.querySelectorAll('.s').forEach(e=>e.classList.toggle('on',e.id===i))},id);
await p.screenshot({path:process.argv[3]+'/'+id+'.png'});}
await b.close();})();
