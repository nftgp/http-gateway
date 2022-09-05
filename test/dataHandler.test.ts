import {
  handleRequest,
  collectUrls,
  fetchData,
  replaceSubstrings,
} from '../src/dataHandler'
import makeServiceWorkerEnv from 'service-worker-mock'

declare const global: unknown

describe('data scheme uri handling', () => {
  describe('handleRequest', () => {
    beforeEach(() => {
      Object.assign(global, makeServiceWorkerEnv())
      jest.resetModules()
    })

    it('handles generic data ', async () => {
      const result = await handleRequest(
        new Request('/data:text/plain;base64,SGVsbG8gd29ybGQh', {
          method: 'GET',
        }),
      )
      expect(result.status).toEqual(200)
      const text = await result.text()
      expect(text).toBe('Hello world!')
    })

    it('handles svg data', async () => {
      const result = await handleRequest(
        new Request(
          '/data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyMDAiIGhlaWdodD0iMjAwIj4KICA8aW1hZ2UgaHJlZj0iaHR0cHM6Ly9yYXcuZ2l0aHVidXNlcmNvbnRlbnQuY29tL25mdGdwL2h0dHAtZ2F0ZXdheS9tYWluL3Rlc3QvdGVzdC5zdmciIGhlaWdodD0iMjAwIiB3aWR0aD0iMjAwIi8+Cjwvc3ZnPg==',
          { method: 'GET' },
        ),
      )
      expect(result.status).toEqual(200)
      const text = await result.text()
      expect(text).toMatchInlineSnapshot(`
        "<svg xmlns=\\"http://www.w3.org/2000/svg\\" width=\\"200\\" height=\\"200\\">
          <image href=\\"data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyMDAiIGhlaWdodD0iMjAwIj4KICA8bGluZSB4MT0iMCIgeTE9IjAiIHgyPSIyMDAiIHkyPSIyMDAiIHN0cm9rZT0iZGVlcHBpbmsiIHN0cm9rZS13aWR0aD0iOCIvPgogIDxsaW5lIHgxPSIwIiB5MT0iMjAwIiB4Mj0iMjAwIiB5Mj0iMCIgc3Ryb2tlPSJkZWVwcGluayIgc3Ryb2tlLXdpZHRoPSI4Ii8+Cjwvc3ZnPg==\\" height=\\"200\\" width=\\"200\\"/>
        </svg>"
      `)
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
            89,
          ],
          "ipfs://QmTQrPGDf2xigAK2ptDhdkvSF2EfRMXpaFGJKBNRKYRBHv": Array [
            221,
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
            117,
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
          'https://raw.githubusercontent.com/nftgp/http-gateway/main/test/test.svg',
        ),
      ).toMatchInlineSnapshot(
        `"data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyMDAiIGhlaWdodD0iMjAwIj4KICA8bGluZSB4MT0iMCIgeTE9IjAiIHgyPSIyMDAiIHkyPSIyMDAiIHN0cm9rZT0iZGVlcHBpbmsiIHN0cm9rZS13aWR0aD0iOCIvPgogIDxsaW5lIHgxPSIwIiB5MT0iMjAwIiB4Mj0iMjAwIiB5Mj0iMCIgc3Ryb2tlPSJkZWVwcGluayIgc3Ryb2tlLXdpZHRoPSI4Ii8+Cjwvc3ZnPg=="`,
      )
    })
  })

  describe('replaceSubstrings', () => {
    it('applies all specified replacements to the string', () => {
      const str = '0123456789abcdef'
      const replacements = [
        { start: 0, end: 6, value: '<REP1>' },
        { start: 10, end: 10, value: '<REP2>' },
        { start: 14, end: 16, value: '<REP3>' },
      ]
      expect(replaceSubstrings(str, replacements)).toBe(
        '<REP1>6789<REP2>abcd<REP3>',
      )
    })
  })
})
