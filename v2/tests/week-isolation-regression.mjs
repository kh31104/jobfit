import { chromium } from 'playwright';

const base=process.env.JOBFIT_TEST_URL||'http://127.0.0.1:8765/v2/';
const browser=await chromium.launch({headless:true});
let failed=false;

const mockBundle={
  schemaVersion:'jobfit-research-measures-v1',
  kcaas:{version:'K-CAAS-SF-KR-2020-v1',instrument:'test-k',itemCount:12,itemNumbers:Array.from({length:12},(_,i)=>i+1),items:Array.from({length:12},(_,i)=>`K${i+1}`),response:{min:1,max:5,minLabel:'전혀 그렇지 않다',maxLabel:'매우 그렇다'},source:{}},
  sudco:{version:'SUDCO-CHO-KR-2019-9-v1',instrument:'test-s',itemCount:9,itemNumbers:[1,2,3,4,5,7,8,9,10],items:['S1','S2','S3','S4','S5','S7','S8','S9','S10'],response:{min:0,max:6,minLabel:'전혀 그렇지 않다',maxLabel:'매우 그렇다'},source:{}}
};

function assert(value,message){if(!value)throw new Error(message)}

async function run(name,viewport){
  const context=await browser.newContext({viewport});
  const page=await context.newPage();
  const errors=[];
  page.on('pageerror',e=>errors.push(`pageerror: ${e.message}`));
  page.on('console',m=>{if(m.type()==='error')errors.push(`console: ${m.text()}`)});
  await page.route('**/functions/v1/research-measures',route=>route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({ok:true,course:'INJE2026',measures:mockBundle})}));
  try{
    await page.goto(`${base}?course=INJE2026`,{waitUntil:'networkidle'});
    assert(new URL(page.url()).searchParams.get('course')==='INJE2026','Course URL parameter changed');
    assert(await page.locator('.stepBtn').count()===14,'STEP navigation must contain 14 steps');
    const hero=(await page.locator('.hero').textContent())||'';
    assert(hero.includes('교수자에게 자동 전송되지 않습니다.'),'Local-only learner data contract missing');
    assert(await page.locator('#centralResearchBtn').isDisabled(),'Central research submission must stay disabled');

    await page.locator('#makeCodeBtn').click();
    const code=(await page.locator('#anonCode').textContent()||'').trim();
    assert(/^JF26-[A-Z2-9]{6}$/.test(code),'Anonymous code creation changed');

    for(let step=0;step<=13;step++){
      await page.locator(`.stepBtn[data-step="${step}"]`).click();
      await page.waitForTimeout(70);
      const heading=((await page.locator('#stepRoot h2').first().textContent())||'').trim();
      assert(heading.length>0,`STEP ${step} heading missing`);
      const body=(await page.locator('#stepRoot').textContent())||'';
      assert(!body.includes('화면을 불러오지 못했습니다'),`STEP ${step} render failed`);
      assert(new URL(page.url()).searchParams.get('course')==='INJE2026',`Course URL parameter lost at STEP ${step}`);
    }

    await page.locator('.stepBtn[data-step="0"]').click();
    await page.reload({waitUntil:'networkidle'});
    const restored=(await page.locator('#anonCode').textContent()||'').trim();
    assert(restored===code,'STEP navigation or reload lost learner identity');

    if(errors.length)throw new Error(errors.join('\n'));
    console.log(`PASS ${name}`);
  }catch(e){
    failed=true;
    console.error(`FAIL ${name}\n${e.stack||e}`);
  }finally{
    await context.close();
  }
}

await run('Week isolation contracts desktop',{width:1280,height:900});
await run('Week isolation contracts mobile',{width:390,height:844});

await browser.close();
if(failed)process.exit(1);
