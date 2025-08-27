const path = require('path');
const fs = require('fs');
const vm = require('vm');
const esbuild = require('esbuild');

// ----- Minimal DOM implementation -----
class TextNode { constructor(text){ this.nodeType=3; this.textContent=String(text); this.parentNode=null; } }
function createStyle(){
  const store = {};
  return new Proxy({
    setProperty:(k,v)=>{ store[k]=v; },
    getPropertyValue:(k)=> store[k] || ''
  }, {
    get(target, prop){ if (prop in target) return target[prop]; return store[prop]; },
    set(target, prop, value){ store[prop]=value; return true; }
  });
}
  class Element {
    constructor(tag){
      this.tagName=tag; this.children=[]; this.attributes={}; this.style=createStyle();
      this.eventListeners={}; this.parentNode=null; this.className='';
      this.classList={
        add:(...cls)=>{ cls.forEach(c=>{ if(!this.className.split(' ').includes(c)) this.className+=(this.className?' ':'')+c; }); },
        remove:(...cls)=>{ this.className=this.className.split(' ').filter(x=>!cls.includes(x)).join(' '); },
        contains:(c)=>this.className.split(' ').includes(c)
      };
    }
    setAttribute(k,v){ this.attributes[k]=String(v); if(k==='class') this.className=String(v); }
    getAttribute(k){ return this.attributes[k]; }
    appendChild(child){ if (typeof child==='string') child=new TextNode(child); child.parentNode=this; this.children.push(child); return child; }
    prepend(child){ if (typeof child==='string') child=new TextNode(child); child.parentNode=this; this.children.unshift(child); return child; }
    addEventListener(type,handler){ (this.eventListeners[type]=this.eventListeners[type]||[]).push(handler); }
    removeEventListener(type,handler){ const arr=this.eventListeners[type]; if(!arr) return; const i=arr.indexOf(handler); if(i>=0) arr.splice(i,1); if(arr.length===0) delete this.eventListeners[type]; }
    dispatchEvent(evt){ evt.target=evt.target||this; (this.eventListeners[evt.type]||[]).slice().forEach(fn=>fn(evt)); if(evt.bubbles&&this.parentNode) this.parentNode.dispatchEvent(evt); }
    after(node){
      if(!this.parentNode) return;
      const p=this.parentNode;
      if(node.parentNode){ const j=node.parentNode.children.indexOf(node); if(j>=0) node.parentNode.children.splice(j,1); }
      const i=p.children.indexOf(this);
      node.parentNode=p;
      p.children.splice(i+1,0,node);
    }
    insertBefore(node,ref){
      if(node.parentNode){ const j=node.parentNode.children.indexOf(node); if(j>=0) node.parentNode.children.splice(j,1); }
      const i=this.children.indexOf(ref);
      node.parentNode=this;
      if(i<0) this.children.push(node); else this.children.splice(i,0,node);
    }
    replaceWith(node){
      if(!this.parentNode) return;
      const p=this.parentNode;
      if(node.parentNode){ const j=node.parentNode.children.indexOf(node); if(j>=0) node.parentNode.children.splice(j,1); }
      const i=p.children.indexOf(this);
      if(i>=0){ node.parentNode=p; p.children[i]=node; }
      this.parentNode=null;
    }
    remove(){ if(this.parentNode){ const i=this.parentNode.children.indexOf(this); if(i>=0) this.parentNode.children.splice(i,1); this.parentNode=null; }}
    get firstChild(){ return this.children[0] || null; }
    get lastChild(){ return this.children[this.children.length-1] || null; }
    get textContent(){ return this.children.map(c=>c.nodeType===3?c.textContent:c.textContent).join(''); }
    getBoundingClientRect(){ return this.__rect || {top:0,height:0}; }
    closest(sel){ if(sel==='[data-widget-id]'){ let el=this; while(el){ if(el.attributes['data-widget-id']) return el; el=el.parentNode; } return null; } return null; }
    contains(node){ let el=node; while(el){ if(el===this) return true; el=el.parentNode; } return false; }
    querySelectorAll(sel){ const res=[]; const walk=n=>{ if(!(n instanceof Element)) return; if(sel==='[data-widget-id]'&&n.attributes['data-widget-id']) res.push(n); n.children.forEach(walk); }; walk(this); return res; }
  }
