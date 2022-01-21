# Chainpic

A http gateway for images that are stored or generated on chain, implemented as a Cloudflare worker.

## SVG for on-chain images

SVG is a useful format for generating images on a blockchain as it allows for a compact vector-based representation.
Importantly, it can use external resources, like fonts, other SVG files, or raster images, by referencing them via URL.
So we can store larger image layers off-chain and compose these into an SVG with small file size.

## Viewing on-chain images

Contracts can return the base64 encoded the image as a `data:` URI, like `data:image/svg+xml;base64,PHN2ZyB...`.
To view the image, you can simply paste such a URI into your browser's address bar.

The problem is that browsers restrict SVGs from loading external references if rendered in `<img>` tags.
So while the SVG displays fine when directly opened it will appear broken in OpenSea or any other NFT wallets.

This is where the Chainpic gateway comes into play.
Prepend the address of gateway to the data URI and you get a version of the same SVG that displays flawlessly on any website.

## Example:

Take the following SVG with containing a PNG image:

```xml
<svg width="200" height="200" xmlns="http://www.w3.org/2000/svg">
    <image href="https://gateway.pinata.cloud/ipfs/QmTQrPGDf2xigAK2ptDhdkvSF2EfRMXpaFGJKBNRKYRBHv" height="200" width="200"/>
</svg>
```

If we base64 encode this SVG and open the data URI in the browser the image shows correctly.
Try for yourself, by copy&pasting this URI into your browser address bar:

```
data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KICAgIDxpbWFnZSBocmVmPSJodHRwczovL2dhdGV3YXkucGluYXRhLmNsb3VkL2lwZnMvUW1UUXJQR0RmMnhpZ0FLMnB0RGhka3ZTRjJFZlJNWHBhRkdKS0JOUktZUkJIdiIgaGVpZ2h0PSIyMDAiIHdpZHRoPSIyMDAiLz4KPC9zdmc+
```

However, when trying to present this SVG with an HTML `img` tag, it appears broken:

> https://jsfiddle.net/tg4epksn/0/ 💔

By appending the chainpic gateway host to the data URI we can make it work:

> https://jsfiddle.net/tg4epksn/1/ 🎉

Various thumbnail services have similar restrictions and won't fetch any resources linked in an SVG.
Looking at Github markdown, it [won't even allow embedding images with data URIs](https://github.com/github/markup/issues/270).
When uploading our example SVG to a server, we can use it in markdown files, but Github will generate just an empty thumbnail:

> ![broken SVG img](https://gateway.pinata.cloud/ipfs/QmcPQs7dbrFGnAdfnaTaVoN7BfF5ZDQWK5NwNaBjnVtbZS)

However, by going through the chainpic gateway the SVG thumbnail will be generated correctly:

> ![working SVG img](https://svg.chainpic.workers.dev/data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KICAgIDxpbWFnZSBocmVmPSJodHRwczovL2dhdGV3YXkucGluYXRhLmNsb3VkL2lwZnMvUW1UUXJQR0RmMnhpZ0FLMnB0RGhka3ZTRjJFZlJNWHBhRkdKS0JOUktZUkJIdiIgaGVpZ2h0PSIyMDAiIHdpZHRoPSIyMDAiLz4KPC9zdmc+)

## Limits

Cloudfare URLs have a limit of 16 KB, which means the maximum base64 encodable file size is slightly less than 12 KB.
So the on-chain generated SVG must stay below that limit.
