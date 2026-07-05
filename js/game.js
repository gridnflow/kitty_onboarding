'use strict';
/* 게임 로직: 스테이지 머신, 엘리베이터 시퀀스, 온보딩 위크(하루/미션/대화/퀴즈), 입력, 충돌, 메인 루프 */
/* ================= 게임 상태 ================= */
const promptEl = document.getElementById('prompt');
const objectiveEl = document.getElementById('objective');
const fadeEl = document.getElementById('fade');
const floorNumEl = document.getElementById('floorNum');
const floorLblEl = document.getElementById('floorLbl');
const bigmsgEl = document.getElementById('bigmsg');

let stage = 'badge';         // badge -> gate -> elevator -> desk -> done
let busy = false;
let gateT = 0, tagT = 0;     // 게이트 날개 / 카드 태그 연출 진행도
let lobbyDoorT = 0, lobbyDoorTarget = 0;   // 엘베 문 (0 닫힘, 1 열림)
let officeDoorT = 0, officeDoorTarget = 0;
let inOffice = false;
let satOnce = false;         // 한 번 출근 완료했는지
let cut = null;              // 컷신 자동 걷기




function walkTo(x, z, dur, then){
  if (window.RIDE_FAST) dur = .05;               // 개발용(?autoride): 컷신 고속화
  cut = {fx:player.position.x, fz:player.position.z, tx:x, tz:z, t:0, dur, then};
  heading = Math.atan2(x - player.position.x, z - player.position.z);
  player.rotation.y = heading;
}

function setStage(s){
  stage = s;
  objectiveEl.textContent = OBJECTIVES[s];
  const it = INTERACTS[s];
  if (it){ marker.visible = true; marker.position.set(...it.markPos); }
  else marker.visible = false;
  if (s === 'free') updateMission();               // 사무실 미션 안내로 덮어쓰기
}

/* 짧은 비프음 (사원증 태그) */
let audioCtx = null;
function beep(freq, t0, dur){
  try{
    audioCtx = audioCtx || new (window.AudioContext||window.webkitAudioContext)();
    const o = audioCtx.createOscillator(), gn = audioCtx.createGain();
    o.frequency.value = freq; o.type = 'sine';
    gn.gain.setValueAtTime(.12, audioCtx.currentTime + t0);
    gn.gain.exponentialRampToValueAtTime(.0001, audioCtx.currentTime + t0 + dur);
    o.connect(gn).connect(audioCtx.destination);
    o.start(audioCtx.currentTime + t0); o.stop(audioCtx.currentTime + t0 + dur + .05);
  }catch(e){}
}

/* 층 카운트 연출 공용 헬퍼 */
function runFloors(from, to, arriveLbl, onArrive){
  fadeEl.style.opacity = 1;
  floorLblEl.textContent = to > from ? 'Going up…' : 'Going down…';
  const step = to > from ? 1 : -1;
  let f = from;
  floorNumEl.textContent = from + 'F';
  const iv = setInterval(()=>{
    f += step;
    floorNumEl.textContent = f + 'F';
    beep(520 + f*14, 0, .05);
    if (f === to){
      clearInterval(iv);
      floorLblEl.textContent = arriveLbl;
      setTimeout(onArrive, 650);
    }
  }, window.RIDE_FAST ? 8 : 110);
}
/* 엘리베이터 탑승 공용 시퀀스: 문 열림 → 칸 진입 → 문 닫힘 → 층 이동 → 반대층 하차 */
function rideSequence(cfg){
  busy = true;
  promptEl.style.display = 'none';
  marker.visible = false;
  beep(700, 0, .1);
  cfg.setDoor(1);                                 // 문 열림
  setTimeout(()=> walkTo(cfg.walkIn[0], cfg.walkIn[1], 1.5, ()=>{
    cfg.setDoor(0);                               // 문 닫힘
    setTimeout(()=> runFloors(cfg.from, cfg.to, cfg.arriveLbl, ()=>{
      cfg.onSwap();                               // 씬 전환 + 도착층 문 열림
      fadeEl.style.opacity = 0;
      setTimeout(()=>{
        floorNumEl.textContent = ''; floorLblEl.textContent = '';
        walkTo(cfg.walkOut[0], cfg.walkOut[1], cfg.walkOut[2], cfg.onDone);
      }, 600);
    }), 1200);
  }), 950);
}
function rideElevator(){                          // 1층 → 12층
  rideSequence({
    setDoor: v => lobbyDoorTarget = v,
    walkIn: [0, -21.2],
    from: 1, to: 12, arriveLbl: '12F · Our Team',
    onSwap(){
      lobby.visible = false; office.visible = true; inOffice = true;
      player.position.set(0, 0, 13.4);
      player.rotation.y = Math.PI; heading = Math.PI;
      camYaw = 0; camPitch = .3; camDist = 7;
      officeDoorTarget = 1;
    },
    walkOut: [0, 6.0, 1.4],
    onDone(){
      officeDoorTarget = 0;
      setStage(satOnce ? 'free' : 'desk');
      busy = false;
    },
  });
}
function rideDown(){                              // 12층 → 1층 (퇴근)
  rideSequence({
    setDoor: v => officeDoorTarget = v,
    walkIn: [0, 13.5],
    from: 12, to: 1, arriveLbl: '1F · Lobby',
    onSwap(){
      office.visible = false; lobby.visible = true; inOffice = false;
      player.position.set(0, 0, -21.2);
      player.rotation.y = 0; heading = 0;
      camYaw = Math.PI; camPitch = .3; camDist = 8;
      lobbyDoorTarget = 1;
    },
    walkOut: [0, -15.5, 1.3],
    onDone(){
      lobbyDoorTarget = 0;
      showDaySummary();                           // 하루 마감
    },
  });
}

