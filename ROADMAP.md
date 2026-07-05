# MEOW CORP HQ — 개발 로드맵 & 인수인계 문서

> 다음 세션(Opus 등)에서 이 앱을 이어서 발전시킬 때 반드시 먼저 읽을 것.
> 마지막 업데이트: 2026-07-05

---

## 1. 이 앱이 뭔가

Three.js로 만든 **3D 고양이 출근 시뮬레이션 게임**. 브라우저에서 `index.html` 더블클릭만으로 실행된다(빌드/서버 불필요).

현재 완성된 게임: **"온보딩 위크"** — 3일짜리 신입 온보딩 라이프 심.

- **DAY 1**: 사원증 발급(안내 데스크 토끼) → 게이트 태그 → 엘리베이터로 12층 → 내 자리 착석 → 팀원 5마리에게 인사(각 NPC 대사에 회사 지식이 숨어 있음 = 온보딩 투어)
- **DAY 2**: 탕비실에서 커피 5잔 → 팀원들에게 배달(호감도 ❤️+1) → 판돌(PM)의 깜짝 퀴즈 1문
- **DAY 3**: 고장 난 복사기 수리(E 3번) → 판돌의 최종 퀴즈 3문(전날 대사가 정답) → **승진: 창가 코너 오피스 착석 = 엔딩**
- DAY 4+: 자유 출근 모드

매일 "게이트 태그 → 엘베 → 미션 → 엘베 퇴근 → DAY 요약 → 다음 날" 루프. 진행도는 localStorage 저장.

## 2. 파일 구성

| 파일 | 내용 |
|---|---|
| `index.html` | 게임 전체 (HTML + CSS + JS 단일 파일, ~1300줄) |
| `three.min.js` | Three.js **r147 UMD** 빌드 (로컬 사본) |
| `GLTFLoader.js` | Three.js r147 examples UMD 로더 |
| `kenney-assets.js` | Kenney 에셋 base64 임베드 (~2.5MB): `KENNEY_B64`(모듈러 빌딩 7채 + colormap), `PETS_B64`(큐브펫 12종 + colormap) |

원본 에셋 위치(추가 임베드 시 사용):
- `~/dev/assets/kenney_cube-pets_1.0/Models/GLB format/` — 동물 24종 (미사용: lion, polar, koala…12종만 임베드됨)
- `~/dev/assets/kenney_modular-buildings/Models/GLB format/` — 건물 모듈 108종 (샘플 7채만 임베드됨)
- 그 외 `~/dev/assets/kenney_*` 에 city-kit, nature-kit, food-kit, car-kit, train-kit, interface-sounds(효과음!) 등 다수 — 전부 CC0

## 3. 핵심 기술 결정 (변경 시 주의)

1. **Three.js r147 고정**: UMD 빌드(`<script src>`)가 존재하는 마지막 계열. r148+는 examples/js UMD가 삭제되어 GLTFLoader를 이 방식으로 못 쓴다. **모듈 방식으로 올리면 file:// 더블클릭 실행이 깨진다** — 올리려면 번들러 도입까지 세트로 해야 함.
2. **에셋 base64 임베드**: GLB의 `Textures/colormap.png` 참조는 `LoadingManager.setURLModifier`로 data URI로 치환한다. 빌딩과 펫이 **서로 다른 colormap**을 쓰므로 로더(매니저)를 분리해 둠 — 합치면 색이 깨진다.
3. **텍스처는 전부 Canvas 생성**(`canvasTex`): 바닥 균열, 우드 패널, 야경 창문, 텍스트(`textPlane`). 외부 이미지 의존 없음.
4. **금속 반사**: PMREMGenerator로 작은 env scene을 구워 `scene.environment`에 넣음. 이걸 지우면 금색/은색이 죽는다.
5. **펫 모델 규약**: `makePet(name, height, onReady)` — 발이 y=0, 정면 +z로 정규화됨. `userData.depth/width`에 몸 치수 저장(사원증 부착 등에 사용). 캐릭터는 절대 직접 스케일하지 말고 height 파라미터로.

## 4. 코드 구조 (index.html 내 섹션 주석 기준)

- `기본 셋업` — renderer(sRGB+ACES, 그림자), fog, 환경맵
- `재질/텍스처` — `MAT` 딕셔너리, canvasTex 헬퍼
- `캐릭터` — b64ToBuf, petLoader, makePet
- `로비 (1층)` — 벽/선반/피규어/토러스 조형물/게이트+리더기/엘베 칸(내부 있음)
- `바깥 풍경` — 유리 파사드, 도로/가로등, Kenney 건물 7채 (lobby 그룹 소속 → 12층에선 자동 숨김)
- `NPC 정의` — `NPCS` 배열: name/emoji/role/**intro(온보딩 지식 포함)**/small(스몰토크)
- `사무실 (12층)` — 책상/동료/탕비실/복사기/코너오피스/엘베 칸
- `전역 조명`, `플레이어 & 마커`
- `게임 상태` — stage 머신: `badge → gate → elevator → desk → done → free`
  - `rideElevator()`/`rideDown()`: 문 개폐(doorTarget) + `walkTo` 컷신 + 층수 카운트 + 씬 스왑
