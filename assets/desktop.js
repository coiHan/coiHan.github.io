const APP_LIST = [
  {id:'about', label:'关于我', name:'个人档案', icon:'document'},
  {id:'projects', label:'一些项目', name:'项目文件夹', icon:'folder'},
  {id:'photos', label:'生活相册', name:'生活相册', icon:'photos'},
  {id:'notebook', label:'随手记', name:'随手记', icon:'notebook'},
  {id:'contact', label:'取得联系', name:'地址簿', icon:'mail'},
];

const PHOTOS = [
  {src:'./assets/photos/city-view.webp', thumb:'./assets/photos/city-view-thumb.webp', width:1400, height:1050, thumbWidth:480, thumbHeight:360, title:'城市一角', alt:'从高处望向城市的生活照片'},
  {src:'./assets/photos/green-path.webp', thumb:'./assets/photos/green-path-thumb.webp', width:1200, height:900, thumbWidth:480, thumbHeight:360, title:'沿着绿意', alt:'绿意环绕的小路'},
  {src:'./assets/photos/night-walk.webp', thumb:'./assets/photos/night-walk-thumb.webp', width:1400, height:1049, thumbWidth:480, thumbHeight:360, title:'夜色里', alt:'夜间散步时的街景'},
  {src:'./assets/photos/night-market-redacted.webp', thumb:'./assets/photos/night-market-redacted-thumb.webp', width:1080, height:1440, thumbWidth:360, thumbHeight:480, title:'灯火人间', alt:'热闹的夜间街景'},
  {src:'./assets/photos/music-moment.webp', thumb:'./assets/photos/music-moment-thumb.webp', width:635, height:671, thumbWidth:454, thumbHeight:480, title:'一首老歌', alt:'屏幕上的音乐画面'},
  {src:'./assets/photos/museum-statue.webp', thumb:'./assets/photos/museum-statue-thumb.webp', width:1080, height:1440, thumbWidth:360, thumbHeight:480, title:'博物馆里', alt:'展厅中的人物雕像'},
  {src:'./assets/photos/late-night-table.webp', thumb:'./assets/photos/late-night-table-thumb.webp', width:1440, height:1080, thumbWidth:480, thumbHeight:360, title:'宵夜时分', alt:'餐桌上的烧烤与小菜'},
  {src:'./assets/photos/museum-objects.webp', thumb:'./assets/photos/museum-objects-thumb.webp', width:1440, height:1080, thumbWidth:480, thumbHeight:360, title:'展柜一角', alt:'展柜中的马和牛造型文物'},
];

