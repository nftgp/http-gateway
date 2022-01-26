import isoFetch from 'isomorphic-fetch'
import 'web-streams-polyfill'

type extendedGlobalThis = typeof globalThis & {
  INFURA_ID: string
}

// global.TransformStream = ponyfill.TransformStream
;(global as extendedGlobalThis).INFURA_ID = 'e301e57e9a51407eb39df231874e0563'

if (typeof btoa === 'undefined') {
  global.btoa = function (str) {
    return Buffer.from(str, 'binary').toString('base64')
  }
}

if (typeof atob === 'undefined') {
  global.atob = function (b64Encoded) {
    return Buffer.from(b64Encoded, 'base64').toString('binary')
  }
}

global.fetch = async (input, init) => {
  const response = await isoFetch(input, init)
  const body = response.body as unknown as NodeJS.ReadableStream

  const getReader = () => {
    let done = false

    return {
      read: () => {
        if (done) {
          return Promise.resolve({ done })
        }

        return new Promise((resolve) => {
          body.once('readable', () => {
            resolve({ value: body.read(), done: false })
          })
          body.once('end', () => {
            done = true
            resolve({ done })
          })
        })
      },
    }
  }

  const pipeTo = async (destination: WritableStream) => {
    const writer = destination.getWriter()
    await writer.ready
    writer.write(await response.blob())
    writer.close()
  }

  ;(body as unknown as ReadableStream).getReader =
    getReader as ReadableStream['getReader']
  ;(body as unknown as ReadableStream).pipeTo = pipeTo

  return response
}