function doInteract(){
  const it = INTERACTS[stage];
  if (!it) return;
  const dx = player.position.x - it.x, dz = player.position.z - it.z;
  if (dx*dx + dz*dz > it.r*it.r) return;
  if (stage === 'badge'){
    beep(660, 0, .08); beep(990, .09, .1);
    document.getElementById('badge').style.display = 'flex';
    badge3d.visible = true;
    setStage('gate');
  } else if (stage === 'gate'){
    busy = true;
    promptEl.style.display = 'none';
    lobby.userData.tagCard.visible = true;        // 카드 태그 연출
    tagT = .001;
    beep(880, .2, .09); beep(1320, .32, .12);
    setTimeout(()=>{
      for (const led of lobby.userData.readerLeds) led.material = MAT.ledGreen;
      lobby.userData.tagCard.visible = false;
      gateT = .001;
      setStage('elevator');
      busy = false;
    }, 800);
  } else if (stage === 'elevator'){
    rideElevator();
  } else if (stage === 'free'){
    if (tasksLeft().length && !(ended || day > 3)){
      say(null, ['Still got tasks left today! Check the list at the top right.']);
    } else rideDown();
  } else if (stage === 'desk'){
    player.position.set(8, .5, 2.75);
    player.rotation.y = Math.PI;
    satOnce = true;
    taskDone('sit');
    setBigmsg('🎉 Clocked In!', 'Made it to 12F. Now go say hi to the team 🐾');
    setStage('done');
    promptEl.style.display = 'none';
    bigmsgEl.style.display = 'block';
    beep(660,0,.12); beep(880,.13,.12); beep(1100,.26,.2);
    setTimeout(()=>{ bigmsgEl.style.display='none'; setStage('free'); }, 4200);
  }
}

/* ================= 온보딩 위크: 하루/미션/대화 ================= */
let day = +(localStorage.getItem('meow_day') || 1);
let hearts = JSON.parse(localStorage.getItem('meow_hearts') || '{}');
let ended = localStorage.getItem('meow_end') === '1';
let tasks = [];
let coffees = 0, copierHits = 0, promoted = false, finalIdx = 0;
let dlgOpen = false, sumOpen = false;
let dlgLines = [], dlgIdx = 0, dlgNpc = null, dlgOnEnd = null, dlgChoiceSet = null;
const dlgEl = document.getElementById('dlg');
const questEl = document.getElementById('quest');
const carryEl = document.getElementById('carry');
const daysumEl = document.getElementById('daysum');

