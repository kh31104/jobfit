import {chromium} from 'playwright';
import fs from 'node:fs/promises';
const browser=await chromium.launch({headless:true});
const context=await browser.newContext({acceptDownloads:true,viewport:{width:1400,height:920}});
const page=await context.newPage();
page.on('dialog',d=>d.dismiss().catch(()=>{}));
try{
 const url='https://stat.spri.kr/uportal/stat/comBriefStatPage/SPRI_3_1.do';
 await page.goto(url,{waitUntil:'domcontentloaded',timeout:40000});
 await page.waitForTimeout(3500);
 async function inspect(label){
  const info=await page.evaluate(()=>{
   const statId=document.querySelector('#hdn_StatblId')?.value||'';
   const fromPath=location.pathname;
   const count=sel=>document.querySelectorAll(sel).length;
   const links=[...document.querySelectorAll('[data-statblid]')].slice(0,8).map(x=>({id:x.getAttribute('data-statblid'),text:x.textContent?.trim().slice(0,80)}));
   const sheetNames=Object.keys(window).filter(k=>/^IBS|statSheet/i.test(k)).slice(0,8);
   return {statId,path:fromPath,title:document.title,body:document.body?.innerText.slice(0,280),
    selectors:{downloadButtons:count('#statFileDownSect a'),statIdLinks:count('[data-statblid]'),
      sheet:count('#statSheetSect'),pest:count('#statsSearchResult')},links,sheetNames,
      hasPortalDownload:typeof window.portalDownFile==='function'};
  });console.log('SPRI_BROWSER',JSON.stringify({label,...info}));return info;
 }
 let status=await inspect('initial');
 if(!status.statId){
  const links=await page.locator('[data-statblid]').all();
  if(links.length){await links[0].click({timeout:10000});await page.waitForTimeout(2500);status=await inspect('statSelected');}
 }
 for(const kind of ['CSV','JSON']){
  try{
   const download=page.waitForEvent('download',{timeout:17000});
   const trigger=await page.evaluate(k=>{
     if(typeof window.portalDownFile!=='function')return 'not_defined';
     try{window.portalDownFile(k);return 'called';}catch(e){return 'error:'+String(e.message).slice(0,100);}
   },kind);
   if(trigger!=='called'){console.log('SPRI_EXPORT',JSON.stringify({kind,trigger}));continue;}
   const d=await download;
   const p=await d.path();
   const file=await fs.readFile(p);
   const txt=new TextDecoder('utf-8').decode(file);
   let jsonParsed=false,parsedRows=0;
   if(kind==='JSON'){try{const j=JSON.parse(txt);jsonParsed=true;parsedRows=Array.isArray(j)?j.length:0}catch{}}
   console.log('SPRI_EXPORT',JSON.stringify({kind,filename:d.suggestedFilename(),bytes:file.length,
    firstLines:txt.split(/\r?\n/).slice(0,2).map(x=>x.replace(/\s+/g,' ').slice(0,170)),
    jsonParsed,parsedRows,looksHtml:/<!DOCTYPE HTML|<html/i.test(txt.slice(0,300)),
    success:kind==='CSV'?file.length>60&&!/<html/i.test(txt.slice(0,100)):jsonParsed}));
  }catch(e){console.log('SPRI_EXPORT',JSON.stringify({kind,error:String(e.message||e).slice(0,170)}));}
 }
}catch(e){console.log('SPRI_BROWSER_ERROR',String(e.message||e).slice(0,220));process.exitCode=1;}
finally{await browser.close();}
