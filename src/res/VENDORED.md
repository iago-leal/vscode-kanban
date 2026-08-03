# The libraries that travel inside this repository

Six libraries are not installed by the package manager: they are copied into `src/res/js/` and
served to the Webview as globals, because the bundler cannot reach them.

That arrangement was recorded as debt D7 of `_reversa_sdd/architecture.md#9.2`, and the debt was
never the copying. It was that **not one of them stated a version**, so nobody could say whether a
published vulnerability applied to the copy in this repository or to some other build of the same
name. This file is what closes that: it names each one, states the version where the distributed
file states it, and fingerprints every file either way (action T047, D-29, RF-22).

The fingerprint is the point of last resort. A version can be wrong -- copied by hand, or edited
after the fact -- and the fingerprint cannot: it identifies the exact bytes being served. Check one
with `shasum -a 256 src/res/js/<file>`.

> Four libraries left the repository with feature `001`: jQuery, Bootstrap, Font Awesome and
> `board.js`. What follows is what survived, each of them behind an adapter in
> `src/webview/adapters/`, which is what makes replacing one a change to a single file.

## Inventory

| Library | Version | Where the version comes from | File | Bytes |
|---|---|---|---|---|
| Mermaid | **7.0.0** | Its own `package.json`, embedded in the bundle at module 108 | `js/mermaid/mermaid.js` | 2.097.804 |
| Mermaid (API) | **7.0.0** | Same build, second entry point | `js/mermaid/mermaidAPI.js` | 2.005.389 |
| CodeMirror | **5.39.0** | `version = "5.39.0"` in the distributed file | `js/codemirror/codemirror.js` | 374.160 |
| Moment | **2.22.1** | `version="2.22.1"` in the distributed file | `js/moment-with-locales.min.js` | 326.584 |
| highlight.js | **9.12.0** | `v9.12.0` in the banner comment | `js/highlight.pack.js` | 527.241 |
| Showdown | **1.8.6** | `1.8.6` in the distributed file | `js/showdown.min.js` | 99.094 |
| Filtrex | **not stated** | The file carries no version anywhere. See below | `js/filtrex.js` | 134.220 |

### Fingerprints, SHA-256

```
6a869cbce094a63092c0e2cdbaa639a1c6e804cbfffb2822f76faa6d955b7c37  js/filtrex.js
fe763dd39daba8353f4c11668d92ce5da52f34b080220da52678f2ae33f17580  js/showdown.min.js
38a492526df03899d28bae6bf2356dfe33209d0e9443808b9dd07aa75a57983c  js/highlight.pack.js
672916df45010975a43c6b15c953dd26552b71ef7f3dac206021338a7038a675  js/moment-with-locales.min.js
2f1fe25a083dd1e1c6716089e6c9a8a3318c3048104d06fde451bdd09f1a86e5  js/codemirror/codemirror.js
0989022cc12338bbbb78edbbc1fbe74ad0fea3c725dfd878d0edd4086932a035  js/mermaid/mermaid.js
03a247519d7e7429f1af4d8271283ec5c1c4dc6929e90d687e754b9894504f79  js/mermaid/mermaidAPI.js
```

## Filtrex, and why it has no number

The banner of `js/filtrex.js` names the author, the licence and the repository, and stops there. It
is the single-file build of [joewalnes/filtrex](https://github.com/joewalnes/filtrex) with Jison
compiled into it, from a period when that project published no version in the artefact at all. There
is nothing in the file to read, so nothing is claimed: the fingerprint above is its identity.

This matters more than the others, and not because of its size. `js/filtrex.js:57` compiles the
filter expression of the user with `new Function`, which is why the Content-Security-Policy declared
in `src/html.ts` still carries `'unsafe-eval'`. Card `[7]` of the board of this project is the work
that replaces the evaluator; the day it lands, that clause goes, and this entry probably goes with
it.

## What this file does not do

It does not audit any of them. Six libraries frozen between 2017 and 2018 are six libraries that
have not received a security fix in years, and knowing which version each one is only makes the
question answerable -- it does not answer it. Card `[15]` of the board of the project is where the
answering belongs.

Nor does it pin them. Nothing verifies these fingerprints at build time yet, so a file replaced by
hand would go unnoticed until someone read this page. Adding that check is cheap and is not part of
this feature.

## Keeping this current

Replacing any file above means editing the row and the fingerprint in the same commit. The
fingerprints were taken on 2026-08-03; regenerate the whole block with:

```sh
cd src/res && shasum -a 256 js/filtrex.js js/showdown.min.js js/highlight.pack.js \
    js/moment-with-locales.min.js js/codemirror/codemirror.js \
    js/mermaid/mermaid.js js/mermaid/mermaidAPI.js
```
