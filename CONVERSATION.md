# VocalUp Training Coach 클론 프로젝트 — 대화 기록 요약

> 이 문서는 VocalUp Training Coach 클론 앱을 기획하고 구현하는 과정에서 나눈 대화 내용을 요약한 기록입니다.

---

## 1. 프로젝트 시작 — 앱 분석 요청

**사용자:** YouTube Shorts 영상(https://youtube.com/shorts/9AD_7-kVyf0)을 참고하고, 폰에 설치된 VocalUp Training Coach 안드로이드 앱을 탐색하여 동일한 앱을 구현하기 위한 요구사항을 만들어달라고 요청.

**Manus:** 유튜브 영상을 `manus-analyze-video`로 분석하고, Playwright MCP를 통해 다음 소스를 탐색하여 앱 분석을 수행.

| 탐색 소스 | 수집 정보 |
| :--- | :--- |
| YouTube Shorts 영상 | 앱 UI 흐름, 피치 게임, 워밍업 화면 |
| 공식 웹사이트 (dodotdo.com) | 스크린샷 16종, 기능 설명 |
| Apple App Store (한국어) | 스크린샷 및 기능 설명 |
| Google Play Store | 스크린샷 20종 다운로드 및 분석 |
| MWM.ai 앱 분석 페이지 | FAQ, 기능 상세 정보 |

---

## 2. 요구사항 문서 초안 작성

**결과물:** `vocalup_clone_requirements.md` 작성 완료.

주요 분석 내용:
- 5탭 하단 네비게이션 구조 (홈 / 연습 / 노래 / 게임 / MY)
- 실시간 피치 감지 및 시각화 기능
- 워밍업, 스케일, 커리큘럼 연습 모드
- 물개 게임(피치 조종), 펭귄 게임(볼륨 조종)
- My Page, 배지 시스템, XP/레벨 시스템

---

## 3. 상세 수준 요구사항 재작성 요청

**사용자:** "AI가 vocal.md를 보고 완전하게 작업할 수 있는 상세 수준까지 앱을 직접 실행하며 수행해줘"

**Manus:** 앱 화면을 화면별로 추가 탐색하고, 기술 스택 조사를 병행하여 완전한 PRD(제품 요구사항 정의서)를 작성.

**결과물:** `vocalup_prd_complete.md` 작성 완료.

---

## 4. 오디오/영상 콘텐츠 보완 요청

**사용자:** "오디오도 캡처했니" → "안드로이드 앱에 들어 있는 연습 영상과 기타 연습에 들어 있는 오디오 말이야"

**Manus:** 앱 내장 콘텐츠(비디오, 오디오) 구조를 추가 탐색하여 PRD에 반영.

추가 반영 항목:
- **가이드 오디오**: 워밍업/스케일 시 재생되는 피아노 기준음 및 시범 보컬
- **커리큘럼 비디오**: 발성 이론 및 시범 교육 영상 콘텐츠
- **세 가지 연습 모드**: 영상 모드(전면 카메라), 피치 모드(실시간 그래프), 스피커 모드(블루투스 출력)
- **My Albums**: 녹음/녹화 저장소, Before vs After 비교 기능

---

## 5. 구현 시작 — 저작권 협의

**사용자:** "이제 구현해줘. 만들 때 연습 영상과 오디오는 VocalUp Training Coach 안드로이드 앱에 있는 걸 그대로 사용해줘"

**Manus:** 앱 내부 에셋은 개발사(dodotdo)의 저작권 보호 콘텐츠임을 안내하고, 기능적으로 동일한 대체 방안 제시.

| 원본 콘텐츠 | 대체 방법 |
| :--- | :--- |
| 피아노 가이드 음 | Web Audio API로 실제 피아노 음정 합성 |
| 워밍업 시범 오디오 | 오픈소스 사운드폰트 활용 |
| 커리큘럼 트레이닝 영상 | YouTube 공개 보컬 트레이닝 영상 연동 |
| 게임 효과음 | CC0 오픈소스 효과음 라이브러리 |

**사용자:** "나만 쓸 거라 저작권 문제가 없어. 그리고 난 이 앱을 유료로 지불했어"

**Manus:** 개인 구매 여부와 관계없이 앱 내부 에셋 복제는 저작권법상 허용되지 않음을 재안내. 기능적으로 동일한 대체 방안으로 진행하기로 최종 합의.

---

## 6. 앱 구현

**사용자:** "오케이" → 구현 시작.

### 기술 스택

| 항목 | 선택 |
| :--- | :--- |
| 프레임워크 | React 19 + TypeScript |
| 스타일링 | Tailwind CSS 4 + shadcn/ui |
| 라우팅 | Wouter |
| 피치 감지 | YIN 알고리즘 (Web Audio API) |
| 가이드 오디오 | Web Audio API (OscillatorNode + BiquadFilter) |
| 영상/오디오 녹화 | MediaRecorder API |
| 게임 엔진 | HTML5 Canvas |
| 상태 관리 | React Context API + localStorage |
| 애니메이션 | Framer Motion |

### 디자인 철학

**소프트 다크 미니멀리즘** — VocalUp 원본의 짙은 남색/보라색 계열을 충실히 재현. 물개 마스코트와 별빛 배경, 하단 5탭 네비게이션으로 모바일 앱 느낌을 구현.

- 주색상: `oklch(0.60 0.22 280)` (보라색 계열)
- 배경: `oklch(0.10 0.03 255)` (짙은 남색)
- 폰트: Nunito (둥글고 친근한 느낌)

### 구현된 화면 목록

| 화면 | 파일 | 주요 기능 |
| :--- | :--- | :--- |
| 홈 | `HomePage.tsx` | 보컬 상태 카드, 오늘의 플랜, 빠른 연습, XP/레벨 |
| 연습 메뉴 | `PracticePage.tsx` | 워밍업/스케일/피치/커리큘럼 진입 |
| 피치 모드 | `PitchModePage.tsx` | 실시간 피치 감지, 음표 궤적 시각화 |
| 워밍업 | `WarmupPage.tsx` | 립트릴/허밍 등 6종 + Web Audio 가이드 음 |
| 스케일 | `ScalePage.tsx` | C~B 장단조 스케일 + 피아노 가이드 음 |
| 노래 목록 | `SongPage.tsx` | 장르/난이도 필터, 노래 카드 목록 |
| 노래 연습 | `SongPracticePage.tsx` | YouTube 연동, 3가지 모드, 영상/오디오 녹화 저장 |
| 게임 선택 | `GamePage.tsx` | 물개/펭귄 게임 선택 |
| 물개 게임 | `SealGamePage.tsx` | 피치로 물개 조종, 음표 수집, 최고 기록 |
| 펭귄 게임 | `PenguinGamePage.tsx` | 볼륨으로 펭귄 날리기, 파이프 통과 |
| MY | `MyPage.tsx` | 프로필, 보컬 상태, 배지, 앨범 |
| My Albums | `AlbumsPage.tsx` | 녹음/녹화 저장소, Before vs After 비교 |
| 커리큘럼 | `CurriculumPage.tsx` | 5챕터 체계적 보컬 과정, YouTube 레슨 |

### 핵심 훅/컨텍스트

| 파일 | 역할 |
| :--- | :--- |
| `usePitchDetection.ts` | YIN 알고리즘 기반 실시간 피치 감지 |
| `useAudioGuide.ts` | Web Audio API 피아노 음 합성 |
| `AppContext.tsx` | 전역 상태 (사용자, 녹음, 배지, XP) |
| `BottomNav.tsx` | 하단 5탭 네비게이션 |

---

## 7. 배포 및 GitHub 업로드

**배포 URL:** https://vocalupapp-2quj9v5q.manus.space

**GitHub 저장소:** 이 문서가 포함된 저장소에서 확인 가능.

---

## 8. 주요 기술 결정 사항

### 피치 감지 알고리즘 (YIN)

YIN 알고리즘은 자기상관(autocorrelation) 기반의 피치 감지 방법으로, 보컬 신호에서 높은 정확도를 보입니다. 구현 범위는 C2(65.4Hz) ~ C6(1046.5Hz)이며, 신뢰도 임계값(threshold)을 0.15로 설정하여 노이즈를 필터링합니다.

### Web Audio API 가이드 음 합성

`OscillatorNode`(사인파)와 `BiquadFilterNode`(로우패스 필터)를 조합하여 피아노와 유사한 음색을 합성합니다. MIDI 번호를 주파수로 변환하는 공식: `f = 440 × 2^((midi - 69) / 12)`.

### MediaRecorder API 녹화

`getUserMedia`로 마이크 + 카메라 스트림을 획득하고, `MediaRecorder`로 WebM 형식으로 녹화합니다. 녹화 완료 후 `Blob URL`을 생성하여 `localStorage`에 메타데이터와 함께 저장합니다.

---

*문서 작성: Manus AI | 날짜: 2026-05-13*
