import {h} from './dom-utils.js';

export function barChart(items,{colors=[],valueSuffix='',currency=false,yMin=null,yMax=null}={}){
  if(!items||!items.length) return h('div',{class:'muted'},'No data');
  const W=720,H=200,P=28,G=12,N=items.length,BAR=(W-P*2-(N-1)*G)/Math.max(1,N);
  let vals=items.map(i=>Number(i.value)||0);
  let minVal=Math.min(0,...vals), maxVal=Math.max(1,...vals);
  if (yMin!=null) minVal=Number(yMin);
  if (yMax!=null) maxVal=Number(yMax);
  const span=(maxVal-minVal)||1;
  const g=h('svg',{viewBox:`0 0 ${W} ${H}`, style:{width:'100%',height:'210px'}});
  items.forEach((it,idx)=>{
    const x=P+idx*(BAR+G);
    const val=Number(it.value)||0;
    const ratio=(val-minVal)/span;
    const bh=(H-P*2)*ratio;
    const y=H-P-bh;
    const fill=colors[idx]||'currentColor';
    g.appendChild(h('rect',{x,y,width:BAR,height:bh,fill,opacity:.22}));
    g.appendChild(h('text',{x:x+BAR/2,y:H-8,'text-anchor':'middle',style:'font-size:10px;fill:var(--muted);'}, (it.label||'').slice(0,16)+(it.label&&it.label.length>16?'…':'')));
    const top=currency?('$'+val.toLocaleString()):(val+valueSuffix);
    g.appendChild(h('text',{x:x+BAR/2,y:y-4,'text-anchor':'middle',style:'font-size:10px;fill:var(--muted);'}, top));
  });
  return g;
}
export function pieChart(items,{colors=[]}={}){
  if(!items||!items.length) return h('div',{class:'muted'},'No data');
  const W=220,H=220,R=90,CX=W/2,CY=H/2;
  const total=items.reduce((s,i)=>s+(Number(i.value)||0),0)||1;
  let a0=0;
  const g=h('svg',{viewBox:`0 0 ${W} ${H}`, style:{width:'100%',height:'240px'}});
  items.forEach((it,idx)=>{
    const v=Math.max(0, Number(it.value)||0);
    const a1=a0 + (v/total)*Math.PI*2;
    const x0=CX+R*Math.cos(a0), y0=CY+R*Math.sin(a0);
    const x1=CX+R*Math.cos(a1), y1=CY+R*Math.sin(a1);
    const large = (a1-a0) > Math.PI ? 1 : 0;
    const path = `M ${CX} ${CY} L ${x0} ${y0} A ${R} ${R} 0 ${large} 1 ${x1} ${y1} Z`;
    g.appendChild(h('path',{d:path,fill:colors[idx]||'currentColor',opacity:.85}));
    a0=a1;
  });
  return g;
}
