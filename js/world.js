'use strict';
/* 씬 구성: 로비(1층)+바깥 풍경, 사무실(12층), 전역 조명, 플레이어/마커 */
/* ================= 로비 (1층) ================= */
const lobby = new THREE.Group(); scene.add(lobby);
const W = 26, BACK = -20, FRONT = 22, WALL_H = 16;

{
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(W*2, FRONT-BACK+4),
    new THREE.MeshStandardMaterial({map:floorTex, roughness:.55, metalness:.15}));
  floor.rotation.x = -Math.PI/2; floor.position.z = (FRONT+BACK)/2;
  floor.receiveShadow = true;
  lobby.add(floor);

  // 뒷벽 (중앙에 엘리베이터 개구부)
  box(W-2.3, WALL_H, .6, woodMat, -(W+2.3)/2, WALL_H/2, BACK-.3, lobby);
  box(W-2.3, WALL_H, .6, woodMat,  (W+2.3)/2, WALL_H/2, BACK-.3, lobby);
  box(4.6, WALL_H-4.4, .6, woodMat, 0, 4.4+(WALL_H-4.4)/2, BACK-.3, lobby);
  box(.6, WALL_H, FRONT-BACK, woodMat, -W, WALL_H/2, (FRONT+BACK)/2, lobby);
  box(.6, WALL_H, FRONT-BACK, woodMat,  W, WALL_H/2, (FRONT+BACK)/2, lobby);
  box(W*2, .6, FRONT-BACK+4, MAT.darkWood, 0, WALL_H, (FRONT+BACK)/2, lobby); // 천장

  // 기둥
  for (const x of [-14,-6,6,14]) cyl(1.1,1.2,WALL_H,18, MAT.column, x, WALL_H/2, -13, lobby, true);

  // 벽 로고
  const logo = textPlane('MEOW CORP', 22, 4.1);
  logo.position.set(0, 12.6, BACK+.05); lobby.add(logo);

  // 선반 3단 + 금색 라인 조명 + 유리 난간 + 동물 피규어
  const figPets = ['bunny','chick','pig','penguin','koala','monkey','deer','fox'];
  for (const y of [5.2, 8.0, 10.8]){
    for (const [x0,x1] of [[-24,-3],[3,24]]){
      const cx = (x0+x1)/2, w = x1-x0;
      box(w, .3, 1.8, MAT.darkWood, cx, y, BACK+1.1, lobby);
      box(w, .07, .1, MAT.goldLit, cx, y+.18, BACK+2.02, lobby);       // 금색 라인
      box(w, .8, .05, MAT.glass, cx, y+.75, BACK+2.0, lobby);          // 유리 난간
      for (let x=x0+1.5; x<x1-1; x+=3.2){
        cyl(.03,.03,.85,8, MAT.silver, x, y+.72, BACK+2.0, lobby);     // 난간 지주
        if (Math.random()<.75){
          const fig = makePet(figPets[Math.random()*figPets.length|0], .95);
          fig.position.set(x+ (Math.random()-.5), y+.16, BACK+1.1);
          fig.rotation.y = Math.PI*(-.2+Math.random()*.4);
          lobby.add(fig);
        }
      }
    }
  }

  // 중앙 청록 원형 플랫폼 + 골드 토러스 분수 조형물
  const disc = new THREE.Mesh(new THREE.CircleGeometry(7.5, 48), new THREE.MeshStandardMaterial({
    color:0x6fd9cc, transparent:true, opacity:.35, roughness:.15}));
  disc.rotation.x = -Math.PI/2; disc.position.set(0,.03,-6); lobby.add(disc);
  for (const r of [4.6, 2.7]){
    const ring = new THREE.Mesh(new THREE.RingGeometry(r, r+.22, 48), new THREE.MeshStandardMaterial({
      color:0x3fae9f, transparent:true, opacity:.4}));
    ring.rotation.x = -Math.PI/2; ring.position.set(0,.05,-6); lobby.add(ring);
  }
  cyl(2.0, 2.3, 1.1, 32, MAT.bronze, 0, .55, -6, lobby, true);          // 포디움
  const stack = new THREE.Group(); stack.position.set(0,0,-6); lobby.add(stack);
  const radii = [1.85, 1.6, 1.38, 1.16, .95, .75];
  radii.forEach((r,i)=>{
    const t = new THREE.Mesh(new THREE.TorusGeometry(r, .4, 16, 40), MAT.gold);
    t.rotation.x = Math.PI/2; t.position.y = 1.9 + i*1.05; t.castShadow = true;
    stack.add(t);
  });
  cyl(.1,.1,4.5,10, MAT.silver, 0, WALL_H-2.2, -6, lobby);              // 천장 봉
  lobby.userData.stack = stack;

  // 스피드게이트: 유리 낮은 벽(z=2) + 안내 데스크 + 게이트 날개
  for (const [x0,x1] of [[-W,-2],[2,W]]){
    box(x1-x0, 1.25, .12, MAT.glass, (x0+x1)/2, .68, 2, lobby);
    box(x1-x0, .07, .18, MAT.gold, (x0+x1)/2, 1.33, 2, lobby);
  }
  const wingL = new THREE.Group(), wingR = new THREE.Group();
  wingL.position.set(-2, 0, 2); wingR.position.set(2, 0, 2);
  box(1.85, 1.15, .1, MAT.tealGlass, .95, .68, 0, wingL);
  box(1.85, 1.15, .1, MAT.tealGlass, -.95, .68, 0, wingR);
  lobby.add(wingL, wingR);
  lobby.userData.wings = [wingL, wingR];

  for (const s of [-1,1]){
    const d = new THREE.Group(); d.position.set(s*5.6, 0, 2); lobby.add(d);
    box(3.4, 1.15, 1.5, MAT.silver, 0, .58, 0, d, true);
    box(3.7, .14, 1.7, MAT.gold, 0, 1.22, 0, d, true);
    box(3.2, 1.05, .07, MAT.glass, 0, 1.85, 0, d);
    sph(.1, MAT.red, s*.9, 1.36, .35, d);
    sph(.1, MAT.red, s*1.2, 1.36, .3, d);
    box(.5,.14,.3, MAT.black, s*.3, 1.36, .3, d);
    box(.4,.12,.26, MAT.black, s*1.0, 1.34, -.25, d);
  }
  // 게이트 카드 리더기 (양쪽, LED 빨강 → 태그하면 초록)
  const readerLeds = [];
  for (const s of [-1,1]){
    box(.42, .16, .55, MAT.black, s*2.6, 1.46, 2, lobby, true);
    cyl(.12,.12,.05,12, MAT.gold, s*2.6, 1.56, 2, lobby);
    const led = sph(.06, MAT.ledRed, s*2.6, 1.62, 2.15, lobby);
    readerLeds.push(led);
  }
  lobby.userData.readerLeds = readerLeds;
  // 안내 데스크 직원 (여기서 사원증을 받는다)
  const recep = makePet('bunny', 2.0);
  recep.position.set(-5.6, 0, 1.0); lobby.add(recep);
  // 태그 연출용 카드
  const tagCard = new THREE.Group(); tagCard.position.set(2.6, 2.0, 2.0);
  tagCard.visible = false; lobby.add(tagCard);
  box(.5, .04, .36, MAT.white, 0, 0, 0, tagCard);
  box(.5, .05, .1, MAT.teal, 0, .01, -.12, tagCard);
  lobby.userData.tagCard = tagCard;

  box(6, 1.0, 1.6, woodMat, -11, 2.2, -10, lobby, true);                // 뒤쪽 우드 카운터
  box(6.2, .12, 1.8, MAT.gold, -11, 2.75, -10, lobby, true);
  const counterPet = makePet('koala', 1.1);
  counterPet.position.set(-11, 2.8, -10); counterPet.rotation.y = -Math.PI*.1; lobby.add(counterPet);

  // 나무 화분
  const tree = new THREE.Group(); tree.position.set(-17, 0, 8); lobby.add(tree);
  cyl(.75, .9, 1.3, 18, new THREE.MeshStandardMaterial({color:0xb98a54, roughness:.8}), 0, .65, 0, tree, true);
  cyl(.16, .2, 1.6, 10, new THREE.MeshStandardMaterial({color:0x6e4a2a}), 0, 2.0, 0, tree, true);
  const leaf = new THREE.MeshStandardMaterial({color:0x7ccc6e, roughness:.85});
  sph(.85, leaf, 0, 3.2, 0, tree, true);
  sph(.6, leaf, -.5, 2.7, .25, tree, true);
  sph(.55, leaf, .5, 2.85, -.2, tree, true);

  // 엘리베이터 (뒷벽 중앙, 개구부 + 내부 칸)
  const ele = new THREE.Group(); ele.position.set(0, 0, BACK+.35); lobby.add(ele);
  box(.9, 4.5, .5, MAT.bronze, -1.85, 2.25, 0, ele, true);              // 문틀
  box(.9, 4.5, .5, MAT.bronze,  1.85, 2.25, 0, ele, true);
  box(4.6, .9, .5, MAT.bronze, 0, 4.05, 0, ele, true);
  const doorL = box(1.48, 3.8, .18, MAT.gold, -.75, 1.9, .28, ele, true);
  const doorR = box(1.48, 3.8, .18, MAT.gold,  .75, 1.9, .28, ele, true);
  // 내부 칸
  box(4.2, .2, 2.8, MAT.silver, 0, .1, -21.65, lobby);
  box(.2, 4.4, 2.8, MAT.silver, -2.1, 2.2, -21.65, lobby);
  box(.2, 4.4, 2.8, MAT.silver,  2.1, 2.2, -21.65, lobby);
  box(4.2, 4.4, .2, MAT.silver, 0, 2.2, -23.05, lobby);
  box(4.2, .2, 2.8, MAT.darkWood, 0, 4.3, -21.65, lobby);
  const rail = cyl(.045,.045,3.6,10, MAT.gold, 0, 1.55, -22.8, lobby);
  rail.rotation.z = Math.PI/2;
  const cabLight = new THREE.PointLight(0xfff2dd, .7, 8); cabLight.position.set(0, 3.9, -21.6); lobby.add(cabLight);
  const eleSign = textPlane('▲ 12F', 1.6, .5, '#ffd777');
  eleSign.position.set(0, 4.15, .65); ele.add(eleSign);
  lobby.userData.doors = [doorL, doorR];

  // 벽 금색 라인 조명 + 로비 조명
  box(W*2, .08, .08, MAT.goldLit, 0, 11.9, BACK+.15, lobby);
  for (const s of [-1,1]) box(.08, .08, FRONT-BACK, MAT.goldLit, s*(W-.15), 9.5, (FRONT+BACK)/2, lobby);

  for (const x of [-9,-3,3,9]){
    const sp = new THREE.SpotLight(0xffe6bb, .85, 40, .3, .55, 1.2);
    sp.position.set(x, WALL_H-1, 9);
    sp.target.position.set(x*1.1, 0, 8);
    lobby.add(sp, sp.target);
  }
  const p1 = new THREE.PointLight(0xffd9a0, .7, 30); p1.position.set(0, 9, -6); lobby.add(p1);
  const p2 = new THREE.PointLight(0x9adfd6, .35, 20); p2.position.set(0, 3, 0); lobby.add(p2);
}

