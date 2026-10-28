(() => {
  'use strict';
  const stage=document.querySelector('#space-stage'),links=[...document.querySelectorAll('.planet-link')],navLinks=[...document.querySelectorAll('.category-nav a')];
  const destination=document.querySelector('#mobile-destination'),media=matchMedia('(max-width:899px)'),fine=matchMedia('(hover:hover) and (pointer:fine)'),reduced=matchMedia('(prefers-reduced-motion:reduce)');
  const atlas='/assets/illustrations/solar-atlas-handdrawn.webp';
  const sprites={sun:[0,0,450,465],mercury:[455,65,370,380],venus:[855,65,390,385],earth:[25,460,405,405],mars:[445,465,390,395],jupiter:[830,465,415,405],saturn:[0,880,515,335],uranus:[505,870,330,370],neptune:[860,870,385,375]};
  const worlds=[
    {id:'about',title:'关于我',description:'认识这个正在学习的人',href:'/worlds/about.html',sprite:'mercury',size:84,narrow:64,x:.25,y:.29},
    {id:'interests',title:'日常片段',description:'一些走过、看过、留下来的瞬间',href:'/worlds/interests.html',sprite:'venus',size:108,narrow:88,x:.32,y:.68},
    {id:'projects',title:'一些项目',description:'让一个想法，变成可以体验的东西',href:'/worlds/projects.html',sprite:'earth',size:126,narrow:104,x:.41,y:.32},
    {id:'contact',title:'取得联系',description:'邮件或GitHub，都可以找到我',href:'/worlds/contact.html',sprite:'mars',size:104,narrow:82,x:.49,y:.72},
    {id:'jupiter',title:'',description:'',href:'/#jupiter',sprite:'jupiter',size:162,narrow:132,x:.60,y:.27},
    {id:'saturn',title:'',description:'',href:'/#saturn',sprite:'saturn',size:224,narrow:178,x:.69,y:.67},
    {id:'uranus',title:'',description:'',href:'/#uranus',sprite:'uranus',size:140,narrow:106,x:.81,y:.31},
    {id:'neptune',title:'',description:'',href:'/#neptune',sprite:'neptune',size:136,narrow:104,x:.91,y:.71}  ];
  let orbitalGeometry=[],orbitalLast=0,orbitRendered=0;
  let selected=0,paused=reduced.matches,flightTimer=null,suppressUntil=0,startTouch=null,hovered=-1,skyFrame=0;
  const debug=window.SolarSystem={ready:false,worlds,sprites,get activeId(){return worlds[selected].id},get mode(){return media.matches?'mobile':'desktop'},get paused(){return paused},setActive:index=>setActive(index),getHovered:()=>hovered};
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
    const {width,height}=stage.getBoundingClientRect(),narrow=width<1180;
    links.forEach((a,i)=>{const w=worlds[i],size=narrow?w.narrow:w.size,rect=sprites[w.sprite],mobileSize=w.sprite==='saturn'?Math.min(270,innerWidth*.71):Math.min(240,innerWidth*.61);a.style.setProperty('--x',`${w.x*100}%`);a.style.setProperty('--y',`${w.y*100}%`);a.style.setProperty('--size',`${size}px`);a.style.setProperty('--art-height',`${size*rect[3]/rect[2]}px`);a.style.setProperty('--mobile-size',`${mobileSize}px`);a.style.setProperty('--mobile-height',`${mobileSize*rect[3]/rect[2]}px`);a.style.setProperty('--float-delay',`${-i*.91}s`);});
    const svg=document.querySelector('#orbit-lines');svg.setAttribute('viewBox',`0 0 ${width} ${height}`);
    if(media.matches){svg.innerHTML=`<path d="M${-width*.12},${height*.88} Q${width*.55},${-height*.12} ${width*1.15},${height*.48}"/><path d="M${-width*.2},${height*.72} Q${width*.35},${-height*.14} ${width*1.1},${height*.18}"/>`;}
    else{const cx=width*.095,cy=height*.48,q=.45;svg.innerHTML=worlds.map(w=>{const x=w.x*width,y=w.y*height,r=Math.hypot(x-cx,(y-cy)/q),a=Math.atan2((y-cy)/q,x-cx);const points=[];for(let j=0;j<=24;j++){const t=a-.12+j/24*.24;points.push(`${j?'L':'M'}${(cx+r*Math.cos(t)).toFixed(1)},${(cy+r*q*Math.sin(t)).toFixed(1)}`);}return `<path d="${points.join(' ')}"/>`;}).join('');}
    const cx=width*.095,cy=height*.48,q=.45;orbitalGeometry=worlds.map(w=>({radius:Math.hypot(w.x*width-cx,(w.y*height-cy)/q),angle:Math.atan2((w.y*height-cy)/q,w.x*width-cx),offset:0,x:w.x*width,y:w.y*height}));
    setActive(selected);drawStars();clearHover();
  }
  function drawStars(){
    const canvas=document.querySelector('#starfield'),ratio=Math.min(devicePixelRatio,1.5),width=innerWidth+16,height=innerHeight+16;canvas.width=width*ratio;canvas.height=height*ratio;const c=canvas.getContext('2d');if(!c)return;c.scale(ratio,ratio);let seed=9703;const rnd=()=>{seed=seed*16807%2147483647;return(seed-1)/2147483646;};
    for(let i=0;i<Math.min(290,width*.20);i++){const x=rnd()*width,y=rnd()*height,r=rnd(),alpha=.12+rnd()*.52;c.fillStyle=`rgba(${r>.85?'227,206,226':'190,211,239'},${alpha})`;c.beginPath();c.arc(x,y,.35+r*.65,0,Math.PI*2);c.fill();if(r>.965){c.strokeStyle='rgba(228,215,241,.25)';c.lineWidth=.6;c.beginPath();c.moveTo(x-4,y);c.lineTo(x+4,y);c.moveTo(x,y-4);c.lineTo(x,y+4);c.stroke();}}
  }
  function clearHover(){hovered=-1;links.forEach(a=>{a.classList.remove('is-hovered','is-neighbor');a.style.removeProperty('--dock');});}
  function magnify(index){
    if(!fine.matches||media.matches)return;hovered=index;
    links.forEach((a,i)=>{a.classList.toggle('is-hovered',i===index);a.classList.remove('is-neighbor');});
    const a=links[index],w=worlds[index],art=a.querySelector('.planet-art');
    const bounds=stage.getBoundingClientRect();let factor=1.22;
    const ownW=parseFloat(a.style.getPropertyValue('--size')),ownH=parseFloat(a.style.getPropertyValue('--art-height'));
    worlds.forEach((other,j)=>{if(index===j)return;const b=links[j],ow=parseFloat(b.style.getPropertyValue('--size')),oh=parseFloat(b.style.getPropertyValue('--art-height')),dx=Math.abs((orbitalGeometry[index]?.x??w.x*bounds.width)-(orbitalGeometry[j]?.x??other.x*bounds.width)),dy=Math.abs((orbitalGeometry[index]?.y??w.y*bounds.height)-(orbitalGeometry[j]?.y??other.y*bounds.height));if(dx<(ownW*factor+ow)/2+12&&dy<(ownH*factor+oh)/2+12){factor=Math.max(1,Math.min(factor,Math.max((2*(dx-12)-ow)/ownW,(2*(dy-12)-oh)/ownH)));}});
    a.style.setProperty('--dock',factor.toFixed(3));
  }
  function prefetch(a){const href=new URL(a.href);if(href.origin!==location.origin||document.querySelector(`link[data-prefetch="${href.pathname}"]`))return;const link=document.createElement('link');link.rel='prefetch';link.href=href.pathname;link.dataset.prefetch=href.pathname;document.head.append(link);}
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
  window.addEventListener('resize',layout);media.addEventListener('change',layout);reduced.addEventListener('change',()=>{paused=reduced.matches;syncPause();});window.addEventListener('pageshow',()=>{clearTimeout(flightTimer);flightTimer=null;document.body.classList.remove('is-travelling');clearHover();});

  function renderEmptyRoute(){
    const empty=['jupiter','saturn','uranus','neptune'].includes(location.hash.slice(1));
    const wasEmpty=document.body.classList.contains('is-empty-world');document.body.classList.toggle('is-empty-world',empty);document.querySelector('#empty-world').hidden=!empty;
    clearTimeout(flightTimer);flightTimer=null;document.body.classList.remove('is-travelling');if(wasEmpty&&!empty)layout();
  }
  function orbitFrame(time){
    requestAnimationFrame(orbitFrame);if(time-orbitRendered<32)return;orbitRendered=time;const delta=Math.min(.07,(time-orbitalLast)/1000||0);orbitalLast=time;
    if(paused||reduced.matches||media.matches||document.hidden||document.body.classList.contains('is-empty-world')||flightTimer)return;
    const bounds=stage.getBoundingClientRect(),cx=bounds.width*.095,cy=bounds.height*.48,q=.45;
    orbitalGeometry.forEach((g,i)=>{
      if(i===hovered)return;
      const offset=g.offset+delta*.0014/Math.pow(i+1,.45),a=g.angle+offset,x=cx+g.radius*Math.cos(a),y=cy+g.radius*q*Math.sin(a);
      const own=links[i],ow=parseFloat(own.style.getPropertyValue('--size'))*1.22,oh=parseFloat(own.style.getPropertyValue('--art-height'))*1.22;
      const clear=orbitalGeometry.every((other,j)=>i===j||Math.abs(x-other.x)>(ow+parseFloat(links[j].style.getPropertyValue('--size'))*1.22)/2+22||Math.abs(y-other.y)>(oh+parseFloat(links[j].style.getPropertyValue('--art-height'))*1.22)/2+34);
      if(!clear||x<ow/2+12||x>bounds.width-ow/2-12||y<oh/2+15||y>bounds.height-oh/2-76)return;
      g.offset=offset;g.x=x;g.y=y;own.style.setProperty('--x',`${x}px`);own.style.setProperty('--y',`${y}px`);
      const path=document.querySelectorAll('#orbit-lines path')[i];if(path){const points=[];for(let j=0;j<=16;j++){const t=a-.14+j/16*.28;points.push(`${j?'L':'M'}${(cx+g.radius*Math.cos(t)).toFixed(1)},${(cy+g.radius*q*Math.sin(t)).toFixed(1)}`);}path.setAttribute('d',points.join(' '));}
    });
  }
  window.addEventListener('hashchange',renderEmptyRoute);
  const image=new Image();image.onload=()=>{debug.artReady=true;document.documentElement.classList.add('is-art-ready');};image.onerror=()=>document.documentElement.classList.add('art-failed');image.src=atlas;
  layout();syncPause();renderEmptyRoute();debug.ready=true;requestAnimationFrame(orbitFrame);
})();
