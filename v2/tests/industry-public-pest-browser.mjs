import {chromium,webkit} from 'playwright';
import assert from 'node:assert/strict';

const base='http://127.0.0.1:8767/instructor/industry-public-pilot/';
for(const [name,type,opts] of [
 ['PC Chrome',chromium,{viewport:{width:1200,height:900}}],
 ['iPhone Safari WebKit',webkit,{viewport:{width:390,height:844},isMobile:true,hasTouch:true}]
]){
 const browser=await type.launch({headless:true});
 const context=await browser.newContext(opts);
 const page=await context.newPage();
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto(base,{waitUntil:'networkidle'});
 await page.locator('#search').click();
 assert.match(await page.locator('#sourceStatus').textContent(),/교수자 이메일 로그인이 필요/);
 assert.equal(await page.locator('#results').isHidden(),true);
 await page.evaluate(()=>sessionStorage.setItem('jobfit:instructor:supabase-session',JSON.stringify({
  accessToken:'test.fake.jwt',expiresAt:Date.now()+600000
 })));
 const payload={
  ok:true,kind:'bsi',source:{title:'제조업 경기실사지수동향',provider:'산업통상부',
   url:'https://www.data.go.kr/data/3039933/fileData.do',baseDate:'2026-06-30',
   license:'원문 표시',tableField:'economy'},
  result:{matched:22,shown:2,rows:[
   {title:'제조업전체',actualLabel:'2026년-2분기 현황',actual:'90',
    forecastLabel:'2026년-3분기 전망',forecast:'97'},
   {title:'전자업',actualLabel:'2026년-2분기 현황',actual:'85',
    forecastLabel:'2026년-3분기 전망',forecast:'89'}
  ]},
  received:{bytes:5056,at:'2026-11-08T07:00:00Z'},queriedAt:'2026-11-08T07:00:00Z'
 };
 let requests=0;
 await page.route('**/functions/v1/industry-public-pilot',async route=>{
  requests++;
  const req=route.request();
  assert.equal(req.postDataJSON().kind,'bsi');
  assert.match(req.headers().authorization||'',/^Bearer test\.fake\.jwt/);
  await route.fulfill({status:200,contentType:'application/json',body:JSON.stringify(payload)});
 });
 await page.locator('#search').click();
 await page.locator('#results').waitFor({state:'visible'});
 assert.equal(requests,1);
 assert.equal(await page.locator('#rows tr').count(),2);
 assert.match(await page.locator('#sourceStatus').textContent(),/수신 성공/);
 await page.locator('#rows tr').first().getByText('빈칸에 반영').click();
 assert.match(await page.locator('#economy').inputValue(),/2026년-2분기 현황: 90/);
 assert.match(await page.locator('#economy').inputValue(),/원문/);
 await page.locator('#rows tr').last().getByText('빈칸에 반영').click();
 assert.match(await page.locator('#pestStatus').textContent(),/덮어쓰지 않았/);
 assert.doesNotMatch(await page.locator('#economy').inputValue(),/전자업/);
 assert.equal(await page.locator('#policy').inputValue(),'');
 assert.equal(await page.locator('#technology').inputValue(),'');
 assert.equal(await page.evaluate(()=>Object.keys(localStorage).some(k=>k.includes('jobfit'))),false,
  'No student or teacher record persisted');
 assert.deepEqual(errors,[]);
 await browser.close();
 console.log(name+': CSV mock, PEST blank-only editing, and storage separation PASS');
}