/* ================= 바깥 풍경 (Kenney Modular Buildings, CC0) ================= */
{
  // 정면 유리 파사드 (로비 앞쪽)
  box(W*2, 13, .16, MAT.glass, 0, 6.5, FRONT, lobby);
  box(W*2, .5, .5, MAT.bronze, 0, 13.2, FRONT, lobby);
  for (let x=-W; x<=W; x+=6.5) box(.22, 13, .3, MAT.bronze, x, 6.5, FRONT, lobby);
  box(W*2, .35, .35, MAT.gold, 0, .25, FRONT, lobby);

  const outdoor = new THREE.Group(); lobby.add(outdoor);
  // 지면 / 인도 / 도로
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(160, 70),
    new THREE.MeshStandardMaterial({color:0x191c22, roughness:.95}));
  ground.rotation.x = -Math.PI/2; ground.position.set(0, -.02, FRONT+35); outdoor.add(ground);
  box(160, .14, 7, new THREE.MeshStandardMaterial({color:0x33363e, roughness:.9}), 0, .07, FRONT+3.8, outdoor);
  box(160, .1, 8, new THREE.MeshStandardMaterial({color:0x101318, roughness:.85}), 0, .05, FRONT+11.5, outdoor);
  for (let x=-72; x<80; x+=7)                                            // 차선
    box(2.6, .02, .32, new THREE.MeshStandardMaterial({color:0xd8d5c8, roughness:.8}), x, .12, FRONT+11.5, outdoor);
  // 가로등
  for (const x of [-30,-10,10,30]){
    cyl(.09,.12,5.6,8, MAT.black, x, 2.8, FRONT+6.4, outdoor);
    sph(.28, MAT.goldLit, x, 5.7, FRONT+6.4, outdoor);
  }
  const sl1 = new THREE.PointLight(0xffc97a, .55, 20); sl1.position.set(-10, 5.7, FRONT+6.4); outdoor.add(sl1);
  const sl2 = new THREE.PointLight(0xffc97a, .55, 20); sl2.position.set(10, 5.7, FRONT+6.4); outdoor.add(sl2);

  // Kenney 샘플 건물 배치 (도로 건너편 + 좌우)
  const mgr = new THREE.LoadingManager();
  mgr.setURLModifier(url => url.includes('colormap') ? 'data:image/png;base64,' + KENNEY_B64.colormap : url);
  const gltfLoader = new THREE.GLTFLoader(mgr);
  const SPECS = [   // [모델, x, z, 회전, 스케일]
    ['towerA', -38, FRONT+27, 0, 4.4],
    ['houseB', -20, FRONT+24, 0, 4.0],
    ['towerC',  -2, FRONT+28, 0, 4.6],
    ['houseA',  15, FRONT+24, 0, 3.8],
    ['towerD',  34, FRONT+27, 0, 4.4],
    ['houseC', -52, FRONT+16, Math.PI/2, 3.8],
    ['towerB',  52, FRONT+14, -Math.PI/2, 4.2],
  ];
  for (const [key, x, z, ry, s] of SPECS){
    gltfLoader.parse(b64ToBuf(KENNEY_B64[key]), '', g => {
      const m = g.scene;
      m.scale.setScalar(s);
      m.rotation.y = ry + Math.PI;               // 정면이 회사 쪽을 보게
      m.position.set(x, 0, z);
      outdoor.add(m);
    }, e => console.warn('kenney load fail', key, e));
  }
}

