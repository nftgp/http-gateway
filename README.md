# Chainpic

A http gateway for images that are stored or generated on chain, implemented as a Cloudflare worker.

## SVG for on-chain images

SVG is a useful format for generating images on a blockchain as it allows for a compact vector-based representation.
Importantly, it can use external resources, like fonts, other SVG files, or raster images, by referencing them via URL.
So we can store larger image layers off-chain and compose these into an SVG with small file size.

### Viewing on-chain images

Contracts can return the base64 encoded the image as a `data:` URI, like `data:image/svg+xml;base64,PHN2ZyB...`.
To view the image, you can simply paste such a URI into your browser's address bar.

The problem is that browsers restrict SVGs from loading external references if rendered in `<img>` tags.
So while the SVG displays fine when directly opened it will appear broken in OpenSea or any other NFT wallets.

This is where the Chainpic gateway comes into play.
Prepend the address of gateway to the data URI and you get a version of the same SVG that displays flawlessly on any website.

Example:

TODO
