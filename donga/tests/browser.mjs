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
 await page.locator('#makeanalysis').click();
 const aiPrompt=await page.locator('#analysispreview').innerText();
 assert.match(aiPrompt,/STEP 07에 붙여넣을 Career DNA v1/,label+' mapped STEP07 output block');
 assert.match(aiPrompt,/한 줄에 한 문장씩/,label+' each idea easy to copy');
 assert.match(aiPrompt,/일반 텍스트로만 작성한다/,label+' plain text output required');
 assert.match(aiPrompt,/마크다운 서식 기호를 사용하지 않는다/,label+' Markdown decorations forbidden');
 assert.match(aiPrompt,/다른 항목으로 넘어갈 때만 빈 줄을 한 번/,label+' controlled paragraph spacing');
 assert.doesNotMatch(aiPrompt,/600자 이내/,label+' remove former over-short limit');
 for(const field of ["내가 확인한 핵심 가치와 선택 기준","가치관·커리어 기준·강점이 연결되는 부분","내가 확인한 보완할 행동 또는 강점 과잉 사용","다음 실제 경험에서 검증할 질문"]){
  assert.match(aiPrompt,new RegExp(field),label+' exact STEP07 heading '+field);
 }
 assert.match(aiPrompt,/별도의 "강점을 사용한 상황" 항목은 만들지 마라/,label+' forbidden legacy input is not requested as an output');
 for(const service of ["ChatGPT","Gemini","Claude"]){
   assert.equal(await page.locator('#step6 .actions a').filter({hasText:service}).count(),1,label+' AI provider '+service);
 }
 const scratch=page.locator('#aiscratch');
 await scratch.fill("기존 메모");
 await scratch.evaluate(el=>{
   el.setSelectionRange(el.value.length,el.value.length);
   const dt=new DataTransfer();dt.setData("text","\n\n[핵심 가치]\n\n\n신중함\n\n[가설]\n실제 경험 확인 필요");
   el.dispatchEvent(new ClipboardEvent("paste",{bubbles:true,cancelable:true,clipboardData:dt}));
 });
 assert.doesNotMatch(await scratch.inputValue(),/\n\s*\n/,label+' no extra newlines in 06 pasted memo');

 await scratch.fill("");
 await scratch.evaluate(el=>{
   const clip=new DataTransfer();
   clip.setData("text","### 핵심 가치\n\n**신중함**과 __학습 지향__이 나타남.\n- [AI 가설] 실제 경험 확인 필요");
   el.dispatchEvent(new ClipboardEvent("paste",{bubbles:true,cancelable:true,clipboardData:clip}));
 });
 const scratchPlain=await scratch.inputValue();
 assert.match(scratchPlain,/^핵심 가치\n신중함과 학습 지향이 나타남\.\n\[AI 가설\] 실제 경험 확인 필요$/,label+" AI memo clean plain text");
 assert.doesNotMatch(scratchPlain,/###|\*\*|__/,label+" AI memo no format symbols");

 const check6=await page.locator('#aireview').evaluate(el=>({
   width:Math.round(el.getBoundingClientRect().width),
   height:Math.round(el.getBoundingClientRect().height),
   label:getComputedStyle(el.closest('label')).display,
   direction:getComputedStyle(el.closest('label')).flexDirection
 }));
 assert.equal(check6.direction,"row",label+' STEP6 checkbox horizontally aligned');
 assert(check6.width<=20&&check6.height<=20,label+' STEP6 checkbox proper size');
 await page.locator('#aireview').check();

 await page.evaluate(()=>{
   const key="jobfit:donga:step1:v1";
   const data=JSON.parse(localStorage.getItem(key));data.dna.strengths="과거 저장된 강점 설명 — 삭제 금지";
   localStorage.setItem(key,JSON.stringify(data));
 });
 await page.reload({waitUntil:'networkidle'});
 await select(7);
 assert.equal(await page.locator('#backup').isVisible(),true,label+' backup visible only on 07');
 assert.equal(await page.locator('#dnafields textarea').count(),4,label+' STEP7 exactly four DNA fields');
 assert.equal(await page.locator('[data-dna="strengths"]').count(),0,label+' removed strengths situation field hidden');
 for(const [i,key] of ["values","fit","caution","next"].entries()){
   const el=page.locator('[data-dna="'+key+'"]');
   await el.fill("기존 내용 "+i);
   await el.evaluate(input=>{
     input.setSelectionRange(input.value.length,input.value.length);
     const dt=new DataTransfer();
     dt.setData("text","\n\n[AI 가설]\n\n\n확인할 내용 "+input.dataset.dna);
     input.dispatchEvent(new ClipboardEvent("paste",{bubbles:true,cancelable:true,clipboardData:dt}));
   });
   assert.doesNotMatch(await el.inputValue(),/\n\s*\n/,label+' STEP7 pasted value no blank lines '+key);

   await el.fill("");
   await el.evaluate(input=>{
     const clip=new DataTransfer();
     clip.setData("text","## "+input.dataset.dna+"\n\n**원문 내용 유지**\n- [확인 필요] 실제 경험");
     input.dispatchEvent(new ClipboardEvent("paste",{bubbles:true,cancelable:true,clipboardData:clip}));
   });
   assert.equal(await el.inputValue(),key+"\n원문 내용 유지\n[확인 필요] 실제 경험",label+" STEP7 paste cleans decoration only "+key);

 }
 const check7=await page.locator('#confirmdna').evaluate(el=>({
   width:Math.round(el.getBoundingClientRect().width),
   direction:getComputedStyle(el.closest('label')).flexDirection
 }));
 assert.equal(check7.direction,"row",label+' STEP7 checkbox horizontally aligned');
 assert(check7.width<=20,label+' STEP7 checkbox proper size');
 await page.locator('#confirmdna').check();
 await page.locator('#savedna').click();
 assert.match(await page.locator('#dnapreview').innerText(),/저장 완료/,label+' four fields saved');
 assert.doesNotMatch(await page.locator('#dnapreview').innerText(),/내가 확인한 강점과 강점을 사용한 상황/,label+' removed legacy result not printed');
 const legacy=await page.evaluate(()=>JSON.parse(localStorage.getItem("jobfit:donga:step1:v1")).dna.strengths);
 assert.equal(legacy,"과거 저장된 강점 설명 — 삭제 금지",label+' old data preserved');

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
