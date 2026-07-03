# Cloudflare Worker 배포 (사이트 내 AI 도우미)

키를 **서버(Worker)** 에만 보관하고, 사이트는 이 Worker 주소로만 요청합니다.
진짜 OpenRouter 키는 브라우저로 절대 나가지 않습니다.

## 준비: OpenRouter 키 재발급
> ⚠️ 채팅에 노출된 이전 키는 **폐기(revoke)** 하고 **새 키**를 발급받으세요.
> https://openrouter.ai/keys

## 1. Cloudflare 계정 만들기 (무료)
https://dash.cloudflare.com → 가입/로그인

## 2. Worker 만들기
1. 왼쪽 메뉴 **Workers & Pages** → **Create** → **Create Worker**
2. 이름 예: `ulleung-ai` → **Deploy** (기본 코드로 일단 배포)
3. **Edit code** 를 눌러 편집기 열기
4. 편집기 내용을 모두 지우고 `worker.js` 전체를 붙여넣기 → **Deploy**

## 3. 키를 Secret으로 저장 (코드에 넣지 않음)
1. Worker 화면 → **Settings** → **Variables and Secrets**
2. **Add** → Type: **Secret**
   - Name: `OPENROUTER_API_KEY`
   - Value: (새로 발급받은 OpenRouter 키)
3. **Deploy/Save**
4. (선택) 모델 바꾸려면 같은 곳에 일반 변수 `MODEL` = `meta-llama/llama-4-scout` 등 추가

## 4. 주소 확인
- Worker 화면 상단의 주소를 복사 (예: `https://ulleung-ai.내계정.workers.dev`)
- 이 주소를 알려주면 사이트 위젯(`AI_PROXY_URL`)에 연결합니다.

## 방어장치 (이미 코드에 포함)
- 우리 사이트 도메인(`kanghoon1204.github.io`)에서 온 요청만 허용
- 응답 길이 상한(800 토큰), 입력 길이 상한(2000자)
- 모델 고정, 시스템 프롬프트로 "확인 필요/개인정보 금지" 유도

## 더 강한 보호가 필요하면 (선택)
- Cloudflare 대시보드의 **Rate limiting rules** 로 IP당 분당 요청 수 제한
- 위 `ALLOWED_ORIGIN` 은 도메인이 바뀌면 함께 수정
