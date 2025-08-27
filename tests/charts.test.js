const path = require('path');
const fs = require('fs');
const vm = require('vm');
const esbuild = require('esbuild');

// ----- Minimal DOM -----
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
  constructor(tag){ this.tagName=tag; this.children=[]; this.attributes={}; this.style=createStyle(); this.eventListeners={}; this.parentNode=null; this.className=''; }
  setAttribute(k,v){ this.attributes[k]=String(v); if(k==='class') this.className=String(v); }
  appendChild(child){ if (typeof child==='string') child=new TextNode(child); child.parentNode=this; this.children.push(child); return child; }
  remove(){ if(this.parentNode){ const i=this.parentNode.children.indexOf(this); if(i>=0) this.parentNode.children.splice(i,1); }}
}
class Document {
  constructor(){ this.documentElement=new Element('html'); this.body=new Element('body'); this.documentElement.appendChild(this.body); }
  createElement(tag){ return new Element(tag); }
  createTextNode(text){ return new TextNode(text); }
}
const document = new Document();
const window = { document, addEventListener: () => {}, removeEventListener: () => {}, matchMedia: ()=>({matches:false}) };

global.window = window;
global.document = document;

global.requestAnimationFrame = fn => fn(0);

global.localStorage = { store:{}, setItem(k,v){this.store[k]=String(v);}, getItem(k){return this.store[k]??null;} };

// ----- ESM loader -----
const cache = new Map();
function loadModule(rel){
  const abs = path.resolve(__dirname,'..',rel);
  if(cache.has(abs)) return cache.get(abs);
  const source = fs.readFileSync(abs,'utf8');
  const {code} = esbuild.transformSync(source,{loader:'js',format:'cjs',sourcefile:abs});
  const module = {exports:{}};
  const context = {module,exports:module.exports,require:p=>p.startsWith('.')?loadModule(path.join(path.dirname(abs),p)):require(p),window,document,localStorage,requestAnimationFrame:global.requestAnimationFrame,setTimeout:global.setTimeout,Date:Date};
  vm.runInNewContext(code, context);
  cache.set(abs,module.exports);
  return module.exports;
}

// ----- Tests -----
describe('chart animations', () => {
  beforeEach(() => {
    window.matchMedia = () => ({matches:false});
  });

  test('barChart duration 0 renders final height', () => {
    const {barChart} = loadModule('src/charts.js');
    const g = barChart([{label:'A',value:10}],{duration:0});
    const rect = g.children[0];
    expect(rect.attributes.height).toBe('144');
    expect(rect.attributes.y).toBe('28');
  });

  test('barChart skips animation when reduced motion', () => {
    window.matchMedia = () => ({matches:true});
    const {barChart} = loadModule('src/charts.js');
    const g = barChart([{label:'A',value:10}],{duration:100});
    const rect = g.children[0];
    expect(rect.attributes.height).toBe('144');
  });

  test('pieChart duration 0 renders final slice', () => {
    const {pieChart} = loadModule('src/charts.js');
    const g = pieChart([{label:'A',value:1},{label:'B',value:1}],{duration:0});
    const d = g.children[0].attributes.d;
    expect(/A 90 90 0 0 1 20(?:\.0+)? 110/.test(d)).toBe(true);
  });

    test('barChart applies easing function', () => {
      const origRAF = global.requestAnimationFrame;
      const origNow = Date.now;
      Date.now = () => 0;
      let called = false;
      global.requestAnimationFrame = fn => { if(!called){ called = true; fn(); } };
      cache.delete(path.resolve(__dirname,'..','src/charts.js'));
      const {barChart} = loadModule('src/charts.js');
      const easing = jest.fn().mockReturnValue(0.25);
      const g = barChart([{label:'A',value:10}],{duration:100,easing});
      const rect = g.children[0];
      expect(easing.mock.calls[0][0]).toBeCloseTo(0,1);
      expect(rect.attributes.height).toBe('36');
      expect(rect.attributes.y).toBe('136');
      global.requestAnimationFrame = origRAF;
      Date.now = origNow;
    });

    test('barChart renders without requestAnimationFrame', () => {
      const origRAF = global.requestAnimationFrame;
      const origTimeout = global.setTimeout;
      const origNow = Date.now;
      delete global.requestAnimationFrame;
      Date.now = () => 0;
      global.setTimeout = fn => { Date.now = () => 1000; fn(); };
      cache.delete(path.resolve(__dirname,'..','src/charts.js'));
      const {barChart} = loadModule('src/charts.js');
      const g = barChart([{label:'A',value:10}],{duration:100});
      const rect = g.children[0];
      expect(rect.attributes.height).toBe('144');
      expect(rect.attributes.y).toBe('28');
      global.setTimeout = origTimeout;
      Date.now = origNow;
      global.requestAnimationFrame = origRAF;
    });

    test('pieChart renders without requestAnimationFrame', () => {
      const origRAF = global.requestAnimationFrame;
      const origTimeout = global.setTimeout;
      const origNow = Date.now;
      delete global.requestAnimationFrame;
      Date.now = () => 0;
      global.setTimeout = fn => { Date.now = () => 1000; fn(); };
      cache.delete(path.resolve(__dirname,'..','src/charts.js'));
      const {pieChart} = loadModule('src/charts.js');
      const g = pieChart([{label:'A',value:1},{label:'B',value:1}],{duration:100});
      const d = g.children[0].attributes.d;
      expect(/A 90 90 0 0 1 20(?:\.0+)? 110/.test(d)).toBe(true);
      global.setTimeout = origTimeout;
      Date.now = origNow;
      global.requestAnimationFrame = origRAF;
    });
  });
