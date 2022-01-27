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
          '/nft://1.latest/0x2a46f2ffd99e19a89476e2f62270e0a35bbf0756/40913/EVERYDAYS%3A%20THE%20FIRST%205000%20DAYS.jpg',
          {
            method: 'GET',
          },
        ),
      )
      console.log(result.statusText)
      expect(result.status).toEqual(200)
      const text = await result.text()
      expect(text).toBe('Hello world!')
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
