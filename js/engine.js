'use strict';
/* 렌더러/카메라/환경맵, 공용 재질(MAT), 캔버스 텍스처, 지오메트리 헬퍼, Kenney 펫 로더 */
/* ================= 기본 셋업 ================= */
const renderer = new THREE.WebGLRenderer({antialias:true});
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.setSize(innerWidth, innerHeight);
renderer.outputEncoding = THREE.sRGBEncoding;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 0.98;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
document.body.appendChild(renderer.domElement);

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x0a0c10);
scene.fog = new THREE.Fog(0x0a0c10, 55, 130);
const camera = new THREE.PerspectiveCamera(55, innerWidth/innerHeight, 0.1, 200);

addEventListener('resize', () => {
  camera.aspect = innerWidth/innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight);
});

/* 금속 반사용 환경맵 (작은 방을 만들어 PMREM으로 굽는다) */
{
  const pmrem = new THREE.PMREMGenerator(renderer);
  const env = new THREE.Scene();
  env.background = new THREE.Color(0x1a1c22);
  const lightBox = (x,y,z,w,h,d,c) => {
    const m = new THREE.Mesh(new THREE.BoxGeometry(w,h,d), new THREE.MeshBasicMaterial({color:c}));
    m.position.set(x,y,z); env.add(m);
  };
  lightBox(0, 8, 0, 6, .5, 6, 0xfff2d9);
  lightBox(-6, 3, -6, .5, 4, 4, 0xffe0a8);
  lightBox(6, 3, 6, .5, 4, 4, 0x9adfd6);
  lightBox(6, 2, -6, 3, 3, .5, 0x8a6a3a);
  scene.environment = pmrem.fromScene(env).texture;
  pmrem.dispose();
}

/* ================= 재질/텍스처 ================= */
const MAT = {
  gold:   new THREE.MeshStandardMaterial({color:0xd9a94a, metalness:.95, roughness:.26}),
  goldLit:new THREE.MeshStandardMaterial({color:0xffd98a, metalness:.4, roughness:.4, emissive:0xffc55e, emissiveIntensity:.9}),
  silver: new THREE.MeshStandardMaterial({color:0xb8bcc4, metalness:.9, roughness:.32}),
  bronze: new THREE.MeshStandardMaterial({color:0xa8763e, metalness:.85, roughness:.35}),
  darkWood: new THREE.MeshStandardMaterial({color:0x2c1f14, roughness:.8}),
  column: new THREE.MeshStandardMaterial({color:0x241a11, roughness:.75}),
  glass:  new THREE.MeshStandardMaterial({color:0x9fd8cf, metalness:0, roughness:.08, transparent:true, opacity:.34, side:THREE.DoubleSide}),
  tealGlass: new THREE.MeshStandardMaterial({color:0x8fe6da, metalness:0, roughness:.12, transparent:true, opacity:.45, side:THREE.DoubleSide}),
  teal:   new THREE.MeshStandardMaterial({color:0x7fded2, emissive:0x3fbfae, emissiveIntensity:.55, roughness:.4}),
  black:  new THREE.MeshStandardMaterial({color:0x1a1c20, roughness:.5}),
  red:    new THREE.MeshStandardMaterial({color:0xe4574f, roughness:.45}),
  ledRed:   new THREE.MeshStandardMaterial({color:0x661515, emissive:0xff3b30, emissiveIntensity:1.2}),
  ledGreen: new THREE.MeshStandardMaterial({color:0x0f4d1e, emissive:0x34d158, emissiveIntensity:1.4}),
  white:  new THREE.MeshStandardMaterial({color:0xf4f2ee, roughness:.7}),
};

