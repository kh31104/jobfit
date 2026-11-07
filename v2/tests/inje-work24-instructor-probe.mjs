import {chromium,webkit} from 'playwright';
import assert from 'node:assert/strict';

const base=process.env.JOBFIT_TEST_URL||'http://127.0.0.1:8765/instructor/work24-pilot/';
const mockPosts=Array.from({length:10},(_,i)=>({
  id:'K00000'+i,company:'기업 '+i,title:'마케팅 채용 '+i,
  career:'신입',region:'부산',registrationDate:'2026-11-07',closingDate:'2026-11-30'
}));
const payload={
  ok:true,kind:'work24-recruit-connectivity-pilot',sampleOnly:true,
  queriedAt:'2026-11-07T12:00:00Z',
  filter:{keyword:'마케팅',career:'N',startPage:1,display:10},
  total:100,received:10,detailChecked:2,postings:mockPosts,
  details:[{id:'K000000',jobDescriptionPresent:true,certificatePresent:false,
    preferredConditionsPresent:true,majorPresent:false,computerSkillsPresent:false,
    jobDescriptionExcerpt:'채용공고의 직무내용은 테스트용 응답입니다.'},
    {id:'K000001',error:'detail_xml_not_returned'}]
};
for(const [name,browserType,opts] of [
  ['PC Chrome',chromium,{viewport:{width:1280,height:900}}],
  ['iPhone Safari',webkit,{viewport:{width:390,height:844},isMobile:true,hasTouch:true}]
]){
  const browser=await browserType.launch({headless:true});
  const context=await browser.newContext(opts);
  const page=await context.newPage();
  const errors=[];page.on('pageerror',err=>errors.push(err.message));

  await page.goto(base,{waitUntil:'networkidle'});
  await page.locator('#probe').click();
  await page.locator('#probeStatus').getByText('교수자 이메일 로그인 후 조회할 수 있습니다.').count().catch(()=>0);
  assert.match(await page.locator('#probeStatus').textContent(),/로그인 후 조회/);
  assert.equal(await page.locator('#results').isHidden(),true,'No result without login');

  await page.evaluate(()=>{
    sessionStorage.setItem('jobfit:instructor:supabase-session',JSON.stringify({
      accessToken:'test.fake.jwt',expiresAt:Date.now()+3600000
    }));
  });
  let requests=0;
  await page.route('**/functions/v1/work24-recruit-pilot',async route=>{
    const req=route.request(),data=req.postDataJSON();
    assert.equal(data.keyword,'마케팅');
    assert.equal(data.career,'N');
    assert.match(req.headers()['authorization']||'',/^Bearer test\.fake\.jwt$/);
    requests++;
    await route.fulfill({status:200,contentType:'application/json',body:JSON.stringify(payload)});
  });
  await page.locator('#career').selectOption('N');
  await page.locator('#probe').click();
  await page.locator('#results').waitFor({state:'visible'});
  assert.equal(requests,1,'one request only');
  assert.equal(await page.locator('#rows tr').count(),10);
  assert.equal(await page.locator('#received').textContent(),'10');
  assert.equal(await page.locator('#details .detail').count(),2);
  assert.match(await page.locator('#probeStatus').textContent(),/응답 수신 성공/);
  assert.equal(await page.locator('#rows a').first().getAttribute('href').then(s=>s.startsWith('https://www.work24.go.kr/')),true);
  assert.equal(await page.evaluate(()=>localStorage.getItem('jobfit:v2:learner')),null);
  assert.equal(await page.evaluate(()=>localStorage.getItem('jobfit:instructor:work24-probe')),null);
  assert.deepEqual(errors,[],'no browser JS errors');
  await browser.close();
  console.log(name+': authorized UI mock and data isolation passed');
}