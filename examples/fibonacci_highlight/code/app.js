const presets = [
  {name: 'Yellow', color: '#000000', background: '#ffd54f'},
  {name: 'Pink', color: '#000000', background: '#f78ca5'},
  {name: 'Green', color: '#000000', background: '#88e28b'},
  {name: 'Blue', color: '#ffffff', background: '#1175c8'},
  {name: 'Orange', color: '#000000', background: '#ffe0b2'}
];

const state = {
  lines: [],
  highlights: [],
  selectedPreset: 0,
  selectedLines: new Set(),
  lastClickedLine: null,
  lastTextSelection: null
};

function init(){
  const codeEl = document.querySelector('#code code');
  const raw = (codeEl && codeEl.textContent) || '';
  state.lines = raw.replace(/\t/g, '    ').split('\n');
  renderPresets();
  renderCode();
  bindUI();
  renderHighlights();
}

function renderPresets(){
  const cont = document.getElementById('presets');
  cont.innerHTML='';
  presets.forEach((p,i)=>{
    const btn = document.createElement('button');
    btn.className = 'btn btn-sm';
    btn.title = p.name;
    btn.style.padding = '4px 6px';
    btn.style.display = 'inline-flex';
    btn.style.alignItems = 'center';
    btn.style.gap = '6px';
    const sw = document.createElement('span');
    sw.style.width='28px'; sw.style.height='18px'; sw.style.borderRadius='4px';
    sw.style.display='inline-block'; sw.style.background = p.background; sw.style.color = p.color; sw.style.border = '1px solid rgba(0,0,0,0.08)';
    sw.style.boxSizing='border-box';
    sw.innerText = ' ';
    btn.appendChild(sw);
    btn.addEventListener('click', ()=>{ state.selectedPreset = i; updateActivePreset(); });
    cont.appendChild(btn);
  });
  updateActivePreset();
}

function updateActivePreset(){
  const p = presets[state.selectedPreset];
  const el = document.getElementById('activePreset');
  el.innerHTML = '';
  const sw = document.createElement('span');
  sw.style.display='inline-block'; sw.style.width='40px'; sw.style.height='22px'; sw.style.borderRadius='4px'; sw.style.background=p.background; sw.style.color=p.color; sw.style.border='1px solid rgba(0,0,0,0.06)';
  sw.style.verticalAlign='middle';
  el.appendChild(sw);
}

function renderCode(){
  const codeContainer = document.querySelector('#code');
  codeContainer.innerHTML = '';
  state.lines.forEach((line, idx)=>{
    const ln = idx+1;
    const row = document.createElement('div');
    row.className = 'line';
    row.dataset.ln = ln;
    const num = document.createElement('div');
    num.className = 'ln';
    num.textContent = ln;
    num.addEventListener('click', (ev)=>{ onLineNumberClick(ev, ln); });
    const codeText = document.createElement('div');
    codeText.className = 'codeText';
    codeText.textContent = line || '\n';
    row.appendChild(num);
    row.appendChild(codeText);
    codeContainer.appendChild(row);
  });
}

function onLineNumberClick(ev, ln){
  const shift = ev.shiftKey;
  if(shift && state.lastClickedLine){
    const a = Math.min(state.lastClickedLine, ln);
    const b = Math.max(state.lastClickedLine, ln);
    for(let i=a;i<=b;i++) state.selectedLines.add(i);
  } else {
    if(state.selectedLines.has(ln)) state.selectedLines.delete(ln);
    else state.selectedLines.add(ln);
    state.lastClickedLine = ln;
  }
  renderSelectionUI();
}

function renderSelectionUI(){
  document.querySelectorAll('.line').forEach(el=>{
    const ln = Number(el.dataset.ln);
    if(state.selectedLines.has(ln)) el.classList.add('selected-line'); else el.classList.remove('selected-line');
  });
}

function findAncestor(node, cls){
  while(node && node !== document){
    if(node.classList && node.classList.contains && node.classList.contains(cls)) return node;
    node = node.parentNode;
  }
  return null;
}

function bindUI(){
  document.getElementById('addHighlightBtn').addEventListener('click', addHighlightFromSelection);
  document.getElementById('clearSelectionBtn').addEventListener('click', ()=>{ state.selectedLines.clear(); state.lastTextSelection = null; renderSelectionUI(); });
  document.getElementById('copyBtn').addEventListener('click', copyHighlights);

  document.addEventListener('mouseup', ()=>{
    const sel = window.getSelection();
    if(!sel || sel.isCollapsed) return;
    const text = sel.toString();
    if(!text) return;
    const anchorLine = findAncestor(sel.anchorNode, 'line');
    const focusLine = findAncestor(sel.focusNode, 'line');
    if(!anchorLine || !focusLine) return;
    const a = Number(anchorLine.dataset.ln);
    const b = Number(focusLine.dataset.ln);
    if(a === b){
      // single-line text selection -> compute columns
      const lineText = state.lines[a-1] || '';
      let idx = lineText.indexOf(text);
      if(idx === -1){
        // fallback: use anchorOffset heuristic
        idx = 0;
      }
      const startCol = idx + 1;
      const endCol = startCol + text.length - 1;
      state.lastTextSelection = {start_line: a, end_line: a, start_column: startCol, end_column: endCol};
      // visually mark the selected region as selected whole line for convenience
      state.selectedLines.clear(); state.selectedLines.add(a);
      renderSelectionUI();
    } else {
      // multi-line selection -> mark whole lines from min to max
      const start = Math.min(a,b), end = Math.max(a,b);
      for(let i=start;i<=end;i++) state.selectedLines.add(i);
      state.lastTextSelection = null;
      renderSelectionUI();
    }
    sel.removeAllRanges();
  });
}

