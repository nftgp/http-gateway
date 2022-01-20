export async function handleRequest(request: Request): Promise<Response> {
  if (request.method !== 'GET') {
    return new Response(null, {
      status: 405,
      statusText: 'Method Not Allowed',
    })
  }

  const url = new URL(request.url)

  return new Response(`request path: ${url.pathname}`)
}
