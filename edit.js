/* 편집 모드 — 홈페이지 주소 뒤에 ?edit 을 붙였을 때만 불러옴.
   화면에서 고친 내용을 GitHub 저장소의 info.js 에 저장한다.
   열쇠(토큰)는 이 브라우저에만 저장되고 저장소에는 올라가지 않는다. */
(function () {
  const GH = { owner: 'leeyj6262-sketch', repo: 'portfolio', path: 'info.js', branch: 'main' };
  const API = 'https://api.github.com/repos/' + GH.owner + '/' + GH.repo + '/contents/' + GH.path;
  const TOKEN_KEY = 'portfolio_edit_token';

  // [키, 라벨, 종류]  종류: text(기본) | area | list
  const GROUPS = [
    ['첫 화면', [
      ['한줄_윗줄', '한 줄 소개 · 윗줄'],
      ['한줄_강조', '한 줄 소개 · 강조 단어 (골드색)'],
      ['한줄_아랫줄', '한 줄 소개 · 강조 단어 뒤'],
      ['소개문장', '소개 문장', 'area'],
      ['토익', 'TOEIC (첫 화면 숫자)'],
    ]],
    ['명함', [['이름', '이름'], ['학교', '학교'], ['학과학년', '학과 · 전공'], ['이메일', '이메일'], ['전화', '전화번호']]],
    ['기본 정보', [['졸업예정', '졸업예정'], ['거주지', '거주지 (시/구까지만 추천)'], ['희망직무', '희망직무'], ['관심분야', '관심분야'], ['취미', '취미']]],
    ['자기소개', [
      ['자기소개1', '① 왜 부동산금융에 관심을 갖게 됐는지', 'area'],
      ['자기소개2', '② 무엇을 공부하고 만들어 왔는지', 'area'],
      ['자기소개3', '③ 입사하면 어떤 일을 하고 싶은지', 'area'],
    ]],
    ['성격', [['MBTI', 'MBTI'], ['MBTI별명', 'MBTI 별명'], ['MBTI설명', '이 성향이 일할 때 어떻게 드러나는지', 'area'], ['강점', '강점', 'area'], ['일하는방식', '일하는 방식', 'area']]],
    ['역량', [['역량', '한 줄에 하나씩:  분야 | 항목, 항목, 항목', 'list']]],
    ['경력 · 활동 · 수상', [['경력', '한 줄에 하나씩 (최신순):  기간 | 제목 | 설명', 'list']]],
    ['자격증 · 어학', [['자격증', '한 줄에 하나씩:  이름 | 점수·등급', 'list']]],
    ['저와 함께 일하면', [['약속', '한 줄에 하나씩:  약속 | 근거', 'list']]],
    ['링크 (주소 전체, 비우면 버튼 숨김)', [['링크드인', 'LinkedIn'], ['블로그', '블로그'], ['인스타그램', '인스타그램'], ['카카오오픈채팅', '카카오톡 오픈채팅']]],
  ];

  let data = JSON.parse(JSON.stringify(window.MY_INFO || {}));
  let dirty = false;

  const HEADER = '/* 내 정보 파일.\n   홈페이지 주소 뒤에 ?edit 을 붙여 들어가면 화면에서 바로 고칠 수 있습니다.\n   (메모장으로 직접 고칠 때는 따옴표 " " 안의 글자만 바꾸세요. 비워두면 그 항목은 숨겨집니다.) */\n';
  const fileText = d => HEADER + 'window.MY_INFO = ' + JSON.stringify(d, null, 2) + ';\n';
  const parseFile = t => { const i = t.indexOf('{', t.indexOf('window.MY_INFO')); return JSON.parse(t.slice(i, t.lastIndexOf('}') + 1)); };
  const b64 = s => { const b = new TextEncoder().encode(s); let o = ''; b.forEach(c => o += String.fromCharCode(c)); return btoa(o); };

  // ── 화면 ──
  const css = document.createElement('style');
  css.textContent = `
    #ed-fab { position: fixed; right: 16px; bottom: 16px; z-index: 200; background: #c9a24b; color: #14213d; border: 0; border-radius: 999px; padding: 13px 20px; font: 700 15px inherit; box-shadow: 0 8px 24px rgba(0,0,0,.25); cursor: pointer; }
    #ed-panel { position: fixed; top: 0; right: 0; bottom: 0; width: 400px; max-width: 100%; z-index: 210; background: #fff; box-shadow: -12px 0 40px rgba(0,0,0,.18); display: flex; flex-direction: column; font-size: 14px; color: #1b1f2a; }
    #ed-panel[hidden] { display: none; }
    #ed-head { padding: 14px 16px; background: #14213d; color: #fff; display: flex; align-items: center; justify-content: space-between; gap: 8px; }
    #ed-head b { font-size: 16px; }
    #ed-body { flex: 1; overflow-y: auto; padding: 6px 16px 20px; }
    #ed-body details { border-bottom: 1px solid #e4e7ee; }
    #ed-body summary { padding: 13px 0; font-weight: 700; color: #14213d; cursor: pointer; }
    #ed-body label { display: block; font-size: 12px; color: #6b7280; margin: 8px 0 4px; }
    #ed-body input, #ed-body textarea { width: 100%; border: 1px solid #d5d9e2; border-radius: 8px; padding: 9px 10px; font: 14px/1.5 inherit; color: inherit; background: #fff; }
    #ed-body textarea { min-height: 84px; resize: vertical; }
    #ed-body textarea.list { min-height: 130px; white-space: pre; overflow-x: auto; }
    #ed-body details > div { padding-bottom: 14px; }
    #ed-foot { padding: 12px 16px; border-top: 1px solid #e4e7ee; background: #f6f7fa; }
    #ed-foot .row { display: flex; gap: 8px; }
    .ed-btn { border: 0; border-radius: 8px; padding: 11px 14px; font: 700 14px inherit; cursor: pointer; }
    .ed-save { flex: 1; background: #14213d; color: #fff; }
    .ed-save:disabled { opacity: .5; cursor: default; }
    .ed-sub { background: #fff; color: #14213d; border: 1px solid #d5d9e2; }
    .ed-x { background: transparent; color: #fff; border: 1px solid rgba(255,255,255,.4); padding: 7px 12px; }
    #ed-status { font-size: 13px; margin-top: 8px; min-height: 18px; color: #6b7280; }
    #ed-status.ok { color: #2f6b45; } #ed-status.err { color: #b3261e; }
    #ed-token { margin-bottom: 10px; padding: 12px; background: #fff; border: 1px solid #c9a24b; border-radius: 10px; font-size: 13px; }
    #ed-token input { width: 100%; margin: 8px 0; border: 1px solid #d5d9e2; border-radius: 8px; padding: 9px 10px; font: 14px inherit; }
    #ed-token a { color: #14213d; text-decoration: underline; }
  `;
  document.head.appendChild(css);

  const fab = document.createElement('button');
  fab.id = 'ed-fab'; fab.textContent = '✏️ 편집';
  const panel = document.createElement('div');
  panel.id = 'ed-panel';
  panel.innerHTML = `
    <div id="ed-head"><b>✏️ 내 정보 편집</b><button class="ed-btn ed-x" id="ed-close">미리보기</button></div>
    <div id="ed-body"></div>
    <div id="ed-foot">
      <div id="ed-token" hidden>
        <b>처음 한 번만: 열쇠(토큰) 넣기</b><br>
        이 홈페이지를 고칠 수 있는 사람이 본인뿐이도록 하는 열쇠입니다. 이 기기에만 저장됩니다.
        <input type="password" id="ed-token-in" placeholder="github_pat_… 붙여넣기" autocomplete="off">
        <button class="ed-btn ed-save" id="ed-token-ok" style="width:100%">열쇠 저장하고 계속</button>
      </div>
      <div class="row">
        <button class="ed-btn ed-save" id="ed-save">저장하기</button>
        <button class="ed-btn ed-sub" id="ed-dl" title="info.js 파일로 내려받기">파일로 받기</button>
      </div>
      <div id="ed-status"></div>
    </div>`;
  document.body.append(fab, panel);

  const $ = id => document.getElementById(id);
  const status = (msg, cls) => { $('ed-status').textContent = msg; $('ed-status').className = cls || ''; };

  function buildForm() {
    const body = $('ed-body'); body.textContent = '';
    GROUPS.forEach(([title, fields], gi) => {
      const det = document.createElement('details'); if (gi === 0) det.open = true;
      const sum = document.createElement('summary'); sum.textContent = title;
      const box = document.createElement('div');
      fields.forEach(([key, label, kind]) => {
        const lab = document.createElement('label'); lab.textContent = label;
        const el = document.createElement(kind ? 'textarea' : 'input');
        if (kind === 'list') { el.className = 'list'; el.value = (data[key] || []).join('\n'); }
        else el.value = data[key] || '';
        el.addEventListener('input', () => {
          data[key] = kind === 'list' ? el.value.split('\n').map(s => s.trim()).filter(Boolean) : el.value;
          dirty = true; status('저장하지 않은 변경이 있어요.');
          window.renderInfo(data);
        });
        box.append(lab, el);
      });
      det.append(sum, box); body.appendChild(det);
    });
  }

  fab.onclick = () => { panel.hidden = false; };
  $('ed-close').onclick = () => { panel.hidden = true; };
  window.addEventListener('beforeunload', e => { if (dirty) { e.preventDefault(); e.returnValue = ''; } });

  $('ed-dl').onclick = () => {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([fileText(data)], { type: 'text/javascript' }));
    a.download = 'info.js'; a.click(); URL.revokeObjectURL(a.href);
    status('info.js 를 내려받았어요. 폴더의 같은 파일에 덮어쓰면 됩니다.');
  };

  $('ed-token-ok').onclick = () => {
    const t = $('ed-token-in').value.trim();
    if (!t) return;
    try { localStorage.setItem(TOKEN_KEY, t); } catch (e) {}
    $('ed-token-in').value = ''; $('ed-token').hidden = true;
    save();
  };

  async function save() {
    let token = null;
    try { token = localStorage.getItem(TOKEN_KEY); } catch (e) {}
    if (!token) { $('ed-token').hidden = false; status('열쇠를 넣으면 저장돼요.'); return; }
    const btn = $('ed-save'); btn.disabled = true; status('저장하는 중…');
    const h = { Authorization: 'Bearer ' + token, Accept: 'application/vnd.github+json' };
    try {
      let r = await fetch(API + '?ref=' + GH.branch, { headers: h, cache: 'no-store' });
      if (r.status === 401) { try { localStorage.removeItem(TOKEN_KEY); } catch (e) {} $('ed-token').hidden = false; throw new Error('열쇠가 맞지 않아요. 다시 넣어 주세요.'); }
      if (!r.ok) throw new Error('현재 파일을 읽지 못했어요 (' + r.status + ').');
      const sha = (await r.json()).sha;
      r = await fetch(API, { method: 'PUT', headers: h, body: JSON.stringify({ message: '홈페이지에서 내 정보 수정', content: b64(fileText(data)), sha: sha, branch: GH.branch }) });
      if (r.status === 403 || r.status === 404) throw new Error('이 열쇠에 쓰기 권한이 없어요. (Contents: Read and write 필요)');
      if (!r.ok) throw new Error('저장에 실패했어요 (' + r.status + '). 잠시 뒤 다시 눌러 주세요.');
      dirty = false; status('저장됐어요. 1~2분 뒤 모든 방문자에게 반영돼요.', 'ok');
    } catch (e) { status(e.message, 'err'); }
    btn.disabled = false;
  }
  $('ed-save').onclick = save;

  // 페이지가 캐시된 옛 버전일 수 있으니, 저장소의 최신 info.js 를 다시 읽어 폼을 채운다
  (async () => {
    buildForm(); status('최신 내용을 불러오는 중…');
    try {
      const r = await fetch(API + '?ref=' + GH.branch, { headers: { Accept: 'application/vnd.github.raw' }, cache: 'no-store' });
      if (r.ok) { data = parseFile(await r.text()); window.renderInfo(data); buildForm(); }
      status('');
    } catch (e) { status(''); }
  })();
})();
