# Change Log (vscode-kanban)

[![Share via Facebook](https://raw.githubusercontent.com/mkloubert/vscode-kanban/master/img/share/Facebook.png)](https://www.facebook.com/sharer/sharer.php?u=https%3A%2F%2Fmarketplace.visualstudio.com%2Fitems%3FitemName%3Dmkloubert.vscode-kanban&quote=VSCode%20Kanban) [![Share via Twitter](https://raw.githubusercontent.com/mkloubert/vscode-kanban/master/img/share/Twitter.png)](https://twitter.com/intent/tweet?source=https%3A%2F%2Fmarketplace.visualstudio.com%2Fitems%3FitemName%3Dmkloubert.vscode-kanban&text=VSCode%20Kanban:%20https%3A%2F%2Fmarketplace.visualstudio.com%2Fitems%3FitemName%3Dmkloubert.vscode-kanban&via=mjkloubert) [![Share via Pinterest](https://raw.githubusercontent.com/mkloubert/vscode-kanban/master/img/share/Pinterest.png)](http://pinterest.com/pin/create/button/?url=https%3A%2F%2Fmarketplace.visualstudio.com%2Fitems%3FitemName%3Dmkloubert.vscode-kanban&description=Visual%20Studio%20Code%20extension%2C%20which%20receives%20and%20shows%20git%20events%20from%20webhooks.) [![Share via Reddit](https://raw.githubusercontent.com/mkloubert/vscode-kanban/master/img/share/Reddit.png)](http://www.reddit.com/submit?url=https%3A%2F%2Fmarketplace.visualstudio.com%2Fitems%3FitemName%3Dmkloubert.vscode-kanban&title=VSCode%20Kanban) [![Share via LinkedIn](https://raw.githubusercontent.com/mkloubert/vscode-kanban/master/img/share/LinkedIn.png)](http://www.linkedin.com/shareArticle?mini=true&url=https%3A%2F%2Fmarketplace.visualstudio.com%2Fitems%3FitemName%3Dmkloubert.vscode-kanban&title=VSCode%20Kanban&summary=Visual%20Studio%20Code%20extension%2C%20which%20receives%20and%20shows%20git%20events%20from%20webhooks.&source=https%3A%2F%2Fmarketplace.visualstudio.com%2Fitems%3FitemName%3Dmkloubert.vscode-kanban) [![Share via Wordpress](https://raw.githubusercontent.com/mkloubert/vscode-kanban/master/img/share/Wordpress.png)](http://wordpress.com/press-this.php?u=https%3A%2F%2Fmarketplace.visualstudio.com%2Fitems%3FitemName%3Dmkloubert.vscode-kanban&quote=VSCode%20Kanban&s=Visual%20Studio%20Code%20extension%2C%20which%20receives%20and%20shows%20git%20events%20from%20webhooks.) [![Share via Email](https://raw.githubusercontent.com/mkloubert/vscode-kanban/master/img/share/Email.png)](mailto:?subject=VSCode%20Kanban&body=Visual%20Studio%20Code%20extension%2C%20which%20receives%20and%20shows%20git%20events%20from%20webhooks.:%20https%3A%2F%2Fmarketplace.visualstudio.com%2Fitems%3FitemName%3Dmkloubert.vscode-kanban)

<span class="badge-paypal"><a href="https://paypal.me/MarcelKloubert" title="Donate to this project using PayPal"><img src="https://img.shields.io/badge/paypal-donate-yellow.svg" alt="PayPal donate button" /></a></span>
<span class="badge-patreon"><a href="https://patreon.com/mkloubert" title="Donate to this project using Patreon"><img src="https://img.shields.io/badge/patreon-donate-yellow.svg" alt="Patreon donate button" /></a></span>
<span class="badge-buymeacoffee"><a href="https://buymeacoffee.com/mkloubert" title="Donate to this project using Buy Me A Coffee"><img src="https://img.shields.io/badge/buy%20me%20a%20coffee-donate-yellow.svg" alt="Buy Me A Coffee donate button" /></a></span>

## 1.34.0 (unreleased; the board is repainted by a design system)

**Breaking.** Two things change for anyone who has customised the board or who
runs an older editor. Both are described in detail in the
[migration section of the README](https://github.com/mkloubert/vscode-kanban#migrating-a-custom-stylesheet-).

* **The surface a custom stylesheet reaches has changed, and is now a contract.**
  The class names the interface used are gone, replaced by the components of
  [Primer](https://primer.style), whose class names are hashed and change
  whenever a component changes. In their place the board declares **style
  anchors** — `[data-vsckb="card"]`, `[data-vsckb-column="done"]` and so on —
  which the project undertakes to keep reaching the same element between
  versions. Write your `vscode-kanban.css` against those.
* **A stylesheet written against version 1.33.1 keeps working.** Thirty-nine of
  the sixty-eight names that version exposed are put back onto the elements they
  used to reach, so old rules go on matching without being edited. The layer is
  transitory and will be removed in a future major version, with notice. What is
  covered and what is not is listed in the migration section.
* **The extension now requires [Visual Studio Code 1.78](https://code.visualstudio.com/updates/v1_78)**,
  up from 1.62. The stylesheets of the design system use the relational selector
  and container queries, which need the Chromium that ships with 1.78. An
  installation between 1.62 and 1.77 stops receiving updates and keeps the
  version it has.

Fixed:

* **Highlighted code was unreadable on a light board.** One fixed dark palette
  was served whatever the board was showing, so a code block on a light theme
  came out dark text on dark ground. Both palettes are served now and the board
  switches to the one in force.
* **The panel declares a Content-Security-Policy.** Nothing may be loaded from
  outside the extension, and nothing at all may be fetched over the network. One
  clause is still loose — `'unsafe-eval'`, which the filter language needs to
  compile an expression; that is
  [issue 7](https://github.com/mkloubert/vscode-kanban/issues) of the internal
  board and goes when the evaluator is replaced.
* **A missing interface bundle says so.** It used to produce a blank panel.

Also:

* A fourth theme state, **high contrast**, joins light, dark and following the
  editor. It is a choice of its own and is never deduced from the theme of the
  editor.
* Every card states its type **in words** as well as in colour, so two cards
  stay distinguishable to someone who cannot tell the colours apart.
* Moving a card is now a menu naming each destination column, in place of a row
  of icons.
* The six libraries that travel inside the repository finally state their
  versions, in [`src/res/VENDORED.md`](https://github.com/mkloubert/vscode-kanban/blob/master/src/res/VENDORED.md).

## 1.33.0 (April 29th, 2022; npm update)

* npm update

## 1.32.0 (November 6th, 2021; npm update)

* extension requires at least [Visual Studio Code 1.62](https://code.visualstudio.com/updates/v1_62) now
* npm update

## 1.31.1 (December 10th, 2020; npm update)

* [🔔🔔🔔 still need help refactoring board's design in webview 🔔🔔🔔](https://github.com/mkloubert/vscode-kanban/issues/54)
* npm update

## 1.30.0 (October 9th, 2020; LAST MAIN VERSION BEFORE REFACTORING)

* this is the last version, before the [🔔🔔🔔 GREAT REFACTORING 🔔🔔🔔](https://github.com/mkloubert/vscode-kanban/issues/53)
* npm update

## 1.29.0 (July 20th, 2020; Visual Studio Code 1.47)

* extension requires at least [Visual Studio Code 1.47](https://code.visualstudio.com/updates/v1_47) now
* add sponsor link to [open collective](https://opencollective.com/vscode-kanban)
* updated the following [npm](https://www.npmjs.com/) modules:
  * [html-entities](https://www.npmjs.com/package/html-entities) `^1.3.1`
  * [humanize-duration](https://www.npmjs.com/package/humanize-duration) `^3.23.1`
  * [lodash](https://www.npmjs.com/package/lodashn) `^4.17.19`

## 1.28.1 (July 3rd, 2020; Visual Studio Code 1.43)

* extension requires at least [Visual Studio Code 1.43](https://code.visualstudio.com/updates/v1_43) now
* [rainbyte](https://github.com/rainbyte) fixed issue when opening links via xdg-open.

## 1.28.0 (April 6th, 2020; Visual Studio Code 1.43)

* extension requires at least [Visual Studio Code 1.43](https://code.visualstudio.com/updates/v1_43) now
* updated the following [npm](https://www.npmjs.com/) modules:
  * [humanize-duration](https://www.npmjs.com/package/humanize-duration) `^3.22.0`
  * [marked](https://www.npmjs.com/package/marked) `^0.8.2`
  * [vscode-helpers](https://www.npmjs.com/package/vscode-helpers) `^7.0.2`

## 1.27.0 (February 20th, 2020; Visual Studio Code 1.42)

* extension requires at least [Visual Studio Code 1.42](https://code.visualstudio.com/updates/v1_42) now
* updated the following [npm](https://www.npmjs.com/) modules:
  * [humanize-duration](https://www.npmjs.com/package/humanize-duration) `^3.21.0`
  * [lodash](https://www.npmjs.com/package/lodash) `^4.17.15`
  * [marked](https://www.npmjs.com/package/markeds) `^0.8.0`
  * [sanitize-filename](https://www.npmjs.com/package/sanitize-filename) `^1.6.3`
  * [vscode-helpers](https://www.npmjs.com/package/vscode-helpers) `^6.0.0`

## 1.26.2 (September 22nd, 2019; Visual Studio Code 1.38)

* extension requires at least [Visual Studio Code 1.38](https://code.visualstudio.com/updates/v1_38) now
* updated the following [npm](https://www.npmjs.com/) modules:
  * [fs-extra](https://www.npmjs.com/package/fs-extra) `^8.1.0`
  * [html-entities](https://www.npmjs.com/package/html-entities) `^1.2.1`
  * [humanize-duration](https://www.npmjs.com/package/humanize-duration) `^3.20.0`
  * [lodash](https://www.npmjs.com/package/lodash) `^4.17.15`
  * [marked](https://www.npmjs.com/package/marked) `^0.7.0`
  * [sanitize-filename](https://www.npmjs.com/package/sanitize-filename) `^1.6.3`
  * [vscode-helpers](https://www.npmjs.com/package/vscode-helpers) `^5.1.1`
* fixes

## 1.25.0 (May 8th, 2019; Visual Studio Code 1.33)

* extension requires at least [Visual Studio Code 1.33](https://code.visualstudio.com/updates/v1_33) now
  * [humanize-duration](https://www.npmjs.com/package/humanize-duration) `^3.18.0`
  * [marked](https://www.npmjs.com/package/marked) `^0.6.2`

## 1.24.0 (February 24th, 2019; Visual Studio Code 1.31)

* extension requires at least [Visual Studio Code 1.31](https://code.visualstudio.com/updates/v1_31) now
* updated the following [npm](https://www.npmjs.com/) modules:
  * [fs-extra](https://www.npmjs.com/package/fs-extra) `^7.0.1`
  * [humanize-duration](https://www.npmjs.com/package/humanize-duration) `^3.17.0`
  * [marked](https://www.npmjs.com/package/marked) `^0.6.1`
  * [vscode-helpers](https://www.npmjs.com/package/vscode-helpers) `^4.0.1`

## 1.23.1 (October 21st, 2018; fixes)

* [Styxxy](https://github.com/Styxxy) fixed [README.md](https://github.com/mkloubert/vscode-kanban/blob/master/README.md)

## 1.23.0 (October 13th, 2018; direct link to Showdown)

* markdown help link directly to the syntax page ... s. [pull request #25](https://github.com/mkloubert/vscode-kanban/pull/25)
* extension requires at least [Visual Studio Code 1.28](https://code.visualstudio.com/updates/v1_28) now
* updated the following [npm](https://www.npmjs.com/) modules:
  * [humanize-duration](https://www.npmjs.com/package/humanize-duration) `^3.15.3`
  * [lodash](https://www.npmjs.com/package/lodash) `^4.17.11`

## 1.22.0 (August 21st, 2018; simple card IDs)

* added `simpleIDs` [setting](https://github.com/mkloubert/vscode-kanban#settings-), which is `(true)` by default and indicates if simple integer values should be used for card IDs or not ... s [issue #17](https://github.com/mkloubert/vscode-kanban/issues/17)
* updated the following [npm](https://www.npmjs.com/) modules:
  * [humanize-duration](https://www.npmjs.com/package/humanize-duration) `^3.15.1`
  * [vscode-helpers](https://www.npmjs.com/package/vscode-helpers) `^2.12.0`

## 1.21.0 (July 4th, 2018; execute script function for cards)

* added `canExecute` [setting](https://github.com/mkloubert/vscode-kanban#settings-), which can be set to `(true)` to execute an `onExecute()` function in a `.vscode/vscode-kanban.js` file:

![Demo 9](https://raw.githubusercontent.com/mkloubert/vscode-kanban/master/img/demo9.gif)

* code cleanups and improvements
* bugfixes

## 1.20.0 (July 4th, 2018; custom columns)

* can define custom column names now ... s. [issue #14](https://github.com/mkloubert/vscode-kanban/issues/14)

## 1.19.0 (July 3rd, 2018; filter functions)

* added `all()` and `any()` [filter functions](https://github.com/mkloubert/vscode-kanban#functions-)
* fixed [README](https://github.com/mkloubert/vscode-kanban/blob/master/README.md)
* code cleanups and improvements
* updated the following [npm](https://www.npmjs.com/) modules:
  * [vscode-helpers](https://www.npmjs.com/package/vscode-helpers) `^2.10.3`

## 1.18.0 (June 30th, 2018; improvements)

* improved speed of [filter feature](https://github.com/mkloubert/vscode-kanban#filter-)
* bugfixes
* code cleanups

## 1.17.4 (June 29th, 2018; markdown and filter help)

* added links for faster access to help pages about [Markdown](https://github.com/showdownjs/showdown/wiki) and [filter](https://github.com/mkloubert/vscode-kanban#filter-) languages
* design improvements
* bugfixes

## 1.16.4 (June 28th, 2018; filter)

* can [filter cards](https://github.com/mkloubert/vscode-kanban#filter-) now (s. [issue #12](https://github.com/mkloubert/vscode-kanban/issues/12)):

![Demo 8](https://raw.githubusercontent.com/mkloubert/vscode-kanban/master/img/demo8.gif)

* disabled `ESC` button for popups, which do add and edit cards ... s. [issue #8](https://github.com/mkloubert/vscode-kanban/issues/8)

## 1.15.1 (June 27th, 2018; chart and diagram support)

* added chart and diagram support, provided by [mermaid](https://github.com/knsv/mermaid) ... s. [Diagrams and charts](https://github.com/mkloubert/vscode-kanban#diagrams-and-charts-)

![Demo 7](https://raw.githubusercontent.com/mkloubert/vscode-kanban/master/img/demo7.gif)

* Markdown editors now using syntax highlighting, provided by [CodeMirror](https://codemirror.net/)

## 1.14.0 (June 27th, 2018; link to other cards)

* can add links to other cards now ... s. [issue #9](https://github.com/mkloubert/vscode-kanban/issues/9)

![Demo 6](https://raw.githubusercontent.com/mkloubert/vscode-kanban/master/img/demo6.gif)

* disabled `ESC` button for popups, which do add and edit cards ... s. [issue #8](https://github.com/mkloubert/vscode-kanban/issues/8)
* design updates
* code cleanups and improvements
* bugfixes
* updated the following [npm](https://www.npmjs.com/) modules:
  * [humanize-duration](https://www.npmjs.com/package/humanize-duration) `^3.15.0`
  * [vscode-helpers](https://www.npmjs.com/package/vscode-helpers) `^2.7.0`

## 1.13.1 (June 12th, 2018; links in Markdown and card exports)

* using links in Markdown is possible now ... s. [issue #7](https://github.com/mkloubert/vscode-kanban/issues/7)
* added `exportOnSave` [setting](https://github.com/mkloubert/vscode-kanban#settings-), which will save cards to external markdown files, if set to `(true)` ... s. [issue #5](https://github.com/mkloubert/vscode-kanban/issues/5)

## 1.12.0 (June 10th, 2018; card details)

* added additional detail area for cards ... s. [issue #5](https://github.com/mkloubert/vscode-kanban/issues/5)

![Demo 5](https://raw.githubusercontent.com/mkloubert/vscode-kanban/master/img/demo5.gif)

* code cleanups and improvements
* bugfixes

## 1.11.2 (June 9th, 2018; user categories)

* can now define user defined categories ... s. [issue #1](https://github.com/mkloubert/vscode-kanban/issues/1)

![Screenshot 2](https://raw.githubusercontent.com/mkloubert/vscode-kanban/master/img/screenshot2.png)

* can define custom [CSS styles](https://github.com/mkloubert/vscode-kanban#css-) for boards now

## 1.10.0 (June 3rd, 2018; time tracking)

* added `noTimeTrackingIfIdle` [setting](https://github.com/mkloubert/vscode-kanban#settings-), which can be set to `(true)` to hide 'track time' button in cards, if they are stored in `Todo` or `Done` column

## 1.9.1 (June 3rd, 2018; time tracking)

* added [track time](https://github.com/mkloubert/vscode-kanban#time-tracking-) feature:

![Demo 3](https://raw.githubusercontent.com/mkloubert/vscode-kanban/master/img/demo3.gif)

with support for [Toggl](https://github.com/mkloubert/vscode-kanban#toggl-):

![Demo 4](https://raw.githubusercontent.com/mkloubert/vscode-kanban/master/img/demo4.gif)

## 1.8.0 (June 1st, 2018; progress bars)

* progress bars are displayed, when using task lists in descriptions:

![Demo 2](https://raw.githubusercontent.com/mkloubert/vscode-kanban/master/img/demo2.gif)

* added reload button and fixed bug when bringing board to foreground, s. [issue #4](https://github.com/mkloubert/vscode-kanban/issues/4):

![Screenshot 1](https://raw.githubusercontent.com/mkloubert/vscode-kanban/master/img/screenshot1.png)

* improved card design

## 1.7.0 (June 1st, 2018; custom card data)

* now can set custom data to `tag` property of cards via [event scripts](https://github.com/mkloubert/vscode-kanban#handle-events-), e.g.

## 1.6.0 (May 31st, 2018; design improvements)

* improved design of cards

![Demo 1](https://raw.githubusercontent.com/mkloubert/vscode-kanban/master/img/demo1.gif)

* bugfixes

## 1.5.1 (May 31st, 2018; markdown support)

* added [Markdown support](https://github.com/mkloubert/vscode-kanban#markdown-support-) for card descriptions
* bugfixes

## 1.4.0 (May 31st, 2018; access modules of extension from scripts)

* added `require()` method to [EventScriptFunctionArguments](https://mkloubert.github.io/vscode-kanban/interfaces/_workspaces_.eventscriptfunctionarguments.html) interface, which can also access the [modules of that extension](https://github.com/mkloubert/vscode-kanban/blob/master/package.json)

## 1.3.0 (May 30th, 2018; creation time and handling events)

* creation time is displayed in the left bottom corner of a card now (only available for new cards), s. [issue #2](https://github.com/mkloubert/vscode-kanban/issues/2)
* can handle events via [scripts](https://github.com/mkloubert/vscode-kanban#handle-events-) now

## 1.2.2 (May 29th, 2018; 'assigned to' and priority)

* added `Assigned To` and `Prio` fields for cards

## 1.1.0 (May 28th, 2018; board title)

* title of board is updated with the name of the underlying workspace after initialization now

## 1.0.1 (May 27th, 2018; initial release)

For more information about the extension, that a look at the [project page](https://github.com/mkloubert/vscode-kanban).
