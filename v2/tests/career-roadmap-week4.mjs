import { chromium } from 'playwright';

const base=process.env.JOBFIT_TEST_URL||'http://127.0.0.1:8765/v2/';
const browser=await chromium.launch({headless:true});
let failed=false;
const seed={
  assessments:{
    careerDNA:{
      standard:{version:'career-dna-standard-set-v1'},
      comparison:{repeat:'학습과 신중함이 반복된다.',connect:'전문성과 학구열이 연결된다.',unexpected:'인간친화지능은 예상과 달랐다.',verify:'협업에서도 같은 강점이 반복되는지 확인하고 싶다.'},
      reflection:{fit:'학습과 신중함이 반복된다.',question:'협업에서도 같은 강점이 반복되는지 확인하고 싶다.',disagree:'인간친화지능은 예상과 달랐다.'},
      hypothesis:{text:'전문성을 깊게 쌓고 신중하게 판단하는 경향이 있을 가능성이 있다.',selfCheck:'어느 정도 맞음',version:'career-dna-hypothesis-v1'}
    },
    experienceCompetency:{experiences:[{id:'EXP-OLD',category:'수업·과제',title:'기존 경험',action:'자료를 비교했다',result:'발표안을 완성했다',evidence:'발표자료',evidenceGrade:'B · 타인의 피드백/평가로 확인',competencies:['분석'],competencyEvidence:[{keyword:'분석',evidence:'자료를 비교했다'}],factChecked:true}]}
  },
  artifacts:{experienceMap:[{id:'EXP-OLD',title:'기존 경험'}]}
};

function assert(x,m){if(!x)throw new Error(m)}
async function run(name,fn){
  const ctx=await browser.newContext({viewport:{width:1280,height:1100}});const page=await ctx.newPage();const errors=[];
  page.on('pageerror',e=>errors.push(`pageerror: ${e.message}`));page.on('console',m=>{if(m.type()==='error')errors.push(`console: ${m.text()}`)});page.on('dialog',d=>d.accept());
  try{
    await page.goto(`${base}?course=INJE2026`,{waitUntil:'networkidle'});
    await page.evaluate(s=>localStorage.setItem('jobfit:v2:learner',JSON.stringify(s)),seed);
    await page.reload({waitUntil:'networkidle'});
    await page.locator('.stepBtn[data-step="2"]').click();await page.waitForSelector('#saveRoadmap');
    await fn(page);if(errors.length)throw new Error(errors.join('\n'));console.log(`PASS ${name}`)
  }catch(e){failed=true;console.error(`FAIL ${name}\n${e.stack||e}`)}finally{await ctx.close()}
}

await run('Week 4 renders Career Roadmap modules and STEP1 bridge',async page=>{
  const body=(await page.locator('#stepRoot').textContent())||'';
  for(const text of ['Career Roadmap','지난주 Career DNA 다시보기','Career DNA 경험검증 인터뷰','My Best 3 Experience','대표 경험 Evidence Interview','Career Story','Career Theme','Career Direction','1개월 Career Experiment'])assert(body.includes(text),`Missing module: ${text}`);
  assert(body.includes('학습과 신중함이 반복된다.'),'STEP1 comparison bridge missing');
  assert(body.includes('전문성을 깊게 쌓고 신중하게 판단'),'STEP1 hypothesis bridge missing');
  assert(body.includes('기존 경험'),'Existing experience list must be preserved');
});

await run('DNA validation prompt uses reviewed hypothesis and asks one question at a time',async page=>{
  await page.locator('#makeDnaInterviewPrompt').click();const prompt=(await page.locator('#dnaInterviewPrompt').textContent())||'';
  assert(prompt.includes('전문성을 깊게 쌓고 신중하게 판단'),'Reviewed Career DNA hypothesis missing');
  assert(prompt.includes('한 번에 질문 하나만 한다'),'One-question rule missing');
  assert(prompt.includes('반대 사례'),'Counterexample rule missing');
  assert(prompt.includes('직업을 추천하지 않는다'),'No-job-recommendation guard missing');
  assert(prompt.includes('경험으로 확인됨'),'Validation output categories missing');
});

