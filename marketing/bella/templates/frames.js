const { chromium } = require('playwright');
(async()=>{const b=await chromium.launch();const p=await b.newPage({viewport:{width:1080,height:1920}});
await p.goto('file://'+process.argv[2]);await p.waitForTimeout(500);
const fps=30,dur=12;
for(let f=0;f<fps*dur;f++){await p.evaluate(t=>render(t),f/fps);
await p.screenshot({path:`${process.argv[3]}/f${String(f).padStart(4,'0')}.jpg`,type:'jpeg',quality:88});}
await b.close();})();
