import * as assert from 'assert';
import Decimal from 'decimal.js';

// You can import and use all API from the 'vscode' module
// as well as import your extension to test it
import * as vscode from 'vscode';
import {calculate} from '../../extension';

suite('extension', () => {
  vscode.window.showInformationMessage('Start all tests.');

  test('calculate', () => {
    const [result, line] = calculate('0.1 + 0.2');
    assert(result.equals(new Decimal('0.3')));
    assert.strictEqual(line, '0.1 + 0.2 = 0.3');
  });

  test('calculate.withTrailingResult', () => {
    const [result, line] = calculate('0.1 + 0.2 = 0.4');
    assert(result.equals(new Decimal('0.3')));
    assert.strictEqual(line, '0.1 + 0.2 = 0.3');
  });

  test('calculate.withLeadingComment', () => {
    const [result, line] = calculate('; 1 + 2');
    assert(result.equals(new Decimal('3')));
    assert.strictEqual(line, '; 1 + 2 = 3');
  });

  test('calculate.withLeadingCommentAndTrailingResult', () => {
    const [result, line] = calculate('; 1 + 2 = 2');
    assert(result.equals(new Decimal('3')));
    assert.strictEqual(line, '; 1 + 2 = 3');
  });

  test('calculate.amountWithCost', () => {
    const line = '  Assets:Vanguard:IRA 10.673 VFIFXG {127.64 USD}';
    const [result, newLine] = calculate(line);
    assert(result.equals(new Decimal('1362.30172')));
    assert.deepStrictEqual(newLine, `${line} ; = 1362.30172`);
  });
});
