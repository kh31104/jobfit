import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';

const source=readFileSync(new URL('../../supabase/functions/work24-recruit-pilot/index.ts',import.meta.url),'utf8');
const start=source.indexOf('function clip('),stop=source.indexOf('function detailLink(');
assert(start>=0&&stop>start,'Safe diagnostic helpers must exist');
const classify=runInNewContext(source.slice(start,stop)+'\ndiagnoseWork24Xml;',{});
const examples=[
  ['<?xml version="1.0"?><GO24><error>개인회원은 사용할 수 없는 OPEN-API입니다.</error></GO24>',
    'work24_personal_member_restricted','account_type'],
  ['<GO24><error>인증키가 유효하지 않습니다.</error></GO24>',
    'work24_key_or_approval_rejected','credential'],
  ['<!DOCTYPE html><html><body>Temporary upstream issue</body></html>',
    'work24_returned_html','upstream_html'],
  ['<response><error>서비스 점검 중입니다</error></response>',
    'work24_xml_error','upstream_error'],
  ['<response><total>0</total></response>',
    'unexpected_xml_or_api_error','unrecognized_xml']
];
for(const [xml,error,category] of examples){
  const result=classify(xml);
  assert.equal(result.error,error);
  assert.equal(result.errorCategory,category);
  assert.equal(result.stage,'list');
  assert.equal(result.ok,false);
  assert(!JSON.stringify(result).includes('<GO24>'),'No raw XML can leak');
}
assert(source.includes('return json(diagnoseWork24Xml(raw),502,origin);'),'Handler must use safe diagnostics');
assert(source.includes("Deno.env.get('WORK24_RECRUIT_API_KEY')"),'Must read secret from server environment');
assert(!source.includes('d704d51d-'),'No Work24 credential in source');
console.log('Work24 upstream XML diagnostic classification PASS');
