/* STEP 3 unified navigation and read-only STEP 1 / STEP 2 starting point. */
(function(){
 "use strict";
 const $=id=>document.getElementById(id);
 const titles=[
   ["My Starting Point","현재 나의 위치"],
   ["My Career Goal","희망 직무와 목표"],
   ["My Career Plan","취업 전 3단계"],
   ["My Career Roadmap","취업 후 경력개발"],
   ["My Career Design v1","확인 · PDF 저장"]
 ];
 const root=$("dongaStep3Nav")?.querySelector(".donga-menu");
 if(!root)return;
 function safeRead(key){try{return JSON.parse(localStorage.getItem(key)||"null")}catch{return null}}
 const names={A:"전문성 추구형",B:"리더십 추구형",C:"자율성/독립성 추구형",D:"안전/안정성 추구형",E:"기업가적 창의성 추구형",F:"봉사/헌신 추구형",G:"순수 도전 추구형",H:"삶의 질 추구형"};
 const codes=["A","D","F","C","H","B","G","E","B","H","A","E","C","G","F","D","C","F","D","A","E","H","B","G","G","E","B","D","A","H","C","F","H","A","D","G","F","B","E","C"];
 function anchorTop3(s){
   const answers=s?.anchor?.answers,bonus=s?.anchor?.bonus;
   if(!Array.isArray(answers)||answers.length!==40||answers.some(x=>!Number.isInteger(x)||x<1||x>6)||!Array.isArray(bonus)||bonus.length!==3)return "미입력";
   const score={A:0,B:0,C:0,D:0,E:0,F:0,G:0,H:0};
   codes.forEach((c,i)=>score[c]+=answers[i]+(bonus.includes(i)?4:0));
   return Object.entries(score).sort((a,b)=>b[1]-a[1]||a[0].localeCompare(b[0])).slice(0,3).map(([c,n])=>names[c]+" "+n+"점").join("\n");
 }
 function textOr(s){return String(s||"").trim()||"미입력"}
 function starting(){
   const one=safeRead("jobfit:donga:step1:v1");
   const two=safeRead("jobfit:donga:step2:v1");
   $("starting1").textContent=one?.app==="JOBFIT_DONGA"?
    ["핵심 가치관\n"+textOr(one.values?.top5),
     "커리어 앵커 TOP 3\n"+anchorTop3(one),
     "내 강점 TOP 5\n"+(Array.isArray(one.strengths)&&one.strengths.length?one.strengths.join(" · "):"미입력"),
     "Career DNA 가설\n"+textOr(one.dna?.fit||one.dna?.values)].join("\n\n"):
    "STEP 1에 저장된 Career DNA가 없습니다.\n미입력";
   $("starting2").textContent=two?.app==="JOBFIT_DONGA_STEP2"?
    ["관심 산업\n"+textOr(two.target?.industry),
     "선택 직무\n"+textOr(two.target?.job||two.curatedSelection?.role||two.customJob?.role),
     "직무분석\n"+textOr(two.jobTable?.tasks),
     "보완할 GAP\n"+textOr(two.fit?.gaps)].join("\n\n"):
    "STEP 2에 저장된 직무분석이 없습니다.\n미입력";
 }
 const buttons=titles.map(([title,subtitle],i)=>{
   const btn=document.createElement("button");btn.type="button";btn.className="donga-stepbtn";
   const num=document.createElement("span");num.className="donga-stepnum";num.textContent=String(i+1).padStart(2,"0");
   const txt=document.createElement("span");txt.className="donga-steplabel";
   const label=document.createElement("b");label.textContent=title;
   const detail=document.createElement("small");detail.textContent=subtitle;
   txt.append(label,detail);btn.append(num,txt);root.append(btn);
   btn.addEventListener("click",()=>show(i+1));
   return btn;
 });
 function show(step){
   const active=Math.max(1,Math.min(5,Number(step)||1));
   for(let i=1;i<=5;i++){
     const panel=$("dongaPanel"+i);
     if(panel)panel.hidden=i!==active;
     if(i===active)buttons[i-1].setAttribute("aria-current","step");
     else buttons[i-1].removeAttribute("aria-current");
   }
   if(active===1)starting();
   $("dongaStep3Nav").scrollIntoView({behavior:"instant",block:"nearest"});
 }
 document.querySelectorAll("[data-goto]").forEach(button=>button.addEventListener("click",()=>show(button.getAttribute("data-goto"))));
 starting();show(1);
 window.addEventListener("pageshow",()=>{starting()});
})();