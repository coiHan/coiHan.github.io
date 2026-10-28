const root = document.documentElement;
const stage = document.querySelector('#system-stage');
const scroller = document.querySelector('#system-scroll');
const pauseButton = document.querySelector('#orbit-pause');
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
const finePointer = matchMedia('(hover: hover) and (pointer: fine)');
const textureRoot = '/assets/textures/';
const planetData = [
  { id:'mercury', planet:'水星', world:'关于我', x:11, au:.387, radius:.61, tilt:.03, spin:.025, color:0x9c9692 },
  { id:'venus', planet:'金星', world:'兴趣与好奇', x:18.2, au:.723, radius:1.07, tilt:177.4, spin:.018, color:0xc7a76e },
  { id:'earth', planet:'地球', world:'生活影像', x:25.5, au:1, radius:1.1, tilt:23.4, spin:.065, color:0x5483a1 },
  { id:'mars', planet:'火星', world:'项目', x:32.6, au:1.524, radius:.72, tilt:25.2, spin:.062, color:0xb66c4c },
  { id:'jupiter', planet:'木星', world:'研究方向', x:45, au:5.203, radius:4.16, tilt:3.1, spin:.11, color:0xc5b6a0 },
  { id:'saturn', planet:'土星', world:'想法实验室', x:64, au:9.537, radius:3.52, tilt:26.7, spin:.1, color:0xd0c19f },
  { id:'uranus', planet:'天王星', world:'成长轨迹', x:80, au:19.19, radius:2.22, tilt:97.8, spin:.073, color:0x96c6c9 },
  { id:'neptune', planet:'海王星', world:'联系我', x:92, au:30.07, radius:2.16, tilt:28.3, spin:.076, color:0x4a66c5 }
].map(data => ({...data, anchor:document.querySelector('#planet-' + data.id),orbitAngle:0,orbitRate:.0001/Math.pow(data.au,1.5),frozen:false}));
let THREE, renderer, scene, camera, models = [], clouds, sunModel, highlight, highlightedData;
let paused = reducedMotion.matches, travelling = false, webglReady = false, flight = null;
let width = 0, height = 0, viewWidth = 115, viewCenter = 46, lastTime = performance.now(), lastFrame = 0;
let pointerX = 0, pointerY = 0, cameraOffsetX = 0, cameraOffsetY = 0;
let stars = [], starContext, starWidth = 0, starHeight = 0, navigationTimer;
const clamp = (number,min,max) => Math.min(max,Math.max(min,number));
const lerp = (a,b,t) => a + (b-a)*t;
const ease = t => 1-Math.pow(1-t,3);
function random(seed){const n=Math.sin(seed*127.1+311.7)*43758.5453;return n-Math.floor(n)}

function drawStars(){
  if(!starContext)return;
  starContext.clearRect(0,0,starWidth,starHeight);
  stars.forEach((star,index)=>{
    starContext.fillStyle='rgba(173,195,224,'+star.alpha+')';
    starContext.beginPath();starContext.arc(star.x,star.y,star.size,0,Math.PI*2);starContext.fill();
    if(index%101===0){starContext.strokeStyle='rgba(176,199,225,.16)';starContext.lineWidth=.6;starContext.beginPath();starContext.moveTo(star.x-3,star.y);starContext.lineTo(star.x+3,star.y);starContext.moveTo(star.x,star.y-3);starContext.lineTo(star.x,star.y+3);starContext.stroke()}
  });
}
function sizeStars(){
  const canvas=document.querySelector('#starfield'),ratio=Math.min(devicePixelRatio||1,2);
  starWidth=innerWidth;starHeight=innerHeight;canvas.width=Math.round(starWidth*ratio);canvas.height=Math.round(starHeight*ratio);
  starContext=canvas.getContext('2d');if(starContext)starContext.setTransform(ratio,0,0,ratio,0,0);
  stars=Array.from({length:Math.min(300,Math.round(starWidth*starHeight/5800))},(_,i)=>({x:random(i*4+1)*starWidth,y:random(i*4+2)*starHeight,size:.3+random(i*4+3)*.6,alpha:.17+random(i*4+4)*.44}));drawStars();
}
function positionFallback(){
  width=stage.clientWidth;height=stage.clientHeight;
  planetData.forEach(data=>{
    const x=(data.x-viewCenter+viewWidth/2)/viewWidth*width,diameter=data.radius*2*width/viewWidth;
    data.screenX=x;data.screenY=height/2;
    data.anchor.style.left=x+'px';data.anchor.style.top=height/2+'px';data.anchor.style.setProperty('--diameter',diameter+'px');
  });
  const sunX=(0-viewCenter+viewWidth/2)/viewWidth*width,sunRadius=8.1*width/viewWidth;
  const fallback=document.querySelector('#sun-fallback');fallback.style.left=sunX+'px';fallback.style.top=height/2+'px';fallback.style.width=fallback.style.height=sunRadius*2+'px';
  const label=document.querySelector('#sun-label');label.style.left=sunX+'px';label.style.top=height/2+sunRadius+19+'px';
}
function updatePause(){pauseButton.setAttribute('aria-pressed',String(paused));document.querySelector('#pause-copy').textContent=paused?'继续运行':'暂停运行'}
pauseButton.hidden=false;updatePause();pauseButton.addEventListener('click',()=>{paused=!paused;updatePause()});

