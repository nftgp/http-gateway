import {
  fetchTokenUri,
  handleRequest,
  parseNftSchemeUri,
} from '../src/nftHandler'
import makeServiceWorkerEnv from 'service-worker-mock'

declare const global: unknown

describe('nft scheme uri handling', () => {
  describe('handleRequest', () => {
    beforeEach(() => {
      Object.assign(global, makeServiceWorkerEnv())
      jest.resetModules()
    })

    it('responds the data ', async () => {
      const result = await handleRequest(
        new Request(
          '/nft://1/0x0747118c9f44c7a23365b2476dcd05e03114c747/1/Three%20Shields%20on%20Pink%20Perfect.svg',
          {
            method: 'GET',
          },
        ),
      )
      expect(result.status).toEqual(200)
      const text = await result.text()
      expect(text).toMatchInlineSnapshot(
        `"<svg xmlns=\\"http://www.w3.org/2000/svg\\" xmlns:xlink=\\"http://www.w3.org/1999/xlink\\" viewBox=\\"0 0 220 264\\"><path d=\\"M60 72v75a50 50 0 0 0 50 50 50 50 0 0 0 50-50V72Z\\" fill=\\"#ff007a\\"/><defs><linearGradient gradientUnits=\\"userSpaceOnUse\\" id=\\"h120-a\\" x1=\\"25.46\\" x2=\\"-11.37\\" y1=\\"2.5\\" y2=\\"40.4\\"><stop offset=\\"0\\" stop-color=\\"#fff\\"/><stop offset=\\"1\\" stop-color=\\"#696969\\"/></linearGradient><linearGradient gradientUnits=\\"userSpaceOnUse\\" id=\\"h120-b\\" x1=\\"14.48\\" x2=\\"14.48\\" y1=\\"1.3\\" y2=\\"34.87\\"><stop offset=\\"0\\" stop-color=\\"#595959\\"/><stop offset=\\"0.8\\" stop-color=\\"#fff\\"/><stop offset=\\"0.87\\" stop-color=\\"#c9c9c9\\"/><stop offset=\\"0.96\\" stop-color=\\"#8f8f8f\\"/><stop offset=\\"1\\" stop-color=\\"#787878\\"/></linearGradient><filter id=\\"h120-c\\" name=\\"shadow\\"><feDropShadow dx=\\"0\\" dy=\\"2\\" stdDeviation=\\"0\\"/></filter><symbol id=\\"h120-d\\" viewBox=\\"0 0 28.96 36.2\\"><path d=\\"M29,0V21.72a14.48,14.48,0,1,1-29,0V0Z\\" fill=\\"url(#h120-a)\\"/><polygon fill=\\"#fff\\" points=\\"0 0 2 2 26.96 2 28.96 0 0 0\\"/><path d=\\"M27,2V21.72a12.48,12.48,0,0,1-25,0V2L0,0V21.72a14.48,14.48,0,1,0,29,0V0Z\\" fill=\\"url(#h120-b)\\"/></symbol></defs><g filter=\\"url(#h120-c)\\"><use height=\\"36.2\\" transform=\\"translate(75.46 95.1)\\" width=\\"28.96\\" xlink:href=\\"#h120-d\\"/><use height=\\"36.2\\" transform=\\"translate(115.58 95.1)\\" width=\\"28.96\\" xlink:href=\\"#h120-d\\"/><use height=\\"36.2\\" transform=\\"translate(95.52 140.5)\\" width=\\"28.96\\" xlink:href=\\"#h120-d\\"/></g></svg>"`,
      )
    })
  })

  describe('parseNftSchemeUri', () => {
    it('parses different variants correctly', () => {
      expect(
        parseNftSchemeUri(
          'nft://1/0x2a46f2ffd99e19a89476e2f62270e0a35bbf0756/40913',
        ),
      ).toMatchInlineSnapshot(`
        Object {
          "block": undefined,
          "chainId": 1,
          "contractAddress": "0x2a46f2ffd99e19a89476e2f62270e0a35bbf0756",
          "filename": "",
          "from": undefined,
          "hash": "",
          "href": "nft://1/0x2a46f2ffd99e19a89476e2f62270e0a35bbf0756/40913",
          "search": "",
          "searchParams": URLSearchParams {
            Symbol(query): Array [],
            Symbol(context): "nft://1/0x2a46f2ffd99e19a89476e2f62270e0a35bbf0756/40913",
          },
          "tokenId": "40913",
        }
      `)

      expect(
        parseNftSchemeUri(
          'nft://1.123/0x2a46f2ffd99e19a89476e2f62270e0a35bbf0756/40913/EVERYDAYS%3A%20THE%20FIRST%205000%20DAYS.jpg',
        ),
      ).toMatchInlineSnapshot(`
        Object {
          "block": 123,
          "chainId": 1,
          "contractAddress": "0x2a46f2ffd99e19a89476e2f62270e0a35bbf0756",
          "filename": "EVERYDAYS%3A%20THE%20FIRST%205000%20DAYS.jpg",
          "from": undefined,
          "hash": "",
          "href": "nft://1.123/0x2a46f2ffd99e19a89476e2f62270e0a35bbf0756/40913/EVERYDAYS%3A%20THE%20FIRST%205000%20DAYS.jpg",
          "search": "",
          "searchParams": URLSearchParams {
            Symbol(query): Array [],
            Symbol(context): "nft://1.123/0x2a46f2ffd99e19a89476e2f62270e0a35bbf0756/40913/EVERYDAYS%3A%20THE%20FIRST%205000%20DAYS.jpg",
          },
          "tokenId": "40913",
        }
      `)

      expect(
        parseNftSchemeUri(
          'nft://1.latest/0x2a46f2ffd99e19a89476e2f62270e0a35bbf0756/40913/EVERYDAYS%3A%20THE%20FIRST%205000%20DAYS.jpg',
        ),
      ).toMatchInlineSnapshot(`
        Object {
          "block": "latest",
          "chainId": 1,
          "contractAddress": "0x2a46f2ffd99e19a89476e2f62270e0a35bbf0756",
          "filename": "EVERYDAYS%3A%20THE%20FIRST%205000%20DAYS.jpg",
          "from": undefined,
          "hash": "",
          "href": "nft://1.latest/0x2a46f2ffd99e19a89476e2f62270e0a35bbf0756/40913/EVERYDAYS%3A%20THE%20FIRST%205000%20DAYS.jpg",
          "search": "",
          "searchParams": URLSearchParams {
            Symbol(query): Array [],
            Symbol(context): "nft://1.latest/0x2a46f2ffd99e19a89476e2f62270e0a35bbf0756/40913/EVERYDAYS%3A%20THE%20FIRST%205000%20DAYS.jpg",
          },
          "tokenId": "40913",
        }
      `)

      expect(
        parseNftSchemeUri(
          'nft://1/0x2a46f2ffd99e19a89476e2f62270e0a35bbf0756/40913/',
        ),
      ).toMatchInlineSnapshot(`
        Object {
          "block": undefined,
          "chainId": 1,
          "contractAddress": "0x2a46f2ffd99e19a89476e2f62270e0a35bbf0756",
          "filename": "",
          "from": undefined,
          "hash": "",
          "href": "nft://1/0x2a46f2ffd99e19a89476e2f62270e0a35bbf0756/40913/",
          "search": "",
          "searchParams": URLSearchParams {
            Symbol(query): Array [],
            Symbol(context): "nft://1/0x2a46f2ffd99e19a89476e2f62270e0a35bbf0756/40913/",
          },
          "tokenId": "40913",
        }
      `)

      expect(
        parseNftSchemeUri(
          'nft://1/0x2a46f2ffd99e19a89476e2f62270e0a35bbf0756/40913/EVERYDAYS%3A%20THE%20FIRST%205000%20DAYS.jpg?q=abc#hash',
        ),
      ).toMatchInlineSnapshot(`
        Object {
          "block": undefined,
          "chainId": 1,
          "contractAddress": "0x2a46f2ffd99e19a89476e2f62270e0a35bbf0756",
          "filename": "EVERYDAYS%3A%20THE%20FIRST%205000%20DAYS.jpg",
          "from": undefined,
          "hash": "#hash",
          "href": "nft://1/0x2a46f2ffd99e19a89476e2f62270e0a35bbf0756/40913/EVERYDAYS%3A%20THE%20FIRST%205000%20DAYS.jpg?q=abc#hash",
          "search": "?q=abc",
          "searchParams": URLSearchParams {
            Symbol(query): Array [
              "q",
              "abc",
            ],
            Symbol(context): "nft://1/0x2a46f2ffd99e19a89476e2f62270e0a35bbf0756/40913/EVERYDAYS%3A%20THE%20FIRST%205000%20DAYS.jpg?q=abc#hash",
          },
          "tokenId": "40913",
        }
      `)

      expect(
        parseNftSchemeUri(
          'nft://0xab5801a7d398351b8be11c439e05c5b3259aec9b@1/0x2a46f2ffd99e19a89476e2f62270e0a35bbf0756/40913',
        ),
      ).toMatchInlineSnapshot(`
        Object {
          "block": undefined,
          "chainId": 1,
          "contractAddress": "0x2a46f2ffd99e19a89476e2f62270e0a35bbf0756",
          "filename": "",
          "from": "0xab5801a7d398351b8be11c439e05c5b3259aec9b",
          "hash": "",
          "href": "nft://0xab5801a7d398351b8be11c439e05c5b3259aec9b@1/0x2a46f2ffd99e19a89476e2f62270e0a35bbf0756/40913",
          "search": "",
          "searchParams": URLSearchParams {
            Symbol(query): Array [],
            Symbol(context): "nft://0xab5801a7d398351b8be11c439e05c5b3259aec9b@1/0x2a46f2ffd99e19a89476e2f62270e0a35bbf0756/40913",
          },
          "tokenId": "40913",
        }
      `)
    })
  })

  describe('fetchTokenUri', () => {
    it('should fetch the tokenURI', async () => {
      expect(
        await fetchTokenUri(
          parseNftSchemeUri(
            'nft://1/0x2a46f2ffd99e19a89476e2f62270e0a35bbf0756/40913',
          ),
        ),
      ).toBe('ipfs://ipfs/QmPAg1mjxcEQPPtqsLoEcauVedaeMH81WXDPvPx3VC5zUz')
    })
  })
})
