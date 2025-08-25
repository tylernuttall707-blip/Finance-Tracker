import { h, asNumber } from './utils.js';

export const sectionTitle = (t) => h('div',{class:'title'}, t);
export const kpi = (label,value) => h('div',{class:'kpi'}, h('div',{class:'label'},label), h('div',{class:'value'}, value));
export const fieldInput = (label,value,onChange,type='text') => h('div',{class:'field'}, h('label',null,label), h('input',{type,value:value??'',oninput:e=>onChange(e.target.value)}));
export function currencyInput(value,onChange,label){
  const f=h('div',{class:'field'}, label?h('label',null,label):null,
    h('div',{style:'position:relative;'}, h('span',{style:'position:absolute;left:10px;top:50%;transform:translateY(-50%);color:var(--muted);'},'$'),
      h('input',{type:'text',value:value==null?'':String(value),style:'padding-left:22px;',oninput:e=>{const raw=e.target.value.replace(/[^0-9.\\-]/g,'');onChange(raw===''?null:raw);},onfocus:e=>{e.target.value=e.target.value.replace(/,/g,'');},onblur:e=>{const n=asNumber(e.target.value);e.target.value=(n==null?'':Number(n).toLocaleString(undefined,{minimumFractionDigits:2,maximumFractionDigits:2}));onChange(n);}})));
  return f;
}
export function percentInput(value,onChange,label){
  const f=h('div',{class:'field'}, label?h('label',null,label):null,
    h('div',{style:'position:relative;'},
      h('input',{type:'text',value:value==null?'':String(value),style:'padding-right:22px;',oninput:e=>{const raw=e.target.value.replace(/[^0-9.\\-]/g,'');onChange(raw);},onblur:e=>{const n=Number(e.target.value);e.target.value=isFinite(n)?n.toFixed(2):'';onChange(e.target.value);}}),
      h('span',{style:'position:absolute;right:10px;top:50%;transform:translateY(-50%);color:var(--muted);'},'%')));
  return f;
}
export function showModal(title, contentBuilder, onSave){
  const scrim=h('div',{style:'position:fixed;inset:0;background:rgba(0,0,0,.35);display:grid;place-items:center;z-index:10000;'});
  const card=h('div',{class:'panel p4',style:'width:680px;max-width:94vw;'});
  card.appendChild(h('div',{class:'title'}, title));
  const body=h('div'); card.appendChild(body);
  const row=h('div',{style:'display:flex;justify-content:flex-end;gap:8px;margin-top:10px;'});
  row.appendChild(h('button',{class:'btn tiny',onclick:()=>scrim.remove()},'Cancel'));
  row.appendChild(h('button',{class:'btn tiny primary',onclick:()=>{ onSave&&onSave(); scrim.remove(); render(); }},'Save'));
  card.appendChild(row); scrim.appendChild(card); document.body.appendChild(scrim);
  contentBuilder(body);
  return scrim;
}
