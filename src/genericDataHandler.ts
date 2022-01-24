const PATHNAME_PREFIX = /^\/data:\w+\/[-+.\w]+;base64,/gi

export async function handleRequest(request: Request): Promise<Response> {
  if (request.method !== 'GET') {
    return new Response(null, {
      status: 405,
      statusText: 'Only GET allowed',
    })
  }

  const { pathname } = new URL(request.url)

  const match = pathname.match(PATHNAME_PREFIX)
  if (!match) {
    return new Response(null, {
      status: 400,
      statusText: 'Path must be a base64 encoded data: URI',
    })
  }

  const result = atob(pathname.substring(match[0].length))

  const headers: HeadersInit = new Headers({})
  headers.set('content-type', 'image/svg+xml')
  headers.set('cache-control', 'public, max-age=31536000, immutable')

  return new Response(result, { headers })
}