function icon(type, size=32) {
  const common = `width="${size}" height="${size}" style="--os-icon-size:${size}px" viewBox="0 0 32 32" fill="none" aria-hidden="true" focusable="false" class="os-icon"`;
  const shapes = {
    document:'<path d="M7 2h14l5 5v23H7z" fill="#f8f4e8" stroke="#353a35" stroke-width="1.5"/><path d="M20 2v7h6" stroke="#353a35" stroke-width="1.5"/><path d="M11 13h11m-11 4h11m-11 4h8m-8 4h10" stroke="#74827a" stroke-width="1.5"/><path d="M9 4h9" stroke="white"/>',
    folder:'<path d="M3 8h10l3 3h13v17H3z" fill="#c2a86b" stroke="#3e4238" stroke-width="1.5"/><path d="M3 12h26l-3 16H2z" fill="#ead19a" stroke="#3e4238" stroke-width="1.5"/><path d="M5 14h21" stroke="#fff5d2" stroke-width="1.5"/>',
    photos:'<path d="M5 3l23 3-3 23-23-3z" fill="#c6d1c7" stroke="#3d4840" stroke-width="1.5"/><path d="M6 7h24v23H6z" fill="#f8f4e8" stroke="#3d4840" stroke-width="1.5"/><path d="M9 10h18v13H9z" fill="#a9c4c2"/><path d="M9 23l6-7 4 4 3-3 5 6" fill="#63836f"/><circle cx="23" cy="13" r="2" fill="#fbecbb"/>',
    notebook:'<path d="M6 3h23v27H6z" fill="#d8d2b9" stroke="#41463d" stroke-width="1.5"/><path d="M8 3v27" stroke="#eae5d7" stroke-width="2"/><path d="M12 10h13m-13 5h13m-13 5h10" stroke="#7f8d78" stroke-width="1.5"/><path d="M3 7h6M3 12h6M3 17h6M3 22h6M3 27h6" stroke="#434b41" stroke-width="1.5"/>',
    mail:'<path d="M3 8h27v20H3z" fill="#e6e0cd" stroke="#3d443e" stroke-width="1.5"/><path d="M3 8l13 11L30 8M3 28l10-11m17 11L20 17" stroke="#788679" stroke-width="1.5"/><path d="M5 10l11 9L28 10" stroke="#fff9e9"/>',
    computer:'<path d="M3 3h26v20H3z" fill="#c8c7ba" stroke="#303b34" stroke-width="1.5"/><path d="M6 6h20v13H6z" fill="#3c5e51"/><path d="M12 23h8v4h7v3H5v-3h7z" fill="#dfdccb" stroke="#303b34" stroke-width="1.5"/><path d="M9 10l3 3-3 3m6 0h7" stroke="#dbe8cb" stroke-width="1.5"/>',
    power:'<path d="M15 3v13M8 8a11 11 0 1 0 16 0" stroke="currentColor" stroke-width="3" stroke-linecap="square"/>',
  };
  return `<svg ${common}>${shapes[type] || shapes.document}</svg>`;
}

const appTitle = id => APP_LIST.find(app => app.id === id)?.name || '个人桌面';
const appIcon = id => APP_LIST.find(app => app.id === id)?.icon || 'document';

function aboutContent() {
  return `<div class="os-profile">
    <div class="os-page-kicker"><span>README.TXT</span><span>很高兴你来这里。</span></div>
    <div class="os-profile-heading"><div><p class="os-small-label">HELLO, WORLD.</p><h1>韩广路<span>Jack / coiHan</span></h1></div><div class="os-profile-avatar"><img src="./assets/profile/avatar-chair.webp" alt="个人头像" width="400" height="399" decoding="async"></div></div>
    <section class="os-profile-section" aria-labelledby="os-profile-summary-title">
      <div class="os-profile-section-heading"><span>01</span><h2 id="os-profile-summary-title">个人简介</h2></div>
      <p class="os-profile-intro">一点好奇，也想把想法做出来。</p>
      <p class="os-profile-copy">我目前在山东大学读人工智能研一，研究兴趣是具身智能。欢迎来我的小小工作台坐坐。</p>
    </section>
    <section class="os-profile-section" aria-labelledby="os-profile-education-title">
      <div class="os-profile-section-heading"><span>02</span><h2 id="os-profile-education-title">教育经历</h2></div>
      <ol class="os-education-list">
        <li><span class="os-education-years">2022 — 2026</span><div class="os-education-detail"><div class="os-education-school"><h3>青岛大学</h3></div><p>软件工程</p></div></li>
        <li><span class="os-education-years">2026 — 2029</span><div class="os-education-detail"><div class="os-education-school"><h3>山东大学</h3><span class="os-education-status">在读</span></div><p>人工智能</p></div></li>
      </ol>
    </section>
    <section class="os-profile-section" aria-labelledby="os-profile-interests-title">
      <div class="os-profile-section-heading"><span>03</span><h2 id="os-profile-interests-title">兴趣爱好</h2></div>
      <div class="os-interest-grid">
        <article class="os-interest-card"><h3>技术</h3><p>关注 AI 等新技术，喜欢了解，也喜欢动手尝试。</p></article>
        <article class="os-interest-card"><h3>音乐</h3><p>喜欢听中文 R&amp;B，常听陶喆、王力宏、周杰伦、方大同等。</p></article>
        <article class="os-interest-card"><h3>影像</h3><p>喜欢看一些纪录片、电影、动漫、美剧等。</p></article>
        <article class="os-interest-card"><h3>游戏</h3><p>平时玩 Steam 游戏，手机上玩金铲铲之战、王者荣耀。</p></article>
        <article class="os-interest-card"><h3>日常</h3><p>喜欢吃、逛、玩，随处走走，探索生活里的新鲜事。</p></article>
        <article class="os-interest-card"><h3>创作</h3><p>尝试把小想法做成网页和互动作品，边做边完善。</p></article>
      </div>
    </section>
    <div class="os-profile-footer"><p>把问题想清楚，也把想法做出来。</p><button type="button" class="os-link-button" data-open="projects">看看我的项目 <span aria-hidden="true">↗</span></button></div>
  </div>`;
}

