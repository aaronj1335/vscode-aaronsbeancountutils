# Aaron's [Beancount](https://beancount.github.io) utils for VSCode

Utilities for balancing a Beancount ledger:

- Calculate line and copy result: given a line like:

        ; 100 * 30

    This will calculate the result using [`decimal.js`](https://www.npmjs.com/package/decimal.js/v/3.0.0), and append that to the line:

        ; 100 * 30 = 3000

    It will also copy the `3000` to the clipboard.
    
    It is smart enough to ignore the leading comment.

## Developing

The `src/calculator.js` module is created from the `src/calculator.jison` grammar by the venerable [Jison](https://github.com/zaach/jison):

    npm run compile:calculator

The `calculator.jison` is tweaked from the one in Jison's examples directory.

Otherwise this extension is lifted pretty directly from [the VSCode extension Getting Started doc](https://code.visualstudio.com/api/get-started/your-first-extension).