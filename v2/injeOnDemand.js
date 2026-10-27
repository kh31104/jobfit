// INJE only: optional in-place recovery of missing prerequisites.
// Existing STEP 1-6 answers and original artifact collections are never mutated.
// All newly typed data lives under artifacts.injeOnDemand; projected values are read-only.
const ORIGIN='inje-on-demand-v1';
const TARGET='inje-on-demand-job';
const COMBO='inje-on-demand-combo';
const EXPERIENCE='inje-on-demand-experience';
const POSTING='inje-on-demand-posting';
const REQUIREMENT='inje-on-demand-requirement';
const ASSET='inje-on-demand-asset';

const val=x=>String(x??'').trim();
const list=(x,n=5)=>[...new Set(val(x).split(/[\n,;]+/).map(v=>v.replace(/^[-•*\d.)\s]+/,'').trim()).filter(Boolean))].slice(0,n);
const escape=(x,ctx)=>ctx.escapeHtml(val(x));
const verifiedUrl=x=>/^https:\/\//i.test(val(x))?val(x):'';
const hasTarget=e=>(e?.targets||[]).some(id=>(e?.candidates||[]).some(c=>c.id===id&&c.title));

export function projectInjeOnDemand(original){
  const d=original?.artifacts?.injeOnDemand;
  if(!d||typeof d!=='object')return original;
  if(![d.job,d.experienceTitle,d.company,d.via,d.careerNote].some(val))return original;
  const s=structuredClone(original);
  s.artifacts=s.artifacts||{};
  s.assessments=s.assessments||{};

  if(!val(s.profile?.major)&&val(d.major))s.profile={...(s.profile||{}),major:val(d.major)};

  const e=s.artifacts.jobExplorer||{};
  if(!hasTarget(e)&&val(d.job)){
    const candidate={id:TARGET,title:val(d.job),family:'',origin:ORIGIN};
    s.artifacts.jobExplorer={...e,
      candidates:[...(e.candidates||[]).filter(x=>x?.id!==TARGET),candidate],
      targets:[TARGET],targetCombos:[{id:COMBO,jobId:TARGET,industry:val(d.industry)||'산업 미정',priority:1,origin:ORIGIN}]};
  }
  const explorer=s.artifacts.jobExplorer||{};
  if(!explorer.industryInterests?.length&&val(d.industry)){
    s.artifacts.jobExplorer={...explorer,industryInterests:list(d.industry,3)};
  }
  if(!s.artifacts.jobExplorer?.desiredActivities?.length&&val(d.activities)){
    s.artifacts.jobExplorer={...s.artifacts.jobExplorer,desiredActivities:list(d.activities,5)};
  }

  const experience=s.assessments.experienceCompetency||{};
  const existing=Array.isArray(experience.experiences)?experience.experiences:[];
  if(val(d.experienceTitle)&&val(d.experienceAction)&&!existing.some(x=>x?.id===EXPERIENCE)&&!existing.some(x=>x?.factChecked&&val(x.action))){
    const item={id:EXPERIENCE,title:val(d.experienceTitle),action:val(d.experienceAction),
      result:val(d.experienceResult),evidence:val(d.experienceResult),
      competencies:list(d.competencies,5),factChecked:d.experienceConfirmed===true,
      origin:ORIGIN,updatedAt:d.updatedAt||null};
    s.assessments.experienceCompetency={...experience,experiences:[...existing,item]};
  }

  const dna=s.assessments.careerDNA||{};
  if(!dna.viaTop5?.length&&d.viaConfirmed===true&&list(d.via,5).length===5){
    s.assessments.careerDNA={...dna,viaTop5:list(d.via,5)};
  }
  if(!val(s.artifacts.careerDNAProfile?.hypothesis?.text)&&val(d.careerNote)){
    s.artifacts.careerDNAProfile={...(s.artifacts.careerDNAProfile||{}),
      hypothesis:{...(s.artifacts.careerDNAProfile?.hypothesis||{}),text:val(d.careerNote)}};
  }

  const combos=s.artifacts.jobExplorer?.targetCombos||[];
  const active=combos[0];
  const jd=s.artifacts.jobDeepDive||{};
  const oldA=active&&(jd.targetAnalyses?.[active.id]||jd.analyses?.[active.jobId]);
  if(active&&[d.jdTasks,d.company,d.jdTitle,d.jdRequirements,d.have,d.gap,d.nextAction].some(val)){
    const sourceUrl=verifiedUrl(d.jdUrl);
    const sources=sourceUrl?[{id:'inje-on-demand-source',name:val(d.jdTitle)||val(d.job),companyName:val(d.company),url:sourceUrl,checkedAt:val(d.updatedAt).slice(0,10),type:'학생 입력 · 원문 확인 필요',slot:0}]:[];
    const req=list(d.jdRequirements,8).map((name,i)=>({id:REQUIREMENT+'-'+i,name,status:'확인 필요',source:'학생 입력 · 공고 대조 필요'}));
    if(val(d.gap))req.push({id:REQUIREMENT+'-gap',name:val(d.gap),gap:val(d.gap),status:'준비 필요',source:'학생 자기평가'});
    const job=s.artifacts.jobExplorer?.candidates?.find(x=>x.id===active.jobId);
    const fallback={targetId:active.id,jobTitle:job?.title||val(d.job),industry:active.industry||val(d.industry),
      company:{name:val(d.company)},sources,selectedSourceId:sources[0]?.id||'',
      jobTable:{customerKpi:'',tasks:val(d.jdTasks),challenge:'',method:'',competencies:'',careerPlan:'',aiResult:''},
      studentSpec:{certificates:'',language:'',tools:'',portfolio:''},
      requirements:req,have:val(d.have),prepare:val(d.nextAction),origin:ORIGIN};
    // Existing STEP 5 analysis wins. Only its empty fields are read from the supplement.
    const a=oldA?{...oldA,
      have:val(oldA.have)||fallback.have,
      prepare:val(oldA.prepare)||fallback.prepare,
      jobTable:{...fallback.jobTable,...(oldA.jobTable||{}),
        tasks:val(oldA.jobTable?.tasks)||fallback.jobTable.tasks},
      requirements:oldA.requirements?.length?oldA.requirements:req,
      sources:oldA.sources?.length?oldA.sources:sources,
      selectedSourceId:val(oldA.selectedSourceId)||sources[0]?.id||''
    }:fallback;
    s.artifacts.jobDeepDive={...jd,targetAnalyses:{...(jd.targetAnalyses||{}),[active.id]:a},
      analyses:{...(jd.analyses||{}),[active.jobId]:a}};
  }

  const ja=s.artifacts.jdAnalyzer||{};
  const postings=Array.isArray(ja.postings)?ja.postings:[];
  if(!postings.length&&val(d.company)&&val(d.job||d.jdTitle)){
    const reqs=list(d.jdRequirements,8).map((text,i)=>({
      id:REQUIREMENT+'-'+i,text,type:'기타',level:'업무핵심',
      explicitness:'학생 입력 · 공고 대조 필요',origin:ORIGIN}));
    s.artifacts.jdAnalyzer={...ja,postings:[{id:POSTING,company:val(d.company),
      jobTitle:val(d.job)||val(d.jdTitle),rawPosting:val(d.jdTasks),
      source:verifiedUrl(d.jdUrl),postingUrl:verifiedUrl(d.jdUrl),
      requirements:reqs,gates:[],gateReviewed:false,origin:ORIGIN}],
      selectedId:POSTING};
  }
  const ca=s.artifacts.careerAssets||{};
  const assets=Array.isArray(ca.assets)?ca.assets:[];
  const currentExperience=s.assessments.experienceCompetency?.experiences||[];
  const exp=currentExperience.find(x=>x.id===EXPERIENCE)||currentExperience.find(x=>x?.factChecked&&val(x.action));
  const req=s.artifacts.jdAnalyzer?.postings?.find(x=>x.id===(s.artifacts.jdAnalyzer?.selectedId||POSTING))?.requirements?.[0];
  if(!assets.some(a=>a?.evidenceLevel&&a.evidenceLevel!=='없음')&&exp&&req&&!assets.some(a=>a.id===ASSET)){
    // Fact and JD alignment have NOT been confirmed; draft only.
    const asset={id:ASSET,postingId:POSTING,experienceId:exp.id,experienceTitle:exp.title,
      requirementId:req.id,requirement:req.text,requirementType:req.type||'기타',
      evidenceLevel:'C · 간접 증거',proof:val(exp.action),fact:val(exp.result||exp.evidence),
      factCheck:'추가확인 필요',sourceExperienceFactChecked:!!exp.factChecked,origin:ORIGIN};
    s.artifacts.careerAssets={...ca,assets:[...assets,asset]};
  }
  return s;
}

