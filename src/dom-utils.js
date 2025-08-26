export const $ = (s, el = document) => el.querySelector(s);
export const $$ = (s, el = document) => Array.from(el.querySelectorAll(s));
export const clamp = (n, min, max) => Math.max(min, Math.min(max, n));

export function h(tag, attrs = {}, ...children) {
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs || {})) {
    if (k === 'class') el.className = v;
    else if (k.startsWith('on') && typeof v === 'function')
      el.addEventListener(k.slice(2).toLowerCase(), v, { passive: true });
    else if (k === 'style' && typeof v === 'object')
      el.setAttribute('style', Object.entries(v).map(([a, b]) => `${a}:${b}`).join(';'));
    else if (v !== false && v != null) el.setAttribute(k, v === true ? '' : v);
  }
  for (const c of children.flat()) {
    if (c == null || c === false) continue;
    if (typeof c === 'string' || typeof c === 'number' || typeof c === 'boolean')
      el.appendChild(document.createTextNode(String(c)));
    else el.appendChild(c);
  }
  return el;
}

