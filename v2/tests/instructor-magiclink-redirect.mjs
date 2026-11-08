import assert from 'node:assert/strict';
import { requestMagicLink } from '../../instructor/centralBackend.js';

globalThis.JOBFIT_RESEARCH_CONFIG={
  instructorAuthEnabled:true,
  supabaseUrl:'https://example.supabase.co',
  publishableKey:'sb_publishable_test_public'
};
let requests=[];
globalThis.fetch=async(url,opts)=>{
  requests.push({url:new URL(url),opts});
  return {ok:true,status:200,text:async()=>''};
};
for(const path of ['/jobfit/instructor/work24-pilot/','/jobfit/instructor/step7-pilot/']){
  globalThis.location={href:'https://kh31104.github.io'+path};
  const response=await requestMagicLink('instructor@example.com');
  assert.equal(response.ok,true);
  assert.equal(requests.length,1,'Exactly one OTP request');
  const {url,opts}=requests[0];
  assert.equal(url.origin,'https://example.supabase.co');
  assert.equal(url.pathname,'/auth/v1/otp');
  assert.equal(url.searchParams.get('redirect_to'),'https://kh31104.github.io'+path);
  assert.equal(opts.method,'POST');
  const body=JSON.parse(opts.body);
  assert.deepEqual(body,{email:'instructor@example.com',create_user:false});
  assert.equal('email_redirect_to' in body,false,'Redirect must NOT be in POST JSON');
  requests=[];
}
await assert.rejects(requestMagicLink('not-an-email'),/이메일 주소/);
assert.equal(requests.length,0);
console.log('INJE instructor magic link redirect URL contract PASS (no actual emails sent)');
