export async function handleRequest(request: Request): Promise<Response> {
  if (request.method !== 'GET') {
    return new Response(null, {
      status: 405,
      statusText: 'Only GET allowed',
    })
  }

  const { pathname } = new URL(request.url)
  if (!pathname.startsWith('/data:')) {
    return new Response(null, {
      status: 400,
      statusText: 'Path must a data: URI',
    })
  }

  return handleDataUri(pathname.substring(1))
}

export async function handleDataUri(uri: string): Promise<Response> {
  // reference: https://developer.mozilla.org/en-US/docs/Web/HTTP/Basics_of_HTTP/Data_URIs
  const match = uri.match(/data:(.*?)?(;base64)?,(.*)/)

  if (!match) {
    throw new Error(`${uri} is not a valid data URI`)
  }

  const [, mimeType, base64Encoding, data] = match
  const decodedData = base64Encoding ? atob(data) : data

  if (mimeType === 'image/svg+xml') {
    return inlineExternalResources(decodedData)
  } else {
    const headers: HeadersInit = new Headers({})
    headers.set('content-type', mimeType)
    headers.set('cache-control', 'public, max-age=31536000, immutable')
    return new Response(decodedData, { headers })
  }
}

async function inlineExternalResources(svg: string) {
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
        value: dataUris[i] as string,
      })),
    )
    .flat()

  const result = replaceSubstrings(svg, replacements)

  const headers: HeadersInit = new Headers({})
  headers.set('content-type', 'image/svg+xml')
  warnings.forEach((warning) => {
    headers.append('x-nftgp-warning', warning)
  })

  return new Response(result, { headers })
}

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

const MAX_FILE_SIZE = 2 * 1024 ** 1024 // 2 MB

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

interface Replacement {
  start: number
  end: number
  value: string
}

export function replaceSubstrings(
  str: string,
  replacements: Replacement[],
): string {
  let i = 0
  let result = ''
  replacements.forEach((replacement) => {
    result += str.substring(i, replacement.start) + replacement.value
    i = replacement.end
  })
  result += str.substring(i)
  return result
}
