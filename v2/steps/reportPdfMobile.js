// Mobile-safe direct PDF download for INJE STEP 6.
// This module uses a clone of the existing report DOM only. It never reads or writes learner storage.
let loader;
const EXPORT_LAYOUT=`
.jobfitPdfExport{display:block!important;width:182mm!important;max-width:none!important;margin:0!important;padding:0!important;background:#fff!important}
.jobfitPdfExport .reportPage{display:flex!important;flex-direction:column!important;width:182mm!important;max-width:none!important;min-height:267mm!important;height:auto!important;aspect-ratio:auto!important;margin:0!important;padding:0!important;background:#fff!important;border:0!important;box-shadow:none!important;break-inside:auto!important}
.jobfitPdfExport .reportGrid2{grid-template-columns:minmax(0,1fr) minmax(0,1fr)!important}
.jobfitPdfExport .reportGrid3{grid-template-columns:repeat(3,minmax(0,1fr))!important}
.jobfitPdfExport .reportTable .tr{grid-template-columns:1.15fr 1.2fr .7fr!important}
.jobfitPdfExport .jobAnalysisReport .tr{grid-template-columns:140px minmax(0,1fr)!important}
.jobfitPdfExport .evidenceReportTable .tr.th{display:grid!important}
.jobfitPdfExport .evidenceReportTable .tr>div[data-label]:before{content:none!important}
.jobfitPdfExport .evidenceReportTable .tr>div+div{border-top:0!important}
.jobfitPdfExport .reportMeta{margin-top:auto!important}
`;

function loadEngine(){
  if(typeof window.html2pdf==='function')return Promise.resolve();
  if(loader)return loader;
  const sources=[
    'https://cdn.jsdelivr.net/npm/html2pdf.js@0.10.3/dist/html2pdf.bundle.min.js',
    'https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js'
  ];
  loader=(async()=>{
    for(const src of sources){
      try{
        await new Promise((resolve,reject)=>{
          const script=document.createElement('script');
          script.src=src;
          script.async=true;
          script.onload=resolve;
          script.onerror=()=>reject(new Error('PDF generator unavailable'));
          document.head.appendChild(script);
        });
        if(typeof window.html2pdf==='function')return;
      }catch(err){console.warn('STEP 6 PDF generator source unavailable:',src,err);}
    }
    throw new Error('PDF generator failed to load');
  })().catch(error=>{loader=null;throw error;});
  return loader;
}

async function renderReportPdfBlob(source){
  if(!source||source.querySelectorAll('.reportPage').length!==3){
    throw new Error('The existing three-section report is not available.');
  }
  await loadEngine();
  // Clone the complete rendered report, including every list and text node.
  // Force A4 layout in the clone on narrow screens, leaving the visible preview unchanged.
  const copy=source.cloneNode(true);
  copy.removeAttribute('id');
  copy.classList.add('jobfitPdfExport');
  const style=document.createElement('style');
  style.textContent=EXPORT_LAYOUT;
  document.head.appendChild(style);
  try{
    return await window.html2pdf().set({
      margin:[14,14,16,14],
      filename:'MY_JOBFIT_REPORT_v1.pdf',
      image:{type:'jpeg',quality:0.98},
      html2canvas:{scale:Math.min(1.6,Math.max(1,window.devicePixelRatio||1.3)),useCORS:true,backgroundColor:'#ffffff',scrollX:0,scrollY:0},
      jsPDF:{unit:'mm',format:'a4',orientation:'portrait',compress:true},
      pagebreak:{mode:['css','legacy'],before:['.reportPage + .reportPage'],avoid:['.reportBox','.competencyEvidenceRow','.reportTable .tr']}
    }).from(copy).outputPdf('blob');
  }finally{style.remove();}
}

// Mobile WebViews can ignore downloads from detached anchors or URLs revoked too soon.
function downloadPdfBlob(blob){
  const url=URL.createObjectURL(blob),a=document.createElement('a');
  a.href=url;a.download='MY_JOBFIT_REPORT_v1.pdf';a.style.display='none';
  document.body.appendChild(a);
  try{a.click()}finally{a.remove();setTimeout(()=>URL.revokeObjectURL(url),180000)}
}
export async function saveReportPdf(source){
  const blob=await renderReportPdfBlob(source);
  downloadPdfBlob(blob);
}
// Reserve a PDF viewer synchronously from the user's tap to bypass popup blocking.
export function openReportPdfWindow(){
  const popup=window.open('','_blank');
  if(popup){try{popup.document.title='MY JOBFIT REPORT';popup.document.body.textContent='PDF 생성 중…';}catch{}}
  return popup;
}
export async function showReportPdf(source,popup){
  try{
    const blob=await renderReportPdfBlob(source);
    const url=URL.createObjectURL(blob);
    if(popup&&!popup.closed){
      popup.location.replace(url);
      setTimeout(()=>URL.revokeObjectURL(url),300000);
    }else{
      URL.revokeObjectURL(url);
      downloadPdfBlob(blob);
    }
  }catch(error){try{popup?.close()}catch{}throw error}
}

// Start loading while the student reviews the report, before tapping the download button.
if(typeof window!=='undefined'&&typeof document!=='undefined')loadEngine().catch(()=>{});
