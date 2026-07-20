// 라틴 문자나 닫는 괄호 뒤에 붙는 한국어 조사·어미가 줄 머리로 떨어지는 문제를 막는다.
// break-keep은 ')' 나 라틴 글자 뒤 줄바꿈을 못 막는다. 그래서 워드 조이너(U+2060)를 끼워
// 앞 토큰과 1~2음절 한글을 한 덩어리로 묶는다. 1~2음절 상한 덕에 긴 한글 단어는 그대로 꺾인다.
// 화이트리스트 없이 와, 과, 는, 를, 로, 에, 의, 도, 만, 등 같은 조사·접미사를 붙인다.
//
// 접속·연결어(와/과/및) 뒤 공백은 NBSP(U+00A0)로 바꿔 다음 한글 어절과 붙인다.
// 뒤 어절이 7음절 이상이면 붙이지 않는다 — 한 줄짜리 거대 unbreakable run을 피한다.
const KO_GLUE = /([)\]}»'"%A-Za-z0-9])([가-힣]{1,2})(?=[\s.,)\]}]|$)/g;
const KO_CONJ_WA_GWA = /([가-힣]{2,}[와과])\s(?=[가-힣])/g;
const KO_CONJ_MIC = /(및)\s(?=[가-힣])/g;
const MAX_FOLLOWER_SYLLABLES = 6;

function glueConjSpace(
  text: string,
  re: RegExp,
): string {
  return text.replace(re, (match, head: string, offset: number, whole: string) => {
    const follower = whole.slice(offset + match.length).match(/^[가-힣]+/)?.[0] ?? '';
    if (follower.length > MAX_FOLLOWER_SYLLABLES) return match;
    return `${head}\u00A0`;
  });
}

/** 순수 함수 — SSR과 클라이언트 번들에서 동일하게 돈다(하이드레이션 일관성). */
export function koGlue(text: string): string {
  if (typeof text !== 'string') return text;
  let out = text.replace(KO_GLUE, '$1\u2060$2');
  out = glueConjSpace(out, KO_CONJ_WA_GWA);
  out = glueConjSpace(out, KO_CONJ_MIC);
  return out;
}
