import assert from 'node:assert/strict';
import {captureAuthCallback,getSession,requestMagicLink} from '../../instructor/centralBackend.js';

const store=new Map();
globalThis.sessionStorage={
  getItem:k=>store.has(k)?store.get(k):null,
  setItem:(k,v)=>store.set(k,String(v)),
  removeItem:k=>store.delete(k)
};
globalThis.JOBFIT_RESEARCH_CONFIG={
  instructorAuthEnabled:true,
  supabaseUrl:'https://example.supabase.co',
  publishableKey:'sb_publishable_mock',
};
let current;
function nav(href){
  const u=new URL(href);current=u;
  globalThis.location={href:u.href,pathname:u.pathname,search:u.search,hash:u.hash};
}
globalThis.history={
  replaceState(_state,_title,relative){
    const u=new URL(relative,current.origin);
    current=u;location.href=u.href;location.pathname=u.pathname;
    location.hash=u.hash;location.search=u.search;
  }
};
const jwt='eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxIn0.signature';
nav('https://kh31104.github.io/jobfit/instructor/work24-pilot/#access_token='+jwt+'&refresh_token=mockrefresh&expires_in=3600&token_type=bearer');
let outcome=await captureAuthCallback();
assert.equal(outcome.ok,true,'Implicit fragment should be accepted');
assert.equal(outcome.method,'implicit');
assert.equal(getSession().accessToken,jwt);
assert.equal(location.hash,'','Implicit token must be removed from visible URL');
assert.equal(location.pathname,'/jobfit/instructor/work24-pilot/');
store.clear();

nav('https://kh31104.github.io/jobfit/instructor/work24-pilot/?access_token='+jwt+'&refresh_token=mockrefresh&expires_in=3600');
outcome=await captureAuthCallback();
assert.equal(outcome.ok,true,'Query token should be accepted if provided');
assert.equal(location.search,'','Query token must be removed from visible URL');
store.clear();

let verifyCalls=[];
globalThis.fetch=async(url,opts)=>{
  verifyCalls.push({url,opts});
  if(String(url).endsWith('/auth/v1/verify'))return {
    ok:true,status:200,json:async()=>({access_token:jwt,refresh_token:'mockrefresh',expires_in:3600})
  };
  return {ok:true,status:200,text:async()=>''};
};
nav('https://kh31104.github.io/jobfit/instructor/work24-pilot/?token_hash=secret-in-link&type=magiclink');
outcome=await captureAuthCallback();
assert.equal(outcome.ok,true,'Token hash from magic-link callback should be verified');
assert.equal(outcome.method,'token_hash');
assert.equal(verifyCalls.length,1);
assert.equal(verifyCalls[0].url,'https://example.supabase.co/auth/v1/verify');
assert.deepEqual(JSON.parse(verifyCalls[0].opts.body),{token_hash:'secret-in-link',type:'magiclink'});
assert.equal(location.search,'','Secret hash must be removed from URL');
store.clear();verifyCalls=[];

nav('https://kh31104.github.io/jobfit/instructor/work24-pilot/#error=access_denied&error_code=otp_expired');
outcome=await captureAuthCallback();
assert.equal(outcome.ok,false);
assert.match(outcome.reason,/otp_expired/);
assert.equal(location.hash,'','Error code callback is removed from URL');

nav('https://kh31104.github.io/jobfit/instructor/work24-pilot/');
outcome=await captureAuthCallback();
assert.equal(outcome.ok,false);
assert.equal(getSession(),null);

await requestMagicLink('instructor@example.com');
assert.equal(verifyCalls.length,1,'Sign-in should send only one request');
const u=new URL(verifyCalls[0].url);
assert.equal(u.searchParams.get('redirect_to'),'https://kh31104.github.io/jobfit/instructor/work24-pilot/');
assert.deepEqual(JSON.parse(verifyCalls[0].opts.body),{email:'instructor@example.com',create_user:false});
console.log('INJE instructor callback implicit + query + token_hash + error + no-session checks PASS');
