'use strict';
/* 게임 데이터: NPC(온보딩 지식 포함), 스테이지 목표/상호작용, 최종 퀴즈.
   콘텐츠 수정은 대부분 이 파일에서 끝난다. */
/* ================= NPC 정의 (온보딩 지식 포함) ================= */
const NPCS = [
  {species:'dog', name:'Bori', emoji:'🐶', role:'Designer',
   roofLine:'Sunsets are the best color reference. Teal shadows, gold light... nature gets our brand. 🎨',
   reviewLine:'Ohh the mockup! Love the layout. Maybe 10% more gold on the header? Approved! 🎨',
   retroLine:'Good thing this week: you joined us! Keep bringing that energy 🐾',
   intro:["Hi! I'm Bori, the designer 🎨 So nice to meet you!",
          'Our brand colors are "Teal + Gold". You saw the lobby, right? They\'re everywhere~',
          'Design requests are always welcome. Oh, and... this might be on a quiz? 🐾'],
   small:['Feeling great today! 🎨','Sketching 3 mockups~ Teal + gold never fails.','Your fur color is so pretty, Nyang~']},
  {species:'fox', name:'Yeoul', emoji:'🦊', role:'Senior Developer',
   roofLine:'I come up here after every Thursday deploy. Best debugging spot in the building.',
   retroLine:'Retro note: clean deploys, zero rollbacks. You did fine for a rookie.',
   intro:["I'm Yeoul. I write the code around here.",
          'One thing to remember — we deploy every "Thursday". No Friday deploys. Protect the weekend.',
          'Ask me anything about the codebase.'],
   small:['Refactoring... do not touch.','Thursday deploy is ready. Flawless.','Coffee is what makes code quality.']},
  {species:'panda', name:'Pandol', emoji:'🐼', role:'Product Manager',
   roofLine:'A well-planned break is part of the sprint. Glad you found this place.',
   reviewLine:'Structurally solid. Ship it. I\'ll add it to the sprint board.',
   retroLine:'Retro item: onboarding went smoothly. Action item: keep it up next week.',
   intro:["Hello, I'm Pandol, the PM.",
          'Our team runs on "2-week" sprints. Planning on Monday, retro on Friday.',
          "When onboarding wraps up, I'll give you a little quiz. Listen carefully~ 😏"],
   small:['Sorting the schedule: 1) meeting 2) meeting 3) meeting...',"Sprints are 2 weeks! Don't forget.",'Priorities are everything.']},
  {species:'penguin', name:'Pingo', emoji:'🐧', role:'QA Engineer',
   roofLine:'Up here there are... no bugs. Well, except the ladybugs. Those are fine.',
   retroLine:'I only found two bugs today... that\'s a good week in my book.',
   intro:["Oh... hi, I'm Pingo from QA.",
          'If you find a bug, please file it as a "MEOWTRACK" ticket. If you email it... it gets lost.',
          'There are always more edge cases than we think...'],
   small:['Just found 3 bugs... sigh.','Did you check MEOWTRACK?','Have you tested the empty-input case...?']},
  {species:'tiger', name:'Hojin', emoji:'🐯', role:'Data Analyst',
   roofLine:'Fun stat: rooftop visits correlate with +23% afternoon productivity. Enjoy.',
   retroLine:'Week 1 stats: attendance 100%, coffee delivery success rate 100%. Impressive.',
   intro:["Hey rookie! Hojin, the data guy.",
          'Every metric lives on our dashboard "MEOWBOARD". Speak in numbers, listen in numbers.',
          'Not vibes — data. Got it? 🐯'],
   small:["DAU is up 12% today. You're welcome.",'Open MEOWBOARD. Beautiful.','The A/B test? B won. As I predicted.']},
];
const npcByName = {};
for (const n of NPCS) npcByName[n.name] = n;

const OBJECTIVES = {
  badge: 'First, get your badge at the front desk',
  gate: 'Tap your badge on the reader to pass the gate',
  elevator: 'Take the elevator up to your team on 12F',
  desk: 'Welcome to 12F! Find your desk by the window',
  done: 'Clocked in! Time to work, meow 🐾',
  free: 'Clocked in! You can take the elevator down anytime 🐾',
  roof: 'Rooftop garden — take a breather 🌇',
};

