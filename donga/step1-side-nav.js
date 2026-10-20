/* STEP 1 navigation only. Does not modify learner data or existing STEP 1 handlers. */
(function(){
  "use strict";
  const target=document.querySelector("#dongaSide1 .donga-menu");
  if(!target)return;
  const names=[
    ["가치관 인터뷰","AI · 가치관 탐색"],
    ["Career Anchor","직업 선택 기준"],
    ["나의 강점","강점 TOP 5"],
    ["VIA 강점","검사 결과 정리"],
    ["결과 비교","공통점과 차이"],
    ["AI 통합분석","내 Career DNA"],
    ["Career DNA 저장","최종 확인·백업"]
  ];
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
    button.addEventListener("click",()=>{
      const detail=document.getElementById("step"+(i+1));
      if(!detail)return;
      detail.open=true;
      choose(i);
      detail.scrollIntoView({behavior:"smooth",block:"start"});
    });
    target.append(button);
    return button;
  });
  function choose(i){buttons.forEach((button,k)=>{
    if(i===k)button.setAttribute("aria-current","step");
    else button.removeAttribute("aria-current");
  })}
  const all=names.map((_,i)=>document.getElementById("step"+(i+1)));
  all.forEach((detail,i)=>{
    if(!detail)return;
    detail.addEventListener("toggle",()=>{if(detail.open)choose(i)});
    detail.querySelector("summary")?.addEventListener("click",()=>choose(i));
  });
  choose(0);
})();
