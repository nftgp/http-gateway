const isoFetch = require('isomorphic-fetch')

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

global.fetch = async (...args) => {
  const response = await isoFetch(...args)
  const body = response.body
  body.getReader = () => {
    let done = false

    return {
      read: () => {
        if (done) {
          return Promise.resolve({ done })
        }

        return new Promise((resolve) => {
          let resolved = false
          body.once('readable', () => {
            resolve({ value: body.read(), done: false })
          })
          body.once('end', () => {
            done = true
            if (!resolved) resolve({ done })
          })
        })
      },
    }
  }
  return response
}
