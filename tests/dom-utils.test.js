const path = require('path');
const fs = require('fs');
const vm = require('vm');
const esbuild = require('esbuild');

function loadDomUtils(){
  const absPath = path.resolve(__dirname, '..', 'src', 'dom-utils.js');
  const source = fs.readFileSync(absPath, 'utf8');
  const {code} = esbuild.transformSync(source, {loader: 'js', format: 'cjs', sourcefile: absPath});
  const module = {exports: {}};
  vm.runInNewContext(code, {module, exports: module.exports, require});
  return module.exports;
}

describe('uid', () => {
  test('generates unique strings', () => {
    const {uid} = loadDomUtils();
    const a = uid();
    const b = uid();
    expect(typeof a).toBe('string');
    expect(a).not.toBe(b);
  });
});