function screenPoint(x,y=0,z=0){
  const vector=new THREE.Vector3(x,y,z).project(camera);
  return {x:(vector.x+1)*width/2,y:(1-vector.y)*height/2};
}
function updateMarkers(){
  if(!camera)return;
  const scale=width/viewWidth*camera.zoom;
  planetData.forEach(data=>{
    const position=data.position||{x:data.x,y:0,z:0},point=screenPoint(position.x,position.y,position.z);
    data.screenX=point.x;data.screenY=point.y;
    data.anchor.style.left=point.x+'px';data.anchor.style.top=point.y+'px';data.anchor.style.setProperty('--diameter',data.radius*2*scale+'px');
  });
  const sunPoint=screenPoint(0),label=document.querySelector('#sun-label');
  label.style.left=sunPoint.x+'px';label.style.top=sunPoint.y+8.1*scale+19+'px';
}
function resize(){
  positionFallback();sizeStars();
  if(!renderer||!camera)return;
  const viewHeight=viewWidth*height/width;
  camera.left=-viewWidth/2;camera.right=viewWidth/2;camera.top=viewHeight/2;camera.bottom=-viewHeight/2;camera.updateProjectionMatrix();
  renderer.setSize(width,height,false);updateMarkers();renderer.render(scene,camera);
}
window.addEventListener('resize',resize,{passive:true});
resize();

