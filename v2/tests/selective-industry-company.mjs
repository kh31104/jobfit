import {chromium} from 'playwright';

const base=process.env.JOBFIT_TEST_URL||'http://127.0.0.1:8765/v2/';
const browser=await chromium.launch({headless:true});let failed=false;
function assert(v,m){if(!v)throw new Error(m)}
async function run(name,viewport){const context=await browser.newContext({viewport}),page=await context.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));try{
  await page.goto(`${base}selective.html?tool=industry-company`,{waitUntil:'networkidle'});
  const body=(await page.locator('body').textContent())||'';
  for(const text of ['선택형 Career Tools','Industry & Company Explorer','Target Job 1~3개','AI 산업탐색','Industry Evidence','AI 기업탐색','Company Evidence','나의 Career Target 조합'])assert(body.includes(text),`Missing selective module text: ${text}`);
  assert(body.includes('연구 제출 없음'),'Selective shell must state no research submission');
  await page.locator('#targetJobs').fill('마케팅, HRD');await page.locator('#interestKeywords').fill('AI 교육');await page.locator('#workValues').fill('성장, 자율성, 워라밸');await page.locator('#saveCriteria').click();
  const industryPrompt=await page.locator('#industryPrompt').inputValue();assert(industryPrompt.includes('마케팅')&&industryPrompt.includes('HRD')&&industryPrompt.includes('AI 교육'),'Industry prompt must use learner criteria');
  await page.locator('#industryName').fill('에듀테크');await page.locator('#industryJob').selectOption({label:'HRD'});await page.locator('#industrySourceType').selectOption({label:'정부·공공기관'});await page.locator('#industrySource').fill('공식 산업자료');await page.locator('#industryUrl').fill('https://example.com/industry');await page.locator('#industryRole').fill('교육 문제를 분석하고 프로그램 성과에 기여');await page.locator('#addIndustry').click();
  await page.locator('[data-target-ind]').check();
  const companyPrompt=await page.locator('#companyPrompt').inputValue();assert(companyPrompt.includes('에듀테크')&&companyPrompt.includes('성장, 자율성, 워라밸'),'Company prompt must use selected industry and work values');
  await page.locator('#companyName').fill('테스트기업');await page.locator('#companyType').selectOption({label:'중견기업'});await page.locator('#companyIndustry').selectOption({label:'에듀테크'});await page.locator('#companyJob').selectOption({label:'HRD'});await page.locator('#companySource').fill('기업 공식 홈페이지');await page.locator('#companyUrl').fill('https://example.com/company');await page.locator('#companyHiring').selectOption({label:'공식 직무소개 확인'});await page.locator('#companyValueEvidence').fill('교육지원 제도와 직무 자율성은 추가 확인 필요');await page.locator('#addCompany').click();
  await page.locator('[data-target-co]').check();
  const map=(await page.locator('#finalMap').textContent())||'';assert(map.includes('HRD')&&map.includes('에듀테크')&&map.includes('테스트기업'),'Final Career Target map must connect job, industry and company');
  const stored=await page.evaluate(()=>JSON.parse(localStorage.getItem('jobfit:v2:selective:industry-company')));assert(stored.targetIndustries.length===1&&stored.targetCompanies.length===1,'Selective evidence targets were not persisted');
  if(viewport.width<=480){const overflow=await page.evaluate(()=>document.documentElement.scrollWidth-window.innerWidth);assert(overflow<=2,`Selective mobile horizontal overflow: ${overflow}px`)}
  if(errors.length)throw new Error(errors.join('\n'));console.log(`PASS ${name}`);
}catch(e){failed=true;console.error(`FAIL ${name}\n${e.stack||e}`)}finally{await context.close()}}
await run('selective Industry & Company desktop',{width:1280,height:1000});
await run('selective Industry & Company mobile',{width:390,height:844});
await browser.close();if(failed)process.exit(1);
