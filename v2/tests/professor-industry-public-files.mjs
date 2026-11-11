import fs from 'node:fs';
const datasets=[
 {id:'3039933',provider:'산업통상부',name:'제조업 경기실사지수동향'},
 {id:'3034791',provider:'중소벤처기업부',name:'중소기업 지원사업목록'},
 {id:'15068435',provider:'KIAT',name:'NTB 기술 카테고리'},
 {id:'15104286',provider:'KIAT',name:'정책간행물 발간 목록'},
 {id:'15135578',provider:'NIA',name:'AI허브 데이터셋 정보'},
 {id:'15165866',provider:'NIA',name:'디지털윤리 동향정보'},
 {id:'15117088',provider:'KIAT',name:'글로벌 동향정보 목록'}
];
const rows=[];
const short=(s,n=200)=>String(s??'').replace(/\s+/g,' ').slice(0,n);
async function get(url,timeout=17000){
 const ac=new AbortController();const t=setTimeout(()=>ac.abort(),timeout);
 try{
  const r=await fetch(url,{signal:ac.signal,headers:{Accept:'text/html,application/json,text/csv,*/*','User-Agent':'Mozilla/5.0 (compatible; JOBFIT-Professor-Industry-File-Test/1.0)'},redirect:'follow'});
  const buf=new Uint8Array(await r.arrayBuffer());
  if(buf.byteLength>25000000)throw Error('file_too_large');
  return {r,buf,text:new TextDecoder('utf-8').decode(buf)};
 }finally{clearTimeout(t);}
}
const responseInfo=x=>({status:x.r.status,bytes:x.buf.length,type:short(x.r.headers.get('content-type'),100),urlHost:new URL(x.r.url).host,disposition:short(x.r.headers.get('content-disposition'),120)});
function csvInfo(bytes){
 const utf=new TextDecoder('utf-8').decode(bytes);
 const body=utf.includes('�')?new TextDecoder('euc-kr').decode(bytes):utf;
 const first=body.replace(/^\ufeff/,'').split(/\r?\n/).filter(Boolean).slice(0,3);
 return {encoding:utf.includes('�')?'EUC-KR/CP949 probable':'UTF-8 probable',header:short(first[0]||'',220),
 firstRow:short(first[1]||'',180),lineCountApprox:body.split(/\r?\n/).length,hasDelimitedColumns:/[,;\t]/.test(first[0]||'')};
}
async function testOne(d){
 const result={...d,landing:'https://www.data.go.kr/data/'+d.id+'/fileData.do',metadata:'https://www.data.go.kr/catalog/'+d.id+'/fileData.json'};
 try{
  const catalog=await get(result.metadata);
  result.catalog=responseInfo(catalog);
  try{const x=JSON.parse(catalog.text);
    result.catalogMeta={name:short(x.name||x.alternateName,110),license:typeof x.license==='string'?x.license:(x.license?.name||''),format:x.encodingFormat||'',modified:x.dateModified||'',numberOfFields:x.variableMeasured?.length||0};
  }catch{result.catalogMeta={error:'metadata_not_json'};}
 }catch(e){result.catalogError=short(e.message);}
 try{
  const p=await get(result.landing);result.landingResponse=responseInfo(p);
  if(!p.r.ok)throw Error('landing_http_'+p.r.status);
  const allCalls=[...p.text.matchAll(/fileDataDown\s*\(([^)]{1,1200})\)/gi)].map(m=>m[1]);
  result.downloadCallCount=allCalls.length;
  result.callbackPreview=allCalls.slice(0,2).map(x=>short(x.replace(/["']/g,''),120));
  const candidates=allCalls.map(call=>[...call.matchAll(/['"]([^'"]+)['"]/g)].map(m=>m[1]));
  const args=candidates.find(a=>a.some(x=>x.includes('uddi:')))||candidates[0]||[];
  const pk=args.find(x=>/^\d{7,9}$/.test(x))||d.id;
  let uddi=args.find(x=>x.startsWith('uddi:'))?.replace(/^uddi:/,'')||'';
  if(!uddi)uddi=(p.text.match(/uddi:([0-9a-fA-F-]{28,50})/)||[])[1]||'';
  result.identifiers={pkFound:!!pk,uddiFound:!!uddi};
  if(!uddi)throw Error('uddi_not_in_public_html');
  const metaUrl=new URL('https://www.data.go.kr/tcs/dss/selectFileDataDownload.do');
  metaUrl.searchParams.set('publicDataDetailPk','uddi:'+uddi);
  metaUrl.searchParams.set('publicDataPk',pk);
  metaUrl.searchParams.set('atchFileId','');
  metaUrl.searchParams.set('fileDetailSn','1');
  metaUrl.searchParams.set('url','/tcs/dss/selectFileDataDownload.do');
  const info=await get(metaUrl.href);
  result.downloadMetadata=responseInfo(info);
  if(!info.r.ok)throw Error('download_metadata_http_'+info.r.status);
  const j=JSON.parse(info.text);
  const fid=j.atchFileId,serial=j.fileDetailSn,name=j.dataSetFileDetailInfo?.dataNm||d.name;
  result.fileMetadataFound={fileId:!!fid,serial:!!serial,dataName:!!name};
  if(!fid||!serial)throw Error('download_metadata_missing_file');
  const url=new URL('https://www.data.go.kr/cmm/cmm/fileDownload.do');
  url.searchParams.set('atchFileId',fid);
  url.searchParams.set('fileDetailSn',String(serial));
  url.searchParams.set('dataNm',name);
  const file=await get(url.href,22000);
  result.file=responseInfo(file);
  if(!file.r.ok)throw Error('download_http_'+file.r.status);
  result.csv=csvInfo(file.buf);
  if(!result.csv.hasDelimitedColumns||!file.buf.length||/html/i.test(file.r.headers.get('content-type')||''))throw Error('body_not_valid_csv');
  result.receivedRealCsv=true;
 }catch(e){result.receivedRealCsv=false;result.failure=short(e.message);}
 console.log('PUBLIC_FILE_CHECK',JSON.stringify(result));
 return result;
}
for(const d of datasets)rows.push(await testOne(d));
fs.mkdirSync('public-industry-probe',{recursive:true});
fs.writeFileSync('public-industry-probe/public-industry-receipt.json',JSON.stringify({checkedAt:new Date().toISOString(),notes:'Read only, no keys, no login, no student data. Files not republished; samples truncated.',rows},null,2));
console.log('SUMMARY',JSON.stringify({checked:rows.length,csvReceived:rows.filter(x=>x.receivedRealCsv).length,metadataReceived:rows.filter(x=>x.catalog?.status===200).length}));