- `온보딩 위크` — day/tasks/hearts, `setupDay/taskDone/renderQuest/updateMission`(마커·목표 갱신), `say()` 대화 박스(선택지=퀴즈), `npcTalk`, `missionCandidate`(근접 상호작용 후보), `showDaySummary/nextMorning`
- `입력` — E는 `currentCand.action()` 실행. 우선순위: 요약화면 > 대화창 > 후보
- `충돌` — 원형(기둥/포디움) + AABB(`lobbyBoxes/officeBoxes`) 푸시아웃, 게이트 라인 통과 제어, 카메라 벽 클램프
- `메인 루프` — 이동/컷신, 문 애니, 후보 스캔, 카메라

### 상태 머신 주의점
- `stage`는 "메인 진행"만 담당. 미션 상호작용(NPC 대화, 커피, 복사기)은 `missionCandidate()`가 별도로 스캔해서 **가까운 쪽이 이긴다**.
- `satOnce`: 착석 미션은 DAY 1만. 이후 도착하면 바로 `free`.
- 아침마다 `gateT=0` + 날개 회전/LED 리셋 → 매일 다시 태그.
- 대화/요약 중 이동 잠금: `dlgOpen`, `sumOpen` (이동 조건과 후보 스캔 양쪽에 걸려 있음).

### 디버그 파라미터 (개발 필수)
- `?office` — 12층에서 시작
- `?day=2` / `?day=3` — 날짜 점프 (저장 안 건드림)
- `?yaw=3.14` — 초기 카메라 각도
- 저장 리셋: DAY 요약 화면에서 R, 또는 콘솔에서 `localStorage.clear()`

## 5. 검증 방법 (이 워크플로를 꼭 쓸 것)

수정 후 headless Chrome으로 스크린샷 + 콘솔 확인:

```bash
python3 -m http.server 8137 &   # file://로는 헤드리스가 안 열림
"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" \
  --headless=new --use-angle=swiftshader --enable-unsafe-swiftshader \
  --enable-logging=stderr --window-size=1600,900 --virtual-time-budget=9000 \
  --screenshot=/tmp/shot.png "http://localhost:8137/index.html?office&day=2"
```

- `--disable-gpu`를 쓰면 WebGL이 죽는다. 반드시 swiftshader 플래그로.
- `KHR_texture_transform` 경고와 `ReadPixels` 경고는 무해하니 무시.
- 최소 4개 화면 확인: 로비(기본), `?yaw=3.14`(바깥 풍경), `?office`(12층), `?office&day=3`.

## 6. 히스토리 (이미 시도했다 제거된 것)

**에이전트 오피스 + LLM 대화** 기능을 한 번 구현했다가 사용자 요청으로 **전부 삭제**했다. 내용: NPC마다 페르소나를 주고 Anthropic API 직접 호출(`anthropic-dangerous-direct-browser-access` 헤더로 브라우저에서 CORS 통과, 키는 localStorage), 채팅 패널, 머리 위 이름표/말풍선(3D→2D 프로젝션), 회의 소집(NPC들이 러그로 걸어와 순서대로 발언). **다시 원하면 git 히스토리는 없지만(저장소 아님) 이 패턴을 재구현하면 된다.** 단, 사용자가 명시적으로 원할 때만.

## 7. 발전 방향 (우선순위 순)

### 7.1 단기 — 게임 완성도 (반나절 단위 작업)

1. **효과음 교체**: 현재 WebAudio 비프음. `kenney_interface-sounds`(CC0)를 base64 임베드해 발소리/문/정답/오답/커피 사운드로 교체. BGM은 WebAudio 루프로 가볍게.
2. **아침 로비 이벤트**: 매일 아침 로비에 랜덤 연출 — 다른 동물 직원들이 게이트를 통과해 출근 중(walkTo 재활용), 안내 데스크 대사 변화, 날씨(창밖 비/맑음 = 파사드 셰이더 대신 파티클).
3. **NPC 일상 연기**: 지금은 앉아서 까딱거리기만 함. 주기적으로 자리에서 일어나 탕비실/복사기/동료 자리로 걸어갔다 오는 idle 루틴(`walkTo` 컷신 시스템을 NPC용으로 일반화 — 이전에 npcCuts 패턴으로 한 번 구현했었음).
4. **햅틱한 디테일**: 착석 시 의자 회전, 커피 들고 다닐 때 손(발?)에 컵 메시 부착, 게이트 통과 시 "삑" + 초록 파티클.
5. **모바일 대응**: 가상 조이스틱 + 터치 상호작용 버튼. CSS는 이미 반응형에 가까움.

