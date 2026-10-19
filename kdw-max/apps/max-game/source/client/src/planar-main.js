import {BOARD, validateCatalog, missionSteps, createRun, placeNode, removeNode, evaluateRoute, tickRun} from './planar-game.mjs';
import {wallLayout} from './wall-layout.mjs';

const stage = document.querySelector('#stage');
const wall = new URLSearchParams(location.search).get('surface') === 'right';
document.documentElement.dataset.surface = wall ? 'right' : 'standalone';
let catalog, mission = null, run = null, selected = null, drag = null, paused = false;
let completed = new Set(), storageKey, lastStatus = '', suppressClick = false;
const drafts = new Map();
const escape = value => String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const button = (action, label) => `<button type="button" data-action="${action}">${label}</button>`;
function fit() {
  const rect = wall ? wallLayout(innerWidth, innerHeight) : {scale: Math.min(innerWidth / 1920, innerHeight / 1080)};
  stage.style.transform = `scale(${rect.scale})`;
  stage.style.left = `${wall ? rect.left : (innerWidth - 1920 * rect.scale) / 2}px`;
  stage.style.top = `${wall ? rect.top : (innerHeight - 1080 * rect.scale) / 2}px`;
}
fit(); addEventListener('resize', fit);
function saveCompletion() { try { sessionStorage.setItem(storageKey, JSON.stringify([...completed])); } catch {} }
function header(title, controls = '') {
  return `<header><img src="./brand/assets/logos/max-mono-white.svg" alt="MAX"><span>${escape(title)}</span><nav>${controls}</nav></header>`;
}
function renderMenu() {
  mission = null; run = null; selected = null;
  stage.dataset.screen = 'missions';
  stage.innerHTML = header('Возможности рядом', button('reset', 'Новая игра')) + `
    <section class="menu-heading"><p class="eyebrow">ЧЕТЫРЕ МИССИИ MAX</p><h1>Выбери свою цель</h1>
    <p>Размещай действия на поле и соединяй их в маршрут.</p></section>
    <div class="mission-menu">${catalog.missions.map(m => `<button class="mission-choice" data-mission="${m.id}">
      <span class="number">${m.number}</span><span class="mission-copy"><strong>${escape(m.title)}</strong>
      <span>${escape(m.description)}</span><em>${completed.has(m.id) ? 'Пройдено · сыграть ещё раз' : 'Начать миссию'}</em></span></button>`).join('')}</div>
    <p class="menu-progress">Пройдено ${completed.size} из ${catalog.missions.length}</p>`;
}
function openMission(id) {
  mission = catalog.missions.find(m => m.id === id);
  if (!mission) return renderMenu();
  run = drafts.get(id) || createRun(mission);
  selected = null;
  renderMission();
}
function renderMission() {
  stage.dataset.screen = 'game'; lastStatus = '';
  const steps = missionSteps(mission, run.branch);
  stage.innerHTML = header(`Миссия ${mission.number} / 4`, button('menu', 'Все миссии') + button('restart', 'Заново')) + `
    <section class="mission-heading"><h1>${escape(mission.title)}</h1><p>${escape(mission.description)}</p></section>
    <div class="mission-tools">${mission.branches ? `<span>С чего начать продвижение:</span>${mission.branches.map(b => `<button data-branch="${b.id}" aria-pressed="${run.branch === b.id}">${escape(b.label)}</button>`).join('')}` : '<span>Собери маршрут слева направо: 1 → 2 → 3…</span>'}</div>
    <section class="board" aria-label="Двумерное игровое поле" tabindex="0">
      <svg class="links" viewBox="0 0 ${BOARD.width} ${BOARD.height}" aria-hidden="true"></svg>
      <div class="endpoint start"><span>А</span><strong>${escape(mission.start)}</strong></div>
      <div class="endpoint finish"><span>Б</span><strong>${escape(mission.finish)}</strong></div>
      ${steps.map((s,i) => `<button class="placed-node" data-node="${s.id}" hidden aria-label="${i+1}. ${escape(s.label)}"><span class="number">${i+1}</span><strong>${escape(s.label)}</strong></button>`).join('')}
    </section>
    <div class="route-status"><p role="status" aria-live="polite" id="route-status"></p><button data-action="remove" disabled>Убрать выбранное</button></div>
    <div class="inventory" aria-label="Действия миссии">${steps.map((s,i) => `<button data-inventory="${s.id}" title="${escape(s.detail)}"><span class="number">${i+1}</span><strong>${escape(s.label)}</strong></button>`).join('')}</div>
    <p class="help">Выбери цифру и коснись поля или перетащи её. Сближай соседние шаги, пока весь маршрут не соединится.</p>
    <section class="result" hidden><p class="eyebrow">МИССИЯ ВЫПОЛНЕНА</p><h2>Маршрут собран</h2><p>${escape(mission.result)}</p>${button('menu', 'Выбрать другую миссию')}${button('restart', 'Пройти ещё раз')}</section>`;
  updateBoard();
}
function visibleRun() {
  return drag?.preview ? placeNode(run, mission, drag.id, drag.preview, performance.now()) : run;
}
function updateBoard() {
  if (!run || !mission) return;
  const view = visibleRun(), ev = evaluateRoute(view, mission, performance.now());
  const board = stage.querySelector('.board');
  for (const node of board.querySelectorAll('[data-node]')) {
    const p = view.placements[node.dataset.node]; node.hidden = !p;
    if (p) { node.style.left = p.x + 'px'; node.style.top = p.y + 'px'; }
    node.classList.toggle('selected', selected === node.dataset.node);
    node.classList.toggle('dragging', drag?.preview && drag.id === node.dataset.node);
    node.setAttribute('aria-pressed', String(selected === node.dataset.node));
  }
  for (const node of stage.querySelectorAll('[data-inventory]')) {
    const id = node.dataset.inventory;
    node.classList.toggle('selected', selected === id);
    node.classList.toggle('on-field', !!view.placements[id]);
    node.setAttribute('aria-pressed', String(selected === id));
  }
  board.querySelector('.links').innerHTML = ev.links.filter(l => l.present).map(l => `<line x1="${l.a.x}" y1="${l.a.y}" x2="${l.b.x}" y2="${l.b.y}" class="${l.connected ? 'connected' : 'pending'}"/>`).join('');
  stage.querySelector('[data-action="remove"]').disabled = !run.placements[selected] || run.status === 'complete';
  const active = ev.links.filter(l => l.connected).length;
  const status = run.status === 'complete' ? 'Готово! Все действия соединены.' : drag ? 'Размести действие на поле' :
    ev.placed < ev.total ? `На поле ${ev.placed} из ${ev.total} · ${selected ? 'коснись поля для размещения' : 'выбери действие внизу'}` :
    active === ev.links.length ? 'Маршрут соединён' : `Связи ${active} из ${ev.links.length} · порядок 1 → 2 → 3, шаги должны быть рядом`;
  if (status !== lastStatus) { stage.querySelector('#route-status').textContent = status; lastStatus = status; }
  stage.querySelector('.result').hidden = run.status !== 'complete';
  board.inert = run.status === 'complete';
  stage.querySelector('.inventory').inert = run.status === 'complete';
}
function boardPoint(event) {
  const r = stage.querySelector('.board').getBoundingClientRect();
  const x = (event.clientX - r.left) / r.width * BOARD.width, y = (event.clientY - r.top) / r.height * BOARD.height;
  return {x, y, inside: x >= 0 && y >= 0 && x <= BOARD.width && y <= BOARD.height};
}
function cancelDrag() {
  const pointer = drag?.pointer; drag = null;
  if (pointer != null && stage.hasPointerCapture(pointer)) stage.releasePointerCapture(pointer);
  if (run) run = {...run, holdSince: null};
  updateBoard();
}
stage.addEventListener('pointerdown', event => {
  if (!run || paused || run.status === 'complete' || event.button !== 0 || drag) return;
  const item = event.target.closest('[data-inventory], [data-node]');
  if (!item) return;
  event.preventDefault();
  selected = item.dataset.inventory || item.dataset.node;
  drag = {id: selected, pointer: event.pointerId, x: event.clientX, y: event.clientY, moved: false, preview: null};
  run = {...run, holdSince: null};
  stage.setPointerCapture(event.pointerId); updateBoard();
});
stage.addEventListener('pointermove', event => {
  if (!drag || drag.pointer !== event.pointerId) return;
  const point = boardPoint(event);
  drag.moved ||= Math.hypot(event.clientX - drag.x, event.clientY - drag.y) > 6;
  drag.preview = drag.moved && point.inside ? point : null;
  updateBoard();
});
stage.addEventListener('pointerup', event => {
  if (!drag || drag.pointer !== event.pointerId) return;
  const point = boardPoint(event), active = drag;
  drag = null;
  if (stage.hasPointerCapture(event.pointerId)) stage.releasePointerCapture(event.pointerId);
  if (point.inside && active.moved) {
    run = placeNode(run, mission, active.id, point, performance.now()); drafts.set(mission.id, run);
  }
  suppressClick = true; setTimeout(() => { suppressClick = false; }, 0);
  updateBoard();
});
stage.addEventListener('pointercancel', cancelDrag);
stage.addEventListener('lostpointercapture', () => { if (drag) cancelDrag(); });
stage.addEventListener('click', event => {
  if (paused || suppressClick) return;
  const target = event.target.closest('button');
  if (target?.dataset.mission) return openMission(target.dataset.mission);
  const action = target?.dataset.action;
  if (action === 'reset') { completed.clear(); drafts.clear(); saveCompletion(); return renderMenu(); }
  if (action === 'retry') return boot();
  if (!run) return;
  if (action === 'menu') { drafts.set(mission.id, run); return renderMenu(); }
  if (action === 'restart') { run = createRun(mission, run.branch); drafts.set(mission.id, run); selected = null; return renderMission(); }
  if (action === 'remove') { run = removeNode(run, selected); drafts.set(mission.id, run); return updateBoard(); }
  if (target?.dataset.branch && run.branch !== target.dataset.branch) {
    // Common steps keep their coordinates; a tool choice invalidates the previous route/hold.
    const previous = run;
    run = createRun(mission, target.dataset.branch);
    for (const s of mission.steps) if (previous.placements[s.id]) run.placements[s.id] = {...previous.placements[s.id], droppedAt: performance.now()};
    selected = null; drafts.set(mission.id, run); return renderMission();
  }
  const item = target?.dataset.inventory || target?.dataset.node;
  if (item) { selected = item; return updateBoard(); }
  if (selected && event.target.closest('.board') && run.status !== 'complete') {
    run = placeNode(run, mission, selected, boardPoint(event), performance.now()); drafts.set(mission.id, run); updateBoard();
  }
});
stage.addEventListener('keydown', event => {
  if (!run || paused) return;
  if (event.key === 'Escape') { cancelDrag(); selected = null; updateBoard(); return; }
  if (['Delete', 'Backspace'].includes(event.key) && selected) { event.preventDefault(); run = removeNode(run, selected); updateBoard(); }
  const deltas = {ArrowLeft: [-20,0], ArrowRight: [20,0], ArrowUp: [0,-20], ArrowDown: [0,20]};
  if (selected && deltas[event.key]) {
    event.preventDefault(); const p = run.placements[selected] || {x:BOARD.width/2,y:BOARD.height/2};
    const [x,y] = deltas[event.key]; run = placeNode(run,mission,selected,{x:p.x+x,y:p.y+y},performance.now()); updateBoard();
  }
});
addEventListener('blur', cancelDrag);
// The parent worker releases Electron's mouse button on remote cancellation.
// Clear the preview synchronously before that release can be interpreted as a drop.
addEventListener('max-service-pointer-cancel', cancelDrag);
document.addEventListener('visibilitychange', () => { if (document.hidden) cancelDrag(); });
addEventListener('message', event => {
  if (event.source !== parent || event.origin !== location.origin || event.data?.type !== 'max-service-state') return;
  paused = event.data.playing === false;
  document.documentElement.dataset.servicePaused = String(paused);
  stage.inert = paused;
  cancelDrag();
});
const clock = setInterval(() => {
  if (!run || run.status === 'complete') return;
  run = tickRun(run, mission, performance.now(), {interacting: !!drag, paused, hidden: document.hidden});
  drafts.set(mission.id, run);
  if (run.status === 'complete') { completed.add(mission.id); saveCompletion(); }
  if (!document.hidden && !paused) updateBoard();
}, 50);
addEventListener('pagehide', () => clearInterval(clock), {once:true});
// Diagnostics expose a snapshot, never mutation hooks or service credentials.
window.maxGameSnapshot = () => ({version:'2d-1',screen:stage.dataset.screen,mission:mission?.id,status:run?.status,branch:run?.branch,
  placements: structuredClone(run?.placements || {}),completed:[...completed],paused,earth:false});
async function boot() {
  try {
    const response = await fetch('./config/client-missions.json');
    if (!response.ok) throw Error(`Миссии: HTTP ${response.status}`);
    catalog = validateCatalog(await response.json());
    storageKey = `max-client-progress:${catalog.revision}:${wall ? 'wall' : 'standalone'}`;
    try { const stored = JSON.parse(sessionStorage.getItem(storageKey) || '[]'); if (Array.isArray(stored)) completed = new Set(stored.filter(id => catalog.missions.some(m => m.id === id))); } catch {}
    await document.fonts.ready;
    renderMenu(); document.documentElement.dataset.gameReady = 'true';
  } catch (error) {
    console.error(error);
    stage.innerHTML = `<div class="boot-error"><h1>Не удалось загрузить миссии</h1><p>${escape(error.message)}</p>${button('retry','Повторить')}</div>`;
  }
}
boot();
