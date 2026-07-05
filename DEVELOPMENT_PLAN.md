# MEOW CORP HQ — 단계별 개발 계획서

> **✅ 2026-07-06: M1~M5 전부 구현 완료.** 라이브: https://gridnflow.github.io/kitty_onboarding/
> 이 문서는 이제 완료 기록이자, 백로그(하단) 착수 시의 참고 자료다.

> ROADMAP.md가 "현재 구조와 방향"이라면, 이 문서는 **"다음에 무엇을 어떤 순서로 어떻게 구현할지"**의 실행 계획이다.
> 각 마일스톤은 독립적으로 배포 가능하며, 완료 기준(AC)을 만족하면 커밋/푸시한다.
> 작성일: 2026-07-05

---

## 전체 그림

```
M1 감각 품질(사운드/연출)  →  M2 멀티 플로어 아키텍처  →  M3 주간 콘텐츠(DAY 4~7)
                                        ↓
        M5 배포/공유(GitHub Pages)  ←  M4 호감도·수집 시스템
```

원칙:
- 한 마일스톤 = 한 PR/커밋 묶음. 마일스톤 중간에 다른 마일스톤 작업을 섞지 않는다.
- 모든 마일스톤에서 **file:// 더블클릭 실행 유지**가 최우선 제약이다.
- 새 콘텐츠(대사/태스크/퀴즈)는 반드시 `js/data.js`에 선언적으로 추가한다. 로직 파일에 문자열 하드코딩 금지.

---

## ✅ M1. 감각 품질 — 사운드 & 연출 (완료)

현재 비프음뿐이라 가장 체감 효과가 크다.

### 작업
1. `kenney_interface-sounds`에서 8개 내외 선별(클릭, 확인, 오류, 삑, 종) + `kenney_impact-sounds`가 없으므로 발소리는 비프 저음 유지 or 생략.
   - OGG를 base64로 `sounds.js`에 임베드 (kenney-assets.js와 같은 패턴, `SND_B64 = {...}`)
   - `playSnd(name, volume)` 헬퍼: `Audio` 태그 대신 WebAudio `decodeAudioData` + 버퍼 캐시 (반복 재생 시 지연 없음)
2. 이벤트 매핑: 게이트 태그(삑+성공음), 문 개폐, 퀴즈 정답/오답, 태스크 완료(renderQuest에서), 커피 획득, 승진 팡파르, DAY 요약 등장.
3. 연출 소품:
   - 게이트 통과 시 초록 파티클 6~8개 (작은 plane, 1초 후 제거)
   - 커피 들고 다닐 때 플레이어 옆에 컵 미니 메시 부착 (badge3d 패턴 재사용, `coffees > 0`일 때만 visible)
   - 착석 시 의자 방향으로 카메라 살짝 회전

### AC
- 소리 없는 기존 이벤트 전부에 사운드가 붙고, 음소거 토글(M 키)이 있다.
- `?autoride` 검증 통과, 콘솔 에러 0.

## ✅ M2. 멀티 플로어 아키텍처 (완료) ★ 이후 모든 확장의 기반

### 설계
지금은 lobby/office 2개 그룹 + rideElevator/rideDown 하드코딩. 이걸 일반화한다.

```js
// world.js
const FLOORS = {
  1:  {group: lobby,  label: '1F · Lobby',    spawn: [0, -21.2], exit: [0, -15.5],
       doors: () => lobby.userData.doors,  camAfter: {yaw: Math.PI, dist: 8},
       bounds: {x: [-25, 25], z: [-19, 21]}, camClamp: {...}},
  12: {group: office, label: '12F · Our Team', spawn: [0, 13.4], exit: [0, 6.0], ...},
  // 새 층은 여기에 등록만 하면 된다
};
```

### 작업
1. `rideSequence` → `rideTo(targetFloor)`: FLOORS에서 출발/도착 설정을 읽어 처리. `currentFloor` 전역 도입.
2. 충돌/카메라 클램프도 FLOORS 데이터에서 읽도록 `collide()` 리팩토링 (지금은 `inOffice` boolean 분기 — 층이 3개 되면 못 버틴다).
3. 엘리베이터 층 선택 UI: E 누르면 층 버튼 패널(HTML) 표시 → 선택 시 `rideTo(n)`. 미해금 층은 잠금 아이콘.
4. 신규 층 1개로 검증: **RF 옥상 정원** (작게 시작)
   - `kenney_nature-kit`에서 나무/벤치/덤불 5~6종 임베드
   - 하늘: 노을 그라데이션 캔버스 텍스처 돔
   - 콘텐츠: 벤치에 앉기(휴식), 호감도 최고 NPC가 랜덤 등장해 개인 대화 1편

### AC
- 1F ↔ 12F ↔ RF 어떤 조합으로도 이동 가능, 각 층에서 카메라/충돌 정상.
- Node 스텁 테스트(`ROADMAP.md 4장 팁`)를 `rideTo` 범용 버전으로 갱신해 통과.
- 층 추가 절차가 "FLOORS 등록 + 그룹 빌드 함수 + data.js 콘텐츠"만으로 끝남을 새 층으로 증명.

