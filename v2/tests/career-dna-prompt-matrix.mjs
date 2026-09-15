import { chromium } from 'playwright';

const base=process.env.JOBFIT_TEST_URL||'http://127.0.0.1:8765/v2/';
const browser=await chromium.launch({headless:true});
let failed=false;

const mockBundle={
  schemaVersion:'jobfit-research-measures-v1',
  kcaas:{version:'K-CAAS-SF-KR-2020-v1',instrument:'test-k',itemCount:12,itemNumbers:Array.from({length:12},(_,i)=>i+1),items:Array.from({length:12},(_,i)=>`K${i+1}`),response:{min:1,max:5,minLabel:'전혀 그렇지 않다',maxLabel:'매우 그렇다'},source:{}},
  sudco:{version:'SUDCO-CHO-KR-2019-9-v1',instrument:'test-s',itemCount:9,itemNumbers:[1,2,3,4,5,7,8,9,10],items:[1,2,3,4,5,7,8,9,10].map(n=>`S${n}`),response:{min:0,max:6,minLabel:'전혀 그렇지 않다',maxLabel:'매우 그렇다'},source:{}}
};

function assert(value,message){if(!value)throw new Error(message)}

async function scenario(name,{type='S',via=[],values=[],big5=[]},checks){
  const context=await browser.newContext({viewport:{width:1280,height:1000}});
  const page=await context.newPage();
  const errors=[];
  page.on('pageerror',e=>errors.push(`pageerror: ${e.message}`));
  page.on('console',m=>{if(m.type()==='error')errors.push(`console: ${m.text()}`)});
  await page.route('**/functions/v1/research-measures',route=>route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({ok:true,course:'INJE2026',measures:mockBundle})}));
  try{
    await page.goto(`${base}?course=INJE2026&interest=${type}`,{waitUntil:'networkidle'});
    await page.locator('.stepBtn[data-step="1"]').click();
    await page.waitForSelector('#makePrompt');

    const scores={R:48,I:63,A:42,S:51,E:47,C:58};
    for(const [code,score] of Object.entries(scores))await page.locator(`#std_${code}`).fill(String(score));
    for(let i=0;i<via.length;i++)await page.locator(`#via_${i}`).fill(via[i]);
    for(let i=0;i<values.length;i++)await page.locator(`#val_${i}`).fill(String(values[i]));
    if(type==='L')for(let i=0;i<big5.length;i++)await page.locator(`#big5_${i}`).fill(String(big5[i]));

    await page.locator('#makePrompt').click();
    const prompt=(await page.locator('#promptBox').textContent())||'';
    await checks({page,prompt});
    if(errors.length)throw new Error(errors.join('\n'));
    console.log(`PASS ${name}`);
  }catch(error){
    failed=true;
    console.error(`FAIL ${name}\n${error.stack||error}`);
  }finally{
    await context.close();
  }
}

await scenario('S only uses only Work24 interest',{type:'S'},async({prompt})=>{
  assert(prompt.includes('[직업흥미 · 고용24 S형(개정)]'),'S RIASEC module missing');
  assert(!prompt.includes('[직업가치'),'Unentered values must be omitted');
  assert(!prompt.includes('[VIA 강점'),'Unentered VIA must be omitted');
  assert(!prompt.includes('[성격 5요인 · L형]'),'S flow must never add Big5');
});

await scenario('S plus partial VIA adds only partial VIA',{type:'S',via:['학구열','신중성']},async({prompt})=>{
  assert(prompt.includes('[직업흥미 · 고용24 S형(개정)]'),'S RIASEC module missing');
  assert(prompt.includes('[VIA 강점 · 교육용 참고자료 · 부분입력]'),'Partial VIA module missing');
  assert(prompt.includes('VIA가 2/5만 입력'),'Partial VIA count warning missing');
  assert(!prompt.includes('[직업가치'),'Unentered values must be omitted');
  assert(!prompt.includes('[성격 5요인 · L형]'),'S flow must never add Big5');
});

await scenario('S plus complete work values adds values only',{type:'S',values:[5,4,6,3,5,4,2,6,5]},async({prompt})=>{
  assert(prompt.includes('[직업흥미 · 고용24 S형(개정)]'),'S RIASEC module missing');
  assert(prompt.includes('[직업가치]'),'Complete values module missing');
  assert(!prompt.includes('[VIA 강점'),'Unentered VIA must be omitted');
  assert(!prompt.includes('[성격 5요인 · L형]'),'S flow must never add Big5');
});

await scenario('L plus Big5 uses L interest and Big5 only',{type:'L',big5:[61,55,68,42,70]},async({prompt})=>{
  assert(prompt.includes('[직업흥미 · 고용24 L형(개정)]'),'L RIASEC module missing');
  assert(prompt.includes('[성격 5요인 · L형]'),'L Big5 module missing');
  assert(!prompt.includes('[직업가치'),'Unentered values must be omitted');
  assert(!prompt.includes('[VIA 강점'),'Unentered VIA must be omitted');
});

await scenario('L plus Big5 values and VIA includes all completed modules',{type:'L',big5:[61,55,68,42,70],values:[5,4,6,3,5,4,2,6,5],via:['학구열','신중성','진실성','희망','친절']},async({prompt})=>{
  assert(prompt.includes('[직업흥미 · 고용24 L형(개정)]'),'L RIASEC module missing');
  assert(prompt.includes('[성격 5요인 · L형]'),'L Big5 module missing');
  assert(prompt.includes('[직업가치]'),'Values module missing');
  assert(prompt.includes('[VIA 강점 · 교육용 참고자료]'),'Complete VIA module missing');
  assert(!prompt.includes('VIA가 2/5만 입력'),'Complete VIA was misclassified as partial');
});

await scenario('Partial work values stay partial and are not guessed',{type:'S',values:[4,5]},async({prompt})=>{
  assert(prompt.includes('[직업가치 · 부분입력]'),'Partial values module missing');
  assert(prompt.includes('직업가치가 2/9만 입력'),'Partial values count warning missing');
  assert(prompt.includes('입력되지 않은 가치의 우선순위를 추정하지 않는다.'),'No-guess values guard missing');
});

await browser.close();
if(failed)process.exit(1);
