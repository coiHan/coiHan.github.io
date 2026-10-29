(() => {
  'use strict';
  const stage=document.querySelector('#space-stage'),links=[...document.querySelectorAll('.planet-link')],navLinks=[...document.querySelectorAll('.category-nav a')];
  const visuals=links.map(a=>({a,label:a.querySelector('.planet-label'),w:0,h:0}));
  const destination=document.querySelector('#mobile-destination'),media=matchMedia('(max-width:1099px)'),fine=matchMedia('(hover:hover) and (pointer:fine)'),reduced=matchMedia('(prefers-reduced-motion:reduce)');
  const mechanics=window.SolarMechanics;
  const atlas='/assets/illustrations/solar-atlas-handdrawn.webp';
  const sprites={sun:[0,0,450,465],mercury:[455,65,370,380],venus:[855,65,390,385],earth:[25,460,405,405],mars:[445,465,390,395],jupiter:[830,465,415,405],saturn:[0,880,515,335],uranus:[505,870,330,370],neptune:[860,870,385,375]};
  const worlds=[
    {id:'about',title:'关于我的',description:'认识这个正在学习的人',href:'/worlds/about.html?v=20261029-orbits',sprite:'mercury',size:100,narrow:76,x:.25,y:.29},
    {id:'interests',title:'日常生活',description:'一些走过、看过、留下来的瞬间',href:'/worlds/interests.html?v=20261029-orbits',sprite:'venus',size:126,narrow:102,x:.32,y:.68},
    {id:'projects',title:'一些项目',description:'让一个想法，变成可以体验的东西',href:'/worlds/projects.html?v=20261029-orbits',sprite:'earth',size:148,narrow:120,x:.41,y:.32},
    {id:'contact',title:'取得联系',description:'邮件或GitHub，都可以找到我',href:'/worlds/contact.html?v=20261029-orbits',sprite:'mars',size:122,narrow:98,x:.49,y:.72},
    {id:'jupiter',title:'',description:'',href:'/#jupiter',sprite:'jupiter',size:162,narrow:132,x:.60,y:.27},
    {id:'saturn',title:'',description:'',href:'/#saturn',sprite:'saturn',size:224,narrow:178,x:.69,y:.67},
    {id:'uranus',title:'',description:'',href:'/#uranus',sprite:'uranus',size:140,narrow:106,x:.81,y:.31},
    {id:'neptune',title:'',description:'',href:'/#neptune',sprite:'neptune',size:136,narrow:104,x:.91,y:.71}  ];
  let orbitalGeometry=[],simulationSeconds=0,orbitalLast=0,orbitRendered=0,orbitViewport=null,displayPoints=[];
  let selected=0,paused=reduced.matches,flightTimer=null,suppressUntil=0,startTouch=null,hovered=-1,skyFrame=0;
  const debug=window.SolarSystem={ready:false,worlds,sprites,mechanics,get elapsed(){return simulationSeconds},get viewport(){return orbitViewport},get activeId(){return worlds[selected].id},get mode(){return media.matches?'mobile':'desktop'},get paused(){return paused},setActive:index=>setActive(index),getHovered:()=>hovered,get displayPoints(){return displayPoints},setElapsed:seconds=>{simulationSeconds=seconds;displayPoints=[];renderOrbits()}};
  for(const [name,[x,y,w,h]] of Object.entries(sprites)){
    document.querySelectorAll(`.sprite-${name}`).forEach(el=>{el.style.backgroundSize=`${1254/w*100}% ${1254/h*100}%`;el.style.backgroundPosition=`${x/(1254-w)*100}% ${y/(1254-h)*100}%`;});
  }
  function setActive(index){
    selected=(index+8)%8;
    links.forEach((a,i)=>{const offset=((i-selected+12)%8)-4;a.classList.toggle('is-current',i===selected);a.classList.toggle('is-adjacent',Math.abs(offset)===1);a.style.setProperty('--slide',offset);a.tabIndex=media.matches&&i!==selected?-1:0;});
    const w=worlds[selected];destination.href=w.href;destination.dataset.world=w.id;
    document.querySelector('#mobile-index').textContent=`${String(selected+1).padStart(2,'0')} / 08`;document.querySelector('#mobile-title').textContent=w.title||'···';document.querySelector('#mobile-description').textContent=w.description;
    navLinks.forEach(a=>a.classList.toggle('is-active',a.dataset.world===w.id));
  }
  function layout(){
    const {width,height}=stage.getBoundingClientRect(),narrow=width<1350;
    const q=.60,scale=Math.min((width-160)/2,(height-138)/(2*q)),cx=width*.5,cy=height*.5;
    orbitViewport={width,height,q,scale,cx,cy};displayPoints=[];
    const sizes=[60,72,82,70,110,154,88,84],factor=Math.max(.82,Math.min(1.18,scale/460));
    links.forEach((a,i)=>{const w=worlds[i],size=sizes[i]*factor,rect=sprites[w.sprite],mobileSize=w.sprite==='saturn'?Math.min(270,innerWidth*.71):Math.min(240,innerWidth*.61);a.style.setProperty('--size',`${size}px`);a.style.setProperty('--art-height',`${size*rect[3]/rect[2]}px`);a.style.setProperty('--mobile-size',`${mobileSize}px`);a.style.setProperty('--mobile-height',`${mobileSize*rect[3]/rect[2]}px`);a.style.setProperty('--float-delay',`${-i*.91}s`);visuals[i].w=size;visuals[i].h=size*rect[3]/rect[2];if(media.matches)a.style.transform='';});
    const svg=document.querySelector('#orbit-lines');svg.setAttribute('viewBox',`0 0 ${width} ${height}`);
    if(media.matches){svg.innerHTML=`<path d="M${-width*.12},${height*.88} Q${width*.55},${-height*.12} ${width*1.15},${height*.48}"/><path d="M${-width*.2},${height*.72} Q${width*.35},${-height*.14} ${width*1.1},${height*.18}"/>`;}
    else{svg.innerHTML=worlds.map((w,i)=>{const points=[];for(let j=0;j<=160;j++){const E=j/160*Math.PI*2,e=mechanics.eccentricity[i],a=mechanics.radii[i]*scale,p=mechanics.project({x:a*(Math.cos(E)-e),y:a*Math.sqrt(1-e*e)*Math.sin(E)},cx,cy,q);points.push(`${j?'L':'M'}${p.x.toFixed(2)},${p.y.toFixed(2)}`);}return `<path data-orbit="${i}" d="${points.join(' ')} Z"/>`;}).join('')+'<g id="position-hints">'+worlds.map((w,i)=>`<g data-hint="${i}" opacity="0"><line stroke="#c7c3dd" stroke-opacity=".35" stroke-width=".8"/><circle r="1.7" fill="#ded3eb"/></g>`).join('')+'</g>';}
    setActive(selected);drawStars();clearHover();renderOrbits();
  }
  function renderOrbits(){
    if(media.matches||!orbitViewport)return;
    const {width,height,scale,cx,cy,q}=orbitViewport;
    const physical=worlds.map((w,i)=>{const state=mechanics.position(i,simulationSeconds,scale),p=mechanics.project(state,cx,cy,q);return {...state,...p,planeX:state.x,planeY:state.y};});
    const settled=physical.map((p,i)=>{
      const old=displayPoints[i],previous=orbitalGeometry[i];
      return old&&previous?{x:old.x+p.x-previous.x+(previous.x-old.x)*.018,y:old.y+p.y-previous.y+(previous.y-old.y)*.018}:{x:p.x,y:p.y};
    });
    const half=visuals.map(v=>({x:v.w*.61+9,y:v.h*.61+9})),sunRadius=Math.max(74,Math.min(92,width*.0555));
    // Illustration callouts separate when their true orbital points project close.
    const fits=(p,i)=>p.x>=half[i].x+12&&p.x<=width-half[i].x-12&&p.y>=half[i].y+45&&p.y<=height-half[i].y-48&&(Math.abs(p.x-cx)>=half[i].x+sunRadius||Math.abs(p.y-cy)>=half[i].y+sunRadius);
    for(let pass=0;pass<28;pass++){
      settled.forEach((p,i)=>{
        const dx=p.x-cx,dy=p.y-cy,px=half[i].x+sunRadius-Math.abs(dx),py=half[i].y+sunRadius-Math.abs(dy);
        if(px>0&&py>0){if(px<py)p.x+=(dx>=0?1:-1)*(px+.15);else p.y+=(dy>=0?1:-1)*(py+.15);}
        p.x=Math.max(half[i].x+12,Math.min(width-half[i].x-12,p.x));p.y=Math.max(half[i].y+45,Math.min(height-half[i].y-48,p.y));
      });
      for(let i=0;i<8;i++)for(let j=i+1;j<8;j++){
        const a=settled[i],b=settled[j],dx=a.x-b.x,dy=a.y-b.y,px=half[i].x+half[j].x-Math.abs(dx),py=half[i].y+half[j].y-Math.abs(dy);
        if(px<=0||py<=0)continue;
        const sx=(dx>=0?1:-1)*(px+.15),sy=(dy>=0?1:-1)*(py+.15),candidates=[];
        for(const axis of ['x','y']){const d=axis==='x'?sx:sy;for(const weights of [[.5,.5],[1,0],[0,1]]){const aa={...a},bb={...b};aa[axis]+=d*weights[0];bb[axis]-=d*weights[1];if(fits(aa,i)&&fits(bb,j))candidates.push({aa,bb,cost:Math.abs(d)});}}
        candidates.sort((a,b)=>a.cost-b.cost);const best=candidates[0];if(best){Object.assign(a,best.aa);Object.assign(b,best.bb);}
      }
    }
    displayPoints=settled;orbitalGeometry=physical;
    visuals.forEach((v,i)=>{
      const p=settled[i],real=physical[i];v.a.style.transform=`translate3d(${p.x.toFixed(3)}px,${p.y.toFixed(3)}px,0) translate(-50%,-50%)`;
      v.a.style.zIndex=i===hovered?'30':p.y>cy?'4':'1';v.label.style.top=p.y<cy?'-36px':`${v.h+13}px`;
      const ly=p.y+(p.y<cy?-v.h/2-21:v.h/2+27),busy=settled.some((other,j)=>i!==j&&Math.abs(other.x-p.x)<85&&Math.abs(other.y-ly)<45);v.label.style.opacity=busy&&hovered!==i?'0':'1';
      const hint=document.querySelector(`[data-hint="${i}"]`);if(hint){const offset=Math.hypot(p.x-real.x,p.y-real.y);hint.setAttribute('opacity',offset>7?'.8':'0');const line=hint.firstElementChild,dot=hint.lastElementChild;line.setAttribute('x1',real.x);line.setAttribute('y1',real.y);line.setAttribute('x2',p.x);line.setAttribute('y2',p.y);dot.setAttribute('cx',real.x);dot.setAttribute('cy',real.y);}
    });
  }
  function drawStars(){
    const canvas=document.querySelector('#starfield'),ratio=Math.min(devicePixelRatio,1.5),width=innerWidth+16,height=innerHeight+16;canvas.width=width*ratio;canvas.height=height*ratio;const c=canvas.getContext('2d');if(!c)return;c.scale(ratio,ratio);let seed=9703;const rnd=()=>{seed=seed*16807%2147483647;return(seed-1)/2147483646;};
    for(let i=0;i<Math.min(290,width*.20);i++){const x=rnd()*width,y=rnd()*height,r=rnd(),alpha=.12+rnd()*.52;c.fillStyle=`rgba(${r>.85?'227,206,226':'190,211,239'},${alpha})`;c.beginPath();c.arc(x,y,.35+r*.65,0,Math.PI*2);c.fill();if(r>.965){c.strokeStyle='rgba(228,215,241,.25)';c.lineWidth=.6;c.beginPath();c.moveTo(x-4,y);c.lineTo(x+4,y);c.moveTo(x,y-4);c.lineTo(x,y+4);c.stroke();}}
  }
  function clearHover(){hovered=-1;links.forEach(a=>{a.classList.remove('is-hovered','is-neighbor');a.style.removeProperty('--dock');});if(orbitViewport)renderOrbits();}
  function magnify(index){
    if(!fine.matches||media.matches)return;hovered=index;
    links.forEach((a,i)=>{a.classList.toggle('is-hovered',i===index);a.classList.remove('is-neighbor');});
    const a=links[index],w=worlds[index],art=a.querySelector('.planet-art');
    const bounds=stage.getBoundingClientRect();let factor=1.22;
    const ownW=parseFloat(a.style.getPropertyValue('--size')),ownH=parseFloat(a.style.getPropertyValue('--art-height'));
    worlds.forEach((other,j)=>{if(index===j)return;const b=links[j],ow=parseFloat(b.style.getPropertyValue('--size')),oh=parseFloat(b.style.getPropertyValue('--art-height')),dx=Math.abs((displayPoints[index]?.x??w.x*bounds.width)-(displayPoints[j]?.x??other.x*bounds.width)),dy=Math.abs((displayPoints[index]?.y??w.y*bounds.height)-(displayPoints[j]?.y??other.y*bounds.height));if(dx<(ownW*factor+ow)/2+12&&dy<(ownH*factor+oh)/2+12){factor=Math.max(1,Math.min(factor,Math.max((2*(dx-12)-ow)/ownW,(2*(dy-12)-oh)/ownH)));}});
    a.style.setProperty('--dock',factor.toFixed(3));renderOrbits();
  }
  function prefetch(a){const href=new URL(a.href),key=href.pathname+href.search;if(href.origin!==location.origin||document.querySelector(`link[data-prefetch="${key}"]`))return;const link=document.createElement('link');link.rel='prefetch';link.href=key;link.dataset.prefetch=key;document.head.append(link);}

  function navigate(event){
    if(event.defaultPrevented||event.button>0||event.metaKey||event.ctrlKey||event.shiftKey||event.altKey)return;
    if(performance.now()<suppressUntil){event.preventDefault();return;}
    if(reduced.matches)return;
    if(flightTimer){event.preventDefault();return;}
    event.preventDefault();const a=event.currentTarget,w=worlds.find(w=>w.id===a.dataset.world);document.querySelector('#travel-name').textContent=w?.title||'';document.body.classList.add('is-travelling');flightTimer=setTimeout(()=>location.assign(a.href),220);
  }
  [...links,...navLinks,destination].forEach(a=>{a.addEventListener('click',navigate);a.addEventListener('pointerenter',()=>prefetch(a),{once:true});a.addEventListener('focus',()=>prefetch(a),{once:true});});
  links.forEach((a,i)=>{a.addEventListener('pointerenter',()=>magnify(i));a.addEventListener('pointerleave',clearHover);a.addEventListener('focus',()=>magnify(i));a.addEventListener('blur',clearHover);});
  function syncPause(){document.body.classList.toggle('is-paused',paused);document.querySelector('#orbit-pause').setAttribute('aria-pressed',String(paused));document.querySelector('#pause-copy').textContent=paused?'开启动效':'暂停动效';document.querySelector('.motion-icon').textContent=paused?'▷':'Ⅱ';if(paused){document.documentElement.style.setProperty('--sky-x','0px');document.documentElement.style.setProperty('--sky-y','0px');}}
  document.querySelector('#orbit-pause').addEventListener('click',()=>{paused=!paused;syncPause();});document.querySelector('#previous-world').addEventListener('click',()=>setActive(selected-1));document.querySelector('#next-world').addEventListener('click',()=>setActive(selected+1));
  stage.addEventListener('pointerdown',e=>{if(media.matches&&e.pointerType!=='mouse')startTouch={x:e.clientX,y:e.clientY};});stage.addEventListener('pointerup',e=>{if(!startTouch)return;const dx=e.clientX-startTouch.x,dy=e.clientY-startTouch.y;startTouch=null;if(Math.abs(dx)>45&&Math.abs(dx)>Math.abs(dy)*1.3){setActive(selected+(dx<0?1:-1));suppressUntil=performance.now()+400;}});stage.addEventListener('pointercancel',()=>startTouch=null);
  document.addEventListener('pointermove',e=>{if(paused||reduced.matches||!fine.matches||skyFrame)return;skyFrame=requestAnimationFrame(()=>{skyFrame=0;document.documentElement.style.setProperty('--sky-x',`${((e.clientX/innerWidth-.5)*5).toFixed(1)}px`);document.documentElement.style.setProperty('--sky-y',`${((e.clientY/innerHeight-.5)*4).toFixed(1)}px`);});},{passive:true});
  document.addEventListener('visibilitychange',()=>{orbitalLast=performance.now()});window.addEventListener('resize',layout);media.addEventListener('change',layout);reduced.addEventListener('change',()=>{paused=reduced.matches;syncPause();});window.addEventListener('pageshow',()=>{clearTimeout(flightTimer);flightTimer=null;document.body.classList.remove('is-travelling');clearHover();});

  function renderEmptyRoute(){
    const empty=['jupiter','saturn','uranus','neptune'].includes(location.hash.slice(1));
    const wasEmpty=document.body.classList.contains('is-empty-world');document.body.classList.toggle('is-empty-world',empty);document.querySelector('#empty-world').hidden=!empty;
    clearTimeout(flightTimer);flightTimer=null;document.body.classList.remove('is-travelling');if(wasEmpty&&!empty)layout();
  }
  function orbitFrame(time){
    requestAnimationFrame(orbitFrame);
    const delta=orbitalLast?Math.max(0,(time-orbitalLast)/1000):0;orbitalLast=time;
    if(paused||reduced.matches||media.matches||document.hidden||hovered>=0||document.body.classList.contains('is-empty-world')||flightTimer)return;
    simulationSeconds+=delta;
    renderOrbits();
  }
  window.addEventListener('hashchange',renderEmptyRoute);
  const image=new Image();image.onload=()=>{debug.artReady=true;document.documentElement.classList.add('is-art-ready');};image.onerror=()=>document.documentElement.classList.add('art-failed');image.src=atlas;
  layout();syncPause();renderEmptyRoute();debug.ready=true;requestAnimationFrame(orbitFrame);
})();
