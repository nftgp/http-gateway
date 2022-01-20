export async function handleRequest(request: Request): Promise<Response> {
  if (request.method !== 'GET') {
    return new Response(null, {
      status: 405,
      statusText: 'Only GET allowed',
    })
  }

  const { pathname } = new URL(request.url)
  const prefix = '/data:image/svg+xml;base64,'
  if (!pathname.startsWith(prefix)) {
    return new Response(null, {
      status: 400,
      statusText: 'path must be a data: URI',
    })
  }

  const svg = atob(pathname.substring(prefix.length))

  return new Response(`request path: ${svg}`)
}
