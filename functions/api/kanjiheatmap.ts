export const onRequest: PagesFunction<Env> = async (context) => {
  const { request, env } = context;

  const incomingUrl = new URL(request.url);

  const apiUrl = new URL(
    incomingUrl.pathname + incomingUrl.search,
    env.KH_API_URL
  );

  const proxiedHeaders = new Headers(request.headers);

  const clientIp = request.headers.get("CF-Connecting-IP");
  if (clientIp) {
    proxiedHeaders.set("X-Forwarded-For", clientIp);
  }
  proxiedHeaders.set("X-App-Name", env.KH_APP_NAME);

  const hasBody = !["GET", "HEAD"].includes(request.method);

  return fetch(
    new Request(apiUrl, {
      method: request.method,
      headers: proxiedHeaders,
      body: hasBody ? request.body : undefined,
      redirect: "manual",
    })
  );
};
