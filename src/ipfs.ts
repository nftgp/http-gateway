export function ipfsUriToGatwayUri(ipfsUri: string) {
  return ipfsUri.replace(/^ipfs:\/\/(ipfs\/)?/gi, 'https://ipfs.io/ipfs/')
}
