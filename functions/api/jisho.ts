export const onRequest = async (context: { request: Request }): Promise<Response> => {
  const url = new URL(context.request.url);
  const keyword = url.searchParams.get("keyword") ?? "";
  const response = await fetch(
    `https://jisho.org/api/v1/search/words?keyword=${encodeURIComponent(`"${keyword}"`)}`,
    { headers: { "User-Agent": "Mozilla/5.0" } }
  );
  if (!response.ok) {
    return new Response(`Jisho API error: ${response.status}`, { status: response.status });
  }
  const data = await response.json();
  return Response.json(data);
};
