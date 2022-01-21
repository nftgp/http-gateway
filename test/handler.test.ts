import { handleRequest, collectUrls, fetchData } from '../src/handler'
import makeServiceWorkerEnv from 'service-worker-mock'

declare const global: any

describe('handle', () => {
  beforeEach(() => {
    Object.assign(global, makeServiceWorkerEnv())
    jest.resetModules()
  })

  it.only('handle GET', async () => {
    const result = await handleRequest(
      new Request(
        '/data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KICAgIDxpbWFnZSBocmVmPSJodHRwczovL2dhdGV3YXkucGluYXRhLmNsb3VkL2lwZnMvUW1UUXJQR0RmMnhpZ0FLMnB0RGhka3ZTRjJFZlJNWHBhRkdKS0JOUktZUkJIdiIgaGVpZ2h0PSIyMDAiIHdpZHRoPSIyMDAiLz4KPC9zdmc+',
        { method: 'GET' },
      ),
    )
    expect(result.status).toEqual(200)
    const text = await result.text()
    expect(text).toEqual('request method: GET')
  })
})

describe('collectUrls', () => {
  beforeEach(() => {
    Object.assign(global, makeServiceWorkerEnv())
    jest.resetModules()
  })

  it('handles image href', () => {
    expect(
      collectUrls(`<svg width="200" height="200" xmlns="http://www.w3.org/2000/svg">
        <image href="https://gateway.pinata.cloud/ipfs/QmTQrPGDf2xigAK2ptDhdkvSF2EfRMXpaFGJKBNRKYRBHv" height="200" width="200"/>
        <image href='ipfs://QmTQrPGDf2xigAK2ptDhdkvSF2EfRMXpaFGJKBNRKYRBHv' height="200" width="200"/>
      </svg>`),
    ).toMatchInlineSnapshot(`
      Object {
        "https://gateway.pinata.cloud/ipfs/QmTQrPGDf2xigAK2ptDhdkvSF2EfRMXpaFGJKBNRKYRBHv": Array [
          87,
        ],
        "ipfs://QmTQrPGDf2xigAK2ptDhdkvSF2EfRMXpaFGJKBNRKYRBHv": Array [
          217,
        ],
      }
    `)
  })

  it('handles css urls', () => {
    expect(
      collectUrls(`<svg width="200" height="200" xmlns="http://www.w3.org/2000/svg"><defs>
        <style type="text/css">@import url(http://fonts.googleapis.com/css?family=Indie+Flower);</style>
      </defs></svg>`),
    ).toMatchInlineSnapshot(`
      Object {
        "http://fonts.googleapis.com/css?family=Indie+Flower": Array [
          115,
        ],
      }
    `)
  })
})

describe('fetchData', () => {
  beforeEach(() => {
    Object.assign(global, makeServiceWorkerEnv())
    jest.resetModules()
  })

  it('returns data URI', async () => {
    expect(
      await fetchData(
        'https://gateway.pinata.cloud/ipfs/QmaVXNTjcbezSZj8BCxURZdB568e3ppQCnFDu7nYmfTL9y',
      ),
    ).toMatchInlineSnapshot(
      `"data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KICAgIDxpbWFnZSBocmVmPSJodHRwczovL2dhdGV3YXkucGluYXRhLmNsb3VkL2lwZnMvUW1UUXJQR0RmMnhpZ0FLMnB0RGhka3ZTRjJFZlJNWHBhRkdKS0JOUktZUkJIdiIgaGVpZ2h0PSIyMDAiIHdpZHRoPSIyMDAiLz4KICAgIDxpbWFnZSBocmVmPSJodHRwczovL2dhdGV3YXkucGluYXRhLmNsb3VkL2lwZnMvUW1kU0RxaDJnMTNHVVcybnZQa3dBQ0g1cTE2VlpxVlJMRjRSU1B6REw0REF0NiIgaGVpZ2h0PSIyMDAiIHdpZHRoPSIyMDAiLz4KPC9zdmc+"`,
    )
  })
})
