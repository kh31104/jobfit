import { chromium } from 'playwright';

const base=process.env.JOBFIT_TEST_URL||'http://127.0.0.1:8765/v2/';
const browser=await chromium.launch({headless:true});
let failed=false;
const scoring={A:[1,9,17,25,33],B:[2,10,18,26,34],C:[3,11,19,27,35],D:[4,12,20,28,36],E:[5,13,21,29,37],F:[6,14,22,30,38],G:[7,15,23,31,39],H:[8,16,24,32,40]};
const mockAnchor={version:'COI-SCHEIN-KR-USER-SOURCE-40-v1',itemCount:40,itemNumbers:Array.from({length:40},(_,i)=>i+1),items:Array.from({length:40},(_,i)=>`Career Anchor 문항 ${i+1}`),response:{min:1,max:6,minLabel:'결코 아님',maxLabel:'항상 해당됨'},bonusRule:{selectCount:3,addPoints:4},anchors:['A','B','C','D','E','F','G','H'].map(code=>({code,name:`${code}유형`})),scoring,source:{}};
const mockMeasures={schemaVersion:'jobfit-research-measures-v1',kcaas:{version:'K-CAAS-SF-KR-2020-v1',instrument:'test-k',itemCount:12,itemNumbers:Array.from({length:12},(_,i)=>i+1),items:Array.from({length:12},(_,i)=>`K${i+1}`),response:{min:1,max:5,minLabel:'전혀 그렇지 않다',maxLabel:'매우 그렇다'},source:{}},sudco:{version:'SUDCO-CHO-KR-2019-9-v1',instrument:'test-s',itemCount:9,itemNumbers:[1,2,3,4,5,7,8,9,10],items:[1,2,3,4,5,7,8,9,10].map(n=>`S${n}`),response:{min:0,max:6,minLabel:'전혀 그렇지 않다',maxLabel:'매우 그렇다'},source:{}}};
function assert(value,message){if(!value)throw new Error(message)}

async function run(name,viewport){
  const context=await browser.newContext({viewport});const page=await context.newPage();const errors=[];
  page.on('pageerror',e=>errors.push(`pageerror: ${e.message}`));page.on('console',m=>{if(m.type()==='error')errors.push(`console: ${m.text()}`)});
  await page.route('**/functions/v1/career-dna-measures',route=>route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({ok:true,course:'INJE2026',careerAnchor:mockAnchor})}));
  await page.route('**/functions/v1/research-measures',route=>route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({ok:true,course:'INJE2026',measures:mockMeasures})}));
  try{
    await page.goto(`${base}?course=INJE2026`,{waitUntil:'networkidle'});
    assert(new URL(page.url()).searchParams.get('course')==='INJE2026','Course URL parameter changed');
    assert(new URL(page.url()).searchParams.get('measures')==='true','INJE2026 must keep STEP0 PRE enabled');
    assert(await page.locator('.stepBtn').count()===14,'STEP navigation must contain 14 steps');
    const hero=(await page.locator('.hero').textContent())||'';assert(hero.includes('교수자에게 자동 전송되지 않습니다.'),'Local-only learner data contract missing');

    await page.waitForSelector('#preMeasureSave');
    const step0=(await page.locator('#stepRoot').textContent())||'';
    assert(step0.includes('오늘 할 일은 7개뿐입니다.'),'STEP0 must keep seven-stage sequence');
    const journey=(await page.locator('.journeyStrip span').allTextContents()).map(x=>x.replace(/\s+/g,' ').trim());
    assert(journey.length===7,'STEP0 journey must contain seven stages');
    assert(journey[0].includes('수업 연결')&&journey[1].includes('익명코드')&&journey[2].includes('기본정보')&&journey[3].includes('현재 준비상태')&&journey[4].includes('AI Check-in')&&journey[5].includes('PRE 측정')&&journey[6].includes('백업'),'STEP0 stage order changed');
    assert(await page.locator('[data-measure="pre-work24"]').count()===14,'STEP0 Work24 PRE must expose 14 score inputs');
    assert(await page.locator('[data-measure="pre-kcaas"]').count()===12,'STEP0 K-CAAS PRE must expose 12 items');

    await page.locator('#makeCodeBtn').click();const code=(await page.locator('#anonCode').textContent()||'').trim();assert(/^JF26-[A-Z2-9]{6}$/.test(code),'Anonymous code creation changed');
    for(let step=0;step<=13;step++){
      await page.locator(`.stepBtn[data-step="${step}"]`).click();await page.waitForTimeout(70);
      const heading=((await page.locator('#stepRoot h2').first().textContent())||'').trim();assert(heading.length>0,`STEP ${step} heading missing`);
      const body=(await page.locator('#stepRoot').textContent())||'';assert(!body.includes('화면을 불러오지 못했습니다'),`STEP ${step} render failed`);assert(new URL(page.url()).searchParams.get('course')==='INJE2026',`Course URL parameter lost at STEP ${step}`);
    }
    await page.locator('.stepBtn[data-step="0"]').click();await page.reload({waitUntil:'networkidle'});const restored=(await page.locator('#anonCode').textContent()||'').trim();assert(restored===code,'STEP navigation or reload lost learner identity');
    if(errors.length)throw new Error(errors.join('\n'));console.log(`PASS ${name}`);
  }catch(e){failed=true;console.error(`FAIL ${name}\n${e.stack||e}`)}finally{await context.close()}
}

await run('Week isolation contracts desktop',{width:1280,height:900});
await run('Week isolation contracts mobile',{width:390,height:844});
await browser.close();if(failed)process.exit(1);
