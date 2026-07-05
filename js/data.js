'use strict';
/* 게임 데이터: NPC(온보딩 지식 포함), 스테이지 목표/상호작용, 최종 퀴즈.
   콘텐츠 수정은 대부분 이 파일에서 끝난다. */
/* ================= NPC 정의 (온보딩 지식 포함) ================= */
const NPCS = [
  {species:'dog', name:'Bori', emoji:'🐶', role:'Designer',
   intro:["Hi! I'm Bori, the designer 🎨 So nice to meet you!",
          'Our brand colors are "Teal + Gold". You saw the lobby, right? They\'re everywhere~',
          'Design requests are always welcome. Oh, and... this might be on a quiz? 🐾'],
   small:['Feeling great today! 🎨','Sketching 3 mockups~ Teal + gold never fails.','Your fur color is so pretty, Nyang~']},
  {species:'fox', name:'Yeoul', emoji:'🦊', role:'Senior Developer',
   intro:["I'm Yeoul. I write the code around here.",
          'One thing to remember — we deploy every "Thursday". No Friday deploys. Protect the weekend.',
          'Ask me anything about the codebase.'],
   small:['Refactoring... do not touch.','Thursday deploy is ready. Flawless.','Coffee is what makes code quality.']},
  {species:'panda', name:'Pandol', emoji:'🐼', role:'Product Manager',
   intro:["Hello, I'm Pandol, the PM.",
          'Our team runs on "2-week" sprints. Planning on Monday, retro on Friday.',
          "When onboarding wraps up, I'll give you a little quiz. Listen carefully~ 😏"],
   small:['Sorting the schedule: 1) meeting 2) meeting 3) meeting...',"Sprints are 2 weeks! Don't forget.",'Priorities are everything.']},
  {species:'penguin', name:'Pingo', emoji:'🐧', role:'QA Engineer',
   intro:["Oh... hi, I'm Pingo from QA.",
          'If you find a bug, please file it as a "MEOWTRACK" ticket. If you email it... it gets lost.',
          'There are always more edge cases than we think...'],
   small:['Just found 3 bugs... sigh.','Did you check MEOWTRACK?','Have you tested the empty-input case...?']},
  {species:'tiger', name:'Hojin', emoji:'🐯', role:'Data Analyst',
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
};

const INTERACTS = {
  badge:    {x:-5.6, z:3.8, r:2.5, label:'E: Get your badge', markPos:[-5.6,2.7,2.6]},
  gate:     {x:0, z:3.4,  r:2.6, label:'E: Tap badge to enter', markPos:[0,2.6,2.6]},
  elevator: {x:0, z:-17.6,r:2.8, label:'E: Take elevator to 12F', markPos:[0,4.9,-18.2]},
  desk:     {x:8, z:3.4,  r:2.6, label:'E: Sit at your desk (clock in)', markPos:[8,3.1,2.8]},
  free:     {x:0, z:9.4,  r:2.8, label:'E: Leave work (elevator)', markPos:[0,4.9,9.2]},
};

const FINAL_QUIZ = [
  {q:'Final quiz 1/3! Which day do we deploy?', options:['Tuesday','Thursday','Friday'], answer:1, hint:'Yeoul'},
  {q:"2/3! What are MEOW CORP's brand colors?", options:['Red + Black','Purple + Gray','Teal + Gold'], answer:2, hint:'Bori'},
  {q:'Last one, 3/3! Where do you file a bug?', options:['A MEOWTRACK ticket','Email','A sticky note'], answer:0, hint:'Pingo'},
];
