/* P5 companion owns its controls, CSS preferences and data-p5-* attributes.
   No chat access, model calls, native theme writes or character modifications. */
import { portrait, bounds, place, normalise } from './controls.js';
const KEY = 'p5PhantomTheme';
const COMMANDS = [
    ['ai-config-button','TACTICS','作战指令'], ['sys-settings-button','CONNECT','潜入连接'],
    ['advanced-formatting-button','PROMPTS','秘仪编排'], ['WI-SP-button','ARCHIVE','认知档案'],
    ['user-settings-button','CONFIG','怪盗手册'], ['backgrounds-button','MEMENTOS','印象空间'],
    ['extensions-settings-button','TOOLS','秘密道具'], ['persona-management-button','PERSONA','我的假面'],
    ['rightNavHolder','BONDS','羁绊名册'],
];
const MODES = new Set(['theme','classic','night','system']);
const root = document.documentElement;
const moon = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M19.5 15.8A9 9 0 018.2 4.5 9 9 0 1019.5 15.8Z"/></svg>';
const sun = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m12 0 2 6 5-3-1 6 6 3-6 2 1 6-5-3-2 7-2-7-6 3 2-6-6-2 6-3-2-6 6 3Z"/></svg>';

function initialise() {
    const context = window.SillyTavern?.getContext?.();
    if (!context?.extensionSettings || typeof context.saveSettingsDebounced !== 'function') return;
    window.__p5PhantomDispose?.();
    const controller = new AbortController(), signal = controller.signal;
    const media = matchMedia('(prefers-color-scheme: dark)'), desktop = matchMedia('(min-width:1001px)');
    const settings = context.extensionSettings[KEY] ??= {};
    const save = () => context.saveSettingsDebounced();
    const mode = () => MODES.has(settings.mode) ? settings.mode : 'theme';
    const ownedVariables = new Set();
    const setVariable = (name,value) => {root.style.setProperty(name,value);ownedVariables.add(name);};
    const removeVariable = name => {root.style.removeProperty(name);ownedVariables.delete(name);};
    const button = document.createElement('button'); button.id='p5-mode-toggle'; button.type='button';
    const panel = document.createElement('div'); panel.id='p5-companion-settings'; panel.className='extension_container';
    panel.innerHTML = `<div class="inline-drawer">
      <div class="inline-drawer-toggle inline-drawer-header"><b>P5 / PHANTOM CONTROLS</b><div class="inline-drawer-icon fa-solid fa-circle-chevron-down down"></div></div>
      <div class="inline-drawer-content">
        <label class="p5-setting-row" for="p5-mode-select"><span>显示模式</span><select id="p5-mode-select"><option value="theme">跟随主题</option><option value="classic">CLASSIC</option><option value="night">NIGHT</option><option value="system">跟随系统</option></select></label>
        <p class="p5-settings-help">头像默认取景偏上。竖向位置越小，越靠近原图顶部；横向位置越小，越靠左。分别调整两类头像，不改动头像文件。</p>
        ${['assistant','user'].map((role,i)=>`<fieldset class="p5-portrait-settings"><legend>${i?'用户头像':'角色头像'}</legend>${[['height','横幅高度',75,150],['y','竖向取景',0,100],['x','横向取景',0,100]].map(([key,label,min,max])=>`<label class="p5-portrait-row" for="p5-${role}-${key}"><span>${label}</span><input id="p5-${role}-${key}" data-role="${role}" data-setting="${key}" type="range" min="${min}" max="${max}" step="1"><output for="p5-${role}-${key}"></output></label>`).join('')}<button type="button" class="menu_button p5-portrait-reset" data-role="${role}">跟随主题默认值</button></fieldset>`).join('')}
        <p class="p5-settings-help">电脑端拖动中央战车牌移动轮盘；COMMAND 按钮也可拖动。聚焦战车牌后可用方向键移动，Shift 加速，Home 复位。位置会自动保存。</p>
        <button id="p5-wheel-reset" type="button" class="menu_button">重置轮盘与入口位置</button>
      </div></div>`;
    const select = panel.querySelector('#p5-mode-select');
    const wheelButton = document.createElement('button'); wheelButton.id='p5-wheel-toggle'; wheelButton.type='button'; wheelButton.textContent='COMMAND';
    wheelButton.setAttribute('aria-label','打开 P5 指令轮盘'); wheelButton.setAttribute('aria-controls','top-settings-holder'); wheelButton.title='点击打开轮盘，拖动移动入口';
    const handle = document.createElement('button'); handle.id='p5-wheel-handle'; handle.type='button';
    handle.setAttribute('aria-label','移动 P5 指令轮盘'); handle.title='拖动战车牌移动轮盘；方向键移动，Home 复位';
    const caption = document.createElement('span'); caption.textContent='DRAG / 移动'; handle.append(caption);
    let disposed=false, queued=false, currentNight=false, wheelEnabled=false, themeActive=false, draggable=false;
    const commandArt = new Map();
    const rail = () => document.getElementById('top-settings-holder');
    function setWheel(open,restoreFocus=false) {
        if (!wheelEnabled) return;
        root.dataset.p5Wheel=open?'open':'closed'; wheelButton.setAttribute('aria-expanded',String(open));
        wheelButton.setAttribute('aria-label',open?'收起 P5 指令轮盘':'打开 P5 指令轮盘');
        handle.tabIndex=open&&desktop.matches?0:-1;
        if (restoreFocus) wheelButton.focus({preventScroll:true});
        else if (open && desktop.matches) { updatePositions(); document.querySelector('#top-settings-holder > .drawer .drawer-icon')?.focus({preventScroll:true}); }
    }
    const positionTargets = [
        {handle,target:rail,key:'wheelPosition',prefix:'--p5-wheel-',padding:32},
        {handle:wheelButton,target:()=>wheelButton,key:'launcherPosition',prefix:'--p5-launcher-',padding:12},
    ];
    const boxFor = item => {const el=item.target();return bounds({width:innerWidth,height:innerHeight},{width:el?.offsetWidth||0,height:el?.offsetHeight||0},item.padding);};
    function updatePositions() {
        for (const item of positionTargets) {
            if (!themeActive || !desktop.matches || !settings[item.key]) {removeVariable(item.prefix+'left');removeVariable(item.prefix+'top');continue;}
            const p=place(settings[item.key],boxFor(item));setVariable(item.prefix+'left',p.x+'px');setVariable(item.prefix+'top',p.y+'px');
        }
    }
    for (const item of positionTargets) {
        let drag=null, suppressClick=false;
        item.handle.addEventListener('pointerdown',event=>{
            if (!wheelEnabled || !draggable || !desktop.matches || event.button!==0) return;
            const p=item.target().getBoundingClientRect();
            drag={id:event.pointerId,x:event.clientX,y:event.clientY,left:p.left,top:p.top,moved:false,previous:settings[item.key]};
            item.handle.setPointerCapture(event.pointerId);
        },{signal});
        item.handle.addEventListener('pointermove',event=>{
            if (!drag || drag.id!==event.pointerId) return;
            const dx=event.clientX-drag.x,dy=event.clientY-drag.y;
            if (!drag.moved && Math.hypot(dx,dy)<5) return;
            drag.moved=true; event.preventDefault(); root.dataset.p5Dragging='true';
            settings[item.key]=normalise({x:drag.left+dx,y:drag.top+dy},boxFor(item));updatePositions();
        },{signal});
        const finish = event => {
            if (!drag || drag.id!==event.pointerId) return;
            const cancelled=event.type!=='pointerup';
            if (drag.moved) {
                if(cancelled){if(drag.previous)settings[item.key]=drag.previous;else delete settings[item.key];updatePositions();}
                else {save();suppressClick=true;setTimeout(()=>{suppressClick=false;},0);}
            }
            drag=null;delete root.dataset.p5Dragging;
        };
        for(const type of ['pointerup','pointercancel','lostpointercapture'])item.handle.addEventListener(type,finish,{signal});
        item.handle.addEventListener('click',event=>{if(suppressClick){event.preventDefault();event.stopImmediatePropagation();suppressClick=false;}},{signal,capture:true});
        item.handle.addEventListener('keydown',event=>{
            if(!wheelEnabled||!draggable||!desktop.matches||!['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','Home'].includes(event.key))return;
            event.preventDefault();event.stopPropagation();
            if(event.key==='Home')delete settings[item.key];
            else {const rect=item.target().getBoundingClientRect(),step=event.shiftKey?40:10;settings[item.key]=normalise({x:rect.left+(event.key==='ArrowRight'?step:event.key==='ArrowLeft'?-step:0),y:rect.top+(event.key==='ArrowDown'?step:event.key==='ArrowUp'?-step:0)},boxFor(item));}
            updatePositions();save();
        },{signal});
    }
    function syncPortraits() {
        for(const role of ['assistant','user']) {
            const value=portrait(settings.portraits?.[role]), prefix='--p5-companion-'+role+'-';
            if(themeActive && settings.portraits?.[role]) {
                setVariable(prefix+'position',value.x+'% '+value.y+'%');setVariable(prefix+'height-scale',String(value.height/100));
            } else {removeVariable(prefix+'position');removeVariable(prefix+'height-scale');}
            for(const input of panel.querySelectorAll(`[data-role="${role}"][data-setting]`)) {
                input.value=value[input.dataset.setting];input.nextElementSibling.value=input.value+'%';
            }
        }
    }
    panel.addEventListener('input',event=>{
        const input=event.target;if(!input.matches('[data-role][data-setting]'))return;
        if(!settings.portraits||typeof settings.portraits!=='object')settings.portraits={};
        const role=input.dataset.role;settings.portraits[role]={...portrait(settings.portraits[role]),[input.dataset.setting]:Number(input.value)};
        syncPortraits();save();
    },{signal});
    panel.addEventListener('click',event=>{
        const reset=event.target.closest('.p5-portrait-reset');
        if(reset){if(settings.portraits)delete settings.portraits[reset.dataset.role];syncPortraits();save();}
        if(event.target.closest('#p5-wheel-reset')){delete settings.wheelPosition;delete settings.launcherPosition;updatePositions();save();}
    },{signal});
    wheelButton.addEventListener('click',event=>{event.stopPropagation();setWheel(root.dataset.p5Wheel!=='open');},{signal});
    handle.addEventListener('click',event=>event.stopPropagation(),{signal});
    document.addEventListener('click',event=>{
        if(root.dataset.p5Wheel!=='open'||wheelButton.contains(event.target)||handle.contains(event.target))return;
        if(event.target.closest('#top-settings-holder > .drawer > .drawer-toggle')||!event.target.closest('#top-settings-holder'))setWheel(false);
    },{signal});
    document.addEventListener('keydown',event=>{if(event.key==='Escape'&&root.dataset.p5Wheel==='open'){event.preventDefault();setWheel(false,true);}},{signal});
    desktop.addEventListener('change',()=>{if(wheelEnabled)setWheel(false);updatePositions();},{signal});
    window.addEventListener('resize',updatePositions,{signal});
    function clearCommands(){for(const art of commandArt.values())art.remove();commandArt.clear();}
    function decorateCommands(active){
        if(!active){clearCommands();return;}
        for(const [id,word,subtitle] of COMMANDS){
            const icon=document.querySelector('#'+id+' > .drawer-toggle .drawer-icon');
            if(!icon||commandArt.get(id)?.parentElement===icon)continue;
            commandArt.get(id)?.remove();
            const art=document.createElement('span');art.className='p5-command-art';art.setAttribute('aria-hidden','true');
            const badge=document.createElement('span');badge.className='p5-command-badge';
            const lettering=document.createElement('span');lettering.className='p5-command-lettering';
            const title=document.createElement('span');title.className='p5-command-word';
            for(const letter of word){const glyph=document.createElement('b');glyph.className='p5-command-letter';glyph.textContent=letter;title.append(glyph);}
            const hint=document.createElement('span');hint.className='p5-command-subtitle';hint.textContent=subtitle;
            lettering.append(title,hint);art.append(badge,lettering);icon.append(art);commandArt.set(id,art);
        }
    }
    function refresh(){
        if(disposed)return;queued=false;
        const style=getComputedStyle(root);themeActive=style.getPropertyValue('--p5-theme-active').trim()==='1';
        button.hidden=!themeActive;panel.hidden=!themeActive;
        wheelEnabled=themeActive&&style.getPropertyValue('--p5-wheel-enabled').trim()==='1';
        wheelButton.hidden=!wheelEnabled;
        draggable=style.getPropertyValue('--p5-wheel-draggable').trim()==='1';
        if(wheelEnabled){
            if(!wheelButton.isConnected)document.body.append(wheelButton);
            if(draggable&&rail()&&handle.parentElement!==rail())rail().append(handle);
            if(!draggable)handle.remove();
            if(!root.hasAttribute('data-p5-wheel'))setWheel(false);
        } else {root.removeAttribute('data-p5-wheel');wheelButton.remove();handle.remove();}
        decorateCommands(wheelEnabled);syncPortraits();updatePositions();
        if(!themeActive){root.removeAttribute('data-p5-mode');root.removeAttribute('data-p5-host');return;}
        if(window.__TAURITAVERN__)root.dataset.p5Host='tt';
        const chosen=mode();currentNight=chosen==='night'||(chosen==='system'&&media.matches)||(chosen==='theme'&&style.getPropertyValue('--p5-night-default').trim()==='1');
        root.dataset.p5Mode=currentNight?'night':'classic';
        const label=currentNight?'Switch to Classic':'Switch to Night';button.setAttribute('aria-label',label);button.title=label;button.setAttribute('aria-pressed',String(currentNight));
        button.innerHTML=(currentNight?sun:moon)+`<span class="p5-mode-label">${currentNight?'NIGHT':'CLASSIC'}</span>`;select.value=chosen;
        if(rail()&&button.parentElement!==rail())rail().append(button);
        const extensions=document.getElementById('extensions_settings2')||document.getElementById('extensions_settings');
        if(extensions&&panel.parentElement!==extensions)extensions.prepend(panel);
    }
    function schedule(){if(!queued&&!disposed){queued=true;requestAnimationFrame(refresh);}}
    button.addEventListener('click',()=>{settings.mode=currentNight?'classic':'night';save();refresh();},{signal});
    select.addEventListener('change',()=>{settings.mode=select.value;save();refresh();},{signal});
    media.addEventListener('change',schedule,{signal});
    const observer=new MutationObserver(records=>{if(records.some(record=>record.target.nodeName==='STYLE'||record.target.parentElement?.nodeName==='STYLE'||[...record.addedNodes,...record.removedNodes].some(node=>node.nodeName==='STYLE'||node.nodeName==='LINK')))schedule();});
    observer.observe(document.head,{childList:true,subtree:true,characterData:true});
    const nativeStyle=document.getElementById('custom-style');if(nativeStyle&&!document.head.contains(nativeStyle))observer.observe(nativeStyle,{childList:true,subtree:true,characterData:true});
    context.eventSource?.on(context.event_types.APP_READY,refresh);
    window.addEventListener('pageshow',schedule,{signal});
    window.__p5PhantomDispose=()=>{
        disposed=true;controller.abort();observer.disconnect();context.eventSource?.removeListener(context.event_types.APP_READY,refresh);
        clearCommands();wheelButton.remove();handle.remove();button.remove();panel.remove();
        for(const name of ownedVariables)root.style.removeProperty(name);
        for(const name of ['data-p5-wheel','data-p5-mode','data-p5-host','data-p5-dragging'])root.removeAttribute(name);
        delete window.__p5PhantomDispose;
    };
    refresh();
}
export function disable(){window.__p5PhantomDispose?.();}
await (window.__TAURITAVERN__?.ready??window.__TAURITAVERN_MAIN_READY__);
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',initialise,{once:true});else initialise();
