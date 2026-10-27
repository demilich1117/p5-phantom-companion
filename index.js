/* P5 companion: owns only its controls and data-p5-* attributes.
   No chat access, backend, model calls, native theme writes or character layout overrides. */
const KEY = 'p5PhantomTheme';
const COMMANDS = [
  ['ai-config-button','TACTICS','作战指令'],['sys-settings-button','CONNECT','潜入连接'],
  ['advanced-formatting-button','PROMPTS','秘仪编排'],['WI-SP-button','ARCHIVE','认知档案'],
  ['user-settings-button','CONFIG','怪盗手册'],['backgrounds-button','MEMENTOS','印象空间'],
  ['extensions-settings-button','TOOLS','秘密道具'],['persona-management-button','PERSONA','我的假面'],
  ['rightNavHolder','BONDS','羁绊名册'],
];
const MODES = new Set(['theme', 'classic', 'night', 'system']);
const root = document.documentElement;
const moon = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M19.5 15.8A9 9 0 018.2 4.5 9 9 0 1019.5 15.8Z"/></svg>';
const sun = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m12 0 2 6 5-3-1 6 6 3-6 2 1 6-5-3-2 7-2-7-6 3 2-6-6-2 6-3-2-6 6 3Z"/></svg>';

function initialise() {
  const context = window.SillyTavern?.getContext?.();
  if (!context?.extensionSettings || typeof context.saveSettingsDebounced !== 'function') return;
  window.__p5PhantomDispose?.();
  const controller = new AbortController();
  const media = matchMedia('(prefers-color-scheme: dark)');
  const settings = context.extensionSettings[KEY] ??= {};
  const mode = () => MODES.has(settings.mode) ? settings.mode : 'theme';
  const button = document.createElement('button');
  button.id = 'p5-mode-toggle'; button.type = 'button';
  const panel = document.createElement('div');
  panel.id = 'p5-companion-settings'; panel.className = 'extension_container';
  panel.innerHTML = `<div class="inline-drawer">
    <div class="inline-drawer-toggle inline-drawer-header"><b>P5 / DISPLAY MODE</b><div class="inline-drawer-icon fa-solid fa-circle-chevron-down down"></div></div>
    <div class="inline-drawer-content">
      <label class="p5-setting-row" for="p5-mode-select"><span>DISPLAY</span><select id="p5-mode-select">
        <option value="theme">FOLLOW THEME</option><option value="classic">CLASSIC</option><option value="night">NIGHT</option><option value="system">FOLLOW SYSTEM</option>
      </select></label><small>Use the moon button to switch. On mobile it sits beside the chat title. Your choice is saved for P5 themes.</small>
    </div></div>`;
  const select = panel.querySelector('select');
  let disposed = false, queued = false, currentNight = false;
  const wheelButton = document.createElement('button'); wheelButton.id='p5-wheel-toggle'; wheelButton.type='button';
  wheelButton.textContent='COMMAND'; wheelButton.setAttribute('aria-label','打开 P5 指令轮盘'); wheelButton.setAttribute('aria-controls','top-settings-holder');
  const desktop=matchMedia('(min-width:1001px)');
  let wheelEnabled=false;
  function setWheel(open,restoreFocus=false) {
    if (!wheelEnabled) return;
    root.dataset.p5Wheel=open?'open':'closed'; wheelButton.setAttribute('aria-expanded',String(open));
    wheelButton.setAttribute('aria-label',open?'收起 P5 指令轮盘':'打开 P5 指令轮盘');
    if(restoreFocus)wheelButton.focus();
    else if(open && desktop.matches) document.querySelector('#top-settings-holder > .drawer .drawer-icon')?.focus({preventScroll:true});
  }
  function syncWheel(enabled) {
    wheelEnabled=enabled; wheelButton.hidden=!enabled;
    if(!enabled){root.removeAttribute('data-p5-wheel');wheelButton.remove();return;}
    if(!wheelButton.isConnected)document.body.append(wheelButton);
    if(!root.hasAttribute('data-p5-wheel'))setWheel(false);
  }
  wheelButton.addEventListener('click',event=>{event.stopPropagation();setWheel(root.dataset.p5Wheel!=='open');},{signal:controller.signal});
  document.addEventListener('click',event=>{
    if(root.dataset.p5Wheel!=='open'||wheelButton.contains(event.target))return;
    if(event.target.closest('#top-settings-holder > .drawer > .drawer-toggle') || !event.target.closest('#top-settings-holder'))setWheel(false);
  },{signal:controller.signal});
  document.addEventListener('keydown',event=>{if(event.key==='Escape'&&root.dataset.p5Wheel==='open'){event.preventDefault();setWheel(false,true);}},{signal:controller.signal});
  desktop.addEventListener('change',()=>{if(wheelEnabled)setWheel(false);},{signal:controller.signal});
  const commandArt = new Map();
  function clearCommands() { for (const art of commandArt.values()) art.remove(); commandArt.clear(); }
  function decorateCommands(active) {
    if (!active) { clearCommands(); return; }
    for (const [id,word,subtitle] of COMMANDS) {
      const icon = document.querySelector('#' + id + ' > .drawer-toggle .drawer-icon');
      if (!icon || commandArt.get(id)?.parentElement === icon) continue;
      commandArt.get(id)?.remove();
      const art = document.createElement('span'); art.className = 'p5-command-art'; art.setAttribute('aria-hidden','true');
      const badge = document.createElement('span'); badge.className = 'p5-command-badge';
      const lettering = document.createElement('span'); lettering.className = 'p5-command-lettering';
      const title = document.createElement('span'); title.className = 'p5-command-word';
      for (const letter of word) { const glyph = document.createElement('b'); glyph.className = 'p5-command-letter'; glyph.textContent = letter; title.append(glyph); }
      const hint = document.createElement('span'); hint.className = 'p5-command-subtitle'; hint.textContent = subtitle;
      lettering.append(title,hint); art.append(badge,lettering); icon.append(art); commandArt.set(id,art);
    }
  }
  function refresh() {
    if (disposed) return;
    queued = false;
    const style = getComputedStyle(root);
    const active = style.getPropertyValue('--p5-theme-active').trim() === '1';
    button.hidden = !active; panel.hidden = !active;
    const hasWheel=active && style.getPropertyValue('--p5-wheel-enabled').trim() === '1';
    syncWheel(hasWheel); decorateCommands(hasWheel);
    if (!active) { root.removeAttribute('data-p5-mode'); root.removeAttribute('data-p5-host'); return; }
    if (window.__TAURITAVERN__) root.dataset.p5Host = 'tt';
    const chosen = mode();
    currentNight = chosen === 'night' || (chosen === 'system' && media.matches) || (chosen === 'theme' && style.getPropertyValue('--p5-night-default').trim() === '1');
    root.dataset.p5Mode = currentNight ? 'night' : 'classic';
    const label = currentNight ? 'Switch to Classic' : 'Switch to Night';
    button.setAttribute('aria-label', label); button.title = label;
    button.setAttribute('aria-pressed', String(currentNight));
    button.innerHTML = (currentNight ? sun : moon) + `<span class="p5-mode-label">${currentNight ? 'NIGHT' : 'CLASSIC'}</span>`;
    select.value = chosen;
    const rail = document.getElementById('top-settings-holder');
    if (rail && button.parentElement !== rail) rail.append(button);
    const extensions = document.getElementById('extensions_settings2') || document.getElementById('extensions_settings');
    if (extensions && panel.parentElement !== extensions) extensions.prepend(panel);
  }
  function schedule() { if (!queued && !disposed) { queued = true; requestAnimationFrame(refresh); } }
  function save(chosen) { settings.mode = chosen; context.saveSettingsDebounced(); refresh(); }
  button.addEventListener('click', () => save(currentNight ? 'classic' : 'night'), {signal:controller.signal});
  select.addEventListener('change', () => save(select.value), {signal:controller.signal});
  media.addEventListener('change', schedule, {signal:controller.signal});
  // Observe style changes only. Message rendering and private content are never inspected.
  const observer = new MutationObserver(records => {
    if (records.some(record => record.target.nodeName === 'STYLE' || record.target.parentElement?.nodeName === 'STYLE' || [...record.addedNodes,...record.removedNodes].some(node => node.nodeName === 'STYLE' || node.nodeName === 'LINK'))) schedule();
  });
  observer.observe(document.head, {childList:true,subtree:true,characterData:true});
  const nativeStyle = document.getElementById('custom-style');
  if (nativeStyle && !document.head.contains(nativeStyle)) observer.observe(nativeStyle,{childList:true,subtree:true,characterData:true});
  context.eventSource?.on(context.event_types.APP_READY, refresh);
  window.addEventListener('pageshow',schedule,{signal:controller.signal});
  window.__p5PhantomDispose = () => {
    disposed = true; controller.abort(); observer.disconnect();
    context.eventSource?.removeListener(context.event_types.APP_READY,refresh);
    clearCommands(); wheelButton.remove(); root.removeAttribute('data-p5-wheel'); button.remove(); panel.remove(); root.removeAttribute('data-p5-mode'); root.removeAttribute('data-p5-host');
    delete window.__p5PhantomDispose;
  };
  refresh();
}

export function disable() { window.__p5PhantomDispose?.(); }

await (window.__TAURITAVERN__?.ready ?? window.__TAURITAVERN_MAIN_READY__);
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initialise, {once:true});
else initialise();
