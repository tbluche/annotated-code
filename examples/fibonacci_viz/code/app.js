const state = {data: {"code": "from functools import lru_cache\n\n\n@lru_cache(maxsize=None)\ndef fibonacci(n: int) -> int:\n    \"\"\"Return the n-th Fibonacci number (0-indexed).\"\"\"\n    if n < 0:\n        raise ValueError(f\"n must be non-negative, got {n}\")\n    if n <= 1:\n        return n\n    return fibonacci(n - 1) + fibonacci(n - 2)\n\n\ndef fibonacci_sequence(length: int) -> list[int]:\n    \"\"\"Return the first `length` Fibonacci numbers as a list.\"\"\"\n    if length <= 0:\n        return []\n    return [fibonacci(i) for i in range(length)]\n\n\ndef first_fibonacci_above(threshold: int) -> tuple[int, int]:\n    \"\"\"Return the first Fibonacci number strictly greater than `threshold`.\n\n    Returns a (index, value) tuple.\n    \"\"\"\n    i = 0\n    while True:\n        value = fibonacci(i)\n        if value > threshold:\n            return i, value\n        i += 1\n\n\nif __name__ == \"__main__\":\n    print(\"First 10 Fibonacci numbers:\", fibonacci_sequence(10))\n    idx, val = first_fibonacci_above(100)\n    print(f\"First Fibonacci above 100: F({idx}) = {val}\")\n", "annotations": [{"text": "`fibonacci` uses **memoization** via `@lru_cache(maxsize=None)` (line 1 + line 4).\n\nWithout it, the naive recursive implementation on line 11 would recompute the same sub-problems\nexponentially many times. With the cache, each value `fibonacci(k)` is computed only once and\nstored for subsequent calls \u2014 reducing the time complexity from $O(2^n)$ to $O(n)$.", "highlights": [{"color": "#000000", "background": "#b3e5fc", "ranges": [{"start_line": 1, "end_line": 1, "start_column": null, "end_column": null}]}, {"color": "#000000", "background": "#b3e5fc", "ranges": [{"start_line": 4, "end_line": 4, "start_column": null, "end_column": null}]}, {"color": "#000000", "background": "#ffe082", "ranges": [{"start_line": 11, "end_line": 11, "start_column": null, "end_column": null}]}]}, {"text": "Two guard clauses protect the recursive function before it reaches its recursive step:\n\n- Lines 7-8 validate the input, raising a `ValueError` for negative indices.\n- Lines 9-10 are the **base cases**: `fibonacci(0) = 0` and `fibonacci(1) = 1`.\n\nWithout base cases a recursive function would call itself forever and raise `RecursionError`.", "highlights": [{"color": "#000000", "background": "#c8e6c9", "ranges": [{"start_line": 7, "end_line": 8, "start_column": null, "end_column": null}]}, {"color": "#000000", "background": "#fff9c4", "ranges": [{"start_line": 9, "end_line": 10, "start_column": null, "end_column": null}]}]}, {"text": "`fibonacci_sequence` builds the result as a **list comprehension** (line 18), delegating each\nindividual value to the memoized `fibonacci`. The early return on line 17 handles the edge case\nof a non-positive length without entering the comprehension.", "highlights": [{"color": "#000000", "background": "#f8bbd0", "ranges": [{"start_line": 14, "end_line": 18, "start_column": null, "end_column": null}]}]}, {"text": "`first_fibonacci_above` uses an **unbounded `while True` loop** because the target index is not\nknown in advance. The loop is guaranteed to terminate: Fibonacci numbers grow without bound, so\nthe condition `value > threshold` will eventually be satisfied for any finite `threshold`.\n\nLine 30 returns both the index and the value as a tuple, making the result unambiguous for the\ncaller without requiring a second lookup.", "highlights": [{"color": "#000000", "background": "#e1bee7", "ranges": [{"start_line": 27, "end_line": 31, "start_column": null, "end_column": null}]}]}]}, selected: 0}

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