### 7.2 중기 — 콘텐츠 확장

1. **층 추가** (엘리베이터 UI를 층 선택 패널로 확장):
   - 3F 인사팀: 연차 신청 미니 퀘스트, 새 사원증 사진 찍기
   - B1 서버실: 어두운 조명 + 손전등 효과, "서버 재부팅" 미니게임
   - RF 옥상 정원: nature-kit 에셋, 낮/노을 하늘, 힐링 공간(호감도 높은 NPC가 올라와 개인 스토리 대화)
   - 구현: 씬 그룹을 `floors = {1: lobby, 12: office, ...}` 맵으로 리팩토링하고 `rideTo(floor)` 하나로 통합 (지금은 rideElevator/rideDown 두 함수에 하드코딩)
2. **DAY 4~7 콘텐츠**: 요일별 이벤트 — 월(전체회의: 러그에 모두 집합), 화(디자인 리뷰), 수(배포 전날 야근, 조명 어두워짐), 목(배포일 긴장 이벤트), 금(회고 + 주간 보너스). `setupDay()`에 day별 분기만 추가하면 되는 구조.
3. **호감도 심화**: ❤️ 3개 도달 시 NPC 개인 퀘스트 해금(예: 핑고의 잃어버린 버그 티켓 찾기). 호감도별 스몰토크 대사 풀 확장.
4. **수집 요소**: 로비 선반의 동물 피규어를 클릭해 도감 등록. 미임베드 동물 12종(lion, polar, cow, elephant…)을 추가 임베드해 희귀 피규어로.
5. **엔딩 확장**: 코너 오피스 이후 "사장실"(신규 층) 최종 엔딩, 엔딩 크레딧 롤.

### 7.3 장기 — 방향성 옵션 (사용자와 상의 후 선택)

- **A. 진짜 온보딩 도구화** (아이디어 4번의 완성형): 퀴즈/NPC 대사를 JSON 설정 파일로 외부화 → 실제 회사 문서 기반으로 교체 가능하게. 나아가 LLM+RAG로 NPC가 사내 문서를 답하게(6장의 제거된 패턴 재활용). 관리자용 "코스 편집" 화면.
- **B. 에이전트 오피스 부활** (아이디어 1번): 6장 참조. 멀티 에이전트 시각화 대시보드로 발전 — Claude Code 서브에이전트 로그를 WebSocket으로 받아 동물들이 실시간으로 일하는 모습 렌더.
- **C. 순수 게임 심화**: 스탯(피로도/커피 게이지), 시간 시스템(사내 시계, 지각 페널티), 급여/상점(책상 꾸미기 — 소품 구매), 멀티 엔딩.

### 7.4 리팩토링 부채 (콘텐츠 확장 전 권장)

- `index.html`이 단일 파일 ~1300줄. **층 추가 전에** 최소한 `game.js`(로직) / `world.js`(씬 빌드) / `data.js`(NPC·대사·퀴즈·태스크)로 분리 권장. file:// 호환을 위해 일반 `<script>` 다중 로드 방식 유지(모듈 금지).
- 대사/퀴즈/태스크가 코드에 하드코딩 — `data.js`의 선언적 구조로 빼면 콘텐츠 추가가 쉬워진다.
- `rideElevator/rideDown` 중복 → `rideTo(fromFloor, toFloor)` 통합.
- 매직 넘버(좌표) 산재 — 층별 레이아웃 상수 객체로.

## 8. 함정 목록 (같은 실수 반복 금지)

- 카메라가 벽 뒤로 나가면 회색 화면 — 새 방을 만들면 **반드시 카메라 클램프 범위 추가** (`애니메이트 루프의 카메라 클램프` 부분).
- 새 가구/프롭 추가 시 `officeBoxes`/`lobbyBoxes`에 충돌 박스도 같이 추가할 것.
- 엘리베이터가 있는 벽은 **개구부를 뚫어야**(벽 3분할) 문이 열렸을 때 칸 내부가 보인다. 프레임을 통짜 박스로 만들면 막힌다.
- 큐브펫은 정면이 곧 얼굴 — 몸에 뭘 붙일 때 정면(+z)에 붙이면 얼굴에 붙은 것처럼 보인다(사원증을 옆구리로 옮긴 이유).
- `?day=` 디버그로 테스트한 뒤 localStorage에 저장된 진행도와 헷갈리지 말 것(디버그 파라미터는 저장 안 함).
- 대사·목표 텍스트는 전부 한국어. 사용자 커밋 규칙: 커밋 메시지는 영어, Co-Authored-By 금지 (현재 git 저장소 아님 — init 여부는 사용자에게 물어볼 것).