/* ================= 사무실 (12층) ================= */
const office = new THREE.Group(); office.visible = false; scene.add(office);
const coworkers = [];
{
  const OW = 17, OD = 12, OH = 6.2;
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(OW*2, OD*2),
    new THREE.MeshStandardMaterial({color:0xcbb392, roughness:.75}));
  floor.rotation.x = -Math.PI/2; floor.receiveShadow = true; office.add(floor);

  const wallMat = new THREE.MeshStandardMaterial({color:0xe9e4da, roughness:.9});
  // 뒷벽(엘베 쪽, 중앙에 개구부)
  box(OW-2.3, OH, .4, wallMat, -(OW+2.3)/2, OH/2, OD, office);
  box(OW-2.3, OH, .4, wallMat,  (OW+2.3)/2, OH/2, OD, office);
  box(4.6, OH-4.4, .4, wallMat, 0, 4.4+(OH-4.4)/2, OD, office);
  // 엘리베이터 내부 칸 (12층)
  box(4.2, .2, 2.6, MAT.silver, 0, .1, OD+1.5, office);
  box(.2, 4.4, 2.6, MAT.silver, -2.1, 2.2, OD+1.5, office);
  box(.2, 4.4, 2.6, MAT.silver,  2.1, 2.2, OD+1.5, office);
  box(4.2, 4.4, .2, MAT.silver, 0, 2.2, OD+2.7, office);
  box(4.2, .2, 2.6, MAT.darkWood, 0, 4.3, OD+1.5, office);
  const oRail = cyl(.045,.045,3.6,10, MAT.gold, 0, 1.55, OD+2.55, office);
  oRail.rotation.z = Math.PI/2;
  const oCabLight = new THREE.PointLight(0xfff2dd, .7, 8); oCabLight.position.set(0, 3.9, OD+1.5); office.add(oCabLight);
  box(.4, OH, OD*2, wallMat, -OW, OH/2, 0, office);
  box(.4, OH, OD*2, wallMat,  OW, OH/2, 0, office);
  box(OW*2, .4, OD*2, new THREE.MeshStandardMaterial({color:0xf2efe9}), 0, OH, 0, office);

  // 창문 벽 (야경)
  box(OW*2, OH, .3, MAT.black, 0, OH/2, -OD, office);
  const win = new THREE.Mesh(new THREE.PlaneGeometry(OW*2-1, OH-1.2),
    new THREE.MeshBasicMaterial({map:cityTex, toneMapped:false}));
  win.position.set(0, OH/2, -OD+.2); office.add(win);
  for (let x=-OW+3.4; x<OW; x+=3.4) box(.1, OH-1.2, .1, MAT.black, x, OH/2, -OD+.25, office);

  // 엘리베이터(도착층, 개구부 문틀)
  const ele = new THREE.Group(); ele.position.set(0, 0, OD-.25); ele.rotation.y = Math.PI; office.add(ele);
  box(.9, 4.5, .5, MAT.bronze, -1.85, 2.25, 0, ele, true);
  box(.9, 4.5, .5, MAT.bronze,  1.85, 2.25, 0, ele, true);
  box(4.6, .9, .5, MAT.bronze, 0, 4.05, 0, ele, true);
  const dL = box(1.48, 3.8, .18, MAT.gold, -.75, 1.9, .28, ele, true);
  const dR = box(1.48, 3.8, .18, MAT.gold,  .75, 1.9, .28, ele, true);
  office.userData.doors = [dL, dR];

  const sign = textPlane('MEOW CORP · 12F Our Team', 10, 1.3, '#5a4a32');
  sign.position.set(-9, 4.6, OD-.05); sign.rotation.y = Math.PI; office.add(sign);

  // 책상들 (2줄 x 3), 마지막 하나가 내 자리
  const deskTop = new THREE.MeshStandardMaterial({color:0xf5f2ec, roughness:.6});
  const legMat = new THREE.MeshStandardMaterial({color:0x8f9299, metalness:.6, roughness:.4});
  const screenMat = new THREE.MeshStandardMaterial({color:0x0e2e34, emissive:0x2fd2c0, emissiveIntensity:.7});
  let ci = 0;
  for (const z of [-4.5, 1.5]){
    for (const x of [-8, 0, 8]){
      const d = new THREE.Group(); d.position.set(x, 0, z); office.add(d);
      box(3.1, .12, 1.5, deskTop, 0, 1.06, 0, d, true);
      for (const [lx,lz] of [[-1.4,.6],[1.4,.6],[-1.4,-.6],[1.4,-.6]])
        box(.1, 1.0, .1, legMat, lx, .5, lz, d);
      box(1.5, .9, .08, MAT.black, 0, 1.68, -.45, d, true);             // 모니터
      const sc = box(1.34, .74, .02, screenMat, 0, 1.68, -.4, d);
      box(.12, .5, .12, MAT.black, 0, 1.2, -.45, d);
      cyl(.5, .55, .16, 18, MAT.black, 0, .5, 1.25, d);                 // 의자
      cyl(.07,.07,.5,10, legMat, 0, .25, 1.25, d);
      box(.9, .8, .12, MAT.black, 0, 1.05, 1.7, d);
      const mine = (x===8 && z===1.5);
      if (!mine){
        const n = NPCS[ci++];
        n.pet = makePet(n.species, 1.75);
        n.pet.position.set(x, .52, z+1.25);
        n.pet.rotation.y = Math.PI;                                      // 모니터(-z) 쪽 보기
        n.home = {x, z: z+1.25};
        office.add(n.pet);
        coworkers.push(n.pet);
      } else {
        sc.material = new THREE.MeshStandardMaterial({color:0x0e2e34, emissive:0xffc55e, emissiveIntensity:.65});
      }
    }
  }

  // 화분, 러그
  const tree = new THREE.Group(); tree.position.set(-14.5, 0, 9); office.add(tree);
  cyl(.6,.72,1.0,16, new THREE.MeshStandardMaterial({color:0xb98a54}), 0,.5,0, tree, true);
  const leaf = new THREE.MeshStandardMaterial({color:0x7ccc6e, roughness:.85});
  cyl(.12,.15,1.4,8, new THREE.MeshStandardMaterial({color:0x6e4a2a}), 0,1.6,0, tree);
  sph(.7, leaf, 0, 2.6, 0, tree, true);
  sph(.5, leaf, -.4, 2.2, .2, tree, true);
  const rug = new THREE.Mesh(new THREE.CircleGeometry(3.4, 36),
    new THREE.MeshStandardMaterial({color:0x6fd9cc, transparent:true, opacity:.5}));
  rug.rotation.x = -Math.PI/2; rug.position.set(0,.02,7); office.add(rug);

  // 탕비실 (오른쪽 벽, 커피머신)
  const kitchen = new THREE.Group(); kitchen.position.set(15.2, 0, 8); office.add(kitchen);
  box(1.6, 1.1, 3.2, new THREE.MeshStandardMaterial({color:0x8a6a4a, roughness:.7}), 0, .55, 0, kitchen, true);
  box(1.7, .1, 3.3, MAT.gold, 0, 1.14, 0, kitchen);
  const coffeeMachine = new THREE.Group(); coffeeMachine.position.set(0, 1.2, .6); kitchen.add(coffeeMachine);
  box(.8, 1.0, .9, MAT.black, 0, .5, 0, coffeeMachine, true);
  box(.7, .25, .2, MAT.silver, 0, .55, .5, coffeeMachine);
  sph(.06, MAT.ledRed, -.2, .85, .46, coffeeMachine);
  sph(.06, MAT.ledGreen, 0, .85, .46, coffeeMachine);
  cyl(.09,.07,.14,10, MAT.white, 0, .1, .38, coffeeMachine);            // 컵
  cyl(.09,.07,.14,10, MAT.white, .25, 1.05, -.2, coffeeMachine);
  cyl(.09,.07,.14,10, MAT.white, -.25, 1.05, -.2, coffeeMachine);
  const kettle = textPlane('☕ Pantry', 2.4, .5, '#8a6a4a');
  kettle.position.set(-.86, 2.2, 0); kettle.rotation.y = -Math.PI/2; office.add(kettle);
  kettle.position.x = 14.2; kettle.position.z = 8;

  // 복사기 (왼쪽 벽)
  const copier = new THREE.Group(); copier.position.set(-15.2, 0, -6); office.add(copier);
  box(1.3, 1.05, 1.7, new THREE.MeshStandardMaterial({color:0xc9cdd4, roughness:.5}), 0, .53, 0, copier, true);
  box(1.1, .18, 1.3, new THREE.MeshStandardMaterial({color:0x9aa0a8}), 0, 1.14, 0, copier);
  box(.9, .05, .6, MAT.white, .1, .8, .95, copier);                     // 종이 트레이
  const copierLed = sph(.07, MAT.ledRed, 0, 1.28, .5, copier);
  office.userData.copier = copier;
  office.userData.copierLed = copierLed;

  // 코너 오피스 (창가 구석, 승진 보상)
  const corner = new THREE.Group(); corner.position.set(13.8, 0, -9.2); office.add(corner);
  box(3.6, .14, 1.6, new THREE.MeshStandardMaterial({color:0x6a4a2c, roughness:.5}), 0, 1.1, 0, corner, true);
  box(3.8, .06, 1.7, MAT.gold, 0, 1.19, 0, corner);
  for (const [lx,lz] of [[-1.6,.6],[1.6,.6],[-1.6,-.6],[1.6,-.6]])
    box(.12, 1.05, .12, MAT.gold, lx, .52, lz, corner);
  box(1.3, .8, .07, MAT.black, -.7, 1.66, -.4, corner, true);           // 듀얼 모니터
  box(1.3, .8, .07, MAT.black, .7, 1.66, -.4, corner, true);
  box(1.2, .66, .02, new THREE.MeshStandardMaterial({color:0x0e2e34, emissive:0xffc55e, emissiveIntensity:.6}), -.7, 1.66, -.36, corner);
  box(1.2, .66, .02, new THREE.MeshStandardMaterial({color:0x0e2e34, emissive:0x2fd2c0, emissiveIntensity:.6}), .7, 1.66, -.36, corner);
  cyl(.55, .6, .18, 18, new THREE.MeshStandardMaterial({color:0x3a2c1c, roughness:.4}), 0, .55, 1.15, corner);
  box(1.0, .95, .14, new THREE.MeshStandardMaterial({color:0x3a2c1c, roughness:.4}), 0, 1.15, 1.62, corner, true);
  const crownSign = textPlane('👑 CORNER OFFICE', 3.4, .45, '#d9a94a');
  crownSign.position.set(13.8, 3.2, -11.8); office.add(crownSign);

  // 밝은 사무실 조명
  const a = new THREE.PointLight(0xfff2dd, .6, 40); a.position.set(0, 5.4, 0); office.add(a);
  const b = new THREE.PointLight(0xfff2dd, .4, 30); b.position.set(-10, 5.2, 4); office.add(b);
  const c = new THREE.PointLight(0xfff2dd, .4, 30); c.position.set(10, 5.2, -4); office.add(c);
}

