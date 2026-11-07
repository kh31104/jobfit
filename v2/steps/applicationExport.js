// 인제대 STEP 8·9 문서별 출력. 브라우저에 있는 원문을 서버로 전송하지 않습니다.
const clean = value => String(value ?? '').replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
export const escapeDocumentText = clean;

export function printApplicationDocument(title, body, notify) {
  // 인쇄창은 사용자 클릭 이벤트 중에 열어 모바일 팝업 차단 가능성을 줄입니다.
  const win = window.open('', '_blank');
  if (!win) { notify?.('인쇄창이 차단되었습니다. 브라우저의 팝업 허용 후 다시 눌러주세요.'); return false; }
  const html = '<!doctype html><html lang="ko"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">'
    + '<title>' + clean(title) + '</title><style>'
    + '@page{size:A4;margin:16mm}*{box-sizing:border-box}body{margin:0;color:#111827;font-family:"Noto Sans KR","Malgun Gothic",Arial,sans-serif;font-size:11pt;line-height:1.7}'
    + 'h1{font-size:21pt;margin:0 0 14mm;border-bottom:2px solid #243149;padding-bottom:5mm}h2{font-size:13pt;margin:7mm 0 3mm;padding-bottom:2mm;border-bottom:1px solid #cbd5e1}'
    + 'h3{font-size:11pt;margin:4mm 0}p{margin:2mm 0;white-space:pre-wrap;overflow-wrap:anywhere}section{break-inside:auto}.docItem{break-inside:avoid;border-bottom:1px solid #e2e8f0;padding:4mm 0}'
    + '.docMeta{font-size:9pt;color:#526071}.docBody{white-space:pre-wrap;overflow-wrap:anywhere;word-break:keep-all}.resumeA4Sheet{width:100%!important;min-height:0!important;padding:0!important;border:0!important;box-shadow:none!important}'
    + 'table{width:100%;border-collapse:collapse;font-size:9pt;table-layout:auto}td,th{padding:5px;border:1px solid #cbd5e1;vertical-align:top;overflow-wrap:anywhere}th{background:#f1f5f9}button{display:none}'
    + '.resumeA4Sheet.injeResumePrint section>div{font-size:9.5pt!important;line-height:1.5!important}.resumeA4Sheet.injeResumePrint section h2{font-size:12pt!important}'
    + '.resumeA4Sheet.injeResumePrint table{width:100%!important;table-layout:fixed!important;font-size:9pt!important}'
    + '.resumeA4Sheet.injeResumePrint td,.resumeA4Sheet.injeResumePrint th{font-size:9pt!important;line-height:1.45!important;padding:5px!important;overflow-wrap:anywhere;word-break:break-word;white-space:normal}'
    + '.resumeA4Sheet.injeResumePrint tr{break-inside:avoid}.resumeA4Sheet.injeResumePrint>div:first-child>div:last-child{font-size:9pt!important}'
    + '@media screen and (max-width:760px){body:has(.injeResumePrint){padding:12px!important;max-width:100%!important}.injeResumePrint{max-width:100%!important}'
    + '.injeResumePrint table,.injeResumePrint tbody,.injeResumePrint tr{display:block!important;width:100%!important}.injeResumePrint thead{display:none!important}'
    + '.injeResumePrint tr{margin:0 0 10px;border:1px solid #d8dde6;border-radius:6px;overflow:hidden}'
    + '.injeResumePrint td{display:grid!important;grid-template-columns:minmax(85px,38%) minmax(0,1fr);gap:8px;align-items:start;width:100%!important;max-width:100%!important;min-width:0;border:0!important;border-bottom:1px solid #e5e7eb!important;padding:7px!important}'
    + '.injeResumePrint td:last-child{border-bottom:0!important}.injeResumePrint td:before{content:attr(data-label);font-weight:700;color:#475569;overflow-wrap:anywhere}}'
    + '@media screen{body{max-width:210mm;margin:0 auto;padding:16mm}.printHint{display:block;margin-bottom:14px;padding:9px;background:#f1f5f9;font-size:10pt}}'
    + '@media print{.printHint{display:none}}'
    + '</style></head><body><div class="printHint">문서가 새 창에서 열렸습니다. 브라우저의 인쇄 메뉴에서 PDF로 저장하세요. 모바일에서는 공유 → 프린트/인쇄를 사용할 수 있습니다.</div>'
    + body + '</body></html>';
  win.document.open();
  win.document.write(html);
  win.document.close();
  // 모바일 Safari에서는 자동 인쇄가 막힐 수 있으므로 문서 자체를 새 탭에 유지합니다.
  if (!/iPad|iPhone|iPod/i.test(navigator.userAgent)) {
    win.setTimeout(() => { try { win.focus(); win.print(); } catch { notify?.('새 탭에서 브라우저 인쇄 메뉴를 사용하세요.'); } }, 350);
  }
  return true;
}

export function downloadApplicationText(filename, text, notify) {
  const safeName = String(filename || 'jobfit-document').replace(/[\\/:*?"<>|\u0000-\u001f]/g, '_');
  const blob = new Blob(['\uFEFF' + String(text || '')], {type:'text/plain;charset=utf-8'});
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = safeName.endsWith('.txt') ? safeName : safeName + '.txt';
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 120000);
  notify?.('개별 문서의 텍스트 파일 저장을 요청했습니다.');
}