await run('Best3 representative feeds Evidence Interview and saves legacy experience contract',async page=>{
  await page.locator('#best3_best_title').fill('캡스톤 프로젝트');await page.locator('#best3_best_summary').fill('센서 오류 원인을 비교하고 팀과 수정했다.');
  await page.locator('input[name="representative"][value="best"]').check();await page.locator('#useRepresentative').click();
  assert(await page.locator('#title').inputValue()==='캡스톤 프로젝트','Representative title not copied');
  assert((await page.locator('#context').inputValue()).includes('센서 오류'),'Representative summary not copied');
  await page.locator('#category').selectOption({label:'캡스톤·연구'});await page.locator('#workMode').selectOption({label:'팀'});await page.locator('#roleTitle').fill('자료분석');await page.locator('#action').fill('원인 후보를 비교했다.');await page.locator('#result').fill('오류 범위를 좁혔다.');await page.locator('#evidence').fill('실험 기록');await page.locator('#ownershipChecked').check();await page.locator('#noFabrication').check();await page.locator('#saveExp').click();
  await page.waitForSelector('#saveRoadmap');
  const saved=await page.evaluate(()=>JSON.parse(localStorage.getItem('jobfit:v2:learner')));
  assert(saved.assessments.experienceCompetency.experiences.some(x=>x.title==='캡스톤 프로젝트'),'New experience not saved');
  assert(saved.assessments.experienceCompetency.experiences.some(x=>x.id==='EXP-OLD'),'Existing experience was overwritten');
  assert(Array.isArray(saved.artifacts.experienceMap)&&saved.artifacts.experienceMap.length>=2,'experienceMap contract broken');
});

await run('Career Roadmap v0 saves additive roadmap artifact without changing Career DNA',async page=>{
  await page.locator('#dnaConfirmed').fill('새로운 내용을 스스로 배우고 비교하는 행동이 실제 경험에서 확인되었다.');
  await page.locator('#dnaPartial').fill('협업은 상황에 따라 달랐다.');
  await page.locator('#best3_flow_title').fill('강의자료 만들기');await page.locator('#best3_flow_summary').fill('시간 가는 줄 모르고 자료를 정리했다.');await page.locator('input[name="representative"][value="flow"]').check();
  const storyChecks=page.locator('[data-story-select]');for(let i=0;i<3;i++)await storyChecks.nth(i).check();await page.locator('#story_roleModel').fill('배우고 나누는 사람');await page.locator('#story_content').fill('교육과 AI 콘텐츠');await page.locator('#story_story').fill('성장 서사가 있는 이야기');
  await page.locator('#themeLike').fill('배우고 설명하기');await page.locator('#themeValue').fill('전문성, 자율성');await page.locator('#themeWork').fill('사람의 선택을 돕는 일');await page.locator('#careerTheme').fill('배우고 정리한 내용을 사람의 선택에 도움이 되도록 설명하는 일');
  await page.locator('#direction_0').fill('사람의 학습과 진로 선택을 돕는 방향');await page.locator('#direction_1').fill('정보를 분석하고 구조화해 설명하는 방향');
  await page.locator('#gapHave').fill('학습, 설명 경험');await page.locator('#gapVerify').fill('실제 직무의 Task와 KSA');await page.locator('#experimentAction').fill('관심 직무 채용공고 5개 분석하기');await page.locator('#experimentDeadline').fill('10월 15일까지');await page.locator('#experimentEvidence').fill('공고 분석표 1개');
  await page.locator('#saveRoadmap').click();
  const saved=await page.evaluate(()=>JSON.parse(localStorage.getItem('jobfit:v2:learner')));
  const r=saved.assessments.careerRoadmap,a=saved.artifacts.careerRoadmap;
  assert(r.version==='career-roadmap-week4-v1','Roadmap version missing');assert(r.careerStory.selected.length===3,'Career Story selection not saved');assert(r.theme.statement.includes('사람의 선택'),'Career Theme not saved');assert(r.directions.length===2,'Direction hypotheses not saved');assert(r.experiment.action.includes('채용공고 5개'),'Career Experiment not saved');assert(a.version==='career-roadmap-artifact-v0','Roadmap artifact missing');assert(saved.assessments.careerDNA.hypothesis.version==='career-dna-hypothesis-v1','Career DNA was changed');
});

await run('Theme and direction prompts stay hypothesis-based',async page=>{
  await page.locator('#dnaConfirmed').fill('학습 행동이 경험에서 확인되었다.');await page.locator('#themeLike').fill('배우고 설명하기');await page.locator('#themeValue').fill('전문성');await page.locator('#themeWork').fill('사람의 선택을 돕는 일');
  await page.locator('#makeThemePrompt').click();const theme=(await page.locator('#themePrompt').textContent())||'';assert(theme.includes('특정 직업명이나 기업명을 넣지 않는다'),'Theme prompt job guard missing');assert(theme.includes('문장 후보 3개'),'Theme candidates rule missing');
  await page.locator('#careerTheme').fill('배우고 정리한 내용을 사람에게 설명하는 일');await page.locator('#makeDirectionPrompt').click();const direction=(await page.locator('#directionPrompt').textContent())||'';assert(direction.includes('확정하는 추천자가 아니라'),'Direction hypothesis framing missing');assert(direction.includes('직업을 나와 잘 맞는다고 확정하거나 추천하지 않는다'),'Direction no-fit guard missing');assert(direction.includes('실제 직무정보·채용공고'),'Next-step validation missing');
});

await browser.close();if(failed)process.exit(1);
