import { chromium } from 'playwright';

const base=process.env.JOBFIT_LIVE_URL||'https://kh31104.github.io/jobfit/?course=INJE2026';
const browser=await chromium.launch({headless:true});
let failed=false;

function assert(value,message){if(!value)throw new Error(message)}

async function run(name,viewport){
  const context=await browser.newContext({viewport});
  const page=await context.newPage();
  const errors=[];
  page.on('pageerror',e=>errors.push(`pageerror: ${e.message}`));
  page.on('console',m=>{if(m.type()==='error')errors.push(`console: ${m.text()}`)});
  try{
    await page.goto(base,{waitUntil:'networkidle',timeout:60000});
    assert(new URL(page.url()).searchParams.get('course')==='INJE2026','course=INJE2026 was not preserved');
    assert(await page.locator('.stepBtn').count()===14,'Student navigation must contain 14 steps');

    await page.locator('.stepBtn[data-step="1"]').click();
    await page.waitForSelector('#makePrompt');
    await page.waitForSelector('#careerDnaDeviceNotice');
    await page.waitForSelector('#careerDnaAiGuide');
    const body=(await page.locator('#stepRoot').textContent())||'';
    assert(body.includes('Career DNA'),'Career DNA heading missing');
    assert(body.includes('현재 완료한 자료만으로 Career DNA 인터뷰를 시작'),'Partial-completion guidance missing');
    assert(body.includes('STEP 3 직무 후보를 자동 생성하거나 우선순위를 매기는 데 사용하지 않습니다.'),'Work24 suggested-job guard missing');
    assert(body.includes('성인용 직업가치관검사'),'Work value section missing');
    assert(body.includes('추후 추가 가능'),'Work value optional guidance missing');
    assert(body.includes('VIA 강점 TOP5'),'VIA section missing');
    assert(body.includes('교육용 · 선택'),'VIA optional guidance missing');
    assert(body.includes('S형은 PC·모바일, L형은 PC에서 지원됩니다.'),'Work24 device guidance missing');
    assert(body.includes('프롬프트 만들기 → ② 프롬프트 복사'),'AI handoff steps missing');
    assert(body.includes('AI로 자동 전송되지는 않습니다.'),'AI data-transfer clarification missing');
    assert((await page.locator('#makePrompt').textContent()).includes('인터뷰 프롬프트 만들기'),'Prompt button label is misleading');

    if(viewport.width<=480){
      const overflow=await page.evaluate(()=>document.documentElement.scrollWidth-window.innerWidth);
      assert(overflow<=2,`Mobile horizontal overflow detected: ${overflow}px`);
    }

    const scores={R:44,I:63,A:49,S:57,E:46,C:55};
    for(const [code,score] of Object.entries(scores))await page.locator(`#std_${code}`).fill(String(score));
    await page.locator('#via_0').fill('학구열');
    await page.locator('#via_1').fill('신중성');
    await page.locator('#fit').fill('자료를 비교하고 근거를 확인하는 과제에서 집중이 잘 됐다.');
    await page.locator('#question').fill('사회형 점수가 실제보다 높게 느껴진다.');
    await page.locator('#makePrompt').click();

    const prompt=(await page.locator('#promptBox').textContent())||'';
    assert(prompt.includes('[직업흥미 · RIASEC]'),'RIASEC module missing from live prompt');
    assert(prompt.includes('[VIA 강점 · 교육용 참고자료]'),'VIA module missing from live prompt');
    assert(!prompt.includes('[직업가치]'),'Unentered work values must not appear in live prompt');
    assert(!prompt.includes('[성격 5요인 · L형]'),'Default S-type flow must not add Big5 module');
    assert(prompt.includes('질문은 한 번에 반드시 하나만 한다.'),'One-question interview rule missing');
    assert(prompt.includes('첫 응답에서는 최종 해석이나 직업추천을 제시하지 말고'),'First-response job-recommendation guard missing');
    assert(!/\bNaN\b|\bnull\b|undefined/.test(prompt),'Prompt contains invalid placeholder values');

    const saved=await page.evaluate(()=>JSON.parse(localStorage.getItem('jobfit:v2:learner')));
    assert(saved?.assessments?.careerDNA?.promptMeta?.version==='career-dna-dynamic-v1','Career DNA prompt version not persisted');

    await page.locator('#nextStep').click();
    await page.waitForSelector('#stepRoot h2');
    const heading=(await page.locator('#stepRoot h2').textContent())||'';
    assert(heading.includes('Experience & Competency'),'STEP 2 did not load from live Career DNA');

    if(errors.length)throw new Error(errors.join('\n'));
    console.log(`PASS ${name}`);
  }catch(error){
    failed=true;
    console.error(`FAIL ${name}\n${error.stack||error}`);
  }finally{
    await context.close();
  }
}

await run('live production desktop Career DNA',{width:1280,height:1000});
await run('live production mobile Career DNA',{width:390,height:844});

await browser.close();
if(failed)process.exit(1);