function saveGame(){
  localStorage.setItem('meow_day', day);
  localStorage.setItem('meow_hearts', JSON.stringify(hearts));
  if (ended) localStorage.setItem('meow_end', '1');
}
function resetGame(){
  localStorage.removeItem('meow_day');
  localStorage.removeItem('meow_hearts');
  localStorage.removeItem('meow_end');
  location.reload();
}
function setBigmsg(t, s){
  bigmsgEl.querySelector('h1').textContent = t;
  bigmsgEl.querySelector('p').textContent = s;
}

function setupDay(){
  coffees = 0; copierHits = 0; promoted = false; finalIdx = 0;
  updateCarry();
  if (ended || day > 3){
    tasks = [{id:'chill', label:'Free day — hang out and relax', done:true}];
  } else if (day === 1){
    tasks = [
      {id:'sit', label:'Sit at your desk', done:false},
      ...NPCS.map(n => ({id:'greet_'+n.name, label:`Say hi to ${n.emoji} ${n.name}`, done:false})),
    ];
  } else if (day === 2){
    tasks = [
      {id:'coffee', label:'☕ Grab 5 coffees from the pantry', done:false},
      ...NPCS.map(n => ({id:'give_'+n.name, label:`Bring coffee to ${n.emoji} ${n.name}`, done:false})),
      {id:'quiz', label:"🐼 Pass Pandol's pop quiz", done:false},
    ];
  } else {
    tasks = [
      {id:'copier', label:'🛠 Fix the broken copier', done:false},
      {id:'finalquiz', label:"🐼 Pandol's final quiz (3 questions)", done:false},
      {id:'crown', label:'👑 Claim the corner office', done:false},
    ];
  }
  renderQuest();
}
const tasksLeft = () => tasks.filter(t => !t.done);
function taskDone(id){
  const tk = tasks.find(t => t.id === id);
  if (!tk || tk.done) return;
  tk.done = true;
  beep(980, 0, .07);
  renderQuest();
  updateMission();
}
function renderQuest(){
  const title = (ended || day > 3) ? `DAY ${day} · Free Day` : `DAY ${day} / 3 · Onboarding Week`;
  questEl.innerHTML = `<b>${title}</b>` + tasks.map(t =>
    `<div class="t ${t.done?'done':''}">${t.done?'✅':'⬜'} ${t.label}</div>`).join('');
}
function updateCarry(){
  carryEl.style.display = coffees > 0 ? 'block' : 'none';
  carryEl.textContent = '☕ × ' + coffees;
}

function markerTo(x, y, z){ marker.visible = true; marker.position.set(x, y, z); }
function updateMission(){
  if (!inOffice || (stage !== 'free' && stage !== 'done')) return;
  const left = tasksLeft();
  let text, tgt;
  if (!left.length){
    text = 'All done for today! Take the elevator home';
    tgt = [0, 4.9, 9.2];
  } else {
    const tk = left[0];
    if (tk.id.startsWith('greet_')){
      const n = npcByName[tk.id.slice(6)];
      text = 'Meet the team — next up: ' + n.name;
      tgt = [n.home.x, 3.1, n.home.z];
    } else if (tk.id === 'coffee'){ text = 'Grab coffee at the pantry (right wall)'; tgt = [15, 2.8, 8]; }
    else if (tk.id.startsWith('give_')){
      const n = npcByName[tk.id.slice(5)];
      text = 'Coffee delivery — next up: ' + n.name;
      tgt = [n.home.x, 3.1, n.home.z];
    } else if (tk.id === 'quiz' || tk.id === 'finalquiz'){
      const n = npcByName['Pandol'];
      text = "Go take Pandol's quiz";
      tgt = [n.home.x, 3.1, n.home.z];
    } else if (tk.id === 'copier'){ text = 'Fix the copier on the left wall (press E ×3)'; tgt = [-14.6, 2.8, -6]; }
    else if (tk.id === 'crown'){ text = 'Promoted! Take the corner office by the window'; tgt = [13.8, 3.4, -8]; }
    else { text = 'Check your task list'; tgt = null; }
  }
  objectiveEl.textContent = `(DAY ${day}) ` + text;
  if (tgt) markerTo(...tgt);
}

