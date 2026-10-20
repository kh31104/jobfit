/* JOBFIT DONG-A STEP 1 · single-panel sidebar UI only.
   The existing STEP 1 data model, input handlers, prompts and backup logic stay unchanged. */
(function(){
  "use strict";
  const target=document.querySelector("#dongaSide1 .donga-menu");
  const main=document.querySelector(".donga-main");
  if(!target||!main)return;

  const names=[
    ["가치관 인터뷰","AI · 가치관 탐색"],
    ["Career Anchor","직업 선택 기준"],
    ["나의 강점","강점 TOP 5"],
    ["VIA 강점","검사 결과 정리"],
    ["결과 비교","공통점과 차이"],
    ["AI 통합분석","내 Career DNA"],
    ["Career DNA 저장","최종 확인·백업"]
  ];
  const panels=names.map((_,i)=>document.getElementById("step"+(i+1)));
  const topCards=Array.from(main.children).filter(el=>el.matches(".card"));
  // Existing STEP 2 shortcut remains available in the global header.
  // Existing progress field stays in the DOM so STEP 1's saving code is unaffected.
  const backupCard=topCards.find(el=>el.querySelector("#backup"));
  const status=document.createElement("div");
  status.className="donga-nav-status";
  status.innerHTML='<b id="dongaStep1Progress">0 / 7 완료</b><small>입력 즉시 자동 저장 · STEP 1 전용</small>';
  target.closest(".donga-nav-card").append(status);
  const existingProgress=document.getElementById("progress");
  const syncProgress=()=>{if(existingProgress)document.getElementById("dongaStep1Progress").textContent=existingProgress.textContent||"0 / 7 완료"};
  if(existingProgress&&typeof MutationObserver!=="undefined"){
    new MutationObserver(syncProgress).observe(existingProgress,{childList:true,characterData:true,subtree:true});
  }
  syncProgress();

  let current=0;
  const buttons=names.map(([title,subtitle],i)=>{
    const button=document.createElement("button");
    button.type="button";
    button.className="donga-stepbtn";
    const number=document.createElement("span");
    number.className="donga-stepnum";
    number.textContent=String(i+1).padStart(2,"0");
    const label=document.createElement("span");
    label.className="donga-steplabel";
    const strong=document.createElement("b");strong.textContent=title;
    const small=document.createElement("small");small.textContent=subtitle;
    label.append(strong,small);button.append(number,label);
    button.addEventListener("click",()=>select(i,true));
    target.append(button);
    return button;
  });
  function select(index,scroll){
    if(!Number.isInteger(index)||index<0||index>=panels.length||!panels[index])return;
    current=index;
    panels.forEach((panel,i)=>{
      if(!panel)return;
      panel.hidden=(i!==index);
      // Show the chosen step's existing content immediately; no extra accordion click.
      panel.open=(i===index);
    });
    topCards.forEach(card=>{card.hidden=(card!==backupCard||index!==6)});
    buttons.forEach((button,i)=>{
      if(i===index)button.setAttribute("aria-current","step");
      else button.removeAttribute("aria-current");
    });
    if(scroll)panels[index].scrollIntoView({behavior:"smooth",block:"start"});
  }
  // STEP 1's original .next buttons still open and scroll the target.
  // Switch visibility beforehand rather than modifying any existing button handlers.
  main.addEventListener("click",event=>{
    const next=event.target.closest("button.next[data-next]");
    if(!next)return;
    const m=/^step([1-7])$/.exec(next.getAttribute("data-next")||"");
    if(m)select(Number(m[1])-1,false);
  },true);
  // The currently selected item should remain expanded when its summary is clicked.
  // Switching sections is handled exclusively by the left sidebar.
  panels.forEach(panel=>{
    panel?.querySelector("summary")?.addEventListener("click",event=>{
      event.preventDefault();
      panel.open=true;
    });
  });
  select(0,false);
})();