// capturing groups: 1: href=" 3: https://test.url 4: "
const hrefRegexp = /(href=(['"]))((?:https?|ipfs):\/\/.+?)(\2)/gim

// capturing groups: 1: url(" 3: https://test.url 4: ")
const cssUrlRegexp = /(url\(\s*(['"]?))((?:https?|ipfs):\/\/.+?)(\2\s*\))/gim

type UrlOccurrences = {
  [url: string]: number[] // string indices of occurrences
}
export function collectUrls(svg: string): UrlOccurrences {
  const matches = [...svg.matchAll(hrefRegexp), ...svg.matchAll(cssUrlRegexp)]
  return matches.reduce((result, match) => {
    if (match.index === undefined) return result
    const prefix = match[1]
    const url = match[3]
    if (!result[url]) result[url] = []
    result[url].push(match.index + prefix.length)
    return result
  }, {} as UrlOccurrences)
}

export async function fetchData(url: string): Promise<string> {
  const response = await fetch(url)
  if (!response.ok || !response.body) {
    throw new Error('could not fetch')
  }

  const contentType = response.headers.get('Content-Type')
  const bytes = new Uint8Array(await response.arrayBuffer())
  const binary = String.fromCharCode(...bytes)
  return `data:${contentType};base64,${btoa(binary)}`
}

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
      statusText: 'Path must be a data: URI',
    })
  }

  const svg = atob(pathname.substring(prefix.length))
  const urls = collectUrls(svg)

  const dataUris = await Promise.allSettled(Object.keys(urls).map(fetchData))

  return new Response(`request path: ${svg}`)
}