/* ---- 대화 박스 ---- */
function say(npc, lines, opts){
  dlgOpen = true; dlgNpc = npc;
  dlgLines = Array.isArray(lines) ? lines : [lines];
  dlgIdx = 0;
  dlgOnEnd = (opts && opts.onEnd) || null;
  dlgChoiceSet = (opts && opts.choices) || null;
  dlgEl.style.display = 'block';
  promptEl.style.display = 'none';
  renderDlgLine();
}
function renderDlgLine(){
  document.getElementById('dlgName').textContent = dlgNpc ? `${dlgNpc.emoji} ${dlgNpc.name} · ${dlgNpc.role}` : '📢 Notice';
  document.getElementById('dlgHearts').textContent = dlgNpc ? '❤️'.repeat(hearts[dlgNpc.name]||0) : '';
  document.getElementById('dlgText').textContent = dlgLines[dlgIdx];
  const last = dlgIdx === dlgLines.length - 1;
  const ch = document.getElementById('dlgChoices');
  if (last && dlgChoiceSet){
    ch.style.display = 'flex';
    ch.innerHTML = '';
    document.getElementById('dlgNext').style.display = 'none';
    dlgChoiceSet.options.forEach((opt, i) => {
      const b = document.createElement('button');
      b.textContent = (i+1) + '. ' + opt;
      b.onclick = ev => { ev.stopPropagation(); pickChoice(i); };
      ch.appendChild(b);
    });
  } else {
    ch.style.display = 'none';
    document.getElementById('dlgNext').style.display = 'block';
  }
}
function advanceDlg(){
  if (dlgChoiceSet && dlgIdx === dlgLines.length - 1) return;          // 선택지 대기 중
  if (dlgIdx < dlgLines.length - 1){ dlgIdx++; renderDlgLine(); return; }
  closeDlg();
}
function closeDlg(){
  dlgEl.style.display = 'none';
  dlgOpen = false;
  const fn = dlgOnEnd;
  dlgOnEnd = null; dlgChoiceSet = null;
  if (fn) fn();
}
function pickChoice(i){
  const cs = dlgChoiceSet;
  dlgChoiceSet = null;
  if (i === cs.answer){
    beep(880,0,.08); beep(1180,.1,.1);
    dlgLines = [cs.right]; dlgIdx = 0;
    if (cs.onRight) dlgOnEnd = cs.onRight;
  } else {
    beep(200,0,.2);
    dlgLines = [cs.wrong]; dlgIdx = 0;
  }
  renderDlgLine();
}
dlgEl.addEventListener('click', e => { if (e.target.tagName !== 'BUTTON') advanceDlg(); });
daysumEl.addEventListener('click', () => nextMorning());

/* ---- NPC 대화 (온보딩 투어 + 호감도) ---- */
function npcTalk(n){
  const greetId = 'greet_' + n.name, giveId = 'give_' + n.name;
  if (day === 1 && tasks.some(t => t.id === greetId && !t.done)){
    say(n, n.intro, {onEnd: () => taskDone(greetId)});
    return;
  }
  if (day === 2 && !ended){
    const giveTk = tasks.find(t => t.id === giveId);
    if (coffees > 0 && giveTk && !giveTk.done){
      coffees--; updateCarry();
      hearts[n.name] = (hearts[n.name]||0) + 1; saveGame();
      say(n, ['☕ Oh! Thanks, rookie — just what I needed!', `(❤️ ${n.name}'s affinity went up!)`], {onEnd: () => taskDone(giveId)});
      return;
    }
    if (n.name === 'Pandol'){
      const quizTk = tasks.find(t => t.id === 'quiz');
      const gives = tasks.filter(t => t.id.startsWith('give_'));
      if (quizTk && !quizTk.done){
        if (!gives.every(t => t.done)){
          say(n, ['Coffee delivery first~ The pantry is on the right wall! ☕']);
          return;
        }
        say(n, ['Thanks for the coffee. Now... pop quiz! 😏', "How long is our team's sprint cycle?"], {choices:{
          options:['1 week','2 weeks','1 month'], answer:1,
          right:"Correct! You've been paying attention. Tomorrow is the final quiz — be ready~",
          wrong:"Wrong! I mentioned it in my intro yesterday... get a refresher and come back.",
          onRight: () => taskDone('quiz'),
        }});
        return;
      }
    }
  }
  if (day === 3 && !ended && n.name === 'Pandol'){
    const fq = tasks.find(t => t.id === 'finalquiz');
    if (fq && !fq.done){
      const cop = tasks.find(t => t.id === 'copier');
      if (cop && !cop.done){
        say(n, ["Fix the copier first! I can't print your onboarding certificate 🐼💦 (left wall)"]);
        return;
      }
      finalQuiz(n);
      return;
    }
  }
  say(n, [n.small[Math.random()*n.small.length|0]]);
}


