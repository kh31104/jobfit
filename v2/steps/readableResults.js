// Display-only formatting for saved Jobfit student results.
// Never normalize, migrate or write the returned presentation text into stored state.
export function readLines(value){
  const text=String(value??'').replace(/\r\n?/g,'\n').trim();
  if(!text)return [];
  return text
    .split(/\n+|\s+\/\s+|\s+[•●▪]\s+/)
    .map(line=>line.trim().replace(/^\s*(?:[•●▪*]|-\s+|\d+[.)]\s+)/,'').trim())
    .filter(Boolean);
}
export function readValue(value,ctx){
  const lines=readLines(value);
  if(!lines.length)return '<p class="jfReadEmpty">아직 기록이 없습니다.</p>';
  if(lines.length===1)return '<p class="jfReadProse">'+ctx.escapeHtml(lines[0])+'</p>';
  return '<ul class="jfReadBullets">'+lines.map(line=>'<li>'+ctx.escapeHtml(line)+'</li>').join('')+'</ul>';
}
export function readField(label,value,ctx){
  return '<div class="jfReadField"><b>'+ctx.escapeHtml(label)+'</b>'+readValue(value,ctx)+'</div>';
}
export function readCard(title,fields,ctx,meta=''){
  return '<article class="jfReadCard"><div class="jfReadTitle"><strong>'+ctx.escapeHtml(title)+'</strong>'+(meta?'<small>'+ctx.escapeHtml(meta)+'</small>':'')+'</div><div class="jfReadFields">'+fields.map(([label,value])=>readField(label,value,ctx)).join('')+'</div></article>';
}
export const READABLE_STYLES=`<style>
.jobfitReadable .jfReadCard{min-width:0;border:1px solid #e1e7f0;border-radius:14px;padding:15px;background:#fff;overflow-wrap:anywhere;word-break:keep-all}
.jobfitReadable .jfReadCards{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px;margin:12px 0}
.jobfitReadable .jfReadTitle{display:flex;flex-wrap:wrap;align-items:baseline;gap:6px 12px;padding-bottom:9px;border-bottom:1px solid #eef0f4}
.jobfitReadable .jfReadTitle strong{font-size:15px;line-height:1.55;overflow-wrap:anywhere}
.jobfitReadable .jfReadTitle small{color:#667085;line-height:1.6;font-size:12px}
.jobfitReadable .jfReadFields{display:grid;gap:10px;margin-top:10px}
.jobfitReadable .jfReadField{min-width:0;background:#fbfcff;border:1px solid #e6ebf4;border-radius:10px;padding:11px 12px}
.jobfitReadable .jfReadField>b{display:block;font-size:12px;color:#40506a;margin-bottom:7px;line-height:1.4}
.jobfitReadable .jfReadProse{white-space:pre-wrap;line-height:1.75;font-size:14px;margin:0;overflow-wrap:anywhere;word-break:keep-all}
.jobfitReadable .jfReadBullets{margin:0;padding-left:20px;line-height:1.75;font-size:14px}
.jobfitReadable .jfReadBullets li{overflow-wrap:anywhere;word-break:keep-all;white-space:pre-wrap}
.jobfitReadable .jfReadBullets li+li{margin-top:7px}
.jobfitReadable .jfReadEmpty{margin:0;color:#667085;font-size:13px}
.jobfitReadable .jfResultBox{min-width:0;overflow-wrap:anywhere;word-break:keep-all}
.jobfitReadable .jfResultBox .listHead{gap:10px;align-items:flex-start}
.jobfitReadable .jfResultBox .listHead>div{min-width:0}
.jobfitReadable .jfResultBox .listHead h3{font-size:15px;line-height:1.5;overflow-wrap:anywhere;word-break:keep-all}
.jobfitReadable .jfResultBox .jfReadFields{grid-template-columns:repeat(2,minmax(0,1fr))}
.jobfitReadable .jfLongSelect{min-width:0;max-width:100%;text-overflow:ellipsis}
.jobfitReadable .jfReadNote{margin-top:8px;font-size:12px;color:#667085;line-height:1.6}
.jobfitReadable .jfDocBlock{margin:11px 0;padding:10px 12px;border:1px solid #e7ebf1;border-radius:10px;background:#fff}
.jobfitReadable .jfDocBlock p{margin:4px 0 0;white-space:pre-wrap;overflow-wrap:anywhere;line-height:1.7}
@media(max-width:760px){
  .jobfitReadable .jfReadCards,.jobfitReadable .jfResultBox .jfReadFields{grid-template-columns:minmax(0,1fr)}
  .jobfitReadable .jfReadCard{padding:12px}
  .jobfitReadable .jfReadField{padding:10px 11px}
  .jobfitReadable .jfReadProse,.jobfitReadable .jfReadBullets{font-size:14px}
  .jobfitReadable .jfResultBox .listHead{flex-wrap:wrap}
  .jobfitReadable .jfResultBox .listHead .scoreChip{max-width:100%;white-space:normal}
}
</style>`;
