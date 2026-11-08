// Public aggregate-data transport only; no student information or research submission.
const ENDPOINT='https://hllnoriffbhzpyhpnvsf.supabase.co/functions/v1/univ-alimi-faculty-pilot';
export async function fetchUniversityAlimi({school,year,kind}){
  const url=new URL(ENDPOINT);
  url.searchParams.set('school',school);
  url.searchParams.set('year',String(year));
  url.searchParams.set('kind',kind);
  const response=await fetch(url.toString(),{
    method:'GET',headers:{Accept:'application/json'},cache:'no-store',
    signal:AbortSignal.timeout(14000)
  });
  return {status:response.status,body:await response.json(),ok:response.ok};
}