class Document {
  constructor(){ this.documentElement=new Element('html'); this.body=new Element('body'); this.documentElement.appendChild(this.body); }
  createElement(tag){ return new Element(tag); }
  createTextNode(text){ return new TextNode(text); }
  getElementById(id){
    let found=null;
    const search=node=>{
      if(!(node instanceof Element)||found) return;
      if(node.attributes.id===id) { found=node; return; }
      node.children.forEach(search);
    };
    search(this.body);
    return found;
  }
}
const document = new Document();
const window = { document, addEventListener: () => {}, removeEventListener: () => {} };
const localStorage = { store:{}, setItem(k,v){this.store[k]=String(v);}, getItem(k){return this.store[k]??null;} };

global.window=window;
global.document=document;
global.localStorage=localStorage;

global.crypto = require('crypto').webcrypto;

// ----- ESM loader using esbuild -----
const cache = new Map();
function loadModule(relPath){
  const absPath = path.resolve(__dirname, '..', relPath);
  if(cache.has(absPath)) return cache.get(absPath);
  let source = fs.readFileSync(absPath,'utf8');
  if(absPath.endsWith(path.join('src','app.js'))){
    source = source.replace('applyThemeTokens(); render();','');
  }
  const {code} = esbuild.transformSync(source,{loader:'js',format:'cjs',sourcefile:absPath});
  let finalCode = code;
  if(absPath.endsWith(path.join('src','app.js'))){
    finalCode += '\nmodule.exports.applyThemeTokens = applyThemeTokens;';
    finalCode += '\nmodule.exports.currencyInput = currencyInput;';
    finalCode += '\nmodule.exports.percentInput = percentInput;';
  }
  const module = {exports:{}};
  const dirname = path.dirname(absPath);
  function localRequire(p){
    if(p.startsWith('.')||p.startsWith('/')) return loadModule(path.resolve(dirname,p));
    return require(p);
  }
  const context = {require:localRequire,module,exports:module.exports,__dirname:dirname,__filename:absPath,window,document,localStorage,console,crypto};
  vm.runInNewContext(finalCode, context);
  cache.set(absPath,module.exports);
  return module.exports;
}

// ----- Tests -----
describe('center column weight slider', () => {
  test('updates state and CSS variable', () => {
    const {state, save, applyThemeTokens} = loadModule('src/app.js');
    const slider = document.createElement('input');
    slider.type = 'range';
    slider.min='1.3';
    slider.max='1.8';
    slider.step='0.1';
    slider.value = String(state.ui.centerWeight || 1.6);
    slider.addEventListener('input', e=>{ state.ui.centerWeight=Number(e.target.value); save(); applyThemeTokens(); });
    document.body.appendChild(slider);
    slider.value='1.7';
    slider.dispatchEvent({type:'input'});
    expect(state.ui.centerWeight).toBe(1.7);
    expect(document.documentElement.style.getPropertyValue('--cols-3')).toBe('1fr 1.7fr 1fr');
  });
});

describe('addWidgetControls', () => {
  test('resizes and removes widgets', () => {
    const {addWidgetControls} = loadModule('src/widgets.js');
    const wrapper = document.createElement('section');
    wrapper.style.gridColumn='span 1';
    const state = {widgetSize:{}, widgetHeightMode:{}, widgetFixedH:{}, order:['w1']};
    const save = jest.fn();
    const render = jest.fn();
    const configureWidget = jest.fn();
    addWidgetControls(wrapper,'w1','order','dash',{state,save,render,configureWidget});
    const row = wrapper.firstChild; // controls row
    const sizepick = row.firstChild; // div.sizepick
    const sizeBtn = sizepick.children[1]; // button "2"
    sizeBtn.dispatchEvent({type:'click'});
    expect(state.widgetSize['w1']).toBe(2);
    expect(wrapper.style.gridColumn).toBe('span 2');
    const removeBtn = row.lastChild; // 'Remove' button
    removeBtn.dispatchEvent({type:'click'});
    expect(state.order).toEqual([]);
    expect(render).toHaveBeenCalled();
  });
});