/* ================= 옥상 정원 (RF) ================= */
const roof = new THREE.Group(); roof.visible = false; scene.add(roof);
{
  const RX = 14, RZ = 10;
  // 노을 하늘 돔
  const skyTex = canvasTex((g,w,h)=>{
    const gr = g.createLinearGradient(0,0,0,h);
    gr.addColorStop(0,'#243a66'); gr.addColorStop(.45,'#7a5a8c');
    gr.addColorStop(.72,'#e8896a'); gr.addColorStop(1,'#f7c05c');
    g.fillStyle = gr; g.fillRect(0,0,w,h);
    g.fillStyle = 'rgba(255,214,150,.25)';
    for (let i=0;i<14;i++){
      const y = h*.55 + Math.random()*h*.3;
      g.fillRect(Math.random()*w, y, 90+Math.random()*160, 4+Math.random()*7);
    }
  }, 1024, 512);
  const dome = new THREE.Mesh(new THREE.SphereGeometry(90, 24, 14),
    new THREE.MeshBasicMaterial({map:skyTex, side:THREE.BackSide, fog:false}));
  dome.position.y = -4;
  roof.add(dome);

  // 우드 데크 바닥 + 난간(파라펫)
  const deckTex = canvasTex((g,w,h)=>{
    g.fillStyle = '#a5825c'; g.fillRect(0,0,w,h);
    for (let y=0;y<h;y+=42){ g.fillStyle = 'rgba(70,45,20,.45)'; g.fillRect(0,y,w,3); }
    for (let i=0;i<160;i++){
      g.fillStyle = `rgba(120,90,55,${.05+Math.random()*.12})`;
      g.fillRect(Math.random()*w, Math.random()*h, 20+Math.random()*60, 2);
    }
  }, 512, 512, 3, 3);
  const deck = new THREE.Mesh(new THREE.PlaneGeometry(RX*2, RZ*2),
    new THREE.MeshStandardMaterial({map:deckTex, roughness:.8}));
  deck.rotation.x = -Math.PI/2; deck.receiveShadow = true; roof.add(deck);
  box(RX*2+.6, 1.1, .3, MAT.silver, 0, .55, -RZ, roof);
  box(RX*2+.6, 1.1, .3, MAT.silver, 0, .55, RZ, roof);
  box(.3, 1.1, RZ*2, MAT.silver, -RX, .55, 0, roof);
  box(.3, 1.1, RZ*2, MAT.silver, RX, .55, 0, roof);
  box(RX*2+.7, .1, .4, MAT.gold, 0, 1.12, -RZ, roof);

  // 엘리베이터 하우징 (사무실과 같은 패턴, 뒤쪽 z=+)
  box(.9, 4.5, .5, MAT.bronze, -1.85, 2.25, RZ-.6, roof, true);
  box(.9, 4.5, .5, MAT.bronze,  1.85, 2.25, RZ-.6, roof, true);
  box(4.6, .9, .5, MAT.bronze, 0, 4.05, RZ-.6, roof, true);
  box(5.2, 4.6, .4, MAT.bronze, 0, 2.3, RZ+1.9, roof, true);            // 하우징 뒷벽
  box(.4, 4.6, 2.6, MAT.bronze, -2.4, 2.3, RZ+.7, roof, true);
  box(.4, 4.6, 2.6, MAT.bronze,  2.4, 2.3, RZ+.7, roof, true);
  box(5.2, .3, 2.9, MAT.bronze, 0, 4.6, RZ+.6, roof, true);
  box(4.2, .2, 2.2, MAT.silver, 0, .1, RZ+.7, roof);                    // 칸 바닥
  const rDoorL = box(1.48, 3.8, .18, MAT.gold, -.75, 1.9, RZ-.32, roof, true);
  const rDoorR = box(1.48, 3.8, .18, MAT.gold,  .75, 1.9, RZ-.32, roof, true);
  roof.userData.doors = [rDoorL, rDoorR];
  const rCabLight = new THREE.PointLight(0xfff2dd, .6, 7); rCabLight.position.set(0, 3.8, RZ+.7); roof.add(rCabLight);

  // 벤치 2개 (도시 쪽을 바라봄)
  for (const bx of [-7.5, 7.5]){
    const b = new THREE.Group(); b.position.set(bx, 0, -6.2); roof.add(b);
    const woodm = new THREE.MeshStandardMaterial({color:0x8a5f38, roughness:.7});
    box(3.2, .12, .5, woodm, 0, .72, 0, b, true);
    box(3.2, .12, .5, woodm, 0, .72, .55, b, true);
    box(3.2, .5, .12, woodm, 0, 1.05, -.28, b, true);
    for (const lx of [-1.4, 1.4]){
      box(.14, .72, .14, MAT.black, lx, .36, .1, b);
      box(.14, .9, .14, MAT.black, lx, .5, -.28, b);
    }
  }

  // 화분 + 나무/덤불/꽃 (Kenney Nature Kit)
  const planterMat = new THREE.MeshStandardMaterial({color:0x6e5a48, roughness:.85});
  const spots = [
    ['tree_default', -11.5, -7, 4.2], ['tree_oak', 11.5, -7, 4.2],
    ['tree_pineDefaultA', -11.5, 6.5, 4.2], ['tree_default', 11.5, 6.5, 4.2],
  ];
  for (const [name, x, z, s] of spots){
    box(2.4, .9, 2.4, planterMat, x, .45, z, roof, true);
    const t = makeNature(name, s);
    t.position.set(x, .9, z);
    roof.add(t);
  }
  for (const [name, x, z, s] of [
    ['plant_bushLarge', -4, -8.8, 3], ['plant_bushLarge', 4, -8.8, 3],
    ['flower_purpleA', -2, -8.6, 3.4], ['flower_yellowA', 2, -8.6, 3.4],
    ['grass_large', -6, -8.7, 3], ['grass_large', 6, -8.7, 3],
  ]){
    const p = makeNature(name, s);
    p.position.set(x, 0, z);
    roof.add(p);
  }

  // 스트링 라이트 (기둥 2개 사이 전구들)
  for (const sx of [-9, 9]) cyl(.06, .08, 3.4, 8, MAT.black, sx, 1.7, -3.5, roof, true);
  for (let i = 0; i <= 12; i++){
    const t = i / 12;
    const x = -9 + t*18;
    const y = 3.3 - Math.sin(t*Math.PI)*.7;
    sph(.09, MAT.goldLit, x, y, -3.5, roof);
  }
  const warm1 = new THREE.PointLight(0xffc98a, .8, 22); warm1.position.set(0, 4, -3.5); roof.add(warm1);
  const warm2 = new THREE.PointLight(0xff9a6a, .5, 30); warm2.position.set(0, 8, -14); roof.add(warm2);

  const sign = textPlane('🌇 ROOFTOP GARDEN', 5, .6, '#ffd9a0');
  sign.position.set(0, 4.2, RZ-.85); roof.add(sign);
}