function applyCamera(center,zoom=1,centerZ=0){
  camera.zoom=zoom;camera.position.set(center+cameraOffsetX,23+cameraOffsetY,82+centerZ);
  camera.lookAt(center,0,centerZ);camera.updateProjectionMatrix();
}
function glowTexture(){
  const canvas=document.createElement('canvas');canvas.width=canvas.height=256;
  const context=canvas.getContext('2d'),gradient=context.createRadialGradient(128,128,10,128,128,128);
  gradient.addColorStop(0,'rgba(255,211,138,.8)');gradient.addColorStop(.21,'rgba(255,174,75,.3)');gradient.addColorStop(.46,'rgba(219,120,44,.11)');gradient.addColorStop(1,'rgba(149,73,28,0)');
  context.fillStyle=gradient;context.fillRect(0,0,256,256);
  const texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;return texture;
}
function atmosphere(radius,color,intensity){
  const material=new THREE.ShaderMaterial({
    uniforms:{glowColor:{value:new THREE.Color(color)},strength:{value:intensity}},
    vertexShader:'varying vec3 vNormal;varying vec3 vPosition;void main(){vNormal=normalize(normalMatrix*normal);vec4 p=modelViewMatrix*vec4(position,1.0);vPosition=p.xyz;gl_Position=projectionMatrix*p;}',
    fragmentShader:'varying vec3 vNormal;varying vec3 vPosition;uniform vec3 glowColor;uniform float strength;void main(){float rim=pow(1.0-abs(dot(normalize(vNormal),normalize(-vPosition))),3.0);gl_FragColor=vec4(glowColor,rim*strength);}',
    side:THREE.BackSide,transparent:true,depthWrite:false,blending:THREE.AdditiveBlending
  });
  return new THREE.Mesh(new THREE.SphereGeometry(radius*1.045,48,32),material);
}
async function buildScene(){
  THREE=await import('./vendor/three.module.js');
  renderer=new THREE.WebGLRenderer({alpha:true,antialias:true,powerPreference:'high-performance'});
  renderer.setPixelRatio(Math.min(devicePixelRatio||1,1.6));renderer.setSize(width,height,false);
  renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.2;
  renderer.setClearColor(0x000000,0);renderer.domElement.className='gl-solar';renderer.domElement.setAttribute('aria-hidden','true');stage.prepend(renderer.domElement);
  scene=new THREE.Scene();
  const viewHeight=viewWidth*height/width;
  camera=new THREE.OrthographicCamera(-viewWidth/2,viewWidth/2,viewHeight/2,-viewHeight/2,.1,500);applyCamera(viewCenter);
  scene.add(new THREE.AmbientLight(0x9fb6d6,.32));
  const sunlight=new THREE.PointLight(0xffe3bc,3.3,0,0);sunlight.position.set(0,0,0);scene.add(sunlight);
  const loader=new THREE.TextureLoader();
  const mainTextures=await Promise.all(['sun',...planetData.map(data=>data.id)].map(async id=>{const texture=await loader.loadAsync(textureRoot+id+'.webp');texture.colorSpace=THREE.SRGBColorSpace;texture.anisotropy=Math.min(8,renderer.capabilities.getMaxAnisotropy());return [id,texture]}));
  const textures=Object.fromEntries(mainTextures);
  const extras=await Promise.allSettled(['earth-clouds.webp','earth-normal.webp','saturn-ring.png'].map(file=>loader.loadAsync(textureRoot+file)));
  const cloudTexture=extras[0].status==='fulfilled'?extras[0].value:null,normalTexture=extras[1].status==='fulfilled'?extras[1].value:null,ringTexture=extras[2].status==='fulfilled'?extras[2].value:null;
  sunModel=new THREE.Mesh(new THREE.SphereGeometry(8.1,96,64),new THREE.MeshBasicMaterial({map:textures.sun,toneMapped:false}));scene.add(sunModel);
  const glow=new THREE.Sprite(new THREE.SpriteMaterial({map:glowTexture(),color:0xffb66b,transparent:true,blending:THREE.AdditiveBlending,depthWrite:false,opacity:.64}));
  glow.scale.set(43,43,1);glow.position.set(0,0,-1);scene.add(glow);
  planetData.forEach((data,index)=>{
    const system=new THREE.Group();system.position.x=data.x;system.rotation.z=THREE.MathUtils.degToRad(data.tilt);data.position=system.position;
    const material=new THREE.MeshStandardMaterial({map:textures[data.id],roughness:.97,metalness:0});
    if(data.id==='earth'&&normalTexture){material.normalMap=normalTexture;material.normalScale=new THREE.Vector2(.55,.55)}
    const sphere=new THREE.Mesh(new THREE.SphereGeometry(data.radius,index>3?96:72,index>3?64:48),material);sphere.rotation.y=data.id==='earth'?2.6:.45;system.add(sphere);
    if(data.id==='earth'){
      system.add(atmosphere(data.radius,0x719bcd,.25));
      if(cloudTexture){clouds=new THREE.Mesh(new THREE.SphereGeometry(data.radius*1.012,64,48),new THREE.MeshStandardMaterial({color:0xffffff,alphaMap:cloudTexture,transparent:true,opacity:.55,roughness:1,depthWrite:false}));clouds.rotation.y=sphere.rotation.y;system.add(clouds)}
    }
    if(data.id==='venus')system.add(atmosphere(data.radius,0xe0bc85,.12));
    if(data.id==='uranus')system.add(atmosphere(data.radius,0x8fd9df,.1));
    if(data.id==='neptune')system.add(atmosphere(data.radius,0x4b70d2,.13));
    if(data.id==='saturn'){
      const inner=data.radius*1.24,outer=data.radius*2.23,geometry=new THREE.RingGeometry(inner,outer,192);
      const positions=geometry.attributes.position,uv=geometry.attributes.uv;
      for(let i=0;i<positions.count;i++){const radius=Math.sqrt(positions.getX(i)**2+positions.getY(i)**2);uv.setXY(i,(radius-inner)/(outer-inner),.5)}
      const ringMaterial=new THREE.MeshStandardMaterial({map:ringTexture,color:ringTexture?0xffffff:0xb0a18a,side:THREE.DoubleSide,transparent:true,opacity:.94,roughness:1,depthWrite:false});
      if(ringTexture)ringTexture.colorSpace=THREE.SRGBColorSpace;
      const ring=new THREE.Mesh(geometry,ringMaterial);ring.rotation.x=-Math.PI/2;system.add(ring);
    }
    scene.add(system);models.push({data,sphere,system});
    const vertices=[];
    for(let i=0;i<=90;i++){const angle=-.54+i/90*1.08;vertices.push(data.x*Math.cos(angle),-.015,data.x*Math.sin(angle))}
    const path=new THREE.Line(new THREE.BufferGeometry().setAttribute('position',new THREE.Float32BufferAttribute(vertices,3)),new THREE.LineBasicMaterial({color:0x58758e,transparent:true,opacity:.2,depthWrite:false}));
    scene.add(path);
  });
  const highlightMaterial=new THREE.MeshBasicMaterial({color:0xe4c7a0,transparent:true,opacity:.35,side:THREE.DoubleSide,depthWrite:false});
  highlight=new THREE.Mesh(new THREE.RingGeometry(1,1.009,100),highlightMaterial);highlight.visible=false;scene.add(highlight);
  webglReady=true;root.classList.add('is-webgl-ready');updateMarkers();renderer.render(scene,camera);
}
buildScene().catch(()=>{root.classList.add('is-image-scene');if(renderer){renderer.domElement.remove();renderer.dispose();renderer=null}});
function resetTravel(){
  clearTimeout(navigationTimer);travelling=false;flight=null;document.body.classList.remove('is-travelling');
  if(camera){cameraOffsetX=cameraOffsetY=0;applyCamera(viewCenter);updateMarkers();renderer?.render(scene,camera)}
  lastTime=performance.now();
}
window.addEventListener('pageshow',resetTravel);
document.querySelectorAll('a[data-planet]').forEach(link=>{
  const data=planetData.find(planet=>planet.id===link.dataset.planet);
  link.addEventListener('pointerenter',()=>{if(!finePointer.matches)return;data.frozen=true;if(!webglReady||travelling)return;highlightedData=data;highlight.position.copy(data.position);highlight.scale.setScalar(data.radius*1.18);highlight.quaternion.copy(camera.quaternion);highlight.visible=true});
  link.addEventListener('pointerleave',()=>{if(document.activeElement!==link)data.frozen=false;highlightedData=null;if(highlight)highlight.visible=false});
  link.addEventListener('focus',()=>{data.frozen=true;if(!webglReady||travelling)return;highlightedData=data;highlight.position.copy(data.position);highlight.scale.setScalar(data.radius*1.18);highlight.quaternion.copy(camera.quaternion);highlight.visible=true});
  link.addEventListener('blur',()=>{data.frozen=false;highlightedData=null;if(highlight)highlight.visible=false});
  link.addEventListener('click',event=>{
    if(event.defaultPrevented||event.button!==0||event.metaKey||event.ctrlKey||event.shiftKey||event.altKey||reducedMotion.matches)return;
    event.preventDefault();if(travelling)return;travelling=true;if(highlight)highlight.visible=false;
    const destination=clamp(data.screenX-scroller.clientWidth/2,0,width-scroller.clientWidth);
    const desiredNdc=(destination+scroller.clientWidth/2)/width*2-1;
    const zoom=clamp(10/data.radius,2.7,9);
    const position=data.position||{x:data.x,z:0};
    flight={start:performance.now(),fromScroll:scroller.scrollLeft,toScroll:destination,toCenter:position.x-desiredNdc*viewWidth/(2*zoom),toZ:position.z,zoom};
    document.querySelector('#travel-name').textContent=data.world;document.body.classList.add('is-travelling');
    navigationTimer=setTimeout(()=>location.assign(link.href),680);
  });
});
window.addEventListener('pointermove',event=>{
  if(!finePointer.matches||reducedMotion.matches||innerWidth<=1120||travelling||event.pointerType==='touch')return;
  pointerX=(event.clientX/innerWidth-.5)*.7;pointerY=(event.clientY/innerHeight-.5)*.5;
},{passive:true});
document.documentElement.addEventListener('pointerleave',()=>{pointerX=pointerY=0});
reducedMotion.addEventListener('change',event=>{paused=event.matches;updatePause();if(event.matches){pointerX=pointerY=0}});
function animate(time){
  const delta=Math.min((time-lastTime)/1000,.05);lastTime=time;
  if(webglReady&&!document.hidden){
    if(!paused&&!reducedMotion.matches&&!travelling){models.forEach(model=>{const data=model.data;model.sphere.rotation.y+=data.spin*delta;if(!data.frozen){data.orbitAngle+=data.orbitRate*delta;model.system.position.set(data.x*Math.cos(data.orbitAngle),0,data.x*Math.sin(data.orbitAngle))}});if(clouds)clouds.rotation.y+=.069*delta;sunModel.rotation.y+=.009*delta}
    if(flight){
      const progress=clamp((time-flight.start)/640,0,1),amount=ease(progress);
      scroller.scrollLeft=lerp(flight.fromScroll,flight.toScroll,ease(clamp(progress*2.5,0,1)));
      cameraOffsetX=cameraOffsetY=0;applyCamera(lerp(viewCenter,flight.toCenter,amount),lerp(1,flight.zoom,amount),lerp(0,flight.toZ,amount));
    }else if(!reducedMotion.matches){cameraOffsetX=lerp(cameraOffsetX,pointerX,.035);cameraOffsetY=lerp(cameraOffsetY,pointerY,.035);applyCamera(viewCenter)}
    if(highlight?.visible&&highlightedData){highlight.position.copy(highlightedData.position);highlight.quaternion.copy(camera.quaternion)}
    if(time-lastFrame>25||flight){updateMarkers();renderer.render(scene,camera);lastFrame=time}
  }else if(flight){const progress=clamp((time-flight.start)/640,0,1);scroller.scrollLeft=lerp(flight.fromScroll,flight.toScroll,ease(progress))}
  requestAnimationFrame(animate);
}
requestAnimationFrame(animate);
window.SolarSystem={get ready(){return webglReady},get order(){return planetData.map(data=>data.id)},get camera(){return camera},get scene(){return scene},get renderer(){return renderer},get planets(){return models},get paused(){return paused}};