function projectsContent() {
  return `<div class="os-projects-page"><div class="os-page-kicker"><span>C:\\JACK\\PROJECTS</span><span>把好奇变成可以体验的东西。</span></div>
    <div class="os-project-feature"><div class="os-project-art" aria-hidden="true"><div class="os-orbit os-orbit-one"></div><div class="os-orbit os-orbit-two"></div><div class="os-orbit os-orbit-three"></div><span class="os-art-center">p.</span><span class="os-art-caption">a small inquiry into yourself</span></div>
      <div class="os-project-description"><p class="os-small-label">INTERACTIVE EXPLORATION</p><h1>philome<span>探索你的思想偏好</span></h1><p>从简短描述出发，看看自己的思考更常走向哪里。</p><p>一次关于观念与自我的互动探索，也是一份保持好奇的邀请。</p><a class="os-raised-button os-primary-button" href="/philome/" target="_blank" rel="noopener noreferrer">启动 philome <span aria-hidden="true">↗</span><span class="os-sr-only">（在新标签页打开）</span></a><small class="os-project-note">用于自我探索与交流。</small></div></div>
    <div class="os-project-tail"><span class="os-pixel-dot" aria-hidden="true"></span><p>这里会慢慢放下更多做出来的想法。</p><a href="https://github.com/coiHan" target="_blank" rel="noopener noreferrer">在 GitHub 上找到我 ↗</a></div>
  </div>`;
}

function photosContent() {
  return `<div class="os-photos-page"><div class="os-page-kicker"><span>PHOTO ALBUM</span><span>走走，看看。</span></div><h1>生活的几帧</h1><p class="os-section-description">留下一些路过时看见的画面。</p><div class="os-photo-grid">${PHOTOS.map((photo,index)=>`<button type="button" class="os-photo-card" data-photo="${index}" aria-label="放大照片：${photo.title}"><span class="os-photo-image"><img src="${photo.thumb}" alt="${photo.alt}" width="${photo.thumbWidth}" height="${photo.thumbHeight}" loading="lazy" decoding="async"></span><span class="os-photo-caption"><strong>${photo.title}</strong><span>${String(index+1).padStart(2,'0')}</span></span></button>`).join('')}</div><p class="os-photo-hint">点击照片放大浏览。</p></div>`;
}

function contactContent() {
  return `<div class="os-contact-page"><div class="os-page-kicker"><span>ADDRESS BOOK</span><span>保持联系。</span></div><div class="os-contact-heading">${icon('mail',52)}<h1>打个招呼吧。</h1></div><p class="os-section-description">关于项目、研究，或一个有意思的想法。</p><div class="os-contact-record"><span class="os-small-label">EMAIL</span><a class="os-email-address" href="mailto:guangluhan686@gmail.com">guangluhan686@gmail.com</a><div class="os-contact-actions"><button class="os-raised-button" type="button" data-copy-email>复制邮箱</button><a class="os-raised-button" href="mailto:guangluhan686@gmail.com">写一封邮件 ↗</a></div><p class="os-copy-status" role="status" aria-live="polite"></p></div><div class="os-contact-record os-github-record"><span class="os-small-label">GITHUB</span><a href="https://github.com/coiHan" target="_blank" rel="noopener noreferrer">github.com/coiHan <span aria-hidden="true">↗</span></a></div><p class="os-contact-signoff">See you around,<br><span>Jack</span></p></div>`;
}

