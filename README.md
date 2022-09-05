# NFT HTTP Gateway

An http gateway using the NFT Gateway Protocol, implemented as a Cloudflare worker.

> https://nftgp.io/

## Viewing on-chain images

Contracts can return the base64 encoded the image as a `data:` URI, like `data:image/svg+xml;base64,PHN2ZyB...`.
To view the image, you can simply paste such a URI into your browser's address bar.

The problem is that browsers restrict SVGs from loading external references if rendered in `<img>` tags.
So while the SVG displays fine when directly opened it will appear broken in OpenSea or any other NFT wallets.

This is where the NFT HTTP gateway comes into play.
Prepend the address of gateway to the data URI and you get a version of the same SVG that displays flawlessly on any website.

## Example:

Take the following SVG with containing a PNG image:

```xml
<svg width="200" height="200" xmlns="http://www.w3.org/2000/svg">
  <image href="https://raw.githubusercontent.com/nftgp/http-gateway/main/test/halo.png" height="200" width="200"/>
</svg>
```

If we base64 encode this SVG and open the data URI in the browser the image shows correctly.
Try for yourself, by copy&pasting this URI into your browser address bar:

```
data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KICA8aW1hZ2UgaHJlZj0iaHR0cHM6Ly9yYXcuZ2l0aHVidXNlcmNvbnRlbnQuY29tL25mdGdwL2h0dHAtZ2F0ZXdheS9tYWluL3Rlc3QvaGFsby5wbmciIGhlaWdodD0iMjAwIiB3aWR0aD0iMjAwIi8+Cjwvc3ZnPg==
```

However, when trying to present this SVG with an HTML `img` tag, it appears broken:

> https://jsfiddle.net/rongb1q2/1/ 💔

By prepending the http gateway host to the data URI we can make it work:

> https://jsfiddle.net/rongb1q2/2/ 🎉

```
https://nftgp.io/data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KICA8aW1hZ2UgaHJlZj0iaHR0cHM6Ly9yYXcuZ2l0aHVidXNlcmNvbnRlbnQuY29tL25mdGdwL2h0dHAtZ2F0ZXdheS9tYWluL3Rlc3QvaGFsby5wbmciIGhlaWdodD0iMjAwIiB3aWR0aD0iMjAwIi8+Cjwvc3ZnPg==
```

Various thumbnail services have similar restrictions and won't fetch any resources linked in an SVG.
Looking at Github markdown, it [won't even allow embedding images with data URIs](https://github.com/github/markup/issues/270).
When uploading our example SVG to a server, we can use it in markdown files, but it will still appear broken:

> ![broken SVG img](https://raw.githubusercontent.com/nftgp/http-gateway/main/test/halo.svg)

However, by going through the NFT http gateway the SVG thumbnail will be generated correctly:

> ![working SVG img](https://nftgp.io/data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KICA8aW1hZ2UgaHJlZj0iaHR0cHM6Ly9yYXcuZ2l0aHVidXNlcmNvbnRlbnQuY29tL25mdGdwL2h0dHAtZ2F0ZXdheS9tYWluL3Rlc3QvaGFsby5wbmciIGhlaWdodD0iMjAwIiB3aWR0aD0iMjAwIi8+Cjwvc3ZnPg==)

## Limits

Cloudflare URLs have a limit of 16 KB, which means the maximum base64 encodeable file size is slightly less than 12 KB when using the data: URI scheme.

Also we currently impose a limit of 2 MB to the file size of inlined resources.
Any resource with a larger file size won't be inlined, but the original URI is left untouched.