function addHighlightFromSelection(){
  const preset = presets[state.selectedPreset];
  const ranges = [];
  if(state.lastTextSelection){
    ranges.push(Object.assign({}, state.lastTextSelection));
  } else if(state.selectedLines.size>0){
    const lines = Array.from(state.selectedLines).sort((a,b)=>a-b);
    // coalesce contiguous runs
    let start = lines[0], prev = lines[0];
    for(let i=1;i<lines.length;i++){
      const cur = lines[i];
      if(cur === prev+1){ prev = cur; continue; }
      ranges.push({start_line:start, end_line:prev});
      start = cur; prev = cur;
    }
    ranges.push({start_line:start, end_line:prev});
  } else {
    alert('Select some lines or text first (click line numbers or select text).');
    return;
  }

  const h = {color: preset.color, background: preset.background, ranges: ranges};
  state.highlights.push(h);
  // clear selection
  state.selectedLines.clear(); state.lastTextSelection = null; state.lastClickedLine = null;
  renderSelectionUI();
  renderHighlights();
  updateGenerated();
}

function renderHighlights(){
  const codeContainer = document.querySelector('#code');
  // rebuild each line content with highlights applied
  const lines = state.lines;
  const out = [];
  lines.forEach((line, idx)=>{
    const L = line.length;
    const marks = new Array(Math.max(1, L)).fill(null);
    // later highlights should win visually
    state.highlights.forEach((h, hi)=>{
      (h.ranges||[]).forEach(r=>{
        const sLine = (r.start_line||1)-1;
        const eLine = (r.end_line||r.start_line||1)-1;
        if(idx < sLine || idx > eLine) return;
        const sc = (idx===sLine && r.start_column!=null)? Math.max(0, r.start_column-1) : 0;
        const ec = (idx===eLine && r.end_column!=null)? Math.max(0, r.end_column-1) : Math.max(0, L-1);
        for(let i=sc;i<=ec;i++) marks[i]=hi;
      });
    });

    // build segments
    let segments = [];
    let i = 0;
    while(i<=L){
      const tag = marks[i];
      let j = i+1;
      while(j<=L && marks[j]===tag) j++;
      const text = line.slice(i,j);
      if(tag==null){ segments.push({text:text, h:null}); }
      else segments.push({text:text, h: state.highlights[tag]});
      i = j;
    }
    out.push(segments);
  });

  // replace DOM
  const rows = Array.from(document.querySelectorAll('.line'));
  rows.forEach((row, idx)=>{
    const codeText = row.querySelector('.codeText');
    codeText.innerHTML = '';
    const segments = out[idx] || [{text: state.lines[idx] || '', h:null}];
    segments.forEach(seg=>{
      if(seg.h){
        const sp = document.createElement('span');
        sp.className = 'highlight-span';
        sp.style.backgroundColor = seg.h.background;
        sp.style.color = seg.h.color;
        sp.style.padding = '0 0.12rem';
        sp.style.borderRadius = '3px';
        sp.textContent = seg.text || '';
        codeText.appendChild(sp);
      } else {
        codeText.appendChild(document.createTextNode(seg.text || ''));
      }
    });
  });

  renderHighlightsList();
}

function renderHighlightsList(){
  const list = document.getElementById('highlightsList');
  list.innerHTML = '';
  state.highlights.forEach((h, idx)=>{
    const item = document.createElement('div');
    item.className = 'd-flex align-items-center mb-2 p-2 annotation-item';
    const sw = document.createElement('div');
    sw.style.width='34px'; sw.style.height='22px'; sw.style.borderRadius='4px'; sw.style.background=h.background; sw.style.color=h.color; sw.style.border='1px solid rgba(0,0,0,0.06)';
    sw.style.marginRight='8px';
    const label = document.createElement('div');
    label.style.flex='1';
    label.style.fontSize='13px';
    label.textContent = h.ranges.map(r=>rangeToString(r)).join(', ');
    const del = document.createElement('button');
    del.className = 'btn btn-sm btn-outline-danger'; del.textContent = 'Delete';
    del.addEventListener('click', ()=>{ state.highlights.splice(idx,1); renderHighlights(); updateGenerated(); });
    item.appendChild(sw); item.appendChild(label); item.appendChild(del);
    list.appendChild(item);
  });
}

function rangeToString(r){
  const sL = r.start_line;
  const eL = r.end_line || r.start_line;
  if(r.start_column != null || r.end_column != null){
    const sC = r.start_column != null ? r.start_column : 1;
    const eC = r.end_column != null ? r.end_column : (state.lines[eL-1]||'').length;
    return `${sL}:${sC}-${eL}:${eC}`;
  }
  if(sL === eL) return `${sL}`;
  return `${sL}-${eL}`;
}

function updateGenerated(){
  const area = document.getElementById('generated');
  const lines = state.highlights.map(h=>{
    const ranges = (h.ranges||[]).map(r=>rangeToString(r)).join(',');
    return `-- color:${h.color};background:${h.background};range:${ranges}`;
  });
  area.value = lines.join('\n');
}

function copyHighlights(){
  updateGenerated();
  const txt = document.getElementById('generated').value || '';
  if(!txt) { alert('No highlights to copy'); return; }
  navigator.clipboard.writeText(txt).then(()=>{ alert('Copied highlights to clipboard'); });
}

document.addEventListener('DOMContentLoaded', init);
