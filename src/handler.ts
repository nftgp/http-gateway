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

const MAX_FILE_SIZE = 128000 // 128kb

export async function fetchData(url: string): Promise<string> {
  const response = await fetch(url)
  if (!response.ok || !response.body) {
    throw new Error('could not fetch')
  }
  try {
    let result = ''
    let bytesReceived = 0
    let { readable, writable } = new TransformStream()
    const reader = readable.getReader()
    response.body.pipeTo(writable)
    console.log('ok')

    const processChunk = async ({
      done,
      value,
    }: ReadableStreamReadResult<Uint8Array>) => {
      console.log(done, value)
      if (done) return
      if (!value) throw Error('empty chunk but not done')

      bytesReceived += value.length
      if (bytesReceived > MAX_FILE_SIZE) {
        throw new Error(
          `linked file ${url} exceeds limit of ${MAX_FILE_SIZE / 1000}kb`,
        )
      }

      console.log(bytesReceived, value)

      // Recurse until reaching the end of the stream
      processChunk(await reader.read())
    }
    processChunk(await reader.read())
    console.log('22')
    // try {
    //   const contentType = response.headers.get('content-type')
    //   console.log(url, contentType)
    //   const bytes = new Uint8Array(await response.arrayBuffer())

    //   const binary = String.fromCharCode(...bytes)
    //   return `data:${contentType};base64,${btoa(binary)}`
    // } catch (e) {
    //   console.log(url, e)
    // }
  } catch (e) {
    console.log(e)
  }
  return ''
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

  const dataUris = (await Promise.allSettled(Object.keys(urls).map(fetchData)))
    .map((promiseResult) =>
      'value' in promiseResult ? promiseResult.value : '',
    )
    .filter((uri) => !!uri)

  console.log(dataUris)
  const replacements = Object.entries(urls)
    .map(([uri, positions], i) =>
      positions.map((position) => ({
        start: position,
        end: position + uri.length,
        dataUri: dataUris[i],
      })),
    )
    .flat()
  console.log(replacements)
  const result = replacements.reduce(
    (result, replacement) =>
      result.substring(0, replacement.start) +
      replacement.dataUri +
      result.substring(replacement.end),
    svg,
  )

  return new Response(result, { headers: { 'content-type': 'image/svg+xml' } })
}
