import { AbiCoder } from '@ethersproject/abi'
import { ipfsUriToGatwayUri } from './ipfs'
import { call } from './jsonRpc'

export async function handleRequest(request: Request): Promise<Response> {
  const { pathname } = new URL(request.url)
  let nftUriString = pathname.substring(1)
  if (nftUriString.startsWith('nft:/') && !nftUriString.startsWith('nft://')) {
    // browsers automatically remove duplicate slashes in pathnames
    nftUriString = `nft://` + nftUriString.substring(5)
  }
  const nftUri = parseNftSchemeUri(nftUriString)
  const tokenUriString = await fetchTokenUri(nftUri)

  if (!tokenUriString) {
    return new Response(null, {
      status: 204,
      statusText: 'tokenURI is empty',
    })
  }

  let tokenUrl: URL
  try {
    tokenUrl = new URL(tokenUriString)
  } catch (e) {
    return new Response(null, {
      status: 502,
      statusText: `tokenURI value "${tokenUriString}" is not a valid URI`,
    })
  }

  if (tokenUrl.protocol === 'http' || tokenUrl.protocol === 'https') {
    return fetchAndStream(tokenUriString)
  } else if (tokenUrl.protocol === 'ipfs') {
    return fetchAndStream(ipfsUriToGatwayUri(tokenUriString))
  }

  return new Response('TODO: ' + pathname)
}

interface JSONObject {
  [x: string]: unknown
}

async function fetchAndStream(uri: string): Promise<Response> {
  const response = await fetch(uri)

  if (!response.ok) {
    return new Response(null, {
      status: 502,
      statusText: `Error fetching token URI ${uri}: ${response.status} - ${response.statusText}`,
    })
  }

  if (!response.body) {
    return new Response(null, {
      status: 204,
      statusText: 'tokenURI is empty',
    })
  }

  // According to EIP-721, the URI may point to a JSON metadata file.
  // So need to give some special treatment to application/json responses.
  if (response.headers.get('content-type') === 'application/json') {
    let json: JSONObject
    try {
      json = await response.json()
    } catch (e) {
      const { message } = e as Error
      return new Response(null, {
        status: 502,
        statusText: `${uri} has content-type application/json, but cannot be parsed as json (Error: ${message})`,
      })
    }

    // support non-standard imageUrl as fallback
    const image = (json.image || json.imageUrl) as string | undefined
    if (image) {
      return fetchAndStream(image)
    }

    // The json does not seem to be ERC721 Metadata, so we consider it to be the token itself.
    const headers: HeadersInit = new Headers({})
    headers.set('content-type', 'application/json')

    return new Response(JSON.stringify(json), { headers })
  }

  // Stream response
  const { readable, writable } = new TransformStream()
  response.body.pipeTo(writable)
  return new Response(readable, response)
}

interface NftUri {
  chainId: number
  block: number | 'latest' | undefined
  from: string | undefined
  contractAddress: string
  tokenId: string
  filename: string

  href: string
  search: string
  searchParams: URLSearchParams
  hash: string
}

export function parseNftSchemeUri(uri: string): NftUri {
  const url = new URL(uri)
  const [chainId, block] = url.hostname.split('.')
  const [, contractAddress, tokenId, filename = ''] = url.pathname.split('/')

  return {
    chainId: parseInt(chainId),
    block: block
      ? block === 'latest'
        ? 'latest'
        : parseInt(block)
      : undefined,
    from: url.username || undefined,

    contractAddress,
    tokenId,
    filename,

    href: url.href,
    hash: url.hash,
    search: url.search,
    searchParams: url.searchParams,
  }
}

const TOKEN_URI_SIGNATURE_HASH = '0xc87b56dd'

const abiCoder = new AbiCoder()

export async function fetchTokenUri(nftUri: NftUri): Promise<string> {
  const hexTokenId = BigInt(nftUri.tokenId).toString(16)
  const result = await call(
    nftUri.chainId,
    {
      to: nftUri.contractAddress,
      data: `${TOKEN_URI_SIGNATURE_HASH}${hexTokenId.padStart(64, '0')}`,
      from: nftUri.from,
    },
    nftUri.block,
  )
  const [tokenUri] = abiCoder.decode(['string'], result)
  return tokenUri
}
