import assert from 'node:assert/strict';
import {chromium, devices, webkit} from 'playwright';

const base = process.env.JOBFIT_TEST_URL || 'http://127.0.0.1:8765/';
const storageKey = 'jobfit:v2:learner';
const original = '결론적으로, 인제대학교에서 12건을 확인하고 “원문 인용”을 보고서에 적었습니다.';
const corrected = original.replace('결론적으로, ', '');
const seed = {
  version: 2.2, activeStep: 10, mode: 'full',
  profile: {courseCode:'INJE2026', anonCode:'JF26-TESTKH'},
  artifacts: {
    coverLetterLab: {questions:[{id:'q1', question:'실제 경험을 설명하세요.', finalAnswer:original, rawAnswer:corrected, status:'final-ready', factChecked:true}]},
    humanFirst: {items:[{id:'hf1', coverId:'q1', question:'실제 경험을 설명하세요.', finalText:original, status:'final-ready'}], notes:'기존 면접 일관성 기록'},
    jobPortfolio: {positioning:'보존할 포트폴리오 소개', finalChecks:{facts:true}}
  }
};

const configurations = [
  ['Desktop Chromium', chromium, {viewport:{width:1280,height:900}}],
  ['Android Chromium', chromium, devices['Pixel 7']],
  ...(!process.env.JOBFIT_CHROMIUM_ONLY ? [['iPhone WebKit emulation', webkit, devices['iPhone 14']]] : [])
];

for (const [label, engine, options] of configurations) {
  const browser = await engine.launch();
  try {
    const page = await browser.newPage(options);
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.goto(base + '?course=INJE2026');
    await page.locator('.stepBtn').first().waitFor();
    await page.evaluate(([key, value]) => localStorage.setItem(key, JSON.stringify(value)), [storageKey, seed]);
    await page.reload();
    const field = page.locator('#finalAnswer');
    await field.waitFor({state:'attached'});
    assert.equal(await page.locator('.stepBtn.active').getAttribute('data-step'), '8');
    assert.equal(await page.locator('.stepBtn[data-step="10"]').count(), 0);
    assert.match(await page.locator('.stepBtn').last().textContent(), /STEP 11 · AI Job Portfolio/);
    assert.equal(await page.locator('#khWritingRun').isVisible(), false);

    await page.locator('[data-acc-expand]').click();
    await page.locator('#khWritingInspector > summary').click();
    await page.locator('#khWritingRun').click();
    assert.match(await page.locator('#khWritingStatus').textContent(), /먼저 입력/);

    await page.locator('#khLegacyEvidence > summary').click();
    await page.locator('#legacyEvidence-humanList').waitFor();
    assert.match(await page.locator('#legacyEvidence-humanList').textContent(), /원문 인용/);
    assert.equal(await page.locator('#legacyEvidence-notes').inputValue(), '기존 면접 일관성 기록');
    await page.locator('#khLegacyEvidence > summary').click();

    await page.locator('[data-cover-edit="q1"]').click();
    assert.equal(await field.inputValue(), original);
    const artifacts = () => page.evaluate(key => JSON.parse(localStorage.getItem(key)).artifacts, storageKey);
    const beforeDiagnosis = await artifacts();
    assert.deepEqual(beforeDiagnosis.coverLetterLab.questions, seed.artifacts.coverLetterLab.questions);
    await page.locator('#khWritingRun').click();
    assert.equal(await page.locator('#khWritingSuggestion').inputValue(), corrected);
    assert.equal(await field.inputValue(), original);
    await field.evaluate(el => {
      el.value += ' 수정 중';
      el.dispatchEvent(new Event('input', {bubbles:true}));
    });
    assert.equal(await page.locator('#khWritingApply').isVisible(), false);
    await field.evaluate((el, text) => {el.value = text;}, original);
    await page.locator('#khWritingRun').click();
    await page.locator('#factChecked').check();
    await page.locator('#khWritingApply').click();
    assert.equal(await field.inputValue(), corrected);
    assert.equal(await page.locator('#factChecked').isChecked(), false);

    assert.deepEqual(await artifacts(), beforeDiagnosis);
    await page.locator('#addQuestion').click();
    const afterSave = await artifacts();
    assert.equal(afterSave.coverLetterLab.questions[0].finalAnswer, corrected);
    assert.deepEqual(afterSave.humanFirst, seed.artifacts.humanFirst);
    assert.deepEqual(afterSave.jobPortfolio, seed.artifacts.jobPortfolio);

    await page.locator('.stepBtn[data-step="9"]').click();
    await page.locator('#injeInterviewAdvancedDisclosure').evaluate(el => {el.open = true;});
    await page.locator('#nextStep').click();
    await page.locator('#portfolioPrint').waitFor();
    assert.equal(await page.locator('.stepBtn.active').getAttribute('data-step'), '11');
    assert.match(await page.locator('#stepRoot .kicker').first().textContent(), /STEP 11/);
    await page.reload();
    await page.locator('#portfolioPrint').waitFor();
    assert.equal((await artifacts()).jobPortfolio.positioning, seed.artifacts.jobPortfolio.positioning);
    assert.deepEqual(errors, []);

    const legacyPage = await browser.newPage(options);
    await legacyPage.goto(base + '?mode=selective&modules=10,12');
    assert.match(await legacyPage.locator('.stepBtn').last().textContent(), /Human-First Check/);
    await legacyPage.locator('.stepBtn[data-step="10"]').click();
    await legacyPage.locator('#stepRoot h2').filter({hasText:'Cover Letter Lab'}).waitFor({state:'attached'});
    assert.equal(await legacyPage.locator('#khWritingInspector').count(), 0);
    console.log('PASS ' + label + ' · 문체 진단 및 교정, 원본 데이터, 기존 기록, 단계 이동, 비인제 범위');
  } finally {
    await browser.close();
  }
}