function canvasTex(draw, w, h, repX, repY){
  const c = document.createElement('canvas'); c.width = w||512; c.height = h||512;
  draw(c.getContext('2d'), c.width, c.height);
  const t = new THREE.CanvasTexture(c);
  t.encoding = THREE.sRGBEncoding;
  if (repX){ t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(repX, repY||repX); }
  return t;
}
/* 어두운 바닥 + 희미한 균열 라인 */
const floorTex = canvasTex((g,w,h)=>{
  g.fillStyle = '#0b0e14'; g.fillRect(0,0,w,h);
  g.strokeStyle = 'rgba(80,100,115,.10)'; g.lineWidth = 2;
  for (let i=0;i<46;i++){
    g.beginPath();
    let x = Math.random()*w, y = Math.random()*h;
    g.moveTo(x,y);
    const n = 2+(Math.random()*3|0);
    for (let j=0;j<n;j++){ x += (Math.random()-.5)*180; y += (Math.random()-.5)*180; g.lineTo(x,y); }
    g.stroke();
  }
}, 512, 512, 5, 5);
/* 우드 패널 벽 */
const woodTex = canvasTex((g,w,h)=>{
  g.fillStyle = '#5c3f26'; g.fillRect(0,0,w,h);
  for (let x=0;x<w;x+=86){ g.fillStyle='rgba(28,15,5,.6)'; g.fillRect(x,0,4,h); }
  for (let i=0;i<260;i++){
    g.fillStyle = `rgba(${60+Math.random()*40|0},${34+Math.random()*22|0},12,${.06+Math.random()*.1})`;
    g.fillRect(Math.random()*w, Math.random()*h, 3+Math.random()*30, 2+Math.random()*5);
  }
}, 512, 512, 4, 2);
const woodMat = new THREE.MeshStandardMaterial({map:woodTex, roughness:.8});
/* 야경 창문 (12층) */
const cityTex = canvasTex((g,w,h)=>{
  const gr = g.createLinearGradient(0,0,0,h);
  gr.addColorStop(0,'#060a20'); gr.addColorStop(.7,'#12204a'); gr.addColorStop(1,'#1b2f66');
  g.fillStyle = gr; g.fillRect(0,0,w,h);
  for (let i=0;i<700;i++){
    g.fillStyle = Math.random()<.75 ? 'rgba(255,210,120,.85)' : 'rgba(160,220,255,.8)';
    g.fillRect(Math.random()*w, h*.25+Math.random()*h*.75, 2+Math.random()*3, 2+Math.random()*4);
  }
}, 1024, 256);

function textTex(text, px, color){
  return canvasTex((g,w,h)=>{
    g.clearRect(0,0,w,h);
    g.font = `800 ${px}px -apple-system, "Apple SD Gothic Neo", sans-serif`;
    g.textAlign = 'center'; g.textBaseline = 'middle';
    g.fillStyle = color || '#f3ede2';
    g.fillText(text, w/2, h/2);
  }, 2048, 384);
}
function textPlane(text, wWorld, hWorld, color){
  const m = new THREE.Mesh(
    new THREE.PlaneGeometry(wWorld, hWorld),
    new THREE.MeshBasicMaterial({map:textTex(text, 250, color), transparent:true, toneMapped:false})
  );
  return m;
}

/* ================= 유틸 ================= */
function box(w,h,d, mat, x,y,z, parent, shadow){
  const m = new THREE.Mesh(new THREE.BoxGeometry(w,h,d), mat);
  m.position.set(x,y,z);
  if (shadow){ m.castShadow = true; m.receiveShadow = true; }
  (parent||scene).add(m);
  return m;
}
function cyl(rt,rb,h,seg, mat, x,y,z, parent, shadow){
  const m = new THREE.Mesh(new THREE.CylinderGeometry(rt,rb,h,seg||24), mat);
  m.position.set(x,y,z);
  if (shadow){ m.castShadow = true; m.receiveShadow = true; }
  (parent||scene).add(m);
  return m;
}
function sph(r, mat, x,y,z, parent, shadow){
  const m = new THREE.Mesh(new THREE.SphereGeometry(r, 20, 16), mat);
  m.position.set(x,y,z);
  if (shadow) m.castShadow = true;
  (parent||scene).add(m);
  return m;
}

/* ================= 캐릭터 (Kenney Cube Pets, CC0) ================= */
function b64ToBuf(b64){
  const s = atob(b64); const a = new Uint8Array(s.length);
  for (let i=0;i<s.length;i++) a[i] = s.charCodeAt(i);
  return a.buffer;
}
const petLoader = (()=>{
  const mgr = new THREE.LoadingManager();
  mgr.setURLModifier(url => url.includes('colormap') ? 'data:image/png;base64,' + PETS_B64.colormap : url);
  return new THREE.GLTFLoader(mgr);
})();
const petCache = {};
/* 이름의 동물을 지정 높이(월드 단위)로 불러온다. 발이 y=0, 정면 +z */
function makePet(name, height, onReady){
  const g = new THREE.Group();
  const build = src => {
    const m = src.clone(true);
    const bb = new THREE.Box3().setFromObject(m);
    const size = bb.getSize(new THREE.Vector3());
    const s = height / size.y;
    m.scale.setScalar(s);
    m.position.set(-(bb.min.x+bb.max.x)/2*s, -bb.min.y*s, -(bb.min.z+bb.max.z)/2*s);
    m.traverse(o => { if (o.isMesh){ o.castShadow = true; } });
    g.add(m);
    g.userData.depth = size.z*s;
    g.userData.width = size.x*s;
    if (onReady) onReady(g);
  };
  if (petCache[name]) build(petCache[name]);
  else petLoader.parse(b64ToBuf(PETS_B64[name]), '', gl => { petCache[name] = gl.scene; build(gl.scene); },
    e => console.warn('pet load fail', name, e));
  return g;
}
