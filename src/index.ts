import { handleRequest as handleNftRequest } from './nftHandler'
import { handleRequest as handleSvgDataRequest } from './svgDataHandler'
import { handleRequest as handleGenericDataRequest } from './genericDataHandler'

// declare global {
//   const INFURA_ID: string
// }

addEventListener('fetch', (event) => {
  const { pathname } = new URL(event.request.url)
  if (pathname.startsWith('/nft:')) {
    event.respondWith(handleNftRequest(event.request))
  } else if (pathname.startsWith('/data:')) {
    if (pathname.startsWith('/data:image/svg+xml')) {
      event.respondWith(handleSvgDataRequest(event.request))
    } else {
      event.respondWith(handleGenericDataRequest(event.request))
    }
  } else {
    throw new Error('Unsupported route')
  }
})
