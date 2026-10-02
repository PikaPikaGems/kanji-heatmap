type KanjiApiVariant = {
  priorities: string[];
  pronounced: string;
  written: string;
};
type KanjiApiWord = {
  meanings: { glosses: string[] }[];
  variants: KanjiApiVariant[];
};

const HAN = /\p{Script=Han}/u;

// kanjiapi.dev only accepts a single kanji and returns every word containing
// it (a common kanji can be 300KB+). So we look up by the word's first kanji,
// keep only entries that are written exactly as `keyword`, and return a small
// trimmed payload. That keeps the client-side cache tiny.
export const onRequest = async (context: {
  request: Request;
}): Promise<Response> => {
  const url = new URL(context.request.url);
  const keyword = url.searchParams.get("keyword") ?? "";
  const kanji = Array.from(keyword).find((c) => HAN.test(c));
  if (!kanji) {
    return Response.json({ entries: [] });
  }

  let response: Response;
  try {
    response = await fetch(
      `https://kanjiapi.dev/v1/words/${encodeURIComponent(kanji)}`,
      { headers: { "User-Agent": "Mozilla/5.0" } }
    );
  } catch {
    return new Response("Failed to reach KanjiAPI", { status: 502 });
  }
  if (response.status === 404) {
    return Response.json({ entries: [] });
  }
  if (!response.ok) {
    return new Response(`KanjiAPI error: ${response.status}`, { status: 502 });
  }

  const words = (await response.json()) as KanjiApiWord[];
  const entries = words.flatMap((word) => {
    const variant = word.variants.find((v) => v.written === keyword);
    if (!variant) return [];
    return [
      {
        written: keyword,
        reading: variant.pronounced,
        common: variant.priorities.length > 0,
        senses: word.meanings.map((m) => m.glosses),
      },
    ];
  });
  return Response.json(
    { entries },
    { headers: { "Cache-Control": "public, max-age=86400" } }
  );
};
