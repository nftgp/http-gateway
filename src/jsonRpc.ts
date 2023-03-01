const RPC_ENDPOINTS: { [chainId: number]: string } = {
  1: 'https://cloudflare-eth.com/v1/mainnet',
  5: 'https://cloudflare-eth.com/v1/goerli',
  11155111: 'https://cloudflare-eth.com/v1/sepolia',
  100: 'https://xdai-archive.blockscout.com',
}

interface TransactionCall {
  from?: string
  to: string
  data?: string
}

export async function call(
  chainId: number,
  callObject: TransactionCall,
  block: number | 'latest' = 'latest',
): Promise<string> {
  const response = await fetch(RPC_ENDPOINTS[chainId], {
    body: JSON.stringify({
      jsonrpc: '2.0',
      method: 'eth_call',
      params: [callObject, block],
      id: 1,
    }),
    method: 'POST',
    headers: {
      'content-type': 'application/json;charset=UTF-8',
    },
  })

  if (!response.ok) {
    throw new Error(`JSON-RPC call failed (${response.statusText})`)
  }

  const { result }: { result: string } = await response.json()
  return result
}
