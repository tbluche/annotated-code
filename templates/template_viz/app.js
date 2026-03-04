const state = {data: __EMBEDDED_JSON__, selected: 0}

function render(){
  if(!state.data) return;
  renderCode();
  renderSelectedAnnotation();
  bindControls();
}

function renderSelectedAnnotation(){
  const ann = (state.data.annotations && state.data.annotations[state.selected]) || {text: ''};
  const md = ann.text || '';
  let html = md;
  if(window.marked && typeof marked.parse === 'function'){
    try { html = marked.parse(md); } catch(e){ html = md.replace(/\n/g,'<br>'); }
  } else {
    html = md.replace(/\n/g,'<br>');
  }
  if(window.DOMPurify && typeof DOMPurify.sanitize === 'function'){
    html = DOMPurify.sanitize(html);
  }
  $('#annotationText').html(html);
  if(window.renderMathInElement){
    try{
      renderMathInElement(document.getElementById('annotationText'), {
        delimiters: [
          {left: "$$", right: "$$", display: true},
          {left: "$", right: "$", display: false},
          {left: "\\(", right: "\\)", display: false},
          {left: "\\[", right: "\\]", display: true}
        ],
        throwOnError: false
      });
    } catch(e){ }
  }
  const total = (state.data.annotations && state.data.annotations.length) || 0;
  $('#annotationCounter').text((state.selected+1) + ' / ' + total);
}

function renderCode(){
  const raw = (state.data.code||'').replace(/	/g,'    ').split('\n');
  const codeEl = $('#code code');
  codeEl.empty();
  const highlights = (state.data.annotations[state.selected] && state.data.annotations[state.selected].highlights) || [];
  const ranges = [];
  highlights.forEach((h,hi)=>{
    (h.ranges||[]).forEach(r=>{ranges.push(Object.assign({},r,{color:h.color,background:h.background,hid:hi}))});
  });

  raw.forEach((line,idx)=>{
    const ln = idx+1;
    const span = $('<div class="line" data-ln="'+ln+'"></div>');
    span.append(`<div class="ln">${ln}</div>`);
    const codeText = $('<div class="codeText"></div>');

    const L = line.length;
    const marks = new Array(Math.max(1,L)).fill(null);
    ranges.forEach((r,ri)=>{
      const startLine = (r.start_line||1)-1;
      const endLine = (r.end_line||r.start_line||1)-1;
      if(ln-1 < startLine || ln-1 > endLine) return;
      const sc = (ln-1===startLine && r.start_column!=null)? r.start_column-1 : 0;
      const ec = (ln-1===endLine && r.end_column!=null)? r.end_column-1 : L-1;
      const s = Math.max(0, sc);
      const e = Math.min(L-1, ec>=0?ec:L-1);
      for(let i=s;i<=e;i++) marks[i]=ri;
    });

    // build segments
    let i=0;
    while(i<=L){
      const tag = marks[i]===undefined?null:marks[i];
      let j=i + 1;
      while(j<=L && (marks[j]===tag)) j++;
      const text = line.slice(i,j);
      if(tag==null){ codeText.append(escapeHtml(text||' ')); }
      else {
        const r = ranges[tag];
        const spanEl = $(`<span class="highlight-span">${escapeHtml(text)}</span>`);
        spanEl.css({'background-color': r.background, 'color': r.color});
        codeText.append(spanEl);
      }
      i=j;
    }

    span.append(codeText);
    $('#code code').append(span);
  });

  $('#codeContainer').addClass('dimmed');
  $('.highlight-span').closest('.line').find('.codeText').css('opacity',1);
}

function updateSelection(){
  render();
  // const ann = state.data.annotations[state.selected];
  // if(!ann) return;
  // const first = ann.highlights?.[0]?.ranges?.[0];
  // const ln = first? (first.start_line||1) : 1;
  // const el = $(`.line[data-ln="${ln}"]`);
  // if(el.length) $('#codeContainer').animate({scrollTop: el.position().top + $('#codeContainer').scrollTop()-20},200);
}

function bindControls(){
  $('#prevBtn').off().on('click', ()=>{ state.selected = Math.max(0, state.selected-1); updateSelection(); });
  $('#nextBtn').off().on('click', ()=>{ state.selected = Math.min(state.data.annotations.length-1, state.selected+1); updateSelection(); });
  $(document).off('keydown.viz').on('keydown.viz', (e)=>{
    if(e.key === 'ArrowLeft'){
      state.selected = Math.max(0, state.selected-1); updateSelection();
    } else if(e.key === 'ArrowRight'){
      state.selected = Math.min((state.data.annotations||[]).length-1, state.selected+1); updateSelection();
    }
  });
}

function escapeHtml(s){ return (s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }

$(function(){ render(); });