function finalQuiz(n){
  const fq = FINAL_QUIZ[finalIdx];
  say(n, [fq.q], {choices:{
    options: fq.options, answer: fq.answer,
    right: finalIdx < 2 ? 'Correct! Next question.'
         : 'All correct! 🎉 Onboarding complete. Congrats on the promotion — the corner office by the window is yours now, Nyang! 👑',
    wrong: `Hmm~ wrong. Go get a hint from ${fq.hint} and come back!`,
    onRight: () => {
      finalIdx++;
      if (finalIdx < 3) finalQuiz(n);
      else { taskDone('finalquiz'); promoted = true; updateMission(); }
    },
  }});
}

/* ---- 미션 상호작용 후보 ---- */
function missionCandidate(px, pz){
  if (!inOffice) return null;
  let best = null;
  const consider = (x, z, r, label, action) => {
    const d2 = (px-x)*(px-x) + (pz-z)*(pz-z);
    if (d2 < r*r && (!best || d2 < best.d2)) best = {d2, label, action};
  };
  for (const n of NPCS)
    if (n.home) consider(n.home.x, n.home.z, 2.4, `E: Talk to ${n.emoji} ${n.name}`, () => npcTalk(n));
  if (day === 2 && !ended && tasks.some(t => t.id === 'coffee' && !t.done))
    consider(15, 8, 2.8, 'E: ☕ Grab 5 coffees', () => {
      coffees = 5; updateCarry();
      beep(660,0,.08); beep(880,.1,.08);
      taskDone('coffee');
      say(null, ['☕×5 acquired! The tray is nice and warm. Time to make the rounds.']);
    });
  if (day === 3 && !ended && tasks.some(t => t.id === 'copier' && !t.done))
    consider(-14.6, -6, 2.8, `E: 🛠 Fix the copier (${copierHits}/3)`, () => {
      copierHits++;
      beep(160 + copierHits*70, 0, .13);
      const cp = office.userData.copier;
      cp.rotation.z = .07;
      setTimeout(()=> cp.rotation.z = -.05, 90);
      setTimeout(()=> cp.rotation.z = 0, 180);
      if (copierHits >= 3){
        office.userData.copierLed.material = MAT.ledGreen;
        taskDone('copier');
        say(null, ['📠 Whirrr— the copier lives! Go tell Pandol.']);
      }
    });
  if (promoted && tasks.some(t => t.id === 'crown' && !t.done))
    consider(13.8, -7.6, 2.8, 'E: 👑 Sit in the corner office', () => {
      player.position.set(13.8, .55, -8.05);
      player.rotation.y = Math.PI;
      taskDone('crown');
      ended = true; saveGame();
      setBigmsg('👑 Promoted!', 'Onboarding complete & corner office unlocked. Living the cat dream! 🎉');
      bigmsgEl.style.display = 'block';
      beep(660,0,.12); beep(880,.13,.12); beep(1100,.26,.15); beep(1320,.42,.3);
      setTimeout(()=>{ bigmsgEl.style.display = 'none'; renderQuest(); updateMission(); }, 4800);
    });
  return best;
}

