// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import Decimal from "decimal.js";
import { commands, env, ExtensionContext, window } from "vscode";
import calculator = require('./calculator');

const POSTING = /^\s+[\w:]+\s+([0-9.-]+)\s+\w+\s+\{([0-9.-]+)/

function calcAndCopy() {
		const editor = window.activeTextEditor;
		if (editor == null) return;

		const currentLine = editor.document.lineAt(editor.selection.start.line);
		const [result, newLine] = calculate(currentLine.text);

		editor.edit(editBuilder => editBuilder.replace(currentLine.range, newLine));
		env.clipboard.writeText(result.toString());
}

export function calculate(line: string): [Decimal, string] {
	const match = POSTING.exec(line)
	let result: Decimal;
	if (match) {
		const [_, amount, cost, ...rest] = match;
		result = new Decimal(amount).times(cost);
		line += ' ;';
	} else {
		result = calculator.parse(line.replace(/^\s*;/, ''));
	}
	return [result, `${line} = ${result.toString()}`];
}

export function activate(context: ExtensionContext) {
	context.subscriptions
	  .push(commands.registerCommand('aaronsbeancountutils.calc', calcAndCopy));
}

// this method is called when your extension is deactivated
// export function deactivate() { }