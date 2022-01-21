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

const MAX_FILE_SIZE = 256000 // 256kb

export async function fetchData(url: string): Promise<string> {
  const response = await fetch(url)
  if (!response.ok || !response.body) {
    throw new Error('could not fetch')
  }

  const contentType = response.headers.get('content-type')

  let result = ''
  let bytesReceived = 0
  const reader = response.body.getReader()

  async function processChunk({
    done,
    value,
  }: ReadableStreamReadResult<Uint8Array>) {
    if (done) return
    if (!value) throw Error('empty chunk but not done')

    bytesReceived += value.length

    if (bytesReceived > MAX_FILE_SIZE) {
      throw new Error(
        `linked file ${url} exceeds limit of ${MAX_FILE_SIZE / 1000}kb`,
      )
    }
    result += String.fromCharCode(...value)

    // Recurse until reaching the end of the stream
    await processChunk(await reader.read())
  }

  await processChunk(await reader.read())
  return `data:${contentType};base64,${btoa(result)}`
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

  const warnings: string[] = []
  const dataUris = await Promise.all(
    Object.keys(urls).map(async (url) => {
      try {
        return await fetchData(url)
      } catch (e) {
        const { message } = e as Error
        warnings.push(message)
        console.warn(message)
      }

      return null
    }),
  )

  const replacements = Object.entries(urls)
    .filter((_, i) => !!dataUris[i])
    .map(([uri, positions], i) =>
      positions.map((position) => ({
        start: position,
        end: position + uri.length,
        dataUri: dataUris[i],
      })),
    )
    .flat()

  const result = replacements.reduce(
    (result, replacement) =>
      result.substring(0, replacement.start) +
      replacement.dataUri +
      result.substring(replacement.end),
    svg,
  )

  const headers: HeadersInit = new Headers()
  headers.set('content-type', 'image/svg+xml')
  if (warnings.length > 0) {
    headers.set('x-chainpic-warning', warnings.join('\n'))
  }

  return new Response(result, { headers })
}
