import { handleRequest as handleNftRequest } from './nftHandler'
import { handleRequest as handleDataRequest } from './dataHandler'

addEventListener('fetch', (event) => {
  const { pathname } = new URL(event.request.url)
  if (pathname.startsWith('/nft:')) {
    event.respondWith(handleNftRequest(event.request))
  } else if (pathname.startsWith('/data:')) {
    event.respondWith(handleDataRequest(event.request))
  } else {
    throw new Error('Unsupported route')
  }
})
