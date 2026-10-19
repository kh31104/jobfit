import {chromium} from 'playwright';
import {parseGapBullet} from '../steps/step4.js';

const assert=(condition,message)=>{if(!condition)throw new Error(message)};
const base=process.env.JOBFIT_TEST_URL||'http://127.0.0.1:8765/v2/';
const sample=[
  '**[내가 가진 것]**','• 리뷰 데이터 분류 경험',
  '**[확인 필요]**','• 실제 성과지표 확인',
  '**[핵심 GAP]**','• GAP 1: 캠페인 운영 경험',
  '**[3개월 행동]**','• 캠페인 운영일지 작성'
].join('\n');
const numbered=[
  '① 내가 가진 것','• 리뷰 데이터 분류 경험',
  '② 확인 필요','• 실제 성과지표 확인',
  '③ 핵심 GAP (최대 3개)','• GAP 1: 캠페인 운영 경험',
  '④ 3개월 행동','• 캠페인 운영일지 작성'
].join('\n');
for(const text of [sample,numbered]){
  const parsed=parseGapBullet(text);
  assert(parsed.have.includes('리뷰 데이터'),'AI formatting must preserve have');
  assert(parsed.verify.includes('성과지표'),'AI formatting must preserve verify');
  assert(parsed.gaps[0]==='캠페인 운영 경험','AI formatting must preserve actual GAP');
  assert(parsed.actions[0]==='캠페인 운영일지 작성','AI formatting must preserve action');
}
assert(!parseGapBullet('제목 없이 임의의 결과').gaps.length,'Unrecognized format must not invent content');

const baseState={
  version:2.2,mode:'full',activeStep:4,
  profile:{anonCode:'JF26-GAPMOBILE',courseCode:'INJE2026',major:'경영학과'},
  research:{consent:false,measurements:{pre:{},post:{}}},
  assessments:{careerDNA:{},experienceCompetency:{experiences:[{id:'exp1',title:'브랜드 프로젝트',action:'고객 리뷰를 분류함',evidence:'분석시트',factChecked:true}]}},
  artifacts:{
    jobExplorer:{candidates:[{id:'j1',title:'브랜드 마케팅',family:'마케팅'}],targetCombos:[{id:'target-j1',jobId:'j1',industry:'유통·패션',priority:1}]},
    jobDeepDive:{targetAnalyses:{'target-j1':{
      sources:[{id:'jd1',slot:0,name:'Brand Marketing Assistant',companyName:'가상패션사',url:'https://example.com/jd',checkedAt:'2026-10-19'}],
      selectedSourceId:'jd1',
      jobTable:{customerKpi:'고객 반응',tasks:'리뷰 조사',challenge:'반응 검토',method:'시트 비교',competencies:'데이터 조사'},
      studentSpec:{certificates:'없음',language:'없음',tools:'Excel'},
      requirements:[{id:'original1',name:'고객 분석',status:'근거 있음',evidence:'리뷰 자료 분류',gap:''}]
    }}}
  },meta:{createdAt:'2026-10-19T00:00:00.000Z',updatedAt:'2026-10-19T00:00:00.000Z'}
};
const browser=await chromium.launch({headless:true});
let failure=false;
for(const width of [390,320,1280]){
  const ctx=await browser.newContext({viewport:{width,height:900}});
  const page=await ctx.newPage(),errors=[];
  page.on('pageerror',err=>errors.push(err.message));
  try{
    await page.goto(base+'?course=INJE2026&measures=false',{waitUntil:'networkidle'});
    const state=structuredClone(baseState);
    // Demonstrate that a partial My Spec does not discard an already-provided GAP result.
    if(width===320)state.artifacts.jobDeepDive.targetAnalyses['target-j1'].studentSpec.language='';
    await page.evaluate(s=>localStorage.setItem('jobfit:v2:learner',JSON.stringify(s)),state);
    await page.reload({waitUntil:'networkidle'});
    await page.waitForSelector('#deepAiImport');
    assert(await page.locator('#importDeepAi').isEnabled(),'GAP import should be tappable');
    const raw=width===390?numbered:sample;
    await page.locator('#deepAiImport').fill(raw);
    // Simulate a mobile OS discarding and reloading the page before Apply.
    await page.reload({waitUntil:'networkidle'});
    await page.waitForSelector('#deepAiImport');
    assert(await page.locator('#deepAiImport').inputValue()===raw,'pasted mobile draft lost on reload');
    // Save directly, without separately tapping Apply.
    await page.locator('#saveDeep').click();
    let saved=await page.evaluate(()=>JSON.parse(localStorage.getItem('jobfit:v2:learner')));
    const a=saved.artifacts.jobDeepDive.targetAnalyses['target-j1'];
    assert(a.gapAiDraft===raw,'raw AI draft must remain unchanged');
    assert(a.have.includes('리뷰 데이터 분류 경험'),'Direct save did not import have');
    assert(a.requirements.some(r=>r.gap==='캠페인 운영 경험'),'Direct save did not import GAP');
    assert(a.requirements.some(r=>r.id==='original1'&&r.evidence==='리뷰 자료 분류'),'Existing evidence was overwritten');
    assert(a.prepare.includes('캠페인 운영일지 작성'),'Direct save did not import action');
    assert(a.jobTable.tasks==='리뷰 조사','Job analysis text changed unexpectedly');
    await page.locator('#nextStep').click();
    await page.waitForSelector('#jobfitReportPrint',{timeout:12000});
    const result=await page.locator('#jobfitReportPrint').textContent();
    assert(result.includes('캠페인 운영 경험')&&result.includes('캠페인 운영일지 작성'),'Saved GAP missing from STEP 6');
    assert(!errors.length,'Browser error: '+errors.join(' | '));
    console.log('PASS mobile GAP save/report '+width+'px (paste -> reload -> Save -> report; source data retained)');
  }catch(err){failure=true;console.error('FAIL '+width+'px: '+(err.stack||err))}
  finally{await ctx.close()}
}
await browser.close();
if(failure)process.exit(1);