## ✅ M3. 주간 콘텐츠 — DAY 4~7 (완료)

### 작업
1. `setupDay()`의 태스크 정의를 `js/data.js`의 `DAYS` 선언으로 이동:
   ```js
   const DAYS = {
     4: {title:'Monday All-hands', tasks:[{id:'meeting', label:'📋 Join the all-hands on the rug'}, ...]},
     5: {title:'Design Review', ...},
     6: {title:'Crunch Night', ...},   // 조명 어둡게 + 야근 연출
     7: {title:'Retro Friday', ...},   // 주간 회고 + 보너스
   };
   ```
2. 신규 미션 타입 3종 구현 (missionCandidate에 타입 핸들러 추가):
   - `gather`: 특정 위치에 NPC들이 모임(전체회의) — NPC 걷기 시스템 필요(아래 3번)
   - `deliver`: 아이템 들고 특정 NPC에게 (커피 패턴 일반화)
   - `inspect`: 오브젝트 N개 순회 점검 (야근일 소등 점검 등)
3. **NPC 걷기 시스템**: `npcWalkTo(npc, x, z, dur)` — 플레이어 walkTo와 동일한 보간 + npcCuts 배열 처리(메인 루프). 전체회의·퇴근 연출에 사용.
4. DAY 7 종료 시 "Week 1 Complete" 요약(호감도 총합, 완료율) + 2주차는 자유 모드.

### AC
- DAY 1~7 연속 플레이(?day= 점프로 스팟 확인)에서 태스크·마커·요약 모두 정상.
- data.js만 수정해서 가상의 DAY 8을 10분 안에 추가할 수 있다(구조 검증).

## ✅ M4. 호감도·수집 심화 (완료)

### 작업
1. 호감도 티어: ❤️×3 도달 시 NPC 개인 퀘스트 해금 — data.js에 `personalQuest` 필드(대사 시퀀스 + 미션 1개 + 보상).
   - 예: Pingo의 잃어버린 MEOWTRACK 티켓 찾기(사무실 어딘가 반짝이는 소품 클릭).
2. 스몰토크 풀을 호감도 구간별로 분리(`small0/small2/small3`).
3. 피규어 도감: 로비 선반 피규어에 근접 E → "Collected!" → 도감 패널(F 키)에 등록. 미임베드 동물 12종 추가 임베드, 희귀도 표시.
4. 저장 스키마 버전 필드 도입: `meow_save_v2 = {day, hearts, figures, quests}` — 마이그레이션 함수 포함(기존 키 읽어서 승계).

### AC
- 개인 퀘스트 1개 이상 완주 가능, 도감 24종 수집 가능, 새 저장 스키마로 이전 진행도 유실 없음.

## ✅ M5. 배포/공유 (완료)

1. **GitHub Pages 활성화**: 빌드가 없으므로 `main` 루트 서빙이면 끝. `gh api repos/gridnflow/kitty_onboarding/pages -f 'source[branch]=main' -f 'source[path]=/'` 또는 저장소 설정에서.
2. README.md 작성(영어): 스크린샷 2장, 플레이 링크, 조작법, 크레딧(Kenney CC0, Three.js MIT).
3. OG 메타 태그 + 파비콘(고양이 이모지 SVG) 추가 — 링크 공유 시 미리보기.
4. 라이트한 성능 패스: `renderer.setPixelRatio` 상한 확인, 그림자 맵 해상도, 모바일에서 fps 확인.

### AC
- 공개 URL에서 게임이 그대로 돌아가고, README에 플레이 링크가 있다.

---

## 백로그 (마일스톤 미배정)

- 모바일 가상 조이스틱 + 터치 E 버튼
- 아침 로비 랜덤 이벤트(다른 직원 출근 행렬, 날씨)
- B1 서버실(손전등 연출) / 3F 인사팀 층
- 스탯 시스템(피로도/커피 게이지), 사내 시계와 지각 페널티
- 책상 꾸미기 상점(급여 화폐)
- LLM 레이어 부활(ROADMAP 6장 패턴) — **사용자가 명시적으로 요청할 때만**
- 온보딩 도구화: data.js를 JSON 외부 파일로, 관리자 편집 화면

## 작업 시 반복 체크리스트 (매 마일스톤 공통)

1. 콘텐츠는 data.js, 로직은 game.js, 씬은 world.js — 경계 침범 없는지
2. 새 방/프롭 → 충돌 박스 + 카메라 클램프 추가했는지 (ROADMAP 8장 함정 목록)
3. headless 스크린샷 4종 + 콘솔 에러 0 (ROADMAP 5장 명령어)
4. 엘베/컷신 로직 변경 시 Node 스텁 테스트
5. `?day=`/`?office`/`?autoride`로 회귀 확인 후, 실제 브라우저에서 1회 통플레이
6. 영어 텍스트만 추가, 커밋 메시지 영어·Co-Authored-By 금지, main에 푸시
