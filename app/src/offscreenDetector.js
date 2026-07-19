// Author: Petter Andersson
// Dev tool: detect content rendered outside the visible viewport.
//
// The whole game is a fixed 1600x1000 canvas scaled to fit the viewport (see ScaleStage),
// with overflow:hidden — so anything pushed past the edges is silently CLIPPED and invisible.
// Before auto-scaling you could zoom the browser out to spot stray units/characters rendered
// off-board. This restores that check: press F9 to toggle a live overlay that
//   - draws a red box around anything partially past a viewport edge (still on-screen),
//   - lists anything FULLY off-screen (can't be boxed, since it's outside the viewport),
//   - re-scans ~3x/sec so it catches dynamic battle content too.
//
// Zero cost until toggled on. Guarded so it never runs in a production build.

const EDGE_TOL = 1; // px of slop before something counts as "past the edge"
const MIN_SIZE = 3; // ignore hairline/zero-size elements
const SCAN_MS = 350;

let enabled = false;
let layer = null;
let boxes = null;
let badge = null;
let timer = null;

// Note: don't test offsetParent — it's null for position:fixed elements, which we
// still want to check. A non-zero bounding rect (filtered below) already implies the
// element is laid out; here we only rule out explicitly hidden nodes.
const isVisible = (el, style) =>
  style.visibility !== 'hidden' &&
  style.display !== 'none' &&
  Number(style.opacity) !== 0;

// Describe an element compactly: tag#id.class
const describe = (el) => {
  const id = el.id ? `#${el.id}` : '';
  const cls = typeof el.className === 'string' && el.className
    ? `.${el.className.trim().split(/\s+/).slice(0, 2).join('.')}`
    : '';
  return `${el.tagName.toLowerCase()}${id}${cls}`;
};

const scan = () => {
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const fully = []; // {el, rect, where}
  const partial = []; // {el, rect}

  const all = document.body.querySelectorAll('*');
  for (const el of all) {
    if (el.closest('#offscreen-overlay')) continue; // never flag our own UI
    const r = el.getBoundingClientRect();
    if (r.width < MIN_SIZE || r.height < MIN_SIZE) continue;
    const style = window.getComputedStyle(el);
    if (!isVisible(el, style)) continue;

    const offLeft = r.right <= 0;
    const offRight = r.left >= vw;
    const offTop = r.bottom <= 0;
    const offBottom = r.top >= vh;
    if (offLeft || offRight || offTop || offBottom) {
      // Fully outside the viewport. Report only leaf-ish nodes so we don't list a
      // stray container AND every descendant.
      if (el.children.length === 0 || ['IMG', 'CANVAS', 'BUTTON'].includes(el.tagName)) {
        const dirs = [];
        if (offLeft) dirs.push(`${Math.round(-r.right)}px past left`);
        if (offRight) dirs.push(`${Math.round(r.left - vw)}px past right`);
        if (offTop) dirs.push(`${Math.round(-r.bottom)}px past top`);
        if (offBottom) dirs.push(`${Math.round(r.top - vh)}px past bottom`);
        fully.push({ el, rect: r, where: dirs.join(', ') });
      }
      continue;
    }

    const past =
      r.left < -EDGE_TOL || r.top < -EDGE_TOL ||
      r.right > vw + EDGE_TOL || r.bottom > vh + EDGE_TOL;
    if (past && (el.children.length === 0 || ['IMG', 'CANVAS'].includes(el.tagName))) {
      partial.push({ el, rect: r });
    }
  }
  return { fully, partial, vw, vh };
};

const render = () => {
  if (!layer) return;
  const { fully, partial, vw, vh } = scan();
  boxes.innerHTML = ''; // clear only the outline boxes, never the badge

  // Red boxes around partially-clipped elements (these are still on-screen to outline).
  for (const { rect } of partial) {
    const box = document.createElement('div');
    const left = Math.max(0, rect.left);
    const top = Math.max(0, rect.top);
    Object.assign(box.style, {
      position: 'fixed',
      left: `${left}px`,
      top: `${top}px`,
      width: `${Math.min(vw, rect.right) - left}px`,
      height: `${Math.min(vh, rect.bottom) - top}px`,
      border: '2px solid #ff3b30',
      boxShadow: '0 0 0 1px rgba(255,255,255,0.6)',
      pointerEvents: 'none',
      zIndex: 2147483646,
    });
    boxes.appendChild(box);
  }

  const total = fully.length + partial.length;
  badge.style.background = total ? 'rgba(180,20,20,0.94)' : 'rgba(20,120,40,0.94)';
  const lines = [
    `<strong>Off-screen check (F9)</strong>`,
    total ? `⚠ ${total} element(s) off-screen` : `✓ nothing off-screen`,
  ];
  if (partial.length) lines.push(`<em>${partial.length} clipped at edge (boxed red)</em>`);
  for (const { el, where } of fully.slice(0, 12)) {
    lines.push(`• ${describe(el)} — ${where}`);
  }
  if (fully.length > 12) lines.push(`…and ${fully.length - 12} more`);
  badge.innerHTML = lines.join('<br>');
};

const start = () => {
  layer = document.createElement('div');
  layer.id = 'offscreen-overlay';
  Object.assign(layer.style, {
    position: 'fixed', inset: '0', pointerEvents: 'none', zIndex: 2147483646,
  });

  boxes = document.createElement('div'); // holds outline boxes; cleared every render
  layer.appendChild(boxes);

  badge = document.createElement('div');
  Object.assign(badge.style, {
    position: 'fixed', top: '8px', right: '8px', maxWidth: '340px', maxHeight: '70vh',
    overflow: 'auto', padding: '8px 10px', borderRadius: '8px',
    font: '12px/1.45 monospace', color: '#fff', pointerEvents: 'auto',
    zIndex: 2147483647, boxShadow: '0 4px 16px rgba(0,0,0,0.5)', whiteSpace: 'normal',
  });
  layer.appendChild(badge);
  document.body.appendChild(layer);

  render();
  timer = window.setInterval(render, SCAN_MS);
  window.addEventListener('resize', render);
};

const stop = () => {
  window.clearInterval(timer);
  window.removeEventListener('resize', render);
  if (layer) layer.remove();
  layer = null;
  boxes = null;
  badge = null;
  timer = null;
};

const toggle = () => {
  enabled = !enabled;
  if (enabled) start();
  else stop();
  console.log(`[offscreen-detector] ${enabled ? 'ON' : 'OFF'}`);
};

// Install the F9 toggle once. Never in production.
export function installOffscreenDetector() {
  if (import.meta.env && import.meta.env.PROD) return;
  window.addEventListener('keydown', (e) => {
    if (e.key === 'F9') {
      e.preventDefault();
      toggle();
    }
  });
  console.log('[offscreen-detector] ready — press F9 to toggle');
}
