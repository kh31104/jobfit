import fs from "node:fs";
import vm from "node:vm";
import assert from "node:assert/strict";
const source=fs.readFileSync(new URL("../reset-controls.js",import.meta.url),"utf8");
const html=fs.readFileSync(new URL("../index.html",import.meta.url),"utf8");
const css=fs.readFileSync(new URL("../reset-controls.css",import.meta.url),"utf8");
assert.match(html,/anchor-score-grid/,"Career Anchor guide before questions");
const anchorIndex=html.indexOf('<div class="anchor-score-grid">');
assert(anchorIndex>html.indexOf('id="step2"') && anchorIndex<html.indexOf('id="qarea"'),"scoring guide comes before 40 questionnaire");
assert.match(html,/3개를 선택/,"3 bonus questions guide");
assert.match(css,/@media\(max-width:650px\)/,"mobile support");
for(const step of ["step1","step2","step3"]){
 const keys=["jobfit:donga:step1:v1","jobfit:donga:step2:v1","jobfit:donga:step3:v1"];
 const storage=new Map(keys.map((k,i)=>[k,JSON.stringify({app:["JOBFIT_DONGA","JOBFIT_DONGA_STEP2","JOBFIT_DONGA_STEP3"][i],answer:i})]));
 storage.set("jobfit:inje:learner","unchanged");
 storage.set("jobfit:flex:learner","unchanged");
 const handlers={};
 const panel={innerHTML:"",addEventListener(type,fn){handlers[type]=fn},querySelector(){return {addEventListener(){}}},className:""};
 const host={firstChild:{},querySelector(){return {}},insertBefore(x){assert.equal(x,panel)}};
 const document={
  readyState:"complete",
  currentScript:{dataset:{dongaStep:step}},
  createElement(){return panel;},
  querySelector(){return host;},
  getElementById(){return null;},
  body:{appendChild(){}},
 };
 let reloaded=0,assigned=0,confirms=0;
 const context={document,localStorage:{getItem:k=>storage.get(k)??null,setItem:(k,v)=>storage.set(k,v),removeItem:k=>storage.delete(k)},confirm:()=>{confirms++;return true;},location:{href:"https://example.test/donga/step2/",reload(){reloaded++},assign(){assigned++}},URL,Blob,setTimeout(){},FileReader:class{}};
 vm.runInNewContext(source,context);
 assert.match(panel.innerHTML,/새 학생 시작 · 1~3 전체 초기화/);
 const run=action=>handlers.click({target:{closest:()=>({dataset:{resetAction:action},getAttribute(){}})}});
 run("reset-one");
 assert.equal(confirms,2,"require two confirmations");
 assert.equal(storage.has("jobfit:donga:"+step+":v1"),false);
 for(const k of keys.filter(k=>k!=="jobfit:donga:"+step+":v1"))assert(storage.has(k),"non-target DONGA step stays");
 assert.equal(storage.get("jobfit:inje:learner"),"unchanged");
 assert.equal(storage.get("jobfit:flex:learner"),"unchanged");
 assert.equal(reloaded,1);
 storage.set("jobfit:donga:"+step+":v1",JSON.stringify({app:"DONGA"}));
 run("reset-all");
 for(const k of keys)assert.equal(storage.has(k),false,"clear all three DONGA steps");
 assert.equal(storage.get("jobfit:inje:learner"),"unchanged");
 assert.equal(storage.get("jobfit:flex:learner"),"unchanged");
 assert.equal(confirms,4);
 assert.equal(reloaded+assigned,2);
}
console.log("PASS DONG-A Career Anchor scoring guide and STEP-only vs all-STEP reset isolation");
