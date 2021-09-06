# Aaron's [Beancount](https://beancount.github.io) utils for VSCode

Utilities for balancing a Beancount ledger:

- Calculate line and copy result: given a line like:

        ; 100 * 30

    This will calculate the result using [`decimal.js`](https://www.npmjs.com/package/decimal.js/v/3.0.0), and append that to the line:

        ; 100 * 30 = 3000

    It will also copy the `3000` to the clipboard.
    
    It is smart enough to ignore the leading comment.