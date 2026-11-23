/** Textarea offsets are UTF-16 offsets, including for emoji and Turkish text. */
export function insertArticleReference(text: string, start: number, end: number, code: string) {
  const from = Math.max(0, Math.min(text.length, start));
  const to = Math.max(from, Math.min(text.length, end));
  return {text: text.slice(0, from) + code + text.slice(to), caret: from + code.length};
}
