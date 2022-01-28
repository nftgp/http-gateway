export function ipfsUriToGatewayUri(ipfsUri: string): string {
  return ipfsUri.replace(/^ipfs:\/\/(ipfs\/)?/gi, 'https://ipfs.io/ipfs/')
}
