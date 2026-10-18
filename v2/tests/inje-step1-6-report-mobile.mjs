import {chromium} from 'playwright';

const base=process.env.JOBFIT_TEST_URL||'http://127.0.0.1:8765/v2/';
const key='jobfit:v2:learner';
const assert=(ok,message)=>{if(!ok)throw new Error(message)};
const seed={
  version:2.2,activeStep:5,mode:'full',
  profile:{anonCode:'JF26-READTEST',courseCode:'INJE2026',major:'경영학과'},
  research:{consent:false,measurements:{pre:{},post:{}}},
  assessments:{careerDNA:{hypothesis:{text:'소비자 반응 분석에 관심이 있다.'}},
    experienceCompetency:{experiences:[{id:'exp1',title:'브랜드 자료 조사',action:'고객 리뷰를 분류했다.',evidence:'분석 시트',factChecked:true}]}},
  artifacts:{
    jobExplorer:{
      candidates:[{id:'j1',title:'브랜드 마케팅',family:'마케팅'}],
      targetCombos:[{id:'target-j1',jobId:'j1',industry:'유통·패션',priority:1}]
    },
    jobDeepDive:{targetAnalyses:{'target-j1':{
      sources:[{id:'jd1',name:'Brand Marketing Assistant',companyName:'무신사',checkedAt:'2026-10-18'}],
      selectedSourceId:'jd1',jobTitle:'브랜드 마케팅',
      jobTable:{
        customerKpi:'고객: 이용자와 잠재 고객 / 성과: 캠페인 관심과 참여 / 구체적 KPI는 공고에서 확인되지 않음',
        tasks:'캠페인 운영: 행사 홍보 / SNS·채널 관리: 채널 운영 / 이벤트 운영: 현장 지원 / 협업·일정 관리: 업무 조율 / 시장조사: 고객 반응 정리',
        challenge:'고객 관심 확인 / 행사 운영 문제 확인',
        method:'SNS 조사 / PPT 자료 정리',
        competencies:'시장 이해: 패션 트렌드 분석 / 협업: 일정 공유 / 자료 작성: Excel 활용'
      },
      requirements:[{name:'브랜드 캠페인 이해',evidence:'고객 리뷰를 분석함.',status:'일부 근거 있음'}]
    }}}
  },
  meta:{createdAt:'2026-10-18T00:00:00.000Z',updatedAt:'2026-10-18T00:00:00.000Z'}
};
const browser=await chromium.launch({headless:true});
let failed=false;
for(const width of [1280,390,320]){
  const context=await browser.newContext({viewport:{width,height:900}});
  const page=await context.newPage();
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  try{
    await page.goto(base+'?course=INJE2026&measures=false',{waitUntil:'networkidle'});
    await page.evaluate(({key,seed})=>localStorage.setItem(key,JSON.stringify(seed)),{key,seed});
    await page.reload({waitUntil:'networkidle'});
    await page.waitForSelector('#jobfitReportPrint .jobAnalysisReport .tr',{timeout:15000});
    const rows=page.locator('#jobfitReportPrint .jobAnalysisReport .tr');
    assert(await rows.count()===5,'직무분석 5개 항목 중 누락 발생 ('+width+'px)');
    assert(await rows.nth(1).locator('.analysisDetailList li').count()===5,'주요 과업 5개가 개조식으로 표시되지 않음');
    assert(await rows.first().locator('.analysisDetailList li').count()===3,'고객·성과·KPI를 개별 항목으로 구분하지 못함');
    const taskText=await rows.nth(1).textContent();
    assert(taskText.includes('SNS·채널 관리')&&taskText.includes('시장조사: 고객 반응 정리'),'직무분석 원문 일부 누락');
    const info=await rows.first().evaluate(el=>{
      const cols=getComputedStyle(el).gridTemplateColumns.split(' ').filter(Boolean).length;
      const table=el.closest('.jobAnalysisReport').getBoundingClientRect();
      const page=el.closest('.reportPage').getBoundingClientRect();
      return {cols,viewport:innerWidth,tableRight:table.right,pageRight:page.right};
    });
    assert(info.cols===(width>700?2:1),'직무분석표 모바일 열 배치 오류: '+JSON.stringify(info));
    assert(info.tableRight<=info.viewport+2&&info.pageRight<=info.viewport+2,'보고서 가로 넘침: '+JSON.stringify(info));
    if(width<=390){
      assert(await page.locator('.evidenceReportTable .tr.th').isHidden(),'모바일 직무근거표 헤더가 접히지 않음');
      assert(await page.locator('.evidenceReportTable [data-label="확인된 나의 근거"]').count()===1,'모바일 직무근거 안내 라벨 누락');
    }
    const current=await page.evaluate(key=>JSON.parse(localStorage.getItem(key)),key);
    assert(JSON.stringify(current.artifacts.jobDeepDive)===JSON.stringify(seed.artifacts.jobDeepDive),'직무분석 원문 저장 데이터가 변경됨');
    assert(JSON.stringify(current.artifacts.jobExplorer)===JSON.stringify(seed.artifacts.jobExplorer),'선택 직무 저장 데이터가 변경됨');
    assert(errors.length===0,'JavaScript 오류: '+errors.join(' | '));
    console.log('PASS INJE STEP 1–6 report readability ('+width+'px): 5 rows, text retained, responsive columns, saved data retained');
  }catch(err){failed=true;console.error('FAIL '+width+'px\n'+(err.stack||err));}
  finally{await context.close();}
}
await browser.close();
if(failed)process.exit(1);
