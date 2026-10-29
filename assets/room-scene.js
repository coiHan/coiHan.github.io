import * as THREE from './vendor/three.module.js';

// This little room is built entirely from code: no borrowed models or textures.
export async function createRoom({ canvas, onReady = () => {}, onOpen = () => {}, onHover = () => {}, onProgress = () => {}, furniture = 'walnut' }) {
  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 1.7));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.12;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.VSMShadowMap;
  const scene = new THREE.Scene();
  scene.background = new THREE.Color('#e7e4dd');
  scene.fog = new THREE.Fog('#e7e4dd', 24, 62);
  const camera = new THREE.PerspectiveCamera(35, 1, .1, 90);
  const cameraTarget = new THREE.Vector3(0, 2.12, .1);
  const room = new THREE.Group();
  scene.add(room);
  const clickTargets = [];
  const texturePool = [];
  const disposed = { value: false };
  let entered = false;
  let tween = null;
  let hover = null;
  let pointerDown = null;
  let nightTarget = 0;
  let nightMix = 0;
  let frame = 0;
  let lastTime = 0;
  let activeRequested = true;
  let startedAt = performance.now();
  const pointer = new THREE.Vector2(0, 0);
  const raycaster = new THREE.Raycaster();
  const lookTarget = new THREE.Vector3();
  const orbitSpherical = new THREE.Spherical();
  const orbitOffset = new THREE.Vector3();

  const material = (color, roughness = .8, extra = {}) => new THREE.MeshStandardMaterial({ color, roughness, ...extra });
  const mats = {
    cream: material('#d7d1bc', .74),
    light: material('#eee9d9', .67),
    edge: material('#b6b09e', .83),
    dark: material('#313633', .83),
    black: material('#1e2627', .62),
    screenRim: material('#53605a', .67),
    wood: material('#856749', .87),
    woodEdge: material('#73563c', .82),
    metal: material('#6b716c', .56, { metalness: .3 }),
    brass: material('#a28f62', .6, { metalness: .4 }),
    sage: material('#718578', .91),
    paper: material('#ece7d9', .98),
    rust: material('#a16f50', .95),
    teal: material('#527575', .85),
    green: material('#51664b', .95),
    lightGreen: material('#81916a', .95),
    soil: material('#4b4436', 1),
    cup: material('#eee8d8', .39),
    coffee: material('#493a2c', .21),
  };

  function mesh(geometry, mat, parent = room, shadows = true) {
    const m = new THREE.Mesh(geometry, mat);
    m.castShadow = shadows;
    m.receiveShadow = shadows;
    parent.add(m);
    return m;
  }
  function roundedShape(w, h, r) {
    const x = -w / 2, y = -h / 2;
    const s = new THREE.Shape();
    s.moveTo(x + r, y);
    s.lineTo(x + w - r, y); s.quadraticCurveTo(x + w, y, x + w, y + r);
    s.lineTo(x + w, y + h - r); s.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    s.lineTo(x + r, y + h); s.quadraticCurveTo(x, y + h, x, y + h - r);
    s.lineTo(x, y + r); s.quadraticCurveTo(x, y, x + r, y);
    return s;
  }
  function roundedBox(w, h, d, r = .035, mat = mats.light, parent = room) {
    r = Math.min(r, w * .2, h * .2, d * .4);
    const g = new THREE.ExtrudeGeometry(roundedShape(w - r * 2, h - r * 2, r), {
      depth: Math.max(.001, d - r * 2), bevelEnabled: true, bevelThickness: r,
      bevelSize: r, bevelSegments: 2, curveSegments: 4, steps: 1,
    });
    g.translate(0, 0, -d / 2 + r);
    g.computeVertexNormals();
    return mesh(g, mat, parent);
  }
  function box(w, h, d, pos, mat, parent = room, radius = .025) {
    const m = roundedBox(w, h, d, radius, mat, parent);
    m.position.set(...pos);
    return m;
  }
  function cylinder(top, bottom, height, pos, mat, parent = room, segments = 32) {
    const m = mesh(new THREE.CylinderGeometry(top, bottom, height, segments), mat, parent);
    m.position.set(...pos);
    return m;
  }
  function sphere(radius, pos, mat, parent = room, scale = [1, 1, 1]) {
    const m = mesh(new THREE.SphereGeometry(radius, 24, 16), mat, parent);
    m.position.set(...pos); m.scale.set(...scale); return m;
  }
  function lineTube(points, radius, mat, parent = room) {
    const curve = new THREE.CatmullRomCurve3(points.map(p => new THREE.Vector3(...p)));
    return mesh(new THREE.TubeGeometry(curve, 38, radius, 7, false), mat, parent);
  }
  // Explicit Bezier handles keep cables inside their planned clearances.
  // Interpolating a sparse route can dip through the tabletop or floor.
  function cable(name, segments, radius, mat) {
    const path = new THREE.CurvePath();
    for (const points of segments) path.add(new THREE.CubicBezierCurve3(...points.map(p => new THREE.Vector3(...p))));
    const cord = mesh(new THREE.TubeGeometry(path, 96, radius, 8, false), mat);
    cord.name = name;
    return cord;
  }
  function clickable(object, appId, label) {
    object.userData.appId = appId; object.userData.label = label;
    clickTargets.push(object); return object;
  }
  function canvasTexture(w, h, paint) {
    const el = document.createElement('canvas'); el.width = w; el.height = h;
    const ctx = el.getContext('2d'); paint(ctx, w, h);
    const t = new THREE.CanvasTexture(el);
    t.colorSpace = THREE.SRGBColorSpace;
    t.anisotropy = Math.min(4, renderer.capabilities.getMaxAnisotropy());
    texturePool.push(t); return t;
  }
  function labelTexture(text, color = '#444d43', bg = '#e6e2d5', size = 32) {
    return canvasTexture(512, 128, (ctx, w, h) => {
      ctx.fillStyle = bg; ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = color; ctx.font = `500 ${size}px monospace`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText(text, w / 2, h / 2);
    });
  }
  function label(w, h, pos, texture, parent = room) {
    const m = mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ map: texture, toneMapped: false }), parent, false);
    m.position.set(...pos); return m;
  }
  onProgress(.08);

  // A quiet seamless floor and a broad contact shadow ground the miniature.
  const floor = mesh(new THREE.PlaneGeometry(180, 180), material('#d6d3cb', .99));
  floor.rotation.x = -Math.PI / 2; floor.position.y = -.035;
  const contact = canvasTexture(256, 256, (ctx, w, h) => {
    const g = ctx.createRadialGradient(w/2,h/2,0,w/2,h/2,w/2);
    g.addColorStop(0, 'rgba(56,49,39,.22)'); g.addColorStop(.42,'rgba(56,49,39,.13)'); g.addColorStop(1, 'rgba(56,49,39,0)');
    ctx.fillStyle = g; ctx.fillRect(0,0,w,h);
  });
  const contactPlane = mesh(new THREE.PlaneGeometry(12, 10), new THREE.MeshBasicMaterial({ map: contact, transparent: true, depthWrite: false, toneMapped: false }), room, false);
  contactPlane.rotation.x = -Math.PI/2; contactPlane.position.set(0,.005,.5);

  const hemi = new THREE.HemisphereLight('#fff9e8', '#9c978b', 1.55);
  scene.add(hemi);
  const key = new THREE.DirectionalLight('#fff4dd', 2.4);
  key.position.set(-5, 10, 7); key.castShadow = true;
  key.shadow.mapSize.set(1024, 1024);
  key.shadow.camera.left = -9; key.shadow.camera.right = 9;
  key.shadow.camera.top = 8; key.shadow.camera.bottom = -8;
  key.shadow.normalBias = .035; key.shadow.bias = -.00015; key.shadow.radius = 3.5; key.shadow.blurSamples = 8;
  scene.add(key);
  const fill = new THREE.DirectionalLight('#dce6eb', .65);
  fill.position.set(5, 6, -4); scene.add(fill);

  // Furniture is a separate little collection: the desktop stays at the same
  // height so the personal objects and the computer never jump between editions.
  const furnitureRoot = new THREE.Group(); room.add(furnitureRoot);
  const furnitureGroups = new Map();
  const walnutWood = material('#9a7855', .84);
  const walnutEdge = material('#89694a', .86);
  const oakWood = material('#c9b591', .89);
  const oakEdge = material('#b5a380', .9);
  const ivoryTop = material('#e8e5d9', .65);
  const chrome = material('#a3aaa7', .3, { metalness: .6 });
  const creamFabric = material('#d8d2bc', .99);
  const sageFabric = material('#7e8c76', .97);
  const saddleLeather = material('#555249', .77);
  function woodGrain(base, ink) {
    return canvasTexture(1024, 256, (ctx,w,h) => {
      ctx.fillStyle = base; ctx.fillRect(0,0,w,h);
      for (let i=0;i<96;i++) {
        ctx.strokeStyle = ink;ctx.globalAlpha=.035+(i%6)*.008;
        ctx.lineWidth=.55+(i%4)*.3;ctx.beginPath();ctx.moveTo(0,i*h/96);
        for(let x=0;x<=w;x+=48)ctx.lineTo(x,i*h/96+Math.sin(x*.004+i*1.7)*1.7);
        ctx.stroke();
      }
      ctx.globalAlpha=1;
    });
  }
  const walnutTop=material('#ffffff',.84,{map:woodGrain('#b09371','#685039')});
  const oakTop=material('#ffffff',.88,{map:woodGrain('#cdbb99','#8e7e63')});
  function strut(from,to,r,mat,parent,rBottom=r) {
    const a=new THREE.Vector3(...from),b=new THREE.Vector3(...to),delta=b.clone().sub(a);
    const part=mesh(new THREE.CylinderGeometry(r,rBottom,delta.length(),20),mat,parent);
    part.position.copy(a.add(b).multiplyScalar(.5));
    part.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),delta.normalize());
    return part;
  }
  function curvedBack(w,h,d,pos,mat,parent,curve=-.16) {
    const m=box(w,h,d,pos,mat,parent,.09),a=m.geometry.attributes.position;
    for(let i=0;i<a.count;i++) {const x=a.getX(i)/(w/2);a.setZ(i,a.getZ(i)+curve*x*x);}
    m.geometry.computeVertexNormals();m.rotation.x=-.1;return m;
  }
  function furnitureGroup(id) {const group=new THREE.Group();group.name='furniture-'+id;furnitureRoot.add(group);furnitureGroups.set(id,group);return group;}
  function chairGroup(parent,rotation=-.2){const c=new THREE.Group();c.position.set(2.22,0,2.72);c.rotation.y=rotation;parent.add(c);return c;}

  // The original swivel-chair silhouette, now with tailored upholstery,
  // a gas-lift column and proper paired rubber casters.
  function makeOfficeChair(parent) {
    const c=new THREE.Group();c.position.set(2.45,0,2.75);c.rotation.y=-.24;parent.add(c);
    const fabric=material('#a27354',.99);
    const seatBase=material('#50483f',.85);
    const post=material('#8c928d',.4,{metalness:.48});
    const seam=canvasTexture(512,512,(ctx,w,h)=>{
      ctx.clearRect(0,0,w,h);ctx.strokeStyle='rgba(227,192,155,.52)';ctx.lineWidth=2.2;ctx.setLineDash([6,5]);
      ctx.beginPath();ctx.roundRect(20,20,w-40,h-40,34);ctx.stroke();
    });
    const seamMat=new THREE.MeshStandardMaterial({map:seam,transparent:true,depthWrite:false,roughness:1});
    cylinder(.18,.18,.065,[0,.28,0],mats.metal,c,24);
    cylinder(.12,.15,.3,[0,.46,0],mats.dark,c,24);
    cylinder(.074,.096,1.02,[0,1.05,0],post,c,24);
    cylinder(.1,.115,.24,[0,.71,0],mats.metal,c,24);
    box(.55,.13,.63,[0,1.5,0],seatBase,c,.035);
    for(let i=0;i<5;i++){
      const angle=i*Math.PI*2/5;
      const ex=Math.cos(angle)*.73,ez=Math.sin(angle)*.73;
      strut([0,.3,0],[ex,.19,ez],.062,mats.metal,c,.041);
      const caster=new THREE.Group();caster.position.set(ex,.115,ez);caster.rotation.y=-angle+Math.PI/2;c.add(caster);
      box(.065,.16,.12,[0,.105,0],mats.metal,caster,.012);
      for(const side of [-1,1]){
        const tire=cylinder(.104,.104,.06,[side*.046,0,0],mats.black,caster,24);tire.rotation.z=Math.PI/2;
        const hub=cylinder(.041,.041,.008,[side*.08,0,0],post,caster,20);hub.rotation.z=Math.PI/2;
      }
    }
    const seat=box(1.48,.23,1.45,[0,1.68,0],fabric,c,.09);
    const seatSeam=mesh(new THREE.PlaneGeometry(1.34,1.31),seamMat,seat,false);seatSeam.rotation.x=-Math.PI/2;seatSeam.position.y=.121;
    for(const x of [-.51,.51]){
      lineTube([[x,1.55,.4],[x,2.18,.65],[x,2.95,.65]],.036,mats.metal,c);
      const bolt=cylinder(.032,.032,.035,[x,1.61,.4],post,c,16);bolt.rotation.x=Math.PI/2;
    }
    const back=box(1.4,1.12,.23,[0,2.67,.67],fabric,c,.095);back.rotation.x=-.075;
    const backSeam=mesh(new THREE.PlaneGeometry(1.27,.99),seamMat,back,false);backSeam.position.z=.123;
    // A discreet adjustment lever under the seat.
    lineTube([[.2,1.49,.1],[.62,1.44,.18],[.76,1.44,.18]],.021,mats.metal,c);
    box(.19,.055,.09,[.77,1.44,.18],mats.black,c,.012);
    return c;
  }
  // Edition A: warm walnut, splayed tapered legs and a soft cream lounge chair.
  {
    const g=furnitureGroup('walnut');
    box(7.5,.24,3.65,[0,2.65,0],walnutTop,g,.075);
    box(7.16,.25,3.26,[0,2.42,0],walnutEdge,g,.045);
    for(const x of [-3.12,3.12])for(const z of [-1.27,1.27]) {
      strut([x+Math.sign(x)*.17,.07,z+Math.sign(z)*.15],[x,2.48,z],.135,walnutWood,g,.085);
      cylinder(.09,.09,.045,[x+Math.sign(x)*.17,.035,z+Math.sign(z)*.15],mats.dark,g,20);
    }
    box(1.56,.33,.08,[2.18,2.41,1.67],walnutWood,g,.018);
    box(.48,.035,.06,[2.18,2.41,1.728],mats.brass,g,.005);
    makeOfficeChair(g);
  }
  // Edition B: pale oak and a quiet sculptural sage chair for a bright studio.
  {
    const g=furnitureGroup('atelier');
    box(7.5,.22,3.65,[0,2.65,0],oakTop,g,.06);
    for(const x of [-3.03,3.03]){
      for(const z of [-1.18,1.18])strut([x+Math.sign(x)*.22,.04,z*1.13],[x,2.54,z],.105,oakWood,g,.078);
      box(.16,.18,2.9,[x,.6,0],oakEdge,g,.025);
      box(.18,.3,3.02,[x,2.34,0],oakWood,g,.035);
    }
    box(5.9,.1,.1,[0,.63,-.88],oakEdge,g,.018);
    box(7.0,.14,.12,[0,2.42,-1.48],oakWood,g,.025);
    const c=chairGroup(g,-.28);
    for(const x of [-.47,.47])for(const z of [-.41,.41])strut([x*1.21,.045,z*1.25],[x,1.23,z],.063,oakWood,c,.042);
    box(1.45,.13,1.32,[0,1.26,0],oakWood,c,.06);
    box(1.34,.12,1.22,[0,1.365,-.02],sageFabric,c,.055);
    for(const x of [-.49,.49])strut([x,1.2,.46],[x,2.39,.63],.035,oakWood,c);
    curvedBack(1.42,.71,.13,[0,2.12,.57],sageFabric,c,-.21);
    for(const x of [-.52,.52])lineTube([[x,1.37,-.37],[x*1.13,1.64,-.12],[x*1.13,1.64,.5]],.04,oakWood,c);
  }
  // Edition C: ivory planes and continuous chrome tubing, with a cantilever chair.
  {
    const g=furnitureGroup('bauhaus');
    box(7.5,.19,3.65,[0,2.66,0],ivoryTop,g,.065);
    box(7.24,.06,3.4,[0,2.535,0],chrome,g,.025);
    for(const x of [-3.16,3.16]){
      lineTube([[x,.09,1.34],[x,.09,-1.34],[x,.28,-1.52],[x,2.33,-1.52],[x,2.46,-1.34],[x,2.46,1.34],[x,2.33,1.49],[x,.1,1.49]],.065,chrome,g);
      for(const z of [-1.32,1.32])box(.28,.035,.22,[x,.035,z],mats.dark,g,.008);
    }
    strut([-3.12,2.24,-1.47],[3.12,2.24,-1.47],.05,chrome,g);
    const c=chairGroup(g,-.21);
    for(const x of [-.57,.57]){
      lineTube([[x,.08,.7],[x,.08,-.49],[x,.21,-.65],[x,1.19,-.65],[x,1.3,-.49],[x,1.3,.49],[x,1.5,.65],[x,2.27,.65]],.049,chrome,c);
      lineTube([[x,1.33,-.32],[x,1.64,-.15],[x,1.64,.58]],.043,chrome,c);
    }
    strut([-.57,.08,.7],[.57,.08,.7],.049,chrome,c);
    box(1.27,.15,1.18,[0,1.33,0],saddleLeather,c,.055);
    curvedBack(1.26,.79,.12,[0,2.02,.6],saddleLeather,c,-.11);
    for(const x of [-.57,.57])box(.12,.075,.55,[x,1.67,.11],saddleLeather,c,.025);
  }
  function setFurniture(id) {
    const selected=furnitureGroups.has(id)?id:'walnut';
    for(const [name,group] of furnitureGroups)group.visible=name===selected;
    renderer.shadowMap.needsUpdate=true;
    if(!activeRequested&&!disposed.value)renderer.render(scene,camera);
    else requestRender();
    return selected;
  }
  setFurniture(furniture);
  onProgress(.22);

  // Computer. The monitor is a thick shell, with a softly bulging CRT face.
  const surfaceStart = room.children.length;
  const monitor = new THREE.Group(); monitor.position.set(-.55,0,-.62); room.add(monitor);
  clickable(monitor,'desktop','打开电脑');
  box(2.55,.46,1.87,[0,2.61,.14],mats.cream,monitor,.075);
  box(2.45,.34,.12,[0,2.62,1.095],mats.light,monitor,.025);
  box(.78,.035,.025,[-.57,2.68,1.164],mats.black,monitor,.006);
  box(.7,.105,.025,[.6,2.64,1.163],mats.edge,monitor,.008);
  box(.53,.018,.028,[.6,2.665,1.185],mats.black,monitor,.003);
  const powerLight = new THREE.MeshBasicMaterial({color:'#98c7a6',toneMapped:false});
  sphere(.021,[1.03,2.64,1.171],powerLight,monitor);
  cylinder(.45,.57,.15,[0,2.92,-.03],mats.edge,monitor);
  box(1.03,.15,.89,[0,2.98,-.03],mats.cream,monitor,.05);
  box(2.32,1.87,1.66,[0,4.08,-.37],mats.cream,monitor,.13);
  box(1.95,1.6,.5,[0,4.08,-1.32],mats.cream,monitor,.09);
  // Small side ventilation slots keep the silhouette credible from the wide view.
  for(let i=0;i<8;i++) {
    box(.018,.4,.045,[1.17,4.02,-.96+i*.1],mats.edge,monitor,.003);
  }
  box(2.6,2.14,.32,[0,4.08,.52],mats.light,monitor,.095);
  box(2.29,1.8,.045,[0,4.15,.698],mats.edge,monitor,.075);
  box(2.18,1.67,.045,[0,4.17,.729],mats.screenRim,monitor,.075);
  const screenTexture = canvasTexture(1024, 768, (ctx,w,h) => {
    ctx.fillStyle='#426e6a';ctx.fillRect(0,0,w,h);
    // Pixel desktop wallpaper and a single welcoming window.
    ctx.strokeStyle='rgba(211,228,204,.12)';ctx.lineWidth=1;
    for(let x=0;x<w;x+=24){ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x,h);ctx.stroke();}
    for(let y=0;y<h;y+=24){ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(w,y);ctx.stroke();}
    for(let i=0;i<3;i++) {
      const y=48+i*120;
      ctx.fillStyle='#d9d3ba';ctx.fillRect(42,y,53,42);ctx.fillRect(42,y-9,25,12);
      ctx.fillStyle='#f1ecdd';ctx.font='18px monospace';ctx.textAlign='center';
      ctx.fillText(['About','Projects','Photos'][i],69,y+68);
    }
    ctx.fillStyle='#203e3c';ctx.fillRect(186,183,670,381);
    ctx.fillStyle='#dfddcd';ctx.fillRect(178,175,670,381);
    ctx.fillStyle='#2c4d49';ctx.fillRect(184,181,658,35);
    ctx.fillStyle='#f3efe0';ctx.font='19px monospace';ctx.textAlign='left';ctx.fillText('Welcome to coiHan OS',198,206);
    ctx.fillStyle='#b8b6aa';ctx.fillRect(807,188,24,22);ctx.fillStyle='#34443f';ctx.fillText('×',811,206);
    ctx.fillStyle='#34453e';ctx.textAlign='center';ctx.font='bold 61px Georgia';ctx.fillText('coiHan.',513,341);
    ctx.font='22px monospace';ctx.fillText('A little curiosity.',513,398);ctx.fillText('A whole world to explore.',513,434);
    ctx.fillStyle='#bdbbaa';ctx.fillRect(404,470,218,43);ctx.strokeStyle='#f8f5e8';ctx.strokeRect(404,470,218,43);
    ctx.fillStyle='#34453e';ctx.font='bold 21px monospace';ctx.fillText('COME ON IN  →',513,498);
    ctx.fillStyle='#c9c8b8';ctx.fillRect(0,h-43,w,43);ctx.fillStyle='#31463d';ctx.font='bold 22px monospace';ctx.textAlign='left';
    ctx.fillText('▦ start',18,h-14);ctx.font='19px monospace';ctx.textAlign='right';ctx.fillText('coiHan OS  ·  01',w-18,h-15);
    const shade=ctx.createRadialGradient(w/2,h/2,h*.1,w/2,h/2,w*.65);
    shade.addColorStop(0,'rgba(0,0,0,0)');shade.addColorStop(1,'rgba(15,30,24,.21)');ctx.fillStyle=shade;ctx.fillRect(0,0,w,h);
    ctx.fillStyle='rgba(15,28,20,.045)';for(let y=0;y<h;y+=4)ctx.fillRect(0,y,w,1);
  });
  const screenWidth = 2.065, screenHeight = 1.55;
  const screenGeometry = new THREE.PlaneGeometry(screenWidth,screenHeight,28,24);
  const positions=screenGeometry.attributes.position;
  for(let i=0;i<positions.count;i++) {
    const x=positions.getX(i)/(screenWidth/2),y=positions.getY(i)/(screenHeight/2);
    positions.setZ(i,.035*(1-x*x)*(1-y*y));
  }
  screenGeometry.computeVertexNormals();
  const screen = mesh(screenGeometry,new THREE.MeshBasicMaterial({map:screenTexture,toneMapped:false}),monitor,false);
  screen.position.set(0,4.17,.757);
  box(.57,.1,.008,[-.57,3.215,.692],mats.cream,monitor,.003);
  label(.55,.085,[-.57,3.217,.7],labelTexture('coiHan', '#596057','#dcd7c5',44),monitor);
  for(let i=0;i<3;i++) {
    const button=cylinder(.034,.034,.028,[.53+i*.17,3.215,.702],mats.cream,monitor,20);
    button.rotation.x=Math.PI/2;
  }
  sphere(.017,[.98,3.215,.701],powerLight,monitor);
  const screenGlow=new THREE.PointLight('#a1d7c1',.14,3,2);screenGlow.position.set(-.55,4.05,.44);scene.add(screenGlow);

  // A 75% keyboard, complete with sculpted key rows.
  const keyboard = new THREE.Group(); keyboard.position.set(-.57,2.45,1.24); keyboard.rotation.x=.075;room.add(keyboard);
  clickable(keyboard,'desktop','坐下来，打开电脑');
  box(2.75,.16,.96,[0,0,0],mats.cream,keyboard,.045);
  box(2.64,.025,.86,[0,.09,0],mats.edge,keyboard,.025);
  const keyLabels=[];
  const rows=['1234567890-=','QWERTYUIOP[]','ASDFGHJKL;','ZXCVBNM,.'];
  const keyTopTexture=canvasTexture(768,256,(ctx,w,h)=>{
    ctx.clearRect(0,0,w,h);ctx.fillStyle='#5b5c4f';ctx.font='38px monospace';ctx.textAlign='center';ctx.textBaseline='middle';
    for(let i=0;i<36;i++) ctx.fillText('1234567890QWERTYUIOPASDFGHJKLZXCVBNM'[i]||'·',(i%12)*64+32,Math.floor(i/12)*80+40);
  });
  rows.forEach((row,r)=>{
    for(let c=0;c<12;c++){
      const x=-1.18+c*.212,z=-.31+r*.18;
      const k=box(.184,.09,.15,[x,.145,z],(r===0&&c===0)?mats.sage:mats.light,keyboard,.012);
      if(c<row.length && r<3) {
        const t=keyTopTexture.clone();t.repeat.set(1/12,80/256);t.offset.set(c/12,1-(r+1)*80/256);t.needsUpdate=true;texturePool.push(t);
        const p=label(.14,.12,[x,.194,z],t,keyboard);p.rotation.x=-Math.PI/2;
        p.material.transparent=true;
      }
      keyLabels.push(k);
    }
  });
  box(1.17,.09,.13,[-.12,.145,.41],mats.light,keyboard,.012);
  for(const x of [-1.1,-.88,.68,.91,1.14])box(.18,.09,.13,[x,.145,.41],mats.light,keyboard,.012);
  const mouse = new THREE.Group();mouse.position.set(1.29,2.44,1.1);mouse.rotation.y=-.14;room.add(mouse);
  box(.76,.018,.95,[0,-.055,.02],mats.sage,mouse,.015);
  const mouseBody=sphere(.27,[0,.04,0],mats.light,mouse,[.8,.5,1.22]);
  box(.012,.013,.25,[0,.172,-.12],mats.edge,mouse,.003);
  cylinder(.024,.024,.075,[0,.175,-.11],mats.dark,mouse,12).rotation.x=Math.PI/2;
  // A molded black power lead connects the CRT to the rear of its desktop base.
  // Peripheral cables are omitted to keep the miniature's silhouette quiet.
  box(.18,.16,.025,[.4,3.62,-1.584],mats.black,monitor,.012);
  box(.13,.11,.14,[.4,3.62,-1.655],mats.dark,monitor,.018);
  box(.14,.17,.025,[.03,2.59,-.803],mats.black,monitor,.009);
  box(.095,.11,.13,[.03,2.59,-.87],mats.dark,monitor,.014);
  onProgress(.48);

  // A few personal objects. Each is also a real navigation target.
  const books = new THREE.Group();books.position.set(-2.65,2.43,-.48);books.rotation.y=-.12;room.add(books);
  clickable(books,'about','翻开个人档案');
  function book(w,d,h,y,cover,title,rotation=0){
    const g=new THREE.Group();g.position.y=y;g.rotation.y=rotation;books.add(g);
    box(w,.035,d,[0,0,0],cover,g,.012);box(w-.04,h,d-.035,[.01,h/2+.018,0],mats.paper,g,.008);box(w,.035,d,[0,h+.035,0],cover,g,.012);
    box(.045,h+.07,d,[-w/2+.01,h/2+.02,0],cover,g,.009);
    for(let i=0;i<4;i++)box(w-.1,.005,.002,[.015,.04+i*h/5,d/2-.012],mats.edge,g,.001);
    const titleLabel=label(w*.75,.11,[0,h+.057,.05],labelTexture(title,'#d5d2bf',cover.color.getStyle(),30),g);titleLabel.rotation.x=-Math.PI/2;
  }
  book(1.25,1.62,.22,0,mats.sage,'QUESTIONS',-.03);
  book(1.2,1.55,.17,.3,mats.rust,'PHILOSOPHY',.09);
  book(1.3,1.6,.12,.55,mats.cream,'FIELD NOTES',-.04);
  const notebook=box(.9,.055,.58,[-2.5,2.42,1.0],mats.paper,room,.007);notebook.rotation.y=.19;clickable(notebook,'about','关于这个正在学习的人');
  const pageNotes=canvasTexture(512,320,(ctx,w,h)=>{
    ctx.fillStyle='#e8e2d2';ctx.fillRect(0,0,w,h);ctx.fillStyle='#5b6657';ctx.font='25px monospace';ctx.fillText('A LITTLE CURIOSITY.',28,56);
    ctx.font='20px monospace';ctx.fillText('perception → action',28,112);ctx.fillText('         ↑ feedback',28,148);
    ctx.strokeStyle='#9ba18e';for(let y=194;y<300;y+=30){ctx.beginPath();ctx.moveTo(28,y);ctx.lineTo(w-28,y);ctx.stroke();}
  });
  const notesLabel=label(.84,.54,[-2.5,2.451,1.0],pageNotes);notesLabel.rotation.set(-Math.PI/2,0,.19);clickable(notesLabel,'about','一页关于我的笔记');
  const pencil=box(.035,.035,.7,[-2.0,2.47,1.02],mats.rust,room,.007);pencil.rotation.y=.22;
  cylinder(.022,0,.1,[-1.92,2.47,1.4],mats.wood,room,8).rotation.x=Math.PI/2;

  const floppy=new THREE.Group();floppy.position.set(.85,2.423,.1);floppy.rotation.y=.13;room.add(floppy);clickable(floppy,'projects','philome · 一张思想软盘');
  box(.65,.065,.7,[0,0,0],mats.teal,floppy,.017);
  box(.29,.012,.25,[0,.039,-.15],mats.metal,floppy,.004);
  box(.12,.014,.19,[.035,.046,-.15],mats.dark,floppy,.003);
  const floppyLabel=label(.49,.25,[0,.042,.16],labelTexture('philome','#3b5148','#e6e1ca',45),floppy);floppyLabel.rotation.x=-Math.PI/2;

  const photo=new THREE.Group();photo.position.set(1.93,2.4,-.9);photo.rotation.y=-.14;photo.rotation.x=-.14;room.add(photo);clickable(photo,'photos','打开生活相册');
  box(.86,1.04,.07,[0,.53,0],mats.woodEdge,photo,.035);
  box(.74,.92,.016,[0,.53,.048],mats.paper,photo,.009);
  const photoTexture=canvasTexture(512,640,(ctx,w,h)=>{
    ctx.fillStyle='#b8c8c3';ctx.fillRect(0,0,w,h);
    ctx.fillStyle='#78948d';ctx.beginPath();ctx.moveTo(0,370);ctx.lineTo(140,190);ctx.lineTo(310,350);ctx.lineTo(435,255);ctx.lineTo(512,390);ctx.lineTo(512,640);ctx.lineTo(0,640);ctx.fill();
    ctx.fillStyle='#465e52';ctx.beginPath();ctx.moveTo(0,460);ctx.lineTo(220,320);ctx.lineTo(512,445);ctx.lineTo(512,640);ctx.lineTo(0,640);ctx.fill();
    ctx.fillStyle='#e3d8ab';ctx.beginPath();ctx.arc(356,133,42,0,Math.PI*2);ctx.fill();
    ctx.fillStyle='#a6b28c';ctx.beginPath();ctx.moveTo(0,610);ctx.quadraticCurveTo(200,440,512,600);ctx.lineTo(512,640);ctx.lineTo(0,640);ctx.fill();
  });
  label(.65,.75,[0,.58,.06],photoTexture,photo);
  label(.65,.08,[0,.145,.061],labelTexture('little moments','#626c60','#e8e5d8',31),photo);
  const photoStand=box(.38,.06,.63,[0,.04,-.19],mats.woodEdge,photo,.015);

  const letter=new THREE.Group();letter.position.set(2.36,2.405,1.04);letter.rotation.y=-.27;room.add(letter);clickable(letter,'contact','留一封信');
  box(.93,.025,.6,[0,0,0],mats.paper,letter,.007);
  const envelopeTexture=canvasTexture(640,400,(ctx,w,h)=>{
    ctx.fillStyle='#e6e0cf';ctx.fillRect(0,0,w,h);ctx.strokeStyle='#c2b9a5';ctx.lineWidth=3;
    ctx.beginPath();ctx.moveTo(0,0);ctx.lineTo(w/2,h*.63);ctx.lineTo(w,0);ctx.moveTo(0,h);ctx.lineTo(w*.32,h*.4);ctx.moveTo(w,h);ctx.lineTo(w*.68,h*.4);ctx.stroke();
    ctx.fillStyle='#83937b';ctx.fillRect(w-105,22,75,86);ctx.strokeStyle='#e6e0cf';ctx.strokeRect(w-97,30,59,70);
    ctx.fillStyle='#5b6858';ctx.font='29px monospace';ctx.fillText('say hello',40,h-45);
  });
  const envelope=label(.91,.59,[0,.014,0],envelopeTexture,letter);envelope.rotation.x=-Math.PI/2;

  // A ceramic pot and individually curved leaves, rather than a single green blob.
  const plant=new THREE.Group();plant.position.set(3.0,2.38,-1.12);room.add(plant);
  cylinder(.36,.29,.64,[0,.32,0],mats.sage,plant,32);
  cylinder(.375,.365,.065,[0,.64,0],mats.sage,plant,32);
  cylinder(.324,.324,.015,[0,.66,0],mats.soil,plant,32);
  function leafShape(length,width){
    const g=new THREE.BufferGeometry(),p=[],uv=[],idx=[];
    for(let i=0;i<=9;i++){
      const t=i/9,ww=Math.sin(Math.PI*t)*width;
      for(let s=-1;s<=1;s+=2){p.push(s*ww,t*length,Math.sin(t*Math.PI)*length*.16+Math.abs(s)*.025);uv.push((s+1)/2,t);}
      if(i<9){const a=i*2;idx.push(a,a+1,a+2,a+1,a+3,a+2);}
    }
    g.setAttribute('position',new THREE.Float32BufferAttribute(p,3));g.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));g.setIndex(idx);g.computeVertexNormals();return g;
  }
  const leafMat=mats.green.clone();leafMat.side=THREE.DoubleSide;
  const lightLeafMat=mats.lightGreen.clone();lightLeafMat.side=THREE.DoubleSide;
  for(let i=0;i<11;i++){
    const a=i*2.399,stemHeight=.4+(i%4)*.17;
    const end=[Math.cos(a)*(.21+(i%3)*.07),.66+stemHeight,Math.sin(a)*(.2+(i%3)*.07)];
    lineTube([[0,.65,0],[end[0]*.4,.86,end[2]*.4],end],.012,mats.green,plant);
    const leaf=mesh(leafShape(.47+(i%3)*.1,.12+(i%2)*.035),i%3===0?lightLeafMat:leafMat,plant);
    leaf.position.set(...end);leaf.rotation.set(-.65-(i%3)*.18,a,.4-Math.sin(a)*.7);
  }
  // Coffee: open rim, dark liquid, curved handle and a tiny saucer.
  const mug=new THREE.Group();mug.position.set(2.6,2.4,-.02);room.add(mug);
  cylinder(.32,.32,.025,[0,0,0],mats.cup,mug,40);
  const cupProfile=[new THREE.Vector2(.16,.025),new THREE.Vector2(.22,.04),new THREE.Vector2(.235,.41),new THREE.Vector2(.22,.44),new THREE.Vector2(.195,.43),new THREE.Vector2(.185,.08)];
  mesh(new THREE.LatheGeometry(cupProfile,40),mats.cup,mug);
  cylinder(.192,.192,.006,[0,.365,0],mats.coffee,mug,32);
  const handle=mesh(new THREE.TorusGeometry(.145,.043,10,24,Math.PI*1.55),mats.cup,mug);handle.rotation.z=-Math.PI*.77;handle.position.set(.26,.245,0);
  // Articulated lamp, both a useful light source and a small silhouette at the edge.
  const lamp=new THREE.Group();lamp.position.set(-3.0,2.4,-1.32);room.add(lamp);
  cylinder(.36,.4,.08,[0,.04,0],mats.sage,lamp,40);
  lineTube([[0,.08,0],[.08,.76,-.06],[.41,1.32,.06],[.67,1.48,.18]],.032,mats.metal,lamp);
  sphere(.075,[.08,.76,-.06],mats.sage,lamp);sphere(.071,[.41,1.32,.06],mats.sage,lamp);
  const shade=cylinder(.14,.35,.26,[.69,1.38,.22],mats.sage,lamp,40);shade.rotation.z=-.24;
  const bulbMat=new THREE.MeshBasicMaterial({color:'#fff0c7',toneMapped:false});
  const bulb=cylinder(.28,.28,.015,[.72,1.265,.22],bulbMat,lamp,32);bulb.rotation.z=-.24;
  const lampLight=new THREE.PointLight('#ffd390',0,6,2);lampLight.position.set(-2.28,3.62,-1.1);scene.add(lampLight);
  // The desk is taller by 0.4; every object and its light follows the surface.
  for(const object of room.children.slice(surfaceStart))object.position.y+=.4;
  screenGlow.position.y+=.4;lampLight.position.y+=.4;
  onProgress(.78);

  // Route from the rear connector tips after all tabletop objects are raised.
  // The short loop clears the CRT shell and never drops below the desktop.
  room.updateMatrixWorld(true);
  const tip = (object, point) => object.localToWorld(new THREE.Vector3(...point)).toArray();
  cable('crt-power-cable',[
    [tip(monitor,[.4,3.62,-1.725]),[-.15,4.02,-2.54],[-.12,3.53,-2.57],[-.22,3.37,-2.4]],
    [[-.22,3.37,-2.4],[-.32,3.21,-2.23],[-.52,2.99,-1.94],tip(monitor,[.03,2.59,-.935])],
  ],.023,mats.dark);

  const homePosition = new THREE.Vector3();
  const homeTarget = new THREE.Vector3(0,2.15,.35);
  const enterPosition = new THREE.Vector3();
  // The fullscreen handoff starts from a complete computer, including the keys.
  // Fit all world-space corners, accounting for the keyboard's nearer depth.
  scene.updateMatrixWorld(true);
  const computerBounds = new THREE.Box3().setFromObject(monitor).union(new THREE.Box3().setFromObject(keyboard));
  const enterTarget = computerBounds.getCenter(new THREE.Vector3());
  const computerCorners = [];
  for(const x of [computerBounds.min.x,computerBounds.max.x])
    for(const y of [computerBounds.min.y,computerBounds.max.y])
      for(const z of [computerBounds.min.z,computerBounds.max.z]) computerCorners.push(new THREE.Vector3(x,y,z));
  function setCameraPresets(){
    const aspect=innerWidth/innerHeight;
    if(aspect<.8){
      homePosition.set(8.05,9.63,21.5);homeTarget.set(0,2.73,.55);camera.fov=46;
    }else if(aspect<1.2){
      homePosition.set(7.0,6.9,12.3);homeTarget.set(0,2.4,.35);camera.fov=40;
    }else{
      homePosition.set(10.44,7.07,13.97);homeTarget.set(0,1.85,.35);camera.fov=35;
    }
    // Pan the home view without changing its angle, so the desk's visible bounds
    // sit around the viewport centre rather than drifting to the right.
    const framingOffset=new THREE.Vector3(homePosition.z-homeTarget.z,0,-(homePosition.x-homeTarget.x));
    framingOffset.normalize().multiplyScalar(aspect<.8?.14:aspect<1.2?.25:.4);
    homePosition.add(framingOffset);homeTarget.add(framingOffset);
    const tangent=Math.tan(THREE.MathUtils.degToRad(camera.fov/2));
    const cameraZ = Math.max(...computerCorners.map(corner => corner.z + Math.max(
      Math.abs(corner.y-enterTarget.y)/(tangent*.84),
      Math.abs(corner.x-enterTarget.x)/(tangent*aspect*.88)
    )));
    enterPosition.set(enterTarget.x,enterTarget.y,cameraZ);
  }
  function resize(){
    if(disposed.value)return;
    renderer.setSize(innerWidth,innerHeight,false);camera.aspect=innerWidth/innerHeight;
    setCameraPresets();camera.updateProjectionMatrix();
    if(!tween){camera.position.copy(entered?enterPosition:homePosition);cameraTarget.copy(entered?enterTarget:homeTarget);camera.lookAt(cameraTarget);}
    if(!activeRequested)renderer.render(scene,camera);
    else requestRender();
  }
  resize();
  let tweenResolve=null;
  function animateTo(isEntered){
    if(disposed.value)return Promise.resolve();
    setActive(true);
    if(tweenResolve)tweenResolve();
    entered=isEntered;
    hover=null;onHover('');
    return new Promise(resolve=>{
      tweenResolve=resolve;
      tween={started:performance.now(),duration:reduceMotion?0:1250,from:camera.position.clone(),to:(isEntered?enterPosition:homePosition).clone(),lookFrom:cameraTarget.clone(),lookTo:(isEntered?enterTarget:homeTarget).clone()};
    });
  }
  function getScreenQuad(){
    camera.updateMatrixWorld();screen.updateWorldMatrix(true,false);
    return [[-screenWidth/2,screenHeight/2,0],[screenWidth/2,screenHeight/2,0],[screenWidth/2,-screenHeight/2,0],[-screenWidth/2,-screenHeight/2,0]]
      .map(([x,y,z])=>new THREE.Vector3(x,y,z).applyMatrix4(screen.matrixWorld).project(camera))
      .map(p=>({x:(p.x+1)*innerWidth/2,y:(1-p.y)*innerHeight/2}));
  }
  function getScreenRect(){
    const corners=getScreenQuad();
    const xs=corners.map(p=>p.x),ys=corners.map(p=>p.y);
    const x=Math.min(...xs),y=Math.min(...ys),width=Math.max(...xs)-x,height=Math.max(...ys)-y;
    return {x,y,width,height,left:x,top:y,right:x+width,bottom:y+height};
  }
  function findHit(event){
    if(entered||tween)return null;
    const rect=canvas.getBoundingClientRect();
    const ndc=new THREE.Vector2((event.clientX-rect.left)/rect.width*2-1,-(event.clientY-rect.top)/rect.height*2+1);
    raycaster.setFromCamera(ndc,camera);
    const hits=raycaster.intersectObjects(clickTargets,true);
    if(!hits.length)return null;
    let obj=hits[0].object;
    while(obj&&!obj.userData.appId)obj=obj.parent;
    return obj;
  }
  function pointerMove(event){
    if(event.pointerType!=='touch'){pointer.x=(event.clientX/innerWidth-.5)*2;pointer.y=(event.clientY/innerHeight-.5)*2;}
    const hit=findHit(event);
    if(hit!==hover){hover=hit;onHover(hit?.userData.label||'');canvas.style.cursor=hit?'pointer':'';}
    requestRender();
  }
  function pointerLeave(){pointer.set(0,0);hover=null;onHover('');canvas.style.cursor='';requestRender();}
  function pointerStart(e){pointerDown={x:e.clientX,y:e.clientY};}
  function pointerEnd(e){
    if(!pointerDown||Math.hypot(pointerDown.x-e.clientX,pointerDown.y-e.clientY)>10){pointerDown=null;return;}
    pointerDown=null;
    const hit=findHit(e);if(hit)onOpen(hit.userData.appId);
  }
  canvas.addEventListener('pointermove',pointerMove);
  canvas.addEventListener('pointerleave',pointerLeave);
  canvas.addEventListener('pointerdown',pointerStart);
  canvas.addEventListener('pointerup',pointerEnd);
  addEventListener('resize',resize);

  const dayColor=new THREE.Color('#e7e4dd'),nightColor=new THREE.Color('#353b3e');
  const dayFloor=new THREE.Color('#d6d3cb'),nightFloor=new THREE.Color('#40413e');
  const dayFill=new THREE.Color('#dce6eb'),nightFill=new THREE.Color('#f3dfc1');
  function render(now){
    if(disposed.value||!activeRequested||document.hidden){frame=0;return;}
    frame=requestAnimationFrame(render);
    const dt=Math.min((now-lastTime)/1000,.05);lastTime=now;
    const hadTween=Boolean(tween);
    nightMix+=(nightTarget-nightMix)*Math.min(1,dt*2.6);
    scene.background.copy(dayColor).lerp(nightColor,nightMix);scene.fog.color.copy(scene.background);
    floor.material.color.copy(dayFloor).lerp(nightFloor,nightMix);
    // A broad warm fill keeps the wood legible at night, while the room itself
    // stays dark and the desk lamp retains its small pool of light.
    hemi.intensity=1.55-nightMix*.85;key.intensity=2.4-nightMix*1.9;fill.intensity=.65-nightMix*.18;
    fill.color.copy(dayFill).lerp(nightFill,nightMix);
    lampLight.intensity=nightMix*6.5;screenGlow.intensity=.14+nightMix*.6;
    bulbMat.color.set(nightMix>.1?'#ffe5ac':'#e3dfcc');
    if(tween){
      const p=tween.duration?Math.min(1,(now-tween.started)/tween.duration):1;
      const e=p<.5?4*p*p*p:1-Math.pow(-2*p+2,3)/2;
      camera.position.lerpVectors(tween.from,tween.to,e);cameraTarget.lerpVectors(tween.lookFrom,tween.lookTo,e);
      if(p===1){tween=null;const done=tweenResolve;tweenResolve=null;done?.();}
    }else if(!entered){
      orbitOffset.copy(homePosition).sub(homeTarget);
      orbitSpherical.setFromVector3(orbitOffset);
      orbitSpherical.theta+=(reduceMotion?0:pointer.x)*THREE.MathUtils.degToRad(10);
      orbitSpherical.phi+=(reduceMotion?0:pointer.y)*THREE.MathUtils.degToRad(3.2);
      orbitSpherical.makeSafe();
      lookTarget.setFromSpherical(orbitSpherical).add(homeTarget);
      camera.position.lerp(lookTarget,1-Math.exp(-dt*4));
      cameraTarget.copy(homeTarget);
    }
    camera.lookAt(cameraTarget);
    renderer.render(scene,camera);
    const orbitMoving=!entered&&!reduceMotion&&camera.position.distanceToSquared(lookTarget)>.00001;
    if(!tween&&!hadTween&&!orbitMoving&&Math.abs(nightTarget-nightMix)<.001){cancelAnimationFrame(frame);frame=0;}
  }
  function requestRender(){
    if(!frame&&activeRequested&&!document.hidden&&!disposed.value){lastTime=performance.now();frame=requestAnimationFrame(render);}
  }
  function setActive(value){
    activeRequested=Boolean(value);
    if(!activeRequested||document.hidden){cancelAnimationFrame(frame);frame=0;return;}
    requestRender();
  }
  function visibilityChanged(){
    if(document.hidden){cancelAnimationFrame(frame);frame=0;}
    else if(activeRequested)setActive(true);
  }
  document.addEventListener('visibilitychange',visibilityChanged);
  renderer.render(scene,camera);
  // Geometry and light positions stay fixed; camera motion needs no shadow redraw.
  renderer.shadowMap.autoUpdate=false;
  onProgress(1);
  requestRender();
  // Let the first frame reach the canvas before the loading curtain disappears.
  await new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)));
  onReady();
  return {
    available:true,
    enter:()=>animateTo(true),
    exit:()=>animateTo(false),
    setNight:(value)=>{nightTarget=value?1:0;requestRender();},
    setActive,
    getScreenRect,
    getScreenQuad,
    setFurniture,
    resize,
    dispose(){
      disposed.value=true;cancelAnimationFrame(frame);tweenResolve?.();
      canvas.removeEventListener('pointermove',pointerMove);canvas.removeEventListener('pointerleave',pointerLeave);
      canvas.removeEventListener('pointerdown',pointerStart);canvas.removeEventListener('pointerup',pointerEnd);removeEventListener('resize',resize);
      document.removeEventListener('visibilitychange',visibilityChanged);
      scene.traverse(obj=>{obj.geometry?.dispose();if(obj.material){for(const m of Array.isArray(obj.material)?obj.material:[obj.material])m.dispose();}});
      texturePool.forEach(t=>t.dispose());renderer.dispose();
    },
  };
}
