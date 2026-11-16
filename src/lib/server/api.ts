import { StoreError, object } from "./validation";
export async function body(request: Request) {
  const reader = request.body?.getReader();
  if (!reader) throw new StoreError("JSON gövdesi gerekli.");
  let text = "";
  let bytes = 0;
  const decoder = new TextDecoder();
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    bytes += value.byteLength;
    if (bytes > 2_000_000) {
      await reader.cancel();
      throw new StoreError("İstek çok büyük.", 413);
    }
    text += decoder.decode(value, { stream: true });
  }
  try {
    return object(JSON.parse(text + decoder.decode()));
  } catch {
    throw new StoreError("Geçersiz JSON.");
  }
}
export function handler(fn: (request: Request) => unknown | Promise<unknown>) {
  return async (request: Request) => {
    try {
      const result = await fn(request);
      return result instanceof Response
        ? result
        : Response.json(result, { headers: { "Cache-Control": "no-store" } });
    } catch (e) {
      return Response.json(
        { error: e instanceof StoreError ? e.message : "İşlem tamamlanamadı." },
        {
          status: e instanceof StoreError ? e.status : 500,
          headers: { "Cache-Control": "no-store" },
        },
      );
    }
  };
}
