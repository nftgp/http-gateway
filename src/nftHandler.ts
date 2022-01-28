import { AbiCoder } from '@ethersproject/abi'
import { handleDataUri } from './dataHandler'
import { ipfsUriToGatewayUri } from './ipfs'
import { call } from './jsonRpc'

export async function handleRequest(request: Request): Promise<Response> {
  const { pathname } = new URL(request.url)
  let nftUriString = pathname.substring(1)
  if (nftUriString.startsWith('nft:/') && !nftUriString.startsWith('nft://')) {
    // browsers automatically remove duplicate slashes in path names
    nftUriString = `nft://` + nftUriString.substring(5)
  }
  const nftUri = parseNftSchemeUri(nftUriString)
  const tokenUriString = await fetchTokenUri(nftUri)

  if (!tokenUriString) {
    return new Response(null, {
      status: 404,
      statusText: 'No tokenURI found',
    })
  }

  return fetchTokenData(tokenUriString)
}

interface JSONObject {
  [x: string]: unknown
}

// A wrapper around fetch that can handle data scheme URIs and resolves EIP-721 JSON metadata files.
async function fetchTokenData(uri: string): Promise<Response> {
  let url: URL
  try {
    url = new URL(uri)
  } catch (e) {
    return new Response(null, {
      status: 502,
      statusText: `"${uri}" is not a valid URI`,
    })
  }

  let response: Response
  switch (url.protocol) {
    case 'http:':
    case 'https:':
      response = await fetch(uri)
      break
    case 'ipfs:':
      response = await fetch(ipfsUriToGatewayUri(uri))
      break
    case 'data:':
      response = await handleDataUri(uri)
      break
    default:
      return new Response(null, {
        status: 502,
        statusText: `${uri} URI has an unsupported protocol`,
      })
  }

  if (!response.ok) {
    if (response.status === 404) {
      return new Response(null, {
        status: 404,
        statusText: `Token at ${uri} not found (${response.status}: ${response.statusText})`,
      })
    }

    return new Response(null, {
      status: 502,
      statusText: `Error fetching token URI ${uri} (${response.status}: ${response.statusText})`,
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

    // support non-standard imageUrl as fallback (used by OpenSea)
    const image = (json.image || json.imageUrl) as string | undefined
    if (image) {
      return fetchTokenData(image)
    }

    // The json does not seem to be ERC721 Metadata, so we consider it to be the token itself.
    const headers: HeadersInit = new Headers({})
    headers.set('content-type', 'application/json')
    return new Response(JSON.stringify(json), { headers })
  }

  return response
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
