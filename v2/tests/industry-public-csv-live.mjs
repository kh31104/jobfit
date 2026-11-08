import assert from 'node:assert/strict';
import {csvParse,transform,fetchPublicCsv,SOURCES} from '../../supabase/functions/industry-public-pilot/lib.mjs';
const small=csvParse('제목,내용,연도\n"제목, 별표","두 줄\n내용",2026\n');
assert.equal(small.records[0]['제목'],'제목, 별표');
assert.equal(small.records[0]['내용'],'두 줄\n내용');
const support=csvParse('분야,공고명,소관기관,수행기관,신청시작일자,신청종료일자,등록일자,상세URL\n기술,로봇 사업,산업부,수행원,2026-01-01,2026-02-02,2025-12-30,https://www.bizinfo.go.kr/x\n');
assert.equal(transform('support',support,'로봇').records[0].title,'로봇 사업');
assert.equal(transform('support',support,'교육').matched,0);
for(const kind of Object.keys(SOURCES)){
 const source=SOURCES[kind];
 try{
  const {table,receivedBytes}=await fetchPublicCsv(kind);
  const {matched,records}=transform(kind,table,'',10);
  assert(receivedBytes>100,'Received content must not be empty');
  assert(records.length>0,'At least one record returned');
  assert(records.length<=10);
  if(kind==='bsi'){
   assert(records[0].actualLabel.includes('현황'),'Actual values must remain labeled');
   assert(records[0].forecastLabel.includes('전망'),'Outlook values must remain labeled');
   assert(records[0].title,'Industry name present');
  }
  if(kind==='support')assert(records[0].title,'Support name present');
  if(kind==='ethics')assert(records[0].title,'Ethics document title present');
  console.log('LIVE_CSV_SUCCESS',JSON.stringify({
   kind,source:source.provider,title:source.title,
   fetchedBytes:receivedBytes,actualRows:table.records.length,headerNames:table.headers.slice(0,5),
   matched,returned:records.length,firstRecord:records[0],baseDate:source.baseDate
  }));
 }catch(e){
  console.error('LIVE_CSV_FAILURE',JSON.stringify({kind,error:String(e?.message||e).slice(0,120)}));
  process.exitCode=1;
 }
}
