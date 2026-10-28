const stage = document.querySelector('#space-stage');
const root = document.documentElement;
const links = [...document.querySelectorAll('.planet-link')];
const navLinks = [...document.querySelectorAll('.category-nav a')];
const mobileDestination = document.querySelector('#mobile-destination');
const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)');
const mobileQuery = matchMedia('(max-width: 1100px)');
const SUN_X = -11.85;
const orbitalDistance = au => 4.7+20.7*(Math.pow(au,.45)-Math.pow(.387,.45))/(Math.pow(30.069,.45)-Math.pow(.387,.45));
const worlds = [
  { id:'about', title:'关于我', description:'认识这个正在学习的人', color:'#b7b4b1', shade:'#858590', radius:.66, au:.387, angle:-38, style:'rock', tilt:.03, seed:1 },
  { id:'curiosity', title:'兴趣与好奇', description:'被什么吸引，又在好奇什么', color:'#edcf9b', shade:'#bc9a79', radius:.98, au:.723, angle:48, style:'venus', tilt:177.4, seed:2 },
  { id:'interests', title:'生活影像', description:'一些走过、看过、留下来的瞬间', color:'#64a8c2', shade:'#39749a', radius:1.04, au:1, angle:-15, style:'ocean', tilt:23.4, seed:3 },
  { id:'projects', title:'项目', description:'让一个想法，变成可以体验的东西', color:'#d99a7d', shade:'#ad6f60', radius:.8, au:1.524, angle:25, style:'mars', tilt:25.2, seed:4 },
  { id:'research', title:'研究方向', description:'从人工智能，走向真实世界', color:'#e7c5a4', shade:'#b38e76', radius:1.7, au:5.203, angle:-24, style:'jupiter', tilt:3.1, seed:5 },
  { id:'lab', title:'想法实验室', description:'留一点空间，给尚未成形的念头', color:'#e8d4aa', shade:'#bba17d', radius:1.48, au:9.537, angle:20, style:'saturn', tilt:26.7, seed:6 },
  { id:'growth', title:'成长轨迹', description:'慢慢学习，持续向前', color:'#b6dedb', shade:'#7fb6be', radius:1.12, au:19.191, angle:-12, style:'uranus', tilt:97.8, seed:7 },
  { id:'contact', title:'联系我', description:'一次交流，也许就是新的起点', color:'#709bd6', shade:'#3b6aa9', radius:1.08, au:30.069, angle:9, style:'neptune', tilt:28.3, seed:8 }
].map(world=>({...world,orbit:orbitalDistance(world.au),angle:world.angle*Math.PI/180}));
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
function desktopWorldWidth(){return Math.max(30,Math.min(38,width/height/2.6*30));}
function layoutFallback(){
  if(!width||!height) return;
  if(mobileQuery.matches){
    const size=Math.min(205,Math.max(155,width*.49),height*.63);
    const fallbackSun=document.querySelector('#sun-fallback');fallbackSun.style.left='18%';fallbackSun.style.top='17%';fallbackSun.style.width='76px';fallbackSun.style.height='76px';
    links.forEach((link,i)=>{
      link.querySelector('.planet-label').style.top='';
      const offset=((i-selected+12)%8)-4;
      link.style.left=`${width*.5+offset*width*.79}px`;
      link.style.top=`${height*.53-size/2}px`;
      link.style.setProperty('--diameter',`${Math.abs(offset)?size*.72:size}px`);
    });
  }else{
    const viewWidth=desktopWorldWidth(),scale=width/viewWidth,sunX=(.5+SUN_X/viewWidth)*width;
    const fallbackSun=document.querySelector('#sun-fallback');fallbackSun.style.left=`${sunX}px`;fallbackSun.style.top=`${height*.48}px`;fallbackSun.style.width=`${5.3*scale}px`;fallbackSun.style.height=`${5.3*scale}px`;
    links.forEach((link,i)=>{
      const w=worlds[i], x=sunX+Math.cos(w.angle)*w.orbit*scale;
      const y=height*.48+Math.sin(w.angle)*w.orbit*scale*.55;
      link.style.left=`${x}px`; link.style.top=`${y-w.radius*scale}px`;
      link.style.setProperty('--diameter',`${w.radius*2*scale}px`);
      link.querySelector('.planet-label').style.top=w.style==='ocean'?'-47px':w.style==='saturn'?`${w.radius*2*scale*1.24+15}px`:'';
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
  const worldWidth=mobileQuery.matches?9.5:desktopWorldWidth();
  camera.left=-worldWidth/2;camera.right=worldWidth/2;camera.top=worldWidth*height/width*(mobileQuery.matches?.5:.48);camera.bottom=-worldWidth*height/width*(mobileQuery.matches?.5:.52);camera.updateProjectionMatrix();
  resetCamera();positionModels(true);
}
function resetCamera(){
  if(!camera)return;
  if(mobileQuery.matches){camera.position.set(0,0,25);camera.lookAt(0,0,0);}
  else{camera.position.set(0,19.76,30);camera.lookAt(0,0,0);}
  camera.zoom=1;camera.updateProjectionMatrix();
}
function surface(world){
  const canvas=document.createElement('canvas');canvas.width=1536;canvas.height=768;
  const ctx=canvas.getContext('2d');const W=canvas.width,H=canvas.height;
  const bumpCanvas=document.createElement('canvas');bumpCanvas.width=W;bumpCanvas.height=H;const bump=bumpCanvas.getContext('2d');bump.fillStyle='#888';bump.fillRect(0,0,W,H);
  ctx.fillStyle=world.color;ctx.fillRect(0,0,W,H);
  let seed=world.seed*971;const rnd=()=>{seed=(seed*16807)%2147483647;return(seed-1)/2147483646;};
  const ellipse=(context,x,y,rx,ry,rotation=0)=>{context.beginPath();context.ellipse(x,y,rx,ry,rotation,0,Math.PI*2);context.fill();};
  if(world.style==='rock'||world.style==='mars'){
    for(let i=0;i<54;i++){
      const x=rnd()*W,y=rnd()*H,r=12+rnd()*100;const g=ctx.createRadialGradient(x,y,1,x,y,r);
      g.addColorStop(0,world.style==='mars'?'#bd715938':'#5e687c30');g.addColorStop(1,'#00000000');ctx.fillStyle=g;ctx.fillRect(x-r,y-r,r*2,r*2);
    }
    for(let i=0;i<125;i++){
      const x=rnd()*W,y=50+rnd()*(H-100),r=4+Math.pow(rnd(),2)*44;
      ctx.fillStyle=world.style==='mars'?'#824d4138':'#4d566336';ellipse(ctx,x,y,r,r*.82);
      ctx.strokeStyle='#fff3d640';ctx.lineWidth=Math.max(1,r*.12);ctx.beginPath();ctx.ellipse(x,y+1,r,r*.82,0,.1,Math.PI*.94);ctx.stroke();
      const g=bump.createRadialGradient(x-r*.2,y-r*.2,0,x,y,r);g.addColorStop(0,'#505050');g.addColorStop(.7,'#777');g.addColorStop(.85,'#c2c2c2');g.addColorStop(1,'#888');bump.fillStyle=g;ellipse(bump,x,y,r,r*.82);
    }
    if(world.style==='mars'){
      ctx.strokeStyle='#75493b55';ctx.lineWidth=9;ctx.lineCap='round';ctx.beginPath();ctx.moveTo(540,390);ctx.bezierCurveTo(650,370,700,430,860,390);ctx.stroke();ctx.strokeStyle='#e8af7d66';ctx.lineWidth=3;ctx.stroke();
      ctx.fillStyle='#f5dfc8';ellipse(ctx,750,7,790,32);ellipse(ctx,750,H-3,790,27);
    }
  }else if(world.style==='ocean'){
    const g=ctx.createLinearGradient(0,0,0,H);g.addColorStop(0,'#75b5cf');g.addColorStop(.4,'#3586b8');g.addColorStop(.7,'#3d94bb');g.addColorStop(1,'#7cc4cc');ctx.fillStyle=g;ctx.fillRect(0,0,W,H);
    const land=(x,y,rx,ry,seedPhase)=>{
      ctx.beginPath();for(let i=0;i<=80;i++){const a=i/80*Math.PI*2,k=1+.18*Math.sin(a*5+seedPhase)+.09*Math.cos(a*9+seedPhase);const px=x+Math.cos(a)*rx*k,py=y+Math.sin(a)*ry*k;if(i)ctx.lineTo(px,py);else ctx.moveTo(px,py);}ctx.closePath();
      const g=ctx.createLinearGradient(x-rx,y-ry,x+rx,y+ry);g.addColorStop(0,'#b9d896');g.addColorStop(.55,'#8fb89a');g.addColorStop(1,'#d1bd86');ctx.fillStyle=g;ctx.fill();ctx.strokeStyle='#b9e2c277';ctx.lineWidth=4;ctx.stroke();
      bump.save();bump.translate(x,y);bump.fillStyle='#b5b5b5';ellipse(bump,0,0,rx*.9,ry*.9);bump.restore();
    };
    land(225,245,220,104,.8);land(415,460,100,135,2);land(1020,250,315,117,3);land(1010,430,108,142,4);land(1330,590,104,51,5);
    ctx.fillStyle='#f1f4e4';ellipse(ctx,W/2,10,W*.58,37);ellipse(ctx,W/2,H-5,W*.58,45);
    for(let i=0;i<22;i++){const x=rnd()*W,y=rnd()*H;ctx.strokeStyle='#f2fcff44';ctx.lineWidth=2+rnd()*4;ctx.beginPath();ctx.ellipse(x,y,50+rnd()*100,5+rnd()*8,-.1,0,Math.PI*1.5);ctx.stroke();}
  }else{
    const jupiter=world.style==='jupiter',saturn=world.style==='saturn',venus=world.style==='venus';
    const colors=jupiter?['#e8c9a6','#f5e6c7','#bc967f','#e1b38b','#f6dfbb','#c79d86']:saturn?['#f1d7a3','#f5e5bf','#d3b88e','#e8cca1']:venus?['#ebcd93','#f7e7b9','#d5b785','#f2d6a2']:world.style==='uranus'?['#a7d6d7','#b9e3df','#8cbec8','#cae9e2']:['#417bc1','#6c9bd6','#2f66a7','#8ab3df'];
    const count=jupiter?27:saturn?36:venus?22:world.style==='uranus'?16:24;
    for(let i=0;i<count;i++){
      const y=i/count*H,band=H/count;ctx.fillStyle=colors[i%colors.length];ctx.globalAlpha=venus?.64:world.style==='uranus'?.38:.82;
      ctx.beginPath();ctx.moveTo(0,y-20);for(let x=0;x<=W;x+=12)ctx.lineTo(x,y+Math.sin(x/(venus?100:170)+i*.74)*(venus?17:5)+Math.cos(x/65+i)*2);
      for(let x=W;x>=0;x-=12)ctx.lineTo(x,y+band+Math.sin(x/(venus?100:170)+(i+1)*.74)*(venus?17:5)+Math.cos(x/65+i+1)*2);ctx.closePath();ctx.fill();
    }
    ctx.globalAlpha=1;
    if(jupiter){
      ctx.save();ctx.translate(1040,470);ctx.rotate(-.12);ctx.fillStyle='#f0d1a8';ellipse(ctx,0,0,105,48);ctx.fillStyle='#c78469';ellipse(ctx,0,0,87,34);ctx.fillStyle='#d19c7d';ellipse(ctx,-10,-2,60,19);ctx.strokeStyle='#ecc8a8';ctx.lineWidth=3;ctx.beginPath();ctx.ellipse(-10,0,55,17,0,.2,Math.PI*1.8);ctx.stroke();ctx.restore();
    }else if(world.style==='neptune'){
      ctx.fillStyle='#244f8e77';ellipse(ctx,1020,335,78,27,-.12);ctx.strokeStyle='#d9edffbb';ctx.lineWidth=5;ctx.lineCap='round';ctx.beginPath();ctx.moveTo(840,400);ctx.bezierCurveTo(970,390,1110,410,1220,385);ctx.stroke();
    }
  }
  ctx.globalAlpha=1;
  const tex=new THREE.CanvasTexture(canvas);tex.colorSpace=THREE.SRGBColorSpace;tex.wrapS=THREE.RepeatWrapping;tex.anisotropy=Math.min(8,renderer.capabilities.getMaxAnisotropy());
  const bumpTex=new THREE.CanvasTexture(bumpCanvas);bumpTex.wrapS=THREE.RepeatWrapping;
  return {map:tex,bumpMap:world.style==='rock'||world.style==='mars'||world.style==='ocean'?bumpTex:null};
}
function cloudTexture(){
  const c=document.createElement('canvas');c.width=1536;c.height=768;const ctx=c.getContext('2d');
  for(let i=0;i<32;i++){const x=(i*277)%1536,y=60+(i*157)%650;ctx.strokeStyle=`rgba(255,255,255,${.19+(i%4)*.08})`;ctx.lineWidth=9+i%5*4;ctx.lineCap='round';ctx.beginPath();ctx.moveTo(x-60,y);ctx.bezierCurveTo(x-5,y-22,x+50,y+19,x+120,y-8);ctx.stroke();}
  const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;t.wrapS=THREE.RepeatWrapping;return t;
}
function ringTexture(){
  const c=document.createElement('canvas');c.width=512;c.height=2;const ctx=c.getContext('2d');
  const g=ctx.createLinearGradient(0,0,512,0);g.addColorStop(0,'#b89d7d22');g.addColorStop(.15,'#e5cfaacc');g.addColorStop(.42,'#f4dfb5ee');g.addColorStop(.66,'#c8ae87dd');g.addColorStop(1,'#dec9a666');ctx.fillStyle=g;ctx.fillRect(0,0,512,2);
  for(let i=0;i<60;i++){ctx.fillStyle=i%3?'#fff0ca33':'#624e4a3b';ctx.fillRect(i*8.5,0,i%4===0?3:1,2);}ctx.clearRect(332,0,15,2);ctx.clearRect(458,0,6,2);
  const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;return t;
}
function atmosphere(radius,color){
  return new THREE.Mesh(new THREE.SphereGeometry(radius,96,64),new THREE.ShaderMaterial({uniforms:{glowColor:{value:new THREE.Color(color)}},vertexShader:'varying vec3 n;varying vec3 p;void main(){n=normalize(normalMatrix*normal);vec4 mv=modelViewMatrix*vec4(position,1.0);p=normalize(-mv.xyz);gl_Position=projectionMatrix*mv;}',fragmentShader:'uniform vec3 glowColor;varying vec3 n;varying vec3 p;void main(){float f=pow(1.0-max(dot(normalize(n),normalize(p)),0.0),3.8);gl_FragColor=vec4(glowColor,f*.32);}',transparent:true,depthWrite:false,blending:THREE.AdditiveBlending}));
}
function makeWorld(world){
  const group=new THREE.Group(),axis=new THREE.Group();group.add(axis);const radius=world.radius,maps=surface(world);
  const material=new THREE.MeshPhysicalMaterial({color:'#ffffff',...maps,bumpScale:world.style==='ocean'?.025:.045,roughness:world.style==='ocean'?.48:.78,metalness:0,clearcoat:world.style==='ocean'?.32:.08,clearcoatRoughness:.65});
  const body=new THREE.Mesh(new THREE.SphereGeometry(radius,112,80),material);axis.add(body);
  if(world.style==='ocean'){
    const clouds=new THREE.Mesh(new THREE.SphereGeometry(radius*1.018,96,64),new THREE.MeshStandardMaterial({map:cloudTexture(),transparent:true,opacity:.8,depthWrite:false,roughness:1}));axis.add(clouds);body.userData.clouds=clouds;axis.add(atmosphere(radius*1.055,'#8fd4fa'));
  }else if(['venus','jupiter','saturn','uranus','neptune'].includes(world.style))axis.add(atmosphere(radius*1.025,world.color));
  if(world.style==='saturn'){
    const geo=new THREE.RingGeometry(radius*1.34,radius*2.14,160);const pos=geo.attributes.position,uv=geo.attributes.uv;
    for(let i=0;i<pos.count;i++){const r=Math.hypot(pos.getX(i),pos.getY(i));uv.setXY(i,(r-radius*1.34)/(radius*.8),.5);}
    const ring=new THREE.Mesh(geo,new THREE.MeshStandardMaterial({map:ringTexture(),side:THREE.DoubleSide,transparent:true,roughness:.9,opacity:1,depthWrite:true,alphaTest:.08}));ring.rotation.x=-Math.PI/2;axis.add(ring);
  }
  axis.rotation.z=world.tilt*Math.PI/180;axis.rotation.y=world.style==='saturn'?.25:0;
  body.rotation.y=world.seed*.8;
  scene.add(group);return {group,body,world};
}
function positionModels(immediate=false){
  if(!meshes.length)return;
  const mobile=mobileQuery.matches;
  sun.position.set(mobile?-3.2:SUN_X,mobile?camera.top*.73:0,mobile?6:0);sun.scale.setScalar(mobile?.3:1);
  const sunlight=scene.getObjectByName('sunlight');if(sunlight)sunlight.position.copy(sun.position);
  scene.getObjectByName('orbit-arcs').visible=!mobile;
  meshes.forEach(({group,world},i)=>{
    let x,y,z,scale;
    if(mobile){
      const offset=((i-selected+12)%8)-4;
      x=offset*7.5;y=-camera.top*.03;z=Math.abs(offset)?-3:0;
      const desiredDiameter=Math.min(215,Math.max(155,width*.49),height*.68);
      scale=desiredDiameter*(world.style==='saturn'?.68:1)*9.5/(width*world.radius*2);
      if(offset)scale*=.72;
      group.visible=Math.abs(offset)<=1;
    }else{
      const angle=world.angle+(hovered===world.id?world.frozenAngle??0:world.motion||0);
      x=SUN_X+Math.cos(angle)*world.orbit;y=0;z=Math.sin(angle)*world.orbit;
      scale=1;group.visible=true;
    }
    if(immediate||!mobile||reduceMotion.matches)group.position.set(x,y,z);
    else group.position.lerp(new THREE.Vector3(x,y,z),.24);
    group.scale.setScalar(scale);group.rotation.x=mobile?.38:0;
  });
}
function positionLinks(){
  const center=new THREE.Vector3();
  meshes.forEach(({group,world},i)=>{
    group.getWorldPosition(center);center.project(camera);
    const x=(center.x*.5+.5)*width,y=(-center.y*.5+.5)*height;
    const diameter=world.radius*2*group.scale.x/(camera.right-camera.left)*width*camera.zoom;
    const label=document.querySelector(`.planet-link[data-world="${world.id}"] .planet-label`);
    if(!mobileQuery.matches){label.style.top=world.style==='ocean'?'-47px':world.style==='saturn'?`${diameter*1.24+15}px`:'';}else label.style.top='';
    const link=links[i];link.style.left=`${x}px`;link.style.top=`${y-diameter/2}px`;link.style.setProperty('--diameter',`${diameter}px`);
  });
}
function addOrbits(){
  const arcs=new THREE.Group();arcs.name='orbit-arcs';
  worlds.forEach(world=>{
    const points=[],halfArc=world.au<2?.28:.19;
    for(let j=0;j<=64;j++){const a=world.angle-halfArc+j/64*halfArc*2;points.push(new THREE.Vector3(SUN_X+Math.cos(a)*world.orbit,-.03,Math.sin(a)*world.orbit));}
    const line=new THREE.Line(new THREE.BufferGeometry().setFromPoints(points),new THREE.LineBasicMaterial({color:'#b5b4d0',transparent:true,opacity:.21}));line.userData.world=world;arcs.add(line);
  });scene.add(arcs);
}
function makeSun(){
  const group=new THREE.Group(),c=document.createElement('canvas');c.width=1536;c.height=768;const ctx=c.getContext('2d');ctx.fillStyle='#f9cf79';ctx.fillRect(0,0,c.width,c.height);
  let seed=473;const rnd=()=>{seed=seed*16807%2147483647;return(seed-1)/2147483646;};
  for(let i=0;i<1200;i++){const x=rnd()*1536,y=rnd()*768,r=3+rnd()*19;const g=ctx.createRadialGradient(x,y,0,x,y,r);g.addColorStop(0,i%4?'#fff4b957':'#df985c44');g.addColorStop(1,'#ffffff00');ctx.fillStyle=g;ctx.fillRect(x-r,y-r,r*2,r*2);}
  const map=new THREE.CanvasTexture(c);map.colorSpace=THREE.SRGBColorSpace;map.wrapS=THREE.RepeatWrapping;
  const surface=new THREE.Mesh(new THREE.SphereGeometry(2.65,112,80),new THREE.MeshBasicMaterial({map,color:'#fff1cc'}));group.add(surface);group.userData.surface=surface;
  const glowCanvas=document.createElement('canvas');glowCanvas.width=512;glowCanvas.height=512;const gc=glowCanvas.getContext('2d');const g=gc.createRadialGradient(256,256,40,256,256,256);g.addColorStop(0,'rgba(255,223,157,.35)');g.addColorStop(.48,'rgba(255,192,112,.15)');g.addColorStop(1,'rgba(255,165,111,0)');gc.fillStyle=g;gc.fillRect(0,0,512,512);
  const glow=new THREE.Sprite(new THREE.SpriteMaterial({map:new THREE.CanvasTexture(glowCanvas),transparent:true,depthWrite:false,blending:THREE.AdditiveBlending}));glow.scale.set(12,12,1);group.add(glow);group.add(atmosphere(2.74,'#f8c77c'));scene.add(group);return group;
}
function frame(time){
  requestAnimationFrame(frame);if(document.hidden||time-lastFrame<31)return;
  const delta=Math.min(.08,(time-lastFrame)/1000||0);lastFrame=time;
  if(!paused&&!flight){elapsed+=delta;worlds.forEach(w=>{if(hovered!==w.id)w.motion=(w.motion||0)+delta*.000003/Math.pow(w.au,1.5);});meshes.forEach(({body,world})=>{if(hovered!==world.id)body.rotation.y+=delta*.045;if(body.userData.clouds)body.userData.clouds.rotation.y+=delta*.055;});}
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
    renderer=new THREE.WebGLRenderer({alpha:true,antialias:true,powerPreference:'low-power'});renderer.domElement.className='gl-solar';renderer.domElement.setAttribute('aria-hidden','true');renderer.setClearColor('#101127',0);renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.08;stage.prepend(renderer.domElement);
    scene=new THREE.Scene();camera=new THREE.OrthographicCamera(-15,15,8,-8,.1,200);
    scene.add(new THREE.HemisphereLight('#e7efff','#5b597d',1.45));
    const key=new THREE.DirectionalLight('#eef0ff',.75);key.position.set(-6,10,18);scene.add(key);
    const sunlight=new THREE.PointLight('#fff0d6',30,0,1.2);sunlight.name='sunlight';scene.add(sunlight);
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
  flight={start:performance.now(),href:anchor.href,target,camera:camera.position.clone(),look:mobileQuery.matches?new THREE.Vector3():new THREE.Vector3(),offset:camera.position.clone().sub(mobileQuery.matches?new THREE.Vector3():new THREE.Vector3())};
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
