export const onRequest = async (context: {
  request: Request;
}): Promise<Response> => {
  const url = new URL(context.request.url);
  const keyword = url.searchParams.get("keyword") ?? "";
  let response: Response;
  try {
    response = await fetch("https://jotoba.de/api/search/words", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "User-Agent": "Mozilla/5.0",
      },
      body: JSON.stringify({
        query: keyword,
        language: "English",
        no_english: false,
      }),
    });
  } catch {
    return new Response("Failed to reach Jotoba", { status: 502 });
  }
  if (!response.ok) {
    return new Response(`Jotoba API error: ${response.status}`, {
      status: 502,
    });
  }
  const data = await response.json();
  return Response.json(data);
};