/* ---- 하루 마감 / 다음 날 ---- */
function showDaySummary(){
  busy = false; sumOpen = true;
  const heartsStr = NPCS.map(n => `${n.emoji}${'❤️'.repeat(hearts[n.name]||0) || '·'}`).join('&nbsp; ');
  document.getElementById('sumTitle').textContent = `DAY ${day} Complete!`;
  document.getElementById('sumBody').innerHTML =
    `Onboarding progress: ${tasks.filter(t=>t.done).length} / ${tasks.length}<br>Affinity: ${heartsStr}` +
    (ended ? '<br>👑 Owner of the corner office!' : '');
  daysumEl.style.display = 'flex';
}
function nextMorning(){
  if (!sumOpen) return;
  sumOpen = false;
  daysumEl.style.display = 'none';
  day++; saveGame();
  setupDay();
  fadeEl.style.opacity = 1;
  setTimeout(()=>{
    player.position.set(0, 0, 12); player.rotation.y = Math.PI; heading = Math.PI;
    camYaw = 0; camPitch = .34; camDist = 9.5;
    gateT = 0;                                    // 게이트는 매일 아침 다시 태그
    lobby.userData.wings[0].rotation.y = 0;
    lobby.userData.wings[1].rotation.y = 0;
    for (const led of lobby.userData.readerLeds) led.material = MAT.ledRed;
    setStage('gate');
    objectiveEl.textContent = `(DAY ${day}) Good morning! Tap the gate and head up to 12F`;
    fadeEl.style.opacity = 0;
  }, 650);
}

/* ================= 입력 ================= */
const keys = {};
let currentCand = null;
addEventListener('keydown', e => {
  keys[e.code] = true;
  if (sumOpen){
    if (e.code === 'KeyE') nextMorning();
    else if (e.code === 'KeyR') resetGame();
    return;
  }
  if (dlgOpen){
    if (e.code === 'KeyE') advanceDlg();
    return;
  }
  if (e.code === 'KeyE' && currentCand) currentCand.action();
});
addEventListener('keyup', e => keys[e.code] = false);

let camYaw = 0, camPitch = .34, camDist = 9.5;
let dragging = false, px = 0, py = 0;
renderer.domElement.addEventListener('mousedown', e => { dragging = true; px = e.clientX; py = e.clientY; });
addEventListener('mouseup', () => dragging = false);
addEventListener('mousemove', e => {
  if (!dragging) return;
  camYaw   -= (e.clientX - px) * .0045;
  camPitch += (e.clientY - py) * .0035;
  camPitch = Math.max(.08, Math.min(1.25, camPitch));
  px = e.clientX; py = e.clientY;
});
addEventListener('wheel', e => {
  camDist = Math.max(4.5, Math.min(17, camDist * (1 + e.deltaY * .001)));
}, {passive:true});
addEventListener('contextmenu', e => e.preventDefault());

/* ================= 충돌 ================= */
const lobbyCircles = [
  {x:0, z:-6, r:2.55},                            // 포디움
  {x:-17, z:8, r:1.35},                           // 나무
  {x:-14, z:-13, r:1.5},{x:-6, z:-13, r:1.5},{x:6, z:-13, r:1.5},{x:14, z:-13, r:1.5}, // 기둥
];
const lobbyBoxes = [
  {x:-5.6, z:2, hw:1.95, hd:1.05},{x:5.6, z:2, hw:1.95, hd:1.05},      // 데스크
  {x:-11, z:-10, hw:3.3, hd:1.1},                                       // 카운터
];
const officeBoxes = [];
for (const z of [-4.5, 1.5]) for (const x of [-8, 0, 8]) officeBoxes.push({x, z, hw:1.8, hd:1.0});
officeBoxes.push({x:15.2, z:8, hw:1.0, hd:1.8});    // 탕비실
officeBoxes.push({x:-15.2, z:-6, hw:.8, hd:1.0});   // 복사기
officeBoxes.push({x:13.8, z:-9.2, hw:2.0, hd:1.0}); // 코너 오피스

