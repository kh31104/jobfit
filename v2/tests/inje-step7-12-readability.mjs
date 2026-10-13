import {chromium} from 'playwright';

const base=process.env.JOBFIT_TEST_URL||'http://127.0.0.1:8765/v2/';
const browser=await chromium.launch({headless:true});
const key='jobfit:v2:learner';
const assert=(condition,message)=>{if(!condition)throw new Error(message)};
const seed={
  version:2.2,activeStep:6,mode:'full',
  profile:{anonCode:'JF26-READABLE',courseCode:'INJE2026',major:'경영학과'},
  research:{consent:false,measurements:{pre:{},post:{}}},
  assessments:{
    careerDNA:{hypothesis:{text:'자료 분석을 선호한다.'}},
    experienceCompetency:{experiences:[{id:'exp1',title:'소비자 조사',action:'리뷰를 기준별로 분류했다.',result:'조사표를 완성했다.',evidence:'분석자료',competencies:['분석'],factChecked:true,rawVoice:'리뷰를 직접 살펴보고 기준을 정했다.'}]}
  },
  artifacts:{
    jobExplorer:{candidates:[{id:'job1',title:'브랜드 마케팅',family:'마케팅'}],targets:['job1'],targetCombos:[{id:'target-job1',jobId:'job1',industry:'유통·패션',priority:1}]},
    industryCompany:{
      industries:[
        {id:'ind1',name:'유통·패션',jobId:'job1',sourceType:'공시·통계',checkedAt:'2026-10-13',business:'소비자 판매 / 온라인 유통',change:'온라인 접점 확대 / 고객 분석',jobLink:'브랜드 캠페인 운영 / 고객 반응 확인',difference:'고객 반응을 빠르게 반영',source:'기업 공식 공고',url:'https://example.org/industry1'},
        {id:'ind2',name:'IT·플랫폼',jobId:'job1',sourceType:'기업 IR·사업보고서',checkedAt:'2026-10-13',business:'플랫폼 / 고객',change:'채널 운영 / 데이터 활용',jobLink:'캠페인 기획 / 분석',difference:'디지털 채널 업무',source:'기업자료',url:'https://example.org/industry2'}
      ],
      targetIndustries:['ind1','ind2'],
      companies:[{id:'co1',name:'무신사',type:'대기업',industryId:'ind1',jobId:'job1',business:'패션 유통 / 온라인 고객',direction:'고객 경험 개선 / 프로모션 운영',role:'브랜드 캠페인 지원 / SNS 운영',signals:'일정관리 / 협업 / Excel',unknown:'실제 근무환경',source:'공식 채용공고',url:'https://example.org/corporate',jobUrl:'https://example.org/job',hiringEvidence:'최근 채용공고 확인'}],
      targetCompanies:['co1'],notes:'관찰 기록'
    },
    jdAnalyzer:{postings:[{id:'jd1',company:'무신사',jobTitle:'브랜드 마케팅',rawPosting:'캠페인 운영',requirements:[],gates:[],gateReviewed:true}],selectedId:'jd1'},
    careerAssets:{assets:[{id:'asset1',experienceId:'exp1',experienceTitle:'소비자 조사',evidenceLevel:'A · 직접 증거',factCheck:'검증완료',sourceExperienceFactChecked:true,proof:'고객 리뷰 120건을 분류했다.',fact:'분류 기준표',requirement:'고객 데이터 분석',requirementId:'r1'}]},
    resumeLab:{items:[{id:'res1',assetId:'asset1',assetTitle:'소비자 조사',section:'경험',evidenceLevel:'A · 직접 증거',requirement:'고객 데이터 분석',rawBullet:'리뷰 분석',finalBullet:'고객 리뷰를 소재와 가격대로 분류 / 분석표 작성',detailText:'기준을 직접 정했다 / 분류 결과를 정리했다',factChecked:true,assetVerified:true,status:'final-ready'}],summary:'데이터 분석 경험 보유',skills:'Excel / PowerPoint',notes:'준비 메모'},
    coverLetterLab:{questions:[{id:'cover1',question:'브랜드 마케팅 지원동기는?',intent:'지원직무 이해',requirement:'고객 분석',claim:'고객 반응을 분석한 경험',assetIds:['asset1'],draft:'고객 리뷰를 기준별로 분류했다.\n그 결과를 팀원에게 공유했다.',factChecked:true,assetVerified:true,requirementAligned:true,status:'final-ready'}]},
    interviewLab:{questions:[{id:'inter1',question:'리뷰를 어떻게 분석했나요?',sourceType:'자소서 주장',category:'직무',assetId:'asset1',answerOutline:'기준 설정 / 분류 / 검토',followUps:'기준은 왜 정했나요? / 오류는 없었나요?',practice:'질문에 답변함 / 구체성 보완',improve:'근거 먼저 설명 / 예시 추가',factCheck:'검증완료',evidenceVerified:true,status:'ready'}],practiceNotes:'면접 연습 기록'},
    humanFirst:{items:[{id:'human1',question:'브랜드 마케팅 지원동기는?',finalText:'고객 리뷰를 직접 분류했습니다.\n분류 기준을 바탕으로 팀 회의를 진행했습니다.',factChecked:true,coverReady:true,assetsVerified:true,status:'final-ready'}],consistency:{resumeCover:true,coverInterview:true,factLock:true},notes:'사실확인 완료'},
    jobPortfolio:{positioning:'고객 리뷰를 정리한 브랜드 마케팅 지원자',gap:'광고 성과 측정 경험 / 업계 이해',plan30:'공식 공고 분석 / 캠페인 사례 정리',plan90:'캠페인 보고서 작성 / 발표 연습',status:'draft',finalChecks:{gate:true,jd:true,facts:true,consistency:true,ready:false}}
  },
  meta:{createdAt:'2026-10-13T00:00:00.000Z',updatedAt:'2026-10-13T00:00:00.000Z'}
};
const artifactKeys=['industryCompany','resumeLab','coverLetterLab','interviewLab','humanFirst','jobPortfolio'];
const screens=[
  {step:6,selector:'#industryCompare .jfReadCards',checks:[['#industryCompare .jfReadCard',2],['#companyCompare .jfReadCard',1],['#industryList .jfResultBox',2]]},
  {step:7,selector:'#resumeItems .jfResultBox',checks:[['#resumeItems .jfReadField',3]]},
  {step:8,selector:'#questionList .jfResultBox',checks:[['#questionList .jfReadField',5]]},
  {step:9,selector:'#questionList .jfResultBox',checks:[['#questionList .jfReadField',4]]},
  {step:10,selector:'#humanList .jfResultBox',checks:[['#humanList .jfReadField',1]]},
  {step:11,selector:'#portfolioPrint .portfolioDoc',checks:[['#portfolioPrint .portfolioSection',10],['#portfolioPrint .jfReadField',3]]}
];
let failed=false;
for(const width of [1280,390]){
  const context=await browser.newContext({viewport:{width,height:950}});
  const page=await context.newPage();const errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  try{
    await page.goto(base+'?course=INJE2026',{waitUntil:'networkidle'});
    await page.evaluate(({key,seed})=>localStorage.setItem(key,JSON.stringify(seed)),{key,seed});
    for(const screen of screens){
      await page.evaluate(({key,step})=>{const state=JSON.parse(localStorage.getItem(key));state.activeStep=step;localStorage.setItem(key,JSON.stringify(state));},{key,step:screen.step});
      await page.reload({waitUntil:'networkidle'});
      await page.waitForSelector(screen.selector,{timeout:15000});
      for(const [selector,n] of screen.checks){
        const count=await page.locator(selector).count();
        assert(count>=n,'STEP '+(screen.step+1)+' / '+width+'px '+selector+' expected '+n+', found '+count);
      }
      if(screen.step===6){
        const columns=await page.locator('#industryCompare .jfReadCards').evaluate(el=>getComputedStyle(el).gridTemplateColumns.split(' ').filter(Boolean).length);
        assert(width===390?columns===1:columns===2,'Industry comparison not responsive at '+width+'px');
      }
      if(screen.step===7)assert((await page.locator('#resumeItems').textContent()).includes('분류 결과를 정리했다'),'Existing Resume evidence disappeared');
      if(screen.step===8)assert((await page.locator('#questionList').textContent()).includes('그 결과를 팀원에게 공유했다'),'Cover Letter original draft disappeared');
      if(screen.step===10)assert((await page.locator('#humanList').textContent()).includes('팀 회의를 진행했습니다'),'Human-First full answer disappeared');
      const current=await page.evaluate(({key,keys})=>{const stored=JSON.parse(localStorage.getItem(key));return Object.fromEntries(keys.map(k=>[k,stored.artifacts[k]]));},{key,keys:artifactKeys});
      for(const k of artifactKeys)assert(JSON.stringify(current[k])===JSON.stringify(seed.artifacts[k]),'Browsing STEP '+(screen.step+1)+' modified saved '+k+' data');
    }
    assert(errors.length===0,'Browser errors: '+errors.join(' | '));
    console.log('PASS INJE STEP 7–12 saved-result readability and state preservation ('+width+'px)');
  }catch(err){failed=true;console.error('FAIL '+width+'px\n'+(err.stack||err));}
  finally{await context.close();}
}
await browser.close();
if(failed)process.exit(1);