describe('enableDrag', () => {
  test('drags dynamically added widgets and cleans up', () => {
    const {enableDrag} = loadModule('src/widgets.js');
    const state = {order:['a','b']};
    const save = jest.fn();
    const grid = document.createElement('div');
    const w1 = document.createElement('section');
    w1.setAttribute('data-widget-id','a');
    w1.__rect={top:0,height:100};
    grid.appendChild(w1);
    const w2 = document.createElement('section');
    w2.setAttribute('data-widget-id','b');
    w2.__rect={top:100,height:100};
    grid.appendChild(w2);
    const cleanup = enableDrag(grid,'order',{state,save});
    expect(w1.eventListeners.dragstart).toBeUndefined();
    const w3 = document.createElement('section');
    w3.setAttribute('data-widget-id','c');
    w3.__rect={top:200,height:100};
    grid.appendChild(w3);
    w3.dispatchEvent({type:'dragstart', dataTransfer:{}, bubbles:true});
    w1.dispatchEvent({type:'dragover', clientY:0, preventDefault:()=>{}, bubbles:true});
    grid.dispatchEvent({type:'drop', preventDefault:()=>{}, bubbles:true});
    expect(state.order).toEqual(['c','a','b']);
    expect(save).toHaveBeenCalled();
    w3.remove();
    expect(w3.eventListeners.dragstart).toBeUndefined();
    cleanup();
    expect(grid.eventListeners.dragstart).toBeUndefined();
  });
});

describe('applyThemeTokens', () => {
  test('updates CSS variables for light and dark modes', () => {
    const {state, applyThemeTokens} = loadModule('src/app.js');
    state.theme = 'light';
    state.themeLightPreset = 'cloud';
    applyThemeTokens();
    expect(document.documentElement.style.getPropertyValue('--bg'))
      .toBe('linear-gradient(180deg,#F8FAFC,#E2E8F0)');
    expect(document.documentElement.style.getPropertyValue('--text'))
      .toBe('#0F172A');

    state.theme = 'dark';
    state.themeDarkPreset = 'obsidian';
    applyThemeTokens();
    expect(document.documentElement.style.getPropertyValue('--bg'))
      .toBe('linear-gradient(180deg,#0F172A,#1E293B)');
    expect(document.documentElement.style.getPropertyValue('--text'))
      .toBe('#F1F5F9');
  });
});

describe('input sanitization', () => {
  test('currencyInput strips invalid chars and passes numbers', () => {
    const {currencyInput} = loadModule('src/app.js');
    const changed = jest.fn();
    const field = currencyInput('', changed, 'Amt');
    const input = field.children[1].children[1];
    input.value = '12a.3';
    input.dispatchEvent({type:'input'});
    expect(input.value).toBe('12.3');
    expect(changed).toHaveBeenLastCalledWith(12.3);
    input.value = 'abc';
    input.dispatchEvent({type:'input'});
    expect(input.value).toBe('');
    expect(changed).toHaveBeenLastCalledWith(null);
  });

  test('percentInput strips invalid chars and passes numbers', () => {
    const {percentInput} = loadModule('src/app.js');
    const changed = jest.fn();
    const field = percentInput('', changed, 'Rate');
    const input = field.children[1].children[0];
    input.value = '10x.5';
    input.dispatchEvent({type:'input'});
    expect(input.value).toBe('10.5');
    expect(changed).toHaveBeenLastCalledWith(10.5);
    input.value = 'abc';
    input.dispatchEvent({type:'input'});
    expect(input.value).toBe('');
    expect(changed).toHaveBeenLastCalledWith(null);
  });
});
