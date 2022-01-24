export function ipfsUriToGatwayUri(ipfsUri: string) {
  return ipfsUri.replace(/^ipfs:\/\//gi, 'https://ipfs.io/ipfs/')
}