function collide(pos, prev){
  const R = .55;
  if (!inOffice){
    pos.x = Math.max(-W+1, Math.min(W-1, pos.x));
    pos.z = Math.max(BACK+1.4, Math.min(FRONT-1, pos.z));
    // 게이트 라인(z=2): 열리기 전엔 통과 불가, 열려도 개구부(|x|<2)로만
    if ((prev.z-2)*(pos.z-2) < 0){
      const open = gateT >= 1;
      if (!(open && Math.abs(pos.x) < 1.9)) pos.z = 2 + (prev.z > 2 ? .45 : -.45);
    }
    for (const c of lobbyCircles){
      const dx = pos.x-c.x, dz = pos.z-c.z, d = Math.hypot(dx,dz), min = c.r+R;
      if (d < min && d > 1e-4){ pos.x = c.x + dx/d*min; pos.z = c.z + dz/d*min; }
    }
    for (const b of lobbyBoxes) pushOutBox(pos, b, R);
  } else {
    pos.x = Math.max(-16, Math.min(16, pos.x));
    pos.z = Math.max(-11, Math.min(11, pos.z));
    for (const b of officeBoxes) pushOutBox(pos, b, R);
  }
}
function pushOutBox(pos, b, R){
  const dx = pos.x - b.x, dz = pos.z - b.z;
  const ox = b.hw + R - Math.abs(dx), oz = b.hd + R - Math.abs(dz);
  if (ox > 0 && oz > 0){
    if (ox < oz) pos.x = b.x + Math.sign(dx||1) * (b.hw + R);
    else pos.z = b.z + Math.sign(dz||1) * (b.hd + R);
  }
}

