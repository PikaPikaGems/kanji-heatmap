export const onRequest = async (context: {
  request: Request;
}): Promise<Response> => {
  const url = new URL(context.request.url);
  const keyword = url.searchParams.get("keyword") ?? "";
  let response: Response;
  try {
    response = await fetch(
      `https://jisho.org/api/v1/search/words?keyword=${encodeURIComponent(`"${keyword}"`)}`,
      { headers: { "User-Agent": "Mozilla/5.0" } }
    );
  } catch {
    return new Response("Failed to reach Jisho", { status: 502 });
  }
  if (!response.ok) {
    return new Response(`Jisho API error: ${response.status}`, { status: 502 });
  }
  const data = await response.json();
  return Response.json(data);
};
