import { handleRequest } from '../src/genericDataHandler'
import makeServiceWorkerEnv from 'service-worker-mock'

declare const global: unknown

describe('handleRequest', () => {
  beforeEach(() => {
    Object.assign(global, makeServiceWorkerEnv())
    jest.resetModules()
  })

  it('responds the data ', async () => {
    const result = await handleRequest(
      new Request('/data:text/plain;base64,SGVsbG8gd29ybGQh', {
        method: 'GET',
      }),
    )
    expect(result.status).toEqual(200)
    const text = await result.text()
    expect(text).toBe('Hello world!')
  })
})
