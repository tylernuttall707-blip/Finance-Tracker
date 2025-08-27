const path = require('path');
const fs = require('fs');
const vm = require('vm');
const esbuild = require('esbuild');

// ----- Minimal DOM -----
class TextNode {
  constructor(text){ this.nodeType=3; this.textContent=String(text); this.parentNode=null; }
}
class Element {
  constructor(tag){ this.tagName=tag; this.children=[]; this.attributes={}; this.className=''; this.eventListeners={}; this.parentNode=null; }
  setAttribute(k,v){ this.attributes[k]=String(v); if(k==='class') this.className=String(v); }
  appendChild(child){ if(typeof child==='string') child=new TextNode(child); child.parentNode=this; this.children.push(child); return child; }
  addEventListener(type,fn){ (this.eventListeners[type]=this.eventListeners[type]||[]).push(fn); }
  remove(){ if(this.parentNode){ const i=this.parentNode.children.indexOf(this); if(i>=0) this.parentNode.children.splice(i,1); }}
}
class Document {
  constructor(){ this.documentElement=new Element('html'); this.body=new Element('body'); this.documentElement.appendChild(this.body); }
  createElement(tag){ return new Element(tag); }
  createTextNode(text){ return new TextNode(text); }
}
const document = new Document();
const window = { document, addEventListener:()=>{}, removeEventListener:()=>{} };
const localStorage = { getItem:()=>null, setItem:()=>{} };

global.window = window;
global.document = document;
global.localStorage = localStorage;
global.crypto = require('crypto').webcrypto;

// ----- ESM loader -----
const cache = new Map();
function loadModule(rel){
  const abs = path.resolve(__dirname, '..', rel);
  if(cache.has(abs)) return cache.get(abs);
  let source = fs.readFileSync(abs,'utf8');
  if(abs.endsWith(path.join('src','app.js'))){
    source = source.replace('applyThemeTokens(); render();','');
  }
  const {code} = esbuild.transformSync(source,{loader:'js',format:'cjs',sourcefile:abs});
  const module = {exports:{}};
  const dirname = path.dirname(abs);
  function localRequire(p){
    if(p.startsWith('.')||p.startsWith('/')) return loadModule(path.resolve(dirname,p));
    return require(p);
  }
  const context = {require:localRequire,module,exports:module.exports,__dirname:dirname,__filename:abs,window,document,localStorage,console,setTimeout};
  vm.runInNewContext(code, context);
  cache.set(abs,module.exports);
  return module.exports;
}

// ----- Tests -----
describe('load()', () => {
  test('logs and notifies on invalid JSON', () => {
    const {load} = loadModule('src/app.js');
    localStorage.getItem = jest.fn().mockReturnValue('invalid{');
    const err = jest.spyOn(console, 'error').mockImplementation(() => {});
    const before = document.body.children.length;
    const result = load();
    expect(result).toBeNull();
    expect(err).toHaveBeenCalled();
    expect(document.body.children.length).toBe(before + 1);
    expect(document.body.children[before].className).toBe('toast');
    err.mockRestore();
  });
});