/* ================= 메인 루프 ================= */
const clock = new THREE.Clock();
let heading = Math.PI;
function animate(){
  requestAnimationFrame(animate);
  const dt = Math.min(clock.getDelta(), .05);
  const t = clock.elapsedTime;

  // 이동
  let moving = false;
  if (cut){                                       // 컷신 자동 걷기
    cut.t += dt;
    const k = Math.min(1, cut.t / cut.dur);
    player.position.x = cut.fx + (cut.tx - cut.fx) * k;
    player.position.z = cut.fz + (cut.tz - cut.fz) * k;
    moving = true;
    if (k >= 1){ const then = cut.then; cut = null; if (then) then(); }
  } else if (!busy && !dlgOpen && !sumOpen && stage !== 'done'){
    const f = (keys.KeyW?1:0) - (keys.KeyS?1:0);
    const s = (keys.KeyD?1:0) - (keys.KeyA?1:0);
    if (f || s){
      const fx = -Math.sin(camYaw), fz = -Math.cos(camYaw);
      const rx = -fz, rz = fx;
      let mx = fx*f + rx*s, mz = fz*f + rz*s;
      const len = Math.hypot(mx, mz); mx/=len; mz/=len;
      const prev = {x:player.position.x, z:player.position.z};
      const pos = {x:prev.x + mx*6.2*dt, z:prev.z + mz*6.2*dt};
      collide(pos, prev);
      player.position.x = pos.x; player.position.z = pos.z;
      const target = Math.atan2(mx, mz);
      let d = target - heading;
      while (d > Math.PI) d -= 2*Math.PI;
      while (d < -Math.PI) d += 2*Math.PI;
      heading += d * Math.min(1, dt*12);
      player.rotation.y = heading;
      moving = true;
    }
  }
  // 걷기/대기 애니메이션
  if (stage !== 'done') player.position.y = moving ? Math.abs(Math.sin(t*10))*.14 : Math.sin(t*2)*.03;
  player.rotation.z = moving ? Math.sin(t*10)*.06 : 0;                  // 걸을 때 좌우로 뒤뚱
  for (const c of coworkers) c.position.y = .52 + Math.sin(t*2 + c.position.x)*.04;

  // 게이트 날개 열림
  if (gateT > 0 && gateT < 1){
    gateT = Math.min(1, gateT + dt*1.6);
    const a = gateT*(2-gateT) * 1.75;             // easeOut
    lobby.userData.wings[0].rotation.y =  a;
    lobby.userData.wings[1].rotation.y = -a;
  }
  // 엘베 문 (양방향 개폐)
  if (lobbyDoorT !== lobbyDoorTarget){
    lobbyDoorT += Math.sign(lobbyDoorTarget - lobbyDoorT) * dt * 1.1;
    lobbyDoorT = Math.max(0, Math.min(1, lobbyDoorT));
    const off = .75 + lobbyDoorT*(2-lobbyDoorT)*1.3;
    lobby.userData.doors[0].position.x = -off;
    lobby.userData.doors[1].position.x =  off;
  }
  if (officeDoorT !== officeDoorTarget){
    officeDoorT += Math.sign(officeDoorTarget - officeDoorT) * dt * 1.1;
    officeDoorT = Math.max(0, Math.min(1, officeDoorT));
    const off = .75 + officeDoorT*(2-officeDoorT)*1.3;
    office.userData.doors[0].position.x = -off;
    office.userData.doors[1].position.x =  off;
  }
  // 카드 태그 연출 (리더기 위로 카드가 내려갔다 올라옴)
  if (tagT > 0 && tagT < 1){
    tagT = Math.min(1, tagT + dt*1.4);
    const card = lobby.userData.tagCard;
    card.position.y = 2.0 - Math.sin(tagT*Math.PI)*.36;
    card.rotation.z = Math.sin(tagT*Math.PI)*.25;
  }

  // 조형물 회전 + 마커 바운스
  lobby.userData.stack.rotation.y = t*.35;
  marker.userData.cone.position.y = .8 + Math.sin(t*3.2)*.18;
  marker.rotation.y = t*1.4;

  // 상호작용 후보 (스테이지 진행 + 미션, 가까운 쪽 우선)
  currentCand = null;
  if (!busy && !cut && !dlgOpen && !sumOpen){
    const px = player.position.x, pz = player.position.z;
    const it = INTERACTS[stage];
    if (it){
      const d2 = (px-it.x)*(px-it.x) + (pz-it.z)*(pz-it.z);
      if (d2 < it.r*it.r) currentCand = {d2, label: it.label, action: doInteract};
    }
    const mc = missionCandidate(px, pz);
    if (mc && (!currentCand || mc.d2 < currentCand.d2)) currentCand = mc;
  }
  if (currentCand){
    promptEl.textContent = currentCand.label;
    promptEl.style.display = 'block';
  } else promptEl.style.display = 'none';

  // 카메라
  const ty = player.position.y + 1.9;
  const cp = Math.cos(camPitch), spt = Math.sin(camPitch);
  camera.position.set(
    player.position.x + Math.sin(camYaw)*camDist*cp,
    ty + camDist*spt,
    player.position.z + Math.cos(camYaw)*camDist*cp
  );
  // 카메라가 벽 밖으로 나가지 않게 방 안쪽으로 클램프
  if (inOffice){
    camera.position.x = Math.max(-16.3, Math.min(16.3, camera.position.x));
    camera.position.y = Math.min(5.9, camera.position.y);
    camera.position.z = Math.max(-11.5, Math.min(11.5, camera.position.z));
  } else {
    camera.position.x = Math.max(-25.3, Math.min(25.3, camera.position.x));
    camera.position.y = Math.min(15.4, camera.position.y);
    camera.position.z = Math.max(BACK+.9, camera.position.z);
  }
  camera.lookAt(player.position.x, ty, player.position.z);

  renderer.render(scene, camera);
}
/* ---- 시작 ---- */
/* 개발용: ?office(12층 시작) ?day=N(날짜 지정) ?yaw=각도(시점) */
const dbgParams = new URLSearchParams(location.search);
if (dbgParams.has('day')) day = Math.max(1, +dbgParams.get('day') || 1);
if (dbgParams.has('yaw')) camYaw = parseFloat(dbgParams.get('yaw')) || 0;
setupDay();
if (day === 1 && !ended){
  setStage('badge');
} else {
  satOnce = true;
  document.getElementById('badge').style.display = 'flex';
  badge3d.visible = true;
  setStage('gate');
  objectiveEl.textContent = `(DAY ${day}) Good morning! Tap the gate and head up to 12F`;
}
if (dbgParams.has('autoride')){          // 개발용: 엘베 시퀀스 자동 검증
  window.RIDE_FAST = true;
  setTimeout(()=>{
    if (dbgParams.has('office')){
      tasks.forEach(t => t.done = true); renderQuest();
      player.position.set(0, 0, 8);
      rideDown();
    } else {
      gateT = 1;
      setStage('elevator');
      player.position.set(0, 0, -15);
      rideElevator();
    }
  }, 1500);
}
if (dbgParams.has('office')){
  lobby.visible = false; office.visible = true; inOffice = true;
  player.position.set(0, 0, 4.6);
  camDist = 7; camPitch = .3;
  document.getElementById('badge').style.display = 'flex';
  badge3d.visible = true;
  if (day === 1 && !ended){ satOnce = false; setStage('desk'); }
  else setStage('free');
}
animate();
