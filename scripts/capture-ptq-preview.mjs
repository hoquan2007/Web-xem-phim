import {chromium} from '@playwright/test';
import {mkdir,writeFile} from 'node:fs/promises';
const output='docs/research/rophim/screenshots';
await mkdir(output,{recursive:true});
const browser=await chromium.launch();
const evidence=[];
try{
 for(const width of [375,1440,1920]){
  const context=await browser.newContext({viewport:{width,height:1000},locale:'vi-VN',reducedMotion:'reduce'});
  const page=await context.newPage();
  const errors=[];page.on('pageerror',error=>errors.push(error.message));
  await page.goto('http://localhost:3000/phimhay');
  await page.getByRole('region',{name:'Phim tiêu điểm',exact:true}).waitFor();
  const first=await page.locator('#home-korea .movie-card').first().getAttribute('href');
  const routes=[['home','/phimhay'],['catalog','/phim-le'],['detail',first],['topics','/chu-de']];
  for(const [name,path] of routes){
   if(name!=='home')await page.goto('http://localhost:3000'+path);
   await page.locator('main h1').waitFor({state:'visible'});
   await page.waitForFunction(()=>[...document.querySelectorAll('main img')].filter(x=>{const r=x.getBoundingClientRect();return r.width>0&&r.height>0&&r.top<innerHeight&&r.bottom>0&&r.left<innerWidth&&r.right>0;}).every(x=>x.complete));
   const file=`${output}/${name}-${width}.png`;
   await page.screenshot({path:file});
   evidence.push({name,width,path,file,overflow:await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),errors:[...errors]});
  }
  if(width===1440){await page.goto('http://localhost:3000/phimhay');await page.getByRole('region',{name:'Phim tiêu điểm',exact:true}).waitFor();await page.locator('video').waitFor();const paused=await page.locator('video').evaluate(x=>x.paused);await page.getByRole('button',{name:'Phát trailer',exact:true}).click();await page.waitForFunction(()=>{const v=document.querySelector('video');return v&&!v.paused&&v.readyState>=2});await page.getByRole('button',{name:'Tạm dừng trailer',exact:true}).click();const stopped=await page.locator('video').evaluate(x=>x.paused);evidence.push({name:'hero-video-control',reducedMotionInitiallyPaused:paused,pauseControlWorks:stopped});}
  await context.close();
 }
}finally{await browser.close();}
await writeFile('docs/research/rophim/LIVE-QA.json',JSON.stringify(evidence,null,2));
console.log(JSON.stringify(evidence,null,2));