/* ================= 층 레지스트리 =================
   새 층 추가 절차: ① 그룹 빌드 ② 여기 등록 ③ data.js 콘텐츠. */
const FLOORS = {
  1: {
    label: '1F · Lobby', icon: '🏢', groupRef: () => lobby,
    doors: () => lobby.userData.doors, doorT: 0, doorTarget: 0,
    cabIn: [0, -21.2], cabSpawn: [0, -21.2], exit: [0, -15.5, 1.3],
    spawnRotY: 0, cam: {yaw: Math.PI, pitch: .3, dist: 8},
    bounds: {x0: -25, x1: 25, z0: -18.6, z1: 21},
    clamp: c => {
      c.x = Math.max(-25.3, Math.min(25.3, c.x));
      c.y = Math.min(15.4, c.y);
      c.z = Math.max(-19.1, c.z);
    },
    circles: [
      {x:0, z:-6, r:2.55}, {x:-17, z:8, r:1.35},
      {x:-14, z:-13, r:1.5}, {x:-6, z:-13, r:1.5}, {x:6, z:-13, r:1.5}, {x:14, z:-13, r:1.5},
    ],
    boxes: [
      {x:-5.6, z:2, hw:1.95, hd:1.05}, {x:5.6, z:2, hw:1.95, hd:1.05},
      {x:-11, z:-10, hw:3.3, hd:1.1},
    ],
  },
  12: {
    label: '12F · Our Team', icon: '💼', groupRef: () => office,
    doors: () => office.userData.doors, doorT: 0, doorTarget: 0,
    cabIn: [0, 13.5], cabSpawn: [0, 13.4], exit: [0, 6.0, 1.4],
    spawnRotY: Math.PI, cam: {yaw: 0, pitch: .3, dist: 7},
    bounds: {x0: -16, x1: 16, z0: -11, z1: 11},
    clamp: c => {
      c.x = Math.max(-16.3, Math.min(16.3, c.x));
      c.y = Math.min(5.9, c.y);
      c.z = Math.max(-11.5, Math.min(11.5, c.z));
    },
    circles: [],
    boxes: [],   // game.js에서 책상/프롭 채움
  },
  13: {
    label: 'RF · Rooftop Garden', icon: '🌇', groupRef: () => roof,
    doors: () => roof.userData.doors, doorT: 0, doorTarget: 0,
    cabIn: [0, 10.7], cabSpawn: [0, 10.7], exit: [0, 5.5, 1.2],
    spawnRotY: Math.PI, cam: {yaw: 0, pitch: .3, dist: 7.5},
    bounds: {x0: -13.4, x1: 13.4, z0: -9.4, z1: 11},
    clamp: c => {
      c.x = Math.max(-13.8, Math.min(13.8, c.x));
      c.y = Math.min(14, c.y);
      c.z = Math.max(-9.8, Math.min(8.6, c.z));   // 엘베 하우징 앞까지만
    },
    circles: [
      {x:-11.5, z:-7, r:1.7}, {x:11.5, z:-7, r:1.7},
      {x:-11.5, z:6.5, r:1.7}, {x:11.5, z:6.5, r:1.7},
    ],
    boxes: [
      {x:-7.5, z:-6.1, hw:1.7, hd:.6}, {x:7.5, z:-6.1, hw:1.7, hd:.6},   // 벤치
      {x:0, z:11, hw:2.7, hd:1.6},                                       // 엘베 하우징
    ],
  },
};
const floorName = n => n === 13 ? 'RF' : n + 'F';

