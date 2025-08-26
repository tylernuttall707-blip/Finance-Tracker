import {h} from './dom-utils.js';
import {easeOutCubic} from './easing.js';

export function barChart(items,{colors=[],valueSuffix='',currency=false,yMin=null,yMax=null,duration=300,easing=easeOutCubic}={}){
  if(!items||!items.length) return h('div',{class:'muted'},'No data');
  const W=720,H=200,P=28,G=12,N=items.length,BAR=(W-P*2-(N-1)*G)/Math.max(1,N);
  let vals=items.map(i=>Number(i.value)||0);
  let minVal=Math.min(0,...vals), maxVal=Math.max(1,...vals);
  if (yMin!=null) minVal=Number(yMin);
  if (yMax!=null) maxVal=Number(yMax);
  const span=(maxVal-minVal)||1;
  const baseY=H-P;
  const reduceMotion = typeof window!=='undefined' && window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const animate = duration>0 && !reduceMotion;
  const g=h('svg',{viewBox:`0 0 ${W} ${H}`, style:{width:'100%',height:'210px'}});
  const bars=[];
  items.forEach((it,idx)=>{
    const x=P+idx*(BAR+G);
    const val=Number(it.value)||0;
    const ratio=(val-minVal)/span;
    const bh=(H-P*2)*ratio;
    const y=baseY-bh;
    const fill=colors[idx]||'currentColor';
    const rect=h('rect',{x,y:animate?baseY:y,width:BAR,height:animate?0:bh,fill,opacity:.22});
    g.appendChild(rect);
    g.appendChild(h('text',{x:x+BAR/2,y:H-8,'text-anchor':'middle',style:'font-size:10px;fill:var(--muted);'}, (it.label||'').slice(0,16)+(it.label&&it.label.length>16?'…':'')));
    const topTxt=currency?('$'+val.toLocaleString()):(val+valueSuffix);
    const top=h('text',{x:x+BAR/2,y:animate?baseY-4:y-4,'text-anchor':'middle',style:'font-size:10px;fill:var(--muted);'}, topTxt);
    g.appendChild(top);
    bars.push({rect,top,bh});
  });
  if(animate){
    const start=Date.now();
    function frame(){
      const t=Math.min((Date.now()-start)/duration,1);
      const p=easing(t);
      bars.forEach(b=>{
        const h=b.bh*p;
        b.rect.setAttribute('height',h);
        b.rect.setAttribute('y',baseY-h);
        b.top.setAttribute('y',baseY-h-4);
      });
      if(t<1) requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
  }
  return g;
}

export function pieChart(items,{colors=[],duration=300,easing=easeOutCubic}={}){
  if(!items||!items.length) return h('div',{class:'muted'},'No data');
  const W=220,H=220,R=90,CX=W/2,CY=H/2;
  const total=items.reduce((s,i)=>s+(Number(i.value)||0),0)||1;
  const reduceMotion = typeof window!=='undefined' && window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const animate = duration>0 && !reduceMotion;
  let a0=0;
  const g=h('svg',{viewBox:`0 0 ${W} ${H}`, style:{width:'100%',height:'240px'}});
  const slices=[];
  items.forEach((it,idx)=>{
    const v=Math.max(0, Number(it.value)||0);
    const a1=a0 + (v/total)*Math.PI*2;
    const x0=CX+R*Math.cos(a0), y0=CY+R*Math.sin(a0);
    const x1=CX+R*Math.cos(a1), y1=CY+R*Math.sin(a1);
    const large = (a1-a0) > Math.PI ? 1 : 0;
    const d=animate?`M ${CX} ${CY} L ${x0} ${y0} Z`:`M ${CX} ${CY} L ${x0} ${y0} A ${R} ${R} 0 ${large} 1 ${x1} ${y1} Z`;
    const path=h('path',{d,fill:colors[idx]||'currentColor',opacity:.85});
    g.appendChild(path);
    slices.push({path,start:a0,end:a1});
    a0=a1;
  });
  if(animate){
    const start=Date.now();
    function frame(){
      const t=Math.min((Date.now()-start)/duration,1);
      const p=easing(t);
      slices.forEach(s=>{
        const a=s.start+(s.end-s.start)*p;
        const x0=CX+R*Math.cos(s.start), y0=CY+R*Math.sin(s.start);
        const x1=CX+R*Math.cos(a), y1=CY+R*Math.sin(a);
        const large=(a-s.start)>Math.PI?1:0;
        const d=`M ${CX} ${CY} L ${x0} ${y0} A ${R} ${R} 0 ${large} 1 ${x1} ${y1} Z`;
        s.path.setAttribute('d',d);
      });
      if(t<1) requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
  }
  return g;
}
