const stage = document.querySelector('#space-stage');
const root = document.documentElement;
const links = [...document.querySelectorAll('.planet-link')];
const navLinks = [...document.querySelectorAll('.category-nav a')];
const mobileDestination = document.querySelector('#mobile-destination');
const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)');
const mobileQuery = matchMedia('(max-width: 1100px)');
const worlds = [
  { id:'about', title:'关于我', description:'认识这个正在学习的人', color:'#90d9ce', shade:'#659bab', radius:1.02, orbit:5.5, angle:-2.8, style:'ocean' },
  { id:'curiosity', title:'兴趣与好奇', description:'被什么吸引，又在好奇什么', color:'#ffc09c', shade:'#cc8f91', radius:.84, orbit:8.2, angle:-1.85, style:'craters' },
  { id:'interests', title:'生活影像', description:'一些走过、看过、留下来的瞬间', color:'#cab3f1', shade:'#9380bd', radius:1.08, orbit:8.7, angle:2.35, style:'bands' },
  { id:'projects', title:'项目', description:'让一个想法，变成可以体验的东西', color:'#d8bef3', shade:'#9a82c0', radius:1.18, orbit:6.5, angle:.32, style:'ring' },
  { id:'research', title:'研究方向', description:'从人工智能，走向真实世界', color:'#a1c9f1', shade:'#7494c1', radius:1.1, orbit:10.5, angle:-.8, style:'bands' },
  { id:'lab', title:'想法实验室', description:'留一点空间，给尚未成形的念头', color:'#f3d5a0', shade:'#b99b7a', radius:1.18, orbit:11.8, angle:3.07, style:'craters' },
  { id:'growth', title:'成长轨迹', description:'慢慢学习，持续向前', color:'#b5dfbb', shade:'#7aaf9f', radius:.94, orbit:13.1, angle:-1.16, style:'bands' },
  { id:'contact', title:'联系我', description:'一次交流，也许就是新的起点', color:'#f4bdce', shade:'#b78fbd', radius:.87, orbit:11.6, angle:1.17, style:'craters' }
];
let selected = 0;
let paused = reduceMotion.matches;
let hovered = '';
let width=0, height=0, renderer, scene, camera, THREE, sun, flight, lastFrame=0, elapsed=0;
let meshes=[];
let gestureStart=null, suppressClickUntil=0;
const debug = window.SolarSystem = { ready:false, worlds, get activeId(){return worlds[selected].id;}, get mode(){return mobileQuery.matches?'mobile':'desktop';}, get paused(){return paused;}, setActive:index=>setActive(index) };
function syncPause(){
  document.querySelector('#orbit-pause').setAttribute('aria-pressed',String(paused));
  document.querySelector('#pause-copy').textContent=paused?'继续运行':'暂停运行';
  document.querySelector('.motion-icon').textContent=paused?'▷':'Ⅱ';
}
function setActive(index){
  selected=(index+worlds.length)%worlds.length;
  const current=worlds[selected];
  links.forEach((link,i)=>{
    link.classList.toggle('is-current',i===selected);
    link.classList.toggle('is-neighbor',i===(selected+7)%8||i===(selected+1)%8);
    link.tabIndex=mobileQuery.matches&&i!==selected?-1:0;
  });
  navLinks.forEach(link=>link.classList.toggle('is-active',link.dataset.world===current.id));
  mobileDestination.href=`/worlds/${current.id}.html`;
  mobileDestination.dataset.world=current.id;
  mobileDestination.style.setProperty('--accent',current.color);
  document.querySelector('#mobile-index').textContent=`${String(selected+1).padStart(2,'0')} / 08`;
  document.querySelector('#mobile-title').textContent=current.title;
  document.querySelector('#mobile-description').textContent=current.description;
  layoutFallback();
}
function layoutFallback(){
  if(!width||!height) return;
  if(mobileQuery.matches){
    const size=Math.min(205,Math.max(155,width*.49),height*.63);
    links.forEach((link,i)=>{
      const offset=((i-selected+12)%8)-4;
      link.style.left=`${width*.5+offset*width*.79}px`;
      link.style.top=`${height*.53-size/2}px`;
      link.style.setProperty('--diameter',`${Math.abs(offset)?size*.72:size}px`);
    });
  }else{
    const scale=Math.min(width/31,height/14.8);
    links.forEach((link,i)=>{
      const w=worlds[i], x=width*.48+Math.cos(w.angle)*w.orbit*scale;
      const y=height*.47+Math.sin(w.angle)*w.orbit*scale*.42;
      link.style.left=`${x}px`; link.style.top=`${y-w.radius*scale}px`;
      link.style.setProperty('--diameter',`${w.radius*2*scale}px`);
    });
  }
}
function stars(){
  const canvas=document.querySelector('#starfield'), ratio=Math.min(devicePixelRatio,1.5);
  canvas.width=innerWidth*ratio; canvas.height=innerHeight*ratio;
  const ctx=canvas.getContext('2d'); ctx.scale(ratio,ratio);ctx.clearRect(0,0,innerWidth,innerHeight);
  let seed=927;
  const random=()=>{seed=(seed*16807)%2147483647;return(seed-1)/2147483646;};
  for(let i=0;i<Math.min(150,innerWidth*.12);i++){
    const x=random()*innerWidth,y=random()*innerHeight,r=random();
    ctx.fillStyle=`rgba(220,224,255,${.12+random()*.43})`;ctx.beginPath();ctx.arc(x,y,r>.94?1.4:.4+r*.5,0,Math.PI*2);ctx.fill();
    if(r>.97){ctx.strokeStyle='rgba(228,224,255,.2)';ctx.beginPath();ctx.moveTo(x-4,y);ctx.lineTo(x+4,y);ctx.moveTo(x,y-4);ctx.lineTo(x,y+4);ctx.stroke();}
  }
}
function resize(){
  const bounds=stage.getBoundingClientRect();width=bounds.width;height=bounds.height;
  setActive(selected);stars();
  if(!renderer)return;
  renderer.setPixelRatio(Math.min(devicePixelRatio,mobileQuery.matches?1.25:1.5));renderer.setSize(width,height);
  const worldWidth=mobileQuery.matches?9.5:Math.max(30,28.8*width/height/2.05);
  camera.left=-worldWidth/2;camera.right=worldWidth/2;camera.top=worldWidth*height/width/2;camera.bottom=-camera.top;camera.updateProjectionMatrix();
  resetCamera();positionModels(true);
}
function resetCamera(){
  if(!camera)return;
  if(mobileQuery.matches){camera.position.set(0,0,25);camera.lookAt(0,0,0);}
  else{camera.position.set(-.6,12,30);camera.lookAt(-.6,0,0);}
  camera.zoom=1;camera.updateProjectionMatrix();
}
function surface(world){
  const canvas=document.createElement('canvas');canvas.width=1024;canvas.height=512;
  const ctx=canvas.getContext('2d');ctx.fillStyle=world.color;ctx.fillRect(0,0,1024,512);
  if(world.style==='bands'||world.style==='ring'){
    const colors=[world.shade,'#ffffff',world.shade,'#ffffff'];
    [105,205,320,395].forEach((y,i)=>{
      ctx.fillStyle=colors[i];ctx.globalAlpha=i%2?.2:.24;ctx.beginPath();ctx.moveTo(0,y);
      for(let x=0;x<=1024;x+=16)ctx.lineTo(x,y+Math.sin(x/170+i*1.7)*(i%2?9:17));
      for(let x=1024;x>=0;x-=16)ctx.lineTo(x,y+38+Math.sin(x/170+i*1.7)*13);
      ctx.closePath();ctx.fill();
    });
  }else if(world.style==='ocean'){
    ctx.fillStyle='#c2e2a9';ctx.globalAlpha=.95;
    [[110,145,130,60],[330,300,96,78],[680,160,150,78],[890,365,120,60]].forEach(([x,y,rx,ry])=>{
      ctx.beginPath();ctx.ellipse(x,y,rx,ry,-.3,0,Math.PI*2);ctx.fill();
      ctx.beginPath();ctx.ellipse(x+rx*.5,y-ry*.5,rx*.7,ry*.8,.4,0,Math.PI*2);ctx.fill();
    });
    ctx.fillStyle='#fff';ctx.globalAlpha=.52;
    [[140,70],[500,230],[800,400],[980,90]].forEach(([x,y])=>{ctx.beginPath();ctx.ellipse(x,y,110,12,-.1,0,Math.PI*2);ctx.fill();});
  }else{
    [[110,155,43],[420,350,59],[710,130,48],[840,370,28],[330,100,22],[990,220,37]].forEach(([x,y,r])=>{
      ctx.fillStyle=world.shade;ctx.globalAlpha=.3;ctx.beginPath();ctx.ellipse(x,y,r,r*.82,0,0,Math.PI*2);ctx.fill();
      ctx.strokeStyle='#fff';ctx.globalAlpha=.3;ctx.lineWidth=6;ctx.beginPath();ctx.ellipse(x,y+3,r,r*.82,0,.12,Math.PI*.87);ctx.stroke();
    });
  }
  ctx.globalAlpha=1;
  const tex=new THREE.CanvasTexture(canvas);tex.colorSpace=THREE.SRGBColorSpace;tex.wrapS=THREE.RepeatWrapping;tex.anisotropy=Math.min(4,renderer.capabilities.getMaxAnisotropy());return tex;
}
function ringTexture(){
  const c=document.createElement('canvas');c.width=256;c.height=2;const ctx=c.getContext('2d');
  ctx.fillStyle='#d8b39e';ctx.fillRect(0,0,256,2);ctx.fillStyle='#f3d2b1';ctx.fillRect(22,0,44,2);ctx.fillRect(104,0,55,2);ctx.fillStyle='#9c84bd';ctx.fillRect(85,0,12,2);ctx.fillRect(196,0,9,2);
  const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;return t;
}
function makeWorld(world){
  const group=new THREE.Group();const radius=world.radius;
  const material=new THREE.MeshToonMaterial({color:'#ffffff',map:surface(world),gradientMap:toonRamp});
  const body=new THREE.Mesh(new THREE.SphereGeometry(radius,72,48),material);group.add(body);
  const outline=new THREE.Mesh(new THREE.SphereGeometry(radius*1.014,64,40),new THREE.MeshBasicMaterial({color:world.shade,side:THREE.BackSide}));group.add(outline);
  if(world.style==='ring'){
    const geo=new THREE.RingGeometry(radius*1.4,radius*2.05,128);const pos=geo.attributes.position,uv=geo.attributes.uv;
    for(let i=0;i<pos.count;i++){const r=Math.hypot(pos.getX(i),pos.getY(i));uv.setXY(i,(r-radius*1.4)/(radius*.65),.5);}
    const ring=new THREE.Mesh(geo,new THREE.MeshBasicMaterial({map:ringTexture(),side:THREE.DoubleSide,transparent:true,opacity:.9}));ring.rotation.x=-Math.PI/2+.36;ring.rotation.y=.18;ring.rotation.z=-.28;group.add(ring);
  }
  group.rotation.z=world.style==='ring'?.22:.08;
  scene.add(group);return {group,body,world};
}
let toonRamp;
function positionModels(immediate=false){
  if(!meshes.length)return;
  const mobile=mobileQuery.matches;
  sun.position.set(mobile?-3.2:-1.8,mobile?camera.top*.73:0,mobile?-5:0);sun.scale.setScalar(mobile?.45:1);
  scene.getObjectByName('orbit-arcs').visible=!mobile;
  meshes.forEach(({group,world},i)=>{
    let x,y,z,scale;
    if(mobile){
      const offset=((i-selected+12)%8)-4;
      x=offset*7.5;y=-camera.top*.03;z=Math.abs(offset)?-3:0;
      const desiredDiameter=Math.min(215,Math.max(155,width*.49),height*.68);
      scale=desiredDiameter*9.5/(width*world.radius*2);
      if(offset)scale*=.72;
      group.visible=Math.abs(offset)<=1;
    }else{
      const angle=world.angle+(hovered===world.id?world.frozenAngle??0:world.motion||0);
      x=-1.8+Math.cos(angle)*world.orbit;y=0;z=Math.sin(angle)*world.orbit;
      scale=1;group.visible=true;
    }
    if(immediate||!mobile||reduceMotion.matches)group.position.set(x,y,z);
    else group.position.lerp(new THREE.Vector3(x,y,z),.14);
    group.scale.setScalar(scale);
  });
}
function positionLinks(){
  const center=new THREE.Vector3();
  meshes.forEach(({group,world},i)=>{
    group.getWorldPosition(center);center.project(camera);
    const x=(center.x*.5+.5)*width,y=(-center.y*.5+.5)*height;
    const diameter=world.radius*2*group.scale.x/(camera.right-camera.left)*width*camera.zoom;
    const link=links[i];link.style.left=`${x}px`;link.style.top=`${y-diameter/2}px`;link.style.setProperty('--diameter',`${diameter}px`);
  });
}
function addOrbits(){
  const arcs=new THREE.Group();arcs.name='orbit-arcs';
  [5.5,8.7,11.8,13.1].forEach((radius,i)=>{
    const points=[];const start=[.1,1.2,2.1,-1.1][i];
    for(let j=0;j<=120;j++){const a=start+j/120*Math.PI*1.4;points.push(new THREE.Vector3(-1.8+Math.cos(a)*radius,-.12,Math.sin(a)*radius));}
    arcs.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(points),new THREE.LineBasicMaterial({color:'#ada7d9',transparent:true,opacity:.12})));
  });scene.add(arcs);
}
function makeSun(){
  const group=new THREE.Group();group.add(new THREE.Mesh(new THREE.SphereGeometry(1.8,72,48),new THREE.MeshBasicMaterial({color:'#ffe6a6'})));
  const c=document.createElement('canvas');c.width=256;c.height=256;const ctx=c.getContext('2d');const gradient=ctx.createRadialGradient(128,128,8,128,128,128);gradient.addColorStop(0,'rgba(255,221,141,.56)');gradient.addColorStop(.35,'rgba(255,194,111,.28)');gradient.addColorStop(1,'rgba(255,165,111,0)');ctx.fillStyle=gradient;ctx.fillRect(0,0,256,256);
  const glow=new THREE.Sprite(new THREE.SpriteMaterial({map:new THREE.CanvasTexture(c),transparent:true,depthWrite:false,blending:THREE.AdditiveBlending}));glow.scale.set(8,8,1);group.add(glow);
  const detail=new THREE.Mesh(new THREE.SphereGeometry(1.808,72,48),new THREE.MeshBasicMaterial({color:'#fff2c9',transparent:true,opacity:.16,wireframe:false}));detail.scale.set(.99,.99,.99);group.add(detail);
  scene.add(group);return group;
}
function frame(time){
  requestAnimationFrame(frame);if(document.hidden||time-lastFrame<31)return;
  const delta=Math.min(.08,(time-lastFrame)/1000||0);lastFrame=time;
  if(!paused&&!flight){elapsed+=delta;worlds.forEach(w=>{if(hovered!==w.id)w.motion=(w.motion||0)+delta*.00012/Math.pow(w.orbit/5.5,1.5);});meshes.forEach(({body,world})=>{if(hovered!==world.id)body.rotation.y+=delta*.035;});}
  if(flight){
    const progress=Math.min(1,(time-flight.start)/680),ease=1-Math.pow(1-progress,3);
    camera.zoom=1+ease*2.8;camera.position.lerpVectors(flight.camera,flight.target.clone().add(flight.offset),ease);camera.lookAt(flight.target.clone().multiplyScalar(ease).addScaledVector(flight.look,1-ease));camera.updateProjectionMatrix();
    if(progress===1&&!flight.done){flight.done=true;location.assign(flight.href);}
  }else positionModels();
  renderer.render(scene,camera);positionLinks();
}
async function init(){
  try{
    THREE=await import('./vendor/three.module.js');
    renderer=new THREE.WebGLRenderer({alpha:true,antialias:true,powerPreference:'low-power'});renderer.domElement.className='gl-solar';renderer.domElement.setAttribute('aria-hidden','true');renderer.setClearColor('#101127',0);renderer.outputColorSpace=THREE.SRGBColorSpace;stage.prepend(renderer.domElement);
    scene=new THREE.Scene();camera=new THREE.OrthographicCamera(-15,15,8,-8,.1,200);
    const ramp=new Uint8Array([110,165,218,255]);toonRamp=new THREE.DataTexture(ramp,4,1,THREE.RedFormat);toonRamp.minFilter=toonRamp.magFilter=THREE.NearestFilter;toonRamp.needsUpdate=true;
    scene.add(new THREE.HemisphereLight('#f0e9ff','#59527b',2.5));
    const key=new THREE.DirectionalLight('#fff5df',2.3);key.position.set(-6,10,12);scene.add(key);
    const rim=new THREE.DirectionalLight('#b9a8fa',1.2);rim.position.set(9,2,-8);scene.add(rim);
    sun=makeSun();addOrbits();meshes=worlds.map(makeWorld);resize();
    renderer.render(scene,camera);positionLinks();root.classList.add('is-webgl-ready');debug.ready=true;Object.assign(debug,{scene,camera,renderer,meshes});requestAnimationFrame(frame);
    renderer.domElement.addEventListener('webglcontextlost',event=>{event.preventDefault();root.classList.remove('is-webgl-ready');debug.ready=false;});
  }catch(error){console.warn('Illustrated scene fallback:',error.message);root.classList.add('is-image-scene');debug.fallback=true;}
}
function travel(event){
  if(event.defaultPrevented||event.button>0||event.metaKey||event.ctrlKey||event.shiftKey||event.altKey)return;
  if(performance.now()<suppressClickUntil){event.preventDefault();return;}
  if(reduceMotion.matches||!debug.ready)return;
  const anchor=event.currentTarget;const index=worlds.findIndex(w=>w.id===anchor.dataset.world);if(index<0)return;
  event.preventDefault();if(flight)return;setActive(index);
  const target=meshes[index].group.position.clone();
  document.querySelector('#travel-name').textContent=worlds[index].title;document.body.classList.add('is-travelling');
  flight={start:performance.now(),href:anchor.href,target,camera:camera.position.clone(),look:mobileQuery.matches?new THREE.Vector3():new THREE.Vector3(-.6,0,0),offset:camera.position.clone().sub(mobileQuery.matches?new THREE.Vector3():new THREE.Vector3(-.6,0,0))};
}
[...links,...navLinks,mobileDestination].forEach(link=>link.addEventListener('click',travel));
links.forEach(link=>{
  const freeze=()=>{hovered=link.dataset.world;const world=worlds.find(w=>w.id===hovered);world.frozenAngle=world.motion||0;};
  const release=()=>{hovered='';};link.addEventListener('pointerenter',freeze);link.addEventListener('pointerleave',release);link.addEventListener('focus',freeze);link.addEventListener('blur',release);
});
document.querySelector('#orbit-pause').addEventListener('click',()=>{paused=!paused;syncPause();});
document.querySelector('#previous-world').addEventListener('click',()=>setActive(selected-1));
document.querySelector('#next-world').addEventListener('click',()=>setActive(selected+1));
stage.addEventListener('pointerdown',event=>{if(mobileQuery.matches&&event.pointerType!=='mouse')gestureStart={x:event.clientX,y:event.clientY};});
stage.addEventListener('pointerup',event=>{if(!gestureStart)return;const dx=event.clientX-gestureStart.x,dy=event.clientY-gestureStart.y;gestureStart=null;if(Math.abs(dx)>45&&Math.abs(dx)>Math.abs(dy)*1.3){setActive(selected+(dx<0?1:-1));suppressClickUntil=performance.now()+500;}});
stage.addEventListener('pointercancel',()=>gestureStart=null);
window.addEventListener('resize',resize);mobileQuery.addEventListener('change',resize);reduceMotion.addEventListener('change',()=>{paused=reduceMotion.matches;syncPause();});
window.addEventListener('pageshow',()=>{flight=null;document.body.classList.remove('is-travelling');resetCamera();});
syncPause();resize();init();