/* ================= 전역 조명 ================= */
scene.add(new THREE.AmbientLight(0xbfc8d8, .22));
scene.add(new THREE.HemisphereLight(0xcfd8e8, 0x201810, .2));
const sun = new THREE.DirectionalLight(0xffeecc, .6);
sun.position.set(10, 22, 12);
sun.castShadow = true;
sun.shadow.mapSize.set(2048, 2048);
sun.shadow.camera.left = -30; sun.shadow.camera.right = 30;
sun.shadow.camera.top = 30; sun.shadow.camera.bottom = -30;
sun.shadow.bias = -0.0006;
scene.add(sun);

/* ================= 플레이어 & 마커 ================= */
// 목에 거는 사원증 (받기 전엔 숨김) — 펫 로드 후 몸 앞면에 맞춰 붙인다
const badge3d = new THREE.Group(); badge3d.visible = false;
{
  const strap = cyl(.025,.025,.5,6, MAT.black, 0, .34, -.06, badge3d);
  strap.rotation.x = .5;
  const card = box(.3,.4,.04, MAT.white, 0, 0, 0, badge3d);
  card.rotation.x = -.1;
  const stripe = box(.3,.1,.05, MAT.teal, 0, .15, .005, badge3d);
  stripe.rotation.x = -.1;
}
// 커피 트레이 (커피 배달 중일 때만 보임, 왼쪽 옆구리)
const carryCup = new THREE.Group(); carryCup.visible = false;
{
  const cup = cyl(.12, .09, .2, 12, MAT.white, 0, 0, 0, carryCup);
  cyl(.13, .13, .05, 12, MAT.teal, 0, .04, 0, carryCup);
  box(.04, .1, .04, MAT.white, .15, 0, 0, carryCup);
}
const player = makePet('cat', 2.2, g => {
  // 사원증은 옆구리(오른쪽 옆면)에 부착
  badge3d.position.set(g.userData.width/2 + .04, .95, .1);
  badge3d.rotation.y = Math.PI/2;
  g.add(badge3d);
  carryCup.position.set(-g.userData.width/2 - .1, 1.0, .1);
  g.add(carryCup);
});
player.position.set(0, 0, 12);
player.rotation.y = Math.PI;
scene.add(player);

const marker = new THREE.Group(); scene.add(marker);
{
  const cone = new THREE.Mesh(new THREE.ConeGeometry(.55, 1.0, 3), MAT.teal);
  cone.rotation.x = Math.PI; cone.position.y = .8; marker.add(cone);
  const disc = new THREE.Mesh(new THREE.CylinderGeometry(.55,.55,.12,20), MAT.teal);
  marker.add(disc);
  marker.userData.cone = cone;
}
marker.position.set(0, 2.6, 2.6);
