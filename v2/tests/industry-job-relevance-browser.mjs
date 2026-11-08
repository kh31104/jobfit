import {chromium,webkit} from 'playwright';
import assert from 'node:assert/strict';
const base='http://127.0.0.1:8767/instructor/industry-public-pilot/';
for(const [label,browserType,opts] of [
 ['PC Chrome',chromium,{viewport:{width:1200,height:880}}],
 ['iPhone Safari',webkit,{viewport:{width:390,height:844},isMobile:true,hasTouch:true}]
]){
 const browser=await browserType.launch({headless:true});
 const context=await browser.newContext(opts);
 const page=await context.newPage(),errors=[],calls=[];
 page.on('pageerror',e=>errors.push(e.message));
 await page.goto(base,{waitUntil:'networkidle'});
 await page.locator('#exampleEducation').click();
 assert.equal(await page.locator('#industry').inputValue(),'교육산업');
 assert.equal(await page.locator('#targetJob').inputValue(),'교육기획');
 assert.equal(await page.locator('#recommendations .reco').count(),2);
 assert.doesNotMatch(await page.locator('#recommendations').innerText(),/제조업 경기/);
 assert.match(await page.locator('#recommendStatus').innerText(),/제조업 BSI는 추천하지 않습니다/);
 assert.equal(await page.locator('#policy').inputValue(),'');
 assert.equal(await page.locator('#economy').inputValue(),'');
 await page.evaluate(()=>sessionStorage.setItem('jobfit:instructor:supabase-session',
  JSON.stringify({accessToken:'test.fake.jwt',expiresAt:Date.now()+600000})));
 await page.route('**/functions/v1/industry-public-pilot',async route=>{
  const args=route.request().postDataJSON();
  assert.equal(args.mode,'guided');
  assert.match(route.request().headers().authorization,/Bearer test\.fake\.jwt/);
  calls.push(args);
  const dataByKind={
   support:{field:'policy',title:'중소기업 지원사업목록',rows:[{
    title:'청년 교육훈련 지원사업',category:'인력',agency:'중소벤처기업부',start:'2026-01-01',
    end:'2026-01-30',original:'https://www.bizinfo.go.kr/example'}],keyword:'교육'},
   bsi:{field:'economy',title:'제조업 경기실사지수동향',rows:[{
    title:'자동차',actualLabel:'2026년-2분기 현황',actual:'85',
    forecastLabel:'2026년-3분기 전망',forecast:'96'}],keyword:'자동차'},
   ethics:{field:'society',title:'디지털윤리 동향정보',rows:[{
    title:'AI 윤리와 사회',year:'2026',summary:'인공지능 신뢰성 검토'}],keyword:'인공지능'}
  };
  const d=dataByKind[args.kind];
  const payload={ok:true,kind:args.kind,source:{provider:'공공기관',title:d.title,tableField:d.field,
   baseDate:'2026-09-01',license:'원문 확인',url:'https://www.data.go.kr/'},
   result:{matched:1,shown:1,rows:d.rows},
   selection:{mode:'guided',industry:args.industry,targetJob:args.targetJob,
    keyword:d.keyword,sector:args.industry,level:'보조 자료',
    why:'관련 항목만 찾았습니다',uncovered:'확인되지 않은 산업통계는 추천하지 않습니다.'},
   queriedAt:'2026-11-08T08:00:00Z'};
  await route.fulfill({status:200,contentType:'application/json',body:JSON.stringify(payload)});
 });
 await page.locator('#recommendations .reco').first().locator('button').click();
 await page.locator('#results').waitFor({state:'visible'});
 assert.equal(calls.length,1);
 assert.equal(calls[0].kind,'support');
 assert.equal(calls[0].industry,'교육산업');
 assert.equal(calls[0].targetJob,'교육기획');
 await page.locator('#rows tr').first().getByText('빈칸에 반영').click();
 assert.match(await page.locator('#policy').inputValue(),/청년 교육훈련/);
 assert.match(await page.locator('#policy').inputValue(),/탐색 기준/);
 await page.locator('#exampleManufacturing').click();
 assert.equal(await page.locator('#results').isHidden(),true);
 assert.match(await page.locator('#recommendations').innerText(),/제조업 경기/);
 assert.match(await page.locator('#policy').inputValue(),/청년 교육훈련/,'Changing industry must not overwrite teacher PEST notes');
 await page.locator('#recommendations .reco').first().locator('button').click();
 await page.locator('#results').waitFor({state:'visible'});
 assert.equal(calls[1].kind,'bsi');
 await page.locator('#rows tr').first().getByText('빈칸에 반영').click();
 assert.match(await page.locator('#economy').inputValue(),/자동차/);
 await page.locator('#exampleTech').click();
 assert.doesNotMatch(await page.locator('#recommendations').innerText(),/제조업 경기/);
 await page.locator('#recommendations .reco').first().locator('button').click();
 await page.locator('#results').waitFor({state:'visible'});
 assert.equal(calls[2].kind,'ethics');
 await page.locator('#rows tr').first().getByText('빈칸에 반영').click();
 assert.match(await page.locator('#society').inputValue(),/AI 윤리/);
 assert.match(await page.locator('#economy').inputValue(),/자동차/);
 await page.locator('#industry').fill('우주관광 산업');
 await page.locator('#recommend').click();
 assert.equal(await page.locator('#recommendations .reco').count(),0);
 assert.match(await page.locator('#recommendStatus').innerText(),/직접적인 연결을 확인하지 못했습니다/);
 assert.equal(await page.evaluate(()=>Object.keys(localStorage).filter(k=>k.includes('jobfit')).length),0);
 assert.deepEqual(errors,[],'Browser JS errors');
 await browser.close();
 console.log(label+': industry-aware source suggestions, matched requests, zero fallback, and PEST data safety PASS');
}
