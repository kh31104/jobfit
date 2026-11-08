import assert from 'node:assert/strict';
import {chromium} from 'playwright';

const port=Number(process.env.PORT||8765);
const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
const mockOrigin='https://hllnoriffbhzpyhpnvsf.supabase.co';
let requests=0;
async function smoke(viewport){
  const context=await browser.newContext({viewport});
  const page=await context.newPage();
  const errors=[],failed=[];
  page.on('requestfailed',r=>failed.push({method:r.method(),url:r.url().slice(0,180),reason:r.failure()?.errorText}));
  page.on('pageerror',e=>errors.push(e.message));
  await page.goto('http://127.0.0.1:'+port+'/v2/tests/fixtures/institution-panel.html',{waitUntil:'networkidle'});
  await page.locator('#jf7-company').fill('삼성전자');
  assert.equal(await page.locator('#jf7DartField').isVisible(),true);
  assert.equal(await page.locator('#jf7IndicatorField').isVisible(),false);
  await page.locator('#jf7-company').fill('한국가스공사');
  assert.equal(await page.locator('#jf7IndicatorField').isVisible(),false);
  assert.equal(await page.getByRole('link',{name:'JOB-ALIO 공식 채용공고'}).count(),1);
  await page.locator('#jf7-company').fill('인제대학교');
  assert.equal(await page.locator('#jf7IndicatorField').isVisible(),true);
  assert.equal(await page.locator('#jf7DartField').isVisible(),false);
  await page.getByRole('button',{name:'공식자료 조회'}).click();
  assert.match(await page.locator('#jf7OrgStatus').innerText(),/교수자 로그인 전용/);

  await page.evaluate(()=>{
    sessionStorage.setItem('jobfit:instructor:supabase-session',JSON.stringify({
      accessToken:'test.header.signature',refreshToken:'',expiresAt:Date.now()+60_000
    }));
  });
  await page.route(mockOrigin+'/functions/v1/*',async route=>{
    requests++;
    if(route.request().method()==='OPTIONS'){
      return route.fulfill({status:204,headers:{
        'access-control-allow-origin':'*','access-control-allow-methods':'GET,POST,OPTIONS',
        'access-control-allow-headers':'authorization,apikey,content-type'
      }});
    }
    const url=new URL(route.request().url());
    const schoolId=url.searchParams.get('schoolId');
    if(!schoolId){
      return route.fulfill({status:422,headers:{'access-control-allow-origin':'*'},
        contentType:'application/json',body:JSON.stringify({error:'school_code_ambiguous',candidates:[
          {name:'인제대학교',schoolId:'0000149',campus:'본교'},
          {name:'인제대학교',schoolId:'0000150',campus:'분교'}
        ]})});
    }
    if(schoolId==='0000150'){
      return route.fulfill({status:200,headers:{'access-control-allow-origin':'*'},
        contentType:'application/json',body:JSON.stringify({
          ok:true,school:'인제대학교',year:2025,kind:'ensure',
          rows:[{schlId:'0000150',schlKrnNm:'인제대학교',fullTimeFacultyEnsureRate:'85.0'}]
        })});
    }
    return route.fulfill({status:422,contentType:'application/json',body:'{"error":"school_code_mismatch"}'});
  });
  await page.getByRole('button',{name:'공식자료 조회'}).click();
  const choiceCount=await page.getByRole('button',{name:'이 대학 선택'}).count();
  if(choiceCount!==2)console.log('DEBUG',JSON.stringify({
    status:await page.locator('#jf7OrgStatus').innerText(),
    result:await page.locator('#jf7OfficialResults').innerText(),requests,failed,errors
  }));
  assert.equal(choiceCount,2);
  await page.getByRole('button',{name:'이 대학 선택'}).nth(1).click();
  assert.match(await page.locator('#jf7OfficialResults').innerText(),/85.0/);
  await page.getByRole('button',{name:'빈 분석표 칸에 반영'}).click();
  assert.match(await page.locator('#jf7OrgStatus').innerText(),/원문을 직접 대조/);
  assert.equal(await page.locator('#company-other').inputValue(),'');
  await page.locator('.jf7OfficialConfirm input[type=checkbox]').check();
  await page.getByRole('button',{name:'빈 분석표 칸에 반영'}).click();
  assert.match(await page.locator('#company-other').inputValue(),/85.0/);
  assert.match(await page.locator('#company-other').inputValue(),/\[S1\]/);
  assert.equal(await page.locator('#company-financePerformance').inputValue(),'기존 입력 재무분석');
  assert.equal(await page.locator('[data-kind=company][data-source=S2][data-source-key=title]').inputValue(),'기존 자료명');
  assert.equal(await page.locator('[data-kind=company][data-verified=S2]').isChecked(),true);
  const dim=await page.locator('#jf7InstitutionSources').boundingBox();
  assert(dim&&dim.x+dim.width<=viewport.width+5,JSON.stringify({viewport,dim}));
  assert.equal(errors.length,0,errors.join('\n'));
  await context.close();
}
try{
  await smoke({width:1380,height:950});
  await smoke({width:390,height:844});
  assert(requests>=4,'Expected official API mocks');
  console.log('PASS: desktop/mobile institution source panel, manual verification, existing data protection');
}finally{
  await browser.close();
}