function missingForStep(s,step){
  const e=s.artifacts?.jobExplorer||{},jd=s.artifacts?.jdAnalyzer||{},ca=s.artifacts?.careerAssets||{};
  if(step===3||step===4)return !hasTarget(e);
  if(step===5)return !(s.assessments?.experienceCompetency?.experiences||[]).some(x=>x?.factChecked&&val(x.action))||!hasTarget(e);
  if(step===8||step===9)return !(jd.postings||[]).length||!(ca.assets||[]).some(a=>a?.evidenceLevel&&a.evidenceLevel!=='없음');
  return false;
}

export function mountInjeOnDemand(ctx,step,root){
  if(![3,4,5,6,7,8,9].includes(step)||!root)return;
  // STEP 7 and 8 already provide their dedicated non-destructive quick-start forms.
  if(step===6||step===7)return;
  const raw=ctx.getRawState();
  const d=raw.artifacts?.injeOnDemand||{};
  const missing=missingForStep(projectInjeOnDemand(raw),step);
  // No extra work is needed on STEP 4; students can select jobs directly there.
  if(step===3&&!missingForStep(raw,4))return;
  const wantGoal=step===3||step===4||step===5;
  const wantExperience=step===5||step===8||step===9;
  const wantPosting=step===8||step===9;
  const showReport=step===5;
  const field=(id,label,placeholder,wide=false)=>'<div class="field"><label for="od-'+id+'">'+label+'</label><input class="input" id="od-'+id+'" value="'+escape(d[id],ctx)+'" placeholder="'+placeholder+'"></div>';
  const area=(id,label,placeholder)=>'<div class="field"><label for="od-'+id+'">'+label+'</label><textarea id="od-'+id+'" rows="3" placeholder="'+placeholder+'">'+escape(d[id],ctx)+'</textarea></div>';
  const goal=(wantGoal||wantPosting)?'<div class="grid2">'
    +field('job','희망 직무','예: 브랜드 마케팅')
    +field('industry','관심 산업','예: 패션·유통')
    +'</div>':'';
  const exp=wantExperience?'<div class="grid2">'
    +field('experienceTitle','내 경험 이름','예: 팀 프로젝트')
    +area('experienceAction','직접 한 행동','예: 고객 리뷰를 직접 분류했다')
    +area('experienceResult','실제 결과·근거','예: 분석표를 만들었다')
    +field('competencies','확인한 역량 (선택)','예: 자료분석, 협업')
    +'</div><label class="checkRow"><input id="od-experienceConfirmed" type="checkbox" '+(d.experienceConfirmed===true?'checked':'')+'><span>내가 실제로 한 행동임을 확인했습니다. 확인 전에는 최종 사실로 표시하지 않습니다.</span></label>':'';
  const info=showReport?'<div class="grid2">'
    +area('careerNote','자기이해 한 줄 (선택)','직접 확인한 나의 관심·강점')
    +field('activities','해보고 싶은 업무 (선택)','예: 자료 분석, 고객 응대')
    +field('via','VIA TOP 5 (검사 결과가 있을 때만)','쉼표로 구분해 실제 결과 5개 입력')
    +area('have','지금 가진 직무 근거 (선택)','현재 확인한 자격·경험·기술')
    +area('gap','핵심 부족한 점 (선택)','확인된 GAP 1개')
    +area('nextAction','앞으로 3개월간 할 일 (선택)','실행할 행동 한 가지')
    +'</div><label class="checkRow"><input id="od-viaConfirmed" type="checkbox" '+(d.viaConfirmed===true?'checked':'')+'><span>공식 VIA 검사 결과를 보고 그대로 옮겼습니다. 검사하지 않았다면 빈칸으로 두세요.</span></label>':'';
  const reportJD=showReport?'<details class="qsDetails" style="margin-top:12px"><summary>직무분석·공고 자료도 없어졌다면 추가 입력 (선택)</summary><div class="grid2" style="margin-top:12px">'
    +field('company','기준 기업 (선택)','예: 관심 기업')
    +field('jdTitle','채용공고명 (선택)','예: 마케팅 직무소개')
    +field('jdUrl','원문 URL (선택)','https://...')
    +area('jdTasks','직무에서 하는 일 (선택)','실제 직무소개에 적힌 업무')
    +area('jdRequirements','주요 요구사항 (선택)','원문에서 확인한 요구사항만')
    +'</div></details>':'';
  const posting=wantPosting?'<div class="grid2">
    +field('company','지원 기업','예: 관심 기업')
    +field('jdTitle','채용공고 제목 (선택)','예: 신입 마케터')
    +field('jdUrl','공고 원문 URL (선택)','https://...')
    +area('jdRequirements','공고 핵심 요구사항 (1줄에 1개)','공고에서 직접 확인한 항목만 입력')
    +'</div>':'';
  const isMissing=missing;
  const html='<div class="injeOd" id="injeOnDemand"><style>'
    +'.injeOd{margin:12px 0 20px}.injeOd details{border:1px solid #d5def2;border-radius:14px;padding:12px;background:#fafcff}.injeOd summary{cursor:pointer;font-weight:800;line-height:1.5}.injeOd .odBody{margin-top:12px}.injeOd .odNote{font-size:13px;line-height:1.65;color:#475467;margin:8px 0 14px}.injeOd .grid2{gap:10px}.injeOd .field{min-width:0}.injeOd .checkRow{margin:10px 0}.injeOd .actions{margin-top:14px}@media(max-width:760px){.injeOd .grid2{grid-template-columns:minmax(0,1fr)}}'
    +'</style><details '+(isMissing?'open':'')+'><summary>'+(isMissing?'앞 단계 자료가 없어도 여기서 바로 입력하기':'이 단계에서 필요한 정보만 추가하기 (선택)')+'</summary>'
    +'<div class="odBody"><p class="odNote">기존 STEP 1~6 저장값은 수정하거나 초기화하지 않습니다. 아래 내용은 별도 보완 기록으로만 저장하고, 기존 데이터가 없는 칸에만 사용합니다. 없는 경험·검사 결과를 만들어 입력하지 마세요.</p>'
    +goal+info+reportJD+posting+exp
    +'<div class="actions"><button type="button" class="btn primary" id="od-save">필요한 정보만 저장하고 현재 STEP 계속하기</button>'
    +'<button type="button" class="btn secondary" id="od-backup">기존 데이터 JSON 백업</button></div>'
    +'<div class="status" id="od-status" role="status"></div></div></details></div>';
  const section=root.querySelector('section.card')||root.firstElementChild;
  const box=document.createElement('div');box.innerHTML=html;
  const node=box.firstElementChild;
  const head=section?.querySelector('.sectionHead');
  if(head)head.insertAdjacentElement('afterend',node);else root.prepend(node);
  node.querySelector('#od-backup')?.addEventListener('click',()=>ctx.downloadJSON());
  node.querySelector('#od-save')?.addEventListener('click',()=>{
    const fields=['job','industry','experienceTitle','experienceAction','experienceResult','competencies',
      'careerNote','activities','via','have','gap','nextAction','company','jdTitle','jdUrl','jdTasks','jdRequirements'];
    const next={...d};
    for(const k of fields){const el=node.querySelector('#od-'+k);if(el)next[k]=val(el.value)}
    for(const k of ['experienceConfirmed','viaConfirmed']){const el=node.querySelector('#od-'+k);if(el)next[k]=el.checked}
    if((step===3||step===4)&&!hasTarget(raw.artifacts?.jobExplorer)&&!val(next.job)){
      node.querySelector('#od-status').textContent='계속하려면 희망 직무를 입력하세요.';return;
    }
    if(next.jdUrl&&!verifiedUrl(next.jdUrl)){
      node.querySelector('#od-status').textContent='공고 URL은 https://로 시작하는 실제 원문 주소만 입력하세요.';return;
    }
    next.version=1;next.origin=ORIGIN;next.updatedAt=new Date().toISOString();
    ctx.saveState({artifacts:{injeOnDemand:next}});
    ctx.toast('보완 정보만 별도 저장했습니다. 기존 STEP 결과는 그대로 유지합니다.');
    // INJE STEP 8-10 use physical modules 9-11 in the existing navigation adapter.
    ctx.navigate(step>=7?step+2:step);
  });
}