function notebookContent() {
  return `<div class="os-notebook-page"><div class="os-page-kicker"><span>UNTITLED.TXT</span><span>一页随手记</span></div><div class="os-notebook-sheet"><p class="os-notebook-meta">随手写下 · 慢慢探索</p><h1>把问题想清楚，<br>也把想法做出来。</h1><div class="os-notebook-rule"></div><p>正在关注</p><ul><li>人工智能如何感知、行动，并走向真实世界。</li><li>如何用交互，把一个想法变成可以体验的东西。</li><li>我们如何理解自己，又如何理解彼此。</li></ul><p class="os-notebook-end">保持好奇。<span aria-hidden="true">_</span></p></div></div>`;
}

const APP_CONTENT = {about:aboutContent, projects:projectsContent, photos:photosContent, contact:contactContent, notebook:notebookContent};

export function mountDesktop(root, {onExit=()=>{}, onSound=()=>{}} = {}) {
  if (!(root instanceof HTMLElement)) throw new TypeError('A desktop container is required.');
  const abort = new AbortController();
  const windows = new Map();
  let topZ = 10;
  let activeId = null;
  let photoIndex = 0;
  let photoReturn = null;
  let menuOpen = false;
  let openCount = 0;
  let resizeFrame = 0;

  root.classList.add('os-desktop');
  root.setAttribute('aria-label','coiHan 的个人电脑桌面');
  root.innerHTML = `<div class="os-wallpaper" aria-hidden="true"><div class="os-wallpaper-program"><div class="os-wallpaper-filename">hello.c</div><pre class="os-wallpaper-code"><code><span class="os-code-directive">#include &lt;stdio.h&gt;</span>

<span class="os-code-keyword">int</span> <span class="os-code-function">main</span>(<span class="os-code-keyword">void</span>) {
    <span class="os-code-function">printf</span>(<span class="os-code-string">"Hello, world!\\n"</span>);
    <span class="os-code-keyword">return</span> <span class="os-code-number">0</span>;
}</code></pre></div></div>
    <nav class="os-desktop-icons" aria-label="桌面应用">${APP_LIST.map(app=>`<button type="button" class="os-desktop-icon" data-open="${app.id}" aria-label="打开${app.name}">${icon(app.icon,38)}<span>${app.label}</span></button>`).join('')}</nav>
    <div class="os-windows" aria-label="应用窗口"></div>
    <div class="os-start-menu" hidden><div class="os-start-brand" aria-hidden="true">coiHan <span>OS</span></div><nav aria-label="开始菜单">${APP_LIST.map(app=>`<button type="button" data-open="${app.id}" class="os-menu-item">${icon(app.icon,25)}<span>${app.label}</span><span class="os-menu-arrow" aria-hidden="true">›</span></button>`).join('')}<div class="os-menu-separator"></div><button type="button" class="os-menu-item" data-exit>${icon('power',23)}<span>回到工作台</span></button></nav></div>
    <footer class="os-taskbar"><button class="os-start-button os-raised-button" type="button" aria-expanded="false" aria-label="打开开始菜单">${icon('computer',22)}<span>开始</span></button><div class="os-task-divider" aria-hidden="true"></div><div class="os-tasks" aria-label="已打开的窗口"></div><button type="button" class="os-room-button" data-exit title="回到工作台" aria-label="回到工作台">${icon('power',17)}<span>工作台</span></button><div class="os-clock" aria-label="北京时间"><time></time></div></footer>
    <div class="os-lightbox" role="dialog" aria-label="照片查看器" aria-modal="true" hidden><div class="os-lightbox-toolbar"><span class="os-lightbox-counter"></span><button type="button" class="os-lightbox-close" aria-label="关闭照片查看器">关闭 <span aria-hidden="true">×</span></button></div><div class="os-lightbox-stage"><button type="button" class="os-lightbox-prev" aria-label="上一张照片">←</button><figure><img alt=""><figcaption></figcaption></figure><button type="button" class="os-lightbox-next" aria-label="下一张照片">→</button></div></div>`;

  const layer = root.querySelector('.os-windows');
  const taskList = root.querySelector('.os-tasks');
  const start = root.querySelector('.os-start-button');
  const menu = root.querySelector('.os-start-menu');
  const lightbox = root.querySelector('.os-lightbox');
  const taskbar = root.querySelector('.os-taskbar');
  let measuredTaskbarHeight = 0;

  function emit(type) { if (typeof onSound==='function') onSound(type); }
  function dimensions() {
    const w=root.clientWidth || window.innerWidth;
    const fullHeight=root.clientHeight || window.innerHeight;
    const taskbarHeight=parseFloat(getComputedStyle(taskbar).height) || taskbar.offsetHeight || (w<680?51:48);
    if(taskbarHeight!==measuredTaskbarHeight){
      measuredTaskbarHeight=taskbarHeight;
      root.style.setProperty('--os-taskbar-height',`${taskbarHeight}px`);
    }
    return {w,h:Math.max(0,fullHeight-taskbarHeight),fullHeight,taskbarHeight};
  }
  function clamp(value,min,max) { return Math.max(min,Math.min(Math.max(min,max),value)); }
  function windowSize(win) {
    const rect=win.el.getBoundingClientRect(),rootRect=root.getBoundingClientRect();
    const sx=rootRect.width/(root.clientWidth||rootRect.width)||1;
    const sy=rootRect.height/(root.clientHeight||rootRect.height)||1;
    return {w:Math.ceil(rect.width/sx),h:Math.ceil(rect.height/sy)};
  }
  function fitWindow(win,{initial=false}={}) {
    const {w,h,fullHeight}=dimensions();
    const mobile=w<680;
    const margin=mobile?10:12;
    const availableHeight=Math.max(0,h-margin*2);
    win.el.style.minHeight=`${Math.min(mobile?200:300,availableHeight)}px`;
    if(win.maximized&&!mobile){
      win.el.style.maxHeight='none';
      return;
    }
    win.el.style.maxHeight=`${availableHeight}px`;
    if(mobile)return;
    const width=Math.min(win.id==='photos'?900:850,Math.max(0,w-40));
    win.el.style.width=`${width}px`;
    const cascade=win.order%3;
    const oldLeft=parseFloat(win.el.style.left),oldTop=parseFloat(win.el.style.top);
    const left=initial?(w-width)/2+48+cascade*24:Number.isFinite(oldLeft)?oldLeft:margin;
    const top=initial?Math.round(fullHeight*.095)+cascade*24:Number.isFinite(oldTop)?oldTop:margin;
    const positionMargin=initial?margin:0;
    const size=windowSize(win);
    win.el.style.left=`${clamp(left,positionMargin,w-size.w-positionMargin)}px`;
    win.el.style.top=`${clamp(top,positionMargin,h-size.h-positionMargin)}px`;
  }
  function setMenu(value, focus=false) {
    menuOpen = value;
    menu.hidden = !value;
    start.setAttribute('aria-expanded',String(value));
    start.setAttribute('aria-label',value?'关闭开始菜单':'打开开始菜单');
    if (value && focus) menu.querySelector('button').focus();
  }
  function updateActive() {
    for (const [id,win] of windows) {
      const active = id===activeId && !win.minimized;
      win.el.classList.toggle('os-active',active);
      win.task.classList.toggle('os-task-active',active);
      win.task.setAttribute('aria-pressed',String(active));
      win.task.setAttribute('aria-label',`${win.minimized?'恢复':'切换到'}${appTitle(id)}`);
    }
  }
  function activate(id, focus=true) {
    const win=windows.get(id); if(!win) return;
    activeId=id;win.minimized=false;win.el.hidden=false;win.el.style.zIndex=String(++topZ);
    fitWindow(win);
    updateActive();
    if(focus) win.el.focus({preventScroll:true});
  }
  function highestWindow() { return [...windows.values()].filter(win=>!win.minimized).sort((a,b)=>Number(b.el.style.zIndex)-Number(a.el.style.zIndex))[0]; }
  function minimize(id) {
    const win=windows.get(id); if(!win) return;
    win.minimized=true;win.el.hidden=true;
    const next=highestWindow();activeId=next?.id || null;
    updateActive();win.task.focus();emit('minimize');
  }
  function maximize(id) {
    const win=windows.get(id);if(!win) return;
    win.maximized=!win.maximized;win.el.classList.toggle('os-maximized',win.maximized);
    const button=win.el.querySelector('[data-window-action="maximize"]');
    button.setAttribute('aria-label',win.maximized?'还原窗口':'最大化窗口');
    button.title=win.maximized?'还原':'最大化';button.classList.toggle('os-restore-control',win.maximized);
    fitWindow(win);
    activate(id,false);emit('maximize');
  }
  function closeWindow(id) {
    const win=windows.get(id);if(!win) return;
    sizeObserver.unobserve(win.el);
    win.el.remove();win.task.remove();windows.delete(id);emit('close');
    const next=highestWindow();activeId=next?.id || null;updateActive();
    if(next) next.el.focus({preventScroll:true});else root.querySelector(`[data-open="${id}"]`)?.focus();
  }
  function openApp(id='about', silent=false) {
    dismissOverlays();
    if(id==='desktop') { focus();return; }
    if(id==='philome') id='projects';
    if(!APP_CONTENT[id]) id='about';
    if(windows.has(id)) { activate(id);if(!silent) emit('open');return; }
    const el=document.createElement('section');
    el.className=`os-window os-window-${id}`;el.dataset.app=id;el.tabIndex=-1;
    el.setAttribute('role','region');el.setAttribute('aria-labelledby',`os-title-${id}`);
    el.innerHTML=`<header class="os-titlebar"><span class="os-titlebar-label">${icon(appIcon(id),17)}<span id="os-title-${id}">${appTitle(id)}</span></span><div class="os-window-controls"><button type="button" data-window-action="minimize" aria-label="最小化窗口" title="最小化"><span class="os-control-min" aria-hidden="true"></span></button><button type="button" data-window-action="maximize" aria-label="最大化窗口" title="最大化"><span class="os-control-max" aria-hidden="true"></span></button><button type="button" data-window-action="close" aria-label="关闭${appTitle(id)}" title="关闭"><span class="os-control-close" aria-hidden="true">×</span></button></div></header><div class="os-window-toolbar"><span>${id==='notebook'?'记事本':'个人电脑'}</span><span class="os-toolbar-path">${id==='about'?'C:\\JACK\\README.TXT':id==='photos'?'C:\\JACK\\PHOTOS':`C:\\JACK\\${id.toUpperCase()}`}</span><button type="button" data-window-action="menu" class="os-toolbar-home" aria-label="打开应用菜单" title="应用菜单">⋮</button></div><div class="os-window-body">${APP_CONTENT[id]()}</div><div class="os-window-status"><span>${id==='photos'?`${PHOTOS.length} 张照片`:id==='projects'?'1 个正在探索的项目':'coiHan · personal computer'}</span><span class="os-status-right">${id==='notebook'?'保持好奇。':'就绪'}</span><span class="os-resize-grip" aria-hidden="true"></span></div>`;
    const task=document.createElement('button');task.type='button';task.className='os-task-button';task.dataset.task=id;
    task.innerHTML=`${icon(appIcon(id),18)}<span>${appTitle(id)}</span>`;
    layer.append(el);taskList.append(task);
    const win={id,el,task,minimized:false,maximized:false,order:openCount};windows.set(id,win);openCount++;
    fitWindow(win,{initial:true});sizeObserver.observe(el);
    installDrag(win);activate(id,!silent);if(!silent) emit('open');
  }

  function installDrag(win) {
    const bar=win.el.querySelector('.os-titlebar');
    bar.addEventListener('dblclick',event=>{if(!event.target.closest('button')&&dimensions().w>=680) maximize(win.id);},{signal:abort.signal});
    bar.addEventListener('pointerdown',event=>{
      if(event.button!==0||event.target.closest('button')||win.maximized||dimensions().w<680) return;
      const rect=win.el.getBoundingClientRect();const rootRect=root.getBoundingClientRect();
      const startX=event.clientX;const startY=event.clientY;
      const sx=rootRect.width/(root.clientWidth||rootRect.width)||1;
      const sy=rootRect.height/(root.clientHeight||rootRect.height)||1;
      const left=(rect.left-rootRect.left)/sx;const top=(rect.top-rootRect.top)/sy;
      activate(win.id,false);bar.setPointerCapture(event.pointerId);win.el.classList.add('os-dragging');event.preventDefault();
      const move=e=>{const {w,h}=dimensions(),size=windowSize(win);win.el.style.left=`${clamp(left+(e.clientX-startX)/sx,0,w-size.w)}px`;win.el.style.top=`${clamp(top+(e.clientY-startY)/sy,0,h-size.h)}px`;};
      const finish=()=>{win.el.classList.remove('os-dragging');bar.removeEventListener('pointermove',move);bar.removeEventListener('pointerup',finish);bar.removeEventListener('pointercancel',finish);};
      bar.addEventListener('pointermove',move);bar.addEventListener('pointerup',finish);bar.addEventListener('pointercancel',finish);
    },{signal:abort.signal});
    win.el.addEventListener('pointerdown',()=>{if(activeId!==win.id) activate(win.id,false);},{signal:abort.signal});
    win.el.addEventListener('focusin',()=>{if(activeId!==win.id) activate(win.id,false);},{signal:abort.signal});
  }

  function updatePhoto() {
    const photo=PHOTOS[photoIndex];const img=lightbox.querySelector('figure img');img.src=photo.src;img.alt=photo.alt;img.width=photo.width;img.height=photo.height;img.decoding='async';
    lightbox.querySelector('figcaption').textContent=photo.title;
    lightbox.querySelector('.os-lightbox-counter').textContent=`生活相册 · ${photoIndex+1} / ${PHOTOS.length}`;
  }
  function showPhoto(index,trigger) {
    photoIndex=Math.max(0,Math.min(PHOTOS.length-1,index));photoReturn=trigger;updatePhoto();lightbox.hidden=false;
    lightbox.querySelector('.os-lightbox-close').focus();emit('open');
  }
  function closePhoto({restoreFocus=true}={}) {
    if(lightbox.hidden)return;
    lightbox.hidden=true;
    const target=photoReturn;photoReturn=null;
    if(restoreFocus&&target?.isConnected)target.focus({preventScroll:true});
  }
  function dismissOverlays() {
    setMenu(false);
    if(!lightbox.hidden)closePhoto({restoreFocus:false});
  }
  function nextPhoto(delta) {photoIndex=(photoIndex+delta+PHOTOS.length)%PHOTOS.length;updatePhoto();}

  async function copyEmail(button) {
    const status=button.closest('.os-contact-record').querySelector('.os-copy-status');
    try {
      if(navigator.clipboard?.writeText) await navigator.clipboard.writeText('guangluhan686@gmail.com');
      else {
        const input=document.createElement('textarea');input.value='guangluhan686@gmail.com';input.style.position='fixed';input.style.opacity='0';root.append(input);input.select();
        const copied=document.execCommand('copy');input.remove();if(!copied) throw new Error('Copy unavailable');
      }
      status.textContent='已复制，可以去写邮件了。';button.textContent='已复制';
    } catch { status.textContent='暂时无法自动复制，可以选中上方邮箱，或直接点击“写一封邮件”。'; }
  }

  root.addEventListener('click',event=>{
    const target=event.target instanceof Element?event.target:null;if(!target) return;
    if(target.closest('.os-lightbox-close')) {closePhoto();return;}
    if(target.closest('.os-lightbox-prev')) {nextPhoto(-1);return;}
    if(target.closest('.os-lightbox-next')) {nextPhoto(1);return;}
    if(target===lightbox||target.classList.contains('os-lightbox-stage')) {closePhoto();return;}
    const photo=target.closest('[data-photo]');if(photo) {showPhoto(Number(photo.dataset.photo),photo);return;}
    const copy=target.closest('[data-copy-email]');if(copy) {copyEmail(copy);return;}
    if(target.closest('[data-exit]')) {dismissOverlays();onExit();return;}
    if(target.closest('.os-start-button')) {setMenu(!menuOpen);return;}
    const action=target.closest('[data-window-action]');
    if(action){const id=action.closest('.os-window').dataset.app;const name=action.dataset.windowAction;if(name==='close')closeWindow(id);else if(name==='minimize')minimize(id);else if(name==='maximize')maximize(id);else if(name==='menu')setMenu(!menuOpen,true);return;}
    const task=target.closest('[data-task]');if(task){const win=windows.get(task.dataset.task);if(activeId===win.id&&!win.minimized)minimize(win.id);else activate(win.id);return;}
    const app=target.closest('[data-open]');if(app){openApp(app.dataset.open);return;}
    if(!target.closest('.os-start-menu'))setMenu(false);
  },{signal:abort.signal});

  root.addEventListener('keydown',event=>{
    if(root.hidden) return;
    if(!lightbox.hidden){
      if(event.key==='Escape'){event.preventDefault();event.stopPropagation();closePhoto();}
      else if(event.key==='ArrowLeft'){event.preventDefault();nextPhoto(-1);}
      else if(event.key==='ArrowRight'){event.preventDefault();nextPhoto(1);}
      else if(event.key==='Tab'){const items=[...lightbox.querySelectorAll('button')];const index=items.indexOf(document.activeElement);const next=(index+(event.shiftKey?-1:1)+items.length)%items.length;event.preventDefault();items[next].focus();}
      return;
    }
    if(event.key==='Escape'){
      event.preventDefault();event.stopPropagation();
      if(menuOpen){setMenu(false);start.focus();}
      else if(activeId)closeWindow(activeId);
      else onExit();return;
    }
    if(menuOpen && ['ArrowDown','ArrowUp','Home','End'].includes(event.key)){
      const buttons=[...menu.querySelectorAll('button')];let index=buttons.indexOf(document.activeElement);
      if(event.key==='Home')index=0;else if(event.key==='End')index=buttons.length-1;else index=(index+(event.key==='ArrowDown'?1:-1)+buttons.length)%buttons.length;
      event.preventDefault();buttons[index].focus();
    }
  },{signal:abort.signal});

  function clock() { root.querySelector('time').textContent=new Intl.DateTimeFormat('zh-CN',{timeZone:'Asia/Shanghai',hour:'2-digit',minute:'2-digit',hour12:false}).format(new Date()); }
  clock();const clockTimer=window.setInterval(clock,15000);
  function resize() {
    cancelAnimationFrame(resizeFrame);resizeFrame=requestAnimationFrame(()=>{
      dimensions();
      for(const win of windows.values())if(!win.minimized)fitWindow(win);
    });
  }
  const sizeObserver=new ResizeObserver(resize);sizeObserver.observe(root);sizeObserver.observe(taskbar);
  window.addEventListener('resize',resize,{signal:abort.signal});

  function focus() { const active=windows.get(activeId)||highestWindow();if(active)activate(active.id);else root.querySelector('.os-desktop-icon')?.focus(); }
  function closeAll() {dismissOverlays();for(const id of [...windows.keys()])closeWindow(id);}
  openApp('about',true);
  return {openApp,focus,closeAll,dismissOverlays,resize,destroy(){abort.abort();sizeObserver.disconnect();clearInterval(clockTimer);cancelAnimationFrame(resizeFrame);root.innerHTML='';}};
}
