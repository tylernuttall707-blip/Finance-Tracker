const path = require('path');
const fs = require('fs');
const vm = require('vm');
const esbuild = require('esbuild');

describe('h helper', () => {
  let h;

  beforeAll(() => {
    global.document = {
      createElement(tag) {
        return {
          tagName: tag,
          children: [],
          style: {},
          className: '',
          setAttribute(k, v) {
            if (k === 'class') this.className = v;
            else if (k === 'style') {
              v.split(';').forEach(p => {
                if (!p) return;
                const [a, b] = p.split(':');
                this.style[a.trim()] = b.trim();
              });
            }
          },
          appendChild(child) { this.children.push(child); return child; },
          addEventListener() {}
        };
      },
      createTextNode(text) { return { nodeType: 3, textContent: String(text) }; }
    };
    const abs = path.resolve(__dirname, '../src/dom-utils.js');
    const source = fs.readFileSync(abs, 'utf8');
    const { code } = esbuild.transformSync(source, { loader: 'js', format: 'cjs', sourcefile: abs });
    const module = { exports: {} };
    vm.runInNewContext(code, { module, exports: module.exports, require, document: global.document });
    h = module.exports.h;
  });

  test('adds transition styles for interactive classes', () => {
    const el = h('button', { class: 'btn' }, 'Hi');
    expect(el.style.transition).toBe('background var(--anim-duration),color var(--anim-duration),transform var(--anim-duration)');
  });
});


