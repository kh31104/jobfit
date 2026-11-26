// KH Writing Inspector. The browser checks wording and never sends the text.
const OPENING = /^(\s*)(결론적으로|종합적으로 볼 때|이를 종합해 보면),? +/u;
const REVIEW_RULES = [
  [/(?:에 있어서|에 대한|을 통해|를 통해)/gu, '번역투 후보', '수단이나 대상이 실제로 필요한지 확인하고, 가능하면 내가 한 행동을 중심으로 쓰세요.'],
  [/(?:혁신적인|시너지를 창출|역량을 극대화|뜻깊은 경험)/gu, '추상적 표현', '원문에 이미 적힌 행동이나 근거가 이 표현을 뒷받침하는지 확인하세요.'],
  [/(?:할 수 있을 것으로 보입니다|할 수 있을 것이라고 생각합니다)/gu, '겹친 완곡 표현', '실제로 확인한 내용과 예상한 내용을 구분하고, 원래 확신의 정도를 유지하세요.'],
  [/(?:되어졌|보여졌|이루어졌)/gu, '피동 표현', '실제 행동 주체가 원문에서 확인되면 주체와 행동을 직접 쓰세요.']
];

export function inspectWriting(text) {
  const findings = [];
  const opening = text.match(OPENING);
  if (opening && /^\p{Script=Hangul}/u.test(text.slice(opening[0].length))) {
    findings.push({word: opening[2], label: '도입 관용구', advice: '앞 문단을 종합하는 기능이 없다면 도입어를 덜어낼 수 있습니다.'});
  }
  for (const [pattern, label, advice] of REVIEW_RULES) {
    for (const word of new Set(Array.from(text.matchAll(pattern), match => match[0]))) {
      findings.push({word, label, advice});
    }
  }
  const connectors = text.match(/(?:^|[.!?]\s+|\n)\s*(?:또한|따라서|나아가|즉)[, ]/gu);
  if (connectors?.length >= 2) {
    findings.push({word: '문장 첫머리 연결어', label: '연결어 반복', advice: '문장의 관계를 보여 주는 연결어만 남기세요.'});
  }
  const suggestion = findings[0]?.label === '도입 관용구'
    ? opening[1] + text.slice(opening[0].length)
    : '';
  return {findings, suggestion};
}

export function mountInjeWritingInspector(root, ctx) {
  const finalAnswer = root.querySelector('#finalAnswer');
  const draft = root.querySelector('#draft');
  const panel = document.createElement('details');
  panel.className = 'detailsBox';
  panel.id = 'khWritingInspector';
  panel.innerHTML = `
    <summary><b>AI 문체 진단 및 교정 (선택)</b></summary>
    <p class="help">이 기능은 번역투나 상투 표현을 찾아 교정을 돕습니다. AI 작성 여부나 확률을 판정하지 않습니다.</p>
    <p class="help">수치·인용·고유명사와 실제 역할·행동·결과를 원문과 대조하세요. 이 진단은 브라우저에서만 진행됩니다.</p>
    <div class="field"><label for="khWritingSource">진단할 답변</label>
      <select id="khWritingSource"><option value="final">최종 답변</option><option value="draft">AI 초안</option></select>
    </div>
    <div class="actions"><button type="button" class="btn secondary" id="khWritingRun">문체 진단</button></div>
    <p class="help" role="status" id="khWritingStatus"></p><ul id="khWritingFindings" style="overflow-wrap:anywhere"></ul>
    <div id="khWritingPreview" hidden>
      <div class="field"><label for="khWritingSuggestion">교정 제안 미리보기</label><textarea id="khWritingSuggestion" rows="5" readonly></textarea></div>
      <div class="actions"><button type="button" class="btn secondary" id="khWritingApply">선택한 답변에 반영</button></div>
    </div>
    <details class="detailsBox" id="khLegacyEvidence"><summary>기존 교정 기록 · 지원서와 면접 일관성 확인 (선택)</summary>
      <div id="khLegacyEvidenceBody"></div>
    </details>`;
  finalAnswer.closest('.field').after(panel);

  const field = id => panel.querySelector('#khWriting' + id);
  const source = field('Source');
  const status = field('Status');
  const list = field('Findings');
  const preview = field('Preview');
  const suggestion = field('Suggestion');
  let reviewed = null;
  function clearResult() {
    reviewed = null;
    status.textContent = '';
    list.replaceChildren();
    preview.hidden = true;
    suggestion.value = '';
  }
  source.addEventListener('change', clearResult);
  finalAnswer.addEventListener('input', clearResult);
  draft.addEventListener('input', clearResult);
  field('Run').addEventListener('click', () => {
    clearResult();
    const target = source.value === 'draft' ? draft : finalAnswer;
    const text = target.value;
    if (!text.trim()) {
      status.textContent = '선택한 답변을 먼저 입력하세요.';
      return;
    }
    const result = inspectWriting(text);
    result.findings.forEach(({word, label, advice}) => {
      const item = document.createElement('li');
      item.textContent = `${label} · ${word} — ${advice}`;
      list.append(item);
    });
    status.textContent = result.findings.length
      ? '문맥에 맞는지 읽어 보고 필요한 부분만 직접 고치세요.'
      : '이 점검 규칙에서 검토할 표현이 발견되지 않았습니다.';
    if (result.suggestion) {
      reviewed = {target, text, suggestion: result.suggestion};
      suggestion.value = result.suggestion;
      preview.hidden = false;
    }
  });
  field('Apply').addEventListener('click', () => {
    if (!reviewed || reviewed.target.value !== reviewed.text) {
      clearResult();
      status.textContent = '답변이 바뀌었습니다. 다시 진단해 주세요.';
      return;
    }
    reviewed.target.value = reviewed.suggestion;
    reviewed.target.dispatchEvent(new Event('input', {bubbles:true}));
    root.querySelector('#factChecked').checked = false;
    status.textContent = '작성란에 반영했습니다. 수치와 경험을 다시 확인한 뒤 기존 저장 버튼으로 저장하세요.';
  });

  const legacy = panel.querySelector('#khLegacyEvidence');
  const legacyBody = panel.querySelector('#khLegacyEvidenceBody');
  let lastCover;
  let loading = false;
  legacy.addEventListener('toggle', async () => {
    const cover = ctx.getState().artifacts?.coverLetterLab;
    if (!legacy.open || loading || (legacyBody.firstElementChild && lastCover === cover)) return;
    loading = true;
    try {
      const {render} = await import('./step12.js?v=35');
      if (!legacy.open || !legacy.isConnected) return;
      lastCover = ctx.getState().artifacts?.coverLetterLab;
      await render(ctx, legacyBody);
    } catch {
      legacyBody.textContent = '기존 기록을 불러오지 못했습니다. 패널을 닫았다가 다시 열어 주세요.';
    } finally {
      loading = false;
    }
  });
}
