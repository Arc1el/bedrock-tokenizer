# Bedrock LLMs 토크나이저 (Counter)

## 프로젝트 소개
![image](https://github.com/user-attachments/assets/d65eb24c-9ed7-4255-97f3-09bd0c0acebb)
Amazon Bedrock의 다양한 LLM(Large Language Model)들의 토큰 수를 계산하고 시각화하는 웹 애플리케이션입니다.

## 주요 기능
- 다양한 LLM 제공업체 지원:
  - Anthropic (Claude 시리즈)
  - Cohere (Command 시리즈)
  - Meta Llama (Llama 시리즈)
  - Mistral (Mistral Large)
- 실시간 토큰 수 계산
- 토큰 시각화
- 예상 비용 계산 (USD/KRW)
- API 로그 모니터링

## 기술 스택
- Frontend: Next.js, TypeScript, Tailwind CSS, Ant Design
- Backend: Python (토큰화 처리)
- API: REST API

## 설치 방법

1. 저장소 클론
```bash
git clone https://github.com/Arc1el/bedrock-tokenizer.git
cd bedrock-tokenizer
```

2. 의존성 설치
```bash
npm install
```

3. 환경 변수 설정
```bash
ANTHROPIC_API_KEY=your_api_key
HUGGINGFACE_TOKEN=your_token
```

4. 개발 서버 실행
```bash
npm run dev
```

## 사용 방법
1. 웹 브라우저에서 `http://localhost:3000` 접속
2. 텍스트 입력 영역에 분석하고자 하는 텍스트 입력
3. 원하는 LLM 제공업체와 모델 선택
4. 실시간으로 토큰 수, 예상 비용, 토큰 시각화 결과 확인

## 프로젝트 구조
```
tokenizer-app/
├── app/                    # Next.js 앱 디렉토리
├── components/             # React 컴포넌트
├── backend/               # Python 백엔드 코드
├── public/                # 정적 파일
└── types/                 # TypeScript 타입 정의
```

## API 엔드포인트
- `POST /api/count-tokens`
  - 요청 본문:
    - `text`: 분석할 텍스트
    - `provider`: LLM 제공업체
    - `model`: 선택한 모델
    - `visualize`: 토큰 시각화 여부
  - 응답:
    - `tokenCount`: 토큰 수
    - `price`: 예상 비용
    - `visualization`: 토큰 시각화 데이터 (선택적)

## 라이선스
MIT License
