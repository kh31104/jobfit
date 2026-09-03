import { chromium } from 'playwright';

const base=process.env.JOBFIT_TEST_URL||'http://127.0.0.1:8765/v2/';
const browser=await chromium.launch({headless:true});let failed=false;
function assert(c,m){if(!c)throw new Error(m)}
async function run(name,fn){const context=await browser.newContext({viewport:{width:1280,height:900}}),page=await context.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));try{await fn(page);if(errors.length)throw new Error(errors.join('\n'));console.log(`PASS ${name}`)}catch(e){failed=true;console.error(`FAIL ${name}\n${e.stack||e}`)}finally{await context.close()}}

await run('STEP 0 offers optional off-device backup confirmation',async page=>{
  await page.goto(`${base}?course=INJE2026`,{waitUntil:'networkidle'});
  assert(await page.locator('#nextStep').isEnabled(),'STEP 1 button should stay available before optional backup confirmation');
  assert(await page.locator('#backupNowBtn').isDisabled(),'Backup must stay disabled before an anonymous code exists');
  await page.locator('#makeCodeBtn').click();
  await page.waitForFunction(()=>document.querySelector('#backupNowBtn')?.disabled===false);
  await page.locator('#backupStoredCheck').click();
  assert(!(await page.locator('#backupStoredCheck').isChecked()),'Backup confirmation should not work before a file is created');
  const downloadPromise=page.waitForEvent('download');
  await page.locator('#backupNowBtn').click();
  const download=await downloadPromise;
  assert(download.suggestedFilename().startsWith('jobfit-JF26-'),'Backup filename should include the anonymous Jobfit code');
  await page.locator('#backupStoredCheck').check();
  assert(await page.locator('#nextStep').isEnabled(),'Optional backup confirmation should not change STEP 1 access');
  const meta=await page.evaluate(()=>JSON.parse(localStorage.getItem('jobfit:v2:learner')).meta);
  assert(!!meta.lastBackupAt&&meta.lastBackupMethod==='download','Backup creation metadata was not saved');
  assert(meta.backupConfirmed===true&&!!meta.backupConfirmedAt,'Backup confirmation metadata was not saved');
});

await run('Learner JSON backup restores data and keeps course constraints',async page=>{
  await page.goto(`${base}?course=INJE2026`,{waitUntil:'networkidle'});
  await page.locator('#makeCodeBtn').click();
  const before=(await page.locator('#anonCode').textContent()).trim();
  const backup={version:2.2,activeStep:2,mode:'selective',profile:{anonCode:'JF26-REST99',courseCode:'OTHER',institution:'다른기관'},baseline:{jobDecision:'탐색 중'},research:{consent:false,measurements:{pre:{},post:{}}},assessments:{careerDNA:{},experienceCompetency:{experiences:[{id:'exp1',title:'복구 테스트 경험',factChecked:true}]}},artifacts:{experienceMap:[{id:'exp1',title:'복구 테스트 경험'}]},meta:{createdAt:new Date().toISOString(),updatedAt:new Date().toISOString()}};
  page.once('dialog',d=>d.accept());
  const chooserPromise=page.waitForEvent('filechooser');
  await page.locator('#importBtn').click();
  const chooser=await chooserPromise;
  await chooser.setFiles({name:'jobfit-backup.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(backup))});
  await page.waitForSelector('#stepRoot h2');
  assert((await page.locator('#stepRoot h2').first().textContent()).includes('Experience & Competency'),'Imported active step was not restored');
  const stored=await page.evaluate(()=>JSON.parse(localStorage.getItem('jobfit:v2:learner')));
  assert(stored.profile.anonCode==='JF26-REST99','Anonymous code was not restored');
  assert(stored.profile.anonCode!==before,'Old state was not replaced');
  assert(stored.profile.courseCode==='INJE2026','Current course constraint was not preserved');
  assert(stored.profile.institution==='인제대학교','Course institution constraint was not preserved');
  assert(stored.mode==='full','INJE course full-roadmap lock was not re-applied');
  assert(stored.assessments.experienceCompetency.experiences[0].title==='복구 테스트 경험','Experience backup was not restored');
});

await run('Invalid JSON backup does not overwrite learner state',async page=>{
  await page.goto(base,{waitUntil:'networkidle'});await page.locator('#makeCodeBtn').click();const before=(await page.locator('#anonCode').textContent()).trim();
  const chooserPromise=page.waitForEvent('filechooser');await page.locator('#importBtn').click();const chooser=await chooserPromise;await chooser.setFiles({name:'bad.json',mimeType:'application/json',buffer:Buffer.from('{not valid json')});await page.waitForTimeout(150);
  const stored=await page.evaluate(()=>JSON.parse(localStorage.getItem('jobfit:v2:learner')));assert(stored.profile.anonCode===before,'Invalid import overwrote learner data');
});

await browser.close();if(failed)process.exit(1);