export const $ = (s, el=document) => el.querySelector(s);
export const $$ = (s, el=document) => Array.from(el.querySelectorAll(s));
export const uid = () => Math.random().toString(36).slice(2) + Date.now().toString(36);
export const todayISO = () => new Date().toISOString().slice(0, 10);
export const clamp = (n, min, max) => Math.max(min, Math.min(max, n));
export const daysBetween = (a, b) => { const A=new Date(a), B=new Date(b); A.setHours(0,0,0,0); B.setHours(0,0,0,0); return Math.round((B-A)/86400000); };
export const fmtUSD = (n) => (n==null || isNaN(n) ? '—' : Number(n).toLocaleString(undefined,{style:'currency',currency:'USD',maximumFractionDigits:2}));
export const asNumber = (v) => {
  if (v === '' || v == null) return null;
  const n = Number(String(v).replace(/,/g,''));
  return isNaN(n) ? null : n;
};
export const hexToRgb = (hex) => { const m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex||'#3b82f6'); return m?{r:parseInt(m[1],16),g:parseInt(m[2],16),b:parseInt(m[3],16)}:{r:59,g:130,b:246}; };
export function h(tag, attrs={}, ...children){
  const el=document.createElement(tag);
  for(const [k,v] of Object.entries(attrs||{})){
    if(k==='class') el.className=v;
    else if(k.startsWith('on')&&typeof v==='function') el.addEventListener(k.slice(2).toLowerCase(), v, {passive:true});
    else if(k==='style'&&typeof v==='object') el.setAttribute('style', Object.entries(v).map(([a,b])=>`${a}:${b}`).join(';'));
    else if(v!==false && v!=null) el.setAttribute(k, v===true?'':v);
  }
  for(const c of children.flat()){
    if(c==null||c===false) continue;
    if(typeof c==='string' || typeof c==='number' || typeof c==='boolean') el.appendChild(document.createTextNode(String(c)));
    else el.appendChild(c);
  }
  return el;
}
export function showToast(title, msg, actions=[]){
  const t=h('div',{class:'toast'}, h('h3',null,title), h('div',{class:'muted'},msg));
  const row=h('div',null);
  actions.forEach(({label,fn,primary})=>{
    const b=h('button',{class:'btn tiny'+(primary?' primary':''), onclick:()=>{ try{fn&&fn();}finally{t.remove();}}}, label);
    row.appendChild(b);
  });
  row.appendChild(h('button',{class:'btn tiny',onclick:()=>t.remove()},'Close'));
  t.appendChild(row); document.body.appendChild(t); setTimeout(()=>{ if(document.body.contains(t)) t.remove(); }, 8000);
}
export function clampDay(d){
  return Math.max(1, Math.min(28, Number(d) || 1));
}
export function nextMonthlyDateFrom(day, fromISO){
  const d = clampDay(day);
  const ref = fromISO ? new Date(fromISO) : new Date();
  const y = ref.getFullYear();
  const m = ref.getMonth();
  const cand = new Date(y, m, d);
  const ref0 = new Date(ref.toDateString());
  const out = (cand >= ref0 ? cand : new Date(y, m + 1, d));
  return out.toISOString().slice(0, 10);
}
