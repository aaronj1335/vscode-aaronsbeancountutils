# Aaron's [Beancount](https://beancount.github.io) utils for VSCode

Utilities for balancing a Beancount ledger:

![Screencast of plugin capabilities](screencast.gif)

- An outline based on [lines starting with asterisks (i.e. org-mode headers)](https://beancount.github.io/docs/beancount_language_syntax.html#comments) that shows up in [the "Explorer" view](https://code.visualstudio.com/docs/getstarted/userinterface#_outline-view). The outline comes from a [`DocumentSymbolProvider`](https://code.visualstudio.com/api/references/vscode-api#DocumentSymbolProvider), so ["Breadcrumbs"](https://code.visualstudio.com/docs/getstarted/userinterface#_outline-view) work, and ["Go to symbol"](https://code.visualstudio.com/docs/getstarted/userinterface#_outline-view). This makes it easy to jump quickly to, i.e. a specific account/section.

- An action to calculate line and copy result. Given a line like:

        ; 100 * 30

    This will calculate the result using [`decimal.js`](https://www.npmjs.com/package/decimal.js/v/3.0.0), and append that to the line:

        ; 100 * 30 = 3000

    It will also copy the `3000` to the clipboard.

    It is smart enough to ignore the leading comment, re-calculate if the result is already there, and understand postings with prices:

        Assets:Vanguard:VTSAX 100 VTSAX {110 USD} ; = 11000

- An action to open a new tab with the `bean-doctor context` of the current transaction under the cursor.

## Developing

The `src/calculator.js` module is created from the `src/calculator.jison` grammar by the venerable [Jison](https://github.com/zaach/jison):

    npm run compile:calculator

The `calculator.jison` is tweaked from the one in Jison's examples directory.

Otherwise this extension is lifted pretty directly from [the VSCode extension Getting Started doc](https://code.visualstudio.com/api/get-started/your-first-extension).

## Publishing

This is published under the [`aaronj1335`](https://dev.azure.com/aaronj1335) Azure organization. You'll need the [personal access token](https://code.visualstudio.com/api/working-with-extensions/publishing-extension#get-a-personal-access-token).

### Prerequisite: login

    node_modules/.bin/vsce login aaronj1335

### Publishing on updates

    npm version minor # or major/patch/etc
    rm -rf out
    node_modules/.bin/vsce publish
