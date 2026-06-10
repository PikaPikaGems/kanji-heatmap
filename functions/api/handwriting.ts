// Proxy for Google Input Tools handwriting recognition.
// The browser POSTs the ink payload here so we can reach Google server-side
// (avoids CORS) and keep the upstream endpoint swappable.
const SERVICE_ENDPOINT =
  "https://inputtools.google.com/request?ime=handwriting&app=mobilesearch&cs=1&oe=UTF-8";

/*
let serviceEndpointURLs = {
    "default": "https://www.google.com.tw/inputtools/request?ime=handwriting&app=mobilesearch&cs=1&oe=UTF-8",
    "google_tw": "https://www.google.com.tw/inputtools/request?ime=handwriting",
    "google_jp": "https://www.google.co.jp/inputtools/request?ime=handwriting",
    "google": "https://www.google.com/inputtools/request?ime=handwriting",
    "inputtools": "https://inputtools.google.com/request?ime=handwriting",
    https://www.google.com.tw/inputtools/request?ime=handwriting&app=mobilesearch&cs=1&oe=UTF-8
}
*/
export const onRequest = async (context: {
  request: Request;
}): Promise<Response> => {
  if (context.request.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  let body: unknown;
  try {
    body = await context.request.json();
  } catch {
    return new Response("Invalid JSON body", { status: 400 });
  }

  let response: Response;
  try {
    response = await fetch(SERVICE_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "User-Agent": "Mozilla/5.0",
      },
      body: JSON.stringify(body),
    });
  } catch {
    return new Response("Failed to reach Google input tools", { status: 502 });
  }

  if (!response.ok) {
    return new Response(`Google input tools error: ${response.status}`, {
      status: 502,
    });
  }

  const data = await response.json();
  return Response.json(data);
};
