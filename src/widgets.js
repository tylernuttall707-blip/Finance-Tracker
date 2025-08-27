import {h, clamp, uid} from './dom-utils.js';
export function widget(id, content, size, heightMode, {state}) {
  const el = h('section', {
    class: 'panel p4 drag',
    draggable: 'true',
    'data-widget-id': id,
    style: `grid-column: span ${Math.max(1, size || 1)}`
  }, content);
  const hmode = heightMode || state.widgetHeightMode[id] || 'auto';
  let hpx = null;
  if (hmode === 'short') hpx = 240;
  else if (hmode === 'medium') hpx = 340;
  else if (hmode === 'tall') hpx = 440;
  else if (hmode === 'fixed') hpx = clamp(Number(state.widgetFixedH[id] || 320), 180, 900);
  if (hmode !== 'auto') {
    el.style.maxHeight = hpx + 'px';
    el.style.overflow = 'auto';
  }
  return el;
}

export function addWidgetControls(wrapper, id, orderKey, dash, {state, save, render, configureWidget}) {
  const size = state.widgetSize[id] || 1;
  const hmode = state.widgetHeightMode[id] || 'auto';
  const heightId = uid();
  const pxId = uid();
  const row = h('div', { style: 'display:flex;gap:8px;justify-content:flex-end;margin-bottom:6px;align-items:center;' },
    h('div', { class: 'sizepick' },
      ...[1, 2, 3, 4, 5, 6].map(n => h('button', { 'aria-pressed': String(size === n), onclick: () => { state.widgetSize[id] = n; save(); wrapper.style.gridColumn = 'span ' + n; } }, String(n)))
    ),
    h('div', { class: 'field', style: 'width:160px;' },
      h('label', {for: heightId}, 'Height'),
      h('select', {id: heightId, onchange: e => { state.widgetHeightMode[id] = e.target.value; save(); render(); } },
        ...[['auto', 'Auto'], ['short', 'Short'], ['medium', 'Medium'], ['tall', 'Tall'], ['fixed', 'Fixed px']].map(([v, l]) => h('option', { value: v, selected: hmode === v ? 'selected' : null }, l))
      )
    ),
    h('div', { class: 'field', style: 'width:110px;' + (hmode === 'fixed' ? '' : 'display:none;') },
      h('label', {for: pxId}, 'Pixels'),
      h('input', { id: pxId, type: 'number', value: String(state.widgetFixedH[id] || 320), oninput: e => { state.widgetFixedH[id] = e.target.value; save(); render(); } })
    ),
    h('button', { class: 'btn tiny', onclick: () => configureWidget(id) }, 'Configure'),
    h('button', { class: 'btn tiny', onclick: () => { state[orderKey] = state[orderKey].filter(x => x !== id); save(); render(); } }, 'Remove')
  );
  wrapper.prepend(row);
}

export function enableDrag(container, orderKey, {state, save}) {
  const grid = typeof container === 'string' ? document.getElementById(container) : container;
  if (!grid) return;
  let dragging = null, placeholder = null;
  function onDragStart(e) {
    const el = e.currentTarget; dragging = el; el.classList.add('dragging'); e.dataTransfer.effectAllowed = 'move'; placeholder = document.createElement('div'); placeholder.className = 'placeholder'; placeholder.style.gridColumn = el.style.gridColumn || 'span 1'; el.after(placeholder); }
  function onDragOver(e) {
    e.preventDefault();
    const target = e.target.closest('[data-widget-id]');
    if (!target || target === dragging || !grid.contains(target)) return;
    const rect = target.getBoundingClientRect();
    const before = (e.clientY - rect.top) < rect.height / 2;
    before ? grid.insertBefore(placeholder, target) : grid.insertBefore(placeholder, target.nextSibling);
  }
  function onDrop(e) { e.preventDefault(); if (!placeholder || !dragging) return; placeholder.replaceWith(dragging); dragging.classList.remove('dragging'); dragging = null; placeholder = null; persist(); }
  function onDragEnd() { if (placeholder && dragging) { placeholder.replaceWith(dragging); } dragging?.classList.remove('dragging'); dragging = null; placeholder = null; persist(); }
  function persist() {
    const ids = [];
    grid.querySelectorAll('[data-widget-id]').forEach(el => {
      ids.push(el.getAttribute('data-widget-id'));
    });
    state[orderKey] = ids;
    save();
  }
  grid.querySelectorAll('[data-widget-id]').forEach(el => {
    el.addEventListener('dragstart', onDragStart);
    el.addEventListener('dragover', onDragOver, { passive: false });
    el.addEventListener('drop', onDrop, { passive: false });
    el.addEventListener('dragend', onDragEnd);
  });
}
