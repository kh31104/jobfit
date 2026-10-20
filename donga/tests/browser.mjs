import { chromium, webkit, devices } from 'playwright';
import assert from 'node:assert/strict';
const url=process.env.JOBFIT_TEST_URL||'http://127.0.0.1:8765/donga/';
for(const [label,browserType,device] of [['Android Chrome',chromium,devices['Pixel 7']],['iPhone Safari',webkit,devices['iPhone 13']]]){
 const browser=await browserType.launch({headless:true});
 const context=await browser.newContext({...device,acceptDownloads:true});
 const page=await context.newPage();
 const errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 await page.goto(url,{waitUntil:'networkidle'});
 await page.locator('#promptvalue').getByText('15개의 질문',{exact:false}).waitFor({timeout:8000});
 assert.equal(await page.locator('#valuefields [data-val]').count(),8,label+' value fields');
 assert.equal(await page.locator('#strengtharea button').count(),60,label+' strength bank');
 const value={
 top5:'1. 자율성\n2. 안정성\n3. 관계\n4. 성취\n5. 책임',
 core:'자율성',must:'가족과 신뢰',can:'형식적 인정',conflict:'성장 VS 안정',
 dating:'상호 존중',relationship:'정직과 신뢰',sentence:'나는 선택의 이유를 고민하는 사람이다.'
 };
 for(const [k,v] of Object.entries(value))await page.locator('[data-val="'+k+'"]').fill(v);
 await page.locator('#savevalue').click();
 // STEP 1 now shows only the chosen left-nav section.
 const nav=page.locator('#dongaSide1 .donga-stepbtn');
 assert.equal(await nav.count(),7,label+' seven sidebar buttons');
 const select=async(n)=>{
   await nav.nth(n-1).click();
   assert.equal(await page.locator('#step'+n).isVisible(),true,label+' selected panel '+n);
   assert.equal(await page.locator('details.step:visible').count(),1,label+' exactly one visible panel');
   assert.equal(await nav.nth(n-1).getAttribute('aria-current'),'step',label+' selected sidebar highlight');
 };
 await select(2);
 for(let i=0;i<40;i++){
   await page.locator('input[name="q'+i+'"][value="4"]').check();
   if(i!==39&&i%10===9)await page.locator('#qnext').click();
 }
 assert.equal(await page.locator('#bonusarea').evaluate(el=>el.classList.contains('hidden')),false,label+' bonus');
 for(let i=0;i<3;i++)await page.locator('input[data-bonus="'+i+'"]').check();
 assert.equal(await page.locator('#anchorresult').getByText('Career Anchor 결과').count(),1,label+' anchor result');
 await select(3);
 for(const k of ['감사','공감','도전','계획','분석력'])await page.locator('#strengtharea button[data-strength="'+k+'"]').click();
 await select(4);
 for(let i=0;i<5;i++)await page.locator('#viatop input').nth(i).fill('상위강점'+(i+1));
 for(let i=0;i<3;i++)await page.locator('#vialow input').nth(i).fill('하위강점'+(i+1));
 await select(5);
 assert.equal(await page.locator('#backup').isVisible(),false,label+' backup hidden before 07');
 await select(6);
 assert.equal(await page.locator('#backup').isVisible(),false,label+' backup hidden on 06');
 await select(7);
 assert.equal(await page.locator('#backup').isVisible(),true,label+' backup visible only on 07');
 await select(1);
 assert.equal(await page.locator('#backup').isVisible(),false,label+' backup hidden again');
 await page.reload({waitUntil:'networkidle'});
 assert.equal(await page.locator('details.step:visible').count(),1,label+' 01 only after reload');
 const d=await page.evaluate(()=>JSON.parse(localStorage.getItem('jobfit:donga:step1:v1')));
 assert.equal(d.values.top5,value.top5,label+' saved multiline');
 assert.equal(d.valuesSaved,true,label+' value profile confirmed');
 assert.equal(d.anchor.answers.filter(Boolean).length,40,label+' anchor saved');
 assert.equal(d.anchor.bonus.length,3,label+' bonus saved');
 assert.equal(d.strengths.length,5,label+' strengths saved');
 assert.equal(d.via.top.length,5,label+' VIA saved');
 assert.equal(d.interviewAnswers,undefined,label+' no interview transcript');
 const overscroll=await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+2);
 assert.equal(overscroll,false,label+' horizontal overflow');
 assert.deepEqual(errors,[],label+' javascript errors');
 await browser.close();console.log('PASS '+label+' mobile end-to-end and persistence');
}