const INTERACTS = {
  badge:    {x:-5.6, z:3.8, r:2.5, label:'E: Get your badge', markPos:[-5.6,2.7,2.6]},
  gate:     {x:0, z:3.4,  r:2.6, label:'E: Tap badge to enter', markPos:[0,2.6,2.6]},
  elevator: {x:0, z:-17.6,r:2.8, label:'E: Elevator', markPos:[0,4.9,-18.2]},
  desk:     {x:8, z:3.4,  r:2.6, label:'E: Sit at your desk (clock in)', markPos:[8,3.1,2.8]},
  free:     {x:0, z:9.4,  r:2.8, label:'E: Elevator (leave / rooftop)', markPos:[0,4.9,9.2]},
};

const FINAL_QUIZ = [
  {q:'Final quiz 1/3! Which day do we deploy?', options:['Tuesday','Thursday','Friday'], answer:1, hint:'Yeoul'},
  {q:"2/3! What are MEOW CORP's brand colors?", options:['Red + Black','Purple + Gray','Teal + Gold'], answer:2, hint:'Bori'},
  {q:'Last one, 3/3! Where do you file a bug?', options:['A MEOWTRACK ticket','Email','A sticky note'], answer:0, hint:'Pingo'},
];


/* 요일별 태스크/스크립트 정의 — 새 하루는 여기 등록만 하면 된다.
   tasks는 함수(매일 새 배열), 지원 타입은 game.js missionCandidate/npcTalk 참고. */
const INSPECTS = [
  {id:'inspect_win',    label:'🔦 Check the window blinds',  pos:[0, -10.4],  line:'Blinds down. The city can wait — we ship tonight.'},
  {id:'inspect_pantry', label:'🔦 Refill the coffee machine', pos:[15, 8],    line:'Beans topped up. Fuel for the crunch.'},
  {id:'inspect_copier', label:'🔦 Power-cycle the copier',    pos:[-14.6, -6],line:'Copier rebooted. No paper jams tonight, please.'},
];
const DAYS = {
  1: {title:'First Day', tasks: () => [
    {id:'sit', label:'Sit at your desk'},
    ...NPCS.map(n => ({id:'greet_'+n.name, label:`Say hi to ${n.emoji} ${n.name}`})),
  ]},
  2: {title:'Coffee Run', tasks: () => [
    {id:'coffee', label:'☕ Grab 5 coffees from the pantry'},
    ...NPCS.map(n => ({id:'give_'+n.name, label:`Bring coffee to ${n.emoji} ${n.name}`})),
    {id:'quiz', label:"🐼 Pass Pandol's pop quiz"},
  ]},
  3: {title:'Final Exam', tasks: () => [
    {id:'copier', label:'🛠 Fix the broken copier'},
    {id:'finalquiz', label:"🐼 Pandol's final quiz (3 questions)"},
    {id:'crown', label:'👑 Claim the corner office'},
  ]},
  4: {title:'Monday All-hands', tasks: () => [
    {id:'meeting', label:'📋 Call the all-hands on the rug'},
  ], script: [
    ['Pandol', 'Alright team, week 2! Quick all-hands. Sprint goal: ship the Meow Portal beta by Friday.'],
    ['Yeoul',  'Backend is ready. If nobody touches my branch, we deploy Thursday. As always.'],
    ['Bori',   'New landing mockups are done~ teal and gold, obviously 🎨'],
    ['Pingo',  'I wrote 47 test cases over the weekend... please don\'t break them.'],
    ['Hojin',  'Beta signups are already at 1,200. The data says: hurry up.'],
    ['Pandol', 'Great. Nyang, you\'re running point on reviews this week. Meeting adjourned!'],
  ]},
  5: {title:'Design Review', tasks: () => [
    {id:'mockup', label:'🎨 Grab the mockup from your desk'},
    {id:'show_Bori', label:'🎨 Review it with 🐶 Bori'},
    {id:'show_Pandol', label:'🎨 Get 🐼 Pandol\'s sign-off'},
  ]},
  6: {title:'Crunch Night', tasks: () => [
    ...INSPECTS.map(i => ({id:i.id, label:i.label})),
    {id:'deploy', label:'🚀 Tell 🦊 Yeoul everything is ready'},
  ]},
  7: {title:'Retro Friday', tasks: () => [
    {id:'meeting', label:'📋 Kick off the Friday retro on the rug'},
    ...NPCS.map(n => ({id:'retro_'+n.name, label:`💬 Retro one-on-one with ${n.emoji} ${n.name}`})),
  ], script: [
    ['Pandol', 'Friday retro! One good thing, one thing to improve. Nyang will collect your notes one-on-one.'],
    ['Hojin',  'Spoiler: the numbers were good. Very good.'],
    ['Pandol', 'Save it for the one-on-one~ Go, team!'],
  ]},
};
