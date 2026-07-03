// ============================================================
// 울릉도 생태관광 AI · OpenRouter(Scout) 프록시 · Cloudflare Worker
// ------------------------------------------------------------
// 키는 코드에 넣지 않습니다.
//   Cloudflare 대시보드 → Worker → Settings → Variables and Secrets
//   에서 OPENROUTER_API_KEY 를 "Secret"으로 추가하세요.
// (선택) MODEL 변수로 모델을 바꿀 수 있습니다.
// ============================================================

const ALLOWED_ORIGIN = 'https://kanghoon1204.github.io'; // GitHub Pages 도메인만 허용
const MODEL_DEFAULT = 'meta-llama/llama-4-scout:free';   // 무료 Scout (한도 낮으면 유료 슬러그로 교체)
const MAX_TOKENS = 800;         // 응답 길이 상한 (비용·악용 방지)
const MAX_PROMPT_CHARS = 2000;  // 입력 길이 상한

function corsHeaders(origin) {
  return {
    'Access-Control-Allow-Origin': origin === ALLOWED_ORIGIN ? ALLOWED_ORIGIN : 'null',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Vary': 'Origin',
  };
}

function json(obj, status, headers) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { ...headers, 'Content-Type': 'application/json; charset=utf-8' },
  });
}

export default {
  async fetch(request, env) {
    const origin = request.headers.get('Origin') || '';
    const headers = corsHeaders(origin);

    // 프리플라이트
    if (request.method === 'OPTIONS') return new Response(null, { headers });
    if (request.method !== 'POST') return json({ error: 'POST만 허용됩니다.' }, 405, headers);

    // 우리 사이트에서 온 요청만 허용 (브라우저 악용 차단)
    if (origin !== ALLOWED_ORIGIN) return json({ error: '허용되지 않은 출처입니다.' }, 403, headers);

    if (!env.OPENROUTER_API_KEY) return json({ error: '서버에 키가 설정되지 않았습니다.' }, 500, headers);

    let body;
    try { body = await request.json(); } catch { return json({ error: '잘못된 요청 형식입니다.' }, 400, headers); }

    const prompt = String(body.prompt || '').slice(0, MAX_PROMPT_CHARS).trim();
    if (!prompt) return json({ error: '내용을 입력하세요.' }, 400, headers);

    let r;
    try {
      r = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${env.OPENROUTER_API_KEY}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': ALLOWED_ORIGIN,
          'X-Title': 'Ulleung Eco Tourism AI',
        },
        body: JSON.stringify({
          model: env.MODEL || MODEL_DEFAULT,
          max_tokens: MAX_TOKENS,
          messages: [
            {
              role: 'system',
              content: '너는 울릉도 관광 홍보를 돕는 한국어 도우미야. 짧고 쉽게, 과장 없이 답해. 가격·운영시간·전화번호·배편처럼 사실 확인이 필요한 정보는 "확인 필요"라고 표시해. 개인정보는 다루지 않아.',
            },
            { role: 'user', content: prompt },
          ],
        }),
      });
    } catch (e) {
      return json({ error: 'AI 서버에 연결하지 못했습니다.' }, 502, headers);
    }

    if (!r.ok) {
      const detail = (await r.text()).slice(0, 300);
      return json({ error: 'AI 호출에 실패했습니다.', detail }, 502, headers);
    }

    const data = await r.json();
    const text = data?.choices?.[0]?.message?.content?.trim() || '(빈 응답)';
    return json({ text }, 200, headers);
  },
};
