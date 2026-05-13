# VocalUp Training Coach — 클론 프로젝트

> VocalUp Training Coach 앱과 동일한 기능 및 UI/UX를 구현한 보컬 트레이닝 웹앱입니다.

![VocalUp Clone Preview](https://vocalupapp-2quj9v5q.manus.space)

---

## 🎤 주요 기능

### 홈 화면
- 보컬 상태 4종 카드 (음역대, 폐활량, 발음, 음색)
- 오늘의 플랜 (워밍업 → 스케일 → 피치 모니터링)
- XP / 레벨 / 연속 스트릭 시스템
- 빠른 연습 바로가기

### 연습 탭
- **워밍업**: 립 트릴, 허밍, 텅 트릴, 시렌, 모음 스트레칭, 브레스 컨트롤 (6종)
- **스케일**: C~B 장조/단조 스케일 (Web Audio API 피아노 가이드 음 포함)
- **피치 모드**: 실시간 피치 감지 및 음표 궤적 시각화
- **커리큘럼**: 5챕터 체계적 보컬 과정 (YouTube 레슨 연동)

### 노래 탭
- 장르/난이도별 노래 필터링
- **3가지 연습 모드**: 영상 모드(전면 카메라 녹화), 피치 모드(실시간 그래프), 스피커 모드
- YouTube 영상 연동
- 영상 및 오디오 녹화 저장

### 게임 탭
- **물개 게임**: 목소리 높낮이(피치)로 물개를 조종하여 음표 수집
- **펭귄 게임**: 목소리 크기(볼륨)로 펭귄을 날려 파이프 통과
- 최고 기록 로컬 저장

### MY 탭
- 프로필 (레벨, XP, 연속 스트릭, 총 연습 시간)
- 보컬 상태 상세 (음역대, 폐활량, 발음, 음색 점수)
- **My Albums**: 녹음/녹화 저장소
- **Before vs After**: 두 녹음 비교 기능
- 배지 시스템 (12종)

---

## 🛠 기술 스택

| 항목 | 기술 |
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
| 빌드 도구 | Vite 7 |
| 패키지 매니저 | pnpm |

---

## 📁 프로젝트 구조

```
client/
  src/
    pages/
      HomePage.tsx          # 홈 화면
      PracticePage.tsx       # 연습 메뉴
      PitchModePage.tsx      # 실시간 피치 모드
      WarmupPage.tsx         # 워밍업 연습
      ScalePage.tsx          # 스케일 연습
      SongPage.tsx           # 노래 목록
      SongPracticePage.tsx   # 노래 연습 (녹화 포함)
      GamePage.tsx           # 게임 선택
      SealGamePage.tsx       # 물개 게임
      PenguinGamePage.tsx    # 펭귄 게임
      MyPage.tsx             # MY 페이지
      AlbumsPage.tsx         # My Albums
      CurriculumPage.tsx     # 커리큘럼
    hooks/
      usePitchDetection.ts   # YIN 피치 감지 훅
      useAudioGuide.ts       # Web Audio API 가이드 음 훅
    contexts/
      AppContext.tsx          # 전역 상태 관리
    components/
      BottomNav.tsx           # 하단 5탭 네비게이션
```

---

## 🚀 로컬 실행

```bash
# 의존성 설치
pnpm install

# 개발 서버 실행
pnpm dev

# 빌드
pnpm build
```

---

## 🎨 디자인 시스템

**소프트 다크 미니멀리즘** 철학을 기반으로 VocalUp 원본의 짙은 남색/보라색 계열을 재현합니다.

| 요소 | 값 |
| :--- | :--- |
| 주색상 | `oklch(0.60 0.22 280)` (보라색) |
| 배경 | `oklch(0.10 0.03 255)` (짙은 남색) |
| 강조색 | `oklch(0.55 0.18 195)` (청록색) |
| 폰트 | Nunito (둥글고 친근한 느낌) |

---

## 📋 구현 노트

### 피치 감지 (YIN 알고리즘)
자기상관 기반의 YIN 알고리즘으로 실시간 피치를 감지합니다. 감지 범위는 C2(65.4Hz) ~ C6(1046.5Hz)이며, 신뢰도 임계값 0.15로 노이즈를 필터링합니다.

### 가이드 오디오 합성
`OscillatorNode`(사인파)와 `BiquadFilterNode`(로우패스 필터)를 조합하여 피아노와 유사한 음색을 합성합니다.
MIDI → 주파수 변환: `f = 440 × 2^((midi - 69) / 12)`

### 녹화 저장
`getUserMedia`로 마이크/카메라 스트림을 획득하고, `MediaRecorder`로 WebM 형식으로 녹화합니다. 녹화 완료 후 Blob URL을 생성하여 localStorage에 메타데이터와 함께 저장합니다.

---

## 📄 관련 문서

- [대화 기록 요약](./CONVERSATION.md) — 프로젝트 기획 및 구현 과정의 전체 대화 내용
- [앱 분석 노트](./vocalup_analysis.md) — VocalUp 앱 화면 분석 결과
- [PRD 문서](./vocalup_prd_complete.md) — 완전한 제품 요구사항 정의서

---

*개발: Manus AI | 날짜: 2026-05-13*
