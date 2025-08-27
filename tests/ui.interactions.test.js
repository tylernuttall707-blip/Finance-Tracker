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
  constructor(tag){ this.tagName=tag; this.children=[]; this.attributes={}; this.style=createStyle(); this.eventListeners={}; this.parentNode=null; this.className=''; this.dataset={}; }
  setAttribute(k,v){ this.attributes[k]=String(v); if(k==='class') this.className=String(v); if(k.startsWith('data-')) this.dataset[k.slice(5)]=String(v); }
  removeAttribute(k){ delete this.attributes[k]; if(k==='class') this.className=''; if(k.startsWith('data-')) delete this.dataset[k.slice(5)]; }
  appendChild(child){ if (typeof child==='string') child=new TextNode(child); child.parentNode=this; this.children.push(child); return child; }
  prepend(child){ if (typeof child==='string') child=new TextNode(child); child.parentNode=this; this.children.unshift(child); return child; }
  addEventListener(type,handler){ (this.eventListeners[type]=this.eventListeners[type]||[]).push(handler); }
  dispatchEvent(evt){ evt.target=this; (this.eventListeners[evt.type]||[]).forEach(fn=>fn(evt)); }
  remove(){ if(this.parentNode){ const i=this.parentNode.children.indexOf(this); if(i>=0) this.parentNode.children.splice(i,1); }}
  get firstChild(){ return this.children[0] || null; }
  get lastChild(){ return this.children[this.children.length-1] || null; }
  get textContent(){ return this.children.map(c=>c.nodeType===3?c.textContent:c.textContent).join(''); }
}
class Document {
  constructor(){ this.documentElement=new Element('html'); this.body=new Element('body'); this.documentElement.appendChild(this.body); }
  createElement(tag){ return new Element(tag); }
  createTextNode(text){ return new TextNode(text); }
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

describe('animation speed setting', () => {
  test('applyThemeTokens applies state.ui.anim', () => {
    const {state, applyThemeTokens} = loadModule('src/app.js');
    state.ui.anim = 'fast';
    applyThemeTokens();
    expect(document.body.dataset.anim).toBe('fast');
  });
});
