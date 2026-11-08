// Read-only public file adapter. Never imports student app storage or API secrets.
export const SOURCES=Object.freeze({
  bsi:{id:'3039933',uddi:'b4920d79-3524-4859-a2fa-816dd81197f7',provider:'산업통상부',title:'제조업 경기실사지수동향',field:'economy',baseDate:'2026-06-30',license:'공공데이터포털 원문 표시',url:'https://www.data.go.kr/data/3039933/fileData.do'},
  support:{id:'3034791',uddi:'574dac6b-acff-4508-93b4-965959bf686e',provider:'중소벤처기업부',title:'중소기업지원사업목록',field:'policy',baseDate:'2026-09-01',license:'공공저작물 제1유형·출처표시',url:'https://www.data.go.kr/data/3034791/fileData.do'},
  ethics:{id:'15165866',uddi:'d4f85d54-1b1c-4bbc-acb2-b4188c1b7b13',provider:'한국지능정보사회진흥원',title:'디지털윤리 동향정보',field:'society',baseDate:'2026-09-17',license:'공공데이터포털 이용허락범위 제한 없음·출처표시 권장',url:'https://www.data.go.kr/data/15165866/fileData.do'}
});
export function csvParse(text,maxRows=19000){
  // Handle commas, quoted newlines and escaped double quotes.
  const rows=[];let row=[],cell='',quoted=false;
  const input=String(text).replace(/^\ufeff/,'');
  for(let i=0;i<input.length;i++){
    const ch=input[i];
    if(quoted){
      if(ch==='"'&&input[i+1]==='"'){cell+='"';i++;}
      else if(ch==='"')quoted=false;
      else cell+=ch;
    }else if(ch==='"'&&cell==='')quoted=true;
    else if(ch===','){row.push(cell);cell='';}
    else if(ch==='\n'){row.push(cell.replace(/\r$/,''));if(row.some(Boolean))rows.push(row);row=[];cell='';if(rows.length>=maxRows)break;}
    else cell+=ch;
  }
  if(row.length||cell){row.push(cell.replace(/\r$/,''));if(row.some(Boolean))rows.push(row);}
  if(!rows.length||rows[0].length<2)throw Error('invalid_csv');
  const headers=rows[0].map(x=>x.trim().replace(/^\ufeff/,''));
  return {headers,records:rows.slice(1).map(row=>Object.fromEntries(headers.map((h,i)=>[h,(row[i]||'').trim()])))};
}
const clean=(s,n=170)=>String(s||'').replace(/\s+/g,' ').trim().slice(0,n);
const safeUrl=u=>{try{const a=new URL(String(u));return a.protocol==='https:'||a.protocol==='http:'?a.href:''}catch{return ''}};
function latest(headers,regex){return headers.filter(h=>regex.test(h)).at(-1)||'';}
export function transform(kind,table,keyword='',limit=10){
  const q=clean(keyword,40).toLowerCase();
  const rows=table.records;let eligible=[];
  if(kind==='bsi'){
    const actualKey=latest(table.headers,/현황/);
    const forecastKey=latest(table.headers,/전망/);
    eligible=rows.filter(r=>!q||clean(r['업종분류']).toLowerCase().includes(q)).map(r=>({
      title:clean(r['업종분류'],80),actualLabel:actualKey,actual:clean(r[actualKey],40),
      forecastLabel:forecastKey,forecast:clean(r[forecastKey],40),
      evidence:'산업통상부 조사 BSI 원자료. 전망과 현황은 별도 지표이며 채용 증감과 직접 연결되지 않음.'
    }));
  }else if(kind==='support'){
    eligible=rows.filter(r=>!q||[r['분야'],r['공고명'],r['소관기관'],r['수행기관']].some(x=>clean(x).toLowerCase().includes(q))).map(r=>({
      title:clean(r['공고명'],160),category:clean(r['분야'],40),agency:clean(r['소관기관'],75),
      agency2:clean(r['수행기관'],75),start:clean(r['신청시작일자'],18),end:clean(r['신청종료일자'],18),
      posted:clean(r['등록일자'],18),original:safeUrl(r['상세URL']),
      evidence:'지원사업 안내. 지원기간은 파일 기준일 당시 값이며 현재 접수 중 여부는 원문 확인 필요.'
    }));
  }else if(kind==='ethics'){
    eligible=rows.filter(r=>!q||[r['제목'],r['내용'],r['연도']].some(x=>clean(x,2000).toLowerCase().includes(q))).map(r=>({
      title:clean(r['제목'],150),year:clean(r['연도'],20),summary:clean(r['내용'],260),
      evidence:'자료명·요약·연도 정보. 최신 정책 시행 여부 또는 특정 직무 채용의 증거는 아님.'
    }));
  }else throw Error('invalid_dataset_kind');
  return {matched:eligible.length,records:eligible.slice(0,Math.max(1,Math.min(10,Number(limit)||10)))};
}
export async function fetchPublicCsv(kind,fetcher=fetch){
  const source=SOURCES[kind];if(!source)throw Error('unsupported_source');
  const metadata=new URL('https://www.data.go.kr/tcs/dss/selectFileDataDownload.do');
  metadata.searchParams.set('publicDataDetailPk','uddi:'+source.uddi);
  metadata.searchParams.set('publicDataPk',source.id);
  metadata.searchParams.set('atchFileId','');
  metadata.searchParams.set('fileDetailSn','1');
  metadata.searchParams.set('url','/tcs/dss/selectFileDataDownload.do');
  const opts={headers:{Accept:'application/json, text/csv,*/*','User-Agent':'JOBFIT-Professor-Public-Industry-Pilot/1.0'},signal:AbortSignal.timeout(25000)};
  const meta=await fetcher(metadata.href,opts);
  if(!meta.ok)throw Error('public_metadata_http_'+meta.status);
  const m=await meta.json();
  if(!m.atchFileId||!m.fileDetailSn)throw Error('public_file_metadata_missing');
  const fileUrl=new URL('https://www.data.go.kr/cmm/cmm/fileDownload.do');
  fileUrl.searchParams.set('atchFileId',m.atchFileId);
  fileUrl.searchParams.set('fileDetailSn',String(m.fileDetailSn));
  fileUrl.searchParams.set('dataNm',m.dataSetFileDetailInfo?.dataNm||source.title);
  const file=await fetcher(fileUrl.href,opts);
  if(!file.ok)throw Error('public_download_http_'+file.status);
  if(Number(file.headers.get('content-length')||0)>8500000)throw Error('public_file_too_large');
  const bytes=await file.arrayBuffer();
  if(bytes.byteLength>8500000)throw Error('public_file_too_large');
  if(bytes.byteLength<60)throw Error('public_file_empty');
  let text=new TextDecoder('utf-8').decode(bytes);
  if(text.includes('\ufffd'))text=new TextDecoder('euc-kr').decode(bytes);
  if(/^\s*<(?:!doctype|html)/i.test(text))throw Error('public_file_not_csv');
  const table=csvParse(text);
  if(!table.headers[0]||!table.records.length)throw Error('public_file_unusable');
  return {table,receivedBytes:bytes.byteLength};
}
